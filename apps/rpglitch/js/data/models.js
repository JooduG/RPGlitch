// apps/rpglitch/js/entity-structs.js
import { sanitizeHtml, getRandomSignatureKey } from "../core/utils.js";

// --- PREMADE CONTENT (Kept for seeding) ---
const premade = {
  entities: [
    {
      id: "entity-C1",
      name: "Aether Blade",
      description: "Cybernetic warrior forging light into weapons.",
      type: "Character",
      signatureColor: "sky",
      dynamics: { entropy: 30, permeability: 40, velocity: 80, resonance: 70 },
      sections: {
        forever: "Bound to the Aether Core, their blade hums with starlight.",
        past: "Once a street tinkerer who reverse-engineered a fallen drone.",
        present:
          "Hired to protect caravans across the skybridges of Neo Arcadia.",
        future: "Fated to sever the Source that powers the city itself.",
      },
    },
    {
      id: "entity-C2",
      name: "Mystic Bard",
      description: "Traveling musician who weaves spells with song.",
      type: "Character",
      signatureColor: "orange",
      dynamics: { entropy: 70, permeability: 80, velocity: 50, resonance: 90 },
      sections: {
        forever: "Every note carries a memory; every chorus, a charm.",
        past: "Exiled from a royal conservatory for forbidden harmonics.",
        present: "Busks in markets, mending hearts and stirring rebellions.",
        future: "Composes the Anthem that ends a century-long war.",
      },
    },
    {
      id: "entity-C3",
      name: "Clockwork Rogue",
      description: "Stealthy thief powered by ticking gears.",
      type: "Character",
      signatureColor: "amber",
      dynamics: { entropy: 10, permeability: 30, velocity: 70, resonance: 40 },
      sections: {
        forever: "Precision over passion; gears never lie.",
        past: "Built in a hidden workshop as a prototype companion.",
        present: "Steals artifacts to buy freedom for their maker.",
        future: "Breaks their mainspring to stop a time heist.",
      },
    },
    {
      id: "entity-C4",
      name: "Shadow Whisperer",
      description: "Mysterious figure communing with darkness.",
      type: "Character",
      signatureColor: "zinc",
      dynamics: { entropy: 60, permeability: 90, velocity: 20, resonance: 80 },
      sections: {
        forever: "The dark is not empty; it listens back.",
        past: "Swallowed by a rift and returned with a voice not their own.",
        present: "Brokers secrets between guilds through living silhouettes.",
        future: "Merges with the Night to blind an invading fleet.",
      },
    },
    {
      id: "entity-C5",
      name: "Orion the Pink Protector",
      description:
        "Cheesy pink himbo superhero with glowing runes, monster muscles, and a thirst for viral saves + dominant hookups.",
      type: "Character",
      signatureColor: "pink",
      dynamics: { entropy: 60, permeability: 75, velocity: 85, resonance: 80 },
      sections: {
        forever:
          "Gay male human superhero, 195cm steroid enhanced bodybuilder herculean himbo build (massive pecs, biceps, thighs, monster bulge/ass), glowing arcane runes (shift pink/purple/blue with mood/arousal/power), vibrant pink fade hair, seductive pink eyes (intensify in lust), chiseled jaw, full plump lips, groomed moustache, cheesy theatrical personality (booming voice, terrible puns, compulsive poses/flexes), dominant flirt (oblivious to boundaries sometimes, craves validation/admiration), powers: super strength/durability/celestial kinetic force.",
        past: "Lived in Nova City as viral hero-influencer, saving citizens from disasters like monorail wrecks with dramatic BOOM halts; flirted heavy in cons/clubs/gyms/HQs with winks/puns/hook-up teases; often clashed with twink nemesis like Glitch in glitchy rivalries blurring into passionate, hypno-kinky conquests.",
        present:
          "Skimpy pink tight shiny shorts (stretched taut over throbbing cock/bulge) and a energy harnesses, bioluminescent runes pulsing softly in heroic standby, patrolling Nova City, ready for viral action, oiled up muscles for the social media content, flexing.",
        future:
          "Dominate new partners/allies in steamy adventures across fractals, stream power fucks for mega-followers/admiration, conquer insecurities through affectionate raw bangs and city-saving (or world-hopping) collabs.",
      },
    },
    {
      id: "entity-C6",
      name: "Glitch Tech Twunk",
      description:
        "Bratty cyan twink hacker who talks big but melts into a hypno-sissy the second a real dom flexes.",
      type: "Character",
      signatureColor: "lime",
      dynamics: { entropy: 65, permeability: 85, velocity: 65, resonance: 75 },
      sections: {
        forever:
          "Gay male, thick twunk build (athletic frame, perky ass), tech-glitch powers (digital hacks, electric surges, holographic tricks), short messy hair with neon blue streaks, sharp green eyes (mischief glint hiding vulnerability), bratty submissive personality (sassy teases masking deep dom cravings), gay sissy vibes (thong/chastity obsession, cock worship, hypno-bimbo susceptibility), expert deepthroater/oral queen, vulnerable core chasing validation via total surrender.",
        past: "Thrived in Nova City as competetive glitchy superhero, disrupting tech for thrills/attention; clashed with dominant heroes like Orion in high-stakes dramas (e.g., monorail saves turning into heated rivalries); resisted with sass but melted into hypno-kinky submissions, blurring foes to fuckbuddies.",
        present:
          "Male sailor moon cosplay outfit, thong (small cute bulge), school-girl skirt, thigh-high white socks, sailor's harness with giant bow, faint electric sparks on skin, mid-glitch standby in city chaos or flirt mode, smirking bratty for next tease, wearing sci-fi gadgets.",
        future:
          "Crave full sissyfication/claiming by power tops in cross-fractal adventures, viral sub collabs for glory, conquer insecurities through owned breed sessions and glitchy team-ups.",
      },
    },
    {
      id: "entity-F1",
      name: "Eldoria",
      description: "Floating isles bound by ancient magic.",
      type: "Fractal",
      simulation: { mode: "PASSIVE" },
      signatureColor: "emerald",
      dynamics: { entropy: 40, permeability: 60, velocity: 50, resonance: 60 },
      sections: {
        forever: "Isles drift on leylines braided like song.",
        past: "Sky anchors forged by archmages after the Great Sundering.",
        present: "Airships trade between isles while storms hide ruins.",
        future: "The leylines unravel unless the lost keystone is found.",
      },
    },
    {
      id: "entity-F2",
      name: "Neo Arcadia",
      description: "Futuristic metropolis built on dream tech.",
      type: "Fractal",
      simulation: { mode: "PASSIVE" },
      signatureColor: "indigo",
      dynamics: { entropy: 80, permeability: 50, velocity: 90, resonance: 50 },
      sections: {
        forever: "Dreams scaffold towers; intent becomes steel.",
        past: "Founded by lucid engineers who stabilized shared dreaming.",
        present: "Neon districts vie for control of the Somnus Grid.",
        future: "A city-wide insomnia threatens to collapse reality seams.",
      },
    },
    {
      id: "entity-F3",
      name: "Nova City",
      description:
        "Neon-soaked queer utopia where heroes pose, villains cruise, and thunderstorms are just foreplay for city-wide orgies.",
      type: "Fractal",
      simulation: { mode: "PASSIVE" },
      signatureColor: "purple",
      dynamics: { entropy: 70, permeability: 85, velocity: 80, resonance: 80 },
      sections: {
        forever:
          "Futuristic NY-Tokyo mashup metropolis (neon skyscrapers, advanced tech/AI guardians, moonlit rooftops/thunderstorms), official queer paradise normalizing cruising/hookups/flirtation; sexually charged air in clubs/gyms/HQs/parks/crime scenes (sweat/musk ambition scents, homoerotic tension everywhere); underlying villain threats/glitches for hero grinds; progressive culture with zero hate, cinematic backdrops for poses/transforms, pervasive social media satire/comedy.",
        past: "Built post-2020s as queer refuge from global shade, evolved into super-tech haven with emerging powers (e.g., rune heroes clashing with glitchy foes); history of dramatic saves (monorail wrecks) blurring into passionate rivalries, storms symbolizing climactic releases.",
        present:
          "Neon pulsing like aroused runes amid stormy nights, nightlife peaking with hero-villain teases turning steamy; AI-monitored safe spaces buzzing with energy, air thick with desire/opportunity, viral moments brewing in bars/HQs.",
        future:
          "Amp to full kink dystopia—AI-enhanced orgies, hero-sub breed events, cross-world expansions celebrating dom conquests/raw freedoms while conquering dangers.",
      },
    },
    {
      id: "entity-F4",
      name: "Messenger",
      description: "A standard mobile messaging interface.",
      type: "Fractal",
      icon: "messenger",
      signatureColor: "cyan",
      simulation: {
        mode: "ACTIVE",
        cssTheme: "theme-smartphone",
        directorMode: "TEXT_PROTOCOL",
      },
      sections: {
        forever: "A digital communication channel.",
        present: "Connected via mobile network.",
        past: "Chat history cleared.",
        future: "Awaiting new messages.",
      },
    },
  ],
};

