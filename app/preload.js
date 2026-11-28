'use strict';
const { contextBridge, ipcRenderer } = require('electron');

const appel = (canal) => (...a) => ipcRenderer.invoke(canal, ...a);
const canaux = ['init', 'etat', 'demande', 'parent', 'profil', 'mode', 'reduire', 'lancer', 'urlAutorisee', 'jeuxSteam', 'lireDoc', 'ecrireDoc', 'listerDocs', 'ouvrirDossier', 'photos', 'musique', 'livresAudio', 'creations', 'films', 'seance', 'fermer', 'documentExpose', 'documentTexte', 'adresseParent', 'imprimer', 'importerPhotos', 'casque', 'copierCasque', 'choisirFond', 'finir', 'animListe', 'animLire', 'animOctets', 'lireOctets', 'animDecors', 'animProjet', 'animEcrire', 'animEffacer', 'animSupprimer', 'animExporter', 'creationPhoto', 'ecrireStl', 'fairePdf', 'effacerDoc'];
const api = {};
canaux.forEach((c) => { api[c] = appel(c); });
api.surFenetreQuittee = (fn) => ipcRenderer.on('fenetre-quittee', () => fn());
api.surSiteRefuse = (fn) => ipcRenderer.on('site-refuse', (_e, url) => fn(url));
api.surTelechargement = (fn) => ipcRenderer.on('telechargement', (_e, r) => fn(r));
api.surLogicielEchec = (fn) => ipcRenderer.on('logiciel-echec', (_e, r) => fn(r));
contextBridge.exposeInMainWorld('flocon', api);
