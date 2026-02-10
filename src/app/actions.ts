"use server";

import { db } from "@/db";
import { securityEvents, userSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
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
 * Forensic Wipe — permanently erases all traces from The Watchtower.
 * Deletes security events first (FK constraint), then the session itself.
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
