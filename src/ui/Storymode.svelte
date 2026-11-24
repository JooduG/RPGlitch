<script>
  import { Button, ScrollArea } from "@atoms";
  import { chrono_engine } from "@engine";
  import { Audio, clear_card_location, item_in, motion, update_card_scrub } from "@media";
  import { CardSkeleton, Dialog, UndoToast } from "@molecules";
  import { ChatBubble, DevBubble, ImageBubble } from "@organisms";
  import { canonicalize_role, is_telemetry_meta } from "@simulation";
  import { app, execution, session } from "@state";
  import { onDestroy, tick } from "svelte";

  const AUTO_SCROLL_SLACK = 40;
  const UNDO_DELETE_WINDOW_MS = 5000;
  const WHEEL_IGNORE_SELECTOR =
    "[data-modal-layer], [data-dropdown-menu], [role='menu'], [data-tooltip-preview], .dropdown-portal-wrapper, .menu, .tooltip-portal";

  const is_image_only = (entry) =>
    Array.isArray(entry?.attachments) && entry.attachments.length > 0 && !(typeof entry?.text === "string" && entry.text.trim().length > 0);

  // --- FEED & MESSAGE STATE ---
  let pinned_message_id = $state(null);
  let editing_id = $state(null);
  let show_delete_confirm = $state(false);
  let delete_target_id = $state(null);
  let pending_deletes = $state({});

  const is_active_turn = $derived(execution.phase === "generating" || execution.stream.active);
  const active_turn_role = $derived(
    execution.stream.active ? execution.stream.role
    : execution.phase === "generating" ? canonicalize_role(execution.role)
    : execution.role,
  );

  const active_turn_name = $derived(
    execution.generating_entity?.name ||
      (active_turn_role === "ai" ? app.selected_ai?.name
      : active_turn_role === "fractal" ? app.selected_fractal?.name
      : ""),
  );

  const visible_feed = $derived.by(() => {
    const list = session.feed.filter((entry) => {
      if (!app.settings.dev_mode && entry.role === "system") return false;
      if (
        entry.busy ||
        entry.role === "system" ||
        entry.attachments?.length ||
        entry.meta?.is_prologue ||
        entry.meta?.is_epilogue ||
        is_telemetry_meta(entry.meta)
      ) {
        return true;
      }
      return typeof entry.text === "string" && entry.text.trim().length > 0;
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
  /** @type {HTMLElement | null} */
  let viewport_el = $state(null);
  let user_scrolled_up = $state(false);
  let scrub_raf = 0;
  let follow_raf = 0;

  function schedule_scrub() {
    if (scrub_raf) return;
    scrub_raf = requestAnimationFrame(() => {
      scrub_raf = 0;
      update_card_scrub({ pending: app.begin_story_pending });
    });
  }

  function snap_to_bottom() {
    if (viewport_el) viewport_el.scrollTop = viewport_el.scrollHeight - viewport_el.clientHeight;
  }

  function start_follow() {
    if (!viewport_el || app.settings.auto_scroll === false || user_scrolled_up || follow_raf) return;
    const ease_follow = () => {
      follow_raf = 0;
      if (!viewport_el || app.settings.auto_scroll === false || user_scrolled_up) return;
      const target = viewport_el.scrollHeight - viewport_el.clientHeight;
      const diff = target - viewport_el.scrollTop;
      if (Math.abs(diff) < 0.5) return;
      if (motion.is_reduced) {
        viewport_el.scrollTop = target;
        return;
      }
      viewport_el.scrollTop += diff * 0.25;
      follow_raf = requestAnimationFrame(ease_follow);
    };
    follow_raf = requestAnimationFrame(ease_follow);
  }

  // Viewport lifecycle observers (scroll, wheel-anywhere, resize, DOM growth) - mounted once per viewport
  $effect(() => {
    const vp = viewport_el;
    if (!vp) return;

    let last_scroll_top = vp.scrollTop;

    const on_scroll = () => {
      const now_top = vp.scrollTop;
      const moving_up = now_top < last_scroll_top - 1;
      last_scroll_top = now_top;
      if (moving_up) user_scrolled_up = true;
      else if (vp.scrollHeight - now_top - vp.clientHeight <= AUTO_SCROLL_SLACK) user_scrolled_up = false;
      schedule_scrub();
    };

    const is_inside_scrollable = (node) => {
      for (let el = node; el instanceof Element && el !== document.documentElement; el = el.parentElement) {
        if (el.classList.contains("scroll-area-viewport")) return true;
        if (el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.tagName === "INPUT") return true;
        const { overflowY } = getComputedStyle(el);
        if ((overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") && el.scrollHeight > el.clientHeight) return true;
      }
      return false;
    };

    const on_wheel = (e) => {
      if (!(e.target instanceof Element) || e.deltaY === 0) return;
      if (is_inside_scrollable(e.target) || e.target.closest(WHEEL_IGNORE_SELECTOR)) return;
      const dy =
        e.deltaMode === 1 ? e.deltaY * 16
        : e.deltaMode === 2 ? e.deltaY * vp.clientHeight
        : e.deltaY;
      vp.scrollTop += dy;
    };

    const ro = new ResizeObserver(schedule_scrub);
    const mo = new MutationObserver(start_follow);

    vp.addEventListener("scroll", on_scroll, { passive: true });
    vp.addEventListener("load", start_follow, true);
    window.addEventListener("wheel", on_wheel, { passive: true });
    ro.observe(vp);
    mo.observe(vp, { childList: true, subtree: true, characterData: true });

    tick().then(snap_to_bottom);
    schedule_scrub();

    return () => {
      vp.removeEventListener("scroll", on_scroll);
      vp.removeEventListener("load", start_follow, true);
      window.removeEventListener("wheel", on_wheel);
      ro.disconnect();
      mo.disconnect();
      if (follow_raf) {
        cancelAnimationFrame(follow_raf);
        follow_raf = 0;
      }
    };
  });

  // Lightweight reactive scroll triggers (never recreates observers)
  $effect(() => {
    if (app.settings.auto_scroll && viewport_el) tick().then(snap_to_bottom);
  });

  $effect(() => {
    void visible_feed.length;
    void execution.stream.active;
    void execution.stream.content;
    const pending = app.begin_story_pending;
    if (!viewport_el) return;
    tick().then(pending ? snap_to_bottom : start_follow);
    schedule_scrub();
  });

  onDestroy(() => {
    if (scrub_raf) cancelAnimationFrame(scrub_raf);
    if (follow_raf) cancelAnimationFrame(follow_raf);
    clear_card_location();
  });

  // --- DELETE & EDIT OPERATIONS ---
  function request_delete(id) {
    if (!id) return;
    delete_target_id = id;
    show_delete_confirm = true;
  }

  function execute_delete() {
    const id = delete_target_id;
    if (id == null) return;
    delete_target_id = null;

    if (Audio?.voice?.active_message_id === id) Audio.voice.stop();
    if (pending_deletes[id]) clearTimeout(pending_deletes[id].timer);

    const timer = setTimeout(async () => {
      const { [id]: _, ...rest } = pending_deletes;
      pending_deletes = rest;
      await session.delete_entry(String(id));
    }, UNDO_DELETE_WINDOW_MS);

    pending_deletes = { ...pending_deletes, [id]: { timer, expires_at: Date.now() + UNDO_DELETE_WINDOW_MS } };
  }

  function undo_delete(id) {
    const pending = pending_deletes[id];
    if (!pending) return;
    clearTimeout(pending.timer);
    const { [id]: _, ...rest } = pending_deletes;
    pending_deletes = rest;
  }

  async function handle_save_edit(id, updated_text) {
    await session.edit_entry(String(id), updated_text);
    editing_id = null;
  }

  function resolve_sender_name(entry, role) {
    if (entry.character_name) return entry.character_name;
    if (role === "ai") return app.selected_ai?.name || "";
    if (role === "system") return "SYSTEM";
    return "";
  }
</script>

<Dialog
  type="confirm"
  bind:open={show_delete_confirm}
  title="Delete Entry?"
  message="Delete this log entry? It will be removed in 5 seconds unless you undo."
  confirm_label="Delete"
  on_confirm={execute_delete} />

<div
  role="region"
  aria-label="Story feed"
  class={[
    "relative z-10 flex h-full min-h-0 flex-col justify-center overflow-hidden",
    app.viewport.mobile ? "inset-auto col-span-full row-3 items-center" : "col-start-2 col-end-12 row-start-1 row-end-13 items-center",
  ]}>
  {#if !app.entities_loaded}
    <CardSkeleton />
  {:else}
    <ScrollArea data-id="storymode-scroll-area" bind:viewport_ref={viewport_el} fixed_scrollbar allow_overflow_x class="h-full min-h-80 w-full flex-1">
      {#each visible_feed as entry, index (entry.id)}
        {@const role = canonicalize_role(entry.role)}
        {@const timestamp = entry.created_at ? new Date(entry.created_at) : new Date()}
        {#if pending_deletes[entry.id]}
          <div
            class={[
              "relative flex w-full p-standard transition duration-200",
              entry.role === "user" ? "justify-end pr-column-unit" : "justify-start pl-column-unit",
            ]}
            in:item_in={{ duration: 200 }}>
            <div class="w-[calc(var(--spacing-column-unit)*5)]">
              <UndoToast undo_window_ms={UNDO_DELETE_WINDOW_MS} on_undo={() => undo_delete(entry.id)} />
            </div>
          </div>
        {:else if is_telemetry_meta(entry.meta)}
          <div data-entry-id={entry.id} class="w-full shrink-0" in:item_in={{ duration: 200 }}>
            <DevBubble meta={entry.meta} {timestamp} />
          </div>
        {:else if is_image_only(entry)}
          <div data-entry-id={entry.id} class="w-full shrink-0" in:item_in={{ duration: 200 }}>
            <ImageBubble id={entry.id} sender={role} character_name={resolve_sender_name(entry, role)} attachments={entry.attachments} />
          </div>
        {:else}
          <div
            data-entry-id={entry.id}
            class={["w-full shrink-0", entry.meta?.is_prologue && "message--prologue"]}
            class:prologue-awaiting-flight={entry.meta?.is_prologue && app.begin_story_pending && !motion.is_reduced}
            in:item_in={{ duration: entry.meta?.is_prologue ? 0 : 300 }}>
            <ChatBubble
              id={entry.id}
              text={entry.text}
              sender={role}
              character_name={resolve_sender_name(entry, role)}
              {timestamp}
              attachments={entry.attachments}
              is_last={index === visible_feed.length - 1}
              on_delete={() => request_delete(entry.id)}
              on_regenerate={() => chrono_engine.retry()}
              on_continue={() => chrono_engine.continue(entry.id)}
              on_edit={() => (editing_id = entry.id)}
              is_editing={editing_id != null && String(editing_id) === String(entry.id)}
              on_save={(new_text) => entry.id && handle_save_edit(entry.id, new_text)}
              on_cancel={() => (editing_id = null)}
              meta={entry.meta}
              busy={entry.busy}
              is_pinned={pinned_message_id != null && String(pinned_message_id) === String(entry.id)}
              on_toggle_pin={() => {
                const key = String(entry.id);
                pinned_message_id = pinned_message_id === key ? null : key;
              }} />
          </div>
        {/if}
      {/each}

      {#if visible_feed.length === 0 && !execution.busy}
        <div
          class="flex h-full flex-col items-center justify-center gap-standard p-standard text-center text-slate-600 [&>p]:max-w-[calc(var(--spacing-column-unit)*8)]">
          <p>Establishing context stream... If the screen remains black, please check your network or AI plugin settings.</p>
          <Button variant="primary" onclick={() => chrono_engine.retry()} label="Retry Connection" />
        </div>
      {/if}

      <!-- Spacer for Console overlap -->
      <div class="h-[calc(var(--spacing-row-unit)*2)] w-full shrink-0"></div>
    </ScrollArea>
  {/if}
</div>
