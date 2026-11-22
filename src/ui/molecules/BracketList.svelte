<script>
  /**
   * @file src/ui/molecules/BracketList.svelte
   * Shared renderer for structured `[KEY: value]` entries and relationship previews.
   */
  import { get_signature_color, parse_bracket_display_flags, resolve_display_macro_segments } from "@utils";
  import { Icon } from "@atoms";
  import MacroText from "./MacroText.svelte";

  /**
   * @typedef {Object} BracketEntry
   * @property {string} key
   * @property {string} value
   * @property {boolean} [is_hidden]
   * @property {string} [quadrant]
   */

  /**
   * @typedef {Object} Props
   * @property {Record<string, any> | null} [record] - Parsed pseudo-JSON key/value object
   * @property {BracketEntry[]} [entries] - Pre-extracted bracket rows
   * @property {any} [owner] - Perspective owner passed to MacroText
   * @property {Record<string, any>} [entities] - Entity context ({ AI, USER, FRACTAL, ALL })
   * @property {boolean} [compact] - Compact density for EntityCard hover previews
   * @property {boolean} [sort_by_length] - Sort record entries shortest-first
   * @property {((entity: any) => void) | null} [on_select] - Callback forwarded to MacroText
   */

  /** @type {Props} */
  let { record = null, entries = [], owner = null, entities = {}, compact = false, sort_by_length = true, on_select = null } = $props();

  const known_entities = $derived(Array.isArray(entities?.ALL) ? entities.ALL : []);

  /**
   * Resolves the target entity's signature color for `@ENTITY` bracket keys.
   * @param {string} key
   * @returns {string | null}
   */
  function resolve_bracket_target_color(key) {
    if (!key || !key.startsWith("@")) return null;
    const raw_slug = key.slice(1).trim().toLowerCase();
    if (!raw_slug) return null;
    if (raw_slug === "user" && entities?.USER) return get_signature_color(entities.USER, null);
    if ((raw_slug === "char" || raw_slug === "ai") && entities?.AI) return get_signature_color(entities.AI, null);
    if (raw_slug === "fractal" && entities?.FRACTAL) return get_signature_color(entities.FRACTAL, null);

    const spaced_slug = raw_slug.replace(/_/g, " ");
    const exact_match = known_entities.find((entity) => {
      const entity_id = String(entity?.id || "")
        .trim()
        .toLowerCase();
      const entity_name = String(entity?.name || "")
        .trim()
        .toLowerCase();
      return entity_id === raw_slug || entity_id === spaced_slug || entity_name === raw_slug || entity_name === spaced_slug;
    });
    if (exact_match) return get_signature_color(exact_match, null);

    const token_match = known_entities.find((entity) => {
      const entity_name = String(entity?.name || "")
        .trim()
        .toLowerCase();
      return entity_name.split(/\s+/).includes(spaced_slug);
    });
    return token_match ? get_signature_color(token_match, null) : null;
  }

  /**
   * Parses inline `{a|b|{c|d}}` Perchance variation spans.
   * @param {string} str
   * @returns {Array<{is_var: boolean, text?: string, choices?: Array<any>}>}
   */
  const parse_variants = (str) => {
    if (!str) return [];

    const result = [];
    let i = 0;
    let text_buffer = "";

    while (i < str.length) {
      if (str[i] === "{") {
        if (text_buffer) {
          result.push({ is_var: false, text: text_buffer });
          text_buffer = "";
        }

        let depth = 1;
        i++;
        let current_choice = "";
        const raw_choices = [];

        while (i < str.length && depth > 0) {
          const char = str[i];
          if (char === "{") {
            depth++;
            current_choice += char;
          } else if (char === "}") {
            depth--;
            if (depth > 0) current_choice += char;
          } else if (char === "|" && depth === 1) {
            raw_choices.push(current_choice.trim());
            current_choice = "";
          } else {
            current_choice += char;
          }
          i++;
        }

        if (current_choice.trim() || raw_choices.length > 0) {
          raw_choices.push(current_choice.trim());
        }

        const parsed_choices = raw_choices.map((c) => parse_variants(c));
        result.push({ is_var: true, choices: parsed_choices });
      } else {
        text_buffer += str[i];
        i++;
      }
    }

    if (text_buffer) {
      result.push({ is_var: false, text: text_buffer });
    }

    return result.length > 0 ? result : [{ is_var: false, text: str }];
  };

  const normalized_entries = $derived.by(() => {
    const source =
      Array.isArray(entries) && entries.length > 0 ?
        entries.map((item) => ({ key: item.key, raw: item.value, force_hidden: Boolean(item.is_hidden), quadrant: item.quadrant || null }))
      : record && typeof record === "object" ?
        (sort_by_length ? Object.entries(record).sort((a, b) => String(a[1]).length - String(b[1]).length) : Object.entries(record)).map(([key, val]) => ({
          key,
          raw: val,
          force_hidden: false,
        }))
      : [];

    const out = [];
    for (const item of source) {
      const raw_val = String(item.raw ?? "");
      const parsed_flags = parse_bracket_display_flags(raw_val);
      const is_hidden = item.force_hidden || parsed_flags.is_hidden;
      const clean_val = parsed_flags.value.replace(/\s*\|\s*w:\s*\d+\b/gi, "").trim();
      if (!clean_val) continue;
      out.push({ key: item.key, value: clean_val, is_hidden, quadrant: item.quadrant || null });
    }
    return out;
  });

  const compact_clamp_class = $derived(
    !compact ? ""
    : normalized_entries.length >= 3 ? "line-clamp-1"
    : normalized_entries.length === 2 ? "line-clamp-2"
    : "line-clamp-3",
  );
