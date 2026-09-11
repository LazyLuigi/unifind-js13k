/* Unifind. Tout est dessiné dans le canevas: aucun élément d'interface en HTML. */

var cv=document.getElementById('c'), X=cv.getContext('2d');
var mk=function(w,h){ var c=document.createElement('canvas'); c.width=w; c.height=h; return c; };
var CRE={ SPECIES:SPECIES, LOOK:LOOK, makeCreature:makeCreature, renderSprite:renderSprite,
          renderShadow:renderShadow, mulberry32:mulberry32 };
var F='"Comic Sans MS","Chalkboard SE","Marker Felt",system-ui,sans-serif';
var M=new Moteur(), T_MIX=3.0;
var ST={ niv:1, lieu:LIEUX[0], genre:'techno', count:200, seed:(Math.random()*1e9)|0,
         t0:0, fini:0, err:0, bad:0, w:null, ph:'titre', pt:0, gagne:0, lim:60, cz:1,
         pts:0, suite:0 };
var view={x:0,y:0,z:1,zf:1}, CW=0, CH=0, DPR=1, dernRef=0, flash=0, mark=0, pops=[];

function build(){
  ST.lieu=lieuDe(ST.niv); ST.genre=ST.lieu.mus;
  ST.count=Math.min(1000, 100+ST.niv*100);
  ST.w=makeClub(CRE, mk, ST.lieu, ST.count, ST.seed);
  ST.t0=performance.now(); ST.fini=0; ST.err=0; ST.gagne=0; pops=[]; mark=0;
  ST.ph='show'; ST.pt=0;
  ST.lim=32*4*60/GENRES[ST.genre].bpm;
  M.setGenre(ST.genre);
  place(ST.w,0);
  fit();
  var u=ST.w.uni; ST.cz=Math.max(view.zf*1.8, Math.min(view.zf*5, CH/(ST.w.S*u.s*4.2)));
}
function fit(){
  var w=ST.w;
  view.zf=Math.min(CW/w.W, CH/w.H);
  view.z=view.zf; view.x=(CW-w.W*view.z)/2; view.y=(CH-w.H*view.z)/2;
}
function resize(){
  DPR=Math.min(2,window.devicePixelRatio||1);
  CW=cv.clientWidth; CH=cv.clientHeight;
  cv.width=CW*DPR; cv.height=CH*DPR;
  if(!ST.w) build(); else clampView();
}
window.addEventListener('resize',resize);

function clampView(){
  var w=ST.w;
  view.z=Math.max(view.zf*.95, Math.min(view.zf*6, view.z));
  var ww=w.W*view.z, hh=w.H*view.z;
  view.x = ww<=CW ? (CW-ww)/2 : Math.max(CW-ww, Math.min(0, view.x));
  view.y = hh<=CH ? (CH-hh)/2 : Math.max(CH-hh, Math.min(0, view.y));
}
function zoomAt(sx,sy,f){
  var wx=(sx-view.x)/view.z, wy=(sy-view.y)/view.z;
  view.z*=f; clampView();
  view.x=sx-wx*view.z; view.y=sy-wy*view.z; clampView();
}
cv.addEventListener('wheel',function(e){ e.preventDefault(); zoomAt(e.clientX,e.clientY,Math.exp(-e.deltaY*.0016)); },{passive:false});

var drag=null, pinch=null;
cv.addEventListener('pointerdown',function(e){
  try{ cv.setPointerCapture(e.pointerId); }catch(err){}
  drag={sx:e.clientX,sy:e.clientY,x:view.x,y:view.y,t:performance.now(),m:0};
});
cv.addEventListener('pointermove',function(e){
  if(!drag||ST.ph!=='jeu') return;
  var dx=e.clientX-drag.sx, dy=e.clientY-drag.sy;
  drag.m=Math.max(drag.m,Math.abs(dx)+Math.abs(dy));
  view.x=drag.x+dx; view.y=drag.y+dy; clampView();
});
cv.addEventListener('pointerup',function(e){
  if(drag && drag.m<9 && performance.now()-drag.t<600) tap(e.clientX,e.clientY);
  drag=null;
});
cv.addEventListener('pointercancel',function(){ drag=null; });
function dist(t){ return Math.hypot(t[0].clientX-t[1].clientX, t[0].clientY-t[1].clientY); }
cv.addEventListener('touchstart',function(e){ if(e.touches.length===2){ drag=null; pinch=dist(e.touches); } },{passive:true});
cv.addEventListener('touchmove',function(e){
  if(e.touches.length===2){ e.preventDefault();
    var d=dist(e.touches), mx=(e.touches[0].clientX+e.touches[1].clientX)/2, my=(e.touches[0].clientY+e.touches[1].clientY)/2;
    if(pinch) zoomAt(mx,my,d/pinch); pinch=d; }
},{passive:false});
cv.addEventListener('touchend',function(e){ if(e.touches.length<2) pinch=null; },{passive:true});

