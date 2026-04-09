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
  let {
    text = "",
    sender = "system", // 'ai', 'user', 'fractal', 'system'
    character_name = "",
    timestamp = new Date(),
    attachments = [],
    on_delete = () => {},
    on_regenerate = () => {},
    on_continue = () => {},
    on_edit = () => {},
    is_last = false,
    is_thinking = false,
  } = $props();
  let is_user = $derived(sender === "user");
  let is_ai = $derived(sender === "ai");
  let is_fractal = $derived(sender === "fractal");
  let entity = $derived.by(() => {
    // [R5] Resolution Order:
    if (!character_name) {
      if (is_user) return runtime.active_user;
      if (is_ai) return runtime.active_ai;
      if (is_fractal) return runtime.active_fractal;
      return null;
    }
    // 1. Active Character (Fastest & most correct for edits)
    if (is_user && runtime.active_user?.name === character_name) return runtime.active_user;
    if (is_ai && runtime.active_ai?.name === character_name) return runtime.active_ai;
    if (is_fractal && runtime.active_fractal?.name === character_name)
      return runtime.active_fractal;
    // 2. Cache Lists (For history)
    if (is_user) return app.user_list.find((e) => e.name === character_name);
    if (is_ai) return app.ai_list.find((e) => e.name === character_name);
    if (is_fractal) return app.fractal_list.find((e) => e.name === character_name);
    // 3. Fallback
    if (is_user) return runtime.active_user;
    if (is_ai) return runtime.active_ai;
    return null;
  });
  let signature_color = $derived.by(() => {
    // 1. Try Entity
    if (entity) return themeStore.get_signature_color(entity);
    // 2. Try Character Name (Deterministic Fallback)
    if (character_name) return themeStore.get_deterministic_color(character_name);
    // 3. Fallback to App State [FLATTENED]
    if (is_user && app.selected_user?.signature_color)
      return themeStore.get_signature_color(app.selected_user);
    if (is_ai && app.selected_ai?.signature_color)
      return themeStore.get_signature_color(app.selected_ai);
    if (is_fractal && app.selected_fractal?.signature_color)
      return themeStore.get_signature_color(app.selected_fractal);
    // 4. Robust Fallback by Role
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
    <div class="thinking-pill" style="background: var(--signature-color);">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  {:else}
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
              class="attachment-btn"
              onclick={() => app.open_lightbox(src)}
              title="View Attachment"
            >
              <img
                {src}
                alt="Attachment"
                class="attachment-image"
                onerror={(e) => {
                  if (e.target instanceof HTMLImageElement) {
                    e.target.style.display = "none";
                  }
                  console.warn("Failed to load attachment:", src);
                }}
              />
            </button>
          {/each}
        </div>
      {/if}
      <div class="message-content" use:safe_html={display_text}></div>
      <div class="message-footer">
        {#if is_ai}
          <div class="message-actions">
            {#if is_last}
              <button
                class="action-btn"
                type="button"
                title="Continue"
                onclick={(e) => on_continue(e)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </button>
              <button
                class="action-btn"
                type="button"
                title="Reroll"
                onclick={(e) => on_regenerate(e)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
              </button>
            {/if}
            <button class="action-btn" type="button" title="Edit" onclick={(e) => on_edit(e)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button
              class="action-btn"
              type="button"
              title="Copy"
              onclick={async () => {
                try {
                  await navigator.clipboard.writeText(text);
                } catch (e) {
                  console.error("Failed to copy text:", e);
                }
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
            <button
              class="action-btn delete"
              type="button"
              title="Delete"
              onclick={(e) => on_delete(e)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="3 6 5 6 21 6"></polyline>
                <path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                ></path>
              </svg>
            </button>
          </div>
        {/if}
        <div class="message-timestamp">
          {timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .attachments {
    margin-bottom: var(--spacing-s);
  }

  .attachments .attachment-btn {
    background: none;
    border: none;
    padding: 0;
    margin: 0 0 var(--spacing-xs) 0;
    cursor: pointer;
    transition: transform var(--motion-fast);
    display: block;
  }

  .attachments .attachment-btn:hover {
    transform: scale(1.02);
  }

  .attachments .attachment-image {
    max-width: 100%;
    border-radius: var(--border-radius);
    display: block;
    box-shadow: var(--shadow-s);
  }

  .message-row {
    display: flex;
    width: 100%;
    padding: var(--spacing-s) var(--spacing-m);
  }

  .message-row.user-row {
    justify-content: flex-end;
  }

  .message-row.ai-row {
    justify-content: flex-start;
  }

  .message-row.fractal-row {
    justify-content: center;
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

  .thinking-pill .dot:nth-child(1) {
    animation-delay: -0.32s;
  }

  .thinking-pill .dot:nth-child(2) {
    animation-delay: -0.16s;
  }

  @keyframes dot-bounce {
    0%,
    80%,
    100% {
      transform: scale(0);
    }

    40% {
      transform: scale(1);
    }
  }

  .message-bubble {
    width: max-content;
    max-width: 80%;
    padding: var(--spacing-m);
    border-radius: var(--border-radius-l);
    background: var(--bubble-color);
    box-shadow: var(--shadow-s);
    color: var(--font-color-m);
    position: relative;
    overflow: hidden;
  }

  .message-bubble.user-bubble {
    max-width: 75%;
    border-bottom-right-radius: 0;
    text-align: left;
  }

  .message-bubble.ai-bubble {
    max-width: 75%;
    border-bottom-left-radius: 0;
    text-align: left;
  }

  .message-bubble.fractal-bubble {
    width: 50%;
    max-width: 80%;
    text-align: center;
    color: var(--font-color-m);
    background: var(--bubble-color);
    box-shadow: var(--shadow-s);
  }

  .message-bubble.fractal-bubble .message-content {
    text-align: center;
  }

  .think-block {
    background: var(--glass-l);
    border-radius: var(--border-radius);
    padding: var(--spacing-s);
    margin-bottom: var(--spacing-m);
    font-size: var(--font-size-s);
  }

  .think-block .think-label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-xl);
    color: var(--color-cyan);
    letter-spacing: var(--letter-spacing-l);
    margin-bottom: var(--spacing-xxs);
  }

  .think-block .think-content {
    color: var(--font-color-s);
    font-family: var(--font-family-mono);
    font-style: italic;
    white-space: pre-wrap;
  }

  .message-content {
    white-space: pre-wrap;
    line-height: var(--line-height-m);
    font-size: var(--font-size-m);
    font-family: var(--font-family-body);
    text-shadow: var(--shadow-s);
  }

  .message-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--spacing-xs);
    margin-top: var(--spacing-xs);
    min-height: var(--spacing-xl);
  }

  .message-timestamp {
    font-size: var(--font-size-xs);
    color: var(--font-color-m);
    font-weight: var(--font-weight-m);
    opacity: var(--opacity-s);
    text-shadow: var(--shadow-s);
    transition: opacity var(--motion-fast);
  }

  .message-actions {
    display: flex;
    gap: var(--spacing-xxs);
    opacity: var(--opacity-none);
    pointer-events: none;
    transition: opacity var(--motion-fast);
  }

  .message-bubble:hover .message-timestamp {
    opacity: var(--opacity-full);
  }

  .message-bubble:hover .message-actions {
    opacity: var(--opacity-full);
    pointer-events: auto;
  }

  .action-btn {
    background: var(--glass-l);
    color: var(--font-color-s);
    border-radius: var(--border-radius);
    width: var(--spacing-xl);
    height: var(--spacing-xl);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all var(--motion-fast);
    position: relative;
    border: none;
    padding: 0;
  }

  .action-btn,
  .action-btn svg,
  .action-btn path,
  .action-btn rect,
  .action-btn polygon,
  .action-btn polyline {
    text-shadow: none;
    filter: none;
    box-shadow: none;
    shape-rendering: geometricprecision;
  }

  .action-btn svg {
    stroke-width: 1.5;
    pointer-events: none;
  }

  .action-btn:hover {
    background: var(--font-color-m);
    box-shadow: 0 0 0 var(--spacing-px) var(--font-color-m);
    color: var(--signature-color);
  }

  .action-btn:hover svg {
    stroke-width: 2;
    stroke: currentcolor;
  }

  .action-btn::after {
    content: attr(title);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(calc(var(--spacing-xs) * -2));
    background: var(--bg-component);
    color: var(--font-color-m);
    padding: var(--spacing-xxs) var(--spacing-xs);
    border-radius: var(--border-radius-s);
    font-size: var(--font-size-xs);
    white-space: nowrap;
    opacity: var(--opacity-none);
    pointer-events: none;
    transition: all var(--motion-fast);
    z-index: var(--z-index-l);
    box-shadow: var(--glass-border);
  }

  .action-btn:hover::after {
    opacity: var(--opacity-full);
    transform: translateX(-50%) translateY(calc(var(--spacing-xs) * -1));
  }

  .action-btn.delete:hover {
    background: var(--color-del); /* [R5] Standardized variable from tokens.css */
    box-shadow: 0 0 0 var(--spacing-px) var(--font-color-m);
    color: var(--font-color-m);
  }

  .action-btn.delete:hover svg {
    stroke: var(--font-color-m);
  }
</style>
