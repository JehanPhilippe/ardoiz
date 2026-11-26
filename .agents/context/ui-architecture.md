# Contexte UI & Architecture — Ardoiz

## Direction Artistique active
- **Interface 1 : « Ardoise & Papier Doux »** (détails complets dans `DESIGN.md`).
- **Mode Operate** : calme, lisible du CP à la 3e, zéro mosaïque multicolore.
- **Thèmes** : `data-surface="paper"` (défaut : fond `#F8F6F0`, rail ardoise `#112A27`, cartes `#FFFFFF`) + `data-surface="night"` (option soir `#0F191C`).

## Fichiers clés
- `index.html` (~33 lignes) : polices `Plus Jakarta Sans` + `Nunito`, chargement ordonné des scripts `js/*.js`.
- `styles/tokens.css` (~235 lignes) : variables couleurs Papier Doux & Nuit, couleurs de matières sobres (`--subj-*`).
- `styles/app.css` (~810 lignes) :
  - Boutons, badges, formulaires : lignes 1–195
  - Écran Auth (Parent / Démo) : lignes 196–365
  - Shell Rail gauche (`.ardoiz-shell`, `.left-rail`) : lignes 366–555
  - Vue `Aujourd’hui` (`.today-top-grid`, `.slate-hero-card`, `.subject-cards-grid`) : lignes 635–755
  - Hub `Matières`, panels, exercices, Challenge, Ardoise craie, modales & responsive : suite du fichier.
- `js/icons.js` (~85 lignes) : icônes SVG 24×24 (aucun emoji).

## Navigation principale (5 entrées fixes sur le rail gauche)
1. `Aujourd’hui` (`dashboard`) : Ardoise du jour + Devoirs cochables + Mes matières.
2. `Mon Ardoise` (`ardoise`) : canvas craie + bloc-notes + cours animés.
3. `Matières` (`subjects`) : hub unifié (`Exercices & Fiches`, `Quiz /20`, `Devoirs`, `Programme Éduscol`, `Photo de cours`).
4. `Challenge` (`challenge`) : annuaire officiel UAI + classement classe & établissement.
5. `Parcours` (`history`) : graphiques multi-années, bilan par matière, passage 1er mars.
- Pied de rail : bascule thème, `Réglages & Famille` (`settings`), `Déconnexion`.
