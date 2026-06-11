<script>
  /**
   * @file UnifiedConsole.svelte
   * ðŸŽ›ï¸ THE SOVEREIGN CORE CONSOLE
   * Polymorphic command control system merging GlassPill, StoryboardPill, and InputBar.
   * Standard: Ultra-Lean DOM & Chalk Regime Enforcement
   */
  import { themeStore } from "@media";
  import { runtime, app, session, simulationState } from "@state";
  import { Button, tooltip } from "@atoms";
  import { pickRandom } from "@utils";
  import { pulse, roll, shimmy, stab, motion } from "@motion";

  // --- CORE VIEW ENGINE STATE ---
  let ready_to_begin = $derived(app.is_ready);

  let label_text = $derived(
    ready_to_begin ? "BEGIN STORY" : `SELECT ENTITIES (${app.selected_count}/3)`,
  );

  // --- STORYMODE CONSOLE STATE ---
  let value = $state("");
  let is_focused = $state(false);
  /** @type {HTMLTextAreaElement | undefined} */
  let textarea = $state();

  let is_locked = $derived(simulationState.busy);
  let signature_color = $derived(
    themeStore.get_signature_color(runtime.active_user || app.selected_user, "var(--gunmetal)"),
  );

  // --- STORYBOARD NARRATIVE ORCHESTRATION ---
  const storyboard = {
    /**
     * Shuffle all selected entities randomly.
     */
    async shuffle() {
      if (!app.ai_list.length) {
        await app.load_entities();
      }
      if (!app.ai_list.length) return;

      app.selected_ai = pickRandom(Array.isArray(app.ai_list) ? app.ai_list : []);
      let available_users = app.user_list;
      if (app.selected_ai && Array.isArray(app.user_list)) {
        available_users = app.user_list.filter((u) => u.id !== app.selected_ai.id);
      }

      if (available_users.length) {
        app.selected_user = pickRandom(available_users);
      } else if (app.user_list.length) {
        app.user_list = app.user_list[0];
      }

      if (Array.isArray(app.fractal_list) && app.fractal_list.length) {
        app.selected_fractal = pickRandom(Array.isArray(app.fractal_list) ? app.fractal_list : []);
      }

      if (typeof app.reroll_title === "function") {
        app.reroll_title();
      }
    },

    /**
     * Begin the story with current selections.
     */
    async begin() {
      if (app.settings.dev_mode) {
        app.log("Lobby Bypass Triggered (DEV_MODE)", "system");
        const selection = {
          ai: app.selected_ai || { id: "dev_ai", name: "Dev AI" },
          user: app.selected_user || { id: "dev_user", name: "Dev User" },
          fractal: app.selected_fractal || { id: "dev_fractal", name: "Dev Fractal" },
        };
        motion.intensity = 0.4;
        app.set_view("storymode");
        await session.start(selection);
        return;
      }

      if (!app.selected_ai || !app.selected_user || !app.selected_fractal) return;

      // Compress global kinetic speed to induce analytical resistance
      motion.intensity = 0.4;

      // Swap boundaries safely through the single-flight transition guard
      app.set_view("storymode");

      await session.start({
        ai: app.selected_ai,
        user: app.selected_user,
        fractal: app.selected_fractal,
      });
    },
  };

  /**
   * Adjusts the height of the textarea based on its content.
   */
  function adjust_height() {
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  /**
   * Dispatches the current input to the Engine layer.
   */
  async function handle_send() {
    const text = value.trim();
    if (!text || is_locked) return;

    simulationState.set_intent_active(true);
    value = "";
    adjust_height();

    try {
      await session.send(text);
    } catch (e) {
      console.error("Failed to send message:", e);
      simulationState.set_intent_active(false);
    }
  }

  /**
   * Handles keyboard shortcuts (Enter to send, Shift+Enter to newline).
   * @param {KeyboardEvent} e
   */
  function handle_keydown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handle_send();
    }
  }

  // Focus preservation routine across narrative quantum transitions
  $effect(() => {
    if (app.view === "storymode" && textarea) {
      textarea.focus();
    }
  });
</script>

