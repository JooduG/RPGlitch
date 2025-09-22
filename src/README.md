# 📁 Folder: src

## 🎯 Purpose

This directory serves as the primary location for the project's core source code, excluding application-specific code found in `/apps`. It contains shared modules, utilities, foundational components, and common logic intended for reuse across the entire project.

---

## 📜 Folder-Specific Rules & AI Directives

* **Human Rules:** Code within this directory should be highly modular, reusable, and well-tested. Strict adherence to established coding standards (JavaScript, SCSS, etc.) is mandatory. Each module should have a clear responsibility and minimal dependencies.
* **🤖 AI Directives:** AI, when developing shared components, utilities, or foundational code, place them in this directory. Ensure high code quality, comprehensive testing, and clear documentation for all modules created or modified here. Prioritize reusability and maintainability.

---

## 🔗 Overarching Rules (Single Source of Truth)

This folder adheres to the following project-wide guidelines:

* [JavaScript Best Practices](../../docs/guides/style-guides/js-guide.md)
* [System Architecture Overview](../../docs/system/system-architecture.md)

---

## ✅ TODO

* [ ] Define clear module boundaries and responsibilities for all components within `src/`.
* [ ] Implement a robust and comprehensive testing strategy for all shared components and utilities.

---

## 💡 Usage / Notes

This directory is for code that is intended to be shared across multiple applications or is fundamental to the project's infrastructure. Developers should look here for common functionalities and contribute reusable components that benefit the entire ecosystem.
