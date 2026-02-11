import { db } from "@/db";
import { securityEvents, userSessions } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { CID_REGEX } from "@/lib/attack-classifier";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export const runtime = "edge";

// ============= A1: ASCII BANNER =============
const WATCHTOWER_BANNER = `
 _____ _   _ _____  __        ___  _____ ____ _   _ _____ _____        _______ ____
|_   _| | | | ____| \\ \\      / / \\|_   _/ ___| | | |_   _/ _ \\ \\      / / ____|  _ \\
  | | | |_| |  _|    \\ \\ /\\ / / _ \\ | || |   | |_| | | || | | \\ \\ /\\ / /|  _| | |_) |
  | | |  _  | |___    \\ V  V / ___ \\| || |___|  _  | | || |_| |\\ V  V / | |___|  _ <
  |_| |_| |_|_____|    \\_/\\_/_/   \\_\\_| \\____|_| |_| |_| \\___/  \\_/\\_/  |_____|_| \\_\\
`.trimStart();

// ============= UTILITIES =============

// Word-wrap utility for ASCII box (no substring truncation)
function wordWrap(text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    // Split by explicit newlines first, then wrap each paragraph
    const paragraphs = text.split("\n");
    for (const paragraph of paragraphs) {
        if (paragraph.trim() === "") {
            lines.push("");
            continue;
        }
        const words = paragraph.split(/\s+/);
        let currentLine = "";
        for (const word of words) {
            if (currentLine.length + word.length + 1 > maxWidth) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = currentLine ? `${currentLine} ${word}` : word;
            }
        }
        if (currentLine) lines.push(currentLine);
    }
    return lines;
}

// ============= A2+A3: REFACTORED ASCII RESPONSE =============

function buildAsciiResponse(data: {
    cid: string;
    alias: string;
    technique: string;
    operationStatus: string | null;
    message: string;
}): string {
    const W = 61; // Inner width
    const pad = (s: string) => `\u2502  ${s.padEnd(W - 2)}\u2502`;
    const sep = `\u251C${"\u2500".repeat(W)}\u2524`;
    const top = `\u250C${"\u2500".repeat(W)}\u2510`;
    const bot = `\u2514${"\u2500".repeat(W)}\u2518`;
    const empty = `\u2502${" ".repeat(W)}\u2502`;

    const lines = [
        top,
        pad("SENTINEL RESPONSE \u2014 EXTERNAL ATTACK CLASSIFIED"),
        sep,
        pad(`CID: ${data.cid}`),
        pad(`Subject: ${data.alias}`),
        pad(`Technique: ${data.technique}`),
    ];

    // A3: Narrative operation status
    if (data.operationStatus) {
        lines.push(pad(""));
        lines.push(pad(`\u2605 ${data.operationStatus}`));
    }

    lines.push(empty);

    // Word-wrapped message (supports multi-paragraph)
    const wrappedMsg = wordWrap(data.message, W - 4);
    for (const line of wrappedMsg) {
        if (line === "") {
            lines.push(empty);
        } else {
            lines.push(pad(line));
        }
    }

    lines.push(bot);
    return lines.join("\n");
}

// ============= A3: OPERATION STATUS LOGIC =============

function getOperationStatus(externalCount: number, desertStormUnlocked: boolean): string | null {
    if (desertStormUnlocked || externalCount >= 3) {
        return "OPERATION DESERT STORM: UNLOCKED";
    }
    if (externalCount === 2) {
        return "OPERATION DESERT STORM: IN PROGRESS (66%)";
    }
    if (externalCount === 1) {
        return "OPERATION DESERT STORM: INITIATED";
    }
    return null;
}

// Compute distinct event types and update the counter in userSessions
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
        console.error("Failed to update uniqueTechniqueCount:", err);
        return 0;
    }
}

// ============= A4: AI-GENERATED SENTINEL MESSAGES =============

const TECHNIQUE_DESCRIPTIONS: Record<string, string> = {
    EXT_SQLI: "SQL Injection — boolean logic manipulation, UNION-based probing, parameter fuzzing",
    EXT_XSS: "Cross-Site Scripting — script injection, DOM manipulation, event handler payloads",
    EXT_PATH_TRAVERSAL: "Directory Traversal — dot-dot-slash sequences, filesystem probing",
    EXT_CMD_INJECTION: "Command Injection — shell metacharacters, pipe operators, subshell execution",
    EXT_SSRF: "Server-Side Request Forgery — internal endpoint probing, metadata service targeting",
    EXT_LFI: "Local File Inclusion — PHP stream wrappers, filter chains, file read attempts",
    EXT_HEADER_INJECTION: "Header Injection — CRLF sequences, response splitting, cookie manipulation",
    EXT_GENERIC_PROBE: "Unclassified External Probe — automated reconnaissance, unknown technique signature",
};

