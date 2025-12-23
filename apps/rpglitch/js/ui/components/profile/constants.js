export const PROFILE_STRUCTURE = {
  forever: {
    label: "FOREVER (Immutable Core)",
    type: "nested", // Signal to renderer that this contains sub-fields
    fields: {
      physical: {
        label: "Physical (Visual Anchor)",
        placeholder: "Body, Face, Genetics. Used by Image AI.",
        rows: 3,
      },
      mental: {
        label: "Non-Physical (Identity)",
        placeholder: "Personality, Soul, Archetype. Used by Text AI.",
        rows: 4,
      },
    },
  },
  present: {
    label: "PRESENT (Mutable State)",
    type: "nested",
    fields: {
      physical: {
        label: "Physical (Outfit & Items)",
        placeholder: "Clothing, Wounds, Held Items. Used by Image AI.",
        rows: 2,
      },
      mental: {
        label: "Non-Physical (Status & Mood)",
        placeholder: "Current Activity, Emotion. Used by Text AI.",
        rows: 2,
      },
    },
  },
  past: {
    label: "PAST (History)",
    type: "string", // Signal that this is a simple textarea
    placeholder: "Backstory and Trauma.",
    rows: 4,
  },
  future: {
    label: "FUTURE (Destiny)",
    type: "string",
    placeholder: "Goals and Doom.",
    rows: 4,
  },
};
