<script>
  import { chrono_engine } from "@engine";
  import { clear_card_location, item_in, motion, update_card_scrub } from "@media";
  import { Button, ScrollArea } from "@atoms";
  import { CardSkeleton, Dialog, UndoToast } from "@molecules";
  import { ChatBubble, DevBubble, ImageBubble } from "@organisms";
  import { app, execution, session } from "@state";
  import { onDestroy, tick } from "svelte";

  // --- STORYMODE FEED HELPERS ---
  const TELEMETRY_TYPES = new Set(["DYNAMICS_DELTA", "STORY_START", "VECTOR_RESOLUTION", "CONTINUUM_FORMATION", "MEMORY_FORMATION"]);

  function is_telemetry(entry) {
    return Boolean(entry?.meta?.type && TELEMETRY_TYPES.has(entry.meta.type));
  }

  function is_image_only(entry) {
    const has_attachments = Array.isArray(entry?.attachments) && entry.attachments.length > 0;
    const has_text = typeof entry?.text === "string" && entry.text.trim().length > 0;
    return has_attachments && !has_text;
  }

  // --- STORYMODE PINNED MESSAGE STATE ---
  let pinned_message_id = $state(null);

  // --- FEED ACTIVE TURN ORCHESTRATION ---
  let is_active_turn = $derived(execution.phase === "generating" || execution.stream.active);
  let active_turn_role = $derived.by(() => {
    if (execution.stream.active) return execution.stream.role;
    if (execution.phase === "generating") {
      if (
        execution.role === "selfie" ||
        execution.role === "character" ||
        execution.role === "characters" ||
        execution.role === "setting" ||
        execution.role === "paparazzi" ||
        execution.role === "story_entities" ||
        execution.role === "story_character" ||
        execution.role === "solo_entity" ||
        execution.role === "story_scene"
      )
        return "ai";
      return execution.role ?? "ai";
    }
    return execution.role;
  });

  let active_turn_name = $derived.by(() => {
    if (execution.generating_entity?.name) return execution.generating_entity.name;
    if (active_turn_role === "ai") return app.selected_ai?.name;
    if (active_turn_role === "fractal") return app.selected_fractal?.name;
    return "";
  });

  let visible_feed = $derived.by(() => {
    let list = [...session.feed];
    if (!app.settings.dev_mode) {
      list = list.filter((entry) => entry.role !== "system");
    }

    list = list.filter((entry) => {
      if (entry.busy) return true;
      if (entry.role === "system") return true;
      if (entry.attachments && entry.attachments.length > 0) return true;
      if (entry.meta?.is_prologue || entry.meta?.is_epilogue) return true;
      if (
        entry.meta?.type === "DYNAMICS_DELTA" ||
        entry.meta?.type === "STORY_START" ||
        entry.meta?.type === "VECTOR_RESOLUTION" ||
        entry.meta?.type === "CONTINUUM_FORMATION" ||
        entry.meta?.type === "MEMORY_FORMATION"
      )
        return true;
      const text = typeof entry.text === "string" ? entry.text.trim() : "";
      return text.length > 0;
    });

    if (is_active_turn && execution.stream.active) {
      const active_id = execution.stream.node_id ?? "temp";
      const stream_role = execution.generating_entity?.type ?? active_turn_role ?? "ai";
      if (stream_role !== "system" && !list.some((entry) => entry.id === active_id)) {
        list.push({
          id: active_id,
          text: execution.stream.content ?? "",
          role: stream_role,
          character_name: active_turn_name ?? "",
          created_at: Date.now(),
          busy: true,
          meta: { is_prologue: execution.stream.role === "fractal" },
        });
      }
    }
    return list;
  });

  // --- SCROLLING & VIEWPORT INTEGRATION ---
  let scroll_ref = $state(null);
  let user_scrolled_up = $state(false);
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

  // SCROLL-ANYWHERE: forward mouse wheel to feed viewport
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
      if (t.closest("[data-modal-layer], [data-dropdown-menu], [role='menu'], [data-tooltip-preview], .dropdown-portal-wrapper, .menu, .tooltip-portal"))
        return;
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

  function snap_to_bottom() {
    const el = scroll_ref?.querySelector(".scroll-area-viewport");
    if (!el) return;
    el.scrollTop = el.scrollHeight - el.clientHeight;
  }

  function should_follow() {
    if (app.settings.auto_scroll === false) return false;
    return !user_scrolled_up;
  }

  $effect(() => {
    if (scroll_ref) tick().then(snap_to_bottom);
  });

  $effect(() => {
    if (app.settings.auto_scroll && scroll_ref) tick().then(snap_to_bottom);
  });

  $effect(() => {
    const _is_active = execution.stream.active;
    const _stream_len = _is_active ? String(execution.stream.content ?? "").length : 0;
    const _pending = app.begin_story_pending;
    const current_len = visible_feed.length;

    if (!scroll_ref) return;
    const el = scroll_ref.querySelector(".scroll-area-viewport");
    if (!el) return;

    if (_pending) {
      last_feed_length = current_len;
      tick().then(snap_to_bottom);
      return;
    }

    let follow_raf = 0;
    const ease_follow = () => {
      follow_raf = 0;
      if (!should_follow()) return;
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
      if (!should_follow() || follow_raf) return;
      follow_raf = requestAnimationFrame(ease_follow);
    };

    if (current_len > last_feed_length) {
      tick().then(start_follow);
    }
    last_feed_length = current_len;

    tick().then(start_follow);

    if (_stream_len > 0) tick().then(start_follow);

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

  // --- DELETE & EDIT OPERATIONS ---
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
      await session.delete_entry(String(id));
    }, UNDO_DELETE_WINDOW_MS);
    pending_deletes = { ...pending_deletes, [id]: { timer, expires_at: Date.now() + UNDO_DELETE_WINDOW_MS } };
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
    await session.edit_entry(id.toString(), updated_text);
    editing_index = null;
  }

  function map_role(role) {
    if (role === "ai" || role === "user" || role === "fractal" || role === "system" || role === "npc") return role;
    return "ai";
  }

  let stage_class = $derived(
    app.viewport.mobile ?
      "inset-auto col-span-full row-3 h-full items-center overflow-hidden"
    : "col-start-2 col-end-12 row-start-1 row-end-13 h-full items-center",
  );
