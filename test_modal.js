import fs from 'fs';

const file = fs.readFileSync('src/ui/molecules/dialogs/Modal.svelte', 'utf8');
const expected = "min-height: auto; /* Remove 100% min-height to fix click blocking, or verify behavior */";
console.log("Found expected text:", file.includes(expected));
