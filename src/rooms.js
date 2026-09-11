/* Nine nightclubs. The lighting reads the music: pulse on the beat,
   a mode change on the choruses, sweeps locked to the bar. */

var RBC=['#ff7a9c','#ffb057','#ffe14d','#7fdc8a','#5fc8f5','#9b8cf5','#e08cf0'];

var ROOMS = [
  { d:'hangar',  name:'Warehouse',      mus:'techno',    bg:['#150d24','#0b0716'], flr:'#120b1e' },
  { d:'meadow',  name:'Meadow',     mus:'melodic',      bg:['#2c1b4a','#4a2a52'], flr:'#16301f' },
  { d:'sub',     name:'Subwoofer',     mus:'dubstep',   bg:['#0e1a12','#06100a'], flr:'#0a160f' },
  { d:'beach',   name:'Beach',       mus:'trance',    bg:['#2a1444','#7a2f52'], flr:'#3a2340' },
  { d:'bunk',    name:'Bunker',        mus:'dnb',       bg:['#1c0f14','#0d0709'], flr:'#170c11' },
  { d:'woods',   name:'Forest',       mus:'psy',      bg:['#0d1b1e','#08131a'], flr:'#0a1712' },
  { d:'neon',    name:'Neon',        mus:'synthwave', bg:['#2a1046','#140725'], flr:'#1a0a2e' },
  { d:'roof',    name:'Rooftop',        mus:'garage',    bg:['#101a3a','#1d1638'], flr:'#141024' },
  { d:'bar',     name:'Lounge',       mus:'deep',      bg:['#3a1a2e','#1d0f1c'], flr:'#2a1320' }
];
function roomAt(n){ return ROOMS[(n-1)%ROOMS.length]; }

/* ---------- build ---------- */
function makeClub(C, mk, room, count, seed){
  var r=C.mulberry32(seed>>>0), st='club';
  var W = 2100 + count*1.55, H = W*0.56;
  var w={ L:room, d:room.d, W:W, H:H, tpl:[], inst:[], count:count };
  var S=96, NT=Math.min(52, 22+Math.floor(count/26));

  function withShadow(img){
    var c=mk(S,S), g=c.getContext('2d');
    g.drawImage(C.renderShadow(mk,img,S,.20), S*.035, S*.045);
    g.drawImage(img,0,0); return c;
  }
  function addTpl(sp, sd, hue){
    var p=C.makeCreature(sp, sd, st, hue);
    w.tpl.push({ a:withShadow(C.renderSprite(mk,p,st,0,S)), b:withShadow(C.renderSprite(mk,p,st,1,S)) });
  }
  for(var i=0;i<NT;i++) addTpl(2+Math.floor(r()*(C.SPECIES.length-2)), 1000+i*17, Math.floor(r()*360));
  var decoys=Math.max(3, Math.floor(count/90));
  for(var d=0; d<decoys; d++) addTpl(1, 5000+d*29, Math.floor(r()*360));
  addTpl(0, 700+Math.floor(r()*9000), Math.floor(r()*360));
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
  sortZ(w);
  var perm=w.inst.map(function(o,i){ return i; }), i2, j2, tp2;
  for(i2=perm.length-1;i2>0;i2--){ j2=Math.floor(r()*(i2+1)); tp2=perm[i2]; perm[i2]=perm[j2]; perm[j2]=tp2; }
  w.inst.forEach(function(o,i3){ var q=w.inst[perm[i3]];
    o.xf=o.x; o.yf=o.y; o.sf=o.s; o.x0=q.x; o.y0=q.y; o.s0=q.s;
    var dx=o.xf-o.x0, dy=o.yf-o.y0, L=Math.hypot(dx,dy)||1;   /* curvature proportional to the path length */
    var am=(r()<.5?-1:1)*(.55+r()*.55)*L;
    o.cx=Math.max(40,Math.min(W-40,(o.x0+o.xf)/2-dy/L*am));
    o.cy=Math.max(H*.28,Math.min(H-30,(o.y0+o.yf)/2+dx/L*am*.55));
    o.d=r()*.38;                             /* and each one sets off at its own moment */
  });
  w.uni=w.inst.filter(function(o){ return o.uni; })[0];
  w.S=S; w.base=base;
  return w;
}

/* ---------- scenery ---------- */
function ellC(g,x,y,rx,ry,c){ g.fillStyle=c; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,6.2832); g.fill(); }

