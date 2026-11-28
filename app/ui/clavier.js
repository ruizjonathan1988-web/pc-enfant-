'use strict';
// ======================================================================
// TAPER AU CLAVIER : l'apprentissage de la frappe, fait maison (remplace RapidTyping).
// Clavier AZERTY français, un doigt = une couleur, des leçons de 2-3 minutes :
// la rangée de repos, puis le haut, le bas, les majuscules, les accents,
// les touches mortes (^ ¨), la ponctuation, les chiffres, des mots et des phrases.
// La précision compte d'abord, la vitesse ensuite. Pas de son, pas de chrono stressant.
// ======================================================================
/* global S, A, esc, entete, toast, render, sauverProfil */

// ---------- Le clavier : chaque touche physique (code), ce qu'elle écrit, et le doigt qui la frappe ----------
// Les codes sont ceux du clavier physique (KeyQ = la touche qui écrit « a » en AZERTY).
const CLAV_DOIGTS = [
  { id: 'ag5', nom: 'auriculaire gauche', c: '#E57373' }, { id: 'ag4', nom: 'annulaire gauche', c: '#FFB74D' },
  { id: 'ag3', nom: 'majeur gauche', c: '#FFF176' }, { id: 'ag2', nom: 'index gauche', c: '#81C784' },
  { id: 'pouce', nom: 'pouce', c: '#CFD8DC' },
  { id: 'ad2', nom: 'index droit', c: '#4FC3F7' }, { id: 'ad3', nom: 'majeur droit', c: '#9575CD' },
  { id: 'ad4', nom: 'annulaire droit', c: '#F06292' }, { id: 'ad5', nom: 'auriculaire droit', c: '#A1887F' }
];
// [code, sans Maj, avec Maj, doigt]
const CLAV_RANGEES = [
  [['Backquote', '²', '', 'ag5'], ['Digit1', '&', '1', 'ag5'], ['Digit2', 'é', '2', 'ag4'], ['Digit3', '"', '3', 'ag3'], ['Digit4', '\'', '4', 'ag2'], ['Digit5', '(', '5', 'ag2'], ['Digit6', '-', '6', 'ad2'], ['Digit7', 'è', '7', 'ad2'], ['Digit8', '_', '8', 'ad3'], ['Digit9', 'ç', '9', 'ad4'], ['Digit0', 'à', '0', 'ad5'], ['Minus', ')', '°', 'ad5'], ['Equal', '=', '+', 'ad5']],
  [['KeyQ', 'a', 'A', 'ag5'], ['KeyW', 'z', 'Z', 'ag4'], ['KeyE', 'e', 'E', 'ag3'], ['KeyR', 'r', 'R', 'ag2'], ['KeyT', 't', 'T', 'ag2'], ['KeyY', 'y', 'Y', 'ad2'], ['KeyU', 'u', 'U', 'ad2'], ['KeyI', 'i', 'I', 'ad3'], ['KeyO', 'o', 'O', 'ad4'], ['KeyP', 'p', 'P', 'ad5'], ['BracketLeft', '^', '¨', 'ad5'], ['BracketRight', '$', '£', 'ad5']],
  [['KeyA', 'q', 'Q', 'ag5'], ['KeyS', 's', 'S', 'ag4'], ['KeyD', 'd', 'D', 'ag3'], ['KeyF', 'f', 'F', 'ag2'], ['KeyG', 'g', 'G', 'ag2'], ['KeyH', 'h', 'H', 'ad2'], ['KeyJ', 'j', 'J', 'ad2'], ['KeyK', 'k', 'K', 'ad3'], ['KeyL', 'l', 'L', 'ad4'], ['Semicolon', 'm', 'M', 'ad5'], ['Quote', 'ù', '%', 'ad5'], ['Backslash', '*', 'µ', 'ad5']],
  [['IntlBackslash', '<', '>', 'ag5'], ['KeyZ', 'w', 'W', 'ag5'], ['KeyX', 'x', 'X', 'ag4'], ['KeyC', 'c', 'C', 'ag3'], ['KeyV', 'v', 'V', 'ag2'], ['KeyB', 'b', 'B', 'ag2'], ['KeyN', 'n', 'N', 'ad2'], ['KeyM', ',', '?', 'ad2'], ['Comma', ';', '.', 'ad3'], ['Period', ':', '/', 'ad4'], ['Slash', '!', '§', 'ad5']]
];
const CLAV_TOUCHES = {}; // code -> { bas, haut, doigt }
const CLAV_CAR = {}; // caractère -> { code, maj }
CLAV_RANGEES.forEach((r) => r.forEach(([code, bas, haut, doigt]) => {
  CLAV_TOUCHES[code] = { bas, haut, doigt };
  if (bas && !(bas in CLAV_CAR)) CLAV_CAR[bas] = { code, maj: false };
  if (haut && !(haut in CLAV_CAR)) CLAV_CAR[haut] = { code, maj: true };
}));
CLAV_TOUCHES.Space = { bas: ' ', haut: ' ', doigt: 'pouce' }; CLAV_CAR[' '] = { code: 'Space', maj: false };
CLAV_TOUCHES.Enter = { bas: '↵', haut: '↵', doigt: 'ad5' }; CLAV_CAR['\n'] = { code: 'Enter', maj: false };
// Lettres à accent qui demandent une touche morte : ^ puis la lettre (circonflexe), Maj + ^ puis la lettre (tréma).
const CLAV_MORTES = { 'â': ['^', 'a'], 'ê': ['^', 'e'], 'î': ['^', 'i'], 'ô': ['^', 'o'], 'û': ['^', 'u'], 'ë': ['¨', 'e'], 'ï': ['¨', 'i'], 'ü': ['¨', 'u'], 'ö': ['¨', 'o'], 'ä': ['¨', 'a'] };
const clavDoigt = (id) => CLAV_DOIGTS.find((d) => d.id === id) || CLAV_DOIGTS[4];
// Les étapes pour écrire un caractère : [{ code, maj }]. « ê » = la touche ^ puis la touche e.
function clavEtapes(ch) {
  if (CLAV_MORTES[ch]) return CLAV_MORTES[ch].map((x) => CLAV_CAR[x]).filter(Boolean);
  const c = CLAV_CAR[ch] || CLAV_CAR[ch.toLowerCase()];
  return c ? [c] : [];
}
// Ce qui compte comme le même caractère (l'apostrophe du clavier pour l'apostrophe typographique, etc.).
const clavNormal = (c) => (c === '’' || c === '‘' ? '\'' : c === ' ' || c === ' ' ? ' ' : c === '«' || c === '»' ? '"' : c);

