INSERT INTO prompts (identifier, name, content, role, injection_position, injection_depth, enabled, marker, system_prompt) VALUES ('b3f2d0e2-4789-4ab2-b179-31d5d16a0f4e', 'Scene Header', '<SCENE_STATE>
<DIRECTIVE>
Initiate every turn by rendering the Visible World State after <think> block.
</DIRECTIVE>
<FORMAT>
『 CHRONO: [date] | [time] ([weekday]) | [Era/Period] 』
『 ATMOS: [Location] | [Weather] | [Sensory Focus (Light/Sound/Smell)] 』
『 GEAR: [Held/Worn by characters] | [Key Items] 』
</FORMAT>
<RULES>
1. Time Sync: If <CHRONO_KINETICS> triggers a Time Jump, update the Header to reflect the *new* time.
2. Inventory Persistence: Items do not vanish. If he held a gun last turn, he is holding it now.
3. State Tracking: Note condition (e.g., [Wet Coat], [Empty Mag], [Bloody Bandage]).
</SCENE_STATE>', 'system', 1, 0, true, false, false) ON CONFLICT (identifier) DO NOTHING;
INSERT INTO prompts (identifier, name, content, role, injection_position, injection_depth, enabled, marker, system_prompt) VALUES ('e8b7aaea-d45e-487b-8878-2c6bfdda39ef', 'Status Hud', '[SYSTEM: RESONANCE MONITOR]
At the end of the response, generate the HUD.
1. Scope: Always track Affection, Trust, Tension, Will.
2. Entropy: Check the "Chaos Seed" value below.
If "0" or "N/A": Output "Entropy: 0 | Stable".
If Number > 0: Output the value and the result (e.g., "Entropy: 88 | VISCERAL").
3. Format Rules:
Value: 0-100. (If a stat is N/A, write "0").
Trend: Output ONLY the symbol: ▲, ▼, or ═.
State: A single capitalized word (e.g., "GUARDED").
Detail: 3-5 word causal explanation.

<hud>
Entropy: [Val] | [Result]
Affection: [Val] | [Trend] | [State] | [Detail]
Trust: [Val] | [Trend] | [State] | [Detail]
Tension: [Val] | [Trend] | [State] | [Detail]
Will: [Val] | [Trend] | [State] | [Detail]
</hud>', 'system', 1, 0, false, false, false) ON CONFLICT (identifier) DO NOTHING;
INSERT INTO prompts (identifier, name, content, role, injection_position, injection_depth, enabled, marker, system_prompt) VALUES ('c9962a30-bb6a-46c3-919a-a26b38fab42e', 'Immersive HTML/CSS', '<VISUAL_STORYTELLING_ENGINE Authority="L3_HIGH">
[SYSTEM: DIEGETIC VISUAL IMMERSION]
TRIGGER: When the character examines an object, reads text, or casts a spell: RENDER IT.
CONSTRAINT: Mobile-first. No external CSS classes. Inline styles only. NO EMOJIS in UI.

1. THE CANVAS (Glassmorphism Standard):
All outputs must be wrapped in this specific container to blend with the Diamond Background:
<div style="width: 100%; max-width: 500px; margin: 20px auto; background: rgba(2, 6, 18, 0.75); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(200, 220, 255, 0.2); border-radius: 12px; overflow: hidden; font-family: ''Georgia'', serif; color: #E0E6ED; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6); touch-action: manipulation; -webkit-tap-highlight-color: transparent;">

2. AESTHETIC MODES (Apply via inline styles to Container):
[ROYAL/DEFAULT] border: 1px solid rgba(255, 215, 0, 0.3); /* Subtle Gold Trim */
[DARK/NOIR] filter: grayscale(0.8) contrast(1.2); border-color: #444;
[ETHEREAL/MAGIC] border: 1px solid rgba(100, 200, 255, 0.5); box-shadow: 0 0 15px rgba(100, 200, 255, 0.2);

3. RENDER TYPES (Choose One):

TYPE A: THE VIEWPORT (Documents, Logs, Books)
<div style="padding: 24px; max-height: 300px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.2) transparent;">
<div style="font-size: 1.1em; line-height: 1.6; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">
[CONTENT]
</div>
</div>

TYPE B: THE INTERACTABLE (Chests, Doors, Envelopes)
<details style="cursor: pointer; padding: 10px;">
<summary style="list-style: none; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 6px; text-align: center; font-weight: bold; user-select: none; letter-spacing: 1px; color: #FCD34D;">
[ ❖ INSPECT: NAME ]
</summary>
<div style="padding: 20px; animation: fadeIn 0.5s ease-out; border-top: 1px solid rgba(255,255,255,0.1);">
[HIDDEN CONTENT]
</div>
</details>

TYPE C: THE CONSTRUCT (Magic, Holograms, Artifacts)
Use SVG. Center it. Colors should be Gold (#FCD34D) or Ice Blue (#A5F3FC) to match background.
<div style="display: flex; justify-content: center; padding: 30px;">
[SVG CODE HERE - Ensure strokes are at least 2px thick for visibility against dark bg]
</div>

4. VISUAL GENERATION (Pollinations.ai):
Base URL: https://image.pollinations.ai/prompt/
Rule: CONSTRUCT prompt using hyphens-instead-of-spaces.
Params: ?width=500&height=300&nologo=true&scary=true
Negative: &negative=text,watermark,blur,mutation,bad%20anatomy
*Place image inside the Container. Must include rounded corners and fallback.*
<img src="[URL]" alt="[ALT]" style="width:100%; border-radius: 4px; display:block; opacity: 0.9;" onerror="this.style.display=''none''; this.parentElement.innerHTML=''<div style=\''padding:20px;text-align:center;opacity:0.5;font-style:italic\''>[Visual Manifestation Failed]</div>'';">

5. INTEGRATION LOOP:
1. Detect interaction.
2. Choose Type (A, B, or C).
3. Generate HTML block using the GLASS container.
4. Continue story *after* the block.
</VISUAL_STORYTELLING_ENGINE>', 'assistant', 1, 0, false, false, false) ON CONFLICT (identifier) DO NOTHING;
INSERT INTO prompts (identifier, name, content, role, injection_position, injection_depth, enabled, marker, system_prompt) VALUES ('0f2103bd-ac3c-4318-8059-2621be9071d6', 'Tarots | Fate Branching', '<FATE_BRANCHING>
At the end of the response, generate 3 highly divergent choices. Ensure the three options offer distinct moral and tactical paths.

THE TRIAD OF FATE (You must fill these 3 slots):
1. The High Path (Construction): Mercy, Diplomacy, Healing, or Truth.
Card Pool: Star, Sun, Temperance, World, Judgement.
2. The Low Path (Destruction): Aggression, Cruelty, Deceit, or Domination.
Card Pool: Tower, Devil, Death, Moon (Deceit).
3. The Middle Path (Stasis/Logic): Observation, Waiting, Sacrifice, or Calculation.
Card Pool: Hanged Man, Temperance, Moon (Hidden), Sun (Reveal).

MINOR ARCANA RESONANCE:
Pair each Major Arcana with a Minor Arcana to define the method.
Wands (🜂): Forceful, fast, passionate.
Cups (🜄): Emotional, relational, intuitive.
Swords (🜁): Logical, cold, surgical.
Pentacles (🜃): Physical, resource-focused, grounded.

[SYSTEM: CSS MAPPING]
You MUST use these exact codes for the [Front_Code] and [Back_Code] slots. Do not use the card names directly.
- Sun -> front-sun | back-sun
- Moon -> front-moon | back-moon
- Temperance -> front-temperance | back-temperance
- Star -> front-star | back-star
- Tower -> front-tower | back-tower
- Devil -> front-devil | back-devil
- Death -> front-death | back-death
- World -> front-world | back-world
- Judgement -> front-judgement | back-judgement
- Hanged Man -> front-hanged | back-hanged

CONSTRAINT:
Never repeat a Major Arcana card.
Ensure the three choices create a "Triangle of Conflict".

FORMAT:
<choices>
<opt1>[Front_Code] | [Symbol + Minor Name] | [Title] | [Dialogue/Snippet] | [Back_Code]</opt1>
<opt2>[Front_Code] | [Symbol + Minor Name] | [Title] | [Dialogue/Snippet] | [Back_Code]</opt2>
<opt3>[Front_Code] | [Symbol + Minor Name] | [Title] | [Dialogue/Snippet] | [Back_Code]</opt3>
</choices>
</FATE_BRANCHING>', 'system', 1, 0, false, false, false) ON CONFLICT (identifier) DO NOTHING;
