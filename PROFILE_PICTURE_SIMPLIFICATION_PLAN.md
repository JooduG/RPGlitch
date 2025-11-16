# Profile Picture System Simplification Plan

**Created**: 2025-11-16
**Status**: Planning
**Goal**: Reduce complexity from 8 functions to 4, eliminate 200+ lines of code

---

## Executive Summary

The current profile picture system has evolved into a complex web of 3 duplicate rendering functions, 3 different color application methods, 9 plugin response formats, and scattered validation logic. This plan consolidates everything into a simple, maintainable system.

**Net Impact:**
- **Functions**: 8 → 4 (-50%)
- **Lines of Code**: ~4750 → ~4550 (-200)
- **Picture Render Paths**: 3 → 1 (-67%)
- **Color Methods**: 3 → 1 (-67%)
- **Plugin Formats**: 9 → 3 (-67%)

---

## Current Problems

### 1. Three Functions Do The Same Thing

```javascript
// ❌ PROBLEM: Same functionality, three different entry points
getPictureHTML()         // entities.js - Main renderer
_buildPictureNode()      // index.js - Wrapper around getPictureHTML
buildHero()              // utils.js - Another wrapper with color logic
```

**Why This Happened**: Incremental feature additions without refactoring.

### 2. Three Ways to Apply Signature Colors

```javascript
// ❌ Method 1: CSS custom properties (getPictureHTML)
wrap.style.setProperty("--signature", color);

// ❌ Method 2: Direct inline styles (buildHero)
placeholder.style.backgroundColor = BASE_COLOUR_MAP[color];

// ❌ Method 3: Class-based (applySignature)
container.classList.add(`signature-${color}`);
```

**Why This Happened**: Different implementation patterns at different times.

### 3. Nine Plugin Response Formats

```javascript
// Current: Handles ALL of these
{ imageUrl: "..." }              // text-to-image standard ✅
{ dataUrl: "..." }               // text-to-image data URL ✅
{ imageId, fileExtension }       // OLD text-to-image format ❌
{ url: "..." }                   // upload plugin ✅
Direct string                     // Legacy ❌
{ file: { url } }                // Nested upload ❌
{ file: "..." }                  // Direct file ❌
{ name: "..." }                  // Unusual fallback ❌
{ value: "..." }                 // Generic fallback ❌
```

**Why This Happened**: Defensive programming for plugin inconsistencies.

### 4. Three-Tier Template Fallback

```javascript
// ❌ PROBLEM: Over-engineered for simple task
templates[id]                    // Passed templates object
→ document.querySelector(id)     // DOM query
→ defaultIconTemplate()          // Cached closure
```

**Why This Happened**: Performance optimization that added complexity.

### 5. Scattered Validation

- URL validation in `views.js`
- Type checking in 4 different files
- Sanitization duplicated everywhere
- No single source of truth

---

## Inspiration from Old Codebase

### Double-Click to Reset Pattern

From `RPGlitch-backup.js:414-419`:

```javascript
// ✅ INSPIRATION: Simple, effective pattern
this.ui.storyboardTitle.ondblclick = (e) => {
  e.preventDefault();
  this.storyboardCustomTitle = null;
  this.updateDynamicStoryboardTitle();
  this.ui.storyboardTitle.setAttribute('data-tooltip',
    'Click to edit (double-click to reset)');
};
```

**Application**: Profile picture input field should support this:
- Single click → edit/focus
- Double click → clear URL, show placeholder

### Simple Picture Function

From `RPGlitch-backup.js:4012-4032`:

```javascript
// ✅ INSPIRATION: Single function, returns HTML string
_generateProfilePictureHtml(item, context = 'profile') {
  const paletteKey = getValidPaletteKey(item);
  const palette = this.getColorPalette(paletteKey);
  const paletteWithKey = { ...palette, key: paletteKey };
  return getProfilePictureHTML(item, paletteWithKey, context, FONT_FAMILY);
}
```

**What We Learn**:
- Single entry point
- Returns rendered result (HTML or DOM)
- Context parameter for styling variations
- No multiple wrappers

