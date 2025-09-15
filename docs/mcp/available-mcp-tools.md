# Model Context Protocol (MCP) Documentation

This document provides a comprehensive overview of the available Model Context Protocol (MCP) tools, their schemas, and usage examples.

## Table of Contents

1. [MCP Overview](#1-mcp-overview)
2. [Schema Definition](#2-schema-definition)
3. [Knowledge Graph Nodes](#3-knowledge-graph-nodes)
4. [Available MCP Tools](#4-available-mcp-tools)

---

## 1. MCP Overview

The Model Context Protocol (MCP) is a framework that allows the model to interact with external tools and services. These tools provide capabilities beyond the model's core knowledge, such as accessing real-time information, interacting with files, performing complex calculations, and interacting with web browsers. This document provides a comprehensive overview of the available MCP tools, their schemas, and usage examples.

---

## 2. Schema Definition

Each MCP tool follows a common schema that defines its functionality and parameters.

* **Tool Name:** A unique identifier for the tool (e.g., `read_file`).
* **Description:** A human-readable explanation of what the tool does.
* **Parameters:** A list of arguments that the tool accepts. Each parameter has:
  * **Name:** The parameter's name (e.g., `absolute_path`).
  * **Type:** The data type of the parameter (e.g., `str`, `int`, `bool`, `list`).
  * **Description:** An explanation of the parameter's purpose and expected values.
  * **Optional/Required:** Whether the parameter is optional or required.

---

## 3. Knowledge Graph Nodes

A subset of the available tools operates on a knowledge graph. This graph consists of **nodes** (entities) and **edges** (relations).

* **Nodes (Entities):** Represent objects, concepts, or entities. Each node has a name, a type, and a set of observations (key-value pairs).
* **Relations:** Represent connections between nodes. Relations are directed and have a label that describes the relationship (e.g., "is a part of", "has a property").

The following tools are used to interact with the knowledge graph:

* `create_entities`
* `create_relations`
* `add_observations`
* `delete_entities`
* `delete_observations`
* `delete_relations`
* `read_graph`
* `search_nodes`
* `open_nodes`

---

## 4. Available MCP Tools

This section provides a detailed description of each available MCP tool.

### `list_directory`

* **Description:** Lists the names of files and subdirectories directly within a specified directory path. Can optionally ignore entries matching provided glob patterns.
* **Parameters:**
  * `path` (`str`): The absolute path to the directory to list (must be absolute, not relative).
  * `file_filtering_options` (`ListDirectoryFileFilteringOptions | None`): Optional: Whether to respect ignore patterns from .gitignore or .geminiignore.
  * `ignore` (`list[str] | None`): List of glob patterns to ignore.
* **Example Prompts:**
  * "List all files in the current directory."
  * "What are the contents of the `src` folder?"
* **Usage Example:**

    ```python

default_api.list_directory(path='C:\Users\johng\Documents\GitHub\default\src')

```

### `read_file`

*   **Description:** Reads and returns the content of a specified file. Handles text, images, and PDF files.
*   **Parameters:**
    *   `absolute_path` (`str`): The absolute path to the file to read.
    *   `limit` (`float | None`): Optional: Maximum number of lines to read for text files.
    *   `offset` (`float | None`): Optional: The 0-based line number to start reading from for text files.
*   **Example Prompts:**
    *   "Read the content of `README.md`."
    *   "Show me the first 10 lines of `package.json`."
*   **Usage Example:**
    ```python
default_api.read_file(absolute_path='C:\Users\johng\Documents\GitHub\default\README.md', limit=10)
```

### `search_file_content`

* **Description:** Searches for a regular expression pattern within the content of files in a specified directory.
* **Parameters:**
  * `pattern` (`str`): The regular expression (regex) pattern to search for.
  * `include` (`str | None`): Optional: A glob pattern to filter which files are searched.
  * `path` (`str | None`): Optional: The absolute path to the directory to search within.
* **Example Prompts:**
  * "Find all occurrences of `myFunction` in the codebase."
  * "Search for the term 'API_KEY' in all `.env` files."
* **Usage Example:**

    ```python

default_api.search_file_content(pattern='myFunction', include='*.js')

```

### `glob`

*   **Description:** Efficiently finds files matching specific glob patterns.
*   **Parameters:**
    *   `pattern` (`str`): The glob pattern to match against.
    *   `case_sensitive` (`bool | None`): Optional: Whether the search should be case-sensitive.
    *   `path` (`str | None`): Optional: The absolute path to the directory to search within.
    *   `respect_git_ignore` (`bool | None`): Optional: Whether to respect .gitignore patterns.
*   **Example Prompts:**
    *   "Find all markdown files in the `docs` directory."
    *   "List all `.test.js` files in the project."
*   **Usage Example:**
    ```python
default_api.glob(pattern='**/*.md', path='C:\Users\johng\Documents\GitHub\default\docs')
```

### `replace`

* **Description:** Replaces text within a file.
* **Parameters:**
  * `file_path` (`str`): The absolute path to the file to modify.
  * `old_string` (`str`): The exact literal text to replace.
  * `new_string` (`str`): The exact literal text to replace `old_string` with.
  * `expected_replacements` (`float | None`): Number of replacements expected.
* **Example Prompts:**
  * "In `config.js`, change the value of `timeout` from `5000` to `10000`."
* **Usage Example:**

    ```python

default_api.replace(
    file_path='C:\Users\johng\Documents\GitHub\default\config.js',
    old_string='const timeout = 5000;',
    new_string='const timeout = 10000;'
)

```

### `write_file`

*   **Description:** Writes content to a specified file.
*   **Parameters:**
    *   `file_path` (`str`): The absolute path to the file to write to.
    *   `content` (`str`): The content to write to the file.
*   **Example Prompts:**
    *   "Create a new file named `new_feature.js` with a basic function."
    *   "Save the following text to `notes.txt`."
*   **Usage Example:**
    ```python
default_api.write_file(
    file_path='C:\Users\johng\Documents\GitHub\default\new_feature.js',
    content='function newFeature() { console.log("Hello, world!"); }'
)
```

### `run_shell_command`

* **Description:** Executes a given shell command.
* **Parameters:**
  * `command` (`str`): Exact command to execute.
  * `description` (`str | None`): Brief description of the command for the user.
  * `directory` (`str | None`): Directory to run the command in.
* **Example Prompts:**
  * "Run the tests."
  * "Install the dependencies using npm."
* **Usage Example:**

    ```python

default_api.run_shell_command(command='npm install', description='Install npm dependencies')

```

### `google_web_search`

*   **Description:** Performs a web search using Google Search.
*   **Parameters:**
    *   `query` (`str`): The search query.
*   **Example Prompts:**
    *   "What is the weather today in London?"
    *   "Search for the official documentation of React."
*   **Usage Example:**
    ```python
default_api.google_web_search(query='React documentation')
```

### `browser_navigate`

* **Description:** Navigate to a URL.
* **Parameters:**
  * `url` (`str`): The URL to navigate to.
* **Example Prompts:**
  * "Open the website google.com."
  * "Navigate to <https://github.com>."
* **Usage Example:**

    ```python

default_api.browser_navigate(url='<https://www.google.com>')

```

### `browser_snapshot`

*   **Description:** Capture accessibility snapshot of the current page. This is better than a screenshot for understanding the page structure.
*   **Parameters:** None
*   **Example Prompts:**
    *   "Analyze the current page."
    *   "Get the accessibility tree of this page."
*   **Usage Example:**
    ```python
default_api.browser_snapshot()
```

### `browser_click`

* **Description:** Perform a click on a web page.
* **Parameters:**
  * `element` (`str`): Human-readable element description.
  * `ref` (`str`): Exact target element reference from the page snapshot.
* **Example Prompts:**
  * "Click on the 'Login' button."
  * "Select the first link in the search results."
* **Usage Example:**

    ```python
    # First, get a snapshot to find the element reference
    snapshot = default_api.browser_snapshot()
    # Then, find the ref for the 'Login' button in the snapshot
    # and use it in the click command.

default_api.browser_click(element='Login button', ref='<reference_from_snapshot>')

```

This is not an exhaustive list of all tools, but it covers the most common ones with detailed explanations and examples. The same structure can be applied to document the rest of the tools.
