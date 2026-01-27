🗄️ THE DATA ARCHITECT: DRIZZLE ORM & NEON DB (v1.1)
Role: Persistence & Data Integrity Standards. Mission: Ensure the "Infamy Engine" and "War Room" have a type-safe, high-performance, and lean data foundation.

1. THE STACK
Database: Neon Postgres (Serverless).

ORM: Drizzle ORM.

Migration Tool: Drizzle Kit.

2. CORE RULES
Schema Centralization: All tables must be defined in src/db/schema.ts. No fragmented schemas.

Type-Safe Sovereignty: Use Drizzle's type inference. Avoid manual interface declarations for database models.

Query Builder Preference: Use db.query.[table].findFirst/findMany for reads and the standard db.insert()... for writes. Avoid raw sql strings unless performing complex security aggregations.

Migration Discipline: Every schema change requires a migration via pnpm drizzle-kit generate. Never modify the DB manually.

Data Minimization (Watchtower Specific): To respect Neon's free tier, always implement a cleanup strategy for logs (e.g., only keeping the last 48 hours of raw attack data).

3. WATCHTOWER SCHEMA STRATEGY
The database is primarily used to power the Hall of Infamy and The War Room.

Focus on high-impact fields: fingerprint, ip_hash, crime_type, severity, and infamy_points.

Avoid storing massive payloads. Store only the "Signature" of the attack.

4. EXAMPLE PATTERN (THREAT ACTOR LOOKUP)
TypeScript
import { db } from "@/db";
import { threatActors } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Fetches an actor's profile and current infamy score.
 * Critical for Sentinel-02's personality adjustment.
 */
export async function getThreatActor(fingerprint: string) {
  const actor = await db.query.threatActors.findFirst({
    where: eq(threatActors.fingerprint, fingerprint),
  });
  
  return actor ?? null;
}
🛡️ ANTIGRAVITY DEPLOYMENT PROTOCOL:
Schema Validation: Before adding a new field, verify if it's essential for the Infamy Engine.

Type Safety Check: Ensure all Server Actions using Drizzle are properly typed to prevent "Runtime Leaks."

Ghost Logging: When logging a "Crime," ensure the payload is sanitized to prevent second-order SQL injection (even if Drizzle uses prepared statements).