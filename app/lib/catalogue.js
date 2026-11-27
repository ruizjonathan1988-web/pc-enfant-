'use strict';
// Tout ce qui est « déjà présent » dans l'ordinateur : logiciels, sites autorisés, rubriques.
// Le parent peut remplacer la liste des sites et ajouter des jeux depuis son panneau.

const PF = '%ProgramFiles%';
const PF86 = '%ProgramFiles(x86)%';
const LAD = '%LOCALAPPDATA%';

const LOGICIELS = {
  scratch: { nom: 'Scratch', chemins: [PF + '\\Scratch 3\\Scratch 3.exe', PF86 + '\\Scratch 3\\Scratch 3.exe', LAD + '\\Programs\\Scratch 3\\Scratch 3.exe'], menu: 'Scratch' },
  stopmotion: { nom: 'Stop Motion Studio', chemins: [], menu: 'Stop Motion' },
  krita: { nom: 'Krita', chemins: [PF + '\\Krita (x64)\\bin\\krita.exe', PF + '\\Krita\\bin\\krita.exe'], menu: 'Krita' },
  writer: { nom: 'LibreOffice Writer', chemins: [PF + '\\LibreOffice\\program\\swriter.exe'], menu: 'LibreOffice Writer' },
  impress: { nom: 'LibreOffice Impress', chemins: [PF + '\\LibreOffice\\program\\simpress.exe'], menu: 'LibreOffice Impress' },
  audacity: { nom: 'Audacity', chemins: [PF + '\\Audacity\\Audacity.exe'], menu: 'Audacity' },
  calculatrice: { nom: 'Calculatrice', chemins: ['%SystemRoot%\\System32\\calc.exe'], menu: 'Calculatrice' },
  camera: { nom: 'Caméra', uri: 'microsoft.windows.camera:' },
  minecraft: { nom: 'Minecraft', chemins: [], menu: 'Minecraft' }
};

// domaines : adresses autorisées en navigation (sous-domaines compris).
const SITES = {
  vikidia: { nom: 'Vikidia', url: 'https://fr.vikidia.org', domaines: ['vikidia.org'] },
  wikimini: { nom: 'Wikimini', url: 'https://fr.wikimini.org', domaines: ['wikimini.org'] },
  unjour: { nom: '1jour1actu', url: 'https://www.1jour1actu.com', domaines: ['1jour1actu.com'] },
  terre: { nom: 'Le monde', url: 'https://earth.google.com/web/', domaines: ['earth.google.com'] },
  etoiles: { nom: 'Les étoiles', url: 'https://stellarium-web.org', domaines: ['stellarium-web.org'] },
  vinz: { nom: 'Vinz et Lou', url: 'https://www.vinzetlou.net', domaines: ['vinzetlou.net'] },
  lumni: { nom: 'Lumni', url: 'https://www.lumni.fr/primaire', domaines: ['lumni.fr'] },
  lama: { nom: 'La Classe du Lama', url: 'https://laclassedulama.fr', domaines: ['laclassedulama.fr'] },
  khan: { nom: 'Khan Academy', url: 'https://fr.khanacademy.org', domaines: ['khanacademy.org'] },
  fondamentaux: { nom: 'Les Fondamentaux', url: 'https://lesfondamentaux.reseau-canope.fr', domaines: ['lesfondamentaux.reseau-canope.fr'] },
  calcul: { nom: 'Calcul mental', url: 'https://calculatice.ac-lille.fr', domaines: ['calculatice.ac-lille.fr'] },
  dicoado: { nom: 'Dicoado', url: 'https://www.dicoado.org', domaines: ['dicoado.org'] },
  songmaker: { nom: 'Mélodies', url: 'https://musiclab.chromeexperiments.com/Song-Maker/', domaines: ['musiclab.chromeexperiments.com'] },
  incredibox: { nom: 'Mes beats', url: 'https://www.incredibox.com/demo/', domaines: ['incredibox.com'] }
};

// Icônes : tracés SVG 24×24 (trait).
const I = {
  code: 'M8 7l-5 5 5 5M16 7l5 5-5 5M13 5l-2 14',
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
  coeur: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z'
};

