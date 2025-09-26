# **📁 Folder: /src**

## **🎯 Purpose**

This directory is the project's **Shared Code Library**. It contains all the core source code—modules, utilities, and foundational components—that are designed to be reused across multiple applications within this monorepo.

While the [/apps](https://www.google.com/search?q=../apps/README.md) directory contains the self-contained, user-facing applications, /src holds the shared, application-agnostic DNA that they might inherit or depend upon.

## **🗺️ Library Layout**

The library is organized to be self-contained and rigorously testable:

* [**/main**](https://www.google.com/search?q=./main/)**:** The actual source code for the shared modules and utilities.  
* [**/tests**](https://www.google.com/search?q=./tests/)**:** The corresponding unit and integration tests for the code in /main.

## **💡 Core Philosophy**

Code that lives in /src is held to the highest standard of quality. It **MUST** be:

* **Application-Agnostic:** Designed without knowledge of any specific application's business logic.  
* **Highly Reusable:** Built for general-purpose use cases.  
* **Rigorously Tested:** Every module must have comprehensive test coverage.

## **🔗 Governing Protocols**

All development within this directory is governed by the Universal Agent Protocol and the project's core coding standards.

* **Master Protocol:** [../AGENTS.md](https://www.google.com/search?q=../AGENTS.md)  
* **Rule Loading Logic:** [../rules/system-rule-interactions.md](https://www.google.com/search?q=../rules/system-rule-interactions.md)  
* **JavaScript Bible:** [../rules/js-guide.md](https://www.google.com/search?q=../rules/js-guide.md)
