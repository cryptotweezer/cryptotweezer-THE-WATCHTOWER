
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

        // 3. Execution
        const decision = await aj.protect(req);

        // 4. Decision Handling
        if (decision.isDenied()) {
            return NextResponse.json(
                { error: "Active Defense Triggered", reason: decision.reason },
                { status: 403 }
            );
        }

        // 5. Allowed - Inject Fingerprint
        const res = NextResponse.next();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((decision as any).fingerprint) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            res.headers.set("x-arcjet-fingerprint", (decision as any).fingerprint);
        }
        return res;

    } catch (error) {
        // 6. Fail-Safe: Absolute crash prevention
        console.error("Critical Middleware Failure:", error);
        return NextResponse.next();
    }
}