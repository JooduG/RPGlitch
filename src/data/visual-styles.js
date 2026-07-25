/**
 * src/data/visual-styles.js
 * 🎨 VISUAL STYLE SYSTEM — Aesthetic Engine presets for image generation.
 * Optimized for FLUX.1 (Rectified Flow) and T5-XXL text encoders.
 *
 * SCHEMA CONVENTIONS:
 * - Photographic/Cinematic mediums use `<camera>` for lens specs, lighting profiles, and optical setups.
 * - Illustrated/Artistic mediums use `<composition>` for perspective, spatial framing, and layout.
 * - `negative_prompt` is isolated as a root property to prevent T5 text-encoder lexical contamination.
 *
 * @typedef {Object} VisualStyle
 * @property {string} id - Unique identifier matching the registry key
 * @property {string} name - Display title shown in UI dropdowns
 * @property {string} portrait - Optional preview thumbnail asset path
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
    portrait: "",
    description: "Raw prompt generation without any visual style tokens or negative prompts injected.",
    tags: ["none", "raw", "unmodified"],
    visual_engine: "",
    negative_prompt: "",
  },

  cgi_animation: {
    id: "cgi_animation",
    name: "3D CGI Animation",
    portrait: "",
    description: "Stylized 3D animated movie aesthetic with soft subsurface scattering, expressive character lighting, and polished studio warmth.",
    tags: ["cgi", "animation", "3d", "stylized", "pixar"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>3d character animation, feature film digital art</medium>\n<palette>warm key lighting, soft rim light glow, harmonious pastel palette</palette>\n<composition>intimate character portrait framing, shallow depth separation, cinematic storytelling layout</composition>\n<texture>soft subsurface skin scattering, velvety fabric textures, smooth polished surfaces</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, grainy, raw film, realistic human skin pores, rough impasto, 2d drawing, vector",
  },

  three_d_render: {
    id: "three_d_render",
    name: "3D Render (UE5)",
    portrait: "",
    description:
      "High-concept 3D scene powered by Unreal Engine 5 optics, featuring ray-traced global illumination, physically based materials, and ambient occlusion.",
    tags: ["3d_render", "ue5", "unreal_engine", "cgi", "raytracing"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>Unreal Engine 5 architectural 3d scene render</medium>\n<palette>physically based lighting, volumetric light shafts, ray-traced global illumination</palette>\n<camera>cinematic 35mm focal setup, accurate specular reflections, ambient occlusion depth</camera>\n<texture>crisp 3d asset definition, physically based material shaders, ray-traced reflections</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "flat 2d, illustration, drawing, watercolor, low poly, noisy, anime, painting",
  },

  anime: {
    id: "anime",
    name: "Anime",
    portrait: "",
    description: "Vibrant cel-shaded anime art style with clean line work, expressive key framing, and stylized proportions.",
    tags: ["anime", "cel_shading", "illustration", "2d", "stylized"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>anime cel-shaded illustration, hand-drawn 2d animation frame</medium>\n<palette>vibrant saturated colors, clean flat shading with rim light accents</palette>\n<composition>dynamic dramatic angles, foreshortened perspective, heroic character framing</composition>\n<texture>smooth clean line art, flat color fills with subtle gradient shading</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, realistic, 3d render, oil painting, watercolor, rough sketch",
  },

  blueprint: {
    id: "blueprint",
    name: "Architectural Blueprint",
    portrait: "",
    description: "Technical drafting schematic featuring crisp white vector lines, dimension markings, and grid lines on deep cyanotype blue paper.",
    tags: ["blueprint", "technical", "cad", "drafting", "schematic", "architectural"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>architectural blueprint drafting, technical CAD schematic</medium>\n<palette>stark white vector lines on dark Prussian blue cyanotype background</palette>\n<composition>orthographic elevation projection, precise geometric alignment, technical margin crosshairs</composition>\n<texture>fine white ink lines, subtle blue paper tooth, faded grid paper overlay</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "3d render, photograph, painterly, soft gradients, colorful, artistic shading, blur",
  },

  charcoal_sketch: {
    id: "charcoal_sketch",
    name: "Charcoal & Graphite",
    portrait: "",
    description: "Raw charcoal and graphite study with dramatic chiaroscuro, gestural strokes, smudged shading, and heavy paper texture.",
    tags: ["charcoal", "sketch", "graphite", "monochrome", "drawing", "chiaroscuro"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>smudged charcoal drawing, gestural graphite study</medium>\n<palette>deep velvety blacks, rich gray tonal gradients, stark white paper highlights</palette>\n<composition>dramatic chiaroscuro framing, expressive atmospheric focus</composition>\n<texture>heavy tooth cotton paper grain, dusty charcoal smudge marks, crosshatched graphite lines</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "color, digital painting, smooth vector, clean lines, 3d render, photo",
  },

  claymation: {
    id: "claymation",
    name: "Claymation & Stop-Motion",
    portrait: "",
    description: "Tactile stop-motion plasticine animation style with visible thumbprints, miniature set depth, and soft physical lighting.",
    tags: ["claymation", "stop_motion", "clay", "tactile", "sculpture", "animation"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>claymation stop-motion animation capture, plasticine character sculpture</medium>\n<palette>saturated physical clay pigments, soft studio warm spotlighting</palette>\n<camera>50mm macro lens, shallow depth of field, miniature physical set perspective</camera>\n<texture>visible finger impressions in clay, subtle seam lines, matte plasticine texture, felt background materials</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "digital vector, smooth CGI, glossy render, photograph of real human, flat 2d",
  },

  comic_book: {
    id: "comic_book",
    name: "Comic Book",
    portrait: "",
    description: "Bold graphic novel artwork featuring heavy black ink outlines, halftone dot shading, and high-contrast dynamic framing.",
    tags: ["comic_book", "ink", "graphic_novel", "halftone", "bold"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>comic book illustration, bold inked graphic novel art</medium>\n<palette>flat bold primary colors with halftone dot shading, high contrast saturation</palette>\n<composition>dynamic foreshortened angles, dramatic panel composition, action-oriented framing</composition>\n<texture>heavy black ink outlines, visible halftone screen tones, crosshatching shading</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, realistic, 3d render, soft watercolor, oil painting",
  },

  cyberpunk: {
    id: "cyberpunk",
    name: "Cyberpunk",
    portrait: "",
    description: "Neon-soaked dystopian aesthetic with wet rain-slicked asphalt, holographic interfaces, and high-tech urban grime.",
    tags: ["cyberpunk", "neon", "scifi", "dystopian", "chrome"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>cyberpunk digital art, neon-lit dystopian sci-fi environment</medium>\n<palette>vibrant neon magenta and cyan, deep blacks, holographic iridescent accents, harsh LED lighting</palette>\n<camera>wide-angle anamorphic lens, low angle dramatic perspective, optical lens flares</camera>\n<texture>polished chrome reflections, rain-streaked glass, circuit board patterns, holographic noise</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "medieval, fantasy, natural, pastoral, watercolor, oil painting, antique, sunny",
  },

  dark_fantasy: {
    id: "dark_fantasy",
    name: "Dark Fantasy",
    portrait: "",
    description: "Grim dark fantasy art with eldritch atmospheres, ominous gothic architecture, desaturated color tones, and deep shadow play.",
    tags: ["dark_fantasy", "gothic", "eldritch", "ominous", "shadow"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>dark fantasy concept art, gothic digital illustration</medium>\n<palette>desaturated cold tones, deep crushed blacks, sickly green glow, muted gold accents, ash gray</palette>\n<composition>ominous low angles, looming perspective, fog-drenched depth layout</composition>\n<texture>weathered stone, rusted iron, cracked bone, tattered fabric, moss-covered surfaces</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "bright, cheerful, sunny, pastel, cartoon, anime, photograph, modern",
  },

  film_noir: {
    id: "film_noir",
    name: "Film Noir",
    portrait: "",
    description:
      "Classic 1940s detective cinema aesthetic featuring high-contrast black and white, hard chiaroscuro shadows, and venetian blind light beams.",
    tags: ["film_noir", "monochrome", "detective", "1940s", "shadows"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>1940s monochrome cinema frame, silver gelatin film print</medium>\n<palette>high contrast black and white, deep shadow voids, harsh key lighting, silver midtones</palette>\n<camera>35mm vintage camera, hard-edge shadows, chiaroscuro lighting, dutch angle tilt</camera>\n<texture>organic medium film grain, cigarette smoke haze, wet pavement reflections</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "color, vibrant, saturated, modern, digital, anime, cartoon, illustration",
  },

  ink_sketch: {
    id: "ink_sketch",
    name: "Ink & Line Art",
    portrait: "",
    description: "Detailed monochrome ink drawing with fine nib pen lines, dense crosshatching, stippling, and classical engraving feel.",
    tags: ["ink", "line_art", "sketch", "monochrome", "crosshatching", "drawing"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>detailed ink drawing, minimalist fine line art sketch</medium>\n<palette>stark monochrome black ink on textured cream paper, subtle wash gradients</palette>\n<composition>clean minimalist layout, intentional utilization of negative space, crisp subject outline</composition>\n<texture>fine nib pen strokes, dense crosshatching shading, paper grain texture, stippling</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, 3d render, vibrant colors, blurry, soft gradients, cel_shaded",
  },

  isometric_3d: {
    id: "isometric_3d",
    name: "Isometric 3D / Low-Poly",
    portrait: "",
    description: "Clean orthographic 3D vector aesthetic with geometric low-poly models, soft ambient occlusion, and vibrant flat shading.",
    tags: ["isometric", "low_poly", "vector", "3d", "orthographic", "game_art"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>isometric 3d vector model, low-poly digital art</medium>\n<palette>clean vibrant color blocking, soft directional sunlight, gentle ambient occlusion shadows</palette>\n<composition>fixed 45-degree orthographic projection, grid-aligned spatial arrangement</composition>\n<texture>smooth faceted polygon surfaces, crisp vector edges, flat matte materials</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "perspective distortion, photorealistic textures, organic noise, lens flare, film grain",
  },

  oil_painting: {
    id: "oil_painting",
    name: "Oil Painting",
    portrait: "",
    description: "Classical fine art oil painting with thick impasto brushwork, layered glazes, rich chiaroscuro, and luminous depth.",
    tags: ["oil_painting", "classical", "impasto", "traditional", "baroque"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>thick impasto oil painting, classical fine art masterwork</medium>\n<palette>rich layered glazes, warm earth tones, deep chiaroscuro, varnished luminous depth</palette>\n<composition>baroque triangular composition, dramatic atmospheric staging</composition>\n<texture>visible thick brush strokes, palette knife marks, canvas weave texture, crackled glaze</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, digital, smooth, flat, cel_shaded, anime, vector, camera lens",
  },

  photorealism: {
    id: "photorealism",
    name: "RAW Photography",
    portrait: "",
    description: "Unfiltered commercial photography captured with high-end medium format optics, natural dynamic range, and rich micro-textures.",
    tags: ["photography", "realistic", "default", "raw", "lifelike", "hasselblad"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>RAW commercial photograph, unedited sensor capture</medium>\n<palette>natural dynamic range, neutral balance, naturalistic key and fill lighting</palette>\n<camera>Hasselblad X2D 100C, 85mm prime f/1.2 lens, shallow depth of field, crisp optical focus</camera>\n<texture>natural skin pores, fine fabric weave micro-details, natural glass refraction</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "anime, illustration, 3d render, cartoon, drawing, painting, digital painting, glossy skin, smooth airbrushed",
  },

  pixel_art: {
    id: "pixel_art",
    name: "Pixel Art",
    portrait: "",
    description: "Retro 16-bit video game sprite aesthetic featuring a limited color palette, crisp blocky pixel grids, and dithered shading.",
    tags: ["pixel_art", "retro", "16bit", "dithered", "indie_game"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>retro pixel art, 16-bit video game sprite</medium>\n<palette>limited 32-color palette, dithered shading, vibrant contrasting colors</palette>\n<composition>fixed orthographic perspective, side-scroller or top-down grid alignment</composition>\n<texture>crisp square pixels, visible dithering patterns, zero anti-aliasing, blocky forms</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, realistic, smooth, anti-aliased, high resolution, 3d render, oil painting, camera lens",
  },

  retro_synthwave: {
    id: "retro_synthwave",
    name: "Retro Synthwave",
    portrait: "",
    description: "1980s retro-futuristic outrun visual style with neon grid horizons, wireframe sunsets, chrome surfaces, and CRT scan lines.",
    tags: ["synthwave", "retro", "80s", "neon", "vaporwave", "outrun"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>1980s outrun digital artwork, retro synthwave art</medium>\n<palette>neon magenta and purple gradients, vibrant orange horizon, deep twilight navy blue</palette>\n<composition>low ground perspective, vanishing point perspective grid, wide-angle framing</composition>\n<texture>chrome reflections, glowing neon glass tubes, subtle CRT scanlines, grid floor</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "medieval, natural, realistic, documentary, watercolor, oil painting, historical, pastel",
  },

  risograph: {
    id: "risograph",
    name: "Risograph Print",
    portrait: "",
    description: "Tactile spot-color print aesthetic featuring overlapping vivid inks, subtle registration misalignment, and dithered paper texture.",
    tags: ["risograph", "printmaking", "retro", "dithered", "tactile", "spot_color"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>risograph spot-color print illustration</medium>\n<palette>dual-tone neon pink and sunflower yellow inks, overlapping color translucent bleeds</palette>\n<composition>graphic poster layout, bold shapes, intentional negative space balance</composition>\n<texture>heavy tooth recycled paper texture, grain dithering, subtle ink registration misalignment</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, 3d render, smooth gradient, hyperrealistic, glossy",
  },

  stained_glass: {
    id: "stained_glass",
    name: "Stained Glass",
    portrait: "",
    description: "Gothic cathedral stained glass artwork with backlit translucent jewel-toned glass panels and dark lead came borders.",
    tags: ["stained_glass", "gothic", "mosaic", "glass", "backlit", "artisan"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>gothic cathedral stained glass window mosaic</medium>\n<palette>luminous backlit ruby red, cobalt blue, and emerald green translucent glass panels</palette>\n<composition>symmetrical architectural framing, arched window border layout</composition>\n<texture>thick black lead came soldering contours, subtle glass air bubbles, crackled surface refractions</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, realistic skin, 3d digital render, canvas, paper drawing",
  },

  steampunk: {
    id: "steampunk",
    name: "Steampunk & Dieselpunk",
    portrait: "",
    description: "Victorian industrial retro-futurism featuring polished brass machinery, copper piping, exposed clockwork gears, and steam vents.",
    tags: ["steampunk", "dieselpunk", "industrial", "brass", "retro_futurism"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>steampunk digital illustration, industrial concept art</medium>\n<palette>polished brass, warm copper tones, aged leather brown, glowing amber furnace light</palette>\n<composition>intricate mechanical staging, heroic central character framing, architectural depth</composition>\n<texture>tarnished metal surfaces, rivet patterns, polished brass reflections, swirling steam clouds</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "modern plastic, neon, cyberpunk, anime, soft watercolor, flat vector",
  },

  studio_ghibli: {
    id: "studio_ghibli",
    name: "Studio Ghibli",
    portrait: "",
    description: "Warm hand-painted animation style with lush scenic landscapes, soft watercolor wash backgrounds, and nostalgic warmth.",
    tags: ["studio_ghibli", "anime", "hand_painted", "nostalgic", "whimsical"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>hand-painted anime animation cel, traditional 2d film frame</medium>\n<palette>warm earthy tones, soft pastel skies, lush green landscapes, gentle golden light</palette>\n<composition>wide establishing environmental layout, gentle framing, intimate character focus with soft background depth</composition>\n<texture>hand-painted watercolor backgrounds, soft cel shading on characters, visible brush texture</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, 3d render, realistic, dark, gritty, cyberpunk, harsh neon lighting",
  },

  surrealism: {
    id: "surrealism",
    name: "Surrealism",
    portrait: "",
    description: "Dreamlike surrealist painting blending impossible physical geometries, distorted melting perspectives, and subconscious symbolism.",
    tags: ["surrealism", "dreamlike", "abstract", "symbolic", "subconscious"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>surrealist oil painting, dreamlike conceptual artwork</medium>\n<palette>ethereal color gradients, shifting iridescent tones, deep velvety shadows</palette>\n<composition>distorted spatial logic, impossible physical geometry, symbolic layout</composition>\n<texture>smooth blended brushwork with sharp impossible juxtapositions, marble-like polish</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, realistic, mundane, ordinary, plain, documentary, camera lens",
  },

  ukiyo_e: {
    id: "ukiyo_e",
    name: "Ukiyo-e Woodblock Print",
    portrait: "",
    description:
      "Traditional Edo-period Japanese woodblock print featuring organic sumi-e ink contours, flat mineral pigments, and subtle wood grain impressions.",
    tags: ["ukiyo_e", "japanese", "woodblock", "traditional", "print", "hokusai"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>traditional Edo-period ukiyo-e woodblock print</medium>\n<palette>flat mineral pigments, indigo blue, burnt orange, muted cream, sumi-e black ink</palette>\n<composition>asymmetrical Japanese layout, flat space perspective, atmospheric horizon wave framing</composition>\n<texture>visible relief wood grain impressions, fibrous hand-pressed washi paper texture</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, modern 3d render, glossy reflections, volumetric lighting, oil painting",
  },

  vaporwave: {
    id: "vaporwave",
    name: "Vaporwave",
    portrait: "",
    description:
      "Nostalgic 1990s digital collage blending pastel cyan and magenta gradients, classical marble statues, glitch artifacts, and early web aesthetic.",
    tags: ["vaporwave", "90s", "pastel", "glitch", "aesthetic", "lofi"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>vaporwave digital collage, 90s graphic art</medium>\n<palette>pastel cyan, soft lavender, hot pink gradients, washed-out turquoise, golden sunset reflections</palette>\n<composition>surreal multi-plane collage layout, floating geometric wireframes, classical statue framing</composition>\n<texture>analog video line noise, chromatic edge bleeding, smooth marble polish, pixelated gradient steps</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "dark, gritty, hyperrealistic photograph, raw film, dark fantasy, medieval",
  },

  vintage_analog: {
    id: "vintage_analog",
    name: "Vintage 35mm Film",
    portrait: "",
    description: "Authentic 35mm film photo with warm Kodak Portra saturation, organic grain structure, soft lens fall-off, and subtle light leaks.",
    tags: ["analog", "35mm", "vintage", "film", "retro", "photography"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>35mm analog photo scan, street documentary capture</medium>\n<palette>warm Kodak Portra 400 color profile, golden hour sidelighting, organic color bleeding</palette>\n<camera>Leica rangefinder, 35mm f/2.0 lens, soft focal edge roll-off</camera>\n<texture>authentic 35mm film stock grain, subtle light leak anomalies, soft shadow roll-off</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "digital, glossy, 3d render, anime, harsh digital sharpness, vector",
  },

  watercolor: {
    id: "watercolor",
    name: "Watercolor",
    portrait: "",
    description:
      "Delicate watercolor painting featuring soft wet-on-wet washes, pigment diffusion bleeding, granulating textures, and translucent layering.",
    tags: ["watercolor", "painting", "organic", "soft", "translucent"],
    visual_engine:
      "<VISUAL_ENGINE>\n<medium>delicate watercolor painting, wet-on-wet technique</medium>\n<palette>soft translucent washes, bleeding pigment edges, pastel undertones with granulating textures</palette>\n<composition>fluid organic framing, gentle vignetting, soft negative space balance</composition>\n<texture>cold-press paper grain texture visible through washes, pooling water marks, dry brush accents</texture>\n</VISUAL_ENGINE>",
    negative_prompt: "photograph, 3d render, sharp hard edges, digital, vector, cel_shaded, camera lens",
  },
};
