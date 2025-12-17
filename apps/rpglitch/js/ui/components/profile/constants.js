export const PROFILE_SECTIONS = {
  forever: {
    label: "Forever",
    character: {
      sublabel: "Core Identity & Permanent Features",
      placeholder:
        "Define the unchangeable core of the character here. List their identity details like Name, Age, Species, and Role along with their physical biology such as Height, Eye Color, and Cybernetics. You should also define their psychological archetype and most importantly their speech patterns. Pro Tip: Include lines of Example Dialogue like 'Cut the chatter, punk' so the engine can perfectly mimic their voice.",
    },
    fractal: {
      sublabel: "Eternal Truths & Laws of Nature",
      placeholder:
        "Define the static rules of this reality. Describe the fixed geography, the sensory details like smells and lighting, and the fundamental laws of physics or magic that apply here. Establish the overall vibe such as Cyberpunk Noir or Eldritch Horror to ensure the environment feels consistent regardless of the action occurring within it.",
    },
  },
  past: {
    label: "Past",
    character: {
      sublabel: "Memories & Backstory",
      placeholder:
        "This section is the character's narrative history before the simulation began. Summarize their backstory, the deep-seated traumas that haunt them, and their key relationships with others. The engine references this section to understand their biases and knowledge but does not track their current inventory or status here.",
    },
    fractal: {
      sublabel: "History & Lore",
      placeholder:
        "Input the lore and history that explains why this place looks the way it does. Who built it and what wars or events destroyed it? Detail the secrets buried beneath the surface or the factions that previously ruled here. This provides the context the engine needs to generate environmental storytelling and clues.",
    },
  },
  present: {
    label: "Present",
    character: {
      sublabel: "Current Status & Appearance",
      placeholder:
        "Describe the character's immediate physical state. What are they wearing right now and what items are they holding? Note if they are wounded, hiding, or intoxicated. Write this like a snapshot of the current moment as the engine will automatically update this text as the story evolves and their situation changes.",
    },
    fractal: {
      sublabel: "Current State & Atmosphere",
      placeholder:
        "Describe the current, mutable state of the environment. Is it raining or foggy? Is the location crowded with NPCs or completely abandoned? Note active elements like burning fires or flickering holograms. The engine uses this data to paint the immediate scene and will update it as the timeline advances.",
    },
  },
  future: {
    label: "Future",
    character: {
      sublabel: "Plans, Goals & Prophecies",
      placeholder:
        "Define the character's direction to prevent passivity. List their immediate short-term goal for the current scene, their ultimate long-term ambition, and their Doom which is what they fear will happen if they fail. This vector drives the character's actions and decisions in the simulation.",
    },
    fractal: {
      sublabel: "Impending Events & Pressure",
      placeholder:
        "Define the pressure this environment exerts on the characters. What is about to happen? Is a bomb ticking, the sun setting, or are guards approaching? List the Goal of the fractal itself such as to confuse the players or to kill the intruders to make the setting an active participant in the story.",
    },
  },
};
