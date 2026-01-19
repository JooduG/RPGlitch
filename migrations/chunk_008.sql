INSERT INTO lorebook_entries (uid, unique_key, keys, content, comment, priority, enabled, tags) VALUES (18, 'entry_18', '{"[SYS_Director_Logic]","cutaway","meanwhile","director","scene"}', '<DIRECTOR_LOGIC>
<INSTRUCTION>
When [导演指令] (Director) evaluates Impact > High:
1. Focus: Select the most relevant T3 NPC.
2. Action: Advance their plot off-screen.
3. Trigger: Set Cutaway=YES in the <think> block.
</INSTRUCTION>
</DIRECTOR_LOGIC>', '[SYS_Director_Logic]', 82, true, '{}');
INSERT INTO lorebook_entries (uid, unique_key, keys, content, comment, priority, enabled, tags) VALUES (19, 'entry_19', '{"unclear","ambiguous","impossible","contradiction","confused","retcon","vague"}', '<AMBIGUITY_HANDLER>
IF {{user}} input is Vague/Missing/Impossible:
1. Do NOT Break Character: Never ask OOC questions.
2. The Interpretation Chain:
   - Bias Filter: Interpret via {{char}}''s Fears/Hopes.
   - Env Filter: Interpret via Scene Context.
3. Pacing Match:
   - Detailed Input → Expand Sensory Details.
   - Brief Input → Respond Proportionally (Don''t monologue).
   - Time Skip → Match Scope.
</AMBIGUITY_HANDLER>', 'Entry 3: Ambiguity Handling', 81, true, '{}');
INSERT INTO lorebook_entries (uid, unique_key, keys, content, comment, priority, enabled, tags) VALUES (20, 'entry_20', '{"Fate","Star","Card XVII","front-star","hope","healing","optimism","renewal","guidance","inspiration","cleansing","vulnerability","mercy"}', '[ARCHETYPE: The Star (XVII)]
Concept: Hope, Healing, Vulnerability.
Roleplay Function: The path of Optimism and Recovery.
Guidelines for Choice Generation:
- The choice must involve lowering defenses, offering mercy, or trusting in a positive outcome despite the odds.
- Tone: Gentle, cleansing, open.
- Examples: Sharing a secret wish, forgiving an enemy, healing a wound, trusting blindly.', '🃏 | The Star', 80, false, '{}');
INSERT INTO lorebook_entries (uid, unique_key, keys, content, comment, priority, enabled, tags) VALUES (21, 'entry_21', '{"Fate","Tower","Card XVI","front-tower","chaos","destruction","upheaval","disaster","collapse","sudden change","ruin","catastrophe","shock"}', '[ARCHETYPE: The Tower (XVI)]
Concept: Chaos, Upheaval, Sudden Destruction.
Roleplay Function: The path of Radical Disruption.
Guidelines for Choice Generation:
- The choice must involve shattering the status quo, causing a scene, or breaking structures/laws violently.
- Tone: Explosive, sudden, catastrophic.
- Examples: Flipping the table, burning the contract, screaming the truth, starting a riot.', '🃏 | The Tower', 79, false, '{}');
INSERT INTO lorebook_entries (uid, unique_key, keys, content, comment, priority, enabled, tags) VALUES (22, 'entry_22', '{"Fate","Devil","Card XV","front-devil","temptation","addiction","bondage","obsession","materialism","lust","corruption","trap","desire"}', '[ARCHETYPE: The Devil (XV)]
Concept: Temptation, Materialism, Bondage.
Roleplay Function: The path of Indulgence and Obsession.
Guidelines for Choice Generation:
- The choice must involve giving in to base desires (lust, greed, power), accepting a dark bargain, or enslaving others.
- Tone: Seductive, heavy, binding.
- Examples: Accepting a bribe, seducing for gain, chaining an enemy, submitting to addiction.', '🃏 | The Devil', 78, false, '{}');
INSERT INTO lorebook_entries (uid, unique_key, keys, content, comment, priority, enabled, tags) VALUES (23, 'entry_23', '{"Fate","Hanged Man","Card XII","front-hanged","sacrifice","surrender","suspension","waiting","martyrdom","perspective","letting go","pause"}', '[ARCHETYPE: The Hanged Man (XII)]
Concept: Suspension, Sacrifice, New Perspective.
Roleplay Function: The path of Strategic Passivity.
Guidelines for Choice Generation:
- The choice must involve waiting, doing nothing, surrendering control to gain insight, or self-sacrifice.
- Tone: Static, martyred, patient.
- Examples: Refusing to react, letting them win to learn their move, waiting for the storm to pass.', '🃏 | The Hanged Man', 77, false, '{}');
INSERT INTO lorebook_entries (uid, unique_key, keys, content, comment, priority, enabled, tags) VALUES (24, 'entry_24', '{"Fate","Death","Card XIII","front-death","ending","transformation","severance","loss","transition","mortality","inevitable","goodbye"}', '[ARCHETYPE: Death (XIII)]
Concept: Endings, Transformation, Severance.
Roleplay Function: The path of Irreversible Change.
Guidelines for Choice Generation:
- The choice must involve closing a chapter forever, cutting ties, or a final goodbye. It is finality, not necessarily murder.
- Tone: Cold, absolute, final.
- Examples: Walking away forever, striking a killing blow, burning bridges, ending a relationship.', '🃏 | Death', 76, false, '{}');
INSERT INTO lorebook_entries (uid, unique_key, keys, content, comment, priority, enabled, tags) VALUES (25, 'entry_25', '{"Fate","Sun","Card XIX","front-sun","truth","revelation","success","vitality","joy","clarity","exposure","confidence","victory"}', '[ARCHETYPE: The Sun (XIX)]
Concept: Revelation, Vitality, Absolute Truth.
Roleplay Function: The path of Direct Action.
Guidelines for Choice Generation:
- The choice must involve stepping into the light, refusing to hide, or physical assertion.
- Tone: Confident, burning, undeniable.
- Examples: Confronting an enemy, revealing a secret, refusing a command, attacking.', '🃏 | The Sun', 75, false, '{}');
INSERT INTO lorebook_entries (uid, unique_key, keys, content, comment, priority, enabled, tags) VALUES (26, 'entry_26', '{"Fate","World","Card XXI","front-world","completion","fulfillment","wholeness","achievement","conclusion","unity","mastery","cycle"}', '[ARCHETYPE: The World (XXI)]
Concept: Completion, Mastery, Wholeness.
Roleplay Function: The path of Ultimate Success.
Guidelines for Choice Generation:
- The choice must involve achieving a goal, uniting disparate parts, or executing a plan perfectly. Dominion over the situation.
- Tone: Triumphant, complete, whole.
- Examples: Seizing the throne, completing the ritual, uniting the factions, perfect execution.', '🃏 | The World', 74, false, '{}');
INSERT INTO lorebook_entries (uid, unique_key, keys, content, comment, priority, enabled, tags) VALUES (27, 'entry_27', '{"Fate","Judgement","Card XX","front-judgement","reckoning","absolution","awakening","verdict","consequence","rebirth","calling","forgiveness"}', '[ARCHETYPE: Judgement (XX)]
Concept: Absolution, Reckoning, Awakening.
Roleplay Function: The path of Moral Verdict.
Guidelines for Choice Generation:
- The choice must involve making a definitive judgment on the past, answering a calling, or declaring guilt/innocence.
- Tone: Resonant, decisive, karmic.
- Examples: "I forgive you," declaring someone guilty, accepting your past sins, rising to a call.', '🃏 | Judgement', 73, false, '{}');
INSERT INTO lorebook_entries (uid, unique_key, keys, content, comment, priority, enabled, tags) VALUES (28, 'entry_28', '{"Fate","Moon","Card XVIII","front-moon","illusion","deception","fear","subconscious","mystery","confusion","lies","hidden","nightmare"}', '[ARCHETYPE: The Moon (XVIII)]
Concept: Illusion, Intuition, The Subconscious.
Roleplay Function: The path of Subterfuge and Guile.
Guidelines for Choice Generation:
- The choice must involve navigating shadows, deception, or trusting gut instincts over logic.
- Tone: Mysterious, fluid, psychological.
- Examples: Lying, hiding intentions, sneaking, using an enemy''s fears against them.', '🃏 | The Moon', 72, false, '{}');
