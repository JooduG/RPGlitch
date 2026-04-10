/**
 * 🛡️ Security Audit Rules (The Warden's Shield)
 */

export const securityRules = [
  {
    id: "WARDEN_DEBUG_LOG",
    severity: "DEBT",
    regex: /console\.log\(|alert\(|debugger;/,
    message: "⚠️ Debug statement detected. Please purge before commit.",
    validate: (line, filePath) => {
      const cliScripts = [
        "audit-engine.js",
        "summarize.js",
        "sync.js",
        "forge-svelte.js",
        "forge-skill.js",
        "forge-skill-package.js",
        "audit.js",
        "pinecone-engine.js",
        "deploy-perchance.js",
        "dump-prompt.js",
        "simulation-cycle.js",
        "spec-validator.js",
        "SWARM.js",
        "swarm-ops.js",
        "swarm-engine.js",
        "swarm-analyze.ts",
        "swarm-dispatch.ts",
        "swarm-merge.ts",
        "swarm-plan.ts",
        "knowledge.js",
      ];
      return (
        !filePath.endsWith(".test.js") && !cliScripts.some((script) => filePath.includes(script))
      );
    },
  },
  {
    id: "WARDEN_SECRET_LEAK",
    severity: "HERESY",
    // Look for assignments/keys that look like secrets. Avoid matching generic "key" or "token".
    regex: /\b(api_?key|auth_?token|secret_?key|password)\b\s*[:=]\s*["'][^"']{8,}/i,
    message:
      "🚨 Potential Secret Leak! Verify that variables are environment-bound and NOT hardcoded.",
    validate: (line) => !line.includes("process.env"),
  },
];
