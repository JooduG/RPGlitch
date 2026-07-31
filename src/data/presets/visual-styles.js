/**
 * src/data/presets/visual-styles.js
 * 🎨 VISUAL STYLE SYSTEM — Aesthetic Engine presets for image generation.
 * Optimized for FLUX.1 (Rectified Flow) and T5-XXL text encoders.
 *
 * PIPELINE
 * optics.js resolves every style through two separate consumers, and both read the raw tag text —
 * neither treats these fields as inert documentation:
 *   1. Deterministic portraits (AestheticResolver / visual.svelte.js) — medium, palette,
 *      camera-or-composition, and texture are flattened into a literal comma-separated fragment
 *      and prepended straight onto the image-generation request. No LLM sits in between.
 *   2. LLM-mediated scenes (PromptTemplates.BUILDER) — the raw <VISUAL_ENGINE> XML block, plus
 *      <tags>, is embedded verbatim into a system prompt; an LLM reads it and synthesizes the
 *      final "prompt" / "negative_prompt" pair itself.
 * Because of path 1, camera and composition are read interchangeably via `camera || composition` —
 * whichever is filled in wins. That makes the schema rule below load-bearing for clarity, not cosmetic:
 * get it wrong and nothing crashes, but every LLM reading the block downstream gets mis-signaled medium.
 *
 * SCHEMA CONVENTIONS
 * - Exactly one of <camera> / <composition> per style (never both, never neither — "none" excepted):
 *     <camera>       simulated lens optics: real photography, cinema, video/found-footage capture,
 *                    or a physical object/diorama shot with a (simulated) macro lens.
 *     <composition>  no simulated lens optics: flat 2D/vector art, hand-drawn or painted illustration,
 *                    orthographic/isometric projection, print or craft reproduction.
 * - `negative_prompt` is an isolated root property, never a tag inside `visual_engine`. That's what
 *   keeps it out of the positive T5 text stream — optics.js's `parse_visual_engine` always overwrites
 *   any in-XML value with this field, so an in-XML `<negative_prompt>` would just be dead weight.
 * - `negative_prompt` should only hold style-DIFFERENTIATING exclusions (the rival mediums/aesthetics
 *   this style must not drift into). Generic quality guards — blur, watermark, bad anatomy, "no
 *   humans" — are already injected globally in visual.svelte.js; repeating them here just bloats
 *   every request with tokens that get deduplicated away anyway.
 * - `tags` are not UI-only metadata — they're folded verbatim into both generation paths above. Keep
 *   them as real visual descriptors, not administrative labels (e.g. never "default" — that string is
 *   already a reserved sentinel in optics.js's style-resolution fallback chain).
 * - `category` groups related styles for readability/maintenance in this file and gives any future UI
 *   a ready-made grouping key. Nothing downstream reads it yet — VisualWing.svelte currently sorts
 *   Object.values(VISUAL_STYLES) flat, alphabetically by `name` — so reordering entries here is always
 *   safe and never changes what the user sees in the picker.
 * - Never rename or remove a registry key without updating dependencies. `premades.js` stores `visual_style`
 *   by this exact string on individual characters/fractals; renaming one silently orphans every entity already
 *   assigned to it (it just falls back to "none", with no error to warn you).
 *
 * - This file MUST follow the Data Registry file format:
 *   1. This instructional header block.
 *   2. The registry object itself (with inner items separated by `// ---...---` dividers).
 *   3. A CHANGELOG block at the very bottom of the file.
 * @typedef {Object} VisualStyle
 * @property {string} id - Unique identifier matching the registry key
 * @property {string} name - Display title shown in UI dropdowns
 * @property {string} category - Grouping label for source organization (not yet UI-consumed)
 * @property {string} portrait - Preview thumbnail asset path
 * @property {string} description - Detailed aesthetic summary for tooltips
 * @property {string[]} tags - Visual descriptor keywords — injected into generation, not just UI
 * @property {string} visual_engine - Injected XML prompt block (medium, palette, camera OR composition, texture)
 * @property {string} negative_prompt - Style-differentiating negative prompt, isolated from visual_engine
 */

