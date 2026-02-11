# **Strategic Architecture Report: Operationalizing Functional Agentic Modes in Google Antigravity**

## **Transitioning from Roleplay Personas to Constraint-Based Coding Workflows**

### **Executive Summary**

The rapid evolution of agentic software development has precipitated a crisis in cognitive architecture. Early paradigms, characterized by "Roleplay Personas"—instructing Large Language Models (LLMs) to simulacra human roles such as "Senior Engineer" or "UX Designer"—are increasingly failing in high-precision environments. While these personas successfully establish a conversational tone, they introduce significant "context noise." This phenomenon, known as context bloating, forces the model to allocate attention heads to maintaining character consistency rather than adhering to strict technical constraints. The result is a high frequency of hallucinations, particularly when navigating transitional technology stacks like the migration from Svelte 4 legacy syntax to Svelte 5 Runes.

This report presents a comprehensive architectural strategy to migrate from **Roleplay Personas** to **Functional Agentic Modes**. This shift replaces the identity-based instruction set ("Who are you?") with a constraint-based operational set ("What must you verify?"). By leveraging the Google Antigravity / Agent Skills standards—specifically the .agent/skills/ and .agent/rules/ directory structures—we establish a deterministic, hallucination-resistant environment.

The proposed architecture introduces the **Meridian Brain** organizational pattern, organizing agents into vertical "Meridians" of functional context rather than flat persona lists. It further adopts a **Skeleton-and-Skin** separation of concerns, decoupling logical structure (Skeleton) from presentational implementation (Skin) to prevent regression. Finally, it operationalizes a **PDCA (Plan-Do-Check-Act)** audit cycle directly into the agent's file system, transforming the interaction model from a probabilistic chat interface into a verifiable engineering loop.

---

**1\. The Cognitive Crisis: Analyzing the Failure of Personas**

The prevailing challenge in current agentic workflows is the misalignment between the probabilistic nature of LLMs and the deterministic requirements of modern software engineering. When a user employs a "Roleplay Persona," they are effectively asking the model to perform two distinct cognitive tasks simultaneously: simulating a personality and executing technical logic.

### **1.1 The Mechanism of Persona-Induced Hallucination**

In the context of LLM-based coding agents, a "Persona" functions as a wide-aperture system prompt. Instructions such as "You are an opinionated Senior Developer who loves clean code" occupy significant semantic space within the context window. Research indicates that maintaining this persona requires the model to distribute its attention mechanisms across stylistic tokens, competing directly with the retrieval of technical specifications.1

This competition becomes critical when dealing with "mixed-state" technical knowledge. Consider the case of Svelte 5\. The model's training data contains a vast corpus of Svelte 3 and 4 code (legacy syntax like export let and $:) and a smaller, more recent corpus of Svelte 5 code (Runes like $state and $derived). When a "Persona" prompt encourages the model to be "helpful" or "intuitive," the model often defaults to the statistically dominant patterns (Legacy Svelte 4\) rather than the strictly required newer patterns (Svelte 5), simply because the legacy patterns have a higher probability weight in the training distribution. The persona lacks the _negative constraints_ necessary to artificially suppress these high-probability but incorrect pathways.

Consequently, the agent "hallucinates" validity. It generates code that is syntactically correct for Svelte 4 but functionally broken in a Svelte 5 Runes-only environment. The "Character" constraints of the persona (e.g., "be helpful") override the "Functional" constraints of the compiler.2

### **1.2 Agentic Modes: The Functional Alternative**

To mitigate this, the industry is pivoting toward **Agentic Modes**. Unlike a Persona, which mimics a human identity, an Agentic Mode acts as a functional "Lens" or "Mask." It filters the model's capabilities, narrowing the search space to a specific set of allowed operations.

A "Svelte 5 Strict Mode" does not simulate a developer; it simulates a _compiler with a personality of zero_. It enforces a whitelist of allowed syntax ($state, $derived, $props) and, crucially, a blacklist of banned patterns. This reduces the cognitive load on the model, allowing it to dedicate its entire attention budget to technical accuracy rather than tonal consistency.

