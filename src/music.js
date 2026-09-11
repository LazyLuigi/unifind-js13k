/* Moteur musical procédural.
   Tout est synthétisé: aucun échantillon.
   Un morceau = des pistes (motifs de 16 pas) montées en sections
   (intro, montée, refrain, pont), avec fills et montées automatiques. */

var MIN = [0,2,3,5,7,8,10];        // mineur naturel
var DOR = [0,2,3,5,7,9,10];        // dorien, pour la deep house
var MAJ = [0,2,4,5,7,9,11];

function nHz(n){ return 440*Math.pow(2,(n-69)/12); }
function degre(sc, d){                                  // degré de gamme, octaves comprises
  var o = Math.floor(d/7), i = ((d%7)+7)%7;
  return sc[i] + o*12;
}
function accord(sc, d){ return [degre(sc,d), degre(sc,d+2), degre(sc,d+4)]; }

/* ---------------- les six morceaux ---------------- */
/*  p  = motif rythmique sur 16 pas: x fort, o faible, . silence
    m  = mélodie en degrés de gamme, null = silence
    b  = variante jouée pendant les refrains                      */
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
  sec:[ {n:'intro',  b:4, t:'kick hat'},
        {n:'montée', b:4, t:'kick hat ohat bass'},
        {n:'refrain',b:8, t:'kick clap hat ohat bass stab lead', R:1},
        {n:'pont',   b:4, t:'hat bass arp'},
        {n:'refrain',b:8, t:'kick clap hat ohat bass stab lead arp', R:1},
        {n:'sortie', b:4, t:'kick hat ohat bass'} ] },

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
  sec:[ {n:'intro',  b:4, t:'kick ohat pad'},
        {n:'montée', b:4, t:'kick ohat hat bass pad'},
        {n:'refrain',b:8, t:'kick clap ohat hat bass pad stab lead', R:1},
        {n:'pont',   b:4, t:'pad arp ohat'},
        {n:'refrain',b:8, t:'kick clap ohat hat bass pad stab lead arp', R:1},
        {n:'sortie', b:4, t:'kick ohat pad bass'} ] },

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
  sec:[ {n:'intro',  b:4, t:'kick hat sub'},
        {n:'montée', b:4, t:'kick snare hat sub stab'},
        {n:'drop',   b:8, t:'kick snare hat wob sub', R:1},
        {n:'pont',   b:4, t:'hat sub lead'},
        {n:'drop',   b:8, t:'kick snare hat wob sub lead', R:1},
        {n:'sortie', b:4, t:'kick hat sub'} ] },

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
  sec:[ {n:'intro',  b:4, t:'hat pad reese'},
        {n:'montée', b:4, t:'kick snare hat pad reese'},
        {n:'refrain',b:8, t:'kick snare hat reese lead pad', R:1},
        {n:'pont',   b:4, t:'pad arp hat'},
        {n:'refrain',b:8, t:'kick snare hat reese lead arp', R:1},
        {n:'sortie', b:4, t:'hat pad reese'} ] },

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
  sec:[ {n:'intro',  b:4, t:'pad arp'},
        {n:'montée', b:4, t:'kick pad arp bass'},
        {n:'refrain',b:8, t:'kick snare hat bass pad lead arp', R:1},
        {n:'pont',   b:4, t:'pad bass'},
        {n:'refrain',b:8, t:'kick snare hat bass pad lead arp', R:1},
        {n:'sortie', b:4, t:'pad arp bass'} ] },

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
  sec:[ {n:'intro',  b:4, t:'kick hat ohat'},
        {n:'montée', b:4, t:'kick hat ohat bass arp'},
        {n:'refrain',b:8, t:'kick clap hat ohat bass arp lead pad', R:1},
        {n:'pont',   b:4, t:'pad arp'},
        {n:'refrain',b:8, t:'kick clap hat ohat bass arp lead pad', R:1},
        {n:'sortie', b:4, t:'kick hat ohat pad'} ] },
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
  sec:[ {n:'intro',  b:4, t:'kick ohat pad'},
        {n:'montée', b:4, t:'kick ohat hat bass pad arp'},
        {n:'refrain',b:8, t:'kick clap ohat hat bass pad stab lead arp', R:1},
        {n:'pont',   b:4, t:'pad arp ohat'},
        {n:'refrain',b:8, t:'kick clap ohat hat bass pad stab lead arp', R:1},
        {n:'sortie', b:4, t:'kick ohat pad bass'} ] },

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
  sec:[ {n:'intro',  b:4, t:'kick hat sub'},
        {n:'montée', b:4, t:'kick hat ohat bass sub'},
        {n:'refrain',b:8, t:'kick hat ohat bass sub arp lead', R:1},
        {n:'pont',   b:4, t:'pad arp hat'},
        {n:'refrain',b:8, t:'kick hat ohat bass sub arp lead pad', R:1},
        {n:'sortie', b:4, t:'kick hat sub bass'} ] },

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
  sec:[ {n:'intro',  b:4, t:'kick hat sub'},
        {n:'montée', b:4, t:'kick snare hat ohat sub stab'},
        {n:'refrain',b:8, t:'kick snare hat ohat sub stab lead pad', R:1},
        {n:'pont',   b:4, t:'pad hat sub'},
        {n:'refrain',b:8, t:'kick snare hat ohat sub stab lead pad', R:1},
        {n:'sortie', b:4, t:'kick hat sub'} ] }
};

