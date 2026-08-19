<script>
  import { onDestroy, tick } from "svelte";
  import { ScrollArea, Button } from "@primitives";
  import { Dialog } from "@primitives";
  import Message from "./Message.svelte";
  import UndoToast from "./UndoToast.svelte";
  import { Audio } from "@media/audio.svelte.js";
  import { chrono_engine } from "@state";
  import { app, simulation_state, simulation_log } from "@state";
  import { motion, item_in, update_card_scrub, clear_card_location } from "@motion";

  /**
   * @typedef {Object} Props
   * @property {any[]} visible_feed
   * @property {any} card_actions
   */
  /** @type {Props} */
  let { visible_feed = [], card_actions } = $props();

  let scroll_ref = $state(null);
  let user_scrolled_up = $state(true);
  const AUTO_SCROLL_SLACK = 40;
  let scrub_raf = 0;

  function schedule_scrub() {
    if (scrub_raf) return;
    scrub_raf = requestAnimationFrame(() => {
      scrub_raf = 0;
      update_card_scrub({ pending: app.begin_story_pending });
    });
  }

  $effect(() => {
    if (!scroll_ref) return;
    const el = scroll_ref.querySelector(".scroll-area-viewport");
    if (!el) return;
    let last_scroll_top = el.scrollTop;

    const handle_scroll = () => {
      const now_top = el.scrollTop;
      const moving_up = now_top < last_scroll_top - 1;
      last_scroll_top = now_top;
      const distance_to_bottom = el.scrollHeight - now_top - el.clientHeight;
      if (moving_up) {
        user_scrolled_up = true;
      } else if (distance_to_bottom <= AUTO_SCROLL_SLACK) {
        user_scrolled_up = false;
      }
      schedule_scrub();
    };

    el.addEventListener("scroll", handle_scroll, { passive: true });
    return () => el.removeEventListener("scroll", handle_scroll);
  });

  // SCROLL-ANYWHERE: forward the mouse wheel to the feed viewport when the
  // cursor sits outside the feed (over the character/fractal cards, gutters,
  // etc.) so the invisible feed boundary doesn't trap the wheel. Native
  // scrolling is left untouched when the target is already inside any
  // scrollable region (feed, console accordions, dropdowns, modals, inputs).
  $effect(() => {
    if (!scroll_ref) return;
    const vp = scroll_ref.querySelector(".scroll-area-viewport");
    if (!vp) return;

    const is_inside_scrollable = (node) => {
      let el = node;
      while (el instanceof Element && el !== document.documentElement) {
        if (el.classList.contains("scroll-area-viewport")) return true;
        const tag = el.tagName;
        if (tag === "TEXTAREA" || tag === "SELECT" || tag === "INPUT") return true;
        const cs = getComputedStyle(el);
        if ((cs.overflowY === "auto" || cs.overflowY === "scroll" || cs.overflowY === "overlay") && el.scrollHeight > el.clientHeight) return true;
        el = el.parentElement;
      }
      return false;
    };

    const on_wheel = (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (is_inside_scrollable(t)) return;
      if (t.closest("[data-modal-variant], [data-backdrop], .dropdown-portal-wrapper, [data-dropdown-menu], .menu, .tooltip-portal")) return;
      if (e.deltaY === 0) return;
      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 16;
      else if (e.deltaMode === 2) dy *= vp.clientHeight;
      vp.scrollTop += dy;
    };

    window.addEventListener("wheel", on_wheel, { passive: true });
    return () => window.removeEventListener("wheel", on_wheel);
  });

  let last_feed_length = $state(0);

  $effect(() => {
    const _is_active = app.streaming.active;
    const _pending = app.begin_story_pending;
    const current_len = visible_feed.length;

    if (!scroll_ref) return;
    const el = scroll_ref.querySelector(".scroll-area-viewport");
    if (!el) return;

    if (_pending) {
      last_feed_length = current_len;
      user_scrolled_up = true;
      return;
    }

    let follow_raf = 0;
    const ease_follow = () => {
      follow_raf = 0;
      if (user_scrolled_up) return;
      const target = el.scrollHeight - el.clientHeight;
      const diff = target - el.scrollTop;
      if (Math.abs(diff) < 0.5) return;
      if (motion.is_reduced) {
        el.scrollTop = target;
        return;
      }
      el.scrollTop += diff * 0.25;
      follow_raf = requestAnimationFrame(ease_follow);
    };
    const start_follow = () => {
      if (user_scrolled_up || follow_raf) return;
      follow_raf = requestAnimationFrame(ease_follow);
    };

    if (current_len > last_feed_length) {
      if (!user_scrolled_up) tick().then(start_follow);
    }
    last_feed_length = current_len;

    if (!user_scrolled_up) {
      tick().then(start_follow);
    }

    const observer = new MutationObserver(() => start_follow());
    observer.observe(el, { childList: true, subtree: true, characterData: true });
    el.addEventListener("load", start_follow, true);
    return () => {
      observer.disconnect();
      el.removeEventListener("load", start_follow, true);
      if (follow_raf) cancelAnimationFrame(follow_raf);
    };
  });

  $effect(() => {
    const _pending = app.begin_story_pending;
    const _len = visible_feed.length;
    if (scroll_ref) schedule_scrub();
  });

  $effect(() => {
    if (!scroll_ref) return;
    const vp = scroll_ref.querySelector(".scroll-area-viewport");
    if (!vp) return;
    const observer = new ResizeObserver(() => schedule_scrub());
    observer.observe(vp);
    schedule_scrub();
    return () => observer.disconnect();
  });

  onDestroy(() => {
    clear_card_location();
  });

  let editing_index = $state(null);
  let show_delete_confirm = $state(false);
  let delete_target_id = $state(null);
  const UNDO_DELETE_WINDOW_MS = 5000;
  let pending_deletes = $state({});

  async function handle_delete(index) {
    const entry = visible_feed[index];
    if (entry?.id) {
      delete_target_id = entry.id;
      show_delete_confirm = true;
    }
  }

  async function execute_delete() {
    const id = delete_target_id;
    if (id == null) return;
    delete_target_id = null;
    if (Audio.voice.active_message_id === id) {
      Audio.voice.stop();
    }
    const pending = pending_deletes[id];
    if (pending) clearTimeout(pending.timer);
    const timer = setTimeout(async () => {
      const copy = { ...pending_deletes };
      delete copy[id];
      pending_deletes = copy;
      await simulation_log.delete_entry(String(id));
    }, UNDO_DELETE_WINDOW_MS);
    pending_deletes = {
      ...pending_deletes,
      [id]: { timer, expires_at: Date.now() + UNDO_DELETE_WINDOW_MS },
    };
  }

  function undo_delete(id) {
    const pending = pending_deletes[id];
    if (pending) {
      clearTimeout(pending.timer);
      const copy = { ...pending_deletes };
      delete copy[id];
      pending_deletes = copy;
    }
  }

  function handle_edit(index) {
    editing_index = index;
  }

  async function handle_save_edit(id, updated_text) {
    await simulation_log.edit_entry(id.toString(), updated_text);
    editing_index = null;
  }

  function map_role(role) {
    if (role === "ai" || role === "user" || role === "fractal" || role === "system" || role === "npc") return role;
    return "ai";
  }
