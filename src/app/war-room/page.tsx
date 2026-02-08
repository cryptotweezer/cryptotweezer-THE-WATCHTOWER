import { headers, cookies } from "next/headers";
import { getOrCreateSession, getSessionLogs, getUniqueTechniquesForSession } from "@/lib/session";
import { currentUser } from "@clerk/nextjs/server";

import WarRoomShell from "@/components/war-room/WarRoomShell";

export const dynamic = "force-dynamic";

export default async function WarRoomPage() {
    // Mirror page.tsx identity flow for consistency
    const user = await currentUser();
    const headersList = await headers();
    let fingerprint = headersList.get("x-arcjet-fingerprint");
    const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    // Fallback for Dev/Bypass Mode
    if (!fingerprint) {
        const cookieStore = await cookies();
        const storedNodeId = cookieStore.get("watchtower_node_id");

        if (storedNodeId) {
            fingerprint = storedNodeId.value;
        } else {
            const middlewareId = headersList.get("x-watchtower-node-id");
            if (middlewareId) {
                fingerprint = middlewareId;
            } else {
                fingerprint = "node_temp_" + crypto.randomUUID().substring(0, 8);
            }
        }
    }

    // DB Hydration (SSoT)
    const session = await getOrCreateSession(fingerprint, user?.id);
    const uniqueTechniques = await getUniqueTechniquesForSession(session.fingerprint);

    const identity = {
        alias: session.alias,
        fingerprint: session.fingerprint,
        cid: session.cid,
        riskScore: session.riskScore,
        ip: ip,
        sessionTechniques: uniqueTechniques,
        uniqueTechniqueCount: session.uniqueTechniqueCount
    };

    // Ghost Route Detection: Read path set by middleware rewrite
    const invokePath = headersList.get("x-watchtower-ghost-path") || undefined;

    // WAR ROOM: FULL HISTORICAL ACCESS (no limit)
    const fullLogs = await getSessionLogs(identity.fingerprint);

    return <WarRoomShell identity={identity} initialLogs={fullLogs} invokePath={invokePath} />;
}
