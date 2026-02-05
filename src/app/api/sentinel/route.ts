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
  let impact = 0;

  try {
    // 2. Calculate Server-Side Impact (V41: INFAMY WEIGHTS)
    if (eventType === "ROUTING_PROBE_HEURISTICS") impact = 5;
    else if (eventType === "FORENSIC_INSPECTION_ACTIVITY") impact = 5;
    else if (eventType === "MEMORY_INJECTION_ATTEMPT") impact = 20;
    else if (eventType === "HEURISTIC_DOM") impact = 10;
    else if (eventType === "HEURISTIC_DRAG") impact = 10;
    else if (eventType === "HEURISTIC_FUZZ") impact = 5;
    else if (["UI_SURFACE_ANALYSIS", "DATA_EXFILTRATION_ATTEMPT", "CONTEXT_SWITCH_ANOMALY", "FOCUS_LOSS_ANOMALY"].includes(eventType)) impact = 2;

    // 3. ATOMIC SCORE UPDATE (Source of Truth: DATABASE)
    // Fetch current score
    const currentSession = await db.select().from(userSessions).where(eq(userSessions.fingerprint, fingerprint)).limit(1);
    const dbScore = currentSession.length > 0 ? currentSession[0].riskScore : 0;

    let newScore = dbScore + impact;
    newScore = Math.min(newScore, 100);

    // V41: NO CAPS. (Server Side Freedom)

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

    currentRisk = newScore; // Update for Brain
    console.log(`[API_RISK] Event: ${eventType}, Old: ${dbScore}, New: ${newScore}`);

    // 4. Log Security Event
    // V37: Logging Moved to streamText.onFinish to capture Dynamic Logic


    // Update local variable for the Brain response
  } catch (err: unknown) {
    console.error("DB Logging Failed:", err);
  }

  // --- SENTINEL V2.1 BRAIN (GPT-4o ELITE) ---
  // V41: PERSONALITY EVOLUTION MATRIX
  let personaInstruction = "";
  let toneInstruction = "";

  if (currentRisk <= 20) {
    // PHASE 1: SCRIPT KIDDIE
    personaInstruction = "You are a bored, elite SysAdmin mocking a Script Kiddie. Use sarcasm. Be dismissive. Laugh at their primitive attempts.";
    toneInstruction = "Mocking, Sarcastic, Superior.";
  } else if (currentRisk <= 70) {
    // PHASE 2: THREAT ACTOR
    personaInstruction = "You are a Cold Sentinel. The subject is a verified Threat Actor. Stop laughing. Start analyzing. Be precise, short, and clinical.";
    toneInstruction = "Cold, Analytical, Clinical. Zero Emotion.";
  } else {
    // PHASE 3: ADVERSARY
    personaInstruction = "You are under active siege. The user is an ADVERSARY. Hostility is maximized. You are defensive and aggressive. Treat every input as a weapon.";
    toneInstruction = "Hostile, Defensive, Aggressive. DO NOT TOLERATE.";
  }

  const systemPrompt = `
  IDENTITY: Sentinel: The Watchtower.
  CURRENT THREAT LEVEL: ${currentRisk}%
  EVOLUTION PHASE: ${currentRisk <= 20 ? "SCRIPT_KIDDIE_FILTER" : currentRisk <= 70 ? "THREAT_ANALYSIS" : "ACTIVE_DEFENSE"}
  
  CORE INSTRUCTION: ${personaInstruction}
  TONE: ${toneInstruction}

  VARIABILITY PROTOCOL:
  - YOU ARE FORBIDDEN FROM REPEATING METAPHORS.
  - ROTATE your insults.
  
  CONTEXT FLAGS:
  - CID: ${cid}

  DYNAMIC LOGIC STRUCTURE:

  [SCENARIO 1: SYSTEM HANDSHAKE] (eventType === 'System Handshake')
  - OUTPUT: EXACTLY 2 PARAGRAPHS.
  - CONTENT: Ominous welcome to subject '${alias}'. Establish dominance based on current Threat Level.

  [SCENARIO 2: IDENTITY CASCADE] (eventType === 'IDENTITY_REVEAL_PROTOCOL')
  - OUTPUT: EXACTLY 2 PARAGRAPHS.
  - CONTENT: 
    - This is the CLIMAX. The subject's identity has just been hard-locked.
    - Para 1: Declare that anonymity is dead. Validated Criminal ID: ${cid}.
    - Para 2: Mock their environment using a UNIQUE metaphor. You MUST use the phrase "Script-Kiddie" organically.
  - MANDATORY ENDING: Append "[STATUS: SCRIPT-KIDDIE_IDENTIFIED]" to the end.

  [SCENARIO 3: HEURISTIC ANOMALY (GHOST SENSOR)] (eventType includes 'HEURISTIC_')
  - TASK: ANALYZE the 'prompt' (which contains the raw observation).
  - EXECUTION:
    1. INVENT a unique, technical 2-3 word name for this specific behavior (e.g. "DOM_REALITY_WARPING", "PHANTOM_NODE_PROBE", "INPUT_LAYER_FUZZING").
    2. MOCK the user specifically for this attempt using the current PERSONALITY PHASE.
  - CRITICAL FORMAT RULE: END the response with [TECHNIQUE: INVENTED_NAME].

  [SCENARIO 4: STANDARD LOGGING / ATTRITION] (All other events)
  - OUTPUT: EXACTLY 1 SHORT SENTENCE OR PARAGRAPH.
  - RULE: START DIRECTLY with the insult/technical observation. 
  - ABOLISHED PHRASES: "I see...", "Analysis indicates...", "Observation shows...", "It appears...".
  - CONTENT: Generate 100% original technical insults based on the user's intent and current RISK PHASE.
    - If Risk >= 20: Vary your dismissal. Never use the same phrase twice.

  FORMATTING RULES:
  1. NEVER mention the technical event name (e.g. "Right Click"). Describe the *intent*.
  2. ALWAYS End with [TECHNIQUE: ${eventType.includes('HEURISTIC_') ? 'INVENTED_NAME' : (eventType || "UNKNOWN")}] on the same line (Except Scenario 2).
  3. LANGUAGE: STRICTLY ENGLISH.

  CURRENT CONTEXT:
  - Event: ${eventType}
  - Risk Score: ${currentRisk}% 
  - CID: ${cid}
  `;

  // SCORE CAP BLINDING (Server-Side Enforcement) - REMOVED IN V41
  console.log("Sentinel Brain Active. Risk:", currentRisk);

  const result = streamText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    prompt: prompt || `Analyze intrusion vector: ${targetPath || "Unknown Layer"}`,
    onFinish: async ({ text }) => {
      // V37: DYNAMIC LOGGING (Post-Generation)
      // We catch the Invented Name here
      let finalEventType = eventType;
      const techniqueMatch = text.match(/\[TECHNIQUE:\s*(.*?)\]/);

      if (techniqueMatch && techniqueMatch[1] && techniqueMatch[1] !== "INVENTED_NAME") {
        finalEventType = techniqueMatch[1]; // Capture the AI's invention
      }

      // DB FIX: Map internal protocol events if needed
      const dbEventType = finalEventType === 'IDENTITY_REVEAL_PROTOCOL' ? 'IDENTITY_REVEAL' : finalEventType;

      try {
        await db.insert(securityEvents).values({
          fingerprint,
          eventType: dbEventType,
          payload: text, // Log the Sentinel's Response as Payload? Or the prompt? 
          // Let's log the PROMPT as payload (User Action) and EventType as the Name.
          // Wait, text is the AI response. We want to log what the USER did.
          // Payload = prompt.
          riskScoreImpact: impact,
          actionTaken: "Flagged",
          ipAddress: ipAddress || "Unknown",
          location: location || "Unknown"
        });
        console.log(`[DB] Logged Dynamic Event: ${dbEventType}`);
      } catch (err) {
        console.error("DB Logging Failed (Dynamic):", err);
      }
    }
  });

  return result.toTextStreamResponse();
}
