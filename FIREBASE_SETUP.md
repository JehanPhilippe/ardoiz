# Guide rapide : Activer Firebase Cloud & Challenge Classe / Établissement (3 minutes, gratuit)

CapDevoirs fonctionne **100 % hors-ligne par défaut** et se connecte automatiquement au cloud dès que vous ajoutez la configuration de votre projet **Firebase** (offre gratuite **Spark**, sans carte bancaire requise pour démarrer).

---

## Étape 1 — Créer votre projet Firebase gratuit
1. Ouvrez **https://console.firebase.google.com/** et cliquez sur **Créer un projet** (ex. `capdevoirs-ecole`).
2. Désactivez Google Analytics (inutile ici) puis cliquez sur **Créer le projet**.

## Étape 2 — Activer l'authentification (Firebase Auth)
1. Dans le menu de gauche : **Créer → Authentication → Commencer**.
2. Dans l'onglet **Sign-in method**, activez :
   - **Anonyme** *(recommandé pour les élèves : pas besoin d'adresse e-mail réelle)*
   - *(Optionnel)* **Adresse e-mail / Mot de passe**
3. Dans l'onglet **Settings → Authorized domains**, cliquez sur **Add domain** et ajoutez :
   - `jehanphilippe.github.io` *(sans `https://` ni `/capdevoirs`)*
   - `localhost` est déjà autorisé par défaut.

## Étape 3 — Créer la base Cloud Firestore & appliquer la sécurité
1. Dans le menu de gauche : **Créer → Firestore Database → Créer une base de données**.
2. Choisissez un emplacement européen : **`eur3` (europe-west)** ou **`europe-west9` (Paris)**, puis **Démarrer en mode production**.
3. Ouvrez l'onglet **Règles (Rules)** dans Firestore, copiez-collez l'intégralité du fichier **`firestore.rules`** présent à la racine de ce dépôt, puis cliquez sur **Publier**.

## Étape 4 — Récupérer la configuration Web (`firebaseConfig`)
1. Cliquez sur l'icône **engrenage (Paramètres du projet)** en haut à gauche → onglet **Général**.
2. Descendez jusqu'à **Vos applications**, cliquez sur l'icône **Web (`</>`)**, donnez un nom (`CapDevoirs Web`) et cliquez sur **Enregistrer l'application**.
3. Copiez les valeurs affichées (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).

## Étape 5 — Brancher dans CapDevoirs
Deux options au choix :
- **Test rapide sur votre poste** : ouvrez **CapDevoirs → Compte & Réglages → Connexion Cloud Firebase**, collez les champs et cliquez sur **Connecter Firebase**.
- **Pour toute l'école / la classe sur GitHub Pages** : reportez ces valeurs dans **`js/firebaseConfig.js`** (les clés Web Firebase sont publiques par conception ; c'est **`firestore.rules`** qui protège les données !), puis poussez sur GitHub (`git push`).

---

## Comment fonctionne le Challenge Classe & Établissement ?
1. Chaque élève ouvre l'onglet **Challenge** et recherche son **école ou collège officiel** (annuaire `data.education.gouv.fr`, code UAI).
2. L'enseignant (ou un premier élève/parent) clique sur **Créer ma classe** (ex. `CM2-A`) et obtient un **code d'invitation à 6 caractères** (ex. `CM2A48`).
3. Les autres élèves de la classe entrent simplement ce code pour rejoindre le **classement de la classe** et l'**objectif collectif de la semaine**, avec uniquement un **pseudo** *(aucun nom de famille complet ni e-mail n'est stocké dans le classement, dans le respect du RGPD pour les mineurs)*.
