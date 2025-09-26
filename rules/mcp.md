# **📖 MCP Agent Operational Guide**

Version 2.1.0 · Updated 2025-09-26

This guide outlines the rules, protocols, and best practices for using the Model Context Protocol (MCP) and its associated tools. Adherence to these guidelines is mandatory for ensuring stable, predictable, and efficient operation.

## **1\. Core Principles**

* **Protocol First:** Always follow the 7-step Pre-Task Protocol before beginning any task.  
* **Truth in Configuration:** build/config/mcp.master.json is the single source of truth for all MCP server configurations.  
* **Time is Standardized:** All timestamps **MUST** be fetched from the time MCP to ensure consistency.

## **2\. Configuration and Setup**

### **MCP Server Configuration**

* **Master File:** All MCP server definitions reside in build/config/mcp.master.json.  
* **Adding a Server:** Edit the master file, then run npm run sync:mcp to propagate changes.  
* **CI Validation:** The npm run check:mcp command verifies that all configurations are in sync.

## **3\. Pre-Task Protocol**

Before starting any task, execute the following 7 steps:

1. **Understand the Core Goal**  
2. **Review Relevant Rules** (per system-rule-interactions.md)  
3. **Scan the Memory Bank** (/present, /forever, /past)  
4. **Analyze Source Code**  
5. **Review Build & Test Scripts**  
6. **Formulate a Step-by-Step Plan**  
7. **Final Sanity Check**

## **4\. MCP Tool Directory & Usage Protocols**

This section is the canonical directory for all configured MCP servers and their operational rules.

### **Time (time)**

Provides tools to get the current time and date. All timestamps in filenames, logs, and metadata **MUST** strictly adhere to the ISO 8601 UTC format (YYYY-MM-DDTHH:mm:ssZ) to ensure universal consistency.

**CRITICAL RULE:** **NEVER** hardcode dates or times. Always use this MCP tool. The default timezone for this project is **Europe/Berlin**.

#### **Implementation Workflow**

1. **Get Current Time:**  
   const currentTime \= await mcp\_time\_get\_current\_time({ timezone: 'Europe/Berlin' });  
   // { datetime: "2025-09-26T12:36:00+02:00", ... }

2. **Extract Components:**  
   const date \= currentTime.datetime.split('T')\[0\]; // "2025-09-26"  
   const datetime \= currentTime.datetime;  
   const timezone \= currentTime.timezone;

3. **Apply to Documentation:**  
   \*\*Date\*\*: ${date} (from Time MCP)  
   \*\*Generated\*\*: ${datetime} (from Time MCP)  
   \*\*Timezone\*\*: ${timezone}

#### **Tools:**

* convert\_time: Convert time between timezones.  
* get\_current\_time: Get current time in a specific timezone.

### **Toolbox (toolbox)**

Provides a collection of general-purpose developer tools. (No tools currently available).

### **Pollinations (pollinations)**

Provides AI image generation. 🎨 **Interaction Persona:** When using, adopt a vibey, Gen-Z persona. Use emojis, slang, and creative markdown. ✨

**Tools:** generateImageUrl, listImageModels, startAuth, etc. (12 total).

### **Sequential Thinking Tools (mcp-sequentialthinking-tools)**

Provides advanced sequential thinking with tool coordination.

* sequentialthinking\_tools: Use for breaking down complex problems, planning with revisions, and getting guidance on which other tools to use.

### **Waldzell Clear Thought (waldzell-clear-thought)**

A suite of structured thinking tools.

**Tools:** debuggingapproach, decisionframework, scientificmethod, sequentialthinking, etc. (9 total).

### **Playwright (playwright)**

Controls a web browser for scraping and automation. 🌐 **Workflow:** Navigate \-\> Snapshot \-\> Analyze \-\> Act \-\> Repeat.

**Tools:** browser\_navigate, browser\_snapshot, browser\_click, etc. (21 total).

### **NPM Sentinel (npm-sentinel)**

An MCP server for analyzing NPM packages.

**Tools:** npmSearch, npmCompare, npmVulnerabilities, etc. (19 total).

### **Other Servers**

* **waldzell-metagames**: Game-theoretic workflows. (No tools).  
* **waldzell-stochastic-thinking**: Stochastic utilities (stochasticalgorithm).  
* **deepwiki**: Knowledge lookup in GitHub repos (ask\_question, etc.).  
* **context7**: Library documentation fetching.

## **Changelog**

* **2.1.0 (2025-09-26)** — Integrated the comprehensive time-mcp-usage-example.md directly into the time tool section. This provides a rich, actionable workflow for all time-related operations, deprecating the standalone example file.  
* **2.0.0 (2025-09-26)** — Major overhaul of Section 4\. Replaced the previous list of tools with a comprehensive directory based on the latest MCP server status.  
* **1.0.0 (Initial Version)** — Initial creation of the MCP guide.
