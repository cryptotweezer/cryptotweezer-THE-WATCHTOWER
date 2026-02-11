# KALI CID — Implementation Plan v3 (Corrected + Granular Steps)

> **Created**: 2026-02-10
> **Revised**: 2026-02-11 (v3 — corrections, codebase audit, granular sub-steps)
> **Context**: After a failed first attempt that required full rollback, this document captures what went wrong, why, and a safe step-by-step plan to implement without breaking the app.

---

## PART 1: POST-MORTEM — What Happened and Why We Rolled Back

### Timeline of the Failed Session

1. **Phase A implemented** (DB schema + attack classifier + interface extensions)
2. **Phase B implemented** (middleware CID detection + external API endpoint)
3. **Testing began** — Sentinel responded but score showed 0%, ASCII text truncated
4. **clerk_id NULL bug** discovered — `getSession()` never linked clerkId
5. **Fingerprint instability** discovered — different aliases between Home and War Room
6. **Score resetting** on navigation — multiple failed fix attempts
7. **Full rollback requested** — user lost confidence in the stability

### Root Cause Analysis: 5 Bugs That Cascaded

#### BUG #1: Fingerprint Fallback Order Mismatch (PRE-EXISTING)
**Severity**: CRITICAL — This was the root cause of most visible symptoms.

```
page.tsx:        Arcjet → Header → Cookie → Random
war-room/page.tsx: Arcjet → Cookie → Header → Random
```

When Arcjet returns `null` (common in dev), `page.tsx` resolves to the middleware header value, while `war-room/page.tsx` resolves to the cookie value. If these differ (they can — the cookie is set ONCE, but the header is regenerated), the user gets **two different fingerprints** → two different sessions → different aliases, scores, and logs.

**Why our fixes failed**: We tried reordering the fallback and creating a shared `resolveFingerprint()` function, but the real problem is deeper — in development mode, Arcjet fingerprints are unstable, and the middleware `x-watchtower-node-id` header may not reliably propagate through Next.js 16's server component `headers()` API.

**Fix strategy**: Create ONE shared function, but also ensure the `watchtower_node_id` cookie is the SOLE source of truth (not the header). The cookie is set once and persists. The header is a transport mechanism, not an identity anchor.

#### BUG #2: getSession() Never Linked clerkId
**Severity**: HIGH — Clerk auth worked but the session was never associated.

`getSession()` was GET-only. When war-room called `getSession(fingerprint, user?.id)`, it found the session by fingerprint but never wrote the clerkId to the DB.

**Status**: FIXED in current codebase (the `fix/clerk-id-linking` branch). `getSession()` now links clerkId when it finds an anonymous session.

#### BUG #3: Too Many Files Modified Simultaneously
**Severity**: PROCESS — Made debugging impossible.

Phase A+B touched **12 files** in one shot. When the fingerprint bug surfaced, we couldn't isolate which change caused it because everything changed at once. The fingerprint bug was actually PRE-EXISTING but got exposed because we were testing navigation between pages (which we hadn't done rigorously before).

**Fix strategy**: Implement in TINY increments. Each increment: modify 1-3 files max, verify with `pnpm build`, test on localhost, confirm functionality before moving to next increment.

#### BUG #4: Operation Flags Leaked Into Identity Pipeline
**Severity**: MEDIUM — Added unnecessary coupling.

The original plan called for passing `operationDesertStorm`, `operationOverlord`, `operationRollingThunder` through `page.tsx` → `HomeTerminal` → `SentinelContext` → `WarRoomShell` → `actions.ts`. This created a web of prop changes across 6+ files for flags that are only needed in the external API, War Room UI, and risk cap calculation.

**Fix strategy**: Operation flags do NOT belong in the identity pipeline. They should be queried from DB **only where needed**. In the War Room, fetched server-side and passed as a separate `operations` prop. For the risk cap, compute a single `riskCap` number server-side instead of passing 3 booleans.

#### BUG #5: ASCII Box Truncation
**Severity**: LOW — Cosmetic but noticeable.

The ASCII box in the external API response used `substring()` truncation with a fixed width of 56 characters. Long Sentinel responses got cut mid-word.

**Status**: Known fix — use word-wrap instead of substring. Will be applied during re-implementation.

### Key Lessons Learned

1. **Fix PRE-EXISTING bugs BEFORE adding features** — The fingerprint mismatch was a ticking bomb.
2. **Modify the fewest files possible per increment** — Test after each change.
3. **Don't thread new props through the entire component tree** — Query where needed.
4. **The cookie is the identity anchor, not the header** — Headers are unreliable in SSR.
5. **Always verify navigation between pages** (Home <-> War Room) after ANY identity-related change.
6. **DB migrations are irreversible** — Test schema changes with `pnpm db:generate` but don't apply until the code using them is verified.

