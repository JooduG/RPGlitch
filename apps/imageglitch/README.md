# 📁 Folder: imageglitch

## 🎯 Purpose

This folder contains the `ImageGlitch` application, a minimalist Text-to-Image generator built for the Perchance platform, following a single-file build flow.

---

## 📜 Folder-Specific Rules & AI Directives

* **Human Rules:** Adhere to Pico.css for foundational styling elements. All components and logic within this application should be designed to support a single-file build output.
* **🤖 AI Directives:** AI, when modifying the `ImageGlitch` application, ensure strict adherence to Pico.css styling principles. Prioritize maintaining compatibility with the single-file build flow and ensure all code changes are self-contained within the application's directory.

---

## 🔗 Overarching Rules (Single Source of Truth)

This folder adheres to the following project-wide guidelines:

* [JavaScript Best Practices](../../rules/js-guide.md)
* [SCSS Style Guide](../../rules/scss-style-guide.md)
* [HTML Best Practices](../../rules/html-best-practises.md)
* [Perchance Framework Overview](../../docs/guides/perchance-framework-overview.md)

---

## ✅ TODO

* [ ] Explore and potentially implement a more custom styling system beyond Pico.css.
* [ ] Add comprehensive unit tests for the core image glitching logic.

---

## 💡 Usage / Notes

* **Entry HTML:** `apps/imageglitch/ImageGlitch.html`
* **Output HTML:** `build/output/ImageGlitch.html`
* **Build Command:** To build the application, run `npm run build:imageglitch`. This command processes the entry HTML, inlines styles, and outputs the bundled HTML.
* **Copy & Paste** Take the output from `build/output/ImageGlitch.html` and `apps/imageglitch/ImageGlitch-left-panel.txt` into their respective panel in to `https://perchance.org/imageglitch#edit`.

## 🗺️ Navigation

* [**Up to Root**](../README.md)
