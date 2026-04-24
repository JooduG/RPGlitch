<script>
  /**
   * @file src/ui/organisms/profile/Profile.svelte
   * 🗃️ THE ENTITY EDITOR (REBORN)
   * The primary orchestrator for viewing and editing entities.
   * Uses the new Panel/Wing architecture for better modularity and focus.
   */
  import { entities } from "@/data/repository.js";
  import { app } from "@state/app.svelte.js";
  import { runtime } from "@state/runtime.svelte.js";
  import { themeStore } from "@theme/palette.svelte.js";
  import { normalize } from "@data/content-normaliser.js";
  import ProfilePicture from "@ui/atoms/ProfilePicture.svelte";
  import Modal from "@ui/molecules/Modal.svelte";
  import Confirm from "@ui/molecules/Confirm.svelte";
  // New Modular Components
  import EntityFooter from "./panels/EntityFooter.svelte";
  import EntityFragments from "./panels/EntityFragments.svelte";
  import EntityHeader from "./panels/EntityHeader.svelte";
  import { fly } from "svelte/transition";

  import AudioWing from "./wings/AudioWing.svelte";
  import DevWing from "./wings/DevWing.svelte";
  import VisualWing from "./wings/VisualWing.svelte";

  import { SvelteSet } from "svelte/reactivity";

  let { entity_id, entity_type } = $props();

  // --- STATE ---
  let is_editing = $state(false);
  let is_saving = $state(false);
  let confirm_delete_open = $state(false);
  let busy_fields = new SvelteSet();
  let active_field = $state({ key: "visual-prompt", label: "Image Prompt" });

  // Normalizer guarantees flattened schema
  let char = $state(normalize(app.editing_entity || runtime.character));

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
        const characters = await entities.list("character");
        app.ai_list = characters;
        app.user_list = characters;

        const updated = characters.find((e) => e.id === eid);
        if (app.selected_ai?.id === eid) app.selected_ai = updated;
        if (app.selected_user?.id === eid) app.selected_user = updated;
      } else if (type === "fractal") {
        const fractals = await entities.list("fractal");
        app.fractal_list = fractals;

        const updated = fractals.find((e) => e.id === eid);
        if (app.selected_fractal?.id === eid) app.selected_fractal = updated;
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
      is_editing = true;
    } finally {
      is_saving = false;
    }
  }

  function handle_delete() {
    confirm_delete_open = true;
  }

  async function confirm_delete() {
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

      const isWing = active?.closest(".wing-unit") || active?.closest(".voice-dropdown-panel");
      const isConfirm = active?.closest("dialog");

      if (!isInput && !isWing && !isConfirm && busy_fields.size === 0) {
        active_field = { key: "visual-prompt", label: "Image Prompt" };
      }
    }, 50);
  }

  function handle_background_click(e) {
    // If clicking outside the main presentation area, check if we should close or just exit edit mode
    if (
      !e.target.closest(
        "textarea, input, button, .swatch, .wing-unit, .profile-presentation, [contenteditable]",
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
      <!-- LEFT WING: UNIFIED IDENTITY & DEV (ABSOLUTE) -->
      {#if app.settings.dev_mode || is_editing}
        <aside class="wing-left no-scrollbar">
          {#if app.settings.dev_mode}
            <div class="wing-unit dev-group" transition:fly={{ x: -20, duration: 300 }}>
              <DevWing bind:char {is_editing} />
            </div>
          {/if}
          {#if is_editing}
            <div class="wing-unit" transition:fly={{ x: -20, duration: 300 }}>
              <VisualWing bind:char {is_editing} {busy_fields} bind:active_field />
            </div>
            <div class="wing-unit" transition:fly={{ x: -20, duration: 300 }}>
              <AudioWing bind:char {is_editing} />
            </div>
          {/if}
        </aside>
      {/if}

      <!-- MAIN PRESENTATION PANEL -->
      <main
        class="profile-presentation"
        style="--signature-color: {signature_color}; --signature-rgb: {signature_rgb};"
      >
        <div class="presentation-shell">
          <div class="signature-bar"></div>
          
          <!-- PORTRAIT PANEL (STATIC) -->
          <aside class="left-panel">
            <div class="portrait-container">
              <ProfilePicture entity={char} />
            </div>
          </aside>

          <!-- SCROLLING FRAGMENTS PANEL (LOCAL SCROLL) -->
          <div class="right-panel scrollbar">
            <EntityHeader bind:char {is_editing} />
            <EntityFragments bind:char {is_editing} {busy_fields} bind:active_field />
            <EntityFooter
              {is_editing}
              {is_saving}
              onclick_edit={() => (is_editing = true)}
              onclick_save={handle_save}
              onclick_delete={handle_delete}
            />
          </div>
        </div>
      </main>
    </div>
  </Modal>

  <!-- Delete confirmation dialog (outside the profile Modal to avoid z-index conflicts) -->
  <Confirm
    bind:open={confirm_delete_open}
    title="Delete Entity"
    message="This entity will be permanently removed. Are you sure?"
    confirm_label="Delete"
    cancel_label="Cancel"
    on_confirm={confirm_delete}
  />
{/if}

<style>
  .profile-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: fit-content;
    max-width: 100%;
    height: 100vh;
    position: relative;
    padding: 0 var(--spacing-xl);
  }

  /* SIDE WING COLUMN (PUSH-FLEX & CENTERED) */
  .wing-left {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
    width: var(--panel-s); 
    height: 100vh;
    max-height: 100vh;
    overflow: hidden auto;
    padding: 10vh 0;
    margin-right: var(--spacing-m);
    flex: 0 0 auto;
    pointer-events: auto;
    z-index: var(--z-index-xl);

    /* Atmospheric Fade Mask: Solves the "weird cutoff" by dissolving content into the abyss */
    mask-image: linear-gradient(
      to bottom,
      transparent 0%,
      black 10%,
      black 90%,
      transparent 100%
    );
  }

  /* Internal centering that respects overflow */
  .wing-left::before,
  .wing-left::after {
    content: "";
    margin: auto;
  }

  .wing-unit {
    width: 100%;
    flex-shrink: 0;
  }

  /* MAIN PANEL */
  .profile-presentation {
    width: var(--panel-full);
    max-width: 100%;
    background: var(--glass-xl);
    backdrop-filter: var(--blur-l);
    border: var(--border-l);
    border-radius: var(--border-radius-l);
    box-shadow: var(--shadow-xl);
    position: relative;
    height: auto;
    max-height: 90vh;
    z-index: var(--z-index-l);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .presentation-shell {
    display: grid;
    grid-template-columns: var(--panel-s) 1fr;
    width: 100%;
    flex: 1;
    min-height: 0;
    height: auto;
    border-radius: inherit;
    position: relative;
  }

  .signature-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--signature-color);
    z-index: var(--z-index-xxl);
    pointer-events: none;
  }

  /* LEFT PANEL: STATIC PORTRAIT */
  .left-panel {
    border-right: 1px solid var(--border-l);
    background: transparent;
    display: flex;
    flex-direction: column;
    height: auto;
  }

  .portrait-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  /* RIGHT PANEL: LOCAL SCROLL */
  .right-panel {
    padding: var(--spacing-m);
    background-color: rgb(from var(--signature-color) r g b / 5%);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
    height: auto;
    min-height: 0;
    max-height: inherit;
    overflow: hidden auto;
  }
</style>
