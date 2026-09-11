/* Pilote de capture d'Unifind. Le jeu lit ses entrees par tap(x, y) en
   coordonnees ecran : le pilote appelle directement cette fonction plutot que
   de simuler des evenements. t est le temps simule, en millisecondes. */
window.__drive = function (t) {
  if (typeof ST === 'undefined' || !ST.w) return;
  if (ST.ph === 'titre' && t > 1400) return tap(300, 300);
  if (ST.ph === 'show' && ST.pt > 2.4) return tap(300, 300);
  if (ST.ph === 'jeu') {
    if (window.__debutJeu === undefined) window.__debutJeu = t;
    /* Quelques secondes de foule qui danse avant de designer la licorne:
       c'est ce que le joueur voit, et c'est ce qui doit se lire dans le GIF. */
    if (t - window.__debutJeu > 3600) {
      var u = ST.w.uni;
      tap(u.x * view.z + view.x, (u.y - ST.w.S * u.s * 0.4) * view.z + view.y);
    }
  }
};
