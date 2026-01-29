
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be defined in .env");
}

const client = neon(process.env.DATABASE_URL);
const db = drizzle(client, { schema });

async function resetDatabase() {
    console.log("⚠️ STARTING DIGITAL TWIN HARD RESET...");

    try {
        // Order matters due to foreign key constraints
        // 1. Delete dependent tables (Child records)
        console.log("Deleting security_events...");
        await db.delete(schema.securityEvents);

        console.log("Deleting research_leaderboard...");
        await db.delete(schema.researchLeaderboard);

        // 2. Delete primary table (Parent records)
        console.log("Deleting user_sessions...");
        await db.delete(schema.userSessions);

        console.log("✅ SYSTEM PURGED. ALL DATA RESET TO ZERO.");
    } catch (error) {
        console.error("❌ RESET FAILED:", error);
    }
}

resetDatabase();
