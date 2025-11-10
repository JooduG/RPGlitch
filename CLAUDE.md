# CLAUDE.md

**Version 4.0.0** | Refactored and Synchronized
**Last Updated:** 2025-11-10

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
   - Creating timestamped files (use Europe/Stockholm)
   - Scheduling or discussing meetings across timezones
   - **MANDATORY:** Never hardcode dates, always use time MCP
   - **Example:** User says "the meeting is at 3pm EST" → Automatically convert to their timezone

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
6. **Time MCP mandatory** - Never hardcode dates, always use Time MCP for timestamps

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

## Codacy Integration (Critical)

### Mandatory After Every File Edit

**CRITICAL: After ANY successful file edit or code change, you MUST immediately run codacy_cli_analyze.**

### Required Codacy Configuration

When using any tool that accepts these arguments, **ALWAYS use:**
- `provider`: `gh` (GitHub)
- `organization`: `JooduG`
- `repository`: `default`

Avoid calling `git remote -v` unless really necessary.

### Post-Edit Analysis Protocol

**After ANY successful `edit_file`, `Write`, or `Edit` operation:**

1. **MUST IMMEDIATELY** run the `codacy_cli_analyze` tool for each file that was edited, with:
   - `rootPath`: set to the workspace path (`/home/user/default`)
   - `file`: set to the path of the edited file
   - `tool`: leave empty or unset

2. If any issues are found in the new edits:
   - Propose fixes for the issues
   - Apply the fixes if possible
   - Re-run analysis to verify fixes

3. **FAILURE TO FOLLOW THIS RULE IS CONSIDERED A CRITICAL ERROR**

### Dependency Security Checks

**CRITICAL: After ANY dependency operations:**

When you perform ANY of these actions:
- Running `npm install`, `yarn add`, `pnpm install`
- Adding dependencies to `package.json`
- Adding requirements to `requirements.txt`
- Adding dependencies to `pom.xml` or `build.gradle`
- Any other package manager operations

You **MUST** run the `codacy_cli_analyze` tool with:
- `rootPath`: set to the workspace path
- `tool`: set to `"trivy"`
- `file`: leave empty or unset

If any vulnerabilities are found because of newly added packages:
- Stop all other operations
- Propose and apply fixes for the security issues
- Only continue with the original task after security issues are resolved

**Example:**
```
After: npm install react-markdown
Do: Run codacy_cli_analyze with tool: "trivy"
Before: Continuing with any other tasks
```

### Codacy CLI Installation

When you try to run the `codacy_cli_analyze` tool and the Codacy CLI is not installed:
1. Ask the user: "Codacy CLI is not installed. Would you like me to install it now?"
2. If the user responds with "yes", run the `codacy_cli_install` tool and then continue with the original task
3. If the user responds with "no", instruct the user that they can disable automatic analysis in the extension settings
4. Wait for the user to respond before proceeding with any other actions

### Error Handling

**When repository returns 404 error:**
- Offer to run the `codacy_setup_repository` tool to add the repository to Codacy
- If the user accepts, run the tool
- Do not ever try to run the tool on your own
- After setup, immediately retry the action that failed (only retry once)

**When Codacy MCP Server tools are unavailable:**
- Suggest troubleshooting steps:
  - Try to reset the MCP on the extension
  - Review Copilot > MCP settings in GitHub
  - Contact Codacy support if issues persist

### General Guidelines

- Repeat the relevant analysis steps for each modified file
- "Propose fixes" means to both suggest AND automatically apply the fixes if possible
- You **MUST NOT** wait for the user to ask for analysis or remind you to run the tool
- Do not run analysis looking for changes in:
  - Duplicated code
  - Code complexity metrics (focus on complexity issues, not metrics)
  - Code coverage
- Do not manually install Codacy CLI using brew, npm, npx, or other package managers
- Only send provider, organization, and repository if the project is a git repository

### Post-Response Verification

