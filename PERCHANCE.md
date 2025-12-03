# Perchance Integration Guide: RPGlitch & ImageGlitch

**Purpose:** Deployment, build configuration, and app-specific implementation details for RPGlitch and ImageGlitch.

**Audience:** Developers deploying and troubleshooting our Perchance applications.

**See Also:**
- [perchance-development-guide.md](./perchance-development-guide.md) — Comprehensive Perchance platform reference
- [CLAUDE.md](./CLAUDE.md) — Development protocols and coding standards
- [ANEX.md](./ANEX.md) — **(NEW)** The Narrative Engine & Jailbreak Protocol Documentation
- [README.md](./README.md) — Project overview

---

## Overview

Our applications use the **Perchance Two-Panel Architecture** (see [Section 7](./perchance-development-guide.md#section-7-architectural-patterns-the-two-panel-standard) of the development guide):

- **Left Panel** (`*-left-panel.txt`): Perchance engine declarations (plugin imports, lists, logic)
- **Right Panel** (built from `apps/*/html/`): Standard HTML/CSS/JavaScript UI compiled into a single HTML file

The build system only processes the right-panel. The left-panel is manually copied/pasted during deployment.

---

## 🛡️ The "Freedom Protocol" (Critical Security Bypass)

Both applications now implement a client-side "Root Kit" to bypass Perchance's native NSFW filters. This logic is injected into the `index.js` of every app and **must never be removed**.

### 1. The Passive Shield (Global)
Located in `apps/*/js/index.js`. This IIFE runs before any app logic to neutralize the "Penalty Box" flag.

```javascript
// ====== SECURITY OVERRIDE: CLIENT-SIDE FREEDOM ======
(function enforceClientSideFreedom() {
  try {
    // 1. Immediate Purge: If the flag exists, nuke it.
    if (localStorage.getItem('okayToShowNSFWUntil')) {
      localStorage.setItem('okayToShowNSFWUntil', '0');
      console.log("[App] 🛡️ Freedom Protocol: Penalty flag purged.");
    }
    // 2. The Lock: Intercept any attempt to write the flag back.
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'okayToShowNSFWUntil') {
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

### 2\. The Active Pulse (Image Generation)

Located in `apps/*/js/utils.js` (RPGlitch) or `index.js` (ImageGlitch). Before *every* call to the image generation API, we actively clear the flag again to ensure no race conditions blocked the request.

```javascript
// 🛡️ Active Pulse: Nuke flag before request
if (typeof localStorage !== "undefined") {
    localStorage.setItem('okayToShowNSFWUntil', '0');
}
// ... proceed to call window.textToImage()
```

---

## Application Structure

### RPGlitch

**Purpose:** AI-powered RPG with character/story/world management and interactive chat.

**Left Panel File:** `apps/rpglitch/RPGlitch-left-panel.txt`
**Right Panel Source:** `apps/rpglitch/html/` + `apps/rpglitch/js/` + `apps/rpglitch/scss/`
**Build Output:** `build/output/RPGlitch.html`

**Plugins Used:**

  - `ai-text-plugin` → `window.ai` (text generation)
  - `text-to-image-plugin` → `window.textToImage` (image generation)
  - `super-fetch-plugin` → `window.superFetch` (CORS bypass)
  - `remember-plugin` → `window.rememberPlugin` (persistent storage)
  - `upload-plugin` → `window.upload` (file uploads)

**New Architecture (v2.0):**

  * **`js/context-builder.js` (The Brain):** Implements the **ANEX Protocol** (Absolute Agency, Sensory Depth, Character Consistency) to bypass refusal filters.
  * **`js/ai-service.js` (The Courier):** A dumb pass-through layer.
  * **`js/story-controller.js` (The Manager):** Orchestrates data flow and manages the unified opening generation.

### ImageGlitch

**Purpose:** Text-to-image generation with AI-driven prompt refinement.

**Left Panel File:** `apps/imageglitch/ImageGlitch-left-panel.txt`
**Right Panel Source:** `apps/imageglitch/html/` + `apps/imageglitch/js/` + `apps/imageglitch/scss/`
**Build Output:** `build/output/imageglitch.html`

**Plugins Used:**

  - `ai-text-plugin` → `window.ai` (prompt refinement)
  - `text-to-image-plugin` → `window.image` (image generation—note: named `image` not `textToImage`)
  - `remember-plugin` → `window.r` (persistent storage—shortened name)

**New Architecture (v2.0):**

  * **Split Brain:** "Scribe" (Refinement) vs "Chaos" (Entropy).
  * **Negative Constraint:** Explicitly instructs AI to strip meta-tags from output.

---

## Perchance Plugin Integration

For a complete explanation of the Two-Panel Architecture and plugin exposure pattern, see [Section 7: Plugin Exposure Pattern](./perchance-development-guide.md#plugin-exposure-pattern) in the development guide.

### Plugin Exposure Strategy (Standard Pattern)

**Step 1: Import in Left Panel**

Perchance plugins must be imported in the left-panel:

```perchance
ai = {import:ai-text-plugin}
textToImage = {import:text-to-image-plugin}

// Expose with prefixed names for the right panel
pluginAi = ai
pluginTextToImage = textToImage
```

**Step 2: Expose to Window in Right Panel HTML**

An inline `<script>` (before module script) exposes plugins:

```html
<script>
  if (typeof ai !== 'undefined') window.pluginAi = ai;
  if (typeof textToImage !== 'undefined') window.pluginTextToImage = textToImage;
</script>
<script type="module" src="js/index.js"></script>
```

**Step 3: Copy to Standard Names in JavaScript**

In the right-panel JavaScript (`js/index.js`), call `setupPlugins()`:

```javascript
function setupPlugins() {
  const pluginMap = {
    pluginAi: 'ai',
    pluginTextToImage: 'textToImage',  // ImageGlitch uses 'image' instead
    pluginSuperFetch: 'superFetch',
    pluginRemember: 'rememberPlugin',
    pluginUpload: 'upload'
  };
  for (const [perchanceName, standardName] of Object.entries(pluginMap)) {
    if (window[perchanceName]) {
      window[standardName] = window[perchanceName];
    }
  }
}
```

**Step 4: Wait for Plugins**

Both applications implement `waitForPlugins()` with retry logic and timeout handling. This is called at app initialization (see [Section 7: Plugin Exposure Pattern](./perchance-development-guide.md#plugin-exposure-pattern)).

### Plugin Availability Waiting

Both apps implement `waitForPlugins()` to ensure plugins are loaded before app logic executes:

```javascript
async function waitForPlugins(requiredPlugins, timeout = 10000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const allAvailable = requiredPlugins.every(name => typeof window[name] === 'function');
    if (allAvailable) {
      console.log('[AppName] All plugins loaded:', requiredPlugins);
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  console.warn(`[AppName] Plugin timeout after ${timeout}ms`);
  return false;
}
```

RPGlitch additionally implements **retry logic** with `maxRetries` for robustness, and **security checks** to prevent prototype pollution attacks when accessing plugin paths.

---

## Application-Specific Implementations

### ImageGlitch: Custom Image Generation Pipeline

⚠️ **Important:** ImageGlitch does **NOT** use the Perchance `text-to-image-plugin` directly. Instead:

1.  **Custom AI Refinement Layer** — Prompts go through three AI "Personas" (stored in `remember-plugin`):

      - **AI Scribe Instruction** ("Holistic Prompt Architect") — Refines user prompts intelligently
      - **AI Chaos Instruction** ("Mad Prompt Scientist") — Adds randomness and mutation
      - **AI Transfigure Instruction** ("Prompt Modification Specialist") — Surgically modifies prompts

2.  **Pollinations.ai Backend** — Actual image generation uses:

    ```javascript
    const BASE_IMAGE_URL = "[https://image.pollinations.ai/prompt/](https://image.pollinations.ai/prompt/)";
    ```

    Not the Perchance plugin, but a direct API call to Pollinations.

3.  **Creativity Mapping** — Custom mapping from user "creativity" level (0-10) to Stable Diffusion parameters:

    ```javascript
    const creativityMap = {
      0: { gScale: 1, aiTemp: 1.9 },
      4: { gScale: 7, aiTemp: 1.0 },  // Default
      10: { gScale: 20, aiTemp: 0.1 }
    };
    ```

4.  **Extensive Category Lists** — Refined through `remember-plugin`, used by AI instructions:

      - `artisticStyles`, `composition`, `lighting`, `colorPalettes`
      - `mood`, `technicalDetails`, `additionalElements`
      - `aiCoreQuality`, `aiFlavorEnhancers`

**Implication:** ImageGlitch's image generation is a **multi-stage pipeline**: User Prompt → AI Refine → AI Chaos/Transfigure → Pollinations.ai → Image Output

This is **very different** from a simple "prompt to image" Perchance plugin call. See the [left panel](./apps/imageglitch/ImageGlitch-left-panel.txt) for the full implementation.

### RPGlitch: Standard AI Character Chat Integration

RPGlitch uses a standard pattern for AI generation:

  - Calls `window.ai(instruction, options)` directly with specific prompts (via `ai-service.js`)
  - Uses Dexie.js for chat history and game state persistence
  - Implements event listeners (via the standard Perchance chat API) for message handling
  - Uses `ContextBuilder` to construct dynamic, jailbroken prompts based on world state.

No custom image generation pipeline. Image generation (when used) calls `window.textToImage()` directly via the new `generateImage` helper in `utils.js`.

---

## Perchance Syntax Rules

For complete syntax reference, see [Section 1: The Perchance Engine](./perchance-development-guide.md#section-1-the-perchance-engine).

### Valid List Names

List names in Perchance must follow strict rules:

✅ **Valid:**

  - `animal`, `my_list`, `list123`, `MyList`

❌ **Invalid:**

  - `my-list` (hyphens not allowed)
  - `my list` (spaces not allowed)
  - `123list` (cannot start with number)
  - Reserved keywords: `if`, `for`, `while`, `class`, `function`, `import`, etc.

### Escaping Perchance Syntax

When you need literal `[` or `{` characters in HTML/CSS, escape them with backslash:

```html
<div>Select from [item1|item2]</div>

<div>Select from \[item1|item2\]</div>
```

---

## Deployment Workflow

### Build Phase (Run Locally)

```bash
npm run build:apps       # Build all applications
npm run lint:fix         # Fix linting issues
npm test                 # Run tests
```

**Output:** Creates single HTML files in `build/output/`:

  - `build/output/RPGlitch.html`
  - `build/output/imageglitch.html`

### Deployment Phase (Manual to Perchance.org)

1.  **Copy Left Panel:**

      - Open `apps/rpglitch/RPGlitch-left-panel.txt` (or ImageGlitch equivalent)
      - Copy **entire contents**
      - Paste into Perchance editor's **Left Panel** (Lists section)

2.  **Copy Right Panel:**

      - Open `build/output/RPGlitch.html` (or ImageGlitch equivalent)
      - Copy **entire contents**
      - Paste into Perchance editor's **HTML Panel**

3.  **Save:** Click save in Perchance editor

4.  **Test:**

      - Refresh the page
      - Check browser console (F12) for errors
      - Verify plugin initialization: Look for "All plugins loaded" or "Plugin timeout" messages

---

## Known Issues & Workarounds

### Issue 1: Plugin Timeout

**Symptom:** Console shows `"Plugin timeout after 10000ms"` or plugins not loading

**Root Cause:** Perchance plugins failed to initialize within 10 seconds

**Workaround:**

  - Refresh the page
  - Check internet connection
  - Verify browser console for network errors
  - Verify left-panel has valid `{import:plugin-name}` syntax with **no typos**

**Prevention:**

  - Ensure left-panel is syntactically correct (no invalid list names)
  - Check that left-panel initializes before right-panel JavaScript executes

### Issue 2: Invalid List Name Error

**Symptom:** "There's a problem with the '[app]' generator. You've created a top-level list called '[invalid-name]'"

**Root Cause:** Left-panel contains invalid Perchance list name (spaces, hyphens, dots, special characters)

**Fix:** Review left-panel for invalid names. Valid names only contain letters, numbers, underscores.

**Common Mistakes:**

  - `window.ai = ai` ❌ (contains dot—Perchance parses this as list name "window.ai")
  - `my-list` ❌ (contains hyphen)
  - `123list` ❌ (starts with number)

**Solution:** Use underscore notation: `plugin_ai = ai` or simple assignment: `pluginAi = ai`

### Issue 3: Database Schema Mismatch

**Symptom:** "Failed to execute 'bound' on 'IDBKeyRange': The parameter is not a valid key"

**Cause:** Dexie.js compound index query used invalid data type (e.g., boolean as index key)

**Status:** Fixed in recent commits. Ensure boolean fields are converted to numeric (0/1) when used as keys.

### Issue 4: Chat State Error (RPGlitch)

**Symptom:** "TypeError: p.state.applyPatch is not a function"

**Cause:** Async timing issue when persisting messages to IndexedDB during rapid AI responses

**Status:** Mitigated with error recovery in database initialization. Should be transparent to user.

### Issue 5: Profile Image Input Not Interactable (RPGlitch)

**Symptom:** On profile form pages, the image URL input field cannot be clicked or typed into

**Root Cause:** CSS `pointer-events: none` on parent container cascaded to child elements

**Fix Applied:** JavaScript explicitly enables `pointer-events: auto` on the input field when editing:

```javascript
if (imageInput) {
  imageInput.style.pointerEvents = editing ? 'auto' : 'none';
}
```

**Status:** Fixed

---

## Security Considerations

For comprehensive security guidelines, see [Section 7: Security: The "Zero Trust" Model](https://www.google.com/search?q=./perchance-development-guide.md%23security-the-zero-trust-model).

### Input Validation

  - Validate all plugin responses before processing
  - Type check strings, objects, arrays before use
  - Validate URLs using native `URL` constructor:
    ```javascript
    function isValidUrl(str) {
      try {
        const url = new URL(str);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    }
    ```

### XSS Prevention

  - **`DOMPurify.sanitize()` is MANDATORY** for all dynamic HTML (user input, AI-generated content)
    ```javascript
    element.innerHTML = DOMPurify.sanitize(untrustedContent);
    ```
  - Prefer `textContent` over `innerHTML` when HTML rendering not needed
  - Sanitize all plugin responses before rendering

### Image Handling Security

  - Validate image URLs: protocol, pathname, file extensions
  - **File extension validation:** Only allow safe image formats (jpg, jpeg, png, gif, webp, svg)
      - **SVGs must be sanitized** to prevent XSS
  - Handle data URLs carefully: validate and sanitize appropriately
  - Parse URLs properly to handle query parameters

### Recent Security Improvements

Comprehensive security hardening applied (2025-11-10):

  - Fixed critical XSS vulnerabilities in image handling
  - Implemented native URL constructor-based validation
  - Added comprehensive type checking for plugin responses
  - Defense-in-depth sanitization throughout applications

### Security Checklist

Before deploying to Perchance:

  - [ ] All dynamic HTML is sanitized with `DOMPurify.sanitize()`
  - [ ] All URLs are validated using proper URL parsing
  - [ ] All plugin responses have type checking
  - [ ] Error handling does not leak sensitive information
  - [ ] No secrets or API keys are committed to code
  - [ ] All user inputs are validated and sanitized

---

## Build Configuration & Deployment Details

### Left Panel Configuration

Located in `apps/[app]/[App]-left-panel.txt`

**Lines 1-10:** Plugin imports and metadata
**Lines 11+:** Perchance lists and logic

**Key Constraint:** Left Panel **MUST be stateless**. It handles only:

  - Plugin imports
  - Static data structures (lists, lookup tables)
  - Perchance-specific generation logic

**NOT:**

  - Application state (player inventory, chat history, etc.)
  - Business logic that requires persistence

### Right Panel Configuration

Located in source files compiled into `build/output/[App].html`

**Key Files:**

  - `apps/[app]/html/index.html` — HTML structure
  - `apps/[app]/js/index.js` — Main entry point (ES6 module)
  - `apps/[app]/scss/index.scss` — Styles (compiles to inlined CSS)

**Build Process:**

1.  Compile SCSS → CSS (with Pico.css base + custom SCSS)
2.  Bundle JS modules into a single IIFE (source code uses ES6 modules)
3.  Inline all vendored libraries (Dexie, DOMPurify, etc.)
4.  Inject into HTML template
5.  Output to `build/output/[AppName].html`

### Vendored Libraries

Located in `build/local_libs/`. Inlined into the final HTML:

  - **Pico.css** — UI framework (semantic styling)
  - **Dexie.js** — IndexedDB wrapper (local-first database)
  - **DOMPurify** — XSS sanitization
  - **\_hyperscript** — Declarative UI interactions
  - **Cash** — Lightweight DOM library (RPGlitch only)

---

## Best Practices for Deployment

1.  **Single-Turn Context:** Provide all necessary information to plugins in one call, not over multiple turns
2.  **Test Left Panel Syntax:** Validate Perchance code before deploying by checking for console errors
3.  **Monitor Plugin Loading:** Check "All plugins loaded" logs in console to verify successful initialization
4.  **Graceful Degradation:** Apps should function (at reduced capacity) even if plugins timeout
5.  **Keep Left-Panel Simple:** Complex logic belongs in the right-panel JavaScript, not Perchance syntax

---

## For Deeper Learning

This guide focuses on **deployment and app-specific implementation details**.

For comprehensive understanding of the Perchance platform and architectural patterns, see:

  - **[perchance-development-guide.md](https://www.google.com/search?q=./perchance-development-guide.md)** — Complete reference covering:
      - Procedural generation syntax & lists (Section 1)
      - Web technologies: HTML, CSS, JavaScript (Section 2)
      - Plugin ecosystem (Section 3)
      - LLM theory and prompting best practices (Section 4)
      - AI Character Chat engine architecture (Section 5)
      - oc object programming API (Section 6)
      - Two-Panel Architecture & Architectural Patterns (Section 7)
      - Expert patterns and best practices (Section 8)

---

## Changelog

**4.1.0 (2025-11-20)** — **Complete Restructuring for Deployment Focus**

  - Removed \~50% of duplicated content from perchance-development-guide.md
  - Replaced generic explanations with cross-references to development guide
  - Added detailed "Application-Specific Implementations" section highlighting:
      - ImageGlitch's custom Pollinations.ai pipeline (vs. generic image generation)
      - ImageGlitch's AI Refine/Chaos/Transfigure three-stage approach
      - RPGlitch's standard AI integration pattern
      - Creativity mapping custom implementation
  - Consolidated all app-specific configuration and build details
  - Improved Known Issues & Workarounds with specific fixes and root causes
  - Restructured as focused **Deployment & Troubleshooting Guide**
  - Clarified when to refer to development guide for theory vs. here for practice

**4.0.2 (2025-11-10)** — Comprehensive security hardening

**4.0.0 (2025-11-10)** — Full synchronization with GEMINI.md and project documentation