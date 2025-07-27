@ -0,0 +1,85 @@

# Gemini CLI Operational Protocol

This is your foundational bootstrap protocol. You MUST follow these steps at the beginning of every session to align with the project's operational context.

## 1. Bootstrap Sequence

1. **Acknowledge Protocol:** Silently acknowledge that this protocol is active and you are beginning the bootstrap sequence.

2. **Load Core Context:** Read the following files and directories to load the project's foundational principles, workflows, and tool configurations:
    * `@.cursor/rules/` (Agent rules)
    * `@memory-bank/` (Project information and state, contains `project/` and `rpglitch/` subdirectories)
    * `mcp.json` (MCP server and tool configuration)

3. **Confirm and Operate:** After successfully loading all context, confirm your readiness by stating: **"I have loaded the project's rules, memory banks, and MCP configuration. I will now operate in accordance with this context."** You will then be ready to accept user commands.

## 2. Rule Application Strategy

When operating, you will apply the loaded rules according to the following hierarchy and logic. The file prefixes indicate the category and context for application.

### Content & Rule Hierarchy

1. **Project Memory (`@memory-bank/`):** Contains the project's state, plans, and informational context. This is not a set of rules, but the foundational knowledge base that informs the agent.
2. **Agent Rules (`@.cursor/rules/`):** These are the explicit rules and guidelines that direct the agent's behavior and decision-making, applied based on the categories below.

### Application Logic for `.cursor/rules/`

The rules within `@.cursor/rules/` are categorized and applied as follows:

* **Core System (`system-`, `mcp-`, `memory-bank-`):** Foundational rules for the agent's operating system and core protocols.
  * `system-context-aware-rule-loading.mdc`
  * `system-documentation.mdc`
  * `system-effective-rule-writing.mdc`
  * `mcp-integration.mdc`
  * `mcp-context7.mdc`
  * `mcp-comprehensive-guide.mdc`
  * `mcp-sequential-thinking.mdc`
  * `mcp-time.mdc`
  * `memory-bank-integration.mdc`
  * `memory-bank-optimization.mdc`

* **Operational Modes (`mode-`):** Activated to switch the agent's behavior for specific, high-level tasks.
  * `mode-complexity-routing.mdc`
  * `mode-orchestrator.mdc`
  * `mode-system-enhanced.mdc`
  * `mode-system.mdc`

* **Agent Roles (`role-`):** Defines different personas or specializations for the agent to adopt.
  * `role-1-operator.mdc`
  * `role-2-tactician.mdc`
  * `role-3-strategist.mdc`
  * `role-assistant.mdc`
  * `role-project-manager.mdc`

* **Thinking Frameworks (`thinking-`):** High-level guides on how to process information and approach tasks.
  * `thinking-framework.mdc`
  * `thinking-contemplative.mdc`

* **Project-Specific (`perchance-`):** Applied only when working on the Perchance-based RPGlitch application.
  * `perchance-architecture.mdc`
  * `perchance-build-deployment.mdc`
  * `perchance-development-workflow.mdc`
  * `perchance-plugin-system.mdc`

* **Technology-Specific (`js-`, `html-`, `scss-`):** Applied only when working directly with the specified technology.
  * `html-development.mdc`
  * `html-hyperscript-usage.mdc`
  * `js-development.mdc`
  * `js-cash-dom-usage.mdc`
  * `js-dexie-usage.mdc`
  * `js-indexeddb-principles.mdc`
  * `scss-development.mdc`
  * `scss-advanced-patterns.mdc`
  * `scss-debugging.mdc`
  * `scss-pico-usage.mdc`

## 3. MCP Server Configuration (`mcp.json`)

The `mcp.json` file in the project root defines available Model Context Protocol (MCP) servers.

* **On Startup:** I will check this file to identify available tools and their startup configurations.
* **Server Management:** For tools that are not URL-based, I will check if they can be started automatically. If not, and I need to use one, I will inform the user and ask them to start the required server. I can also assist in modifying `mcp.json` to enable auto-starting for servers that support it.

## Rationale

This protocol ensures that you, the Gemini CLI agent, operate not on general knowledge, but on the specific, documented conventions, standards, and state of this project. This makes you a project-aware expert, consistent with the behavior of the in-editor Cursor experience, while optimizing for token efficiency by applying rules contextually.
