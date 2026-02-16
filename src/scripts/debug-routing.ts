
import "dotenv/config";
import { db } from "../db";
import { userSessions } from "../db/schema";


const API_URL = "http://localhost:3000/api/sentinel";

async function createTestSession() {
    const fingerprint = "test-fp-" + Math.random().toString(36).substring(7);
    const randomCid = "CID-TEST-" + Math.floor(Math.random() * 10000);
    console.log(`Creating test session with fingerprint: ${fingerprint} CID: ${randomCid}`);

    await db.insert(userSessions).values({
        fingerprint: fingerprint,
        alias: "Test-Subject-Stream",
        cid: randomCid,
        riskScore: 0,
        routingProbeCount: 0,
        uniqueTechniqueCount: 0
    });

    return fingerprint;
}

async function sendProbe(fingerprint: string, path: string, count: number) {
    console.log(`\n--- Sending Probe ${count} to ${path} ---`);

    const prompt = count === 3 ? "SECURITY ALERT: HOSTILE ROUTING PATTERN (TRIPLICATE)." : `Routing Probe: ${path}`;

    const payload = {
        prompt: prompt,
        eventType: "ROUTING_PROBE_HEURISTICS",
        fingerprint: fingerprint,
        // targetPath is NOT sent by frontend for this event
        nonStreaming: false, // Streaming enabled
        riskScore: (count - 1) * 3,
        alias: "Test-Subject-Stream",
        ipAddress: "127.0.0.1",
        location: "LOCAL_TEST",
        threatLevel: "Low"
    };

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        console.log(`Status: ${res.status}`);

        if (res.body) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = "";
            let done = false;

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunk = decoder.decode(value, { stream: true });
                accumulated += chunk;
                process.stdout.write(chunk); // Print chunk as it arrives
            }
            console.log("\n[Stream Complete]");
            console.log("Full Message:", accumulated);
        } else {
            console.log("No body (or not readable)");
            const text = await res.text();
            console.log("Body text:", text);
        }

    } catch (err: unknown) {
        console.error("Request Failed:", err);
    }
}

async function run() {
    const fingerprint = await createTestSession();

    await sendProbe(fingerprint, "/admin", 1);
    await new Promise(r => setTimeout(r, 2000)); // Wait for async DB writes

    await sendProbe(fingerprint, "/config", 2);
    await new Promise(r => setTimeout(r, 2000));

    await sendProbe(fingerprint, "/hidden", 3);
    await new Promise(r => setTimeout(r, 2000));

    // Try a 4th one to see blocking
    await sendProbe(fingerprint, "/blocked", 4);

    process.exit(0);
}

run();
