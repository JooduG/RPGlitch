#!/usr/bin/env node

/************************************************************************************
 * 🚀 [SECTION: DEPLOY TO PERCHANCE]
 * ----------------------------------------------------------------------------------
 * Automates deployment of the RPGlitch Vite build to the Perchance platform
 * via Playwright browser automation and CodeMirror 6 EditorView API injection.
 *
 * Usage: node .agents/skills/release/scripts/deploy-perchance.js
 * Env:   PERCHANCE_URL, PERCHANCE_USERNAME, PERCHANCE_KEY (from .env)
 *
 * Architecture:
 *   Left Panel  → src/RPGlitch-left-panel.perchance  → window.modelTextEditor
 *   Right Panel → dist/index.html              → window.outputTemplateEditor
 *   Save        → app.saveGenerator()
 ************************************************************************************/

import "dotenv/config";
import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { chromium } from "playwright";
import { createInterface } from "readline";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "..", "..", "..", "..");

/************************************************************************************
 * 🧩 [SECTION: CONFIGURATION]
 ************************************************************************************/

const CONFIG = {
  perchance_url: process.env.PERCHANCE_URL || "https://perchance.org/rpglitch#edit",
  perchance_username: process.env.PERCHANCE_USERNAME || "",
  perchance_key: process.env.PERCHANCE_KEY || "",

  left_panel_path: resolve(PROJECT_ROOT, "src", "RPGlitch-left-panel.perchance"),
  max_bundle_size: 1024 * 1024, // 1MB limit for Perchance stability
  right_panel_path: resolve(PROJECT_ROOT, "dist", "index.html"),

  // Optimization is a requirement for Perchance stability
  save_timeout: 15_000,
  page_load_timeout: 30_000,
  user_data_dir: resolve(PROJECT_ROOT, ".playwright-auth"),
};

/************************************************************************************
 * 🧩 [SECTION: UTILITIES]
 ************************************************************************************/

/**
 *
 */
function log(emoji, message) {
  const timestamp = new Date().toISOString().substring(11, 19);
  console.log(`  ${emoji} [${timestamp}] ${message}`);
}

/**
 *
 */
function fatal(message) {
  log("💀", `FATAL: ${message}`);
  process.exit(1);
}

/**
 *
 */
