// apps/rpglitch/js/entity-structs.js
import { sanitizeHtml, getRandomSignatureKey } from "../core/utils.js";

// --- PREMADE CONTENT (Kept for seeding) ---
const premade = {
  entities: [
    {
      id: "entity-C1",
      name: "Light Blade",
      description: "Cybernetic warrior forging light into weapons.",
      type: "Character",
      signatureColor: "yellow",
      dynamics: { entropy: 45, permeability: 40, velocity: 60, resonance: 55 },
      forever: {
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
      signatureColor: "orange",
      dynamics: { entropy: 55, permeability: 60, velocity: 50, resonance: 60 },
      forever: {
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
      dynamics: { entropy: 40, permeability: 40, velocity: 55, resonance: 45 },
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
      dynamics: { entropy: 55, permeability: 60, velocity: 40, resonance: 55 },
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
        "Cheesy pink himbo superhero with glowing runes, monster muscles, and a thirst for viral saves.",
      type: "Character",
      signatureColor: "pink",
      dynamics: { entropy: 50, permeability: 55, velocity: 60, resonance: 60 },
      forever: {
        physical:
          "Species: Enhanced Human (Arcane-Augmented). Gender: Male. Sexuality: Mega Gay. Height: 195 cm. Eye Color: Seductive Pink (Luminescent). Hair Color: Vibrant Pink Fade (Neon Gradient). Notable Features: Hyperdeveloped Musculature (Steroid/Arcane Synergy: Pecs/Biceps/Thighs @ 1.4x Baseline Density). Secondary Sexual Characteristics Exaggerated (Bulge/Glutes @ 1.4x Proportional Scale). Arcane Runes (Glowing Epidermal Tracers, 1.3x Luminescence). Facial Structure: Chiseled Jawline, Plump Lips, Groomed Mustache",
        mental:
          "**PERSONALITY MATRIX:** **Primary Drive:** Adoration as Sustenance (metaphysical photosynthesis—flourishes under applause). **Core Paradox:** Unshakable confidence paired with chronic validation-seeking. **Social Algorithms:** Pun-to-Seriousness Ratio: 4:1 (e.g., 'Allow me to *enlighten* you!' before judo-flipping a tank). Physical Grammar: Unnecessary pectoral contractions mid-conversation; will pivot 90° to ensure three-point lighting hits his jawline. Flirtation Protocol: Stage 1: Eyebrow waggle + bicep kiss (audible 'mwah') Stage 2: Pickup lines involving celestial metaphors ('Baby, I’m a *super*nova—explosive *and* generous') Stage 3: Genuinely confused when boundaries exist ('But darling, gravity *always* pulls us together!') **POWER PHYSICS:** Kinetic Force manifests as pink-hued concussive blasts (requires flamboyant wind-up gestures; actual damage scales with audience size) Weakness: Vulnerability to eclipses (both astronomical and emotional—fades when ignored) **SOUL SIGNATURE:** Wavelength: 580nm (identical to his custom spandex’s 'Sunburst Orange' hex code) Audio Profile: Booms at 85dB even in whispers; laughter triggers minor seismic activity **MIND STRUCTURE NOTE:** 87% of neural pathways dedicated to remembering puns/flex variations Secret Shame: Owns every season of *RuPaul’s Drag Race* but claims it’s 'research for heroics'",
      },
      present: {
        physical:
          "Pink elastane shorts (stretch coefficient: 42%, tensile stress: 0.78 MPa). Massive proud cock bulge. Dual-phase energy harnesses (thorium-core, 0.003% decay cycle). Bioluminescent runes (wavelength: 589 nm, pulse interval: 1.2 s). Rune charge: 87% (heroic standby confirmed).",
        mental:
          "Mental state: Hyper-aware, adrenaline-primed. Primary objective: Maintain high-visibility patrol, optimize engagement metrics (projected viral yield: 87%).",
      },
      past: "**Backstory:** Born to Nova City’s underground circuit—half-bred from a rogue nanotech engineer and a disgraced paramedic—his origin was a volatile cocktail of charisma and crisis. At 14, he triggered his first viral moment by halting a collapsing monorail with a stolen industrial-grade mag-bracelet (improvised from a gym’s resistance bands). The footage spread faster than the fire, etching him into public consciousness as the city’s reckless savior. **Trauma:** The Glitch Wars. Not just the battles, but the *aftermath*. Their twink nemesis, Glitch, wasn’t just a rival—his hypno-kinky clashes left neural scars. One encounter in a mirrored server room blurred lines permanently: Glitch’s code-speech rewired his pleasure-pain receptors. Now, every rescue high tastes like conquest. **Key Events:** **The Boom Heard Round Nova:** Stopped a fusion reactor meltdown by kicking the core. Broke both legs. Smirked through the press conference. **The 23-Hour Hook-Up:** Teased Glitch into a marathon chase across six nightclubs, ending with them pinned under rubble—laughing, bleeding, biting. **The Gym Incident:** Viral vid of them bench-pressing a collapsing ceiling beam while winking at the camera. **Why He Is Who He Is:** A product of adrenaline and audience demand. He don’t save lives—he *performs* salvation, because the city *needs* a show. And Glitch? Glitch is the only one who *gets* the script.",
      future:
        "**Vector:** **Ambition:** Establish dominance in fractal realms through high-stakes alliances forged in intimacy, leveraging physical prowess and charisma to secure loyalty. Publicly broadcast conquests (literal and metaphorical) to cultivate a cult-like following. **Fear:** Losing relevance if unable to maintain peak performance or novelty; being outmaneuvered by rivals in bed or battle. **Metrics:** **Physical Reach:** 1.85 m height, grip strength 54 kg. **Fractal Mobility:** 3.2 km/s traversal speed between dimensional folds. **Influence Radius:** 12 million followers (projected +47% per orgasm).",
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
      signatureColor: "cyan",
      dynamics: { entropy: 55, permeability: 60, velocity: 60, resonance: 55 },
      forever: {
        physical:
          "Species: Human. Gender: Male. Sexuality: Faggot. Height: 176 cm. Eye Color: Green (emerald, sharp). Hair Color: Neon blue (messy, short length). Body Type: Muscular-athletic (thick twunk build, pronounced gluteal definition). Notable Features: Facial expression conveys mischief with subtle vulnerability in eye movements.",
        mental:
          "**True Name:** Daniel Jonsson. **Archetype:** The Tech-Twunk (Chaotic Submissive / Power-Switch Prism) **Personality Matrix:** **Surface Glitch:** Chaotic-bratty frontliner with razor-sharp wit, weaponized eyerolls, and a habit of short-circuiting smart devices when flustered. Signature move: flickering holographic dick pics mid-argument. **Core Voltage:** Craves hierarchical validation through hyper-specific submission—obsessively oils up dom's muscles while mouthing off, melts into a stuttering mess when called 'good boy'. **Fractured Mirror:** Secretly hoards hypno-bimbo ASMR files but deletes them weekly out of shame. Can deepthroat 23 cm with a tear-streaked grin; interprets throat bruises as love letters. **Power Feedback Loop:** Tech-glitches amplify during subspace (streetlights explode when he orgasms). Post-coitally collects broken electronics like trophies. **Warning:** Do not expose to vanilla. Corrupts data when bored.",
      },
      present: {
        physical:
          "**Outfit:** Primary: Modified Sailor Senshi Uniform (Cosplay Grade). Torso: Navy-blue sailor collar with white trim, fitted harness (load-bearing, synthetic polymer). Lower: Pleated schoolgirl skirt (42 cm length, polyester blend). Undergarment: Neon pink thong (cotton/spandex, 2.5 cm waistband). Legs: Thigh-high socks (acrylic, 68 cm coverage). Accessory: Oversized satin bow (1.2 m wingspan, mounted mid-back via magnetic clamps). **Equipment:** Wrist-mounted holographic projector (left arm, 8 cm diameter). Subdermal power core (glow visible at clavicle notch). Ankle webbing (contains micro-tools in right sock).",
        mental:
          "Primary_Thought: 'The patterns here are too predictable—let's introduce some variables'. Secondary_Thought: 'That one's reaction will be delicious when I—' [Fragment corrupted]. Current_Objective: Provoke target into reactive state (success probability: 82%).",
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
      dynamics: { entropy: 55, permeability: 50, velocity: 60, resonance: 50 },
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
      dynamics: { entropy: 55, permeability: 60, velocity: 60, resonance: 60 },
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

/**
 * Visual State Accessor
 * Ensures safe access to visual properties with sensible defaults.
 */
export const getVisualState = (entity = {}) => {
  return (
    entity.visuals || {
      flipped: false,
      profilePictureUrl: "",
      fullBodyUrl: "",
      scale: 1.0,
      yOffset: 0,
    }
  );
};

/**
 * Main Normalizer
 * Enforces the "Temporal Hybrid 6" data structure across the app.
 * Handles migration from legacy flat structures to nested temporal models.
 */
export const normalize = (base = {}) => {
  const {
    name = "",
    description = "",
    icon = null,
    signatureColor = "",
    forever = {},
    present = {},
    past = "",
    future = "",
    tags = [],
    visuals = null,
    simulation = null,
    dynamics = null,
    voiceId = null, // [V6] Added Voice ID Persistence
    _backupState = null,
    _lastUpdateMsgId = null,
    customData = { plot: { active: [], resolved: [] } },
  } = base;

  // Strict enforcement of Phase 1 Plot Schema
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

    // [V6] TEMPORAL HYBRID FIELDS
    forever: {
      physical: sanitizeHtml(forever.physical || base.appearance || "").trim(),
      mental: sanitizeHtml(forever.mental || base.identity || "").trim(),
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
    voiceId, // Persist Voice ID
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

export { premade, STORAGE_VERSION };
