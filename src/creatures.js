/* Lab 3: the sticker style, in the visual grammar of the Unicorn Zoo.
   No outline strokes: solid ellipses, rainbow accents,
   dark eyes with a drop of light, a horn in a golden gradient. */

function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

var RB=['#ff7a9c','#ffb057','#ffe14d','#7fdc8a','#5fc8f5','#9b8cf5','#e08cf0'];
var INK='#3b2a52', SNOUT='#ffb3c8', CHEEK='rgba(255,150,185,.45)';

/*  0 bw  1 bh  2 hr  3 hw  4 nk  5 er 6 es  7 mz  8 mt 9 tl 10 hn 11 mn 12 lg 13 arm 14 eye 15 wool */
var SPECIES = [
  [ .150,.175,.165,1.06,.040, 2,.52,.62, 1, 2, 1, 1,.120, 0, 0, 0],
  [ .152,.175,.165,1.06,.040, 2,.52,.62, 1, 2, 0, 1,.120, 0, 0, 0],
  [ .205,.190,.185,1.04,.000, 1,.58,.50, 1, 1, 0, 0,.090, 0, 0, 0],
  [ .175,.200,.205,1.20,.000, 4,.58,.34, 3, 0, 0, 0,.070, 1, 2, 0],
  [ .150,.170,.170,1.04,.020, 2,.62,.34, 1, 2, 0, 0,.110, 0, 0, 0],
  [ .145,.175,.160,0.96,.020, 3,1.20,.34,1, 1, 0, 0,.115, 0, 0, 0],
  [ .150,.170,.160,1.08,.030, 2,.88,.56, 1, 3, 0, 0,.110, 0, 0, 0],
  [ .190,.180,.170,1.02,.000, 5,.55,.44, 1, 1, 0, 0,.085, 0, 0, 1],
  [ .130,.150,.150,1.00,.025, 0,.00,.50, 3, 0, 0, 1,.100, 1, 0, 0],
  [ .200,.145,.185,1.32,.000, 0,.00,.00, 4, 0, 0, 0,.085, 0, 1, 0]
];

/* the sticker look */
var LOOK = {
  club: { edge:.036, volume:.16, shade:.24, sat:80, lum:62 }
};

function hsl(h,s,l){ return 'hsl('+((h%360)+360)%360+','+s+'%,'+l+'%)'; }

function makePalette(r, style, forceHue){
  var L=LOOK[style], h = forceHue!=null?forceHue:Math.floor(r()*360);
  var s=L.sat+Math.floor(r()*18), l=L.lum-Math.floor(r()*12);
  var ac = RB[Math.floor(r()*RB.length)];
  if(r()<.10) return {                       // cream family, like the zoo's lion
    hue:h, cream:1,
    body:'#fff6ea', top:'#fffdf7', bot:'#f3e4d6', belly:'#fffaf2', paw:'#f0e0d2',
    accent:ac, snout:SNOUT, ink:INK, rim:ac
  };
  return {
    hue:h,
    body: hsl(h,s,l), top: hsl(h,s-8,Math.min(96,l+8)), bot: hsl(h,s+12,l-13),
    belly: hsl(h,s-16,Math.min(97,l+12)),
    paw: hsl(h,s+8,l-8),
    accent: ac, snout: SNOUT, ink: INK, rim: hsl(h,72,62)
  };
}

function makeCreature(species, seed, style, forceHue){
  var r = mulberry32((seed*2654435761 + species*7919)>>>0), L=LOOK[style];
  var s = SPECIES[species], p={};
  var v=function(i,amt){ return s[i]*(1+(r()*2-1)*amt); };
  p.species=species; p.style=style; p.L=L;
  p.bw=v(0,.11); p.bh=v(1,.09); p.hr=v(2,.10); p.hw=s[3]*(1+(r()*2-1)*.05);
  p.nk=s[4]; p.er=s[5]; p.es=v(6,.16); p.mz=v(7,.14); p.mt=s[8];
  p.tl=s[9]; p.hn=s[10]; p.mn=s[11]; p.lg=v(12,.12); p.arm=s[13]; p.eyeSt=s[14]; p.wool=s[15];
  p.fat=.92+r()*.20;
  p.dots = r()<.30;                       // a few creatures get rainbow polka dots
  p.mouth = Math.floor(r()*3);
  p.rot = Math.floor(r()*7);              // where the mane starts in the rainbow
  p.pal = makePalette(r, style, forceHue);
  p.m = metrics(p);
  return p;
}