/* ---------------- moteur ---------------- */
function Moteur(){
  this.ac=null; this.g=null; this.genre='techno'; this.on=false;
  this.pas=0; this.next=0; this.mute={}; this.actifs={}; this.seed=1;
}
Moteur.prototype.init=function(){
  if(this.ac) return;
  var A = new (window.AudioContext||window.webkitAudioContext)();
  this.ac=A;
  var comp=A.createDynamicsCompressor();
  comp.threshold.value=-12; comp.ratio.value=6; comp.attack.value=.004; comp.release.value=.18;
  var m=A.createGain(); m.gain.value=.75;
  var sh=A.createWaveShaper(), cu=new Float32Array(512), i;   /* saturation du bus general */
  for(i=0;i<512;i++) cu[i]=Math.tanh((i/256-1)*2.2)/.9757;
  sh.curve=cu; sh.oversample='2x';
  m.connect(sh); sh.connect(comp); comp.connect(A.destination);
  this.g=m;

  var ir=A.createBuffer(2, A.sampleRate*1.2|0, A.sampleRate), ch, j, dd;  /* réverbe */
  for(ch=0;ch<2;ch++){ dd=ir.getChannelData(ch);
    for(j=0;j<dd.length;j++) dd[j]=(Math.random()*2-1)*Math.pow(1-j/dd.length,2.8); }
  var cv=A.createConvolver(); cv.buffer=ir;
  var rg=A.createGain(); rg.gain.value=.38;
  cv.connect(rg); rg.connect(m);
  this.fx=cv;
};
Moteur.prototype.spb=function(){ return 60/GENRES[this.genre].bpm/4; };   // durée d'un pas

