'use strict';
// Tout ce qui est « déjà présent » dans l'ordinateur : logiciels, sites autorisés, rubriques.
// Le parent peut remplacer la liste des sites et ajouter des jeux depuis son panneau.

const PF = '%ProgramFiles%';
const PF86 = '%ProgramFiles(x86)%';
const LAD = '%LOCALAPPDATA%';

const LOGICIELS = {
  scratch: { nom: 'Scratch', chemins: [PF + '\\Scratch 3\\Scratch 3.exe', PF86 + '\\Scratch 3\\Scratch 3.exe', LAD + '\\Programs\\Scratch 3\\Scratch 3.exe'], menu: 'Scratch' },
  stopmotion: { nom: 'Stop Motion Studio', chemins: [], menu: 'Stop Motion', store: true },
  mypaint: { nom: 'MyPaint', chemins: [PF + '\\mypaint-w64\\mypaint.exe', PF + '\\MyPaint\\mingw64\\bin\\mypaint.exe', PF + '\\MyPaint\\mingw64\\bin\\mypaint-w64.exe', PF + '\\MyPaint\\mypaint.exe'], menus: ['MyPaint'] },
  // Pensés pour son âge : Tux Paint (dessin, 3-12 ans), GCompris (activités du primaire), le Magnétophone de Windows.
  tuxpaint: { nom: 'Tux Paint', chemins: [PF + '\\TuxPaint\\tuxpaint.exe', PF86 + '\\TuxPaint\\tuxpaint.exe'], menu: 'Tux Paint' },
  // Installé à la main depuis gcompris.net : le paquet winget KDE.GCompris n'installe que « GCompris Teachers » (relevé par le testeur).
  gcompris: { nom: 'GCompris', manuel: 'depuis gcompris.net (le paquet winget n’installe que l’outil des enseignants)', menuExact: true, chemins: [PF + '\\GCompris-Qt\\bin\\gcompris-qt.exe', PF + '\\GCompris\\bin\\gcompris-qt.exe', PF + '\\KDE\\GCompris\\bin\\gcompris-qt.exe'], menu: 'GCompris' },
  magneto: { nom: 'Magnétophone', windows11: true, chemins: [], menus: ['Magnétophone', 'Enregistreur audio', 'Enregistreur vocal', 'Sound Recorder'] },
  krita: { nom: 'Krita', chemins: [PF + '\\Krita (x64)\\bin\\krita.exe', PF + '\\Krita\\bin\\krita.exe'], menu: 'Krita' },
  writer: { nom: 'LibreOffice Writer', chemins: [PF + '\\LibreOffice\\program\\swriter.exe'], menu: 'LibreOffice Writer' },
  impress: { nom: 'LibreOffice Impress', chemins: [PF + '\\LibreOffice\\program\\simpress.exe'], menu: 'LibreOffice Impress' },
  audacity: { nom: 'Audacity', chemins: [PF + '\\Audacity 4\\bin\\Audacity4.exe', PF + '\\Audacity\\Audacity.exe'], menu: 'Audacity' },
  calculatrice: { nom: 'Calculatrice', chemins: ['%SystemRoot%\\System32\\calc.exe'], menu: 'Calculatrice' },
  camera: { nom: 'Caméra', uri: 'microsoft.windows.camera:' },
  explorateur: { nom: 'Explorateur de fichiers', chemins: ['%SystemRoot%\\explorer.exe'] },
  edge: { nom: 'Internet', chemins: [PF86 + '\\Microsoft\\Edge\\Application\\msedge.exe', PF + '\\Microsoft\\Edge\\Application\\msedge.exe'], menu: 'Microsoft Edge' },
  // Bedrock d'abord (ouvert directement, sans passer par le lanceur qui propose Java), le lanceur à défaut.
  minecraft: { nom: 'Minecraft', menusAvant: ['Minecraft pour Windows', 'Minecraft for Windows', 'Minecraft Bedrock'], chemins: [PF86 + '\\Minecraft Launcher\\MinecraftLauncher.exe', PF + '\\Minecraft Launcher\\MinecraftLauncher.exe'], menus: ['Minecraft Launcher', 'Minecraft'] },
  // RapidTyping, installé à la main (rapidtyping.com). Klavaro n'est plus installé : sa version Windows plante au démarrage
  // (0xC0000374, relevé par le testeur des logiciels) ; il reste en secours s'il est déjà là.
  klavaro: { nom: 'Le clavier', manuel: 'RapidTyping, à installer à la main (rapidtyping.com)', chemins: [PF + '\\RapidTyping\\RapidTyping.exe', PF86 + '\\RapidTyping\\RapidTyping.exe', PF86 + '\\Klavaro\\bin\\klavaro.exe', PF + '\\Klavaro\\bin\\klavaro.exe'], menus: ['RapidTyping', 'Klavaro'] }
};