// type : logiciel | site | interne
const RUBRIQUES = [
  { id: 'creer', nom: 'Je crée', tuiles: [
    { type: 'logiciel', ref: 'scratch', nom: 'Scratch', sous: 'Jeux et animations', icone: I.code, couleur: '#F28C28' },
    { type: 'logiciel', ref: 'stopmotion', nom: 'Mon film', sous: 'Stop Motion Studio', icone: I.film, couleur: '#E0457B' },
    { type: 'logiciel', ref: 'krita', nom: 'Dessin', sous: 'Krita', icone: I.pinceau, couleur: '#FF7A45' },
    { type: 'site', ref: 'incredibox', nom: 'Mes beats', sous: 'Incredibox', icone: I.beat, couleur: '#7C5CFA' },
    { type: 'site', ref: 'songmaker', nom: 'Mélodies', sous: 'Song Maker', icone: I.note, couleur: '#2B7BD6' },
    { type: 'logiciel', ref: 'writer', nom: 'Écrire', sous: 'Histoires et lettres', icone: I.texte, couleur: '#1F5FA8' },
    { type: 'logiciel', ref: 'audacity', nom: 'Ma voix', sous: 'Audacity', icone: I.micro, couleur: '#5B3FD6' },
    { type: 'logiciel', ref: 'camera', nom: 'Photomaton', sous: 'La caméra', icone: I.camera, couleur: '#13A39F' }
  ] },
  { id: 'lire', nom: 'Mes lectures', tuiles: [
    { type: 'interne', ref: 'carnetLecture', nom: 'Mon carnet de lecture', sous: 'Les livres que j’ai lus', icone: I.livre, couleur: '#B0471B' },
    { type: 'interne', ref: 'journal', nom: 'Mon journal', sous: 'Rien que pour moi', icone: I.coeur, couleur: '#D4537E' }
  ] },
  { id: 'decouvrir', nom: 'Je découvre', tuiles: [
    { type: 'site', ref: 'vikidia', nom: 'Vikidia', sous: 'L’encyclopédie des 8-13 ans', icone: I.loupe, couleur: '#13A39F' },
    { type: 'site', ref: 'wikimini', nom: 'Wikimini', sous: 'Écrite par les enfants', icone: I.cube, couleur: '#2FA36B' },
    { type: 'site', ref: 'unjour', nom: '1jour1actu', sous: 'L’actu expliquée', icone: I.ecran, couleur: '#E8892A' },
    { type: 'site', ref: 'terre', nom: 'Le monde', sous: 'La Terre en 3D', icone: I.globe, couleur: '#2B7BD6' },
    { type: 'site', ref: 'etoiles', nom: 'Les étoiles', sous: 'Le ciel de ce soir', icone: I.etoile, couleur: '#3C3489' },
    { type: 'site', ref: 'vinz', nom: 'Vinz et Lou', sous: 'Internet expliqué', icone: I.question, couleur: '#7C5CFA' }
  ] },
  { id: 'apprendre', nom: 'J’apprends', tuiles: [
    { type: 'interne', ref: 'exposes', nom: 'Mes exposés', sous: 'De l’idée à l’oral', icone: I.diapo, couleur: '#1F5FA8' },
    { type: 'interne', ref: 'pourquoi', nom: 'Grand Pourquoi', sous: 'Mes questions', icone: I.question, couleur: '#7C5CFA' },
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
    { type: 'logiciel', ref: 'calculatrice', nom: 'Calculatrice', sous: 'Comme une vraie', icone: I.calcul, couleur: '#56607A' },
    { type: 'interne', ref: 'minuteur', nom: 'Minuteur', sous: 'Pour me chronométrer', icone: I.minuteur, couleur: '#E8892A' },
    { type: 'site', ref: 'dicoado', nom: 'Dictionnaire', sous: 'Dicoado', icone: I.dico, couleur: '#1F5FA8' },
    { type: 'interne', ref: 'dossiers', nom: 'Mes dossiers', sous: 'Tout ce que je fabrique', icone: I.dossier, couleur: '#F2B33D' }
  ] },
  { id: 'style', nom: 'Mon style', tuiles: [] }
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

function domainesAutorises(sitesConfig) {
  const base = sitesConfig && Array.isArray(sitesConfig) ? sitesConfig : Object.values(SITES).flatMap((s) => s.domaines);
  return Array.from(new Set(base.map((d) => String(d).trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '')).filter(Boolean)));
}

function urlAutorisee(url, domaines) {
  let h;
  try { const u = new URL(url); if (!/^https?:$/.test(u.protocol)) return false; h = u.hostname.toLowerCase(); } catch (e) { return false; }
  return domaines.some((d) => h === d || h.endsWith('.' + d));
}

module.exports = { LOGICIELS, SITES, RUBRIQUES, EXPOSE_ETAPES, INTENTIONS, ICONES: I, domainesAutorises, urlAutorisee };
