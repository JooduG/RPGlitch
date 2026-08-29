/**
 * ============================================================================
 * src/data/definitions/speaking-styles.js
 * 🎙️ SPEAKING STYLES TAXONOMY & CLICHÉ DETOX RULES
 * ============================================================================
 *
 * Purpose:
 * Canonical registry of supported speaking styles, vocabulary substitution
 * dictionaries, and automated cliché detox rules for AI-generated dialogue
 * and narrative prose.
 *
 * Architecture:
 * - Declarative Rule System: Maps regex triggers to 4-style replacement buckets
 *   ('casual', 'lyrical', 'primal', 'clinical').
 * - Dynamic Decoupled Registration: Rules are registered into the text detox
 *   pipeline via `register_speaking_rules` without cyclic dependencies.
 * - Taxonomy Validation: Strict validation functions and frozen array constants.
 *
 * Layer Hierarchy:
 * - Belongs to `src/data/definitions/` (Data Layer).
 * - Imports exclusively from platform/utility modules (`@utils`).
 *
 * Modification Rules:
 * - All regex rules MUST provide substitutions across all 4 canonical styles
 *   unless using functional transformation callbacks.
 * - Maintain P4 Zero Backwards Compatibility: no legacy aliases or fallback keys.
 * ============================================================================
 */

import { register_speaking_rules } from "@utils";

// ============================================================================
// 1. Declarative Rule Builder Primitive
// ============================================================================

/**
 * Creates a standard speaking style vocabulary rule.
 *
 * @param {RegExp} pattern - Regular expression to match cliché or trope terms.
 * @param {Record<string, any>|Function|string} replacement_dictionary - Mapping of styles/inflections to replacements, or a callback function.
 * @param {Object} [options] - Additional matching and formatting options.
 * @param {boolean} [options.keep_prefix] - Whether to preserve the matched prefix.
 * @param {boolean} [options.keep_suffix] - Whether to preserve the matched suffix.
 * @returns {{ pattern: RegExp, regex: RegExp, replace: Record<string, any>|Function|string, keep_prefix?: boolean, keep_suffix?: boolean }}
 */
function create_speaking_rule(pattern, replacement_dictionary, options = {}) {
  return { pattern, regex: pattern, replace: replacement_dictionary, ...options };
}

// ============================================================================
// 2. Vocal & Dialogue Delivery Rules
// ============================================================================

