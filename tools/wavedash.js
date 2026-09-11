/* Verifie l'integration Wavedash sur la SORTIE TERSER, avec un SDK double qui
   valide ses types comme le vrai.

   Pourquoi la sortie terser et pas la source: le SDK leve sur un argument du
   mauvais type, le jeu avale l'exception, et rien n'apparait dans la console.
   Un jeu peut donc marcher parfaitement depuis src/ et n'envoyer aucun trophee
   une fois minifie. Seul ce test attrape ce cas.

   Pourquoi un double strict: un double permissif ne teste rien. Celui-ci compte
   les appels reussis ET les violations de types, exactement comme le SDK.

   Prerequis: npm install, et terser accessible. */

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { installe } = require('./dom');
const { source, TERSER_ARGS, outil } = require('../build.js');

/* --- La sortie terser, sans mangle toplevel ------------------------------- */
/* Le mangle renommerait tap() et ST, que le test doit pouvoir appeler. Il ne
   change pas la semantique verifiee ici: ce sont les options -c qui reecrivent
   le code. */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'unifind-wd-'));
const brut = path.join(tmp, 'a.js'), min = path.join(tmp, 'a.min.js');
fs.writeFileSync(brut, source);
const sansMangle = [];
for (let i = 0; i < TERSER_ARGS.length; i++) {
  if (TERSER_ARGS[i] === '-m') { i++; continue; }
  sansMangle.push(TERSER_ARGS[i]);
}
execFileSync(outil('terser'), [brut, ...sansMangle, '-o', min],
             { stdio: ['ignore', 'ignore', 'inherit'] });
const CODE = fs.readFileSync(min, 'utf8') + `
;globalThis._etat = () => ({ ph: ST.ph, niv: ST.niv, gagne: ST.gagne, err: ST.err });
globalThis._tap = (x, y) => tap(x === undefined ? 320 : x, y === undefined ? 180 : y);
globalThis._graine = n => { ST.seed = n; build(); };
globalThis._licorne = () => { const u = ST.w.uni;
  return [u.x * view.z + view.x, (u.y - ST.w.S * u.s * 0.4) * view.z + view.y]; };
globalThis._bandeau = () => WDnom;
/* Une creature qui n'est pas la licorne: cliquer dans le vide ne compte pas
   comme une erreur, seul un clic sur la mauvaise creature en est une. */
globalThis._figurant = () => { const L = ST.w.inst;
  for (let i = L.length - 1; i >= 0; i--) if (!L[i].uni) {
    const o = L[i];
    return [o.x * view.z + view.x, (o.y - ST.w.S * o.s * 0.4) * view.z + view.y];
  } };`;
fs.rmSync(tmp, { recursive: true, force: true });

/* --- Le double strict ------------------------------------------------------ */

/* Reproduit vBoolean/vString/vNumber du SDK: mauvais type, exception levee. */
function doubleSdk(o) {
  o = o || {};
  const c = { init: 0, stats: 0, get: 0, set: 0, cree: 0, envoi: 0 };
  const viols = [], acquis = new Set(), envois = [];
  const t = (v, attendu, ou) => {
    if (typeof v !== attendu) { viols.push(ou + ': attendu ' + attendu + ', recu ' + typeof v + ' (' + v + ')');
      throw new Error(ou + ': expected ' + attendu); } };

  const sdk = {
    init() { c.init++; return true; },
    requestStats() { c.stats++;
      if (o.statsRejette) return Promise.reject(new Error('reseau'));
      if (o.statsLent) return new Promise(r => { o.libere = () => r({ success: true, data: true }); });
      return Promise.resolve(o.statsEchoue ? { success: false } : { success: true, data: true }); },
    getAchievement(id) { c.get++; t(id, 'string', 'getAchievement.identifier'); return acquis.has(id); },
    setAchievement(id, storeNow) { c.set++;
      t(id, 'string', 'setAchievement.identifier');
      t(storeNow, 'boolean', 'setAchievement.storeNow');   /* le piege des booleens */
      if (o.inconnus) return false;                        /* identifiant absent du portail */
      acquis.add(id); return true; },
    getOrCreateLeaderboard(nom, ordre, type) { c.cree++;
      t(nom, 'string', 'getOrCreateLeaderboard.name');
      t(ordre, 'number', 'getOrCreateLeaderboard.sortOrder');
      t(type, 'number', 'getOrCreateLeaderboard.displayType');
      if (o.creeRejette) return Promise.reject(new Error('reseau'));
      if (o.creeEchoue) return Promise.resolve({ success: false });
      /* La forme exacte des types generes du serveur: id, jamais _id. */
      const d = { id: 'lb-' + nom, name: nom, totalEntries: 0, created: true };
      if (o.idSousTiret) { d._id = d.id; delete d.id; }
      return Promise.resolve({ success: true, data: d }); },
    uploadLeaderboardScore(id, valeur, garderMeilleur) { c.envoi++;
      t(id, 'string', 'uploadLeaderboardScore.leaderboardId');
      t(valeur, 'number', 'uploadLeaderboardScore.score');
      t(garderMeilleur, 'boolean', 'uploadLeaderboardScore.keepBest');
      envois.push({ id, valeur });
      if (o.envoiRejette) return Promise.reject(new Error('reseau'));
      return Promise.resolve({ success: true }); },
  };
  for (const m of (o.retire || [])) delete sdk[m];
  return { sdk, c, viols, acquis, envois, o };
}

