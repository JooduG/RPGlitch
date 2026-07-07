<script>
  /**
   * @file src/ui/profile/VisualWing.svelte
   * ❄️ THE ENTITY SHOWCASE ENGINE
   * Manages signature colors, generation prompts, and image modifiers.
   * Part of the RPGlitch "Chalk Regime" UI collection.
   */
  import { Button, TextField, Toggle, tooltip } from "@atoms";
  import { prompt_builder, strip_cognition_blocks } from "@intelligence";
  import { AestheticResolver, get_signature_label, PALETTE, PALETTE_VARS, SIGNATURE_COLORS } from "@media";
  import { llm_service } from "@platform";
  import { app } from "@state";

  /**
   * @typedef {Object} Props
   * @property {import('@organisms/profile.svelte.js').ProfileState} profileState - The profile state controller
   */

  /** @type {Props} */
  let { profileState } = $props();

  // --- CONSTANTS ---

  /**
   * Returns the HSL hue (0–360) for a hex color.
   * Achromatic colors (neutrals) return 361 so they sort to the end.
   * @param {string} hex
   */
  function hex_hue(hex) {
    const h = hex.replace("#", "").padEnd(6, "0");
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max === min) return 361;
    const d = max - min;
    let hue;
    if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) hue = ((b - r) / d + 2) / 6;
    else hue = ((r - g) / d + 4) / 6;
    return hue * 360;
  }

  const SPECTRUM_COLORS = Object.entries(PALETTE)
    .filter(([name]) => SIGNATURE_COLORS.includes(name))
    .sort(([, a], [, b]) => hex_hue(a) - hex_hue(b));

  // --- INITIALIZATION ---

  /**
   * Ensures the modifiers object exists with all required fields.
   */
  const sync_modifiers = () => {
    if (!profileState.char) return;
    if (!profileState.char.modifiers) {
      profileState.char.modifiers = {
        prompt: "",
        negative_prompt: "",
        no_background: false,
        flipped: false,
        profile_picture_seed: 0,
        color_name: "",
      };
      return;
    }
    profileState.char.modifiers.prompt ??= "";
    profileState.char.modifiers.negative_prompt ??= "";
    profileState.char.modifiers.no_background ??= false;
    profileState.char.modifiers.flipped ??= false;
    profileState.char.modifiers.profile_picture_seed ??= 0;
    profileState.char.modifiers.color_name ??= "";
  };

  sync_modifiers();
  $effect(sync_modifiers);

  // --- DERIVED ---

  const current_label = $derived(get_signature_label(profileState.char));

  const is_prompt_busy = $derived(app.visual.isLoading || profileState.busy_fields.has("visual-prompt"));

  const prompt_value = $derived((profileState.char?.modifiers?.prompt || "").trim());

  /** True when the prompt is freeform text (not a URL or data URI). */
  const has_prompt_text = $derived(prompt_value.length > 0 && !prompt_value.startsWith("http") && !prompt_value.startsWith("data:"));

  const is_creative_disabled = $derived(
    !profileState.is_editing ||
      (is_prompt_busy && (!profileState.active_field || profileState.active_field.key === "visual-prompt")) ||
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
          const result = await app.visual.enhance(profileState.char.modifiers.prompt, profileState.char.type);
          if (result) {
            let positive = result.prompt || "";
            let negative = result.negativePrompt || "";

            // Emergency extraction slice if upstream JSON.parse tripped and returned a raw string dump
            if (!negative && (positive.includes('"prompt"') || positive.includes('"negativePrompt"') || positive.includes('"negative_prompt"'))) {
              const cleanText = strip_cognition_blocks(positive);
              const promptMatch = cleanText.match(/"prompt"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
              const negMatch = cleanText.match(/"negative(?:Prompt|_prompt)"\s*:\s*"((?:[^"\\]|\\.)*)"/i);

              if (promptMatch && promptMatch[1]) {
                positive = promptMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
              }
              if (negMatch && negMatch[1]) {
                negative = negMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
              }
            }

            if (positive) profileState.char.modifiers.prompt = positive.trim();
            if (negative) profileState.char.modifiers.negative_prompt = negative.trim();
          }
        }
      } else if (profileState.active_field) {
        const val = profileState.get_safe_value(current_key);
        if (val) {
          const payload = prompt_builder.build_enhancement(
            current_key,
            val,
            profileState.char.name,
            profileState.char.type,
            false,
            profileState.char,
          );
          const res = await llm_service.enhance(payload);
          if (res) {
            const clean_res = strip_cognition_blocks(res).trim();
            profileState.set_field_value(current_key, clean_res);
          }
        }
      }
    } catch (err) {
      console.error("[VisualWing] Creative action failed:", err);
    } finally {
      profileState.busy_fields.delete(current_key);
    }
  }

  /**
   * Triggers image generation when a prompt exists, or opens the upload dialog
   * as a fallback for direct uploads.
   */
  async function handle_generate() {
    if (profileState.busy_fields.has("visual-prompt")) return;

    if (!has_prompt_text) {
      await handle_upload_portrait();
      return;
    }

    profileState.busy_fields.add("visual-prompt");
    app.log(`[VisualWing] Generating... Prompt: ${prompt_value}`, "system");

    try {
      const payload = await app.visual.generate(prompt_value, {
        mode: profileState.char.type,
        no_background: profileState.noBackground,
        negativePrompt: profileState.char.modifiers.negative_prompt || undefined,
        returnPayload: true,
      });
      if (payload?.url) {
        profileState.char.profile_picture = payload.url;
        if (payload.metadata?.seed) profileState.char.modifiers.profile_picture_seed = payload.metadata.seed;
        if (payload.metadata?.negativePrompt) profileState.char.modifiers.negative_prompt = payload.metadata.negativePrompt;
      }
    } catch (err) {
      app.log(`Generation failed: ${/** @type {Error} */ (err).message}`, "error");
    } finally {
      profileState.busy_fields.delete("visual-prompt");
    }
  }

  /**
   * Handles manual image upload via Perchance upload plugin.
   */
  async function handle_upload_portrait() {
    if (profileState.busy_fields.has("visual-prompt")) return;
    profileState.busy_fields.add("visual-prompt");
    app.log("[VisualWing] Triggering manual image upload...", "system");

    try {
      const dataUrl = await app.visual.upload();
      if (dataUrl) {
        await profileState.setImage(dataUrl);
        app.log("[VisualWing] Image upload succeeded and state persisted.", "system");
      }
    } catch (err) {
      app.log(`Upload failed: ${/** @type {Error} */ (err).message}`, "error");
    } finally {
      profileState.busy_fields.delete("visual-prompt");
    }
  }

  /**
   * Prevents default behavior to maintain active focus states.
   * @param {MouseEvent} e
   */
  function prevent_default(e) {
    e.preventDefault();
  }
