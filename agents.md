AI INSTRUCTION MANUAL (agents.md)
Universal Compatibility: This file is the mandatory entry point for ALL AI agents. Architecture: Modular Skill Pattern. Logic is stored in .claude/skills/.

🧠 ACTIVE SKILLS (The Knowledge Base)
Before executing any task, you MUST load and respect the following modules:

🛡️ CORE PROTOCOLS
ai-protocol.md: READ FIRST. Session rules, Workflows, and Quality Gates.

archivist.md: Memory Management. Rules for the DEVELOPMENT_LOG.md.

git-conventions.md: Commit standards, Branching, and CI/CD requirements.

management-workflow.md: ClickUp discipline and Weekly Routine.

🛰️ THE WATCHTOWER MASTER PLANS (Execution)
project-context.md: Vision. The active defense goals and Sentinel-02 persona.

homepage.md: Roadmap for the Gatekeeper, HUD, and Threat Phases.

war-room.md: Roadmap for the Global Dashboard and Heatmaps.

infamy-engine.md: Logic for Scoring, Crimes, and the Hall of Infamy.

🛠️ TECHNICAL STACK
tech-stack-nextjs.md: Next.js 15/16+ standards and Server Action rules.

tech-stack-drizzle.md: Neon DB and Drizzle ORM type-safe standards.

✅ MANDATORY START-OF-SESSION ROUTINE
Sync Context: Read .claude/skills/ai-protocol.md.

Locate Task: Check workflow.md (Root) to see the Current Focus.

Align with PRD: Cross-reference the task with docs/prd.md.

Environment Check: Execute git pull origin main before coding.

📚 ESSENTIAL REFERENCES
Status Tracking: workflow.md

Historical Records: docs/DEVELOPMENT_LOG.md

Strategic Vision: docs/prd.md