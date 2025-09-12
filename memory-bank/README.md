# Memory Bank

This directory serves as the AI agent's "brain." It is a dedicated space for the agent to manage its persistent, long-term memory, track tasks, and store knowledge acquired during its operations. This directory is essential for the agent's ability to learn, maintain context across sessions, and follow established protocols.

The contents of this directory are primarily for the agent's own use and are not intended to be general project documentation. For project documentation, please see the `/docs` directory.

## Directory Structure

The Memory Bank is organized into a logical structure that separates information based on its temporal relevance and purpose:

- **`/forever`**: This directory contains foundational knowledge that the agent should retain indefinitely. This includes core principles, standard operating procedures (SOPs), and other critical information that forms the basis of the agent's behavior.

- **`/past`**: This directory serves as a historical archive of the agent's activities. It contains records of completed tasks, past decisions, and other significant events. This allows the agent (and developers) to review past work and learn from previous experiences.

- **`/present`**: This is the agent's active workspace. It holds all information relevant to the current task, including plans, notes, and temporary files. This directory is cleared or archived at the beginning of each new task.

- **`/future`**: This directory is for planning and long-term goals. It contains ideas, proposed tasks, and other information about work that is not yet in progress.

- **`/archive`**: This directory is for information that is no longer in active use but needs to be retained for reference. This is different from the `/past` directory, which is a record of completed work. The `/archive` is for deprecated information, old code snippets, and other materials that are not part of the main historical record but might be useful in the future.

## Key Files

- **`scribbles.md`**: A "scratchpad" for the agent to make quick notes or jot down thoughts that don't fit into the more structured directories.

- **`basic-memory-config.json`**: A configuration file for the Basic Memory tool, defining how the agent indexes and interacts with the contents of the Memory Bank.
