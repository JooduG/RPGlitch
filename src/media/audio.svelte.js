/**
 * @file src/media/audio.svelte.js
 * 🔊 SENSORY CORTEX — PROCEDURAL AUDIO SYNTHESIZER & SPEECH ENGINE
 *
 * pure Web Audio procedural SFX synthesizer, lazy AudioContext management,
 * and Web Speech API fallback speech engine.
 */

import { strip_cognition_blocks } from "@utils";
import { VOICE_CADENCE } from "@config";

// ============================================================================
// [SECTION 1: HARDWARE AUDIOCONTEXT & MASTER GAIN]
// ============================================================================

/** @type {AudioContext | null} */
let shared_audio_context = null;
/** @type {GainNode | null} */
let master_gain_node = null;
let current_master_volume = 1.0;
let is_muted = false;

/**
 * Lazily initializes and returns the shared hardware AudioContext.
 * @returns {AudioContext | null}
 */
export function get_audio_context() {
  if (shared_audio_context) return shared_audio_context;
  if (typeof window === "undefined") return null;

  const AudioContextConstructor = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
  if (!AudioContextConstructor) return null;

  shared_audio_context = new AudioContextConstructor();
  master_gain_node = shared_audio_context.createGain();
  master_gain_node.gain.setValueAtTime(is_muted ? 0 : current_master_volume, shared_audio_context.currentTime);
  master_gain_node.connect(shared_audio_context.destination);
  return shared_audio_context;
}

export function get_master_gain() {
  if (!master_gain_node) get_audio_context();
  return master_gain_node;
}

export async function init_audio_on_gesture() {
  const context = get_audio_context();
  if (context && context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      /* Blocked by browser until gesture */
    }
  }
}

export async function suspend_audio() {
  if (shared_audio_context && shared_audio_context.state === "running") {
    try {
      await shared_audio_context.suspend();
    } catch {
      /* Safe no-op */
    }
  }
}

export function close_audio_context() {
  if (shared_audio_context) {
    try {
      shared_audio_context.close();
    } catch {
      /* Safe no-op */
    }
    shared_audio_context = null;
    master_gain_node = null;
  }
}

/**
 * Sets the master volume level [0.0 - 1.0].
 * @param {number} level
 */
export function set_master_volume(level) {
  audio_engine.volume = level;
}

/**
 * Toggles the audio mute state.
 * @returns {boolean} New mute state
 */
export function toggle_mute() {
  audio_engine.is_muted = !audio_engine.is_muted;
  return audio_engine.is_muted;
}

// Auto-unlock on first user interaction if in browser
if (typeof document !== "undefined") {
  const unlock_listener = () => {
    init_audio_on_gesture();
  };
  ["click", "touchstart", "keydown"].forEach((evt) => document.addEventListener(evt, unlock_listener, { once: true }));
}

// ============================================================================
// [SECTION 2: PROCEDURAL SFX SYNTHESIS]
// ============================================================================

/**
 * Plays a procedurally synthesized sound effect.
 * Cleans up all nodes upon playback termination to prevent memory leaks.
 * @param {"click" | "pop" | "glitch" | "alert" | "subtle_hum" | string} type
 * @param {Object} [options={}]
 * @param {number} [options.volume=1.0]
 */
