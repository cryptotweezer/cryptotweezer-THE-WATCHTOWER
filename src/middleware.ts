
import arcjet, { createMiddleware, detectBot, shield, slidingWindow } from "@arcjet/next";
import { NextResponse, NextRequest, NextFetchEvent } from "next/server";
import { logSecurityEvent } from "@/lib/security";

export const config = {
    // Matcher ignoring _next/static, _next/image, favicon.ico, etc.
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

// Configure Arcjet
const aj = arcjet({
    key: process.env.ARCJET_KEY || "aj_mock_key", // Fallback for build
    rules: [
        // 1. Shield: Blocks SQLi, XSS, and other common attacks
        shield({
            mode: "LIVE", // will block requests. Use "DRY_RUN" to log only.
        }),
        // 2. Bot Detection: Blocks automated clients
        detectBot({
            mode: "LIVE",
            allow: [], // Block all detected bots
        }),
        // 3. Rate Limiting: 100 requests per 10 minutes per IP
        slidingWindow({
            mode: "LIVE",
            interval: "10m",
            max: 100,
        }),
    ],
});

// Middleware function
// @ts-ignore - Arcjet type definition mismatch with Next.js 16
export default createMiddleware(aj, async (req: NextRequest, ctx: NextFetchEvent, next: any) => {
    const decision = await aj.protect(req);
    const fingerprint = (decision as any).fingerprint || "unknown";

    // Logging logic for Denied requests
    if (decision.isDenied()) {
        let eventType: "Bot" | "RateLimit" | "SQLi" | "AccessControl" = "AccessControl";
        let riskScore = 10;

        if (decision.reason.isBot()) {
            eventType = "Bot";
            riskScore = 30;
        } else if (decision.reason.isRateLimit()) {
            eventType = "RateLimit";
            riskScore = 20;
        } else if (decision.reason.isShield()) {
            eventType = "SQLi";
            riskScore = 50;
        }

        // Fire and forget logging
        try {
            await logSecurityEvent({
                fingerprint,
                eventType,
                riskScore,
                action: "Blocked",
                ip: String(decision.ip),
                location: "Unknown",
                payload: req.url,
            });
        } catch (e) {
            console.error("Middleware Logging Error:", e);
        }

        return NextResponse.json({ error: "Active Defense Triggered", reason: decision.reason }, { status: 403 });
    }

    // Allowed Request - Pass fingerprint to headers for UI
    const res = await next();
    if (res) {
        res.headers.set("x-arcjet-fingerprint", fingerprint);
    }
    return res;
});
