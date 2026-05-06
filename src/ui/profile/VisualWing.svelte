<script>
  /**
   * @file src/ui/profile/VisualWing.svelte
   * ❄️ THE ENTITY SHOWCASE ENGINE
   * Manages signature colors, generation prompts, and modifiers.
   * Part of the RPGlitch "Chalk Regime" UI collection.
   */
  import Button from "@atoms/Button.svelte";
  import TextField from "@atoms/TextField.svelte";
  import Toggle from "@atoms/Toggle.svelte";
  import Wing from "@atoms/Wing.svelte";
  import { tooltip } from "@atoms/Tooltip.svelte";
  import { llm_service } from "@core/intelligence/llm-service.js";
  import { prompt_builder } from "@core/intelligence/prompt-builder.js";
  import { validateImage } from "@core/security.js";
  import { AestheticResolver } from "@media/optics.js";
  import { app } from "@state/app.svelte.js";
  import { PALETTE, PALETTE_VARS } from "@theme/palette.svelte.js";
  import { get_value, set_value } from "@utils/field-path.js";

  const SPECTRUM_COLORS = Object.entries(PALETTE).filter(([name]) => name !== "default");

  /** @type {{ char: any, is_editing: boolean, busy_fields: Set<string>, active_field: any }} */
  let { char = $bindable(), is_editing, busy_fields, active_field = $bindable() } = $props();

  // --- STATE MANAGEMENT ---

  /** Synchronously ensure the modifiers object exists with required schema */
  const sync_modifiers = () => {
    if (!char.modifiers) {
      char.modifiers = {
        prompt: "",
        noBackground: false,
        flipped: false,
        profile_picture_seed: 0,
        colorName: "",
      };
      return;
    }

    // Ensure individual fields exist without re-assigning the whole object
    if (char.modifiers.prompt === undefined) char.modifiers.prompt = "";
    if (char.modifiers.noBackground === undefined) char.modifiers.noBackground = false;
    if (char.modifiers.flipped === undefined) char.modifiers.flipped = false;
    if (char.modifiers.profile_picture_seed === undefined)
      char.modifiers.profile_picture_seed = 0;
    if (char.modifiers.colorName === undefined) char.modifiers.colorName = "";
  };

  sync_modifiers();
  $effect(sync_modifiers);

  /** @type {HTMLInputElement | undefined} */
  let file_input = $state();

  // --- DERIVED LOGIC ---

  const is_prompt_busy = $derived(app.visual.isLoading || busy_fields.has("visual-prompt"));
  const prompt_value = $derived((char.modifiers.prompt || "").trim());
  const has_prompt_text = $derived(
    prompt_value.length > 0 &&
      !prompt_value.startsWith("http") &&
      !prompt_value.startsWith("data:"),
  );

  const is_creative_disabled = $derived(
    !is_editing ||
      (is_prompt_busy && (!active_field || active_field.key === "visual-prompt")) ||
      (!active_field && has_prompt_text),
  );

  // --- LOGIC HANDLERS ---

  /** Triggers AI enhancement or metadata extraction based on context */
  async function handle_creative_action() {
    const current_key = active_field?.key || "visual-prompt";
    if (busy_fields.has(current_key)) return;
    busy_fields.add(current_key);

    try {
      if (current_key === "visual-prompt") {
        if (!has_prompt_text) {
          char.modifiers.prompt = AestheticResolver.extract(char);
        } else {
          const result = await app.visual.enhance(char.modifiers.prompt, {
            physical: char.modifiers.prompt,
          });
          if (result) char.modifiers.prompt = result;
        }
      } else if (active_field) {
        const val = get_value(char, current_key);
        if (val) {
          const payload = prompt_builder.build_enhancement(current_key, val);
          const res = await llm_service.enhance(payload);
          if (res) set_value(char, current_key, res);
        }
      }
    } catch (err) {
      console.error("Creative action failed:", err);
    } finally {
      busy_fields.delete(current_key);
    }
  }

  /** Triggers image generation via external engine or falls back to upload */
  async function handle_generate() {
    if (busy_fields.has("visual-prompt")) return;
    busy_fields.add("visual-prompt");

    if (has_prompt_text) {
      app.log(`[VisualWing] Generating... Prompt: ${prompt_value}`, "system");
      try {
        const url = await app.visual.generate(prompt_value, {
          noBackground: char.modifiers.noBackground,
        });
        if (url) char.profile_picture = url;
      } catch (err) {
        app.log(`Generation failed: ${/** @type {Error} */ (err).message}`, "error");
      } finally {
        busy_fields.delete("visual-prompt");
      }
    } else {
      file_input?.click();
      busy_fields.delete("visual-prompt");
    }
  }

  /** Handles manual image upload and validation */
  /** @param {Event & { currentTarget: HTMLInputElement }} e */
  async function handle_upload(e) {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    try {
      await validateImage(file);
      const url = await app.visual.upload(file);
      if (url) char.profile_picture = url;
    } catch (err) {
      app.log(`Upload failed: ${/** @type {Error} */ (err).message}`, "error");
    }
  }

  /** Focus tracking to clear active field when clicking outside */
  /** @param {FocusEvent & { currentTarget: HTMLElement }} e */
  function handle_focus_out(e) {
    const root = e.currentTarget;
    setTimeout(() => {
      const focus = document.activeElement;
      if (root && !root.contains(focus) && busy_fields.size === 0 && !focus?.closest(".text-area")) {
        active_field = null;
      }
    }, 50);
  }
