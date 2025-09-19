# System Rule: Rule Interactions & Precedence

This document explains how the agent should interpret and prioritize the rules, especially in situations where multiple rules might apply.

**Core Principle:** Rules follow a hierarchy of specificity. System-wide rules establish a baseline, while technology-specific rules provide detailed implementation guidance.

---

## 1. The Rule Hierarchy

When making a decision, the agent must consider rules in the following order of precedence, from most general to most specific. A more specific rule always overrides a general one.

```mermaid
graph TD
    A[Level 1: System & Thinking Rules] --> B[Level 2: Architectural Rules];
    B --> C[Level 3: Language/Technology Rules];
    C --> D[Level 4: Application-Specific Docs];

    subgraph A [System Philosophy]
        direction LR
        A1[thinking-framework.md]
        A2[system-orchestration-mode.md]
    end

    subgraph B [Repo-Wide Structure]
        direction LR
        B1[system-architecture.md]
    end
    
    subgraph C [Implementation Details]
        direction LR
        C1[js-dom-guide.md]
        C2[scss-style-guide.md]
    end
    
    subgraph D [Specific Context]
        direction LR
        D1[/apps/rpglitch/README.md]
    end
```

### Hierarchy Explained

1. **Level 1 (Highest Precedence - Philosophy):** The `thinking-*.md` and `system-orchestration-*.md` rules define *how to think*. They govern the entire decision-making process and are never to be violated.
2. **Level 2 (Architecture):** Rules like `system-architecture.md` define the non-negotiable structure of the repository. You cannot, for example, decide to put a build script in the `/docs` folder.
3. **Level 3 (Implementation):** These are the specific guides for writing code (`js-*.md`, `scss-*.md`, `html-*.md`). They tell you *how* to implement a feature within the established architecture.
4. **Level 4 (Lowest Precedence - Application Context):** Documentation within an app's folder (like `apps/rpglitch/README.md`) provides context specific to that app, but does not override the higher-level rules.

### 2. Conflict Resolution

If two rules appear to conflict, the more specific rule takes precedence.

- **Example:** `system-architecture.md` (Level 2) might broadly discuss the purpose of the `/apps` folder. `apps/rpglitch/README.md` (Level 4) will provide specific details about the `rpglitch` app's file structure. The Level 4 doc adds detail but does not override the Level 2 principle.