/** @type {Record<string, VisualStyle>} */
export const VISUAL_STYLES = {
  none: {
    id: "none",
    name: "No Visual Style",
    category: "None",
    portrait: "https://user.uploads.dev/file/f968b744a4afde6ab81c0e751dc5e972.png",
    description: "Raw prompt generation without any visual style tokens or negative prompts injected.",
    tags: ["none", "raw", "unmodified"],
    visual_engine: "",
    negative_prompt: "",
  },

  // ---------------------------------------------------------------------------------------------
  // PHOTOGRAPHIC & LENS-CAPTURED
  // Real or simulated camera optics, from polished studio glass down to a cracked phone lens.
  // Every entry in this category uses <camera>.
  // ---------------------------------------------------------------------------------------------

  photo: {
    id: "photo",
    name: "RAW Photography",
    category: "Photographic & Lens-Captured",
    portrait: "https://user.uploads.dev/file/f3cf9efe77281754064a6629e354d799.png",
    description: "Unfiltered commercial photography captured with high-end medium format optics, natural dynamic range, and rich micro-textures.",
    tags: ["photography", "realistic", "standard", "raw", "lifelike", "hasselblad"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>RAW commercial photograph, unedited sensor capture</medium>\n<palette>natural dynamic range, neutral balance, naturalistic key and fill lighting</palette>\n<camera>Hasselblad X2D 100C, 85mm prime f/1.2 lens, shallow depth of field, crisp optical focus</camera>\n<texture>natural micro-details, true-to-life surface textures, fine material weave, natural glass refraction</texture>\n</VISUAL_ENGINE>",
    negative_prompt:
      "anime, illustration, 3d render, cartoon, drawing, painting, digital painting, glossy skin, smooth airbrushed, amateur snapshot, harsh flash glare",
  },

  amateur: {
    id: "amateur",
    name: "Amateur Smartphone Snap",
    category: "Photographic & Lens-Captured",
    portrait: "https://user.uploads.dev/file/0bb4f7bd1737684ea227e701d3566c5e.png",
    description:
      "Casual unprepared smartphone photo featuring extremely unremarkable everyday realism, candid mirror selfie perspective, awkward angles, unposed framing, and accidental direct flash glare.",
    tags: ["amateur", "iphone", "snapshot", "mirror_selfie", "candid", "casual", "unremarkable", "unprepared", "flash_photo", "raw"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>extremely unremarkable candid smartphone photo, casual unprepared mobile phone snapshot, candid mirror selfie capture</medium>\n<palette>casual uncalibrated ambient room lighting, harsh direct phone flash glare, unedited realistic everyday color cast</palette>\n<camera>handheld iPhone camera lens, awkward off-center handheld framing, spontaneous candid angle, quick unposed mirror selfie snapshot perspective</camera>\n<texture>digital sensor noise, slight motion blur smudge, harsh flash specular highlights, subtle lens smudge haze, subtle jpeg compression artifacts</texture>\n</VISUAL_ENGINE>",
    negative_prompt:
      "professional photograph, Hasselblad, studio lighting, flawless retouching, cinematic color grading, dramatic posing, polished model photoshoot, bokeh, 3d render, illustration, artwork",
  },

  fashion: {
    id: "fashion",
    name: "Fashion Magazine",
    category: "Photographic & Lens-Captured",
    portrait: "https://user.uploads.dev/file/2112636b40fd390a0a7654395f608c59.png",
    description:
      "Sleek high-fashion editorial aesthetic with opulent champagne gold and platinum tones, dramatic studio rim lighting, in the style of a Vogue cover shoot.",
    tags: ["fashion", "editorial", "magazine", "vogue", "glamour", "high_fashion"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>high-fashion editorial photography in the style of Vogue magazine cover shoot</medium>\n<palette>opulent champagne gold, platinum white, deep rose, dramatic studio rim lighting</palette>\n<camera>85mm fashion editorial lens, crisp studio key light, polished beauty dish lighting</camera>\n<texture>sleek polished editorial print quality, crisp high-fashion detail, flawless editorial finish</texture>\n</VISUAL_ENGINE>",
    negative_prompt:
      "text, typography, watermark, logo, magazine cover text, title letters, white background, light background, bright background, rugged grunge texture, cartoon comic dots, photorealistic human skin pores, sketchy pencil lines, noisy camera grain, heavy drop shadows",
  },

  cinematic: {
    id: "cinematic",
    name: "Cinematic Film",
    category: "Photographic & Lens-Captured",
    portrait: "https://user.uploads.dev/file/67a672baf7752bf089eea071f15a9ca9.png",
    description:
      "Atmospheric widescreen cinema shot featuring 35mm anamorphic optics, volumetric light shafts, dramatic crushed shadows, and cinematic color grading.",
    tags: ["cinematic", "film", "volumetric", "anamorphic", "movie", "dramatic", "shadows"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>widescreen 35mm cinematic feature film capture</medium>\n<palette>dramatic cinematic color grade, volumetric light shafts, deep crushed shadow voids, warm key and cold fill lighting</palette>\n<camera>35mm anamorphic prime lens, shallow depth of field, optical lens flare, dramatic wide-angle perspective</camera>\n<texture>subtle organic 35mm film grain, atmospheric volumetric dust haze, rich specular highlights</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "amateur photo, flat lighting, 2d drawing, cartoon, anime, low poly, noisy, distorted features, raw snapshot, vector",
  },

  noir: {
    id: "noir",
    name: "Film Noir",
    category: "Photographic & Lens-Captured",
    portrait: "https://user.uploads.dev/file/26f37e3915eaabab9248491fc3687f2e.png",
    description:
      "Classic 1940s detective cinema aesthetic featuring high-contrast black and white, hard chiaroscuro shadows, and venetian blind light beams.",
    tags: ["film_noir", "monochrome", "detective", "1940s", "shadows"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>1940s monochrome cinema frame, silver gelatin film print</medium>\n<palette>high contrast black and white, deep shadow voids, harsh key lighting, silver midtones</palette>\n<camera>35mm vintage camera, hard-edge shadows, chiaroscuro lighting, dutch angle tilt</camera>\n<texture>organic medium film grain, cigarette smoke haze, wet pavement reflections</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "color, vibrant, saturated, modern, digital, anime, cartoon, illustration, 3d render",
  },

  polaroid: {
    id: "polaroid",
    name: "Vintage 35mm Film",
    category: "Photographic & Lens-Captured",
    portrait: "https://user.uploads.dev/file/c7f758d7f2997cf541d721fb428e77cf.png",
    description: "Authentic 35mm film photo with warm Kodak Portra saturation, organic grain structure, soft lens fall-off, and subtle light leaks.",
    tags: ["analog", "35mm", "vintage", "film", "retro", "photography"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>35mm analog photo scan, street documentary capture</medium>\n<palette>warm Kodak Portra 400 color profile, golden hour sidelighting, organic color bleeding</palette>\n<camera>Leica rangefinder, 35mm f/2.0 lens, soft focal edge roll-off</camera>\n<texture>authentic 35mm film stock grain, subtle light leak anomalies, soft shadow roll-off</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "digital, glossy, 3d render, anime, harsh digital sharpness, vector, cgi, black and white, monochrome",
  },

  vhs: {
    id: "vhs",
    name: "VHS Found Footage",
    category: "Photographic & Lens-Captured",
    portrait: "https://user.uploads.dev/file/644012b0a426a455889d5a8881d69e72.png",
    description:
      "Uncanny lofi 1990s analog found footage video frame featuring mysterious unexplained atmosphere, heavy magnetic tracking glitch artifacts, motion blur static distortion, and unsettling analog horror tape realism.",
    tags: ["vhs", "found_footage", "uncanny", "analog_horror", "mysterious", "glitch", "blurry", "camcorder", "unexplained"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>mysterious uncanny found footage VHS video screen capture, low-fi analog horror magnetic tape frame</medium>\n<palette>unsettling washed-out low-light shadows, eerie green and desaturated phosphor cast, harsh grainy shadow noise</palette>\n<camera>shaky handheld consumer camcorder optics, out-of-focus motion blur framing, unsettling wide-angle perspective, low resolution lens distortion</camera>\n<texture>heavy magnetic static blur, corrupt VHS tracking glitch bars, horizontal tear lines, unexplained video artifacts, chromatic bleeding, blurred ghosting edges</texture>\n</VISUAL_ENGINE>",
    negative_prompt:
      "crisp 4k, sharp focus, modern digital camera, vibrant colors, clean studio lighting, 3d render, vector, oil painting, illustration",
  },

  cctv: {
    id: "cctv",
    name: "Surveillance / CCTV",
    category: "Photographic & Lens-Captured",
    portrait: "https://user.uploads.dev/file/ea9f523b0c23c7af252b71010b88b24e.png",
    description:
      "High-angle security camera CCTV screen capture featuring prominent horizontal scanline stripes, video interlacing tear lines, digital compression glitch artifacts, washed-out desaturated monitor colors, timestamp overlay, and fisheye lens distortion.",
    tags: ["surveillance", "cctv", "security", "glitch", "scanlines", "striped_artifacts", "found_footage", "interlacing"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>glitchy security camera video frame capture, low-bitrate CCTV surveillance screen capture, distorted security monitor photo</medium>\n<palette>low-color washed-out desaturated security monitor tones, harsh dark contrast shadows, high digital sensor noise, subtle muted phosphor cast</palette>\n<camera>ceiling-mounted wide-angle fisheye security lens, steep top-down security camera angle, high-corner surveillance perspective</camera>\n<texture>prominent horizontal scanline stripes, video interlacing tear lines, digital compression glitch artifacts, corrupt pixel striping, timestamp overlay graphics, heavy video compression noise</texture>\n</VISUAL_ENGINE>",
    negative_prompt:
      "crisp 4k photo, cinematic studio lighting, professional photograph, vibrant full color, green night vision single-tint, 3d render, vector, oil painting, illustration, clean pristine digital video",
  },

  // ---------------------------------------------------------------------------------------------
  // ANIMATION & STYLIZED MOTION
  // Cel, hand-paint, and CG animation traditions. Every entry uses <composition> except the CG
  // entry, which simulates a rendered camera and so keeps <camera>.
  // ---------------------------------------------------------------------------------------------

  anime: {
    id: "anime",
    name: "Anime & Manga (Ecchi)",
    category: "Animation & Stylized Motion",
    portrait: "https://user.uploads.dev/file/293e5b0c1e675dd32d6f0eb968a47e50.png",
    description:
      "Vibrant cel-shaded Japanese anime & manga art style with clean line work, expressive key framing, stylized proportions, and mildly suggestive ecchi-flavored fan-service tones.",
    tags: ["anime", "manga", "ecchi", "cel_shading", "illustration", "2d", "stylized"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>Japanese anime and manga cel-shaded 2D illustration in the style of adult ecchi anime and manga art</medium>\n<palette>vibrant saturated anime colors, clean flat cel shading with sharp rim light accents</palette>\n<composition>dynamic dramatic anime keyframe angles, foreshortened perspective, expressive focal framing</composition>\n<texture>smooth crisp anime ink line art, flat color fills with subtle gradient shading</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, realistic human skin pores, 3d render, oil painting, watercolor, rough charcoal sketch, crosshatching, raw photo",
  },

  ghibli: {
    id: "ghibli",
    name: "Studio Ghibli",
    category: "Animation & Stylized Motion",
    portrait: "https://user.uploads.dev/file/4aaf95f0ba916c7498c960abb4ecd87e.png",
    description: "Warm hand-painted animation style with lush scenic landscapes, soft watercolor wash backgrounds, and nostalgic warmth.",
    tags: ["studio_ghibli", "anime", "hand_painted", "nostalgic", "whimsical"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>hand-painted anime animation cel in the style of Studio Ghibli and Hayao Miyazaki, traditional 2d film frame</medium>\n<palette>warm earthy tones, soft pastel skies, lush green landscapes, gentle golden light</palette>\n<composition>wide establishing environmental layout, gentle framing, intimate focal subject with soft background depth</composition>\n<texture>hand-painted watercolor backgrounds, soft cel shading on characters, visible brush texture</texture>\n</VISUAL_ENGINE>",
    negative_prompt:
      "photograph, 3d render, realistic, dark, gritty, cyberpunk, harsh neon lighting, photorealism, flat cel-shaded modern anime linework",
  },

  disney: {
    id: "disney",
    name: "Classic 2D (Disney)",
    category: "Animation & Stylized Motion",
    portrait: "https://user.uploads.dev/file/ab3d3721f029e356d540c524df0d876d.png",
    description:
      "Golden-age hand-drawn 2D animation featuring ink-and-paint animation cels, fluid expressive draftsmanship, painterly gouache backgrounds, and fairytale warmth in the style of Walt Disney.",
    tags: ["disney", "2d", "classic_animation", "hand_drawn", "cel_art", "vintage_animation", "fairytale"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>golden age 2d feature animation cel in the style of classic Walt Disney hand-drawn animation</medium>\n<palette>warm theatrical key lighting, luminous fairytale jewel tones, soft pastel background washes</palette>\n<composition>expressive storytelling staging, theatrical silhouette, sweeping organic curves</composition>\n<texture>clean hand-inked cel outlines, matte gouache background paint, subtle analog film scan texture</texture>\n</VISUAL_ENGINE>",
    negative_prompt:
      "3d render, cgi, photorealistic, raw photograph, sharp digital vector, modern 3d animation, low poly, noisy, anime cel shading, cyberpunk",
  },

  pixar: {
    id: "pixar",
    name: "3D Animation (Pixar)",
    category: "Animation & Stylized Motion",
    portrait: "https://user.uploads.dev/file/27615c2c471da91f2052c4505a945053.png",
    description:
      "Stylized 3D animated movie aesthetic with soft subsurface scattering, expressive lighting, and polished studio warmth in the style of Pixar.",
    tags: ["cgi", "animation", "3d", "stylized", "pixar"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>3d animated feature film digital art in the style of Pixar feature films</medium>\n<palette>warm studio key lighting, soft rim light glow, harmonious pastel color palette</palette>\n<camera>35mm digital feature film setup, shallow depth of field, intimate focal framing</camera>\n<texture>soft subsurface skin scattering, velvety fabric textures, smooth polished CGI surfaces</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, grainy, raw film, realistic human skin pores, rough impasto, 2d drawing, vector, line art",
  },

  // ---------------------------------------------------------------------------------------------
  // GAME & DIGITAL RENDER
  // Video-game-native visuals. three_d_render simulates a rendered camera (<camera>); the other
  // two are flat/orthographic with no simulated lens, so they correctly stay on <composition>.
  // ---------------------------------------------------------------------------------------------

  unreal_engine: {
    id: "unreal_engine",
    name: "3D Render (UE5)",
    category: "Game & Digital Render",
    portrait: "https://user.uploads.dev/file/bffd329357dc15037b5af9d2a7dbb45f.png",
    description:
      "High-concept 3D scene powered by Unreal Engine 5 optics, featuring ray-traced global illumination, physically based materials, and ambient occlusion.",
    tags: ["3d_render", "ue5", "unreal_engine", "cgi", "raytracing"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>Unreal Engine 5 architectural 3d scene render</medium>\n<palette>physically based lighting, volumetric light shafts, ray-traced global illumination</palette>\n<camera>cinematic 35mm focal setup, accurate specular reflections, ambient occlusion depth</camera>\n<texture>crisp 3d asset definition, physically based material shaders, ray-traced reflections</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "flat 2d, illustration, drawing, watercolor, low poly, noisy, anime, painting, sketch",
  },

  isometric_3d: {
    id: "isometric_3d",
    name: "Isometric 3D / Low-Poly",
    category: "Game & Digital Render",
    portrait: "https://user.uploads.dev/file/5e3cdfcde02ff1d1d9c2c5f0588dd4ae.png",
    description: "Clean orthographic 3D vector aesthetic with geometric low-poly models, soft ambient occlusion, and vibrant flat shading.",
    tags: ["isometric", "low_poly", "vector", "3d", "orthographic", "game_art"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>isometric 3d vector model, low-poly digital art</medium>\n<palette>clean vibrant color blocking, soft directional sunlight, gentle ambient occlusion shadows</palette>\n<composition>fixed 45-degree orthographic projection, grid-aligned spatial arrangement</composition>\n<texture>smooth faceted polygon surfaces, crisp vector edges, flat matte materials</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "perspective distortion, photorealistic textures, organic noise, lens flare, film grain, hyperrealism",
  },

  pixel: {
    id: "pixel",
    name: "Pixel Art",
    category: "Game & Digital Render",
    portrait: "https://user.uploads.dev/file/87f3a245a478d2bdfeb284e5d8a83327.png",
    description: "Retro 16-bit video game sprite aesthetic featuring a limited color palette, crisp blocky pixel grids, and dithered shading.",
    tags: ["pixel_art", "retro", "16bit", "dithered", "indie_game"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>retro pixel art, 16-bit video game sprite</medium>\n<palette>limited 32-color palette, dithered shading, vibrant contrasting colors</palette>\n<composition>fixed orthographic perspective, side-scroller or top-down grid alignment</composition>\n<texture>crisp square pixels, visible dithering patterns, zero anti-aliasing, blocky forms</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, realistic, smooth, anti-aliased, high resolution, 3d render, oil painting, camera lens, vector",
  },

  // ---------------------------------------------------------------------------------------------
  // MINIATURE & PHYSICAL CRAFT PHOTOGRAPHY
  // A real, tangible object built by hand and shot on a macro lens — not an illustration OF a
  // craft medium. All three entries use <camera>. (papercraft was reclassified into this group —
  // see the changelog note at the end of this file.)
  // ---------------------------------------------------------------------------------------------

  clay: {
    id: "clay",
    name: "Claymation & Stop-Motion",
    category: "Miniature & Physical Craft Photography",
    portrait: "https://user.uploads.dev/file/1be495044d258e39e940aa68eaa04c5f.png",
    description: "Tactile stop-motion plasticine animation style with visible thumbprints, miniature set depth, and soft physical lighting.",
    tags: ["claymation", "stop_motion", "clay", "tactile", "sculpture", "animation"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>claymation stop-motion animation capture in the style of Aardman animations, plasticine sculpture</medium>\n<palette>saturated physical clay pigments, soft studio warm spotlighting</palette>\n<camera>50mm macro lens, shallow depth of field, miniature physical set perspective</camera>\n<texture>visible finger impressions in clay, subtle seam lines, matte plasticine texture, felt background materials</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "digital vector, smooth CGI, glossy render, photograph of real human, flat 2d, drawing",
  },

  lego: {
    id: "lego",
    name: "LEGO® Bricks / Plastic Toy",
    category: "Miniature & Physical Craft Photography",
    // TODO(assets): shares this thumbnail with `papercraft` below — generate & upload a unique portrait.
    portrait: "https://user.uploads.dev/file/db3cb7104f2da620eccc08dc5f535988.png",
    description:
      "Blocky plastic construction toy aesthetic featuring minifigure characters with cylindrical rotatable heads and U-shaped hands, brick-built background architecture with visible interlocking studs, injection-molded ABS plastic glossy texture, and tilt-shift macro lens depth.",
    tags: ["lego", "bricks", "plastic", "toy", "minifigure", "blocky", "construction_set", "macro"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>plastic toy construction brick artwork, blocky LEGO minifigure character illustration, brick-built macro diorama model</medium>\n<palette>vibrant primary ABS plastic colors, glossy solid yellow minifigure skin tones, rich bold brick red, bright blue, vibrant yellow, green, and black plastic blocks</palette>\n<camera>60mm macro lens photography, shallow depth of field, tilt-shift miniature set focal perspective, eye-level toy camera shot</camera>\n<texture>glossy injection-molded ABS plastic surfaces, visible circular interlocking plastic studs with embossed logo micro-detail, plastic mold seam lines, crisp smooth plastic reflections</texture>\n</VISUAL_ENGINE>",
    negative_prompt:
      "photorealistic human skin pores, organic human features, realistic anatomical human joints, smooth paper drawing, watercolor, 3d CGI film rendering, cloth fabric weave, soft metallic bronze, natural organic foliage",
  },

  paper: {
    id: "paper",
    name: "Papercraft",
    category: "Miniature & Physical Craft Photography",
    // TODO(assets): shares this thumbnail with `lego_bricks` above — generate & upload a unique portrait.
    portrait: "https://user.uploads.dev/file/db3cb7104f2da620eccc08dc5f535988.png",
    description:
      "Macro-photographed papercraft diorama built from layered, hand-cut construction paper and card stock — shot and lit like a real tabletop miniature rather than drawn as a flat illustration, with tactile depth and soft paper-edge shadows.",
    tags: ["papercraft", "paper", "cut_paper", "diorama", "miniature", "macro_photography", "tactile", "layered"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>macro-photographed papercraft diorama, a tangible miniature set built from layered cut construction paper and card stock</medium>\n<palette>flat saturated construction-paper hues, soft pastel gradient washes between paper layers, warm directional studio spotlighting</palette>\n<camera>60mm macro lens photography, shallow depth of field, tilt-shift miniature-set perspective, low raking sidelight carving out paper-edge shadows</camera>\n<texture>visible fibrous paper grain, crisp die-cut edges, stacked drop shadows between depth planes, gentle finger-pressed creases, matte uncoated paper surface</texture>\n</VISUAL_ENGINE>",
    negative_prompt:
      "flat vector illustration, digital collage, photorealistic human skin, 3d CGI render, glossy injection-molded plastic, painted canvas texture, watercolor bleed",
  },

  // ---------------------------------------------------------------------------------------------
  // COMIC, PRINT & GRAPHIC DESIGN
  // Flat illustrated art that deliberately quotes a physical reproduction process — halftone
  // dots, carved woodblock, leaded glass, spot-color ink. Every entry uses <composition>.
  // ---------------------------------------------------------------------------------------------

  comic: {
    id: "comic",
    name: "Comic Book",
    category: "Comic, Print & Graphic Design",
    portrait: "https://user.uploads.dev/file/861133eb1b50d4e3c957c0e8402ea5f2.png",
    description: "Bold graphic novel artwork featuring heavy black ink outlines, halftone dot shading, and high-contrast dynamic framing.",
    tags: ["comic_book", "ink", "graphic_novel", "halftone", "bold"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>comic book illustration in the style of Marvel and DC comic book art, bold inked graphic novel art</medium>\n<palette>flat bold primary colors with halftone dot shading, high contrast saturation</palette>\n<composition>dynamic foreshortened angles, dramatic panel composition, action-oriented framing</composition>\n<texture>heavy black ink outlines, visible halftone screen tones, crosshatching shading</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, realistic, 3d render, soft watercolor, oil painting, smooth airbrush, Ben-Day dot screenprint poster",
  },

  pop: {
    id: "pop",
    name: "Pop Art",
    category: "Comic, Print & Graphic Design",
    portrait: "https://user.uploads.dev/file/8859b844589de004573bac55fd49f96e.png",
    description:
      "Bold Ben-Day dot pop art with explosive action starbursts, primary yellow, vibrant magenta, and electric cyan in a comic-inspired graphic style.",
    tags: ["pop_art", "ben_day", "halftone", "bold", "graphic", "warhol", "lichtenstein"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>bold pop art illustration in the style of Roy Lichtenstein and Andy Warhol, Ben-Day dot halftone print</medium>\n<palette>primary yellow, vibrant magenta, electric cyan, bold flat primary color blocks</palette>\n<composition>dynamic action starburst framing, bold poster-scale focal close-up, flat graphic silhouette staging</composition>\n<texture>Ben-Day dot halftone patterns, thick black ink outlines, flat opaque color blocks, newsprint dot screen</texture>\n</VISUAL_ENGINE>",
    negative_prompt:
      "white background, light background, bright background, realistic photo, subtle muted pastel wash, dark moody gothic, photorealistic skin, blurry lines, noisy camera grain, heavy drop shadows",
  },

  risograph: {
    id: "risograph",
    name: "Risograph Print",
    category: "Comic, Print & Graphic Design",
    portrait: "https://user.uploads.dev/file/cc3c346e67befef2962db45f388fdbf8.png",
    description: "Tactile spot-color print aesthetic featuring overlapping vivid inks, subtle registration misalignment, and dithered paper texture.",
    tags: ["risograph", "printmaking", "retro", "dithered", "tactile", "spot_color"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>risograph spot-color print illustration</medium>\n<palette>dual-tone neon pink and sunflower yellow inks, overlapping color translucent bleeds</palette>\n<composition>graphic poster layout, bold shapes, intentional negative space balance</composition>\n<texture>heavy tooth recycled paper texture, grain dithering, subtle ink registration misalignment</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, 3d render, smooth gradient, hyperrealistic, glossy, realistic skin",
  },

  wood: {
    id: "wood",
    name: "Ukiyo-e Woodblock Print",
    category: "Comic, Print & Graphic Design",
    portrait: "https://user.uploads.dev/file/c6978746b0f5ae93937c7890fced148c.png",
    description:
      "Traditional Edo-period Japanese woodblock print featuring organic sumi-e ink contours, flat mineral pigments, and subtle wood grain impressions.",
    tags: ["ukiyo_e", "japanese", "woodblock", "traditional", "print", "hokusai"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>traditional Edo-period ukiyo-e woodblock print in the style of Hokusai</medium>\n<palette>flat mineral pigments, indigo blue, burnt orange, muted cream, sumi-e black ink</palette>\n<composition>asymmetrical Japanese layout, flat space perspective, atmospheric horizon wave framing</composition>\n<texture>visible relief wood grain impressions, fibrous hand-pressed washi paper texture</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, modern 3d render, glossy reflections, volumetric lighting, oil painting, western comics",
  },

  stained: {
    id: "stained",
    name: "Stained Glass",
    category: "Comic, Print & Graphic Design",
    portrait: "https://user.uploads.dev/file/b24924f2fd7d826540b4f2757dad7767.png",
    description: "Gothic cathedral stained glass artwork with backlit translucent jewel-toned glass panels and dark lead came borders.",
    tags: ["stained_glass", "gothic", "mosaic", "glass", "backlit", "artisan"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>gothic cathedral stained glass window mosaic</medium>\n<palette>luminous backlit ruby red, cobalt blue, and emerald green translucent glass panels</palette>\n<composition>symmetrical architectural framing, arched window border layout</composition>\n<texture>thick black lead came soldering contours, subtle glass air bubbles, crackled surface refractions</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, realistic skin, 3d digital render, canvas, paper drawing, flat vector",
  },

  // ---------------------------------------------------------------------------------------------
  // TRADITIONAL PAINTING & DRAWING
  // Physical-media fine art and figure studies, from full-color paint down to bare pencil line.
  // Every entry uses <composition>.
  // ---------------------------------------------------------------------------------------------

  oil: {
    id: "oil",
    name: "Oil Painting",
    category: "Traditional Painting & Drawing",
    portrait: "https://user.uploads.dev/file/29d4709051646f4e5bffbbd0f34e2048.png",
    description: "Classical fine art oil painting with thick impasto brushwork, layered glazes, rich chiaroscuro, and luminous depth.",
    tags: ["oil_painting", "classical", "impasto", "traditional", "baroque"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>thick impasto oil painting in the style of Michelangelo and Rembrandt, classical fine art masterwork</medium>\n<palette>rich layered glazes, warm earth tones, deep chiaroscuro, varnished luminous depth</palette>\n<composition>baroque triangular composition, dramatic atmospheric staging</composition>\n<texture>visible thick brush strokes, palette knife marks, canvas weave texture, crackled glaze</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, digital, smooth, flat, cel_shaded, anime, vector, camera lens, 3d render",
  },

  water: {
    id: "water",
    name: "Watercolor",
    category: "Traditional Painting & Drawing",
    portrait: "https://user.uploads.dev/file/115456547820baafccc89970b7c5fb7a.png",
    description:
      "Delicate watercolor painting featuring soft wet-on-wet washes, pigment diffusion bleeding, granulating textures, and translucent layering.",
    tags: ["watercolor", "painting", "organic", "soft", "translucent"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>delicate watercolor painting, wet-on-wet technique</medium>\n<palette>soft translucent washes, bleeding pigment edges, pastel undertones with granulating textures</palette>\n<composition>fluid organic framing, gentle vignetting, soft negative space balance</composition>\n<texture>cold-press paper grain texture visible through washes, pooling water marks, dry brush accents</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, 3d render, sharp hard edges, digital, vector, cel_shaded, camera lens, heavy oil impasto",
  },

  charcoal: {
    id: "charcoal",
    name: "Charcoal & Graphite",
    category: "Traditional Painting & Drawing",
    portrait: "https://user.uploads.dev/file/5658673d879658c2dd722fdf1791f688.png",
    description: "Raw charcoal and graphite study with dramatic chiaroscuro, gestural strokes, smudged shading, and heavy paper texture.",
    tags: ["charcoal", "sketch", "graphite", "monochrome", "drawing", "chiaroscuro"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>smudged charcoal drawing in the style of Edgar Degas and John Singer Sargent, gestural graphite study</medium>\n<palette>deep velvety blacks, rich gray tonal gradients, stark white paper highlights</palette>\n<composition>dramatic chiaroscuro framing, expressive atmospheric focus</composition>\n<texture>heavy tooth cotton paper grain, dusty charcoal smudge marks, crosshatched graphite lines</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "color, digital painting, smooth vector, clean lines, 3d render, photo, cel_shaded, neon",
  },

  ink: {
    id: "ink",
    name: "Ink & Line Art",
    category: "Traditional Painting & Drawing",
    portrait: "https://user.uploads.dev/file/1f4f30768cf1b5b17226f698bdbd72b6.png",
    description: "Detailed monochrome ink drawing with fine nib pen lines, dense crosshatching, stippling, and classical engraving feel.",
    tags: ["ink", "line_art", "sketch", "monochrome", "crosshatching", "drawing"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>detailed ink drawing in the style of Albrecht Dürer, minimalist fine line art sketch</medium>\n<palette>stark monochrome black ink on textured cream paper, subtle wash gradients</palette>\n<composition>clean minimalist layout, intentional utilization of negative space, crisp subject outline</composition>\n<texture>fine nib pen strokes, dense crosshatching shading, paper grain texture, stippling</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, 3d render, vibrant colors, blurry, soft gradients, cel_shaded, watercolor, oil painting",
  },

  tom: {
    id: "tom",
    name: "Tom of Finland",
    category: "Traditional Painting & Drawing",
    portrait: "https://user.uploads.dev/file/74be269263eccaeae62c04b90601bc75.png",
    description:
      "Iconic hyper-masculine pencil and graphite illustration featuring bold muscular contours, polished black leather, and high-contrast draftsmanship in the style of Tom of Finland.",
    tags: ["tom_of_finland", "graphite", "hyper_masculine", "leather", "erotic_art", "drawing"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>hyper-masculine pencil and graphite illustration in the style of Tom of Finland</medium>\n<palette>rich graphite monochrome, deep velvety blacks, stark white paper highlights, polished leather shine</palette>\n<composition>bold heroic framing, accentuated anatomical and structural curves, high-contrast perspective</composition>\n<texture>smooth shaded graphite, dense pencil crosshatching shading, gleaming leather texture, heavy cotton paper grain</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "color, photograph, 3d render, soft watercolor, pastel wash, anime, cel-shaded, digital vector, low contrast",
  },

  blueprint: {
    id: "blueprint",
    name: "Architectural Blueprint / Da Vinci Sketch",
    category: "Traditional Painting & Drawing",
    portrait: "https://user.uploads.dev/file/b531d8e2c49c83e7fcd7625abceeedd5.png",
    description:
      "Renaissance invention manuscript sketch in the style of Leonardo da Vinci's Vitruvian Man, featuring sepia ink drawings, intricate anatomical and architectural proportion geometry circles, mirror-writing notes, and faded aged parchment paper texture.",
    tags: ["blueprint", "sketch", "da_vinci", "vitruvian_man", "renaissance", "invention", "drafting", "schematic", "anatomical"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>Renaissance invention sketch illustration in the style of Leonardo da Vinci manuscript drawings and Vitruvian Man architectural studies</medium>\n<palette>aged sepia ink tones, warm parchment tan, dark brown iron gall ink, subtle tea-stained paper wash</palette>\n<composition>Vitruvian Man proportion framing, geometric alignment circles and square overlays, mirrored Renaissance cursive handwriting margins</composition>\n<texture>fine nib quill pen ink strokes, aged fibrous parchment paper texture, foxing spots, faded geometric drafting guide lines</texture>\n</VISUAL_ENGINE>",
    negative_prompt:
      "cyanotype blue paper, white blueprint CAD lines, 3d render, photograph, vibrant colors, modern digital illustration, vector art, smooth airbrush",
  },

  doodle: {
    id: "doodle",
    name: "Notebook Doodle",
    category: "Traditional Painting & Drawing",
    portrait: "https://user.uploads.dev/file/34dc78c445a2749a4cc1dff08db37033.png",
    description:
      "Casual ballpoint pen and marker doodles drawn in notebook margins, featuring quirky line art, ink bleeds, scribbled shading, and spontaneous hand-drawn energy.",
    tags: ["doodle", "sketch", "notebook", "scribble", "margin_art", "casual", "hand_drawn"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>casual notebook margin doodle, ballpoint pen ink drawing</medium>\n<palette>blue and black ballpoint ink on grid-lined paper, subtle highlighter accents</palette>\n<composition>loose spontaneous margin layout, asymmetric framing, playful quirky proportions</composition>\n<texture>hand-drawn pen scribbles, ink bleed pooling, blue lined paper grid, soft paper creases</texture>\n</VISUAL_ENGINE>",
    negative_prompt:
      "3d render, photograph, polished digital artwork, smooth digital gradient, vector, studio lighting, hyperrealistic, oil painting",
  },

  // ---------------------------------------------------------------------------------------------
  // CONCEPT, GENRE & FANTASY ILLUSTRATION
  // Painterly digital or gouache illustration built for narrative/genre staging rather than
  // reference-accurate optics. Every entry uses <composition>, including steampunk (see the
  // changelog note — it previously used <camera> despite being described as a rendered "concept
  // design", inconsistent with concept_art right above it).
  // ---------------------------------------------------------------------------------------------

  concept: {
    id: "concept",
    name: "Concept Art (Design Sheet)",
    category: "Concept, Genre & Fantasy Illustration",
    // TODO(assets): shares this thumbnail with `dark_fantasy` below — generate & upload a unique portrait.
    portrait: "https://user.uploads.dev/file/9d94edf2d5b3a1964d38faddb22f7537.png",
    description:
      "Exploratory production design sheet featuring multiple angles, rough developmental sketches alongside polished renders, detailed callouts, and orthographic turnarounds on a neutral studio background.",
    tags: ["concept_art", "concept_sheet", "model_sheet", "turnaround", "sketches", "exploration", "production_art", "multiple_angles"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>production design sheet, exploratory model sheet, rough developmental sketches and polished renders</medium>\n<palette>neutral studio gray background, clear focal colors, subtle graphite and blue pencil sketch lines</palette>\n<composition>multi-angle orthographic turnaround layout, grid-aligned developmental sketches, structural callouts, flat presentation sheet framing</composition>\n<texture>smooth digital canvas, rough pencil strokes, clean ink lines, flat color blocking</texture>\n</VISUAL_ENGINE>",
    negative_prompt:
      "cinematic keyframe, single scene, atmospheric background, landscape photography, immersive environment, dense clutter, photorealism, raw camera snapshot, 3d CAD render, vector graphics",
  },

  fantasy: {
    id: "fantasy",
    name: "Fantasy",
    category: "Concept, Genre & Fantasy Illustration",
    // TODO(assets): shares this thumbnail with `concept_art` above — generate & upload a unique portrait.
    portrait: "https://user.uploads.dev/file/9d94edf2d5b3a1964d38faddb22f7537.png",
    description:
      "High fantasy illustration with a subtly moody, atmospheric edge, featuring sweeping mythic environments, weathered textures, and dramatic lighting.",
    tags: ["fantasy", "mythic", "atmospheric", "dark_fantasy", "epic", "illustration"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>high fantasy concept art, mythic digital illustration</medium>\n<palette>rich atmospheric tones, deep shadow play, muted gold and steel accents, dramatic chiaroscuro lighting</palette>\n<composition>sweeping mythic layouts, dramatic atmospheric perspective, grand scale framing</composition>\n<texture>weathered stone, ancient metals, rich fabrics, natural organic textures</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "bright, cheerful, sunny, pastel, cartoon, anime, photograph, modern, neon, synthwave, sci-fi",
  },

  pulp: {
    id: "pulp",
    name: "Retro Pulp Cover",
    category: "Concept, Genre & Fantasy Illustration",
    portrait: "https://user.uploads.dev/file/a166f0706f17833ab3990b791d9937ab.png",
    description:
      "Vivid 1950s fantasy and sci-fi paperback book illustration featuring dramatic gouache brushwork, high-strung theatrical staging, and saturated pulp action tones.",
    tags: ["pulp", "retro", "50s", "paperback", "sci-fi", "fantasy", "gouache"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>1950s pulp magazine cover illustration in the style of Frank Frazetta, vintage paperback gouache painting</medium>\n<palette>vivid primary accents, warm cadmium yellow highlights, deep teal shadows, dramatic rim lighting</palette>\n<composition>diagonal dynamic action composition, dramatic hero posing, space for cover typography</composition>\n<texture>visible gouache brush strokes, matte paperboard texture, vintage newsprint color bleed</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "modern 3d render, photograph, clean digital vector, minimalist flat design, cyberpunk neon, anime",
  },

  steampunk: {
    id: "steampunk",
    name: "Steampunk & Dieselpunk",
    category: "Concept, Genre & Fantasy Illustration",
    portrait: "https://user.uploads.dev/file/0f48e8943d5dac6f533b24fa46cc98e3.png",
    description:
      "Victorian industrial steampunk featuring intricate brass clockwork gearworks, copper steam boilers, iron rivets, pressure gauges, exposed mechanical movements, and swirling steam vents.",
    tags: ["steampunk", "dieselpunk", "industrial", "brass", "clockwork", "victorian", "gears", "machinery", "retro_futurism"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>authentic Victorian steampunk mechanical machinery art, intricate industrial clockwork concept design, detailed brass and copper ironwork render</medium>\n<palette>tarnished brass patinas, oxidized copper green accents, heavy cast iron black, warm furnace amber glow, aged oily leather, rich bronze reflections</palette>\n<composition>dense interlocking gearwork framing, macro-to-wide compositional range spanning intricate clockwork close-ups to full mechanical tableaux, dramatic layered industrial depth staging</composition>\n<texture>dense intricate interlocking clockwork gears, brass pressure gauges, copper steam pipes, heavy iron rivets, grease and oil stains, escaping white steam plumes, oxidized metal patina</texture>\n</VISUAL_ENGINE>",
    negative_prompt:
      "anime, manga, cel-shaded, anime face, anime hair, stylized anime character, modern plastic, neon lights, digital cyberpunk, flat vector, clean 2d illustration, simple pipe design, simple background",
  },

  surreal: {
    id: "surreal",
    name: "Surrealism",
    category: "Concept, Genre & Fantasy Illustration",
    portrait: "https://user.uploads.dev/file/fda4ab3f0b48de1fea481d4a8987d8aa.png",
    description: "Dreamlike surrealist painting blending impossible physical geometries, distorted melting perspectives, and subconscious symbolism.",
    tags: ["surrealism", "dreamlike", "abstract", "symbolic", "subconscious"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>surrealist oil painting in the style of Salvador Dalí and René Magritte, dreamlike conceptual artwork</medium>\n<palette>ethereal color gradients, shifting iridescent tones, deep velvety shadows</palette>\n<composition>distorted spatial logic, impossible physical geometry, symbolic layout</composition>\n<texture>smooth blended brushwork with sharp impossible juxtapositions, marble-like polish</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, realistic, mundane, ordinary, plain, documentary, camera lens, corporate design",
  },

  // ---------------------------------------------------------------------------------------------
  // RETRO-FUTURISM & DIGITAL SUBCULTURE
  // Neon-and-nostalgia digital aesthetics. cyberpunk simulates a real lens (<camera>); synthwave
  // and vaporwave are flat graphic/collage art with no simulated lens, so both use <composition>
  // (vaporwave was reclassified — see the changelog note at the end of this file).
  // ---------------------------------------------------------------------------------------------

  cyberpunk: {
    id: "cyberpunk",
    name: "Cyberpunk",
    category: "Retro-Futurism & Digital Subculture",
    portrait: "https://user.uploads.dev/file/643e256027b322312bea15c98e3f937e.png",
    description: "Neon-soaked dystopian aesthetic with wet rain-slicked asphalt, holographic interfaces, and high-tech urban grime.",
    tags: ["cyberpunk", "neon", "scifi", "dystopian", "chrome"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>cyberpunk digital art in the style of Syd Mead and Blade Runner, neon-lit dystopian sci-fi environment</medium>\n<palette>vibrant neon magenta and cyan, deep blacks, holographic iridescent accents, harsh LED lighting</palette>\n<camera>wide-angle anamorphic lens, low angle dramatic perspective, optical lens flares</camera>\n<texture>polished chrome reflections, rain-streaked glass, circuit board patterns, holographic noise</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "medieval, fantasy, natural, pastoral, watercolor, oil painting, antique, sunny, historical",
  },

  synthwave: {
    id: "synthwave",
    name: "Retro Synthwave",
    category: "Retro-Futurism & Digital Subculture",
    portrait: "https://user.uploads.dev/file/f2150b87f7133e099c38bbe384a7eaa1.png",
    description: "1980s retro-futuristic outrun visual style with neon grid horizons, wireframe sunsets, chrome surfaces, and CRT scan lines.",
    tags: ["synthwave", "retro", "80s", "neon", "outrun"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>1980s outrun digital artwork, retro synthwave art</medium>\n<palette>neon magenta and purple gradients, vibrant orange horizon, deep twilight navy blue</palette>\n<composition>low ground perspective, vanishing point perspective grid, wide-angle framing</composition>\n<texture>chrome reflections, glowing neon glass tubes, subtle CRT scanlines, grid floor</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "medieval, natural, realistic, documentary, watercolor, oil painting, historical, pastel, organic, classical statuary",
  },

  vaporwave: {
    id: "vaporwave",
    name: "Vaporwave",
    category: "Retro-Futurism & Digital Subculture",
    portrait: "https://user.uploads.dev/file/f31d7e4611a4d561bfe3becf3404b9dd.png",
    description:
      "Nostalgic 1990s digital collage blending pastel cyan and magenta gradients, classical marble statues, glitch artifacts, and early web aesthetic.",
    tags: ["vaporwave", "90s", "pastel", "glitch", "aesthetic", "lofi", "classical_statuary"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>vaporwave digital collage blending fragments of classical Greco-Roman statuary, retro computer and early-web graphics, and glitch-art layering</medium>\n<palette>pastel cyan, soft lavender, hot pink gradients, washed-out turquoise, golden sunset reflections</palette>\n<composition>multi-plane collage layout, layered translucent grid overlays, isometric floating-object arrangement, symmetrical poster framing</composition>\n<texture>analog video line noise, chromatic edge bleeding, smooth marble polish, pixelated gradient steps</texture>\n</VISUAL_ENGINE>",
    negative_prompt:
      "dark, gritty, hyperrealistic photograph, raw film, dark fantasy, medieval, historical fantasy, sunset grid horizon, chrome automobile, outrun highway",
  },
};

/**
 * CHANGELOG — ID refactor and documentation.
 * - Refactored registry keys across the board to use shorter, simpler IDs (e.g., `photorealism` -> `photo`,
 *   `vintage_analog` -> `polaroid`, `concept_art` -> `concept`).
 * - Updated all hardcoded entity assignments in `premades.js` to match the new keys, preventing any orphans.
 * - Updated internal tests in `visual-styles.test.js` to assert against the shortened IDs.
 * - Restructured style definitions: Added the exploratory character sheet format to `concept`, removed `hentai`
 *   from `anime`, and maintained strict separation of `<camera>` vs `<composition>`.
 *
 * --- PREVIOUS PASS ---
 * - Added `category` to every entry + this file's grouping/section-comment structure. Purely a
 *   source-organization change; VisualWing.svelte re-sorts alphabetically by `name` regardless.
 * - Fixed two <camera>/<composition> misclassifications relative to this file's own schema rule:
 *   steampunk (was <camera> despite being a painterly "concept design", inconsistent with
 *   concept_art) and vaporwave (was <camera> despite its own medium field reading "digital
 *   collage") both now use <composition>.
 * - Reclassified papercraft from an illustrated diorama (<composition>) into a macro-photographed
 *   physical diorama (<camera>), matching its new category siblings claymation and lego_bricks.
 * - photorealism: tag "default" renamed to "standard" — "default" is a reserved sentinel in
 *   optics.js's resolve_*_visual_style_key() fallback chain, not a free-text descriptor.
 * - anime: dropped the "hentai" tag. It gets folded verbatim into both generation paths (see the
 *   PIPELINE note above), so it was pushing every anime-styled generation toward a harder register
 *   than the style's own description ("subtle ecchi... tones") calls for. "ecchi" tag kept.
 * - Added a handful of cross-style negative_prompt exclusions where two styles were most likely to
 *   bleed into each other: photorealism vs amateur_snap, vintage_analog vs film_noir, studio_ghibli
 *   vs anime (mirrors the exclusion disney_2d_classic already had), comic_book vs pop_art (also
 *   tightened pop_art's own <composition> text, which had drifted into comic_book's "speech
 *   bubble" territory), and retro_synthwave vs vaporwave.
 * - Flagged, but could not fix, two duplicate portrait thumbnails: concept_art/dark_fantasy and
 *   lego_bricks/papercraft each currently point at the same asset. See inline TODO comments.
 * - No registry keys were renamed, merged, or removed. premades.js assigns visual_style by these
 *   exact strings on individual characters/fractals (confirmed: watercolor, vintage_analog,
 *   vaporwave, three_d_render, steampunk, retro_synthwave, photorealism, oil_painting, cyberpunk,
 *   and comic_book are all currently in use) — renaming any key would silently orphan that
 *   assignment back to "none".
 */
