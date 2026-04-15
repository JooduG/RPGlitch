<script>
  /**
   * @file Message.svelte
   * 💬 THE SIMULATION MESSAGE
   * Renders parsed messages, DevMode think blocks, and handles inline actions.
   * Flattened Schema Compliant.
   */
  import { parse_message } from "@core/engine/text-parser.js";
  import { app } from "@state/app.svelte.js";
  import { runtime } from "@state/runtime.svelte.js";
  import { themeStore } from "@theme/palette.svelte.js";
  import { safe_html } from "@ui/utils/actions/safe-html.js";
  import SceneHeader from "../SceneHeader.svelte";
  import MessageToolbar from "./MessageToolbar.svelte";

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
   * @property {boolean} [is_thinking=false]
   */

  /** @type {Props} */
  let {
    text = "",
    sender = "system", // 'ai', 'user', 'fractal', 'system'
    character_name = "",
    timestamp = new Date(),
    attachments = [],
    on_delete = undefined,
    on_regenerate = undefined,
    on_continue = undefined,
    on_edit = undefined,
    is_last = false,
    is_thinking = false,
  } = $props();

  let is_user = $derived(sender === "user");
  let is_ai = $derived(sender === "ai");
  let is_fractal = $derived(sender === "fractal");

  let entity = $derived.by(() => {
    if (!character_name) {
      if (is_user) return runtime.active_user;
      if (is_ai) return runtime.active_ai;
      if (is_fractal) return runtime.active_fractal;
      return null;
    }
    if (is_user && runtime.active_user?.name === character_name) return runtime.active_user;
    if (is_ai && runtime.active_ai?.name === character_name) return runtime.active_ai;
    if (is_fractal && runtime.active_fractal?.name === character_name) return runtime.active_fractal;
    if (is_user) return app.user_list.find((e) => e.name === character_name);
    if (is_ai) return app.ai_list.find((e) => e.name === character_name);
    if (is_fractal) return app.fractal_list.find((e) => e.name === character_name);
    return null;
  });

  let signature_color = $derived.by(() => {
    if (entity) return themeStore.get_signature_color(entity);
    if (character_name) return themeStore.get_deterministic_color(character_name);
    if (is_user && app.selected_user?.signature_color) return themeStore.get_signature_color(app.selected_user);
    if (is_ai && app.selected_ai?.signature_color) return themeStore.get_signature_color(app.selected_ai);
    if (is_fractal && app.selected_fractal?.signature_color) return themeStore.get_signature_color(app.selected_fractal);
    return themeStore.get_deterministic_color(sender);
  });

  let text_color = $derived(themeStore.get_contrast_color(signature_color));
  let parsed = $derived(parse_message(text));
  let display_text = $derived(parsed.displayText);
  let think_block = $derived(parsed.think);
  let scene_data = $derived(parsed.sceneData);
</script>

<div
  class="message-row"
  class:user-row={is_user}
  class:ai-row={is_ai}
  class:fractal-row={is_fractal}
  class:thinking-row={is_thinking}
