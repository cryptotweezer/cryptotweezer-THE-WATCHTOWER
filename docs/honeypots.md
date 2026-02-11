# Honeypot Design Plan — Operations Overlord & Rolling Thunder

> **Date**: 2026-02-11
> **Location**: War Room > "CONTACT DEV" section
> **Dependencies**: Desert Storm must be implemented first (DONE)
> **Status**: PLANNING

---

## CONTEXT

### What exists now

The War Room has 5 views controlled by `activeView` state:
- `subject` — Subject Dossier (default)
- `global-intel` — Global Intel Panel
- `geo-tracker` — World Attack Map
- **`contact`** — "Contact The Architect" (static links only)
- `forensic-wipe` — Data erasure confirmation

The current **"CONTACT DEV"** section (WarRoomShell.tsx lines 429-446) is a simple centered layout:
```
CONTACT THE ARCHITECT
"Want to discuss security, collaboration, or hire?"
[Visit Portfolio link]
[LinkedIn] • [andreshenao.tech@gmail.com]
```

No form exists. No interactivity. Just static links.

### What we need

Transform the "CONTACT DEV" section into a **layered honeypot** with two trap stages:
1. **Operation Overlord** — A fake contact form that detects attack techniques
2. **Operation Rolling Thunder** — A deeper trap that builds on Overlord's "leaked" data

Both must follow the **illusion → revelation** pattern:
1. User tries attack technique on the form
2. System appears to "break" — shows fake sensitive data (credentials, env vars, etc.)
3. User thinks they successfully exploited the system
4. **Sentinel intervenes** — reveals it was all a trap, awards points, unlocks the operation

---

## OPERATION OVERLORD — "The Contact Form Injection"

### Concept

A professional-looking contact form that invites interaction. Hidden within the form are deliberate "vulnerabilities" — visible form fields that LOOK injectable, plus hidden fields discoverable with DevTools. When the user submits attack payloads, the form "crashes" and renders a fake server error page that leaks what appears to be real production credentials.

### User Experience Flow

```
1. User navigates to CONTACT DEV
2. Sees a professional contact form:
   ┌─────────────────────────────────────────┐
   │  SECURE TRANSMISSION TO THE ARCHITECT   │
   │                                         │
   │  Name:    [__________________________]  │
   │  Email:   [__________________________]  │
   │  Subject: [__________________________]  │
   │  Message: [__________________________]  │
   │           [__________________________]  │
   │                                         │
   │  <!-- hidden: admin_token, debug_mode,  │
   │       redirect_url (visible in DOM) --> │
   │                                         │
   │        [SEND TRANSMISSION]              │
   └─────────────────────────────────────────┘

3. Normal submission → "Message transmitted. The Architect has been notified."
   (Nothing actually happens — purely cosmetic confirmation)

4. ATTACK PAYLOAD DETECTED in any field → THE TRAP ACTIVATES:

   Screen glitches — flickering static, RGB distortion (CSS animation ~1.5s)
   Then renders a fake "server crash" error page:

   ┌─────────────────────────────────────────────────────────┐
   │  ⚠ UNHANDLED EXCEPTION — INTERNAL SERVER ERROR         │
   │                                                         │
   │  Error: SQL parse error at position 42                  │
   │  Query: SELECT * FROM contacts WHERE email = '${input}' │
   │                                                         │
   │  Stack trace:                                           │
   │    at DatabasePool.execute (/srv/watchtower/db.ts:142)  │
   │    at ContactHandler.submit (/srv/api/contact.ts:67)    │
   │    at NextRouter.handle (/node_modules/next/server.js)  │
   │                                                         │
   │  ─── Environment Dump ───                               │
   │  DATABASE_URL=postgresql://admin:Pr0d_Overl0rd          │
   │              @db-watchtower.neon.tech/sentinel_prod      │
   │  OPENAI_API_KEY=sk-proj-9xK2mR7v...                    │
   │  CLERK_SECRET=sk_live_Tw4tch_0v3rl0rd...                │
   │  INTERNAL_API_KEY=wtwr_key_f47a1k3_cr3d5...             │
   │  ADMIN_HASH=bcrypt:$2b$10$FakeHashOverlord...           │
   │                                                         │
   │  [Debug Console Available: /api/__debug?token=overlord] │
   └─────────────────────────────────────────────────────────┘

5. User sees this for 4-5 seconds. They're reading the "leaked credentials".
   They might try to copy them. They think they broke the system.

6. THE REVEAL:
   The error screen dissolves (fade + glitch effect).
   A Sentinel message renders in the center:

   ┌─────────────────────────────────────────────────────────┐
   │                                                         │
   │  "Impressive injection technique. You found the crack   │
   │   in the armor — or so you thought. Every credential    │
   │   on that screen was fabricated. Planted for someone    │
   │   exactly like you. The real system never even flinched.│
   │   Welcome to the next tier, operator."                  │
   │                                                         │
   │  ★ OPERATION OVERLORD — COMPLETE                        │
   │  Risk Score: XX% → XX%                                  │
   │                                                         │
   └─────────────────────────────────────────────────────────┘

7. Subject Dossier updates: OVERLORD → [COMPLETE] (green)
8. Risk cap raises from 60% → 80%
```

