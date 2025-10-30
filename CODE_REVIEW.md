# Code Review: RPGlitch & ImageGlitch

**Date:** 2025-10-30
**Reviewer:** Claude Code
**Status:** Documented for staged implementation

---

## Overview

Comprehensive code review of both Perchance applications identifying issues, optimizations, and refactoring opportunities organized by severity and implementation options.

### Application Scores

| App | Current Score | Target Score | Lines of Code |
|-----|---------------|--------------|---------------|
| RPGlitch | 7.5/10 | 8.5/10+ | ~3,700 JS |
| ImageGlitch | 6.5/10 | 8.0/10+ | ~500 JS |

---

## Implementation Plan

### ✅ Stage 0: Documentation (COMPLETE)
This document serves as the reference for all improvements.

### 🎯 Stage 1: Option A - Quick Wins (~30 min)
- Remove unused variables
- Fix HTML issues
- Add DOMPurify to innerHTML
- Add input validation

### 🎯 Stage 2: Option B - Critical Fixes (~1-2 hours)
**Decision Point:** Continue after Stage 1?
- Migrate localStorage → IndexedDB
- Comprehensive error handling
- Full DOMPurify compliance

### 🎯 Stage 3: Option C - Full Refactor (~4-6 hours)
**Decision Point:** Continue after Stage 2?
- Split god functions
- Remove console statements
- Extract duplicate code
- Simplify complex logic

---

## 🔴 CRITICAL Issues (Non-Negotiable)

### C1. innerHTML Without DOMPurify Sanitization

**File:** `apps/rpglitch/js/index.js`
**Lines:** 156, 489
**Severity:** CRITICAL - XSS vulnerability risk
**AGENTS.md Rule:** All innerHTML must use DOMPurify.sanitize()

```javascript
// Line 156 - Clearing chat feed
chatFeed.innerHTML = ""; // ❌ Direct assignment

// Line 489 - Card rendering
card.innerHTML = `<div class="media"></div>...`; // ❌ Template string
```

**Fix (Option A):**
```javascript
// Line 156
while (chatFeed.firstChild) {
  chatFeed.removeChild(chatFeed.firstChild);
}

// Line 489
const sanitized = DOMPurify.sanitize(`<div class="media"></div>...`);
card.innerHTML = sanitized;
```

**Impact:** Eliminates XSS risk
**Risk:** Very low
**Test:** Verify chat feed clearing and card rendering work

---

### C2. localStorage Usage (Both Apps)

**Severity:** CRITICAL - Violates AGENTS.md non-negotiable
**AGENTS.md Rule:** All storage must use IndexedDB via Dexie

#### RPGlitch
**File:** `apps/rpglitch/js/index.js`
**Lines:** 372-380, 391-405, 441

```javascript
// Line 372-380 - Storage reference
const storage = window.localStorage;

// Line 391 - Save storyboard selection
localStorage.setItem(STORYBOARD_SELECTION_KEY, JSON.stringify(selects));

// Line 405 - Load storyboard selection
const stored = localStorage.getItem(STORYBOARD_SELECTION_KEY);
```

**Also:** `apps/rpglitch/js/entities.js:441` - Stories fallback to localStorage

#### ImageGlitch
**File:** `apps/imageglitch/js/index.js`
**Lines:** 96-141

```javascript
// Lines 96-141 - Extensive localStorage for settings
localStorage.setItem('ai-imageglitch-seed', seed);
localStorage.setItem('ai-imageglitch-cfg', cfg);
// ... many more
```

**Fix (Option B):**
- Create Dexie schema for settings/selections
- Migrate all localStorage.getItem/setItem to db operations
- Add migration for existing localStorage data

**Impact:** Full AGENTS.md compliance, better data management
**Risk:** Medium - requires thorough testing
**Test:** Verify all settings persist across reload

---

## 🟠 HIGH Priority Issues

### H1. Unused Variables (Linter Warnings)

**Files & Lines:**
- `apps/rpglitch/js/index.js:1197-1199` (3 variables)
- `apps/rpglitch/js/utils.js:977` (1 variable)

```javascript
// index.js:1197-1199 - REMOVE THESE
const aiSelect = document.querySelector("#storyboard-ai-select");
const userSelect = document.querySelector("#storyboard-user-select");
const worldSelect = document.querySelector("#storyboard-world-select");

// utils.js:977 - REMOVE THIS
const chinContainer = doc.querySelector("#chin-container");
```

