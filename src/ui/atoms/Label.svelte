<!-- src/ui/atoms/Label.svelte -->
<script>
  import { Label } from "bits-ui";

  let { class: className = "", disabled = false, children, onclick, ...rest } = $props();

  function handle_click(e) {
    if (disabled) return;
    if (rest.for) {
      const target = document.getElementById(rest.for);
      // Forward label clicks on dropdown triggers so they open instead of only focusing
      if (target && target.tagName === "BUTTON" && target.getAttribute("role") !== "switch") {
        e.preventDefault();
        requestAnimationFrame(() => {
          target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
          target.click();
        });
      }
    }
    onclick?.(e);
  }
</script>

<Label.Root
  class={["flex w-full items-center gap-standard text-left type-uppercase-label text-slate-400", disabled ? "cursor-default" : "cursor-pointer", className]}
  onclick={handle_click}
  {...rest}>
  {@render children?.()}
</Label.Root>
