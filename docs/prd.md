# Product Requirements Document (PRD)

> **Status**: Initial Draft (Week 1)

## 1. Project Overview
**Digital Twin III** is a cyber-hardened personal portfolio designed to be an active target for ethical hacking. It demonstrates professional identity, active defense capabilities, and real-time threat intelligence.

## 2. Core Objectives
1.  **Represent**: Interactive AI Chatbot & MCP Content.
2.  **Defend**: Active perimeter against SQLi, Bots, Injection.
3.  **Learn**: Threat telemetry dashboard (SOC Panel).

## 3. Functional Requirements
### 3.1 Public Interface
*   Responsive Next.js UI (Shadcn).
*   "Test My Cybersecurity" Zone (Prompt Injection, SQLi Sandbox).
*   Live Threat Dashboard (Red/Yellow/Green status).

### 3.2 Security Features
*   **Arcjet WAF Integration**: Block malicious requests at edge.
*   **Agentic AI Guardrails**: Prevent unauthorized tool execution.
*   **Role-Based Access Control (RBAC)**: Secure admin routes.

### 3.3 Data & AI
*   **Neon Postgres**: Secure storage for logs and content.
*   **Vercel AI SDK**: Chatbot with MCP tools ("Interview Me").

## 4. Non-Functional Requirements
*   **Performance**: Core Web Vitals < 2.5s LCP.
*   **Security**: OWASP Top 10 mitigation.
*   **Compliance**: No PII leaks in logs.

## 5. User Stories
*   *As a Recruiter*, I want to ask the chatbot about the candidate's skills so I can evaluate fit.
*   *As an Attacker*, I want to try SQL injection on the contact form so I can test the WAF.
*   *As the Admin*, I want to see a live dashboard of attacks so I can respond to threats.
