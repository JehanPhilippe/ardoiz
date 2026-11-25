/* CapDevoirs — Course Photo & Notes Generator (Offline Pedagogical Engine + Optional Vision API) */
(function (global) {
  'use strict';

  /**
   * Compresses an uploaded image file cleanly to a readable JPEG dataURL (~max 1280px).
   */
  function compressImageFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !file.type.startsWith('image/')) {
        reject(new Error('Sélectionne une image (JPG, PNG ou WebP).'));
        return;
      }
      const reader = new FileReader();
      reader.onerror = function () { reject(new Error('Impossible de lire le fichier image.')); };
      reader.onload = function () {
        const img = new Image();
        img.onerror = function () { reject(new Error('Format d’image non pris en charge.')); };
        img.onload = function () {
          const maxDim = 1280;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w >= h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          resolve({
            dataUrl: canvas.toDataURL('image/jpeg', 0.82),
            width: w,
            height: h,
            fileName: file.name
          });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Parses structured French lesson notes (definitions "Terme : explication", bullet points, formulas, dates)
   * and generates a cohesive, editable study pack:
   * - 1 Method Sheet (Fiche de méthode)
   * - 2 to 3 Interactive Guided Exercises
   * - 1 Validation Quiz (3 to 4 questions)
   */
  function generateLocalPack(params) {
    const subjectDef = global.CapCurriculum.getSubjectDef(params.subjectId);
    const levelId = params.levelId || 'CM2';
    const chapter = String(params.chapter || '').trim() || ('Cours de ' + subjectDef.name);
    const rawNotes = String(params.notes || '').trim();
    const photoRef = params.photoRef || null;

    const lines = rawNotes
      .split(/\r?\n|(?<=[.!?])\s+/)
      .map(function (l) { return l.replace(/^[\-\*•\d\.\)\s]+/, '').trim(); })
      .filter(function (l) { return l.length >= 6; });

    // Extract "Term : Definition" or "Term = Value" pairs
    const pairs = [];
    lines.forEach(function (line) {
      const sepMatch = line.match(/^([^:=–-]{2,48})\s*[:=–-]\s*(.{6,})$/);
      if (sepMatch) {
        pairs.push({
          term: sepMatch[1].trim(),
          def: sepMatch[2].trim().replace(/\.$/, '')
        });
      }
    });

    // Extract key concepts / dates / formulas
    const keyFacts = lines.slice(0, 6);

    const methodSheetId = global.CapStorage.generateId('ms_photo');
    const methodSheet = {
      id: methodSheetId,
      levelId: levelId,
      subjectId: params.subjectId,
      chapter: chapter,
      title: 'Fiche méthode : ' + chapter,
      source: photoRef ? 'photo' : 'perso',
      photoRef: photoRef,
      essential:
        keyFacts[0] ||
        ('Maîtriser les notions clés de « ' + chapter + ' » en ' + subjectDef.name + ' (' + levelId + ') en s’appuyant sur la photo du cours.'),
      steps:
        keyFacts.length >= 2
          ? keyFacts.slice(0, 4).map(function (f, i) { return 'Étape ' + (i + 1) + ' : ' + f; })
          : [
              'Relis attentivement la photo de ton cours et repère les mots soulignés ou encadrés.',
              'Reformule la règle principale avec tes propres mots sans regarder le cahier.',
              'Refais un exemple du cours sur une feuille de brouillon puis vérifie chaque étape.'
            ],
      pitfall:
        pairs.length > 0
          ? 'Ne pas confondre « ' + pairs[0].term + ' » avec les autres notions du chapitre ; vérifie toujours sa définition exacte.'
          : 'Relire le cours passivement sans tester sa mémoire sur un exercice concret.',
      example:
        pairs.length > 0
          ? pairs[0].term + ' → ' + pairs[0].def + '.'
          : (keyFacts[1] || 'Appuie-toi sur l’exemple encadré sur ta feuille de cours.')
    };

    // Build guided exercises
    const exercises = [];

    if (pairs.length >= 1) {
      pairs.slice(0, 2).forEach(function (pair, idx) {
        const distractors = buildDistractors(pair.def, pairs, subjectDef.name);
        exercises.push({
          id: global.CapStorage.generateId('ex_photo'),
          levelId: levelId,
          subjectId: params.subjectId,
          chapter: chapter,
          title: 'Maîtriser la notion : ' + pair.term,
          difficulty: idx === 0 ? 'Facile' : 'Moyen',
          source: photoRef ? 'photo' : 'perso',
          photoRef: photoRef,
          prompt: 'D’après ton cours sur « ' + chapter + ' », que signifie ou correspond à « ' + pair.term + ' » ?',
          type: 'choice',
          options: shuffleDeterministic([pair.def].concat(distractors), pair.term.length),
          answer: pair.def,
          hints: [
            'Repère le terme « ' + pair.term + ' » sur ta fiche méthode ou ta photo de cours.',
            'La bonne réponse commence par : « ' + pair.def.slice(0, Math.min(22, pair.def.length)) + '... »'
          ],
          explanation: pair.term + ' : ' + pair.def + '.',
          methodSheet: methodSheet
        });
      });
    }

    // Add a cloze / recall exercise from the strongest sentence
    if (keyFacts.length > 0 && exercises.length < 2) {
      const sentence = keyFacts[0];
      const words = sentence.split(/\s+/).filter(function (w) { return w.replace(/[^a-zA-ZÀ-ÿ0-9]/g, '').length >= 5; });
      const targetRaw = words.length > 0 ? words[Math.floor(words.length / 2)] : null;
      if (targetRaw) {
        const cleanTarget = targetRaw.replace(/^[^a-zA-ZÀ-ÿ0-9]+|[^a-zA-ZÀ-ÿ0-9]+$/g, '');
        const masked = sentence.replace(cleanTarget, '______');
        exercises.push({
          id: global.CapStorage.generateId('ex_photo'),
          levelId: levelId,
          subjectId: params.subjectId,
          chapter: chapter,
          title: 'Texte à compléter — ' + chapter,
          difficulty: 'Moyen',
          source: photoRef ? 'photo' : 'perso',
          photoRef: photoRef,
          prompt: 'Complète cette phrase clé de ton cours : « ' + masked + ' »',
          type: 'input',
          answer: cleanTarget,
          hints: [
            'Le mot manquant contient ' + cleanTarget.length + ' lettres.',
            'Il commence par « ' + cleanTarget.slice(0, 2) + '... ».'
          ],
          explanation: 'La phrase complète du cours est : « ' + sentence + ' ».',
          methodSheet: methodSheet
        });
      }
    }

    // Guarantee at least 2 concrete exercises even when only a photo + chapter title is provided
    if (exercises.length === 0) {
      exercises.push({
        id: global.CapStorage.generateId('ex_photo'),
        levelId: levelId,
        subjectId: params.subjectId,
        chapter: chapter,
        title: 'Vérification active — ' + chapter,
        difficulty: 'Facile',
        source: photoRef ? 'photo' : 'perso',
        photoRef: photoRef,
        prompt: 'Pour bien retenir le cours « ' + chapter + ' » (' + subjectDef.name + '), quelle méthode est la plus efficace ?',
        type: 'choice',
        options: [
          'Relire la photo du cours, cacher la feuille et réciter les étapes clés sur un exemple',
          'Regarder rapidement la page une seule fois sans faire d’exercice',
          'Passer directement au contrôle sans vérifier les définitions'
        ],
        answer: 'Relire la photo du cours, cacher la feuille et réciter les étapes clés sur un exemple',
        hints: ['La mémorisation active consiste à se tester sans regarder la réponse.'],
        explanation: 'Se tester activement puis vérifier sur la photo du cours fixe durablement la leçon.',
        methodSheet: methodSheet
      });
    }

    if (exercises.length < 2) {
      exercises.push({
        id: global.CapStorage.generateId('ex_photo'),
        levelId: levelId,
        subjectId: params.subjectId,
        chapter: chapter,
        title: 'Application guidée — ' + chapter,
        difficulty: 'Moyen',
        source: photoRef ? 'photo' : 'perso',
        photoRef: photoRef,
        prompt: 'Avant de valider un exercice sur « ' + chapter + ' », quel réflexe évite les erreurs d’inattention ?',
        type: 'choice',
        options: [
          'Vérifier la règle principale, les unités/accords et relire la question posée',
          'Écrire la réponse le plus vite possible sans relire',
          'Sauter les étapes intermédiaires du raisonnement'
        ],
        answer: 'Vérifier la règle principale, les unités/accords et relire la question posée',
        hints: ['Pense aux 3 vérifications finales de ta fiche méthode.'],
        explanation: 'Relire la question et contrôler les accords/unités corrige la majorité des erreurs.',
        methodSheet: methodSheet
      });
    }

    // Build validation quiz (3 questions)
    const quizQuestions = exercises.map(function (ex) {
      let opts = ex.options;
      if (!opts) {
        opts = [
          ex.answer,
          ex.answer.slice(0, Math.max(2, ex.answer.length - 2)) + 'er',
          'Aucune de ces réponses'
        ];
      }
      return {
        prompt: ex.prompt,
        options: opts,
        answer: ex.answer,
        explanation: ex.explanation
      };
    });

    quizQuestions.push({
      prompt: 'Synthèse de la fiche « ' + chapter + ' » : quel est l’essentiel à retenir ?',
      options: [
        methodSheet.essential,
        'Apprendre uniquement le titre du chapitre sans les exemples',
        'Ignorer les points de vigilance du cours'
      ],
      answer: methodSheet.essential,
      explanation: 'Point essentiel : ' + methodSheet.essential
    });

    const quiz = {
      id: global.CapStorage.generateId('quiz_photo'),
      levelId: levelId,
      subjectId: params.subjectId,
      chapter: chapter,
      title: 'Quiz du cours — ' + chapter,
      source: photoRef ? 'photo' : 'perso',
      photoRef: photoRef,
      questions: quizQuestions
    };

    return {
      engine: 'local',
      methodSheet: methodSheet,
      exercises: exercises,
      quiz: quiz
    };
  }

  function buildDistractors(correctDef, allPairs, subjectName) {
    const others = allPairs
      .map(function (p) { return p.def; })
      .filter(function (d) { return d !== correctDef; });
    const fallbacks = [
      'Une règle secondaire qui ne s’applique pas dans ce chapitre de ' + subjectName,
      'Le contraire exact de la propriété vue en classe'
    ];
    while (others.length < 2) {
      others.push(fallbacks[others.length]);
    }
    return others.slice(0, 2);
  }

  function shuffleDeterministic(arr, seed) {
    const copy = arr.slice();
    const shift = seed % copy.length;
    return copy.slice(shift).concat(copy.slice(0, shift));
  }

  /**
   * Optional Vision AI generator (only invoked if the user explicitly configured their own Gemini API key in Settings).
   * Falls back cleanly to generateLocalPack if offline or if no key is configured.
   */
  async function generateFromCoursePhoto(params, apiKey) {
    if (!apiKey || !params.imageDataUrl) {
      return generateLocalPack(params);
    }

    const base64 = params.imageDataUrl.split(',')[1];
    const subjectDef = global.CapCurriculum.getSubjectDef(params.subjectId);
    const promptText =
      'Tu es un enseignant français bienveillant niveau ' +
      params.levelId +
      ' en ' +
      subjectDef.name +
      '. Analyse cette photo de cours (chapitre : "' +
      (params.chapter || 'Cours importé') +
      '", notes complémentaires : "' +
      (params.notes || '') +
      '"). Réponds STRICTEMENT en JSON valide (sans markdown) avec ce format exact : ' +
      '{"methodSheet":{"title":"","essential":"","steps":["","",""],"pitfall":"","example":""},' +
      '"exercises":[{"title":"","difficulty":"Facile|Moyen","prompt":"","options":["","",""],"answer":"","hints":["",""],"explanation":""}],' +
      '"quizQuestions":[{"prompt":"","options":["","",""],"answer":"","explanation":""}]}' +
      ' (2 exercices guidés et 3 questions de quiz).';

    try {
      const res = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' +
          encodeURIComponent(apiKey),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: promptText },
                  { inlineData: { mimeType: 'image/jpeg', data: base64 } }
                ]
              }
            ]
          })
        }
      );
      if (!res.ok) throw new Error('API Vision indisponible (' + res.status + ')');
      const data = await res.json();
      const rawText =
        data &&
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0] &&
        data.candidates[0].content.parts[0].text;
      if (!rawText) throw new Error('Réponse vide');

      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      const chapter = params.chapter || (parsed.methodSheet && parsed.methodSheet.title) || 'Cours photo';
      const methodSheet = Object.assign(
        {
          id: global.CapStorage.generateId('ms_ai'),
          levelId: params.levelId,
          subjectId: params.subjectId,
          chapter: chapter,
          source: 'photo',
          photoRef: params.photoRef
        },
        parsed.methodSheet
      );

      const exercises = (parsed.exercises || []).map(function (ex) {
        return {
          id: global.CapStorage.generateId('ex_ai'),
          levelId: params.levelId,
          subjectId: params.subjectId,
          chapter: chapter,
          title: ex.title,
          difficulty: ex.difficulty || 'Moyen',
          source: 'photo',
          photoRef: params.photoRef,
          prompt: ex.prompt,
          type: 'choice',
          options: ex.options,
          answer: ex.answer,
          hints: ex.hints || ['Relis bien la photo de ton cours.'],
          explanation: ex.explanation,
          methodSheet: methodSheet
        };
      });

      const quiz = {
        id: global.CapStorage.generateId('quiz_ai'),
        levelId: params.levelId,
        subjectId: params.subjectId,
        chapter: chapter,
        title: 'Quiz IA du cours — ' + chapter,
        source: 'photo',
        photoRef: params.photoRef,
        questions: parsed.quizQuestions || []
      };

      return { engine: 'vision-ai', methodSheet: methodSheet, exercises: exercises, quiz: quiz };
    } catch (e) {
      const fallback = generateLocalPack(params);
      fallback.fallbackReason = e.message;
      return fallback;
    }
  }

  global.CapCourseGenerator = {
    compressImageFile: compressImageFile,
    generateLocalPack: generateLocalPack,
    generateFromCoursePhoto: generateFromCoursePhoto
  };
})(window);
