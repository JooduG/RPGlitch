<script module>
  /** Parses inline `{a|b|{c|d}}` Perchance variation spans. */
  function parse_variants(str) {
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
          const ch = str[i];
          if (ch === "{") {
            depth++;
            current_choice += ch;
          } else if (ch === "}") {
            depth--;
            if (depth > 0) current_choice += ch;
          } else if (ch === "|" && depth === 1) {
            raw_choices.push(current_choice.trim());
            current_choice = "";
          } else {
            current_choice += ch;
          }
          i++;
        }

        if (current_choice.trim() || raw_choices.length > 0) raw_choices.push(current_choice.trim());
        result.push({ is_var: true, choices: raw_choices.map(parse_variants) });
      } else {
        text_buffer += str[i];
        i++;
      }
    }

    if (text_buffer) result.push({ is_var: false, text: text_buffer });
    return result.length > 0 ? result : [{ is_var: false, text: str }];
  }
</script>

<script>
  /**
   * @file src/ui/molecules/BracketList.svelte
   * Shared renderer for structured `[KEY: value]` entries and relationship previews.
   */
  import { Icon } from "@atoms";
  import { get_signature_color, match_entity_in_roster, parse_bracket_display_flags, resolve_display_macro_segments } from "@utils";
  import MacroText from "./MacroText.svelte";

  let { record = null, entries = [], owner = null, entities = {}, compact = false, sort_by_length = true, on_select = null } = $props();

  const normalized_entries = $derived.by(() => {
    const source =
      Array.isArray(entries) && entries.length > 0 ?
        entries.map((item) => ({ key: item.key, raw: item.value, force_hidden: Boolean(item.is_hidden), quadrant: item.quadrant || null }))
      : record && typeof record === "object" ?
        (sort_by_length ? Object.entries(record).sort((a, b) => String(a[1]).length - String(b[1]).length) : Object.entries(record)).map(([key, val]) => ({
          key,
          raw: val,
          force_hidden: false,
          quadrant: null,
        }))
      : [];

    const out = [];
    for (const item of source) {
      const parsed_flags = parse_bracket_display_flags(String(item.raw ?? ""));
      const clean_val = parsed_flags.value.replace(/\s*\|\s*w:\s*\d+\b/gi, "").trim();
      if (!clean_val) continue;
      out.push({ key: item.key, value: clean_val, is_hidden: item.force_hidden || parsed_flags.is_hidden, quadrant: item.quadrant });
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
      {@const key_color = item.key?.startsWith("@") ? get_signature_color(match_entity_in_roster(item.key.slice(1), entities, owner), null) : null}
      {@const key_parts = compact && item.key.includes("_") ? item.key.split("_") : null}
      <div class={["flex flex-col items-start gap-0.5 first:pt-0 last:pb-0", compact ? "py-1" : "py-1.5", item.is_hidden && "opacity-muted"]}>
        <div class="flex w-full items-baseline justify-between gap-tight">
          <span
            style:color={key_color && !item.is_hidden ? key_color : undefined}
            class={["text-left type-uppercase-label", item.is_hidden ? "text-frisk/55" : !key_color && "text-(--signature-color)"]}>
            {#if key_parts}
              {#each key_parts as part, pi (pi)}{part}{#if pi < key_parts.length - 1}_<wbr />{/if}{/each}
            {:else}
              {item.key}
            {/if}
          </span>
          {#if item.quadrant}
            <span
              title={compact ? item.quadrant : undefined}
              aria-label={compact ? item.quadrant : undefined}
              class="inline-flex shrink-0 items-center gap-1 type-data text-frisk/60">
              <Icon name={item.quadrant.toLowerCase()} class="size-3.5" />
              {#if !compact}{item.quadrant}{/if}
            </span>
          {/if}
        </div>
        <span class={["text-left type-body", compact && compact_clamp_class, item.is_hidden ? "text-frisk/55 italic" : "text-frisk/90"]}>
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
        <span class="mr-0.5 type-data text-(--signature-color) opacity-70">⌥</span>
        {#each part.choices as choiceNodes, idx (idx)}
          <span class="inline-flex items-center">{@render RenderChoiceNodes(choiceNodes)}</span>
          {#if idx < part.choices.length - 1}
            <span class="mx-0.5 type-data text-(--signature-color)/40">/</span>
          {/if}
        {/each}
      </span>
    {:else}
      {part.text}
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
