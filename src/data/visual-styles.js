/**
 * src/data/visual-styles.js
 * 🎨 VISUAL STYLE SYSTEM — Aesthetic Engine presets for image generation.
 * Mirrors the Narrative Style System structure for prose.
 * Each entry's `visual_engine` XML block is injected into diffusion prompts.
 */
export const VISUAL_STYLES = {
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
<camera>dynamic dramatic angles, foreshortened perspective</camera>
<texture>smooth clean line art, flat color fills with subtle gradient shading</texture>
<negative_prompt>photograph, realistic, 3d render, photorealistic, oil painting, watercolor</negative_prompt>
</VISUAL_ENGINE>`,
  },
  surrealism: {
    id: "surrealism",
    name: "Surrealism",
    portrait: "",
    description:
      "Dreamlike surrealist art blending impossible geometries, distorted perspectives, and symbolic imagery. Evokes the subconscious mind through visual metaphor.",
    tags: ["surrealism", "dreamlike", "abstract", "symbolic", " subconscious"],
    visual_engine: `<VISUAL_ENGINE>
<medium>surrealist painting, dreamlike conceptual art</medium>
<palette>ethereal impossible color gradients, shifting iridescent tones, deep velvety shadows</palette>
<camera>distorted fisheye perspective, impossible geometry, melting spatial logic</camera>
<texture>smooth blended brushwork with sharp impossible juxtapositions, marble-like polish</texture>
<negative_prompt>photograph, realistic, mundane, ordinary, plain, documentary</negative_prompt>
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
<camera>gentle intimate framing, organic uneven borders</camera>
<texture>paper grain texture visible through washes, pooling water marks, dry brush accents</texture>
<negative_prompt>photograph, 3d render, sharp hard edges, digital, vector, cel_shaded</negative_prompt>
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
<medium>thick impasto oil painting, classical fine art</medium>
<palette>rich layered glazes, warm earth tones, deep chiaroscuro, varnished luminous depth</palette>
<camera>classical composed framing, baroque perspective</camera>
<texture>visible thick brush strokes, palette knife marks, canvas weave texture, crackled glaze</texture>
<negative_prompt>photograph, digital, smooth, flat, cel_shaded, anime, vector</negative_prompt>
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
<palette>flat bold colors with halftone dot shading, high contrast saturation</palette>
<camera>dynamic foreshortened angles, dramatic panel composition</camera>
<texture>heavy black ink outlines, visible halftone screen tones, crosshatching shading</texture>
<negative_prompt>photograph, realistic, 3d render, soft, watercolor, oil painting</negative_prompt>
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
<camera>low angle dramatic perspective, wide-angle distortion, shallow depth of field</camera>
<texture>chrome reflections, rain-streaked glass, circuit board patterns, holographic interference</texture>
<negative_prompt>medieval, fantasy, natural, pastoral, watercolor, oil painting, antique</negative_prompt>
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
<camera>ominous low angles, looming perspective, fog-drenched depth</camera>
<texture>weathered stone, rusted iron, cracked bone, tattered fabric, moss-covered surfaces</texture>
<negative_prompt>bright, cheerful, sunny, pastel, cartoon, anime, photograph, modern</negative_prompt>
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
<camera>fixed orthographic perspective, top-down or side view</camera>
<texture>crisp square pixels, visible dithering patterns, no anti-aliasing, blocky forms</texture>
<negative_prompt>photograph, realistic, smooth, anti-aliased, high resolution, 3d render, oil painting</negative_prompt>
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
<medium>classic film noir photograph, 1940s black and white cinema</medium>
<palette>high contrast monochrome, deep crushed blacks, harsh white key lights, silver gelatin print tones</palette>
<camera>hard edge shadows from venetian blinds, dramatic chiaroscuro, dutch angles</camera>
<texture>heavy film grain, cigarette smoke haze, glossy wet pavement reflections</texture>
<negative_prompt>color, vibrant, saturated, modern, digital, anime, cartoon, illustration</negative_prompt>
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
<camera>wide establishing shots, gentle panning, intimate close-ups with soft bokeh backgrounds</camera>
<texture>hand-painted watercolor backgrounds, soft cel shading on characters, visible brush texture</texture>
<negative_prompt>photograph, 3d render, realistic, dark, gritty, cyberpunk, harsh lighting</negative_prompt>
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
<camera>low ground perspective, vanishing point grid, wide-angle retro-futuristic framing</camera>
<texture>chrome grid floors, VHS scan lines, CRT screen glow, neon tube light streaks</texture>
<negative_prompt>medieval, natural, realistic, documentary, watercolor, oil painting, historical</negative_prompt>
</VISUAL_ENGINE>`,
  },
};
