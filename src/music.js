/* Procedural music engine.
   Everything is synthesized: no samples.
   A song = tracks (16-step patterns) stacked into sections
   (intro, build, chorus, break), with automatic fills and risers. */

var MIN = [0,2,3,5,7,8,10];        // natural minor
var DOR = [0,2,3,5,7,9,10];        // Dorian, for deep house
var MAJ = [0,2,4,5,7,9,11];

function nHz(n){ return 440*Math.pow(2,(n-69)/12); }
function degree(sc, d){                                 // scale degree, octaves included
  var o = Math.floor(d/7), i = ((d%7)+7)%7;
  return sc[i] + o*12;
}
function chord(sc, d){ return [degree(sc,d), degree(sc,d+2), degree(sc,d+4)]; }

/* ---------------- the nine tracks ---------------- */
/*  p  = 16-step rhythm pattern: x loud, o soft, . silent
    m  = melody in scale degrees, null = rest
    b  = variant played during the choruses                       */
var GENRES = {
techno: { bpm:132, sc:MIN, root:45, swing:0,
  prog:[0,0,5,4],
  trk:{
    kick: {p:'x...x...x...x...'},
    clap: {p:'....x.......x...'},
    hat:  {p:'..x...x...x...x.'},
    ohat: {p:'....o.......o..o'},
    bass: {p:'..x...x.x.x...x.', oct:-1},
    stab: {p:'..x.....x...x...', oct:0},
    lead: {p:'x.x.x.x.x.x.x.x.', oct:2,
           m:[0,null,4,null,7,null,4,null,3,null,7,null,9,null,7,null],
           b:[7,null,9,11,null,9,7,null,4,null,7,null,11,null,9,null]},
    arp:  {p:'xxxxxxxxxxxxxxxx', oct:2, arp:[0,2,4,6,4,2]}
  },
  sec:[ {n:'intro', b:4, t:'kick hat'},
        {n:'build', b:4, t:'kick hat ohat bass'},
        {n:'chorus',b:8, t:'kick clap hat ohat bass stab lead', R:1},
        {n:'break', b:4, t:'hat bass arp'},
        {n:'chorus',b:8, t:'kick clap hat ohat bass stab lead arp', R:1},
        {n:'outro', b:4, t:'kick hat ohat bass'} ] },

deep: { bpm:122, sc:DOR, root:43, swing:.14,
  prog:[0,3,5,4],
  trk:{
    kick: {p:'x...x...x...x...'},
    clap: {p:'....x.......x...'},
    hat:  {p:'..o...o...o...o.'},
    ohat: {p:'..x...x...x...x.'},
    bass: {p:'x.....x...x.....', oct:-1},
    pad:  {p:'x...............', oct:0, long:1},
    stab: {p:'....x.......x..x', oct:0},
    lead: {p:'....x..x....x...', oct:1,
           m:[null,null,null,null,4,null,null,2,null,null,null,null,0,null,null,null],
           b:[null,null,null,null,7,null,null,6,null,null,null,null,4,null,2,null]},
    arp:  {p:'..x...x...x...x.', oct:1, arp:[4,2,0,2]}
  },
  sec:[ {n:'intro', b:4, t:'kick ohat pad'},
        {n:'build', b:4, t:'kick ohat hat bass pad'},
        {n:'chorus',b:8, t:'kick clap ohat hat bass pad stab lead', R:1},
        {n:'break', b:4, t:'pad arp ohat'},
        {n:'chorus',b:8, t:'kick clap ohat hat bass pad stab lead arp', R:1},
        {n:'outro', b:4, t:'kick ohat pad bass'} ] },

dubstep: { bpm:140, sc:MIN, root:38, swing:0,
  prog:[0,0,3,5],
  trk:{
    kick: {p:'x.......x..x....'},
    snare:{p:'........x.......'},
    hat:  {p:'..x.o.x...x.o.x.'},
    wob:  {p:'x...x..xx...x.x.', oct:0,
           m:[0,null,null,null,0,null,null,3,3,null,null,null,5,null,3,null],
           b:[0,null,0,null,3,null,5,null,7,null,5,null,3,null,0,null]},
    sub:  {p:'x.......x.......', oct:-1},
    stab: {p:'....x.......x...', oct:0},
    lead: {p:'x...............', oct:1,
           m:[0,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
           b:[7,null,null,5,null,null,4,null,null,null,3,null,null,null,null,null]}
  },
  sec:[ {n:'intro', b:4, t:'kick hat sub'},
        {n:'build', b:4, t:'kick snare hat sub stab'},
        {n:'drop',  b:8, t:'kick snare hat wob sub', R:1},
        {n:'break', b:4, t:'hat sub lead'},
        {n:'drop',  b:8, t:'kick snare hat wob sub lead', R:1},
        {n:'outro', b:4, t:'kick hat sub'} ] },

dnb: { bpm:174, sc:MIN, root:40, swing:0,
  prog:[0,0,5,3],
  trk:{
    kick: {p:'x.......x.x.....'},
    snare:{p:'....x.......x...'},
    hat:  {p:'..x.o.x.o.x.o.x.'},
    reese:{p:'x.......x.......', oct:-1,
           m:[0,null,null,null,null,null,null,null,0,null,null,null,null,null,null,null],
           b:[0,null,null,null,3,null,null,null,5,null,null,null,3,null,null,null]},
    pad:  {p:'x...............', oct:0, long:1},
    lead: {p:'....x...x..x....', oct:1,
           m:[null,null,null,null,4,null,null,null,2,null,null,0,null,null,null,null],
           b:[null,null,null,null,7,null,null,null,9,null,null,7,null,null,null,null]},
    arp:  {p:'x.x.x.x.x.x.x.x.', oct:2, arp:[0,4,2,6]}
  },
  sec:[ {n:'intro', b:4, t:'hat pad reese'},
        {n:'build', b:4, t:'kick snare hat pad reese'},
        {n:'chorus',b:8, t:'kick snare hat reese lead pad', R:1},
        {n:'break', b:4, t:'pad arp hat'},
        {n:'chorus',b:8, t:'kick snare hat reese lead arp', R:1},
        {n:'outro', b:4, t:'hat pad reese'} ] },

synthwave: { bpm:110, sc:MIN, root:41, swing:0,
  prog:[0,5,3,4],
  trk:{
    kick: {p:'x.......x.......'},
    snare:{p:'....x.......x...'},
    hat:  {p:'..x...x...x...x.'},
    bass: {p:'x.x.x.x.x.x.x.x.', oct:0},
    pad:  {p:'x...............', oct:0, long:1},
    lead: {p:'x...x...x.x.....', oct:2,
           m:[4,null,null,null,2,null,null,null,0,null,2,null,null,null,null,null],
           b:[7,null,null,null,9,null,null,null,11,null,9,null,7,null,null,null]},
    arp:  {p:'xxxxxxxxxxxxxxxx', oct:2, arp:[0,2,4,7,4,2]}
  },
  sec:[ {n:'intro', b:4, t:'pad arp'},
        {n:'build', b:4, t:'kick pad arp bass'},
        {n:'chorus',b:8, t:'kick snare hat bass pad lead arp', R:1},
        {n:'break', b:4, t:'pad bass'},
        {n:'chorus',b:8, t:'kick snare hat bass pad lead arp', R:1},
        {n:'outro', b:4, t:'pad arp bass'} ] },

trance: { bpm:138, sc:MIN, root:45, swing:0,
  prog:[0,5,3,4],
  trk:{
    kick: {p:'x...x...x...x...'},
    clap: {p:'....x.......x...'},
    hat:  {p:'..x...x...x...x.'},
    ohat: {p:'..o...o...o...o.'},
    bass: {p:'..x...x...x...x.', oct:-1},
    pad:  {p:'x...............', oct:0, long:1},
    arp:  {p:'xxxxxxxxxxxxxxxx', oct:2, arp:[0,2,4,6,7,6,4,2]},
    lead: {p:'x.......x.......', oct:2,
           m:[4,null,null,null,null,null,null,null,2,null,null,null,null,null,null,null],
           b:[7,null,null,null,null,null,null,null,9,null,11,null,null,null,null,null]}
  },
  sec:[ {n:'intro', b:4, t:'kick hat ohat'},
        {n:'build', b:4, t:'kick hat ohat bass arp'},
        {n:'chorus',b:8, t:'kick clap hat ohat bass arp lead pad', R:1},
        {n:'break', b:4, t:'pad arp'},
        {n:'chorus',b:8, t:'kick clap hat ohat bass arp lead pad', R:1},
        {n:'outro', b:4, t:'kick hat ohat pad'} ] },
melodic: { bpm:118, sc:MAJ, root:45, swing:0,
  prog:[0,4,5,3],
  trk:{
    kick: {p:'x...x...x...x...'},
    clap: {p:'....x.......x...'},
    hat:  {p:'..o.o.o...o.o.o.'},
    ohat: {p:'..x...x...x...x.'},
    bass: {p:'..x...x...x...x.', oct:-1},
    pad:  {p:'x...............', oct:0, long:1},
    stab: {p:'....x.....x.....', oct:0},
    lead: {p:'x...x..x....x...', oct:2,
           m:[4,null,null,null,2,null,null,4,null,null,null,null,0,null,null,null],
           b:[7,null,9,null,7,null,null,4,null,null,2,null,4,null,null,null]},
    arp:  {p:'..x...x...x...x.', oct:2, arp:[0,2,4,6,4,2]}
  },
  sec:[ {n:'intro', b:4, t:'kick ohat pad'},
        {n:'build', b:4, t:'kick ohat hat bass pad arp'},
        {n:'chorus',b:8, t:'kick clap ohat hat bass pad stab lead arp', R:1},
        {n:'break', b:4, t:'pad arp ohat'},
        {n:'chorus',b:8, t:'kick clap ohat hat bass pad stab lead arp', R:1},
        {n:'outro', b:4, t:'kick ohat pad bass'} ] },

psy: { bpm:145, sc:MIN, root:38, swing:0,
  prog:[0,0,0,6],
  trk:{
    kick: {p:'x...x...x...x...'},
    hat:  {p:'..x.o.x.o.x.o.x.'},
    ohat: {p:'......o.......o.'},
    bass: {p:'.xx..xx..xx..xx.', oct:0},
    sub:  {p:'x...x...x...x...', oct:-1},
    pad:  {p:'x...............', oct:0, long:1},
    arp:  {p:'xxxxxxxxxxxxxxxx', oct:2, arp:[0,4,2,6,4,7,2,4]},
    lead: {p:'x.......x...x...', oct:2,
           m:[0,null,null,null,null,null,null,null,4,null,null,null,2,null,null,null],
           b:[7,null,null,6,null,null,4,null,7,null,null,null,9,null,7,null]}
  },
  sec:[ {n:'intro', b:4, t:'kick hat sub'},
        {n:'build', b:4, t:'kick hat ohat bass sub'},
        {n:'chorus',b:8, t:'kick hat ohat bass sub arp lead', R:1},
        {n:'break', b:4, t:'pad arp hat'},
        {n:'chorus',b:8, t:'kick hat ohat bass sub arp lead pad', R:1},
        {n:'outro', b:4, t:'kick hat sub bass'} ] },

garage: { bpm:132, sc:MIN, root:43, swing:.18,
  prog:[0,5,3,4],
  trk:{
    kick: {p:'x......x..x.....'},
    snare:{p:'....x.......x...'},
    hat:  {p:'..x.o.x.ox..o.x.'},
    ohat: {p:'......x.......x.'},
    sub:  {p:'x......x..x.....', oct:-1},
    stab: {p:'..x.....x...x...', oct:0},
    pad:  {p:'x...............', oct:0, long:1},
    lead: {p:'....x..x....x..x', oct:2,
           m:[null,null,null,null,4,null,null,2,null,null,null,null,0,null,null,2],
           b:[null,null,null,null,7,null,null,9,null,null,null,null,7,null,null,4]}
  },
  sec:[ {n:'intro', b:4, t:'kick hat sub'},
        {n:'build', b:4, t:'kick snare hat ohat sub stab'},
        {n:'chorus',b:8, t:'kick snare hat ohat sub stab lead pad', R:1},
        {n:'break', b:4, t:'pad hat sub'},
        {n:'chorus',b:8, t:'kick snare hat ohat sub stab lead pad', R:1},
        {n:'outro', b:4, t:'kick hat sub'} ] }
};

/* ---------------- engine ---------------- */
function Engine(){
  this.ac=null; this.g=null; this.genre='techno'; this.on=false;
  this.step=0; this.next=0; this.mute={}; this.active={}; this.seed=1;
}
Engine.prototype.init=function(){
  if(this.ac) return;
  var A = new (window.AudioContext||window.webkitAudioContext)();
  this.ac=A;
  var comp=A.createDynamicsCompressor();
  comp.threshold.value=-12; comp.ratio.value=6; comp.attack.value=.004; comp.release.value=.18;
  var m=A.createGain(); m.gain.value=.75;
  var sh=A.createWaveShaper(), cu=new Float32Array(512), i;   /* saturation on the master bus */
  for(i=0;i<512;i++) cu[i]=Math.tanh((i/256-1)*2.2)/.9757;
  sh.curve=cu; sh.oversample='2x';
  m.connect(sh); sh.connect(comp); comp.connect(A.destination);
  this.g=m;

  var ir=A.createBuffer(2, A.sampleRate*1.2|0, A.sampleRate), ch, j, dd;  /* reverb */
  for(ch=0;ch<2;ch++){ dd=ir.getChannelData(ch);
    for(j=0;j<dd.length;j++) dd[j]=(Math.random()*2-1)*Math.pow(1-j/dd.length,2.8); }
  var cv=A.createConvolver(); cv.buffer=ir;
  var rg=A.createGain(); rg.gain.value=.38;
  cv.connect(rg); rg.connect(m);
  this.fx=cv;
};
Engine.prototype.spb=function(){ return 60/GENRES[this.genre].bpm/4; };   // length of one step

/* --- voices --- */
Engine.prototype.env=function(node,t,v,a,d){
  var g=this.ac.createGain();
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v,t+a);
  g.gain.exponentialRampToValueAtTime(.0001,t+d);
  node.connect(g); return g;
};
Engine.prototype.noise=function(t,dur,hz,q,v,type,dest){
  var A=this.ac, n=A.sampleRate*dur|0, b=A.createBuffer(1,Math.max(64,n),A.sampleRate), c=b.getChannelData(0);
  for(var i=0;i<c.length;i++) c[i]=(Math.random()*2-1)*(1-i/c.length);
  var s=A.createBufferSource(); s.buffer=b;
  var f=A.createBiquadFilter(); f.type=type||'bandpass'; f.frequency.value=hz; f.Q.value=q;
  var g=A.createGain(); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  s.connect(f); f.connect(g); g.connect(dest||this.g); s.start(t); s.stop(t+dur+.02);
};
Engine.prototype.kick=function(t,v){
  var A=this.ac, o=A.createOscillator(), g=A.createGain();
  o.frequency.setValueAtTime(160,t); o.frequency.exponentialRampToValueAtTime(44,t+.10);
  g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.0001,t+.30);
  o.connect(g); g.connect(this.g); o.start(t); o.stop(t+.32);
  this.noise(t,.02,2200,1,v*.30,'highpass');
};
Engine.prototype.snare=function(t,v){
  this.noise(t,.16,1700,.7,v*.9,'highpass');
  var A=this.ac,o=A.createOscillator(),g=A.createGain();
  o.type='triangle'; o.frequency.setValueAtTime(220,t); o.frequency.exponentialRampToValueAtTime(140,t+.08);
  g.gain.setValueAtTime(v*.5,t); g.gain.exponentialRampToValueAtTime(.0001,t+.14);
  o.connect(g); g.connect(this.g); o.start(t); o.stop(t+.16);
  this.noise(t,.14,1500,.6,v*.30,'highpass',this.fx);
};
Engine.prototype.clap=function(t,v){
  for(var i=0;i<3;i++) this.noise(t+i*.011,.10,1500,1.2,v*(1-i*.22),'bandpass');
  this.noise(t,.20,1400,.8,v*.28,'bandpass',this.fx);
};
Engine.prototype.hat=function(t,v,open){
  this.noise(t,open?.16:.035,open?8200:9500,.9,v*(open?.6:.8),'highpass');
};
Engine.prototype.bass=function(t,n,dur,v,cut,type){
  var A=this.ac,o=A.createOscillator(),f=A.createBiquadFilter(),g=A.createGain();
  o.type=type||'sawtooth'; o.frequency.value=nHz(n);
  f.type='lowpass'; f.Q.value=7;
  f.frequency.setValueAtTime(cut||900,t); f.frequency.exponentialRampToValueAtTime(140,t+dur*.9);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v,t+.012);
  g.gain.setValueAtTime(v,t+dur*.7); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(f); f.connect(g); g.connect(this.g); o.start(t); o.stop(t+dur+.03);
};
Engine.prototype.sub=function(t,n,dur,v){
  var A=this.ac,o=A.createOscillator(),g=A.createGain();
  o.type='sine'; o.frequency.value=nHz(n);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v,t+.02);
  g.gain.setValueAtTime(v,t+dur*.8); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g); g.connect(this.g); o.start(t); o.stop(t+dur+.03);
};
Engine.prototype.wobble=function(t,n,dur,v,rate){
  var A=this.ac,o=A.createOscillator(),o2=A.createOscillator(),f=A.createBiquadFilter(),
      g=A.createGain(),lfo=A.createOscillator(),lg=A.createGain();
  o.type='sawtooth'; o.frequency.value=nHz(n);
  o2.type='square'; o2.frequency.value=nHz(n)*1.005;
  f.type='lowpass'; f.Q.value=12; f.frequency.value=420;
  lfo.type='sine'; lfo.frequency.value=rate; lg.gain.value=380;
  lfo.connect(lg); lg.connect(f.frequency);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v,t+.02);
  g.gain.setValueAtTime(v,t+dur*.85); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(f); o2.connect(f); f.connect(g); g.connect(this.g);
  o.start(t); o2.start(t); lfo.start(t);
  o.stop(t+dur+.03); o2.stop(t+dur+.03); lfo.stop(t+dur+.03);
};
Engine.prototype.reese=function(t,n,dur,v){
  var A=this.ac,f=A.createBiquadFilter(),g=A.createGain(),i;
  f.type='lowpass'; f.Q.value=4; f.frequency.value=700;
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v,t+.03);
  g.gain.setValueAtTime(v,t+dur*.85); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  f.connect(g); g.connect(this.g);
  for(i=0;i<3;i++){ var o=A.createOscillator(); o.type='sawtooth';
    o.frequency.value=nHz(n)*(1+(i-1)*.012); o.connect(f); o.start(t); o.stop(t+dur+.03); }
};
Engine.prototype.pluck=function(t,n,dur,v,type,wet){
  var A=this.ac,o=A.createOscillator(),f=A.createBiquadFilter(),g=A.createGain();
  o.type=type||'square'; o.frequency.value=nHz(n);
  f.type='lowpass'; f.frequency.setValueAtTime(4200,t); f.frequency.exponentialRampToValueAtTime(900,t+dur);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v,t+.008);
  g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(f); f.connect(g); g.connect(this.g);
  if(wet) g.connect(this.fx);
  o.start(t); o.stop(t+dur+.03);
};
Engine.prototype.pad=function(t,notes,dur,v){
  var A=this.ac,f=A.createBiquadFilter(),g=A.createGain(),i;
  f.type='lowpass'; f.frequency.setValueAtTime(700,t); f.frequency.linearRampToValueAtTime(2200,t+dur*.5);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v,t+dur*.25);
  g.gain.setValueAtTime(v,t+dur*.7); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  f.connect(g); g.connect(this.g); g.connect(this.fx);
  for(i=0;i<notes.length;i++){
    var o=A.createOscillator(); o.type='sawtooth'; o.frequency.value=nHz(notes[i]);
    var o2=A.createOscillator(); o2.type='sawtooth'; o2.frequency.value=nHz(notes[i])*1.007;
    o.connect(f); o2.connect(f); o.start(t); o2.start(t); o.stop(t+dur+.05); o2.stop(t+dur+.05);
  }
};
Engine.prototype.stab=function(t,notes,dur,v){
  for(var i=0;i<notes.length;i++) this.pluck(t,notes[i],dur,v/notes.length*1.4,'sawtooth',1);
};
Engine.prototype.riser=function(t,dur){          // noise sweep before a chorus
  var A=this.ac, n=A.sampleRate*dur|0, b=A.createBuffer(1,n,A.sampleRate), c=b.getChannelData(0), i;
  for(i=0;i<n;i++) c[i]=(Math.random()*2-1);
  var s=A.createBufferSource(); s.buffer=b;
  var f=A.createBiquadFilter(); f.type='bandpass'; f.Q.value=3;
  f.frequency.setValueAtTime(400,t); f.frequency.exponentialRampToValueAtTime(7000,t+dur);
  var g=A.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.16,t+dur);
  g.gain.exponentialRampToValueAtTime(.0001,t+dur+.12);
  s.connect(f); f.connect(g); g.connect(this.g); s.start(t); s.stop(t+dur+.14);
};
Engine.prototype.impact=function(t){
  var A=this.ac,o=A.createOscillator(),g=A.createGain();
  o.type='sine'; o.frequency.setValueAtTime(90,t); o.frequency.exponentialRampToValueAtTime(30,t+.7);
  g.gain.setValueAtTime(.5,t); g.gain.exponentialRampToValueAtTime(.0001,t+.8);
  o.connect(g); g.connect(this.g); o.start(t); o.stop(t+.82);
  this.noise(t,.7,900,.5,.22,'lowpass',this.fx);
};

