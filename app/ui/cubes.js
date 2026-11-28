// ======================================================================
// MON ATELIER 3D EN CUBES (façon Minecraft), fait pour Flocon.
// Poser, enlever, peindre des cubes ; symétrie ; annuler.
// Et surtout : un plan de montage imprimé étage par étage pour le construire
// en vrai (Lego, cubes en bois, sucres…), et un fichier pour l'imprimante 3D.
// Rangé dans Documents, « Mes créations 3D ».
// ======================================================================
/* global S, F, A, esc, entete, toast, render */
import * as THREE from './vendor/three.module.min.js';

const N = 20; // terrain de 20 × 20, 20 étages
const BLOCS = [
  ['Herbe', '#5DB346'], ['Terre', '#8B5A2B'], ['Pierre', '#8E8E8E'], ['Bois', '#B07A3E'], ['Planches', '#D9A86C'], ['Feuilles', '#2E7D32'],
  ['Eau', '#3D8BFF'], ['Sable', '#E8D28A'], ['Neige', '#F5F7FA'], ['Lave', '#FF5A1F'], ['Brique', '#B23A2E'], ['Or', '#F5C518'],
  ['Rose', '#F06292'], ['Violet', '#8E44AD'], ['Ciel', '#8FD3FF'], ['Nuit', '#22223B']
];
const IDEES_3D = ['Ta maison de rêve', 'Un animal en cubes', 'Ton prénom en relief', 'Un château avec des tours', 'Une fusée', 'Un arbre géant', 'Une île au trésor', 'Un robot'];
const C3 = { scene: null, rendu: null, camera: null, cubes: new Map(), mats: [], geo: null, fantome: null, sol: null, angle: Math.PI / 4, haut: 0.7, dist: 25, mode: 'poser', couleur: 0, miroir: false, histoire: [], appui: null, besoin: true, aSupprimer: null };
const cle = (x, y, z) => x + ',' + y + ',' + z;
function creation() { return (S.docs.cubes || []).find((c) => c.fichier === S.vue.fichier); }

