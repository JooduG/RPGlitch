<script>
  /**
   * @file Message.svelte
   * â„ï¸ THE SIMULATION MESSAGE
   * Renders parsed messages in a Unified Nordic Chassis.
   * Standard: Pure Svelte 5 layout primitives, fully decoupled event chains, and deterministic metrics.
   */
  import { clean_image_prompts, parse_message, strip_cognition_blocks } from "@intelligence";
  import { Audio, themeStore } from "@media";
  import { app, runtime } from "@state";
  import { motion, typewriter } from "@motion";

  import { Button, TextField, tooltip, DataBox } from "@atoms";
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
    themeStore.get_signature_color(
      entity,
      sender === "system" ? "var(--frozen)" : "var(--gunmetal)",
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
    class="message-row"
    class:user-row={is_user}
    class:ai-row={is_ai}
    class:fractal-row={is_fractal}
    class:centered-row={is_fractal}
  >
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      class="message-bubble field-chassis"
      class:user-bubble={is_user}
      class:ai-bubble={is_ai}
      class:fractal-bubble={is_fractal}
      class:is-focused={isFocused || busy}
      class:is-busy={busy}
      class:is-editing={is_editing}
      style="--signature-color: {signature_color}; --scan-animation: {motion.isReduced
        ? 'none'
        : 'scan var(--duration-ambient) linear infinite'};"
      tabindex="0"
      onfocusin={handle_focus}
      onfocusout={handle_focus_out}
      role="region"
      aria-label="Message Context"
    >
      <div class="header field-header">
        <div class="header-status">
          <span class="entity-name"
            >{entity?.name || character_name || (is_fractal ? "Fractal" : sender)}</span
          >
          <span class="timestamp">{time_label}</span>
        </div>
        <div class="header-actions">
          {#if is_editing}
            <Button
              variant="invisible"
              size="small"
              square={true}
              aria-label="Save"
              actions={[tooltip]}
              onclick={() => on_save?.(local_text)}
            >
              <svg viewBox="0 0 24 24" class="icon-small icon-outline">
                <polyline
                  points="20 6 9 17 4 12"
                  stroke="currentColor"
                  fill="none"
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
            >
              <svg viewBox="0 0 24 24" class="icon-small icon-outline">
                <line
                  x1="18"
                  y1="6"
                  x2="6"
                  y2="18"
                  stroke="currentColor"
                  fill="none"
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
                  fill="none"
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
              >
                <svg viewBox="0 0 24 24" class="icon-small"
                  ><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon></svg
                >
              </Button>
              <Button
                variant="invisible"
                size="small"
                square={true}
                aria-label="Reroll"
                actions={[tooltip]}
                onclick={on_regenerate}
              >
                <svg viewBox="0 0 24 24" class="icon-small icon-outline">
                  <polyline points="23 4 23 10 17 10" stroke="currentColor"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" stroke="currentColor"></path>
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
            >
              <svg viewBox="0 0 24 24" class="icon-small">
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
            >
              <svg viewBox="0 0 24 24" class="icon-small icon-outline">
                <path
                  d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                  stroke="currentColor"
                ></path>
                <path
                  d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                  stroke="currentColor"
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
            >
              <svg viewBox="0 0 24 24" class="icon-small icon-outline">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor"></rect>
                <path
                  d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                  stroke="currentColor"
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
            >
              <svg viewBox="0 0 24 24" class="icon-small icon-outline">
                <polyline points="3 6 5 6 21 6" stroke="currentColor"></polyline>
                <path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  stroke="currentColor"
                ></path>
              </svg>
            </Button>
          {/if}
        </div>
      </div>

      <div class="message-body">
        {#if app.streaming.active && id && (app.streaming.nodeId === id || app.streaming.node_id === id)}
          <div class="message-content streaming-active">
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
            <div class="attachments">
              {#each attachments as src (src)}
                <Button
                  variant="invisible"
                  class="attachment-button"
                  onclick={() => app.open_image_preview(src)}
                  aria-label="View Attachment"
                  actions={[tooltip]}
                >
                  <img {src} alt="Attachment" class="attachment-image" />
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
              <div class="message-content">
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
  .message-row {
    display: flex;
    width: 100%;
    padding: var(--padding-standard) calc(var(--column-unit) * 0.5);
    position: relative;
    transition: all var(--duration-fast);
  }

  .message-row.user-row {
    justify-content: flex-end;
  }

  .message-row.ai-row {
    justify-content: flex-start;
  }

  .message-row.fractal-row,
  .message-row.centered-row {
    justify-content: center;
  }

  .message-bubble {
    width: fit-content;
    min-width: calc(var(--column-unit) * 3);
    max-width: calc(var(--column-unit) * 5.5);
    display: flex;
    flex-direction: column;
    position: relative;
    border-radius: var(--radius-standard);
    transition: all var(--duration-standard) var(--ease-standard);
    background: color-mix(in srgb, var(--glass-sunken), var(--signature-color) 3%);
    border: var(--border-whisper);
    border-color: rgb(from var(--frisk) r g b / var(--opacity-ghost));
    overflow: hidden;
    outline: none;
    cursor: pointer;
  }

  .fractal-bubble {
    width: 100%;
    min-width: calc(var(--column-unit) * 4);
    max-width: calc(var(--column-unit) * 6);
  }

  .message-bubble.is-editing {
    width: 100%;
  }

  /* Soft Point Corner Directionality */
  .user-bubble {
    border-bottom-right-radius: var(--radius-sharp);
  }

  .ai-bubble {
    border-bottom-left-radius: var(--radius-sharp);
  }

  .message-bubble:focus-within,
  .message-bubble.is-focused {
    border-color: var(--frisk);
    background: color-mix(in srgb, var(--glass-sunken), var(--signature-color) 6%);
    overflow: visible;
  }

  /* --- HOLOGRAPHIC BORDER LOGIC --- */
  .message-bubble::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: inherit;
    padding: var(--spacing-pixel);
    background: linear-gradient(
      to bottom,
      color-mix(in srgb, transparent, var(--signature-color) 40%),
      transparent 40%
    );
    mask:
      linear-gradient(var(--frisk) 0 0) content-box,
      linear-gradient(var(--frisk) 0 0);
    mask-composite: exclude;
    opacity: var(--opacity-whisper);
    transition: opacity var(--duration-standard);
  }

  .message-bubble:focus-within::before,
  .message-bubble.is-focused::before,
  .message-bubble.is-editing::before {
    opacity: var(--opacity-solid);
    background: linear-gradient(
      to bottom,
      var(--signature-color),
      color-mix(in srgb, var(--signature-color), transparent 60%) 30%,
      transparent 80%
    );
  }

  .message-bubble.fractal-bubble {
    text-align: center;
  }

  .message-bubble.fractal-bubble .message-content {
    text-align: center;
    text-wrap: balance;
  }

  /* --- HEADER LOGIC --- */
  .field-header {
    height: var(--spacing-pixel);
    background: linear-gradient(
      90deg,
      transparent 0%,
      var(--signature-color, var(--frozen)) 50%,
      transparent 100%
    );
    border-bottom: var(--spacing-pixel) solid transparent;
    transition:
      height var(--duration-standard) var(--ease-standard),
      background var(--duration-standard) var(--ease-standard),
      border var(--duration-standard) var(--ease-standard);
    display: flex;
    flex-direction: column;
    position: relative;
    top: 0;
    border-radius: var(--radius-standard) var(--radius-standard) 0 0;
    z-index: var(--z-index-surface);
  }

  .message-bubble:focus-within .field-header,
  .message-bubble.is-focused .field-header,
  .message-bubble.is-editing .field-header {
    height: calc(var(--spacing-unit) * 9);
    background: color-mix(in srgb, var(--signature-color, var(--gunmetal)), black 30%);
    border-bottom: var(--border-whisper);
    border-bottom-color: rgb(from var(--frisk) r g b / var(--opacity-whisper));
    overflow: visible;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--padding-standard);
  }

  .header-status,
  .header-actions {
    opacity: var(--opacity-none);
    pointer-events: none;
    transform: translateY(calc(var(--spacing-unit) * -1));
    transition:
      opacity var(--duration-fast) var(--ease-standard),
      transform var(--duration-fast) var(--ease-standard);
  }

  .message-bubble:focus-within .header-status,
  .message-bubble:focus-within .header-actions,
  .message-bubble.is-focused .header-status,
  .message-bubble.is-focused .header-actions,
  .message-bubble.is-editing .header-status,
  .message-bubble.is-editing .header-actions {
    opacity: var(--opacity-solid);
    pointer-events: auto;
    transform: translateY(0);
    transition:
      opacity var(--duration-fast) var(--ease-standard) 200ms,
      transform var(--duration-fast) var(--ease-standard) 200ms;
  }

  .header-status {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--gap-standard);
    overflow: hidden;
    font-family: var(--font-family-mono);
    text-transform: uppercase;
    letter-spacing: var(--font-spacing-loose);
  }

  .entity-name {
    font-size: var(--font-size-tiny);
    font-weight: var(--font-weight-bold);
    color: var(--pure-white);
    text-shadow: 0 0 calc(var(--spacing-unit) * 2)
      rgb(from var(--pure-white) r g b / var(--opacity-whisper));
    white-space: nowrap;
  }

  .timestamp {
    font-size: var(--font-size-nano);
    color: var(--pure-white);
    opacity: var(--opacity-whisper);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--gap-tight);
    margin-left: auto;
  }

  /* Ghost Icon Lighting */
  .header-actions :global(button) {
    color: var(--pure-white) !important;
    opacity: 0.8;
    transition:
      opacity var(--duration-standard) var(--ease-standard),
      transform var(--duration-standard) var(--ease-standard);
  }

  .header-actions :global(button:hover) {
    color: var(--pure-white) !important;
    opacity: 1;
    transform: var(--scale-pulse);
  }

  .header-actions :global(button svg) {
    color: var(--pure-white) !important;
  }

  .header-actions :global(button svg *) {
    stroke: var(--pure-white) !important;
    fill: none;
  }

  .header-actions :global(button svg polygon),
  .header-actions :global(button svg path[fill="currentColor"]),
  .header-actions :global(button svg[fill="currentColor"]) {
    fill: var(--pure-white) !important;
    stroke: none !important;
  }

  /* --- BODY LOGIC --- */
  .message-body {
    padding: var(--padding-standard);
    position: relative;
    z-index: var(--z-index-surface);
  }

  .message-content {
    line-height: var(--font-height-base);
    font-size: var(--font-size-base);
    font-family: var(--font-family-base);
    color: var(--pure-white);
    text-shadow: var(--shadow-font);
    text-align: left;
    text-wrap: pretty;
  }

  /* Bold & Bright Dialogue */
  .message-content :global(strong),
  .message-content :global(b) {
    font-weight: var(--font-weight-bold);
    color: var(--signature-color, var(--gunmetal));
    text-shadow: 0 0 calc(var(--spacing-unit) * 2)
      rgb(from var(--signature-color, var(--gunmetal)) r g b / var(--opacity-whisper));
  }

  /* High-Vis Narration */
  .message-content :global(em),
  .message-content :global(i) {
    font-style: italic;
    opacity: var(--opacity-solid);
    color: var(--frozen);
  }

  .message-content :global(p) {
    margin: 0 0 var(--margin-standard) 0;
  }

  .message-content :global(p:last-child) {
    margin-bottom: 0;
  }

  /* --- BUSY ANIMATION (The "Something") --- */
  .message-bubble.is-busy .field-header {
    overflow: hidden;
  }

  .message-bubble.is-busy .field-header::after {
    content: "";
    position: absolute;
    inset: 0;
    width: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgb(from var(--frisk) r g b / var(--opacity-whisper)) 50%,
      transparent 100%
    );
    animation: var(--scan-animation);
  }

  @keyframes scan {
    from {
      transform: translateX(-100%) skewX(-20deg);
    }

    to {
      transform: translateX(100%) skewX(-20deg);
    }
  }

  .attachments {
    margin-bottom: var(--margin-standard);
  }

  .message-row :global(.button.attachment-button) {
    padding: var(--padding-tight);
    min-height: 0;
    background: var(--glass-base);
    margin: 0 0 var(--margin-tight) 0;
    width: fit-content;
  }

  .message-row :global(.button.attachment-button:hover) {
    background: var(--glass-elevated);
  }

  .attachment-image {
    max-width: 100%;
    border-radius: var(--radius-sharp);
    box-shadow: var(--shadow-ghost);
    object-fit: cover;
  }
</style>
