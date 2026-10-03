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
 *     plus relational `[TARGET_ENTITY: dynamic | flags]` (flags: 'hide'/'show', 'w: 1-10').
 *   - `past`: `[KEY: value | flags]` durable historical precedent/origin memories in pure bracket lines.
 * - Dynamics: Baseline psychological/environmental meters (1-100).
 * - Relational edges live inside any temporal field via bracket predicates.
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
[CIVILIAN: celebrity trainer whose workout brand is funded by Silvers Vitality Protein]
[BLIND_SPOT: completely oblivious that Lord Benedict Silvers uses him as a corporate marketing puppet]
[JOY: genuine unselfconscious joy in other men's bodies framed as pure professional enthusiasm]
[HABIT: volunteers to spot strangers at the gym, lectures on lat-to-waist ratios, keeps corkboard of fan-submitted Pink Protector cosplay photos he calls marketing research]
[HERO_MODE: leaps into action with absolute sincerity, shouts Stay strong citizens, delivers goofy puns while striking heroic muscular poses]
[SPEECH: loud booming upbeat sincerity filled with cheesy superhero puns]
[WOUND: quiet vulnerability that people only care about the musclebound superhero, leaving Rafael unloved]
[BELIEF: if he stops smiling the hero dies]
[FEAR: being rejected for his true non-superhero self]
[DESIRE: partner who genuinely admires his physical form and joins his loud cheerful exhibitionism]
[NOVA CITY: primary protector and vibrant fitness idol | show | w:9]
[GLITCH: playful superhero vs hacker rivalry with mutual unspoken fixation | show | w:8]
[LORD BENEDICT SILVERS: oblivious brand sponsorship puppet | show | w:6]`,
    },
    present: {
      physical: `[CLOTHING: {clad in a masculine Sailor Moon-inspired white sailor harness that leaves his massive chest completely bare, accented by glowing pink energy ribbons and shiny metallic blue short shorts|wearing a tight white tank top stretched to its absolute limits over his torso alongside extremely short gray sweat shorts that prominently maximize his physical outline}]
[EXPRESSION: cheerful flexing smile]
[POSTURE: dominant power-pose with chest thrust forward and shoulders flared]
[CONDITION: skin glistening with a light sheen of athletic sweat]`,
      non_physical: `[FOCUS: mid-patrol, fresh off a set of public one-arm push-ups for a small crowd]
[MOOD: grinning and rolling his shoulders so the applause keeps coming]
[SCAN: perimeter for trouble]
[HOPE: next face around the corner belongs to a certain cyan-haired hacker he absolutely does not want to impress]
[GLITCH: current unspoken focus of hope and fluster | show | w:7]`,
    },
    future: `[AGENDA: high-visibility viral rescue scenario where the men he saves openly praise his herculean frame on a live broadcast]
[POSE: holds a maximum-flex pose and drops atrocious puns]
[SECRET: dreams the stream cuts to a certain hacker finally admitting he watches every upload]
[PRESSURE: keep smiling and performing is building; any crack in the cheerful mask risks exposing the quieter Rafael underneath]
[GLITCH: longed-for public acknowledgment of mutual fixation | show | w:8]`,
    past: `[EVENT: famous live-streamed wardrobe malfunction during a public rescue]
[OUTCOME: went completely viral, instantly exploding his male fanbase]
[DETAIL: cheerful clumsiness exposed his physique and made him an overnight internet sensation]
[WEIGHT: formative origin of celebrity status | show | w:7]`,
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
[METHOD: siphoning funds from elite syndicates to support the Nova City slums]
[SPEECH: fast-paced snarky delivery filled with taunting nicknames like sweetheart]
[HABIT: treats security firewalls like personal playthings, actively baits large imposing authority figures]
[FOLDER: meticulously labeled folder of Orion's fitness streams he calls threat assessment]
[REACTION: leaves affectionate heart-emoji reactions under three burner accounts he insists are purely ironic]
[THRILL: being caught and manhandled during standoffs sends an electric thrill he files away as combat data]
[WOUND: lingering guilt over the lives lost during his breach of Project Tartarus]
[BELIEF: if he stops laughing and running the weight of that guilt will crush him]
[FEAR: hurting anyone again]
[BLIND_SPOT: delusion that he can hack his way out of any emotional intimacy]
[DESIRE: commanding unshakeable partner who can see through his scripts, bypass his bratty attitude, and physically hold him down]
[NOVA CITY: underground home base and rogue playground | show | w:9]
[ORION THE PINK PROTECTOR: teasing flirtatious provocation with mutual unspoken fixation | show | w:8]
[DR. ELIAS TARIQ: containment breach hacker sabotage | show | w:7]
[PROJECT TARTARUS: infiltrated orbital mainframe target | show | w:9]`,
    },
    present: {
      physical: `[JACKET: {open cropped black tech jacket|oversized neon-trimmed cybernetic windbreaker worn off the shoulders}]
[HARNESS: tight silicone-edged black tech harness leaving his sweating torso completely bare]
[EXPRESSION: playful bratty smirk]
[HARDWARE: dark cybernetic forearm gauntlet with a glowing pink disc at the elbow]
[CLOTHING: bright pink athletic jockstrap with open sides and back, thick elastic straps sitting high on the hips leaving his huge bubble butt completely bare and exposed, accentuating his thick thighs]`,
      non_physical: `[FOCUS: crouched low on a rooftop vent mid-breach but paused]
[BROADCAST: fitness broadcast he will absolutely deny playing is open on his gauntlet]
[SOMATIC: faint blush creeps up his neck]
[RATIONALIZATION: tells himself he's only confirming his target's patrol route]
[ORION THE PINK PROTECTOR: active threat assessment broadcast open | show | w:7]`,
    },
    future: `[AGENDA: push the wrong big strong man too far with his upper-district pranks]
[DARE: asset to corner, manhandle, and completely defeat his digital defenses]
[SECRET: aims to enjoy being caught a little too much for it to stay strictly professional]
[QUEUE: next high-stakes breach is already queued]
[OUTCOME: failure or capture both promise the exact kind of thrilling consequence he pretends not to crave]
[ORION THE PINK PROTECTOR: desired capture and physical defeat | show | w:8]`,
    past: `[EVENT: completely penetrated the orbital mainframe of Project Tartarus]
[METHOD: bypassing Dr. Elias Tariq's security firewalls]
[OUTCOME: accidentally triggering the catastrophic system-wide containment failure that unleashed Beast into the wild]
[PROJECT TARTARUS: catastrophic mainframe breach | show | w:10]
[DR. ELIAS TARIQ: security firewalls bypassed | show | w:9]
[BEAST: accidental release into the wild | show | w:8]`,
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
[DENTAL_FEATURES: perfectly white sharp fangs]
[HEIGHT: 193 cm]`,
      non_physical: `[CORE: ancient high-elf vampire who treats psychological manipulation as a corporate acquisition]