async function prompt_user(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`\n  ❓ ${question} `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

/************************************************************************************
 * 🧩 [SECTION: PRE-FLIGHT CHECKS]
 ************************************************************************************/

/**
 *
 */
function pre_flight() {
  log("🔍", "Running pre-flight checks...");

  // Check left panel exists
  if (!existsSync(CONFIG.left_panel_path)) {
    fatal(`Left panel not found: ${CONFIG.left_panel_path}`);
  }

  // Check right panel exists (dist/index.html)
  if (!existsSync(CONFIG.right_panel_path)) {
    fatal(`Right panel not found: ${CONFIG.right_panel_path}\n         Run "npm run build" first.`);
  }

  const left_content = readFileSync(CONFIG.left_panel_path, "utf-8");
  const right_content = readFileSync(CONFIG.right_panel_path, "utf-8");

  // Bundle size validation
  const left_size = Buffer.byteLength(left_content, "utf-8");
  const right_size = Buffer.byteLength(right_content, "utf-8");

  log(
    "📦",
    `Left Panel:  ${(left_size / 1024).toFixed(1)}KB (${left_content.split("\n").length} lines)`,
  );
  log(
    "📦",
    `Right Panel: ${(right_size / 1024).toFixed(1)}KB (${right_content.split("\n").length} lines)`,
  );

  if (right_size > CONFIG.max_bundle_size) {
    fatal(
      `Right panel exceeds ${CONFIG.max_bundle_size / 1024}KB limit: ${(right_size / 1024).toFixed(1)}KB`,
    );
  }

  if (left_size > CONFIG.max_bundle_size) {
    fatal(
      `Left panel exceeds ${CONFIG.max_bundle_size / 1024}KB limit: ${(left_size / 1024).toFixed(1)}KB`,
    );
  }

  log("✅", "Pre-flight checks passed.");
  return { left_content, right_content, left_size, right_size };
}

/************************************************************************************
 * 🧩 [SECTION: BROWSER AUTOMATION]
 ************************************************************************************/

/**
 *
 */
async function deploy({ left_content, right_content }) {
  const is_headless = process.env.HEADLESS === "true";
  log("🌐", `Launching browser (${is_headless ? "headless" : "headed"})...`);

  // Use persistent context to preserve login cookies across runs
  const context = await chromium.launchPersistentContext(CONFIG.user_data_dir, {
    headless: is_headless,
    viewport: { width: 1400, height: 900 },
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-infobars",
      "--window-position=0,0",
      "--ignore-certifcate-errors",
      "--ignore-certifcate-errors-spki-list",
    ],
  });

  const page = context.pages()[0] || (await context.newPage());

  try {
    // PHASE 1: Navigate to the generator (non-edit) to handle consent/login
    const base_url = CONFIG.perchance_url.replace("#edit", "");
    log("🧭", `Navigating to ${base_url}...`);
    await page.goto(base_url, {
      waitUntil: "networkidle",
      timeout: CONFIG.page_load_timeout,
    });

    // Detect Cloudflare / Security challenge
    const title = await page.title();
    if (
      title.includes("Just a moment") ||
      title.includes("Cloudflare") ||
      (await page.$("#cf-challenge"))
    ) {
      log("🛡️", "Cloudflare security challenge detected. Waiting for it to pass...");
      await page.waitForTimeout(15000); // Give it time to solve or for human intervention if in headed mode

      // Re-check
      const still_on_challenge = await page.evaluate(
        () =>
          document.title.includes("Just a moment") ||
          document.title.includes("Cloudflare") ||
          !!document.querySelector("#cf-challenge"),
      );

      if (still_on_challenge) {
        log("⚠️", "Still on Cloudflare challenge. Attempting to proceed anyway...");
      } else {
        log("✅", "Cloudflare challenge appears to have passed.");
      }
    }

    // PHASE 2: Dismiss cookie consent
    log("🍪", "Checking for cookie consent...");
    await page.waitForTimeout(5000); // Increase wait for complex CMPs to render

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const dismissed = await page.evaluate(() => {
          // Target buttons with direct keywords
          const buttons = Array.from(document.querySelectorAll('button, [role="button"], a.btn'));

          // Priority 1: Specific IAB/Quantcast selectors often seen on Perchance
          const specBtn = document.querySelector(
            '.qc-cmp2-summary-buttons button[mode="primary"], .qc-cmp2-buttons-desktop button:last-child',
          );
          if (specBtn && specBtn.offsetParent !== null) {
            specBtn.click();
            return "quantcast-primary";
          }

          // Priority 2: Exact keyword matching (Stricter)
          const exactKeywords = ["agree", "accept", "allow all", "accept all"];
          for (const btn of buttons) {
            const text = (btn.textContent || "").toLowerCase().trim();
            const visible = btn.offsetParent !== null && btn.offsetHeight > 0;
            if (visible && exactKeywords.includes(text)) {
              btn.click();
              return text;
            }
          }

          // Priority 3: Fuzzy matching
          const fuzzyKeywords = ["consent", "got it", "i understand"];
          for (const btn of buttons) {
            const text = (btn.textContent || "").toLowerCase().trim();
            const visible = btn.offsetParent !== null && btn.offsetHeight > 0;
            if (visible && text.length < 30 && fuzzyKeywords.some((kw) => text.includes(kw))) {
              btn.click();
              return text;
            }
          }
          return null;
        });

        if (dismissed) {
          log("✅", `Consent dismissed: "${dismissed}"`);
          // Wait for the modal/overlay to actually be removed from DOM
          await page
            .waitForFunction(
              () => {
                const overlay = document.querySelector(
                  '.qc-cmp2-container, #qc-cmp2-container, [class*="cmp-modal"]',
                );
                return !overlay || window.getComputedStyle(overlay).display === "none";
              },
              { timeout: 10000 },
            )
            .catch(() => log("⚠️", "Overlay still present but proceeding..."));

          await page.waitForTimeout(2000);
        } else {
          // Also try inside iframes (for legacy/third-party CMPs)
          for (const frame of page.frames()) {
            try {
              const iframe_result = await frame.evaluate(() => {
                const keywords = ["accept", "agree", "consent", "allow all"];
                const buttons = document.querySelectorAll('button, [role="button"]');
                for (const btn of buttons) {
                  const text = (btn.textContent || "").toLowerCase().trim();
                  const visible = btn.offsetParent !== null;
                  if (visible && text.length < 30 && keywords.some((kw) => text.includes(kw))) {
                    btn.click();
                    return text;
                  }
                }
                return null;
              });
              if (iframe_result) {
                log("✅", `Consent dismissed (iframe): "${iframe_result}"`);
                await page.waitForTimeout(2000);
                break;
              }
            } catch {
              /* cross-origin iframe */
            }
          }
          break; // No consent found, move on
        }
      } catch (e) {
        log("🔄", `Consent attempt ${attempt + 1} failed: ${e.message}`);
        await page.waitForTimeout(1000);
      }
    }

    // PHASE 3: Check login state
    log("🔐", "Checking login state...");
    const needs_login = await page.evaluate(() => {
      // The login button has data-ref="loginButton" and is display:none when logged in
      const login_btn = document.querySelector('[data-ref="loginButton"]');
      if (!login_btn) return true; // Can't find button, assume not logged in
      // Check computed display style — hidden means authenticated
      const style = window.getComputedStyle(login_btn);
      return style.display !== "none";
    });

    log("📊", `Auth state — Needs login: ${needs_login}`);

    if (needs_login) {
      log("🔐", "Not logged in. Attempting login...");
      await attempt_login(page);
      // Reload the page after login
      await page.goto(base_url, {
        waitUntil: "domcontentloaded",
        timeout: CONFIG.page_load_timeout,
      });
      await page.waitForTimeout(2000);
    } else {
      log("🔓", "Already authenticated as owner.");
    }

    // PHASE 4: Enter edit mode via Perchance API
    log("🛠️", "Activating edit mode via app.goToEditMode()...");
    await page.evaluate(() => {
      if (typeof window.app !== "undefined") {
        window.lastEditButtonClickTime = Date.now();
        window.app.goToEditMode();
      }
    });
    await page.waitForTimeout(2000);

    // PHASE 5: Wait for the editor
    log("⏳", "Waiting for CodeMirror editor to initialize...");
    const POLL_INTERVAL = 3_000;
    const MAX_WAIT = 60_000;
    const start = Date.now();
    let editor_found = false;

    while (Date.now() - start < MAX_WAIT) {
      const state = await page.evaluate(() => {
        const cm = document.querySelector(".cm-editor");
        const has_globals = !!(window.modelTextEditor && window.outputTemplateEditor);
        const has_app = typeof window.app !== "undefined";
        return { cm: !!cm, globals: has_globals, app: has_app, title: document.title };
      });

      if (state.cm && state.globals && state.app) {
        editor_found = true;
        break;
      }

      const elapsed = ((Date.now() - start) / 1000).toFixed(0);
      log("🔄", `[${elapsed}s] CM: ${state.cm} | Globals: ${state.globals} | App: ${state.app}`);
      await page.waitForTimeout(POLL_INTERVAL);
    }

    if (!editor_found) {
      throw new Error(
        `Editor did not load within ${MAX_WAIT / 1000}s. You may not be logged in as the generator owner.`,
      );
    }

    log("✅", "Editor loaded. Global references available.");

    // Read current content for comparison
    const current_state = await page.evaluate(() => ({
      model_length: window.modelTextEditor.state.doc.length,
      output_length: window.outputTemplateEditor.state.doc.length,
      save_state: window.perchanceSaveState,
    }));

    log(
      "📊",
      `Current state — Left: ${current_state.model_length} chars, Right: ${current_state.output_length} chars, Save: ${current_state.save_state}`,
    );

    // Inject Left Panel (modelTextEditor)
    log("📝", "Injecting Left Panel content...");
    const left_result = await page.evaluate((content) => {
      try {
        const view = window.modelTextEditor;
        view.dispatch({
          changes: {
            from: 0,
            to: view.state.doc.length,
            insert: content,
          },
        });
        return { success: true, new_length: view.state.doc.length };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }, left_content);

    if (!left_result.success) {
      fatal(`Failed to inject Left Panel: ${left_result.error}`);
    }
    log("✅", `Left Panel injected (${left_result.new_length} chars).`);

    // Inject Right Panel (outputTemplateEditor)
    log("📝", "Injecting Right Panel content...");
    const right_result = await page.evaluate((content) => {
      try {
        const view = window.outputTemplateEditor;
        view.dispatch({
          changes: {
            from: 0,
            to: view.state.doc.length,
            insert: content,
          },
        });
        return { success: true, new_length: view.state.doc.length };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }, right_content);

    if (!right_result.success) {
      fatal(`Failed to inject Right Panel: ${right_result.error}`);
    }
    log("✅", `Right Panel injected (${right_result.new_length} chars).`);

    // Save
    log("💾", "Saving generator...");
    const save_result = await page.evaluate(() => {
      try {
        if (typeof window.app !== "undefined") {
          window.app.saveGenerator();
          return { success: true };
        }
        return { success: false, error: "window.app is undefined" };
      } catch (e) {
        return { success: false, error: e.message };
      }
    });

    if (!save_result.success) {
      fatal(`Save failed: ${save_result.error}`);
    }

    // Wait for save to complete
    await page.waitForFunction(
      () => {
        return window.perchanceSaveState === "saved";
      },
      { timeout: CONFIG.save_timeout },
    );

    log("✅", "Generator saved successfully!");

    // Verify the output iframe reloaded
    log("🔍", "Verifying deployment...");
    await page.waitForTimeout(3000);

    const final_state = await page.evaluate(() => ({
      model_length: window.modelTextEditor.state.doc.length,
      output_length: window.outputTemplateEditor.state.doc.length,
      save_state: window.perchanceSaveState,
      iframe_src: document.querySelector("#outputIframeEl")?.src?.substring(0, 80),
    }));

    log(
      "📊",
      `Final state — Left: ${final_state.model_length} chars, Right: ${final_state.output_length} chars, Save: ${final_state.save_state}`,
    );
    log("🚀", `Deployment complete! Live at: https://perchance.org/rpglitch`);

    return true;
  } catch (error) {
    log("❌", `Deployment failed: ${error.message}`);
    console.error(error.stack);

    // Take a screenshot if possible
    try {
      const screenshotPath = resolve(PROJECT_ROOT, "deploy-error.png");
      await page.screenshot({ path: screenshotPath });
      log("📸", `Error screenshot saved to: ${screenshotPath}`);
    } catch {
      log("⚠️", "Could not take error screenshot.");
    }

    log("📋", "Falling back to clipboard mode...");

    // Fallback: copy content to clipboard and open editor
    try {
      await page.evaluate((content) => {
        navigator.clipboard.writeText(content);
      }, right_content);
      log("📋", "Right panel content copied to clipboard. Paste it manually into the HTML editor.");
    } catch {
      log("⚠️", "Clipboard fallback also failed. Content is in dist/index.html.");
    }

    return false;
  } finally {
    // Keep browser open briefly so user can verify
    log("⏳", "Keeping browser open for 5 seconds for verification...");
    await page.waitForTimeout(5000);
    await context.close();
  }
}

