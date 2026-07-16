# **Engineering Solid-State View Transitions in Svelte 5 Single Page Applications**

In highly styled client-side web applications, presenting interactive user interface components as heavy, solid hardware requires transitions where elements translate, scale, and morph across layout areas without visual breaks1. In standard declarative frameworks, switching layouts or invoking route changes triggers a reconciliation routine that unmounts components in the old view and mounts new instances in the target layout2. This destruction and recreation cycle invalidates the browser's element-matching heuristics, causing the View Transitions API to fall back to a default opacity fade-in/fade-out animation1.  
To maintain the illusion of continuous physical structures, layout components must never fade, flicker, or cross-fade2. While hoisting state to a global root-level wrapper avoids unmounting, it introduces tight architectural coupling, pollutes the top-level scope, and limits scalability. Svelte 5's fine-grained reactivity system, powered by signals and runes, provides a clean alternative5. Because Svelte compiles components directly to targeted DOM operations rather than using a Virtual DOM, developers can use direct DOM reparenting to shift live nodes across layout slots without unmounting, preserving local state and keeping view transitions intact7.

## **Architectural Framework for Non-Destructive DOM Reparenting**

Traditional component lifecycles tie a DOM element's existence to its position in the declarative template hierarchy4. When conditional blocks ({\#if}) or client-side routers update the layout, components outside the active path are unmounted and garbage collected2. This unmounting breaks view transitions because the browser cannot match an element that is destroyed in the first frame of a layout shift1.

### **The Limbo-Portal Design Pattern**

The Limbo-Portal pattern solves this issue by separating a component's lifecycle ownership from its viewport rendering position7. This pattern uses three main structural layers:

1. **The Limbo Lifecycle Container:** A hidden container placed at a persistent level of the application hierarchy7. This container initializes the component, manages its lifecycle, and acts as a safe fallback space when the component is not active in any layout7. Because this container is never unmounted during view switches, the target component remains continuously alive in memory7.  
2. **The Portal Slots:** Visible placeholders positioned within layout grids, sidebars, or routed views7. These slots act as destination anchors but do not declare or instantiate the target elements themselves7.  
3. **The Teleportation Registry:** A centralized reactive module that tracks the mapped location of each reparented component and coordinates node migration7.

When the layout state changes, the registry updates its mapping7. The receiving portal detects this update and uses the browser's native appendChild method to pull the DOM node into its container7. Because appendChild shifts the element in-place within the browser's document tree, the node's internal state, active event listeners, input values, and focus states remain completely intact7.

| State Preservation Approach | Local DOM State | Event Listener Retention | Hierarchy Isolation | Implementation Complexity |
| :---- | :---- | :---- | :---- | :---- |
| **State Hoisting** | Reset on unmount (must be manually serialized) | Rebound on mount (causes garbage collection overhead) | Low (pollutes global root state) | Moderate |
| **Limbo-Portal Pattern** | Completely preserved (retains focus, inputs, and selections)7 | Retained natively (no listener re-binding)7 | High (retains local encapsulated state) | High (requires architectural coordination) |
| **SvelteKit Snapshots** | Serialized to page history (fails to preserve active DOM instances)10 | Destroyed and recreated | Moderate (bound to page navigation)10 | Low10 |

### **State Preservation in Headless UI Components**

When utilizing headless libraries such as bits-ui (which are built on stateful, ARIA-compliant primitives), preserving internal interactive states during layout shifts is critical11. If a component is destroyed and remounted, open dropdown menus, scroll positions, active selections, and keyboard focus are lost.  
By utilizing the Limbo-Portal pattern to reparent elements, these interactive states are preserved automatically7. Because the component is never unmounted, the JavaScript closure scopes and active state variables (managed via Svelte 5 runes like $state) do not reset7. The underlying headless logic remains unaware of the physical DOM move, maintaining keyboard navigation rings and ARIA accessibility properties7.

### **Implementing Programmatic Snippets in Svelte 5**

Svelte 5 replaces legacy slot mechanics with snippets, which represent reusable fragments of reactive markup3. For advanced programmatic layout engines, the framework provides the createRawSnippet API, allowing developers to generate rendering fragments dynamically in JavaScript or TypeScript13.

TypeScript  
function createRawSnippet\<Params extends unknown\[\]\>(  
  fn: (...params: Getters\<Params\>) \=\> {  
    render: () \=\> string;  
    setup?: (element: Element) \=\> void | (() \=\> void);  
  }  
): Snippet\<Params\>;

In a persistent layout architecture, createRawSnippet acts as an adapter16. When a portal receives a programmatically generated layout block, the setup hook captures the root element and registers it with the teleportation orchestrator, allowing dynamic layout builders to treat actual DOM sub-trees as portable rendering fragments13.

## **Synchronizing Svelte 5 Reactive Runtimes with View Transition Lifecycles**