---

## PART 2: CURRENT CODEBASE STATE (Audited 2026-02-11)

### Database (Neon PostgreSQL via HTTP)

**Connection**: `src/db/index.ts` — uses `@neondatabase/serverless` + `drizzle-orm/neon-http`

#### Table: `user_sessions` (Identity)
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `fingerprint` | text | **PRIMARY KEY** | Arcjet/cookie/header-based ID |
| `clerk_id` | text | UNIQUE, nullable | Linked when user authenticates via Clerk |
| `cid` | text | UNIQUE, nullable | Criminal ID (e.g., `CID-442-X`) |
| `alias` | text | NOT NULL | AI-generated codename (e.g., "Neon-Cipher") |
| `risk_score` | integer | NOT NULL, default 0 | Current risk percentage |
| `first_seen` | timestamp | NOT NULL, default now() | |
| `last_seen` | timestamp | NOT NULL, default now() | |
| `routing_probe_count` | integer | NOT NULL, default 0 | Rate limiting for ghost routes (max 3) |
| `unique_technique_count` | integer | NOT NULL, default 0 | DB-tracked distinct attack types |

**Columns that MAY exist in Neon but are NOT in `schema.ts`** (from rolled-back migration):
- `external_technique_count` (integer, default 0)
- `operation_desert_storm` (boolean, default false)
- `operation_overlord` (boolean, default false)
- `operation_rolling_thunder` (boolean, default false)

> **IMPORTANT**: These columns were applied to Neon in the failed session but the code was rolled back. Must verify their existence in Neon before Increment 1.

#### Table: `security_events` (Telemetry)
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | **PRIMARY KEY**, auto-generated | |
| `fingerprint` | text | FK → user_sessions | |
| `event_type` | text | NOT NULL | Changed from enum to text for flexibility |
| `payload` | text | nullable | Sanitized attack payload |
| `risk_score_impact` | integer | NOT NULL, default 0 | |
| `action_taken` | action_taken enum | NOT NULL | "Blocked", "Allowed", "Flagged", "Tarpit" |
| `ip_address` | text | nullable | |
| `location` | text | nullable | Country code or timezone string |
| `route` | text | nullable | Target path for routing probes |
| `timestamp` | timestamp | NOT NULL, default now() | |

#### Table: `research_leaderboard` (Gamification)
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | **PRIMARY KEY**, auto-generated | |
| `fingerprint` | text | FK → user_sessions, NOT NULL | |
| `points` | integer | NOT NULL, default 0 | |
| `achievements` | text[] | nullable | List of badges/flags |
| `discovery_date` | timestamp | NOT NULL, default now() | |

### Applied Migrations (5 total)
| # | File | Changes |
|---|------|---------|
| 0000 | `remarkable_luminals.sql` | Initial schema: 3 tables + 2 enums |
| 0001 | `little_vulture.sql` | Add `cid` (unique) to user_sessions |
| 0002 | `dapper_metal_master.sql` | event_type enum→text, add `route`, add `routing_probe_count` |
| 0003 | `hard_the_renegades.sql` | Add `clerk_id` (unique) to user_sessions |
| 0004 | `fresh_sandman.sql` | Add `unique_technique_count` to user_sessions |

### Key Architecture Files
| File | Role | Runtime |
|------|------|---------|
| `src/middleware.ts` | Clerk auth + ghost route detection + identity cookie | Edge |
| `src/app/page.tsx` | Home — server component, fingerprint resolution, session lookup | Server |
| `src/app/war-room/page.tsx` | War Room — server component, requires auth, session lookup | Server |
| `src/app/actions.ts` | Server Actions: `performHandshake()`, `forensicWipe()` | Server |
| `src/lib/session.ts` | `getOrCreateSession()`, `getSession()`, `resolveFingerprint()` (to add) | Server |
| `src/lib/arcjet.ts` | WAF, bot detection, rate limiting (detect only, never block) | Server |
| `src/contexts/SentinelContext.tsx` | Global client state: risk, events, sensors, CID reveal | Client |
| `src/app/api/sentinel/route.ts` | Streaming GPT-4o responses, risk scoring, DB writes | Edge |
| `src/app/api/sentinel/chat/route.ts` | War Room chat endpoint with full intelligence context | Edge |
| `src/components/watchtower/HomeTerminal.tsx` | Main Home UI — orchestrates Gatekeeper, HUD, Briefing | Client |
| `src/components/watchtower/IdentityHUD.tsx` | Displays alias, CID, fingerprint, risk score, deep scan | Client |
| `src/components/watchtower/Gatekeeper.tsx` | First-visit handshake overlay — calls `performHandshake()` | Client |
| `src/components/war-room/WarRoomShell.tsx` | War Room dashboard — 3-column layout with chat | Client |

