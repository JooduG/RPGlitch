# RPGlitch - Perchance Development Guide

A comprehensive guide for building and deploying RPGlitch applications on the Perchance platform, including build automation and AI assistant commands.

## 🧠 Rules System & Memory Bank

This project uses a sophisticated rules system and memory bank for consistent development and context management.

### Memory Bank Files
- **`memory-bank/coreContext.md`** - Project foundation, goals, and technical stack
- **`memory-bank/currentState.md`** - Current work focus and recent changes
- **`memory-bank/designSystem.md`** - Architecture patterns and design system

### Active Rules
- **plan-act-mode.mdc** - Mode control system (Plan vs Act)
- **core-startup.mdc** - Mandatory startup protocol
- **context-management.mdc** - 60% context threshold management
- **enhanced-error-handling.mdc** - Proactive error handling
- **code-quality-standards.mdc** - Complete implementation standards
- **communication-style.mdc** - Technical but concise communication
- **perchance-best-practices.mdc** - Platform-specific patterns
- **basic-security.mdc** - Input sanitization and validation
- **frontend-best-practices.mdc** - React/JS/CSS standards

### Context Management
- **60% Threshold**: Automatic context management trigger
- **Memory Bank Updates**: Use "update memory bank" to refresh all files
- **Context Handoff**: Automatic preparation when approaching limits

## 🚀 Quick Start

### 1. Install Dependencies (Optional)
```bash
npm install
```

### 2. Build Files
Run the build script to generate both the offline testing file and the file for Perchance:
```bash
npm run build
```
This command creates two important files in the `build/` directory:
- `RPGlitch-offline.html`: Open this file directly in your browser for local testing.
- `RPGlitch-perchance.html`: Use this file to deploy your generator to Perchance.org.

### 3. Test Locally
Open `build/RPGlitch-offline.html` in your web browser to test all functionality without needing to upload anything.

### 4. Deploy to Perchance
When you are ready to deploy:
1. Copy the entire contents of `build/RPGlitch-perchance.html`.
2. Paste it into the **right panel** of your Perchance project.
3. Copy the entire contents of `RPGlitch/RPGlitch-left-panel.html` into the **left panel**.

## 📁 Project Structure

```
Perchance/
├── RPGlitch/
│   ├── RPGlitch.html              # Main HTML structure
│   ├── RPGlitch.css               # CSS styles
│   ├── RPGlitch.js                # JavaScript logic
│   ├── RPGlitch-left-panel.html   # Left panel (injected by build script)
│   └── offline-template.html      # Template for local testing file
├── build/
│   ├── RPGlitch-perchance.html    # Generated file for Perchance.org
│   └── RPGlitch-offline.html      # Generated file for local testing
├── build-perchance.js             # Build script
├── package.json                   # Project configuration
└── README.md                      # This file
```

## 🛠️ Build Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build the combined file for Perchance |
| `npm run build:watch` | Build and watch for changes (requires nodemon) |
| `npm run validate` | Check if all source files exist |
| `npm run clean` | Remove the build directory |
| `npm run deploy` | Build and show deployment instructions |
| `npm run rules:update` | Show instructions for updating memory bank files |

## 🔧 Manual Build

If you prefer to run the script directly:

```bash
node build-perchance.js
```

## 📋 Build Process

The build script performs the following steps:

1. **Validates** all source files exist.
2. **Combines** the core source files (`.html`, `.css`, `.js`) into a single "right panel" content block.
3. **Generates two files**:
   - **`build/RPGlitch-perchance.html`**: A clean HTML file for Perchance.org deployment.
   - **`build/RPGlitch-offline.html`**: Reads `offline-template.html`, injects both the "left panel" logic and the "right panel" content, and creates a fully runnable file for local testing.

**Note**: Development follows the comprehensive rules system for consistent quality and context management. See the Rules System & Memory Bank section above for details.

## 🎯 Development Workflow

### During Development
- Edit the separate source files in `RPGlitch/`.
- Run `npm run build` (or `npm run build:watch`) to update the `build/RPGlitch-offline.html` file.
- **Test your changes by opening `build/RPGlitch-offline.html` in your browser.** This is the fastest way to iterate.

### For Perchance Deployment
- When you are satisfied with your local testing, run `npm run build` one last time.
- Copy the contents from `build/RPGlitch-perchance.html` and `RPGlitch/RPGlitch-left-panel.html` to the Perchance website.
- Do a final test on the Perchance platform itself.

## 🔍 Troubleshooting

### Build Fails or Offline File Doesn't Work
- Make sure all source files exist, including `RPGlitch/offline-template.html`.
- `RPGlitch/RPGlitch.html`
- `RPGlitch/RPGlitch.css`
- `RPGlitch/RPGlitch.js`
- `RPGlitch/offline-template.html` (if offline build fails)

