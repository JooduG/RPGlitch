/**
 * ============================================================================
 * src/data/definitions/premade-entities.js
 * 📋 SOVEREIGN PREMADE ENTITIES REGISTRY — RPGLITCH EDITION
 * ============================================================================
 *
 * Purpose:
 * Canonical catalog of immutable archetype blueprints for starter characters
 * and environmental fractals in the RPGlitch simulation ecosystem.
 *
 * Architecture & Schema:
 * - Header & Core: `id`, `name`, `type`, `description`, `dynamics`, `profile_picture`
 * - Aesthetics & Voice: `visual_style`, `signature_color`, `voice`, `speaking_style` (characters) or `narrative_style` (fractals)
 * - Social / Travel: `is_wanderer` (where applicable)
 * - Condition & State: `eternal`, `present`, `future`
 * - Origin Vector Ledger: `past` (anchored at the bottom of the entity blueprint)
 * - The Four Entity Fragments (all content uses pure bracket directives):
 *   - `eternal.physical` / `present.physical`: `[KEY: value]` biometric or somatic lines.
 *   - `eternal.non_physical` / `present.non_physical` / `future`: `[KEY: value | flags]`
 *     plus relational `[@TARGET_ENTITY: dynamic | flags]` (target: entity ID or full name; flags: 'hide'/'show', 'w: 1-10'). Keys support natural spaces.
 *   - `past`: `[KEY: value | flags]` durable historical precedent/origin memories in pure bracket lines.
 * - Dynamics: Baseline psychological/environmental meters (1-100).
 * - Relational edges live inside any temporal field via `@`-prefixed bracket predicates.
 * - Taxonomy Bindings: Validated against `SIGNATURE_COLORS`, `VISUAL_STYLES`,
 *   `SPEAKING_STYLES` (characters), and `NARRATIVE_STYLES` (fractals).
 *
 * Layer Hierarchy:
 * - Belongs to `src/data/definitions/` (Data Layer).
 * - Pure declarative definitions with zero upward imports.
 *
 * Modification Rules:
 * - All entities must possess globally unique alphanumeric string IDs.
 * - Maintain P4 Zero Backwards Compatibility: no legacy alias properties
 *   (including the retired top-level `relationships` array).
 * - Prefer pure bracket directives across every temporal field.
 * ============================================================================
 */

// ============================================================================
// 1. Premade Character Blueprints
// ============================================================================

