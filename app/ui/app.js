'use strict';
/* global FONDS */
const F = window.flocon;
const $ = (s) => document.querySelector(s);
const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ic = (d, coul, taille) => `<svg width="${taille || 26}" height="${taille || 26}" viewBox="0 0 24 24" fill="none" stroke="${coul || '#fff'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

let D = null; // données d'initialisation
const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const isoJour = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
function lundiDe(date) { const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; }
const idSemaine = (date) => isoJour(lundiDe(date));
const jourIdx = (date) => (date.getDay() + 6) % 7;
const niveau = () => (S.config && S.config.niveau) || 1;
const S = {
  ecran: 'chargement', etape: 0, profil: null, config: null, etat: null,
  accueil: { etape: 'tirelire', jetons: 1, aDeuxPin: null, intention: null, libre: '' },
  seance: null, rubrique: null, vue: null, bulle: null, conseil: 0, toast: null, voile: null,
  averti2: false, docs: {}, minuteur: null
};

// Les compagnons : deux familles (pensées CE2-CM1 et CM1-6e), présentées sans étiquette d'âge.
const COMPAGNONS = {
  pingouin: { nom: 'Pingouin', idee: 'Flocon', famille: 'doux' }, renardpolaire: { nom: 'Renard polaire', idee: 'Givre', famille: 'doux' },
  phoque: { nom: 'Phoque', idee: 'Galet', famille: 'doux' }, loutre: { nom: 'Loutre', idee: 'Ricochet', famille: 'doux' },
  hibou: { nom: 'Hibou', idee: 'Pépin', famille: 'doux' }, axolotl: { nom: 'Axolotl', idee: 'Bulle', famille: 'doux' },
  dragon: { nom: 'Petit dragon', idee: 'Braise', famille: 'doux' },
  pandaroux: { nom: 'Panda roux', idee: 'Kumo', famille: 'grands' }, renard: { nom: 'Renard', idee: 'Roussette', famille: 'grands' },
  raton: { nom: 'Raton laveur', idee: 'Bandit', famille: 'grands' }, lynx: { nom: 'Lynx', idee: 'Pinceau', famille: 'grands' },
  corbeau: { nom: 'Corbeau', idee: 'Corvo', famille: 'grands' }, cameleon: { nom: 'Caméléon', idee: 'Kaméo', famille: 'grands' },
  capybara: { nom: 'Capybara', idee: 'Pacha', famille: 'grands' }
};
const nomEspece = (id) => (COMPAGNONS[id] || {}).nom || id;
const ENVIES = [
  { id: 'films', texte: 'Faire des films', rub: 'creer' }, { id: 'dessin', texte: 'Dessiner', rub: 'creer' },
  { id: 'scratch', texte: 'Inventer des jeux', rub: 'creer' }, { id: 'musique', texte: 'Faire de la musique', rub: 'creer' },
  { id: 'lire', texte: 'Lire et écrire', rub: 'lire' }, { id: 'decouvrir', texte: 'Découvrir le monde', rub: 'decouvrir' },
  { id: 'exposes', texte: 'Préparer mes exposés', rub: 'apprendre' }, { id: 'jouer', texte: 'Jouer', rub: 'jeux' },
  { id: 'photos', texte: 'Mes photos et ma musique', rub: 'medias' }
];
const ETAPES_ATELIER = ['bienvenue', 'prenom', 'compagnon', 'monde', 'portrait', 'envies', 'pacte'];

function profilParDefaut() {
  return { prenom: (D.config.enfant && D.config.enfant.prenom) || '', compagnon: { id: 'pingouin', nom: 'Flocon' }, theme: 'saisons', photoFond: null, avatar: null, envies: [], signatures: {}, floconVisible: true, atelierFait: false };
}
function sauverProfil() { return F.profil(S.profil); }
function nomCompa() { return (S.profil && S.profil.compagnon && S.profil.compagnon.nom) || 'Flocon'; }
function prenom() { return (S.profil && S.profil.prenom) || ''; }

function imgCompa(pose, id, repli) {
  const cid = id || (S.profil && S.profil.compagnon.id) || 'pingouin';
  const c = D.compagnons.find((x) => x.id === cid) || D.compagnons.find((x) => x.id === 'pingouin') || D.compagnons[0];
  if (!c) return '';
  const p = c.poses.includes(pose) ? pose : c.poses.includes(repli) ? repli : (c.poses.includes('salut') ? 'salut' : c.poses[0]);
  return `img/compagnons/${c.id}/${p}${c.ext}`;
}

// ---------- fond et thème ----------
function appliquerFond() {
  const t = FONDS.resoudre(S.profil ? S.profil.theme : 'saisons');
  document.documentElement.style.setProperty('--accent', t.accent);
  const f = $('#fond');
  if (S.profil && S.profil.photoFond) f.innerHTML = `<img src="${esc(S.profil.photoFond)}" alt="">`;
  else f.innerHTML = t.svg;
  document.body.classList.toggle('clair', !!t.clair && !(S.profil && S.profil.photoFond));
}

// ---------- code parent ----------
async function empreinte(pin, sel) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(sel) + ':' + String(pin)));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function pinOk(pin) {
  if (!S.config.pinHash) return D.dev; // sans code configuré, seul le mode test laisse passer
  return (await empreinte(pin, S.config.pinSel)) === S.config.pinHash;
}
function demanderPin(titre, suite) { S.voile = { type: 'pin', titre, saisie: '', suite, erreur: false }; render(); }

// ---------- temps ----------
function resteMinutes() {
  if (!S.seance) return null;
  const e = S.etat;
  if (e && e.session && e.session.id === S.seance.id) return e.session.fermee ? 0 : e.resteMinutes;
  const ecoule = Math.floor((Date.now() - S.seance.debut) / 60000);
  return Math.max(0, S.seance.prevu - ecoule);
}
function jetonsRestants() {
  const e = S.etat;
  if (e && e.semaine) return e.jetonsRestants;
  return S.config.jetonsSemaine;
}

async function sonder() {
  try {
    const r = await F.etat();
    const ancien = niveau(); const anciensJeux = JSON.stringify((S.config && S.config.jeux) || []);
    S.etat = r.etat; S.config = r.config;
    // Le parent a changé le niveau ou les jeux : on redessine (bouton de fermeture, tuile Internet, Mes jeux).
    if (S.ecran === 'bureau' && !S.voile && (niveau() !== ancien || JSON.stringify(S.config.jeux || []) !== anciensJeux)) render();
    if (S.ecran === 'bureau') {
      const reste = resteMinutes();
      if (reste !== null && reste <= (niveau() >= 3 ? 5 : 2) && reste > 0 && !S.averti2) { S.averti2 = true; toast('Plus que ' + reste + ' minute' + (reste > 1 ? 's' : '') + ' : pense à enregistrer ton travail.', 9000); }
      if (reste === 0 && !(S.seance && S.seance.aDeux && !S.etat)) { allerFin(true); return; }
      if (S.etat && S.etat.dernierMessage && S.seance && S.etat.dernierMessage.session === S.seance.id && S.etat.dernierMessage.code === 'pin-refuse' && !S.seance.pinSignale) { S.seance.pinSignale = true; toast('Le code n’a pas été accepté : ta séance compte sur tes jetons.', 7000); }
      majPied();
    }
  } catch (e) { /* rien */ }
}

function toast(texte, duree) {
  S.toast = texte; dessinerToast();
  clearTimeout(toast.t); toast.t = setTimeout(() => { S.toast = null; dessinerToast(); }, duree || 4000);
}
function dessinerToast() { $('#toast').innerHTML = S.toast ? `<div class="toast verre" role="status">${esc(S.toast)}</div>` : ''; }

// ======================================================================
// RENDU
// ======================================================================
function render() {
  const r = $('#racine');
  if (S.ecran === 'atelier') r.innerHTML = vueAtelier();
  else if (S.ecran === 'accueil') r.innerHTML = vueAccueil();
  else if (S.ecran === 'bureau') r.innerHTML = vueBureau();
  else if (S.ecran === 'fin') r.innerHTML = vueFin();
  else r.innerHTML = '';
  $('#voile').innerHTML = S.voile ? vueVoile() : vueOuverture();
  $('#mascotte').innerHTML = vueMascotte();
  apresRendu();
}

// ---------- ATELIER (première connexion) ----------
function vueAtelier() {
  const nom = ETAPES_ATELIER[S.etape];
  const barre = `<div class="etapes">${ETAPES_ATELIER.map((_, i) => `<span class="${i <= S.etape ? 'on' : ''}"></span>`).join('')}</div>`;
  const nav = (suivantOk, texte) => `<div class="rang entre">${S.etape > 0 ? '<button class="btn doux" data-a="atelierPrec">Retour</button>' : '<span></span>'}<button class="btn grand" data-a="atelierSuiv" ${suivantOk ? '' : 'disabled'}>${texte || 'Suivant'}</button></div>`;
  const p = S.profil;
  let corps = '';
  if (nom === 'bienvenue') {
    corps = `<div class="bulle-intro"><div class="compagnon"><img src="${imgCompa('salut')}" alt=""></div><div class="section"><h1>Bonjour !</h1><p>Moi, c’est ${esc(nomCompa())}. Cet ordinateur est presque prêt : il ne manque plus que toi. On le termine ensemble ? Ça prend une dizaine de minutes, et tout ce que tu choisis pourra être changé plus tard.</p></div></div>${nav(true, 'On y va')}`;
  } else if (nom === 'prenom') {
    corps = `<h1>Comment tu t’appelles ?</h1><p class="chapo">C’est comme ça que ton ordinateur te dira bonjour.</p><input class="champ" id="in-prenom" data-in="prenom" maxlength="24" value="${esc(p.prenom)}" placeholder="Ton prénom" autofocus>${nav(!!p.prenom.trim())}`;
  } else if (nom === 'compagnon') {
    const carte = (c) => `<button class="choix compa ${p.compagnon.id === c.id ? 'on' : ''}" data-a="choisirCompa" data-id="${esc(c.id)}"><img src="${imgCompa('portrait', c.id, 'salut')}" alt=""><span class="nom">${esc(nomEspece(c.id))}</span></button>`;
    const ordre = Object.keys(COMPAGNONS); const rang = (c) => { const i = ordre.indexOf(c.id); return i < 0 ? 99 : i; };
    const fam = (f) => D.compagnons.slice().sort((x, y) => rang(x) - rang(y)).filter((c) => ((COMPAGNONS[c.id] || {}).famille || 'doux') === f).map(carte).join('');
    const dispo = `<h3>Tout doux</h3><div class="grille" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr))">${fam('doux')}</div><h3>Les aventuriers</h3><div class="grille" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr))">${fam('grands')}</div>`;
    corps = `<h1>Choisis ton compagnon</h1><p class="chapo">Il t’aide quand tu te perds, et il sait se taire quand tu veux être tranquille.</p>${dispo}<label class="section"><span>Comment s’appelle-t-il ?</span><input class="champ" data-in="nomCompa" maxlength="20" value="${esc(p.compagnon.nom)}"></label>${nav(!!p.compagnon.nom.trim())}`;
  } else if (nom === 'monde') {
    corps = `<h1>Choisis ton monde</h1><p class="chapo">Regarde derrière : ton fond d’écran change tout de suite. « Au fil des saisons » change tout seul avec la saison.</p>${grilleThemes()}<div class="rang"><button class="btn doux" data-a="photoFond">Mettre une de mes photos</button>${p.photoFond ? '<button class="btn doux" data-a="sansPhoto">Enlever ma photo</button>' : ''}</div>${nav(true)}`;
  } else if (nom === 'portrait') {
    corps = `<h1>Dessine ton portrait</h1><p class="chapo">Il apparaîtra quand tu allumes l’ordinateur. Tu peux aussi passer : ${esc(nomCompa())} prendra ta place.</p><div class="rang" style="align-items:flex-start;gap:20px"><canvas class="toile" id="toile-avatar" width="320" height="320"></canvas><div class="section">${paletteHtml()}<button class="btn doux petit" data-a="effacerToile" data-id="toile-avatar">Tout effacer</button></div></div>${nav(true, p.avatar ? 'Suivant' : 'Suivant')}`;
  } else if (nom === 'envies') {
    const ordre = ordreRubriques().map((r) => r.nom).slice(0, 4).join(', ');
    corps = `<h1>Qu’est-ce qui te donne le plus envie ?</h1><p class="chapo">Choisis autant que tu veux. Ton ordinateur rangera ces choses en premier.</p><div class="rang">${ENVIES.map((e) => `<button class="puce ${p.envies.includes(e.id) ? 'on' : ''}" data-a="basculerEnvie" data-id="${e.id}">${esc(e.texte)}</button>`).join('')}</div><div class="astuce"><b>Ton ordinateur commencera par</b><span>${esc(ordre)}</span></div>${nav(true)}`;
  } else if (nom === 'pacte') {
    const c = S.config; const pa = S.pacte || (S.pacte = { coches: [false, false, false] });
    const eng = ['Je dis « J’ai fini » quand j’ai fini, même s’il me reste des jetons.', 'Si quelque chose me met mal à l’aise, je viens en parler.', 'Mes jetons ne se gagnent pas et ne se perdent pas : c’est mon temps à moi, je le gère.'];
    const tout = pa.coches.every(Boolean);
    corps = `<h1>Le pacte, avec un adulte</h1><p class="chapo">Cette dernière étape se fait à deux. Lisez-la ensemble.</p>
      <div class="panneau"><div class="rang">${Array.from({ length: Math.min(c.jetonsSemaine, 16) }, () => '<span class="jeton">15</span>').join('')}</div>
      <ul class="pacte" style="margin:0;padding-left:20px"><li>Chaque semaine, ta tirelire reçoit <b>${c.jetonsSemaine} jetons</b>. Un jeton, c’est un quart d’heure.</li><li>Tu peux en prendre <b>${c.maxParSeance} au maximum</b> par séance. Ceux que tu ne prends pas restent dans la tirelire jusqu’à dimanche soir.</li><li>Si tu finis plus tôt, les jetons que tu n’as pas commencés reviennent dans la tirelire.</li><li>Le temps passé <b>à deux avec un adulte</b> ne coûte rien.</li></ul></div>
      <div class="section">${eng.map((t, i) => `<button class="coche ${pa.coches[i] ? 'on' : ''}" data-a="cocher" data-i="${i}"><span class="case">${pa.coches[i] ? '✓' : ''}</span>${esc(t)}</button>`).join('')}</div>
      <div class="rang" style="gap:20px"><div class="section"><span>Moi, ${esc(prenom())}</span><canvas class="toile" id="toile-sig1" width="300" height="120"></canvas></div><div class="section"><span>L’adulte</span><canvas class="toile" id="toile-sig2" width="300" height="120"></canvas></div></div>
      <div class="rang entre"><button class="btn doux" data-a="atelierPrec">Retour</button><button class="btn grand" data-a="signerPacte" ${tout ? '' : 'disabled'}>Signer et commencer</button></div>`;
  }
  return `<div class="plein"><div class="carte verre">${barre}${corps}</div></div>`;
}

function grilleThemes() {
  return `<div class="grille" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">${FONDS.THEMES.map((t) => `<button class="choix ${S.profil.theme === t.id && !S.profil.photoFond ? 'on' : ''}" data-a="choisirTheme" data-id="${t.id}"><span class="apercu" style="background:${FONDS.apercu(t)}"></span><span class="nom">${esc(t.nom)}</span></button>`).join('')}</div>`;
}

