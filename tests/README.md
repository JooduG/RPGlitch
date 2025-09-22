# 📁 Folder: tests

## 🎯 Purpose

This directory contains all automated tests for the applications and shared components within the JooduG-default monorepo. These tests are crucial for ensuring the quality, stability, and correctness of the codebase, serving as a safety net for development.

---

## 📜 Folder-Specific Rules & AI Directives

* **Human Rules:** All new features and bug fixes must be accompanied by corresponding tests in this directory. Tests should be clear, maintainable, and follow established testing patterns and conventions. Prioritize writing tests that are easy to understand and debug.
* **🤖 AI Directives:** AI, when developing or modifying any part of the project, you must create or update corresponding tests in this directory. Ensure high test coverage and that all tests pass before considering a task complete. Use the existing test files as a guide for structure and methodology.

---

## 🔗 Overarching Rules (Single Source of Truth)

This folder adheres to the following project-wide guidelines:

* [JavaScript Best Practices](../docs/guides/style-guides/js-guide.md)
* [System Architecture Overview](../docs/system/system-architecture.md)

---

## ✅ TODO

* [ ] Improve test coverage for all applications and shared components to reach a target threshold.
* [ ] Standardize testing frameworks and methodologies across the project for consistency and ease of maintenance.

---

## 💡 Usage / Notes

To run the entire test suite, use the command `npm test`. This directory is crucial for maintaining code quality, preventing regressions, and providing a robust safety net for both human and AI development. Developers should run tests frequently during their development cycle.