### Build Fails
Check the console output for specific error messages. Common issues:
- Missing source files
- File permission issues
- Invalid file paths

### Perchance Issues
If the combined file doesn't work on Perchance:
1. Check that the file size isn't too large
2. Verify all script tags are properly closed
3. Ensure the left panel file is also copied

## 📊 Build Information

The build script adds helpful metadata to the output file:
- Build timestamp
- Source file information
- Platform-specific instructions
- Section markers for easy navigation

---

# 🤖 AI Assistant Commands

This section covers the commands you can use to control the AI assistant's behavior and access different features of the rules system.

## Mode Control Commands

### Plan Mode Activation
```
"let's plan this"
"think about this"
"what's your approach?"
"how would you solve this?"
"switch to plan mode"
```

### Act Mode Activation
```
"switch to act mode"
"implement this plan"
"do this"
"execute this"
"build this"
"create this"
```

### Mode Switching
- **Plan → Act**: User explicitly requests implementation
- **Act → Plan**: User requests planning or implementation reveals plan flaws
- **Auto-Detection**: Complex tasks default to Plan, simple tasks default to Act

## Context Management Commands

### Memory Bank Updates
```
"update memory bank" - Updates all memory bank files
"update coreContext" - Updates project foundation
"update currentState" - Updates current work status
"update designSystem" - Updates architecture patterns
```

### Context Handoff
```
"prepare handoff" - Creates context summary for next session
"save context" - Saves current state to memory bank
"load context" - Loads context from memory bank
```

## Enhanced Error Handling Commands

### Learning Capture
```
"capture learnings" - Documents insights from current task
"what did we learn?" - Reviews recent learnings
"apply learnings" - Uses past learnings for current task
"enhanced error handling" - Activates comprehensive error handling
```

### Error Recovery
```
"fix this error" - Immediate error resolution
"debug this" - Systematic debugging process
"restore from backup" - Uses backup files
"error analysis" - Deep error investigation
```

## Communication Control

### Style Preferences
```
"be more technical" - Increases technical detail
"be more concise" - Reduces verbosity
"show me the code" - Focuses on implementation
"explain the approach" - Focuses on strategy
```

### Output Format
```
"use bullet points" - Structured list format
"draw a diagram" - Mermaid diagram output
"step by step" - Numbered process format
```

## Quality Control Commands

### Code Quality
```
"review this code" - Code quality assessment
"optimize this" - Performance optimization
"refactor this" - Code restructuring
"add error handling" - Error handling implementation
```

### Testing Commands
```
"test this" - Runs tests
"add tests" - Creates test coverage
"debug tests" - Test troubleshooting
```

## Security Commands

### Security Implementation
```
"security review" - Comprehensive security assessment
"implement security" - Security best practices implementation
"sanitize input" - Input sanitization with DOMPurify
"secure storage" - IndexedDB security implementation
```

### Security Testing
```
"security test" - Security vulnerability testing
"penetration test" - Penetration testing
"audit security" - Security audit
```

## Project-Specific Commands

### Perchance Development
```
"build perchance" - Perchance-specific build process
"perchance structure" - Perchance architecture guidance
"perchance best practices" - Perchance-specific patterns
```

### Frontend Development
```
"react component" - React component creation
"css styling" - CSS implementation
"responsive design" - Mobile-first approach
"accessibility" - A11y implementation
"frontend best practices" - Comprehensive frontend guidance
```

## System Control Commands

### Rule Management
```
"show active rules" - Lists currently active rules
"disable rule [name]" - Temporarily disables specific rule
"enable rule [name]" - Re-enables specific rule
"rule status" - Shows rule system status
```

### Performance Commands
```
"optimize context" - Reduces context usage
"clear cache" - Clears system cache
"memory usage" - Shows context usage statistics
```

## Quick Reference

### Common Workflows

**New Feature Development:**
1. "let's plan this" → Enhanced Plan Mode
2. "implement this plan" → Act Mode
3. "capture learnings" → Enhanced Error Handling

**Bug Fixing:**
1. "fix this error" → Enhanced Error Handling
2. "debug this" → Systematic debugging
3. "capture learnings" → Learning capture

**Code Review:**
1. "review this code" → Quality assessment
2. "optimize this" → Performance review
3. "add error handling" → Enhanced Error Handling

**Security Implementation:**
1. "security review" → Security assessment
2. "implement security" → Security best practices
3. "security test" → Security testing

**Context Management:**
1. "update memory bank" → Full update
2. "prepare handoff" → Context summary
3. "save context" → State preservation

### Emergency Commands

