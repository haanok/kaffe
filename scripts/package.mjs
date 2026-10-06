import { copyFile, mkdir, rm } from 'node:fs/promises';

// Explicit allowlist: never deploy the repository, tooling, or local secrets.
const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
const files = ['index.html', 'styles.css', 'app.js', 'pour.js', 'model.js', 'data.js', 'report.js', 'sw.js', 'manifest.json', 'icon.svg', 'staticwebapp.config.json'];
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all(files.map(file => copyFile(new URL(file, root), new URL(file, output))));
console.log(`Packaged ${files.length} public files in dist/ (no compilation).`);