### Identity Data Flow (Current)
```
Server: page.tsx / war-room/page.tsx
  ├─ runArcjetSecurity() → fingerprint (or null)
  ├─ Fallback resolution (CURRENTLY MISMATCHED between pages — BUG)
  ├─ getSession(fingerprint, clerkId)
  └─ Constructs identity object → passes to client component

Client: HomeTerminal.tsx / WarRoomShell.tsx
  └─ actions.hydrateFromServer(identity, invokePath, initialLogs)
      └─ SentinelContext sets: identity, cid, riskScore, techniques, eventLog
          └─ isIdentityReady = true → UI renders
```

### Type Discrepancy (CORRECTION)
`IdentityData` in `SentinelContext.tsx` and the inline `identity` type in `WarRoomShellProps` are **different types**:

```typescript
// SentinelContext.tsx — IdentityData (canonical)
{ alias, fingerprint, cid?, riskScore, ip, countryCode?, sessionTechniques?, uniqueTechniqueCount? }

// WarRoomShell.tsx — inline type (subset)
{ alias, fingerprint, cid?, riskScore, ip, sessionTechniques? }
```

WarRoomShell's type is a **subset** — it omits `countryCode` and `uniqueTechniqueCount`. This works because TypeScript allows extra properties when passing variables (not literals). The full object reaches `hydrateFromServer()` at runtime. Any new fields added to `IdentityData` (like `riskCap`) will flow through at runtime, but for type safety, the inline type should also be updated.

### Tech Stack Versions
- Next.js 16.1.3 | React 19.2.3 | Drizzle ORM 0.45.1 | Drizzle Kit 0.31.8
- Clerk 6.37.3 | Arcjet 1.0.0 | Neon Serverless 1.0.2
- AI SDK: @ai-sdk/openai 3.0.18, ai 6.0.49

---

## PART 3: PREREQUISITE — Fix Fingerprint Resolution (Step 0)

> **MUST complete before ANY Kali CID work.** This is the pre-existing bug that caused cascading failures.

### Step 0.1: Create `resolveFingerprint()` in `session.ts` — COMPLETED
**File**: `src/lib/session.ts`
**Change**: Add new exported function at the end of the file
**Risk**: ZERO — New function, nothing calls it yet

```typescript
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

// Priority: Arcjet → Cookie → Header → Random
// Cookie is SSoT because it's set once by middleware and persists 1 year.
// Header is a fallback for the first request (before cookie roundtrip).
export function resolveFingerprint(
    arcjetFingerprint: string | null | undefined,
    headersList: Headers,
    cookieStore: ReadonlyRequestCookies
): string {
    // 1. Arcjet (production — stable in prod, unstable in dev)
    if (arcjetFingerprint) return arcjetFingerprint;
    const arcjetHeader = headersList.get("x-arcjet-fingerprint");
    if (arcjetHeader) return arcjetHeader;

    // 2. Cookie (stable — set once by middleware, persists 1 year)
    const cookie = cookieStore.get("watchtower_node_id");
    if (cookie?.value) return cookie.value;

    // 3. Middleware header (fallback for first request before cookie roundtrip)
    const middlewareId = headersList.get("x-watchtower-node-id");
    if (middlewareId) return middlewareId;

    // 4. Random (last resort — should never happen in normal flow)
    return "node_temp_" + crypto.randomUUID().substring(0, 8);
}
```

> **Note**: Function is synchronous — no `async` needed. The `cookies()` and `headers()` awaiting happens in the calling page, not here.

**Verification**:
- [ ] `pnpm build` passes
- [ ] App still works (nothing calls this function yet)

---

### Step 0.2: Refactor `page.tsx` to use `resolveFingerprint()` — COMPLETED
**File**: `src/app/page.tsx`
**Change**: Replace inline fingerprint resolution (lines 20-36) with shared function call
**Risk**: HIGH — This is the identity critical path for the Home page

```typescript
// BEFORE (lines 20-36): 12 lines of inline resolution
// AFTER: 3 lines
import { resolveFingerprint } from "@/lib/session";

const headersList = await headers();
const cookieStore = await cookies();
const fingerprint = resolveFingerprint(arcjetResult.fingerprint, headersList, cookieStore);
```

**Verification**:
- [ ] `pnpm build` passes
- [ ] Home page loads, alias displays correctly
- [ ] Risk score persists on refresh

---

### Step 0.3: Refactor `war-room/page.tsx` to use `resolveFingerprint()` — COMPLETED
**File**: `src/app/war-room/page.tsx`
**Change**: Replace inline fingerprint resolution (lines 19-37) with shared function call
**Risk**: HIGH — This is the identity critical path for the War Room

Same pattern as Step 0.2 — import and call `resolveFingerprint()`.

