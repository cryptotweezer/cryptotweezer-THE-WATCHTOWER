
import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/next";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
    // Matcher ignoring _next/static, _next/image, favicon.ico, etc.
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

// Next.js 16 Proxy Export Convention
export default async function proxy(req: NextRequest) {
    try {
        // 1. Extreme Key Validation & Bypass
        const ajKey = process.env.ARCJET_KEY;
        if (!ajKey || ajKey === "aj_mock_key" || ajKey.length < 10) {
            // Safety Valve: If key is missing/bad, bypass security entirely.
            return NextResponse.next();
        }

        // 2. Initialize Arcjet (Lazy or per-request if needed, but keeping it simple here)
        const aj = arcjet({
            key: ajKey,
            rules: [
                // Phase 2: Shield (SQLi, XSS) - Protection active
                shield({ mode: "LIVE" }),
                // Phase 2: Bot Detection - Strict (no allow list yet)
                detectBot({ mode: "LIVE", allow: [] }),
                // Phase 2: Rate Limiting - 60 requests / 1 min
                slidingWindow({ mode: "LIVE", interval: "1m", max: 60 }),
            ],
        });

        // 3. PRIORITY 1: Universal Ghost Route (Reconnaissance Defense)
        // Intercept ANY route that isn't explicity allowed and rewrite to root.

        const path = req.nextUrl.pathname;
        const validRoutes = [
            "/",
            "/favicon.ico",
            "/cookies",
            "/legal",
            "/privacy",
            "/terms"
        ];

        // Allowed API Routes (Sentinel + Logging)
        const allowedApiRoutes = ["/api/sentinel", "/api/security/log"];

        // Helper to check if route is valid
        const isStatic = path.startsWith("/_next") || path.startsWith("/static");
        const isAllowedApi = allowedApiRoutes.some(route => path.startsWith(route));
        const isValidPage = validRoutes.includes(path);

        const isValid = isValidPage || isStatic || isAllowedApi;

        let baseResponse = NextResponse.next();
        if (!isValid) {
            // It's a Wildcard Ghost Route!
            baseResponse = NextResponse.rewrite(new URL("/", req.url));
            baseResponse.headers.set("x-invoke-path", path); // RAW PATH CAPTURE
            // Distinct trap for API snooping vs Random browsing
            if (path.startsWith("/api")) {
                baseResponse.headers.set("x-sentinel-trap", "api_probe");
            } else {
                baseResponse.headers.set("x-sentinel-trap", "universal_wildcard");
            }
        } else {
            // Specific check for known "Honey" routes even if they look like APIs (optional, but keeping original logic partially)
            const explicitTraps = ["/admin", "/wp-admin", "/.env", "/config", "/dashboard"];
            if (explicitTraps.some(route => path.startsWith(route))) {
                baseResponse = NextResponse.rewrite(new URL("/", req.url));
                baseResponse.headers.set("x-invoke-path", path); // RAW PATH CAPTURE
                baseResponse.headers.set("x-sentinel-trap", "reconnaissance");
            }
        }

        // 4. Execution (Arcjet protection applied to the Base Response)
        const decision = await aj.protect(req);

        // 5. Decision Handling: DETECTION-ONLY MODE
        // We never block the request. We only tag it for the UI/Sentinel to react.
        if (decision.isDenied()) {
            console.warn("🛡️ THREAT DETECTED (NON-BLOCKING):", decision.reason);

            // Inject Threat Telemetry Headers
            baseResponse.headers.set("x-arcjet-threat-detected", "true");
            if (decision.reason.isBot()) {
                baseResponse.headers.set("x-arcjet-threat-type", "BOT_ARMY");
            } else if (decision.reason.isRateLimit()) {
                baseResponse.headers.set("x-arcjet-threat-type", "DDoS_ATTEMPT");
            } else if (decision.reason.isShield()) {
                baseResponse.headers.set("x-arcjet-threat-type", "INJECTION_ATTACK");
            } else {
                baseResponse.headers.set("x-arcjet-threat-type", "ANOMALY");
            }
        }

        // 6. Identity Injection (Fingerprint)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((decision as any).fingerprint) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            baseResponse.headers.set("x-arcjet-fingerprint", (decision as any).fingerprint);
        }

        // 7. Stable Identity Persistence (Dev/Incognito)
        // If Arcjet didn't provide a fingerprint, we ensure a stable node ID cookie.
        // CRITICAL FIX: To ensure the Page sees this ID on the FIRST load, we must inject it via Headers.
        if (!req.cookies.get("watchtower_node_id") && !(decision as { fingerprint?: string }).fingerprint) {
            const stableId = "node_dev_" + Math.random().toString(36).substring(2, 10);

            // Inject into Request Headers for downstream Page to use immediately
            const newHeaders = new Headers(req.headers);
            newHeaders.set("x-watchtower-node-id", stableId);

            // Re-create response with new headers
            baseResponse = NextResponse.next({
                request: { headers: newHeaders }
            });

            // Set Cookie for future requests
            baseResponse.cookies.set("watchtower_node_id", stableId, {
                path: "/",
                sameSite: "strict",
                secure: process.env.NODE_ENV === "production"
            });
        }

        return baseResponse;

    } catch (error) {
        // 7. Fail-Safe: Absolute crash prevention
        console.error("Critical Middleware Failure:", error);
        return NextResponse.next();
    }
}