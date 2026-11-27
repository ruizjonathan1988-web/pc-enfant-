# Flocon

Un ordinateur qui apprend à s'en passer : une session Windows créative pour un enfant de 8 à 11 ans, avec une tirelire de temps d'écran qu'il gère lui-même, des logiciels et des sites choisis, et un compagnon qui sait se taire.

## Installer

Dans PowerShell, sur l'ordinateur familial :

```
irm https://raw.githubusercontent.com/ruizjonathan1988-web/pc-enfant-/main/en-ligne.ps1 | iex
```

Ou téléchargez `Flocon-installation.zip` dans la dernière release, extrayez-le et double-cliquez sur `Installer Flocon.cmd`. La notice complète est dans `LISEZMOI.html`.

## Contenu

- `app/` : l'application (Electron). `gardien.js` tourne chaque minute avec le compte SYSTEM et tient la tirelire ; `lib/tirelire.js` contient toute la logique du temps, testée dans `tests/`.
- `installer/` : installation et désinstallation (PowerShell).
- `en-ligne.ps1` : installation en une ligne.

## Nouveautés de la 1.4

- Permis en quatre niveaux, validé par le parent : Explorateur de fichiers au niveau 2, Edge limité aux sites autorisés au niveau 3, Flocon fermable au niveau 4.
- « Ma semaine » : bilan du dimanche et plan des jetons de la semaine suivante ; humeur facultative en début de séance.
- « Mon agenda », rappels à l'accueil.
- Exposé exporté en vrai fichier .docx, impression depuis la galerie, LibreOffice préréglé (onglets, formats Microsoft).

Tests : `node tests/tirelire.test.js`