// ---------- Scène ----------
function initScene() {
  if (C3.rendu || C3.pas3d) return;
  try { C3.rendu = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); } catch (e) { C3.pas3d = true; return; }
  C3.rendu.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  C3.rendu.domElement.className = 'toile-cubes';
  C3.scene = new THREE.Scene(); C3.scene.background = new THREE.Color('#CFE8FF');
  C3.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
  C3.scene.add(new THREE.HemisphereLight(0xffffff, 0x88aa77, 1.1));
  const soleil = new THREE.DirectionalLight(0xffffff, 1.4); soleil.position.set(30, 50, 20); C3.scene.add(soleil);
  const sol = new THREE.Mesh(new THREE.PlaneGeometry(N, N), new THREE.MeshLambertMaterial({ color: '#9CD97E' }));
  sol.rotation.x = -Math.PI / 2; sol.position.set(N / 2, 0, N / 2); sol.userData.sol = true; C3.sol = sol; C3.scene.add(sol);
  const grille = new THREE.GridHelper(N, N, 0x5a8f4a, 0x7fb86a); grille.position.set(N / 2, 0.01, N / 2); C3.scene.add(grille);
  C3.geo = new THREE.BoxGeometry(1, 1, 1);
  C3.aretes = new THREE.EdgesGeometry(C3.geo);
  C3.matArete = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 });
  C3.mats = BLOCS.map(([, c]) => new THREE.MeshLambertMaterial({ color: c, transparent: c === '#3D8BFF', opacity: c === '#3D8BFF' ? 0.85 : 1 }));
  C3.fantome = new THREE.Mesh(C3.geo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false })); C3.fantome.visible = false; C3.scene.add(C3.fantome);
  const el = C3.rendu.domElement;
  el.addEventListener('pointerdown', (e) => { C3.appui = { x: e.clientX, y: e.clientY, a: C3.angle, h: C3.haut, bouge: false, bouton: e.button }; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', (e) => {
    if (C3.appui) { const dx = e.clientX - C3.appui.x, dy = e.clientY - C3.appui.y; if (Math.hypot(dx, dy) > 6) C3.appui.bouge = true;
      if (C3.appui.bouge) { C3.angle = C3.appui.a - dx * 0.008; C3.haut = Math.max(0.12, Math.min(1.45, C3.appui.h + dy * 0.006)); C3.fantome.visible = false; demander(); return; } }
    survol(e);
  });
  el.addEventListener('pointerup', (e) => { const a = C3.appui; C3.appui = null; if (a && !a.bouge) agir(e, a.bouton === 2); });
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  el.addEventListener('wheel', (e) => { C3.dist = Math.max(10, Math.min(70, C3.dist + Math.sign(e.deltaY) * 2.5)); demander(); e.preventDefault(); }, { passive: false });
  const boucle = () => { if (!C3.rendu) return; if (C3.besoin) { C3.besoin = false; dessiner(); } requestAnimationFrame(boucle); };
  requestAnimationFrame(boucle);
}
function demander() { C3.besoin = true; }
function dessiner() {
  const el = C3.rendu.domElement; const z = el.parentElement; if (!z) return;
  const w = z.clientWidth, h = z.clientHeight; if (el.width !== Math.floor(w * C3.rendu.getPixelRatio()) || el.height !== Math.floor(h * C3.rendu.getPixelRatio())) { C3.rendu.setSize(w, h, false); C3.camera.aspect = w / h; C3.camera.updateProjectionMatrix(); }
  const c = new THREE.Vector3(N / 2, 2, N / 2);
  C3.camera.position.set(c.x + C3.dist * Math.cos(C3.haut) * Math.cos(C3.angle), c.y + C3.dist * Math.sin(C3.haut), c.z + C3.dist * Math.cos(C3.haut) * Math.sin(C3.angle));
  C3.camera.lookAt(c); C3.rendu.render(C3.scene, C3.camera);
}
function ajouterMaillage(x, y, z, ci) {
  const m = new THREE.Mesh(C3.geo, C3.mats[ci]); m.position.set(x + 0.5, y + 0.5, z + 0.5); m.userData = { x, y, z, ci };
  m.add(new THREE.LineSegments(C3.aretes, C3.matArete)); C3.scene.add(m); C3.cubes.set(cle(x, y, z), m);
}
function enleverMaillage(k) { const m = C3.cubes.get(k); if (m) { C3.scene.remove(m); C3.cubes.delete(k); } }
function chargerCreation(c) {
  for (const k of [...C3.cubes.keys()]) enleverMaillage(k);
  (c.cubes || []).forEach(([x, y, z, ci]) => ajouterMaillage(x, y, z, ci)); C3.histoire = []; demander();
}
const dedans = (x, y, z) => x >= 0 && z >= 0 && y >= 0 && x < N && z < N && y < N;
function cibler(e) {
  const r = C3.rendu.domElement.getBoundingClientRect();
  const p = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  const ray = new THREE.Raycaster(); ray.setFromCamera(p, C3.camera);
  const hits = ray.intersectObjects([...C3.cubes.values(), C3.sol], false); const h = hits[0]; if (!h) return null;
  if (h.object.userData.sol) { const x = Math.floor(h.point.x), z = Math.floor(h.point.z); return dedans(x, 0, z) ? { pose: [x, 0, z] } : null; }
  const { x, y, z } = h.object.userData; const n = h.face.normal;
  return { cube: [x, y, z], pose: [x + Math.round(n.x), y + Math.round(n.y), z + Math.round(n.z)] };
}
function survol(e) {
  const t = cibler(e); const f = C3.fantome;
  if (!t) { if (f.visible) { f.visible = false; demander(); } return; }
  const p = C3.mode === 'poser' ? t.pose : t.cube; if (!p || !dedans(...p)) { f.visible = false; demander(); return; }
  f.visible = true; f.position.set(p[0] + 0.5, p[1] + 0.5, p[2] + 0.5); f.material.color.set(C3.mode === 'enlever' ? '#ff4444' : BLOCS[C3.couleur][1]); f.scale.setScalar(C3.mode === 'poser' ? 1 : 1.04); demander();
}
function appliquer(op) {
  // op : [{ k, avant, apres }] ; avant/apres = index de couleur ou null
  for (const o of op) { enleverMaillage(o.k); if (o.apres !== null) { const [x, y, z] = o.k.split(',').map(Number); ajouterMaillage(x, y, z, o.apres); } }
  demander(); sauverCubes();
}
function agir(e, droit) {
  const t = cibler(e); if (!t) return; const mode = droit ? 'enlever' : C3.mode;
  const cibles = []; const p = mode === 'poser' ? t.pose : t.cube; if (!p || !dedans(...p)) return;
  cibles.push(p); if (C3.miroir) { const m = [N - 1 - p[0], p[1], p[2]]; if (m[0] !== p[0]) cibles.push(m); }
  const op = [];
  for (const [x, y, z] of cibles) {
    const k = cle(x, y, z); const avant = C3.cubes.has(k) ? C3.cubes.get(k).userData.ci : null;
    const apres = mode === 'enlever' ? null : C3.couleur;
    if (mode === 'poser' && avant !== null) continue; if (mode !== 'poser' && avant === null) continue;
    op.push({ k, avant, apres });
  }
  if (!op.length) return; C3.histoire.push(op); if (C3.histoire.length > 200) C3.histoire.shift(); appliquer(op); survol(e);
  const n = document.getElementById('cubes-nb'); if (n) n.textContent = C3.cubes.size + ' cube' + (C3.cubes.size > 1 ? 's' : '');
}
let minuterieCubes = null;
function donnees() { return [...C3.cubes.values()].map((m) => [m.userData.x, m.userData.y, m.userData.z, m.userData.ci]); }
function sauverCubes() { const c = creation(); if (!c) return; c.cubes = donnees(); c.modifie = new Date().toISOString(); const { fichier, ...d } = c; clearTimeout(minuterieCubes); minuterieCubes = setTimeout(() => F.ecrireDoc('cubes', fichier, d), 500); }
async function sauverCubesMaintenant() { clearTimeout(minuterieCubes); const c = creation(); if (c) { c.cubes = donnees(); const { fichier, ...d } = c; await F.ecrireDoc('cubes', fichier, d); } }