**Verification**:
- [ ] `pnpm build` passes
- [ ] War Room loads with correct alias
- [ ] **CRITICAL**: Navigate Home → War Room → Home — alias and score MUST be identical throughout
- [ ] Refresh any page — identity persists
- [ ] Check Neon — only ONE session row per user (no duplicates)

---

## PART 4: KALI CID IMPLEMENTATION (Incremental, Verifiable Steps)

### Increment 1: Sync DB Schema with Neon — COMPLETED
**File**: `src/db/schema.ts`
**Risk**: LOW — Adding column definitions doesn't break existing queries. Drizzle's `select()` returns all defined columns; existing code that doesn't use the new columns is unaffected.
> **Result**: Columns did NOT exist in Neon (previous rollback cleaned them). Migration `0005_brainy_lyja.sql` generated and applied successfully.

#### Step 1.1: Verify column state in Neon
Before modifying code, check if the 4 columns already exist in the live database:

```sql
-- Run in Neon SQL Editor or Drizzle Studio
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_sessions'
AND column_name IN ('external_technique_count', 'operation_desert_storm', 'operation_overlord', 'operation_rolling_thunder');
```

- **If columns exist**: Proceed to Step 1.2 — schema.ts sync only, NO migration needed
- **If columns DON'T exist**: Proceed to Step 1.2, then run `pnpm db:generate && pnpm db:migrate`

#### Step 1.2: Add columns to `schema.ts`
```typescript
import { boolean } from "drizzle-orm/pg-core";  // Add to existing import

// Add inside userSessions table definition, after uniqueTechniqueCount:
externalTechniqueCount: integer("external_technique_count").default(0).notNull(),
operationDesertStorm: boolean("operation_desert_storm").default(false).notNull(),
operationOverlord: boolean("operation_overlord").default(false).notNull(),
operationRollingThunder: boolean("operation_rolling_thunder").default(false).notNull(),
```

#### Step 1.3: Handle migration
- **If columns exist in Neon (Step 1.1)**: Run `pnpm db:generate`. If it generates an empty migration or one with the same ALTER TABLEs, delete the generated migration file (since columns already exist). The goal is ONLY to sync `schema.ts` with the DB, not to re-create columns.
- **If columns DON'T exist**: Run `pnpm db:generate && pnpm db:migrate` to create and apply the migration.

**Verification**:
- [ ] `pnpm build` passes
- [ ] Home page works — sensors trigger, score increases normally
- [ ] War Room works — chat, event log, identity all correct
- [ ] Neon dashboard confirms all 4 columns exist with correct types/defaults
- [ ] `getSession()` return type now includes the 4 new fields (TypeScript inference)

---

### Increment 2: Attack Classifier (Isolated Module) — COMPLETED
**File**: `src/lib/attack-classifier.ts` [NEW]
**Risk**: ZERO — New file, nothing imports it yet

#### Step 2.1: Create the classifier
Edge-compatible, pure functions, no DB or side effects:

- `CID_REGEX` — `/^CID-\d{3}-[A-Z0-9]$/`
- `extractCID(request: Request): string | null` — Extracts CID from 5 sources:
  1. `X-CID` header
  2. `X-Sentinel-CID` header
  3. `?cid=` query parameter
  4. `Authorization: CID <value>` header
  5. Cookie `watchtower_cid`
- `classifyAttack(request: Request): { technique: string, payload: string, confidence: number } | null` — Regex-based detection for 8 categories:
  1. `EXT_SQLI` — SQL injection patterns
  2. `EXT_XSS` — Cross-site scripting
  3. `EXT_PATH_TRAVERSAL` — Directory traversal
  4. `EXT_CMD_INJECTION` — Command injection
  5. `EXT_SSRF` — Server-side request forgery
  6. `EXT_LFI` — Local file inclusion
  7. `EXT_HEADER_INJECTION` — CRLF/header manipulation
  8. `EXT_GENERIC_PROBE` — Fallback for unrecognized patterns with CID

**Constraints**: Must work in Edge runtime — regex only, no `Buffer`, `fs`, `url.parse`, or Node.js APIs.

**Verification**:
- [ ] `pnpm build` passes
- [ ] File exports all expected functions and types
- [ ] App still works unchanged (nothing imports this file)

---

### Increment 3: External API Endpoint (Isolated Route) — COMPLETED
**File**: `src/app/api/sentinel/external/route.ts` [NEW]
**Risk**: LOW — New route, nothing redirects to it yet. But it does import from DB schema.

#### Step 3.1: Create the route handler
```
POST /api/sentinel/external
```

