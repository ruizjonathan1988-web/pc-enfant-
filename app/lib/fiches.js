'use strict';
// Fiches de révision (CE2-CM1) et leçons « Bien utiliser les écrans ».
// Hors ligne, sans compte, sans publicité. À relire par un adulte : une erreur dans une fiche fait plus de mal qu'une absence.
// Chaque question : q, choix (2 à 4), bonne (indice du bon choix), pourquoi (la correction, montrée après la réponse).

const MATIERES = [
  { id: 'maths', nom: 'Maths', couleur: '#1F5FA8' },
  { id: 'francais', nom: 'Français', couleur: '#C2410C' },
  { id: 'sciences', nom: 'Sciences', couleur: '#2FA36B' }
];

const FICHES = [
  // ---------------------------------------------------------------- maths
  { id: 'm-numeration', matiere: 'maths', niveau: 'CE2', titre: 'Les nombres jusqu’à 10 000',
    retenir: ['Chaque chiffre a une valeur qui dépend de sa place : unités, dizaines, centaines, milliers.', '10 unités = 1 dizaine ; 10 dizaines = 1 centaine ; 10 centaines = 1 millier.', 'Pour comparer deux nombres, on regarde d’abord le nombre de chiffres, puis les chiffres de gauche à droite.'],
    exemple: '4 527 = 4 milliers + 5 centaines + 2 dizaines + 7 unités.',
    questions: [
      { q: 'Dans 3 815, quel est le chiffre des centaines ?', choix: ['3', '8', '1', '5'], bonne: 1, pourquoi: '3 815 : 3 milliers, 8 centaines, 1 dizaine, 5 unités.' },
      { q: '6 000 + 400 + 9 = ?', choix: ['6 490', '6 409', '649'], bonne: 1, pourquoi: '6 milliers, 4 centaines, 0 dizaine, 9 unités : 6 409.' },
      { q: 'Quel est le plus grand nombre ?', choix: ['2 099', '2 910', '2 901'], bonne: 1, pourquoi: 'Ils ont tous 2 milliers ; on compare les centaines : 9 dans 2 910 et 2 901, puis les dizaines : 1 contre 0.' }
    ] },
  { id: 'm-tables', matiere: 'maths', niveau: 'CE2', titre: 'Les tables de multiplication',
    retenir: ['L’ordre ne change rien : 3 × 7 = 7 × 3.', 'Multiplier un nombre entier par 10, c’est écrire un 0 à sa droite : 23 × 10 = 230.', 'La table de 5, c’est la moitié de la table de 10 : 5 × 8 = 40, la moitié de 80.'],
    exemple: '7 × 8 = 56 : « 5, 6, 7, 8 » (56 = 7 × 8).',
    questions: [
      { q: '7 × 8 = ?', choix: ['54', '56', '63'], bonne: 1, pourquoi: '7 × 8 = 56.' },
      { q: '6 × 9 = ?', choix: ['54', '56', '45'], bonne: 0, pourquoi: '6 × 9 = 54 (et 6 × 10 = 60, moins 6).' },
      { q: '9 × 4 = ?', choix: ['32', '36', '45'], bonne: 1, pourquoi: '9 × 4 = 36 (et 10 × 4 = 40, moins 4).' }
    ] },
  { id: 'm-addition', matiere: 'maths', niveau: 'CE2', titre: 'Additions et soustractions posées',
    retenir: ['On aligne les chiffres : unités sous les unités, dizaines sous les dizaines…', 'On commence toujours par la colonne des unités, à droite.', 'Quand une colonne dépasse 9, on garde la retenue pour la colonne suivante.'],
    exemple: '358 + 267 : 8 + 7 = 15, j’écris 5 et je retiens 1 ; 1 + 5 + 6 = 12, j’écris 2 et je retiens 1 ; 1 + 3 + 2 = 6. Résultat : 625.',
    questions: [
      { q: '358 + 267 = ?', choix: ['515', '625', '615'], bonne: 1, pourquoi: 'Avec les deux retenues : 625.' },
      { q: '503 − 128 = ?', choix: ['375', '425', '385'], bonne: 0, pourquoi: 'Vérification : 375 + 128 = 503.' },
      { q: '1 000 − 1 = ?', choix: ['900', '999', '990'], bonne: 1, pourquoi: 'Le nombre juste avant 1 000 est 999.' }
    ] },
  { id: 'm-multiplication', matiere: 'maths', niveau: 'CM1', titre: 'La multiplication posée',
    retenir: ['Pour multiplier par un nombre à deux chiffres, on fait deux multiplications puis on les additionne.', 'Quand on multiplie par les dizaines, on écrit d’abord un 0 dans la colonne des unités.', 'Pour vérifier, on peut arrondir : 46 × 23 est proche de 50 × 20 = 1 000.'],
    exemple: '46 × 23 = 46 × 3 + 46 × 20 = 138 + 920 = 1 058.',
    questions: [
      { q: '32 × 21 = ?', choix: ['672', '652', '96'], bonne: 0, pourquoi: '32 × 1 = 32 ; 32 × 20 = 640 ; 32 + 640 = 672.' },
      { q: '25 × 4 = ?', choix: ['90', '100', '125'], bonne: 1, pourquoi: '4 fois 25, c’est comme 4 pièces de 25 centimes : 100.' },
      { q: '15 × 12 = ?', choix: ['150', '170', '180'], bonne: 2, pourquoi: '15 × 10 = 150 ; 15 × 2 = 30 ; 150 + 30 = 180.' }
    ] },
  { id: 'm-division', matiere: 'maths', niveau: 'CM1', titre: 'La division',
    retenir: ['Diviser, c’est partager en parts égales ou chercher combien de fois un nombre entre dans un autre.', 'Dividende = diviseur × quotient + reste.', 'Le reste est toujours plus petit que le diviseur.'],
    exemple: '29 partagé en 4 : 4 × 7 = 28, il reste 1. Donc 29 = 4 × 7 + 1 (quotient 7, reste 1).',
    questions: [
      { q: '45 ÷ 5 = ?', choix: ['8', '9', '7'], bonne: 1, pourquoi: '5 × 9 = 45.' },
      { q: '17 bonbons pour 3 enfants : combien chacun, et combien en reste-t-il ?', choix: ['5 chacun, il en reste 2', '6 chacun, il en reste 1', '5 chacun, il en reste 1'], bonne: 0, pourquoi: '3 × 5 = 15, et 17 − 15 = 2.' },
      { q: 'Dans 30 = 4 × 7 + 2, quel est le reste ?', choix: ['4', '7', '2'], bonne: 2, pourquoi: 'Le reste, c’est ce qu’on ajoute à la fin : 2 (plus petit que 4).' }
    ] },
  { id: 'm-fractions', matiere: 'maths', niveau: 'CM1', titre: 'Les fractions',
    retenir: ['Le nombre du bas (dénominateur) dit en combien de parts égales on coupe.', 'Le nombre du haut (numérateur) dit combien de parts on prend.', 'Des fractions différentes peuvent être égales : 1/2 = 2/4 = 4/8.'],
    exemple: 'Une tarte coupée en 4 parts égales ; j’en mange 3 : j’ai mangé 3/4 de la tarte.',
    questions: [
      { q: 'Une pizza en 8 parts égales, j’en mange 3. Quelle fraction ai-je mangée ?', choix: ['3/8', '8/3', '3/5'], bonne: 0, pourquoi: '8 parts en tout (en bas), 3 mangées (en haut).' },
      { q: 'Quelle fraction est égale à 1/2 ?', choix: ['1/4', '4/8', '2/3'], bonne: 1, pourquoi: '4 parts sur 8, c’est la moitié.' },
      { q: 'Laquelle est la plus grande ?', choix: ['1/4', '3/4', '2/4'], bonne: 1, pourquoi: 'Même nombre de parts (4) : celle où l’on en prend le plus, 3.' }
    ] },
  { id: 'm-decimaux', matiere: 'maths', niveau: 'CM1', titre: 'Les nombres décimaux',
    retenir: ['Après la virgule : les dixièmes, puis les centièmes.', '1 dixième = 0,1 = 1/10 ; 1 centième = 0,01 = 1/100.', 'Pour comparer, on regarde d’abord la partie entière, puis les dixièmes, puis les centièmes.'],
    exemple: '3,25 = 3 unités, 2 dixièmes et 5 centièmes.',
    questions: [
      { q: 'Dans 12,48, quel est le chiffre des dixièmes ?', choix: ['2', '4', '8'], bonne: 1, pourquoi: 'Le premier chiffre après la virgule : 4.' },
      { q: 'Quelle écriture est égale à 0,5 ?', choix: ['5/100', '5/10', '1/5'], bonne: 1, pourquoi: '0,5 = 5 dixièmes = 5/10 (c’est aussi la moitié).' },
      { q: 'Quel est le plus grand nombre ?', choix: ['2,5', '2,45', '2,09'], bonne: 0, pourquoi: 'Même partie entière (2) ; dixièmes : 5, 4, 0. Donc 2,5.' }
    ] },
  { id: 'm-longueurs', matiere: 'maths', niveau: 'CE2', titre: 'Mesurer des longueurs',
    retenir: ['1 km = 1 000 m.', '1 m = 100 cm.', '1 cm = 10 mm.'],
    exemple: 'Un crayon de 15 cm, c’est 150 mm.',
    questions: [
      { q: '3 m = ?', choix: ['30 cm', '300 cm', '3 000 cm'], bonne: 1, pourquoi: '1 m = 100 cm, donc 3 m = 300 cm.' },
      { q: '2 km = ?', choix: ['200 m', '2 000 m', '20 000 m'], bonne: 1, pourquoi: '1 km = 1 000 m, donc 2 km = 2 000 m.' },
      { q: '45 mm = ?', choix: ['4 cm 5 mm', '45 cm', '4 m 5 cm'], bonne: 0, pourquoi: '40 mm = 4 cm, il reste 5 mm.' }
    ] },
  { id: 'm-durees', matiere: 'maths', niveau: 'CE2', titre: 'L’heure et les durées',
    retenir: ['1 jour = 24 heures.', '1 heure = 60 minutes.', '1 minute = 60 secondes.'],
    exemple: 'Un dessin animé de 14 h 15 à 15 h 45 dure 1 h 30 min.',
    questions: [
      { q: '1 h 30 min = ?', choix: ['130 min', '90 min', '80 min'], bonne: 1, pourquoi: '60 min + 30 min = 90 min.' },
      { q: 'Un film commence à 14 h 15 et finit à 15 h 45. Combien de temps dure-t-il ?', choix: ['1 h 30 min', '1 h 15 min', '1 h 45 min'], bonne: 0, pourquoi: 'De 14 h 15 à 15 h 15 : 1 h ; de 15 h 15 à 15 h 45 : 30 min.' },
      { q: '120 secondes = ?', choix: ['1 min 20 s', '2 min', '12 min'], bonne: 1, pourquoi: '60 s = 1 min, donc 120 s = 2 min.' }
    ] },
  { id: 'm-geometrie', matiere: 'maths', niveau: 'CE2', titre: 'Carrés, rectangles et périmètre',
    retenir: ['Un carré a 4 côtés égaux et 4 angles droits.', 'Un rectangle a 4 angles droits ; ses côtés opposés sont égaux deux à deux.', 'Le périmètre, c’est la longueur du tour de la figure.'],
    exemple: 'Rectangle de 6 cm sur 3 cm : périmètre = 6 + 3 + 6 + 3 = 18 cm.',
    questions: [
      { q: 'Quel est le périmètre d’un carré de 5 cm de côté ?', choix: ['10 cm', '20 cm', '25 cm'], bonne: 1, pourquoi: '4 côtés de 5 cm : 5 + 5 + 5 + 5 = 20 cm.' },
      { q: 'Combien d’angles droits a un rectangle ?', choix: ['2', '3', '4'], bonne: 2, pourquoi: 'Ses 4 angles sont droits.' },
      { q: 'Périmètre d’un rectangle de 6 cm sur 3 cm ?', choix: ['9 cm', '18 cm', '12 cm'], bonne: 1, pourquoi: '6 + 3 + 6 + 3 = 18 cm.' }
    ] },
  // ---------------------------------------------------------------- français
  { id: 'f-classes', matiere: 'francais', niveau: 'CE2', titre: 'Nom, verbe, adjectif, déterminant',
    retenir: ['Le nom désigne une personne, un animal, une chose ou une idée.', 'Le verbe dit ce que l’on fait ou ce qui se passe ; il se conjugue.', 'L’adjectif dit comment est le nom ; le déterminant se place devant le nom (le, une, mes…).'],
    exemple: 'Le (déterminant) petit (adjectif) chat (nom) dort (verbe).',
    questions: [
      { q: 'Dans « La grande girafe mange », quel est le verbe ?', choix: ['grande', 'girafe', 'mange'], bonne: 2, pourquoi: '« mange » se conjugue : je mange, nous mangeons.' },
      { q: 'Dans « un ciel bleu », quel est l’adjectif ?', choix: ['un', 'ciel', 'bleu'], bonne: 2, pourquoi: '« bleu » dit comment est le ciel.' },
      { q: 'Lequel est un déterminant ?', choix: ['les', 'joli', 'courir'], bonne: 0, pourquoi: '« les » se place devant un nom : les livres.' }
    ] },
  { id: 'f-accord-gn', matiere: 'francais', niveau: 'CE2', titre: 'Les accords dans le groupe nominal',
    retenir: ['Le déterminant et l’adjectif s’accordent avec le nom : en genre (masculin, féminin) et en nombre (singulier, pluriel).', 'Au pluriel, on ajoute souvent un -s.', 'Au féminin, on ajoute souvent un -e.'],
    exemple: 'un petit chat → des petits chats ; une petite chatte → des petites chattes.',
    questions: [
      { q: 'Quelle écriture est juste ?', choix: ['des fleur rouge', 'des fleurs rouges', 'des fleurs rouge'], bonne: 1, pourquoi: 'Pluriel : fleurs et rouges prennent un -s.' },
      { q: 'Une robe … ', choix: ['vert', 'verte', 'verts'], bonne: 1, pourquoi: '« robe » est féminin singulier : verte.' },
      { q: 'Quelle écriture est juste ?', choix: ['les petit chats', 'les petits chat', 'les petits chats'], bonne: 2, pourquoi: 'Tout le groupe est au pluriel.' }
    ] },
  { id: 'f-sujet-verbe', matiere: 'francais', niveau: 'CE2', titre: 'L’accord du verbe avec le sujet',
    retenir: ['Le verbe s’accorde avec son sujet.', 'Pour trouver le sujet, on pose la question « Qui est-ce qui… ? » ou on l’encadre par « C’est … qui ».', 'Avec « ils » ou « elles », le verbe en -er se termine par -ent (qui ne s’entend pas).'],
    exemple: 'Les enfants jouent. → Ce sont les enfants qui jouent.',
    questions: [
      { q: 'Les enfants …', choix: ['joue', 'jouent', 'joues'], bonne: 1, pourquoi: 'Sujet pluriel (ils) : jouent.' },
      { q: 'Quel est le sujet dans « Le matin, mes parents boivent du café » ?', choix: ['Le matin', 'mes parents', 'du café'], bonne: 1, pourquoi: 'Ce sont mes parents qui boivent.' },
      { q: 'Tu …', choix: ['chante', 'chantes', 'chantent'], bonne: 1, pourquoi: 'Avec « tu », le verbe se termine par -s.' }
    ] },
  { id: 'f-present', matiere: 'francais', niveau: 'CE2', titre: 'Le présent : -er, être et avoir',
    retenir: ['Verbes en -er : je chante, tu chantes, il chante, nous chantons, vous chantez, ils chantent.', 'Être : je suis, tu es, il est, nous sommes, vous êtes, ils sont.', 'Avoir : j’ai, tu as, il a, nous avons, vous avez, ils ont.'],
    exemple: 'Nous sommes en classe et nous avons un exposé.',
    questions: [
      { q: 'Vous (chanter) …', choix: ['chantez', 'chantons', 'chantent'], bonne: 0, pourquoi: 'Avec « vous » : -ez.' },
      { q: 'Ils (être) …', choix: ['ont', 'sont', 'est'], bonne: 1, pourquoi: 'Être : ils sont.' },
      { q: 'Tu (avoir) …', choix: ['as', 'a', 'es'], bonne: 0, pourquoi: 'Avoir : tu as.' }
    ] },
  { id: 'f-imparfait', matiere: 'francais', niveau: 'CM1', titre: 'L’imparfait',
    retenir: ['L’imparfait raconte ce qui durait ou se répétait dans le passé.', 'Terminaisons pour tous les verbes : -ais, -ais, -ait, -ions, -iez, -aient.', 'Être : j’étais ; avoir : j’avais.'],
    exemple: 'Quand j’étais petite, je jouais souvent dans le jardin.',
    questions: [
      { q: 'Je (jouer) … à l’imparfait', choix: ['jouais', 'jouait', 'jouerai'], bonne: 0, pourquoi: 'Avec « je » : -ais.' },
      { q: 'Nous (aller) … à l’imparfait', choix: ['allons', 'allions', 'irons'], bonne: 1, pourquoi: 'Avec « nous » : -ions.' },
      { q: 'Ils (être) … à l’imparfait', choix: ['étaient', 'seront', 'sont'], bonne: 0, pourquoi: 'Avec « ils » : -aient.' }
    ] },
  { id: 'f-futur', matiere: 'francais', niveau: 'CM1', titre: 'Le futur',
    retenir: ['Le futur dit ce qui se passera plus tard.', 'Terminaisons : -ai, -as, -a, -ons, -ez, -ont.', 'Verbes en -er : l’infinitif + la terminaison (je chanterai). Être : je serai ; avoir : j’aurai ; aller : j’irai ; faire : je ferai.'],
    exemple: 'Demain, nous irons au musée et nous ferons des photos.',
    questions: [
      { q: 'Tu (chanter) … au futur', choix: ['chanteras', 'chantais', 'chanteront'], bonne: 0, pourquoi: 'chanter + -as.' },
      { q: 'Nous (être) … au futur', choix: ['étions', 'serons', 'sommes'], bonne: 1, pourquoi: 'Être au futur : nous serons.' },
      { q: 'Ils (faire) … au futur', choix: ['faisaient', 'feront', 'font'], bonne: 1, pourquoi: 'Faire au futur : ils feront.' }
    ] },
  { id: 'f-a', matiere: 'francais', niveau: 'CE2', titre: 'a ou à ?',
    retenir: ['« a » est le verbe avoir : on peut le remplacer par « avait ».', '« à » est un petit mot invariable : on ne peut pas le remplacer par « avait ».'],
    exemple: 'Il a (avait) un vélo. Je vais à la piscine (« je vais avait la piscine » ne veut rien dire).',
    questions: [
      { q: 'Il … un chat.', choix: ['a', 'à'], bonne: 0, pourquoi: 'Il avait un chat : c’est le verbe avoir.' },
      { q: 'Je vais … la piscine.', choix: ['a', 'à'], bonne: 1, pourquoi: 'On ne peut pas dire « avait la piscine ».' },
      { q: 'Elle … faim.', choix: ['a', 'à'], bonne: 0, pourquoi: 'Elle avait faim.' }
    ] },
  { id: 'f-et', matiere: 'francais', niveau: 'CE2', titre: 'et ou est ?',
    retenir: ['« est » est le verbe être : on peut le remplacer par « était ».', '« et » relie deux mots ou deux idées : on peut le remplacer par « et puis ».'],
    exemple: 'Le chat est (était) noir et (et puis) blanc.',
    questions: [
      { q: 'Le ciel … bleu.', choix: ['et', 'est'], bonne: 1, pourquoi: 'Le ciel était bleu.' },
      { q: 'Paul … Léa jouent.', choix: ['et', 'est'], bonne: 0, pourquoi: 'Paul et puis Léa.' },
      { q: 'Il … grand … fort.', choix: ['est … et', 'et … est', 'est … est'], bonne: 0, pourquoi: 'Il était grand et puis fort.' }
    ] },
  { id: 'f-son', matiere: 'francais', niveau: 'CE2', titre: 'son ou sont ?',
    retenir: ['« sont » est le verbe être : on peut le remplacer par « étaient ».', '« son » est un déterminant (le sien) : on peut le remplacer par « mon ».'],
    exemple: 'Ils sont (étaient) partis avec son (mon) ballon.',
    questions: [
      { q: 'Ils … partis.', choix: ['son', 'sont'], bonne: 1, pourquoi: 'Ils étaient partis.' },
      { q: 'Il range … cartable.', choix: ['son', 'sont'], bonne: 0, pourquoi: 'Il range mon cartable : c’est un déterminant.' },
      { q: 'Mes amis … gentils.', choix: ['son', 'sont'], bonne: 1, pourquoi: 'Mes amis étaient gentils.' }
    ] },
  { id: 'f-pluriel', matiere: 'francais', niveau: 'CM1', titre: 'Le pluriel des noms',
    retenir: ['En général, on ajoute un -s : un livre, des livres.', 'Les noms en -eau prennent un -x : un gâteau, des gâteaux. Beaucoup de noms en -al font -aux : un cheval, des chevaux.', 'Les noms en -ou prennent un -s, sauf sept qui prennent un -x : bijou, caillou, chou, genou, hibou, joujou, pou.'],
    exemple: 'des bateaux, des journaux, des trous, des hiboux.',
    questions: [
      { q: 'Un cheval, des …', choix: ['chevals', 'chevaux', 'chevaus'], bonne: 1, pourquoi: '-al devient -aux.' },
      { q: 'Un gâteau, des …', choix: ['gâteaus', 'gâteaux'], bonne: 1, pourquoi: 'Les noms en -eau prennent un -x.' },
      { q: 'Un trou, des …', choix: ['trous', 'troux'], bonne: 0, pourquoi: '« trou » ne fait pas partie des sept exceptions : un -s.' }
    ] },
  // ---------------------------------------------------------------- sciences
  { id: 's-etats-eau', matiere: 'sciences', niveau: 'CE2', titre: 'Les trois états de l’eau',
    retenir: ['L’eau peut être solide (glace), liquide ou gazeuse (vapeur d’eau, invisible).', 'La glace fond à 0 °C : c’est la fusion. L’eau liquide gèle à 0 °C : c’est la solidification.', 'Au niveau de la mer, l’eau bout à 100 °C.'],
    exemple: 'Un glaçon posé dans la cuisine fond : il passe de l’état solide à l’état liquide.',
    questions: [
      { q: 'Un glaçon qui fond, c’est…', choix: ['la fusion', 'l’évaporation', 'la solidification'], bonne: 0, pourquoi: 'Solide → liquide : la fusion.' },
      { q: 'La vapeur d’eau est à l’état…', choix: ['solide', 'liquide', 'gazeux'], bonne: 2, pourquoi: 'La vapeur d’eau est un gaz (invisible).' },
      { q: 'À quelle température l’eau gèle-t-elle ?', choix: ['0 °C', '10 °C', '100 °C'], bonne: 0, pourquoi: 'L’eau gèle à 0 °C.' }
    ] },
  { id: 's-cycle-eau', matiere: 'sciences', niveau: 'CM1', titre: 'Le cycle de l’eau',
    retenir: ['Le Soleil chauffe l’eau des mers : elle s’évapore.', 'En montant, la vapeur se refroidit et forme des gouttelettes : les nuages (condensation).', 'L’eau retombe en pluie ou en neige (précipitations), puis ruisselle ou s’infiltre jusqu’aux rivières et à la mer.'],
    exemple: 'La buée sur un miroir de salle de bain, c’est de la condensation.',
    questions: [
      { q: 'Les nuages se forment par…', choix: ['évaporation', 'condensation', 'infiltration'], bonne: 1, pourquoi: 'La vapeur se refroidit en gouttelettes : condensation.' },
      { q: 'L’eau des océans qui devient vapeur, c’est…', choix: ['l’évaporation', 'la fusion', 'la précipitation'], bonne: 0, pourquoi: 'Liquide → gaz : évaporation.' },
      { q: 'La pluie et la neige sont des…', choix: ['précipitations', 'condensations', 'évaporations'], bonne: 0, pourquoi: 'L’eau qui tombe du ciel : les précipitations.' }
    ] },
  { id: 's-alimentation', matiere: 'sciences', niveau: 'CE2', titre: 'Bien manger',
    retenir: ['Aucun aliment n’apporte tout : il faut manger varié.', 'Les produits laitiers apportent du calcium pour les os ; les féculents (pâtes, pain, riz) donnent de l’énergie ; les fruits et légumes apportent des vitamines et des fibres.', 'L’eau est la seule boisson indispensable.'],
    exemple: 'Un repas équilibré : des légumes, un féculent, un peu de viande, de poisson ou d’œuf, un laitage et un fruit.',
    questions: [
      { q: 'Quel aliment est riche en calcium ?', choix: ['un yaourt', 'une pomme', 'des pâtes'], bonne: 0, pourquoi: 'Les produits laitiers apportent du calcium.' },
      { q: 'Quelle est la seule boisson indispensable ?', choix: ['le jus de fruits', 'l’eau', 'le lait'], bonne: 1, pourquoi: 'Le corps a besoin d’eau tous les jours.' },
      { q: 'Quel aliment donne surtout de l’énergie ?', choix: ['les pâtes', 'la salade', 'l’eau'], bonne: 0, pourquoi: 'Les féculents donnent de l’énergie.' }
    ] },
  { id: 's-vivant', matiere: 'sciences', niveau: 'CE2', titre: 'Le vivant',
    retenir: ['Un être vivant naît, se nourrit, grandit, se reproduit et meurt.', 'Les animaux, les plantes et les champignons sont des êtres vivants.', 'Une pierre ou l’eau ne sont pas des êtres vivants.'],
    exemple: 'Une graine de haricot germe, la plante grandit, fait des fleurs puis des graines.',
    questions: [
      { q: 'Lequel n’est pas un être vivant ?', choix: ['un champignon', 'un caillou', 'un arbre'], bonne: 1, pourquoi: 'Un caillou ne naît pas, ne se nourrit pas, ne grandit pas.' },
      { q: 'Que fait tout être vivant ?', choix: ['il bouge tout seul', 'il naît, grandit, se reproduit et meurt', 'il parle'], bonne: 1, pourquoi: 'Les plantes ne se déplacent pas, mais elles naissent, grandissent, se reproduisent et meurent.' },
      { q: 'Une plante est-elle un être vivant ?', choix: ['oui', 'non'], bonne: 0, pourquoi: 'Elle naît d’une graine, se nourrit, grandit et se reproduit.' }
    ] },
  { id: 's-systeme-solaire', matiere: 'sciences', niveau: 'CM1', titre: 'La Terre et le Soleil',
    retenir: ['Le Soleil est une étoile. Huit planètes tournent autour de lui ; la Terre est la troisième.', 'La Terre tourne sur elle-même en 24 heures : c’est ce qui fait le jour et la nuit.', 'La Terre fait le tour du Soleil en un an (environ 365 jours).'],
    exemple: 'Quand c’est le jour en France, c’est la nuit de l’autre côté de la Terre.',
    questions: [
      { q: 'Le Soleil est…', choix: ['une planète', 'une étoile', 'un satellite'], bonne: 1, pourquoi: 'Le Soleil est une étoile.' },
      { q: 'Le jour et la nuit viennent…', choix: ['du tour de la Terre autour du Soleil', 'de la Terre qui tourne sur elle-même', 'des nuages'], bonne: 1, pourquoi: 'En 24 heures, chaque endroit passe face au Soleil puis à l’ombre.' },
      { q: 'Combien de planètes tournent autour du Soleil ?', choix: ['8', '9', '12'], bonne: 0, pourquoi: 'Mercure, Vénus, la Terre, Mars, Jupiter, Saturne, Uranus, Neptune.' }
    ] }
];

