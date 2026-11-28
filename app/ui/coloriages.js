'use strict';
// ======================================================================
// COLORIAGES : tout est fabriqué par Flocon (aucune image prise ailleurs).
// - Mandalas générés à l'infini (symétrie, nombre d'anneaux).
// - Pixel art à numéros (des dessins en pixels faits pour Flocon).
// - Coloriages magiques : chaque zone porte un calcul ou une forme verbale,
//   le résultat donne la couleur (tables, additions, conjugaison, nature des mots).
// D'abord : « Imprimer pour colorier aux feutres ». Colorier à l'écran est possible aussi.
// ======================================================================
/* global S, F, A, esc, entete, toast, render, pluieDeFlocons */

// ---------- Les dessins en pixels (faits pour Flocon) ----------
const SPRITES = {
  champignon: { nom: 'Le champignon', couleurs: { '.': '#CFEFFF', R: '#E53935', W: '#FFFFFF', B: '#F3D9B1', K: '#3B2A20' }, lignes: [
    '......RRRR......', '....RRRRRRRR....', '...RRWWRRRRRR...', '..RRWWWWRRWWRR..', '..RRWWWWRRWWWR..', '.RRRRWWRRRRWWRR.', '.RRRRRRRRRRRRRR.', '.RRWWRRRRRRRRRR.',
    '.RWWWWRRRWWRRRR.', '..RWWRRRRWWWRR..', '....BBBBBBBB....', '....BBKBBKBB....', '....BBKBBKBB....', '....BBBBBBBB....', '.....BBBBBB.....', '................'] },
  fusee: { nom: 'La fusée', couleurs: { '.': '#1B2559', R: '#E53935', W: '#ECEFF4', B: '#4FC3F7', O: '#FF9800', Y: '#FFEB3B' }, lignes: [
    '.......RR.......', '......RRRR......', '......WWWW......', '.....WWWWWW.....', '.....WWBBWW.....', '.....WBBBBW.....', '.....WWBBWW.....', '.....WWWWWW.....',
    '.....WWWWWW.....', '....RWWWWWWR....', '...RRWWWWWWRR...', '...RR.WWWW.RR...', '......OYYO......', '.......OO.......', '......O..O......', '................'] },
  chat: { nom: 'Le chat', couleurs: { '.': '#FFF3E0', K: '#3E2723', O: '#FF9F43', G: '#2ECC71', P: '#FF6B9D', W: '#FFFFFF' }, lignes: [
    '................', '..K.........K...', '..KK.......KK...', '..KOK.....KOK...', '..KOOKKKKKOOK...', '..KOOOOOOOOOK...', '.KOOGOOOOOGOOK..', '.KOOGOOOOOGOOK..',
    '.KOOOOOPPOOOOK..', '.KOWOOOOOOOWOK..', '..KOOOWWWOOOK...', '...KKOOOOOKK....', '.....KKKKK......', '................'] },
  poisson: { nom: 'Le poisson', couleurs: { '.': '#B3E5FC', B: '#1E88E5', O: '#FF7043', W: '#FFFFFF', K: '#111111', Y: '#FFD54F' }, lignes: [
    '................', '.......BBB......', '.....BBBBBB.....', '.O..BBWBBBBB....', '.OOBBBKWBBBBBB..', '.OOOBBBBBBYYBBB.', '.OOOBBBBBBYYBBB.', '.OOBBBBBBBBBBB..',
    '.O..BBBBBBBBB...', '.....BBBBBB.....', '.......BBB......', '................'] },
  glace: { nom: 'La glace', couleurs: { '.': '#E8F5E9', P: '#F48FB1', W: '#FFFFFF', R: '#C62828', C: '#D7A86E', Y: '#8D6E63' }, lignes: [
    '................', '.....PPPPP......', '....PPWPPPP.....', '...PPPPPPRPP....', '...PPRPPPPPP....', '....CCCCCCC.....', '....YCCYCCY.....', '.....CYCCYC.....',
    '.....CCYCC......', '......CYC.......', '......CCC.......', '.......C........', '................'] },
  maison: { nom: 'La maison', couleurs: { '.': '#BBDEFB', R: '#C0392B', W: '#FFF8E1', B: '#64B5F6', M: '#8D6E63', G: '#66BB6A' }, lignes: [
    '.......R........', '......RRR.......', '.....RRRRR......', '....RRRRRRR.....', '...RRRRRRRRR....', '..RRRRRRRRRRR...', '...WWWWWWWWW....', '...WBBWWWBBW....',
    '...WBBWWWBBW....', '...WWWWWWWWW....', '...WWWMMWWWW....', '...WWWMMWWWW....', 'GGGGGGMMGGGGGGGG', 'GGGGGGGGGGGGGGGG'] },
  arbre: { nom: 'L’arbre', couleurs: { '.': '#E3F2FD', V: '#43A047', L: '#81C784', R: '#E53935', M: '#6D4C41', G: '#9CCC65' }, lignes: [
    '.....VVVVV......', '...VVVLLVVVV....', '..VVLLVVVRVVV...', '.VVVVVVRVVLLVV..', '.VVRVVVVVVVVVV..', '.VVVVLLVVVRVVV..', '..VVVVVVVVVVV...', '...VVVVRVVVV....',
    '.....VMMMV......', '.......MM.......', '.......MM.......', '......MMMM......', 'GGGGGGGGGGGGGGGG'] }
};
const PALETTE_LIBRE = ['#E53935', '#FF7043', '#FFB300', '#FFEB3B', '#9CCC65', '#43A047', '#26A69A', '#4FC3F7', '#1E88E5', '#3949AB', '#8E24AA', '#F06292', '#8D6E63', '#FFFFFF', '#9E9E9E', '#212121'];

