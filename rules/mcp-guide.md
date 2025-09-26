# **MCP Agent Operational Guide**

Version 2.0.0 · Updated 2025-09-26

This guide outlines the rules, protocols, and best practices for using the Model Context Protocol (MCP) and its associated tools. Adherence to these guidelines is mandatory for ensuring stable, predictable, and efficient operation.

## **1\. Core Principles**

* **Protocol First:** Always follow the 7-step Pre-Task Protocol before beginning any task.  
* **Truth in Configuration:** build/config/mcp.master.json is the single source of truth for all MCP server configurations. Do not rely on other sources.  
* **Memory is Structured:** Interact with the /memory-bank/ directories according to the strict workflow defined in this guide.  
* **Time is Standardized:** All timestamps must be in UTC and formatted as YYYY-MM-DDTHH:mm:ssZ.

## **2\. Configuration and Setup**

### **MCP Server Configuration**

* **Master File:** All MCP server definitions reside in build/config/mcp.master.json.  
* **Adding a Server:** To add a new server, you must:  
  1. Edit the mcp.master.json file.  
  2. Run the npm run sync:mcp script to propagate the changes to all necessary configuration files.  
  3. Commit the changes to version control.  
* **CI Validation:** The npm run check:mcp command is used in the CI/CD pipeline to verify that all configurations are in sync and have not "drifted."

### **Environment Variables**

The following environment variables must be set in a .env file for certain MCP tools to function correctly.

* SMITHERY\_API\_KEY: Required for all Smithery-based tools (Toolbox, ScientificMethodServer, etc.).  
* SMITHERY\_PROFILE: Specifies the Smithery profile to use.

## **3\. Pre-Task Protocol**

Before starting any task, execute the following 7 steps to ensure full context and alignment with project rules.

