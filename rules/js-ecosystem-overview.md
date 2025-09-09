# JavaScript Ecosystem Overview

This document provides a high-level overview of the core third-party JavaScript libraries used throughout this project. Each library has a specific purpose, and understanding their roles is key to effective development.

---

## 1. Core Libraries

### `cash` (v8.1.5)

- **Purpose:** DOM Manipulation
- **Description:** A lightweight, modern alternative to jQuery for manipulating the DOM. It provides a familiar, chainable syntax for selecting elements, modifying classes and attributes, and handling events. All direct DOM interactions in `.js` files should use `cash`. For detailed usage, refer to [js-dom.guide.md](../js-dom.guide.md).
- **Official Docs:** [https://github.com/fabiospampinato/cash](https://github.com/fabiospampinato/cash)

### `Dexie.js` (v3.2.2)

- **Purpose:** Client-Side Database (IndexedDB)
- **Description:** A minimalist wrapper for IndexedDB that makes working with a client-side database easy and intuitive. It provides a clean, promise-based API (`async/await` friendly) for defining schemas and performing CRUD operations. For detailed usage, refer to [js-storage-guide.md](../js-storage-guide.md).
- **Official Docs:** [https://dexie.org/](https://dexie.org/)

### `_hyperscript` (v0.9.12)

- **Purpose:** Declarative Event Handling in HTML
- **Description:** An scripting language that lives directly in HTML attributes (`_`). It's used for simple, declarative UI behaviors like toggling classes or calling simple functions on click. It is not meant for complex application logic. For detailed usage, refer to [html-hyperscript-guide.md](../html-hyperscript-guide.md).
- **Official Docs:** [https://hyperscript.org/](https://hyperscript.org/)

### `DOMPurify` (v3.0.1)

- **Description:** A crucial security library used to sanitize HTML strings before they are inserted into the DOM. It prevents Cross-Site Scripting (XSS) attacks by removing any potentially malicious code. All user-generated content that will be rendered as HTML *must* be passed through `DOMPurify.sanitize()`. For broader HTML security and best practices, refer to [html-best-practises.md](../html-best-practises.md).
- **Official Docs:** [https://github.com/cure53/DOMPurify](https://github.com/cure53/DOMPurify)
