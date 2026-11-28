'use strict';
// ======================================================================
// MES MAINS : des défis manuels ouverts, loin de l'écran.
// Un défi, des contraintes, du matériel : jamais de modèle à recopier.
// Pendant le défi, l'écran se met en pause (le temps d'écran ne défile pas,
// 45 minutes au plus par séance), puis on revient prendre sa création en photo.
// ======================================================================
/* global S, D, F, A, SAISIES, esc, entete, toast, render, pluieDeFlocons */

const MAINS = { flux: null, chrono: null, photo: null, decompte: false };
const PALIERS_MAINS = [{ n: 1, nom: 'Petites mains', e: '✋' }, { n: 5, nom: 'Mains habiles', e: '🙌' }, { n: 15, nom: 'Mains de génie', e: '🧠' }, { n: 31, nom: 'Maître des défis', e: '🏆' }];
const HUMEURS_MAINS = [{ id: 'facile', e: '😄', nom: 'Trop facile' }, { id: 'reussi', e: '💪', nom: 'Dur, mais réussi' }, { id: 'appris', e: '🤔', nom: 'Raté, mais j’ai appris' }];
const DUREES = [{ id: 'tout', nom: 'Toutes les durées' }, { id: 'court', nom: 'Moins de 30 min', max: 29 }, { id: 'moyen', nom: '30 à 45 min', min: 30, max: 45 }, { id: 'long', nom: 'Plus long', min: 46 }];

const defis = () => (D && D.catalogue && D.catalogue.DEFIS) || [];
const defiDe = (id) => defis().find((d) => d.id === id);
const faitsDe = (id) => ((S.profil.defisMains || {})[id] || []);
const nbReussis = () => Object.values(S.profil.defisMains || {}).filter((l) => l.length).length;
const placard = () => S.profil.placard || {};
function manquants(d) { const p = placard(); return d.materiel.filter((m) => m.id && !p[m.id]); }
const placardRempli = () => Object.values(placard()).some(Boolean);
const etoilesMains = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);

