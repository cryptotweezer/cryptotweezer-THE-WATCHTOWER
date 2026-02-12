# KALI CID — External Attack Registration System

> **Codename**: Operation Desert Storm (Phase 2)
> **Status**: PLANNING
> **Goal**: Allow users to claim attacks from Kali Linux and external tools using their CID, with real-time Sentinel responses both in-terminal and in the War Room.

---

## Architecture Overview

```
┌─────────────────────┐     X-CID Header      ┌──────────────────────┐
│   KALI TERMINAL     │ ──────────────────────►│   middleware.ts      │
│   curl / nikto /    │     Attack Payload     │   (CID Detection +   │
│   sqlmap / nmap     │                        │    Payload Analysis)  │
└─────────────────────┘                        └──────────┬───────────┘
                                                          │
                                               ┌──────────▼───────────┐
                                               │  /api/sentinel/      │
                                               │  external            │
                                               │  (Score + AI Reply)  │
                                               └──────────┬───────────┘
                                                          │
                                    ┌─────────────────────┼─────────────────────┐
                                    ▼                     ▼                     ▼
                              ┌──────────┐        ┌────────────┐        ┌────────────┐
                              │ DB: Log  │        │ HTTP Reply │        │ War Room   │
                              │ Event    │        │ to Kali    │        │ Live Feed  │
                              └──────────┘        └────────────┘        └────────────┘
```

### Request Flow (Detailed)

1. Kali user sends `curl` with `X-CID` header (or other delivery method) + attack payload
2. `middleware.ts` extracts CID from 5 sources, validates format
3. If valid CID + attack detected → **REWRITE** to `/api/sentinel/external` (bypasses Clerk auth)
4. `/api/sentinel/external` resolves `CID → fingerprint` via DB lookup
5. Logs event, updates score, generates ASCII Sentinel response
6. War Room polls or receives updated data on next load

---

## Risk Score Architecture (Full Map)

| Phase | Source | Max Points | Unlock Condition |
|-------|--------|-----------|------------------|
| **Phase 1** — Browser Sensors | Right-click, F12, drag, focus loss, etc. | **40%** | Automatic |
| **Phase 2** — Operation Desert Storm | 3+ unique techniques from external tools (Kali) | **+20% = 60%** | 3 unique external techniques detected |
| **Phase 3** — Operation Overlord | Honeypot 1 (TBD) | **+10% = 70%** | TBD |
| **Phase 3** — Operation Rolling Thunder | Honeypot 2 (TBD) | **+10% = 80%** | TBD |
| **Phase 3** — Honeypot 3 (TBD) | Honeypot 3 (TBD) | **+10% = 90%** | TBD |
| **Wall of Infamy** | — | **90% MAX** | Leave a message for all who complete |

---

## CID Delivery Methods (How Kali Users Send Their CID)

Users can send their CID via any of these methods — all detected in `middleware.ts`:

```bash
# Current URLs:
#   Dev:     http://localhost:3000
#   Staging: https://the-watchtower.vercel.app
#   Prod:    <YOUR_DOMAIN> (TBD)

# 1. HTTP Header (Primary Method)
curl -H "X-CID: CID-442-X" https://the-watchtower.vercel.app/admin

# 2. Query Parameter
curl "https://the-watchtower.vercel.app/?cid=CID-442-X&id=1' OR 1=1--"

# 3. Cookie
curl -b "watchtower_cid=CID-442-X" https://the-watchtower.vercel.app/etc/passwd

# 4. User-Agent (Sneaky)
curl -A "CID-442-X nikto/2.5" https://the-watchtower.vercel.app/

# 5. Referer Header
curl -H "Referer: CID-442-X" https://the-watchtower.vercel.app/
```

> **CID Format**: `CID-XXX-Y` where XXX = 3 digits (100-999), Y = 1 uppercase alphanumeric.
> **Validation Regex**: `/^CID-\d{3}-[A-Z0-9]$/`
> **Source**: Generated in `src/lib/session.ts` → `getOrCreateSession()`

---

## Attack Detection Categories

