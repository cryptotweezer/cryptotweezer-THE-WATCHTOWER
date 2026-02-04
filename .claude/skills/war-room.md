🏛️ WAR ROOM: INTELLIGENCE & OPERATIONS CENTER
"Where telemetry transforms into a forensic narrative."

The War Room is the operational heart of The Watchtower. It is not a static control panel; it is a real-time intelligence interface designed to manage adversary infamy while demonstrating infrastructure resilience to authorized observers.

🏛️ 1. DUAL ACCESS PROTOCOL (CLEARANCE)
The Dashboard identifies user intent through two distinct entry paths:

Adversary Mode (Threat Actor): Requires a valid Criminal ID (CID) generated after passing the Gatekeeper handshake.

Tone: Hostile, cynical, and challenging.

Goal: The user searches for Elite Honeypots to reach 100% risk.

Observer Mode (Recruiter): Activated via the ?clearance=RECRUITER URL parameter.

Tone: Professional, technical, and analytical ("Briefing Mode").

Goal: Showcase the tech stack (Next.js, Arcjet, Neon) and the architect's monitoring capabilities.

🏛️ 2. ACTIVE TELEMETRY COMPONENTS
A. Global Threat Map (Powered by Neon)
Function: Geo-spatial visualization of blocked attacks.

Logic: Consumes logs from the security_events table in Neon. Every entry with a valid IP generates a light pulse on the map based on the country code.

Visual Impact: Failed attacks from other users appear as "ghost pulses," creating the sensation of a live system under constant siege.

B. System Stress Meter (Powered by Arcjet)
Function: Dynamic indicator of infrastructure health and load.

Levels:

CYAN (Calm): Nominal traffic.

ORANGE (Loaded): Bot detection or request bursts.

RED GLITCH (Critical): Massive attack saturation or Fuzzing. The final 10% of the Infamy Score is unlocked by maintaining this state.

C. Sentinel V2 Uplink (Forensic AI)
Function: Advanced conversational terminal.

Technical Memory: Unlike the Home terminal, the AI here has access to the user's last 20 security events.

Interrogation: Users can ask: "Why did my last JSON Injection attempt fail?" and the Sentinel will provide real technical details based on actual logs.

🏛️ 3. THE TRIPLE LOCK (HONEYPOT TRACKER)
The War Room tracks progress for the covert missions required to reach 100% infamy:

Operation Shadow-Field: API manipulation detection.

Operation Binary-Ghost: Memory tampering detection.

Operation Ghost-Key: Source code secret leak detection.

🏛️ 4. HIGH-PRIORITY ACTIONS
Wall of Infamy (The Deface): A restricted area. Write access is only enabled if risk_score == 100. This allows the user to leave a persistent, signed message in the database.

Identity Eraser (Digital Suicide): A "right to be forgotten" feature. It irreversibly wipes all records of the CID from Neon, reinforcing the narrative of "cleaning your tracks" after a successful operation.

🏛️ 5. TECH STACK IMPLEMENTATION
Frontend: React Context to manage terminal state and map pulses.

Backend: Server Actions for identity erasure and optimized Neon queries.

Security: Arcjet request counting to feed the Stress Meter.