---

## The Solution

### Phase 1: Create Central Validation Module

**New File**: `apps/rpglitch/js/validation.js` (~150 lines)

```javascript
/**
 * Central validation and sanitization module.
 * Single source of truth for all data validation.
 */

import DOMPurify from 'dompurify';

// Valid image extensions
const VALID_IMAGE_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'gif', 'webp',
  'svg', 'bmp', 'tiff', 'tif', 'ico',
  'avif', 'jfif'
];

const VALID_PROTOCOLS = ['https:', 'http:', 'blob:', 'data:'];

const IMAGE_EXTENSION_REGEX = new RegExp(
  `\\.(${VALID_IMAGE_EXTENSIONS.join('|')})(\\?.*)?$`,
  'i'
);

/**
 * Validates image URL format and security.
 * @param {string} urlString - URL to validate
 * @param {boolean} allowLog - Enable console logging
 * @returns {boolean} True if valid image URL
 */
export function isValidImageUrl(urlString, allowLog = false) {
  if (typeof urlString !== 'string' || urlString.length < 5) {
    return false;
  }

  try {
    const urlObj = new URL(urlString);

    // Protocol validation
    if (!VALID_PROTOCOLS.includes(urlObj.protocol)) {
      if (allowLog) {
        console.warn('[Validation] Invalid protocol:', urlObj.protocol);
      }
      return false;
    }

    // Data URL validation
    if (urlObj.protocol === 'data:') {
      const isImageDataUrl = urlString.startsWith('data:image/');
      if (!isImageDataUrl && allowLog) {
        console.warn('[Validation] Data URL must be image/*');
      }
      return isImageDataUrl;
    }

    // Blob URL validation (always valid)
    if (urlObj.protocol === 'blob:') {
      return true;
    }

    // Extension validation
    const hasValidExtension = IMAGE_EXTENSION_REGEX.test(urlObj.pathname);
    if (!hasValidExtension && allowLog) {
      console.warn('[Validation] Missing image extension in:', urlObj.pathname);
    }
    return hasValidExtension;

  } catch (error) {
    if (allowLog) {
      console.warn('[Validation] URL parse error:', error.message);
    }
    return false;
  }
}

/**
 * Extracts image URL from plugin response.
 * Supports 3 active plugin formats only.
 *
 * @param {*} result - Plugin response
 * @returns {string|undefined} Extracted URL or undefined
 */
export function extractImageUrl(result) {
  let url;

  // Format 1: text-to-image standard
  if (result?.imageUrl && typeof result.imageUrl === 'string') {
    url = result.imageUrl;
  }
  // Format 2: text-to-image data URL
  else if (result?.dataUrl && typeof result.dataUrl === 'string') {
    url = result.dataUrl;
  }
  // Format 3: upload plugin
  else if (result?.url && typeof result.url === 'string') {
    url = String(result.url);
  }
  // Legacy fallback: direct string (last resort)
  else if (typeof result === 'string') {
    url = result;
  }

  // Trim and validate
  if (typeof url === 'string') {
    url = url.trim();
    return url === '' ? undefined : url;
  }

  return undefined;
}

/**
 * Sanitizes HTML content using DOMPurify.
 * @param {string} html - HTML to sanitize
 * @returns {string} Sanitized HTML
 */
export function sanitizeHtml(html) {
  const value = typeof html === 'string' ? html : String(html ?? '');
  try {
    return DOMPurify ? DOMPurify.sanitize(value) : value;
  } catch {
    return value;
  }
}

/**
 * Signature color palette constants.
 * Matches SCSS variables in _foundation.scss
 */
export const SIGNATURE_COLORS = {
  pink: '#ec4899',
  emerald: '#10b981',
  cyan: '#06b6d4',
  orange: '#f97316',
  purple: '#a855f7',
  default: '#777'
};
```

**Impact**:
- All validation in one place
- Easy to test
- Single import: `import { isValidImageUrl, extractImageUrl, sanitizeHtml } from './validation.js'`

