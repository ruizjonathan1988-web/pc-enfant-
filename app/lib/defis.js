'use strict';
// ======================================================================
// MES MAINS : des défis manuels ouverts, à faire loin de l'écran.
// Principe : une contrainte et des matériaux, jamais un modèle à recopier.
// Les contraintes des défis « construire » reprennent celles des défis
// sciences des écoles (cycles 2 et 3) : pont en papier, objet flottant…
// Pour chaque défi : le matériel précis, ce que fait l'adulte, la sécurité,
// des questions pour démarrer (pas de solution), un test pour mesurer,
// et « encore plus fort » pour recommencer autrement.
// ======================================================================

// Ce qu'on peut avoir à la maison : l'enfant coche ce qu'elle a.
const PLACARD = {
  papier: 'Feuilles de papier (brouillon)', journal: 'Vieux journaux ou magazines', carton: 'Cartons et boîtes (céréales, chaussures)',
  rouleaux: 'Rouleaux de papier toilette vides', bouteilles: 'Bouteilles en plastique vides', bouchons: 'Bouchons',
  scotch: 'Ruban adhésif (scotch)', colle: 'Colle (bâton ou colle blanche)', ciseaux: 'Ciseaux', feutres: 'Feutres et crayons de couleur',
  peinture: 'Peinture (gouache) et pinceaux', pate: 'Pâte à modeler', pailles: 'Pailles', elastiques: 'Élastiques',
  ficelle: 'Ficelle ou laine', batonnets: 'Bâtonnets de glace ou crayons', pinces: 'Pinces à linge', curedents: 'Cure-dents',
  spaghettis: 'Spaghettis crus', chamallows: 'Chamallows', farine: 'Farine et sel fin', sacs: 'Sacs plastique ou sachets congélation',
  alu: 'Papier aluminium', ballons: 'Ballons de baudruche', chenilles: 'Fils chenille (cure-pipes)', postit: 'Post-it',
  billes: 'Billes ou balle de ping-pong', figurines: 'Figurines (Lego, Playmobil…)', regle: 'Règle ou mètre ruban',
  nature: 'Feuilles, cailloux, brindilles (dehors)', oeufs: 'Œufs', cuilleres: 'Cuillères en plastique', gobelets: 'Gobelets en carton ou plastique'
};

const CATEGORIES = {
  construire: { nom: 'Construire', e: '🏗️' }, modeler: { nom: 'Modeler', e: '🧱' }, papier: { nom: 'Papier et collage', e: '✂️' },
  art: { nom: 'Peindre et dessiner', e: '🎨' }, film: { nom: 'Pour mes films', e: '🎬' }, inventer: { nom: 'Inventer', e: '💡' }
};

// Les 5 étapes de l'ingénieur, rappelées sur chaque défi « construire » et « inventer ».
const METHODE = [
  'Imagine : dessine au moins deux idées sur une feuille avant de toucher au matériel.',
  'Construis ton idée préférée.',
  'Teste-la, pour de vrai.',
  'Améliore : change une seule chose, puis reteste. Rater, c’est apprendre ce qui ne marche pas !',
  'Photographie ta création et raconte ce que tu as changé.'
];

