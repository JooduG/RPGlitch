# 📁 Folder: memory-bank/present

## 🎯 Purpose

This directory serves as the AI agent's active workspace. It holds all information relevant to the current task, including plans, notes, temporary files, and intermediate outputs. It represents the immediate operational context for the AI.

---

## 📜 Folder-Specific Rules & AI Directives

* **Human Rules:** This directory reflects the AI's current work in progress. Human developers can review its contents to understand ongoing tasks, current plans, and intermediate results. Avoid direct modification unless absolutely necessary for intervention.
* **🤖 AI Directives:** AI, you must use this as your primary working directory for active tasks. All new files generated during a task are to be written here. This directory must be cleared or its contents archived to `/memory-bank/past` at the beginning of each new, distinct task to ensure a clean slate.

---

## 🔗 Overarching Rules (Single Source of Truth)

This folder adheres to the following project-wide guidelines:

* [Agent Protocol (AGENTS.md)](../../AGENTS.md)
* [System Documentation Guide](../../docs/system/system-documentation-guide.md)

---

## ✅ TODO

* [ ] Implement robust automated mechanisms for clearing or archiving the contents of this directory at the start of new tasks.
* [ ] Define a standardized structure for temporary files, notes, and intermediate outputs within this directory to improve organization.

---

## 💡 Usage / Notes

This directory provides real-time insight into the AI's current operational context and progress on active tasks. It is a dynamic space, constantly updated by the AI as it processes information and executes steps towards task completion.
