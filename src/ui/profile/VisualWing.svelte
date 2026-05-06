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

  // --- INITIALIZATION ---

  /** Ensures the modifiers object exists with all required fields. */
  const sync_modifiers = () => {
    if (!char.modifiers) {
      char.modifiers = {
        prompt: "",
        no_background: false,
        flipped: false,
        profile_picture_seed: 0,
        color_name: "",
      };
      return;
    }
    char.modifiers.prompt ??= "";
    char.modifiers.no_background ??= false;
    char.modifiers.flipped ??= false;
    char.modifiers.profile_picture_seed ??= 0;
    char.modifiers.color_name ??= "";
  };

  sync_modifiers();
  $effect(sync_modifiers);

  // --- STATE ---

  /** @type {HTMLInputElement | undefined} */
  let file_input = $state();

  // --- DERIVED ---

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

  // --- HANDLERS ---

  /** Triggers AI enhancement or metadata extraction based on the active field. */
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

  /** Triggers image generation or falls back to the file upload dialog. */
  async function handle_generate() {
    if (busy_fields.has("visual-prompt")) return;

    if (!has_prompt_text) {
      file_input?.click();
      return;
    }

    busy_fields.add("visual-prompt");
    app.log(`[VisualWing] Generating... Prompt: ${prompt_value}`, "system");

    try {
      const url = await app.visual.generate(prompt_value, {
        no_background: char.modifiers.no_background,
      });
      if (url) char.profile_picture = url;
    } catch (err) {
      app.log(`Generation failed: ${/** @type {Error} */ (err).message}`, "error");
    } finally {
      busy_fields.delete("visual-prompt");
    }
  }

  /**
   * Handles manual image upload and validation.
   * @param {Event & { currentTarget: HTMLInputElement }} e
   */
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
</script>

<section class="wing glass-l">
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
      class="field {active_field?.key === 'visual-prompt' ? 'active' : ''}"
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
              <span class="tag">OFFLINE</span>
            {:else if app.visual.error}
              <span class="tag">ERROR</span>
            {:else if app.visual.attempts > 0}
              <span class="tag pulse">RETRYING</span>
            {:else}
              <span class="tag pulse">GENERATING</span>
            {/if}
          </div>
        {/if}
      {/snippet}

      {#snippet header_actions()}
        {#if is_editing}
          <div class="actions">
            <Button
              variant="invisible"
              size="sm"
              square
              aria-label={has_prompt_text ? "Enhance Prompt" : "Fetch Data"}
              className="action"
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
              className="action"
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
      class="upload"
      bind:this={file_input}
      onchange={handle_upload}
    />
  </div>

  <div class="modifiers">
    <Toggle
      label="No Background"
      bind:value={char.modifiers.no_background}
      disabled={!is_editing}
    />
    <Toggle label="Mirror Image" bind:value={char.modifiers.flipped} disabled={!is_editing} />
  </div>
</section>

<style>
  /* --- Wing Shell --- */

  .wing {
    width: 100%;
    overflow: visible;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    position: relative;
    transition: all var(--motion-l) var(--motion-elastic);
    background-color: rgb(var(--color-gunmetal-rgb) / 45%);
    padding: var(--spacing-m);
    gap: var(--spacing-m);
  }

  /* --- Spectrum --- */

  .spectrum {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-auto-rows: 1fr;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) 0;
  }

  .spectrum :global(.swatch) {
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

  .spectrum :global(.swatch:hover:not(:disabled)) {
    transform: scale(1.1);
    z-index: var(--z-index-m);
    box-shadow: var(--shadow-m);
    background-color: var(--swatch-color);
  }

  .spectrum :global(.swatch.active) {
    box-shadow: 0 0 16px var(--swatch-color);
    transform: scale(1.15);
    z-index: var(--z-index-m);
    border: var(--border-l);
    border-color: rgb(var(--color-white-rgb) / var(--opacity-s));
  }

  .spectrum :global(.swatch:disabled) {
    cursor: default;
    opacity: var(--opacity-l);
  }

  /* --- Prompt --- */

  .prompt {
    position: relative;
    width: 100%;
  }

  .upload {
    display: none;
  }

  /* --- Modifiers --- */

  .modifiers {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  /* --- Status --- */

  .status {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    color: var(--color-white);
  }

  .status.is-error {
    color: var(--color-red);
  }

  /* --- Actions --- */

  .actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }
</style>
