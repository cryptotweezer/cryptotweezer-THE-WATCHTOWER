import { headers, cookies } from "next/headers";
import { getThreatCount, logArcjetDetection } from "@/lib/security";
import { getSession, getSessionLogs, getUniqueTechniquesForSession } from "@/lib/session";
import { runArcjetSecurity } from "@/lib/arcjet";
import { currentUser } from "@clerk/nextjs/server";

import HomeTerminal from "@/components/watchtower/HomeTerminal";

export const dynamic = "force-dynamic";

export default async function Home() {
  const threatCount = await getThreatCount();
  const user = await currentUser();

  // Run Arcjet Security (Shield, Bot Detection, Rate Limiting)
  const arcjetResult = await runArcjetSecurity();

  // Data Hoisting: Identify User on Server
  const headersList = await headers();
  let fingerprint = arcjetResult.fingerprint || headersList.get("x-arcjet-fingerprint");
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

  if (!fingerprint) {
    const middlewareId = headersList.get("x-watchtower-node-id");
    if (middlewareId) {
      fingerprint = middlewareId;
    } else {
      const cookieStore = await cookies();
      const storedNodeId = cookieStore.get("watchtower_node_id");
      if (storedNodeId) {
        fingerprint = storedNodeId.value;
      } else {
        fingerprint = "node_temp_" + crypto.randomUUID().substring(0, 8);
      }
    }
  }

  // Extract country code from middleware header
  const countryCode = headersList.get("x-watchtower-country") || "UNKNOWN";

  // Ghost Route Detection: Read the path set by middleware rewrite
  const rawPath = headersList.get("x-watchtower-ghost-path") || "/";

  // GET-only session lookup — no creation until Gatekeeper handshake
  const session = await getSession(fingerprint, user?.id);

  if (session) {
    // Existing session — full identity flow
    const uniqueTechniques = await getUniqueTechniquesForSession(session.fingerprint);
    const initialLogs = await getSessionLogs(session.fingerprint, 10);

    // Log Arcjet detections (non-blocking telemetry)
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
      uniqueTechniqueCount: session.uniqueTechniqueCount,
    };

    return (
      <HomeTerminal
        threatCount={threatCount}
        identity={identity}
        invokePath={rawPath}
        initialLogs={initialLogs}
      />
    );
  }

  // No session — pass fingerprint for Gatekeeper handshake
  const pendingIdentity = {
    alias: "",
    fingerprint: fingerprint,
    cid: null as string | null,
    riskScore: 0,
    ip: ip,
    countryCode: countryCode,
    sessionTechniques: [] as string[],
    uniqueTechniqueCount: 0,
  };

  return (
    <HomeTerminal
      threatCount={threatCount}
      identity={pendingIdentity}
      needsHandshake
      clerkId={user?.id || null}
      invokePath={rawPath}
      initialLogs={[]}
    />
  );
}