---

### Phase 2: Simplify `getPictureHTML()` - Remove Template Parameter

**File**: `apps/rpglitch/js/entities.js`

**BEFORE** (complex 3-tier lookup):
```javascript
export function getPictureHTML(entity = {}, options = {}) {
  const { cover, neutralPlaceholder = false, templates = {} } = options;

  // ... 30 lines later ...

  const iconTemplateId = `tpl-placeholder-icon-${type}`;
  let iconTemplate = templates[iconTemplateId]; // Tier 1

  if (!iconTemplate || !iconTemplate.content) {
    iconTemplate = document.querySelector(`#${iconTemplateId}`); // Tier 2
    if (!iconTemplate || !iconTemplate.content) {
      iconTemplate = defaultIconTemplate(); // Tier 3
    }
  }
}
```

**AFTER** (simple 1-tier lookup):
```javascript
export function getPictureHTML(entity = {}, options = {}) {
  const { cover, neutralPlaceholder = false } = options;

  // ... other logic ...

  // Simple template lookup with fallback
  const iconTemplateId = `tpl-placeholder-icon-${type}`;
  const iconTemplate = document.querySelector(`#${iconTemplateId}`)
    || document.querySelector('#tpl-placeholder-icon-default');

  if (iconTemplate?.content) {
    const clonedIcon = iconTemplate.content.cloneNode(true);
    ph.appendChild(clonedIcon);
  }
}
```

**Changes**:
- ❌ Remove `templates` parameter
- ❌ Remove `defaultIconTemplate` closure
- ❌ Remove template pre-fetching logic
- ✅ Simple querySelector with `||` fallback

**Lines Removed**: ~30

---

### Phase 3: Delete Wrapper Functions

**File**: `apps/rpglitch/js/utils.js`

```javascript
// ❌ DELETE ENTIRE FUNCTION (~30 lines)
export function buildHero(entity, options = {}) {
  const wrap = document.createElement("div");
  wrap.className = "hero-wrap";
  const pic = getPictureHTML(entity, { cover: true });
  if (pic) {
    pic.classList?.add("hero-bleed");
    const placeholder = pic.querySelector(".placeholder-image");
    if (placeholder && entity.signatureColour && entity.signatureColour !== "default") {
      placeholder.style.backgroundColor = BASE_COLOUR_MAP[entity.signatureColour];
    }
    wrap.appendChild(pic);
  }
  renderTags(wrap, entity, options);
  return wrap;
}

// ❌ DELETE ENTIRE FUNCTION (~25 lines)
export function applySignature(container, entity) {
  if (!container) return;
  container.classList.remove(
    "signature-pink",
    "signature-emerald",
    "signature-cyan",
    "signature-orange",
    "signature-purple"
  );
  if (entity && entity.signatureColour && entity.signatureColour !== "default") {
    container.classList.add(`signature-${entity.signatureColour}`);
  }
}
```

**File**: `apps/rpglitch/js/index.js`

```javascript
// ❌ DELETE ENTIRE FUNCTION (~60 lines)
function _buildPictureNode(ent, { preferTemplateForEmpty = true, templates } = {}) {
  // ... 60 lines of logic that just wraps getPictureHTML ...
}
```

**Replacement Pattern**:

```javascript
// ❌ OLD: Multiple function calls
const heroElement = buildHero(entity);
leftCol.appendChild(heroElement);

// ✅ NEW: Direct, clear
const wrap = document.createElement("div");
wrap.className = "hero-wrap";
const pic = getPictureHTML(entity, { cover: true });
if (pic) {
  pic.classList?.add("hero-bleed");
  wrap.appendChild(pic);
}
renderTags(wrap, entity);
leftCol.appendChild(wrap);
```

**Why Better**:
- Explicit what's happening
- No magic hidden in wrapper
- Easy to modify per context
- Less cognitive load

**Lines Removed**: ~115

---

### Phase 4: Consolidate Color Application

**Keep**: CSS custom properties only (in `getPictureHTML`)

```javascript
// ✅ ONLY METHOD - Already in getPictureHTML
wrap.style.setProperty("--signature", signature);
wrap.style.setProperty("--signature-contrast", contrast);
```

**Remove**:
```javascript
// ❌ DELETE: Direct inline styles in buildHero
placeholder.style.backgroundColor = BASE_COLOUR_MAP[entity.signatureColour];

