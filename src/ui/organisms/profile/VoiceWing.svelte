<script>
    import { Audio } from "@media/audio.js"

    let { char = $bindable(), is_editing } = $props()

    let show_voice_dropdown = $state(false)

    // Voice metadata
    const selected_voice = $derived(Audio.voice.voices.find((v) => v.uri === char.voice.uri))
    const is_natural_voice = $derived(selected_voice?.name.includes("Natural"))

    // Voice name normalization
    function format_voice_name(name) {
        return name
            .replace(/Microsoft\s+/gi, "")
            .replace(/\s+Online\s+\(Natural\)/gi, "")
            .replace(/\s+-\s+English\s+\(.*\)/gi, "")
            .trim()
    }
</script>

<div class="voice-wing-content" onmouseleave={() => (show_voice_dropdown = false)} role="presentation">
    <div class="voice-control-row">
        <div class="dropdown">
            <button class="voice-btn" type="button" disabled={!is_editing} onclick={() => (show_voice_dropdown = !show_voice_dropdown)}>
                {format_voice_name(Audio.voice.voices.find((v) => v.uri === char.voice.uri)?.name || "Select Voice")}
            </button>
            <div class="dropdown-content" class:visible={show_voice_dropdown}>
                {#each Audio.voice.voices as voice (voice.uri)}
                    <button
                        class="voice-option"
                        class:active={char.voice.uri === voice.uri}
                        onclick={() => {
                            char.voice.uri = voice.uri
                            show_voice_dropdown = false
                        }}
                    >
                        <span class="voice-name">{format_voice_name(voice.name)}</span>
                        <span class="region-pill">{voice.region}</span>
                    </button>
                {/each}
            </div>
        </div>

        <button class="preview-btn" type="button" title="Preview Voice" disabled={!is_editing || !char.voice.uri} onclick={() => Audio.voice.preview(char.voice.uri, char.voice.rate, char.voice.pitch)}> 🔊 </button>
    </div>

    <div class="sliders">
        <div class="slider-group" data-tooltip={`Rate: ${char.voice.rate.toFixed(1)}x`}>
            <input type="range" min="0.5" max="2.0" step="0.1" bind:value={char.voice.rate} disabled={!is_editing} />
        </div>
        <div class="slider-group" class:locked={is_natural_voice} data-tooltip={is_natural_voice ? "Locked (Natural Voice)" : `Pitch: ${char.voice.pitch.toFixed(1)}`}>
            <input type="range" min="0.5" max="2.0" step="0.1" bind:value={char.voice.pitch} disabled={!is_editing || is_natural_voice} />
        </div>
    </div>
</div>

<style>
    .voice-wing-content {
        background: var(--gunmetal);
        box-shadow: var(--shadow-m);
        border-radius: var(--border-radius-l);
        padding: var(--spacing-m);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-m);
        height: 100%;
        overflow-y: auto;
    }

    .voice-control-row {
        display: flex;
        gap: var(--spacing-xs);
        width: 100%;
        position: relative;
        margin-bottom: calc(-1 * var(--spacing-m)); /* Tighten gap to sliders */
    }

    .dropdown {
        flex: 1;
    }

    .voice-btn {
        width: 100%;
        background: var(--surface-sunken);
        box-shadow: inset 0 0 0 1px rgb(var(--pure-white-rgb) / var(--opacity-xxs));
        border: none;
        border-radius: var(--border-radius);
        color: var(--font-color);
        padding: var(--spacing-s);
        display: flex;
        justify-content: space-between;
        cursor: pointer;
        font-size: var(--font-size-s);
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-right: var(--spacing-s);
        transition: all 0.2s;
    }

    .voice-btn:hover:not(:disabled) {
        background: var(--surface-overlay);
        box-shadow: inset 0 0 0 1px rgb(var(--pure-white-rgb) / var(--opacity-xs));
    }

    .voice-btn:disabled {
        opacity: 0.5;
        cursor: default;
    }

    .preview-btn {
        aspect-ratio: 1;
        width: var(--spacing-xl);
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--surface-sunken);
        box-shadow: inset 0 0 0 1px rgb(var(--pure-white-rgb) / var(--opacity-xxs));
        border: none;
        border-radius: var(--border-radius);
        color: var(--font-color);
        cursor: pointer;
        font-size: var(--font-size-m);
        transition: all var(--transition-speed) ease;
    }

    .preview-btn:hover:not(:disabled) {
        background: var(--surface-overlay);
        box-shadow: inset 0 0 0 1px rgb(var(--pure-white-rgb) / var(--opacity-xs));
    }

    .preview-btn:active:not(:disabled) {
        transform: scale(0.95);
    }

    .preview-btn:disabled {
        opacity: var(--opacity-s);
        cursor: default;
    }

    .dropdown-content {
        display: none;
        position: absolute;
        bottom: 100%;
        left: 0;
        width: 100%;
        background: var(--gunmetal);
        box-shadow:
            0 0 2rem rgb(var(--pure-black-rgb) / 0.8),
            inset 0 0 0 1px rgb(var(--pure-white-rgb) / var(--opacity-xs));
        border: none;
        border-radius: var(--border-radius);
    }

    .dropdown-content.visible {
        display: flex;
        flex-direction: column;
    }

    .voice-option {
        width: 100%;
        padding: 8px 12px;
        background: transparent;
        border: none;
        color: var(--font-color);
        text-align: left;
        font-size: var(--font-size-s);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: var(--spacing-s);
        transition: all 0.2s ease;
    }

    .voice-option:hover {
        background: rgb(var(--pure-white-rgb) / 0.05);
    }

    .voice-option.active {
        color: var(--app-accent);
        background: rgb(var(--app-accent-rgb) / 0.05);
    }

    .voice-option.active .region-pill {
        color: var(--app-accent);
        opacity: 0.8;
    }

    .voice-option .region-pill {
        font-size: var(--font-size-xs);
        text-transform: uppercase;
        font-weight: 700;
        color: var(--font-muted);
        letter-spacing: var(--letter-spacing-m);
        transition: color var(--transition-speed);
    }

    .voice-option .region-pill::before {
        content: "-";
        margin-right: 8px;
        opacity: var(--opacity-m);
    }

    .voice-option .voice-name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
    }

    .sliders {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--spacing-xs);
        margin-top: var(--spacing-xxs);
        width: 100%;
    }

    .slider-group {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: var(--spacing-s);
        border-radius: var(--spacing-xs);
        overflow: visible;
        position: relative;
        transition: all var(--transition-speed) ease;
    }

    .slider-group.locked {
        opacity: var(--opacity-m);
        cursor: not-allowed;
    }

    .slider-group input[type="range"]:disabled {
        cursor: not-allowed;
    }

    .slider-group input[type="range"]:disabled::-webkit-slider-thumb {
        display: none;
    }

    .slider-group input[type="range"] {
        display: block;
        width: calc(100% - var(--spacing-xxs));
        margin: 0 auto;
        height: var(--spacing-s);
        background: transparent;
        appearance: none;
        outline: none;
        border: none;
        padding: 0;
        overflow: visible;
    }

    .slider-group input[type="range"]::-webkit-slider-runnable-track {
        width: 100%;
        height: var(--spacing-px);
        background: rgb(var(--pure-white-rgb) / 0.1);
        border-radius: var(--border-radius-xs);
        border: none;
    }

    .slider-group input[type="range"]::-webkit-slider-thumb {
        appearance: none;
        width: var(--spacing-s);
        height: var(--spacing-s);
        background: var(--font-color);
        border-radius: var(--border-radius-full);
        cursor: pointer;
        box-shadow: 0 0 var(--spacing-xs) rgb(var(--pure-white-rgb) / 0.2);
        margin-top: -6px;
        border: none;
    }
</style>
