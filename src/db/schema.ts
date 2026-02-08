
import { pgTable, text, timestamp, integer, uuid, pgEnum } from "drizzle-orm/pg-core";

// Enums
export const eventTypeEnum = pgEnum("event_type", [
    "SQLi",
    "XSS",
    "Bot",
    "RateLimit",
    "AccessControl",
    "PromptInjection",
    "FORENSIC_INSPECTION_ACTIVITY",
    "UI_SURFACE_ANALYSIS",
    "DATA_EXFILTRATION_ATTEMPT",
    "CONTEXT_SWITCH_ANOMALY",
    "ROUTING_PROBE_HEURISTICS",
    "System Handshake",
    "PROTOCOL_VIOLATION",
    "SECURITY_WARNING_PROTOCOL",
    "FOCUS_LOSS_ANOMALY",
    "MEMORY_INJECTION_ATTEMPT"
]);
export const actionTakenEnum = pgEnum("action_taken", ["Blocked", "Allowed", "Flagged", "Tarpit"]);

// Tables

// 1. Session Intel (Identity)
export const userSessions = pgTable("user_sessions", {
    fingerprint: text("fingerprint").primaryKey(), // Unique visitor ID (Hardware/Browser)
    clerkId: text("clerk_id").unique(), // Clerk User ID (if authenticated)
    cid: text("cid").unique(), // Public Criminal ID (e.g., CID-442-X)
    alias: text("alias").notNull(), // AI-generated codename (e.g., "Neon Cipher")

    riskScore: integer("risk_score").default(0).notNull(),
    firstSeen: timestamp("first_seen").defaultNow().notNull(),
    lastSeen: timestamp("last_seen").defaultNow().notNull(),

    routingProbeCount: integer("routing_probe_count").default(0).notNull(), // Rate limiting for probes
    uniqueTechniqueCount: integer("unique_technique_count").default(0).notNull(), // DB-tracked unique techniques
});


// 2. The Watchtower (Telemetry)
export const securityEvents = pgTable("security_events", {
    id: uuid("id").defaultRandom().primaryKey(),
    fingerprint: text("fingerprint").references(() => userSessions.fingerprint),
    eventType: text("event_type").notNull(), // FREEDOM: Replaced Enum with Text
    payload: text("payload"), // Sanitized attack payload
    riskScoreImpact: integer("risk_score_impact").default(0).notNull(),
    actionTaken: actionTakenEnum("action_taken").notNull(),
    ipAddress: text("ip_address"), // Hashed or masked for privacy if needed
    location: text("location"), // Country code
    route: text("route"), // Target path for routing probes
    timestamp: timestamp("timestamp").defaultNow().notNull(),
});


// 3. Hall of Fame (Gamification)
export const researchLeaderboard = pgTable("research_leaderboard", {
    id: uuid("id").defaultRandom().primaryKey(),
    fingerprint: text("fingerprint").references(() => userSessions.fingerprint).notNull(),
    points: integer("points").default(0).notNull(),
    achievements: text("achievements").array(), // List of badges/flags captured
    discoveryDate: timestamp("discovery_date").defaultNow().notNull(),
});
