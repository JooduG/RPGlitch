# 📁 Folder: memory-bank

## 🎯 Purpose

This directory serves as the project's "Diary," a chronological logbook that tracks the project's journey over time—what has been done, what is being done, and what is planned. It is a shared space for both human and AI to access historical context and project evolution.

---

## 📜 Folder-Specific Rules & AI Directives

* **Human Rules:** This folder is primarily for historical context, work logs, and tracking project progress. Avoid placing static documentation (which belongs in `/docs`) or direct operational rules (which belong in `/rules`) here. Content should be organized chronologically or by task.
* **🤖 AI Directives:** AI, use this folder to log work, summarize completed tasks, store future plans, and capture learnings. Strictly adhere to the `past/`, `present/`, and `future/` subdirectories for chronological organization. When a task is completed, move relevant files from `/present` to a timestamped subdirectory in `/past`.

---

## 🔗 Overarching Rules (Single Source of Truth)

This folder adheres to the following project-wide guidelines:

* [Agent Protocol (AGENTS.md)](../AGENTS.md)
* [System Documentation Guide](../docs/system/system-documentation-guide.md)

---

## ✅ TODO

* [ ] Implement automated archiving mechanisms for moving completed task logs from `/present` to `/past`.
* [ ] Define clear guidelines and templates for content stored in the `/future` directory to ensure consistency.

---

## 💡 Usage / Notes

This directory is crucial for understanding the project's evolution and maintaining a comprehensive historical record. It provides a chronological record of activities, decisions, and future directions, making it invaluable for reviewing past work and planning future endeavors.

### Subdirectories

* **`/forever`**: Contains foundational knowledge, core principles, and critical guides that should never be forgotten.
* **`/past`**: An archive of completed tasks, logs, and historical context.
* **`/present`**: Holds information relevant to the current, active task.
* **`/future`**: For planning and long-term goals; ideas and proposed tasks not yet active.
* **`/archive`**: For information no longer in active use but retained for reference (e.g., deprecated content).
