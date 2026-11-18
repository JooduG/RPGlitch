# Z

Every z-value in `src/`, verbatim and what it is assigned to:

| Value | Assigned To | Location |
| --- | --- | --- |
| `--z-index-backdrop: 100` (`"z-index-backdrop": "100"`) | Backdrop CSS token | `design.css:108`, `tokens.js:176` |
| `--z-index-elevated: 200` (`"z-index-elevated": "200"`) | Elevated CSS token | `design.css:109`, `tokens.js:177` |
| `--z-index-max: 999` (`"z-index-max": "999"`) | Max CSS token | `design.css:110`, `tokens.js:178` |
| `--z-index-modal: 300` (`"z-index-modal": "300"`) | Modal CSS token | `design.css:111`, `tokens.js:179` |
| `--z-index-popover: 400` (`"z-index-popover": "400"`) | Popover CSS token | `design.css:112`, `tokens.js:180` |
| `--z-index-tooltip: 500` (`"z-index-tooltip": "500"`) | Tooltip CSS token | `design.css:113`, `tokens.js:181` |
| `after:z-10`, `z-elevated`, `z-10` | Card layers & badges | `EntityCard.svelte:257, 301, 428, 547` |
| `before:-z-10` | Noise pseudo-element | `Dialog.svelte:101` |
| `before:z-[-1]` | Noise pseudo-element | `Modal.svelte:132` |
| `focus-within:z-10`, `hover:z-10`, `z-10`, `z-0` | Meter card & controls | `Meter.svelte:90, 91, 101, 119, 175` |
| `has-not-disabled:hover:z-20`, `z-25` | Color swatches | `VisualWing.svelte:232, 238` |
| `hover:z-elevated!`, `style:z-index="0"`, `z-0`, `z-10` | Card hand Import / Create New cards | `Storyboard.svelte:1032-1117` |
| `hover:z-elevated!`, `style:z-index={idx + 1}`, `z-0`, `z-10` | Card hand entity cards | `Storyboard.svelte:1147-1179` |
| `layer === "console"` → `"40"`, `"cardhand"` → `"50"`, `"image"` → `"600"`, `"max"` → `"var(--z-index-backdrop)"` | `computed_z_index` | `Backdrop.svelte:31-36` |
| `style:z-index="var(--z-index-tooltip)"` | `wrapperProps` portal wrapper | `Tooltip.svelte:137` |
| `style:z-index={computed_z_index}` | Root `<div>` | `Backdrop.svelte:97` |
| `z = "var(--z-index-popover)"` / `clone.style.zIndex = String(z);` | Card flight clones | `motion.svelte.js:353, 417` |
| `z_index = "100"` | Default prop fallback | `Backdrop.svelte:19` |
| `z_index = "200"` | Default prop | `Modal.svelte:25, 83` |
| `z_index="1000"` | Export `<Modal>` | `Profile.svelte:550` |
| `z_index="1000"` | Import `<Modal>` | `Storyboard.svelte:1222` |
| `z_index="500"` | Lightbox `<Modal>` | `ImagePreview.svelte:156` |
| `z-0` | Background canvas/div | `App.svelte:73` |
| `z-0` | Tooltip arrow | `Slider.svelte:271` |
| `z-0` | Tooltip arrow | `Tooltip.svelte:160` |
| `z-0`, `z-10`, `z-20`, `z-30` | SVG, nodes, hover card | `RelationalGraph.svelte:290-408` |
| `z-0`, `z-5`, `z-10` | Portrait layers | `ProfilePicture.svelte:91-170` |
| `z-10` | `cover && variant !== 'bare'` overlay | `Button.svelte:160` |
| `z-10` | Inner elements | `TextField.svelte:259, 337, 387` |
| `z-10` | Left, center, right stage slots | `Storyboard.svelte:886, 910, 934` |
| `z-10` | Root shell wrapper | `App.svelte:71` |
| `z-10` | Stage section | `Storymode.svelte:637` |
| `z-10` | Style badge | `StyleBadge.svelte:91` |
| `z-10`, `z-20`, `z-0` | Story card layers | `StoryCard.svelte:112, 184, 240, 270` |
| `z-10`, `z-20`, `z-30`, `z-0`, `before:-z-10` | Card layout, sticky header/avatar, footer, background, modal noise | `Profile.svelte:297-1032` |
| `z-20` | Card hand header | `Storyboard.svelte:1002` |
| `z-20` | Main grid container | `App.svelte:94` |
| `z-30` | Header | `Storyboard.svelte:818` |
| `z-30` | Shimmer overlay | `Shimmer.svelte:19` |
| `z-40` | Footer | `App.svelte:102` |
| `z-40` | Title/header inner | `Storyboard.svelte:823` |
| `z-elevated` | Caption | `ImagePreview.svelte:178` |
| `z-elevated` | Card hand overlay wrapper | `Storyboard.svelte:971` |
| `z-elevated` | Console decks/controls | `Console.svelte:719, 736` |
| `z-elevated` | ScrollArea | `ScrollArea.svelte:43` |
| `z-index: 1`, `z-10` | Chat bubble elements | `ChatBubble.svelte:1056, 1324` |
| `z-index: var(--z-index-max);` | `<style>` rule | `App.svelte:170` |
| `z-index: var(--z-index-max);` | `<style>` rule | `Storymode.svelte:821` |
| `z-index: var(--z-index-max);` | Utility/overlay rule | `design.css:585` |
| `z-index: var(--z-index-tooltip);` | `.skip-link` | `design.css:143` |
| `z-popover` | Dialog content | `Dialog.svelte:85` |
| `z-popover` | Dropdown menu | `Dropdown.svelte:136` |
| `z-popover` | Floating tooltip | `Slider.svelte:258` |
| `z-popover` | Full-screen noise overlay | `App.svelte:84` |
| `z-popover`, `before:-z-10` | Menu & noise pseudo-element | `ContextMenu.svelte:106-107` |

_(Note: `Profile.svelte:550` and `Storyboard.svelte:1222` now have `z_index="1000"`, while `Tooltip.svelte:137` has `var(--z-index-tooltip)` which is `500` — so `1000 > 500`, meaning the Import/Export modal backdrop sits above the tooltip again.)_
