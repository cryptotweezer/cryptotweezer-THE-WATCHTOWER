# Product Requirements Document (PRD)

> **Status**: Living Document (Pivot to SecOps Platform)

## 1. Project Overview
**Digital Twin III** is a **SecOps & Active Defense Platform**. It acts as a defensive teacher, offering a dual experience: mentoring "Apprentices" and challenging "Adversaries" via a self-defending infrastructure.

## 2. Core Objectives
1.  **Teach**: Explain security concepts to novices (The Apprentice).
2.  **Challenge**: Gamify hacking for experts (The Adversary).
3.  **Defend**: Active perimeter blocking realtime attacks.
4.  **Analyze**: Forensic AI identifying attack patterns.

## 3. Functional Requirements
### 3.1 Modules
*   **The Watchtower**: Telemetry Dashboard (Live Feed, Heatmap).
*   **Session Intel**: Fingerprinting & Risk Scoring.
*   **Attack Lab**: Ethical Sandboxes (SQLi, Prompt Injection, IDOR).
*   **Hall of Fame**: Gamification Leaderboard.

### 3.2 Security Features
*   **Arcjet WAF**: Bot Detection, Rate Limiting, Tarpitting.
*   **Immutable Logs**: Drizzle/Neon auditing.
*   **Zero-Trust AI**: Vercel AI SDK PII filters.

## 4. User Stories
*   *As an Apprentice*, I want the AI to explain why my SQL injection failed so I can learn.
*   *As an Adversary*, I want to bypass the simple WAF rules to earn "Research Points".
*   *As the Architect*, I want to see a live heatmap of blocked attacks in The Watchtower.
