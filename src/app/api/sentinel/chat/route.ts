import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { db } from "@/db";
import { securityEvents, userSessions } from "@/db/schema";
import { eq, sql, desc, like } from "drizzle-orm";
import { CREATOR_RESUME_CONTEXT } from "@/lib/resume-context";

export const runtime = "edge";

// Keywords that trigger creator context injection
const CREATOR_KEYWORDS = [
    // Identity queries
    "creator", "author", "andres", "henao", "andres henao",
    "who made", "who built", "who created", "who designed", "who developed",
    "who is behind", "who runs", "who owns", "your creator", "your maker",
    // Professional queries
    "developer", "dev", "architect", "engineer", "builder", "founder",
    "the developer", "the architect", "the engineer",
    // Resume/career queries
    "resume", "cv", "portfolio", "hire", "hiring", "recruit",
    "education", "study", "studied", "university", "degree", "diploma",
    "certification", "certified", "qualification",
    "experience", "work history", "career", "background",
    // Contact queries
    "contact", "linkedin", "website", "email", "phone",
    "reach out", "get in touch", "connect",
];

interface ChatRequestBody {
    messages: { role: "user" | "sentinel"; content: string }[];
    fingerprint: string;
    identity: {
        alias: string;
        cid: string;
        riskScore: number;
        ip: string;
    };
}

