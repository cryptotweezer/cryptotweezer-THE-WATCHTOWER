# Digital Twin III – "SecOps & Active Defense Platform"

> **"Defensive Teacher: Learn by Attacking."**

## 1. Vision Overview
The project evolves from a static portfolio to a **SecOps Operations Platform** and **Threat Learning Lab**. The system not only showcases achievements but acts as a "Defensive Teacher": a self-defending infrastructure that collects real-time attack telemetry and offers a dual experience (Learning for novices / Challenge for experts).

## 2. User Profiles
The platform detects visitor behavior to classify them:

1.  **The Apprentice (Novice)**: Users without technical knowledge. The AI acts as a mentor, explaining security concepts.
2.  **The Adversary (Expert)**: Users with hacking tools. The system acts as a challenge, blocking attacks and logging payloads.

## 3. Functional Modules

### A. The Watchtower (Live Telemetry Dashboard)
*   **Live Threat Feed**: Visual log of attack attempts processed by Arcjet (SQLi, XSS, Bots).
*   **Global Defcon Level**: Dynamic status indicator changing based on attack frequency.
*   **Threat Heatmap**: Geographic visualization of blocked origins.

### B. Session Intel (Personalized Dashboard)
*   **Fingerprinting**: Tracking users without login/registration.
*   **Risk Score (0-100)**: Individual score based on hostile actions.
*   **Forensic Activity Log**: AI translates technical logs into a narrative (e.g., "Detected specific auth bypass attempt").

### C. Ethical Sandboxes (Attack Lab)
*   **SQL Injection**: Vulnerable search simulation to demonstrate Drizzle protection.
*   **Prompt Injection**: AI Chatbot with governance directives to break.
*   **IDOR & Broken Access**: API routes protected by session logic.
*   **AI Sidekick**: Assistant providing hints to novices.

### D. Hall of Fame (Gamification)
*   **Research Points**: Awarded for discovering "Easter Eggs" or completing tutorials.
*   **Leaderboard**: Public ranking using AI-generated aliases for privacy.

## 4. Active Defense Strategy (Under the Hood)
*   **Tarpitting**: Slowing responses for high-risk users.
*   **Immutable Logs**: Secure database schemas preventing user alteration of security events.
*   **Zero-Trust AI**: Output filters preventing sensitive data leakage.

## Technical Standards
*   **Framework**: Next.js (App Router) - Scalable Production.
*   **App Security**: Arcjet (WAF, Bot Detection, Rate Limiting).
*   **Database & ORM**: Neon (PostgreSQL) + Drizzle ORM (Immutable Audit).
*   **Intelligence Engine**: Vercel AI SDK (Forensic Analysis & Mentorship).
*   **Infrastructure**: Vercel (Optimized for $0 Cost).
*   **Email**: Resend API (SPF/DKIM/DMARC).

## Project Management & Collaboration (ClickUp)
**Mandatory Usage**: Verification of discipline and progress.
*   **Structure**: Explicit lists for UI, AI Agent, Backend, and Doc tasks.
*   **Evidence**: Tasks linked to Git PRs/Commits.

## GitHub Workflow & Standards
**Mandatory Process** for traceability and hygiene.
*   **Branching**: `feature/`, `bugfix/`, `hotfix/`, `chore/`.
*   **Commits**: Conventional (`feat:`, `fix:`).
*   **Flow**: Branch → Dev → PR (Review) → Merge. No direct commits to main.

## Weekly Workflow Standards
**Mandatory Routine** to ensure professional delivery.
*   **Mon (Planning)**: Review status, assign owners, set targets.
*   **Tue-Thu (Development)**: Daily Stand-ups.
*   **Fri (Review)**: Testing & Retrospective.
*   **Status Pipeline**: `PLANNING` → `READY` → `IN PROGRESS` → `IN TEST` → `DONE`.