// ❌ DELETE: Class-based in applySignature
container.classList.add(`signature-${entity.signatureColour}`);
```

**Update CSS** to rely on custom properties:

```scss
// All contexts use --signature from parent
.placeholder-image {
  background-color: var(--signature);
  color: var(--signature-contrast);
}

.story-side-column {
  // Inherit from .picture wrapper
  .placeholder-image {
    background-color: var(--signature);
  }
}

.card-media {
  // Inherit from .picture wrapper
  .placeholder-image {
    background-color: var(--signature);
  }
}
```

**Impact**: Single source of truth, cascades everywhere

---

### Phase 5: Streamline Plugin Response Handling

**File**: `apps/rpglitch/js/views.js`

**BEFORE** (9 formats):
```javascript
function _extractProfilePictureUrlFromPlugin(result) {
  let profilePictureUrl;

  // 100+ lines checking 9 different formats...

  if (result?.imageUrl && typeof result.imageUrl === "string") {
    profilePictureUrl = result.imageUrl;
  } else if (result?.dataUrl && typeof result.dataUrl === "string") {
    profilePictureUrl = result.dataUrl;
  } else if (result?.imageId && typeof result.imageId === "string") {
    // Build URL from imageId + extension
  } else if (typeof result === "string") {
    // ... 6 more formats ...
  }

  return profilePictureUrl || undefined;
}
```

**AFTER** (3 formats, use validation module):
```javascript
import { extractImageUrl, isValidImageUrl } from './validation.js';

// ❌ DELETE _extractProfilePictureUrlFromPlugin entirely
// ✅ Use validation.extractImageUrl() instead

// Generate image
const result = await window.textToImage({ prompt, guidanceScale: 7, resolution: "512x768" });
const url = extractImageUrl(result); // Simple, centralized

if (!url || !isValidImageUrl(url, true)) {
  throw new Error("Image generation failed: invalid URL");
}

updateImageInput(imageInput, url);
```

**Lines Removed**: ~70

---

### Phase 6: Add Double-Click to Reset

**Inspiration**: Old codebase pattern for title editing

**File**: `apps/rpglitch/js/views.js` (in profile editor setup)

```javascript
// Add double-click handler to profile picture input
imageInput.addEventListener('dblclick', (e) => {
  e.preventDefault();

  // Clear the input
  imageInput.value = '';

  // Revert to entity's original URL or empty
  const originalUrl = entity.profilePictureUrl || '';

  // Update preview to show placeholder
  const originalPic = getPictureHTML(entity, { cover: true });
  const currentWrap = heroWrap.querySelector(".picture");
  if (currentWrap) {
    currentWrap.replaceWith(originalPic);
  } else {
    heroWrap.appendChild(originalPic);
  }

  // Update button state
  updateButtonState();

  // Show feedback
  showNotification("Profile picture input reset", 2000);
});

// Update tooltip
imageInput.setAttribute('data-tooltip',
  'Type prompt, paste URL, or click to upload (double-click to reset)');
