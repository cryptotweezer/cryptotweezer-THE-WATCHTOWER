"use server";

import { db } from "@/db";
import { securityEvents, userSessions, infamyWall } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getOrCreateSession, getSessionLogs, getUniqueTechniquesForSession } from "@/lib/session";

/**
 * Real handshake — creates the session in DB when the user clicks the Gatekeeper.
 * Returns the full identity object for client hydration.
 */
export async function performHandshake(fingerprint: string, clerkId?: string | null) {
    const session = await getOrCreateSession(fingerprint, clerkId || undefined);
    const uniqueTechniques = await getUniqueTechniquesForSession(session.fingerprint);
    const logs = await getSessionLogs(session.fingerprint, 10);

    return {
        identity: {
            alias: session.alias,
            fingerprint: session.fingerprint,
            cid: session.cid,
            riskScore: session.riskScore,
            ip: null as string | null,
            sessionTechniques: uniqueTechniques,
            uniqueTechniqueCount: session.uniqueTechniqueCount,
        },
        initialLogs: logs,
    };
}

/**
 * Update Alias — allows user to customize their identity.
 * Validates: 2-24 chars, alphanumeric + spaces/hyphens/underscores only.
 */
export async function updateAlias(fingerprint: string, newAlias: string) {
    const trimmed = newAlias.trim();

    if (trimmed.length < 2 || trimmed.length > 24) {
        return { success: false, error: "Alias must be 2-24 characters" };
    }

    if (!/^[a-zA-Z0-9 _-]+$/.test(trimmed)) {
        return { success: false, error: "Alias can only contain letters, numbers, spaces, hyphens, underscores" };
    }

    try {
        await db.update(userSessions)
            .set({ alias: trimmed, lastSeen: new Date() })
            .where(eq(userSessions.fingerprint, fingerprint));
        return { success: true, alias: trimmed };
    } catch (error) {
        console.error("[UPDATE_ALIAS] Failed:", error);
        return { success: false, error: "Failed to update alias" };
    }
}

/**
 * Post to Wall of Infamy — permanent legacy that survives Forensic Wipe.
 * Requires risk score >= 90. One message per fingerprint.
 */
export async function postInfamyMessage(fingerprint: string, message: string) {
    const trimmed = message.trim();

    if (trimmed.length < 1 || trimmed.length > 280) {
        return { success: false, error: "Message must be 1-280 characters" };
    }

    // No HTML/script tags
    if (/<[^>]*>/i.test(trimmed)) {
        return { success: false, error: "Invalid characters detected" };
    }

    try {
        // Verify risk score from DB (SSoT)
        const sessions = await db.select().from(userSessions)
            .where(eq(userSessions.fingerprint, fingerprint)).limit(1);

        if (sessions.length === 0) {
            return { success: false, error: "Session not found" };
        }

        const session = sessions[0];
        if (session.riskScore < 90) {
            return { success: false, error: "Insufficient infamy (requires 90%)" };
        }

        // Check if user already posted (one message per fingerprint)
        const existing = await db.select({ id: infamyWall.id }).from(infamyWall)
            .where(eq(infamyWall.fingerprint, fingerprint)).limit(1);

        if (existing.length > 0) {
            return { success: false, error: "You already have a message on the Wall" };
        }

        await db.insert(infamyWall).values({
            fingerprint,
            alias: session.alias,
            message: trimmed,
            riskScore: session.riskScore,
        });

        return { success: true };
    } catch (error) {
        console.error("[INFAMY_WALL] Post failed:", error);
        return { success: false, error: "Failed to post message" };
    }
}

/**
 * Get all Wall of Infamy messages — visible to all War Room users.
 */
export async function getInfamyMessages() {
    try {
        const messages = await db.select().from(infamyWall)
            .orderBy(desc(infamyWall.createdAt))
            .limit(100);
        return messages;
    } catch (error) {
        console.error("[INFAMY_WALL] Fetch failed:", error);
        return [];
    }
}

/**
 * Forensic Wipe — permanently erases all traces from The Watchtower.
 * Deletes security events first (FK constraint), then the session itself.
 * NOTE: infamy_wall entries are NOT deleted (no FK — permanent legacy).
 */
export async function forensicWipe(fingerprint: string) {
    try {
        // Delete all security events for this fingerprint
        await db.delete(securityEvents).where(eq(securityEvents.fingerprint, fingerprint));
        // Delete the session itself
        await db.delete(userSessions).where(eq(userSessions.fingerprint, fingerprint));
        return { success: true };
    } catch (error) {
        console.error("[FORENSIC_WIPE] Failed:", error);
        return { success: false };
    }
}
