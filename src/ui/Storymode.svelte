<script module>
  /**
   * @file src/ui/Storymode.svelte
   * 📖 THE STORYMODE STAGE
   * Master story transcript stage unifying the continuous message feed,
   * markdown/dialogue rendering pipeline, streaming typewriter follow,
   * soft-delete undo timers, and contextual storymode action dispatches.
   */
  import MarkdownIt from "markdown-it";
  import { clean_image_prompts, parse_think_block, filter_epistemic_brackets, strip_covert_directives, session_driver } from "@data";
  import { detox_prose } from "@utils";
  import { runtime, simulation_state, get_mock_message } from "@engine";
  import { sanitize } from "@utils";
  import { Audio, render_optics_fallback, visual_engine } from "@media";
  import { run_image_regeneration, ProfilePicture } from "@ui";
  import { app } from "./interface.svelte.js";

  // --- STORYMODE SHARED STATE ---
  class StorymodeState {
    /** @type {string | number | null} */
    pinned_message_id = $state(null);
  }
  export const storymode_state = new StorymodeState();

  // --- MESSAGE RENDERING PIPELINE ---
  const markdown = new MarkdownIt({
    html: false,
    breaks: true,
    linkify: true,
  });

  /**
   * Stateful parser to wrap text inside double quotes with a `<span class="dialogue">` tag.
   * @param {string} html
   * @returns {string}
   */
  export function wrap_dialogue(html) {
    if (!html) return "";
    const parts = html.split(/(<[^>]+>)/);
    let in_quote = false;

    for (let i = 0; i < parts.length; i++) {
      if (parts[i].startsWith("<")) {
        continue;
      }

      const text = parts[i].replace(/&quot;/g, '"');
      let new_text = "";
      let last_index = 0;

      for (let j = 0; j < text.length; j++) {
        if (text[j] === '"') {
          new_text += text.substring(last_index, j);
          if (!in_quote) {
            new_text += '<span class="dialogue">&ldquo;';
            in_quote = true;
          } else {
            new_text += "&rdquo;</span>";
            in_quote = false;
          }
          last_index = j + 1;
        }
      }
      new_text += text.substring(last_index);
      parts[i] = new_text;
    }

    let result = parts.join("");
    if (in_quote) {
      result += "</span>";
    }
    return result;
  }

  /**
   * Master parser that runs image prompt stripping, think block extraction,
   * cliché detox, markdown rendering, sanitization, and dialogue quote wrapping.
   * @param {string|null|undefined} rawText
   * @param {"plain"|"ornate"|"raw"|"clinical"} [register="plain"]
   * @returns {{ displayText: string, think: string|null, detoxedText: string }}
   */
  export function parse_message(rawText, register = "plain") {
    // 1. Remove Image Prompts (Artifacts)
    let text = clean_image_prompts(rawText || "");

    // 2. Extract Think Block
    const think_result = parse_think_block(text);
    text = think_result.content;

    // 3. Anti-Cliche Layer
    text = detox_prose(text, register);
    // Epistemic filter: strip covert directives and [KEY: ... | hide] brackets from public display text
    text = filter_epistemic_brackets(strip_covert_directives(text), "other");
    const detoxed_think = think_result.think ? detox_prose(think_result.think, register) : null;
    const detoxed_text = text;

    // 4. Render Markdown
    let rendered = sanitize(markdown.render(text).trim());
    rendered = rendered.replace(/&quot;/g, '"').replace(/&apos;/g, "'");

    // 5. Wrap Dialogue Quotes
    rendered = wrap_dialogue(rendered);

    const rendered_think = detoxed_think ? sanitize(markdown.render(detoxed_think).trim()) : null;

    return {
      displayText: rendered,
      think: rendered_think,
      detoxedText: detoxed_text,
    };
  }

  // --- STORYMODE ACTION DISPATCHERS ---

  /**
   * Portrait generation helper — logs a placeholder message immediately, then fills in the image.
   * @param {string} subject
   * @param {string} prompt
   * @param {string} [kind]
   * @param {any} [target_entity]
   */
  export async function take_photo(subject, prompt, kind, target_entity = null) {
    if (simulation_state.busy) return;
    const entity_map = {
      ai: runtime.active_ai || app.selected_ai,
      user: runtime.active_user || app.selected_user,
      fractal: runtime.active_fractal || app.selected_fractal,
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
      simulation_state.role = subject;
      simulation_state.start_generation(subject);
      simulation_state.start_media_stage({
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
        const story_style = runtime.active_fractal?.visual_style;
        const app_style = configured_style && configured_style !== "none" && configured_style !== "default" ? configured_style : story_style || null;
        const enhanced = await visual_engine.envision(prompt, subject, entity, app_style);
        if (enhanced?.prompt) {
          refined_prompt = enhanced.prompt;
        }
        if (enhanced?.negative_prompt) {
          enhanced_negative = enhanced.negative_prompt;
        }
      } catch (envision_err) {
        console.warn("[take_photo] Envision failed, falling back to draft prompt:", envision_err);
      }

      placeholder_entry = await session_driver.log_message("", subject, role_label, {
        turn_type,
        attachments: [{ src: null, metadata: { mode: target_mode, prompt: refined_prompt } }],
      });

      const result = await visual_engine.visualize(runtime.story_id, refined_prompt, kind, {
        subject,
        entity,
        negative_prompt: enhanced_negative,
      });

      if (result?.imageUrl && placeholder_entry?.id) {
        await session_driver.update_log_attachment(placeholder_entry.id, 0, {
          src: result.imageUrl,
          metadata: { mode: target_mode, ...result.metadata, prompt: result.refinedPrompt },
        });
      } else if (!result?.imageUrl) {
        await session_driver.update_log_attachment(placeholder_entry.id, 0, {
          src: null,
          metadata: { mode: target_mode, prompt, failed: true, error: "Image generation returned no image" },
        });
        app.log(`${role_label} image generation failed. Please try again.`, "error");
      }
    } catch (err) {
      console.error(`[Photo Error: ${subject}]`, err);
      if (placeholder_entry?.id) {
        await session_driver.update_log_attachment(placeholder_entry.id, 0, {
          src: null,
          metadata: { mode: target_mode, prompt, failed: true, error: err?.message || "Image generation failed" },
        });
      }
      app.log(`Image generation failed: ${err.message || err}`, "error");
    } finally {
      simulation_state.complete();
    }
  }

  /**
   * Group shot helper — logs placeholder immediately, then fills in the image.
   */
  export async function take_group_photo() {
    if (simulation_state.busy) return;
    /** @type {{ id?: string|number } | null} */
    let placeholder_entry = null;
    try {
      simulation_state.role = "fractal";
      simulation_state.start_generation("fractal");
      const fractal = runtime.active_fractal || app.selected_fractal;
      simulation_state.start_media_stage({
        type: "fractal",
        name: fractal?.name || "Scene",
        avatar: fractal?.profile_picture || fractal?.avatar || null,
        color: fractal?.signature_color || fractal?.color || null,
      });
      const group_prompt = "A scene featuring both the AI character and the user persona together";

      placeholder_entry = await session_driver.log_message("", "fractal", fractal?.name || "Scene", {
        turn_type: "SYSTEM_TURN",
        attachments: [{ src: null, metadata: { mode: "story_entities", prompt: group_prompt } }],
      });

      const result = await visual_engine.visualize(runtime.story_id, group_prompt, "story_entities");

      if (result?.imageUrl && placeholder_entry?.id) {
        await session_driver.update_log_attachment(placeholder_entry.id, 0, {
          src: result.imageUrl,
          metadata: { ...result.metadata, prompt: result.refinedPrompt },
        });
      } else if (!result?.imageUrl) {
        await session_driver.update_log_attachment(placeholder_entry.id, 0, {
          src: null,
          metadata: { mode: "story_entities", prompt: group_prompt, failed: true, error: "Image generation returned no image" },
        });
        app.log("Story Image generation failed. Please try again.", "error");
      }
    } catch (err) {
      console.error("[Story Image Error]", err);
      if (placeholder_entry?.id) {
        await session_driver.update_log_attachment(placeholder_entry.id, 0, {
          src: null,
          metadata: { mode: "story_entities", failed: true, error: err?.message || "Image generation failed" },
        });
      }
      app.log(`Story Image failed: ${err.message || err}`, "error");
    } finally {
      simulation_state.complete();
    }
  }

  /**
   * Regenerate orchestration — generates 3 candidates in the background.
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
      on_select: (candidate) => {
        if (log_id) {
          session_driver.update_log_attachment(log_id, attach_idx, {
            src: candidate.url,
            metadata: { ...candidate.metadata, regenerate_count: regenerate_count + 1 },
          });
        }
      },
    });
  }

  /**
   * Ghostwriter trigger — fires a signal the Console watches.
   */
  export function ghostwrite() {
    if (simulation_state.busy) return;
    app.ghostwrite_request++;
  }

  /**
   * Mock message — streams a placeholder message for the given entity role (devmode only).
   * @param {string} role
   */
  export async function run_mock(role) {
    if (simulation_state.busy) return;
    const entity_map = {
      ai: runtime.active_ai || app.selected_ai,
      user: runtime.active_user || app.selected_user,
      fractal: runtime.active_fractal || app.selected_fractal,
    };
    const label_map = { ai: "AI", user: "User", fractal: "Fractal" };
    const turn_map = { ai: "AI_TURN", user: "USER_TURN", fractal: "SYSTEM_TURN" };
    const entity = entity_map[role];
    const content = get_mock_message();

    simulation_state.start_generation(role);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      app.start_stream("mock-node", role);

      let buffer = "";
      const words = content.split(" ");
      for (let i = 0; i < words.length; i++) {
        buffer += (i === 0 ? "" : " ") + words[i];
        app.streaming.content = buffer;
        await new Promise((resolve) => setTimeout(resolve, 60));
      }

      await session_driver.log_message(content, role, entity?.name || label_map[role], { turn_type: turn_map[role] });
    } finally {
      simulation_state.complete();
      app.end_stream();
    }
  }

  // Bind handlers into app for backwards compatibility
  app.take_photo_handler = take_photo;
  app.regenerate_image_handler = regenerate_image;
