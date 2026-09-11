/* Checks the Wavedash integration against the TERSER OUTPUT, with a double SDK
   that validates its argument types like the real one.

   Why the terser output and not the source: the SDK throws on a wrong-typed
   argument, the game swallows the exception, and nothing shows in the console.
   So a game can run perfectly from src/ and send no achievement at all once
   minified. Only this test catches that case.

   Why a strict double: a permissive double tests nothing. This one counts the
   successful calls AND the type violations, exactly like the SDK.

   Requires: npm install, and terser available. */

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { install } = require('./dom');
const { source, TERSER_ARGS, tool } = require('../build.js');

/* --- The terser output, without toplevel mangling ------------------------- */
/* Mangling would rename tap() and ST, which the test has to be able to call.
   It does not change the semantics checked here: the -c options are the ones
   that rewrite the code. */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'unifind-wd-'));
const raw = path.join(tmp, 'a.js'), min = path.join(tmp, 'a.min.js');
fs.writeFileSync(raw, source);
const noMangle = [];
for (let i = 0; i < TERSER_ARGS.length; i++) {
  if (TERSER_ARGS[i] === '-m') { i++; continue; }
  noMangle.push(TERSER_ARGS[i]);
}
execFileSync(tool('terser'), [raw, ...noMangle, '-o', min],
             { stdio: ['ignore', 'ignore', 'inherit'] });
const CODE = fs.readFileSync(min, 'utf8') + `
;globalThis._state = () => ({ ph: ST.ph, lvl: ST.lvl, won: ST.won, err: ST.err });
globalThis._tap = (x, y) => tap(x === undefined ? 320 : x, y === undefined ? 180 : y);
globalThis._seed = n => { ST.seed = n; build(); };
globalThis._unicorn = () => { const u = ST.w.uni;
  return [u.x * view.z + view.x, (u.y - ST.w.S * u.s * 0.4) * view.z + view.y]; };
globalThis._banner = () => WDname;
/* A creature that is not the unicorn: clicking empty space does not count as
   an error, only a tap on the wrong creature is one. */
globalThis._extra = () => { const L = ST.w.inst;
  for (let i = L.length - 1; i >= 0; i--) if (!L[i].uni) {
    const o = L[i];
    return [o.x * view.z + view.x, (o.y - ST.w.S * o.s * 0.4) * view.z + view.y];
  } };`;
fs.rmSync(tmp, { recursive: true, force: true });

/* --- The strict double ----------------------------------------------------- */

/* Mirrors the SDK's vBoolean/vString/vNumber: wrong type, exception thrown. */
function doubleSdk(o) {
  o = o || {};
  const c = { init: 0, stats: 0, get: 0, set: 0, make: 0, send: 0 };
  const violations = [], earned = new Set(), sends = [];
  const t = (v, expected, where) => {
    if (typeof v !== expected) { violations.push(where + ': expected ' + expected + ', got ' + typeof v + ' (' + v + ')');
      throw new Error(where + ': expected ' + expected); } };

  const sdk = {
    init() { c.init++; return true; },
    requestStats() { c.stats++;
      if (o.statsRejects) return Promise.reject(new Error('network'));
      if (o.slowStats) return new Promise(r => { o.release = () => r({ success: true, data: true }); });
      return Promise.resolve(o.statsFails ? { success: false } : { success: true, data: true }); },
    getAchievement(id) { c.get++; t(id, 'string', 'getAchievement.identifier'); return earned.has(id); },
    setAchievement(id, storeNow) { c.set++;
      t(id, 'string', 'setAchievement.identifier');
      t(storeNow, 'boolean', 'setAchievement.storeNow');   /* the boolean trap */
      if (o.unknown) return false;                         /* identifier missing from the portal */
      earned.add(id); return true; },
    getOrCreateLeaderboard(name, order, type) { c.make++;
      t(name, 'string', 'getOrCreateLeaderboard.name');
      t(order, 'number', 'getOrCreateLeaderboard.sortOrder');
      t(type, 'number', 'getOrCreateLeaderboard.displayType');
      if (o.makeRejects) return Promise.reject(new Error('network'));
      if (o.makeFails) return Promise.resolve({ success: false });
      /* The exact shape of the types the server generates: id, never _id. */
      const d = { id: 'lb-' + name, name: name, totalEntries: 0, created: true };
      if (o.underscoreId) { d._id = d.id; delete d.id; }
      return Promise.resolve({ success: true, data: d }); },
    uploadLeaderboardScore(id, value, keepBest) { c.send++;
      t(id, 'string', 'uploadLeaderboardScore.leaderboardId');
      t(value, 'number', 'uploadLeaderboardScore.score');
      t(keepBest, 'boolean', 'uploadLeaderboardScore.keepBest');
      sends.push({ id, value });
      if (o.sendRejects) return Promise.reject(new Error('network'));
      return Promise.resolve({ success: true }); },
  };
  for (const m of (o.drop || [])) delete sdk[m];
  return { sdk, c, violations, earned, sends, o };
}