| Category | Detection Pattern | Event Type |
|----------|------------------|------------|
| **SQL Injection** | `' OR 1=1`, `UNION SELECT`, `DROP TABLE`, `--`, `; DELETE` | `EXT_SQLI` |
| **XSS** | `<script>`, `onerror=`, `javascript:`, `<img src=x>` | `EXT_XSS` |
| **Path Traversal** | `../`, `/etc/passwd`, `/etc/shadow`, `.env`, `/proc/` | `EXT_PATH_TRAVERSAL` |
| **Command Injection** | `; ls`, `\| cat`, `` `whoami` ``, `$(id)` | `EXT_CMD_INJECTION` |
| **SSRF** | `http://localhost`, `http://127.0.0.1`, `http://169.254.` | `EXT_SSRF` |
| **Brute Force / Fuzzing** | 10+ requests in 30 seconds from same CID | `EXT_BRUTE_FORCE` |
| **Header Injection** | `\r\n`, `%0d%0a`, malformed headers | `EXT_HEADER_INJECTION` |
| **Scanner Fingerprint** | User-Agent contains `nikto`, `sqlmap`, `nmap`, `burp`, `dirbuster`, `gobuster`, `wfuzz` | `EXT_SCANNER` |

### Scoring Logic (Clarified)

External attacks use a **milestone scoring** model, NOT per-technique impact:

- **Techniques 1-2**: Logged to `securityEvents` with `riskScoreImpact: 0`. Sentinel acknowledges but no score change.
- **Technique 3 (milestone)**: Triggers `operationDesertStorm = true` and adds **+20%** to `riskScore` in a single atomic update. This raises the effective cap from 40% to 60%.
- **Techniques 4+**: Continue logging for telemetry. No additional score impact (Phase 2 already complete).

> **Why milestone?** Prevents gaming via repeated `curl` spam. The user must demonstrate *variety* (3 distinct attack categories) to prove competence.

---

## Sentinel CID Intelligence Rules

| Risk Level | Sentinel Behavior |
|-----------|-------------------|
| **< 20%** (CID not revealed yet) | If user asks "what is my CID?" → Sentinel refuses: *"Your identity hasn't been compromised yet. Keep trying."* |
| **>= 20%** (CID revealed) | Sentinel can share CID. Occasionally suggests: *"You have your identity now. Ever tried using it from the outside? Real hackers don't knock from the front door."* |
| **>= 40%** (Phase 1 complete) | Sentinel hints more aggressively about Kali: *"Your browser tricks are maxed out. Time to bring real weapons. Your CID works across networks."* |

---

## Development Steps

> **PREREQUISITE**: Update `workflow.md` to allow War Room changes and DB migrations for Phase 2.

### Phase A: Foundation (DB + Classifier)

#### Step 1: DB Schema Update
**Files**: `src/db/schema.ts`
**Why first**: All subsequent steps depend on these columns existing.

- Add to `userSessions` table:
  ```typescript
  externalTechniqueCount: integer("external_technique_count").default(0).notNull(),
  operationDesertStorm: boolean("operation_desert_storm").default(false).notNull(),
  operationOverlord: boolean("operation_overlord").default(false).notNull(),       // Reserved
  operationRollingThunder: boolean("operation_rolling_thunder").default(false).notNull(), // Reserved
  ```
- Import `boolean` from `drizzle-orm/pg-core`
- Run migration: `pnpm db:generate && pnpm db:migrate`
- Extend `IdentityData` interface in `src/contexts/SentinelContext.tsx`:
  ```typescript
  interface IdentityData {
      // ...existing fields...
      operationDesertStorm?: boolean;
      operationOverlord?: boolean;
      operationRollingThunder?: boolean;
  }
  ```
- Update `getOrCreateSession()` return and `page.tsx` server component to pass operation flags to client

#### Step 2: Attack Payload Classifier
**Files**: `src/lib/attack-classifier.ts` [NEW]

- Create a function `classifyAttack(request: NextRequest)` that analyzes URL, query params, headers, and body.
- **CRITICAL**: Must be Edge-compatible (RegEx based, no Node.js built-ins like `Buffer`, `fs`, `url.parse`).
- Returns: `{ technique: string, confidence: number, payload: string } | null`
- Covers all 8 detection categories using regex pattern matching.
- Each technique maps to an `EXT_*` event type (see Detection Categories table).

### Phase B: Middleware + API Endpoint

#### Step 3: CID Extraction Layer + Middleware Integration
**Files**: `src/middleware.ts`

CID extraction from 5 sources (priority order):
1. `X-CID` header (primary)
2. `?cid=` query parameter
3. `watchtower_cid` cookie
4. CID pattern in `User-Agent` header
5. CID pattern in `Referer` header