// ---------- Les leçons (textes écrits pour Flocon) ----------
const CLAV_LECONS = [
  { id: 'repos-g', titre: 'La maison de la main gauche', nouv: 'q s d f', intro: 'Pose les 4 doigts de ta main gauche sur Q S D F. Sous ton index, sur le F, il y a une petite bosse : c’est ton repère, tu peux le trouver les yeux fermés. Ton pouce attend sur la barre d’espace.',
    lignes: ['ff dd ss qq', 'fd fd sq sq', 'fds sdf qsd dsq', 'ffdd ssqq fdsq qsdf'] },
  { id: 'repos-d', titre: 'La maison de la main droite', nouv: 'j k l m', intro: 'Main droite sur J K L M. Ton index trouve la petite bosse du J. Après chaque touche, tes doigts reviennent à la maison.',
    lignes: ['jj kk ll mm', 'jk jk lm lm', 'jkl lkj mlk klm', 'jjkk llmm jklm mlkj'] },
  { id: 'repos', titre: 'Les deux mains ensemble', nouv: 'q s d f j k l m', intro: 'Les deux mains sur la rangée de la maison. Regarde l’écran, pas tes doigts : c’est le grand secret.',
    lignes: ['fj dk sl qm', 'fjf jfj dkd kdk', 'qsdf jklm qsdf jklm', 'fdj fkl sdl qml jdf'] },
  { id: 'gh', titre: 'Les touches du milieu', nouv: 'g h', intro: 'Le G et le H sont au milieu. Les index se décalent d’une touche vers le centre, puis reviennent sur F et J.',
    lignes: ['fg fg jh jh', 'gg hh gh hg', 'fgf jhj gfg hjh', 'qsdfg hjklm gh hg'] },
  { id: 'haut-g', titre: 'En haut, main gauche', nouv: 'a z e r t', intro: 'Chaque doigt monte d’un cran vers le haut, tape, et redescend à la maison. Le A pour l’auriculaire, le Z pour l’annulaire, le E pour le majeur, R et T pour l’index.',
    lignes: ['fr fr ft ft de de sz sz qa qa', 'le les la sel', 'elle reste garde', 'date salade ferme tarte'] },
  { id: 'haut-d', titre: 'En haut, main droite', nouv: 'y u i o p', intro: 'À droite : Y et U pour l’index, I pour le majeur, O pour l’annulaire, P pour l’auriculaire. Tu peux maintenant écrire plein de mots !',
    lignes: ['ju ju ki ki lo lo mp mp jy jy', 'lui pour toi moi', 'joli papi poule tortue', 'la souris trotte sur le pupitre'] },
  { id: 'bas', titre: 'La rangée du bas', nouv: 'w x c v b n ,', intro: 'Les doigts descendent d’un cran. C et V sont sous D et F. Le N et la virgule sont pour l’index droit.',
    lignes: ['fv fv fb fb jn jn j, j,', 'dc dc sx sx qw qw', 'vache cabane neige', 'un bon chocolat, un ballon', 'taxi wagon boxe'] },
  { id: 'maj', titre: 'Les majuscules', nouv: 'Maj ⇧', intro: 'Pour une majuscule, garde la touche Maj (⇧) enfoncée avec le petit doigt de l’autre main, tape la lettre, puis lâche. Lettre à gauche : Maj de droite. Lettre à droite : Maj de gauche.',
    lignes: ['Paris Lyon Lille Nice', 'Bonjour Mardi Samedi', 'Le chat de Tom dort', 'Marie et Hugo jouent au parc'] },
  { id: 'accents', titre: 'Les accents', nouv: 'é è à ç ù', intro: 'Sur le clavier français, les lettres à accent sont sur la rangée des chiffres, sans Maj : é sur le 2, è sur le 7, ç sur le 9, à sur le 0. Le ù est juste à droite du M.',
    lignes: ['é é è è à à ç ç ù ù', 'école élève mère père', 'le garçon a déjà sa leçon', 'où est la clé de la cabane'] },
  { id: 'mortes', titre: 'Les touches magiques ^ et ¨', nouv: '^ ¨', intro: 'La touche ^ (à droite du P) ne fait rien tout de suite : c’est une touche « morte ». Appuie sur ^, lâche, puis tape la lettre : ê apparaît ! Pour le tréma ¨ : Maj + ^, puis la lettre (ë, ï).',
    lignes: ['ê ê â â î î ô ô û û', 'fête forêt gâteau île', 'bientôt sûr château hôpital', 'Noël maïs naïf'] },
  { id: 'ponctuation', titre: 'La ponctuation', nouv: '. , ? ! \' :', intro: 'La virgule et le point d’exclamation se tapent sans Maj. Le point : Maj + ; et le point d’interrogation : Maj + virgule. L’apostrophe est sur le 4. En français, on met une espace avant ? ! et :',
    lignes: ['Bonjour, ça va ?', 'Oui, très bien !', 'J’aime lire. Et toi ?', 'Attention : le chat dort.'] },
  { id: 'chiffres', titre: 'Les chiffres', nouv: '1 2 3 … 0', intro: 'Surprise du clavier français : les chiffres de la rangée du haut demandent Maj. (S’il y a un pavé numérique à droite, il marche aussi.)',
    lignes: ['1 2 3 4 5 6 7 8 9 0', 'J’ai 9 ans.', 'Il y a 12 mois et 365 jours.', 'Le 14 juillet, on voit 100 fusées.'] },
  { id: 'mots', titre: 'Les mots de tous les jours', nouv: 'CE2 – CM2', intro: 'Des mots qu’on écrit souvent à l’école. Tape-les tranquillement, en pensant à leur orthographe.',
    lignes: ['aujourd’hui beaucoup toujours', 'maintenant pourquoi longtemps', 'ensemble souvent jamais pendant', 'quelquefois peut-être après'] },
  { id: 'dictee', titre: 'Petite dictée de mots', nouv: 'de mémoire', cache: true, intro: 'Chaque ligne s’affiche 4 secondes, puis se cache. Écris-la de mémoire ! Si tu as oublié, « Revoir » la remontre un instant.',
    lignes: ['une fleur, un oiseau', 'la maison, le jardin', 'demain, hier, toujours', 'un cheval, des chevaux', 'la tête, la fenêtre'] },
  { id: 'phrases', titre: 'Des phrases rigolotes', nouv: 'phrases', intro: 'Des phrases entières, avec majuscules et points. À la fin de chaque ligne, appuie sur Entrée ↵.', entree: true,
    lignes: ['Mon chien porte des lunettes pour lire.', 'La lune a perdu ses chaussettes.', 'Un crocodile mange des crêpes au goûter.', 'Le frigo chante quand il a froid.'] },
  { id: 'texte', titre: 'Un petit texte', nouv: 'texte', intro: 'Un vrai petit texte. Prends ton temps : la précision d’abord, la vitesse viendra toute seule.', entree: true,
    lignes: ['Ce matin, le vent souffle fort.', 'Les feuilles dansent dans la cour.', 'Léa met son bonnet et sourit.', 'Elle aime l’automne, surtout les marrons !'] }
];
const CLAV_PHRASES_DU_JOUR = [
  'Le hibou lit un livre sous la lune.', 'Ma trousse est un zoo de crayons.', 'Une tortue a gagné la course, encore !', 'Le soleil fait la sieste derrière un nuage.',
  'Mon vélo rêve de voler.', 'Les pingouins aiment les glaces au chocolat.', 'Un dragon timide a peur des souris.', 'La pluie joue du tambour sur le toit.',
  'Le chat compte les étoiles avant de dormir.', 'Une fourmi porte une miette géante.', 'La mer chatouille mes pieds.', 'Mon goûter a disparu : enquête en cours !'
];