</script>

<Wing onfocusout={handle_focus_out}>
  <div class="spectrum">
    {#each SPECTRUM_COLORS as [name, hex] (name)}
      {@const color = PALETTE_VARS[/** @type {keyof typeof PALETTE_VARS} */ (hex)] || hex}
      <Button
        className="swatch {char.signature_color === hex || char.signature_color === name
          ? 'active'
          : ''}"
        style="background-color: {color}; --swatch-color: {color};"
        aria-label={name}
        actions={[tooltip]}
        onclick={() => (char.signature_color = name)}
        disabled={!is_editing}
        variant="invisible"
      ></Button>
    {/each}
  </div>

  <div class="prompt">
    <TextField
      class="control {active_field?.key === 'visual-prompt' ? 'active' : ''}"
      is_edit={is_editing}
      busy={is_prompt_busy}
      bind:value={char.modifiers.prompt}
      placeholder="Enter image prompt or paste a URL..."
      disabled={!is_editing || is_prompt_busy}
      onfocus={() => is_editing && (active_field = { key: "visual-prompt", label: "Image Prompt" })}
    >
      {#snippet status()}
        {#if is_prompt_busy || app.visual.error || app.visual.isOffline}
          <div class="status" class:is-error={app.visual.error || app.visual.isOffline}>
            {#if app.visual.isOffline}
              <span class="status-tag">OFFLINE</span>
            {:else if app.visual.error}
              <span class="status-tag">ERROR</span>
            {:else if app.visual.attempts > 0}
              <span class="status-tag pulse">RETRYING</span>
            {:else}
              <span class="status-tag pulse">GENERATING</span>
            {/if}
          </div>
        {/if}
      {/snippet}

      {#snippet actions()}
        {#if is_editing}
          <div class="actions">
            <Button
              variant="invisible"
              size="sm"
              square
              aria-label={has_prompt_text ? "Enhance Prompt" : "Fetch Data"}
              className="action-btn"
              actions={[tooltip]}
              onclick={handle_creative_action}
              disabled={is_creative_disabled}
            >
              {#if has_prompt_text}
                <svg viewBox="0 0 24 24" class="icon-xs icon-outline">
                  <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" fill="var(--color-white)"
                  ></path>
                </svg>
              {:else}
                <svg viewBox="0 0 24 24" class="icon-xs icon-outline">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="var(--color-white)"
                  ></path>
                  <polyline points="7 10 12 15 17 10" stroke="var(--color-white)"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3" stroke="var(--color-white)"></line>
                </svg>
              {/if}
            </Button>

            <Button
              variant="invisible"
              size="sm"
              square
              aria-label="Generate Image"
              className="action-btn"
              actions={[tooltip]}
              onclick={handle_generate}
              disabled={!is_editing || is_prompt_busy}
            >
              <svg viewBox="0 0 24 24" class="icon-xs icon-outline">
                <path
                  d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                  stroke="var(--color-white)"
                ></path>
                <circle cx="12" cy="13" r="4" stroke="var(--color-white)"></circle>
              </svg>
            </Button>
          </div>
        {/if}
      {/snippet}
    </TextField>

    <input
      type="file"
      accept="image/*"
      class="hidden-input"
      bind:this={file_input}
      onchange={handle_upload}
    />
  </div>

  <div class="modifiers">
    <Toggle
      label="No Background"
      bind:value={char.modifiers.noBackground}
      disabled={!is_editing}
    />
    <Toggle label="Mirror Image" bind:value={char.modifiers.flipped} disabled={!is_editing} />
  </div>
</Wing>

<style>
  .spectrum {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) 0;
  }

  .spectrum :global(.button.swatch) {
    width: 100%;
    aspect-ratio: 1;
    border: 0;
    padding: 0;
    min-height: 0;
    border-radius: var(--border-radius-m);
    cursor: pointer;
    transition: all var(--motion-l) var(--motion-elastic);
    box-shadow: var(--shadow-s);
  }

  .spectrum :global(.button.swatch:hover:not(:disabled)) {
    transform: scale(1.1);
    z-index: var(--z-index-m);
    box-shadow: var(--shadow-m);
    background-color: var(--swatch-color);
  }

  .spectrum :global(.button.swatch.active) {
    box-shadow: 0 0 16px var(--swatch-color);
    transform: scale(1.15);
    z-index: var(--z-index-m);
    border: var(--border-l);
    border-color: rgb(var(--color-white-rgb) / var(--opacity-s));
  }

  .spectrum :global(.button.swatch:disabled) {
    cursor: default;
    opacity: var(--opacity-l);
  }

  .prompt {
    position: relative;
    width: 100%;
  }

  .hidden-input {
    display: none;
  }

  .modifiers {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .status {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    color: var(--color-white);
  }

  .status.is-error {
    color: var(--color-red);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }
</style>
