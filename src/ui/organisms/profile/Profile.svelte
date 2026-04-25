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

  import AudioWing from "./wings/AudioWing.svelte";
  import DevWing from "./wings/DevWing.svelte";
  import VisualWing from "./wings/VisualWing.svelte";

  import { SvelteSet } from "svelte/reactivity";

  let { entity_id, entity_type } = $props();

  // --- STATE ---
  let is_editing = $state(false);
  let is_saving = $state(false);
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

  let show_delete_confirm = $state(false);
  async function handle_delete() {
    show_delete_confirm = true;
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

      const isWing = active?.closest?.(".wing-left, .wing-right");

      if (!isInput && !isWing && busy_fields.size === 0) {
        active_field = { key: "visual-prompt", label: "Image Prompt" };
      }
    }, 50);
  }

  function handle_background_click(e) {
    if (
      !e.target.closest?.(
        "textarea, input, button, .swatch, .wing-left, .wing-right, .profile-presentation, [contenteditable]",
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
  <Confirm
    bind:open={show_delete_confirm}
    title="Delete Entity?"
    message="Are you sure you want to delete this entity? This action cannot be undone."
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
      <!-- LEFT WING: UNIFIED IDENTITY -->
      <aside class="wing-left" class:is-visible={is_editing}>
        <VisualWing bind:char {is_editing} {busy_fields} bind:active_field />
        <AudioWing bind:char {is_editing} />
      </aside>

      <!-- MAIN PRESENTATION PANEL -->
      <div
        class="profile-presentation"
        style="--signature-color: {signature_color}; --signature-rgb: {signature_rgb};"
      >
        <div class="presentation-shell">
          <div class="signature-bar"></div>
          <div class="left-panel">
            <ProfilePicture entity={char} />
          </div>
          <main class="right-panel">
            <EntityHeader bind:char {is_editing} />
            <EntityFragments bind:char {is_editing} {busy_fields} bind:active_field />
            <EntityFooter
              {is_editing}
              {is_saving}
              onclick_edit={() => (is_editing = true)}
              onclick_save={handle_save}
              onclick_delete={handle_delete}
            />
          </main>
        </div>
      </div>

      <!-- RIGHT WING: DEVELOPER METRICS -->
      <aside class="wing-right" class:is-visible={app.settings.dev_mode}>
        <DevWing bind:char {is_editing} />
      </aside>
    </div>
  </Modal>
{/if}

<style>
  .profile-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-l);
    width: 100%;
    max-width: 90vw;
    overflow: visible;
  }

  /* Wings logic integrated from ProfileWings.svelte */
  .wing-left,
  .wing-right {
    width: 0;
    min-width: 0;
    max-width: 0;
    opacity: var(--opacity-none);
    overflow: visible;
    pointer-events: none;
    transition: all var(--motion-s) cubic-bezier(0.4, 0, 0.2, 1);
    transform: scale(0.9);
    height: 100%;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
    z-index: var(--z-index-m); /* Keep below main presentation */
  }

  .wing-left.is-visible,
  .wing-right.is-visible {
    width: 18rem;
    min-width: 18rem;
    max-width: 22rem;
    opacity: var(--opacity-full);
    pointer-events: auto;
    transform: scale(1);
  }

  .wing-left {
    order: 1;
  }

  .wing-right {
    order: 3;
  }

  .profile-presentation {
    order: 2;
    max-width: 64rem;
    width: 100%;
    height: 100%;
    max-height: 85vh;
    background: var(--glass-xl);
    backdrop-filter: var(--blur-l);
    border: var(--border-l);
    border-radius: var(--border-radius-l);
    box-shadow: var(--shadow-xl);
    position: relative;
    overflow: visible;
    z-index: var(--z-index-l);
    transition: all var(--motion-s) cubic-bezier(0.4, 0, 0.2, 1);
  }

  .presentation-shell {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: 35% 1fr;
    grid-template-rows: 1fr;
    border-radius: inherit;
    overflow: hidden; /* THE SOVEREIGN CLIP (RESTORED) */
    background: transparent;
    position: relative;
  }

  .signature-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--signature-color);
    z-index: var(--z-index-xxl); /* Above everything in the shell */
    pointer-events: none;
  }

  .left-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    border-right: 1px solid var(--border-l); /* Shared divider */
    background: transparent;
  }

  .right-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-m);
    background-color: rgb(from var(--signature-color) r g b / 5%); /* Subtle Identity Wash */
    gap: var(--spacing-m);
  }

  .right-panel::-webkit-scrollbar {
    width: 4px;
  }

  .right-panel::-webkit-scrollbar-thumb {
    background: rgb(var(--signature-rgb) / var(--opacity-s));
    border-radius: var(--border-radius-full);
  }
</style>
