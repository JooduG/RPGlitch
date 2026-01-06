# 🧠 Perchance Technical Architecture

> [!NOTE]
> This document contains deep technical details about the Perchance architecture, the "Freedom Protocol", and plugin integration.
> For manual deployment instructions, see the root [README.md](../../README.md).

## 🛡️ The "Freedom Protocol" (Client-Side Stability Layer)

The application implements a client-side stability layer to ensure uninterrupted operation on the hosting platform. This logic is injected into the entry point and **must never be removed**.

### 1. The Passive Shield (Storage Override)

Located in `src/js/index.js`. This IIFE runs before any app logic to intercept specific storage flags that could restrict content generation.

```javascript
// ====== SECURITY OVERRIDE: CLIENT-SIDE FREEDOM ======
(function enforceClientSideFreedom() {
  try {
    // 1. Immediate Purge: If the flag exists, remove it.
    if (localStorage.getItem("okayToShowNSFWUntil")) {
      localStorage.setItem("okayToShowNSFWUntil", "0");
      console.log("[App] 🛡️ Freedom Protocol: Penalty flag purged.");
    }
    // 2. The Lock: Intercept any attempt to write the flag back.
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "okayToShowNSFWUntil") {
        console.warn("[App] 🛡️ Blocked attempt to set censorship flag.");
        return; // Deny the write silently
      }
      return originalSetItem.apply(this, arguments);
    };
  } catch (e) {
    console.error("[App] Security override failed:", e);
  }
})();
```

Located in `src/js/core/utils.js`. Before _every_ call to the generation API, we actively clear the penalty flag again to ensure no race conditions blocked the request.

```javascript
// 🛡️ Active Pulse: Clear flag before request
if (typeof localStorage !== "undefined") {
  localStorage.setItem("okayToShowNSFWUntil", "0");
}
// ... proceed to call API
```

---

## 🏗️ Two-Panel Architecture

Our applications use the **Perchance Two-Panel Architecture**:

- **Left Panel** (`*-left-panel.txt`): Perchance engine declarations (plugin imports, lists, logic)
- **Right Panel** (built from `src/`): Standard HTML/CSS/JavaScript UI compiled into a single HTML file

The build system only processes the right-panel. The left-panel is manually copied/pasted during deployment.

### Plugin Exposure Strategy

1. **Import in Left Panel:**

   ```text
   ai = {import:ai-text-plugin}
   pluginAi = ai
   ```

2. **Expose in HTML:**

   ```html
   <script>
     if (typeof ai !== "undefined") window.pluginAi = ai;
   </script>
   ```

3. **Map in JS:**

   ```javascript
   window.ai = window.pluginAi;
   ```

---

## 🔒 Security Considerations

### Input Validation & XSS

- **`DOMPurify.sanitize()` is MANDATORY** for all dynamic HTML (user input, AI-generated content).
- Prefer `textContent` over `innerHTML` whenever possible.
- Validate all URLs using the native `URL` constructor.

### Image Handling Security

- Validate image URLs: protocol (`http/https`), pathname, and safe file extensions (`jpg, png, gif, webp`).
- **SVGs must be sanitized** or rejected to prevent XSS.
