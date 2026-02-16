
import "dotenv/config";
import { db } from "../db";
import { userSessions } from "../db/schema";
import { lt } from "drizzle-orm";

async function checkFingerprint() {
    console.log("Checking for fingerprints with routingProbeCount < 3...");
    const sessions = await db.select().from(userSessions).where(lt(userSessions.routingProbeCount, 3)).limit(1);

    if (sessions.length > 0) {
        console.log("Found session:", sessions[0]);
        console.log(`Fingerprint: ${sessions[0].fingerprint}`);
        console.log(`Routing Probe Count: ${sessions[0].routingProbeCount}`);
    } else {
        console.log("No session found with routingProbeCount < 3. Create a new one or reset DB.");
    }
    process.exit(0);
}

checkFingerprint();
