🛰️ PROJECT OVERVIEW: THE WATCHTOWER (v1.1)
"Defensive Teacher: Learn by Attacking." A SecOps Operations Platform and Threat Learning Lab built on a self-defending infrastructure.

1. VISION OVERVIEW
The project transforms a static portfolio into an active Cyber-Defense Node. It functions as a "Defensive Teacher": a live laboratory that captures real-time attack telemetry and offers a dual experience: Mentorship for novices and a Hardened Challenge for experts.

2. THE DUAL EXPERIENCE (USER PROFILES)
The system classifies visitors based on their digital footprint and behavior:

The Apprentice (Novice): Users seeking knowledge. Sentinel-02 acts as a mentor, explaining security concepts and why certain actions are blocked.

The Adversary (Expert): Users using offensive tools. The system acts as a hardened target, intercepting payloads, logging signatures, and mocking their lack of sophistication.

3. FUNCTIONAL MODULES
A. The Watchtower (Homepage & Live Telemetry)
Live Threat Feed: Real-time visual log of processed attempts (SQLi, XSS, Bots) via Arcjet.

Global Stress Level: A dynamic status indicator (Alpha, Bravo, Charlie) based on attack frequency.

Identity HUD: Real-time display of the visitor's fingerprint, IP reputation, and risk score.

B. The War Room (Global Dashboard)
Threat Heatmap: Geographic visualization of blocked origins worldwide.

System Metrics: Visual representation of the infrastructure's resilience and load under stress.

Incident Feed: A scrolling log of neutralized threats from the global community.

C. The Integrated Honeypot (Active Defense)
Deceptive Routes: Intercepting probes to /admin, .env, and sensitive paths to feed "Ghost Data" to attackers.

Live Attack Analysis: Sentinel-02 translates raw technical logs into a forensic narrative.

Adaptive HUD: The UI changes aesthetics (Blue to Red Glitch) based on the user's detected hostility.

D. The Hall of Infamy (Gamification)
Infamy Points: Awarded to adversaries for persistent or sophisticated attempts.

Leaderboard: Public ranking of the top 10 "Threat Actors," encouraging ethical research and competition.

4. TECHNICAL STANDARDS & STACK
Framework: Next.js 15/16 (App Router) - Server-side security by default.

App Security: Arcjet (WAF, Bot Detection, Rate Limiting, Tarpitting).

Database: Neon (Postgres) + Drizzle ORM (Type-safe, immutable security logs).

Intelligence: Vercel AI SDK (Sentinel-02 personality & forensic reports).

Infrastructure: Vercel (Edge-optimized, $0 cost architecture).

5. REPOSITORY & WORKFLOW STANDARDS
Branching: Strict usage of feature/, bugfix/, hotfix/, and chore/.

Commits: Conventional Commits standard (feat:, fix:, docs:) + Team Member attribution.

Management: 100% of tasks tracked in ClickUp, linked to GitHub Pull Requests.

The Archivist: Mandatory session logging in docs/DEVELOPMENT_LOG.md.

6. WEEKLY SUBMISSION MILESTONES
Week 1-2: Infrastructure setup, PRD, Master Plans, and Handshake initialization.

Week 3: Working Sentinel-02 integration and Live Telemetry base.

Week 4: Production deployment on Vercel and performance optimization.

Week 5: Final feature hardening, Bug Bash, and Presentation Outline.

Week 6: Live Demo (The Watchtower must survive real-time exploitation attempts).