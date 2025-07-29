// RPGlitch Application Constants
// This file contains all application constants that were previously in RPGlitch.js

const CONSTANTS = {
    FONT_FAMILY: "'Segoe UI', system-ui, sans-serif",
    UNIVERSAL_COLORS: {
        black: "#1f2937",
        white: "#f9fafb"
    },
    COLOR_PALETTES: {
        // Blues & Teals
        tech_blue: { name: 'Tech Blue', colors: { light: '#a7d8f9', medium: '#4a90e2', dark: '#1c3a6e', neutral: '#5a6a7a' } },
        ocean_blue: { name: 'Ocean Blue', colors: { light: '#b3e5fc', medium: '#03a9f4', dark: '#01579b', neutral: '#607d8b' } },
        // Greens
        forest_green: { name: 'Forest Green', colors: { light: '#c8e6c9', medium: '#4caf50', dark: '#1b5e20', neutral: '#6c757d' } },
        // Reds & Oranges
        crimson_red: { name: 'Crimson Red', colors: { light: '#ffcdd2', medium: '#f44336', dark: '#b71c1c', neutral: '#795548' } },
        sunset_orange: { name: 'Sunset Orange', colors: { light: '#ffccbc', medium: '#ff5722', dark: '#bf360c', neutral: '#8d6e63' } },
        // Purples
        royal_purple: { name: 'Royal Purple', colors: { light: '#e1bee7', medium: '#9c27b0', dark: '#4a148c', neutral: '#6a5d7b' } },
        // Grays & Metallics
        slate_gray: { name: 'Slate Gray', colors: { light: '#cfd8dc', medium: '#607d8b', dark: '#263238', neutral: '#6c757d' } },
        cyber_pink: { name: 'Cyber Pink', colors: { light: '#f8bbd0', medium: '#e91e63', dark: '#880e4f', neutral: '#757575' } }
    },
    VIEWS: { 
        STORYBOARD: 'storyboardScreen',
        STORY_INTERFACE: 'chatInterfaceScreen',
        PREMADE_CHARACTER_SELECTION: 'premadeCharacterSelectionScreen',
        PREMADE_WORLD_SELECTION: 'premadeWorldSelectionScreen',
        CHARACTER_FORM: 'characterFormScreen',
        WORLD_FORM: 'worldFormScreen',
        CHARACTER_PROFILE: 'characterProfileScreen',
        WORLD_PROFILE: 'worldProfileScreen',
        STORY_PROFILE: 'storyProfileScreen',
        MEMORY_APPLICATION: 'memoryApplicationScreen' 
    },
    ITEM_CONFIG: {
        character: {
            itemType: 'character',
            dbTableKey: 'characters',
            capital: 'Character',
            getPremadesFn: () => App.getPremadeCharacterItems(),
            formScreen: 'characterFormScreen',
            profileScreen: 'characterProfileScreen',
            labels: {
                name: 'Name',
                description: 'Summary/Card Info',
                eternal: { main: 'Eternal', sub: 'Truths & Traits' },
                past: { main: 'Past', sub: 'Memories & Histories' },
                present: { main: 'Present', sub: 'Conditions & Opening' },
                future: { main: 'Future', sub: 'Potentials & Aspirations' },
                descriptionPlaceholder: 'A brief, one-sentence summary for the selection card. This text is not sent to the AI during story play.',
                eternalPlaceholder: "Core Identity: Unchanging physical traits (species, build, unique markings), signature skills, speaking style, inherent magical abilities or unique talents. Example: 'A stoic, seven-foot-tall cyborg dragon with a dry wit and unmatched piloting skills.'",
                pastPlaceholder: "Significant Life Events: Formative experiences, defining relationships, major turning points, learned history, or traumas that shaped them. Example: 'Orphaned during the Galactic Wars, later mentored by a cryptic space hermit, discovered an ancient artifact that changed their destiny.'",
                presentPlaceholder: "Current State & Scene: Immediate mood, recent significant actions, current attire, notable equipment, immediate surroundings or situation just before the story starts. Crucial for AI's opening. Example: 'Exhausted but determined, clutching a flickering energy blade, standing at the precipice of the Shadow Chasm.'",
                futurePlaceholder: "Aspirations & Conflicts: Driving motivations, deep-seated fears, potential character arcs, unresolved ambitions, or personal quests. What propels them forward or holds them back? Example: 'Driven to find a cure for the cosmic plague afflicting their home world, while secretly battling a prophecy that foretells their own doom.''"
            }
        },
        characterAi: {
            itemType: 'character',
            dbTableKey: 'characters',
            capital: 'Character',
            role: 'ai',
            getPremadesFn: () => App.getPremadeCharacterItems(),
            formScreen: 'characterFormScreen',
            profileScreen: 'characterProfileScreen',
            labels: {
                name: 'Name',
                description: 'Summary/Card Info',
                eternal: { main: 'Eternal', sub: 'Truths & Traits' },
                past: { main: 'Past', sub: 'Memories & Histories' },
                present: { main: 'Present', sub: 'Conditions & Opening' },
                future: { main: 'Future', sub: 'Potentials & Aspirations' },
                descriptionPlaceholder: 'A brief, one-sentence summary for the selection card. This text is not sent to the AI during story play.',
                eternalPlaceholder: "Core Identity: Unchanging physical traits (species, build, unique markings), signature skills, speaking style, inherent magical abilities or unique talents. Example: 'A stoic, seven-foot-tall cyborg dragon with a dry wit and unmatched piloting skills.'",
                pastPlaceholder: "Significant Life Events: Formative experiences, defining relationships, major turning points, learned history, or traumas that shaped them. Example: 'Orphaned during the Galactic Wars, later mentored by a cryptic space hermit, discovered an ancient artifact that changed their destiny.'",
                presentPlaceholder: "Current State & Scene: Immediate mood, recent significant actions, current attire, notable equipment, immediate surroundings or situation just before the story starts. Crucial for AI's opening. Example: 'Exhausted but determined, clutching a flickering energy blade, standing at the precipice of the Shadow Chasm.'",
                futurePlaceholder: "Aspirations & Conflicts: Driving motivations, deep-seated fears, potential character arcs, unresolved ambitions, or personal quests. What propels them forward or holds them back? Example: 'Driven to find a cure for the cosmic plague afflicting their home world, while secretly battling a prophecy that foretells their own doom.''"
            }
        },
        characterUser: {
            itemType: 'character',
            dbTableKey: 'characters',
            capital: 'Character',
            role: 'user',
            getPremadesFn: () => App.getPremadeCharacterItems(),
            formScreen: 'characterFormScreen',
            profileScreen: 'characterProfileScreen',
            labels: {
                name: 'Name',
                description: 'Summary/Card Info',
                eternal: { main: 'Eternal', sub: 'Truths & Traits' },
                past: { main: 'Past', sub: 'Memories & Histories' },
                present: { main: 'Present', sub: 'Conditions & Opening' },
                future: { main: 'Future', sub: 'Potentials & Aspirations' },
                descriptionPlaceholder: 'A brief, one-sentence summary for the selection card. This text is not sent to the AI during story play.',
                eternalPlaceholder: "Core Identity: Unchanging physical traits (species, build, unique markings), signature skills, speaking style, inherent magical abilities or unique talents. Example: 'A stoic, seven-foot-tall cyborg dragon with a dry wit and unmatched piloting skills.'",
                pastPlaceholder: "Significant Life Events: Formative experiences, defining relationships, major turning points, learned history, or traumas that shaped them. Example: 'Orphaned during the Galactic Wars, later mentored by a cryptic space hermit, discovered an ancient artifact that changed their destiny.'",
                presentPlaceholder: "Current State & Scene: Immediate mood, recent significant actions, current attire, notable equipment, immediate surroundings or situation just before the story starts. Crucial for AI's opening. Example: 'Exhausted but determined, clutching a flickering energy blade, standing at the precipice of the Shadow Chasm.'",
                futurePlaceholder: "Aspirations & Conflicts: Driving motivations, deep-seated fears, potential character arcs, unresolved ambitions, or personal quests. What propels them forward or holds them back? Example: 'Driven to find a cure for the cosmic plague afflicting their home world, while secretly battling a prophecy that foretells their own doom.''"
            }
        },
        world: {
            itemType: 'world',
            dbTableKey: 'worlds',
            capital: 'World',
            getPremadesFn: () => App.getPremadeWorldItems(),
            formScreen: 'worldFormScreen',
            profileScreen: 'worldProfileScreen',
            labels: {
                name: 'Name',
                description: 'Summary/Card Info',
                eternal: { main: 'Eternal', sub: 'Truths & Laws of Nature' },
                past: { main: 'Past', sub: 'Histories & Legends' },
                present: { main: 'Present', sub: 'State & Setting' },
                future: { main: 'Future', sub: 'Potentials & Hooks' },
                descriptionPlaceholder: 'A brief, one-sentence summary for the selection card. This text is not sent to the AI during story play.',
                eternalPlaceholder: "Fundamental Laws & Core Nature: Unchanging geography/cosmology, dominant species/cultures, overall tech level, unique natural phenomena, or immutable laws of physics. Example: 'A sentient forest planet where technology is anathema and ancient spirits guard hidden realities.'",
                pastPlaceholder: "Key Historical Events & Lore: Ancient civilizations, major conflicts, established myths, significant discoveries, or cataclysms that shaped the world's current state. Example: 'A thousand years ago, the 'Great Sundering' shattered the continent, leading to centuries of isolated tribal warfare over scarce magical resources.'",
                presentPlaceholder: "Immediate Setting & Atmosphere: Current societal mood, political climate, active factions, sensory details (sights, sounds, smells), time of day, weather, and the specific location where the story might begin. Example: 'A tense, neutral space station orbiting a contested gas giant, during a fragile peace summit between two warring alien empires.'",
                futurePlaceholder: "Looming Threats & Story Hooks: Known prophecies, brewing conflicts, potential discoveries, major unresolved tensions, upcoming significant events, or societal shifts that could drive narratives. Example: 'An ancient celestial alignment threatens to awaken a dormant cosmic entity, while a shadowy organization plots to exploit its power.''"
            }
        }
    }
};

// Make constants available globally for the merged file approach
window.CONSTANTS = CONSTANTS;