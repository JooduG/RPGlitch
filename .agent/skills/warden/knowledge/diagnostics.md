# Warden Skill: Diagnostics & Resilience (The Divergence Protocol)

> **Context:** Mental debugging and assumption checking.

When a fix fails, use these questions to identify the flaw in the current mental model.

## 1. The Expectation Gap

- What did we think would happen?
- What actually happened? (Cite specific error logs or visual anomalies).

## 2. The Flawed Assumption

- What assumption did we make about the environment? (e.g., "I assumed the API was available").
- What assumption did we make about the state? (e.g., "I assumed the variable was reactive").
- What assumption did we make about the tech stack? (e.g., "I assumed Svelte 4 behavior in Svelte 5").

## 3. The Verification Failure

- Why did our previous verification step yield a False Positive?
- Was the test checking the wrong thing?
- Was the environment "polluted" during the test?

## 4. Lateral Thinking Prompts

- Is the architecture itself the bottleneck?
- Are two components fighting for control of the same state?
- If we couldn't use the current mechanism, how would we solve it differently?