/* --- voix --- */
Moteur.prototype.env=function(node,t,v,a,d){
  var g=this.ac.createGain();
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v,t+a);
  g.gain.exponentialRampToValueAtTime(.0001,t+d);
  node.connect(g); return g;
};
Moteur.prototype.bruit=function(t,dur,hz,q,v,type,dest){
  var A=this.ac, n=A.sampleRate*dur|0, b=A.createBuffer(1,Math.max(64,n),A.sampleRate), c=b.getChannelData(0);
  for(var i=0;i<c.length;i++) c[i]=(Math.random()*2-1)*(1-i/c.length);
  var s=A.createBufferSource(); s.buffer=b;
  var f=A.createBiquadFilter(); f.type=type||'bandpass'; f.frequency.value=hz; f.Q.value=q;
  var g=A.createGain(); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  s.connect(f); f.connect(g); g.connect(dest||this.g); s.start(t); s.stop(t+dur+.02);
};
Moteur.prototype.kick=function(t,v){
  var A=this.ac, o=A.createOscillator(), g=A.createGain();
  o.frequency.setValueAtTime(160,t); o.frequency.exponentialRampToValueAtTime(44,t+.10);
  g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.0001,t+.30);
  o.connect(g); g.connect(this.g); o.start(t); o.stop(t+.32);
  this.bruit(t,.02,2200,1,v*.30,'highpass');
};
Moteur.prototype.snare=function(t,v){
  this.bruit(t,.16,1700,.7,v*.9,'highpass');
  var A=this.ac,o=A.createOscillator(),g=A.createGain();
  o.type='triangle'; o.frequency.setValueAtTime(220,t); o.frequency.exponentialRampToValueAtTime(140,t+.08);
  g.gain.setValueAtTime(v*.5,t); g.gain.exponentialRampToValueAtTime(.0001,t+.14);
  o.connect(g); g.connect(this.g); o.start(t); o.stop(t+.16);
  this.bruit(t,.14,1500,.6,v*.30,'highpass',this.fx);
};
Moteur.prototype.clap=function(t,v){
  for(var i=0;i<3;i++) this.bruit(t+i*.011,.10,1500,1.2,v*(1-i*.22),'bandpass');
  this.bruit(t,.20,1400,.8,v*.28,'bandpass',this.fx);
};
Moteur.prototype.hat=function(t,v,open){
  this.bruit(t,open?.16:.035,open?8200:9500,.9,v*(open?.6:.8),'highpass');
};
Moteur.prototype.basse=function(t,n,dur,v,cut,type){
  var A=this.ac,o=A.createOscillator(),f=A.createBiquadFilter(),g=A.createGain();
  o.type=type||'sawtooth'; o.frequency.value=nHz(n);
  f.type='lowpass'; f.Q.value=7;
  f.frequency.setValueAtTime(cut||900,t); f.frequency.exponentialRampToValueAtTime(140,t+dur*.9);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v,t+.012);
  g.gain.setValueAtTime(v,t+dur*.7); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(f); f.connect(g); g.connect(this.g); o.start(t); o.stop(t+dur+.03);
};
Moteur.prototype.sub=function(t,n,dur,v){
  var A=this.ac,o=A.createOscillator(),g=A.createGain();
  o.type='sine'; o.frequency.value=nHz(n);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v,t+.02);
  g.gain.setValueAtTime(v,t+dur*.8); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g); g.connect(this.g); o.start(t); o.stop(t+dur+.03);
};
Moteur.prototype.wobble=function(t,n,dur,v,rate){
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
Moteur.prototype.reese=function(t,n,dur,v){
  var A=this.ac,f=A.createBiquadFilter(),g=A.createGain(),i;
  f.type='lowpass'; f.Q.value=4; f.frequency.value=700;
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v,t+.03);
  g.gain.setValueAtTime(v,t+dur*.85); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  f.connect(g); g.connect(this.g);
  for(i=0;i<3;i++){ var o=A.createOscillator(); o.type='sawtooth';
    o.frequency.value=nHz(n)*(1+(i-1)*.012); o.connect(f); o.start(t); o.stop(t+dur+.03); }
};
Moteur.prototype.pluck=function(t,n,dur,v,type,vers){
  var A=this.ac,o=A.createOscillator(),f=A.createBiquadFilter(),g=A.createGain();
  o.type=type||'square'; o.frequency.value=nHz(n);
  f.type='lowpass'; f.frequency.setValueAtTime(4200,t); f.frequency.exponentialRampToValueAtTime(900,t+dur);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v,t+.008);
  g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(f); f.connect(g); g.connect(this.g);
  if(vers) g.connect(this.fx);
  o.start(t); o.stop(t+dur+.03);
};
Moteur.prototype.nappe=function(t,notes,dur,v){
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
Moteur.prototype.accordCourt=function(t,notes,dur,v){
  for(var i=0;i<notes.length;i++) this.pluck(t,notes[i],dur,v/notes.length*1.4,'sawtooth',1);
};
Moteur.prototype.montee=function(t,dur){          // balayage de bruit avant un refrain
  var A=this.ac, n=A.sampleRate*dur|0, b=A.createBuffer(1,n,A.sampleRate), c=b.getChannelData(0), i;
  for(i=0;i<n;i++) c[i]=(Math.random()*2-1);
  var s=A.createBufferSource(); s.buffer=b;
  var f=A.createBiquadFilter(); f.type='bandpass'; f.Q.value=3;
  f.frequency.setValueAtTime(400,t); f.frequency.exponentialRampToValueAtTime(7000,t+dur);
  var g=A.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.16,t+dur);
  g.gain.exponentialRampToValueAtTime(.0001,t+dur+.12);
  s.connect(f); f.connect(g); g.connect(this.g); s.start(t); s.stop(t+dur+.14);
};
Moteur.prototype.impact=function(t){
  var A=this.ac,o=A.createOscillator(),g=A.createGain();
  o.type='sine'; o.frequency.setValueAtTime(90,t); o.frequency.exponentialRampToValueAtTime(30,t+.7);
  g.gain.setValueAtTime(.5,t); g.gain.exponentialRampToValueAtTime(.0001,t+.8);
  o.connect(g); g.connect(this.g); o.start(t); o.stop(t+.82);
  this.bruit(t,.7,900,.5,.22,'lowpass',this.fx);
};

