import fs from "fs";
const path = 'src/ui/organisms/profile/VisualWing.svelte';
let data = fs.readFileSync(path, 'utf8');

data = data.replace(/[ \t]*\/\/\s*\[FIX\]\s*Target flattened signature_color\r?\n/g, '');
data = data.replace(/[ \t]*\/\/\s*\[FIX\]\s*Target flattened profile_picture\r?\n/g, '');

const oldCatch = `            console.error("Upload failed:", err)
        }`;
const newCatch = `            console.error("Upload failed:", err)
            app.log(\`Upload failed: \${err.message}\`, "error")
        }`;

data = data.replace(oldCatch, newCatch);

fs.writeFileSync(path, data);
console.log('Done.');