/* --- arrangement --- */
function planSections(G){
  var p=[], m=0;
  for(var i=0;i<G.sec.length;i++){ p.push({i:i,beg:m,end:m+G.sec[i].b}); m+=G.sec[i].b; }
  return {p:p, total:m};
}
Engine.prototype.secAt=function(bar){
  var G=GENRES[this.genre], pl=this.plan||(this.plan=planSections(G));
  var b=bar%pl.total;
  for(var i=0;i<pl.p.length;i++) if(b>=pl.p[i].beg && b<pl.p[i].end)
    return {s:G.sec[pl.p[i].i], idx:pl.p[i].i, into:b-pl.p[i].beg, len:G.sec[pl.p[i].i].b, bar:b};
  return {s:G.sec[0], idx:0, into:0, len:G.sec[0].b, bar:b};
};
Engine.prototype.heardStep=function(){
  if(!this.ac||!this.on) return 0;
  return Math.max(0, this.step - (this.next-this.ac.currentTime)/this.spb());
};
Engine.prototype.state=function(){                       // what the ear is hearing right now
  var hs=this.heardStep(), bar=Math.floor(hs/16), e=this.secAt(bar);
  return { section:e.s.n, chorus:!!e.s.R, into:e.into, len:e.len,
           step:Math.floor(hs)%16, frac:hs%1, bar:bar, idx:e.idx, tracks:e.s.t.split(' ') };
};

