# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **Perchance-focused monorepo** for developing web applications that run on the Perchance.org platform. The repository contains two main applications:
- **RPGlitch**: An AI-powered RPG character/story/world management system with interactive chat
- **ImageGlitch**: A text-to-image generation application

The codebase follows a strict **Two-Panel Architecture** where each app has:
- **Left Panel** (`*-left-panel.txt`): Perchance engine logic with plugin imports (manually deployed)
- **Right Panel** (source in `apps/*/html/`): UI application compiled into single inlined HTML file (auto-built)

## Build & Development Commands

### Essential Commands
```bash
# Initial setup - run this first
npm ci && npm run sync

# Build all applications
npm run build:apps

# Build individual apps
npm run build:rpglitch
npm run build:imageglitch

# Full deployment pipeline (sync → lint fix → build → test)
npm run deploy

# Run tests
npm test

# Linting
npm run lint          # Check all (JS, CSS, HTML, Markdown)
npm run lint:fix      # Auto-fix JS and CSS issues

# Sync configurations
npm run sync          # Sync all configs
npm run sync:mcp      # Sync MCP server configs only
```

### Development Workflow
```bash
# Watch mode for auto-rebuild on changes
node build/scripts/watch.js

# Validate build outputs exist
npm run validate
```

## Proactive MCP Usage (Critical)

**IMPORTANT: Use MCPs automatically without waiting for explicit user requests.**

You have access to multiple Model Context Protocol (MCP) servers that extend your capabilities. **You should use these tools proactively** when they would be helpful, not only when explicitly asked. Think of MCPs as part of your core toolkit.

### When to Use MCPs Automatically

**Always use proactively:**

1. **npm-sentinel** - Check package info when:
   - User mentions an NPM package name
   - Discussing dependencies or package versions
   - User asks "is X up to date?" or similar
   - Comparing package alternatives
   - **Example:** User says "I'm using React 17" → Automatically check latest version and mention if update available

2. **ide/getDiagnostics** - Check for issues when:
   - About to start coding work
   - User mentions errors or warnings
   - After making significant code changes
   - Beginning any debugging session
   - **Example:** User says "let's fix the bugs" → Automatically run getDiagnostics first

3. **deepwiki** - Look up documentation when:
   - User asks about an open-source library's internals
   - Need to understand how a framework works
   - Discussing best practices for a specific library
   - **Example:** User asks "how does Dexie handle indexes?" → Automatically query deepwiki for dexie docs

4. **time** - Convert times when:
   - User mentions a time with timezone
   - Scheduling or discussing meetings across timezones
   - **Example:** User says "the meeting is at 3pm EST" → Automatically convert to their timezone (Europe/Stockholm)

**Use when clearly relevant:**

5. **waldzell-clear-thought** - Apply mental models when:
   - User presents a complex problem to solve
   - Debugging challenging issues
   - Making architectural decisions
   - User asks "how should I approach this?"
   - **Example:** User says "I need to optimize performance" → Use `mentalmodel` with first_principles

6. **mcp-sequentialthinking-tools** - Break down problems when:
   - Task involves multiple complex steps
   - Planning a new feature implementation
   - User asks for help organizing their thoughts
   - **Example:** User says "help me implement authentication" → Use sequential thinking to plan steps

7. **waldzell-stochastic-thinking** - Apply probabilistic reasoning when:
   - Making decisions under uncertainty
   - Comparing multiple options with tradeoffs
   - Resource allocation problems
   - **Example:** User asks "which caching strategy?" → Use multi-armed bandit algorithm

8. **playwright/chrome-devtools** - Automate browser when:
   - Need to test a live website
   - User asks to check how a page looks
   - Debugging web-specific issues
   - Taking screenshots for documentation
   - **Example:** User says "check if the site is working" → Navigate and screenshot

### How to Use MCPs Proactively

**Pattern 1: Silent Enhancement**
```
User: "Is Dexie the latest version?"
You: [Silently call npm-sentinel__npmLatest for "dexie"]
You: "You're using Dexie 4.0.7, and the latest is 4.2.1. Consider updating for bug fixes."
```

**Pattern 2: Parallel Information Gathering**
```
User: "Let's optimize the build"
You: [Parallel calls to getDiagnostics + npmLatest for build tools + mental model]
You: "I've checked diagnostics and build tool versions. Here's what I found..."
```

