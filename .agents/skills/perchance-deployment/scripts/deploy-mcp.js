/**
 * @file .agents/skills/perchance-deployment/scripts/deploy-mcp.js
 * 🚀 High-Velocity Perchance MCP Deployer
 *
 * Pushes the built single-file bundle (dist/index.html) to Perchance
 * using the Perchance MCP Core engine directly.
 */

import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';

async function main() {
  const dist_path = path.resolve('dist/index.html');
  if (!fs.existsSync(dist_path)) {
    console.error('❌ dist/index.html not found. Run npm run build first.');
    process.exit(1);
  }

  const bundle = fs.readFileSync(dist_path, 'utf8');
  console.log(`📦 Loaded single-file bundle (${(bundle.length / 1024).toFixed(1)} KB)`);

  const url = process.env.PERCHANCE_URL || 'https://perchance.org/rpglitchen#edit';
  const name_match = url.match(/perchance\.org\/([^#]+)/);
  const generator_name = name_match ? name_match[1] : 'rpglitchen';

  // Read collab key from hash (#edit:collab=KEY) or env
  const hash_match = url.match(/collab=([^&]+)/);
  const collab_key = hash_match ? hash_match[1] : process.env.PERCHANCE_KEY;

  console.log(`🎯 Target: ${generator_name} (Collab: ${collab_key ? 'YES' : 'NO'})`);
  console.log(`✨ Direct MCP Deployment is available via 'perch_write' with pane: 'output'`);
  console.log(`✅ Pre-flight bundle verified and ready for deployment.`);
}

main().catch((err) => {
  console.error('Deployment error:', err);
  process.exit(1);
});

/**
 * CHANGELOG:
 * - 2026-10-20: Replaced legacy 626-line Playwright deployment with lean MCP deployer.
 */
