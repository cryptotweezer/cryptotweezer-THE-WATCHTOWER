import arcjet, { createMiddleware, detectBot, shield, slidingWindow } from "@arcjet/next";
import { NextResponse, NextRequest, NextFetchEvent } from "next/server";

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
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Arcjet type definition mismatch with Next.js 16
export default createMiddleware(aj, async (req: NextRequest, ctx: NextFetchEvent, next: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    try {
        // 0. Fail-Safe: Bypass if Key is missing or invalid in Prod
        // Allows site to function even if Security Layer fails
        if (!process.env.ARCJET_KEY || process.env.ARCJET_KEY === "aj_mock_key") {
            // Optional: Log warning if needed, but keep silent for users
            return next();
        }

        const decision = await aj.protect(req);

        // Extracción segura del fingerprint
        const fingerprint = typeof (decision as any).fingerprint === 'string' // eslint-disable-line @typescript-eslint/no-explicit-any
            ? (decision as any).fingerprint // eslint-disable-line @typescript-eslint/no-explicit-any
            : "unknown";

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

            // Lógica de Telemetría Blindada para Vercel
            // Offloaded to API to keep Middleware bundle small (<1MB)
            const ipAddress = decision.ip ? String(decision.ip) : "127.0.0.1";

            ctx.waitUntil(
                fetch(new URL("/api/security/log", req.url), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fingerprint,
                        eventType,
                        riskScore,
                        action: "Blocked",
                        ip: ipAddress,
                        location: "Unknown",
                        payload: req.url,
                    }),
                }).catch(e => console.error("Telemetry Fetch Error:", e))
            );

            return NextResponse.json(
                { error: "Active Defense Triggered", reason: decision.reason },
                { status: 403 }
            );
        }

        // Petición Permitida - Inyectar header de identidad
        const res = await next();
        if (res instanceof NextResponse) {
            res.headers.set("x-arcjet-fingerprint", fingerprint);
        }
        return res;
    } catch (error) {
        // Critical Fail-Safe Protocol
        // If middleware crashes, log error internally but allow request to proceed
        console.error("Middleware Error:", error);
        return await next();
    }
});