// domaines : adresses autorisées en navigation (sous-domaines compris).
const SITES = {
  vikidia: { nom: 'Vikidia', url: 'https://fr.vikidia.org', domaines: ['vikidia.org'], recherche: 'https://fr.vikidia.org/w/index.php?search=' },
  wikimini: { nom: 'Wikimini', url: 'https://fr.wikimini.org', domaines: ['wikimini.org'] },
  unjour: { nom: '1jour1actu', url: 'https://www.1jour1actu.com', domaines: ['1jour1actu.com'] },
  terre: { nom: 'Le monde', url: 'https://earth.google.com/web/', domaines: ['earth.google.com'] },
  etoiles: { nom: 'Les étoiles', url: 'https://stellarium.com/sky', domaines: ['stellarium.com', 'stellarium-web.org'] },
  vinz: { nom: 'Vinz et Lou', url: 'https://www.vinzetlou.net', domaines: ['vinzetlou.net'] },
  lumni: { nom: 'Lumni', url: 'https://www.lumni.fr/primaire', domaines: ['lumni.fr'] },
  lama: { nom: 'La Classe du Lama', url: 'https://laclassedulama.fr', domaines: ['laclassedulama.fr'] },
  khan: { nom: 'Khan Academy', url: 'https://fr.khanacademy.org', domaines: ['khanacademy.org'] },
  fondamentaux: { nom: 'Les Fondamentaux', url: 'https://lesfondamentaux.reseau-canope.fr/accueil.html', domaines: ['reseau-canope.fr'] },
  calcul: { nom: 'Calcul mental', url: 'https://calculatice.ac-lille.fr/exercices/', domaines: ['calculatice.ac-lille.fr'] },
  dicoado: { nom: 'Dicoado', url: 'https://www.dicoado.org', domaines: ['dicoado.org'] },
  songmaker: { nom: 'Mélodies', url: 'https://musiclab.chromeexperiments.com/Song-Maker/', domaines: ['musiclab.chromeexperiments.com'] },
  teachable: { nom: 'Teachable Machine', url: 'https://teachablemachine.withgoogle.com/train/image', domaines: ['teachablemachine.withgoogle.com'], camera: true },
  blockly: { nom: 'Blockly Games', url: 'https://blockly.games/?lang=fr', domaines: ['blockly.games'] },
  incredibox: { nom: 'Mes beats', url: 'https://www.incredibox.com/demo/', domaines: ['incredibox.com'] }
};

// Icônes : tracés SVG 24×24 (trait).
const I = {
  code: 'M8 7l-5 5 5 5M16 7l5 5-5 5M13 5l-2 14',
  carte: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15',
  bulle: 'M4 5h16v11H9l-5 4z',
  palette: 'M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8zM7.5 11.5h.01M10 7.5h.01M15 7.5h.01',
  ciseaux: 'M9 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM8.1 8.1L20 20M8.1 15.9L20 4',
  film: 'M4 5h16v14H4zM8 5v14M16 5v14M4 9h4M4 15h4M16 9h4M16 15h4',
  pinceau: 'M14 4l6 6-9 9H5v-6zM12 6l6 6',
  note: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zM20 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3z',
  beat: 'M3 12h3l3-8 4 16 3-8h5',
  texte: 'M6 3h9l4 4v14H6zM9 10h7M9 14h7M9 18h4',
  diapo: 'M3 4h18v12H3zM12 16v5M8 21h8',
  micro: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  livre: 'M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  etoile: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z',
  loupe: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5',
  ecran: 'M4 5h16v11H4zM9 20h6M12 16v4',
  question: 'M9 9a3 3 0 1 1 4 2.8c-.6.3-1 .9-1 1.6V15M12 18.5v.01',
  calcul: 'M6 3h12v18H6zM9 7h6M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01',
  lama: 'M7 20v-7a5 5 0 0 1 10 0v7M9 8V4M15 8V4M10 15h.01M14 15h.01',
  chapeau: 'M12 4l10 5-10 5L2 9zM6 11v5c3 2 9 2 12 0v-5',
  manette: 'M6 9h12a4 4 0 0 1 0 8l-3-2H9l-3 2a4 4 0 0 1 0-8zM8 12v2M7 13h2M16 12h.01M18 14h.01',
  cube: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5',
  photo: 'M4 7h4l2-3h4l2 3h4v12H4zM12 10a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  casque: 'M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v5H4zM17 15h3v5h-3z',
  dossier: 'M3 6h6l2 2h10v11H3z',
  minuteur: 'M12 8v5l3 2M9 2h6M12 4a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  dico: 'M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h12M9 8h6',
  camera: 'M3 7h12v10H3zM15 10l6-3v10l-6-3',
  palette: 'M12 3a9 9 0 1 0 0 18c1 0 2-1 1.5-2-.6-1.2.3-2.5 1.6-2.5H17a4 4 0 0 0 4-4c0-5-4-9.5-9-9.5zM7.5 12h.01M10 7.5h.01M14.5 7.5h.01',
  coeur: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  agenda: 'M4 6h16v14H4zM4 10h16M8 3v5M16 3v5M8 14h3',
  graphe: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  permis: 'M4 6h16v12H4zM8 10h.01M11 10h5M8 14h8'
};

