<script>
  import { app } from "../stores/app.svelte.js";

  let {
    text = "",
    sender = "system", // 'ai', 'user', 'system'
    timestamp = new Date(),
    attachments = [],
  } = $props();

  let isUser = $derived(sender === "user");
  let isAi = $derived(sender === "ai");
</script>

<div class="message-row" class:user-row={isUser} class:ai-row={isAi}>
  <div class="message-bubble" class:user-bubble={isUser} class:ai-bubble={isAi}>
    {#if attachments.length > 0}
      <div class="attachments">
        {#each attachments as src}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
          <img
            {src}
            alt="Attachment"
            class="attachment-image clickable"
            onclick={() => app.openLightbox(src)}
          />
        {/each}
      </div>
    {/if}
    <div class="message-content">
      {text}
    </div>
    <div class="message-meta">
      {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </div>
  </div>
</div>

<style lang="scss">
  .attachments {
    margin-bottom: 0.75rem;

    .attachment-image {
      max-width: 100%;
      border-radius: 8px;
      display: block;
      margin-bottom: 0.5rem;
      border: 1px solid rgba(255, 255, 255, 0.1);

      &.clickable {
        cursor: pointer;
        transition: transform 0.2s;
        &:hover {
          transform: scale(1.02);
        }
      }
    }
  }
  .message-row {
    display: flex;
    width: 100%;
    padding: 0.75rem 1.5rem; /* More horizontal padding */

    &.user-row {
      justify-content: flex-end;
    }

    &.ai-row {
      justify-content: flex-start;
    }
  }

  .message-bubble {
    max-width: 80%;
    padding: 1rem 1.25rem;
    border-radius: 12px;
    background: #18181b;
    border: 1px solid #27272a;
    color: #e4e4e7;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
    position: relative;

    &.user-bubble {
      background: #1e3a8a; /* Blue 900 */
      border-color: #1d4ed8;
      color: #fff;
      border-bottom-right-radius: 2px;
      box-shadow: 0 4px 12px rgba(29, 78, 216, 0.2);
    }

    &.ai-bubble {
      background: #064e3b; /* Emerald 900 */
      border-color: #059669;
      color: #ecfdf5;
      border-bottom-left-radius: 2px;
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2);
    }
  }

  .message-content {
    white-space: pre-wrap;
    line-height: 1.6;
    font-size: 1rem; /* 16px */
  }

  .message-meta {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 0.5rem;
    text-align: right;
    font-weight: 500;
  }
</style>