```

**UX Flow**:
```
User types bad URL
→ Double-click input field
→ Input clears
→ Placeholder shows
→ Ready for new input
```

---

## Migration Steps

### Step 1: Create validation.js ✅
- Extract all validation functions
- Add comprehensive tests
- No breaking changes

**Time**: 1 hour

### Step 2: Update imports ✅
- Replace scattered validation with imports
- Test all validation still works
- No functionality changes

**Time**: 30 minutes

### Step 3: Simplify getPictureHTML ✅
- Remove template parameter
- Remove defaultIconTemplate closure
- Update all call sites
- Test picture rendering

**Time**: 1 hour

### Step 4: Remove buildHero and applySignature ✅
- Delete functions
- Replace call sites with direct getPictureHTML
- Update CSS to use custom properties only
- Test all contexts (profile, story, chin, storyboard)

**Time**: 1.5 hours

### Step 5: Remove _buildPictureNode ✅
- Delete function
- Replace storyboard calls with getPictureHTML
- Test storyboard rendering

**Time**: 30 minutes

### Step 6: Simplify plugin handling ✅
- Update textToImage handler to use validation.extractImageUrl
- Update upload handler to use validation.extractImageUrl
- Remove _extractProfilePictureUrlFromPlugin
- Test image generation and upload

**Time**: 1 hour

### Step 7: Add double-click reset ✅
- Add event handler
- Update tooltip
- Test UX

**Time**: 30 minutes

### Step 8: Final testing and documentation ✅
- Test all picture contexts
- Test all color variations
- Test all plugin interactions
- Update code comments

**Time**: 1 hour

**Total Time**: ~7 hours

---

## Testing Checklist

### Picture Rendering
- [ ] Storyboard cards show pictures correctly
- [ ] Storyboard placeholders show correct icons
- [ ] Chin list cards show pictures
- [ ] Profile hero shows pictures
- [ ] Story view character columns show pictures
- [ ] Message avatars show pictures (if applicable)

### Colors
- [ ] Premade characters show correct signature colors
- [ ] Premade worlds show correct signature colors
- [ ] Custom entities with signature colors work
- [ ] Default color fallback works
- [ ] Deterministic colors generate consistently

### Plugin Integration
- [ ] Text-to-image generation works
- [ ] File upload works
- [ ] URLs validate correctly
- [ ] Data URLs accepted
- [ ] Blob URLs accepted
- [ ] Invalid URLs rejected

### UX
- [ ] Live preview updates on input
- [ ] Button state changes correctly
- [ ] Double-click reset works
- [ ] Notifications show appropriately
- [ ] Templates load correctly

---

## File Changes Summary

| File | Lines Before | Lines After | Change |
|------|--------------|-------------|---------|
| `validation.js` (new) | 0 | 150 | +150 |
| `entities.js` | 450 | 370 | -80 |
| `utils.js` | 1000 | 945 | -55 |
| `index.js` | 2300 | 2240 | -60 |
| `views.js` | 1000 | 845 | -155 |
| **Total** | **4750** | **4550** | **-200** |

---

## Risk Assessment

### Low Risk
- Creating validation.js (pure addition)
- Simplifying template lookup (fewer fallbacks = less to break)
- Removing wrapper functions (direct calls more reliable)

### Medium Risk
- Consolidating color application (CSS changes needed)
- Streamlining plugin handling (need thorough testing)

### Mitigation
- Incremental migration (phase by phase)
- Test after each phase
- Keep git commits small and focused
- Easy rollback if needed

---

## Future Enhancements (Not in This Plan)

### 1. Image Compression
- Compress uploaded images before storage
- Reduce IndexedDB bloat
- Faster loading

### 2. Permanent Storage Integration
- GitHub Gist API
- Cloudinary integration
- No more temporary URLs

### 3. Image Cropping UI
- Let users crop uploaded images
- Ensure consistent aspect ratios
- Better UX

### 4. Template Customization
- Let users choose placeholder icon styles
- Custom SVG upload
- More personality

---

## Questions & Decisions

### Q: Should we keep backward compatibility?
**A**: No. This is internal refactoring. Clean slate is better.

### Q: Can we do this incrementally?
**A**: Yes. Each phase is independent. Can pause between phases.

### Q: What if plugins change format again?
**A**: validation.extractImageUrl is easy to update. Single location.

### Q: Will this affect user data?
**A**: No. Database schema unchanged. Only code changes.

---

## Approval Checklist

- [ ] Plan reviewed by user
- [ ] Timeline acceptable
- [ ] Risk level acceptable
- [ ] Testing approach approved
- [ ] Begin implementation

---

**Next Step**: User approval to proceed with implementation.