// type : logiciel | site | interne
const RUBRIQUES = [
  { id: 'creer', nom: 'Je crée', tuiles: [
    { type: 'interne', ref: 'idee', nom: 'Une idée ?', sous: 'Quand je ne sais pas quoi faire', icone: I.etoile, couleur: '#F2B33D' },
    { type: 'interne', ref: 'galerie', nom: 'Ma galerie', sous: 'Et la première en famille', icone: I.photo, couleur: '#E0457B' },
    { type: 'logiciel', ref: 'scratch', nom: 'Scratch', sous: 'Jeux et animations', icone: I.code, couleur: '#F28C28' },
    { type: 'interne', ref: 'animation', nom: 'Mon film', sous: 'Mon studio d\u2019animation', icone: I.film, couleur: '#E0457B' },
    { type: 'logiciel', ref: 'tuxpaint', nom: 'Dessin', sous: 'Tux Paint', icone: I.pinceau, couleur: '#FF7A45' },
    { type: 'logiciel', ref: 'mypaint', nom: 'Peinture', sous: 'MyPaint, des vrais pinceaux', icone: I.pinceau, couleur: '#E8692A', niveau: 2 },
    { type: 'logiciel', ref: 'krita', nom: 'Atelier de peinture', sous: 'Krita, pour aller plus loin', icone: I.pinceau, couleur: '#C2410C', niveau: 3 },
    { type: 'site', ref: 'incredibox', nom: 'Mes beats', sous: 'Incredibox', icone: I.beat, couleur: '#7C5CFA' },
    { type: 'site', ref: 'songmaker', nom: 'Mélodies', sous: 'Song Maker', icone: I.note, couleur: '#2B7BD6' },
    { type: 'interne', ref: 'mains', nom: 'Mes mains', sous: 'Des défis loin de l\u2019écran', icone: I.ciseaux, couleur: '#F28C28' },
    { type: 'interne', ref: 'histoires', nom: 'Histoire à choix', sous: 'Le lecteur décide de la suite', icone: I.carte, couleur: '#7C5CFA' },
    { type: 'interne', ref: 'bd', nom: 'Ma BD', sous: 'Au crayon, puis en album', icone: I.bulle, couleur: '#E0457B' },
    { type: 'interne', ref: 'cahier', nom: 'Mon cahier', sous: 'Histoires et lettres', icone: I.texte, couleur: '#1F5FA8' },
    { type: 'logiciel', ref: 'writer', nom: 'Mise en page', sous: 'LibreOffice Writer', icone: I.texte, couleur: '#174A85', niveau: 2 },
    { type: 'logiciel', ref: 'magneto', nom: 'Ma voix', sous: 'Le Magnétophone', icone: I.micro, couleur: '#5B3FD6' },
    { type: 'logiciel', ref: 'audacity', nom: 'Studio son', sous: 'Audacity, pour monter', icone: I.micro, couleur: '#3F2BA8', niveau: 3 },
    { type: 'logiciel', ref: 'camera', nom: 'Photomaton', sous: 'La caméra', icone: I.camera, couleur: '#13A39F' },
    { type: 'projet', ref: 'radio', nom: 'Ma radio', sous: 'Une émission à faire écouter', icone: I.micro, couleur: '#B0471B' },
    { type: 'projet', ref: 'livre', nom: 'Mon livre', sous: 'Écrire, illustrer, imprimer', icone: I.livre, couleur: '#2FA36B' },
    { type: 'projet', ref: 'papier', nom: 'Du papier à l\u2019écran', sous: 'Mes dessins prennent vie', icone: I.pinceau, couleur: '#7C5CFA' }
  ] },
  { id: 'lire', nom: 'Mes lectures', tuiles: [
    { type: 'interne', ref: 'carnetLecture', nom: 'Mon carnet de lecture', sous: 'Les livres que j’ai lus', icone: I.livre, couleur: '#B0471B' },
    { type: 'interne', ref: 'journal', nom: 'Mon journal', sous: 'Rien que pour moi', icone: I.coeur, couleur: '#D4537E' },
    { type: 'interne', ref: 'livresAudio', nom: 'Mes livres audio', sous: 'À écouter sur mon casque', icone: I.casque, couleur: '#5B3FD6' }
  ] },
  { id: 'decouvrir', nom: 'Je découvre', tuiles: [
    { type: 'site', ref: 'vikidia', nom: 'Vikidia', sous: 'L’encyclopédie des 8-13 ans', icone: I.loupe, couleur: '#13A39F' },
    { type: 'site', ref: 'wikimini', nom: 'Wikimini', sous: 'Écrite par les enfants', icone: I.cube, couleur: '#2FA36B' },
    { type: 'site', ref: 'unjour', nom: '1jour1actu', sous: 'L’actu expliquée', icone: I.ecran, couleur: '#E8892A' },
    { type: 'site', ref: 'terre', nom: 'Le monde', sous: 'La Terre en 3D', icone: I.globe, couleur: '#2B7BD6' },
    { type: 'site', ref: 'etoiles', nom: 'Les étoiles', sous: 'Le ciel de ce soir', icone: I.etoile, couleur: '#3C3489' },
    { type: 'site', ref: 'vinz', nom: 'Vinz et Lou', sous: 'Internet expliqué', icone: I.question, couleur: '#7C5CFA' },
    { type: 'logiciel', ref: 'edge', nom: 'Internet', sous: 'Un vrai navigateur, mes sites', icone: I.globe, couleur: '#1F5FA8', niveau: 3 }
  ] },
  { id: 'apprendre', nom: 'J’apprends', tuiles: [
    { type: 'interne', ref: 'exposes', nom: 'Mes exposés', sous: 'De l’idée à l’oral', icone: I.diapo, couleur: '#1F5FA8' },
    { type: 'interne', ref: 'pourquoi', nom: 'Grand Pourquoi', sous: 'Mes questions', icone: I.question, couleur: '#7C5CFA' },
    { type: 'interne', ref: 'fiches', nom: 'Mes fiches', sous: 'Réviser maths, français, sciences', icone: I.livre, couleur: '#1F5FA8' },
    { type: 'logiciel', ref: 'gcompris', nom: 'Jeux pour apprendre', sous: 'GCompris : maths, lecture, sciences', icone: I.chapeau, couleur: '#2FA36B' },
    { type: 'site', ref: 'blockly', nom: 'Blockly Games', sous: 'Après Scratch : coder pas à pas', icone: I.code, couleur: '#F28C28' },
    { type: 'projet', ref: 'ia', nom: 'J\u2019apprends à l\u2019ordinateur', sous: 'Comprendre l\u2019IA, à deux', icone: I.cube, couleur: '#7C5CFA' },
    { type: 'logiciel', ref: 'klavaro', nom: 'Taper au clavier', sous: 'Avec les dix doigts', icone: I.texte, couleur: '#13A39F' },
    { type: 'site', ref: 'lama', nom: 'Classe du Lama', sous: 'Jeux de français et maths', icone: I.lama, couleur: '#E0457B' },
    { type: 'site', ref: 'khan', nom: 'Khan Academy', sous: 'Leçons et exercices', icone: I.chapeau, couleur: '#2FA36B' },
    { type: 'site', ref: 'fondamentaux', nom: 'Les Fondamentaux', sous: 'Petits films pour comprendre', icone: I.film, couleur: '#E8892A' },
    { type: 'site', ref: 'lumni', nom: 'Lumni', sous: 'Vidéos et jeux', icone: I.ecran, couleur: '#2B7BD6' },
    { type: 'site', ref: 'calcul', nom: 'Calcul mental', sous: 'Calculatice', icone: I.calcul, couleur: '#5B3FD6' }
  ] },
  { id: 'jeux', nom: 'Mes jeux', tuiles: [] }, // rempli par le parent
  { id: 'medias', nom: 'Photos et musique', tuiles: [
    { type: 'interne', ref: 'photos', nom: 'Mes photos', sous: 'Et l’appareil photo', icone: I.photo, couleur: '#13A39F' },
    { type: 'interne', ref: 'musique', nom: 'Ma musique', sous: 'Et mon casque', icone: I.casque, couleur: '#7C5CFA' },
    { type: 'interne', ref: 'films', nom: 'Mes films', sous: 'Choisis avec un adulte', icone: I.film, couleur: '#E0457B' }
  ] },
  { id: 'outils', nom: 'Mes outils', tuiles: [
    { type: 'interne', ref: 'ecrans', nom: 'Écrans malins', sous: 'Bien utiliser Internet et les écrans', icone: I.coeur, couleur: '#7C5CFA' },
    { type: 'logiciel', ref: 'calculatrice', nom: 'Calculatrice', sous: 'Comme une vraie', icone: I.calcul, couleur: '#56607A' },
    { type: 'interne', ref: 'minuteur', nom: 'Minuteur', sous: 'Pour me chronométrer', icone: I.minuteur, couleur: '#E8892A' },
    { type: 'site', ref: 'dicoado', nom: 'Dictionnaire', sous: 'Dicoado', icone: I.dico, couleur: '#1F5FA8' },
    { type: 'interne', ref: 'dossiers', nom: 'Mes dossiers', sous: 'Tout ce que je fabrique', icone: I.dossier, couleur: '#F2B33D' },
    { type: 'interne', ref: 'agenda', nom: 'Mon agenda', sous: 'Ce qui m\u2019attend', icone: I.agenda, couleur: '#E0457B' },
    { type: 'interne', ref: 'semaine', nom: 'Ma semaine', sous: 'Le bilan du dimanche', icone: I.graphe, couleur: '#2FA36B' },
    { type: 'interne', ref: 'permis', nom: 'Mon permis', sous: 'Gagner en autonomie', icone: I.permis, couleur: '#1F5FA8' },
    { type: 'logiciel', ref: 'explorateur', nom: 'Explorateur', sous: 'Tous mes fichiers', icone: I.dossier, couleur: '#56607A', niveau: 2 }
  ] },
  { id: 'style', nom: 'Mon style', tuiles: [] }
];