export const VOCAL_RULES = [
  create_speaking_rule(/\bmurmur(ed|ing|s)?\b/gi, {
    ed: {
      casual: ["said it quietly", "kept his voice low", "spoke half to himself"],
      lyrical: ["let the words fall hushed", "breathed it more than said it"],
      primal: ["ground it out low", "kept it under his breath"],
      clinical: ["lowered vocal output", "kept the volume low"],
    },
    ing: {
      casual: ["talking under his breath", "voice sinking low", "barely audible now"],
      lyrical: ["letting each word dissolve into breath", "voice unspooling in a hush"],
      primal: ["keeping it low and rough", "talking barely above a whisper"],
      clinical: ["reducing vocal amplitude", "speaking at low volume"],
    },
    s: {
      casual: ["keeps it quiet", "drops his voice", "speaks low"],
      lyrical: ["lets the words fall soft", "gives the sentence hardly any weight"],
      primal: ["keeps it under his breath", "grinds it out soft"],
      clinical: ["lowers volume", "speaks quietly"],
    },
    "": {
      casual: ["quiet remark", "low aside", "soft comment"],
      lyrical: ["a half-spoken confidence", "the ghost of a sentence"],
      primal: ["low word", "quiet breath"],
      clinical: ["low-volume utterance", "quiet vocalization"],
    },
  }),

  create_speaking_rule(/\bpurr(ed|ing|s)?\b/gi, {
    ed: {
      casual: ["said it slow and easy", "gave the words a teasing edge", "let his tone go warm"],
      lyrical: ["let the words curl slow off his tongue", "drew the words out like warm honey"],
      primal: ["let it drag out slow", "said it with heavy heat"],
      clinical: ["spoke with deliberate slowness", "lowered vocal pitch slightly"],
    },
    ing: {
      casual: ["voice gone warm and slow", "words coming out unhurried", "tone easing into something coy"],
      lyrical: ["letting his voice curl at the edges", "drawing each syllable out unhurried"],
      primal: ["dragging the words out", "dropping his voice low and heavy"],
      clinical: ["speaking with slow precision", "maintaining a smooth delivery"],
    },
    s: {
      casual: ["says it slow", "gives the words a playful edge", "lets his tone warm up"],
      lyrical: ["curls the words at the edges", "draws it out, unhurried and warm"],
      primal: ["drags the words out slow", "says it with heat"],
      clinical: ["speaks slowly", "lowers pitch slightly"],
    },
    "": {
      casual: ["low teasing tone", "warm playful edge", "coy inflection"],
      lyrical: ["a slow, honeyed edge", "a velvet undertone"],
      primal: ["low heavy tone", "slow drag of a voice"],
      clinical: ["smooth vocalization", "measured cadence"],
    },
  }),

  create_speaking_rule(/\brasp(ed|ing|s)?\b/gi, {
    ed: {
      casual: ["said it rough", "ground the words out", "let his voice go raw"],
      lyrical: ["ground the words out like stone underfoot", "let the sentence come out scraped raw"],
      primal: ["scraped the words out", "forced it out raw"],
      clinical: ["spoke with severe vocal strain", "spoke hoarsely"],
    },
    ing: {
      casual: ["voice scraping rough", "forcing the words along", "going dry and strained"],
      lyrical: ["scraping each word past a throat gone raw", "letting the words come out edged like stone"],
      primal: ["scraping out every word", "grinding the words out"],
      clinical: ["speaking with notable strain", "vocalizing hoarsely"],
    },
    s: {
      casual: ["says it dry", "voice comes out rough", "forces it through gritted teeth"],
      lyrical: ["scrapes the words past a raw throat", "gives the sentence an edge like broken stone"],
      primal: ["scrapes the words out", "forces it out raw"],
      clinical: ["speaks with vocal strain", "delivers hoarsely"],
    },
    "": {
      casual: ["rough, worn voice", "harsh edge to his tone", "low growl of a voice"],
      lyrical: ["a voice worn down to bare rock", "a voice roughened by something unsaid"],
      primal: ["harsh scrap of a voice", "raw edge"],
      clinical: ["strained vocalization", "hoarse audio output"],
    },
  }),

  create_speaking_rule(/\brough,?\s+(dismissive|dangerous)?\s*rasp\b/gi, {
    casual: ["rough, worn voice", "harsh edge to his tone", "low growl of a voice"],
    lyrical: ["a voice worn down to bare rock", "a voice roughened by something unsaid"],
    primal: ["harsh scrap of a voice", "raw edge"],
    clinical: ["strained vocalization", "hoarse audio output"],
  }),

  create_speaking_rule(/\bbellow(ed|ing|s)?\b/gi, {
    ed: {
      casual: ["shouted", "roared", "yelled"],
      lyrical: ["let the sound tear from his chest", "shook the air with his voice"],
      primal: ["screamed it loud", "roared until his throat hurt"],
      clinical: ["shouted at maximum volume", "vocalized forcefully"],
    },
    ing: {
      casual: ["shouting", "roaring", "yelling loudly"],
      lyrical: ["letting the sound rip from his chest", "shaking the air with the volume"],
      primal: ["screaming loud", "yelling at the top of his lungs"],
      clinical: ["shouting forcefully", "projecting at high volume"],
    },
    s: {
      casual: ["shouts", "roars", "yells"],
      lyrical: ["lets the sound tear from his chest", "shakes the air with his voice"],
      primal: ["screams loud", "roars hard"],
      clinical: ["shouts", "projects at peak volume"],
    },
    "": {
      casual: ["shout", "roar", "loud cry"],
      lyrical: ["a sound torn straight from the chest", "a roar that shook the air"],
      primal: ["screaming shout", "harsh blast of sound"],
      clinical: ["high-decibel vocalization", "forceful shout"],
    },
  }),

  create_speaking_rule(/\bhitch(ed|ing|es)?\b/gi, {
    ed: {
      casual: ["seized for a second", "jolted mid-breath", "locked up for a beat"],
      lyrical: ["snagged on a word that never came", "went still, just for a breath"],
      primal: ["choked up for a second", "got caught in the throat"],
      clinical: ["halted briefly", "paused mid-respiration"],
    },
    ing: {
      casual: ["catching short", "snagging on itself", "stalling for a beat"],
      lyrical: ["the rhythm losing its footing", "something caught between two beats"],
      primal: ["choking on a breath", "tripping over itself"],
      clinical: ["experiencing respiratory interruption", "stalling momentarily"],
    },
    es: {
      casual: ["trips for a second", "freezes mid-breath", "falters for a beat"],
      lyrical: ["stumbles over the same silence every time", "goes still for exactly one breath"],
      primal: ["chokes up", "stalls abruptly"],
      clinical: ["halts briefly", "pauses involuntarily"],
    },
    "": {
      casual: ["short break in rhythm", "momentary stop", "small interruption"],
      lyrical: ["a beat that never quite lands", "a half-second of missing rhythm"],
      primal: ["hard catch in the throat", "sudden choke"],
      clinical: ["respiratory pause", "brief interruption"],
    },
  }),

  create_speaking_rule(/\bbreathless(ly)?\b/gi, {
    ly: {
      casual: ["with no air left", "gasping the words out", "in a rush, out of air"],
      lyrical: ["with what little air he had left", "the words spilling out before the next breath came"],
      primal: ["gasping hard", "choking the words out"],
      clinical: ["without sufficient oxygen", "speaking during oxygen debt"],
    },
    "": {
      casual: ["out of air", "winded", "gasping"],
      lyrical: ["emptied of air", "caught between one breath and the next"],
      primal: ["heaving", "choking for air"],
      clinical: ["oxygen depleted", "exhibiting rapid respiration"],
    },
  }),

  create_speaking_rule(/\bdropping an octave\b/gi, {
    casual: ["voice dropping lower", "letting his voice go deep", "voice sinking down"],
    lyrical: ["letting his voice fall to something deeper", "his voice dropping into a lower register"],
    primal: ["letting his voice hit the floor", "dropping his tone heavy and low"],
    clinical: ["lowering vocal pitch significantly", "shifting to a lower frequency"],
  }),
];

// ============================================================================
// 3. Sound, Vibration & Motion Rules
// ============================================================================

