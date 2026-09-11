/* Deroule les neuf morceaux sur leurs 32 mesures avec un faux AudioContext,
   verifie la chaine d effets et les plages de frequences de chaque piste. */

const path = require('path');
const M = require(path.join(__dirname, '..', 'src', 'music.js'));

const cree = {};
const P = () => ({ value: 0, setValueAtTime(){}, linearRampToValueAtTime(){},
                   exponentialRampToValueAtTime(){}, cancelScheduledValues(){} });
const N = genre => { cree[genre] = (cree[genre] || 0) + 1;
  return { type: '', curve: null, buffer: null, oversample: '',
    frequency: P(), Q: P(), gain: P(), threshold: P(), ratio: P(), attack: P(), release: P(), delayTime: P(),
    connect(){}, disconnect(){}, start(){}, stop(){}, getChannelData: () => new Float32Array(8) }; };
const AC = { currentTime: 0, state: 'running', sampleRate: 44100,
  createGain: () => N('gain'), createOscillator: () => N('oscillateur'),
  createBiquadFilter: () => N('filtre'), createDelay: () => N('delai'),
  createDynamicsCompressor: () => N('compresseur'), createBufferSource: () => N('source'),
  createWaveShaper: () => N('saturation'), createConvolver: () => N('reverbe'),
  createBuffer: (c, n) => ({ getChannelData: () => new Float32Array(n) }),
  destination: N('sortie'), resume(){} };
global.window = { AudioContext: function () { return AC; } };

const m = new M.Moteur();
m.init();
console.log('chaine audio: ' + Object.keys(cree).join(', '));

let echecs = 0;
const hz = n => 440 * Math.pow(2, (n - 69) / 12);

Object.keys(M.GENRES).forEach(g => {
  const G = M.GENRES[g];
  m.setGenre(g); m.plan = null;
  const plan = M.planSections(G);
  let erreur = null;
  for (let i = 0; i < plan.total * 16; i++) {
    try { m.jouePas(i, i * 0.05); } catch (e) { erreur = e.message; break; }
  }
  let grave = Infinity, aigu = 0;
  Object.keys(G.trk).forEach(k => {
    if (['kick','snare','clap','hat','ohat'].indexOf(k) >= 0) return;
    const T = G.trk[k];
    G.prog.forEach(deg => {
      let degres = [0];
      if (T.m) degres = T.m.filter(x => x !== null && x !== undefined);
      if (T.b) degres = degres.concat(T.b.filter(x => x !== null && x !== undefined));
      if (T.arp) degres = T.arp;
      degres.forEach(d => {
        const n = G.root + M.degre(G.sc, deg + d) + (T.oct || 0) * 12;
        grave = Math.min(grave, hz(n)); aigu = Math.max(aigu, hz(n));
      });
    });
  });
  const duree = (plan.total * 4 * 60 / G.bpm).toFixed(0);
  const ok = !erreur && grave > 30 && aigu < 4000;
  if (!ok) echecs++;
  console.log((ok ? '  ok   ' : '  ECHEC') + '  ' + g.padEnd(10) +
    String(G.bpm).padStart(3) + ' bpm   ' + String(duree).padStart(2) + ' s   ' +
    grave.toFixed(0) + ' a ' + aigu.toFixed(0) + ' Hz' + (erreur ? '   ' + erreur : ''));
});

console.log(echecs ? '\n' + echecs + ' morceau(x) en echec' : '\ntout est vert');
process.exit(echecs ? 1 : 0);
