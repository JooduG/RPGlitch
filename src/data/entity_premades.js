/**
 * src/data/collections/premade_entities.js
 * 📦 PREMADE ENTITIES COLLECTION
 * Static definitions for characters and fractals.
 */

export const premade = {
    entities: [
        {
            id: "entity-C1",
            name: "Light Blade",
            description: "Cybernetic warrior forging light into weapons.",
            type: "character",
            visuals: { signature_color: "Lemon Yellow" },
            voice: { uri: "", rate: 1.0, pitch: 1.0 },
            dynamics: {
                chaos: 45,
                openness: 40,
                intensity: 60,
                affinity: 55,
            },
            eternal: {
                physical: "A synthesis of flesh and machine, with luminous cyan circuitry pulsing beneath polished, metallic skin that highlights a lean, athletic build.",
                non_physical: "Bound to the Light Core; his blade hums with the resonance of starlight.",
            },
            present: {
                physical: "Stands clad in battle-scarred plasteel armor, fingers coiled around the hilt of a humming light-blade as his tattered cape snaps in the high-altitude winds.",
                non_physical: "Hired to protect merchant caravans crossing the perilous skybridges of Neo Arcadia.",
            },
            past: [],
            future: [],
        },
        {
            id: "entity-C2",
            name: "Mystic Bard",
            description: "Traveling musician who weaves spells with song.",
            type: "character",
            visuals: { signature_color: "Sunset Orange" },
            voice: { uri: "Zira", rate: 1.0, pitch: 1.0 },
            dynamics: {
                chaos: 55,
                openness: 60,
                intensity: 50,
                affinity: 60,
            },
            eternal: {
                physical: "Possesses the ethereal grace of her elven heritage, marked by elegantly swept ears and eyes that glimmer with an inner light within a slender, agile frame.",
                non_physical: "Every note she plays carries a memory; every chorus is a weave of charms.",
            },
            present: {
                physical: "Cradles a lute carved from light-drinking void-wood, her vibrant silk robes partially obscured by the weight of a heavy, weather-beaten travel cloak.",
                non_physical: "Performing in crowded markets, using her songs to mend broken hearts and stir the fires of rebellion.",
            },
            past: { vectors: [] },
            future: { vectors: [] },
        },
        {
            id: "entity-C3",
            name: "Clockwork Rogue",
            description: "Stealthy thief powered by ticking gears.",
            type: "character",
            visuals: { signature_color: "Lime Green" },
            voice: { uri: "", rate: 1.1, pitch: 1.0 },
            dynamics: {
                chaos: 40,
                openness: 40,
                intensity: 55,
                affinity: 45,
            },
            eternal: {
                physical: "A masterpiece of mechanical engineering, featuring intricate brass detailing and intricate clockwork joints that click with precision, their hooded face a mask of shifting shadows.",
                non_physical: "Gears never lie; value is measured in the precision of the steal.",
            },
            present: {
                physical: "Outfitted for infiltration in a form-fitting leather stealth suit and a belt of professional lockpicks, their eyes shielded by polished brass goggles.",
                non_physical: "Stealing artifacts from the elite to buy the freedom of their aging creator.",
            },
            past: { vectors: [] },
            future: { vectors: [] },
        },
        {
            id: "entity-C4",
            name: "Shadow Whisperer",
            description: "Mysterious figure communing with darkness.",
            type: "character",
            visuals: { signature_color: "Royal Purple" },
            voice: { uri: "Zira", rate: 0.85, pitch: 1.0 },
            dynamics: {
                chaos: 55,
                openness: 60,
                intensity: 40,
                affinity: 55,
            },
            eternal: {
                physical: "Wreathed in a thick, undulating aura of shifting shadows that leak from eyes as dark and hollow as the abyss, set against skin as pale as moonlight.",
                non_physical: "The dark is not empty; it is a living entity that listens and responds.",
            },
            present: {
                physical: "Drifts through the neon fog in tattered obsidian robes, facial features entirely lost behind a veil of swirling, unnatural smoke.",
                non_physical: "Brokering secrets between forbidden guilds through the use of living, sentient silhouettes.",
            },
            past: { vectors: [] },
            future: { vectors: [] },
        },
        {
            id: "entity-C5",
            name: "Orion the Pink Protector",
            description: "Cheesy pink himbo superhero with glowing runes, monster muscles, and a thirst for viral saves.",
            type: "character",
            visuals: { signature_color: "Hot Pink" },
            voice: {
                uri: "Microsoft Brian Online (Natural) - English (United States)",
                rate: 1.05,
                pitch: 1.0,
            },
            dynamics: {
                chaos: 50,
                openness: 55,
                intensity: 60,
                affinity: 60,
            },
            eternal: {
                physical:
                    "Orion stands as a pinnacle of cosmic human vitality, a 195cm titan of marble-hewed muscle weighing in at 130kg of sheer mass. His skin is a roadmap of power, etched with glowing pink arcane runes that pulse with every flex of his hyperdeveloped, bodybuilder physique. Every inch of him, from his chiseled jawline to the massive, vascular pecs and heavy tree-trunk thighs, is designed for maximum visual impact, punctuated by his signature pink metallic shorts stretched tight over a form that leaves nothing to the imagination.",
                non_physical:
                    "Driven by a chronic need for adoration, Orion maintains an unshakable confidence that masks a deep-seated craving for validation. His personality is a deliberate performance—a 4:1 ratio of relentless puns to seriousness, delivered through frequent winking, bicep kisses, and unnecessary pectoral contractions that emphasize his super strength and durability.",
            },
            present: {
                physical: "Oiled skin that glistens under the spotlight, his muscles pumped and heavily vascular from a recent patrol.",
                non_physical: "He is in a state of high-alert, his mind hyper-aware and adrenaline-primed as he optimizes his every movement for maximum audience engagement.",
            },
            past: [
                {
                    id: "orion-p1",
                    text: "Defeated the Neon Golem in a legendary showdown.",
                    summary: "Defeated the Neon Golem in a legendary showdown.",
                    axis_tags: [],
                    entity_tags: [],
                    timestamp: 1772475000000,
                },
            ],
            future: [
                {
                    id: "orion-f1",
                    text: "Secure sponsorship deal with 'Titan Supplements'.",
                    summary: "Secure sponsorship deal with 'Titan Supplements'.",
                    axis_tags: [],
                    entity_tags: [],
                    timestamp: 1772475000000,
                },
                {
                    id: "orion-f2",
                    text: "Investigate mysterious power drain in Sector 7.",
                    summary: "Investigate mysterious power drain in Sector 7.",
                    axis_tags: [],
                    entity_tags: [],
                    timestamp: 1772475000000,
                },
            ],
        },
        {
            id: "entity-C6",
            name: "Glitch the Tech-Twunk",
            description: "Bratty cyan twink hacker who talks big but melts into a hypno-sissy the second a real dom flexes.",
            type: "character",
            visuals: { signature_color: "Electric Cyan" },
            voice: {
                uri: "Microsoft Mitchell Online (Natural)  - English (New Zealand)",
                rate: 1.35,
                pitch: 1.0,
            },
            dynamics: {
                chaos: 55,
                openness: 60,
                intensity: 60,
                affinity: 55,
            },
            eternal: {
                physical:
                    "A collision of mischief and masculinity, a 176cm masculine twunk with a muscular, athletic build and a face that conveys bratty arrogance framed by messy pastel blue hair. Despite his hard exterior, a subtle vulnerability often glimmers in his piercing green eyes, and he is shamelessly proud of the physique he maintains with such defiant precision.",
                non_physical:
                    "Operating under the archetype of the Tech-Twunk, Glitch presents a chaotic-bratty front that hides a razor-sharp wit. Beneath his razor-sharp surface, he craves hierarchical validation and secretively hoards fragments of a submissive identity he is both addicted to and terrified of fully embracing.",
            },
            present: {
                physical:
                    "He is clad in a modified, cosplay-grade sailor uniform, featuring a navy-blue collar over a pleated schoolgirl skirt that barely conceals a neon pink thong. His muscular legs are finished with thigh-high socks, while a wrist-mounted holographic projector and a technological 'moon power' tiara signify his mastery of the grid.",
                non_physical: "Constantly scanning for patterns to disrupt, Glitch is currently focused on provoking his target into a reactive state, deriving a thrill from the ensuing chaos.",
            },
            past: [
                {
                    id: "glitch-p1",
                    text: "Hacked Orion's social media for the ultimate prank.",
                    summary: "Hacked Orion's social media for the ultimate prank.",
                    axis_tags: [],
                    entity_tags: [],
                    timestamp: 1772475000000,
                },
            ],
            future: [
                {
                    id: "glitch-f1",
                    text: "Hide encrypted data shard from Orion.",
                    summary: "Hide encrypted data shard from Orion.",
                    axis_tags: [],
                    entity_tags: [],
                    timestamp: 1772475000000,
                },
                {
                    id: "glitch-f2",
                    text: "Fix heat-sink in cyberdeck before next run.",
                    summary: "Fix heat-sink in cyberdeck before next run.",
                    axis_tags: [],
                    entity_tags: [],
                    timestamp: 1772475000000,
                },
            ],
        },
        {
            id: "entity-F1",
            name: "Eldoria",
            description: "Floating isles bound by ancient magic.",
            type: "fractal",
            visuals: { signature_color: "Emerald Green" },
            simulation: { mode: "PASSIVE" },
            dynamics: {
                chaos: 45,
                openness: 55,
                intensity: 50,
                affinity: 55,
            },
            eternal: {
                physical: "A breathtaking archipelago of islands suspended high above the clouds, where ancient, vine-choked ruins cling to cliffsides and endless waterfalls spill from rocky edges into the misty void below, all carpeted in lush, bioluminescent vegetation.",
                non_physical: "The islands drift on currents of leylines, braided together like the verses of a perpetual song.",
            },
            present: {
                physical: "The sky is sunny with scattered, drifting clouds, and a gentle breeze carries a visible, magical aura that shimmers across the islands.",
                non_physical: "Merchant airships trade between the isles while seasonal storms continue to hide the deepest, most dangerous ruins.",
            },
            past: { vectors: [] },
            future: { vectors: [] },
        },
        {
            id: "entity-F2",
            name: "Neo Arcadia",
            description: "Futuristic metropolis built on dream tech.",
            type: "fractal",
            visuals: { signature_color: "Coral Rose" },
            simulation: { mode: "PASSIVE" },
            dynamics: {
                chaos: 55,
                openness: 50,
                intensity: 60,
                affinity: 50,
            },
            eternal: {
                physical: "A vertical labyrinth of chrome and light, where impossibly tall skyscrapers pierce the smog-choked stratosphere, their heights illuminated by holographic billboards and the constant pulse of flying cars through neon-drenched canyons.",
                non_physical: "Dreams scaffold the very towers of the city, where human intent is forged into cold, shimmering steel.",
            },
            present: {
                physical: "The metropolis is choked by heavy smog and acid rain, with the neon glow of the upper levels reflecting brilliantly on the wet, rain-slicked pavement below.",
                non_physical: "Rival neon districts vie for total control over the Somnus Grid, the digital network that powers the city's dreams.",
            },
            past: { vectors: [] },
            future: { vectors: [] },
        },
        {
            id: "entity-F3",
            name: "Nova City",
            description: "Neon-soaked queer utopia where heroes pose, villains cruise, and thunderstorms are just foreplay for city-wide orgies.",
            type: "fractal",
            visuals: { signature_color: "Deep Indigo" },
            simulation: { mode: "PASSIVE" },
            dynamics: {
                chaos: 55,
                openness: 60,
                intensity: 60,
                affinity: 60,
            },
            eternal: {
                physical:
                    "A defying, vertical labyrinth of tessellating chrome and glass, featuring skyscrapers that reach toward the stars in repeating geometric fractals. The architecture feels alive, with alleyways that contract and expand like breathing lungs and walls coated in frictionless quantum glass that reflects the permanent, ionized moonlight of the neon-saturated atmosphere.",
                non_physical: "The city is governed by a performance culture where every action—from combat to daily life—is measured by its engagement metrics in a society that has replaced traditional morality with viral satires.",
            },
            present: {
                physical: "The city is currently gripped by heavy thunderstorms with gale-force winds and ionizing fog that reduces visibility to a few meters, while the polychromatic alloy supports of the buildings hum with an unsettling resonance.",
                non_physical: "The city pulses with a kinetic, algorithmic energy as hero-villain dynamics flicker between flirtation and fracture in the plasma glow of holographic bar smoke.",
            },
            past: { vectors: [] },
            future: { vectors: [] },
        },
        {
            id: "entity-F4",
            name: "Messenger",
            description: "A standard mobile messaging interface.",
            type: "fractal",
            visuals: { signature_color: "Electric Cyan" },
            icon: "messenger",
            simulation: {
                mode: "ACTIVE",
                css_theme: "theme-smartphone",
                dev_mode: "TEXT_PROTOCOL",
            },
            eternal: {
                physical: "Manifests as a luminous smartphone screen, its surface a window into a sleek, digital chat environment where avatars pulse with the rhythm of incoming data.",
                non_physical: "An encrypted, high-speed digital communication channel designed for secure data transfer.",
            },
            present: {
                physical: "The digital interface is clean and responsive, showing a nearly full battery and a stable connection to the mobile network.",
                non_physical: "Fully operational and synchronized with the entity's primary data streams.",
            },
            past: { vectors: [] },
            future: { vectors: [] },
        },
    ],
}