function drawBack(g, w, t, L){
  var K=w.L, W=w.W, H=w.H, floorY=H*0.30, i, x;
  var q=g.createLinearGradient(0,0,0,H);
  q.addColorStop(0,K.bg[0]); q.addColorStop(.42,K.bg[1]); q.addColorStop(1,K.flr);
  g.fillStyle=q; g.fillRect(0,0,W,H);

  if(w.d==='hangar'){                                   /* hangar: roof beams and a rail of spots */
    g.fillStyle='rgba(255,255,255,.045)';
    for(i=0;i<9;i++) g.fillRect(i*W/9+W/40, 0, W/64, floorY*0.92);
    for(i=0;i<7;i++){ g.fillStyle='rgba(255,255,255,.05)'; g.fillRect(0,i*26,W,7); }
    for(i=0;i<12;i++){                                       /* rail of spotlights */
      var on=((L.bar*4+i)%12===Math.floor(L.beat)%12) || L.chorus&&(i%2===Math.floor(L.beat)%2);
      var cx=(i+.5)*W/12;
      g.fillStyle= on ? '#9b8cf5' : 'rgba(255,255,255,.10)';
      g.fillRect(cx-W/60, floorY*0.12, W/30, 16);
    }
    g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(0,floorY,W,H-floorY);
    for(i=0;i<16;i++){ g.fillStyle='rgba(255,255,255,'+(.035-i*.002)+')';
      g.fillRect(0, floorY+Math.pow(i/16,1.7)*(H-floorY), W, 3); }
  }
  else if(w.d==='bar'){                                 /* bar: lamps and booths */
    for(i=0;i<8;i++){ var lx=(i+.5)*W/8, ly=floorY*(.22+.10*Math.sin(i*1.7));
      g.strokeStyle='rgba(255,220,180,.20)'; g.lineWidth=2;
      g.beginPath(); g.moveTo(lx,0); g.lineTo(lx,ly); g.stroke();
      var gl=g.createRadialGradient(lx,ly,4,lx,ly,150+L.pulse*50);
      gl.addColorStop(0,'rgba(255,196,120,.55)'); gl.addColorStop(1,'rgba(255,196,120,0)');
      g.fillStyle=gl; g.beginPath(); g.arc(lx,ly,150+L.pulse*50,0,6.2832); g.fill();
      ellC(g,lx,ly,16,12,'#ffd9a0'); }
    for(i=0;i<5;i++){ g.fillStyle='rgba(90,40,60,.55)';
      g.beginPath(); g.roundRect((i+.2)*W/5, floorY*0.86, W/7, 46, 22); g.fill(); }
    var m=g.createLinearGradient(0,floorY,0,H);
    m.addColorStop(0,'rgba(255,180,120,.10)'); m.addColorStop(1,'rgba(255,150,180,.04)');
    g.fillStyle=m; g.fillRect(0,floorY,W,H-floorY);
  }
  else if(w.d==='sub'){                              /* sub: walls of speaker cabs */
    for(var side=0; side<2; side++){
      var bx = side? W-W*0.13 : W*0.02;
      for(var row=0; row<4; row++) for(var col=0; col<2; col++){
        var ex=bx+col*W*0.055, ey=floorY*0.16+row*floorY*0.20, ew=W*0.05, eh=floorY*0.18;
        g.fillStyle='#141c16'; g.beginPath(); g.roundRect(ex,ey,ew,eh,6); g.fill();
        var k=1+L.pulse*.12;
        ellC(g,ex+ew/2,ey+eh*.36,ew*.30*k,ew*.30*k,'#0a0f0b');
        ellC(g,ex+ew/2,ey+eh*.36,ew*.13*k,ew*.13*k,'rgba(127,220,138,'+(.25+L.pulse*.5)+')');
        ellC(g,ex+ew/2,ey+eh*.78,ew*.16,ew*.16,'#0a0f0b');
      }
    }
    var cone=g.createRadialGradient(W/2,floorY*.1,20,W/2,H,W*.7);
    cone.addColorStop(0,'rgba(127,220,138,'+(.10+L.pulse*.14)+')'); cone.addColorStop(1,'rgba(127,220,138,0)');
    g.fillStyle=cone; g.fillRect(0,0,W,H);
    for(i=0;i<10;i++){ g.fillStyle='rgba(255,225,77,'+(.05+ (L.chorus?.05:0))+')';
      g.fillRect(0, floorY+i*(H-floorY)/10, W, 2); }
  }
  else if(w.d==='bunk'){                                  /* bunk: concrete and neon tubes */
    g.fillStyle='rgba(255,255,255,.03)';
    for(i=0;i<10;i++) for(var j2=0;j2<4;j2++) g.fillRect(i*W/10+4, j2*floorY/4+4, W/10-8, floorY/4-8);
    for(i=0;i<4;i++){ var ny=floorY*(.2+i*.2), on2=(Math.floor(L.beat*2)+i)%4<2;
      g.fillStyle=on2?'rgba(255,122,156,.5)':'rgba(255,122,156,.12)';
      g.fillRect(W*.06, ny, W*.88, 5); }
    g.fillStyle='rgba(0,0,0,.4)'; g.fillRect(0,floorY,W,H-floorY);
    for(i=0;i<8;i++){ g.strokeStyle='rgba(95,200,245,'+(L.chorus?.16:.07)+')'; g.lineWidth=2;
      g.beginPath(); g.moveTo(0,floorY+i*(H-floorY)/8); g.lineTo(W,floorY+i*(H-floorY)/8-30); g.stroke(); }
  }
  else if(w.d==='neon'){                            /* neon: grid and sun */
    for(i=0;i<8;i++){ var rr=W*.30-i*W*.032;
      g.fillStyle=i%2?'#ff7a9c':'#ffb057';
      g.beginPath(); g.arc(W/2,floorY,rr,Math.PI,0); g.fill();
      g.fillStyle='rgba(20,7,37,.45)'; g.fillRect(W/2-rr,floorY-i*W*.012-W*.004,rr*2,W*.006); }
    g.fillStyle='#1a0a2e'; g.fillRect(0,floorY,W,H-floorY);
    g.strokeStyle='rgba(224,140,240,.45)'; g.lineWidth=2;
    for(i=1;i<16;i++){ var gy=floorY+Math.pow(i/16,2.1)*(H-floorY);
      g.beginPath(); g.moveTo(0,gy); g.lineTo(W,gy); g.stroke(); }
    for(i=-14;i<=14;i++){ g.beginPath(); g.moveTo(W/2+i*W*.02, floorY); g.lineTo(W/2+i*W*.30, H); g.stroke(); }
    for(i=0;i<6;i++){ var px=(i%2?W*.06:W*.94)+ (i>3?W*.1*(i%2?1:-1):0), ph2=floorY*.72;
      g.fillStyle='#140725'; g.fillRect(px-5,ph2,10,floorY*.28);
      for(var f2=0;f2<5;f2++){ var a2=-2.6+f2*.75;
        ellC(g,px+Math.cos(a2)*34,ph2+Math.sin(a2)*20,32,9,'#140725'); } }
  }
  else if(w.d==='meadow'){                                  /* meadow at dusk */
    for(i=0;i<80;i++){ var hp=(i*2654435761)>>>0;
      ellC(g,hp%W,(hp>>>9)%Math.floor(floorY*.9),1.5,1.5,'rgba(255,255,255,'+(.3+.5*Math.sin(t*2+i))+')'); }
    g.fillStyle='rgba(255,190,150,.10)'; g.beginPath(); g.arc(W*.72,floorY*.9,W*.13,0,6.2832); g.fill();
    g.fillStyle='#1d3524'; g.beginPath(); g.moveTo(0,floorY*.86);
    g.quadraticCurveTo(W*.3,floorY*.62,W*.62,floorY*.9); g.quadraticCurveTo(W*.85,floorY*1.06,W,floorY*.8);
    g.lineTo(W,H); g.lineTo(0,H); g.closePath(); g.fill();
    g.fillStyle='#16301f'; g.fillRect(0,floorY,W,H-floorY);
    for(i=0;i<4;i++){ var py=floorY*(.30+i*.14), sag=floorY*.10;    /* string lights */
      g.strokeStyle='rgba(255,255,255,.16)'; g.lineWidth=2;
      g.beginPath(); g.moveTo(0,py); g.quadraticCurveTo(W/2,py+sag*2,W,py); g.stroke();
      for(var b1=0;b1<24;b1++){ var u1=b1/23, bx1=u1*W, by1=py+sag*2*2*u1*(1-u1);
        ellC(g,bx1,by1,5+L.pulse*2,5+L.pulse*2,'hsla('+((b1*31+L.bar*30)%360)+',90%,'+(64+L.pulse*12)+'%,.85)'); } }
    for(i=0;i<40;i++){ var lf=(i*40503*2654435761)>>>0;      /* fireflies */
      ellC(g,(lf%W+t*22*(i%3+1))%W, floorY+((lf>>>7)%Math.floor(H-floorY))+Math.sin(t+i)*14, 3,3,
        'rgba(255,240,150,'+(.25+.5*Math.abs(Math.sin(t*1.7+i)))+')'); }
  }
  else if(w.d==='beach'){                                    /* beach at sunset */
    var gs2=g.createLinearGradient(0,0,0,floorY);
    gs2.addColorStop(0,'#2a1444'); gs2.addColorStop(.6,'#a0355e'); gs2.addColorStop(1,'#ff9a5a');
    g.fillStyle=gs2; g.fillRect(0,0,W,floorY);
    ellC(g,W*.5,floorY*.94,W*.11,W*.11,'#ffd06a');
    g.fillStyle='#1f2f5e'; g.fillRect(0,floorY*.96,W,floorY*.30);   /* sea */
    for(i=0;i<12;i++){ var wy=floorY*.98+i*(floorY*.32)/12;
      g.fillStyle='rgba(255,190,120,'+(.30-i*.02)+')';
      g.fillRect(W*.5-W*(.05+i*.012)+Math.sin(t*1.2+i)*10, wy, W*(.10+i*.024), 3); }
    g.fillStyle='#3a2340'; g.fillRect(0,floorY*1.26,W,H-floorY*1.26);  /* sand */
    for(i=0;i<5;i++){ var tx2=(i%2?W*.08:W*.92)+(i>2?(i%2?1:-1)*W*.14:0);
      g.fillStyle='#150c1c'; g.fillRect(tx2-6,floorY*.62,12,floorY*.66);
      for(var f3=0;f3<6;f3++){ var a3=-2.7+f3*.62;
        ellC(g,tx2+Math.cos(a3)*46,floorY*.62+Math.sin(a3)*26,42,10,'#150c1c'); } }
    for(i=0;i<16;i++){ var lx3=(i+.5)*W/16;                  /* paper lanterns */
      g.strokeStyle='rgba(255,255,255,.14)'; g.lineWidth=2;
      g.beginPath(); g.moveTo(lx3,floorY*.34); g.lineTo(lx3,floorY*.44); g.stroke();
      ellC(g,lx3,floorY*.50,13,16,'hsla('+((i*40+L.bar*24)%360)+',85%,'+(62+L.pulse*14)+'%,.8)'); }
    ellC(g,W*.5,H*.86,50+L.pulse*22,26+L.pulse*10,'rgba(255,150,60,.34)');   /* campfire */
  }
  else if(w.d==='woods'){                                    /* woods at night */
    g.fillStyle='#08131a'; g.fillRect(0,0,W,floorY*.5);
    for(i=0;i<26;i++){ var fx3=(i*97+ (i*i*13)%80)/1000*W, tw2=W*(.010+((i*7)%5)*.004);
      var gt=g.createLinearGradient(fx3,0,fx3+tw2,0);
      gt.addColorStop(0,'#0a1a16'); gt.addColorStop(.5,'#12291f'); gt.addColorStop(1,'#081410');
      g.fillStyle=gt; g.fillRect(fx3,0,tw2,floorY*1.05); }
    for(i=0;i<20;i++) ellC(g,(i*131)%W,floorY*(.06+((i*29)%40)/220),W*.05,floorY*.10,'rgba(10,26,20,.9)');
    for(i=0;i<5;i++){ var ry3=(i+.4)*W/5;                    /* moonbeams */
      g.fillStyle='rgba(180,230,210,.05)';
      g.beginPath(); g.moveTo(ry3-30,0); g.lineTo(ry3-150,H); g.lineTo(ry3+70,H); g.lineTo(ry3+30,0); g.closePath(); g.fill(); }
    for(i=0;i<14;i++){ var nx3=(i+.5)*W/14, ny3=floorY*(.30+.16*Math.sin(i*1.9));  /* lanterns */
      g.strokeStyle='rgba(255,255,255,.12)'; g.lineWidth=2;
      g.beginPath(); g.moveTo(nx3,0); g.lineTo(nx3,ny3); g.stroke();
      var lg3=g.createRadialGradient(nx3,ny3,3,nx3,ny3,90+L.pulse*40);
      lg3.addColorStop(0,'hsla('+((i*44)%360)+',85%,70%,.5)'); lg3.addColorStop(1,'rgba(255,220,160,0)');
      g.fillStyle=lg3; g.beginPath(); g.arc(nx3,ny3,90+L.pulse*40,0,6.2832); g.fill();
      ellC(g,nx3,ny3,11,14,'hsla('+((i*44)%360)+',85%,72%,.92)'); }
    g.fillStyle='#0a1712'; g.fillRect(0,floorY,W,H-floorY);
    for(i=0;i<8;i++) ellC(g,(i*311+t*30)%W,floorY+(H-floorY)*(.2+i*.1),W*.16,40,'rgba(160,220,200,.035)');
  }
  else {                                                     /* city rooftop */
    for(i=0;i<90;i++){ var hs=(i*2654435761)>>>0;
      ellC(g,hs%W,(hs>>>9)%Math.floor(floorY*.7),1.4,1.4,'rgba(255,255,255,'+(.25+.5*Math.sin(t*1.6+i))+')'); }
    for(i=0;i<22;i++){ var bw3=W*(.03+((i*13)%5)*.012), bx3=(i*W/22), bh3=floorY*(.30+((i*7)%6)*.10);
      g.fillStyle='#0d0a1c'; g.fillRect(bx3,floorY-bh3,bw3,bh3);
      for(var wi=0;wi<26;wi++){ var wx3=bx3+6+(wi%3)*(bw3/3), wy3=floorY-bh3+10+((wi/3)|0)*16;
        if(wy3>floorY-8) break;
        var on4=((i*7+wi*3+Math.floor(L.beat*.5))%5)<2;
        g.fillStyle=on4?'rgba(255,220,140,.7)':'rgba(120,140,200,.10)';
        g.fillRect(wx3,wy3,bw3/5,7); } }
    g.fillStyle='#141024'; g.fillRect(0,floorY,W,H-floorY);
    for(i=0;i<3;i++){ var py2=floorY*(.16+i*.10);
      g.strokeStyle='rgba(255,255,255,.14)'; g.lineWidth=2;
      g.beginPath(); g.moveTo(0,py2); g.quadraticCurveTo(W/2,py2+floorY*.16,W,py2); g.stroke();
      for(var b2=0;b2<28;b2++){ var u2=b2/27, bx2=u2*W, by2=py2+floorY*.32*u2*(1-u2);
        ellC(g,bx2,by2,4.5+L.pulse*2,4.5+L.pulse*2,'hsla('+((b2*27+L.bar*36)%360)+',90%,'+(64+L.pulse*10)+'%,.8)'); } }
  }

  /* dance floor: tiles that light up on the beat */
  if(w.d==='meadow'||w.d==='beach'||w.d==='woods') return;
  var cols=14, rws=8, cw=W/cols, chh=(H-floorY)/rws;
  for(i=0;i<cols;i++) for(var j=0;j<rws;j++){
    var on3=((i+j*3+Math.floor(L.beat))%7)===0;
    if(!on3) continue;
    g.fillStyle='hsla('+((i*29+j*17+L.bar*40)%360)+',85%,62%,'+(.04+L.pulse*.07)+')';
    g.fillRect(i*cw, floorY+j*chh, cw-2, chh-2);
  }
}