// Premiers pas : trois gestes, montrés la première fois qu'on ouvre un logiciel, puis plus jamais.
const PREMIERS_PAS = {
  scratch: ['Clique sur un bloc pour voir ce qu\u2019il fait.', 'Glisse les blocs les uns sous les autres : c\u2019est ton programme.', 'Le drapeau vert lance tout. Pour garder ton travail : Fichier, puis « Enregistrer sur ton ordinateur », dans Mes créations.'],
  stopmotion: ['Pose la caméra bien stable : elle ne doit plus bouger.', 'Bouge ton personnage tout doucement, une photo à chaque fois.', 'Exporte ton film dans Documents, Mes créations : il ira dans ta galerie.'],
  tuxpaint: ['Les outils sont à gauche, les couleurs en bas : essaie les « Magie », ils font des choses surprenantes.', 'Défaire (la flèche) annule ton dernier geste : tu peux tout essayer.', 'Enregistrer garde ton dessin dans Tux Paint ; pour le mettre dans ta galerie, demande « Exporter » à un adulte la première fois.'],
  gcompris: ['Chaque activité est une petite île : clique dessus, puis sur la flèche pour commencer.', 'Les étoiles en haut, c\u2019est le niveau : monte quand c\u2019est trop facile.', 'La maison en bas te ramène au menu.'],
  magneto: ['Le gros bouton rond enregistre, le carré arrête.', 'Approche-toi du micro, mais pas trop : parle comme à quelqu\u2019un assis en face de toi.', 'Ton enregistrement est rangé tout seul dans Documents, Enregistrements audio.'],
  mypaint: ['Choisis un pinceau dans la colonne de droite, et ta couleur sur la roue.', 'Ctrl+Z annule ton dernier trait : tu peux tout essayer.', 'Pour garder ton dessin : Fichier, Exporter, choisis le format PNG et range-le dans Documents, Mes créations.'],
  minecraft: ['La toute première fois, un adulte connecte ton compte Minecraft avec toi.', 'Si le lanceur s\u2019ouvre, choisis « Minecraft pour Windows » (l\u2019édition Bedrock), puis Jouer, puis Créer un monde.', 'Le jeu peut mettre une à deux minutes à démarrer : patiente, ne clique pas plusieurs fois.'],
  krita: ['Choisis un pinceau à gauche et une couleur à droite.', 'Ctrl+Z annule ton dernier trait : tu peux tout essayer.', 'Fichier, puis Exporter en PNG, dans Documents, Mes créations.'],
  writer: ['Écris d\u2019abord, la mise en forme viendra après.', 'Pour un titre, sélectionne-le et choisis « Titre 1 ».', 'Fichier, puis Enregistrer sous : choisis bien ton dossier, et donne un nom qui veut dire quelque chose.'],
  impress: ['Une diapo = une idée et une image.', 'Insertion, puis Image, pour ajouter un dessin ou une photo.', 'F5 lance le diaporama, Échap l\u2019arrête.'],
  audacity: ['Le bouton rouge enregistre, le carré arrête.', 'Un passage raté ? Sélectionne-le et appuie sur Suppr.', 'Fichier, puis Exporter en MP3, dans Mes créations.'],
  klavaro: ['Pose tes index sur F et J : ils ont une petite bosse.', 'Regarde l\u2019écran, pas tes doigts. C\u2019est dur au début, c\u2019est normal.', 'Dix minutes souvent valent mieux qu\u2019une heure de temps en temps.']
};