/* --- Harnais --------------------------------------------------------------- */

let echecs = 0, rejets = [];
process.on('unhandledRejection', r => rejets.push(String(r)));
const verifie = (nom, ok, detail) => {
  console.log((ok ? '  ok   ' : '  ECHEC') + '  ' + nom + (detail ? '   ' + detail : ''));
  if (!ok) echecs++;
};

/* Joue une salle jusqu'a la victoire. `pas` fixe la duree d'une image, donc le
   temps de resolution mesure par le jeu. */
async function partie(dom, opts) {
  opts = opts || {};
  dom.frames(4);
  globalThis._graine(opts.graine || 12345);
  dom.frames(20);            /* ecran de presentation */
  globalThis._tap();
  dom.frames(180);           /* brassage, puis passage en jeu */
  if (opts.rate) { const [fx, fy] = globalThis._figurant(); globalThis._tap(fx, fy); dom.frames(2); }
  const [ux, uy] = globalThis._licorne();
  dom.frames(opts.images || 4, opts.pas === undefined ? 33 : opts.pas);
  globalThis._tap(ux, uy);
  dom.frames(4);
  await dom.souffle(); await dom.souffle(); await dom.souffle();
}

async function scenario(nom, opts, controle) {
  const d = doubleSdk(opts);
  const dom = installe({ Wavedash: opts.absent ? null : d.sdk });
  const erreurs = [];
  const consoleErr = console.error; console.error = (...a) => erreurs.push(a.join(' '));
  try { dom.lance(CODE); await partie(dom, opts); await controle(d, dom); }
  catch (e) { verifie(nom + ' (exception)', false, String(e && e.stack || e)); }
  finally { console.error = consoleErr; }
  verifie(nom + ': aucune exception echappee', erreurs.length === 0, erreurs.join(' | '));
}

/* --- Les scenarios --------------------------------------------------------- */

