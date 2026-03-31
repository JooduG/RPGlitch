# 📜 patterns.md

> **Status**: [HARDENED]
> **Directive**: Advanced engineering patterns to maximize LLM performance.
> **Law**: Use these to structure the "Forge" logic in the **Prompting** skill.

---

## 🔬 Core Capabilities

### 1. Few-Shot Learning (The Mimic)

Don't explain the rules; show the physics. Provide 2–5 input-output pairs to anchor the model in the desired behavior. Use this for consistent formatting or complex Svelte 5 Rune transformations.

**Project Example (State to Rune):**

```markdown
Transform legacy state to Svelte 5 Runes:

Input: "let count = 0; function inc() { count++ }"
Output: "let count = $state(0); function inc() { count += 1 }"

Input: "export let data = [];"
Output: "let { data = $bindable([]) } = $props();"

Now transform: "let user = { name: 'Dev' }; function update() { user.name = 'New' }"
```

### 2. Chain-of-Thought (CoT) (The Logic Trace)

Force the model to show its work before outputting code. This prevents "hallucinated shortcuts."

**Project Example (Bug Analysis):**

```markdown
Analyze this engine drift and identify the root cause.
Think step-by-step:

1. **Initial State**: What are the current $state values?
2. **The Trigger**: Which $effect or event listener fired?
3. **The Mutation**: How did the data change?
4. **The Drift**: Why did the UI fail to reflect the change?
5. **The Resolution**: Provide the Svelte 5 fix.
```

### 3. Iterative Density (The Compactor)

Used for summarizing complex **Discovery Journals** or long technical logs without losing the "Red Thread."

- **V1**: Summarize the journal.
- **V2**: Extract exactly 5 mechanical requirements.
- **V3**: Map those requirements to specific file paths in `src/lib/`.

---

## 📐 Instruction Hierarchy

To prevent "Instruction Drift," always structure your directives in this specific order of gravity:

1.  **System Context**: The role (e.g., "Act as a Svelte 5 Logic Specialist").
2.  **Task Instruction**: The immediate objective.
3.  **The Laws**: Constraints (e.g., "No $store usage," "Use Chalk tokens").
4.  **Examples**: Few-shot patterns.
5.  **Input Data**: The actual code or text to transform.
6.  **Output Format**: (e.g., "Return a JSON object," "Markdown code block only").

---

## ⚡ ADHD-Optimized Patterns

Since we're building this for a neurodivergent flow, use these patterns to ensure clarity at a glance:

- **Binary Verification**: Every task must end with a "Success Criteria" check.
- **The 5-Minute Rule**: If a pattern generates a plan with tasks longer than 5 minutes, force it to sub-divide.
- **Visual Hierarchy**: Use **bolding for critical actions** and `code blocks` for technical paths.

---

## 🚀 Key Orchestration Patterns

### Progressive Disclosure

Start with the "Vibe" and move to the "Physics."

- **Level 1**: **Strategy** defines the goal.
- **Level 2**: **Tactics** maps the files.
- **Level 3**: **Operations** writes the code.
- **Level 4**: **Warden** audits the result.

### Error Recovery & Self-Correction

Instruct the agent to provide a "Confidence Score" (0–1.0) and a "Risk Assessment."

> _"If your confidence in this implementation is below 0.8, HALT and ask for clarification on the [FILE_PATH] logic."_

---

## 🚫 Common Pitfalls (The Slop List)

- **Over-Engineering**: Writing a 50-line prompt for a 1-line CSS fix.
- **Example Pollution**: Including irrelevant examples that confuse the attention head.
- **Ambiguity**: Using words like "optimize" or "improve" without defining the metric (e.g., "Reduce bundle size by 10%").
- **Context Overflow**: Pasting the entire `package.json` when you only need the version of `svelte`.

---

> "Logic is the skeleton; patterns are the muscle."
