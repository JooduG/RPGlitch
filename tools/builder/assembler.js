import { JSDOM, VirtualConsole } from "jsdom";
import fs from "fs/promises";
import path from "path";
import { PATHS, PERCHANCE_BRIDGE, LIBS_TO_INJECT } from "./config.js";

export async function assembleHtml(css, appJs) {
  console.log("🏗️ [Assembler] Constructing Monolith...");

  const rawHtml = await fs.readFile(PATHS.HTML_TEMPLATE, "utf8");

  // Suppress specific CSS parsing errors from JSDOM
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (error) => {
    if (error.message.includes("Could not parse CSS stylesheet")) return;
    console.error(error);
  });

  const dom = new JSDOM(rawHtml, { virtualConsole });
  const doc = dom.window.document;

  // 1. CLEANUP: Remove dev artifacts
  console.log("   - Purging development script tags...");
  doc.querySelectorAll("script").forEach((s) => s.remove());
  doc.querySelectorAll("link[rel='stylesheet']").forEach((l) => l.remove());

  // 2. INJECT CSS
  const styleTag = doc.createElement("style");
  styleTag.textContent = css;
  doc.head.appendChild(styleTag);

  // 3. INJECT LIBS
  // Helper to safely escape scripts for inline HTML
  const escapeScript = (str) =>
    str
      .replace(/<\/script/gi, "\\x3C/script")
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029");

  for (const file of LIBS_TO_INJECT) {
    try {
      const content = await fs.readFile(path.join(PATHS.LIBS, file), "utf8");
      const script = doc.createElement("script");
      script.textContent = escapeScript(content);
      doc.body.appendChild(script);
      console.log(`   + Injected Lib: ${file}`);
    } catch (e) {
      console.log(`   ℹ️ Note: Optional lib ${file} not found.`);
    }
  }

  // 4. INJECT APP
  // 4. INJECT APP (DELAYED)
  // we inject this after serialization to avoid JSDOM mangling the code
  const appScript = `<script>${escapeScript(appJs)}</script>`;

  // 5. SERIALIZE & FINALIZE
  let outputHtml = dom.serialize();

  // Inject Config Marker for Perchance (Legacy support / future-proofing)
  outputHtml = outputHtml.replace(
    "</head>",
    "<!--PERCHANCE_CONFIG_TARGET--></head>",
  );

  // Inject App Bundle (Manual Injection)
  // We use lastIndexOf to safely find the closing body tag, ensuring we don't
  // accidentally replace a "</body>" string occurring inside an inlined library script.
  const bodyCloseIndex = outputHtml.lastIndexOf("</body>");
  if (bodyCloseIndex !== -1) {
    outputHtml =
      outputHtml.substring(0, bodyCloseIndex) +
      appScript +
      outputHtml.substring(bodyCloseIndex);
  } else {
    console.warn(
      "⚠️ [Assembler] Could not find </body> tag. Appending script to end.",
    );
    outputHtml += appScript;
  }

  // Inject Bridge directly into body start
  // We do this after serialization to avoid JSDOM escaping our special bridge code
  outputHtml = outputHtml.replace(
    /<body[^>]*>/,
    (match) => match + PERCHANCE_BRIDGE,
  );

  return outputHtml;
}
