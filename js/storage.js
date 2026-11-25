/* CapDevoirs — Local Persistence, Salted SHA-256 Auth, IndexedDB Photo Store & Progress Engine */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'capdevoirs_db_v1';
  const SESSION_KEY = 'capdevoirs_session_v1';
  const IDB_NAME = 'CapDevoirsMediaDB';
  const IDB_STORE = 'coursePhotos';

  // Pure-JS SHA-256 fallback so password hashing works seamlessly on both http://localhost and file://
  function sha256Fallback(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    const maxWord = Math.pow(2, 32);
    const words = [];
    const utf8 = unescape(encodeURIComponent(ascii));
    const asciiBitLength = utf8.length * 8;
    const hash = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];
    const k = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    let msg = utf8 + '\x80';
    while ((msg.length % 64) - 56) msg += '\x00';
    for (let i = 0; i < msg.length; i++) {
      words[i >> 2] |= msg.charCodeAt(i) << (((3 - i) % 4) * 8);
    }
    words[words.length] = (asciiBitLength / maxWord) | 0;
    words[words.length] = asciiBitLength;

    for (let j = 0; j < words.length;) {
      const w = words.slice(j, (j += 16));
      const oldHash = hash.slice(0);
      for (let i = 0; i < 64; i++) {
        const w15 = w[i - 15], w2 = w[i - 2];
        const a = hash[0], e = hash[4];
        const temp1 =
          hash[7] +
          (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
          ((e & hash[5]) ^ (~e & hash[6])) +
          k[i] +
          (w[i] =
            i < 16
              ? w[i]
              : (w[i - 16] +
                  (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                  w[i - 7] +
                  (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
                0);
        const temp2 =
          (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
          ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash.unshift((temp1 + temp2) | 0);
        hash[4] = (hash[4] + temp1) | 0;
        hash.pop();
      }
      for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    let result = '';
    for (let i = 0; i < 8; i++) {
      for (let j = 3; j + 1; j--) {
        const b = (hash[i] >> (j * 8)) & 255;
        result += (b < 16 ? '0' : '') + b.toString(16);
      }
    }
    return result;
  }

  async function hashPassword(password, salt) {
    const payload = salt + '::capdevoirs::' + password;
    if (global.crypto && global.crypto.subtle) {
      try {
        const enc = new TextEncoder().encode(payload);
        const buf = await global.crypto.subtle.digest('SHA-256', enc);
        return Array.from(new Uint8Array(buf))
          .map(function (b) { return b.toString(16).padStart(2, '0'); })
          .join('');
      } catch (e) {
        return sha256Fallback(payload);
      }
    }
    return sha256Fallback(payload);
  }

  function generateId(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  function createEmptyYearRecord(yearId, levelId, enrolledAt, isArchived) {
    return {
      yearId: yearId,
      levelId: levelId,
      enrolledAt: enrolledAt || new Date().toISOString(),
      archived: Boolean(isArchived),
      homeworks: [],
      customExercises: [],
      customMethodSheets: [],
      customQuizzes: [],
      completedExerciseIds: [],
      completedAttenduCodes: [],
      readMethodSheetIds: [],
      quizAttempts: [], // { id, quizId, subjectId, title, score, total, scoreOn20, percent, date }
      activityLog: []   // { id, date, type, subjectId, title, detail, scoreText }
    };
  }

  // IndexedDB helpers for course photo storage
  function openMediaDB() {
    return new Promise(function (resolve, reject) {
      if (!global.indexedDB) {
        reject(new Error('IndexedDB non disponible'));
        return;
      }
      const req = global.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = function () {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  async function savePhoto(photoId, dataUrl) {
    try {
      const db = await openMediaDB();
      await new Promise(function (resolve, reject) {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put({ id: photoId, dataUrl: dataUrl, savedAt: Date.now() });
        tx.oncomplete = resolve;
        tx.onerror = function () { reject(tx.error); };
      });
      return photoId;
    } catch (e) {
      // Fallback: inline dataUrl (already compressed)
      return dataUrl;
    }
  }

  async function loadPhoto(photoRef) {
    if (!photoRef) return null;
    if (String(photoRef).startsWith('data:')) return photoRef;
    try {
      const db = await openMediaDB();
      return await new Promise(function (resolve) {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get(photoRef);
        req.onsuccess = function () { resolve(req.result ? req.result.dataUrl : null); };
        req.onerror = function () { resolve(null); };
      });
    } catch (e) {
      return null;
    }
  }

  function createSeededDemoDB() {
    const salt = 'demo_lea_2026';
    const passHash = sha256Fallback(salt + '::capdevoirs::soleil');

    // Past year 1: 2024-2025 (CE2)
    const y2024 = createEmptyYearRecord('2024-2025', 'CE2', '2024-09-02T08:30:00.000Z', true);
    y2024.completedExerciseIds = ['ce2-fr-1', 'ce2-ma-1', 'ce2-sc-1', 'ce2-hg-1', 'ce2-en-1'];
    y2024.readMethodSheetIds = ['ms-ce2-fr-1', 'ms-ce2-ma-1', 'ms-ce2-hg-1'];
    y2024.homeworks = [
      { id: 'hw-24-1', subjectId: 'francais', title: 'Dictée préparée : les accords dans le GN', dueDate: '2025-05-14', done: true, priority: 'normal', notes: 'Relire la fiche méthode.' },
      { id: 'hw-24-2', subjectId: 'maths', title: 'Réviser les tables de 6 et 7', dueDate: '2025-05-16', done: true, priority: 'haute', notes: 'Sans erreur !' }
    ];
    y2024.quizAttempts = [
      { id: 'qa-24-1', quizId: 'quiz-CE2-francais', subjectId: 'francais', title: 'Quiz de validation — Français (CE2)', score: 2, total: 3, scoreOn20: 13.3, percent: 67, date: '2025-01-20T16:30:00.000Z' },
      { id: 'qa-24-2', quizId: 'quiz-CE2-francais', subjectId: 'francais', title: 'Quiz de validation — Français (CE2)', score: 3, total: 3, scoreOn20: 20, percent: 100, date: '2025-05-22T17:10:00.000Z' },
      { id: 'qa-24-3', quizId: 'quiz-CE2-maths', subjectId: 'maths', title: 'Quiz de validation — Mathématiques (CE2)', score: 3, total: 3, scoreOn20: 20, percent: 100, date: '2025-05-25T16:45:00.000Z' },
      { id: 'qa-24-4', quizId: 'quiz-CE2-histgeo', subjectId: 'histgeo', title: 'Quiz de validation — Histoire-Géo & EMC (CE2)', score: 2, total: 3, scoreOn20: 13.3, percent: 67, date: '2025-06-04T17:00:00.000Z' },
      { id: 'qa-24-5', quizId: 'quiz-CE2-sciences', subjectId: 'sciences', title: 'Quiz de validation — Sciences & Découverte (CE2)', score: 3, total: 3, scoreOn20: 20, percent: 100, date: '2025-06-11T17:20:00.000Z' },
      { id: 'qa-24-6', quizId: 'quiz-CE2-anglais', subjectId: 'anglais', title: 'Quiz de validation — Anglais (CE2)', score: 2, total: 3, scoreOn20: 13.3, percent: 67, date: '2025-06-16T16:55:00.000Z' }
    ];
    y2024.activityLog = [
      { id: 'al-24-1', date: '2025-06-16T16:55:00.000Z', type: 'quiz', subjectId: 'anglais', title: 'Quiz Anglais CE2 validé', detail: 'Les jours de la semaine', scoreText: '13,3/20' },
      { id: 'al-24-2', date: '2025-05-25T16:45:00.000Z', type: 'quiz', subjectId: 'maths', title: 'Quiz Mathématiques CE2 validé', detail: 'Problèmes multiplicatifs', scoreText: '20/20' }
    ];

    // Past year 2: 2025-2026 (CM1)
    const y2025 = createEmptyYearRecord('2025-2026', 'CM1', '2025-03-18T17:00:00.000Z', true);
    y2025.completedExerciseIds = ['cm1-fr-1', 'cm1-ma-1', 'cm1-sc-1', 'cm1-hg-1', 'cm1-en-1'];
    y2025.readMethodSheetIds = ['ms-cm1-fr-1', 'ms-cm1-ma-1', 'ms-cm1-sc-1', 'ms-cm1-hg-1'];
    y2025.homeworks = [
      { id: 'hw-25-1', subjectId: 'maths', title: 'Fractions : exercices 3 et 4 p. 72', dueDate: '2026-04-08', done: true, priority: 'normal', notes: 'Bien vérifier le dénominateur.' },
      { id: 'hw-25-2', subjectId: 'histgeo', title: 'Apprendre la frise du Moyen Âge', dueDate: '2026-05-12', done: true, priority: 'normal', notes: 'Clovis, Charlemagne, Hugues Capet.' }
    ];
    y2025.quizAttempts = [
      { id: 'qa-25-1', quizId: 'quiz-CM1-francais', subjectId: 'francais', title: 'Quiz de validation — Français (CM1)', score: 3, total: 3, scoreOn20: 20, percent: 100, date: '2026-02-12T17:00:00.000Z' },
      { id: 'qa-25-2', quizId: 'quiz-CM1-maths', subjectId: 'maths', title: 'Quiz de validation — Mathématiques (CM1)', score: 2, total: 3, scoreOn20: 13.3, percent: 67, date: '2026-03-19T17:15:00.000Z' },
      { id: 'qa-25-3', quizId: 'quiz-CM1-maths', subjectId: 'maths', title: 'Quiz de validation — Mathématiques (CM1)', score: 3, total: 3, scoreOn20: 20, percent: 100, date: '2026-05-14T16:50:00.000Z' },
      { id: 'qa-25-4', quizId: 'quiz-CM1-sciences', subjectId: 'sciences', title: 'Quiz de validation — Sciences & Découverte (CM1)', score: 3, total: 3, scoreOn20: 20, percent: 100, date: '2026-05-28T17:30:00.000Z' },
      { id: 'qa-25-5', quizId: 'quiz-CM1-histgeo', subjectId: 'histgeo', title: 'Quiz de validation — Histoire-Géo & EMC (CM1)', score: 3, total: 3, scoreOn20: 20, percent: 100, date: '2026-06-05T17:10:00.000Z' },
      { id: 'qa-25-6', quizId: 'quiz-CM1-anglais', subjectId: 'anglais', title: 'Quiz de validation — Anglais (CM1)', score: 2, total: 3, scoreOn20: 13.3, percent: 67, date: '2026-06-14T16:40:00.000Z' }
    ];
    y2025.activityLog = [
      { id: 'al-25-1', date: '2026-06-14T16:40:00.000Z', type: 'quiz', subjectId: 'anglais', title: 'Quiz Anglais CM1 validé', detail: 'Dire l’heure simple', scoreText: '13,3/20' },
      { id: 'al-25-2', date: '2026-05-14T16:50:00.000Z', type: 'quiz', subjectId: 'maths', title: 'Quiz Mathématiques CM1 validé', detail: 'Fractions simples', scoreText: '20/20' }
    ];

    // Current active year: 2026-2027 (CM2)
    const y2026 = createEmptyYearRecord('2026-2027', 'CM2', '2026-03-12T17:30:00.000Z', false);
    y2026.completedExerciseIds = ['cm2-fr-1', 'cm2-ma-1', 'cm2-sc-1'];
    y2026.readMethodSheetIds = ['ms-cm2-fr-1', 'ms-cm2-ma-1'];
    y2026.homeworks = [
      {
        id: 'hw-26-1',
        subjectId: 'maths',
        title: 'Problèmes de proportionnalité (fiche n°4)',
        dueDate: '2026-11-26',
        done: false,
        priority: 'haute',
        notes: 'Utiliser le tableau de proportionnalité et le passage par l’unité.'
      },
      {
        id: 'hw-26-2',
        subjectId: 'francais',
        title: 'Repérer les COD dans le texte p. 48',
        dueDate: '2026-11-27',
        done: false,
        priority: 'normal',
        notes: 'Poser la question Qui ? ou Quoi ? après le verbe.'
      },
      {
        id: 'hw-26-3',
        subjectId: 'histgeo',
        title: 'Revoir les 3 dates clés de l’été 1789',
        dueDate: '2026-11-30',
        done: false,
        priority: 'normal',
        notes: '14 juillet, 4 août et 26 août 1789.'
      },
      {
        id: 'hw-26-4',
        subjectId: 'sciences',
        title: 'Classer les sources d’énergie renouvelables',
        dueDate: '2026-11-22',
        done: true,
        priority: 'normal',
        notes: 'Fait avec l’exercice guidé !'
      }
    ];
    y2026.quizAttempts = [
      { id: 'qa-26-1', quizId: 'quiz-CM2-francais', subjectId: 'francais', title: 'Quiz de validation — Français (CM2)', score: 3, total: 4, scoreOn20: 15, percent: 75, date: '2026-10-18T17:05:00.000Z' },
      { id: 'qa-26-2', quizId: 'quiz-CM2-maths', subjectId: 'maths', title: 'Quiz de validation — Mathématiques (CM2)', score: 3, total: 4, scoreOn20: 15, percent: 75, date: '2026-11-05T17:20:00.000Z' },
      { id: 'qa-26-3', quizId: 'quiz-CM2-maths', subjectId: 'maths', title: 'Quiz de validation — Mathématiques (CM2)', score: 4, total: 4, scoreOn20: 20, percent: 100, date: '2026-11-19T16:50:00.000Z' },
      { id: 'qa-26-4', quizId: 'quiz-CM2-sciences', subjectId: 'sciences', title: 'Quiz de validation — Sciences & Découverte (CM2)', score: 3, total: 3, scoreOn20: 20, percent: 100, date: '2026-11-21T11:15:00.000Z' }
    ];
    y2026.activityLog = [
      { id: 'al-26-1', date: '2026-11-22T15:40:00.000Z', type: 'homework', subjectId: 'sciences', title: 'Devoir terminé', detail: 'Classer les sources d’énergie renouvelables', scoreText: 'Fait' },
      { id: 'al-26-2', date: '2026-11-21T11:15:00.000Z', type: 'quiz', subjectId: 'sciences', title: 'Quiz Sciences CM2 validé', detail: 'Énergies renouvelables', scoreText: '20/20' },
      { id: 'al-26-3', date: '2026-11-19T16:50:00.000Z', type: 'quiz', subjectId: 'maths', title: 'Quiz Mathématiques CM2 validé', detail: 'Décimaux & proportionnalité', scoreText: '20/20' },
      { id: 'al-26-4', date: '2026-11-18T17:00:00.000Z', type: 'exercise', subjectId: 'maths', title: 'Exercice guidé réussi', detail: 'Additionner des nombres décimaux', scoreText: 'Validé' }
    ];

    return {
      version: 1,
      settings: {
        simulatedDate: null, // null = real date; ISO 'YYYY-MM-DD' when testing March rule
        geminiApiKey: ''
      },
      accounts: [
        {
          id: 'acc_demo_lea',
          username: 'lea',
          displayName: 'Léa',
          isDemo: true,
          surfaceMode: 'night',
          avatarColor: '#0284C7',
          salt: salt,
          passwordHash: passHash,
          createdAt: '2024-09-02T08:30:00.000Z',
          activeYearId: '2026-2027',
          schoolYears: [y2024, y2025, y2026]
        }
      ]
    };
  }

  function loadDB() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.accounts)) {
          if (!parsed.settings) parsed.settings = { simulatedDate: null, geminiApiKey: '' };
          return parsed;
        }
      }
    } catch (e) {
      // ignore parse errors
    }
    const seeded = createSeededDemoDB();
    saveDB(seeded);
    return seeded;
  }

  function saveDB(db) {
    global.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }

  function getSessionAccountId() {
    return global.localStorage.getItem(SESSION_KEY) || null;
  }

  function setSessionAccountId(id) {
    if (id) {
      global.localStorage.setItem(SESSION_KEY, id);
    } else {
      global.localStorage.removeItem(SESSION_KEY);
    }
  }

  function getEffectiveNow(db) {
    const sim = db && db.settings && db.settings.simulatedDate;
    if (sim) {
      const parts = sim.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0])) {
        return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
      }
    }
    return new Date();
  }

  async function registerAccount(db, payload) {
    const cleanUser = String(payload.username || '').trim().toLowerCase().replace(/\s+/g, '');
    const displayName = String(payload.displayName || '').trim();
    const password = String(payload.password || '');
    const levelId = payload.levelId;

    if (!displayName) throw new Error('Indique ton prénom ou ton nom.');
    if (cleanUser.length < 2) throw new Error('L’identifiant doit contenir au moins 2 caractères.');
    if (password.length < 4) throw new Error('Le mot de passe doit contenir au moins 4 caractères.');
    if (!levelId) throw new Error('Tu dois choisir ton niveau scolaire à l’inscription.');

    const exists = db.accounts.some(function (a) { return a.username === cleanUser; });
    if (exists) throw new Error('Cet identifiant est déjà utilisé sur cet ordinateur.');

    const salt = generateId('salt');
    const passwordHash = await hashPassword(password, salt);
    const now = getEffectiveNow(db);
    const currentYearId = global.CapSchoolYear.getCurrentSchoolYearId(now);
    const yearRec = createEmptyYearRecord(currentYearId, levelId, now.toISOString(), false);

    yearRec.activityLog.unshift({
      id: generateId('act'),
      date: now.toISOString(),
      type: 'enrollment',
      subjectId: 'francais',
      title: 'Inscription à l’année ' + currentYearId,
      detail: 'Niveau choisi : ' + levelId,
      scoreText: levelId
    });

    const colors = ['#0F766E', '#1D4ED8', '#B45309', '#15803D', '#6D28D9'];
    const account = {
      id: generateId('acc'),
      username: cleanUser,
      displayName: displayName,
      isDemo: false,
      surfaceMode: payload.surfaceMode || 'night',
      avatarColor: colors[db.accounts.length % colors.length],
      salt: salt,
      passwordHash: passwordHash,
      createdAt: now.toISOString(),
      activeYearId: currentYearId,
      schoolYears: [yearRec]
    };

    db.accounts.push(account);
    saveDB(db);
    setSessionAccountId(account.id);
    return account;
  }

  async function loginAccount(db, username, password) {
    const cleanUser = String(username || '').trim().toLowerCase();
    const acc = db.accounts.find(function (a) { return a.username === cleanUser; });
    if (!acc) throw new Error('Aucun compte trouvé avec cet identifiant.');
    const computed = await hashPassword(String(password || ''), acc.salt);
    if (computed !== acc.passwordHash) {
      throw new Error('Mot de passe incorrect. Vérifie tes majuscules et réessaie.');
    }
    setSessionAccountId(acc.id);
    return acc;
  }

  async function changePassword(db, account, oldPassword, newPassword) {
    const oldCheck = await hashPassword(String(oldPassword || ''), account.salt);
    if (oldCheck !== account.passwordHash) {
      throw new Error('L’ancien mot de passe ne correspond pas.');
    }
    if (String(newPassword || '').length < 4) {
      throw new Error('Le nouveau mot de passe doit contenir au moins 4 caractères.');
    }
    account.salt = generateId('salt');
    account.passwordHash = await hashPassword(newPassword, account.salt);
    saveDB(db);
  }

  /**
   * Enrolls the child in school year N+1 (enforces March 1st rule + mandatory level selection).
   */
  function enrollNextSchoolYear(db, account, chosenLevelId) {
    const now = getEffectiveNow(db);
    const status = global.CapSchoolYear.getNextYearEnrollmentStatus(account, now);

    if (!status.isOpen) {
      throw new Error(
        'L’inscription à l’année ' +
          status.targetYearId +
          ' ouvrira le ' +
          status.unlockDateLabel +
          ' (encore ' +
          status.daysRemaining +
          ' jour(s)).'
      );
    }
    if (!chosenLevelId) {
      throw new Error('Choisis ton niveau scolaire pour valider l’inscription.');
    }

    // Mark previous active years as archived if desired, while keeping them 100% browsable
    account.schoolYears.forEach(function (y) {
      y.archived = true;
    });

    const newYear = createEmptyYearRecord(status.targetYearId, chosenLevelId, now.toISOString(), false);
    newYear.activityLog.unshift({
      id: generateId('act'),
      date: now.toISOString(),
      type: 'enrollment',
      subjectId: 'maths',
      title: 'Inscription anticipée ' + status.targetYearId,
      detail: 'Niveau choisi : ' + chosenLevelId + ' (inscrit le ' + global.CapSchoolYear.formatDateFR(now) + ')',
      scoreText: chosenLevelId
    });

    account.schoolYears.push(newYear);
    account.activeYearId = newYear.yearId;
    saveDB(db);
    return newYear;
  }

  /**
   * Computes subject & overall mastery metrics for a given school year record.
   */
  function computeYearProgress(yearRec) {
    const subjects = global.CapCurriculum.getSubjectsForLevel(yearRec.levelId);
    const perSubject = subjects.map(function (subj) {
      const builtInEx = global.CapCurriculum.getBuiltInExercises(yearRec.levelId, subj.id);
      const customEx = (yearRec.customExercises || []).filter(function (e) { return e.subjectId === subj.id; });
      const allEx = builtInEx.concat(customEx);
      const completedExCount = allEx.filter(function (ex) {
        return (yearRec.completedExerciseIds || []).indexOf(ex.id) !== -1;
      }).length;

      const builtInSheets = global.CapCurriculum.getBuiltInMethodSheets(yearRec.levelId, subj.id);
      const customSheets = (yearRec.customMethodSheets || []).filter(function (m) { return m.subjectId === subj.id; });
      const allSheets = builtInSheets.concat(customSheets);
      const readSheetsCount = allSheets.filter(function (s) {
        return (yearRec.readMethodSheetIds || []).indexOf(s.id) !== -1;
      }).length;

      const hwList = (yearRec.homeworks || []).filter(function (h) { return h.subjectId === subj.id; });
      const hwDone = hwList.filter(function (h) { return h.done; }).length;

      const attempts = (yearRec.quizAttempts || []).filter(function (q) { return q.subjectId === subj.id; });
      let avgOn20 = null;
      let bestPercent = 0;
      if (attempts.length > 0) {
        const sum = attempts.reduce(function (acc, a) { return acc + (a.scoreOn20 || 0); }, 0);
        avgOn20 = Math.round((sum / attempts.length) * 10) / 10;
        bestPercent = Math.max.apply(null, attempts.map(function (a) { return a.percent || 0; }));
      }

      // Weighted progression score (0-100):
      // 45% exercises completion + 40% best quiz mastery + 15% method sheets read
      const exRatio = allEx.length > 0 ? completedExCount / allEx.length : 0;
      const sheetRatio = allSheets.length > 0 ? readSheetsCount / allSheets.length : 0;
      const quizRatio = bestPercent / 100;
      const masteryPercent = Math.round((exRatio * 45 + quizRatio * 40 + sheetRatio * 15));

      let statusLabel = 'À démarrer';
      let statusTone = 'neutral';
      if (masteryPercent >= 80) {
        statusLabel = 'Acquis';
        statusTone = 'success';
      } else if (masteryPercent >= 40) {
        statusLabel = 'En progrès';
        statusTone = 'warning';
      } else if (masteryPercent > 0 || attempts.length > 0 || hwDone > 0) {
        statusLabel = 'Démarré';
        statusTone = 'info';
      }

      return {
        subject: subj,
        totalExercises: allEx.length,
        completedExercises: completedExCount,
        totalSheets: allSheets.length,
        readSheets: readSheetsCount,
        totalHomeworks: hwList.length,
        doneHomeworks: hwDone,
        quizCount: attempts.length,
        avgOn20: avgOn20,
        bestPercent: bestPercent,
        masteryPercent: Math.min(100, masteryPercent),
        statusLabel: statusLabel,
        statusTone: statusTone
      };
    });

    const overallMastery = perSubject.length
      ? Math.round(
          perSubject.reduce(function (s, item) { return s + item.masteryPercent; }, 0) / perSubject.length
        )
      : 0;

    const allAttempts = yearRec.quizAttempts || [];
    const overallAvgOn20 = allAttempts.length
      ? Math.round(
          (allAttempts.reduce(function (s, a) { return s + (a.scoreOn20 || 0); }, 0) / allAttempts.length) * 10
        ) / 10
      : null;

    const totalHw = (yearRec.homeworks || []).length;
    const doneHw = (yearRec.homeworks || []).filter(function (h) { return h.done; }).length;

    return {
      yearId: yearRec.yearId,
      levelId: yearRec.levelId,
      overallMastery: overallMastery,
      overallAvgOn20: overallAvgOn20,
      totalQuizAttempts: allAttempts.length,
      totalExercisesDone: (yearRec.completedExerciseIds || []).length,
      totalHomeworks: totalHw,
      doneHomeworks: doneHw,
      perSubject: perSubject
    };
  }

  function exportAccountJSON(account) {
    return JSON.stringify(
      {
        app: 'CapDevoirs',
        exportedAt: new Date().toISOString(),
        account: account
      },
      null,
      2
    );
  }

  function importAccountJSON(db, jsonText) {
    const parsed = JSON.parse(jsonText);
    const incoming = parsed && parsed.account ? parsed.account : parsed;
    if (!incoming || !incoming.username || !Array.isArray(incoming.schoolYears)) {
      throw new Error('Fichier de sauvegarde CapDevoirs invalide.');
    }
    const idx = db.accounts.findIndex(function (a) { return a.username === incoming.username; });
    if (idx >= 0) {
      db.accounts[idx] = incoming;
    } else {
      db.accounts.push(incoming);
    }
    saveDB(db);
    setSessionAccountId(incoming.id);
    return incoming;
  }

  global.CapStorage = {
    loadDB: loadDB,
    saveDB: saveDB,
    generateId: generateId,
    getSessionAccountId: getSessionAccountId,
    setSessionAccountId: setSessionAccountId,
    getEffectiveNow: getEffectiveNow,
    registerAccount: registerAccount,
    loginAccount: loginAccount,
    changePassword: changePassword,
    enrollNextSchoolYear: enrollNextSchoolYear,
    computeYearProgress: computeYearProgress,
    savePhoto: savePhoto,
    loadPhoto: loadPhoto,
    exportAccountJSON: exportAccountJSON,
    importAccountJSON: importAccountJSON
  };
})(window);
