---
description: Run TDD workflow — write failing tests, implement, verify. For bugs, use the Prove-It pattern.
---

# [/test](./test.md) - Test-Driven Development (TDD) Loop

Invoke the [Test-Driven Development](../skills/test-driven-development/SKILL.md) skill.

For new features:

1. Write tests that describe the expected behavior (they should FAIL)
2. Implement the code to make them pass
3. Refactor while keeping tests green

For bug fixes (Prove-It pattern):

1. Write a test that reproduces the bug (must FAIL)
2. Confirm the test fails
3. Implement the fix
4. Confirm the test passes
5. Run the full test suite for regressions

For browser-related issues, also invoke the [Browser Testing with DevTools](../skills/browser-testing-with-devtools/SKILL.md) skill to verify with Chrome DevTools MCP.