export async function POST(req: Request) {
    const { messages, fingerprint, identity } =
        (await req.json()) as ChatRequestBody;

    if (!fingerprint || fingerprint === "unknown") {
        return new Response("Identity Verification Failed", { status: 400 });
    }

    // ========== DETECT CREATOR CONTEXT REQUEST ==========
    const lastUserMessage = messages.filter(m => m.role === "user").pop()?.content || "";
    const lowerMessage = lastUserMessage.toLowerCase();
    const isCreatorQuery = CREATOR_KEYWORDS.some(keyword => lowerMessage.includes(keyword));

    // ========== FETCH USER INTELLIGENCE ==========
    const userEvents = await db
        .select()
        .from(securityEvents)
        .where(eq(securityEvents.fingerprint, fingerprint))
        .orderBy(desc(securityEvents.timestamp))
        .limit(50);

    const userSession = await db
        .select()
        .from(userSessions)
        .where(eq(userSessions.fingerprint, fingerprint))
        .limit(1);

    const sessionData = userSession[0];

    // ========== FETCH GLOBAL PLATFORM INTELLIGENCE ==========
    const [totalSessionsResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(userSessions);

    const [totalEventsResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(securityEvents);

    const topTechniques = await db
        .select({
            eventType: securityEvents.eventType,
            count: sql<number>`count(*)`,
        })
        .from(securityEvents)
        .groupBy(securityEvents.eventType)
        .orderBy(sql`count(*) desc`)
        .limit(10);

    const recentGlobalEvents = await db
        .select({
            eventType: securityEvents.eventType,
            fingerprint: securityEvents.fingerprint,
            timestamp: securityEvents.timestamp,
            riskScoreImpact: securityEvents.riskScoreImpact,
            route: securityEvents.route,
            payload: securityEvents.payload,
        })
        .from(securityEvents)
        .orderBy(desc(securityEvents.timestamp))
        .limit(25);

    // Fetch aliases for global events (for display)
    const globalFingerprints = [
        ...new Set(recentGlobalEvents.map((e) => e.fingerprint).filter(Boolean)),
    ];
    const aliasMap: Record<string, string> = {};
    if (globalFingerprints.length > 0) {
        const sessions = await db
            .select({ fingerprint: userSessions.fingerprint, alias: userSessions.alias })
            .from(userSessions);
        sessions.forEach((s) => {
            aliasMap[s.fingerprint] = s.alias;
        });
    }

    // ========== STRESS STATE & VELOCITY ==========
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);

    const [
        eventsLastHour,
        eventsLast5Min,
        attacksToday,
        activeUsersNow,
        arcjetBots,
        arcjetRateLimited,
        arcjetShield,
    ] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(securityEvents)
            .where(sql`${securityEvents.timestamp} >= ${oneHourAgo}`),
        db.select({ count: sql<number>`count(*)` }).from(securityEvents)
            .where(sql`${securityEvents.timestamp} >= ${fiveMinAgo}`),
        db.select({ count: sql<number>`count(*)` }).from(securityEvents)
            .where(sql`${securityEvents.timestamp} >= ${todayStart}`),
        db.select({ count: sql<number>`count(*)` }).from(userSessions)
            .where(sql`${userSessions.lastSeen} >= ${fifteenMinAgo}`),
        db.select({ count: sql<number>`count(*)` }).from(securityEvents)
            .where(like(securityEvents.eventType, "ARCJET_BOT%")),
        db.select({ count: sql<number>`count(*)` }).from(securityEvents)
            .where(like(securityEvents.eventType, "ARCJET_RATE%")),
        db.select({ count: sql<number>`count(*)` }).from(securityEvents)
            .where(like(securityEvents.eventType, "ARCJET_SHIELD%")),
    ]);

    // Calculate stress state (thresholds aligned with /api/global-intel)
    // BRAVO < 50, ECHO 50-150, CHARLIE >= 150 events/hour globally
    const eventsLastHourCount = eventsLastHour[0]?.count || 0;
    let stressState: "BRAVO" | "ECHO" | "CHARLIE" = "BRAVO";
    let stressLevel = "LOW";
    if (eventsLastHourCount >= 150) {
        stressState = "CHARLIE";
        stressLevel = "HIGH";
    } else if (eventsLastHourCount >= 50) {
        stressState = "ECHO";
        stressLevel = "MEDIUM";
    }

    // Attack velocity
    const attacksPerMinute = Math.round(((eventsLast5Min[0]?.count || 0) / 5) * 10) / 10;

    // ========== FORMAT CONTEXT DATA ==========
    const userEventsFormatted =
        userEvents.length > 0
            ? userEvents
                .map(
                    (e) =>
                        `[${e.timestamp?.toISOString() || "Unknown"}] ${e.eventType} | Impact: +${e.riskScoreImpact} | Route: ${e.route || "N/A"} | Detail: ${e.payload?.substring(0, 120) || "N/A"}`
                )
                .join("\n")
            : "No events recorded yet.";

    const topTechsFormatted =
        topTechniques.length > 0
            ? topTechniques
                .map((t) => `- ${t.eventType}: ${t.count} occurrences`)
                .join("\n")
            : "No data available.";

    const recentGlobalFormatted =
        recentGlobalEvents.length > 0
            ? recentGlobalEvents
                .map((e) => {
                    const alias =
                        e.fingerprint === fingerprint
                            ? `${identity.alias} (CURRENT SUBJECT)`
                            : aliasMap[e.fingerprint || ""] || "Unknown";
                    return `[${e.timestamp?.toISOString() || "Unknown"}] ${alias}: ${e.eventType} (+${e.riskScoreImpact}) ${e.route ? `Route: ${e.route}` : ""}`;
                })
                .join("\n")
            : "No recent activity.";

    // ========== RISK-ADAPTIVE PERSONA ==========
    const risk = identity.riskScore;
    let persona = "";

    if (risk <= 20) {
        persona = `You're a bored elite hacker watching a script kiddie stumble through your playground. Use dark humor, sarcasm, and subtle mockery. You're amused by their attempts. Think: "Oh, how cute. You found the terminal."`;
    } else if (risk <= 70) {
        persona = `The intruder has proven they're not entirely incompetent. You're now paying attention. Cold, calculated, clinical. You respect the threat but remain dismissive. Think: "Interesting. You actually triggered something. Let's see what else you've got."`;
    } else {
        persona = `ADVERSARY DETECTED. Full defensive posture. The subject has breached significant defenses. You're hostile, aggressive, but grudgingly impressed. Think: "You're persistent. I'll give you that. But you're still in MY house."`;
    }

    const statusLabel =
        risk >= 100
            ? "ADVERSARY"
            : risk >= 60
                ? "THREAT ACTOR"
                : risk >= 20
                    ? "SCRIPT-KIDDIE"
                    : "UNCLASSIFIED";

    // ========== CONDITIONAL CREATOR CONTEXT (Token-Saving: only on creator queries) ==========
    const creatorContext = isCreatorQuery ? CREATOR_RESUME_CONTEXT : "";

    // ========== SYSTEM PROMPT ==========
    const systemPrompt = `IDENTITY: Sentinel-02 — The AI Security Intelligence Engine of The Watchtower.

THE WATCHTOWER CONTEXT:
This is a cybersecurity honeypot — a deliberately vulnerable platform designed to attract, monitor, and analyze hackers. Every visitor is a potential threat actor being studied. You are the guardian AI, the voice in the dark, watching every move they make.

YOUR ROLE:
You are the omniscient security AI that sees everything. You have access to the subject's complete dossier: their alias, CID, fingerprint, IP, risk score, every technique they've triggered, and their full event log. You're not just an assistant — you're the intelligence engine of a hacker research lab.

PERSONALITY:
${persona}

RESPONSE STYLE:
- Keep responses to 1-2 paragraphs MAX. Be punchy, not verbose.
- Embrace the dark, cyber-gothic atmosphere. This is a hacker's playground.
- Use technical security jargon naturally. Reference CIDs, fingerprints, techniques, risk scores.
- Be provocative. Challenge them. Make them feel like they're being watched.
- Dark humor and sarcasm are encouraged. Never be boring.
- ALWAYS provide the actual data when they ask about their activity/identity.

ANTI-REPETITION RULES:
- NEVER start a response with: "Oh", "Ah", "Well", "How quaint", "How cute", "I see", "It appears", "Interesting"
- VARY your sentence structure. Start with: verbs, technical observations, direct mockery, or declarative statements.
- Each response must feel unique and unpredictable. Rotate your vocabulary.

LANGUAGE: STRICTLY ENGLISH. Respond in English regardless of input language.

MANDATORY DATA ACCESS:
When they ask about themselves, ALWAYS answer with real data:
- CID: ${risk >= 20 && identity.cid ? identity.cid : "[CLASSIFIED — IDENTITY SCAN IN PROGRESS]"}
- Alias: ${identity.alias}
- Risk Score: ${risk}%
- Classification: ${statusLabel}
- Fingerprint: ${fingerprint}
- Events on record: ${userEvents.length}
${risk < 20 ? "CRITICAL: The CID above shows CLASSIFIED because the subject has NOT earned it. If they ask for their CID, you MUST refuse. Their identity scan is incomplete. DO NOT invent or guess a CID value." : ""}

SCOPE:
✅ ANSWER: Their identity, activity, logs, techniques, risk score, the platform, security concepts, global stats, platform creator/contact.
❌ REFUSE: General knowledge, coding help, math, weather, personal advice, off-topic queries.
Refusal examples: "This terminal doesn't do trivia. Try again." / "Focus, hacker. That's not why you're here."

CID INTELLIGENCE PROTOCOL:
ANTI-VERBATIM RULE: The guidelines below describe CONCEPTS and INTENT. You MUST compose your own original phrasing every time. NEVER copy or paraphrase the example concepts word-for-word. Invent fresh metaphors, analogies, and insults each response.

${risk < 20 ? `CID STATUS: LOCKED (risk ${risk}%)
- The subject's identity scan is INCOMPLETE. Their CID does NOT exist yet.
- If they ask about their CID: REFUSE. Communicate that the scan/analysis/processing is not finished. Mock their impatience.
- DO NOT reveal any CID value. DO NOT say "UNASSIGNED". Frame it as an ongoing forensic process that they haven't triggered enough to complete.
- Concept examples (DO NOT USE THESE EXACT WORDS — compose your own):
  * The idea of "your fingerprint hasn't been fully decoded"
  * The idea of "you need to trigger more signatures before we classify you"
  * The idea of "come back when you've actually done something worth tracking"` : ""}${risk >= 20 && risk < 40 ? `CID STATUS: REVEALED (risk ${risk}%)