>
  {#if is_thinking}
    <div class="thinking-pill" style="background: {signature_color};">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  {:else}
    <div class="message-container">
      <div
        class="message-bubble"
        class:user-bubble={is_user}
        class:ai-bubble={is_ai}
        class:fractal-bubble={is_fractal}
        style="--bubble-color: {signature_color}; --signature-color: {signature_color}; --bubble-text-color: {text_color};"
      >
        {#if scene_data}
          <div class="scene-header-wrapper">
            <SceneHeader {...scene_data} />
          </div>
        {/if}

        {#if app.settings.dev_mode && think_block}
          <div class="think-block">
            <div class="think-label">🎬 DevMode</div>
            <div class="think-content">{think_block}</div>
          </div>
        {/if}

        {#if attachments.length > 0}
          <div class="attachments">
            {#each attachments as src (src)}
              <button
                type="button"
                class="attachment-button"
                onclick={() => app.open_lightbox(src)}
                title="View Attachment"
              >
                <img {src} alt="Attachment" class="attachment-image" />
              </button>
            {/each}
          </div>
        {/if}

        <div class="message-content" use:safe_html={display_text}></div>
      </div>

      <MessageToolbar
        sender={sender}
        isLast={is_last}
        text={text}
        timestamp={timestamp}
        onDelete={on_delete}
        onRegenerate={on_regenerate}
        onContinue={on_continue}
        onEdit={on_edit}
        className="message-toolbar-pill"
      />
    </div>
  {/if}
</div>

<style>
  .message-row {
    display: flex;
    width: 100%;
    padding: var(--spacing-l) var(--spacing-m);
    position: relative;
  }

  .message-row.user-row { justify-content: flex-end; }
  .message-row.ai-row { justify-content: flex-start; }
  .message-row.fractal-row { justify-content: center; }

  /* --- Container Logic: Side-by-side Bubble & Toolbar --- */
  .message-container {
    display: flex;
    gap: var(--spacing-s);
    max-width: 85%;
    position: relative;
  }

  /* Inner Gutter Logic: User (Right) -> Toolbar moves to Left side of bubble */
  .user-row .message-container {
    flex-direction: row-reverse;
  }

  /* Fractal/AI: Toolbar on the Right */
  .ai-row .message-container,
  .fractal-row .message-container {
    flex-direction: row;
  }

  .thinking-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xxs);
    padding: var(--spacing-xs) var(--spacing-m);
    border-radius: var(--border-radius-full);
    height: var(--spacing-xl);
  }

  .thinking-pill .dot {
    width: var(--spacing-xs);
    height: var(--spacing-xs);
    background: var(--color-white);
    border-radius: var(--border-radius-full);
    animation: dot-bounce 1.4s infinite ease-in-out both;
  }

  @keyframes dot-bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }

  .message-bubble {
    width: max-content;
    padding: var(--spacing-m);
    border-radius: var(--border-radius-l);
    background: var(--bubble-color);
    box-shadow: var(--shadow-s);
    color: var(--bubble-text-color);
    position: relative;
    overflow: hidden;
  }

  /* Pointy Corners */
  .user-bubble { border-bottom-right-radius: 0; }
  .ai-bubble { border-bottom-left-radius: 0; }

  .fractal-bubble {
    width: 60rem;
    max-width: 100%;
  }

  /* --- Content Alignment Integrity --- */
  .message-bubble.user-bubble,
  .message-bubble.ai-bubble {
    text-align: left;
  }

  .message-bubble.fractal-bubble {
    text-align: center;
  }

  .message-bubble.fractal-bubble .message-content {
    text-align: center;
  }

  .message-content {
    line-height: var(--line-height-m);
    font-size: var(--font-size-m);
    font-family: var(--font-family-body);
    text-shadow: 0 1px 2px rgb(var(--color-black-rgb) / 60%);
  }

  .message-content :global(p) { margin: 0 0 var(--spacing-s) 0; }
  .message-content :global(p:last-child) { margin-bottom: 0; }

  .think-block {
    background: var(--glass-xs);
    border-radius: var(--border-radius);
    padding: var(--spacing-s);
    margin-bottom: var(--spacing-m);
    font-size: var(--font-size-s);
    border: var(--glass-edge-s);
    text-align: left;
    width: 100%;
  }

  .think-block .think-label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-xl);
    color: var(--color-focus-alt);
    letter-spacing: var(--letter-spacing-l);
    margin-bottom: var(--spacing-xxs);
  }

  .think-block .think-content {
    color: var(--font-color-m);
    font-family: var(--font-family-mono);
    font-style: italic;
    white-space: pre-wrap;
  }

  .attachments { margin-bottom: var(--spacing-s); }

  .attachment-button {
    background: none;
    border: none;
    padding: 0;
    margin: 0 0 var(--spacing-xs) 0;
    cursor: pointer;
    transition: transform var(--motion-fast);
  }

  .attachment-image {
    max-width: 100%;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-s);
  }

</style>