</script>

<Dialog
  type="confirm"
  bind:open={show_delete_confirm}
  title="Delete Entry?"
  message="Delete this log entry? It will be removed in 5 seconds unless you undo."
  confirm_label="Delete"
  on_confirm={execute_delete}
/>

<div class="flex min-h-80 w-full flex-1 flex-col gap-0 overflow-hidden px-0" bind:this={scroll_ref}>
  <ScrollArea data-id="storymode-scroll-area" style="height: 100%; width: 100%;">
    {#each visible_feed as entry, index (entry.id)}
      {#if pending_deletes[entry.id]}
        <div
          class="
            relative
            flex
            w-full
            p-4
            transition-all
            duration-200
            {entry.role === 'user' ? 'justify-end pr-column-unit' : 'justify-start pl-column-unit'}
          "
          in:item_in={{ duration: 200 }}
        >
          <div class="w-[calc(var(--spacing-column-unit)*5)]">
            <UndoToast undo_window_ms={UNDO_DELETE_WINDOW_MS} on_undo={() => undo_delete(entry.id)} />
          </div>
        </div>
      {:else}
        <div
          class="w-full shrink-0 {entry.meta?.is_prologue ? 'message--prologue' : ''}"
          class:prologue-awaiting-flight={entry.meta?.is_prologue && app.begin_story_pending && !motion.is_reduced}
          in:item_in={{ duration: entry.meta?.is_prologue ? 0 : 300 }}
        >
          <Message
            id={entry.id}
            text={entry.text}
            sender={map_role(entry.role)}
            character_name={entry.character_name ||
              (map_role(entry.role) === "ai" ? app.selected_ai?.name : map_role(entry.role) === "system" ? "SYSTEM" : "")}
            timestamp={entry.created_at ? new Date(entry.created_at) : new Date()}
            attachments={entry.attachments}
            is_last={index === visible_feed.length - 1}
            on_delete={() => handle_delete(index)}
            on_regenerate={() => chrono_engine.retry()}
            on_continue={() => chrono_engine.continue()}
            on_edit={() => handle_edit(index)}
            is_editing={index === editing_index}
            on_save={(new_text) => entry.id && handle_save_edit(entry.id, new_text)}
            on_cancel={() => {
              editing_index = null;
            }}
            meta={entry.meta}
            busy={entry.busy}
            {card_actions}
          />
        </div>
      {/if}
    {/each}

    {#if visible_feed.length === 0}
      <div
        class="flex h-full flex-col items-center justify-center gap-4 p-4 text-center text-slate-600 [&>p]:max-w-[calc(var(--spacing-column-unit)*8)]"
      >
        <p>Establishing context stream... If the screen remains black, please check your network or AI plugin settings.</p>
        <Button variant="primary" onclick={() => chrono_engine.retry()} disabled={simulation_state.busy} label="Retry Connection" />
      </div>
    {/if}
    <!-- SPACER for Console overlap -->
    <div class="h-[calc(var(--spacing-row-unit)*2)] w-full shrink-0"></div>
  </ScrollArea>
</div>

<style>
  :global([data-id="storymode-scroll-area"]) {
    overflow-x: visible !important;
  }

  :global([data-id="storymode-scroll-area"] > [data-orientation="vertical"]) {
    position: fixed !important;
    right: 0 !important;
    top: 0 !important;
    bottom: 0 !important;
    height: 100dvh !important;
  }

  /* Prologue entrance: the message fades in as the storyboard cards fly into
     it (the awaiting class is dropped once the begin-flight starts). */
  .message--prologue {
    transition: opacity 650ms ease;
  }

  .message--prologue.prologue-awaiting-flight {
    opacity: 0;
  }
</style>