**Fix (Option A):** Simply delete these 4 lines
**Impact:** Cleans up linter warnings
**Risk:** Zero (verified unused)
**Test:** Run `npm run lint` - should show 0 warnings

---

### H2. Random Test Text in HTML

**File:** `apps/rpglitch/js/html/index.html:390`
**Line:** 390

```html
<footer>Bajskorv</footer> <!-- ❌ Remove this -->
```

**Fix (Option A):** Delete this line or replace with proper footer
**Impact:** Removes unprofessional test text
**Risk:** Zero
**Test:** Visual inspection of built HTML

---

### H3. No Input Validation (ImageGlitch)

**File:** `apps/imageglitch/js/index.js`
**Issue:** User inputs not validated before use

**Missing Validations:**
- Empty prompt check
- Prompt length limits
- Seed value validation (should be number)
- Instruction string validation

**Fix (Option A):**
```javascript
// Add validation functions
function validatePrompt(prompt) {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Prompt cannot be empty');
  }
  if (prompt.length > 1000) { // reasonable limit
    throw new Error('Prompt too long (max 1000 characters)');
  }
  return prompt.trim();
}

function validateSeed(seed) {
  const parsed = parseInt(seed, 10);
  if (isNaN(parsed) || parsed < 0) {
    return Math.floor(Math.random() * 1000000); // default random
  }
  return parsed;
}

// Use before API calls
try {
  const validPrompt = validatePrompt(promptInput.value);
  const validSeed = validateSeed(seedInput.value);
  // ... proceed with generation
} catch (error) {
  alert(error.message);
  return;
}
```

**Impact:** Prevents invalid API calls, better UX
**Risk:** Low
**Test:** Try empty prompt, very long prompt, invalid seed

---

### H4. God Function - initializeWhenReady()

**File:** `apps/rpglitch/js/index.js:1427-1564`
**Lines:** 138 lines
**Cyclomatic Complexity:** Very High

**Responsibilities:**
1. Database initialization
2. State listeners setup
3. Settings initialization
4. UI component setup
5. Watchdog initialization
6. Retry logic with backoff

**Fix (Option C):**
Split into focused functions:
```javascript
async function initializeDatabase() { /* ... */ }
function setupStateListeners() { /* ... */ }
async function initializeSettings() { /* ... */ }
function setupUIComponents() { /* ... */ }
function startUIMonitoring() { /* ... */ }

async function initializeWhenReady() {
  try {
    await initializeDatabase();
    setupStateListeners();
    await initializeSettings();
    setupUIComponents();
    startUIMonitoring();
  } catch (error) {
    // centralized error handling
  }
}
```

**Impact:** Improved maintainability, testability
**Risk:** Medium - requires careful refactoring
**Test:** Full regression suite

---

### H5. Excessive Console Logging

**Statistics:** 41 console.log/warn/error statements
**Files:** Throughout utils.js, index.js, entities.js

**Examples:**
```javascript
// index.js:109
console.warn("No active thread found, created a dummy one.");

// index.js:138
console.log("Calling Perchance AI Text plugin with payload:", payload);

// index.js:1467
console.log('[RPGlitch] initializeWhenReady start'...);
```

**Fix (Option C):**
- Use existing `log()` utility (utils.js:81-83) which respects debug flag
- Remove production console statements
- Keep only critical error logging

**Impact:** Cleaner console, better debugging control
**Risk:** Low
**Test:** Verify debug mode works, production is clean

---

### H6. Missing Database Error Handling

**Files:** Multiple async functions
**Issue:** Database operations lack error handling

**Examples:**
```javascript
// index.js:417-448 - getAllItems()
async getAllItems(type) {
  // No try-catch - could throw uncaught promise rejection
  const items = await entities.list(type);
  return items;
}

// index.js:114-128 - createFromSelection()
async createFromSelection({ storyId, characterId, worldId }) {
  // No error handling for db.threads.add()
  const threadId = await App.db.threads.add({...});
}
```

**Fix (Option B):**
```javascript
async getAllItems(type) {
  try {
    const items = await entities.list(type);
    return items;
  } catch (error) {
    console.error(`Failed to load ${type}:`, error);
    // Show user-friendly message
    alert(`Could not load ${type} data. Please refresh and try again.`);
    return [];
  }
}
```

