# Digital Twin III - The Cyber-Hardened Portfolio

## 🎓 Project Vision
> **"Hack me if you can."**

Digital Twin III is not just a portfolio—it is a live cyber lab. It represents a professional identity that is aware of threats, designed to be attacked, and capable of monitoring its own defense in real-time. This project moves beyond static web pages to demonstrate **active cyber resilience**.

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

## 🛡️ Six Layers of Defense
Our architecture implements defense-in-depth:
1.  **Public Interface**: Next.js + Shadcn (Secure UX)
2.  **App Logic**: Server Actions (Zero Trust Auth)
3.  **AI Governance**: MCP + Guardrails (Inside Threat Protection)
4.  **Data Integrity**: Neon Postgres + Drizzle (Schema Validation)
5.  **Network Defense**: Arcjet WAF (Edge Protection)
6.  **Observability**: Real-time Threat Dashboard (SOC Panel)

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
