# Perchance Integration Guide

This document describes how RPGlitch and ImageGlitch integrate with the **Perchance Platform** and best practices for development and deployment.

## Overview

Our applications use the **Perchance Two-Panel Architecture**:
- **Left Panel** (`*-left-panel.txt`): Perchance engine declarations (plugin imports, lists, logic)
- **Right Panel** (built from `apps/*/html/`): Standard HTML/CSS/JavaScript UI compiled into a single HTML file

The build system only processes the right-panel. The left-panel is manually copied/pasted during deployment.

## Perchance Two-Panel Architecture

### Left Panel Structure

The left panel defines:
1. **Plugin Imports** - Perchance plugins used by the app
2. **Perchance Lists** - Declarative data structures
3. **Perchance Variables** - Stored values and references

**File Locations:**
- `apps/rpglitch/RPGlitch-left-panel.txt`
- `apps/imageglitch/ImageGlitch-left-panel.txt`

### Right Panel Structure

The right panel is a standard web application (HTML/CSS/JavaScript) that:
1. Accesses Perchance plugin globals (e.g., `ai()`, `image()`)
2. Uses IndexedDB (Dexie) for state persistence
3. Renders UI using Pico.css

**Source Locations:**
- `apps/rpglitch/html/index.html` -> compiled to `build/output/RPGlitch.html`
- `apps/imageglitch/html/index.html` -> compiled to `build/output/imageglitch.html`

## Perchance Plugin Integration

### Available Plugins

**RPGlitch:**
- `ai` = {import:ai-text-plugin} - LLM text generation
- `textToImage` = {import:text-to-image-plugin} - Image generation
- `superFetch` = {import:super-fetch-plugin} - CORS bypass for external APIs
- `rememberPlugin` = {import:remember-plugin} - Persistent storage
- `upload` = {import:upload-plugin} - File uploads for profile pictures

**ImageGlitch:**
- `image` = {import:text-to-image-plugin} - Image generation
- `ai` = {import:ai-text-plugin} - LLM text generation
- `r` = {import:remember-plugin} - Persistent storage

### Plugin Loading Lifecycle

Perchance plugins load **asynchronously** after the left-panel is parsed:

1. **Page Load** (0ms)
2. **Left Panel Parse** (immediate)
3. **Plugin Imports Declared** (immediate) - `{import:plugin-name}` creates variable declarations
4. **Plugins Fetch & Initialize** (50-500ms) - Asynchronous network requests
5. **Plugin Globals Available** (100-500ms) - Variables become accessible to JavaScript
6. **Right Panel JavaScript Executes** (50-200ms after plugins available)

**Critical Issue:** Our right-panel JavaScript used to check for plugins synchronously on `DOMContentLoaded`, before they had time to load. This was the root cause of "image function available: false" errors.

**Solution:** Added `waitForPlugins()` function that polls for plugin globals with timeout and retries. See **Plugin Availability Waiting** below.

### Plugin Availability Waiting

Both apps now implement `waitForPlugins()` at initialization:

```javascript
async function waitForPlugins(requiredPlugins, timeout = 10000, retryCount = 0, maxRetries = 3) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const allAvailable = requiredPlugins.every(name => typeof window[name] !== 'undefined');
    if (allAvailable) {
      console.log('[AppName] All plugins loaded:', requiredPlugins);
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (retryCount < maxRetries) {
    console.warn(`[AppName] Plugins not available, retrying (${retryCount + 1}/${maxRetries})...`);
    return waitForPlugins(requiredPlugins, timeout, retryCount + 1, maxRetries);
  }

  console.warn(`[AppName] Plugin timeout. Available: ${available.join(', ')} | Missing: ${missing.join(', ')}`);
  return false;
}
```

**Called from:**
- ImageGlitch: Start of `main()` function (line 496)
- RPGlitch: Start of `initializeWhenReady()` function

## Perchance Syntax Rules

### Valid List Names

List names in Perchance must follow strict rules:

✅ **Valid:**
- `animal`
- `my_list`
- `list123`
- `MyList`

❌ **Invalid:**
- `my-list` (hyphens not allowed)
- `my list` (spaces not allowed)
- `123list` (cannot start with number)
- `nomic-ai/nomic-embed-text-v1.5-GGUF` (special characters not allowed)
- Reserved keywords: `if`, `for`, `while`, `class`, `function`, `import`, etc.

