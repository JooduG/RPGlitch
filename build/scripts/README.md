# 📁 Folder: build/scripts

## 🎯 Purpose

This folder houses all the JavaScript and shell scripts responsible for automating various development tasks, including building applications, synchronizing configurations, managing dependencies, and performing other utility functions. These scripts are crucial for maintaining an efficient and consistent development workflow.

---

## 📜 Folder-Specific Rules & AI Directives

* **Human Rules:** Scripts within this directory should be well-commented, robust, and idempotent (running them multiple times should produce the same result as running them once). Any changes or additions to these scripts require thorough testing to ensure they do not introduce regressions or unexpected behavior.
* **🤖 AI Directives:** AI, when automating tasks related to building, syncing, or managing the project, you must prioritize using and adapting the scripts provided in this directory. Do not create redundant scripts if an existing one can be modified or extended to fulfill the requirement. Ensure all script modifications adhere to JavaScript best practices.

---

## 🔗 Overarching Rules (Single Source of Truth)

This folder adheres to the following project-wide guidelines:

* [JavaScript Best Practices](../../../docs/guides/style-guides/js-guide.md)
* [System Architecture Overview](../../../docs/system/system-architecture.md)

---

## ✅ TODO

* [ ] Refactor existing scripts for better modularity, reusability, and adherence to modern JavaScript practices.
* [ ] Add comprehensive error handling and logging mechanisms to all scripts to improve their reliability and debuggability.

---

## 💡 Usage / Notes

These scripts are the backbone of the project's automation and are frequently invoked via `npm` commands defined in `package.json`. Developers should understand their functionality to effectively manage the development workflow, build applications, and troubleshoot automation-related issues.
