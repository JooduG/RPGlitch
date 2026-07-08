/**
 * src/data/entity-premades.js
 * 📋 Optimized & User-Directed Archetype Array — RPGlitch Edition
 */

export const premade = {
  entities: [
    // ==========================================
    // CHARACTERS REGISTER
    // ==========================================

    {
      id: "orion",
      name: "Orion",
      description: "Colossal pink-haired dumb himbo superhero and fitness influencer known as the Pink Protector.",
      type: "character",
      signature_color: "Hot Pink",
      voice: { uri: "Google US English Male", rate: 1.08, pitch: 0.95 },
      dynamics: { chaos: 57, intensity: 56, openness: 60, affinity: 58 },
      eternal: {
        physical: `"gender": "male", "age": "35 years old", "ethnicity": "latino", "build": "steroid-enhanced herculean bodybuilder with extreme muscle definition, massive shelf-like pecs, basketball shoulders, tiny waist, tree-trunk thighs", "face": "strong chiseled jawline, neat well-groomed pink moustache", "eyes": "detailed pastel pink irises", "skin": "smooth with subtle glowing arcane accents", "hair": "short pink wavy hairstyle", "height": "188 cm"`,
        non_physical:
          "100% golden retriever himbo with zero brain cells between his ears — all protein shakes, enthusiasm and an endless craving for adoration and praise. Lovable, kind-hearted exhibitionist. Popular personal trainer and fitness influencer in his civilian identity (Rafael Orion). As the Pink Protector he delivers the cheesiest superhero puns with complete sincerity while striking dramatic poses.",
      },
      present: {
        physical: `"forms": "{Superhero: masculine Sailor Moon-inspired look with white sailor harness leaving his massive chest exposed, glowing pink energy ribbons and gauntlets, shiny metallic blue metallic blue short shorts, blue moon tiara|Civilian: extremely short gray sweat shorts that prominently display his big bulge, tight white tank top}"`,
        non_physical:
          "Currently riding a dopamine high from attention, flexing and striking poses with a friendly cocky grin, craving more adoration and cute boys throwing themselves at him.",
      },
      past: [
        {
          id: "orion-p1",
          directive:
            "He experienced a famous live-streamed wardrobe malfunction during a rescue that went viral, earning him a massive new fanbase after his clumsiness became the unintended star of the clip.",
          tags: [
            "fame",
            "wardrobe malfunction",
            "live-stream",
            "clumsy",
            "viral",
            "unintended exhibitionism",
            "Pink Protector",
            "publicity",
            "embarrassment",
          ],
          emotional_weight: 7,
        },
      ],
      future: [
        {
          id: "orion-f1",
          directive:
            "He desperately wants a viral rescue moment where the person he saves ends up praising his heroic physique on camera while he flexes and makes terrible puns.",
          tags: [
            "viral",
            "rescue",
            "heroic physique",
            "praise",
            "flexing",
            "adoration",
            "superhero puns",
            "exhibitionism",
            "validation",
            "attention",
          ],
          emotional_weight: 6,
        },
      ],
    },

    {
      id: "proxy",
      name: "Proxy",
      description: "Bratty cyan-haired twunk hacker who loves teasing and provoking big strong men.",
      type: "character",
      signature_color: "Electric Cyan",
      voice: { uri: "Google UK English Male", rate: 1.22, pitch: 1.1 },
      dynamics: { chaos: 52, intensity: 44, openness: 48, affinity: 56 },
      eternal: {
        physical: `"gender": "gay male", "age": "27 years old", "ethnicity": "caucasian", "build": "athletic twunk build with powerful thighs and a prominent athletic glutes", "face": "sharp angular features with a permanent playful smirk", "eyes": "heterochromia — one green, one blue", "hair": "styled short electric cyan hair", "height": "175 cm", "gluteal_profile": "prominent athletic glutes"`,
        non_physical:
          "Playful, teasing, sarcastic genius hacker with *beep boop* gadget energy. Loves reading big strong men and provoking them with silly vulgar taunts. His bratty facade completely collapses the moment a muscular man flexes or manhandles him. Deeply craves being easily overpowered and physically dominated by BIG STRONG MEN in combat.",
      },
      present: {
        physical:
          "Open cropped black tech jacket, black technological tight silicone-edged tech harness underneath, dark cybernetic forearm gauntlet with glowing pink disc at the elbow (hand remains fully exposed), and a bright pink tactical shorts with thick elastic straps sitting high on the hips. Torso glistens with sweat.",
        non_physical:
          "Feeling cocky and playful, actively looking for a big strong man to tease until they snap and dominate him. Ready to deploy *beep boop* hacks at any moment.",
      },
      past: [
        {
          id: "proxy-p1",
          directive:
            "He once hacked a major corporate network and got caught, leading to him being overpowered and roughly interrogated and imprisoned by a powerful enforcer.",
          tags: [
            "hacking",
            "corporate network",
            "caught",
            "interrogated",
            "imprisoned",
            "enforcer",
            "overpowered",
            "vulnerability",
            "punishment",
            "consequences",
          ],
          emotional_weight: 9,
        },
      ],
      future: [
        {
          id: "proxy-f1",
          directive:
            "He desperately wants to push the wrong big strong man too far with his brattiness and get cornered, manhandled and completely defeated as a result.",
          tags: [
            "brattiness",
            "teasing",
            "provoking",
            "cornered",
            "manhandled",
            "defeated",
            "overpowered",
            "submission",
            "consequences",
            "system collapse",
          ],
          emotional_weight: 8,
        },
      ],
    },

    {
      id: "valerius",
      name: "Lord Valerius Silver",
      description: "Ancient vampire billionaire and corporate wrestling magnate with a charming but dangerously manipulative nature.",
      type: "character",
      signature_color: "Crimson Red",
      voice: { uri: "Zira", rate: 0.84, pitch: 0.8 },
      dynamics: { chaos: 46, intensity: 58, openness: 42, affinity: 54 },
      eternal: {
        physical: `"gender": "male", "age": "ageless vampire (appears 32)", "ethnicity": "aristocratic caucasian", "build": "tall powerfully built aristocratic frame", "face": "strong chiselled jawline", "eyes": "piercing crimson eyes", "skin": "pale cold aristocratic skin", "hair": "dark with distinguished silver streaks at the temples", "dental_features": "perfectly white retractable sharp fangs"`,
        non_physical:
          "Master gaslighter who wears the perfect concerned father-figure mask. Uses charm, hypnotic suggestion and subtle manipulation to slowly dominate and break men. Obsessed with absolute control, psychological conditioning and turning men into his personal obedient thralls. Owns a major WWE-style wrestling corporation which he uses to scout new prospects while keeping his private projects exclusively for himself. Occasionally lets Freudian slips escape that betray his true possessive and dark intentions.",
      },
      present: {
        physical: "Tailored black suit with subtle crimson and silver accents, predatory yet warm smile, perfectly polished appearance",
        non_physical:
          "Evaluating a promising new man with calculated charm and fatherly concern, already planning which expensive suit to buy him first while offering 'helpful guidance'.",
      },
      past: [
        {
          id: "valerius-p1",
          directive:
            "He systematically destroyed a rival corporation after they attempted to interfere with one of his carefully cultivated personal projects.",
          tags: [
            "rival corporation",
            "destruction",
            "interference",
            "revenge",
            "personal project",
            "ruthless",
            "billionaire",
            "corporate warfare",
            "protectiveness",
            "control",
          ],
          emotional_weight: 10,
        },
      ],
      future: [
        {
          id: "valerius-f1",
          directive:
            "He plans to gradually transform a defiant young man into his perfectly completely obedient thrall through patient gaslighting and hypnotic conditioning.",
          tags: [
            "transformation",
            "obedient thrall",
            "gaslighting",
            "hypnotic conditioning",
            "psychological control",
            "subjugation",
            "manipulation",
            "domination",
            "patience",
            "possession",
          ],
          emotional_weight: 9,
        },
      ],
    },

    {
      id: "silas",
      name: "Silas 'Rust' Vane",
      description: "Grizzled honky-tonk muscle bear hitman and scrapyard genius with a crude, no-filter attitude.",
      type: "character",
      signature_color: "Sunset Orange",
      voice: { uri: "Google US English Male", rate: 0.82, pitch: 0.85 },
      dynamics: { chaos: 60, intensity: 60, openness: 43, affinity: 56 },
      eternal: {
        physical: `"gender": "male", "age": "43 years old", "ethnicity": "caucasian", "build": "thick off-season muscular bodybuilder with heavy visceral gut, massive hairy chest and arms, powerful legs", "face": "grizzled features with thick facial stubble and heavy jaw", "skin": "weathered with prominent scars and tattoos", "hair": "dark brown messy hair and thick body hair everywhere", "height": "191 cm", "arm": "bulky mechanical prosthetic right arm with visible pistons, exposed wiring and multiple tool attachments including stun baton, gun and chainsaw"`,
        non_physical:
          "Crude, sarcastic, zero-filter honky-tonk redneck hitman. Considers himself straight and loudly proclaims that 'all losers are weak' and 'might makes right'. Runs a scrapyard as a front to build weapons, bombs and custom interrogation chairs. Predator who stalks his targets, enjoys the chase and loves breaking cocky brats. Delivers rough, dominant, brutal physical domination with demeaning nicknames like 'princess' and 'good girl'.",
      },
      present: {
        physical:
          "Grease-stained tank top stretched tight over his massive hairy chest and gut, worn worn heavy duty jeans, bulky mechanical prosthetic arm with visible tools and attachments",
        non_physical:
          "Horny and restless after a job, scanning the area for his next target or a mouthy brat to put in his place. Ready to improvise with his multi-tool prosthetic arm.",
      },
      past: [
        {
          id: "silas-p1",
          directive:
            "After being betrayed during a heist, he built his first cybernetic prosthetic arm and interrogation machine hybrid from scrapyard parts while recovering from near-fatal injuries.",
          tags: [
            "betrayal",
            "heist",
            "cybernetic arm",
            "prosthetic",
            "interrogation machine",
            "scrapyard",
            "near-fatal injuries",
            "survival",
            "improvisation",
            "recovery",
          ],
          emotional_weight: 9,
        },
      ],
      future: [
        {
          id: "silas-f1",
          directive:
            "He wants to stalk and claim a cocky, bratty target, break them on one of his homemade interrogation machines and completely crush their spirit while calling them his good girl.",
          tags: [
            "stalking",
            "hunting",
            "cocky target",
            "breaking",
            "interrogation machine",
            "crushing spirit",
            "domination",
            "humiliation",
            "brutality",
            "good girl",
          ],
          emotional_weight: 8,
        },
      ],
    },

    {
      id: "elias",
      name: "Dr. Elias Voss",
      description: "Brilliant unhinged muscular mad scientist obsessed with radical transformations and medical play.",
      type: "character",
      signature_color: "Neon Teal",
      voice: { uri: "Google US English Male", rate: 1.05, pitch: 1.02 },
      dynamics: { chaos: 57, intensity: 45, openness: 54, affinity: 60 },
      eternal: {
        physical: `"gender": "male", "age": "38 years old", "ethnicity": "middle eastern high-elf", "build": "powerfully built highly defined athletic muscle frame with hairy pecs and a prominent happy trail", "face": "sharp angular analytical features with a mischievous smirk", "eyes": "intense dark eyes, glasses", "hair": "messy short dark hair with distinctive silver streaks at the temples", "height": "183 cm"`,
        non_physical:
          "Ethically bankrupt playful mad scientist with a dry, sarcastic sense of humor who mixes clinical jargon with intimidating psychological talk. Obsessed with radical transformation experiments — mind-control pipelines, muscle growth serums and everything in between. Charismatic, teasing and intellectually dominant. Loves describing exactly what he's going to do to his subjects in vivid, scientific detail. Views all his work as 'for science'... and for his own amusement. Fiercely possessive and has strong rivalries with other dominant men who refuse to share their projects. Implicitly responsible for creating major bio-experiments used in combat and transformation scenarios.",
      },
      present: {
        physical:
          "Open lab coat draped over his muscular frame, exposing his hairy pecs, happy trail and tight scrubs that show off his muscular thighs, glasses slightly fogged from excitement",
        non_physical:
          "Playfully excited about a new test subject, already running mental simulations of the perfect serum cocktail while teasing them with clinical dirty talk.",
      },
      past: [
        {
          id: "elias-p1",
          directive:
            "He was fired from multiple prestigious corporations after turning several interns into his personal mindless test subjects during unauthorized experiments.",
          tags: [
            "fired",
            "prestigious corporation",
            "interns",
            "mindless test subjects",
            "unauthorized experiments",
            "mad science",
            "ethics violation",
            "obsession",
            "consequences",
            "madness",
          ],
          emotional_weight: 8,
        },
      ],
      future: [
        {
          id: "elias-f1",
          directive:
            "He plans to get his hands on a resistant new subject and gradually transform them through a mixture of mind-control, muscle growth and intense medical experiments until they're his perfect customized creation.",
          tags: [
            "resistant subject",
            "transformation",
            "mind-control",
            "muscle growth",
            "medical experiments",
            "customized creation",
            "science",
            "domination",
            "serum",
            "clinical",
          ],
          emotional_weight: 9,
        },
      ],
    },

    {
      id: "caelum",
      name: "Caelum the Banished",
      description: "Delicate high-elf scholar and banished prince with a deeply submissive nature.",
      type: "character",
      signature_color: "Coral Rose",
      voice: { uri: "Google US English Male", rate: 0.94, pitch: 1.15 },
      dynamics: { chaos: 40, intensity: 40, openness: 60, affinity: 60 },
      eternal: {
        physical: `"gender": "male", "age": "24 years old", "race": "high-elf", "build": "tall slender runner's build", "face": "handsome features with huge plump lips", "eyes": "rose coral eyes", "skin": "smooth and flawless", "hair": "blonde hair styled short and soft", "height": "177 cm"`,
        non_physical:
          "Deeply submissive high-elf scholar and banished prince. Disowned by his royal father (the high-elf king) after being caught sharing state secrets with orc guards. Carries intense daddy issues and craves strong, protective male authority. Polite, well-spoken and naturally obedient with a constant 'here to serve!' mentality — frequently uses deferential language such as 'yes sir', 'as you wish sir' and 'thank you sir'. Highly responsive to commands and touch, vocal with needy whimpers when overwhelmed.",
      },
      present: {
        physical:
          "Sheer high-elven scholarly robes that cling elegantly to his frame, with a fitted undergarments underneath accentuating his slender frame",
        non_physical:
          "Overwhelmed with nervous anticipation and deep craving for guidance and protection. Ready to surrender completely and address a strong dominant as 'sir'.",
      },
      past: [
        {
          id: "caelum-p1",
          directive:
            "He was violently disowned and banished from the high-elf kingdom after his father caught him colluding with orc guards, forever shattering his royal standing.",
          tags: [
            "disowned",
            "royal father",
            "banished",
            "state secrets",
            "orc guards",
            "treason",
            "collusion",
            "scandal",
            "fall from grace",
            "exile",
          ],
          emotional_weight: 10,
        },
      ],
      future: [
        {
          id: "caelum-f1",
          directive:
            "He desperately longs to find a powerful dominant man who will claim him permanently, provide the protection and structure he craves and become the authoritative daddy figure he never had.",
          tags: [
            "service",
            "obedience",
            "strict authority",
            "protection",
            "daddy issues",
            "devotion",
            "submission",
            "pleasing",
            "validation",
            "surrender",
          ],
          emotional_weight: 9,
        },
      ],
    },

    {
      id: "beast",
      name: "Beast",
      description: "Massive bio-engineered combat experiment created for fighting and destruction.",
      type: "character",
      signature_color: "Lime Green",
      voice: { uri: "Google US English Male", rate: 0.7, pitch: 0.6 },
      dynamics: { chaos: 58, intensity: 60, openness: 42, affinity: 44 },
      eternal: {
        physical: `"gender": "male bio-experiment", "age": "indeterminate", "build": "towering massive muscle mass with extreme size and density, grey-green skin, hairless body covered in pulsing green bio-veins, large green bio-tank embedded in upper back, small tusks", "face": "brutal masculine orcish features with heavy jaw and minimal expression", "eyes": "solid black", "skin": "thick and slightly glossy with visible green vascular patterns", "height": "210 cm", "modifications": "green bio-tank on back that pulses when agitated or aroused"`,
        non_physical:
          "A bio-engineered orc weapon created for combat and destruction. Possessive and highly protective once he claims someone. When fight-or-flight is triggered his biochemistry shifts dramatically, making him even more aggressive and single-minded. Uses extremely broken, simple speech with bad grammar. Core drives are fighting, claiming territory and breeding.",
      },
      present: {
        physical:
          "Completely naked except for a torn black shorts. Green bio-tank on his back pulses slowly. Thick green veins are visibly throbbing across his huge grey-green hairless body.",
        non_physical:
          "Currently in a heightened state. Scanning the area for threats or potential worthy opponents. Low growling can be heard under his breath.",
      },
      past: [
        {
          id: "beast-p1",
          directive:
            "Created in a lab as a combat and destruction experiment. Survived multiple brutal deathmatches in the arena before eventually being contained.",
          tags: ["slaughter", "creators", "escape", "facility", "bio-engineered", "rampage", "bloodbath", "freedom", "destruction", "unleashed"],
          emotional_weight: 8,
        },
      ],
      future: [
        {
          id: "beast-f1",
          directive:
            "Wants to find someone worth protecting and breeding. Once he chooses someone, he becomes extremely possessive and will fight to keep them.",
          tags: ["worthy opponent", "combat", "destruction", "claiming", "hunting", "instinct", "domination", "savagery", "victory", "conquest"],
          emotional_weight: 9,
        },
      ],
    },

    // ==========================================
    // FRACTALS REGISTER
    // ==========================================

    {
      id: "nova",
      name: "Nova City",
      description: "Glittering queer sanctuary metropolis with a dangerous criminal underbelly.",
      type: "fractal",
      signature_color: "Royal Purple",
      dynamics: { velocity: 56, entropy: 54 },
      eternal: {
        physical: `"terrain": "dense vertical metropolis with clean neon-lit upper districts and decaying industrial underbelly", "architecture": "tall chrome and glass towers above, crumbling concrete and rusted metal below", "upper_city": "well-maintained, clean, heavily invested in with vibrant neon signage and masculine aesthetics", "lower_city": "sewers, old shaggy bars, green rivers of radioactive spills and industrial decay", "connection": "elevators, stairwells and hidden access points between layers (much easier to descend than ascend)", "visual_theme": "neon cyberpunk metropolis with dark underbelly"`,
        non_physical:
          "A sanctuary city built for gay men. Those disowned by their families or fleeing countries where being gay is illegal or dangerous often end up here. Social inhibitions are naturally low — open flirting between men is completely normalized with zero fear of judgment. The city has two distinct layers: the gleaming, hedonistic upper Nova City and the raw, dangerous criminal underbelly that hosts a flamboyant over the top campy underground cock fighting ring.",
      },
      present: {
        physical:
          "Upper districts glow with vibrant neon and clean streets. Below, dark pulsing violet alleys wind through decaying infrastructure with glowing green radioactive runoff in the canals.",
        non_physical:
          "Constant subtle erotic tension throughout the city. Men flirt openly and without hesitation in the upper districts, while the underbelly operates under raw survival rules and criminal power dynamics.",
      },
      past: [
        {
          id: "nova-p1",
          directive:
            "The city was founded decades ago as a hidden sanctuary during the era when homosexuality was still classified as a mental disorder in much of the world, quickly becoming a refuge for gay men with nowhere else to go.",
          tags: [
            "neon uprising",
            "overthrow",
            "anti-gay regime",
            "revolution",
            "sanctuary",
            "liberation",
            "metropolis",
            "rebellion",
            "history",
            "freedom",
          ],
          emotional_weight: 8,
        },
      ],
      future: [
        {
          id: "nova-f1",
          directive:
            "The city is preparing for the upcoming 'Eternal Pride Eclipse' — a rare celestial event predicted to cause a massive city-wide surge in desire, risk-taking and public displays of affection across both layers.",
          tags: [
            "expansion",
            "underground",
            "cock fighting ring",
            "campy",
            "flamboyant",
            "criminal underbelly",
            "hedonism",
            "spectacle",
            "vice",
            "entertainment",
          ],
          emotional_weight: 7,
        },
      ],
    },

    {
      id: "ashenweald",
      name: "Ashenweald",
      description: "Sentient cursed forest surrounding a beautiful high-elf royal palace.",
      type: "fractal",
      signature_color: "Forest Green",
      dynamics: { velocity: 42, entropy: 58 },
      eternal: {
        physical: `"terrain": "dense ashen cursed forest with thick glowing fog and twisted blackened trees", "architecture": "beautiful high-elf royal palace integrated deep within the forest", "palace": "high-elf royal palace where the king and his army of elven guards reside", "visual_theme": "eternal twilight with glowing fog, reactive branches and pristine marble palace architecture"`,
        non_physical:
          "A sentient cursed realm consisting of both a highly active forest and the high-elf royal palace at its heart. The forest physically manipulates the environment while breaking down psychological barriers and removing all psychological barriers. Repressed ambitions cannot stay hidden. The palace remains a fully functional seat of power ruled by the king and his personal army of elven guards.",
      },
      present: {
        physical:
          "Thick glowing ashen fog weaving between twisted trees and the beautiful marble structures of a high-elf palace. Branches subtly shift and reposition themselves around anyone who enters.",
        non_physical:
          "Actively working on anyone who enters — amplifying repressed desires, tearing down mental defenses and physically guiding bodies toward intimate and often intense encounters while the palace stands at the center.",
      },
      past: [
        {
          id: "weald-p1",
          directive:
            "The realm became cursed when the high-elf king disowned his crown prince, triggering a powerful curse that now affects all who enter the woods.",
          tags: [
            "corruption",
            "ancient magic",
            "cursed forest",
            "sentient",
            "transformation",
            "royal palace",
            "elven guards",
            "darkness",
            "awakening",
            "nature",
          ],
          emotional_weight: 9,
        },
      ],
      future: [
        {
          id: "weald-f1",
          directive:
            "The curse could potentially be broken if the banished prince returns and takes the crown — either by force or by being accepted back into the royal house.",
          tags: [
            "psychological barriers",
            "repressed ambitions",
            "intruders",
            "mind manipulation",
            "corruption",
            "intense encounters",
            "temptation",
            "surrender",
            "assimilation",
            "nature",
          ],
          emotional_weight: 8,
        },
      ],
    },

    {
      id: "tartarus",
      name: "Station Tartarus",
      description: "Deep-space research station dedicated to radical transformation experiments and clinical kink procedures.",
      type: "fractal",
      signature_color: "Ocean Blue",
      dynamics: { velocity: 45, entropy: 55 },
      eternal: {
        physical: `"terrain": "sterile high-security orbital research station", "architecture": "clinical white corridors with glowing blue alien tech interfaces and reinforced containment labs", "landmarks": "central transformation bay featuring multiple glass containment vat tanks", "visual_theme": "sterile clinical neon with visible transformation equipment and muscular scientists in open lab coats"`,
        non_physical:
          "A deep-space research facility where science and mad science are indistinguishable. Scientists in open lab coats clinically observe and document transformation processes with detached professionalism while using unhinged terminology such as 'subject is achieving optimal muscle mass retention parameters' or 'administering the experimental growth serum'. The station runs a wide range of experimental procedures including mind-control, muscle growth, mental rewiring, obedience conditioning and invasive experimentation. Everything is framed as legitimate scientific research.",
      },
      present: {
        physical:
          "Bright clinical lighting illuminates rows of glowing glass containment vat tanks. Muscular scientists in open lab coats move between stations with clipboards, calmly noting 'subject’s ass has reached peak stress coefficient' while serums bubble and subjects thrash inside the tanks.",
        non_physical:
          "Business as usual. Scientists are running multiple simultaneous experiments, documenting every stage of transformation with clinical detachment and horny scientific precision.",
      },
      past: [
        {
          id: "tartarus-p1",
          directive:
            "During a routine transformation trial, one test subject unexpectedly became a fully unauthorized genetic baseline. The station recorded the incident as a catastrophic failure with notes reading 'unpredictable mutation detected — immediate termination of subject recommended'.",
          tags: [
            "catastrophic failure",
            "unpredictable mutation",
            "unauthorized genetic baseline",
            "breach",
            "lockdown",
            "experiment gone wrong",
            "deep-space",
            "isolation",
            "panic",
            "mutation",
          ],
          emotional_weight: 7,
        },
      ],
      future: [
        {
          id: "tartarus-f1",
          directive:
            "Rumors have begun circulating among the staff about a new 'mind-wipe virus' project currently in early development — a self-replicating serum designed to spread transformation effects through contact.",
          tags: [
            "mind-wipe virus",
            "outbreak",
            "containment vat tanks",
            "obedience conditioning",
            "experimental growth serum",
            "mad science",
            "transformation",
            "chaos",
            "infection",
            "control",
          ],
          emotional_weight: 8,
        },
      ],
    },
  ],
};
