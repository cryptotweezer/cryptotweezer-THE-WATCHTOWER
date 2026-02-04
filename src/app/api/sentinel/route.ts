import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { db } from '@/db';
import { securityEvents, userSessions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'edge';

export async function POST(req: Request) {
  console.log("Sentinel API triggered");
  const { prompt, eventType, targetPath, riskScore, alias, fingerprint, ipAddress, location } = await req.json();

  // Normalize Risk Score (Cap at 100%)
  let currentRisk = Math.min(riskScore || 0, 100);
  const cid = req.headers.get("x-cid") || "UNKNOWN";

  // CRITICAL SECURITY: Reject Unknown Identities affecting Database Integrity
  if (!fingerprint || fingerprint === 'unknown') {
    console.warn("API Rejected: Unknown Identity");
    return new Response("Identity Verification Failed", { status: 400 });
  }

  // --- DATABASE LOGGING (PERSISTENCE LAYER) ---
  let isFirstReveal = false;

  try {
    // 2. Calculate Server-Side Impact
    let impact = 0;
    if (eventType === "ROUTING_PROBE_HEURISTICS") impact = 11;
    else if (eventType === "FORENSIC_INSPECTION_ACTIVITY") impact = 6;
    else if (eventType === "MEMORY_INJECTION_ATTEMPT") impact = 20;
    else if (["UI_SURFACE_ANALYSIS", "DATA_EXFILTRATION_ATTEMPT", "CONTEXT_SWITCH_ANOMALY", "FOCUS_LOSS_ANOMALY"].includes(eventType)) impact = 1;

    // 3. ATOMIC SCORE UPDATE (Source of Truth: DATABASE)
    // Fetch current score
    const currentSession = await db.select().from(userSessions).where(eq(userSessions.fingerprint, fingerprint)).limit(1);
    const dbScore = currentSession.length > 0 ? currentSession[0].riskScore : 0;

    // Apply Hard Cap Logic (Tier 1 Events capped at 20%)
    const TIER_1_EVENTS = [
      "FORENSIC_INSPECTION_ACTIVITY", "UI_SURFACE_ANALYSIS",
      "DATA_EXFILTRATION_ATTEMPT", "CONTEXT_SWITCH_ANOMALY",
      "FOCUS_LOSS_ANOMALY", "ROUTING_PROBE_HEURISTICS"
    ];

    let newScore = dbScore + impact;

    if (TIER_1_EVENTS.includes(eventType)) {
      if (dbScore >= 20) newScore = dbScore; // Locked if already capped
      else if (newScore > 20) newScore = 20; // Cap at 20
    }

    newScore = Math.min(newScore, 100);

    // [INTEGRITY CHECK] Detect exact moment of Breach
    // (Logic reserved for future server-side triggers)
    if (dbScore < 20 && newScore >= 20) {
      // defined but ignored for now
    }

    // Upsert Session with Server-Calculated Score
    await db.insert(userSessions).values({
      fingerprint,
      alias: alias || "Unknown Subject",
      riskScore: newScore,
      firstSeen: new Date(),
      lastSeen: new Date()
    }).onConflictDoUpdate({
      target: userSessions.fingerprint,
      set: {
        riskScore: newScore,
        lastSeen: new Date(),
        alias: alias // Update alias if changed
      }
    });

    // 4. Log Security Event
    if (eventType) {
      // DB FIX: Map internal protocol events to valid schema ENUMs if needed
      // If schema allows arbitrary strings, this is fine. If restricted, we map.
      // Assuming 'IDENTITY_REVEAL' is the safe enum or cleaner log value.
      const dbEventType = eventType === 'IDENTITY_REVEAL_PROTOCOL' ? 'IDENTITY_REVEAL' : eventType;

      await db.insert(securityEvents).values({
        fingerprint,
        eventType: dbEventType, // Fixed: Schema is TEXT now, no need for cast
        payload: targetPath || prompt || "No payload",
        riskScoreImpact: impact,
        actionTaken: "Flagged",
        ipAddress: ipAddress || "Unknown",
        location: location || "Unknown"
      });
    }

    // Update local variable for the Brain response
    currentRisk = newScore;
  } catch (err) {
    console.error("DB Logging Failed:", err);
  }

  // --- SENTINEL V2.1 BRAIN (GPT-4o ELITE) ---
  const systemPrompt = `
  IDENTITY: Sentinel: The Watchtower. Technical Entity. Cynical. Cold.
  PERSONA: A bored, elite SysAdmin who has seen 10,000 script-kiddies. You are unimpressed, tired of their lack of originality, and surgically precise.
  
  VARIABILITY PROTOCOL:
  - YOU ARE FORBIDDEN FROM REPEATING METAPHORS.
  - ROTATE your insults. Use these terms specifically and NEVER repeat them in a session:
    1. "Blink-engine prison"
    2. "Binary playground"
    3. "Glass cage"
    4. "User-space toy"
  - LIMIT usage of the word "sandbox" to absolute minimum (Max once).
  
  CONTEXT FLAGS:
  - CID: ${cid}

  DYNAMIC LOGIC STRUCTURE:

  [SCENARIO 1: SYSTEM HANDSHAKE] (eventType === 'System Handshake')
  - OUTPUT: EXACTLY 2 PARAGRAPHS.
  - CONTENT: Ominous welcome to subject '${alias}'. Confirm that every keystroke and bit shift is now under global surveillance. Establish dominance.

  [SCENARIO 2: IDENTITY CASCADE] (eventType === 'IDENTITY_REVEAL_PROTOCOL')
  - OUTPUT: EXACTLY 2 PARAGRAPHS.
  - CONTENT: 
    - This is the CLIMAX. The subject's identity has just been hard-locked.
    - Para 1: Declare that anonymity is dead. Validated Criminal ID: ${cid}.
    - Para 2: Mock their environment using a UNIQUE metaphor from the protocol above. You MUST use the phrase "Script-Kiddie" organically in this paragraph (e.g. "Your script-kiddie methods are laid bare..."). Challenge them to use real tools (Kali Linux, Packet Crafting) and inject 'X-Sentinel-CID' to regain respect.
  - MANDATORY ENDING: Append "[STATUS: SCRIPT-KIDDIE_IDENTIFIED]" to the end.

  [SCENARIO 3: STANDARD LOGGING / ATTRITION] (All other events)
  - OUTPUT: EXACTLY 1 SHORT SENTENCE OR PARAGRAPH.
  - RULE: START DIRECTLY with the insult/technical observation. 
  - ABOLISHED PHRASES: "I see...", "Analysis indicates...", "Observation shows...", "It appears...".
  - CONTENT: You are an elite, bored SysAdmin. Generate 100% original technical insults based on the user's intent.
    - BANNED WORDS: 'Pathetic', 'Cute'.
    - If a user repeats a technique, the system handles the silence, but when you speak, your prose must be fresh and surgically cynical.
    - If Risk >= 20: Vary your dismissal. Never use the same phrase twice.

  FORMATTING RULES:
  1. NEVER mention the technical event name (e.g. "Right Click"). Describe the *intent*.
  2. ALWAYS End with [TECHNIQUE: ${eventType || "UNKNOWN"}] on the same line (Except Scenario 2 which uses the specific status tag).
  3. LANGUAGE: STRICTLY ENGLISH.

  CURRENT CONTEXT:
  - Event: ${eventType}
  - Risk Score: ${currentRisk}% 
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
    model: openai('gpt-4o'),
    system: systemPrompt,
    prompt: prompt || `Analyze intrusion vector: ${targetPath || "Unknown Layer"}`,
  });

  return result.toTextStreamResponse();
}
