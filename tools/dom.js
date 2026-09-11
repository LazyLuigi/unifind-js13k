/* Faux DOM minimal, partage par les outils de test.
   Chaque appel rend un environnement neuf, avec sa propre horloge: les tests
   Wavedash rejouent le jeu plusieurs fois avec un SDK different a chaque fois. */

let createCanvas;
try { ({ createCanvas } = require('@napi-rs/canvas')); }
catch (e) { console.error('Il manque @napi-rs/canvas. Lancer: npm install'); process.exit(1); }

function installe(opts) {
  opts = opts || {};
  const W = opts.W || 640, H = opts.H || 360;
  let horloge = 1000, rappel = null;

  const elem = t => {
    const e = t === 'canvas' ? createCanvas(W, H) : {};
    e.tagName = t; e.style = {}; e.addEventListener = () => {}; e.setPointerCapture = () => {};
    e.clientWidth = W; e.clientHeight = H; e.getBoundingClientRect = () => ({ left: 0, top: 0 });
    return e;
  };
  const toile = elem('canvas');

  global.document = { getElementById: () => toile, createElement: elem };
  global.window = { devicePixelRatio: 1, addEventListener: () => {},
                    AudioContext: function () { throw new Error('pas de son en test'); } };
  global.performance = { now: () => horloge };
  /* Dans un navigateur self === window. Sans Wavedash injecte, c'est la
     situation de js13kgames.com: celle que le reglement du concours teste. */
  global.self = global;
  if (opts.Wavedash) global.Wavedash = opts.Wavedash; else delete global.Wavedash;
  global.requestAnimationFrame = cb => { rappel = cb; };
  global.setInterval = () => {}; global.setTimeout = () => {};

  return {
    toile,
    lance: src => new Function(src)(),
    /* Le temps n'avance que par les images: les durees du jeu sont pilotables. */
    frames(n, pas) { pas = pas === undefined ? 33 : pas;
      for (let i = 0; i < n; i++) if (rappel) { const cb = rappel; rappel = null; horloge += pas; cb(horloge); } },
    avance(ms) { horloge += ms; },
    /* Vide la file des microtaches: les promesses du SDK ont alors repondu. */
    souffle: () => new Promise(r => setImmediate(r)),
  };
}

module.exports = { installe };