export const SOUND_RULES = [
  create_speaking_rule(/\bhum(med|ming|s)?\b/gi, {
    med: {
      casual: ["droned steadily", "throbbed low", "reverberated through the walls"],
      lyrical: ["sang low beneath the surface of things", "rolled through the floor like a held note"],
      primal: ["shook with a low vibration", "pushed a heavy sound through the floor"],
      clinical: ["emitted a steady frequency", "produced a low oscillation"],
    },
    ming: {
      casual: ["vibrating steadily", "whirring low", "oscillating faintly"],
      lyrical: ["threading a low note through the silence", "keeping the air faintly alive with sound"],
      primal: ["shaking the air faintly", "pushing a low noise through the room"],
      clinical: ["emitting continuous vibration", "maintaining a baseline frequency"],
    },
    s: {
      casual: ["resonates low", "pulses steadily", "judders faintly"],
      lyrical: ["keeps one low note running beneath the room", "threads a constant current through the quiet"],
      primal: ["shakes the floorboards faintly", "pushes a heavy vibration"],
      clinical: ["emits a baseline frequency", "maintains a steady oscillation"],
    },
    "": {
      casual: ["low tone", "steady frequency", "background note"],
      lyrical: ["a note with no beginning", "a sound too constant to notice"],
      primal: ["heavy drone", "low vibration"],
      clinical: ["baseline frequency", "continuous oscillation"],
    },
  }),

  create_speaking_rule(
    /\b(low|industrial|electrical|steady|soft)\s+hum\b/gi,
    {
      casual: ["current", "undertone", "frequency"],
      lyrical: ["resonance", "undercurrent"],
      primal: ["rattle", "heavy vibration"],
      clinical: ["oscillation", "baseline drone"],
    },
    { keep_prefix: true },
  ),

  create_speaking_rule(/\bboom(ed|ing|s)?\b/gi, {
    ed: {
      casual: ["echoed loudly", "rang out loud", "hit with a thud"],
      lyrical: ["struck the air like a physical blow", "hit with concussive force"],
      primal: ["slammed into the silence", "crashed loud and heavy"],
      clinical: ["produced a high-amplitude echo", "resonated forcefully"],
    },
    ing: {
      casual: ["loud", "deep and loud", "deafening"],
      lyrical: ["heavy enough to rattle the teeth", "rolling like distant artillery"],
      primal: ["bone-rattling", "crushing and loud"],
      clinical: ["high-amplitude", "highly resonant"],
    },
    s: {
      casual: ["echoes loudly", "rings out loud", "hits with a thud"],
      lyrical: ["strikes the air like a blow", "hits with concussive force"],
      primal: ["slams hard", "crashes loud"],
      clinical: ["produces a high-amplitude echo", "resonates heavily"],
    },
    "": {
      casual: ["loud thud", "deep crash", "heavy impact"],
      lyrical: ["a concussive shock", "a deep, bone-rattling impact"],
      primal: ["shockwave of sound", "deafening crash"],
      clinical: ["concussive acoustic event", "high-amplitude sound wave"],
    },
  }),

  create_speaking_rule(/\bshiver(s|ed|ing)?\b/gi, {
    "": {
      casual: ["flinch", "tense up", "jolt"],
      lyrical: ["a current runs through him", "something cold moves down his spine"],
      primal: ["flinch hard", "jolt"],
      clinical: ["exhibit a tremor", "experience a spasm"],
    },
    s: {
      casual: ["shudders", "stiffens", "jerks back"],
      lyrical: ["something crosses just beneath his skin", "his frame answers before he can stop it"],
      primal: ["flinches violently", "jerks hard"],
      clinical: ["exhibits a tremor", "experiences a spasm"],
    },
    ed: {
      casual: ["seized up", "went rigid for a second", "recoiled slightly"],
      lyrical: ["a current ran through him before he could stop it", "his frame gave one involuntary jolt"],
      primal: ["flinched hard", "spasmed"],
      clinical: ["exhibited a tremor", "experienced a spasm"],
    },
    ing: {
      casual: ["going rigid in waves", "reacting over and over", "unable to stay still"],
      lyrical: ["caught in a current that won't let go", "unable to find stillness again"],
      primal: ["flinching continuously", "spasming"],
      clinical: ["exhibiting tremors", "experiencing spasms"],
    },
  }),

  create_speaking_rule(
    /\bflutter(ed|ing|s)?\b(?!\s+(?:his|her|their|the|my|your|our|its|some|a|an|wings|curtains|flags|pages|eyelashes|lashes|paper)\s)/gi,
    {
      ed: {
        casual: ["beat quickly", "skipped", "stirred"],
        lyrical: ["beat once, then again, quicker", "skipped a beat"],
        primal: ["hammered", "thudded fast"],
        clinical: ["moved rapidly", "beat quickly"],
      },
      ing: {
        casual: ["beating quickly", "stirring", "beating lightly"],
        lyrical: ["beating quick and light", "skipping"],
        primal: ["hammering", "thudding fast"],
        clinical: ["moving rapidly", "beating quickly"],
      },
      s: {
        casual: ["beats quickly", "skips", "stirs"],
        lyrical: ["beats quick and light", "skips a beat"],
        primal: ["hammers", "thuds fast"],
        clinical: ["moves rapidly", "beats quickly"],
      },
      "": {
        casual: ["quick beat", "light stir", "flurry"],
        lyrical: ["a quick light beat", "a soft stir"],
        primal: ["hard fast beat", "heavy pulse"],
        clinical: ["rapid movement", "quick oscillation"],
      },
    },
  ),

  create_speaking_rule(/\bflicker(ed|ing|s)?\b/gi, {
    ed: {
      casual: ["flashed", "blinked", "wavered"],
      lyrical: ["lit and dimmed once", "caught the light and lost it"],
      primal: ["stuttered", "cut out and came back"],
      clinical: ["fluctuated in brightness", "blinked briefly"],
    },
    ing: {
      casual: ["flashing", "blinking", "wavering"],
      lyrical: ["catching and losing the light", "pulsing unsteadily"],
      primal: ["stuttering", "cutting in and out"],
      clinical: ["fluctuating in brightness", "blinking briefly"],
    },
    s: {
      casual: ["flashes", "blinks", "wavers"],
      lyrical: ["catches and loses the light", "pulses unsteadily"],
      primal: ["stutters", "cuts in and out"],
      clinical: ["fluctuates in brightness", "blinks briefly"],
    },
    "": {
      casual: ["flash", "blink", "waver"],
      lyrical: ["an unsteady pulse of light", "a momentary glint"],
      primal: ["a hard stutter of light", "a dead flash"],
      clinical: ["a brief fluctuation in light", "a momentary dimming"],
    },
  }),
];

// ============================================================================
// 4. Sensory, Bodily & Environmental Clichés
// ============================================================================

