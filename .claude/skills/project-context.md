---
description: The Comprehensive Source of Truth for Digital Twin III (Goals, Architecture, Features).
---

# 🌍 Project Context: Digital Twin III

> **The Mission**: "Hack me if you can."
> We are building a **Cyber-Hardened Portfolio** that actively defends itself, logs attacks, and demonstrates professional security maturity in real-time.

## 🏛️ Core Vision
This is not just a website; it is a **Live Cyber Lab**.
*   **Represent**: Interactive Identity via Vercel AI SDK Chatbot.
*   **Defend**: Active Perimeter (Arcjet WAF) preventing SQLi/XSS/Bots.
*   **Learn**: Threat Intelligence Dashboard (SOC Panel) showing real-time telemetry.

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
### 1. Ethical Hacking Zones ("Test My Cybersecurity")
You must build pages specifically for users to try and break the system safely:
*   **🧪 Prompt Injection Sandbox**: Users try to trick the AI. (System must log & block).
*   **🧪 SQL Injection Field**: Users try `OR 1=1`. (System must sanitize & explain).
*   **🧪 Access Control**: Users try to bypass login. (System must warn).

### 2. Threat Telemetry Dashboard (SOC Panel)
A live dashboard showing:
*   **Status**: Current Threat Level (Low/Elevated/Critical).
*   **Live Feed**: "SQLi blocked from IP X", "Prompt Injection prevented", etc.
*   **Metrics**: Graphs of attacks over time.

### 3. Agentic AI & Content
*   **AI Chatbot**: Answers queries about the User's resume/skills.
*   **MCP Tools**: The AI needs tools to "Fetch Blog Posts", "Summarize Security Logs", "Update Threat Level".

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

