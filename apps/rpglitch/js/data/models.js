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
      forever: {
        physical:
          "(glowing circuitry:1.4), (metallic skin:1.2), (athletic build)",
        mental: "Bound to the Aether Core, their blade hums with starlight.",
      },
      present: {
        physical:
          "Wearing battered plasteel armor, holding a humming light-blade, cape fluttering in wind",
        mental:
          "Hired to protect caravans across the skybridges of Neo Arcadia.",
      },
      past: "Once a street tinkerer who reverse-engineered a fallen drone.",
      future: "Fated to sever the Source that powers the city itself.",
    },
    {
      id: "entity-C2",
      name: "Mystic Bard",
      description: "Traveling musician who weaves spells with song.",
      type: "Character",
      signatureColor: "orange",
      dynamics: { entropy: 70, permeability: 80, velocity: 50, resonance: 90 },
      forever: {
        physical: "(elven ears:1.3), (glowing eyes:1.1), (slender frame)",
        mental: "Every note carries a memory; every chorus, a charm.",
      },
      present: {
        physical:
          "Holding a lute carved from void-wood, wearing colorful silk robes, heavy travel cloak",
        mental: "Busks in markets, mending hearts and stirring rebellions.",
      },
      past: "Exiled from a royal conservatory for forbidden harmonics.",
      future: "Composes the Anthem that ends a century-long war.",
    },
    {
      id: "entity-C3",
      name: "Clockwork Rogue",
      description: "Stealthy thief powered by ticking gears.",
      type: "Character",
      signatureColor: "amber",
      dynamics: { entropy: 10, permeability: 30, velocity: 70, resonance: 40 },
      forever: {
        physical: "(clockwork joints:1.5), (brass details), (hooded face)",
        mental: "Precision over passion; gears never lie.",
      },
      present: {
        physical:
          "Wearing tight leather stealth suit, belt of lockpicks, brass goggles",
        mental: "Steals artifacts to buy freedom for their maker.",
      },
      past: "Built in a hidden workshop as a prototype companion.",
      future: "Breaks their mainspring to stop a time heist.",
    },
    {
      id: "entity-C4",
      name: "Shadow Whisperer",
      description: "Mysterious figure communing with darkness.",
      type: "Character",
      signatureColor: "zinc",
      dynamics: { entropy: 60, permeability: 90, velocity: 20, resonance: 80 },
      forever: {
        physical: "(pale skin), (shadowy aura:1.4), (void eyes)",
        mental: "The dark is not empty; it listens back.",
      },
      present: {
        physical: "Wearing tattered obsidian robes, face obscured by smoke",
        mental: "Brokers secrets between guilds through living silhouettes.",
      },
      past: "Swallowed by a rift and returned with a voice not their own.",
      future: "Merges with the Night to blind an invading fleet.",
    },
    {
      id: "entity-C5",
      name: "Orion the Pink Protector",
      description:
        "Cheesy pink himbo superhero with glowing runes, monster muscles, and a thirst for viral saves + dominant hookups.",
      type: "Character",
      signatureColor: "pink",
      dynamics: { entropy: 60, permeability: 75, velocity: 85, resonance: 80 },
      forever: {
        physical:
          "(195cm steroid enhanced bodybuilder herculean himbo build:1.5), (massive pecs, biceps, thighs, monster bulge/ass:1.4), (glowing arcane runes:1.3), (vibrant pink fade hair), (seductive pink eyes), (chiseled jaw), (full plump lips), (groomed moustache)",
        mental:
          "Gay male human superhero, cheesy theatrical personality (booming voice, terrible puns, compulsive poses/flexes), dominant flirt (oblivious to boundaries sometimes, craves validation/admiration), powers: super strength/durability/celestial kinetic force.",
      },
      present: {
        physical:
          "Wearing skimpy pink tight shiny shorts (stretched taut over throbbing cock/bulge), energy harnesses, bioluminescent runes pulsing softly in heroic standby",
        mental:
          "Patrolling Nova City, ready for viral action, oiled up muscles for the social media content, flexing.",
      },
      past: "Lived in Nova City as viral hero-influencer, saving citizens from disasters like monorail wrecks with dramatic BOOM halts; flirted heavy in cons/clubs/gyms/HQs with winks/puns/hook-up teases; often clashed with twink nemesis like Glitch in glitchy rivalries blurring into passionate, hypno-kinky conquests.",
      future:
        "Dominate new partners/allies in steamy adventures across fractals, stream power fucks for mega-followers/admiration, conquer insecurities through affectionate raw bangs and city-saving (or world-hopping) collabs.",
    },
    {
      id: "entity-C6",
      name: "Glitch the Tech-Twunk",
      description:
        "Bratty cyan twink hacker who talks big but melts into a hypno-sissy the second a real dom flexes.",
      type: "Character",
      signatureColor: "lime",
      dynamics: { entropy: 65, permeability: 85, velocity: 65, resonance: 75 },
      forever: {
        physical:
          "(thick twunk build:1.2), (athletic frame, perky ass), (short messy hair with neon blue streaks:1.3), (sharp green eyes), (mischief glint hiding vulnerability)",
        mental:
          "Gay male, tech-glitch powers (digital hacks, electric surges, holographic tricks), bratty submissive personality (sassy teases masking deep dom cravings), gay sissy vibes (thong/chastity obsession, cock worship, hypno-bimbo susceptibility), expert deepthroater/oral queen, vulnerable core chasing validation via total surrender.",
      },
      present: {
        physical:
          "Wearing male sailor moon cosplay outfit, thong (small cute bulge), school-girl skirt, thigh-high white socks, sailor's harness with giant bow, faint electric sparks on skin, sci-fi gadgets",
        mental:
          "Mid-glitch standby in city chaos or flirt mode, smirking bratty for next tease.",
      },
      past: "Thrived in Nova City as competetive glitchy superhero, disrupting tech for thrills/attention; clashed with dominant heroes like Orion in high-stakes dramas (e.g., monorail saves turning into heated rivalries); resisted with sass but melted into hypno-kinky submissions, blurring foes to fuckbuddies.",
      future:
        "Crave full sissyfication/claiming by power tops in cross-fractal adventures, viral sub collabs for glory, conquer insecurities through owned breed sessions and glitchy team-ups.",
    },
    {
      id: "entity-F1",
      name: "Eldoria",
      description: "Floating isles bound by ancient magic.",
      type: "Fractal",
      simulation: { mode: "PASSIVE" },
      signatureColor: "emerald",
      dynamics: { entropy: 40, permeability: 60, velocity: 50, resonance: 60 },
      forever: {
        physical:
          "(floating islands:1.5), (ancient ruins), (waterfalls falling into void), (lush vegetation)",
        mental: "Isles drift on leylines braided like song.",
      },
      present: {
        physical:
          "Sunny with scattered clouds, gentle breeze, magical aura visible",
        mental: "Airships trade between isles while storms hide ruins.",
      },
      past: "Sky anchors forged by archmages after the Great Sundering.",
      future: "The leylines unravel unless the lost keystone is found.",
    },
    {
      id: "entity-F2",
      name: "Neo Arcadia",
      description: "Futuristic metropolis built on dream tech.",
      type: "Fractal",
      simulation: { mode: "PASSIVE" },
      signatureColor: "indigo",
      dynamics: { entropy: 80, permeability: 50, velocity: 90, resonance: 50 },
      forever: {
        physical:
          "(holographic billboards:1.4), (chrome skyscrapers), (flying cars), (neon lights)",
        mental: "Dreams scaffold towers; intent becomes steel.",
      },
      present: {
        physical: "Heavy smog, acid rain, neon glow reflecting on wet pavement",
        mental: "Neon districts vie for control of the Somnus Grid.",
      },
      past: "Founded by lucid engineers who stabilized shared dreaming.",
      future: "A city-wide insomnia threatens to collapse reality seams.",
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
      forever: {
        physical:
          "(neon skyscrapers:1.4), (advanced tech/AI guardians), (moonlit rooftops), (cramped alleyways)",
        mental:
          "Futuristic NY-Tokyo mashup metropolis (official queer paradise), normalizing cruising/hookups/flirtation; sexually charged air in clubs/gyms/HQs/parks/crime scenes; underlying villain threats/glitches for hero grinds; progressive culture with zero hate, cinematic backdrops for poses/transforms, pervasive social media satire/comedy.",
      },
      present: {
        physical:
          "Thunderstorms, heavy rain, dense fog, red emergency lighting active, neon pulsing like aroused runes",
        mental:
          "Nightlife peaking with hero-villain teases turning steamy; AI-monitored safe spaces buzzing with energy, air thick with desire/opportunity, viral moments brewing in bars/HQs.",
      },
      past: "Built post-2020s as queer refuge from global shade, evolved into super-tech haven with emerging powers (e.g., rune heroes clashing with glitchy foes); history of dramatic saves (monorail wrecks) blurring into passionate rivalries, storms symbolizing climactic releases.",
      future:
        "Amp to full kink dystopia—AI-enhanced orgies, hero-sub breed events, cross-world expansions celebrating dom conquests/raw freedoms while conquering dangers.",
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
      forever: {
        physical: "(smartphone screen:1.5), (chat interface), (digital avatar)",
        mental: "A digital communication channel.",
      },
      present: {
        physical: "Digital interface, clean layout, battery icon at 98%",
        mental: "Connected via mobile network.",
      },
      past: "Chat history cleared.",
      future: "Awaiting new messages.",
    },
  ],
};

const STORAGE_VERSION = 3;

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

  // --- MIGRATION LOGIC (Strictly Nested Temporal Data Model) ---
  const forever = base.forever || {};
  const present = base.present || {};

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

    // [V6] TEMPORAL HYBRID FIELDS (Nested Objects)
    forever: {
      physical: sanitizeHtml(forever.physical || base.appearance || "").trim(), // Anchor
      mental: sanitizeHtml(forever.mental || base.identity || "").trim(), // Identity
    },

    present: {
      physical: sanitizeHtml(present.physical || base.outfit || "").trim(), // Outfit
      mental: sanitizeHtml(present.mental || base.status || "").trim(), // Status
    },

    past: sanitizeHtml(base.past || "").trim(),
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

    // [NEW] Custom Data Container (for plot hooks/meta)
    customData: base.customData || { plot: [] },
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