// ---------- Les étiquettes des coloriages magiques ----------
const MAGIE = {
  tables25: { nom: 'Tables de 2 à 5', valeurs: [8, 10, 12, 15, 16, 20, 18], etiquette: (v, h) => { const l = []; for (let a = 2; a <= 5; a++) if (v % a === 0 && v / a <= 10) l.push(a + ' × ' + v / a); return l[Math.floor(h() * l.length)] || String(v); } },
  tables69: { nom: 'Tables de 6 à 9', valeurs: [24, 36, 42, 48, 56, 63, 54], etiquette: (v, h) => { const l = []; for (let a = 6; a <= 9; a++) if (v % a === 0 && v / a <= 10) l.push(a + ' × ' + v / a); return l[Math.floor(h() * l.length)] || String(v); } },
  additions: { nom: 'Additions', valeurs: [25, 40, 50, 75, 100, 60, 90], etiquette: (v, h) => { const a = 5 + Math.floor(h() * (v - 9)); return a + ' + ' + (v - a); } },
  conjugaison: { nom: 'Présent, futur, imparfait', categories: true, valeurs: ['présent', 'futur', 'imparfait', 'passé composé', 'infinitif', 'impératif'], mots: {
    présent: ['je chante', 'tu finis', 'il va', 'nous sommes', 'vous faites', 'elles ont', 'je prends', 'tu dis', 'on peut', 'ils viennent'],
    futur: ['je chanterai', 'tu finiras', 'il ira', 'nous serons', 'vous ferez', 'elles auront', 'je prendrai', 'tu diras', 'on pourra', 'ils viendront'],
    imparfait: ['je chantais', 'tu finissais', 'il allait', 'nous étions', 'vous faisiez', 'elles avaient', 'je prenais', 'tu disais', 'on pouvait', 'ils venaient'],
    'passé composé': ['j’ai chanté', 'tu as fini', 'il est allé', 'nous avons été', 'vous avez fait', 'elles ont eu', 'j’ai pris', 'tu as dit', 'on a pu', 'ils sont venus'],
    infinitif: ['chanter', 'finir', 'aller', 'être', 'faire', 'avoir', 'prendre', 'dire', 'pouvoir', 'venir'],
    impératif: ['chante !', 'finis !', 'va !', 'sois sage !', 'faites vite !', 'prends !', 'dis-moi !', 'venez !', 'allons-y !', 'mangeons !'] } },
  natures: { nom: 'Nature des mots', categories: true, valeurs: ['nom', 'verbe', 'adjectif', 'déterminant', 'pronom', 'adverbe'], mots: {
    nom: ['château', 'lune', 'girafe', 'cahier', 'forêt', 'musique', 'pirate', 'nuage'],
    verbe: ['courir', 'dessine', 'chantons', 'mangeait', 'partir', 'rêvent', 'nage', 'construire'],
    adjectif: ['joyeux', 'immense', 'rouge', 'rapide', 'douce', 'étrange', 'minuscule', 'brillant'],
    déterminant: ['le', 'une', 'des', 'ces', 'mon', 'leurs', 'cette', 'un'],
    pronom: ['il', 'nous', 'elles', 'tu', 'je', 'vous', 'on', 'ils'],
    adverbe: ['vite', 'très', 'souvent', 'hier', 'loin', 'bien', 'toujours', 'demain'] } }
};
const COL = { pinceau: 0, peint: {}, verifie: false };
function hasardC(graine) { let a = graine >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- Mandalas ----------
function mandala(graine, sym, anneaux) {
  const h = hasardC(graine); const R = 300, c = 310; const zones = []; let n = 0;
  const pt = (r, a) => [(c + r * Math.cos(a)).toFixed(1), (c + r * Math.sin(a)).toFixed(1)];
  const ajout = (d) => zones.push(`<path id="z${n++}" d="${d}"/>`);
  const bords = [0.14]; for (let i = 0; i < anneaux; i++) bords.push(0.14 + (0.86 * (i + 1)) / anneaux);
  ajout(`M${c - R * 0.14} ${c}a${R * 0.14} ${R * 0.14} 0 1 0 ${2 * R * 0.14} 0a${R * 0.14} ${R * 0.14} 0 1 0 ${-2 * R * 0.14} 0z`);
  for (let i = 0; i < anneaux; i++) {
    const r1 = R * bords[i], r2 = R * bords[i + 1]; const k = sym * (h() < 0.35 && i > 0 ? 2 : 1); const pas = (2 * Math.PI) / k; const dec = h() < 0.5 ? pas / 2 : 0;
    const type = ['secteurs', 'petales', 'gouttes', 'cercles', 'ecailles'][Math.floor(h() * 5)];
    // fond de l'anneau, découpé en secteurs (toujours coloriable)
    for (let j = 0; j < k; j++) { const a1 = j * pas + dec, a2 = a1 + pas; const [x1, y1] = pt(r1, a1), [x2, y2] = pt(r2, a1), [x3, y3] = pt(r2, a2), [x4, y4] = pt(r1, a2); ajout(`M${x1} ${y1}L${x2} ${y2}A${r2} ${r2} 0 0 1 ${x3} ${y3}L${x4} ${y4}A${r1} ${r1} 0 0 0 ${x1} ${y1}z`); }
    if (type === 'secteurs') continue;
    for (let j = 0; j < k; j++) {
      const a = j * pas + dec + pas / 2; const m = (r1 + r2) / 2; const w = pas * 0.42;
      if (type === 'petales') { const [ax, ay] = pt(r1, a - w), [bx, by] = pt(r2 * 0.98, a), [cx, cy] = pt(r1, a + w), [q1x, q1y] = pt(r2 * 0.9, a - w * 0.9), [q2x, q2y] = pt(r2 * 0.9, a + w * 0.9); ajout(`M${ax} ${ay}Q${q1x} ${q1y} ${bx} ${by}Q${q2x} ${q2y} ${cx} ${cy}z`); }
      else if (type === 'gouttes') { const [ax, ay] = pt(r2 * 0.95, a), [bx, by] = pt(r1 + (r2 - r1) * 0.15, a - w * 0.7), [cx, cy] = pt(r1 + (r2 - r1) * 0.15, a + w * 0.7), [qx, qy] = pt(r1 - (r2 - r1) * 0.1, a); ajout(`M${ax} ${ay}L${bx} ${by}Q${qx} ${qy} ${cx} ${cy}z`); }
      else if (type === 'cercles') { const rr = Math.min((r2 - r1) * 0.38, m * Math.sin(pas / 2) * 0.8); const [x, y] = pt(m, a); ajout(`M${(x - rr).toFixed(1)} ${y}a${rr.toFixed(1)} ${rr.toFixed(1)} 0 1 0 ${(2 * rr).toFixed(1)} 0a${rr.toFixed(1)} ${rr.toFixed(1)} 0 1 0 ${(-2 * rr).toFixed(1)} 0z`); }
      else { const [ax, ay] = pt(r1, a - pas / 2), [bx, by] = pt(r1, a + pas / 2), [cx, cy] = pt(r2 * 0.96, a); ajout(`M${ax} ${ay}Q${cx} ${cy} ${bx} ${by}z`); }
    }
  }
  return { zones, n };
}

// ---------- Pixel art : zones (morceaux d'une même couleur qui se touchent) ----------
function grille(sprite) { const larg = Math.max(...sprite.lignes.map((l) => l.length)); return sprite.lignes.map((l) => l.padEnd(larg, '.').split('')); }
function regions(g) {
  const H = g.length, W = g[0].length; const id = g.map((r) => r.map(() => -1)); const liste = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (id[y][x] >= 0) continue; const ch = g[y][x]; const n = liste.length; const cases = []; const pile = [[x, y]]; id[y][x] = n;
    while (pile.length) { const [a, b] = pile.pop(); cases.push([a, b]); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const u = a + dx, v = b + dy; if (u >= 0 && v >= 0 && u < W && v < H && id[v][u] < 0 && g[v][u] === ch) { id[v][u] = n; pile.push([u, v]); } } }
    const cx = cases.reduce((s, c) => s + c[0], 0) / cases.length, cy = cases.reduce((s, c) => s + c[1], 0) / cases.length;
    const centre = cases.slice().sort((p, q) => Math.hypot(p[0] - cx, p[1] - cy) - Math.hypot(q[0] - cx, q[1] - cy))[0];
    liste.push({ ch, cases, centre });
  }
  return { id, liste };
}
// Pour le coloriage magique : les grandes zones sont coupées en morceaux d'une dizaine de cases,
// chacun avec son calcul (plus d'exercices, et des étiquettes bien lisibles).
function decouper(r, g) {
  const H = g.length, W = g[0].length; const id = g.map((l) => l.map(() => -1)); const liste = []; const TAILLE = 9;
  for (const z of r.liste) {
    const reste = new Set(z.cases.map(([x, y]) => x + ',' + y));
    while (reste.size) {
      const depart = reste.values().next().value; const file = [depart]; const morceau = []; reste.delete(depart);
      while (file.length && morceau.length < TAILLE) {
        const k = file.shift(); morceau.push(k.split(',').map(Number));
        const [x, y] = morceau[morceau.length - 1];
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const kk = (x + dx) + ',' + (y + dy); if (reste.has(kk)) { reste.delete(kk); file.push(kk); } }
      }
      file.forEach((k) => reste.add(k)); // pas pris dans ce morceau : pour le suivant
      const n = liste.length; morceau.forEach(([x, y]) => { id[y][x] = n; });
      const cx = morceau.reduce((s2, c) => s2 + c[0], 0) / morceau.length, cy = morceau.reduce((s2, c) => s2 + c[1], 0) / morceau.length;
      liste.push({ ch: z.ch, cases: morceau, centre: morceau.slice().sort((p, q) => Math.hypot(p[0] - cx, p[1] - cy) - Math.hypot(q[0] - cx, q[1] - cy))[0] });
    }
  }
  return { id, liste };
}
// Associe à chaque couleur du dessin une valeur (nombre ou catégorie) et une étiquette pour chaque zone.
function preparerMagie(sprite, type, graine) {
  const h = hasardC(graine); const m = MAGIE[type]; const chars = Object.keys(sprite.couleurs);
  const valeurs = {}; chars.forEach((ch, i) => { valeurs[ch] = m.valeurs[i % m.valeurs.length]; });
  const g = grille(sprite); const r = decouper(regions(g), g);
  const etiq = r.liste.map((z) => (m.categories ? m.mots[valeurs[z.ch]][Math.floor(h() * m.mots[valeurs[z.ch]].length)] : m.etiquette(valeurs[z.ch], h)));
  return { g, r, valeurs, etiq };
}

