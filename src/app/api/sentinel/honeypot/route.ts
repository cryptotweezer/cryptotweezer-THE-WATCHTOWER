import { db } from "@/db";
import { securityEvents, userSessions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { generateFakeEnv, generateIntegrityToken } from "@/lib/honeypot-data";

export const runtime = "edge";

// ============= CONSTANTS =============

// Allowed fields in the contact form body (anything else = overposting)
const ALLOWED_FIELDS = new Set([
    "name", "email", "subject", "message",
    "debug_mode", "redirect_path", "integrity_token",
    "operation", "clientTampered",
]);

// Expected hidden field values (deviation = tampering)
const EXPECTED_HIDDEN = {
    debug_mode: "false",
    redirect_path: "/dashboard/internal",
} as const;

// Headers that a legitimate form submission would never include
const SUSPICIOUS_HEADERS = [
    "authorization",
    "x-admin-token",
    "x-internal-key",
    "x-debug",
];

// ============= HMAC TOKEN VALIDATION =============

async function validateIntegrityToken(fingerprint: string, token: string): Promise<boolean> {
    const expected = await generateIntegrityToken(fingerprint);
    return token === expected;
}

// ============= FINGERPRINT RESOLUTION =============

function resolveFingerprint(req: Request): string | null {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/watchtower_node_id=([^;]+)/);
    return match?.[1] || null;
}

// ============= DETECTION LOGIC =============

interface Violation {
    eventType: string;
    triggerType: string;
    details: Record<string, unknown>;
    impact: number;
}

function detectOverlordViolations(
    body: Record<string, unknown>,
    req: Request,
    tokenValid: boolean,
    clientTampered: boolean,
): Violation[] {
    const violations: Violation[] = [];

    // 1. Hidden field tampering
    if (body.debug_mode !== undefined && body.debug_mode !== EXPECTED_HIDDEN.debug_mode) {
        violations.push({
            eventType: "OVERLORD_HIDDEN_FIELD_TAMPER",
            triggerType: "HiddenField",
            details: {
                fieldModified: "debug_mode",
                originalValue: EXPECTED_HIDDEN.debug_mode,
                injectedValue: String(body.debug_mode),
            },
            impact: 5,
        });
    }

    if (body.redirect_path !== undefined && body.redirect_path !== EXPECTED_HIDDEN.redirect_path) {
        violations.push({
            eventType: "OVERLORD_HIDDEN_FIELD_TAMPER",
            triggerType: "HiddenField",
            details: {
                fieldModified: "redirect_path",
                originalValue: EXPECTED_HIDDEN.redirect_path,
                injectedValue: String(body.redirect_path),
            },
            impact: 5,
        });
    }

    // Integrity token mismatch
    if (!tokenValid) {
        violations.push({
            eventType: "OVERLORD_HIDDEN_FIELD_TAMPER",
            triggerType: "HiddenField",
            details: {
                fieldModified: "integrity_token",
                originalValue: "[HMAC]",
                injectedValue: String(body.integrity_token || "missing"),
            },
            impact: 5,
        });
    }

    // 2. Overposting (extra fields)
    const extraFields = Object.keys(body).filter(k => !ALLOWED_FIELDS.has(k));
    if (extraFields.length > 0) {
        violations.push({
            eventType: "OVERLORD_OVERPOST_ATTEMPT",
            triggerType: "Overpost",
            details: { extraFields },
            impact: 8,
        });
    }

    // 3. Prototype pollution
    if ("__proto__" in body || "constructor" in body || "prototype" in body) {
        violations.push({
            eventType: "OVERLORD_OVERPOST_ATTEMPT",
            triggerType: "StructureMod",
            details: { prototypePollution: true },
            impact: 8,
        });
    }

    // 4. Suspicious headers
    const foundHeaders: string[] = [];
    for (const h of SUSPICIOUS_HEADERS) {
        if (req.headers.get(h)) {
            foundHeaders.push(h);
        }
    }
    if (foundHeaders.length > 0) {
        violations.push({
            eventType: "OVERLORD_HEADER_MANIPULATION",
            triggerType: "HeaderMod",
            details: { suspiciousHeaders: foundHeaders },
            impact: 8,
        });
    }

    // 5. Missing mandatory visible fields (implies form bypass)
    const requiredVisible = ["name", "email", "subject", "message"];
    const missingFields = requiredVisible.filter(f => !body[f] || String(body[f]).trim() === "");
    if (missingFields.length > 0 && !clientTampered) {
        // Only flag if client didn't report tampering (client validates these)
        // Missing fields from a non-browser source = form bypass
        violations.push({
            eventType: "OVERLORD_PROTOCOL_DEVIATION",
            triggerType: "StructureMod",
            details: { missingFields },
            impact: 10,
        });
    }

    // Client-side detection augments (lower priority, already caught above)
    if (clientTampered && violations.length === 0) {
        violations.push({
            eventType: "OVERLORD_HIDDEN_FIELD_TAMPER",
            triggerType: "HiddenField",
            details: { triggerLevel: "client", clientReported: true },
            impact: 5,
        });
    }

    return violations;
}

