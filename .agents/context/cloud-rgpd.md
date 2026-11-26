# Contexte Cloud Firebase, Compte Parent/Enfant & RGPD — Ardoiz

## Projet Firebase
- **Project ID** : `ardoiz-7c6c2` (forfait gratuit Spark, région Europe).
- **Config Web publique** : `js/firebaseConfig.js` (jamais exposée en formulaire dans les réglages utilisateurs).
- **Client SDK sans build** : `js/firebaseCloud.js` (import dynamique ESM Firebase v11.6.0 via `gstatic.com`).

## Modèle de données & RGPD (< 15 ans en France)
- **Principe légal** : tout élève CP–3e est mineur (< 15 ans) → le compte appartient à **1 ou 2 parents** (autorité parentale conjointe / co-parentalité en cas de séparation).
- **Collections Firestore** (sécurisées par `firestore.rules`, géré par le subagent `firestore-rules-author`) :
  - `parents/{parentUid}` : compte parent adulte (prénom, email, horodatage consentement parental RGPD). Accès propriétaire strict.
  - `children/{childId}` : profil enfant rattaché à `parentUids: [uid1]` ou `[uid1, uid2]` (max 2 parents). Contient `schoolYears`, `notes`, `challenge` dans `dataJson`. Accès strict aux seuls parents listés dans `parentUids`.
  - `parentInvites/{code}` : code d’invitation co-parent à usage unique (8 car., expire en 48h) permettant au 2e parent de rattacher l’enfant existant à son compte sans exposer la liste des enfants.
  - `users/{uid}` : compatibilité comptes simples / mode démo (propriétaire strict).
  - `schools/{uai}` : résumé établissement officiel (`data.education.gouv.fr`, aucune donnée personnelle).
  - `classes/{classId}` & `classes/{classId}/members/{memberId}` : classement Challenge avec **pseudo uniquement** (jamais de nom de famille ni d’email).
- **Photos de cours & croquis ardoise** : stockés **uniquement en local** dans `IndexedDB` (`js/storage.js`), jamais envoyés vers une IA externe ni exposés publiquement.
- **Droit à l’effacement** : bouton « Supprimer mon compte et mes données » dans `Réglages & Famille` (purge Firestore + Firebase Auth + localStorage).