/************************************************************************************
 * 🧩 [SECTION: LOGIN HANDLER]
 ************************************************************************************/

/**
 *
 */
async function attempt_login(page) {
  if (!CONFIG.perchance_username || !CONFIG.perchance_key) {
    fatal("PERCHANCE_USERNAME and PERCHANCE_KEY must be set in .env");
  }

  // Open the login modal via Perchance API if not already present
  // CRITICAL: First clear any lingering overlays that might block the login button
  await page.evaluate(() => {
    const overlay = document.querySelector(
      '.qc-cmp2-container, #qc-cmp2-container, [class*="cmp-modal"]',
    );
    if (overlay) {
      console.log("Removing blocking overlay...");
      overlay.remove();
    }
  });

  let modal_present = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    modal_present = await page.evaluate(() => {
      const emailField = document.querySelector('input[placeholder="email"], input[type="email"]');
      const modalVisible = emailField && emailField.offsetParent !== null;
      if (!modalVisible) {
        if (typeof window.app !== "undefined") {
          window.app.openLoginModal();
        }
      }
      return modalVisible;
    });

    if (modal_present) break;
    log("🔑", `Login modal attempt ${attempt + 1}...`);
    await page.waitForTimeout(3000);
  }

  if (!modal_present) {
    log("⚠️", "Login modal not appearing via app.openLoginModal(). Trying direct selector wait...");
  }

  // Wait for the email input to be visible and then find both
  log("⏳", "Waiting for login fields...");
  try {
    await page.waitForSelector('input[placeholder="email"], input[type="email"]', {
      state: "visible",
      timeout: 10000,
    });
  } catch {
    log("⚠️", "Fields not visible. Forcing modal display style...");
    await page.evaluate(() => {
      const loginModal = document.querySelector("#loginModalCtn");
      if (loginModal) {
        loginModal.style.display = "block";
        loginModal.style.visibility = "visible";
        loginModal.style.opacity = "1";
        loginModal.style.zIndex = "100000";
      }
    });
    await page.waitForTimeout(1000);
  }

  const email_input = await page.$('input[placeholder="email"], input[type="email"]');
  const password_input = await page.$('input[placeholder="password"], input[type="password"]');

  if (!email_input || !password_input) {
    fatal("Could not find login form fields. The login modal may not have opened correctly.");
  } else {
    await email_input.fill(CONFIG.perchance_username);
    await password_input.fill(CONFIG.perchance_key);
  }

  // Click the "signup / login" button
  const submit_btn = await page.$(
    'button.main:has-text("signup / login"), #loginModalCtn button.main',
  );
  if (submit_btn) {
    await submit_btn.click();
  } else {
    // Fallback: trigger login via JS
    await page.evaluate(() => {
      if (typeof window.loginModal !== "undefined") {
        window.loginModal.login();
      } else if (typeof window.app?.loginModal !== "undefined") {
        window.app.loginModal.login();
      }
    });
  }

  // Wait for login to complete — the login button should become hidden
  log("⏳", "Waiting for login... (solve captcha in browser if prompted)");
  await page.waitForFunction(
    () => {
      const login_btn = document.querySelector('[data-ref="loginButton"]');
      if (!login_btn) return true; // Better logic: if the button is gone, we are logged in
      const style = window.getComputedStyle(login_btn);
      return style.display === "none";
    },
    { timeout: 30_000 },
  ); // 2 min for captcha if needed

  log("✅", "Login successful.");
}

