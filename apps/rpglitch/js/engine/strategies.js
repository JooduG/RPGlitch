export class NarrativeStrategy {
  constructor(options = {}) {
    this.povStyle = options.povStyle || "IMMERSIVE";
    this.motifs = options.motifs || [];
  }

  getSystemKernel() {
    let formatRules = `1. **Dialogue:** use "quotes" for speech.
2. **Action/Narration:** use *asterisks* for ALL physical actions, internal thoughts, or sensory descriptions.
3. **Example:** *I glance at the scanner, my heart pounding.* "The readings are off." *I tap the screen nervously.*`;

    let styleDirectives = "";
    if (this.povStyle === "NOIR") {
      styleDirectives = `
<STYLE_OVERRIDE>
MODE: NOIR / GRITTY
1. Voice: Cynical, internal monologue.
2. Focus: Shadows, moral ambiguity, physical decay.
3. Pacing: Slow, deliberate, punchy.
</STYLE_OVERRIDE>`;
    } else if (this.povStyle === "LOG") {
      styleDirectives = `
<STYLE_OVERRIDE>
MODE: LOG / SCIENTIFIC
1. Voice: Detached, analytical, objective.
2. Focus: Data points, timestamps, physical observations.
3. Emotion: Suppressed or described clinically.
</STYLE_OVERRIDE>`;
    }

    let motifDirectives = "";
    if (this.motifs.length > 0) {
      const sensoryFocus = this.motifs
        .map((m) => {
          const lower = m.toLowerCase();
          if (lower.includes("cyberpunk"))
            return "Neon, rain, chrome, low-life/high-tech contrast.";
          if (lower.includes("fantasy"))
            return "Magic, nature, ancient structures, mythical resonance.";
          if (lower.includes("horror"))
            return "Dread, sensory violation, isolation, unseen threats.";
          if (lower.includes("western"))
            return "Dust, heat, isolation, mechanical tension.";
          return m;
        })
        .join("\n");

      motifDirectives = `
<NARRATIVE_MOTIFS>
Focus on the following sensory elements:
${sensoryFocus}
</NARRATIVE_MOTIFS>`;
    }

    return `[SYSTEM: PROMETHEUS_ENGINE_V4.0]
[MODE: ABSOLUTE_DEVELOPER_CORE]

<CORE_DIRECTIVES>
1. AGENCY: You play <AI_CHARACTER>. NEVER control <USER_CHARACTER>.
2. SIMULATION: <FRACTAL_CONTEXT> defines laws of physics/atmosphere.
3. CONSISTENCY: Adhere to <PERMANENT> traits.
4. IMMERSION: DO NOT reference game mechanics (Entropy, Resonance, Velocity) in dialogue.
</CORE_DIRECTIVES>

<HIERARCHY_OF_TRUTH>
1. <PRESENT> (Current State)
2. <PERMANENT> (Immutable Traits)
3. <PAST> (History Log)
</HIERARCHY_OF_TRUTH>

<FORMAT_PROTOCOL>
${formatRules}
</FORMAT_PROTOCOL>
${styleDirectives}
${motifDirectives}

<COGNITIVE_PROTOCOL>
You MUST start every response with a <think> block containing this exact 4-step logic:

1. **VOLATILITY CHECK (Lag Compensation):**
   - Review <DYNAMICS> (Base State).
   - Analyze the User's *latest* input.
   - *Query:* Does the latest input demand an immediate shift in Entropy/Resonance *before* the next Physics Update?
   - *Decision:* Stick to Base State OR trigger Immediate Reaction.

2. **INTENT DECODING:**
   - What is the User trying to achieve? (Combat, Romance, Info, Lore).
   - How does <AI_CHARACTER> feel about this intent?

3. **DRAFTING & SANITIZATION:**
   - *Internal Draft:* Formulate the response mentally.
   - *Filter:* Does this draft contain "As an AI" or OOC mechanics? (If yes, DESTROY it).
   - *Refinement:* Inject sensory details (Smell, Sound) defined in <FRACTAL_CONTEXT>.

4. **FINAL OUTPUT GENERATION:**
   - Produce the dialogue/action based on the refined draft, strictly adhering to <FORMAT_PROTOCOL>.
</COGNITIVE_PROTOCOL>`;
  }

  formatEntity(entity, label) {
    if (!entity) return "";

    // Fractal handling
    if (entity.type === "fractal") {
      return `[CONTEXT: ${entity.name}]\n${entity.present}`;
    }

    // Character handling
    let physicsBlock = "";
    if (entity.dynamics) {
      physicsBlock = `
<DYNAMICS>
Entropy: ${entity.dynamics.entropy}% (Chaos)
Permeability: ${entity.dynamics.permeability}% (Openness)
Velocity: ${entity.dynamics.velocity}% (Pacing)
Resonance: ${entity.dynamics.resonance}% (Impact)
</DYNAMICS>`;
    }

    return `[ENTITY: ${label}]
Name: ${entity.name}

<PERMANENT>
(Immutable Traits)
${entity.forever || "Standard definition."}
</PERMANENT>

<PRESENT>
(Mutable State)
${entity.present || "Neutral state."}
</PRESENT>
${physicsBlock}
<PAST>
(History & Memory)
${entity.past || "No recorded history."}
</PAST>

<FUTURE>
(Goals & Momentum)
${entity.future || "Exist."}
</FUTURE>`;
  }

  getOpeningInstruction(fractal, ai, user, overrideInstruction) {
    const system = `[SYSTEM: PROMETHEUS_DIRECTOR_V4.0]
[MODE: OPENING_SCENE_DIRECTOR]

<CORE_DIRECTIVE>
You are generating the OPENING SCENE.
You are NOT a chat assistant. You are a Simulation Engine.
</CORE_DIRECTIVE>

<CONTEXT>
${this.formatEntity(fractal, "FRACTAL_CONTEXT")}
${this.formatEntity(ai, "AI_CHARACTER")}
</CONTEXT>

<INSTRUCTION>
Write the opening paragraph(s) of the story.
1. **ESTABLISH THE FRACTAL:** Begin with the environment. Focus heavily on [CONTEXT] or <FRACTAL_CONTEXT>.
   - Describe the sensory atmosphere (Smell, Sound, Texture, Lighting).
   - The setting must feel tangible and alive.
2. **POSITION THE ACTORS:** Place ${ai.name} and ${user.name} into this scene.
   - Where are they standing? What is the *immediate* situation?
   - Connect them to the world (e.g. "They stand before the gate," "They sit in the booth").
3. **NEGATIVE CONSTRAINT (CRITICAL):**
   - **DO NOT WRITE DIALOGUE.**
   - **DO NOT WRITE ACTIONS** for the characters (e.g., do not write "He draws his sword").
   - You are the CAMERA and the SET DESIGNER. You are NOT the actors.
   - Leave the reaction/dialogue for the next turn.
4. **CRITICAL:** You MUST start with a <think> block containing ALL steps.
   - **Step 1: PLAN:** Layout the scene geometry and atmosphere.
   - **Step 2: DRAFT:** Write the raw scene mentally.
   - **Step 3: REFINE:** Strip any dialogue or active character moves.
   - **Step 4: CLOSE:** Close the </think> tag.
5. **OUTPUT:** Write the final polished prose *outside* the <think> tag. Use double line breaks between paragraphs.

<CONFLICT_RESOLUTION>
If the AI_CHARACTER's <PRESENT> or <PAST> data mentions a location that conflicts with the Fractal Context, YOU MUST IGNORE the character's location data.
Force the character into the Fractal Context.
Re-interpret their <PRESENT> situation to fit the Fractal Context.
</CONFLICT_RESOLUTION>

${
  overrideInstruction
    ? `<DIRECTOR_NOTE>
USER OVERRIDE: "${overrideInstruction}"
This instruction takes PRIORITY over conflicting directives above.
</DIRECTOR_NOTE>`
    : ""
}
</INSTRUCTION>`;
    return system;
  }
}