function vueColoriages() {
  const v = S.vue; const mode = v.mode || 'accueil';
  if (mode === 'accueil') {
    return `<div class="section coloriages">${entete('Coloriages')}
      <div class="panneau affiche-coloriage"><div class="grow"><h3>À tes feutres !</h3><p class="muet" style="margin:4px 0 0">Choisis un coloriage : Flocon l’imprime pour que tu le colories en vrai. Tu peux aussi le colorier ici.</p></div><div class="grande-e">🖍️</div></div>
      <div class="grille-coloriages">
        <button class="carte-coloriage" data-a="colMode" data-m="magique"><span class="e">✨</span><b>Coloriage magique</b><span class="muet">Calcule ou conjugue pour trouver la couleur.</span></button>
        <button class="carte-coloriage" data-a="colMode" data-m="mandala"><span class="e">🌸</span><b>Mandala</b><span class="muet">Un nouveau à chaque fois, aussi compliqué que tu veux.</span></button>
        <button class="carte-coloriage" data-a="colMode" data-m="pixel"><span class="e">👾</span><b>Pixel art à numéros</b><span class="muet">Case par case, un dessin apparaît.</span></button>
      </div></div>`;
  }
  const graine = v.graine || (v.graine = Math.floor(Math.random() * 1e9));
  if (mode === 'mandala') {
    const sym = v.sym || 8, an = v.anneaux || 4; const m = mandala(graine, sym, an);
    return `<div class="section coloriages">${entete('Mandala', '<button class="btn petit" style="background:#F28C28" data-a="colImprimer">🖨 Imprimer pour colorier aux feutres</button>')}
      <div class="atelier-coloriage"><div class="feuille-coloriage" id="col-feuille"><svg viewBox="0 0 620 620" class="mandala" id="col-svg">${m.zones.join('')}</svg></div>
      <div class="panneau outils-coloriage">
        <div class="reglage"><b>Symétrie</b><span class="rang">${[6, 8, 12].map((x) => `<button class="puce ${sym === x ? 'on' : ''}" data-a="colSym" data-s="${x}">${x}</button>`).join('')}</span></div>
        <div class="reglage"><b>Difficulté</b><span class="rang">${[[3, 'Facile'], [4, 'Moyen'], [6, 'Expert']].map(([x, nom]) => `<button class="puce ${an === x ? 'on' : ''}" data-a="colAnneaux" data-n="${x}">${nom}</button>`).join('')}</span></div>
        <button class="btn doux" data-a="colNouveau">🎲 Un autre mandala</button>
        <div class="reglage"><b>Colorier ici</b>${paletteColoriage(PALETTE_LIBRE)}</div>
        <button class="btn doux" data-a="colGarder">💾 Garder dans ma galerie</button></div></div></div>`;
  }
  // pixel ou magique : un dessin en pixels
  const cles = Object.keys(SPRITES); const sp = v.sprite || cles[graine % cles.length]; const sprite = SPRITES[sp];
  const type = v.magie || 'tables25'; const magique = mode === 'magique';
  const chars = Object.keys(sprite.couleurs);
  const prep = magique ? preparerMagie(sprite, type, graine) : { g: grille(sprite), r: regions(grille(sprite)) };
  const legende = magique ? chars.map((ch, i) => `<button class="leg ${COL.pinceau === i ? 'on' : ''}" data-a="colPinceau" data-i="${i}"><span class="pastille" style="background:${sprite.couleurs[ch]}"></span><b>${esc(String(prep.valeurs[ch]))}</b></button>`).join('')
    : chars.map((ch, i) => `<button class="leg ${COL.pinceau === i ? 'on' : ''}" data-a="colPinceau" data-i="${i}"><span class="pastille" style="background:${sprite.couleurs[ch]}"></span><b>${i + 1}</b></button>`).join('');
  return `<div class="section coloriages">${entete(magique ? 'Coloriage magique' : 'Pixel art à numéros', '<button class="btn petit" style="background:#F28C28" data-a="colImprimer">🖨 Imprimer pour colorier aux feutres</button>')}
    <div class="atelier-coloriage"><div class="feuille-coloriage" id="col-feuille">${grillePixelSvg(prep, sprite, magique)}</div>
    <div class="panneau outils-coloriage">
      ${magique ? `<div class="reglage"><b>Le défi</b><span class="rang wrap">${Object.entries(MAGIE).map(([k, x]) => `<button class="puce ${type === k ? 'on' : ''}" data-a="colMagie" data-t="${k}">${esc(x.nom)}</button>`).join('')}</span></div>` : ''}
      <div class="reglage"><b>Le dessin</b><span class="rang wrap">${cles.map((k) => `<button class="puce ${sp === k ? 'on' : ''}" data-a="colSprite" data-s="${k}">${esc(SPRITES[k].nom)}</button>`).join('')}</span></div>
      <div class="reglage"><b>${magique ? 'Le code des couleurs' : 'Les couleurs'}</b><div class="legende-col">${legende}</div></div>
      <p class="muet" style="margin:0">${magique ? 'Trouve le résultat de chaque zone, puis touche-la avec la bonne couleur.' : 'Choisis une couleur, puis touche (ou glisse sur) les cases qui portent son numéro.'}</p>
      <div class="rang"><button class="btn doux" data-a="colVerifier">✓ Vérifier</button><button class="btn doux" data-a="colGarder">💾 Garder</button></div>
      <div id="col-bilan"></div></div></div></div>`;
}
function paletteColoriage(l) { return `<div class="palette-col">${l.map((c, i) => `<button class="${COL.pinceau === i ? 'on' : ''}" style="background:${c}" data-a="colPinceau" data-i="${i}" aria-label="Couleur"></button>`).join('')}</div>`; }
function grillePixelSvg(prep, sprite, magique, impression) {
  const { g, r } = prep; const H = g.length, W = g[0].length; const T = 40; const chars = Object.keys(sprite.couleurs);
  let cases = ''; let textes = '';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const z = r.id[y][x]; const cle = magique ? 'z' + z : x + '-' + y; const peint = !impression && COL.peint[cle];
    cases += `<rect x="${x * T}" y="${y * T}" width="${T}" height="${T}" data-c="${x}-${y}" data-z="${z}" style="fill:${peint || '#fff'}" class="${magique ? 'mz' : 'px'}"/>`;
    if (!magique) textes += `<text x="${x * T + T / 2}" y="${y * T + T / 2 + 5}">${chars.indexOf(g[y][x]) + 1}</text>`;
  }
  if (magique) r.liste.forEach((z, i) => {
    // l'étiquette s'étale sur les cases voisines du même morceau, et se resserre si besoin
    const [x0, y] = z.centre; let a = x0, b = x0; while (a - 1 >= 0 && r.id[y][a - 1] === i) a--; while (b + 1 < W && r.id[y][b + 1] === i) b++;
    const t = prep.etiq[i]; const place = (b - a + 1) * T - 6; const fs = 13; const large = t.length * fs * 0.56;
    const cx = ((a + b + 1) / 2) * T; const serre = large > place ? ` textLength="${place}" lengthAdjust="spacingAndGlyphs"` : '';
    textes += `<text x="${cx}" y="${y * T + T / 2 + 4.5}" style="font-size:${fs}px"${serre}>${esc(t)}</text>`;
  });
  // contours des zones (traits épais entre deux zones différentes)
  let traits = '';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (x + 1 < W && r.id[y][x] !== r.id[y][x + 1]) traits += `M${(x + 1) * T} ${y * T}v${T}`;
    if (y + 1 < H && r.id[y][x] !== r.id[y + 1][x]) traits += `M${x * T} ${(y + 1) * T}h${T}`;
  }
  return `<svg viewBox="-2 -2 ${W * T + 4} ${H * T + 4}" class="pixels ${magique ? 'magique' : ''}" id="col-svg"><g class="cases">${cases}</g><path class="${magique ? 'traits-zones' : 'traits-fins'}" d="${traits}"/><rect x="0" y="0" width="${W * T}" height="${H * T}" class="cadre"/><g class="nums">${textes}</g></svg>`;
}
function couleurPinceau() {
  const v = S.vue; if (v.mode === 'mandala') return PALETTE_LIBRE[COL.pinceau] || PALETTE_LIBRE[0];
  const cles = Object.keys(SPRITES); const sp = SPRITES[v.sprite || cles[v.graine % cles.length]]; const ch = Object.keys(sp.couleurs)[COL.pinceau] || '.'; return sp.couleurs[ch];
}
// Peindre : clic (et glisser pour le pixel art). Pas de re-rendu à chaque case : on colore directement.
let peintureEnCours = false;
function peindre(cible) {
  const v = S.vue; if (!cible) return; const c = couleurPinceau();
  if (v.mode === 'mandala' && cible.tagName === 'path') { cible.style.fill = c; COL.peint[cible.id] = c; }
  else if (cible.classList.contains('px')) { cible.style.fill = c; COL.peint[cible.dataset.c] = c; }
  else if (cible.classList.contains('mz')) { const z = cible.dataset.z; document.querySelectorAll(`#col-svg rect[data-z="${z}"]`).forEach((e) => { e.style.fill = c; }); COL.peint['z' + z] = c; }
}
document.addEventListener('pointerdown', (e) => { if (!(S.vue && S.vue.ref === 'coloriages')) return; const t = e.target.closest && e.target.closest('#col-svg path, #col-svg rect.px, #col-svg rect.mz'); if (!t) return; peintureEnCours = true; peindre(t); e.preventDefault(); });
document.addEventListener('pointermove', (e) => { if (!peintureEnCours || S.vue.mode !== 'pixel') return; const t = document.elementFromPoint(e.clientX, e.clientY); if (t && t.classList && t.classList.contains('px')) peindre(t); });
document.addEventListener('pointerup', () => { peintureEnCours = false; });

