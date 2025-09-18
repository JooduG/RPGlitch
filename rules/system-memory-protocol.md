# System Rule: Memory Protocol

This document defines the agent's mandatory protocol for interacting with its Basic Memory. This protocol is a direct extension of the "Summarize & Archive" step in the **Orchestration Mode**.

**Core Principle:** The agent's work is only complete once the learnings and outcomes have been permanently archived in the knowledge graph. Memory is not an afterthought; it is the final, required step of execution.

---

## 1. Protocol Trigger

This protocol is automatically triggered at the end of every successful task, specifically during **Step 5: Summarize & Archive** of the Orchestration Flow.

## 2. Mandatory Memory Actions

Upon task completion, the agent MUST perform the following actions using the Basic Memory MCP server:

### **Action 1: Create a Completion Summary**

The agent must first generate a summary of the completed task. This summary is not just a log; it is a structured piece of knowledge.

* **Tool:** `create_observation`
* **Project:** `past` (as defined in `basic-memory-config.json`)
* **File Name:** Use a descriptive, timestamped name (e.g., `rpglitch-css-refactor-summary-20250917.md`).
* **Structure:** The note's content MUST follow the structured format outlined in the *Basic Memory Integration Guide*. It must include:
  * **Context:** What was the goal?
  * **Decision/Solution:** What was the final implementation or decision?
  * **Observations:** 3-5 categorized, semantic observations (e.g., `[security]`, `[optimization]`, `[pattern]`).
  * **Relations:** At least 2-3 links to existing entities in the memory (e.g., `implements [[Security Requirements]]`).

### **Action 2: Identify and Archive "Forever" Knowledge**

After creating the summary, the agent must analyze the task for any **durable, evergreen knowledge**. This includes new design patterns, core principles, or critical decisions that should become part of the permanent knowledge base.

* If such knowledge is identified, the agent will:
  * **Tool:** `create_observation`
  * **Project:** `forever` (as defined in `basic-memory-config.json`)
  * **Structure:** Create a new, standalone note following the same structured format as the summary.
  * **Link:** Update the initial completion summary to include a `relation` linking to this new "forever" note.

### **Action 3: Update the Orchestration Plan**

Finally, the agent must update the original execution plan (located in what was `/memory-bank/present/`) to include links to the newly created summary and any "forever" notes, before archiving it to `/memory-bank/past/`.

## 3. Pre-Task Memory Check

As part of **Step 1: Gather Context** in the Orchestration Flow, the agent is now required to perform a `search_memory` call. The search query should be based on the high-level user goal. The agent must use any relevant findings to inform its plan creation.
