---
description: Scaffolds a new work track (feature/bug) with Spec and Plan.
---

# Conductor New Track

## 1.0 INITIALIZATION

### PROTOCOL: Context Loading

1. Read [.agent/product.md](../../product.md) (Gain understanding of the product).
2. Read [.agent/rules/03-tech-stack.md](../../rules/03-tech-stack.md) (Gain understanding of constraints).
3. Read [.agent/tasks/tracks.md](../../tasks/tracks.md) (Check for duplicates).

## 2.0 INTERACTIVE SCOPING

### PROTOCOL: Define the Track

1. **Ask User:** "What do you want to build or fix?"
2. **Analyze Request:**
    - Determine if it's a `Feature` or a `Bugfix`.
    - Create a clean `kebab-case-name` for the track.
3. **Generate Spec (`spec.md`):**
    - Goal: Define the "What" and "Why".
    - Draft a simple spec using the user's input + product context.
    - Ask: "Does this spec look good?"
4. **Generate Plan (`plan.md`):**
    - Goal: Define the "How".
    - Break down the Spec into atomic, checkable steps.
    - **Constraint:** Use the tech stack rules.
    - Ask: "Ready to proceed with this plan?"

## 3.0 ARTIFACT GENERATION

### PROTOCOL: Materialize the Track

1. Create Directory: `.agent/tasks/<track-name>/`
2. Write `spec.md` to that directory.
3. Write `plan.md` to that directory.
4. Update Registry:
    - Append to [.agent/tasks/tracks.md](../../tasks/tracks.md):
    - `## [ ] Track: <User Description>`
    - `- Path: .agent/tasks/<track-name>/`
    - `- Status: Defined`

## 4.0 HANDOFF

- Announce: "Track `<track-name>` created. Run `/conductor:implement <track-name>` to start coding."
