import { db } from "@/db";
import { securityEvents, userSessions } from "@/db/schema";
import { sql, desc, gte, inArray, like } from "drizzle-orm";

export const runtime = "edge";

// Stress state thresholds (events per hour, GLOBAL across all users)
// A single user generates ~10-15 events/hour normally.
// BRAVO = normal ops, ECHO = multiple active attackers, CHARLIE = platform under siege
const STRESS_THRESHOLDS = {
    BRAVO: 50,    // < 50 events/hour = LOW (1-3 users)
    ECHO: 150,    // 50-150 events/hour = MEDIUM (active probing)
    CHARLIE: 150, // > 150 events/hour = HIGH (coordinated attack)
};

interface GlobalIntelResponse {
    // Map Data
    attacksByCountry: { country: string; count: number }[];

    // Stats
    activeUsersNow: number;
    totalUsersAllTime: number;
    totalAttacksAllTime: number;
    attacksToday: number;
    topTechniques: { technique: string; count: number }[];
    topCountries: { country: string; count: number }[];
    avgRiskScore: number;

    // Stress State
    eventsLastHour: number;
    stressState: "BRAVO" | "ECHO" | "CHARLIE";
    stressLevel: "LOW" | "MEDIUM" | "HIGH";
    stressColor: string;

    // Attack Velocity
    eventsLast5Min: number;
    attacksPerMinute: number;

    // Live Feed
    recentEvents: {
        id: string;
        eventType: string;
        alias: string;
        timestamp: string;
        riskImpact: number;
        country: string | null;
    }[];

    // Arcjet Intelligence
    arcjetBotsDetected: number;
    arcjetRateLimited: number;
    arcjetShieldTriggers: number;

    // Metadata
    lastUpdated: string;
}

