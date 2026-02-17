import { db } from "@/db";
import { securityEvents, userSessions } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import { getOrCreateSession } from "./session";
import type { ArcjetResult } from "./arcjet";

// Log a security event to the database
export async function logSecurityEvent(event: {
    fingerprint: string;
    eventType: "SQLi" | "XSS" | "Bot" | "RateLimit" | "AccessControl" | "PromptInjection";
    riskScore: number;
    action: "Blocked" | "Allowed" | "Flagged" | "Tarpit";
    ip?: string;
    payload?: string;
    location?: string;
}) {
    try {
        // 1. Ensure user session exists using our centralized logic
        await getOrCreateSession(event.fingerprint);

        // 2. Update session risk score
        await db
            .update(userSessions)
            .set({
                riskScore: sql`${userSessions.riskScore} + ${event.riskScore}`,
                lastSeen: new Date(),
            })
            .where(eq(userSessions.fingerprint, event.fingerprint));

        // 3. Log the specific event
        await db.insert(securityEvents).values({
            fingerprint: event.fingerprint,
            eventType: event.eventType,
            riskScoreImpact: event.riskScore,
            actionTaken: event.action,
            ipAddress: event.ip,
            payload: event.payload,
            location: event.location,
        });
    } catch (error) {
        console.error("Failed to log security event:", error);
    }
}

/**
 * Log Arcjet detections to securityEvents.
 * NEVER blocks the user — just records the detection for intelligence.
 * Call this AFTER getOrCreateSession() so the fingerprint exists in DB.
 */
export async function logArcjetDetection(
    arcjetResult: ArcjetResult,
    fingerprint: string,
    ip: string,
    location: string,
) {
    if (!arcjetResult.isDenied || !arcjetResult.threatType) return;

    try {
        await db.insert(securityEvents).values({
            fingerprint,
            eventType: arcjetResult.threatType,
            riskScoreImpact: 0,
            actionTaken: "Flagged" as const,
            ipAddress: ip,
            payload: `Arcjet detection: ${arcjetResult.threatType}`,
            location,
        });
    } catch (error) {
        console.error("[ARCJET_LOG] Failed to log detection:", error);
    }
}

// Fetch total threat count
export async function getThreatCount() {
    noStore();
    try {
        const result = await db.select({ count: sql<number>`count(*)` }).from(securityEvents);
        return result[0].count;
    } catch (err) {
        console.error("[DB] getThreatCount failed:", err);
        return 0;
    }
}

// Fetch recent threats for dashboard
export async function getRecentThreats(limit = 5) {
    noStore();
    return await db
        .select()
        .from(securityEvents)
        .orderBy(desc(securityEvents.timestamp))
        .limit(limit);
}