function metrics(p){
  var m={}, footY=.5;
  m.bw=p.bw*p.fat; m.bh=p.bh;
  m.bodyCY=footY-p.lg-m.bh;
  m.headRX=p.hr*p.hw; m.headRY=p.hr;
  m.headCY=m.bodyCY-m.bh*.82-p.nk-m.headRY*.74;
  var top=m.headCY-m.headRY, e=p.hr*p.es, wid=Math.max(m.bw*1.9, m.headRX*2);
  if(p.mn) top=Math.min(top, m.headCY-m.headRY*1.26);
  if(p.wool){ top=Math.min(top, m.headCY-m.headRY*1.05); wid=Math.max(wid, m.bw*2.35); }
  if(p.er===1) top=Math.min(top, m.headCY-m.headRY*.70-e*.55);
  if(p.er===2) top=Math.min(top, m.headCY-m.headRY*.70-e*1.05);
  if(p.er===3) top=Math.min(top, m.headCY-m.headRY*.70-e*2.20);
  if(p.er===4) top=Math.min(top, m.headCY-m.headRY*.70-e*.95);
  if(p.hn)     top=Math.min(top, m.headCY-m.headRY*.92-p.hr*1.30);
  if(p.eyeSt===1) top=Math.min(top, m.headCY-m.headRY*.80-p.hr*.30);
  m.top=top-.02; m.bot=footY+.03; m.h=m.bot-m.top; m.w=wid*1.12;
  m.k=Math.min(.95/m.h,.95/m.w); m.dy=-(m.top+m.bot)/2*m.k;
  return m;
}

function ell(g,x,y,rx,ry,rot){ g.beginPath(); g.ellipse(x,y,Math.abs(rx),Math.abs(ry),rot||0,0,6.2832); }
function fill(g,c){ g.fillStyle=c; g.fill(); }
function capsule(g,x1,y1,x2,y2,w){ var dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy);
  g.beginPath(); g.ellipse((x1+x2)/2,(y1+y2)/2,L/2+w/2,w/2,Math.atan2(dy,dx),0,6.2832); }

