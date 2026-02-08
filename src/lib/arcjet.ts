import arcjet, { detectBot, shield, slidingWindow, ArcjetDecision } from "@arcjet/next";
import { headers } from "next/headers";

export interface ArcjetResult {
    fingerprint: string | null;
    isDenied: boolean;
    threatType: string | null;
}

/**
 * Run Arcjet security checks on the current request.
 * Call this from server components to get fingerprinting and threat detection.
 */
export async function runArcjetSecurity(): Promise<ArcjetResult> {
    const ajKey = process.env.ARCJET_KEY;

    // Bypass if not configured
    if (!ajKey || ajKey === "aj_mock_key" || ajKey.length < 10) {
        return {
            fingerprint: null,
            isDenied: false,
            threatType: null
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

        if (decision.isDenied()) {
            console.warn("[ARCJET] Threat detected:", decision.reason);
            if (decision.reason.isBot()) {
                threatType = "BOT_ARMY";
            } else if (decision.reason.isRateLimit()) {
                threatType = "DDoS_ATTEMPT";
            } else if (decision.reason.isShield()) {
                threatType = "INJECTION_ATTACK";
            } else {
                threatType = "ANOMALY";
            }
        }

        return {
            fingerprint: (decision as ArcjetDecision & { fingerprint?: string }).fingerprint || null,
            isDenied: decision.isDenied(),
            threatType
        };
    } catch (error) {
        console.error("[ARCJET] Security check failed:", error);
        return {
            fingerprint: null,
            isDenied: false,
            threatType: null
        };
    }
}
