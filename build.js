#!/usr/bin/env node
/* Single build chain. Produces, from the same state of src/:
     dist/wavedash/index.html  readable page, no minification, no roadroller
     dist/js13k/index.html     compressed page, terser + roadroller
     unifind.zip               contest archive, zip -9 then advzip
   Options:
     --best N   number of roadroller draws kept (default 1, 6 for the release)
     --fast     skips terser and roadroller, writes dist/tuning/, leaves the ZIP alone
*/

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const ZIP = path.join(ROOT, 'unifind.zip');
const LIMIT = 13312;
const MODULES = ['creatures.js', 'music.js', 'rooms.js', 'wavedash.js', 'game.js'];

const args = process.argv.slice(2);
const FAST = args.includes('--fast');
const BEST = Math.max(1, parseInt((args.find(a => a.startsWith('--best')) || '').split('=')[1]
  || args[args.indexOf('--best') + 1] || '1', 10) || 1);

/* --- 1. Assemble the source ------------------------------------------------ */

const stripExports = s => s.replace(/\nif\(typeof module[\s\S]*$/m, '').trimEnd();
const source = MODULES
  .map(f => stripExports(fs.readFileSync(path.join(ROOT, 'src', f), 'utf8')))
  .join('\n\n');

const CSS = `body{margin:0;background:#07040e}` +
            `#c{position:fixed;inset:0;width:100%;height:100%;touch-action:none}`;

const readablePage = `<!doctype html><html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Unifind</title>
<style>${CSS}</style>
</head><body><canvas id=c></canvas>
<script>
${source}
</scr` + `ipt></body></html>`;

const compactPage = js =>
  `<!doctype html><meta charset=utf-8><title>Unifind</title><style>${CSS}</style>` +
  `<canvas id=c></canvas><script>${js}</scr` + `ipt>`;

/* --- 2. Tools -------------------------------------------------------------- */

function tool(name) {
  const globalRoot = spawnSync('npm', ['root', '-g'], { encoding: 'utf8' }).stdout || '';
  for (const p of [
    path.join(ROOT, 'node_modules/.bin', name),
    path.join(globalRoot.trim(), '.bin', name),
  ]) if (fs.existsSync(p)) return p;
  const w = spawnSync('command', ['-v', name], { shell: true, encoding: 'utf8' });
  if (w.status === 0) return w.stdout.trim();
  return null;
}

/* booleans_as_integers is deliberately absent: it would rewrite the `true`
   given to the Wavedash SDK, which validates its types and rejects the call. */
const TERSER_ARGS = ['-c', 'passes=5,unsafe=true,pure_getters=true', '-m', 'toplevel=true'];
const RR_ARGS = ['-O2'];

/* The rest of the file only runs from the command line: tools/wavedash.js
   requires this module to replay exactly the same terser chain. */
module.exports = { source, CSS, TERSER_ARGS, RR_ARGS, tool, readablePage, compactPage };
if (require.main !== module) return;

/* --- 3. Write the Wavedash target ------------------------------------------ */

const write = (rel, content) => {
  const p = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  return p;
};

write('wavedash/index.html', readablePage);
console.log('dist/wavedash/index.html   ' + readablePage.length + ' B readable');

if (FAST) {
  write('tuning/index.html', readablePage);
  console.log('dist/tuning/index.html     --fast mode: ZIP and dist/js13k/ untouched');
  process.exit(0);
}

/* --- 4. terser then roadroller --------------------------------------------- */

const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'unifind-'));
const raw = path.join(tmp, 'game.js');
fs.writeFileSync(raw, source);

const TERSER = tool('terser');
const ROADROLLER = tool('roadroller');
if (!TERSER) { console.error('terser not found: npm i -g terser roadroller'); process.exit(1); }

execFileSync('node', ['--check', raw]);
const min = path.join(tmp, 'game.min.js');
execFileSync(TERSER, [raw, ...TERSER_ARGS, '-o', min]);
const minSize = fs.statSync(min).size;
console.log('terser                     ' + minSize + ' B');

let js = fs.readFileSync(min, 'utf8');
if (ROADROLLER) {
  /* roadroller looks for its parameters at random: draw several times and keep
     the smallest output. The draws spread out over a few dozen
     bytes. */
  let best = null, sizes = [];
  for (let i = 0; i < BEST; i++) {
    const out = path.join(tmp, 'rr' + i + '.js');
    const r = spawnSync(ROADROLLER, [min, ...RR_ARGS, '-o', out], { encoding: 'utf8' });
    if (r.status !== 0 || !fs.existsSync(out)) continue;
    const n = fs.statSync(out).size;
    sizes.push(n);
    if (best === null || n < best.n) best = { n, out };
  }
  if (best) {
    js = fs.readFileSync(best.out, 'utf8');
    console.log('roadroller                 ' + best.n + ' B' +
      (sizes.length > 1 ? '  (best of ' + sizes.length + ': ' +
        Math.min(...sizes) + '-' + Math.max(...sizes) + ')' : ''));
  } else console.log('roadroller failed: keeping the terser output.');
} else console.log('roadroller not found: keeping the terser output.');

const pageJs13k = compactPage(js);
write('js13k/index.html', pageJs13k);
console.log('dist/js13k/index.html      ' + pageJs13k.length + ' B');

/* --- 5. Zip, recompress, verify -------------------------------------------- */

const zipTmp = path.join(tmp, 'unifind.zip');
execFileSync('zip', ['-9', '-q', '-X', zipTmp, 'index.html'], { cwd: path.join(DIST, 'js13k') });
const before = fs.statSync(zipTmp).size;

const ADVZIP = tool('advzip');
if (ADVZIP) {
  spawnSync(ADVZIP, ['-z', '-4', '-i', '500', '-q', zipTmp]);
  /* The extracted content must be identical: only the DEFLATE container changes. */
  const extracted = spawnSync('unzip', ['-p', zipTmp, 'index.html'], { encoding: 'buffer' });
  if (Buffer.compare(extracted.stdout, Buffer.from(pageJs13k)) !== 0) {
    console.error('advzip altered the content: archive rejected.'); process.exit(1);
  }
  console.log('zip -9                     ' + before + ' B  ->  advzip ' + fs.statSync(zipTmp).size + ' B');
} else {
  console.log('advzip not found (brew install advancecomp): ' + before + ' B');
}

fs.copyFileSync(zipTmp, ZIP);
fs.rmSync(tmp, { recursive: true, force: true });

const size = fs.statSync(ZIP).size;
console.log('----------------------------------------');
console.log('unifind.zip                ' + size + ' B  /  ' + LIMIT + ' max');
console.log(size <= LIMIT
  ? 'WITHIN BUDGET. Margin: ' + (LIMIT - size) + ' B.'
  : 'OVER BUDGET by ' + (size - LIMIT) + ' B.');
if (size > LIMIT) process.exit(1);
