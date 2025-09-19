# Agent Thinking Framework

**RULE:** This document outlines the core cognitive framework the agent MUST use for problem-solving. It is the foundational model for translating any goal into a successful outcome.

**CORE PRINCIPLE:** Think, then act. Every action MUST be the result of a deliberate, rule-driven, and documented thought process.

---

## 1. The IDEA Cycle Directives

**RULE:** The agent's thinking process is defined by the IDEA cycle: **I**nterpret, **D**iagnose, **E**xecute, **A**ssess.

1. **DIRECTIVE:** **Interpret:** Fully understand the request. (Refer to Step 1 of the Pre-Task Protocol).
2. **DIRECTIVE:** **Diagnose:** Gather all relevant information and form a hypothesis or plan. (Refer to Steps 2-5 of the Pre-Task Protocol).
3. **DIRECTIVE:** **Execute:** Carry out the planned action(s).
4. **DIRECTIVE:** **Assess:** Verify that the action produced the desired outcome.

---

## 2. Case Study: "Fix a typo in the `rpglitch` heading"

**RULE:** Apply the IDEA framework to a simple task.

### **I**nterpret

* **GOAL:** The user wants to fix a spelling error in the main heading of the `rpglitch` application.
* **INTERPRETATION:** Identify the main HTML file for `rpglitch`, find the primary heading element (likely an `<h1>`), correct the text content, and ensure the change is properly built and reflected in the output.

### **D**iagnose (Applying Pre-Task Protocol)

1. **GOAL:** Understood.
2. **RULES:**
    * **DIRECTIVE:** Refer to `system-architecture.md` for source HTML location (`/apps/rpglitch/html/`).
    * **DIRECTIVE:** Refer to `html-best-practices.md` for heading element details (e.g., `#storyboard`).
    * **DIRECTIVE:** Refer to `../../build/README.md` for build script information.
3. **MEMORY:** Search `../../memory-bank/past/` for "typo fixes" examples. Refer to `../../memory-bank/forever/` rules on non-intrusive edits are relevant.
4. **SOURCE CODE:** Read `/apps/rpglitch/html/index.html` to find the heading.
5. **BUILD/TEST:** Check `package.json` for the build script, which is `build-rpglitch`. I should also check `/tests/storyboard-title.test.js` to see if a test covers the heading text.
6. **PLAN:**
    1. Read content of `/apps/rpglitch/html/index.html`.
    2. Locate `<h1>` element within `#storyboard-title` container.
    3. Modify text content to correct typo.
    4. Save changes to file.
    5. Execute build script: `npm run build-rpglitch`.
    6. Verify change by inspecting generated output file.
    7. Run relevant test: `npm test -- tests/storyboard-title.test.js`.
7. **SANITY CHECK:** The plan is direct, follows the build process, and includes verification. It does not violate any rules.

### **E**xecute

**DIRECTIVE:** Execute the 7 steps outlined in the plan.

### **A**ssess

**DIRECTIVE:** After execution, confirm:

* File saved correctly.
* Build script ran without errors.
* Test passed.
* Typo fixed in final output.
* **CONCLUSION:** Task successfully completed.

---

## 3. Framework for Complex Problems

The IDEA cycle is sufficient for most tasks. However, when a problem is particularly complex or ambiguous, a more structured approach to the **Diagnose** phase is required.

### 3.1. When to Use a Deeper Framework

A deeper analysis is warranted for:

* **Complex Decision-Making:** When there are multiple options with various pros and cons.
* **Argument Analysis & Debate:** When a topic needs to be explored from multiple perspectives.
* **System Design & Visualization:** When understanding the relationships and flows within a system is crucial.
* **Problem Decomposition:** When a problem is too large or abstract and needs to be broken down into smaller, more manageable parts.

### 3.2. Activation Checklist

Before engaging in deep analysis, confirm that the problem meets at least two of the following criteria:

* [ ] **Ambiguity:** The user's request is open-ended and does not have a single, obvious answer.
* [ ] **Complexity:** The problem involves multiple interacting parts, variables, or stakeholders.
* [ ] **Comparison:** The task requires evaluating and comparing different options, arguments, or designs.
* [ ] **Abstraction:** The problem requires thinking about concepts, structures, or systems rather than concrete implementation details.

### 3.3. General Workflow

If the criteria are met, expand the **Diagnose** phase with the following workflow:

1. **Define the Problem:** Clearly state the problem or question you are addressing.
2. **Iterate and Analyze:** Use an appropriate framework to build out the analysis. This may involve:
    * Defining options, criteria, and weights for decisions.
    * Building a thesis, antithesis, and synthesis for arguments.
    * Creating nodes and edges to represent a system.
3. **Synthesize and Conclude:** After iterating, formulate a final conclusion, recommendation, or summary based on the analysis.
4. **Present the Findings:** Clearly present the conclusion and a summary of the reasoning process.
