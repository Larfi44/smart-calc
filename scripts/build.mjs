// Production build: copies the static app into ./build (this is what Tauri
// bundles and what the GitVerse Pages workflow publishes).
import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'build');

const ENTRIES = ['index.html', 'styles.css', 'favicon.png', 'js'];

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

for (const entry of ENTRIES) {
  await cp(path.join(root, entry), path.join(outDir, entry), {
    recursive: true,
  });
}

console.log(`Built ${ENTRIES.join(', ')} → build/`);
