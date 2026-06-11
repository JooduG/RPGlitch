<script>
  /**
   * @file Message.svelte
   * ❄️ THE SIMULATION MESSAGE
   * Renders parsed messages in a Unified Nordic Chassis.
   * Standard: Pure Svelte 5 layout primitives, fully decoupled event chains, and deterministic metrics.
   */
  import { clean_image_prompts, parse_message, strip_cognition_blocks } from "@intelligence";
  import { Audio, get_signature_color } from "@media";
  import { motion, typewriter } from "@motion";
  import { app, runtime } from "@state";

  import { Button, DataBox, TextField, tooltip } from "@atoms";
  import { DevTelemetryBlock } from "@molecules";

  /**
   * @typedef {Object} Props
   * @property {string|number} [id=""]
   * @property {string} [text=""]
   * @property {string} [sender="system"]
   * @property {string} [character_name=""]
   * @property {Date} [timestamp=new Date()]
   * @property {string[]} [attachments=[]]
   * @property {(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => any} [on_delete]
   * @property {(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => any} [on_regenerate]
   * @property {(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => any} [on_continue]
   * @property {(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => any} [on_edit]
   * @property {boolean} [is_last=false]
   * @property {boolean} [busy=false]
   * @property {Record<string, any>} [meta={}]
   * @property {boolean} [is_editing=false]
   * @property {(new_text: string) => any} [on_save]
   * @property {() => any} [on_cancel]
   */

  /** @type {Props} */
  let {
    id = "",
    text = "",
    sender = "system",
    character_name = "",
    timestamp = new Date(),
    attachments = [],
    on_delete = undefined,
    on_regenerate = undefined,
    on_continue = undefined,
    on_edit = undefined,
    is_last = false,
    busy = false,
    meta = {},
    is_editing = false,
    on_save = undefined,
    on_cancel = undefined,
  } = $props();

  // --- STATE RUNES ---
  let isFocused = $state(false);
  let local_text = $state("");

  // --- DERIVATIONS & RECONCILIATIONS ---
  let is_user = $derived(sender === "user");
  let is_ai = $derived(sender === "ai");
  let is_fractal = $derived(sender === "fractal");
  let is_telemetry = $derived(
    sender === "system" &&
      (meta?.type === "telemetry" ||
        meta?.type === "VECTOR_RESOLUTION" ||
        meta?.type === "MEMORY_FORMATION"),
  );

  let entity = $derived(
    is_user
      ? runtime.active_user || app.selected_user
      : is_ai
        ? runtime.active_ai || app.selected_ai
        : is_fractal
          ? runtime.active_fractal && runtime.active_fractal.id !== "active_fractal"
            ? runtime.active_fractal
            : app.selected_fractal || runtime.active_fractal
          : null,
  );

  let signature_color = $derived(
    get_signature_color(
      entity,
      sender === "system" ? "var(--color-slate-600)" : "var(--color-slate-700)",
    ),
  );

  let parsed = $derived(parse_message(text));
  let display_text = $derived(parsed.displayText);
  let think_block = $derived(parsed.think);

  let has_display_text = $derived(!!(display_text && display_text !== "<p></p>"));
  let clean_markdown = $derived(clean_image_prompts(strip_cognition_blocks(text)).trim());

  let time_label = $derived(
    timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  );

  // --- ACTIONS & UTILITIES ---

  /**
   * Focus activation event pipeline handler.
   * @returns {void}
   */
  function handle_focus() {
    isFocused = true;
  }

  /**
   * Handles focus eviction gestures from the message bubble tree block boundaries.
   * @param {FocusEvent & { currentTarget: HTMLElement, relatedTarget: EventTarget | null }} e
   * @returns {void}
   */
  function handle_focus_out(e) {
    if (e.relatedTarget && e.currentTarget.contains(/** @type {Node} */ (e.relatedTarget))) return;
    isFocused = false;
  }

  /**
   * Invokes system-level clipboard streaming write sequences for text chunks.
   * @returns {Promise<void>}
   */
  async function handle_copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error("Failed to copy text:", e);
    }
  }

  /**
   * Orchestrates audio speech synthesis sequences matching character audio profile configurations.
   * @returns {void}
   */
  function handle_speak() {
    if (!clean_markdown) return;

    if (entity && entity.voice) {
      Audio.voice.selectedVoice = entity.voice.uri || Audio.voice.selectedVoice;
      Audio.voice.rate = entity.voice.rate ?? 1.0;
      Audio.voice.pitch = entity.voice.pitch ?? 1.0;
    }

    Audio.voice.speak(clean_markdown, true, true);
  }

  $effect(() => {
    if (is_editing) {
      local_text = clean_markdown;
    }
  });
