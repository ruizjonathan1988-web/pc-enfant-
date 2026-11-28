'use strict';
// ======================================================================
// MON HISTOIRE À CHOIX (« dont tu es l'héroïne »)
// Des pages, des choix qui mènent à d'autres pages, plusieurs fins.
// Un plan visuel pour ne pas se perdre, un mode « faire jouer »,
// et un livret imprimable où les pages sont mélangées comme dans un vrai livre-jeu.
// Rangé dans Documents, « Mes histoires » (un fichier .json par histoire).
// ======================================================================
/* global S, F, A, SAISIES, esc, entete, toast, render, pluieDeFlocons */

const FINS = { bonne: { e: '🏆', nom: 'Belle fin' }, drole: { e: '😂', nom: 'Fin rigolote' }, mauvaise: { e: '💀', nom: 'Mauvaise fin' } };
const DEBUTS_HISTOIRE = [
  'Dans le grenier, tu découvres une petite porte que tu n’avais jamais vue…',
  'Ce matin, ton chat se met à parler. Il dit : « Vite, on n’a pas beaucoup de temps ! »',
  'Le bus scolaire ne s’arrête pas devant l’école. Il continue… vers la forêt.',
  'Tu trouves une carte au trésor dans un livre de la bibliothèque.',
  'Une fusée atterrit dans le jardin. La porte s’ouvre lentement.',
  'Tu te réveilles et tu mesures… trois centimètres.'
];
const METHODE_HISTOIRE = [
  'Le début : présente ton héroïne, l’endroit, et ce qu’elle veut.',
  'Le premier choix : deux chemins vraiment différents (pas « gauche ou droite » qui mènent au même endroit).',
  'Écris chaque chemin jusqu’à une fin : une belle, une rigolote, une mauvaise…',
  'Relis en jouant : chaque choix doit donner envie de cliquer.',
  'Fais jouer quelqu’un, et regarde quelles fins il trouve.'
];
const HIST = { cle: null, aSupprimer: null, cam: null, picker: null };
const EMOJIS_OBJETS = ['🔑', '🗝️', '🗡️', '🪄', '💎', '🔦', '🗺️', '🍎', '🪙', '📜', '🧪', '🪶'];
const histUrl = (p) => 'file:///' + String(p).replace(/\\/g, '/').replace(/^\//, '').split('/').map(encodeURIComponent).join('/').replace(/^([A-Za-z])%3A/, '$1:');
// Tous les objets qu'on peut trouver dans l'histoire (nom → emoji).
function histObjets(h) { const m = {}; h.pages.forEach((p) => { if (p.objet && p.objet.nom) m[p.objet.nom] = p.objet.e || '🎒'; }); return m; }
const histNomObjet = (o, nom) => (o[nom] || '🎒') + ' ' + nom;
const pageNeuve = (titre) => ({ id: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36), titre: titre || '', texte: '', choix: [], fin: '' });
function histoire() { return (S.docs.histoires || []).find((h) => h.fichier === S.vue.fichier); }
const pageDe = (h, id) => h.pages.find((p) => p.id === id);
function sauverHistoire() {
  const h = histoire(); if (!h) return; h.modifie = new Date().toISOString();
  const { fichier, ...c } = h; clearTimeout(HIST.minuterie); HIST.minuterie = setTimeout(() => F.ecrireDoc('histoires', fichier, c), 500);
}
async function sauverHistoireMaintenant() { clearTimeout(HIST.minuterie); const h = histoire(); if (h) { const { fichier, ...c } = h; await F.ecrireDoc('histoires', fichier, c); } }

