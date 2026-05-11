<script>
  /**
   * @file src/ui/profile/Profile.svelte
   * 🧬 ENTITY EDITOR — Primary orchestrator for viewing and editing entities.
   * Chalk Regime UI · Flat DOM · Ultra-Lean CSS
   */
  import { entities } from "@/data/repository.js";
  import Dialog from "@atoms/Dialog.svelte";
  import Modal from "@atoms/Modal.svelte";
  import ProfilePicture from "@atoms/ProfilePicture.svelte";
  import { normalize } from "@data/content-normaliser.js";
  import DevWing from "@devmode/DevWing.svelte";
  import AudioWing from "@profile/AudioWing.svelte";
  import EntityFooter from "@profile/EntityFooter.svelte";
  import EntityFragments from "@profile/EntityFragments.svelte";
  import EntityHeader from "@profile/EntityHeader.svelte";
  import VisualWing from "@profile/VisualWing.svelte";
  import { app } from "@state/app.svelte.js";
  import { runtime } from "@state/runtime.svelte.js";
  import { themeStore } from "@theme/palette.svelte.js";
  import { SvelteSet } from "svelte/reactivity";

  const DEFAULT_FIELD = { key: "visual-prompt", label: "Image Prompt" };

  /** @type {{ entity_type?: "character" | "fractal" }} */
  let { entity_type = "character" } = $props();

  // --- STATE ---

  let is_editing = $state(false);
  let is_saving = $state(false);
  let show_delete_confirm = $state(false);

  /** @type {SvelteSet<string>} */
  let busy_fields = new SvelteSet();

  /** @type {{key: string, label: string} | null} */
  let active_field = $state(DEFAULT_FIELD);

  /** @type {any} */
  let char = $state(normalize(app.editing_entity || runtime.character));

  // --- DERIVED ---

  const signature_color = $derived(themeStore.get_signature_color(char));

  // --- EFFECTS ---

  $effect(() => {
    if (app.editing_entity) char = normalize(app.editing_entity);
  });

  // --- HANDLERS ---

  /**
   *
   */
  function handle_close() {
    if (is_editing) {
      is_editing = false;
    } else {
      app.toggle_profile(false);
    }
  }

  /**
   *
   */
  async function handle_save() {
    is_editing = false;
    is_saving = true;
    try {
      await runtime.save_entity(entity_type, char);

      if (entity_type === "character") {
        const characters = await entities.list("character");
        app.ai_list = characters;
        app.user_list = characters;

        const updated = characters.find((/** @type {any} */ e) => e.id === char.id);
        if (app.selected_ai?.id === char.id) app.selected_ai = updated;
        if (app.selected_user?.id === char.id) app.selected_user = updated;
      } else if (entity_type === "fractal") {
        const fractals = await entities.list("fractal");
        app.fractal_list = fractals;

        const updated = fractals.find((/** @type {any} */ e) => e.id === char.id);
        if (app.selected_fractal?.id === char.id) app.selected_fractal = updated;
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
      is_editing = true;
    } finally {
      is_saving = false;
    }
  }

  /**
   *
   */
  async function handle_delete() {
    try {
      await runtime.delete_entity(entity_type, char.id);
      handle_close();
    } catch (err) {
      console.error("Failed to delete entity:", err);
    }
  }

  /**
   *
   */
  function handle_focus_out() {
    setTimeout(() => {
      const active = document.activeElement;
      const is_input =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable);
      const is_wing = active?.closest?.(".wings, .dropdown");

      if (!is_input && !is_wing && busy_fields.size === 0) {
        active_field = DEFAULT_FIELD;
      }
    }, 50);
  }

  /** @param {MouseEvent} e */
  function handle_bg_click(e) {
    const target = e.target instanceof Element ? e.target : null;
    if (
      !target?.closest?.(
        "textarea, input, button, .swatch, .wings, .dropdown, .card, [contenteditable]",
      )
    ) {
      if (is_editing) {
        is_editing = false;
        active_field = DEFAULT_FIELD;
      } else {
        handle_close();
      }
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    }
  }
</script>