**Context Issues:**
- "clear context" - Resets context
- "load backup" - Restores from backup
- "emergency handoff" - Forced context preservation

**System Issues:**
- "reset rules" - Resets rule system
- "safe mode" - Minimal rule set
- "debug system" - System troubleshooting

**Security Issues:**
- "security breach" - Emergency security response
- "lockdown" - Immediate security lockdown
- "audit trail" - Security audit trail

## Integration Notes

### Automatic Triggers
- **60% Context**: Automatic context management
- **Error Detection**: Automatic enhanced error handling
- **Task Completion**: Automatic learning capture
- **Mode Conflicts**: Automatic mode resolution
- **Security Issues**: Automatic security response

### Contextual Activation
- **Complex Tasks**: Auto-activates Enhanced Plan Mode
- **Simple Tasks**: Auto-activates Act Mode
- **Error Scenarios**: Auto-activates Enhanced Error Handling
- **Security Scenarios**: Auto-activates Security Best Practices
- **Context Threshold**: Auto-activates Context Management

## Best Practices

### Command Usage
- **Be Specific**: Use precise commands for better results
- **Context Matters**: Commands work differently in different modes
- **Chain Commands**: Combine commands for complex workflows
- **Verify Results**: Always check command execution results

### Efficiency Tips
- **Use Shortcuts**: Learn common command patterns
- **Batch Operations**: Group related commands together
- **Leverage Auto-Detection**: Let the system choose when possible
- **Regular Updates**: Keep memory bank current

### Security Best Practices
- **Regular Security Reviews**: Schedule regular security assessments
- **Input Validation**: Always validate and sanitize inputs
- **Error Handling**: Implement comprehensive error handling
- **Dependency Updates**: Keep security dependencies updated

---

**Happy building! 🎭**

## 🧩 BrowserTools MCP Integration

BrowserTools MCP enables advanced browser automation, debugging, and log capture directly from Cursor and other MCP clients.

### Setup Steps

1. **Clone the BrowserTools MCP repository:**
   ```bash
   git clone https://github.com/AgentDeskAI/browser-tools-mcp.git
   ```
2. **Install the Chrome Extension:**
   - Go to `chrome://extensions` in Chrome
   - Enable Developer Mode
   - Click 'Load unpacked' and select the `chrome-extension` folder from the cloned repo
3. **Add BrowserTools MCP to Cursor:**
   - Edit your `.cursor/mcp.json` and add:
     ```json
     "browser-tools": {
       "command": "npx @agentdeskai/browser-tools-mcp@1.2.0"
     }
     ```
4. **Run the BrowserTools server:**
   ```bash
   npx @agentdeskai/browser-tools-server@1.2.0
   ```
   (Keep this running in a terminal while using BrowserTools)
5. **Open Chrome DevTools** on the target page to enable log capture and screenshots.

### Usage Notes
- Use BrowserTools MCP for console/network log capture, screenshots, audits, and debugging.
- See [BrowserTools Installation Guide](https://browsertools.agentdesk.ai/installation) for troubleshooting and advanced features.

---

## ⚠️ Color Palette Feature Status & Development Guidance

### Current Status
The color palette feature is **partially working** as of the latest updates:

**What Works:**
- ✅ Color palettes are defined in the codebase (8 palettes: Tech Blue, Ocean Blue, Forest Green, Crimson Red, Sunset Orange, Royal Purple, Slate Gray, Cyber Pink)
- ✅ Color picker UI is rendered in character/world forms
- ✅ Color selection is saved to the database when creating/editing items
- ✅ Color palettes are applied to storyboard cards (left border accent)
- ✅ Color palettes are applied to character side panels in chat interface
- ✅ Form preview shows color accents on textareas and UI elements

**What Still Needs Work:**
- ❌ Color palettes are not applied to chat messages
- ❌ Color palettes are not shown in character/world list views
- ❌ Color palette selection doesn't appear in profile view screens
- ❌ Limited visual impact - only border accents are colored

### Recent Fixes Applied
1. **Database Storage**: Added `colorPalette` field to the form submission data object
2. **Form Initialization**: Properly initialize colorPalette when editing existing items
3. **Storyboard Cards**: Apply CSS variables and border accent based on selected palette
4. **Character Panels**: Apply color palette to chat interface side panels
5. **Form Preview**: Added CSS rules to show color accents in form editing mode

### Remaining Tasks
1. **Chat Messages**: Apply character color palettes to message bubbles
2. **List Views**: Show color accents in the contextual menu character/world lists
3. **Profile Screens**: Display selected color palette in read-only profile views
4. **Enhanced Visuals**: Consider adding gradient backgrounds or more prominent color usage

--- 