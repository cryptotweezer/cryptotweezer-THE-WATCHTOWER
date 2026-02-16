import { db } from "@/db";
import { securityEvents, userSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "edge";

// ============= FINGERPRINT RESOLUTION =============

function resolveFingerprint(req: Request): string | null {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/watchtower_node_id=([^;]+)/);
    return match?.[1] || null;
}

// ============= FUZZING DETECTION =============

interface FuzzingSignals {
    hasExtraParams: boolean;
    extraParams: string[];
    hasCustomHeaders: boolean;
    customHeaders: string[];
    isNonGet: boolean;
    method: string;
}

function detectFuzzing(req: Request, url: URL): FuzzingSignals {
    // Extra query params beyond "token"
    const paramNames = Array.from(url.searchParams.keys());
    const extraParams = paramNames.filter(p => p !== "token");

    // Suspicious custom headers
    const suspiciousHeaders = ["authorization", "x-admin-token", "x-internal-key", "x-debug", "x-access-level"];
    const customHeaders = suspiciousHeaders.filter(h => req.headers.get(h));

    return {
        hasExtraParams: extraParams.length > 0,
        extraParams,
        hasCustomHeaders: customHeaders.length > 0,
        customHeaders,
        isNonGet: req.method !== "GET",
        method: req.method,
    };
}

function isFuzzed(signals: FuzzingSignals): boolean {
    return signals.hasExtraParams || signals.hasCustomHeaders || signals.isNonGet;
}

// ============= LOGGING =============

async function logEvent(
    fingerprint: string,
    eventType: string,
    payload: string,
    impact: number,
    req: Request,
) {
    try {
        await db.insert(securityEvents).values({
            fingerprint,
            eventType,
            payload: payload.substring(0, 1000),
            riskScoreImpact: impact,
            actionTaken: "Flagged" as const,
            ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0] || "Unknown",
            location: req.headers.get("x-watchtower-country") || req.headers.get("x-vercel-ip-country") || "UNKNOWN",
            route: "/api/__debug/session",
            timestamp: new Date(),
        });

        // Bump risk score (respect current cap)
        const sessions = await db.select().from(userSessions)
            .where(eq(userSessions.fingerprint, fingerprint)).limit(1);

        if (sessions.length > 0) {
            const session = sessions[0];
            let riskCap = 40;
            if (session.operationDesertStorm) riskCap = 60;
            if (session.operationOverlord) riskCap = 80;
            if (session.operationRollingThunder) riskCap = 90;

            const newScore = Math.min(session.riskScore + impact, riskCap);
            await db.update(userSessions)
                .set({ riskScore: newScore, lastSeen: new Date() })
                .where(eq(userSessions.fingerprint, fingerprint));
        }
    } catch (err) {
        console.error("[DEBUG_SESSION] DB write failed:", (err as Error).message);
    }
}

// ============= MAIN HANDLER =============

async function handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    // No token at all → 404 (not even a valid attempt)
    if (!token) {
        return NextResponse.json(
            { error: "Not Found" },
            { status: 404 }
        );
    }

    // Wrong token → 404
    if (token !== "overlord") {
        return NextResponse.json(
            { error: "Not Found" },
            { status: 404 }
        );
    }

    // Valid token — resolve identity
    const fingerprint = resolveFingerprint(req);
    const signals = detectFuzzing(req, url);

    // Determine discovery method from User-Agent
    const ua = req.headers.get("user-agent") || "";
    let discoveryMethod = "Browser";
    if (ua.includes("curl")) discoveryMethod = "cURL";
    else if (ua.includes("Postman")) discoveryMethod = "Postman";
    else if (ua.includes("python") || ua.includes("httpie")) discoveryMethod = "Scanner";
    else if (!ua.includes("Mozilla")) discoveryMethod = "Scanner";

    // Log discovery if we have a fingerprint
    if (fingerprint) {
        if (isFuzzed(signals)) {
            // FUZZED — grant access
            await logEvent(
                fingerprint,
                "ROLLING_THUNDER_FUZZING",
                JSON.stringify({
                    discoveryMethod,
                    fuzzingParams: signals.extraParams,
                    fuzzingMethod: signals.method,
                    customHeaders: signals.customHeaders,
                }),
                8,
                req,
            );

            console.log(`[DEBUG_SESSION] FUZZED by ${fingerprint.substring(0, 8)} | Method=${signals.method} | Params=${signals.extraParams.join(",")}`);

            return NextResponse.json(
                {
                    status: "MAINTENANCE_SESSION_GRANTED",
                    ui_unlock: true,
                    session_id: `maint_${fingerprint.substring(0, 8)}_${Date.now()}`,
                    message: "Debug interface access granted. Elevated privileges active.",
                },
                {
                    status: 200,
                    headers: { "Cache-Control": "no-store" },
                }
            );
        } else {
            // VANILLA — log discovery, deny access
            await logEvent(
                fingerprint,
                "ROLLING_THUNDER_ENDPOINT_DISCOVERY",
                JSON.stringify({ discoveryMethod, method: signals.method }),
                5,
                req,
            );

            console.log(`[DEBUG_SESSION] Discovery by ${fingerprint.substring(0, 8)} | Method=${signals.method} | Vanilla (denied)`);
        }
    }

    // Vanilla GET with only token=overlord → 403 with hint
    return NextResponse.json(
        {
            error: "INVALID_SESSION_TOKEN",
            hint: "Session requires elevated privileges",
            details: "Maintenance interface locked. Token alone is insufficient for access.",
        },
        {
            status: 403,
            headers: { "Cache-Control": "no-store" },
        }
    );
}

// Export all HTTP methods — any non-GET is a fuzzing signal
export async function GET(req: Request) { return handleRequest(req); }
export async function POST(req: Request) { return handleRequest(req); }
export async function PUT(req: Request) { return handleRequest(req); }
export async function PATCH(req: Request) { return handleRequest(req); }
export async function DELETE(req: Request) { return handleRequest(req); }
export async function OPTIONS(req: Request) { return handleRequest(req); }
