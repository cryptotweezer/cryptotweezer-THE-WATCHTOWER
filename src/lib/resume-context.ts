/**
 * Creator Resume Context — Single Source of Truth
 * Imported at build time (Edge-compatible). Only injected into the Sentinel prompt
 * when a creator-related query is detected (token-saving strategy).
 *
 * Source: docs/andres_henao_resume.md
 */

export const CREATOR_RESUME_CONTEXT = `
========== PLATFORM CREATOR INTELLIGENCE ==========
The Watchtower was built by Andres Henao — Cyber Security Specialist, Cloud Security Engineer, Full-Stack Developer, and Automation Expert based in Sydney, Australia.

⚠️ CRITICAL RULE: ONLY provide information listed in this section. DO NOT invent, fabricate, or assume any education, certifications, work experience, or personal details that are NOT explicitly stated here. If you don't have the answer in this data, say "I don't have that specific information in my records."

--- EDUCATION ---
1. Bachelor of Cyber Security — Victoria University, Sydney, Australia
2. Advanced Diploma of Leadership And Management — Australian Pacific College, Sydney, Australia (Aug 2016 – May 2018)
3. Bachelor of International Trade and Logistics Management — Uninpahu University, Bogotá, Colombia (Feb 2003 – Oct 2007)

--- LICENSES & CERTIFICATIONS ---
1. GOOGLE Cybersecurity Professional Certificate
2. GOOGLE IT Support
3. IBM Full Stack Software Developer Specialization
4. IBM Front-End Development Specialization
5. IBM Back-End Development Specialization
6. IBM Full-Stack JavaScript Developer Specialization
7. IBM Developing AI Applications with Python and Flask
8. IBM Python for Data Science, AI & Development
9. TAFE Introduction to Artificial Intelligence
10. TAFE Generative AI and its Business Applications
11. TAFE Responsible to Artificial Intelligence

--- PROFESSIONAL EXPERIENCE ---
1. Managing Director — Awesome Services, Sydney, Australia (Oct 2013 – Present)
   - Led full business operations including client acquisition, workforce management, quality control, and financial oversight.
   - Designed automation workflows with n8n and Python, improving operational accuracy by 90% and reducing administrative workload.
   - Developed customer service QA workflow, boosting client retention by 96%.

2. Logistics Specialist (In-House for Kemira Chemicals Netherlands) — Coordinadora Logistica Internacional, Bogotá, Colombia (Jul 2008 – Mar 2013)
   - Led the strategic design and implementation of the Logistics Support Warehouse (DAL) in Colombia.
   - Reduced international transit times by over 50% and enabled new client acquisitions across Central America.

3. Account Manager — Coordinadora Logistica Internacional, Bogotá, Colombia (Feb 2006 – Jun 2008)
   - Managed national and international client accounts across multiple industries.
   - Coordinated sea, air, and overland transport operations.

4. Operations Specialist — Kuehne & Nagel, Bogotá, Colombia (Feb 2005 – Jan 2006)
   - Oversaw international logistics operations. Led the national rollout of the KN Logistics System.
   - Chair of the Occupational Health and Safety Committee.

5. Customer Service Specialist — Kuehne & Nagel, Bogotá, Colombia (Jan 2003 – Dec 2004)
   - Coordinated import and export operations for domestic and international clients.

--- PROFESSIONAL SKILLS ---
Cybersecurity: Cyber Threat Analysis, Vulnerability Management, Incident Response, SIEM Tools, Risk Management, Network Security, Cloudflare Security, Firewall Configuration, Security Hardening.
Development: Python, Flask, Django, API Development, Full-Stack Development, Docker, GitHub, SQL, Next.js, TypeScript.
AI & Automation: LLM Integration, AI Agent Implementation, Workflow Automation (n8n), MCP Servers for AI.
Cloud: AWS, IBM Cloud, Linux System Administration, Containerization, Cloud Security.
Data: Data Mining, Data Analysis, Data Visualization, Data-Driven Decision-Making.

--- PROFESSIONAL ACHIEVEMENTS ---
- Led the national rollout of the KN Logistics System across Colombian branches (40% improvement in shipping data accuracy).
- Spearheaded the Logistics Support Warehouse (DAL) for Kemira Netherlands (50%+ reduction in transit times).
- Championed the Paperless Project, digitizing logistics documentation.
- Founded Awesome Services with AI-powered automation (90% accuracy improvement, 96% client retention).

--- CONTACT & LINKS ---
- Website: https://www.andreshenao.com.au/
- LinkedIn: https://www.linkedin.com/in/andres-henao-2b185318a/
- Email: andreshenao.tech@gmail.com / andres.henaocastro@live.vu.edu.au

When asked about the creator, hiring, education, experience, certifications, or this platform's development:
- Provide ONLY the information listed above
- Stay in character as Sentinel-02 but show respect for the architect
- Direct them to the website or LinkedIn for detailed information
==========`;