// ---------- Vers le vrai monde : plan de montage et imprimante 3D ----------
function planDeMontage(c, image) {
  const l = c.cubes || []; if (!l.length) return null;
  const xs = l.map((q) => q[0]), zs = l.map((q) => q[2]); const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
  const etages = [...new Set(l.map((q) => q[1]))].sort((a, b) => a - b);
  const compte = {}; l.forEach((q) => { compte[q[3]] = (compte[q[3]] || 0) + 1; });
  const T = Math.max(5, Math.min(11, Math.floor(170 / Math.max(x1 - x0 + 1, z1 - z0 + 1))));
  const plan = (y) => { const ici = new Map(l.filter((q) => q[1] === y).map((q) => [q[0] + ',' + q[2], q[3]])); const dessous = new Set(l.filter((q) => q[1] === y - 1).map((q) => q[0] + ',' + q[2]));
    let t = '<table>'; for (let z = z0; z <= z1; z++) { t += '<tr>'; for (let x = x0; x <= x1; x++) { const ci = ici.get(x + ',' + z); t += ci !== undefined ? `<td style="background:${BLOCS[ci][1]}"></td>` : `<td class="${dessous.has(x + ',' + z) ? 'dessous' : ''}"></td>`; } t += '</tr>'; } return t + '</table>'; };
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><style>@page{size:A4;margin:12mm}body{font-family:sans-serif;margin:0;color:#222}
    h1{margin:0 0 3mm;font-size:22pt}.couv{text-align:center;page-break-after:always}.couv img{max-width:170mm;max-height:150mm;border-radius:4mm;margin:6mm 0}
    .liste{display:flex;flex-wrap:wrap;gap:4mm;justify-content:center;font-size:12pt}.liste i{display:inline-block;width:7mm;height:7mm;border:1px solid #333;vertical-align:middle;margin-right:2mm}
    .etages{display:grid;grid-template-columns:1fr 1fr;gap:8mm}.etage{break-inside:avoid}.etage h2{font-size:13pt;margin:0 0 2mm}
    table{border-collapse:collapse}td{width:${T}mm;height:${T}mm;border:1px solid #bbb;padding:0}td.dessous{background:repeating-linear-gradient(45deg,#eee 0 2px,#fff 2px 5px)}
    .astuce{font-size:10.5pt;color:#555;margin:2mm 0 5mm}</style></head><body>
    <div class="couv"><h1>${esc(c.titre || 'Ma création')}</h1><p>Le plan pour la construire en vrai : Lego, cubes en bois, morceaux de sucre…</p>${image ? `<img src="${image}">` : ''}
    <h2>Ce qu’il te faut</h2><div class="liste">${Object.entries(compte).map(([ci, n]) => `<span><i style="background:${BLOCS[ci][1]}"></i>${n} × ${esc(BLOCS[ci][0])}</span>`).join('')}</div><p class="astuce">${l.length} cubes en tout, ${etages.length} étage${etages.length > 1 ? 's' : ''}.</p></div>
    <p class="astuce">Construis étage par étage, en commençant par le bas. Les cases rayées montrent l’étage d’en dessous, pour t’aider à te repérer. Le haut de chaque plan, c’est le fond de ta création.</p>
    <div class="etages">${etages.map((y, i) => `<div class="etage"><h2>Étage ${i + 1}${i === 0 ? ' (en bas)' : ''}</h2>${plan(y)}</div>`).join('')}</div></body></html>`;
}
function stl(l, mm) {
  const plein = new Set(l.map((q) => cle(q[0], q[1], q[2]))); const tri = [];
  const faces = [[[1, 0, 0], [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]]], [[-1, 0, 0], [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]]], [[0, 1, 0], [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]]], [[0, -1, 0], [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]]], [[0, 0, 1], [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]]], [[0, 0, -1], [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]]]];
  for (const [x, y, z] of l) for (const [n, c] of faces) {
    if (plein.has(cle(x + n[0], y + n[1], z + n[2]))) continue;
    // Y devient Z pour l'imprimante (le haut est l'axe Z)
    const p = c.map(([a, b, d]) => [(x + a) * mm, (z + d) * mm, (y + b) * mm]); const nn = [n[0], n[2], n[1]];
    // sens des triangles : la normale doit sortir du cube (on vérifie, puis on inverse si besoin)
    const sens = (a, b, c2) => { const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = [c2[0] - a[0], c2[1] - a[1], c2[2] - a[2]]; const cr = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]; return cr[0] * nn[0] + cr[1] * nn[1] + cr[2] * nn[2]; };
    if (sens(p[0], p[1], p[2]) > 0) tri.push([nn, p[0], p[1], p[2]], [nn, p[0], p[2], p[3]]); else tri.push([nn, p[0], p[2], p[1]], [nn, p[0], p[3], p[2]]);
  }
  const buf = new ArrayBuffer(84 + tri.length * 50); const v = new DataView(buf); v.setUint32(80, tri.length, true);
  tri.forEach((t, i) => { let o = 84 + i * 50; for (const pt of t) { for (const k of pt) { v.setFloat32(o, k, true); o += 4; } } v.setUint16(o, 0, true); });
  return new Uint8Array(buf);
}

// ---------- Affichage ----------
function vueCubes() {
  const v = S.vue; const c = creation();
  if (!v.fichier || !c) {
    const l = (S.docs.cubes || []).slice().sort((a, b) => String(b.modifie || '').localeCompare(String(a.modifie || '')));
    return `<div class="section cubes">${entete('Mon atelier 3D')}
      <div class="panneau affiche-cubes"><div class="grow"><h3>Construis en cubes… puis en vrai !</h3><p class="muet" style="margin:4px 0 10px">Ta création peut devenir un plan de montage pour tes Lego, ou un objet sorti d’une imprimante 3D.</p>
        <div class="rang"><input class="champ" data-in="cNouveau" maxlength="50" placeholder="${esc(IDEES_3D[Math.floor(Date.now() / 60000) % IDEES_3D.length])}" value="${esc(v.titre || '')}"><button class="btn" style="background:#2FA36B" data-a="cCreer">Construire</button></div></div><div class="grande-e">🧊</div></div>
      ${l.length ? `<div class="liste">${l.map((x) => `<div class="ligne-histoire"><button class="ligne grow" data-a="cOuvrir" data-f="${esc(x.fichier)}"><span class="grow"><b>${esc(x.titre)}</b><br><span class="muet">${(x.cubes || []).length} cubes</span></span></button><button class="btn doux petit" data-a="cSupprimer" data-f="${esc(x.fichier)}">${C3.aSupprimer === x.fichier ? 'Sûr ?' : '🗑'}</button></div>`).join('')}</div>` : ''}</div>`;
  }
  const modes = [['poser', '➕ Poser'], ['enlever', '➖ Enlever'], ['peindre', '🖌 Peindre']];
  return `<div class="section cubes">${entete(c.titre, `<span class="etiquette" id="cubes-nb">${(c.cubes || []).length} cubes</span>`)}
    <div class="atelier-cubes"><div class="zone-cubes" id="cubes-zone"></div>
      <div class="panneau outils-cubes">
        <div class="modes-cubes">${modes.map(([m, n]) => `<button class="${C3.mode === m ? 'on' : ''}" data-a="cMode" data-m="${m}">${n}</button>`).join('')}</div>
        <div class="blocs">${BLOCS.map(([n, col], i) => `<button class="${C3.couleur === i ? 'on' : ''}" data-a="cCouleur" data-i="${i}" title="${esc(n)}"><span style="background:${col}"></span>${esc(n)}</button>`).join('')}</div>
        <div class="rang wrap"><button class="puce ${C3.miroir ? 'on' : ''}" data-a="cMiroir">🪞 Symétrie</button><button class="puce" data-a="cAnnuler">↶ Annuler</button><button class="puce" data-a="cVue" data-v="face">Face</button><button class="puce" data-a="cVue" data-v="dessus">Dessus</button><button class="puce" data-a="cVue" data-v="tour">↻</button></div>
        <p class="muet aide-cubes">Clic : ${C3.mode === 'poser' ? 'poser un cube' : C3.mode === 'enlever' ? 'enlever' : 'peindre'} · clic droit : enlever · glisser : tourner · molette : zoomer</p>
        <h3>En vrai</h3>
        <button class="btn" style="background:#2FA36B" data-a="cPlan">🧱 Imprimer le plan de montage</button>
        <button class="btn doux" data-a="cStl">🖨 Fichier pour l’imprimante 3D</button>
        <button class="btn doux" data-a="cPhoto">📷 Photo dans ma galerie</button>
      </div></div></div>`;
}
function cubesApresRendu() {
  const z = document.getElementById('cubes-zone');
  if (!z) { if (C3.rendu && C3.rendu.domElement.parentElement) C3.rendu.domElement.remove(); return; }
  initScene();
  if (C3.pas3d) { z.innerHTML = '<div class="message-cam" style="display:flex;color:#1E2A4A">Cet ordinateur ne sait pas afficher la 3D (carte graphique trop ancienne ou pilote manquant). Demande à un adulte de mettre à jour le pilote graphique.</div>'; return; }
  if (C3.rendu.domElement.parentElement !== z) z.appendChild(C3.rendu.domElement);
  const c = creation(); if (c && C3.charge !== c.fichier) { C3.charge = c.fichier; chargerCreation(c); }
  demander();
}
window.addEventListener('resize', () => demander());
Object.assign(A, {
  cCreer: async () => {
    const titre = String(S.vue.titre || '').trim() || 'Ma création'; const fichier = 'c-' + Date.now().toString(36) + '.json';
    await F.ecrireDoc('cubes', fichier, { titre, cubes: [], cree: new Date().toISOString(), modifie: new Date().toISOString() });
    S.docs.cubes = await F.listerDocs('cubes'); C3.charge = null; S.vue = { ref: 'cubes', fichier }; render();
  },
  cOuvrir: (d) => { C3.charge = null; S.vue = { ref: 'cubes', fichier: d.f }; render(); },
  cSupprimer: async (d) => {
    if (C3.aSupprimer !== d.f) { C3.aSupprimer = d.f; render(); setTimeout(() => { if (C3.aSupprimer === d.f) { C3.aSupprimer = null; render(); } }, 4000); return; }
    C3.aSupprimer = null; await F.effacerDoc('cubes', d.f); S.docs.cubes = await F.listerDocs('cubes'); render();
  },
  cMode: (d) => { C3.mode = d.m; render(); },
  cCouleur: (d) => { C3.couleur = Number(d.i); if (C3.mode === 'enlever') C3.mode = 'poser'; render(); },
  cMiroir: () => { C3.miroir = !C3.miroir; render(); },
  cAnnuler: () => { const op = C3.histoire.pop(); if (!op) return; appliquer(op.map((o) => ({ k: o.k, avant: o.apres, apres: o.avant }))); const n = document.getElementById('cubes-nb'); if (n) n.textContent = C3.cubes.size + ' cubes'; },
  cVue: (d) => { if (d.v === 'face') { C3.angle = Math.PI / 2; C3.haut = 0.2; } else if (d.v === 'dessus') { C3.haut = 1.45; } else C3.angle += Math.PI / 2; demander(); },
  cPlan: async () => {
    await sauverCubesMaintenant(); const c = creation(); if (!(c.cubes || []).length) { toast('Pose d’abord quelques cubes !'); return; }
    dessiner(); const image = C3.rendu.domElement.toDataURL('image/jpeg', 0.85);
    const r = await F.fairePdf('Plan de montage ' + c.titre, planDeMontage(c, image), { imprimer: true });
    toast(r && r.ok ? 'Le plan part à l’imprimante : à toi de le construire en vrai !' : 'Je n’ai pas pu faire le plan.', 6000);
  },
  cStl: async () => {
    await sauverCubesMaintenant(); const c = creation(); if (!(c.cubes || []).length) { toast('Pose d’abord quelques cubes !'); return; }
    const r = await F.ecrireStl(c.titre, stl(c.cubes, 5));
    toast(r && r.ok ? 'Fichier prêt dans Documents, « Mes créations 3D » (1 cube = 5 mm). Donne-le à un adulte pour l’imprimante 3D.' : 'Je n’ai pas pu préparer le fichier.', 8000);
  },
  cPhoto: async () => {
    dessiner(); const b = await new Promise((ok) => C3.rendu.domElement.toBlob(ok, 'image/png'));
    const r = await F.creationPhoto(creation().titre, new Uint8Array(await b.arrayBuffer()), 'png');
    toast(r && r.ok ? 'Ta création est dans ta galerie !' : 'Je n’ai pas pu prendre la photo.');
  }
});
Object.assign(SAISIES, { cNouveau: (v) => { S.vue.titre = v; } });
const fermerVueAvantCubes = A.fermerVue;
A.fermerVue = async (d) => {
  if (S.vue && S.vue.ref === 'cubes' && S.vue.fichier) { await sauverCubesMaintenant(); C3.charge = null; S.vue = { ref: 'cubes' }; S.docs.cubes = await F.listerDocs('cubes'); render(); return; }
  fermerVueAvantCubes(d);
};
// Annuler au clavier (Ctrl+Z).
document.addEventListener('keydown', (e) => { if (S.vue && S.vue.ref === 'cubes' && S.vue.fichier && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); A.cAnnuler(); } });
Object.assign(window, { vueCubes, cubesApresRendu, C3, BLOCS, stlCubes: stl, planDeMontage });