<div
  class="
    pointer-events-auto relative
    z-10
    mx-auto
    flex
    min-h-[calc(var(--row-unit)*0.5)]
    items-center
    justify-between
    gap-2
    rounded-full
    bg-(--glass-elevated)
    px-4
    py-2
    [backdrop-filter:var(--blur-mist)]
    transition-all
    duration-500
    ease-in-out

    {is_locked
    ? `
      pointer-events-none
      cursor-wait
      opacity-15
      brightness-75
      grayscale
      filter
    `
    : ''}
    {is_focused && app.view === 'storymode'
    ? `
      w-[calc(var(--column-unit)*6)]
      border-(--signature-color,var(--color-slate-600))
      shadow-[0_0_calc(var(--spacing-unit)*4)_color-mix(in_srgb,var(--signature-color,var(--color-slate-600))_30%,transparent)]
    `
    : 'w-[calc(var(--column-unit)*4)]'}
  "
  style:--signature-color={app.view === "storymode" ? signature_color : undefined}
  data-testid="unified-console"
>
  {#if app.view === "storyboard"}
    <Button
      flank={true}
      variant="invisible"
      aria-label="Shuffle Entities"
      onclick={() => storyboard.shuffle()}
      actions={[shimmy, tooltip]}
      style="view-transition-name: console-left-flank"
    >
      <svg
        viewBox="0 0 24 24"
        class="
        block
        size-(--icon-medium)
      "
      >
        <path
          fill="currentColor"
          d="M14.83,13.41L13.42,14.82L16.55,17.95L14.5,20H20V14.5L17.96,16.54L14.83,13.41M14.5,4L16.54,6.04L4,18.59L5.41,20L17.96,7.46L20,9.5V4M10.59,9.17L5.41,4L4,5.41L9.17,10.58L10.59,9.17Z"
        />
      </svg>
    </Button>

    <Button
      class="group"
      data-ready={ready_to_begin}
      variant="invisible"
      busy={!ready_to_begin}
      onclick={storyboard.begin}
      actions={[pulse]}
      style="view-transition-name: console-center-axis"
    >
      <h6
        class="
          m-0
          tracking-widest
          transition-all
          duration-300

          {ready_to_begin
          ? 'group-hover:scale-105 group-hover:brightness-125'
          : 'text-slate-400 opacity-80'}"
        style={ready_to_begin
          ? "color: var(--emerald-green); text-shadow: 0 0 0.5rem color-mix(in srgb, var(--emerald-green) 25%, transparent);"
          : undefined}
      >
        {label_text}
      </h6>
    </Button>

    <Button
      flank={true}
      variant="invisible"
      aria-label="Settings"
      onclick={app.toggle_control_panel}
      data-testid="settings-button"
      actions={[roll, tooltip]}
      style="view-transition-name: console-settings-node"
    >
      <svg
        viewBox="0 0 24 24"
        class="
        block
        size-(--icon-medium)
      "
      >
        <path
          fill="currentColor"
          d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.35 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.35 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.04 4.95,18.95L7.44,17.95C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.95L19.05,18.95C19.27,19.04 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"
        />
      </svg>
    </Button>
  {:else}
    <Button
      flank={true}
      variant="invisible"
      onclick={() => app.toggle_control_panel()}
      aria-label="Settings"
      actions={[roll, tooltip]}
      style="view-transition-name: console-settings-node"
    >
      <svg
        class="
        block
        size-(--icon-medium)
      "
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
        />
      </svg>
    </Button>

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

        placeholder:text-slate-600
        placeholder:opacity-15
      "
      bind:value
      onkeydown={handle_keydown}
      oninput={adjust_height}
      onfocus={() => (is_focused = true)}
      onblur={() => (is_focused = false)}
      placeholder="Type a message..."
      rows="1"
      disabled={is_locked}
      aria-label="Input message"
      style="view-transition-name: console-center-axis"
    ></textarea>

    <Button
      variant="invisible"
      onclick={handle_send}
      disabled={!value.trim() || is_locked}
      aria-label="Send Message"
      actions={[stab, tooltip]}
      style="view-transition-name: console-right-flank"
    >
      <svg
        class="
        block
        size-(--icon-medium)
      "
        viewBox="0 0 24 24"
      >
        <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
      </svg>
    </Button>
  {/if}
</div>