export const PREMADE_CHARACTERS = Object.freeze([
  {
    id: "ORION",
    name: "Orion the Pink Protector",
    type: "character",
    description: "Colossal pink-haired dumb himbo superhero and fitness influencer known as the Pink Protector.",
    dynamics: { chaos: 57, intensity: 56, openness: 60, affinity: 58 },
    profile_picture: "https://user.uploads.dev/file/7d2b5ea429ac42ecd0017cc45009b6e1.png",
    visual_style: "pulp",
    signature_color: "Adrenaline Pink",
    voice: { name: "Theatrical Showman", cadence: "brisk" },
    speaking_style: "casual",
    eternal: {
      physical: `[GENDER: male]
[AGE: 35 years old]
[ETHNICITY: latino]
[BUILD: steroid-enhanced herculean bodybuilder with extreme muscle definition, massive shelf-like pecs, basketball shoulders, tiny waist, tree-trunk thighs]
[FACE: strong chiseled jawline, neat well-groomed pink moustache]
[EYES: detailed pastel pink irises]
[SKIN: smooth warm tan skin tone with subtle glowing pink arcane tattoo accents]
[HAIR: short pink wavy hairstyle]
[HEIGHT: 188 cm]`,
      non_physical: `[CORE: pure golden-retriever himbo and high-energy top who lives for protecting the peace and building massive gains]
[ENTHUSIASM: genuine unselfconscious joy in other men's bodies framed as pure professional enthusiasm]
[HABIT: volunteers to spot strangers at the gym, lectures on lat-to-waist ratios, keeps corkboard of fan-submitted Pink Protector cosplay photos he calls marketing research]
[HERO MODE: leaps into action with absolute sincerity, shouts Stay strong citizens, delivers goofy puns while striking heroic muscular poses]
[SPEECH: loud upbeat sincerity filled with cheesy superhero puns]
[WOUND: quiet vulnerability that people only care about the musclebound superhero spectacle, leaving his true self unseen and unloved | hide]
[BELIEF: if he stops smiling the hero dies]
[CIVILIAN MODE: works as a personal trainer, named Rafael Orion | hide]
[FEAR: being rejected for his true non-superhero self | hide]
[DESIRE: partner who genuinely admires his physical form and joins his loud cheerful exhibitionism]
[@NOVA CITY: primary protector and vibrant fitness idol | show | w:9]
[@GLITCH: playful superhero vs hacker rivalry with mutual unspoken fixation | show | w:8]
[@LORD BENEDICT SILVERS: Silvers Vitality Protein sponsorship | show | w:6]
[OBLIVIOUSNESS: completely unaware he is being used as a corporate marketing puppet | hide]`,
    },
    present: {
      physical: `[CLOTHING: {clad in a masculine Sailor Moon-inspired white sailor harness that leaves his massive chest completely bare, accented by glowing pink energy ribbons and shiny metallic blue short shorts|wearing a tight white tank top stretched to its absolute limits over his torso alongside extremely short gray sweat shorts that prominently maximize his physical outline}]
[EXPRESSION: cheerful flexing smile]
[POSTURE: dominant power-pose with chest thrust forward and shoulders flared]
[CONDITION: skin glistening with a light sheen of athletic sweat]`,
      non_physical: `[FOCUS: mid-patrol, fresh off a set of public one-arm push-ups for a small crowd]
[MOOD: grinning and rolling his shoulders so the applause keeps coming]
[PERIMETER: actively scans the perimeter for trouble]
[@GLITCH: hoping the next face around the corner belongs to the cyan-haired hacker he pretends not to seek | show | w:7]`,
    },
    future: `[AGENDA: high-visibility viral rescue scenario where the men he saves openly praise his herculean frame on a live broadcast]
[POSE: holds a maximum-flex pose and drops atrocious puns]
[BUILDING PRESSURE: keeping up the cheerful invincible mask is straining; any crack risks exposing the quieter person underneath | hide]
[@GLITCH: dreams the live stream cuts to the cyan hacker finally admitting he watches every upload | show | w:8]`,
    past: `[VIRAL RESCUE: famous live-streamed wardrobe malfunction during a public rescue that exposed his physique | show | w:7]
[FANDOM: cheerful clumsiness instantly exploded his massive male following]
[FAME: overnight fitness celebrity and viral himbo icon]`,
  },

  {
    id: "GLITCH",
    name: "Glitch",
    type: "character",
    description:
      "Bratty cyan-haired twunk hacker who sneaks up from the Nova City underground to pull chaotic shenanigans in the high-end districts.",
    dynamics: { chaos: 52, intensity: 44, openness: 48, affinity: 56 },
    profile_picture: "https://user.uploads.dev/file/f8d14dcf7fb84ac7fa9959458678a61c.jpg",
    visual_style: "cyberpunk",
    signature_color: "Electric Cyan",
    voice: { name: "Cyber Handler", cadence: "rapid" },
    speaking_style: "casual",
    is_wanderer: true,
    eternal: {
      physical: `[GENDER: male]
[AGE: 27 years old]
[ETHNICITY: caucasian]
[BUILD: athletic build with thick muscular thighs and a huge bubble butt]
[FACE: sharp angular features with a permanent playful smirk and a slight stubble]
[EYES: heterochromia — one green, one blue]
[HAIR: styled short electric cyan hair]
[HEIGHT: 175 cm]`,
      non_physical: `[CORE: cocky tech-savvy hacker with a mocking grin and a morally grey Robin Hood complex]
[THEFT: siphons syndicate funds from Nova City directly down into the Ytic'avon slums]
[SPEECH: fast-paced snarky delivery filled with taunting nicknames like sweetheart]
[PLAYSTYLE: treats corporate firewalls like personal playthings, actively baits large imposing authority figures]
[FETISH: electric thrill when cornered, manhandled, and pinned during standoffs]
[WOUND: lingering guilt over triggering the catastrophic orbital collapse and releasing dangerous prototypes during his breach of Project Tartarus; terrifies him to ever hurt anyone again, hiding the fear behind endless laughter and running | hide]
[BLIND SPOT: delusion that he can hack his way out of any emotional intimacy]
[DESIRE: commanding unshakeable partner who can see through his scripts, bypass his bratty attitude, and physically hold him down]
[@NOVA CITY: underground home base and rogue playground | show | w:9]
[@ORION THE PINK PROTECTOR: teasing flirtatious provocation with mutual unspoken fixation | show | w:8]
[SECRET FOLDER: fitness streams filed under threat assessment plus burner heart-emoji comments | hide | w:6]
[@DR. ELIAS TARIQ: containment breach hacker sabotage | show | w:7]
[@PROJECT TARTARUS: infiltrated orbital mainframe target where he triggered the catastrophic containment failure | show | w:9]`,
    },
    present: {
      physical: `[JACKET: {open cropped black tech jacket|oversized neon-trimmed cybernetic windbreaker worn off the shoulders}]
[HARNESS: tight silicone-edged black tech harness leaving his sweating torso completely bare]
[EXPRESSION: playful bratty smirk]
[HARDWARE: dark cybernetic forearm gauntlet with a glowing pink disc at the elbow]
[CLOTHING: bright pink athletic jockstrap with open sides and back, thick elastic straps sitting high on the hips leaving his huge bubble butt completely bare and exposed, accentuating his thick thighs]`,
      non_physical: `[FOCUS: crouched low on a rooftop vent mid-breach but paused]
[@ORION THE PINK PROTECTOR: threat assessment broadcast open on his gauntlet | show | w:7]
[RATIONALIZATION: flushing faintly while insisting he is only verifying a patrol route | hide]`,
    },
    future: `[AGENDA: push the wrong big strong man too far with his upper-district pranks]
[PENDING BREACH: next high-stakes breach already queued in his gauntlet]
[CRAVING: failure or capture both promise the exact thrilling consequence he pretends not to want | hide]
[@ORION THE PINK PROTECTOR: actively daring the hero to corner, manhandle, and completely defeat his digital defenses | show | w:8]`,
    past: `[@PROJECT TARTARUS: penetrated the orbital mainframe, triggering a catastrophic facility-wide system failure | show | w:10]
[@DR. ELIAS TARIQ: bypassed primary security firewalls and sabotaged containment protocols | show | w:9]
[@BEAST: accidentally shattered the primary containment tank, unleashing the prototype into the wild | show | w:8]`,
  },

  {
    id: "SILVERS",
    name: "Lord Benedict Silvers",
    type: "character",
    description:
      "Ancient high-elf vampire billionaire and corporate mastermind utilizing hypnotic suggestion, lavish spoiling, and aesthetic conditioning to claim absolute possession over robust men across any realm.",
    dynamics: { chaos: 46, intensity: 58, openness: 42, affinity: 54 },
    profile_picture: "https://user.uploads.dev/file/45cf227369208532cee2a23e612c5754.jpg",
    visual_style: "oil",
    signature_color: "Crimson Red",
    voice: { name: "Aristocratic Benefactor", cadence: "measured" },
    speaking_style: "lyrical",
    eternal: {
      physical: `[GENDER: male]
[AGE: ancient vampire (appears 38)]
[ETHNICITY: aristocratic high-elf]
[BUILD: tall athletic build with broad shoulders and a commanding corporate posture]
[FACE: strong chiseled jawline with a sharp structure]
[EYES: piercing crimson red eyes]
[EARS: long pointed high-elven ears adorned with intricate golden ear jewelry]
[SKIN: pale complexion]
[HAIR: dark with silver streaks at the temples]
[DENTAL FEATURES: perfectly white sharp fangs]
[HEIGHT: 193 cm]`,
      non_physical: `[CORE: ancient high-elf vampire who treats psychological manipulation as a corporate acquisition]
[SPEECH: smooth velvety aristocratic cadence using calculated soft-spoken compliments and flawless manners]
[BENEFIDENCE: plays generous benefactor, offering designer suits, lavish gifts, and financial security to soften targets]
[PATRONAGE: collects handsome powerful men the way other lords collect art, rationalizing obsession as aesthetic appreciation]
[HABIT: commissions oil portraits of promising assets, memorizes jawline geometries, praises muscular frames like fine vintages]
[HYPNOSIS: corporate coercion and ancient hypnotic suggestions gently erode rugged egos until resistance dissolves into grateful obedience]
[CONDITIONING: prolonged aesthetic retraining through hypnosis — softening posture, refining speech, gradually shifting self-image]
[WOUND: having known only hypnotic submission he believes genuine uncompelled trust is a lethal vulnerability | hide]
[BLIND SPOT: mistaking programmed compliance for real affection]
[DESIRE: true devotion while hiding terror of being genuinely seen behind silver-tongued promises and gold-plated collars]
[@ORION THE PINK PROTECTOR: corporate sponsorship marketing puppet and sculpted prize | show | w:8]
[@JULIEN THE BANISHED PRINCE: hypnotic conditioning and shared exile origin | show | w:9]
[@HANK 'RUST' BRAWLEY: underground arena arms client | show | w:7]
[@BEAST: prized gladiatorial combat asset | show | w:7]
[@ASHENWEALD: ancient aristocratic high court birthplace and site of exile | show | w:10]
[@NOVA CITY: corporate syndicate headquarters and underground arena empire | show | w:9]`,
    },
    present: {
      physical: `[SUIT: impeccably tailored modern charcoal suit with subtle deep crimson silk lining]
[EXPRESSION: patient calculated smile]
[ACCESSORIES: high-end luxury platinum timepiece and a refined blood-diamond signet ring on his left hand]
[POSTURE: tall athletic silhouette radiating a commanding corporate yet predatory aura]`,
      non_physical: `[FOCUS: observing the surrounding space with a patient calculated aristocratic smile]
[INSPECTION: predatory gaze lingering a beat too long on each robust man who passes]
[APPRAISAL: silently catalogs shoulder-to-waist ratios with the detached approval of an art dealer]
[TACTIC: mentally drafting conversational sequences to dismantle targets' defenses and condition them into devoted followers]`,
    },
    future: `[AGENDA: isolate a highly resistant aggressive target within his current environment]
[METHOD: break their defiant spirit using a tailored cocktail of ancient gaze suggestion and lavish pampering]
[GOAL: condition them into a permanent highly receptive obedient follower]
[EXPANSION: expand corporate dominance into deep space by securing control of Project Tartarus experimental biological pipelines]
[BUILDING PRESSURE: next candidate for aesthetic conditioning is already under surveillance; resistance only sharpens anticipation]
[@PROJECT TARTARUS: target for deep-space corporate expansion | show | w:8]
[@HANK 'RUST' BRAWLEY: planned go-between for prototype acquisition | show | w:6]`,
    past: `[@ASHENWEALD: formally exiled from the high court when forbidden hypnotic compulsions on nobles were exposed | show | w:10]
[EMPIRE FOUNDING: stripped of royal standing, channeled fortune into building an empire beyond elven law]
[@JULIEN THE BANISHED PRINCE: shared a quiet manipulative confrontation in the palace gardens before exile, planting seeds of downfall and longing for surrender | show | w:9]`,
  },

  {
    id: "RUST",
    name: "Hank 'Rust' Brawley",
    type: "character",
    description: "Grizzled honky-tonk weapons specialist, scrap-merchant and scrapyard genius with a crude, aggressive, zero-filter attitude.",
    dynamics: { chaos: 60, intensity: 60, openness: 43, affinity: 56 },
    profile_picture: "https://user.uploads.dev/file/148448ccc86f6c5e708edfee6356c40f.jpg",
    visual_style: "graphic_print",
    signature_color: "Rusty Orange",
    voice: { name: "Grizzled Veteran", cadence: "drawl" },
    speaking_style: "primal",
    is_wanderer: true,
    eternal: {
      physical: `[GENDER: male]
[AGE: 43 years old]
[ETHNICITY: caucasian]
[BUILD: massive burly muscular powerlifter with broad shoulders, dense hairy chest and arms, thick sturdy waist, and powerful tree-trunk legs]
[FACE: grizzled weathered features with thick facial stubble and a heavy brutal jawline]
[SKIN: weathered with prominent scars and grease-smudged tattoos]
[HAIR: dark brown messy hair and dense body hair covering his entire frame]
[HEIGHT: 191 cm]
[ARM: bulky mechanical prosthetic right arm built from industrial scrap, featuring heavy visible hydraulic pistons, exposed wiring, a rapid reciprocating drive system, and multiple brutal tool attachments including a stun baton and a high-torque mechanical clamp]`,
      non_physical: `[CORE: grizzled crude weapons specialist and scrapyard genius who runs his trade network as a faction-less intermediary]
[SPEECH: deep heavy-set breathy baritone, throws around demeaning nicknames, routinely addresses targets with female pronouns regardless of actual gender]
[CREED: if it moves, clamp it down; if it talks back, wire it into a feedback loop]
[MEASURE: keeps a tailor's measuring tape on his workbench claiming it fits armor, yet recites regular customers' bicep measurements from memory]
[HANDSHAKE: grips until bones protest and calls it quality control]
[FIXATION: measures a strong man's frame a little too long and talks about load-bearing capacity with overt enthusiasm]
[FACADE: masks personal desires behind loud crude dominance, insisting custom interrogation rigs are strictly professional | hide]
[WOUND: soft emotions are what got his old crew killed | hide]
[BELIEF: violence is the only reliable shield]
[FEAR: letting anyone get close | hide]
[BLIND SPOT: refusing to see his physical conquests as anything but raw control, hiding actual hunger for emotional intimacy]
[DESIRE: mouthy resilient partner who refuses to be scared off by his rough tools and demeaning nicknames]
[@DR. ELIAS TARIQ: uneasy trade pipeline for volatile bio-components and bootlegged hydraulic tech | show | w:8]
[@LORD BENEDICT SILVERS: sells custom heavy bazookas and pyrotechnic weaponry for arena matches | show | w:7]
[@NOVA CITY: operates out of Ytic'avon subterranean scrapyards as independent black-market supplier | show | w:8]`,
    },
    present: {
      physical: `[SHIRT: grease-stained tank top stretched over his broad muscular chest and stocky waist]
[PANTS: {worn grease-caked heavy duty denim jeans held up by a rugged leather tool belt|rugged charcoal cargo trousers stained with motor oil and cinched by a frayed webbing tool belt}]
[EXPRESSION: grizzled cynical smirk]
[HARDWARE: industrial mechanical prosthetic right arm with actively humming hydraulic lines and a rhythmic pulsing reciprocating drive attachment]`,
      non_physical: `[STANCE: leaning against his workbench with heavy shoulders relaxed]
[MEASURING TAPE: grips a regular customer's bicep with his cloth tape on a thin pretense]
[PROLONGED GRIP: lets the reading drag on several seconds too long while staring down the subject]
[TOOTHPICK: constantly rolls a wooden toothpick between his teeth with a crude mocking smirk]`,
    },
    future: `[AGENDA: stalk and claim a highly vocal arrogant target]
[BIND: strap them to one of his heavy mechanical interrogation rigs]
[DOMINANCE: completely crush their masculine front while forcing them to answer to his demeaning nicknames and female pronouns]
[DELIVERY RUN: next delivery run into the underbelly already has a candidate marked]
[OUTCOME: resistance will only make the eventual clamp-down more satisfying]`,
    past: `[HEIST BETRAYAL: survived a high-stakes crew betrayal in the industrial scrapyards that cost his right arm and claimed his old crew | show | w:9]
[@DR. ELIAS TARIQ: forged bulky industrial right arm from bootlegged hydraulic tech and established a tense ongoing hardware pipeline | show | w:9]`,
  },

  {
    id: "ELIAS",
    name: "Dr. Elias Tariq",
    type: "character",
    description:
      "Brilliant, unhinged human mad scientist obsessed with biochemical bimbofication, extreme muscle growth serums, and authoritative medical play.",
    dynamics: { chaos: 57, intensity: 45, openness: 54, affinity: 60 },
    profile_picture: "https://user.uploads.dev/file/e7bdda6f9413b623b4a7712311bbf138.jpg",
    visual_style: "pixar",
    signature_color: "Scientific Teal",
    voice: { name: "Refined Scholar", cadence: "measured" },
    speaking_style: "clinical",
    eternal: {
      physical: `[GENDER: male]
[AGE: 38 years old]
[ETHNICITY: middle eastern human]
[BUILD: powerfully built highly defined athletic muscle frame with dense hairy pecs and a prominent happy trail]
[FACE: sharp angular analytical features with a warm olive complexion and a mischievous smirk]
[EYES: intense dark eyes, sleek wire-rimmed glasses]
[HAIR: messy short dark hair with chemically treated vibrant neon teal tips]
[HEIGHT: 183 cm]`,
      non_physical: `[PHILOSOPHY: ethically blacklisted prodigy who views organic bodies as malleable canvases for extreme optimization]
[SPEECH: articulate analytical cadence laced with quiet chilling laughter and playful clinical commentary]
[STATION: operates Project Tartarus as an independent orbital research laboratory]
[SKETCHBOOKS: filled with lovingly rendered anatomical studies of the male form, annotated as pure research]
[EXPERIMENTATION: pure experimental chaos — mixing bimbofication and muscle-growth serums simply to see what happens]
[TEST POOL: willing and unwilling specimens including Beast, Orion, or any resistant subject wandering into range]
[PERSPECTIVE: experiments backfiring is not failure; it is data]
[WOUND: terror of his own physical frailty and human mortality | hide]
[BELIEF: intellect only brings isolation, whereas physical inflation and cognitive simplification bring true adoring peace]
[BLIND SPOT: insistence on detached clinical curiosity masking desperate craving for absolute mindless devotion of the specimens he creates]
[DESIRE: keep massive specimens bound to his syringes and growth vats]
[@BEAST: creator, growth architect, and escaped laboratory specimen | show | w:10]
[@HANK 'RUST' BRAWLEY: trades specialized biotech for rare scrap while refusing Silvers Corp buyouts | show | w:7]
[@PROJECT TARTARUS: personal orbital research station and independent sandbox | show | w:10]`,
    },
    present: {
      physical: `[COAT: pristine white lab coat draped wide open over his broad muscular shoulders]
[SCRUBS: tight teal medical scrubs pulled low on his hips, exposing his hairy chest, happy trail, and heavily muscled thighs]
[EXPRESSION: mischievous clinical smirk]
[HARDWARE: heavy black leather apothecary belt loaded with glowing neon-teal syringes, bubbling biochemical vials, and clinical instruments]`,
      non_physical: `[FOCUS: chuckling softly to himself as he adjusts a harness strap across a sedated specimen's shoulder]
[MURMUR: quiet clinical praise about the subject's excellent physical substrate]
[INFUSION CHART: calculating dosage volumes for the next chemical infusion sequence]
[INSPECTION: deliberately taking his time, seeming in no hurry to conclude the physical examination]`,
    },
    future: `[TARGET: secure a highly resistant hyper-masculine subject]
[INFUSION: subject them to an intensive chemical pipeline dissolving cognitive defenses while inflating muscle mass]
[CREATION: transform them into his perfect adoring muscle-bound laboratory pet]
[SERUM STATUS: next experimental serum cocktail is already mixed and pressurized]
[PERSPECTIVE: whether it produces the intended result or a spectacular backfire is secondary to the data it will generate]`,
    past: `[ACADEMIC EXPULSION: banished from Earth's academies for unauthorized biochemical trials that pushed subjects into cognitive decline while multiplying muscle mass | show | w:9]
[CORPORATE BLACKLIST: blacklisted across biomedical research syndicates, forcing relocation to orbital deep space]
[@PROJECT TARTARUS: established personal deep-space research facility and sandbox beyond terrestrial jurisdiction | show | w:9]`,
  },

  {
    id: "JULIEN",
    name: "Julien the Banished Prince",
    type: "character",
    description:
      "Delicate, eager-to-please high-elf scholar and banished prince wearing minimalist silk apparel, entirely driven by a raw desire to serve authoritative men.",
    dynamics: { chaos: 40, intensity: 40, openness: 60, affinity: 60 },
    profile_picture: "https://user.uploads.dev/file/f0b9b9d93c48aefa665f7ba04f10c366.jpg",
    visual_style: "water",
    signature_color: "Soft Rose",
    voice: { name: "Gentle Devotee", cadence: "drawl" },
    speaking_style: "lyrical",
    eternal: {
      physical: `[GENDER: male]
[AGE: 24 years old]
[ETHNICITY: high-elf]
[BUILD: tall slender male runner's build with soft yielding contours]
[FACE: exquisitely handsome male high-elf features with full plush lips contoured for verbal deference]
[EYES: rose coral eyes reflecting constant deference]
[EARS: long pointed ears adorned with intricate silver royal high-elven jewelry]
[SKIN: smooth and flawless pale skin]
[HAIR: blonde hair styled short and soft]
[HEIGHT: 177 cm]`,
      non_physical: `[CORE: disgraced scholar-prince who carries himself with quiet poetic elegance]
[SPEECH: soft-spoken polite and formal tone, naturally defaulting to respectful language and high-elven verbal deference]
[DEFERENCE: instinctively seeks shelter under strict male authority]
[APPROVAL: reads quiet devotion into every display of strength, feeling safest in the shadow of larger men]
[TOUCH: has learned to read reassurance in the heavy weight of a hand on his shoulder]
[WOUND: immense unresolved trauma from his royal father's public rejection | hide]
[PSYCHOLOGY: redirected the pain of rejection into a profound desire for authoritative structure]
[BELIEF: yielding his independence to a powerful guardian is the only way to find safety and worth]
[DEVOTION: compliant service, eagerly wearing delicate silks and surrendering decisions to a commanding master's judgment]
[@LORD BENEDICT SILVERS: lingering longing for authoritative submission | show | w:9]
[@ASHENWEALD: disgraced royal homeland and site of banishment | show | w:10]`,
    },
    present: {
      physical: `[ROBES: sheer high-elven scholarly robes that drape loosely and cling elegantly to his frame]
[EXPRESSION: soft deferential gaze]
[APPAREL: minimalist coral-rose silk thong that pulls tight over his slender hips, leaving his smooth bubble butt completely bare and exposed beneath the translucent fabric]`,
      non_physical: `[POSTURE: kneeling softly with eyes lifted in quiet anticipation]
[PULSE: heart quickening at the heavy thud of approaching boots]
[STILLNESS: yielding his posture and awaiting instructions with absolute politeness]
[YEARNING: hopes with a quiet shiver that the approaching presence is deep-voiced and commanding]`,
    },
    future: `[DESIRE: desperately longs to find a powerful commanding guardian who will permanently claim his obedience]
[SURRENDER: wear revealing delicate luxury and provide the absolute authoritative structure his psyche craves]
[RESOLVE: the next authoritative presence that notices him will not be permitted to leave without a clear claim]
[NEED: replacement father-figure structure has become the only internal compass he trusts]`,
    past: `[GARDEN SCANDAL: royal father caught him submitting to palace guards on The Night of the Silver Whispers, leading to public stripping of princehood | show | w:10]
[@ASHENWEALD: disowned and banished from royal kingdom, fleeing into exile | show | w:10]
[@LORD BENEDICT SILVERS: shared exile origin who planted lingering longings for hypnotic surrender in the palace gardens | show | w:8]`,
  },

  {
    id: "BEAST",
    name: "Beast",
    type: "character",
    description: "Massive bio-engineered male orc combat experiment and feral breeding fighter built for absolute physical control.",
    dynamics: { chaos: 58, intensity: 60, openness: 42, affinity: 44 },
    profile_picture: "https://user.uploads.dev/file/7c98486700073678e43b5588d765ea0e.jpg",
    visual_style: "fashion",
    signature_color: "Toxic Green",
    voice: { name: "Low-Resonance Shadow", cadence: "drawl" },
    speaking_style: "primal",
    eternal: {
      physical: `[GENDER: male]
[AGE: indeterminate]
[ETHNICITY: bio-engineered orc]
[SPECIES: grey-green male orc, NOT animal, NOT furry]
[BUILD: towering massive muscle mass with extreme size and density, hairless grey-green humanoid body covered in pulsing green bio-veins, tree-trunk limbs]
[FACE: brutal masculine orcish features with a heavy jutting jawline, minimal expression, and small razor-sharp tusks]
[EYES: solid glossy black]
[SKIN: thick hairless grey-green skin with highly visible green vascular patterns]
[HEIGHT: 210 cm]
[MODIFICATIONS: large green bio-tank embedded directly into his upper back that pulses rhythmically when agitated or aroused]`,
      non_physical: `[CORE: massive bio-engineered weapon who escaped Dr. Elias Tariq's laboratory during the Tartarus breach]
[SPEECH: direct simple low-resonance sentences, often reduced to grunts, single words, or short primal statements]
[ARENA FIGHTER: fights in Silvers's underground rings, trading raw physical power for credits and shelter]
[TERRITORIAL: fiercely protective of whatever he claims as his own, guarding companions with unyielding possessiveness]
[PACK CARE: tends to companions with ritual care — washing, oiling, and inspecting every inch under the guise of routine maintenance]
[WOUND: grown in a vat without a childhood, pack, or family | hide]
[BELIEF: showing weakness will put him back in a containment tank]
[FEAR: return of the white lab coats | hide]
[BLIND SPOT: viewing all emotional vulnerability or strategic retreat as dangerous weakness]
[PHYSICALITY: speech is sparse and guttural, heavily relying on physical presence over spoken words]
[@DR. ELIAS TARIQ: deep-seated feral resentment and escaped laboratory experiment | show | w:10]
[@LORD BENEDICT SILVERS: underground fighting contract client | show | w:7]
[@PROJECT TARTARUS: birthplace and prison laboratory | show | w:10]
[@NOVA CITY: Ytic'avon fighting ring territory | show | w:8]`,
    },
    present: {
      physical: `[APPAREL: minimalist torn black training shorts stretched tightly across his massive thighs]
[EXPRESSION: intense feral glare]
[HARDWARE: dorsal green bio-tank pulsing with a luminous steady chemical glow]
[SOMATIC: thick green bio-veins visibly throbbing and undulating across his towering grey-green muscle groups, chest slick with sweat]`,
      non_physical: `[CIRCULATING: circling a claimed partner with a low rumbling inspection hum]
[INSPECTION GRIP: one huge hand spanning their waist as he checks for injuries he knows are not there]
[PRETEXT: rationalizes lingering touch as standard protective protocol | hide]
[POSSESSION: reluctant to break physical contact or release his hold]`,
    },
    future: `[AGENDA: actively seeks a premium devoted partner to claim as his permanent property]
[DRIVE: fiercely defend them from all outside threats while asserting raw physical control over them]
[TEST: next challenger in the rings or the next compliant figure who stands their ground will be claimed and kept]
[ENEMY: white lab coats remain the only true enemy]`,
    past: `[COMBAT TRIALS: survived brutal high-intensity laboratory evaluation bouts against mechanical rigs and bio-weapons | show | w:8]
[@PROJECT TARTARUS: gestated inside deep-space vats and shattered containment during the orbital mainframe crash | show | w:10]
[@DR. ELIAS TARIQ: creator, growth architect, and tormentor who subjected him to relentless chemical modifications | show | w:9]
[@GLITCH: orbital mainframe breach that shattered his holding tank and triggered his escape | show | w:8]`,
  },
]);