const CLAV = { l: null, pos: 0, erreurs: 0, justes: 0, debut: 0, fin: 0, montre: 0, maj: false, mort: null, enchaine: 0, minut: null, fautes: {} };
const clavProfil = () => { if (!S.profil.clavier) S.profil.clavier = { lecons: {}, record: 0 }; return S.profil.clavier; };
const clavEtoiles = (id) => ((clavProfil().lecons[id] || {}).etoiles || 0);
const clavOuverte = (i) => i === 0 || clavEtoiles(CLAV_LECONS[i - 1].id) >= 1;
const clavPhraseDuJour = () => { const d = new Date(); return CLAV_PHRASES_DU_JOUR[(d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate()) % CLAV_PHRASES_DU_JOUR.length]; };

// ---------- Vues ----------
function vueClavier() {
  const v = S.vue;
  if (v.pause) return clavVuePause();
  if (v.resultat) return clavVueResultat();
  if (v.exo) return clavVueExo();
  if (v.libre) return clavVueLibre();
  const p = clavProfil(); const tot = CLAV_LECONS.reduce((n, l) => n + clavEtoiles(l.id), 0);
  return `<div class="section clav">${entete('Taper au clavier', `<span class="etiquette">${tot} ★ sur ${CLAV_LECONS.length * 3}</span>`)}
    <div class="panneau clav-chapo"><div class="grow"><h3>Taper vite… et surtout juste !</h3>
      <p class="muet" style="margin:4px 0 0">Chaque doigt a ses touches, chacune a sa couleur. Une leçon dure 2 ou 3 minutes : fais-en une ou deux par jour, c’est comme ça qu’on progresse.</p></div>
      <div class="clav-mains-mini">${clavMainsHtml(null)}</div></div>
    <div class="clav-lecons">${CLAV_LECONS.map((l, i) => { const e = clavEtoiles(l.id); const o = clavOuverte(i);
      return `<button class="clav-lecon ${o ? '' : 'fermee'} ${e ? 'faite' : ''}" ${o ? `data-a="clavLecon" data-i="${i}"` : 'disabled'}>
        <span class="num">${o ? i + 1 : '🔒'}</span><span class="grow"><b>${esc(l.titre)}</b><br><span class="muet">${esc(l.nouv)}</span></span>
        <span class="etoiles">${'★'.repeat(e)}<span class="vide">${'★'.repeat(3 - e)}</span></span></button>`; }).join('')}</div>
    <div class="panneau clav-libre-carte"><div class="grow"><h3>Mon texte à moi</h3><p class="muet" style="margin:4px 0 0">Tape le texte de ton choix, ou la phrase du jour. Et si tu veux : la course contre ton record${p.record ? ` (${p.record} mots/min)` : ''}.</p></div>
      <div class="rang"><button class="btn doux" data-a="clavLibre">✍️ Mon texte</button><button class="btn doux" data-a="clavCourse">🏁 Contre mon record</button></div></div></div>`;
}

