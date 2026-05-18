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

  /**
   * @typedef {Object} Props
   * @property {import('./profile.svelte.js').ProfileState} profileState - The profile state controller
   */

  /** @type {Props} */
  let { profileState } = $props();

  // --- CONSTANTS ---

  const SPECTRUM_COLORS = Object.entries(PALETTE).filter(([name]) => name !== "default");

  // --- INITIALIZATION ---

  /**
   * Ensures the modifiers object exists with all required fields.
   */
  const sync_modifiers = () => {
    if (!profileState.char) return;
    if (!profileState.char.modifiers) {
      profileState.char.modifiers = {
        prompt: "",
        no_background: false,
        flipped: false,
        profile_picture_seed: 0,
        color_name: "",
      };
      return;
    }
    profileState.char.modifiers.prompt ??= "";
    profileState.char.modifiers.no_background ??= false;
    profileState.char.modifiers.flipped ??= false;
    profileState.char.modifiers.profile_picture_seed ??= 0;
    profileState.char.modifiers.color_name ??= "";
  };

  sync_modifiers();
  $effect(sync_modifiers);

  // --- STATE ---

  /** @type {HTMLInputElement | undefined} */
  let file_input = $state();

  // --- DERIVED ---

  const is_prompt_busy = $derived(
    app.visual.isLoading || profileState.busy_fields.has("visual-prompt"),
  );

  const prompt_value = $derived((profileState.char?.modifiers?.prompt || "").trim());

  /** True when the prompt is freeform text (not a URL or data URI). */
  const has_prompt_text = $derived(
    prompt_value.length > 0 &&
      !prompt_value.startsWith("http") &&
      !prompt_value.startsWith("data:"),
  );

  const is_creative_disabled = $derived(
    !profileState.is_editing ||
      (is_prompt_busy &&
        (!profileState.active_field || profileState.active_field.key === "visual-prompt")) ||
      (!profileState.active_field && has_prompt_text),
  );

  // --- HANDLERS ---

  /**
   * Triggers AI enhancement for the active field, or extracts optics metadata
   * when no prompt text is present.
   */
  async function handle_creative_action() {
    const current_key = profileState.active_field?.key || "visual-prompt";
    if (profileState.busy_fields.has(current_key)) return;
    profileState.busy_fields.add(current_key);

    try {
      if (current_key === "visual-prompt") {
        if (!has_prompt_text) {
          profileState.char.modifiers.prompt = AestheticResolver.extract(profileState.char);
        } else {
          const result = await app.visual.enhance(profileState.char.modifiers.prompt);
          if (result) profileState.char.modifiers.prompt = result;
        }
      } else if (profileState.active_field) {
        const val = profileState.get_safe_value(current_key);
        if (val) {
          const payload = prompt_builder.build_enhancement(current_key, val);
          const res = await llm_service.enhance(payload);
          if (res) profileState.set_field_value(current_key, res);
        }
      }
    } catch (err) {
      console.error("[VisualWing] Creative action failed:", err);
    } finally {
      profileState.busy_fields.delete(current_key);
    }
  }

  /**
   * Triggers image generation when a prompt exists, or opens the file picker
   * as a fallback for direct uploads.
   */
  async function handle_generate() {
    if (profileState.busy_fields.has("visual-prompt")) return;

    if (!has_prompt_text) {
      file_input?.click();
      return;
    }

    profileState.busy_fields.add("visual-prompt");
    app.log(`[VisualWing] Generating... Prompt: ${prompt_value}`, "system");

    try {
      const url = await app.visual.generate(prompt_value, {
        no_background: profileState.char.modifiers.no_background,
      });
      if (url) profileState.char.profile_picture = url;
    } catch (err) {
      app.log(`Generation failed: ${/** @type {Error} */ (err).message}`, "error");
    } finally {
      profileState.busy_fields.delete("visual-prompt");
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
      if (url) profileState.char.profile_picture = url;
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
        className="swatch {themeStore.get_signature_label(profileState.char) === name
          ? 'active'
          : ''}"
        style="--swatch-dynamic-bg: {color}; background-color: var(--swatch-dynamic-bg); --swatch-color: var(--swatch-dynamic-bg);"
        aria-label={name}
        actions={[tooltip]}
        onclick={() => (profileState.char.signature_color = name)}
        disabled={!profileState.is_editing}
        variant="invisible"
      ></Button>
    {/each}
  </div>

  <!-- Image Prompt -->
  <TextField
    class="prompt-field {profileState.active_field?.key === 'visual-prompt' ? 'active' : ''}"
    is_edit={profileState.is_editing}
    busy={is_prompt_busy}
    bind:value={profileState.char.modifiers.prompt}
    placeholder="Enter image prompt or paste a URL..."
    disabled={!profileState.is_editing || is_prompt_busy}
    onfocus={() =>
      profileState.is_editing &&
      (profileState.active_field = { key: "visual-prompt", label: "Image Prompt" })}
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
      {#if profileState.is_editing}
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
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" fill="var(--pure-white)"
                ></path>
              </svg>
            {:else}
              <svg viewBox="0 0 24 24" class="icon-small icon-outline">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="var(--pure-white)"
                ></path>
                <polyline points="7 10 12 15 17 10" stroke="var(--pure-white)"></polyline>
                <line x1="12" y1="15" x2="12" y2="3" stroke="var(--pure-white)"></line>
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
            disabled={!profileState.is_editing || is_prompt_busy}
          >
            <svg viewBox="0 0 24 24" class="icon-small icon-outline">
              <path
                d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                stroke="var(--pure-white)"
              ></path>
              <circle cx="12" cy="13" r="4" stroke="var(--pure-white)"></circle>
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
      bind:value={profileState.char.modifiers.no_background}
      disabled={!profileState.is_editing}
    />
    <Toggle
      label="Mirror Image"
      bind:value={profileState.char.modifiers.flipped}
      disabled={!profileState.is_editing}
    />
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
    background-color: rgb(from var(--gunmetal) r g b / var(--opacity-muted));
    padding: var(--padding-standard);
    gap: var(--gap-standard);
  }

  /* --- Swatches --- */

  .swatches {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--gap-standard);
    width: 100%;
  }

  .swatches :global(.swatch) {
    width: 100%;
    aspect-ratio: 1 / 1;
    border: 0;
    padding: 0;
    min-width: 0;
    min-height: 0;
    border-radius: var(--radius-sharp);
    cursor: pointer;
    transition:
      transform var(--duration-fast) var(--motion-dissolve),
      box-shadow var(--duration-fast) var(--motion-dissolve),
      outline var(--duration-fast) var(--motion-dissolve),
      filter var(--duration-fast) var(--motion-dissolve);
    box-shadow: var(--shadow-ghost);
  }

  .swatches :global(.swatch:hover:not(:disabled, .active)) {
    z-index: var(--z-index-elevated);
    box-shadow: var(--shadow-standard);
    filter: brightness(1.15);
  }

  .swatches :global(.swatch.active) {
    outline: calc(var(--spacing-pixel) * 2) solid
      rgb(from var(--pure-white) r g b / var(--opacity-muted));
    outline-offset: calc(var(--spacing-pixel) * 2);
    --signature-glow:
      0 0 0 var(--spacing-pixel) rgb(from var(--pure-white) r g b / var(--opacity-whisper)) inset,
      0 0 calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 1) var(--swatch-color);

    box-shadow: var(--signature-glow);
    transform: scale(1.06);
    z-index: var(--z-index-elevated);
    cursor: default;
  }

  /* Suppress Button's internal hover filter when active */
  .swatches :global(.swatch.active:hover) {
    filter: none;
  }

  .swatches :global(.swatch:disabled) {
    cursor: default;
    opacity: var(--opacity-muted);
  }

  /* --- Status & Actions --- */

  :global(.prompt-field .status-bar) {
    display: flex;
    align-items: center;
    gap: var(--gap-standard);
    color: var(--pure-white);
    background: rgb(from var(--pure-white) r g b / var(--opacity-ghost));
    padding: var(--padding-tight);
    border-radius: var(--radius-full);
    border: var(--spacing-pixel) solid rgb(from var(--pure-white) r g b / var(--opacity-whisper));
  }

  :global(.prompt-field .status-content) {
    display: flex;
    align-items: center;
    gap: var(--gap-standard);
  }

  :global(.prompt-field .status-bar.is-error) {
    color: var(--crimson-red);
    background: rgb(from var(--crimson-red) r g b / var(--opacity-whisper));
    border-color: rgb(from var(--crimson-red) r g b / var(--opacity-whisper));
  }

  :global(.prompt-field .tag) {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
    font-weight: var(--font-weight-bold);
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
    gap: var(--gap-standard);
  }

  .upload {
    display: none;
  }

  /* --- Controls --- */

  .controls {
    display: flex;
    flex-direction: column;
    gap: var(--gap-standard);
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
