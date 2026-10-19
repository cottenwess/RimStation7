// Assembles src/ into one self-contained HTML file: dist/rim-station-7.html
// Usage: node tools/build.mjs   (no dependencies)
import {readFileSync, writeFileSync, readdirSync, mkdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const tmpl = readFileSync(join(src, 'index.template.html'), 'utf8');
const css = readFileSync(join(src, 'styles.css'), 'utf8');
const files = readdirSync(join(src, 'js')).filter(f => f.endsWith('.js')).sort();
const js = "(() => {\n'use strict';\n" + files.map(f => `// ---- ${f}\n` + readFileSync(join(src, 'js', f), 'utf8')).join('\n') + '})();';
const out = tmpl.replace('/*@CSS*/', () => css.trimEnd()).replace('/*@JS*/', () => js);
mkdirSync(join(root, 'dist'), {recursive: true});
writeFileSync(join(root, 'dist', 'rim-station-7.html'), out);
writeFileSync(join(root, 'dist', 'game.js'), js);
console.log(`Built dist/rim-station-7.html from ${files.length} modules (${(out.length / 1024).toFixed(0)} KB).`);