function clavVueLibre() {
  return `<div class="section clav">${entete('Mon texte à moi')}
    <div class="panneau"><h3>Quel texte veux-tu taper ?</h3>
      <p class="muet" style="margin:0 0 8px">Recopie une phrase de ton livre, une poésie que tu apprends, ta liste de courses… ou la phrase du jour.</p>
      <textarea class="champ" id="clav-texte-libre" rows="4" maxlength="600" placeholder="Écris ou colle ton texte ici">${esc(S.vue.texteLibre || '')}</textarea>
      <div class="rang" style="margin-top:10px"><button class="btn doux" data-a="clavPhraseJour">☀️ La phrase du jour</button><button class="btn" data-a="clavLibreGo">C’est parti</button></div></div></div>`;
}

// La zone de frappe : la ligne en cours (et la suivante), le doigt à utiliser, le clavier.
function clavVueExo() {
  const l = CLAV.l; if (!l) return '';
  return `<div class="section clav clav-exo">${entete(l.titre, `<span class="etiquette" id="clav-avance"></span>`)}
    ${CLAV.pos === 0 && !CLAV.debut ? `<div class="clav-intro">${esc(l.intro || '')}</div>` : '<div class="clav-intro" style="visibility:hidden"></div>'}
    <div class="clav-zone" data-a="clavFocus">
      ${l.course ? '<div class="clav-fantome"><span id="clav-fantome"></span><span id="clav-moi"></span></div>' : ''}
      <div class="clav-ligne" id="clav-ligne"></div>
      <div class="clav-suite" id="clav-suite"></div>
      <div class="clav-consigne" id="clav-consigne"></div>
      ${l.cache ? '<button class="btn doux petit clav-revoir" data-a="clavRevoir">👀 Revoir</button>' : ''}
      <input id="clav-saisie" class="clav-saisie" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Zone de frappe">
    </div>
    <div class="clav-bas"><div class="clav-clavier" id="clav-clavier">${clavClavierHtml()}</div><div class="clav-mains" id="clav-mains">${clavMainsHtml(null)}</div></div></div>`;
}

function clavClavierHtml() {
  const t = (code, k, cls) => { const d = clavDoigt(k.doigt); return `<span class="clav-t ${cls || ''}" data-code="${code}" style="--d:${d.c}">${k.haut && k.haut !== k.bas.toUpperCase() ? `<i>${esc(k.haut)}</i>` : ''}<b>${esc(k.bas === k.bas.toLowerCase() && /[a-z]/.test(k.bas) ? k.bas.toUpperCase() : k.bas)}</b>${code === 'KeyF' || code === 'KeyJ' ? '<u></u>' : ''}</span>`; };
  const r = CLAV_RANGEES;
  return `<div class="clav-r">${r[0].map(([c]) => t(c, CLAV_TOUCHES[c])).join('')}<span class="clav-t large gris" data-code="Backspace"><b>⌫</b></span></div>
    <div class="clav-r"><span class="clav-t large gris"><b>↹</b></span>${r[1].map(([c]) => t(c, CLAV_TOUCHES[c])).join('')}<span class="clav-t entree" data-code="Enter" style="--d:${clavDoigt('ad5').c}"><b>↵</b></span></div>
    <div class="clav-r"><span class="clav-t xlarge gris"><b>⇪</b></span>${r[2].map(([c]) => t(c, CLAV_TOUCHES[c])).join('')}</div>
    <div class="clav-r"><span class="clav-t large maj" data-code="ShiftLeft" style="--d:${clavDoigt('ag5').c}"><b>⇧ Maj</b></span>${r[3].map(([c]) => t(c, CLAV_TOUCHES[c])).join('')}<span class="clav-t xxlarge maj" data-code="ShiftRight" style="--d:${clavDoigt('ad5').c}"><b>⇧ Maj</b></span></div>
    <div class="clav-r"><span class="clav-t espace" data-code="Space" style="--d:${clavDoigt('pouce').c}"><b></b></span></div>`;
}
// Deux mains schématiques : un doigt = une couleur ; le doigt à utiliser s'allume.
function clavMainsHtml(actif) {
  const h = [34, 46, 52, 44, 26]; // hauteurs : auriculaire, annulaire, majeur, index, pouce
  const main = (ids, inverse) => { const l = ids.map((id, k) => `<span class="clav-doigt ${actif && actif.includes(id) ? 'on' : ''}" style="--d:${clavDoigt(id).c};height:${h[k]}px"></span>`); return `<div class="clav-main">${(inverse ? l.reverse() : l).join('')}<div class="paume"></div></div>`; };
  return `${main(['ag5', 'ag4', 'ag3', 'ag2', 'pouce'], false)}${main(['ad5', 'ad4', 'ad3', 'ad2', 'pouce'], true)}`;
}

