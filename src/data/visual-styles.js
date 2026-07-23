/**
 * src/data/visual-styles.js
 * 🎨 VISUAL STYLE SYSTEM — Aesthetic Engine presets for image generation.
 * Mirrors the Narrative Style System structure for prose.
 * Each entry's `visual_engine` XML block is injected into diffusion prompt engineering.
 *
 * SCHEMA CONVENTIONS:
 * - Photographic/Cinematic mediums use `<camera>` for lens specs and optical setups.
 * - Illustrated/Artistic mediums use `<composition>` for perspective and layout framing.
 *
 * @typedef {Object} VisualStyle
 * @property {string} id - Unique identifier matching the registry key
 * @property {string} name - Display title shown in the UI dropdowns
 * @property {string} portrait - Optional preview thumbnail asset path
 * @property {string} description - Detailed aesthetic summary for tooltips and previews
 * @property {string[]} tags - Search and taxonomy filter keywords
 * @property {string} visual_engine - Injected XML prompt block containing medium, palette, camera/composition, texture, and negative_prompt
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
  },
  photorealism: {
    id: "photorealism",
    name: "Photorealism",
    portrait: "",
    description:
      "Ultra-realistic RAW photography with natural lighting, film grain, and shallow depth of field. Captures subjects as lifelike photographs with crisp texture definition.",
    tags: ["photography", "realistic", "default", "raw", "lifelike", "8k"],
    visual_engine: `<VISUAL_ENGINE>
<medium>RAW photograph, photorealistic 8k rendering</medium>
<palette>kodak vision3 color profile, natural lighting, fine film grain</palette>
<camera>85mm prime f/1.2 lens, shallow depth of field</camera>
<texture>crisp asset definition, micro-detailed surface textures</texture>
<negative_prompt>anime, illustration, 3d render, cartoon, drawing, painting</negative_prompt>
</VISUAL_ENGINE>`,
  },
  vintage_analog: {
    id: "vintage_analog",
    name: "Vintage 35mm Film",
    portrait: "",
    description:
      "Authentic vintage 35mm analog film scan with warm color saturation, organic grain structure, soft lens flares, and timeless documentary feel.",
    tags: ["analog", "35mm", "vintage", "film", "retro", "photography"],
    visual_engine: `<VISUAL_ENGINE>
<medium>vintage 35mm analog film scan, Leica rangefinder documentary capture</medium>
<palette>warm kodak portra 400 tones, golden hour sidelighting, organic analog color bleeding</palette>
<camera>35mm summicron f/2.0 lens, soft focal edge roll-off</camera>
<texture>authentic 35mm film stock grain, subtle light leak anomalies, soft contrast shadow roll-off</texture>
<negative_prompt>digital, glossy, 3d render, anime, harsh digital sharpness, vector</negative_prompt>
</VISUAL_ENGINE>`,
  },
  film_noir: {
    id: "film_noir",
    name: "Film Noir",
    portrait: "",
    description:
      "Classic film noir with high-contrast black and white, dramatic shadows, and venetian blind lighting. Channels 1940s detective cinema.",
    tags: ["film_noir", "monochrome", "detective", "1940s", "shadows"],
    visual_engine: `<VISUAL_ENGINE>
<medium>classic film noir photograph, 1940s black and white cinema master</medium>
<palette>high contrast monochrome, deep crushed blacks, harsh white key lights, silver gelatin print tones</palette>
<camera>hard edge shadows from venetian blinds, dramatic chiaroscuro, dutch angles</camera>
<texture>heavy film grain, cigarette smoke haze, glossy wet pavement reflections</texture>
<negative_prompt>color, vibrant, saturated, modern, digital, anime, cartoon, illustration</negative_prompt>
</VISUAL_ENGINE>`,
  },
  anime: {
    id: "anime",
    name: "Anime",
    portrait: "",
    description:
      "Vibrant cel-shaded anime art style with clean line work, expressive eyes, and stylized proportions reminiscent of modern anime productions.",
    tags: ["anime", "cel_shading", "illustration", "2d", "stylized"],
    visual_engine: `<VISUAL_ENGINE>
<medium>anime cel-shaded illustration, hand-drawn 2d animation style</medium>
<palette>vibrant saturated colors, clean flat shading with rim light accents</palette>
<composition>dynamic dramatic angles, foreshortened perspective, heroic character framing</composition>
<texture>smooth clean line art, flat color fills with subtle gradient shading</texture>
<negative_prompt>photograph, realistic, 3d render, photorealistic, oil painting, watercolor</negative_prompt>
</VISUAL_ENGINE>`,
  },
  studio_ghibli: {
    id: "studio_ghibli",
    name: "Studio Ghibli",
    portrait: "",
    description: "Warm hand-painted Studio Ghibli animation style with lush backgrounds, soft watercolor textures, and gentle nostalgic atmosphere.",
    tags: ["studio_ghibli", "anime", "hand_painted", "nostalgic", "whimsical"],
    visual_engine: `<VISUAL_ENGINE>
<medium>Studio Ghibli style hand-painted animation cel, traditional 2d anime</medium>
<palette>warm earthy tones, soft pastel skies, lush green landscapes, gentle golden light</palette>
<composition>wide establishing environmental shots, gentle framing, intimate character focus with soft backgrounds</composition>
<texture>hand-painted watercolor backgrounds, soft cel shading on characters, visible brush texture</texture>
<negative_prompt>photograph, 3d render, realistic, dark, gritty, cyberpunk, harsh lighting</negative_prompt>
</VISUAL_ENGINE>`,
  },
  watercolor: {
    id: "watercolor",
    name: "Watercolor",
    portrait: "",
    description:
      "Delicate watercolor painting with soft washes, bleeding edges, and translucent layers. Creates an ethereal, organic atmosphere through pigment diffusion.",
    tags: ["watercolor", "painting", "organic", "soft", "translucent"],
    visual_engine: `<VISUAL_ENGINE>
<medium>delicate watercolor painting, wet-on-wet technique</medium>
<palette>soft translucent washes, bleeding pigment edges, pastel undertones with granulating textures</palette>
<composition>fluid organic framing, gentle vignetting, soft negative space balance</composition>
<texture>cold-press paper grain texture visible through washes, pooling water marks, dry brush accents</texture>
<negative_prompt>photograph, 3d render, sharp hard edges, digital, vector, cel_shaded, camera lens</negative_prompt>
</VISUAL_ENGINE>`,
  },
  oil_painting: {
    id: "oil_painting",
    name: "Oil Painting",
    portrait: "",
    description:
      "Classical oil painting with thick impasto brushstrokes, rich layered glazes, and luminous depth. Evokes the tradition of the old masters.",
    tags: ["oil_painting", "classical", "impasto", "traditional", "baroque"],
    visual_engine: `<VISUAL_ENGINE>
<medium>thick impasto oil painting, classical fine art masterwork</medium>
<palette>rich layered glazes, warm earth tones, deep chiaroscuro, varnished luminous depth</palette>
<composition>baroque triangular composition, dramatic atmospheric staging</composition>
<texture>visible thick brush strokes, palette knife marks, canvas weave texture, crackled glaze</texture>
<negative_prompt>photograph, digital, smooth, flat, cel_shaded, anime, vector, camera lens</negative_prompt>
</VISUAL_ENGINE>`,
  },
  ink_sketch: {
    id: "ink_sketch",
    name: "Ink & Line Art",
    portrait: "",
    description:
      "Detailed monochrome ink drawing with fine pen lines, dense crosshatching, and dramatic stippling. Channels classical engraving and sketchbook art.",
    tags: ["ink", "line_art", "sketch", "monochrome", "crosshatching", "drawing"],
    visual_engine: `<VISUAL_ENGINE>
<medium>detailed ink drawing, minimalist fine line art sketch</medium>
<palette>stark monochrome black ink on textured cream paper, subtle wash gradients</palette>
<composition>clean minimalist layout, intentional utilization of negative space, crisp subject outline</composition>
<texture>fine nib pen strokes, dense crosshatching shading, paper grain texture, stippling</texture>
<negative_prompt>photograph, 3d render, vibrant colors, blurry, soft gradients, cel_shaded</negative_prompt>
</VISUAL_ENGINE>`,
  },
  comic_book: {
    id: "comic_book",
    name: "Comic Book",
    portrait: "",
    description:
      "Bold comic book art with heavy ink lines, halftone shading, and dynamic panel compositions. Channels the energy of graphic novel storytelling.",
    tags: ["comic_book", "ink", "graphic_novel", "halftone", "bold"],
    visual_engine: `<VISUAL_ENGINE>
<medium>comic book illustration, bold inked graphic novel art</medium>
<palette>flat bold primary colors with halftone dot shading, high contrast saturation</palette>
<composition>dynamic foreshortened angles, dramatic panel composition, action-oriented framing</composition>
<texture>heavy black ink outlines, visible halftone screen tones, crosshatching shading</texture>
<negative_prompt>photograph, realistic, 3d render, soft, watercolor, oil painting</negative_prompt>
</VISUAL_ENGINE>`,
  },
  three_d_render: {
    id: "three_d_render",
    name: "3D Render (UE5)",
    portrait: "",
    description:
      "High-concept 3D render powered by Unreal Engine 5 optics, featuring ray-traced global illumination, realistic material reflections, and crisp architectural detail.",
    tags: ["3d_render", "ue5", "unreal_engine", "cgi", "raytracing"],
    visual_engine: `<VISUAL_ENGINE>
<medium>photorealistic 3d render, Unreal Engine 5 architectural scene</medium>
<palette>physically based lighting, volumetric god rays, ray-traced global illumination</palette>
<camera>cinematic 35mm focal setup, accurate specular reflections, ambient occlusion depth</camera>
<texture>crisp 3d asset definition, physically based material shaders, ray-traced reflections</texture>
<negative_prompt>flat 2d, illustration, drawing, watercolor, low poly, noisy, anime</negative_prompt>
</VISUAL_ENGINE>`,
  },
  cgi_animation: {
    id: "cgi_animation",
    name: "3D CGI Animation",
    portrait: "",
    description:
      "Stylized 3D animated movie aesthetic with soft subsurface scattering, expressive character lighting, and polished studio animation warmth.",
    tags: ["cgi", "animation", "3d", "stylized", "pixar"],
    visual_engine: `<VISUAL_ENGINE>
<medium>3d cgi character animation, high-end feature film render</medium>
<palette>warm vibrant key lighting, soft rim light glow, harmonious pastel palette</palette>
<composition>intimate character portrait framing, shallow depth separation, cinematic storytelling layout</composition>
<texture>soft subsurface skin scattering, velvety fabric textures, smooth polished surfaces</texture>
<negative_prompt>photograph, grainy, raw film, realistic human skin pores, rough impasto, 2d drawing</negative_prompt>
</VISUAL_ENGINE>`,
  },
  pixel_art: {
    id: "pixel_art",
    name: "Pixel Art",
    portrait: "",
    description: "Retro pixel art with limited color palettes, crisp blocky pixels, and dithered shading. Evokes the golden age of 16-bit gaming.",
    tags: ["pixel_art", "retro", "16bit", "dithered", "indie_game"],
    visual_engine: `<VISUAL_ENGINE>
<medium>retro pixel art, 16-bit era video game sprite</medium>
<palette>limited 32-color palette, dithered shading, vibrant contrasting colors</palette>
<composition>fixed orthographic perspective, top-down or side view, grid alignment</composition>
<texture>crisp square pixels, visible dithering patterns, no anti-aliasing, blocky forms</texture>
<negative_prompt>photograph, realistic, smooth, anti-aliased, high resolution, 3d render, oil painting, camera lens</negative_prompt>
</VISUAL_ENGINE>`,
  },
  cyberpunk: {
    id: "cyberpunk",
    name: "Cyberpunk",
    portrait: "",
    description:
      "Neon-soaked cyberpunk aesthetic with chrome surfaces, holographic interfaces, and dystopian urban decay. High-tech, low-life visual language.",
    tags: ["cyberpunk", "neon", "scifi", "dystopian", "chrome"],
    visual_engine: `<VISUAL_ENGINE>
<medium>cyberpunk digital art, neon-lit dystopian sci-fi rendering</medium>
<palette>vibrant neon magenta and cyan, deep blacks, holographic iridescent accents, harsh LED lighting</palette>
<composition>low angle dramatic perspective, wide-angle distortion, shallow depth framing</composition>
<texture>chrome reflections, rain-streaked glass, circuit board patterns, holographic interference</texture>
<negative_prompt>medieval, fantasy, natural, pastoral, watercolor, oil painting, antique</negative_prompt>
</VISUAL_ENGINE>`,
  },
  steampunk: {
    id: "steampunk",
    name: "Steampunk & Dieselpunk",
    portrait: "",
    description:
      "Victorian industrial retro-futurism featuring polished brass, copper pipework, visible clockwork gears, and atmospheric steam vents.",
    tags: ["steampunk", "dieselpunk", "industrial", "brass", "retro_futurism"],
    visual_engine: `<VISUAL_ENGINE>
<medium>steampunk digital illustration, industrial dieselpunk concept art</medium>
<palette>rich polished brass, warm copper tones, aged leather brown, glowing amber furnace light</palette>
<composition>intricate mechanical staging, heroic central character framing, architectural depth</composition>
<texture>tarnished metal surfaces, rivet patterns, polished brass reflections, swirling steam clouds</texture>
<negative_prompt>modern plastic, neon, cyberpunk, anime, soft watercolor, flat vector</negative_prompt>
</VISUAL_ENGINE>`,
  },
  dark_fantasy: {
    id: "dark_fantasy",
    name: "Dark Fantasy",
    portrait: "",
    description:
      "Grim dark fantasy art with eldritch atmospheres, gothic architecture, and deep shadow play. Channels ominous, brooding worlds of magic and dread.",
    tags: ["dark_fantasy", "gothic", "eldritch", "ominous", "shadow"],
    visual_engine: `<VISUAL_ENGINE>
<medium>dark fantasy illustration, gothic concept art</medium>
<palette>desaturated cold tones, deep blacks, sickly green glow, muted gold accents, ash gray</palette>
<composition>ominous low angles, looming perspective, fog-drenched depth layout</composition>
<texture>weathered stone, rusted iron, cracked bone, tattered fabric, moss-covered surfaces</texture>
<negative_prompt>bright, cheerful, sunny, pastel, cartoon, anime, photograph, modern</negative_prompt>
</VISUAL_ENGINE>`,
  },
  surrealism: {
    id: "surrealism",
    name: "Surrealism",
    portrait: "",
    description:
      "Dreamlike surrealist art blending impossible geometries, distorted perspectives, and symbolic imagery. Evokes the subconscious mind through visual metaphor.",
    tags: ["surrealism", "dreamlike", "abstract", "symbolic", "subconscious"],
    visual_engine: `<VISUAL_ENGINE>
<medium>surrealist painting, dreamlike conceptual art</medium>
<palette>ethereal impossible color gradients, shifting iridescent tones, deep velvety shadows</palette>
<composition>distorted melting spatial logic, impossible geometry, symbolic layout</composition>
<texture>smooth blended brushwork with sharp impossible juxtapositions, marble-like polish</texture>
<negative_prompt>photograph, realistic, mundane, ordinary, plain, documentary, camera lens</negative_prompt>
</VISUAL_ENGINE>`,
  },
  retro_synthwave: {
    id: "retro_synthwave",
    name: "Retro Synthwave",
    portrait: "",
    description:
      "1980s retro-futuristic synthwave aesthetic with neon grids, sunset gradients, and VHS scan lines. Channels the nostalgia of outrun culture.",
    tags: ["synthwave", "retro", "80s", "neon", "vaporwave", "outrun"],
    visual_engine: `<VISUAL_ENGINE>
<medium>retro synthwave digital art, 1980s outrun aesthetic</medium>
<palette>neon purple and hot pink gradients, sunset orange horizons, deep navy blues, magenta glow</palette>
<composition>low ground perspective, vanishing point grid, wide-angle retro-futuristic framing</composition>
<texture>chrome grid floors, VHS scan lines, CRT screen glow, neon tube light streaks</texture>
<negative_prompt>medieval, natural, realistic, documentary, watercolor, oil painting, historical</negative_prompt>
</VISUAL_ENGINE>`,
  },
  vaporwave: {
    id: "vaporwave",
    name: "Vaporwave",
    portrait: "",
    description:
      "Nostalgic 1990s vaporwave art combining pastel cyan and magenta gradients, classical marble busts, computer window frames, and surreal lo-fi glitches.",
    tags: ["vaporwave", "90s", "pastel", "glitch", "aesthetic", "lofi"],
    visual_engine: `<VISUAL_ENGINE>
<medium>vaporwave digital collage, 90s aesthetic graphic art</medium>
<palette>pastel cyan, soft lavender, hot pink gradients, washed-out turquoise, golden sunset reflections</palette>
<composition>surreal multi-plane collage layout, floating geometric wireframes, classical statue framing</composition>
<texture>analog video line noise, chromatic edge bleeding, smooth marble polish, pixelated gradient steps</texture>
<negative_prompt>dark, gritty, hyperrealistic photograph, raw film, dark fantasy, medieval</negative_prompt>
</VISUAL_ENGINE>`,
  },
};