function son(){ if(!M.on){ try{ M.setGenre(ST.genre); M.start(); }catch(e){} } }

function tap(sx,sy){
  if(ST.ph==='titre'){ son(); ST.ph='show'; ST.pt=0; return; }
  if(ST.ph==='show'){ son(); ST.ph='mix'; ST.pt=0; mark=0; return; }
  if(ST.ph==='fin'){
    if(ST.pt<5) return;
    if(ST.gagne) ST.niv++;
    ST.seed=(ST.seed*1103515245+12345)>>>0; build(); return;
  }
  if(ST.ph!=='jeu') return;
  var w=ST.w, wx=(sx-view.x)/view.z, wy=(sy-view.y)/view.z, S=w.S;
  for(var i=w.inst.length-1;i>=0;i--){
    var o=w.inst[i], sz=S*o.s;
    if(Math.abs(wx-o.x)<sz*.30 && wy>o.y-sz*.86 && wy<o.y+sz*.12){
      if(o.uni){ ST.fini=(performance.now()-ST.t0)/1000; ST.gagne=1; ST.ph='fin'; ST.pt=0; boom(o); gagne(); }
      else { ST.err++; ST.bad=performance.now(); ST.bx=wx; ST.by=wy; }
      return;
    }
  }
}
function boom(o){
  for(var i=0;i<90;i++){ var a=Math.random()*6.2832, s=140+Math.random()*460;
    pops.push({x:o.x,y:o.y-30,vx:Math.cos(a)*s,vy:Math.sin(a)*s-190,h:Math.floor(Math.random()*360),l:1}); }
}
/* Recompenses Wavedash. Hors de la plateforme, trophee() et score() ne font
   rien de plus que declencher le bandeau dessine plus bas. */
var TROPHEES='FIRST_FIND CLEAN_ROOM QUICK_EYE BLINK LAST_BEAT HOT_STREAK ROOM_THREE ROOM_SIX ALL_NINE'.split(' ');
function gagne(){
  var t=ST.fini, reste=Math.max(0,ST.lim-t), i;
  /* Le score recompense la vitesse et la profondeur a la fois: chaque salle
     rapporte le temps de musique epargne plus un forfait, le tout multiplie
     par son numero. Une salle lointaine vaut donc bien plus qu'une salle
     facile, et le total s'accumule sur la session. */
  ST.pts+=ST.niv*(reste+200); ST.suite=ST.err?0:ST.suite+1;
  var C=[1,!ST.err,t<10,t<5,reste<3,ST.suite>2,ST.niv>2,ST.niv>5,ST.niv>8];
  for(i=0;i<9;i++) if(C[i]) trophee(TROPHEES[i]);
  score('night-score',ST.pts,1,0);
}
function lumiere(t){
  var ph, e=null;
  if(M.on){ ph=M.phase(); e=M.etat(); } else ph=t*GENRES[ST.genre].bpm/60;
  var r=e? e.refrain : (Math.floor(ph/16)%2===1);
  if(r && !dernRef) flash=1;
  dernRef=r?1:0; flash*=.90;
  return { beat:ph, bar:Math.floor(ph/4), pulse:Math.max(0,1-(ph%1)*2.2), refrain:r, flash:flash, ph:ph };
}

/* ---- textes ---- */
function ecrit(s,x,y,n,col,trait){
  X.font='bold '+n+'px '+F; X.textAlign='center';
  if(trait){ X.lineWidth=n*.30; X.lineJoin='round'; X.strokeStyle='rgba(8,4,16,.75)'; X.strokeText(s,x,y); }
  X.fillStyle=col; X.fillText(s,x,y);
}
function logo(cy,n,t){
  var s='UNIFIND', i, L=[], w=0;
  X.font='bold '+n+'px '+F; X.textAlign='center';
  for(i=0;i<7;i++){ L[i]=X.measureText(s.charAt(i)).width; w+=L[i]; }
  var x=CW/2-w/2;
  for(i=0;i<7;i++){
    X.save(); X.translate(x+L[i]/2, cy+Math.sin(t*2.6+i*.7)*n*.07); X.rotate(Math.sin(t*1.7+i)*.06);
    X.lineJoin='round'; X.lineWidth=n*.26; X.strokeStyle='#fff'; X.strokeText(s.charAt(i),0,0);
    X.lineWidth=n*.10; X.strokeStyle='rgba(60,26,80,.6)'; X.strokeText(s.charAt(i),0,0);
    X.fillStyle=RBC[i]; X.fillText(s.charAt(i),0,0);
    X.restore(); x+=L[i];
  }
}

