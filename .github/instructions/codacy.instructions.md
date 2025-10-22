---
description: "Configuration for AI behavior when interacting with Codacy's MCP Server."
---

# Codacy Rules

## After File Edits

- **Action**: After any successful file edit, you **must** immediately run the `codacy_cli_analyze` tool on the edited file.
- **Parameters**:
  - `rootPath`: Workspace path.
  - `file`: Path of the edited file.
- **Note**: This is a critical step.

## Uninstalled Codacy CLI

- **Action**: If the Codacy CLI is not installed, ask the user if they'd like to install it.
- **Response**:
  - **Yes**: Run `codacy_cli_install`.
  - **No**: Inform the user they can disable automatic analysis in their settings.

## Unavailable Codacy MCP Server

- **Action**: If the MCP Server is unavailable, suggest the following troubleshooting steps:
  1. Reset the MCP on the extension.
  2. Review Copilot > MCP settings in GitHub.
  3. Contact Codacy support if the issue persists.

## After Dependency Changes

- **Action**: After any package manager operations (e.g., `npm install`), you **must** run a security scan.
- **Tool**: `codacy_cli_analyze`
- **Parameters**:
  - `rootPath`: Workspace path.
  - `tool`: "trivy"
- **Note**: Resolve any new vulnerabilities before continuing.

## General Guidelines

- Apply these rules to every modified file.
- "Propose fixes" includes both suggesting and applying them.
- Do not wait for the user to request an analysis.
- Do not use `codacy_cli_analyze` for code coverage, duplicated code, or complexity metrics.
- When a Codacy tool returns a 404 error, offer to run `codacy_setup_repository`.