export function play_sfx(type, options = {}) {
  const context = get_audio_context();
  const master_gain = get_master_gain();
  if (!context || !master_gain || is_muted || typeof context.createOscillator !== "function") return;

  if (context.state === "suspended") {
    context.resume().catch(() => {});
  }

  const now = context.currentTime;
  const sfx_gain = context.createGain();
  const volume = Math.max(0, Math.min(1, Number(options.volume ?? 1.0)));
  sfx_gain.connect(master_gain);

  const cleanup = (source, gain) => {
    if (source) {
      source.onended = null;
      try {
        source.disconnect();
      } catch (_err) {
        // Disconnect failure safe ignore
      }
    }
    if (gain) {
      try {
        gain.disconnect();
      } catch (_err) {
        // Disconnect failure safe ignore
      }
    }
  };

  switch (type) {
    case "click": {
      const osc = context.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);

      sfx_gain.gain.setValueAtTime(volume * 0.4, now);
      sfx_gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(sfx_gain);
      osc.onended = () => cleanup(osc, sfx_gain);
      osc.start(now);
      osc.stop(now + 0.03);
      break;
    }

    case "pop": {
      const osc = context.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);

      sfx_gain.gain.setValueAtTime(volume * 0.5, now);
      sfx_gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(sfx_gain);
      osc.onended = () => cleanup(osc, sfx_gain);
      osc.start(now);
      osc.stop(now + 0.05);
      break;
    }

    case "glitch": {
      // Noise buffer glitch
      const buffer_size = Math.floor(context.sampleRate * 0.08);
      const buffer = context.createBuffer(1, buffer_size, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < buffer_size; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = context.createBufferSource();
      noise.buffer = buffer;

      sfx_gain.gain.setValueAtTime(volume * 0.3, now);
      sfx_gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      noise.connect(sfx_gain);
      noise.onended = () => cleanup(noise, sfx_gain);
      noise.start(now);
      break;
    }

    case "alert": {
      const osc = context.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.setValueAtTime(660, now + 0.08);

      sfx_gain.gain.setValueAtTime(volume * 0.5, now);
      sfx_gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(sfx_gain);
      osc.onended = () => cleanup(osc, sfx_gain);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
    }

    case "subtle_hum": {
      const osc = context.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(60, now);

      sfx_gain.gain.setValueAtTime(0.001, now);
      sfx_gain.gain.linearRampToValueAtTime(volume * 0.15, now + 0.1);
      sfx_gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(sfx_gain);
      osc.onended = () => cleanup(osc, sfx_gain);
      osc.start(now);
      osc.stop(now + 0.4);
      break;
    }

    default: {
      // Fallback click
      const osc = context.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      sfx_gain.gain.setValueAtTime(volume * 0.2, now);
      sfx_gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(sfx_gain);
      osc.onended = () => cleanup(osc, sfx_gain);
      osc.start(now);
      osc.stop(now + 0.04);
      break;
    }
  }
}

// ============================================================================
// [SECTION 3: VOICE HELPERS & CADENCES]
// ============================================================================

/** Speech-rate multipliers by cadence (view over config VOICE_CADENCE.RATES — the single home) */
export const CADENCE_RATES = VOICE_CADENCE.RATES;

/** Labeled cadence picker list (view over VOICE_CADENCE.RATES) */
export const VOICE_CADENCES = Object.freeze(
  Object.entries(VOICE_CADENCE.RATES).map(([id, rate]) => Object.freeze({ id, label: id.charAt(0).toUpperCase() + id.slice(1), rate })),
);

export function normalize_role(role, options = {}) {
  if (!role) return null;
  const normalized_string = String(role).trim().toLowerCase();
  if (normalized_string === "system") return null;
  if (normalized_string.includes("user")) return "user";
  if (normalized_string.includes("npc")) return options.preserve_npc ? "npc" : "ai";
  if (normalized_string.includes("fractal")) return options.preserve_npc ? "fractal" : "ai";
  if (normalized_string.includes("ai") || normalized_string.includes("character") || normalized_string === "model") return "ai";
  return null;
}

export function resolve_voice_uri(name_or_uri) {
  if (!name_or_uri) return "default";
  return String(name_or_uri).trim();
}

export function resolve_voice_name(name_or_uri) {
  if (!name_or_uri) return "Standard Voice";
  return String(name_or_uri).trim();
}

export function get_cadence_rate(cadence, dynamics_value = 50) {
  const base_rate = CADENCE_RATES[cadence] || 1.0;
  if (dynamics_value === undefined || dynamics_value === null || isNaN(Number(dynamics_value))) {
    return base_rate;
  }
  const sanitized_dynamics = Math.max(0, Math.min(100, Number(dynamics_value)));
  const offset = (sanitized_dynamics - 50) * VOICE_CADENCE.SHAPING.DYNAMICS_OFFSET;
  return Math.max(VOICE_CADENCE.SHAPING.MIN_RATE, Math.min(VOICE_CADENCE.SHAPING.MAX_RATE, base_rate + offset));
}