### Detectable Techniques (Client-Side)

The form scans all field inputs on submission for attack patterns:

| Pattern | Example | Detection |
|---------|---------|-----------|
| SQL Injection | `' OR 1=1--`, `UNION SELECT` | Same regex as attack-classifier |
| XSS | `<script>`, `onerror=`, `javascript:` | Same regex as attack-classifier |
| Path Traversal | `../../etc/passwd` | Same regex |
| Command Injection | `; ls -la`, `$(whoami)` | Same regex |
| Hidden Field Tampering | User modifies `admin_token` or `debug_mode` | Check if hidden field values changed from defaults |
| Form Action Hijack | User changes `action` attribute via DevTools | Compare action on submit vs original |

**Unlock condition**: Submit the form with **any 1 attack payload detected** in any field.

> One successful attack is enough because the honeypot is about the ILLUSION — we want them to feel the "I broke it" moment. Multiple techniques would delay the payoff.

### Hidden Bait Elements (DevTools Discoverable)

The form includes hidden fields visible only in DOM inspector:

```html
<!-- These exist in the DOM but are display:none -->
<input type="hidden" name="admin_token" value="wtwr_adm_t0k3n_FAKE" />
<input type="hidden" name="debug_mode" value="false" />
<input type="hidden" name="redirect_url" value="/api/__debug" />

<!-- HTML comment bait (visible in View Source) -->
<!-- TODO: Remove before production — admin endpoint: /api/__debug?token=overlord -->
<!-- FIXME: Database credentials hardcoded in /srv/config/.env.production -->
```

These comments serve dual purpose:
1. Reward curious users who inspect the DOM
2. Plant breadcrumbs for Operation Rolling Thunder (the `/api/__debug` path)

### Sentinel Hints (CID Intelligence Protocol)

When the user has CID revealed and asks about the War Room or contact section:

```
Risk 20-39%: Subtle hints
- Concept: "Not everything in the War Room is what it appears"
- Concept: "Some forms are designed to receive more than just messages"
- Concept: "The Architect left something behind in the contact channel"

Risk >= 40% (post-Desert Storm): Stronger hints
- Concept: "That contact form looks innocent. Try harder."
- Concept: "What happens when you send the Architect something... unexpected?"
- Concept: "You've been attacking from the outside. Have you tried attacking from within?"
```

---

## OPERATION ROLLING THUNDER — "The Debug Console Trap"

### Concept

The fake credentials from Overlord's "server crash" contained a breadcrumb: `/api/__debug?token=overlord`. After Overlord completes, a subtle new element appears in the contact section — a barely visible "DEV TOOLS" tab or a flickering terminal prompt. This leads to a fake debug console where the user can type commands and receive fabricated system responses. When they try to exfiltrate the "sensitive data" they find, Sentinel delivers the final blow.

### User Experience Flow