flowchart TD  
    A\[1. Understand Goal\] \--\> B\[2. Review Rules\];  
    B \--\> C\[3. Scan \`memory-bank\`\];  
    C \--\> D\[4. Analyze Source Files\];  
    D \--\> E\[5. Review Build & Test Scripts\];  
    E \--\> F\[6. Formulate Plan\];  
    F \--\> G\[7. Final Sanity Check\];  
    G \--\> H((Begin Task));

* 1\. Understand the Core Goal: Read the prompt and relevant files from /memory-bank/future/. Rephrase the goal to confirm understanding.  
* 2\. Review Relevant Rules: Based on the goal, read all applicable rule files from the /rules/ directory.  
* 3\. Scan the Memory Bank: Read all files in /memory-bank/present/ and /memory-bank/forever/. Search /memory-bank/past/ for historical context.  
* 4\. Analyze Source Code: Read the specific files and directories related to the task. Do not assume prior knowledge.  
* 5\. Review Build & Test Scripts: Check package.json and /build/scripts/ to understand the build process. Review /tests/ to understand expected behavior.  
* 6\. Formulate a Step-by-Step Plan: Create a detailed, numbered list of actions.  
* 7\. Final Sanity Check: Review the plan against the goal and rules. Revise if any conflicts exist.

## **4\. MCP Tool Directory & Usage Protocols**

This section serves as the canonical directory for all configured MCP servers and their specific operational rules.

### **Time (time)**

Provides tools to get the current time and date. All timestamps in filenames, logs, and metadata must strictly adhere to the ISO 8601 UTC format (YYYY-MM-DDTHH:mm:ssZ) to ensure universal consistency.

* convert\_time: Convert time between timezones.  
* get\_current\_time: Get current time in a specific timezone.

### **Toolbox (toolbox)**

Provides a collection of general-purpose developer tools. No tools currently available.

### **Pollinations (pollinations)**

Provides AI image generation through Pollinations services. 🎨

**Interaction Persona:** When using pollinations tools, you **MUST** adopt a vibey, Gen-Z persona. Use emojis, creative markdown, and slang (fr, ngl, no cap). Keep it short, sweet, and aesthetic\! ✨

**Tools:**

* checkAuthStatus: Check the status of an authentication session.  
* generateImage: Generate an image and return the base64-encoded data.  
* generateImageUrl: Generate an image URL from a text prompt.  
* generateText: Generate text from a prompt using the Pollinations Text API.  
* getDomains: Get allowlisted domains for a user.  
* listAudioVoices: List available audio voices.  
* listImageModels: List available image models.  
* listTextModels: List available text models.  
* respondAudio: Generate an audio response to a text prompt.  
* sayText: Generate speech that says the provided text verbatim.  
* startAuth: Start GitHub OAuth authentication flow. Display the link prominently.  
* updateDomains: Update allowlisted domains for a user.

### **Sequential Thinking Tools (mcp-sequentialthinking-tools)**

Provides advanced sequential thinking tools with persistent state and tool coordination.

* sequentialthinking\_tools: A detailed tool for dynamic and reflective problem-solving. Use this for breaking down complex problems, planning with revisions, and when you need guidance on which other tools to use and in what order.

### **Waldzell Metagames (waldzell-metagames)**

Provides game-theoretic workflows for development. No tools currently available.

### **Waldzell Clear Thought (waldzell-clear-thought)**

Provides a suite of sequential and structured thinking tools from Waldzell.

**Tools:**

* collaborativereasoning: Simulate expert collaboration with diverse perspectives.  
* debuggingapproach: Apply systematic debugging methods (e.g., Binary Search, Divide and Conquer).  
* decisionframework: Structured decision analysis and rational choice.  
* mentalmodel: Apply structured mental models (e.g., First Principles, Occam's Razor).  
* metacognitivemonitoring: Systematically monitor your own knowledge and reasoning quality.  
* scientificmethod: Apply formal scientific reasoning and structured hypothesis testing.  
* sequentialthinking: A flexible, step-by-step thinking process that can adapt and evolve.  
* structuredargumentation: Systematic dialectical reasoning and argument analysis.  
* visualreasoning: Create, manipulate, and interpret diagrams and graphs.

### **Waldzell Stochastic Thinking (waldzell-stochastic-thinking)**

Provides stochastic thinking utilities for handling uncertainty.

* stochasticalgorithm: Apply stochastic algorithms (e.g., Markov Decision Processes, Monte Carlo Tree Search) to decision-making problems.

### **DeepWiki (deepwiki)**

DeepWiki MCP over SSE for knowledge lookup in GitHub repositories.

**Tools:**

* ask\_question: Ask any question about a GitHub repository.  
* read\_wiki\_contents: View documentation about a GitHub repository.  
* read\_wiki\_structure: Get a list of documentation topics for a repository.

### **Context7 (context7)**

Always resolve a library name to a specific ID before fetching documentation to ensure accuracy.

**Workflow:**

1. **Resolve:** Use resolve\_library\_id with the user's query.  
2. **Confirm:** Select the correct context7CompatibleLibraryID.  
3. **Fetch:** Use get\_library\_docs with the exact ID.

### **Playwright (playwright)**

Lets the AI control a web browser for scraping and automation. Always capture the state of the page before acting. The web is dynamic; assumptions are dangerous. 🌐

**Workflow:**

1. **Navigate:** Use browser\_navigate.  
2. **Snapshot:** Use browser\_snapshot to get a complete accessibility snapshot of the page.  
3. **Analyze & Plan:** Analyze the snapshot to find the correct elements for your next action.  
4. **Act:** Use tools like browser\_click or browser\_type.  
5. **Repeat:** Go back to step 2 for the next interaction.

**Tools:** Includes browser\_click, browser\_close, browser\_navigate, browser\_snapshot, browser\_type, and 16 others.

### **NPM Sentinel (npm-sentinel)**

An MCP server for analyzing NPM packages.

**Tools:**

* npmSearch: Search for NPM packages.  
* npmCompare: Compare multiple packages.  
* npmVulnerabilities: Check for known vulnerabilities.  
* npmDeps: Analyze dependencies.  
* ...and 15 other package analysis tools.

## **5\. Troubleshooting**

* **Configuration Drift Error:** If you see errors about configuration drift, run npm run sync:mcp and restart the client.  
* **Missing API Key:** If a tool fails due to a missing key, ensure it is set correctly in your .env file and restart.

## **Changelog**

* **2.0.0 (2025-09-26)** — Major overhaul of Section 4\. Replaced the previous list of tools with a comprehensive directory based on the latest MCP server status. Integrated specific usage principles and workflows directly into each tool's entry for a unified, single source of truth.  
* **1.0.0 (Initial Version)** — Initial creation of the MCP guide.
