<script>
  /**
   * @file src/ui/organisms/VisualWing.svelte
   * Signature color, diffusion style, prompt authoring, and portrait generation wing for Profile.
   */
  import { VISUAL_STYLES } from "@definitions";
  import { refine_image_prompt } from "@engine";
  import { visual_engine } from "@media";
  import { get_signature_label, PALETTE, PALETTE_CSS_VARIABLES, SIGNATURE_COLORS } from "@utils";
  import { Button, Icon, Label, Toggle, tooltip } from "@atoms";
  import { Dropdown, SourceField, TextField } from "@molecules";
  import { app } from "@state";
  import { extract_aesthetic_traits, sanitize_visual_text } from "@simulation";

  /**
   * @typedef {Object} Props
   * @property {ProfileController} profile_state - Profile state controller
   */

  /** @type {Props} */
  let { profile_state } = $props();

  /**
   * Returns the HSL hue (0-360) for a hex color; neutrals sort last.
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

  const sync_modifiers = () => {
    if (!profile_state.char) return;
    if (!profile_state.char.modifiers) {
      profile_state.char.modifiers = { prompt: "", negative_prompt: "", flipped: false, profile_picture_seed: null, last_generated_seed: null };
      return;
    }
    profile_state.char.modifiers.prompt ??= "";
    profile_state.char.modifiers.negative_prompt ??= "";
    profile_state.char.modifiers.flipped ??= false;
    if (profile_state.char.modifiers.profile_picture_seed === 0 || profile_state.char.modifiers.profile_picture_seed === undefined) {
      profile_state.char.modifiers.profile_picture_seed = null;
    }
    profile_state.char.modifiers.last_generated_seed ??= null;
  };

  sync_modifiers();
  $effect(sync_modifiers);

  const current_label = $derived(get_signature_label(profile_state.char));
  let generate_error = $state("");

  const is_prompt_busy = $derived(profile_state.busy_fields.has("generating-image") || profile_state.busy_fields.has("visual-prompt"));
  const prompt_value = $derived((profile_state.char?.modifiers?.prompt || "").trim());
  const has_prompt_text = $derived(prompt_value.length > 0 && !prompt_value.startsWith("http") && !prompt_value.startsWith("data:"));
  const is_creative_disabled = $derived(!profile_state.is_editing || is_prompt_busy);

  const visual_style_options = Object.values(VISUAL_STYLES)
    .sort((a, b) => {
      if (a.id === "none") return -1;
      if (b.id === "none") return 1;
      return a.name.localeCompare(b.name);
    })
    .map((style) => ({ value: style.id, label: style.name, portrait: style.portrait, tag: style.description, tooltip: `${style.name}: ${style.description}` }));

  async function handle_creative_action() {
    if (profile_state.busy_fields.has("visual-prompt")) return;
    profile_state.busy_fields.add("visual-prompt");

    try {
      if (!has_prompt_text && !prompt_value) {
        profile_state.char.modifiers.prompt = extract_aesthetic_traits(profile_state.char);
        profile_state.mark_mutated();
      } else if (has_prompt_text) {
        const result = await refine_image_prompt(profile_state.char.modifiers.prompt, profile_state.char.type, profile_state.char, app.settings?.visual_style);
        if (result) {
          const positive = sanitize_visual_text(result.prompt || "").trim();
          const negative = sanitize_visual_text(result.negative_prompt || "").trim();

          if (!positive || positive.includes("_thought_process") || positive.trimStart().startsWith('{"_thought_process')) {
            console.warn("Envision returned no usable prose - draft kept");
          } else {
            profile_state.char.modifiers.prompt = positive;
            if (negative) profile_state.char.modifiers.negative_prompt = negative;
            profile_state.mark_mutated();
          }
        }
      }
    } catch (err) {
      console.error("[VisualWing] Creative action failed:", err);
    } finally {
      profile_state.busy_fields.delete("visual-prompt");
    }
  }

  async function handle_generate() {
    if (profile_state.busy_fields.has("visual-prompt")) return;
    if (!has_prompt_text) return;

    generate_error = "";
    profile_state.busy_fields.add("visual-prompt");
    profile_state.busy_fields.add("generating-image");
    console.info(`[VisualWing] Painting... Prompt: ${prompt_value}`);

    try {
      const mode = profile_state.char?.type === "fractal" ? "story_scene" : "solo_entity";
      const payload = await visual_engine.generate(prompt_value, {
        mode,
        negative_prompt: profile_state.char.modifiers.negative_prompt || undefined,
        seed:
          (
            profile_state.char.modifiers.profile_picture_seed !== null &&
            profile_state.char.modifiers.profile_picture_seed !== undefined &&
            profile_state.char.modifiers.profile_picture_seed !== ""
          ) ?
            Number(profile_state.char.modifiers.profile_picture_seed)
          : undefined,
        returnPayload: true,
        _entity: profile_state.char,
      });
      if (payload?.image_url) {
        profile_state.char.profile_picture = payload.image_url;
        if (payload.metadata?.seed !== undefined) profile_state.char.modifiers.last_generated_seed = payload.metadata.seed;
      }
    } catch (err) {
      generate_error = /** @type {Error} */ (err).message || "Generation failed";
      console.error(`Generation failed: ${generate_error}`, err);
    } finally {
      profile_state.busy_fields.delete("visual-prompt");
      profile_state.busy_fields.delete("generating-image");
    }
  }

  /** @param {{kind: string, data_url?: string, url?: string, name?: string, message?: string}} info */
  function handle_source_field(info) {
    if (info.kind === "image" && info.data_url) {
      profile_state.setImage(info.data_url);
    } else if (info.kind === "error") {
      generate_error = info.message || "Unknown error";
      console.error(`Image failed: ${generate_error}`);
    }
  }

  /** @param {MouseEvent} e */
  function prevent_default(e) {
    e.preventDefault();
  }
