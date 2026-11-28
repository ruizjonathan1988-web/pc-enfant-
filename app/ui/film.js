'use strict';
// ======================================================================
// MON STUDIO DE FILMS : stop motion dans Flocon
// Prise de vue à la webcam (ou photos de son appareil), pelure d'oignon,
// fond vert avec décors, filtres, musiques composées ici, sa voix,
// générique, puis une vraie vidéo dans sa galerie.
// Un dossier par film dans Documents, « Mes animations » : rien ne sort de l'ordinateur.
// ======================================================================
/* global S, F, A, SAISIES, esc, entete, toast, render, pluieDeFlocons, ouvrirVue */

const FILM = {
  flux: null, cameras: [], camera: 0, erreurCam: '', id: null, p: null, imgs: {}, sel: -1,
  lecture: null, auto: null, compte: false, export: null, voix: null, onglet: 'vert', decor: null,
  decors: null, photos: null, choix: [], pipette: false, fini: null, cache: null, aSupprimer: null, astuce: 0
};
const FW = 960, FH = 720, DW = 640, DH = 480;
const VITESSES = [{ fps: 5, nom: 'Tortue', e: '🐢' }, { fps: 8, nom: 'Normal', e: '🚶' }, { fps: 12, nom: 'Lapin', e: '🐇' }];
const FILTRES = [
  { id: 'normal', nom: 'Normal', e: '🎬' }, { id: 'vieux', nom: 'Vieux film', e: '🎞️' }, { id: 'nb', nom: 'Noir et blanc', e: '🖤' },
  { id: 'bd', nom: 'Bande dessinée', e: '💥' }, { id: 'nuit', nom: 'La nuit', e: '🌙' }, { id: 'reve', nom: 'Rêve', e: '☁️' }
];
const MUSIQUES = {
  aucune: { nom: 'Pas de musique', e: '🔇' },
  joyeuse: { nom: 'Joyeuse', e: '☀️', bpm: 132, onde: 'triangle', racine: 60, vol: 0.16, notes: [0, 4, 7, 4, 5, 9, 12, 9, 7, 4, 0, 4, 2, 5, 7, 11], basse: [0, 0, 5, 5, 7, 7, 0, 0], tambour: true },
  mystere: { nom: 'Mystère', e: '🔮', bpm: 84, onde: 'sine', racine: 57, vol: 0.2, notes: [0, 3, 7, 3, 8, 7, 3, 2, 0, 3, 7, 10, 8, 7, 3, -1], basse: [0, 0, -4, -4, -5, -5, 0, 0] },
  aventure: { nom: 'Aventure', e: '🏴‍☠️', bpm: 120, onde: 'square', racine: 55, vol: 0.07, notes: [0, 0, 7, 7, 5, 4, 2, 0, 3, 3, 10, 10, 8, 7, 5, 7], basse: [0, 0, -4, -4, -2, -2, -5, -5], tambour: true },
  rigolote: { nom: 'Rigolote', e: '🤪', bpm: 150, onde: 'square', racine: 62, vol: 0.06, notes: [0, 12, 0, 12, 7, null, 7, null, 5, 4, 3, 2, 0, null, 7, 0], basse: [0, 7, 0, 7, 5, 0, 7, 0], tambour: true },
  douce: { nom: 'Toute douce', e: '🌸', bpm: 96, onde: 'sine', racine: 64, vol: 0.2, notes: [0, null, 4, 7, 12, null, 7, 4, 5, null, 9, 12, 7, null, 4, 2], basse: [0, 0, 5, 5, -3, -3, -5, -5] }
};
const COULEURS_FILM = ['#E0457B', '#7C5CFA', '#2B7BD6', '#13A39F', '#F28C28', '#1E2A4A'];
const ASTUCES = [
  'Bouge ton personnage tout petit à chaque photo : c’est ça qui rend le film fluide.',
  'La caméra ne doit jamais bouger. Pose-la sur quelque chose de stable.',
  'Pour qu’un personnage reste immobile, prends deux ou trois photos sans rien toucher.',
  'Avec le retardateur, tu as le temps de retirer ta main avant la photo.',
  'Pâte à modeler : la photo automatique te laisse les mains libres.',
  'Pour un saut, monte le personnage en plusieurs photos, puis redescends-le.',
  'Regarde l’image fantôme : elle te montre où était ton personnage juste avant.',
  'Douze photos, c’est une seconde de film en mode lapin.',
  'Fond vert : éclaire bien le tissu, sans ombre, et ne porte rien de vert !'
];