// Les pages atteignables depuis le début, rangées par « étage » pour le plan.
function etages(h) {
  const niv = {}; const file = [h.debut]; niv[h.debut] = 0;
  while (file.length) { const id = file.shift(); const p = pageDe(h, id); if (!p || p.fin) continue; for (const c of p.choix) if (c.vers && niv[c.vers] === undefined && pageDe(h, c.vers)) { niv[c.vers] = niv[id] + 1; file.push(c.vers); } }
  return niv;
}
function problemes(h) {
  const niv = etages(h); const l = [];
  for (const p of h.pages) {
    const nom = p.titre || 'Sans titre';
    if (!String(p.texte || '').trim()) l.push({ id: p.id, txt: `« ${nom} » : la page est encore vide.` });
    if (niv[p.id] === undefined) l.push({ id: p.id, txt: `« ${nom} » : aucun choix ne mène à cette page.` });
    if (!p.fin && !p.choix.length) l.push({ id: p.id, txt: `« ${nom} » : pas de choix et pas de fin. Le lecteur est coincé !` });
    if (!p.fin) p.choix.forEach((c, i) => { if (c.requis && !histObjets(h)[c.requis]) l.push({ id: p.id, txt: `« ${nom} » : le choix ${i + 1} demande « ${c.requis} », mais aucune page ne le fait trouver.` }); });
    if (!p.fin) p.choix.forEach((c, i) => { if (!c.vers) l.push({ id: p.id, txt: `« ${nom} » : le choix ${i + 1} ne mène nulle part.` }); else if (!String(c.texte || '').trim()) l.push({ id: p.id, txt: `« ${nom} » : le choix ${i + 1} n’a pas de texte.` }); });
  }
  return l;
}
function planSvg(h, actuelle) {
  const niv = etages(h); const rangs = [];
  h.pages.forEach((p) => { const n = niv[p.id] === undefined ? -1 : niv[p.id]; (rangs[n + 1] = rangs[n + 1] || []).push(p); });
  // ligne 0 : pages perdues (en bas) ; on les met à la fin
  const lignes = rangs.slice(1).filter(Boolean).concat(rangs[0] ? [rangs[0]] : []);
  const L = 150, H = 92, larg = Math.max(...lignes.map((r) => r.length), 1) * L, haut = lignes.length * H;
  const pos = {};
  lignes.forEach((r, y) => r.forEach((p, x) => { pos[p.id] = { x: (larg - r.length * L) / 2 + x * L + L / 2, y: y * H + 40 }; }));
  let traits = '';
  h.pages.forEach((p) => { if (p.fin) return; p.choix.forEach((c) => { const a = pos[p.id], b = pos[c.vers]; if (a && b) traits += `<line x1="${a.x}" y1="${a.y + 22}" x2="${b.x}" y2="${b.y - 24}" marker-end="url(#fleche)"/>`; }); });
  const noeuds = h.pages.map((p) => {
    const q = pos[p.id]; const debut = p.id === h.debut; const perdue = niv[p.id] === undefined;
    const coince = !p.fin && (!p.choix.length || p.choix.some((c) => !c.vers));
    const cls = [debut ? 'debut' : '', p.fin ? 'fin' : '', perdue ? 'perdue' : '', coince ? 'coince' : '', p.id === actuelle ? 'on' : ''].join(' ');
    const lab = (p.fin ? FINS[p.fin].e + ' ' : debut ? '★ ' : '') + (p.titre || 'Sans titre');
    return `<g class="noeud ${cls}" data-a="hPage" data-id="${p.id}" transform="translate(${q.x},${q.y})"><rect x="-66" y="-22" width="132" height="44" rx="12"/><text y="5">${esc(lab.length > 17 ? lab.slice(0, 16) + '…' : lab)}</text></g>`;
  }).join('');
  return `<svg class="plan-histoire" viewBox="0 0 ${larg} ${haut}" style="max-height:${Math.min(520, haut + 20)}px"><defs><marker id="fleche" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z"/></marker></defs><g class="traits">${traits}</g>${noeuds}</svg>`;
}