After every response you send:
- Verify you ran `codacy_cli_analyze` for any file edits made in this conversation
- This is a mandatory self-check

## Architecture & Key Concepts

### Two-Panel Architecture (Critical)

**Never edit files in `/build/output/`** - these are auto-generated. Always edit source files:

**Left Panel** (Perchance engine):
- Location: `apps/rpglitch/RPGlitch-left-panel.txt`, `apps/imageglitch/ImageGlitch-left-panel.txt`
- Contains: Plugin imports, Perchance lists, engine configuration
- Deployment: **Manual copy-paste** into Perchance editor
- **Not processed by build system**

**Right Panel** (UI application):
- Source: `apps/*/html/index.html`, `apps/*/js/*.js`, `apps/*/scss/*.scss`
- Build output: `build/output/RPGlitch.html`, `build/output/imageglitch.html`
- Result: Single HTML file with all CSS/JS inlined
- Deployment: Copy built HTML into Perchance editor's HTML panel

### State Management & Database

**IndexedDB via Dexie.js is the single source of truth** for all application state:

**RPGlitch schema** (`apps/rpglitch/js/db.js`):
- `entities`: Characters, worlds, stories (unified entity system)
- `threads`: Chat conversation threads
- `messages`: Chat messages linked to threads
- `settings`: Application configuration (singleton pattern)

**Database philosophy:**
- UI is a reflection of database state
- All state changes flow through IndexedDB
- `localStorage`/`sessionStorage` are **forbidden** for app state
- Local-first, fully functional offline

### Perchance Plugin Integration

Perchance plugins load asynchronously and must be waited for:

**Plugin exposure pattern** (see `apps/rpglitch/js/index.js:32-50`):
1. Left panel exposes plugins as `pluginAi`, `pluginTextToImage`, etc.
2. Right panel's `setupPlugins()` copies them to standard names (`ai`, `textToImage`)
3. `waitForPlugins()` ensures plugins are available before use

**Common plugins:**
- `ai-text-plugin`: LLM text generation
- `text-to-image-plugin`: Image generation
- `super-fetch-plugin`: CORS bypass
- `remember-plugin`: Perchance persistent storage
- `upload-plugin`: File uploads

**Three-step exposure strategy:**
1. Import in left panel: `pluginAi = ai`
2. Expose to window in right panel HTML: `window.pluginAi = ai`
3. Copy to standard names in JavaScript: `window.ai = window.pluginAi`

**Availability waiting:**
- Use `waitForPlugins()` at initialization
- Timeout: 10 seconds with retry mechanism
- Graceful degradation if plugins timeout

### Perchance Syntax Rules

**Valid List Names:**
- ✅ Valid: `animal`, `my_list`, `list123`, `MyList`
- ❌ Invalid: `my-list` (hyphens), `my list` (spaces), `123list` (starts with number), special characters

**Escaping Perchance Syntax:**
- Use backslash to escape literal `[` or `{` characters in HTML/CSS
- Example: `\[item1|item2\]` for literal display

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

**Critical rules:**
- **Use `const` by default, `let` only for reassignment** - `var` is **FORBIDDEN**
- **ES6 modules only** (`import`/`export`) - **IIFEs are FORBIDDEN**
- **Vanilla DOM APIs** - No jQuery (Cash is for legacy support only)
- **IndexedDB only** - `localStorage`/`sessionStorage` **FORBIDDEN** for app state
- **Prefer plain objects over classes** for better interoperability
- **`DOMPurify.sanitize()` is MANDATORY** before assigning user/AI content to `innerHTML`

**Code organization:**
- Module files in `apps/*/js/`
- Each module exports specific functions/objects
- Import only what you need
- Unexported functions/variables are inherently private to the module

**DOM Manipulation:**
- Use vanilla DOM APIs: `document.getElementById`, `querySelector`, `addEventListener`, `classList`, `textContent`, `createElement`
- **AVOID** `innerHTML` for dynamic/user-provided content due to XSS risks
- Use `textContent` or create elements programmatically