The View Transitions API captures visual snapshots of the active document state before and after DOM modifications1. For this mechanism to function, the state updates that alter the visual presentation of Svelte components must be executed in synchrony with the browser's snapshot capture lifecycle17.

### **Reactivity Coordination and Synchronous Execution**

In Svelte 5, reactivity is managed via fine-grained signals known as runes, which batch visual updates asynchronously to optimize performance5. When triggering a view transition, this asynchronous scheduling can cause the browser to capture the "old" snapshot, execute its state transition, and take the "new" snapshot before the Svelte compiler has pushed the reactive updates to the DOM2. To prevent visual inconsistencies or fallback cross-fades, updates must be processed synchronously using flushSync13.

| Synchronizer Option | Trigger Mechanism | DOM Readiness Guarantee | Thread-Blocking Characteristics | Ideal Use Case |
| :---- | :---- | :---- | :---- | :---- |
| **tick()** | Asynchronous promise resolution1 | Ready on next microtask2 | Non-blocking (yields to main thread) | Standard reactive state syncs and list updates19 |
| **flushSync()** | Immediate synchronous DOM flush13 | Guaranteed immediately after function call13 | Temporarily blocking (forces layout recalculation)20 | Critical visual transitions requiring immediate snapshots17 |

Using flushSync ensures that Svelte's reactive runtime processes all pending mutations immediately13. This allows the browser to capture the updated DOM state before yielding to the next animation frame, preventing visual flickers and layout mismatches2.

### **Decoupling URL Resolution from DOM Modification**

A major limitation of view transitions during route changes is the synchronization of asynchronous payloads21. If a transition is triggered concurrently with an API request, the browser captures the initial skeleton state22. When the payload eventually resolves, the content swaps abruptly, destroying the illusion of a solid physical morph2.  
To orchestrate this, client-side routing architectures must decouple URL resolution from DOM modification22. Framework-agnostic SPA routers, such as Svelte Simple Router, handle this by using dedicated lifecycle hooks like onChange, onLoading, and onLoaded22. By pre-fetching asynchronous page data before updating the view-state, the application ensures that the post-transition snapshot captures the fully loaded, visually complete target component21.

## **Advanced CSS Configurations for Rigid-Body Morphing**

To preserve the mechanical illusion of heavy machinery, transitions must behave as rigid geometric bodies1. By default, the View Transitions API implements an opacity fade combined with a custom blending model to execute a smooth cross-fade1.

### **Suppressing Default Transition Blending**

During transition execution, the browser wraps the snapshots inside pseudo-elements: ::view-transition-old and ::view-transition-new1. These pseudo-elements utilize mix-blend-mode: plus-lighter within an isolated container (::view-transition-image-pair having isolation: isolate) to blend identical pixels cleanly1. To suppress this cross-fade and force a purely geometric morph, the default blending behavior must be overridden1:

CSS  
/\* Scoped overrides to enforce rigid-body morphs on machinery cards \*/  
::view-transition-group(machinery-card) {  
  animation-duration: 480ms;  
  animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1); /\* Quick initial motion, gradual settle \*/  
}

/\* 1\. Fully suppress default opacity fade-out \*/  
::view-transition-old(machinery-card) {  
  animation: none;  
  opacity: 0 \!important;  
  mix-blend-mode: normal \!important;  
}

/\* 2\. Display the incoming state fully opaque during translation and scaling \*/  
::view-transition-new(machinery-card) {  
  animation: none;  
  opacity: 1 \!important;  
  mix-blend-mode: normal \!important;  
  height: 100% \!important;  
  width: 100% \!important;  
}

This configuration relies on the browser's scale and translation transformations during layout shifts:  
![][image1]  
where ![][image2] and ![][image3] are scaling vectors, and ![][image4] and ![][image5] are 2D translation offsets calculated relative to the viewport.  
By disabling the exit animation (opacity: 0\) and keeping the entry element solid (opacity: 1), the browser interpolates the bounding box boundaries within the morphing group1. This forces the live representation of the new element to scale and move smoothly, matching the target grid slot without opacity shifts or fading1.

### **Resolving Nested Transition Conflicts**

When nesting animated elements inside a parent container that also has an active transition name, conflict issues can arise1. If a parent card undergoes an aspect-ratio shift while its nested child elements (such as control buttons, input fields, or icons) have their own view-transition-name assignments, the browser extracts the children into independent overlay layers1. This causes the child elements to float or drift outside the parent's boundaries during the morph.  
To resolve this nested layout conflict, the unique transition names of child elements must be removed during macro-layout shifts1. This forces the nested elements to render as part of the parent container's overall snapshot. Once the transition completes, these names can be restored to allow micro-animations during normal layout modes1.

Svelte  
\<\!-- NestedControl.svelte \--\>  
\<script lang="ts"\>  
  interface Props {  
    controlId: string;  
    isParentMorphing: boolean;  
  }  
  let { controlId, isParentMorphing }: Props \= $props();  
\</script\>

