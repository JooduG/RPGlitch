# **📁 Folder: /apps/imageglitch**

## **🎯 Purpose**

This folder contains the ImageGlitch application, a minimalist Text-to-Image generator built for the Perchance platform.

It serves as a lean, focused implementation of the project's core architectural principles, making it an ideal starting point for understanding the **Two-Panel Architecture** and the single-file build flow. It is the simple, elegant sibling to the more complex RPGlitch application.

## **💡 The Blueprint (Key Files & Commands)**

This application follows the standard Perchance development lifecycle, transforming source files into a single, deployable artifact.

* Left Panel (Logic):  
  apps/imageglitch/ImageGlitch-left-panel.txt  
* Right Panel (UI Source):  
  apps/imageglitch/html/index.html  
* Final Output (UI Compiled):  
  build/output/ImageGlitch.html  
* **Build Command:**  

´´´
  npm run build:imageglitch
´´´

* **Deployment:** The content of the **Final Output** is pasted into the **right panel** of the Perchance editor. The content of the **Left Panel** file is pasted into the **left panel**.

## **🔗 Governing Protocols**

All activities within this directory are governed by the Universal Agent Protocol and its supplemental, context-specific rules. For a complete understanding of operational procedures, consult the master rule files.

* **Master Protocol:** [../AGENTS.md](../../AGENTS.md)  
* **Perchance Bible:** [../rules/perchance.md](../../rules/perchance.md)  
* **Rule Loading Logic:** [../rules/README.md](../../rules/README.md)