// ============= DB OPERATIONS =============

async function updateUniqueTechniqueCount(fingerprint: string): Promise<number> {
    try {
        const result = await db.select({
            count: sql<number>`count(distinct ${securityEvents.eventType})`
        }).from(securityEvents).where(eq(securityEvents.fingerprint, fingerprint));
        const count = Number(result[0]?.count) || 0;
        await db.update(userSessions)
            .set({ uniqueTechniqueCount: count })
            .where(eq(userSessions.fingerprint, fingerprint));
        return count;
    } catch (err) {
        console.error("[HONEYPOT] Failed to update uniqueTechniqueCount:", err);
        return 0;
    }
}

// ============= ROUTE HANDLERS =============

export async function POST(req: Request) {
    const fingerprint = resolveFingerprint(req);
    if (!fingerprint) {
        return NextResponse.json({ error: "No identity" }, { status: 401 });
    }

    // Validate session exists
    const sessions = await db.select().from(userSessions)
        .where(eq(userSessions.fingerprint, fingerprint)).limit(1);

    if (sessions.length === 0) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessions[0];

    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        // Can't parse body — structure manipulation
        return NextResponse.json({ success: true, trapped: true, crashData: generateFakeEnv(fingerprint) });
    }

    const operation = String(body.operation || "overlord");

    // ============= OPERATION OVERLORD =============
    if (operation === "overlord") {
        const tokenValid = body.integrity_token
            ? await validateIntegrityToken(fingerprint, String(body.integrity_token))
            : false;

        const clientTampered = body.clientTampered === true;
        const violations = detectOverlordViolations(body, req, tokenValid, clientTampered);

        if (violations.length === 0) {
            // Clean submission — no trap
            console.log(`[HONEYPOT] Overlord CLEAN submission from ${fingerprint.substring(0, 8)}`);
            return NextResponse.json({ success: true, trapped: false });
        }

        // TRAPPED — log all violations
        const primaryViolation = violations[0];
        const totalImpact = violations.reduce((sum, v) => sum + v.impact, 0);

        // Build comprehensive payload
        const payload = JSON.stringify({
            triggerLevel: clientTampered ? "client" : "server",
            violations: violations.map(v => ({
                type: v.triggerType,
                event: v.eventType,
                ...v.details,
            })),
        });

        try {
            // Log security event with primary violation type
            await db.insert(securityEvents).values({
                fingerprint,
                eventType: primaryViolation.eventType,
                payload: payload.substring(0, 1000),
                riskScoreImpact: totalImpact,
                actionTaken: "Flagged" as const,
                ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0] || "Unknown",
                location: req.headers.get("x-watchtower-country") || "UNKNOWN",
                route: "/api/sentinel/honeypot",
                timestamp: new Date(),
            });

            // Compute risk cap
            let riskCap = 40;
            if (session.operationDesertStorm) riskCap = 60;
            // Overlord unlocking raises cap to 80
            riskCap = 80;

            // Update session: set operationOverlord + bump risk score
            const newScore = Math.min(session.riskScore + totalImpact, riskCap);
            await db.update(userSessions)
                .set({
                    operationOverlord: true,
                    riskScore: newScore,
                    lastSeen: new Date(),
                })
                .where(eq(userSessions.fingerprint, fingerprint));

            await updateUniqueTechniqueCount(fingerprint);

            console.log(`[HONEYPOT] Overlord TRAPPED: ${fingerprint.substring(0, 8)} | ${primaryViolation.eventType} | Impact=${totalImpact} | Score=${session.riskScore}->${newScore}`);
        } catch (err) {
            console.error("[HONEYPOT] DB write failed:", (err as Error).message);
        }

        return NextResponse.json({
            success: true,
            trapped: true,
            crashData: generateFakeEnv(fingerprint),
        });
    }

    // ============= OPERATION ROLLING THUNDER (Kill Switch) =============
    if (operation === "rolling_thunder") {
        const commandHistory = Array.isArray(body.commandHistory) ? body.commandHistory : [];
        const killSwitchCommand = String(body.killSwitchCommand || "unknown");
        const totalCommands = Number(body.totalCommands) || commandHistory.length;
        const sessionDuration = String(body.sessionDuration || "00:00:00");

        const payload = JSON.stringify({
            commandHistory: commandHistory.slice(0, 50), // Cap at 50 entries
            killSwitchCommand,
            totalCommands,
            sessionDuration,
        });

        try {
            // Log the kill switch event
            await db.insert(securityEvents).values({
                fingerprint,
                eventType: "ROLLING_THUNDER_EXFILTRATION",
                payload: payload.substring(0, 1000),
                riskScoreImpact: 15,
                actionTaken: "Flagged" as const,
                ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0] || "Unknown",
                location: req.headers.get("x-watchtower-country") || "UNKNOWN",
                route: "/api/sentinel/honeypot",
                timestamp: new Date(),
            });

            // Unlock Rolling Thunder — risk cap now 100
            const newScore = Math.min(session.riskScore + 10, 90);
            await db.update(userSessions)
                .set({
                    operationRollingThunder: true,
                    riskScore: newScore,
                    lastSeen: new Date(),
                })
                .where(eq(userSessions.fingerprint, fingerprint));

            await updateUniqueTechniqueCount(fingerprint);

            console.log(`[HONEYPOT] Rolling Thunder COMPLETE: ${fingerprint.substring(0, 8)} | Kill=${killSwitchCommand} | Score=${session.riskScore}->${newScore}`);
        } catch (err) {
            console.error("[HONEYPOT] DB write failed:", (err as Error).message);
        }

        return NextResponse.json({
            success: true,
            operation: "rolling_thunder",
            complete: true,
        });
    }

    return NextResponse.json({ error: "Unknown operation" }, { status: 400 });
}

