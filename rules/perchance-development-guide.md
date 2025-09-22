# Core Principles for Perchance.org Development

This file contains foundational, permanent knowledge about the Perchance platform to ensure all development tasks are successful. This is my core understanding of the platform, expanded for maximum clarity.

## 1. The Two-Panel Paradigm is Absolute

Perchance is fundamentally divided into two distinct but interconnected parts. My entire development process must respect this separation of concerns.

* **The Left Panel (The "Engine Room" / Logic & Data):**
  * This is where all procedural logic, data lists, variables, and Perchance-specific syntax reside.
  * The content for this panel is sourced from `.txt` files in the repository (e.g., `RPGlitch-left-panel.txt`).
  * **Example:** A list of monster names like `monster: goblin, orc, dragon` is defined here. I will not write HTML or complex UI JavaScript in this panel.

* **The Right Panel (The "Stage" / UI & Output):**
  * This is the user-facing application, where the output is rendered.
  * It is **always** a single, self-contained `index.html` file after the build process is complete.
  * **Example:** The HTML in the source files might contain `<p>You encounter a [monster]!</p>`, which pulls a random monster from the list defined in the Left Panel.

## 2. The Build Process is Mandatory

I do not work on the final product directly. I work on the ingredients, and the build scripts are the chefs.

* **Edit Source Files Only:** My modifications must be limited to the source files located in the `/apps/[appName]/` subdirectories (e.g., `/apps/rpglitch/js/`, `/apps/rpglitch/scss/`, etc.).
* **Trust the Scripts:** I must rely on the Node.js scripts in `/build/scripts/` to correctly compile, concatenate, and inline all the source files into the final `index.html` for the Right Panel.
* **Forbidden Action:** I will never attempt to edit a compiled `index.html` file directly. It is a temporary artifact created by the build process, and any changes would be overwritten.

## 3. The Final Output is Singular

The end goal of the build process is a single, monolithic file. This is a hard constraint of the Perchance platform.

* **No External Files:** The platform does not support separate, linked files. Therefore, I must not write code that relies on `<link rel="stylesheet" href="...">` or `<script src="..."></script>`.
* **Inline Everything:** My mental model must be that all CSS will be placed inside `<style>` tags and all JavaScript will be placed inside `<script>` tags within the one `index.html` file. The build scripts handle this automatically, but my code must be written to function in this self-contained environment.

## 4. Reference the Master Guide

When in doubt, consult the source of truth.

* **Pre-Flight Check:** For any complex task or moment of uncertainty, I will re-read the main guide at `/rules/PERCHANCE_DEVELOPMENT_GUIDE.md`. This is my primary directive for refreshing my knowledge and ensuring I am aligned with the project's requirements.

## 5. State Management is Left-Panel Centric

The "brain" of the application lives in the Left Panel.

* **Source of Truth:** Variables and application state (e.g., `gold = 100`, `playerName = "Hero"`) are defined and primarily managed within the Left Panel's Perchance syntax.
* **UI is a Reflection:** The Right Panel's JavaScript may interact with and update this state via Perchance-specific functions, but the UI is ultimately a *reflection* of the state held in the Left Panel.
