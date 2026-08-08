<script>
  import { tick } from "svelte";
  import { Button, tooltip } from "@atoms";
  import { chrono_engine } from "@engine";
  import { gamemaster } from "@intelligence";
  import { stab } from "@motion";
  import { app, simulation_state } from "@state";

  // eslint-disable-next-line no-useless-assignment
  let { is_focused = $bindable(false) } = $props();

  let value = $state("");
  /** @type {HTMLTextAreaElement | undefined} */
  let textarea = $state();
  let is_ghostwriting = $state(false);

  let is_locked = $derived(simulation_state.busy);

  $effect(() => {
    // Snapshot the request count synchronously so it's the only reactive dep here.
    const req = app.ghostwrite_request;
    if (req === 0) return;
    // Mark as consumed immediately to prevent the effect from re-firing when
    // is_ghostwriting toggles back to false after the draft returns.
    app.ghostwrite_request = 0;
    (async () => {
      if (is_locked) return;
      is_ghostwriting = true;
      try {
        const draft = await gamemaster.execute_ghostwriter(value);
        if (draft) {
          value = draft;
          await tick();
          adjust_height();
        }
      } catch (e) {
        console.error("[Ghostwriter Error]", e);
        app.log(`Ghostwriter failed: ${e.message || e}`, "error");
      } finally {
        is_ghostwriting = false;
      }
    })();
  });

  $effect(() => {
    if (value !== undefined && textarea) {
      tick().then(adjust_height);
    }
  });

  $effect(() => {
    if (app.view === "storymode" && textarea && !app.control_panel_open) {
      textarea.focus();
    }
  });

  function adjust_height() {
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  async function handle_send() {
    const text = value.trim();
    if (!text || is_locked) return;

    value = "";

    // Wait for Svelte to flush the empty value to the DOM before measuring
    await tick();
    adjust_height();

    try {
      await chrono_engine.send(text);
    } catch (e) {
      console.error("Failed to send message:", e);
    }
  }

  function handle_keydown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handle_send();
    }
  }
</script>

<textarea
  bind:this={textarea}
  class="
    max-h-32
    flex-1
    resize-none
    overflow-y-hidden
    border-none
    bg-transparent
    p-2
    text-base
    text-inherit
    outline-none
    placeholder:text-slate-400
    placeholder:opacity-60
    disabled:cursor-wait
    disabled:opacity-30
  "
  bind:value
  onkeydown={handle_keydown}
  oninput={adjust_height}
  onfocus={() => (is_focused = true)}
  onblur={() => (is_focused = false)}
  placeholder="Type a message..."
  rows="1"
  disabled={app.control_panel_open || is_ghostwriting}
  aria-label="Input message"
></textarea>

{#if app.streaming.active}
  <Button
    variant="invisible"
    disabled={app.control_panel_open}
    onclick={() => app.trigger_interrupt()}
    aria-label="Interrupt Generation"
    actions={[tooltip]}
    class="touch-target-coarse text-slate-500 transition-colors hover:bg-transparent! hover:text-red-500!"
  >
    <svg class="block size-icon-medium" viewBox="0 0 24 24">
      <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z" />
    </svg>
  </Button>
{:else}
  <Button
    variant="invisible"
    onclick={handle_send}
    disabled={!value.trim() || is_locked || app.control_panel_open}
    aria-label="Send Message"
    actions={[stab, tooltip]}
    class="touch-target-coarse"
  >
    <svg class="block size-icon-medium" viewBox="0 0 24 24">
      <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  </Button>
{/if}
