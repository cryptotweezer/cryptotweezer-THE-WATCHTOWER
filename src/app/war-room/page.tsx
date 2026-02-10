import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getSessionLogs, getUniqueTechniquesForSession } from "@/lib/session";
import { runArcjetSecurity } from "@/lib/arcjet";
import { logArcjetDetection } from "@/lib/security";
import { currentUser } from "@clerk/nextjs/server";

import WarRoomShell from "@/components/war-room/WarRoomShell";

export const dynamic = "force-dynamic";

export default async function WarRoomPage() {
    const user = await currentUser();

    // Run Arcjet Security (Shield, Bot Detection, Rate Limiting)
    const arcjetResult = await runArcjetSecurity();

    const headersList = await headers();
    let fingerprint = arcjetResult.fingerprint || headersList.get("x-arcjet-fingerprint");
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

    // GET-only — no session creation. Must go through Gatekeeper first.
    const session = await getSession(fingerprint, user?.id);

    if (!session) {
        redirect("/");
    }

    const uniqueTechniques = await getUniqueTechniquesForSession(session.fingerprint);

    // Extract country code from middleware header
    const countryCode = headersList.get("x-watchtower-country") || "UNKNOWN";

    // Log Arcjet detections (non-blocking — just telemetry)
    if (arcjetResult.isDenied) {
        logArcjetDetection(arcjetResult, session.fingerprint, ip, countryCode);
    }

    const identity = {
        alias: session.alias,
        fingerprint: session.fingerprint,
        cid: session.cid,
        riskScore: session.riskScore,
        ip: ip,
        countryCode: countryCode,
        sessionTechniques: uniqueTechniques,
        uniqueTechniqueCount: session.uniqueTechniqueCount
    };

    // Ghost Route Detection: Read path set by middleware rewrite
    const invokePath = headersList.get("x-watchtower-ghost-path") || undefined;

    // WAR ROOM: FULL HISTORICAL ACCESS (no limit)
    const fullLogs = await getSessionLogs(identity.fingerprint);

    return <WarRoomShell identity={identity} initialLogs={fullLogs} invokePath={invokePath} />;
}
