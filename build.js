#!/usr/bin/env node
/* Chaine de build unique. Produit, depuis le meme etat de src/ :
     dist/wavedash/index.html  page lisible, sans minification ni roadroller
     dist/js13k/index.html     page compressee, terser + roadroller
     unifind.zip               archive du concours, zip -9 puis advzip
   Options :
     --best N   nombre de tirages roadroller conserves (defaut 1, 6 pour la release)
     --fast     saute terser et roadroller, ecrit dans dist/tuning/, ne touche pas au ZIP
*/

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const RACINE = __dirname;
const DIST = path.join(RACINE, 'dist');
const ZIP = path.join(RACINE, 'unifind.zip');
const LIMITE = 13312;
const MODULES = ['creatures.js', 'music.js', 'rooms.js', 'wavedash.js', 'game.js'];

const args = process.argv.slice(2);
const FAST = args.includes('--fast');
const BEST = Math.max(1, parseInt((args.find(a => a.startsWith('--best')) || '').split('=')[1]
  || args[args.indexOf('--best') + 1] || '1', 10) || 1);

/* --- 1. Assembler la source ------------------------------------------------ */

const sansExport = s => s.replace(/\nif\(typeof module[\s\S]*$/m, '').trimEnd();
const source = MODULES
  .map(f => sansExport(fs.readFileSync(path.join(RACINE, 'src', f), 'utf8')))
  .join('\n\n');

const CSS = `body{margin:0;background:#07040e}` +
            `#c{position:fixed;inset:0;width:100%;height:100%;touch-action:none}`;

const pageLisible = `<!doctype html><html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Unifind</title>
<style>${CSS}</style>
</head><body><canvas id=c></canvas>
<script>
${source}
</scr` + `ipt></body></html>`;

const pageCompacte = js =>
  `<!doctype html><meta charset=utf-8><title>Unifind</title><style>${CSS}</style>` +
  `<canvas id=c></canvas><script>${js}</scr` + `ipt>`;

/* --- 2. Outils ------------------------------------------------------------- */

function outil(nom) {
  const racineGlobale = spawnSync('npm', ['root', '-g'], { encoding: 'utf8' }).stdout || '';
  for (const p of [
    path.join(RACINE, 'node_modules/.bin', nom),
    path.join(racineGlobale.trim(), '.bin', nom),
  ]) if (fs.existsSync(p)) return p;
  const w = spawnSync('command', ['-v', nom], { shell: true, encoding: 'utf8' });
  if (w.status === 0) return w.stdout.trim();
  return null;
}

/* booleans_as_integers est volontairement absent : il reecrirait les `true`
   passes au SDK Wavedash, qui valide ses types et rejette alors tout appel. */
const TERSER_ARGS = ['-c', 'passes=5,unsafe=true,pure_getters=true', '-m', 'toplevel=true'];
const RR_ARGS = ['-O2'];

/* Le reste du fichier ne s'execute qu'en ligne de commande : tools/wavedash.js
   require ce module pour rejouer exactement la meme chaine terser. */
module.exports = { source, CSS, TERSER_ARGS, RR_ARGS, outil, pageLisible, pageCompacte };
if (require.main !== module) return;

/* --- 3. Ecrire la cible Wavedash ------------------------------------------- */

const ecrire = (rel, contenu) => {
  const p = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, contenu);
  return p;
};

ecrire('wavedash/index.html', pageLisible);
console.log('dist/wavedash/index.html   ' + pageLisible.length + ' o lisibles');

if (FAST) {
  ecrire('tuning/index.html', pageLisible);
  console.log('dist/tuning/index.html     mode --fast : ZIP et dist/js13k/ inchanges');
  process.exit(0);
}

/* --- 4. terser puis roadroller --------------------------------------------- */

const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'unifind-'));
const brut = path.join(tmp, 'game.js');
fs.writeFileSync(brut, source);

const TERSER = outil('terser');
const ROADROLLER = outil('roadroller');
if (!TERSER) { console.error('terser introuvable : npm i -g terser roadroller'); process.exit(1); }

execFileSync('node', ['--check', brut]);
const min = path.join(tmp, 'game.min.js');
execFileSync(TERSER, [brut, ...TERSER_ARGS, '-o', min]);
const tailleMin = fs.statSync(min).size;
console.log('terser                     ' + tailleMin + ' o');

let js = fs.readFileSync(min, 'utf8');
if (ROADROLLER) {
  /* roadroller cherche ses parametres au hasard : on tire plusieurs fois et on
     garde la plus petite sortie. Les tirages s'etalent sur quelques dizaines
     d'octets. */
  let meilleur = null, tailles = [];
  for (let i = 0; i < BEST; i++) {
    const sortie = path.join(tmp, 'rr' + i + '.js');
    const r = spawnSync(ROADROLLER, [min, ...RR_ARGS, '-o', sortie], { encoding: 'utf8' });
    if (r.status !== 0 || !fs.existsSync(sortie)) continue;
    const n = fs.statSync(sortie).size;
    tailles.push(n);
    if (meilleur === null || n < meilleur.n) meilleur = { n, sortie };
  }
  if (meilleur) {
    js = fs.readFileSync(meilleur.sortie, 'utf8');
    console.log('roadroller                 ' + meilleur.n + ' o' +
      (tailles.length > 1 ? '  (meilleur de ' + tailles.length + ' : ' +
        Math.min(...tailles) + '-' + Math.max(...tailles) + ')' : ''));
  } else console.log('roadroller a echoue : on garde la sortie terser.');
} else console.log('roadroller introuvable : on garde la sortie terser.');

const pageJs13k = pageCompacte(js);
ecrire('js13k/index.html', pageJs13k);
console.log('dist/js13k/index.html      ' + pageJs13k.length + ' o');

/* --- 5. Zipper, recompresser, verifier ------------------------------------- */

const zipTmp = path.join(tmp, 'unifind.zip');
execFileSync('zip', ['-9', '-q', '-X', zipTmp, 'index.html'], { cwd: path.join(DIST, 'js13k') });
const avant = fs.statSync(zipTmp).size;

const ADVZIP = outil('advzip');
if (ADVZIP) {
  spawnSync(ADVZIP, ['-z', '-4', '-i', '500', '-q', zipTmp]);
  /* Le contenu extrait doit etre identique : seul le conteneur DEFLATE change. */
  const extrait = spawnSync('unzip', ['-p', zipTmp, 'index.html'], { encoding: 'buffer' });
  if (Buffer.compare(extrait.stdout, Buffer.from(pageJs13k)) !== 0) {
    console.error('advzip a altere le contenu : archive rejetee.'); process.exit(1);
  }
  console.log('zip -9                     ' + avant + ' o  ->  advzip ' + fs.statSync(zipTmp).size + ' o');
} else {
  console.log('advzip introuvable (brew install advancecomp) : ' + avant + ' o');
}

fs.copyFileSync(zipTmp, ZIP);
fs.rmSync(tmp, { recursive: true, force: true });

const taille = fs.statSync(ZIP).size;
console.log('----------------------------------------');
console.log('unifind.zip                ' + taille + ' o  /  ' + LIMITE + ' max');
console.log(taille <= LIMITE
  ? 'DANS LE BUDGET. Marge : ' + (LIMITE - taille) + ' o.'
  : 'DEPASSEMENT de ' + (taille - LIMITE) + ' o.');
if (taille > LIMITE) process.exit(1);
