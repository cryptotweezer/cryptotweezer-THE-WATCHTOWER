
import "dotenv/config";
import { db } from "../db";
import { userSessions } from "../db/schema";

async function createTestSession() {
    const fingerprint = "test-fp-" + Math.random().toString(36).substring(7);
    console.log(`Creating test session with fingerprint: ${fingerprint}`);

    await db.insert(userSessions).values({
        fingerprint: fingerprint,
        alias: "Test-Subject-Alpha",
        cid: "CID-999-T",
        riskScore: 0,
        routingProbeCount: 0,
        uniqueTechniqueCount: 0
    });

    console.log("Session created.");
    console.log(fingerprint); // Output fingerprint for next step
    process.exit(0);
}

createTestSession();
