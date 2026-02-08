import "dotenv/config";
import { db } from "@/db";
import { sql } from "drizzle-orm";

async function check() {
    try {
        const result = await db.execute(sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'user_sessions' AND column_name = 'clerk_id';
        `);
        console.log("Column verification:", result);
    } catch (e) {
        console.error("Error checking schema:", e);
    }
}

check();
