
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
    "SECURITY_WARNING_PROTOCOL"
]);
export const actionTakenEnum = pgEnum("action_taken", ["Blocked", "Allowed", "Flagged", "Tarpit"]);

// Tables

// 1. Session Intel (Identity)
export const userSessions = pgTable("user_sessions", {
    fingerprint: text("fingerprint").primaryKey(), // Unique visitor ID
    alias: text("alias").notNull(), // AI-generated codename (e.g., "Neon Cipher")
    riskScore: integer("risk_score").default(0).notNull(),
    firstSeen: timestamp("first_seen").defaultNow().notNull(),
    lastSeen: timestamp("last_seen").defaultNow().notNull(),
});

// 2. The Watchtower (Telemetry)
export const securityEvents = pgTable("security_events", {
    id: uuid("id").defaultRandom().primaryKey(),
    fingerprint: text("fingerprint").references(() => userSessions.fingerprint),
    eventType: eventTypeEnum("event_type").notNull(),
    payload: text("payload"), // Sanitized attack payload
    riskScoreImpact: integer("risk_score_impact").default(0).notNull(),
    actionTaken: actionTakenEnum("action_taken").notNull(),
    ipAddress: text("ip_address"), // Hashed or masked for privacy if needed
    location: text("location"), // Country code
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
