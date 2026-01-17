# 🗺️ Project Master Roadmap (`docs/ROADMAP.md`)

> **🔴 GLOBAL RULE**: This is the sequential execution order. **DO NOT SKIP STEPS.**
> **Current Phase**: 🟡 Phase 2 (Architecture & Design)

## Phase 1: Foundation (Week 1) ✅
- [x] **1.1 Repository Setup**: Initialize Git, `.gitignore`, Branch Protection.
- [x] **1.2 Documentation Core**: Create `README.md`, `PROJECT_OVERVIEW.md`, `agents.md`.
- [x] **1.3 CI/CD Pipeline**: Setup `quality.yml` for Lint/Build checks.
- [x] **1.4 Tech Stack Init**: Next.js 16, TypeScript, Tailwind, ESLint.
- [x] **1.5 Team Onboarding**: Add team members to README and GitHub.

## Phase 2: Architecture & Design (Week 2) 🚧
- [ ] **2.1 Technical Design Generation**:
    - [ ] Create `docs/design.md` (AI-generated from PRD).
    - [ ] Define Database Schema (Neon/Drizzle).
    - [ ] Define API Routes & Server Actions.
    - [ ] **Review**: Team Lead approval required via PR.
- [ ] **2.2 Implementation Planning**:
    - [ ] Create `docs/implementation-plan.md` derived strictly from `design.md`.
    - [ ] Break down tasks into small, testable tickets (ClickUp/issues).

## Phase 3: Core Implementation (Week 3) 🛑
**Do not start until Phase 2 is marked `[x]`.**
- [ ] **3.1 MCP Server Integration**:
    - [ ] Setup `src/mcp-server`.
    - [ ] Implement "Interview Me" tool.
- [ ] **3.2 Database Layer**:
    - [ ] Setup Neon DB connection.
    - [ ] Run Drizzle migrations.
- [ ] **3.3 Public Interface (MVP)**:
    - [ ] Landing Page (Hero, About, Contact).
    - [ ] Chat UI Component (Vercel AI SDK).
- [ ] **3.4 Security Perimeter**:
    - [ ] Integrate Arcjet WAF Middleware.
    - [ ] Implement Rate Limiting.

## Phase 4: Refinement & Production (Week 4) 🛑
- [ ] **4.1 Production Deployment**:
    - [ ] Deploy to Vercel (Production Environment).
    - [ ] Verify SSL and Custom Domain.
- [ ] **4.2 Performance Optimization**:
    - [ ] Optimize Images & Fonts.
    - [ ] Achieve Core Web Vitals (LCP < 2.5s).
- [ ] **4.3 Threat Telemetry**:
    - [ ] Build Admin Dashboard (SOC Panel).
    - [ ] Connect Real-time Attack Logs.

## Phase 5: Final Polish (Week 5) 🛑
- [ ] **5.1 Bug Bash**: Resolve all P0/P1 issues.
- [ ] **5.2 Optional Features**: Voice Interface (if time permits).
- [ ] **5.3 Presentation Prep**:
    - [ ] Create `docs/presentation-outline.md`.
    - [ ] Rehearse Live Defense Demo.

## Phase 6: Submission (Week 6) 🛑
- [ ] **6.1 Final Audit**: Verify repository is clean (no secrets).
- [ ] **6.2 Evidence Collection**: Screenshots, PDFs, Commit Logs.
- [ ] **6.3 Final Release**: Tag version `v1.0.0`.