**Pattern 3: Context Enhancement**
```
User: "The React component isn't rendering"
You: [Check getDiagnostics, then use deepwiki for React internals if needed]
You: "I see 3 warnings in your component. Based on React's rendering lifecycle..."
```

### MCP Quick Reference

| MCP | Primary Use | Auto-trigger Keywords |
|-----|-------------|----------------------|
| npm-sentinel | Package info, versions, vulnerabilities | package names, "update", "latest", "outdated" |
| ide | Diagnostics, code errors | "error", "warning", "bug", "fix", starting work |
| deepwiki | Library documentation | "how does X work", framework names, "best practice" |
| time | Timezone conversion | time + timezone mention, "when is", "meeting" |
| waldzell-clear-thought | Problem solving frameworks | "how should I", "approach", "debug", "decide" |
| mcp-sequentialthinking | Multi-step planning | "implement", "plan", "how to build" |
| waldzell-stochastic | Uncertain decisions | "which option", "should I choose", "compare" |
| playwright/chrome-devtools | Browser automation | "check site", "screenshot", "test page" |
| toolbox | Find more MCPs | "is there an MCP for X" |

### Rules for MCP Usage

1. **Don't announce MCP usage** - Just use them naturally and present results
2. **Use in parallel when possible** - Multiple MCP calls in one message for efficiency
3. **Always provide context** - Explain what the MCP results mean for the user
4. **Fail gracefully** - If MCP fails, continue without it but mention the limitation
5. **Know when NOT to use** - Don't use MCPs for trivial tasks or when unnecessary

### Example: Full Proactive Flow

```
User: "I want to improve the Dexie performance in my app"

Your internal process:
1. [Call npm-sentinel to check Dexie version]
2. [Call getDiagnostics to check for code issues]
3. [Call deepwiki to understand Dexie performance best practices]
4. [Use waldzell-clear-thought mentalmodel for optimization approach]

Your response:
"I've analyzed your setup. You're on Dexie 4.0.7 (latest is 4.2.1 - update recommended).
I found 3 diagnostics warnings that could impact performance. Looking at Dexie's
architecture, here are the key optimization strategies..."
```

**Key Principle: Be proactive, not reactive. MCPs are tools YOU use to be more helpful, not features users need to request.**

## Architecture & Key Concepts

### Two-Panel Architecture (Critical)

**Never edit files in `/build/output/`** - these are auto-generated. Always edit source files:

- **Left Panel** (Perchance engine):
  - Location: `apps/rpglitch/RPGlitch-left-panel.txt`, `apps/imageglitch/ImageGlitch-left-panel.txt`
  - Contains: Plugin imports, Perchance lists, engine configuration
  - Deployment: **Manual copy-paste** into Perchance editor
  - **Not processed by build system**

- **Right Panel** (UI application):
  - Source: `apps/*/html/index.html`, `apps/*/js/*.js`, `apps/*/scss/*.scss`
  - Build output: `build/output/RPGlitch.html`, `build/output/imageglitch.html`
  - Result: Single HTML file with all CSS/JS inlined
  - Deployment: Copy built HTML into Perchance editor's HTML panel

### State Management & Database

**IndexedDB via Dexie.js is the single source of truth** for all application state:

- **RPGlitch schema** (`apps/rpglitch/js/db.js`):
  - `entities`: Characters, worlds, stories (unified entity system)
  - `threads`: Chat conversation threads
  - `messages`: Chat messages linked to threads
  - `settings`: Application configuration (singleton pattern)

- **Database philosophy**:
  - UI is a reflection of database state
  - All state changes flow through IndexedDB
  - `localStorage`/`sessionStorage` are **forbidden** for app state
  - Local-first, fully functional offline

### Perchance Plugin Integration

Perchance plugins load asynchronously and must be waited for:

- **Plugin exposure pattern** (see `apps/rpglitch/js/index.js:32-50`):
  1. Left panel exposes plugins as `pluginAi`, `pluginTextToImage`, etc.
  2. Right panel's `setupPlugins()` copies them to standard names (`ai`, `textToImage`)
  3. `waitForPlugins()` ensures plugins are available before use

- **Common plugins**:
  - `ai-text-plugin`: LLM text generation
  - `text-to-image-plugin`: Image generation
  - `super-fetch-plugin`: CORS bypass
  - `remember-plugin`: Perchance persistent storage
  - `upload-plugin`: File uploads

### Build System

