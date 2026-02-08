import "dotenv/config";
import { db } from "@/db";
import { userSessions, securityEvents, researchLeaderboard } from "@/db/schema";


async function reset() {
    console.log("🛑 WARNING: This will wipe all data.");
    console.log("Resetting database...");

    try {
        // Delete in order of foreign key constraints
        await db.delete(securityEvents);
        await db.delete(researchLeaderboard);
        await db.delete(userSessions);

        console.log("✅ Database cleared successfully.");
    } catch (error) {
        console.error("❌ Error clearing database:", error);
    }

    process.exit(0);
}

reset().catch((err) => {
    console.error(err);
    process.exit(1);
});
