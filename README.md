# JooduG-default

Welcome to the JooduG-default monorepo. This repository contains a complete, AI-assisted ecosystem for developing and maintaining web applications.

## What is this?

This project is not just a collection of apps; it's a structured environment where an AI development assistant can operate effectively. It combines applications, a robust build system, extensive documentation, and a unique "rule-based" cognitive framework for an AI agent.

## Folder Overview

- **`/apps`**: Contains the primary user-facing web applications.
- **`/build`**: The "factory" of the repo. Holds all scripts, configs, and libraries for building and linting the apps.
- **`/docs`**: The project's "library." Contains all human-readable documentation, guides, and glossaries.
- **`/memory-bank`**: The AI agent's "brain," used for persistent, long-term memory and task tracking.
- **`/rules`**: The "constitution" for the AI agent. These machine-readable files govern all of the agent's behavior.
- **`/tests`**: Contains all automated tests to ensure application quality and stability.
- **`/tools`**: A "toolbox" of utility and diagnostic scripts for various maintenance tasks.

## Common Workflows

- **Building an App:** To manually build the `rpglitch` application, run the command `npm run build-rpglitch`.
- **Running Tests:** To run the entire test suite, use `npm test`.
- **Automated Building:** For active development, run `npm run watch`. This will automatically rebuild the `rpglitch` app whenever you save a change to its source files.
