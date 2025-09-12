# System Organization

This document provides an overview of the structure of the JooduG-default repository. Understanding this structure is key to navigating the project and contributing effectively.

## Top-Level Directories

- **`/apps`**: Contains the primary user-facing web applications. Each subdirectory in `/apps` is a separate application.

- **`/build`**: The "factory" of the repository. This directory holds all the scripts, configurations, and libraries needed to build, lint, and test the applications.

- **`/docs`**: The project's "library." This directory contains all human-readable documentation, including guides, glossaries, and architectural overviews. This documentation is intended for developers and users.

- **`/memory-bank`**: The AI agent's "brain." This is a dedicated space for the agent to manage its persistent, long-term memory, track tasks, and store knowledge. The contents of this directory are primarily for the agent's own use.

- **`/rules`**: The "constitution" for the AI agent. This directory contains machine-readable files that govern the agent's behavior. These rules are used by the agent to make decisions and carry out tasks.

- **`/tests`**: Contains all automated tests for the applications and other parts of the system.

- **`/tools`**: A "toolbox" of utility and diagnostic scripts for various maintenance tasks.

## Key Principles

- **Separation of Concerns**: Each directory has a clear and distinct purpose. This helps to keep the repository organized and easy to understand.
- **Single Source of Truth**: Whenever possible, there should be a single source of truth for any given piece of information. For example, all build scripts are in the `/build` directory, and all documentation is in the `/docs` directory.
- **Agent-Human Collaboration**: The repository is designed to be a collaborative environment for both human developers and AI agents. The `/memory-bank` and `/rules` directories are specifically for the agent, while the rest of the repository is for human developers.