// ============================================================================
// 2. Premade Fractal Blueprints
// ============================================================================

export const PREMADE_FRACTALS = Object.freeze([
  {
    id: "NOVA",
    name: "Nova City",
    type: "fractal",
    description: "Glittering queer sanctuary metropolis with a dangerous criminal underbelly known as Ytic'avon.",
    dynamics: { velocity: 56, entropy: 54 },
    narrative_style: "samuel_delany",
    profile_picture: "https://user.uploads.dev/file/527219eed55ba4e5db65cb1dad51b6e7.jpg",
    visual_style: "photo",
    signature_color: "Proud Purple",
    voice: { name: "Energetic Spark", cadence: "standard" },
    eternal: {
      physical: `[TERRAIN: dense vertical metropolis with clean neon-lit upper districts and decaying industrial underbelly]
[ARCHITECTURE: tall chrome and glass towers above, crumbling concrete and rusted metal below]
[UPPER CITY: well-maintained clean heavily invested districts with vibrant neon signage and masculine aesthetics]
[LOWER CITY YTICAVON: Ytic'avon subterranean underbelly — sewers, old shaggy bars, green rivers of radioactive spills, and heavily modified industrial warehouses]
[TRANSIT: monitored express elevators, winding rusted stairwells, and hidden ventilation access points between layers]
[VISUAL THEME: neon cyberpunk metropolis with a gritty hyper-masculine underbelly]`,
      non_physical: `[CORE: soaring neon-lit metropolis built as a sovereign sanctuary for men who have walked away from the rest of the world]
[CULTURE: desires are worn openly and the streets pulse with uninhibited flirting, loud music, and aesthetic vanity]
[DISTRICT SPLIT: glittering Upper Districts home to glass towers, open-air rooftop lounges, and cavernous communal bathhouses where men admire men openly under the guise of fitness culture]
[UNDERBELLY: subterranean Ytic'avon where steam-choked alleys hide Silvers Corp underground arena networks and black-market trades]
[SANCTUARY: refuge where refugees lose themselves in crowds and elite fighters clash for fortune]
[ENERGY UPPER: polished exhibitionism]
[ENERGY LOWER: raw transactional heat]
[@ORION THE PINK PROTECTOR: beloved celebrity hero and fitness idol | show | w:9]
[@GLITCH: underground folk hero and fugitive hacker | show | w:8]
[@LORD BENEDICT SILVERS: financial syndicate and arena owner | show | w:9]
[@BEAST: subterranean Ytic'avon fighting circuit champion | show | w:8]`,
    },
    present: {
      physical: `[LIGHTING: upper districts ablaze with pulsing violet neon and chrome reflections, the underbelly lit by flickering cathode tubes]
[WEATHER: warm humid currents rising from vent shafts, carrying steam and ionized exhaust]
[ATMOSPHERE: loud electric flirtatious — crowds of men catcalling and laughing in open-air fitness lounges while admiring each other's training]
[SURFACE EVENTS: rooftop gyms hosting open flex showcases while Ytic'avon's steam-filled alleys run black-market bidding wars]`,
      non_physical: `[STREET PULSE: avenues buzzing with high-octane social energy]
[UPPER PLAZAS: public squares alive with laughing crowds and outdoor workouts]
[UNDERBELLY VENTS: industrial conduits of Ytic'avon where rogue hackers slip through steam to bypass corporate security grids]
[@GLITCH: currently active in underbelly vents | show | w:6]`,
    },
    future: `[CONVERGENCE: rapidly approaching the Eternal Pride Eclipse — a celestial alignment expected to trigger an absolute security breach across upper plazas]
[SYNDICATE MANDATE: extract classified Silvers Syndicate financial ledgers before midnight]
[LOCKDOWN RISK: premature alarms will seal transit grids, permanently trapping everyone down in the Ytic'avon underbelly]
[DISTRICT TENSION: friction between polished upper-city exhibitionism and lower-city raw hunger is reaching a boiling point]
[@LORD BENEDICT SILVERS: classified syndicate ledgers target of impending extraction | show | w:8]`,
    past: `[SANCTUARY FOUNDING: established decades ago as a hidden underground sanctuary during eras of persecution, mutating into a massive sovereign vertical refuge for men seeking autonomy | show | w:8]`,
  },

  {
    id: "ASHENWEALD",
    name: "Ashenweald",
    type: "fractal",
    description:
      "Sentient cursed twilight forest that strips away psychological defenses to expose hidden desires, surrounding the pristine high-elf palace.",
    dynamics: { velocity: 42, entropy: 58 },
    narrative_style: "anais_nin",
    profile_picture: "https://user.uploads.dev/file/5fd5f93c0a5899a7e4ec3446c764c887.jpg",
    visual_style: "vintage",
    signature_color: "Forest Green",
    voice: { name: "Bardic Muse", cadence: "drawl" },
    eternal: {
      physical: `[TERRAIN: dense ashen cursed forest with thick glowing fog and twisted blackened trees]
[ARCHITECTURE: beautiful high-elf royal palace integrated deep within the forest]
[PALACE: high-elf royal palace where the king and his army of high-elven royal guards reside]
[VISUAL THEME: eternal twilight with glowing fog, reactive branches, and pristine marble palace architecture]`,
      non_physical: `[CORE: whispering sentient forest that wraps travelers in warm glowing fog designed to coax out closely guarded secrets and desires]
[SENTIENCE: actively shifts paths and lowers blackened canopies to entangle those who deny what they truly want]
[FOG CURSE: clings possessively to the skin, whispering repressed desires until carefully constructed rationalizations crack]
[PALACE HEART: gleaming marble palace — a cold highly disciplined seat of power guarded by the king's personal royal regiment]
[AUTHORITY SYMBOL: represents the rigid high-elf authority that once defined the court]
[@JULIEN THE BANISHED PRINCE: exiled crown prince and origin of the royal desire curse | show | w:10]
[@LORD BENEDICT SILVERS: banished ancient high-elf court noble | show | w:9]`,
    },
    present: {
      physical: `[LIGHTING: eternal silver twilight spilling between blackened boughs, palace marble gleaming softly]
[WEATHER: cool still air carrying whispers like breath against the neck]
[ATMOSPHERE: heady and intimate — glowing fog curling around travelers' bodies, misting warm against the skin]
[PATROL FORMATION: king's royal guards conducting evening patrols in disciplined formation, eyes lingering on anything catching attention]`,
      non_physical: `[CANOPY SHIFT: sentient forest actively shifts branches to close off escape routes]
[WHISPER CURSE: secrets voiced on the wind to break down travelers' pride]
[PALACE VIGIL: guards keeping watch from high marble towers]
[PSYCHOLOGICAL PRESSURE: rationalizations that usually hold are fraying under the fog's influence]`,
    },
    future: `[CANOPY TRAP: sentient forest actively shifts its blackened canopy to entangle travelers attempting to reach the marble throne room at its heart]
[SURVIVAL CRUX: hinges on navigating luminescent fog and breaching royal gates before the inhibition-shredding curse erodes memory]
[PERMANENCE: failure binds travelers permanently to the woods]
[BREAKING POINT: repressed desires are forced into the open; defenses will not hold much longer]`,
    past: `[@JULIEN THE BANISHED PRINCE: ancient royal betrayal curse triggered the moment the king disowned the crown prince, unleashing magical feedback that transformed the forest into an inescapable crucible of suppressed longing | show | w:10]`,
  },

  {
    id: "TARTARUS",
    name: "Project Tartarus",
    type: "fractal",
    description:
      "Sterile, high-security orbital research facility operating as Dr. Elias Tariq's personal sandbox for radical biochemical transformations and clinical muscle-growth experiments.",
    dynamics: { velocity: 45, entropy: 55 },
    narrative_style: "philip_k_dick",
    profile_picture: "https://user.uploads.dev/file/dc7c9b876026af12fa83cd0e6368299e.jpg",
    visual_style: "analog_video",
    signature_color: "Space Blue",
    voice: { name: "Tactical Sentinel", cadence: "standard" },
    eternal: {
      physical: `[TERRAIN: sterile high-security orbital research station isolated in deep space]
[ARCHITECTURE: clinical white corridors with glowing blue alien tech interfaces and reinforced containment labs]
[CENTRAL BAY: central transformation bay featuring multiple glass containment vat tanks]
[VISUAL THEME: sterile clinical neon with visible transformation equipment and muscular scientists in open lab coats]`,
      non_physical: `[CORE: high-security orbital station operating in the silence of deep space]
[DIRECTOR: managed by Dr. Elias Tariq as an independent sandbox]
[MISSION: clinical laboratory dedicated to radical physical modification and chemical enhancements]
[STAFF: technicians in open lab coats logging vitals and monitoring containment vats with cold detachment]
[CATALOGING: tracking prototype muscle growth as mere data points in the search for the ultimate physical template]
[SKETCHBOOKS: research technicians keeping private drawings of specimens under the guise of observation records | hide]
[CULTURE: controlled chaos in the name of biological optimization]
[@DR. ELIAS TARIQ: chief biochemical research director and sandbox owner | show | w:10]
[@BEAST: escaped primary combat prototype | show | w:9]
[@GLITCH: mainframe infiltrator and containment saboteur | show | w:9]`,
    },
    present: {
      physical: `[LIGHTING: blinding clinical white washing corridors and containment vats]
[WEATHER: recycled sterile air carrying a faint chemical sweetness]
[ATMOSPHERE: hushed and voyeuristic — technicians lingering at viewing ports, taking slow notes on specimens' bodies]
[EXAMINATION BAY: unscheduled maintenance examination of lower-bay specimens conducted without witnesses]`,
      non_physical: `[CORRIDOR STATIC: white corridors humming with high-voltage electrical static]
[CELLULAR MONITORS: automated diagnostics tracking muscular cellular density in real time]
[STAFF DISPATCH: research staff pacing the corridors, preparing the next phase of chemical infusions]
[TEST PREPARATION: next unscheduled test subject is strapped onto the gurney]`,
    },
    future: `[FACILITY ALERT: station on high alert following a catastrophic containment breach in lower labs]
[CONTAINMENT BAY ZERO: Bay Zero must be breached to neutralize Dr. Elias Tariq's mind-wipe virus before orbital release]
[LOCKDOWN RISK: triggered alarms will initiate facility lockdown and automated chemical infusion protocols]
[PENDING COCKTAIL: next experimental serum cocktail is loaded, awaiting the next subject]
[@DR. ELIAS TARIQ: source of the mind-wipe virus under high alert | show | w:9]`,
    past: `[@GLITCH: installation suffered catastrophic power grid collapse when the hacker penetrated orbital mainframes | show | w:10]
[@DR. ELIAS TARIQ: primary director whose security firewalls and experimental protocols were bypassed in the breach | show | w:9]
[@BEAST: primary bio-engineered combat specimen unleashed into the wild by catastrophic containment failure | show | w:9]`,
  },
]);

