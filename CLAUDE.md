# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Watchtower** is a security research platform that functions as an interactive honeypot with an AI-powered "Sentinel" persona. It detects and catalogues attack techniques while presenting a cyber-terminal aesthetic to visitors. The system tracks visitor fingerprints, assigns risk scores, and maintains a "Hall of Infamy" for detected threats.

## Commands

```bash
# Development
pnpm dev              # Start dev server

# Build & Lint
pnpm build            # Production build (REQUIRED before commits)
pnpm lint             # ESLint check

# Database (Drizzle + Neon Postgres)
pnpm db:generate      # Generate migrations from schema changes
pnpm db:migrate       # Apply migrations to database
pnpm db:studio        # Open Drizzle Studio GUI
```

## Architecture

### Core Flow
1. **Middleware (`src/middleware.ts`)**: Clerk auth + Arcjet security layer (WAF, bot detection, rate limiting at 60 req/min). Sets `x-arcjet-fingerprint` and `x-watchtower-node-id` headers. Public routes: `/`, `/api/sentinel`, `/cookies`, `/legal/*`, `/privacy`, `/terms`.
2. **Server Component (`src/app/page.tsx`)**: Hydrates identity from Neon DB via `getOrCreateSession()`, passes identity props to client.
3. **Client Terminal (`src/components/watchtower/HomeTerminal.tsx`)**: Main UI orchestrating Gatekeeper overlay, IdentityHUD, Briefing, and Sentinel chat.
4. **War Room (`src/app/war-room/`)**: Command center dashboard (Phase 2) — requires Clerk authentication.

### Identity Pipeline
Arcjet fingerprint → cookie fallback → fallback UUID → DB session (`getOrCreateSession`) → client props

### Sentinel Architecture
- **SentinelContext** (`src/contexts/SentinelContext.tsx`): Global client state — `currentRiskScore`, `eventLog`, `accessGranted`, sensor detection. Provides `hydrateFromServer()` and `triggerSentinel()`.
- **API Route** (`src/app/api/sentinel/route.ts`): Streams GPT-4o responses via Vercel AI SDK. Risk-adaptive persona: Script-Kiddie (≤20%) → Threat Actor (≤70%) → Adversary (>70%). Writes risk score updates and security events to DB in `onFinish` callback. Supports `nonStreaming` mode for ghost route events.
- **Hooks** (`src/hooks/useDevTools.ts`, etc.): Sensor detection for devtools, blur, clipboard, context menu, drag events.

### Event Detection Techniques
Events detected client-side in SentinelContext, each with a risk score impact:
- `ROUTING_PROBE_HEURISTICS` (+5) — ghost route access attempts (max 3 before escalation)
- `FORENSIC_INSPECTION_ACTIVITY` (+5) — devtools open
- `MEMORY_INJECTION_ATTEMPT` (+20) — prompt injection in chat
- `UI_SURFACE_ANALYSIS`, `DATA_EXFILTRATION_ATTEMPT`, `FOCUS_LOSS_ANOMALY`, `CONTEXT_SWITCH_ANOMALY` (+2 each)
- `HEURISTIC_DOM`, `HEURISTIC_DRAG`, `HEURISTIC_FUZZ` — advanced probing

### Database (`src/db/schema.ts`)
Three tables, all defined in one file:
- **userSessions** — identity (PK: `fingerprint`, fields: `clerkId`, `cid`, `alias`, `riskScore`, `routingProbeCount`)
- **securityEvents** — telemetry log (UUID PK, FK to userSessions, fields: `eventType`, `payload`, `riskScoreImpact`, `actionTaken`)
- **researchLeaderboard** — gamification (UUID PK, `points`, `achievements` array)

### Async Navigation (Next.js 16+ Critical)
Always await `params`, `searchParams`, `cookies()`, and `headers()`:
```typescript
const { slug } = await params;
const cookieStore = await cookies();
```

## Workflow Protocol

1. **Read `workflow.md`** at session start for current focus and scope limits
2. **One task at a time** — complete before moving to next
3. **Pre-commit gates**: Run `pnpm lint && pnpm build` — zero warnings policy
4. **Update `docs/DEVELOPMENT_LOG.md`** before every commit (Archivist Protocol)
5. **Branch workflow**: `git checkout -b feat/task-name`
6. **Skill files** in `.claude/skills/` contain detailed standards for Next.js, Drizzle, and project protocols

## Critical Rules

- Schema lives in `src/db/schema.ts` only — no fragmented schemas
- DB is Single Source of Truth — never initialize risk score to 0 if user exists (hydrate first)
- Server Actions for mutations, not API routes (exception: `/api/sentinel` for LLM streaming)
- Keep `'use client'` at leaf components only
- Validate all Server Action inputs with Zod
- Never expose DB errors to client — use generic messages like `[ERROR] Node Synchronization Failed`
- Use Drizzle's type inference — avoid manual interface declarations for DB models
- Use `onConflictDoUpdate` for upserts on the `userSessions` table

## Commit Format

```
type: description
```
Types: `feat`, `fix`, `refactor`, `docs`, `chore`

## Environment Variables

Required: `DATABASE_URL`, `ARCJET_KEY`, `OPENAI_API_KEY`
Auth: Clerk env vars (see `.env.local`)