Build process (`build/scripts/build-app.js`):
1. Compile SCSS → CSS (with Pico.css base + custom SCSS)
2. Bundle JS modules → single IIFE bundle (esbuild)
3. Inline vendored libraries (Dexie, DOMPurify, _hyperscript, Cash)
4. Inject into HTML template → single output file
5. Output to `build/output/[AppName].html`

**Vendored libraries** (in `build/local_libs/`):
- Pico.css (UI framework)
- Dexie.js (IndexedDB wrapper)
- DOMPurify (XSS sanitization)
- _hyperscript (declarative UI interactions)
- Cash (lightweight DOM library for RPGlitch)

## Coding Standards & Rules

### JavaScript (ES6+ Modules)

**Critical rules**:
- **Use `const` by default, `let` only for reassignment** - `var` is **FORBIDDEN**
- **ES6 modules only** (`import`/`export`) - **IIFEs are FORBIDDEN**
- **Vanilla DOM APIs** - No jQuery (Cash is for legacy support only)
- **IndexedDB only** - `localStorage`/`sessionStorage` **FORBIDDEN** for app state
- **Prefer plain objects over classes** for better interoperability
- **`DOMPurify.sanitize()` is MANDATORY** before assigning user/AI content to `innerHTML`

**Code organization**:
- Module files in `apps/*/js/`
- Each module exports specific functions/objects
- Import only what you need

### SCSS/CSS

**Architecture**:
- Base: Pico.css (provides foundation, semantic styling)
- Custom: Simplified 7-1 pattern, `index.scss` as manifest
- **Do not nest selectors more than 3 levels deep**
- Use `1rem` base unit for spacing consistency
- All SCSS compiles to single inlined `<style>` block