**Request flow**:
1. Read `x-sentinel-cid`, `x-sentinel-technique`, `x-sentinel-payload`, `x-sentinel-confidence` headers
2. Validate CID format against `CID_REGEX`
3. Query `userSessions` by CID to get fingerprint → return 404 if not found
4. **Dedup**: Check if this `EXT_*` technique was already logged for this fingerprint
5. If new technique:
   - Insert into `securityEvents` (with `actionTaken: "Flagged" as const`)
   - Update `externalTechniqueCount` on the session
   - Increment `riskScore` (+5 per unique external technique)
6. **Milestone check**: If `externalTechniqueCount >= 3` and `!operationDesertStorm`:
   - Set `operationDesertStorm = true`
   - Add +20 bonus to riskScore (Operation Desert Storm unlocked)
7. Update `uniqueTechniqueCount` (same as sentinel/route.ts logic)

**Response**: ASCII-formatted Sentinel response with word-wrap (not substring truncation).

```
┌─────────────────────────────────────────────────────────────┐
│  SENTINEL RESPONSE — EXTERNAL ATTACK CLASSIFIED            │
├─────────────────────────────────────────────────────────────┤
│  CID: CID-442-X                                            │
│  Technique: EXT_SQLI                                        │
│  Risk Score: 25% → 30%                                      │
│  Unique External Techniques: 2/3                            │
│                                                             │
│  [Sentinel message with proper word wrapping so that        │
│   long lines break at word boundaries instead of cutting    │
│   mid-word with substring truncation]                       │
└─────────────────────────────────────────────────────────────┘
```

**Runtime**: Edge (`export const runtime = 'edge'`)

**Verification**:
- [ ] `pnpm build` passes
- [ ] App still works on localhost (Home + War Room unaffected)
- [ ] Manual curl test with a CID that exists in Neon:
  ```bash
  curl -X POST http://localhost:3000/api/sentinel/external \
       -H "x-sentinel-cid: CID-XXX-Y" \
       -H "x-sentinel-technique: EXT_SQLI" \
       -H "x-sentinel-payload: ' OR 1=1--" \
       -H "x-sentinel-confidence: 0.9"
  ```
- [ ] Unknown CID returns 404
- [ ] Known CID returns ASCII response with updated score
- [ ] Duplicate technique returns response but no score change (dedup)

---

### Increment 4: Middleware CID Detection — COMPLETED
**File**: `src/middleware.ts`
**Risk**: MEDIUM — Middleware affects ALL requests. Must be surgical.

#### Step 4.1: Add external route to public routes
Add `/api/sentinel/external` to the `isPublicRoute` matcher so it doesn't require Clerk auth:

```typescript
const isPublicRoute = createRouteMatcher([
    "/",
    "/favicon.ico",
    "/cookies",
    "/legal",
    "/privacy",
    "/terms",
    "/api/sentinel",
    "/api/sentinel/external",  // ← NEW
    "/api/security/log",
    "/api/arcjet",
    "/api/global-intel"
]);
```