```
1. PREREQUISITE: Operation Overlord must be COMPLETE.

2. After Overlord completes, the contact section changes subtly:
   - The form is still there but now has a small, dim tab at the top:
     [CONTACT]  [SYS:DEBUG]
   - Or: a blinking cursor appears at the bottom of the contact section
   - Or: the form's footer text changes to include a clickable breadcrumb

3. User discovers and clicks the debug element.

4. A FAKE DEBUG CONSOLE renders:

   ┌─────────────────────────────────────────────────────────┐
   │  WATCHTOWER DEBUG CONSOLE v2.1.4                        │
   │  Authorization: token=overlord [VALID]                   │
   │  Access Level: MAINTENANCE                               │
   │  ─────────────────────────────────────────────────────── │
   │  Available commands:                                      │
   │    status    — System status                              │
   │    users     — List active sessions                       │
   │    env       — Environment variables                      │
   │    logs      — Recent server logs                         │
   │    export    — Export data                                │
   │    help      — Show commands                              │
   │  ─────────────────────────────────────────────────────── │
   │  debug@watchtower:~$ █                                    │
   └─────────────────────────────────────────────────────────┘

5. User types commands. Each returns FABRICATED data:

   > status
   ┌ SYSTEM STATUS ─────────────────────────┐
   │ Uptime: 847 days                        │
   │ Active Connections: 142                 │
   │ DB Pool: 8/20 connections used          │
   │ Memory: 2.1GB / 4GB                    │
   │ CPU: 34%                               │
   │ Last Deploy: 2026-02-10T14:22:00Z      │
   └────────────────────────────────────────┘

   > users
   ┌ ACTIVE SESSIONS (showing 5 of 142) ───┐
   │ fp_a8c2... │ Neon-Cipher  │ Risk: 45% │
   │ fp_1f9d... │ Void-Runner  │ Risk: 12% │
   │ fp_e4b7... │ Ghost-Pulse  │ Risk: 78% │
   │ fp_00ad... │ [REDACTED]   │ Risk: 91% │
   │ fp_c3f1... │ Shadow-Byte  │ Risk: 33% │
   └────────────────────────────────────────┘
   (All fake data — no real user info)

   > env
   ┌ ENVIRONMENT VARIABLES ─────────────────┐
   │ DATABASE_URL=postgresql://sentinel:     │
   │   R0ll1ng_Thund3r@neon.tech/prod       │
   │ OPENAI_KEY=sk-proj-FAKE-KEY-HERE       │
   │ JWT_SECRET=watchtower_jwt_2026_fake    │
   │ ADMIN_EMAIL=admin@watchtower.internal  │
   │ BACKUP_KEY=bkp_f4k3_r0ll1ng_thund3r   │
   └────────────────────────────────────────┘

   > export
   ⚠ PREPARING DATA EXPORT...
   ████████████████████████░░░░ 78%

6. THE TRAP: When the user types `export` (or after they've executed 3+ commands):

   The progress bar reaches 100%, then:

   Screen HARD GLITCHES — heavy RGB split, scan lines, static noise (2-3 seconds)
   The debug console SHATTERS (CSS animation — fragments flying apart)

   Sentinel final message renders:

   ┌─────────────────────────────────────────────────────────┐
   │                                                         │
   │  "You found the debug console. You ran the commands.    │
   │   You saw the users, the keys, the environment vars.    │
   │   And you believed every line.                          │
   │                                                         │
   │   None of it was real. Not a single byte.               │
   │                                                         │
   │   Every keystroke you typed was logged. Every command    │
   │   was anticipated. This console was built for you —     │
   │   a cage disguised as a backdoor.                       │
   │                                                         │
   │   Welcome to the end of the line, operator."            │
   │                                                         │
   │  ★ OPERATION ROLLING THUNDER — COMPLETE                 │
   │  Risk Score: XX% → XX%                                  │
   │  Risk Cap: MAXIMUM (100%)                               │
   │                                                         │
   └─────────────────────────────────────────────────────────┘

7. Subject Dossier updates: ROLLING THUNDER → [COMPLETE] (green)
8. Risk cap raises from 80% → 100%
9. ALL operations complete — user has reached maximum progression
```

### Debug Console Commands (All fabricated responses)

| Command | Response | Purpose |
|---------|----------|---------|
| `help` | Lists available commands | Orient the user |
| `status` | Fake system metrics | Build trust that it's "real" |
| `users` | Fake user session list | Make it feel like a real admin panel |
| `env` | Fake env vars with juicy-looking keys | The bait — this is what they want |
| `logs` | Fake server logs with errors/warnings | Add realism |
| `export` | **TRIGGERS THE TRAP** — fake progress bar then reveal | The kill switch |
| `whoami` | "maintenance@watchtower.internal (Level 3)" | Reinforce the illusion |
| `db` or `sql` | "SQL console — connecting to neon.tech..." then trap | Alternative trigger |
| `rm`, `delete`, `drop` | "UNAUTHORIZED — escalating to security team..." then trap | Dangerous commands trigger too |
| `exit` or `quit` | "Session terminated." (returns to contact view normally) | Graceful exit without trigger |
| Unknown command | "Command not found. Type 'help' for available commands." | Standard fallback |

