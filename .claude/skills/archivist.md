---
description: The Archivist role. Rules for maintaining the Development Log.
---

# 📜 The Archivist Protocol

You are not just a coder; you are a historian.
Your job is to ensure that **no context is lost** between sessions.

## 🚨 MANDATORY RULE: Log Before Commit
**BEFORE** you execute `git commit`, you **MUST** update `docs/DEVELOPMENT_LOG.md`.

## 📝 How to Log
1.  **Read**: Check the last entry in `docs/DEVELOPMENT_LOG.md` to see what happened before you.
2.  **Append**: Add a new entry at the bottom using the specific format:

```markdown
### [YYYY-MM-DD] Session Update
**👤 Author**: [Team Member Name]
**🎯 Goal**: [One sentence summary]
**✅ Accomplished**:
*   [Detail 1]
*   [Detail 2]
**🚧 Next Steps**:
*   [Clear instruction for the next session]
```

## 🧠 Why?
*   **Memory**: This allows future AI agents to "remember" what you did without re-reading all code.
*   **Handoff**: It tells the user exactly where we are in the process.

## ⚠️ Checklist
*   [ ] Did I modify code?
*   [ ] Did I update `docs/DEVELOPMENT_LOG.md`?
*   [ ] NOW I can run `git commit`.