### **1.3 Empirical Evidence: Modes vs. Personas**

Recent quantitative studies on "Compliance Brain Assistants" (CBA) provide compelling evidence for this architectural shift. In controlled experiments comparing "Full Agentic" modes (routing requests to specialized functional modules) against standard persona-based prompting, the functional modes demonstrated superior performance metrics.

Specifically, the functional routing approach achieved an **83.7% keyword match rate** compared to 41.7% for standard LLM personas. More importantly, the **LLM-judge pass rate**—a metric evaluating the logical correctness of the output—rose from 20.0% with personas to **82.0%** with functional agentic modes.4 This data explicitly validates the hypothesis that "Functional Constraints" are superior to "Character Roleplay" for high-precision tasks.

| Performance Metric     | Roleplay Persona Architecture        | Functional Agentic Mode Architecture     |
| :--------------------- | :----------------------------------- | :--------------------------------------- |
| **Primary Driver**     | Identity Simulation ("Act as X")     | Constraint Satisfaction ("Verify Y")     |
| **Context Overhead**   | High (Maintains character/tone)      | Low (Focuses on technical specs)         |
| **Hallucination Rate** | High (Confabulates to fit role)      | Low (Restricted by negative constraints) |
| **Keyword Match Rate** | 41.7% 4                              | 83.7% 4                                  |
| **Logical Pass Rate**  | 20.0% 4                              | 82.0% 4                                  |
| **Failure Mode**       | "Gaslighting" (Persuasive but wrong) | "Refusal" (Stops if constraints unmet)   |

This distinction is foundational. A persona will attempt to answer a query even if it lacks the specific knowledge, often filling gaps with "in-character" guesses. A functional mode, bound by strict retrieval and verification rules, is engineered to fail fast or self-correct, preventing the propagation of errors into the codebase.

---

**2\. The Meridian Architecture: Vertical Organization of Skills**

The user's reference to the "Meridian Brain" aligns with emerging "Anti-Chaotic" patterns in agent orchestration. Traditional setups often suffer from "Horizontal Scaling" issues, where a single agent is overloaded with dozens of unrelated skills (e.g., Database, Frontend, DevOps, SEO) in a flat list. This leads to confusion, where the agent might invoke a database migration skill when asked to update a UI component.

### **2.1 Defining the Meridian**

In the proposed architecture, we organize capabilities into **Meridians**—vertical channels of strictly scoped context. A Meridian is not a person; it is a pipeline. The "Antigravity Kit 2.0" exemplifies this by structuring its 16 specialized agents not as a flat group of chat bots, but as distinct verticals (e.g., the "SEO Meridian" or the "Backend Meridian") that operate independently before merging their outputs.6

The "Meridian Brain" acts as the Orchestrator. It does not perform tasks; it routes intent. When a user request enters the system, the Brain determines which Meridian is active.

- **The Logic Meridian (Skeleton):** Has read/write access to .svelte.ts, server.ts, and database schemas. It _cannot_ see CSS files.
- **The Presentation Meridian (Skin):** Has read/write access to .css, tailwind.config.js, and .svelte template blocks. It _cannot_ see backend logic.
- **The Audit Meridian (Immune System):** Has read-only access to all files but write access only to "Report" artifacts. It runs the PDCA checks.

### **2.2 The Anti-Chaotic "Squad" Structure**

This structure mirrors the "Anti-Chaotic" Antigravity Kit designed by community developers to simulate a realistic software development lifecycle (SDLC). Instead of "throwing every skill into one giant folder," skills are nested within the folders corresponding to these Meridians.8

This "Vertical Organization by Role" prevents the cross-contamination of context. For example, the "Designer" role (Presentation Meridian) is physically unable to hallucinate a database query because the db-query skill is not present in its directory scope. This architectural constraint—limiting the _availability_ of tools—is a more powerful anti-hallucination protocol than any text-based instruction.

