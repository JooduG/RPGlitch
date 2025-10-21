# **📁 Folder: /apps/rpglitch**

## **🎯 Purpose**

This folder contains the RPGlitch application, a dynamic tool for managing role-playing game entities, storyboards, and character profiles.

It serves as the project's flagship Perchance application and the primary reference implementation of the **Two-Panel Architecture**. Where ImageGlitch is the simple proof-of-concept, RPGlitch is the feature-rich, complex powerhouse, demonstrating the full capabilities of our development patterns.

## **💡 The Blueprint (Key Files & Commands)**

This application follows the standard Perchance development lifecycle, transforming a rich set of source files into a single, deployable artifact.

* Left Panel (Logic): apps/rpglitch/RPGlitch-left-panel.txt  
* Right Panel (UI Source): apps/rpglitch/html/index.html  
* Final Output (UI Compiled): build/output/RPGlitch.html  
* **Build Command:** npm run build:rpglitch
* **Deployment:** The content of the **Final Output** is pasted into the **right panel** of the Perchance editor. The content of the **Left Panel** file is pasted into the **left panel**.

## **🔗 Governing Protocols**

All activities within this directory are governed by the Universal Agent Protocol and its supplemental, context-specific rules. For a complete understanding of operational procedures, consult the master rule files.

* **Master Protocol:** [../AGENTS.md](../../AGENTS.md)  
* **Perchance Bible:** [../rules/perchance.md](../../rules/perchance.md)  
* **Rule Loading Logic:** [../rules/README.md](../../rules/README.md)  
* **App-Specific UX Guide:** [../../docs/design-system.md](../../docs/design-system.md)
