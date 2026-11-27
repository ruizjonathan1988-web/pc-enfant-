'use strict';
// Logique pure de la tirelire, partagée par le gardien (compte SYSTEM) et l'interface.
// Aucune entrée/sortie ici : tout est testable sans Windows.

const crypto = require('crypto');

const JETON_MIN = 15;

function hacherPin(pin, sel) {
  return crypto.createHash('sha256').update(String(sel) + ':' + String(pin)).digest('hex');
}

function pinValide(config, pin) {
  if (!config || !config.pinHash || pin === undefined || pin === null) return false;
  return hacherPin(pin, config.pinSel) === config.pinHash;
}

// Identifiant de semaine : date du lundi (heure locale) au format AAAA-MM-JJ.
function idSemaine(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const jour = (d.getDay() + 6) % 7; // lundi = 0
  d.setDate(d.getDate() - jour);
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function etatInitial(config, maintenant) {
  return { version: 1, semaine: idSemaine(maintenant), jetonsRestants: config.jetonsSemaine, session: null, attente: 0, journal: [] };
}

function limiteSession(session, config) {
  if (!session) return 0;
  if (session.aDeux) return config.aDeuxMaxMinutes || 120;
  return session.pris * JETON_MIN;
}

// Ferme la session en cours et rend les jetons entiers non entamés.
function fermerSession(etat, config, raison) {
  const s = etat.session;
  if (!s || s.fermee) return etat;
  let rendus = 0;
  if (!s.aDeux) {
    const utilises = Math.ceil(s.minutes / JETON_MIN);
    rendus = Math.max(0, s.pris - utilises);
  }
  etat.jetonsRestants += rendus;
  s.fermee = true;
  s.raison = raison;
  s.rendus = rendus;
  etat.journal = (etat.journal || []).concat([{ id: s.id, debut: s.debut, minutes: s.minutes, pris: s.pris, rendus, aDeux: !!s.aDeux, raison }]).slice(-60);
  return etat;
}

/**
 * Un tic par minute.
 * etat     : état persistant (écrit seulement par le gardien)
 * config   : réglages parent
 * demande  : ce que l'interface demande ({ sessionId, jetons, aDeuxPin, fini })
 * actif    : la session Windows de l'enfant est-elle ouverte et active ?
 * Retourne { etat, deconnecter, message }
 */
function tic(etatEntree, config, demande, maintenant, actif) {
  let etat = etatEntree ? JSON.parse(JSON.stringify(etatEntree)) : etatInitial(config, maintenant);
  let deconnecter = false;
  let message = null;

  // Nouvelle semaine : la tirelire se remplit, sans report.
  const sem = idSemaine(maintenant);
  if (etat.semaine !== sem) {
    if (etat.session && !etat.session.fermee) fermerSession(etat, config, 'semaine');
    etat.semaine = sem;
    etat.jetonsRestants = config.jetonsSemaine;
  }

  // Nouvelle séance demandée par l'interface.
  if (demande && demande.sessionId && (!etat.session || etat.session.id !== demande.sessionId)) {
    if (etat.session && !etat.session.fermee) fermerSession(etat, config, 'nouvelle');
    const aDeux = !!demande.aDeuxPin && pinValide(config, demande.aDeuxPin);
    const max = Math.min(config.maxParSeance, etat.jetonsRestants);
    const pris = aDeux ? 0 : Math.max(0, Math.min(Math.floor(Number(demande.jetons) || 0), max));
    etat.jetonsRestants -= pris;
    etat.session = { id: demande.sessionId, debut: maintenant.toISOString(), pris, aDeux, minutes: 0, fermee: false };
    etat.attente = 0;
    if (demande.aDeuxPin && !aDeux) message = 'pin-refuse';
  }

  const s = etat.session;
  const enCours = s && !s.fermee;

  // « J'ai fini » : on ferme et on rend les jetons non entamés.
  if (enCours && demande && demande.fini && demande.sessionId === s.id) {
    fermerSession(etat, config, 'fini');
  } else if (actif) {
    if (enCours) {
      s.minutes += 1;
      if (s.minutes >= limiteSession(s, config)) {
        // Temps écoulé : la séance se ferme, l'écran « au revoir » a une minute pour s'afficher.
        fermerSession(etat, config, 'temps');
        etat.attente = 0;
      }
    } else {
      // Session Windows ouverte sans séance en cours : un peu de grâce, puis déconnexion.
      // Après un temps écoulé, une seule minute ; sinon quelques minutes pour choisir ses jetons.
      etat.attente = (etat.attente || 0) + 1;
      // Première connexion (atelier) : 30 minutes, une seule fois, tant qu'aucune séance n'a eu lieu.
      const premiere = demande && demande.atelier && !(etat.journal || []).length && !s;
      const grace = premiere ? 30 : s && s.raison === 'temps' ? 1 : (config.graceMinutes || 5);
      if (etat.attente > grace) { deconnecter = true; etat.attente = 0; }
    }
  }

  const sc = etat.session;
  etat.resteMinutes = sc && !sc.fermee ? Math.max(0, limiteSession(sc, config) - sc.minutes) : 0;
  etat.majLe = maintenant.toISOString();
  return { etat, deconnecter, message };
}

// Changements demandés depuis le panneau parent : appliqués seulement avec le bon code.
const CLES_PARENT = ['jetonsSemaine', 'maxParSeance', 'aDeuxMaxMinutes', 'sites', 'jeux', 'logiciels'];
function appliquerParent(config, etat, requete) {
  if (!requete || !pinValide(config, requete.pin)) return { ok: false, config, etat };
  const c = JSON.parse(JSON.stringify(config));
  const e = etat ? JSON.parse(JSON.stringify(etat)) : etat;
  const ch = requete.changements || {};
  for (const k of CLES_PARENT) if (ch[k] !== undefined) c[k] = ch[k];
  c.jetonsSemaine = Math.max(0, Math.min(40, Math.floor(Number(c.jetonsSemaine) || 0)));
  c.maxParSeance = Math.max(1, Math.min(8, Math.floor(Number(c.maxParSeance) || 1)));
  if (ch.ajouterJetons && e) e.jetonsRestants = Math.max(0, e.jetonsRestants + Math.floor(Number(ch.ajouterJetons)));
  if (ch.nouveauPin && String(ch.nouveauPin).length >= 4) {
    c.pinSel = crypto.randomBytes(8).toString('hex');
    c.pinHash = hacherPin(ch.nouveauPin, c.pinSel);
  }
  return { ok: true, config: c, etat: e };
}

function configParDefaut() {
  return {
    version: 1,
    enfant: { prenom: 'Mon enfant', compte: 'Enfant', sid: null },
    jetonsSemaine: 8,
    maxParSeance: 5,
    aDeuxMaxMinutes: 120,
    graceMinutes: 5,
    pinSel: null,
    pinHash: null,
    sites: null, // null = liste par défaut de l'application
    jeux: [],
    logiciels: null
  };
}

module.exports = { JETON_MIN, hacherPin, pinValide, idSemaine, etatInitial, limiteSession, fermerSession, tic, appliquerParent, configParDefaut };