**Impact:** Graceful degradation, better UX
**Risk:** Low
**Test:** Simulate DB errors (corrupt IndexedDB)

---

## 🟡 MEDIUM Priority Issues

### M1. Magic Numbers

**Locations:**
```javascript
// index.js:277-278
MAX_INIT_RETRIES = 40;        // Why 40?
INIT_BACKOFF_MS = 250;        // Why 250ms?

// index.js:88
historyLength * 2             // Why multiply by 2?

// utils.js:543
setInterval(tick, 500)        // Why 500ms?

// utils.js:494
elapsed > 1500                // Why 1500ms threshold?
```

**Fix (Option C):**
```javascript
// Extract with explanatory comments
const MAX_INIT_RETRIES = 40;        // 10 seconds at 250ms intervals
const INIT_RETRY_INTERVAL_MS = 250; // Quarter second between attempts
const WATCHDOG_INTERVAL_MS = 500;   // Check UI every half second
const UI_BLOCK_THRESHOLD_MS = 1500; // Consider blocked after 1.5s
```

**Impact:** Self-documenting code
**Risk:** Zero
**Test:** None needed

---

### M2. Duplicate Code - Card Navigation

**Files:** `apps/rpglitch/js/index.js`
**Lines:** 563-575 (chin cards), 806-822 (storyboard cards)

**Issue:** Nearly identical click and keydown handlers

**Fix (Option C):**
```javascript
function attachCardNavigationHandlers(card, type, id) {
  card.addEventListener("click", () => {
    window.location.hash = `#${type}/${id}`;
  });

  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      window.location.hash = `#${type}/${id}`;
    }
  });
}

// Usage:
attachCardNavigationHandlers(card, type, id);
```

**Impact:** DRY principle, easier maintenance
**Risk:** Low
**Test:** Verify both click and keyboard navigation work

---

### M3. Empty Catch Blocks

**File:** `apps/rpglitch/js/utils.js`
**Count:** 50+ instances
**Pattern:** `catch { void 0; }` or `catch { /* noop */ }`

**Examples:**
```javascript
// utils.js:528, 551, 584, 605, 631, etc.
try {
  dialog.close();
} catch { void 0; }
```

**Fix (Option C):**
```javascript
try {
  dialog.close();
} catch (e) {
  log('Failed to close dialog:', e); // At minimum log to debug
}
```

**Impact:** Easier debugging
**Risk:** Very low
**Test:** Enable debug mode and verify logging

---

### M4. Long Functions (>100 lines)

**Locations:**
- `updateStoryboardCard()` (index.js:841-1001) - 161 lines
- `renderList()` (index.js:450-580) - 131 lines
- `_attachStoryboardListeners()` (index.js:1164-1243) - 80 lines

**Fix (Option C):**
Break into smaller, focused functions with clear responsibilities

**Impact:** Better testability, readability
**Risk:** Medium
**Test:** Full regression suite

---

### M5. Mixed Responsibility in main() (ImageGlitch)

**File:** `apps/imageglitch/js/index.js:407-466`
**Issue:** Single function handles init, events, settings

**Fix (Option C):**
```javascript
function initializeApp() {
  // Setup initial state
}

function bindEventListeners() {
  // All event handlers
}

function loadUserSettings() {
  // Load from storage
}