function vueMains() {
  const v = S.vue;
  if (v.photo) return vuePhotoMains(defiDe(v.id));
  if (v.pause) return vuePauseMains(defiDe(v.id));
  if (v.placard) return vuePlacard();
  if (v.id && defiDe(v.id)) return vueDefiMains(defiDe(v.id));
  const cats = D.catalogue.CATEGORIES_DEFIS;
  const cat = v.cat || 'tout'; const duree = v.duree || 'tout'; const ceQueJai = !!v.ceQueJai && placardRempli();
  const du = DUREES.find((x) => x.id === duree) || DUREES[0];
  const liste = defis().filter((d) => (cat === 'tout' || d.cat === cat) && (du.min === undefined || d.duree >= du.min) && (du.max === undefined || d.duree <= du.max) && (!ceQueJai || !manquants(d).length));
  const n = nbReussis(); const palier = PALIERS_MAINS.filter((p) => n >= p.n).pop(); const suivant = PALIERS_MAINS.find((p) => n < p.n);
  return `<div class="section mains">${entete('Mes mains', '<span class="etiquette">loin de l’écran</span>')}
    <div class="panneau affiche-mains"><div class="grow"><h3>Pas de modèle à recopier ici !</h3><p class="muet" style="margin:4px 0 0">Un défi, du matériel et ton imagination. Ta création ne ressemblera à aucune autre, et c’est ça le but.</p>
      <div class="rang" style="margin-top:12px"><button class="btn" style="background:#F28C28" data-a="mainsSurprise">🎲 Un défi surprise</button><button class="btn doux" data-a="mainsPlacard">🧺 Ce que j’ai à la maison${placardRempli() ? ` (${Object.values(placard()).filter(Boolean).length})` : ''}</button></div></div>
      <div class="palier-mains">${palier ? `<span class="e">${palier.e}</span><b>${esc(palier.nom)}</b>` : '<span class="e">🖐️</span><b>Prête ?</b>'}<span class="muet">${n} défi${n > 1 ? 's' : ''} réussi${n > 1 ? 's' : ''}${suivant ? ` · encore ${suivant.n - n} pour « ${esc(suivant.nom)} »` : ''}</span></div></div>
    <div class="rang filtres-mains"><button class="puce ${cat === 'tout' ? 'on' : ''}" data-a="mainsCat" data-c="tout">Tout</button>${Object.entries(cats).map(([id, c]) => `<button class="puce ${cat === id ? 'on' : ''}" data-a="mainsCat" data-c="${id}">${c.e} ${esc(c.nom)}</button>`).join('')}</div>
    <div class="rang filtres-mains">${DUREES.map((x) => `<button class="puce ${duree === x.id ? 'on' : ''}" data-a="mainsDuree" data-d="${x.id}">${esc(x.nom)}</button>`).join('')}${placardRempli() ? `<button class="puce ${ceQueJai ? 'on' : ''}" data-a="mainsCeQueJai">🧺 Seulement avec ce que j’ai</button>` : ''}</div>
    ${liste.length ? `<div class="grille-defis">${liste.map(carteDefi).join('')}</div>` : '<p class="muet">Aucun défi avec ces choix. Enlève un filtre, ou coche plus de choses dans « Ce que j’ai à la maison ».</p>'}</div>`;
}
function carteDefi(d) {
  const f = faitsDe(d.id).length; const m = placardRempli() ? manquants(d).length : 0;
  return `<button class="carte-defi" data-a="mainsOuvrir" data-id="${d.id}"><span class="e">${d.e}</span><b>${esc(d.titre)}</b>
    <span class="infos"><span>⏱ ${d.duree} min</span><span title="difficulté">${etoilesMains(d.niveau)}</span>${d.adulte ? '<span title="avec un adulte">🧑 adulte</span>' : ''}</span>
    ${f ? `<span class="fait">✓ réussi${f > 1 ? ' ×' + f : ''}</span>` : m ? `<span class="manque">il te manque ${m} chose${m > 1 ? 's' : ''}</span>` : ''}</button>`;
}
function vueDefiMains(d) {
  const v = S.vue; const coche = v.coche || {}; const p = placard(); const cat = D.catalogue.CATEGORIES_DEFIS[d.cat];
  const aides = d.aide.slice(0, v.aides || 0); const faits = faitsDe(d.id);
  const ingenieur = d.cat === 'construire' || d.cat === 'inventer';
  return `<div class="section mains">${entete(d.e + ' ' + d.titre, `<span class="etiquette">${cat.e} ${esc(cat.nom)}</span><span class="etiquette">⏱ ${d.duree} min</span><span class="etiquette">${etoilesMains(d.niveau)}</span>`)}
    <div class="panneau bulle-defi"><span class="muet">Ton défi</span><p class="texte-defi">${esc(d.defi)}</p></div>
    <div class="deux-colonnes">
      <div class="panneau"><h3>Les règles du défi</h3><ul class="regles">${d.contraintes.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
        ${d.adulte ? `<div class="encadre-adulte"><b>🧑 Avec un adulte</b><p>${esc(d.adulte)}</p></div>` : ''}
        <h3>Le test</h3><p style="margin:0">${esc(d.test)}</p></div>
      <div class="panneau"><h3>Ton matériel</h3><p class="muet" style="margin:0">Touche chaque chose quand tu l’as trouvée.</p>
        <div class="liste-materiel">${d.materiel.map((m, i) => `<button class="${coche[i] ? 'on' : ''}" data-a="mainsCocher" data-i="${i}"><span class="case">${coche[i] ? '✓' : ''}</span><span class="grow">${esc(m.txt)}</span>${m.id && placardRempli() && !p[m.id] ? '<span class="manque">à trouver</span>' : ''}</button>`).join('')}</div></div>
    </div>
    ${ingenieur ? `<div class="panneau"><h3>Comme une vraie ingénieure</h3><ol class="methode">${D.catalogue.METHODE.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>` : ''}
    <div class="panneau"><div class="rang entre"><h3>Un coup de pouce ?</h3>${(v.aides || 0) < d.aide.length ? `<button class="btn doux petit" data-a="mainsAide">${v.aides ? 'Encore un indice' : 'Je veux un indice'}</button>` : ''}</div>
      ${aides.length ? `<ul class="indices">${aides.map((x) => `<li>💡 ${esc(x)}</li>`).join('')}</ul>` : '<p class="muet" style="margin:0">Essaie d’abord tout seul. Les indices sont des questions, pas des réponses !</p>'}</div>
    ${faits.length ? `<div class="panneau"><h3>Tes réussites</h3><div class="rang">${faits.map((f) => `<span class="etiquette">${new Date(f.le).toLocaleDateString('fr-FR')}${f.mesure ? ' · ' + esc(f.mesure) + (d.mesure && d.mesure.unite ? ' ' + esc(d.mesure.unite) : '') : ''} ${(HUMEURS_MAINS.find((h) => h.id === f.humeur) || {}).e || ''}</span>`).join('')}</div>
      <h3>Encore plus fort</h3><ul class="regles">${d.plusFort.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
    <div class="rang entre"><button class="btn doux" data-a="mainsPhoto">J’ai déjà fini : la photo !</button><button class="btn grand" style="background:#F28C28" data-a="mainsPartir">✋ C’est parti ! L’écran se met en pause</button></div></div>`;
}
function vuePauseMains(d) {
  return `<div class="pause-mains"><div class="contenu-pause">
    <div class="grande-e">${d.e}</div><h2>${esc(d.titre)}</h2><p class="texte-defi">${esc(d.defi)}</p>
    <div class="chrono-mains" id="mains-chrono">0:00</div>
    <p class="muet" id="mains-info">Ton temps d’écran est en pause pendant que tu crées (45 minutes au maximum). L’écran t’attend !</p>
    <div class="rang centre-rang"><button class="btn grand" style="background:#F28C28" data-a="mainsFini">J’ai fini ! 📸</button><button class="btn doux" data-a="mainsRevenir">Revenir sans finir</button></div>
  </div></div>`;
}
function vuePhotoMains(d) {
  const ph = MAINS.photo || {};
  const humeur = S.vue.humeur;
  return `<div class="section mains">${entete('📸 ' + d.titre)}
    <div class="photo-mains">
      <div class="ecran-photo"><video id="mains-video" autoplay muted playsinline ${ph.url ? 'hidden' : ''}></video>${ph.url ? `<img src="${ph.url}" alt="Ta création">` : ''}<div class="compte" id="mains-compte"></div><div class="flash" id="mains-flash"></div>
        ${MAINS.erreur && !ph.url ? `<div class="message-cam" style="display:flex">${esc(MAINS.erreur)}</div>` : ''}</div>
      <div class="commandes-photo">
        ${ph.url ? '<button class="btn doux" data-a="mainsReprendre">Recommencer la photo</button>' : '<button class="declencheur" data-a="mainsClic" aria-label="Prendre la photo"><span></span></button><span class="muet centre">Pose ta création devant la caméra. Clic : 3 secondes pour retirer ta main.</span>'}
        ${d.mesure ? `<label class="reglage"><b>${esc(d.mesure.nom)}${d.mesure.unite ? ' (' + esc(d.mesure.unite) + ')' : ''}</b><input class="champ" data-in="mainsMesure" inputmode="numeric" maxlength="12" value="${esc(S.vue.mesure || '')}" placeholder="Ton résultat"></label>` : ''}
        <div class="reglage"><b>Comment ça s’est passé ?</b><div class="humeurs">${HUMEURS_MAINS.map((h) => `<button class="${humeur === h.id ? 'on' : ''}" data-a="mainsHumeur" data-h="${h.id}"><span class="e">${h.e}</span>${esc(h.nom)}</button>`).join('')}</div></div>
        <button class="btn grand" style="background:#2FA36B" data-a="mainsEnregistrer" ${humeur ? '' : 'disabled'}>C’est réussi !</button>
        ${ph.url ? '' : '<button class="lien" data-a="mainsSansPhoto">Pas de photo cette fois</button>'}
      </div></div></div>`;
}
function vuePlacard() {
  const p = placard(); const P = D.catalogue.PLACARD;
  return `<div class="section mains">${entete('🧺 Ce que j’ai à la maison')}
    <p class="muet" style="margin:0">Coche ce qu’on trouve chez toi (demande à un adulte !). Flocon te dira quels défis tu peux faire tout de suite.</p>
    <div class="placard">${Object.entries(P).map(([id, nom]) => `<button class="${p[id] ? 'on' : ''}" data-a="mainsPlacardCocher" data-id="${id}"><span class="case">${p[id] ? '✓' : ''}</span>${esc(nom)}</button>`).join('')}</div>
    <div class="rang"><button class="btn" data-a="mainsPlacardFini">C’est noté !</button></div></div>`;
}

// ---------- Caméra pour la photo ----------
async function camMains() {
  if (MAINS.flux || MAINS.demarre) return; MAINS.demarre = true; MAINS.erreur = '';
  try { MAINS.flux = await navigator.mediaDevices.getUserMedia({ audio: false, video: { width: { ideal: 1280 }, height: { ideal: 960 } } }); } catch (e) { MAINS.erreur = 'Je ne trouve pas de caméra. Tu peux enregistrer ton défi sans photo.'; render(); }
  MAINS.demarre = false;
  const v = document.getElementById('mains-video'); if (v && MAINS.flux) { v.srcObject = MAINS.flux; v.play().catch(() => {}); }
}
function couperCamMains() { if (MAINS.flux) MAINS.flux.getTracks().forEach((t) => t.stop()); MAINS.flux = null; }
function arreterChrono() { if (MAINS.chrono) { clearInterval(MAINS.chrono.iv); MAINS.chrono = null; } }
async function finPause() { arreterChrono(); if (S.seance) await F.demande({ pause: null }); }
function mainsApresRendu() {
  const v = document.getElementById('mains-video');
  if (v) { if (MAINS.flux && v.srcObject !== MAINS.flux) { v.srcObject = MAINS.flux; v.play().catch(() => {}); } if (!MAINS.flux) camMains(); }
  else couperCamMains();
  const c = document.getElementById('mains-chrono');
  if (c && MAINS.chrono) majChrono(); else if (!c && MAINS.chrono) finPause();
}
function majChrono() {
  const c = document.getElementById('mains-chrono'); if (!c || !MAINS.chrono) return;
  const s = Math.floor((Date.now() - MAINS.chrono.debut) / 1000);
  c.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  const i = document.getElementById('mains-info');
  if (i && s >= 45 * 60) i.textContent = 'Ça fait 45 minutes : ton temps d’écran a repris. Viens montrer ta création !';
}
async function prendrePhotoMains() {
  const v = document.getElementById('mains-video'); if (!v || !MAINS.flux || v.readyState < 2 || MAINS.decompte) return;
  MAINS.decompte = true;
  for (let i = 3; i > 0; i--) { const el = document.getElementById('mains-compte'); if (!el) { MAINS.decompte = false; return; } el.textContent = i; el.classList.remove('bat'); void el.offsetWidth; el.classList.add('bat'); await new Promise((ok) => setTimeout(ok, 1000)); }
  MAINS.decompte = false;
  const el = document.getElementById('mains-compte'); if (el) el.textContent = '';
  const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0);
  const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.9));
  MAINS.photo = { octets: new Uint8Array(await blob.arrayBuffer()), url: URL.createObjectURL(blob) };
  couperCamMains(); render();
}

Object.assign(A, {
  mainsCat: (d) => { S.vue.cat = d.c; render(); },
  mainsDuree: (d) => { S.vue.duree = d.d; render(); },
  mainsCeQueJai: () => { S.vue.ceQueJai = !S.vue.ceQueJai; render(); },
  mainsSurprise: () => {
    const p = defis().filter((d) => !placardRempli() || !manquants(d).length); const l = p.length ? p : defis();
    const pasFaits = l.filter((d) => !faitsDe(d.id).length); const choix = (pasFaits.length ? pasFaits : l);
    const d = choix[Math.floor(Math.random() * choix.length)];
    S.vue = { ref: 'mains', id: d.id, depuis: S.vue }; render(); toast('Défi surprise : ' + d.titre + ' !');
  },
  mainsOuvrir: (d) => { S.vue = { ref: 'mains', id: d.id, depuis: S.vue }; render(); },
  mainsCocher: (d) => { S.vue.coche = S.vue.coche || {}; S.vue.coche[d.i] = !S.vue.coche[d.i]; render(); },
  mainsAide: () => { S.vue.aides = (S.vue.aides || 0) + 1; render(); },
  mainsPartir: async () => {
    MAINS.chrono = { debut: Date.now() };
    MAINS.chrono.iv = setInterval(majChrono, 1000);
    if (S.seance) await F.demande({ pause: { sessionId: S.seance.id, debut: new Date().toISOString(), defi: S.vue.id } });
    S.vue = Object.assign({}, S.vue, { pause: true }); render();
  },
  mainsRevenir: async () => { await finPause(); S.vue = Object.assign({}, S.vue, { pause: false }); render(); },
  mainsFini: async () => { await finPause(); MAINS.photo = null; S.vue = Object.assign({}, S.vue, { pause: false, photo: true }); render(); },
  mainsPhoto: () => { MAINS.photo = null; S.vue = Object.assign({}, S.vue, { photo: true }); render(); },
  mainsClic: () => prendrePhotoMains(),
  mainsReprendre: () => { MAINS.photo = null; render(); },
  mainsHumeur: (d) => { S.vue.humeur = d.h; render(); },
  mainsSansPhoto: () => { MAINS.photo = null; couperCamMains(); A.mainsEnregistrer(); },
  mainsEnregistrer: async () => {
    const d = defiDe(S.vue.id); if (!d) return;
    if (!S.vue.humeur) { toast('Dis-moi d’abord comment ça s’est passé.'); return; }
    let photo = '';
    if (MAINS.photo) { const r = await F.creationPhoto('Défi ' + d.titre, MAINS.photo.octets); if (r && r.ok) photo = r.nom; }
    const avant = nbReussis();
    S.profil.defisMains = S.profil.defisMains || {};
    (S.profil.defisMains[d.id] = S.profil.defisMains[d.id] || []).push({ le: new Date().toISOString(), mesure: String(S.vue.mesure || '').trim().slice(0, 12), humeur: S.vue.humeur, photo });
    await F.profil(S.profil);
    MAINS.photo = null; couperCamMains();
    const palier = PALIERS_MAINS.find((p) => avant < p.n && nbReussis() >= p.n);
    S.vue = { ref: 'mains', id: d.id, depuis: S.vue.depuis, bravo: true }; render();
    const z = document.querySelector('.mains'); if (z) z.insertAdjacentHTML('afterbegin', `<div class="panneau bravo-mains">${pluieDeFlocons(30)}<h3>${palier ? palier.e + ' Nouveau titre : ' + esc(palier.nom) + ' !' : '🎉 Bravo !'}</h3><p style="margin:0">${photo ? 'Ta photo est rangée dans ta galerie. ' : ''}Regarde « Encore plus fort » pour aller plus loin.</p></div>`);
  },
  mainsPlacard: () => { S.vue = { ref: 'mains', placard: true, depuis: S.vue }; render(); },
  mainsPlacardCocher: (d) => { S.profil.placard = Object.assign({}, placard(), { [d.id]: !placard()[d.id] }); F.profil(S.profil); render(); },
  mainsPlacardFini: () => { S.vue = Object.assign({}, S.vue.depuis || { ref: 'mains' }, { ceQueJai: true }); render(); }
});
Object.assign(SAISIES, { mainsMesure: (v) => { S.vue.mesure = v; } });
// Retour : du défi vers la liste (en gardant les filtres), et on sort proprement de la pause.
const fermerVueAvantMains = A.fermerVue;
A.fermerVue = async (d) => {
  if (S.vue && S.vue.ref === 'mains') {
    if (S.vue.pause || MAINS.chrono) await finPause();
    couperCamMains(); MAINS.photo = null;
    if (S.vue.photo) { S.vue = Object.assign({}, S.vue, { photo: false }); render(); return; }
    if (S.vue.id || S.vue.placard) { S.vue = S.vue.depuis && !S.vue.depuis.id ? S.vue.depuis : { ref: 'mains' }; render(); return; }
  }
  fermerVueAvantMains(d);
};
