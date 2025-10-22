# **📁 AI-Assisted Monorepo**

## **🎯 Purpose**

This monorepo contains a complete, AI-assisted ecosystem for developing and maintaining web applications. Its structure and documentation are **optimized for AI agent operation and human oversight**, facilitating a collaborative development environment.

## **🤖 Note to AI Agents**

All operational instructions, protocols, coding standards, and workflows are defined in the master protocol document:

➡️ **[AGENTS.md](./AGENTS.md)** ⬅️

This is your single source of truth. You must read and adhere to it before taking any action.

## **🗺️ Repository Navigation**

This monorepo is organized into several distinct directories. Below is a guide to the purpose, key files, and common tasks for each.

### **`/apps` - The Applications**

This directory contains the user-facing Perchance applications. Each sub-folder is a self-contained application with its own logic, UI source, and build command.

* **`apps/rpglitch`**: A feature-rich application for managing RPG entities.
  * **Logic:** `apps/rpglitch/RPGlitch-left-panel.txt`
  * **UI Source:** `apps/rpglitch/html/index.html`
  * **Build Command:** `npm run build:rpglitch`
* **`apps/imageglitch`**: A minimalist Text-to-Image generator.
  * **Logic:** `apps/imageglitch/ImageGlitch-left-panel.txt`
  * **UI Source:** `apps/imageglitch/html/index.html`
  * **Build Command:** `npm run build:imageglitch`

### **`/build` - The Factory**

This is the project's factory floor. It contains all the essential machinery (`/scripts`), blueprints (`/config`), and raw materials (`/local_libs`) required to transform the source code from `/apps` into final, deployable artifacts, which are placed in `/build/output`.

### **`/docs` - The Human's Library**

This directory is for human-readable documentation. It contains high-level guides, architectural diagrams (`/system`), and a `GLOSSARY.md` that explain the *why* and *how* of this project.

### **`/memory-bank` - The AI's Diary**

This is the AI's chronological logbook. It is organized into `/past`, `/present`, `/future`, and `/forever` to manage the AI's state and provide a complete history of its work.

### **`/src` - The Shared DNA**

This directory is the project's **Shared Code Library**. It contains all the core source code—modules, utilities, and foundational components—that are designed to be reused across multiple applications. While `/apps` contains self-contained applications, `/src` holds the shared, application-agnostic DNA they might depend upon.

* **Layout:** Source code resides in `/src/main` with corresponding tests in `/src/tests`.
* **Philosophy:** All code in `/src` must be application-agnostic, highly reusable, and have comprehensive test coverage.

### **`/tests` - The Quality Assurance Department**

This contains all the automated tests that verify the functionality, stability, and correctness of the applications and core systems.

* **Run Tests:** To run the full suite, use the command `npm test`.

### **`/tools` - The Utility Belt**

This directory contains a collection of specialized scripts and utilities designed to assist with maintenance (`css-cleanup.js`), automate repetitive tasks, and diagnose system issues (`/diagnostics`).