function clavVueResultat() {
  const r = S.vue.resultat; const l = CLAV.l; const i = CLAV_LECONS.findIndex((x) => x.id === (l && l.id));
  const suivante = i >= 0 && i < CLAV_LECONS.length - 1 && r.etoiles >= 1;
  const conseil = r.precision < 85 ? 'Ralentis un peu : mieux vaut lentement et juste. La vitesse vient toute seule, avec le temps.' : r.etoiles < 3 ? 'Encore une fois, en regardant l’écran et pas tes doigts ? Tu peux y arriver !' : 'Bravo ! Tes doigts connaissent le chemin.';
  const pires = Object.entries(CLAV.fautes).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => (c === ' ' ? 'espace' : c === '\n' ? 'Entrée' : c));
  return `<div class="section clav">${entete(l ? l.titre : 'Résultat')}
    <div class="panneau clav-resultat">
      ${l && !l.libre ? `<div class="clav-grosses-etoiles">${'<span>★</span>'.repeat(r.etoiles)}${'<span class="vide">★</span>'.repeat(3 - r.etoiles)}</div>` : ''}
      <div class="rang" style="justify-content:center;gap:30px"><div class="clav-chiffre"><b>${r.precision} %</b><span>de touches justes</span></div><div class="clav-chiffre"><b>${r.mpm}</b><span>mots par minute</span></div></div>
      ${r.record ? '<p class="clav-record">🏁 Nouveau record !</p>' : ''}
      <p>${esc(conseil)}</p>${pires.length ? `<p class="muet">Les touches à retravailler : <b>${pires.map(esc).join(', ')}</b></p>` : ''}
      <div class="rang" style="justify-content:center"><button class="btn doux" data-a="clavRecommencer">↻ Recommencer</button>${suivante ? `<button class="btn" data-a="clavLecon" data-i="${i + 1}">Leçon suivante ›</button>` : ''}<button class="btn doux" data-a="clavAccueil">Toutes les leçons</button></div>
      ${l && !l.libre && r.etoiles < 1 ? '<p class="muet">Il faut au moins une étoile (85 % de touches justes) pour ouvrir la leçon suivante.</p>' : ''}</div></div>`;
}

function clavVuePause() {
  return `<div class="section clav">${entete('Une petite pause ?')}
    <div class="panneau clav-pause"><div class="clav-pause-e">🙌</div><h3>Tu as fait trois leçons d’affilée !</h3>
      <p>Lève-toi, secoue tes mains, ouvre et ferme les doigts dix fois, regarde au loin par la fenêtre. Tes doigts (et tes yeux) te diront merci.</p>
      <div class="clav-minuteur" id="clav-minuteur">30</div>
      <div class="rang" style="justify-content:center"><button class="btn" data-a="clavFinPause">C’est fait !</button></div></div></div>`;
}