## Weekly Calibration Call
**Mandatory 1-Hour Session** for technical steering.
*   **Preparation**: Update ClickUp, Prepare Live Demo, Document Blockers.
*   **Agenda**: Showcase → Tech Review → Blockers → Commitments.

## Deliverables & Assessment
### 1. Production Deployed Web App (Vercel)
*   Active Custom Domain & SSL.
*   Live Attack Zones & Threat Dashboard.
*   **Pass Condition**: Must survive real exploitation attempts.

### 2. GitHub Repository
*   Public (or shared).
*   Professional Commit History.
*   **Clean Repo**: No `.env` files, secrets, or PII.

### 3. Written Evidence Package (PDF)
*   **Cyber Maturity**: Mapping controls to OWASP Top 10.
*   **Security Testing**: Logs/Screenshots of simulated attacks and alerts.

## Presentation Requirements (Live Demo)
A 15-minute live demonstration proving operational maturity:
1.  **Production Live**: Running on custom domain.
2.  **Live Defense**: Mock Prompt Injection & SQLi blocked.
3.  **Real-Time Telemetry**: Dashboard updates & Threat Level changes.
4.  **Incident Response**: Trigger live Email Alert.
5.  **Process**: Show Git Branching & ClickUp.

## Week 1 Submission Requirements (The Three Pillars)
Establishing collaborative infrastructure and AI-ready knowledge.
*   **GitHub Proof (PDF)**: Collaborators + Commit Graph (1+ commit/member).
*   **ClickUp Evidence**: AI-Ready Board with AI-parsable tasks.
*   **Repository Files**: `prd.md`, `agents.md`, `README.md`.

## Week 2 Submission Requirements (Design & Plan)
From requirements to actionable technical design.
*   **ClickUp**: Week 1-2 progress.
*   **GitHub History**: Provenance and AI collaboration.
*   **`docs/design.md`**: AI-generated from PRD.
*   **`docs/implementation-plan.md`**: AI-generated from Design.

## Week 3 Submission Requirements (Interim Working Solution)
Making AI interactive and tested.
*   **ClickUp**: Week 1-3 velocity.
*   **GitHub History**: MCP commits.
*   **Technical**: `src/mcp-server/`, `.vscode/mcp.json`.

## Week 4 Submission Requirements (Refine)
Production readiness and optimization.
### Item 1: ClickUp Board (Screenshot)
*   **Status**: Week 1-4 cumulative. Majority tasks "Complete".

### Item 2: GitHub Commit History (PDF)
*   **Content**: Deployment and refinement activities.

### Item 3: Vercel Production URL
*   **Status**: Publicly accessible, running, and stable.

### Item 4: Performance Improvement
*   **Evidence**: Data refinement log and performance comparison (Target achieved).
*   **Checklist**:
    *   [ ] Data refinement log committed.
    *   [ ] Performance comparison committed.

## Week 5 Submission Requirements (Final Features & Outline)
Final polish and presentation preparation.
### Item 1: ClickUp Board (Screenshot)
*   **Progress**: Week 1-5 cumulative. 80%+ tasks "Complete".
*   **Tasks**: Must show "Create presentation slides", "Practice demo", "Final bug fixes".
*   **Optional Scope**: Visible if attempted.

### Item 2: GitHub Commit History (PDF)
*   **Content**: Final touches (e.g., `fix: resolve edge case`, `feat: add interview analytics`).
*   **Timeline**: Weeks 1-5 continuous history.

### Item 3: Presentation Outline (`docs/presentation-outline.md`)
*   **Content**: Script/Outline for the Week 6 demo (based on Presentation Requirements).
*   **Purpose**: Ensures coverage of all critical points (Live Defense, Telemetry, etc.).

### Week 5 Checklist
*   [ ] `docs/presentation-outline.md` committed.
*   [ ] ClickUp screenshot (showing presentation tasks) committed.
*   [ ] All final bug fixes and features committed.
*   [ ] All team members have Week 5 commits.

---
*Awaiting further requirements...*