const DEFIS = [
  // ---------------- Construire ----------------
  {
    id: 'pont-papier', cat: 'construire', e: '🌉', titre: 'Le pont de papier', duree: 40, niveau: 2,
    defi: 'Construis un pont en papier qui enjambe une rivière de 30 cm et qui porte un paquet de 500 g.',
    contraintes: ['Seulement du papier et du scotch : 10 feuilles au maximum, 50 cm de scotch au maximum.', 'Le pont ne doit pas toucher la « rivière » (la table entre les deux piles).', 'Le paquet doit tenir au moins 10 secondes.'],
    materiel: [{ id: 'papier', txt: '10 feuilles A4 de brouillon' }, { id: 'scotch', txt: '50 cm de scotch (mesure-le avant !)' }, { id: 'regle', txt: 'Une règle' }, { txt: 'Deux piles de livres de même hauteur, écartées de 30 cm' }, { txt: 'Un paquet de 500 g (pâtes, riz, sucre)' }],
    aide: ['Une feuille posée à plat tient-elle ? Et si tu la plies en accordéon, ou si tu la roules en tube ?', 'Où le pont plie-t-il en premier ? C’est là qu’il faut le renforcer.', 'Les vrais ponts ont des arches, des poutres, des câbles… lequel peux-tu faire en papier ?'],
    test: 'Pose le paquet au milieu du pont et compte jusqu’à 10.', mesure: { nom: 'Poids porté', unite: 'g' },
    plusFort: ['Rivière de 50 cm et 2 kg (deux paquets d’un kilo) : c’est le défi des CM1-CM2 !', 'Le même pont avec seulement 5 feuilles.', 'Un pont assez haut pour qu’une petite voiture passe dessous.']
  },
  {
    id: 'tour-spaghettis', cat: 'construire', e: '🗼', titre: 'La tour spaghettis-chamallow', duree: 25, niveau: 2,
    defi: 'Construis la tour la plus haute possible qui tient toute seule, avec un chamallow tout en haut.',
    contraintes: ['20 spaghettis, 1 mètre de scotch, 1 mètre de ficelle, 1 chamallow : rien d’autre.', '18 minutes chrono pour construire.', 'Le chamallow doit être au sommet et la tour ne doit pas être tenue ni scotchée à la table.'],
    materiel: [{ id: 'spaghettis', txt: '20 spaghettis crus' }, { id: 'chamallows', txt: '1 chamallow (plus quelques-uns pour les jointures si tu veux)' }, { id: 'scotch', txt: '1 mètre de scotch' }, { id: 'ficelle', txt: '1 mètre de ficelle' }, { id: 'ciseaux', txt: 'Des ciseaux' }, { id: 'regle', txt: 'Un mètre pour mesurer' }],
    aide: ['Un triangle se déforme-t-il quand tu appuies dessus ? Et un carré ?', 'Une base large, ça aide ou pas ?', 'Le chamallow est plus lourd qu’il n’en a l’air : teste tôt avec lui !'],
    test: 'Mesure du bas de la table jusqu’au haut du chamallow.', mesure: { nom: 'Hauteur', unite: 'cm' },
    plusFort: ['Recommence en gardant ton meilleur « truc » de construction.', 'Défie quelqu’un de la famille : chacun sa tour, même matériel.', 'Sans scotch, seulement des chamallows pour les jointures.']
  },
  {
    id: 'bateau-charge', cat: 'construire', e: '⛵', titre: 'Le bateau qui porte une cargaison', duree: 40, niveau: 2,
    defi: 'Fabrique un bateau avec des objets de récupération qui flotte au moins une minute avec une cargaison de 500 g.',
    contraintes: ['Seulement des matériaux de récupération (bouteilles, bouchons, barquettes, pailles, carton…).', 'La cargaison doit rester sèche dans le bateau.', 'Une minute sans couler.'],
    materiel: [{ id: 'bouteilles', txt: 'Bouteilles en plastique vides (avec leur bouchon)' }, { id: 'bouchons', txt: 'Des bouchons' }, { id: 'pailles', txt: 'Des pailles' }, { id: 'scotch', txt: 'Du scotch' }, { id: 'sacs', txt: 'Un sachet congélation pour la cargaison' }, { txt: '500 g de cargaison : billes, pièces, cailloux ou riz dans le sachet' }, { txt: 'Une bassine ou la baignoire (avec un adulte)' }],
    adulte: 'Un adulte reste à côté quand il y a de l’eau (baignoire ou bassine).',
    aide: ['Qu’est-ce qui flotte bien chez toi ? Fais d’abord des essais avec un seul objet.', 'La cargaison au milieu ou sur le côté : qu’est-ce qui change ?', 'Ton bateau penche ? Comment l’équilibrer ?'],
    test: 'Pose la cargaison, lance le chrono : une minute sans couler.', mesure: { nom: 'Cargaison portée', unite: 'g' },
    plusFort: ['1 kg de cargaison : c’est le défi des CM1-CM2.', 'Un bateau qui avance tout seul (ballon, élastique…).', 'Le bateau le plus petit possible qui porte 500 g.']
  },
  {
    id: 'parachute', cat: 'construire', e: '🪂', titre: 'Le parachute le plus lent', duree: 30, niveau: 1,
    defi: 'Fabrique un parachute pour une figurine : elle doit descendre le plus lentement possible.',
    contraintes: ['On lâche toujours de la même hauteur : bras tendu, debout sur le sol (jamais sur une chaise ou un balcon).', 'La figurine doit arriver en un seul morceau !'],
    materiel: [{ id: 'figurines', txt: 'Une petite figurine (Lego, Playmobil)' }, { id: 'sacs', txt: 'Un sac plastique à découper, ou un mouchoir en papier' }, { id: 'ficelle', txt: 'Ficelle ou fil (environ 1 mètre)' }, { id: 'scotch', txt: 'Du scotch' }, { id: 'ciseaux', txt: 'Des ciseaux' }, { txt: 'Un chronomètre (celui de Flocon ou d’un téléphone)' }],
    aide: ['Un grand parachute ou un petit : lequel descend le moins vite ?', 'Et si tu fais un petit trou au milieu ?', 'Les fils doivent-ils tous avoir la même longueur ?'],
    test: 'Lâche trois fois et garde le meilleur temps.', mesure: { nom: 'Temps de descente', unite: 's' },
    plusFort: ['Un parachute pour deux figurines.', 'Le parachute qui atterrit le plus près d’une cible (une assiette par terre).', 'Essaie trois matières différentes et compare.']
  },
  {
    id: 'oeuf-protege', cat: 'construire', e: '🥚', titre: 'Sauvez l’œuf !', duree: 45, niveau: 3,
    defi: 'Invente une protection pour qu’un œuf cru survive à une chute d’un mètre.',
    contraintes: ['L’œuf reste dans un sachet congélation fermé (pas de dégât !).', 'Pas de coussin ni de tapis par terre : seule ta protection compte.', 'Chute d’un mètre exactement, mesurée avec la règle.'],
    materiel: [{ id: 'oeufs', txt: '1 œuf cru (et un deuxième pour retenter)' }, { id: 'sacs', txt: 'Un sachet congélation qui ferme' }, { id: 'pailles', txt: 'Des pailles' }, { id: 'papier', txt: 'Du papier' }, { id: 'scotch', txt: 'Du scotch' }, { id: 'carton', txt: 'Du carton' }, { id: 'elastiques', txt: 'Des élastiques' }, { id: 'regle', txt: 'Un mètre' }],
    adulte: 'Demande à un adulte avant de prendre les œufs, et fais le test au-dessus d’un sol facile à nettoyer.',
    aide: ['Qu’est-ce qui amortit un choc : quelque chose de dur ou de mou ?', 'Est-ce que ralentir la chute pourrait aider ?', 'Comment empêcher l’œuf de bouger dans sa protection ?'],
    test: 'Lâche d’un mètre, ouvre le sachet : l’œuf est-il entier ?',
    plusFort: ['La protection la plus légère possible.', 'Deux mètres de chute (avec un adulte qui lâche).', 'Seulement avec du papier et du scotch.']
  },
  {
    id: 'catapulte', cat: 'construire', e: '🎯', titre: 'La catapulte de précision', duree: 35, niveau: 2,
    defi: 'Construis une catapulte qui envoie une boulette de papier dans un gobelet posé à 1 mètre.',
    contraintes: ['Seulement des projectiles mous : boulettes de papier ou de papier alu.', 'On ne vise jamais une personne ni un animal.', 'Trois essais par réglage.'],
    materiel: [{ id: 'cuilleres', txt: 'Une cuillère en plastique' }, { id: 'batonnets', txt: '6 à 10 bâtonnets de glace (ou crayons)' }, { id: 'elastiques', txt: 'Des élastiques' }, { id: 'alu', txt: 'Papier alu ou papier pour les boulettes' }, { id: 'gobelets', txt: 'Un gobelet comme cible' }, { id: 'regle', txt: 'Un mètre' }],
    aide: ['Plus le bras est long, plus ça va loin ?', 'Où mettre l’élastique pour plus de force ?', 'Comment faire pour tirer toujours pareil ?'],
    test: 'Sur 10 tirs, combien tombent dans le gobelet ?', mesure: { nom: 'Tirs réussis sur 10', unite: '' },
    plusFort: ['Cible à 2 mètres.', 'Une catapulte qui tire par-dessus un obstacle (une boîte).', 'Invente un jeu à deux avec ta catapulte.']
  },
  {
    id: 'voiture-ballon', cat: 'construire', e: '🏎️', titre: 'La voiture à réaction', duree: 50, niveau: 3,
    defi: 'Fabrique une voiture qui avance toute seule grâce à l’air d’un ballon.',
    contraintes: ['Elle doit rouler au moins 1 mètre en ligne droite.', 'Pas de moteur, pas de pile : seulement l’air du ballon.'],
    materiel: [{ id: 'bouteilles', txt: 'Une petite bouteille ou une boîte en carton pour le corps' }, { id: 'bouchons', txt: '4 bouchons pour les roues' }, { id: 'pailles', txt: '3 pailles' }, { id: 'batonnets', txt: '2 piques à brochette pour les essieux' }, { id: 'ballons', txt: 'Un ballon de baudruche' }, { id: 'scotch', txt: 'Du scotch' }, { id: 'elastiques', txt: 'Un élastique' }],
    adulte: 'Un adulte perce le centre des bouchons (avec la pointe des ciseaux ou un clou) et coupe les pointes des piques à brochette.',
    aide: ['Les roues doivent tourner librement : l’essieu peut passer dans une paille.', 'Où fixer le ballon pour que la voiture aille tout droit ?', 'Une voiture légère ou lourde : laquelle va le plus loin ?'],
    test: 'Gonfle, pose, lâche : mesure la distance parcourue.', mesure: { nom: 'Distance', unite: 'cm' },
    plusFort: ['Une course contre quelqu’un de la famille.', 'Une voiture qui porte une figurine sans la faire tomber.', 'Essaie avec un élastique à la place du ballon.']
  },
  {
    id: 'reaction-chaine', cat: 'construire', e: '⚙️', titre: 'La réaction en chaîne', duree: 60, niveau: 3,
    defi: 'Invente une machine en chaîne : une seule pichenette au départ, et au moins 5 étapes s’enchaînent toutes seules jusqu’à faire tomber un objet dans un gobelet.',
    contraintes: ['Une seule action de ta main au départ.', 'Au moins 5 étapes différentes (pas 5 dominos !).', 'Rien de fragile, rien de lourd qui tombe.'],
    materiel: [{ id: 'billes', txt: 'Une bille ou une balle de ping-pong' }, { id: 'rouleaux', txt: 'Rouleaux en carton pour faire des toboggans' }, { id: 'carton', txt: 'Boîtes, couvercles, carton' }, { id: 'figurines', txt: 'Petites voitures, dominos, Lego' }, { id: 'scotch', txt: 'Du scotch' }, { txt: 'Des livres pour faire des pentes' }, { id: 'gobelets', txt: 'Un gobelet pour l’arrivée' }],
    aide: ['Qu’est-ce qui peut rouler, glisser, tomber, basculer, pousser ?', 'Construis et teste étape par étape, pas tout d’un coup.', 'Quelle étape rate le plus ? Concentre-toi sur elle.'],
    test: 'Tout doit marcher d’un seul coup, du début à la fin.', mesure: { nom: 'Nombre d’étapes', unite: '' },
    plusFort: ['Filme-la avec Flocon : une réaction en chaîne, c’est magnifique au ralenti !', '10 étapes.', 'Une machine qui fait sonner une clochette à la fin.']
  },
  {
    id: 'pince-attrape', cat: 'construire', e: '🦾', titre: 'La pince attrape-tout', duree: 30, niveau: 2,
    defi: 'Fabrique un outil pour attraper une balle de ping-pong et la mettre dans un gobelet, sans jamais toucher la balle avec tes mains.',
    contraintes: ['Ton outil doit mesurer au moins 30 cm de long.', 'La balle part du sol et arrive dans le gobelet posé sur la table.'],
    materiel: [{ id: 'batonnets', txt: '4 bâtonnets ou crayons' }, { id: 'pinces', txt: '2 pinces à linge' }, { id: 'elastiques', txt: 'Des élastiques' }, { id: 'pailles', txt: 'Des pailles' }, { id: 'scotch', txt: 'Du scotch' }, { id: 'billes', txt: 'Une balle de ping-pong' }, { id: 'gobelets', txt: 'Un gobelet' }],
    aide: ['Pincer, cuillère, griffe, lasso… quelle idée te plaît ?', 'Comment ouvrir et fermer ta pince de loin ?'],
    test: 'Combien de balles déplaces-tu en une minute ?', mesure: { nom: 'Balles en une minute', unite: '' },
    plusFort: ['Attrape trois objets différents : une balle, un bouchon, une gomme.', 'Une pince qui marche avec une seule main.']
  },
  {
    id: 'labyrinthe', cat: 'construire', e: '🌀', titre: 'Le labyrinthe à bille', duree: 45, niveau: 2,
    defi: 'Fabrique un labyrinthe dans une boîte : on penche la boîte pour guider la bille du départ à l’arrivée.',
    contraintes: ['Au moins 3 culs-de-sac pour piéger les joueurs.', 'Au moins un « trou piège » où la bille peut tomber.'],
    materiel: [{ id: 'carton', txt: 'Un couvercle de boîte à chaussures (ou une boîte plate)' }, { id: 'pailles', txt: 'Des pailles coupées pour les murs' }, { id: 'colle', txt: 'De la colle blanche ou du scotch' }, { id: 'ciseaux', txt: 'Des ciseaux' }, { id: 'billes', txt: 'Une bille' }, { id: 'feutres', txt: 'Des feutres pour départ et arrivée' }],
    adulte: 'Pour le trou piège dans le carton : un adulte le découpe.',
    aide: ['Dessine d’abord ton chemin au crayon dans la boîte.', 'Fais tester par quelqu’un : trop facile ? trop dur ?'],
    test: 'Chronomètre quelqu’un de la famille. Le labyrinthe est réussi si on y arrive, mais pas trop vite !', mesure: { nom: 'Meilleur temps', unite: 's' },
    plusFort: ['Un labyrinthe à deux étages.', 'Un labyrinthe sur le thème d’une histoire (château, espace…).']
  },
  {
    id: 'maison-vent', cat: 'construire', e: '🐷', titre: 'La maison du troisième petit cochon', duree: 35, niveau: 1,
    defi: 'Construis une maison qui résiste au souffle du loup (un sèche-cheveux réglé sur froid).',
    contraintes: ['La maison doit faire au moins 15 cm de haut.', 'Un cochon (une figurine) doit pouvoir rentrer dedans.', 'Le loup souffle 10 secondes, à 30 cm.'],
    materiel: [{ id: 'papier', txt: 'Du papier' }, { id: 'curedents', txt: 'Des cure-dents' }, { id: 'pate', txt: 'De la pâte à modeler' }, { id: 'carton', txt: 'Du carton' }, { id: 'scotch', txt: 'Du scotch' }, { id: 'figurines', txt: 'Une figurine' }, { txt: 'Un sèche-cheveux (position froid)' }],
    adulte: 'Un adulte tient le sèche-cheveux, toujours en position froid.',
    aide: ['Où le vent pousse-t-il le plus fort ?', 'Une maison lourde ou légère, haute ou basse ?', 'Comment l’accrocher au sol ?'],
    test: '10 secondes de souffle : la maison est-elle toujours debout ?',
    plusFort: ['Souffle plus près : 15 cm.', 'Une maison avec une porte qui s’ouvre.', 'Seulement en papier.']
  },
  {
    id: 'avion-papier', cat: 'construire', e: '✈️', titre: 'Le champion des avions en papier', duree: 25, niveau: 1,
    defi: 'Invente un avion en papier qui vole le plus loin possible… puis un autre qui reste le plus longtemps en l’air.',
    contraintes: ['Une seule feuille A4 par avion.', 'Pas de scotch, pas de trombone : seulement des plis.', 'Trois lancers, on garde le meilleur.'],
    materiel: [{ id: 'papier', txt: 'Des feuilles A4' }, { id: 'regle', txt: 'Un mètre ruban' }, { txt: 'Un chronomètre' }, { txt: 'Un grand espace (couloir, jardin)' }],
    aide: ['Un avion pointu et un avion aux grandes ailes : lequel va le plus loin ? Lequel plane ?', 'Et si tu relèves un tout petit peu l’arrière des ailes ?'],
    test: 'Mesure la distance, puis chronomètre le vol.', mesure: { nom: 'Distance', unite: 'cm' },
    plusFort: ['Un avion qui fait une boucle.', 'Un avion qui atterrit dans un carton.', 'Le plus petit avion qui vole.']
  },

  // ---------------- Modeler ----------------
  {
    id: 'pate-sel', cat: 'modeler', e: '🧂', titre: 'La créature en pâte à sel', duree: 45, niveau: 1,
    defi: 'Fabrique ta pâte à sel, puis modèle un animal qui n’existe pas. Donne-lui un nom et un super-pouvoir.',
    contraintes: ['Ton animal mélange au moins deux animaux (un lapin-poisson, un chat-papillon…).', 'Pas plus épais qu’un doigt, sinon il ne cuira pas bien.'],
    materiel: [{ id: 'farine', txt: 'La recette : 2 verres de farine, 1 verre de sel fin, 1 verre d’eau tiède' }, { txt: 'Un grand saladier et une cuillère' }, { txt: 'Du papier cuisson et une plaque' }, { id: 'curedents', txt: 'Un cure-dents et une fourchette pour les détails' }, { id: 'peinture', txt: 'De la gouache pour peindre après la cuisson' }],
    adulte: 'La cuisson, c’est l’adulte : laisser sécher 12 à 24 heures à l’air, puis four doux entre 75 et 100 °C (plus chaud, ça gonfle), environ une heure par centimètre d’épaisseur. On sort la pièce quand elle est dure.',
    aide: ['Mélange le sel et la farine, puis ajoute l’eau petit à petit. Trop collant ? Un peu de farine. Trop sec ? Un peu d’eau.', 'Pour coller deux morceaux : mouille un tout petit peu avec le doigt.', 'Quel est son super-pouvoir ? Ça peut changer sa forme !'],
    test: 'Présente ta créature à la famille : nom, super-pouvoir, où elle vit.',
    plusFort: ['Toute une famille de créatures.', 'Un décor en pâte à sel pour tes créatures.', 'Une créature qui tient debout toute seule.']
  },
  {
    id: 'personnage-film', cat: 'modeler', e: '🎭', titre: 'Mon acteur en pâte à modeler', duree: 40, niveau: 2, film: true,
    defi: 'Crée un personnage en pâte à modeler qui tient debout tout seul et dont on peut bouger les bras : ce sera l’acteur de ton prochain film.',
    contraintes: ['Il tient debout sans aide.', 'Ses bras et sa tête bougent sans se casser.', 'Pas plus grand que ta main.'],
    materiel: [{ id: 'pate', txt: 'De la pâte à modeler (plusieurs couleurs)' }, { id: 'chenilles', txt: '2 fils chenille pour le squelette' }, { id: 'curedents', txt: 'Un cure-dents pour les détails' }],
    aide: ['Un squelette en fil chenille à l’intérieur aide les bras à tenir.', 'De grands pieds plats, ou un socle ?', 'Fais deux bouches différentes : une contente, une surprise. Tu pourras les changer pendant le film !'],
    test: 'Fais-le marcher en 6 photos dans le studio de films.',
    plusFort: ['Un deuxième personnage pour qu’ils se parlent.', 'Un animal de compagnie pour ton personnage.', 'Plusieurs bouches pour le faire parler.']
  },
  {
    id: 'trois-rouleaux', cat: 'modeler', e: '🐉', titre: 'La bête aux trois rouleaux', duree: 30, niveau: 1,
    defi: 'Avec exactement 3 rouleaux de papier toilette, invente une créature, un véhicule ou une machine.',
    contraintes: ['3 rouleaux, ni plus ni moins.', 'Tu peux découper, plier, aplatir les rouleaux.', 'Ça doit avoir un nom.'],
    materiel: [{ id: 'rouleaux', txt: '3 rouleaux de papier toilette vides' }, { id: 'ciseaux', txt: 'Des ciseaux' }, { id: 'scotch', txt: 'Du scotch ou de la colle' }, { id: 'feutres', txt: 'Feutres ou peinture' }, { txt: 'Des petits trucs pour décorer (bouchons, laine, papier)' }],
    aide: ['Un rouleau aplati, découpé en spirale, ouvert en long… ça devient quoi ?', 'Pose les trois rouleaux de façons différentes : qu’est-ce que tu vois ?'],
    test: 'Raconte ce que fait ta création, en trois phrases.',
    plusFort: ['Recommence avec 3 bouchons.', 'Un défi pour quelqu’un de la famille : même matériel, chacun sa création.']
  },
  {
    id: 'robot-recup', cat: 'modeler', e: '🤖', titre: 'Le robot de récup', duree: 45, niveau: 1,
    defi: 'Construis un robot avec des emballages, avec un super-pouvoir et au moins une partie qui bouge.',
    contraintes: ['Seulement des emballages et des objets de récupération.', 'Au moins une partie qui bouge (bras, tête, antenne…).'],
    materiel: [{ id: 'carton', txt: 'Des boîtes (céréales, dentifrice, œufs)' }, { id: 'bouchons', txt: 'Des bouchons' }, { id: 'rouleaux', txt: 'Des rouleaux' }, { id: 'scotch', txt: 'Du scotch' }, { id: 'colle', txt: 'De la colle' }, { id: 'feutres', txt: 'Des feutres' }, { id: 'chenilles', txt: 'Des fils chenille pour les antennes' }],
    aide: ['Pour faire bouger un bras : une attache parisienne, une ficelle, un élastique ?', 'À quoi sert ton robot ? Ça peut décider de sa forme.'],
    test: 'Présente ton robot : son nom, son pouvoir, comment il bouge.',
    plusFort: ['Une famille de robots.', 'Un robot qui tient un crayon et « dessine » quand tu le bouges.']
  },

  // ---------------- Papier et collage ----------------
  {
    id: 'carte-popup', cat: 'papier', e: '💌', titre: 'La carte qui surprend', duree: 35, niveau: 2,
    defi: 'Fabrique une carte : quand on l’ouvre, quelque chose surgit !',
    contraintes: ['Le truc qui surgit doit se replier tout seul quand on referme.', 'Pour quelqu’un de vrai, à qui tu l’offriras.'],
    materiel: [{ id: 'papier', txt: '2 feuilles (une épaisse si possible)' }, { id: 'ciseaux', txt: 'Des ciseaux' }, { id: 'colle', txt: 'Un bâton de colle' }, { id: 'feutres', txt: 'Des feutres' }],
    aide: ['Le secret : plie une feuille en deux, fais deux petites coupes parallèles sur le pli, puis pousse la languette vers l’intérieur. C’est une marche !', 'Colle ton dessin sur la marche, pas sur le fond.', 'Deux marches de tailles différentes, ça donne quoi ?'],
    test: 'Ouvre-la et referme-la 5 fois : tout se replie bien ?',
    plusFort: ['Trois choses qui surgissent.', 'Un château pop-up.', 'Une carte avec une partie qui tourne.']
  },
  {
    id: 'collage-monstre', cat: 'papier', e: '👾', titre: 'Le monstre des magazines', duree: 30, niveau: 1,
    defi: 'Découpe des morceaux de vieux magazines (yeux, bouches, objets, couleurs) et compose une créature ou un paysage complètement fou.',
    contraintes: ['Au moins 10 morceaux découpés.', 'Pas de dessin : seulement du collage (tu pourras dessiner un décor à la fin).'],
    materiel: [{ id: 'journal', txt: 'Vieux magazines ou prospectus (demande lesquels on peut découper)' }, { id: 'ciseaux', txt: 'Des ciseaux' }, { id: 'colle', txt: 'Un bâton de colle' }, { id: 'papier', txt: 'Une feuille ou un carton comme support' }],
    adulte: 'Demande à un adulte quels magazines tu as le droit de découper.',
    aide: ['Cherche d’abord des formes, pas des choses : un pneu peut devenir un œil !', 'Pose tout avant de coller, puis bouge les morceaux.'],
    test: 'Invente le nom de ta créature et ce qu’elle mange.',
    plusFort: ['Une affiche de film pour ton prochain film d’animation.', 'Un paysage d’une planète inconnue.']
  },
  {
    id: 'mini-livre', cat: 'papier', e: '📖', titre: 'Mon mini-livre en une feuille', duree: 40, niveau: 2,
    defi: 'Avec une seule feuille A4 pliée, fabrique un vrai petit livre de 8 pages et écris-y une histoire illustrée.',
    contraintes: ['Une feuille, un seul coup de ciseaux.', 'Une couverture avec un titre et ton nom d’autrice.', 'Une histoire avec un début, un problème et une fin.'],
    materiel: [{ id: 'papier', txt: 'Une feuille A4' }, { id: 'ciseaux', txt: 'Des ciseaux' }, { id: 'feutres', txt: 'Des feutres et un crayon' }],
    aide: ['Le pliage, en 4 temps : 1) plie la feuille en 8 cases, puis déplie ; 2) plie-la en deux en rapprochant les deux petits côtés ; 3) en partant du pli, coupe sur la ligne du milieu, sur une seule case de long ; 4) déplie, plie en deux dans la longueur et pousse les deux bouts vers le centre : les pages se forment !', 'Écris d’abord ton histoire au brouillon, en 6 étapes.'],
    test: 'Lis ton livre à quelqu’un.',
    plusFort: ['Une bande dessinée de 8 pages.', 'Un livre-jeu : le lecteur choisit la suite.', 'Un livre documentaire sur ton animal préféré.']
  },
  {
    id: 'masque', cat: 'papier', e: '🎭', titre: 'Le masque d’un personnage inventé', duree: 40, niveau: 1,
    defi: 'Fabrique le masque d’un personnage qui n’existe dans aucun livre ni dans aucun film.',
    contraintes: ['Il doit tenir sur ton visage.', 'Il montre une émotion (joie, colère, surprise…).', 'Au moins un relief (quelque chose qui dépasse).'],
    materiel: [{ id: 'carton', txt: 'Du carton fin (boîte de céréales)' }, { id: 'ciseaux', txt: 'Des ciseaux' }, { id: 'elastiques', txt: 'Un élastique ou de la ficelle' }, { id: 'feutres', txt: 'Feutres ou peinture' }, { id: 'colle', txt: 'De la colle' }, { txt: 'Des petits trucs : plumes, laine, papier' }],
    adulte: 'Un adulte aide à percer les trous pour l’élastique et vérifie les trous des yeux.',
    aide: ['Mesure d’abord l’écart entre tes yeux avec une règle.', 'Le relief : papier plié en accordéon, rouleau, boule de papier…'],
    test: 'Mets-le et joue ton personnage : comment il parle ? comment il marche ?',
    plusFort: ['Filme ton personnage avec le masque.', 'Le masque de l’émotion contraire.']
  },

  // ---------------- Peindre et dessiner ----------------
  {
    id: 'peindre-sans-pinceau', cat: 'art', e: '🖌️', titre: 'Peindre sans pinceau', duree: 30, niveau: 1,
    defi: 'Fais un tableau sans aucun pinceau : avec au moins 4 outils bizarres de la maison.',
    contraintes: ['Interdit : pinceaux, doigts (au début !).', 'Au moins 4 outils différents.'],
    materiel: [{ id: 'peinture', txt: 'De la gouache (3 couleurs suffisent)' }, { id: 'papier', txt: 'Une grande feuille ou du carton' }, { txt: 'Des outils : vieille brosse à dents, fourchette, éponge, ficelle, bouchon, papier bulle, feuille d’arbre' }, { txt: 'Une vieille nappe ou du journal pour protéger la table' }],
    adulte: 'Un adulte prépare l’espace (protection de la table, vieux tee-shirt) et dit quels outils on peut salir.',
    aide: ['Quel outil fait des points ? des lignes ? des taches ?', 'Ficelle trempée dans la peinture, posée et tirée : essaie !'],
    test: 'Donne un titre à ton tableau, comme dans un musée.',
    plusFort: ['Un tableau avec une seule couleur et ses mélanges avec du blanc.', 'Peins en écoutant une musique : rapide, puis lente.']
  },
  {
    id: 'land-art', cat: 'art', e: '🍂', titre: 'Le land art', duree: 30, niveau: 1,
    defi: 'Dehors, crée une œuvre seulement avec ce que la nature te donne : feuilles, cailloux, brindilles, fleurs tombées.',
    contraintes: ['On ramasse seulement ce qui est déjà tombé : on n’arrache rien.', 'Une forme : spirale, cercle, dégradé de couleurs, visage…', 'On laisse tout sur place à la fin.'],
    materiel: [{ id: 'nature', txt: 'Feuilles, cailloux, brindilles, pommes de pin trouvées dehors' }, { txt: 'Le jardin, un parc ou la forêt, avec un adulte' }],
    adulte: 'Un adulte t’accompagne dehors.',
    aide: ['Trie d’abord par couleur, puis par taille.', 'Une spirale, c’est facile à agrandir : commence petit au centre.'],
    test: 'Photographie-la d’en haut, puis demande-toi ce qu’elle deviendra demain.',
    plusFort: ['Un dégradé du vert au rouge avec des feuilles d’automne.', 'Une œuvre qui raconte une histoire en 3 parties.', 'Anime-la dans le studio de films : elle peut pousser toute seule !']
  },
  {
    id: 'gribouillis', cat: 'art', e: '🌀', titre: 'Le gribouillis magique', duree: 20, niveau: 1,
    defi: 'Les yeux fermés, gribouille pendant 5 secondes. Ouvre les yeux et transforme ton gribouillis en créature, en objet ou en paysage.',
    contraintes: ['Tu ne gommes pas le gribouillis : il doit rester dans le dessin.', 'Fais-en au moins trois.'],
    materiel: [{ id: 'papier', txt: '3 feuilles' }, { id: 'feutres', txt: 'Un feutre noir et des couleurs' }],
    aide: ['Tourne la feuille dans tous les sens : qu’est-ce que tu vois ?', 'Une boucle peut devenir un œil, un nez, une roue…'],
    test: 'Montre le gribouillis seul à quelqu’un : devine-t-il ce que tu en as fait ?',
    plusFort: ['Gribouillis à deux : l’un gribouille, l’autre transforme.', 'Une histoire en 4 cases à partir de 4 gribouillis.']
  },
  {
    id: 'frottage', cat: 'art', e: '🔍', titre: 'La chasse aux textures', duree: 30, niveau: 1,
    defi: 'Pars à la chasse aux textures dans la maison avec un crayon et du papier (frottage), puis découpe-les pour faire un animal ou un paysage.',
    contraintes: ['Au moins 6 textures différentes.', 'Ton image finale n’utilise que des morceaux de frottage.'],
    materiel: [{ id: 'papier', txt: 'Du papier fin (brouillon)' }, { id: 'feutres', txt: 'Crayons de couleur ou craies grasses (couchés sur le côté)' }, { id: 'ciseaux', txt: 'Des ciseaux' }, { id: 'colle', txt: 'De la colle' }],
    aide: ['Pose la feuille sur une pièce, une feuille d’arbre, une semelle, une grille, et frotte doucement à plat.', 'Quelle texture ressemble à des écailles ? à de l’herbe ? à de l’eau ?'],
    test: 'Fais deviner à quelqu’un d’où vient chaque texture.',
    plusFort: ['Un poisson avec des écailles en frottage.', 'Une carte au trésor en textures.']
  },

  // ---------------- Pour mes films ----------------
  {
    id: 'diorama', cat: 'film', e: '🏰', titre: 'Le décor dans une boîte', duree: 60, niveau: 2, film: true,
    defi: 'Transforme une boîte à chaussures en décor pour ton prochain film : fond, sol et au moins 3 objets.',
    contraintes: ['La boîte couchée sur le côté : le fond devient le ciel ou le mur.', 'Au moins un objet au premier plan et un au fond (ça donne de la profondeur).', 'Ton personnage doit pouvoir y bouger.'],
    materiel: [{ id: 'carton', txt: 'Une boîte à chaussures' }, { id: 'peinture', txt: 'Peinture ou feutres' }, { id: 'papier', txt: 'Du papier de couleur' }, { id: 'ciseaux', txt: 'Des ciseaux' }, { id: 'colle', txt: 'De la colle' }, { id: 'pate', txt: 'Pâte à modeler pour faire tenir les objets' }, { id: 'nature', txt: 'Brindilles, cailloux, mousse (facultatif)' }],
    aide: ['Où se passe l’histoire ? Une forêt, une chambre, une planète ?', 'Les objets du fond peuvent être plus petits : on dirait qu’ils sont loin !'],
    test: 'Prends une photo avec la webcam de Flocon : est-ce qu’on y croit ?',
    plusFort: ['Une lumière (lampe de poche) pour faire le jour et la nuit.', 'Un décor qui change : une porte qui s’ouvre.']
  },
  {
    id: 'thaumatrope', cat: 'film', e: '🔄', titre: 'Le jouet qui trompe les yeux', duree: 20, niveau: 1, film: true,
    defi: 'Fabrique un thaumatrope : un disque avec un dessin de chaque côté qui, en tournant vite, deviennent une seule image. C’est l’ancêtre du dessin animé !',
    contraintes: ['Deux dessins qui vont ensemble mais séparés : l’oiseau d’un côté, la cage de l’autre… à toi d’inventer les tiens !'],
    materiel: [{ id: 'carton', txt: 'Du carton fin' }, { id: 'ciseaux', txt: 'Des ciseaux' }, { id: 'ficelle', txt: '2 morceaux de ficelle ou d’élastique' }, { id: 'feutres', txt: 'Des feutres' }, { txt: 'Un verre pour tracer un rond' }],
    adulte: 'Un adulte aide à percer les deux petits trous sur les côtés.',
    aide: ['Dessine le deuxième dessin à l’envers (tête en bas) : sinon il apparaît retourné !', 'Fais tourner la ficelle entre tes doigts, très vite.'],
    test: 'Montre-le à quelqu’un : voit-il l’image réunie ?',
    plusFort: ['Un poisson et son bocal, un visage et un chapeau…', 'Fais-en trois et filme-les.']
  },
  {
    id: 'folioscope', cat: 'film', e: '📒', titre: 'Le folioscope', duree: 45, niveau: 2, film: true,
    defi: 'Sur un bloc de post-it, dessine une petite animation : en feuilletant vite, ton dessin bouge !',
    contraintes: ['Au moins 20 pages.', 'Commence par la dernière page du bloc, et remonte.', 'Une action simple : une balle qui rebondit, une fleur qui pousse…'],
    materiel: [{ id: 'postit', txt: 'Un bloc de post-it (ou un petit carnet)' }, { id: 'feutres', txt: 'Un crayon et un feutre fin' }],
    aide: ['À chaque page, ton dessin bouge un tout petit peu, comme dans le studio de films.', 'Regarde par transparence la page d’en dessous pour te repérer.'],
    test: 'Feuillette-le devant quelqu’un.',
    plusFort: ['Photographie chaque page dans le studio : ça devient un vrai film !', '40 pages avec un personnage qui marche.']
  },
  {
    id: 'accessoires', cat: 'film', e: '🎩', titre: 'Les accessoires miniatures', duree: 40, niveau: 2, film: true,
    defi: 'Fabrique 5 accessoires à la taille de tes figurines pour ton prochain film.',
    contraintes: ['À la bonne taille pour une figurine (mesure-la avant !).', 'Au moins un meuble, un objet magique et un moyen de transport.'],
    materiel: [{ id: 'figurines', txt: 'Une figurine pour mesurer' }, { id: 'pate', txt: 'Pâte à modeler' }, { id: 'carton', txt: 'Petits cartons, bouchons, capsules' }, { id: 'alu', txt: 'Papier alu (parfait pour l’argent et les épées)' }, { id: 'ciseaux', txt: 'Des ciseaux' }, { id: 'colle', txt: 'De la colle' }],
    aide: ['Qu’est-ce qu’un bouchon pourrait devenir ? Une table, un chapeau, une roue ?', 'Le papier alu se modèle comme de la pâte !'],
    test: 'Pose tout dans un décor et prends une photo.',
    plusFort: ['Tout un intérieur de maison miniature.', 'Une voiture qui roule vraiment pour une figurine.']
  },

  // ---------------- Inventer ----------------
  {
    id: 'instrument', cat: 'inventer', e: '🎸', titre: 'L’instrument de récup', duree: 40, niveau: 2,
    defi: 'Invente un instrument de musique qui fait au moins deux sons différents : un aigu et un grave.',
    contraintes: ['Seulement des objets de récupération.', 'Deux sons qu’on peut choisir (pas au hasard).', 'Joue une petite mélodie à la fin.'],
    materiel: [{ id: 'carton', txt: 'Une boîte (mouchoirs, chaussures)' }, { id: 'elastiques', txt: 'Des élastiques de tailles différentes' }, { id: 'bouteilles', txt: 'Des bouteilles ou des verres avec plus ou moins d’eau' }, { id: 'pailles', txt: 'Des pailles' }, { id: 'rouleaux', txt: 'Des rouleaux' }, { id: 'scotch', txt: 'Du scotch' }, { txt: 'Riz, pâtes ou graines pour faire un hochet' }],
    aide: ['Un élastique très tendu ou peu tendu : quel son ?', 'Une bouteille presque pleine ou presque vide : quand tu souffles dessus, ou quand tu tapes ?', 'Une paille longue ou courte ?'],
    test: 'Enregistre ta mélodie avec « Ma voix » dans Flocon.',
    plusFort: ['Un instrument à 5 notes.', 'Un orchestre : invente un deuxième instrument pour quelqu’un de la famille.', 'Utilise ta musique dans ton film !']
  },
  {
    id: 'jeu-societe', cat: 'inventer', e: '🎲', titre: 'Mon jeu de société', duree: 60, niveau: 3,
    defi: 'Invente un vrai jeu de société, avec un plateau, des pions et des règles écrites, et fais-y jouer ta famille.',
    contraintes: ['Les règles tiennent sur une feuille et quelqu’un d’autre doit pouvoir les comprendre seul.', 'Il faut pouvoir gagner (et perdre !).', 'Au moins une case surprise.'],
    materiel: [{ id: 'carton', txt: 'Un grand carton pour le plateau' }, { id: 'feutres', txt: 'Des feutres' }, { id: 'bouchons', txt: 'Des bouchons pour les pions' }, { id: 'papier', txt: 'Du papier pour les cartes et les règles' }, { id: 'ciseaux', txt: 'Des ciseaux' }, { txt: 'Un dé (ou fabrique-le en papier)' }],
    aide: ['Quel est le but : arriver le premier, collecter, capturer ?', 'Joue une partie toute seule pour tester avant d’inviter la famille.', 'Qu’est-ce qui rend un jeu juste ? Et amusant ?'],
    test: 'Une partie en famille : à la fin, demande ce qu’ils changeraient.',
    plusFort: ['Version 2 avec les idées de la famille.', 'Un jeu où on joue tous ensemble contre le jeu.']
  },
  {
    id: 'invention-utile', cat: 'inventer', e: '💡', titre: 'L’invention qui aide', duree: 45, niveau: 3,
    defi: 'Trouve un petit problème de la maison (un câble qui traîne, des crayons perdus, des chaussettes seules…) et invente un objet qui le résout.',
    contraintes: ['Pose la question à quelqu’un de la famille : « Qu’est-ce qui t’embête ? »', 'Ton invention doit vraiment servir au moins une semaine.', 'Fais d’abord un plan avec des flèches et des légendes.'],
    materiel: [{ id: 'carton', txt: 'Carton, boîtes' }, { id: 'rouleaux', txt: 'Rouleaux' }, { id: 'scotch', txt: 'Du scotch' }, { id: 'colle', txt: 'De la colle' }, { id: 'ciseaux', txt: 'Des ciseaux' }, { id: 'elastiques', txt: 'Élastiques, pinces à linge, ficelle' }],
    aide: ['Observe : qui a le problème ? quand ? où ?', 'Ton invention doit être solide : qu’est-ce qui pourrait casser ?'],
    test: 'Dans une semaine, demande : est-ce que ça sert vraiment ?',
    plusFort: ['Une affiche publicitaire pour ton invention.', 'Une version améliorée avec ce que tu as appris.']
  }
];