</script>

{#if normalized_entries.length > 0}
  <div class={["flex w-full flex-col divide-y text-left", compact ? "divide-white/10" : "divide-white/5"]}>
    {#each normalized_entries as item, idx (`${item.key}_${idx}`)}
      {@const key_color = resolve_bracket_target_color(item.key)}
      <div class={["flex flex-col items-start gap-0.5 first:pt-0 last:pb-0", compact ? "py-1" : "py-1.5", item.is_hidden && "opacity-muted"]}>
        <div class="flex w-full items-baseline justify-between gap-tight">
          <span
            style={key_color && !item.is_hidden ? `color: ${key_color};` : undefined}
            class={[
              "text-left type-uppercase-label",
              item.is_hidden ? "text-frisk/55"
              : key_color ? ""
              : "text-(--signature-color)",
            ]}>
            {#if compact && item.key.includes("_")}
              {#each item.key.split("_") as part, pi (pi)}
                {part}{#if pi < item.key.split("_").length - 1}_<wbr />{/if}
              {/each}
            {:else}
              {item.key}
            {/if}
          </span>
          {#if item.quadrant}
            {#if compact}
              <span title={item.quadrant} aria-label={item.quadrant} class="inline-flex shrink-0 items-center type-data text-frisk/60">
                <Icon name={item.quadrant.toLowerCase()} class="size-3.5" />
              </span>
            {:else}
              <span class="inline-flex shrink-0 items-center gap-1 type-data text-frisk/60">
                <Icon name={item.quadrant.toLowerCase()} class="size-3.5" />
                {item.quadrant}
              </span>
            {/if}
          {/if}
        </div>
        <span
          class={["text-left type-body", compact ? ["text-xs", compact_clamp_class] : "text-sm", item.is_hidden ? "text-frisk/55 italic" : "text-frisk/90"]}>
          {@render RenderFormattedValue(item.value)}
        </span>
      </div>
    {/each}
  </div>
{/if}

{#snippet RenderChoiceNodes(nodes)}
  {#each nodes as part, i (i)}
    {#if part.is_var}
      <span
        class="mx-0.5 inline-flex flex-wrap items-center gap-tight rounded border border-dashed border-(--signature-color)/25 bg-(--signature-color)/5 px-1.5 py-0.5 type-data text-slate-300">
        <span class="mr-0.5 text-[9px] font-bold text-(--signature-color) opacity-70">⌥</span>
        {#each part.choices as choiceNodes, idx (idx)}
          <span class="inline-flex items-center">
            {@render RenderChoiceNodes(choiceNodes)}
          </span>
          {#if idx < part.choices.length - 1}
            <span class="mx-0.5 text-[9px] text-(--signature-color)/40">/</span>
          {/if}
        {/each}
      </span>
    {:else}
      <span>{part.text}</span>
    {/if}
  {/each}
{/snippet}

{#snippet RenderFormattedValue(val_str)}
  {#each resolve_display_macro_segments(val_str, owner, entities) as seg, si (si)}
    {#if seg.macro}
      <MacroText segment={seg} {on_select} />
    {:else}
      {@render RenderChoiceNodes(parse_variants(seg.text))}
    {/if}
  {/each}
{/snippet}