const COULEURS = ['#1E2A4A', '#E0457B', '#FF7A45', '#F2B33D', '#2FA36B', '#13A39F', '#2B7BD6', '#7C5CFA', '#8B5A2B', '#F3C6A5', '#FFFFFF'];
function paletteHtml() {
  S.crayon = S.crayon || { couleur: '#1E2A4A', taille: 8 };
  return `<div class="couleurs" style="flex-wrap:wrap;max-width:240px">${COULEURS.map((c) => `<button style="background:${c}" class="${S.crayon.couleur === c ? 'on' : ''}" data-a="couleur" data-c="${c}" aria-label="couleur"></button>`).join('')}</div><div class="rang">${[4, 8, 16].map((t) => `<button class="puce ${S.crayon.taille === t ? 'on' : ''}" data-a="taille" data-t="${t}">${t === 4 ? 'Fin' : t === 8 ? 'Moyen' : 'Gros'}</button>`).join('')}</div>`;
}

function ordreRubriques() {
  const envies = (S.profil && S.profil.envies) || [];
  const prio = [];
  envies.forEach((e) => { const r = (ENVIES.find((x) => x.id === e) || {}).rub; if (r && !prio.includes(r)) prio.push(r); });
  const rubs = D.catalogue.RUBRIQUES.filter((r) => r.id !== 'style');
  const tri = prio.map((id) => rubs.find((r) => r.id === id)).filter(Boolean).concat(rubs.filter((r) => !prio.includes(r.id)));
  return tri.concat(D.catalogue.RUBRIQUES.filter((r) => r.id === 'style'));
}

// ---------- ACCUEIL (chaque séance) ----------
const HUMEURS = ['En forme', 'Tranquille', 'Envie de dormir', 'Pas de bonne humeur'];
function rappelsAccueil() {
  const out = []; const auj = new Date();
  const plan = S.profil.plan;
  if (plan && plan.semaine === idSemaine(auj) && plan.jours) out.push('Ce que tu avais prévu aujourd’hui : <b>' + plan.jours[jourIdx(auj)] + ' jeton' + (plan.jours[jourIdx(auj)] > 1 ? 's' : '') + '</b>.');
  if (auj.getDay() === 0) out.push('C’est dimanche : pense à faire le bilan de ta semaine avec un adulte (Mes outils, « Ma semaine »).');
  const ev = ((S.docs.agenda && S.docs.agenda.evenements) || []).filter((e) => { const d = new Date(e.date + 'T12:00'); const diff = (d - new Date(isoJour(auj) + 'T12:00')) / 86400000; return diff >= 0 && diff <= 7; }).sort((x, y) => x.date.localeCompare(y.date)).slice(0, 2);
  ev.forEach((e) => out.push('Bientôt : <b>' + esc(e.titre) + '</b>, ' + esc(new Date(e.date + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })) + '.'));
  return out.length ? `<div class="astuce" style="flex-direction:column;gap:4px">${out.map((t) => `<span>${t}</span>`).join('')}</div>` : '';
}

function vueAccueil() {
  const a = S.accueil; const restants = jetonsRestants(); const max = Math.max(0, Math.min(S.config.maxParSeance, restants));
  const portrait = S.profil.avatar ? `<img src="${S.profil.avatar}" alt="">` : `<img src="${imgCompa(restants === 0 ? 'attend' : 'portrait', null, 'salut')}" alt="">`;
  const h = new Date(); const heure = String(h.getHours()).padStart(2, '0') + ':' + String(h.getMinutes()).padStart(2, '0');
  let corps;
  const rappels = rappelsAccueil();
  if (a.etape === 'tirelire') {
    if (a.jetons > max) a.jetons = max;
    if (a.jetons < 1 && max >= 1) a.jetons = 1;
    const pieces = Array.from({ length: restants }, (_, i) => `<span class="jeton ${i < a.jetons && !a.aDeuxPin ? 'pris' : ''}">15</span>`).join('');
    const vide = restants === 0;
    corps = `<h1>Bonjour ${esc(prenom())} !</h1>
      <p class="chapo">Il reste <b>${restants} jeton${restants > 1 ? 's' : ''}</b> dans ta tirelire cette semaine.</p>
      <div class="rang">${pieces || '<span class="muet">Ta tirelire est vide jusqu’à lundi.</span>'}</div>
      ${rappels}
      ${vide ? '' : `<div class="rang entre"><div class="compteur"><button class="rond" data-a="jetonsMoins" aria-label="un de moins">−</button><span class="val">${a.jetons}</span><button class="rond" data-a="jetonsPlus" aria-label="un de plus">+</button></div><span class="titre" style="font-size:22px">${a.jetons * 15} minutes</span></div><p class="muet" style="margin:0">Au maximum ${S.config.maxParSeance} jetons par séance. Ceux que tu ne commences pas reviennent dans ta tirelire.</p>`}
      <div class="rang entre"><button class="btn doux" data-a="aDeux">À deux avec un adulte (gratuit)</button>${vide ? '<button class="btn" data-a="eteindre">Éteindre</button>' : '<button class="btn grand" data-a="versIntention">Suivant</button>'}</div>`;
  } else {
    corps = `<h1>Aujourd’hui, je viens pour…</h1><p class="chapo">${a.aDeuxPin ? 'Séance à deux : profitez-en !' : a.jetons * 15 + ' minutes à toi.'} Choisis ce que tu veux faire, ça t’aidera à ne pas te perdre.</p>
      <div class="rang">${D.catalogue.INTENTIONS.map((x) => `<button class="puce ${a.intention === x.id ? 'on' : ''}" data-a="intention" data-id="${x.id}">${esc(x.texte)}</button>`).join('')}</div>
      <input class="champ" data-in="libre" maxlength="80" value="${esc(a.libre)}" placeholder="Ou écris-le avec tes mots">
      <div class="rang"><span class="muet">Et comment tu te sens ? (si tu veux)</span>${HUMEURS.map((h) => `<button class="puce ${a.humeur === h ? 'on' : ''}" data-a="humeur" data-h="${h}">${h}</button>`).join('')}</div>
      <div class="rang entre"><button class="btn doux" data-a="versTirelire">Retour</button><button class="btn grand" data-a="commencer" ${a.intention || a.libre.trim() ? '' : 'disabled'}>C’est parti</button></div>`;
  }
  return `<div class="plein"><div class="rang" style="gap:48px;align-items:center;flex-wrap:nowrap"><div class="section" style="align-items:center"><span class="heure">${heure}</span><div class="compagnon" style="width:200px;height:200px">${portrait}</div></div><div class="carte verre" style="width:min(640px,60vw)">${corps}</div></div></div>`;
}

// ---------- BUREAU ----------
function vueBureau() {
  const rubs = ordreRubriques();
  if (!S.rubrique) S.rubrique = rubs[0].id;
  return `<div class="fenetre">
    <div class="barre-titre"><span style="flex:1">${esc(nomCompa())} · l’ordinateur de ${esc(prenom())}</span><button class="reduire" data-a="reduire" aria-label="Réduire">—</button>${niveau() >= 4 ? '<button class="reduire" data-a="fermerFlocon" aria-label="Fermer Flocon">×</button>' : ''}</div>
    <div class="corps verre">
      <div class="onglets" role="tablist">${rubs.map((r) => `<button role="tab" class="${S.rubrique === r.id && !S.vue ? 'on' : ''}" data-a="rubrique" data-id="${r.id}">${esc(r.nom)}</button>`).join('')}</div>
      <div class="contenu">${S.vue ? vueInterne() : vueRubrique(rubs.find((r) => r.id === S.rubrique) || rubs[0])}</div>
    </div>
    <div class="pied verre" id="pied">${piedHtml()}</div>
  </div>`;
}

function piedHtml() {
  const reste = resteMinutes(); const total = S.seance ? S.seance.prevu : 1;
  const pc = reste === null ? 100 : Math.max(0, Math.min(100, Math.round(reste / total * 100)));
  const texte = S.seance && S.seance.aDeux ? 'Séance à deux' : reste === null ? '' : 'Il te reste ' + reste + ' min';
  return `<div class="temps">${ic('M12 8v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', '#1E2A4A', 22)}<span>${texte}</span><div class="jauge ${reste !== null && reste <= 5 ? 'bas' : ''}"><i style="width:${pc}%"></i></div><span class="muet">${jetonsRestants()} jeton${jetonsRestants() > 1 ? 's' : ''} dans la tirelire</span></div>
    <button class="btn doux petit" data-a="basculerFlocon">${S.profil.floconVisible ? 'Cacher ' : 'Appeler '}${esc(nomCompa())}</button>
    <button class="btn petit btn-fini" data-a="jaiFini">J’ai fini</button>`;
}
function majPied() { const p = $('#pied'); if (p) p.innerHTML = piedHtml(); }

