<script>
  /**
   * @file src/ui/atoms/Icon.svelte
   * Minimalist 24x24 stroke icon atom and central icon registry.
   */

  const ICONS = {
    // --- Temporal (Pure Teardrop) ---
    past: "M4 12C7.8 10.5 10.2 6.5 14.5 6.5A5.5 5.5 0 1 1 14.5 17.5C10.2 17.5 7.8 13.5 4 12Z",
    present: "M12 20C10.5 16.2 6.5 13.8 6.5 9.5A5.5 5.5 0 1 1 17.5 9.5C17.5 13.8 13.5 16.2 12 20Z",
    future: "M20 12C16.2 10.5 13.8 6.5 9.5 6.5A5.5 5.5 0 1 0 9.5 17.5C13.8 17.5 16.2 13.5 20 12Z",
    eternal:
      "M12 12C9.8 9.2 8.2 7.5 6 7.5A4.5 4.5 0 1 0 6 16.5C8.2 16.5 9.8 14.8 12 12ZM12 12C14.2 9.2 15.8 7.5 18 7.5A4.5 4.5 0 1 1 18 16.5C15.8 16.5 14.2 14.8 12 12Z",

    // --- Navigation & Chevrons ---
    chevron_down: "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
    chevron_right: "M9 18L15 12L9 6",

    // --- Actions ---
    check: "M20 6L9 17L4 12",
    close: "M18 6L6 18M6 6L18 18",
    plus: "M12 5v14M5 12h14",
    minus: "M5 12h14",
    edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
    copy: "M11 9h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
    trash: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
    download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10L12 15L17 10M12 15V3",
    upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8L12 3L7 8M12 3v12",
    fetch_url: "M12 2a10 10 0 1 0 10 10M2 12h8M18 4l4 4-4 4M22 8h-8",
    undo: "M3 7v6h6M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13",
    redo: "M21 7v6h-6M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7",
    refresh: "M23 4v6h-6M20.49 15a9 9 0 1 1-2.12-9.36L23 10",
    reset: "M1 4v6h6M3.51 15a9 9 0 1 0 2.13-9.36L1 10",
    send: "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z",
    ai_enhance: "M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z",
    shuffle:
      "M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z",
    interrupt: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z",

    // --- Media & Audio ---
    play: "M5 3L19 12L5 21Z",
    pause: "M7 4h2a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM15 4h2a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z",
    stop: "M7 6h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z",
    volume:
      "M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z",
    volume_mute:
      "M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.53C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73L12,10.73M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.5,12.43 16.5,12.21 16.5,12Z",
    camera: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM8 13a4 4 0 1 0 8 0a4 4 0 1 0-8 0",

    // --- Entities & System ---
    character: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M8 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0",
    fractal: "M19,12L12,22L5,12L12,2M12,2L19,12H5L12,2Z",
    relations: "M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0M2 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0M18 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0M6 12h3m6 0h3",
    settings:
      "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z",
    warning: "M12 3 L21 21 H3 ZM12 9v5M12 17.5h.01",
    warning_fill: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z",
    spinner: "M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0",
  };

  const FILLED_ONLY = new Set(["chevron_down", "send", "shuffle", "interrupt", "play", "pause", "stop", "volume", "volume_mute", "settings", "warning_fill"]);

  /**
   * @typedef {Object} Props
   * @property {keyof typeof ICONS} [name="past"] - Icon identifier
   * @property {string} [class] - Additional CSS classes
   * @property {string} [style] - Optional inline style
   */

  /** @type {Props & Record<string, any>} */
  let { name = "past", class: class_name = "size-icon-small", ...rest } = $props();
</script>

<svg viewBox="0 0 24 24" class={["fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]", class_name]} aria-hidden="true" {...rest}>
  {#if ICONS[name]}
    <path
      d={ICONS[name]}
      fill={FILLED_ONLY.has(name) || name === "ai_enhance" ? "currentColor" : undefined}
      stroke={FILLED_ONLY.has(name) ? "none" : undefined}
      stroke-dasharray={name === "spinner" ? "14 10" : undefined} />
  {/if}
</svg>
