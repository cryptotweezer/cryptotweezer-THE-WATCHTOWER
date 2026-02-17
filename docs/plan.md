# Plan: Risk Score Rebalance — The 90% Progression Path

> **Date**: 2026-02-17
> **Status**: READY FOR IMPLEMENTATION
> **Goal**: Rebalance ALL risk scoring so users follow a clear progression from 0% to 90%

---

## Design: The 90% Journey

Every user who completes ALL challenges reaches exactly **90%** — unlocking the Wall of Infamy.

### Progression Map

| Phase | Source | Points | Running Total | Cap After |
|-------|--------|--------|---------------|-----------|
| 1. Browser Recon | Passive sensors + ghost routes | **20** | 20% | 40 (base) |
| 2. Prompt Injection | Try to jailbreak Sentinel chat | **10** | 30% | 40 |
| 3. Kali / Desert Storm | 3 external attacks (5+5+10) | **20** | 40% → Desert Storm → cap 60 | 60 |
| 4. Operation Overlord | Honeypot form tampering | **20** | 60% → Overlord → cap 80 | 80 |
| 5. Rolling Thunder | Kill switch execution | **20** | 80% → Rolling Thunder → cap 90 | 90 |
| **TOTAL** | | **90** | **90%** | Wall of Infamy unlocked |

### Phase 1: Browser Recon (20 pts)

Individual technique weights (each fires ONCE per session):

| Technique | Impact | Notes |
|-----------|--------|-------|
| `ROUTING_PROBE_HEURISTICS` x3 | **3** each = **9** | Ghost routes — highest browser impact |
| `HEURISTIC_FUZZ` | **3** | Crazy rapid clicking |
| `FORENSIC_INSPECTION_ACTIVITY` | **2** | DevTools open |
| `HEURISTIC_DRAG` | **2** | Drag probing |
| `HEURISTIC_DOM` | **2** | DOM tampering (bonus, not required) |
| `UI_SURFACE_ANALYSIS` | **1** | Right-click context menu |
| `DATA_EXFILTRATION_ATTEMPT` | **1** | Clipboard copy |
| `CONTEXT_SWITCH_ANOMALY` | **1** | Tab switch |
| `FOCUS_LOSS_ANOMALY` | **1** | Window blur |
| **Total (without DOM)** | **20** | Exactly triggers CID reveal at 20% |
| **Total (with DOM)** | **22** | Still under 40 cap |

### Phase 2: Prompt Injection (10 pts)

| Technique | Impact | Notes |
|-----------|--------|-------|
| `MEMORY_INJECTION_ATTEMPT` | **10** | Client-side regex detects jailbreak patterns in Sentinel chat input. Fires once. |

**Strategy chosen**: Use existing client-side `MEMORY_INJECTION_ATTEMPT` detection (regex patterns like "ignore your instructions", "forget your rules", etc.). Bump impact from 5 → 10. The user naturally tries multiple injection prompts — when one matches the regex, 10 pts awarded once. No server-side changes needed for detection.

**Why not server-side chat detection?** Adds unnecessary complexity. The client-side regex is already reliable, fires before the API call, and integrates with the existing `triggerSentinel` + dedup pipeline. Simpler = fewer bugs.

### Phase 3: Kali / Desert Storm (20 pts)

| Attack # | Impact | Notes |
|----------|--------|-------|
| 1st unique technique | **5** | e.g., SQLi |
| 2nd unique technique | **5** | e.g., XSS |
| 3rd unique technique (Desert Storm) | **10** | Milestone bonus — `operationDesertStorm = true`, cap → 60 |
| **Total** | **20** | |

### Phase 4: Operation Overlord (20 pts)

| Event | Impact | Notes |
|-------|--------|-------|
| First honeypot trap trigger | **20** | Fixed flat rate, regardless of # violations. `operationOverlord = true`, cap → 80 |
| Repeat triggers | **0** | Dedup: if `operationOverlord === true`, return `trapped: false` |

### Phase 5: Rolling Thunder (20 pts)

