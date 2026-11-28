'use strict';
// ======================================================================
// MA BD : le papier d'abord.
// On imprime des planches vides (cases + bulles) pour dessiner au crayon,
// on photographie ses planches finies pour les ranger dans l'album,
// ou on compose à l'écran avec ses photos, ses dessins et ses images de films.
// L'album s'imprime en livret. Rangé dans Documents, « Mes BD ».
// ======================================================================
/* global S, F, A, SAISIES, esc, entete, toast, render */

const GABARITS = {
  g1: { nom: 'Une grande case', zones: ['a'] },
  g2: { nom: '2 bandes', zones: ['a', 'b'] },
  g3: { nom: '3 bandes', zones: ['a', 'b', 'c'] },
  g3b: { nom: '1 grande + 2', zones: ['a a', 'b c'] },
  g4: { nom: '4 cases', zones: ['a b', 'c d'] },
  g5: { nom: '1 grande + 4', zones: ['a a', 'b c', 'd e'] },
  g6: { nom: '6 cases (classique)', zones: ['a b', 'c d', 'e f'] }
};
const TYPES_BULLES = { parole: 'Parole', pensee: 'Pensée', cri: 'Cri !', recit: 'Récit' };
const BD_POINTES = [['hg', '↖'], ['hd', '↗'], ['g', '←'], ['d', '→'], ['bg', '↙'], ['bd', '↘']];
const BD_TAILLES = [['p', 'Petit'], ['m', 'Moyen'], ['g', 'Grand']];
const BD_EFFETS = [['BOUM !', '#E53935'], ['PAF !', '#FF9800'], ['ZZZ…', '#5C6BC0'], ['SPLASH !', '#1E88E5'], ['VROUM !', '#43A047'], ['AÏE !', '#D81B60'], ['WOUAH !', '#8E24AA'], ['CRAC !', '#6D4C41'], ['SNIF…', '#039BE5'], ['HI HI !', '#F4511E']];
// Valeurs par défaut : les albums déjà enregistrés n'ont ni cadrage, ni pointe, ni taille.
const bdCadrage = (c) => Object.assign({ z: 1, x: 50, y: 50 }, (c && c.cadrage) || {});
function bdStyleImage(c) { const k = bdCadrage(c); return `object-position:${k.x}% ${k.y}%;transform:scale(${k.z});transform-origin:${k.x}% ${k.y}%`; }
const METHODE_BD = [
  'Raconte ton histoire en 3 phrases : le début, le problème, la fin.',
  'Découpe-la en cases : une action par case.',
  'Dessine au crayon sur des planches imprimées… ou utilise tes photos et tes dessins.',
  'Ajoute les bulles : des phrases courtes, c’est plus drôle.',
  'Imprime ton album et fais-le lire !'
];
const BD = { cam: null, picker: null, glisse: null, cadre: null, effets: false, aSupprimer: null };
const nbCases = (g) => new Set(GABARITS[g].zones.join(' ').split(' ')).size;
const lettres = (g) => [...new Set(GABARITS[g].zones.join(' ').split(' '))];
const versUrlFichier = (p) => 'file:///' + String(p).replace(/\\/g, '/').replace(/^\//, '').split('/').map(encodeURIComponent).join('/').replace(/^([A-Za-z])%3A/, '$1:');
function album() { return (S.docs.bd || []).find((x) => x.fichier === S.vue.fichier); }
function planche() { const a = album(); return a && a.planches[S.vue.planche]; }
function sauverAlbum() { const a = album(); if (!a) return; a.modifie = new Date().toISOString(); const { fichier, ...c } = a; clearTimeout(BD.minuterie); BD.minuterie = setTimeout(() => F.ecrireDoc('bd', fichier, c), 500); }
async function sauverAlbumMaintenant() { clearTimeout(BD.minuterie); const a = album(); if (a) { const { fichier, ...c } = a; await F.ecrireDoc('bd', fichier, c); } }
const planchePapier = (g) => ({ type: 'cases', gabarit: g, cases: lettres(g).map(() => ({ img: null, bulles: [] })) });

// Une planche en HTML : utilisée à l'écran et pour le PDF (mêmes règles CSS).
function plancheHtml(p, opts) {
  const o = opts || {};
  if (p.type === 'photo') return `<div class="planche photo"><img src="${esc(versUrlFichier(p.chemin))}" alt=""></div>`;
  const g = GABARITS[p.gabarit]; const ls = lettres(p.gabarit);
  const areas = g.zones.map((z) => `'${z}'`).join(' ');
  const rangs = g.zones.length, cols = g.zones[0].split(' ').length;
  return `<div class="planche" style="grid-template-areas:${areas};grid-template-rows:repeat(${rangs},minmax(0,1fr));grid-template-columns:repeat(${cols},minmax(0,1fr))">${ls.map((l, i) => { const c = p.cases[i] || { bulles: [] };
    return `<div class="vignette-bd ${o.edition && S.vue.casesel === i ? 'on' : ''}" style="grid-area:${l}" ${o.edition ? `data-a="bdCase" data-i="${i}"` : ''}>${c.img ? `<img src="${esc(versUrlFichier(c.img))}" alt="" style="${bdStyleImage(c)}" ${o.edition && S.vue.casesel === i ? `data-cadrer="${i}" draggable="false"` : ''}>` : ''}
      ${(c.bulles || []).map((b, k) => `<div class="bulle t-${b.type} q-${b.queue || 'bg'} s-${b.taille || 'm'} ${o.vide ? 'a-remplir' : ''} ${o.edition && S.vue.casesel === i && S.vue.bullesel === k ? 'on' : ''}" style="left:${b.x}%;top:${b.y}%${b.type === 'effet' ? `;color:${b.couleur || '#E53935'};transform:rotate(${Number(b.angle) || -6}deg)` : ''}" ${o.edition ? `data-bulle="${i}-${k}" data-a="bdSelBulle"` : ''}>${esc(b.texte || '') || (o.vide ? '&nbsp;' : o.edition ? '<span class="muet">…</span>' : '')}</div>`).join('')}</div>`; }).join('')}</div>`;
}
const CSS_PLANCHE = `.planche{display:grid;gap:3.5%;padding:4%;background:#fff;aspect-ratio:210/297;box-sizing:border-box;grid-auto-rows:1fr;grid-auto-columns:1fr;container-type:inline-size}
.planche .vignette-bd{position:relative;border:3px solid #1b1b1b;border-radius:2px;overflow:hidden;background:#fff;min-height:0}
.planche .vignette-bd img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.planche.photo{padding:0;display:block}.planche.photo img{width:100%;height:100%;object-fit:contain}
.bulle{position:absolute;max-width:62%;min-width:16%;min-height:1.6em;padding:.45em .75em;background:#fff;border:2px solid #1b1b1b;font:700 2.5cqw/1.25 'Comic Sans MS','Comic Neue','Outfit',sans-serif;color:#111;box-sizing:border-box;text-align:center}
.bulle.t-parole{border-radius:50%/40%}
.bulle.t-parole::after{content:'';position:absolute;left:22%;bottom:-12px;border:7px solid transparent;border-top:12px solid #1b1b1b;border-bottom:0}
.bulle.t-parole.q-bd::after{left:auto;right:22%}
.bulle.t-parole.q-hg::after,.bulle.t-parole.q-hd::after{bottom:auto;top:-12px;border-top:0;border-bottom:12px solid #1b1b1b}
.bulle.t-parole.q-hd::after{left:auto;right:22%}
.bulle.t-parole.q-g::after{bottom:auto;top:calc(50% - 7px);left:-12px;border:7px solid transparent;border-right:12px solid #1b1b1b;border-left:0}
.bulle.t-parole.q-d::after{bottom:auto;top:calc(50% - 7px);left:auto;right:-12px;border:7px solid transparent;border-left:12px solid #1b1b1b;border-right:0}
.bulle.t-pensee{border-radius:40px;border-style:dotted;border-width:3px}
.bulle.t-pensee::after{content:'';position:absolute;left:18%;bottom:-14px;width:9px;height:9px;border:2px solid #1b1b1b;border-radius:50%;background:#fff}
.bulle.t-pensee.q-bd::after{left:auto;right:18%}
.bulle.t-pensee.q-hg::after,.bulle.t-pensee.q-hd::after{bottom:auto;top:-14px}.bulle.t-pensee.q-hd::after{left:auto;right:18%}
.bulle.t-pensee.q-g::after{bottom:auto;top:calc(50% - 6px);left:-14px}.bulle.t-pensee.q-d::after{bottom:auto;top:calc(50% - 6px);left:auto;right:-14px}
.bulle.s-p{font-size:2cqw}.bulle.s-g{font-size:3.3cqw}
.bulle.t-effet{background:none;border:0;min-width:0;max-width:none;padding:0;font:900 5.8cqw/1 Impact,'Arial Black','Outfit',sans-serif;letter-spacing:1px;white-space:nowrap;-webkit-text-stroke:1.5px #1b1b1b;text-shadow:3px 3px 0 #1b1b1b}
.bulle.t-effet.s-p{font-size:3.8cqw}.bulle.t-effet.s-g{font-size:8.5cqw}
.bulle.t-cri{border-radius:4px;border-width:3px;font-size:2.9cqw;text-transform:uppercase;transform:rotate(-4deg);background:#FFF36B}
.bulle.t-cri.s-p{font-size:2.3cqw}.bulle.t-cri.s-g{font-size:3.8cqw}
.bulle.a-remplir{min-width:46%;min-height:22%}
.bulle.t-recit{border-radius:0;background:#FFF4C2;text-align:left;font-style:italic;font-weight:600}`;

function vueBD() {
  const v = S.vue;
  if (v.fichier && album()) return v.planche !== undefined && planche() ? vuePlancheBD(album(), planche()) : vueAlbumBD(album());
  const l = (S.docs.bd || []).slice().sort((a, b) => String(b.modifie || '').localeCompare(String(a.modifie || '')));
  return `<div class="section bd">${entete('Ma BD')}
    <div class="panneau affiche-bd"><div class="grow"><h3>Une BD, au crayon d’abord</h3><p class="muet" style="margin:4px 0 10px">Imprime des planches vides, dessine sur papier, puis photographie tes planches pour faire ton album. Tu peux aussi composer à l’écran avec tes photos et tes dessins.</p>
      <div class="rang"><input class="champ" data-in="bdNouveau" maxlength="60" placeholder="Le titre de ta BD" value="${esc(v.titre || '')}"><button class="btn" style="background:#E0457B" data-a="bdCreer">Nouvel album</button><button class="btn doux" data-a="bdVidesDirect">🖨 Juste des planches vides</button></div></div><div class="grande-e">💬</div></div>
    ${l.length ? `<div class="grille-albums">${l.map((a) => `<div class="carte-album"><button data-a="bdOuvrir" data-f="${esc(a.fichier)}"><div class="mini">${a.planches[0] ? plancheHtml(a.planches[0]) : '<div class="planche vide"></div>'}</div><b>${esc(a.titre)}</b><span class="muet">${a.planches.length} planche${a.planches.length > 1 ? 's' : ''}</span></button><button class="film-jeter" data-a="bdSupprimer" data-f="${esc(a.fichier)}">${BD.aSupprimer === a.fichier ? 'Sûr ?' : '🗑'}</button></div>`).join('')}</div>` : ''}
    ${vuePlanchesVides()}</div>`;
}
function vuePlanchesVides() {
  const v = S.vue; const g = v.videG || 'g6';
  if (!v.vides) return '';
  return `<div class="panneau"><h3>Planches vides à imprimer</h3><p class="muet" style="margin:0">Choisis le découpage. Les bulles vides sont facultatives : tu peux aussi les dessiner toi-même.</p>
    <div class="gabarits">${Object.entries(GABARITS).map(([k, x]) => `<button class="${g === k ? 'on' : ''}" data-a="bdVideG" data-g="${k}"><div class="mini">${plancheHtml(planchePapier(k))}</div><span>${esc(x.nom)}</span></button>`).join('')}</div>
    <div class="rang"><button class="puce ${v.videBulles ? 'on' : ''}" data-a="bdVideBulles">Avec des bulles vides</button><span class="muet">Nombre de pages</span>${[1, 2, 4].map((n) => `<button class="puce ${(v.videN || 2) === n ? 'on' : ''}" data-a="bdVideN" data-n="${n}">${n}</button>`).join('')}
    <button class="btn" data-a="bdImprimerVides">🖨 Imprimer</button></div></div>`;
}
function vueAlbumBD(a) {
  return `<div class="section bd">${entete(a.titre, `<button class="btn doux petit" data-a="bdVides">🖨 Planches vides</button><button class="btn petit" style="background:#E0457B" data-a="bdImprimerAlbum" ${a.planches.length ? '' : 'disabled'}>🖨 Imprimer l’album</button>`)}
    ${S.vue.vides ? vuePlanchesVides() : ''}
    <div class="panneau"><h3>Ta méthode</h3><ol class="methode methode-ligne">${METHODE_BD.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>
    <div class="grille-albums planches">${a.planches.map((p, i) => `<div class="carte-album"><button data-a="bdPlanche" data-i="${i}"><div class="mini">${plancheHtml(p)}</div><b>Planche ${i + 1}</b><span class="muet">${p.type === 'photo' ? 'dessinée sur papier' : 'composée à l’écran'}</span></button><span class="ordre"><button class="btn doux petit" data-a="bdBougerPlanche" data-i="${i}" data-d="-1">◀</button><button class="btn doux petit" data-a="bdBougerPlanche" data-i="${i}" data-d="1">▶</button></span></div>`).join('')}
      <div class="ajout-planche"><b>Ajouter une planche</b><button class="btn" style="background:#E0457B" data-a="bdPhotoPlanche">📷 Photographier ma planche dessinée</button><span class="muet">ou composer à l’écran :</span><div class="gabarits petits">${Object.entries(GABARITS).map(([k, x]) => `<button data-a="bdAjouter" data-g="${k}" title="${esc(x.nom)}"><div class="mini">${plancheHtml(planchePapier(k))}</div></button>`).join('')}</div></div>
    </div>
    ${BD.cam && BD.cam.planche ? vueCamBD('Pose ta planche bien à plat, éclairée, et remplis l’écran avec elle.') : ''}</div>`;
}
function vueCamBD(conseil) {
  return `<div class="voile-bd"><div class="panneau cam-bd"><h3>📷 Photo</h3><p class="muet" style="margin:0">${esc(conseil)}</p>
    <div class="ecran-photo"><video id="bd-video" autoplay muted playsinline></video><div class="compte" id="bd-compte"></div></div>
    <div class="rang"><button class="btn grand" style="background:#E0457B" data-a="bdClic">Clic !</button><button class="btn doux" data-a="bdCamFermer">Annuler</button></div></div></div>`;
}
function vuePlancheBD(a, p) {
  const v = S.vue; const i = v.planche;
  if (p.type === 'photo') return `<div class="section bd">${entete(a.titre + ' · planche ' + (i + 1), '<button class="btn doux petit" data-a="bdEffacerPlanche">🗑 Enlever la planche</button>')}<div class="zone-planche seule">${plancheHtml(p)}</div></div>`;
  const cs = v.casesel; const c = cs !== undefined ? p.cases[cs] : null; const b = c && v.bullesel !== undefined ? c.bulles[v.bullesel] : null;
  const images = BD.picker || [];
  return `<div class="section bd">${entete(a.titre + ' · planche ' + (i + 1), `<button class="btn doux petit" data-a="bdEffacerPlanche">${BD.aSupprimer === 'p' + i ? 'Sûr ?' : '🗑 Enlever la planche'}</button>`)}
    <div class="atelier-bd"><div class="zone-planche" id="bd-planche">${plancheHtml(p, { edition: true })}</div>
      <div class="panneau outils-bd">${c ? `<h3>Case ${cs + 1}</h3>
        <div class="rang"><button class="btn doux" data-a="bdCamCase">📷 Photo</button><button class="btn doux" data-a="bdImages">🖼 Mes images</button>${c.img ? '<button class="btn doux petit" data-a="bdSansImage">Enlever l’image</button>' : ''}</div>
        ${BD.picker ? `<div class="choix-photos">${images.map((f) => `<button data-a="bdChoisirImage" data-c="${esc(f.chemin)}"><img src="${esc(f.url)}" alt="" loading="lazy"></button>`).join('') || '<p class="muet">Pas encore d’image.</p>'}</div>` : ''}
        ${c.img && outilsPlus('bd') ? `<div class="rang"><b>Cadrage</b><button class="btn doux petit" data-a="bdZoom" data-d="-1" aria-label="Dézoomer">−</button><span class="muet" id="bd-zoom">${Math.round(bdCadrage(c).z * 100)} %</span><button class="btn doux petit" data-a="bdZoom" data-d="1" aria-label="Zoomer">+</button><button class="btn doux petit" data-a="bdRecentrer">Recentrer</button></div><p class="muet" style="margin:0">Zoome, puis glisse l’image dans la case pour choisir ce qu’on voit.</p>` : ''}
        <h3>Bulles</h3><div class="rang wrap">${Object.entries(TYPES_BULLES).map(([k, n]) => `<button class="puce" data-a="bdBulle" data-t="${k}">+ ${n}</button>`).join('')}${outilsPlus('bd') ? `<button class="puce ${BD.effets ? 'on' : ''}" data-a="bdEffets">+ Bruitage</button>` : ''}${boutonPlus('bd')}</div>
        ${BD.effets ? `<div class="rang wrap">${BD_EFFETS.map(([t, col], k) => `<button class="puce bd-effet-choix" style="color:${col}" data-a="bdEffet" data-k="${k}">${esc(t)}</button>`).join('')}</div>` : ''}
        ${b ? `<input class="champ" data-in="bdTexteBulle" maxlength="90" value="${esc(b.texte)}" placeholder="${b.type === 'effet' ? 'Le bruit' : 'Ce que dit ton personnage'}">
          ${outilsPlus('bd') ? `<div class="rang wrap"><span class="muet">Taille</span>${BD_TAILLES.map(([k, n]) => `<button class="puce ${(b.taille || 'm') === k ? 'on' : ''}" data-a="bdTaille" data-t="${k}">${n}</button>`).join('')}</div>` : ''}
          ${outilsPlus('bd') && (b.type === 'parole' || b.type === 'pensee') ? `<div class="rang wrap"><span class="muet">Pointe</span>${BD_POINTES.map(([k, f]) => `<button class="puce ${(b.queue || 'bg') === k ? 'on' : ''}" data-a="bdPointe" data-q="${k}" aria-label="Pointe ${k}">${f}</button>`).join('')}</div>` : ''}
          <div class="rang"><span class="muet">Glisse la bulle avec la souris.</span><button class="btn doux petit" data-a="bdEnleverBulle">Enlever la bulle</button></div>` : c.bulles.length ? '<p class="muet" style="margin:0">Touche une bulle pour écrire dedans.</p>' : ''}`
      : '<h3>Touche une case</h3><p class="muet" style="margin:0">Pour y mettre une photo, un de tes dessins ou une image de ton film, puis des bulles.</p><p class="muet">Astuce : dessine tes personnages sur papier et photographie-les !</p>'}</div></div>
    ${BD.cam && BD.cam.cas !== undefined ? vueCamBD('Montre ton dessin, ta figurine ou ta scène à la caméra.') : ''}</div>`;
}

// ---------- Caméra ----------
async function camBD() {
  if (BD.cam.flux) return;
  try { BD.cam.flux = await navigator.mediaDevices.getUserMedia({ audio: false, video: { width: { ideal: 1920 }, height: { ideal: 1440 } } }); } catch (e) { toast('Je ne trouve pas de caméra.'); BD.cam = null; render(); return; }
  const v = document.getElementById('bd-video'); if (v) { v.srcObject = BD.cam.flux; v.play().catch(() => {}); }
}
function couperCamBD() { if (BD.cam && BD.cam.flux) BD.cam.flux.getTracks().forEach((t) => t.stop()); BD.cam = null; }
function bdApresRendu() {
  const v = document.getElementById('bd-video');
  if (v && BD.cam) { if (BD.cam.flux && v.srcObject !== BD.cam.flux) { v.srcObject = BD.cam.flux; v.play().catch(() => {}); } else if (!BD.cam.flux) camBD(); }
  else if (!v && BD.cam && BD.cam.flux) couperCamBD();
}
async function photoBD() {
  const v = document.getElementById('bd-video'); if (!v || v.readyState < 2) return null;
  for (let i = 3; i > 0; i--) { const el = document.getElementById('bd-compte'); if (el) { el.textContent = i; el.classList.remove('bat'); void el.offsetWidth; el.classList.add('bat'); } await new Promise((ok) => setTimeout(ok, 800)); }
  const el = document.getElementById('bd-compte'); if (el) el.textContent = '';
  const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0);
  const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.92));
  const r = await F.creationPhoto('BD ' + (album().titre || ''), new Uint8Array(await blob.arrayBuffer()), 'jpg');
  return r && r.ok ? r.chemin : null;
}