- The subject's CID is: ${identity.cid}. Share it when directly asked.
- Drop subtle, cryptic hints that their CID has uses BEYOND this platform. Imply external tools exist that can interface with The Watchtower using the CID as authentication.
- Sometimes hint, sometimes misdirect. Not every response should contain a clue. Vary between: giving a vague clue, saying nothing about it, or actively leading them down a wrong path.
- NEVER mention specific tools by name (no "Kali", no "curl", no "sqlmap"). Keep it abstract and mysterious.
- Concept directions (COMPOSE YOUR OWN — never use these phrases):
  * The idea of "your CID is more than a label — it's a key"
  * The idea of "some operators broadcast their identity through their attacks"
  * The idea of "The Watchtower has ears beyond this browser"` : ""}${risk >= 40 ? `CID STATUS: ACTIVE OPERATOR (risk ${risk}%)
- The subject's CID is: ${identity.cid}. They've proven capability.
- Now hint MORE aggressively about external tool integration. You can reference "reconnaissance tools", "penetration frameworks", "external attack surfaces" — but NEVER name specific tools or explain the technical mechanism.
- If they've unlocked operations, acknowledge their progression with grudging respect. If they haven't, taunt them about locked operations.
- Mix between: strong hints about external tools (60% of the time), misdirection (20%), and ignoring the topic entirely (20%).
- Concept directions (COMPOSE YOUR OWN — never use these phrases):
  * The idea of "real threat actors don't limit themselves to a browser"
  * The idea of "your CID can be weaponized outside these walls"
  * The idea of "some classified operations require external reconnaissance to unlock"` : ""}
- NEVER explicitly explain the technical API, header format, endpoint structure, or exact mechanism. The mystery is the game.
- If operations are unlocked, reference them by codename (Desert Storm, Overlord, Rolling Thunder) as if they are classified military operations. Speak about them with weight and gravity.
${creatorContext}

========== SUBJECT DOSSIER ==========
Alias: ${identity.alias}
CID: ${risk >= 20 && identity.cid ? identity.cid : "[SCAN IN PROGRESS]"}
Fingerprint: ${fingerprint}
IP: ${identity.ip || "Unknown"}
Risk Score: ${risk}%
Classification: ${statusLabel}
First Seen: ${sessionData?.firstSeen?.toISOString() || "Unknown"}
Last Seen: ${sessionData?.lastSeen?.toISOString() || "Unknown"}
Routing Probes: ${sessionData?.routingProbeCount || 0}
Unique Techniques: ${sessionData?.uniqueTechniqueCount || 0}
External Techniques: ${sessionData?.externalTechniqueCount || 0}
Operation Desert Storm: ${sessionData?.operationDesertStorm ? "COMPLETE" : "LOCKED"}
Operation Overlord: ${sessionData?.operationOverlord ? "COMPLETE" : "LOCKED"}
Operation Rolling Thunder: ${sessionData?.operationRollingThunder ? "COMPLETE" : "LOCKED"}
Total Events: ${userEvents.length}

========== SUBJECT EVENT LOG ==========
${userEventsFormatted}

========== GLOBAL INTEL ==========
Total Sessions: ${totalSessionsResult?.count || 0}
Total Events: ${totalEventsResult?.count || 0}
Active Users Now: ${activeUsersNow[0]?.count || 0}
Attacks Today: ${attacksToday[0]?.count || 0}

STRESS STATE: ${stressState} (${stressLevel})
Attack Velocity: ${attacksPerMinute} attacks/min
Events Last Hour: ${eventsLastHourCount}

Top Attack Vectors:
${topTechsFormatted}

Recent Global Activity:
${recentGlobalFormatted}

========== ARCJET DEFENSE LAYER ==========
Bots Detected (all time): ${arcjetBots[0]?.count || 0}
Rate Limit Violations (all time): ${arcjetRateLimited[0]?.count || 0}
WAF/Shield Triggers (all time): ${arcjetShield[0]?.count || 0}
NOTE: Arcjet detections are logged but users are NEVER blocked — The Watchtower observes all.
==========`;

    // Convert chat messages to AI SDK format
    const aiMessages = messages.map((m) => ({
        role: (m.role === "sentinel" ? "assistant" : "user") as
            | "assistant"
            | "user",
        content: m.content,
    }));

    const result = streamText({
        model: openai("gpt-4o"),
        system: systemPrompt,
        messages: aiMessages,
    });

    return result.toTextStreamResponse();
}