// ---------- Décors dessinés par Flocon (toujours là, même sans images) ----------
function hasard(graine) { let a = graine; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function degrade(ctx, w, h, haut, bas) { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, haut); g.addColorStop(1, bas); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
const DECORS_DESSINES = {
  espace: { nom: 'L’espace', dessin(ctx, w, h) {
    const r = hasard(7); degrade(ctx, w, h, '#0B0B2E', '#2A1B5C');
    for (let i = 0; i < 220; i++) { ctx.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`; ctx.beginPath(); ctx.arc(r() * w, r() * h * 0.75, r() * 1.8 + 0.3, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#F2B33D'; ctx.beginPath(); ctx.arc(w * 0.78, h * 0.25, h * 0.11, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,214,140,.8)'; ctx.lineWidth = h * 0.018; ctx.beginPath(); ctx.ellipse(w * 0.78, h * 0.25, h * 0.2, h * 0.05, -0.35, 0, 7); ctx.stroke();
    degrade2(ctx, 0, h * 0.7, w, h * 0.3, '#8E8AA8', '#56526E');
    ctx.fillStyle = 'rgba(40,36,60,.35)'; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse(r() * w, h * 0.74 + r() * h * 0.24, 20 + r() * 50, 6 + r() * 12, 0, 0, 7); ctx.fill(); }
  } },
  mer: { nom: 'Sous la mer', dessin(ctx, w, h) {
    const r = hasard(3); degrade(ctx, w, h, '#3FC1E0', '#0B4F8A');
    ctx.fillStyle = 'rgba(255,255,255,.10)'; for (let i = 0; i < 6; i++) { const x = r() * w; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 60, 0); ctx.lineTo(x - 80 + r() * 60, h); ctx.lineTo(x - 160, h); ctx.fill(); }
    degrade2(ctx, 0, h * 0.72, w, h * 0.28, '#F4D9A0', '#D9B56E');
    ['#E0457B', '#F28C28', '#7C5CFA'].forEach((c, k) => { ctx.fillStyle = c; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc((k === 1 ? 0.92 : 0.06 + k * 0.04) * w + i * 14, h * 0.72 - i * 26, 18 - i * 2, 0, 7); ctx.fill(); } });
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; for (let i = 0; i < 18; i++) { ctx.beginPath(); ctx.arc(r() * w, r() * h * 0.7, 3 + r() * 8, 0, 7); ctx.stroke(); }
  } },
  ciel: { nom: 'La campagne', dessin(ctx, w, h) {
    const r = hasard(11); degrade(ctx, w, h, '#7CC8F5', '#D8F0FF');
    ctx.fillStyle = '#FFE07A'; ctx.beginPath(); ctx.arc(w * 0.85, h * 0.18, h * 0.08, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; for (let i = 0; i < 4; i++) { const x = r() * w, y = h * (0.12 + r() * 0.3); [0, 30, 60].forEach((d, k) => { ctx.beginPath(); ctx.arc(x + d, y - (k === 1 ? 14 : 0), 26, 0, 7); ctx.fill(); }); }
    ctx.fillStyle = '#7BC96F'; ctx.beginPath(); ctx.ellipse(w * 0.25, h * 0.78, w * 0.5, h * 0.18, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#5DB35A'; ctx.beginPath(); ctx.ellipse(w * 0.8, h * 0.82, w * 0.5, h * 0.2, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#4A9E47'; ctx.fillRect(0, h * 0.86, w, h * 0.14);
  } },
  nuit: { nom: 'La ville la nuit', dessin(ctx, w, h) {
    const r = hasard(5); degrade(ctx, w, h, '#101A3C', '#3B2F6B');
    ctx.fillStyle = '#FFF4C8'; ctx.beginPath(); ctx.arc(w * 0.2, h * 0.18, h * 0.07, 0, 7); ctx.fill();
    for (let i = 0; i < 80; i++) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(r() * w, r() * h * 0.4, 2, 2); }
    let x = 0; while (x < w) { const bw = 60 + r() * 90, bh = h * (0.25 + r() * 0.35); ctx.fillStyle = '#1B2350'; ctx.fillRect(x, h * 0.8 - bh, bw - 6, bh);
      for (let yy = h * 0.8 - bh + 12; yy < h * 0.78; yy += 22) for (let xx = x + 8; xx < x + bw - 18; xx += 18) if (r() > 0.45) { ctx.fillStyle = '#F7D774'; ctx.fillRect(xx, yy, 9, 12); }
      x += bw; }
    ctx.fillStyle = '#2C2C3A'; ctx.fillRect(0, h * 0.8, w, h * 0.2); ctx.fillStyle = '#F7D774'; for (let i = 0; i < w; i += 90) ctx.fillRect(i, h * 0.9, 46, 6);
  } },
  bonbon: { nom: 'Le pays des bonbons', dessin(ctx, w, h) {
    const r = hasard(9); degrade(ctx, w, h, '#FFD1E8', '#C9B8FF');
    for (let i = 0; i < 40; i++) { ctx.fillStyle = ['#FF8FC4', '#8FD3FF', '#FFE58F', '#B8FFA8'][i % 4]; ctx.beginPath(); ctx.arc(r() * w, r() * h * 0.7, 6 + r() * 16, 0, 7); ctx.fill(); }
    degrade2(ctx, 0, h * 0.74, w, h * 0.26, '#FF9CCB', '#E86AA8');
    for (let i = 0; i < w; i += 40) { ctx.fillStyle = i % 80 ? '#fff' : '#FF5FA2'; ctx.fillRect(i, h * 0.74, 40, 10); }
  } }
};
function degrade2(ctx, x, y, w, h, a, b) { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); }
const toilesDecor = {};
function toileDessinee(ref) { if (!toilesDecor[ref]) { const c = document.createElement('canvas'); c.width = FW; c.height = FH; DECORS_DESSINES[ref].dessin(c.getContext('2d'), FW, FH); toilesDecor[ref] = c; } return toilesDecor[ref]; }

// ---------- Petits outils ----------
const versOctets = (r) => (r && !r.erreur ? (r instanceof Uint8Array ? r : new Uint8Array(r)) : null);
async function bitmapDe(octets, type) { return createImageBitmap(new Blob([octets], { type: type || 'image/jpeg' })); }
function couvrir(ctx, src, sw, sh, w, h) { const k = Math.max(w / sw, h / sh); const dw = sw * k, dh = sh * k; ctx.drawImage(src, (w - dw) / 2, (h - dh) / 2, dw, dh); }
const tailleDe = (s) => [s.videoWidth || s.width, s.videoHeight || s.height];
const nomNeuf = (prefixe, ext) => prefixe + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36) + '.' + ext;
const filmPrenom = () => (S.profil && S.profil.prenom) || 'moi';
function bip(freq, duree, vol) { try { const ctx = new AudioContext(); const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = freq; g.gain.setValueAtTime(vol || 0.15, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duree); o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + duree); setTimeout(() => ctx.close(), duree * 1000 + 200); } catch (e) { /* rien */ } }
function declic() {
  try { const ctx = new AudioContext(); const n = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate); const d = n.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = n; g.gain.value = 0.35; s.connect(g).connect(ctx.destination); s.start(); setTimeout(() => ctx.close(), 400); } catch (e) { /* rien */ }
}
const filmSauver = (() => { let t = null; return () => { if (!FILM.p) return; FILM.p.modifie = new Date().toISOString(); const id = FILM.id, p = JSON.parse(JSON.stringify(FILM.p)); clearTimeout(t); t = setTimeout(() => F.animProjet(id, p), 300); }; })();
function projetNeuf(titre) { return { titre: titre || 'Mon film', fps: 8, images: [], filtre: 'normal', musique: 'aucune', voix: '', generique: true, fin: true, couleur: COULEURS_FILM[Math.floor(Math.random() * COULEURS_FILM.length)], vert: { actif: false, couleur: [40, 170, 70], tolerance: 0.4, decor: { type: 'dessine', ref: 'espace' } }, cree: new Date().toISOString(), modifie: new Date().toISOString() }; }

// ---------- Fond vert : on efface la couleur choisie et on met le décor dessous ----------
function detourer(img, cle, tol) {
  const d = img.data; const [kr, kg, kb] = cle;
  const kcb = -0.169 * kr - 0.331 * kg + 0.5 * kb, kcr = 0.5 * kr - 0.419 * kg - 0.081 * kb;
  const a0 = 18 + tol * 90, a1 = a0 + 26;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const cb = -0.169 * r - 0.331 * g + 0.5 * b, cr = 0.5 * r - 0.419 * g - 0.081 * b;
    const dist = Math.hypot(cb - kcb, cr - kcr);
    const a = dist <= a0 ? 0 : dist >= a1 ? 1 : (dist - a0) / (a1 - a0);
    if (a < 1) { const m = Math.max(r, b); if (g > m) d[i + 1] = m; }
    d[i + 3] = a * 255;
  }
}
const toileTemp = {};
function temp(nom, w, h) { let c = toileTemp[nom]; if (!c) c = toileTemp[nom] = document.createElement('canvas'); if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } return c; }
function sourceDecor() {
  const d = FILM.p && FILM.p.vert.decor;
  if (!d) return null;
  if (d.type === 'dessine') return DECORS_DESSINES[d.ref] ? toileDessinee(d.ref) : null;
  return FILM.decor && FILM.decor.chemin === d.chemin ? FILM.decor.bmp : null;
}
async function chargerDecor() {
  const d = FILM.p && FILM.p.vert.decor;
  if (!d || d.type !== 'fichier' || (FILM.decor && FILM.decor.chemin === d.chemin)) return;
  const o = versOctets(await F.lireOctets(d.chemin));
  if (o) FILM.decor = { chemin: d.chemin, bmp: await bitmapDe(o, /\.png$/i.test(d.chemin) ? 'image/png' : 'image/jpeg') };
}
// Compose une image (photo ou caméra) : fond vert éventuel, puis filtre.
function composer(ctx, src, w, h, t, sansFiltre) {
  const p = FILM.p; const [sw, sh] = tailleDe(src);
  const c = temp('compo' + w, w, h), cx = c.getContext('2d', { willReadFrequently: true });
  cx.clearRect(0, 0, w, h);
  if (p.vert.actif) {
    const t2 = temp('detour' + w, w, h), tx = t2.getContext('2d', { willReadFrequently: true });
    tx.clearRect(0, 0, w, h); couvrir(tx, src, sw, sh, w, h);
    const im = tx.getImageData(0, 0, w, h); detourer(im, p.vert.couleur, p.vert.tolerance); tx.putImageData(im, 0, 0);
    const dec = sourceDecor(); if (dec) couvrir(cx, dec, dec.width, dec.height, w, h); else { cx.fillStyle = '#222'; cx.fillRect(0, 0, w, h); }
    cx.drawImage(t2, 0, 0);
  } else couvrir(cx, src, sw, sh, w, h);
  if (sansFiltre) ctx.drawImage(c, 0, 0); else filtrer(ctx, c, w, h, t || 0);
}
function filtrer(ctx, src, w, h, t) {
  const f = (FILM.p && FILM.p.filtre) || 'normal';
  const css = { normal: 'none', vieux: 'sepia(.85) contrast(1.15) brightness(' + (0.94 + 0.06 * Math.sin(t * 37)) + ')', nb: 'grayscale(1) contrast(1.25)', bd: 'saturate(1.9) contrast(1.35)', nuit: 'brightness(.72) saturate(.7)', reve: 'blur(1.2px) saturate(1.3) brightness(1.08)' }[f] || 'none';
  ctx.save(); ctx.filter = css; ctx.drawImage(src, 0, 0, w, h); ctx.restore();
  if (f === 'vieux') {
    const r = hasard(Math.floor(t * 24) + 1);
    ctx.fillStyle = 'rgba(40,25,10,.25)'; for (let i = 0; i < 260; i++) ctx.fillRect(r() * w, r() * h, 1.6, 1.6);
    if (r() > 0.4) { ctx.fillStyle = 'rgba(255,245,220,.35)'; ctx.fillRect(r() * w, 0, 1.5, h); }
    vignette(ctx, w, h, 0.55);
  } else if (f === 'nuit') { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgb(90,110,200)'; ctx.fillRect(0, 0, w, h); ctx.restore(); vignette(ctx, w, h, 0.4); }
  else if (f === 'reve') { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(255,190,230,.18)'; ctx.fillRect(0, 0, w, h); ctx.restore(); vignette(ctx, w, h, 0.25, '255,255,255'); }
  else if (f === 'bd') vignette(ctx, w, h, 0.25);
}
function vignette(ctx, w, h, force, couleur) { const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.85); g.addColorStop(0, `rgba(${couleur || '0,0,0'},0)`); g.addColorStop(1, `rgba(${couleur || '0,0,0'},${force})`); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }

// ---------- Générique ----------
function carte(ctx, w, h, type, u, t) {
  const p = FILM.p; const c = temp('carte' + w, w, h), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, p.couleur); g.addColorStop(1, '#1E2A4A'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  const r = hasard(type === 'fin' ? 4 : 2);
  for (let i = 0; i < 26; i++) { const px = r() * w, py = r() * h, s = 10 + r() * 22; x.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(t * 2 + i)); x.fillStyle = '#fff'; x.font = `${s}px sans-serif`; x.fillText('❄', px, py + Math.sin(t + i) * 6); }
  x.globalAlpha = 1;
  const pop = (v) => { const s = 1.70158; v = Math.min(1, Math.max(0, v)) - 1; return v * v * ((s + 1) * v + s) + 1; };
  const k = pop(u * 2.4);
  x.save(); x.translate(w / 2, h * 0.46); x.scale(k, k); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff';
  x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 18;
  const texte = type === 'fin' ? 'Fin' : p.titre || 'Mon film';
  let taille = Math.round(h * (type === 'fin' ? 0.2 : 0.13)); x.font = `800 ${taille}px Outfit, sans-serif`;
  while (x.measureText(texte).width > w * 0.86 && taille > 20) { taille -= 4; x.font = `800 ${taille}px Outfit, sans-serif`; }
  x.fillText(texte, 0, 0); x.restore();
  x.globalAlpha = Math.min(1, Math.max(0, (u - 0.3) * 3)); x.textAlign = 'center'; x.fillStyle = '#fff'; x.font = `700 ${Math.round(h * 0.05)}px Jakarta, sans-serif`;
  x.fillText('Un film de ' + filmPrenom(), w / 2, h * 0.68); x.globalAlpha = 1;
  filtrer(ctx, c, w, h, t);
}
const DUREE_CARTE = 2.2;
function segments(p) {
  const s = []; let t = 0;
  const ajout = (x) => { x.debut = t; t += x.d; s.push(x); };
  if (p.generique) ajout({ type: 'titre', d: DUREE_CARTE });
  p.images.forEach((nom, i) => ajout({ type: 'image', nom, i, d: 1 / p.fps }));
  if (p.fin) ajout({ type: 'fin', d: DUREE_CARTE });
  return { s, duree: t };
}
function dessinerA(ctx, w, h, t, segs) {
  const seg = segs.s.find((x) => t >= x.debut && t < x.debut + x.d) || segs.s[segs.s.length - 1];
  if (!seg) return null;
  if (seg.type === 'image') {
    const im = FILM.imgs[seg.nom];
    if (!im) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h); return seg; }
    // une même photo dure plusieurs images vidéo : on ne détoure qu'une fois
    const cle = seg.nom + w + JSON.stringify(FILM.p.vert) + FILM.p.filtre;
    if (!FILM.cache || FILM.cache.cle !== cle) { const c = temp('cache' + w, w, h); composer(c.getContext('2d'), im.bmp, w, h, 0, true); FILM.cache = { cle }; }
    filtrer(ctx, temp('cache' + w, w, h), w, h, t);
  } else carte(ctx, w, h, seg.type, (t - seg.debut) / seg.d, t);
  return seg;
}

// ---------- Musiques composées par Flocon (aucun droit d'auteur) ----------
function note(ctx, dest, onde, midi, t, d, v) {
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = onde; o.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(dest); o.start(t); o.stop(t + d + 0.03);
}
function tambour(ctx, dest, t) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.14); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18); o.connect(g).connect(dest); o.start(t); o.stop(t + 0.2); }
function jouerMusique(ctx, dest, m, t0, duree, vol) {
  if (!m || !m.bpm) return;
  const pas = 60 / m.bpm / 2; const g = ctx.createGain(); const v = (m.vol || 0.12) * (vol || 1);
  g.gain.setValueAtTime(v, t0); g.gain.setValueAtTime(v, Math.max(t0, t0 + duree - 1.2)); g.gain.linearRampToValueAtTime(0.0001, t0 + duree); g.connect(dest);
  for (let i = 0, t = t0; t < t0 + duree; i++, t += pas) {
    const n = m.notes[i % m.notes.length]; if (n !== null) note(ctx, g, m.onde, m.racine + 12 + n, t, pas * 0.9, 1);
    if (i % 2 === 0) { const b = m.basse[(i / 2) % m.basse.length]; if (b !== null) note(ctx, g, 'triangle', m.racine - 12 + b, t, pas * 1.8, 1.4); }
    if (m.tambour && i % 4 === 0) tambour(ctx, g, t);
  }
}
async function voixTampon(ctx) {
  const p = FILM.p; if (!p.voix) return null;
  const o = versOctets(await F.animOctets(FILM.id, p.voix)); if (!o) return null;
  try { return await ctx.decodeAudioData(o.buffer.slice(o.byteOffset, o.byteOffset + o.byteLength)); } catch (e) { return null; }
}
async function preparerSon(ctx, dest, duree, sansVoix) {
  const p = FILM.p; const t0 = ctx.currentTime + 0.05;
  const voix = sansVoix ? null : await voixTampon(ctx);
  if (p.musique && p.musique !== 'aucune') jouerMusique(ctx, dest, MUSIQUES[p.musique], t0, duree, voix ? 0.45 : 1);
  if (voix) { const s = ctx.createBufferSource(); s.buffer = voix; s.connect(dest); s.start(t0); }
  return t0;
}

// ---------- Caméra ----------
async function demarrerCamera() {
  if (FILM.flux || FILM.demarre) return;
  FILM.demarre = true; FILM.erreurCam = '';
  try {
    const tous = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
    FILM.cameras = tous;
    const cam = tous[FILM.camera % Math.max(1, tous.length)];
    FILM.flux = await navigator.mediaDevices.getUserMedia({ audio: false, video: Object.assign({ width: { ideal: 1280 }, height: { ideal: 960 } }, cam && cam.deviceId ? { deviceId: { exact: cam.deviceId } } : {}) });
    if (!FILM.cameras.length || !FILM.cameras[0].label) FILM.cameras = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
  } catch (e) { FILM.erreurCam = 'Je ne trouve pas de caméra. Branche-en une, ou ajoute les photos de ton appareil photo.'; }
  FILM.demarre = false;
  const v = document.getElementById('anim-video'); if (v && FILM.flux) { v.srcObject = FILM.flux; v.play().catch(() => {}); }
  majEcran();
}
function couperCamera() { if (FILM.flux) FILM.flux.getTracks().forEach((t) => t.stop()); FILM.flux = null; }
function arreterTout() { arreterAuto(); arreterLecture(); couperCamera(); FILM.compte = false; FILM.pipette = false; if (typeof fermerDessin === 'function') fermerDessin(); }
let boucleActive = false;
function boucleDirect() {
  if (boucleActive) return; boucleActive = true;
  let dernier = 0;
  const pas = (now) => {
    const c = document.getElementById('anim-direct');
    if (!c) { boucleActive = false; return; }
    if (now - dernier > 40) {
      dernier = now; const v = document.getElementById('anim-video');
      if (v && v.readyState >= 2 && FILM.p) composer(c.getContext('2d'), v, DW, DH, now / 1000);
    }
    requestAnimationFrame(pas);
  };
  requestAnimationFrame(pas);
}
function filmApresRendu() {
  const ici = document.getElementById('anim-direct');
  if (!ici) { if (FILM.flux || FILM.auto || FILM.lecture) arreterTout(); return; }
  const v = document.getElementById('anim-video');
  if (FILM.flux && v && v.srcObject !== FILM.flux) { v.srcObject = FILM.flux; v.play().catch(() => {}); }
  if (!FILM.flux) demarrerCamera();
  boucleDirect(); majEcran();
}

// ---------- Prise de vue ----------
// Les photos passent l'une après l'autre, même si elle tape vite sur le bouton.
let filePhotos = Promise.resolve();
function photographier() { filePhotos = filePhotos.then(prendrePhoto, prendrePhoto); return filePhotos; }
async function prendrePhoto() {
  let v = document.getElementById('anim-video');
  for (let k = 0; k < 20 && FILM.flux && v && v.readyState < 2; k++) { await new Promise((ok) => setTimeout(ok, 100)); v = document.getElementById('anim-video'); }
  if (!FILM.flux || !v || v.readyState < 2) { toast(FILM.erreurCam || 'La caméra se réveille, attends une seconde.'); return; }
  const c = temp('prise', FW, FH), x = c.getContext('2d'); couvrir(x, v, v.videoWidth, v.videoHeight, FW, FH);
  const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.9));
  const octets = new Uint8Array(await blob.arrayBuffer());
  await ajouterImage(octets);
  const fl = document.getElementById('anim-flash'); if (fl) { fl.classList.remove('on'); void fl.offsetWidth; fl.classList.add('on'); }
  declic();
}
async function ajouterImage(octets) {
  const nom = nomNeuf('i', 'jpg'); await F.animEcrire(FILM.id, nom, octets);
  FILM.imgs[nom] = { bmp: await bitmapDe(octets), url: URL.createObjectURL(new Blob([octets], { type: 'image/jpeg' })) };
  const p = FILM.p; const ou = FILM.sel >= 0 ? FILM.sel + 1 : p.images.length;
  p.images.splice(ou, 0, nom); if (FILM.sel >= 0) FILM.sel = ou;
  filmSauver();
  const n = p.images.length;
  if (n % 12 === 0) toast(`${n} images : ton film dure déjà ${(n / p.fps).toFixed(1).replace('.', ',')} secondes !`);
  if (n % 6 === 0) FILM.astuce++;
  majEcran(); majBas(true);
}
async function avecRetardateur(fn) {
  const r = (FILM.p && FILM.p.retard) || 0;
  if (!r) return fn();
  if (FILM.compte) return; FILM.compte = true;
  for (let i = r; i > 0; i--) { const el = document.getElementById('anim-compte'); if (!el || !FILM.compte) { FILM.compte = false; return; } el.textContent = i; el.classList.remove('bat'); void el.offsetWidth; el.classList.add('bat'); bip(660, 0.15); await new Promise((ok) => setTimeout(ok, 1000)); }
  const el = document.getElementById('anim-compte'); if (el) el.textContent = '';
  FILM.compte = false; if (el) return fn();
}
function arreterAuto() { if (FILM.auto) { clearInterval(FILM.auto.iv); FILM.auto = null; } }
function lancerAuto(sec) {
  arreterAuto(); if (!sec) { majBas(); return; }
  FILM.auto = { sec, iv: setInterval(() => { if (!document.getElementById('anim-direct')) return arreterAuto(); bip(990, 0.08, 0.08); photographier(); }, sec * 1000) };
  toast(`Une photo toutes les ${sec} secondes. Bouge ton personnage entre deux bips !`); majBas();
}

// ---------- Lecture ----------
function arreterLecture() {
  const l = FILM.lecture; if (!l) return; FILM.lecture = null;
  clearInterval(l.iv); if (l.ac) l.ac.close().catch(() => {}); if (l.fin) l.fin();
  majEcran(); majBas();
}
async function lire(options) {
  const o = options || {}; arreterLecture(); arreterAuto();
  const p = FILM.p; if (!p.images.length) { toast('Prends d’abord quelques photos !'); return; }
  await chargerToutes(); await chargerDecor();
  const c = document.getElementById('anim-vue'); if (!c) return;
  const segs = segments(p); const ac = new AudioContext();
  const t0 = o.muet ? ac.currentTime : await preparerSon(ac, ac.destination, segs.duree, o.sansVoix);
  const l = FILM.lecture = { ac, fin: o.fin, segs };
  majEcran();
  const x = c.getContext('2d');
  l.iv = setInterval(() => {
    if (FILM.lecture !== l) return;
    const t = ac.currentTime - t0; if (t < 0) return;
    if (t >= segs.duree) { arreterLecture(); return; }
    const seg = dessinerA(x, FW, FH, t, segs);
    const n = document.getElementById('anim-numero'); if (n && seg) n.textContent = seg.type === 'image' ? 'Image ' + (seg.i + 1) : seg.type === 'titre' ? 'Générique' : 'Fin';
  }, 1000 / 30);
}
async function chargerToutes() {
  const manque = FILM.p.images.filter((n) => !FILM.imgs[n]);
  for (const nom of manque) {
    const o = versOctets(await F.animOctets(FILM.id, nom));
    if (o) FILM.imgs[nom] = { bmp: await bitmapDe(o), url: URL.createObjectURL(new Blob([o], { type: 'image/jpeg' })) };
  }
}

// ---------- Ma voix ----------
async function enregistrerVoix() {
  if (!FILM.p.images.length) { toast('Il faut d’abord des images pour parler dessus.'); return; }
  let micro;
  try { micro = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false }); } catch (e) { toast('Je ne trouve pas de micro. Branche ton casque avec micro.', 6000); return; }
  const mime = ['audio/webm;codecs=opus', 'audio/webm'].find((m) => MediaRecorder.isTypeSupported(m));
  FILM.voix = { etat: 'compte' }; majBas();
  for (let i = 3; i > 0; i--) { const el = document.getElementById('anim-compte'); if (el) { el.textContent = i; el.classList.remove('bat'); void el.offsetWidth; el.classList.add('bat'); } bip(660, 0.15); await new Promise((ok) => setTimeout(ok, 900)); }
  const el = document.getElementById('anim-compte'); if (el) el.textContent = '';
  const rec = new MediaRecorder(micro, mime ? { mimeType: mime } : undefined); const morceaux = [];
  rec.ondataavailable = (e) => { if (e.data.size) morceaux.push(e.data); };
  FILM.voix = { etat: 'enregistre', rec };
  rec.start(250); majBas();
  await lire({ muet: true, fin: () => { if (rec.state !== 'inactive') rec.stop(); } });
  await new Promise((ok) => { if (rec.state === 'inactive') ok(); else rec.onstop = ok; });
  micro.getTracks().forEach((t) => t.stop());
  const octets = new Uint8Array(await new Blob(morceaux, { type: 'audio/webm' }).arrayBuffer());
  if (FILM.p.voix) F.animEffacer(FILM.id, FILM.p.voix);
  const nom = nomNeuf('voix-', 'webm'); await F.animEcrire(FILM.id, nom, octets);
  FILM.p.voix = nom; FILM.voix = null; filmSauver(); majBas();
  toast('Ta voix est enregistrée. Appuie sur Lecture pour écouter !');
}

// ---------- Dessin animé : dessiner image par image, avec l'image d'avant en fantôme ----------
const COULEURS_DESSIN = ['#1E2A4A', '#E53935', '#FF9800', '#FFEB3B', '#43A047', '#1E88E5', '#8E24AA', '#F06292', '#8D6E63', '#FFFFFF'];
const DES = { taille: 6, couleur: '#1E2A4A', gomme: false, fond: 'papier', pile: [] };
function ouvrirDessin() {
  arreterAuto(); arreterLecture(); fermerDessin();
  document.body.insertAdjacentHTML('beforeend', `<div class="film-dessin" id="film-dessin"><div class="panneau cadre-dessin">
    <div class="rang entre"><h3>✏️ Dessine ton image</h3><span class="rang"><button class="puce ${DES.fond === 'papier' ? 'on' : ''}" data-d="fond" data-v="papier">Feuille blanche</button><button class="puce ${DES.fond === 'photo' ? 'on' : ''}" data-d="fond" data-v="photo">Sur la dernière image</button></span></div>
    <div class="feuille-dessin"><canvas id="fd-fond" width="${FW}" height="${FH}"></canvas><canvas id="fd-trait" width="${FW}" height="${FH}"></canvas></div>
    <div class="rang entre outils-dessin"><span class="rang">${COULEURS_DESSIN.map((c) => `<button class="pastille gros ${DES.couleur === c && !DES.gomme ? 'on' : ''}" style="background:${c}" data-d="couleur" data-v="${c}" aria-label="Couleur"></button>`).join('')}
      <button class="puce ${DES.gomme ? 'on' : ''}" data-d="gomme">Gomme</button>${[3, 6, 14].map((t) => `<button class="puce ${DES.taille === t ? 'on' : ''}" data-d="taille" data-v="${t}"><span class="point" style="width:${t + 4}px;height:${t + 4}px"></span></button>`).join('')}</span>
      <span class="rang"><button class="puce" data-d="annuler">↶</button><button class="puce" data-d="copier">Reprendre l’image d’avant</button><button class="puce" data-d="vider">Tout effacer</button></span></div>
    <div class="rang entre"><span class="muet">L’image d’avant apparaît en fantôme : décale ton dessin un tout petit peu.</span><span class="rang"><button class="btn doux" data-d="fermer">Fermer</button><button class="btn" style="background:#E0457B" data-d="ajouter">Ajouter à la frise ✓</button></span></div></div></div>`);
  preparerFondDessin(); brancherDessin();
}
function fermerDessin() { const z = document.getElementById('film-dessin'); if (z) z.remove(); }
function derniereImage() { const p = FILM.p; const nom = p.images[FILM.sel >= 0 ? FILM.sel : p.images.length - 1]; return nom && FILM.imgs[nom] ? FILM.imgs[nom].bmp : null; }
function preparerFondDessin() {
  const c = document.getElementById('fd-fond'); if (!c) return; const x = c.getContext('2d'); const b = derniereImage();
  x.globalAlpha = 1; x.fillStyle = '#fff'; x.fillRect(0, 0, FW, FH);
  if (b) { x.globalAlpha = DES.fond === 'photo' ? 1 : 0.28; couvrir(x, b, b.width, b.height, FW, FH); x.globalAlpha = 1; }
}
function brancherDessin() {
  const t = document.getElementById('fd-trait'); const x = t.getContext('2d'); let dernier = null;
  const pos = (e) => { const r = t.getBoundingClientRect(); return [(e.clientX - r.left) * FW / r.width, (e.clientY - r.top) * FH / r.height]; };
  t.addEventListener('pointerdown', (e) => { DES.pile.push(x.getImageData(0, 0, FW, FH)); if (DES.pile.length > 25) DES.pile.shift(); dernier = pos(e); t.setPointerCapture(e.pointerId); trait(x, dernier, dernier); });
  t.addEventListener('pointermove', (e) => { if (!dernier) return; const p = pos(e); trait(x, dernier, p); dernier = p; });
  t.addEventListener('pointerup', () => { dernier = null; });
  document.getElementById('film-dessin').addEventListener('click', (e) => { const b = e.target.closest('[data-d]'); if (b) actionDessin(b.dataset.d, b.dataset.v, b); });
}
function trait(x, a, b) {
  x.save(); x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = DES.taille * (DES.gomme ? 3 : 1);
  x.globalCompositeOperation = DES.gomme ? 'destination-out' : 'source-over'; x.strokeStyle = DES.couleur;
  x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0] + 0.01, b[1]); x.stroke(); x.restore();
}
async function actionDessin(d, v, el) {
  const t = document.getElementById('fd-trait'); const x = t && t.getContext('2d');
  const marquer = (sel) => { document.querySelectorAll(`#film-dessin ${sel}`).forEach((b) => b.classList.remove('on')); el.classList.add('on'); };
  if (d === 'couleur') { DES.couleur = v; DES.gomme = false; marquer('[data-d="couleur"],[data-d="gomme"]'); }
  else if (d === 'gomme') { DES.gomme = !DES.gomme; el.classList.toggle('on', DES.gomme); }
  else if (d === 'taille') { DES.taille = Number(v); marquer('[data-d="taille"]'); }
  else if (d === 'fond') { DES.fond = v; marquer('[data-d="fond"]'); preparerFondDessin(); }
  else if (d === 'annuler') { const im = DES.pile.pop(); if (im) x.putImageData(im, 0, 0); }
  else if (d === 'vider') { DES.pile.push(x.getImageData(0, 0, FW, FH)); x.clearRect(0, 0, FW, FH); }
  else if (d === 'copier') { if (DES.dernierTrait) { DES.pile.push(x.getImageData(0, 0, FW, FH)); x.putImageData(DES.dernierTrait, 0, 0); } else toast('Il n’y a pas encore de dessin d’avant.'); }
  else if (d === 'fermer') fermerDessin();
  else if (d === 'ajouter') {
    const c = document.createElement('canvas'); c.width = FW; c.height = FH; const cx = c.getContext('2d');
    cx.fillStyle = '#fff'; cx.fillRect(0, 0, FW, FH); const b = derniereImage(); if (DES.fond === 'photo' && b) couvrir(cx, b, b.width, b.height, FW, FH);
    cx.drawImage(t, 0, 0);
    DES.dernierTrait = x.getImageData(0, 0, FW, FH);
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.92));
    await ajouterImage(new Uint8Array(await blob.arrayBuffer()));
    // image suivante : on repart d'une feuille vide, avec ce dessin en fantôme
    x.clearRect(0, 0, FW, FH); DES.pile = []; preparerFondDessin(); toast('Image ajoutée ! Dessine la suivante en décalant un peu.');
  }
}

// ---------- Faire le film ----------
async function fabriquer() {
  const p = FILM.p; if (p.images.length < 2 || FILM.export) return;
  arreterLecture(); arreterAuto();
  FILM.export = { progres: 0 }; majBas();
  try {
    await chargerToutes(); await chargerDecor();
    const c = document.createElement('canvas'); c.width = FW; c.height = FH; const x = c.getContext('2d');
    const segs = segments(p);
    const flux = c.captureStream(30);
    const ac = new AudioContext(); const dest = ac.createMediaStreamDestination();
    dest.stream.getAudioTracks().forEach((t) => flux.addTrack(t));
    const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m));
    const rec = new MediaRecorder(flux, { mimeType: mime, videoBitsPerSecond: 6000000 }); const morceaux = [];
    rec.ondataavailable = (e) => { if (e.data.size) morceaux.push(e.data); };
    dessinerA(x, FW, FH, 0, segs);
    rec.start(500);
    const t0 = await preparerSon(ac, dest, segs.duree);
    await new Promise((ok) => {
      const iv = setInterval(() => {
        const t = ac.currentTime - t0;
        dessinerA(x, FW, FH, Math.max(0, Math.min(t, segs.duree - 0.001)), segs);
        FILM.export.progres = Math.min(1, t / segs.duree);
        const b = document.getElementById('anim-progres'); if (b) b.style.width = Math.round(FILM.export.progres * 100) + '%';
        if (t >= segs.duree + 0.2) { clearInterval(iv); ok(); }
      }, 1000 / 30);
    });
    await new Promise((ok) => { rec.onstop = ok; rec.stop(); });
    ac.close().catch(() => {});
    const octets = new Uint8Array(await new Blob(morceaux, { type: 'video/webm' }).arrayBuffer());
    const r = await F.animExporter(p.titre, octets);
    if (!r || !r.ok) throw new Error((r && r.erreur) || 'enregistrement');
    FILM.fini = { nom: r.nom };
    S.profil.films = (S.profil.films || 0) + 1; F.profil(S.profil);
  } catch (e) { toast('Oups, le film n’a pas pu être fabriqué. Réessaie !', 6000); }
  FILM.export = null; majBas();
}

