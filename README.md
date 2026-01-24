# Digital Twin III - The Cyber-Hardened Portfolio

## 🎓 Project Vision
> **"Defensive Teacher: Learn by Attacking."**

**Digital Twin III** has evolved from a static portfolio into a **SecOps & Active Defense Platform**. It serves as a cyber-resilient infrastructure node that doesn't just display work—it actively defends itself, collects real-time attack telemetery, and offers a dual experience:
- **For Learners**: A mentor explaining security concepts.
- **For Adversaries**: A hardened target that gamifies the hacking experience.

This project demonstrates **Active Cyber Defense** using Arcjet (WAF), **Immutable Auditing** with Neon/Drizzle, and **Forensic AI Analysis** via Vercel AI SDK.

[Detailed Project Overview & Requirements](./PROJECT_OVERVIEW.md)

## 📁 Directory Structure
*   **`PROJECT_OVERVIEW.md`**: Detailed requirements, threat model, and week-by-week deliverables.
*   **`agents.md`**: AI instruction manual (Context for Copilot/Claude compatibility).
*   **`docs/`**
    *   `prd.md`: Product Requirements Document (AI Curriculum).
    *   `design.md`: Technical Design (AI Generated & Team Reviewed).
    *   `implementation-plan.md`: Execution Roadmap.
    *   `presentation-outline.md`: Script for final demo.
*   **`project-management/`**: ClickUp screenshots and evidence of velocity.

## 🤖 Development & AI Protocol ("Agent Skills")
We use a **Context-Aware Modular Architecture** to ensure all AI agents (Cursor, Copilot, Gemini) and team members are aligned.

### 1. The "Skills" (`.claude/skills/`)
Instead of a single prompt, we use modular "skills":
*   **🧠 `project-context.md` (The Brain)**: Explains *Active Cyber Resilience*, 6-Layer Defense, and the Vision.
*   **🚨 `ai-protocol.md` (The Protocol)**: Start/End of session rules. **Crucial for consistency**.
*   **📜 `archivist.md` (The Memory)**: Enforces the "Log Before Commit" rule using `DEVELOPMENT_LOG.md`.
*   **🐙 `git-conventions.md` (The Law)**: Enforces branch naming (`feature/...`) and Conventional Commits.
*   **🏗️ `tech-stack-*.md` (The Mechanics)**: Standards for Next.js 16, Drizzle, and Arcjet.

### 2. The Golden Workflow
1.  **Start With**: "Read `ai-protocol.md` and `workflow.md` to begin."
2.  **During Work**: The AI automatically follows rules in `.cursorrules` or imported skills.
3.  **Before Commit**:
    *   **MUST** update `docs/DEVELOPMENT_LOG.md` (The Archivist).
    *   **MUST** run `pnpm build` (The Gatekeeper).

## 🛡️ Active Defense & Functional Modules

### Core Modules
1.  **The Watchtower (Telemetry Dashboard)**: Visualizes live attacks, Global Defcon Level, and Threat Heatmaps.
2.  **Session Intel (Identity Awareness)**: Fingerprints users without login, assigning "Risk Scores" based on behavior.
3.  **Ethical Sandboxes (Attack Lab)**: Controlled environments to practice SQLi, Prompt Injection, and IDOR.
4.  **Hall of Fame (Gamification)**: Ranks researchers based on discovered vulnerabilities and "Easter Eggs".

### Security Architecture (Under the Hood)
1.  **Public Interface**: Next.js + Shadcn (Secure UX)
2.  **App Logic**: Server Actions (Zero Trust Auth)
3.  **AI Governance**: Vercel AI SDK + Filters (Zero-Trust AI)
4.  **Data Integrity**: Neon Postgres + Drizzle (Immutable Logs)
5.  **Network Defense**: Arcjet WAF (Bot Detection & Rate Limiting)
6.  **Active Response**: Tarpitting & Dynamic Blocking

## 🚀 Getting Started

### Prerequisites
*   Node.js 20+
*   pnpm
*   Neon Database URL
*   Arcjet Key

### Installation
```bash
git clone https://github.com/cryptotweezer/Digital-Twin-III.git
cd Digital-Twin-III
pnpm install
pnpm dev
```

## 👥 Team
*   **Andres Henao** (`cryptotweezer@gmail.com`)
*   **Ayush K.** (`ayushk566@gmail.com`)
*   **Anchal** (`anchal1234asr@gmail.com`)
*   **Gitaumoureen** (`gitaumoureen@yahoo.co.uk`)
*   **Sonal Kadiyan** (`sonalkadiyan@gmail.com`)
*   **Pjanx Andrei** (`pjanxandrei@gmail.com`)

## 📅 Project Status
- [x] **Week 1**: Infrastructure & Pillars (Repo, ClickUp, PRD)
- [ ] **Week 2**: Design & Implementation Plan
- [ ] **Week 3**: Interactive System (Chat, MCP, WAF)
- [ ] **Week 4**: Refinement & Production Deployment
- [ ] **Week 5**: Final Polish & Presentation Prep
- [ ] **Week 6**: **Live Defense Demo**

---
*This project is an educational cyber lab. Ethical hacking is encouraged within the designated "Attack Zones" only.*