// ---------------------------------------------------------------- Bien utiliser les écrans
const ECRANS = [
  { id: 'e-infos', titre: 'Mes infos, c’est privé',
    retenir: ['Sur Internet, je ne donne jamais mon nom complet, mon adresse, mon école, mon numéro de téléphone ni des photos de moi.', 'J’utilise un pseudo qui ne dit pas qui je suis.', 'Ce qui est publié peut rester en ligne pour toujours, même si on l’efface.'],
    questions: [
      { q: 'Un jeu en ligne te demande ton adresse pour « t’envoyer un cadeau ». Que fais-tu ?', choix: ['Je la donne, c’est un cadeau', 'Je ne la donne pas et j’en parle à un adulte', 'Je donne seulement ma ville'], bonne: 1, pourquoi: 'Ton adresse dit où te trouver : on ne la donne jamais en ligne.' },
      { q: 'Quel pseudo est le plus sûr ?', choix: ['Lea.Martin.2017', 'RenardDesNeiges', 'Lea_ecole_Jaures'], bonne: 1, pourquoi: 'Un bon pseudo ne contient ni ton vrai nom, ni ton âge, ni ton école.' },
      { q: 'Une photo publiée puis effacée…', choix: ['disparaît pour toujours', 'peut avoir été copiée et rester en ligne', 'n’a jamais existé'], bonne: 1, pourquoi: 'Quelqu’un a pu la copier ou la capturer avant.' }
    ] },
  { id: 'e-inconnus', titre: 'Les inconnus en ligne',
    retenir: ['Derrière un écran, je ne sais pas vraiment qui me parle.', 'Un adulte inconnu qui me demande une photo, un secret ou un rendez-vous : j’arrête et j’en parle tout de suite à un adulte de confiance.', 'Je n’aurai jamais d’ennuis parce que j’en ai parlé.'],
    questions: [
      { q: 'Quelqu’un que tu ne connais pas te dit : « Ne le dis pas à tes parents, c’est notre secret. »', choix: ['Je garde le secret', 'J’en parle tout de suite à un adulte', 'Je lui demande pourquoi'], bonne: 1, pourquoi: 'Un vrai ami ne demande pas de cacher quelque chose à tes parents.' },
      { q: 'Un joueur sympa te demande une photo de toi.', choix: ['J’envoie une photo floue', 'Je refuse et je préviens un adulte', 'J’envoie une photo de mon chat à la place'], bonne: 1, pourquoi: 'On n’envoie pas de photo de soi à un inconnu, même gentil.' },
      { q: 'Si quelque chose te met mal à l’aise en ligne, tu…', choix: ['fermes et en parles à un adulte', 'continues pour voir', 'n’en parles à personne'], bonne: 0, pourquoi: 'Fermer, puis en parler : c’est toujours la bonne réaction.' }
    ] },
  { id: 'e-pubs', titre: 'Pubs et achats',
    retenir: ['Une publicité veut me faire acheter ou cliquer, même quand elle ressemble à un jeu ou à une vidéo.', '« Tu as gagné ! » sur un site, c’est presque toujours un piège.', 'Dans les jeux, les achats coûtent de l’argent réel : je demande toujours à un adulte.'],
    questions: [
      { q: 'Une fenêtre clignote : « Bravo, tu as gagné une tablette ! Clique ici. »', choix: ['Je clique vite', 'Je ferme et je ne clique pas', 'Je donne mon adresse'], bonne: 1, pourquoi: 'C’est un piège : personne ne gagne en cliquant sur une pub.' },
      { q: 'Dans un jeu, un coffre magique coûte 4,99 €.', choix: ['C’est de l’argent pour de faux', 'C’est de l’argent réel : je demande à un adulte', 'Je l’achète si j’ai gagné des points'], bonne: 1, pourquoi: 'Les euros dans un jeu sont de vrais euros.' },
      { q: 'Un youtubeur montre un jouet et dit qu’il est génial.', choix: ['C’est forcément vrai', 'Il est peut-être payé pour le dire', 'C’est une émission de science'], bonne: 1, pourquoi: 'Souvent, les marques paient pour qu’on parle de leurs produits.' }
    ] },
  { id: 'e-vrai', titre: 'Vrai ou faux ?',
    retenir: ['Tout ce qu’on trouve sur Internet n’est pas vrai.', 'Je regarde qui a écrit l’information, et je la vérifie dans une deuxième source (Vikidia, 1jour1actu, un livre).', 'Une image peut être truquée ou fabriquée.'],
    questions: [
      { q: 'Une vidéo dit que les requins vivent dans les nuages. Que fais-tu ?', choix: ['Je la crois, elle a beaucoup de vues', 'Je vérifie dans une autre source', 'Je la partage à mes amis'], bonne: 1, pourquoi: 'Beaucoup de vues ne veut pas dire que c’est vrai.' },
      { q: 'Pour vérifier une information, le mieux est…', choix: ['de lire les commentaires', 'de la comparer avec une autre source sérieuse', 'de regarder combien de « j’aime » elle a'], bonne: 1, pourquoi: 'Deux sources sérieuses qui disent la même chose, c’est plus sûr.' },
      { q: 'Une photo très surprenante peut être…', choix: ['toujours vraie', 'truquée ou fabriquée', 'jamais modifiée'], bonne: 1, pourquoi: 'Les images se modifient facilement, aujourd’hui même avec des IA.' }
    ] },
  { id: 'e-sommeil', titre: 'Mes écrans et mon sommeil',
    retenir: ['La lumière des écrans le soir trompe le cerveau : on s’endort moins bien.', 'On éteint les écrans au moins une heure avant de dormir ; un livre, c’est parfait.', 'Toutes les 20 minutes d’écran, une petite pause : je regarde au loin, je bouge.'],
    questions: [
      { q: 'Juste avant de dormir, le mieux est de…', choix: ['regarder une vidéo', 'lire un livre', 'jouer à un jeu'], bonne: 1, pourquoi: 'La lumière des écrans retarde le sommeil.' },
      { q: 'Après un long moment d’écran, je…', choix: ['continue encore', 'fais une pause et regarde au loin', 'me rapproche de l’écran'], bonne: 1, pourquoi: 'Les yeux et le corps ont besoin de pauses.' },
      { q: 'Pourquoi Flocon a-t-il une tirelire de jetons ?', choix: ['pour gagner de l’argent', 'pour choisir mon temps d’écran et savoir m’arrêter', 'pour jouer plus longtemps'], bonne: 1, pourquoi: 'Choisir son temps et savoir s’arrêter, c’est ça être autonome.' }
    ] },
  { id: 'e-motdepasse', titre: 'Mes mots de passe',
    retenir: ['Mon mot de passe est secret : je ne le donne qu’à mes parents, même pas à mes meilleurs amis.', 'Un bon mot de passe est long : une petite phrase facile à retenir pour moi, difficile à deviner pour les autres.', 'Je n’utilise pas mon prénom ou ma date de naissance.'],
    questions: [
      { q: 'Ta meilleure amie te demande ton mot de passe.', choix: ['Je le lui donne, c’est ma meilleure amie', 'Je ne le donne pas', 'Je lui donne la moitié'], bonne: 1, pourquoi: 'Un mot de passe ne se partage qu’avec ses parents.' },
      { q: 'Quel mot de passe est le plus solide ?', choix: ['lea', '12345', 'LeRenardMangeDesCrepes!'], bonne: 2, pourquoi: 'Une longue phrase est difficile à deviner.' },
      { q: 'À qui peux-tu dire ton mot de passe ?', choix: ['à mes parents', 'à un joueur qui veut m’aider', 'à un site qui me le demande par message'], bonne: 0, pourquoi: 'Seulement à tes parents. Un vrai site ne demande jamais ton mot de passe par message.' }
    ] }
];

module.exports = { MATIERES, FICHES, ECRANS };