export const SENSORY_RULES = [
  create_speaking_rule(/\b(taste|tastes|tasted|tasting)\s+(of|like)\s+(a\s+)?(copper|metal|iron|pennies)\b/gi, {
    casual: ["raw, metallic edge", "sharp tang", "bitter bite in the mouth"],
    lyrical: ["a harsh, metallic resonance", "a bitter tang on the tongue"],
    primal: ["raw grit", "taste of hot wire"],
    clinical: ["metallic gustatory perception", "sharp oral sensation"],
  }),

  create_speaking_rule(/\b(spike|surge|jolt|rush|flash|shot|hit)\s+of\s+adrenaline\b/gi, {
    casual: ["sudden surge of instinct", "sharp pulse of urgency", "sudden focus"],
    lyrical: ["a sharp pulse of raw sensation", "an intense wave of focus"],
    primal: ["raw pulse of heat", "sudden kick in the chest"],
    clinical: ["acute epinephrine discharge", "sympathetic nervous system response"],
  }),

  create_speaking_rule(/\badrenaline\s+(spike|surge|jolt|rush|hit|spiking|surging)\b/gi, {
    casual: ["instinct surging", "urgency spiking", "blood surging"],
    lyrical: ["heightened perception surging", "raw focus spiking"],
    primal: ["chest pumping hard", "blood slamming through veins"],
    clinical: ["epinephrine elevation", "sympathetic arousal"],
  }),

  create_speaking_rule(/\badrenaline\b/gi, {
    casual: ["instinct", "urgency", "focus"],
    lyrical: ["heightened awareness", "visceral focus"],
    primal: ["raw blood", "gut heat"],
    clinical: ["epinephrine", "autonomic arousal"],
  }),

  create_speaking_rule(/\b(heart|pulse)\s+(hammering|hammers|pounding|pounds)\b/gi, {
    casual: ["pulse racing", "chest tight", "breath catching"],
    lyrical: ["rhythm surging violently", "chest reverberating"],
    primal: ["chest straining", "blood thumping"],
    clinical: ["elevated heart rate", "cardiovascular acceleration"],
  }),

  create_speaking_rule(/\bstomach\s+(knots|twists|drops|tightens|turns|turned|twisted|dropped)\b/gi, {
    casual: ["guts tensing", "instinct surging", "chest pulling tight"],
    lyrical: ["a cold drop inside", "a sudden shift in the gut"],
    primal: ["guts twisting", "gut clenching tight"],
    clinical: ["visceral contraction", "gastrointestinal tension"],
  }),

  create_speaking_rule(/\btrembling\s+(fingers|hands)\b/gi, {
    casual: ["unsteady hands", "shaky grip", "fingers twitching"],
    lyrical: ["unsteady hands", "hands betraying the tension"],
    primal: ["shaky hands", "strained grip"],
    clinical: ["motor tremor in hands", "unsteady manual dexterity"],
  }),

  create_speaking_rule(/\bair tastes of ozone\b/gi, {
    casual: ["air tastes sharp and metallic", "the air carries a raw electric edge", "the air smells faintly of hot wire"],
    lyrical: ["a bitter charge coats the tongue", "the atmosphere carries the weight of a storm"],
    primal: ["air tastes like hot iron and heat", "the smell of burned wire fills the space"],
    clinical: ["atmospheric ionization is detectable", "electrical discharge is present in the air"],
  }),

  create_speaking_rule(/\bscent of ozone\b/gi, {
    casual: ["smell of hot wire", "scent of scorched metal", "sharp electrical smell"],
    lyrical: ["fragrance of a broken storm", "bitter aroma of raw current"],
    primal: ["stink of hot wiring", "burnt wire smell"],
    clinical: ["ionized atmospheric odor", "scent of electrical discharge"],
  }),

  create_speaking_rule(/\bozone\b/gi, {
    casual: ["charged air", "hot wire", "scorched metal"],
    lyrical: ["sparking air", "charged atmosphere"],
    primal: ["hot iron", "fried wire"],
    clinical: ["ionization", "electrical discharge"],
  }),

  create_speaking_rule(/\bmetallic\s+tang\b/gi, {
    casual: ["sharp metal bite", "raw iron taste", "hard copper edge"],
    lyrical: ["a bitter metallic resonance", "an iron aftertaste on the tongue"],
    primal: ["flat iron bite", "grit of old blood and rust"],
    clinical: ["ferrous gustatory sensation", "metallic taste"],
  }),

  create_speaking_rule(/\bphantom\s+(itch|ache|pain)\b/gi, {
    casual: ["deep ache", "dull throbbing", "lingering tension"],
    lyrical: ["an echo of old pain", "a persistent dull throb"],
    primal: ["dull ache", "old throb"],
    clinical: ["phantom sensation", "neurological echo"],
  }),

  create_speaking_rule(/\b(is|was|felt|hits|hit|strikes|landed|slams|slamming)?\s*(like\s+a\s+)?physical\s+blow\b/gi, {
    casual: ["landed with sudden force", "carried real weight", "hit like a heavy punch"],
    lyrical: ["struck with visceral force", "landed with devastating clarity"],
    primal: ["hit like a fist", "landed hard"],
    clinical: ["produced high impact force", "registered as acute shock"],
  }),

  create_speaking_rule(/\bshivering\s+shadows?\b/gi, {
    casual: ["dark shadows", "shifting shadows", "moving shadows"],
    lyrical: ["shadows that never quite settle", "restless dark pooling at the edges"],
    primal: ["twitching shadows", "nervous dark spots"],
    clinical: ["fluctuating low-light areas", "unstable silhouettes"],
  }),

  create_speaking_rule(/\bsmudge\s+of\s+(charcoal|darkness)\b/gi, {
    casual: ["dark shape", "shadowy outline", "dim silhouette"],
    lyrical: ["a silhouette cut from the dark itself", "an outline the shadows seem reluctant to release"],
    primal: ["heavy stain of dark", "bruise of a shadow"],
    clinical: ["low-contrast form", "indistinct silhouette"],
  }),

  create_speaking_rule(/\bblindingly\s+white\s+grin\b/gi, {
    casual: ["bright grin", "wide smile", "big grin"],
    lyrical: ["a grin lit up like a struck match", "a smile bright enough to cut through the gloom"],
    primal: ["harsh, bright smile", "teeth flashing sharp and white"],
    clinical: ["high-contrast smile", "prominent dental display"],
  }),

  create_speaking_rule(/\bshimmering\b/gi, {
    casual: ["glinting", "shining", "sparkling"],
    lyrical: ["catching the light in restless flickers", "throwing off light like something alive"],
    primal: ["flashing harsh light", "glaring bright"],
    clinical: ["reflecting light rapidly", "exhibiting high specular reflection"],
  }),
];

