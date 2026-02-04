"use server";

import { db } from "@/db";
import { userSessions, securityEvents } from "@/db/schema";
import { eq } from "drizzle-orm";


export async function performHandshake(fingerprint: string, currentAlias?: string) {
    if (!fingerprint) return { success: false, error: "No Fingerprint" };

    try {
        // 1. Check if session exists
        const existingSession = await db.select().from(userSessions).where(eq(userSessions.fingerprint, fingerprint));

        if (existingSession.length > 0) {
            // Return existing identity
            return {
                success: true,
                alias: existingSession[0].alias,
                cid: existingSession[0].cid
            };
        }

        // 2. Generate New Identity
        const adjectives = ["Neon", "Ghost", "Void", "Cyber", "Null", "Echo", "Rogue", "Binary"];
        const nouns = ["Drifter", "Fox", "Spectre", "Protocol", "Viper", "Signal", "Operator", "Unit"];

        const newAlias = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
        const newCid = `CID-${Math.floor(100 + Math.random() * 900)}-${Math.random().toString(36).substring(2, 3).toUpperCase()}`;

        // 3. Create Session
        await db.insert(userSessions).values({
            fingerprint,
            alias: newAlias,
            cid: newCid,
            riskScore: 0,
            firstSeen: new Date(),
            lastSeen: new Date()
        });

        // 4. Log Handshake
        await db.insert(securityEvents).values({
            fingerprint,
            eventType: "System Handshake",
            payload: "Identity Assignment",
            riskScoreImpact: 0,
            actionTaken: "Allowed",
            ipAddress: "127.0.0.1",
            location: "Unknown"
        });

        return { success: true, alias: newAlias, cid: newCid };
    } catch (error) {
        console.error("Handshake Failed:", error);
        return { success: false, error: "Database Error" };
    }
}
