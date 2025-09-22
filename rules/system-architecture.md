# System Architecture

**RULE:** This document provides the high-level architectural blueprint for the JooduG-default repository. It explains how the major components fit together to form a cohesive development ecosystem.

**CORE PRINCIPLE:** This is a monorepo containing a self-sufficient, AI-assisted development environment. The structure is designed to support not just the applications, but the entire lifecycle of their creation, maintenance, and documentation.

-----

## 1\. High-Level Directory Structure Directives

**RULE:** The repository is organized into several distinct, high-level directories, each with a specific responsibility.

* `/apps`: The "product," containing the user-facing web applications.
* `/build`: The "factory," with all scripts and configurations needed to build and test.
* `/docs`: The "library," where all human-readable guides and changelogs live.
* `/memory-bank`: The AI's persistent "brain."
* `/rules`: The AI's "constitution," containing machine-readable rule sets.
* `/tests`: The "quality assurance department."
* `/tools`: The "toolbox," with utility scripts.

-----

## 2\. Perchance Application Architecture

**RULE:** All applications in the `/apps` directory are built for the **Perchance platform** and **MUST** adhere to its **Two-Panel Architecture**. This is the foundational architectural pattern of this repository.

This architecture consists of two parts:

* **The Left Panel:** The "backend" or logic layer, containing all Perchance-specific syntax, lists, and generative code. The source of truth for this is always a `*-left-panel.txt` file.
* **The Right Panel:** The "frontend" or interface, which contains the user-facing HTML, CSS, and JavaScript. It is generated into a single file by our build process.

**DIRECTIVE:** This separation of concerns is **absolute**. For a complete and exhaustive explanation, all agents **MUST** refer to the canonical guide before any development work:

➡️ **[`/rules/PERCHANCE-DEVELOPMENT-GUIDE.md`](/rules/PERCHANCE-DEVELOPMENT-GUIDE.md)** ⬅️

-----

## 3\. Development & Build Workflow Directives

**RULE:** The development workflow is designed to build the **Right Panel** of our Perchance applications from source files into a single HTML deliverable.

```mermaid
graph TD
    subgraph "Developer/AI (Source Files)"
        A["1. Edit code in /apps source files <br/>(e.g., .txt, .js, .scss, .html)"]
    end

    subgraph "Automation"
        B(2. `watch.js` detects file change)
        C["3. Triggers the relevant build script <br/>(e.g., `build-rpglitch.js`)"]
    end

    subgraph "Build Process (Creates Right Panel)"
        D["4. SCSS is compiled to a single CSS block"]
        E["5. JS files are concatenated into a single script block"]
        F["6. CSS & JS are injected into the main HTML template"]
    end

    subgraph "Verification"
        H["8. Run tests from /tests"]
        I["9. Linting is checked"]
    end

    G["7. Single HTML file is output to /build/output"]

    A --> B;
    B --> C;
    C --> D;
    C --> E;
    D & E --> F;
    F --> G;
    G --> H;
    H --> I;
```

**DIRECTIVE:** The `/rules` and `/memory-bank` directories **MUST** guide the AI agent's actions during the initial code editing phase (step 1).