function drawCreature(g, p, style, pose){
  var P=p.pal, m=p.m;
  var bw=m.bw, bh=m.bh, bodyCY=m.bodyCY, headCY=m.headCY, hrx=m.headRX, hry=m.headRY;
  var up=pose===1, footR=Math.max(.028,p.lg*.46);

  g.save();
  g.scale(m.k,m.k); g.translate(0,m.dy/m.k);
  function vgrad(y0,y1,c0,c1){ var q=g.createLinearGradient(0,y0,0,y1); q.addColorStop(0,c0); q.addColorStop(1,c1); return q; }

  /* tail */
  var tx=-bw*.86, ty=bodyCY+bh*.24;
  if(p.tl===1){ ell(g,tx,ty,p.hr*.26,p.hr*.26); fill(g,P.belly); }
  if(p.tl===2){ capsule(g,tx,ty,tx-p.hr*.46,ty-p.hr*(up?.85:.28),p.hr*.16); fill(g,P.accent); }
  if(p.tl===3){ ell(g,tx-p.hr*.26,ty-p.hr*.20,p.hr*.50,p.hr*.30,-.55); fill(g,P.accent);
    ell(g,tx-p.hr*.48,ty-p.hr*.32,p.hr*.24,p.hr*.18,-.55); fill(g,'#fffaf2'); }

  /* legs */
  var sx=bw*.44, kick=up?.40:-.30;
  for(var s2=-1;s2<=1;s2+=2){ var fx=s2*sx+s2*p.lg*kick*.6;
    capsule(g,s2*sx,bodyCY+bh*.55,fx,.5-footR*.75,footR*1.00); fill(g,P.paw);
    ell(g,fx,.5-footR*.62,footR*1.12,footR*.80); fill(g,P.bot); }

  /* body */
  ell(g,0,bodyCY,bw,bh); fill(g,vgrad(bodyCY-bh,bodyCY+bh,P.top,P.bot));
  if(p.wool){ for(var q=0;q<8;q++){ var a=q/8*6.2832;
      ell(g,Math.cos(a)*bw*.80,bodyCY+Math.sin(a)*bh*.72,bw*.40,bw*.40); fill(g,'#fffdf8'); }
    ell(g,0,bodyCY,bw*.82,bh*.80); fill(g,'#fffdf8'); }
  else { ell(g,0,bodyCY+bh*.26,bw*.58,bh*.56); fill(g,P.belly); }
  if(p.dots && !p.wool){ for(var d=0;d<4;d++){
      ell(g,(d%2?-1:1)*bw*(.30+.18*d),bodyCY-bh*.30+d*bh*.28,bw*.13,bw*.13); fill(g,RB[(p.rot+d)%7]); } }

  /* arms or wings */
  var ay=bodyCY-bh*.06;
  if(p.arm){ for(var i=-1;i<=1;i+=2){ ell(g,i*bw*.82,bodyCY,bw*.28,bh*(up?.52:.78),i*(up?-.85:-.12)); fill(g,P.belly); } }
  else { var aeX=up?bw*.80:bw*.36, aeY=up?ay-bh*1.35:ay+bh*.95;
    for(var j0=-1;j0<=1;j0+=2){
      capsule(g,j0*bw*.68,ay,j0*(bw*.72+aeX),aeY,footR*.92); fill(g,P.paw);
      ell(g,j0*(bw*.72+aeX),aeY,footR*1.02,footR*1.02); fill(g,P.bot); } }

  if(p.nk>.001){ capsule(g,0,bodyCY-bh*.4,0,headCY+hry*.5,hrx*.52); fill(g,P.body); }

  /* ears */
  var exx=hrx*.56, eyy=headCY-hry*.72, e=p.hr*p.es;
  function ears(){
    for(var i2=-1;i2<=1;i2+=2){
      if(p.er===1){ ell(g,i2*exx,eyy,e*.54,e*.54); fill(g,P.body); ell(g,i2*exx,eyy+e*.06,e*.30,e*.30); fill(g,P.snout); }
      else if(p.er===2){ g.beginPath(); g.moveTo(i2*exx-e*.42,eyy+e*.34); g.quadraticCurveTo(i2*(exx+e*.10),eyy-e*1.02,i2*exx+e*.44,eyy+e*.26); g.closePath(); fill(g,P.body);
        g.beginPath(); g.moveTo(i2*exx-e*.18,eyy+e*.22); g.quadraticCurveTo(i2*(exx+e*.06),eyy-e*.60,i2*exx+e*.20,eyy+e*.16); g.closePath(); fill(g,P.snout); }
      else if(p.er===3){ ell(g,i2*exx*.72,eyy-e*1.05,e*.28,e*1.20,i2*.14); fill(g,P.body);
        ell(g,i2*exx*.72,eyy-e*1.05,e*.14,e*.90,i2*.14); fill(g,P.snout); }
      else if(p.er===4){ g.beginPath(); g.moveTo(i2*exx-e*.48,eyy+e*.26); g.lineTo(i2*(exx+e*.08),eyy-e*.92); g.lineTo(i2*exx+e*.46,eyy+e*.16); g.closePath(); fill(g,P.body); }
      else if(p.er===5){ ell(g,i2*(exx+e*.16),eyy+e*.52,e*.38,e*.62,i2*.6); fill(g,P.bot); }
    }
  }
  if(p.er===3) ears();

  /* rainbow mane, the zoo's signature */
  if(p.mn){ for(var k=0;k<7;k++){ var a2=-2.35+k*.44;
      ell(g,Math.cos(a2)*hrx*.86,headCY+Math.sin(a2)*hry*.92,hrx*.34,hrx*.34); fill(g,RB[(k+p.rot)%7]); } }

  /* head */
  ell(g,0,headCY,hrx,hry); fill(g,vgrad(headCY-hry,headCY+hry,P.top,P.body));
  if(p.er!==3) ears();
  if(p.wool){ for(var w2=0;w2<5;w2++){ var a3=-2.6+w2*.65;
      ell(g,Math.cos(a3)*hrx*.72,headCY-hry*.10+Math.sin(a3)*hry*.62,hrx*.30,hrx*.30); fill(g,'#fffdf8'); } }

  /* snout, beak, mouth */
  var my;
  if(p.mt===1||p.mt===2){ ell(g,0,headCY+hry*.44,p.hr*p.mz*.62,p.hr*p.mz*.44); fill(g,P.snout); }
  if(p.mt===3){ var by=headCY+hry*.24,b=p.hr*p.mz;
    g.beginPath(); g.moveTo(-b*.38,by-b*.24); g.lineTo(b*.38,by-b*.24); g.lineTo(0,by+b*.82); g.closePath(); fill(g,'#ffb057'); }

  /* golden horn */
  if(p.hn){ var hy=headCY-hry*.92, hh=p.hr*1.28;
    var gq=g.createLinearGradient(0,hy-hh,0,hy); gq.addColorStop(0,'#fff3c4'); gq.addColorStop(1,'#f6c34a');
    g.beginPath(); g.moveTo(-p.hr*.22,hy+p.hr*.14); g.quadraticCurveTo(-p.hr*.03,hy-hh*.5,0,hy-hh);
    g.quadraticCurveTo(p.hr*.05,hy-hh*.5,p.hr*.22,hy+p.hr*.14); g.closePath(); fill(g,gq);
    g.strokeStyle='rgba(214,158,44,.55)'; g.lineWidth=p.hr*.045;
    for(var sk=1;sk<4;sk++){ var u=sk/4;
      g.beginPath(); g.moveTo(-p.hr*.22*(1-u),hy+p.hr*.14-hh*u+p.hr*.04); g.lineTo(p.hr*.22*(1-u),hy+p.hr*.14-hh*u-p.hr*.02); g.stroke(); } }

  /* eyes */
  var er2=Math.min(p.hr*.30, hrx*.30), eo=Math.max(hrx*.38, er2*1.20), ey=headCY-hry*.04, j;
  if(p.eyeSt===1) ey=headCY-hry*.62;
  if(p.eyeSt===2){ for(j=-1;j<=1;j+=2){ ell(g,j*eo,ey,er2*1.30,er2*1.30); fill(g,'#fffdf8'); } }
  g.fillStyle=CHEEK;
  ell(g,-eo-er2*.62,ey+er2*.92,er2*.60,er2*.36); g.fill();
  ell(g, eo+er2*.62,ey+er2*.92,er2*.60,er2*.36); g.fill();
  for(j=-1;j<=1;j+=2){
    ell(g,j*eo,ey,er2*.84,er2); fill(g,P.ink);
    g.fillStyle='#ffffff'; ell(g,j*eo-er2*.26,ey-er2*.34,er2*.32,er2*.34); g.fill();
    g.fillStyle='rgba(255,255,255,.65)'; ell(g,j*eo+er2*.28,ey+er2*.30,er2*.15,er2*.16); g.fill();
  }
  my=ey+er2*1.30;
  if(p.mt!==3){
    g.strokeStyle=P.ink; g.lineWidth=p.hr*.055; g.lineCap='round';
    if(p.mouth===0){ g.beginPath(); g.arc(0,my-p.hr*.04,p.hr*.13,.42,Math.PI-.42); g.stroke(); }
    else if(p.mouth===1){ g.beginPath(); g.arc(-p.hr*.07,my,p.hr*.075,0,Math.PI); g.arc(p.hr*.07,my,p.hr*.075,0,Math.PI); g.stroke(); }
    else { ell(g,0,my+p.hr*.03,p.hr*.075,p.hr*.065); fill(g,'#ff9ab6'); }
  }
  g.restore();
}

