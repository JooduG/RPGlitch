/**
 * src/data/visual-styles.js
 * 🎨 VISUAL STYLE SYSTEM — Aesthetic Engine presets for image generation.
 * Optimized for FLUX.1 (Rectified Flow) and T5-XXL text encoders.
 *
 * SCHEMA CONVENTIONS:
 * - Photographic/Cinematic/3D mediums use `<camera>` for lens specs, lighting profiles, and optical setups.
 * - Illustrated/Artistic mediums use `<composition>` for perspective, spatial framing, and layout.
 * - `negative_prompt` is isolated as a root property to prevent T5 text-encoder lexical contamination.
 *
 * @typedef {Object} VisualStyle
 * @property {string} id - Unique identifier matching the registry key
 * @property {string} name - Display title shown in UI dropdowns
 * @property {string} portrait - Preview thumbnail asset path
 * @property {string} description - Detailed aesthetic summary for tooltips
 * @property {string[]} tags - Search and taxonomy filter keywords
 * @property {string} visual_engine - Injected XML prompt block (medium, palette, camera/composition, texture)
 * @property {string} negative_prompt - Explicit negative prompt string for dual-conditioning pipelines
 */

/** @type {Record<string, VisualStyle>} */
export const VISUAL_STYLES = {
  none: {
    id: "none",
    name: "No Visual Style",
    portrait: "https://user.uploads.dev/file/f968b744a4afde6ab81c0e751dc5e972.png",
    description: "Raw prompt generation without any visual style tokens or negative prompts injected.",
    tags: ["none", "raw", "unmodified"],
    visual_engine: "",
    negative_prompt: "",
  },

  amateur_snap: {
    id: "amateur_snap",
    name: "Amateur Smartphone Snap",
    portrait: "https://user.uploads.dev/file/0bb4f7bd1737684ea227e701d3566c5e.png",
    description:
      "Casual unprepared smartphone photo featuring extremely unremarkable everyday realism, candid mirror selfie perspective, awkward angles, unposed framing, and accidental direct flash glare.",
    tags: ["amateur", "iphone", "snapshot", "mirror_selfie", "candid", "casual", "unremarkable", "unprepared", "flash_photo", "raw"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>extremely unremarkable candid smartphone photo, casual unprepared mobile phone snapshot, candid mirror selfie capture</medium>\n<palette>casual uncalibrated ambient room lighting, harsh direct phone flash glare, unedited realistic everyday color cast</palette>\n<camera>handheld iPhone camera lens, awkward off-center handheld framing, spontaneous candid angle, quick unposed mirror selfie snapshot perspective</camera>\n<texture>digital sensor noise, slight motion blur smudge, harsh flash specular highlights, subtle lens smudge haze, subtle jpeg compression artifacts</texture>\n</VISUAL_ENGINE>",
    negative_prompt:
      "professional photograph, Hasselblad, studio lighting, flawless retouching, cinematic color grading, dramatic posing, polished model photoshoot, bokeh, 3d render, illustration, artwork",
  },

  anime: {
    id: "anime",
    name: "Anime & Manga (Ecchi)",
    portrait: "https://user.uploads.dev/file/293e5b0c1e675dd32d6f0eb968a47e50.png",
    description:
      "Vibrant cel-shaded Japanese anime & manga art style with clean line work, expressive key framing, stylized proportions, and subtle ecchi adult illustration tones.",
    tags: ["anime", "manga", "ecchi", "hentai", "cel_shading", "illustration", "2d", "stylized"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>Japanese anime and manga cel-shaded 2D illustration in the style of adult ecchi anime and manga art</medium>\n<palette>vibrant saturated anime colors, clean flat cel shading with sharp rim light accents</palette>\n<composition>dynamic dramatic anime keyframe angles, foreshortened perspective, expressive character framing</composition>\n<texture>smooth crisp anime ink line art, flat color fills with subtle gradient shading</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, realistic human skin pores, 3d render, oil painting, watercolor, rough charcoal sketch, crosshatching, raw photo",
  },

  blueprint: {
    id: "blueprint",
    name: "Architectural Blueprint / Da Vinci Sketch",
    portrait: "https://user.uploads.dev/file/b531d8e2c49c83e7fcd7625abceeedd5.png",
    description:
      "Renaissance invention manuscript sketch in the style of Leonardo da Vinci's Vitruvian Man, featuring sepia ink drawings, intricate anatomical and architectural proportion geometry circles, mirror-writing notes, and faded aged parchment paper texture.",
    tags: ["blueprint", "sketch", "da_vinci", "vitruvian_man", "renaissance", "invention", "drafting", "schematic", "anatomical"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>Renaissance invention sketch illustration in the style of Leonardo da Vinci manuscript drawings and Vitruvian Man architectural studies</medium>\n<palette>aged sepia ink tones, warm parchment tan, dark brown iron gall ink, subtle tea-stained paper wash</palette>\n<composition>Vitruvian Man proportion framing, geometric alignment circles and square overlays, mirrored Renaissance cursive handwriting margins</composition>\n<texture>fine nib quill pen ink strokes, aged fibrous parchment paper texture, foxing spots, faded geometric drafting guide lines</texture>\n</VISUAL_ENGINE>",
    negative_prompt:
      "cyanotype blue paper, white blueprint CAD lines, 3d render, photograph, vibrant colors, modern digital illustration, vector art, smooth airbrush",
  },

  cgi_animation: {
    id: "cgi_animation",
    name: "3D Animation (Pixar)",
    portrait: "https://user.uploads.dev/file/27615c2c471da91f2052c4505a945053.png",
    description:
      "Stylized 3D animated movie aesthetic with soft subsurface scattering, expressive lighting, and polished studio warmth in the style of Pixar.",
    tags: ["cgi", "animation", "3d", "stylized", "pixar"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>3d animated feature film digital art in the style of Pixar feature films</medium>\n<palette>warm studio key lighting, soft rim light glow, harmonious pastel color palette</palette>\n<camera>35mm digital feature film setup, shallow depth of field, intimate focal character framing</camera>\n<texture>soft subsurface skin scattering, velvety fabric textures, smooth polished CGI surfaces</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, grainy, raw film, realistic human skin pores, rough impasto, 2d drawing, vector, line art",
  },

  charcoal_sketch: {
    id: "charcoal_sketch",
    name: "Charcoal & Graphite",
    portrait: "https://user.uploads.dev/file/5658673d879658c2dd722fdf1791f688.png",
    description: "Raw charcoal and graphite study with dramatic chiaroscuro, gestural strokes, smudged shading, and heavy paper texture.",
    tags: ["charcoal", "sketch", "graphite", "monochrome", "drawing", "chiaroscuro"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>smudged charcoal drawing in the style of Edgar Degas and John Singer Sargent, gestural graphite study</medium>\n<palette>deep velvety blacks, rich gray tonal gradients, stark white paper highlights</palette>\n<composition>dramatic chiaroscuro framing, expressive atmospheric focus</composition>\n<texture>heavy tooth cotton paper grain, dusty charcoal smudge marks, crosshatched graphite lines</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "color, digital painting, smooth vector, clean lines, 3d render, photo, cel_shaded, neon",
  },

  cinematic: {
    id: "cinematic",
    name: "Cinematic Film",
    portrait: "https://user.uploads.dev/file/67a672baf7752bf089eea071f15a9ca9.png",
    description:
      "Atmospheric widescreen cinema shot featuring 35mm anamorphic optics, volumetric light shafts, dramatic crushed shadows, and cinematic color grading.",
    tags: ["cinematic", "film", "volumetric", "anamorphic", "movie", "dramatic", "shadows"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>widescreen 35mm cinematic feature film capture</medium>\n<palette>dramatic cinematic color grade, volumetric light shafts, deep crushed shadow voids, warm key and cold fill lighting</palette>\n<camera>35mm anamorphic prime lens, shallow depth of field, optical lens flare, dramatic wide-angle perspective</camera>\n<texture>subtle organic 35mm film grain, atmospheric volumetric dust haze, rich specular highlights</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "amateur photo, flat lighting, 2d drawing, cartoon, anime, low poly, noisy, distorted features, raw snapshot, vector",
  },

  claymation: {
    id: "claymation",
    name: "Claymation & Stop-Motion",
    portrait: "https://user.uploads.dev/file/1be495044d258e39e940aa68eaa04c5f.png",
    description: "Tactile stop-motion plasticine animation style with visible thumbprints, miniature set depth, and soft physical lighting.",
    tags: ["claymation", "stop_motion", "clay", "tactile", "sculpture", "animation"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>claymation stop-motion animation capture in the style of Aardman animations, plasticine sculpture</medium>\n<palette>saturated physical clay pigments, soft studio warm spotlighting</palette>\n<camera>50mm macro lens, shallow depth of field, miniature physical set perspective</camera>\n<texture>visible finger impressions in clay, subtle seam lines, matte plasticine texture, felt background materials</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "digital vector, smooth CGI, glossy render, photograph of real human, flat 2d, drawing",
  },

  comic_book: {
    id: "comic_book",
    name: "Comic Book",
    portrait: "https://user.uploads.dev/file/861133eb1b50d4e3c957c0e8402ea5f2.png",
    description: "Bold graphic novel artwork featuring heavy black ink outlines, halftone dot shading, and high-contrast dynamic framing.",
    tags: ["comic_book", "ink", "graphic_novel", "halftone", "bold"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>comic book illustration in the style of Marvel and DC comic book art, bold inked graphic novel art</medium>\n<palette>flat bold primary colors with halftone dot shading, high contrast saturation</palette>\n<composition>dynamic foreshortened angles, dramatic panel composition, action-oriented framing</composition>\n<texture>heavy black ink outlines, visible halftone screen tones, crosshatching shading</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, realistic, 3d render, soft watercolor, oil painting, smooth airbrush",
  },

  concept_art: {
    id: "concept_art",
    name: "Digital Concept Art",
    portrait: "https://user.uploads.dev/file/9d94edf2d5b3a1964d38faddb22f7537.png",
    description:
      "Professional digital speedpainting and key art aesthetic featuring painterly digital brushwork, dynamic value grouping, atmospheric environmental lighting, focal detail emphasis, and ArtStation pre-visualization studio quality.",
    tags: ["concept_art", "digital_painting", "speedpaint", "key_art", "production_art", "painterly", "illustration", "artstation"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>digital concept art keyframe illustration in the style of ArtStation studio speedpaints, digital production painting</medium>\n<palette>atmospheric cinematic value structure, dramatic focal lighting, harmonious environmental color palette with vibrant focal highlights</palette>\n<composition>dynamic rule-of-thirds keyframe staging, strong silhouette clarity, atmospheric perspective depth layers</composition>\n<texture>textured digital brush strokes, expressive loose background painterly marks, crisp focal detail rendering, subtle digital canvas texture</texture>\n</VISUAL_ENGINE>",
    negative_prompt:
      "raw camera snapshot, 3d CAD render, vector graphics, cel-shading, anime comic, flat unshaded color, low resolution doodle, grainy VHS noise, blurry photo",
  },

  cyberpunk: {
    id: "cyberpunk",
    name: "Cyberpunk",
    portrait: "https://user.uploads.dev/file/643e256027b322312bea15c98e3f937e.png",
    description: "Neon-soaked dystopian aesthetic with wet rain-slicked asphalt, holographic interfaces, and high-tech urban grime.",
    tags: ["cyberpunk", "neon", "scifi", "dystopian", "chrome"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>cyberpunk digital art in the style of Syd Mead and Blade Runner, neon-lit dystopian sci-fi environment</medium>\n<palette>vibrant neon magenta and cyan, deep blacks, holographic iridescent accents, harsh LED lighting</palette>\n<camera>wide-angle anamorphic lens, low angle dramatic perspective, optical lens flares</camera>\n<texture>polished chrome reflections, rain-streaked glass, circuit board patterns, holographic noise</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "medieval, fantasy, natural, pastoral, watercolor, oil painting, antique, sunny, historical",
  },

  dark_fantasy: {
    id: "dark_fantasy",
    name: "Dark Fantasy",
    portrait: "https://user.uploads.dev/file/9d94edf2d5b3a1964d38faddb22f7537.png",
    description: "Grim dark fantasy art with eldritch atmospheres, ominous gothic architecture, desaturated color tones, and deep shadow play.",
    tags: ["dark_fantasy", "gothic", "eldritch", "ominous", "shadow"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>dark fantasy concept art in the style of Frank Frazetta and H.R. Giger, gothic digital illustration</medium>\n<palette>desaturated cold tones, deep crushed blacks, sickly green glow, muted gold accents, ash gray</palette>\n<composition>ominous low angles, looming perspective, fog-drenched depth layout</composition>\n<texture>weathered stone, rusted iron, cracked bone, tattered fabric, moss-covered surfaces</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "bright, cheerful, sunny, pastel, cartoon, anime, photograph, modern, neon, synthwave",
  },

  disney_2d_classic: {
    id: "disney_2d_classic",
    name: "Classic 2D (Disney)",
    portrait: "https://user.uploads.dev/file/ab3d3721f029e356d540c524df0d876d.png",
    description:
      "Golden-age hand-drawn 2D animation featuring ink-and-paint character cels, fluid expressive draftsmanship, painterly gouache backgrounds, and fairytale warmth in the style of Walt Disney.",
    tags: ["disney", "2d", "classic_animation", "hand_drawn", "cel_art", "vintage_animation", "fairytale"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>golden age 2d feature animation cel in the style of classic Walt Disney hand-drawn animation</medium>\n<palette>warm theatrical key lighting, luminous fairytale jewel tones, soft pastel background washes</palette>\n<composition>expressive storytelling staging, theatrical silhouette, sweeping organic curves</composition>\n<texture>clean hand-inked cel outlines, matte gouache background paint, subtle analog film scan texture</texture>\n</VISUAL_ENGINE>",
    negative_prompt:
      "3d render, cgi, photorealistic, raw photograph, sharp digital vector, modern 3d animation, low poly, noisy, anime cel shading, cyberpunk",
  },

  fashion_magazine: {
    id: "fashion_magazine",
    name: "Fashion Magazine",
    portrait: "https://user.uploads.dev/file/2112636b40fd390a0a7654395f608c59.png",
    description:
      "Sleek high-fashion editorial aesthetic with opulent champagne gold and platinum tones, dramatic studio rim lighting, in the style of a Vogue cover shoot.",
    tags: ["fashion", "editorial", "magazine", "vogue", "glamour", "high_fashion"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>high-fashion editorial photography in the style of Vogue magazine cover shoot</medium>\n<palette>opulent champagne gold, platinum white, deep rose, dramatic studio rim lighting</palette>\n<camera>85mm fashion editorial lens, crisp studio key light, polished beauty dish lighting</camera>\n<texture>sleek polished editorial print quality, crisp high-fashion detail, flawless editorial finish</texture>\n</VISUAL_ENGINE>",
    negative_prompt:
      "text, typography, watermark, logo, magazine cover text, title letters, white background, light background, bright background, rugged grunge texture, cartoon comic dots, photorealistic human skin pores, sketchy pencil lines, noisy camera grain, heavy drop shadows",
  },

  film_noir: {
    id: "film_noir",
    name: "Film Noir",
    portrait: "https://user.uploads.dev/file/26f37e3915eaabab9248491fc3687f2e.png",
    description:
      "Classic 1940s detective cinema aesthetic featuring high-contrast black and white, hard chiaroscuro shadows, and venetian blind light beams.",
    tags: ["film_noir", "monochrome", "detective", "1940s", "shadows"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>1940s monochrome cinema frame, silver gelatin film print</medium>\n<palette>high contrast black and white, deep shadow voids, harsh key lighting, silver midtones</palette>\n<camera>35mm vintage camera, hard-edge shadows, chiaroscuro lighting, dutch angle tilt</camera>\n<texture>organic medium film grain, cigarette smoke haze, wet pavement reflections</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "color, vibrant, saturated, modern, digital, anime, cartoon, illustration, 3d render",
  },

  ink_sketch: {
    id: "ink_sketch",
    name: "Ink & Line Art",
    portrait: "https://user.uploads.dev/file/1f4f30768cf1b5b17226f698bdbd72b6.png",
    description: "Detailed monochrome ink drawing with fine nib pen lines, dense crosshatching, stippling, and classical engraving feel.",
    tags: ["ink", "line_art", "sketch", "monochrome", "crosshatching", "drawing"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>detailed ink drawing in the style of Albrecht Dürer, minimalist fine line art sketch</medium>\n<palette>stark monochrome black ink on textured cream paper, subtle wash gradients</palette>\n<composition>clean minimalist layout, intentional utilization of negative space, crisp subject outline</composition>\n<texture>fine nib pen strokes, dense crosshatching shading, paper grain texture, stippling</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, 3d render, vibrant colors, blurry, soft gradients, cel_shaded, watercolor, oil painting",
  },

  isometric_3d: {
    id: "isometric_3d",
    name: "Isometric 3D / Low-Poly",
    portrait: "https://user.uploads.dev/file/5e3cdfcde02ff1d1d9c2c5f0588dd4ae.png",
    description: "Clean orthographic 3D vector aesthetic with geometric low-poly models, soft ambient occlusion, and vibrant flat shading.",
    tags: ["isometric", "low_poly", "vector", "3d", "orthographic", "game_art"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>isometric 3d vector model, low-poly digital art</medium>\n<palette>clean vibrant color blocking, soft directional sunlight, gentle ambient occlusion shadows</palette>\n<composition>fixed 45-degree orthographic projection, grid-aligned spatial arrangement</composition>\n<texture>smooth faceted polygon surfaces, crisp vector edges, flat matte materials</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "perspective distortion, photorealistic textures, organic noise, lens flare, film grain, hyperrealism",
  },

  lego_bricks: {
    id: "lego_bricks",
    name: "LEGO® Bricks / Plastic Toy",
    portrait: "https://user.uploads.dev/file/db3cb7104f2da620eccc08dc5f535988.png",
    description:
      "Blocky plastic construction toy aesthetic featuring minifigure characters with cylindrical rotatable heads and U-shaped hands, brick-built background architecture with visible interlocking studs, injection-molded ABS plastic glossy texture, and tilt-shift macro lens depth.",
    tags: ["lego", "bricks", "plastic", "toy", "minifigure", "blocky", "construction_set", "macro"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>plastic toy construction brick artwork, blocky LEGO minifigure character illustration, brick-built macro diorama model</medium>\n<palette>vibrant primary ABS plastic colors, glossy solid yellow minifigure skin tones, rich bold brick red, bright blue, vibrant yellow, green, and black plastic blocks</palette>\n<camera>60mm macro lens photography, shallow depth of field, tilt-shift miniature set focal perspective, eye-level toy camera shot</camera>\n<texture>glossy injection-molded ABS plastic surfaces, visible circular interlocking plastic studs with embossed logo micro-detail, plastic mold seam lines, crisp smooth plastic reflections</texture>\n</VISUAL_ENGINE>",
    negative_prompt:
      "photorealistic human skin pores, organic human features, realistic anatomical human joints, smooth paper drawing, watercolor, 3d CGI film rendering, cloth fabric weave, soft metallic bronze, natural organic foliage",
  },

  notebook_doodle: {
    id: "notebook_doodle",
    name: "Notebook Doodle",
    portrait: "https://user.uploads.dev/file/34dc78c445a2749a4cc1dff08db37033.png",
    description:
      "Casual ballpoint pen and marker doodles drawn in notebook margins, featuring quirky line art, ink bleeds, scribbled shading, and spontaneous hand-drawn energy.",
    tags: ["doodle", "sketch", "notebook", "scribble", "margin_art", "casual", "hand_drawn"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>casual notebook margin doodle, ballpoint pen ink drawing</medium>\n<palette>blue and black ballpoint ink on grid-lined paper, subtle highlighter accents</palette>\n<composition>loose spontaneous margin layout, asymmetric framing, playful quirky proportions</composition>\n<texture>hand-drawn pen scribbles, ink bleed pooling, blue lined paper grid, soft paper creases</texture>\n</VISUAL_ENGINE>",
    negative_prompt:
      "3d render, photograph, polished digital artwork, smooth digital gradient, vector, studio lighting, hyperrealistic, oil painting",
  },

  oil_painting: {
    id: "oil_painting",
    name: "Oil Painting",
    portrait: "https://user.uploads.dev/file/29d4709051646f4e5bffbbd0f34e2048.png",
    description: "Classical fine art oil painting with thick impasto brushwork, layered glazes, rich chiaroscuro, and luminous depth.",
    tags: ["oil_painting", "classical", "impasto", "traditional", "baroque"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>thick impasto oil painting in the style of Michelangelo and Rembrandt, classical fine art masterwork</medium>\n<palette>rich layered glazes, warm earth tones, deep chiaroscuro, varnished luminous depth</palette>\n<composition>baroque triangular composition, dramatic atmospheric staging</composition>\n<texture>visible thick brush strokes, palette knife marks, canvas weave texture, crackled glaze</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, digital, smooth, flat, cel_shaded, anime, vector, camera lens, 3d render",
  },

  papercraft: {
    id: "papercraft",
    name: "Papercraft",
    portrait: "https://user.uploads.dev/file/db3cb7104f2da620eccc08dc5f535988.png",
    description:
      "Layered cut paper art diorama with tactile construction paper textures, dimensional depth stacking, and soft cast shadows between paper layers.",
    tags: ["papercraft", "paper", "cut_paper", "origami", "diorama", "tactile", "layered"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>layered papercraft illustration, cut paper art diorama</medium>\n<palette>flat colored construction paper layers, soft pastel tones, gentle gradient paper shades</palette>\n<composition>layered depth stacking, dimensional paper cut framing, theatrical diorama perspective</composition>\n<texture>visible paper grain, cut edge drop shadows, layered depth separation, tactile fibrous paper surfaces</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, 3d render, smooth glossy surfaces, digital painting, photorealistic, metallic textures, glass, plastic, cel_shaded",
  },

  photorealism: {
    id: "photorealism",
    name: "RAW Photography",
    portrait: "https://user.uploads.dev/file/f3cf9efe77281754064a6629e354d799.png",
    description: "Unfiltered commercial photography captured with high-end medium format optics, natural dynamic range, and rich micro-textures.",
    tags: ["photography", "realistic", "default", "raw", "lifelike", "hasselblad"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>RAW commercial photograph, unedited sensor capture</medium>\n<palette>natural dynamic range, neutral balance, naturalistic key and fill lighting</palette>\n<camera>Hasselblad X2D 100C, 85mm prime f/1.2 lens, shallow depth of field, crisp optical focus</camera>\n<texture>natural skin pores, fine fabric weave micro-details, natural glass refraction</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "anime, illustration, 3d render, cartoon, drawing, painting, digital painting, glossy skin, smooth airbrushed",
  },

  pixel_art: {
    id: "pixel_art",
    name: "Pixel Art",
    portrait: "https://user.uploads.dev/file/87f3a245a478d2bdfeb284e5d8a83327.png",
    description: "Retro 16-bit video game sprite aesthetic featuring a limited color palette, crisp blocky pixel grids, and dithered shading.",
    tags: ["pixel_art", "retro", "16bit", "dithered", "indie_game"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>retro pixel art, 16-bit video game sprite</medium>\n<palette>limited 32-color palette, dithered shading, vibrant contrasting colors</palette>\n<composition>fixed orthographic perspective, side-scroller or top-down grid alignment</composition>\n<texture>crisp square pixels, visible dithering patterns, zero anti-aliasing, blocky forms</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, realistic, smooth, anti-aliased, high resolution, 3d render, oil painting, camera lens, vector",
  },

  pop_art: {
    id: "pop_art",
    name: "Pop Art",
    portrait: "https://user.uploads.dev/file/8859b844589de004573bac55fd49f96e.png",
    description:
      "Bold Ben-Day dot pop art with explosive action starbursts, primary yellow, vibrant magenta, and electric cyan in a comic-inspired graphic style.",
    tags: ["pop_art", "ben_day", "halftone", "bold", "graphic", "warhol", "lichtenstein"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>bold pop art illustration in the style of Roy Lichtenstein and Andy Warhol, Ben-Day dot halftone print</medium>\n<palette>primary yellow, vibrant magenta, electric cyan, bold flat primary color blocks</palette>\n<composition>dynamic action starburst framing, comic speech bubble layout, graphic poster composition</composition>\n<texture>Ben-Day dot halftone patterns, thick black ink outlines, flat opaque color blocks, newsprint dot screen</texture>\n</VISUAL_ENGINE>",
    negative_prompt:
      "white background, light background, bright background, realistic photo, subtle muted pastel wash, dark moody gothic, photorealistic skin, blurry lines, noisy camera grain, heavy drop shadows",
  },

  pulp_illustration: {
    id: "pulp_illustration",
    name: "Retro Pulp Cover",
    portrait: "https://user.uploads.dev/file/a166f0706f17833ab3990b791d9937ab.png",
    description:
      "Vivid 1950s fantasy and sci-fi paperback book illustration featuring dramatic gouache brushwork, high-strung theatrical staging, and saturated pulp action tones.",
    tags: ["pulp", "retro", "50s", "paperback", "sci-fi", "fantasy", "gouache"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>1950s pulp magazine cover illustration in the style of Frank Frazetta, vintage paperback gouache painting</medium>\n<palette>vivid primary accents, warm cadmium yellow highlights, deep teal shadows, dramatic rim lighting</palette>\n<composition>diagonal dynamic action composition, dramatic hero posing, space for cover typography</composition>\n<texture>visible gouache brush strokes, matte paperboard texture, vintage newsprint color bleed</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "modern 3d render, photograph, clean digital vector, minimalist flat design, cyberpunk neon, anime",
  },

  retro_synthwave: {
    id: "retro_synthwave",
    name: "Retro Synthwave",
    portrait: "https://user.uploads.dev/file/f2150b87f7133e099c38bbe384a7eaa1.png",
    description: "1980s retro-futuristic outrun visual style with neon grid horizons, wireframe sunsets, chrome surfaces, and CRT scan lines.",
    tags: ["synthwave", "retro", "80s", "neon", "vaporwave", "outrun"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>1980s outrun digital artwork, retro synthwave art</medium>\n<palette>neon magenta and purple gradients, vibrant orange horizon, deep twilight navy blue</palette>\n<composition>low ground perspective, vanishing point perspective grid, wide-angle framing</composition>\n<texture>chrome reflections, glowing neon glass tubes, subtle CRT scanlines, grid floor</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "medieval, natural, realistic, documentary, watercolor, oil painting, historical, pastel, organic",
  },

  risograph: {
    id: "risograph",
    name: "Risograph Print",
    portrait: "https://user.uploads.dev/file/cc3c346e67befef2962db45f388fdbf8.png",
    description: "Tactile spot-color print aesthetic featuring overlapping vivid inks, subtle registration misalignment, and dithered paper texture.",
    tags: ["risograph", "printmaking", "retro", "dithered", "tactile", "spot_color"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>risograph spot-color print illustration</medium>\n<palette>dual-tone neon pink and sunflower yellow inks, overlapping color translucent bleeds</palette>\n<composition>graphic poster layout, bold shapes, intentional negative space balance</composition>\n<texture>heavy tooth recycled paper texture, grain dithering, subtle ink registration misalignment</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, 3d render, smooth gradient, hyperrealistic, glossy, realistic skin",
  },

  stained_glass: {
    id: "stained_glass",
    name: "Stained Glass",
    portrait: "https://user.uploads.dev/file/b24924f2fd7d826540b4f2757dad7767.png",
    description: "Gothic cathedral stained glass artwork with backlit translucent jewel-toned glass panels and dark lead came borders.",
    tags: ["stained_glass", "gothic", "mosaic", "glass", "backlit", "artisan"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>gothic cathedral stained glass window mosaic</medium>\n<palette>luminous backlit ruby red, cobalt blue, and emerald green translucent glass panels</palette>\n<composition>symmetrical architectural framing, arched window border layout</composition>\n<texture>thick black lead came soldering contours, subtle glass air bubbles, crackled surface refractions</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, realistic skin, 3d digital render, canvas, paper drawing, flat vector",
  },

  steampunk: {
    id: "steampunk",
    name: "Steampunk & Dieselpunk",
    portrait: "https://user.uploads.dev/file/0f48e8943d5dac6f533b24fa46cc98e3.png",
    description:
      "Victorian industrial steampunk featuring intricate brass clockwork gearworks, copper steam boilers, iron rivets, pressure gauges, exposed mechanical movements, and swirling steam vents.",
    tags: ["steampunk", "dieselpunk", "industrial", "brass", "clockwork", "victorian", "gears", "machinery", "retro_futurism"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>authentic Victorian steampunk mechanical machinery art, intricate industrial clockwork concept design, detailed brass and copper ironwork render</medium>\n<palette>tarnished brass patinas, oxidized copper green accents, heavy cast iron black, warm furnace amber glow, aged oily leather, rich bronze reflections</palette>\n<camera>50mm lens, intricate mechanical macro and wide industrial perspective, dense layered gearwork layout, dramatic mechanical depth</camera>\n<texture>dense intricate interlocking clockwork gears, brass pressure gauges, copper steam pipes, heavy iron rivets, grease and oil stains, escaping white steam plumes, oxidized metal patina</texture>\n</VISUAL_ENGINE>",
    negative_prompt:
      "anime, manga, cel-shaded, anime face, anime hair, stylized anime character, modern plastic, neon lights, digital cyberpunk, flat vector, clean 2d illustration, simple pipe design, simple background",
  },

  studio_ghibli: {
    id: "studio_ghibli",
    name: "Studio Ghibli",
    portrait: "https://user.uploads.dev/file/4aaf95f0ba916c7498c960abb4ecd87e.png",
    description: "Warm hand-painted animation style with lush scenic landscapes, soft watercolor wash backgrounds, and nostalgic warmth.",
    tags: ["studio_ghibli", "anime", "hand_painted", "nostalgic", "whimsical"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>hand-painted anime animation cel in the style of Studio Ghibli and Hayao Miyazaki, traditional 2d film frame</medium>\n<palette>warm earthy tones, soft pastel skies, lush green landscapes, gentle golden light</palette>\n<composition>wide establishing environmental layout, gentle framing, intimate character focus with soft background depth</composition>\n<texture>hand-painted watercolor backgrounds, soft cel shading on characters, visible brush texture</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, 3d render, realistic, dark, gritty, cyberpunk, harsh neon lighting, photorealism",
  },

  surrealism: {
    id: "surrealism",
    name: "Surrealism",
    portrait: "https://user.uploads.dev/file/fda4ab3f0b48de1fea481d4a8987d8aa.png",
    description: "Dreamlike surrealist painting blending impossible physical geometries, distorted melting perspectives, and subconscious symbolism.",
    tags: ["surrealism", "dreamlike", "abstract", "symbolic", "subconscious"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>surrealist oil painting in the style of Salvador Dalí and René Magritte, dreamlike conceptual artwork</medium>\n<palette>ethereal color gradients, shifting iridescent tones, deep velvety shadows</palette>\n<composition>distorted spatial logic, impossible physical geometry, symbolic layout</composition>\n<texture>smooth blended brushwork with sharp impossible juxtapositions, marble-like polish</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, realistic, mundane, ordinary, plain, documentary, camera lens, corporate design",
  },

  surveillance_footage: {
    id: "surveillance_footage",
    name: "Surveillance / CCTV",
    portrait: "https://user.uploads.dev/file/ea9f523b0c23c7af252b71010b88b24e.png",
    description:
      "High-angle security camera CCTV screen capture featuring prominent horizontal scanline stripes, video interlacing tear lines, digital compression glitch artifacts, washed-out desaturated monitor colors, timestamp overlay, and fisheye lens distortion.",
    tags: ["surveillance", "cctv", "security", "glitch", "scanlines", "striped_artifacts", "found_footage", "interlacing"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>glitchy security camera video frame capture, low-bitrate CCTV surveillance screen capture, distorted security monitor photo</medium>\n<palette>low-color washed-out desaturated security monitor tones, harsh dark contrast shadows, high digital sensor noise, subtle muted phosphor cast</palette>\n<camera>ceiling-mounted wide-angle fisheye security lens, steep top-down security camera angle, high-corner surveillance perspective</camera>\n<texture>prominent horizontal scanline stripes, video interlacing tear lines, digital compression glitch artifacts, corrupt pixel striping, timestamp overlay graphics, heavy video compression noise</texture>\n</VISUAL_ENGINE>",
    negative_prompt:
      "crisp 4k photo, cinematic studio lighting, professional photograph, vibrant full color, green night vision single-tint, 3d render, vector, oil painting, illustration, clean pristine digital video",
  },

  three_d_render: {
    id: "three_d_render",
    name: "3D Render (UE5)",
    portrait: "https://user.uploads.dev/file/bffd329357dc15037b5af9d2a7dbb45f.png",
    description:
      "High-concept 3D scene powered by Unreal Engine 5 optics, featuring ray-traced global illumination, physically based materials, and ambient occlusion.",
    tags: ["3d_render", "ue5", "unreal_engine", "cgi", "raytracing"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>Unreal Engine 5 architectural 3d scene render</medium>\n<palette>physically based lighting, volumetric light shafts, ray-traced global illumination</palette>\n<camera>cinematic 35mm focal setup, accurate specular reflections, ambient occlusion depth</camera>\n<texture>crisp 3d asset definition, physically based material shaders, ray-traced reflections</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "flat 2d, illustration, drawing, watercolor, low poly, noisy, anime, painting, sketch",
  },

  tom_of_finland: {
    id: "tom_of_finland",
    name: "Tom of Finland",
    portrait: "https://user.uploads.dev/file/74be269263eccaeae62c04b90601bc75.png",
    description:
      "Iconic hyper-masculine pencil and graphite illustration featuring bold muscular contours, polished black leather, and high-contrast draftsmanship in the style of Tom of Finland.",
    tags: ["tom_of_finland", "graphite", "hyper_masculine", "leather", "erotic_art", "drawing"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>hyper-masculine pencil and graphite illustration in the style of Tom of Finland</medium>\n<palette>rich graphite monochrome, deep velvety blacks, stark white paper highlights, polished leather shine</palette>\n<composition>bold heroic framing, accentuated anatomical and structural curves, high-contrast perspective</composition>\n<texture>smooth shaded graphite, dense pencil crosshatching shading, gleaming leather texture, heavy cotton paper grain</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "color, photograph, 3d render, soft watercolor, pastel wash, anime, cel-shaded, digital vector, low contrast",
  },

  ukiyo_e: {
    id: "ukiyo_e",
    name: "Ukiyo-e Woodblock Print",
    portrait: "https://user.uploads.dev/file/c6978746b0f5ae93937c7890fced148c.png",
    description:
      "Traditional Edo-period Japanese woodblock print featuring organic sumi-e ink contours, flat mineral pigments, and subtle wood grain impressions.",
    tags: ["ukiyo_e", "japanese", "woodblock", "traditional", "print", "hokusai"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>traditional Edo-period ukiyo-e woodblock print in the style of Hokusai</medium>\n<palette>flat mineral pigments, indigo blue, burnt orange, muted cream, sumi-e black ink</palette>\n<composition>asymmetrical Japanese layout, flat space perspective, atmospheric horizon wave framing</composition>\n<texture>visible relief wood grain impressions, fibrous hand-pressed washi paper texture</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, modern 3d render, glossy reflections, volumetric lighting, oil painting, western comics",
  },

  vaporwave: {
    id: "vaporwave",
    name: "Vaporwave",
    portrait: "https://user.uploads.dev/file/f31d7e4611a4d561bfe3becf3404b9dd.png",
    description:
      "Nostalgic 1990s digital collage blending pastel cyan and magenta gradients, classical marble statues, glitch artifacts, and early web aesthetic.",
    tags: ["vaporwave", "90s", "pastel", "glitch", "aesthetic", "lofi"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>vaporwave digital collage, 90s graphic art</medium>\n<palette>pastel cyan, soft lavender, hot pink gradients, washed-out turquoise, golden sunset reflections</palette>\n<camera>wide-angle surreal lens setup, multi-plane collage perspective, isometric floating frame</camera>\n<texture>analog video line noise, chromatic edge bleeding, smooth marble polish, pixelated gradient steps</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "dark, gritty, hyperrealistic photograph, raw film, dark fantasy, medieval, historical fantasy",
  },

  vhs_found_footage: {
    id: "vhs_found_footage",
    name: "VHS Found Footage",
    portrait: "https://user.uploads.dev/file/644012b0a426a455889d5a8881d69e72.png",
    description:
      "Uncanny lofi 1990s analog found footage video frame featuring mysterious unexplained atmosphere, heavy magnetic tracking glitch artifacts, motion blur static distortion, and unsettling analog horror tape realism.",
    tags: ["vhs", "found_footage", "uncanny", "analog_horror", "mysterious", "glitch", "blurry", "camcorder", "unexplained"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>mysterious uncanny found footage VHS video screen capture, low-fi analog horror magnetic tape frame</medium>\n<palette>unsettling washed-out low-light shadows, eerie green and desaturated phosphor cast, harsh grainy shadow noise</palette>\n<camera>shaky handheld consumer camcorder optics, out-of-focus motion blur framing, unsettling wide-angle perspective, low resolution lens distortion</camera>\n<texture>heavy magnetic static blur, corrupt VHS tracking glitch bars, horizontal tear lines, unexplained video artifacts, chromatic bleeding, blurred ghosting edges</texture>\n</VISUAL_ENGINE>",
    negative_prompt:
      "crisp 4k, sharp focus, modern digital camera, vibrant colors, clean studio lighting, 3d render, vector, oil painting, illustration",
  },

  vintage_analog: {
    id: "vintage_analog",
    name: "Vintage 35mm Film",
    portrait: "https://user.uploads.dev/file/c7f758d7f2997cf541d721fb428e77cf.png",
    description: "Authentic 35mm film photo with warm Kodak Portra saturation, organic grain structure, soft lens fall-off, and subtle light leaks.",
    tags: ["analog", "35mm", "vintage", "film", "retro", "photography"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>35mm analog photo scan, street documentary capture</medium>\n<palette>warm Kodak Portra 400 color profile, golden hour sidelighting, organic color bleeding</palette>\n<camera>Leica rangefinder, 35mm f/2.0 lens, soft focal edge roll-off</camera>\n<texture>authentic 35mm film stock grain, subtle light leak anomalies, soft shadow roll-off</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "digital, glossy, 3d render, anime, harsh digital sharpness, vector, cgi",
  },

  watercolor: {
    id: "watercolor",
    name: "Watercolor",
    portrait: "https://user.uploads.dev/file/115456547820baafccc89970b7c5fb7a.png",
    description:
      "Delicate watercolor painting featuring soft wet-on-wet washes, pigment diffusion bleeding, granulating textures, and translucent layering.",
    tags: ["watercolor", "painting", "organic", "soft", "translucent"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>delicate watercolor painting, wet-on-wet technique</medium>\n<palette>soft translucent washes, bleeding pigment edges, pastel undertones with granulating textures</palette>\n<composition>fluid organic framing, gentle vignetting, soft negative space balance</composition>\n<texture>cold-press paper grain texture visible through washes, pooling water marks, dry brush accents</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, 3d render, sharp hard edges, digital, vector, cel_shaded, camera lens, heavy oil impasto",
  },
};