// Idées de départ : de l'étincelle, pas de récompense. Trois tirages par séance, pas plus.
const IDEES = [
  'Un film de 10 secondes avec un objet de la cuisine.', 'Invente le cri d\u2019un animal qui n\u2019existe pas, et enregistre-le.', 'Dessine ta rue dans 100 ans.',
  'Une histoire qui commence par : « Ce matin-là, mon ombre a refusé de me suivre. »', 'Fais un jeu Scratch où le chat attrape des étoiles.', 'Une musique qui donne l\u2019impression qu\u2019il pleut.',
  'Photographie cinq choses rouges dans la maison, puis fais-en une affiche.', 'Interviewe quelqu\u2019un de ta famille sur son enfance.', 'Invente une recette impossible et écris-la comme un vrai livre de cuisine.',
  'Un film en pâte à modeler où une boule devient un animal.', 'Dessine ton compagnon dans ta chambre.', 'Écris une lettre à toi-même dans dix ans.',
  'Fais une carte au trésor de ton jardin ou de ton quartier.', 'Une BD de quatre cases sur une dispute entre deux chaussettes.', 'Invente un pays : son drapeau, sa langue, sa spécialité.',
  'Lis un poème à voix haute et ajoute des bruitages.', 'Un exposé d\u2019une minute sur ton animal préféré.', 'Dessine un monstre gentil et raconte sa journée.',
  'Fais une affiche pour un spectacle imaginaire.', 'Un jeu Scratch où on doit éviter des gouttes de pluie.', 'Une chanson pour réveiller quelqu\u2019un doucement.',
  'Construis une ville en Lego, puis fais-en un film où elle se construit toute seule.', 'Raconte ton dernier rêve en trois dessins.', 'Invente une machine qui sert à quelque chose d\u2019inutile.',
  'Fais le journal télévisé de la maison.', 'Dessine la même maison au printemps, en été, en automne et en hiver.', 'Écris la suite de ton livre préféré.',
  'Un quiz de dix questions pour ta famille.', 'Une musique de film pour une course-poursuite.', 'Fais le portrait de quelqu\u2019un sans montrer son visage.'
];

