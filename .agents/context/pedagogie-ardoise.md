# Contexte Pédagogie, Ardoise & Programmes — Ardoiz

## Modules métiers (tous autonomes, sans build)
- `js/schoolYear.js` : niveaux `CP` → `3e`, calcul année scolaire française (`YYYY-YYYY`, rentrée 1er sept.), règle de déblocage d’inscription `N+1` au **1er mars**.
- `js/curriculum.js` : matières par niveau, exercices guidés avec indices progressifs, fiches de méthode et quiz notés `/20`.
- `js/practiceGenerator.js` : générateur d’**Entraînement infini** et de **Quiz Express Infini (6 questions)** en Maths, Français et Anglais adaptés du CP à la 3e.
- `js/officialProgram.js` : attendus de fin d’année Éduscol (Cycles 2, 3, 4) + synchronisation Open Data `data.education.gouv.fr` (`fr-en-programmes-enseignement-premier-degre` & `2nd-degre`).
- `js/ardoise.js` (`window.ArdoizBoard`) :
  - `ANIMATED_LESSONS` : 9 mini-leçons animées étape par étape à la craie (CP → 3e).
  - `buildLessonFromMethodSheet(sheet)` : transforme n’importe quelle fiche méthode en cours animé sur ardoise.
  - `mountCanvas(el, opts)` : canvas tactile/souris/stylet (5 craies, gomme, 3 fonds, annuler, export PNG).
- `js/courseGenerator.js` : compression photo locale + générateur hors-ligne Photo/Notes → Pack révision (fiche + exercices + quiz).
- `js/storage.js` : `localStorage` (`capdevoirs_db_v2`) + `IndexedDB` (`capdevoirs_media_v1`) + hachage SHA-256 salé + gestion comptes parents & profils enfants + compte démo `Léa`.
- `js/charts.js` : graphiques SVG accessibles (évolution multi-années et courbe des notes aux quiz).
