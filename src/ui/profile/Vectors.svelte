<script>
  /**
   * @file src/ui/profile/Vectors.svelte
   * THE VECTOR ARRAY INSTRUMENT
   * A high-fidelity list orchestrator for entity characteristics.
   * Part of the RPGlitch UI.
   */
  import { Button, TextField, tooltip } from "@primitives";
  import { derive_vector_title } from "@intelligence";

  /**
   * @typedef {Object} VectorItem
   * @property {string} id
   * @property {number} [timestamp]
   * @property {string} content
   * @property {string} [type]
   * @property {number} emotional_weight
   */

  /**
   * @typedef {Object} Props
   * @property {import('./Profile.svelte.js').ProfileState} state - The profile state controller
   * @property {string} path - The dot-path to the array in state.char
   * @property {string} signature_color - The theme accent color
   * @property {string} [sublabel] - Display label for individual items
   */

  /** @type {Props} */
  let { state: profile_state, path, signature_color, sublabel = "Vector", description = "" } = $props();

  // --- DERIVED STATE ---

  /** Normalized array of vector objects. */
  const items = $derived.by(() => {
    const arr = profile_state._vectors_of_type(path);

    const mapped = arr.map((val) => {
      if (typeof val === "object" && val !== null) {
        return {
          ...val,
          content: val.content ?? val.directive ?? val.text ?? "",
          emotional_weight: val.emotional_weight ?? 5,
        };
      }
      return { content: String(val || ""), emotional_weight: 5 };
    });

    if (!profile_state.is_editing) {
      return mapped.filter((item) => !!item.content?.trim());
    }
    return mapped;
  });
  // --- EXPANSION STATE ---
  let expanded_items = $state(/** @type {Set<string|number>} */ (new Set()));
  let collapsed_items = $state(/** @type {Set<string|number>} */ (new Set()));

  /** @param {string|number} key */
  function toggle_expand(key) {
    if (profile_state.is_editing) return;
    const default_expanded = items.length <= 2;
    if (default_expanded) {
      const next = new Set(collapsed_items);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      collapsed_items = next;
    } else {
      const next = new Set(expanded_items);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      expanded_items = next;
    }
  }
</script>

<div
  class="
    relative
    flex
    w-full
    flex-col
    gap-4
  "
  style="--accent-color: {signature_color}"