function vueHistoires() {
  const v = S.vue;
  if (v.fichier && histoire()) return v.jouer ? vueJouerHistoire(histoire()) : vueEditeurHistoire(histoire());
  const l = (S.docs.histoires || []).slice().sort((a, b) => String(b.modifie || '').localeCompare(String(a.modifie || '')));
  return `<div class="section histoires">${entete('Mes histoires à choix')}
    <div class="panneau affiche-histoire"><div class="grow"><h3>Une histoire où le lecteur décide</h3><p class="muet" style="margin:4px 0 10px">Tu écris des pages, et à la fin de chaque page, le lecteur choisit la suite. Plusieurs chemins, plusieurs fins !</p>
      <div class="rang"><input class="champ" data-in="hNouveau" maxlength="60" placeholder="Le titre de ton histoire" value="${esc(v.titre || '')}"><button class="btn" style="background:#7C5CFA" data-a="hCreer">Commencer</button></div></div><div class="grande-e">🗺️</div></div>
    ${l.length ? `<div class="liste">${l.map((h) => { const fins = h.pages.filter((p) => p.fin).length; return `<div class="ligne-histoire"><button class="ligne grow" data-a="hOuvrir" data-f="${esc(h.fichier)}"><span class="grow"><b>${esc(h.titre || 'Sans titre')}</b><br><span class="muet">${h.pages.length} page${h.pages.length > 1 ? 's' : ''} · ${fins} fin${fins > 1 ? 's' : ''}</span></span></button><button class="btn doux petit" data-a="hJouerDirect" data-f="${esc(h.fichier)}">▶ Jouer</button><button class="btn doux petit" data-a="hSupprimer" data-f="${esc(h.fichier)}">${HIST.aSupprimer === h.fichier ? 'Sûr ?' : '🗑'}</button></div>`; }).join('')}</div>` : '<p class="muet">Tes histoires apparaîtront ici.</p>'}</div>`;
}
function vueEditeurHistoire(h) {
  const v = S.vue; const p = pageDe(h, v.page) || pageDe(h, h.debut); v.page = p.id;
  const probs = problemes(h); const fins = h.pages.filter((x) => x.fin).length;
  const options = (sel) => `<option value="">— vers quelle page ? —</option>${h.pages.filter((x) => x.id !== p.id).map((x) => `<option value="${x.id}" ${x.id === sel ? 'selected' : ''}>${esc((x.fin ? FINS[x.fin].e + ' ' : '') + (x.titre || 'Sans titre'))}</option>`).join('')}`;
  const debut = p.id === h.debut;
  return `<div class="section histoires">${entete(h.titre || 'Mon histoire', `<span class="etiquette">${h.pages.length} pages · ${fins} fin${fins > 1 ? 's' : ''}</span><button class="btn petit" style="background:#7C5CFA" data-a="hJouer">▶ Faire jouer</button><button class="btn doux petit" data-a="hImprimer">🖨 Livret</button>`)}
    <div class="studio-histoire">
      <div class="panneau colonne-plan"><div class="rang entre"><h3>Le plan</h3><span class="muet">Touche une page pour l’écrire</span></div>${planSvg(h, p.id)}
        <div class="legende-plan"><span><i class="l-debut"></i>Début</span><span><i class="l-fin"></i>Fin</span><span><i class="l-coince"></i>À compléter</span><span><i class="l-perdue"></i>Page perdue</span></div>
        ${h.pages.length <= 2 ? `<div class="encadre-adulte"><b>Ta méthode</b><ol class="methode">${METHODE_HISTOIRE.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>` : ''}
        ${probs.length ? `<div class="problemes"><b>Avant de faire jouer (${probs.length})</b>${probs.slice(0, 6).map((x) => `<button class="lien-probleme" data-a="hPage" data-id="${x.id}">${esc(x.txt)}</button>`).join('')}</div>` : '<p class="bien">✓ Tout est relié : ton histoire est jouable !</p>'}
      </div>
      <div class="panneau colonne-page">
        <div class="rang entre"><span class="etiquette">${debut ? '★ Première page' : p.fin ? FINS[p.fin].e + ' ' + FINS[p.fin].nom : 'Page'}</span>${debut ? '' : `<button class="btn doux petit" data-a="hEffacerPage">${HIST.pageASupprimer === p.id ? 'Sûr ? Elle sera effacée' : '🗑 Effacer la page'}</button>`}</div>
        <input class="champ titre-texte" data-in="hTitrePage" maxlength="40" value="${esc(p.titre)}" placeholder="Le nom de la page (pour toi), ex. : La porte du grenier">
        <textarea class="champ page-histoire" data-in="hTexte" placeholder="${debut ? esc(h.idee || 'Il était une fois…') : 'Que se passe-t-il ?'}">${esc(p.texte)}</textarea>
        ${histImageEdit(p)}
        ${histObjetEdit(p)}
        ${debut && !String(p.texte).trim() ? `<div class="rang"><span class="muet">Une idée pour démarrer ?</span><button class="btn doux petit" data-a="hIdee">🎲 Donne-moi un début</button></div>` : ''}
        <div class="rang fins-choix"><span class="muet">Cette page est…</span><button class="puce ${!p.fin ? 'on' : ''}" data-a="hFin" data-f="">une page avec des choix</button>${debut ? '' : Object.entries(FINS).map(([k, f]) => `<button class="puce ${p.fin === k ? 'on' : ''}" data-a="hFin" data-f="${k}">${f.e} ${esc(f.nom)}</button>`).join('')}</div>
        ${p.fin ? '<p class="muet" style="margin:0">C’est une fin : le lecteur pourra recommencer pour trouver les autres.</p>' : `<h3>Les choix du lecteur</h3>
        <div class="liste-choix">${p.choix.map((c, i) => `<div class="choix-edit"><span class="num">${i + 1}</span><input class="champ" data-in="hChoixTexte" data-i="${i}" maxlength="80" value="${esc(c.texte)}" placeholder="Ce que le lecteur peut faire, ex. : Ouvrir la porte"><select class="champ" data-in="hChoixVers" data-i="${i}">${options(c.vers)}</select>${Object.keys(histObjets(h)).length ? `<select class="champ h-condition" data-in="hChoixRequis" data-i="${i}" title="Condition"><option value="">pour tout le monde</option>${Object.entries(histObjets(h)).map(([n, e]) => `<option value="${esc(n)}" ${c.requis === n ? 'selected' : ''}>seulement avec ${e} ${esc(n)}</option>`).join('')}</select>` : ''}${c.vers ? `<button class="btn doux petit" data-a="hPage" data-id="${c.vers}">Écrire →</button>` : `<button class="btn petit" data-a="hCreerSuite" data-i="${i}">Nouvelle page</button>`}<button class="btn doux petit" data-a="hEnleverChoix" data-i="${i}" aria-label="Enlever">✕</button></div>`).join('')}</div>
        ${p.choix.length < 4 ? '<button class="btn doux" data-a="hAjouterChoix">+ Ajouter un choix</button>' : ''}`}
      </div></div>${HIST.cam ? `<div class="voile-bd"><div class="panneau cam-bd"><h3>📷 Photographie ton dessin</h3><p class="muet" style="margin:0">Pose ton dessin bien à plat, éclairé, et remplis l’écran avec lui.</p><div class="ecran-photo"><video id="h-video" autoplay muted playsinline></video><div class="compte" id="h-compte"></div></div><div class="rang"><button class="btn grand" style="background:#7C5CFA" data-a="hClic">Clic !</button><button class="btn doux" data-a="hCamFermer">Annuler</button></div></div></div>` : ''}</div>`;
}
function histImageEdit(p) {
  return `<div class="h-bloc"><div class="rang entre"><b>🖼 Une image pour cette page</b><span class="rang">${p.image ? '<button class="btn doux petit" data-a="hSansImage">Enlever</button>' : ''}<button class="btn doux petit" data-a="hImages">${HIST.picker ? 'Fermer' : 'Mes images'}</button><button class="btn doux petit" data-a="hCam">📷 Mon dessin</button></span></div>
    ${p.image ? `<img class="h-image" src="${esc(histUrl(p.image))}" alt="">` : '<span class="muet">Facultatif : un dessin à toi rend ton histoire encore plus belle.</span>'}
    ${HIST.picker ? `<div class="choix-photos">${HIST.picker.map((f) => `<button data-a="hChoisirImage" data-c="${esc(f.chemin)}"><img src="${esc(f.url)}" alt="" loading="lazy"></button>`).join('') || '<p class="muet">Pas encore d’image.</p>'}</div>` : ''}</div>`;
}
function histObjetEdit(p) {
  if (p.fin) return '';
  const o = p.objet;
  return `<div class="h-bloc"><div class="rang entre"><b>🎒 Le lecteur trouve un objet ici ?</b>${o ? '<button class="btn doux petit" data-a="hSansObjet">Pas d’objet</button>' : '<button class="btn doux petit" data-a="hObjet">+ Un objet</button>'}</div>
    ${o ? `<div class="rang wrap">${EMOJIS_OBJETS.map((e) => `<button class="puce ${o.e === e ? 'on' : ''}" data-a="hObjetEmoji" data-e="${e}">${e}</button>`).join('')}</div><input class="champ" data-in="hObjetNom" maxlength="30" value="${esc(o.nom)}" placeholder="Son nom, ex. : la clé dorée"><span class="muet">Ensuite, sur un choix d’une autre page, tu pourras écrire « seulement avec » cet objet.</span>` : ''}</div>`;
}
function vueJouerHistoire(h) {
  const v = S.vue; const p = pageDe(h, v.lecture || h.debut) || pageDe(h, h.debut);
  const trouvees = new Set(v.finsTrouvees || []); const total = h.pages.filter((x) => x.fin).length;
  const sac = v.sac || []; const objets = histObjets(h);
  return `<div class="section histoires">${entete('▶ ' + (h.titre || 'Mon histoire'), `<span class="etiquette">${trouvees.size} fin${trouvees.size > 1 ? 's' : ''} trouvée${trouvees.size > 1 ? 's' : ''} sur ${total}</span><button class="btn doux petit" data-a="hEcrire">✏️ Retour à l’écriture</button>`)}
    <div class="livre-jeu">
      ${sac.length ? `<div class="sac-jeu">🎒 Mon sac : ${sac.map((n) => `<span class="etiquette">${esc(histNomObjet(objets, n))}</span>`).join('')}</div>` : ''}
      ${p.image ? `<img class="h-image-jeu" src="${esc(histUrl(p.image))}" alt="">` : ''}
      <div class="page-jeu">${String(p.texte || '').trim() ? String(p.texte).split(/\n+/).map((x) => `<p>${esc(x)}</p>`).join('') : '<p class="muet">(Cette page n’est pas encore écrite.)</p>'}</div>
      ${p.fin ? `<div class="fin-jeu"><span class="grande-e">${FINS[p.fin].e}</span><h3>${esc(FINS[p.fin].nom)}</h3>${trouvees.size >= total && total > 1 ? '<p>Bravo, toutes les fins sont trouvées !</p>' : '<p>D’autres fins t’attendent…</p>'}<button class="btn" style="background:#7C5CFA" data-a="hRecommencer">Recommencer</button></div>`
        : `${p.objet && p.objet.nom ? `<div class="trouve-jeu">✨ Tu as trouvé : <b>${esc(histNomObjet(objets, p.objet.nom))}</b> ! Il est dans ton sac.</div>` : ''}<div class="choix-jeu">${p.choix.filter((c) => c.vers).map((c, i) => { const ok = !c.requis || sac.includes(c.requis); return `<button data-a="${ok ? 'hChoisir' : 'hBloque'}" data-id="${c.vers}" class="${ok ? '' : 'bloque'}" ${ok ? '' : `title="Il te faut ${esc(c.requis)}"`}><span class="num">${ok ? i + 1 : '🔒'}</span><span>${esc(c.texte || '…')}${ok ? '' : `<br><small>Il te faut ${esc(histNomObjet(objets, c.requis))}</small>`}</span></button>`; }).join('') || '<p class="muet">Aucun choix ici pour l’instant.</p>'}</div>`}
      ${(v.chemin || []).length ? '<button class="lien" data-a="hRetour">↶ Revenir à la page d’avant</button>' : ''}
    </div></div>`;
}

// Livret : pages mélangées et numérotées, « si tu choisis… va au 12 ».
function livretHistoire(h) {
  const autres = h.pages.filter((p) => p.id !== h.debut); const r = []; for (const p of autres) r.splice(Math.floor(Math.random() * (r.length + 1)), 0, p);
  const ordre = [pageDe(h, h.debut)].concat(r); const num = {}; ordre.forEach((p, i) => { num[p.id] = i + 1; });
  const objets = histObjets(h); const noms = Object.keys(objets);
  const pages = ordre.map((p) => `<section class="pg"><div class="n">${num[p.id]}</div>${p.image ? `<img class="ill" src="${esc(histUrl(p.image))}">` : ''}${String(p.texte || '').split(/\n+/).map((x) => `<p>${esc(x)}</p>`).join('')}
    ${p.objet && p.objet.nom && !p.fin ? `<div class="obj">🎒 Tu trouves ${esc(histNomObjet(objets, p.objet.nom))} ! Coche-le dans « Mon sac », à la page 1.</div>` : ''}
    ${num[p.id] === 1 && noms.length ? `<div class="sac"><b>🎒 Mon sac</b>${noms.map((n) => `<span>☐ ${esc(histNomObjet(objets, n))}</span>`).join('')}</div>` : ''}
    ${p.fin ? `<div class="fin">${FINS[p.fin].e} ${esc(FINS[p.fin].nom)}</div>` : `<ul>${p.choix.filter((c) => c.vers).map((c) => `<li>${c.requis ? `<i>Si tu as ${esc(histNomObjet(objets, c.requis))}</i> : ` : ''}${esc(c.texte || '…')} : <b>va au ${num[c.vers]}</b></li>`).join('')}</ul>`}</section>`).join('');
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><style>
    @page{size:A5;margin:0} body{margin:0;font-family:Georgia,'Times New Roman',serif;color:#222}
    .couv{height:210mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:#2A1B5C;color:#fff;page-break-after:always}
    .couv h1{font-size:30pt;margin:0 12mm} .couv p{font-size:13pt;opacity:.85}
    .regle{padding:14mm;font-size:12pt;page-break-after:always} .pg{min-height:180mm;padding:14mm 14mm 10mm;page-break-after:always;font-size:12.5pt;line-height:1.5}
    .n{font-size:26pt;font-weight:bold;color:#7C5CFA;border-bottom:2px solid #7C5CFA;margin-bottom:6mm;width:20mm}
    .ill{display:block;max-width:100%;max-height:70mm;margin:0 auto 5mm;border-radius:3mm}.obj{margin-top:5mm;padding:3mm 4mm;background:#FFF4D6;border-radius:3mm}.sac{margin-top:6mm;padding:3mm 4mm;border:2px dashed #7C5CFA;border-radius:3mm;display:flex;flex-wrap:wrap;gap:3mm 6mm}.sac b{width:100%}
    ul{list-style:none;padding:0;margin-top:8mm} li{margin:3mm 0;padding:3mm 4mm;border:1.5px solid #ccc;border-radius:4mm} .fin{margin-top:10mm;font-size:16pt;font-weight:bold;text-align:center}
  </style></head><body><div class="couv"><h1>${esc(h.titre || 'Mon histoire')}</h1><p>Une histoire dont tu es l’héroïne<br>de ${esc((S.profil && S.profil.prenom) || '')}</p></div>
  <div class="regle"><h2>Comment lire ce livre</h2><p>Ne lis pas les pages dans l’ordre ! Commence au 1. À la fin de chaque page, choisis ce que tu fais et va à la page indiquée.</p><p>Il y a ${h.pages.filter((p) => p.fin).length} fins différentes. Sauras-tu toutes les trouver ?</p>${noms.length ? '<p>🎒 En chemin, tu vas trouver des objets : coche-les dans « Mon sac », à la page 1. Certains choix ne sont possibles que si tu as le bon objet !</p>' : ''}</div>${pages}</body></html>`;
}

Object.assign(A, {
  hCreer: async () => {
    const titre = String(S.vue.titre || '').trim() || 'Mon histoire';
    const p = pageNeuve('Le début'); const fichier = 'h-' + Date.now().toString(36) + '.json';
    const h = { titre, debut: p.id, pages: [p], cree: new Date().toISOString(), modifie: new Date().toISOString() };
    await F.ecrireDoc('histoires', fichier, h); S.docs.histoires = await F.listerDocs('histoires');
    S.vue = { ref: 'histoires', fichier, page: p.id }; render();
  },
  hOuvrir: (d) => { S.vue = { ref: 'histoires', fichier: d.f }; render(); },
  hJouerDirect: (d) => { S.vue = { ref: 'histoires', fichier: d.f, jouer: true, chemin: [], finsTrouvees: [] }; S.vue.sac = histSacDepart(); render(); },
  hSupprimer: async (d) => {
    if (HIST.aSupprimer !== d.f) { HIST.aSupprimer = d.f; render(); setTimeout(() => { if (HIST.aSupprimer === d.f) { HIST.aSupprimer = null; render(); } }, 4000); return; }
    HIST.aSupprimer = null; await F.effacerDoc('histoires', d.f); S.docs.histoires = await F.listerDocs('histoires'); render();
  },
  hPage: (d) => { S.vue.page = d.id; HIST.pageASupprimer = null; render(); const t = document.querySelector('[data-in="hTexte"]'); if (t) t.focus(); },
  hIdee: () => { const h = histoire(); h.idee = DEBUTS_HISTOIRE[Math.floor(Math.random() * DEBUTS_HISTOIRE.length)]; const p = pageDe(h, S.vue.page); p.texte = h.idee + '\n'; sauverHistoire(); render(); },
  hFin: (d) => { const p = pageDe(histoire(), S.vue.page); p.fin = d.f; sauverHistoire(); render(); },
  hAjouterChoix: () => { const p = pageDe(histoire(), S.vue.page); if (p.choix.length < 4) p.choix.push({ texte: '', vers: '' }); sauverHistoire(); render(); const l = document.querySelectorAll('[data-in="hChoixTexte"]'); if (l.length) l[l.length - 1].focus(); },
  hEnleverChoix: (d) => { const p = pageDe(histoire(), S.vue.page); p.choix.splice(Number(d.i), 1); sauverHistoire(); render(); },
  hCreerSuite: (d) => {
    const h = histoire(); const p = pageDe(h, S.vue.page); const c = p.choix[Number(d.i)];
    const n = pageNeuve(String(c.texte || '').trim().slice(0, 40) || 'Nouvelle page'); h.pages.push(n); c.vers = n.id;
    sauverHistoire(); toast('Nouvelle page créée. Écris-la quand tu veux, en la touchant sur le plan.'); render();
  },
  hEffacerPage: () => {
    const h = histoire(); const id = S.vue.page; if (id === h.debut) return;
    if (HIST.pageASupprimer !== id) { HIST.pageASupprimer = id; render(); return; }
    h.pages = h.pages.filter((p) => p.id !== id); h.pages.forEach((p) => p.choix.forEach((c) => { if (c.vers === id) c.vers = ''; }));
    HIST.pageASupprimer = null; S.vue.page = h.debut; sauverHistoire(); render();
  },
  hJouer: async () => { await sauverHistoireMaintenant(); Object.assign(S.vue, { jouer: true, lecture: null, chemin: [], sac: histSacDepart(), finsTrouvees: S.vue.finsTrouvees || [] }); render(); },
  hEcrire: () => { S.vue.jouer = false; render(); },
  hChoisir: (d) => {
    const v = S.vue; v.chemin = (v.chemin || []).concat([{ page: v.lecture || histoire().debut, sac: (v.sac || []).slice() }]); v.lecture = d.id;
    const pg = pageDe(histoire(), d.id); if (pg && pg.objet && pg.objet.nom && !(v.sac || []).includes(pg.objet.nom)) v.sac = (v.sac || []).concat([pg.objet.nom]);
    const p = pageDe(histoire(), d.id); if (p && p.fin && !(v.finsTrouvees || []).includes(p.id)) { v.finsTrouvees = (v.finsTrouvees || []).concat([p.id]); }
    render(); window.scrollTo(0, 0);
    if (p && p.fin === 'bonne') { const z = document.querySelector('.fin-jeu'); if (z) z.insertAdjacentHTML('afterbegin', pluieDeFlocons(24)); }
  },
  hRetour: () => { const v = S.vue; const e = (v.chemin || []).pop(); if (e && typeof e === 'object') { v.lecture = e.page; v.sac = e.sac; } else v.lecture = e || null; render(); },
  hRecommencer: () => { Object.assign(S.vue, { lecture: null, chemin: [], sac: histSacDepart() }); render(); },
  hBloque: () => toast('Il te manque un objet. Cherche-le dans une autre partie de l’histoire !'),
  hObjet: () => { const p = pageDe(histoire(), S.vue.page); p.objet = { e: '🔑', nom: '' }; sauverHistoire(); render(); const t = document.querySelector('[data-in="hObjetNom"]'); if (t) t.focus(); },
  hSansObjet: () => { const p = pageDe(histoire(), S.vue.page); delete p.objet; sauverHistoire(); render(); },
  hObjetEmoji: (d) => { const p = pageDe(histoire(), S.vue.page); p.objet.e = d.e; sauverHistoire(); render(); },
  hImages: async () => {
    if (HIST.picker) { HIST.picker = null; render(); return; }
    const [cr, ph, de] = await Promise.all([F.creations(), F.photos(), F.animDecors()]);
    HIST.picker = (cr || []).filter((f) => f.type === 'image').concat(ph || [], (de || []).filter((f) => f.origine === 'flocon')); render();
  },
  hChoisirImage: (d) => { pageDe(histoire(), S.vue.page).image = d.c; HIST.picker = null; sauverHistoire(); render(); },
  hSansImage: () => { delete pageDe(histoire(), S.vue.page).image; sauverHistoire(); render(); },
  hCam: () => { HIST.cam = {}; render(); },
  hCamFermer: () => { histCouperCam(); render(); },
  hClic: async () => {
    const v = document.getElementById('h-video'); if (!v || v.readyState < 2) return;
    for (let i = 3; i > 0; i--) { const el = document.getElementById('h-compte'); if (el) { el.textContent = i; el.classList.remove('bat'); void el.offsetWidth; el.classList.add('bat'); } await new Promise((ok) => setTimeout(ok, 800)); }
    const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0);
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.92));
    const r = await F.creationPhoto('Histoire ' + (histoire().titre || ''), new Uint8Array(await blob.arrayBuffer()), 'jpg');
    histCouperCam(); if (r && r.ok) { pageDe(histoire(), S.vue.page).image = r.chemin; sauverHistoire(); } render();
  },
  hImprimer: async () => {
    const h = histoire(); const probs = problemes(h);
    if (probs.length) { toast('Il reste ' + probs.length + ' chose' + (probs.length > 1 ? 's' : '') + ' à compléter (regarde sous le plan). Je fais quand même le livret.', 6000); }
    await sauverHistoireMaintenant();
    const r = await F.fairePdf(h.titre || 'Mon histoire', livretHistoire(h), { format: 'A5', imprimer: true });
    toast(r && r.ok ? 'Ton livret est prêt : il part à l’imprimante, et il est aussi dans Mes créations.' : 'Je n’ai pas pu fabriquer le livret.', 6000);
  }
});
Object.assign(SAISIES, {
  hNouveau: (v) => { S.vue.titre = v; },
  hTitrePage: (v) => { pageDe(histoire(), S.vue.page).titre = v; sauverHistoire(); },
  hTexte: (v) => { pageDe(histoire(), S.vue.page).texte = v; sauverHistoire(); },
  hChoixTexte: (v, el) => { pageDe(histoire(), S.vue.page).choix[Number(el.dataset.i)].texte = v; sauverHistoire(); },
  hChoixRequis: (v, el) => { pageDe(histoire(), S.vue.page).choix[Number(el.dataset.i)].requis = v; sauverHistoire(); render(); },
  hObjetNom: (v) => {
    const h = histoire(); const o = pageDe(h, S.vue.page).objet; const avant = o.nom; o.nom = v.trim();
    // Si on renomme l'objet, les choix qui le demandaient suivent.
    if (avant && avant !== o.nom && !h.pages.some((p) => p.objet && p.objet !== o && p.objet.nom === avant)) h.pages.forEach((p) => p.choix.forEach((c) => { if (c.requis === avant) c.requis = o.nom; }));
    sauverHistoire();
  },
  hChoixVers: (v, el) => { pageDe(histoire(), S.vue.page).choix[Number(el.dataset.i)].vers = v; sauverHistoire(); render(); }
});
// Retour : du jeu vers l'écriture, de l'écriture vers la liste.
const fermerVueAvantHistoires = A.fermerVue;
A.fermerVue = async (d) => {
  if (S.vue && S.vue.ref === 'histoires' && S.vue.fichier) {
    histCouperCam(); HIST.picker = null;
    if (S.vue.jouer) { S.vue.jouer = false; render(); return; }
    await sauverHistoireMaintenant(); S.vue = { ref: 'histoires' }; S.docs.histoires = await F.listerDocs('histoires'); render(); return;
  }
  fermerVueAvantHistoires(d);
};

// La première page peut déjà donner un objet.
function histSacDepart() { const h = histoire(); const p = h && pageDe(h, h.debut); return p && p.objet && p.objet.nom ? [p.objet.nom] : []; }
async function histCam() {
  if (!HIST.cam || HIST.cam.flux || HIST.cam.demarre) return; HIST.cam.demarre = true;
  try { HIST.cam.flux = await navigator.mediaDevices.getUserMedia({ audio: false, video: { width: { ideal: 1920 }, height: { ideal: 1440 } } }); } catch (e) { toast('Je ne trouve pas de caméra.'); HIST.cam = null; render(); return; }
  const v = document.getElementById('h-video'); if (v) { v.srcObject = HIST.cam.flux; v.play().catch(() => {}); }
}
function histCouperCam() { if (HIST.cam && HIST.cam.flux) HIST.cam.flux.getTracks().forEach((t) => t.stop()); HIST.cam = null; }
// Pas d'accès à apresRendu : on surveille le DOM pour brancher/couper la caméra.
new MutationObserver(() => {
  const v = document.getElementById('h-video');
  if (v && HIST.cam) { if (HIST.cam.flux && v.srcObject !== HIST.cam.flux) { v.srcObject = HIST.cam.flux; v.play().catch(() => {}); } else if (!HIST.cam.flux) histCam(); }
  else if (!v && HIST.cam && HIST.cam.flux) histCouperCam();
}).observe(document.documentElement, { childList: true, subtree: true });
(() => { const st = document.createElement('style'); st.textContent = `
.h-bloc{display:flex;flex-direction:column;gap:8px;background:rgba(124,92,250,.06);border-radius:14px;padding:10px 12px}
.h-image{max-height:160px;max-width:100%;align-self:flex-start;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,.15)}
.h-image-jeu{max-height:300px;max-width:100%;align-self:center;border-radius:14px;box-shadow:0 10px 24px rgba(60,40,10,.2)}
.h-condition{max-width:220px;font-size:13px}
.choix-edit{display:flex;flex-wrap:wrap}.choix-edit>input{flex:1 1 220px}.choix-edit>select{flex:0 1 190px}
.sac-jeu{display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-weight:700}
.trouve-jeu{background:#FFF4D6;border-radius:14px;padding:10px 14px;font-weight:600}
.choix-jeu button.bloque{opacity:.55;cursor:not-allowed;box-shadow:none;background:#f1f1f4}
.choix-jeu button.bloque:hover{transform:none}
`; document.head.appendChild(st); })();
