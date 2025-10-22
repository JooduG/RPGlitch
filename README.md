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

## **🛠️ Development**

This section provides a guide to the development process, from building and testing to coding style and security.

### **Build, Test, and Development Commands**

- `npm run build`: Builds RPGlitch into a single inlined HTML.
- `npm run deploy`: Syncs, runs tests, lints (fix), builds, and copies artifacts.
- `npm run deploy:loose`: Same as deploy but continues on non-critical failures.
- `npm run sync`: Sync shared libs/configs/docs.
- `npm run lint` / `npm run lint:fix`: Lint JS, CSS, Markdown (auto-fix where possible).
- `npm test`: Run Jest test suite (jsdom environment).
- `npm run validate`: Sanity-check that `build/output/RPGlitch.html` exists and is non-empty.

### **Coding Style & Naming Conventions**

- **JavaScript:** ES2022+, 2‑space indentation, `camelCase` for functions, `App.*` for global app APIs.
- **CSS/SCSS:** `kebab-case` classes, optional BEM modifier (`.block--modifier`).
- **Linting:** ESLint (`build/config/eslint.config.mjs`) and Stylelint (`build/config/stylelint.config.js`). Keep diffs small and deterministic.
- **HTML safety:** Sanitize any dynamic HTML via `DOMPurify.sanitize()`.

### **Security & Configuration Tips**

- Never commit secrets. Use local `.env` for dev.
- Avoid external network calls in app code; prefer vendoring to `build/local_libs/`.
- Don’t hand‑edit generated outputs (`build/output/`). Avoid writing to `node_modules/`.

## **🎨 Design Philosophy**

Our design philosophy is built on a foundation of minimalism, clarity, and robustness.

* **Clarity Over Cleverness:** The user should never have to guess. Functionality must be explicit and unambiguous.
* **Minimalism with Purpose:** Every visual element must serve a purpose. We remove the unnecessary to give power to the essential.
* **Consistency is Queen:** Similar elements must look and behave similarly across all applications. This builds trust and reduces cognitive load.
* **Accessibility by Design:** Our interfaces must be usable and accessible to everyone. This is a non-negotiable baseline.

For more detailed information on our design system, please see the [Design System documentation](./docs/design-system.md).

## **🤝 Contributing**

We welcome contributions to this project. To ensure a smooth and collaborative process, please adhere to the following guidelines. For detailed technical and AI-specific protocols, please refer to [AGENTS.md](./AGENTS.md).

### **Pull Request Guidelines**

- **Keep PRs small and focused:** Each pull request should address a single issue or feature.
- **Clear Titles and Descriptions:** The title should follow the format `[<scope>] <summary>` (e.g., `[docs] Update contributing guidelines`). The description should include:
  - A clear explanation of the changes.
  - Steps for validation.
  - Screenshots for any UI changes.
  - Links to any related issues.
- **Branch Naming for Humans:** Use the format `{scope}/{short-task-description}` (e.g., `docs/update-contributing-guide`).

## **📖 Glossary**

| Term                 | Meaning                                                                  |
| -------------------- | ------------------------------------------------------------------------ |
| Chin (Panel)         | Slide-out side panel used in RPGlitch UI                                 |
| Storyboard Card      | Card representing Story + Character + World tuple                        |
| PF-Pic               | Profile-picture placeholder component                                    |
| Overlay Guard        | A function that force-closes loading modals and clears UI-blocking states. |
| UI Watchdog          | A polling mechanism to detect and auto-heal UI blocking issues.            |
| Recovery Hooks       | Event listeners that trigger UI healing on user interaction or browser events. |
| Attribute Observer   | A mechanism to instantly neutralize UI-blocking attribute changes.       |
