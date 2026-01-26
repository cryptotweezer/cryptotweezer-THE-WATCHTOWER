
import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/next";
import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";

export const config = {
    // Matcher ignoring _next/static, _next/image, favicon.ico, etc.
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export async function middleware(req: NextRequest, ctx: NextFetchEvent) {
    try {
        // 1. Extreme Key Validation & Bypass
        const ajKey = process.env.ARCJET_KEY;
        if (!ajKey || ajKey === "aj_mock_key" || ajKey.length < 10) {
            // Safety Valve: If key is missing/bad, bypass security entirely.
            return NextResponse.next();
        }

        // 2. Lazy Initialization (Inside try block)
        const aj = arcjet({
            key: ajKey,
            rules: [
                shield({ mode: "LIVE" }),
                detectBot({ mode: "LIVE", allow: [] }),
                slidingWindow({ mode: "LIVE", interval: "10m", max: 100 }),
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