Engine.prototype.playStep=function(i, t){
  var G=GENRES[this.genre], sc=G.sc, root=G.root;
  var bar=Math.floor(i/16), step=i%16;
  var e=this.secAt(bar), names=e.s.t.split(' '), R=!!e.s.R;
  var deg=G.prog[bar%G.prog.length];
  var ch=chord(sc,deg);
  var last = e.into===e.len-1;
  this.active={}; for(var k=0;k<names.length;k++) this.active[names[k]]=1;

  function a(n){ return names.indexOf(n)>=0; }
  var mute=this.mute;

  for(var ti=0; ti<names.length; ti++){
    var name=names[ti], T=G.trk[name]; if(!T||mute[name]) continue;
    var c=T.p.charAt(step); if(c==='.') continue;
    var v=(c==='x')?1:.6;

    if(name==='kick'){ this.kick(t,.85*v); }
    else if(name==='snare'){ this.snare(t,.5*v); }
    else if(name==='clap'){ this.clap(t,.42*v); }
    else if(name==='hat'){ this.hat(t,.20*v,0); }
    else if(name==='ohat'){ this.hat(t,.16*v,1); }
    else if(name==='bass'){
      var n0=root+degree(sc,deg)+(T.oct||0)*12;
      this.bass(t,n0,this.spb()*1.6,.30*v, R?1500:900);
    }
    else if(name==='sub'){ this.sub(t,root+degree(sc,deg)+(T.oct||0)*12,this.spb()*6,.42*v); }
    else if(name==='wob'){
      var mm=(R?T.b:T.m)[step]; if(mm===null||mm===undefined) continue;
      this.wobble(t, root+degree(sc,deg+mm)+(T.oct||0)*12, this.spb()*3.4, .34*v,
                  [2,3,4,6][(bar+step)%4]);
    }
    else if(name==='reese'){
      var mr=(R?T.b:T.m)[step]; if(mr===null||mr===undefined) continue;
      this.reese(t, root+degree(sc,deg+mr)+(T.oct||0)*12, this.spb()*7, .26*v);
    }
    else if(name==='pad'){ this.pad(t, ch.map(function(x){ return root+x+(T.oct||0)*12+12; }), this.spb()*16*(T.long?1:.5), .13*v); }
    else if(name==='stab'){ this.stab(t, ch.map(function(x){ return root+x+12; }), .22, .26*v); }
    else if(name==='lead'){
      var ml=(R&&T.b?T.b:T.m)[step]; if(ml===null||ml===undefined) continue;
      this.pluck(t, root+degree(sc,deg+ml)+(T.oct||0)*12, this.spb()*3, .22*v, 'square', 1);
    }
    else if(name==='arp'){
      var seq=T.arp, idx=(step+bar*3)%seq.length;
      this.pluck(t, root+degree(sc,deg+seq[idx])+(T.oct||0)*12, this.spb()*1.6, .13*v, 'sawtooth', 1);
    }
  }

  /* end-of-section fill: a roll over the last beat */
  if(last && step>=12 && (a('snare')||a('clap'))){
    this.noise(t,.06,1600,.8,.30,'highpass');
    if(step===15) this.noise(t,.05,1600,.8,.34,'highpass');
  }
  /* riser over the last bar before a chorus, impact on the first beat */
  var nxt=this.secAt(bar+1);
  if(last && step===0 && nxt.s.R) this.riser(t, this.spb()*16);
  if(e.into===0 && step===0 && e.s.R) this.impact(t);
};