</script>

<section
  class="flex w-full flex-col gap-tight rounded-standard bg-glass-elevated p-standard [backdrop-filter:var(--blur-mist)]"
  style:animation="wing-item-slide-down var(--motion-elastic) forwards"
  style:--signature-color="var(--color-frozen)">
  <div class="flex flex-col gap-tight">
    <Label>Signature Color</Label>

    <div class="isolate grid grid-cols-5 gap-tight">
      {#each SPECTRUM_COLORS as [name, hex] (name)}
        {@const color = PALETTE_CSS_VARIABLES[/** @type {keyof typeof PALETTE_CSS_VARIABLES} */ (hex)] || hex}
        <div
          class={[
            "relative aspect-square w-full rounded-xl shadow-ghost transition-shadow duration-fast ease-out has-not-disabled:hover:z-20 has-not-disabled:hover:shadow-standard has-not-disabled:hover:brightness-125 has-not-disabled:active:scale-sink",
            current_label === name &&
              "z-20 scale-[1.1] cursor-default [box-shadow:0_0_calc(var(--spacing-unit)*5)_var(--color-swatch-active)] outline-[calc(var(--spacing-pixel)*3)] outline-offset-[calc(var(--spacing-pixel)*2)] outline-white brightness-110 outline-solid",
          ]}
          style="--color-swatch-active: {color}; background-color: var(--color-swatch-active);">
          <Button
            square={true}
            cover={true}
            aria-label={name}
            actions={[tooltip]}
            onclick={() => {
              profile_state.char.signature_color = name;
              profile_state.mark_mutated();
            }}
            disabled={!profile_state.is_editing}
            variant="invisible"></Button>
        </div>
      {/each}
    </div>
  </div>

  <div class="flex flex-col gap-tight">
    <Label for="visual-style-select">Profile Picture Generation</Label>

    <div class="grid w-full grid-cols-[1fr_6rem] gap-tight">
      <div class="flex w-full min-w-0 flex-col gap-tight">
        <Dropdown
          id="visual-style-select"
          bind:value={profile_state.char.visual_style}
          items={visual_style_options}
          label="Select Visual Style"
          uppercase={false}
          matchWidth={false}
          dropdownWidth="w-80"
          align="start"
          disabled={!profile_state.is_editing}
          onchange={() => profile_state.mark_mutated()} />
      </div>
      <div class="flex h-full w-full flex-col justify-end gap-tight">
        <input
          id="seed-input"
          type="number"
          bind:value={profile_state.char.modifiers.profile_picture_seed}
          disabled={!profile_state.is_editing || is_prompt_busy}
          oninput={() => profile_state.mark_mutated()}
          placeholder="Seed"
          class="glass-input min-h-12 w-full [appearance:textfield] text-center font-mono [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
      </div>
    </div>
  </div>

  <SourceField
    mode="image"
    bind:value={profile_state.char.modifiers.prompt}
    disabled={!profile_state.is_editing || is_prompt_busy}
    busy={is_prompt_busy}
    is_edit={profile_state.is_editing}
    placeholder="Image prompt, URL, or drop/paste an image here..."
    size="sm"
    field_class=""
    data-active={profile_state.active_field?.key === "visual-prompt" ? true : undefined}
    oninput={() => profile_state.mark_mutated()}
    onfocus={() => profile_state.is_editing && (profile_state.active_field = { key: "visual-prompt", label: "Image Prompt" })}
    on_source={handle_source_field}>
    {#snippet status()}
      <div class="flex items-center gap-tight">
        <span class="font-mono text-[0.625rem] tracking-widest text-slate-50 uppercase">Positive Prompt</span>
        {#if generate_error}
          <div class="flex items-center gap-tight rounded-full border border-red-500/15 bg-red-500/15 p-tight text-red-500" data-loading={is_prompt_busy}>
            <div class="box-border flex items-center gap-tight">
              <span class="font-mono text-[0.625rem] tracking-widest text-inherit uppercase">ERROR</span>
              <span class="font-mono text-[10px] tracking-widest text-slate-400 uppercase opacity-80">{generate_error}</span>
            </div>
          </div>
        {/if}
      </div>
    {/snippet}

    {#snippet header_actions()}
      {#if profile_state.is_editing}
        <div class="flex items-center gap-tight">
          <Button
            variant="invisible"
            size="small"
            square
            aria-label={has_prompt_text ? "Envision Prompt" : "Fetch Data"}
            actions={[tooltip]}
            onclick={handle_creative_action}
            onmousedown={prevent_default}
            disabled={is_creative_disabled}>
            {#if has_prompt_text}
              <Icon name="ai_enhance" class="size-icon-small" />
            {:else}
              <Icon name="download" class="size-icon-small" />
            {/if}
          </Button>

          {#if has_prompt_text}
            <Button
              variant="invisible"
              size="small"
              square
              aria-label="Generate Image"
              actions={[tooltip]}
              onclick={handle_generate}
              onmousedown={prevent_default}
              disabled={is_creative_disabled}>
              <Icon name="camera" class="size-icon-small" />
            </Button>
          {/if}
        </div>
      {/if}
    {/snippet}
  </SourceField>

  <TextField
    data-active={profile_state.active_field?.key === "visual-negative-prompt" ? true : undefined}
    is_edit={profile_state.is_editing}
    busy={is_prompt_busy}
    bind:value={profile_state.char.modifiers.negative_prompt}
    placeholder="Negative prompt (avoid these)..."
    disabled={!profile_state.is_editing || is_prompt_busy}
    oninput={() => profile_state.mark_mutated()}
    onfocus={() => profile_state.is_editing && (profile_state.active_field = { key: "visual-negative-prompt", label: "Negative Prompt" })}>
    {#snippet status()}
      <span class="font-mono text-[0.625rem] tracking-widest text-slate-50 uppercase">Negative Prompt</span>
    {/snippet}
  </TextField>

  <div class="flex items-center justify-between gap-tight">
    <div class="flex flex-col gap-tight">
      <Toggle
        label="Flip Image"
        bind:value={profile_state.char.modifiers.flipped}
        disabled={!profile_state.is_editing}
        onchange={() => profile_state.mark_mutated()} />
    </div>
  </div>
</section>
