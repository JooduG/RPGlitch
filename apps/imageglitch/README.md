# 📁 Folder: imageglitch

## 🎯 Purpose

This folder contains the `ImageGlitch` application, a minimalist Text-to-Image generator built specifically for the Perchance platform. It follows a strict single-file build flow optimized for Perchance's unique two-panel architecture.

-----

## 📜 Folder-Specific Rules & AI Directives

### Human Rules

* **Styling:** Adhere to Pico.css for all foundational styling elements.
* **Architecture:** All components and logic must support a single-file build output, maintaining a clean separation between the generator logic (left panel) and the user interface (right panel).

### 🤖 AI Directives: Perchance Development for ImageGlitch

**Attention AI Agent: This is a Perchance application. All development MUST follow the two-panel structure.**

* **Generator Logic (Left Panel):** All changes to the core logic, lists, random generation, and Perchance-specific syntax **MUST** be made in the `ImageGlitch-left-panel.txt` file. This is the "code" side.
* **User Interface (Right Panel):** All changes to the HTML, CSS, and JavaScript that the user sees and interacts with **MUST** be made in the `/html`, `/scss`, and `/js` directories, which are then compiled into the final output. This is the "interface" side.

**Do not deviate from this structure.** Your primary responsibility is to maintain the integrity of this architectural separation. Refer to the [Perchance Framework Overview](../../docs/guides/perchance-framework-overview.md) if you are ever in doubt.

-----

## 🔗 Overarching Rules (Single Source of Truth)

This folder adheres to the following project-wide guidelines:

* [Perchance Framework Overview](../../docs/guides/perchance-framework-overview.md)

-----

## ✅ TODO

* [ ] Explore and potentially implement a more custom styling system beyond Pico.css.
* [ ] Add comprehensive unit tests for the core image glitching logic.

-----

## 💡 Usage / Notes

* **Entry HTML:** `apps/imageglitch/html/index.html`
* **Output HTML:** `build/output/ImageGlitch.html`
* **Build Command:** To build the application, run `npm run build:imageglitch`. This command processes the entry HTML, inlines styles, and outputs the bundled HTML for the right panel.
* **Deployment:** Take the entire output from `build/output/ImageGlitch.html` and paste it into the **right panel** of the Perchance editor. Then, take the entire content of `apps/imageglitch/ImageGlitch-left-panel.txt` and paste it into the **left panel** at `https://perchance.org/imageglitch#edit`.

## 🗺️ Navigation

* [**Up to Root**](../README.md)