</script>

<Dialog
  type="confirm"
  bind:open={show_delete_confirm}
  title="Delete Entry?"
  message="Delete this log entry? It will be removed in 5 seconds unless you undo."
  confirm_label="Delete"
  on_confirm={execute_delete} />

<!-- display:flex inline: unlayered normalize.css v3 resets section to block, defeating Tailwind's layered flex utility -->
<section style="display: flex;" class="relative z-10 flex min-h-0 flex-col justify-center {stage_class}">
  <div class="relative flex h-full w-full flex-col overflow-hidden">
    {#if !app.entities_loaded}
      <CardSkeleton />
    {:else}
      <div class="flex min-h-80 w-full flex-1 flex-col gap-0 overflow-hidden px-0" bind:this={scroll_ref}>
        <ScrollArea data-id="storymode-scroll-area" style="height: 100%; width: 100%;">
          {#each visible_feed as entry, index (entry.id)}
            {#if pending_deletes[entry.id]}
              <div
                class="
              relative
              flex
              w-full
              p-standard
              transition
              duration-200
              {entry.role === 'user' ? 'justify-end pr-column-unit' : 'justify-start pl-column-unit'}
            "
                in:item_in={{ duration: 200 }}>
                <div class="w-[calc(var(--spacing-column-unit)*5)]">
                  <UndoToast undo_window_ms={UNDO_DELETE_WINDOW_MS} on_undo={() => undo_delete(entry.id)} />
                </div>
              </div>
            {:else if is_telemetry(entry)}
              <div data-entry-id={entry.id} class="w-full shrink-0" in:item_in={{ duration: 200 }}>
                <DevBubble meta={entry.meta} timestamp={entry.created_at ? new Date(entry.created_at) : new Date()} />
              </div>
            {:else if is_image_only(entry)}
              <div data-entry-id={entry.id} class="w-full shrink-0" in:item_in={{ duration: 200 }}>
                <ImageBubble
                  id={entry.id}
                  sender={map_role(entry.role)}
                  character_name={entry.character_name || (map_role(entry.role) === "ai" ? app.selected_ai?.name : "")}
                  attachments={entry.attachments} />
              </div>
            {:else}
              <div
                data-entry-id={entry.id}
                class="w-full shrink-0 {entry.meta?.is_prologue ? 'message--prologue' : ''}"
                class:prologue-awaiting-flight={entry.meta?.is_prologue && app.begin_story_pending && !motion.is_reduced}
                in:item_in={{ duration: entry.meta?.is_prologue ? 0 : 300 }}>
                <ChatBubble
                  id={entry.id}
                  text={entry.text}
                  sender={map_role(entry.role)}
                  character_name={entry.character_name ||
                    (map_role(entry.role) === "ai" ? app.selected_ai?.name
                    : map_role(entry.role) === "system" ? "SYSTEM"
                    : "")}
                  timestamp={entry.created_at ? new Date(entry.created_at) : new Date()}
                  attachments={entry.attachments}
                  is_last={index === visible_feed.length - 1}
                  on_delete={() => handle_delete(index)}
                  on_regenerate={() => chrono_engine.retry()}
                  on_continue={() => chrono_engine.continue(entry.id)}
                  on_edit={() => handle_edit(index)}
                  is_editing={index === editing_index}
                  on_save={(new_text) => entry.id && handle_save_edit(entry.id, new_text)}
                  on_cancel={() => {
                    editing_index = null;
                  }}
                  meta={entry.meta}
                  busy={entry.busy}
                  is_pinned={pinned_message_id != null && String(pinned_message_id) === String(entry.id)}
                  on_toggle_pin={() => {
                    pinned_message_id = pinned_message_id === entry.id ? null : entry.id;
                  }} />
              </div>
            {/if}
          {/each}

          {#if visible_feed.length === 0 && !execution.busy}
            <div
              class="flex h-full flex-col items-center justify-center gap-standard p-standard text-center text-slate-600 [&>p]:max-w-[calc(var(--spacing-column-unit)*8)]">
              <p>Establishing context stream... If the screen remains black, please check your network or AI plugin settings.</p>
              <Button variant="primary" onclick={() => chrono_engine.retry()} disabled={execution.busy} label="Retry Connection" />
            </div>
          {/if}
          <!-- SPACER for Console overlap -->
          <div class="h-[calc(var(--spacing-row-unit)*2)] w-full shrink-0"></div>
        </ScrollArea>
      </div>
    {/if}
  </div>
</section>

<style>
  :global([data-id="storymode-scroll-area"]) {
    overflow-x: visible;
  }

  :global(body:has([data-id="storymode-scroll-area"]) [data-id="storymode-scroll-area"] > [data-orientation="vertical"]),
  :global([data-id="storymode-scroll-area"] > [data-orientation="vertical"]) {
    position: fixed !important;
    right: 0;
    top: 0;
    bottom: 0;
    height: 100dvh;
    z-index: var(--z-index-max);
  }
</style>
