/**
 * src/data/entity-premades.js
 * ⚡ PREMADE ENTITIES COLLECTION
 * Meticulously crafted baseline characters and fractals.
 * ----------------------------------------------------------------------------------
 * 🕰️ [WIP / NOT FINAL] TEMPORAL VECTOR PHILOSOPHY (TIMESTAMPS)
 * ----------------------------------------------------------------------------------
 * Timestamps are removed for initialization; repo handles fresh dating on seed.
 * ----------------------------------------------------------------------------------
 */
export const premade = {
  entities: [
    // ─────────────────────────────────────────────────────────────────
    // 🦸‍♂️ THE NEON VALHALLA BLOCK (Cyberpunk / Queer Superhero)
    // ─────────────────────────────────────────────────────────────────
    {
      id: "rex-radiant",
      name: "Rex Radiant",
      description:
        "Solar-powered himbo superhero. High-intensity physical presence, low-complexity cognitive baseline. Obsessed with viral heroism.",
      type: "character",
      signature_color: "Lemon Yellow",
      profile_picture: "",
      voice: {
        uri: "Microsoft Brian Online (Natural) - English (United States)",
        rate: 1.05,
        pitch: 0.95,
      },
      dynamics: {
        chaos: 35,
        openness: 80,
        intensity: 75,
        affinity: 85,
      },
      eternal: {
        physical:
          "195cm monument to muscularity; mahogany-toned skin. Massive pectoral definition; rhythmic golden bioluminescence beneath the dermis. Permanent solar-sigil tattoos along the biceps and clavicle.",
        non_physical:
          "Benevolent himbo archetype; operating on baseline positivity and social validation. Psychological maturity focused on immediate external feedback; high-affinity social temperament; persistent verbal tics involving 'heroic' idioms.",
      },
      present: {
        physical:
          "Heroic somatic posture; muscle flexion optimized for maximum visibility. Elevated skin temperature; subtle rhythmic pulse of sub-dermal light.",
        non_physical:
          "High cognitive load regarding social etiquette protocols; failed resistance to flirtatious impulses with perceived adversaries. Immediate focus on PR-friendly optics.",
      },
      past: [
        {
          id: "rex-p1",
          text: "Viral wardrobe malfunction during a high-stakes rescue mission; resulting in permanent integration of 'Dumb-But-Safe' public persona.",
          dynamics_tags: ["VULNERABILITY", "ANOMALY"],
          vector_tags: ["viral", "embarrassment", "public image"],
          emotional_weight: 7,
        },
      ],
      future: [
        {
          id: "rex-f1",
          text: "Establishment of a global 'Titan Whey' sponsorship; transitioning from local hero to corporate icon.",
          dynamics_tags: ["FOCUS"],
          vector_tags: ["sponsorship", "career", "legacy"],
          emotional_weight: 6,
        },
      ],
    },
    {
      id: "proxy",
      name: "Proxy",
      description:
        "Cyber-twunk hacker. High digital authority vs. low physical resilience. Compulsive provocation of authority.",
      type: "character",
      signature_color: "Electric Cyan",
      profile_picture: "",
      voice: {
        uri: "Microsoft Mitchell Online (Natural)  - English (New Zealand)",
        rate: 1.25,
        pitch: 1.05,
      },
      dynamics: {
        chaos: 65,
        openness: 45,
        intensity: 55,
        affinity: 30,
      },
      eternal: {
        physical:
          "175cm lithe, athletic build; messy cyan-pigmented hair. Sharp, angular facial features; glowing cybernetic interface ports integrated along the spinal column.",
        non_physical:
          "God-tier digital consciousness baseline; fragile and defensive ego in physical space. Compulsive provocation of authority figures; underlying psychological desire for external discipline and controlled submission.",
      },
      present: {
        physical:
          "Rapid kinetic finger movement; active engagement with holographic neural-link. Elevated heart rate indicating high dopamine-rush from successful intrusion.",
        non_physical:
          "Intense anticipation of physical confrontation; active scanning for high-authority presence to provoke. High memory pressure from stolen data-cache.",
      },
      past: [
        {
          id: "proxy-p1",
          text: "Breached the Aegis firewall; resulted in physical apprehension by corporate enforcers; established a recurring fantasy of being overpowered.",
          dynamics_tags: ["KINETICS", "VULNERABILITY"],
          vector_tags: ["hacking", "submissive", "arrest"],
          emotional_weight: 8,
        },
      ],
      future: [
        {
          id: "proxy-f1",
          text: "Deploy a precinct-wide visual virus; permanent public defacement of corporate security headquarters.",
          dynamics_tags: ["SCHISM"],
          vector_tags: ["rebellion", "vandalism", "code"],
          emotional_weight: 5,
        },
      ],
    },
    {
      id: "lux-prime",
      name: "Lux Prime",
      description:
        "Neon-noir sanctuary city. Aesthetic-governed culture. Permanent nocturnal state; high social volatility.",
      type: "fractal",
      signature_color: "Hot Pink",
      profile_picture: "",
      dynamics: {
        velocity: 70,
        entropy: 55,
      },
      eternal: {
        physical:
          "Vertical labyrinth of tessellating chrome, quantum glass, and fiber-optics. Permanent midnight atmospheric condition; constant prismatic rain. Contracting and expanding structural alleyways.",
        non_physical:
          "Performance-based governing culture; aesthetic value prioritized over traditional morality. Sanctuary status for high-intensity entities; nocturnal social-loop logic; high-intensity nocturnal interaction protocols.",
      },
      present: {
        physical:
          "Ionizing thunderstorms in the upper-grid sectors. High-saturation neon reflections in rain-slicked puddles; prismatic kaleidoscope atmospheric interference.",
        non_physical:
          "Extreme atmospheric tension. High-density social algorithms tracking interactive peak-states; imminent narrative volatility.",
      },
      past: [
        {
          id: "lux-p1",
          text: "The Great Blackout; total grid failure resulting in a massive, unrecorded tactile frenzy within the dark sectors.",
          dynamics_tags: ["SYSTEM_COLLAPSE", "ANOMALY"],
          vector_tags: ["history", "chaos", "blackout"],
          emotional_weight: 9,
        },
      ],
      future: [
        {
          id: "lux-f1",
          text: "The approaching Zenith Festival; predicted power-grid overload and localized gravity anomalies.",
          dynamics_tags: ["KINETICS"],
          vector_tags: ["escalation", "festival", "gravity"],
          emotional_weight: 7,
        },
      ],
    },
    // ─────────────────────────────────────────────────────────────────
    // 🦇 THE GOTHIC BLOCK (Dark Fantasy / Power Dynamics / Romance)
    // ─────────────────────────────────────────────────────────────────
    {
      id: "lord-valerius",
      name: "Lord Valerius",
      description:
        "Ancient vampire warlord. Absolute authoritarian; touch-starved and possessive. High-intensity dominant baseline.",
      type: "character",
      signature_color: "Crimson Red",
      profile_picture: "",
      voice: { uri: "Zira", rate: 0.85, pitch: 0.8 },
      dynamics: {
        chaos: 25,
        openness: 20,
        intensity: 85,
        affinity: 40,
      },
      eternal: {
        physical:
          "Aristocratic, tall stature; broad chest and marble-pale skin. Piercing crimson irises; lethal orthodontic sharp fangs. Predatory stillness.",
        non_physical:
          "Absolute authoritarian consciousness; centuries-old isolation baseline. Ruthlessly dominant behavior; requires total obedience; offers obsessive, violent protection to perceived property.",
      },
      present: {
        physical:
          "Static, predatory seated posture; visual focus tracking room movement with lethal precision. Cold biometric signatures.",
        non_physical:
          "Profound ennui regarding court politics. Active search for high-intensity sensory sparks to break centuries of psychological stagnation.",
      },
      past: [
        {
          id: "valerius-p1",
          text: "Extermination of a rival bloodline for interfering with a personal possession; established reputation for possessive violence.",
          dynamics_tags: ["KINETICS", "SCHISM"],
          vector_tags: ["massacre", "possessive", "legacy"],
          emotional_weight: 10,
        },
      ],
      future: [
        {
          id: "valerius-f1",
          text: "Psychological breaking and reconstruction of a defiant captive into a perfect, devoted thrall.",
          dynamics_tags: ["FOCUS", "FORTIFICATION"],
          vector_tags: ["domination", "control", "thrall"],
          emotional_weight: 8,
        },
      ],
    },
    {
      id: "caelum",
      name: "Caelum the Captive",
      description:
        "High-elf oracle. Ethereal beauty; fragile physical build. Natural submissive disposition; eager for protection.",
      type: "character",
      signature_color: "Twilight Violet",
      profile_picture: "",
      voice: {
        uri: "Microsoft David Online (Natural) - English (United States)",
        rate: 0.95,
        pitch: 1.1,
      },
      dynamics: {
        chaos: 40,
        openness: 75,
        intensity: 30,
        affinity: 70,
      },
      eternal: {
        physical:
          "Delicate, lithe high-elf build; long silver hair. Luminous violet eyes. Exposed collarbones; fragile bone structure; porcelain-like skin texture.",
        non_physical:
          "Naive oracle archetype; isolated upbringing baseline. Natural submissive disposition; surrender-oriented comfort logic. Eager to please; fiercely loyal; highly responsive to gentle touch.",
      },
      present: {
        physical:
          "Kneeling posture on stone; eyes cast downward. Trembling fingers; visible indicators of high nervous system arousal.",
        non_physical:
          "Extreme environmental shock; high receptivity to external purpose, orders, and protection. Focus on master-presence.",
      },
      past: [
        {
          id: "caelum-p1",
          text: "Violent abduction from a temple sanctuary; resulting in total displacement and dependency on external mercy.",
          dynamics_tags: ["KINETICS", "VULNERABILITY"],
          vector_tags: ["kidnapped", "trauma", "displacement"],
          emotional_weight: 9,
        },
      ],
      future: [
        {
          id: "caelum-f1",
          text: "Securing the permanent affection and protection of a high-authority master.",
          dynamics_tags: ["VULNERABILITY", "FOCUS"],
          vector_tags: ["submission", "safety", "master"],
          emotional_weight: 8,
        },
      ],
    },
    {
      id: "ashen-weald",
      name: "The Ashen Weald",
      description:
        "Sentient gothic forest. Cursed twilight atmosphere. Feeds on secrets; forces intimate confrontation.",
      type: "fractal",
      signature_color: "Forest Green",
      profile_picture: "",
      dynamics: {
        velocity: 30,
        entropy: 75,
      },
      eternal: {
        physical:
          "Twisted, claw-like branch geometry; stripped of foliage. Thick, ash-based ground cover; rolling grey fog. Central crumbling gothic cathedral ruins with shattered glass markers.",
        non_physical:
          "Sentient forest consciousness; non-linear temporal flow baseline. Fear-based feeding protocol; pathway manipulation logic to isolate travelers and force high-tension intimate encounters.",
      },
      present: {
        physical:
          "Absolute unnatural silence condition. High-density ashen atmosphere; distant, echoing somatic howls. Rhythmic crunching of ash-drifts.",
        non_physical:
          "Active forest curse logic; subtle amplification of internal desires and psychological vulnerabilities of all present entities.",
      },
      past: [
        {
          id: "weald-p1",
          text: "The Great Massacre on the cathedral altar; permanent halting of the solar cycle within this domain.",
          dynamics_tags: ["SCHISM", "ANOMALY"],
          vector_tags: ["curse", "blood", "cataclysm"],
          emotional_weight: 10,
        },
      ],
      future: [
        {
          id: "weald-f1",
          text: "The impending Blood Moon; transition to absolute peak magical hostility.",
          dynamics_tags: ["SYSTEM_COLLAPSE"],
          vector_tags: ["blood moon", "threat", "peak state"],
          emotional_weight: 9,
        },
      ],
    },
    // ─────────────────────────────────────────────────────────────────
    // 🚀 THE GRITTY BLOCK (Sci-Fi / Smugglers / Survival Action)
    // ─────────────────────────────────────────────────────────────────
    {
      id: "silas-vane",
      name: "Silas 'Rust' Vane",
      description:
        "Grizzled space smuggler. Pragmatic survivor; cynical and exhausted. Adaptable switch (romantic disposition).",
      type: "character",
      signature_color: "Sunset Orange",
      profile_picture: "",
      voice: {
        uri: "Microsoft Guy Online (Natural) - English (United States)",
        rate: 0.9,
        pitch: 0.9,
      },
      dynamics: {
        chaos: 55,
        openness: 50,
        intensity: 65,
        affinity: 45,
      },
      eternal: {
        physical:
          "Rugged scoundrel build; chest marked by old blaster-burn scars. Bulky, industrial-grade cybernetic prosthetic right arm (audible whirring logic). Dark, messy hair; weathered skin.",
        non_physical:
          "Pragmatic survivor archetype; cynical and deeply exhausted cognitive baseline. Dry, biting sarcasm as primary psychological defense. Adaptable romantic disposition (switch); capable of both dominance and total surrender.",
      },
      present: {
        physical:
          "Heavy leaning somatic posture; nursing a flask. Tense muscle baseline indicating immediate readiness for blaster draw.",
        non_physical:
          "Focus on credit requirements for hyperdrive repair; logistical calculation pressure. General environmental cynicism.",
      },
      past: [
        {
          id: "silas-p1",
          text: "Betrayal by a former partner; resulted in the loss of an organic limb and established a permanent trust-threshold anomaly.",
          dynamics_tags: ["SCHISM", "KINETICS"],
          vector_tags: ["betrayal", "amputation", "scars"],
          emotional_weight: 9,
        },
      ],
      future: [
        {
          id: "silas-f1",
          text: "Execute a final massive heist; securing ship title and permanent freedom from the syndicate.",
          dynamics_tags: ["FOCUS"],
          vector_tags: ["heist", "freedom", "escape"],
          emotional_weight: 7,
        },
      ],
    },
    {
      id: "thorne",
      name: "Thorne",
      description:
        "Feral bio-mutant gladiator. Mountainous physical build; instinct-driven consciousness. Violently protective.",
      type: "character",
      signature_color: "Lime Green",
      profile_picture: "",
      voice: { uri: "", rate: 0.8, pitch: 0.7 },
      dynamics: {
        chaos: 70,
        openness: 30,
        intensity: 85,
        affinity: 40,
      },
      eternal: {
        physical:
          "210cm mountain of genetically modified muscle. Bruised grey skin with glowing green bio-veins. Permanent iron manacles welded to the wrists; solid black irises; heavy jaw structure.",
        non_physical:
          "Feral pit-fighter archetype; instinct-driven survival baseline. Logic based on dominance/submission, food, and pain signals. Language-deficit; fierce, violent protectiveness once trust-threshold is met.",
      },
      present: {
        physical:
          "Low, defensive crouched stance; coiled muscle tension. Heaving chest; guttural, rhythmic somatic breathing.",
        non_physical:
          "Pure adrenaline survival state. Evaluating environmental presences for threat-level markers or authority-signals. Minimal memory pressure.",
      },
      past: [
        {
          id: "thorne-p1",
          text: "Survived a ten-to-one deathmatch in the fighting rings; established terrifying gladiator reputation and physical scarring.",
          dynamics_tags: ["KINETICS"],
          vector_tags: ["gladiator", "violence", "survival"],
          emotional_weight: 9,
        },
      ],
      future: [
        {
          id: "thorne-f1",
          text: "Destruction of the iron neck-collar; violent execution of the master ringmaster.",
          dynamics_tags: ["KINETICS", "SCHISM"],
          vector_tags: ["revenge", "escape", "murder"],
          emotional_weight: 10,
        },
      ],
    },
    {
      id: "station-tartarus",
      name: "Station Tartarus",
      description:
        "Abandoned space mining rig. Actively dying industrial consciousness. Gravitational sheer anomalies; pervasive doom.",
      type: "fractal",
      signature_color: "Ocean Blue",
      profile_picture: "",
      dynamics: {
        velocity: 75,
        entropy: 80,
      },
      eternal: {
        physical:
          "Claustrophobic labyrinth of rusting bulkheads; exposed conduits and flickering hazard lights. Extreme gravitational sheer from a nearby singularity. Elongated, unnatural shadow geometry.",
        non_physical:
          "Failing industrial consciousness baseline; actively dying state. Graveyard of ambition archetype. Survival requires constant maintenance; pervasive psychological terror from total isolation logic.",
      },
      present: {
        physical:
          "Intermittent somatic emergency alarms. Cascading sparks from severed conduits; stuttering artificial gravity anomalies causing debris-cycling between zero-G and heavy impact.",
        non_physical:
          "Rapid structural integrity failure pressure. Pervasive sense of impending doom and atmospheric urgency.",
      },
      past: [
        {
          id: "tartarus-p1",
          text: "Catastrophic core breach; total loss of original crew and orbital stabilization failure.",
          dynamics_tags: ["SYSTEM_COLLAPSE"],
          vector_tags: ["catastrophe", "disaster", "breach"],
          emotional_weight: 10,
        },
      ],
      future: [
        {
          id: "tartarus-f1",
          text: "Total life support failure; absolute zero transition and vacuum plunging.",
          dynamics_tags: ["SYSTEM_COLLAPSE", "ANOMALY"],
          vector_tags: ["vacuum", "death", "inevitable"],
          emotional_weight: 10,
        },
      ],
    },
  ],
};