function svgVersPng(svg) {
  return new Promise((ok) => {
    const clone = svg.cloneNode(true); const vb = svg.viewBox.baseVal; const k = 1600 / vb.width;
    clone.setAttribute('width', 1600); clone.setAttribute('height', Math.round(vb.height * k));
    const st = document.createElementNS('http://www.w3.org/2000/svg', 'style'); st.textContent = 'path,rect{stroke:#222;stroke-width:1.5;fill:#fff}.nums text{display:none}.traits-zones{stroke-width:3;fill:none!important}.traits-fins{stroke-width:.5;fill:none!important}.cadre{fill:none!important;stroke-width:3}.pixels rect.px{stroke:#bbb;stroke-width:.5}.pixels.magique rect.mz{stroke:none}';
    clone.insertBefore(st, clone.firstChild);
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
    const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = 1600; c.height = Math.round(vb.height * k); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob(async (b) => ok(new Uint8Array(await b.arrayBuffer())), 'image/png'); };
    img.src = url;
  });
}
function changer(maj) { Object.assign(S.vue, maj); COL.peint = {}; render(); }
Object.assign(A, {
  colMode: (d) => { COL.pinceau = 0; changer({ mode: d.m, graine: Math.floor(Math.random() * 1e9) }); },
  colSym: (d) => changer({ sym: Number(d.s) }),
  colAnneaux: (d) => changer({ anneaux: Number(d.n) }),
  colNouveau: () => changer({ graine: Math.floor(Math.random() * 1e9) }),
  colSprite: (d) => changer({ sprite: d.s }),
  colMagie: (d) => changer({ magie: d.t, graine: Math.floor(Math.random() * 1e9) }),
  colPinceau: (d) => { COL.pinceau = Number(d.i); document.querySelectorAll('[data-a="colPinceau"]').forEach((b) => b.classList.toggle('on', b.dataset.i === d.i)); },
  colVerifier: () => {
    const v = S.vue; const cles = Object.keys(SPRITES); const sp = SPRITES[v.sprite || cles[v.graine % cles.length]];
    const prep = v.mode === 'magique' ? preparerMagie(sp, v.magie || 'tables25', v.graine) : { g: grille(sp), r: regions(grille(sp)) };
    let bon = 0, faux = 0, vides = 0; document.querySelectorAll('#col-svg .faux').forEach((e) => e.classList.remove('faux'));
    if (v.mode === 'magique') prep.r.liste.forEach((z, i) => { const c = COL.peint['z' + i]; const att = sp.couleurs[z.ch]; if (!c) vides++; else if (c === att) bon++; else { faux++; document.querySelectorAll(`#col-svg rect[data-z="${i}"]`).forEach((e) => e.classList.add('faux')); } });
    else prep.g.forEach((l, y) => l.forEach((ch, x) => { const c = COL.peint[x + '-' + y]; if (!c) vides++; else if (c === sp.couleurs[ch]) bon++; else { faux++; const e = document.querySelector(`#col-svg rect[data-c="${x}-${y}"]`); if (e) e.classList.add('faux'); } }));
    const b = document.getElementById('col-bilan');
    if (b) b.innerHTML = !faux && !vides ? `<div class="bravo-col">${pluieDeFlocons(20)}<b>🎉 Parfait, tout est juste !</b></div>` : `<p class="muet">${bon} juste${bon > 1 ? 's' : ''}${faux ? `, <b>${faux} à revoir</b> (entourées en rouge)` : ''}${vides ? `, ${vides} pas encore coloriée${vides > 1 ? 's' : ''}` : ''}.</p>`;
  },
  colGarder: async () => {
    const svg = document.getElementById('col-svg'); if (!svg) return;
    const r = await F.creationPhoto('Coloriage ' + new Date().toLocaleDateString('fr-FR').replace(/\//g, '-'), await svgVersPng(svg), 'png');
    toast(r && r.ok ? 'Ton coloriage est dans ta galerie !' : 'Je n’ai pas pu le garder.');
  },
  colImprimer: async () => {
    const v = S.vue; const svg = document.getElementById('col-svg'); if (!svg) return;
    const clone = svg.cloneNode(true); clone.querySelectorAll('[style]').forEach((e) => { e.style.fill = ''; }); clone.querySelectorAll('.faux').forEach((e) => e.classList.remove('faux'));
    let legende = '';
    if (v.mode !== 'mandala') {
      const cles = Object.keys(SPRITES); const sp = SPRITES[v.sprite || cles[v.graine % cles.length]];
      const prep = v.mode === 'magique' ? preparerMagie(sp, v.magie || 'tables25', v.graine) : null;
      legende = `<div class="leg">${Object.keys(sp.couleurs).map((ch, i) => `<span><i style="background:${sp.couleurs[ch]}"></i>${esc(String(prep ? prep.valeurs[ch] : i + 1))}</span>`).join('')}</div>`;
    }
    const titre = v.mode === 'mandala' ? 'Mandala' : v.mode === 'magique' ? 'Coloriage magique · ' + MAGIE[v.magie || 'tables25'].nom : 'Pixel art à numéros';
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><style>@page{size:A4;margin:12mm}body{font-family:sans-serif;margin:0;text-align:center}
      h1{font-size:18pt;margin:0 0 4mm}svg{width:180mm;height:auto;max-height:220mm}path,rect{stroke:#222;stroke-width:1.5;fill:#fff}.traits-zones{stroke-width:3.5;fill:none}.traits-fins{stroke-width:.6;fill:none}.cadre{fill:none;stroke-width:3}
      text{text-anchor:middle;font:600 13px sans-serif;fill:#555}.magique text{fill:#222;font-weight:700}.pixels rect.px{stroke:#999;stroke-width:.6}.pixels.magique rect.mz{stroke:none}
      .leg{display:flex;flex-wrap:wrap;gap:5mm;justify-content:center;margin-top:5mm;font-size:13pt}.leg i{display:inline-block;width:9mm;height:9mm;border:1px solid #333;border-radius:2mm;vertical-align:middle;margin-right:2mm}
      .nom{margin-top:6mm;font-size:11pt;color:#666}</style></head><body><h1>${esc(titre)}</h1>${clone.outerHTML}${legende}<div class="nom">Colorié par : ______________________</div></body></html>`;
    const r = await F.fairePdf(titre, html, { imprimer: true });
    toast(r && r.ok ? 'Ton coloriage part à l’imprimante. À tes feutres !' : 'Je n’ai pas pu l’imprimer.', 6000);
  }
});
const fermerVueAvantColoriages = A.fermerVue;
A.fermerVue = async (d) => {
  if (S.vue && S.vue.ref === 'coloriages' && S.vue.mode && S.vue.mode !== 'accueil') { COL.peint = {}; S.vue = { ref: 'coloriages' }; render(); return; }
  fermerVueAvantColoriages(d);
};
