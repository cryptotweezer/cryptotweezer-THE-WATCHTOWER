🛰️ PROJECT OVERVIEW: THE WATCHTOWER (v2.0)
"The Boss Final of Cyber-Defense Portfolios." > A Total Surveillance Infrastructure and High-Fidelity Honeypot designed to dissect adversary persistence.

🏛️ 1. STRATEGIC VISION
The Watchtower is an Active SecOps Operating System. Its objective is to capture real-time attack telemetry and transform every intrusion attempt into an infamy metric. The system utilizes Sentinel-02 (a hostile resident AI) to manage an "Escape Room" experience where only the most sophisticated players can leave their mark.

🏛️ 2. IDENTITY PROTOCOL (CLEARANCE)
The system classifies traffic through an intent-detection engine:

The Subject of Interest (Adversary): The standard flow. The Sentinel is cynical, hostile, and challenging. The user must "hack" their way to infamy by overcoming the 20% Hard Cap on routine actions.

The Authorized Observer (Recruiter): Activated via ?clearance=RECRUITER. The Sentinel switches to Briefing Mode, acting as a technical pre-sales agent explaining the stack, architecture, and the developer's engineering capabilities.

🏛️ 3. OPERATIONAL MODULES
A. The Terminal (Homepage) - Reconnaissance
Deep Scan HUD: Forensic identification of the visitor (OS, Browser Engine, IP Reputation, Timezone).

Infamy Engine (Tier 1): Automated scoring system that rewards basic reconnaissance (F12, Clicks, Routing Probes) up to a strict limit of 20% (Status: SCRIPT-KIDDIE).

Criminal ID (CID): Persistent identifier linked to the server-side fingerprint (Arcjet) and the database (Neon).

B. The War Room (Dashboard) - Command Center
Global Threat Map: Geo-spatial visualization of blocked attacks in real-time worldwide.

System Stress Meter: Dynamic load indicator based on request saturation detected by Arcjet (Cyan -> Orange -> Red Glitch).

Sentinel V2 (Uplink): Conversational terminal with security event memory. Allows the user to interrogate the AI about their own detected attacks.

C. The Triple Lock (Elite Honeypots)
To exceed 90% infamy, the attacker must trigger three logic traps:

Binary-Ghost: Client-side memory tampering (window._VGT_DEBUG_) detected via JS Proxy.

Shadow-Field: Hidden attribute injection in JSON payloads (API Over-posting).

Ghost-Key: Exploitation of information "leaks" hidden within source code comments.

D. The Wall of Infamy & Ghost Layer
Wall of Infamy: A permanent "deface" wall where only those who reach 100% Risk (Status: ADVERSARY) can leave an immutable signed message in the DB.

Ghost Layer: A UI Hijack system. There are no boring 404 errors; if the user accesses prohibited routes, the interface corrupts, and the Sentinel initiates a persistent visual counter-attack.

🏛️ 4. TECH STACK & STANDARDS
Framework: Next.js 15+ (App Router) with Server Component-oriented architecture.

Active Security: Arcjet (WAF, Bot Detection, Fingerprinting, Rate Limiting).

Persistence: Neon (Serverless Postgres) + Drizzle ORM (Immutable Event Logs).

Neural Layer: Vercel AI SDK (Sentinel-02 personality & forensic context).

Infrastructure: Vercel Edge Runtime (Minimum latency, maximum security).

🏛️ 5. DEVELOPMENT STANDARDS
Log Protocol: Mandatory updates to docs/DEVELOPMENT_LOG.md for every session.

Conventional Commits: feat:, fix:, security:, docs:.

Branching Strategy: feature/ based development with main validation.

Zero-Trust UI: The interface reacts to the riskScore stored in the DB, not just local state.