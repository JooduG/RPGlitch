# **System Architecture Protocol**

Version 2.0.0 · Updated 2025-09-26

**RULE:** This document provides the high-level architectural blueprint for the repository. It explains how the major components fit together to form a cohesive, AI-assisted development ecosystem.

**CORE PRINCIPLE:** This is a monorepo containing a self-sufficient development environment designed to be operated by an AI agent. The structure supports the entire lifecycle of the applications within it, from creation to documentation and maintenance, all governed by the master protocol.

➡️ **Master Protocol: [AGENTS.md](https://www.google.com/search?q=../AGENTS.md)** ⬅️

## **1\. High-Level Directory Structure**

**RULE:** The repository is organized into distinct, high-level directories, each with a specific responsibility. The AI agent's permissions and interactions with these directories are defined in AGENTS.md.

* /apps: The "product," containing the user-facing web applications.  
* /build: The "factory," with all scripts and configurations needed to build and test.  
* /docs: The "library," where all human-readable guides and changelogs live.  
* /memory-bank: The AI's persistent "brain" and working memory.  
* /rules: The AI's "constitution," containing machine-readable rule sets.  
* /tests: The "quality assurance department."  
* /tools: The "toolbox," with utility scripts.

## **2\. Perchance Application Architecture**

**RULE:** All applications in the /apps directory are built for the **Perchance platform** and **MUST** adhere to its **Two-Panel Architecture**. This is the foundational architectural pattern of this repository.

* **The Left Panel:** The "engine" or logic layer, containing Perchance-specific syntax. Source: \*-left-panel.txt.  
* **The Right Panel:** The "face" or UI layer, which is compiled into a single HTML file. Source: /apps/\[appName\]/html, /js, /scss.

**DIRECTIVE:** This separation of concerns is **absolute**. For a complete explanation, all agents **MUST** refer to the canonical guide:

➡️ [**/rules/perchance-development-guide.md**](https://www.google.com/search?q=./perchance-development-guide.md) ⬅️

## **3\. Development & Build Workflow**

**RULE:** The development workflow builds the **Right Panel** of our Perchance applications from source files into a single HTML deliverable.

graph TD  
    subgraph "Developer/AI (Source Files)"  
        A\["1. Edit code in /apps source files \<br/\>(guided by AGENTS.md)"\]  
    end

    subgraph "Automation"  
        B(2. \`watch.js\` detects file change)  
        C\["3. Triggers the relevant build script \<br/\>(e.g., \`build-rpglitch.js\`)"\]  
    end

    subgraph "Build Process (Creates Right Panel)"  
        D\["4. SCSS is compiled to a single CSS block"\]  
        E\["5. JS files are concatenated into a single script block"\]  
        F\["6. CSS & JS are injected into the main HTML template"\]  
    end

    subgraph "Verification"  
        H\["8. Run tests from /tests"\]  
        I\["9. Linting is checked"\]  
    end

    G\["7. Single HTML file is output to /build/output"\]

    A \--\> B;  
    B \--\> C;  
    C \--\> D;  
    C \--\> E;  
    D & E \--\> F;  
    F \--\> G;  
    G \--\> H;  
    H \--\> I;

**DIRECTIVE:** The AI agent's actions during the code editing phase (Step 1\) are governed at all times by the procedures and protocols defined in **AGENTS.md**.