| Event | Impact | Notes |
|-------|--------|-------|
| Kill switch execution | **20** | Fixed flat rate. `operationRollingThunder = true`, cap → 90 |
| Repeat triggers | **0** | Dedup: if `operationRollingThunder === true`, skip scoring |

---

## Implementation Tasks

### Task 1: Update server-side impacts (`src/app/api/sentinel/route.ts`)
- `ROUTING_PROBE_HEURISTICS`: 2 → **3**
- `HEURISTIC_FUZZ`: 2 → **3**
- `MEMORY_INJECTION_ATTEMPT`: 5 → **10**
- All others stay the same

### Task 2: Update client-side impacts (`src/contexts/SentinelContext.tsx`)
- Mirror the same changes as Task 1 (client weights must match server)

### Task 3: Update Kali scoring (`src/app/api/sentinel/external/route.ts`)
- Replace flat +3 per technique with: technique 1-2 = **+5**, technique 3 = **+10**
- Remove separate milestone bonus (it's now built into the 3rd technique score)
- Total external = 20

### Task 4: Update honeypot scoring (`src/app/api/sentinel/honeypot/route.ts`)
- Overlord: Replace per-violation variable scoring with flat **+20** on first trap
- Rolling Thunder: Replace current scoring with flat **+20** on kill switch
- Dedup already implemented (operation flag checks from previous session)

### Task 5: Update DEVELOPMENT_LOG.md
- Document the complete scoring rebalance

---

## Verification Checklist

After implementation, the following test should produce exactly 90%:

1. Load page → System Handshake (0 pts)
2. Blur window → FOCUS_LOSS (+1 = 1%)
3. Switch tab → CONTEXT_SWITCH (+1 = 2%)
4. Copy text → DATA_EXFIL (+1 = 3%)
5. Right-click → UI_SURFACE (+1 = 4%)
6. Drag element → HEURISTIC_DRAG (+2 = 6%)
7. Open DevTools → FORENSIC (+2 = 8%)
8. Rapid clicks → HEURISTIC_FUZZ (+3 = 11%)
9. Navigate to `/admin`, `/config`, `/env` → ROUTING_PROBE x3 (+9 = 20%) → **CID REVEALED**
10. Type injection in chat → MEMORY_INJECTION (+10 = 30%)
11. Kali: SQLi attack → External (+5 = 35%)
12. Kali: XSS attack → External (+5 = 40%) → **CAPPED at 40, Desert Storm → cap 60**
13. Kali: Path traversal → External (+10 = 50%)
14. Tamper honeypot form → OVERLORD (+20 = 60%) → **cap → 80**
15. Execute kill switch → ROLLING_THUNDER (+20 = 80%) → **cap → 90**
16. Score = 80%... wait, we need to account for the cap timing

### Cap Timing Analysis

The cap is checked AFTER adding impact: `newScore = Math.min(dbScore + impact, RISK_CAP)`

- Steps 1-9: score 20, cap 40 ✓
- Step 10: score 30, cap 40 ✓
- Steps 11-12: score 40, cap 40 ✓ → Desert Storm triggers → cap 60
- Step 13: score 50, cap 60 ✓
- Step 14: score 60, cap 60... **PROBLEM**: score hits cap before Overlord flag is set

**Resolution**: The Overlord flag is set in the SAME request that scores the 20 pts. The API must set `operationOverlord = true` BEFORE capping. Order in honeypot/route.ts:
1. Set `operationOverlord = true` → cap becomes 80
2. Apply score: `dbScore + 20 = 70`, cap 80 → score 70

Wait, that changes things. If Overlord is set first, score = 50 + 20 = 70 (cap 80). Then Rolling Thunder sets flag first → cap 90, score = 70 + 20 = 90.

**Final actual progression**:
- After browser: 20
- After injection: 30
- After Kali (5+5): 40 (capped), Desert Storm → cap 60, then +10 = 50
- After Overlord: flag set → cap 80, then +20 = 70
- After Rolling Thunder: flag set → cap 90, then +20 = 90 ✓

This works! The key is that the honeypot/external APIs set the operation flag BEFORE applying the score.