function main() {
  initializeApp();
  bindEventListeners();
  loadUserSettings();
}
```

**Impact:** Clearer structure
**Risk:** Low
**Test:** Verify app initializes correctly

---

## ⚪ LOW Priority Issues

### L1. Inconsistent Naming
- `_allItemsCache` vs `allItemsCache` (underscore inconsistency)
- `byId` vs `allIds` naming patterns

### L2. Large File Sizes
- index.js: 1,691 lines
- utils.js: 1,052 lines
- Consider splitting into smaller modules

### L3. Limited Test Coverage
- No unit tests for entities.js CRUD
- Integration tests exist but limited

### L4. Accessibility Improvements
- Missing ARIA labels on some elements
- No keyboard navigation docs

### L5. No JSDoc Comments
- Only 1 JSDoc found in entire codebase
- Complex functions lack documentation

---

## Best Practices Compliance

### AGENTS.md Non-Negotiable Rules:

| Rule | RPGlitch | ImageGlitch | Action |
|------|----------|-------------|--------|
| No `var` keyword | ✅ Pass | ✅ Pass | None |
| No innerHTML without DOMPurify | ❌ **FAIL** | ✅ Pass | **Option A** |
| No localStorage (use IndexedDB) | ❌ **FAIL** | ❌ **FAIL** | **Option B** |
| Vanilla DOM APIs (no jQuery) | ✅ Pass | ✅ Pass | None |

---

## Implementation Checklist

### Option A: Quick Wins (~30 min)

- [ ] Remove unused variables (4 lines)
  - [ ] index.js:1197-1199
  - [ ] utils.js:977
- [ ] Remove "Bajskorv" text (1 line)
  - [ ] html/index.html:390
- [ ] Add DOMPurify to innerHTML (2 locations)
  - [ ] index.js:156
  - [ ] index.js:489
- [ ] Add input validation (ImageGlitch)
  - [ ] Create validatePrompt()
  - [ ] Create validateSeed()
  - [ ] Use before API calls
- [ ] Test: Run `npm test`, `npm run lint`, build both apps

**Expected Outcome:**
- 0 linter warnings
- No XSS vulnerabilities
- Better input validation
- Score: RPGlitch 7.8/10, ImageGlitch 7.0/10

---

### Option B: Critical Fixes (~1-2 hours)

**Prerequisite:** Option A complete

- [ ] Migrate localStorage to IndexedDB (RPGlitch)
  - [ ] Add settings table to Dexie schema
  - [ ] Create migration function
  - [ ] Replace all localStorage.getItem/setItem
  - [ ] Add data migration for existing users
- [ ] Migrate localStorage to IndexedDB (ImageGlitch)
  - [ ] Create Dexie schema
  - [ ] Replace all localStorage calls
  - [ ] Test settings persistence
- [ ] Add comprehensive error handling
  - [ ] Database operations
  - [ ] API calls
  - [ ] User-facing error messages
- [ ] Test: Full regression suite, manual testing

**Expected Outcome:**
- Full AGENTS.md compliance
- Production-ready error handling
- Score: RPGlitch 8.2/10, ImageGlitch 7.8/10

---

### Option C: Full Refactor (~4-6 hours)

**Prerequisite:** Option B complete

- [ ] Split god functions
  - [ ] initializeWhenReady() → 5 functions
  - [ ] updateStoryboardCard() → 3-4 functions
  - [ ] renderList() → 2-3 functions
- [ ] Remove console statements
  - [ ] Replace with debug utility
  - [ ] Keep only critical errors
- [ ] Extract duplicate code
  - [ ] Card navigation helpers
  - [ ] Button state management (ImageGlitch)
- [ ] Simplify complex logic
  - [ ] Reduce nesting
  - [ ] Extract named functions
  - [ ] Add comments
- [ ] Replace empty catch blocks
- [ ] Extract magic numbers
- [ ] Test: Comprehensive regression, code review

**Expected Outcome:**
- Maintainable, clean codebase
- Easy to extend
- Score: RPGlitch 8.5+/10, ImageGlitch 8.2+/10

---

## Testing Strategy

### After Option A:
```bash
npm run lint          # Should show 0 warnings
npm test              # All tests pass
npm run build:apps    # Both apps build
# Manual: Test chat clearing, card rendering, image generation with validation
```

### After Option B:
```bash
npm test              # All tests pass
# Manual: Test all settings persist across reload
# Manual: Trigger errors, verify graceful handling
# Manual: Test with clean IndexedDB (new user)
# Manual: Test migration from localStorage
```

### After Option C:
```bash
npm test              # All tests pass
npm run lint          # Clean
# Full manual regression test suite
# Code review of refactored functions
# Performance testing (ensure no regressions)
```

---

## Notes

- All code locations verified as of 2025-10-30
- Severity ratings based on AGENTS.md rules + security best practices
- Time estimates are conservative (includes testing)
- Each option builds on the previous one
- Decision points allow for staged delivery

---

## Related Documentation

- [AGENTS.md](./AGENTS.md) - Coding rules and protocols
- [design-system.md](./design-system.md) - UI/UX guidelines
- [build/README.md](./build/README.md) - Build system docs
