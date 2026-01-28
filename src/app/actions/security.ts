"use server";

import { logSecurityEvent } from "@/lib/security";

export async function logClientSecurityEvent(event: {
    fingerprint: string;
    eventType: "SQLi" | "XSS" | "Bot" | "RateLimit" | "AccessControl" | "PromptInjection";
    riskScore: number;
    action: "Blocked" | "Allowed" | "Flagged" | "Tarpit";
    ip?: string;
    payload?: string;
    location?: string;
}) {
    await logSecurityEvent(event);
}