\<div   
  class="interactive-control-panel"  
  style:view-transition-name={isParentMorphing ? 'none' : \`control-panel-${controlId}\`}  
\>  
  \<button   
    class="machinery-knob"  
    style:view-transition-name={isParentMorphing ? 'none' : \`knob-${controlId}\`}  
  \>  
    Interface Actuator  
  \</button\>  
\</div\>

## **Community Ecosystem Tools and Implementation Protocols**

Several client-side tools and routing libraries support view transitions within Svelte 5 SPAs:

- **@dvcol/svelte-simple-router**: A client-side router built for Svelte 522. It integrates Svelte's transition pipeline and the browser's View Transitions API22. The router allows developers to return custom transition promises from lifecycle hooks like onChange and onStart, ensuring layout transitions are executed cleanly during page changes22.  
- **svelte5-router**: An alternative routing library that supports client-side navigation middleware25. This middleware can coordinate authentication checks, data pre-fetching, and view-state rendering, ensuring snapshots are not captured while the application is in an incomplete loading state25.  
- **svelte-reparent**: A DOM utility that implements a borrowing model to shift nodes between Limbo and Portal containers while maintaining active state values7.

The following production-ready templates illustrate a custom implementation of the Limbo-Portal pattern and reactivity synchronization using Svelte 5\.

### **1\. Central Portal Orchestration Module**

This class tracks active DOM elements and manages layout targets within a view transition context27.

TypeScript  
// src/lib/state/portal-registry.svelte.ts  
import { setContext, getContext, flushSync } from 'svelte';

class PortalRegistry {  
  // Map structures to track node references and layouts  
  \#nodes \= $state\<Map\<string, HTMLElement\>\>(new Map());  
  \#limboContainers \= $state\<Map\<string, HTMLElement\>\>(new Map());  
  \#layoutTargets \= $state\<Map\<string, string\>\>(new Map());

  registerNode(id: string, node: HTMLElement, limbo: HTMLElement) {  
    this.\#nodes.set(id, node);  
    this.\#limboContainers.set(id, limbo);  
    if (\!this.\#layoutTargets.has(id)) {  
      this.\#layoutTargets.set(id, ''); // Default state is hidden in limbo  
    }  
  }

  unregisterNode(id: string) {  
    this.\#nodes.delete(id);  
    this.\#limboContainers.delete(id);  
    this.\#layoutTargets.delete(id);  
  }

  getCurrentTarget(id: string): string {  
    return this.\#layoutTargets.get(id) || '';  
  }

  getNodeReference(id: string): HTMLElement | undefined {  
    return this.\#nodes.get(id);  
  }

  /\*\*  
   \* Safe view transition wrapper that updates targets   
   \* and synchronizes the change directly with the DOM.  
   \*/  
  repositionElement(id: string, targetPortalId: string) {  
    if (\!document.startViewTransition) {  
      this.\#layoutTargets.set(id, targetPortalId);  
      return;  
    }

    // Force a synchronous DOM update inside the view transition callback  
    document.startViewTransition(() \=\> {  
      flushSync(() \=\> {  
        this.\#layoutTargets.set(id, targetPortalId);  
      });  
    });  
  }

  reclaimToLimbo(id: string, portalId: string) {  
    if (this.\#layoutTargets.get(id) \=== portalId) {  
      this.\#layoutTargets.set(id, '');  
      const element \= this.\#nodes.get(id);  
      const limbo \= this.\#limboContainers.get(id);  
      if (element && limbo) {  
        limbo.appendChild(element); // Safely return node to limbo  
      }  
    }  
  }  
}

const REGISTRY\_SYMBOL \= Symbol('PORTAL\_REGISTRY');

export function initPortalRegistry() {  
  const registry \= new PortalRegistry();  
  setContext(REGISTRY\_SYMBOL, registry);  
  return registry;  
}

export function usePortalRegistry() {  
  return getContext\<PortalRegistry\>(REGISTRY\_SYMBOL);  
}

### **2\. Limbo Container Component**

This component manages the creation and lifecycle of the persistent element, storing it in a hidden container to prevent unmounting7.

Svelte  
\<\!-- src/lib/components/Limbo.svelte \--\>  
\<script lang="ts"\>  
  import { onMount, onDestroy, type Snippet } from 'svelte';  
  import { usePortalRegistry } from '$lib/state/portal-registry.svelte';

  interface Props {  
    nodeId: string;  
    children: Snippet;  
  }

  let { nodeId, children }: Props \= $props();  
  const registry \= usePortalRegistry();  
  let containerElement \= $state\<HTMLDivElement | null\>(null);

  onMount(() \=\> {  
    if (containerElement && containerElement.firstElementChild) {  
      const liveNode \= containerElement.firstElementChild as HTMLElement;  
      registry.registerNode(nodeId, liveNode, containerElement);  
    }  
  });

  onDestroy(() \=\> {  
    registry.unregisterNode(nodeId);  
  });  
\</script\>

\<div class="hidden-limbo" style="display: none;" bind:this={containerElement}\>  
  \<div class="contents-wrapper" style="display: contents;"\>  
    {@render children()}  
  \</div\>  
\</div\>

### **3\. Portal Slot Component**

This component acts as a target container inside layout views, pulling the persistent DOM node into its layout slot dynamically7.

Svelte  
\<\!-- src/lib/components/Portal.svelte \--\>  
\<script lang="ts"\>  
  import { onDestroy } from 'svelte';  
  import { usePortalRegistry } from '$lib/state/portal-registry.svelte';

  interface Props {  
    portalId: string;  
    nodeId: string;  
  }

  let { portalId, nodeId }: Props \= $props();  
  const registry \= usePortalRegistry();  
  let targetContainer \= $state\<HTMLDivElement | null\>(null);

  // Monitor target assignments and reparent the DOM node when mapped  
  $effect(() \=\> {  
    const currentTarget \= registry.getCurrentTarget(nodeId);  
    const element \= registry.getNodeReference(nodeId);

    if (currentTarget \=== portalId && element && targetContainer) {  
      if (targetContainer.firstElementChild \!== element) {  
        targetContainer.appendChild(element); // Direct DOM reparenting  
      }  
    }  
  });

  onDestroy(() \=\> {  
    registry.reclaimToLimbo(nodeId, portalId);  
  });  
\</script\>

\<div   
  class="portal-slot-wrapper contents"   
  bind:this={targetContainer}  
  data-portal-id={portalId}  
\>\</div\>

### **4\. Integration Shell with Conditional Layout Switching**

This application shell mounts the persistent modules once and manages transitions between active layouts.

Svelte  
\<\!-- src/routes/+page.svelte \--\>  
\<script lang="ts"\>  
  import { initPortalRegistry } from '$lib/state/portal-registry.svelte';  
  import Limbo from '$lib/components/Limbo.svelte';  
  import Portal from '$lib/components/Portal.svelte';

  const registry \= initPortalRegistry();  
  let activeLayout \= $state\<'storyboard' | 'storymode'\>('storyboard');  
  let isParentMorphing \= $state(false);

  function executeLayoutShift() {  
    isParentMorphing \= true;  
    const targetLayout \= activeLayout \=== 'storyboard' ? 'storymode' : 'storyboard';  
      
    // Teleport the console element to the target layout portal  
    registry.repositionElement('unified-console', targetLayout);  
    activeLayout \= targetLayout;

    // Reset nesting isolation flags after animation frame resolves  
    requestAnimationFrame(() \=\> {  
      isParentMorphing \= false;  
    });  
  }  
\</script\>

\<\!-- Persistent Lifecycle Holders: Mounted once, never destroyed \--\>  
\<Limbo nodeId="unified-console"\>  
  \<div   
    class="machinery-console p-6 bg-zinc-800 border-4 border-zinc-950 rounded-lg shadow-2xl"  
    style:view-transition-name="machinery-card"  
    style:contain="layout"  
  \>  
    \<div class="flex items-center justify-between mb-4"\>  
      \<span class="text-xs font-mono text-amber-500"\>CONSTRUCTION MODULE c5.0\</span\>  
      \<div class="h-3 w-3 rounded-full bg-amber-500 animate-pulse"\>\</div\>  
    \</div\>  
      
    \<\!-- Child component with dynamic transition name to avoid nested conflicts \--\>  
    \<div   
      class="p-4 bg-zinc-900 border border-zinc-950 rounded-md"  
      style:view-transition-name={isParentMorphing ? 'none' : 'nested-controls'}  
    \>  
      \<input   
        type="text"   
        placeholder="INPUT CODE PARAMETERS..."   
        class="w-full bg-zinc-950 text-amber-500 font-mono p-3 border border-zinc-800 rounded focus:outline-none focus:border-amber-600"  
      /\>  
    \</div\>  
  \</div\>  
\</Limbo\>

\<\!-- Structural Layout Shell \--\>  
\<main class="min-h-screen bg-zinc-900 text-white p-8"\>  
  \<header class="flex justify-between items-center mb-8"\>  
    \<h1 class="text-xl font-mono tracking-widest text-zinc-500"\>CENTRAL INTERFACE COUPLING\</h1\>  
    \<button   
      onclick={executeLayoutShift}   
      class="px-6 py-2 bg-zinc-950 border border-zinc-700 font-mono text-sm hover:bg-zinc-800 transition-colors"  
    \>  
      ACTUATE PORTAL MAPPING  
    \</button\>  
  \</header\>

  {\#if activeLayout \=== 'storyboard'}  
    \<\!-- Grid Slot Configuration (Storyboard Mode) \--\>  
    \<div class="grid grid-cols-3 gap-6 h-\[500px\]"\>  
      \<div class="col-span-2 border-2 border-dashed border-zinc-700 p-6 rounded flex flex-col justify-between"\>  
        \<span class="text-xs text-zinc-500 font-mono"\>PORTAL ALPHA (OVERVIEW VIEWPORT)\</span\>  
          
        \<\!-- Recipient portal for primary position \--\>  
        \<Portal portalId="storyboard" nodeId="unified-console" /\>  
      \</div\>  
      \<div class="bg-zinc-950 p-6 rounded border border-zinc-800"\>  
        \<span class="text-xs text-zinc-600 font-mono"\>SYSTEM ANALYTICS\</span\>  
      \</div\>  
    \</div\>  
  {:else}  
    \<\!-- Focused Flow Layout (Storymode Focus) \--\>  
    \<div class="max-w-4xl mx-auto h-\[500px\] flex flex-col justify-end border-2 border-zinc-800 p-8 rounded bg-zinc-950/20"\>  
        
      \<\!-- Recipient portal for focused active position \--\>  
      \<Portal portalId="storymode" nodeId="unified-console" /\>  
    \</div\>  
  {/if}  
\</main\>

\<style\>  
  /\* Enforce rigid-body layout morphs and eliminate visual cross-fades \*/  
  :global(html) {  
    view-transition-name: none;  
  }

  :global(::view-transition-group(machinery-card)) {  
    animation-duration: 400ms;  
    animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1); /\* Custom OutQuint curve \*/  
  }

  :global(::view-transition-old(machinery-card)) {  
    animation: none;  
    opacity: 0 \!important;  
    mix-blend-mode: normal \!important;  
  }

  :global(::view-transition-new(machinery-card)) {  
    animation: none;  
    opacity: 1 \!important;  
    mix-blend-mode: normal \!important;  
    height: 100% \!important;  
    width: 100% \!important;  
  }  
\</style\>

## **Architectural Synthesis**

Ensuring solid-state transitions during dynamic layout shifts in Svelte 5 requires an integrated approach that spans DOM structure, framework reactivity, and browser styling configurations:

1. **Physical Persistence via DOM Reparenting:** Moving elements within the document tree using native methods like appendChild bypasses standard framework unmounting cycles7. This preserves active state variables and keeps internal reactive scopes intact for headless libraries like bits-ui7.  
2. **Synchronized Rendering Lifecycles:** Triggering state transitions inside document.startViewTransition() and forcing synchronous updates via flushSync() ensures the browser captures clean, accurate snapshots of both the old and new layout states13.  
3. **Rigid-Body CSS Overrides:** Disabling default exit transitions and keeping the entry element solid ensures the browser transitions only position and scale, keeping the component visually solid1.  
4. **Coordinated Asynchronous Transitions:** Wrapping transitions with asynchronous coordinators ensures that the browser captures data-complete states, preventing visual flickers when working with dynamic data fetches17.

Applying these architectural patterns allows developers to bypass standard template lifecycle limits, enabling smooth, solid-state layout morphs that match the physical design language of their applications1.

## **Works cited**

1. Same-document view transitions for single-page applications \- Chrome for Developers, [https://developer.chrome.com/docs/web-platform/view-transitions/same-document](https://developer.chrome.com/docs/web-platform/view-transitions/same-document)  
2. svelte view-transition flickering \- Stack Overflow, [https://stackoverflow.com/questions/79922885/svelte-view-transition-flickering](https://stackoverflow.com/questions/79922885/svelte-view-transition-flickering)  
3. The Complete Svelte 5 Course \- Joy of Code, [https://joyofcode.xyz/learn-svelte](https://joyofcode.xyz/learn-svelte)  
4. Change a react component dom parent without unmounting/resetting it \- Stack Overflow, [https://stackoverflow.com/questions/41448549/change-a-react-component-dom-parent-without-unmounting-resetting-it](https://stackoverflow.com/questions/41448549/change-a-react-component-dom-parent-without-unmounting-resetting-it)  
5. Svelte 5 migration guide, [https://svelte.dev/docs/svelte/v5-migration-guide](https://svelte.dev/docs/svelte/v5-migration-guide)  
6. What's new in JavaScript Frameworks (May 2024\) | Blog \- Chrome for Developers, [https://developer.chrome.com/blog/frameworks-may-2024](https://developer.chrome.com/blog/frameworks-may-2024)  
7. How to make Svelte re-use a component instance somewhere else in the DOM instead of destroying/recreating it? \- Stack Overflow, [https://stackoverflow.com/questions/68970069/how-to-make-svelte-re-use-a-component-instance-somewhere-else-in-the-dom-instead](https://stackoverflow.com/questions/68970069/how-to-make-svelte-re-use-a-component-instance-somewhere-else-in-the-dom-instead)  
8. Comprehensive Review of Top JavaScript Frontend Frameworks \- Strapi, [https://strapi.io/blog/comprehensive-review-of-top-javascript-frontend-frameworks](https://strapi.io/blog/comprehensive-review-of-top-javascript-frontend-frameworks)  
9. reparent elements with ease in svelte \- GitHub, [https://github.com/LeoDog896/svelte-reparent](https://github.com/LeoDog896/svelte-reparent)  
10. Svelte Society, [https://sveltesociety.dev/?tags=meta\&tags=spa\&tags=auth\&tags=state](https://sveltesociety.dev/?tags=meta&tags=spa&tags=auth&tags=state)  
11. Svelte 5 and SvelteKit Cursor Rules (scroll down to see sveltekit.mdc) \- Pop these in the \`.cursor/rules\` folder in the root of your project. · GitHub \- GitHub Gist, [https://gist.github.com/amxv/45025aa6fecd1a3b74f15091a546fced](https://gist.github.com/amxv/45025aa6fecd1a3b74f15091a546fced)  
12. Svelte snippets: the new way to reuse markup in Svelte 5 \- Full Stack SvelteKit v2, [https://fullstacksveltekit.com/blog/svelte-snippets](https://fullstacksveltekit.com/blog/svelte-snippets)  
13. 0.svelte.llms-small.md \- GitHub Gist, [https://gist.github.com/aleclarson/5e636e9eac22e5862fc023aa92a55188](https://gist.github.com/aleclarson/5e636e9eac22e5862fc023aa92a55188)  
14. Snippets \- Svelte, [https://svelte.dev/docs/svelte/snippet](https://svelte.dev/docs/svelte/snippet)  
15. Svelte 5: Programmatically creating snippets · Issue \#9980 \- GitHub, [https://github.com/sveltejs/svelte/issues/9980](https://github.com/sveltejs/svelte/issues/9980)  
16. How I Recreated Keynote's Magic Move with Svelte Snippets \- DEV Community, [https://dev.to/retrotheft/how-i-recreated-keynotes-magic-move-with-svelte-snippets-2p5](https://dev.to/retrotheft/how-i-recreated-keynotes-magic-move-with-svelte-snippets-2p5)  
17. Full-page theme toggle animation with View Transitions API | Akash Hamirwasia, [https://akashhamirwasia.com/blog/full-page-theme-toggle-animation-with-view-transitions-api/](https://akashhamirwasia.com/blog/full-page-theme-toggle-animation-with-view-transitions-api/)  
18. akashjs/runtime API, [https://akash.js.org/api/runtime](https://akash.js.org/api/runtime)  
19. Adding/removing elements in a list with View Transitions API • Playground \- Svelte, [https://svelte.dev/playground/51452008b47e454b8b2fc4749067d360?version=4.2.0](https://svelte.dev/playground/51452008b47e454b8b2fc4749067d360?version=4.2.0)  
20. Revealed: React's experimental animations API | Motion Magazine, [https://motion.dev/magazine/reacts-experimental-view-transition-api](https://motion.dev/magazine/reacts-experimental-view-transition-api)  
21. Svelte 5: can't link reactivity from \`$props()\` · Issue \#14536 \- GitHub, [https://github.com/sveltejs/svelte/issues/14536](https://github.com/sveltejs/svelte/issues/14536)  
22. dvcol/svelte-simple-router \- GitHub, [https://github.com/dvcol/svelte-simple-router](https://github.com/dvcol/svelte-simple-router)  
23. CSS View Transitions Module Level 1 \- W3C, [https://www.w3.org/TR/css-view-transitions-1/](https://www.w3.org/TR/css-view-transitions-1/)  
24. CSS View Transitions Module Level 1 \- W3C, [https://www.w3.org/TR/2022/WD-css-view-transitions-1-20221124/](https://www.w3.org/TR/2022/WD-css-view-transitions-1-20221124/)  
25. How to properly do auth checks in SPA mode? · sveltejs kit · Discussion \#14177 \- GitHub, [https://github.com/sveltejs/kit/discussions/14177](https://github.com/sveltejs/kit/discussions/14177)  
26. svelte-reparent \- Reparent HTML Elements \- Made with Svelte, [https://madewithsvelte.com/svelte-reparent](https://madewithsvelte.com/svelte-reparent)  
27. Design patterns and using context in Svelte 5 and Sveltekit : r/sveltejs \- Reddit, [https://www.reddit.com/r/sveltejs/comments/1qqvnxu/design\_patterns\_and\_using\_context\_in\_svelte\_5\_and/](https://www.reddit.com/r/sveltejs/comments/1qqvnxu/design_patterns_and_using_context_in_svelte_5_and/)  
28. State management • SvelteKit Docs, [https://svelte.dev/docs/kit/state-management](https://svelte.dev/docs/kit/state-management)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAABUCAYAAAA/I2vMAAAG5UlEQVR4Xu3dz4skZx3A4TnpyT9A8ewhVxFy8SIECSGISCQIgniSoEEMiHgwGDR6yUX0IBuNekiMIiZ4kBARFENAMBpRIq6o229VvdUZNhJNQn6R8f1Wpnd735nunv6RbNfu88BL19RbXT0zpw/dXW8dHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACMyXvKOKrGtW7+b/35wZv/AwCAvRWx8lgZ76gnrgPvPBBsAMAIXNVg63PzUN+mp6d5clc99zYQbADAKFy1YOtz+lXftrcO223z42mXnquPWVfOzW19ly7W+xcQbADAKCwMtsPDw3dN2+aBnC/cUM/tQgmrl2bbuWvuyV16ZX5+XSXWbum7yePlvC/37eT2pmneWx9TEWwAwCicGmwRaSWgnirjR32bzvdNc+P8/C7MB9ougq2E2mMRgcNo05PTLn20PqYi2ACAUTg12IaPK7v0atelj/Vd8+X5uV0p539jtr2LYAtxjvh4td6/gGADAEbh1GCbtunbJaheL+Mo5+bj83O7sut32EK8u5bb9MV6/wKCDQAYhRPBFh9/lvD5T3wPLC4K6HPz6LC/az7ft+nPZe5cfLdtdvymynmanCcfiO3jQHytPmYdwwUH5feL7XKu3/d986ESgT8bvofXpd+eEp6CDQAYhRPBFhcblOCZxnIbJdL62f4ScB+JwOpz+l7E0Gz/puJ7chFtEVTl8WJu0931Mes4Ds1n4zt38TccNs37hv1dmuScbj7lIgTBBgCMwolgCxFm06755Py+4/2fKmH12Xr/pqbd5AtxYcOurkQdvnNXxWQJtifmf54j2ACAUTg12E5TwudPZfyxjEfiHat6ft/EVaJl/CZ3kz/ERRT1/IFgAwBG4szBNm0v3BQfK8ZjPbevum7ywRgL3sETbADAKJw52K5Bgg0AGAXBJtgAgD0n2AQbALDnVgZb303uHb6436VzpyyNMWaCDQBYz/Dl+C79rYTRfxeMLhazrZ+3paXBNqzJllOb8+SO8vrPxNps9TH7Zlgsd/V9RINgAwDWE+ueRZjFdqwlVrab+Hm2Hloft13qmnuufNbWlgZbec0nZq8fV4dGNEbE1cftixK0ny6/4//q/QsINgBgPRFjJTYOY3tBsMXP91/5rK2tCrbm0usf/06nLai7rmk3+cG0Sz+JOymUc36pnt9EOd9Py7meL+PV4SPcNn2uPqYi2ACAzZ0WbG+RVcF2ORh3FGzlHJ8o49nj7dfjPqL1MZvqu8m/YtT7FxBsAMDm9ijYdv4O23BT+S5dLOMod8199fw2yjlfWyMABRsAsLm9CbY2nT8RbDu408G0m3y4nOsf0y6luNiint9UOecLa9zrVLABAJs7a7CVuc8MN09fMPrcfL9+TmV5sHXpzjIejO14N6xsv1gfs64Sac/FTd+Hv7GdPBz7ynm/Uca/46bz5fG79XPOIufmtv74Ru/lb//l4eHhu0u8fXX4H5W5aU5fqZ4i2ACAzRyH2lE1hqtH3wJLgy3EEhnl9e8/41IZK8VabvGx6PyabnFz9oit+Dhzm3fcSpjdEmP2cznnX4bH3Dx6+ahLBBsAMAorg+3tUMLqr3HlaHn8dT23jXK+fw5ryXXpmXruQLABACOxF8E2zembfdveWsKqq+e2MSyVktO3Flw5KtgAgFHYi2CLoIqPXHM3+WE9t43cpadKBP69nP/r9dyBYAMARmIvgu0qEWwAwCgINsEGAOw5wSbYAIA9tzLY+m5y73Bvzi6dm1+KYxf63DzUt+npaZ7cVc/twrRtvlPvmyPYAIBRWBpsw5IYObU5T+6IpTEirupjNpVzurnE4O9iAd1YTHeXFxyU8z5eft9prO9Wz80RbADAKCwNtmEx2+M7LcQtqWLZjYi4+rhNRFBd3p58rfz88vz8to6X9BBsAMDorQi2WG7jynuJxnpp9XGbKOd6abYdcZW79Mr8/LYEGwBwrVgRbJfvZXrp5u9L7m26jnKuo9m2YAMAWGxVsF0KtF0H23ygCTYAgMWWB1ubzp8ItvbCTfVxmyjnemG2LdgAABZbHmxdurOMB2O7BNB9ZfvF+phN9e3k4bj6dNiOq0W7pq+P2cYQbMtvJi/YAIBRWBpsoUTP82U8Ektv9G36RT2/qZwv3PDmO3bNA+XxYm7T3fUxm4p378p4I74nV0ZX4vD2+pgDwQYAjMTKYLuGCTYAYBQiVp4s48Yy3n88rheCDQAYhYiVWF5jflwvBBsAwJ6aj1PBBgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOyx/wPL/lGwF0zPywAAAABJRU5ErkJggg==>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAaCAYAAABVX2cEAAABZklEQVR4Xu2SzytFQRTH3z/gP7C2sFfWykKShUhKyU5Jtmz8B2yUxUuKJYtnR5Sws/ArShS9OWfmzHSTvRTfM+++R7Nw70oW91vf7p07n/l25pxbq1Wq9MfKsqwriJkLlre8M6sizd6UKSU9KI4u4Qd4Ozg69ZaePHN/yhZKnNnwjsRbO5Ix92go1q8iPJ6yhfJCxzj8DjecozHveFmdcqUULK0j6AP+zG1Q1UTKlRYCFtD4I71eHniYMr9KGxwb7ejNWzMZv6FvWAcvvN/hHC+Cu8X3C7gOP+rUv5MiRFMxyNFde3JiaQXrTCuNjDWzmO6u/joYzFlr6nyOW7yImL5OWA4cxEos3eB5jyo8wLU2oxXDo3oQ+88Y1qb3PKDuBP2UgsHxNJo+nO61BWYGYQ6Vz6d7pRV71OpXHdelYJuDqH4J652ULRTasIeD1/AVbOAGfCJCQylbSloNM3er9T3dr/QP9AUAnE4+BN7SzQAAAABJRU5ErkJggg==>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAaCAYAAAC6nQw6AAABe0lEQVR4Xu1SzytFQRR+/4B/w8Je2ShbyUIiiZKdkuzIxpIVC0pWfvwFLIjwSrGkiCj1PHNmzpnpJjsLKb5zu/fJlHefstL76jRz5n7nm3O/M6VSE038MZIkaQliJoKzG57NkshTW8wphBYJ0yXiHrEdmE69owdvbUfMrQths+aZxDvXm1jbqoLIn0XsQMytCy90jMI3xA4z9Xu2cxoxrxDB0SpE3hEfWRh0MxjzGgKKp2Dykf5SJnYYc36EmpmayvTinRlKz+AT8uDF7tY4TGXwrkWoOz0TWtHJfgkxDaciTDf5hMTRPPJEO0xzTBH7BUQ1CC2KmHbsK4j1mpC+HRAP0g4cXWG9hckety3nHOTTmZBJu3VmXDm4cLImlENvCWxHYXBP/E2RTfVc99lgqsymM+YVQjsNbDazfTkX/TXwYLdQfIcXv4/19Zs/jQKT6lKTs2nOIhhWjMW8QqBwD+Y/ops+dHah3cWchgCBEUz0BGJnmNRM/P2f4xMqx2eaI/D8RQAAAABJRU5ErkJggg==>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAaCAYAAABRqrc5AAABS0lEQVR4Xu1ToU4DQRDtD/AHfAGeBINpgmoQCAwJBgwCfgGBQmHAYUgA1SAQTVEYIGAqEAQIgnR3dmY3FxIIKDC8uesJJjl6iAbTl7zsZt7M7N7buUZjjNFD2J9E9i6xX7BaLYi46cjuWal7q9dCDG4Ft3gHr6w2FDFSMzEto/gQ/AKPwSWR/pTNrQS+vx2Dv0XhG/gJ3gu7HmIbNvdX/L8fJVLwe+qHrlarDTQ4Bz8k+HWr1ULpBwz2zG5WXwWm3oCrqifx22r24KAjxJ80ZprQIsSX0o/E7gCT282ybALJm4jvE9EkYg/gWbG63o8mmixMF0h+RcKj7ssZwfysRaKZwUEMbQv7VuULFiK1bFyhxWjiYgjzVhsKFHbg12UUOlVf9NZR/C5iOza3EuoTjLzGepcPY9Gs86dfIjc39Ody31Cor2dzxhghvgFfD0bXNcO+8gAAAABJRU5ErkJggg==>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAaCAYAAAC+aNwHAAABcklEQVR4Xu1STSsFYRS+f8AP8Acs7C1t7CRJslE2bCwoWVgq4g/IVikpJQs2Fko+SwmRurEg78c5Z5oUsWLjOXNnbuPNnbkLpeSpp3nnfDznPec9lco/fhZMdlPImohsf+grBbPpEDIPSj2H/lKINyOo/gqehL5CiLiuiNwwElfBD3ANHGJ+bA9jvwX63RBvr5D0Ar6DVSZzDttEGNsQv9d/hsjbJe1fv6GvKSB5D3xjb8dDXymy/jFMS2Q6dfoY4Ck4itb6koGSOVZ7HMct+kooNJ0TcIMwPmX9R2RWsJE7CG6FwDaCZ+FjPPVYGksR25m6gKoyuSM4npF4q+ekmnNtQm5S2C7Dd1f7N/N6U/G+ty6QAeo9yrwtvfKNeLeu/8JuC61d52MKoVsKgXutnIpVM7GmUEsyu0g8Q3uHuitf+i+DDg0zmWO23ZjFYrKtuFUY1xCoeInKF0R2QAcJgYUwphB40ilM/QDJ+7oXof+P4BMazG44NWoTEgAAAABJRU5ErkJggg==>
