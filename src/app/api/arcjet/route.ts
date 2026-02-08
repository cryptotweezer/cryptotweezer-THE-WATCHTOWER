import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/next";
import { NextRequest, NextResponse } from "next/server";

// Arcjet Security Layer (Moved from Middleware to reduce Edge Function size)
export async function POST(req: NextRequest) {
    const ajKey = process.env.ARCJET_KEY;

    if (!ajKey || ajKey === "aj_mock_key" || ajKey.length < 10) {
        return NextResponse.json({ status: "bypassed", message: "Arcjet not configured" });
    }

    const aj = arcjet({
        key: ajKey,
        rules: [
            shield({ mode: "LIVE" }),
            detectBot({ mode: "LIVE", allow: [] }),
            slidingWindow({ mode: "LIVE", interval: "1m", max: 60 }),
        ],
    });

    const decision = await aj.protect(req);

    const result: Record<string, unknown> = {
        status: decision.isDenied() ? "denied" : "allowed",
        fingerprint: (decision as { fingerprint?: string }).fingerprint || null,
    };

    if (decision.isDenied()) {
        console.warn("THREAT DETECTED:", decision.reason);
        if (decision.reason.isBot()) {
            result.threatType = "BOT_ARMY";
        } else if (decision.reason.isRateLimit()) {
            result.threatType = "DDoS_ATTEMPT";
        } else if (decision.reason.isShield()) {
            result.threatType = "INJECTION_ATTACK";
        } else {
            result.threatType = "ANOMALY";
        }
    }

    return NextResponse.json(result);
}
