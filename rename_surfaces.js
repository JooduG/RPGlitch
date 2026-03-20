import fs from "fs"
import path from "path"

function walk(dir) {
    let results = []
    let list = fs.readdirSync(dir)
    list.forEach(function (file) {
        file = path.join(dir, file)
        let stat = fs.statSync(file)
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file))
        } else {
            if (file.endsWith(".svelte") || file.endsWith(".css")) results.push(file)
        }
    })
    return results
}

const files = walk(path.join(process.cwd(), "src"))
let modifiedCount = 0

for (const file of files) {
    let content = fs.readFileSync(file, "utf8")
    let original = content

    // Convert generic surfaces to semantic
    content = content.replace(/var\(--surface-1\)/g, "var(--surface-sunken)") // Our new base default well
    content = content.replace(/var\(--surface-2\)/g, "var(--surface-raised)")
    content = content.replace(/var\(--surface-3\)/g, "var(--surface-elevated)")

    // Convert old transparent overlays to the new solid elevated colors
    content = content.replace(/var\(--surface-overlay\)/g, "var(--surface-elevated)")

    // (Note: We intentionally leave --surface-void alone, as it's correctly used as a dimmer)
    // (Note: We leave --surface-sunken alone, since it aligns perfectly with the new solid well)

    if (content !== original) {
        fs.writeFileSync(file, content, "utf8")
        console.log(`Renamed surfaces in ${path.basename(file)}`)
        modifiedCount++
    }
}

console.log(`Successfully mapped surfaces in ${modifiedCount} files.`)
