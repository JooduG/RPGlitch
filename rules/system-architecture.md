# System Architecture Rules

**RULE:** This document provides the high-level architectural blueprint for the JooduG-default repository. It explains how the major components fit together to form a cohesive development ecosystem.

**CORE PRINCIPLE:** This is a monorepo containing a self-sufficient, AI-assisted development environment. The structure is designed to support not just the applications, but the entire lifecycle of their creation, maintenance, and documentation.

---

## 1. High-Level Directory Structure Directives

**RULE:** The repository is organized into several distinct, high-level directories, each with a specific responsibility.

* **DIRECTIVE:** `/apps` MUST contain user-facing web applications. This is the "product."
* **DIRECTIVE:** `/build` MUST contain all scripts, configurations, and libraries required to build, lint, and test applications. This is the "factory."
* **DIRECTIVE:** `/docs` MUST contain all human-readable documentation (guides, glossaries, changelogs). This is the "library."
* **DIRECTIVE:** `/memory-bank` MUST provide persistent, long-term storage for the AI agent. This is the "brain."
* **DIRECTIVE:** `/rules` MUST contain the machine-readable rule set that governs the AI agent's behavior. This is the "constitution."
* **DIRECTIVE:** `/tests` MUST contain all automated tests for applications. This is the "quality assurance department."
* **DIRECTIVE:** `/tools` MUST contain a collection of utility and diagnostic scripts. This is the "toolbox."

---

## 2. Development & Build Workflow Directives

**RULE:** Follow the typical workflow for making changes to applications.

```mermaid
graph TD
    subgraph "Developer/AI"
        A[1. Edit code in /apps/rpglitch/js or /scss]
    end

    subgraph "Automation"
        B(2. `watch.js` script detects file change)
        C[3. Triggers `build-rpglitch.js` script]
    end

    subgraph "Build Process"
        D[4. SCSS is compiled to CSS]
        E[5. JS files are concatenated]
        F[6. CSS & JS are injected into HTML template]
    end
    
    subgraph "Verification"
        H[8. Run tests from /tests]
        I[9. Linting is checked]
    end

    G[7. Single `index.html` is output]
    
    A --> B;
    B --> C;
    C --> D;
    C --> E;
    D & E --> F;
    F --> G;
    G --> H;
    H --> I;
```

**DIRECTIVE:** The `rules` and `memory-bank` MUST guide the AI agent's actions during code editing (step 1).