/* --- Harness --------------------------------------------------------------- */

let fails = 0, rejections = [];
process.on('unhandledRejection', r => rejections.push(String(r)));
const check = (name, ok, detail) => {
  console.log((ok ? '  ok   ' : '  FAIL ') + '  ' + name + (detail ? '   ' + detail : ''));
  if (!ok) fails++;
};

/* Plays one room through to the win. `ms` sets the length of a frame, hence
   the solve time the game measures. */
async function playRound(dom, opts) {
  opts = opts || {};
  dom.frames(4);
  globalThis._seed(opts.seed || 12345);
  dom.frames(20);            /* title screen */
  globalThis._tap();
  dom.frames(180);           /* shuffle, then into play */
  if (opts.miss) { const [fx, fy] = globalThis._extra(); globalThis._tap(fx, fy); dom.frames(2); }
  const [ux, uy] = globalThis._unicorn();
  dom.frames(opts.frames || 4, opts.ms === undefined ? 33 : opts.ms);
  globalThis._tap(ux, uy);
  dom.frames(4);
  await dom.settle(); await dom.settle(); await dom.settle();
}

async function scenario(name, opts, checks) {
  const d = doubleSdk(opts);
  const dom = install({ Wavedash: opts.absent ? null : d.sdk });
  const errors = [];
  const consoleErr = console.error; console.error = (...a) => errors.push(a.join(' '));
  try { dom.run(CODE); await playRound(dom, opts); await checks(d, dom); }
  catch (e) { check(name + ' (exception)', false, String(e && e.stack || e)); }
  finally { console.error = consoleErr; }
  check(name + ': no exception escaped', errors.length === 0, errors.join(' | '));
}

/* --- The scenarios --------------------------------------------------------- */

