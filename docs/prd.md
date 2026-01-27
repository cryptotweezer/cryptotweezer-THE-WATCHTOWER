📑 PRODUCT REQUIREMENTS DOCUMENT (PRD): THE WATCHTOWER (v1.1)
Status: Living Document (Active Defense Pivot) Vision: Transform a standard portfolio into a self-defending cyber-asset that captures, analyzes, and gamifies real-world attacks.

1. PROJECT OVERVIEW
Digital Twin III (The Watchtower) is a SecOps & Active Defense Platform. It acts as a defensive teacher by offering a dual experience: mentoring "Apprentices" through forensic analysis and challenging "Adversaries" through a hardened, reactive infrastructure (The Honeypot).

2. STRATEGIC OBJECTIVES
Observe: Capture 100% of incoming request metadata and digital fingerprints.

Defend: Implement a multi-layered perimeter (Arcjet + Next.js Middleware) to block SQLi, XSS, and Bots.

Engage: Use Sentinel-02 (AI) to provide real-time, personality-driven feedback to users based on their threat level.

Gamify: Convert failed attacks into "Infamy Points" to fuel a global leaderboard.

3. FUNCTIONAL REQUIREMENTS
3.1 Core Modules
The Watchtower (Homepage): Initial entry point. Features the Gatekeeper handshake and real-time identity telemetry.

The War Room (Dashboard): Central command center. Displays global attack heatmaps, system stress levels, and a live incident feed.

The Ghost Layer: Deceptive routing that intercepts probes to /admin or .env, feeding attackers "noise" while logging their signatures.

The Hall of Infamy: A leaderboard ranking the top 10 most persistent threat actors based on their sophisticated attempts.

3.2 Security & AI Logic
Threat Phases: Dynamic UI reaction states (Alpha/Blue, Bravo/Amber, Charlie/Red Glitch).

Sentinel-02: Vercel AI SDK integration for streaming "Combat Logs" and forensic reports with a cynical, authoritative persona.

Arcjet Enforcement: Mandatory WAF rules, Rate Limiting, and Bot verification on all sensitive nodes.

3.3 Data Architecture
Immutable Logging: Secure storage of attack payloads and headers in Neon Postgres.

Data Retention: Automated 48-hour rotation for raw logs to maintain lean operations.

4. USER STORIES (REFINED)
As an Apprentice, I want to see the "Forensic Report" of my failed attempt so I can understand the underlying vulnerability and its mitigation.

As an Adversary, I want to test the perimeter's limits to see my alias rise in the "Hall of Infamy."

As an Architect, I want to monitor the "Global Stress Level" to see how the infrastructure handles real-world traffic spikes and bot-nets.

5. SUCCESS CRITERIA (MVP)
Handshake Protocol: 100% functional Gatekeeper animation and data capture.

Phase Transition: System correctly escalates from Alpha to Charlie based on behavior.

Zero-Leaked Secrets: No successful bypass of the middleware to reach protected server actions.

Infamy Persistence: Scores are correctly calculated and saved in the Neon database.