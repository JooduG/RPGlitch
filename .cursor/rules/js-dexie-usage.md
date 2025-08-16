---
description: Dexie.js is the recommended library for IndexedDB management in Perchance projects. Use Dexie for all persistent client-side storage needs.
tags: "indexeddb", "storage", "database", "javascript", "perchance"
globs: **/*.js
---

# Objective

Dexie.js is the recommended library for IndexedDB management in Perchance projects. Use Dexie for all persistent client-side storage needs.

---

## Usage Guidelines

- **How to include:**

    ```js
    import Dexie from 'https://cdn.jsdelivr.net/npm/dexie@3.2.2/dist/dexie.mjs';
    // or in HTML:
    <script type="module" src="https://cdn.jsdelivr.net/npm/dexie@3.2.2/dist/dexie.mjs"></script>
    ```

- **When to use:** For all IndexedDB storage, schema versioning, and transactions.
- **Example:**

    ```js
    const db = new Dexie('MyAppDB');
    db.version(1).stores({
      characters: '++id,name,data'
    });
    ```

- **Best practices:** See [IndexedDB Principles](./js-indexeddb-principles.mdc) for schema/versioning guidance.

---

## References

- [Dexie.js Docs](https://dexie.org/docs/Tutorial/)
- [IndexedDB Principles](./js-indexeddb-principles.mdc)
- [JavaScript Development](./js-development.mdc)