{#if char?.id}
  <Dialog
    type="confirm"
    bind:open={show_delete_confirm}
    title="Delete {char.name || 'Entity'}"
    message="This action is irreversible. All associated data, including history and vectors, will be lost."
    confirm_label="Delete Permanently"
    on_confirm={handle_delete}
  />

  <Modal variant="profile" on_close={handle_close}>
    <div
      class="wrapper"
      class:is-editing={is_editing}
      class:is-dev={app.settings.dev_mode}
      class:is-mobile={app.viewport.mobile}
      class:is-mini={app.viewport.mini}
      onclick={handle_bg_click}
      onfocusout={handle_focus_out}
      role="presentation"
      data-is-editing={is_editing}
    >
      <aside class="wings scrollbar" class:is-visible={is_editing || app.settings.dev_mode}>
        {#if is_editing}
          <VisualWing bind:char {is_editing} {busy_fields} bind:active_field />
          <AudioWing bind:char {is_editing} />
        {/if}
        {#if app.settings.dev_mode}
          <DevWing bind:char {is_editing} />
        {/if}
      </aside>

      <div class="card scrollbar" style="--signature-color: {signature_color};">
        <div class="signature-bar"></div>
        <div class="avatar">
          <ProfilePicture entity={char} />
        </div>
        <main class="body scrollbar">
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
  .wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    width: 100%;
    max-width: 100%;
    overflow: visible;
    position: relative;
  }

  /* ── Wings sidebar ─────────────────────────────────────────── */

  .wings {
    width: 0;
    min-width: var(--spacing-pixel);
    max-width: 0;
    opacity: 0;
    overflow: hidden;
    pointer-events: none;
    transition: all var(--duration-standard) var(--ease-standard);
    transform: scale(0.9);
    height: 100%;
    max-height: var(--modal-height-tall);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
    z-index: var(--surface-z-index);
    order: 1;
    margin-right: 0;
    --scrollbar-thumb: rgb(from var(--color-white) r g b / var(--opacity-muted));
    --scrollbar-thumb-hover: rgb(from var(--color-white) r g b / var(--opacity-heavy));
  }

  .wings.is-visible {
    width: var(--wing-width);
    min-width: var(--wing-width);
    max-width: var(--wing-width);
    opacity: var(--opacity-solid);
    pointer-events: auto;
    transform: scale(1);
    overflow-y: auto;
    margin-right: var(--spacing-6);
  }

  /* ── Card (glassmorphic entity panel) ─────────────────────── */

  .card {
    order: 2;
    min-width: 20rem;
    max-width: var(--profile-width);
    width: 100%;
    height: 100%;
    max-height: var(--modal-height-tall);
    background: var(--glass-elevated);
    backdrop-filter: var(--glass-elevated-blur);
    border-radius: var(--radius-standard);
    box-shadow: var(--shadow-heavy);
    position: relative;
    overflow: visible;
    z-index: var(--overlay-z-index);
    display: grid;
    grid-template-columns: minmax(var(--spacing-40), 30%) 1fr;
    grid-template-rows: minmax(0, 1fr);
    gap: 0;
    transition: all var(--duration-standard) var(--ease-standard);
    will-change: transform, width, max-width;
  }

  /* ── Signature accent bar ──────────────────────────────────── */

  .signature-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: var(--spacing-pixel);
    background: linear-gradient(
      90deg,
      transparent,
      var(--signature-color) 15%,
      var(--signature-color) 85%,
      transparent
    );
    z-index: var(--max-z-index);
    pointer-events: none;
    --signature-glow: 0 0 var(--spacing-2) var(--signature-color);

    box-shadow: var(--signature-glow);
    opacity: 0.8;
  }

  /* ── Avatar column (ProfilePicture) ────────────────────────── */

  .avatar {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: transparent;
    border-radius: calc(var(--radius-standard) - var(--spacing-pixel)) 0 0
      calc(var(--radius-standard) - var(--spacing-pixel));
    overflow: hidden;
  }

  /* ── Body column (scrollable content) ─────────────────────── */

  .body {
    height: 100%;
    display: flex;
    font-size: var(--font-size-h3);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--font-spacing-tight);
    text-shadow: var(--shadow-font);
    text-align: left;
    line-height: var(--font-height-short);
    min-height: calc(var(--spacing-6) * 3);
    border-radius: 0 calc(var(--radius-standard) - var(--spacing-pixel))
      calc(var(--radius-standard) - var(--spacing-pixel)) 0;
    --scrollbar-thumb: rgb(from var(--signature-color) r g b / var(--opacity-muted));
    --scrollbar-thumb-hover: rgb(from var(--signature-color) r g b / var(--opacity-heavy));
  }

  /* ── Responsive: tablet / mobile ──────────────────────────── */

  .wrapper.is-mobile {
    flex-direction: column;
    align-items: stretch;
    height: 100%;
    justify-content: flex-start;
    padding: 0;
  }

  .wrapper.is-mobile .wings.is-visible {
    width: 100%;
    min-width: 100%;
    max-width: 100%;
    height: auto;
    max-height: 40vh;
    order: 3;
    transform: none;
    padding: 0 var(--spacing-2);
  }

  .wrapper.is-mobile .card {
    order: 1;
    max-width: 100%;
    height: 100%;
    max-height: 100%;
    flex: 1;
    border-radius: 0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  .wrapper.is-mobile .avatar {
    flex: 0 0 clamp(20rem, 20vh, var(--avatar-medium-size));
    border-radius: 0;
  }

  .wrapper.is-mobile .body {
    flex: 0 0 auto;
    padding: var(--spacing-4);
    overflow-y: visible;
    height: auto;
    border-radius: 0;
  }

  .wrapper.is-mini .body {
    padding: var(--spacing-2);
    gap: var(--spacing-2);
  }
</style>
