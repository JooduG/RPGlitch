---
trigger: always_on
description: The Operational Loop. Triggers, Workflows, and Communication Protocols.
---

# ⚡ Workflow (The Operational Loop)

## 1. The Meridian Workflow

All development follows this atomic progression:

1. **[Project]** defines the Task (task.md).
2. **[Svelte]** builds the Logic (Runes/Components).
3. **[Scss/Motion/Audio]** apply the Polish (Styles/Physics/Sound).
4. **[Data]** saves the State (Persistence/IndexedDB).
5. **[Quality Assurance]** audits for Compliance (Security/Tests).

## 2. Definition of Done (The Gold Standard)

> **Directive:** A task is not finished when the code is written; it is finished when reality matches the spec with auditable proof.

### ✅ Implementation Standards

- [ ] Code is implemented strictly to the `spec.md` / `task.md`.
- [ ] Logic follows the **Five Pillars** (Pure IO where possible).
- [ ] Svelte components use **Runes** exclusively (`$state`, `$derived`, `$props`).
- [ ] Styling adheres to [The Chalk Regime](../skills/scss/docs/reference.md).

### 🛡️ Integrity & Quality Gates

- [ ] **Test Coverage**: Unit tests exist and pass for all new logic.
- [ ] **Security**: All input/HTML is sanitized via Warden.
- [ ] **Hygiene**: No `console.log`, `FIXME`, or dead comments remain.
- [ ] **Accessibility**: Unique IDs and ARIA labels.

### 📝 Auditability

- [ ] Git commit messages follow `gamemaster(type): description`.
- [ ] Changes are verified in the `walkthrough.md`.

## 3. The Clarity Gate (A-C-Q)

**BEFORE** executing any task, assess Ambiguity (A-Score):

| Score  | Meaning   | Action              |
| :----- | :-------- | :------------------ |
| **A1** | Clear     | **Execute**         |
| **A2** | Inferred  | **Execute**         |
| **A3** | Ambiguous | **Propose & Wait**  |
| **A4** | Critical  | **Present Options** |
| **A5** | Hazard    | **REFUSE**          |

## 4. Skill Discovery (The Matrix)

**Trigger Map:** "IF user asks for X, LOAD Skill Y."

| Intent                 | Skill     | Trigger Phrase                        |
| :--------------------- | :-------- | :------------------------------------ |
| **New Feature / Plan** | `project` | "Plan feature", "Update tracks"       |
| **UI Component**       | `svelte`  | "Scaffold component", "Refactor rune" |
| **Styling / Theme**    | `scss`    | "Style this", "Make it pop"           |
| **Data / State**       | `data`    | "Save logic", "Schema change"         |
| **Verification**       | `warden`  | "Run tests", "Audit security"         |
| **Docs / Rules**       | `scribe`  | "New skill", "Refactor docs"          |
| **Audio / SFX**        | `audio`   | "Add sound", "Speech synthesis"       |
| **Motion / Physics**   | `motion`  | "Add tilt", "Fix animation"           |
| **DevOps / Build**     | `devops`  | "Build for prod", "Sync config"       |

## 5. The Triad Protocol (Context Resolution)

**Crucial:** You are operating within the **Triad** architecture. Your context is unified under the `.agent/` root.

### 🚀 Initialization (Context Validation)

Before any operation, all agents **MUST** validate their environment:

1. Read Config: Load `.agent/config.yaml`.
2. Validate Tooling: Load `.agent/tooling.json`.

### ⚡ Dynamic Context Hooks

Before starting any task, you **MUST** read the following to ground yourself:

1. `.agent/config.yaml` (Project-wide settings)
2. `.agent/product.md` (What are we building?)
3. `.agent/tasks/tracks.md` (What are we doing right now?)

## 6. Protocol Triggers (Slash Commands)

Use these commands to trigger formalized protocols:

| Command            | Protocol        | Description                                              |
| :----------------- | :-------------- | :------------------------------------------------------- |
| **/01-setup**      | **Startup**     | Initializes the environment, validates context/security. |
| **/02-track**      | **Track**       | Scaffolds a new work track (Plan/Task artifacts).        |
| **/03-implement**  | **Implement**   | Executes the implementation plan for a defined track.    |
| **/04-status**     | **Status**      | Reports the status of active tracks and project health.  |
| **/05-checkpoint** | **Checkpoint**  | Anchors the current phase of work into history.          |
| **/06-review**     | **Apex Review** | High-level audit for completed tracks or major features. |
| **/07-revert**     | **Revert**      | Structured approach to abandoning failed paths.          |
| **/08-clean**      | **Clean Room**  | Sterilizes codebase, ensures hygiene/linting/integrity.  |
| **/09-nope**       | **Nope**        | Triggered on hallucination/failure. Shame Management.    |

## 7. The Scribe Rule (Retrieval-led Reasoning)

> **Mandate:** Prefer retrieval-led reasoning over pre-training-led reasoning.

1. **GROUNDING:** Always check for doc indexes in `.agent/` before starting work.
2. **VERIFICATION:** If an API pattern is unknown, state "I will verify the spec" and read local docs.
3. **PRECISION:** Never guess a signature. Always verify against the latest project-provided ground truth.

## 8. The Enforced Context & Response Protocol

**MANDATORY:** Every response to the User must end with:

```text
---
📜 Rules: [manifesto, standards, stack, security, workflow]
🧠 Skills: [Active Skills]
📚 Knowledge: [Reference KIs]
🤖 Tools: [Tool Used]
---
```

**Predicted Skills:** Start every response with `**🔮 Predicted Skills:** [list]`.
