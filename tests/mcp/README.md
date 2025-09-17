# 📁 Folder: tests/mcp

## 🎯 Purpose

This directory contains tests specifically designed for the Model Context Protocol (MCP) integrations and related functionalities. Its purpose is to ensure the correct operation, reliability, and data integrity of AI agent interactions with various MCP servers and tools.

---

## 📜 Folder-Specific Rules & AI Directives

* **Human Rules:** All MCP integrations and functionalities must have dedicated tests located in this directory. Tests should validate the communication protocols, data exchange, and expected behavior of interactions with MCP servers. Adhere to established testing patterns.
* **🤖 AI Directives:** AI, when developing or modifying MCP integrations or any code that interacts with MCP tools, you must create or update corresponding tests in this directory. Ensure these tests cover various scenarios, including successful interactions, error handling, and edge cases for MCP communication.

---

## 🔗 Overarching Rules (Single Source of Truth)

This folder adheres to the following project-wide guidelines:

* [MCP Guide](../../rules/mcp-guide.md)
* [Agent Protocol (AGENTS.md)](../../../AGENTS.md)

---

## ✅ TODO

* [ ] Expand test coverage for all MCP tools and their interactions to ensure comprehensive validation.
* [ ] Implement end-to-end tests for complex MCP workflows to verify multi-step agent operations.

---

## 💡 Usage / Notes

These tests are vital for verifying the reliability and correctness of the AI agent's ability to interact with external tools and services via the MCP. Passing these tests provides confidence in the agent's operational capabilities and its adherence to the protocol.
