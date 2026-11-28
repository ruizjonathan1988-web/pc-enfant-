'use strict';
// ======================================================================
// VISITES GUIDÉES : la première fois qu'elle ouvre un outil, Givre montre
// les boutons importants, un par un (on peut passer). Le bouton « ? » en haut
// permet de la revoir. Une visite vue est notée dans le profil.
// ======================================================================
/* global S, D, A, esc, sauverProfil, nomCompa */

const VISITES = {
  studio: [
    ['.declencheur', 'Le gros bouton rouge prend une photo. La barre d’espace aussi !'],
    ['#anim-ecran', 'Ici, tu vois ce que voit la caméra. L’image fantôme te montre la photo d’avant : bouge ton personnage un tout petit peu.'],
    ['#anim-frise', 'Ta frise : toutes tes images dans l’ordre. Touche-en une pour la copier, la déplacer ou la jeter.'],
    ['[data-a="filmDessiner"]', 'Tu peux aussi dessiner tes images, comme un vrai dessin animé.'],
    ['.onglets-film', 'Les finitions : fond vert, filtres, musique, ta voix, le générique.'],
    ['.faire-film', 'Quand c’est prêt, « Faire mon film » le range dans ta galerie.']
  ],
  bdAlbum: [
    ['[data-a="bdVides"]', 'D’abord le papier : imprime des planches vides et dessine au crayon.'],
    ['[data-a="bdPhotoPlanche"]', 'Ta planche est finie ? Photographie-la ici : elle rejoint ton album.'],
    ['.gabarits.petits', 'Tu peux aussi composer une planche à l’écran, avec tes photos et tes dessins.'],
    ['[data-a="bdImprimerAlbum"]', 'Et à la fin, imprime ton album pour le faire lire !']
  ],
  bdPlanche: [
    ['#bd-planche', 'Touche une case pour la choisir.'],
    ['.outils-bd', 'Puis mets-y une image et des bulles. Les bulles se déplacent à la souris.']
  ],
  histoire: [
    ['.colonne-plan', 'Le plan de ton histoire : chaque rectangle est une page. Touche-en une pour l’écrire.'],
    ['.page-histoire', 'Écris ici ce qui se passe sur cette page.'],
    ['.fins-choix', 'Chaque page finit soit par des choix, soit par une fin (belle, rigolote ou mauvaise).'],
    ['[data-a="hJouer"]', 'Pour essayer ton histoire comme un lecteur.'],
    ['[data-a="hImprimer"]', 'Et le livret imprimé, avec les pages mélangées comme un vrai livre-jeu !']
  ],
  coloriage: [
    ['[data-a="colImprimer"]', 'Le plus chouette : imprime ton coloriage et colorie-le aux feutres.'],
    ['.feuille-coloriage', 'Tu peux aussi colorier ici : choisis une couleur, puis touche une zone.'],
    ['[data-a="colVerifier"],[data-a="colNouveau"]', 'Et ici, pour vérifier ou en changer.']
  ],
  cubes: [
    ['#cubes-zone', 'Clique pour poser un cube. Glisse pour tourner autour. La molette zoome.'],
    ['.modes-cubes', 'Poser, enlever ou peindre : choisis ce que fait ton clic.'],
    ['.blocs', 'Les couleurs de tes cubes.'],
    ['[data-a="cPlan"]', 'Le plan de montage : imprime-le et construis ta création en vrai, avec tes Lego !']
  ],
  mains: [
    ['[data-a="mainsSurprise"]', 'Pas d’idée ? Un défi au hasard.'],
    ['[data-a="mainsPlacard"]', 'Coche ce que tu as à la maison : Flocon te dira ce que tu peux faire tout de suite.'],
    ['.grille-defis', 'Chaque défi : une mission, du matériel, et c’est toi qui inventes la solution !']
  ]
};
function cleVisite() {
  const v = S.vue; if (!v || S.voile) return null;
  if (v.ref === 'animation' && v.id) return 'studio';
  if (v.ref === 'bd' && v.fichier) return v.planche !== undefined ? 'bdPlanche' : 'bdAlbum';
  if (v.ref === 'histoires' && v.fichier && !v.jouer) return 'histoire';
  if (v.ref === 'coloriages' && v.mode && v.mode !== 'accueil') return 'coloriage';
  if (v.ref === 'cubes' && v.fichier) return 'cubes';
  if (v.ref === 'mains' && !v.id && !v.placard) return 'mains';
  return null;
}
const VIS = { etapes: null, i: 0, cle: null };
function demarrerVisite(cle) {
  const l = (VISITES[cle] || []).filter(([sel]) => document.querySelector(sel)); if (!l.length) return;
  VIS.etapes = l; VIS.i = 0; VIS.cle = cle; afficherVisite();
}
function finirVisite() {
  const z = document.getElementById('visite'); if (z) z.remove();
  if (VIS.cle) { S.profil.visites = Object.assign({}, S.profil.visites, { [VIS.cle]: true }); sauverProfil(); }
  VIS.etapes = null; VIS.cle = null;
}
function afficherVisite() {
  const [sel, texte] = VIS.etapes[VIS.i]; const el = document.querySelector(sel); if (!el) { finirVisite(); return; }
  el.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  const r = el.getBoundingClientRect(); const m = 8; const dernier = VIS.i === VIS.etapes.length - 1;
  let z = document.getElementById('visite'); if (!z) { z = document.createElement('div'); z.id = 'visite'; document.body.appendChild(z); }
  const bas = r.bottom + 190 < window.innerHeight; const bx = Math.max(16, Math.min(window.innerWidth - 376, r.left + r.width / 2 - 180));
  z.innerHTML = `<div class="visite-trou" style="left:${r.left - m}px;top:${r.top - m}px;width:${r.width + 2 * m}px;height:${r.height + 2 * m}px"></div>
    <div class="visite-bulle" style="left:${bx}px;${bas ? `top:${r.bottom + 16}px` : `top:${Math.max(16, r.top - 180)}px`}"><div class="rang"><span class="givre">❄️</span><p>${esc(texte)}</p></div>
    <div class="rang entre"><span class="muet">${VIS.i + 1} sur ${VIS.etapes.length}</span><span class="rang"><button class="lien" data-v="passer">Passer</button><button class="btn petit" data-v="suivant">${dernier ? 'J’ai compris !' : 'Suivant →'}</button></span></div></div>`;
  z.onclick = (e) => { const b = e.target.closest('[data-v]'); if (!b) return; if (b.dataset.v === 'passer' || dernier) finirVisite(); else { VIS.i++; afficherVisite(); } };
}
function visitesApresRendu() {
  const cle = cleVisite();
  if (VIS.etapes && VIS.cle !== cle) { const z = document.getElementById('visite'); if (z) z.remove(); VIS.etapes = null; VIS.cle = null; }
  if (!cle || !VISITES[cle]) return;
  const t = document.querySelector('.entete'); if (t && !t.querySelector('[data-a="revoirVisite"]')) t.insertAdjacentHTML('beforeend', '<button class="btn doux petit aide-visite" data-a="revoirVisite" title="Comment ça marche ?">?</button>');
  if (!VIS.etapes && !(S.profil.visites || {})[cle] && !(D && D.test)) { clearTimeout(VIS.minuterie); VIS.minuterie = setTimeout(() => { if (cleVisite() === cle && !VIS.etapes) demarrerVisite(cle); }, 500); }
}
window.addEventListener('resize', () => { if (VIS.etapes) afficherVisite(); });
Object.assign(A, { revoirVisite: () => { const c = cleVisite(); if (c) demarrerVisite(c); } });
