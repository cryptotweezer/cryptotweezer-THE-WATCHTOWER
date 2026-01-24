---
description: The Comprehensive Source of Truth for Digital Twin III (Goals, Architecture, Features).
---

# 🌍 Project Context: Digital Twin III

> **The Mission**: "Defensive Teacher: Learn by Attacking."
> We are building a **SecOps & Active Defense Platform** that serves as a self-defending infrastructure node. It collects real-time attack telemetry and gamifies the experience for both visiting learners and adversaries.

## 🏛️ Core Vision: A Dual Experience
*   **The Apprentice (Novice)**: The AI acts as a mentor, explaining security concepts.
*   **The Adversary (Expert)**: The system acts as a hardened target, blocking attacks and logging payloads.

## 🛡️ Functional Modules (Active Defense)
1.  **The Watchtower**: Threat Telemetry Dashboard (Live Feed, Defcon Level, Heatmap).
2.  **Session Intel**: Identity Awareness via fingerprinting & Risk Scores.
3.  **Attack Lab**: Ethical Sandboxes for SQLi, Prompt Injection, and IDOR.
4.  **Hall of Fame**: Gamified leaderboard for security researchers.

## 🛡️ Six-Layer Defense Architecture
This project **MUST** implement the following 6 layers of defense:

1.  **Public Interface** (Next.js 16 + Shadcn):
    *   Trust NO input.
    *   Fail safely (no stack traces).
2.  **App Logic** (Server Actions):
    *   **Zero Trust**: Authenticate & Validate EVERY action.
    *   No direct DB access from client.
3.  **AI Governance** (MCP + Vercel AI SDK):
    *   **Least Privilege**: AI agents cannot write to DB without validation.
    *   **Guardrails**: Sanitize all MCP tool inputs.
4.  **Data Integrity** (Neon Postgres + Drizzle):
    *   Strict Schema Validation.
    *   Separate Public vs. Private data.
5.  **Network Defense** (Arcjet WAF + Vercel Firewall):
    *   Block Automations/Bots.
    *   Rate Limiting (DDOS protection).
6.  **Observability** (Monitoring):
    *   Real-time "Attacker Telemetry".
    *   Dynamic Threat Levels (🟢 Green -> 🔴 Red).

## 🚀 Mandatory Features to Build
### 1. Functional Modules
*   **Watchtower**: Visualizes live attacks and changes Global Defcon Level.
*   **Session Intel**: Assigns "Risk Scores" to visitors based on behavior.
*   **Attack Lab**: controlled environments for SQLi and Prompt Injection training.
*   **Hall of Fame**: Ranking system for successful exploits (in sandboxes).

### 2. Security Architecture (Under the Hood)
*   **Active Response**: Tarpitting and dynamic blocking for high-risk scores.
*   **Forensic AI**: Vercel AI SDK analyzes patterns to generate natural language reports.
*   **Immutable Logs**: Neon/Drizzle ensures security events cannot be tampered with.

## 📅 Weekly Submission Requirements (Success Criteria)
**Source**: Digital Twin III - Chapters 16-21.

The AI must help the team meet these concrete deliverables:

*   **Week 2 (Design)**:
    *   [ ] `docs/design.md` (AI-Generated from PRD).
    *   [ ] `docs/implementation-plan.md` (AI-Generated from Design).
    *   [ ] PDF: Commit History + PR Review Evidence.

*   **Week 3 (Interim Build)**:
    *   [ ] Working Chatbot with MCP.
    *   [ ] `src/mcp-server/` implemented.
    *   [ ] Live Vercel Deployment (Beta).

*   **Week 4 (Refine)**:
    *   [ ] Production Deployment (Custom Domain).
    *   [ ] **Performance**: LCP < 2.5s.
    *   [ ] Evidence of Data Refinement.

*   **Week 5 (Polish)**:
    *   [ ] `docs/presentation-outline.md`.
    *   [ ] Final Bug Bash (Zero P0/P1 issues).
    *   [ ] 80%+ ClickUp Tasks marked DONE.

## 🛠️ Tech Stack Constraints
*   **Framework**: Next.js 16.1+ (App Router).
*   **DB**: Neon Postgres (Serverless).
*   **ORM**: Drizzle ORM (Type-safe queries).
*   **AI**: Vercel AI SDK v6 (Model Context Protocol).
*   **Security**: Arcjet WAF (Mandatory).
*   **Email**: Resend API.

