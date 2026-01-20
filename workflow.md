# 🧠 AI Collaboration Workflow (`workflow.md`)

> **🔴 CRITICAL INSTRUCTION FOR ALL AI AGENTS**:
> 1.  **READ**: You MUST read this file at the start of every session to understand the project state.
> 2.  **STRICT SCOPE**: Do NOT invent tasks. Only work on items listed in "Next Immediate Steps".
> 3.  **UPDATE**: Before requesting a git commit/push, you **MUST** update the "Recent Accomplishments" and "Current Focus" sections to reflect your changes. Use this file to pass the baton to the next agent.

## 🚦 Current Phase
**Week 1-2 Transition**: Infrastructure Complete ➡️ moving to **Technical Design**.
*(See `docs/ROADMAP.md` for the full sequence)*

## 📝 Recent Accomplishments (The "Done" List)
*   ✅ **Repository Setup**: Initialized with Branch Protection and CI/CD (`quality.yml`).
*   ✅ **Tech Stack**: Next.js 16, TypeScript, Tailwind, ESLint installed and verified.
*   ✅ **Documentation**:
    *   `PROJECT_OVERVIEW.md` (Full Requirements)
    *   `README.md` (Human Entry Point)
    *   `docs/prd.md` (Product Requirements)
    *   `agents.md` (Static AI Rules)
    *   ✅ **Agent Skills Architecture**:
        *   `.claude/skills/` (Modular context: Protocol, Git, Tech Stack, Project Context).
        *   `archivist.md` & `docs/DEVELOPMENT_LOG.md` (Session tracking).
        *   Universal AI compatibility (Cursor, Copilot, etc.).

## 🚧 Current Focus (Active Work)
*   **Context**: We are preparing for Week 2 deliverables. We need to convert our PRD into a concrete technical design before writing more code.
*   **Active Task**: Generating `docs/design.md`.

## 📋 Next Immediate Steps (The Queue)
1.  **Generate `docs/design.md`**:
    *   Input: `docs/prd.md` + `agents.md`.
    *   Goal: Create a detailed architecture doc (Components, DB Schema, API Routes).
2.  **Generate `docs/implementation-plan.md`**:
    *   Input: `docs/design.md`.
    *   Goal: Step-by-step dev plan for Weeks 3-6.
3.  **Team Review**: Create a PR for the design docs to get team approval.

## ⛔ Out of Scope (Do Not Touch)
*   Do NOT start coding features (Chatbot, WAF, Database) yet.
*   Do NOT change the Tech Stack (Next.js 16/Neon/Arcjet are mandatory).
*   Do NOT modify `quality.yml` unless the build is broken.
