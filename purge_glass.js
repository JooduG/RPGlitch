import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    let list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        let stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.svelte') || file.endsWith('.css')) results.push(file);
        }
    });
    return results;
}

const files = walk(path.join(process.cwd(), 'src'));
let modifiedCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Purge backdrop-filter lines entirely
    content = content.replace(/^[ \t]*backdrop-filter.*?;[ \t]*\r?\n/gm, '');
    content = content.replace(/^[ \t]*-webkit-backdrop-filter.*?;[ \t]*\r?\n/gm, '');
    
    // Replace glass colors with simple solid semantic layers
    content = content.replace(/var\(--glass-s\)/g, 'var(--surface-1)');
    content = content.replace(/var\(--glass-m\)/g, 'var(--surface-2)');
    content = content.replace(/var\(--glass-l\)/g, 'var(--surface-3)');
    content = content.replace(/var\(--ui-glass-border\)/g, 'var(--border-light)');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Purged glass from ${path.basename(file)}`);
        modifiedCount++;
    }
}

console.log(`Successfully purged glassmorphism from ${modifiedCount} files.`);