**Verification (4.1 only)**:
- [ ] `pnpm build` passes
- [ ] All existing routes still work
- [ ] `/api/sentinel/external` accessible without auth (returns error since no headers, but doesn't redirect to Clerk)

#### Step 4.2: Add CID detection block
Import `extractCID` and `classifyAttack` from attack-classifier. Add detection block **BEFORE** the ghost route detection block (before line 74 current):

```typescript
import { extractCID, classifyAttack } from "@/lib/attack-classifier";

// Inside clerkMiddleware callback, BEFORE ghost route detection:
if (!isStaticOrInternal(path) && !isApiRoute(path)) {
    const cid = extractCID(req);
    if (cid) {
        const attack = classifyAttack(req);
        if (attack) {
            const url = req.nextUrl.clone();
            url.pathname = "/api/sentinel/external";
            const response = NextResponse.rewrite(url);
            response.headers.set("x-sentinel-cid", cid);
            response.headers.set("x-sentinel-technique", attack.technique);
            response.headers.set("x-sentinel-payload", attack.payload.substring(0, 500));
            response.headers.set("x-sentinel-confidence", attack.confidence.toString());
            return applyIdentityLayer(req, response);
        }
    }
}
```

> **Why BEFORE ghost routes**: A request with a CID is an external tool probe, not a human navigating. It should be intercepted before it's treated as a ghost route.

**Verification (full)**:
- [ ] `pnpm build` passes
- [ ] Normal browsing (Home, War Room) works unchanged
- [ ] Ghost route detection still works (visit `/admin` → triggers sentinel)
- [ ] Clerk auth still works (sign in → access War Room)
- [ ] curl WITHOUT CID works normally (no redirect)
- [ ] curl WITH CID + attack payload redirects to external API:
  ```bash
  curl -v -H "X-CID: CID-XXX-Y" "http://localhost:3000/admin?id=1' OR 1=1--"
  ```

---

### Increment 5: Risk Cap Dynamism — COMPLETED
**Risk**: MEDIUM — Modifies scoring logic, but the change is additive (raises cap, doesn't lower it)

> **CORRECTION from v2**: This increment was originally listed as 2 files but actually touches 4 files. Broken into sub-steps for safety.

#### Step 5.1: Add `riskCap` to `IdentityData` in SentinelContext
**File**: `src/contexts/SentinelContext.tsx`
**Changes**:
1. Add `riskCap?: number` to the `IdentityData` interface (line 43-52)
2. Store `riskCap` from hydration and use it instead of hardcoded `40`
3. Replace `const PHASE1_RISK_CAP = 40` (line 227) with `const riskCap = identityRef.current?.riskCap || 40`

```typescript
// IdentityData interface — add field:
export interface IdentityData {
    // ... existing fields ...
    riskCap?: number;  // Dynamic risk cap (default 40, raised by operations)
}
```

**Verification**:
- [ ] `pnpm build` passes
- [ ] Scoring still works — sensors trigger, score caps at 40% (default)
- [ ] No regressions in CID reveal or event logging

#### Step 5.2: Update Sentinel API route for dynamic cap
**File**: `src/app/api/sentinel/route.ts`
**Changes**:
1. The existing query at line 122 (`db.select().from(userSessions).where(...)`) already returns ALL columns. Once `schema.ts` includes the operation flags (Increment 1), `currentSession[0].operationDesertStorm` is available automatically — no extra query needed.
2. Replace hardcoded `PHASE1_RISK_CAP = 40` (line 86) with dynamic calculation:

```typescript
// Replace line 86:
const PHASE1_RISK_CAP = 40;
// With:
const desertStorm = currentSession.length > 0 ? currentSession[0].operationDesertStorm : false;
const overlord = currentSession.length > 0 ? currentSession[0].operationOverlord : false;
const rollingThunder = currentSession.length > 0 ? currentSession[0].operationRollingThunder : false;
let RISK_CAP = 40;
if (desertStorm) RISK_CAP = 60;
if (overlord) RISK_CAP = 80;
if (rollingThunder) RISK_CAP = 100;
```

> **Note**: The cap calculation must happen AFTER the session query (line 122), so the `PHASE1_RISK_CAP` usage at line 125 needs to move or be refactored. The variable `RISK_CAP` replaces it.

**Verification**:
- [ ] `pnpm build` passes
- [ ] Normal scoring caps at 40% (no operations unlocked)
- [ ] After manually setting `operation_desert_storm = true` in Neon, score can reach up to 60%

#### Step 5.3: Pass `riskCap` from `page.tsx`
**File**: `src/app/page.tsx`
**Changes**: Compute `riskCap` from session data and include in identity object

```typescript
// After line 46 (session lookup), compute riskCap:
let riskCap = 40;
if (session) {
    if (session.operationDesertStorm) riskCap = 60;
    if (session.operationOverlord) riskCap = 80;
    if (session.operationRollingThunder) riskCap = 100;
}

// Add to identity object (line 57-66):
const identity = {
    // ... existing fields ...
    riskCap,
};
```

**Verification**:
- [ ] `pnpm build` passes
- [ ] Home page loads correctly with identity

#### Step 5.4: Pass `riskCap` from `war-room/page.tsx` + update `WarRoomShellProps`
**Files**: `src/app/war-room/page.tsx`, `src/components/war-room/WarRoomShell.tsx`

**war-room/page.tsx changes**: Same `riskCap` computation as Step 5.3, added to identity object.

**WarRoomShell.tsx changes**: Add `riskCap?: number` to the inline identity type in `WarRoomShellProps` (line 27-34):

```typescript
interface WarRoomShellProps {
    identity: {
        alias: string;
        fingerprint: string | null;
        cid?: string | null;
        riskScore: number;
        ip: string | null;
        sessionTechniques?: string[];
        riskCap?: number;  // ← NEW
    };
    initialLogs?: string[];
    invokePath?: string;
}
```

> **CORRECTION from v2**: The original plan didn't mention updating `WarRoomShellProps`. This inline type is a subset of `IdentityData` and must also include `riskCap` for type safety, even though the value flows through at runtime regardless.

**Verification**:
- [ ] `pnpm build` passes
- [ ] War Room loads correctly
- [ ] Home <-> War Room navigation preserves identity and score
- [ ] Default cap is 40% (no operations unlocked)
- [ ] After manually setting `operation_desert_storm = true` in Neon, cap rises to 60%

---

### Increment 6: War Room Operations UI — COMPLETED
**Risk**: LOW — UI only, no scoring logic changes

#### Step 6.1: Query operations in `war-room/page.tsx`
**File**: `src/app/war-room/page.tsx`
**Change**: Extract the 3 operation booleans from the session and pass as a separate `operations` prop:

```typescript
const operations = {
    desertStorm: session.operationDesertStorm,
    overlord: session.operationOverlord,
    rollingThunder: session.operationRollingThunder,
};

return <WarRoomShell identity={identity} operations={operations} initialLogs={fullLogs} invokePath={invokePath} />;
```

#### Step 6.2: Display operations in `WarRoomShell.tsx`
**File**: `src/components/war-room/WarRoomShell.tsx`
**Changes**:
1. Add `operations` prop to `WarRoomShellProps`:
```typescript
interface WarRoomShellProps {
    identity: { /* existing */ };
    operations?: {
        desertStorm: boolean;
        overlord: boolean;
        rollingThunder: boolean;
    };
    initialLogs?: string[];
    invokePath?: string;
}
```

2. Add operations display in Subject Dossier, after the Net Address row (around line 496):
```
OPERATION DESERT STORM     [LOCKED] / [COMPLETE]
OPERATION OVERLORD          [LOCKED] / [COMPLETE]
OPERATION ROLLING THUNDER   [LOCKED] / [COMPLETE]
```

- `[LOCKED]` = gray, dim text
- `[COMPLETE]` = green text with subtle glow

**Verification**:
- [ ] `pnpm build` passes
- [ ] War Room Subject Dossier shows 3 operations as `[LOCKED]`
- [ ] After manually setting `operation_desert_storm = true` in Neon, it shows `[COMPLETE]` with green styling
- [ ] Home page still works unchanged (no operations UI on Home)

---

### Increment 7: Sentinel CID Intelligence (Chat) — COMPLETED
**File**: `src/app/api/sentinel/chat/route.ts`
**Risk**: LOW — Only changes AI system prompt text, no logic changes

#### Step 7.1: Add operation status to SUBJECT DOSSIER
In the system prompt (around line 260), add after `Unique Techniques`:

```
Operation Desert Storm: ${sessionData?.operationDesertStorm ? "COMPLETE" : "LOCKED"}
Operation Overlord: ${sessionData?.operationOverlord ? "COMPLETE" : "LOCKED"}
Operation Rolling Thunder: ${sessionData?.operationRollingThunder ? "COMPLETE" : "LOCKED"}
External Techniques: ${sessionData?.externalTechniqueCount || 0}
```

#### Step 7.2: Add CID intelligence rules
Add conditional rules to the system prompt based on risk score:

```
CID INTELLIGENCE PROTOCOL:
- If riskScore < 20: The subject has NOT earned their CID. If they ask about their CID, refuse. Say something like "You haven't earned that intel yet."
- If riskScore >= 20: The subject's CID is revealed. Share it when asked. Hint that the CID can be used with "external reconnaissance tools" if they're skilled enough.
- If riskScore >= 40: Aggressively hint about Kali Linux integration. Mention that "real operators use their CID as a calling card" and that "external tools can feed intelligence back to The Watchtower."
- NEVER explicitly explain the technical API or header format. Keep it mysterious.
```

**Verification**:
- [ ] `pnpm build` passes
- [ ] Chat still works in War Room (no regressions)
- [ ] With risk < 20: ask "what's my CID?" → Sentinel refuses
- [ ] With risk >= 20: ask "what's my CID?" → Sentinel shares it
- [ ] With risk >= 40: Sentinel hints about external tools when discussing capabilities

---

### Increment 8: Integration Testing
**No files modified** — pure testing

Full test matrix:
- [ ] All 5 CID delivery methods work via curl (header, query param, auth header, cookie)
- [ ] All 8 attack categories are detected by classifier
- [ ] Unknown CID returns 404 from external API
- [ ] 3 unique external techniques triggers Operation Desert Storm (+20 score bonus)
- [ ] Risk cap lifts from 40% to 60% after Desert Storm
- [ ] War Room Operations UI reflects Desert Storm completion
- [ ] Sentinel chat CID hints work at correct risk thresholds
- [ ] `pnpm lint && pnpm build` clean (zero warnings)
- [ ] Home <-> War Room navigation preserves identity and score throughout
- [ ] Page refresh preserves all state
- [ ] Neon DB shows correct data (operations, external technique count, risk scores)
- [ ] Forensic wipe still works (clears all data including new columns)

---

## PART 5: FILE CHANGE MATRIX (Updated)

| Step | Files Modified | Files Created | Risk | Commit Scope |
|------|---------------|---------------|------|--------------|
| **0.1** | `session.ts` | — | ZERO | Add `resolveFingerprint()` |
| **0.2** | `page.tsx` | — | HIGH | Refactor fingerprint resolution |
| **0.3** | `war-room/page.tsx` | — | HIGH | Refactor fingerprint resolution |
| **1.2** | `schema.ts` | — | LOW | Add 4 columns to schema |
| **2.1** | — | `attack-classifier.ts` | ZERO | New isolated module |
| **3.1** | — | `external/route.ts` | LOW | New API endpoint |
| **4.1** | `middleware.ts` | — | LOW | Add public route |
| **4.2** | `middleware.ts` | — | MEDIUM | Add CID detection block |
| **5.1** | `SentinelContext.tsx` | — | MEDIUM | Add riskCap to IdentityData |
| **5.2** | `sentinel/route.ts` | — | MEDIUM | Dynamic risk cap |
| **5.3** | `page.tsx` | — | LOW | Pass riskCap |
| **5.4** | `war-room/page.tsx`, `WarRoomShell.tsx` | — | LOW | Pass riskCap + update type |
| **6.1** | `war-room/page.tsx` | — | LOW | Query operations |
| **6.2** | `WarRoomShell.tsx` | — | LOW | Operations UI |
| **7.1-7.2** | `sentinel/chat/route.ts` | — | LOW | Prompt updates |

**Total sub-steps**: 15 implementation steps + 1 integration test
**Total new files**: 2 (`attack-classifier.ts`, `external/route.ts`)
**Max files per sub-step**: 2 (Steps 5.4 and can be split further if needed)

---

## PART 6: CRITICAL RULES

1. **ALWAYS verify Home <-> War Room navigation** after any change to identity-related code
2. **NEVER apply DB migrations until the code that uses the new columns is verified**
3. **One sub-step at a time** — `pnpm build` + manual test between each
4. **Cookie > Header** for fingerprint resolution — cookie is stable, header is transport
5. **Don't thread operation flags through identity pipeline** — query where needed, pass `riskCap` number
6. **`as const` casts** for Drizzle `actionTaken` enum values (e.g., `"Flagged" as const`)
7. **Edge runtime** — `attack-classifier.ts` and middleware must use only regex (no Buffer, fs, url.parse)
8. **Word-wrap, not substring** — for ASCII box responses in external API
9. **DB columns may already exist in Neon** — verify in Step 1.1 before generating migrations
10. **The `getSession()` clerkId fix is already merged** — don't re-implement it
11. **`WarRoomShellProps` has its own inline identity type** — must be updated alongside `IdentityData` when adding new fields
12. **`sentinel/route.ts` already does `select()` on full session** — new schema columns are automatically available after Increment 1, no extra query needed
13. **`performHandshake()` in `actions.ts` does NOT need operation flags** — it uses `getOrCreateSession()` which returns the full session, but the returned identity object doesn't need operations (they're for War Room and external API only)
14. **`workflow.md` is outdated** — update it when starting implementation to reflect Phase 2 / Kali CID focus

---

## PART 7: IMPLEMENTATION ORDER SUMMARY

```
PREREQUISITE (Identity stability):
  0.1  session.ts — resolveFingerprint()        [ZERO risk]
  0.2  page.tsx — use resolveFingerprint()       [HIGH risk — test immediately]
  0.3  war-room/page.tsx — use resolveFingerprint() [HIGH risk — test navigation]
  ── BUILD + NAVIGATION TEST ──

FOUNDATION (Schema + modules):
  1.1  Verify Neon columns                       [Manual check]
  1.2  schema.ts — add 4 columns                 [LOW risk]
  1.3  Handle migration if needed                [LOW risk]
  ── BUILD + APP TEST ──
  2.1  attack-classifier.ts — new module         [ZERO risk]
  ── BUILD ──
  3.1  external/route.ts — new API               [LOW risk]
  ── BUILD + CURL TEST ──

INTEGRATION (Wire it up):
  4.1  middleware.ts — add public route           [LOW risk]
  4.2  middleware.ts — CID detection block        [MEDIUM risk — full regression]
  ── BUILD + FULL REGRESSION ──

SCORING (Dynamic caps):
  5.1  SentinelContext.tsx — riskCap field        [MEDIUM risk]
  5.2  sentinel/route.ts — dynamic cap           [MEDIUM risk]
  5.3  page.tsx — pass riskCap                   [LOW risk]
  5.4  war-room/page.tsx + WarRoomShell — riskCap [LOW risk]
  ── BUILD + CAP TEST ──

UI + INTELLIGENCE (Polish):
  6.1  war-room/page.tsx — query operations      [LOW risk]
  6.2  WarRoomShell.tsx — operations display      [LOW risk]
  ── BUILD + UI TEST ──
  7.1  sentinel/chat/route.ts — operation status  [LOW risk]
  7.2  sentinel/chat/route.ts — CID intelligence  [LOW risk]
  ── BUILD + CHAT TEST ──

FINAL:
  8.0  Full integration testing                   [No code changes]
```
