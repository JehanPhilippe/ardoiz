# Contexte Cloud Firebase, Compte Parent/Enfant & RGPD — Ardoiz

## Projet Firebase
- **Project ID** : `ardoiz-7c6c2` (forfait gratuit Spark, région Europe).
- **Config Web publique** : `js/firebaseConfig.js` (jamais exposée en formulaire dans les réglages utilisateurs).
- **Client SDK sans build** : `js/firebaseCloud.js` (import dynamique ESM Firebase v11.6.0 via `gstatic.com`).

## Authentification & Fusion de comptes
- **Fournisseurs activés** :
  - **Google** (`GoogleAuthProvider`, `signInWithPopup`) — nom public `Ardoiz`.
  - **Adresse e-mail / Mot de passe** (`createUserWithEmailAndPassword` / `signInWithEmailAndPassword`).
  - **Anonyme** (uniquement pour le mode démo / test).
- **Fusion / Liaison de comptes** : dans `Famille & Réglages`, un compte E-mail peut lier Google (`linkWithPopup`) et un compte Google peut ajouter un mot de passe (`linkWithCredential` via `EmailAuthProvider.credential`), conservant le même `uid` et tous les enfants rattachés.
- **Règle stricte « Pas de compte sans enfant »** :
  - À l’inscription ou à la toute première connexion Google sans enfant rattaché (`renderOnboardingScreen`), l’utilisateur **doit** soit créer son 1er enfant en tant que **1er Parent** (prénom + classe + case de consentement parental RGPD < 15 ans horodatée), soit saisir un **code ou lien d’invitation (`?invite=CODE`)** envoyé par un parent. Aucun compte vide ou enfant fictif n’est créé automatiquement.

## Modèle de données à 3 rôles & RGPD (< 15 ans en France)
- **Principe légal** : tout élève CP–3e est mineur (< 15 ans) → le profil appartient à **1 ou 2 parents** (autorité parentale conjointe / co-parentalité en cas de séparation).
- **3 rôles vérifiés côté serveur dans `firestore.rules`** (maintenu via le subagent `firestore-rules-author`) :
  1. **Parents (`parentUids`, 1 à 2)** : contrôle total, co-parentalité, création/révocation d’invitations, ajout d’enfant (`+ Ajouter un enfant` dans le rail gauche), droit à l’effacement RGPD.
  2. **Proches / Accompagnateurs (`helperUids`, 0 à 5 + `helperLabels`)** : tata, tonton, mamie, baby-sitter, prof particulier → accès pédagogique uniquement (`activeYearId`, `schoolUai`, `classId`, `surfaceMode`, `dataJson`, `updatedAt`) + auto-détachement ; révocable en 1 clic par n’importe quel parent ; zéro droit d’invitation ou de suppression.
  3. **Collégien autonome (`studentUid`, 0 ou 1)** : élève disposant de son propre compte Google ou E-mail invité par un parent → accès pédagogique uniquement, révocable en 1 clic par un parent, zéro droit parental ou de suppression.
- **Collections Firestore** :
  - `parents/{parentUid}` : compte adulte + preuve horodatée du consentement parental RGPD (`consentAcceptedAt`, `consentVersion`). Accès propriétaire strict.
  - `children/{childId}` : 17 champs requis (`childId`, `parentUids`, `createdBy`, `helperUids`, `helperLabels`, `studentUid`, `displayName`, `avatarColor`, `activeYearId`, `schoolUai`, `classId`, `surfaceMode`, `dataJson`, `pendingInviteCode`, `pendingInviteRole`, `pendingInviteExpiresAt`, `updatedAt`). `syncStudentToCloud` adapte automatiquement l’écriture selon le rôle (Parent = `setDoc` complet ; Proche/Élève = `updateDoc` pédagogique uniquement).
  - `parentInvites/{code}` : code d’invitation à usage unique (8 car., préfixe `PAR`/`PRO`/`ELV`, TTL 48h, partageable via `?invite=CODE`), `list: false`, consommé atomiquement via `writeBatch` (update `children/{childId}` + delete `parentInvites/{code}`).
  - `users/{uid}` : compatibilité comptes simples / mode démo (propriétaire strict).
  - `schools/{uai}` : résumé établissement officiel (`data.education.gouv.fr`, aucune donnée personnelle).
  - `classes/{classId}` & `classes/{classId}/members/{memberId}` : classement Challenge avec **pseudo uniquement** (jamais de nom de famille ni d’email), accessible aux Parents, Proches et Élève autonome de `children/{memberId}`.
- **Photos de cours & croquis ardoise** : stockés **uniquement en local** dans `IndexedDB` (`js/storage.js`), jamais envoyés vers une IA externe ni exposés publiquement.
- **Droit à l’effacement** : bouton « Supprimer mon compte et mes données » dans `Famille & Réglages` (réservé aux Parents ; purge Firestore + Firebase Auth + localStorage).