function tuileHtml(t, i) {
  return `<button class="tuile" data-a="tuile" data-i="${i}"><span class="ic" style="background:${t.couleur}">${ic(t.icone)}</span><span><span class="n">${esc(t.nom)}</span><br><span class="s">${esc(t.sous || '')}</span></span></button>`;
}

function tuilesRubrique(r) {
  if (r.id === 'jeux') {
    const jeux = (S.config.jeux || []).map((j) => ({ type: 'jeu', ref: j.id, nom: j.nom, sous: 'Choisi avec un adulte', icone: D.catalogue.ICONES.manette, couleur: '#5B3FD6' }));
    return [{ type: 'logiciel', ref: 'minecraft', nom: 'Minecraft', sous: 'Édition Java, en solo', icone: D.catalogue.ICONES.cube, couleur: '#2FA36B' }].concat(jeux);
  }
  return r.tuiles.filter((t) => !t.niveau || t.niveau <= niveau());
}

function vueRubrique(r) {
  if (r.id === 'style') return vueStyle();
  const t = tuilesRubrique(r);
  S.tuilesAffichees = t;
  const note = r.id === 'jeux' && !(S.config.jeux || []).length ? '<p class="muet">Tes autres jeux seront choisis avec un adulte, dans l’espace parent.</p>' : '';
  return `<div class="section">${note}<div class="tuiles">${t.map(tuileHtml).join('')}</div></div>`;
}

function vueStyle() {
  const p = S.profil;
  return `<div class="section">
    <div class="panneau"><h3>Mon monde</h3>${grilleThemes()}<div class="rang"><button class="btn doux petit" data-a="photoFond">Mettre une de mes photos</button>${p.photoFond ? '<button class="btn doux petit" data-a="sansPhoto">Enlever ma photo</button>' : ''}</div></div>
    <div class="panneau"><h3>Mon compagnon</h3><div class="rang"><div class="compagnon" style="width:84px;height:84px"><img src="${imgCompa('portrait', null, 'salut')}" alt=""></div><input class="champ" style="max-width:260px" data-in="nomCompaStyle" maxlength="20" value="${esc(p.compagnon.nom)}"><button class="btn doux petit" data-a="basculerFlocon">${p.floconVisible ? 'Le cacher' : 'Le montrer'}</button></div></div>
    <div class="panneau"><h3>Mon portrait</h3><div class="rang" style="align-items:flex-start"><canvas class="toile" id="toile-avatar" width="220" height="220"></canvas><div class="section">${paletteHtml()}<div class="rang"><button class="btn doux petit" data-a="effacerToile" data-id="toile-avatar">Tout effacer</button><button class="btn petit" data-a="garderPortrait">Garder ce portrait</button></div></div></div></div>
    <div class="panneau"><h3>Mes envies</h3><div class="rang">${ENVIES.map((e) => `<button class="puce ${p.envies.includes(e.id) ? 'on' : ''}" data-a="basculerEnvie" data-id="${e.id}">${esc(e.texte)}</button>`).join('')}</div></div>
    <div class="rang fin"><button class="btn doux petit" data-a="espaceParent">Espace parent</button></div>
  </div>`;
}

// ---------- vues internes ----------
function entete(titre, extra) { return `<div class="entete"><button class="retour" data-a="fermerVue" aria-label="Retour">‹</button><h2>${esc(titre)}</h2>${extra || ''}</div>`; }

function vueInterne() {
  const v = S.vue;
  const fn = { permis: vuePermis, semaine: vueSemaine, agenda: vueAgenda, idee: vueIdee, galerie: vueGalerie, projet: vueProjet, exposes: vueExposes, pourquoi: vuePourquoi, carnetLecture: vueLectures, journal: vueJournal, photos: vuePhotos, musique: () => vueMusique('Ma musique', 'musique', 'Pas encore de musique. Un adulte peut en ajouter dans le dossier Musique.'), livresAudio: () => vueMusique('Mes livres audio', 'livresAudio', 'Pas encore de livre audio. Un adulte peut en déposer dans Musique, « Mes livres audio ».'), films: vueFilms, minuteur: vueMinuteur, dossiers: vueDossiers }[v.ref];
  return fn ? fn() : entete('Bientôt');
}

function vueExposes() {
  const v = S.vue; const liste = S.docs.exposes || [];
  if (v.fichier) {
    const x = liste.find((e) => e.fichier === v.fichier); if (!x) return entete('Exposé');
    const i = v.etape || 0; const et = D.catalogue.EXPOSE_ETAPES[i]; x.etapes = x.etapes || []; const st = x.etapes[i] || {};
    const outils = et.outils.map(([type, ref]) => { const nom = type === 'site' ? D.catalogue.SITES[ref].nom : type === 'interne' ? 'Minuteur' : ({ impress: 'Diaporama', mypaint: 'Dessin', krita: 'Peinture', writer: 'Affiche ou texte', audacity: 'M’enregistrer' })[ref] || ref; return `<button class="btn petit" data-a="outilExpose" data-type="${type}" data-ref="${ref}">${esc(nom)}</button>`; }).join('');
    const fait = x.etapes.filter((e) => e && e.fait).length;
    return `<div class="section">${entete('Mon exposé : ' + x.sujet, `<span class="etiquette">${fait} étape${fait > 1 ? 's' : ''} sur 6</span>`)}
      <p class="muet" style="margin:0">${x.pourQuand ? 'Pour le ' + esc(x.pourQuand) : ''}</p>
      <div class="etapes-expose">${D.catalogue.EXPOSE_ETAPES.map((e, k) => `<button class="${k === i ? 'on' : (x.etapes[k] && x.etapes[k].fait ? 'fait' : '')}" data-a="etapeExpose" data-i="${k}">${x.etapes[k] && x.etapes[k].fait ? '✓ ' : ''}${k + 1}<b>${esc(e.nom)}</b></button>`).join('')}</div>
      <div class="panneau"><h3>${esc(et.titre)}</h3><p style="margin:0;line-height:1.5">${esc(et.consigne)}</p><div class="astuce"><b>Astuce</b><span>${esc(et.astuce)}</span></div>
      <textarea class="champ" data-in="noteExpose" rows="7" placeholder="Écris ici…">${esc(st.notes || '')}</textarea>
      <div class="rang">${outils}<button class="btn petit" style="background:#1F5FA8" data-a="documentWord">Mon document Word</button><button class="btn doux petit" data-a="dossierExposes">Mon dossier d’exposés</button><span style="flex:1"></span><button class="btn petit" style="background:${st.fait ? '#2FA36B' : '#1E2A4A'}" data-a="etapeFaite">${st.fait ? '✓ Étape faite' : 'J’ai fini cette étape'}</button></div></div></div>`;
  }
  return `<div class="section">${entete('Mes exposés')}
    <div class="panneau"><h3>Un nouvel exposé</h3><div class="rang"><input class="champ" style="flex:2" data-in="nouveauSujet" placeholder="Le sujet, par exemple : les loups" value="${esc(v.sujet || '')}"><input class="champ" style="flex:1" data-in="nouveauQuand" placeholder="Pour quand ?" value="${esc(v.quand || '')}"><button class="btn" data-a="creerExpose">Commencer</button></div></div>
    <div class="liste">${liste.length ? liste.map((e) => `<button class="ligne" data-a="ouvrirExpose" data-f="${esc(e.fichier)}">${ic(D.catalogue.ICONES.diapo, '#1F5FA8', 22)}<span class="grow"><b>${esc(e.sujet)}</b> <span class="muet">${e.pourQuand ? '· pour le ' + esc(e.pourQuand) : ''}</span></span><span class="etiquette">${(e.etapes || []).filter((z) => z && z.fait).length} / 6</span></button>`).join('') : '<p class="muet">Pas encore d’exposé. Le premier commence ici !</p>'}</div></div>`;
}

function vuePermis() {
  const n = niveau(); const P = D.catalogue.PERMIS; const suivant = P.find((x) => x.n === n + 1);
  const m = S.profil.missions || {};
  const niveaux = P.map((x) => `<div class="ligne" style="${x.n === n ? 'box-shadow:0 0 0 3px #1F5FA8' : ''}${x.n > n ? ';opacity:.6' : ''}"><span class="etiquette" style="${x.n <= n ? 'background:#1F5FA8;color:#fff' : ''}">Niveau ${x.n}</span><span class="grow"><b>${esc(x.nom)}</b><br><span class="muet">${esc(x.ouvre)}</span></span>${x.n < n ? '<b style="color:#2FA36B">✓</b>' : x.n === n ? '<b style="color:#1F5FA8">Tu es ici</b>' : ''}</div>`).join('');
  let missions = '';
  if (suivant) {
    const faites = suivant.missions.filter((_, i) => m[suivant.n + '-' + i]).length;
    missions = `<div class="panneau"><h3>Pour passer au niveau ${suivant.n} : ${esc(suivant.nom)}</h3><p class="muet" style="margin:0">Coche ce que tu sais faire, puis montre-le à un adulte. C’est lui qui valide le passage avec son code.</p>
      <div class="section" style="gap:8px">${suivant.missions.map((t, i) => { const k = suivant.n + '-' + i; return `<button class="coche ${m[k] ? 'on' : ''}" data-a="mission" data-k="${k}"><span class="case">${m[k] ? '✓' : ''}</span>${esc(t)}</button>`; }).join('')}</div>
      <div class="rang entre"><span class="etiquette">${faites} sur ${suivant.missions.length}</span><button class="btn" data-a="passerNiveau" ${faites === suivant.missions.length ? '' : 'disabled'}>Je le montre à un adulte</button></div></div>`;
  } else missions = '<div class="panneau"><b>Tu as ton permis complet.</b><span class="muet">Bravo : tu sais te servir d’un ordinateur, et t’arrêter quand tu as fini.</span></div>';
  return `<div class="section">${entete('Mon permis')}<div class="liste">${niveaux}</div>${missions}</div>`;
}

function seancesDeLaSemaine(sem) {
  const j = ((S.etat && S.etat.journal) || []).filter((x) => x.debut && idSemaine(new Date(x.debut)) === sem);
  const f = ((S.docs.seances && S.docs.seances.seances) || []).filter((x) => x.date && idSemaine(new Date(x.date)) === sem);
  return { j, f };
}

