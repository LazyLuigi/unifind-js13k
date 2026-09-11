/* Six boîtes de nuit. L'éclairage lit la musique: pulsation sur le temps,
   changement de régime sur les refrains, balayages calés sur la mesure. */

var RBC=['#ff7a9c','#ffb057','#ffe14d','#7fdc8a','#5fc8f5','#9b8cf5','#e08cf0'];

var LIEUX = [
  { d:'hangar',  nom:'Warehouse',      mus:'techno',    mur:['#150d24','#0b0716'], sol:'#120b1e' },
  { d:'prairie', nom:'Meadow',     mus:'melodic',      mur:['#2c1b4a','#4a2a52'], sol:'#16301f' },
  { d:'caisson', nom:'Subwoofer',     mus:'dubstep',   mur:['#0e1a12','#06100a'], sol:'#0a160f' },
  { d:'plage',   nom:'Beach',       mus:'trance',    mur:['#2a1444','#7a2f52'], sol:'#3a2340' },
  { d:'abri',    nom:'Bunker',        mus:'dnb',       mur:['#1c0f14','#0d0709'], sol:'#170c11' },
  { d:'foret',   nom:'Forest',       mus:'psy',      mur:['#0d1b1e','#08131a'], sol:'#0a1712' },
  { d:'neon',    nom:'Neon',        mus:'synthwave', mur:['#2a1046','#140725'], sol:'#1a0a2e' },
  { d:'toit',    nom:'Rooftop',        mus:'garage',    mur:['#101a3a','#1d1638'], sol:'#141024' },
  { d:'salon',   nom:'Lounge',       mus:'deep',      mur:['#3a1a2e','#1d0f1c'], sol:'#2a1320' }
];
function lieuDe(n){ return LIEUX[(n-1)%LIEUX.length]; }

/* ---------- construction ---------- */
function makeClub(C, mk, lieu, count, seed){
  var r=C.mulberry32(seed>>>0), st='club';
  var W = 2100 + count*1.55, H = W*0.56;
  var w={ L:lieu, d:lieu.d, W:W, H:H, tpl:[], inst:[], count:count };
  var S=96, NT=Math.min(52, 22+Math.floor(count/26));

  function avecOmbre(img){
    var c=mk(S,S), g=c.getContext('2d');
    g.drawImage(C.renderShadow(mk,img,S,.20), S*.035, S*.045);
    g.drawImage(img,0,0); return c;
  }
  function pousse(sp, sd, hue){
    var p=C.makeCreature(sp, sd, st, hue);
    w.tpl.push({ a:avecOmbre(C.renderSprite(mk,p,st,0,S)), b:avecOmbre(C.renderSprite(mk,p,st,1,S)) });
  }
  for(var i=0;i<NT;i++) pousse(2+Math.floor(r()*(C.SPECIES.length-2)), 1000+i*17, Math.floor(r()*360));
  var leurres=Math.max(3, Math.floor(count/90));
  for(var d=0; d<leurres; d++) pousse(1, 5000+d*29, Math.floor(r()*360));
  pousse(0, 700+Math.floor(r()*9000), Math.floor(r()*360));
  var uniTpl=w.tpl.length-1;

  var base=Math.min(1.62, 24/Math.sqrt(count));
  var rows=Math.max(7, Math.min(26, Math.round(Math.sqrt(count)*0.86)));
  var y0=H*0.30, y1=H-40*base, slots=[];
  for(var ry=0; ry<rows; ry++){
    var f=ry/(rows-1);
    var y=y0+(y1-y0)*Math.pow(f,1.10);
    var sc=base*(0.50+0.62*f);
    var per=Math.max(3, Math.round(count/rows*(1.34-0.62*f)));
    for(var k=0;k<per;k++)
      slots.push({ x: 30+(W-60)*((k+(ry%2)*0.5+r()*0.8)/per), y:y+(r()*18-9), s:sc*(0.92+r()*0.16), row:ry });
  }
  var pick=slots.filter(function(s){ return s.row>2 && s.row<rows-2; });
  var uSlot=pick.length?pick[Math.floor(r()*pick.length)]:slots[0];
  slots.forEach(function(s){
    w.inst.push({ x:s.x, y:s.y, s:s.s, t:(s===uSlot)?uniTpl:Math.floor(r()*(w.tpl.length-1)),
      off:Math.floor(r()*4)/4+(r()<.25?.5:0), flip:r()<.5?-1:1, uni:(s===uSlot), tw:(r()*2-1)*.07 });
  });
  triZ(w);
  var perm=w.inst.map(function(o,i){ return i; }), i2, j2, tp2;
  for(i2=perm.length-1;i2>0;i2--){ j2=Math.floor(r()*(i2+1)); tp2=perm[i2]; perm[i2]=perm[j2]; perm[j2]=tp2; }
  w.inst.forEach(function(o,i3){ var q=w.inst[perm[i3]];
    o.xf=o.x; o.yf=o.y; o.sf=o.s; o.x0=q.x; o.y0=q.y; o.s0=q.s;
    var dx=o.xf-o.x0, dy=o.yf-o.y0, L=Math.hypot(dx,dy)||1;   /* courbure proportionnelle au trajet */
    var am=(r()<.5?-1:1)*(.55+r()*.55)*L;
    o.cx=Math.max(40,Math.min(W-40,(o.x0+o.xf)/2-dy/L*am));
    o.cy=Math.max(H*.28,Math.min(H-30,(o.y0+o.yf)/2+dx/L*am*.55));
    o.d=r()*.38;                             /* et chacune part à son propre moment */
  });
  w.uni=w.inst.filter(function(o){ return o.uni; })[0];
  w.S=S; w.base=base;
  return w;
}

