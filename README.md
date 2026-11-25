# CapDevoirs — Atelier d'aide aux devoirs du CP à la 3e

Application web autonome (HTML5 / CSS3 / JavaScript) d'aide aux devoirs et de suivi scolaire multi-années, conçue pour les élèves du **CP à la 3e** et leurs parents.

## Fonctionnalités

- **Comptes protégés par mot de passe** : inscription avec choix obligatoire du niveau scolaire initial (`CP` à `3e`), hachage SHA-256 salé côté client, multi-comptes locaux (fratrie), sauvegarde/restauration JSON et compte démo inclus (`lea` / `soleil`).
- **Suivi multi-années & règle d'inscription N+1 au 1er mars** : archives complètes des années passées, année active, ouverture de l'inscription à l'année `N+1` à partir du **1er mars** avec choix obligatoire du niveau (et simulateur de date intégré pour tester la règle).
- **Mosaïque de Tuiles Vivantes (DA 2)** : accès immédiat par matière, mode Nuit / Jour clair, devoirs prioritaires, scores `/20` et barres de maîtrise.
- **Exercices guidés, fiches de méthode & quiz notés** : indices progressifs, fiche de méthode récapitulative en fin d'exercice, quiz de validation notés sur 20 et historique des tentatives.
- **Studio Photo de cours & création manuelle** : import de photo de cahier/cours (stockée localement dans IndexedDB) pour générer un pack éditable (fiche méthode + exercices + quiz).
- **Programme officiel Éducation nationale** : attendus de fin d'année Éduscol (Cycles 2, 3 et 4) et synchronisation en direct avec l'API Open Data `data.education.gouv.fr` (textes BOEN et PDF officiels).

## Lancer en local

- Double-cliquer sur `index.html`, **ou**
- Lancer le serveur local PowerShell :
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\start-app.ps1 -Port 8080
  ```
  Puis ouvrir `http://localhost:8080/`.

## Mise en ligne via GitHub Pages

Tous les chemins étant relatifs et le fichier `.nojekyll` étant présent à la racine, l'application se publie directement via **GitHub Pages** :
1. Dans votre dépôt GitHub, ouvrez **Settings → Pages**.
2. Sous **Build and deployment**, sélectionnez **Deploy from a branch**, branche **`main`**, dossier **`/ (root)`**, puis **Save**.
3. Votre lien partageable apparaît en ~30 secondes à l'adresse `https://<votre-pseudo>.github.io/<nom-du-depot>/`.
