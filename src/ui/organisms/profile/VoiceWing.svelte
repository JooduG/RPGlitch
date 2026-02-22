<script>
    import { Audio } from "@media/audio.js"
    import Tooltip from "@ui/atoms/Tooltip.svelte"

    let { char = $bindable(), isEditing } = $props()

    let showVoiceDropdown = $state(false)
    let hoveredSlider = $state(null) // "rate" or "pitch"
    let activeSlider = $state(null)

    // Refs & Tooltip State
    let rateInput = $state()
    let pitchInput = $state()
    let rateX = $state(null)
    let pitchX = $state(null)

    // Global release handler for sliders
    function handleGlobalUp() {
        activeSlider = null
    }

    // Dynamic Tooltip Positioning
    function updateTooltipX(type) {
        const el = type === "rate" ? rateInput : pitchInput
        const val = type === "rate" ? char.voice.rate : char.voice.pitch
        if (!el) return

        const min = parseFloat(el.min)
        const max = parseFloat(el.max)
        const ratio = (val - min) / (max - min)

        // CSS Logic: Input Width = calc(100% - 4px). Margin 0 auto.
        // The Tooltip is relative to .slider-group (parent).
        // Input offsetLeft should account for the auto margin.
        const width = el.clientWidth
        const thumbWidth = 12
        const trackWidth = width - thumbWidth
        const thumbPos = ratio * trackWidth + thumbWidth / 2

        const pos = el.offsetLeft + thumbPos

        if (type === "rate") rateX = pos
        else pitchX = pos
    }

    // Watch for value changes
    $effect(() => {
        updateTooltipX("rate")
        updateTooltipX("pitch")
    })

    // Voice metadata
    const selectedVoice = $derived(Audio.voice.voices.find((v) => v.uri === char.voice.uri))
    const isNaturalVoice = $derived(selectedVoice?.name.includes("Natural"))

    // Voice name normalization
    function formatVoiceName(name) {
        return name
            .replace(/Microsoft\s+/gi, "")
            .replace(/\s+Online\s+\(Natural\)/gi, "")
            .replace(/\s+-\s+English\s+\(.*\)/gi, "")
            .trim()
    }
</script>

