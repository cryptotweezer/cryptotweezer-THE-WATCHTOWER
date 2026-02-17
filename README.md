# 🛰️ THE WATCHTOWER
> **"Every byte is a witness. Every click is a signature."** — *Sentinel-02*

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-ACTIVE_DEFENSE-red.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.1-black)
![Arcjet](https://img.shields.io/badge/Secured_by-Arcjet-orange)

## 📜 Executive Summary

**The Watchtower** is a **Live Threat-Hunting Infrastructure**. Designed as an "Active Defense" node, it serves as a honey-net for capturing, analyzing, and neutralizing adversarial interaction.

Unlike static web applications, The Watchtower breathes. It classifies visitors based on their intent and footprint:

**The Adversary**: Automated scripts and unauthorized human actors who face a hostile, adaptive perimeter.

The system employs **Sentinel-02**, an AI-driven security core that engages with threats in real-time, effectively turning the attackers into the content.

---

## 🏗️ Technical Architecture

The project is built on the **Elite Stack**, focusing on edge performance, type safety, and active security.

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Core Framework** | **Next.js 15** (App Router) | Server Components, React Server Actions. |
| **Security Layer** | **Arcjet** | WAF, Bot Detection, Rate Limiting, Fingerprinting. |
| **Database** | **Neon** (Serverless Postgres) | Scalable, branching SQL database. |
| **ORM** | **Drizzle** | TypeScript-first schema definition and query builder. |
| **Intelligence** | **Vercel AI SDK** | LLM orchestration for Sentinel-02 personality. |
| **Styling** | **Tailwind CSS v4** | Utility-first styling with deeply custom design tokens. |
| **Deployment** | **Vercel Edge** | Global low-latency distribution. |

---

## 🛡️ Active Defense Modules

### 1. The Triple Lock (Honeypots)
A multi-layered trap system designed to separate humans from bots, and curious devs from malicious actors.
*   **Binary-Ghost**: Client-side memory tampering detection via JavaScript Proxies.
*   **Shadow-Field**: Hidden form layers detecting API over-posting and attribute injection.
*   **Ghost-Key**: Social engineering bait embedded in source comments and non-existent routes.

### 2. The War Room (Dashboard)
A real-time command center accessible only to authorized personnel (or persistent hackers).
*   **Global Heatmap**: Visualizes threat origins in real-time.
*   **Live Sensor Feed**: Streaming telemetry of blocked requests and heuristic triggers.
*   **Infamy Engine**: Tracks the "Risk Score" of every session, unlocking features as potential threats escalate.

### 3. Wall of Infamy
A persistent "High Score" ledger.
*   **Mechanic**: Users who reach a **90% Risk Score** unlock the ability to leave a permanent message.
*   **Persistence**: These entries survive "Forensic Wipes," immortalizing the most persistent adversaries.

---

## 🚀 Installation & Setup

### Prerequisites
*   Node.js 20+
*   pnpm
*   Neon Database Account
*   Arcjet Account
*   Clerk Account (Auth)

### 1. Clone & Install
```bash
git clone https://github.com/your-username/digital-twin-3.git
cd digital-twin-3
pnpm install
```

### 2. Environment Configuration
Create a `.env` file with the following keys:
```env
DATABASE_URL="postgresql://..."
ARCJET_KEY="aj_..."
CLERK_SECRET_KEY="sk_..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
OPENAI_API_KEY="sk-..."
```

### 3. Database Migration
Initialize the database schema:
```bash
pnpm db:generate
pnpm db:migrate
```

### 4. Run Development Server
```bash
pnpm dev
```
Access the comprehensive system at `http://localhost:3000`.

---

## ⚖️ Legal & Compliance Suite

The Watchtower operates under a strict legal framework compatible with GDPR and international cybersecurity research standards.

*   [**Legal Notice**](/legal): Research purpose and liability disclaimers.
*   [**Privacy Policy**](/privacy): Data collection, retention, and forensic rights.
*   [**Terms of Service**](/terms): Rules of engagement for Red Teamers.
*   [**Cookies Policy**](/cookies): Technical storage registry (Arcjet, Clerk, Sentinel).

### 1. Research & Educational Purpose
This infrastructure is strictly a **Cybersecurity Research Laboratory**. All "active defense" mechanisms (e.g., honeypots, fingerprinting, deception layers) are deployed for the sole purpose of analyzing adversarial behavior patterns and developing threat intelligence heuristics.

### 2. Consent to Monitoring (Banner)
> **WARNING: UNCOMPLICATED ACCESS PROHIBITED**
> By connecting to this network node (`THE WATCHTOWER`), you explicitly consent to the following:
> *   **Full Packet Capture**: All traffic, including headers, payloads, and metadata, is logged.
> *   **Behavioral Analysis**: Session interactions are analyzed to generate usability and security risk scores.
> *   **Attribution**: IP addresses and device fingerprints are collected for security auditing purposes.

### 3. Liability Disclaimer
The maintainers of this repository assume **NO LIABILITY** for any consequences resulting from interactions with this system. This includes, but is not limited to:
*   Browser instability caused by heavy client-side JavaScript execution (honeypots).
*   Blocklisting of IP addresses due to detected malicious activity.
*   Psychological distress caused by the "Active Defense" narratives or simulated system crashes.

### 4. Privacy & Data Handling (GDPR/CCPA)
While this system acts as a honeypot, we adhere to data minimization principles:
*   Data is retained for **security auditing only**.
*   Personally Identifiable Information (PII) is not targeted, except where voluntarily provided (e.g., contact forms) or where public IP attribution is required for defense.

> *Unauthorized access attempts are logged and may be reported to relevant ISP abuse teams.*
