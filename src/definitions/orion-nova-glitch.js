/**
 * src/definitions/orion-nova-glitch.js
 * ============================================================================
 * 📖 PREMADE STORY FIXTURE (Orion, Glitch & Nova City)
 * ============================================================================
 *
 * Pre-seeded 10-round story history + mutation ledger diffs so Orion, Glitch,
 * and Nova City have an inspectable chat log, mutation ledger, and time-travel
 * replay on boot without needing a live LLM session.
 * ============================================================================
 */

export const ORION_NOVA_GLITCH_STORY = Object.freeze({
  key: "orion-nova-glitch",
  title: "Neon Static & Pink Thunder",
  ai_id: "orion",
  user_id: "glitch",
  fractal_id: "nova",
  visual_style: "cyberpunk",
  narrative_style: "samuel_delany",
  round: 10,
  is_concluded: 1,
  turns: Object.freeze([
    {
      round: 1,
      user_text:
        "I perch on the billboard catwalk above Upper Nova, flick a holographic decoy onto the plaza below, and ping Orion's public patrol channel. \"Catch me if your calves aren't purely decorative, Pinky.\"",
      ai_text:
        'Orion skids to a halt mid-jog on the skybridge, neon reflections sliding across his chest harness as he spots the cyan silhouette above. "Citizens, stay clear of unauthorized rooftop gymnastics!" he booms, grinning up at the catwalk before vaulting the railing in a single booming leap.',
      mutations: [
        {
          entity_id: "glitch",
          seq: 1,
          field: "present.non_physical",
          key: "FOCUS",
          old_value: "crouched low on a rooftop vent mid-breach but paused",
          new_value: "taunting Orion from the Upper Nova billboard catwalk",
        },
        {
          entity_id: "orion",
          seq: 2,
          field: "present.non_physical",
          key: "PERIMETER",
          old_value: "actively scans the perimeter for trouble",
          new_value: "locked onto Glitch's neon decoy and catwalk perch",
        },
        { entity_id: "nova", seq: 3, field: "dynamics", key: "VELOCITY", old_value: "56", new_value: "61" },
      ],
    },
    {
      round: 2,
      user_text:
        "I drop through the maintenance hatch as he lands, sliding down a rusted conduit toward the mid-tier service alley while routing a loop of his own flex-cam into the district speakers.",
      ai_text:
        'His boots hit steel with a heavy clang, and his own voice echoes back at him from three streetlamps at once. "Hey, that\'s copyrighted motivational audio!" Orion laughs, vaulting over the hatch rim and dropping down the shaft after the retreating cyan blur.',
      mutations: [
        {
          entity_id: "glitch",
          seq: 1,
          field: "present.physical",
          key: "JACKET",
          old_value: "open cropped black tech jacket",
          new_value: "scuffed black tech jacket dusted with conduit soot",
        },
        { entity_id: "orion", seq: 2, field: "dynamics", key: "CHAOS", old_value: "57", new_value: "62" },
        {
          entity_id: "nova",
          seq: 3,
          field: "present.non_physical",
          key: "AUDIO",
          old_value: "ambient club bass and traffic hum",
          new_value: "Orion's looped fitness commentary echoing across mid-tier speakers",
        },
      ],
    },
    {
      round: 3,
      user_text:
        "I hit the alley grating in a crouch, spark my gauntlet to jam the blast shutter behind me, and glance back through the bars with a breathless smirk.",
      ai_text:
        'Orion catches the descending shutter with both palms, biceps swelling as hydraulic pistons whine against his grip. He peers through the gap, pink eyes bright beneath his brow. "You know, normal hackers just use passwords, amigo."',
      mutations: [
        {
          entity_id: "orion",
          seq: 1,
          field: "present.physical",
          key: "POSTURE",
          old_value: "dominant power-pose with chest thrust forward and shoulders flared",
          new_value: "braced wide, holding up a descending steel blast shutter bare-handed",
        },
        { entity_id: "glitch", seq: 2, field: "dynamics", key: "INTENSITY", old_value: "44", new_value: "53" },
        { entity_id: "nova", seq: 3, field: "dynamics", key: "ENTROPY", old_value: "54", new_value: "59" },
      ],
    },
    {
      round: 4,
      user_text:
        "I sidestep into the steam-choked transit lift down toward Ytic'avon, tapping the override before he can squeeze through. \"Passwords don't make you flex like that, sweetheart.\"",
      ai_text:
        "The shutter slams down half an inch behind his heels as Orion dives into the freight elevator just before the doors seal. The cab shudders downward into warmer, copper-scented air while he rests a broad forearm above Glitch's shoulder. \"Flattery doesn't void a citizen's arrest.\"",
      mutations: [
        {
          entity_id: "nova",
          seq: 1,
          field: "present.physical",
          key: "ZONE",
          old_value: "Upper Nova Neon Plaza",
          new_value: "Subterranean Freight Shaft toward Ytic'avon",
        },
        { entity_id: "orion", seq: 2, field: "dynamics", key: "AFFINITY", old_value: "58", new_value: "64" },
        { entity_id: "glitch", seq: 3, field: "dynamics", key: "AFFINITY", old_value: "56", new_value: "63" },
      ],
    },
    {
      round: 5,
      user_text:
        "In the cramped flickering lift, I don't step back—I tilt my chin up and tap the glowing pink disc on my gauntlet against the edge of his harness.",
      ai_text:
        'Orion\'s easy grin softens into something quieter, his chest rising a fraction faster in the amber emergency glow. "Careful," he murmurs, dropping the booming announcer voice. "You keep poking the Pink Protector and you might find out Rafael\'s underneath."',
      mutations: [
        {
          entity_id: "orion",
          seq: 1,
          field: "present.non_physical",
          key: "MOOD",
          old_value: "grinning and rolling his shoulders so the applause keeps coming",
          new_value: "unmasked, quiet warmth beneath the hero persona",
          visibility: "hide",
          weight: 8,
        },
        {
          entity_id: "glitch",
          seq: 2,
          field: "present.non_physical",
          key: "RATIONALIZATION",
          old_value: "flushing faintly while insisting he is only verifying a patrol route",
          new_value: "standing his ground inches away without reaching for an escape script",
        },
      ],
    },
    {
      round: 6,
      user_text:
        "The lift doors rattle open onto an Ytic'avon catwalk above a green coolant canal. Two Silvers Corp drones sweep the lower pier with crimson searchlights.",
      ai_text:
        'Instantly Orion steps half a pace in front of Glitch, broad shoulders shielding him from the sweep of the lenses. "Looks like your fan club isn\'t the only one watching down here," he whispers. "Left conduit or under the pier?"',
      mutations: [
        {
          entity_id: "nova",
          seq: 1,
          field: "present.non_physical",
          key: "THREAT",
          old_value: "routine upper-district patrol",
          new_value: "Silvers Corp drones sweeping Ytic'avon coolant canal",
        },
        { entity_id: "orion", seq: 2, field: "dynamics", key: "INTENSITY", old_value: "56", new_value: "68" },
        {
          entity_id: "glitch",
          seq: 3,
          field: "present.non_physical",
          key: "FOCUS",
          old_value: "taunting Orion from the Upper Nova billboard catwalk",
          new_value: "coordinating stealth bypass with Orion under drone sweep",
        },
      ],
    },
    {
      round: 7,
      user_text:
        '"Under the pier—and hold still a second." I clamp a jumper lead from my gauntlet onto his glowing pink energy ribbon to mask both our thermal signatures.',
      ai_text:
        "A soft violet arc hums between the gauntlet and his harness, dimming the pink glow to a low ember. Orion stays completely still, watching Glitch's hands work with steady focus. \"Didn't know my merch was compatible with your hardware.\"",
      mutations: [
        {
          entity_id: "orion",
          seq: 1,
          field: "present.physical",
          key: "CONDITION",
          old_value: "skin glistening with a light sheen of athletic sweat",
          new_value: "harness energy ribbons dimmed by Glitch's thermal-masking jumper",
        },
        { entity_id: "glitch", seq: 2, field: "dynamics", key: "OPENNESS", old_value: "48", new_value: "57" },
      ],
    },
    {
      round: 8,
      user_text:
        "We slip beneath the rusted pilings as the drones pass overhead, close enough that I hear the low hum of the coolant river and feel the heat off his shoulders.",
      ai_text:
        "When the red beams sweep clear, Orion lets out a slow breath and doesn't immediately move away. He glances sideways at Glitch in the dim violet light. \"You actually look out for people down here, don't you? Not just the show.\"",
      mutations: [
        { entity_id: "orion", seq: 1, field: "dynamics", key: "OPENNESS", old_value: "60", new_value: "67" },
        { entity_id: "glitch", seq: 2, field: "dynamics", key: "CHAOS", old_value: "52", new_value: "47" },
        { entity_id: "nova", seq: 3, field: "dynamics", key: "VELOCITY", old_value: "61", new_value: "52" },
      ],
    },
    {
      round: 9,
      user_text:
        '"Somebody has to skim the cream off Silvers\'s vaults," I mutter, unhooking the jumper lead and stuffing my hands into my jacket pockets. "Doesn\'t mean I need a cape."',
      ai_text:
        'Orion chuckles softly, rolling his shoulders as the harness flares back to life. "Good. Capes snag on vents anyway. Come on, hacker—I\'ll clear the stairwell back up if you promise not to loop my leg-day stream again."',
      mutations: [
        {
          entity_id: "orion",
          seq: 1,
          field: "future",
          key: "AGENDA",
          old_value: "high-visibility viral rescue scenario where the men he saves openly praise his herculean frame on a live broadcast",
          new_value: "quietly escorting Glitch back toward Upper Nova after the drone sweep",
        },
        {
          entity_id: "glitch",
          seq: 2,
          field: "future",
          key: "AGENDA",
          old_value: "push the wrong big strong man too far with his upper-district pranks",
          new_value: "meet Orion off-camera at the mid-tier overlook without running a script",
        },
      ],
    },
    {
      round: 10,
      user_text:
        'At the top of the service stairs, I pause by the neon-lit railing and toss him an encrypted burner key. "Same frequency tomorrow night, Rafael. Don\'t wear the noisy boots."',
      ai_text:
        'Orion catches the key cleanly against his palm, a genuine, unguarded smile lighting his face as the Upper Nova skyline hums behind them. "Deal," he says softly, watching the cyan hair vanish back into the neon mist.',
      mutations: [
        {
          entity_id: "orion",
          seq: 1,
          field: "past",
          key: "YTICAVON_TRUCE",
          old_value: null,
          new_value: "Shared a quiet truce with Glitch beneath the Ytic'avon piers and accepted an encrypted burner key as Rafael",
          visibility: "show",
          weight: 9,
        },
        {
          entity_id: "glitch",
          seq: 2,
          field: "past",
          key: "BURNER_KEY",
          old_value: null,
          new_value: "Gave Orion a direct encrypted frequency after masking both signatures from Silvers Corp drones",
          visibility: "show",
          weight: 9,
        },
        { entity_id: "orion", seq: 3, field: "dynamics", key: "AFFINITY", old_value: "64", new_value: "74" },
        { entity_id: "glitch", seq: 4, field: "dynamics", key: "AFFINITY", old_value: "63", new_value: "72" },
      ],
    },
  ]),
});
