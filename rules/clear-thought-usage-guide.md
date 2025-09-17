# Clear Thought MCP Usage Guide

This document provides the standard operating procedure (SOP) for using the `ClearThought15` MCP server. This tool provides a suite of structured reasoning frameworks to tackle complex problems that go beyond simple queries or actions.

## 1. Purpose and Scope

The `ClearThought15` tool should be activated when a user's request requires deep analysis, structured thinking, or the evaluation of complex trade-offs. It is not for simple, direct tasks.

**Use Clear Thought for:**

- **Complex Decision-Making:** When there are multiple options with various pros and cons.
- **Argument Analysis & Debate:** When a topic needs to be explored from multiple perspectives.
- **System Design & Visualization:** When understanding the relationships and flows within a system is crucial.
- **Problem Decomposition:** When a problem is too large or abstract and needs to be broken down into smaller, more manageable parts.

## 2. Core Capabilities

The `ClearThought15` server provides three main tools. The correct tool must be chosen based on the nature of the problem.

| Tool | Capability | When to Use |
| :--- | :--- | :--- |
| `decisionframework` | **Structured Decision-Making** | When you need to make a rational choice between several distinct options based on weighted criteria. |
| `structuredargumentation` | **Dialectical Reasoning** | When you need to explore a topic, construct arguments, identify weaknesses, and synthesize conclusions. |
| `visualreasoning` | **System & Concept Modeling** | When the problem involves understanding relationships, processes, or hierarchies that are best represented visually. |

## 3. Activation Protocol

Before using `ClearThought15`, confirm that the problem meets at least two of the following criteria:

- [ ] **Ambiguity:** The user's request is open-ended and does not have a single, obvious answer.
- [ ] **Complexity:** The problem involves multiple interacting parts, variables, or stakeholders.
- [ ] **Comparison:** The task requires evaluating and comparing different options, arguments, or designs.
- [ ] **Abstraction:** The problem requires thinking about concepts, structures, or systems rather than concrete implementation details.

If the criteria are met, proceed to the usage workflow.

## 4. Usage Workflow

1. **Select the Right Framework:** Based on the "Core Capabilities" table above, choose the most appropriate tool (`decisionframework`, `structuredargumentation`, or `visualreasoning`). Announce which framework you will be using.
2. **Define the Problem:** Clearly state the problem or question you are addressing within the chosen framework.
    - For `decisionframework`: State the decision to be made.
    - For `structuredargumentation`: State the central claim or topic of debate.
    - For `visualreasoning`: State the system or concept to be modeled.
3. **Iterate within the Framework:** Use the tool's features to build out the analysis. This is an iterative process.
    - `decisionframework`: Define options, criteria, and weights. Evaluate each option against the criteria.
    - `structuredargumentation`: Build a thesis, antithesis, and synthesis. Use objections and rebuttals.
    - `visualreasoning`: Create nodes and edges to represent the system. Use containers and annotations to add detail.
4. **Synthesize and Conclude:** After iterating, formulate a final conclusion, recommendation, or summary based on the analysis performed within the tool.
5. **Present the Findings:** Clearly present the conclusion and a summary of the reasoning process to the user.

### Example Scenarios

- **"Should we use Library A or Library B for our new project?"**
  - **Correct Tool:** `decisionframework`
  - **Reasoning:** This is a classic decision between two options with various technical and business trade-offs (performance, community support, cost, etc.).

- **"Debate the pros and cons of monolithic vs. microservices architecture."**
  - **Correct Tool:** `structuredargumentation`
  - **Reasoning:** This requires exploring two opposing viewpoints, presenting arguments for each, and potentially synthesizing a conclusion about when to use which.

- **"Explain how our application's data flows from the user's browser to the database."**
  - **Correct Tool:** `visualreasoning`
  - **Reasoning:** This is a system flow that is best understood with a visual diagram showing components, relationships, and the path of data.
