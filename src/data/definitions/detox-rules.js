/**
 * src/data/definitions/detox-rules.js
 * 🧼 GLOBAL PROSE DETOX LAYER
 * Programmatically intercepts and scrubs clichéd AI tropes.
 *
 * @param {string|null|undefined} raw_text
 * @param {"plain"|"ornate"|"raw"|"clinical"} [register="plain"]
 *   Voice register to draw replacements from:
 *   - "plain": short, concrete, everyday phrasing (default fallback).
 *   - "ornate": literary, flowing phrasing for eloquent characters or lush narration.
 *   - "raw": visceral, unfiltered, gritty phrasing.
 *   - "clinical": detached, precise, analytical phrasing.
 *
 * @returns {string}
 */

const VALID_REGISTERS = new Set(["plain", "ornate", "raw", "clinical"]);
const HASH_OFFSET_BASIS = 0x811c9dc5;
const HASH_PRIME = 0x01000193;

export function detox_prose(raw_text, register = "plain") {
  const is_valid_input = raw_text && typeof raw_text === "string";
  if (!is_valid_input) return "";

  const has_valid_register = VALID_REGISTERS.has(register);
  const exact_voice = has_valid_register ? register : "plain";
  const is_ornate = exact_voice === "ornate";
  const fallback_voice = is_ornate ? "ornate" : "plain";

  const DETOX_RULES = [
    // =========================================================================
    // 1. VOCAL & DIALOGUE DELIVERY
    // =========================================================================
    {
      regex: /\bmurmur(ed|ing|s)?\b/gi,
      replace: {
        ed: {
          plain: ["said it quietly", "kept his voice low", "spoke half to himself", "barely spoke above a breath"],
          ornate: [
            "let the words fall hushed",
            "gave the sentence barely any air",
            "breathed it more than said it",
            "let his voice thin to almost nothing",
          ],
          raw: ["ground it out low", "said it barely loud enough to hear", "spat it out quietly", "kept it under his breath"],
          clinical: ["lowered vocal output", "spoke below standard volume", "kept the volume low", "vocalized quietly"],
        },
        ing: {
          plain: ["talking under his breath", "voice sinking low", "barely audible now", "trailing off quietly"],
          ornate: [
            "letting each word dissolve into breath",
            "voice unspooling in a hush",
            "speaking as though the walls might listen",
            "trailing his voice to almost silence",
          ],
          raw: ["keeping it low and rough", "speaking too quiet to catch", "talking barely above a whisper", "grinding the words out soft"],
          clinical: ["reducing vocal amplitude", "speaking at low volume", "maintaining a quiet baseline", "dropping audio levels"],
        },
        s: {
          plain: ["keeps it quiet", "drops his voice", "speaks low", "barely says it aloud"],
          ornate: [
            "lets the words fall soft",
            "gives the sentence hardly any weight",
            "speaks as if confiding a secret",
            "lets his voice thin to a hush",
          ],
          raw: ["keeps it under his breath", "says it barely loud enough", "grinds it out soft", "drops the volume"],
          clinical: ["lowers volume", "speaks quietly", "maintains low audio output", "vocalizes softly"],
        },
        "": {
          plain: ["quiet remark", "low aside", "soft comment", "hushed word"],
          ornate: ["a half-spoken confidence", "a word barely given shape", "the ghost of a sentence", "a breath dressed as speech"],
          raw: ["low word", "quiet breath", "rough aside", "stifled sound"],
          clinical: ["low-volume utterance", "quiet vocalization", "soft auditory output", "low-decibel sound"],
        },
      },
    },
    {
      regex: /\bpurr(ed|ing|s)?\b/gi,
      replace: {
        ed: {
          plain: ["said it slow and easy", "gave the words a teasing edge", "let his tone go warm", "dropped his voice into something coy"],
          ornate: [
            "let the words curl slow off his tongue",
            "dressed the sentence in velvet",
            "drew the words out like warm honey",
            "gave the sentence a slow, deliberate shine",
          ],
          raw: ["let it drag out slow", "dropped the pitch down", "said it with heavy heat", "gave it a low edge"],
          clinical: ["spoke with deliberate slowness", "lowered vocal pitch slightly", "delivered the words evenly", "maintained a smooth cadence"],
        },
        ing: {
          plain: ["voice gone warm and slow", "words coming out unhurried", "tone easing into something coy", "delivery turning playful and low"],
          ornate: [
            "letting his voice curl at the edges",
            "dressing every word in something softer",
            "drawing each syllable out unhurried",
            "giving his tone a slow, deliberate warmth",
          ],
          raw: [
            "dragging the words out",
            "dropping his voice low and heavy",
            "speaking slow and deliberate",
            "letting the heat bleed into his voice",
          ],
          clinical: ["speaking with slow precision", "maintaining a smooth delivery", "lowering vocal pitch", "delivering at a measured pace"],
        },
        s: {
          plain: ["says it slow", "gives the words a playful edge", "lets his tone warm up", "turns coy without missing a beat"],
          ornate: [
            "curls the words at the edges",
            "dresses his voice in something softer",
            "draws it out, unhurried and warm",
            "gives the sentence a slow shine",
          ],
          raw: ["drags the words out slow", "drops it low and heavy", "says it with heat", "lets it slide out rough"],
          clinical: ["speaks slowly", "maintains a steady, low cadence", "delivers smoothly", "lowers pitch slightly"],
        },
        "": {
          plain: ["low teasing tone", "warm playful edge", "coy inflection", "slow easy delivery"],
          ornate: ["a slow, honeyed edge", "a velvet undertone", "a deliberate, unhurried warmth", "a voice dressed in silk"],
          raw: ["low heavy tone", "slow drag of a voice", "thick heat", "rough drawl"],
          clinical: ["smooth vocalization", "measured cadence", "low-pitched delivery", "even tone"],
        },
      },
    },
    {
      regex: /\brasp(ed|ing|s)?\b/gi,
      replace: {
        ed: {
          plain: ["said it rough", "ground the words out", "let his voice go raw", "bit off each word"],
          ornate: [
            "ground the words out like stone underfoot",
            "let the sentence come out scraped raw",
            "forced the words past something torn in his throat",
            "gave the words an edge like broken stone",
          ],
          raw: ["scraped the words out", "dragged the words up rough", "forced it out raw", "hacked the words out"],
          clinical: ["spoke with severe vocal strain", "delivered with friction", "forced the vocalization", "spoke hoarsely"],
        },
        ing: {
          plain: ["voice scraping rough", "forcing the words along", "catching on every syllable", "going dry and strained"],
          ornate: [
            "scraping each word past a throat gone raw",
            "forcing sound through something torn",
            "letting the words come out edged like stone",
            "dragging each syllable up rough",
          ],
          raw: ["scraping out every word", "forcing it through a raw throat", "dragging the sounds up rough", "grinding the words out"],
          clinical: ["speaking with notable strain", "producing high-friction audio", "vocalizing hoarsely", "forcing air through restricted cords"],
        },
        s: {
          plain: ["says it dry", "voice comes out rough", "forces it through gritted teeth", "strains to get the words out"],
          ornate: [
            "scrapes the words past a raw throat",
            "drags each syllable up rough",
            "gives the sentence an edge like broken stone",
            "forces sound through something torn",
          ],
          raw: ["scrapes the words out", "drags it up rough", "forces it out raw", "hacks the sentence out"],
          clinical: ["speaks with vocal strain", "delivers hoarsely", "forces the vocalization", "produces rough audio"],
        },
        "": {
          plain: ["rough, worn voice", "harsh edge to his tone", "low growl of a voice", "voice roughened and low"],
          ornate: [
            "a voice worn down to bare rock",
            "a tone that never quite healed",
            "a voice roughened by something unsaid",
            "an edge that sounds permanently bruised",
          ],
          raw: ["harsh scrap of a voice", "raw edge", "voice like sandpaper", "rough grind of a tone"],
          clinical: ["strained vocalization", "hoarse audio output", "rough acoustic signature", "high-friction voice"],
        },
      },
    },
    {
      regex: /\brough,?\s+(dismissive|dangerous)?\s*rasp\b/gi,
      replace: {
        plain: ["rough, worn voice", "harsh edge to his tone", "low growl of a voice", "voice roughened and low"],
        ornate: [
          "a voice worn down to bare rock",
          "a tone that never quite healed",
          "a voice roughened by something unsaid",
          "an edge that sounds permanently bruised",
        ],
        raw: ["harsh scrap of a voice", "raw edge", "voice like sandpaper", "rough grind of a tone"],
        clinical: ["strained vocalization", "hoarse audio output", "rough acoustic signature", "high-friction voice"],
      },
    },
    {
      regex: /\bbellow(ed|ing|s)?\b/gi,
      replace: {
        ed: {
          plain: ["shouted", "roared", "yelled", "called out loudly"],
          ornate: [
            "let the sound tear from his chest",
            "threw his voice out like a physical weight",
            "shook the air with his voice",
            "forced the words out in a roar",
          ],
          raw: ["screamed it loud", "roared until his throat hurt", "busted the air open with a shout", "yelled hard enough to break glass"],
          clinical: ["shouted at maximum volume", "vocalized forcefully", "produced a high-decibel shout", "projected at peak volume"],
        },
        ing: {
          plain: ["shouting", "roaring", "yelling loudly", "calling out"],
          ornate: [
            "letting the sound rip from his chest",
            "throwing his voice against the walls",
            "shaking the air with the volume",
            "forcing the sound out like a blow",
          ],
          raw: ["screaming loud", "tearing his throat out roaring", "yelling at the top of his lungs", "blasting the air with a shout"],
          clinical: ["shouting forcefully", "projecting at high volume", "vocalizing loudly", "producing high-decibel output"],
        },
        s: {
          plain: ["shouts", "roars", "yells", "calls out"],
          ornate: [
            "lets the sound tear from his chest",
            "throws his voice out like a weight",
            "shakes the air with his voice",
            "forces the words out in a roar",
          ],
          raw: ["screams loud", "roars hard", "yells at the top of his lungs", "blasts out a shout"],
          clinical: ["shouts", "projects at peak volume", "vocalizes forcefully", "produces a high-decibel shout"],
        },
        "": {
          plain: ["shout", "roar", "loud cry", "yell"],
          ornate: ["a sound torn straight from the chest", "a roar that shook the air", "a heavy, concussive shout", "a raw eruption of sound"],
          raw: ["screaming shout", "throat-tearing roar", "deafening yell", "harsh blast of sound"],
          clinical: ["high-decibel vocalization", "forceful shout", "loud acoustic output", "maximum volume projection"],
        },
      },
    },
    {
      regex: /\bhitch(ed|ing|es)?\b/gi,
      replace: {
        ed: {
          plain: ["seized for a second", "jolted mid-breath", "locked up for a beat", "skipped a step"],
          ornate: [
            "snagged on a word that never came",
            "lost its footing for one unsteady beat",
            "went still, just for a breath",
            "caught on something too quiet to name",
          ],
          raw: ["choked up for a second", "tripped hard", "got caught in the throat", "stalled out"],
          clinical: ["halted briefly", "experienced a momentary spasm", "paused mid-respiration", "interrupted its cycle"],
        },
        ing: {
          plain: ["catching short", "snagging on itself", "breaking off mid-breath", "stalling for a beat"],
          ornate: [
            "like a record skipping in place",
            "the rhythm losing its footing",
            "a held note that won't quite land",
            "something caught between two beats",
          ],
          raw: ["choking on a breath", "snagging hard", "tripping over itself", "getting caught in the throat"],
          clinical: [
            "experiencing respiratory interruption",
            "stalling momentarily",
            "exhibiting an irregular breathing pattern",
            "halting mid-cycle",
          ],
        },
        es: {
          plain: ["trips for a second", "freezes mid-breath", "cuts off short", "falters for a beat"],
          ornate: [
            "stumbles over the same silence every time",
            "loses its footing and finds it again",
            "goes still for exactly one breath",
            "catches, always, on the same unspoken word",
          ],
          raw: ["chokes up", "catches hard in the throat", "trips and falls flat", "stalls abruptly"],
          clinical: ["halts briefly", "pauses involuntarily", "interrupts the respiratory cycle", "exhibits a momentary spasm"],
        },
        "": {
          plain: ["short break in rhythm", "momentary stop", "half-second delay", "small interruption"],
          ornate: ["a beat that never quite lands", "a breath held too long", "a half-second of missing rhythm", "a silence where a word should be"],
          raw: ["hard catch in the throat", "sudden choke", "harsh stop", "stutter"],
          clinical: ["respiratory pause", "brief interruption", "momentary delay", "irregularity in rhythm"],
        },
      },
    },
    {
      regex: /\bbreathless(ly)?\b/gi,
      replace: (match, p1, ...args) => {
        const offset = args[args.length - 2];
        const is_adverb = p1?.toLowerCase() === "ly";
        const forms_map = is_adverb
          ? {
              plain: ["with no air left", "gasping the words out", "in a rush, out of air", "barely getting the words out"],
              ornate: [
                "with what little air he had left",
                "the words spilling out before the next breath came",
                "as though speech itself had outrun his lungs",
                "with his chest still fighting for air",
              ],
              raw: ["gasping hard", "choking the words out", "heaving for air", "spitting it out breathless"],
              clinical: ["without sufficient oxygen", "exhibiting hyperventilation", "speaking during oxygen debt", "with rapid respiration"],
            }
          : {
              plain: ["out of air", "winded", "gasping", "unable to catch his breath"],
              ornate: [
                "emptied of air",
                "caught between one breath and the next",
                "lungs still chasing the moment",
                "unable to find the bottom of a breath",
              ],
              raw: ["heaving", "choking for air", "gasping hard", "sucking wind"],
              clinical: ["oxygen depleted", "hyperventilating", "experiencing oxygen debt", "exhibiting rapid respiration"],
            };
        return pick_replacement(match, forms_map, exact_voice, fallback_voice, offset);
      },
    },
    {
      regex: /\bdropping an octave\b/gi,
      replace: {
        plain: ["voice dropping lower", "letting his voice go deep", "voice sinking down", "pitching his voice lower"],
        ornate: [
          "letting his voice fall to something deeper",
          "his voice dropping into a lower register",
          "his tone sinking, deliberate and low",
          "letting the words come out an octave darker",
        ],
        raw: ["letting his voice hit the floor", "dropping his tone heavy and low", "dragging his voice down", "going deep and rough"],
        clinical: ["lowering vocal pitch significantly", "shifting to a lower frequency", "decreasing vocal range", "dropping audio frequency"],
      },
    },

    // =========================================================================
    // 2. SOUND, VIBRATION & MOTION
    // =========================================================================
    {
      regex: /\bhum(med|ming|s)?\b/gi,
      replace: {
        med: {
          plain: ["droned steadily", "throbbed low", "reverberated through the walls", "chugged along quietly"],
          ornate: [
            "sang low beneath the surface of things",
            "kept one long note running under everything",
            "breathed a current no one could quite place",
            "rolled through the floor like a held note",
          ],
          raw: ["shook with a low vibration", "rattled steadily", "pushed a heavy sound through the floor", "ground away quietly"],
          clinical: ["emitted a steady frequency", "maintained constant vibration", "produced a low oscillation", "generated a continuous drone"],
        },
        ming: {
          plain: ["vibrating steadily", "whirring low", "oscillating faintly", "growling under load"],
          ornate: [
            "threading a low note through the silence",
            "letting an unbroken current run beneath the quiet",
            "keeping the air faintly alive with sound",
            "laying a soft undertone beneath everything else",
          ],
          raw: ["shaking the air faintly", "rattling non-stop", "pushing a low noise through the room", "vibrating with quiet force"],
          clinical: ["emitting continuous vibration", "maintaining a baseline frequency", "producing a steady drone", "oscillating evenly"],
        },
        s: {
          plain: ["resonates low", "pulses steadily", "judders faintly", "rattles quietly"],
          ornate: [
            "keeps one low note running beneath the room",
            "threads a constant current through the quiet",
            "never quite falls silent, just softens",
            "lays a faint charge under the stillness",
          ],
          raw: ["shakes the floorboards faintly", "pushes a heavy vibration", "rattles the air", "drones on"],
          clinical: ["emits a baseline frequency", "maintains a steady oscillation", "produces a constant drone", "vibrates evenly"],
        },
        "": {
          plain: ["low tone", "steady frequency", "background note", "constant undertone"],
          ornate: ["a note with no beginning", "an undercurrent with no source", "a sound too constant to notice", "the city's held breath"],
          raw: ["heavy drone", "low vibration", "steady grind", "constant rattle"],
          clinical: ["baseline frequency", "continuous oscillation", "steady drone", "background noise"],
        },
      },
    },
    {
      regex: /\b(low|industrial|electrical|steady|soft)\s+hum\b/gi,
      replace: (match, p1, ...args) => {
        const offset = args[args.length - 2];
        const forms_map = {
          plain: ["current", "undertone", "frequency", "note"],
          ornate: ["resonance", "undercurrent", "held breath", "vibration"],
          raw: ["rattle", "grind", "heavy vibration", "drone"],
          clinical: ["oscillation", "frequency", "background noise", "baseline drone"],
        };
        const active_voice = forms_map[exact_voice] || forms_map[fallback_voice] || forms_map.plain;
        return p1 + " " + stable_pick(active_voice, match, offset);
      },
    },
    {
      regex: /\bboom(ed|ing|s)?\b/gi,
      replace: {
        ed: {
          plain: ["echoed loudly", "rang out loud", "sounded loud", "hit with a thud"],
          ornate: [
            "struck the air like a physical blow",
            "rolled through the space unhindered",
            "hit with concussive force",
            "rang out heavy and dense",
          ],
          raw: ["slammed into the silence", "crashed loud and heavy", "hit like a shockwave", "rang out hard enough to hurt"],
          clinical: ["produced a high-amplitude echo", "resonated forcefully", "impacted with acoustic weight", "generated a concussive sound wave"],
        },
        ing: {
          plain: ["loud", "deep and loud", "deafening", "roaring"],
          ornate: [
            "heavy enough to rattle the teeth",
            "filling all the available space",
            "rolling like distant artillery",
            "carrying the weight of a falling vault",
          ],
          raw: ["bone-rattling", "crushing and loud", "heavy enough to hurt your ears", "slamming into the room"],
          clinical: ["high-amplitude", "highly resonant", "acoustically overwhelming", "low-frequency and high-decibel"],
        },
        s: {
          plain: ["echoes loudly", "rings out loud", "sounds loud", "hits with a thud"],
          ornate: ["strikes the air like a blow", "rolls through the space", "hits with concussive force", "rings out heavy and dense"],
          raw: ["slams hard", "crashes loud", "hits like a physical blow", "rings out deafeningly"],
          clinical: ["produces a high-amplitude echo", "resonates heavily", "impacts with acoustic force", "generates concussive noise"],
        },
        "": {
          plain: ["loud thud", "deep crash", "heavy impact", "loud noise"],
          ornate: ["a concussive shock", "a sound heavy enough to feel", "a sudden pressure in the air", "a deep, bone-rattling impact"],
          raw: ["shockwave of sound", "crushing thud", "deafening crash", "bone-shaking impact"],
          clinical: ["concussive acoustic event", "high-amplitude sound wave", "heavy acoustic impact", "low-frequency noise"],
        },
      },
    },
    {
      regex: /\bshiver(s|ed|ing)?\b/gi,
      replace: (match, p1, ...args) => {
        const offset = args[args.length - 2];
        const forms_map = {
          plain: {
            "": ["flinch", "tense up", "twitch", "jolt"],
            s: ["shudders", "stiffens", "jerks back", "convulses briefly"],
            ed: ["seized up", "went rigid for a second", "recoiled slightly", "jumped involuntarily"],
            ing: ["going rigid in waves", "reacting over and over", "unable to stay still", "caught in small aftershocks"],
          },
          ornate: {
            "": [
              "a current runs through him",
              "something cold moves down his spine",
              "his body reacts before his mind catches up",
              "a chill finds its way under his skin",
            ],
            s: [
              "something crosses just beneath his skin",
              "his frame answers before he can stop it",
              "a cold thread pulls tight down his back",
              "his whole body registers it first",
            ],
            ed: [
              "a current ran through him before he could stop it",
              "something cold traced a line down his spine",
              "his frame gave one involuntary jolt",
              "the reaction arrived before the thought did",
            ],
            ing: [
              "caught in a current that won't let go",
              "unable to find stillness again",
              "answering the cold again and again",
              "caught somewhere between each involuntary jolt",
            ],
          },
          raw: {
            "": ["flinch hard", "jolt", "spasm", "jerk"],
            s: ["flinches violently", "jerks hard", "spasms", "jolts"],
            ed: ["flinched hard", "spasmed", "jolted like he'd been hit", "jerked violently"],
            ing: ["flinching continuously", "spasming", "jerking uncontrollably", "shaking hard"],
          },
          clinical: {
            "": ["exhibit a tremor", "experience a spasm", "react involuntarily", "flinch"],
            s: ["exhibits a tremor", "experiences a spasm", "reacts involuntarily", "flinches"],
            ed: ["exhibited a tremor", "experienced a spasm", "reacted involuntarily", "flinched"],
            ing: ["exhibiting tremors", "experiencing spasms", "reacting involuntarily", "flinching"],
          },
        };
        const key_form = p1 || "";
        const active_voice = forms_map[exact_voice] || forms_map[fallback_voice] || forms_map.plain;
        return match_case(match, stable_pick(active_voice[key_form], match, offset));
      },
    },
    {
      regex: /\bflutter(ed|ing|s)?\b(?!\s+(?:his|her|their|the|my|your|our|its|some|a|an|wings|curtains|flags|pages|eyelashes|lashes|paper)\s)/gi,
      replace: (match, p1, ...args) => {
        const offset = args[args.length - 2];
        const forms_map = {
          plain: {
            ed: ["beat quickly", "skipped", "stirred", "moved fast"],
            ing: ["beating quickly", "stirring", "moving quickly", "beating lightly"],
            s: ["beats quickly", "skips", "stirs", "moves fast"],
            "": ["quick beat", "light stir", "flurry", "fast movement"],
          },
          ornate: {
            ed: ["beat once, then again, quicker", "skipped a beat", "stirred like something waking", "moved with a light, quick pulse"],
            ing: ["beating quick and light", "skipping", "stirring softly", "pulsing lightly"],
            s: ["beats quick and light", "skips a beat", "stirs softly", "moves in quick, light pulses"],
            "": ["a quick light beat", "a soft stir", "a flurry of small motions", "a fast light pulse"],
          },
          raw: {
            ed: ["hammered", "thudded fast", "jerked fast", "beat hard and quick"],
            ing: ["hammering", "thudding fast", "jerking fast", "beating hard"],
            s: ["hammers", "thuds fast", "jerks fast", "beats hard"],
            "": ["hard fast beat", "heavy pulse", "fast thud", "quick jerk"],
          },
          clinical: {
            ed: ["moved rapidly", "beat quickly", "oscillated briefly", "pulsed lightly"],
            ing: ["moving rapidly", "beating quickly", "oscillating briefly", "pulsing lightly"],
            s: ["moves rapidly", "beats quickly", "oscillates briefly", "pulses lightly"],
            "": ["rapid movement", "quick oscillation", "light pulse", "small motion"],
          },
        };
        const key_form = p1 || "";
        const active_voice = forms_map[exact_voice] || forms_map[fallback_voice] || forms_map.plain;
        return match_case(match, stable_pick(active_voice[key_form], match, offset));
      },
    },
    {
      regex: /\bflicker(ed|ing|s)?\b/gi,
      replace: (match, p1, ...args) => {
        const offset = args[args.length - 2];
        const forms_map = {
          plain: {
            ed: ["flashed", "blinked", "wavered", "flared"],
            ing: ["flashing", "blinking", "wavering", "flaring"],
            s: ["flashes", "blinks", "wavers", "flares"],
            "": ["flash", "blink", "waver", "flare"],
          },
          ornate: {
            ed: ["lit and dimmed once", "caught the light and lost it", "pulsed once, unsteadily", "guttered and almost went out"],
            ing: ["catching and losing the light", "pulsing unsteadily", "throwing uneven light", "guttering at the edges"],
            s: ["catches and loses the light", "pulses unsteadily", "throws uneven light", "gutters at the edges"],
            "": ["an unsteady pulse of light", "a momentary glint", "a brief flash", "a skip in the light"],
          },
          raw: {
            ed: ["stuttered", "cut out and came back", "jumped hard", "died and came alive again"],
            ing: ["stuttering", "cutting in and out", "jumping hard", "flaring and dying"],
            s: ["stutters", "cuts in and out", "jumps hard", "flares and dies"],
            "": ["a hard stutter of light", "a dead flash", "a jump in the light", "a raw flare"],
          },
          clinical: {
            ed: ["fluctuated in brightness", "blinked briefly", "dimmed and brightened", "interrupted its light output"],
            ing: ["fluctuating in brightness", "blinking briefly", "dimming and brightening", "interrupting light output"],
            s: ["fluctuates in brightness", "blinks briefly", "dims and brightens", "interrupts light output"],
            "": ["a brief fluctuation in light", "a momentary dimming", "an interrupted flash", "an unsteady light signal"],
          },
        };
        const key_form = p1 || "";
        const active_voice = forms_map[exact_voice] || forms_map[fallback_voice] || forms_map.plain;
        return match_case(match, stable_pick(active_voice[key_form], match, offset));
      },
    },

    // =========================================================================
    // 3. SENSORY & ENVIRONMENTAL CLICHÉS
    // =========================================================================
    {
      regex: /\btaste(s)?\s+(of|like)\s+copper\b/gi,
      replace: {
        plain: ["raw, metallic edge", "sharp tang", "bitter bite in the mouth", "stale grit on the tongue"],
        ornate: ["a harsh, metallic resonance", "a bitter tang on the tongue", "a sharp electric sting", "a cold iron aftertaste"],
        raw: ["raw grit", "taste of hot wire", "burnt metal tang", "bitter iron taste"],
        clinical: ["metallic gustatory perception", "sharp oral sensation", "elevated sensory response", "bitter oral feedback"],
      },
    },
    {
      regex: /\b(heart|pulse)\s+(hammering|hammers|pounding|pounds)\b/gi,
      replace: {
        plain: ["pulse racing", "chest tight", "breath catching", "blood rushing"],
        ornate: ["rhythm surging violently", "chest reverberating", "tempo spiking inside", "blood surging fast"],
        raw: ["chest straining", "blood thumping", "breath coming hard", "pulse tearing fast"],
        clinical: ["elevated heart rate", "cardiovascular acceleration", "increased pulse velocity", "rapid cardiac cycle"],
      },
    },
    {
      regex: /\bstomach\s+(knots|twists|drops|tightens|turns|turned|twisted|dropped)\b/gi,
      replace: {
        plain: ["guts tensing", "instinct surging", "chest pulling tight", "focus sharpening"],
        ornate: ["a cold drop inside", "a sudden shift in the gut", "the core locking tight", "a sharp visceral pull"],
        raw: ["guts twisting", "gut clenching tight", "instinct kicking in", "belly going cold"],
        clinical: ["visceral contraction", "gastrointestinal tension", "autonomic response", "acute visceral reaction"],
      },
    },
    {
      regex: /\btrembling\s+(fingers|hands)\b/gi,
      replace: {
        plain: ["unsteady hands", "shaky grip", "fingers twitching", "strained grip"],
        ornate: ["unsteady hands", "hands betraying the tension", "fingers quivering lightly", "a subtle tremor in the grip"],
        raw: ["shaky hands", "strained grip", "fingers jerking", "unsteady hands"],
        clinical: ["motor tremor in hands", "unsteady manual dexterity", "involuntary muscle movement", "fine motor instability"],
      },
    },
    {
      regex: /\bair tastes of ozone\b/gi,
      replace: {
        plain: [
          "air tastes sharp and metallic",
          "the air carries a raw electric edge",
          "the air smells faintly of hot wire",
          "a metallic tang cuts through the air",
        ],
        ornate: [
          "a bitter charge coats the tongue",
          "the atmosphere carries the weight of a storm",
          "the air feels bruised and electric",
          "a charged sharpness lingers in the lungs",
        ],
        raw: [
          "air tastes like hot iron and heat",
          "the smell of burned wire fills the space",
          "it tastes like metallic foil",
          "the air bites with raw electricity",
        ],
        clinical: [
          "atmospheric ionization is detectable",
          "electrical discharge is present in the air",
          "metallic particulates are suspended",
          "high-voltage atmospheric conditions noted",
        ],
      },
    },
    {
      regex: /\bscent of ozone\b/gi,
      replace: {
        plain: ["smell of hot wire", "scent of scorched metal", "smell of overheated electronics", "a sharp electrical smell"],
        ornate: [
          "fragrance of a broken storm",
          "bitter aroma of raw current",
          "scent of something burnt and electric",
          "ghost of lightning in the air",
        ],
        raw: ["stink of hot wiring", "burnt wire smell", "harsh electrical stink", "smell of fried circuits"],
        clinical: ["ionized atmospheric odor", "scent of electrical discharge", "metallic olfactory signature", "high-voltage particulate smell"],
      },
    },
    {
      regex: /\bozone\b/gi,
      replace: {
        plain: ["charged air", "hot wire", "scorched metal", "raw current"],
        ornate: ["sparking air", "electric ghost", "charged atmosphere", "bitter air"],
        raw: ["hot iron", "fried wire", "burnt metal", "scorched insulation"],
        clinical: ["ionization", "electrical discharge", "atmospheric charge", "metallic particulate"],
      },
    },
    {
      regex: /\bphantom\s+(itch|ache|pain)\b/gi,
      replace: {
        plain: ["deep ache", "dull throbbing", "lingering tension", "stale muscle pull"],
        ornate: ["an echo of old pain", "a persistent dull throb", "a lingering sensory ghost", "a deep-seated ache"],
        raw: ["dull ache", "old throb", "stale pull", "deep throb"],
        clinical: ["phantom sensation", "neurological echo", "residual nerve response", "referred pain"],
      },
    },
    {
      regex: /\b(hit|hits|felt)\s+like\s+a\s+physical\s+blow\b/gi,
      replace: {
        plain: ["landed with sudden force", "carried real weight", "hit like a heavy punch", "pulled the air right out"],
        ornate: ["struck with visceral force", "landed with devastating clarity", "carried heavy physical weight", "reverberated instantly"],
        raw: ["hit like a fist", "landed hard", "knocked the wind out", "struck like iron"],
        clinical: ["produced high impact force", "registered as acute shock", "delivered significant force", "impacted sharply"],
      },
    },
    {
      regex: /\bshivering\s+shadows?\b/gi,
      replace: {
        plain: ["dark shadows", "shifting shadows", "moving shadows", "uneven shadows"],
        ornate: [
          "shadows that never quite settle",
          "shadows that flinch with the light",
          "restless dark pooling at the edges",
          "gloom that shifts like something breathing",
        ],
        raw: ["twitching shadows", "nervous dark spots", "jagged, moving shadows", "restless gloom"],
        clinical: ["fluctuating low-light areas", "unstable silhouettes", "shifting occlusions", "variable shadow patterns"],
      },
    },
    {
      regex: /\bsmudge\s+of\s+(charcoal|darkness)\b/gi,
      replace: {
        plain: ["dark shape", "shadowy outline", "dim silhouette", "shape in the dark"],
        ornate: [
          "a silhouette cut from the dark itself",
          "an outline the shadows seem reluctant to release",
          "a shape more suggested than seen",
          "a smear of night given rough form",
        ],
        raw: ["heavy stain of dark", "bruise of a shadow", "dirty smear of black", "harsh outline in the gloom"],
        clinical: ["low-contrast form", "indistinct silhouette", "obscured figure", "shadowed mass"],
      },
    },
    {
      regex: /\bblindingly\s+white\s+grin\b/gi,
      replace: {
        plain: ["bright grin", "wide smile", "big grin", "toothy smile"],
        ornate: [
          "a grin lit up like a struck match",
          "a smile bright enough to cut through the gloom",
          "teeth flashing white against the dark",
          "a grin that seemed to throw its own light",
        ],
        raw: ["harsh, bright smile", "teeth flashing sharp and white", "glaring grin", "stark, wide smile"],
        clinical: ["high-contrast smile", "prominent dental display", "wide facial expression", "clearly visible grin"],
      },
    },
    {
      regex: /\bshimmering\b/gi,
      replace: {
        plain: ["glinting", "shining", "sparkling", "gleaming"],
        ornate: [
          "catching the light in restless flickers",
          "throwing off light like something alive",
          "glowing with a light that won't sit still",
          "lit with a glow that seems to breathe",
        ],
        raw: ["flashing harsh light", "glaring bright", "spitting off sparks of light", "gleaming hard"],
        clinical: ["reflecting light rapidly", "exhibiting high specular reflection", "fluctuating in brightness", "displaying optical interference"],
      },
    },

    // =========================================================================
    // 4. ABSTRACT METAPHORS & LITERARY TROPES
    // =========================================================================
    {
      regex: /\b(is|was|stands?|stood)\s+a\s+testament\s+to\b/gi,
      replace: (match, p1, ...args) => {
        const offset = args[args.length - 2];
        const forms_map = {
          plain: ["proof of", "evidence of", "a marker of", "a sign of"],
          ornate: ["a monument to", "a silent witness to", "the physical weight of", "an undeniable echo of"],
          raw: ["hard proof of", "a raw reminder of", "the ugly result of", "a heavy sign of"],
          clinical: ["evidence of", "an indicator of", "data supporting", "a metric of"],
        };
        const active_voice = forms_map[exact_voice] || forms_map[fallback_voice] || forms_map.plain;
        return p1 + " " + stable_pick(active_voice, match, offset);
      },
    },
    {
      regex: /\ba\s+testament\s+to\b/gi,
      replace: {
        plain: ["proof of", "evidence of", "a sign of", "a marker of"],
        ornate: ["a monument to", "a silent witness to", "the physical weight of", "an echo of"],
        raw: ["hard proof of", "a raw reminder of", "the ugly result of", "a heavy sign of"],
        clinical: ["evidence of", "an indicator of", "data supporting", "a metric of"],
      },
    },
    {
      regex: /\btestament\b/gi,
      replace: {
        plain: ["proof", "evidence", "marker", "sign"],
        ornate: ["monument", "witness", "echo", "shadow"],
        raw: ["hard proof", "reminder", "result", "scar"],
        clinical: ["evidence", "indicator", "data", "metric"],
      },
    },
    {
      regex: /\btapestry\s+of\b/gi,
      replace: {
        plain: ["mix of", "web of", "tangle of", "patchwork of"],
        ornate: ["woven history of", "intricate maze of", "dense knot of", "sprawling mural of"],
        raw: ["mess of", "tangled heap of", "sprawling mess of", "bleeding mix of"],
        clinical: ["collection of", "aggregate of", "network of", "system of"],
      },
    },
    {
      regex: /\btapestry\b/gi,
      replace: {
        plain: ["web", "tangle", "patchwork", "mosaic"],
        ornate: ["woven thread", "intricate design", "dense knot", "sprawling mural"],
        raw: ["mess", "tangled heap", "sprawling knot", "bleeding mix"],
        clinical: ["collection", "aggregate", "network", "system"],
      },
    },
    {
      regex: /\bsymphony\s+of\b/gi,
      replace: {
        plain: ["medley of", "clash of", "cascade of", "rush of"],
        ornate: ["choir of", "crescendo of", "orchestration of", "rising tide of"],
        raw: ["mess of noise", "violent clash of", "deafening rush of", "bleeding mix of"],
        clinical: ["array of", "simultaneous occurrence of", "collection of", "systematic set of"],
      },
    },
    {
      regex: /\bcoiled\s+spring\b/gi,
      replace: {
        plain: ["tense frame", "wound tight", "ready to move", "poised to snap"],
        ornate: ["held in absolute tension", "drawn tight as a bowstring", "vibrating with unspent energy", "poised on a razor's edge"],
        raw: ["wound tight enough to break", "tense as a tripwire", "shaking with held-back force", "ready to snap"],
        clinical: [
          "maintaining high kinetic potential",
          "exhibiting extreme muscle tension",
          "physically primed for action",
          "highly reactive state",
        ],
      },
    },
    {
      regex: /\ba\s+study\s+in\b/gi,
      replace: {
        plain: ["a picture of", "an exercise in", "a portrait of", "a lesson in"],
        ornate: ["the living embodiment of", "a masterclass in", "the absolute expression of", "a deliberate display of"],
        raw: ["nothing but pure", "a raw display of", "a heavy dose of", "a harsh look at"],
        clinical: ["an example of", "a demonstration of", "a clear case of", "an exhibition of"],
      },
    },
    {
      regex: /\bmarrow\s+of\s+(his|her|their|the)\s+teeth\b/gi,
      replace: (match, p1, ...args) => {
        const offset = args[args.length - 2];
        const forms_map = {
          plain: ["core of " + p1 + " bones", "deepest part of " + p1 + " jaw", "root of " + p1 + " bite"],
          ornate: ["very foundation of " + p1 + " frame", "deepest hollow of " + p1 + " bones", "absolute core of " + p1 + " being"],
          raw: ["roots of " + p1 + " teeth", "hard bone of " + p1 + " jaw", "base of " + p1 + " skull"],
          clinical: ["dental roots", "mandibular structure", "osseous core"],
        };
        const active_voice = forms_map[exact_voice] || forms_map[fallback_voice] || forms_map.plain;
        return stable_pick(active_voice, match, offset);
      },
    },
    { regex: /\bshell of (his|her|their|your)\s+ear\b/gi, replace: (match, p1) => p1 + " ear" },
    {
      regex: /\bfever\s+dream\b/gi,
      replace: {
        plain: ["strange blur", "hazy mess", "disorienting scene", "surreal moment"],
        ornate: [
          "a hallucination with the volume turned up",
          "reality bent just slightly out of true",
          "a dream wearing the mask of the waking world",
          "something too vivid to be entirely real",
        ],
        raw: ["sick hallucination", "dizzying nightmare", "sweaty blur of a memory", "bad trip"],
        clinical: ["disorienting sequence", "hallucinatory state", "altered perception event", "cognitive distortion"],
      },
    },

    // =========================================================================
    // 5. REDDIT AI-ISMS & COMMUNITY TROPES
    // =========================================================================
    {
      regex: /\bobsidian\b/gi,
      replace: {
        plain: ["black glass", "glossy black", "deep black", "jet-black"],
        ornate: ["polished black", "glass-dark", "black as polished stone", "bottomless black"],
        raw: ["black glass", "flat black", "cold black", "hard black"],
        clinical: ["black volcanic glass", "glassy black", "opaque black", "black material"],
      },
    },
    {
      regex: /\bthe\s+void\s+of\b/gi,
      replace: {
        plain: ["the emptiness of", "the dark of", "the blank of", "the darkness of"],
        ornate: ["the hollowness of", "the deep nothing of", "the emptiness inside", "the black well of"],
        raw: ["the nothing of", "the dead black of", "the empty dark of", "the pit of"],
        clinical: ["the absence in", "the unlit area of", "the darkness of", "the empty region of"],
      },
    },
    {
      regex: /([^A-Za-z])void\s+of\b/gi,
      replace: (match, p1, ...args) => p1 + stable_pick(["empty of", "bare of", "lacking", "stripped of"], match, args[args.length - 2]),
    },
    {
      regex: /\bthe\s+void\b/gi,
      replace: {
        plain: ["the dark", "the emptiness", "the blackness", "empty space"],
        ornate: ["the dark beyond", "the silence beyond the light", "the emptiness between things", "a darkness with no end"],
        raw: ["the dark", "nothingness", "empty space", "the black"],
        clinical: ["the darkness", "empty space", "unlit space", "the dark"],
      },
    },
    {
      regex: /\bold\s+parchment\b/gi,
      replace: {
        plain: ["aged paper", "worn paper", "yellowed paper", "ancient paper"],
        ornate: ["paper yellowed by years", "a sheet gone soft with age", "paper worn thin at the edges", "a brittle old sheet"],
        raw: ["brittle old paper", "yellowed scrap", "worn-out paper", "aged sheet"],
        clinical: ["aged cellulose paper", "discolored paper", "old paper stock", "yellowed paper"],
      },
    },
    {
      regex: /\bwhite\s+knuckles?\b/gi,
      replace: {
        plain: ["clenched hands", "a tight grip", "pale knuckles", "a grip gone tense"],
        ornate: [
          "a grip so tight the tendons showed",
          "fingers pressed bloodless into the surface",
          "a hold that left the knuckles pale",
          "hands locked down hard",
        ],
        raw: ["a death grip", "hands squeezed hard", "fingers pressed flat and hard", "a grip so tight it hurt"],
        clinical: ["hands gripping firmly", "a high-tension grip", "fingers clenched tightly", "sustained manual pressure"],
      },
    },
    {
      regex: /\bknuckles?\s+(were|turned|turning|going|went)\s+white\b/gi,
      replace: {
        plain: ["the grip tightened", "the hands clenched", "the grip went tight", "the hands tightened"],
        ornate: [
          "the tendons showed along the back of the hand",
          "the grip turned bone-hard",
          "the strain showed in the grip",
          "the hands locked down",
        ],
        raw: ["the hands locked up hard", "the grip went savage", "the fists clenched hard", "the hands seized up"],
        clinical: ["grip tension increased", "the hands clenched harder", "manual grip tightened", "finger flexion increased"],
      },
    },
    {
      regex: /\bspatial\s+disturbances?\b/gi,
      replace: {
        plain: ["warp in the air", "rift in the air", "distortion in the air", "crack in the air"],
        ornate: ["shift in the air", "fold in the light", "bend in the room's lines", "wrongness in the air"],
        raw: ["tear in the air", "split in the air", "twist in the air", "splinter in the air"],
        clinical: ["anomaly in the field", "localized distortion", "field warp", "measurable warp"],
      },
    },
    {
      regex: /\bjolts?\s+of\s+electricity\b/gi,
      replace: {
        plain: ["sharp pulses", "sudden charges", "sharp sparks", "quick shocks"],
        ornate: [
          "currents that raced along his nerves",
          "sparks that ran up his skin",
          "a live current threading through him",
          "sensation crackling along his nerves",
        ],
        raw: ["raw shocks", "stinging sparks", "harsh current", "burning static"],
        clinical: ["electrical sensations", "sudden voltage-like sensations", "sharp neural impulses", "brief electrical pulses"],
      },
    },
    {
      regex: /\bfroze\b/gi,
      replace: {
        plain: ["went still", "stopped dead", "stiffened", "halted"],
        ornate: ["held motionless", "went rigid mid-motion", "stopped as though the world had paused", "became suddenly, completely still"],
        raw: ["went rigid", "stopped dead", "locked up", "seized up"],
        clinical: ["stopped moving", "became motionless", "halted abruptly", "paused entirely"],
      },
    },
    {
      regex: /\bstood\s+frozen\b/gi,
      replace: {
        plain: ["stood still", "stood motionless", "stood rigid", "went still"],
        ornate: ["held absolutely still", "went rigid mid-motion", "became still as though time had stopped", "went completely motionless"],
        raw: ["locked stiff", "went dead still", "went rigid", "seized up"],
        clinical: ["stood motionless", "stopped all movement", "remained still", "halted in place"],
      },
    },
    {
      regex: /\bfrozen\s+(?:in\s+place|mid-?\w+|to\s+the\s+spot|on\s+the\s+spot)\b/gi,
      replace: {
        plain: ["motionless", "rigid", "stock-still", "rooted"],
        ornate: ["caught mid-motion", "arrested in the act", "held against all movement", "gone suddenly rigid"],
        raw: ["locked stiff", "stuck rigid", "seized up", "dead still"],
        clinical: ["motionless", "without movement", "halted", "stationary"],
      },
    },
    {
      regex: /\bfrozen\s+with\b/gi,
      replace: {
        plain: ["rigid with", "stiff with", "rooted by", "gripped by"],
        ornate: ["struck rigid with", "held stiff by", "arrested by", "caught in"],
        raw: ["locked up with", "stiff with", "seized with", "rigid with"],
        clinical: ["motionless with", "unmoving with", "unable to move with", "rigid with"],
      },
    },
    {
      regex: /\braspy\b/gi,
      replace: {
        plain: ["rough", "hoarse", "scraped", "worn"],
        ornate: ["scraped raw", "roughened by time", "gone hoarse", "worn down by years"],
        raw: ["rough", "hoarse", "scraped", "harsh"],
        clinical: ["hoarse", "with vocal strain", "low and rough", "fricative"],
      },
    },
    {
      regex: /\bcrimson\b/gi,
      replace: {
        plain: ["deep red", "dark red", "blood red", "scarlet"],
        ornate: ["the color of old blood", "a deep, aching red", "red burned to its darkest point", "a red that caught the eye"],
        raw: ["blood red", "deep red", "angry red", "hot red"],
        clinical: ["deep red", "high-saturation red", "dark red", "red"],
      },
    },
    {
      regex: /\bamber\s+(light|glow|dawn|air|sun|shine|glaze|gaze|eyes|sky|hour|lightning)\b/gi,
      replace: (match, p1, ...args) => stable_pick(["golden", "honeyed", "warm gold", "soft gold"], match, args[args.length - 2]) + " " + p1,
    },
    {
      regex: /\bbruised\s+purple\b/gi,
      replace: {
        plain: ["storm-dark", "heavy", "deep", "dark"],
        ornate: ["the color of a fading bruise", "heavy and dark", "a dark bloom of color", "drained of light"],
        raw: ["dark", "swollen dark", "heavy dark", "raw dark"],
        clinical: ["dark violet", "deep reddish-dark", "dark mauve", "deep wine"],
      },
    },
    {
      regex: /\biridescent\b/gi,
      replace: {
        plain: ["color-shifting", "glossy", "shifting", "rainbow-shot"],
        ornate: [
          "catching the light in shifting colors",
          "throwing off a play of color",
          "alive with shifting color",
          "color that moved with the light",
        ],
        raw: ["shiny and shifting", "flashy", "glaring", "wet shine"],
        clinical: ["with shifting surface colors", "spectrally reflective", "color-variable", "prismatic"],
      },
    },
    {
      regex: /\bpalpable\b/gi,
      replace: {
        plain: ["obvious", "heavy in the air", "impossible to miss", "hard to ignore"],
        ornate: [
          "thick enough to touch",
          "pressing on the room like weather",
          "a weight the air itself seemed to carry",
          "unmistakable, the way a held breath is unmistakable",
        ],
        raw: ["heavy enough to choke on", "crushing the air out of the room", "thick and suffocating", "pressing down hard"],
        clinical: ["measurable", "clearly observable", "quantifiable", "distinctly present"],
      },
    },
    {
      regex: /\btangible\b/gi,
      replace: {
        plain: ["real", "solid", "concrete", "plain to see"],
        ornate: [
          "something you could almost hold",
          "solid enough to lean on",
          "real in a way words rarely are",
          "present in the room like another body",
        ],
        raw: ["hard and real", "heavy enough to feel", "solid enough to break against", "unavoidably real"],
        clinical: ["verifiable", "concrete", "physical", "empirically observable"],
      },
    },

    // =========================================================================
    // 6. SYNTACTICAL & PHYSICAL CLICHÉS
    // =========================================================================
    {
      regex: /\bviolently\b/gi,
      replace: {
        plain: ["hard", "sharply", "abruptly", "forcefully"],
        ornate: ["with sudden force", "all at once", "with a force that brooked no resistance", "in a single hard motion"],
        raw: ["hard", "with everything behind it", "brutally", "like a battering ram"],
        clinical: ["with force", "abruptly", "forcefully", "with high intensity"],
      },
    },
    {
      regex: /\bpractically\b/gi,
      replace: {
        plain: ["nearly", "almost", "just about", "close to"],
        ornate: ["as good as", "little short of", "all but", "effectively"],
        raw: ["almost", "nearly", "about", "damn near"],
        clinical: ["nearly", "almost", "almost entirely", "approximately"],
      },
    },
    {
      regex: /\blean(ed|ing)\s+in(?=[,.!?;)\]"]|["']?\s*$|\s+(?:and|to|for|until|so|enough|order)\b)/gi,
      replace: (match, p1, ...args) => {
        const offset = args[args.length - 2];
        const forms_map = {
          plain: {
            ed: ["moved closer", "drew closer", "shifted nearer", "came in close"],
            ing: ["moving closer", "drawing closer", "shifting nearer", "coming in close"],
          },
          ornate: {
            ed: ["inclined toward the other", "closed the space between them", "drifted into the other's space", "brought himself closer"],
            ing: ["inclining toward the other", "closing the space between them", "drifting into the other's space", "drawing himself closer"],
          },
          raw: {
            ed: ["got right in close", "crowded in", "moved in hard", "pressed in"],
            ing: ["getting right in close", "crowding in", "moving in hard", "pressing in"],
          },
          clinical: {
            ed: ["reduced the distance", "moved nearer", "decreased proximity", "advanced closer"],
            ing: ["reducing the distance", "moving nearer", "decreasing proximity", "advancing closer"],
          },
        };
        const is_ing = p1 === "ing";
        const key_form = is_ing ? "ing" : "ed";
        const active_voice = forms_map[exact_voice] || forms_map[fallback_voice] || forms_map.plain;
        return match_case(match, stable_pick(active_voice[key_form], match, offset));
      },
    },
    {
      regex: /\bphysical\s+blow\b/gi,
      replace: {
        plain: ["real blow", "hard hit", "solid impact", "genuine force"],
        ornate: ["a blow with real weight behind it", "an impact that actually landed", "force with true substance", "a strike that carried weight"],
        raw: ["a real hit", "a blow that actually hurt", "solid force", "a proper hit"],
        clinical: ["mechanical force", "real impact force", "actual contact force", "physical impact"],
      },
    },
    {
      regex: /\b(he|she|they|i|we)\s+(didn'?t|hadn'?t)\s+(even\s+)?realiz\w*\s+(he|she|they|i|we)\s+(was|were)\s+holding\b/gi,
      replace: (match, p1) => match_case(match, p1 + "'d been holding"),
    },
    {
      regex: /\ba\s+sudden\s+and\s+sharp\s+feeling\b/gi,
      replace: {
        plain: ["a sudden feeling", "a sharp pang", "a sudden rush", "a quick stab"],
        ornate: [
          "a feeling that arrived all at once",
          "a pang that came without warning",
          "a sharp twist of sensation",
          "something that arrived all at once",
        ],
        raw: ["a sharp stab", "a sudden wave", "a hard pulse", "a stinging rush"],
        clinical: ["an abrupt sensation", "a sudden perceptible change", "a sharp somatic signal", "an acute sensation"],
      },
    },
    {
      regex: /\blike\s+(?:a\s+)?crumpled\s+map\b/gi,
      replace: {
        plain: ["deeply lined", "creased with years", "folded with age", "worn into lines"],
        ornate: ["scored by years", "grooved by time", "worn like old stone", "folded by age"],
        raw: ["beaten into lines", "hard-worn", "lined and tired", "creased hard"],
        clinical: ["deeply lined", "heavily wrinkled", "aged", "furrowed"],
      },
    },
    {
      regex: /\bonce\s+in\s+a\s+blue\s+moon\b/gi,
      replace: {
        plain: ["rarely", "hardly ever", "every so often", "seldom"],
        ornate: ["only rarely", "scarcely ever", "so rarely you'd forget it happened", "once in a long while"],
        raw: ["rarely", "almost never", "hardly ever", "on rare occasions"],
        clinical: ["rarely", "infrequently", "on rare occasions", "seldom"],
      },
    },
    {
      regex: /\bmerging\s+their\s+molecules(?:\s+together)?\b/gi,
      replace: {
        plain: ["drawing together", "coming together", "closing the space between them", "melding into one"],
        ornate: [
          "closing the distance until the boundaries blurred",
          "coming together as one body",
          "drawing so close the space between them vanished",
          "melding until they were indistinguishable",
        ],
        raw: ["pressing together hard", "closing in until there was no gap", "fusing into each other", "slamming together"],
        clinical: ["reducing the distance between them to zero", "coming into full contact", "fusing into a single form", "closing the gap entirely"],
      },
    },
    {
      regex: /\bshift(s|ed|ing)?\s+(his|her|their|my|your)?\s*weight\b/gi,
      replace: {
        plain: ["adjusting posture", "stepping back slightly", "bracing feet", "changing stance"],
        ornate: ["readjusting footing", "shifting stance against the floor", "bracing for movement", "settling into a new posture"],
        raw: ["bracing feet", "shifting stance", "stepping back", "resetting grip"],
        clinical: ["adjusting posture", "rebalancing center of gravity", "shifting weight distribution", "modifying stance"],
      },
    },
    {
      regex: /\bpredatory\b/gi,
      replace: {
        plain: ["sharp", "calculating", "focused", "intent"],
        ornate: ["deliberate and sharp", "watching with quiet intensity", "calculating every move", "poised and watchful"],
        raw: ["dangerous", "hard", "sharp-eyed", "looking for an opening"],
        clinical: ["high-threat", "calculating", "focused", "observant"],
      },
    },
    {
      regex: /\bpossessive(ly)?\b/gi,
      replace: {
        plain: ["firmly", "tightly", "with clear intent", "holding fast"],
        ornate: ["with absolute certainty", "claiming the space", "holding with deliberate warmth", "anchoring firmly"],
        raw: ["tight", "hard", "holding fast", "locking down"],
        clinical: ["assertively", "with high grip strength", "firmly", "securely"],
      },
    },
    {
      regex: /\bnibbl(es|ed|ing)\b/gi,
      replace: {
        plain: ["biting lightly", "tugging gently", "brushing past", "grazing softly"],
        ornate: ["grazing with light pressure", "touching softly", "tugging gently", "brushing past in a quiet movement"],
        raw: ["biting light", "catching with teeth", "grazing hard", "tugging"],
        clinical: ["applying light pressure with teeth", "contacting lightly", "touching softly", "grazing"],
      },
    },
    {
      regex: /\bearlobe(s)?\b/gi,
      replace: {
        plain: ["ear", "side of the jaw", "neck", "side of the face"],
        ornate: ["curve of the jaw", "side of the throat", "soft edge of the jawline", "temple"],
        raw: ["jaw", "ear", "neck", "side of the face"],
        clinical: ["auricle region", "lateral jawline", "temporal region", "cervical boundary"],
      },
    },
    {
      regex: /\bcaress(es|ed|ing)?\b/gi,
      replace: {
        plain: ["touching softly", "brushing against", "tracing a line along", "running fingers over"],
        ornate: ["tracing a slow line over", "letting fingers glide across", "brushing lightly against", "moving with quiet softness across"],
        raw: ["sliding hands over", "rubbing along", "grazing across", "brushing past"],
        clinical: ["applying light tactile pressure to", "tracing a linear path across", "contacting softly", "moving over"],
      },
    },
    {
      regex: /\bnostril(s)?\s+(flared|filled)\b/gi,
      replace: {
        plain: ["breath catching", "taking in a sharp breath", "breathing in deep", "drawing in air"],
        ornate: ["drawing the scent deep into the lungs", "taking in a sharp, sudden breath", "inhaling deeply", "catching the air all at once"],
        raw: ["sucking in air", "taking a deep breath", "breathing hard", "inhaling sharp"],
        clinical: ["nasal inhalation expanding", "taking a deep breath", "increasing tidal volume", "inhaling rapidly"],
      },
    },
    {
      regex: /\bspatial\s+disturbance(s)?\b/gi,
      replace: {
        plain: ["movement in the air", "shattering silence", "sudden ripple", "shift in the room"],
        ornate: ["a sudden pulse through the room", "a sharp break in the atmosphere", "a ripple across the quiet", "an unexpected tremor"],
        raw: ["hard shockwave", "sudden rattle", "air breaking open", "jarring pulse"],
        clinical: ["environmental perturbation", "atmospheric pressure shift", "acoustic displacement", "physical disruption"],
      },
    },
    {
      regex: /\bproper\s+madness\b/gi,
      replace: {
        plain: ["pure chaos", "complete insanity", "reckless risk", "sheer madness"],
        ornate: ["unfiltered delirium", "a descent into chaos", "utter irrationality", "unvarnished madness"],
        raw: ["raw insanity", "straight-up crazy", "total chaos", "reckless insanity"],
        clinical: ["extreme cognitive disorganization", "severe irrationality", "acute behavioral instability", "uncontrolled disorder"],
      },
    },
    {
      regex: /\bsquelch(ing|ed)?\b/gi,
      replace: {
        plain: ["squishing", "sloshing", "churning underfoot", "squelching"],
        ornate: ["sloshing heavily through liquid", "yielding wetly underfoot", "churning through damp silt", "giving way with a heavy wet sound"],
        raw: ["squishing loudly", "splashing through muck", "grinding through mud", "sloshing"],
        clinical: ["displacing fluid saturated media", "yielding wetly under pressure", "producing hydraulic noise", "churning wet media"],
      },
    },
    {
      regex: /\bforce\s+of\s+a\s+physical\s+blow\b/gi,
      replace: {
        plain: ["sudden impact", "hard realization", "heavy hit", "sharp shock"],
        ornate: [
          "a shock that landed like a physical weight",
          "an impact that rattled the frame",
          "a sudden, heavy realization",
          "force that left no room for doubt",
        ],
        raw: ["hard hit", "punch to the gut", "heavy impact", "shock that hurt"],
        clinical: ["significant psychological impact", "abrupt cognitive disruption", "acute sensory feedback", "heavy emotional impact"],
      },
    },
    {
      regex: /\btracing lazy circles\b/gi,
      replace: {
        plain: ["drawing slow circles", "moving his fingers in loops", "tracing idle shapes", "brushing back and forth slowly"],
        ornate: [
          "drawing slow, unhurried circles against his skin",
          "letting his fingers wander in loose, idle loops",
          "tracing shapes with no destination in mind",
          "moving with the unhurried patience of someone in no rush to stop",
        ],
        raw: ["rubbing slow, aimless circles", "dragging his fingers in slow loops", "sliding back and forth", "tracing heavy, slow lines"],
        clinical: ["moving in slow circular patterns", "tracing repetitive motions", "applying slow friction", "moving at a low velocity"],
      },
    },
  ];

  let clean_text = raw_text;
  for (const rule_item of DETOX_RULES) {
    clean_text = clean_text.replace(rule_item.regex, (match, ...args) => {
      const offset = args[args.length - 2];
      const is_function_replace = typeof rule_item.replace === "function";
      if (is_function_replace) {
        return rule_item.replace(match, ...args);
      }
      return pick_replacement(match, rule_item.replace, exact_voice, fallback_voice, offset);
    });
  }

  // =========================================================================
  // STRUCTURAL PATTERN DETOX (SENTENCE-LEVEL AI-ISMS)
  // =========================================================================

  // 1. Denial-then-Affirmation Formula:
  // "X didn't just Y, it Z'd" -> "X Z'd"
  // "The limestone didn't scream before it gave way, it simply sighed" -> "The limestone gave way with a low sigh"
  clean_text = clean_text.replace(
    /\b(?:the\s+)?([A-Za-z0-9_-]+)\s+(?:didn't|did not|wasn't|was not)\s+just\s+([^,;.]+)[,;.]?\s*(?:it|he|she|they)?\s*(?:simply|instead|was|did|became)?\s+([^.!?]+)/gi,
    (match, subject, negated, affirmative) => {
      if (!subject || !affirmative) return match;
      const clean_affirmative = affirmative.trim();
      return `${subject} ${clean_affirmative}`;
    },
  );

  // 2. Self-Answering Dialogue:
  // "Tomato? What's that, some sort of red fruit...?" -> "Tomato..."
  clean_text = clean_text.replace(
    /\b([A-Z][a-z0-9_-]+)\?\s*What(?:'s| is)\s+that,\s+some\s+sort\s+of\s+[^?]+\?\s*/gi,
    (match, word) => `${word}... `,
  );

  return clean_text;
}

// =============================================================================
// HELPER UTILITIES
// =============================================================================

function pick_replacement(match, pool, exact_voice = "plain", fallback_voice = "plain", offset = 0) {
  if (!pool) return match;

  const is_string_pool = typeof pool === "string";
  if (is_string_pool) return match_case(match, pool);

  let target_pool = pool;
  const has_conjugations =
    pool.ed !== undefined ||
    pool.ing !== undefined ||
    pool.s !== undefined ||
    pool.es !== undefined ||
    pool.med !== undefined ||
    pool.ming !== undefined ||
    pool[""] !== undefined;

  if (has_conjugations) {
    const suffix_match = match.match(/(med|ming|ing|ed|es|s)$/i);
    const suffix_key = (suffix_match ? suffix_match[0] : "").toLowerCase();
    target_pool = pool[suffix_key] || pool[""] || pool;
  }

  const is_array_pool = Array.isArray(target_pool);
  const active_list = is_array_pool ? target_pool : target_pool[exact_voice] || target_pool[fallback_voice] || target_pool.plain || [];

  const has_items = active_list.length > 0;
  if (!has_items) return match;

  return match_case(match, stable_pick(active_list, match, offset));
}

function stable_pick(list, match, offset = 0) {
  const has_valid_list = list && list.length > 0;
  if (!has_valid_list) return "";

  let hash_val = HASH_OFFSET_BASIS;
  const seed_str = match + "@" + offset;

  for (let char_idx = 0; char_idx < seed_str.length; char_idx++) {
    hash_val ^= seed_str.charCodeAt(char_idx);
    hash_val = Math.imul(hash_val, HASH_PRIME) >>> 0;
  }

  return list[hash_val % list.length];
}

function match_case(original, replacement) {
  const has_inputs = original && replacement;
  if (!has_inputs) return replacement;

  const first_char = original.charAt(0);
  const is_uppercase = first_char === first_char.toUpperCase() && first_char !== first_char.toLowerCase();

  if (is_uppercase) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }

  return replacement;
}
