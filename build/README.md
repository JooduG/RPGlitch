# **📁 Folder: /build**

## **🎯 Purpose**

This directory is the project's **factory floor**. It contains all the essential machinery (/scripts), blueprints (/config), and raw materials (/local\_libs) required to transform the source code from /apps into the final, deployable artifacts delivered to /build/output.

## **🗺️ Factory Layout**

The build system is organized into the following key areas, each with a distinct role in the production pipeline:

* [**/config**](https://www.google.com/search?q=./config/README.md)**:** The **Blueprints Department**. This is the single source of truth for all project configurations, including settings for linters (ESLint, Stylelint), testing frameworks (Jest), and the Model Context Protocol (MCP).  
* [**/scripts**](https://www.google.com/search?q=./scripts/README.md)**:** The **Assembly Line**. This contains all the automation scripts that perform the actual work of building, combining, syncing, and validating the applications.  
* [**/local\_libs**](https://www.google.com/search?q=./local_libs/)**:** The **Supply Closet**. This holds vendored, third-party libraries (like Pico.css and Dexie.js) to ensure the build process is self-contained and avoids reliance on external CDNs.  
* [**/output**](https://www.google.com/search?q=./output/)**:** The **Loading Dock**. This is a strictly-managed, AI-inaccessible directory where the final, compiled application files are placed, ready for deployment. **RULE:** Files in /output must never be edited manually.

## **💡 Core Operations**

The primary function of this factory is to execute the build process, which is orchestrated by the scripts in the /scripts directory. These scripts are invoked via npm commands.

For a definitive list of all available build, test, and sync commands, you **MUST** refer to the scripts section of the root [package.json](https://www.google.com/search?q=../package.json) file.

## **🔗 Governing Protocols**

All activities within this directory are governed by the Universal Agent Protocol and its supplemental, context-specific rules. For a complete understanding of operational procedures, consult the master rule files.

* **Master Protocol:** [../AGENTS.md](https://www.google.com/search?q=../AGENTS.md)  
* **Rule Loading Logic:** [../rules/system-rule-interactions.md](https://www.google.com/search?q=../rules/system-rule-interactions.md)
