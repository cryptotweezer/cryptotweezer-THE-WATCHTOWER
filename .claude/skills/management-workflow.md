---
description: Project management standards (ClickUp) and Weekly Engineering Workflow.
---

# 📅 Project Management & Workflow

This skill ensures we work like a professional engineering team, not just coders.
**Source**: Digital Twin III - Chapters 10, 12, 15.

## 🛠️ ClickUp Discipline
**Mandatory Requirement**: All work must be tracked in ClickUp.

1.  **Task States**:
    *   `TODO`: Planned but not started.
    *   `IN PROGRESS`: Actively being worked on (Assignee required).
    *   `IN TEST`: Code committed, PR created, waiting for review/verification.
    *   `DONE`: Merged and verified in production.
    *   `BLOCKED`: Cannot proceed (Discuss in Stand-up).

2.  **Task Rules**:
    *   **No Ghost Work**: If it's not in ClickUp, it doesn't exist.
    *   **Linkage**: Every GitHub PR must link to a ClickUp Task ID.
    *   **Status Updates**: Move tickets actively. Don't leave things in "IN PROGRESS" for weeks.

## 🗓️ Weekly Routine (The "Heartbeat")
We follow a strict weekly cadence to ensure delivery.

1.  **Monday: Planning**
    *   Review previous week.
    *   Move tasks from Backlog -> READY.
    *   Assign owners for the week.

2.  **Tue-Thu: Development (Stand-ups)**
    *   **Daily Question**: "What did I do? What am I doing? Am I blocked?"
    *   Update ClickUp *during* the stand-up.

3.  **Friday: Review & Test**
    *   Stop new feature work.
    *   Focus on **Testing** and **Merging**.
    *   Run the "Weekly Calibration" check (Architecture review).

## ⚠️ Collaboration Rules
*   **PR Reviews**: You cannot merge your own critical code without a second set of eyes (human or AI review).
*   **Documentation**: If you change the logic, update `agents.md` or the relevant `docs/*.md`.