---

**3\. Theoretical Architecture: The Skeleton & Skin Pattern**

To address the "Separation of Concerns" objective, this report proposes the **Skeleton & Skin** workflow. This pattern is derived from biomechanical modeling concepts where the structural rig (Skeleton) is defined independently of the surface mesh (Skin).9 In software engineering, this translates to decoupling the _Logical Structure_ from the _Visual Implementation_.

### **3.1 The Skeleton (Logic & Structure)**

The Skeleton represents the immutable, functional core of the application. In the specific context of Svelte 5, the Skeleton comprises the reactive state machine and the data contracts.

- **State Primitives:** All $state(), $derived(), and $effect() runes.
- **Data Contracts:** TypeScript interfaces, Zod validation schemas, and Component Props ($props()).
- **Business Logic:** API calls, data transformation functions, and event handlers.
- **Semantic Structure:** The raw HTML hierarchy (e.g., \<article\>, \<section\>, \<button\>) required for accessibility and flow, devoid of styling classes.

**Constraint:** The Skeleton Agent is strictly forbidden from generating presentational markup. It output "Logic-Only Components." Its success metric is "Does it run without errors?" not "Does it look good?"

### **3.2 The Skin (Presentation & Interaction)**

The Skin represents the mutable, aesthetic layer that sits atop the Skeleton.

- **Styling:** Tailwind CSS utility classes, design tokens, and color palettes.
- **Component Composition:** Integration of Shadcn/UI components or other distinct UI libraries.
- **Micro-Interactions:** CSS transitions, layout spacing, and responsive modifiers.

**Constraint:** The Skin Agent is allowed to edit the \<template\> and \<style\> blocks but is **strictly forbidden** from modifying the \<script\> block. It must treat the Skeleton's data contracts as immutable laws. It cannot rename a variable; it can only bind to it.

### **3.3 The Workflow: From Skeleton to Skin**

This separation dictates the workflow order. Attempting to generate Skeleton and Skin simultaneously (the "All-in-One" approach) is the primary cause of the context bloating described by the user.