var last=performance.now();
function frame(now){
  var dt=Math.min(.05,(now-last)/1000); last=now;
  var t=(now-ST.t0)/1000, w=ST.w, L=lumiere(t), fade=0;

  if(ST.ph==='show'){
    mark=1;
    var u=w.uni, k=Math.min(1,dt*4);
    view.z+=(ST.cz-view.z)*k;
    view.x+=((CW/2-u.x*view.z)-view.x)*k;
    view.y+=((CH/2-(u.y-w.S*u.s*.4)*view.z)-view.y)*k; clampView();
  } else if(ST.ph==='mix'){
    ST.pt+=dt;
    place(w,Math.min(1,ST.pt/T_MIX)); triZ(w);
    var kz=Math.min(1,dt*2.6);
    view.z+=(view.zf-view.z)*kz;
    view.x+=((CW-w.W*view.z)/2-view.x)*kz;
    view.y+=((CH-w.H*view.z)/2-view.y)*kz; clampView();
    fade=Math.max(0,Math.min(1,(ST.pt-T_MIX*.42)/(T_MIX*.5)));
    if(ST.pt>=T_MIX+2){
      place(w,1); triZ(w);
      ST.ph='jeu'; ST.t0=performance.now(); fit();
    }
  } else if(ST.ph==='fin'){
    ST.pt+=dt;
    if(ST.gagne){
      var u3=w.uni, k3=Math.min(1,dt*(ST.pt<1.5?3:1.7));
      var tz = ST.pt<1.5 ? ST.cz : view.zf;
      var tx = ST.pt<1.5 ? CW/2-u3.x*view.z : (CW-w.W*view.z)/2;
      var ty = ST.pt<1.5 ? CH/2-(u3.y-w.S*u3.s*.4)*view.z : (CH-w.H*view.z)/2;
      view.z+=(tz-view.z)*k3; view.x+=(tx-view.x)*k3; view.y+=(ty-view.y)*k3; clampView();
      if(ST.pt>1.5) place(w, Math.max(0, 1-(ST.pt-1.5)/4.2));
    }
  }

  X.setTransform(DPR,0,0,DPR,0,0);
  X.fillStyle='#07040e'; X.fillRect(0,0,CW,CH);
  var shake=(performance.now()-ST.bad<230)?Math.sin(performance.now()*.06)*6:0;
  X.setTransform(view.z*DPR,0,0,view.z*DPR, view.x*DPR+shake, view.y*DPR);

  var vue={ x0:-view.x/view.z, y0:-view.y/view.z, x1:(CW-view.x)/view.z, y1:(CH-view.y)/view.z };
  drawBack(X,w,t,L); drawBeams(X,w,t,L);
  drawCrowd(X,w,L.ph,0,vue);
  drawFront(X,w,t,L);

  if(ST.ph==='fin' && ST.gagne){                 /* la pluie reste dans la salle */
    var gx=Math.max(0,vue.x0), gw=Math.min(w.W,vue.x1)-gx;
    for(var q=0;q<4;q++)
      pops.push({ x:gx+Math.random()*gw, y:Math.max(0,vue.y0), vx:(Math.random()*2-1)*50,
                  vy:70+Math.random()*130, h:Math.floor(Math.random()*360), l:2.8, f:1 });
  }
  for(var i=pops.length-1;i>=0;i--){ var p=pops[i];
    if(p.f) p.x+=Math.sin(now*.004+p.y*.02)*44*dt;
    p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=(p.f?70:1000)*dt; p.l-=dt*(p.f?.34:.7);
    if(p.l<=0||p.y>w.H||p.x<0||p.x>w.W){ pops.splice(i,1); continue; }
    X.fillStyle='hsla('+p.h+',90%,66%,'+p.l+')'; X.fillRect(p.x-7,p.y-7,14,14); }

  if(mark>0){                                    /* projecteur sur la licorne */
    if(ST.ph!=='show') mark-=dt;
    var uu=w.uni, uz=w.S*uu.s, cy=uu.y-uz*.40, f=Math.min(1,mark), bat=.72+.28*Math.sin(now*.009);
    var gr=X.createRadialGradient(uu.x,cy,uz*.75,uu.x,cy,uz*5.5);
    gr.addColorStop(0,'rgba(4,2,10,0)'); gr.addColorStop(1,'rgba(4,2,10,'+(.78*f)+')');
    X.fillStyle=gr; X.fillRect(vue.x0,vue.y0,vue.x1-vue.x0,vue.y1-vue.y0);
    X.lineWidth=5/view.z; X.strokeStyle='rgba(255,255,255,'+(f*bat)+')';
    X.beginPath(); X.arc(uu.x,cy,uz*(.68+.06*bat),0,6.2832); X.stroke();
    X.lineWidth=3/view.z; X.strokeStyle='rgba(255,122,156,'+(f*bat)+')';
    X.beginPath(); X.arc(uu.x,cy,uz*(.92+.10*bat),0,6.2832); X.stroke();
  }

  var ba=(now-ST.bad)/460;
  if(ba<1 && ba>0){
    var al=1-ba, rr=26+ba*100;
    X.strokeStyle='rgba(255,86,120,'+al+')'; X.lineWidth=7/view.z;
    X.beginPath(); X.arc(ST.bx,ST.by,rr,0,6.2832); X.stroke();
    X.lineWidth=9/view.z; X.lineCap='round';
    X.beginPath(); X.moveTo(ST.bx-22,ST.by-22); X.lineTo(ST.bx+22,ST.by+22);
    X.moveTo(ST.bx+22,ST.by-22); X.lineTo(ST.bx-22,ST.by+22); X.stroke();
  }

  X.setTransform(DPR,0,0,DPR,0,0);
  var bat2=.55+.45*Math.sin(now*.004);

  if(WDban>0){ WDban-=dt;
    var nb=Math.min(20,CW/32);
    X.globalAlpha=Math.min(1,WDban*2.2);
    ecrit('\u2605 '+WDnom, CW/2, 44+nb, nb,'#ffe14d',1);
    X.globalAlpha=1; }

  if(ST.ph==='jeu'){                              /* la musique fait office de sablier */
    var reste=Math.max(0,ST.lim-t);
    X.fillStyle='rgba(255,255,255,.14)'; X.fillRect(0,0,CW,5);
    X.fillStyle=reste<8?'#ff7a9c':'#9b8cf5'; X.fillRect(0,0,CW*reste/ST.lim,5);
    if(reste<=0){ ST.gagne=0; ST.ph='fin'; ST.pt=0; mark=4;
      view.z=ST.cz; view.x=CW/2-w.uni.x*view.z; view.y=CH/2-w.uni.y*view.z; clampView(); }
  }
  else if(ST.ph==='titre'){
    X.fillStyle='rgba(6,3,14,.55)'; X.fillRect(0,0,CW,CH);
    logo(CH*.40, Math.min(96,CW/7.2), now/1000);
    ecrit('find the unicorn before the music ends', CW/2, CH*.40+Math.min(96,CW/7.2)*.62, Math.min(19,CW/34),'rgba(255,255,255,.9)',1);
    X.globalAlpha=bat2; ecrit('tap to start', CW/2, CH*.72, Math.min(26,CW/26),'#ffe14d',1); X.globalAlpha=1;
  }
  else if(ST.ph==='show'){
    ST.pt+=dt;
    ecrit('room '+ST.niv+'   '+ST.lieu.nom, CW/2, 56, Math.min(32,CW/19),'#fff',1);
    var n4=Math.min(36,CW/13);
    X.globalAlpha=bat2;
    ecrit('Tap and try to find', CW/2, CH-52-n4, n4,'#fff',1);
    ecrit('the unicorn', CW/2, CH-46, n4,'#fff',1);
    X.globalAlpha=1;
  }
  else if(ST.ph==='mix'){
    if(fade>0){ X.fillStyle='rgba(4,2,10,'+fade+')'; X.fillRect(0,0,CW,CH); }
    if(fade>.15){
      X.globalAlpha=Math.min(1,(fade-.15)/.35);
      var n2=Math.min(30,CW/22);
      ecrit('Will you find the unicorn', CW/2, CH/2-14, n2,'#fff',1);
      ecrit('before the music ends?', CW/2, CH/2+n2+2, n2,'#fff',1);
      X.globalAlpha=1;
    }
  }
  else {                                          /* écran de fin */
    X.fillStyle='rgba(6,3,14,'+Math.min(ST.gagne?.34:.62,ST.pt*.9)+')'; X.fillRect(0,0,CW,CH);
    var n3=Math.min(44,CW/15);
    ecrit(ST.gagne?'FOUND!':'Try again!', CW/2, CH*.20, n3, ST.gagne?'#ffe14d':'#ff9ec4',1);
    /* Le score affiche est celui qui part au classement: sans lui, le joueur
       ne saurait pas ce qui est compare. */
    if(ST.gagne) ecrit(ST.fini.toFixed(1)+' s'+(ST.err?'   '+ST.err+' miss':'')+'   '+(ST.pts|0)+' pts',
                       CW/2, CH*.20+n3*.9, Math.min(22,CW/30),'#fff',1);
    if(ST.pt>5){ X.globalAlpha=bat2;
      ecrit(ST.gagne?'tap for the next song':'tap to retry', CW/2, CH*.70, Math.min(24,CW/28),'rgba(255,255,255,.95)',1);
      X.globalAlpha=1; }
  }
  requestAnimationFrame(frame);
}

resize(); ST.ph='titre'; requestAnimationFrame(frame);
