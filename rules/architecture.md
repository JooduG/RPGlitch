# **🏛️ System Architecture Protocol**

Version 2.0.0 · Updated 2025-09-26

**RULE:** This document provides the high-level architectural blueprint for this repository. It explains how the major components fit together to form a cohesive, AI-assisted development ecosystem.

**CORE PRINCIPLE:** This is a monorepo containing a self-sufficient development environment. The structure is designed to support not just the applications, but the entire lifecycle of their creation, maintenance, and documentation.

## **1\. Key Architectural Principles**

* **Separation of Concerns**: Each top-level directory has a clear and distinct purpose. This keeps the repository organized and easy to understand.  
* **Single Source of Truth (SSOT)**: Whenever possible, there is a single, canonical source for any given piece of information. All build scripts are in /build, all documentation is in /docs, and all agent rules are in /rules.  
* **Agent-Human Collaboration**: The repository is designed for both human developers and AI agents. Directories like /memory-bank and /rules are primarily for the agent's operational use, but are structured for human review and modification to guide the agent's behavior.

## **2\. High-Level Directory Structure**

**RULE:** The repository is organized into several distinct, high-level directories, each with a specific responsibility.

* **/apps**: The "Stage." Contains the primary, user-facing Perchance web applications.  
* **/build**: The "Factory." Contains all scripts, configurations, and libraries needed to build and test the applications.  
* **/docs**: The "Human's Library." Contains all human-readable guides, glossaries, and high-level documentation.  
* **/memory-bank**: The "AI's Diary." The agent's dedicated space for managing its persistent memory, tracking tasks, and storing knowledge.  
* **/rules**: The "AI's Rulebook." The machine-readable protocols that govern the agent's behavior and decision-making.  
* **/src**: The "Shared DNA." Contains core source code, shared modules, and reusable components.  
* **/tests**: The "Quality Assurance Dept." Contains all automated tests for the applications and system components.  
* **/tools**: The "Utility Belt." A toolbox of utility and diagnostic scripts for various maintenance tasks.

## **3\. Perchance Application Architecture**

**RULE:** All applications in the /apps directory are built for the **Perchance platform** and **MUST** adhere to its **Two-Panel Architecture**. This is the foundational architectural pattern of this repository.

This architecture consists of two parts:

* **The Left Panel:** The "Engine Room" or logic layer, containing all Perchance-specific syntax, lists, and generative code. The source of truth for this is always a \*-left-panel.txt file.  
* **The Right Panel:** The "Stage" or interface, which contains the user-facing HTML, CSS, and JavaScript. It is generated into a single file by our build process.

**DIRECTIVE:** This separation of concerns is **absolute**. For a complete and exhaustive explanation, all agents **MUST** refer to the canonical guide before any development work:

➡️ [**/rules/perchance-development-guide.md**](https://www.google.com/search?q=./perchance-development-guide.md) ⬅️

## **Changelog**

* **2.0.0 (2025-09-26)** — Integrated the "Key Architectural Principles" (Separation of Concerns, SSOT, Agent-Human Collaboration) and refined directory descriptions from the now-deprecated system-organization.md file. This creates a single, more comprehensive architectural document.  
* **1.0.0 (Initial Version)** — Initial creation of the architecture guide.