(async () => {
  console.log('SDK complet');
  await scenario('nominal', {}, d => {
    verifie('  init() appele une fois', d.c.init === 1, d.c.init + ' appel(s)');
    verifie('  requestStats() appele', d.c.stats === 1, d.c.stats + ' appel(s)');
    verifie('  aucune violation de type', d.viols.length === 0, d.viols.join(' | '));
    verifie('  des trophees sont partis', d.acquis.size >= 2, [...d.acquis].join(' '));
    verifie('  le classement est cree', d.c.cree === 1, d.c.cree + ' creation(s)');
    verifie('  le score est envoye', d.envois.length === 1,
            d.envois.map(e => e.id + '=' + e.valeur).join(' '));
    /* Un score nul est valide: il ne doit pas etre filtre par un `if (score)`. */
    verifie('  le score est un entier positif', d.envois.every(e => Number.isInteger(e.valeur) && e.valeur >= 0),
            JSON.stringify(d.envois));
    verifie('  l id lu est data.id', d.envois.every(e => /^lb-/.test(e.id)), JSON.stringify(d.envois));
    verifie('  le bandeau affiche un libelle lisible', /^[A-Z ]+$/.test(globalThis._bandeau()),
            globalThis._bandeau());
  });

  console.log('\nConditions de jeu');
  await scenario('partie rapide sans erreur', { pas: 33 }, d => {
    verifie('  FIRST_FIND et CLEAN_ROOM', d.acquis.has('FIRST_FIND') && d.acquis.has('CLEAN_ROOM'),
            [...d.acquis].join(' '));
    verifie('  QUICK_EYE et BLINK sous 5 s', d.acquis.has('QUICK_EYE') && d.acquis.has('BLINK'),
            [...d.acquis].join(' '));
  });
  await scenario('partie avec une erreur', { rate: true }, d => {
    verifie('  CLEAN_ROOM non attribue', !d.acquis.has('CLEAN_ROOM'), [...d.acquis].join(' '));
    verifie('  FIRST_FIND quand meme attribue', d.acquis.has('FIRST_FIND'));
  });

  console.log('\nSDK en panne: le jeu doit continuer sans un mot');
  await scenario('aucun global Wavedash', { absent: true }, d => {
    verifie('  aucun appel', d.c.init === 0);
    verifie('  la partie va au bout', globalThis._etat().gagne === 1);
    verifie('  le bandeau fonctionne quand meme', globalThis._bandeau().length > 0, globalThis._bandeau());
  });
  await scenario('methodes absentes', { retire: ['setAchievement', 'uploadLeaderboardScore', 'getAchievement'] }, d => {
    verifie('  init() passe malgre tout', d.c.init === 1);
    verifie('  la partie va au bout', globalThis._etat().gagne === 1);
  });
  await scenario('requestStats rejette', { statsRejette: true }, d => {
    verifie('  aucun trophee envoye', d.c.set === 0, d.c.set + ' envoi(s)');
    verifie('  la partie va au bout', globalThis._etat().gagne === 1);
  });
  await scenario('requestStats repond success:false', { statsEchoue: true }, d => {
    verifie('  aucun trophee envoye', d.c.set === 0, d.c.set + ' envoi(s)');
  });
  await scenario('creation de classement rejetee', { creeRejette: true }, d => {
    verifie('  aucun score envoye', d.c.envoi === 0);
  });
  await scenario('creation de classement success:false', { creeEchoue: true }, d => {
    verifie('  aucun score envoye', d.c.envoi === 0);
  });
  await scenario('envoi de score rejete', { envoiRejette: true }, d => {
    verifie('  l envoi a bien ete tente', d.c.envoi === 1, d.c.envoi + ' tentative(s)');
  });
  await scenario('le SDK renvoie _id au lieu de id', { idSousTiret: true }, d => {
    verifie('  rien n est envoye a un id inexistant', d.c.envoi === 0, d.c.envoi + ' envoi(s)');
  });
  await scenario('identifiants absents du portail', { inconnus: true }, d => {
    verifie('  les refus ne bloquent pas la partie', globalThis._etat().gagne === 1);
  });

  console.log('\nTrophee gagne avant la reponse des stats');
  {
    const d = doubleSdk({ statsLent: true });
    const dom = installe({ Wavedash: d.sdk });
    dom.lance(CODE);
    await partie(dom, {});
    verifie('  rien n est envoye tant que les stats n ont pas repondu', d.c.set === 0, d.c.set + ' envoi(s)');
    d.o.libere();
    await dom.souffle(); await dom.souffle(); await dom.souffle();
    verifie('  les trophees en attente partent ensuite', d.acquis.size >= 2, [...d.acquis].join(' '));
    verifie('  aucune violation de type', d.viols.length === 0, d.viols.join(' | '));
  }

  /* Le SDK ignore en silence tout identifiant absent du Developer Portal: la
     concordance code / JSON d'import est la seule chose verifiable hors ligne. */
  console.log('\nConcordance des identifiants');
  {
    const codes = (fs.readFileSync(path.join(__dirname, '..', 'src', 'game.js'), 'utf8')
      .match(/var TROPHEES='([^']+)'/) || [, ''])[1].split(' ').filter(Boolean);
    const json = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'wavedash-achievements.json'), 'utf8'))
      .achievements.map(a => a.identifier);
    const manquants = codes.filter(i => !json.includes(i));
    const surplus = json.filter(i => !codes.includes(i));
    verifie('  le code declare des trophees', codes.length > 0, codes.length + ' identifiant(s)');
    verifie('  aucun trophee du code absent du JSON', manquants.length === 0, manquants.join(' '));
    verifie('  aucun trophee du JSON absent du code', surplus.length === 0, surplus.join(' '));
  }

  console.log('\nRepetitions');
  {
    const d = doubleSdk({});
    const dom = installe({ Wavedash: d.sdk });
    dom.lance(CODE);
    await partie(dom, {});
    const apres1 = d.c.set;
    dom.frames(200); globalThis._tap(); dom.frames(6);   /* salle suivante */
    await partie(dom, { graine: 777 });
    verifie('  un trophee deja gagne n est pas renvoye', d.c.set === apres1,
            apres1 + ' puis ' + d.c.set + ' envoi(s)');
  }

  await new Promise(r => setImmediate(r));
  verifie('\naucune promesse rejetee sans garde', rejets.length === 0, rejets.join(' | '));
  console.log(echecs ? '\n' + echecs + ' verification(s) en echec' : '\ntout est vert');
  process.exit(echecs ? 1 : 0);
})();