<div class="voice-wing-content" onmouseleave={() => (showVoiceDropdown = false)} role="presentation">
    <div class="voice-control-row">
        <div class="dropdown">
            <button class="voice-btn" type="button" disabled={!isEditing} onclick={() => (showVoiceDropdown = !showVoiceDropdown)}>
                {formatVoiceName(Audio.voice.voices.find((v) => v.uri === char.voice.uri)?.name || "Select Voice")}
            </button>
            <div class="dropdown-content" class:visible={showVoiceDropdown}>
                {#each Audio.voice.voices as voice (voice.uri)}
                    <button
                        class="voice-option"
                        class:active={char.voice.uri === voice.uri}
                        onclick={() => {
                            char.voice.uri = voice.uri
                            showVoiceDropdown = false
                        }}
                    >
                        <span class="voice-name">{formatVoiceName(voice.name)}</span>
                        <span class="region-pill">{voice.region}</span>
                    </button>
                {/each}
            </div>
        </div>

        <button class="preview-btn" type="button" title="Preview Voice" disabled={!isEditing || !char.voice.uri} onclick={() => Audio.voice.preview(char.voice.uri, char.voice.rate, char.voice.pitch)}> 🔊 </button>
    </div>

    <div class="sliders" onpointerup={handleGlobalUp}>
        <div
            class="slider-group"
            onmouseenter={() => {
                hoveredSlider = "rate"
                updateTooltipX("rate")
            }}
            onmouseleave={() => (hoveredSlider = null)}
            role="presentation"
        >
            <Tooltip text={`Rate: ${char.voice.rate.toFixed(1)}x`} visible={hoveredSlider === "rate" || activeSlider === "rate"} x={rateX} />
            <input
                bind:this={rateInput}
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                bind:value={char.voice.rate}
                disabled={!isEditing}
                onpointerdown={() => {
                    activeSlider = "rate"
                    updateTooltipX("rate")
                }}
                oninput={() => updateTooltipX("rate")}
            />
        </div>
        <div
            class="slider-group"
            class:locked={isNaturalVoice}
            onmouseenter={() => {
                hoveredSlider = "pitch"
                updateTooltipX("pitch")
            }}
            onmouseleave={() => (hoveredSlider = null)}
            role="presentation"
        >
            <Tooltip text={isNaturalVoice ? "Pitch locked: Natural voices ignore manual pitch adjustments" : `Pitch: ${char.voice.pitch.toFixed(1)}`} visible={hoveredSlider === "pitch" || activeSlider === "pitch"} x={pitchX} />
            <input
                bind:this={pitchInput}
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                bind:value={char.voice.pitch}
                disabled={!isEditing || isNaturalVoice}
                onpointerdown={() => {
                    activeSlider = "pitch"
                    updateTooltipX("pitch")
                }}
                oninput={() => updateTooltipX("pitch")}
            />
        </div>
    </div>
</div>

<style lang="scss">
    @use "../../../theme/abstracts/placeholders" as *;

    .voice-wing-content {
        @extend %material-glass-heavy;
        padding: var(--spacing-l);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-l);
        color: white;
        background: var(--chalk, #222326);
        background-image: radial-gradient(circle at bottom left, rgba(255, 255, 255, 0.05) 10%, transparent 70%);
        border-radius: inherit;
        height: 100%;
    }

    .voice-control-row {
        display: flex;
        gap: var(--spacing-xs);
        width: 100%;
        position: relative;
        margin-bottom: -15px; /* Tighten gap to sliders */

        .dropdown {
            flex: 1;
            /* Removed position: relative */

            .voice-btn {
                width: 100%;
                background: rgba(255, 255, 255, 0.05);
                border: 0; /* Semi-flat */
                border-radius: var(--border-radius);
                color: white;
                padding: var(--spacing-s);
                display: flex;
                justify-content: space-between;
                cursor: pointer;
                font-size: 0.85rem;
                text-align: left;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                padding-right: var(--spacing-,);

                &:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            }
        }

        .preview-btn {
            aspect-ratio: 1;
            width: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.05);
            border: 0; /* Semi-flat */
            border-radius: var(--border-radius);
            color: white;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.2s ease;

            &:hover:not(:disabled) {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(255, 255, 255, 0.3);
            }

            &:active:not(:disabled) {
                transform: scale(0.95);
            }

            &:disabled {
                opacity: 0.3;
                cursor: default;
            }
        }
    }

    .dropdown-content {
        display: none;
        position: absolute;
        bottom: 100%;
        left: 0;
        width: 100%; /* Spans full .voice-control-row width now */
        background: var(--app-background);
        border: 0; /* Semi-flat */
        border-radius: var(--border-radius);
        z-index: 10;
        max-height: 12rem;
        overflow-y: auto;
        box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.5);

        &.visible {
            display: flex;
            flex-direction: column;
        }
    }

    .voice-option {
        width: 100%;
        padding: 8px 12px;
        background: transparent;
        border: none;
        color: white;
        text-align: left;
        font-size: 0.8rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: all 0.2s ease;

        &:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        &.active {
            color: var(--app-accent);
            .region-pill {
                color: var(--app-accent);
                opacity: 0.6;
            }
        }

        .region-pill {
            font-size: 0.65rem;
            text-transform: uppercase;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.4);
            letter-spacing: 0.05em;
            transition: color 0.2s;

            &::before {
                content: "-";
                margin-right: 8px;
                opacity: 0.4;
            }
        }

        .voice-name {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
        }
    }

    .sliders {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--spacing-,);
        margin-top: 4px; /* Ultra-tightened from 4px */
        width: 100%;

        .slider-group {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 10px;
            border-radius: var(--spacing-xs);
            overflow: visible;
            position: relative;
            transition: all 0.3s ease;

            &.locked {
                opacity: 0.5;
                cursor: not-allowed;
            }

            input[type="range"]:disabled {
                cursor: not-allowed;
                &::-webkit-slider-thumb {
                    display: none;
                }
            }

            input[type="range"] {
                display: block;
                width: calc(100% - 4px);
                margin: 0 auto;
                height: 12px;
                background: transparent;
                appearance: none;
                outline: none;
                border: none;
                padding: 0;
                overflow: visible;

                &::-webkit-slider-runnable-track {
                    width: 100%;
                    height: 2px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 1px;
                    border: none;
                }

                &::-webkit-slider-thumb {
                    appearance: none;
                    width: 12px;
                    height: 12px;
                    background: white;
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
                    margin-top: -5px;
                    border: none;
                }
            }
        }
    }
</style>