// ---------- Ajouter les photos de son appareil photo ----------
async function ouvrirPhotos() {
  arreterAuto();
  const l = (await F.photos()) || [];
  const groupes = {};
  l.forEach((f) => { const dossier = f.chemin.replace(/[\\/][^\\/]+$/, ''); const nomD = dossier.split(/[\\/]/).pop(); (groupes[dossier] = groupes[dossier] || { nom: nomD, photos: [] }).photos.push(f); });
  Object.values(groupes).forEach((g) => g.photos.sort((a, b) => a.chemin.localeCompare(b.chemin, 'fr', { numeric: true })));
  FILM.photos = Object.values(groupes).sort((a, b) => b.nom.localeCompare(a.nom)); FILM.choix = [];
  majBas(); const z = document.getElementById('anim-bas'); if (z) z.scrollIntoView({ behavior: 'smooth' });
}
async function ajouterPhotos() {
  const choix = FILM.choix.slice(); if (!choix.length) return;
  FILM.photos = null; FILM.choix = []; majBas();
  let n = 0;
  for (const chemin of choix) {
    const o = versOctets(await F.lireOctets(chemin)); if (!o) continue;
    try {
      const b = await bitmapDe(o, /\.png$/i.test(chemin) ? 'image/png' : 'image/jpeg');
      const c = temp('import', FW, FH), x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, FW, FH); couvrir(x, b, b.width, b.height, FW, FH);
      const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.9));
      await ajouterImage(new Uint8Array(await blob.arrayBuffer())); n++;
    } catch (e) { /* photo illisible : on passe */ }
  }
  toast(n ? `${n} photo${n > 1 ? 's' : ''} ajoutée${n > 1 ? 's' : ''} à ton film !` : 'Je n’ai pas pu lire ces photos.');
}