/* ---------- décors ---------- */
function ellC(g,x,y,rx,ry,c){ g.fillStyle=c; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,6.2832); g.fill(); }

function drawBack(g, w, t, L){
  var K=w.L, W=w.W, H=w.H, sol=H*0.30, i, x;
  var q=g.createLinearGradient(0,0,0,H);
  q.addColorStop(0,K.mur[0]); q.addColorStop(.42,K.mur[1]); q.addColorStop(1,K.sol);
  g.fillStyle=q; g.fillRect(0,0,W,H);

  if(w.d==='hangar'){                                   /* hangar: poutres et rampe de spots */
    g.fillStyle='rgba(255,255,255,.045)';
    for(i=0;i<9;i++) g.fillRect(i*W/9+W/40, 0, W/64, sol*0.92);
    for(i=0;i<7;i++){ g.fillStyle='rgba(255,255,255,.05)'; g.fillRect(0,i*26,W,7); }
    for(i=0;i<12;i++){                                       /* rampe de projecteurs */
      var on=((L.bar*4+i)%12===Math.floor(L.beat)%12) || L.refrain&&(i%2===Math.floor(L.beat)%2);
      var cx=(i+.5)*W/12;
      g.fillStyle= on ? '#9b8cf5' : 'rgba(255,255,255,.10)';
      g.fillRect(cx-W/60, sol*0.12, W/30, 16);
    }
    g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(0,sol,W,H-sol);
    for(i=0;i<16;i++){ g.fillStyle='rgba(255,255,255,'+(.035-i*.002)+')';
      g.fillRect(0, sol+Math.pow(i/16,1.7)*(H-sol), W, 3); }
  }
  else if(w.d==='salon'){                                 /* salon: lampes et banquettes */
    for(i=0;i<8;i++){ var lx=(i+.5)*W/8, ly=sol*(.22+.10*Math.sin(i*1.7));
      g.strokeStyle='rgba(255,220,180,.20)'; g.lineWidth=2;
      g.beginPath(); g.moveTo(lx,0); g.lineTo(lx,ly); g.stroke();
      var gl=g.createRadialGradient(lx,ly,4,lx,ly,150+L.pulse*50);
      gl.addColorStop(0,'rgba(255,196,120,.55)'); gl.addColorStop(1,'rgba(255,196,120,0)');
      g.fillStyle=gl; g.beginPath(); g.arc(lx,ly,150+L.pulse*50,0,6.2832); g.fill();
      ellC(g,lx,ly,16,12,'#ffd9a0'); }
    for(i=0;i<5;i++){ g.fillStyle='rgba(90,40,60,.55)';
      g.beginPath(); g.roundRect((i+.2)*W/5, sol*0.86, W/7, 46, 22); g.fill(); }
    var m=g.createLinearGradient(0,sol,0,H);
    m.addColorStop(0,'rgba(255,180,120,.10)'); m.addColorStop(1,'rgba(255,150,180,.04)');
    g.fillStyle=m; g.fillRect(0,sol,W,H-sol);
  }
  else if(w.d==='caisson'){                              /* caisson: murs d'enceintes */
    for(var side=0; side<2; side++){
      var bx = side? W-W*0.13 : W*0.02;
      for(var row=0; row<4; row++) for(var col=0; col<2; col++){
        var ex=bx+col*W*0.055, ey=sol*0.16+row*sol*0.20, ew=W*0.05, eh=sol*0.18;
        g.fillStyle='#141c16'; g.beginPath(); g.roundRect(ex,ey,ew,eh,6); g.fill();
        var k=1+L.pulse*.12;
        ellC(g,ex+ew/2,ey+eh*.36,ew*.30*k,ew*.30*k,'#0a0f0b');
        ellC(g,ex+ew/2,ey+eh*.36,ew*.13*k,ew*.13*k,'rgba(127,220,138,'+(.25+L.pulse*.5)+')');
        ellC(g,ex+ew/2,ey+eh*.78,ew*.16,ew*.16,'#0a0f0b');
      }
    }
    var cone=g.createRadialGradient(W/2,sol*.1,20,W/2,H,W*.7);
    cone.addColorStop(0,'rgba(127,220,138,'+(.10+L.pulse*.14)+')'); cone.addColorStop(1,'rgba(127,220,138,0)');
    g.fillStyle=cone; g.fillRect(0,0,W,H);
    for(i=0;i<10;i++){ g.fillStyle='rgba(255,225,77,'+(.05+ (L.refrain?.05:0))+')';
      g.fillRect(0, sol+i*(H-sol)/10, W, 2); }
  }
  else if(w.d==='abri'){                                  /* abri: béton et néons */
    g.fillStyle='rgba(255,255,255,.03)';
    for(i=0;i<10;i++) for(var j2=0;j2<4;j2++) g.fillRect(i*W/10+4, j2*sol/4+4, W/10-8, sol/4-8);
    for(i=0;i<4;i++){ var ny=sol*(.2+i*.2), on2=(Math.floor(L.beat*2)+i)%4<2;
      g.fillStyle=on2?'rgba(255,122,156,.5)':'rgba(255,122,156,.12)';
      g.fillRect(W*.06, ny, W*.88, 5); }
    g.fillStyle='rgba(0,0,0,.4)'; g.fillRect(0,sol,W,H-sol);
    for(i=0;i<8;i++){ g.strokeStyle='rgba(95,200,245,'+(L.refrain?.16:.07)+')'; g.lineWidth=2;
      g.beginPath(); g.moveTo(0,sol+i*(H-sol)/8); g.lineTo(W,sol+i*(H-sol)/8-30); g.stroke(); }
  }
  else if(w.d==='neon'){                            /* néon: grille et soleil */
    for(i=0;i<8;i++){ var rr=W*.30-i*W*.032;
      g.fillStyle=i%2?'#ff7a9c':'#ffb057';
      g.beginPath(); g.arc(W/2,sol,rr,Math.PI,0); g.fill();
      g.fillStyle='rgba(20,7,37,.45)'; g.fillRect(W/2-rr,sol-i*W*.012-W*.004,rr*2,W*.006); }
    g.fillStyle='#1a0a2e'; g.fillRect(0,sol,W,H-sol);
    g.strokeStyle='rgba(224,140,240,.45)'; g.lineWidth=2;
    for(i=1;i<16;i++){ var gy=sol+Math.pow(i/16,2.1)*(H-sol);
      g.beginPath(); g.moveTo(0,gy); g.lineTo(W,gy); g.stroke(); }
    for(i=-14;i<=14;i++){ g.beginPath(); g.moveTo(W/2+i*W*.02, sol); g.lineTo(W/2+i*W*.30, H); g.stroke(); }
    for(i=0;i<6;i++){ var px=(i%2?W*.06:W*.94)+ (i>3?W*.1*(i%2?1:-1):0), ph2=sol*.72;
      g.fillStyle='#140725'; g.fillRect(px-5,ph2,10,sol*.28);
      for(var f2=0;f2<5;f2++){ var a2=-2.6+f2*.75;
        ellC(g,px+Math.cos(a2)*34,ph2+Math.sin(a2)*20,32,9,'#140725'); } }
  }
  else if(w.d==='prairie'){                                  /* prairie au crépuscule */
    for(i=0;i<80;i++){ var hp=(i*2654435761)>>>0;
      ellC(g,hp%W,(hp>>>9)%Math.floor(sol*.9),1.5,1.5,'rgba(255,255,255,'+(.3+.5*Math.sin(t*2+i))+')'); }
    g.fillStyle='rgba(255,190,150,.10)'; g.beginPath(); g.arc(W*.72,sol*.9,W*.13,0,6.2832); g.fill();
    g.fillStyle='#1d3524'; g.beginPath(); g.moveTo(0,sol*.86);
    g.quadraticCurveTo(W*.3,sol*.62,W*.62,sol*.9); g.quadraticCurveTo(W*.85,sol*1.06,W,sol*.8);
    g.lineTo(W,H); g.lineTo(0,H); g.closePath(); g.fill();
    g.fillStyle='#16301f'; g.fillRect(0,sol,W,H-sol);
    for(i=0;i<4;i++){ var py=sol*(.30+i*.14), sag=sol*.10;    /* guirlandes d'ampoules */
      g.strokeStyle='rgba(255,255,255,.16)'; g.lineWidth=2;
      g.beginPath(); g.moveTo(0,py); g.quadraticCurveTo(W/2,py+sag*2,W,py); g.stroke();
      for(var b1=0;b1<24;b1++){ var u1=b1/23, bx1=u1*W, by1=py+sag*2*2*u1*(1-u1);
        ellC(g,bx1,by1,5+L.pulse*2,5+L.pulse*2,'hsla('+((b1*31+L.bar*30)%360)+',90%,'+(64+L.pulse*12)+'%,.85)'); } }
    for(i=0;i<40;i++){ var lf=(i*40503*2654435761)>>>0;      /* lucioles */
      ellC(g,(lf%W+t*22*(i%3+1))%W, sol+((lf>>>7)%Math.floor(H-sol))+Math.sin(t+i)*14, 3,3,
        'rgba(255,240,150,'+(.25+.5*Math.abs(Math.sin(t*1.7+i)))+')'); }
  }
  else if(w.d==='plage'){                                    /* plage au coucher du soleil */
    var gs2=g.createLinearGradient(0,0,0,sol);
    gs2.addColorStop(0,'#2a1444'); gs2.addColorStop(.6,'#a0355e'); gs2.addColorStop(1,'#ff9a5a');
    g.fillStyle=gs2; g.fillRect(0,0,W,sol);
    ellC(g,W*.5,sol*.94,W*.11,W*.11,'#ffd06a');
    g.fillStyle='#1f2f5e'; g.fillRect(0,sol*.96,W,sol*.30);   /* mer */
    for(i=0;i<12;i++){ var wy=sol*.98+i*(sol*.32)/12;
      g.fillStyle='rgba(255,190,120,'+(.30-i*.02)+')';
      g.fillRect(W*.5-W*(.05+i*.012)+Math.sin(t*1.2+i)*10, wy, W*(.10+i*.024), 3); }
    g.fillStyle='#3a2340'; g.fillRect(0,sol*1.26,W,H-sol*1.26);  /* sable */
    for(i=0;i<5;i++){ var tx2=(i%2?W*.08:W*.92)+(i>2?(i%2?1:-1)*W*.14:0);
      g.fillStyle='#150c1c'; g.fillRect(tx2-6,sol*.62,12,sol*.66);
      for(var f3=0;f3<6;f3++){ var a3=-2.7+f3*.62;
        ellC(g,tx2+Math.cos(a3)*46,sol*.62+Math.sin(a3)*26,42,10,'#150c1c'); } }
    for(i=0;i<16;i++){ var lx3=(i+.5)*W/16;                  /* lampions */
      g.strokeStyle='rgba(255,255,255,.14)'; g.lineWidth=2;
      g.beginPath(); g.moveTo(lx3,sol*.34); g.lineTo(lx3,sol*.44); g.stroke();
      ellC(g,lx3,sol*.50,13,16,'hsla('+((i*40+L.bar*24)%360)+',85%,'+(62+L.pulse*14)+'%,.8)'); }
    ellC(g,W*.5,H*.86,50+L.pulse*22,26+L.pulse*10,'rgba(255,150,60,.34)');   /* feu de camp */
  }
  else if(w.d==='foret'){                                    /* forêt de nuit */
    g.fillStyle='#08131a'; g.fillRect(0,0,W,sol*.5);
    for(i=0;i<26;i++){ var fx3=(i*97+ (i*i*13)%80)/1000*W, tw2=W*(.010+((i*7)%5)*.004);
      var gt=g.createLinearGradient(fx3,0,fx3+tw2,0);
      gt.addColorStop(0,'#0a1a16'); gt.addColorStop(.5,'#12291f'); gt.addColorStop(1,'#081410');
      g.fillStyle=gt; g.fillRect(fx3,0,tw2,sol*1.05); }
    for(i=0;i<20;i++) ellC(g,(i*131)%W,sol*(.06+((i*29)%40)/220),W*.05,sol*.10,'rgba(10,26,20,.9)');
    for(i=0;i<5;i++){ var ry3=(i+.4)*W/5;                    /* rais de lune */
      g.fillStyle='rgba(180,230,210,.05)';
      g.beginPath(); g.moveTo(ry3-30,0); g.lineTo(ry3-150,H); g.lineTo(ry3+70,H); g.lineTo(ry3+30,0); g.closePath(); g.fill(); }
    for(i=0;i<14;i++){ var nx3=(i+.5)*W/14, ny3=sol*(.30+.16*Math.sin(i*1.9));  /* lanternes */
      g.strokeStyle='rgba(255,255,255,.12)'; g.lineWidth=2;
      g.beginPath(); g.moveTo(nx3,0); g.lineTo(nx3,ny3); g.stroke();
      var lg3=g.createRadialGradient(nx3,ny3,3,nx3,ny3,90+L.pulse*40);
      lg3.addColorStop(0,'hsla('+((i*44)%360)+',85%,70%,.5)'); lg3.addColorStop(1,'rgba(255,220,160,0)');
      g.fillStyle=lg3; g.beginPath(); g.arc(nx3,ny3,90+L.pulse*40,0,6.2832); g.fill();
      ellC(g,nx3,ny3,11,14,'hsla('+((i*44)%360)+',85%,72%,.92)'); }
    g.fillStyle='#0a1712'; g.fillRect(0,sol,W,H-sol);
    for(i=0;i<8;i++) ellC(g,(i*311+t*30)%W,sol+(H-sol)*(.2+i*.1),W*.16,40,'rgba(160,220,200,.035)');
  }
  else {                                                     /* toit en ville */
    for(i=0;i<90;i++){ var hs=(i*2654435761)>>>0;
      ellC(g,hs%W,(hs>>>9)%Math.floor(sol*.7),1.4,1.4,'rgba(255,255,255,'+(.25+.5*Math.sin(t*1.6+i))+')'); }
    for(i=0;i<22;i++){ var bw3=W*(.03+((i*13)%5)*.012), bx3=(i*W/22), bh3=sol*(.30+((i*7)%6)*.10);
      g.fillStyle='#0d0a1c'; g.fillRect(bx3,sol-bh3,bw3,bh3);
      for(var wi=0;wi<26;wi++){ var wx3=bx3+6+(wi%3)*(bw3/3), wy3=sol-bh3+10+((wi/3)|0)*16;
        if(wy3>sol-8) break;
        var on4=((i*7+wi*3+Math.floor(L.beat*.5))%5)<2;
        g.fillStyle=on4?'rgba(255,220,140,.7)':'rgba(120,140,200,.10)';
        g.fillRect(wx3,wy3,bw3/5,7); } }
    g.fillStyle='#141024'; g.fillRect(0,sol,W,H-sol);
    for(i=0;i<3;i++){ var py2=sol*(.16+i*.10);
      g.strokeStyle='rgba(255,255,255,.14)'; g.lineWidth=2;
      g.beginPath(); g.moveTo(0,py2); g.quadraticCurveTo(W/2,py2+sol*.16,W,py2); g.stroke();
      for(var b2=0;b2<28;b2++){ var u2=b2/27, bx2=u2*W, by2=py2+sol*.32*u2*(1-u2);
        ellC(g,bx2,by2,4.5+L.pulse*2,4.5+L.pulse*2,'hsla('+((b2*27+L.bar*36)%360)+',90%,'+(64+L.pulse*10)+'%,.8)'); } }
  }

  /* piste de danse: pavés qui s'allument sur le temps */
  if(w.d==='prairie'||w.d==='plage'||w.d==='foret') return;
  var cols=14, rws=8, cw=W/cols, chh=(H-sol)/rws;
  for(i=0;i<cols;i++) for(var j=0;j<rws;j++){
    var on3=((i+j*3+Math.floor(L.beat))%7)===0;
    if(!on3) continue;
    g.fillStyle='hsla('+((i*29+j*17+L.bar*40)%360)+',85%,62%,'+(.04+L.pulse*.07)+')';
    g.fillRect(i*cw, sol+j*chh, cw-2, chh-2);
  }
}

