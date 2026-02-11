
import { db } from "@/db";
import { userSessions, securityEvents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

// Shared fingerprint resolution — MUST be used by ALL server pages.
// Priority: Arcjet → Cookie → Header → Random
// Cookie is SSoT because it's set once by middleware and persists 1 year.
// Header is a fallback for the first request (before cookie roundtrip).
export function resolveFingerprint(
    arcjetFingerprint: string | null | undefined,
    headersList: Headers,
    cookieStore: ReadonlyRequestCookies
): string {
    // 1. Arcjet (production — stable in prod, unstable in dev)
    if (arcjetFingerprint) return arcjetFingerprint;
    const arcjetHeader = headersList.get("x-arcjet-fingerprint");
    if (arcjetHeader) return arcjetHeader;

    // 2. Cookie (stable — set once by middleware, persists 1 year)
    const cookie = cookieStore.get("watchtower_node_id");
    if (cookie?.value) return cookie.value;

    // 3. Middleware header (fallback for first request before cookie roundtrip)
    const middlewareId = headersList.get("x-watchtower-node-id");
    if (middlewareId) return middlewareId;

    // 4. Random (last resort — should never happen in normal flow)
    return "node_temp_" + crypto.randomUUID().substring(0, 8);
}



const ADJECTIVES = ["Hidden", "Neon", "Silent", "Binary", "Digital", "Ghost", "Iron", "Zero", "Shadow", "Electric"];
const NOUNS = ["Fox", "Wolf", "Specter", "Cipher", "Signal", "Node", "Link", "Protocol", "Spider", "Hawk"];

// Deterministic or Random Alias Generator
export function generateCyberAlias(): string {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    return `${adj}-${noun}`;
}

export async function getOrCreateSession(fingerprint: string, clerkId?: string) {
    let session;

    // 1. Prioridad 1: Buscar por Clerk ID si está disponible
    if (clerkId) {
        session = await db.select().from(userSessions).where(eq(userSessions.clerkId, clerkId)).limit(1);
        if (session.length > 0) {
            // Found by Clerk ID. Only update lastSeen. The fingerprint associated with this Clerk ID
            // should remain its original primary key.
            await db.update(userSessions)
                .set({ lastSeen: new Date() })
                .where(eq(userSessions.clerkId, clerkId));
            return session[0];
        }
    }

    // 2. Prioridad 2: Buscar por Fingerprint
    // Esto se ejecutará si no hay clerkId, O si hay clerkId pero no se encontró una sesión con él.
    const anonymousSessionByFingerprint = await db.select().from(userSessions).where(eq(userSessions.fingerprint, fingerprint)).limit(1);

    if (anonymousSessionByFingerprint.length > 0) {
        const existingSession = anonymousSessionByFingerprint[0];
        // Si tenemos un clerkId y la sesión existente es anónima (sin clerkId), actualizarla.
        if (clerkId && !existingSession.clerkId) {
            await db.update(userSessions)
                .set({ clerkId: clerkId, lastSeen: new Date() })
                .where(eq(userSessions.fingerprint, fingerprint));
            return { ...existingSession, clerkId: clerkId };
        }
        // Si no hay clerkId, o la sesión ya tiene un clerkId, simplemente devolverla.
        // Asegurarse de actualizar lastSeen
        await db.update(userSessions)
            .set({ lastSeen: new Date() })
            .where(eq(userSessions.fingerprint, fingerprint));
        return existingSession;
    }

    // 3. Si no se encontró ninguna sesión (ni por clerkId ni por fingerprint actual), crear una nueva.
    const newAlias = generateCyberAlias();
    const newCid = `CID-${Math.floor(100 + Math.random() * 900)}-${Math.random().toString(36).substring(2, 3).toUpperCase()}`;

    const newSessionEntry = await db.insert(userSessions).values({
        fingerprint: fingerprint,
        clerkId: clerkId || null, // VINCULAR SIEMPRE CLERKID SI ESTÁ DISPONIBLE
        alias: newAlias,
        cid: newCid,
        riskScore: 0,
        lastSeen: new Date(),
        firstSeen: new Date(),
    }).returning();

    return {
        ...newSessionEntry[0],
        cid: newCid // Asegurarse de que el CID generado se devuelva correctamente
    };
}

/**
 * GET-only session lookup. Returns session or null — NEVER creates.
 * Priority: clerkId first, then fingerprint.
 */
export async function getSession(fingerprint: string, clerkId?: string) {
    if (clerkId) {
        const byClerk = await db.select().from(userSessions).where(eq(userSessions.clerkId, clerkId)).limit(1);
        if (byClerk.length > 0) return byClerk[0];
    }
    const byFp = await db.select().from(userSessions).where(eq(userSessions.fingerprint, fingerprint)).limit(1);
    if (byFp.length > 0) {
        // Link clerkId if the session is anonymous and caller provides one
        if (clerkId && !byFp[0].clerkId) {
            await db.update(userSessions)
                .set({ clerkId })
                .where(eq(userSessions.fingerprint, fingerprint));
            return { ...byFp[0], clerkId };
        }
        return byFp[0];
    }
    return null;
}

export async function getSessionLogs(fingerprint: string, limit?: number) {
    const query = db.select()
        .from(securityEvents)
        .where(eq(securityEvents.fingerprint, fingerprint))
        .orderBy(desc(securityEvents.timestamp));

    if (limit) {
        // Drizzle's limit() needs to be applied to the query builder
        // We can just await the query first if we want, OR use .limit() carefully.
        // Simplified:
        const logs = await query.limit(limit);
        return formatLogs(logs);
    }

    const logs = await query;
    return formatLogs(logs);
}

export async function checkAndIncrementRoutingProbe(fingerprint: string): Promise<boolean> {
    const session = await getSession(fingerprint);
    if (!session) return true; // Fail open if no session (shouldn't happen)

    if (session.routingProbeCount >= 3) {
        return false; // Limit reached
    }

    await db.update(userSessions)
        .set({ routingProbeCount: session.routingProbeCount + 1 })
        .where(eq(userSessions.fingerprint, fingerprint));

    return true; // Allowed
}

function formatLogs(logs: typeof securityEvents.$inferSelect[]) {

    return logs.map(log => {
        const time = log.timestamp ? new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false }) : "00:00:00";
        let displayEvent = log.eventType;

        // Reconstruct display logic if needed or just use raw eventType
        // The previous context logic had some specific formatting for "ROUTING_PROBE_HEURISTICS" and "IDENTITY_REVEAL_PROTOCOL"
        // But storing formatted strings in DB is cleaner, OR we replicate logic here.
        // For now, raw eventType + payload is a good start, but HomeTerminal expects strings.

        if (log.eventType === "IDENTITY_REVEAL_PROTOCOL" || log.eventType === "IDENTITY_REVEAL") {
            displayEvent = "TAGGED: SCRIPT-KIDDIE";
        } else if (log.eventType === "ROUTING_PROBE_HEURISTICS" && log.route) {
            displayEvent = `ROUTING_PROBE_HEURISTICS -> ${log.route}`;
        }

        return `> [${time}] DETECTED: [${displayEvent}]`;

    });
}

export async function getUniqueTechniquesForSession(fingerprint: string): Promise<string[]> {
    const events = await db.select({ eventType: securityEvents.eventType })
        .from(securityEvents)
        .where(eq(securityEvents.fingerprint, fingerprint));

    const uniqueTechniques = new Set<string>();
    events.forEach(event => uniqueTechniques.add(event.eventType));

    return Array.from(uniqueTechniques);
}

