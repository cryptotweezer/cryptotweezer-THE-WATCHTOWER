import { headers, cookies } from "next/headers";
import { getThreatCount } from "@/lib/security";
import { getOrCreateSession, getSessionLogs, getUniqueTechniquesForSession } from "@/lib/session";
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

  // V34: PERSISTENCE STRATEGY
  // 1. Arcjet Fingerprint (Best for Security/Bot Detection)
  // 2. Middleware Node ID (Best for Long-Term Device Persistence)

  if (!fingerprint) {
    // If Arcjet didn't fingerprint (e.g. dev mode or bypass), fallback to Middleware ID
    const middlewareId = headersList.get("x-watchtower-node-id");
    if (middlewareId) {
      fingerprint = middlewareId;
    } else {
      // Last Resort: Cookie read directly (Redundant if Middleware works, but safe)
      const cookieStore = await cookies();
      const storedNodeId = cookieStore.get("watchtower_node_id");
      if (storedNodeId) {
        fingerprint = storedNodeId.value;
      } else {
        // Absolute fallback (should never happen)
        fingerprint = "node_temp_" + crypto.randomUUID().substring(0, 8);
      }
    }
  } else {
    // INNOVATION: Even if Arcjet gives us a fingerprint, we might prefer the STABLE Node ID
    // if the user is "Trusted" but Arcjet rotated the fingerprint (e.g. IP change).
    // However, for now, let's trust Arcjet as primary, but if it's missing, we have the backup.

    // Actually, let's dual-link them in the future. For now, this is sufficient.
  }

  // Database Handshake (Auth Aware)
  const session = await getOrCreateSession(fingerprint, user?.id);
  const uniqueTechniques = await getUniqueTechniquesForSession(session.fingerprint);

  const identity = {
    alias: session.alias,
    fingerprint: session.fingerprint,
    cid: session.cid,
    riskScore: session.riskScore,
    ip: ip,
    sessionTechniques: uniqueTechniques,
    uniqueTechniqueCount: session.uniqueTechniqueCount,
  };

  // Ghost Route Detection: Read the path set by middleware rewrite
  const rawPath = headersList.get("x-watchtower-ghost-path") || "/";

  /*
  const initialAlert = sentinelTrap
    ? { type: "protocol_violation", source: "network_intercept", payload: rawPath }
    : undefined;
  */

  // SIGNAL INTELLIGENCE: Validated Logs from DB
  const initialLogs = await getSessionLogs(identity.fingerprint, 10);

  // Session Persistence

  // const cookieStore = await cookies();
  // const isSessionActive = cookieStore.has("access_granted");

  return (
    <HomeTerminal
      threatCount={threatCount}
      identity={identity}
      invokePath={rawPath}
      initialLogs={initialLogs}
    />

  );
}
