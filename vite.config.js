import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";
import { viteSingleFile } from "vite-plugin-singlefile";

// 🎨 Design Token Sync Plugin
function designTokenSync() {
  return {
    name: "design-token-sync",
    buildStart() {
      try {
        console.log("🎨 Syncing design tokens...");
        execSync("node ./.agents/skills/design/scripts/sync-css.js", {
          stdio: "inherit",
        });
      } catch (err) {
        console.error("❌ Design token sync failed:", err.message);
      }
    },
    handleHotUpdate({ file }) {
      if (file.endsWith("DESIGN.md")) {
        try {
          console.log("🎨 DESIGN.md changed, resyncing tokens...");
          execSync("node ./.agents/skills/design/scripts/sync-css.js", {
            stdio: "inherit",
          });
        } catch (err) {
          console.error("❌ Design token sync failed:", err.message);
        }
      }
    },
  };
}

// 🛡️ Perchance Airtight In-Place Base64 Vault Plugin
function perchanceBase64Vault() {
  return {
    name: "perchance-base64-vault",
    closeBundle() {
      const targetOutput = path.resolve(__dirname, "dist/index.html");
      try {
        if (fs.existsSync(targetOutput)) {
          let html = fs.readFileSync(targetOutput, "utf8");

          const toBase64 = (str) => Buffer.from(str, "utf8").toString("base64");

          // 1. Encapsulate compiled inline CSS style rules safely
          html = html.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (match, cssContent) => {
            if (cssContent.trim().length < 5) return match;
            const b64 = toBase64(cssContent);
            const chunks = b64.match(/.{1,10000}/g) || [];
            const arrayStr = JSON.stringify(chunks);
            return `<script>
              (function() {
                try {
                  const b64 = ${arrayStr}.join('');
                  const css = decodeURIComponent(atob(b64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                  }).join(''));
                  const style = document.createElement('style');
                  style.textContent = css;
                  document.head.appendChild(style);
                } catch(e) { console.error("CSS vault extraction failed:", e); }
              })();
            </script>`;
          });

          // 2. Encapsulate internal bundled JS code scripts while ignoring external CDN script tags and data-no-vault scripts
          html = html.replace(/<script([^>]*)>([\s\S]*?)<\/script>/gi, (match, attributes, jsContent) => {
            if (attributes.includes("src=")) return match;
            if (attributes.includes("data-no-vault")) return match;
            if (jsContent.trim().length < 10) return match;

            const b64 = toBase64(jsContent);
            const chunks = b64.match(/.{1,10000}/g) || [];
            const arrayStr = JSON.stringify(chunks);
            const isModule = attributes.includes('type="module"') || attributes.includes("type='module'");

            return `<script>
              (function() {
                try {
                  const b64 = ${arrayStr}.join('');
                  const js = decodeURIComponent(atob(b64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                  }).join(''));
                  const script = document.createElement('script');
                  if (${isModule}) script.type = 'module';
                  script.textContent = js;
                  document.body.appendChild(script);
                } catch(e) { console.error("JS vault extraction failed:", e); }
              })();
            </script>`;
          });

          fs.writeFileSync(targetOutput, html, "utf8");
          console.log("🛡️ [Vault Complete] Inline assets wrapped securely in Base64 protection.");
        }
      } catch (err) {
        console.error("❌ Vault processing breakdown:", err.message);
      }
    },
  };
}

export default defineConfig(({ command, mode }) => {
  const isDev = command === "serve";

  return {
    root: "src",
    define: {
      "import.meta": "{}",
    },
    plugins: [
      designTokenSync(),
      tailwindcss(),
      svelte({ configFile: path.resolve(__dirname, "svelte.config.js") }),
      !isDev && viteSingleFile(),
      !isDev && perchanceBase64Vault(),
      devtoolsJson(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@platform": path.resolve(__dirname, "./src/platform"),
        "@intelligence": path.resolve(__dirname, "./src/intelligence"),
        "@engine": path.resolve(__dirname, "./src/engine"),
        "@data": path.resolve(__dirname, "./src/data"),
        "@state": path.resolve(__dirname, "./src/state"),
        "@media": path.resolve(__dirname, "./src/media"),
        "@ui": path.resolve(__dirname, "./src/ui"),
        "@atoms": path.resolve(__dirname, "./src/ui/atoms"),
        "@actions": path.resolve(__dirname, "./src/ui/actions"),
        "@motion": path.resolve(__dirname, "./src/ui/motion"),
        "@utils": path.resolve(__dirname, "./src/ui/utils"),
        "@organisms": path.resolve(__dirname, "./src/ui/organisms"),
        "@molecules": path.resolve(__dirname, "./src/ui/molecules"),
      },
      extensions: [".svelte", ".js", ".ts", ".mjs"],
    },
    build: {
      target: "esnext",
      outDir: "../dist",
      emptyOutDir: true,
      cssCodeSplit: false,
      minify: "esbuild",
      sourcemap: mode === "development",
      assetsInlineLimit: 100000000,
      rollupOptions: {
        output: {
          format: "iife",
          name: "RPGlitch",
          inlineDynamicImports: true,
        },
      },
    },
    server: {
      port: 4001,
      strictPort: false,
      open: true,
      watch:
        mode === "test"
          ? null
          : {
              ignored: ["!**/DESIGN.md"],
            },
    },
    preview: {
      port: 8080,
    },
    test: {
      pool: "forks",
      teardownTimeout: 1000,
    },
  };
});
