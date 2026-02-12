# 🛡️ Platform Constraints: Perchance

This document legislates the physical and technical limits of the Perchance platform. All code generation and architectural decisions **MUST** adhere to these rules.

## ⚡ The Iron Constraints (Hard Limits)

1. **The Single-File Mandate**:
    - **DO NOT** attempt to load external CSS or JS files via `<link>` or `<script src="...">`.
    - **REQUIRED**: All assets must be inlined into a single `index.html` file during the build process.
    - **DO NOT** use absolute paths for local assets; they will fail on Perchance.

2. **File Size Ceiling**:
    - **DO NOT** exceed a total bundle size of **~350KB**.
    - **REQUIRED**: Monitor `dist/index.html` size. Large libraries are strictly prohibited.
    - **DO NOT** include high-resolution base64 encoded images in the source code.

3. **Storage Restrictions (Freedom Protocol)**:
    - **DO NOT** use `localStorage` or `sessionStorage` directly using standard browser APIs. Perchance intercepts and restricts these.
    - **REQUIRED**: Use the **Freedom Protocol** (Scholar/IndexedDB) for all persistence.
    - **DO NOT** store sensitive API keys in the client-side storage where they can be trivially extracted from the Perchance editor.

4. **HTML & DOM Limits**:
    - **DO NOT** use HTML tags that are stripped by Perchance's sanitizer (e.g., certain iframe configurations or meta tags).
    - **REQUIRED**: Keep the DOM structure within the `#main-app-container` hierarchy.

5. **JS Execution Patterns**:
    - **DO NOT** implement infinite loops or high-frequency polling that relies on the global Perchance re-roll state.
    - **REQUIRED**: Use the **Director Pattern** (Pattern C) to manage state updates independently of the platform's random seed.

## 🏗️ Deployment Protocol

- **DO NOT** deploy to Perchance without passing `npm run verify`.
- **REQUIRED**: Verify the layout on both Desktop (Cinematic 2-8-2) and Mobile (25vh fixed header) before shipping.
