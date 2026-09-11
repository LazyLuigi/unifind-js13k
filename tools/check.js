/* Verifie le jeu sans navigateur: un faux DOM, un canvas node, et une partie jouee
   de bout en bout. Sert de garde-fou avant un commit.
   Prerequis: npm install (pour @napi-rs/canvas). */

const fs = require('fs');
const path = require('path');
const RACINE = path.join(__dirname, '..');

const { installe } = require('./dom');

/* Par defaut on teste la page lisible. `--min` rejoue les memes verifications
   sur la sortie terser: c'est la seule facon de voir qu'une option de
   compression agressive a change un calcul du jeu. Le mangle toplevel est
   retire pour ce test seulement, il ne change pas la semantique verifiee. */
let src;
if (process.argv.includes('--min')) {
  const { execFileSync } = require('child_process');
  const os = require('os');
  const { source, TERSER_ARGS, outil } = require('../build.js');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'unifind-min-'));
  const brut = path.join(tmp, 'a.js'), min = path.join(tmp, 'a.min.js');
  fs.writeFileSync(brut, source);
  const sansMangle = [];
  for (let i = 0; i < TERSER_ARGS.length; i++) {
    if (TERSER_ARGS[i] === '-m') { i++; continue; }
    sansMangle.push(TERSER_ARGS[i]);
  }
  execFileSync(outil('terser'), [brut, ...sansMangle, '-o', min], { stdio: ['ignore', 'ignore', 'inherit'] });
  src = fs.readFileSync(min, 'utf8');
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('source testee: sortie terser (' + src.length + ' o)');
} else {
  const html = fs.readFileSync(path.join(RACINE, 'dist', 'wavedash', 'index.html'), 'utf8');
  src = html.split('<script>')[1].split('</scr' + 'ipt>')[0];
}
src += `
;globalThis._etat = () => ({ ph: ST.ph, niv: ST.niv, lieu: ST.lieu.nom, mus: ST.genre,
                             foule: ST.count, sprites: ST.w.inst.length, gagne: ST.gagne });
globalThis._tap = (x, y) => tap(x === undefined ? 320 : x, y === undefined ? 180 : y);
globalThis._graine = n => { ST.seed = n; build(); };
globalThis._licorne = () => { const u = ST.w.uni;
  return [u.x * view.z + view.x, (u.y - ST.w.S * u.s * 0.4) * view.z + view.y]; };
globalThis._horsMonde = () => pops.filter(p => p.y < 0 || p.y > ST.w.H || p.x < 0 || p.x > ST.w.W).length;
globalThis._profondeur = () => {
  let mauvais = 0, total = 0, S = ST.w.S, L = ST.w.inst;
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
    const a = L[i], b = L[j], sa = S * a.s, sb = S * b.s;
    if (Math.abs(a.x - b.x) > (sa + sb) * 0.28) continue;
    if (a.y + sa * 0.12 < b.y - sb * 0.86 || b.y + sb * 0.12 < a.y - sa * 0.86) continue;
    total++;
    if (a.y + sa * 0.115 > b.y + sb * 0.115) mauvais++;
  }
  return [mauvais, total];
};`;

/* Un canevas de 640x360: le test doit rester leger. */
const dom = installe({ W: 640, H: 360 });
dom.lance(src);

const frames = n => dom.frames(n);

let echecs = 0;
const verifie = (nom, ok, detail) => {
  console.log((ok ? '  ok   ' : '  ECHEC') + '  ' + nom + (detail ? '   ' + detail : ''));
  if (!ok) echecs++;
};

frames(4);
verifie('demarre sur l ecran titre', globalThis._etat().ph === 'titre');

globalThis._graine(12345);   /* graine fixe: le test doit etre reproductible */
frames(20);
let e = globalThis._etat();
verifie('le tap ouvre la presentation', e.ph === 'show', e.lieu + ', ' + e.mus + ', ' + e.foule + ' creatures');
verifie('la foule correspond au reglage', Math.abs(e.sprites - e.foule) / e.foule < 0.08,
        e.sprites + ' creatures placees pour ' + e.foule + ' demandees');

let [mauvais, total] = globalThis._profondeur();
verifie('profondeur correcte en presentation', mauvais === 0, mauvais + ' inversions sur ' + total + ' paires');

globalThis._tap(); frames(170);
verifie('le brassage mene au jeu', globalThis._etat().ph === 'jeu');
[mauvais, total] = globalThis._profondeur();
verifie('profondeur correcte en jeu', mauvais === 0, mauvais + ' inversions sur ' + total + ' paires');

const [ux, uy] = globalThis._licorne();
globalThis._tap(ux, uy); frames(16);
verifie('le clic sur la licorne gagne', globalThis._etat().ph === 'fin' && globalThis._etat().gagne === 1);

frames(62);
verifie('un tap avant 5 s est ignore', (globalThis._tap(), frames(2), globalThis._etat().ph === 'fin'));
verifie('les paillettes restent dans la salle', globalThis._horsMonde() === 0);

frames(100); globalThis._tap(); frames(6);
e = globalThis._etat();
verifie('on passe a la salle suivante', e.ph === 'show' && e.niv === 2, e.lieu + ', ' + e.mus + ', ' + e.foule + ' creatures');

console.log(echecs ? '\n' + echecs + ' verification(s) en echec' : '\ntout est vert');
process.exit(echecs ? 1 : 0);
