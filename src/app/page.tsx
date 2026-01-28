import { headers } from "next/headers";
import { getThreatCount } from "@/lib/security";
import { getOrCreateSession } from "@/lib/session";
import HomeTerminal from "@/components/watchtower/HomeTerminal";

export const dynamic = "force-dynamic";

export default async function Home() {
  const threatCount = await getThreatCount();


  // Data Hoisting: Identify User on Server
  const headersList = await headers();
  let fingerprint = headersList.get("x-arcjet-fingerprint");
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

  // Fallback for Dev/Bypass Mode if fingerprint is missing
  if (!fingerprint || fingerprint === "unknown") {
    fingerprint = "dev_" + Buffer.from(ip).toString('hex').substring(0, 12);
  }

  // Database Handshake
  const session = await getOrCreateSession(fingerprint);

  const identity = {
    alias: session.alias,
    fingerprint: session.fingerprint,
    riskScore: session.riskScore,
    ip: ip
  };

  // Check for Sentinel Trap (Ghost Routes)
  // const sentinelTrap = headersList.get("x-sentinel-trap");
  // CRITICAL FIX: Capture the actual path the user tried to access
  const rawPath = headersList.get("x-invoke-path") || "/unknown";

  /*
  const initialAlert = sentinelTrap
    ? { type: "protocol_violation", source: "network_intercept", payload: rawPath }
    : undefined;
  */

  // Session Persistence
  // const cookieStore = await cookies();
  // const isSessionActive = cookieStore.has("access_granted");

  return (
    <HomeTerminal
      threatCount={threatCount}
      identity={identity}
      invokePath={rawPath}
    />
  );
}
