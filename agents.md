# AI Instruction Manual (`agents.md`)

> **Universal Compatibility**: This file is the entry point for **Cursor, GitHub Copilot, Codex, and Gemini**.
> **System Architecture**: We use the **Agent Skills** pattern.
> Detailed instructions are modularized in `.claude/skills/` (compatible with all agents).

## 🧠 Active Skills (The "Brain")
You **MUST** load and respect these skills based on your current task:

| Context | Skill File | Description |
| :--- | :--- | :--- |
| **🚨 PROTOCOL** | [`ai-protocol.md`](.claude/skills/ai-protocol.md) | **READ FIRST**. Session rules & Workflow. |
| **📜 ARCHIVIST** | [`archivist.md`](.claude/skills/archivist.md) | **Global Memory**. Log updates here. |
| **📈 MANAGEMENT** | [`management-workflow.md`](.claude/skills/management-workflow.md) | ClickUp & Weekly Routine rules. |
| **🌍 CONTEXT** | [`project-context.md`](.claude/skills/project-context.md) | **WHAT** we are building (Digital Twin). |
| **🐙 GIT** | [`git-conventions.md`](.claude/skills/git-conventions.md) | Commit rules & CI/CD Pipeline checks. |
| **⚛️ NEXT.JS** | [`tech-stack-nextjs.md`](.claude/skills/tech-stack-nextjs.md) | Next.js 16.1 coding standards. |
| **🗄️ DATABASE** | [`tech-stack-drizzle.md`](.claude/skills/tech-stack-drizzle.md) | Drizzle ORM/Neon standards. |

## ✅ Quick-Start (Universal)
1.  **Read Protocol**: Check `.claude/skills/ai-protocol.md`.
2.  **Check Status**: Read `workflow.md` (Root) to see *what* to do.
3.  **Sync**: `git pull origin main`.

## 📚 Documentation Reference
*   **Workflow**: `workflow.md` (Current Focus)
*   **Requirements**: `docs/prd.md`
*   **Design**: `docs/design.md`