// Projets guidés : des étapes et les bons outils, pas de note ni de score.
const PROJETS = {
  radio: { titre: 'Ma radio', chapo: 'Une vraie émission, à faire écouter à la famille ou à copier sur ton casque.', etapes: [
    ['Choisis ton émission', 'Une interview de mamie, un conte lu, la chronique du week-end, un quiz…'],
    ['Prépare ton texte', 'Écris tes questions ou ce que tu vas dire. Pas tout mot à mot : des notes suffisent.'],
    ['Fais un petit jingle', 'Quelques notes dans Mélodies, pour ouvrir et fermer l\u2019émission.'],
    ['Enregistre-toi', 'Parle lentement, sourire aux lèvres : ça s\u2019entend !'],
    ['Exporte et fais écouter', 'En MP3, dans Mes créations : ton émission apparaît dans ta galerie.']
  ], outils: [['logiciel', 'writer', 'Mes notes'], ['site', 'songmaker', 'Mon jingle'], ['logiciel', 'audacity', 'M\u2019enregistrer']] },
  livre: { titre: 'Mon livre', chapo: 'Une histoire écrite et illustrée par toi, imprimée en vrai petit livre.', etapes: [
    ['Écris ton histoire', 'Un début, un problème, une fin. Courte, c\u2019est très bien.'],
    ['Découpe-la en pages', 'Une ou deux phrases par page, pour laisser de la place aux dessins.'],
    ['Dessine les illustrations', 'Sur papier puis en photo, ou directement dans MyPaint.'],
    ['Mets en page', 'Une image et son texte par page, dans LibreOffice Writer.'],
    ['Imprime en livret', 'Fichier, Imprimer, puis choisis « Brochure » : tu n\u2019as plus qu\u2019à plier et agrafer.']
  ], outils: [['logiciel', 'writer', 'Écrire'], ['logiciel', 'mypaint', 'Dessiner']] },
  ia: { titre: 'J\u2019apprends à l\u2019ordinateur', chapo: 'Une intelligence artificielle ne sait que ce qu\u2019on lui a montré. Pour le comprendre, entraîne la tienne. La première fois, fais-le avec un adulte : le site est en anglais.', etapes: [
    ['Ouvre Teachable Machine', 'Un projet d\u2019images : la caméra va servir d\u2019yeux à l\u2019ordinateur.'],
    ['Crée trois catégories', 'Pierre, Feuille, Ciseaux. Ce sont les seules choses que ta machine pourra reconnaître.'],
    ['Montre-lui des exemples', 'Une cinquantaine d\u2019images pour chaque geste, en bougeant un peu ta main.'],
    ['Entraîne et teste', 'Clique sur « Train », puis montre tes gestes : est-ce qu\u2019elle devine ?'],
    ['Piège-la', 'La main de quelqu\u2019un d\u2019autre, la pénombre, un autre fond, ton pied… Qu\u2019est-ce qui rate ? Pourquoi ?'],
    ['Note ce que tu as découvert', 'Dans ton Grand Pourquoi. Par exemple : « Elle se trompe quand on lui montre ce qu\u2019elle n\u2019a jamais vu. »']
  ], outils: [['site', 'teachable', 'Teachable Machine'], ['interne', 'pourquoi', 'Mon Grand Pourquoi']] },
  papier: { titre: 'Du papier à l\u2019écran', chapo: 'Tes dessins sur papier deviennent des images en couleur ou des films.', etapes: [
    ['Dessine sur papier', 'Avec un feutre bien noir, des traits nets.'],
    ['Prends-le en photo', 'Bien à plat, à la lumière du jour, sans ombre.'],
    ['Importe tes photos', 'Branche l\u2019appareil et va dans Mes photos.'],
    ['Donne-lui vie', 'Colorie-le dans MyPaint, ou anime-le image par image dans Stop Motion.']
  ], outils: [['interne', 'photos', 'Mes photos'], ['logiciel', 'mypaint', 'Colorier'], ['interne', 'animation', 'Animer']] }
};