function vueSemaine() {
  const auj = new Date(); const sem = S.vue.semaine || idSemaine(auj);
  const { j, f } = seancesDeLaSemaine(sem);
  const parJour = [0, 0, 0, 0, 0, 0, 0]; j.forEach((x) => { parJour[jourIdx(new Date(x.debut))] += x.minutes || 0; });
  const total = parJour.reduce((a, b) => a + b, 0); const maxJ = Math.max(30, ...parJour);
  const jetons = j.filter((x) => !x.aDeux).reduce((a, x) => a + (x.pris || 0) - (x.rendus || 0), 0);
  const fini = j.filter((x) => x.raison === 'fini').length;
  const fiertes = ['J’ai créé quelque chose', 'J’ai appris un truc', 'J’ai avancé mon exposé', 'J’ai joué', 'J’ai lu'];
  const barres = parJour.map((mn, i) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"><div style="height:110px;width:100%;display:flex;align-items:flex-end;justify-content:center"><div style="width:60%;height:${Math.round(mn / maxJ * 100)}%;min-height:${mn ? 4 : 0}px;background:#2FA36B;border-radius:8px 8px 4px 4px"></div></div><span class="muet" style="font-size:12px">${JOURS[i].slice(0, 3)}</span><b style="font-size:12px">${mn ? mn + ' min' : ''}</b></div>`).join('');
  const sv = idSemaine(new Date(lundiDe(auj).getTime() + 7 * 86400000));
  const plan = S.vue.plan || ((S.profil.plan && S.profil.plan.semaine === sv) ? S.profil.plan.jours.slice() : [1, 1, 1, 1, 1, 2, 1]);
  S.vue.plan = plan; const somme = plan.reduce((a, b) => a + b, 0); const dispo = S.config.jetonsSemaine;
  return `<div class="section">${entete('Ma semaine', '<span class="etiquette">à faire avec un adulte</span>')}
    <div class="rang" style="gap:12px">${[['Temps d’écran', total + ' min'], ['Jetons dépensés', jetons + ' sur ' + S.config.jetonsSemaine], ['Séances', j.length], ['« J’ai fini » avant la fin', fini + ' sur ' + j.length]].map(([t, v]) => `<div class="panneau" style="flex:1;min-width:150px;gap:2px"><span class="muet" style="font-size:13px">${t}</span><b class="titre" style="font-size:24px">${v}</b></div>`).join('')}</div>
    <div class="panneau"><h3>Jour par jour</h3><div style="display:flex;gap:6px">${barres}</div></div>
    <div class="panneau"><h3>Ce dont j’ai été fière ou fier</h3>${f.length ? f.map((x) => `<div class="ligne"><span class="muet" style="width:90px">${esc(new Date(x.date).toLocaleDateString('fr-FR', { weekday: 'long' }))}</span><span class="grow">${(x.fierte || []).map((k) => esc(fiertes[k])).join(', ')}${x.texte ? ' : « ' + esc(x.texte) + ' »' : ''}${x.humeur ? ' <span class="etiquette">' + esc(x.humeur) + '</span>' : ''}</span></div>`).join('') : '<span class="muet">Rien de noté cette semaine.</span>'}</div>
    <div class="astuce"><b>À se demander ensemble</b><span>Qu’est-ce que tu as préféré ? Est-ce que le temps t’a semblé long ou court ? Qu’est-ce que tu aurais fait sans écran ?</span></div>
    <div class="panneau"><h3>Ma semaine prochaine</h3><p class="muet" style="margin:0">Répartis tes ${dispo} jetons. C’est un plan, pas une obligation : on le regardera dimanche prochain.</p>
      <div style="display:flex;gap:6px">${plan.map((v, i) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px"><span class="muet" style="font-size:12px">${JOURS[i].slice(0, 3)}</span><button class="rond" style="width:36px;height:36px;font-size:18px" data-a="planPlus" data-i="${i}">+</button><b class="titre" style="font-size:22px">${v}</b><button class="rond" style="width:36px;height:36px;font-size:18px" data-a="planMoins" data-i="${i}">−</button></div>`).join('')}</div>
      <div class="rang entre"><span class="etiquette" style="${somme > dispo ? 'background:#FDE2E1;color:#B42318' : ''}">${somme} jeton${somme > 1 ? 's' : ''} sur ${dispo}</span><button class="btn" data-a="garderPlan" ${somme > dispo ? 'disabled' : ''}>Garder mon plan</button></div></div></div>`;
}

const TYPES_EV = { École: '#1F5FA8', Anniversaire: '#E0457B', Sport: '#2FA36B', Sortie: '#E8892A', Autre: '#7C5CFA' };
function vueAgenda() {
  const ag = S.docs.agenda || { evenements: [] }; const v = S.vue;
  const mois = v.mois ? new Date(v.mois + '-01T12:00') : new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12);
  const debut = lundiDe(new Date(mois.getFullYear(), mois.getMonth(), 1));
  const auj = isoJour(new Date());
  const cases = Array.from({ length: 42 }, (_, i) => { const d = new Date(debut.getTime() + i * 86400000); const iso = isoJour(d); const evs = ag.evenements.filter((e) => e.date === iso);
    return `<button data-a="choisirJour" data-d="${iso}" style="min-height:62px;border-radius:10px;padding:4px;text-align:left;background:${iso === v.date ? '#E6EEFF' : '#fff'};box-shadow:${iso === auj ? 'inset 0 0 0 2px #1F5FA8' : 'inset 0 0 0 1px rgba(20,24,60,.08)'};opacity:${d.getMonth() === mois.getMonth() ? 1 : .4};display:flex;flex-direction:column;gap:2px"><b style="font-size:12px">${d.getDate()}</b>${evs.slice(0, 2).map((e) => `<span style="font-size:10px;font-weight:800;color:#fff;background:${TYPES_EV[e.type] || '#7C5CFA'};border-radius:5px;padding:1px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(e.titre)}</span>`).join('')}</button>`; }).join('');
  const avenir = ag.evenements.filter((e) => e.date >= auj).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);
  const titreMois = mois.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return `<div class="section">${entete('Mon agenda')}
    <div class="rang" style="align-items:flex-start;gap:16px;flex-wrap:nowrap">
      <div class="panneau" style="flex:3"><div class="rang entre"><button class="btn doux petit" data-a="moisPrec">‹</button><h3 style="text-transform:capitalize">${esc(titreMois)}</h3><button class="btn doux petit" data-a="moisSuiv">›</button></div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">${JOURS.map((j) => `<span class="muet" style="font-size:11px;text-align:center">${j.slice(0, 3)}</span>`).join('')}${cases}</div></div>
      <div class="section" style="flex:2">
        <div class="panneau"><h3>Ajouter</h3><input class="champ" type="date" data-in="evDate" value="${esc(v.date || auj)}"><input class="champ" data-in="evTitre" maxlength="60" placeholder="Quoi ?" value="${esc(v.titre || '')}">
          <div class="rang">${Object.keys(TYPES_EV).map((t) => `<button class="puce ${v.type === t ? 'on' : ''}" data-a="evType" data-t="${t}">${t}</button>`).join('')}</div><button class="btn" data-a="ajouterEv">Noter</button></div>
        <div class="panneau"><h3>À venir</h3>${avenir.length ? avenir.map((e) => `<div class="ligne"><span style="width:10px;height:10px;border-radius:50%;background:${TYPES_EV[e.type] || '#7C5CFA'}"></span><span class="grow"><b>${esc(e.titre)}</b><br><span class="muet">${esc(new Date(e.date + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))}</span></span><button class="btn doux petit" data-a="supprimerEv" data-id="${esc(e.id)}">Effacer</button></div>`).join('') : '<span class="muet">Rien pour l’instant.</span>'}</div>
      </div></div></div>`;
}

function vueIdee() {
  const reste = 3 - ((S.seance && S.seance.tirages) || 0);
  return `<div class="section">${entete('Une idée ?')}
    <div class="idee">${esc(S.idee || '')}</div>
    <div class="rang" style="justify-content:center">
      <button class="btn" data-a="prendreIdee">Je prends celle-ci</button>
      ${reste > 0 ? `<button class="btn doux" data-a="autreIdee">Une autre (encore ${reste})</button>` : '<span class="muet">C’était la dernière pour aujourd’hui : souvent, la bonne idée est déjà là.</span>'}
    </div>
    <p class="muet" style="text-align:center;margin:0">Tu peux aussi la transformer : une idée, c’est juste un point de départ.</p></div>`;
}

function vueGalerie() {
  const l = S.docs.creations || [];
  const carte = (o, i) => o.type === 'image' ? `<div class="oeuvre" style="position:relative"><img src="${esc(o.url)}" alt="${esc(o.nom)}" loading="lazy"><button class="btn doux petit" style="position:absolute;bottom:6px;right:6px;height:28px;font-size:12px" data-a="imprimerOeuvre" data-i="${i}">Imprimer</button></div>` : o.type === 'video' ? `<div class="oeuvre"><video src="${esc(o.url)}" muted preload="metadata"></video></div>` : `<div class="oeuvre">${ic(D.catalogue.ICONES.note, '#7C5CFA', 40)}<span>${esc(o.nom)}</span></div>`;
  return `<div class="section">${entete('Ma galerie', `<button class="btn petit" data-a="premiere" ${l.length ? '' : 'disabled'}>Première en famille</button><button class="btn doux petit" data-a="ouvrirDossier" data-d="creations">Ouvrir Mes créations</button>`)}
    <p class="muet" style="margin:0">Tout ce que tu enregistres dans Documents, « Mes créations », arrive ici : dessins, films, musiques, émissions.</p>
    ${l.length ? `<div class="galerie">${l.map(carte).join('')}</div>` : '<div class="panneau"><b>Ta galerie est encore vide.</b><span class="muet">Quand tu enregistres un dessin, un film ou un son, choisis le dossier Documents, puis « Mes créations ». C’est un geste à apprendre : il sert sur tous les ordinateurs.</span></div>'}</div>`;
}

function vueProjet() {
  const p = D.catalogue.PROJETS[S.vue.id];
  const outils = p.outils.map(([type, ref, nom]) => `<button class="btn petit" data-a="outilExpose" data-type="${type}" data-ref="${ref}" data-nom="${esc(nom)}">${esc(nom)}</button>`).join('');
  return `<div class="section">${entete(p.titre)}<p class="chapo" style="margin:0">${esc(p.chapo)}</p>
    <div class="panneau"><div class="etapes-projet">${p.etapes.map(([t, d]) => `<div><span><b>${esc(t)}</b><br><span class="muet">${esc(d)}</span></span></div>`).join('')}</div>
    <div class="rang">${outils}<button class="btn doux petit" data-a="ouvrirDossier" data-d="creations">Mes créations</button></div></div></div>`;
}

function vuePourquoi() {
  const d = S.docs.pourquoi || { questions: [] };
  return `<div class="section">${entete('Mon carnet du Grand Pourquoi')}
    <div class="panneau"><div class="rang"><input class="champ" style="flex:1" data-in="nouvelleQuestion" placeholder="Une question qui te trotte dans la tête…" value="${esc(S.vue.q || '')}"><button class="btn" data-a="ajouterQuestion">Noter</button></div></div>
    <div class="liste">${d.questions.map((q, i) => `<div class="panneau"><div class="rang entre"><b style="font-size:17px">${esc(q.q)}</b><button class="btn doux petit" data-a="chercherVikidia" data-i="${i}">Chercher dans Vikidia</button></div><textarea class="champ" style="min-height:70px" data-in="reponse" data-i="${i}" placeholder="Ce que j’ai trouvé…">${esc(q.r || '')}</textarea></div>`).join('') || '<p class="muet">Aucune question pour l’instant.</p>'}</div></div>`;
}

function vueLectures() {
  const d = S.docs.lectures || { livres: [] }; const n = S.vue.n || {};
  return `<div class="section">${entete('Mon carnet de lecture')}
    <div class="panneau"><h3>J’ai lu…</h3><div class="rang"><input class="champ" style="flex:2" data-in="livreTitre" placeholder="Le titre" value="${esc(n.titre || '')}"><input class="champ" style="flex:1" data-in="livreAuteur" placeholder="L’auteur ou l’autrice" value="${esc(n.auteur || '')}"></div>
    <textarea class="champ" style="min-height:70px" data-in="livreAvis" placeholder="Ce que j’en ai pensé, mon passage préféré…">${esc(n.avis || '')}</textarea>
    <div class="rang entre"><div class="rang">${[1, 2, 3, 4, 5].map((k) => `<button class="puce ${n.note >= k ? 'on' : ''}" data-a="noteLivre" data-k="${k}">${k}</button>`).join('')}</div><button class="btn" data-a="ajouterLivre">Ranger dans mon carnet</button></div></div>
    <div class="liste">${d.livres.slice().reverse().map((l) => `<div class="ligne">${ic(D.catalogue.ICONES.livre, '#B0471B', 22)}<span class="grow"><b>${esc(l.titre)}</b> <span class="muet">${esc(l.auteur || '')}</span><br><span class="muet">${esc(l.avis || '')}</span></span><span class="etiquette">${'★'.repeat(l.note || 0)}</span></div>`).join('')}</div>
    <p class="muet">${d.livres.length} livre${d.livres.length > 1 ? 's' : ''} dans ton carnet.</p></div>`;
}

function vueJournal() {
  const d = S.docs.journal || { pages: [] };
  return `<div class="section">${entete('Mon journal', '<span class="etiquette">rien que pour moi</span>')}
    <div class="panneau"><textarea class="champ" style="min-height:160px" data-in="pageJournal" placeholder="Aujourd’hui…">${esc(S.vue.texte || '')}</textarea><div class="rang fin"><button class="btn" data-a="ajouterPage">Ranger cette page</button></div></div>
    <div class="liste">${d.pages.slice().reverse().map((p) => `<div class="panneau"><span class="muet">${esc(new Date(p.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))}</span><span style="white-space:pre-wrap;line-height:1.5">${esc(p.texte)}</span></div>`).join('')}</div></div>`;
}

function vuePhotos() {
  const l = S.docs.photos || [];
  return `<div class="section">${entete('Mes photos', '<button class="btn petit" data-a="importerPhotos">Importer depuis mon appareil photo</button><button class="btn doux petit" data-a="ouvrirDossier" data-d="photos">Ouvrir le dossier</button>')}
    <p class="muet" style="margin:0">Branche ton appareil photo avec son câble, allume-le, puis clique sur « Importer ».</p>
    <div class="galerie">${l.map((p) => `<img src="${esc(p.url)}" alt="${esc(p.nom)}" loading="lazy">`).join('') || '<p class="muet">Pas encore de photo.</p>'}</div></div>`;
}

function vueMusique(titre, dossier, vide) {
  const l = S.docs.musique || []; const sel = S.vue.sel || {};
  return `<div class="section">${entete(titre, `<button class="btn petit" data-a="copierCasque" ${Object.values(sel).some(Boolean) ? '' : 'disabled'}>Copier sur mon casque</button><button class="btn doux petit" data-a="ouvrirDossier" data-d="${dossier}">Ouvrir le dossier</button>`)}
    <audio id="lecteur" controls ${S.vue.joue ? `src="${esc(S.vue.joue)}" autoplay` : ''}></audio>
    <div class="liste">${l.map((m, i) => `<div class="ligne"><button class="coche ${sel[i] ? 'on' : ''}" style="padding:0;background:none" data-a="choisirMorceau" data-i="${i}" aria-label="choisir"><span class="case">${sel[i] ? '✓' : ''}</span></button><button class="grow" style="text-align:left" data-a="jouer" data-i="${i}">${esc(m.nom)}</button></div>`).join('') || `<p class="muet">${esc(vide)}</p>`}</div></div>`;
}

function vueFilms() {
  const l = S.docs.films || [];
  return `<div class="section">${entete('Mes films')}
    ${S.vue.joue ? `<video controls autoplay src="${esc(S.vue.joue)}"></video><p class="muet" style="margin:0">Rien ne s’enchaîne après : quand c’est fini, c’est fini.</p>` : ''}
    <div class="liste">${l.map((m, i) => `<button class="ligne" data-a="jouerFilm" data-i="${i}">${ic(D.catalogue.ICONES.film, '#E0457B', 22)}<span class="grow">${esc(m.nom)}</span></button>`).join('') || '<p class="muet">Les films choisis avec un adulte apparaîtront ici (dossier Vidéos, « Mes films »).</p>'}</div></div>`;
}

function vueMinuteur() {
  const m = S.minuteur; const reste = m ? Math.max(0, Math.round((m.fin - Date.now()) / 1000)) : 0;
  const aff = m ? String(Math.floor(reste / 60)).padStart(2, '0') + ':' + String(reste % 60).padStart(2, '0') : '00:00';
  return `<div class="section">${entete('Minuteur')}<div class="panneau" style="align-items:center"><span class="titre" id="aff-minuteur" style="font-size:84px">${aff}</span>
    <div class="rang">${[1, 3, 5, 10, 15, 20].map((k) => `<button class="puce" data-a="minuteur" data-k="${k}">${k} min</button>`).join('')}<button class="btn doux petit" data-a="minuteurStop">Arrêter</button></div></div></div>`;
}

function vueDossiers() {
  const d = [['creations', 'Mes créations'], ['exposes', 'Mes exposés'], ['carnets', 'Mes carnets'], ['photos', 'Mes photos'], ['musique', 'Ma musique'], ['livresAudio', 'Mes livres audio'], ['films', 'Mes films']];
  return `<div class="section">${entete('Mes dossiers')}<p class="muet" style="margin:0">C’est le vrai explorateur de Windows : tu peux y ranger, renommer et créer des dossiers.</p><div class="tuiles">${d.map(([id, n]) => `<button class="tuile" data-a="ouvrirDossier" data-d="${id}"><span class="ic" style="background:#F2B33D">${ic(D.catalogue.ICONES.dossier)}</span><span class="n">${n}</span></button>`).join('')}</div></div>`;
}

// ---------- FIN ----------
function vueFin() {
  const f = S.fin || (S.fin = { choix: [], texte: '' });
  const ch = ['J’ai créé quelque chose', 'J’ai appris un truc', 'J’ai avancé mon exposé', 'J’ai joué', 'J’ai lu'];
  const temps = f.temps ? `<p class="chapo">Ton temps est terminé pour aujourd’hui.</p>` : `<p class="chapo">Les jetons que tu n’as pas commencés retournent dans ta tirelire.</p>`;
  return `<div class="plein"><div class="carte verre" style="width:min(640px,92vw)"><div class="bulle-intro"><div class="compagnon" style="width:120px;height:120px"><img src="${imgCompa('aurevoir', null, 'baille')}" alt=""></div><div class="section"><h1>À bientôt ${esc(prenom())} !</h1>${temps}</div></div>
    <h3>De quoi es-tu fière ou fier aujourd’hui ?</h3><div class="rang">${ch.map((c, i) => `<button class="puce ${f.choix.includes(i) ? 'on' : ''}" data-a="fierte" data-i="${i}">${esc(c)}</button>`).join('')}</div>
    <input class="champ" data-in="fierteTexte" maxlength="120" value="${esc(f.texte)}" placeholder="Avec tes mots, si tu veux">
    <div class="rang fin"><button class="btn grand" data-a="auRevoir">Au revoir</button></div></div></div>`;
}

// ---------- voile (code, parent) ----------
function vueVoile() {
  const v = S.voile;
  if (v.type === 'pin') {
    const cases = Array.from({ length: 4 }, (_, i) => `<span>${v.saisie[i] ? '•' : ''}</span>`).join('');
    return `<div class="voile"><div class="carte verre" style="width:380px;align-items:center"><h2 style="text-align:center">${esc(v.titre)}</h2><div class="code">${cases}</div>${v.erreur ? '<p style="color:#C0392B;margin:0">Ce n’est pas le bon code.</p>' : ''}<div class="pave">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => `<button data-a="pin" data-k="${k}">${k}</button>`).join('')}<button data-a="pinAnnuler" style="font-size:14px">Annuler</button><button data-a="pin" data-k="0">0</button><button data-a="pinEffacer">⌫</button></div></div></div>`;
  }
  if (v.type === 'premiersPas') {
    const pas = D.catalogue.PREMIERS_PAS[v.t.ref] || [];
    return `<div class="voile"><div class="carte verre" style="width:min(560px,92vw)"><div class="bulle-intro"><div class="compagnon" style="width:96px;height:96px"><img src="${imgCompa('montre')}" alt=""></div><h2>Premiers pas avec ${esc(v.t.nom)}</h2></div>
      <ul class="pas-liste">${pas.map((p, i) => `<li><b>${i + 1}</b><span>${esc(p)}</span></li>`).join('')}</ul>
      <p class="muet" style="margin:0">Pour le reste, essaie, cherche, trompe-toi : c’est comme ça qu’on apprend un logiciel. Et si tu bloques vraiment, demande.</p>
      <div class="rang entre"><button class="btn doux" data-a="pasDebrouille">Je me débrouille</button><button class="btn" data-a="pasOuvrir">Ouvrir ${esc(v.t.nom)}</button></div></div></div>`;
  }
  if (v.type === 'parent') {
    const c = S.config; const jeuxOn = new Set((v.jeux || []).map((j) => j.id));
    const steam = v.steam || [];
    const sites = v.sites;
    return `<div class="voile"><div class="carte verre" style="width:min(760px,94vw)"><div class="entete"><h2>Espace parent</h2><button class="btn doux petit" data-a="fermerVoile">Fermer</button></div>
      <div class="panneau"><h3>Tirelire</h3><div class="rang"><label>Jetons par semaine <input class="champ" style="width:90px" type="number" min="0" max="40" data-in="pJetons" value="${v.jetonsSemaine}"></label><label>Maximum par séance <input class="champ" style="width:90px" type="number" min="1" max="8" data-in="pMax" value="${v.maxParSeance}"></label><label>Ajouter tout de suite <input class="champ" style="width:90px" type="number" min="0" max="20" data-in="pAjout" value="${v.ajouter || 0}"></label></div><p class="muet" style="margin:0">Il reste ${jetonsRestants()} jetons cette semaine. Un jeton = 15 minutes.</p></div>
      <div class="panneau"><h3>Ses jeux</h3>${steam.length ? `<div class="rang">${steam.map((j) => `<button class="puce ${jeuxOn.has(j.id) ? 'on' : ''}" data-a="pJeu" data-id="${esc(j.id)}" data-nom="${esc(j.nom)}">${esc(j.nom)}</button>`).join('')}</div>` : '<p class="muet" style="margin:0">Aucun jeu Steam trouvé sur cet ordinateur. Installez-les depuis Steam (Steam Families), puis revenez ici.</p>'}</div>
      <div class="panneau"><h3>Sites autorisés</h3><p class="muet" style="margin:0">Un domaine par ligne. Rien d’autre ne s’ouvre, et les autres navigateurs sont bloqués sur sa session.</p><textarea class="champ" data-in="pSites" rows="7">${esc(sites)}</textarea></div>
      <div class="panneau"><h3>Permis</h3><div class="rang">${D.catalogue.PERMIS.map((x) => `<button class="puce ${Number(v.niveau) === x.n ? 'on' : ''}" data-a="pNiveau" data-n="${x.n}">${x.n}. ${esc(x.nom)}</button>`).join('')}</div><p class="muet" style="margin:0">Au niveau 3, Edge s’ouvre sur sa session, limité aux sites autorisés. Au niveau 4, elle peut fermer Flocon et la fin de séance laisse cinq minutes.</p></div>
      <div class="panneau"><h3>Programmes interdits</h3><p class="muet" style="margin:0">Les navigateurs, l’invite de commandes et le Microsoft Store le sont déjà. Ajoutez ici, un par ligne, le nom des programmes à bloquer sur sa session (par exemple les logiciels professionnels de la famille). Pour trouver un nom : clic droit sur le raccourci, Propriétés, la cible se termine par « nom.exe ».</p><textarea class="champ" data-in="pInterdits" rows="3" placeholder="exemple.exe">${esc(v.interdits || '')}</textarea></div>
      <div class="panneau"><h3>Atelier de première connexion</h3><div class="rang entre"><span class="muet">Pour que ${esc(prenom() || 'votre enfant')} choisisse elle-même ou lui-même son compagnon, son monde et son portrait. Ses créations et sa tirelire ne bougent pas.</span><button class="btn doux petit" data-a="pRefaireAtelier">Refaire l’atelier</button></div></div>
      <div class="panneau"><h3>Changer le code</h3><input class="champ" style="max-width:200px" data-in="pNouveauPin" inputmode="numeric" maxlength="8" placeholder="Nouveau code" value="${esc(v.nouveauPin || '')}"></div>
      <div class="rang entre"><span class="muet">Les changements sont appliqués dans la minute.</span><button class="btn" data-a="pEnregistrer">Enregistrer</button></div></div></div>`;
  }
  return '';
}

// ---------- compagnon ----------
const CONSEILS = [
  () => 'Coucou ! Si tu te perds, clique sur moi.',
  () => 'Tu peux réduire cette fenêtre avec le tiret en haut à droite. Elle t’attend dans la barre des tâches.',
  () => 'Dans « Mon style », tu peux changer de monde ou mettre ta propre photo en fond d’écran.',
  () => 'Une question te trotte dans la tête ? Note-la dans le Grand Pourquoi, dans « J’apprends ».',
  () => 'Tes yeux ont besoin d’une pause de temps en temps : regarde loin par la fenêtre.',
  () => 'Un livre t’a plu ? Range-le dans ton carnet de lecture.',
  () => 'Pas d’idée ? Clique sur « Une idée ? » dans Je crée.',
  () => 'Tes créations enregistrées dans « Mes créations » apparaissent dans ta galerie.'
];
function poseCompa() {
  if (S.bulle && /Bravo|Une étape|fier|Bienvenue|Super/.test(S.bulle)) return 'bravo';
  if (S.vue && (S.vue.ref === 'exposes' || S.vue.ref === 'pourquoi' || S.vue.ref === 'idee')) return 'reflechir';
  if (S.vue && S.vue.ref === 'galerie') return 'bravo';
  if (S.rubrique === 'lire' || (S.vue && (S.vue.ref === 'carnetLecture' || S.vue.ref === 'journal'))) return 'lire';
  const texte = S.bulle || CONSEILS[S.conseil % CONSEILS.length]();
  if (/pause|yeux/.test(texte)) return 'baille';
  return S.conseil % CONSEILS.length === 0 && !S.bulle ? 'salut' : 'montre';
}
function vueMascotte() {
  if (S.ecran !== 'bureau' || !S.profil || !S.profil.floconVisible) return '';
  const texte = S.bulle || CONSEILS[S.conseil % CONSEILS.length]();
  return `<div class="mascotte"><div class="dire"><span>${esc(texte)}</span><button class="btn doux petit" style="align-self:flex-end;height:28px" data-a="taire">Chut, ${esc(nomCompa())}</button></div><button class="compagnon" data-a="conseilSuivant" aria-label="${esc(nomCompa())}, ton compagnon"><img src="${imgCompa(poseCompa())}" alt=""></button></div>`;
}
function dire(t) { S.bulle = t; clearTimeout(dire.t); dire.t = setTimeout(() => { S.bulle = null; if (S.ecran === 'bureau') $('#mascotte').innerHTML = vueMascotte(); }, 8000); }

// ======================================================================
// APRÈS RENDU : toiles de dessin
// ======================================================================
function apresRendu() {
  ['toile-avatar', 'toile-sig1', 'toile-sig2'].forEach((id) => {
    const c = document.getElementById(id); if (!c) return;
    const ctx = c.getContext('2d');
    if (id === 'toile-avatar') {
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      if (S.profil.avatar) { const im = new Image(); im.onload = () => ctx.drawImage(im, 0, 0, c.width, c.height); im.src = S.profil.avatar; }
    } else if (S.profil.signatures && S.profil.signatures[id]) { const im = new Image(); im.onload = () => ctx.drawImage(im, 0, 0); im.src = S.profil.signatures[id]; }
    let dessine = false, dernier = null;
    const pos = (e) => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * c.width / r.width, (e.clientY - r.top) * c.height / r.height]; };
    c.onpointerdown = (e) => { dessine = true; dernier = pos(e); c.setPointerCapture(e.pointerId); trait(e); };
    c.onpointermove = (e) => { if (dessine) trait(e); };
    c.onpointerup = () => { dessine = false; sauverToile(id); };
    function trait(e) {
      const p = pos(e); ctx.strokeStyle = id === 'toile-avatar' ? S.crayon.couleur : '#1E2A4A'; ctx.lineWidth = id === 'toile-avatar' ? S.crayon.taille : 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(dernier[0], dernier[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); dernier = p;
    }
  });
  const m = document.getElementById('lecteur');
  if (m) m.onended = () => {};
}
function sauverToile(id) {
  const c = document.getElementById(id); if (!c) return;
  if (id === 'toile-avatar') { if (S.ecran === 'atelier') { S.profil.avatar = c.toDataURL('image/png'); sauverProfil(); } else S.portraitBrouillon = c.toDataURL('image/png'); }
  else { S.profil.signatures = S.profil.signatures || {}; S.profil.signatures[id] = c.toDataURL('image/png'); }
}

// ======================================================================
// ACTIONS
// ======================================================================
async function chargerDoc(nom, fichier, defaut) { const d = await F.lireDoc('carnets', fichier); S.docs[nom] = d || defaut; }
async function ecrireCarnet(nom, fichier) { await F.ecrireDoc('carnets', fichier, S.docs[nom]); }
let minuterieSauver = null;
function sauverPlusTard(fn) { clearTimeout(minuterieSauver); minuterieSauver = setTimeout(fn, 600); }

async function ouvrirVue(ref) {
  S.vue = { ref };
  if (ref === 'exposes') S.docs.exposes = await F.listerDocs('exposes');
  if (ref === 'pourquoi') await chargerDoc('pourquoi', 'grand-pourquoi.json', { questions: [] });
  if (ref === 'carnetLecture') await chargerDoc('lectures', 'lectures.json', { livres: [] });
  if (ref === 'journal') await chargerDoc('journal', 'journal.json', { pages: [] });
  if (ref === 'photos') S.docs.photos = await F.photos();
  if (ref === 'galerie') S.docs.creations = await F.creations();
  if (ref === 'agenda') { await chargerDoc('agenda', 'agenda.json', { evenements: [] }); S.vue.date = isoJour(new Date()); S.vue.type = 'École'; }
  if (ref === 'semaine') { await chargerDoc('seances', 'mes-seances.json', { seances: [] }); try { const r2 = await F.etat(); S.etat = r2.etat; } catch (e) { /* rien */ } }
  if (ref === 'idee') { S.idee = tirerIdee(); }
  if (ref === 'musique') S.docs.musique = await F.musique();
  if (ref === 'livresAudio') S.docs.musique = await F.livresAudio();
  if (ref === 'films') S.docs.films = await F.films();
  render();
}

async function lancer(t, sansPas) {
  if (t.type === 'projet') { S.vue = { ref: 'projet', id: t.ref }; render(); return; }
  if (t.type === 'logiciel' && !sansPas && D.catalogue.PREMIERS_PAS[t.ref] && !((S.profil.vus || {})[t.ref])) { S.voile = { type: 'premiersPas', t }; render(); return; }
  if (t.type === 'site') return ouvrirSite(D.catalogue.SITES[t.ref].url, D.catalogue.SITES[t.ref].nom);
  if (t.type === 'interne') return ouvrirVue(t.ref);
  if (S.ouverture) return; // un seul lancement à la fois : un double clic ouvrirait le logiciel deux fois
  const r = await F.lancer({ type: t.type, ref: t.ref });
  if (r && r.ok) {
    dire('C’est parti pour ' + t.nom + ' ! Il s’ouvre dans sa propre fenêtre.');
    // Certains logiciels (Scratch, Minecraft) mettent longtemps à apparaître : on le dit, au lieu de laisser croire que rien ne se passe.
    S.ouverture = { nom: t.nom, depuis: Date.now() }; render();
    clearTimeout(S.minuteOuverture); S.minuteOuverture = setTimeout(finOuverture, 90000);
  }
  else dire((r && r.nom ? r.nom : t.nom) + ' n’est pas encore installé sur cet ordinateur. Demande à un adulte.');
  if (!S.profil.floconVisible) toast(r && r.ok ? 'Ouverture de ' + t.nom + '…' : t.nom + ' n’est pas encore installé.');
  $('#mascotte').innerHTML = vueMascotte();
}

function finOuverture() { if (!S.ouverture) return; S.ouverture = null; clearTimeout(S.minuteOuverture); render(); }
function vueOuverture() {
  if (!S.ouverture) return '';
  return `<div class="voile"><div class="carte verre" style="width:min(460px,92vw);align-items:center;text-align:center"><div class="tourne"></div><h2>${esc(S.ouverture.nom)} s’ouvre…</h2>
    <p class="muet" style="margin:0">Il apparaît dans sa propre fenêtre, par-dessus Flocon. Certains logiciels mettent jusqu’à une minute, surtout la première fois : patiente, ne clique pas plusieurs fois.</p>
    <p class="muet" style="margin:0">Pour revenir ensuite à Flocon : clique sur son icône dans la barre en bas de l’écran.</p>
    <button class="btn doux" data-a="finOuverture">D’accord</button></div></div>`;
}

async function ouvrirSite(url, nom) {
  if (!(await F.urlAutorisee(url))) { toast('Ce site n’est pas dans la liste autorisée.'); return; }
  const s = $('#site');
  s.innerHTML = `<div class="outils"><button class="btn doux petit" id="site-retour">‹ Page précédente</button><span class="adresse" id="site-adresse">${esc(nom)}</span><button class="btn petit" id="site-fermer">Fermer ${esc(nom)}</button></div><webview id="vue-site" src="${esc(url)}" partition="persist:sites" allowpopups="false"></webview>`;
  s.classList.add('ouvert');
  const w = $('#vue-site');
  $('#site-retour').onclick = () => { if (w.canGoBack()) w.goBack(); };
  $('#site-fermer').onclick = fermerSite;
  w.addEventListener('did-navigate', (e) => { try { $('#site-adresse').textContent = nom + ' · ' + new URL(e.url).hostname; } catch (x) { /* rien */ } });
}
function fermerSite() { const s = $('#site'); s.classList.remove('ouvert'); s.innerHTML = ''; }

async function commencer() {
  const a = S.accueil;
  const id = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const prevu = a.aDeuxPin ? (S.config.aDeuxMaxMinutes || 120) : a.jetons * 15;
  S.seance = { id, debut: Date.now(), jetons: a.aDeuxPin ? 0 : a.jetons, aDeux: !!a.aDeuxPin, prevu, intention: a.intention, libre: a.libre, humeur: a.humeur || null };
  S.averti2 = false;
  F.seance(id);
  await F.demande({ sessionId: id, jetons: a.aDeuxPin ? 0 : a.jetons, aDeuxPin: a.aDeuxPin || null, fini: false, intention: a.intention, libre: a.libre });
  const vers = { creer: ['creer'], expose: ['apprendre', 'exposes'], devoirs: ['apprendre'], question: ['apprendre', 'pourquoi'], jouer: ['jeux'], ecouter: ['medias', 'musique'] }[a.intention] || [ordreRubriques()[0].id];
  S.rubrique = vers[0]; S.vue = null;
  S.ecran = 'bureau';
  await F.mode(false);
  S.bulle = null; S.conseil = 0;
  if (vers[1]) await ouvrirVue(vers[1]); else render();
  dire(a.libre.trim() ? 'Aujourd’hui, tu viens pour : ' + a.libre.trim() + '. Bonne séance !' : 'Bienvenue ! Bonne séance, ' + prenom() + '.');
  $('#mascotte').innerHTML = vueMascotte();
}

async function allerFin(temps) {
  fermerSite();
  S.fin = { choix: [], texte: '', temps: !!temps };
  S.ecran = 'fin'; S.vue = null;
  await F.mode(true);
  render();
}

function tirerIdee() { const l = D.catalogue.IDEES; let i; do { i = Math.floor(Math.random() * l.length); } while (l.length > 1 && l[i] === S.idee); return l[i]; }

// ---------- la première en famille ----------
function dessinerPremiere() {
  const p = S.premiere; const el = $('#premiere');
  clearTimeout(dessinerPremiere.t);
  if (!p) { el.classList.remove('ouvert'); el.innerHTML = ''; return; }
  const l = S.docs.creations; const o = l[p.i];
  let scene;
  if (o.type === 'image') { scene = `<img src="${esc(o.url)}" alt="">`; dessinerPremiere.t = setTimeout(() => A.premiereSuiv(), 7000); }
  else if (o.type === 'video') scene = `<video src="${esc(o.url)}" autoplay controls></video>`;
  else scene = `<div class="section" style="align-items:center"><div class="compagnon"><img src="${imgCompa('lire')}" alt=""></div><audio src="${esc(o.url)}" autoplay controls style="width:420px"></audio></div>`;
  el.innerHTML = `<div class="scene">${scene}</div><div class="barre"><button class="btn doux petit" data-a="premierePrec">‹</button><span class="grow">${esc(o.nom)} <span style="opacity:.6;font-size:14px">${p.i + 1} / ${l.length}</span></span><button class="btn doux petit" data-a="premiereSuiv">›</button><button class="btn petit" data-a="premiereFin">Fin de la projection</button></div>`;
  el.classList.add('ouvert');
  const m = el.querySelector('video,audio'); if (m) m.onended = () => A.premiereSuiv();
}

const A = {
  // atelier
  atelierSuiv: async () => {
    if (ETAPES_ATELIER[S.etape] === 'portrait') sauverToile('toile-avatar');
    if (S.etape < ETAPES_ATELIER.length - 1) S.etape++;
    await sauverProfil(); render();
  },
  atelierPrec: () => { if (S.etape > 0) S.etape--; render(); },
  choisirCompa: (d) => {
    const ancien = COMPAGNONS[S.profil.compagnon.id] || {};
    if (!S.profil.compagnon.nom || S.profil.compagnon.nom === ancien.idee) S.profil.compagnon.nom = (COMPAGNONS[d.id] || {}).idee || S.profil.compagnon.nom;
    S.profil.compagnon.id = d.id; sauverProfil(); render();
  },
  choisirTheme: (d) => { S.profil.theme = d.id; S.profil.photoFond = null; appliquerFond(); sauverProfil(); render(); if (S.ecran === 'bureau') dire('Bienvenue dans le monde ' + (FONDS.THEMES.find((t) => t.id === d.id) || {}).nom + ' !'); },
  photoFond: async () => { const u = await F.choisirFond(); if (u) { S.profil.photoFond = u; appliquerFond(); await sauverProfil(); render(); } },
  sansPhoto: async () => { S.profil.photoFond = null; appliquerFond(); await sauverProfil(); render(); },
  couleur: (d) => { S.crayon.couleur = d.c; document.querySelectorAll('.couleurs button').forEach((b) => b.classList.toggle('on', b.dataset.c === d.c)); },
  taille: (d) => { S.crayon.taille = Number(d.t); render(); },
  effacerToile: (d) => { const c = document.getElementById(d.id); const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); if (S.ecran === 'atelier') { S.profil.avatar = null; sauverProfil(); } else S.portraitBrouillon = null; },
  garderPortrait: async () => { if (S.portraitBrouillon) { S.profil.avatar = S.portraitBrouillon; await sauverProfil(); dire('Super portrait ! Tu le verras en allumant l’ordinateur.'); render(); } },
  basculerEnvie: async (d) => { const e = S.profil.envies; const i = e.indexOf(d.id); if (i >= 0) e.splice(i, 1); else e.push(d.id); await sauverProfil(); render(); },
  cocher: (d) => { S.pacte.coches[d.i] = !S.pacte.coches[d.i]; render(); },
  signerPacte: () => {
    sauverToile('toile-sig1'); sauverToile('toile-sig2');
    demanderPin('Code de l’adulte', async () => {
      S.profil.atelierFait = true; S.profil.pacteLe = new Date().toISOString();
      await sauverProfil();
      S.ecran = 'accueil'; S.accueil = { etape: 'tirelire', jetons: 1, aDeuxPin: null, intention: null, libre: '' };
      render();
    });
  },
  // accueil
  jetonsMoins: () => { S.accueil.jetons = Math.max(1, S.accueil.jetons - 1); render(); },
  jetonsPlus: () => { S.accueil.jetons = Math.min(Math.min(S.config.maxParSeance, jetonsRestants()), S.accueil.jetons + 1); render(); },
  aDeux: () => demanderPin('À deux : code de l’adulte', (pin) => { S.accueil.aDeuxPin = pin; S.accueil.etape = 'intention'; render(); }),
  versIntention: () => { S.accueil.aDeuxPin = null; S.accueil.etape = 'intention'; render(); },
  versTirelire: () => { S.accueil.etape = 'tirelire'; render(); },
  intention: (d) => { S.accueil.intention = S.accueil.intention === d.id ? null : d.id; render(); },
  commencer: () => commencer(),
  eteindre: () => F.finir(),
  // bureau
  reduire: () => F.reduire(),
  rubrique: (d) => { S.rubrique = d.id; S.vue = null; render(); },
  tuile: (d) => lancer(S.tuilesAffichees[Number(d.i)]),
  finOuverture: () => finOuverture(),
  pasOuvrir: async () => { const t = S.voile.t; S.profil.vus = Object.assign({}, S.profil.vus, { [t.ref]: true }); await sauverProfil(); S.voile = null; render(); lancer(t, true); },
  pasDebrouille: async () => { const t = S.voile.t; S.profil.vus = Object.assign({}, S.profil.vus, { [t.ref]: true }); await sauverProfil(); S.voile = null; render(); dire('D’accord ! Si tu bloques, clique sur moi.'); lancer(t, true); },
  autreIdee: () => { if (!S.seance) S.seance = { id: 'x', debut: Date.now(), prevu: 30 }; S.seance.tirages = (S.seance.tirages || 0) + 1; if (S.seance.tirages <= 3) S.idee = tirerIdee(); render(); },
  prendreIdee: () => { S.vue = null; S.rubrique = 'creer'; dire('Bonne idée ! Choisis ton outil : « ' + S.idee + ' »'); render(); },
  premiere: async () => { if (!(S.docs.creations || []).length) return; S.premiere = { i: 0 }; await F.mode(true); dessinerPremiere(); },
  premiereSuiv: () => { if (!S.premiere) return; const n = S.docs.creations.length; if (S.premiere.i < n - 1) { S.premiere.i++; dessinerPremiere(); } else A.premiereFin(); },
  premierePrec: () => { if (!S.premiere) return; S.premiere.i = Math.max(0, S.premiere.i - 1); dessinerPremiere(); },
  premiereFin: async () => { S.premiere = null; dessinerPremiere(); await F.mode(false); dire('Bravo pour ta première ! Qu’est-ce que ta famille en a pensé ?'); render(); },
  fermerVue: () => { S.vue = null; render(); },
  basculerFlocon: async () => { S.profil.floconVisible = !S.profil.floconVisible; await sauverProfil(); render(); },
  taire: async () => { S.profil.floconVisible = false; await sauverProfil(); render(); },
  conseilSuivant: () => { S.bulle = null; S.conseil++; $('#mascotte').innerHTML = vueMascotte(); },
  jaiFini: () => allerFin(false),
  // exposés
  creerExpose: async () => {
    const sujet = (S.vue.sujet || '').trim(); if (!sujet) return toast('Écris d’abord ton sujet.');
    const f = sujet.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) + '-' + Date.now().toString(36) + '.json';
    const doc = { sujet, pourQuand: (S.vue.quand || '').trim(), cree: new Date().toISOString(), etapes: [] };
    await F.ecrireDoc('exposes', f, doc);
    S.docs.exposes = await F.listerDocs('exposes');
    S.vue = { ref: 'exposes', fichier: f, etape: 0 }; render();
  },
  ouvrirExpose: (d) => { S.vue = { ref: 'exposes', fichier: d.f, etape: 0 }; const x = S.docs.exposes.find((e) => e.fichier === d.f); if (x && x.etapes) { const k = x.etapes.findIndex((e) => !e || !e.fait); S.vue.etape = k < 0 ? 5 : k; } render(); },
  etapeExpose: (d) => { S.vue.etape = Number(d.i); render(); },
  etapeFaite: async () => {
    const x = S.docs.exposes.find((e) => e.fichier === S.vue.fichier); const i = S.vue.etape;
    x.etapes[i] = Object.assign({}, x.etapes[i], { fait: !(x.etapes[i] && x.etapes[i].fait) });
    const { fichier, ...contenu } = x; await F.ecrireDoc('exposes', fichier, contenu);
    if (x.etapes[i].fait) { dire('Une étape de plus pour ton exposé : bravo !'); if (i < 5) S.vue.etape = i + 1; }
    render();
  },
  outilExpose: (d) => { if (d.type === 'site') lancer({ type: 'site', ref: d.ref }); else if (d.type === 'interne') ouvrirVue(d.ref); else lancer({ type: 'logiciel', ref: d.ref, nom: d.nom || ({ writer: 'Writer', impress: 'Impress', krita: 'Krita', audacity: 'Audacity', stopmotion: 'Stop Motion Studio' })[d.ref] || d.ref }); },
  dossierExposes: () => F.ouvrirDossier('exposes'),
  // carnets
  ajouterQuestion: async () => { const q = (S.vue.q || '').trim(); if (!q) return; S.docs.pourquoi.questions.unshift({ q, r: '', date: new Date().toISOString() }); S.vue.q = ''; await ecrireCarnet('pourquoi', 'grand-pourquoi.json'); render(); },
  chercherVikidia: (d) => { const q = S.docs.pourquoi.questions[Number(d.i)].q; ouvrirSite('https://fr.vikidia.org/w/index.php?search=' + encodeURIComponent(q), 'Vikidia'); },
  noteLivre: (d) => { S.vue.n = Object.assign({}, S.vue.n, { note: Number(d.k) }); render(); },
  ajouterLivre: async () => { const n = S.vue.n || {}; if (!(n.titre || '').trim()) return toast('Écris au moins le titre.'); S.docs.lectures.livres.push(Object.assign({ date: new Date().toISOString() }, n)); S.vue.n = {}; await ecrireCarnet('lectures', 'lectures.json'); dire('Super, un livre de plus dans ton carnet !'); render(); },
  ajouterPage: async () => { const t = (S.vue.texte || '').trim(); if (!t) return; S.docs.journal.pages.push({ date: new Date().toISOString(), texte: t }); S.vue.texte = ''; await ecrireCarnet('journal', 'journal.json'); render(); },
  // médias
  importerPhotos: async () => { toast('Je regarde si ton appareil photo est branché…'); const r = await F.importerPhotos(); if (!r.trouve) toast('Je ne trouve pas d’appareil photo. Vérifie qu’il est branché et allumé.', 6000); else { toast(r.copies ? r.copies + ' nouvelle' + (r.copies > 1 ? 's' : '') + ' photo' + (r.copies > 1 ? 's' : '') + ' rangée' + (r.copies > 1 ? 's' : '') + ' !' : 'Toutes tes photos sont déjà là.', 6000); S.docs.photos = await F.photos(); render(); } },
  ouvrirDossier: (d) => F.ouvrirDossier(d.d),
  jouer: (d) => { S.vue.joue = S.docs.musique[Number(d.i)].url; render(); },
  choisirMorceau: (d) => { S.vue.sel = Object.assign({}, S.vue.sel); S.vue.sel[d.i] = !S.vue.sel[d.i]; render(); },
  copierCasque: async () => { const c = await F.casque(); if (!c.dossier) return toast('Je ne trouve pas ton casque. Branche-le avec son câble et allume-le.', 6000); const chemins = Object.keys(S.vue.sel).filter((k) => S.vue.sel[k]).map((k) => S.docs.musique[Number(k)].chemin); const r = await F.copierCasque(chemins); toast(r.ok ? r.n + ' morceau' + (r.n > 1 ? 'x' : '') + ' copié' + (r.n > 1 ? 's' : '') + ' sur ton casque.' : 'La copie n’a pas marché.', 6000); },
  jouerFilm: (d) => { S.vue.joue = S.docs.films[Number(d.i)].url; render(); },
  minuteur: (d) => { S.minuteur = { fin: Date.now() + Number(d.k) * 60000 }; render(); },
  minuteurStop: () => { S.minuteur = null; render(); },
  // fin
  fierte: (d) => { const i = Number(d.i); const c = S.fin.choix; const k = c.indexOf(i); if (k >= 0) c.splice(k, 1); else c.push(i); render(); },
  auRevoir: async () => {
    try { await chargerDoc('seances', 'mes-seances.json', { seances: [] }); S.docs.seances.seances.push({ date: new Date().toISOString(), intention: S.seance && (S.seance.libre || S.seance.intention), fierte: S.fin.choix, texte: S.fin.texte, humeur: S.seance && S.seance.humeur }); await ecrireCarnet('seances', 'mes-seances.json'); } catch (e) { /* rien */ }
    if (S.seance) await F.demande({ sessionId: S.seance.id, fini: true });
    await F.finir();
  },
  // code
  pin: async (d) => {
    const v = S.voile; if (v.saisie.length >= 4) return;
    v.saisie += d.k; v.erreur = false;
    if (v.saisie.length === 4) {
      if (await pinOk(v.saisie)) { const suite = v.suite; const pin = v.saisie; S.voile = null; render(); suite(pin); }
      else { v.saisie = ''; v.erreur = true; render(); }
    } else render();
  },
  pinEffacer: () => { S.voile.saisie = S.voile.saisie.slice(0, -1); render(); },
  pinAnnuler: () => { S.voile = null; render(); },
  fermerVoile: () => { S.voile = null; render(); },
  espaceParent: () => demanderPin('Espace parent', async (pin) => {
    const steam = await F.jeuxSteam();
    const sitesActuels = S.config.sites || Array.from(new Set(Object.values(D.catalogue.SITES).flatMap((s) => s.domaines)));
    S.voile = { type: 'parent', pin, steam: Array.isArray(steam) ? steam : [], jeux: (S.config.jeux || []).slice(), jetonsSemaine: S.config.jetonsSemaine, maxParSeance: S.config.maxParSeance, niveau: niveau(), ajouter: 0, sites: sitesActuels.join('\n'), interdits: (S.config.interdits || []).join('\n'), nouveauPin: '' };
    render();
  }),
  pRefaireAtelier: async () => {
    S.profil.atelierFait = false; S.profil.signatures = {}; S.pacte = null; S.etape = 0;
    await sauverProfil();
    S.voile = null; S.ecran = 'atelier'; fermerSite();
    await F.mode(true); render();
  },
  pNiveau: (d) => { S.voile.niveau = Number(d.n); render(); },
  humeur: (d) => { S.accueil.humeur = S.accueil.humeur === d.h ? null : d.h; render(); },
  fermerFlocon: () => F.fermer(),
  mission: async (d) => { S.profil.missions = Object.assign({}, S.profil.missions, { [d.k]: !(S.profil.missions || {})[d.k] }); await sauverProfil(); render(); },
  passerNiveau: () => demanderPin('Valider le niveau ' + (niveau() + 1), async (pin) => { await F.parent({ pin, changements: { niveau: niveau() + 1 } }); dire('Bravo ! Ton nouveau niveau arrive dans la minute.'); toast('Le nouveau niveau s’applique dans la minute.', 6000); }),
  planPlus: (d) => { S.vue.plan[Number(d.i)] = Math.min(S.config.maxParSeance, S.vue.plan[Number(d.i)] + 1); render(); },
  planMoins: (d) => { S.vue.plan[Number(d.i)] = Math.max(0, S.vue.plan[Number(d.i)] - 1); render(); },
  garderPlan: async () => { const sv = idSemaine(new Date(lundiDe(new Date()).getTime() + 7 * 86400000)); S.profil.plan = { semaine: sv, jours: S.vue.plan.slice() }; await sauverProfil(); toast('Ton plan est gardé : tu le verras chaque jour en allumant l’ordinateur.', 5000); },
  choisirJour: (d) => { S.vue.date = d.d; render(); },
  moisPrec: () => { const m = S.vue.mois ? new Date(S.vue.mois + '-01T12:00') : new Date(); m.setDate(1); m.setMonth(m.getMonth() - 1); S.vue.mois = m.getFullYear() + '-' + String(m.getMonth() + 1).padStart(2, '0'); render(); },
  moisSuiv: () => { const m = S.vue.mois ? new Date(S.vue.mois + '-01T12:00') : new Date(); m.setDate(1); m.setMonth(m.getMonth() + 1); S.vue.mois = m.getFullYear() + '-' + String(m.getMonth() + 1).padStart(2, '0'); render(); },
  evType: (d) => { S.vue.type = d.t; render(); },
  ajouterEv: async () => { const t = (S.vue.titre || '').trim(); if (!t || !S.vue.date) return toast('Écris ce qui se passe et choisis la date.'); S.docs.agenda.evenements.push({ id: 'e' + Date.now().toString(36), date: S.vue.date, titre: t, type: S.vue.type || 'Autre' }); S.vue.titre = ''; await ecrireCarnet('agenda', 'agenda.json'); render(); },
  supprimerEv: async (d) => { S.docs.agenda.evenements = S.docs.agenda.evenements.filter((e) => e.id !== d.id); await ecrireCarnet('agenda', 'agenda.json'); render(); },
  documentWord: async () => { const r2 = await F.documentExpose(S.vue.fichier); toast(!(r2 && r2.ok) ? 'Le document n’a pas pu être créé.' : r2.garde ? 'Ton document a été retouché dans Writer : je l’ouvre tel quel, sans l’écraser.' : 'Ton document s’ouvre dans Writer, avec tes dernières notes. Il est rangé dans « Mes exposés ».', 6000); },
  imprimerOeuvre: async (d) => { const o = S.docs.creations[Number(d.i)]; const r2 = await F.imprimer(o.chemin); toast(r2 && r2.ok ? 'La fenêtre d’impression s’ouvre.' : 'Impossible d’imprimer ce fichier.'); },
  pJeu: (d) => { const j = S.voile.jeux; const k = j.findIndex((x) => x.id === d.id); if (k >= 0) j.splice(k, 1); else j.push({ id: d.id, nom: d.nom }); render(); },
  pEnregistrer: async () => {
    const v = S.voile;
    const ch = { niveau: Number(v.niveau), jetonsSemaine: Number(v.jetonsSemaine), maxParSeance: Number(v.maxParSeance), jeux: v.jeux, sites: String(v.sites).split(/\s+/).map((x) => x.trim()).filter(Boolean), interdits: String(v.interdits || '').split(/\r?\n/).map((x) => x.trim().replace(/^.*[\\/]/, '')).filter((x) => /\.exe$/i.test(x)) };
    if (Number(v.ajouter) > 0) ch.ajouterJetons = Number(v.ajouter);
    if (v.nouveauPin && String(v.nouveauPin).length >= 4) ch.nouveauPin = String(v.nouveauPin);
    await F.parent({ pin: v.pin, changements: ch });
    S.voile = null; render(); toast('C’est noté : les réglages s’appliquent dans la minute.', 6000);
  }
};

// saisies (sans re-rendu pour garder le curseur)
const SAISIES = {
  prenom: (v) => { S.profil.prenom = v; majBouton(!!v.trim()); },
  nomCompa: (v) => { S.profil.compagnon.nom = v; majBouton(!!v.trim()); },
  nomCompaStyle: (v) => { S.profil.compagnon.nom = v; sauverPlusTard(sauverProfil); },
  libre: (v) => { S.accueil.libre = v; majBouton(!!(S.accueil.intention || v.trim())); },
  nouveauSujet: (v) => { S.vue.sujet = v; }, nouveauQuand: (v) => { S.vue.quand = v; },
  noteExpose: (v) => { const x = S.docs.exposes.find((e) => e.fichier === S.vue.fichier); const i = S.vue.etape; x.etapes[i] = Object.assign({}, x.etapes[i], { notes: v }); sauverPlusTard(() => { const { fichier, ...c } = x; F.ecrireDoc('exposes', fichier, c); }); },
  nouvelleQuestion: (v) => { S.vue.q = v; },
  reponse: (v, el) => { S.docs.pourquoi.questions[Number(el.dataset.i)].r = v; sauverPlusTard(() => ecrireCarnet('pourquoi', 'grand-pourquoi.json')); },
  livreTitre: (v) => { S.vue.n = Object.assign({}, S.vue.n, { titre: v }); }, livreAuteur: (v) => { S.vue.n = Object.assign({}, S.vue.n, { auteur: v }); }, livreAvis: (v) => { S.vue.n = Object.assign({}, S.vue.n, { avis: v }); },
  pageJournal: (v) => { S.vue.texte = v; },
  fierteTexte: (v) => { S.fin.texte = v; },
  pJetons: (v) => { S.voile.jetonsSemaine = v; }, pMax: (v) => { S.voile.maxParSeance = v; }, pAjout: (v) => { S.voile.ajouter = v; }, pSites: (v) => { S.voile.sites = v; }, pInterdits: (v) => { S.voile.interdits = v; }, evDate: (v) => { S.vue.date = v; }, evTitre: (v) => { S.vue.titre = v; }, pNouveauPin: (v) => { S.voile.nouveauPin = v.replace(/\D/g, ''); }
};
function majBouton(ok) { const b = document.querySelector('[data-a="atelierSuiv"],[data-a="commencer"]'); if (b) b.disabled = !ok; }

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const fn = A[el.dataset.a]; if (fn) { e.preventDefault(); fn(el.dataset); }
});
document.addEventListener('input', (e) => { const el = e.target.closest('[data-in]'); if (el && SAISIES[el.dataset.in]) SAISIES[el.dataset.in](el.value, el); });
document.addEventListener('keydown', (e) => {
  if (S.premiere) { if (e.key === 'ArrowRight') A.premiereSuiv(); else if (e.key === 'ArrowLeft') A.premierePrec(); else if (e.key === 'Escape') A.premiereFin(); return; }
  if (S.voile && S.voile.type === 'pin') { if (/^\d$/.test(e.key)) A.pin({ k: e.key }); else if (e.key === 'Backspace') A.pinEffacer(); else if (e.key === 'Escape') A.pinAnnuler(); return; }
  if (e.key === 'Enter' && e.target.matches && e.target.matches('input[data-in="prenom"],input[data-in="nomCompa"]')) { const b = document.querySelector('[data-a="atelierSuiv"]'); if (b && !b.disabled) b.click(); }
});

// horloge du minuteur
setInterval(() => {
  if (!S.minuteur) return;
  const reste = Math.max(0, Math.round((S.minuteur.fin - Date.now()) / 1000));
  const el = document.getElementById('aff-minuteur');
  if (el) el.textContent = String(Math.floor(reste / 60)).padStart(2, '0') + ':' + String(reste % 60).padStart(2, '0');
  if (reste === 0) { S.minuteur = null; sonnerie(); toast('Le minuteur a sonné !'); }
}, 500);
function sonnerie() { try { const ctx = new AudioContext(); [0, .35, .7].forEach((t) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 880; g.gain.setValueAtTime(.2, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + t + .3); o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + .3); }); } catch (e) { /* rien */ } }

// ======================================================================
// DÉMARRAGE
// ======================================================================
// Une séance encore ouverte côté gardien, commencée il y a moins que sa durée prévue (plus un quart d'heure).
function seanceAReprendre() {
  const s = S.etat && S.etat.session;
  if (!s || s.fermee || !S.profil.atelierFait) return null;
  const limite = s.aDeux ? (S.config.aDeuxMaxMinutes || 120) : (s.pris || 0) * 15;
  if (!limite || Date.now() > new Date(s.debut).getTime() + (limite + 15) * 60000) return null;
  return { s, limite };
}

async function demarrer() {
  D = await F.init();
  S.config = D.config; S.etat = D.etat;
  S.profil = Object.assign(profilParDefaut(), D.profil || {});
  S.profil.compagnon = Object.assign({ id: 'pingouin', nom: 'Flocon' }, S.profil.compagnon || {});
  appliquerFond();
  try { await chargerDoc('agenda', 'agenda.json', { evenements: [] }); } catch (e) { /* rien */ }
  S.ecran = S.profil.atelierFait ? 'accueil' : 'atelier';
  if (!S.profil.atelierFait) F.demande({ atelier: true });
  F.surFenetreQuittee(() => { if (S.ouverture && Date.now() - S.ouverture.depuis > 800) finOuverture(); });
  F.surSiteRefuse(() => toast('Cette page n’est pas dans la liste autorisée : elle ne s’ouvre pas.', 5000));
  const reprise = seanceAReprendre();
  if (reprise) {
    // Flocon rouvert pendant une séance (niveau 4, plantage, relance) : on reprend au bureau, sans reprendre de jetons.
    S.seance = { id: reprise.s.id, debut: new Date(reprise.s.debut).getTime(), jetons: reprise.s.pris, aDeux: !!reprise.s.aDeux, prevu: reprise.limite, intention: null, libre: '', reprise: true };
    F.seance(S.seance.id);
    S.ecran = 'bureau'; S.rubrique = ordreRubriques()[0].id;
    await F.mode(false);
    dire('On reprend ta séance là où tu l’avais laissée.');
  }
  render();
  setInterval(sonder, 15000);
  setInterval(() => { if (S.ecran === 'accueil') { const h = document.querySelector('.heure'); if (h) { const d = new Date(); h.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); } } }, 20000);
}
demarrer();
