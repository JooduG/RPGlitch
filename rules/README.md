# 📁 Folder: rules

## 🎯 Purpose

This folder is the AI's direct source of truth for operational instructions. It contains machine-adjacent, actionable rules, protocols, and constraints the AI needs to perform its tasks correctly. When the AI is about to write code, modify a file, or execute a task, it will look here for its script.

---

## 📜 Folder-Specific Rules & AI Directives

* **Human Rules:** This directory defines the AI's operational parameters and behavioral constraints. Changes made here directly impact AI behavior and should be made with extreme caution, ensuring that modifications are clear, unambiguous, and align with project goals.
* **🤖 AI Directives:** AI, this folder is your primary script. When about to write code, modify a file, or execute a task, you *must* consult the relevant rules and protocols defined within this directory. These documents constitute direct orders for your behavior and are paramount to your operation.

---

## 🔗 Overarching Rules (Single Source of Truth)

This folder adheres to the following project-wide guidelines:

* [Agent Protocol (AGENTS.md)](../AGENTS.md)
* [MCP Guide](./mcp-guide.md)
* [System Orchestration Mode](./system-orchestration-mode.md)
* [System Rule Interactions](./system-rule-interactions.md)
* [Clear Thought Usage Guide](./clear-thought-usage-guide.md)

---

## ✅ TODO

* [ ] Review and refine existing rules for clarity, completeness, and unambiguous interpretation by AI agents.
* [ ] Develop new rules and protocols for emerging operational needs or complex scenarios.

---

## 💡 Usage / Notes

This directory is the "constitution" for the AI agent. It is the single source of truth for the AI's behavior and operational protocols. Human developers should understand that these rules are critical for guiding the AI's actions and ensuring its safe and effective integration into the development workflow.