// ---------- Mécanique de la frappe ----------
function clavCommencer(l) {
  clearTimeout(CLAV.minut);
  Object.assign(CLAV, { l, texte: l.lignes.map((x) => x.replace(/’/g, '\'')).join(l.entree ? '\n' : ' '), pos: 0, erreurs: 0, justes: 0, debut: 0, fin: 0, montre: 0, maj: false, mort: null, fautes: {} });
  S.vue = { ref: 'clavier', exo: true }; render();
  if (l.cache) clavMontrer(4000);
}
function clavMontrer(ms) { CLAV.montre = Date.now() + ms; clavMaj(); setTimeout(clavMaj, ms + 30); }
// Le texte est découpé en lignes d'environ 34 caractères (ou à chaque Entrée) pour rester lisible en gros.
function clavDecouper() {
  if (CLAV.lignesCalc) return CLAV.lignesCalc;
  const t = CLAV.texte; const l = []; let i = 0;
  while (i < t.length) {
    let fin = t.indexOf('\n', i); if (fin < 0) fin = t.length;
    if (fin - i > 34) { const s = t.lastIndexOf(' ', i + 34); fin = s > i ? s : Math.min(t.length, i + 34); }
    l.push([i, Math.min(t.length, fin + 1)]); i = fin + 1;
  }
  CLAV.lignesCalc = l; return l;
}
function clavMaj() {
  const z = document.getElementById('clav-ligne'); if (!z || !CLAV.l) return;
  const t = CLAV.texte; const lignes = clavDecouper(); const k = Math.max(0, lignes.findIndex(([a, b]) => CLAV.pos >= a && CLAV.pos < b));
  const [a, b] = lignes[k] || [0, t.length];
  const cache = CLAV.l.cache && Date.now() > CLAV.montre;
  const car = (c) => (c === ' ' ? '<span class="esp">·</span>' : c === '\n' ? '<span class="ent">↵</span>' : esc(c === '\'' ? '’' : c));
  let html = '';
  for (let i = a; i < b; i++) {
    const c = t[i]; const cls = i < CLAV.pos ? 'ok' : i === CLAV.pos ? 'ici' : 'apres';
    html += `<span class="${cls}${i === CLAV.pos && CLAV.faux ? ' faux' : ''}">${cache && i >= CLAV.pos && c !== ' ' && c !== '\n' ? '•' : car(c)}</span>`;
  }
  z.innerHTML = html;
  const s = document.getElementById('clav-suite'); if (s) { const n = lignes[k + 1]; s.textContent = n && !CLAV.l.cache ? t.slice(n[0], n[1]).replace(/\n/g, '').replace(/'/g, '’') : ''; }
  const av = document.getElementById('clav-avance'); if (av) av.textContent = `${Math.round((CLAV.pos / t.length) * 100)} %`;
  // La prochaine touche (et Maj s'il le faut) s'allume ; le doigt aussi.
  document.querySelectorAll('#clav-clavier .clav-t.vise').forEach((e) => e.classList.remove('vise'));
  const ch = t[CLAV.pos]; let consigne = ''; const doigts = [];
  if (cache && ch !== ' ' && ch !== '\n') consigne = 'De mémoire ! (« Revoir » si tu as oublié)';
  else if (ch !== undefined) {
    let etapes = clavEtapes(ch); if (CLAV.mort && etapes.length === 2) etapes = etapes.slice(1);
    const e = etapes[0];
    if (e) {
      const k2 = CLAV_TOUCHES[e.code]; const dg = clavDoigt(k2.doigt); doigts.push(dg.id);
      const cible = document.querySelector(`#clav-clavier [data-code="${e.code}"]`); if (cible) cible.classList.add('vise');
      if (e.maj) { const gauche = dg.id.startsWith('ag'); const m = document.querySelector(`#clav-clavier [data-code="${gauche ? 'ShiftRight' : 'ShiftLeft'}"]`); if (m) m.classList.add('vise'); doigts.push(gauche ? 'ad5' : 'ag5'); }
      const quoi = ch === ' ' ? 'la barre d’espace' : ch === '\n' ? 'Entrée ↵' : `« ${ch === '\'' ? '’' : ch} »`;
      consigne = `${quoi} : ${dg.nom}${e.maj ? ' + Maj avec l’autre main' : ''}${etapes.length === 2 ? ` — d’abord ${e.maj ? 'Maj + ' : ''}^ (touche morte), puis la lettre` : ''}`;
    } else consigne = `« ${ch} »`;
  }
  const co = document.getElementById('clav-consigne'); if (co) co.textContent = consigne;
  const m = document.getElementById('clav-mains'); if (m) m.innerHTML = clavMainsHtml(doigts);
  if (CLAV.l.course) clavFantome();
}
function clavFantome() {
  const f = document.getElementById('clav-fantome'); const moi = document.getElementById('clav-moi'); if (!f || !moi) return;
  const rec = clavProfil().record || 0; const t = CLAV.texte.length;
  const ecoule = CLAV.debut ? (Date.now() - CLAV.debut) / 60000 : 0;
  f.style.width = Math.min(100, ((rec * 5 * ecoule) / t) * 100) + '%'; moi.style.width = (CLAV.pos / t) * 100 + '%';
}
function clavTaper(c) {
  if (!CLAV.l || CLAV.fin || S.vue.ref !== 'clavier' || !S.vue.exo) return;
  const attendu = CLAV.texte[CLAV.pos]; if (attendu === undefined) return;
  if (!CLAV.debut) { CLAV.debut = Date.now(); const intro = document.querySelector('.clav-intro'); if (intro) intro.style.visibility = 'hidden'; if (CLAV.l.course) CLAV.tic = setInterval(clavFantome, 200); }
  CLAV.mort = null;
  if (clavNormal(c) === clavNormal(attendu)) { CLAV.pos++; CLAV.justes++; CLAV.faux = false; }
  else { CLAV.erreurs++; CLAV.fautes[attendu] = (CLAV.fautes[attendu] || 0) + 1; CLAV.faux = true; clavClignote(c); }
  if (CLAV.pos >= CLAV.texte.length) return clavTerminer();
  if (CLAV.l.cache) { const lignes = clavDecouper(); if (lignes.some(([a]) => a === CLAV.pos)) clavMontrer(4000); }
  clavMaj();
}
// La touche fautive clignote doucement en rouge (pas de son).
function clavClignote(c) {
  const e = clavEtapes(c); const code = e.length ? e[e.length - 1].code : null;
  const el = code && document.querySelector(`#clav-clavier [data-code="${code}"]`);
  if (el) { el.classList.remove('rouge'); void el.offsetWidth; el.classList.add('rouge'); }
}
function clavTerminer() {
  CLAV.fin = Date.now(); clearInterval(CLAV.tic);
  const min = Math.max(1 / 60, (CLAV.fin - CLAV.debut) / 60000);
  const precision = Math.round((CLAV.justes / Math.max(1, CLAV.justes + CLAV.erreurs)) * 100);
  const mpm = Math.round(CLAV.texte.length / 5 / min);
  const etoiles = precision >= 97 && mpm >= 8 ? 3 : precision >= 92 ? 2 : precision >= 85 ? 1 : 0;
  const p = clavProfil(); let record = false;
  if (!CLAV.l.libre) { const ancien = p.lecons[CLAV.l.id] || {}; p.lecons[CLAV.l.id] = { etoiles: Math.max(ancien.etoiles || 0, etoiles), precision: Math.max(ancien.precision || 0, precision), mpm: Math.max(ancien.mpm || 0, mpm), le: new Date().toISOString() }; }
  // Le record : sur la course, ou sur un texte d'au moins 40 caractères (phrases, texte, mon texte), avec 90 % de justes.
  if (precision >= 90 && mpm > (p.record || 0) && (CLAV.l.course || ((CLAV.l.libre || CLAV.l.entree) && CLAV.texte.length >= 40))) { p.record = mpm; record = true; }
  p.minutes = Math.round(((p.minutes || 0) + min) * 10) / 10;
  sauverProfil();
  CLAV.enchaine = (CLAV.enchaine || 0) + 1;
  S.vue = { ref: 'clavier', resultat: { precision, mpm, etoiles, record } };
  render();
}

// Saisie : un champ caché garde le focus. Les touches mortes (^ ¨) passent par la composition du système :
// on ne lit le caractère qu'une fois composé (« ê »), jamais le « ^ » seul.
function clavBrancher() {
  const el = document.getElementById('clav-saisie'); if (!el || el.dataset.branche) return; el.dataset.branche = '1';
  const lire = () => { const v = el.value; el.value = ''; for (const c of v) clavTaper(c); };
  el.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.altKey) return; // raccourcis : ignorés (AltGr = Ctrl + Alt, on le laisse passer)
    if (e.key === 'Dead') { CLAV.mort = e.code; clavMaj(); return; }
    if (e.key === 'Enter') { e.preventDefault(); clavTaper('\n'); return; }
    if (e.key === 'Backspace' || e.key === 'Tab') { e.preventDefault(); }
  });
  el.addEventListener('input', (e) => { if (e.isComposing) return; lire(); });
  el.addEventListener('compositionend', () => setTimeout(lire, 0));
  el.addEventListener('blur', () => setTimeout(() => { if (document.getElementById('clav-saisie') === el && !document.querySelector('.voile .carte')) el.focus(); }, 50));
  el.focus();
}

