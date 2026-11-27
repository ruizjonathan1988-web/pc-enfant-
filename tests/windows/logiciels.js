'use strict';
// Flocon trouve-t-il chaque logiciel de son catalogue sur cette machine ?
// Même ordre que main.js : d'abord les chemins connus, puis le menu Démarrer (Get-StartApps).
//   node logiciels.js <fichier de résultat .md>
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const CAT = require('../../app/lib/catalogue');

const developper = (p) => p.replace(/%([^%]+)%/g, (_, v) => process.env[v] || process.env[v.toUpperCase()] || '');
let menu = [];
try { menu = JSON.parse(execFileSync('powershell.exe', ['-NoProfile', '-Command', 'Get-StartApps | Select-Object Name, AppID | ConvertTo-Json'], { encoding: 'utf8' }) || '[]'); } catch (e) { /* rien */ }
if (!Array.isArray(menu)) menu = [menu];

// Où chercher un .exe quand le chemin du catalogue est faux : Program Files et les programmes de l'utilisateur.
function chercher(exe) {
  const racines = [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], path.join(process.env.LOCALAPPDATA || '', 'Programs')].filter(Boolean);
  const trouves = [];
  const parcourir = (d, prof) => {
    if (prof > 4 || trouves.length > 2) return;
    let ent = []; try { ent = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
    for (const x of ent) {
      const p = path.join(d, x.name);
      if (x.isDirectory()) parcourir(p, prof + 1); else if (x.name.toLowerCase() === exe.toLowerCase()) trouves.push(p);
    }
  };
  racines.forEach((r) => parcourir(r, 0));
  return trouves;
}

// Les logiciels que les tuiles de Flocon proposent vraiment.
const refs = new Set(CAT.RUBRIQUES.flatMap((r) => r.tuiles).filter((t) => t.type === 'logiciel').map((t) => t.ref).concat(['minecraft']));
// Lance vraiment le logiciel, comme Flocon, et regarde s'il tient 20 secondes.
// Un programme qui rend la main avec le code 0 (calc.exe ouvre la Calculatrice de Windows) n'est pas en échec.
function essayer(chemin, dossier) {
  return new Promise((ok) => {
    const p = require('child_process').spawn(chemin, [], { detached: true, stdio: 'ignore', cwd: dossier || path.dirname(chemin) });
    let fini = false;
    p.once('error', (e) => { fini = true; ok('ne démarre pas : ' + e.message); });
    p.once('exit', (code) => { if (fini) return; fini = true; ok(code === 0 ? 'rend la main (code 0)' : 'SE FERME aussitôt (code ' + code + ')'); });
    setTimeout(() => { if (fini) return; fini = true; ok('s’ouvre et tient'); try { execFileSync('taskkill', ['/F', '/T', '/PID', String(p.pid)], { stdio: 'ignore' }); } catch (e) { /* rien */ } }, 20000);
  });
}
const chemin0 = (l) => (l.chemins || []).map(developper).find((c) => fs.existsSync(c));
const choisirTot = (l) => (l.menus || (l.menu ? [l.menu] : [])).some((n) => menu.some((m) => m.Name && m.Name.toLowerCase().includes(n.toLowerCase())));
const lignes = ['| Logiciel | Résultat |', '|---|---|'];
let manquants = 0;
(async () => {
for (const ref of refs) {
  const l = CAT.LOGICIELS[ref];
  if (l.uri) { lignes.push(`| ${l.nom} | adresse ${l.uri} (application Windows) |`); continue; }
  if (!chemin0(l) && l.manuel) { lignes.push(`| ${l.nom} | à installer à la main : ${l.manuel} |`); continue; }
  if (!chemin0(l) && l.windows11 && !choisirTot(l)) { lignes.push(`| ${l.nom} | application de Windows 11, absente des serveurs de test |`); continue; }
  if (l.store) { lignes.push(`| ${l.nom} | Microsoft Store : s’installe à la main dans la session de l’enfant (voir la notice) |`); continue; }
  const chemin = (l.chemins || []).map(developper).find((c) => fs.existsSync(c));
  const noms = l.menus || (l.menu ? [l.menu] : []);
  // Même règle que Flocon : le nom exact, sinon le plus court qui le contient.
  const choisir = (n) => { const l = menu.filter((m) => m.Name && m.Name.toLowerCase().includes(n.toLowerCase())); return l.find((m) => m.Name.toLowerCase() === n.toLowerCase()) || l.sort((a, b) => a.Name.length - b.Name.length)[0]; };
  const entree = !chemin && noms.map(choisir).find(Boolean);
  if (chemin) {
    let r = ref === 'explorateur' ? 'non lancé' : await essayer(chemin);
    // Klavaro plante parfois au démarrage : on essaie aussi depuis son dossier d'installation, pour comprendre.
    if (/SE FERME/.test(r) && /\\bin\\[^\\]+$/i.test(chemin)) r += ' ; depuis ' + path.dirname(path.dirname(chemin)) + ' : ' + await essayer(chemin, path.dirname(path.dirname(chemin)));
    if (/SE FERME|ne démarre pas/.test(r)) manquants++;
    lignes.push(`| ${l.nom} | trouvé : ${chemin} ; ${r} |`);
  }
  else if (entree) {
    // Trouvé seulement par le menu : le chemin du catalogue est faux, on cherche le vrai pour le corriger.
    const exes = Array.from(new Set((l.chemins || []).map((c) => path.basename(c)).concat(l.exe || [])));
    const vrais = exes.flatMap(chercher);
    lignes.push(`| ${l.nom} | par le menu Démarrer seulement (${entree.Name}, ${entree.AppID})${vrais.length ? ' ; exécutable : ' + vrais.join(', ') : ''} |`);
  }
  else {
    manquants++;
    const exes = Array.from(new Set((l.chemins || []).map((c) => path.basename(c))));
    const ailleurs = exes.flatMap(chercher);
    lignes.push(`| ${l.nom} | INTROUVABLE${ailleurs.length ? ' ; installé ici : ' + ailleurs.join(', ') : ''} |`);
  }
}
const texte = lignes.join('\n');
console.log(texte);
if (process.argv[2]) fs.writeFileSync(process.argv[2], texte + '\n');
process.exit(manquants ? 1 : 0);
})();
