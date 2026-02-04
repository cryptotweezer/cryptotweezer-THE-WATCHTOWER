Here is the ROADMAP.md in English. This document is focused on the re-engineering process, starting with the necessary modifications to the current codebase before moving into new feature development.

🗺️ RE-ENGINEERING ROADMAP: THE WATCHTOWER
This document outlines the critical tasks required to transform the current codebase into the Total Surveillance Infrastructure defined in v2.0.

🛠️ PHASE 0: RE-ENGINEERING EXISTING LOGIC (HIGH PRIORITY)
Goal: Purge "Legacy" mentorship logic and calibrate the Infamy Engine.

[Manager] Refactor useSentinelManager.ts:

Update impact constants to match the new scoring table (F12: 5%, Click/Tab/Copy: 1%).

Implement Path Persistence Set: Sentinel no longer awards points for 1 or 2 routing probes. Point block (11%) is only granted upon detecting the 3rd unique unauthorized path.

Seal the 20% Hard Cap: Ensure Tier 1 actions stop contributing to the score once riskScore >= 20.

[Handshake] Real Handshake in Gatekeeper.tsx:

Transition from visual-only handshake to a real Server Action. Trigger a Neon DB record for the HANDSHAKE event linked to the Arcjet fingerprint before the user interacts with the entry button.

[UX] Purge "Mentorship" from Briefing.tsx:

Remove all strings suggesting "learning" or "teaching". The Sentinel must sound threatening to the Adversary and only shift to a technical/professional tone if ?clearance=RECRUITER is detected.

[HUD] CID Reveal Logic in IdentityHUD.tsx:

Keep the Criminal ID (CID) hidden by default. Trigger the "Matrix Typing" reveal animation only after the user hits the 20% Risk (SCRIPT-KIDDIE status).

🕸️ PHASE 1: THE TRIPLE LOCK (HONEYPOTS)
Goal: Implement the logic traps that allow the user to break the 20% limit.

[Honeypot 1] Operation Binary-Ghost:

Deploy proxy.ts on the client. Initialize the window._VGT_DEBUG_ object and attach a Proxy setter to detect and log console tampering attempts.

[Honeypot 2] Operation Shadow-Field:

Develop a deceptive API endpoint (e.g., /api/v1/user/sync). Implement server-side validation to detect unauthorized attributes (e.g., role: admin, bypass: true) in the JSON payload.

[Honeypot 3] Operation Ghost-Key:

Inject technical "bait" comments into the production HTML (``). Update the Sentinel’s NLP logic to recognize these keys in the chat and grant Tier 2 points.

🏛️ PHASE 2: WAR ROOM (INTELLIGENCE DASHBOARD)
Goal: Real-time telemetry visualization and professional mode.

[System] Professional Tooling Detection:

Create an API middleware to identify requests from CLI tools (Kali, Curl, Python). Award 25% Infamy if the request includes a valid X-Sentinel-CID header.

[UI] Global Threat Map:

Build the map component consuming Neon live data. Each blocked event from the global security_events table must generate a localized light pulse.

[UI] Stress Meter:

Connect Arcjet’s request frequency data to a visual meter. The UI must transition into "Red Glitch" mode during high-frequency bursts (Fuzzing/Brute Force attempts).

🏆 PHASE 3: FINAL REWARD & PUNISHMENT
Goal: The Wall of Infamy and total UI Hijack.

[Feature] Wall of Infamy:

Build the digital "graffiti" wall. The submission interface remains locked until the user’s score in Neon reaches 100%.

[Security] Ghost Layer (UI Hijack):

Implement a persistent global state for "Critical Hostility". If an adversary persists after being capped, the entire UI must stay corrupted (CSS filters, noise, binary overlays) until the session is cleared.

[Identity] Identity Eraser:

Develop the "Forensic Wipe" action (Actual hard delete in Neon) for elite users who wish to clean their digital footprint after reaching 100%.