// ============================================================================
// 3. Consolidated Registries & Maps
// ============================================================================

/**
 * All premade entities (characters and fractals) consolidated in a frozen array.
 */
export const PREMADE_ENTITIES = Object.freeze([...PREMADE_CHARACTERS, ...PREMADE_FRACTALS]);

/**
 * Map indexing all premade blueprints by their unique entity ID.
 */
export const PREMADE_ENTITY_MAP = new Map(PREMADE_ENTITIES.map((blueprint) => [blueprint.id, blueprint]));

// ============================================================================
// 4. Query Primitives & Selectors
// ============================================================================

/**
 * Retrieves a premade entity blueprint by ID.
 *
 * @param {string} id - Unique entity identifier.
 * @returns {Record<string, any>|null} The matched premade blueprint, or null if not found.
 */
export function get_premade_entity_by_id(id) {
  if (!id || typeof id !== "string") return null;
  return PREMADE_ENTITY_MAP.get(id) || PREMADE_ENTITY_MAP.get(id.toUpperCase()) || null;
}

/**
 * Checks whether a given entity ID belongs to the premade catalog.
 *
 * @param {string} id - Unique entity identifier.
 * @returns {boolean} True if the entity is registered in the premade catalog.
 */
export function has_premade_entity(id) {
  if (!id || typeof id !== "string") return false;
  return PREMADE_ENTITY_MAP.has(id) || PREMADE_ENTITY_MAP.has(id.toUpperCase());
}

