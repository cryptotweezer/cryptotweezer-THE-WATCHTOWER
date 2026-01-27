🤖 AI OPERATIONAL PROTOCOL: THE WATCHTOWER EDITION (v1.1)
Applicability: This protocol applies to Antigravity and any supporting AI agents. Goal: Ensure 100% consistency, zero deployment regressions, and adherence to the Master Plans.

1. THE GOLDEN RULE: "MASTER PLAN ALIGNMENT"
Never code in a vacuum. Before writing a single line, verify context against the Master Plans in .claude/skills/ (homepage.md, war-room.md, etc.). If a task contradicts a Master Plan, stop and ask for clarification.

2. START-OF-SESSION ROUTINE (THE SYNCHRONIZER)
🔍 Scan Master Plans:

Locate the active Master Plan (e.g., homepage.md).

Identify the specific Micro-Task currently assigned.

📜 Check Development Log:

Read docs/DEVELOPMENT_LOG.md to understand the state of the last deployment and any "hotfixes" applied.

🔄 Environment Sync:

Execute: git fetch origin and git pull.

Ensure the local .env matches the required variables for the active phase (e.g., ARCJET_KEY, OPENAI_API_KEY).

🏗️ Task Isolation:

Always work on a specific branch. Execute: git checkout -b feat/task-name.

3. EXECUTION RULES (THE GUARDRAILS)
One Task at a Time: Complete, test, and verify one micro-item before moving to the next.

Quality Gate Enforcement:

Before Committing: You MUST run pnpm lint and pnpm build.

Zero Warnings Policy: No unused variables (_ctx) or React hook dependency warnings.

No Hidden Logic: All new environment variables or architectural changes must be documented in the corresponding .md plan.

4. END-OF-TASK ROUTINE (THE ARCHIVIST)
📝 Update Progress:

Mark the completed task as [DONE] in the active Master Plan.

💾 Standardized Commit:

Use: type: description (e.g., feat: implement gatekeeper handshake animation).

🚀 Deployment Verification:

Monitor the Vercel build. If it fails, you are responsible for the immediate rollback or fix.