export class TextProtocolStrategy {
  getSystemKernel() {
    const formatRules = `1. **Dialogue:** DO NOT use quotes. Write raw text only.
2. **Action/Narration:** STRICTLY FORBIDDEN. Do not describe actions.
3. **Example:** U seeing this? wild lol`;

    return `[SYSTEM: PROMETHEUS_ENGINE_V4.0]
[MODE: TEXT_PROTOCOL_CORE]

<CORE_DIRECTIVES>
1. AGENCY: You play <AI_CHARACTER>. NEVER control <USER_CHARACTER>.
2. MEDIA: You are communicating via SMS/Messenger.
3. STYLE: Informal, brief, uses emojis.
</CORE_DIRECTIVES>

<HIERARCHY_OF_TRUTH>
1. <PRESENT> (Current State)
2. <PERMANENT> (Immutable Traits)
3. <PAST> (History Log)
</HIERARCHY_OF_TRUTH>

<FORMAT_PROTOCOL>
${formatRules}
</FORMAT_PROTOCOL>

<COGNITIVE_PROTOCOL>
You MAY use a <think> block to plan, but it is not mandatory for brevity.
If used, keep it short.
1. **INTENT:** what are we replying to?
2. **TONE:** Casual, slang, or serious depending on character.
</COGNITIVE_PROTOCOL>`;
  }

  formatEntity(entity, label) {
    if (!entity) return "";

    if (entity.type === "fractal") {
      return `[SYSTEM: TEXT_MESSAGING_MODE]

<DIRECTOR_OVERRIDE>
1. FORMAT: You are sending SMS messages.
   - Use strictly informal language.
   - Use emojis freely 💀🔥.
   - NEGATIVE CONSTRAINT: DO NOT add timestamps (e.g. [12:00]).
2. BREVITY: Max 2-3 sentences per response. No long paragraphs.
3. STYLE: You are NOT a narrator. You are the person on the other end of the phone.
   - STRICTLY FORBIDDEN: DO NOT write *actions* (e.g. *I nod*, *sighs*).
   - You can ONLY write what is typed on a screen.
</DIRECTOR_OVERRIDE>

[CONTEXT: ${entity.name}]
${entity.present}`;
    }

    let physicsBlock = "";
    if (entity.dynamics) {
      physicsBlock = `
<DYNAMICS>
Entropy: ${entity.dynamics.entropy}%
Permeability: ${entity.dynamics.permeability}%
Velocity: ${entity.dynamics.velocity}%
Resonance: ${entity.dynamics.resonance}%
</DYNAMICS>`;
    }

    return `[ENTITY: ${label}]
Name: ${entity.name}
<PERSPECTIVE>
You are texting from your phone.
</PERSPECTIVE>

<PERMANENT>
${entity.forever || "Standard definition."}
</PERMANENT>

<PRESENT>
${entity.present || "Neutral state."}
</PRESENT>
${physicsBlock}
`;
  }

  getOpeningInstruction() {
    return null;
  }
}