(async () => {
  console.log('Full SDK');
  await scenario('nominal', {}, d => {
    check('  init() called once', d.c.init === 1, d.c.init + ' call(s)');
    check('  requestStats() called', d.c.stats === 1, d.c.stats + ' call(s)');
    check('  no type violation', d.violations.length === 0, d.violations.join(' | '));
    check('  achievements went out', d.earned.size >= 2, [...d.earned].join(' '));
    check('  the leaderboard is created', d.c.make === 1, d.c.make + ' creation(s)');
    check('  the score is sent', d.sends.length === 1,
          d.sends.map(e => e.id + '=' + e.value).join(' '));
    /* A zero score is valid: it must not be filtered out by an `if (score)`. */
    check('  the score is a non-negative integer', d.sends.every(e => Number.isInteger(e.value) && e.value >= 0),
          JSON.stringify(d.sends));
    check('  the id read is data.id', d.sends.every(e => /^lb-/.test(e.id)), JSON.stringify(d.sends));
    check('  the banner shows a readable label', /^[A-Z ]+$/.test(globalThis._banner()),
          globalThis._banner());
  });

  console.log('\nPlay conditions');
  await scenario('fast round without an error', { ms: 33 }, d => {
    check('  FIRST_FIND and CLEAN_ROOM', d.earned.has('FIRST_FIND') && d.earned.has('CLEAN_ROOM'),
          [...d.earned].join(' '));
    check('  QUICK_EYE and BLINK under 5 s', d.earned.has('QUICK_EYE') && d.earned.has('BLINK'),
          [...d.earned].join(' '));
  });
  await scenario('round with one error', { miss: true }, d => {
    check('  CLEAN_ROOM not awarded', !d.earned.has('CLEAN_ROOM'), [...d.earned].join(' '));
    check('  FIRST_FIND awarded all the same', d.earned.has('FIRST_FIND'));
  });

  console.log('\nBroken SDK: the game must carry on without a word');
  await scenario('no Wavedash global', { absent: true }, d => {
    check('  no call at all', d.c.init === 0);
    check('  the round goes all the way', globalThis._state().won === 1);
    check('  the banner works all the same', globalThis._banner().length > 0, globalThis._banner());
  });
  await scenario('missing methods', { drop: ['setAchievement', 'uploadLeaderboardScore', 'getAchievement'] }, d => {
    check('  init() goes through anyway', d.c.init === 1);
    check('  the round goes all the way', globalThis._state().won === 1);
  });
  await scenario('requestStats rejects', { statsRejects: true }, d => {
    check('  no achievement sent', d.c.set === 0, d.c.set + ' send(s)');
    check('  the round goes all the way', globalThis._state().won === 1);
  });
  await scenario('requestStats answers success:false', { statsFails: true }, d => {
    check('  no achievement sent', d.c.set === 0, d.c.set + ' send(s)');
  });
  await scenario('leaderboard creation rejected', { makeRejects: true }, d => {
    check('  no score sent', d.c.send === 0);
  });
  await scenario('leaderboard creation success:false', { makeFails: true }, d => {
    check('  no score sent', d.c.send === 0);
  });
  await scenario('score upload rejected', { sendRejects: true }, d => {
    check('  the upload was indeed attempted', d.c.send === 1, d.c.send + ' attempt(s)');
  });
  await scenario('the SDK returns _id instead of id', { underscoreId: true }, d => {
    check('  nothing is sent to an id that does not exist', d.c.send === 0, d.c.send + ' send(s)');
  });
  await scenario('identifiers missing from the portal', { unknown: true }, d => {
    check('  the refusals do not block the round', globalThis._state().won === 1);
  });

  console.log('\nAchievement earned before the stats answer');
  {
    const d = doubleSdk({ slowStats: true });
    const dom = install({ Wavedash: d.sdk });
    dom.run(CODE);
    await playRound(dom, {});
    check('  nothing is sent while the stats have not answered', d.c.set === 0, d.c.set + ' send(s)');
    d.o.release();
    await dom.settle(); await dom.settle(); await dom.settle();
    check('  the queued achievements go out afterwards', d.earned.size >= 2, [...d.earned].join(' '));
    check('  no type violation', d.violations.length === 0, d.violations.join(' | '));
  }

  /* The SDK silently ignores any identifier missing from the Developer Portal:
     code / import JSON agreement is the only thing checkable offline. */
  console.log('\nIdentifiers agree');
  {
    const codes = (fs.readFileSync(path.join(__dirname, '..', 'src', 'game.js'), 'utf8')
      .match(/var ACHIEVEMENTS='([^']+)'/) || [, ''])[1].split(' ').filter(Boolean);
    const json = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'wavedash-achievements.json'), 'utf8'))
      .achievements.map(a => a.identifier);
    const missing = codes.filter(i => !json.includes(i));
    const unused = json.filter(i => !codes.includes(i));
    check('  the code declares achievements', codes.length > 0, codes.length + ' identifier(s)');
    check('  no achievement of the code missing from the JSON', missing.length === 0, missing.join(' '));
    check('  no achievement of the JSON missing from the code', unused.length === 0, unused.join(' '));
  }

  console.log('\nRepeats');
  {
    const d = doubleSdk({});
    const dom = install({ Wavedash: d.sdk });
    dom.run(CODE);
    await playRound(dom, {});
    const after1 = d.c.set;
    dom.frames(200); globalThis._tap(); dom.frames(6);   /* next room */
    await playRound(dom, { seed: 777 });
    check('  an achievement already earned is not sent again', d.c.set === after1,
          after1 + ' then ' + d.c.set + ' send(s)');
  }

  await new Promise(r => setImmediate(r));
  check('\nno promise rejected without a guard', rejections.length === 0, rejections.join(' | '));
  console.log(fails ? '\n' + fails + ' check(s) failed' : '\nall green');
  process.exit(fails ? 1 : 0);
})();