// ============================================================================
// 5. Abstract Metaphors & Literary Tropes
// ============================================================================

export const METAPHOR_RULES = [
  create_speaking_rule(
    /\b(is|was|stands?|stood)\s+a\s+testament\s+to\b/gi,
    {
      casual: ["proof of", "evidence of", "a marker of"],
      lyrical: ["a monument to", "a silent witness to"],
      primal: ["hard proof of", "a raw reminder of"],
      clinical: ["evidence of", "an indicator of"],
    },
    { keep_prefix: true },
  ),

  create_speaking_rule(/\ba\s+testament\s+to\b/gi, {
    casual: ["proof of", "evidence of", "a sign of"],
    lyrical: ["a monument to", "a silent witness to"],
    primal: ["hard proof of", "a raw reminder of"],
    clinical: ["evidence of", "an indicator of"],
  }),

  create_speaking_rule(/\btestament\b/gi, {
    casual: ["proof", "evidence", "marker"],
    lyrical: ["monument", "witness"],
    primal: ["hard proof", "reminder"],
    clinical: ["evidence", "indicator"],
  }),

  create_speaking_rule(/\btapestry\s+of\b/gi, {
    casual: ["mix of", "web of", "tangle of"],
    lyrical: ["woven history of", "intricate maze of"],
    primal: ["mess of", "tangled heap of"],
    clinical: ["collection of", "aggregate of"],
  }),

  create_speaking_rule(/\btapestry\b/gi, {
    casual: ["web", "tangle", "patchwork"],
    lyrical: ["woven thread", "intricate design"],
    primal: ["mess", "tangled heap"],
    clinical: ["collection", "aggregate"],
  }),

  create_speaking_rule(/\bsymphony\s+of\b/gi, {
    casual: ["medley of", "clash of", "cascade of"],
    lyrical: ["choir of", "crescendo of"],
    primal: ["mess of noise", "violent clash of"],
    clinical: ["array of", "simultaneous occurrence of"],
  }),

  create_speaking_rule(/\bcoiled\s+spring\b/gi, {
    casual: ["tense frame", "wound tight", "ready to move"],
    lyrical: ["held in absolute tension", "drawn tight as a bowstring"],
    primal: ["wound tight enough to break", "tense as a tripwire"],
    clinical: ["maintaining high kinetic potential", "exhibiting extreme muscle tension"],
  }),

  create_speaking_rule(/\ba\s+study\s+in\b/gi, {
    casual: ["a picture of", "an exercise in", "a portrait of"],
    lyrical: ["the living embodiment of", "a masterclass in"],
    primal: ["nothing but pure", "a raw display of"],
    clinical: ["an example of", "a demonstration of"],
  }),

  create_speaking_rule(/\bmarrow\s+of\s+(his|her|their|the)\s+teeth\b/gi, (match, pronoun, ...rest_parameters) => {
    const string_offset = rest_parameters[rest_parameters.length - 2];
    const candidate_replacements = ["roots of " + pronoun + " teeth", "hard bone of " + pronoun + " jaw", "core of " + pronoun + " bones"];
    return candidate_replacements[Math.abs(string_offset) % candidate_replacements.length];
  }),

  create_speaking_rule(/\bshell of (his|her|their|your)\s+ear\b/gi, (match, pronoun) => pronoun + " ear"),

  create_speaking_rule(/\bfever\s+dream\b/gi, {
    casual: ["strange blur", "hazy mess", "disorienting scene"],
    lyrical: ["a hallucination with the volume turned up", "reality bent just slightly out of true"],
    primal: ["sick hallucination", "dizzying nightmare"],
    clinical: ["disorienting sequence", "hallucinatory state"],
  }),
];

// ============================================================================
// 6. Purple Prose & Community Tropes
// ============================================================================

