<script>
  import { tick } from "svelte";
  import { Button, tooltip } from "@primitives";
  import { chrono_engine } from "@state";
  import { gamemaster } from "@intelligence";
  import { stab } from "@motion";
  import { app, runtime, simulation_state, force_recover_simulation } from "@state";

  // eslint-disable-next-line no-useless-assignment
  let { is_focused = $bindable(false), has_text = $bindable(false) } = $props();

  let value = $state("");
  $effect(() => {
    has_text = value.length > 0;
  });
  /** @type {HTMLTextAreaElement | undefined} */
  let textarea = $state();
  let is_ghostwriting = $state(false);
  /** Messages typed while the composer is busy — sent the moment it's free. */
  let pending = $state([]);

  let is_locked = $derived(simulation_state.busy);
  // Mirrors chrono_engine.send()'s own gate so the button state and the send
  // gate can never disagree (previously the button enabled while sends were
  // being silently rejected).
  let send_blocked = $derived(is_locked || app.simulation.loading || app.control_panel_open);
  let pending_count = $derived(pending.length);

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
      app.is_ghostwriting = true;
      try {
        value = ""; // clear previous value for live drafting
        const draft = await gamemaster.execute_ghostwriter(value, null, (chunk, is_full_replace) => {
          if (is_full_replace) {
            value = chunk;
          } else {
            value += chunk;
          }
          adjust_height();
        });
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
        app.is_ghostwriting = false;
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

  async function send_or_restore(text) {
    try {
      const accepted = await chrono_engine.send(text);
      // A rejected send must never eat the user's message: put the text back so
      // it can be re-sent or queued. (Nothing is ever silently dropped.)
      if (!accepted) value = text;
    } catch (e) {
      console.error("Failed to send message:", e);
      value = text;
    }
  }

  async function handle_send() {
    const text = value.trim();
    if (!text) return;

    value = "";

    // Wait for Svelte to flush the empty value to the DOM before measuring
    await tick();
    adjust_height();

    if (send_blocked) {
      pending.push(text);
      return;
    }
    await send_or_restore(text);
  }

  // Auto-send queued messages the moment the composer is free again. Runs as
  // fire-and-forget so sends never block a flush.
  $effect(() => {
    if (send_blocked || pending.length === 0) return;
    const text = pending.shift();
    if (text != null) send_or_restore(text);
  });

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
  placeholder={app.control_panel_open ? "" : is_ghostwriting ? "Ghostwriting..." : "Type a message..."}
  rows="1"
  disabled={app.control_panel_open || is_ghostwriting}
  aria-label="Input message"
></textarea>

{#if pending_count > 0}
  <span
    class="flex shrink-0 items-center gap-2 text-[10px] font-bold tracking-widest text-amber-300 uppercase"
    use:tooltip={pending_count > 1
      ? `${pending_count} messages queued — they send when the current turn finishes.`
      : "Message queued — it sends when the current turn finishes."}
  >
    <span class="size-2 animate-pulse rounded-full bg-amber-400"></span>
    {pending_count > 1 ? `${pending_count} queued` : "Queued"}
  </span>
{/if}

{#if app.streaming.active && runtime.round > 0}
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
{:else if is_locked || app.simulation.loading || app.streaming.active}
  <Button
    variant="invisible"
    onclick={() => force_recover_simulation("Manual unstick from composer")}
    aria-label="Unstick Simulation"
    actions={[tooltip]}
    class="touch-target-coarse text-amber-400 transition-colors hover:bg-transparent! hover:text-amber-300!"
  >
    <svg class="block size-icon-medium" viewBox="0 0 24 24">
      <path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
    </svg>
  </Button>
{:else}
  <Button
    variant="invisible"
    onclick={handle_send}
    disabled={!value.trim() || send_blocked}
    aria-label="Send Message"
    actions={[stab, tooltip]}
    class="touch-target-coarse"
  >
    <svg class="block size-icon-medium" viewBox="0 0 24 24">
      <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  </Button>
{/if}
