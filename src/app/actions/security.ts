"use server";

import { logSecurityEvent } from "@/lib/security";
import { runArcjetSecurity } from "@/lib/arcjet";
import { cookies, headers } from "next/headers";

export async function logClientSecurityEvent(event: {
    fingerprint: string;
    eventType: "SQLi" | "XSS" | "Bot" | "RateLimit" | "AccessControl" | "PromptInjection";
    riskScore: number;
    action: "Blocked" | "Allowed" | "Flagged" | "Tarpit";
    ip?: string;
    payload?: string;
    location?: string;
}) {
    const ajResult = await runArcjetSecurity();
    if (ajResult.isDenied) return;

    // 1. Secure Session (Prevent spoofing)
    const cookieStore = await cookies();
    const fingerprint = cookieStore.get("watchtower_node_id")?.value;
    if (!fingerprint) return;

    // 2. Secure Infrastructure Tracking (Prevent spoofing)
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const loc = headersList.get("x-vercel-ip-country") || "UNKNOWN";

    // 3. Strict Payload Validation
    if (event.payload && event.payload.length > 2000) return;

    // 4. Server-Side Risk Score Evaluation (Prevent Score Manipulation)
    const riskMap: Record<string, number> = {
        "SQLi": 30,
        "XSS": 25,
        "Bot": 10,
        "RateLimit": 5,
        "AccessControl": 15,
        "PromptInjection": 20
    };
    const calculatedRisk = riskMap[event.eventType] || 5;

    await logSecurityEvent({
        fingerprint,
        eventType: event.eventType,
        riskScore: calculatedRisk,
        action: "Flagged", // Always overridden to prevent client from approving itself
        ip,
        payload: event.payload,
        location: loc
    });
}