export const COMMUNITY_RULES = [
  create_speaking_rule(/\bobsidian\b/gi, {
    casual: ["black glass", "glossy black", "deep black"],
    lyrical: ["polished black", "glass-dark"],
    primal: ["black glass", "flat black"],
    clinical: ["black volcanic glass", "glassy black"],
  }),

  create_speaking_rule(/\bthe\s+void\s+of\b/gi, {
    casual: ["the emptiness of", "the dark of", "the blank of"],
    lyrical: ["the hollowness of", "the deep nothing of"],
    primal: ["the nothing of", "the dead black of"],
    clinical: ["the absence in", "the unlit area of"],
  }),

  create_speaking_rule(/([^A-Za-z])void\s+of\b/gi, (match, leading_delimiter, ...rest_parameters) => {
    const string_offset = rest_parameters[rest_parameters.length - 2];
    const candidate_replacements = ["empty of", "bare of", "lacking"];
    return leading_delimiter + candidate_replacements[Math.abs(string_offset) % candidate_replacements.length];
  }),

  create_speaking_rule(/\bthe\s+void\b/gi, {
    casual: ["the dark", "the emptiness", "the blackness"],
    lyrical: ["the dark beyond", "the silence beyond the light"],
    primal: ["the dark", "nothingness"],
    clinical: ["the darkness", "empty space"],
  }),

  create_speaking_rule(/\bold\s+parchment\b/gi, {
    casual: ["aged paper", "worn paper", "yellowed paper"],
    lyrical: ["paper yellowed by years", "a sheet gone soft with age"],
    primal: ["brittle old paper", "yellowed scrap"],
    clinical: ["aged cellulose paper", "discolored paper"],
  }),

  create_speaking_rule(/\bwhite\s+knuckles?\b/gi, {
    casual: ["clenched hands", "a tight grip", "pale knuckles"],
    lyrical: ["a grip so tight the tendons showed", "fingers pressed bloodless into the surface"],
    primal: ["a death grip", "hands squeezed hard"],
    clinical: ["hands gripping firmly", "a high-tension grip"],
  }),

  create_speaking_rule(/\bknuckles?\s+(were|turned|turning|going|went)\s+white\b/gi, {
    casual: ["the grip tightened", "the hands clenched", "the grip went tight"],
    lyrical: ["the tendons showed along the back of the hand", "the grip turned bone-hard"],
    primal: ["the hands locked up hard", "the grip went savage"],
    clinical: ["grip tension increased", "the hands clenched harder"],
  }),

  create_speaking_rule(/\bspatial\s+disturbances?\b/gi, {
    casual: ["warp in the air", "rift in the air", "distortion in the air"],
    lyrical: ["shift in the air", "fold in the light"],
    primal: ["tear in the air", "split in the air"],
    clinical: ["anomaly in the field", "localized distortion"],
  }),

  create_speaking_rule(/\bjolts?\s+of\s+electricity\b/gi, {
    casual: ["sharp pulses", "sudden charges", "sharp sparks"],
    lyrical: ["currents that raced along his nerves", "sparks that ran up his skin"],
    primal: ["raw shocks", "stinging sparks"],
    clinical: ["electrical sensations", "sudden voltage-like sensations"],
  }),

  create_speaking_rule(/\bfroze\b/gi, {
    casual: ["went still", "stopped dead", "stiffened"],
    lyrical: ["held motionless", "went rigid mid-motion"],
    primal: ["went rigid", "stopped dead"],
    clinical: ["stopped moving", "became motionless"],
  }),

  create_speaking_rule(/\bstood\s+frozen\b/gi, {
    casual: ["stood still", "stood motionless", "stood rigid"],
    lyrical: ["held absolutely still", "went rigid mid-motion"],
    primal: ["locked stiff", "went dead still"],
    clinical: ["stood motionless", "stopped all movement"],
  }),

  create_speaking_rule(/\bfrozen\s+(?:in\s+place|mid-?\w+|to\s+the\s+spot|on\s+the\s+spot)\b/gi, {
    casual: ["motionless", "rigid", "stock-still"],
    lyrical: ["caught mid-motion", "arrested in the act"],
    primal: ["locked stiff", "stuck rigid"],
    clinical: ["motionless", "without movement"],
  }),

  create_speaking_rule(/\bfrozen\s+with\b/gi, {
    casual: ["rigid with", "stiff with", "rooted by"],
    lyrical: ["struck rigid with", "held stiff by"],
    primal: ["locked up with", "stiff with"],
    clinical: ["motionless with", "unmoving with"],
  }),

  create_speaking_rule(/\braspy\b/gi, {
    casual: ["rough", "hoarse", "scraped"],
    lyrical: ["scraped raw", "roughened by time"],
    primal: ["rough", "hoarse"],
    clinical: ["hoarse", "with vocal strain"],
  }),

  create_speaking_rule(/\bcrimson\b/gi, {
    casual: ["deep red", "dark red", "blood red"],
    lyrical: ["the color of old blood", "a deep, aching red"],
    primal: ["blood red", "deep red"],
    clinical: ["deep red", "high-saturation red"],
  }),

  create_speaking_rule(
    /\bamber\s+(light|glow|dawn|air|sun|shine|glaze|gaze|eyes|sky|hour|lightning)\b/gi,
    {
      casual: ["golden", "honeyed", "warm gold"],
      lyrical: ["honey-colored", "gilded", "warm gold"],
      primal: ["gold", "yellow-brown"],
      clinical: ["amber-tinted", "yellow-orange"],
    },
    { keep_suffix: true },
  ),

  create_speaking_rule(/\bbruised\s+purple\b/gi, {
    casual: ["storm-dark", "heavy", "deep"],
    lyrical: ["the color of a fading bruise", "heavy and dark"],
    primal: ["dark", "swollen dark"],
    clinical: ["dark violet", "deep reddish-dark"],
  }),

  create_speaking_rule(/\biridescent\b/gi, {
    casual: ["color-shifting", "glossy", "shifting"],
    lyrical: ["catching the light in shifting colors", "throwing off a play of color"],
    primal: ["shiny and shifting", "flashy"],
    clinical: ["with shifting surface colors", "spectrally reflective"],
  }),

  create_speaking_rule(/\bpalpable\b/gi, {
    casual: ["obvious", "heavy in the air", "impossible to miss"],
    lyrical: ["thick enough to touch", "pressing on the room like weather"],
    primal: ["heavy enough to choke on", "crushing the air out of the room"],
    clinical: ["measurable", "clearly observable"],
  }),

  create_speaking_rule(/\btangible\b/gi, {
    casual: ["real", "solid", "concrete"],
    lyrical: ["something you could almost hold", "solid enough to lean on"],
    primal: ["hard and real", "heavy enough to feel"],
    clinical: ["verifiable", "concrete"],
  }),

  create_speaking_rule(/\bviolently\b/gi, {
    casual: ["hard", "sharply", "abruptly"],
    lyrical: ["with sudden force", "all at once"],
    primal: ["hard", "with everything behind it"],
    clinical: ["with force", "abruptly"],
  }),

  create_speaking_rule(/\bpractically\b/gi, {
    casual: ["nearly", "almost", "just about"],
    lyrical: ["as good as", "little short of"],
    primal: ["almost", "nearly"],
    clinical: ["nearly", "almost"],
  }),

  create_speaking_rule(/\blean(ed|ing|s)?\s+in(?=[,.!?;)\]"]|["']?\s*$|\s+(?:and|to|for|until|so|enough|order)\b)/gi, {
    ed: {
      casual: ["moved closer", "drew closer", "shifted nearer"],
      lyrical: ["inclined toward the other", "closed the space between them"],
      primal: ["got right in close", "crowded in"],
      clinical: ["reduced the distance", "moved nearer"],
    },
    ing: {
      casual: ["moving closer", "drawing closer", "shifting nearer"],
      lyrical: ["inclining toward the other", "closing the space between them"],
      primal: ["getting right in close", "crowding in"],
      clinical: ["reducing the distance", "moving nearer"],
    },
    s: {
      casual: ["moves closer", "draws closer", "shifts nearer"],
      lyrical: ["inclines toward the other", "closes the space between them"],
      primal: ["gets right in close", "crowds in"],
      clinical: ["reduces the distance", "moves nearer"],
    },
    "": {
      casual: ["move closer", "draw closer", "shift nearer"],
      lyrical: ["incline toward the other", "close the space between them"],
      primal: ["get right in close", "crowd in"],
      clinical: ["reduce the distance", "move nearer"],
    },
  }),

  create_speaking_rule(/\bphysical\s+blow\b/gi, {
    casual: ["real blow", "hard hit", "solid impact"],
    lyrical: ["a blow with real weight behind it", "an impact that actually landed"],
    primal: ["a real hit", "a blow that actually hurt"],
    clinical: ["mechanical force", "real impact force"],
  }),

  create_speaking_rule(
    /\b(he|she|they|i|we)\s+(didn'?t|hadn'?t)\s+(even\s+)?realiz\w*\s+(he|she|they|i|we)\s+(was|were)\s+holding\b/gi,
    (match, pronoun) => pronoun + "'d been holding",
  ),

  create_speaking_rule(/\ba\s+sudden\s+and\s+sharp\s+feeling\b/gi, {
    casual: ["a sudden feeling", "a sharp pang", "a sudden rush"],
    lyrical: ["a feeling that arrived all at once", "a pang that came without warning"],
    primal: ["a sharp stab", "a sudden wave"],
    clinical: ["an abrupt sensation", "a sudden perceptible change"],
  }),

  create_speaking_rule(/\blike\s+(?:a\s+)?crumpled\s+map\b/gi, {
    casual: ["deeply lined", "creased with years", "folded with age"],
    lyrical: ["scored by years", "grooved by time"],
    primal: ["beaten into lines", "hard-worn"],
    clinical: ["deeply lined", "heavily wrinkled"],
  }),

  create_speaking_rule(/\bonce\s+in\s+a\s+blue\s+moon\b/gi, {
    casual: ["rarely", "hardly ever", "every so often"],
    lyrical: ["only rarely", "scarcely ever"],
    primal: ["rarely", "almost never"],
    clinical: ["rarely", "infrequently"],
  }),

  create_speaking_rule(/\bmerging\s+their\s+molecules(?:\s+together)?\b/gi, {
    casual: ["drawing together", "coming together", "closing the space between them"],
    lyrical: ["closing the distance until the boundaries blurred", "coming together as one body"],
    primal: ["pressing together hard", "closing in until there was no gap"],
    clinical: ["reducing the distance between them to zero", "coming into full contact"],
  }),

  create_speaking_rule(/\bshift(s|ed|ing)?\s+(his|her|their|my|your)?\s*weight\b/gi, {
    casual: ["adjusting posture", "stepping back slightly", "bracing feet"],
    lyrical: ["readjusting footing", "shifting stance against the floor"],
    primal: ["bracing feet", "shifting stance"],
    clinical: ["adjusting posture", "rebalancing center of gravity"],
  }),

  create_speaking_rule(/\bpredatory\b/gi, {
    casual: ["sharp", "calculating", "focused"],
    lyrical: ["deliberate and sharp", "watching with quiet intensity"],
    primal: ["dangerous", "hard"],
    clinical: ["high-threat", "calculating"],
  }),

  create_speaking_rule(/\bpossessive(ly)?\b/gi, {
    casual: ["firmly", "tightly", "with clear intent"],
    lyrical: ["with absolute certainty", "claiming the space"],
    primal: ["tight", "hard"],
    clinical: ["assertively", "with high grip strength"],
  }),

  create_speaking_rule(/\bnibbl(es|ed|ing)\b/gi, {
    casual: ["biting lightly", "tugging gently", "brushing past"],
    lyrical: ["grazing with light pressure", "touching softly"],
    primal: ["biting light", "catching with teeth"],
    clinical: ["applying light pressure with teeth", "contacting lightly"],
  }),

  create_speaking_rule(/\bearlobe(s)?\b/gi, {
    casual: ["ear", "side of the jaw", "neck"],
    lyrical: ["curve of the jaw", "side of the throat"],
    primal: ["jaw", "ear"],
    clinical: ["auricle region", "lateral jawline"],
  }),

  create_speaking_rule(/\bcaress(es|ed|ing)?\b/gi, {
    casual: ["touching softly", "brushing against", "tracing a line along"],
    lyrical: ["tracing a slow line over", "letting fingers glide across"],
    primal: ["sliding hands over", "rubbing along"],
    clinical: ["applying light tactile pressure to", "tracing a linear path across"],
  }),

  create_speaking_rule(/\bnostril(s)?\s+(flared|filled)\b/gi, {
    casual: ["breath catching", "taking in a sharp breath", "breathing in deep"],
    lyrical: ["drawing the scent deep into the lungs", "taking in a sharp, sudden breath"],
    primal: ["sucking in air", "taking a deep breath"],
    clinical: ["nasal inhalation expanding", "taking a deep breath"],
  }),

  create_speaking_rule(/\bspatial\s+disturbance(s)?\b/gi, {
    casual: ["movement in the air", "shattering silence", "sudden ripple"],
    lyrical: ["a sudden pulse through the room", "a sharp break in the atmosphere"],
    primal: ["hard shockwave", "sudden rattle"],
    clinical: ["environmental perturbation", "atmospheric pressure shift"],
  }),

  create_speaking_rule(/\bproper\s+madness\b/gi, {
    casual: ["pure chaos", "complete insanity", "reckless risk"],
    lyrical: ["unfiltered delirium", "a descent into chaos"],
    primal: ["raw insanity", "straight-up crazy"],
    clinical: ["extreme cognitive disorganization", "severe irrationality"],
  }),

  create_speaking_rule(/\bsquelch(ing|ed)?\b/gi, {
    casual: ["squishing", "sloshing", "churning underfoot"],
    lyrical: ["sloshing heavily through liquid", "yielding wetly underfoot"],
    primal: ["squishing loudly", "splashing through muck"],
    clinical: ["displacing fluid saturated media", "yielding wetly under pressure"],
  }),

  create_speaking_rule(/\bforce\s+of\s+a\s+physical\s+blow\b/gi, {
    casual: ["sudden impact", "hard realization", "heavy hit"],
    lyrical: ["a shock that landed like a physical weight", "an impact that rattled the frame"],
    primal: ["hard hit", "punch to the gut"],
    clinical: ["significant psychological impact", "abrupt cognitive disruption"],
  }),

  create_speaking_rule(/\btracing lazy circles\b/gi, {
    casual: ["drawing slow circles", "moving his fingers in loops", "tracing idle shapes"],
    lyrical: ["drawing slow, unhurried circles against his skin", "letting his fingers wander in loose, idle loops"],
    primal: ["rubbing slow, aimless circles", "dragging his fingers in slow loops"],
    clinical: ["moving in slow circular patterns", "tracing repetitive motions"],
  }),

  create_speaking_rule(/\b(?:thumbs?\s+)?rubb(?:ed|ing|s)?\s+(?:small\s+|gentle\s+|idle\s+|lazy\s+)?circles\s+(?:against|on|over|into)\b/gi, {
    casual: ["moving fingers lightly across", "pressing gently against", "massaging"],
    lyrical: ["tracing soft loops over", "letting the touch wander across"],
    primal: ["rubbing against", "pressing into"],
    clinical: ["applying circular friction to", "moving across the surface of"],
  }),

  create_speaking_rule(/\btrac(?:ed|ing|es|e)\s+the\s+line\s+of\s+(?:his|her|their|the)\s+collarbone\b/gi, {
    casual: ["looking down toward the neck", "glancing toward the throat", "looking over them"],
    lyrical: ["letting the gaze drift down the throat", "following the contour of the neck"],
    primal: ["staring down at their neck", "looking them over"],
    clinical: ["directing gaze along the clavicle", "observing the upper torso"],
  }),

  create_speaking_rule(/\b(?:like\s+a\s+)?trapped\s+bird\b/gi, {
    casual: ["wildly", "hard and fast", "without rhythm"],
    lyrical: ["like something seeking escape", "in erratic, frantic beats"],
    primal: ["slamming hard", "hammering violently"],
    clinical: ["arrhythmically", "with rapid irregular contractions"],
  }),

  create_speaking_rule(/\b(?:the\s+)?air\s+(?:was|is|grew|became|hung)\s+(?:thick|heavy)\s+with\b/gi, {
    casual: ["the room carried", "the space was filled with", "there was a lot of"],
    lyrical: ["the atmosphere was laden with", "the silence carried the weight of"],
    primal: ["the place reeked of", "the air was packed with"],
    clinical: ["the environment contained high concentrations of", "the atmosphere held noticeable"],
  }),

  create_speaking_rule(/\bthe\s+air\s+thicken(?:ed|ing|s)?\b/gi, {
    casual: ["the room grew quiet", "the tension rose", "things went still"],
    lyrical: ["silence settled heavily over the room", "the atmosphere tightened"],
    primal: ["the tension spiked", "the room locked up tight"],
    clinical: ["ambient tension increased", "environmental stillness deepened"],
  }),

  create_speaking_rule(/\ba\s+genuine\s+sound\b/gi, {
    casual: ["a real laugh", "sounded honest", "without pretense"],
    lyrical: ["a sound warm with unforced ease", "a clear, unfeigned note"],
    primal: ["a real laugh", "actually sounded real"],
    clinical: ["an unforced vocalization", "an authentic acoustic response"],
  }),

  create_speaking_rule(/\bfor\s+the\s+first\s+time\s+in\s+(?:his|her|their|my)\s+life\b/gi, {
    casual: ["finally", "suddenly", "for once"],
    lyrical: ["as if waking for the first time", "with sudden, unaccustomed clarity"],
    primal: ["for once in a damn long time", "finally"],
    clinical: ["for the first recorded instance", "unprecedentedly"],
  }),
];