/* gros volumes lumineux: derrière la foule, sinon ils lavent les créatures */
function drawBeams(g, w, t, L){
  var K=w.L, W=w.W, H=w.H, sol=H*0.30, i;
  g.globalCompositeOperation='lighter';

  var nb = L.refrain?8:5, amp = L.refrain?.11:.065;
  for(i=0;i<nb;i++){
    var a=i/nb*6.2832 + t*(w.d==='abri'?.9:.32) + Math.sin(L.beat*.5+i)*.16;
    var bx=W/2+Math.cos(a)*W*.62, hue=(i*47+L.bar*26+t*22)%360;
    g.fillStyle='hsla('+hue+',95%,62%,'+(amp*(.6+L.pulse*.7))+')';
    g.beginPath(); g.moveTo(W/2-30,sol*.14); g.lineTo(bx-W*.10,H); g.lineTo(bx+W*.10,H); g.lineTo(W/2+30,sol*.14); g.closePath(); g.fill();
  }
  if(w.d==='toit'){                                     /* colonnes montantes */
    for(i=0;i<10;i++){ var cx2=(i+.5)*W/10, hgt=(H-sol)*(.3+.7*Math.abs(Math.sin(L.beat*.5+i)));
      var cg=g.createLinearGradient(0,H,0,H-hgt);
      cg.addColorStop(0,'hsla('+((i*36+t*30)%360)+',95%,66%,.22)'); cg.addColorStop(1,'hsla('+((i*36+t*30)%360)+',95%,66%,0)');
      g.fillStyle=cg; g.fillRect(cx2-W*.022, H-hgt, W*.044, hgt); }
  }
  if(w.d==='salon'){                                      /* boule à facettes */
    var bx2=W/2, by2=sol*.30, R=W*.022*(1+L.pulse*.10);
    for(i=0;i<28;i++){ var fa=i/28*6.2832+t*.35;
      g.fillStyle='hsla('+((i*31+t*40)%360)+',80%,'+(48+22*Math.sin(fa*3))+'%,.85)';
      g.beginPath(); g.arc(bx2,by2,R,fa,fa+.22); g.lineTo(bx2,by2); g.fill(); }
    for(i=0;i<26;i++){ var da=i/26*6.2832+t*.35, dd=W*(.10+.28*((i*7)%5)/5);
      ellC(g,bx2+Math.cos(da)*dd, by2+Math.abs(Math.sin(da))*dd*.7+sol*.2, 9,9,'hsla('+((i*40)%360)+',90%,70%,.30)'); }
  }
  g.globalCompositeOperation='source-over';
}

