
import "dotenv/config"; // Load .env file
import { db } from "../db";
import { sql } from "drizzle-orm";

async function resetDb() {
    console.log("REAPING DATABASE... [TABULA RASA PROTOCOL]");
    try {
        await db.execute(sql`TRUNCATE TABLE security_events, user_sessions RESTART IDENTITY CASCADE;`);
        console.log(">> DATABASE PURGED. ALL SINS FORGIVEN.");
    } catch (error) {
        console.error(">> PURGE FAILED:", error);
    }
    process.exit(0);
}

resetDb();
