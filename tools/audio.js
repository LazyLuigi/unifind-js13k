/* Walks the nine tracks over their 32 bars against a fake AudioContext,
   checks the effects chain and the frequency range of every track. */

const path = require('path');
const M = require(path.join(__dirname, '..', 'src', 'music.js'));

const made = {};
const P = () => ({ value: 0, setValueAtTime(){}, linearRampToValueAtTime(){},
                   exponentialRampToValueAtTime(){}, cancelScheduledValues(){} });
const N = kind => { made[kind] = (made[kind] || 0) + 1;
  return { type: '', curve: null, buffer: null, oversample: '',
    frequency: P(), Q: P(), gain: P(), threshold: P(), ratio: P(), attack: P(), release: P(), delayTime: P(),
    connect(){}, disconnect(){}, start(){}, stop(){}, getChannelData: () => new Float32Array(8) }; };
const AC = { currentTime: 0, state: 'running', sampleRate: 44100,
  createGain: () => N('gain'), createOscillator: () => N('oscillator'),
  createBiquadFilter: () => N('filter'), createDelay: () => N('delay'),
  createDynamicsCompressor: () => N('compressor'), createBufferSource: () => N('source'),
  createWaveShaper: () => N('saturation'), createConvolver: () => N('reverb'),
  createBuffer: (c, n) => ({ getChannelData: () => new Float32Array(n) }),
  destination: N('output'), resume(){} };
global.window = { AudioContext: function () { return AC; } };

const m = new M.Engine();
m.init();
console.log('audio chain: ' + Object.keys(made).join(', '));

let fails = 0;
const hz = n => 440 * Math.pow(2, (n - 69) / 12);

Object.keys(M.GENRES).forEach(g => {
  const G = M.GENRES[g];
  m.setGenre(g); m.plan = null;
  const plan = M.planSections(G);
  let error = null;
  for (let i = 0; i < plan.total * 16; i++) {
    try { m.playStep(i, i * 0.05); } catch (e) { error = e.message; break; }
  }
  let low = Infinity, high = 0;
  Object.keys(G.trk).forEach(k => {
    if (['kick','snare','clap','hat','ohat'].indexOf(k) >= 0) return;
    const T = G.trk[k];
    G.prog.forEach(deg => {
      let degrees = [0];
      if (T.m) degrees = T.m.filter(x => x !== null && x !== undefined);
      if (T.b) degrees = degrees.concat(T.b.filter(x => x !== null && x !== undefined));
      if (T.arp) degrees = T.arp;
      degrees.forEach(d => {
        const n = G.root + M.degree(G.sc, deg + d) + (T.oct || 0) * 12;
        low = Math.min(low, hz(n)); high = Math.max(high, hz(n));
      });
    });
  });
  const duration = (plan.total * 4 * 60 / G.bpm).toFixed(0);
  const ok = !error && low > 30 && high < 4000;
  if (!ok) fails++;
  console.log((ok ? '  ok   ' : '  FAIL ') + '  ' + g.padEnd(10) +
    String(G.bpm).padStart(3) + ' bpm   ' + String(duration).padStart(2) + ' s   ' +
    low.toFixed(0) + ' to ' + high.toFixed(0) + ' Hz' + (error ? '   ' + error : ''));
});

console.log(fails ? '\n' + fails + ' track(s) failed' : '\nall green');
process.exit(fails ? 1 : 0);
