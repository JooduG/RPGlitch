import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
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
      const targetOutput = path.resolve(import.meta.dirname, "dist/index.html");
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
      svelte({ configFile: path.resolve(import.meta.dirname, "svelte.config.js") }),
      !isDev && viteSingleFile(),
      !isDev && perchanceBase64Vault(),
      devtoolsJson(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
        "@platform": path.resolve(import.meta.dirname, "./src/platform"),
        "@intelligence": path.resolve(import.meta.dirname, "./src/intelligence"),
        "@data": path.resolve(import.meta.dirname, "./src/data"),
        "@state": path.resolve(import.meta.dirname, "./src/state"),
        "@media": path.resolve(import.meta.dirname, "./src/media"),
        "@ui": path.resolve(import.meta.dirname, "./src/ui"),
        "@console": path.resolve(import.meta.dirname, "./src/ui/console"),
        "@story": path.resolve(import.meta.dirname, "./src/ui/story"),
        "@message": path.resolve(import.meta.dirname, "./src/ui/message"),
        "@entity": path.resolve(import.meta.dirname, "./src/ui/entity"),
        "@profile": path.resolve(import.meta.dirname, "./src/ui/profile"),
        "@image": path.resolve(import.meta.dirname, "./src/ui/image"),
        "@primitives": path.resolve(import.meta.dirname, "./src/ui/primitives"),
        "@motion": path.resolve(import.meta.dirname, "./src/ui/motion"),
        "@utils": path.resolve(import.meta.dirname, "./src/utils"),
        "@config": path.resolve(import.meta.dirname, "./src/config.js"),
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
        },
      },
    },
    server: {
      port: 4001,
      strictPort: false,
      open: false,
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
      projects: [
        {
          extends: "./vite.config.js",
          test: {
            name: "client",
            browser: {
              enabled: true,
              provider: playwright(),
              instances: [{ browser: "chromium", headless: true }],
            },
            include: ["src/**/*.svelte.{test,spec}.{js,ts}"],
            exclude: ["src/lib/server/**"],
          },
        },

        {
          extends: "./vite.config.js",
          test: {
            name: "server",
            environment: "node",
            include: ["src/**/*.{test,spec}.{js,ts}"],
            exclude: ["src/**/*.svelte.{test,spec}.{js,ts}"],
          },
        },
      ],
    },
  };
});
