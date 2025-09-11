# Memory Bank

This directory is the "brain" of the AI agent, used for persistent, long-term memory, task tracking, and knowledge management. It is managed by the **Basic Memory MCP**.

The structure is organized into several distinct temporal and logical buckets:

## Core Directories

- **`/forever`**: Stores foundational principles, core identity rules, and critical evergreen guides that should always be referenced.
- **`/present`**: Contains documents and notes relevant to the *current, active task*. This is the AI's short-term working memory.
- **`/past`**: An archive of completed tasks, historical context, and past decisions.
- **`/future`**: A backlog for ideas, plans, and potential initiatives that are not yet committed.

## How It Works

The AI agent uses the files within these directories to maintain context across sessions, learn from past actions, and follow established guidelines. The `basic-memory-config.json` file in this directory defines how the Basic Memory tool indexes and interacts with these contents.
