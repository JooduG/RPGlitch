# 📁 Folder: rpglitch

## 🎯 Purpose

This folder contains the `RPGlitch` application, a dynamic tool for role-playing games featuring storyboard and profile management. It is designed as a single-file Perchance deliverable, optimized for the platform's unique two-panel architecture.

-----

## 📜 Folder-Specific Rules & AI Directives

### Human Rules

* **Architecture:** Strictly maintain the single-file Perchance deliverable structure.
* **UI/UX:** All changes, especially to the "Chin" component, must follow the detailed guidelines in the `RPGlitch Chin UX and Safety Guide`.

### 🤖 AI Directives: Perchance Development for RPGlitch

**Attention AI Agent: This is a Perchance application. All development MUST follow the two-panel structure.**

* **Generator Logic (Left Panel):** All modifications to the core logic, Perchance lists, random generation, and any Perchance-specific syntax **MUST** be made exclusively in the `RPGlitch-left-panel.txt` file. This file is the "code" and engine of the application.
* **User Interface (Right Panel):** All changes to the user-facing elements—including HTML, CSS, and JavaScript—**MUST** be made within the `/html`, `/scss`, and `/js` directories. These are compiled to create the final user interface.

**Do not violate this architectural separation.** Your core mission is to ensure that logic and presentation remain distinct. If you have any uncertainty, consult the [Perchance Framework Overview](../../docs/guides/perchance-framework-overview.md) immediately.

-----

## 🔗 Overarching Rules (Single Source of Truth)

This folder is governed by the following critical project-wide documents:

* [Perchance Framework Overview](../../docs/guides/perchance-framework-overview.md)

-----

## ✅ TODO

* [ ] Enhance storyboard functionality with new features.
* [ ] Improve profiles management for better user experience.

-----

## 💡 Usage / Notes

* **Entry HTML:** `apps/rpglitch/html/index.html`
* **Output HTML:** `build/output/RPGlitch.html`
* **Build Command:** To compile the application, run `npm run build:rpglitch`. This script processes the source files, inlines styles, and bundles the final HTML for the right panel.
* **Deployment:**
    1. Take the complete, compiled output from `build/output/RPGlitch.html` and paste it into the **right panel** of the Perchance editor.
    2. Take the entire content of `apps/rpglitch/RPGlitch-left-panel.txt` and paste it into the **left panel** at `https://perchance.org/rpglitch#edit`.

## 🗺️ Navigation

* [**Up to Root**](../README.md)
* [RPGlitch HTML](../../apps/rpglitch/html/readme.md)
* [RPGlitch JavaScript](../../apps/rpglitch/js/readme.md)
* [RPGlitch SCSS](../../apps/rpglitch/SCSS/readme.md)
