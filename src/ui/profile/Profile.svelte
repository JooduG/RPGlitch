<script>
  /**
   * @file src/ui/profile/Profile.svelte
   * 🧬 ENTITY EDITOR — Primary orchestrator for viewing and editing entities.
   * Chalk Regime UI · Flat DOM · Ultra-Lean CSS
   */
  import { entities } from "@/data/repository.js";
  import { app } from "@state/app.svelte.js";
  import { runtime } from "@state/runtime.svelte.js";
  import { themeStore } from "@theme/palette.svelte.js";
  import { normalize } from "@data/content-normaliser.js";
  import ProfilePicture from "@atoms/ProfilePicture.svelte";
  import Modal from "@atoms/Modal.svelte";
  import EntityFooter from "@profile/EntityFooter.svelte";
  import EntityFragments from "@profile/EntityFragments.svelte";
  import EntityHeader from "@profile/EntityHeader.svelte";
  import Dialog from "@atoms/Dialog.svelte";
  import AudioWing from "@profile/AudioWing.svelte";
  import DevWing from "@devmode/DevWing.svelte";
  import VisualWing from "@profile/VisualWing.svelte";
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
  const signature_rgb = $derived(themeStore.hex_to_rgb(signature_color));

  // --- EFFECTS ---

  $effect(() => {
    if (app.editing_entity) char = normalize(app.editing_entity);
  });

  // --- HANDLERS ---

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

  async function handle_delete() {
    try {
      await runtime.delete_entity(entity_type, char.id);
      handle_close();
    } catch (err) {
      console.error("Failed to delete entity:", err);
    }
  }

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
      onclick={handle_bg_click}
      onfocusout={handle_focus_out}
      role="presentation"
      data-is-editing={is_editing}
    >
      <aside class="wings custom-scrollbar" class:is-visible={is_editing || app.settings.dev_mode}>
        {#if is_editing}
          <VisualWing bind:char {is_editing} {busy_fields} bind:active_field />
          <AudioWing bind:char {is_editing} />
        {/if}
        {#if app.settings.dev_mode}
          <DevWing bind:char {is_editing} />
        {/if}
      </aside>

      <div
        class="card custom-scrollbar"
        style="--signature-color: {signature_color}; --signature-rgb: {signature_rgb};"
      >
        <div class="signature-bar"></div>
        <div class="avatar">
          <ProfilePicture entity={char} />
        </div>
        <main class="body custom-scrollbar">
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
    min-width: 0;
    max-width: 0;
    opacity: var(--opacity-none);
    overflow: hidden;
    pointer-events: none;
    transition: all var(--motion-s) cubic-bezier(0.4, 0, 0.2, 1);
    transform: scale(0.9);
    height: 100%;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
    z-index: var(--z-index-m);
    order: 1;
    margin-right: 0;
    --scrollbar-thumb: rgb(var(--color-white-rgb) / var(--opacity-s));
    --scrollbar-thumb-hover: rgb(var(--color-white-rgb) / var(--opacity-l));
  }

  .wings.is-visible {
    width: 240px;
    min-width: 240px;
    max-width: 240px;
    opacity: var(--opacity-full);
    pointer-events: auto;
    transform: scale(1);
    overflow-y: auto;
    margin-right: var(--spacing-l);
  }

  /* ── Card (glassmorphic entity panel) ─────────────────────── */

  .card {
    order: 2;
    min-width: 85vh;
    max-width: 1000px;
    width: 100%;
    height: 100%;
    max-height: 85vh;
    background: var(--glass-xl);
    backdrop-filter: var(--blur-l);
    border-radius: var(--border-radius-l);
    box-shadow: var(--shadow-xl);
    position: relative;
    overflow: visible;
    z-index: var(--z-index-l);
    display: grid;
    grid-template-columns: minmax(200px, 30%) 1fr;
    grid-template-rows: minmax(0, 1fr);
    gap: 0;
    transition: all var(--motion-m) cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform, width, max-width;
  }

  /* ── Signature accent bar ──────────────────────────────────── */

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
    z-index: var(--z-index-xxl);
    pointer-events: none;
    --signature-glow: 0 0 var(--spacing-s) var(--signature-color);

    box-shadow: var(--signature-glow);
    opacity: 0.8;
  }

  /* ── Avatar column (ProfilePicture) ────────────────────────── */

  .avatar {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: transparent;
    border-radius: calc(var(--border-radius-l) - 1px) 0 0 calc(var(--border-radius-l) - 1px);
    overflow: hidden;
  }

  /* ── Body column (scrollable content) ─────────────────────── */

  .body {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: var(--spacing-m);
    background: transparent;
    gap: 0;
    min-height: 0;
    overflow-y: auto;
    border-radius: 0 calc(var(--border-radius-l) - 1px) calc(var(--border-radius-l) - 1px) 0;
    --scrollbar-thumb: rgb(var(--signature-rgb) / var(--opacity-s));
    --scrollbar-thumb-hover: rgb(var(--signature-rgb) / var(--opacity-l));
  }

  /* ── Responsive: tablet / mobile ──────────────────────────── */

  @media (width <= 850px) {
    .wrapper {
      flex-direction: column;
      align-items: stretch;
      height: 100%;
      justify-content: flex-start;
      padding: 0;
    }

    .wings.is-visible {
      width: 100%;
      min-width: 100%;
      max-width: 100%;
      height: auto;
      max-height: 40vh;
      order: 3;
      transform: none;
      padding: 0 var(--spacing-s);
    }

    .card {
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

    .avatar {
      flex: 0 0 clamp(140px, 20vh, 220px);
      border-radius: 0;
    }

    .body {
      flex: 0 0 auto;
      padding: var(--spacing-m);
      overflow-y: visible;
      height: auto;
      border-radius: 0;
    }
  }

  @media (width <= 480px) {
    .body {
      padding: var(--spacing-s);
      gap: var(--spacing-s);
    }
  }
</style>