</script>

<script>
  import { onDestroy, tick } from "svelte";
  import { Button, Dialog, ScrollArea, Shimmer } from "@primitives";
  import { motion, item_in, update_card_scrub, clear_card_location } from "@media";
  import { chrono_engine } from "@engine";
  import { simulation_log } from "@data";
  import ChatBubble from "./ChatBubble.svelte";
  import UndoToast from "./UndoToast.svelte";

  // --- CONTEXT MENU BUILDERS ---
  function build_storymode_actions(type) {
    const in_dev = app.settings.dev_mode;
    const entity_map = {
      ai: app.selected_ai || runtime.active_ai,
      user: app.selected_user || runtime.active_user,
      fractal: app.selected_fractal || runtime.active_fractal,
    };
    const entity = entity_map[type];

    const photo_label = type === "ai" ? "Generate AI Character Image" : type === "user" ? "Generate User Persona Image" : "Generate Fractal Image";
    const tier = type === "fractal" ? "story_scene" : "story_character";
    const raw_fallback = render_optics_fallback({
      tier,
      subject: type,
      ai: entity_map.ai,
      user: entity_map.user,
      fractal: entity_map.fractal,
    });
    const photo_prompt = raw_fallback.replace(/<\/?image_prompt>/g, "").trim();

    const items = [{ label: "Profile", onSelect: () => app.toggle_profile(true, entity), disabled: !entity }];

    if (entity?.profile_picture) {
      items.push({
        label: "Profile Picture",
        onSelect: () =>
          app.open_image_preview({
            src: entity.profile_picture,
            metadata: entity.modifiers
              ? {
                  prompt: entity.modifiers.prompt,
                  negative_prompt: entity.modifiers.negative_prompt,
                  seed: entity.modifiers.last_generated_seed,
                }
              : null,
          }),
      });
    }

    if (type === "ai" || type === "fractal") {
      const voice_role = type === "fractal" ? "fractal" : "ai";
      const voice_noun = type === "fractal" ? "Fractal Voice" : "AI Voice";
      const voice_label = Audio.is_role_enabled(voice_role) ? `Disable ${voice_noun}` : `Enable ${voice_noun}`;
      items.push({
        label: voice_label,
        active: Audio.is_role_enabled(voice_role),
        onSelect: () => Audio.toggle_entity_voice(voice_role),
      });
    }

    items.push({ separator: true });
    items.push({
      label: photo_label,
      onSelect: () => take_photo(type, photo_prompt, type === "fractal" ? "story_scene" : "story_character"),
      disabled: simulation_state.busy || visual_engine.is_loading,
    });
    if (type === "fractal") {
      items.push({
        label: "Generate Story Image",
        onSelect: () => take_group_photo(),
        disabled: simulation_state.busy || visual_engine.is_loading,
      });
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
      items.push({
        label: "Ghostwrite",
        onSelect: () => ghostwrite(),
        disabled: simulation_state.busy,
      });
    }

    if (in_dev) {
      items.push(
        { separator: true },
        {
          label: "Mock Message",
          onSelect: () => run_mock(type),
          disabled: simulation_state.busy,
        },
      );
    }

    return items;
  }

  let card_actions = $derived({
    ai: build_storymode_actions("ai"),
    user: build_storymode_actions("user"),
    fractal: build_storymode_actions("fractal"),
  });

  // --- FEED ACTIVE TURN ORCHESTRATION ---
  let is_active_turn = $derived(simulation_state.phase === "generating" || app.streaming.active);
  let active_turn_role = $derived.by(() => {
    if (app.streaming.active) return app.streaming.role;
    if (simulation_state.phase === "generating") {
      if (
        simulation_state.role === "selfie" ||
        simulation_state.role === "character" ||
        simulation_state.role === "characters" ||
        simulation_state.role === "setting" ||
        simulation_state.role === "paparazzi" ||
        simulation_state.role === "story_entities" ||
        simulation_state.role === "story_character" ||
        simulation_state.role === "solo_entity" ||
        simulation_state.role === "story_scene"
      )
        return "ai";
      return simulation_state.role ?? "ai";
    }
    return simulation_state.role;
  });

  let active_turn_name = $derived.by(() => {
    if (simulation_state.generating_entity_name) return simulation_state.generating_entity_name;
    if (active_turn_role === "ai") return app.selected_ai?.name;
    if (active_turn_role === "fractal") return app.selected_fractal?.name;
    return "";
  });

  let visible_feed = $derived.by(() => {
    let list = [...simulation_log.feed];
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

    if (is_active_turn && app.streaming.active) {
      const active_id = app.streaming.node_id ?? "temp";
      const stream_role = simulation_state.generating_entity_type ?? active_turn_role ?? "ai";
      if (stream_role !== "system" && !list.some((entry) => entry.id === active_id)) {
        list.push({
          id: active_id,
          text: app.streaming.content ?? "",
          role: stream_role,
          character_name: active_turn_name ?? "",
          created_at: Date.now(),
          busy: true,
          meta: { is_prologue: app.streaming.role === "fractal" },
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
    const _is_active = app.streaming.active;
    const _stream_len = _is_active ? String(app.streaming.content ?? "").length : 0;
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

  let stage_class = $derived(
    app.viewport.mobile
      ? "inset-auto col-span-full row-3 h-full items-center overflow-hidden"
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
  on_confirm={execute_delete}
/>

<section class="relative z-10 flex min-h-0 flex-col justify-center {stage_class}">
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
                <ChatBubble
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
                  on_continue={() => chrono_engine.continue(entry.id)}
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

          {#if simulation_state.busy && !app.streaming.active}
            <div
              class="relative flex w-full items-start justify-start p-4 pl-[calc(var(--spacing-column-unit)*2)] transition-all duration-200"
              in:item_in={{ duration: 200 }}
            >
              <!-- Left-Gutter Portrait / Lens Anchor Slot -->
              <div
                class="
              absolute
              top-1/2
              left-[calc(var(--spacing-column-unit)*0.5)]
              m-0
              flex
              w-column-unit
              -translate-y-1/2
              items-center
              justify-center
              p-0
              select-none
            "
                style="--signature-color: {simulation_state.speaker_thinking || simulation_state.media_generating
                  ? simulation_state.generating_entity_color || 'var(--color-electric-cyan)'
                  : 'var(--color-frozen)'};"
              >
                <div
                  class="
                group/badge
                relative
                isolate
                m-0
                aspect-3/4
                w-column-unit
                transform-[translateZ(0)]
                animate-pulse
                overflow-hidden
                rounded-xl
                border
                border-solid
                border-(--signature-color)
                bg-black/60
                p-0
                shadow-[0_0_calc(var(--spacing-unit)*4)_color-mix(in_srgb,var(--signature-color)_25%,transparent)]
                transition-all
                duration-300
              "
                >
                  {#if (simulation_state.speaker_thinking || simulation_state.media_generating) && simulation_state.generating_entity_avatar}
                    <img
                      src={simulation_state.generating_entity_avatar}
                      alt={simulation_state.generating_entity_name || "Speaker"}
                      class="h-full w-full object-cover object-top"
                    />
                  {:else if (simulation_state.speaker_thinking || simulation_state.media_generating) && simulation_state.generating_entity_name}
                    <ProfilePicture
                      entity={{
                        name: simulation_state.generating_entity_name,
                        signature_color: simulation_state.generating_entity_color,
                      }}
                      alt=""
                      class="h-full w-full rounded-[inherit] [&_img]:h-full [&_img]:w-full [&_img]:rounded-[inherit] [&_img]:object-cover [&_img]:object-top"
                    />
                  {:else}
                    <!-- Director Abstract Evaluation Rune / Lens -->
                    <div class="flex h-full w-full items-center justify-center bg-slate-950/80">
                      <svg viewBox="0 0 24 24" class="size-5 animate-spin text-frozen opacity-80" style="animation-duration: 3s;">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="14 10" />
                      </svg>
                    </div>
                  {/if}
                  <div
                    aria-hidden="true"
                    class="pointer-events-none absolute inset-0 rounded-[inherit] opacity-30"
                    style="background-color: var(--signature-color); mix-blend-mode: color;"
                  ></div>
                  <Shimmer
                    color={simulation_state.speaker_thinking || simulation_state.media_generating
                      ? simulation_state.generating_entity_color || "var(--color-electric-cyan)"
                      : "var(--color-frozen)"}
                  />
                </div>
              </div>

              <!-- Pending Bubble: Pure Visual Shimmer Pulse -->
              <div
                class="
              relative
              flex
              h-10
              w-24
              items-center
              justify-center
              overflow-hidden
              rounded-2xl
              border
              border-solid
              border-white/10
              bg-slate-900/60
              backdrop-blur-md
            "
              >
                <Shimmer
                  color={simulation_state.speaker_thinking || simulation_state.media_generating
                    ? simulation_state.generating_entity_color || "var(--color-electric-cyan)"
                    : "var(--color-frozen)"}
                />
                <div class="flex items-center gap-1.5">
                  <span
                    class="size-1.5 animate-bounce rounded-full"
                    style="background-color: {simulation_state.speaker_thinking || simulation_state.media_generating
                      ? simulation_state.generating_entity_color || 'var(--color-electric-cyan)'
                      : 'var(--color-frozen)'}; animation-delay: 0ms;"
                  ></span>
                  <span
                    class="size-1.5 animate-bounce rounded-full"
                    style="background-color: {simulation_state.speaker_thinking || simulation_state.media_generating
                      ? simulation_state.generating_entity_color || 'var(--color-electric-cyan)'
                      : 'var(--color-frozen)'}; animation-delay: 150ms;"
                  ></span>
                  <span
                    class="size-1.5 animate-bounce rounded-full"
                    style="background-color: {simulation_state.speaker_thinking || simulation_state.media_generating
                      ? simulation_state.generating_entity_color || 'var(--color-electric-cyan)'
                      : 'var(--color-frozen)'}; animation-delay: 300ms;"
                  ></span>
                </div>
              </div>
            </div>
          {/if}

          {#if visible_feed.length === 0 && !simulation_state.busy}
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
    right: 0 !important;
    top: 0 !important;
    bottom: 0 !important;
    height: 100dvh !important;
    z-index: 9999 !important;
  }

  .message--prologue {
    transition: opacity 650ms ease;
  }

  .message--prologue.prologue-awaiting-flight {
    opacity: 0;
  }
</style>
