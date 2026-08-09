/**
 * src/data/definitions/visual-styles.js
 * 🎨 VISUAL STYLE SYSTEM — Aesthetic Engine presets for image generation.
 * Optimized for FLUX.1 (Rectified Flow) and T5-XXL text encoders.
 *
 * SCHEMA CONVENTIONS:
 * - Exactly one of <camera> OR <composition> per style (never both, never neither).
 *   <camera>      = Simulated optical lenses (photography, video, macro physical diorama).
 *   <composition> = Non-lens artwork (2D illustration, painting, print, orthographic projection).
 * - `negative_prompt` lives strictly outside the XML string.
 * - No "default" tags (reserved sentinel).
 *
 * @typedef {Object} VisualStyle
 * @property {string} id - Unique identifier matching the registry key
 * @property {string} name - Display title shown in UI dropdowns
 * @property {string} category - Grouping label for UI organization
 * @property {string} portrait - Preview thumbnail asset path
 * @property {string} description - Detailed aesthetic summary for tooltips
 * @property {string[]} tags - Visual descriptor keywords injected into generation
 * @property {string} visual_engine - Injected XML prompt block
 * @property {string} negative_prompt - Style-differentiating negative prompt
 * @property {boolean} [llm_refine] - When false, story tiers using this style skip LLM
 *   prompt refinement and use deterministic flattening (for raw/unmodified styles).
 *   Defaults to true when absent.
 * @property {number} [guidance_scale] - Optional per-style guidance scale nudge
 *   (higher = tighter prompt adherence). Tiers are authoritative: the value is
 *   clamped to within ±2 of the tier baseline (character 9 / scene 7), so a style
 *   can never overrule the tier or push a shot to extreme guidance. Keep values
 *   in a moderate band (7–10).
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
    llm_refine: false,
    visual_engine: "",
    negative_prompt: "",
  },

  // ---------------------------------------------------------------------------------------------
  // PHOTOGRAPHIC & LENS-CAPTURED
  // Real or simulated camera optics. All entries in this section use <camera>.
  // ---------------------------------------------------------------------------------------------

  photo: {
    id: "photo",
    name: "RAW Photography",
    category: "Photographic & Lens-Captured",
    portrait: "https://user.uploads.dev/file/f3cf9efe77281754064a6629e354d799.png",
    description: "Authentic candid photograph capturing natural everyday lighting, unposed perspectives, and realistic skin micro-textures.",
    tags: ["photography", "realistic", "candid", "raw", "lifelike", "natural", "snapshot"],
    llm_refine: false,
    guidance_scale: 9,
    visual_engine: `<VISUAL_ENGINE>
<medium>photorealistic live-action candid photograph, authentic real-life snapshot, unposed documentary capture</medium>
<palette>natural ambient illumination, authentic neutral color balance, unedited organic daylight and shade</palette>
<camera>35mm street photography lens, eye-level candid framing, crisp natural focus, realistic depth of field</camera>
<texture>organic skin micro-textures, true-to-life surface details, fine natural material weave, unretouched subtle imperfections</texture>
</VISUAL_ENGINE>`,
    negative_prompt:
      "studio lighting, beauty dish, Hasselblad commercial polish, glamor retouching, heavy flash glare, mirror selfie, selfie arm, smartphone camera UI, anime, illustration, 3d render, cartoon, drawing, painting, digital painting, smooth airbrushed, cel-shaded, vector, cctv, surveillance",
  },

  fashion: {
    id: "fashion",
    name: "Fashion Magazine",
    category: "Photographic & Lens-Captured",
    portrait: "https://user.uploads.dev/file/2112636b40fd390a0a7654395f608c59.png",
    description:
      "Sleek high-fashion editorial photography shot on medium format optics with opulent metallic tones and polished studio key lighting.",
    tags: ["fashion", "editorial", "magazine", "vogue", "glamour", "high_fashion", "hasselblad", "studio"],
    guidance_scale: 9,
    visual_engine: `<VISUAL_ENGINE>
<medium>photorealistic live-action high-fashion editorial photograph, commercial Vogue cover shoot</medium>
<palette>opulent metallic accents, rich luxury tones, controlled studio key light, dramatic rim lighting, polished beauty dish balance</palette>
<camera>Hasselblad X2D 100C, 85mm prime f/1.2 lens, pin-sharp optical focus, shallow depth of field</camera>
<texture>sleek polished editorial print quality, crisp high-fashion detail, flawless commercial finish, smooth retouching</texture>
</VISUAL_ENGINE>`,
    negative_prompt:
      "amateur snapshot, casual phone photo, candid awkwardness, uncalibrated ambient room light, watermark, white background, rugged grunge texture, anime, illustration, 3d render, drawing, painting, cel-shaded, vector, cctv, surveillance",
  },

  cinematic: {
    id: "cinematic",
    name: "Cinematic Film",
    category: "Photographic & Lens-Captured",
    portrait: "https://user.uploads.dev/file/67a672baf7752bf089eea071f15a9ca9.png",
    description: "Atmospheric widescreen cinema shot featuring 35mm anamorphic optics, volumetric light shafts, and crushed shadows.",
    tags: ["cinematic", "film", "volumetric", "anamorphic", "movie", "dramatic", "shadows"],
    guidance_scale: 8,
    visual_engine: `<VISUAL_ENGINE>
<medium>photorealistic live-action widescreen 35mm cinematic feature film capture</medium>
<palette>dramatic cinematic color grade, volumetric light shafts, deep crushed shadow voids, warm key and cold fill lighting</palette>
<camera>35mm anamorphic prime lens, shallow depth of field, optical lens flare, dramatic wide-angle perspective</camera>
<texture>subtle organic 35mm film grain, atmospheric volumetric dust haze, rich specular highlights</texture>
</VISUAL_ENGINE>`,
    negative_prompt:
      "amateur photo, flat lighting, 2d drawing, cartoon, anime, low poly, noisy, distorted features, raw snapshot, vector, illustration, 3d render, painting, cel-shaded, cctv, surveillance",
  },

  noir: {
    id: "noir",
    name: "Film Noir",
    category: "Photographic & Lens-Captured",
    portrait: "https://user.uploads.dev/file/26f37e3915eaabab9248491fc3687f2e.png",
    description:
      "Classic 1940s detective cinema aesthetic featuring high-contrast black and white, hard chiaroscuro shadows, and venetian blinds light.",
    tags: ["film_noir", "monochrome", "detective", "1940s", "shadows"],
    guidance_scale: 8,
    visual_engine: `<VISUAL_ENGINE>
<medium>photorealistic live-action 1940s monochrome cinema frame, silver gelatin film print</medium>
<palette>high contrast black and white, deep shadow voids, harsh key lighting, silver midtones</palette>
<camera>35mm vintage camera, hard-edge shadows, chiaroscuro lighting, dutch angle tilt</camera>
<texture>organic medium film grain, cigarette smoke haze, wet pavement reflections</texture>
</VISUAL_ENGINE>`,
    negative_prompt:
      "color, vibrant, saturated, modern, digital, anime, cartoon, illustration, 3d render, drawing, painting, cel-shaded, vector, cctv, surveillance",
  },

  polaroid: {
    id: "polaroid",
    name: "Polaroid",
    category: "Photographic & Lens-Captured",
    portrait: "https://user.uploads.dev/file/c7f758d7f2997cf541d721fb428e77cf.png",
    description: "Authentic instant Polaroid photo featuring soft optical focus, faded vintage color shifts, and harsh direct flash exposure.",
    tags: ["polaroid", "instant_film", "vintage", "retro", "analog", "flash"],
    guidance_scale: 9,
    visual_engine: `<VISUAL_ENGINE>
<medium>photorealistic live-action Polaroid SX-70 instant film photo, vintage flash snapshot</medium>
<palette>faded vintage color shifts, muted cyan and magenta tones, harsh direct flash illumination, washed-out shadows</palette>
<camera>Polaroid instant camera, fixed focal length, harsh direct flash glare, soft optical focus, edge vignetting</camera>
<texture>instant film chemical emulsion bleeding, soft analog grain, glossy photo paper reflection, slight motion blur</texture>
</VISUAL_ENGINE>`,
    negative_prompt:
      "crisp 4k, sharp modern lens, professional studio lighting, 3d render, anime, harsh digital sharpness, vector, cgi, monochrome, cartoon, illustration, drawing, painting, cel-shaded",
  },

  analog_video: {
    id: "analog_video",
    name: "Analog Video",
    category: "Photographic & Lens-Captured",
    portrait: "https://user.uploads.dev/file/644012b0a426a455889d5a8881d69e72.png",
    description:
      "Uncanny lofi 1990s VHS tape snapshot or high-angle CCTV security camera screen capture with scanlines, tracking glitches, and lens distortion.",
    tags: ["analog_video", "vhs", "cctv", "found_footage", "surveillance", "glitch", "scanlines", "camcorder", "interlacing"],
    guidance_scale: 8,
    visual_engine: `<VISUAL_ENGINE>
<medium>photorealistic live-action magnetic tape analog horror frame, CCTV security screen capture, low-fi video snapshot</medium>
<palette>unsettling washed-out low-light shadows, desaturated phosphor cast, harsh dark contrast, heavy video sensor noise</palette>
<camera>low-resolution handheld camcorder optics or ceiling-mounted fisheye security lens, wide-angle distortion, out-of-focus motion framing</camera>
<texture>VHS tracking glitch lines, horizontal scanline stripes, video interlacing tear lines, chromatic edge bleeding, timestamp overlay, video noise</texture>
</VISUAL_ENGINE>`,
    negative_prompt:
      "crisp 4k, sharp focus, modern digital camera, vibrant studio lighting, 3d render, vector, oil painting, illustration, anime, cartoon, drawing, cel-shaded",
  },

  // ---------------------------------------------------------------------------------------------
  // ANIMATION & STYLIZED MOTION
  // Cel, hand-paint, and CG animation traditions.
  // ---------------------------------------------------------------------------------------------

  anime: {
    id: "anime",
    name: "Anime & Manga",
    category: "Animation & Stylized Motion",
    portrait: "https://user.uploads.dev/file/293e5b0c1e675dd32d6f0eb968a47e50.png",
    description: "Vibrant cel-shaded Japanese anime & manga art style with clean line work, expressive key framing, and stylized proportions.",
    tags: ["anime", "manga", "cel_shading", "illustration", "2d", "stylized"],
    guidance_scale: 8,
    visual_engine: `<VISUAL_ENGINE>
<medium>Japanese anime and manga cel-shaded 2D illustration keyframe</medium>
<palette>vibrant saturated anime colors, clean flat cel shading with sharp rim light accents</palette>
<composition>dynamic dramatic anime keyframe angles, foreshortened perspective, expressive focal framing</composition>
<texture>smooth crisp anime ink line art, flat color fills with subtle gradient shading</texture>
</VISUAL_ENGINE>`,
    negative_prompt: "photograph, realistic human skin pores, 3d render, oil painting, watercolor, rough charcoal sketch, crosshatching, raw photo",
  },

  ghibli: {
    id: "ghibli",
    name: "Studio Ghibli",
    category: "Animation & Stylized Motion",
    portrait: "https://user.uploads.dev/file/4aaf95f0ba916c7498c960abb4ecd87e.png",
    description: "Warm hand-painted animation style with lush scenic landscapes, soft watercolor wash backgrounds, and nostalgic warmth.",
    tags: ["studio_ghibli", "anime", "hand_painted", "nostalgic", "whimsical"],
    guidance_scale: 8,
    visual_engine: `<VISUAL_ENGINE>
<medium>Studio Ghibli 2D anime background matte painting art</medium>
<palette>warm earthy tones, soft pastel skies, lush natural landscapes, gentle golden light</palette>
<composition>wide establishing environmental layout, gentle framing, intimate focal subject with soft background depth</composition>
<texture>hand-painted watercolor backgrounds, soft cel shading on characters, visible brush texture</texture>
</VISUAL_ENGINE>`,
    negative_prompt:
      "photograph, 3d render, realistic, dark, gritty, cyberpunk, harsh neon lighting, photorealism, flat cel-shaded modern anime linework",
  },

  disney: {
    id: "disney",
    name: "Classic 2D (Disney)",
    category: "Animation & Stylized Motion",
    portrait: "https://user.uploads.dev/file/ab3d3721f029e356d540c524df0d876d.png",
    description: "Golden-age hand-drawn 2D animation featuring ink-and-paint cels, painterly gouache backgrounds, and fairytale warmth.",
    tags: ["disney", "2d", "classic_animation", "hand_drawn", "cel_art", "fairytale"],
    guidance_scale: 8,
    visual_engine: `<VISUAL_ENGINE>
<medium>golden age 2d feature animation cel in the style of classic Walt Disney hand-drawn animation</medium>
<palette>warm theatrical key lighting, luminous fairytale jewel tones, soft pastel background washes</palette>
<composition>expressive storytelling staging, theatrical silhouette, sweeping organic curves</composition>
<texture>clean hand-inked cel outlines, matte gouache background paint, subtle analog film scan texture</texture>
</VISUAL_ENGINE>`,
    negative_prompt:
      "3d render, cgi, photorealistic, raw photograph, sharp digital vector, modern 3d animation, low poly, noisy, anime cel shading, cyberpunk",
  },

  pixar: {
    id: "pixar",
    name: "3D Animation (Pixar)",
    category: "Animation & Stylized Motion",
    portrait: "https://user.uploads.dev/file/27615c2c471da91f2052c4505a945053.png",
    description:
      "Stylized 3D CGI feature film artwork combining Pixar character warmth, ray-traced global illumination, and Unreal Engine 5 optical depth.",
    tags: ["cgi", "animation", "3d", "pixar", "unreal_engine", "raytracing", "stylized"],
    guidance_scale: 8,
    visual_engine: `<VISUAL_ENGINE>
<medium>3d animated feature film digital artwork, high-end CGI scene render in the style of Pixar and Unreal Engine 5</medium>
<palette>physically based lighting, warm studio key light, soft rim glow, volumetric light shafts, harmonious color palette</palette>
<camera>35mm digital feature film camera setup, ray-traced global illumination optics, shallow depth of field, ambient occlusion depth</camera>
<texture>soft subsurface skin scattering, velvety fabric weaves, physically based material shaders, smooth polished CGI surfaces</texture>
</VISUAL_ENGINE>`,
    negative_prompt: "photograph, grainy, raw film, realistic human skin pores, rough impasto, 2d drawing, vector, line art, flat",
  },

  // ---------------------------------------------------------------------------------------------
  // GAME & GRAPHIC RENDER
  // ---------------------------------------------------------------------------------------------

  isometric: {
    id: "isometric",
    name: "Isometric Projection",
    category: "Game & Graphic Render",
    portrait: "https://user.uploads.dev/file/5e3cdfcde02ff1d1d9c2c5f0588dd4ae.png",
    description:
      "Dimension-agnostic orthographic isometric artwork featuring a fixed 45-degree parallel grid perspective, crisp geometric alignment, and clean spatial layout.",
    tags: ["isometric", "orthographic", "grid", "parallel_projection", "game_art", "diagramatic"],
    visual_engine: `<VISUAL_ENGINE>
<medium>orthographic isometric projection artwork, clean grid-aligned spatial illustration</medium>
<palette>clean vibrant color blocking, soft directional lighting, uniform ambient shadow depth</palette>
<composition>fixed 45-degree orthographic projection, corner-facing parallel perspective grid, aligned spatial layout</composition>
<texture>crisp uniform line definition, smooth form transitions, clean matte surface shading</texture>
</VISUAL_ENGINE>`,
    negative_prompt: "perspective distortion, converging horizon lines, wide-angle lens, camera lens flare, cinematic depth-of-field blur",
  },

  pixel: {
    id: "pixel",
    name: "Pixel Art",
    category: "Game & Graphic Render",
    portrait: "https://user.uploads.dev/file/87f3a245a478d2bdfeb284e5d8a83327.png",
    description: "Retro 16-bit video game sprite aesthetic featuring a limited color palette, crisp blocky pixel grids, and dithered shading.",
    tags: ["pixel_art", "retro", "16bit", "dithered", "indie_game"],
    guidance_scale: 7,
    visual_engine: `<VISUAL_ENGINE>
<medium>retro pixel art, 16-bit video game sprite</medium>
<palette>limited 32-color palette, dithered shading, vibrant contrasting colors</palette>
<composition>fixed orthographic perspective, side-scroller or top-down grid alignment</composition>
<texture>crisp square pixels, visible dithering patterns, zero anti-aliasing, blocky forms</texture>
</VISUAL_ENGINE>`,
    negative_prompt: "photograph, realistic, smooth, anti-aliased, high resolution, 3d render, oil painting, camera lens, vector",
  },

  // ---------------------------------------------------------------------------------------------
  // MINIATURE & PHYSICAL CRAFT PHOTOGRAPHY
  // Physical miniature objects photographed with a simulated macro lens. All entries use <camera>.
  // ---------------------------------------------------------------------------------------------

  clay: {
    id: "clay",
    name: "Claymation",
    category: "Miniature & Physical Craft Photography",
    portrait: "https://user.uploads.dev/file/1be495044d258e39e940aa68eaa04c5f.png",
    description: "Tactile stop-motion plasticine animation style with visible thumbprints, miniature set depth, and soft physical lighting.",
    tags: ["claymation", "stop_motion", "clay", "tactile", "sculpture", "animation"],
    visual_engine: `<VISUAL_ENGINE>
<medium>claymation stop-motion animation capture in the style of Aardman animations, plasticine sculpture</medium>
<palette>saturated physical clay pigments, soft studio warm spotlighting</palette>
<camera>50mm macro lens, shallow depth of field, miniature physical set perspective</camera>
<texture>visible finger impressions in clay, subtle seam lines, matte plasticine texture, felt background materials</texture>
</VISUAL_ENGINE>`,
    negative_prompt: "digital vector, smooth CGI, glossy render, photograph of real human, flat 2d, drawing",
  },

  lego: {
    id: "lego",
    name: "LEGO®",
    category: "Miniature & Physical Craft Photography",
    portrait: "https://user.uploads.dev/file/120b2c46188fb711a93bc68b9bf1eadc.png",
    description:
      "Simulated physical toy block diorama featuring glossy minifigures and ABS plastic building blocks macro-photographed with tilt-shift depth.",
    tags: ["lego", "plastic", "brick", "toy", "minifigure", "macro"],
    visual_engine: `<VISUAL_ENGINE>
<medium>plastic toy construction brick artwork, blocky LEGO minifigure character illustration, brick-built macro diorama model</medium>
<palette>vibrant primary ABS plastic colors, glossy solid minifigure skin tones, rich bold building block tones</palette>
<camera>60mm macro lens photography, shallow depth of field, tilt-shift miniature set focal perspective, eye-level toy camera shot</camera>
<texture>glossy injection-molded ABS plastic surfaces, visible circular interlocking plastic studs with embossed logo micro-detail, plastic mold seam lines, crisp smooth plastic reflections</texture>
</VISUAL_ENGINE>`,
    negative_prompt:
      "photorealistic human skin pores, organic human features, realistic anatomical human joints, smooth paper drawing, watercolor, 3d CGI film rendering, cloth fabric weave",
  },

  paper: {
    id: "paper",
    name: "Papercraft",
    category: "Miniature & Physical Craft Photography",
    portrait: "https://user.uploads.dev/file/db3cb7104f2da620eccc08dc5f535988.png",
    description: "Macro-photographed papercraft diorama built from layered, hand-cut card stock with tactile depth and paper-edge shadows.",
    tags: ["papercraft", "paper", "cut_paper", "diorama", "miniature", "macro_photography", "tactile", "layered"],
    visual_engine: `<VISUAL_ENGINE>
<medium>macro-photographed papercraft diorama, a tangible miniature set built from layered cut construction paper and card stock</medium>
<palette>flat saturated construction-paper hues, soft pastel gradient washes between paper layers, warm directional studio spotlighting</palette>
<camera>60mm macro lens photography, shallow depth of field, tilt-shift miniature-set perspective, low raking sidelight carving out paper-edge shadows</camera>
<texture>visible fibrous paper grain, crisp die-cut edges, stacked drop shadows between depth planes, gentle finger-pressed creases, matte uncoated paper surface</texture>
</VISUAL_ENGINE>`,
    negative_prompt:
      "flat vector illustration, digital collage, photorealistic human skin, 3d CGI render, glossy injection-molded plastic, painted canvas texture, watercolor bleed",
  },

  // ---------------------------------------------------------------------------------------------
  // COMIC, PRINT & GRAPHIC DESIGN
  // ---------------------------------------------------------------------------------------------

  graphic_print: {
    id: "graphic_print",
    name: "Graphic Print",
    category: "Comic, Print & Graphic Design",
    portrait: "https://user.uploads.dev/file/861133eb1b50d4e3c957c0e8402ea5f2.png",
    description:
      "Bold graphic novel, pop art screenprint, and risograph poster aesthetic featuring black ink outlines, Ben-Day halftone dots, and spot-color translucent ink bleeds.",
    tags: ["graphic_print", "comic_book", "pop_art", "risograph", "halftone", "ben_day", "spot_color", "ink"],
    guidance_scale: 8,
    visual_engine: `<VISUAL_ENGINE>
<medium>bold graphic novel illustration, pop art Ben-Day dot screenprint, spot-color risograph poster artwork</medium>
<palette>flat primary color blocks, high-contrast saturation, overlapping translucent neon ink bleeds</palette>
<composition>dynamic poster-scale focal close-up, dramatic action panel framing, bold graphic silhouette staging</composition>
<texture>heavy black ink outlines, Ben-Day halftone screen dots, recycled paper grain, subtle ink registration misalignments</texture>
</VISUAL_ENGINE>`,
    negative_prompt: "photograph, realistic skin, 3d render, soft watercolor, oil painting impasto, airbrush digital gradient, raw camera photo",
  },

  wood: {
    id: "wood",
    name: "Ukiyo-e Woodblock Print",
    category: "Comic, Print & Graphic Design",
    portrait: "https://user.uploads.dev/file/c6978746b0f5ae93937c7890fced148c.png",
    description:
      "Traditional Edo-period Japanese woodblock print featuring organic sumi-e ink contours, flat mineral pigments, and wood grain impressions.",
    tags: ["ukiyo_e", "japanese", "woodblock", "traditional", "print", "hokusai"],
    visual_engine: `<VISUAL_ENGINE>
<medium>traditional Edo-period ukiyo-e woodblock print in the style of Hokusai</medium>
<palette>flat mineral pigments, muted earth tones, sumi-e black ink</palette>
<composition>asymmetrical Japanese layout, flat space perspective, atmospheric horizon wave framing</composition>
<texture>visible relief wood grain impressions, fibrous hand-pressed washi paper texture</texture>
</VISUAL_ENGINE>`,
    negative_prompt: "photograph, modern 3d render, glossy reflections, volumetric lighting, oil painting, western comics",
  },

  stained: {
    id: "stained",
    name: "Stained Glass",
    category: "Comic, Print & Graphic Design",
    portrait: "https://user.uploads.dev/file/b24924f2fd7d826540b4f2757dad7767.png",
    description: "Gothic cathedral stained glass artwork with backlit translucent jewel-toned glass panels and dark lead came borders.",
    tags: ["stained_glass", "gothic", "mosaic", "glass", "backlit", "artisan"],
    visual_engine: `<VISUAL_ENGINE>
<medium>gothic cathedral stained glass window mosaic</medium>
<palette>luminous backlit jewel-toned translucent glass panels</palette>
<composition>symmetrical architectural framing, arched window border layout</composition>
<texture>thick black lead came soldering contours, subtle glass air bubbles, crackled surface refractions</texture>
</VISUAL_ENGINE>`,
    negative_prompt: "photograph, realistic skin, 3d digital render, canvas, paper drawing, flat vector",
  },

  // ---------------------------------------------------------------------------------------------
  // TRADITIONAL PAINTING & DRAWING
  // ---------------------------------------------------------------------------------------------

  oil: {
    id: "oil",
    name: "Oil Painting",
    category: "Traditional Painting & Drawing",
    portrait: "https://user.uploads.dev/file/29d4709051646f4e5bffbbd0f34e2048.png",
    description: "Classical fine art oil painting with thick impasto brushwork, layered glazes, rich chiaroscuro, and luminous depth.",
    tags: ["oil_painting", "classical", "impasto", "traditional", "baroque"],
    guidance_scale: 7,
    visual_engine: `<VISUAL_ENGINE>
<medium>thick impasto oil painting in the style of Michelangelo and Rembrandt, classical fine art masterwork</medium>
<palette>rich layered glazes, warm earth tones, deep chiaroscuro, varnished luminous depth</palette>
<composition>baroque triangular composition, dramatic atmospheric staging</composition>
<texture>visible thick brush strokes, palette knife marks, canvas weave texture, crackled glaze</texture>
</VISUAL_ENGINE>`,
    negative_prompt: "photograph, digital, smooth, flat, cel_shaded, anime, vector, camera lens, 3d render",
  },

  water: {
    id: "water",
    name: "Watercolor",
    category: "Traditional Painting & Drawing",
    portrait: "https://user.uploads.dev/file/115456547820baafccc89970b7c5fb7a.png",
    description: "Delicate watercolor painting featuring soft wet-on-wet washes, pigment diffusion bleeding, and granulating textures.",
    tags: ["watercolor", "painting", "organic", "soft", "translucent"],
    guidance_scale: 7,
    visual_engine: `<VISUAL_ENGINE>
<medium>delicate watercolor painting, wet-on-wet technique</medium>
<palette>soft translucent washes, bleeding pigment edges, pastel undertones with granulating textures</palette>
<composition>fluid organic framing, gentle vignetting, soft negative space balance</composition>
<texture>cold-press paper grain texture visible through washes, pooling water marks, dry brush accents</texture>
</VISUAL_ENGINE>`,
    negative_prompt: "photograph, 3d render, sharp hard edges, digital, vector, cel_shaded, camera lens, heavy oil impasto",
  },

  monochrome_sketch: {
    id: "monochrome_sketch",
    name: "Monochrome Sketch",
    category: "Traditional Painting & Drawing",
    portrait: "https://user.uploads.dev/file/5658673d879658c2dd722fdf1791f688.png",
    description:
      "Detailed monochrome fine-nib ink, smudged charcoal, and heavy graphite pencil study featuring dramatic chiaroscuro and dense crosshatching.",
    tags: ["monochrome_sketch", "ink", "charcoal", "graphite", "line_art", "crosshatching", "drawing"],
    visual_engine: `<VISUAL_ENGINE>
<medium>detailed monochrome ink drawing, smudged charcoal study, gestural graphite and pencil illustration</medium>
<palette>deep velvety blacks, rich gray tonal gradients, stark white paper highlights, polished black leather sheen</palette>
<composition>dramatic chiaroscuro framing, bold heroic contours, expressive fine-line nib work</composition>
<texture>heavy tooth cotton paper grain, dusty charcoal smudges, fine crosshatched ink lines, smooth shaded graphite, stippling</texture>
</VISUAL_ENGINE>`,
    negative_prompt: "color, digital painting, smooth vector, clean lines, 3d render, photo, cel_shaded, neon",
  },

  doodle: {
    id: "doodle",
    name: "Notebook Doodle",
    category: "Traditional Painting & Drawing",
    portrait: "https://user.uploads.dev/file/34dc78c445a2749a4cc1dff08db37033.png",
    description: "Casual ballpoint pen and marker doodles drawn in notebook margins with quirky line art and scribbled shading.",
    tags: ["doodle", "sketch", "notebook", "scribble", "margin_art", "casual", "hand_drawn"],
    guidance_scale: 7,
    visual_engine: `<VISUAL_ENGINE>
<medium>raw unedited ballpoint pen sketch on lined notebook paper</medium>
<palette>monochrome ballpoint ink on grid-lined paper, subtle highlighter accents</palette>
<composition>loose spontaneous margin layout, asymmetric framing, playful quirky proportions</composition>
<texture>hand-drawn pen scribbles, ink bleed pooling, blue lined paper grid, soft paper creases</texture>
</VISUAL_ENGINE>`,
    negative_prompt: "3d render, photograph, polished digital artwork, smooth digital gradient, vector, studio lighting, hyperrealistic",
  },

  // ---------------------------------------------------------------------------------------------
  // RETRO-FUTURISM & DIGITAL SUBCULTURE
  // ---------------------------------------------------------------------------------------------

  pulp: {
    id: "pulp",
    name: "Retro Pulp Cover",
    category: "Retro-Futurism & Digital Subculture",
    portrait: "https://user.uploads.dev/file/a166f0706f17833ab3990b791d9937ab.png",
    description: "Vivid 1950s fantasy and sci-fi paperback book illustration featuring dramatic gouache brushwork and theatrical staging.",
    tags: ["pulp", "retro", "50s", "paperback", "sci-fi", "gouache"],
    guidance_scale: 9,
    visual_engine: `<VISUAL_ENGINE>
<medium>1950s pulp magazine cover illustration in the style of Frank Frazetta, vintage paperback gouache painting</medium>
<palette>vivid primary accents, warm highlights, deep cool shadows, dramatic rim lighting</palette>
<composition>diagonal dynamic action composition, dramatic hero posing, space for cover typography</composition>
<texture>visible gouache brush strokes, matte paperboard texture, vintage newsprint color bleed</texture>
</VISUAL_ENGINE>`,
    negative_prompt: "modern 3d render, photograph, clean digital vector, minimalist flat design, cyberpunk neon, anime",
  },

  cyberpunk: {
    id: "cyberpunk",
    name: "Cyberpunk",
    category: "Retro-Futurism & Digital Subculture",
    portrait: "https://user.uploads.dev/file/643e256027b322312bea15c98e3f937e.png",
    description: "Neon-soaked dystopian aesthetic with wet rain-slicked asphalt, holographic interfaces, and high-tech urban grime.",
    tags: ["cyberpunk", "neon", "scifi", "dystopian", "chrome"],
    guidance_scale: 9,
    visual_engine: `<VISUAL_ENGINE>
<medium>neon cyberpunk dystopian digital concept art matte painting</medium>
<palette>vibrant neon accents, deep blacks, holographic iridescent accents, harsh LED lighting</palette>
<camera>wide-angle anamorphic lens, low angle dramatic perspective, optical lens flares</camera>
<texture>polished chrome reflections, rain-streaked glass, circuit board patterns, holographic noise</texture>
</VISUAL_ENGINE>`,
    negative_prompt: "medieval, fantasy, natural, pastoral, watercolor, oil painting, antique, sunny, historical",
  },

  synthwave: {
    id: "synthwave",
    name: "Synthwave",
    category: "Retro-Futurism & Digital Subculture",
    portrait: "https://user.uploads.dev/file/f2150b87f7133e099c38bbe384a7eaa1.png",
    description:
      "80s outrun synthwave and 90s vaporwave digital collage blending neon grid horizons, pastel cyan/magenta gradients, and CRT scan lines.",
    tags: ["synthwave", "vaporwave", "retro", "80s", "90s", "neon", "pastel", "glitch"],
    guidance_scale: 8,
    visual_engine: `<VISUAL_ENGINE>
<medium>retro 1980s synthwave digital airbrush art, nostalgic 1990s vaporwave digital 3d collage</medium>
<palette>vibrant retro-futuristic cyan and magenta gradients, glowing twilight horizon, pastel washes</palette>
<composition>low ground vanishing-point grid floor, multi-plane collage layout, symmetrical poster framing</composition>
<texture>chrome reflections, glowing neon glass tubes, subtle CRT scanlines, pixelated gradient steps</texture>
</VISUAL_ENGINE>`,
    negative_prompt: "medieval, natural, realistic, documentary, watercolor, oil painting, historical, classical oil portrait",
  },
};