/* devant la foule: juste ce qui doit passer par-dessus */
function drawFront(g, w, t, L){
  var W=w.W, H=w.H, sol=H*0.30, i;
  g.globalCompositeOperation='lighter';
  if(w.d==='abri'||w.d==='hangar'){
    for(i=0;i<6;i++){ var la=t*1.5+i*1.05, y1=sol*.2+Math.sin(la)*sol*.18;
      g.strokeStyle='hsla('+((i*60+L.bar*40)%360)+',95%,70%,'+(L.refrain?.20:.09)+')'; g.lineWidth=2.5;
      g.beginPath(); g.moveTo(0,y1); g.lineTo(W,H*(0.5+0.4*Math.sin(la*1.3))); g.stroke(); }
  }
  g.globalCompositeOperation='source-over';
  if(L.flash>0){ g.fillStyle='rgba(255,255,255,'+(L.flash*.26)+')'; g.fillRect(0,0,W,H); }
}

/* profondeur: on trie sur les pieds, pas sur l'ancre, sinon deux créatures
   de tailles différentes au même y sortent dans le mauvais ordre */
function triZ(w){
  var S=w.S, i;
  for(i=0;i<w.inst.length;i++){ var o=w.inst[i]; o.by=o.y+S*o.s*.12; }
  w.inst.sort(function(a,b){ return a.by-b.by; });
}

