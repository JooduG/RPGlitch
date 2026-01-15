<script>
  import Layout from "../Layout.svelte";
  import StorymodePanel from "./StorymodePanel.svelte";
  import InputBar from "./InputBar.svelte";
  import Message from "./Message.svelte";
  import { app } from "../state.svelte.js";

  // Messages are derived from global store (or passed in, but app.messages is the standard)
  let messages = $derived(app.messages || []);

  let scrollContainer;

  $effect(() => {
    if (messages.length && scrollContainer) {
      // Auto-scroll to bottom on new messages
      // We use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      });
    }
  });

  // --- Helpers for Slot Content ---
</script>

<div class="storymode-wrapper">
  <Layout>
    {#snippet left()}
      <StorymodePanel entity={app.selectedAi} />
    {/snippet}

    {#snippet center()}
      <!-- 1. The Header (Formerly ContextCard) -->
      <div class="center-header">
        <!-- Reuse StorymodePanel for the fractal context, customized via props if needed,
              or just wrap it. ContextCard was just a wrapper with isFractal={true}.
              StorymodePanel detects fractal type automatically. -->
        <div class="fractal-wrapper">
          <StorymodePanel entity={app.selectedFractal} />
        </div>
      </div>

      <!-- 2. The Chat Log (Formerly ChatLog.svelte) -->
      <div class="chat-wrapper">
        <div class="chat-log" bind:this={scrollContainer}>
          {#each messages as msg}
            <Message
              text={msg.text}
              sender={msg.sender}
              timestamp={msg.timestamp}
            />
          {/each}
        </div>
      </div>

      <!-- 3. The Input Bar -->
      <div class="input-wrapper">
        <InputBar />
      </div>
    {/snippet}

    {#snippet right()}
      <StorymodePanel entity={app.selectedUser} />
    {/snippet}
  </Layout>
</div>

<style lang="scss">
  .storymode-wrapper {
    width: 100%;
    height: 100%;
  }

  /* Center Column Layout */

  /* Header: Fixed height, sits at top */
  .center-header {
    width: 100%;
    flex-shrink: 0;
    z-index: 10;
    pointer-events: auto;
    /* Visual separation if desired, or let the panel handle it */
    padding: 0.5rem;
  }

  /* Chat Wrapper: Fills remaining space */
  .chat-wrapper {
    flex: 1;
    width: 100%;
    min-height: 0; /* Important for flex scrolling */
    display: flex;
    flex-direction: column;
    position: relative;
    pointer-events: auto;
  }

  .chat-log {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    padding-bottom: 2rem;

    /* Scrollbar styling */
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
    }
  }

  /* Input Wrapper: Fixed at bottom */
  .input-wrapper {
    width: 100%;
    flex-shrink: 0;
    pointer-events: auto;
    z-index: 20;
  }

  /* Fractal Header Wrapper to ensure correct sizing within the center stack */
  .fractal-wrapper {
    /* You might want to constrain height or style it differently than side panels */
    /* For now, just a pass-through */
    width: 100%;
    display: flex;
    justify-content: center;
  }
</style>
