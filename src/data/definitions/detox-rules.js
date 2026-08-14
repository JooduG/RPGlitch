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
          plain: ["said it quietly", "kept his voice low", "spoke half to himself"],
          ornate: ["let the words fall hushed", "breathed it more than said it"],
          raw: ["ground it out low", "kept it under his breath"],
          clinical: ["lowered vocal output", "kept the volume low"],
        },
        ing: {
          plain: ["talking under his breath", "voice sinking low", "barely audible now"],
          ornate: ["letting each word dissolve into breath", "voice unspooling in a hush"],
          raw: ["keeping it low and rough", "talking barely above a whisper"],
          clinical: ["reducing vocal amplitude", "speaking at low volume"],
        },
        s: {
          plain: ["keeps it quiet", "drops his voice", "speaks low"],
          ornate: ["lets the words fall soft", "gives the sentence hardly any weight"],
          raw: ["keeps it under his breath", "grinds it out soft"],
          clinical: ["lowers volume", "speaks quietly"],
        },
        "": {
          plain: ["quiet remark", "low aside", "soft comment"],
          ornate: ["a half-spoken confidence", "the ghost of a sentence"],
          raw: ["low word", "quiet breath"],
          clinical: ["low-volume utterance", "quiet vocalization"],
        },
      },
    },
    {
      regex: /\bpurr(ed|ing|s)?\b/gi,
      replace: {
        ed: {
          plain: ["said it slow and easy", "gave the words a teasing edge", "let his tone go warm"],
          ornate: ["let the words curl slow off his tongue", "drew the words out like warm honey"],
          raw: ["let it drag out slow", "said it with heavy heat"],
          clinical: ["spoke with deliberate slowness", "lowered vocal pitch slightly"],
        },
        ing: {
          plain: ["voice gone warm and slow", "words coming out unhurried", "tone easing into something coy"],
          ornate: ["letting his voice curl at the edges", "drawing each syllable out unhurried"],
          raw: ["dragging the words out", "dropping his voice low and heavy"],
          clinical: ["speaking with slow precision", "maintaining a smooth delivery"],
        },
        s: {
          plain: ["says it slow", "gives the words a playful edge", "lets his tone warm up"],
          ornate: ["curls the words at the edges", "draws it out, unhurried and warm"],
          raw: ["drags the words out slow", "says it with heat"],
          clinical: ["speaks slowly", "lowers pitch slightly"],
        },
        "": {
          plain: ["low teasing tone", "warm playful edge", "coy inflection"],
          ornate: ["a slow, honeyed edge", "a velvet undertone"],
          raw: ["low heavy tone", "slow drag of a voice"],
          clinical: ["smooth vocalization", "measured cadence"],
        },
      },
    },
    {
      regex: /\brasp(ed|ing|s)?\b/gi,
      replace: {
        ed: {
          plain: ["said it rough", "ground the words out", "let his voice go raw"],
          ornate: ["ground the words out like stone underfoot", "let the sentence come out scraped raw"],
          raw: ["scraped the words out", "forced it out raw"],
          clinical: ["spoke with severe vocal strain", "spoke hoarsely"],
        },
        ing: {
          plain: ["voice scraping rough", "forcing the words along", "going dry and strained"],
          ornate: ["scraping each word past a throat gone raw", "letting the words come out edged like stone"],
          raw: ["scraping out every word", "grinding the words out"],
          clinical: ["speaking with notable strain", "vocalizing hoarsely"],
        },
        s: {
          plain: ["says it dry", "voice comes out rough", "forces it through gritted teeth"],
          ornate: ["scrapes the words past a raw throat", "gives the sentence an edge like broken stone"],
          raw: ["scrapes the words out", "forces it out raw"],
          clinical: ["speaks with vocal strain", "delivers hoarsely"],
        },
        "": {
          plain: ["rough, worn voice", "harsh edge to his tone", "low growl of a voice"],
          ornate: ["a voice worn down to bare rock", "a voice roughened by something unsaid"],
          raw: ["harsh scrap of a voice", "raw edge"],
          clinical: ["strained vocalization", "hoarse audio output"],
        },
      },
    },
    {
      regex: /\brough,?\s+(dismissive|dangerous)?\s*rasp\b/gi,
      replace: {
        plain: ["rough, worn voice", "harsh edge to his tone", "low growl of a voice"],
        ornate: ["a voice worn down to bare rock", "a voice roughened by something unsaid"],
        raw: ["harsh scrap of a voice", "raw edge"],
        clinical: ["strained vocalization", "hoarse audio output"],
      },
    },
    {
      regex: /\bbellow(ed|ing|s)?\b/gi,
      replace: {
        ed: {
          plain: ["shouted", "roared", "yelled"],
          ornate: ["let the sound tear from his chest", "shook the air with his voice"],
          raw: ["screamed it loud", "roared until his throat hurt"],
          clinical: ["shouted at maximum volume", "vocalized forcefully"],
        },
        ing: {
          plain: ["shouting", "roaring", "yelling loudly"],
          ornate: ["letting the sound rip from his chest", "shaking the air with the volume"],
          raw: ["screaming loud", "yelling at the top of his lungs"],
          clinical: ["shouting forcefully", "projecting at high volume"],
        },
        s: {
          plain: ["shouts", "roars", "yells"],
          ornate: ["lets the sound tear from his chest", "shakes the air with his voice"],
          raw: ["screams loud", "roars hard"],
          clinical: ["shouts", "projects at peak volume"],
        },
        "": {
          plain: ["shout", "roar", "loud cry"],
          ornate: ["a sound torn straight from the chest", "a roar that shook the air"],
          raw: ["screaming shout", "harsh blast of sound"],
          clinical: ["high-decibel vocalization", "forceful shout"],
        },
      },
    },
    {
      regex: /\bhitch(ed|ing|es)?\b/gi,
      replace: {
        ed: {
          plain: ["seized for a second", "jolted mid-breath", "locked up for a beat"],
          ornate: ["snagged on a word that never came", "went still, just for a breath"],
          raw: ["choked up for a second", "got caught in the throat"],
          clinical: ["halted briefly", "paused mid-respiration"],
        },
        ing: {
          plain: ["catching short", "snagging on itself", "stalling for a beat"],
          ornate: ["the rhythm losing its footing", "something caught between two beats"],
          raw: ["choking on a breath", "tripping over itself"],
          clinical: ["experiencing respiratory interruption", "stalling momentarily"],
        },
        es: {
          plain: ["trips for a second", "freezes mid-breath", "falters for a beat"],
          ornate: ["stumbles over the same silence every time", "goes still for exactly one breath"],
          raw: ["chokes up", "stalls abruptly"],
          clinical: ["halts briefly", "pauses involuntarily"],
        },
        "": {
          plain: ["short break in rhythm", "momentary stop", "small interruption"],
          ornate: ["a beat that never quite lands", "a half-second of missing rhythm"],
          raw: ["hard catch in the throat", "sudden choke"],
          clinical: ["respiratory pause", "brief interruption"],
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
              plain: ["with no air left", "gasping the words out", "in a rush, out of air"],
              ornate: ["with what little air he had left", "the words spilling out before the next breath came"],
              raw: ["gasping hard", "choking the words out"],
              clinical: ["without sufficient oxygen", "speaking during oxygen debt"],
            }
          : {
              plain: ["out of air", "winded", "gasping"],
              ornate: ["emptied of air", "caught between one breath and the next"],
              raw: ["heaving", "choking for air"],
              clinical: ["oxygen depleted", "exhibiting rapid respiration"],
            };
        return pick_replacement(match, forms_map, exact_voice, fallback_voice, offset);
      },
    },
    {
      regex: /\bdropping an octave\b/gi,
      replace: {
        plain: ["voice dropping lower", "letting his voice go deep", "voice sinking down"],
        ornate: ["letting his voice fall to something deeper", "his voice dropping into a lower register"],
        raw: ["letting his voice hit the floor", "dropping his tone heavy and low"],
        clinical: ["lowering vocal pitch significantly", "shifting to a lower frequency"],
      },
    },

    // =========================================================================
    // 2. SOUND, VIBRATION & MOTION
    // =========================================================================
    {
      regex: /\bhum(med|ming|s)?\b/gi,
      replace: {
        med: {
          plain: ["droned steadily", "throbbed low", "reverberated through the walls"],
          ornate: ["sang low beneath the surface of things", "rolled through the floor like a held note"],
          raw: ["shook with a low vibration", "pushed a heavy sound through the floor"],
          clinical: ["emitted a steady frequency", "produced a low oscillation"],
        },
        ming: {
          plain: ["vibrating steadily", "whirring low", "oscillating faintly"],
          ornate: ["threading a low note through the silence", "keeping the air faintly alive with sound"],
          raw: ["shaking the air faintly", "pushing a low noise through the room"],
          clinical: ["emitting continuous vibration", "maintaining a baseline frequency"],
        },
        s: {
          plain: ["resonates low", "pulses steadily", "judders faintly"],
          ornate: ["keeps one low note running beneath the room", "threads a constant current through the quiet"],
          raw: ["shakes the floorboards faintly", "pushes a heavy vibration"],
          clinical: ["emits a baseline frequency", "maintains a steady oscillation"],
        },
        "": {
          plain: ["low tone", "steady frequency", "background note"],
          ornate: ["a note with no beginning", "a sound too constant to notice"],
          raw: ["heavy drone", "low vibration"],
          clinical: ["baseline frequency", "continuous oscillation"],
        },
      },
    },
    {
      regex: /\b(low|industrial|electrical|steady|soft)\s+hum\b/gi,
      replace: (match, p1, ...args) => {
        const offset = args[args.length - 2];
        const forms_map = {
          plain: ["current", "undertone", "frequency"],
          ornate: ["resonance", "undercurrent"],
          raw: ["rattle", "heavy vibration"],
          clinical: ["oscillation", "baseline drone"],
        };
        const active_voice = forms_map[exact_voice] || forms_map[fallback_voice] || forms_map.plain;
        return p1 + " " + stable_pick(active_voice, match, offset);
      },
    },
    {
      regex: /\bboom(ed|ing|s)?\b/gi,
      replace: {
        ed: {
          plain: ["echoed loudly", "rang out loud", "hit with a thud"],
          ornate: ["struck the air like a physical blow", "hit with concussive force"],
          raw: ["slammed into the silence", "crashed loud and heavy"],
          clinical: ["produced a high-amplitude echo", "resonated forcefully"],
        },
        ing: {
          plain: ["loud", "deep and loud", "deafening"],
          ornate: ["heavy enough to rattle the teeth", "rolling like distant artillery"],
          raw: ["bone-rattling", "crushing and loud"],
          clinical: ["high-amplitude", "highly resonant"],
        },
        s: {
          plain: ["echoes loudly", "rings out loud", "hits with a thud"],
          ornate: ["strikes the air like a blow", "hits with concussive force"],
          raw: ["slams hard", "crashes loud"],
          clinical: ["produces a high-amplitude echo", "resonates heavily"],
        },
        "": {
          plain: ["loud thud", "deep crash", "heavy impact"],
          ornate: ["a concussive shock", "a deep, bone-rattling impact"],
          raw: ["shockwave of sound", "deafening crash"],
          clinical: ["concussive acoustic event", "high-amplitude sound wave"],
        },
      },
    },
    {
      regex: /\bshiver(s|ed|ing)?\b/gi,
      replace: (match, p1, ...args) => {
        const offset = args[args.length - 2];
        const forms_map = {
          plain: {
            "": ["flinch", "tense up", "jolt"],
            s: ["shudders", "stiffens", "jerks back"],
            ed: ["seized up", "went rigid for a second", "recoiled slightly"],
            ing: ["going rigid in waves", "reacting over and over", "unable to stay still"],
          },
          ornate: {
            "": ["a current runs through him", "something cold moves down his spine"],
            s: ["something crosses just beneath his skin", "his frame answers before he can stop it"],
            ed: ["a current ran through him before he could stop it", "his frame gave one involuntary jolt"],
            ing: ["caught in a current that won't let go", "unable to find stillness again"],
          },
          raw: {
            "": ["flinch hard", "jolt"],
            s: ["flinches violently", "jerks hard"],
            ed: ["flinched hard", "spasmed"],
            ing: ["flinching continuously", "spasming"],
          },
          clinical: {
            "": ["exhibit a tremor", "experience a spasm"],
            s: ["exhibits a tremor", "experiences a spasm"],
            ed: ["exhibited a tremor", "experienced a spasm"],
            ing: ["exhibiting tremors", "experiencing spasms"],
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
            ed: ["beat quickly", "skipped", "stirred"],
            ing: ["beating quickly", "stirring", "beating lightly"],
            s: ["beats quickly", "skips", "stirs"],
            "": ["quick beat", "light stir", "flurry"],
          },
          ornate: {
            ed: ["beat once, then again, quicker", "skipped a beat"],
            ing: ["beating quick and light", "skipping"],
            s: ["beats quick and light", "skips a beat"],
            "": ["a quick light beat", "a soft stir"],
          },
          raw: {
            ed: ["hammered", "thudded fast"],
            ing: ["hammering", "thudding fast"],
            s: ["hammers", "thuds fast"],
            "": ["hard fast beat", "heavy pulse"],
          },
          clinical: {
            ed: ["moved rapidly", "beat quickly"],
            ing: ["moving rapidly", "beating quickly"],
            s: ["moves rapidly", "beats quickly"],
            "": ["rapid movement", "quick oscillation"],
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
            ed: ["flashed", "blinked", "wavered"],
            ing: ["flashing", "blinking", "wavering"],
            s: ["flashes", "blinks", "wavers"],
            "": ["flash", "blink", "waver"],
          },
          ornate: {
            ed: ["lit and dimmed once", "caught the light and lost it"],
            ing: ["catching and losing the light", "pulsing unsteadily"],
            s: ["catches and loses the light", "pulses unsteadily"],
            "": ["an unsteady pulse of light", "a momentary glint"],
          },
          raw: {
            ed: ["stuttered", "cut out and came back"],
            ing: ["stuttering", "cutting in and out"],
            s: ["stutters", "cuts in and out"],
            "": ["a hard stutter of light", "a dead flash"],
          },
          clinical: {
            ed: ["fluctuated in brightness", "blinked briefly"],
            ing: ["fluctuating in brightness", "blinking briefly"],
            s: ["fluctuates in brightness", "blinks briefly"],
            "": ["a brief fluctuation in light", "a momentary dimming"],
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
      regex: /\b(taste|tastes|tasted|tasting)\s+(of|like)\s+(a\s+)?(copper|metal|iron|pennies)\b/gi,
      replace: {
        plain: ["raw, metallic edge", "sharp tang", "bitter bite in the mouth"],
        ornate: ["a harsh, metallic resonance", "a bitter tang on the tongue"],
        raw: ["raw grit", "taste of hot wire"],
        clinical: ["metallic gustatory perception", "sharp oral sensation"],
      },
    },
    {
      regex: /\b(spike|surge|jolt|rush|flash|shot|hit)\s+of\s+adrenaline\b/gi,
      replace: {
        plain: ["sudden surge of instinct", "sharp pulse of urgency", "sudden focus"],
        ornate: ["a sharp pulse of raw sensation", "an intense wave of focus"],
        raw: ["raw pulse of heat", "sudden kick in the chest"],
        clinical: ["acute epinephrine discharge", "sympathetic nervous system response"],
      },
    },
    {
      regex: /\badrenaline\s+(spike|surge|jolt|rush|hit|spiking|surging)\b/gi,
      replace: {
        plain: ["instinct surging", "urgency spiking", "blood surging"],
        ornate: ["heightened perception surging", "raw focus spiking"],
        raw: ["chest pumping hard", "blood slamming through veins"],
        clinical: ["epinephrine elevation", "sympathetic arousal"],
      },
    },
    {
      regex: /\badrenaline\b/gi,
      replace: {
        plain: ["instinct", "urgency", "focus"],
        ornate: ["heightened awareness", "visceral focus"],
        raw: ["raw blood", "gut heat"],
        clinical: ["epinephrine", "autonomic arousal"],
      },
    },
    {
      regex: /\b(heart|pulse)\s+(hammering|hammers|pounding|pounds)\b/gi,
      replace: {
        plain: ["pulse racing", "chest tight", "breath catching"],
        ornate: ["rhythm surging violently", "chest reverberating"],
        raw: ["chest straining", "blood thumping"],
        clinical: ["elevated heart rate", "cardiovascular acceleration"],
      },
    },
    {
      regex: /\bstomach\s+(knots|twists|drops|tightens|turns|turned|twisted|dropped)\b/gi,
      replace: {
        plain: ["guts tensing", "instinct surging", "chest pulling tight"],
        ornate: ["a cold drop inside", "a sudden shift in the gut"],
        raw: ["guts twisting", "gut clenching tight"],
        clinical: ["visceral contraction", "gastrointestinal tension"],
      },
    },
    {
      regex: /\btrembling\s+(fingers|hands)\b/gi,
      replace: {
        plain: ["unsteady hands", "shaky grip", "fingers twitching"],
        ornate: ["unsteady hands", "hands betraying the tension"],
        raw: ["shaky hands", "strained grip"],
        clinical: ["motor tremor in hands", "unsteady manual dexterity"],
      },
    },
    {
      regex: /\bair tastes of ozone\b/gi,
      replace: {
        plain: ["air tastes sharp and metallic", "the air carries a raw electric edge", "the air smells faintly of hot wire"],
        ornate: ["a bitter charge coats the tongue", "the atmosphere carries the weight of a storm"],
        raw: ["air tastes like hot iron and heat", "the smell of burned wire fills the space"],
        clinical: ["atmospheric ionization is detectable", "electrical discharge is present in the air"],
      },
    },
    {
      regex: /\bscent of ozone\b/gi,
      replace: {
        plain: ["smell of hot wire", "scent of scorched metal", "sharp electrical smell"],
        ornate: ["fragrance of a broken storm", "bitter aroma of raw current"],
        raw: ["stink of hot wiring", "burnt wire smell"],
        clinical: ["ionized atmospheric odor", "scent of electrical discharge"],
      },
    },
    {
      regex: /\bozone\b/gi,
      replace: {
        plain: ["charged air", "hot wire", "scorched metal"],
        ornate: ["sparking air", "charged atmosphere"],
        raw: ["hot iron", "fried wire"],
        clinical: ["ionization", "electrical discharge"],
      },
    },
    {
      regex: /\bphantom\s+(itch|ache|pain)\b/gi,
      replace: {
        plain: ["deep ache", "dull throbbing", "lingering tension"],
        ornate: ["an echo of old pain", "a persistent dull throb"],
        raw: ["dull ache", "old throb"],
        clinical: ["phantom sensation", "neurological echo"],
      },
    },
    {
      regex: /\b(is|was|felt|hits|hit|strikes|landed|slams|slamming)?\s*(like\s+a\s+)?physical\s+blow\b/gi,
      replace: {
        plain: ["landed with sudden force", "carried real weight", "hit like a heavy punch"],
        ornate: ["struck with visceral force", "landed with devastating clarity"],
        raw: ["hit like a fist", "landed hard"],
        clinical: ["produced high impact force", "registered as acute shock"],
      },
    },
    {
      regex: /\bshivering\s+shadows?\b/gi,
      replace: {
        plain: ["dark shadows", "shifting shadows", "moving shadows"],
        ornate: ["shadows that never quite settle", "restless dark pooling at the edges"],
        raw: ["twitching shadows", "nervous dark spots"],
        clinical: ["fluctuating low-light areas", "unstable silhouettes"],
      },
    },
    {
      regex: /\bsmudge\s+of\s+(charcoal|darkness)\b/gi,
      replace: {
        plain: ["dark shape", "shadowy outline", "dim silhouette"],
        ornate: ["a silhouette cut from the dark itself", "an outline the shadows seem reluctant to release"],
        raw: ["heavy stain of dark", "bruise of a shadow"],
        clinical: ["low-contrast form", "indistinct silhouette"],
      },
    },
    {
      regex: /\bblindingly\s+white\s+grin\b/gi,
      replace: {
        plain: ["bright grin", "wide smile", "big grin"],
        ornate: ["a grin lit up like a struck match", "a smile bright enough to cut through the gloom"],
        raw: ["harsh, bright smile", "teeth flashing sharp and white"],
        clinical: ["high-contrast smile", "prominent dental display"],
      },
    },
    {
      regex: /\bshimmering\b/gi,
      replace: {
        plain: ["glinting", "shining", "sparkling"],
        ornate: ["catching the light in restless flickers", "throwing off light like something alive"],
        raw: ["flashing harsh light", "glaring bright"],
        clinical: ["reflecting light rapidly", "exhibiting high specular reflection"],
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
          plain: ["proof of", "evidence of", "a marker of"],
          ornate: ["a monument to", "a silent witness to"],
          raw: ["hard proof of", "a raw reminder of"],
          clinical: ["evidence of", "an indicator of"],
        };
        const active_voice = forms_map[exact_voice] || forms_map[fallback_voice] || forms_map.plain;
        return p1 + " " + stable_pick(active_voice, match, offset);
      },
    },
    {
      regex: /\ba\s+testament\s+to\b/gi,
      replace: {
        plain: ["proof of", "evidence of", "a sign of"],
        ornate: ["a monument to", "a silent witness to"],
        raw: ["hard proof of", "a raw reminder of"],
        clinical: ["evidence of", "an indicator of"],
      },
    },
    {
      regex: /\btestament\b/gi,
      replace: {
        plain: ["proof", "evidence", "marker"],
        ornate: ["monument", "witness"],
        raw: ["hard proof", "reminder"],
        clinical: ["evidence", "indicator"],
      },
    },
    {
      regex: /\btapestry\s+of\b/gi,
      replace: {
        plain: ["mix of", "web of", "tangle of"],
        ornate: ["woven history of", "intricate maze of"],
        raw: ["mess of", "tangled heap of"],
        clinical: ["collection of", "aggregate of"],
      },
    },
    {
      regex: /\btapestry\b/gi,
      replace: {
        plain: ["web", "tangle", "patchwork"],
        ornate: ["woven thread", "intricate design"],
        raw: ["mess", "tangled heap"],
        clinical: ["collection", "aggregate"],
      },
    },
    {
      regex: /\bsymphony\s+of\b/gi,
      replace: {
        plain: ["medley of", "clash of", "cascade of"],
        ornate: ["choir of", "crescendo of"],
        raw: ["mess of noise", "violent clash of"],
        clinical: ["array of", "simultaneous occurrence of"],
      },
    },
    {
      regex: /\bcoiled\s+spring\b/gi,
      replace: {
        plain: ["tense frame", "wound tight", "ready to move"],
        ornate: ["held in absolute tension", "drawn tight as a bowstring"],
        raw: ["wound tight enough to break", "tense as a tripwire"],
        clinical: ["maintaining high kinetic potential", "exhibiting extreme muscle tension"],
      },
    },
    {
      regex: /\ba\s+study\s+in\b/gi,
      replace: {
        plain: ["a picture of", "an exercise in", "a portrait of"],
        ornate: ["the living embodiment of", "a masterclass in"],
        raw: ["nothing but pure", "a raw display of"],
        clinical: ["an example of", "a demonstration of"],
      },
    },
    {
      regex: /\bmarrow\s+of\s+(his|her|their|the)\s+teeth\b/gi,
      replace: (match, p1, ...args) => {
        const offset = args[args.length - 2];
        const forms_map = {
          plain: ["core of " + p1 + " bones", "deepest part of " + p1 + " jaw", "root of " + p1 + " bite"],
          ornate: ["very foundation of " + p1 + " frame", "deepest hollow of " + p1 + " bones"],
          raw: ["roots of " + p1 + " teeth", "hard bone of " + p1 + " jaw"],
          clinical: ["dental roots", "mandibular structure"],
        };
        const active_voice = forms_map[exact_voice] || forms_map[fallback_voice] || forms_map.plain;
        return stable_pick(active_voice, match, offset);
      },
    },
    { regex: /\bshell of (his|her|their|your)\s+ear\b/gi, replace: (match, p1) => p1 + " ear" },
    {
      regex: /\bfever\s+dream\b/gi,
      replace: {
        plain: ["strange blur", "hazy mess", "disorienting scene"],
        ornate: ["a hallucination with the volume turned up", "reality bent just slightly out of true"],
        raw: ["sick hallucination", "dizzying nightmare"],
        clinical: ["disorienting sequence", "hallucinatory state"],
      },
    },

    // =========================================================================
    // 5. REDDIT AI-ISMS & COMMUNITY TROPES
    // =========================================================================
    {
      regex: /\bobsidian\b/gi,
      replace: {
        plain: ["black glass", "glossy black", "deep black"],
        ornate: ["polished black", "glass-dark"],
        raw: ["black glass", "flat black"],
        clinical: ["black volcanic glass", "glassy black"],
      },
    },
    {
      regex: /\bthe\s+void\s+of\b/gi,
      replace: {
        plain: ["the emptiness of", "the dark of", "the blank of"],
        ornate: ["the hollowness of", "the deep nothing of"],
        raw: ["the nothing of", "the dead black of"],
        clinical: ["the absence in", "the unlit area of"],
      },
    },
    {
      regex: /([^A-Za-z])void\s+of\b/gi,
      replace: (match, p1, ...args) => p1 + stable_pick(["empty of", "bare of", "lacking"], match, args[args.length - 2]),
    },
    {
      regex: /\bthe\s+void\b/gi,
      replace: {
        plain: ["the dark", "the emptiness", "the blackness"],
        ornate: ["the dark beyond", "the silence beyond the light"],
        raw: ["the dark", "nothingness"],
        clinical: ["the darkness", "empty space"],
      },
    },
    {
      regex: /\bold\s+parchment\b/gi,
      replace: {
        plain: ["aged paper", "worn paper", "yellowed paper"],
        ornate: ["paper yellowed by years", "a sheet gone soft with age"],
        raw: ["brittle old paper", "yellowed scrap"],
        clinical: ["aged cellulose paper", "discolored paper"],
      },
    },
    {
      regex: /\bwhite\s+knuckles?\b/gi,
      replace: {
        plain: ["clenched hands", "a tight grip", "pale knuckles"],
        ornate: ["a grip so tight the tendons showed", "fingers pressed bloodless into the surface"],
        raw: ["a death grip", "hands squeezed hard"],
        clinical: ["hands gripping firmly", "a high-tension grip"],
      },
    },
    {
      regex: /\bknuckles?\s+(were|turned|turning|going|went)\s+white\b/gi,
      replace: {
        plain: ["the grip tightened", "the hands clenched", "the grip went tight"],
        ornate: ["the tendons showed along the back of the hand", "the grip turned bone-hard"],
        raw: ["the hands locked up hard", "the grip went savage"],
        clinical: ["grip tension increased", "the hands clenched harder"],
      },
    },
    {
      regex: /\bspatial\s+disturbances?\b/gi,
      replace: {
        plain: ["warp in the air", "rift in the air", "distortion in the air"],
        ornate: ["shift in the air", "fold in the light"],
        raw: ["tear in the air", "split in the air"],
        clinical: ["anomaly in the field", "localized distortion"],
      },
    },
    {
      regex: /\bjolts?\s+of\s+electricity\b/gi,
      replace: {
        plain: ["sharp pulses", "sudden charges", "sharp sparks"],
        ornate: ["currents that raced along his nerves", "sparks that ran up his skin"],
        raw: ["raw shocks", "stinging sparks"],
        clinical: ["electrical sensations", "sudden voltage-like sensations"],
      },
    },
    {
      regex: /\bfroze\b/gi,
      replace: {
        plain: ["went still", "stopped dead", "stiffened"],
        ornate: ["held motionless", "went rigid mid-motion"],
        raw: ["went rigid", "stopped dead"],
        clinical: ["stopped moving", "became motionless"],
      },
    },
    {
      regex: /\bstood\s+frozen\b/gi,
      replace: {
        plain: ["stood still", "stood motionless", "stood rigid"],
        ornate: ["held absolutely still", "went rigid mid-motion"],
        raw: ["locked stiff", "went dead still"],
        clinical: ["stood motionless", "stopped all movement"],
      },
    },
    {
      regex: /\bfrozen\s+(?:in\s+place|mid-?\w+|to\s+the\s+spot|on\s+the\s+spot)\b/gi,
      replace: {
        plain: ["motionless", "rigid", "stock-still"],
        ornate: ["caught mid-motion", "arrested in the act"],
        raw: ["locked stiff", "stuck rigid"],
        clinical: ["motionless", "without movement"],
      },
    },
    {
      regex: /\bfrozen\s+with\b/gi,
      replace: {
        plain: ["rigid with", "stiff with", "rooted by"],
        ornate: ["struck rigid with", "held stiff by"],
        raw: ["locked up with", "stiff with"],
        clinical: ["motionless with", "unmoving with"],
      },
    },
    {
      regex: /\braspy\b/gi,
      replace: {
        plain: ["rough", "hoarse", "scraped"],
        ornate: ["scraped raw", "roughened by time"],
        raw: ["rough", "hoarse"],
        clinical: ["hoarse", "with vocal strain"],
      },
    },
    {
      regex: /\bcrimson\b/gi,
      replace: {
        plain: ["deep red", "dark red", "blood red"],
        ornate: ["the color of old blood", "a deep, aching red"],
        raw: ["blood red", "deep red"],
        clinical: ["deep red", "high-saturation red"],
      },
    },
    {
      regex: /\bamber\s+(light|glow|dawn|air|sun|shine|glaze|gaze|eyes|sky|hour|lightning)\b/gi,
      replace: (match, p1, ...args) => stable_pick(["golden", "honeyed", "warm gold"], match, args[args.length - 2]) + " " + p1,
    },
    {
      regex: /\bbruised\s+purple\b/gi,
      replace: {
        plain: ["storm-dark", "heavy", "deep"],
        ornate: ["the color of a fading bruise", "heavy and dark"],
        raw: ["dark", "swollen dark"],
        clinical: ["dark violet", "deep reddish-dark"],
      },
    },
    {
      regex: /\biridescent\b/gi,
      replace: {
        plain: ["color-shifting", "glossy", "shifting"],
        ornate: ["catching the light in shifting colors", "throwing off a play of color"],
        raw: ["shiny and shifting", "flashy"],
        clinical: ["with shifting surface colors", "spectrally reflective"],
      },
    },
    {
      regex: /\bpalpable\b/gi,
      replace: {
        plain: ["obvious", "heavy in the air", "impossible to miss"],
        ornate: ["thick enough to touch", "pressing on the room like weather"],
        raw: ["heavy enough to choke on", "crushing the air out of the room"],
        clinical: ["measurable", "clearly observable"],
      },
    },
    {
      regex: /\btangible\b/gi,
      replace: {
        plain: ["real", "solid", "concrete"],
        ornate: ["something you could almost hold", "solid enough to lean on"],
        raw: ["hard and real", "heavy enough to feel"],
        clinical: ["verifiable", "concrete"],
      },
    },

    // =========================================================================
    // 6. SYNTACTICAL & PHYSICAL CLICHÉS
    // =========================================================================
    {
      regex: /\bviolently\b/gi,
      replace: {
        plain: ["hard", "sharply", "abruptly"],
        ornate: ["with sudden force", "all at once"],
        raw: ["hard", "with everything behind it"],
        clinical: ["with force", "abruptly"],
      },
    },
    {
      regex: /\bpractically\b/gi,
      replace: {
        plain: ["nearly", "almost", "just about"],
        ornate: ["as good as", "little short of"],
        raw: ["almost", "nearly"],
        clinical: ["nearly", "almost"],
      },
    },
    {
      regex: /\blean(ed|ing|s)?\s+in(?=[,.!?;)\]"]|["']?\s*$|\s+(?:and|to|for|until|so|enough|order)\b)/gi,
      replace: (match, p1, ...args) => {
        const offset = args[args.length - 2];
        const forms_map = {
          plain: {
            ed: ["moved closer", "drew closer", "shifted nearer"],
            ing: ["moving closer", "drawing closer", "shifting nearer"],
            s: ["moves closer", "draws closer", "shifts nearer"],
            "": ["move closer", "draw closer", "shift nearer"],
          },
          ornate: {
            ed: ["inclined toward the other", "closed the space between them"],
            ing: ["inclining toward the other", "closing the space between them"],
            s: ["inclines toward the other", "closes the space between them"],
            "": ["incline toward the other", "close the space between them"],
          },
          raw: {
            ed: ["got right in close", "crowded in"],
            ing: ["getting right in close", "crowding in"],
            s: ["gets right in close", "crowds in"],
            "": ["get right in close", "crowd in"],
          },
          clinical: {
            ed: ["reduced the distance", "moved nearer"],
            ing: ["reducing the distance", "moving nearer"],
            s: ["reduces the distance", "moves nearer"],
            "": ["reduce the distance", "move nearer"],
          },
        };
        const key_form = p1 ? p1.toLowerCase() : "";
        const active_voice = forms_map[exact_voice] || forms_map[fallback_voice] || forms_map.plain;
        const choices = active_voice[key_form] || active_voice[""];
        return match_case(match, stable_pick(choices, match, offset));
      },
    },
    {
      regex: /\bphysical\s+blow\b/gi,
      replace: {
        plain: ["real blow", "hard hit", "solid impact"],
        ornate: ["a blow with real weight behind it", "an impact that actually landed"],
        raw: ["a real hit", "a blow that actually hurt"],
        clinical: ["mechanical force", "real impact force"],
      },
    },
    {
      regex: /\b(he|she|they|i|we)\s+(didn'?t|hadn'?t)\s+(even\s+)?realiz\w*\s+(he|she|they|i|we)\s+(was|were)\s+holding\b/gi,
      replace: (match, p1) => match_case(match, p1 + "'d been holding"),
    },
    {
      regex: /\ba\s+sudden\s+and\s+sharp\s+feeling\b/gi,
      replace: {
        plain: ["a sudden feeling", "a sharp pang", "a sudden rush"],
        ornate: ["a feeling that arrived all at once", "a pang that came without warning"],
        raw: ["a sharp stab", "a sudden wave"],
        clinical: ["an abrupt sensation", "a sudden perceptible change"],
      },
    },
    {
      regex: /\blike\s+(?:a\s+)?crumpled\s+map\b/gi,
      replace: {
        plain: ["deeply lined", "creased with years", "folded with age"],
        ornate: ["scored by years", "grooved by time"],
        raw: ["beaten into lines", "hard-worn"],
        clinical: ["deeply lined", "heavily wrinkled"],
      },
    },
    {
      regex: /\bonce\s+in\s+a\s+blue\s+moon\b/gi,
      replace: {
        plain: ["rarely", "hardly ever", "every so often"],
        ornate: ["only rarely", "scarcely ever"],
        raw: ["rarely", "almost never"],
        clinical: ["rarely", "infrequently"],
      },
    },
    {
      regex: /\bmerging\s+their\s+molecules(?:\s+together)?\b/gi,
      replace: {
        plain: ["drawing together", "coming together", "closing the space between them"],
        ornate: ["closing the distance until the boundaries blurred", "coming together as one body"],
        raw: ["pressing together hard", "closing in until there was no gap"],
        clinical: ["reducing the distance between them to zero", "coming into full contact"],
      },
    },
    {
      regex: /\bshift(s|ed|ing)?\s+(his|her|their|my|your)?\s*weight\b/gi,
      replace: {
        plain: ["adjusting posture", "stepping back slightly", "bracing feet"],
        ornate: ["readjusting footing", "shifting stance against the floor"],
        raw: ["bracing feet", "shifting stance"],
        clinical: ["adjusting posture", "rebalancing center of gravity"],
      },
    },
    {
      regex: /\bpredatory\b/gi,
      replace: {
        plain: ["sharp", "calculating", "focused"],
        ornate: ["deliberate and sharp", "watching with quiet intensity"],
        raw: ["dangerous", "hard"],
        clinical: ["high-threat", "calculating"],
      },
    },
    {
      regex: /\bpossessive(ly)?\b/gi,
      replace: {
        plain: ["firmly", "tightly", "with clear intent"],
        ornate: ["with absolute certainty", "claiming the space"],
        raw: ["tight", "hard"],
        clinical: ["assertively", "with high grip strength"],
      },
    },
    {
      regex: /\bnibbl(es|ed|ing)\b/gi,
      replace: {
        plain: ["biting lightly", "tugging gently", "brushing past"],
        ornate: ["grazing with light pressure", "touching softly"],
        raw: ["biting light", "catching with teeth"],
        clinical: ["applying light pressure with teeth", "contacting lightly"],
      },
    },
    {
      regex: /\bearlobe(s)?\b/gi,
      replace: {
        plain: ["ear", "side of the jaw", "neck"],
        ornate: ["curve of the jaw", "side of the throat"],
        raw: ["jaw", "ear"],
        clinical: ["auricle region", "lateral jawline"],
      },
    },
    {
      regex: /\bcaress(es|ed|ing)?\b/gi,
      replace: {
        plain: ["touching softly", "brushing against", "tracing a line along"],
        ornate: ["tracing a slow line over", "letting fingers glide across"],
        raw: ["sliding hands over", "rubbing along"],
        clinical: ["applying light tactile pressure to", "tracing a linear path across"],
      },
    },
    {
      regex: /\bnostril(s)?\s+(flared|filled)\b/gi,
      replace: {
        plain: ["breath catching", "taking in a sharp breath", "breathing in deep"],
        ornate: ["drawing the scent deep into the lungs", "taking in a sharp, sudden breath"],
        raw: ["sucking in air", "taking a deep breath"],
        clinical: ["nasal inhalation expanding", "taking a deep breath"],
      },
    },
    {
      regex: /\bspatial\s+disturbance(s)?\b/gi,
      replace: {
        plain: ["movement in the air", "shattering silence", "sudden ripple"],
        ornate: ["a sudden pulse through the room", "a sharp break in the atmosphere"],
        raw: ["hard shockwave", "sudden rattle"],
        clinical: ["environmental perturbation", "atmospheric pressure shift"],
      },
    },
    {
      regex: /\bproper\s+madness\b/gi,
      replace: {
        plain: ["pure chaos", "complete insanity", "reckless risk"],
        ornate: ["unfiltered delirium", "a descent into chaos"],
        raw: ["raw insanity", "straight-up crazy"],
        clinical: ["extreme cognitive disorganization", "severe irrationality"],
      },
    },
    {
      regex: /\bsquelch(ing|ed)?\b/gi,
      replace: {
        plain: ["squishing", "sloshing", "churning underfoot"],
        ornate: ["sloshing heavily through liquid", "yielding wetly underfoot"],
        raw: ["squishing loudly", "splashing through muck"],
        clinical: ["displacing fluid saturated media", "yielding wetly under pressure"],
      },
    },
    {
      regex: /\bforce\s+of\s+a\s+physical\s+blow\b/gi,
      replace: {
        plain: ["sudden impact", "hard realization", "heavy hit"],
        ornate: ["a shock that landed like a physical weight", "an impact that rattled the frame"],
        raw: ["hard hit", "punch to the gut"],
        clinical: ["significant psychological impact", "abrupt cognitive disruption"],
      },
    },
    {
      regex: /\btracing lazy circles\b/gi,
      replace: {
        plain: ["drawing slow circles", "moving his fingers in loops", "tracing idle shapes"],
        ornate: ["drawing slow, unhurried circles against his skin", "letting his fingers wander in loose, idle loops"],
        raw: ["rubbing slow, aimless circles", "dragging his fingers in slow loops"],
        clinical: ["moving in slow circular patterns", "tracing repetitive motions"],
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