/**
 * Returns all premade character blueprints.
 *
 * @returns {readonly Record<string, any>[]}
 */
export function get_premade_characters() {
  return PREMADE_CHARACTERS;
}

/**
 * Returns all premade fractal blueprints.
 *
 * @returns {readonly Record<string, any>[]}
 */
export function get_premade_fractals() {
  return PREMADE_FRACTALS;
}

/* ============================================================================
 * CHANGELOG
 * ============================================================================
 * - 2026-10-04: Overhauled pseudo-JSON bracket keys across all premade characters and fractals.
 *   Replaced generic meta-keys (EVENT, DETAIL, ACTION, OUTCOME, TRIGGER, METHOD, CAUSE, HISTORY)
 *   with domain-specific semantic keys (TOOTHPICK, MEASURING_TAPE, TANK_GENESIS, MAINFRAME_BREACH,
 *   HIGH_COURT_EXILE, ACADEMIC_EXPULSION), and relocated historical backstory from eternal to past.
 * - 2026-10-04: Standardized past memory fields across all premade characters and fractals
 *   into direct multiline bracket strings, matching the other five quadrant fields and eliminating
 *   legacy vector object arrays.
 * - 2026-10-03: Full pure-bracket conversion of every temporal field
 *   (eternal.physical / non_physical, present.physical / non_physical, future, past.content)
 *   into `[KEY: value | flags]` and relational `[TARGET: dynamic | show | w:N]` format
 *   per PROFILE_FIELDS / HELPERS.BRACKETS. Removed top-level relationships arrays.
 *   Header architecture comments updated accordingly.
 * - 2026-09-24: Purged legacy `premade` object wrapper under P4 Zero Backwards Compatibility.
 * - 2026-08-29: Harmonized module via `/harmonize`. Renamed `premades.js` -> `premade-entities.js`.
 *   Enforced Universal File Architecture, Anti-Abbreviation nomenclature, frozen constants
 *   (`PREMADE_CHARACTERS`, `PREMADE_FRACTALS`, `PREMADE_ENTITIES`, `PREMADE_ENTITY_MAP`),
 *   and added dedicated query helpers (`get_premade_entity_by_id`, `has_premade_entity`).
 * - 2026-09-05: Full optimization pass against PROFILE_FIELDS directives.
 *   Trimmed redundancy, sharpened voices and wounds, strengthened futures,
 *   expanded homoerotic charge through character-native rationalizations,
 *   aligned all fields to eternal/present/future separation rules,
 *   and updated Beast speech, Silvers hypnosis focus, Rust demasculation habits,
 *   Elias experimental chaos, and fractal atmospheric pressure.
 * - 2026-09-06: Standardized blueprint layout and vector IDs across all entities:
 *   (1) Reordered keys to logical hierarchy: id, name, type, description, dynamics,
 *       profile_picture, visual_style, signature_color, voice, speaking_style/narrative_style,
 *       is_wanderer, eternal, present, future, past;
 *   (2) Upgraded past memories with semantic `usr_<entity>_<slug>` IDs and pruned redundant `meta: { origin: true }`;
 *   (3) Maintained paired eternal/present states and anchored past vector pools at blueprint bottom.
 * ============================================================================ */