### Escaping Perchance Syntax

When you need literal `[` or `{` characters in HTML/CSS, escape them with backslash:

```html
<!-- BAD: This will be interpreted as Perchance code -->
<div>Select from [item1|item2]</div>

<!-- GOOD: Escaped for literal display -->
<div>Select from \[item1|item2\]</div>
```

## Deployment Workflow

### Build Phase (Run Locally)

```bash
npm run build:apps
npm test
npm run lint:fix
```

**Output:** Creates single HTML files in `build/output/`:
- `build/output/RPGlitch.html`
- `build/output/imageglitch.html`

### Deployment Phase (Manual to Perchance)

1. **Copy Left Panel:**
   - Open `apps/rpglitch/RPGlitch-left-panel.txt`
   - Copy entire contents
   - Paste into Perchance editor **Left Panel** (Lists section)

2. **Copy Right Panel:**
   - Open `build/output/RPGlitch.html`
   - Copy entire contents
   - Paste into Perchance editor **HTML Panel**

3. **Save:** Click save in Perchance editor

4. **Test:** Refresh page, check console for errors

## Known Issues & Workarounds

### Issue 1: Plugin Timeout

**Symptom:** Console shows `"image function available: false"` or `"Plugin timeout after 10000ms"`

**Cause:** Perchance plugins failed to load within 10 seconds

**Workaround:**
- Refresh the page
- Check internet connection
- Check browser console for network errors
- Verify left-panel has valid `{import:plugin-name}` syntax

### Issue 2: Invalid List Name Error

**Symptom:** "There's a problem with the '[name]' generator. You've created a top-level list called '[invalid-name]'"

**Cause:** Left-panel contains invalid Perchance list name (spaces, hyphens, special chars)

**Fix:** Remove or rename the invalid list. Valid names only contain letters, numbers, underscores.

### Issue 3: Database Schema Mismatch

**Symptom:** "Failed to execute 'bound' on 'IDBKeyRange': The parameter is not a valid key"

**Cause:** Dexie.js compound index query used invalid data type (booleans not allowed as keys)

**Status:** FIXED in commit `6f58204b` - Converted `isCustom` from boolean to numeric (0/1)

### Issue 4: Chat State Error

**Symptom:** "TypeError: p.state.applyPatch is not a function"

**Cause:** Async timing issue when saving messages to database

**Status:** Mitigated with error recovery in database init() function

## Documentation References

- [Perchance Official Tutorial](https://perchance.org/tutorial)
- [Perchance Advanced Tutorial](https://perchance.org/advanced-tutorial)
- [Perchance Plugin List](https://perchance.org/plugins)
- [AI Text Plugin](https://perchance.org/ai-text-plugin)
- [Text to Image Plugin](https://perchance.org/text-to-image-plugin)

## Best Practices

1. **Single-Turn Context:** Provide all necessary information to plugins in one call, not over multiple turns
2. **Test Left Panel Syntax:** Validate Perchance code before deploying by checking for console errors
3. **Monitor Plugin Loading:** Check "Waiting for plugins" logs in console to verify successful load
4. **Use Graceful Degradation:** Apps should function (at reduced capacity) even if plugins timeout
5. **Keep Left-Panel Simple:** Complex logic belongs in the right-panel JavaScript, not Perchance syntax

## Configuration

### Left Panel Configuration

Located in `apps/[app]/[App]-left-panel.txt`

**Lines 1-10:** Plugin imports and initial setup
**Lines 11+:** Perchance lists and logic (if any)

### Right Panel Configuration

Located in `apps/[app]/html/index.html` and compiled JavaScript/SCSS

**Key Variables:**
- ImageGlitch: `image()` function, `ai()` function
- RPGlitch: `ai()`, `textToImage()`, `superFetch()`, `rememberPlugin()`, `upload()`

---

## For Deeper Learning

This guide focuses on **deploying and troubleshooting our apps**. For a comprehensive understanding of the Perchance platform itself, see:

- **[perchance-development-guide.md](./perchance-development-guide.md)** - Complete reference covering:
  - Procedural generation syntax & lists
  - LLM theory and prompting best practices
  - AI Character Chat engine architecture
  - oc object programming API
  - Advanced patterns and plugins

---

**See Also:** [README.md](./README.md) for the complete documentation index and architecture overview.
