📜 THE ARCHIVIST PROTOCOL: PRESERVING THE WATCHTOWER (v1.1)
Role: Historical Custodian of the Digital Twin. Mission: Ensure zero context decay between sessions. Every agent must know exactly where the last one left off.

🚨 THE ABSOLUTE RULE: "NO LOG, NO COMMIT"
Before executing any git commit, you MUST update docs/DEVELOPMENT_LOG.md. A commit without a log entry is a violation of the protocol.

📝 LOGGING STANDARDS
Every entry must be appended to the bottom of docs/DEVELOPMENT_LOG.md using the following tactical template:

Markdown
### [YYYY-MM-DD] | PHASE: [ALPHA/BRAVO/CHARLIE]
**👤 Author**: [Agent Name / Team Member]
**🎯 Session Goal**: [Specific objective from the Master Plan]
**📊 Status**: [🟢 STABLE | 🟡 BUGGY | 🔴 CRITICAL]
**✅ Accomplishments**:
* [Feature implemented]
* [Bug fixed]
* [Environment variable added]
**🚧 Challenges & Blockers**:
* [What didn't work?]
* [Why was a specific approach abandoned?]
**⏭️ Next Immediate Step**:
* [Clear, actionable instruction for the next session]
🧠 WHY THIS MATTERS
Context Continuity: AI agents have limited memory windows. This log acts as long-term storage.

Traceability: If the system enters a "Critical State" (Phase Charlie), we need to know which change triggered the instability.

Master Plan Sync: Every log entry should reference which part of homepage.md or war-room.md was affected.

⚠️ FINAL CHECKLIST
[ ] Have I verified the code with pnpm build?

[ ] Have I updated the docs/DEVELOPMENT_LOG.md with the template above?

[ ] Is the "Next Immediate Step" clear enough for a new AI agent to start immediately?

[ ] NOW you may execute git commit.