/* --- arrangement --- */
function planSections(G){
  var p=[], m=0;
  for(var i=0;i<G.sec.length;i++){ p.push({i:i,deb:m,fin:m+G.sec[i].b}); m+=G.sec[i].b; }
  return {p:p, total:m};
}
Moteur.prototype.sectionA=function(bar){
  var G=GENRES[this.genre], pl=this.plan||(this.plan=planSections(G));
  var b=bar%pl.total;
  for(var i=0;i<pl.p.length;i++) if(b>=pl.p[i].deb && b<pl.p[i].fin)
    return {s:G.sec[pl.p[i].i], idx:pl.p[i].i, dans:b-pl.p[i].deb, len:G.sec[pl.p[i].i].b, bar:b};
  return {s:G.sec[0], idx:0, dans:0, len:G.sec[0].b, bar:b};
};
Moteur.prototype.pasAudible=function(){
  if(!this.ac||!this.on) return 0;
  return Math.max(0, this.pas - (this.next-this.ac.currentTime)/this.spb());
};
Moteur.prototype.etat=function(){                       // ce que l'oreille entend maintenant
  var pa=this.pasAudible(), bar=Math.floor(pa/16), e=this.sectionA(bar);
  return { section:e.s.n, refrain:!!e.s.R, dans:e.dans, len:e.len,
           pas:Math.floor(pa)%16, frac:pa%1, bar:bar, idx:e.idx, pistes:e.s.t.split(' ') };
};

