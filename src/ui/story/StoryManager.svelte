<script>
  import { Dialog } from "@primitives";
  import StoryCard from "./StoryCard.svelte";
  import { stories } from "@data";
  import { session_driver } from "@engine";
  import { item_in } from "@motion";
  import { app, runtime, simulation_log, simulation_state } from "@state";

  let is_confirming_story_delete = $state(false);
  let pending_story_delete = $state(null);
  let is_renaming_story = $state(false);
  let pending_rename_story = $state(null);
  let rename_draft = $state("");
  let story_cache = $state([]);

  async function load_story(id) {
    app.log(`Control Panel: Loading Story [${id}]`, "system");
    await session_driver.set_active(String(id));
    await runtime.sync(String(id));
    await simulation_log.refresh();
    if (simulation_log.feed.some((e) => e.meta?.is_epilogue)) {
      simulation_state.lock();
    } else {
      simulation_state.unlock();
    }
    await app.load_entities();
    app.set_view("storymode");
    app.control_panel_open = false;
  }

  async function refresh_stories() {
    story_cache = await stories.list();
  }

  async function delete_story(story) {
    pending_story_delete = story;
    is_confirming_story_delete = true;
  }

  async function start_rename_story(story) {
    pending_rename_story = story;
    rename_draft = story.title || "";
    is_renaming_story = true;
  }

  async function confirm_rename_story() {
    if (!pending_rename_story) return;
    const trimmed = rename_draft.trim();
    if (trimmed && trimmed !== pending_rename_story.title) {
      try {
        await stories.update(pending_rename_story.id, { title: trimmed });
        await refresh_stories();
        app.log(`Story renamed to "${trimmed}".`, "system");
      } catch (err) {
        app.log(`Rename failed: ${err.message}`, "error");
      }
    }
    pending_rename_story = null;
    rename_draft = "";
  }

  async function confirm_story_delete() {
    if (!pending_story_delete) return;
    try {
      await stories.delete(pending_story_delete.id);
      await refresh_stories();
      await app.load_entities();
      app.log(`Story "${pending_story_delete.title}" deleted.`, "system");
      if (String(runtime.story_id) === String(pending_story_delete.id)) {
        await session_driver.clear_active();
        app.set_view("storyboard");
      }
    } catch (err) {
      app.log(`Delete failed: ${err.message}`, "error");
    } finally {
      pending_story_delete = null;
    }
  }

  $effect(() => {
    if (app.control_panel_open) {
      refresh_stories();
    }
  });
</script>

<Dialog
  type="confirm"
  bind:open={is_confirming_story_delete}
  title="Delete Story?"
  message={`This will permanently delete "${pending_story_delete?.title ?? ""}" and its entire simulation log. This action cannot be undone.`}
  confirm_label="Delete"
  on_confirm={confirm_story_delete}
/>

<Dialog
  type="confirm"
  bind:open={is_renaming_story}
  title="Rename Story"
  message={`Enter a new title for "${pending_rename_story?.title ?? ""}":`}
  confirm_label="Save"
  show_input={true}
  input_placeholder="New story title..."
  bind:input_value={rename_draft}
  on_confirm={confirm_rename_story}
/>

{#if story_cache.length > 0}
  <div class="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-4">
    {#each story_cache as story (story.id)}
      <div class="min-w-0" in:item_in>
        <StoryCard
          {story}
          active={runtime.story_id === String(story.id)}
          onclick={() => load_story(story.id)}
          ondelete={delete_story}
          onrename={start_rename_story}
        />
      </div>
    {/each}
  </div>
{:else}
  <p class="m-0 py-4 text-center text-sm text-slate-500 italic">No stories yet..</p>
{/if}
