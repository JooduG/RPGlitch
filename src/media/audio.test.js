/**
 * @file src/media/audio.test.js
 * Unit tests verifying audio engine and premade voice configurations.
 */
import { describe, expect, it } from "vitest";
import { premade } from "@data";
import { CADENCE_RATES, VOICE_CADENCES, get_cadence_rate, resolve_voice_name, resolve_voice_uri, split_speech_sentences } from "./audio.svelte.js";

describe("Audio & Voice Configurations", () => {
  it("assigns valid voice configurations to all premade fractals", () => {
    const fractals = premade.entities.filter((e) => e.type === "fractal");
    expect(fractals.length).toBeGreaterThan(0);

    fractals.forEach((fractal) => {
      expect(fractal.voice).toBeDefined();
      expect(typeof (fractal.voice.name || fractal.voice.uri)).toBe("string");
      expect(typeof fractal.voice.cadence).toBe("string");
    });
  });

  it("resolves every premade voice name to a real catalog voice", () => {
    const fractals = premade.entities.filter((e) => e.type === "fractal");
    for (const fractal of fractals) {
      const uri = resolve_voice_uri(fractal.voice.name || fractal.voice.uri);
      expect(uri).not.toBe("");
      const round_trip = resolve_voice_name(uri);
      expect(round_trip).not.toBe("Cinematic Narrator");
    }
  });

  it("resolves voice uris by both catalog name and uri", () => {
    expect(resolve_voice_uri("Theatrical Showman")).toBe("am_santa");
    expect(resolve_voice_uri("am_santa")).toBe("am_santa");
    expect(resolve_voice_uri("Warm Anchor")).toBe("af_heart");
  });

  it("falls back to the default voice for unknown names", () => {
    expect(resolve_voice_uri("Vanguard")).toBe("am_adam");
    expect(resolve_voice_uri("")).toBe("am_adam");
    expect(resolve_voice_uri(null)).toBe("am_adam");
  });

  it("resolves voice names by both catalog uri and name", () => {
    expect(resolve_voice_name("af_heart")).toBe("Warm Anchor");
    expect(resolve_voice_name("Warm Anchor")).toBe("Warm Anchor");
    expect(resolve_voice_name("")).toBe("Cinematic Narrator");
  });

  it("maps cadence ids to symmetric rates with standard in the center", () => {
    expect(VOICE_CADENCES).toHaveLength(5);
    expect(VOICE_CADENCES[2]).toEqual({ id: "standard", label: "Standard", rate: 1.0 });
    expect(CADENCE_RATES.standard).toBe(1.0);
    expect(get_cadence_rate("drawl")).toBe(0.85);
    expect(get_cadence_rate("rapid")).toBe(1.2);
    expect(get_cadence_rate("unknown_cadence")).toBe(1.0);
    expect(get_cadence_rate(undefined)).toBe(1.0);
  });

  it("assigns only valid cadences to all premade fractals", () => {
    const fractals = premade.entities.filter((e) => e.type === "fractal");
    for (const fractal of fractals) {
      expect(VOICE_CADENCES.some((c) => c.id === fractal.voice.cadence)).toBe(true);
    }
  });

  it("keeps quoted dialogue attached to its attribution when splitting sentences", () => {
    const { sentences, tail, committed } = split_speech_sentences(`"Run!" he shouted. "Don't look back."`);
    expect(sentences).toEqual([`"Run!" he shouted.`, `"Don't look back."`]);
    expect(tail).toBe("");
    expect(committed).toBe(`"Run!" he shouted. "Don't look back."`.length);
  });

  it("does not split inside a quoted span or on contractions", () => {
    const { sentences, tail } = split_speech_sentences(`He said, "hi there." Don't you dare move.`);
    expect(sentences).toEqual([`He said, "hi there."`, `Don't you dare move.`]);
    expect(tail).toBe("");
  });

  it("reports an incomplete trailing sentence as tail without committing it", () => {
    const { sentences, committed, tail } = split_speech_sentences(`Hello world. Not done yet`);
    expect(sentences).toEqual(["Hello world."]);
    expect(tail).toBe("Not done yet");
    expect(committed).toBe("Hello world.".length);
  });

  it("toggles pause state and clears paused state on stop", async () => {
    const { Audio } = await import("./audio.svelte.js");
    expect(Audio.voice.is_paused).toBe(false);

    Audio.voice.pause();
    expect(Audio.voice.is_paused).toBe(true);

    Audio.voice.toggle_pause();
    expect(Audio.voice.is_paused).toBe(false);

    Audio.voice.pause();
    expect(Audio.voice.is_paused).toBe(true);

    Audio.voice.stop();
    expect(Audio.voice.is_paused).toBe(false);
  });

  it("prevents stream sentence queueing after stop() is called", async () => {
    const { Audio } = await import("./audio.svelte.js");
    Audio.voice.reset_stream();
    Audio.voice.stop();
    Audio.voice.queue_stream_sentence("This is sentence one. This is sentence two.");
    expect(Audio.voice.is_speaking).toBe(false);

    Audio.voice.reset_stream();
    expect(Audio.voice.spoken_character_cursor).toBe(0);
  });

  it("calculates linear +-5% cadence rate modulation centered at dynamics 50", () => {
    expect(get_cadence_rate("drawl", 50)).toBeCloseTo(0.85);
    expect(get_cadence_rate("drawl", 0)).toBeCloseTo(0.8);
    expect(get_cadence_rate("drawl", 100)).toBeCloseTo(0.9);

    expect(get_cadence_rate("standard", 50)).toBeCloseTo(1.0);
    expect(get_cadence_rate("standard", 0)).toBeCloseTo(0.95);
    expect(get_cadence_rate("standard", 100)).toBeCloseTo(1.05);

    expect(get_cadence_rate("rapid", 50)).toBeCloseTo(1.2);
    expect(get_cadence_rate("rapid", 0)).toBeCloseTo(1.15);
    expect(get_cadence_rate("rapid", 100)).toBeCloseTo(1.25);
  });

  it("parses typographic segments for italics, bold, and all-caps emphasis", () => {
    const { segments } = split_speech_sentences(`He whispered, *be quiet*. **Look out!** THEY ARE HERE.`);
    expect(segments).toBeDefined();
    expect(segments.length).toBeGreaterThan(0);
    expect(segments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ style: "italics", text: "be quiet" }),
        expect.objectContaining({ style: "bold", text: "Look out!" }),
        expect.objectContaining({ style: "all_caps", text: "THEY ARE HERE." }),
      ]),
    );
  });
});
