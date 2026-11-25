/* Ardoiz — Interactive Chalkboard Canvas, Note-Taking Helpers & Animated Slate Lessons (CP → 3e) */
(function (global) {
  'use strict';

  const CHALK_COLORS = [
    { id: 'white', label: 'Craie blanche', hex: '#F8FAFC' },
    { id: 'yellow', label: 'Craie jaune', hex: '#FDE047' },
    { id: 'cyan', label: 'Craie cyan', hex: '#38BDF8' },
    { id: 'coral', label: 'Craie corail', hex: '#FB7185' },
    { id: 'mint', label: 'Craie menthe', hex: '#4ADE80' }
  ];

  const ANIMATED_LESSONS = [
    {
      id: 'anim_addition_retenue',
      levels: ['CP', 'CE1', 'CE2'],
      subjectId: 'maths',
      title: 'Poser une addition avec retenue (27 + 15)',
      duration: '4 étapes',
      steps: [
        {
          caption: '1. Aligne bien les unités sous les unités et les dizaines sous les dizaines.',
          chalk: [
            { kind: 'heading', color: 'cyan', text: 'Addition posée : 27 + 15' },
            { kind: 'equation', color: 'white', text: '   D  U\n   2  7\n+  1  5\n-------' }
          ]
        },
        {
          caption: '2. Commence toujours par la colonne des unités : 7 + 5 = 12.',
          chalk: [
            { kind: 'note', color: 'yellow', text: 'Unités : 7 + 5 = 12  →  je pose 2 et je retiens 1 dizaine !' },
            { kind: 'equation', color: 'white', text: '  (+1)\n   2  7\n+  1  5\n-------\n      2' }
          ]
        },
        {
          caption: '3. Additionne maintenant les dizaines sans oublier la retenue : 1 + 2 + 1 = 4.',
          chalk: [
            { kind: 'note', color: 'mint', text: 'Dizaines : 1 (retenue) + 2 + 1 = 4' },
            { kind: 'equation', color: 'yellow', text: '   2  7\n+  1  5\n=======\n   4  2' }
          ]
        },
        {
          caption: '4. Résultat vérifié : 27 + 15 = 42. Astuce : 27 + 10 = 37, puis 37 + 5 = 42 !',
          chalk: [
            { kind: 'highlight', color: 'mint', text: '27 + 15 = 42   ✓   (Retenue bien placée en haut des dizaines)' }
          ]
        }
      ]
    },
    {
      id: 'anim_accord_sujet_verbe',
      levels: ['CE1', 'CE2', 'CM1'],
      subjectId: 'francais',
      title: 'L’accord du verbe avec son sujet au présent',
      duration: '4 étapes',
      steps: [
        {
          caption: '1. Commence par repérer le verbe conjugué dans la phrase.',
          chalk: [
            { kind: 'heading', color: 'cyan', text: 'Phrase : « Les oiseaux chant… dans le jardin. »' },
            { kind: 'note', color: 'white', text: 'Verbe à l’infinitif : chanter (1er groupe)' }
          ]
        },
        {
          caption: '2. Pose la question « Qui est-ce qui + verbe ? » pour trouver le sujet.',
          chalk: [
            { kind: 'note', color: 'yellow', text: 'Qui est-ce qui chante ?  →  « Les oiseaux »' },
            { kind: 'equation', color: 'cyan', text: 'Les oiseaux  =  ils  (3e personne du pluriel)' }
          ]
        },
        {
          caption: '3. Choisis la terminaison du présent pour « ils / elles » : -ent.',
          chalk: [
            { kind: 'equation', color: 'mint', text: 'je -e · tu -es · il -e · nous -ons · vous -ez · ils -ENT' }
          ]
        },
        {
          caption: '4. Attention au piège : on n’entend pas le « -ent », mais il est obligatoire pour un verbe !',
          chalk: [
            { kind: 'highlight', color: 'yellow', text: 'Les oiseaux chantent dans le jardin.   ✓' },
            { kind: 'note', color: 'coral', text: 'Piège : jamais de « -s » à la fin d’un verbe avec « ils » (c’est pour les noms !).' }
          ]
        }
      ]
    },
    {
      id: 'anim_fractions_visuelles',
      levels: ['CE2', 'CM1', 'CM2', '6e'],
      subjectId: 'maths',
      title: 'Visualiser et additionner des fractions (1/4 + 2/4)',
      duration: '4 étapes',
      steps: [
        {
          caption: '1. Une fraction partage une unité en parts égales : le dénominateur (en bas) indique le nombre de parts.',
          chalk: [
            { kind: 'heading', color: 'cyan', text: 'Fractions : Numérateur (haut) / Dénominateur (bas)' },
            {
              kind: 'diagram',
              svg:
                '<svg viewBox="0 0 360 72" class="chalk-svg" aria-label="Barre partagée en 4 quarts">' +
                '<rect x="12" y="14" width="336" height="40" rx="6" fill="none" stroke="#F8FAFC" stroke-width="2.5"/>' +
                '<line x1="96" y1="14" x2="96" y2="54" stroke="#F8FAFC" stroke-width="2"/>' +
                '<line x1="180" y1="14" x2="180" y2="54" stroke="#F8FAFC" stroke-width="2"/>' +
                '<line x1="264" y1="14" x2="264" y2="54" stroke="#F8FAFC" stroke-width="2"/>' +
                '<text x="54" y="40" fill="#F8FAFC" font-size="16" font-weight="800" text-anchor="middle">1/4</text>' +
                '<text x="138" y="40" fill="#F8FAFC" font-size="16" font-weight="800" text-anchor="middle">1/4</text>' +
                '<text x="222" y="40" fill="#F8FAFC" font-size="16" font-weight="800" text-anchor="middle">1/4</text>' +
                '<text x="306" y="40" fill="#F8FAFC" font-size="16" font-weight="800" text-anchor="middle">1/4</text>' +
                '</svg>'
            }
          ]
        },
        {
          caption: '2. Colorions 1/4 en cyan puis ajoutons 2/4 en jaune.',
          chalk: [
            {
              kind: 'diagram',
              svg:
                '<svg viewBox="0 0 360 72" class="chalk-svg" aria-label="1/4 plus 2/4 égal 3/4">' +
                '<rect x="12" y="14" width="84" height="40" fill="rgba(56,189,248,0.35)" stroke="#38BDF8" stroke-width="2.5"/>' +
                '<rect x="96" y="14" width="168" height="40" fill="rgba(253,224,71,0.3)" stroke="#FDE047" stroke-width="2.5"/>' +
                '<rect x="264" y="14" width="84" height="40" fill="none" stroke="#F8FAFC" stroke-width="2" stroke-dasharray="5 4"/>' +
                '<line x1="180" y1="14" x2="180" y2="54" stroke="#FDE047" stroke-width="2"/>' +
                '<text x="54" y="40" fill="#38BDF8" font-size="16" font-weight="800" text-anchor="middle">1/4</text>' +
                '<text x="180" y="40" fill="#FDE047" font-size="16" font-weight="800" text-anchor="middle">+ 2/4</text>' +
                '<text x="306" y="40" fill="#94A3B8" font-size="14" font-weight="700" text-anchor="middle">reste 1/4</text>' +
                '</svg>'
            }
          ]
        },
        {
          caption: '3. Règle d’or : quand le dénominateur est identique, on additionne UNIQUEMENT les numérateurs !',
          chalk: [
            { kind: 'equation', color: 'yellow', text: '1/4  +  2/4  =  (1 + 2) / 4  =  3/4' }
          ]
        },
        {
          caption: '4. Piège classique à éviter : on n’additionne JAMAIS les dénominateurs entre eux.',
          chalk: [
            { kind: 'note', color: 'coral', text: 'Faux : 1/4 + 2/4 ≠ 3/8  (les parts restent des quarts !)' },
            { kind: 'highlight', color: 'mint', text: 'Juste : 1/4 + 2/4 = 3/4  (et 4/4 = 1 unité entière)  ✓' }
          ]
        }
      ]
    },
    {
      id: 'anim_homophones_a_et',
      levels: ['CM1', 'CM2', '6e'],
      subjectId: 'francais',
      title: 'Ne plus confondre « a / à » et « et / est »',
      duration: '4 étapes',
      steps: [
        {
          caption: '1. Pour choisir entre « a » (verbe avoir) et « à » (préposition), remplace par « avait ».',
          chalk: [
            { kind: 'heading', color: 'cyan', text: 'Test express : remplace par AVAIT' },
            { kind: 'equation', color: 'white', text: 'Léa (a / à) fini son dessin  →  Léa AVAIT fini  ✓  donc « a » !' }
          ]
        },
        {
          caption: '2. Si « avait » ne veut rien dire dans la phrase, mets l’accent grave : « à ».',
          chalk: [
            { kind: 'equation', color: 'yellow', text: 'Elle va (a / à) l’école  →  Elle va AVAIT l’école  ✗  donc « à » !' }
          ]
        },
        {
          caption: '3. Pour choisir entre « est » (verbe être) et « et » (liaison), remplace par « était ».',
          chalk: [
            { kind: 'heading', color: 'cyan', text: 'Test express : remplace par ÉTAIT' },
            { kind: 'equation', color: 'mint', text: 'Le cahier EST propre (ÉTAIT ✓)  ET  bien rangé (ÉTAIT ✗).' }
          ]
        },
        {
          caption: '4. Retiens le duo magique sur l’ardoise : « a = avait », « est = était ».',
          chalk: [
            { kind: 'highlight', color: 'mint', text: 'a → avait  |  est → était  |  Sinon : à (accent) ou et (puis)' }
          ]
        }
      ]
    },
    {
      id: 'anim_priorites_operatoires',
      levels: ['6e', '5e', '4e'],
      subjectId: 'maths',
      title: 'Priorités opératoires : calculer 4 + 3 × (8 − 2)',
      duration: '4 étapes',
      steps: [
        {
          caption: '1. Avant de calculer de gauche à droite, applique l’ordre de priorité : Parenthèses → × / ÷ → + / −.',
          chalk: [
            { kind: 'heading', color: 'cyan', text: 'A = 4 + 3 × (8 − 2)' },
            { kind: 'note', color: 'yellow', text: 'Priorité n°1 : les parenthèses  (8 − 2) = 6' }
          ]
        },
        {
          caption: '2. Réécris toute la ligne en remplaçant uniquement ce qui vient d’être calculé.',
          chalk: [
            { kind: 'equation', color: 'white', text: 'A = 4 + 3 × 6' },
            { kind: 'note', color: 'cyan', text: 'Priorité n°2 : la multiplication passe avant l’addition !' }
          ]
        },
        {
          caption: '3. Calcule 3 × 6 = 18 (ne fais surtout pas 4 + 3 = 7 !).',
          chalk: [
            { kind: 'equation', color: 'yellow', text: 'A = 4 + 18' }
          ]
        },
        {
          caption: '4. Termine par l’addition finale : A = 22.',
          chalk: [
            { kind: 'highlight', color: 'mint', text: 'A = 22   ✓   (Un seul calcul par ligne = zéro erreur de priorité)' }
          ]
        }
      ]
    },
    {
      id: 'anim_aire_triangle',
      levels: ['CM2', '6e', '5e'],
      subjectId: 'maths',
      title: 'Comprendre l’aire d’un triangle : (Base × Hauteur) ÷ 2',
      duration: '4 étapes',
      steps: [
        {
          caption: '1. Un triangle est toujours exactement la moitié d’un rectangle de même base et même hauteur.',
          chalk: [
            { kind: 'heading', color: 'cyan', text: 'Base b = 8 cm  ·  Hauteur h = 5 cm' },
            {
              kind: 'diagram',
              svg:
                '<svg viewBox="0 0 340 130" class="chalk-svg" aria-label="Triangle inscrit dans un rectangle">' +
                '<rect x="40" y="18" width="240" height="84" fill="none" stroke="#94A3B8" stroke-width="2" stroke-dasharray="6 4"/>' +
                '<polygon points="40,102 280,102 185,18" fill="rgba(56,189,248,0.22)" stroke="#38BDF8" stroke-width="3"/>' +
                '<line x1="185" y1="18" x2="185" y2="102" stroke="#FDE047" stroke-width="2.5" stroke-dasharray="4 4"/>' +
                '<rect x="185" y="90" width="12" height="12" fill="none" stroke="#FDE047" stroke-width="2"/>' +
                '<text x="160" y="122" fill="#F8FAFC" font-size="14" font-weight="800" text-anchor="middle">base b = 8 cm</text>' +
                '<text x="200" y="64" fill="#FDE047" font-size="14" font-weight="800">h = 5 cm</text>' +
                '</svg>'
            }
          ]
        },
        {
          caption: '2. L’aire du rectangle complet vaut b × h = 8 × 5 = 40 cm².',
          chalk: [
            { kind: 'equation', color: 'white', text: 'Aire(rectangle) = 8 × 5 = 40 cm²' }
          ]
        },
        {
          caption: '3. Comme le triangle occupe la moitié du rectangle, on divise par 2 !',
          chalk: [
            { kind: 'equation', color: 'yellow', text: 'Aire(triangle) = (b × h) / 2 = (8 × 5) / 2 = 40 / 2 = 20 cm²' }
          ]
        },
        {
          caption: '4. N’oublie jamais l’unité au carré (cm², m²) et vérifie l’angle droit de la hauteur.',
          chalk: [
            { kind: 'highlight', color: 'mint', text: 'Aire = 20 cm²   ✓   (Hauteur toujours perpendiculaire à la base)' }
          ]
        }
      ]
    },
    {
      id: 'anim_pythagore',
      levels: ['4e', '3e'],
      subjectId: 'maths',
      title: 'Théorème de Pythagore : calculer l’hypoténuse',
      duration: '5 étapes',
      steps: [
        {
          caption: '1. Condition obligatoire : le triangle ABC doit être rectangle (ici en B). L’hypoténuse [AC] est face à l’angle droit.',
          chalk: [
            { kind: 'heading', color: 'cyan', text: 'Triangle ABC rectangle en B · AB = 3 cm · BC = 4 cm' },
            {
              kind: 'diagram',
              svg:
                '<svg viewBox="0 0 340 140" class="chalk-svg" aria-label="Triangle rectangle ABC pour Pythagore">' +
                '<polygon points="70,115 240,115 70,25" fill="rgba(56,189,248,0.18)" stroke="#F8FAFC" stroke-width="3"/>' +
                '<rect x="70" y="101" width="14" height="14" fill="none" stroke="#FDE047" stroke-width="2.5"/>' +
                '<line x1="70" y1="25" x2="240" y2="115" stroke="#FB7185" stroke-width="3.5"/>' +
                '<text x="54" y="24" fill="#F8FAFC" font-size="15" font-weight="800">A</text>' +
                '<text x="54" y="124" fill="#F8FAFC" font-size="15" font-weight="800">B</text>' +
                '<text x="248" y="124" fill="#F8FAFC" font-size="15" font-weight="800">C</text>' +
                '<text x="34" y="74" fill="#38BDF8" font-size="14" font-weight="800">3 cm</text>' +
                '<text x="155" y="134" fill="#38BDF8" font-size="14" font-weight="800" text-anchor="middle">4 cm</text>' +
                '<text x="172" y="62" fill="#FB7185" font-size="15" font-weight="800">AC = ?</text>' +
                '</svg>'
            }
          ]
        },
        {
          caption: '2. Écris l’égalité de Pythagore : le carré de l’hypoténuse égale la somme des carrés des deux autres côtés.',
          chalk: [
            { kind: 'equation', color: 'yellow', text: 'AC²  =  AB²  +  BC²' }
          ]
        },
        {
          caption: '3. Remplace par les longueurs connues puis calcule chaque carré.',
          chalk: [
            { kind: 'equation', color: 'white', text: 'AC²  =  3² + 4²  =  9 + 16  =  25' }
          ]
        },
        {
          caption: '4. Passe de AC² à AC en prenant la racine carrée √25 (car une longueur est toujours positive).',
          chalk: [
            { kind: 'equation', color: 'cyan', text: 'AC  =  √25  =  5 cm' }
          ]
        },
        {
          caption: '5. Vérification rapide : 5 cm est bien plus grand que 3 cm et 4 cm (l’hypoténuse est toujours le plus grand côté).',
          chalk: [
            { kind: 'highlight', color: 'mint', text: 'AC = 5 cm   ✓   (Pense à toujours citer « rectangle en B » au brevet !)' }
          ]
        }
      ]
    },
    {
      id: 'anim_equation_1er_degre',
      levels: ['4e', '3e'],
      subjectId: 'maths',
      title: 'Résoudre une équation du 1er degré : 3x + 5 = 17',
      duration: '4 étapes',
      steps: [
        {
          caption: '1. Une équation est une balance équilibrée : ce que tu fais à gauche, tu le fais exactement à droite.',
          chalk: [
            { kind: 'heading', color: 'cyan', text: 'Équation :  3x + 5 = 17' },
            { kind: 'note', color: 'yellow', text: 'Objectif : isoler x tout seul d’un côté du signe =' }
          ]
        },
        {
          caption: '2. Élimine le « + 5 » en soustrayant 5 des deux côtés.',
          chalk: [
            { kind: 'equation', color: 'white', text: '3x + 5 − 5  =  17 − 5\n3x  =  12' }
          ]
        },
        {
          caption: '3. Élimine le « × 3 » en divisant par 3 des deux côtés.',
          chalk: [
            { kind: 'equation', color: 'yellow', text: '3x / 3  =  12 / 3\nx  =  4' }
          ]
        },
        {
          caption: '4. Vérifie toujours ta solution en remplaçant x par 4 dans l’équation de départ !',
          chalk: [
            { kind: 'highlight', color: 'mint', text: 'Vérification : 3 × 4 + 5 = 12 + 5 = 17  ✓  →  La solution est x = 4.' }
          ]
        }
      ]
    },
    {
      id: 'anim_english_present',
      levels: ['6e', '5e', '4e', '3e'],
      subjectId: 'anglais',
      title: 'Present Simple vs Present Continuous (BE + V-ing)',
      duration: '4 étapes',
      steps: [
        {
          caption: '1. Present Simple = habitude, routine ou vérité générale (often, always, every day).',
          chalk: [
            { kind: 'heading', color: 'cyan', text: 'HABITUDE → Present Simple' },
            { kind: 'equation', color: 'white', text: 'She plays tennis every Saturday.  (n’oublie pas le -S avec he/she/it !)' }
          ]
        },
        {
          caption: '2. Present Continuous (BE + verbe-ING) = action en train de se dérouler MAINTENANT (now, look!, at the moment).',
          chalk: [
            { kind: 'heading', color: 'yellow', text: 'EN CE MOMENT → BE + V-ing' },
            { kind: 'equation', color: 'yellow', text: 'Look! She is playing tennis right now.' }
          ]
        },
        {
          caption: '3. Comparaison directe sur l’ardoise :',
          chalk: [
            { kind: 'note', color: 'cyan', text: 'Every day  →  I read a book.  (routine)' },
            { kind: 'note', color: 'mint', text: 'Right now  →  I am reading a book.  (action en cours)' }
          ]
        },
        {
          caption: '4. Piège classique : ne jamais oublier l’auxiliaire BE (am / is / are) devant V-ing !',
          chalk: [
            { kind: 'highlight', color: 'coral', text: '✗ She playing now   →   ✓ She IS playing now.' }
          ]
        }
      ]
    }
  ];

  function getLessonsForLevel(levelId) {
    const matching = ANIMATED_LESSONS.filter(function (l) {
      return l.levels.indexOf(levelId) !== -1;
    });
    const others = ANIMATED_LESSONS.filter(function (l) {
      return l.levels.indexOf(levelId) === -1;
    });
    return { recommended: matching, all: matching.concat(others) };
  }

  /**
   * Turns ANY Method Sheet (built-in or generated from a course photo) into an animated chalkboard lesson!
   */
  function buildLessonFromMethodSheet(sheet) {
    if (!sheet) return null;
    const steps = [];
    steps.push({
      caption: '1. L’idée essentielle à retenir avant de démarrer.',
      chalk: [
        { kind: 'heading', color: 'cyan', text: sheet.title || 'Fiche de méthode' },
        { kind: 'highlight', color: 'yellow', text: sheet.essential || 'Observe bien la règle du cours.' }
      ]
    });

    (sheet.steps || []).forEach(function (st, idx) {
      steps.push({
        caption: 'Étape ' + (idx + 1) + ' de la méthode :',
        chalk: [
          { kind: 'equation', color: idx % 2 === 0 ? 'white' : 'cyan', text: (idx + 1) + '.  ' + st }
        ]
      });
    });

    if (sheet.pitfall) {
      steps.push({
        caption: 'Attention au piège le plus fréquent en contrôle !',
        chalk: [
          { kind: 'note', color: 'coral', text: 'Piège à éviter : ' + sheet.pitfall }
        ]
      });
    }

    if (sheet.example) {
      steps.push({
        caption: 'Application directe sur un exemple concret :',
        chalk: [
          { kind: 'highlight', color: 'mint', text: 'Exemple : ' + sheet.example + '   ✓' }
        ]
      });
    }

    return {
      id: 'sheet_anim_' + sheet.id,
      levels: [sheet.levelId || 'CM2'],
      subjectId: sheet.subjectId || 'maths',
      title: sheet.title || 'Fiche animée',
      duration: steps.length + ' étapes',
      fromMethodSheet: true,
      steps: steps
    };
  }

  /**
   * Interactive Chalkboard Canvas Controller (Pointer Events: mouse + touch + stylus).
   */
  function mountCanvas(canvasEl, opts) {
    if (!canvasEl) return null;
    const ctx = canvasEl.getContext('2d');
    const options = Object.assign(
      {
        color: '#F8FAFC',
        size: 4,
        tool: 'chalk', // chalk | eraser
        bgMode: 'plain', // plain | grid | lined
        initialDataUrl: null,
        onChange: null
      },
      opts || {}
    );

    const history = [];
    let drawing = false;
    let lastPt = null;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const rect = canvasEl.getBoundingClientRect();
      const w = Math.max(280, Math.round(rect.width));
      const h = Math.max(240, Math.round(rect.height));
      if (canvasEl.width === Math.round(w * dpr) && canvasEl.height === Math.round(h * dpr)) return;

      // Save current content before resize
      let prev = null;
      if (canvasEl.width > 0 && canvasEl.height > 0) {
        prev = document.createElement('canvas');
        prev.width = canvasEl.width;
        prev.height = canvasEl.height;
        prev.getContext('2d').drawImage(canvasEl, 0, 0);
      }

      canvasEl.width = Math.round(w * dpr);
      canvasEl.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (prev) {
        ctx.drawImage(prev, 0, 0, prev.width / dpr, prev.height / dpr);
      }
    }

    function pushHistory() {
      try {
        if (history.length >= 20) history.shift();
        history.push(canvasEl.toDataURL('image/png'));
      } catch (e) {
        // ignore
      }
    }

    function getPoint(e) {
      const rect = canvasEl.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }

    function onDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      resize();
      pushHistory();
      drawing = true;
      lastPt = getPoint(e);
      if (canvasEl.setPointerCapture) {
        try { canvasEl.setPointerCapture(e.pointerId); } catch (err) {}
      }
      drawSegment(lastPt, { x: lastPt.x + 0.1, y: lastPt.y + 0.1 });
    }

    function onMove(e) {
      if (!drawing) return;
      e.preventDefault();
      const pt = getPoint(e);
      drawSegment(lastPt, pt);
      lastPt = pt;
    }

    function onUp() {
      if (!drawing) return;
      drawing = false;
      lastPt = null;
      if (typeof options.onChange === 'function') options.onChange();
    }

    function drawSegment(p1, p2) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (options.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = Math.max(16, options.size * 4.5);
        ctx.shadowBlur = 0;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = options.color;
        ctx.lineWidth = options.size;
        ctx.shadowColor = options.color;
        ctx.shadowBlur = 1.4;
      }
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.restore();
    }

    canvasEl.addEventListener('pointerdown', onDown);
    canvasEl.addEventListener('pointermove', onMove);
    canvasEl.addEventListener('pointerup', onUp);
    canvasEl.addEventListener('pointercancel', onUp);

    resize();

    if (options.initialDataUrl) {
      const img = new Image();
      img.onload = function () {
        const rect = canvasEl.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = options.initialDataUrl;
    }

    return {
      setColor: function (hex) { options.color = hex; options.tool = 'chalk'; },
      setSize: function (sz) { options.size = sz; },
      setTool: function (t) { options.tool = t; },
      setBgMode: function (m) { options.bgMode = m; },
      undo: function () {
        if (!history.length) return false;
        const prevUrl = history.pop();
        const img = new Image();
        img.onload = function () {
          const rect = canvasEl.getBoundingClientRect();
          ctx.save();
          ctx.globalCompositeOperation = 'source-over';
          ctx.clearRect(0, 0, rect.width, rect.height);
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
          ctx.restore();
          if (typeof options.onChange === 'function') options.onChange();
        };
        img.src = prevUrl;
        return true;
      },
      clear: function () {
        pushHistory();
        const rect = canvasEl.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        if (typeof options.onChange === 'function') options.onChange();
      },
      loadImage: function (url) {
        if (!url) return;
        pushHistory();
        const img = new Image();
        img.onload = function () {
          const rect = canvasEl.getBoundingClientRect();
          ctx.save();
          ctx.globalCompositeOperation = 'source-over';
          ctx.clearRect(0, 0, rect.width, rect.height);
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
          ctx.restore();
        };
        img.src = url;
      },
      toInkDataUrl: function () {
        try { return canvasEl.toDataURL('image/png'); } catch (e) { return null; }
      },
      exportDataUrl: function () {
        // Composite dark slate background + optional grid/lines + chalk strokes
        const rect = canvasEl.getBoundingClientRect();
        const w = Math.max(320, Math.round(rect.width));
        const h = Math.max(240, Math.round(rect.height));
        const out = document.createElement('canvas');
        out.width = w;
        out.height = h;
        const octx = out.getContext('2d');

        // Slate green-ink base
        octx.fillStyle = '#0F2A2A';
        octx.fillRect(0, 0, w, h);

        if (options.bgMode === 'grid') {
          octx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
          octx.lineWidth = 1;
          for (let x = 24; x < w; x += 24) {
            octx.beginPath(); octx.moveTo(x, 0); octx.lineTo(x, h); octx.stroke();
          }
          for (let y = 24; y < h; y += 24) {
            octx.beginPath(); octx.moveTo(0, y); octx.lineTo(w, y); octx.stroke();
          }
        } else if (options.bgMode === 'lined') {
          octx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
          octx.lineWidth = 1;
          for (let y = 32; y < h; y += 32) {
            octx.beginPath(); octx.moveTo(0, y); octx.lineTo(w, y); octx.stroke();
          }
          octx.strokeStyle = 'rgba(251, 113, 133, 0.35)';
          octx.beginPath(); octx.moveTo(56, 0); octx.lineTo(56, h); octx.stroke();
        }

        octx.drawImage(canvasEl, 0, 0, w, h);
        return out.toDataURL('image/png');
      },
      destroy: function () {
        canvasEl.removeEventListener('pointerdown', onDown);
        canvasEl.removeEventListener('pointermove', onMove);
        canvasEl.removeEventListener('pointerup', onUp);
        canvasEl.removeEventListener('pointercancel', onUp);
      }
    };
  }

  global.ArdoizBoard = {
    CHALK_COLORS: CHALK_COLORS,
    ANIMATED_LESSONS: ANIMATED_LESSONS,
    getLessonsForLevel: getLessonsForLevel,
    buildLessonFromMethodSheet: buildLessonFromMethodSheet,
    mountCanvas: mountCanvas
  };
})(window);
