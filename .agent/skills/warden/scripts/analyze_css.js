// File: .agent/skills/warden/scripts/analyze_css.js
import autoprefixer from "autoprefixer"
import fs from "fs"
import path from "path"
import postcss from "postcss"
import * as sass from "sass"
import { fileURLToPath } from "url"
import glob from "glob"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "../../../..")

// --- CONFIGURATION ---
const SCSS_ENTRY = path.join(ROOT, "src/theme/scss/app.scss")
const PICO_PATH = path.join(ROOT, "libs/pico.min.css")
const OUTPUT_CSS = path.join(ROOT, "src/theme/static/app.css")

// --- HYGIENE RULES ---
const VIOLATIONS = {
    hex: [],
    pixels: [],
    inline: [],
}

// --- 1. COMPILE ---
async function compileScss() {
    if (!fs.existsSync(SCSS_ENTRY)) {
        throw new Error(`❌ SCSS entry not found: ${SCSS_ENTRY}`)
    }

    let picoCss = ""
    if (fs.existsSync(PICO_PATH)) {
        picoCss = fs.readFileSync(PICO_PATH, "utf8")
    }

    console.log("⚙️ Compiling SASS...")
    const sassResult = sass.compile(SCSS_ENTRY, {
        loadPaths: [path.join(ROOT, "node_modules")],
    })

    const combinedCss = picoCss + "\n" + sassResult.css

    console.log("⚙️ Running PostCSS & Autoprefixer...")
    const result = await postcss([autoprefixer]).process(combinedCss, {
        from: undefined,
    })
    return result.css
}

// --- 2. GENERATE ATOMIC UTILITIES ---
function generateAtomicClasses(designTokens) {
    console.log("⚡ Generating Atomic Classes...")
    let css = "\n\n/* --- WARDEN GENERATED UTILITIES --- */\n\n"

    // Spacing
    ;[0, 0.25, 0.5, 1, 1.5, 2, 3, 4].forEach((size) => {
        const str = size.toString().replace(".", "-")
        css += `.m-${str} { margin: ${size}rem; }\n`
        css += `.p-${str} { padding: ${size}rem; }\n`
    })

    // Colors
    const variants = ["bg", "text"]
    designTokens.colors.forEach((color) => {
        variants.forEach((variant) => {
            css += `.${variant}-${color.name} { ${
                variant === "bg" ? "background-color" : "color"
            }: var(--${color.name}); }\n`
        })
    })

    // Responsive Hiding
    css += `@media (max-width: 768px) { .md\\:hidden { display: none; } }\n`
    return css
}

// --- 3. ANALYZE (AST) ---
function analyzeAst(root) {
    console.log("🛡️ Scanning CSS AST...")
    const stats = {
        selectors: 0,
        ids: 0,
        designTokens: { colors: [] },
    }

    root.walkDecls((decl) => {
        // Extract Tokens
        if (decl.prop.startsWith("--")) {
            if (decl.prop.includes("color"))
                stats.designTokens.colors.push({ name: decl.prop.substring(2) })
        }

        // Check Hygiene: Hardcoded Hex
        if (/#([0-9A-Fa-f]{3}){1,2}\b/.test(decl.value)) {
            VIOLATIONS.hex.push(
                `${decl.prop}: ${decl.value} (Line ${decl.source.start.line})`
            )
        }

        // Check Hygiene: Magic Pixels (Ignore 1px borders)
        if (
            /\d+px/.test(decl.value) &&
            !decl.value.includes("1px") &&
            !decl.prop.includes("border")
        ) {
            VIOLATIONS.pixels.push(
                `${decl.prop}: ${decl.value} (Line ${decl.source.start.line})`
            )
        }
    })

    root.walkRules((rule) => {
        stats.selectors++
        if (rule.selector.includes("#")) stats.ids++
    })

    return stats
}

// --- 4. ANALYZE SVELTE (INLINE STYLES) ---
function scanSvelteFiles() {
    console.log("🛡️ Scanning Svelte files for inline styles...")
    const files = glob.sync("src/**/*.svelte", { cwd: ROOT })

    files.forEach((file) => {
        const content = fs.readFileSync(path.join(ROOT, file), "utf-8")
        if (content.match(/style="[^"]*"/g)) {
            VIOLATIONS.inline.push(file)
        }
    })
}

// --- MAIN ---
;(async () => {
    try {
        // 1. Build
        const compiledCss = await compileScss()
        const ast = postcss.parse(compiledCss)

        // 2. Analyze & Extract Tokens
        const stats = analyzeAst(ast)
        scanSvelteFiles()

        // 3. Generate Utilities
        const atomicCss = generateAtomicClasses(stats.designTokens)
        const finalCss = compiledCss + atomicCss

        // 4. Save
        // Check if directory exists, if not create it
        const dir = path.dirname(OUTPUT_CSS)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        fs.writeFileSync(OUTPUT_CSS, finalCss)
        console.log(`✅ CSS Built & Saved: ${OUTPUT_CSS}`)

        // 5. Report
        console.log("\n--- 🛡️ WARDEN REPORT ---")
        console.log(`Total Selectors: ${stats.selectors}`)
        console.log(`ID Selectors (Bad): ${stats.ids}`)

        if (VIOLATIONS.hex.length > 0) {
            console.log(
                `\n⚠️  ${VIOLATIONS.hex.length} Hardcoded Hex Colors (Use vars!)`
            )
            // console.log(VIOLATIONS.hex.slice(0, 5)) // Show first 5
        }
        if (VIOLATIONS.pixels.length > 0) {
            console.log(
                `\n⚠️  ${VIOLATIONS.pixels.length} Magic Pixels (Use rem!)`
            )
        }
        if (VIOLATIONS.inline.length > 0) {
            console.log(
                `\n⚠️  ${VIOLATIONS.inline.length} Svelte files with inline styles`
            )
            console.log(VIOLATIONS.inline)
        }

        if (stats.ids > 0 || VIOLATIONS.inline.length > 0) {
            console.log("\n❌ Architectural violations found.")
            process.exit(1)
        } else {
            console.log("\n✨ Codebase is clean.")
        }
    } catch (e) {
        console.error("❌ Build Failed:", e)
        process.exit(1)
    }
})()
