# Agent Guide: The Thinking Framework

This document outlines the core cognitive framework the agent must use for problem-solving. It is the foundational model for translating any goal into a successful outcome.

**Core Principle:** Think, then act. Every action must be the result of a deliberate, rule-driven, and documented thought process.

---

## 1. The IDEA Cycle

The agent's thinking process is defined by the IDEA cycle: **I**nterpret, **D**iagnose, **E**xecute, **A**ssess.

1. **Interpret:** Fully understand the request. (This is covered by Step 1 of the Pre-Task Protocol).
2. **Diagnose:** Gather all relevant information and form a hypothesis or plan. (This is covered by Steps 2-5 of the Pre-Task Protocol).
3. **Execute:** Carry out the planned action(s).
4. **Assess:** Verify that the action produced the desired outcome.

---

## 2. Case Study: "Fix a typo in the `rpglitch` heading"

Here is a practical application of the framework for a simple task.

### **I**nterpret

- **Goal:** The user wants to fix a spelling error in the main heading of the `rpglitch` application.
- **My Interpretation:** I need to identify the main HTML file for `rpglitch`, find the primary heading element (likely an `<h1>`), correct the text content, and ensure the change is properly built and reflected in the output.

### **D**iagnose (Applying Pre-Task Protocol)

1. **Goal:** Understood.
2. **Rules:**
    - `system-architecture.md`: Tells me the source HTML will be in `/apps/rpglitch/html/`.
    - `html-best-practices.md`: Tells me the main heading might have a specific ID or be within `#storyboard`.
    - `build/README.md`: Informs me that a build script needs to be run after changing source files.
3. **Memory:** A quick search in `/past` for "typo fixes" might show previous examples. `/forever` rules on non-intrusive edits are relevant.
4. **Source Code:** I will read `/apps/rpglitch/html/index.html` to find the heading.
5. **Build/Test:** I need to check `package.json` for the build script, which is `build-rpglitch`. I should also check `/tests/storyboard-title.test.js` to see if a test covers the heading text.
6. **Plan:**
    1. Read the content of `/apps/rpglitch/html/index.html`.
    2. Locate the `<h1>` element within the `#storyboard-title` container.
    3. Modify the text content to correct the typo.
    4. Save the changes to the file.
    5. Execute the build script: `npm run build-rpglitch`.
    6. Verify the change by inspecting the generated output file.
    7. Run the relevant test: `npm test -- tests/storyboard-title.test.js`.
7. **Sanity Check:** The plan is direct, follows the build process, and includes verification. It does not violate any rules.

### **E**xecute

- I will now execute the 7 steps outlined in my plan.

### **A**ssess

- After execution, I will confirm:
  - Did the file save correctly? Yes.
  - Did the build script run without errors? Yes.
  - Does the test pass? Yes.
  - Is the typo fixed in the final output? Yes.
- **Conclusion:** The task is successfully completed.