/* big light volumes: behind the crowd, or they wash the creatures out */
function drawBeams(g, w, t, L){
  var K=w.L, W=w.W, H=w.H, floorY=H*0.30, i;
  g.globalCompositeOperation='lighter';

  var nBeams = L.chorus?8:5, amp = L.chorus?.11:.065;
  for(i=0;i<nBeams;i++){
    var a=i/nBeams*6.2832 + t*(w.d==='bunk'?.9:.32) + Math.sin(L.beat*.5+i)*.16;
    var bx=W/2+Math.cos(a)*W*.62, hue=(i*47+L.bar*26+t*22)%360;
    g.fillStyle='hsla('+hue+',95%,62%,'+(amp*(.6+L.pulse*.7))+')';
    g.beginPath(); g.moveTo(W/2-30,floorY*.14); g.lineTo(bx-W*.10,H); g.lineTo(bx+W*.10,H); g.lineTo(W/2+30,floorY*.14); g.closePath(); g.fill();
  }
  if(w.d==='roof'){                                     /* rising columns */
    for(i=0;i<10;i++){ var cx2=(i+.5)*W/10, hgt=(H-floorY)*(.3+.7*Math.abs(Math.sin(L.beat*.5+i)));
      var cg=g.createLinearGradient(0,H,0,H-hgt);
      cg.addColorStop(0,'hsla('+((i*36+t*30)%360)+',95%,66%,.22)'); cg.addColorStop(1,'hsla('+((i*36+t*30)%360)+',95%,66%,0)');
      g.fillStyle=cg; g.fillRect(cx2-W*.022, H-hgt, W*.044, hgt); }
  }
  if(w.d==='bar'){                                      /* mirror ball */
    var bx2=W/2, by2=floorY*.30, R=W*.022*(1+L.pulse*.10);
    for(i=0;i<28;i++){ var fa=i/28*6.2832+t*.35;
      g.fillStyle='hsla('+((i*31+t*40)%360)+',80%,'+(48+22*Math.sin(fa*3))+'%,.85)';
      g.beginPath(); g.arc(bx2,by2,R,fa,fa+.22); g.lineTo(bx2,by2); g.fill(); }
    for(i=0;i<26;i++){ var da=i/26*6.2832+t*.35, dd=W*(.10+.28*((i*7)%5)/5);
      ellC(g,bx2+Math.cos(da)*dd, by2+Math.abs(Math.sin(da))*dd*.7+floorY*.2, 9,9,'hsla('+((i*40)%360)+',90%,70%,.30)'); }
  }
  g.globalCompositeOperation='source-over';
}

