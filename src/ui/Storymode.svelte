<script module>
  /**
   * @file src/ui/Storymode.svelte
   * 📖 THE STORYMODE STAGE
   * Master story transcript stage unifying the continuous message feed,
   * markdown/dialogue rendering pipeline, streaming typewriter follow,
   * soft-delete undo timers, and contextual storymode action dispatches.
   */
  import { render_optics_fallback } from "@simulation";
  import { get_mock_message, refine_image_prompt } from "@engine";
  import { app, execution, session } from "@state";
  import { open_image_preview, run_image_regeneration } from "./ImagePreview.svelte.js";
  import { Audio, visual_engine } from "@media";

  // --- STORYMODE SHARED STATE ---
  class StorymodeState {
    /** @type {string | number | null} */
    pinned_message_id = $state(null);
  }
  export const storymode_state = new StorymodeState();

  // --- STORYMODE ACTION DISPATCHERS ---

  /**
   * Portrait generation helper - logs a placeholder message immediately, then fills in the image.
   * @param {string} subject
   * @param {string} prompt
   * @param {string} [kind]
   * @param {any} [target_entity]
   */
  export async function take_photo(subject, prompt, kind, target_entity = null) {
    if (execution.busy) return;
    const entity_map = {
      ai: session.active_ai || app.selected_ai,
      user: session.active_user || app.selected_user,
      fractal: session.active_fractal || app.selected_fractal,
    };
    const label_map = { ai: "AI", user: "User", fractal: "Fractal", npc: "NPC" };
    const turn_map = { ai: "AI_TURN", user: "USER_TURN", fractal: "SYSTEM_TURN", npc: "AI_TURN" };
    const entity = target_entity || entity_map[subject];
    const role_label = entity?.name || label_map[subject] || subject;
    const turn_type = turn_map[subject] || "AI_TURN";
    /** @type {{ id?: string|number } | null} */
    let placeholder_entry = null;
    let target_mode = "";
    try {
      execution.role = subject;
      execution.start_generation(subject);
      execution.start_media_stage({
        type: subject,
        name: role_label,
        avatar: entity?.profile_picture || entity?.avatar || null,
        color: entity?.signature_color || entity?.color || null,
      });

      target_mode = kind || (subject === "fractal" ? "story_scene" : "story_character");

      let refined_prompt = prompt;
      let enhanced_negative = "";
      try {
        const configured_style = app.settings?.visual_style;
        const story_style = session.active_fractal?.visual_style;
        const app_style = configured_style && configured_style !== "none" && configured_style !== "default" ? configured_style : story_style || null;
        const enhanced = await refine_image_prompt(prompt, subject, entity, app_style);
        if (enhanced?.prompt) {
          refined_prompt = enhanced.prompt;
        }
        if (enhanced?.negative_prompt) {
          enhanced_negative = enhanced.negative_prompt;
        }
      } catch (envision_err) {
        console.warn("[take_photo] Envision failed, falling back to draft prompt:", envision_err);
      }

      placeholder_entry = await session.log_message("", subject, role_label, {
        turn_type,
        attachments: [{ src: null, metadata: { mode: target_mode, prompt: refined_prompt } }],
      });

      const result = await visual_engine.visualize(refined_prompt, kind, { subject, entity, negative_prompt: enhanced_negative }, { app, session });

      if (result?.image_url && placeholder_entry?.id) {
        await session.update_log_attachment(placeholder_entry.id, 0, {
          src: result.image_url,
          metadata: { mode: target_mode, ...result.metadata, prompt: result.refined_prompt },
        });
      } else if (!result?.image_url) {
        await session.update_log_attachment(placeholder_entry.id, 0, {
          src: null,
          metadata: { mode: target_mode, prompt, failed: true, error: "Image generation returned no image" },
        });
        console.error(`${role_label} image generation failed. Please try again.`);
      }
    } catch (err) {
      console.error(`[Photo Error: ${subject}]`, err);
      if (placeholder_entry?.id) {
        await session.update_log_attachment(placeholder_entry.id, 0, {
          src: null,
          metadata: { mode: target_mode, prompt, failed: true, error: err?.message || "Image generation failed" },
        });
      }
    } finally {
      execution.complete();
    }
  }

  /**
   * Group shot helper - logs placeholder immediately, then fills in the image.
   */
  export async function take_group_photo() {
    if (execution.busy) return;
    /** @type {{ id?: string|number } | null} */
    let placeholder_entry = null;
    try {
      execution.role = "fractal";
      execution.start_generation("fractal");
      const fractal = session.active_fractal || app.selected_fractal;
      execution.start_media_stage({
        type: "fractal",
        name: fractal?.name || "Scene",
        avatar: fractal?.profile_picture || fractal?.avatar || null,
        color: fractal?.signature_color || fractal?.color || null,
      });
      const group_prompt = "A scene featuring both the AI character and the user persona together";

      placeholder_entry = await session.log_message("", "fractal", fractal?.name || "Scene", {
        turn_type: "SYSTEM_TURN",
        attachments: [{ src: null, metadata: { mode: "story_entities", prompt: group_prompt } }],
      });

      const result = await visual_engine.visualize(group_prompt, "story_entities", {}, { app, session });

      if (result?.image_url && placeholder_entry?.id) {
        await session.update_log_attachment(placeholder_entry.id, 0, {
          src: result.image_url,
          metadata: { ...result.metadata, prompt: result.refined_prompt },
        });
      } else if (!result?.image_url) {
        await session.update_log_attachment(placeholder_entry.id, 0, {
          src: null,
          metadata: { mode: "story_entities", prompt: group_prompt, failed: true, error: "Image generation returned no image" },
        });
        console.error("Story Image generation failed. Please try again.");
      }
    } catch (err) {
      console.error("[Story Image Error]", err);
      if (placeholder_entry?.id) {
        await session.update_log_attachment(placeholder_entry.id, 0, {
          src: null,
          metadata: { mode: "story_entities", failed: true, error: err?.message || "Image generation failed" },
        });
      }
    } finally {
      execution.complete();
    }
  }

  /**
   * Regenerate orchestration - generates 3 candidates in the background.
   * @param {{ prompt: string, negative_prompt?: string, mode?: string, log_id?: string|number, attach_idx?: number, signature_color?: string, regenerate_count?: number }} ctx
   */
  export async function regenerate_image(ctx) {
    const { prompt, negative_prompt, mode = "story_character", log_id, attach_idx = 0, signature_color, regenerate_count = 0 } = ctx;
    const key = `${log_id}:${attach_idx}`;

    await run_image_regeneration({
      key,
      prompt,
      negative_prompt,
      mode,
      signature_color,
      regenerate_count,
      refine_prompt: refine_image_prompt,
      on_select: (candidate) => {
        if (log_id) {
          session.update_log_attachment(log_id, attach_idx, {
            src: candidate.url,
            metadata: { ...candidate.metadata, regenerate_count: regenerate_count + 1 },
          });
        }
      },
    });
  }

  /**
   * Ghostwriter trigger - fires a signal the Console watches.
   */
  export function ghostwrite() {
    if (execution.busy) return;
    app.ghostwrite_request++;
  }

  /**
   * Mock message - streams a placeholder message for the given entity role (devmode only).
   * @param {string} role
   */
  export async function run_mock(role) {
    if (execution.busy) return;
    const entity_map = {
      ai: session.active_ai || app.selected_ai,
      user: session.active_user || app.selected_user,
      fractal: session.active_fractal || app.selected_fractal,
    };
    const label_map = { ai: "AI", user: "User", fractal: "Fractal" };
    const turn_map = { ai: "AI_TURN", user: "USER_TURN", fractal: "SYSTEM_TURN" };
    const entity = entity_map[role];
    const content = get_mock_message();

    execution.start_generation(role);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      execution.start_stream("mock-node", role);

      let buffer = "";
      const words = content.split(" ");
      for (let i = 0; i < words.length; i++) {
        buffer += (i === 0 ? "" : " ") + words[i];
        execution.stream.content = buffer;
        await new Promise((resolve) => setTimeout(resolve, 60));
      }

      await session.log_message(content, role, entity?.name || label_map[role], { turn_type: turn_map[role] });
    } finally {
      execution.complete();
      execution.end_stream();
    }
  }
