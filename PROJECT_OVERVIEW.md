# Digital Twin III – “The Cyber-Hardened Portfolio”

> **"Hack me if you can."**

## Project Vision
**Digital Twin III** challenges you to transform your personal portfolio into a cyber-secured, intelligence-driven digital asset. It is no longer just a showcase of work; it is an active target and a live cyber lab.

## The Three Central Roles
1.  **Represent You**: Interactive Identity with AI Chatbot and MCP-driven content.
2.  **Defend You**: Active Perimeter detecting and blocking attacks (SQLi, Bots).
3.  **Learn For You**: Threat Intelligence collecting real-time attack telemetry.

## System Architecture: Six Layers of Defense
| Layer | Component | Responsibility |
| :--- | :--- | :--- |
| **1. Public Interface** | Next.js + Shadcn | Trust no input. Funnel to server actions. |
| **2. App Logic** | Server Actions | Zero-trust. Authenticate & validate everything. |
| **3. AI Governance** | MCP + Vercel AI | Prevent malicious prompts. Verify tool calls. |
| **4. Data Integrity** | Neon + Drizzle | Schema validation. Encryption. |
| **5. Network Defense** | Arcjet WAF | Block bots and anomalies at the edge. |
| **6. Observability** | Monitoring | Continuous threat intelligence. |

## Feature Specification: The Cyber Battleground
### 1. Threat Telemetry Dashboard (SOC Panel)
*   **Live Metrics**: Recent attacks, attack types, and triggered defense layers.
*   **Dynamic Threat Levels**: 🟢 Green, 🟡 Yellow, 🔴 Red, ⚫ Black.
*   **AI Analyst**: Automatically classifies attacks and generates summary reports.

### 2. Ethical Hacking Zone ("Test My Cybersecurity")
*   **🧪 Prompt Injection Sandbox**: Visitors try to break AI rules.
*   **🧪 SQL Injection Learning Field**: Visitors try SQL payloads.
*   **🧪 Auth & Access Abuse**: Visitors try to bypass login or escalate roles.

## Technical Standards
*   **Framework**: Next.js 16+ (App Router).
*   **WAF**: Arcjet Web Application Firewall.
*   **Database**: Neon Postgres with Drizzle ORM.
*   **AI**: Vercel AI SDK v6 (Model Context Protocol).
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
