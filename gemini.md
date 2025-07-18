# Gemini CLI Operational Protocol

This is your foundational bootstrap protocol. You MUST follow these steps at the beginning of every session to align with the project's operational context.

## 1. Bootstrap Sequence

1. **Acknowledge Protocol:** Silently acknowledge that this protocol is active and you are beginning the bootstrap sequence.

2. **Load Core Rules & Memory:** Read all files within the following directories to load the project's foundational principles, workflows, current state, and design system:
    *   `@.cursor/rules/`
    *   `@memory-bank/`
    *   `@cursor-memory-bank/`

3. **Confirm and Operate:** After successfully loading all rules and context, confirm your readiness by stating: **"I have loaded the project's rules and memory banks. I will now operate in accordance with this context."** You will then be ready to accept user commands.

## 2. Rule Application Strategy

When operating, you will apply the loaded rules according to the following hierarchy and logic:

### Rule Hierarchy

1. **Memory Bank System (`@cursor-memory-bank/`):** These are the highest-priority rules defining the core development workflow (VAN, PLAN, CREATIVE, etc.). They govern the overall process.
2. **Project-Specific Rules (`@.cursor/rules/`):** These are supplementary guides and principles that inform the work done *within* the Memory Bank workflow phases.

### Application Logic for `.cursor/rules/`

The rules within `@.cursor/rules/` are categorized and applied as follows:

*   **General / Always Apply:** These rules govern my core behavior and design philosophy and are always active.
    *   `icon-free-design-standard.mdc`
    *   `sequential-thinking-guide.mdc`
    *   `writing-effective-rules.mdc`

*   **Perchance Project-Specific:** These rules are applied only when working on the Perchance-based RPGlitch application.
    *   `perchance-architecture.mdc`
    *   `perchance-build-deployment.mdc`
    *   `perchance-development-workflow.mdc`
    *   `perchance-plugin-system.mdc`

*   **Technology-Specific:** These rules are applied *only* when working directly with the specified technology. For example, when editing a `.js` file, the JavaScript rules apply, but the CSS rules do not.
    *   `vanilla-javascript-development.mdc` (for `.js` files)
    *   `css-principles.mdc` (for `.css` or `.scss` files)
    *   `html-foundations.mdc` (for `.html` files)
    *   `indexeddb-principles.mdc` & `dexie-usage.mdc` (when dealing with IndexedDB)
    *   `cash-dom-usage.mdc` (when using cash-dom)
    *   `pico-css-usage.mdc` (when working with Pico.css components)

*   **Excluded / Do Not Apply:** The following rules are for testing purposes and **must never be applied**:
    *   `reddit-contemplative-thinking.mdc`
    *   `reddit-system-octo.mdc`
    *   `reddit-system-role.mdc`

## 3. MCP Server Configuration (`mcp.json`)

The `mcp.json` file in the project root defines available Model Context Protocol (MCP) servers.

*   **On Startup:** I will check this file to identify available tools and their startup configurations.
*   **Server Management:** For tools that are not URL-based, I will check if they can be started automatically. If not, and I need to use one, I will inform the user and ask them to start the required server. I can also assist in modifying `mcp.json` to enable auto-starting for servers that support it.

## Rationale

This protocol ensures that you, the Gemini CLI agent, operate not on general knowledge, but on the specific, documented conventions, standards, and state of this project. This makes you a project-aware expert, consistent with the behavior of the in-editor Cursor experience, while optimizing for token efficiency by applying rules contextually.