</script>

<section
  class="
  flex w-full
  flex-col
  gap-gap-standard
  rounded-standard
  bg-glass-elevated
  p-padding-standard
  [backdrop-filter:var(--blur-mist)]
"
>
  <div
    class="
    grid
    grid-cols-5
    gap-gap-tight
  "
  >
    {#each SPECTRUM_COLORS as [name, hex] (name)}
      {@const color = PALETTE_VARS[/** @type {keyof typeof PALETTE_VARS} */ (hex)] || hex}
      <div
        class="
          relative
          aspect-square
          w-full
          rounded-xl
          shadow-ghost
          transition-all
          duration-(--duration-fast)
          ease-(--motion-dissolve)
          has-[:not(:disabled)]:hover:z-20
          has-[:not(:disabled)]:hover:shadow-standard
          has-[:not(:disabled)]:hover:brightness-125
          has-[:not(:disabled)]:active:scale-[0.96]
          {current_label === name
          ? `
            z-25
            scale-[1.1]
            cursor-default
            [box-shadow:0_0_calc(var(--spacing-spacing-unit)*5)_var(--swatch-color)]
            outline-[calc(var(--spacing-spacing-pixel)*3)]
            outline-offset-[calc(var(--spacing-spacing-pixel)*2)]
            outline-white
            brightness-110
            outline-solid
          `
          : ''}"
        style="--swatch-color: {color}; background-color: var(--swatch-color);"
      >
        <Button
          square={true}
          cover={true}
          aria-label={name}
          actions={[tooltip]}
          onclick={() => (profileState.char.signature_color = name)}
          disabled={!profileState.is_editing}
          variant="invisible"
        ></Button>
      </div>
    {/each}
  </div>

  <TextField
    data-active={profileState.active_field?.key === "visual-prompt" ? true : undefined}
    is_edit={profileState.is_editing}
    busy={is_prompt_busy}
    bind:value={profileState.char.modifiers.prompt}
    placeholder="Image prompt or URL..."
    disabled={!profileState.is_editing || is_prompt_busy}
    signature_color="var(--color-frozen)"
    onfocus={() => profileState.is_editing && (profileState.active_field = { key: "visual-prompt", label: "Image Prompt" })}
  >
    {#snippet status()}
      {#if is_prompt_busy || app.visual.error || app.visual.isOffline}
        <div
          class="
            flex
            items-center
            gap-4
            rounded-full
            border
            p-2

            {app.visual.error || app.visual.isOffline
            ? `
              border-red-500/15
              bg-red-500/15
              text-red-500
            `
            : `
              border-white/15
              bg-white/5
              text-slate-50
            `}"
          data-loading={is_prompt_busy}
        >
          <div
            class="
            box-border
            flex
            items-center
            gap-4
          "
          >
            {#if app.visual.isOffline}
              <span
                class="
                  font-mono
                  text-[0.625rem]
                  tracking-widest
                  text-inherit
                  uppercase
                ">OFFLINE</span
              >
            {:else if app.visual.error}
              <span
                class="
                  font-mono
                  text-[0.625rem]
                  tracking-widest
                  text-inherit
                  uppercase
                ">ERROR</span
              >
              <span class="font-mono text-[10px] tracking-widest text-slate-400 uppercase opacity-80">{app.visual.error}</span>
            {:else if app.visual.attempts > 0}
              <span
                class="
                  animate-pulse
                  font-mono
                  text-[0.625rem]
                  tracking-widest
                  text-inherit
                  uppercase
                ">RETRYING</span
              >
              <span class="font-mono text-[10px] tracking-widest text-slate-400 uppercase opacity-80">Attempt {app.visual.attempts}</span>
            {:else}
              <span
                class="
                  animate-pulse
                  font-mono
                  text-[0.625rem]
                  tracking-widest
                  text-inherit
                  uppercase
                ">GENERATING</span
              >
            {/if}
          </div>
        </div>
      {/if}
    {/snippet}

    {#snippet header_actions()}
      {#if profileState.is_editing}
        <div
          class="
          flex
          items-center
          gap-2
        "
        >
          <Button
            variant="invisible"
            size="small"
            square
            aria-label={has_prompt_text ? "Enhance Prompt" : "Fetch Data"}
            actions={[tooltip]}
            onclick={handle_creative_action}
            onmousedown={prevent_default}
            disabled={is_creative_disabled}
          >
            {#if has_prompt_text}
              <svg
                viewBox="0 0 24 24"
                class="
                size-icon-small
              "
              >
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" fill="currentColor"></path>
              </svg>
            {:else}
              <svg
                viewBox="0 0 24 24"
                class="
                size-icon-small
              "
                fill="none"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor"></path>
                <polyline points="7 10 12 15 17 10" stroke="currentColor"></polyline>
                <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor"></line>
              </svg>
            {/if}
          </Button>

          <Button
            variant="invisible"
            size="small"
            square
            aria-label="Generate Image"
            actions={[tooltip]}
            onclick={handle_generate}
            onmousedown={prevent_default}
            disabled={!profileState.is_editing || is_prompt_busy}
          >
            <svg
              viewBox="0 0 24 24"
              class="
              size-icon-small
            "
              fill="none"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor"></path>
              <circle cx="12" cy="13" r="4" stroke="currentColor"></circle>
            </svg>
          </Button>

          <Button
            variant="invisible"
            size="small"
            square
            aria-label="Upload Portrait"
            actions={[tooltip]}
            onclick={handle_upload_portrait}
            onmousedown={prevent_default}
            disabled={!profileState.is_editing || is_prompt_busy}
          >
            <svg
              viewBox="0 0 24 24"
              class="
              size-icon-small
            "
              fill="none"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor"></path>
              <polyline points="17 8 12 3 7 8" stroke="currentColor"></polyline>
              <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor"></line>
            </svg>
          </Button>
        </div>
      {/if}
    {/snippet}
  </TextField>

  <TextField
    is_edit={profileState.is_editing}
    busy={is_prompt_busy}
    bind:value={profileState.char.modifiers.negative_prompt}
    placeholder="Negative prompt (avoid these)..."
    disabled={!profileState.is_editing || is_prompt_busy}
    signature_color="var(--color-frozen)"
  ></TextField>

  <div
    class="
    flex
    flex-col
    gap-2
  "
  >
    <Toggle label="Transparent Background" bind:value={profileState.noBackground} disabled={!profileState.is_editing} />
    <Toggle label="Mirror Image" bind:value={profileState.char.modifiers.flipped} disabled={!profileState.is_editing} />
  </div>
</section>
