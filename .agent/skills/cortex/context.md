# Cortex Skill: Context Architecture

> **Context:** The prompt layering strategy.

Construction of the Prompt sent to the LLM is layered (`src/cortex` responsibility):

| Layer | Name       | Content                                            | Priority   |
| :---- | :--------- | :------------------------------------------------- | :--------- |
| **1** | **Kernel** | System Directives, Safety Overrides, JSON schemas. | 🛑 Highest |
| **2** | **World**  | Environment, Weather, Location Tags.               | 🌍 High    |
| **3** | **Entity** | The Active Character's "Four-Field" snapshot.      | 👤 Medium  |
| **4** | **Query**  | The User's immediate input/action.                 | ⚡ Low     |

### The Four-Field Schema (`src/scholar`)

Data for entities is structured to separate immutable truth from mutable state:

- **Forever (Truth)**: Immutable personality, biology, core drive.
- **Present (State)**: Current status, inventory, clothing, wounds.
- **Past (Log)**: Compressed narrative history.
- **Future (Goals)**: Immediate objectives and threats.
