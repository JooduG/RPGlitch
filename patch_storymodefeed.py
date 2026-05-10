with open('src/ui/storymode/StorymodeFeed.svelte', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. auto-scroll logic
old_effect = """  // Auto-scroll logic
  $effect(() => {
    if ((simulation_log.feed.length || app.streaming.active) && scroll_ref) {
      // Small timeout to allow DOM render
      setTimeout(() => {
        if (scroll_ref) {
          scroll_ref.scrollTop = scroll_ref.scrollHeight;
        }
      }, 0);
    }
  });"""

new_effect = """  import { tick } from "svelte";
  // Auto-scroll logic
  $effect(() => {
    if ((simulation_log.feed.length || app.streaming.active) && scroll_ref) {
      tick().then(() => {
        if (scroll_ref) {
          scroll_ref.scrollTop = scroll_ref.scrollHeight;
        }
      });
    }
  });"""
content = content.replace(old_effect, new_effect)

# 2. CSS refactor
content = content.replace("min-height: 12.5rem;", "min-height: var(--card-height-m);")
content = content.replace("max-width: 25rem;", "max-width: var(--width-modal-max);")

with open('src/ui/storymode/StorymodeFeed.svelte', 'w', encoding='utf-8') as f:
    f.write(content)
