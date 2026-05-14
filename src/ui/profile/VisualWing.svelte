<script>
  /**
   * @file src/ui/profile/VisualWing.svelte
   * ❄️ THE ENTITY SHOWCASE ENGINE
   * Manages signature colors, generation prompts, and image modifiers.
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
  import { PALETTE, PALETTE_VARS, themeStore } from "@theme/palette.svelte.js";
  import { get_value, set_value } from "@utils/field-path.js";

  /** @type {{ char: any, is_editing: boolean, busy_fields: Set<string>, active_field: any }} */
  let { char = $bindable(), is_editing, busy_fields, active_field = $bindable() } = $props();

  // --- CONSTANTS ---

  const SPECTRUM_COLORS = Object.entries(PALETTE).filter(([name]) => name !== "default");

  // --- INITIALIZATION ---

  /**
   * Ensures the modifiers object exists with all required fields.
   * Called bare (for synchronous init) and inside $effect (for reactive re-sync
   * when `char` is swapped at runtime).
   */
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

  /** True when the prompt is freeform text (not a URL or data URI). */
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

  /**
   * Triggers AI enhancement for the active field, or extracts optics metadata
   * when no prompt text is present.
   */
  async function handle_creative_action() {
    const current_key = active_field?.key || "visual-prompt";
    if (busy_fields.has(current_key)) return;
    busy_fields.add(current_key);

    try {
      if (current_key === "visual-prompt") {
        if (!has_prompt_text) {
          char.modifiers.prompt = AestheticResolver.extract(char);
        } else {
          const result = await app.visual.enhance(char.modifiers.prompt);
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
      console.error("[VisualWing] Creative action failed:", err);
    } finally {
      busy_fields.delete(current_key);
    }
  }

  /**
   * Triggers image generation when a prompt exists, or opens the file picker
   * as a fallback for direct uploads.
   */
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
   * Handles manual image upload with security validation.
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

<section class="wrapper glass-elevated">
  <!-- Signature Color Swatches -->
  <div class="swatches">
    {#each SPECTRUM_COLORS as [name, hex] (name)}
      {@const color = PALETTE_VARS[/** @type {keyof typeof PALETTE_VARS} */ (hex)] || hex}
      <Button
        square={true}
        className="swatch {themeStore.get_signature_label(char) === name ? 'active' : ''}"
        style="--swatch-dynamic-bg: {color}; background-color: var(--swatch-dynamic-bg); --swatch-color: var(--swatch-dynamic-bg);"
        aria-label={name}
        actions={[tooltip]}
        onclick={() => (char.signature_color = name)}
        disabled={!is_editing}
        variant="invisible"
      ></Button>
    {/each}
  </div>

  <!-- Image Prompt -->
  <TextField
    class="prompt-field {active_field?.key === 'visual-prompt' ? 'active' : ''}"
    is_edit={is_editing}
    busy={is_prompt_busy}
    bind:value={char.modifiers.prompt}
    placeholder="Enter image prompt or paste a URL..."
    disabled={!is_editing || is_prompt_busy}
    onfocus={() => is_editing && (active_field = { key: "visual-prompt", label: "Image Prompt" })}
  >
    {#snippet status()}
      {#if is_prompt_busy || app.visual.error || app.visual.isOffline}
        <div
          class="status-bar"
          class:is-error={app.visual.error || app.visual.isOffline}
          class:is-loading={is_prompt_busy}
        >
          <div class="status-content">
            {#if app.visual.isOffline}
              <span class="tag">OFFLINE</span>
            {:else if app.visual.error}
              <span class="tag">ERROR</span>
              <span class="status-msg">{app.visual.error}</span>
            {:else if app.visual.attempts > 0}
              <span class="tag pulse">RETRYING</span>
              <span class="status-msg">Attempt {app.visual.attempts}</span>
            {:else}
              <span class="tag pulse">GENERATING</span>
            {/if}
          </div>
        </div>
      {/if}
    {/snippet}

    {#snippet header_actions()}
      {#if is_editing}
        <div class="actions">
          <Button
            variant="invisible"
            size="small"
            square
            aria-label={has_prompt_text ? "Enhance Prompt" : "Fetch Data"}
            className="action"
            actions={[tooltip]}
            onclick={handle_creative_action}
            disabled={is_creative_disabled}
          >
            {#if has_prompt_text}
              <svg viewBox="0 0 24 24" class="icon-small icon-outline">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" fill="var(--color-white)"
                ></path>
              </svg>
            {:else}
              <svg viewBox="0 0 24 24" class="icon-small icon-outline">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="var(--color-white)"
                ></path>
                <polyline points="7 10 12 15 17 10" stroke="var(--color-white)"></polyline>
                <line x1="12" y1="15" x2="12" y2="3" stroke="var(--color-white)"></line>
              </svg>
            {/if}
          </Button>

          <Button
            variant="invisible"
            size="small"
            square
            aria-label="Generate Image"
            className="action"
            actions={[tooltip]}
            onclick={handle_generate}
            disabled={!is_editing || is_prompt_busy}
          >
            <svg viewBox="0 0 24 24" class="icon-small icon-outline">
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

  <!-- Image Controls -->
  <div class="controls">
    <Toggle
      label="No Background"
      bind:value={char.modifiers.no_background}
      disabled={!is_editing}
    />
    <Toggle label="Mirror Image" bind:value={char.modifiers.flipped} disabled={!is_editing} />
  </div>

  <input
    type="file"
    accept="image/*"
    class="upload"
    bind:this={file_input}
    onchange={handle_upload}
  />
</section>

<style>
  /* --- Wing Wrapper --- */

  .wrapper {
    width: 100%;
    overflow: visible;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    position: relative;
    transition: all var(--duration-standard) var(--motion-elastic);
    background-color: rgb(from var(--color-gunmetal) r g b / var(--opacity-base));
    padding: var(--spacing-4);
    gap: var(--spacing-4);
  }

  /* --- Swatches --- */

  .swatches {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--spacing-2);
    width: 100%;
  }

  .swatches :global(.swatch) {
    width: 100%;
    aspect-ratio: 1 / 1;
    border: 0;
    padding: 0;
    min-width: 0;
    min-height: 0;
    border-radius: var(--radius-subtle);
    cursor: pointer;
    transition:
      transform var(--duration-fast) var(--motion-dissolve),
      box-shadow var(--duration-fast) var(--motion-dissolve),
      outline var(--duration-fast) var(--motion-dissolve),
      filter var(--duration-fast) var(--motion-dissolve);
    box-shadow: var(--shadow-ghost);
  }

  .swatches :global(.swatch:hover:not(:disabled, .active)) {
    z-index: var(--mid-z-index);
    box-shadow: var(--shadow-heavy);
    filter: brightness(1.15);
  }

  .swatches :global(.swatch.active) {
    outline: var(--spacing-2px) solid rgb(from var(--color-white) r g b / var(--opacity-moderate));
    outline-offset: var(--spacing-2px);
    --active-swatch-shadow:
      0 0 0 var(--spacing-pixel) rgb(from var(--color-white) r g b / var(--opacity-whisper)) inset,
      0 0 var(--spacing-3) var(--spacing-1) var(--swatch-color);

    box-shadow: var(--active-swatch-shadow);
    transform: scale(1.06);
    z-index: var(--mid-z-index);
    cursor: default;
  }

  /* Suppress Button's internal hover filter when active */
  .swatches :global(.swatch.active:hover) {
    filter: none;
  }

  .swatches :global(.swatch:disabled) {
    cursor: default;
    opacity: var(--opacity-base);
  }

  /* --- Status & Actions --- */

  :global(.prompt-field .status-bar) {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    color: var(--color-white);
    background: rgb(from var(--color-white) r g b / var(--opacity-ghost));
    padding: var(--spacing-1) var(--spacing-3);
    border-radius: var(--radius-full);
    border: var(--spacing-pixel) solid rgb(from var(--color-white) r g b / var(--opacity-whisper));
  }

  :global(.prompt-field .status-content) {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
  }

  :global(.prompt-field .status-bar.is-error) {
    color: var(--color-red);
    background: rgb(from var(--color-red) r g b / var(--opacity-whisper));
    border-color: rgb(from var(--color-red) r g b / var(--opacity-whisper));
  }

  :global(.prompt-field .tag) {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
    font-weight: var(--font-weight-heavy);
    letter-spacing: var(--font-spacing-loose);
    text-transform: uppercase;
    color: inherit;
  }

  :global(.prompt-field .tag.pulse) {
    animation: pulse-tag 1.4s ease-in-out infinite;
  }

  :global(.prompt-field .actions) {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
  }

  .upload {
    display: none;
  }

  /* --- Controls --- */

  .controls {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }

  /* --- Animations --- */

  @keyframes pulse-tag {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.4;
    }
  }
</style>
