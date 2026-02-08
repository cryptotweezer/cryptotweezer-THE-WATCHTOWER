# GEMINI.md - Project Context for Gemini CLI

This document provides essential context for the Gemini CLI to effectively understand and interact with the `cryptotweezer-THE-WATCHTOWER` project.

## 1. Project Overview

**Project Name:** THE WATCHTOWER: DIGITAL TWIN III - "live threat-hunting node."
**Purpose:** An Active Defense & SecOps Infrastructure designed to monitor, react to, and analyze attack telemetry. It aims to function as an "Infamy Laboratory" by classifying visitors and exposing them to a hostile perimeter managed by Sentinel-02 (an AI). It also provides a "Briefing Mode" for authorized observers to understand the underlying technical architecture.
**Key Features:**
*   **Active Defense Modules:** The Terminal (Forensic HUD), The War Room (Dashboard), The Triple Lock (Honeypots like Binary-Ghost, Shadow-Field, Ghost-Key), The Ghost Layer (UI Hijack), Wall of Infamy.
*   **AI-Human Collaboration:** Optimized for AI-assisted development using a Modular Skills system (e.g., ai-protocol.md, archivist.md).
*   **Authorization Levels:** Differentiates between "The Adversary" (attackers) and "The Authorized Observer" (recruiters).

**Core Technologies:**
*   **Framework:** Next.js 15+ (App Router, Server Actions)
*   **Security:** Arcjet (WAF, Bot Detection, Fingerprinting, Rate Limiting)
*   **Database:** Neon Postgres (Serverless)
*   **ORM:** Drizzle ORM (Type-safe Logs)
*   **AI:** Vercel AI SDK (Sentinel-02 Personality Engine)
*   **Deployment:** Vercel Edge Runtime
*   **Styling:** Tailwind CSS
*   **Package Manager:** pnpm
*   **Language:** TypeScript

## 2. Building and Running

The project uses `pnpm` as its package manager. Ensure `pnpm` is installed globally.

**Installation:**
To install dependencies, navigate to the project root and run:
```bash
pnpm install
```

**Available Scripts:**
The following scripts are defined in `package.json`:

*   **`pnpm dev`**: Starts the development server.
    ```bash
    pnpm dev
    ```
*   **`pnpm build`**: Builds the application for production.
    ```bash
    pnpm build
    ```
*   **`pnpm start`**: Starts the production server.
    ```bash
    pnpm start
    ```
*   **`pnpm lint`**: Runs ESLint to check for code quality issues.
    ```bash
    pnpm lint
    ```
*   **`pnpm db:generate`**: Generates Drizzle migrations based on schema changes.
    ```bash
    pnpm db:generate
    ```
*   **`pnpm db:migrate`**: Applies Drizzle migrations to the database.
    ```bash
    pnpm db:migrate
    ```
*   **`pnpm db:studio`**: Opens the Drizzle Studio for database inspection.
    ```bash
    pnpm db:studio
    ```

## 3. Development Conventions

This project has strict development protocols, especially concerning AI-assisted development.

*   **AI Operational Protocol (`.claude/skills/ai-protocol.md`):**
    *   **Master Plan Alignment:** All development must align with "Master Plans" located in `.claude/skills/`.
    *   **Start-of-Session Routine:** Includes scanning Master Plans, checking `docs/DEVELOPMENT_LOG.md`, environment sync (`git fetch`, `git pull`, `.env` variables), and task isolation (working on dedicated branches).
    *   **Quality Gates:** `pnpm lint` and `pnpm build` **MUST** be run before committing. Zero warnings policy.
    *   **No Hidden Logic:** New environment variables or architectural changes must be documented in corresponding `.md` plans.
*   **Archivist Protocol (`.claude/skills/archivist.md`):**
    *   **Development Log:** `docs/DEVELOPMENT_LOG.md` **MUST** be updated before any `git commit`. This log ensures context continuity and traceability.
    *   **Logging Standard:** Specific Markdown template for log entries covering author, session goal, status, accomplishments, challenges, and next steps.
*   **TypeScript:** The project is written in TypeScript, enforced by `tsconfig.json`.
*   **ESLint:** Code quality is maintained using ESLint, configured via `eslint.config.mjs`. A "Zero Warnings Policy" is enforced.
*   **Next.js App Router:** The project utilizes the Next.js App Router for routing and server components.
*   **Drizzle ORM:** Database interactions are handled through Drizzle ORM, with schema defined in `src/db/schema.ts` and migrations managed via `drizzle-kit`.
*   **Styling:** Tailwind CSS is used for styling, as indicated by `postcss.config.mjs` and `globals.css`.
*   **Environment Variables:** Critical environment variables (e.g., `DATABASE_URL`) are loaded via `dotenv` as seen in `drizzle.config.ts`. Ensure your `.env` file is correctly set up according to the active phase.
