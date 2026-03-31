<script>
  /**
   * @file LeftPanel.svelte
   * 🎛️ THE GENERATIVE CONSOLE
   * Sidebar for managing generative parameters, styles, and simulation settings.
   */
  import { app } from "@state/app.svelte.js";
  import { runtime } from "@state/runtime.svelte.js";
  import Button from "@ui/atoms/Button.svelte";
  import Toggle from "@ui/atoms/Toggle.svelte";
  import { fly, fade } from "svelte/transition";

  // --- DATA SOURCE ---
  // We use the lists injected from the perchance-side or mock
  const lists = window.rpgLists || {
    styles: [],
    lighting: [],
    tech: [],
    composition: [],
    mood: [],
    quality: [],
    artifacts: [],
    glitches: [],
    settings: { voiceEnabled: true }
  };

  // Helper to parse JSON strings if they were passed that way
  function getList(key) {
    const val = lists[key];
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch(e) { return []; }
    }
    if (Array.isArray(val)) return val;
    return [];
  }

  const categoryMap = [
    { id: 'styles', label: 'Style', items: getList('styles') },
    { id: 'mood', label: 'Mood', items: getList('mood') },
    { id: 'lighting', label: 'Lighting', items: getList('lighting') },
    { id: 'composition', label: 'Composition', items: getList('composition') },
    { id: 'tech', label: 'Tech', items: getList('tech') },
    { id: 'artifacts', label: 'Artifacts', items: getList('artifacts') },
    { id: 'glitches', label: 'Glitches', items: getList('glitches') }
  ];

  // --- PERSISTENCE (Runtime Bridge) ---
  // In a real implementation, we might bind these to runtime.story_config
  let activeSelections = $state({});

  function toggleSelection(category, item) {
    if (!activeSelections[category]) activeSelections[category] = new Set();
    
    if (activeSelections[category].has(item)) {
      activeSelections[category].delete(item);
    } else {
      activeSelections[category].add(item);
    }
    
    // Sync with runtime or log
    app.log(`Generation: Selected ${item} in ${category}`, 'system');
  }

  function isSelected(category, item) {
    return activeSelections[category]?.has(item);
  }

</script>

{#if app.left_panel_open}
  <aside 
    class="left-panel-root"
    transition:fly={{ x: -300, duration: 500, opacity: 1 }}
  >
    <div class="panel-blur-overlay"></div>
    
    <header class="panel-header">
      <div class="header-content">
        <h2 class="panel-title">GEN_CONSOLE</h2>
        <button class="close-trigger" onclick={() => app.toggle_left_panel()} title="Close Console">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="panel-divider"></div>
    </header>

    <div class="panel-scroll-area">
      <!-- SYSTEM TOGGLES -->
      <section class="panel-section">
        <h3 class="section-label">Core Protocols</h3>
        <div class="toggle-stack">
          <Toggle label="VOICE_SYNTH" bind:value={app.settings.call_mode} size="sm" />
          <Toggle label="NOTIFICATIONS" bind:value={app.settings.sound} size="sm" />
          <Toggle label="AUTO_SCROLL" bind:value={app.settings.auto_scroll} size="sm" />
          <Toggle label="DEV_MODE" bind:value={app.settings.dev_mode} size="sm" />
        </div>
      </section>

      <!-- DYNAMIC LISTS -->
      {#each categoryMap as cat}
        {#if cat.items.length > 0}
          <section class="panel-section">
            <h3 class="section-label">{cat.label}</h3>
            <div class="chip-grid">
              {#each cat.items as item}
                <button 
                  class="chip" 
                  class:active={isSelected(cat.id, item)}
                  onclick={() => toggleSelection(cat.id, item)}
                >
                  {item}
                </button>
              {/each}
            </div>
          </section>
        {/if}
      {/each}
    </div>

    <footer class="panel-footer">
      <div class="footer-actions">
        <Button label="RESET ALL" variant="ghost" size="sm" onclick={() => activeSelections = {}} />
        <Button label="APPLY" variant="primary" size="sm" onclick={() => app.toggle_left_panel()} />
      </div>
    </footer>
  </aside>
{/if}

<style>
  .left-panel-root {
    position: fixed;
    top: 0;
    left: 0;
    width: 320px;
    height: 100vh;
    background: var(--glass-l);
    border-right: 1px solid var(--glass-edge-l);
    z-index: var(--z-index-max);
    display: flex;
    flex-direction: column;
    box-shadow: 20px 0 50px rgba(0,0,0,0.5);
    backdrop-filter: blur(20px);
  }

  .panel-blur-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, var(--color-black) 0%, transparent 100%);
    opacity: 0.2;
    pointer-events: none;
  }

  .panel-header {
    padding: var(--spacing-l) var(--spacing-m);
    flex-shrink: 0;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-s);
  }

  .panel-title {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-m);
    color: var(--color-chalk);
    letter-spacing: var(--letter-spacing-xl);
    margin: 0;
  }

  .close-trigger {
    background: transparent;
    border: none;
    color: var(--color-frisk);
    cursor: pointer;
    padding: var(--spacing-xs);
    border-radius: var(--border-radius-full);
    transition: all var(--motion-fast);
  }

  .close-trigger:hover {
    color: var(--color-white);
    background: var(--glass-xs);
  }

  .panel-divider {
    height: 1px;
    background: linear-gradient(to right, var(--color-frisk), transparent);
    opacity: 0.3;
  }

  .panel-scroll-area {
    flex-grow: 1;
    overflow-y: auto;
    padding: 0 var(--spacing-m);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
    padding-bottom: var(--spacing-xxl);
  }

  /* Custom Scrollbar */
  .panel-scroll-area::-webkit-scrollbar {
    width: 4px;
  }
  .panel-scroll-area::-webkit-scrollbar-track {
    background: transparent;
  }
  .panel-scroll-area::-webkit-scrollbar-thumb {
    background: var(--glass-edge-l);
    border-radius: 10px;
  }

  .panel-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
  }

  .section-label {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xxs);
    color: var(--color-frozen);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-l);
    margin: 0;
    opacity: 0.8;
  }

  .toggle-stack {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
  }

  .chip-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }

  .chip {
    background: var(--glass-xs);
    border: 1px solid var(--glass-edge-l);
    color: var(--font-color-s);
    padding: var(--spacing-xxs) var(--spacing-s);
    border-radius: var(--border-radius-full);
    font-size: var(--font-size-xxs);
    font-family: var(--font-family-body);
    cursor: pointer;
    transition: all var(--motion-fast);
    white-space: nowrap;
  }

  .chip:hover {
    border-color: var(--color-frozen);
    color: var(--color-chalk);
  }

  .chip.active {
    background: var(--color-frisk);
    color: var(--color-black);
    border-color: var(--color-frisk);
    box-shadow: 0 0 10px rgba(138, 147, 153, 0.3);
  }

  .panel-footer {
    padding: var(--spacing-m);
    background: var(--glass-s);
    border-top: 1px solid var(--glass-edge-l);
    flex-shrink: 0;
  }

  .footer-actions {
    display: flex;
    justify-content: space-between;
    gap: var(--spacing-s);
  }
</style>