Engine.prototype.tick=function(){
  if(!this.on) return;
  var A=this.ac, ahead=A.currentTime+.15, sp=this.spb(), G=GENRES[this.genre];
  while(this.next<ahead){
    var sw = (G.swing && (this.step%2)) ? sp*G.swing : 0;
    try{ this.playStep(this.step, this.next+sw); }catch(e){}
    this.next+=sp; this.step++;
  }
};
Engine.prototype.start=function(){
  this.init(); if(this.ac.state==='suspended') this.ac.resume();
  this.on=true; this.step=0; this.plan=null; this.next=this.ac.currentTime+.08;
  if(!this.timer) this.timer=setInterval(this.tick.bind(this),25);
};
Engine.prototype.stop=function(){ this.on=false; };
Engine.prototype.jump=function(idx){
  var G=GENRES[this.genre], pl=this.plan||(this.plan=planSections(G));
  this.step=pl.p[idx].beg*16;
  if(this.ac) this.next=this.ac.currentTime+.05;
};
Engine.prototype.setGenre=function(g){
  this.genre=g; this.plan=null; this.step=0;
  if(this.ac) this.next=this.ac.currentTime+.05;
};
/* musical position in beats, to sync an animation */
Engine.prototype.phase=function(){ return this.heardStep()/4; };   // in quarter notes

if(typeof module!=='undefined') module.exports={ GENRES, Engine, MIN, DOR, MAJ, degree, chord, nHz, planSections };
