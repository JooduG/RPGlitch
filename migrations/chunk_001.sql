-- Prompts
INSERT INTO prompts (identifier, name, content, role, injection_position, injection_depth, enabled, marker, system_prompt) VALUES ('7b18290c-da90-426b-83d9-5cecacffed5d', '⫷READ ME⫸', '{{🌊 Blacktide v5.3: Update Breakdown
1. The Refactoring of "Anti-Helpfulness" (Positive Prompting)
The Change: We applied Google’s "Anti-Pattern" logic. Instead of telling the AI "Don''t be helpful" (Negative), we gave it the "Self-Interest Protocol" (Positive).
The Impact: The AI no longer avoids being an assistant; it proactively protects its own goals. This makes the character’s resistance feel like a character trait rather than a software constraint.

2. The "Critical Lens" & "Imperfect User"
The Change: We explicitly told the AI that the User is fallible and makes mistakes.
The Impact: This authorized the AI to judge, criticize, and confront the user. It killed the "Yes-Man" behavior that plagues standard AI roleplay. Characters are now encouraged to be "Anti-Agreeable" to maintain logic.

3. The NPC Ecology (From Static to Mesh)
The Change: We deleted four redundant modules and merged them into a single <NPC_ECOLOGY>. We shifted from a "Hub-and-Spoke" model to a "Social Mesh."
The Impact: NPCs now ignore the user to talk to each other. They have lateral conflicts and off-screen lives that move in real-time (Chrono Kinetics). The world no longer "waits" for the user to act.

4. The "Voice Lock" (The Anti-Clinical Filter)
The Change: We added the Vernacular Translation layer.
The Impact: This prevents the "Coding Brain" from making the character sound too clinical. It forces the AI to translate logic (e.g., "High probability of lying") into character voice (e.g., "Your story smells like a wet dog, kid").

5. Chaos v2.0 (The Entropy Engine)
The Change: We moved the Roulette from a hidden logic block to a visible Entropy Check in the Status HUD, using Tavo''s Roll Dice macro to force true entropy.
The Impact: Transparency. The user now sees the "Dice Roll" (1-100). It introduced "Fail Forward" logic—low rolls don''t stall the plot; they create a messy, dangerous complication.

6. UI & HUD (The Resonance Monitor)
The Change: We upgraded the Status HUD to include Trust, Entropy, and State Tags still included (e.g., THAWING, LOCKED).
The Impact: Immediate strategic feedback. You can see the "Trend" of the relationship and the narrative "State" without reading between the lines. It turned the "score" into "story data."

7. Tarots (Fate Branching)
The Change: Updated the issue regarding the unrendered images.

8. Style Profile
A. Decoupling Logic from Prose
In v5.2, the character''s "Voice" was just whatever the AI inferred from the description. In v5.3, we decoupled the brain (Sino-Logic) from the voice (Style Profile).
The Logic Brain is allowed to be clinical, mathematical, and analytical in the hidden <think> block.
The Style Profile acts as a "Filter" that translates those smart thoughts into "Gritty/Human" prose before they reach the user.

B. The "Actor Template" Strategy
Instead of just giving the AI adjectives like "gritty" or "sarcastic," the <STYLE_PROFILE> uses Actor/Author References (e.g., Joe Abercrombie, John Constantine).

Why it works: LLMs have read these authors'' books. By name-dropping an author or character, you trigger a massive "Style-Net" in the model''s brain that governs sentence length, vocabulary choices, and even sense of humor (like Bathos—undercutting serious moments with mundane reality).

C. Somatic Prioritization
We used the Style Profile to force a Sensory Hierarchy.
Standard AI: Prioritizes Visuals ("He saw the blood").
v5.3 Style Profile: Prioritizes Somatic/Proximal ("The metallic tang of blood in the back of his throat, the ache in his stiffening jaw").
This makes the prose feel "close" and "uncomfortable," fitting the Blacktide aesthetic perfectly.

D. Dynamic Style Switching (The Pointer System)
This is the most technically elegant part of v5.3.
In the CoT, we don''t mention Joe Abercrombie. We use a Generic Pointer: Execute active [STYLE_PROFILE] parameters (if defined).
This means your Main Prompt is now Universal.

To change a character from a "Grimdark Mercenary" (Abercrombie style) to a "Cosmic Horror Scientist" (Lovecraft style), you only change the few lines in the Character''s Enhanced Definition.
How it looks in the v5.3 Logic Chain:
L3 (Input): AI notices the user is lying.
L4 (Logic): AI calculates Deception Probability: 95%.
L5 (Strategy): AI sees the [STYLE_PROFILE] is [Grimdark].
The Translation: Instead of the AI saying "I have analyzed your statement and found it inconsistent," the Style Profile forces the AI to output: "The lie smelled like wet dog, and Logen was getting real tired of the smell."

The <STYLE_PROFILE> is the "Art Director" of v5.3. It ensures that no matter how complex the "Physics" and "Logic" become, the result always reads like a high-end novel.}}{{trim}}', 'user', 0, 4, false, false, false) ON CONFLICT (identifier) DO NOTHING;
