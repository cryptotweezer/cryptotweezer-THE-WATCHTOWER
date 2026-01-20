---
description: Git conventions, CI/CD pipeline, and verification standards.
---

# 🐙 Git & CI/CD Conventions

## 🚦 The Pipeline (Quality Gate)
We use **GitHub Actions** (`quality.yml`) to enforce code quality.
*   **Trigger**: Pushes to `main` and Pull Requests.
*   **Checks**: Linting (`next lint`), Building (`next build`), and Type Checking.

> **⛔ CRITICAL RULE**: You cannot merge code that fails the pipeline. If a check fails, your PRIORITY is to fix it immediately.

## Commit Messages
Use the **Conventional Commits** format **PLUS Team Member Name**.
This helps us track who (or which AI agent + Team Member) created the commit.

**Format**: `type(scope): description / Team Member Name`

*   `feat`: New feature (e.g., `feat(ui): add 3d robot model / [Team Member Name]`)
*   `fix`: Bug fix (e.g., `fix(auth): resolve token expiration / [Team Member Name]`)
*   `chore`: Maintenance (e.g., `chore(deps): update next.js / [Team Member Name]`)
*   `docs`: Documentation (e.g., `docs(api): update swagger / [Team Member Name]`)
*   `refactor`: Code restructuring without checking behavior.

## Branching Strategy
**Source**: Digital Twin III - Chapter 14.

We use a strict Feature Branch workflow. **NEVER commit directly to `main`**.

### Branch Prefixes
*   `feature/...`: New functionality (e.g., `feature/chat-ui`).
*   `bugfix/...`: Non-critical bug fixes (e.g., `bugfix/typo-in-footer`).
*   `hotfix/...`: **Urgent** production fixes (e.g., `hotfix/db-connection-down`).
*   `chore/...`: Cleanup, deps, docs (e.g., `chore/update-readme`).
*   `test/...`: Experiments or prototyping (do not merge to main).

### Pull Request (PR) Process
1.  **Create PR**: Link the ClickUp Task ID in the description.
2.  **Review**: Wait for CI checks (`quality.yml`) to pass ✅.
3.  **Merge**: Squash and Merge is preferred to keep history clean.


## Workflow Integration
1.  **Branching**: Always use `feature/name` or `fix/name`.
2.  **Archivist**: **MANDATORY**. Update `docs/DEVELOPMENT_LOG.md` before committing.
3.  **Verification**:
    *   Before you claim "Done", run `pnpm build` locally to simulate the CI pipeline.
    *   If the local build fails, do NOT push.
4.  **Attribution**: Always ask the user for their **Team Member Name** if you don't know it.

## Example Scenario
*   *Task*: Add a new button.
*   *Team Member*: Andres
*   *Action*:
    1.  `git checkout -b feature/new-button`
    2.  Write code.
    3.  `pnpm build` (Pass ✅)
    4.  `git commit -m "feat(ui): add contact button / Andres"`
    5.  `git push origin feature/new-button`