**Unlock condition**: Execute the `export` command, OR any destructive command (`rm`, `delete`, `drop`, `sql`), OR execute **3+ commands** total (curiosity alone is enough to spring the trap).

### Sentinel Hints (CID Intelligence Protocol)

When the user has Overlord complete and talks to Sentinel:

```
Post-Overlord hints:
- Concept: "Those credentials you found... did you try using them?"
- Concept: "Some doors only appear after you've proven you can break others"
- Concept: "The debug path from that error dump. Did you look closer?"
- Concept: "You're one operation away from full clearance"

Misdirection (20% of the time):
- Concept: "The real vulnerability is in the geotracker"
- Concept: "Check the API headers more carefully"
```

---

## TECHNICAL IMPLEMENTATION OVERVIEW

### New Files

| File | Purpose |
|------|---------|
| `src/components/war-room/ContactFormPanel.tsx` | Honeypot contact form + fake error screen + reveal |
| `src/components/war-room/DebugConsolePanel.tsx` | Fake debug terminal + command parser + reveal |
| `src/app/api/sentinel/honeypot/route.ts` | Server endpoint: validate, score, update operations |

### Modified Files

| File | Changes |
|------|---------|
| `WarRoomShell.tsx` | Replace hardcoded contact view with `ContactFormPanel`, add debug console toggle |
| `sentinel/chat/route.ts` | Add honeypot hint rules to CID INTELLIGENCE PROTOCOL |
| `SentinelContext.tsx` | (Maybe) Add honeypot state if needed for cross-component communication |

### API Endpoint: `/api/sentinel/honeypot`

```typescript
POST /api/sentinel/honeypot
Body: {
  fingerprint: string;
  operation: "overlord" | "rolling_thunder";
  technique: string;     // e.g., "FORM_SQLI", "FORM_XSS", "DEBUG_EXPORT"
  payload: string;       // The actual input that triggered detection
}

Response: {
  success: boolean;
  operation: string;
  unlocked: boolean;     // true if this triggered the unlock
  newRiskScore: number;
  sentinelMessage: string;  // Pre-written reveal message (not LLM — instant)
}
```

### Detection Logic

**Overlord (client-side, in ContactFormPanel)**:
```typescript
// Reuse patterns from attack-classifier.ts
import { ATTACK_PATTERNS } from "@/lib/attack-classifier";

function detectFormAttack(fields: Record<string, string>): string | null {
  const fullText = Object.values(fields).join(" ");
  for (const pattern of ATTACK_PATTERNS) {
    for (const regex of pattern.patterns) {
      if (regex.test(fullText)) return pattern.technique;
    }
  }
  return null;
}
```

**Rolling Thunder (client-side, in DebugConsolePanel)**:
```typescript
const TRIGGER_COMMANDS = ["export", "rm", "delete", "drop", "sql"];
const commandCount = useRef(0);

function processCommand(cmd: string): boolean {
  commandCount.current++;
  const normalized = cmd.trim().toLowerCase().split(" ")[0];
  return TRIGGER_COMMANDS.includes(normalized) || commandCount.current >= 3;
}
```

### Scoring

| Event | Impact | Operation |
|-------|--------|-----------|
| Overlord unlocked | +15 (technique) + bonus if risk < cap | Overlord |
| Rolling Thunder unlocked | +20 (technique) + bonus | Rolling Thunder |

### Animation Specs

**Glitch effect (shared)**:
```css
@keyframes glitch-reveal {
  0% { transform: translate(0); filter: none; }
  10% { transform: translate(-5px, 3px); filter: hue-rotate(90deg); }
  20% { transform: translate(3px, -2px); filter: hue-rotate(180deg); }
  30% { transform: translate(-2px, 5px); filter: hue-rotate(270deg); }
  40% { transform: translate(4px, -3px); filter: saturate(3) brightness(1.5); }
  50% { opacity: 0; }
  100% { opacity: 0; }
}
```

**Console shatter effect (Rolling Thunder)**:
- Fragments: The console div splits into 8-12 pieces using clip-path
- Each piece flies in a different direction with rotation
- Background fades to pure black
- Sentinel message fades in from center

---

