---
trigger: always_on
description: The Standard Operating Procedure (Workflow).
---

# 🔄 03-workflow.md (The Protocol)

## 1. The Prime Directive: "Plan is Truth"

1.  **No Phantom Work:** If it's not in `task.md` or `plan.md`, it doesn't exist.
2.  **Update Loop:**
    - `[ ]` -> `[/]` (Start)
    - `[/]` -> `[x]` (Verify)
3.  **Deviation:** If reality diverges from plan, **UPDATE PLAN FIRST**.

## 2. The Clarity Gate (A-C-Q)

**BEFORE** executing any task, assess Ambiguity (A-Score):

| Score  | Meaning   | Action              |
| :----- | :-------- | :------------------ |
| **A1** | Clear     | **Execute**         |
| **A2** | Inferred  | **Execute**         |
| **A3** | Ambiguous | **Propose & Wait**  |
| **A4** | Critical  | **Present Options** |
| **A5** | Hazard    | **REFUSE**          |

## 3. Skill Discovery (The Matrix)

**Trigger Map:** "IF user asks for X, LOAD Skill Y."

| Intent                 | Skill     | Trigger Phrase                        |
| :--------------------- | :-------- | :------------------------------------ |
| **New Feature / Plan** | `project` | "Plan feature", "Update tracks"       |
| **UI Component**       | `svelte`  | "Scaffold component", "Refactor rune" |
| **Styling / Theme**    | `scss`    | "Style this", "Make it pop"           |
| **Data / State**       | `data`    | "Save logic", "Schema change"         |
| **Verification**       | `warden`  | "Run tests", "Audit security"         |
| **Docs / Rules**       | `scribe`  | "New skill", "Refactor docs"          |

## 4. The Enforced Context (Footer)

**MANDATORY:** Every response to the User must end with:

```text
---
📜 Rules: [01-stack, 02-governance, 03-workflow]
🧠 Skills: [Active Skills]
📚 Knowledge: [Reference KIs]
🤖 Tools: [Tool Used]
---
```
