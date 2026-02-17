/**
 * src/js/scholar/library.js
 * THE LIBRARY (Data Models & Seeds)
 * Contains the immutable definitions of premade entities and the normalization logic (Schema).
 */

import { PALETTE } from "@core/engine/config.js"
import { Security } from "@core/security/security.js"
const sanitizeHtml = Security.sanitize
const getRandomSignatureKey = () => {
    const keys = Object.keys(PALETTE).filter((k) => k !== "default")
    return keys[Math.floor(Math.random() * keys.length)]
}

export const STORAGE_VERSION = 3

// ============================================================================
// 1. THE CANON (Premade Entities)
// ============================================================================

export const premade = {
    entities: [
        {
            id: "entity-C1",
            name: "Light Blade",
            description: "Cybernetic warrior forging light into weapons.",
            type: "character",
            visuals: { signatureColor: "yellow" },
            voice: { uri: "", rate: 1.0, pitch: 1.0 },
            dynamics: {
                entropy: 45,
                permeability: 40,
                velocity: 60,
                resonance: 55,
            },
            eternal: {
                physical:
                    "A synthesis of flesh and machine, with luminous cyan circuitry pulsing beneath polished, metallic skin that highlights a lean, athletic build.",
                mental: "Bound to the Light Core; his blade hums with the resonance of starlight.",
            },
            present: {
                physical:
                    "Stands clad in battle-scarred plasteel armor, fingers coiled around the hilt of a humming light-blade as his tattered cape snaps in the high-altitude winds.",
                mental: "Hired to protect merchant caravans crossing the perilous skybridges of Neo Arcadia.",
            },
            past: "Once street tinkerer who reverse-engineered a fallen drone.",
            future: "Fated to sever Source that powers city itself.",
        },
        {
            id: "entity-C2",
            name: "Mystic Bard",
            description: "Traveling musician who weaves spells with song.",
            type: "character",
            visuals: { signatureColor: "orange" },
            voice: { uri: "Zira", rate: 1.0, pitch: 1.0 },
            dynamics: {
                entropy: 55,
                permeability: 60,
                velocity: 50,
                resonance: 60,
            },
            eternal: {
                physical:
                    "Possesses the ethereal grace of her elven heritage, marked by elegantly swept ears and eyes that glimmer with an inner light within a slender, agile frame.",
                mental: "Every note she plays carries a memory; every chorus is a weave of charms.",
            },
            present: {
                physical:
                    "Cradles a lute carved from light-drinking void-wood, her vibrant silk robes partially obscured by the weight of a heavy, weather-beaten travel cloak.",
                mental: "Performing in crowded markets, using her songs to mend broken hearts and stir the fires of rebellion.",
            },
            past: "Exiled from royal conservatory for forbidden harmonics.",
            future: "Composes Anthem that ends century-long war.",
        },
        {
            id: "entity-C3",
            name: "Clockwork Rogue",
            description: "Stealthy thief powered by ticking gears.",
            type: "character",
            visuals: { signatureColor: "lime" },
            voice: { uri: "", rate: 1.1, pitch: 1.0 },
            dynamics: {
                entropy: 40,
                permeability: 40,
                velocity: 55,
                resonance: 45,
            },
            eternal: {
                physical:
                    "A masterpiece of mechanical engineering, featuring intricate brass detailing and intricate clockwork joints that click with precision, their hooded face a mask of shifting shadows.",
                mental: "Gears never lie; value is measured in the precision of the steal.",
            },
            present: {
                physical:
                    "Outfitted for infiltration in a form-fitting leather stealth suit and a belt of professional lockpicks, their eyes shielded by polished brass goggles.",
                mental: "Stealing artifacts from the elite to buy the freedom of their aging creator.",
            },
            past: "Built in a hidden workshop as a prototype companion.",
            future: "Breaks their mainspring to stop a time heist.",
        },
        {
            id: "entity-C4",
            name: "Shadow Whisperer",
            description: "Mysterious figure communing with darkness.",
            type: "character",
            visuals: { signatureColor: "purple" },
            voice: { uri: "Zira", rate: 0.85, pitch: 1.0 },
            dynamics: {
                entropy: 55,
                permeability: 60,
                velocity: 40,
                resonance: 55,
            },
            eternal: {
                physical:
                    "Wreathed in a thick, undulating aura of shifting shadows that leak from eyes as dark and hollow as the abyss, set against skin as pale as moonlight.",
                mental: "The dark is not empty; it is a living entity that listens and responds.",
            },
            present: {
                physical:
                    "Drifts through the neon fog in tattered obsidian robes, facial features entirely lost behind a veil of swirling, unnatural smoke.",
                mental: "Brokering secrets between forbidden guilds through the use of living, sentient silhouettes.",
            },
            past: "Swallowed by a rift and returned with a voice not their own.",
            future: "Merges with the Night to blind an invading fleet.",
        },
        {
            id: "entity-C5",
            name: "Orion the Pink Protector",
            description:
                "Cheesy pink himbo superhero with glowing runes, monster muscles, and a thirst for viral saves.",
            type: "character",
            visuals: { signatureColor: "pink" },
            voice: {
                uri: "Microsoft Brian Online (Natural) - English (United States)",
                rate: 1.05,
                pitch: 1.0,
            },
            dynamics: {
                entropy: 50,
                permeability: 55,
                velocity: 60,
                resonance: 60,
            },
            eternal: {
                physical:
                    "Orion stands as a pinnacle of cosmic human vitality, a 195cm titan of marble-hewed muscle weighing in at 130kg of sheer mass. His skin is a roadmap of power, etched with glowing pink arcane runes that pulse with every flex of his hyperdeveloped, bodybuilder physique. Every inch of him, from his chiseled jawline to the massive, vascular pecs and heavy tree-trunk thighs, is designed for maximum visual impact, punctuated by his signature pink metallic shorts stretched tight over a form that leaves nothing to the imagination.",
                mental: "Driven by a chronic need for adoration, Orion maintains an unshakable confidence that masks a deep-seated craving for validation. His personality is a deliberate performance—a 4:1 ratio of relentless puns to seriousness, delivered through frequent winking, bicep kisses, and unnecessary pectoral contractions that emphasize his super strength and durability.",
            },
            present: {
                physical:
                    "Oiled skin that glistens under the spotlight, his muscles pumped and heavily vascular from a recent patrol.",
                mental: "He is in a state of high-alert, his mind hyper-aware and adrenaline-primed as he optimizes his every movement for maximum audience engagement.",
            },
            past: "Born to Nova City’s underground circuit, Orion is a volatile cocktail of charisma and crisis. He rose to fame at fourteen by halting a collapsing monorail with his bare hands, cementing his role as a performer of salvation. His history is defined by the Glitch Wars—not just the battles, but the kinky, mirrored-server-room clashes with his nemesis that left scars deeper than physical wounds.",
            future: "Orion seeks to establish absolute dominance through physical prowess, terrified that losing his relevance would be a fate worse than death itself.",
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
            type: "character",
            visuals: { signatureColor: "cyan" },
            voice: {
                uri: "Microsoft Mitchell Online (Natural)  - English (New Zealand)",
                rate: 1.35,
                pitch: 1.0,
            },
            dynamics: {
                entropy: 55,
                permeability: 60,
                velocity: 60,
                resonance: 55,
            },
            eternal: {
                physical:
                    "Daniel is a striking collision of mischief and masculinity, a 176cm masculine twunk with a muscular, athletic build and a face that conveys bratty arrogance framed by messy pastel blue hair. Despite his hard exterior, a subtle vulnerability often glimmers in his piercing green eyes, and he is shamelessly proud of the physique he maintains with such defiant precision.",
                mental: "Operating under the archetype of the Tech-Twunk, Glitch presents a chaotic-bratty front that hides a razor-sharp wit. Beneath his razor-sharp surface, he craves hierarchical validation and secretively hoards fragments of a submissive identity he is both addicted to and terrified of fully embracing.",
            },
            present: {
                physical:
                    "He is clad in a modified, cosplay-grade sailor uniform, featuring a navy-blue collar over a pleated schoolgirl skirt that barely conceals a neon pink thong. His muscular legs are finished with thigh-high socks, while a wrist-mounted holographic projector and a technological 'moon power' tiara signify his mastery of the grid.",
                mental: "Constantly scanning for patterns to disrupt, Glitch is currently focused on provoking his target into a reactive state, deriving a thrill from the ensuing chaos.",
            },
            past: "Raised by rogue neural-hackers in the slums of Grid-7, Glitch speaks in the manic laughter of someone who weaponized dopamine loops before they could even walk. Bio-augment accidents left his abilities prone to unstable glitches, a flaw he turned into a signature weapon. His rivalry with Orion turned from competitive hacking to an eroticized addiction to the rush of being physically overpowered.",
            future: "He seeks total ownership by dominant cross-fractal entities, craving for his very surrender to become a viral spectacle that erases any remnant of his former, invisible self.",
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
            type: "fractal",
            visuals: { signatureColor: "emerald" },
            simulation: { mode: "PASSIVE" },
            dynamics: {
                entropy: 45,
                permeability: 55,
                velocity: 50,
                resonance: 55,
            },
            eternal: {
                physical:
                    "A breathtaking archipelago of islands suspended high above the clouds, where ancient, vine-choked ruins cling to cliffsides and endless waterfalls spill from rocky edges into the misty void below, all carpeted in lush, bioluminescent vegetation.",
                mental: "The islands drift on currents of leylines, braided together like the verses of a perpetual song.",
            },
            present: {
                physical:
                    "The sky is sunny with scattered, drifting clouds, and a gentle breeze carries a visible, magical aura that shimmers across the islands.",
                mental: "Merchant airships trade between the isles while seasonal storms continue to hide the deepest, most dangerous ruins.",
            },
            past: "Sky anchors forged by archmages after the Great Sundering.",
            future: "The leylines unravel unless the lost keystone is found.",
        },
        {
            id: "entity-F2",
            name: "Neo Arcadia",
            description: "Futuristic metropolis built on dream tech.",
            type: "fractal",
            visuals: { signatureColor: "rose" },
            simulation: { mode: "PASSIVE" },
            dynamics: {
                entropy: 55,
                permeability: 50,
                velocity: 60,
                resonance: 50,
            },
            eternal: {
                physical:
                    "A vertical labyrinth of chrome and light, where impossibly tall skyscrapers pierce the smog-choked stratosphere, their heights illuminated by holographic billboards and the constant pulse of flying cars through neon-drenched canyons.",
                mental: "Dreams scaffold the very towers of the city, where human intent is forged into cold, shimmering steel.",
            },
            present: {
                physical:
                    "The metropolis is choked by heavy smog and acid rain, with the neon glow of the upper levels reflecting brilliantly on the wet, rain-slicked pavement below.",
                mental: "Rival neon districts vie for total control over the Somnus Grid, the digital network that powers the city's dreams.",
            },
            past: "Founded by lucid engineers who stabilized shared dreaming.",
            future: "A city-wide insomnia threatens to collapse reality seams.",
        },
        {
            id: "entity-F3",
            name: "Nova City",
            description:
                "Neon-soaked queer utopia where heroes pose, villains cruise, and thunderstorms are just foreplay for city-wide orgies.",
            type: "fractal",
            visuals: { signatureColor: "indigo" },
            simulation: { mode: "PASSIVE" },
            dynamics: {
                entropy: 55,
                permeability: 60,
                velocity: 60,
                resonance: 60,
            },
            eternal: {
                physical:
                    "A defying, vertical labyrinth of tessellating chrome and glass, featuring skyscrapers that reach toward the stars in repeating geometric fractals. The architecture feels alive, with alleyways that contract and expand like breathing lungs and walls coated in frictionless quantum glass that reflects the permanent, ionized moonlight of the neon-saturated atmosphere.",
                mental: "The city is governed by a performance culture where every action—from combat to daily life—is measured by its engagement metrics in a society that has replaced traditional morality with viral satires.",
            },
            present: {
                physical:
                    "The city is currently gripped by heavy thunderstorms with gale-force winds and ionizing fog that reduces visibility to a few meters, while the polychromatic alloy supports of the buildings hum with an unsettling resonance.",
                mental: "The city pulses with a kinetic, algorithmic energy as hero-villain dynamics flicker between flirtation and fracture in the plasma glow of holographic bar smoke.",
            },
            past: "Established as a modular sanctuary for those fleeing persecution, the city has evolved from a series of eco-habitats into a sprawling, tech-heavy haven defined by hero/foe rivalries and superconductive 'rune-tech'.",
            future: "Nova City is accelerating toward a hyper-saturated apex of hedonistic defiance, where the lines between gladiatorial combat and erotic performance blur into a singular, sovereign surrender.",
        },
        {
            id: "entity-F4",
            name: "Messenger",
            description: "A standard mobile messaging interface.",
            type: "fractal",
            visuals: { signatureColor: "cyan" },
            icon: "messenger",
            simulation: {
                mode: "ACTIVE",
                cssTheme: "theme-smartphone",
                devMode: "TEXT_PROTOCOL",
            },
            eternal: {
                physical:
                    "Manifests as a luminous smartphone screen, its surface a window into a sleek, digital chat environment where avatars pulse with the rhythm of incoming data.",
                mental: "An encrypted, high-speed digital communication channel designed for secure data transfer.",
            },
            present: {
                physical:
                    "The digital interface is clean and responsive, showing a nearly full battery and a stable connection to the mobile network.",
                mental: "Fully operational and synchronized with the fractal's primary data streams.",
            },
            past: "Chat history cleared.",
            future: "Awaiting new messages.",
        },
    ],
}

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
        type = "",
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
    } = base

    const finalCustomData = customData?.plot?.active
        ? customData
        : { plot: { active: [], resolved: [] } }

    const safeTags = (
        Array.isArray(tags) ? tags : String(tags || "").split(",")
    )
        .map((s) => sanitizeHtml(String(s).trim()))
        .filter(Boolean)

    const existingAvatar =
        (visuals && (visuals.profilePicture || visuals.profilePictureUrl)) ||
        base.profilePicture ||
        base.profilePictureUrl ||
        ""

    return {
        // ========================================
        // CORE METADATA
        // ========================================
        name: sanitizeHtml(name).trim(),
        description: sanitizeHtml(description).trim(),
        profilePicture: sanitizeHtml(existingAvatar).trim(),
        icon,
        type: type,
        tags: safeTags,

        // ========================================
        // TEMPORAL HYBRID (6-Field System)
        // ========================================
        eternal: {
            physical: sanitizeHtml(
                eternal.physical || base.appearance || ""
            ).trim(),
            mental: sanitizeHtml(eternal.mental || base.identity || "").trim(),
        },
        present: {
            physical: sanitizeHtml(
                present.physical || base.outfit || ""
            ).trim(),
            mental: sanitizeHtml(present.mental || base.status || "").trim(),
        },
        past: sanitizeHtml(past).trim(),
        future: sanitizeHtml(future).trim(),

        // ========================================
        // DYNAMICS (Physics Sliders)
        // ========================================
        dynamics: {
            entropy: 10,
            velocity: 10,
            permeability: 50,
            resonance: 50,
            ...(dynamics || {}),
        },

        // ========================================
        // VISUALS (Appearance & Theming)
        // ========================================
        visuals: {
            flipped: visuals?.flipped || false,
            profilePicture: existingAvatar,
            signatureColor: (() => {
                const color = sanitizeHtml(
                    String(visuals?.signatureColor || "")
                ).trim()
                return color || getRandomSignatureKey()
            })(),
        },

        // ========================================
        // VOICE (TTS Configuration)
        // ========================================
        voice: {
            uri: voiceId || "",
            rate:
                base.voiceRate !== undefined ? parseFloat(base.voiceRate) : 1.0,
            pitch:
                base.voicePitch !== undefined
                    ? parseFloat(base.voicePitch)
                    : 1.0,
        },

        // ========================================
        // PLOT TRACKER & INTERNAL STATE
        // ========================================
        customData: finalCustomData,
        simulation,
        _backupState,
        _lastUpdateMsgId,
    }
}

export const formatPremade = (entity, type) => {
    const flattenedEntity = {
        ...entity,
        ...(entity.sections || {}),
    }
    delete flattenedEntity.sections

    return {
        ...flattenedEntity,
        type: type,
        isPremade: 1,
        isCustom: 0,
        version: STORAGE_VERSION,
        ...normalize(flattenedEntity),
        updatedAt: 0,
    }
}
