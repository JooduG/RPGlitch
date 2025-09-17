const fs = require('fs');
const path = require('path');

const appsDir = path.resolve(__dirname, '../../apps');
const docsDir = path.resolve(__dirname, '../../docs/apps');

if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

fs.readdirSync(appsDir).forEach(app => {
  const appDir = path.join(appsDir, app);
  const readmePath = path.join(appDir, 'README.md');
  if (fs.existsSync(readmePath)) {
    const docPath = path.join(docsDir, `${app}.md`);
    const readmeContent = fs.readFileSync(readmePath, 'utf8');
    const docContent = `# ${app}\n\n${readmeContent}`;
    fs.writeFileSync(docPath, docContent);
  }
});
