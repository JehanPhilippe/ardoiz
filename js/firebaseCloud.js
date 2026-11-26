/* CapDevoirs — Cloud Sync (Firebase Auth + Firestore Modular SDK v11 via CDN) & Official School Directory (data.education.gouv.fr) */
(function (global) {
  'use strict';

  const SCHOOL_API = 'https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/records';
  const FB_CONFIG_STORAGE_KEY = 'capdevoirs_firebase_config_v1';
  const FB_SDK_VER = '11.6.0';

  let sdk = null;
  let fbApp = null;
  let fbAuth = null;
  let fbDb = null;
  let currentUser = null;
  let initError = null;

  function isConfigValid(cfg) {
    return Boolean(cfg && cfg.apiKey && cfg.projectId && cfg.appId && cfg.authDomain);
  }

  function getActiveConfig() {
    try {
      const saved = global.localStorage.getItem(FB_CONFIG_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (isConfigValid(parsed)) return parsed;
      }
    } catch (e) {
      // ignore
    }
    if (isConfigValid(global.CAPDEVOIRS_FIREBASE_CONFIG)) {
      return global.CAPDEVOIRS_FIREBASE_CONFIG;
    }
    return null;
  }

  function saveLocalFirebaseConfig(cfg) {
    if (!cfg) {
      global.localStorage.removeItem(FB_CONFIG_STORAGE_KEY);
      fbApp = null; fbAuth = null; fbDb = null; currentUser = null; initError = null;
      return;
    }
    if (!isConfigValid(cfg)) {
      throw new Error('Configuration Firebase incomplète (apiKey, authDomain, projectId et appId sont requis).');
    }
    global.localStorage.setItem(FB_CONFIG_STORAGE_KEY, JSON.stringify(cfg));
    fbApp = null; fbAuth = null; fbDb = null; currentUser = null; initError = null;
  }

  async function ensureFirebase() {
    const cfg = getActiveConfig();
    if (!cfg) return null;
    if (fbApp && fbAuth && fbDb) {
      return { app: fbApp, auth: fbAuth, db: fbDb, sdk: sdk };
    }
    try {
      const base = 'https://www.gstatic.com/firebasejs/' + FB_SDK_VER + '/';
      const [appMod, authMod, fsMod] = await Promise.all([
        import(base + 'firebase-app.js'),
        import(base + 'firebase-auth.js'),
        import(base + 'firebase-firestore.js')
      ]);
      sdk = { app: appMod, auth: authMod, fs: fsMod };
      const existing = appMod.getApps();
      fbApp = existing.length ? existing[0] : appMod.initializeApp(cfg);
      fbAuth = authMod.getAuth(fbApp);
      fbDb = fsMod.getFirestore(fbApp);
      initError = null;
      return { app: fbApp, auth: fbAuth, db: fbDb, sdk: sdk };
    } catch (err) {
      initError = err && err.message ? err.message : 'Erreur d’initialisation Firebase';
      throw err;
    }
  }

  async function signOutCloud() {
    try {
      const fb = await ensureFirebase();
      if (fb && fb.auth && fb.auth.currentUser) {
        await fb.sdk.auth.signOut(fb.auth);
      }
    } catch (e) {
      // ignore sign-out errors
    }
    currentUser = null;
  }

  /**
   * Signs in (or registers) the student in Firebase Auth so Firestore rules allow writing their own score/backup.
   * Uses Email/Password (when enabled) or Anonymous Auth cleanly (no real child email needed).
   */
  async function ensureSignedIn(account, optionalPassword, forceNewSession) {
    const fb = await ensureFirebase();
    if (!fb) return null;

    // Avoid reusing another local account's Firebase Auth UID on the same browser
    if (forceNewSession || (fb.auth.currentUser && account && account.firebaseUid && fb.auth.currentUser.uid !== account.firebaseUid)) {
      if (fb.auth.currentUser) {
        try { await fb.sdk.auth.signOut(fb.auth); } catch (e) {}
      }
      currentUser = null;
    }

    if (fb.auth.currentUser) {
      currentUser = fb.auth.currentUser;
      return currentUser;
    }

    // Try Email/Password derived from username if a password was supplied, else fall back to Anonymous Auth
    const cleanUser = (account && account.username ? account.username.toLowerCase().replace(/[^a-z0-9._-]/g, '') : 'eleve') || 'eleve';
    const safeEmail = cleanUser + '@ardoiz.app';
    if (optionalPassword && String(optionalPassword).length >= 4) {
      const fbPass = String(optionalPassword).length >= 6 ? String(optionalPassword) : String(optionalPassword) + '_az9';
      try {
        const res = await fb.sdk.auth.signInWithEmailAndPassword(fb.auth, safeEmail, fbPass);
        currentUser = res.user;
        return currentUser;
      } catch (signInErr) {
        try {
          const created = await fb.sdk.auth.createUserWithEmailAndPassword(fb.auth, safeEmail, fbPass);
          currentUser = created.user;
          return currentUser;
        } catch (createErr) {
          // Fall through to Anonymous Auth if Email/Password provider is disabled
        }
      }
    }

    const anon = await fb.sdk.auth.signInAnonymously(fb.auth);
    currentUser = anon.user;
    return currentUser;
  }

  /**
   * Transparent Challenge Points calculation for any school year record.
   */
  function computeChallengeScore(yearRec, infiniteStreak) {
    const prog = global.CapStorage.computeYearProgress(yearRec);
    const exCount = (yearRec.completedExerciseIds || []).length;
    const hwDone = prog.doneHomeworks || 0;
    const attendusDone = (yearRec.completedAttenduCodes || []).length;
    const attempts = yearRec.quizAttempts || [];

    let quizPts = 0;
    attempts.forEach(function (a) {
      if ((a.scoreOn20 || 0) >= 16) quizPts += 40;
      else if ((a.scoreOn20 || 0) >= 12) quizPts += 25;
      else quizPts += 10;
    });

    const points =
      exCount * 10 +
      hwDone * 5 +
      attendusDone * 10 +
      quizPts +
      (infiniteStreak || 0) * 15;

    return {
      points: points,
      exercisesCount: exCount,
      quizzesCount: attempts.length,
      homeworksDone: hwDone,
      attendusDone: attendusDone,
      avgOn20: prog.overallAvgOn20,
      streak: infiniteStreak || 0
    };
  }

  /**
   * Search official French Primary Schools & Collèges via data.education.gouv.fr (57 506+ établissements).
   */
  async function searchFrenchSchools(query) {
    const q = String(query || '').trim();
    if (q.length < 2) return [];
    const safeQ = q.replace(/"/g, '').replace(/'/g, '');
    const where =
      '(type_etablissement="Ecole" OR type_etablissement="Collège") AND etat="OUVERT" AND (' +
      'search(nom_etablissement,"' + safeQ + '") OR ' +
      'search(nom_commune,"' + safeQ + '") OR ' +
      'code_postal="' + safeQ + '" OR ' +
      'identifiant_de_l_etablissement="' + safeQ.toUpperCase() + '")';

    const url = SCHOOL_API + '?where=' + encodeURIComponent(where) + '&limit=12';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Annuaire Éducation nationale indisponible (' + res.status + ')');
    const json = await res.json();
    return (json.results || []).map(function (r) {
      return {
        uai: r.identifiant_de_l_etablissement,
        name: r.nom_etablissement,
        type: r.type_etablissement || 'Établissement',
        statut: r.statut_public_prive || 'Public',
        city: r.nom_commune || '',
        postalCode: r.code_postal || '',
        department: r.libelle_departement || ''
      };
    });
  }

  function makeInviteCode(levelId) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffix = '';
    for (let i = 0; i < 4; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
    return String(levelId || 'CL').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) + suffix;
  }

  /**
   * Cloud operations: create/join class, sync user backup & challenge score, fetch leaderboards.
   */
  async function createCloudClass(account, yearRec, school, className, weeklyGoalPoints) {
    const fb = await ensureFirebase();
    if (!fb) throw new Error('Firebase non configuré');
    const user = await ensureSignedIn(account);
    const fs = fb.sdk.fs;

    const inviteCode = makeInviteCode(yearRec.levelId);
    const classId = school.uai + '_' + yearRec.yearId + '_' + inviteCode;
    const nowMs = Date.now();

    const cleanName = String(school.name || 'Établissement').trim();
    const cleanCity = String(school.city || 'France').trim();
    const cleanPostal = String(school.postalCode || '00000').trim();
    const cleanType = String(school.type || 'Ecole').trim();
    const cleanClassName = String(className || yearRec.levelId + '-A').trim();

    // Ensure school doc exists
    const schoolRef = fs.doc(fb.db, 'schools', school.uai);
    const schoolSnap = await fs.getDoc(schoolRef);
    if (!schoolSnap.exists()) {
      await fs.setDoc(schoolRef, {
        uai: school.uai,
        name: (cleanName.length >= 2 ? cleanName : 'Établissement').slice(0, 120),
        city: (cleanCity.length >= 1 ? cleanCity : 'France').slice(0, 80),
        postalCode: (cleanPostal.length >= 2 ? cleanPostal : '00000').slice(0, 10),
        type: (cleanType.length >= 2 ? cleanType : 'Ecole').slice(0, 40),
        createdBy: user.uid,
        updatedAt: nowMs
      });
    }

    const classDoc = {
      classId: classId,
      uai: school.uai,
      schoolName: (cleanName.length >= 2 ? cleanName : 'Établissement').slice(0, 120),
      city: (cleanCity.length >= 1 ? cleanCity : 'France').slice(0, 80),
      className: (cleanClassName.length >= 2 ? cleanClassName : yearRec.levelId + '-A').slice(0, 40),
      levelId: yearRec.levelId,
      yearId: yearRec.yearId,
      inviteCode: inviteCode,
      weeklyGoalPoints: Math.max(100, Math.min(50000, parseInt(weeklyGoalPoints, 10) || 600)),
      createdBy: user.uid,
      updatedAt: nowMs
    };

    await fs.setDoc(fs.doc(fb.db, 'classes', classId), classDoc);
    return classDoc;
  }

  async function findCloudClassByInviteCode(inviteCode, account) {
    const fb = await ensureFirebase();
    if (!fb) throw new Error('Firebase non configuré');
    await ensureSignedIn(account);
    const fs = fb.sdk.fs;
    const clean = String(inviteCode || '').trim().toUpperCase();
    const q = fs.query(fs.collection(fb.db, 'classes'), fs.where('inviteCode', '==', clean), fs.limit(1));
    const snap = await fs.getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data();
  }

  async function syncStudentToCloud(account, yearRec, challengeMembership, infiniteStreak, opts) {
    const fb = await ensureFirebase();
    if (!fb) return { synced: false, reason: 'local-only' };
    const options = opts || {};
    const user = await ensureSignedIn(account, options.password || null, Boolean(options.forceNewSession));
    const fs = fb.sdk.fs;
    const nowMs = Date.now();

    // 1. Private full backup under users/{uid}
    const serialized = JSON.stringify({
      schoolYears: account.schoolYears,
      activeYearId: account.activeYearId,
      challenge: account.challenge || null
    });
    const safeUsername = String(account.username || 'eleve').trim();
    const safeDisplayName = String(account.displayName || 'Élève').trim();
    if (serialized.length <= 360000) {
      await fs.setDoc(
        fs.doc(fb.db, 'users', user.uid),
        {
          uid: user.uid,
          displayName: (safeDisplayName.length >= 1 ? safeDisplayName : 'Élève').slice(0, 40),
          username: (safeUsername.length >= 2 ? safeUsername : 'eleve').slice(0, 32),
          activeYearId: account.activeYearId,
          schoolUai: challengeMembership && challengeMembership.uai ? String(challengeMembership.uai).slice(0, 16) : null,
          classId: challengeMembership && challengeMembership.classId ? String(challengeMembership.classId).slice(0, 64) : null,
          surfaceMode: account.surfaceMode === 'day' ? 'day' : 'night',
          dataJson: serialized,
          updatedAt: nowMs
        },
        { merge: true }
      );
    }

    // 2. Class challenge scorecard under classes/{classId}/members/{uid}
    if (challengeMembership && challengeMembership.classId && challengeMembership.uai) {
      // Ensure parent school & class exist in Firestore (handles local-to-cloud transition cleanly)
      const classRef = fs.doc(fb.db, 'classes', challengeMembership.classId);
      const classSnap = await fs.getDoc(classRef);
      if (!classSnap.exists()) {
        const schoolRef = fs.doc(fb.db, 'schools', challengeMembership.uai);
        const schoolSnap = await fs.getDoc(schoolRef);
        if (!schoolSnap.exists()) {
          await fs.setDoc(schoolRef, {
            uai: challengeMembership.uai,
            name: String(challengeMembership.schoolName || 'Établissement').slice(0, 120),
            city: String(challengeMembership.city || 'France').slice(0, 80),
            postalCode: String(challengeMembership.postalCode || '00000').slice(0, 10),
            type: String(challengeMembership.schoolType || 'Ecole').slice(0, 40),
            createdBy: user.uid,
            updatedAt: nowMs
          });
        }
        const safeClsName = String(challengeMembership.className || yearRec.levelId).trim();
        await fs.setDoc(classRef, {
          classId: challengeMembership.classId,
          uai: challengeMembership.uai,
          schoolName: String(challengeMembership.schoolName || 'Établissement').slice(0, 120),
          city: String(challengeMembership.city || 'France').slice(0, 80),
          className: (safeClsName.length >= 2 ? safeClsName : yearRec.levelId + '-A').slice(0, 40),
          levelId: yearRec.levelId,
          yearId: challengeMembership.yearId || yearRec.yearId,
          inviteCode: String(challengeMembership.inviteCode || makeInviteCode(yearRec.levelId)).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12),
          weeklyGoalPoints: Math.max(100, Math.min(50000, parseInt(challengeMembership.weeklyGoalPoints, 10) || 600)),
          createdBy: user.uid,
          updatedAt: nowMs
        });
      }

      const sc = computeChallengeScore(yearRec, infiniteStreak);
      const rawPseudo = String(challengeMembership.pseudo || safeDisplayName || 'Élève').trim();
      const safePseudo = (rawPseudo.length >= 2 ? rawPseudo : 'Élève').slice(0, 24);
      await fs.setDoc(
        fs.doc(fb.db, 'classes', challengeMembership.classId, 'members', user.uid),
        {
          uid: user.uid,
          classId: challengeMembership.classId,
          uai: challengeMembership.uai,
          pseudo: safePseudo,
          levelId: yearRec.levelId,
          avatarColor: String(account.avatarColor || '#0284C7').slice(0, 20),
          points: Math.max(0, Math.min(1000000, Math.round(sc.points || 0))),
          exercisesCount: Math.max(0, Math.min(50000, Math.round(sc.exercisesCount || 0))),
          quizzesCount: Math.max(0, Math.min(50000, Math.round(sc.quizzesCount || 0))),
          homeworksDone: Math.max(0, Math.min(50000, Math.round(sc.homeworksDone || 0))),
          attendusDone: Math.max(0, Math.min(5000, Math.round(sc.attendusDone || 0))),
          avgOn20: sc.avgOn20 === null || isNaN(sc.avgOn20) ? null : Math.max(0, Math.min(20, Number(sc.avgOn20))),
          streak: Math.max(0, Math.min(10000, Math.round(sc.streak || 0))),
          updatedAt: nowMs
        },
        { merge: true }
      );
    }

    return { synced: true, uid: user.uid, at: nowMs };
  }

  async function fetchClassLeaderboard(classId, account) {
    const fb = await ensureFirebase();
    if (!fb || !classId) return [];
    await ensureSignedIn(account);
    const fs = fb.sdk.fs;
    const snap = await fs.getDocs(fs.collection(fb.db, 'classes', classId, 'members'));
    const list = snap.docs.map(function (d) { return d.data(); });
    list.sort(function (a, b) { return (b.points || 0) - (a.points || 0); });
    return list;
  }

  async function fetchSchoolClassesLeaderboard(uai, yearId, account) {
    const fb = await ensureFirebase();
    if (!fb || !uai) return [];
    await ensureSignedIn(account);
    const fs = fb.sdk.fs;
    const q = fs.query(fs.collection(fb.db, 'classes'), fs.where('uai', '==', uai));
    const snap = await fs.getDocs(q);
    const classes = snap.docs.map(function (d) { return d.data(); }).filter(function (c) {
      return !yearId || c.yearId === yearId;
    });

    const results = await Promise.all(
      classes.map(async function (cls) {
        const members = await fetchClassLeaderboard(cls.classId, account);
        const totalPoints = members.reduce(function (sum, m) { return sum + (m.points || 0); }, 0);
        return {
          classId: cls.classId,
          className: cls.className,
          levelId: cls.levelId,
          inviteCode: cls.inviteCode,
          memberCount: members.length,
          totalPoints: totalPoints,
          weeklyGoalPoints: cls.weeklyGoalPoints || 600
        };
      })
    );
    results.sort(function (a, b) { return b.totalPoints - a.totalPoints; });
    return results;
  }

  /**
   * Local/Demo preview leaderboard when Firebase is not yet configured (clearly labeled as preview data).
   */
  function buildLocalPreviewLeaderboard(account, yearRec, challengeMembership, infiniteStreak) {
    const myScore = computeChallengeScore(yearRec, infiniteStreak);
    const me = {
      uid: 'local_me',
      pseudo: (challengeMembership && challengeMembership.pseudo) || account.displayName,
      levelId: yearRec.levelId,
      avatarColor: account.avatarColor || '#0284C7',
      points: myScore.points,
      exercisesCount: myScore.exercisesCount,
      quizzesCount: myScore.quizzesCount,
      avgOn20: myScore.avgOn20,
      isMe: true
    };
    const peers = [
      { uid: 'demo_1', pseudo: 'Camille M.', levelId: yearRec.levelId, avatarColor: '#15803D', points: Math.max(210, myScore.points + 45), exercisesCount: 6, quizzesCount: 5, avgOn20: 17.4, isDemoPeer: true },
      { uid: 'demo_2', pseudo: 'Noé R.', levelId: yearRec.levelId, avatarColor: '#7E22CE', points: Math.max(155, myScore.points - 20), exercisesCount: 5, quizzesCount: 4, avgOn20: 15.8, isDemoPeer: true },
      { uid: 'demo_3', pseudo: 'Inès B.', levelId: yearRec.levelId, avatarColor: '#D9480F', points: Math.max(120, myScore.points - 55), exercisesCount: 4, quizzesCount: 3, avgOn20: 16.2, isDemoPeer: true }
    ];
    return [me].concat(peers).sort(function (a, b) { return b.points - a.points; });
  }

  function getStatus() {
    const cfg = getActiveConfig();
    return {
      configured: Boolean(cfg),
      projectId: cfg ? cfg.projectId : null,
      connected: Boolean(fbApp && currentUser),
      uid: currentUser ? currentUser.uid : null,
      error: initError
    };
  }

  global.CapCloud = {
    getActiveConfig: getActiveConfig,
    saveLocalFirebaseConfig: saveLocalFirebaseConfig,
    getStatus: getStatus,
    ensureFirebase: ensureFirebase,
    ensureSignedIn: ensureSignedIn,
    signOutCloud: signOutCloud,
    computeChallengeScore: computeChallengeScore,
    searchFrenchSchools: searchFrenchSchools,
    makeInviteCode: makeInviteCode,
    createCloudClass: createCloudClass,
    findCloudClassByInviteCode: findCloudClassByInviteCode,
    syncStudentToCloud: syncStudentToCloud,
    fetchClassLeaderboard: fetchClassLeaderboard,
    fetchSchoolClassesLeaderboard: fetchSchoolClassesLeaderboard,
    buildLocalPreviewLeaderboard: buildLocalPreviewLeaderboard
  };
})(window);
