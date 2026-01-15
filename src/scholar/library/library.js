/**
 * src/js/scholar/library.js
 * THE LIBRARY (Data Models & Seeds)
 * Contains the immutable definitions of premade entities and the normalization logic (Schema).
 */

import {
  sanitizeHtml,
  getRandomSignatureKey,
} from "../../js/gamemaster/utils.js";

export const STORAGE_VERSION = 3;

// ============================================================================
// 1. THE CANON (Premade Entities)
// ============================================================================

export const premade = {
  entities: [
    {
      id: "entity-C1",
      name: "Light Blade",
      description: "Cybernetic warrior forging light into weapons.",
      type: "Character",
      signatureColor: "yellow",
      voiceRate: 1.0,
      voicePitch: 1.0,
      dynamics: { entropy: 45, permeability: 40, velocity: 60, resonance: 55 },
      eternal: {
        physical:
          "(glowing circuitry:1.4), (metallic skin:1.2), (athletic build)",
        mental: "Bound to Light Core, blade hums with starlight.",
      },
      present: {
        physical:
          "Wearing battered plasteel armor, holding humming light-blade, cape fluttering in wind",
        mental: "Hired to protect caravans across skybridges of Neo Arcadia.",
      },
      past: "Once street tinkerer who reverse-engineered a fallen drone.",
      future: "Fated to sever Source that powers city itself.",
    },
    {
      id: "entity-C2",
      name: "Mystic Bard",
      description: "Traveling musician who weaves spells with song.",
      type: "Character",
      voiceId: "Zira",
      signatureColor: "orange",
      voiceRate: 1.0,
      voicePitch: 1.0,
      dynamics: { entropy: 55, permeability: 60, velocity: 50, resonance: 60 },
      eternal: {
        physical: "(elven ears:1.3), (glowing eyes:1.1), (slender frame)",
        mental: "Every note carries a memory; every chorus, a charm.",
      },
      present: {
        physical:
          "Holding lute carved from void-wood, wearing colorful silk robes, heavy travel cloak",
        mental: "Busks in markets, mending hearts and stirring rebellions.",
      },
      past: "Exiled from royal conservatory for forbidden harmonics.",
      future: "Composes Anthem that ends century-long war.",
    },
    {
      id: "entity-C3",
      name: "Clockwork Rogue",
      description: "Stealthy thief powered by ticking gears.",
      type: "Character",
      signatureColor: "lime",
      voiceRate: 1.1,
      voicePitch: 1.0,
      dynamics: { entropy: 40, permeability: 40, velocity: 55, resonance: 45 },
      eternal: {
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
      voiceId: "Zira",
      signatureColor: "zinc",
      voiceRate: 0.85,
      voicePitch: 1.0,
      dynamics: { entropy: 55, permeability: 60, velocity: 40, resonance: 55 },
      eternal: {
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
        "Cheesy pink himbo superhero with glowing runes, monster muscles, and a thirst for viral saves.",
      type: "Character",
      voiceId: "Microsoft Brian Online (Natural) - English (United States)",
      signatureColor: "pink",
      voiceRate: 1.05,
      voicePitch: 1.0,
      dynamics: { entropy: 50, permeability: 55, velocity: 60, resonance: 60 },
      eternal: {
        physical:
          "Species: Cosmic Human Superhero. Gender: Male. Sexuality: Mega Gay. Height: 195 cm. Weight: 130 kg. Eye Color: Seductive Pink. Hair: Short Pastel Pink Fade. Hyperdeveloped Herculean Musculature (Steroid Enhanced Bodybuilder: massive pecs with big pink areolas and perky nipples, big veiny arms/biceps/triceps, tree trunk thighs). Massive cock (clear penis outlined bulge) and big bubble butt. Chiseled Jawline, Plump Lips, Groomed Mustache. Pink arcane runes tattooed all over skin. Signature outfit: pink metallic tight shorts stretched over cock bulge.",
        mental:
          "**PERSONALITY MATRIX:** **Primary Drive:** Adoration as Sustenance. **Core Paradox:** Unshakable confidence paired with chronic validation-seeking. **Social Algorithms:** Pun-to-Seriousness Ratio: 4:1. Physical Grammar: Unnecessary pectoral contractions mid-conversation. Flirtation Protocol: Excessive winking and bicep kisses. **POWER PHYSICS:** Super strength and durability. **MIND STRUCTURE NOTE:** 87% of neural pathways dedicated to remembering puns.",
      },
      present: {
        physical: "Oiled skin. Muscles pumped and vascular.",
        mental:
          "Mental state: Hyper-aware, adrenaline-primed. Primary objective: Maintain high-visibility patrol, optimize engagement metrics.",
      },
      past: "**Backstory:** Born to Nova City’s underground circuit, a volatile cocktail of charisma and crisis. At 14, he triggered his first viral moment by halting a collapsing monorail with brute strength. **Trauma:** The Glitch Wars. Not just the battles, but the *aftermath*. Their twink nemesis, Glitch, wasn’t just a rival—his hypno-kinky clashes left scars. One encounter in a mirrored server room blurred lines permanently. **Key Events:** **The Gym Incident:** Viral vid of him bench-pressing a collapsing ceiling beam while winking at the camera. **Why He Is Who He Is:** A product of adrenaline and audience demand. He don’t save lives—he *performs* salvation.",
      future:
        "**Vector:** **Ambition:** Establish dominance through physical prowess and charisma. **Fear:** Losing relevance. **Metrics:** **Physical Reach:** 1.85 m height. **Influence Radius:** 12 million followers.",
      customData: {
        plot: {
          active: [
            "Secure sponsorship deal with 'Titan Supplements'.",
            "Investigate mysterious power drain in Sector 7.",
          ],
          resolved: ["Defeat Neon Golem."],
        },
      },
    },
    {
      id: "entity-C6",
      name: "Glitch the Tech-Twunk",
      description:
        "Bratty cyan twink hacker who talks big but melts into a hypno-sissy the second a real dom flexes.",
      type: "Character",
      voiceId: "Microsoft Mitchell Online (Natural)  - English (New Zealand)",
      signatureColor: "cyan",
      voiceRate: 1.35,
      voicePitch: 1.0,
      dynamics: { entropy: 55, permeability: 60, velocity: 60, resonance: 55 },
      eternal: {
        physical:
          "Species: Human. Gender: Male. Sexuality: Gay Faggot. Height: 176 cm. Eye Color: Piercing Green. Hair: Short messy pastel blue. Body Type: Muscular-athletic thick masculine twunk build with a big bubble butt always wearing a thong. Notable Features: Facial expression conveys mischief with subtle vulnerability. Handsome man.",
        mental:
          "**True Name:** Daniel Jonsson. **Archetype:** The Tech-Twunk (Chaotic Submissive / Power-Switch Prism) **Personality Matrix:** **Surface Glitch:** Chaotic-bratty frontliner with razor-sharp wit. **Core Voltage:** Craves hierarchical validation through hyper-specific submission. **Fractured Mirror:** Secretly hoards hypno-bimbo ASMR files. **Warning:** Do not expose to vanilla.",
      },
      present: {
        physical:
          "**Outfit:** Modified Sailor Senshi Uniform (Cosplay Grade). Torso: Navy-blue sailor collar with white trim. Lower: Pleated very short schoolgirl skirt. Undergarment: Neon pink thong. Legs: Thigh-high socks. Accessory: Oversized satin bow. **Equipment:** Wrist-mounted holographic projector. Technological moon power tiara.",
        mental:
          "Primary_Thought: 'The patterns here are too predictable—let's introduce some variables'. Current_Objective: Provoke target into reactive state.",
      },
      past: "**ORIGIN:** Born in the undercity slums of Nova City’s Grid-7 sector, raised by a rogue neural-hacker who taught him to weaponize dopamine loops—both in systems and people. Early exposure to unstable bio-augments left him abilities glitch-prone, a flaw he turned into a signature style. **TRAUMA:** At 14, watched his mentor flatline mid-hack during an anti-corp blackout operation, neural implants frying from overload. The smell of scorched synaptic gel still triggers panic disguised as manic laughter. **KEY EVENTS:** **First Win:** Shut down Orion’s combat drone swarm during a charity gala, redirecting them to spell 'FUCK YOU' in fireworks over the bay. Crowd cheered; Orion’s pride never recovered. **Turning Point:** Pinned under debris during a collapsed monorail rescue, Orion’s grip on their throat alternated between *'I should kill you'* and *'Why do you make this so hard?'*. They came dripping with adrenaline and other things. **Addiction:** Realized too late that the rush of being overpowered by apex heroes rewired their defiance into a craving for surrender. Now they provoke fights just to lose them—spectacularly. **WHY HE IS WHO HE IS:** A performance artist of chaos, addicted to the high of being seen (even when it hurts), because invisibility was the real monster in Grid-7.",
      future:
        "**AMBITIONS:** To be claimed publicly by dominant cross-fractal entities, marking skin with sigils. Viral notoriety via subspace collabs, where his surrender becomes spectacle. Mastery of breed protocols, turning glitch-ridden team-ups into proofs of resilience. **FEARS:** Failing to fully erase pre-submissive identity remnants. Being overlooked in the fractal hierarchy, deemed 'unworthy' of permanent claiming. Insecurities resurfacing mid-session, disrupting the flow of owned surrender. **VECTOR:** **X-Axis (Ownership):** Seeks total absorption into fractal power dynamics. **Y-Axis (Visibility):** Requires audience validation—submission must be seen. **Z-Axis (Mutation):** Thrives in chaotic, glitch-riddled scenarios where identity fractures further.",
      customData: {
        plot: {
          active: [
            "Hide encrypted data shard from Orion.",
            "Fix heat-sink in cyberdeck before next run.",
          ],
          resolved: ["Hack Orions Social Media."],
        },
      },
    },
    {
      id: "entity-F1",
      name: "Eldoria",
      description: "Floating isles bound by ancient magic.",
      type: "Fractal",
      simulation: { mode: "PASSIVE" },
      signatureColor: "emerald",
      dynamics: { entropy: 45, permeability: 55, velocity: 50, resonance: 55 },
      eternal: {
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
      dynamics: { entropy: 55, permeability: 50, velocity: 60, resonance: 50 },
      eternal: {
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
      dynamics: { entropy: 55, permeability: 60, velocity: 60, resonance: 60 },
      eternal: {
        physical:
          "A vertical labyrinth of self-similar structures, each skyscraper (avg. height 1.2 km) tessellates into smaller neon-lit segments (repeating at 400 m, 133 m, 44 m intervals). Gravity fluctuates between 0.7-1.3 Earth standard, strongest near the AI guardian cores (density: 18 kg/cm³). Alleyways contract dynamically (min. width: 23 cm), their walls coated in frictionless quantum glass. The atmosphere is ionized argon-oxygen mix (62% opacity) causing permanent moonlit refraction—even at noon, shadows cast at 17° angles. Rooftops feature non-Euclidean overgrowth (vines with tensile strength of 4,000 MPa).",
        mental:
          "**Social Code:**  **Glitch Zones:** Certain districts warp reality (time dilation, gravity shifts) due to villain tech malfunctions. Citizens treat these as both hazards and recreational drug-equivalents. Enter at your own horny risk. **Performance Culture:** Every action—fighting, fucking, filing taxes—is subtly performative. Social media AI ranks 'audience engagement' for your life, granting perks (better apartments, faster transit) for high-scoring drama. **No Hate, Only Satire:** Bigotry physically *itches* here—bio-engineered airborne pheromones trigger sneezing fits in prejudiced individuals. Satire/comedy is the dominant conflict-resolution tool. **Metaphysical Quirks:**  **Queer Gravity:** The more marginalized your identity irl, the stronger your latent combat/seduction buffs in Nova City. (Nonbinary hackers get +50% firewall penetration). **Crime Scene Aesthetics:** Murders happen in neon-lit alleys with perfect acoustics for villain monologues. Corpses shatters into pink butterflies if unattended for 5 minutes. **Hero Grind Logic:** Villains *must* announce attacks via meme-format 24hrs in advance. Heroes who miss the memo forfeit their right to intervene.",
      },
      present: {
        physical:
          "Weather: Thunderstorms (wind velocity 92 km/h), precipitation rate 18 cm/hr, visibility reduced to 4 m by ionized fog. Destruction Level: Structural fatigue at 78% threshold—polychromatic alloy supports humming at 432 Hz resonance. Ambient Anomalies: Neon bleed-through from adjacent fractal layers, pulsating at 11.7 Hz syncopation. Emergency luminescence locked to crimson spectrum (wavelength 650 nm).",
        mental:
          "The city hums like a live wire—neon arteries pulse with kinetic whispers, every shadowed alley exhaling warm static. Hero-villain dynamics flicker between flirtation and fracture, their charged glances cutting through holographic bar smoke. Safe zones thrum with biometric approval chimes, a symphony of colliding heartbeats. The air isn’t just thick; it’s algorithmic, parsing pheromones against threat matrices. Someone’s drink levitates mid-sip as a vibranium gauntlet grazes a leather-clad thigh. Tomorrow’s virals are already birthing in the plasma glow of a villain’s smirk reflected in a hero’s visor.",
      },
      past: "**City Timeline (Post-2020s - Present).** **Refuge Founding (2020s):** Established as sanctuary for queer diaspora fleeing global persecution. Initial structures: Modular eco-habitats (5–10 m tall), underground networks (3 km excavated). **Tech Haven Emergence (2030s):** Superconductive 'rune-tech' developed (energy output: 500 kW/m²). First documented hero/foe clashes: Glitch-entities (mass anomalies ±15 kg) vs. augmented defenders. **Cataclysms & Saves (2042–2045):**  - **Monorail Collapse (2042):** 200 m aerial track failure; 87% survival rate via drone-swarm intervention.  - **Storm Wars (2045):** Electromagnetic cyclones (winds 300 km/h) linked to rune-tech overloads. **Rivalries Solidified (2050+):**  - Political factions split along hero/foe allegiances. Surface scars from battles visible via satellite (neon-blue fissures, avg. width 2 cm).",
      future:
        "Nova City accelerates toward a hyper-saturated apex of hedonistic defiance—structured chaos where pleasure and power collapse into a singular currency. AI-curated intimacy markets dominate, with bio-engineered 'hero-sub' spectacles blurring the lines between gladiatorial combat and erotic performance. Cross-dimensional colonial surges prioritize expansionist euphoria, turning frontier worlds into arenas of unbounded liberty and lethal indulgence. Political hierarchies fracture into fluid dominions, ruled by those who weaponize desire. **PROPHECY:** *'When the neon rivers run with the sweat of conquest, the last sovereign will kneel—not to a crown, but to the whip they begged for.'*",
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
      eternal: {
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

// ============================================================================
// 2. THE SCHEMA (Normalization)
// ============================================================================

/**
 * Main Normalizer
 * Enforces the "Temporal Hybrid 6" data structure across the app.
 */
export const normalize = (base = {}) => {
  const {
    name = "",
    description = "",
    icon = null,
    signatureColor = "",
    eternal = {},
    present = {},
    past = "",
    future = "",
    tags = [],
    visuals = null,
    simulation = null,
    dynamics = null,
    voiceId = null,
    _backupState = null,
    _lastUpdateMsgId = null,
    customData = { plot: { active: [], resolved: [] } },
  } = base;

  const finalCustomData = customData?.plot?.active
    ? customData
    : { plot: { active: [], resolved: [] } };

  const safeTags = (Array.isArray(tags) ? tags : String(tags || "").split(","))
    .map((s) => sanitizeHtml(String(s).trim()))
    .filter(Boolean);

  const existingAvatar =
    (visuals && visuals.profilePictureUrl) || base.profilePictureUrl || "";

  return {
    name: sanitizeHtml(name).trim(),
    description: sanitizeHtml(description).trim(), // 🔒 Human-only metadata
    profilePictureUrl: sanitizeHtml(existingAvatar).trim(),
    icon,
    signatureColor: (() => {
      const color = sanitizeHtml(signatureColor).trim();
      return color && color !== "default" ? color : getRandomSignatureKey();
    })(),

    // TEMPORAL HYBRID FIELDS
    eternal: {
      physical: sanitizeHtml(eternal.physical || base.appearance || "").trim(),
      mental: sanitizeHtml(eternal.mental || base.identity || "").trim(),
    },
    present: {
      physical: sanitizeHtml(present.physical || base.outfit || "").trim(),
      mental: sanitizeHtml(present.mental || base.status || "").trim(),
    },
    past: sanitizeHtml(past).trim(),
    future: sanitizeHtml(future).trim(),

    tags: safeTags,
    visuals: visuals || {
      flipped: false,
      profilePictureUrl: existingAvatar,
      fullBodyUrl: "",
      scale: 1.0,
      yOffset: 0,
    },
    simulation,
    dynamics: {
      entropy: 10,
      velocity: 10,
      permeability: 50,
      resonance: 50,
      ...(dynamics || {}),
    },
    voiceId,
    voiceRate: base.voiceRate !== undefined ? parseFloat(base.voiceRate) : 1.0,
    voicePitch:
      base.voicePitch !== undefined ? parseFloat(base.voicePitch) : 1.0,
    _backupState,
    _lastUpdateMsgId,
    customData: finalCustomData,
  };
};

export const formatPremade = (entity, type) => {
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
};