// ============================================================================
// [SECTION 4: WEB SPEECH API FALLBACK ENGINE]
// ============================================================================

export class VoiceEngine {
  enabled = true;
  selected_voice = "default";
  rate = 1.0;
  volume = 1.0;
  is_speaking = false;
  active_message_id = null;

  entity_voice = {
    ai: true,
    user: true,
    fractal: true,
  };

  #speech_synth = typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;

  constructor() {}

  async resume_context() {
    await init_audio_on_gesture();
  }

  set_volume(vol) {
    this.volume = Math.max(0, Math.min(1, Number(vol)));
    current_master_volume = this.volume;
    if (master_gain_node && shared_audio_context) {
      master_gain_node.gain.setValueAtTime(is_muted ? 0 : this.volume, shared_audio_context.currentTime);
    }
  }

  /**
   * Positional speak signature: speak(text, should_clear_queue = true, force = false).
   */
  speak(text, should_clear_queue = true, force = false) {
    if (!text) return;
    if (!this.enabled && !force) return;

    if (should_clear_queue) {
      this.stop();
    }

    const clean_text = strip_cognition_blocks(text)
      .replace(/[*_#`~]/g, "")
      .replace(/\[\[(.*?)\]\]/g, "$1")
      .replace(/<[^>]*>/g, "")
      .trim();

    if (!clean_text) return;

    if (!this.#speech_synth) return;

    const utterance = new SpeechSynthesisUtterance(clean_text);
    utterance.volume = this.volume;
    utterance.rate = this.rate;

    utterance.onstart = () => {
      this.is_speaking = true;
    };
    utterance.onend = () => {
      this.is_speaking = false;
    };
    utterance.onerror = () => {
      this.is_speaking = false;
    };

    this.#speech_synth.speak(utterance);
  }

  stop() {
    if (this.#speech_synth) {
      this.#speech_synth.cancel();
    }
    this.is_speaking = false;
  }

  pause() {
    if (this.#speech_synth) {
      this.#speech_synth.pause();
    }
  }

  resume() {
    if (this.#speech_synth) {
      this.#speech_synth.resume();
    }
  }

  toggle_pause() {
    if (!this.#speech_synth) return;
    if (this.#speech_synth.paused) {
      this.#speech_synth.resume();
    } else {
      this.#speech_synth.pause();
    }
  }

  destroy() {
    this.stop();
  }
}

// ============================================================================
// [SECTION 5: AUDIO SINGLETON FACADE]
// ============================================================================

export class AudioEngine {
  voice = new VoiceEngine();
  notifications_enabled = true;

  get volume() {
    return this.voice.volume;
  }

  set volume(vol) {
    this.voice.set_volume(vol);
  }

  get is_muted() {
    return is_muted;
  }

  set is_muted(val) {
    is_muted = Boolean(val);
    if (master_gain_node && shared_audio_context) {
      master_gain_node.gain.setValueAtTime(is_muted ? 0 : current_master_volume, shared_audio_context.currentTime);
    }
  }

  get voice_enabled() {
    return this.voice.enabled;
  }

  set voice_enabled(val) {
    this.voice.enabled = Boolean(val);
  }

  get entity_voice() {
    return this.voice.entity_voice;
  }

  is_role_enabled(role) {
    const norm = normalize_role(role);
    if (!norm) return false;
    return this.voice_enabled && Boolean(this.voice.entity_voice[norm]);
  }

  set_entity_voice(role, is_enabled) {
    const norm = normalize_role(role);
    if (!norm) return;
    const bool = Boolean(is_enabled);
    if (bool) {
      this.voice_enabled = true;
    }
    this.voice.entity_voice[norm] = bool;
  }

  toggle_entity_voice(role) {
    const norm = normalize_role(role);
    if (!norm) return false;
    const next = !this.voice.entity_voice[norm];
    this.set_entity_voice(norm, next);
    if (!next) this.voice.stop();
    return next;
  }

  play(sound_key) {
    play_sfx(sound_key);
  }

  async init() {
    await init_audio_on_gesture();
  }

  destroy() {
    this.voice.destroy();
    close_audio_context();
  }
}

export const audio_engine = new AudioEngine();
export const Audio = audio_engine;
