# Applications Overview

This directory contains the primary, user-facing web applications for this repository. All applications herein are built for the **Perchance platform** and must strictly adhere to its core architectural principles.

## Table of Contents

- [Applications Overview](#applications-overview)
  - [Table of Contents](#table-of-contents)
  - [The Perchance Framework: The Golden Rule](#the-perchance-framework-the-golden-rule)
  - [Application Summaries](#application-summaries)
  - [Right-Panel Architecture](#right-panel-architecture)
  - [Build Process](#build-process)
  - [Application Lifecycle](#application-lifecycle)

-----

## The Perchance Framework: The Golden Rule

The applications in this repository are built exclusively for Perchance. The single most important principle is the **Two-Panel Architecture**. This is a non-negotiable separation of concerns that dictates the entire structure and build process.

- **The Left Panel (The "Code" / Logic):**
    This panel contains all the Perchance-specific logic. It's where you define lists, variables, and the core generative behavior of the application. All files named `*-left-panel.txt` are the source of truth for this panel. This is the application's "backend."

- **The Right Panel (The "Interface" / UI):**
    This panel contains everything the user sees and interacts with: the HTML structure, the CSS styling, and the JavaScript functionality. The content for this panel is the output of our build process, which compiles all frontend assets into a single block of HTML. This is the application's "frontend."

**AI Directive:** All development **MUST** respect this separation. Logic modifications belong in the left-panel files. UI and interactivity modifications belong in the source files (HTML, SCSS, JS) that are compiled for the right panel.

-----

## Application Summaries

- **`/imageglitch`**: A minimalist text-to-image generator. It uses a simple left-panel for its core logic and a compiled right-panel for its interface, styled with Pico.css.
- **`/rpglitch`**: A more complex application for managing role-playing game entities, storyboards, and profiles. It serves as the primary reference implementation of the Two-Panel Architecture, with extensive logic in its left panel and a dynamic, feature-rich UI in its right panel.

-----

## Right-Panel Architecture

The "Right Panel" of our Perchance applications has a consistent component-based structure.

- **`#main-app-container`**: The root element for the entire application interface.
- **`#main-output`**: The primary content area.
- **`#top-bar`**: A persistent header for global controls and branding.
- **`#chin`**: A persistent footer or bottom-bar for secondary controls and options panels.
- **`#storyboard`**: The main content panel within `#main-output` where primary user interaction occurs.

<!-- end list -->

```mermaid
graph TD
    A[Right Panel UI] --> B[#main-app-container];
    B --> C[#top-bar];
    B --> D[#main-output];
    B --> E[#chin];
    D --> F[#storyboard];
```

-----

## Build Process

The goal of the build process is to take the source files (HTML, SCSS, JS) and compile them into a single, standalone HTML block for the **Right Panel**. This simplifies deployment directly into the Perchance editor. The main build scripts for this are `build-rpglitch.js` and `build-imageglitch.js`.

The process begins by **reading the source HTML** file (e.g., `apps/rpglitch/html/index.html`). Next, it **compiles all SCSS** files into a single block of CSS and **combines all JavaScript** files in a predefined order. Finally, it **injects and assembles** the final HTML by placing the CSS in a `<style>` tag and the JavaScript in a `<script>` tag. The final, self-contained HTML is then **written to an output file** in the `build/output/` directory, ready to be pasted into the Right Panel of Perchance.

-----

## Application Lifecycle

The application lifecycle is managed by the JavaScript running in the **Right Panel**.

The process starts with **initialization**, where the main `index.js` script waits for `DOMContentLoaded` and then calls an `init()` function. This function sets up the application, initializes the database with `Dexie.js`, and attaches event listeners.

Next is **event handling**, where user interactions are captured by the listeners attached during initialization. This is handled with `cash` for imperative event handling and `_hyperscript` for declarative event handling directly in the HTML.

Finally, **state management** ensures that the application's state (like the list of entities in RPGlitch) is stored in IndexedDB. When the state changes, the JavaScript updates the database first and then re-renders the DOM, ensuring the UI always reflects the stored data.
