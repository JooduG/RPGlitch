# **📁 Folder: /tests**

## **🎯 Purpose**

This directory is the project's **Quality Assurance Department & Safety Net**. It contains all the automated tests that verify the functionality, stability, and correctness of the applications and the core system.

If [/build](https://www.google.com/search?q=../build/README.md) is the factory, then this folder is the final inspection line. Its purpose is to catch regressions, validate new features, and ensure that every piece of code that ships is flawless and production-ready.

## **🗺️ The QA Floor (Structure)**

The testing strategy is organized to mirror the project's structure:

* **Application Tests:** The root of this folder contains tests for the user-facing applications (e.g., imageglitch.test.js, rpglitch.test.js).  
* **Shared Component Tests:** Tests for the reusable, shared code library live alongside the code they are testing, in [/src/tests/](https://www.google.com/search?q=../src/tests/).  
* **AI & Tooling Tests:** Specialized tests for the AI's tool integrations are located in [/mcp/](https://www.google.com/search?q=./mcp/).

## **💡 Core Philosophy: The Law of the Land**

The testing philosophy is simple and non-negotiable: **No feature ships without a test. No bug is fixed without a test.** Tests are the ultimate backstop that allows both human and AI developers to contribute with confidence and speed.

### **How to Run Tests**

To invoke the entire QA department and run the full suite of project tests, use the following command from the root directory:

´´´
npm test
´´´

## **🔗 Governing Protocols**

All testing practices are governed by the Universal Agent Protocol and the project's coding standards.

* **Master Protocol:** [../AGENTS.md](https://www.google.com/search?q=../AGENTS.md)  
* **Rule Loading Logic:** [../rules/system-rule-interactions.md](https://www.google.com/search?q=../rules/system-rule-interactions.md)  
* **JavaScript Bible:** [../rules/js-guide.md](https://www.google.com/search?q=../rules/js-guide.md)
