<script>
  /**
   * @file src/ui/organisms/StoryLibrary.svelte
   * Story archive manager with story switching, inline rename persistence, markdown export, and delete confirmation.
   */
  import { Accordion } from "@atoms";
  import { export_story_record, stories } from "@data";
  import { item_in } from "@media";
  import { Dialog, StoryCard } from "@molecules";
  import { app, execution, session } from "@state";
  import { download_text_file } from "@utils";

  let story_cache = $state([]);
  let pending_delete = $state(null);
  let show_delete_dialog = $state(false);

  const is_active_story = (id) => session.active_id != null && String(session.active_id) === String(id);

  async function refresh_stories() {
    try {
      story_cache = await stories.list();
    } catch {
      // Ignore if db is closed or during teardown
    }
  }

  $effect(() => {
    void app.stories_version;
    refresh_stories();
  });

  async function load_story(id) {
    const story_id = String(id);
    await session.set_active(story_id);
    await session.sync(story_id);
    await session.refresh_feed();
    if (session.feed.some((e) => e.meta?.is_epilogue)) execution.lock();
    else execution.unlock();
    await app.load_entities();
    await app.set_view("storymode");
    app.control_panel_open = false;
  }

  async function rename_story(story, next_title) {
    const trimmed = next_title.trim();
    if (!trimmed || trimmed === story.title) return;
    try {
      await stories.update(story.id, { title: trimmed });
      await refresh_stories();
    } catch (err) {
      console.error(`Rename failed: ${err.message}`, err);
    }
  }

  async function export_story(story) {
    try {
      const { markdown, filename } = await export_story_record(story.id, story);
      download_text_file(filename, markdown, "text/markdown;charset=utf-8");
    } catch (err) {
      console.error(`Export failed: ${err.message}`, err);
    }
  }

  function request_delete(story) {
    pending_delete = story;
    show_delete_dialog = true;
  }

  async function confirm_delete() {
    const target = pending_delete;
    if (!target) return;
    try {
      await stories.delete(target.id);
      await refresh_stories();
      await app.load_entities();
      if (is_active_story(target.id)) {
        await session.clear_active();
        await app.set_view("storyboard");
      }
    } catch (err) {
      console.error(`Delete failed: ${err.message}`, err);
    } finally {
      pending_delete = null;
    }
  }
</script>

<Accordion label="Library" content_class="flex flex-col gap-standard">
  {#if story_cache.length > 0}
    <div class="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-standard">
      {#each story_cache as story (story.id)}
        <div class="min-w-0" in:item_in>
          <StoryCard
            {story}
            active={is_active_story(story.id)}
            onclick={() => load_story(story.id)}
            onrename={rename_story}
            onexport={export_story}
            ondelete={request_delete} />
        </div>
      {/each}
    </div>
  {:else}
    <p class="m-0 py-standard text-center text-sm text-slate-500 italic">No stories yet..</p>
  {/if}
</Accordion>

<Dialog
  type="confirm"
  bind:open={show_delete_dialog}
  title="Delete Story?"
  message={`This will permanently delete "${pending_delete?.title ?? ""}" and its entire simulation log. This action cannot be undone.`}
  confirm_label="Delete"
  on_confirm={confirm_delete} />