// Le permis : quatre niveaux. On passe au suivant quand les missions sont acquises, avec un adulte, jamais avec du temps d'écran.
const PERMIS = [
  { n: 1, nom: 'Premiers pas', ouvre: 'Tout se passe dans Flocon : les logiciels, les sites choisis, tes carnets.', missions: [] },
  { n: 2, nom: 'J\u2019explore', ouvre: 'L\u2019explorateur de fichiers dans tes outils, pour ranger, copier sur une clé et imprimer toute seule.', missions: [
    'Je crée un dossier dans « Mes créations » et je lui donne un nom.', 'Je renomme un fichier sans perdre son extension.', 'J\u2019enregistre un dessin au bon endroit, du premier coup.',
    'Je retrouve un fichier avec la recherche de Windows.', 'Je copie une création sur une clé USB, puis je l\u2019éjecte proprement.', 'J\u2019imprime une page toute seule.'] },
  { n: 3, nom: 'Je navigue', ouvre: 'Un vrai navigateur, avec sa barre d\u2019adresse et ses onglets, mais seulement sur les sites autorisés (la recherche passe par Vikidia). Et Krita, un vrai atelier de peinture.', missions: [
    'Je tape une phrase avec mes dix doigts, sans regarder le clavier.', 'Je mets en forme un texte : un titre, du gras, une image.', 'Je fais une capture d\u2019écran (Windows + Maj + S).',
    'Je vérifie une information dans deux sources différentes.', 'Je cite mes sources à la fin d\u2019un exposé.', 'Je sais ce que je ne donne jamais sur Internet : nom, adresse, école, photos.'] },
  { n: 4, nom: 'En autonomie', ouvre: 'Tu peux fermer Flocon quand tu veux. Quand ton temps est fini, tu as cinq minutes pour terminer tranquillement.', missions: [
    'J\u2019utilise la barre d\u2019adresse et les onglets sans me perdre.', 'Je reconnais une publicité et un lien douteux.', 'Je ferme ce que je ne veux pas voir et j\u2019en parle à un adulte.',
    'Pendant un mois, j\u2019ai dit « J\u2019ai fini » sans attendre que le temps s\u2019arrête.', 'Je prépare ma semaine de jetons et je la respecte à peu près.', 'J\u2019explique à un adulte comment je range mes fichiers.'] }
];

