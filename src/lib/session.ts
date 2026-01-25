
import { db } from "@/db";
import { userSessions } from "@/db/schema";
import { eq } from "drizzle-orm";

const ADJECTIVES = ["Hidden", "Neon", "Silent", "Binary", "Digital", "Ghost", "Iron", "Zero", "Shadow", "Electric"];
const NOUNS = ["Fox", "Wolf", "Specter", "Cipher", "Signal", "Node", "Link", "Protocol", "Spider", "Hawk"];

// Deterministic or Random Alias Generator
export function generateCyberAlias(): string {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    return `${adj}-${noun}`;
}

export async function getOrCreateSession(fingerprint: string) {
    // 1. Check if session exists
    const existing = await db.select().from(userSessions).where(eq(userSessions.fingerprint, fingerprint)).limit(1);

    if (existing.length > 0) {
        return existing[0];
    }

    // 2. Create new session
    const newAlias = generateCyberAlias();
    const newSession = await db.insert(userSessions).values({
        fingerprint,
        alias: newAlias,
        riskScore: 0,
    }).returning();

    return newSession[0];
}

export async function getSession(fingerprint: string) {
    const existing = await db.select().from(userSessions).where(eq(userSessions.fingerprint, fingerprint)).limit(1);
    return existing[0] || null;
}