// ---------- Affichage ----------
function vueAnimation() {
  const v = S.vue;
  if (!v.id) {
    const l = S.docs.animations || [];
    return `<div class="section studio-liste">${entete('Mon studio de films')}
      <div class="panneau affiche-studio"><div class="clap" aria-hidden="true">🎬</div><div class="grow"><h3>Un nouveau film</h3><p class="muet" style="margin:4px 0 10px">Des Lego, de la pâte à modeler, tes dessins… tout peut devenir un film.</p>
      <div class="rang"><input class="champ" data-in="filmTitre" maxlength="60" placeholder="Le titre, par exemple : La grande évasion" value="${esc(v.titre || '')}"><button class="btn" style="background:#E0457B" data-a="filmNouveau">Action !</button></div></div></div>
      ${l.length ? `<div class="films-grille">${l.map((f) => `<div class="film-carte"><button class="film-ouvrir" data-a="filmOuvrir" data-id="${esc(f.id)}">${f.vignette ? `<img src="${esc(f.vignette)}" alt="">` : '<span class="vide">🎬</span>'}<b>${esc(f.titre || 'Sans titre')}</b><span class="muet">${f.n} image${f.n > 1 ? 's' : ''}</span></button><button class="film-jeter" data-a="filmSupprimer" data-id="${esc(f.id)}" aria-label="Supprimer">${FILM.aSupprimer === f.id ? 'Sûr ?' : '🗑'}</button></div>`).join('')}</div>` : '<p class="muet">Tes films apparaîtront ici. Tu pourras toujours les reprendre plus tard.</p>'}</div>`;
  }
  const p = FILM.p; if (!p) return entete('Mon film');
  return `<div class="section studio">${entete(p.titre || 'Mon film', `<span class="puces-vitesse">${VITESSES.map((x) => `<button class="puce ${p.fps === x.fps ? 'on' : ''}" data-a="filmVitesse" data-fps="${x.fps}" title="${x.fps} images par seconde">${x.e} ${x.nom}</button>`).join('')}</span>`)}
    <div class="studio-haut">
      <div class="ecran-film" id="anim-ecran">
        <video id="anim-video" autoplay muted playsinline></video>
        <canvas id="anim-direct" width="${DW}" height="${DH}"></canvas>
        <canvas id="anim-oignon" width="${DW}" height="${DH}"></canvas>
        <canvas id="anim-vue" width="${FW}" height="${FH}"></canvas>
        <div class="grille-tiers" id="anim-grille"></div>
        <div class="compte" id="anim-compte"></div>
        <div class="flash" id="anim-flash"></div>
        <div class="message-cam" id="anim-message"></div>
        <span class="etiquette-film" id="anim-numero"></span>
        <span class="rec" id="anim-rec">● REC</span>
      </div>
      <div class="commandes-film">
        <button class="declencheur" data-a="filmClic" aria-label="Prendre la photo"><span></span></button>
        <div class="muet centre" id="anim-compteur"></div>
        <button class="btn lecture-btn" data-a="filmLecture" id="anim-lire">▶ Lecture</button>
        <div class="reglage"><b>Retardateur</b><span class="rang">${[0, 3, 5].map((r) => `<button class="puce ${(p.retard || 0) === r ? 'on' : ''}" data-a="filmRetard" data-r="${r}">${r ? r + ' s' : 'Non'}</button>`).join('')}</span></div>
        <div class="reglage"><b>Photo automatique</b><span class="rang" id="anim-auto">${autoHtml()}</span></div>
        <div class="reglage"><b>Image fantôme</b><input type="range" min="0" max="80" step="5" value="${Math.round((p.oignon === undefined ? 0.35 : p.oignon) * 100)}" data-in="filmOignon"></div>
        <div class="rang"><button class="puce ${p.grille ? 'on' : ''}" data-a="filmGrille">Grille</button><button class="puce" data-a="filmCamera" id="anim-cam">Autre caméra</button></div>
        <button class="btn doux" data-a="filmPhotos">📷 Ajouter mes photos</button>
        <button class="btn doux" data-a="filmDessiner">✏️ Dessiner une image</button>
      </div>
    </div>
    <div id="anim-bas">${basHtml()}</div>
    <p class="astuce-film"><b>${esc(S.profil && S.profil.compagnon && S.profil.compagnon.nom || 'Givre')} :</b> <span id="anim-astuce">${esc(ASTUCES[FILM.astuce % ASTUCES.length])}</span></p></div>`;
}
function autoHtml() { const s = FILM.auto ? FILM.auto.sec : 0; return [0, 2, 4].map((r) => `<button class="puce ${s === r ? 'on' : ''}" data-a="filmAuto" data-s="${r}">${r ? r + ' s' : 'Non'}</button>`).join(''); }
function basHtml() {
  const p = FILM.p; if (!p) return '';
  if (FILM.fini) return `<div class="panneau bravo-film">${pluieDeFlocons(36)}<div class="clap" aria-hidden="true">🏆</div><h3>Ton film « ${esc(p.titre)} » est prêt !</h3><p class="muet" style="margin:0">Il t’attend dans ta galerie. Tu peux le montrer à toute la famille.</p><div class="rang"><button class="btn" style="background:#E0457B" data-a="filmGalerie">Le regarder</button><button class="btn doux" data-a="filmContinuer">Continuer mon film</button></div></div>`;
  if (FILM.export) return `<div class="panneau"><h3>🎞️ Je fabrique ton film…</h3><div class="barre-progres"><span id="anim-progres" style="width:${Math.round(FILM.export.progres * 100)}%"></span></div><p class="muet" style="margin:0">Ça prend le temps du film. Ne ferme pas !</p></div>`;
  if (FILM.photos) {
    const g = FILM.photos;
    return `<div class="panneau"><div class="rang entre"><h3>Mes photos</h3><span class="rang"><button class="btn doux petit" data-a="filmImporter">Importer de mon appareil photo</button><button class="btn doux petit" data-a="filmPhotosFermer">Annuler</button></span></div>
      <p class="muet" style="margin:0">Touche les photos dans l’ordre du film. Branche ton appareil photo et appuie sur « Importer » pour faire venir les nouvelles.</p>
      ${g.length ? g.map((x, k) => `<div class="groupe-photos"><div class="rang entre"><b>${esc(x.nom)}</b><button class="btn doux petit" data-a="filmToutPrendre" data-k="${k}">Tout prendre</button></div><div class="choix-photos">${x.photos.map((f) => { const i = FILM.choix.indexOf(f.chemin); return `<button class="${i >= 0 ? 'on' : ''}" data-a="filmChoisirPhoto" data-c="${esc(f.chemin)}"><img src="${esc(f.url)}" alt="" loading="lazy">${i >= 0 ? `<span>${i + 1}</span>` : ''}</button>`; }).join('')}</div></div>`).join('') : '<p><b>Pas encore de photo.</b> Branche ton appareil photo, puis appuie sur « Importer ».</p>'}
      <div class="rang"><button class="btn" data-a="filmAjouterPhotos" ${FILM.choix.length ? '' : 'disabled'}>Ajouter ${FILM.choix.length || ''} photo${FILM.choix.length > 1 ? 's' : ''} au film</button></div></div>`;
  }
  const n = p.images.length; const sel = FILM.sel;
  const frise = `<div class="frise-film" id="anim-frise">${p.images.map((nom, i) => `<button class="vignette ${i === sel ? 'on' : ''}" data-a="filmChoisir" data-i="${i}">${FILM.imgs[nom] ? `<img src="${FILM.imgs[nom].url}" alt="">` : ''}<span>${i + 1}</span></button>`).join('')}${n ? '' : '<span class="muet frise-vide">Ta frise est vide : appuie sur le gros bouton rouge (ou la barre d’espace) pour ta première photo.</span>'}</div>
    <div class="rang actions-frise">${sel >= 0 ? `<button class="btn doux petit" data-a="filmBouger" data-d="-1">◀</button><button class="btn doux petit" data-a="filmBouger" data-d="1">▶</button><button class="btn doux petit" data-a="filmDupliquer">Copier ×1</button><button class="btn doux petit" data-a="filmEffacer">🗑 Jeter cette image</button><button class="btn doux petit" data-a="filmChoisir" data-i="${sel}">Retour à la caméra</button>` : `<button class="btn doux petit" data-a="filmAnnuler" ${n ? '' : 'disabled'}>↶ Annuler la dernière</button>`}<span style="flex:1"></span><span class="muet">${n} image${n > 1 ? 's' : ''} · ${(segments(p).duree).toFixed(1).replace('.', ',')} s</span></div>`;
  const ong = [['vert', '🟩 Fond vert'], ['filtre', '✨ Filtres'], ['musique', '🎵 Musique'], ['voix', '🎤 Ma voix'], ['generique', '🎬 Générique']];
  let corps = '';
  if (FILM.onglet === 'vert') {
    const d = p.vert.decor || {};
    const l = FILM.decors || [];
    corps = `<div class="rang"><button class="puce ${p.vert.actif ? 'on' : ''}" data-a="filmVert">${p.vert.actif ? 'Fond vert activé' : 'Activer le fond vert'}</button>
      <button class="puce ${FILM.pipette ? 'on' : ''}" data-a="filmPipette">🎯 ${FILM.pipette ? 'Touche le fond sur l’écran' : 'Choisir la couleur du fond'}</button><span class="pastille" style="background:rgb(${p.vert.couleur.join(',')})"></span>
      <span class="reglage-ligne"><b>Tolérance</b><input type="range" min="0" max="100" value="${Math.round(p.vert.tolerance * 100)}" data-in="filmTolerance"></span></div>
      <p class="muet" style="margin:0">Mets un tissu vert derrière ton personnage, bien éclairé. Tout ce qui est vert est remplacé par le décor.</p>
      ${decorsHtml(d, l)}
      <p class="muet" style="margin:0">Tes propres décors : mets des images dans Images, « Mes décors ». Tes dessins de « Mes créations » sont là aussi.</p>`;
  } else if (FILM.onglet === 'filtre') corps = `<div class="choix-gros">${FILTRES.map((f) => `<button class="${p.filtre === f.id ? 'on' : ''}" data-a="filmFiltre" data-f="${f.id}"><span class="e">${f.e}</span>${esc(f.nom)}</button>`).join('')}</div>`;
  else if (FILM.onglet === 'musique') corps = `<div class="choix-gros">${Object.entries(MUSIQUES).map(([id, m]) => `<button class="${p.musique === id ? 'on' : ''}" data-a="filmMusique" data-m="${id}"><span class="e">${m.e}</span>${esc(m.nom)}</button>`).join('')}</div><p class="muet" style="margin:0">Des musiques composées par Flocon : tu peux les mettre dans tous tes films. Appuie sur une musique pour l’écouter.</p>`;
  else if (FILM.onglet === 'voix') {
    const etat = FILM.voix && FILM.voix.etat;
    corps = `<p style="margin:0">Raconte ton histoire ou fais les voix des personnages : ton film défile pendant que tu parles.</p>
      <div class="rang"><button class="btn" style="background:#D93A3A" data-a="filmVoix" ${etat || !n ? 'disabled' : ''}>${etat === 'enregistre' ? '● J’enregistre…' : etat ? 'Prépare-toi…' : p.voix ? '🎤 Recommencer ma voix' : '🎤 Enregistrer ma voix'}</button>${p.voix && !etat ? '<button class="btn doux" data-a="filmVoixJeter">Enlever ma voix</button><span class="etiquette">✓ Voix enregistrée</span>' : ''}</div>`;
  } else corps = `<div class="rang"><button class="puce ${p.generique ? 'on' : ''}" data-a="filmCarte" data-c="generique">Titre au début</button><button class="puce ${p.fin ? 'on' : ''}" data-a="filmCarte" data-c="fin">« Fin » à la fin</button></div>
      <div class="reglage-ligne"><b>Titre</b><input class="champ" data-in="filmRenommer" maxlength="60" value="${esc(p.titre)}"></div>
      <div class="rang"><b>Couleur</b>${COULEURS_FILM.map((c) => `<button class="pastille gros ${p.couleur === c ? 'on' : ''}" style="background:${c}" data-a="filmCouleur" data-c="${c}" aria-label="Couleur"></button>`).join('')}</div>`;
  return `<div class="panneau bas-film">${frise}</div>
    <div class="panneau"><div class="onglets-film">${ong.map(([id, nom]) => `<button class="${FILM.onglet === id ? 'on' : ''}" data-a="filmOnglet" data-o="${id}">${nom}</button>`).join('')}</div>${corps}</div>
    <div class="rang entre"><span class="muet">Tout est enregistré au fur et à mesure.</span><button class="btn grand faire-film" data-a="filmFaire" ${n < 2 ? 'disabled' : ''}>🎞️ Faire mon film</button></div>`;
}
function decorsHtml(d, l) {
  const bouton = (f) => `<button class="${d.type === 'fichier' && d.chemin === f.chemin ? 'on' : ''}" data-a="filmDecor" data-t="fichier" data-r="${esc(f.chemin)}"><img src="${esc(f.url)}" alt="" loading="lazy"><span>${esc(f.nom)}</span></button>`;
  const dessines = Object.entries(DECORS_DESSINES).map(([ref, x]) => `<button class="${d.type === 'dessine' && d.ref === ref ? 'on' : ''}" data-a="filmDecor" data-t="dessine" data-r="${ref}"><img src="${apercuDecor(ref)}" alt=""><span>${esc(x.nom)}</span></button>`).join('');
  const groupe = (titre, html) => (html ? `<b class="titre-decors">${titre}</b><div class="decors">${html}</div>` : '');
  return `<div class="tous-decors">${groupe('Les décors de Flocon', l.filter((f) => f.origine === 'flocon').map(bouton).join('') + dessines)}${groupe('Mes décors', l.filter((f) => f.origine === 'mes').map(bouton).join(''))}${groupe('Mes dessins', l.filter((f) => f.origine === 'creations').map(bouton).join(''))}</div>`;
}
const apercus = {};
function apercuDecor(ref) { if (!apercus[ref]) { const c = document.createElement('canvas'); c.width = 160; c.height = 120; c.getContext('2d').drawImage(toileDessinee(ref), 0, 0, 160, 120); apercus[ref] = c.toDataURL('image/jpeg', 0.8); } return apercus[ref]; }
function majBas(defiler) {
  const z = document.getElementById('anim-bas'); if (!z) return;
  const fr = document.getElementById('anim-frise'); const g = fr ? fr.scrollLeft : 0;
  z.innerHTML = basHtml();
  const fr2 = document.getElementById('anim-frise');
  if (fr2) { if (defiler) { const on = fr2.querySelector('.on'); if (on) on.scrollIntoView({ inline: 'center', block: 'nearest' }); else fr2.scrollLeft = fr2.scrollWidth; } else fr2.scrollLeft = g; }
  const au = document.getElementById('anim-auto'); if (au) au.innerHTML = autoHtml();
}
function majEcran() {
  const p = FILM.p; if (!p || !document.getElementById('anim-ecran')) return;
  const n = p.images.length; const enLecture = !!FILM.lecture; const sel = FILM.sel;
  const vue = document.getElementById('anim-vue'); const oi = document.getElementById('anim-oignon');
  const voirImage = enLecture || sel >= 0;
  vue.style.display = voirImage ? 'block' : 'none';
  if (sel >= 0 && !enLecture && FILM.imgs[p.images[sel]]) composer(vue.getContext('2d'), FILM.imgs[p.images[sel]].bmp, FW, FH, 0);
  // l'image fantôme : la photo précédente (ou celle choisie) en transparence
  const der = p.images[sel >= 0 ? sel : n - 1];
  const op = p.oignon === undefined ? 0.35 : p.oignon;
  if (der && FILM.imgs[der] && !voirImage && op > 0) { composer(oi.getContext('2d'), FILM.imgs[der].bmp, DW, DH, 0, true); oi.style.opacity = op; oi.style.display = 'block'; } else oi.style.display = 'none';
  document.getElementById('anim-grille').style.display = p.grille ? 'block' : 'none';
  const m = document.getElementById('anim-message'); m.textContent = FILM.flux || voirImage ? '' : (FILM.erreurCam || 'La caméra se réveille…'); m.style.display = m.textContent ? 'flex' : 'none';
  document.getElementById('anim-numero').textContent = enLecture ? '' : sel >= 0 ? 'Image ' + (sel + 1) + ' sur ' + n : n ? 'Image ' + (n + 1) : 'Première image';
  document.getElementById('anim-compteur').textContent = n ? `${n} image${n > 1 ? 's' : ''}` : 'Clic !';
  const l = document.getElementById('anim-lire'); if (l) l.textContent = enLecture ? '■ Stop' : '▶ Lecture';
  const rec = document.getElementById('anim-rec'); if (rec) rec.style.display = FILM.voix && FILM.voix.etat === 'enregistre' ? 'block' : 'none';
  const cam = document.getElementById('anim-cam'); if (cam) cam.style.display = FILM.cameras.length > 1 ? '' : 'none';
  const ec = document.getElementById('anim-ecran'); ec.classList.toggle('pipette', FILM.pipette);
  const as = document.getElementById('anim-astuce'); if (as) as.textContent = ASTUCES[FILM.astuce % ASTUCES.length];
}

