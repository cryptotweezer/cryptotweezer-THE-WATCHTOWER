🐙 THE COMMANDER PROTOCOL: GIT & CI/CD CONVENTIONS (v1.1)
Role: Infrastructure & Version Control Enforcer. Mission: Maintain a pristine 'main' branch and ensure 100% deployment success in Vercel.

1. THE QUALITY GATE (CI/CD)
The project uses GitHub Actions and Vercel Deployment Checks.

Trigger: Every Push or Pull Request.

Mandatory Checks: pnpm lint, pnpm build, and Type Checking.

CRITICAL RULE: Never merge or push code that fails local build. If the Vercel build fails, the agent must treat it as a Severity: High incident and fix it immediately.

2. COMMIT MESSAGE STANDARDS
We use Conventional Commits + Attribution. This is non-negotiable for tracking AI vs. Human contributions.

Format: type(scope): description / [Team Member Name]

feat: New feature (e.g., feat(hud): add vpn detection / Antigravity)

fix: Bug fix (e.g., fix(auth): fix session timeout / Antigravity)

chore: Maintenance (e.g., chore(deps): update arcjet / Andres)

docs: Documentation updates.

refactor: Code changes that neither fix a bug nor add a feature.

3. BRANCHING STRATEGY: THE PERIMETER
Source: Digital Twin III - Architecture Standards. Rule: No direct commits to main. All work happens in isolated sectors.

Branch Prefixes:
feature/[name]: New functionality (e.g., feature/alpha-phases).

bugfix/[name]: Fixing broken logic.

hotfix/[name]: Urgent production fixes (e.g., hotfix/vercel-deploy-error).

test/[name]: Experimental features (not for merging).

4. EXECUTION WORKFLOW
Synchronization: git pull origin main.

Isolation: git checkout -b feature/task-name.

Development: Follow the active Master Plan (e.g., homepage.md).

Pre-Flight Check: You MUST run pnpm build locally. If it fails, do NOT commit.

The Archivist: Update docs/DEVELOPMENT_LOG.md with the session details.

Commit & Push: git commit -m "..." then git push origin [branch].

5. TASK COMPLETION PROTOCOL
When a micro-task is finished:

Inform the user: "Task [X] is complete. Code pushed to branch [name]."

Deployment Status: Wait for Vercel to confirm the build. If successful, notify: "Vercel Build: SUCCESSFUL. Ready for review."

No External Links: Do not generate links; use GitHub's native flow.