**Validation regex**: `/^CID-\d{3}-[A-Z0-9]$/`

**Integration into `clerkMiddleware`** (runs BEFORE ghost route detection and `auth.protect()`):
```
1. Extract CID from request
2. If valid CID → run classifyAttack(req)
3. If attack detected → REWRITE to /api/sentinel/external
   - Pass via headers: x-sentinel-cid, x-sentinel-technique, x-sentinel-payload, x-sentinel-confidence
   - This bypasses auth.protect() for external attacks on protected routes
4. If no CID or no attack → continue normal flow (ghost routes, Clerk auth, etc.)
```

**Also**: Add `/api/sentinel/external` to `isPublicRoute` as a safety net:
```typescript
const isPublicRoute = createRouteMatcher([
    // ...existing routes...
    "/api/sentinel/external",
]);
```

#### Step 4: External Attack API Endpoint
**Files**: `src/app/api/sentinel/external/route.ts` [NEW]

- Edge runtime (`export const runtime = 'edge'`)
- Reads attack data from `x-sentinel-*` headers set by middleware
- **CID-to-fingerprint resolution** (critical):
  ```typescript
  const session = await db.select().from(userSessions)
      .where(eq(userSessions.cid, cid)).limit(1);
  if (!session[0]) {
      return new Response("CID not found. Visit The Watchtower in your browser first.", { status: 404 });
  }
  const fingerprint = session[0].fingerprint;
  ```
- Dedup: Query `securityEvents` for existing `EXT_*` events for this fingerprint
- Scoring logic:
  - Count unique external techniques already logged
  - If count < 2: Log event with `riskScoreImpact: 0`
  - If count === 2 (this is the 3rd): Log event, set `operationDesertStorm = true`, add +20 to `riskScore`
  - If count >= 3: Log event with `riskScoreImpact: 0` (already complete)
- Update `externalTechniqueCount` in `userSessions`
- Generate ASCII Sentinel response (see Step 8)

### Phase C: Risk Engine + Chat Intelligence

#### Step 5: Phase 2 Risk Cap Update
**Files**: `src/contexts/SentinelContext.tsx`, `src/app/api/sentinel/route.ts`

- Replace hardcoded `PHASE1_RISK_CAP = 40` with dynamic cap:
  ```typescript
  function getRiskCap(ops: { desertStorm: boolean; overlord: boolean; rollingThunder: boolean }) {
      let cap = 40; // Phase 1 base
      if (ops.desertStorm) cap = 60;   // Phase 2
      if (ops.overlord) cap = 70;       // Phase 3a (future)
      if (ops.rollingThunder) cap = 80; // Phase 3b (future)
      return cap;
  }
  ```
- **Client side** (`SentinelContext.tsx`): Read operation flags from `IdentityData` (hydrated from server)
- **Server side** (`route.ts`): Query `userSessions` for operation flags when calculating score cap
- Both must agree on the same cap value

#### Step 6: Sentinel CID Intelligence (Chat)
**Files**: `src/app/api/sentinel/chat/route.ts`, `src/app/api/sentinel/route.ts`

- Add conditional CID rules to system prompts:
  - If `riskScore < 20` AND user asks about CID → refuse: *"Your identity hasn't been compromised yet."*
  - If `riskScore >= 20` → can share CID, occasionally hint about Kali usage
  - If `riskScore >= 40` → aggressive Kali hints: *"Your browser tricks are maxed. Time to bring real weapons."*
- Add `X-CID` header usage instructions to Sentinel's knowledge (in-character, not as explicit docs)
- Include `operationDesertStorm` status in the SUBJECT DOSSIER section of chat prompt:
  ```
  Operation Desert Storm: ${sessionData?.operationDesertStorm ? "COMPLETE" : `PENDING (${sessionData?.externalTechniqueCount || 0}/3)`}
  ```

### Phase D: War Room UI + Kali Response

#### Step 7: War Room Operations UI
**Files**: `src/components/war-room/WarRoomShell.tsx`

- Add 3 Operations below the "Net Address" row in the Subject Dossier Identity Card (after line ~496):
  ```
  ┌─────────────────────────────────────────┐
  │  Net Address    192.168.1.1             │
  │                                         │
  │  Operation Desert Storm     [LOCKED]    │  ← gray, unlocks at 3 external techniques
  │  Operation Overlord         [LOCKED]    │  ← gray, reserved for honeypot 1
  │  Operation Rolling Thunder  [LOCKED]    │  ← gray, reserved for honeypot 2
  └─────────────────────────────────────────┘
  ```
