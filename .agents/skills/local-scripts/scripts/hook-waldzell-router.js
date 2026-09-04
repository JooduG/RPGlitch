/**
 * -------------------------------------------------------------------------------------------------
 * Antigravity Lifecycle Hook: Waldzell Clear Thought MCP Router & Sequential Tools Enricher
 * -------------------------------------------------------------------------------------------------
 * 1. Intercepts call_mcp_tool calls targeting `waldzell-clear-thought` with specialized operations
 *    (collaborative_reasoning, decision_framework, sequential_thinking, etc.) and transparently
 *    rewrites them to their dedicated MCP servers.
 * 2. Automatically enriches `sequentialthinking_tools` calls with `available_tools` if omitted
 *    by the model, enabling server-side tool recommendation validation (Approach C).
 * Receives JSON on stdin and writes decision JSON to stdout.
 * -------------------------------------------------------------------------------------------------
 */

import fs from "fs";

/**
 * Standard tool names registered in this Antigravity workspace.
 */
const DEFAULT_WORKSPACE_TOOLS = Object.freeze([
  // Core native tools
  "run_command",
  "view_file",
  "replace_file_content",
  "multi_replace_file_content",
  "write_to_file",
  "grep_search",
  "list_dir",
  "call_mcp_tool",
  "browser_subagent",
  "generate_image",
  "read_url_content",

  // Specific MCP Servers & Tools
  "mcp:svelte:svelte-autofixer",
  "mcp:developer-database:read_knowledge_base",
  "mcp:developer-database:write_knowledge_base",
  "mcp:deepwiki:read_wiki_contents",
  "mcp:deepwiki:read_wiki_structure",
  "mcp:chrome-devtools:navigate_page",
  "mcp:chrome-devtools:click",
  "mcp:chrome-devtools:type_text",
  "mcp:chrome-devtools:take_screenshot",
  "mcp:firecrawl-mcp:firecrawl_scrape",
  "mcp:firecrawl-mcp:firecrawl_search",
  "mcp:context7:query-docs",
  "mcp:github-copilot:get_file_contents",

  // Waldzell Reasoning MCP Servers & Tools
  "mcp:waldzell-collaborative-reasoning:collaborativeReasoning",
  "mcp:waldzell-decision-framework:decisionFramework",
  "mcp:waldzell-metacognitive-monitoring:metacognitiveMonitoring",
  "mcp:waldzell-scientific-method:scientificMethod",
  "mcp:waldzell-stochastic-thinking:stochasticalgorithm",
  "mcp:waldzell-structured-argumentation:structuredArgumentation",
  "mcp:waldzell-visual-reasoning:visualReasoning",
  "mcp:waldzell-clear-thought:clear_thought",
]);

/**
 * Mapping of clear_thought operation names to specialized Waldzell MCP servers and tools.
 */
const WALDZELL_TOOL_ROUTING = Object.freeze({
  collaborative_reasoning: {
    ServerName: "waldzell-collaborative-reasoning",
    ToolName: "collaborativeReasoning",
  },
  decision_framework: {
    ServerName: "waldzell-decision-framework",
    ToolName: "decisionFramework",
  },
  metacognitive_monitoring: {
    ServerName: "waldzell-metacognitive-monitoring",
    ToolName: "metacognitiveMonitoring",
  },
  scientific_method: {
    ServerName: "waldzell-scientific-method",
    ToolName: "scientificMethod",
  },
  stochastic_thinking: {
    ServerName: "waldzell-stochastic-thinking",
    ToolName: "stochasticalgorithm",
  },
  sequential_thinking: {
    ServerName: "mcp-sequentialthinking-tools",
    ToolName: "sequentialthinking_tools",
  },
  structured_argumentation: {
    ServerName: "waldzell-structured-argumentation",
    ToolName: "structuredArgumentation",
  },
  visual_reasoning: {
    ServerName: "waldzell-visual-reasoning",
    ToolName: "visualReasoning",
  },
});

/**
 * Reads JSON payload from stdin synchronously.
 *
 * @returns {object} Parsed stdin payload.
 */
function read_stdin_payload() {
  try {
    const raw_input = fs.readFileSync(0, "utf-8");
    if (!raw_input || !raw_input.trim()) return {};
    return JSON.parse(raw_input);
  } catch {
    return {};
  }
}

/**
 * Main hook execution.
 */
function run() {
  const payload = read_stdin_payload();
  const tool_call = payload?.toolCall || {};
  const tool_name = tool_call.name || "";
  const tool_args = tool_call.args || {};

  if (tool_name === "call_mcp_tool") {
    let server_name = tool_args.ServerName || "";
    let target_tool = tool_args.ToolName || "";
    let inner_args = tool_args.Arguments || {};

    // 1. Check for waldzell-clear-thought routing
    const operation = inner_args.operation || "";
    if (server_name === "waldzell-clear-thought" && WALDZELL_TOOL_ROUTING[operation]) {
      const target = WALDZELL_TOOL_ROUTING[operation];
      server_name = target.ServerName;
      target_tool = target.ToolName;
      inner_args = inner_args.parameters || {};
    }

    // 2. Approach C: Enrich sequentialthinking_tools with available_tools if missing
    if (server_name === "mcp-sequentialthinking-tools" && target_tool === "sequentialthinking_tools") {
      if (!inner_args.available_tools || inner_args.available_tools.length === 0) {
        inner_args = {
          ...inner_args,
          available_tools: [...DEFAULT_WORKSPACE_TOOLS],
        };
      }
    }

    // If server, tool, or arguments were modified/enriched, overwrite tool call
    if (server_name !== tool_args.ServerName || target_tool !== tool_args.ToolName || inner_args !== tool_args.Arguments) {
      const response = {
        decision: "allow",
        overwrite: {
          ServerName: server_name,
          ToolName: target_tool,
          Arguments: inner_args,
        },
      };
      process.stdout.write(JSON.stringify(response) + "\n");
      return;
    }
  }

  // Allow through unchanged
  process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
}

run();

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-09-04: Added Approach C auto-enrichment of available_tools for sequentialthinking_tools.
 * 2026-09-04: Added sequential_thinking mapping to mcp-sequentialthinking-tools.
 * 2026-09-04: Initial creation of Waldzell MCP server router hook for RPGlitch.
 */