</script>

<script>
  import { chrono_engine } from "@engine";
  import { clear_card_location, item_in, motion, update_card_scrub } from "@media";
  import { Button, Dialog, ScrollArea, Shimmer } from "@primitives";
  import { onDestroy, tick } from "svelte";
  import ChatBubble from "./ChatBubble.svelte";
  import UndoToast from "./UndoToast.svelte";

  // --- CONTEXT MENU BUILDERS ---
  function build_storymode_actions(type) {
    const in_dev = app.settings.dev_mode;
    const entity_map = {
      ai: app.selected_ai || session.active_ai,
      user: app.selected_user || session.active_user,
      fractal: app.selected_fractal || session.active_fractal,
    };
    const entity = entity_map[type];

    const photo_label =
      type === "ai" ? "Generate AI Character Image"
      : type === "user" ? "Generate User Persona Image"
      : "Generate Fractal Image";
    const tier = type === "fractal" ? "story_scene" : "story_character";
    const raw_fallback = render_optics_fallback({ tier, subject: type, ai: entity_map.ai, user: entity_map.user, fractal: entity_map.fractal });
    const photo_prompt = raw_fallback.replace(/<\/?image_prompt>/g, "").trim();

    const items = [{ label: "Profile", onSelect: () => app.toggle_profile(true, entity, type), disabled: !entity }];

    if (entity?.profile_picture) {
      items.push({
        label: "Profile Picture",
        onSelect: () =>
          open_image_preview({
            src: entity.profile_picture,
            metadata:
              entity.modifiers ?
                { prompt: entity.modifiers.prompt, negative_prompt: entity.modifiers.negative_prompt, seed: entity.modifiers.last_generated_seed }
              : null,
          }),
      });
    }

    if (type === "ai" || type === "fractal") {
      const voice_role = type === "fractal" ? "fractal" : "ai";
      const voice_noun = type === "fractal" ? "Fractal Voice" : "AI Voice";
      const voice_label = Audio.is_role_enabled(voice_role) ? `Disable ${voice_noun}` : `Enable ${voice_noun}`;
      items.push({ label: voice_label, active: Audio.is_role_enabled(voice_role), onSelect: () => Audio.toggle_entity_voice(voice_role) });
    }

    items.push({ separator: true });
    items.push({
      label: photo_label,
      onSelect: () => take_photo(type, photo_prompt, type === "fractal" ? "story_scene" : "story_character"),
      disabled: execution.busy,
    });
    if (type === "fractal") {
      items.push({ label: "Generate Story Image", onSelect: () => take_group_photo(), disabled: execution.busy });
    }
    if (type === "user") {
      items.push({
        label: app.settings.call_mode ? "Disable Microphone" : "Enable Microphone",
        active: app.settings.call_mode,
        onSelect: () => {
          app.settings.call_mode = !app.settings.call_mode;
          app.save_settings();
        },
      });
      items.push({ separator: true });
      items.push({ label: "Ghostwrite", onSelect: () => ghostwrite(), disabled: execution.busy });
    }

    if (in_dev) {
      items.push({ separator: true }, { label: "Mock Message", onSelect: () => run_mock(type), disabled: execution.busy });
    }

    return items;
  }

  let card_actions = $derived({ ai: build_storymode_actions("ai"), user: build_storymode_actions("user"), fractal: build_storymode_actions("fractal") });

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

{#snippet card_skeleton()}
  <div class="relative isolate h-full min-h-50 w-full overflow-hidden rounded-xl border border-solid border-white/10 bg-zinc-900/40 backdrop-blur-sm">
    <Shimmer color="rgba(255, 255, 255, 0.4)" />
  </div>
{/snippet}

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
      {@render card_skeleton()}
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
                  is_pinned={storymode_state.pinned_message_id != null && String(storymode_state.pinned_message_id) === String(entry.id)}
                  on_toggle_pin={() => {
                    storymode_state.pinned_message_id = storymode_state.pinned_message_id === entry.id ? null : entry.id;
                  }}
                  on_take_photo={take_photo}
                  on_regenerate_image={regenerate_image}
                  {card_actions} />
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