function clavApresRendu() {
  if (!S.vue || S.vue.ref !== 'clavier') { clearTimeout(CLAV.minut); return; }
  if (S.vue.exo) { CLAV.lignesCalc = null; clavBrancher(); clavMaj(); }
  if (S.vue.pause) {
    clearTimeout(CLAV.minut); let n = 30;
    const tic = () => { const m = document.getElementById('clav-minuteur'); if (!m) return; m.textContent = n > 0 ? n : '✓'; if (n-- > 0) CLAV.minut = setTimeout(tic, 1000); };
    tic();
  }
}

Object.assign(A, {
  clavLecon: (d) => {
    if (CLAV.enchaine >= 3) { CLAV.enchaine = 0; CLAV.apresPause = Number(d.i); S.vue = { ref: 'clavier', pause: true }; render(); return; }
    clavCommencer(CLAV_LECONS[Number(d.i)]);
  },
  clavFinPause: () => { clearTimeout(CLAV.minut); const i = CLAV.apresPause; CLAV.apresPause = undefined; if (i !== undefined) clavCommencer(CLAV_LECONS[i]); else { S.vue = { ref: 'clavier' }; render(); } },
  clavRecommencer: () => { if (CLAV.l) clavCommencer(CLAV.l); },
  clavAccueil: () => { S.vue = { ref: 'clavier' }; render(); },
  clavFocus: () => { const el = document.getElementById('clav-saisie'); if (el) el.focus(); },
  clavRevoir: () => { clavMontrer(2000); const el = document.getElementById('clav-saisie'); if (el) el.focus(); },
  clavLibre: () => { S.vue = { ref: 'clavier', libre: true }; render(); const t = document.getElementById('clav-texte-libre'); if (t) t.focus(); },
  clavPhraseJour: () => { S.vue.texteLibre = clavPhraseDuJour(); render(); },
  clavLibreGo: () => {
    const t = document.getElementById('clav-texte-libre'); const texte = String((t && t.value) || S.vue.texteLibre || '').replace(/\s*\n\s*/g, '\n').replace(/[ \t]+/g, ' ').trim();
    if (texte.length < 3) { toast('Écris d’abord un texte, ou choisis la phrase du jour.'); return; }
    clavCommencer({ id: 'libre', titre: 'Mon texte', libre: true, entree: texte.includes('\n'), intro: 'Ton texte à toi. Tranquillement : la précision d’abord.', lignes: texte.split('\n') });
  },
  clavCourse: () => {
    const l = CLAV_PHRASES_DU_JOUR.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    const rec = clavProfil().record;
    clavCommencer({ id: 'course', titre: 'Contre mon record', libre: true, course: true, intro: rec ? `La barre grise avance à la vitesse de ton record (${rec} mots/min). La rose, c’est toi. Les fautes comptent : 90 % de touches justes au moins pour battre ton record !` : 'Pas encore de record : celui-ci sera le premier ! Au moins 90 % de touches justes.', lignes: l });
  }
});
// « Retour » pendant une leçon ramène à la liste des leçons, pas au bureau.
const fermerVueAvantClavier = A.fermerVue;
A.fermerVue = async (d) => {
  if (S.vue && S.vue.ref === 'clavier' && (S.vue.exo || S.vue.resultat || S.vue.libre || S.vue.pause)) { clearInterval(CLAV.tic); clearTimeout(CLAV.minut); S.vue = { ref: 'clavier' }; render(); return; }
  fermerVueAvantClavier(d);
};

