import re

with open('src/ui/storymode/Message.svelte', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Refactor entity resolution
old_entity = """  let entity = $derived.by(() => {
    // 1. Explicit character name check
    if (character_name) {
      if (is_user && (runtime.active_user?.name === character_name || character_name === "User"))
        return runtime.active_user || app.selected_user;
      if (is_ai && (runtime.active_ai?.name === character_name || character_name === "AI"))
        return runtime.active_ai || app.selected_ai;
      if (
        is_fractal &&
        (runtime.active_fractal?.name === character_name || character_name === "Fractal")
      )
        return runtime.active_fractal || app.selected_fractal;
    }

    // 2. Fallback to active runtime entities if role matches
    if (is_user) return runtime.active_user || app.selected_user;
    if (is_ai) return runtime.active_ai || app.selected_ai;
    if (is_fractal) return runtime.active_fractal || app.selected_fractal;

    return null;
  });"""

new_entity = """  let entity = $derived.by(() => {
    if (is_user) {
      if (character_name && (runtime.active_user?.name === character_name || character_name === "User")) return runtime.active_user || app.selected_user;
      return runtime.active_user || app.selected_user;
    }
    if (is_ai) {
      if (character_name && (runtime.active_ai?.name === character_name || character_name === "AI")) return runtime.active_ai || app.selected_ai;
      return runtime.active_ai || app.selected_ai;
    }
    if (is_fractal) {
      if (character_name && (runtime.active_fractal?.name === character_name || character_name === "Fractal")) return runtime.active_fractal || app.selected_fractal;
      return runtime.active_fractal || app.selected_fractal;
    }
    return null;
  });"""

content = content.replace(old_entity, new_entity)

# 2. Refactor signature color
old_sig = """  let signature_color = $derived.by(() => {
    // Priority 1: Entity's own signature color
    if (entity?.signature_color) return themeStore.get_signature_color(entity);

    // Priority 2: Fallback to role-based deterministic colors
    if (character_name) return themeStore.get_deterministic_color(character_name);
    return themeStore.get_deterministic_color(sender);
  });"""

new_sig = """  let signature_color = $derived(
    entity?.signature_color
      ? themeStore.get_signature_color(entity)
      : themeStore.get_deterministic_color(character_name || sender)
  );"""

content = content.replace(old_sig, new_sig)

# 3. CSS updates
content = content.replace("width: 60rem;", "max-width: var(--width-modal-max);")
content = content.replace("max-width: 90%;", "width: 100%;")
content = content.replace("min-width: 12rem;", "min-width: var(--width-sidebar);")
content = content.replace("max-width: 50vw;", "max-width: var(--width-modal-max);")
content = content.replace("height: 2.2rem;", "height: auto;\n    min-height: var(--spacing-xl);")

# 4. Remove div.message-body wrapper
content = content.replace("""      <div class="message-body">
        {#if busy && !text}""", """        {#if busy && !text}""")

content = content.replace("""          {#if busy && !has_display_text}
            <div class="thinking-wrapper">
              <TypingIndicator variant="pill" signatureColor={signature_color} />
            </div>
          {/if}
        {/if}
      </div>
    </div>""", """          {#if busy && !has_display_text}
            <div class="thinking-wrapper">
              <TypingIndicator variant="pill" signatureColor={signature_color} />
            </div>
          {/if}
        {/if}
    </div>""")

# 5. Fix message-body CSS class to instead use thinking wrapper logic
old_css_body = """  /* --- BODY LOGIC --- */
  .message-body {
    padding: var(--spacing-m) var(--spacing-l);
    position: relative;
    z-index: var(--z-index-1);
  }"""

new_css_body = """  /* --- BODY LOGIC --- */
  .message-content,
  .attachments,
  .thinking-wrapper,
  .thinking-wrapper ~ div {
    padding: var(--spacing-m) var(--spacing-l);
    position: relative;
    z-index: var(--z-index-1);
  }"""

content = content.replace(old_css_body, new_css_body)

with open('src/ui/storymode/Message.svelte', 'w', encoding='utf-8') as f:
    f.write(content)