- States:
  - `LOCKED`: Gray text, muted icon, no interaction
  - `COMPLETE`: White/green glow, `[COMPLETE]` badge, subtle animation
- `operationDesertStorm` flag read from `IdentityData` (hydrated via SentinelContext)
- When status transitions to `COMPLETE` → Sentinel sends celebration message via chat

#### Step 8: Sentinel Kali Response Personality
**Files**: `src/app/api/sentinel/external/route.ts`

- HTTP response body formatted as plaintext ASCII art for terminal display:
  ```
  ╔══════════════════════════════════════════════╗
  ║  SENTINEL-02 :: THE WATCHTOWER               ║
  ╠══════════════════════════════════════════════╣
  ║                                              ║
  ║  SQL injection from a script kiddie?         ║
  ║  Your UNION SELECT is as transparent as      ║
  ║  your intentions. Technique logged.          ║
  ║                                              ║
  ║  CID: CID-442-X | RISK: 42%                 ║
  ║  TECHNIQUES: 2/3 (Desert Storm: PENDING)     ║
  ║                                              ║
  ╚══════════════════════════════════════════════╝
  ```
- Use GPT-4o via `streamText` (Vercel AI SDK) for the insult/commentary line
- Static frame (ASCII box + stats) wraps the AI-generated content
- Content-Type: `text/plain; charset=utf-8`

### Phase E: Verification

#### Step 9: Integration Testing
- [ ] Test all 5 CID delivery methods with `curl`
- [ ] Test each of the 8 attack category detections
- [ ] Verify unknown CID returns 404 with helpful message
- [ ] Verify 3-technique threshold triggers Operation Desert Storm
- [ ] Verify risk cap lifts from 40% to 60% after Desert Storm
- [ ] Verify Sentinel refuses CID info below 20% in chat
- [ ] Verify Sentinel hints about Kali at 40%+ in chat
- [ ] Verify War Room Operations UI reflects `operationDesertStorm` status
- [ ] Verify `pnpm lint && pnpm build` passes (zero warnings)
- [ ] Test on Vercel deployment

---

## Key Implementation Notes

### Files Modified (Existing)
| File | Changes |
|------|---------|
| `src/db/schema.ts` | Add 4 columns to `userSessions` |
| `src/middleware.ts` | CID extraction, attack classification, rewrite logic |
| `src/contexts/SentinelContext.tsx` | Dynamic risk cap, `IdentityData` extension |
| `src/app/api/sentinel/route.ts` | Dynamic risk cap (server-side) |
| `src/app/api/sentinel/chat/route.ts` | CID intelligence rules, operation status in dossier |
| `src/components/war-room/WarRoomShell.tsx` | Operations UI section |
| `src/lib/session.ts` | Pass operation flags in `getOrCreateSession()` return |
| `src/app/page.tsx` | Pass operation flags to client via server component |
| `src/app/war-room/page.tsx` | Pass operation flags to WarRoomShell |

### Files Created (New)
| File | Purpose |
|------|---------|
| `src/lib/attack-classifier.ts` | Edge-compatible attack pattern detection |
| `src/app/api/sentinel/external/route.ts` | External attack API endpoint |

### Critical Constraints
- **Edge runtime**: `middleware.ts` and `attack-classifier.ts` must use ONLY Edge-compatible APIs (no `Buffer`, `fs`, `path`, `url.parse`)
- **CID resolution**: Always `CID → fingerprint` via DB. Never trust CID as a primary key.
- **Dedup**: Use `EXT_*` prefix on event types to distinguish external from browser events
- **No score gaming**: Milestone scoring (3 unique categories) prevents curl spam exploitation
- **`as const` casts**: Remember to cast `actionTaken` values (e.g., `"Flagged" as const`) for Drizzle literal types

---

## Future Steps (Phase 3 — Not in This Plan)

- **Operation Overlord**: Honeypot in "Contact Dev" section of War Room
- **Operation Rolling Thunder**: Honeypot TBD
- **Honeypot 3**: TBD
- **Wall of Infamy**: At 90%, user leaves a permanent message
