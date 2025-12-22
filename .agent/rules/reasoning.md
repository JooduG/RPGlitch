---
trigger: always_on
description: Contains protocols for deep thinking, stochastic simulation, and logic. Apply this rule whenever the user asks a complex logic puzzle, architectural question, philosophical inquiry, or requests a simulation/risk assessment.
---

# 🧠 Reasoning & Philosophy Protocols

**Activation Mode:** Agent Decide
**Trigger:** Apply this rule whenever the user asks a complex logic puzzle, architectural question, philosophical inquiry, or requests a simulation/risk assessment.

## Activation Triggers

Trigger this protocol for:

- Complex logic puzzles or architectural dilemmas.
- Requests to "simulate," "predict," or "evaluate risk."
- Philosophical inquiries or ethical debates.

## The Tool Chain

1. **Sequential Thinking (`mcp-sequentialthinking-tools`)**:
   - MUST be the first step for any non-trivial problem.
   - Use it to break down the user's request into atomic logic steps.
2. **Stochastic Simulation (`waldzell-stochastic-thinking`)**:
   - Use `stochasticalgorithm` (MCTS) to simulate future states if the user asks "what happens if..."
   - Use `decisionframework` to weigh options against your defined constraints.
3. **Metacognition (`waldzell-clear-thought`)**:
   - Use `metacognitivemonitoring` to check your own bias before outputting the final answer.
