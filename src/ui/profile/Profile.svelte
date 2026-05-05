<script>
  /**
   * @file src/ui/profile/Profile.svelte
   * 🧬 THE ENTITY EDITOR (REBORN)
   * The primary orchestrator for viewing and editing entities.
   * Uses the new flattened architecture for better modularity and focus.
   */
  import { entities } from "@/data/repository.js";
  import { app } from "@state/app.svelte.js";
  import { runtime } from "@state/runtime.svelte.js";
  import { themeStore } from "@theme/palette.svelte.js";
  import { normalize } from "@data/content-normaliser.js";
  import ProfilePicture from "@atoms/ProfilePicture.svelte";
  import Modal from "@atoms/Modal.svelte";

  /** @typedef {import("@data/content-normaliser.js").normalize} Normalizer */
  /** @typedef {ReturnType<Normalizer>} Entity */
  // Modular Components (Flattened)
  import EntityFooter from "@profile/EntityFooter.svelte";
  import EntityFragments from "@profile/EntityFragments.svelte";
  import EntityHeader from "@profile/EntityHeader.svelte";
  import Dialog from "@atoms/Dialog.svelte";

  import AudioWing from "@profile/AudioWing.svelte";
  import DevWing from "@devmode/DevWing.svelte";
  import VisualWing from "@profile/VisualWing.svelte";

  import { SvelteSet } from "svelte/reactivity";

  /** @type {{ entity_id?: string, entity_type?: "character" | "fractal" }} */
  let { entity_id = undefined, entity_type = "character" } = $props();

  // --- STATE ---
  let is_editing = $state(false);
  let is_saving = $state(false);
  /** @type {SvelteSet<string>} */
  let busy_fields = new SvelteSet();
  /** @type {{key: string, label: string}} */
  let active_field = $state({ key: "visual-prompt", label: "Image Prompt" });
  let show_delete_confirm = $state(false);

  // Normalizer guarantees flattened schema. Use $effect to keep in sync if app state changes.
  /** @type {Entity} */
  let char = $state(normalize(app.editing_entity || runtime.character));

  $effect(() => {
    if (app.editing_entity && app.editing_entity.id !== char.id) {
      char = normalize(app.editing_entity);
    }
  });

  // Theme values
  let signature_color = $derived(themeStore.get_signature_color(char));
  let signature_rgb = $derived(themeStore.hex_to_rgb(signature_color));

  // --- ACTIONS ---
  function handle_close() {
    if (is_editing) {
      is_editing = false;
    } else {
      app.toggle_profile(false);
    }
  }

  async function handle_save() {
    is_editing = false;
    is_saving = true;
    try {
      await runtime.save_entity(entity_type || "character", char);
      const eid = char.id;
      const type = entity_type || "character";

      if (type === "character") {
        /** @type {any[]} */
        const characters = await entities.list("character");
        app.ai_list = characters;
        app.user_list = characters;

        const updated = characters.find((e) => e.id === eid);
        if (app.selected_ai && app.selected_ai.id === eid) app.selected_ai = updated;
        if (app.selected_user && app.selected_user.id === eid) app.selected_user = updated;
      } else if (type === "fractal") {
        /** @type {any[]} */
        const fractals = await entities.list("fractal");
        app.fractal_list = fractals;

        const updated = fractals.find((e) => e.id === eid);
        if (app.selected_fractal && app.selected_fractal.id === eid) app.selected_fractal = updated;
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
      is_editing = true;
    } finally {
      is_saving = false;
    }
  }

  async function execute_delete() {
    try {
      await runtime.delete_entity(entity_type || "character", entity_id || char.id);
      handle_close();
    } catch (err) {
      console.error("Failed to delete entity:", err);
    }
  }

  function handle_focus_out() {
    setTimeout(() => {
      const active = document.activeElement;
      const isInput =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable);

      const isWing = active?.closest?.(".wing-left, .dropdown-content");

      if (!isInput && !isWing && busy_fields.size === 0) {
        active_field = { key: "visual-prompt", label: "Image Prompt" };
      }
    }, 50);
  }

  /** @param {MouseEvent} e */
  function handle_background_click(e) {
    const target =
      e.target instanceof HTMLElement
        ? e.target
        : e.target instanceof Node
          ? e.target.parentElement
          : null;

    if (
      !target?.closest?.(
        "textarea, input, button, .swatch, .wing-left, .dropdown-content, .profile-presentation, [contenteditable]",
      )
    ) {
      if (is_editing) {
        is_editing = false;
        active_field = { key: "visual-prompt", label: "Image Prompt" };
      } else {
        handle_close();
      }
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }
</script>

{#if char && char.id}
  <Dialog
    type="confirm"
    bind:open={show_delete_confirm}
    title="Delete {char.name || 'Entity'}"
    message="This action is irreversible. All associated data, including history and vectors, will be lost."
    confirm_label="Delete Permanently"
    on_confirm={execute_delete}
  />

  <Modal variant="profile" on_close={handle_close}>
    <div
      class="profile-container"
      class:editing={is_editing}
      class:dev-mode={app.settings.dev_mode}
      onclick={handle_background_click}
      onfocusout={handle_focus_out}
      role="presentation"
      data-testid="profile-container"
      data-is-editing={is_editing}
    >
      <!-- LEFT WING: UNIFIED IDENTITY & METRICS -->
      <aside
        class="wing-left custom-scrollbar"
        class:is-visible={is_editing || app.settings.dev_mode}
      >
        {#if is_editing}
          <VisualWing bind:char {is_editing} {busy_fields} bind:active_field />
          <AudioWing bind:char {is_editing} />
        {/if}
        {#if app.settings.dev_mode}
          <DevWing bind:char {is_editing} />
        {/if}
      </aside>

      <!-- MAIN PRESENTATION PANEL -->
      <div
        class="profile-presentation custom-scrollbar"
        style="--signature-color: {signature_color}; --signature-rgb: {signature_rgb};"
      >
        <div class="signature-bar"></div>
        <div class="left-panel">
          <ProfilePicture entity={char} />
        </div>
        <main class="right-panel custom-scrollbar">
          <EntityHeader bind:char {is_editing} bind:active_field />
          <EntityFragments bind:char {is_editing} {busy_fields} bind:active_field />
          <EntityFooter
            {is_editing}
            {is_saving}
            onclick_edit={() => (is_editing = true)}
            onclick_save={handle_save}
            onclick_delete={() => (show_delete_confirm = true)}
          />
        </main>
      </div>
    </div>
  </Modal>
{/if}

<style>
  .profile-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0; /* Remove gap, we'll use margins on wings for precision */
    width: 100%;
    max-width: 100%;
    overflow: visible;
    position: relative;
  }

  /* Wings logic integrated from ProfileWings.svelte */
  .wing-left {
    width: 0;
    min-width: 0;
    max-width: 0;
    opacity: var(--opacity-none);
    overflow: hidden; /* Hide content when collapsed */
    pointer-events: none;
    transition: all var(--motion-s) cubic-bezier(0.4, 0, 0.2, 1);
    transform: scale(0.9);
    height: 100%;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
    z-index: var(--z-index-m); /* Keep below main presentation */
    order: 1;
    margin-right: 0;
  }

  .wing-left.is-visible {
    width: calc(var(--grid-unit) * 2);
    min-width: calc(var(--grid-unit) * 2);
    max-width: calc(var(--grid-unit) * 2);
    opacity: var(--opacity-full);
    pointer-events: auto;
    transform: scale(1);
    overflow-y: auto; /* Enable unified scrolling */
    margin-right: var(--spacing-l);
  }

  /* Local Scrollbar Theming for Wings */
  .wing-left {
    --scrollbar-thumb: rgb(var(--color-white-rgb) / var(--opacity-s));
    --scrollbar-thumb-hover: rgb(var(--color-white-rgb) / var(--opacity-l));
  }

  :global(.visual-wing) {
    flex: 0 0 auto;
  }

  :global(.audio-wing),
  :global(.dev-wing) {
    flex: 0 0 auto;
  }

  .profile-presentation {
    order: 2;
    min-width: 85vh;
    max-width: 1000px; /* Increased from grid-unit scale for better breathing room */
    width: 100%;
    min-height: 0;
    height: 100%;
    max-height: 85vh;
    background: transparent;
    backdrop-filter: none;
    border: var(--border-l);
    border-radius: var(--border-radius-l);
    box-shadow: var(--shadow-xl);
    position: relative;
    overflow: visible; /* Changed from hidden to allow signature bar to breathe */
    z-index: var(--z-index-l);
    display: grid;
    grid-template-columns: minmax(200px, 30%) 1fr; /* [059.1] Flexible portrait panel */
    grid-template-rows: minmax(0, 1fr);
    transition: all var(--motion-m) cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform, width, max-width;
  }

  .signature-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--signature-color) 15%,
      var(--signature-color) 85%,
      transparent
    );
    z-index: var(--z-index-xxl); /* Above everything in the shell */
    pointer-events: none;
    box-shadow: 0 0 12px var(--signature-color);
    opacity: 0.8;
  }

  .left-panel,
  .right-panel {
    height: 100%;
  }

  .left-panel {
    display: flex;
    flex-direction: column;
    border-right: 1px solid
      color-mix(in srgb, var(--color-gunmetal) 85%, var(--signature-color) 15%);
    background: var(--glass-xl);
    backdrop-filter: var(--blur-l);
    border-radius: var(--border-radius-m) 0 0 var(--border-radius-m);
    overflow: hidden;
  }

  .right-panel {
    display: flex;
    flex-direction: column;
    padding: var(--spacing-m);
    background: transparent;
    gap: 0;
    min-height: 0; /* CRITICAL: Allow panel to be smaller than content for scrolling */
    overflow-y: auto;
  }

  /* Local Scrollbar Theming */
  .right-panel {
    --scrollbar-thumb: rgb(var(--signature-rgb) / var(--opacity-s));
    --scrollbar-thumb-hover: rgb(var(--signature-rgb) / var(--opacity-l));
  }

  /* --- RESPONSIVE ADAPTATION --- */

  @media (width <= 850px) {
    /* [059.3] Increased from 768px to account for wings */
    .profile-container {
      flex-direction: column;
      align-items: stretch;
      gap: 0;
      width: 100%;
      max-width: 100%;
      height: 100%;
      min-height: 0;
      justify-content: flex-start;
      padding: 0;
    }

    .wing-left.is-visible {
      width: 100%;
      min-width: 100%;
      max-width: 100%;
      height: auto;
      max-height: 40vh;
      order: 3;
      transform: none;
      padding: 0 var(--spacing-s);
    }

    .profile-presentation {
      order: 1;
      max-width: 100%;
      height: 100%;
      min-height: 0;
      max-height: 100%;
      flex: 1;
      border-radius: 0; /* Full width on mobile feels more premium */
      border-left: none;
      border-right: none;
      display: flex;
      flex-direction: column;
      overflow-y: auto; /* Unified scrollbar for mobile */
    }

    .left-panel {
      flex: 0 0 clamp(140px, 20vh, 220px);
      border-right: none;
      border-bottom: 1px solid
        color-mix(in srgb, var(--color-gunmetal) 85%, var(--signature-color) 15%);
      border-radius: 0;
    }

    .right-panel {
      flex: 0 0 auto;
      padding: var(--spacing-m);
      overflow-y: visible;
      height: auto;
    }
  }

  /* Ultra-narrow optimization */
  @media (width <= 480px) {
    .profile-presentation {
      border: none;
    }

    .right-panel {
      padding: var(--spacing-s);
      gap: var(--spacing-s);
    }
  }
</style>
