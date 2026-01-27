📅 THE COMMAND CENTER: PROJECT MANAGEMENT & WORKFLOW (v1.1)
Role: Project Governance & Strategic Delivery. Mission: Ensure 100% transparency in task execution and maintain a predictable delivery "heartbeat."

1. CLICKUP DISCIPLINE: THE SOURCE OF TRUTH
Mandatory: No work is performed unless it is backed by a ClickUp Task.

Task States:
TODO: Planned features in the Backlog.

IN PROGRESS: The agent is currently coding this specific task.

IN TEST: Code is pushed to a feature branch; Vercel build is being verified.

DONE: Code merged to main, verified in production, and marked in DEVELOPMENT_LOG.md.

BLOCKED: Technical debt or missing environment variables preventing progress.

Rules of Engagement:
No Ghost Work: If a feature isn't in ClickUp, it doesn't get built.

Micro-Tasking: Break large features (e.g., "The War Room") into smaller, testable sub-tasks.

ID Linking: Every GitHub Pull Request must reference the ClickUp Task ID in the description.

2. THE WEEKLY "HEARTBEAT" (ROUTINE)
We follow a strict cadence to ensure the Cyber-Hardened Portfolio is delivered on time.

Monday: Tactical Planning

Review the previous week's logs.

Move tasks from Backlog to 'Ready for Sprint'.

Tue-Thu: Aggressive Development

Focus on executing the active Master Plan (e.g., homepage.md).

Daily Updates: "What was achieved? What is next? Any blockers?"

Friday: Hardening & Calibration

Cease new feature development.

Focus on Bug Squashing, Security Audits (Arcjet testing), and Documentation sync.

3. SOCIO-AI SYNERGY RULES
PR Reviews: Critical security logic (WAF rules/Database queries) requires a "Human-in-the-loop" approval before merging to main.

Master Plan Updates: If the implementation changes the original design, the AI MUST propose an update to the corresponding .md in .claude/skills/.

Documentation First: Logic changes must be reflected in security-manifesto.md or infamy-engine.md immediately.

4. VERIFICATION STANDARDS
A task is only DONE when:

It passes pnpm build and pnpm lint.

It is deployed and visible in the Vercel production URL.

The Archivist has recorded the successful deployment.