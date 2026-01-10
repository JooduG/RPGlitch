# 🏛️ The Monolith Structure

## 1. Directory Tree

```text
/
├── src/                   # Source Code
│   ├── js/                # Logic Layer
│   │   ├── gamemaster/    # Engine Core
│   │   ├── mesmer/        # UI Layer (Svelte)
│   │   ├── scholar/       # Database (Dexie)
│   │   └── warden/        # Security (Sanitizer)
│   └── scss/              # Style Layer (Pico)
├── libs/                  # Offline Vendors
└── tools/                 # Build Scripts
```

## 2. The Bridge (Left/Right Brain)

- **Left Panel (Perchance):** Holds `lists` and `imports`.
- **Right Panel (App):** Holds the Application Logic.
- **Communication:** `window.parent.postMessage`.

## 3. The Database (Scholar)

- **Technology:** Dexie.js (IndexedDB).
- **Rule:** The DB is the Single Source of Truth. The DOM is just a reflection.