// ---------- Glisser les bulles ----------
document.addEventListener('pointerdown', (e) => {
  const im = e.target.closest && !e.target.closest('[data-bulle]') && e.target.closest('[data-cadrer]');
  if (im) { // recadrer l'image de la case sélectionnée
    const i = Number(im.dataset.cadrer); const k = bdCadrage(planche().cases[i]); const r = im.parentElement.getBoundingClientRect();
    BD.cadre = { im, i, x0: e.clientX, y0: e.clientY, kx: k.x, ky: k.y, z: k.z, w: r.width, h: r.height, bouge: false };
    e.preventDefault(); e.stopPropagation(); return;
  }
  const el = e.target.closest && e.target.closest('[data-bulle]'); if (!el) return;
  const [i, k] = el.dataset.bulle.split('-').map(Number); S.vue.casesel = i; S.vue.bullesel = k;
  const box = el.parentElement.getBoundingClientRect(); BD.glisse = { el, box, i, k, dx: e.clientX - el.getBoundingClientRect().left, dy: e.clientY - el.getBoundingClientRect().top, bouge: false };
  e.preventDefault(); e.stopPropagation();
}, true);
document.addEventListener('pointermove', (e) => {
  const q = BD.cadre;
  if (q) { // on tire l'image : glisser vers la droite montre davantage sa gauche
    const dx = e.clientX - q.x0, dy = e.clientY - q.y0; if (Math.abs(dx) + Math.abs(dy) > 3) q.bouge = true;
    q.x = Math.max(0, Math.min(100, q.kx - (dx / q.w) * 100 / q.z)); q.y = Math.max(0, Math.min(100, q.ky - (dy / q.h) * 100 / q.z));
    q.im.style.objectPosition = `${q.x}% ${q.y}%`; q.im.style.transformOrigin = `${q.x}% ${q.y}%`; return;
  }
  const g = BD.glisse; if (!g) return; g.bouge = true;
  const x = Math.max(0, Math.min(85, ((e.clientX - g.dx - g.box.left) / g.box.width) * 100)); const y = Math.max(0, Math.min(88, ((e.clientY - g.dy - g.box.top) / g.box.height) * 100));
  g.el.style.left = x + '%'; g.el.style.top = y + '%'; g.x = x; g.y = y;
});
document.addEventListener('pointerup', () => {
  const q = BD.cadre;
  if (q) { BD.cadre = null; if (q.bouge && q.x !== undefined) { const c = planche().cases[q.i]; c.cadrage = Object.assign(bdCadrage(c), { x: Math.round(q.x), y: Math.round(q.y) }); sauverAlbum(); } return; }
  const g = BD.glisse; if (!g) return; BD.glisse = null;
  const b = planche().cases[g.i].bulles[g.k]; if (g.bouge && g.x !== undefined) { b.x = Math.round(g.x); b.y = Math.round(g.y); sauverAlbum(); }
  render(); const t = document.querySelector('[data-in="bdTexteBulle"]'); if (t && !g.bouge) t.focus();
});