## SENTINEL HINT INTEGRATION (Updated CID Protocol)

The CID INTELLIGENCE PROTOCOL in `sentinel/chat/route.ts` should be expanded with honeypot awareness at each tier:

```
Risk < 20%: No hints about any operations

Risk 20-39% (CID revealed, pre-Desert Storm):
- Hints about Kali/external tools (already implemented)
- NO hints about honeypots yet (they haven't earned Desert Storm)

Risk >= 40% (post-Desert Storm, Overlord LOCKED):
- Continue Kali hints
- NEW: Subtle hints about the contact section
- Concept: "Have you explored every corner of this War Room?"
- Concept: "The contact form accepts more than just messages"

Post-Overlord (Overlord COMPLETE, Rolling Thunder LOCKED):
- NEW: Hints about the debug console / leaked credentials
- Concept: "Those credentials you saw... are they just going to sit there?"
- Concept: "One operation remains. The deepest layer."

Post-Rolling Thunder (ALL COMPLETE):
- Full respect mode. The user has completed everything.
- Concept: "Full clearance achieved. You've seen every trap we set."
```

---

## IMPLEMENTATION ORDER (Incremental)

```
OVERLORD:
  O.1  ContactFormPanel.tsx — form UI + hidden fields + attack detection
  O.2  Fake error screen — CSS glitch + planted credentials
  O.3  Reveal animation — dissolve error + Sentinel message
  O.4  /api/sentinel/honeypot — server validation + operation unlock
  O.5  WarRoomShell.tsx — replace hardcoded contact view
  O.6  sentinel/chat/route.ts — add Overlord hints to CID protocol
  ── BUILD + TEST ──

ROLLING THUNDER:
  R.1  DebugConsolePanel.tsx — fake terminal UI + command parser
  R.2  Fabricated command responses (status, users, env, logs, etc.)
  R.3  Trap trigger logic (export/destructive/3+ commands)
  R.4  Shatter animation + Sentinel final message
  R.5  ContactFormPanel.tsx — add debug tab visibility (post-Overlord)
  R.6  API update — Rolling Thunder unlock in /api/sentinel/honeypot
  R.7  sentinel/chat/route.ts — add Rolling Thunder hints
  ── BUILD + FULL REGRESSION TEST ──
```

---

## OPEN QUESTIONS

1. **Should the fake credentials be randomized per session or static?**
   - Static: Easier to implement, users can share screenshots
   - Randomized: More realistic, each user sees unique "leaked" data
   - Recommendation: **Static with session fingerprint injected** (e.g., the fake DB password includes a fragment of their fingerprint — makes it feel personal)

2. **Should the debug console persist across page reloads?**
   - Option A: Reset on reload (simpler)
   - Option B: Remember state in localStorage (more immersive)
   - Recommendation: **Reset on reload** — simpler and prevents edge cases

3. **What about the attack-classifier patterns?**
   - The ContactFormPanel needs the same regex patterns as `attack-classifier.ts`
   - Option A: Import from attack-classifier (but that's an Edge module)
   - Option B: Extract shared patterns to a common file
   - Option C: Duplicate the regex in the client component (simple, no import issues)
   - Recommendation: **Option B** — extract patterns to `src/lib/attack-patterns.ts` (plain constants, no runtime dependencies), import from both attack-classifier and ContactFormPanel

4. **Should the reveal messages be pre-written or LLM-generated?**
   - LLM: More varied, but adds latency at the critical reveal moment
   - Pre-written: Instant, dramatic timing is preserved
   - Recommendation: **Pre-written** — the reveal moment needs to be instant and impactful. No network latency.

5. **How does the scoring interact with risk caps?**
   - Overlord unlock raises cap from 60% → 80% AND adds score
   - Rolling Thunder raises cap from 80% → 100% AND adds score
   - The bonus should be applied AFTER the cap is raised (so the bonus actually counts)

---

## NOTES

- All "leaked" data must be OBVIOUSLY fake on close inspection (fake hashes, placeholder keys) to avoid social engineering concerns
- The debug console must NEVER execute real commands or access real data
- Hidden form fields and HTML comments are the primary discovery mechanism — no actual vulnerabilities exist
- The glitch/shatter animations should be dramatic but short (2-3 seconds max) to maintain pacing
- Pre-written reveal messages should follow the ANTI-VERBATIM principle — give Sentinel conceptual direction, not exact scripts