</script>

{#if is_telemetry}
  {#if app.settings.dev_mode}
    <DevTelemetryBlock {meta} time={time_label} />
  {/if}
{:else}
  <div
    class="
      relative
      flex
      w-full
      p-4
      transition-all
      duration-200

      {is_user ? 'justify-end' : is_ai ? 'justify-start' : 'justify-center'}"
  >
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      class="
        relative
        flex
        cursor-pointer
        flex-col
        rounded-2xl
        border
        transition-all
        duration-300
        ease-out
        outline-none

        before:pointer-events-none
        before:absolute
        before:inset-0
        before:rounded-[inherit]
        before:mask-border-solid
        before:p-px
        before:transition-opacity
        before:duration-300
        before:ease-out
        before:content-['']

        {is_user ? 'rounded-br-sm' : ''}
        {is_ai ? 'rounded-bl-sm' : ''}
        {is_fractal
        ? `
          w-full
          text-center
        `
        : `
          w-fit
          max-w-lg
          min-w-48
        `}
        {is_editing ? 'w-full' : ''}
        {isFocused || busy || is_editing
        ? `
          border-slate-50
          bg-[color-mix(in_srgb,var(--color-neutral-900),var(--signature-color)_6%)]

          before:bg-[linear-gradient(to_bottom,var(--signature-color),color-mix(in_srgb,var(--signature-color),transparent_60%)_30%,transparent_80%)]
          before:opacity-100
        `
        : `
          overflow-hidden
          border-slate-50/15
          bg-[color-mix(in_srgb,var(--color-neutral-900),var(--signature-color)_3%)]

          before:bg-[linear-gradient(to_bottom,color-mix(in_srgb,transparent,var(--signature-color)_40%),transparent_40%)]
          before:opacity-15
        `}
      "
      style="--signature-color: {signature_color}; --scan-animation: {motion.isReduced
        ? 'none'
        : 'scan 4s linear infinite'};"
      tabindex="0"
      onfocusin={handle_focus}
      onfocusout={handle_focus_out}
      role="region"
      aria-label="Message Context"
    >
      <div
        class="
          {busy
          ? `
            overflow-hidden

            after:absolute
            after:inset-0
            after:w-full
            after:animate-(--scan-animation)
            after:bg-[linear-gradient(90deg,transparent_0%,rgba(248,250,252,0.15)_50%,transparent_100%)]
            after:content-['']
          `
          : ''}

          relative
          top-0
          z-10
          flex
          rounded-t-2xl
          border-b
          border-transparent
          transition-all
          duration-300
          ease-out

          {isFocused || busy || is_editing
          ? `
            h-9
            flex-row
            items-center
            justify-between
            overflow-visible
            border-slate-50/15
            bg-[color-mix(in_srgb,var(--signature-color,var(--color-slate-700)),black_30%)]
            px-4
          `
          : `
            h-px
            flex-col
            bg-[linear-gradient(90deg,transparent_0%,var(--signature-color,var(--color-slate-600))_50%,transparent_100%)]
          `}
        "
      >
        <div
          class="
            flex
            flex-1
            items-center
            gap-4
            overflow-hidden
            font-(--font-family-mono)
            tracking-widest
            uppercase

            {isFocused || busy || is_editing
            ? `
              pointer-events-auto
              translate-y-0
              opacity-100
              transition-all
              delay-100
              duration-200
            `
            : `
              pointer-events-none
              -translate-y-4
              opacity-0
              transition-all
              duration-200
            `}"
        >
          <span
            class="
              text-xs
              font-bold
              whitespace-nowrap
              text-slate-50
              drop-shadow-sm
            ">{entity?.name || character_name || (is_fractal ? "Fractal" : sender)}</span
          >
          <span
            class="
              text-[10px]
              text-slate-50/50
            ">{time_label}</span
          >
        </div>
        <div
          class="
            ml-auto
            flex
            items-center
            gap-2

            {isFocused || busy || is_editing
            ? `
              pointer-events-auto
              translate-y-0
              opacity-100
              transition-all
              delay-100
              duration-200
            `
            : `
              pointer-events-none
              -translate-y-4
              opacity-0
              transition-all
              duration-200
            `}"
        >
          {#if is_editing}
            <Button
              variant="invisible"
              size="small"
              square={true}
              aria-label="Save"
              actions={[tooltip]}
              onclick={() => on_save?.(local_text)}
              class="
                text-slate-50/80
                transition-all
                duration-300

                hover:scale-105
                hover:text-slate-50
              "
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4 fill-none stroke-slate-50">
                <polyline
                  points="20 6 9 17 4 12"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></polyline>
              </svg>
            </Button>
            <Button
              variant="invisible"
              size="small"
              square={true}
              aria-label="Cancel"
              actions={[tooltip]}
              onclick={on_cancel}
              class="
                text-slate-50/80
                transition-all
                duration-300

                hover:scale-105
                hover:text-slate-50
              "
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4 fill-none stroke-slate-50">
                <line
                  x1="18"
                  y1="6"
                  x2="6"
                  y2="18"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></line>
                <line
                  x1="6"
                  y1="6"
                  x2="18"
                  y2="18"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></line>
              </svg>
            </Button>
          {:else}
            {#if is_ai && is_last}
              <Button
                variant="invisible"
                size="small"
                square={true}
                aria-label="Continue"
                actions={[tooltip]}
                onclick={on_continue}
                class="
                  text-slate-50/80
                  transition-all
                  duration-300

                  hover:scale-105
                  hover:text-slate-50
                "
              >
                <svg viewBox="0 0 24 24" class="h-4 w-4 fill-slate-50 stroke-none">
                  <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon>
                </svg>
              </Button>
              <Button
                variant="invisible"
                size="small"
                square={true}
                aria-label="Reroll"
                actions={[tooltip]}
                onclick={on_regenerate}
                class="
                  text-slate-50/80
                  transition-all
                  duration-300

                  hover:scale-105
                  hover:text-slate-50
                "
              >
                <svg viewBox="0 0 24 24" class="h-4 w-4 fill-none stroke-slate-50">
                  <polyline points="23 4 23 10 17 10" stroke="currentColor" stroke-width="2"
                  ></polyline>
                  <path
                    d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"
                    stroke="currentColor"
                    stroke-width="2"
                  ></path>
                </svg>
              </Button>
            {/if}
            <Button
              variant="invisible"
              size="small"
              square={true}
              aria-label="Read Message"
              actions={[tooltip]}
              onclick={handle_speak}
              disabled={!clean_markdown}
              class="
                text-slate-50/80
                transition-all
                duration-300

                hover:scale-105
                hover:text-slate-50

                disabled:opacity-30

                disabled:hover:scale-100
              "
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4 fill-slate-50 stroke-none">
                <path
                  fill="currentColor"
                  d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18.01,19.86 21,16.28 21,12C21,7.72 18.01,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16.03C15.5,15.29 16.5,13.77 16.5,12M3,9V15H7L12,20V4L7,9H3Z"
                />
              </svg>
            </Button>
            <Button
              variant="invisible"
              size="small"
              square={true}
              aria-label="Edit"
              actions={[tooltip]}
              onclick={on_edit}
              class="
                text-slate-50/80
                transition-all
                duration-300

                hover:scale-105
                hover:text-slate-50
              "
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4 fill-none stroke-slate-50">
                <path
                  d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                  stroke="currentColor"
                  stroke-width="2"
                ></path>
                <path
                  d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                  stroke="currentColor"
                  stroke-width="2"
                ></path>
              </svg>
            </Button>
            <Button
              variant="invisible"
              size="small"
              square={true}
              aria-label="Copy"
              actions={[tooltip]}
              onclick={handle_copy}
              class="
                text-slate-50/80
                transition-all
                duration-300

                hover:scale-105
                hover:text-slate-50
              "
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4 fill-none stroke-slate-50">
                <rect
                  x="9"
                  y="9"
                  width="13"
                  height="13"
                  rx="2"
                  ry="2"
                  stroke="currentColor"
                  stroke-width="2"
                ></rect>
                <path
                  d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                  stroke="currentColor"
                  stroke-width="2"
                ></path>
              </svg>
            </Button>
            <Button
              variant="invisible"
              size="small"
              square={true}
              aria-label="Delete"
              actions={[tooltip]}
              onclick={on_delete}
              class="
                text-slate-50/80
                transition-all
                duration-300

                hover:scale-105
                hover:text-slate-50
              "
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4 fill-none stroke-slate-50">
                <polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2"></polyline>
                <path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  stroke="currentColor"
                  stroke-width="2"
                ></path>
              </svg>
            </Button>
          {/if}
        </div>
      </div>

      <div
        class="
          relative
          z-10
          p-4
        "
      >
        {#if app.streaming.active && id && (app.streaming.nodeId === id || app.streaming.node_id === id)}
          <div
            class="
              text-left
              text-base
              leading-relaxed
              text-pretty
              text-slate-50

              [&_em]:text-slate-600
              [&_em]:italic
              [&_em]:opacity-100

              [&_p]:mb-4

              [&_p:last-child]:mb-0

              [&_strong]:font-bold
              [&_strong]:text-(--signature-color,var(--color-slate-700))
              [&_strong]:[text-shadow:0_0_8px_color-mix(in_srgb,var(--signature-color,var(--color-slate-700)),transparent_85%)]
            "
          >
            {#if has_display_text}
              <div use:typewriter={display_text}></div>
            {/if}
          </div>
        {:else}
          {#if app.settings.dev_mode}
            {#if think_block}
              <DataBox label="⚙️ DevMode: Reasoning">
                {think_block}
              </DataBox>
            {/if}

            {#if meta && (meta.dynamics || meta.vectors || meta.deltas)}
              <DevTelemetryBlock {meta} />
            {/if}
          {/if}

          {#if attachments.length > 0}
            <div class="mb-4">
              {#each attachments as src (src)}
                <Button
                  variant="invisible"
                  class="
                    mb-2
                    min-h-0
                    w-fit
                    bg-neutral-900/50
                    p-2
                    transition-colors

                    hover:bg-neutral-900/80
                  "
                  onclick={() => app.open_image_preview(src)}
                  aria-label="View Attachment"
                  actions={[tooltip]}
                >
                  <img
                    {src}
                    alt="Attachment"
                    class="
                      max-w-full
                      rounded-sm
                      object-cover
                      shadow-sm
                    "
                  />
                </Button>
              {/each}
            </div>
          {/if}

          {#if is_editing || has_display_text}
            {#if is_editing}
              <TextField
                bind:value={local_text}
                is_edit={true}
                {signature_color}
                no_background={true}
                placeholder="Edit message..."
              />
            {:else}
              <div
                class="
                  text-left
                  text-base
                  leading-relaxed
                  text-pretty
                  text-slate-50

                  [&_em]:text-slate-600
                  [&_em]:italic
                  [&_em]:opacity-100

                  [&_p]:mb-4

                  [&_p:last-child]:mb-0

                  [&_strong]:font-bold
                  [&_strong]:text-(--signature-color,var(--color-slate-700))
                  [&_strong]:[text-shadow:0_0_8px_color-mix(in_srgb,var(--signature-color,var(--color-slate-700)),transparent_85%)]
                "
              >
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html display_text}
              </div>
            {/if}
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes scan {
    from {
      transform: translateX(-100%) skewX(-20deg);
    }

    to {
      transform: translateX(100%) skewX(-20deg);
    }
  }
</style>
