<script>
  /**
   * @file Storyboard.svelte
   * ❄️ THE STORYBOARD HEADER
   * Now renders ONLY the dynamic title header — a non-persistent center header element.
   * EntityCards, UnifiedConsole, and CardHand are hoisted into App.svelte
   * and are mounted persistently across view transitions.
   * Refactored: Option A — persistent layout hoist.
   */
  import { StoryboardDynamicTitle } from "@organisms";
</script>

<StoryboardDynamicTitle />
