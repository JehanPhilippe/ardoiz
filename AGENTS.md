# Instructions projet — Ardoiz

## Règles de travail
- Suivre la posture d’avis systématique (**Fonctionnel / Législatif / Technique**) et de **validation conjointe en cas de doute**.
- **Public cible** : enfants du **CP à la 3e** (6–15 ans, donc **mineurs < 15 ans en France** → consentement parental RGPD obligatoire) et leurs **1 ou 2 parents** (y compris en cas de séparation / co-parentalité).
- **Contrainte technique** : application web statique **100 % sans build** (HTML5 / CSS3 / JS natif, pas de Node.js), déployée sur GitHub Pages (`https://jehanphilippe.github.io/ardoiz/`).
- **Sécurité UI** : ne jamais exposer de réglages développeur/infra (clé Firebase, clé API IA, simulateurs techniques) dans l’interface des utilisateurs finaux.

## Cartes de contexte (LIRE EN PREMIER pour économiser les tokens)
Avant de lire les gros fichiers source (`js/app.js`, `styles/app.css`), ouvrir uniquement le guide correspondant à la tâche :
- **Interface, DA & vues** → `.agents/context/ui-architecture.md`
- **Firebase, Comptes Parents/Enfants, Co-parentalité & RGPD** → `.agents/context/cloud-rgpd.md`
- **Pédagogie, Ardoise craie, Exercices, Éduscol & Photo** → `.agents/context/pedagogie-ardoise.md`
