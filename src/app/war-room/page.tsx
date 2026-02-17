import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getSessionLogs, getUniqueTechniquesForSession, resolveFingerprint } from "@/lib/session";
import { runArcjetSecurity } from "@/lib/arcjet";
import { logArcjetDetection } from "@/lib/security";
import { currentUser } from "@clerk/nextjs/server";
import { generateIntegrityToken } from "@/lib/honeypot-data";

import WarRoomShell from "@/components/war-room/WarRoomShell";

export const dynamic = "force-dynamic";

export default async function WarRoomPage() {
    const user = await currentUser();

    // Run Arcjet Security (Shield, Bot Detection, Rate Limiting)
    const arcjetResult = await runArcjetSecurity();

    const headersList = await headers();
    const cookieStore = await cookies();
    const fingerprint = resolveFingerprint(arcjetResult.fingerprint, headersList, cookieStore);
    const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    // DB calls wrapped in try/catch — redirect home on failure instead of showing raw error
    try {
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

        // Dynamic risk cap based on operation milestones
        let riskCap = 40;
        if (session.operationDesertStorm) riskCap = 60;
        if (session.operationOverlord) riskCap = 80;
        if (session.operationRollingThunder) riskCap = 90;

        // Operation milestones
        const operations = {
            desertStorm: session.operationDesertStorm,
            overlord: session.operationOverlord,
            rollingThunder: session.operationRollingThunder,
        };

        const identity = {
            alias: session.alias,
            fingerprint: session.fingerprint,
            cid: session.cid,
            riskScore: session.riskScore,
            ip: ip,
            countryCode: countryCode,
            sessionTechniques: uniqueTechniques,
            uniqueTechniqueCount: session.uniqueTechniqueCount,
            riskCap,
            operations,
        };

        // Ghost Route Detection: Read path set by middleware rewrite
        const invokePath = headersList.get("x-watchtower-ghost-path") || undefined;

        // WAR ROOM: FULL HISTORICAL ACCESS (no limit)
        const fullLogs = await getSessionLogs(identity.fingerprint);

        // Honeypot: Generate integrity token for Operation Overlord contact form
        const cookieId = cookieStore.get("watchtower_node_id")?.value;
        const integrityToken = await generateIntegrityToken(cookieId || fingerprint);

        return <WarRoomShell identity={identity} operations={operations} initialLogs={fullLogs} invokePath={invokePath} integrityToken={integrityToken} />;
    } catch (err) {
        console.error("[DB] War Room page DB query failed — redirecting home:", err);
        redirect("/");
    }
}