/* in front of the crowd: only what has to pass over it */
function drawFront(g, w, t, L){
  var W=w.W, H=w.H, floorY=H*0.30, i;
  g.globalCompositeOperation='lighter';
  if(w.d==='bunk'||w.d==='hangar'){
    for(i=0;i<6;i++){ var la=t*1.5+i*1.05, y1=floorY*.2+Math.sin(la)*floorY*.18;
      g.strokeStyle='hsla('+((i*60+L.bar*40)%360)+',95%,70%,'+(L.chorus?.20:.09)+')'; g.lineWidth=2.5;
      g.beginPath(); g.moveTo(0,y1); g.lineTo(W,H*(0.5+0.4*Math.sin(la*1.3))); g.stroke(); }
  }
  g.globalCompositeOperation='source-over';
  if(L.flash>0){ g.fillStyle='rgba(255,255,255,'+(L.flash*.26)+')'; g.fillRect(0,0,W,H); }
}

/* depth: sort on the feet, not on the anchor, or two creatures of
   different sizes at the same y come out in the wrong order */
function sortZ(w){
  var S=w.S, i;
  for(i=0;i<w.inst.length;i++){ var o=w.inst[i]; o.by=o.y+S*o.s*.12; }
  w.inst.sort(function(a,b){ return a.by-b.by; });
}