export async function GET() {
    try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const activeThreshold = new Date(now.getTime() - 5 * 60 * 1000); // 5 min

        // ========== PARALLEL QUERIES FOR PERFORMANCE ==========
        const [
            totalUsersResult,
            activeUsersResult,
            totalAttacksResult,
            attacksTodayResult,
            eventsLastHourResult,
            eventsLast5MinResult,
            topTechniquesResult,
            topCountriesResult,
            avgRiskResult,
            recentEventsResult,
            attacksByCountryResult,
            arcjetBotsResult,
            arcjetRateLimitResult,
            arcjetShieldResult,
        ] = await Promise.all([
            // Total users all time
            db.select({ count: sql<number>`count(*)` }).from(userSessions),

            // Active users (last 5 min)
            db
                .select({ count: sql<number>`count(*)` })
                .from(userSessions)
                .where(gte(userSessions.lastSeen, activeThreshold)),

            // Total attacks all time
            db.select({ count: sql<number>`count(*)` }).from(securityEvents),

            // Attacks today
            db
                .select({ count: sql<number>`count(*)` })
                .from(securityEvents)
                .where(gte(securityEvents.timestamp, todayStart)),

            // Events last hour (for stress state)
            db
                .select({ count: sql<number>`count(*)` })
                .from(securityEvents)
                .where(gte(securityEvents.timestamp, oneHourAgo)),

            // Events last 5 min (for attack velocity)
            db
                .select({ count: sql<number>`count(*)` })
                .from(securityEvents)
                .where(gte(securityEvents.timestamp, fiveMinAgo)),

            // Top techniques
            db
                .select({
                    technique: securityEvents.eventType,
                    count: sql<number>`count(*)`,
                })
                .from(securityEvents)
                .groupBy(securityEvents.eventType)
                .orderBy(sql`count(*) desc`)
                .limit(10),

            // Top countries
            db
                .select({
                    country: securityEvents.location,
                    count: sql<number>`count(*)`,
                })
                .from(securityEvents)
                .groupBy(securityEvents.location)
                .orderBy(sql`count(*) desc`)
                .limit(10),

            // Avg risk score
            db
                .select({ avg: sql<number>`COALESCE(AVG(risk_score), 0)` })
                .from(userSessions),

            // Recent 10 events for live feed
            db
                .select({
                    id: securityEvents.id,
                    eventType: securityEvents.eventType,
                    fingerprint: securityEvents.fingerprint,
                    timestamp: securityEvents.timestamp,
                    riskImpact: securityEvents.riskScoreImpact,
                    country: securityEvents.location,
                })
                .from(securityEvents)
                .orderBy(desc(securityEvents.timestamp))
                .limit(10),

            // Attacks by country (for map)
            db
                .select({
                    country: securityEvents.location,
                    count: sql<number>`count(*)`,
                })
                .from(securityEvents)
                .groupBy(securityEvents.location)
                .orderBy(sql`count(*) desc`),

            // Arcjet: Bots detected (all time)
            db
                .select({ count: sql<number>`count(*)` })
                .from(securityEvents)
                .where(like(securityEvents.eventType, "ARCJET_BOT%")),

            // Arcjet: Rate limit violations (all time)
            db
                .select({ count: sql<number>`count(*)` })
                .from(securityEvents)
                .where(like(securityEvents.eventType, "ARCJET_RATE%")),

            // Arcjet: Shield/WAF triggers (all time)
            db
                .select({ count: sql<number>`count(*)` })
                .from(securityEvents)
                .where(like(securityEvents.eventType, "ARCJET_SHIELD%")),
        ]);

        // ========== CALCULATE STRESS STATE ==========
        const eventsLastHour = eventsLastHourResult[0]?.count ?? 0;
        let stressState: "BRAVO" | "ECHO" | "CHARLIE";
        let stressLevel: "LOW" | "MEDIUM" | "HIGH";
        let stressColor: string;

        if (eventsLastHour < STRESS_THRESHOLDS.BRAVO) {
            stressState = "BRAVO";
            stressLevel = "LOW";
            stressColor = "#22c55e"; // Green
        } else if (eventsLastHour < STRESS_THRESHOLDS.ECHO) {
            stressState = "ECHO";
            stressLevel = "MEDIUM";
            stressColor = "#eab308"; // Yellow
        } else {
            stressState = "CHARLIE";
            stressLevel = "HIGH";
            stressColor = "#ef4444"; // Red
        }

        // ========== CALCULATE ATTACK VELOCITY ==========
        const eventsLast5Min = eventsLast5MinResult[0]?.count ?? 0;
        const attacksPerMinute = Math.round((eventsLast5Min / 5) * 10) / 10;

        // ========== FETCH ALIASES FOR RECENT EVENTS ==========
        const fingerprints = recentEventsResult
            .map((e) => e.fingerprint)
            .filter(Boolean);
        const aliasMap: Record<string, string> = {};

        if (fingerprints.length > 0) {
            const uniqueFingerprints = [...new Set(fingerprints)] as string[];
            const sessions = await db
                .select({
                    fingerprint: userSessions.fingerprint,
                    alias: userSessions.alias,
                })
                .from(userSessions)
                .where(inArray(userSessions.fingerprint, uniqueFingerprints));
            sessions.forEach((s) => {
                aliasMap[s.fingerprint] = s.alias;
            });
        }

        // ========== FORMAT RESPONSE ==========
        const response: GlobalIntelResponse = {
            // Map data
            attacksByCountry: attacksByCountryResult
                .filter((r) => r.country)
                .map((r) => ({
                    country: r.country!,
                    count: r.count,
                })),

            // Stats
            activeUsersNow: activeUsersResult[0]?.count ?? 0,
            totalUsersAllTime: totalUsersResult[0]?.count ?? 0,
            totalAttacksAllTime: totalAttacksResult[0]?.count ?? 0,
            attacksToday: attacksTodayResult[0]?.count ?? 0,
            topTechniques: topTechniquesResult.map((t) => ({
                technique: t.technique,
                count: t.count,
            })),
            topCountries: topCountriesResult
                .filter((c) => c.country)
                .map((c) => ({
                    country: c.country!,
                    count: c.count,
                })),
            avgRiskScore: Math.round(avgRiskResult[0]?.avg ?? 0),

            // Stress State
            eventsLastHour,
            stressState,
            stressLevel,
            stressColor,

            // Attack Velocity
            eventsLast5Min,
            attacksPerMinute,

            // Live Feed
            recentEvents: recentEventsResult.map((e) => ({
                id: e.id,
                eventType: e.eventType,
                alias: aliasMap[e.fingerprint || ""] || "Unknown",
                timestamp: e.timestamp?.toISOString() || "",
                riskImpact: e.riskImpact,
                country: e.country,
            })),

            // Arcjet Intelligence
            arcjetBotsDetected: arcjetBotsResult[0]?.count ?? 0,
            arcjetRateLimited: arcjetRateLimitResult[0]?.count ?? 0,
            arcjetShieldTriggers: arcjetShieldResult[0]?.count ?? 0,

            // Metadata
            lastUpdated: now.toISOString(),
        };

        return Response.json(response);
    } catch (error) {
        console.error("[GLOBAL_INTEL] Error:", error);
        return Response.json(
            { error: "Failed to fetch global intelligence" },
            { status: 500 }
        );
    }
}
