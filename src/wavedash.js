/* Wavedash integration.

   The platform injects the `Wavedash` global before the game code: nothing is
   downloaded, nothing is bundled into the ZIP, and no external resource is
   ever fetched. Off the platform the whole file is inert, with a single
   exception: the achievement banner, which game.js paints into the canvas,
   stays visible everywhere, js13kgames.com included.

   The traps avoided here, all verified against the SDK source:
     - setAchievement() does nothing until requestStats() has answered;
     - a leaderboard id is data.id, not data._id;
     - one try/catch shared by two calls makes them fail together;
     - terser must not rewrite the booleans (see build.js). */

var WD = self.Wavedash, WDready = 0, WDqueue = [], WDgot = {}, WDbanner = 0, WDname = '';

/* One guard per call: a missing method must not take its neighbours down with it.
   The rest args keep `undefined` away from an SDK that validates its arguments. */
function wdCall(method, ...args) { try { if (WD && WD[method]) return WD[method](...args); } catch (e) {} }

/* Achievements earned before requestStats answers wait their turn in WDqueue. */
function wdFlush() {
  if (!WDready) return;
  while (WDqueue.length) {
    var i = WDqueue[0];
    /* getAchievement spares a network call for an achievement already earned. */
    if (wdCall('getAchievement', i) !== true && wdCall('setAchievement', i, true) !== true) return;
    WDqueue.shift();
  }
}

/* An achievement is earned once per session: the banner does not blink on every
   room and the SDK does not receive the same send ten times over. */
function achievement(i) {
  if (WDgot[i]) return;
  WDgot[i] = 1; WDqueue.push(i);
  WDname = i.split('_').join(' '); WDbanner = 3.4;
  wdFlush();
}

/* order: 0 ascending, 1 descending.  type: 0 number, 2 milliseconds. */
function score(name, v, order, type) {
  var p = wdCall('getOrCreateLeaderboard', name, order, type), noop = function () {};
  if (p && p.then) p.then(function (r) {
    /* data.id, never data._id: a guessed `_id` would fail every upload in silence. */
    if (r && r.success && r.data && r.data.id) {
      var u = wdCall('uploadLeaderboardScore', r.data.id, Math.round(v), true);
      if (u && u.catch) u.catch(noop);
    }
  }, noop);
}

if (WD) {
  wdCall('init');                         /* without it, the game stays hidden */
  var wdS = wdCall('requestStats');       /* without it, no achievement is sent */
  if (wdS && wdS.then) wdS.then(function (r) { WDready = r && r.success && r.data === true; wdFlush(); },
                                function () {});
}

if(typeof module!=='undefined') module.exports={ wdCall:wdCall, achievement:achievement, score:score };