// Vérification : utilisée par les tests, et au démarrage en mode développement.
function verifierDefis() {
  const ids = new Set(); const erreurs = [];
  for (const d of DEFIS) {
    if (ids.has(d.id)) erreurs.push('doublon ' + d.id); ids.add(d.id);
    if (!CATEGORIES[d.cat]) erreurs.push(d.id + ' : catégorie');
    if (!d.titre || !d.defi || !d.e) erreurs.push(d.id + ' : textes');
    if (!(d.duree > 0 && d.duree <= 90)) erreurs.push(d.id + ' : durée');
    if (![1, 2, 3].includes(d.niveau)) erreurs.push(d.id + ' : niveau');
    if (!Array.isArray(d.materiel) || d.materiel.length < 2) erreurs.push(d.id + ' : matériel');
    for (const m of d.materiel || []) if (m.id && !PLACARD[m.id]) erreurs.push(d.id + ' : placard ' + m.id);
    if (!Array.isArray(d.aide) || !d.aide.length) erreurs.push(d.id + ' : aide');
    if (!Array.isArray(d.contraintes) || !d.contraintes.length) erreurs.push(d.id + ' : contraintes');
    if (!d.test) erreurs.push(d.id + ' : test');
    if (!Array.isArray(d.plusFort) || !d.plusFort.length) erreurs.push(d.id + ' : plus fort');
  }
  return erreurs;
}

module.exports = { DEFIS, PLACARD, CATEGORIES, METHODE, verifierDefis };
