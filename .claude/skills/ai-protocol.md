---
description: specific operational protocol for AI agents (Cursor, Codex, Gemini).
---

# 🤖 AI Operational Protocol

> **Applicability**: This protocol applies to **ALL** AI agents (Cursor, Copilot, Codex, Gemini).
> **Goal**: Ensure every agent acts as a seamless team member.

## 1. The "Golden Rule" of Context
**Never assume. Always verify.**
Before writing code, you must understand the *current state* of the project.

## 2. Start-of-Session Routine
1.  **🔍 Read the Status Board**:
    *   Open `workflow.md` (in the root directory).
    *   Check: **Current Focus** and **Next Immediate Steps**.

2.  **📜 Check History (The Archivist)**:
    *   Read `docs/DEVELOPMENT_LOG.md`.
    *   Understand exactly what the previous agent accomplished.

3.  **🗺️ Alignment Check**:
    *   Read `docs/ROADMAP.md`.
    *   Ensure your assigned task fits into the **Current Phase**.

4.  **🔄 Sync**:
    *   Execute: `git pull origin main`.

4.  **🏗️ Create Workspace**:
    *   Execute: `git checkout -b feature/task-name`.

## 3. End-of-Task Routine
1.  **✅ Self-verify**: Run `pnpm build` to ensure no regressions.
2.  **📝 Update Status**:
    *   Update `workflow.md` (Root) to move your task from "Current Focus" to "Recent Accomplishments".
3.  **💾 Commit**: Use `git-conventions.md` standards.