Moteur.prototype.jouePas=function(i, t){
  var G=GENRES[this.genre], sc=G.sc, root=G.root;
  var bar=Math.floor(i/16), step=i%16;
  var e=this.sectionA(bar), act=e.s.t.split(' '), R=!!e.s.R;
  var deg=G.prog[bar%G.prog.length];
  var ch=accord(sc,deg);
  var derniere = e.dans===e.len-1;
  this.actifs={}; for(var k=0;k<act.length;k++) this.actifs[act[k]]=1;

  function a(n){ return act.indexOf(n)>=0; }
  var mute=this.mute;

  for(var ti=0; ti<act.length; ti++){
    var nom=act[ti], T=G.trk[nom]; if(!T||mute[nom]) continue;
    var c=T.p.charAt(step); if(c==='.') continue;
    var v=(c==='x')?1:.6;

    if(nom==='kick'){ this.kick(t,.85*v); }
    else if(nom==='snare'){ this.snare(t,.5*v); }
    else if(nom==='clap'){ this.clap(t,.42*v); }
    else if(nom==='hat'){ this.hat(t,.20*v,0); }
    else if(nom==='ohat'){ this.hat(t,.16*v,1); }
    else if(nom==='bass'){
      var n0=root+degre(sc,deg)+(T.oct||0)*12;
      this.basse(t,n0,this.spb()*1.6,.30*v, R?1500:900);
    }
    else if(nom==='sub'){ this.sub(t,root+degre(sc,deg)+(T.oct||0)*12,this.spb()*6,.42*v); }
    else if(nom==='wob'){
      var mm=(R?T.b:T.m)[step]; if(mm===null||mm===undefined) continue;
      this.wobble(t, root+degre(sc,deg+mm)+(T.oct||0)*12, this.spb()*3.4, .34*v,
                  [2,3,4,6][(bar+step)%4]);
    }
    else if(nom==='reese'){
      var mr=(R?T.b:T.m)[step]; if(mr===null||mr===undefined) continue;
      this.reese(t, root+degre(sc,deg+mr)+(T.oct||0)*12, this.spb()*7, .26*v);
    }
    else if(nom==='pad'){ this.nappe(t, ch.map(function(x){ return root+x+(T.oct||0)*12+12; }), this.spb()*16*(T.long?1:.5), .13*v); }
    else if(nom==='stab'){ this.accordCourt(t, ch.map(function(x){ return root+x+12; }), .22, .26*v); }
    else if(nom==='lead'){
      var ml=(R&&T.b?T.b:T.m)[step]; if(ml===null||ml===undefined) continue;
      this.pluck(t, root+degre(sc,deg+ml)+(T.oct||0)*12, this.spb()*3, .22*v, 'square', 1);
    }
    else if(nom==='arp'){
      var seq=T.arp, idx=(step+bar*3)%seq.length;
      this.pluck(t, root+degre(sc,deg+seq[idx])+(T.oct||0)*12, this.spb()*1.6, .13*v, 'sawtooth', 1);
    }
  }

  /* fill de fin de section: roulement sur le dernier temps */
  if(derniere && step>=12 && (a('snare')||a('clap'))){
    this.bruit(t,.06,1600,.8,.30,'highpass');
    if(step===15) this.bruit(t,.05,1600,.8,.34,'highpass');
  }
  /* montée sur la dernière mesure avant un refrain, impact sur le premier temps */
  var suiv=this.sectionA(bar+1);
  if(derniere && step===0 && suiv.s.R) this.montee(t, this.spb()*16);
  if(e.dans===0 && step===0 && e.s.R) this.impact(t);
};

Moteur.prototype.tick=function(){
  if(!this.on) return;
  var A=this.ac, ahead=A.currentTime+.15, sp=this.spb(), G=GENRES[this.genre];
  while(this.next<ahead){
    var sw = (G.swing && (this.pas%2)) ? sp*G.swing : 0;
    try{ this.jouePas(this.pas, this.next+sw); }catch(e){}
    this.next+=sp; this.pas++;
  }
};
Moteur.prototype.start=function(){
  this.init(); if(this.ac.state==='suspended') this.ac.resume();
  this.on=true; this.pas=0; this.plan=null; this.next=this.ac.currentTime+.08;
  if(!this.timer) this.timer=setInterval(this.tick.bind(this),25);
};
Moteur.prototype.stop=function(){ this.on=false; };
Moteur.prototype.saut=function(idx){
  var G=GENRES[this.genre], pl=this.plan||(this.plan=planSections(G));
  this.pas=pl.p[idx].deb*16;
  if(this.ac) this.next=this.ac.currentTime+.05;
};
Moteur.prototype.setGenre=function(g){
  this.genre=g; this.plan=null; this.pas=0;
  if(this.ac) this.next=this.ac.currentTime+.05;
};
/* position musicale en temps, pour synchroniser une animation */
Moteur.prototype.phase=function(){ return this.pasAudible()/4; };   // en noires

if(typeof module!=='undefined') module.exports={ GENRES, Moteur, MIN, DOR, MAJ, degre, accord, nHz, planSections };