1. **Blueprint Phase (Architect Mode):** Defines the interface Props and the required state machine.
2. **Skeleton Phase (Logic Mode):** Generates the .svelte.ts logic and the unstyled .svelte file.
3. **Audit Phase (Check Mode):** Verifies that the Skeleton strictly uses Svelte 5 Runes and contains zero styling.
4. **Skin Phase (Design Mode):** Injects Tailwind classes into the verified Skeleton.
5. **Final Verification:** Checks that the Skinning process did not break the Logic (e.g., ensuring a button's onclick handler was preserved when applying a class).

Research into "skeleton-of-thought" prompting confirms that this sequential decoding—first outlining the structure, then filling in the details—reduces latency and significantly improves logical coherence.12

---

**4\. Technical Implementation: The Google Antigravity Folder Structure**

The implementation of this architecture relies on the standardized .agent folder structure found in Google Antigravity and the Antigravity Kit 2.0.13 We replace the flat list of personas with a hierarchical "Skill Tree" rooted in the .agent directory.

### **4.1 The Root Directory: .agent/**

This folder is the "Brain" of the workspace. It must be located at the project root \<workspace-root\>/.agent/ to be recognized by the IDE.

.agent/

├── rules/ \# The "Constitution" \- Global negative constraints

│ ├── tech-stack.md \# Svelte 5, TypeScript, Tailwind rules

│ ├── anti-patterns.md \# Banned syntax (e.g., Svelte 4 legacy)

│ └── security.md \# No secrets in code, sanitization rules

├── skills/ \# The "Hands" \- Functional Capabilities

│ ├── arch-skeleton/ \# Logic generation skills (The Logic Meridian)

│ │ ├── SKILL.md

│ │ ├── templates/

│ │ └── examples/

│ ├── ui-skin/ \# Styling skills (The Presentation Meridian)

│ │ ├── SKILL.md

│ │ └── palette.json

│ ├── audit-core/ \# Self-Correction skills (The Audit Meridian)

│ │ ├── SKILL.md

│ │ └── verify.py

│ └── svelte-migration/ \# Specific refactoring skills

│ └── SKILL.md

└── workflows/ \# The "Processes" \- Multi-step sequences

├── pdca-cycle.md \# Plan-Do-Check-Act orchestration

└── feature-flow.md \# Skeleton \-\> Skin pipeline

### **4.2 The Rules Engine: .agent/rules/**

Files in this directory replace "System Prompts." Antigravity agents treat these files as high-priority, immutable context that persists across all chat sessions.13

#### **Template File: .agent/rules/tech-stack.md (The Svelte 5 Enforcer)**

This file is the primary defense against the "mixing syntax" hallucination. It uses **Negative Constraints**—explicitly listing what is forbidden—which has been proven more effective than positive instructions alone.3

# **Technical Stack & Constraints**

## **Core Framework: Svelte 5 (Runes Mode)**

**STRICT ENFORCEMENT:** You are operating in a Svelte 5 Runes-only environment. Svelte 4 legacy syntax is strictly prohibited.

### **✅ APPROVED PATTERNS (Runes)**

- **State:** Use $state(val) for all reactive variables.
- **Computed:** Use $derived(expr) for values dependent on state.
- **Side Effects:** Use $effect(() \=\> {}) for logic that runs on state change.
- **Props:** Use let { propName }: Props \= $props() for component inputs.
- **Binding:** Use $bindable() for two-way data flow.
- **Snippets:** Use {\#snippet name()} for reusable UI blocks instead of slots.

### **❌ BANNED PATTERNS (Legacy \- CRITICAL VIOLATIONS)**

- **DO NOT USE** export let prop. (Reason: Deprecated in favor of $props)
- **DO NOT USE** $: variable \=.... (Reason: Deprecated in favor of $derived)
- **DO NOT USE** $: {... }. (Reason: Deprecated in favor of $effect)
- **DO NOT USE** createEventDispatcher. (Reason: Deprecated. Use callback props).
- **DO NOT USE** \<slot\>. (Reason: Deprecated. Use snippets).

## **Language: TypeScript (Strict)**

- **No Any:** The usage of any is strictly forbidden.
- **Interfaces:** Prefer interface over type for object definitions.
- **Typing:** All props must be typed via a distinct interface Props definition.

## **Architecture: Skeleton & Skin**

- **Logic Separation:** Logic and State must be defined in the \<script\> block.
- **Style Separation:** Tailwind classes must be applied only after logic is verified.

### **4.3 The Skill Definitions: .agent/skills/**

Skills are the "Hands" of the agent. They follow the "Open Standard" format: a folder containing a SKILL.md file and optional resources.13

#### **Template File: .agent/skills/arch-skeleton/SKILL.md**

This skill belongs to the Logic Meridian. It focuses purely on generating the functional backbone.

YAML

\---  
name: generate-skeleton  
description: Generates the logical backbone of a Svelte 5 component. Handles state, types, and data flow. NO STYLING.  
\---  
\# Skeleton Generation Protocol

\#\# Objective  
Create a functionally complete, unstyled Svelte 5 component. The output must be compilable but devoid of aesthetic choices.

\#\# Steps

1.  \*\*Define Interface:\*\* Create a TypeScript interface for \`Props\` and \`State\` within the module.
2.  \*\*State Logic:\*\* Implement reactivity using strictly \`$state\` and \`$derived\`.
3.  \*\*Markup Structure:\*\* Write semantic HTML (section, article, button) to house the data.
4.  \*\*Verification:\*\* Scan the generated code for any legacy syntax (\`export let\`, \`$:\`).

\#\# Constraints  
\- \*\*NO STYLING:\*\* Do not add CSS classes, style blocks, or Tailwind attributes.  
\- \*\*NO LEGACY:\*\* If Svelte 4 syntax is detected, the generation is considered a FAILURE.

\#\# Output Template  
\`\`\`svelte  
\<script lang="ts"\>  
 interface Props {  
 data: string;  
 }  
 let { data }: Props \= $props();

let count \= $state(0);  
 let double \= $derived(count \* 2);

function handleIncrement() {  
 count \+= 1;  
 }  
\</script\>

\<section\>  
 \<h1\>{data}\</h1\>  
 \<button onclick={handleIncrement}\>  
 Value: {count}, Doubled: {double}  
 \</button\>  
\</section\>

#### **Template File: .agent/skills/ui-skin/SKILL.md**

This skill belongs to the Presentation Meridian. It applies the "Skin."

YAML

\---  
name: apply-skin  
description: Applies Tailwind CSS and Shadcn styling to an existing Skeleton component. DOES NOT modify script logic.  
\---  
\# Skin Application Protocol

\#\# Objective  
Transform a raw Skeleton component into a production-grade UI using Tailwind CSS.

\#\# Constraints  
\- \*\*IMMUTABLE SCRIPT:\*\* Do NOT modify the content inside \`\<script\>\` tags under any circumstances.  
\- \*\*IMMUTABLE LOGIC:\*\* Do NOT change variable names, function calls, or logic flow.  
\- \*\*ACTION:\*\* Add Tailwind classes to existing HTML tags.  
\- \*\*ACTION:\*\* Wrap elements in layout containers (flex, grid) if necessary for positioning.

\#\# Style Guide (Theme: Dark Neptune)  
\- \*\*Layout:\*\* Use \`flex\` and \`grid\` for structural layout.  
\- \*\*Spacing:\*\* Use \`gap-4\`, \`p-6\`, \`m-2\` for consistent rhythm.  
\- \*\*Typography:\*\* Use \`text-lg font-semibold\` for headers, \`text-sm text-gray-500\` for metadata.  
\- \*\*Interactive:\*\* Use \`hover:bg-blue-600 transition-colors\` for buttons.

---

**5\. Anti-Hallucination Protocol: The PDCA Cycle**

The "Antigravity Kit" introduces the **PDCA (Plan-Do-Check-Act)** cycle as a formal orchestration workflow.15 This is crucial for hallucination resistance because it forces the agent to critique its own output _before_ finalizing it, breaking the "stream of consciousness" generation that leads to errors.

### **5.1 Workflow Definition: .agent/workflows/pdca-cycle.md**

This file orchestrates the interaction between the User and the Meridians.

# **PDCA Engineering Cycle**

## **Phase 1: PLAN (Architect Mode)**

- **Input:** Analyze the user request.
- **Routing:** Select the appropriate Agentic Mode (Skeleton, Skin, or Migration).
- **Blueprint:** List required imports and dependencies.
- **Stop:** Wait for user confirmation of the plan.

## **Phase 2: DO (Builder Mode)**

- **Execution:** Execute the selected Skill (e.g., generate-skeleton).
- **Adherence:** Strictly adhere to .agent/rules/tech-stack.md.

## **Phase 3: CHECK (Auditor Mode)**

- **Self-Correction:** The agent must scan its own output for BANNED PATTERNS.
- **Tool Use:** Run the audit-core skill to perform a static analysis.
- **Question:** "Does this code contain export let?" \-\> If YES, Refactor immediately.
- **Question:** "Does this code mix Svelte 4 and 5?" \-\> If YES, Refactor immediately.

## **Phase 4: ACT (Deployer Mode)**

- **Commit:** Write the file to the file system.
- **Integrate:** Update manifest or index files if necessary.

### **5.2 The Audit Meridian: Self-Correction Workflow**

Research supports "Agentic Inference with Internal Repair" as a superior method for zero-shot generalization.18 In Antigravity, we implement this by creating a specific audit-core skill that acts as a linter. This agent does not write new code; it only critiques existing code.

#### **Skill: .agent/skills/audit-core/SKILL.md**

YAML

\---  
name: audit-codebase  
description: Scans specific files for violations of the Tech Stack rules (e.g., legacy Svelte syntax).  
\---  
\# Audit Protocol

\#\# Inspection Targets

1.  \*\*Runes Compliance:\*\* Scan for the string \`export let\`. If found, flag as CRITICAL ERROR.
2.  \*\*Reactivity Check:\*\* Scan for the string \`$:\` (followed by space or variable). If found, flag as CRITICAL ERROR.
3.  \*\*Type Safety:\*\* Scan for \`: any\`. If found, flag as WARNING.

\#\# Remediation  
If CRITICAL ERRORS are found, generate a specific remediation plan. Do not ask for permission to fix syntax errors; list them and propose the Svelte 5 equivalent.

### **5.3 Automated Audit Workflow**

In the "Antigravity Kit 2.0," this audit capability is often automated via "Slash Commands" (e.g., /review or /debug).19 By mapping the audit-core skill to a /verify command, the developer can trigger a full constraints check at any point in the development process, ensuring that the "Skinning" phase didn't accidentally reintroduce legacy syntax.

---

**6\. Deep Dive: Svelte 5 Runes Reference Implementation**

To ensure the "Skeleton" agent has the correct ground truth, we must provide "Gold Standard" examples in the examples/ folder of the skill. This technique, known as "Few-Shot Prompting via File System," grounds the agent's probability distribution.13

#### **File: .agent/skills/arch-skeleton/examples/counter.svelte**

Svelte

\<script lang="ts"\>  
 interface Props {  
 initial?: number;  
 }  
 let { initial \= 0 }: Props \= $props(); // Correct Props

let count \= $state(initial); // Correct State  
 let double \= $derived(count \* 2); // Correct Derived

$effect(() \=\> { // Correct Effect  
 console.log(\`Count changed to: ${count}\`);  
 });

function increment() {  
 count \+= 1;  
 }  
\</script\>

\<button onclick={increment}\>  
 Count: {count}, Double: {double}  
\</button\>

#### **File: .agent/skills/arch-skeleton/examples/bad_counter.svelte**

Svelte

\<script\>  
 export let initial \= 0; // BANNED  
 let count \= initial;  
 $: double \= count \* 2; // BANNED  
\</script\>

By providing both positive and explicit _negative_ examples (labeled as BANNED), we leverage the LLM's pattern matching to actively avoid the negative distribution.

---

**7\. Conclusion & Strategic Roadmap**

The transition from "Roleplay Personas" to "Functional Agentic Modes" is a fundamental requirement for the reliable generation of modern, strictly typed code. The anthropomorphic "Persona" introduces fatal noise and hallucination, particularly when navigating the Svelte 4-to-5 migration. The "Functional Mode," governed by the Meridian Architecture and the Skeleton/Skin separation of concerns, introduces clarity, constraint, and verifiability.

**Strategic Recommendations:**

1. **Purge Personas:** Eliminate all "Roleplay" instructions from system prompts. Replace "You are a Senior Dev" with "You are the Logic Meridian."
2. **Adopt Skeleton & Skin:** Strictly separate Logic generation and UI styling into distinct, sequential agent steps.
3. **Enforce Rules:** Use .agent/rules/tech-stack.md to create a "Svelte 5 Constitution" with explicit negative constraints.
4. **Implement PDCA:** Use .agent/workflows/ to force a "Check" phase before code is committed.
5. **Leverage Antigravity:** Use the standard \<workspace-root\>/.agent/skills/ structure to ensure portability and context-awareness.

This architecture transforms the coding agent from a "chatty junior developer" into a "deterministic engineering engine," capable of handling the rigors of Svelte 5 Runes without hallucinating legacy code.

### **Appendix A: The "Meridian" Workflow Diagram**

The following diagram illustrates the data flow through the Meridian Architecture:

1. **Input:** User Request ("Create a User Profile Card").
2. **Orchestrator (Brain):** Analyzes request. Routes to **Logic Meridian**.
3. **Logic Meridian (Skeleton):**
    - Activates generate-skeleton skill.
    - Reads .agent/rules/tech-stack.md.
    - Generates UserProfile.svelte.ts (Logic) and UserProfile.svelte (Semantic HTML).
4. **Handoff:** Output passed to **Audit Meridian**.
5. **Audit Meridian (Immune System):**
    - Activates audit-core skill.
    - Checks for export let / $: / any.
    - **Decision:** PASS \-\> Continue / FAIL \-\> Refactor.
6. **Handoff:** Verified Output passed to **Presentation Meridian**.
7. **Presentation Meridian (Skin):**
    - Activates apply-skin skill.
    - Applies class="p-4 bg-white shadow-md" to HTML.
    - **Constraint:** Does NOT touch \<script\>.
8. **Output:** Final Component.

This linear, gated workflow eliminates the "context bloat" of a single agent trying to do everything at once, ensuring that the "Skin" never infects the "Skeleton" with hallucinations.

#### **Works cited**

1. Identosphere Blogcatcher | Planet Identity Reboot, accessed on February 11, 2026, [http://identosphere.net/](http://identosphere.net/)
2. AI is stifling new tech adoption? \- Hacker News, accessed on February 11, 2026, [https://news.ycombinator.com/item?id=43047792](https://news.ycombinator.com/item?id=43047792)
3. awesome-cursorrules/rules/web-app-optimization-cursorrules-prompt-file/.cursorrules at main · PatrickJS/awesome-cursorrules \- GitHub, accessed on February 11, 2026, [https://github.com/PatrickJS/awesome-cursorrules/blob/main/rules/web-app-optimization-cursorrules-prompt-file/.cursorrules](https://github.com/PatrickJS/awesome-cursorrules/blob/main/rules/web-app-optimization-cursorrules-prompt-file/.cursorrules)
4. Towards large language model-based personal agents in the enterprise: Current trends and open problems \- ResearchGate, accessed on February 11, 2026, [https://www.researchgate.net/publication/376401381_Towards_large_language_model-based_personal_agents_in_the_enterprise_Current_trends_and_open_problems](https://www.researchgate.net/publication/376401381_Towards_large_language_model-based_personal_agents_in_the_enterprise_Current_trends_and_open_problems)
5. Compliance Brain Assistant: Conversational Agentic AI for Assisting, accessed on February 11, 2026, [https://www.researchgate.net/publication/393966254_Compliance_Brain_Assistant_Conversational_Agentic_AI_for_Assisting_Compliance_Tasks_in_Enterprise_Environments](https://www.researchgate.net/publication/393966254_Compliance_Brain_Assistant_Conversational_Agentic_AI_for_Assisting_Compliance_Tasks_in_Enterprise_Environments)
6. How Google's AntiGravity Kit 2.0 Gives Solo Freelancers A 16-Person AI Dev Team, accessed on February 11, 2026, [https://medium.com/@ferreradaniel/how-googles-antigravity-kit-2-0-gives-solo-freelancers-a-16-person-ai-dev-team-12a2c3593b88](https://medium.com/@ferreradaniel/how-googles-antigravity-kit-2-0-gives-solo-freelancers-a-16-person-ai-dev-team-12a2c3593b88)
7. AntiGravity Kit 2.0 — The Ultimate Free Upgrade for Google AntiGravity \- Reddit, accessed on February 11, 2026, [https://www.reddit.com/r/AISEOInsider/comments/1qj3ytl/antigravity_kit_20_the_ultimate_free_upgrade_for/](https://www.reddit.com/r/AISEOInsider/comments/1qj3ytl/antigravity_kit_20_the_ultimate_free_upgrade_for/)
8. I just released "Anti-Chaotic" – a structured Antigravity Kit focused on proper software dev process (not just fast ship) – feedback welcome\! : r/google_antigravity \- Reddit, accessed on February 11, 2026, [https://www.reddit.com/r/google_antigravity/comments/1qhoujv/i_just_released_antichaotic_a_structured/](https://www.reddit.com/r/google_antigravity/comments/1qhoujv/i_just_released_antichaotic_a_structured/)
9. AutoHealth: An Uncertainty-Aware Multi-Agent System for Autonomous Health Data Modeling \- arXiv, accessed on February 11, 2026, [https://arxiv.org/html/2602.01078v1](https://arxiv.org/html/2602.01078v1)
10. MarilynKeller/SKEL: Release for the Siggraph Asia 2023 SKEL paper "From Skin to Skeleton: Towards Biomechanically Accurate 3D Digital Humans". \- GitHub, accessed on February 11, 2026, [https://github.com/MarilynKeller/SKEL](https://github.com/MarilynKeller/SKEL)
11. Generating synthetic images of human skeletal motion for pose and kinematics estimation tasks \- PMC, accessed on February 11, 2026, [https://pmc.ncbi.nlm.nih.gov/articles/PMC12711891/](https://pmc.ncbi.nlm.nih.gov/articles/PMC12711891/)
12. Towards Hierarchical Multi-Agent Workflows for Zero-Shot Prompt Optimization \- arXiv, accessed on February 11, 2026, [https://arxiv.org/pdf/2405.20252?](https://arxiv.org/pdf/2405.20252)
13. Agent Skills \- Google Antigravity Documentation, accessed on February 11, 2026, [https://antigravity.google/docs/skills](https://antigravity.google/docs/skills)
14. Authoring Google Antigravity Skills, accessed on February 11, 2026, [https://codelabs.developers.google.com/getting-started-with-antigravity-skills](https://codelabs.developers.google.com/getting-started-with-antigravity-skills)
15. google-antigravity/README.md at main · Dokhacgiakhoa/google ..., accessed on February 11, 2026, [https://github.com/Dokhacgiakhoa/google-antigravity/blob/main/README.md](https://github.com/Dokhacgiakhoa/google-antigravity/blob/main/README.md)
16. SvelteKit Rules \- CursorList, accessed on February 11, 2026, [https://cursorlist.com/tags/sveltekit](https://cursorlist.com/tags/sveltekit)
17. Google AntiGravity IDE for Vibe Coding \- GitHub, accessed on February 11, 2026, [https://github.com/Dokhacgiakhoa/google-antigravity](https://github.com/Dokhacgiakhoa/google-antigravity)
18. 自然语言处理2025_12_9 \- arXiv每日学术速递, accessed on February 11, 2026, [https://www.arxivdaily.com/thread/74522](https://www.arxivdaily.com/thread/74522)
19. How Google AntiGravity AI App Development Lets You Create Full Web Apps in 10 Minute, accessed on February 11, 2026, [https://www.reddit.com/r/AISEOInsider/comments/1ql2t6l/how_google_antigravity_ai_app_development_lets/](https://www.reddit.com/r/AISEOInsider/comments/1ql2t6l/how_google_antigravity_ai_app_development_lets/)
20. AntiGravity Kit 2.0 AI Update: Google's Free Upgrade That Changes How You Code \- Reddit, accessed on February 11, 2026, [https://www.reddit.com/r/AISEOInsider/comments/1qoayvk/antigravity_kit_20_ai_update_googles_free_upgrade/](https://www.reddit.com/r/AISEOInsider/comments/1qoayvk/antigravity_kit_20_ai_update_googles_free_upgrade/)
21. GitHub \- rominirani/antigravity-skills, accessed on February 11, 2026, [https://github.com/rominirani/antigravity-skills](https://github.com/rominirani/antigravity-skills)