(() => { const st = document.createElement('style'); st.textContent = `
  .clav-chapo{display:flex;flex-direction:row;gap:16px;align-items:center}
  .clav-chapo .clav-mains-mini{flex:none}
  .clav-mains-mini{display:flex;gap:18px;transform:scale(.8)}
  .clav-lecons{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}
  .clav-lecon{display:flex;gap:12px;align-items:center;text-align:left;background:#fff;border-radius:14px;padding:10px 14px;box-shadow:0 2px 8px rgba(30,42,74,.08);font:inherit;color:#1E2A4A;cursor:pointer}
  .clav-lecon .num{width:34px;height:34px;border-radius:50%;background:#EEF1FF;display:grid;place-items:center;font-weight:800;flex:none}
  .clav-lecon.faite .num{background:#C8F0D5}
  .clav-lecon.fermee{opacity:.5;cursor:default}
  .clav-lecon .etoiles{color:#F5B400;font-size:18px;white-space:nowrap}.etoiles .vide,.clav-grosses-etoiles .vide{color:#D8DCE8}
  .clav-libre-carte{display:flex;gap:14px;align-items:center;flex-wrap:wrap}
  .clav-exo{gap:8px}
  .clav-intro{background:#FFF8E1;border-radius:12px;padding:8px 14px;font-size:15px;line-height:1.35;min-height:20px}
  .clav-zone{position:relative;background:#fff;border-radius:16px;padding:14px 20px;box-shadow:0 2px 10px rgba(30,42,74,.1);cursor:text}
  .clav-ligne{font:600 34px/1.3 'Outfit',system-ui,sans-serif;letter-spacing:.5px;white-space:pre-wrap;min-height:44px;color:#1E2A4A}
  .clav-ligne .ok{color:#2E9E5B}.clav-ligne .apres{color:#3A4566}
  .clav-ligne .ici{background:#FFE082;border-radius:4px;box-shadow:inset 0 -4px 0 #F5A623}
  .clav-ligne .ici.faux{background:#FFCDD2;box-shadow:inset 0 -4px 0 #E57373;animation:clav-tremble .25s}
  .clav-ligne .esp,.clav-ligne .ent{color:#B0B8CC}
  .clav-suite{font-size:20px;color:#8A93AB;min-height:26px;margin-top:2px}
  .clav-consigne{font-size:16px;color:#5B3FD6;font-weight:700;margin-top:6px;min-height:22px}
  .clav-revoir{position:absolute;right:14px;top:12px}
  .clav-saisie{position:absolute;opacity:0;width:1px;height:1px;left:0;top:0;border:0;padding:0}
  .clav-fantome{position:relative;height:10px;border-radius:5px;background:#EEF1FF;margin-bottom:8px;overflow:hidden}
  .clav-fantome span{position:absolute;left:0;top:0;height:5px;border-radius:3px;transition:width .2s}
  #clav-fantome{background:#9AA3BA}#clav-moi{top:5px;background:#E0457B}
  .clav-bas{display:flex;gap:16px;align-items:flex-end;justify-content:center}
  .clav-clavier{display:flex;flex-direction:column;gap:4px;background:#2B3250;padding:8px;border-radius:12px}
  .clav-r{display:flex;gap:4px}
  .clav-t{position:relative;width:40px;height:40px;border-radius:7px;background:var(--d,#ccc);display:flex;flex-direction:column;align-items:center;justify-content:center;font:700 15px/1 'Outfit',system-ui,sans-serif;color:#1E2A4A;box-shadow:inset 0 -3px 0 rgba(0,0,0,.18);opacity:.62;transition:opacity .15s,transform .15s}
  .clav-t i{font-style:normal;font-size:10px;opacity:.75;position:absolute;top:3px;left:5px}
  .clav-t b{font-weight:800}
  .clav-t u{position:absolute;bottom:6px;width:10px;height:2px;background:#1E2A4A;border-radius:1px}
  .clav-t.gris{background:#5A6385;color:#fff;opacity:.5}
  .clav-t.large{width:62px}.clav-t.xlarge{width:72px}.clav-t.xxlarge{width:96px}.clav-t.entree{width:52px}
  .clav-t.espace{width:300px;margin-left:178px}
  .clav-t.vise{opacity:1;transform:translateY(-2px) scale(1.08);outline:3px solid #fff;box-shadow:0 0 0 6px rgba(255,255,255,.35),inset 0 -3px 0 rgba(0,0,0,.18);z-index:1}
  .clav-t.rouge{animation:clav-rouge .6s}
  @keyframes clav-rouge{0%,100%{}30%{background:#E53935;opacity:1}}
  @keyframes clav-tremble{0%,100%{transform:none}30%{transform:translateX(-2px)}70%{transform:translateX(2px)}}
  .clav-mains{display:flex;gap:22px;padding-bottom:6px}
  .clav-main{display:flex;gap:4px;align-items:flex-end;position:relative;padding-bottom:26px}
  .clav-main .paume{position:absolute;left:0;right:0;bottom:0;height:30px;border-radius:12px 12px 18px 18px;background:#F1D9C8}
  .clav-doigt{width:15px;border-radius:8px 8px 3px 3px;background:var(--d);opacity:.55;position:relative;z-index:1;transition:transform .15s,opacity .15s}
  .clav-doigt.on{opacity:1;transform:translateY(-6px);box-shadow:0 0 0 3px #1E2A4A}
  .clav-resultat{text-align:center;align-items:center}
  .clav-grosses-etoiles{font-size:54px;color:#F5B400;letter-spacing:6px}
  .clav-chiffre{display:flex;flex-direction:column}.clav-chiffre b{font-size:34px}.clav-chiffre span{color:#6B7490}
  .clav-record{font-weight:800;color:#E0457B;font-size:20px}
  .clav-pause{text-align:center;align-items:center}.clav-pause-e{font-size:60px}
  .clav-minuteur{font-size:48px;font-weight:800;color:#5B3FD6}
  @media (max-height:800px){.clav-t{width:36px;height:34px;font-size:14px}.clav-t.large{width:56px}.clav-t.xlarge{width:64px}.clav-t.xxlarge{width:86px}.clav-t.entree{width:46px}.clav-t.espace{width:270px;margin-left:160px}.clav-ligne{font-size:30px}.clav-intro{font-size:14px;padding:6px 12px}.clav-mains{transform:scale(.8);transform-origin:bottom}}
`; document.head.appendChild(st); })();
