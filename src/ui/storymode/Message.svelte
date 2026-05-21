<script>
  /**
   * @file Message.svelte
   * ❄️ THE SIMULATION MESSAGE
   * Renders parsed messages in a Unified Nordic Chassis.
   */
  import TypingIndicator from "@atoms/TypingIndicator.svelte";
  import { parse_message } from "@core/text-parser.js";
  import DataBox from "@devmode/DataBox.svelte";
  import { app } from "@state/app.svelte.js";
  import { runtime } from "@state/runtime.svelte.js";
  import { themeStore } from "@theme/palette.svelte.js";
  import { safe_html } from "@utils/safe-html.js";

  import Button from "@atoms/Button.svelte";
  import { tooltip } from "@atoms/Tooltip.svelte";
  import DevTelemetryBlock from "@devmode/DevTelemetryBlock.svelte";

  /**
   * @typedef {Object} Props
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
   */

  /** @type {Props} */
  let {
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
  } = $props();

  let isFocused = $state(false);

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
          ? runtime.active_fractal || app.selected_fractal
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

  // Check if we have visible story text
  let has_display_text = $derived(!!(display_text && display_text !== "<p></p>"));

  /**
   *
   */
  function handle_focus() {
    isFocused = true;
  }

  /** @param {FocusEvent & { currentTarget: HTMLElement, relatedTarget: EventTarget | null }} e */
  function handle_focus_out(e) {
    if (e.relatedTarget && e.currentTarget.contains(/** @type {Node} */ (e.relatedTarget))) return;
    isFocused = false;
  }

  /**
   *
   */
  async function handle_copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error("Failed to copy text:", e);
    }
  }

  const time_label = $derived(
    timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
  );
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
      style="--signature-color: {signature_color};"
      tabindex="0"
      onfocusin={handle_focus}
      onfocusout={handle_focus_out}
      role="article"
    >
      <div class="header field-header">
        <div class="header-status">
          <span class="entity-name"
            >{entity?.name || character_name || (is_fractal ? "Fractal" : sender)}</span
          >
          <span class="timestamp">{time_label}</span>
        </div>
        <div class="header-actions">
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
        </div>
      </div>

      <div class="message-body">
        {#if busy && !text}
          <div class="thinking-wrapper">
            <TypingIndicator variant="pill" {signature_color} />
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

          {#if has_display_text}
            <div class="message-content" use:safe_html={display_text}></div>
          {/if}

          {#if busy && !has_display_text}
            <div class="thinking-wrapper">
              <TypingIndicator variant="pill" {signature_color} />
            </div>
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
    padding: var(--padding-standard) var(--padding-standard);
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
    padding: var(--padding-standard) var(--padding-standard);
  }

  .message-bubble {
    width: fit-content;
    min-width: var(--width-sidebar);
    max-width: 50vw;
    display: flex;
    flex-direction: column;
    position: relative;
    border-radius: var(--radius-standard);
    transition: all var(--duration-standard) var(--motion-elastic);
    background: color-mix(in srgb, var(--glass-sunken), var(--signature-color) 3%);
    border-color: rgb(from var(--pure-white) r g b / var(--opacity-ghost));
    overflow: hidden;
    outline: none;
    cursor: pointer;
  }

  .fractal-bubble {
    width: var(--modal-width-wide);
    max-width: 90%;
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
    border-color: var(--pure-white);
    background: color-mix(in srgb, var(--glass-sunken), var(--signature-color) 6%);
    overflow: visible;
  }

  /* --- HOLOGRAPHIC BORDER LOGIC --- */
  .message-bubble::before {
    content: "";
    position: absolute;
    inset: calc(var(--spacing-unit) * 0);
    pointer-events: none;
    border-radius: inherit;
    padding: var(--gap-tight);
    background: linear-gradient(
      to bottom,
      color-mix(in srgb, transparent, var(--signature-color) 40%),
      transparent 40%
    );
    mask:
      linear-gradient(var(--pure-white) calc(var(--spacing-unit) * 0) calc(var(--spacing-unit) * 0))
        content-box,
      linear-gradient(
        var(--pure-white) calc(var(--spacing-unit) * 0) calc(var(--spacing-unit) * 0)
      );
    mask-composite: exclude;
    opacity: var(--opacity-whisper);
    transition: opacity var(--duration-standard);
  }

  .message-bubble:focus-within::before,
  .message-bubble.is-focused::before {
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
    transition: all var(--duration-standard) var(--motion-elastic);
    display: flex;
    flex-direction: column;
    position: relative;
    top: calc(var(--spacing-unit) * 0);
    border-radius: var(--radius-standard) var(--radius-standard) calc(var(--spacing-unit) * 0)
      calc(var(--spacing-unit) * 0);
    z-index: var(--z-index-surface);
  }

  .message-bubble:focus-within .field-header,
  .message-bubble.is-focused .field-header {
    height: calc(var(--spacing-unit) * 9);
    background: color-mix(in srgb, var(--signature-color, var(--gunmetal)), black 30%);
    border-bottom: var(--spacing-pixel) solid
      rgb(from var(--pure-white) r g b / var(--opacity-whisper));
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
    transition: all var(--duration-fast);
  }

  .message-bubble:focus-within .header-status,
  .message-bubble:focus-within .header-actions,
  .message-bubble.is-focused .header-status,
  .message-bubble.is-focused .header-actions {
    opacity: var(--opacity-solid);
    pointer-events: auto;
    transform: translateY(calc(var(--spacing-unit) * 0));
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
    transition: all var(--duration-standard);
  }

  .header-actions :global(button:hover) {
    color: var(--pure-white) !important;
    opacity: 1;
    transform: var(--scale-pulse);
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
    text-shadow: calc(var(--spacing-unit) * 0) calc(var(--spacing-unit) * 0)
      calc(var(--spacing-unit) * 2)
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

  .thinking-wrapper {
    display: flex;
    padding: var(--padding-standard) 0;
  }

  /* --- BUSY ANIMATION (The "Something") --- */
  .message-bubble.is-busy .field-header {
    overflow: hidden;
  }

  .message-bubble.is-busy .field-header::after {
    content: "";
    position: absolute;
    inset: calc(var(--spacing-unit) * 0);
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgb(from var(--pure-white) r g b / var(--opacity-whisper)) 50%,
      transparent 100%
    );
    width: 100%;
    animation: scan var(--duration-ambient) linear infinite;
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
