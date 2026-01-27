THE SECURITY MANIFESTO: DEFENSIVE STRATEGY (v1.0)
1. CORE PHILOSOPHY
The Watchtower is built on the principle of "Active Resilience." We don't just block; we observe, identify, and adapt. The system is designed to transform every attack into intelligence data for the portfolio.

2. THE DEFENSIVE STACK
WAF (Web Application Firewall): Powered by Arcjet. Detects SQL Injection (SQLi), Cross-Site Scripting (XSS), and Malicious Payloads in real-time.

Rate Limiting: Protects the AI Downlink and API routes from brute force and automated bot exhaustion.

Fingerprinting: Non-intrusive digital signature identification to track threat actors across different IPs.

Ghost Layer Technology: A non-persistent UI state that intercepts attackers, making them believe they are making progress while their activity is being logged.

3. SPECIFIC COUNTERMEASURES
SQL Injection (SQLi)
Defense: Parameterized queries via Prisma/Neon + Arcjet WAF patterns.

Reaction: Immediate escalation to PHASE CHARLIE. Payload is sanitized and logged for the War Room.

Bot & Automation
Defense: Arcjet bot detection (detecting headless browsers, specific user-agents, and automated patterns).

Reaction: Trust Score reduction and "Human Confidence" alert in the HUD.

Sensitive Route Interception
Defense: Middleware-level redirection for paths like /admin, /.env, /wp-login.

Reaction: 302 Redirect to the Ghost Layer where Sentinel-02 delivers a sarcastic "Unauthorized access" log.

4. RESILIENCE PATTERNS
Data Sanitization: All user inputs (even failed ones) are cleaned before being sent to the AI or the Database.

Fail-Safe Mode: If the AI or Database is under heavy stress, the system reverts to a static "Hardened State" to preserve availability.

Zero Trust Metadata: Every request is treated as suspicious until the Handshake is initialized.

5. REMEDIATION & REPORTING
Every neutralized threat generates a "Resilience Report" (visible in the War Room):

CVSS Score Estimation: AI-driven estimation of the attack's severity.

Mitigation Note: Brief explanation of how the system stopped the specific attempt.

ANTIGRAVITY DEPLOYMENT PROTOCOL:
System Prompt Alignment: Use this manifesto to define Sentinel-02's "Expertise Level." The AI should be able to explain these defensive layers if a user asks (sarcasticamente).

Middleware Authority: Ensure 'proxy.ts' acts as the primary enforcer of these rules.

Evidence Collection: Ensure every "Remediation" is formatted correctly to be displayed in the War Room UI.