# **Perchance Development Core Guide**

Version 3.0.0 · Updated 2025-09-26

**RULE:** This document is the canonical guide for all development on Perchance platform applications within this repository. It is the single source of truth for the core architecture and development workflow.

**CORE PRINCIPLE:** All applications are built for the Perchance platform and **MUST** adhere to its **Two-Panel Architecture**. This is the foundational, non-negotiable architectural pattern.

## **1\. The Golden Rule: The Two-Panel Architecture**

The Perchance platform is fundamentally divided into two distinct but interconnected parts. Your entire development process must respect this separation of concerns.

* **The Left Panel (The "Engine Room"):** This is where **ALL** procedural logic, data lists, variables, and Perchance-specific syntax reside.  
  * **Source Files:** The content for this panel comes exclusively from .txt files (e.g., RPGlitch-left-panel.txt).  
  * **Function:** This is the application's "backend." It defines the raw data and generative rules. For example, a list like monster: goblin, orc, dragon belongs here.  
  * **Directive:** You will **NEVER** write HTML, CSS, or complex UI JavaScript in this panel.  
* **The Right Panel (The "Stage"):** This is the user-facing UI, where the output is rendered and interacted with.  
  * **Source Files:** You will edit the source files in apps/\[appName\]/html, apps/\[appName\]/js, and apps/\[appName\]/scss.  
  * **Function:** This is the application's "frontend." It pulls data and logic from the Left Panel to present a dynamic experience. For example, the HTML might contain \<p\>You encounter a \[monster\]\!\</p\>.  
  * **Directive:** The final output for this panel is **always** a single, self-contained HTML file after the build process is complete.

## **2\. The Build Philosophy: Singular & Immutable Output**

Our development workflow is built on a simple but strict philosophy: we edit the ingredients, and the build scripts are the chefs. The final, compiled application file is a sacred, immutable artifact.

* **Edit Source Files Only:** All modifications **MUST** be made to the source files located in the /apps/\[appName\]/ subdirectories (.html, .js, .scss, .txt).  
* **Trust the Build Scripts:** You **MUST** rely on the Node.js scripts in /build/scripts/ to correctly compile, concatenate, and inline all source files into the final index.html for the Right Panel.  
* **The Final Output is Singular:** The Perchance platform does not support external files. Therefore, all CSS and JavaScript **MUST** be inlined within the final HTML file. Your code must be written to function in this self-contained environment.  
* **Forbidden Action:** You **MUST NEVER** attempt to edit a compiled output file in /build/output/ directly. It is a temporary artifact, and any manual changes will be overwritten by the next build.

## **3\. Shared Right-Panel Architecture**

**RULE:** To ensure consistency, the "Right Panel" of all Perchance applications in this repository **MUST** follow a consistent, component-based HTML structure.

graph TD  
    A\[Right Panel UI\] \--\> B\[\#main-app-container\];  
    B \--\> C\[\#top-bar\];  
    B \--\> D\[\#main-output\];  
    B \--\> E\[\#chin\];  
    D \--\> F\[\#storyboard\];

* **\#main-app-container**: The root element for the entire application interface.  
* **\#main-output**: The primary content area.  
* **\#top-bar**: A persistent header for global controls and branding.  
* **\#chin**: A persistent footer or bottom-bar for secondary controls and options panels.  
* **\#storyboard**: The main content panel within \#main-output where primary user interaction occurs.

## **4\. Shared Application Lifecycle & State Management**

**RULE:** The application lifecycle is managed by the JavaScript running in the **Right Panel** and follows a standard pattern.

1. **Initialization:** The main index.js script waits for the DOMContentLoaded event, then calls an init() function. This function sets up the application, initializes the database, and attaches all necessary event listeners.  
2. **Event Handling:** User interactions are captured by the listeners attached during initialization. This is handled with cash for imperative event handling and \_hyperscript for declarative event handling directly in the HTML.  
3. **State Management:** This is a critical concept with two layers:  
   * **Simple Generative State:** For basic procedural text, the "state" (e.g., variables like gold \= 100\) can be defined and managed in the **Left Panel** using Perchance syntax.  
   * **Complex Application State:** For our rich applications like RPGlitch, the primary application state (e.g., the full list of characters, their stats, and relationships) is managed in the **Right Panel**. The state is stored in IndexedDB via **Dexie.js**. When the state changes, the JavaScript **MUST** update the database first, and only then re-render the DOM. This ensures the UI is always a reflection of persistent, stored data.

## **5\. Build & Deployment**

* **Build Process:** The goal is to compile all source files (.html, .scss, .js) into a single, self-contained HTML file for the Right Panel. The app-specific README.md files contain the exact npm run build:\[appName\] command.  
* **Deployment:**  
  1. Paste the entire content of the compiled HTML file from /build/output/ into the **right panel** of the Perchance editor.  
  2. Paste the entire content of the \*-left-panel.txt file into the **left panel** of the Perchance editor.
