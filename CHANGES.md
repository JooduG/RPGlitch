TRIGGERS RENAME — 2026-08-16

somatic-triggers.js renamed to triggers.js (GLOBAL_TRIGGERS lives alongside the somatic registries; narrative-styles.js header updated to point at ./triggers.js).

FILES IN THIS ZIP (current state):

- src/data/index.js (barrel: triggers re-export now from ./definitions/triggers.js)
- src/data/definitions/triggers.js
- src/data/definitions/triggers.test.js
- src/data/definitions/narrative-styles.js

DELETED (remove from your repo):

- src/data/definitions/somatic-triggers.js
- src/data/definitions/somatic-triggers.test.js

Export names are unchanged (GLOBAL_TRIGGERS, SOMATIC_REGISTRY, STYLE_MOTIF_REGISTRY, resolve_somatic_directives, render_somatic_directives_xml, build_somatic_directives_block, build_available_keywords_xml), so no other files need edits. Verified: @data barrel bundles, definitions-graph behavioral checks pass, 18 triggers / 12 somatic / 26 motifs intact.
