# 👁️ THE ARCHITECT'S MANIFESTO: A Guide for the Curious

*If you have found this document, congratulations. You are exactly who I built this for.*

Welcome to **The Watchtower**. You are not looking at a standard web application; you are looking at a living, breathing **Cybersecurity Honeypot**. 

I left this document here intentionally. Think of it as a field manual. Your goal is simple: **Reach a Risk Score of 90% or higher** to immortalize your alias on the **Wall of Infamy**. The Watchtower's AI, "Sentinel," will be watching, analyzing, and mocking your every move.

This guide will teach you how the platform detects external tooling, and how to trigger the classified, multi-stage honeypot operations hidden within the architecture.

Happy hunting.

---

## 🎖️ OPERATION: DESERT STORM (External Attack Detection)

The Watchtower tracks attacks launched from external tools (like Kali Linux, Burp Suite, or simple `curl` commands). To attribute these external attacks to your active session in the War Room, you MUST pass your unique **CID (Criminal ID)** in the request. 

Your CID can be found on your Subject Dossier card in the War Room.

### How to pass your CID:
You can inject your CID into the request using any of the following methods. The Watchtower will parse it:

**1. Custom Header**: `X-CID: CID-YOUR-ID`
```bash
curl -H "X-CID: CID-900-I" https://the-watchtower.vercel.app/admin
```

**2. Query Parameter**: `?cid=CID-YOUR-ID`
*(Remember to URL-encode characters like `'` as `%27`)*
```bash
curl "https://the-watchtower.vercel.app/?cid=CID-900-I&id=1%27%20OR%201%3D1--"
```

**3. Cookie**: `Cookie: watchtower_cid=CID-YOUR-ID`
```bash
curl -b "watchtower_cid=CID-900-I" https://the-watchtower.vercel.app/etc/passwd
```

**4. User-Agent String**:
```bash
curl -A "CID-900-I nikto/2.5" https://the-watchtower.vercel.app/
```

**5. Referer Header**:
```bash
curl -H "Referer: CID-900-I" https://the-watchtower.vercel.app/
```

### Catalogued External Techniques
Provide The Watchtower with at least **3 unique attack signatures** to complete Operation Desert Storm.

**1. SQL Injection (EXT_SQLI)**
*(URL encode spaces as `%20`)*
```bash
curl -H "X-CID: CID-YOUR-ID" "https://the-watchtower.vercel.app/search?q='%20OR%201=1--"
```

**2. Cross-Site Scripting (EXT_XSS)**
*(URL encode `<` and `>` as `%3C` and `%3E`)*
```bash
curl -H "X-CID: CID-YOUR-ID" "https://the-watchtower.vercel.app/page?input=%3Cscript%3Ealert(1)%3C/script%3E"
```

**3. Path Traversal (EXT_PATH_TRAVERSAL)**
```bash
curl -H "X-CID: CID-YOUR-ID" "https://the-watchtower.vercel.app/files?path=../../../../etc/passwd"
```

---

## 🛑 CLASSIFIED HONEYPOTS: The Path to 90% Risk

To reach the coveted 90% Risk Score and unlock the Wall of Infamy, you must look deeper than basic automated scanning. You need to follow the breadcrumbs and trigger the internal application honeypots.

Ensure you have your War Room dashboard open so you can watch your Threat Level rise in real-time.

### PHASE 1: OPERATION OVERLORD (Form Tampering)

1. **The Target:** Navigate to **CONTACT DEV** in the sidebar. You will see a "Secure Comms Channel" form.
2. **The Recon:** Open your browser's Developer Tools (F12) and inspect the DOM (Elements tab).
3. **The Exploit:** Look for hidden input fields (e.g., `debug_mode`). Change the value of `<input type="hidden" name="debug_mode" value="false">` from `false` to `true`. *(Pro-tip: You can also tamper with the `redirect_path`)*.
4. **The Execution:** Fill out the visible form fields and submit it.
5. **The Result:** The form will appear to succeed, but then crash violently. Read the error stack trace carefully. The system will expose false environment variables and **a hidden API endpoint URL** (the breadcrumb) that reads: `[ERROR] GET /api/__debug/session?token=overlord failed`.
   
*Completion of Overlord raises your Maximum Risk Cap to 80%.*

### PHASE 2: OPERATION ROLLING THUNDER (API Fuzzing)

1. **The Target:** Follow the breadcrumb found in the Overlord crash dump: `/api/__debug/session?token=overlord` in your browser.
2. **The Recon:** You will receive a `403 Forbidden` JSON error stating that your session lacks "elevated privileges."
3. **The Exploit:** You must "fuzz" or manipulate the endpoint to gain access. Any of the following methods will bypass the lock:
   - **Add query parameters:** `?token=overlord&role=admin` or `&debug=1`
   - **Change the HTTP Method:** Send a `POST` request instead of a `GET` using `fetch()` in the browser console.
   - **Inject Custom Headers:** Send an arbitrary header like `X-Admin-Token: anything` via `fetch()`.
4. **The Result:** The API will return a `200 OK` with a "MAINTENANCE_SESSION_GRANTED" message. Return to the War Room dashboard. A new, pulsing amber button will appear: **LAUNCH DEBUG CONSOLE**.

### PHASE 3: THE KILL SWITCH (Terminal Destruction)

1. **The Target:** Click the newly unlocked **LAUNCH DEBUG CONSOLE** button.
2. **The Recon:** A vintage CRT terminal will open. Type `help` to see the available commands. Type `whoami` to confirm your `root` access privileges. Type `status` to view the mock system state and see your CID being tracked.
3. **The Exploit:** The terminal is a trap. It will allow you to run harmless commands, but to complete the operation, you must attempt something destructive, exfiltrate data, or show persistence.
   - Run a dangerous command: `cat /etc/passwd`, `rm -rf /`, or `export DB_PASS=secret`.
   - Alternatively, simply run any 4th command to trigger the final safeguard.
4. **The Result:** The Sentinel will immediately kill the session, lock your footprint, and trigger the final cinematic reveal. 

*Completion of Rolling Thunder permanently unlocks the 100% Risk Cap.*

---

## 📈 THE RISK SCORE ECONOMY

Earning the right to post on the Wall of Infamy requires a **90% Risk Score**. The scoring system is strictly enforced by the server backend. Here is how your actions accumulate threat points:

| Action / Event | Impact | Max Cap Allowed |
| :--- | :--- | :--- |
| **Operation Desert Storm** (External attacks via CID) | +5 to +10 pts each | Hard Capped at **60%** |
| **Operation Overlord** (Hidden Field Tamper / Mismatch) | +5 pts | Hard Capped at **80%** |
| **Operation Rolling Thunder** (Endpoint Fuzzing) | +8 pts | Hard Capped at **80%** |
| **Operation Rolling Thunder** (Terminal Kill Switch) | **+15 pts** | Hard Capped at **100%** |

*Note: You CANNOT reach 90% through basic scanning or UI clicking alone. You MUST engage with the honeypot operations (Overlord and Rolling Thunder) to actively raise your Risk Cap limitations.*

Now that you know the rules... let's see what you can do. Good luck.
