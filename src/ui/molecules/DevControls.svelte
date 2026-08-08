<script>
  import { Button, Toggle } from "@atoms";
  import { Dialog } from "@molecules";
  import { db } from "@data";
  import { app } from "@state";

  let is_confirming_reset = $state(false);

  async function hard_reset() {
    db.close();
    await db.delete();
    setTimeout(() => window.location.reload(), 150);
  }
</script>

<Dialog
  type="confirm"
  bind:open={is_confirming_reset}
  title="Wipe Data?"
  message="This will permanently delete all stories, characters, and logs. This action cannot be undone."
  confirm_label="Erase All"
  on_confirm={hard_reset}
/>

<Toggle label="DEVMODE" bind:value={app.settings.dev_mode} onchange={() => app.save_settings()} />
<Button variant="danger" size="small" onclick={() => (is_confirming_reset = true)} title="Delete All">
  <svg
    class="size-3.5 -translate-y-kinetic-shimmy-y fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]"
    viewBox="0 0 24 24"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-2 2-2 2H7c0 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
  <span class="text-xs font-bold tracking-widest uppercase">Delete All</span>
</Button>