**Storage:**
- **RULE:** All client-side storage **MUST** use **IndexedDB** via **Dexie.js**
- `localStorage` and `sessionStorage` are **FORBIDDEN** for application state

**Type Safety:**
- Avoid `any` type; prefer `unknown`
- Perform necessary type narrowing before use

**Security:**
- **DIRECTIVE:** `DOMPurify.sanitize()` is MANDATORY for any string containing user input or AI-generated content before assigning to `innerHTML`
- Prefer safer methods like `textContent` or `createElement` first

### SCSS/CSS

**Architecture:**
- Base: Pico.css (provides foundation, semantic styling)
- Custom: Simplified 7-1 pattern, `index.scss` as manifest
- **Do not nest selectors more than 3 levels deep**
- Use `1rem` base unit for spacing consistency
- All SCSS compiles to single inlined `<style>` block

**Color system:**
- Global gradient background (4-stop linear gradient):
  - `$gradient-color-1: #181c2f`
  - `$gradient-color-2: #23243a`
  - `$gradient-color-3: #1a3a4a`
  - `$gradient-color-4: #2a1a3a`
- Signature colors: Pink (#ec4899), Emerald (#10b981), Cyan (#06b6d4), Orange (#f97316), Purple (#a855f7)

**Spacing:**
- Base unit: `1rem` (16px)
- All major layout margins, paddings, and gaps use `1rem` for consistent rhythm
- Border radius: `0.5rem` (8px) via `--pico-radius`

### HTML

**Semantic structure:**
- Use HTML5 semantic elements (`<main>`, `<nav>`, `<header>`, `<article>`, etc.)
- Avoid excessive `<div>` and `<span>`
- All `<img>` tags **must have descriptive `alt` attributes**
- All form inputs **must have associated `<label>` elements**
- Provide adequate touch targets for mobile users
- Ensure keyboard navigation support

**Hyperscript:**
- Use `_hyperscript` for simple, declarative UI interactions in HTML attributes
- Use dedicated JavaScript modules for complex logic

### Icon-Free Mandate (Non-Negotiable UI Rule)

**All interactive elements MUST use text labels:**
- ❌ Bad: `<button><img src="save.svg"></button>`
- ✅ Good: `<button>Save</button>`
- ✅ Good: `<button>Save All Data 💾</button>` (icon as embellishment)

**Rationale:** Ensures clarity, accessibility, and aligns with minimalist aesthetic.

## Testing

**Framework:** Jest with jsdom environment

**Configuration:**
- Config: `jest.config.cjs`
- Babel config: `babel.config.cjs`
- Setup file: `tests/setup-jest.js`

**Test location:** All tests in `/tests/` directory

**Philosophy:** Prioritize testing pure functions. For DOM code, use jsdom queries and event simulation.

**Single file testing:**
```bash
# Run specific test file
npx jest tests/your-test-file.test.js

# Run with watch mode
npx jest --watch tests/your-test-file.test.js

# Run with coverage
npx jest --coverage tests/your-test-file.test.js
```

## Security

**Non-negotiable security rules:**

1. **Never commit secrets** - Use `.env` for local development (gitignored)
2. **Sanitize all dynamic HTML** - `DOMPurify.sanitize()` on all user/AI content before `innerHTML`
3. **Vendored dependencies only** - No CDN links (all libs in `build/local_libs/`)
4. **XSS prevention** - Prefer `textContent` or `createElement` over `innerHTML` when possible
5. **Codacy analysis** - Run after every file edit and dependency change (see Codacy section above)

## Git & Commits

**Commit format** (Conventional Commits):

```
<type>(<scope>): <subject>

Examples:
feat(rpglitch): add character import feature
fix(imageglitch): correct aspect ratio calculation
docs(claude): sync ai protocol files
refactor(core): simplify database migration logic
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `build`

**Scopes:** `rpglitch`, `imageglitch`, `core`, `build`, `docs`, `deps`

## Design System & UI Components

### Core Design Philosophy

- **Clarity Over Cleverness:** The user should never have to guess. Functionality must be explicit and unambiguous.
- **Minimalism with Purpose:** Every visual element must serve a purpose.
- **Consistency is Queen:** Similar elements must look and behave similarly across all applications.
- **Accessibility by Design:** Our interfaces must be usable and accessible to everyone.

### Visual System

**Color System:**
- Background: Fixed 4-stop linear gradient across all applications
- Text: Standard text color inherited from Pico.css
- Signature Colors: Pink, Emerald, Cyan, Orange, Purple (for entity identity)

**Typography:**
- Font family, sizes, weights, and line heights inherited from Pico.css
- System font stack for optimal performance

**Spacing:**
- Base unit: `1rem` (16px)
- Border radius: `0.5rem` (8px)

### Component Library

**Buttons:**
- Follow Pico.css standards (`.primary`, `.secondary`, `.danger`)
- Must follow Icon-Free Mandate

**Modals:**
- Follow Pico.css standards
- Loading Modal: Displays loading message with custom spinner
- Emergency Modal: Error message with save/delete options

**Cards:**
- Use semantic HTML (`<article>`, `<header>`, `<footer>`)
- Responsive flexbox or grid layout
- Adhere to color palette and spacing rules

**The "Chin" Component (RPGlitch):**
- Slide-out panel for entity selection
- Toggle visibility with ESC key or backdrop click
- No dedicated "Close" button

**Chat View (RPGlitch):**
- Three-column layout (desktop): Left (AI avatar), Center (chat feed + form), Right (user avatar)
- Single-column layout (mobile): Collapsed with integrated avatars
- Distinct styling for user vs assistant messages
- Typing indicator during AI response
- Send button state bound to Chat FSM

**Dynamic Profile Image Input:**
- Context-aware image input with three methods: Paste URL, Generate with AI, Upload file
- Single input field with dynamic button that changes based on content
- Implemented in `apps/rpglitch/js/views.js:284-436`

### UI Safety & Hardening

**RPGlitch Implementation:**
- **Overlay Guard:** Master function to clear lingering UI blockers
- **UI Watchdog:** Polling mechanism to detect stuck UI states
- **Recovery Hooks:** Self-healing on browser events (focus, visibilitychange, pageshow)
- **Attribute Observer:** Strips `inert` or `pointer-events: none` to prevent UI locking

## Important Files & Documentation

**Read these first:**

1. **GEMINI.md** - Complete unified protocol for AI-assisted development (written for Gemini, useful context)
2. **design-system.md** - UI/UX guidelines, component library, Icon-Free Mandate
3. **PERCHANCE.md** - Two-Panel Architecture details, plugin integration, deployment workflow
4. **README.md** - Quick start, repository structure, common tasks

**Additional references:**
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

**Database-first state updates:**
```javascript
// Update database first, then UI reacts
await db.entities.update(entityId, { name: newName });
// UI updates via state:changed event listener
```

**Plugin waiting:**
```javascript
// Always wait for plugins before use
const pluginsReady = await waitForPlugins(['ai', 'textToImage']);
if (!pluginsReady) {
  // Handle gracefully
}
```

**Safe HTML rendering:**
```javascript
// Use DOMPurify for user/AI content
element.innerHTML = DOMPurify.sanitize(userContent);
// Or prefer textContent when possible
element.textContent = userContent;
```

### ❌ Anti-Patterns

**Direct output editing:**
```javascript
// ❌ NEVER edit build output
fs.writeFileSync('build/output/RPGlitch.html', ...);

// ✅ Edit source files
fs.writeFileSync('apps/rpglitch/html/index.html', ...);
```

**localStorage for app state:**
```javascript
// ❌ Forbidden
localStorage.setItem('appState', JSON.stringify(state));

// ✅ Use IndexedDB
await db.settings.put({ id: 'app-settings', ...state });
```

**Unsanitized innerHTML:**
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
7. **Codacy integration**: Mandatory analysis after every edit and dependency change
8. **MCP proactive usage**: Use MCPs automatically for enhanced capabilities
9. **Two-Panel Architecture**: Strict separation between engine (left) and stage (right)
10. **Single inlined output**: All CSS/JS must be embedded in final HTML

## Deploying to Perchance

1. **Build locally**: `npm run deploy` (runs sync → lint → build → test)
2. **Copy left panel**: Open `apps/rpglitch/RPGlitch-left-panel.txt`, copy entire contents
3. **Paste to Perchance**: Paste into Perchance editor's **Left Panel** (Lists section)
4. **Copy right panel**: Open `build/output/RPGlitch.html`, copy entire contents
5. **Paste to Perchance**: Paste into Perchance editor's **HTML Panel**
6. **Save & test**: Save in Perchance, refresh page, check console for errors

## Resource Library

### General Perchance Information

- [Perchance Welcome Page](https://perchance.org/welcome)
- [Perchance Tutorial](https://perchance.org/tutorial)
- [Perchance Advanced Tutorial](https://perchance.org/advanced-tutorial)
- [Perchance Examples](https://perchance.org/examples)
- [Perchance Snippets](https://perchance.org/perchance-snippets)

### Core AI & Utility Plugins

- [AI Text Plugin](https://perchance.org/ai-text-plugin)
- [Text to Image Plugin](https://perchance.org/text-to-image-plugin)
- [Super Fetch Plugin](https://perchance.org/super-fetch-plugin)
- [Remember Plugin](https://perchance.org/remember-plugin)
- [Upload Plugin](https://perchance.org/upload-plugin)

### Relevant Application Examples

- [AI Character Chat Example](https://perchance.org/ai-character-chat) (Highly relevant)
- [AI RPG Example](https://perchance.org/ai-rpg)
- [AI Story Generator Example](https://perchance.org/ai-story-generator)

## MCP Configuration

### Management Commands

- **Add new MCP:** Edit `mcp.master.json`, then run `npm run sync:mcp`
- **Sync configurations:** `npm run sync:mcp` (generates files)
- **Full sync:** `npm run sync:mcp:claude` (generates + pushes to Claude Code CLI)

### Configuration Files

- **Master File:** `mcp.master.json` (version controlled)
- **Generated Files:** `mcp.json`, `.mcp.json` (gitignored)
- **Default Timezone:** Europe/Stockholm (for Time MCP)

### Important Directives

- **ALWAYS** use Time MCP for timestamps - **NEVER** hardcode dates
- Windows commands wrapped with `cmd /c` for compatibility
- See `mcp.master.json` for full list of available servers

## Memory Bank

**Purpose:** Persistent knowledge base for tracking active work, long-term goals, and completed tasks.

**Structure:**
- `/memory-bank/*.md`: Active work-in-progress, backlogs, tracking items
- `/memory-bank/archive/`: Read-only timestamped archive of completed tasks

**Process:**
1. Create new tracking items in root `/memory-bank/` directory
2. When task is completed, move file to `/memory-bank/archive/` with YYYY-MM-DD- prefix
3. Root directory remains clean, reflecting only current and future work

## Environment

- **Node.js Version:** 22 (managed via `.nvmrc`)
- **Package Manager:** npm
- **Dependency Installation:** Use `npm ci` for reproducible builds
- **Adding Packages:** Use `npm install` only when adding/updating packages

---

**Version Notes:**

**4.0.0 (2025-11-10)** - Major synchronization update. Complete refactor to unify all project instruction files into a single master source. Integrated comprehensive rules from all documentation sources including Codacy integration, enhanced MCP protocols, complete design system, and Perchance platform specifics. Both GEMINI.md and CLAUDE.md now maintain identical content with format optimization for their respective AI models.

---

This codebase is optimized for AI-assisted development with clear separation of concerns, strict architectural patterns, comprehensive safety measures, integrated quality assurance through Codacy, and proactive MCP usage for enhanced capabilities.