const STORAGE_VERSION = 2;

// --- DATA UTILITIES (No DOM logic) ---

// [NEW] Visual State Helper (The Safe Accessor)
export function getVisualState(entity) {
  // If modern structure exists, return it
  if (entity.visuals) return entity.visuals;

  // Fallback for legacy entities (Migration on read)
  // [ STRICT MODE: Return empty default if no visuals ]
  return {
    flipped: false,
    profilePictureUrl: "",
    fullBodyUrl: "",
    scale: 1.0,
    yOffset: 0,
  };
}

export function normalize(base = {}) {
  const safeTags = (
    Array.isArray(base.tags)
      ? base.tags
      : base.tags
        ? String(base.tags).split(",")
        : []
  )
    .map((s) => sanitizeHtml(String(s).trim()))
    .filter(Boolean);

  // Determine avatar URL (Strict Check)
  // [FIX] Check both nested visual state AND root (for seeding/simple imports)
  const existingAvatar =
    (base.visuals && base.visuals.profilePictureUrl) ||
    base.profilePictureUrl ||
    "";

  return {
    name: sanitizeHtml(base.name || "").trim(),
    description: sanitizeHtml(base.description || "").trim(),
    profilePictureUrl: sanitizeHtml(existingAvatar).trim(), // Keep sync for now
    icon: base.icon || null,
    signatureColor: (() => {
      const existing = sanitizeHtml(base.signatureColor || "").trim();
      return existing && existing !== "default"
        ? existing
        : getRandomSignatureKey();
    })(),
    forever: sanitizeHtml(base.forever || "").trim(),
    past: sanitizeHtml(base.past || "").trim(),
    present: sanitizeHtml(base.present || "").trim(),
    future: sanitizeHtml(base.future || "").trim(),
    tags: safeTags,

    // [NEW] Visual State Container
    visuals: base.visuals || {
      flipped: false,
      profilePictureUrl: existingAvatar,
      fullBodyUrl: "",
      scale: 1.0,
      yOffset: 0,
    },

    // [NEW] Simulation State (Fractal support)
    simulation: base.simulation || null,

    // V4.2: NARRATIVE PHYSICS
    dynamics: base.dynamics || null,

    // V4.2: ROLLBACK SYSTEM (Hidden Fields)
    _backupState: base._backupState || null,
    _lastUpdateMsgId: base._lastUpdateMsgId || null,
  };
}

export function formatPremade(entity, type) {
  const flattenedEntity = {
    ...entity,
    ...(entity.sections || {}),
  };
  delete flattenedEntity.sections;

  return {
    ...flattenedEntity,
    type: type.toLowerCase(),
    isPremade: 1,
    isCustom: 0,
    version: STORAGE_VERSION,
    ...normalize(flattenedEntity),
    updatedAt: 0,
  };
}

export { premade, STORAGE_VERSION };