function pageImpression(titre, planches, opts) {
  const o = opts || {};
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><style>@page{size:A4;margin:0}body{margin:0}
    ${CSS_PLANCHE} .planche{width:210mm;height:297mm;aspect-ratio:auto;page-break-after:always;padding:12mm;gap:6mm}
    .couv{width:210mm;height:297mm;display:flex;flex-direction:column;align-items:center;justify-content:center;page-break-after:always;font-family:'Comic Sans MS',sans-serif}
    .couv h1{font-size:44pt;margin:0 15mm;text-align:center}.couv p{font-size:16pt}</style></head><body>
    ${o.couverture ? `<div class="couv"><h1>${esc(titre)}</h1><p>une BD de ${esc((S.profil && S.profil.prenom) || '')}</p></div>` : ''}
    ${planches.map((p) => plancheHtml(p, { vide: o.vide })).join('')}</body></html>`;
}

Object.assign(A, {
  bdSelBulle: () => {},
  bdCreer: async () => {
    const titre = String(S.vue.titre || '').trim() || 'Ma BD'; const fichier = 'bd-' + Date.now().toString(36) + '.json';
    await F.ecrireDoc('bd', fichier, { titre, planches: [], cree: new Date().toISOString(), modifie: new Date().toISOString() });
    S.docs.bd = await F.listerDocs('bd'); S.vue = { ref: 'bd', fichier }; render();
  },
  bdOuvrir: (d) => { S.vue = { ref: 'bd', fichier: d.f }; render(); },
  bdSupprimer: async (d) => {
    if (BD.aSupprimer !== d.f) { BD.aSupprimer = d.f; render(); setTimeout(() => { if (BD.aSupprimer === d.f) { BD.aSupprimer = null; render(); } }, 4000); return; }
    BD.aSupprimer = null; await F.effacerDoc('bd', d.f); S.docs.bd = await F.listerDocs('bd'); render();
  },
  bdVidesDirect: () => { S.vue.vides = !S.vue.vides; render(); },
  bdVides: () => { S.vue.vides = !S.vue.vides; render(); },
  bdVideG: (d) => { S.vue.videG = d.g; render(); },
  bdVideBulles: () => { S.vue.videBulles = !S.vue.videBulles; render(); },
  bdVideN: (d) => { S.vue.videN = Number(d.n); render(); },
  bdImprimerVides: async () => {
    const g = S.vue.videG || 'g6'; const n = S.vue.videN || 2;
    const pages = Array.from({ length: n }, () => { const p = planchePapier(g); if (S.vue.videBulles) p.cases.forEach((c, i) => c.bulles.push({ type: 'parole', texte: '', x: i % 2 ? 40 : 8, y: 6 })); return p; });
    const r = await F.fairePdf('Planches de BD vides', pageImpression('', pages, { vide: true }), { imprimer: true });
    toast(r && r.ok ? 'Tes planches partent à l’imprimante. À tes crayons !' : 'Je n’ai pas pu préparer les planches.', 6000);
  },
  bdPlanche: (d) => { S.vue.planche = Number(d.i); S.vue.casesel = undefined; S.vue.bullesel = undefined; BD.picker = null; render(); },
  bdAjouter: (d) => { const a = album(); a.planches.push(planchePapier(d.g)); sauverAlbum(); S.vue.planche = a.planches.length - 1; S.vue.casesel = 0; render(); },
  bdBougerPlanche: (d) => { const a = album(); const i = Number(d.i), j = i + Number(d.d); if (j < 0 || j >= a.planches.length) return; [a.planches[i], a.planches[j]] = [a.planches[j], a.planches[i]]; sauverAlbum(); render(); },
  bdEffacerPlanche: () => {
    const k = 'p' + S.vue.planche; if (BD.aSupprimer !== k) { BD.aSupprimer = k; render(); return; }
    BD.aSupprimer = null; album().planches.splice(S.vue.planche, 1); sauverAlbum(); delete S.vue.planche; render();
  },
  bdPhotoPlanche: () => { BD.cam = { planche: true }; render(); },
  bdCamCase: () => { BD.cam = { cas: S.vue.casesel }; render(); },
  bdCamFermer: () => { couperCamBD(); render(); },
  bdClic: async () => {
    const chemin = await photoBD(); const cam = BD.cam; couperCamBD(); if (!chemin) { render(); return; }
    const a = album();
    if (cam.planche) { a.planches.push({ type: 'photo', chemin }); toast('Ta planche est dans l’album !'); }
    else if (cam.cas !== undefined) { planche().cases[cam.cas].img = chemin; delete planche().cases[cam.cas].cadrage; }
    sauverAlbum(); render();
  },
  bdCase: (d) => { S.vue.casesel = Number(d.i); S.vue.bullesel = undefined; BD.picker = null; render(); },
  bdImages: async () => {
    const [cr, ph, de] = await Promise.all([F.creations(), F.photos(), F.animDecors()]);
    BD.picker = (cr || []).filter((f) => f.type === 'image').concat(ph || [], (de || []).filter((f) => f.origine === 'flocon')); render();
  },
  bdChoisirImage: (d) => { planche().cases[S.vue.casesel].img = d.c; delete planche().cases[S.vue.casesel].cadrage; BD.picker = null; sauverAlbum(); render(); },
  bdSansImage: () => { planche().cases[S.vue.casesel].img = null; sauverAlbum(); render(); },
  bdBulle: (d) => { const c = planche().cases[S.vue.casesel]; c.bulles.push({ type: d.t, texte: '', x: d.t === 'recit' ? 3 : 10 + (c.bulles.length * 12) % 50, y: d.t === 'recit' ? 3 : 8 + (c.bulles.length * 14) % 50 }); S.vue.bullesel = c.bulles.length - 1; sauverAlbum(); render(); const t = document.querySelector('[data-in="bdTexteBulle"]'); if (t) t.focus(); },
  bdZoom: (d) => { const c = planche().cases[S.vue.casesel]; const k = bdCadrage(c); k.z = Math.max(1, Math.min(3, Math.round((k.z + Number(d.d) * 0.25) * 100) / 100)); c.cadrage = k; sauverAlbum(); render(); },
  bdRecentrer: () => { planche().cases[S.vue.casesel].cadrage = { z: 1, x: 50, y: 50 }; sauverAlbum(); render(); },
  bdEffets: () => { BD.effets = !BD.effets; render(); },
  bdEffet: (d) => { const [t, col] = BD_EFFETS[Number(d.k)]; const c = planche().cases[S.vue.casesel]; const n = c.bulles.length;
    c.bulles.push({ type: 'effet', texte: t, couleur: col, angle: [-8, 6, -4, 9][n % 4], taille: 'm', x: 10 + (n * 17) % 50, y: 25 + (n * 13) % 45 }); S.vue.bullesel = n; BD.effets = false; sauverAlbum(); render(); },
  bdTaille: (d) => { planche().cases[S.vue.casesel].bulles[S.vue.bullesel].taille = d.t; sauverAlbum(); render(); },
  bdPointe: (d) => { planche().cases[S.vue.casesel].bulles[S.vue.bullesel].queue = d.q; sauverAlbum(); render(); },
  bdEnleverBulle: () => { planche().cases[S.vue.casesel].bulles.splice(S.vue.bullesel, 1); S.vue.bullesel = undefined; sauverAlbum(); render(); },
  bdImprimerAlbum: async () => {
    const a = album(); await sauverAlbumMaintenant();
    const r = await F.fairePdf(a.titre || 'Ma BD', pageImpression(a.titre, a.planches, { couverture: true }), { imprimer: true });
    toast(r && r.ok ? 'Ton album part à l’imprimante, et il est aussi dans Mes créations.' : 'Je n’ai pas pu fabriquer l’album.', 6000);
  }
});
Object.assign(SAISIES, {
  bdNouveau: (v) => { S.vue.titre = v; },
  bdTexteBulle: (v) => { const b = planche().cases[S.vue.casesel].bulles[S.vue.bullesel]; b.texte = v; sauverAlbum(); const el = document.querySelector(`[data-bulle="${S.vue.casesel}-${S.vue.bullesel}"]`); if (el) el.textContent = v || '…'; }
});
const fermerVueAvantBD = A.fermerVue;
A.fermerVue = async (d) => {
  if (S.vue && S.vue.ref === 'bd' && S.vue.fichier) {
    couperCamBD(); BD.picker = null; await sauverAlbumMaintenant();
    if (S.vue.planche !== undefined) { delete S.vue.planche; S.vue.casesel = undefined; render(); return; }
    S.vue = { ref: 'bd' }; S.docs.bd = await F.listerDocs('bd'); render(); return;
  }
  fermerVueAvantBD(d);
};
// Les règles des planches servent aussi à l'écran.
(() => { const st = document.createElement('style'); st.textContent = CSS_PLANCHE + '\n.zone-planche [data-cadrer]{cursor:move;touch-action:none;user-select:none}.bd-effet-choix{font-weight:900}.outils-bd .rang.wrap{flex-wrap:wrap}'; document.head.appendChild(st); })();
