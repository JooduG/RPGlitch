/**
 * @file src/media/audio.svelte.js
 * 🔊 SENSORY CORTEX - PROCEDURAL AUDIO SYNTHESIZER & SPEECH ENGINE
 *
 * pure Web Audio procedural SFX synthesizer, lazy AudioContext management,
 * and Web Speech API fallback speech engine.
 */

import { VOICE_CADENCE } from "@config";
import { strip_cognition_blocks } from "@utils";

// ============================================================================
// [SECTION 1: HARDWARE AUDIOCONTEXT & MASTER GAIN]
// ============================================================================

/** @type {AudioContext | null} */
let shared_audio_context = null;
/** @type {GainNode | null} */
let master_gain_node = null;
let current_master_volume = 1.0;
// Silent boot: SFX stay off until the user unmutes (Console mute toggle clears this).
let is_muted = true;

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
    // resume() stays pending until the first user gesture in autoplay-blocked
    // contexts (and boot awaits this fn). Race it against a timeout so no
    // caller — boot included — can hang forever on a black page. The pending
    // resume still fulfills on first gesture; unlock listeners below re-run it.
    const resume_attempt = context.resume();
    resume_attempt.catch(() => {
      /* Blocked by browser until gesture */
    });
    try {
      await Promise.race([resume_attempt, new Promise((resolve) => setTimeout(resolve, 1500))]);
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

/** Speech-rate multipliers by cadence (view over config VOICE_CADENCE.RATES - the single home) */
export const CADENCE_RATES = VOICE_CADENCE.RATES;

/** Labeled cadence picker list (view over VOICE_CADENCE.RATES) */
export const VOICE_CADENCES = Object.freeze(
  Object.entries(VOICE_CADENCE.RATES).map(([id, rate]) => Object.freeze({ id, label: id.charAt(0).toUpperCase() + id.slice(1), rate })),
);

/**
 * Maps a speaker role onto a voice-flag key. Unlike normalize_role (which
 * collapses user/fractal into ai for prompt addressing), voice switches are
 * per-role: user and fractal keep their own flags, npc falls back to ai.
 */
export function voice_role_key(role) {
  const norm = normalize_role(role, { preserve_npc: true });
  if (!norm) return null;
  if (norm === "npc") return "ai";
  return norm;
}

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
  // Silent boot: master TTS gate off until the user enables a voice.
  enabled = $state(false);
  selected_voice = "default";
  rate = 1.0;
  volume = $state(1.0);
  is_speaking = $state(false);
  active_message_id = $state(null);

  // Per-role TTS switches. $state so context-menu labels re-render on toggle
  // (a plain object froze the label at its initial value forever).
  // Per-role TTS switches, all off at boot (opt-in per role; enabling any
  // role flips the master gate on via set_entity_voice).
  entity_voice = $state({
    ai: false,
    user: false,
    fractal: false,
  });

  // Browser speech-synthesis voices, loaded async (empty until the engine
  // publishes them). $state so the AudioWing dropdown populates when ready.
  voices = $state([]);

  // Native SpeechSynthesisVoice objects parallel to `voices` (same order).
  // utterance.voice REQUIRES a native voice - the mapped plain objects in
  // `voices` throw "Failed to convert value to 'SpeechSynthesisVoice'".
  #native_voices = [];

  // Streaming TTS buffer: sentences already spoken, keyed off role+message.
  _stream_role = null;
  _stream_emitted_length = 0;

  /**
   * Per-role TTS gate (mirrors AudioEngine.is_role_enabled over this
   * engine's own switches). Lives here because the streaming methods run
   * on the VoiceEngine instance - AudioEngine.is_role_enabled is not in
   * scope as `this` on this class.
   */
  is_role_enabled(role) {
    const norm = voice_role_key(role);
    if (!norm) return false;
    return this.enabled && Boolean(this.entity_voice[norm]);
  }

  #speech_synth = typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;

  constructor() {
    this.load_voices();
  }

  /**
   * (Re)loads the browser voice list. getVoices() is often empty on first
   * call, so this also arms the voiceschanged event for the late arrival.
   */
  load_voices() {
    const synth = this.#speech_synth;
    if (!synth || typeof synth.getVoices !== "function") return [];
    try {
      const list = synth.getVoices() || [];
      if (list.length > 0 && this.voices.length === 0) {
        this.#native_voices = list;
        this.voices = list.map((v) => ({ name: v.name, uri: v.voiceURI || v.name, lang: v.lang || "", local: !!v.localService }));
      }
    } catch {
      /* voice listing is best-effort */
    }
    try {
      if (typeof synth.addEventListener === "function" && !synth.__rpglitch_voices_armed) {
        synth.__rpglitch_voices_armed = true;
        synth.addEventListener("voiceschanged", () => this.load_voices());
      }
    } catch {
      /* older engines without addEventListener */
    }
    return this.voices;
  }

  /**
   * Speaks a short sample line with the given voice (AudioWing preview).
   * Bypasses role gates - the user explicitly asked to hear this voice.
   */
  preview(name_or_uri, rate = 1.0) {
    const previous = this.selected_voice;
    const previous_rate = this.rate;
    this.selected_voice = resolve_voice_uri(name_or_uri) || previous;
    this.rate = Number(rate) || previous_rate;
    try {
      this.speak("The glitch remembers your voice.", true, true);
    } finally {
      this.selected_voice = previous;
      this.rate = previous_rate;
    }
  }

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
    const voice = this.#pick_voice(this.selected_voice);
    if (voice) utterance.voice = voice;

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
    this.reset_stream();
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

  /**
   * Matches a stored voice id (name or uri) against the loaded browser list.
   * @param {string} name_or_uri
   * @returns {SpeechSynthesisVoice|null} Private method - no test seam needed.
   */
  #pick_voice(name_or_uri) {
    if (!name_or_uri || name_or_uri === "default" || this.#native_voices.length === 0) return null;
    const key = String(name_or_uri).trim().toLowerCase();
    return this.#native_voices.find((v) => (v.name || "").toLowerCase() === key || (v.voiceURI || "").toLowerCase() === key) || null;
  }

  /**
   * Streaming TTS: arms the sentence buffer for a live generation. Called by
   * the streaming store when a turn starts speaking.
   */
  apply_stream_role(role, id = null) {
    this._stream_role = role || null;
    this._stream_emitted_length = 0;
    this.active_message_id = id;
  }

  /**
   * Streaming TTS: speaks newly completed sentences from the growing content.
   * Partial trailing sentences stay buffered until they (or flush) complete.
   */
  queue_stream_sentence(content) {
    if (!content || typeof content !== "string") return;
    if (!this.is_role_enabled(this._stream_role)) return;
    const fresh = content.slice(this._stream_emitted_length);
    const sentences = fresh.match(/[^.!?]+[.!?]+["']?/g);
    if (!sentences || sentences.length === 0) return;
    const last = sentences[sentences.length - 1];
    this._stream_emitted_length += fresh.indexOf(last) + last.length;
    const spoken = sentences.join(" ");
    if (spoken.trim()) {
      this.speak(spoken, false, false);
    }
  }

  /**
   * Streaming TTS: speaks whatever trailing fragment remains at turn end.
   */
  flush_stream_remainder(content) {
    if (!content || typeof content !== "string") return;
    if (!this.is_role_enabled(this._stream_role)) {
      this.reset_stream();
      return;
    }
    const tail = content.slice(this._stream_emitted_length).trim();
    this.reset_stream();
    if (tail) {
      this.speak(tail, false, false);
    }
  }

  /** Streaming TTS: clears the sentence buffer without speaking. */
  reset_stream() {
    this._stream_role = null;
    this._stream_emitted_length = 0;
  }
}

// ============================================================================
// [SECTION 5: AUDIO SINGLETON FACADE]
// ============================================================================

export class AudioEngine {
  voice = new VoiceEngine();
  notifications_enabled = $state(false);

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
    const norm = voice_role_key(role);
    if (!norm) return false;
    return this.voice_enabled && Boolean(this.voice.entity_voice[norm]);
  }

  set_entity_voice(role, is_enabled) {
    const norm = voice_role_key(role);
    if (!norm) return;
    const bool = Boolean(is_enabled);
    if (bool) {
      this.voice_enabled = true;
    }
    this.voice.entity_voice[norm] = bool;
  }

  toggle_entity_voice(role) {
    const norm = voice_role_key(role);
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