// ============================================================================
// 7. Consolidated Speaking Style Rules Registry & Registration
// ============================================================================

export const SPEAKING_STYLE_RULES = [...VOCAL_RULES, ...SOUND_RULES, ...SENSORY_RULES, ...METAPHOR_RULES, ...COMMUNITY_RULES];

// Dynamically register canonical rules with the styles detox engine
register_speaking_rules(SPEAKING_STYLE_RULES);

// ============================================================================
// 8. Canonical Taxonomy & Validation
// ============================================================================

export const SPEAKING_STYLES = Object.freeze(["casual", "lyrical", "primal", "clinical"]);
export const VALID_SPEAKING_STYLES = new Set(SPEAKING_STYLES);

/**
 * Validates whether a given candidate string is a supported speaking style.
 *
 * @param {unknown} candidate_style - The style value to test.
 * @returns {boolean} True if the value is one of the 4 canonical speaking styles.
 */
export function is_valid_speaking_style(candidate_style) {
  return typeof candidate_style === "string" && VALID_SPEAKING_STYLES.has(candidate_style);
}

/**
 * ============================================================================
 * CHANGELOG:
 * - 2026-08-29: Harmonized speaking-styles.js with full Universal File Architecture,
 *   standardized section dividers, anti-abbreviation parameter compliance, and
 *   clean downward import grouping.
 * ============================================================================
 */