const EXPOSE_ETAPES = [
  { nom: 'Mon sujet', titre: 'Choisir et cerner mon sujet', consigne: 'Un sujet trop grand, c’est un exposé qui déborde. Écris trois questions auxquelles ton exposé va répondre.', astuce: 'Pas « Les loups », mais « Comment vivent les loups, et pourquoi en a-t-on peur ? »', outils: [] },
  { nom: 'Chercher', titre: 'Chercher dans plusieurs sources', consigne: 'Lis au moins deux sources différentes, et un livre de la bibliothèque si tu peux. Pour chaque info, note d’où elle vient.', astuce: 'Si deux sources disent la même chose, l’info est solide. Si elles se contredisent, demande à un adulte.', outils: [['site', 'vikidia'], ['site', 'wikimini'], ['site', 'unjour']] },
  { nom: 'Mes notes', titre: 'Prendre des notes avec mes mots', consigne: 'Ne copie pas les phrases : lis, ferme la page, puis écris ce que tu as compris. Une idée par ligne, rangée sous une de tes trois questions.', astuce: 'Si tu n’arrives pas à l’écrire avec tes mots, c’est que tu n’as pas encore compris. Relis !', outils: [] },
  { nom: 'Mon plan', titre: 'Construire mon plan', consigne: 'Une introduction qui donne envie, trois parties (tes trois questions), une conclusion avec ce que tu as préféré apprendre.', astuce: 'Commence par une devinette, un son ou une image surprenante : toute la classe sera attentive.', outils: [] },
  { nom: 'Mon support', titre: 'Fabriquer mon support', consigne: 'Une affiche à imprimer ou un petit diaporama : peu de mots, de grandes images, tes dessins ou tes photos.', astuce: 'Une diapo = une idée et une image. Ce que tu dis à l’oral, ne l’écris pas en entier.', outils: [['logiciel', 'impress'], ['logiciel', 'krita'], ['logiciel', 'writer']] },
  { nom: 'L’oral', titre: 'M’entraîner à l’oral', consigne: 'Enregistre-toi une fois, écoute-toi, puis présente ton exposé à la maison devant un vrai public.', astuce: 'Chronomètre-toi : 5 minutes, c’est plus court qu’on ne croit.', outils: [['logiciel', 'audacity'], ['interne', 'minuteur']] }
];

const INTENTIONS = [
  { id: 'creer', texte: 'Créer quelque chose' },
  { id: 'expose', texte: 'Avancer mon exposé' },
  { id: 'devoirs', texte: 'Faire mes devoirs' },
  { id: 'question', texte: 'Chercher une réponse' },
  { id: 'jouer', texte: 'Jouer à un jeu' },
  { id: 'ecouter', texte: 'Écouter de la musique' }
];

// Sites autorisés : toujours ceux du catalogue de Flocon (une nouvelle version peut en ajouter ou suivre un site qui
// déménage), plus ceux que le parent ajoute. Avant la 1.4.8 le panneau enregistrait la liste entière, qui figeait le catalogue.
function domainesCatalogue() { return Object.values(SITES).flatMap((s) => s.domaines); }
function sitesAjoutes(sitesConfig) {
  const cat = new Set(domainesAutorises([]));
  return domainesAutorises(sitesConfig).filter((d) => !cat.has(d));
}
function domainesAutorises(sitesConfig) {
  const base = domainesCatalogue().concat(Array.isArray(sitesConfig) ? sitesConfig : []);
  return Array.from(new Set(base.map((d) => String(d).trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '')).filter(Boolean)));
}

function urlAutorisee(url, domaines) {
  let h;
  try { const u = new URL(url); if (!/^https?:$/.test(u.protocol)) return false; h = u.hostname.toLowerCase(); } catch (e) { return false; }
  return domaines.some((d) => h === d || h.endsWith('.' + d));
}

module.exports = { LOGICIELS, SITES, RUBRIQUES, EXPOSE_ETAPES, PREMIERS_PAS, IDEES, PROJETS, PERMIS, INTENTIONS, ICONES: I, domainesAutorises, sitesAjoutes, urlAutorisee };