/* ---- sticker render: iridescent veil, volume, rim, drop shadow ---- */
function renderSprite(mk, p, style, pose, S){
  var L=LOOK[style], base=mk(S,S), bg=base.getContext('2d');
  bg.save(); bg.translate(S/2,S/2); bg.scale(S,S); drawCreature(bg,p,style,pose); bg.restore();

  if(L.volume>0){                                   /* domed: light at the top, shade at the bottom */
    bg.globalCompositeOperation='source-atop';
    var gv=bg.createLinearGradient(0,S*.10,0,S*.92);
    gv.addColorStop(0,'rgba(255,255,255,'+L.volume+')');
    gv.addColorStop(.48,'rgba(255,255,255,0)');
    gv.addColorStop(1,'rgba(108,74,148,'+(L.volume*.62)+')');
    bg.fillStyle=gv; bg.fillRect(0,0,S,S);
    bg.globalCompositeOperation='source-over';
  }

  var sil=mk(S,S), sg=sil.getContext('2d');         /* silhouette used for the rims */
  sg.drawImage(base,0,0); sg.globalCompositeOperation='source-in';
  sg.fillStyle='#fff'; sg.fillRect(0,0,S,S);

  var out=mk(S,S), og=out.getContext('2d'), i, a;
  var R=S*L.edge;
  for(i=0;i<20;i++){ a=i/20*6.2832; og.drawImage(sil,Math.cos(a)*R,Math.sin(a)*R); }
  og.drawImage(sil,0,0);
  og.drawImage(base,0,0);
  return out;
}

/* sticker drop shadow, generated once per template */
function renderShadow(mk, sprite, S, alpha){
  var c=mk(S,S), g=c.getContext('2d');
  g.drawImage(sprite,0,0); g.globalCompositeOperation='source-in';
  g.fillStyle='rgba(84,56,120,'+alpha+')'; g.fillRect(0,0,S,S);
  return c;
}

if(typeof module!=='undefined') module.exports={SPECIES,LOOK,RB,makeCreature,renderSprite,renderShadow,drawCreature,mulberry32,metrics};
