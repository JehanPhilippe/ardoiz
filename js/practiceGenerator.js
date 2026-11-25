/* CapDevoirs — Générateur d'Entraînement Infini & Quiz Aléatoires (Maths, Français, Anglais — CP à 3e) */
(function (global) {
  'use strict';

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function fmtDec(n) {
    return String(Math.round(n * 100) / 100).replace('.', ',');
  }

  function makeNumericChoices(correctVal, deltas, suffix) {
    const suf = suffix || '';
    const set = [correctVal];
    deltas.forEach(function (d) {
      const cand = Math.round((correctVal + d) * 100) / 100;
      if (cand > 0 && set.indexOf(cand) === -1) set.push(cand);
    });
    while (set.length < 4) {
      const cand = Math.round((correctVal + set.length + 2) * 100) / 100;
      if (set.indexOf(cand) === -1) set.push(cand);
    }
    return shuffle(set.slice(0, 4)).map(function (v) { return fmtDec(v) + suf; });
  }

  // ===========================
  // MATHS INFINITE GENERATOR (CP -> 3e)
  // ===========================
  function generateMathExercise(levelId) {
    const uid = 'inf_ma_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);

    if (levelId === 'CP') {
      const variant = randInt(0, 2);
      if (variant === 0) {
        const a = randInt(6, 9);
        const b = randInt(11 - a, 9);
        const ans = a + b;
        return {
          id: uid, levelId: levelId, subjectId: 'maths', chapter: 'Calcul mental (passage par 10)',
          title: 'Addition rapide : ' + a + ' + ' + b, difficulty: 'Infini', source: 'infini',
          prompt: 'Calcule : ' + a + ' + ' + b + ' = ?',
          type: 'choice', options: makeNumericChoices(ans, [-2, -1, 1, 2]), answer: String(ans),
          hints: ['Combien faut-il ajouter à ' + a + ' pour faire 10 ? Il faut ' + (10 - a) + '.', '10 + ' + (b - (10 - a)) + ' = ?'],
          explanation: a + ' + ' + b + ' = (' + a + ' + ' + (10 - a) + ') + ' + (b - (10 - a)) + ' = 10 + ' + (b - (10 - a)) + ' = ' + ans + '.',
          methodSheet: {
            id: 'ms-inf-cp-ma-1', subjectId: 'maths', title: 'Passer par la dizaine (CP)',
            essential: 'Compléter à 10 d’abord simplifie toutes les additions.',
            steps: ['Pars du premier nombre (' + a + ').', 'Ajoute son complément à 10 (' + (10 - a) + ').', 'Ajoute ce qui reste du deuxième nombre.'],
            pitfall: 'Compter deux fois le nombre de départ sur ses doigts.',
            example: a + ' + ' + b + ' = ' + ans + '.'
          }
        };
      } else if (variant === 1) {
        const a = randInt(2, 9);
        const ans = a * 2;
        return {
          id: uid, levelId: levelId, subjectId: 'maths', chapter: 'Les doubles',
          title: 'Double de ' + a, difficulty: 'Infini', source: 'infini',
          prompt: 'Quel est le double de ' + a + ' ?',
          type: 'choice', options: makeNumericChoices(ans, [-2, -1, 2, 3]), answer: String(ans),
          hints: ['Le double de ' + a + ', c’est ' + a + ' + ' + a + '.'],
          explanation: 'Le double de ' + a + ' est ' + a + ' + ' + a + ' = ' + ans + '.',
          methodSheet: {
            id: 'ms-inf-cp-ma-2', subjectId: 'maths', title: 'Connaître les doubles jusqu’à 10',
            essential: 'Le double d’un nombre s’obtient en l’additionnant avec lui-même.',
            steps: ['Écris ' + a + ' + ' + a + '.', 'Mémorise les doubles (5+5=10, 6+6=12, 7+7=14, 8+8=16, 9+9=18).'],
            pitfall: 'Confondre double (×2) et moitié (÷2).',
            example: 'Double de 7 = 14.'
          }
        };
      } else {
        const target = 10;
        const a = randInt(1, 9);
        const ans = target - a;
        return {
          id: uid, levelId: levelId, subjectId: 'maths', chapter: 'Compléments à 10',
          title: 'Complément à 10 de ' + a, difficulty: 'Infini', source: 'infini',
          prompt: 'Combien manque-t-il à ' + a + ' pour arriver à 10 ?',
          type: 'choice', options: makeNumericChoices(ans, [-1, 1, 2, 3]), answer: String(ans),
          hints: ['Cherche le nombre qui, ajouté à ' + a + ', donne 10.'],
          explanation: a + ' + ' + ans + ' = 10.',
          methodSheet: {
            id: 'ms-inf-cp-ma-3', subjectId: 'maths', title: 'Les amis de 10',
            essential: 'Les paires qui font 10 sont : 1+9, 2+8, 3+7, 4+6, 5+5.',
            steps: ['Visualise tes 10 doigts.', 'Baisse ' + a + ' doigts et compte ceux qui restent levés.'],
            pitfall: 'Oublier de vérifier l’addition dans l’autre sens.',
            example: '3 + 7 = 10 et 4 + 6 = 10.'
          }
        };
      }
    }

    if (levelId === 'CE1' || levelId === 'CE2') {
      const variant = randInt(0, 2);
      if (variant === 0) {
        const maxTable = levelId === 'CE1' ? 5 : 9;
        const a = randInt(2, maxTable);
        const b = randInt(3, 9);
        const ans = a * b;
        return {
          id: uid, levelId: levelId, subjectId: 'maths', chapter: 'Tables de multiplication',
          title: 'Multiplication : ' + a + ' × ' + b, difficulty: 'Infini', source: 'infini',
          prompt: 'Calcule : ' + a + ' × ' + b + ' = ?',
          type: 'choice', options: makeNumericChoices(ans, [-a, a, -2, 3]), answer: String(ans),
          hints: [a + ' × ' + b + ' vaut aussi ' + b + ' × ' + a + '.', 'Tu peux décomposer en (' + a + ' × ' + (b - 1) + ') + ' + a + ' = ' + (a * (b - 1)) + ' + ' + a + '.'],
          explanation: a + ' × ' + b + ' = ' + ans + '.',
          methodSheet: {
            id: 'ms-inf-c2-mult', subjectId: 'maths', title: 'Retrouver un résultat de table',
            essential: 'La multiplication est commutative : 7 × 4 = 4 × 7.',
            steps: ['Utilise un résultat voisin que tu connais par cœur (ex. ×5 ou ×10).', 'Ajoute ou retire une fois le facteur.'],
            pitfall: 'Confondre addition (' + a + '+' + b + ') et multiplication (' + a + '×' + b + ').',
            example: '6 × 7 = (6 × 5) + (6 × 2) = 30 + 12 = 42.'
          }
        };
      } else if (variant === 1) {
        const a = randInt(24, levelId === 'CE1' ? 68 : 240);
        const b = randInt(12, levelId === 'CE1' ? 29 : 145);
        const ans = a + b;
        return {
          id: uid, levelId: levelId, subjectId: 'maths', chapter: 'Calcul réfléchi',
          title: 'Addition : ' + a + ' + ' + b, difficulty: 'Infini', source: 'infini',
          prompt: 'Calcule : ' + a + ' + ' + b + ' = ?',
          type: 'choice', options: makeNumericChoices(ans, [-10, 10, -2, 1]), answer: String(ans),
          hints: ['Additionne d’abord les dizaines/centaines, puis les unités.', 'Vérifie le chiffre des unités : ' + (a % 10) + ' + ' + (b % 10) + '.'],
          explanation: a + ' + ' + b + ' = ' + ans + '.',
          methodSheet: {
            id: 'ms-inf-c2-add', subjectId: 'maths', title: 'Décomposer pour additionner',
            essential: 'Séparer centaines, dizaines et unités évite les erreurs de retenue.',
            steps: ['Additionne les unités entre elles.', 'Si ça dépasse 9, reporte la retenue aux dizaines.', 'Vérifie l’ordre de grandeur.'],
            pitfall: 'Oublier la retenue dans la colonne des dizaines.',
            example: '47 + 28 = (40 + 20) + (7 + 8) = 60 + 15 = 75.'
          }
        };
      } else {
        const packs = randInt(3, 8);
        const perPack = randInt(4, 9);
        const ans = packs * perPack;
        const item = pick(['crayons', 'billes', 'images', 'cahiers', 'autocollants']);
        return {
          id: uid, levelId: levelId, subjectId: 'maths', chapter: 'Problèmes multiplicatifs',
          title: 'Problème de paquets (' + item + ')', difficulty: 'Infini', source: 'infini',
          prompt: 'Un élève range ' + packs + ' boîtes contenant chacune ' + perPack + ' ' + item + '. Combien y a-t-il de ' + item + ' en tout ?',
          type: 'choice', options: makeNumericChoices(ans, [-perPack, perPack, -packs, 2]), answer: String(ans),
          hints: ['Chaque boîte contient le même nombre (' + perPack + ').', 'Effectue ' + packs + ' × ' + perPack + '.'],
          explanation: packs + ' × ' + perPack + ' = ' + ans + ' ' + item + '.',
          methodSheet: {
            id: 'ms-inf-c2-pb', subjectId: 'maths', title: 'Choisir la bonne opération en problème',
            essential: '« Chacune contient le même nombre » → multiplication.',
            steps: ['Repère le nombre de groupes (' + packs + ').', 'Multiplie par la quantité dans un groupe (' + perPack + ').'],
            pitfall: 'Additionner les deux nombres de l’énoncé au lieu de les multiplier.',
            example: '5 sacs de 6 pommes = 5 × 6 = 30 pommes.'
          }
        };
      }
    }

    if (levelId === 'CM1' || levelId === 'CM2') {
      const variant = randInt(0, 2);
      if (variant === 0) {
        const a = randInt(11, 45) + randInt(1, 9) / 10;
        const b = randInt(2, 18) + randInt(11, 89) / 100;
        const ans = Math.round((a + b) * 100) / 100;
        return {
          id: uid, levelId: levelId, subjectId: 'maths', chapter: 'Nombres décimaux',
          title: 'Addition décimale : ' + fmtDec(a) + ' + ' + fmtDec(b), difficulty: 'Infini', source: 'infini',
          prompt: 'Calcule : ' + fmtDec(a) + ' + ' + fmtDec(b) + ' = ?',
          type: 'choice', options: makeNumericChoices(ans, [-0.1, 0.1, 1, -1]), answer: fmtDec(ans),
          hints: ['Aligne les virgules en écrivant ' + fmtDec(a) + '0 + ' + fmtDec(b) + '.', 'Calcule centièmes, puis dixièmes, puis unités.'],
          explanation: fmtDec(a) + '0 + ' + fmtDec(b) + ' = ' + fmtDec(ans) + '.',
          methodSheet: {
            id: 'ms-inf-c3-dec', subjectId: 'maths', title: 'Additionner deux nombres décimaux',
            essential: 'Les virgules doivent toujours être alignées verticalement.',
            steps: ['Ajoute un zéro au bout si besoin (ex. 14,7 → 14,70).', 'Additionne colonne par colonne en partant de la droite.', 'Reportes la virgule au résultat.'],
            pitfall: 'Aligner les derniers chiffres sans regarder la virgule.',
            example: '12,4 + 3,25 = 12,40 + 3,25 = 15,65.'
          }
        };
      } else if (variant === 1) {
        const unitPrice = pick([1.5, 2, 2.5, 3, 4]);
        const q1 = randInt(2, 5);
        const q2 = q1 + randInt(2, 4);
        const p1 = unitPrice * q1;
        const ans = unitPrice * q2;
        return {
          id: uid, levelId: levelId, subjectId: 'maths', chapter: 'Proportionnalité',
          title: 'Passage par l’unité (' + q2 + ' cahiers)', difficulty: 'Infini', source: 'infini',
          prompt: q1 + ' cahiers identiques coûtent ' + fmtDec(p1) + ' €. Combien coûtent ' + q2 + ' cahiers ?',
          type: 'choice', options: makeNumericChoices(ans, [-unitPrice, unitPrice, 2, -1], ' €'), answer: fmtDec(ans) + ' €',
          hints: ['Cherche d’abord le prix de 1 seul cahier : ' + fmtDec(p1) + ' ÷ ' + q1 + ' = ' + fmtDec(unitPrice) + ' €.', 'Multiplie ensuite ' + fmtDec(unitPrice) + ' € par ' + q2 + '.'],
          explanation: '1 cahier coûte ' + fmtDec(unitPrice) + ' €, donc ' + q2 + ' cahiers coûtent ' + q2 + ' × ' + fmtDec(unitPrice) + ' = ' + fmtDec(ans) + ' €.',
          methodSheet: {
            id: 'ms-inf-c3-prop', subjectId: 'maths', title: 'Méthode du passage par l’unité',
            essential: 'Trouver le prix de 1 objet permet de calculer n’importe quelle quantité.',
            steps: ['Divise le prix connu par la quantité (' + fmtDec(p1) + ' ÷ ' + q1 + ').', 'Multiplie le prix unitaire par la nouvelle quantité (' + q2 + ').'],
            pitfall: 'Ajouter la différence au lieu de multiplier.',
            example: '4 stylos = 8 € → 1 stylo = 2 € → 7 stylos = 14 €.'
          }
        };
      } else {
        const denom = pick([4, 5, 6, 8, 10]);
        const eaten = randInt(1, denom - 1);
        const rem = denom - eaten;
        const ans = rem + '/' + denom;
        const opts = shuffle([ans, eaten + '/' + denom, rem + '/' + (denom + 2), (rem + 1) + '/' + denom]);
        return {
          id: uid, levelId: levelId, subjectId: 'maths', chapter: 'Fractions simples',
          title: 'Fraction restante sur ' + denom + ' parts', difficulty: 'Infini', source: 'infini',
          prompt: 'Une tablette est partagée en ' + denom + ' parts égales. On en utilise ' + eaten + ' parts. Quelle fraction reste-t-il ?',
          type: 'choice', options: opts, answer: ans,
          hints: ['Le total vaut ' + denom + '/' + denom + '.', 'Calcule ' + denom + ' − ' + eaten + ' pour le numérateur.'],
          explanation: denom + '/' + denom + ' − ' + eaten + '/' + denom + ' = ' + ans + '.',
          methodSheet: {
            id: 'ms-inf-c3-frac', subjectId: 'maths', title: 'Complément d’une fraction à l’unité',
            essential: '1 unité = n/n (même nombre en haut et en bas).',
            steps: ['Garde le dénominateur (' + denom + ').', 'Soustrais les parts utilisées au total (' + denom + ' − ' + eaten + ').'],
            pitfall: 'Donner la fraction prise au lieu de la fraction restante.',
            example: 'Il reste 5/8 quand on a pris 3/8.'
          }
        };
      }
    }

    if (levelId === '6e' || levelId === '5e') {
      const variant = randInt(0, 1);
      if (variant === 0) {
        const a = randInt(3, 12);
        const b = randInt(2, 6);
        const c = randInt(6, 12);
        const d = randInt(1, 5);
        const ans = a + b * (c - d);
        return {
          id: uid, levelId: levelId, subjectId: 'maths', chapter: 'Priorités opératoires',
          title: 'Expression : ' + a + ' + ' + b + ' × (' + c + ' − ' + d + ')', difficulty: 'Infini', source: 'infini',
          prompt: 'Calcule en respectant les priorités : ' + a + ' + ' + b + ' × (' + c + ' − ' + d + ') = ?',
          type: 'choice', options: makeNumericChoices(ans, [(a + b) * (c - d) - ans, -b, b, 4]), answer: String(ans),
          hints: ['Commence par la parenthèse : ' + c + ' − ' + d + ' = ' + (c - d) + '.', 'Multiplie ensuite par ' + b + ' avant d’ajouter ' + a + '.'],
          explanation: a + ' + ' + b + ' × ' + (c - d) + ' = ' + a + ' + ' + (b * (c - d)) + ' = ' + ans + '.',
          methodSheet: {
            id: 'ms-inf-c4-prio', subjectId: 'maths', title: 'Priorités opératoires au collège',
            essential: 'Parenthèses → Multiplications/Divisions → Additions/Soustractions.',
            steps: ['Calcule l’intérieur des parenthèses en premier.', 'Effectue le produit ' + b + ' × ' + (c - d) + '.', 'Termine par l’addition.'],
            pitfall: 'Calculer de gauche à droite (' + a + ' + ' + b + ') avant de multiplier.',
            example: '5 + 2 × (9 − 4) = 5 + 2 × 5 = 15.'
          }
        };
      } else {
        const L = randInt(7, 16);
        const l = randInt(3, 9);
        const ans = L * l;
        return {
          id: uid, levelId: levelId, subjectId: 'maths', chapter: 'Périmètres et aires',
          title: 'Aire d’un rectangle (' + L + ' m × ' + l + ' m)', difficulty: 'Infini', source: 'infini',
          prompt: 'Quelle est l’aire (en m²) d’un rectangle de longueur ' + L + ' m et de largeur ' + l + ' m ?',
          type: 'choice', options: makeNumericChoices(ans, [2 * (L + l) - ans, -L, l, 6], ' m²'), answer: ans + ' m²',
          hints: ['Attention : périmètre = 2×(L+l), mais aire = L × l.', 'Calcule ' + L + ' × ' + l + '.'],
          explanation: 'Aire = L × l = ' + L + ' × ' + l + ' = ' + ans + ' m².',
          methodSheet: {
            id: 'ms-inf-6e-aire', subjectId: 'maths', title: 'Ne pas confondre Périmètre et Aire',
            essential: 'Aire du rectangle = Longueur × largeur (en m²).',
            steps: ['Vérifie que L et l ont la même unité.', 'Multiplie L par l et écris l’unité au carré (m²).'],
            pitfall: 'Calculer le périmètre 2 × (L + l) à la place de l’aire.',
            example: '10 m × 4 m = 40 m².'
          }
        };
      }
    }

    // 4e & 3e
    const variant = randInt(0, 2);
    if (variant === 0) {
      const triple = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]]);
      const ans = triple[2];
      return {
        id: uid, levelId: levelId, subjectId: 'maths', chapter: 'Théorème de Pythagore',
        title: 'Hypoténuse (' + triple[0] + ' cm et ' + triple[1] + ' cm)', difficulty: 'Infini', source: 'infini',
        prompt: 'Dans un triangle ABC rectangle en A, AB = ' + triple[0] + ' cm et AC = ' + triple[1] + ' cm. Combien mesure BC ?',
        type: 'choice', options: makeNumericChoices(ans, [-2, 2, 4, triple[0] + triple[1] - ans], ' cm'), answer: ans + ' cm',
        hints: ['BC² = AB² + AC² = ' + (triple[0] * triple[0]) + ' + ' + (triple[1] * triple[1]) + ' = ' + (ans * ans) + '.', 'Prends la racine carrée : √' + (ans * ans) + '.'],
        explanation: 'BC² = ' + triple[0] + '² + ' + triple[1] + '² = ' + (ans * ans) + ', donc BC = √' + (ans * ans) + ' = ' + ans + ' cm.',
        methodSheet: {
          id: 'ms-inf-4e-pyth', subjectId: 'maths', title: 'Rédiger le théorème de Pythagore',
          essential: 'Dans un triangle rectangle, Hypoténuse² = côté₁² + côté₂².',
          steps: ['Cite que le triangle est rectangle et nomme l’hypoténuse.', 'Additionne les carrés des deux côtés de l’angle droit.', 'Prends la racine carrée pour obtenir la longueur.'],
          pitfall: 'Oublier la racine carrée à la dernière ligne.',
          example: '√(6² + 8²) = √100 = 10 cm.'
        }
      };
    } else if (variant === 1) {
      const a = randInt(2, 6);
      const x = randInt(2, 9);
      const b = randInt(1, 10);
      const res = a * x - b;
      return {
        id: uid, levelId: levelId, subjectId: 'maths', chapter: 'Fonctions & Équations',
        title: 'Image par f(x) = ' + a + 'x − ' + b, difficulty: 'Infini', source: 'infini',
        prompt: 'Soit f(x) = ' + a + 'x − ' + b + '. Quelle est l’image de ' + x + ' par la fonction f ?',
        type: 'choice', options: makeNumericChoices(res, [2 * b, -a, a, 3]), answer: String(res),
        hints: ['Remplace x par ' + x + ' : f(' + x + ') = ' + a + ' × ' + x + ' − ' + b + '.', a + ' × ' + x + ' = ' + (a * x) + ', puis retire ' + b + '.'],
        explanation: 'f(' + x + ') = ' + a + ' × ' + x + ' − ' + b + ' = ' + (a * x) + ' − ' + b + ' = ' + res + '.',
        methodSheet: {
          id: 'ms-inf-3e-fonc', subjectId: 'maths', title: 'Calculer une image (Brevet)',
          essential: 'Image de x → remplacer x et calculer directement.',
          steps: ['Écris f(' + x + ') = ' + a + ' × ' + x + ' − ' + b + '.', 'Respecte la priorité de la multiplication.'],
          pitfall: 'Confondre image (calcul) et antécédent (équation).',
          example: 'f(x)=3x−5 → f(4)=3×4−5=7.'
        }
      };
    } else {
      const a = randInt(2, 7);
      const x = randInt(2, 10);
      const b = randInt(3, 12);
      const c = a * x + b;
      return {
        id: uid, levelId: levelId, subjectId: 'maths', chapter: 'Équations du 1er degré',
        title: 'Résoudre ' + a + 'x + ' + b + ' = ' + c, difficulty: 'Infini', source: 'infini',
        prompt: 'Résous l’équation : ' + a + 'x + ' + b + ' = ' + c + '. Que vaut x ?',
        type: 'choice', options: makeNumericChoices(x, [-1, 1, 2, 3]), answer: String(x),
        hints: ['Soustrais ' + b + ' de chaque côté : ' + a + 'x = ' + (c - b) + '.', 'Divise par ' + a + ' : x = ' + (c - b) + ' ÷ ' + a + '.'],
        explanation: a + 'x = ' + c + ' − ' + b + ' = ' + (c - b) + ', donc x = ' + (c - b) + ' / ' + a + ' = ' + x + '.',
        methodSheet: {
          id: 'ms-inf-4e-eq', subjectId: 'maths', title: 'Résoudre ax + b = c',
          essential: 'On isole x en faisant la même opération des deux côtés du signe =.',
          steps: ['Retire b des deux membres.', 'Divise par a.', 'Vérifie en remplaçant x dans l’équation de départ.'],
          pitfall: 'Changer de côté sans inverser l’opération.',
          example: '3x + 4 = 19 → 3x = 15 → x = 5.'
        }
      };
    }
  }

  // ===========================
  // FRANCAIS INFINITE GENERATOR
  // ===========================
  const FR_POOL = [
    { tiers: ['CP', 'CE1', 'CE2'], chapter: 'Homophones & accords', prompt: 'Choisis la phrase bien accordée au pluriel :', options: ['Les petits chats dorment.', 'Les petit chats dorment.', 'Les petits chat dorment.'], answer: 'Les petits chats dorment.', hint: 'Dans un groupe nominal au pluriel, déterminant, adjectif et nom s’accordent.', explanation: '« Les petits chats » prend un -s à petits et à chats, et le verbe prend -ent.' },
    { tiers: ['CE1', 'CE2', 'CM1'], chapter: 'Présent des verbes en -er', prompt: 'Complète au présent : « Tu (dessiner) ______ un paysage. »', options: ['dessines', 'dessine', 'dessinent'], answer: 'dessines', hint: 'Avec « tu », un verbe du 1er groupe au présent prend toujours un -s.', explanation: 'Avec « tu », la terminaison au présent est -es : tu dessines.' },
    { tiers: ['CE2', 'CM1', 'CM2'], chapter: 'Homophones a / à', prompt: 'Complète : « Léo ______ oublié son cahier ______ la maison. »', options: ['a / à', 'à / a', 'a / a'], answer: 'a / à', hint: 'Remplace par « avait » : « Léo avait oublié » fonctionne, « avait la maison » ne fonctionne pas.', explanation: '« a » est le verbe avoir ; « à » est la préposition invariable.' },
    { tiers: ['CM1', 'CM2', '6e'], chapter: 'Homophones son / sont', prompt: 'Complète : « Ses livres ______ rangés dans ______ cartable. »', options: ['sont / son', 'son / sont', 'sont / sont'], answer: 'sont / son', hint: 'Remplace par « étaient » pour reconnaître le verbe être (sont).', explanation: '« sont » = verbe être (étaient) ; « son » = déterminant possessif (mon).' },
    { tiers: ['CM1', 'CM2', '6e'], chapter: 'Homophones on / ont', prompt: 'Complète : « Les élèves ______ compris comment ______ pose une division. »', options: ['ont / on', 'on / ont', 'ont / ont'], answer: 'ont / on', hint: 'Remplace par « avaient » pour le verbe avoir (ont) et par « il » pour le pronom (on).', explanation: '« ont » = avaient ; « on » = pronom sujet (il).' },
    { tiers: ['CM2', '6e', '5e'], chapter: 'Homophones ces / ses', prompt: 'Complète : « Maya range ______ crayons avant de fermer ______ deux tiroirs-là. »', options: ['ses / ces', 'ces / ses', 'ses / ses'], answer: 'ses / ces', hint: '« ses » = les siens ; « ces » = ceux-là (démonstratif).', explanation: '« ses crayons » (les siens) ; « ces deux tiroirs-là » (démonstratif).' },
    { tiers: ['6e', '5e', '4e', '3e'], chapter: 'Nature et fonction', prompt: 'Dans « Ce film passionnant captive le public », quelle est la NATURE de « passionnant » ?', options: ['Adjectif qualificatif', 'Épithète', 'COD'], answer: 'Adjectif qualificatif', hint: 'La nature est la classe grammaticale dans le dictionnaire ; « épithète » est sa fonction.', explanation: '« passionnant » est un adjectif qualificatif (nature), épithète du nom film (fonction).' },
    { tiers: ['5e', '4e', '3e'], chapter: 'Accord du participe passé', prompt: 'Choisis l’accord correct : « Les lettres qu’il a ______ sont arrivées. »', options: ['écrites', 'écrit', 'écrits'], answer: 'écrites', hint: 'Avec avoir, le participe passé s’accorde avec le COD s’il est placé AVANT le verbe (« que » reprend « Les lettres », féminin pluriel).', explanation: 'COD « que » (= les lettres, fém. plur.) placé avant → écrites.' },
    { tiers: ['4e', '3e'], chapter: 'Figures de style', prompt: 'Quelle figure de style reconnaît-on dans : « Les arbres murmuraient sous le vent » ?', options: ['Une personnification', 'Une hyperbole', 'Une comparaison'], answer: 'Une personnification', hint: 'On attribue une action humaine (murmurer) à des éléments de la nature.', explanation: 'Prêter un comportement humain à un objet ou un arbre est une personnification.' },
    { tiers: ['4e', '3e'], chapter: 'Subordonnées (Brevet)', prompt: 'Dans « Je sais que tu réussiras », quelle est la nature de « que tu réussiras » ?', options: ['Subordonnée conjonctive complétive', 'Subordonnée relative', 'Proposition indépendante'], answer: 'Subordonnée conjonctive complétive', hint: '« que » suit directement un VERBE (« sais »), pas un nom.', explanation: 'Complétant le verbe « sais » (je sais quoi ?), c’est une subordonnée conjonctive complétive (COD).' }
  ];

  function generateFrenchExercise(levelId) {
    const matching = FR_POOL.filter(function (q) { return q.tiers.indexOf(levelId) !== -1; });
    const item = pick(matching.length ? matching : FR_POOL);
    return {
      id: 'inf_fr_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      levelId: levelId, subjectId: 'francais', chapter: item.chapter,
      title: item.chapter + ' (' + levelId + ')', difficulty: 'Infini', source: 'infini',
      prompt: item.prompt, type: 'choice', options: shuffle(item.options), answer: item.answer,
      hints: [item.hint], explanation: item.explanation,
      methodSheet: {
        id: 'ms-inf-fr-' + item.chapter.replace(/\W+/g, '').toLowerCase(),
        subjectId: 'francais', title: 'Réflexe méthode — ' + item.chapter,
        essential: item.explanation,
        steps: ['Lis la phrase entière pour repérer sujet, verbe et accords.', item.hint, 'Relis ta phrase complétée à voix basse pour vérifier le sens.'],
        pitfall: 'Se fier seulement au son à l’oral sans appliquer le test grammatical.',
        example: item.prompt + ' → ' + item.answer
      }
    };
  }

  // ===========================
  // ANGLAIS INFINITE GENERATOR
  // ===========================
  const EN_POOL = [
    { tiers: ['CP', 'CE1', 'CE2'], chapter: 'Couleurs & objets', prompt: 'Comment dit-on « jaune » en anglais ?', options: ['Yellow', 'Green', 'Purple'], answer: 'Yellow', hint: 'Pense au soleil : The sun is...', explanation: 'Jaune = Yellow.' },
    { tiers: ['CP', 'CE1', 'CE2'], chapter: 'Nombres', prompt: 'Quel nombre correspond à « twelve » ?', options: ['12', '20', '2'], answer: '12', hint: 'Ten (10), eleven (11), twelve (...).', explanation: 'Twelve = 12 (20 se dit twenty).' },
    { tiers: ['CE2', 'CM1', 'CM2'], chapter: 'Présent simple', prompt: 'Complète : « My brother ______ (play) guitar every evening. »', options: ['plays', 'play', 'playing'], answer: 'plays', hint: 'My brother = He (3e personne du singulier → -s).', explanation: 'Au présent simple avec he/she/it, le verbe prend -s : plays.' },
    { tiers: ['CM1', 'CM2', '6e'], chapter: 'Questions', prompt: 'Comment demander « Où habites-tu ? » en anglais ?', options: ['Where do you live?', 'Who do you live?', 'When do you live?'], answer: 'Where do you live?', hint: 'Where = où, When = quand, Who = qui.', explanation: 'Where do you live? = Où habites-tu ?' },
    { tiers: ['6e', '5e', '4e'], chapter: 'Verbes irréguliers', prompt: 'Quel est le prétérit (passé) du verbe « to buy » (acheter) ?', options: ['bought', 'buyed', 'brought'], answer: 'bought', hint: 'Attention à ne pas confondre avec bring → brought (sans « r » pour acheter).', explanation: 'buy → bought → bought.' },
    { tiers: ['5e', '4e', '3e'], chapter: 'Verbes irréguliers', prompt: 'Complète au prétérit : « Last summer, we ______ (see) dolphins in Brittany. »', options: ['saw', 'seed', 'seen'], answer: 'saw', hint: 'see → saw → seen (2e colonne pour le prétérit).', explanation: 'Prétérit de see = saw.' },
    { tiers: ['5e', '4e', '3e'], chapter: 'Prétérit interrogatif', prompt: 'Choisis la question correcte au passé :', options: ['Did you visit Paris?', 'Did you visited Paris?', 'Were you visit Paris?'], answer: 'Did you visit Paris?', hint: 'Après l’auxiliaire DID, le verbe revient toujours à la base verbale.', explanation: 'Did + sujet + base verbale : Did you visit Paris?' },
    { tiers: ['4e', '3e'], chapter: 'Present Perfect', prompt: 'Complète : « I have lived in Lyon ______ five years. »', options: ['for', 'since', 'ago'], answer: 'for', hint: 'FOR + durée (5 ans) ; SINCE + point de départ (2021).', explanation: '« five years » est une durée → for five years.' }
  ];

  function generateEnglishExercise(levelId) {
    const matching = EN_POOL.filter(function (q) { return q.tiers.indexOf(levelId) !== -1; });
    const item = pick(matching.length ? matching : EN_POOL);
    return {
      id: 'inf_en_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      levelId: levelId, subjectId: 'anglais', chapter: item.chapter,
      title: item.chapter + ' (' + levelId + ')', difficulty: 'Infini', source: 'infini',
      prompt: item.prompt, type: 'choice', options: shuffle(item.options), answer: item.answer,
      hints: [item.hint], explanation: item.explanation,
      methodSheet: {
        id: 'ms-inf-en-' + item.chapter.replace(/\W+/g, '').toLowerCase(),
        subjectId: 'anglais', title: 'Méthode Anglais — ' + item.chapter,
        essential: item.explanation,
        steps: ['Repère le temps et le sujet de la phrase.', item.hint, 'Répète la phrase correcte à voix haute.'],
        pitfall: 'Traduire mot à mot depuis le français.',
        example: item.prompt + ' → ' + item.answer
      }
    };
  }

  function generateExercise(levelId, subjectId) {
    if (subjectId === 'francais') return generateFrenchExercise(levelId);
    if (subjectId === 'anglais') return generateEnglishExercise(levelId);
    return generateMathExercise(levelId);
  }

  /**
   * Builds a fresh 6-question scored Quiz Express on demand (Maths, Français, or Anglais).
   */
  function generateExpressQuiz(levelId, subjectId, count) {
    const n = count || 6;
    const subj = global.CapCurriculum.getSubjectDef(subjectId);
    const questions = [];
    const seenPrompts = {};
    let guard = 0;

    while (questions.length < n && guard < 40) {
      guard += 1;
      const ex = generateExercise(levelId, subjectId);
      if (seenPrompts[ex.prompt]) continue;
      seenPrompts[ex.prompt] = true;
      questions.push({
        prompt: ex.prompt,
        options: ex.options,
        answer: ex.answer,
        explanation: ex.explanation
      });
    }

    return {
      id: 'quiz-express-' + levelId + '-' + subjectId + '-' + Date.now().toString(36),
      levelId: levelId,
      subjectId: subjectId,
      title: 'Quiz Express Infini — ' + subj.name + ' (' + levelId + ')',
      chapter: 'Série renouvelée de ' + questions.length + ' questions',
      source: 'infini',
      questions: questions
    };
  }

  global.CapPracticeGenerator = {
    generateExercise: generateExercise,
    generateExpressQuiz: generateExpressQuiz
  };
})(window);