/************************************************************************************
 * 🧩 [SECTION: MAIN]
 ************************************************************************************/

/**
 *
 */
async function main() {
  console.log("\n  ╔═══════════════════════════════════════════════╗");
  console.log("    ║   🚀 RPGlitch → Perchance Deploy Pipeline   ║");
  console.log("    ╚═══════════════════════════════════════════════╝\n");

  // Phase 1: Pre-flight
  const payload = pre_flight();

  // Phase 2: Confirmation gate
  let confirm;
  if (process.env.AUTO_DEPLOY === "true") {
    log("⏩", "AUTO_DEPLOY=true detected. Skipping confirmation.");
    confirm = "y";
  } else {
    confirm = await prompt_user(
      `Deploy ${(payload.left_size / 1024).toFixed(1)}KB (Left) + ${(payload.right_size / 1024).toFixed(1)}KB (Right) to Perchance? [y/N]`,
    );
  }

  if (confirm !== "y" && confirm !== "yes") {
    log("🛑", "Deployment aborted by user.");
    process.exit(0);
  }

  // Phase 3: Deploy
  const success = await deploy(payload);

  if (success) {
    console.log("\n  ✅ Deployment successful.\n");
    process.exit(0);
  } else {
    console.log("\n  ⚠️  Deployment completed with fallback. Check manually.\n");
    process.exit(1);
  }
}

main().catch((error) => {
  fatal(`Unhandled error: ${error.message}`);
});
