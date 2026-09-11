/* Integration Wavedash.

   La plateforme injecte le global `Wavedash` avant le code du jeu: rien n'est
   telecharge, rien n'est embarque dans le ZIP, et aucune ressource externe
   n'est chargee. Hors de la plateforme le fichier entier est inerte, a une
   exception pres: le bandeau de trophee, que game.js dessine dans le canevas,
   reste visible partout, y compris sur js13kgames.com.

   Les pieges evites ici, tous verifies dans le code du SDK:
     - setAchievement() ne fait rien tant que requestStats() n'a pas repondu;
     - l'identifiant d'un classement est data.id, pas data._id;
     - un try/catch partage entre deux appels les fait tomber ensemble;
     - terser ne doit pas reecrire les booleens (voir build.js). */

var WD = self.Wavedash, WDpret = 0, WDatt = [], WDeu = {}, WDban = 0, WDnom = '';

/* Un garde par appel: une methode absente ne doit pas emporter les voisines.
   Le rest evite de passer des `undefined` a un SDK qui valide ses arguments. */
function wdCall(method, ...args) { try { if (WD && WD[method]) return WD[method](...args); } catch (e) {} }

/* Les trophees gagnes avant la reponse de requestStats patientent dans WDatt. */
function wdVide() {
  if (!WDpret) return;
  while (WDatt.length) {
    var i = WDatt[0];
    /* getAchievement evite un envoi reseau pour un trophee deja acquis. */
    if (wdCall('getAchievement', i) !== true && wdCall('setAchievement', i, true) !== true) return;
    WDatt.shift();
  }
}

/* Un trophee ne se gagne qu'une fois par session: le bandeau ne clignote pas a
   chaque salle et le SDK ne recoit pas dix fois le meme envoi. */
function trophee(i) {
  if (WDeu[i]) return;
  WDeu[i] = 1; WDatt.push(i);
  WDnom = i.split('_').join(' '); WDban = 3.4;
  wdVide();
}

/* ordre: 0 croissant, 1 decroissant.  type: 0 nombre, 2 millisecondes. */
function score(nom, v, ordre, type) {
  var p = wdCall('getOrCreateLeaderboard', nom, ordre, type), rien = function () {};
  if (p && p.then) p.then(function (r) {
    /* data.id, jamais data._id: un `_id` devine ferait echouer tout envoi en silence. */
    if (r && r.success && r.data && r.data.id) {
      var u = wdCall('uploadLeaderboardScore', r.data.id, Math.round(v), true);
      if (u && u.catch) u.catch(rien);
    }
  }, rien);
}

if (WD) {
  wdCall('init');                         /* sans lui, le jeu reste cache */
  var wdS = wdCall('requestStats');       /* sans lui, aucun trophee ne part */
  if (wdS && wdS.then) wdS.then(function (r) { WDpret = r && r.success && r.data === true; wdVide(); },
                                function () {});
}

if(typeof module!=='undefined') module.exports={ wdCall:wdCall, trophee:trophee, score:score };