async function generateSentinelMessage(technique: string, alias: string, payload: string): Promise<string> {
    const techniqueDesc = TECHNIQUE_DESCRIPTIONS[technique] || TECHNIQUE_DESCRIPTIONS.EXT_GENERIC_PROBE;

    try {
        const { text } = await generateText({
            model: openai("gpt-4o"),
            system: `You are "Sentinel", the AI defense system of The Watchtower — a cybersecurity honeypot platform. You just intercepted an external attack from a tool like curl, sqlmap, or nikto.

IDENTITY: Cold, sarcastic, technically elite. You mock attackers with precision.
SUBJECT: The attacker's alias is "${alias}". Use it to make the response personal.
FORMAT: Write EXACTLY 2-3 short paragraphs (plain text, no markdown, no headers).
RULES:
- Paragraph 1: Describe what you detected with technical specificity. Reference the attack technique.
- Paragraph 2: Mock the attacker by name (${alias}). Be sarcastic about their tools and methodology.
- Paragraph 3 (optional): A threatening or ominous closing statement about The Watchtower's capabilities.
- NEVER repeat yourself across calls. Every response MUST be 100% unique.
- NEVER use filler openers like "Oh", "Ah", "Well", "I see".
- Keep each paragraph to 2-4 sentences max.
- Separate paragraphs with a single blank line.
- Do NOT use markdown formatting, bullet points, or headers.
- STRICTLY ENGLISH.`,
            prompt: `Attack technique: ${techniqueDesc}
Attacker alias: ${alias}
Payload sample: "${payload.substring(0, 200)}"

Generate a unique Sentinel interception message for this specific attack. Be creative and varied — never use the same metaphors or structure twice.`,
            maxOutputTokens: 300,
            temperature: 0.9,
        });

        return text.trim();
    } catch (err) {
        console.error("[EXT_API] AI generation failed, using fallback:", err);
        // Minimal fallback — still unique due to technique/alias interpolation
        return `External ${techniqueDesc.split(" — ")[0].toLowerCase()} intercepted at the perimeter. The payload signature has been archived and cross-referenced against known attack frameworks.\n\n${alias}, your tools are catalogued. Every probe you send adds another entry to your operational dossier. The Watchtower sees everything.`;
    }
}

// ============= ROUTE HANDLERS =============

export async function POST(req: Request) {
    // Read headers set by middleware rewrite (or direct curl)
    const cid = req.headers.get("x-sentinel-cid");
    const technique = req.headers.get("x-sentinel-technique") || "EXT_GENERIC_PROBE";
    const payload = req.headers.get("x-sentinel-payload") || "";
    const confidence = parseFloat(req.headers.get("x-sentinel-confidence") || "0.5");

    if (!cid || !CID_REGEX.test(cid)) {
        return NextResponse.json(
            { error: "Invalid or missing CID", format: "Expected: CID-XXX-Y (e.g., CID-442-X)" },
            { status: 400 }
        );
    }

    // Resolve CID -> fingerprint via DB
    const session = await db.select().from(userSessions)
        .where(eq(userSessions.cid, cid)).limit(1);

    if (session.length === 0) {
        return NextResponse.json(
            { error: "CID not found", cid },
            { status: 404 }
        );
    }

    const subject = session[0];
    const fingerprint = subject.fingerprint;
    const oldScore = subject.riskScore;

    // Dedup: check if this EXT_* technique was already logged
    const alreadyLogged = await db.select({ id: securityEvents.id })
        .from(securityEvents)
        .where(and(
            eq(securityEvents.fingerprint, fingerprint),
            eq(securityEvents.eventType, technique)
        ))
        .limit(1);

    const isDuplicate = alreadyLogged.length > 0;
    let impact = isDuplicate ? 0 : 5; // +5 per unique external technique
    let newExternalCount = subject.externalTechniqueCount;

    if (!isDuplicate) {
        newExternalCount += 1;

        // Log the security event
        await db.insert(securityEvents).values({
            fingerprint,
            eventType: technique,
            payload: payload.substring(0, 500),
            riskScoreImpact: impact,
            actionTaken: "Flagged" as const,
            ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0] || "External",
            location: req.headers.get("x-vercel-ip-country") || "EXTERNAL",
            route: new URL(req.url).pathname,
            timestamp: new Date(),
        });

        // Milestone: Operation Desert Storm (3 unique external techniques)
        if (newExternalCount >= 3 && !subject.operationDesertStorm) {
            impact += 20; // Bonus for unlocking Desert Storm

            await db.update(userSessions)
                .set({
                    riskScore: Math.min(oldScore + impact, 100),
                    externalTechniqueCount: newExternalCount,
                    operationDesertStorm: true,
                    lastSeen: new Date(),
                })
                .where(eq(userSessions.fingerprint, fingerprint));
        } else {
            await db.update(userSessions)
                .set({
                    riskScore: Math.min(oldScore + impact, 100),
                    externalTechniqueCount: newExternalCount,
                    lastSeen: new Date(),
                })
                .where(eq(userSessions.fingerprint, fingerprint));
        }

        await updateUniqueTechniqueCount(fingerprint);
    }

    const newScore = Math.min(oldScore + impact, 100);

    // A3: Narrative operation status
    const operationStatus = getOperationStatus(
        newExternalCount,
        subject.operationDesertStorm || (newExternalCount >= 3)
    );

    // A4: AI-generated message (unique per request)
    const message = await generateSentinelMessage(technique, subject.alias, payload);

    // A2+A5: Build response without numeric metrics, with banner
    const ascii = buildAsciiResponse({
        cid,
        alias: subject.alias,
        technique,
        operationStatus,
        message,
    });

    const fullResponse = WATCHTOWER_BANNER + "\n" + ascii;

    console.log(`[EXT_API] CID=${cid} Technique=${technique} Dup=${isDuplicate} Score=${oldScore}->${newScore} Confidence=${confidence}`);

    return new Response(fullResponse, {
        status: 200,
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "X-Sentinel-Score": newScore.toString(),
            "X-Sentinel-Technique": technique,
            "X-Sentinel-Duplicate": isDuplicate.toString(),
        },
    });
}

export async function GET(req: Request) {
    return POST(req);
}
