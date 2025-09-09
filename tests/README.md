# Tests Overview

This directory contains all automated tests for the applications within the JooduG-default monorepo. These tests are crucial for ensuring the quality, stability, and correctness of the codebase.

## Purpose

The tests serve several key purposes:

- **Regression Prevention:** Catch bugs introduced by new changes.
- **Behavioral Verification:** Ensure that features behave as expected.
- **Code Quality:** Promote better code design and modularity.
- **AI Development Aid:** Provide a safety net for the AI agent when making modifications, allowing it to verify its changes.

## Structure

Tests are organized to mirror the application structure where appropriate.

- **Unit Tests:** Focus on individual functions or components in isolation.
- **Integration Tests:** Verify the interaction between multiple components.
- **End-to-End Tests:** Simulate user flows to ensure the entire application works correctly.

## Running Tests

- To run the entire test suite, use the command: `npm test`
- To run specific tests, you can often pass a path to the test runner (e.g., `npm test -- tests/chin-grid.test.js`).

## Adding New Tests

- When adding new features or fixing bugs, always write corresponding tests.
- Ensure new tests adhere to the existing testing conventions and style.
- Consult the relevant `js-*.md` rules for JavaScript testing best practices.