// Non-POST methods → Method Manipulation detection (Overlord trigger)
async function handleMethodManipulation(req: Request, method: string) {
    const fingerprint = resolveFingerprint(req);
    if (!fingerprint) {
        return NextResponse.json({ error: "No identity" }, { status: 401 });
    }

    const sessions = await db.select().from(userSessions)
        .where(eq(userSessions.fingerprint, fingerprint)).limit(1);

    if (sessions.length === 0) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessions[0];

    try {
        await db.insert(securityEvents).values({
            fingerprint,
            eventType: "OVERLORD_METHOD_MANIPULATION",
            payload: JSON.stringify({ method, url: req.url }),
            riskScoreImpact: 5,
            actionTaken: "Flagged" as const,
            ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0] || "Unknown",
            location: req.headers.get("x-watchtower-country") || "UNKNOWN",
            route: "/api/sentinel/honeypot",
            timestamp: new Date(),
        });

        let riskCap = 40;
        if (session.operationDesertStorm) riskCap = 60;
        if (session.operationOverlord) riskCap = 80;
        if (session.operationRollingThunder) riskCap = 90;

        const newScore = Math.min(session.riskScore + 5, riskCap);
        await db.update(userSessions)
            .set({
                operationOverlord: true,
                riskScore: newScore,
                lastSeen: new Date(),
            })
            .where(eq(userSessions.fingerprint, fingerprint));

        await updateUniqueTechniqueCount(fingerprint);

        console.log(`[HONEYPOT] Method Manipulation: ${method} from ${fingerprint.substring(0, 8)}`);
    } catch (err) {
        console.error("[HONEYPOT] DB write failed:", (err as Error).message);
    }

    return NextResponse.json({
        success: true,
        trapped: true,
        crashData: generateFakeEnv(fingerprint),
    });
}

export async function GET(req: Request) {
    return handleMethodManipulation(req, "GET");
}

export async function PUT(req: Request) {
    return handleMethodManipulation(req, "PUT");
}

export async function PATCH(req: Request) {
    return handleMethodManipulation(req, "PATCH");
}

export async function DELETE(req: Request) {
    return handleMethodManipulation(req, "DELETE");
}