/* interpolation entre la position mélangée et la position finale */
function pieds(a,b){ return (a.y+a.s*11)-(b.y+b.s*11); }   /* le bas du sprite tombe a 11.5% sous l'ancre */
function place(w,e){
  for(var i=0;i<w.inst.length;i++){ var o=w.inst[i];
    var u=Math.max(0,Math.min(1,(e-o.d)/(1-o.d)));
    var k=u<.5?2*u*u:1-(-2*u+2)*(-2*u+2)/2, m=1-k;
    o.x=m*m*o.x0+2*m*k*o.cx+k*k*o.xf;
    o.y=m*m*o.y0+2*m*k*o.cy+k*k*o.yf;
    o.s=o.s0+(o.sf-o.s0)*k;
  }
  w.inst.sort(pieds);
}

/* ---------- foule ---------- */
function drawCrowd(g, w, ph, hint, vue){
  var S=w.S, n=0, tour=(w.count<=520);
  for(var i=0;i<w.inst.length;i++){
    var o=w.inst[i], sc=o.s, sz=S*sc;
    if(vue && (o.x+sz < vue.x0 || o.x-sz > vue.x1 || o.y+sz*.2 < vue.y0 || o.y-sz > vue.y1)) continue;
    var p=ph+o.off;
    var bounce=Math.abs(Math.sin(Math.PI*p));
    var pose=(Math.floor(p)%2+2)%2;
    var tp=w.tpl[o.t], img=pose?tp.b:tp.a;
    var y=o.y-bounce*sz*.09;
    if(tour){
      g.save();
      g.translate(o.x,y); g.rotate(Math.sin(Math.PI*p)*.06+o.tw);
      g.scale(o.flip*sc, sc*(1+.06*Math.cos(Math.PI*2*p)));
      if(hint&&o.uni){ g.shadowColor='#fff'; g.shadowBlur=50; }
      g.drawImage(img,-S/2,-S*.86,S,S);
      g.restore();
    } else {
      if(hint&&o.uni){ g.save(); g.shadowColor='#fff'; g.shadowBlur=50;
        g.drawImage(img,o.x-sz/2,y-sz*.86,sz,sz); g.restore(); }
      else g.drawImage(img, o.x-sz/2, y-sz*.86, sz, sz);
    }
    n++;
  }
  return n;
}

if(typeof module!=='undefined') module.exports={ LIEUX, lieuDe, makeClub, place, pieds, drawBack, drawBeams, drawFront, drawCrowd };
