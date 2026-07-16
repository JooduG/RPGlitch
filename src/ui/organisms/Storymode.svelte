<script>
  /**
   * @file Storymode.svelte
   * THE STORY FEED
   * Now renders ONLY the StorymodeFeed — the center content for storymode.
   * EntityCards, UnifiedConsole, and Layout are hoisted into App.svelte
   * and are mounted persistently across view transitions.
   * Refactored: Option A — persistent layout hoist.
   */
  import { StorymodeFeed } from "@organisms";
</script>

<StorymodeFeed />
