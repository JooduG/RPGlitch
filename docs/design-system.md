# **🎨 Project Design System & UI Protocol**

Version 3.0.0 · Updated 2025-09-26

**CORE PRINCIPLE:** This document is the **single source of truth** for the visual and interaction design of all applications in this repository. It defines our philosophy, our styling foundation (Pico.css), our custom component library, and our user experience patterns. All UI/UX development **MUST** adhere to these guidelines.

## **1\. Core Philosophy: The Vibe Check**

Our design philosophy is built on a foundation of minimalism, clarity, and robustness.

* **Clarity Over Cleverness:** The user should never have to guess. Functionality must be explicit and unambiguous.  
* **Minimalism with Purpose:** Every visual element must serve a purpose. We remove the unnecessary to give power to the essential.  
* **Consistency is Queen:** Similar elements must look and behave similarly across all applications. This builds trust and reduces cognitive load.  
* **Accessibility by Design:** Our interfaces must be usable and accessible to everyone. This is a non-negotiable baseline.

## **2\. Interaction & UX Principles**

### **The Icon-Free Mandate (Non-Negotiable)**

In this project, all interactive UI elements (buttons, links, navigation) **MUST** primarily convey their meaning through explicit and concise **text labels**.

* **DIRECTIVE:** **DO NOT** create UI elements that rely solely on icons to convey function.  
* **DIRECTIVE:** **MAY** use icons as a visual embellishment, but they **MUST** be paired directly alongside a clear text label.  
* **RATIONALE:** Text labels ensure universal understanding, support our minimalist aesthetic, and align with user preferences for explicit, unambiguous controls.

#### **Examples**

* ❌ **Bad:** \<button\>\<img src="save.svg"\>\</button\> *(Ambiguous)*  
* ✅ **Good:** \<button\>Save\</button\> *(Clear and direct)*  
* ✅ **Good:** \<button\>\<span class="icon-edit"\>\</span\> Edit\</button\> *(Icon as secondary indicator)*

### **General UX Patterns**

* **Progressive Disclosure:** Show essential information first; reveal details and advanced options on demand.  
* **Immediate Feedback:** Every user action should provide immediate visual feedback (e.g., hover states, loading indicators).  
* **Cancellable Actions:** All long-running AI actions **MUST** be cancellable.  
* **Responsive & Touch-Friendly:** All layouts and controls must be fully responsive and provide adequate touch targets for mobile users.

## **3\. The Visual System (The "Look")**

Our visual language is built on the **Pico.css** framework, extended with a custom, purposeful design layer.

### **Color System (Catppuccin Mocha Palette)**

All colors are applied via CSS variables for consistency and easy theming.

* 🟩 **Primary (Success, Create):** \#a6e3a1  
* 🟦 **Secondary (Information, Refine):** \#89b4fa  
* 🟪 **Accent (AI Actions):** \#cba6f7  
* 🟧 **Accent (Cancel/Caution):** \#fab387  
* 🟥 **Accent (Danger/Delete):** \#f38ba8  
* ⬛ **Surface (Containers):** \#313244  
* ⬛ **Background (Base):** \#1e1e2e  
* ⚪ **Text:** \#cdd6f4

### **Typography**

* **Font:** 'Inter', system-ui, sans-serif.  
* **Scale:** Base: 1rem (16px), Large: 1.25rem, Headings: 2rem.  
* **Hierarchy:** Use font weight and size to create a clear visual hierarchy. Bold weight is used sparingly for emphasis on primary actions and headings.

### **Spacing**

* **Base Unit:** 8px.  
* **Scale:** All margins, paddings, and gaps use multiples of the base unit (4px, 8px, 16px, 24px, 32px) for a consistent rhythm.

## **4\. The Component Library (The "Parts")**

This section defines our custom components, built on top of Pico.css.

### **Buttons**

* **Style:** Large, bold, rounded, with colors mapped to specific actions (see Color System). Disabled state is muted with a not-allowed cursor.  
* **Rule:** **MUST** follow the **Icon-Free Mandate**.

### **The "Chin" Component (RPGlitch Specific)**

The "Chin" is the signature bottom-bar container for secondary controls and options panels in RPGlitch.

* **Layout:** Constrained to the main app container width, using CSS variables for consistent padding. Hidden chins use display: none.  
* **UX:**  
  * Top-bar buttons toggle their corresponding chin panel.  
  * Pressing ESC or clicking outside the chin's boundary closes it. The outside-click close is deferred one tick to allow the target's primary handler (e.g., navigation) to run first.

### **Cards (Storyboard & List)**

* **Structure:** Use semantic HTML (\<article\>, \<header\>, \<footer\>).  
* **Layout:** Flexbox-based with justify-content: space-between and smart text wrapping (text-wrap: balance) to prevent awkward line breaks.  
* **Style:** Adhere to the project's color palette and spacing rules, with overflow: hidden for clean visual boundaries.

### **Other Components**

* **Inputs/Selects/Sliders:** Custom-styled to match the color palette, with clear blue focus states and touch-friendly sizing.  
* **Image Blocks:** Square or grid layouts with hover/tap overlays for info and actions.  
* **Overlays:** All overlays and action buttons **MUST** be text-based, following the Icon-Free Mandate.

## **5\. UI Safety & Hardening (RPGlitch Implementation)**

To ensure the application remains interactive and robust, especially within the Perchance iframe environment, RPGlitch implements a suite of safety features.

* **Overlay Guard (App.dismissLoadingUI()):** A master function to clear any lingering UI blockers. It closes loading modals, removes \[aria-busy\], hides non-open dialogs, and restores pointer-events.  
* **UI Watchdog (App.startUIWatchdog()):** A polling mechanism that runs every 500ms to detect stuck UI states (dialog\[open\], inert, etc.) and automatically calls the Overlay Guard to heal the interface.  
* **Recovery Hooks (App.installUIRecoveryHooks()):** The UI self-heals on common browser events like focus, visibilitychange, and pageshow. Also includes a panic hotkey (Ctrl+Shift+D) that invokes the Overlay Guard.  
* **Attribute Observer:** Instantly strips any newly added inert or pointer-events: none attributes on root-level containers to prevent external scripts from locking the UI.

### **Debugging Safety Features**

* Toggle verbose logs with App.setDebug(true|false).  
* Relevant console logs are prefixed with \[RPGlitch\], ui.watchdog:, and dismissLoadingUI:.

## **Changelog**

* **3.0.0 (2025-09-26)** — Major consolidation. Merged the design-icon-free-standard.md, the core design-system.md, and the rpglitch-chin-ux-and-safety.md documents into this single, canonical file. The system is now fully unified.  
* **2.0.0 (Prior Version)** — Previous version of the core design system.  
* **1.0.0 (Initial Version)** — Initial design principles.
