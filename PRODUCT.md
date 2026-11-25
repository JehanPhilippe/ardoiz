# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

HTML5, CSS3 et JavaScript moderne 100 % autonome (sans Node.js ni étape de build), stockage local persistant (`localStorage` + `IndexedDB` pour les photos de cours), hachage des mots de passe côté client (SHA-256 salé) et sauvegarde/restauration JSON. Un script PowerShell natif (`start-app.ps1`) permet en plus de servir l'application localement via HTTP.

## Users

- **Utilisateurs principaux** : enfants scolarisés du **CP à la 3e** (6 à 15 ans) qui font leurs devoirs, s'entraînent sur des exercices guidés, révisent des fiches de méthode et valident leurs acquis avec des quiz notés.
- **Utilisateurs secondaires** : parents qui accompagnent le suivi par matière et par année scolaire, importent des photos de cahiers/cours ou consultent l'historique multi-années.

## Product Purpose

Offrir un atelier d'aide aux devoirs clair, motivant et structuré qui accompagne un enfant sur toute sa scolarité du CP à la 3e : gérer son compte protégé par mot de passe, organiser ses devoirs, faire des exercices interactifs suivis de fiches de méthode, valider ses acquis par des quiz notés, enrichir ses révisions à partir d'exercices personnels ou de photos de cours, et suivre sa progression matière par matière d'une année scolaire à l'autre.

## Positioning

Contrairement à une simple liste de tâches ou à une banque de quiz isolée, **CapDevoirs** relie dans un même carnet durable le parcours multi-années (années passées archivées + année en cours + inscription encadrée à l'année N+1 ouverte à partir du 1er mars avec choix obligatoire du niveau), les devoirs du quotidien, les exercices guidés avec fiches de méthode de clôture, les quiz notés et la création d'exercices/fiches à partir des propres photos de cours de l'élève.

## Operating Context

- Utilisation quotidienne en fin d'après-midi ou le week-end sur ordinateur ou tablette familiale, sous éclairage intérieur de jour ou de lampe de bureau.
- Plusieurs enfants d'une même famille peuvent posséder chacun leur compte avec mot de passe sur le même poste.
- Rythme scolaire français : année de septembre à août (`N / N+1`), réinscription à l'année suivante (`N+1`) autorisée uniquement à partir du **1er mars**, avec choix explicite du niveau scolaire à chaque inscription.

## Capabilities and Constraints

- **Comptes & sécurité locale** : inscription (prénom, identifiant, mot de passe, niveau initial), connexion, déconnexion, changement de mot de passe, multi-comptes locaux, export/import JSON.
- **Années scolaires & règle de mars** : historique séparé par année passée et année en cours ; blocage de l'inscription à l'année N+1 avant le 1er mars et déblocage à partir du 1er mars avec sélection obligatoire du niveau (`CP`, `CE1`, `CE2`, `CM1`, `CM2`, `6e`, `5e`, `4e`, `3e`). Mode simulation de date intégré dans les réglages pour tester la règle à tout moment.
- **Aide aux devoirs complète** : gestionnaire de devoirs, exercices interactifs guidés (indices progressifs + correction), fiches de méthode en fin de séance et en bibliothèque, quiz de validation avec scores (/20 et %) et historique.
- **Contenus personnalisés & photos de cours** : ajout manuel d'exercices/quiz et import de photos de cours pour générer une fiche de méthode, des exercices guidés et un quiz (moteur local 100 % hors-ligne + option API Vision facultative si clé renseignée).
- **Contrainte d'environnement** : doit fonctionner sans Node.js ni Python, en local (`start-app.ps1` ou ouverture directe dans le navigateur).

## Brand Commitments

- Nom : **CapDevoirs**
- Langue : **Français** intégral, ton bienveillant, clair et valorisant (adapté du CP à la 3e sans infantiliser les collégiens).

## Evidence on Hand

- Données de démonstration réalistes pré-intégrées (compte démo « Léa » avec années passées `2024-2025` CE2, `2025-2026` CM1 et année en cours `2026-2027` CM2), clairement identifiées comme données de démonstration.
- Banque pédagogique intégrée couvrant les programmes clés du CP à la 3e.

## Product Principles

1. **Clarté immédiate pour l'élève** : savoir en un coup d'œil quels devoirs faire, quelle matière réviser et où l'on en est dans l'année.
2. **Progression visible dans le temps** : chaque exercice, fiche et quiz alimente l'historique de la matière et de l'année scolaire.
3. **Boucle pédagogique complète** : Devoir → Exercice guidé → Fiche de méthode → Quiz de validation noté.
4. **Règle scolaire explicite et transparente** : la fenêtre d'inscription N+1 (à partir du 1er mars) et le choix du niveau sont visibles, compréhensibles et vérifiables.

## Accessibility & Inclusion

- Contraste texte ≥ 4,5:1, police hautement lisible pour les enfants (`Nunito` + `Fredoka`), cibles tactiles ≥ 44×44 px, navigation complète au clavier, focus visible, support de `prefers-reduced-motion`, graphiques doublés de valeurs chiffrées et labels explicites.