>
  {#each items as item, i (item.id || i)}
    {@const item_key = item.id || i}
    {@const default_expanded = items.length <= 2}
    {@const is_expanded = profile_state.is_editing || (default_expanded ? !collapsed_items.has(item_key) : expanded_items.has(item_key))}
    <div
      class="
        animate-[slide-down-item_400ms_cubic-bezier(0.23,1,0.32,1)_forwards]
      "
    >
      <TextField
        is_edit={profile_state.is_editing}
        collapsed={!is_expanded}
        active={profile_state.active_field?.key === `${path}[${i}]`}
        busy={profile_state.busy_fields.has(`${path}[${i}]`)}
        {signature_color}
        value={item.content}
        oninput={(/** @type {Event & { currentTarget: HTMLTextAreaElement }} */ e) =>
          profile_state.patch_vector_item(path, i, { content: e.currentTarget.value })}
        placeholder="Enter {sublabel.toLowerCase()} detail..."
        weight={item.emotional_weight}
        onfocus={() => profile_state.set_active_field(`${path}[${i}]`, sublabel)}
        onheaderclick={() => toggle_expand(item_key)}
      >
        {#snippet status()}
          {@const title = derive_vector_title(item.content, 60)}
          <Button
            variant="bare"
            class="my-auto flex max-w-full min-w-0 items-center gap-2 truncate text-left focus:outline-none"
            onclick={(e) => {
              e.stopPropagation();
              toggle_expand(item_key);
            }}
          >
            {#if !profile_state.is_editing}
              <svg
                viewBox="0 0 24 24"
                class="my-auto size-3 shrink-0 stroke-current stroke-2 transition-transform duration-200 {is_expanded ? 'rotate-90' : ''}"
                style="fill: none; stroke-linecap: round; stroke-linejoin: round;"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            {/if}
            <span
              class="my-auto block max-w-full min-w-0 truncate font-sans text-xs font-normal tracking-normal whitespace-nowrap text-white opacity-80 transition-opacity hover:opacity-100"
              use:tooltip
              aria-label={description}>{title || `Empty ${sublabel}`}</span
            >
          </Button>
        {/snippet}

        {#snippet header_actions()}
          <div
            class="
              flex
              h-full
              items-center
              gap-2
              select-none
            "
          >
            {#if profile_state.is_editing}
              <div
                class="
                  flex
                  cursor-default
                  items-center
                  gap-2
                  rounded-sm
                  border
                  border-white/10
                  bg-white/10
                  px-1.5
                  py-0.5
                "
                use:tooltip={{ text: "Influence weight score (1-10) driving relevance" }}
              >
                <span
                  class="
                    pointer-events-none
                    font-mono
                    text-xs
                    leading-none
                    font-bold
                    text-white
                  ">{item.emotional_weight}</span
                >

                <div class="flex flex-col gap-[1px]">
                  <Button
                    variant="bare"
                    class="
                      flex
                      h-2.5
                      w-3
                      items-center
                      justify-center
                      rounded-xs
                      text-white/60
                      hover:bg-white/20
                      hover:text-white
                    "
                    onclick={(e) => {
                      e.stopPropagation();
                      profile_state.update_vector_weight(path, i, 1);
                    }}
                    aria-label="Increase Weight"
                  >
                    <svg viewBox="0 0 24 24" class="size-2.5 fill-none stroke-current stroke-3"><polyline points="18 15 12 9 6 15"></polyline></svg>
                  </Button>
                  <Button
                    variant="bare"
                    class="
                      flex
                      h-2.5
                      w-3
                      items-center
                      justify-center
                      rounded-xs
                      text-white/60
                      hover:bg-white/20
                      hover:text-white
                    "
                    onclick={(e) => {
                      e.stopPropagation();
                      profile_state.update_vector_weight(path, i, -1);
                    }}
                    aria-label="Decrease Weight"
                  >
                    <svg viewBox="0 0 24 24" class="size-2.5 fill-none stroke-current stroke-3"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </Button>
                </div>
              </div>
            {:else}
              <span
                class="
                  my-auto
                  flex
                  items-center
                  font-mono
                  text-xs
                  leading-tight
                  font-bold
                  text-white
                  opacity-90
                  drop-shadow-xs
                "
                use:tooltip={{ text: "Influence weight score (1-10) driving relevance" }}>{item.emotional_weight}</span
              >
            {/if}

            {#if profile_state.is_editing}
              <Button
                variant="invisible"
                size="small"
                square
                aria-label="Enhance with AI"
                actions={[tooltip]}
                tooltip="Enhance {sublabel} with AI"
                disabled={profile_state.busy_fields.has(path) || profile_state.busy_fields.has(`${path}[${i}]`) || !item.content}
                onclick={(e) => {
                  e.stopPropagation();
                  profile_state.enhance_vector_item(path, i);
                }}
                class="
                  text-slate-400
                  opacity-0
                  transition-colors
                  duration-200
                  group-data-[expanded=true]/textfield:opacity-90
                  hover:text-white!
                  hover:opacity-100!
                "
              >
                <svg
                  viewBox="0 0 24 24"
                  class="size-icon-small fill-none stroke-current stroke-2"
                  style="stroke-linecap: round; stroke-linejoin: round;"
                >
                  <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" fill="currentColor"></path>
                </svg>
              </Button>
              <Button
                variant="invisible"
                size="small"
                square
                actions={[tooltip]}
                tooltip="Remove {sublabel}"
                aria-label="Remove {sublabel}"
                onclick={(e) => {
                  e.stopPropagation();
                  profile_state.remove_vector_item(path, i);
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  class="
                    size-icon-small
                    fill-none
                    stroke-current
                    stroke-2
                    [stroke-linecap:round]
                    [stroke-linejoin:round]
                  "
                  fill="none"
                >
                  <polyline points="3 6 5 6 21 6" stroke="currentColor"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor"></path>
                </svg>
              </Button>
            {/if}
          </div>
        {/snippet}
      </TextField>
    </div>
  {/each}

  {#if items.length === 0 && !profile_state.is_editing}
    <div
      class="
        flex
        min-h-12
        animate-[slide-down-item_400ms_cubic-bezier(0.23,1,0.32,1)_forwards]
        items-center
        px-4
        py-2
      "
    >
      <span
        class="
          pointer-events-none
          flex
          items-center
          gap-4
          font-mono
          text-[10px]
          tracking-widest
          text-slate-50
          uppercase
          opacity-30
          select-none
        "
      >
        <svg
          viewBox="0 0 24 24"
          class="
            h-kinetic-slide-y
            w-kinetic-slide-y
          "
        >
          <path
            fill="currentColor"
            d="M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"
          />
        </svg>
        AWAITING {sublabel.toUpperCase()} DATA STREAM...
      </span>
    </div>
  {/if}
</div>

<style>
  @keyframes slide-down-item {
    from {
      opacity: 0;
      transform: translateY(calc(var(--spacing-unit) * -2.5));
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