/* interpolation between the shuffled position and the final one */
function feet(a,b){ return (a.y+a.s*11)-(b.y+b.s*11); }   /* the bottom of the sprite sits 11.5% below the anchor */
function place(w,e){
  for(var i=0;i<w.inst.length;i++){ var o=w.inst[i];
    var u=Math.max(0,Math.min(1,(e-o.d)/(1-o.d)));
    var k=u<.5?2*u*u:1-(-2*u+2)*(-2*u+2)/2, m=1-k;
    o.x=m*m*o.x0+2*m*k*o.cx+k*k*o.xf;
    o.y=m*m*o.y0+2*m*k*o.cy+k*k*o.yf;
    o.s=o.s0+(o.sf-o.s0)*k;
  }
  w.inst.sort(feet);
}

/* ---------- crowd ---------- */
function drawCrowd(g, w, ph, hint, clip){
  var S=w.S, n=0, spin=(w.count<=520);
  for(var i=0;i<w.inst.length;i++){
    var o=w.inst[i], sc=o.s, sz=S*sc;
    if(clip && (o.x+sz < clip.x0 || o.x-sz > clip.x1 || o.y+sz*.2 < clip.y0 || o.y-sz > clip.y1)) continue;
    var p=ph+o.off;
    var bounce=Math.abs(Math.sin(Math.PI*p));
    var pose=(Math.floor(p)%2+2)%2;
    var tp=w.tpl[o.t], img=pose?tp.b:tp.a;
    var y=o.y-bounce*sz*.09;
    if(spin){
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

if(typeof module!=='undefined') module.exports={ ROOMS, roomAt, makeClub, place, feet, drawBack, drawBeams, drawFront, drawCrowd };
