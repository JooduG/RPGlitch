<script>
  /**
   * @file src/ui/profile/ProfileArray.svelte
   * THE VECTOR ARRAY INSTRUMENT
   * A high-fidelity list orchestrator for entity characteristics.
   * Part of the RPGlitch "Chalk Regime" UI collection.
   */
  import { Button, TextField, tooltip } from "@atoms";

  /**
   * @typedef {Object} VectorItem
   * @property {string} id
   * @property {number} timestamp
   * @property {string} text
   * @property {string} type
   * @property {number} base_weight
   * @property {string[]} vector_tags
   */

  /**
   * @typedef {Object} Props
   * @property {import('./profile.svelte.js').ProfileState} state - The profile state controller
   * @property {string} path - The dot-path to the array in state.char
   * @property {string} signature_color - The theme accent color
   * @property {string} [unit_label] - Display label for individual items
   */

  /** @type {Props} */
  let { state, path, signature_color, unit_label = "Vector" } = $props();

  // --- DERIVED STATE ---

  /** Normalized array of vector objects. */
  const items = $derived.by(() => {
    const raw = state.get_safe_value(path) || [];
    const arr = Array.isArray(raw) ? raw : typeof raw === "string" && raw.trim() ? [raw] : [];

    return arr.map((val) => {
      if (typeof val === "object" && val !== null) {
        return {
          ...val,
          base_weight: val.base_weight ?? 5,
          vector_tags: val.vector_tags ?? [],
        };
      }
      // This case should be rare now as state.add_vector_item handles initialization
      return { text: String(val || ""), base_weight: 5, vector_tags: [] };
    });
  });

  // --- HANDLERS ---

  /** @param {number} i @param {string} raw */
  function update_tags(i, raw) {
    const vector_tags = raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    state.patch_vector_item(path, i, { vector_tags });
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
    <div
      class="
      animate-[slide-down-item_400ms_cubic-bezier(0.23,1,0.32,1)_forwards]
    "
    >
      <TextField
        is_edit={state.is_editing}
        {signature_color}
        value={item.text}
        oninput={(/** @type {Event & { currentTarget: HTMLTextAreaElement }} */ e) =>
          state.patch_vector_item(path, i, { text: e.currentTarget.value })}
        placeholder="Enter {unit_label.toLowerCase()} detail..."
        weight={item.base_weight}
      >
        {#snippet status()}
          <div
            class="
              mr-4
              grid
              h-full
              min-w-16
              grid-cols-[1.5rem_2rem_1.5rem]
              place-items-center
              self-center
              select-none
            "
            use:tooltip={{ text: "Influence weight of this vector" }}
          >
            {#if state.is_editing}
              <Button
                variant="invisible"
                size="small"
                square
                class="
                  col-1
                "
                onclick={() => state.update_vector_weight(path, i, -1)}
                aria-label="Decrease Weight"
              >
                <span
                  class="
                    flex
                    items-center
                    justify-center
                    text-sm
                    leading-none
                    font-(--font-family-mono)
                  ">&lt;</span
                >
              </Button>
            {/if}

            <span
              class="
                pointer-events-none
                z-20
                col-2
                flex
                h-full
                min-w-3
                items-center
                justify-center
                text-center
                text-sm
                leading-none
                font-(--font-family-mono)
                text-white
              ">{item.base_weight}</span
            >

            {#if state.is_editing}
              <Button
                variant="invisible"
                size="small"
                square
                class="
                  col-3
                  text-slate-400
                  opacity-0
                  transition-colors
                  duration-200
                  group-[.is-expanded]/textfield:opacity-90
                  hover:text-(--pure-white)!
                  hover:opacity-100!
                "
                onclick={() => state.update_vector_weight(path, i, 1)}
                aria-label="Increase Weight"
              >
                <span
                  class="
                    flex
                    items-center
                    justify-center
                    text-sm
                    leading-none
                    font-(--font-family-mono)
                  ">&gt;</span
                >
              </Button>
            {/if}
          </div>

          <div
            class="
            flex
            h-full
            flex-1
            items-center
            gap-2
            overflow-hidden
          "
          >
            {#if state.is_editing}
              <input
                type="text"
                class="
                  w-full
                  border-none
                  bg-transparent
                  p-0
                  text-[10px]
                  font-(--font-family-mono)
                  tracking-widest
                  text-white
                  uppercase
                  opacity-80
                  transition-opacity
                  duration-200
                  outline-none

                  placeholder:text-white
                  placeholder:opacity-30

                  focus:opacity-100
                "
                value={item.vector_tags.join(", ")}
                placeholder="TAGS (COMMA SEPARATED)..."
                onchange={(e) => update_tags(i, e.currentTarget.value)}
              />
            {:else}
              {#each item.vector_tags as tag (tag)}
                <span
                  class="
                    flex
                    h-[calc(100%-0.25rem)]
                    items-center
                    rounded-sm
                    border
                    border-white/10
                    bg-white/10
                    px-2
                    py-1
                    text-[10px]
                    tracking-widest
                    whitespace-nowrap
                    text-white
                    uppercase
                    opacity-90
                    drop-shadow-md
                  ">{tag}</span
                >
              {/each}
            {/if}
          </div>
        {/snippet}

        {#snippet header_actions()}
          {#if state.is_editing}
            <Button
              variant="invisible"
              size="small"
              square
              actions={[tooltip]}
              tooltip="Remove {unit_label}"
              aria-label="Remove {unit_label}"
              onclick={() => state.remove_vector_item(path, i)}
            >
              <svg
                viewBox="0 0 24 24"
                class="
                  size-(--icon-small)
                  fill-none
                  stroke-current
                  stroke-2
                  [stroke-linecap:round]
                  [stroke-linejoin:round]
                "
                fill="none"
              >
                <polyline points="3 6 5 6 21 6" stroke="var(--pure-white)"></polyline>
                <path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  stroke="var(--pure-white)"
                ></path>
              </svg>
            </Button>
          {/if}
        {/snippet}
      </TextField>
    </div>
  {/each}

  {#if items.length === 0 && !state.is_editing}
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
          text-[10px]
          font-(--font-family-mono)
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
            h-[10px]
            w-[10px]
          "
          style="width: var(--font-size-small); height: var(--font-size-small);"
        >
          <path
            fill="currentColor"
            d="M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"
          />
        </svg>
        AWAITING {unit_label.toUpperCase()} DATA STREAM...
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
