import { headers } from "next/headers";
import { getRecentThreats, getThreatCount } from "@/lib/security";
import { getOrCreateSession } from "@/lib/session";
import HomeTerminal from "@/components/watchtower/HomeTerminal";

export const dynamic = "force-dynamic";

export default async function Home() {
  const threatCount = await getThreatCount();
  const recentEvents = await getRecentThreats(5);

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

  return (
    <HomeTerminal
      threatCount={threatCount}
      recentEvents={recentEvents}
      identity={identity}
    />
  );
}