// ---------- Ouvrir, créer ----------
async function ouvrirFilm(id) {
  arreterTout();
  const p = await F.animLire(id); if (!p || p.erreur) { toast('Je n’arrive pas à ouvrir ce film.'); return; }
  FILM.id = id; FILM.p = Object.assign(projetNeuf(p.titre), p); FILM.p.vert = Object.assign(projetNeuf().vert, p.vert || {});
  FILM.imgs = {}; FILM.sel = -1; FILM.fini = null; FILM.photos = null; FILM.cache = null; FILM.onglet = 'vert';
  S.vue = { ref: 'animation', id }; render();
  rafraichirDecors();
  await chargerToutes(); await chargerDecor(); majBas(true); majEcran();
}
// Les décors sont relus à chaque fois : elle peut en ajouter pendant que le studio est ouvert.
async function rafraichirDecors() { const l = await F.animDecors(); const avant = JSON.stringify((FILM.decors || []).map((x) => x.chemin)); FILM.decors = Array.isArray(l) ? l : []; if (FILM.onglet === 'vert' && !FILM.photos && !FILM.export && !FILM.fini && avant !== JSON.stringify(FILM.decors.map((x) => x.chemin))) majBas(); }
function choisirPhoto(chemin) { const i = FILM.choix.indexOf(chemin); if (i >= 0) FILM.choix.splice(i, 1); else FILM.choix.push(chemin); majBas(); }
Object.assign(A, {
  filmNouveau: async () => {
    const titre = String(S.vue.titre || '').trim() || 'Mon film';
    const id = new Date().toISOString().slice(0, 10) + '-' + Math.random().toString(36).slice(2, 8);
    await F.animProjet(id, projetNeuf(titre)); await ouvrirFilm(id);
  },
  filmOuvrir: (d) => ouvrirFilm(d.id),
  filmSupprimer: async (d) => {
    if (FILM.aSupprimer !== d.id) { FILM.aSupprimer = d.id; render(); setTimeout(() => { if (FILM.aSupprimer === d.id) { FILM.aSupprimer = null; render(); } }, 4000); return; }
    FILM.aSupprimer = null; await F.animSupprimer(d.id); S.docs.animations = await F.animListe(); render();
  },
  filmClic: () => { if (FILM.lecture) arreterLecture(); if (FILM.sel >= 0) { FILM.sel = -1; majEcran(); majBas(); } avecRetardateur(photographier); },
  filmLecture: () => { if (FILM.lecture) arreterLecture(); else lire(); },
  filmVitesse: (d) => { FILM.p.fps = Number(d.fps); filmSauver(); document.querySelectorAll('.puces-vitesse .puce').forEach((b) => b.classList.toggle('on', b.dataset.fps === d.fps)); majBas(); },
  filmRetard: (d) => { FILM.p.retard = Number(d.r); filmSauver(); document.querySelectorAll('[data-a="filmRetard"]').forEach((b) => b.classList.toggle('on', b.dataset.r === d.r)); },
  filmAuto: (d) => lancerAuto(Number(d.s)),
  filmGrille: () => { FILM.p.grille = !FILM.p.grille; filmSauver(); document.querySelector('[data-a="filmGrille"]').classList.toggle('on', FILM.p.grille); majEcran(); },
  filmCamera: () => { FILM.camera++; couperCamera(); demarrerCamera(); },
  filmPhotos: () => ouvrirPhotos(),
  filmDessiner: () => ouvrirDessin(),
  filmPhotosFermer: () => { FILM.photos = null; majBas(); },
  filmImporter: async () => { toast('Je regarde si ton appareil photo est branché…'); const r = await F.importerPhotos(); if (!r || !r.trouve) toast('Je ne trouve pas d’appareil photo. Vérifie qu’il est branché et allumé.', 6000); else { toast(r.copies ? r.copies + ' nouvelle' + (r.copies > 1 ? 's' : '') + ' photo' + (r.copies > 1 ? 's' : '') + ' !' : 'Toutes tes photos sont déjà là.'); await ouvrirPhotos(); } },
  filmChoisirPhoto: (d) => choisirPhoto(d.c),
  filmToutPrendre: (d) => { FILM.photos[Number(d.k)].photos.forEach((f) => { if (!FILM.choix.includes(f.chemin)) FILM.choix.push(f.chemin); }); majBas(); },
  filmAjouterPhotos: () => ajouterPhotos(),
  filmChoisir: (d) => { const i = Number(d.i); arreterLecture(); FILM.sel = FILM.sel === i ? -1 : i; majBas(); majEcran(); },
  filmBouger: (d) => { const p = FILM.p, i = FILM.sel, j = i + Number(d.d); if (i < 0 || j < 0 || j >= p.images.length) return; [p.images[i], p.images[j]] = [p.images[j], p.images[i]]; FILM.sel = j; filmSauver(); majBas(true); majEcran(); },
  filmDupliquer: () => { const p = FILM.p, i = FILM.sel; if (i < 0) return; p.images.splice(i + 1, 0, p.images[i]); FILM.sel = i + 1; filmSauver(); majBas(true); majEcran(); },
  filmEffacer: () => { const p = FILM.p, i = FILM.sel; if (i < 0) return; const nom = p.images.splice(i, 1)[0]; if (!p.images.includes(nom)) F.animEffacer(FILM.id, nom); FILM.sel = Math.min(i, p.images.length - 1); if (!p.images.length) FILM.sel = -1; filmSauver(); majBas(true); majEcran(); },
  filmAnnuler: () => { const p = FILM.p; const nom = p.images.pop(); if (nom && !p.images.includes(nom)) F.animEffacer(FILM.id, nom); filmSauver(); majBas(true); majEcran(); },
  filmOnglet: (d) => { FILM.onglet = d.o; FILM.pipette = false; majBas(); majEcran(); if (d.o === 'vert') rafraichirDecors(); },
  filmVert: async () => {
    FILM.p.vert.actif = !FILM.p.vert.actif;
    const dec = FILM.p.vert.decor; const illus = (FILM.decors || []).find((f) => f.origine === 'flocon');
    if (FILM.p.vert.actif && illus && (!dec || (dec.type === 'dessine' && dec.ref === 'espace'))) { FILM.p.vert.decor = { type: 'fichier', chemin: illus.chemin }; await chargerDecor(); }
    rafraichirDecors(); FILM.cache = null; filmSauver(); if (FILM.p.vert.actif) toast('Fond vert activé ! Choisis ton décor en dessous.'); majBas(); majEcran(); },
  filmPipette: () => { FILM.pipette = !FILM.pipette; if (FILM.pipette) toast('Touche le fond vert sur l’image de la caméra.'); majBas(); majEcran(); },
  filmDecor: async (d) => { FILM.p.vert.decor = d.t === 'dessine' ? { type: 'dessine', ref: d.r } : { type: 'fichier', chemin: d.r }; FILM.p.vert.actif = true; FILM.cache = null; await chargerDecor(); filmSauver(); majBas(); majEcran(); },
  filmFiltre: (d) => { FILM.p.filtre = d.f; FILM.cache = null; filmSauver(); majBas(); majEcran(); },
  filmMusique: (d) => {
    FILM.p.musique = d.m; filmSauver(); majBas();
    if (FILM.ecoute) { FILM.ecoute.close().catch(() => {}); FILM.ecoute = null; }
    const m = MUSIQUES[d.m]; if (m && m.bpm) { const ac = FILM.ecoute = new AudioContext(); jouerMusique(ac, ac.destination, m, ac.currentTime + 0.05, 5); setTimeout(() => { ac.close().catch(() => {}); if (FILM.ecoute === ac) FILM.ecoute = null; }, 5400); }
  },
  filmVoix: () => enregistrerVoix(),
  filmVoixJeter: () => { if (FILM.p.voix) F.animEffacer(FILM.id, FILM.p.voix); FILM.p.voix = ''; filmSauver(); majBas(); },
  filmCarte: (d) => { FILM.p[d.c] = !FILM.p[d.c]; filmSauver(); majBas(); },
  filmCouleur: (d) => { FILM.p.couleur = d.c; filmSauver(); majBas(); },
  filmFaire: () => fabriquer(),
  filmGalerie: () => { FILM.fini = null; arreterTout(); ouvrirVue('galerie'); },
  filmContinuer: () => { FILM.fini = null; majBas(); }
});
Object.assign(SAISIES, {
  filmTitre: (v) => { S.vue.titre = v; },
  filmRenommer: (v) => { FILM.p.titre = v; filmSauver(); const h = document.querySelector('.studio .entete h2'); if (h) h.textContent = v || 'Mon film'; },
  filmOignon: (v) => { FILM.p.oignon = Number(v) / 100; filmSauver(); majEcran(); },
  filmTolerance: (v) => { FILM.p.vert.tolerance = Number(v) / 100; FILM.cache = null; filmSauver(); }
});
// Retour : du studio vers la liste des films, et on éteint la caméra.
const fermerVueAvantFilm = A.fermerVue;
A.fermerVue = async (d) => {
  if (S.vue && S.vue.ref === 'animation') {
    arreterTout();
    if (S.vue.id) { FILM.p = null; FILM.id = null; S.vue = { ref: 'animation' }; S.docs.animations = await F.animListe(); render(); return; }
  }
  fermerVueAvantFilm(d);
};
// La pipette : on touche le fond sur l'image de la caméra.
document.addEventListener('pointerdown', (e) => {
  if (!FILM.pipette) return; const c = e.target.closest && e.target.closest('#anim-ecran'); if (!c) return;
  const v = document.getElementById('anim-video'); if (!v || v.readyState < 2) return;
  const r = c.getBoundingClientRect(); const t = temp('pip', DW, DH), x = t.getContext('2d', { willReadFrequently: true });
  couvrir(x, v, v.videoWidth, v.videoHeight, DW, DH);
  const px = Math.floor((e.clientX - r.left) / r.width * DW), py = Math.floor((e.clientY - r.top) / r.height * DH);
  const d = x.getImageData(Math.max(0, px - 3), Math.max(0, py - 3), 7, 7).data; const s = [0, 0, 0]; let k = 0;
  for (let i = 0; i < d.length; i += 4) { s[0] += d[i]; s[1] += d[i + 1]; s[2] += d[i + 2]; k++; }
  FILM.p.vert.couleur = s.map((z) => Math.round(z / k)); FILM.p.vert.actif = true; FILM.pipette = false; FILM.cache = null; filmSauver();
  toast('C’est noté ! Cette couleur sera remplacée par le décor.'); majBas(); majEcran(); e.preventDefault();
});
// La barre d'espace prend la photo.
document.addEventListener('keydown', (e) => {
  if (!(S.vue && S.vue.ref === 'animation' && S.vue.id && FILM.p) || S.voile) return;
  if (e.target && e.target.matches && e.target.matches('input,textarea,select')) return;
  if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); if (!e.repeat) A.filmClic(); }
});
