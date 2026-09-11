# Unifind

Entrée js13kGames 2026, thème Unicorns and Rainbows, avec le challenge Wavedash.

Un cherche-et-trouve rythmé. Une licorne se cache dans une foule de créatures qui
dansent sur le tempo, dans une boîte de nuit ou une fête en plein air. Il faut la
retrouver avant la fin du morceau. Tout est généré par le code: aucune image,
aucun son échantillonné, aucune dépendance, aucune ressource externe.

![Unifind](media/gameplay.gif)

Une salle, sa foule, et la licorne retrouvée avant la fin du morceau.

## Commandes

Un seul geste: cliquer, ou toucher. Molette et pincement pour zoomer, glisser
pour se déplacer dans la salle.

## Ce que contient le jeu

- 9 salles: Warehouse, Meadow, Subwoofer, Beach, Bunker, Forest, Neon, Rooftop, Lounge
- 9 morceaux, un par salle: techno, melodic house, dubstep, trance, drum and bass,
  psytrance, synthwave, UK garage, deep house
- 10 espèces de créatures, générées à partir d'une seule fonction de dessin et
  d'une table de 16 nombres par espèce
- Difficulté croissante: 200 créatures en salle 1, puis 100 de plus par salle,
  jusqu'à un plafond de 1000
- La musique sert de sablier: un morceau fait 32 mesures, soit 44 à 70 secondes
  selon le tempo
- 9 trophées et un classement, visibles sur Wavedash

## Structure

    src/creatures.js   generation des creatures (silhouettes, palettes, autocollants)
    src/music.js       moteur audio, 9 morceaux, sections et refrains
    src/rooms.js       les 9 lieux, l eclairage, la foule, le brassage
    src/wavedash.js    trophees, classements, bandeau de recompense
    src/game.js        boucle de jeu, camera, entrees, ecrans

    build.js           produit les trois livrables depuis le meme etat de src/
    wavedash.toml      configuration du challenge Wavedash
    wavedash-achievements.json   definitions a importer dans le Developer Portal

    tools/dom.js       faux DOM partage par les outils de test
    tools/check.js     joue une partie complete, sur la source ou sur la sortie terser
    tools/wavedash.js  l integration Wavedash, avec un SDK double qui valide ses types
    tools/audio.js     deroule les 9 morceaux et controle la chaine audio
    tools/pilote-capture.js   pilote automatique pour regenerer media/gameplay.gif

    media/             cover, miniature et GIF de la soumission
    lab/               laboratoires de R&D, hors du jeu

## Construire

    npm install              # uniquement pour les outils de test
    npm run build            # les trois livrables, un tirage roadroller
    npm run release          # idem, meilleur de six tirages: pour le ZIP soumis
    npm run fast             # sans compression, dans dist/tuning/, ne touche pas au ZIP

Le build produit, depuis le même état de `src/`:

    unifind.zip              l archive du concours, zip -9 puis advzip
    dist/js13k/index.html    la page compressee, terser + roadroller
    dist/wavedash/index.html la page lisible, sans minification: cible Wavedash

Le dépôt se développe en éditant `src/`. Tout ce qui est dans `dist/` est un
produit de build, il ne faut pas l'éditer à la main.

Outils attendus sur la machine: `terser` et `roadroller` (le build les cherche
dans `node_modules/.bin`, puis en global), et `advzip` d'AdvanceCOMP pour la
recompression finale. Sans advzip le build fonctionne, mais l'archive pèse
environ 300 octets de plus.

## Vérifier

    npm run check

Enchaîne quatre contrôles:

    node tools/check.js          partie complete sur la page lisible
    node tools/check.js --min    les memes verifications sur la sortie terser
    node tools/wavedash.js       l integration Wavedash, sur la sortie terser
    node tools/audio.js          9 morceaux sur 32 mesures, plages de frequences

`tools/check.js` contrôle aussi deux invariants qui ont déjà régressé pendant le
développement: l'ordre de profondeur des créatures, qui doit se baser sur la
ligne de pieds, et le confinement des paillettes à l'intérieur de la salle.

Le mode `--min` et `tools/wavedash.js` existent parce qu'une option de
minification peut changer un calcul ou casser un appel d'API sans rien écrire
dans la console: le jeu marche alors depuis la source et pas depuis le ZIP.
Le double SDK de `tools/wavedash.js` refuse les mauvais types exactement comme
le vrai, et compte les appels réussis plutôt que de se contenter d'une console
silencieuse.

## Regenerer le GIF

`media/gameplay.gif` est capture, pas filme: le jeu tourne avec `Math.random`
a graine fixe et un pas de temps impose, donc deux captures donnent le meme
fichier. `tools/pilote-capture.js` avance dans les ecrans puis designe la
licorne, en appelant `tap(x, y)` comme le ferait un joueur.

## Wavedash

Le challenge est une case à cocher sur la même entrée js13k, pas une seconde
soumission. La plateforme injecte le global `Wavedash` avant le code du jeu:
`src/wavedash.js` ne charge rien, n'embarque rien, et reste entièrement inerte
ailleurs — sur js13kgames.com le jeu ne voit aucun global et se comporte
exactement pareil. Seul le bandeau de trophée, dessiné dans le canevas, reste
visible partout.

Les 9 trophées doivent exister dans le Developer Portal **avant** que le jeu ne
les déclenche: le SDK ignore en silence tout identifiant inconnu. Les importer
depuis `wavedash-achievements.json` (Achievements → Add achievement → Import
JSON), puis vérifier avec `wavedash achievement list`.

Le classement `night-score` est créé à la première partie gagnée, en ordre
décroissant, type nombre. Chaque salle gagnée rapporte:

    niveau x (secondes de musique epargnees + 200)

Le forfait de 200 fait qu'avancer paie toujours, même sur une trouvaille tardive;
le facteur `niveau` fait qu'une salle lointaine vaut bien plus qu'une salle
facile. Le total s'accumule sur la session, donc le classement récompense à la
fois la vitesse et la profondeur. Un joueur qui recommence indéfiniment la même
salle continue d'accumuler: c'est assumé, le coût en temps réel est sa limite.

## Budget

La limite du concours est de 13312 octets zippés.

`npm run release` imprime la taille obtenue. Ne pas se fier à un chiffre écrit
ici: roadroller cherche ses paramètres au hasard, et deux builds du même source
diffèrent de quelques dizaines d'octets. C'est pour cette raison que `release`
garde le meilleur de six tirages, et qu'il faut lire la taille du build qu'on
soumet plutôt qu'une valeur notée quelque part.

Coûts mesurés, utiles pour arbitrer:

    une salle (decor)            200 a 250 octets
    un morceau                    60 octets
    5 especes de creatures       108 octets
    motifs de pelage              93 octets
    accessoires de fete          159 octets
    9 trophees et le bandeau     ~390 octets
    le classement                 ~45 octets

## Laboratoires

`lab/` contient les prototypes qui ont servi à trancher les choix, hors budget.

    style-1-clubs.html          4 directions visuelles, discotheque
    style-2-mignons.html        4 directions visuelles, chibi et pastel
    style-3-autocollants.html   4 declinaisons de la direction retenue
    musique.html                les 9 morceaux, sequenceur editable
    audio-rnd.html              stereo, sidechain, reverbe, saturation, solo procedural

Le laboratoire audio permet d'activer chaque effet à la volée pour comparer.
Seules la réverbe et la saturation ont été intégrées au jeu.