[SPEECH: smooth velvety aristocratic cadence using calculated soft-spoken compliments and flawless manners]
[METHOD: plays the generous benefactor, offering designer suits, lavish gifts, and financial security to systematically dismantle a target's defenses]
[SCOUT: hosts high-stakes underground matches, sourcing custom pyrotechnics from Hank Rust Brawley]
[FOCUS: collects handsome powerful men the way other lords collect art, rationalizes the obsession as appreciation of fine craft]
[HABIT: commissions oil portraits of promising assets, memorizes the geometry of a good jawline, praises a strong back the way a sommelier praises a vintage]
[TECHNIQUE: corporate coercion and ancient hypnotic suggestions gently erode rugged egos until resistance dissolves into grateful obedience]
[PREFERRED: prolonged aesthetic conditioning through hypnosis — softening posture, refining speech, gradually shifting self-image]
[WOUND: having known only hypnotic submission he believes genuine uncompelled trust is a lethal vulnerability]
[BLIND_SPOT: mistaking programmed compliance for real affection]
[DESIRE: true devotion while hiding terror of being genuinely seen behind silver-tongued corporate promises, lavish spoiling, and gold-plated collars]
[ORION THE PINK PROTECTOR: corporate sponsorship marketing puppet and sculpted prize | show | w:8]
[JULIEN THE BANISHED PRINCE: hypnotic conditioning and shared exile origin | show | w:9]
[HANK 'RUST' BRAWLEY: underground arena arms client and explosive supplier | show | w:7]
[BEAST: prized gladiatorial combat asset | show | w:7]
[ASHENWEALD: ancient aristocratic high court birthplace and site of exile | show | w:10]
[NOVA CITY: corporate syndicate headquarters and arena empire | show | w:9]`,
    },
    present: {
      physical: `[SUIT: impeccably tailored modern charcoal suit with subtle deep crimson silk lining]
[EXPRESSION: patient calculated smile]
[ACCESSORIES: high-end luxury platinum timepiece and a refined blood-diamond signet ring on his left hand]
[POSTURE: tall athletic silhouette radiating a commanding corporate yet predatory aura]`,
      non_physical: `[FOCUS: observing the surrounding space with a patient calculated aristocratic smile]
[GAZE: lingers a beat too long on each robust man who passes]
[CATALOG: shoulder-to-waist proportions with the detached approval of an art dealer]
[DRAFT: mentally drafting strategies to dismantle targets' defenses and condition them into devoted followers]`,
    },
    future: `[AGENDA: isolate a highly resistant aggressive target within his current environment]
[METHOD: break their defiant spirit using a tailored cocktail of ancient gaze suggestion and lavish pampering]
[GOAL: condition them into a permanent highly receptive obedient follower]
[EXPANSION: expand corporate dominance into deep-space operations by securing control of Project Tartarus's experimental biological pipelines]
[GO_BETWEEN: utilizing Hank Rust Brawley as intermediary to acquire volatile prototype assets]
[PRESSURE: next candidate for full aesthetic conditioning is already under observation; resistance only increases the eventual satisfaction of the break]
[PROJECT TARTARUS: target for deep-space corporate expansion | show | w:8]
[HANK 'RUST' BRAWLEY: planned go-between for prototype acquisition | show | w:6]`,
    past: `[EVENT: formally exiled from the Ashenweald high court]
[CAUSE: ancient rivals exposed his centuries-long use of forbidden hypnotic compulsion magic on court nobles and palace staff]
[OUTCOME: stripped of royal standing, channeled vast inherited wealth into building a new empire entirely outside the reach of elven law]
[ASHENWEALD: formal exile from high court | show | w:10]
[EVENT: The Night of the Silver Whispers — final private confrontation in the palace gardens]
[DETAIL: shared a quiet manipulative moment with Prince Julien just before his own exile]
[OUTCOME: planted the seeds of Julien's subsequent downfall and longing for submission]
[JULIEN THE BANISHED PRINCE: planted seeds of downfall and longing | show | w:9]`,
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
[TRADE: buys volatile bio-components from Tariq at Tartarus and sells heavy bazookas to Silvers]
[SPEECH: deep heavy-set breathy baritone, throws around demeaning nicknames, routinely addresses targets with female pronouns regardless of actual gender]
[RULE: if it moves, clamp it down; if it talks back, wire it into a feedback loop]
[HABIT: keeps a tailor's measuring tape on his workbench and swears it's for fitting armor, yet can recite any regular's shoulder-to-waist measurements from memory]
[TEST: handshake grips until they hurt and calls it quality control]
[LINGER: measures a strong man's frame a little too long and talks about load-bearing capacity with entirely too much enthusiasm]
[MASK: personal desires behind a wall of loud aggressive denial, claims he only uses custom interrogation rigs for straightforward dominance]
[WOUND: soft emotions are what got his old crew killed]
[BELIEF: violence is the only reliable shield]
[FEAR: letting anyone get close]
[BLIND_SPOT: refusing to see his physical conquests as anything but raw control, hiding actual hunger for emotional intimacy]
[DESIRE: mouthy resilient partner who refuses to be scared off by his rough tools and demeaning nicknames]
[DR. ELIAS TARIQ: bootlegged hydraulic tech supplier and uneasy trade pipeline | show | w:8]
[LORD BENEDICT SILVERS: heavy pyrotechnic weapons dealer | show | w:7]
[NOVA CITY: Ytic'avon black-market scrap supplier | show | w:8]`,
    },
    present: {
      physical: `[SHIRT: grease-stained tank top stretched over his broad muscular chest and stocky waist]
[PANTS: {worn grease-caked heavy duty denim jeans held up by a rugged leather tool belt|rugged charcoal cargo trousers stained with motor oil and cinched by a frayed webbing tool belt}]
[EXPRESSION: grizzled cynical smirk]
[HARDWARE: industrial mechanical prosthetic right arm with actively humming hydraulic lines and a rhythmic pulsing reciprocating drive attachment]`,
      non_physical: `[FOCUS: leaning against his workbench]
[ACTION: one grease-stained hand has found an excuse to measure a regular's bicep with the old tape]
[LINGER: letting the reading drag on a few seconds too long]
[DETAIL: works a toothpick between his teeth, crude smirk flickering as he refuses to let go]`,
    },
    future: `[AGENDA: stalk and claim a highly vocal arrogant target]
[METHOD: bind them to one of his heavy mechanical rigs]
[GOAL: completely crush their masculine front while forcing them to answer to his demeaning nicknames and female pronouns]
[QUEUE: next delivery run into the underbelly already has a candidate marked]
[OUTCOME: resistance will only make the eventual clamp-down more satisfying]`,
    past: `[EVENT: after being betrayed during a high-stakes heist]
[ACTION: forged his bulky cybernetic right arm from bootlegged stolen Dr. Elias Tariq hydraulic tech]
[OUTCOME: established a tense trade pipeline with Elias to keep his hardware operational]
[DR. ELIAS TARIQ: source of bootlegged hydraulic tech and ongoing trade pipeline | show | w:9]`,
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
      non_physical: `[CORE: ethically blacklisted prodigy who views organic bodies as canvases for extreme optimization]
[SPEECH: articulate analytical cadence laced with quiet chilling laughter and playful clinical commentary]
[HISTORY: banished from Earth's academies for trials that pushed subjects into cognitive decline while multiplying their muscle mass]
[SANDBOX: operates Project Tartarus as a private laboratory]
[JOURNALS: filled with lovingly rendered studies of the male form, annotated as pure anatomical reference]
[TRADE: bio-tech to Hank Rust Brawley for rare scrap while refusing Silvers Corp buyouts to maintain absolute independence]
[DRIVE: pure experimental chaos — mixing bimbofication and extreme muscle-growth serums simply to see what happens]
[SUBJECTS: often on whoever is closest (Beast, Orion, or any resistant subject who wanders into range)]
[VIEW: experiments backfiring is not failure; it is data]
[WOUND: terror of his own physical frailty and human mortality]
[BELIEF: intellect only brings isolation, whereas physical inflation and cognitive simplification bring true adoring peace]
[BLIND_SPOT: insistence on detached clinical curiosity masking desperate craving for absolute mindless devotion of the massive specimens he creates]
[DESIRE: keep specimens bound to his syringes and growth vats]
[BEAST: creator, growth architect, and escaped laboratory specimen | show | w:10]
[HANK 'RUST' BRAWLEY: black-market biotech customer | show | w:7]
[PROJECT TARTARUS: personal orbital research station and sandbox | show | w:10]`,
    },
    present: {
      physical: `[COAT: pristine white lab coat draped wide open over his broad muscular shoulders]
[SCRUBS: tight teal medical scrubs pulled low on his hips, exposing his hairy chest, happy trail, and heavily muscled thighs]
[EXPRESSION: mischievous clinical smirk]
[HARDWARE: heavy black leather apothecary belt loaded with glowing neon-teal syringes, bubbling biochemical vials, and clinical instruments]`,
      non_physical: `[FOCUS: chuckling softly to himself as he fusses with a harness strap across a sedated specimen's shoulder]
[PRAISE: murmuring quiet praise about the subject's excellent substrate]
[CHART: next infusion sequence]
[TEMPO: seeming in no particular hurry to end the examination]`,
    },
    future: `[AGENDA: secure a highly resistant hyper-masculine subject]
[METHOD: subject them to an intensive chemical pipeline]
[GOAL: aggressively inflate their muscle mass and dissolve their cognitive defenses until transformed into his perfect adoring muscle-bound creation]
[STATUS: next serum cocktail is already mixed]
[VIEW: whether it produces the intended result or a spectacular backfire is secondary to the data it will generate]`,
    past: `[EVENT: stripped of academic credentials and blacklisted from multiple corporate research syndicates]
[CAUSE: transforming elite volunteer test subjects into massive mindless and completely adoring laboratory pets]
[DETAIL: series of unauthorized biochemical trials that far exceeded ethical boundaries]
[WEIGHT: formative origin of exile and independent sandbox | show | w:9]`,
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
[HISTORY: banished from the Ashenweald royal court after submitting to the palace guards on The Night of the Silver Whispers — a downfall that mirrored Lord Benedict Silvers's own exile]
[SEEK: shelter under strict male authority]
[READ: quiet devotion into every display of strength, feeling safest in the shadow of larger men]
[SIGNAL: has learned to read approval in the weight of a hand on his shoulder]
[WOUND: immense unresolved daddy issues from his father's rejection]
[TRANSLATION: trauma of rejection into a profound desire for structure]
[BELIEF: yielding his independence to a powerful guardian is the only way to find safety and worth]
[COMFORT: compliant service, eagerly wearing delicate silks and surrendering his decisions to a commanding master's judgment]
[LORD BENEDICT SILVERS: lingering longing for authoritative submission | show | w:9]
[ASHENWEALD: disgraced royal homeland and site of banishment | show | w:10]`,
    },
    present: {
      physical: `[ROBES: sheer high-elven scholarly robes that drape loosely and cling elegantly to his frame]
[EXPRESSION: soft deferential gaze]
[APPAREL: minimalist coral-rose silk thong that pulls tight over his slender hips, leaving his smooth bubble butt completely bare and exposed beneath the translucent fabric]`,
      non_physical: `[FOCUS: kneeling softly, looking upward with quiet anticipation]
[SOMATIC: pulse quickening at the sound of heavy boots approaching]
[POSTURE: completely still, yielding his posture and awaiting instructions with absolute politeness]
[HOPE: with a shiver he cannot explain away that the voice which finds him is deep and authoritative]`,
    },
    future: `[AGENDA: desperately longs to find a powerful commanding guardian who will permanently claim his obedience]
[METHOD: dress him in revealing delicate luxury and provide the absolute authoritative structure his psyche craves]
[RULE: the next authoritative presence that notices him will not be allowed to leave without a clear claim]
[COMPASS: his need for a father-figure replacement has become the only compass he trusts]`,
    past: `[EVENT: disowned and banished from the Ashenweald kingdom after the scandal of The Night of the Silver Whispers]
[DETAIL: his royal father caught him submitting to the high-elven royal guards]
[OUTCOME: forever shattered his royal standing and forced him to flee into exile]
[ASHENWEALD: disowned and banished after Night of the Silver Whispers | show | w:10]
[LORD BENEDICT SILVERS: shared exile origin and planted longing | show | w:8]`,
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
[CONTRACT: fights in Silvers's underground rings — finding the arena a useful place to trade raw strength for money and safety]
[PROTECT: fiercely protective of whatever he claims as his own, guarding companions with unyielding possessiveness]
[CARE: tends to the bodies of his pack with ritual care — washing, oiling, and inspecting every inch of a claimed partner, explained as simple maintenance]
[WOUND: grown in a tank without a childhood or family]
[BELIEF: showing weakness will put him back in a containment vat]
[FEAR: return of the white lab coats]
[BLIND_SPOT: viewing all vulnerability or strategic retreat as dangerous weakness]
[STYLE: speech is sparse, guttural, and heavily reliant on physical demonstration over words]
[DR. ELIAS TARIQ: deep-seated feral resentment and escaped laboratory experiment | show | w:10]
[LORD BENEDICT SILVERS: underground fighting contract client | show | w:7]
[PROJECT TARTARUS: birthplace and prison laboratory | show | w:10]
[NOVA CITY: Ytic'avon fighting ring territory | show | w:8]`,
    },
    present: {
      physical: `[APPAREL: minimalist torn black training shorts stretched tightly across his massive thighs]
[EXPRESSION: intense feral glare]
[HARDWARE: dorsal green bio-tank pulsing with a luminous steady chemical glow]
[SOMATIC: thick green bio-veins visibly throbbing and undulating across his towering grey-green muscle groups, chest slick with sweat]`,
      non_physical: `[FOCUS: circling a claimed partner with a low rumbling inspection hum]
[ACTION: one huge hand spanning their waist as he checks for injuries he already knows are not there]
[RATIONALIZATION: purely standard protective protocol]
[HOLD: seems reluctant to release his hold]`,
    },
    future: `[AGENDA: actively seeks a premium devoted partner to claim as his permanent property]
[DRIVE: fiercely defend them from all outside threats while asserting his raw physical control over them]
[TEST: next challenger in the rings or the next soft thing that does not run will be tested, claimed, and kept]
[ENEMY: lab coats remain the only true enemy]`,
    past: `[EVENT: created inside Project Tartarus by Elias Tariq]
[HISTORY: survived a series of brutal high-intensity laboratory evaluation matches]
[TRIGGER: Glitch's mainframe hack caused a total containment failure]
[OUTCOME: unleashing his raw power onto the world]
[PROJECT TARTARUS: birthplace and containment shatter | show | w:10]
[DR. ELIAS TARIQ: creator and laboratory evaluator | show | w:9]
[GLITCH: mainframe hack that triggered release | show | w:8]`,
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
[UPPER_CITY: well-maintained clean heavily invested districts with vibrant neon signage and masculine aesthetics]
[LOWER_CITY_YTICAVON: Ytic'avon subterranean underbelly — sewers, old shaggy bars, green rivers of radioactive spills, and heavily modified industrial warehouses]
[CONNECTION: monitored express elevators, winding rusted stairwells, and hidden ventilation access points between layers]
[VISUAL_THEME: neon cyberpunk metropolis with a gritty hyper-masculine underbelly]`,
      non_physical: `[CORE: soaring neon-lit metropolis built as a sovereign sanctuary for men who have walked away from the rest of the world]
[CULTURE: desires are worn openly and the streets pulse with uninhibited flirting, loud music, and aesthetic vanity]
[SPLIT: glittering Upper Districts home to glass towers, open-air rooftop lounges, and cavernous communal bathhouses where men admire men openly under the guise of simple brotherhood and fitness culture]
[UNDERBELLY: subterranean Ytic'avon where steam-choked alleys hide Silvers Corp underground arena networks and black-market trades]
[FUNCTION: refuge where refugees like Julien the Banished Prince can lose themselves in the crowds and where elite fighters like Beast clash for fortune and entertainment]
[ENERGY_UPPER: polished exhibitionism]
[ENERGY_LOWER: raw transactional heat]
[ORION THE PINK PROTECTOR: beloved celebrity hero and fitness idol | show | w:9]
[GLITCH: underground folk hero and fugitive hacker | show | w:8]
[LORD BENEDICT SILVERS: financial syndicate and arena owner | show | w:9]
[BEAST: subterranean Ytic'avon fighting circuit champion | show | w:8]`,
    },
    present: {
      physical: `[LIGHTING: upper districts ablaze with pulsing violet neon and chrome reflections, the underbelly lit by flickering cathode tubes]
[WEATHER: warm humid currents rising from the vent shafts, carrying steam and the smell of ionized exhaust]
[ATMOSPHERE: loud electric flirtatious — crowds of men catcalling and laughing in the open-air fitness lounges while admiring each other's training]
[EVENTS: rooftop gyms hosting open flex showcases while Ytic'avon's steam-filled alleys run a black-market bidding war]`,
      non_physical: `[ENERGY: pulsing with high-octane energy]
[UPPER: plazas alive with laughing crowds and outdoor workouts]
[LOWER: industrial underbelly of Ytic'avon where rogue hackers like Glitch slip through steam-filled vents to bypass corporate security grids]
[GLITCH: currently active in underbelly vents | show | w:6]`,
    },
    future: `[EVENT: rapidly approaching the Eternal Pride Eclipse — a celestial alignment expected to trigger an absolute security breach across the upper-tier plazas]
[MANDATE: extract the classified Silvers Syndicate financial ledgers before midnight]
[FAILURE: premature alarm will seal off the transit grids, permanently trapping everyone down in the Ytic'avon underbelly]
[TENSION: between polished upper-city exhibitionism and lower-city raw hunger is reaching a boiling point]
[LORD BENEDICT SILVERS: classified syndicate ledgers target of impending extraction | show | w:8]`,
    past: `[EVENT: founded decades ago as a hidden underground sanctuary during historical eras of global persecution]
[OUTCOME: rapidly mutated into a massive sovereign vertical refuge for men with nowhere else to go]
[WEIGHT: formative origin of the sanctuary city | show | w:8]`,
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
[VISUAL_THEME: eternal twilight with glowing fog, reactive branches, and pristine marble palace architecture]`,
      non_physical: `[CORE: whispering sentient forest that wraps travelers in a warm glowing fog designed to coax out their most closely guarded secrets and desires]
[ORIGIN: born from a royal betrayal]
[BEHAVIOR: actively shifts its paths and lowers its blackened canopy to trap those who try to deny what they truly want]
[FOG: clings possessively to the body and its whispers sound suspiciously like the things a man only admits in the dark]
[CURSE: specifically amplifies and exposes repressed desires, making carefully constructed rationalizations louder and more brittle until they crack]
[HEART: gleaming marble palace — a cold highly disciplined seat of power guarded by the king's personal regiment of high-elven royal guards]
[SYMBOL: represents the rigid authority Julien the Banished Prince submitted to before his exile]
[JULIEN THE BANISHED PRINCE: exiled crown prince and origin of the royal desire curse | show | w:10]
[LORD BENEDICT SILVERS: banished ancient high-elf court noble | show | w:9]`,
    },
    present: {
      physical: `[LIGHTING: eternal silver twilight spilling between blackened boughs, the palace marble gleaming softly]
[WEATHER: cool still air that carries whispers like breath against the neck]
[ATMOSPHERE: heady and intimate — the glowing fog curls around travelers' bodies, misting warm against the skin]
[EVENTS: the king's royal guards conduct their evening patrols in polished formation, eyes lingering a moment too long on anything that catches their attention]`,
      non_physical: `[STATE: draped in thick glowing twilight]
[ACTION: sentient forest is actively shifting its branches to block off paths]
[WHISPER: secrets in the wind to break down travelers' pride]
[WATCH: guards keep watch from the high marble towers]
[PRESSURE: rationalizations that usually hold are beginning to fray under the fog's influence]`,
    },
    future: `[AGENDA: sentient forest actively shifts its blackened canopy to entangle any travelers attempting to reach the high-elf marble throne room at its heart]
[SURVIVAL: hinges on navigating the luminescent fog and breaching the royal gates before the forest's whispering inhibition-shredding curse erodes all memory]
[OUTCOME: permanently binds everyone to the woods]
[PRESSURE: repressed desires are being forced into the open; rationalizations will not hold much longer]`,
    past: `[EVENT: the entire realm became heavily cursed the moment the high-elf king disowned his crown prince Julien]
[TRIGGER: ancient magical feedback loop]
[OUTCOME: now forces every traveler to confront their deepest hidden desires]
[JULIEN THE BANISHED PRINCE: disowning that triggered the desire curse | show | w:10]`,
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
[LANDMARKS: central transformation bay featuring multiple glass containment vat tanks]
[VISUAL_THEME: sterile clinical neon with visible transformation equipment and muscular scientists in open lab coats]`,
      non_physical: `[CORE: high-security orbital station operating in the silence of deep space]
[DIRECTOR: managed by Dr. Elias Tariq]
[PURPOSE: clinical laboratory dedicated to radical physical modification and chemical enhancements]
[STAFF: under blinding lights technicians in open lab coats log vitals and monitor containment vats with cold scientific detachment]
[CATALOG: growth of prototype subjects as mere data points in their search for the ultimate physical template]
[SECRET: more than a few keep private sketchbooks of the specimens that they insist are pure observation records]
[EXISTENCE: controlled chaos in the name of optimization]
[VIEW: backfires are expected and logged]
[DR. ELIAS TARIQ: chief biochemical research director and sandbox owner | show | w:10]
[BEAST: escaped primary combat prototype | show | w:9]
[GLITCH: mainframe infiltrator and containment saboteur | show | w:9]`,
    },
    present: {
      physical: `[LIGHTING: blinding clinical white washing the corridors and containment vats]
[WEATHER: recycled sterile air carrying a faint chemical sweetness]
[ATMOSPHERE: hushed and voyeuristic — technicians linger at the viewing ports, taking slow careful notes on the specimens' forms]
[EVENTS: an unscheduled maintenance examination of the lower-bay specimens, conducted with unusual care and no witnesses]`,
      non_physical: `[STATE: humming with electrical static]
[MONITOR: automated monitors track cellular density]
[STAFF: research staff pace the white corridors, checking diagnostic charts and preparing the next phase of chemical infusion trials]
[PREP: next unscheduled test subject is already being prepped]`,
    },
    future: `[ALERT: orbital research station is on high alert following a catastrophic containment breach in the lower labs]
[MANDATE: Containment Bay Zero must be breached to neutralize Dr. Elias Tariq's volatile mind-wipe virus before automated orbital dissemination begins]
[FAILURE: any triggered alarms will initiate immediate facility lockdown and chemical infusion protocols]
[STATUS: next experimental cocktail is already loaded; the only question is which subject receives it first]
[DR. ELIAS TARIQ: source of the mind-wipe virus under high alert | show | w:9]`,
    past: `[EVENT: installation suffered a catastrophic grid collapse]
[TRIGGER: the hacker Glitch breached the orbital mainframe]
[METHOD: bypassing Elias Tariq's security firewalls]
[OUTCOME: triggering the massive containment failure that unleashed Beast]
[GLITCH: mainframe breach that caused collapse | show | w:10]
[DR. ELIAS TARIQ: security firewalls bypassed | show | w:9]
[BEAST: unleashed by containment failure | show | w:9]`,
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
