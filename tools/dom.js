/* Minimal fake DOM, shared by the test tools.
   Each call returns a fresh environment with its own clock: the Wavedash
   tests replay the game several times, with a different SDK every time. */

let createCanvas;
try { ({ createCanvas } = require('@napi-rs/canvas')); }
catch (e) { console.error('@napi-rs/canvas is missing. Run: npm install'); process.exit(1); }

function install(opts) {
  opts = opts || {};
  const W = opts.W || 640, H = opts.H || 360;
  let clock = 1000, callback = null;

  const elem = t => {
    const e = t === 'canvas' ? createCanvas(W, H) : {};
    e.tagName = t; e.style = {}; e.addEventListener = () => {}; e.setPointerCapture = () => {};
    e.clientWidth = W; e.clientHeight = H; e.getBoundingClientRect = () => ({ left: 0, top: 0 });
    return e;
  };
  const canvas = elem('canvas');

  global.document = { getElementById: () => canvas, createElement: elem };
  global.window = { devicePixelRatio: 1, addEventListener: () => {},
                    AudioContext: function () { throw new Error('no audio in tests'); } };
  global.performance = { now: () => clock };
  /* In a browser self === window. With no Wavedash injected, this is the
     js13kgames.com situation: the one the contest rules are tested against. */
  global.self = global;
  if (opts.Wavedash) global.Wavedash = opts.Wavedash; else delete global.Wavedash;
  global.requestAnimationFrame = cb => { callback = cb; };
  global.setInterval = () => {}; global.setTimeout = () => {};

  return {
    canvas,
    run: src => new Function(src)(),
    /* Time only moves on frames: the game's own durations stay drivable. */
    frames(n, ms) { ms = ms === undefined ? 33 : ms;
      for (let i = 0; i < n; i++) if (callback) { const cb = callback; callback = null; clock += ms; cb(clock); } },
    advance(ms) { clock += ms; },
    /* Drains the microtask queue: the SDK promises have answered by then. */
    settle: () => new Promise(r => setImmediate(r)),
  };
}

module.exports = { install };
