import { describe, expect, it } from "vitest";
import { apply_profile_to_entity } from "./profile.js";

describe("apply_profile_to_entity", () => {
  it("maps flat appearance/personality keys onto the Twin-Cylinder leaves", () => {
    const entity = { eternal: {}, present: {} };
    apply_profile_to_entity(entity, {
      appearance: "Tall, silver-eyed.",
      personality: "Dry wit, fiercely loyal.",
      current_look: "Worn coat, brass compass.",
      state_of_mind: "Guarded but amused.",
    });
    expect(entity.eternal.physical).toBe("Tall, silver-eyed.");
    expect(entity.eternal.non_physical).toBe("Dry wit, fiercely loyal.");
    expect(entity.present.physical).toBe("Worn coat, brass compass.");
    expect(entity.present.non_physical).toBe("Guarded but amused.");
  });

  it("sets name trimmed and clipped to 80 characters", () => {
    const entity = {};
    apply_profile_to_entity(entity, { name: "  " + "A".repeat(90) + "  " });
    expect(entity.name).toBe("A".repeat(80));
  });

  it("appends past prose entries as pinned memory vectors", () => {
    const entity = { past: [] };
    apply_profile_to_entity(entity, { past: ["Washed ashore at Mournhold.", "Captured a smuggler's trust."] });
    expect(entity.past).toHaveLength(2);
    expect(entity.past[0].content).toBe("Washed ashore at Mournhold.");
    expect(entity.past[0].type).toBe("past");
    expect(entity.past[0].id.startsWith("usr_")).toBe(true);
  });

  it("sets future prose and clips tags to the 30-cap", () => {
    const entity = {};
    const tags = Array.from({ length: 40 }, (_, i) => `tag-${i}`);
    apply_profile_to_entity(entity, { future: "  The long road home.  ", tags });
    expect(entity.future).toBe("The long road home.");
    expect(entity.tags).toHaveLength(30);
  });

  it("shallow-copies string leaves from nested flat objects", () => {
    const entity = {};
    apply_profile_to_entity(entity, { dynamics: { openness: "60", note: "steady" } });
    expect(entity.dynamics).toEqual({ openness: "60", note: "steady" });
  });

  it("skips identity/asset keys and tolerates missing profiles", () => {
    const entity = {};
    apply_profile_to_entity(entity, { profile_picture: "data:img", image: "x", id: "1", type: "character", name: "Vael" });
    expect(entity.profile_picture).toBeUndefined();
    expect(entity.image).toBeUndefined();
    expect(entity.id).toBeUndefined();
    expect(entity.type).toBeUndefined();
    expect(entity.name).toBe("Vael");
    expect(apply_profile_to_entity(entity, null)).toBe(entity);
    expect(apply_profile_to_entity(entity, "nope")).toBe(entity);
  });
});
