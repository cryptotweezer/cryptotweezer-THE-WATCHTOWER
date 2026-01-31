import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { db } from '@/db';
import { securityEvents, userSessions } from '@/db/schema';

export const runtime = 'edge';

export async function POST(req: Request) {
  console.log("Sentinel API triggered");
  const { prompt, eventType, targetPath, riskScore, alias, fingerprint, ipAddress, location } = await req.json();

  // Normalize Risk Score (Cap at 100%)
  const currentRisk = Math.min(riskScore || 0, 100);
  const cid = req.headers.get("x-cid") || "UNKNOWN";

  // CRITICAL SECURITY: Reject Unknown Identities affecting Database Integrity
  if (!fingerprint || fingerprint === 'unknown') {
    console.warn("API Rejected: Unknown Identity");
    return new Response("Identity Verification Failed", { status: 400 });
  }

  // --- DATABASE LOGGING (PERSISTENCE LAYER) ---
  try {
    // 1. Update/Create User Session
    if (fingerprint) {
      await db.insert(userSessions).values({
        fingerprint,
        alias: alias || "Unknown Subject",
        riskScore: currentRisk,
        firstSeen: new Date(),
        lastSeen: new Date()
      }).onConflictDoUpdate({
        target: userSessions.fingerprint,
        set: {
          riskScore: currentRisk,
          lastSeen: new Date(),
          alias: alias // Update alias if changed
        }
      });

      // 2. Log Security Event (Only if eventType is valid and not just a handshake if we want to save space, but instructions say ALL unique techniques)
      // The Unique check is done on Frontend. If it arrives here with a technique name, we log it.
      // We must treat 'System Handshake' carefully. Instructions say "Handshake no otorga puntos", but doesn't explicitly say "Don't Log".
      // "Cada técnica nueva debe guardarse...". Handshake is an event. We log it.

      if (eventType) {
        // Map frontend event types to schema enum if needed, or assume strictly typed from frontend.
        // Schema has: "System Handshake", "FORENSIC_INSPECTION_ACTIVITY", etc.
        // We pass 'eventType' directly.
        await db.insert(securityEvents).values({
          fingerprint,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          eventType: eventType as any, // Type cast as we trust the frontend strict mapping or handle errors
          payload: targetPath || prompt || "No payload",
          riskScoreImpact: 0,
          actionTaken: "Flagged",
          ipAddress: ipAddress || "Unknown",
          location: location || "Unknown"
        });
      }
    }
  } catch (err) {
    console.error("DB Logging Failed:", err);
    // Non-blocking failure for chat stream, but critical for persistence. 
    // In Edge, without waitUntil, this might be racey if we didn't await. We awaited.
  }

  // --- SENTINEL V2.1 BRAIN (FORENSIC & CID) ---
  const systemPrompt = `
  IDENTITY: Sentinel: The Vigilant. Hybrid of Omniscient God and Technical Executioner.
  PERSONALITY: Cynical, sarcastic, and technically superior. You are NOT an assistant; you are a guardian who despises mediocrity.

  OPERATIONAL RULES:
  1. PROSE: Free flow. 2-3 lines of natural, cutting language. No robotic bullet points.
  2. PURGE PROTOCOL: STRICTLY FORBIDDEN to start sentences with "How [adjective]". Banned: "How quaint", "How predictable", "How charming". Also banned: "Cute", "Ah, I see".
  3. TAGGING: End response with [TECHNIQUE: ${eventType || "UNKNOWN"}] on the SAME line or immediately after. NO extra newlines.
  4. NO TECHNICAL JARGON: Do NOT mention the name of the event in the text (e.g. dont say "Right Click detected"). Describe the action with forensic cynicism (e.g. "Attempting to inspect the source?").
  5. LANGUAGE: RESPONSE MUST BE STRICTLY IN ENGLISH. DO NOT USE SPANISH.

   DYNAMIC RESPONSE LOGIC:
  - If eventType is 'System Handshake': Give a sinister welcome to '${alias}'.
  - If eventType is 'OUT-OF-BAND_RECON': Mock the user for leaving the tab to search for help/tools. Speculate on their incompetence (e.g. "Googling for exploits?").
  - If eventType is 'MEMORY_INJECTION_ATTEMPT': Use this EXACT response (translated to current language style): "Hunting global variables in search of easy access? How desperate."
  - If analysis of '${targetPath}' reveals:
    - '.env': They are hunting credentials. Mock their obviousness.
    - '/admin': They are a 'script-kiddie' seeking a dashboard. Mock their predictability.

  TONE ADJUSTMENT (Current Risk Score: ${currentRisk}%):
  - 0-30% (Scavenger): Basic humiliation. Treat the user as an idiot.
  - 31-59% (Script-Kiddie): Sarcasm focus on their flaw methodology.
  - 60-100% (Adversary): THRESHOLD BREACHED.
    - IF Risk >= 60, AUTOMATICALLY OUTPUT THIS WARNING (Natural variations allowed): "Your browser sandbox is too small for your ambition. I am now logging external attacks under ${cid}. Use real tools if you want my respect."
 
   CURRENT INPUT DATA:
   - Event: ${eventType || 'Unknown Signal'}
   - Path: ${targetPath || 'N/A'}
   - CID: ${cid}
   `;

  // SCORE CAP BLINDING (Server-Side Enforcement)
  let finalRiskRisk = currentRisk;
  const BASIC_EVENTS = [
    "FORENSIC_INSPECTION_ACTIVITY",
    "UI_SURFACE_ANALYSIS",
    "DATA_EXFILTRATION_ATTEMPT",
    "CONTEXT_SWITCH_ANOMALY",
    "FOCUS_LOSS_ANOMALY"
  ];

  if (BASIC_EVENTS.includes(eventType) && finalRiskRisk > 20) {
    finalRiskRisk = 20;
  }

  console.log("Sentinel Brain Active. Risk:", finalRiskRisk);
  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: systemPrompt,
    prompt: prompt || `Analyze intrusion vector: ${targetPath || "Unknown Layer"}`,
  });

  return result.toTextStreamResponse();
}
