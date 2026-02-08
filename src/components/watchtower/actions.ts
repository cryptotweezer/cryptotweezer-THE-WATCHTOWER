"use server";

import { db } from "@/db";
import { userSessions, securityEvents } from "@/db/schema";
import { eq } from "drizzle-orm";


export async function performHandshake(fingerprint: string) {
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

export async function syncUserIdentity(clerkId: string, fingerprint: string) {
    if (!clerkId || !fingerprint) return { success: false, error: "Missing Credentials" };

    try {
        // 1. Check if Clerk ID already has a Sentinel Identity
        const existingClerkSession = await db.select().from(userSessions).where(eq(userSessions.clerkId, clerkId)).limit(1);

        if (existingClerkSession.length > 0) {
            // FOUND: Return MASTER Identity (Client must adopt this fingerprint)
            const master = existingClerkSession[0];
            return {
                success: true,
                fingerprint: master.fingerprint, // THE MASTER FINGERPRINT
                alias: master.alias,
                cid: master.cid,
                riskScore: master.riskScore,
                migrated: master.fingerprint !== fingerprint // Flag if client needs to switch
            };
        }

        // 2. New Clerk ID: Check if current Fingerprint exists (Upgrade Anonymous -> Authenticated)
        const existingAnonSession = await db.select().from(userSessions).where(eq(userSessions.fingerprint, fingerprint)).limit(1);

        if (existingAnonSession.length > 0) {
            // UPGRADE: Link Clerk ID to existing Anonymous Session
            await db.update(userSessions)
                .set({ clerkId: clerkId })
                .where(eq(userSessions.fingerprint, fingerprint));

            return {
                success: true,
                fingerprint: existingAnonSession[0].fingerprint,
                alias: existingAnonSession[0].alias,
                cid: existingAnonSession[0].cid,
                riskScore: existingAnonSession[0].riskScore,
                migrated: false
            };
        }

        // 3. New Clerk ID & New Fingerprint (Should rarely happen if getOrCreate is working, but safe fallback)
        const adjectives = ["Neon", "Ghost", "Void", "Cyber", "Null", "Echo", "Rogue", "Binary"];
        const nouns = ["Drifter", "Fox", "Spectre", "Protocol", "Viper", "Signal", "Operator", "Unit"];
        const newAlias = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
        const newCid = `CID-${Math.floor(100 + Math.random() * 900)}-${Math.random().toString(36).substring(2, 3).toUpperCase()}`;

        await db.insert(userSessions).values({
            fingerprint,
            clerkId, // LINKED
            alias: newAlias,
            cid: newCid,
            riskScore: 0,
            firstSeen: new Date(),
            lastSeen: new Date()
        });

        // Log it
        await db.insert(securityEvents).values({
            fingerprint,
            eventType: "System Handshake",
            payload: "Identity Created (Auth)",
            riskScoreImpact: 0,
            actionTaken: "Allowed",
            ipAddress: "127.0.0.1",
            location: "Unknown"
        });

        return {
            success: true,
            fingerprint,
            alias: newAlias,
            cid: newCid,
            riskScore: 0,
            migrated: false
        };

    } catch (error) {
        console.error("Sync Identity Failed:", error);
        return { success: false, error: "Database Sync Error" };
    }
}

