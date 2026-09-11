/* Checks the game without a browser: a fake DOM, a node canvas, and one round
   played end to end. Acts as a guard rail before a commit.
   Requires: npm install (for @napi-rs/canvas). */

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const { install } = require('./dom');

/* By default we test the readable page. `--min` replays the same checks on
   the terser output: that is the only way to see that an aggressive
   compression option has changed one of the game's computations. Top-level
   mangling is dropped for this test only, it does not change what is checked. */
let src;
if (process.argv.includes('--min')) {
  const { execFileSync } = require('child_process');
  const os = require('os');
  const { source, TERSER_ARGS, tool } = require('../build.js');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'unifind-min-'));
  const raw = path.join(tmp, 'a.js'), min = path.join(tmp, 'a.min.js');
  fs.writeFileSync(raw, source);
  const noMangle = [];
  for (let i = 0; i < TERSER_ARGS.length; i++) {
    if (TERSER_ARGS[i] === '-m') { i++; continue; }
    noMangle.push(TERSER_ARGS[i]);
  }
  execFileSync(tool('terser'), [raw, ...noMangle, '-o', min], { stdio: ['ignore', 'ignore', 'inherit'] });
  src = fs.readFileSync(min, 'utf8');
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('source tested: terser output (' + src.length + ' B)');
} else {
  const html = fs.readFileSync(path.join(ROOT, 'dist', 'wavedash', 'index.html'), 'utf8');
  src = html.split('<script>')[1].split('</scr' + 'ipt>')[0];
}
src += `
;globalThis._state = () => ({ ph: ST.ph, lvl: ST.lvl, room: ST.room.name, mus: ST.genre,
                              crowd: ST.count, sprites: ST.w.inst.length, won: ST.won });
globalThis._tap = (x, y) => tap(x === undefined ? 320 : x, y === undefined ? 180 : y);
globalThis._seed = n => { ST.seed = n; build(); };
globalThis._unicorn = () => { const u = ST.w.uni;
  return [u.x * view.z + view.x, (u.y - ST.w.S * u.s * 0.4) * view.z + view.y]; };
globalThis._offWorld = () => pops.filter(p => p.y < 0 || p.y > ST.w.H || p.x < 0 || p.x > ST.w.W).length;
globalThis._depth = () => {
  let bad = 0, total = 0, S = ST.w.S, L = ST.w.inst;
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
    const a = L[i], b = L[j], sa = S * a.s, sb = S * b.s;
    if (Math.abs(a.x - b.x) > (sa + sb) * 0.28) continue;
    if (a.y + sa * 0.12 < b.y - sb * 0.86 || b.y + sb * 0.12 < a.y - sa * 0.86) continue;
    total++;
    if (a.y + sa * 0.115 > b.y + sb * 0.115) bad++;
  }
  return [bad, total];
};`;

/* A 640x360 canvas: the test has to stay light. */
const dom = install({ W: 640, H: 360 });
dom.run(src);

const frames = n => dom.frames(n);

let fails = 0;
const check = (name, ok, detail) => {
  console.log((ok ? '  ok   ' : '  FAIL ') + '  ' + name + (detail ? '   ' + detail : ''));
  if (!ok) fails++;
};

frames(4);
check('starts on the title screen', globalThis._state().ph === 'title');

globalThis._seed(12345);   /* fixed seed: the test has to be reproducible */
frames(20);
let e = globalThis._state();
check('the tap opens the show', e.ph === 'show', e.room + ', ' + e.mus + ', ' + e.crowd + ' creatures');
check('the crowd matches the setting', Math.abs(e.sprites - e.crowd) / e.crowd < 0.08,
      e.sprites + ' creatures placed for ' + e.crowd + ' requested');

let [bad, total] = globalThis._depth();
check('depth correct during the show', bad === 0, bad + ' inversions over ' + total + ' pairs');

globalThis._tap(); frames(170);
check('the shuffle leads into play', globalThis._state().ph === 'play');
[bad, total] = globalThis._depth();
check('depth correct in play', bad === 0, bad + ' inversions over ' + total + ' pairs');

const [ux, uy] = globalThis._unicorn();
globalThis._tap(ux, uy); frames(16);
check('clicking the unicorn wins', globalThis._state().ph === 'end' && globalThis._state().won === 1);

frames(62);
check('a tap before 5 s is ignored', (globalThis._tap(), frames(2), globalThis._state().ph === 'end'));
check('the confetti stays inside the room', globalThis._offWorld() === 0);

frames(100); globalThis._tap(); frames(6);
e = globalThis._state();
check('we move on to the next room', e.ph === 'show' && e.lvl === 2, e.room + ', ' + e.mus + ', ' + e.crowd + ' creatures');

console.log(fails ? '\n' + fails + ' check(s) failed' : '\nall green');
process.exit(fails ? 1 : 0);
