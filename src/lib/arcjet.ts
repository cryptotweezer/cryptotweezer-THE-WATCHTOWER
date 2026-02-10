import arcjet, { detectBot, shield, slidingWindow, ArcjetDecision } from "@arcjet/next";
import { headers } from "next/headers";

export interface ArcjetResult {
    fingerprint: string | null;
    isDenied: boolean;
    threatType: string | null;
    // Rich detection data (for logging, NOT blocking)
    isBot: boolean;
    isRateLimited: boolean;
    isShieldTriggered: boolean;
}

/**
 * Run Arcjet security checks on the current request.
 * IMPORTANT: We NEVER block users. All detections are logged only.
 * Results are used for telemetry in securityEvents.
 */
export async function runArcjetSecurity(): Promise<ArcjetResult> {
    const ajKey = process.env.ARCJET_KEY;

    // Bypass if not configured
    if (!ajKey || ajKey === "aj_mock_key" || ajKey.length < 10) {
        return {
            fingerprint: null,
            isDenied: false,
            threatType: null,
            isBot: false,
            isRateLimited: false,
            isShieldTriggered: false,
        };
    }

    const aj = arcjet({
        key: ajKey,
        rules: [
            shield({ mode: "LIVE" }),
            detectBot({ mode: "LIVE", allow: ["CATEGORY:SEARCH_ENGINE"] }),
            slidingWindow({ mode: "LIVE", interval: "1m", max: 60 }),
        ],
    });

    // Get headers for the request
    const headersList = await headers();

    // Create a minimal request object for Arcjet
    const req = {
        headers: headersList,
        ip: headersList.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1",
    };

    try {
        const decision = await aj.protect(req as Parameters<typeof aj.protect>[0]);

        let threatType: string | null = null;
        const isBot = decision.isDenied() && decision.reason.isBot();
        const isRateLimited = decision.isDenied() && decision.reason.isRateLimit();
        const isShieldTriggered = decision.isDenied() && decision.reason.isShield();

        if (decision.isDenied()) {
            console.warn("[ARCJET] Threat detected (LOGGED, NOT BLOCKED):", decision.reason);
            if (isBot) {
                threatType = "ARCJET_BOT_DETECTED";
            } else if (isRateLimited) {
                threatType = "ARCJET_RATE_LIMITED";
            } else if (isShieldTriggered) {
                threatType = "ARCJET_SHIELD_TRIGGERED";
            } else {
                threatType = "ARCJET_ANOMALY";
            }
        }

        return {
            fingerprint: (decision as ArcjetDecision & { fingerprint?: string }).fingerprint || null,
            isDenied: decision.isDenied(),
            threatType,
            isBot,
            isRateLimited,
            isShieldTriggered,
        };
    } catch (error) {
        console.error("[ARCJET] Security check failed:", error);
        return {
            fingerprint: null,
            isDenied: false,
            threatType: null,
            isBot: false,
            isRateLimited: false,
            isShieldTriggered: false,
        };
    }
}