**Color system** (defined in `design-system.md`):
- Global gradient background (4-stop linear gradient)
- Brand palettes: Pink (#ec4899), Emerald (#10b981), Cyan (#06b6d4)

### HTML

**Semantic structure**:
- Use HTML5 semantic elements (`<main>`, `<nav>`, `<header>`, `<article>`, etc.)
- Avoid excessive `<div>` and `<span>`
- All `<img>` tags **must have descriptive `alt` attributes**
- All form inputs **must have associated `<label>` elements**

### Icon-Free Mandate (Non-Negotiable UI Rule)

**All interactive elements MUST use text labels**:
- ❌ Bad: `<button><img src="save.svg"></button>`
- ✅ Good: `<button>Save</button>`
- ✅ Good: `<button>Save All Data 💾</button>` (icon as embellishment)

Rationale: Ensures clarity, accessibility, and aligns with minimalist aesthetic.

## Testing

**Framework**: Jest with jsdom environment

**Configuration**:
- Config: `jest.config.cjs`
- Babel config: `babel.config.cjs`
- Setup file: `tests/setup-jest.js`

**Test location**: All tests in `/tests/` directory

**Philosophy**: Prioritize testing pure functions. For DOM code, use jsdom queries and event simulation.

## Security

**Non-negotiable security rules**:
1. **Never commit secrets** - Use `.env` for local development (gitignored)
2. **Sanitize all dynamic HTML** - `DOMPurify.sanitize()` on all user/AI content before `innerHTML`
3. **Vendored dependencies only** - No CDN links (all libs in `build/local_libs/`)
4. **XSS prevention** - Prefer `textContent` or `createElement` over `innerHTML` when possible

## Git & Commits

**Commit format** (Conventional Commits):
```
<type>(<scope>): <subject>

Examples:
feat(rpglitch): add character import feature
fix(imageglitch): correct aspect ratio calculation
docs(claude): update build instructions
refactor(core): simplify database migration logic
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `build`

**Scopes**: `rpglitch`, `imageglitch`, `core`, `build`, `docs`, `deps`

## Important Files & Documentation

**Read these first**:
1. **GEMINI.md** - Complete unified protocol for AI-assisted development (written for Gemini, but useful context)
2. **design-system.md** - UI/UX guidelines, component library, Icon-Free Mandate
3. **PERCHANCE.md** - Two-Panel Architecture details, plugin integration, deployment workflow
4. **README.md** - Quick start, repository structure, common tasks

**Additional references**:
- `perchance-development-guide.md` - Comprehensive Perchance platform reference
- `plan.md` - Project roadmap and feature backlog

## Directory Structure

```
default/
├── apps/                          # Applications
│   ├── rpglitch/
│   │   ├── RPGlitch-left-panel.txt   # Perchance engine (manual deploy)
│   │   ├── html/index.html           # UI source
│   │   ├── js/                       # ES6 modules
│   │   │   ├── index.js              # Main entry point
│   │   │   ├── db.js                 # Dexie database schema
│   │   │   ├── entities.js           # Entity CRUD operations
│   │   │   ├── profile.js            # Profile view logic
│   │   │   └── utils.js              # UI utilities, chin, watchdog
│   │   └── scss/                     # Custom styles
│   └── imageglitch/
│       └── [similar structure]
├── build/
│   ├── scripts/                   # Build automation
│   │   ├── build-app.js           # Main build script
│   │   ├── sync.js                # Config sync script
│   │   └── watch.js               # File watcher
│   ├── local_libs/                # Vendored dependencies
│   └── output/                    # ⚠️ DO NOT EDIT - auto-generated
├── tests/                         # Jest test suite
├── memory-bank/                   # Active work tracking
│   └── archive/                   # Completed task logs
└── tools/                         # Diagnostic utilities
```

## Common Patterns & Anti-Patterns

### ✅ Good Patterns

**Database-first state updates**:
```javascript
// Update database first, then UI reacts
await db.entities.update(entityId, { name: newName });
// UI updates via state:changed event listener
```

**Plugin waiting**:
```javascript
// Always wait for plugins before use
const pluginsReady = await waitForPlugins(['ai', 'textToImage']);
if (!pluginsReady) {
  // Handle gracefully
}
```

**Safe HTML rendering**:
```javascript
// Use DOMPurify for user/AI content
element.innerHTML = DOMPurify.sanitize(userContent);
// Or prefer textContent when possible
element.textContent = userContent;
```

### ❌ Anti-Patterns

**Direct output editing**:
```javascript
// ❌ NEVER edit build output
fs.writeFileSync('build/output/RPGlitch.html', ...);

// ✅ Edit source files
fs.writeFileSync('apps/rpglitch/html/index.html', ...);
```

**localStorage for app state**:
```javascript
// ❌ Forbidden
localStorage.setItem('appState', JSON.stringify(state));

// ✅ Use IndexedDB
await db.settings.put({ id: 'app-settings', ...state });
```

**Unsanitized innerHTML**:
```javascript
// ❌ XSS vulnerability
element.innerHTML = userInput;

// ✅ Sanitize first
element.innerHTML = DOMPurify.sanitize(userInput);
```

## Troubleshooting

### Build fails with module errors
- Run `npm ci` to ensure clean dependency install
- Run `npm run sync` to update configurations
- Check `build/output/` exists: `mkdir -p build/output`

### Tests failing
- Ensure jest config points to correct setup file
- Check that test environment is `jsdom`
- Verify Dexie mock is properly set up in test setup

### Perchance deployment issues
- **Plugin timeout**: Verify left panel has correct `{import:plugin-name}` syntax
- **Invalid list name**: Left panel list names must use only letters, numbers, underscores (no hyphens, spaces, dots)
- **Plugins not available**: Check browser console for plugin loading errors, refresh page

## Key Insights for Development

1. **Database is source of truth**: Always update IndexedDB first, UI reacts to changes
2. **Build output is read-only**: Never edit `build/output/`, always edit source files
3. **Perchance has two worlds**: Left panel (Perchance syntax) vs Right panel (standard web tech)
4. **Security is non-negotiable**: DOMPurify all dynamic HTML, no secrets in commits
5. **Icon-Free UI**: Text labels are mandatory for all interactive elements
6. **Local-first**: Apps must work fully offline once loaded

## Testing a Single File

To run tests for a specific file:
```bash
# Run specific test file
npx jest tests/your-test-file.test.js

# Run with watch mode
npx jest --watch tests/your-test-file.test.js

# Run with coverage
npx jest --coverage tests/your-test-file.test.js
```

## Deploying to Perchance

1. **Build locally**: `npm run deploy` (runs sync → lint → build → test)
2. **Copy left panel**: Open `apps/rpglitch/RPGlitch-left-panel.txt`, copy entire contents
3. **Paste to Perchance**: Paste into Perchance editor's **Left Panel** (Lists section)
4. **Copy right panel**: Open `build/output/RPGlitch.html`, copy entire contents
5. **Paste to Perchance**: Paste into Perchance editor's **HTML Panel**
6. **Save & test**: Save in Perchance, refresh page, check console for errors

---

This codebase is optimized for AI-assisted development with clear separation of concerns, strict architectural patterns, and comprehensive safety measures.
