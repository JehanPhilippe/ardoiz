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

    // 1. Private full backup: either children/{childId} (Parent/Child co-parenting model) or legacy users/{uid}
    const serialized = JSON.stringify({
      schoolYears: account.schoolYears,
      activeYearId: account.activeYearId,
      challenge: account.challenge || null
    });
    const safeUsername = String(account.username || 'eleve').trim();
    const safeDisplayName = String(account.displayName || 'Élève').trim();
    const safeSurface = account.surfaceMode === 'night' ? 'night' : 'paper';

    if (account.childId && serialized.length <= 360000) {
      const parentList = Array.isArray(account.parentUids) && account.parentUids.length > 0
        ? account.parentUids.slice(0, 2)
        : [user.uid];
      const isParent = parentList.indexOf(user.uid) !== -1;
      const childRef = fs.doc(fb.db, 'children', account.childId);

      if (isParent) {
        await fs.setDoc(
          childRef,
          {
            childId: account.childId,
            parentUids: parentList,
            createdBy: account.createdBy || parentList[0] || user.uid,
            helperUids: Array.isArray(account.helperUids) ? account.helperUids.slice(0, 5) : [],
            helperLabels: account.helperLabels && typeof account.helperLabels === 'object' ? account.helperLabels : {},
            studentUid: account.studentUid || null,
            displayName: (safeDisplayName.length >= 1 ? safeDisplayName : 'Enfant').slice(0, 40),
            avatarColor: String(account.avatarColor || '#0284C7').slice(0, 20),
            activeYearId: account.activeYearId,
            schoolUai: challengeMembership && challengeMembership.uai ? String(challengeMembership.uai).slice(0, 16) : null,
            classId: challengeMembership && challengeMembership.classId ? String(challengeMembership.classId).slice(0, 64) : null,
            surfaceMode: safeSurface,
            pendingInviteCode: account.pendingInviteCode || null,
            pendingInviteRole: account.pendingInviteRole || null,
            pendingInviteExpiresAt: account.pendingInviteExpiresAt || null,
            dataJson: serialized,
            updatedAt: nowMs
          },
          { merge: true }
        );
      } else {
        // Helper (tata/tonton/mamie) or Autonomous Student: pedagogical fields ONLY!
        await fs.updateDoc(childRef, {
          activeYearId: account.activeYearId,
          schoolUai: challengeMembership && challengeMembership.uai ? String(challengeMembership.uai).slice(0, 16) : null,
          classId: challengeMembership && challengeMembership.classId ? String(challengeMembership.classId).slice(0, 64) : null,
          surfaceMode: safeSurface,
          dataJson: serialized,
          updatedAt: nowMs
        });
      }
    } else if (serialized.length <= 360000) {
      await fs.setDoc(
        fs.doc(fb.db, 'users', user.uid),
        {
          uid: user.uid,
          displayName: (safeDisplayName.length >= 1 ? safeDisplayName : 'Élève').slice(0, 40),
          username: (safeUsername.length >= 2 ? safeUsername : 'eleve').slice(0, 32),
          activeYearId: account.activeYearId,
          schoolUai: challengeMembership && challengeMembership.uai ? String(challengeMembership.uai).slice(0, 16) : null,
          classId: challengeMembership && challengeMembership.classId ? String(challengeMembership.classId).slice(0, 64) : null,
          surfaceMode: safeSurface,
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
      const memberDocId = account.childId || user.uid;
      await fs.setDoc(
        fs.doc(fb.db, 'classes', challengeMembership.classId, 'members', memberDocId),
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

  /**
   * Parent Auth, Google Sign-In, Account Linking & 3-Role Family Access (Parent / Proche / Collégien).
   */
  function makeFamilyInviteCode(role) {
    const prefix = role === 'helper' ? 'PRO' : role === 'student' ? 'ELV' : 'PAR';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = prefix;
    for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  function getLinkedProviders() {
    if (!fbAuth || !fbAuth.currentUser) return [];
    return (fbAuth.currentUser.providerData || []).map(function (p) { return p.providerId; });
  }

  async function fetchAllAccessibleChildrenForUid(fb, uid) {
    const fs = fb.sdk.fs;
    const col = fs.collection(fb.db, 'children');
    const [pSnap, hSnap, sSnap] = await Promise.all([
      fs.getDocs(fs.query(col, fs.where('parentUids', 'array-contains', uid))).catch(function () { return { docs: [] }; }),
      fs.getDocs(fs.query(col, fs.where('helperUids', 'array-contains', uid))).catch(function () { return { docs: [] }; }),
      fs.getDocs(fs.query(col, fs.where('studentUid', '==', uid))).catch(function () { return { docs: [] }; })
    ]);
    const byId = {};
    [pSnap, hSnap, sSnap].forEach(function (snap) {
      (snap.docs || []).forEach(function (d) {
        const data = d.data();
        if (data && data.childId) byId[data.childId] = data;
      });
    });
    return Object.keys(byId).map(function (k) { return byId[k]; });
  }

  async function ensureParentDocCloud(displayName) {
    const fb = await ensureFirebase();
    if (!fb || !fb.auth.currentUser) throw new Error('Connexion requise.');
    const user = fb.auth.currentUser;
    const fs = fb.sdk.fs;
    const pRef = fs.doc(fb.db, 'parents', user.uid);
    const pSnap = await fs.getDoc(pRef);
    if (pSnap.exists()) return pSnap.data();

    const nowMs = Date.now();
    const cleanEmail = String(user.email || (user.uid.slice(0, 8) + '@ardoiz.app')).trim().toLowerCase().slice(0, 120);
    const cleanName = String(displayName || user.displayName || cleanEmail.split('@')[0] || 'Parent').trim().slice(0, 40);
    const parentDoc = {
      uid: user.uid,
      displayName: cleanName || 'Parent',
      email: cleanEmail,
      consentAcceptedAt: nowMs,
      consentVersion: '2026-11-rgpd-mineurs-v1',
      updatedAt: nowMs
    };
    await fs.setDoc(pRef, parentDoc);
    return parentDoc;
  }

  async function registerParentCloud(displayName, email, password, isInvitedOnly) {
    const fb = await ensureFirebase();
    if (!fb) throw new Error('Service Cloud indisponible.');
    const cleanName = String(displayName || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPass = String(password || '');
    if (cleanName.length < 1) throw new Error('Indique ton prénom.');
    if (!cleanEmail || cleanEmail.indexOf('@') === -1) throw new Error('Indique une adresse e-mail valide.');
    if (cleanPass.length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères.');

    if (fb.auth.currentUser) {
      try { await fb.sdk.auth.signOut(fb.auth); } catch (e) {}
    }

    let user = null;
    try {
      const cred = await fb.sdk.auth.createUserWithEmailAndPassword(fb.auth, cleanEmail, cleanPass);
      user = cred.user;
    } catch (err) {
      if (err && err.code === 'auth/operation-not-allowed') {
        throw new Error('Active « Adresse e-mail / Mot de passe » dans Firebase → Authentication.');
      }
      if (err && err.code === 'auth/email-already-in-use') {
        throw new Error('Un compte existe déjà avec cette adresse e-mail. Connecte-toi dans l’onglet Connexion (ou utilise Google).');
      }
      throw new Error((err && err.message) || 'Impossible de créer le compte.');
    }

    currentUser = user;
    if (isInvitedOnly) {
      return {
        uid: user.uid,
        displayName: cleanName.slice(0, 40),
        email: cleanEmail.slice(0, 120),
        providers: getLinkedProviders()
      };
    }

    const parentDoc = await ensureParentDocCloud(cleanName);
    parentDoc.providers = getLinkedProviders();
    return parentDoc;
  }

  async function loginParentCloud(email, password) {
    const fb = await ensureFirebase();
    if (!fb) throw new Error('Service Cloud indisponible.');
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPass = String(password || '');
    if (!cleanEmail || !cleanPass) throw new Error('Renseigne ton e-mail et ton mot de passe.');

    let user = null;
    try {
      const cred = await fb.sdk.auth.signInWithEmailAndPassword(fb.auth, cleanEmail, cleanPass);
      user = cred.user;
    } catch (err) {
      if (err && err.code === 'auth/operation-not-allowed') {
        throw new Error('Active « Adresse e-mail / Mot de passe » dans Firebase → Authentication.');
      }
      throw new Error('E-mail ou mot de passe incorrect. (Si tu t’es inscrit avec Google, clique sur « Continuer avec Google ».)');
    }

    currentUser = user;
    const fs = fb.sdk.fs;
    const pSnap = await fs.getDoc(fs.doc(fb.db, 'parents', user.uid));
    const parentDoc = pSnap.exists() ? pSnap.data() : null;
    const children = await fetchAllAccessibleChildrenForUid(fb, user.uid);
    return {
      user: {
        uid: user.uid,
        email: user.email || cleanEmail,
        displayName: (parentDoc && parentDoc.displayName) || user.displayName || cleanEmail.split('@')[0] || 'Utilisateur',
        consentAcceptedAt: parentDoc ? parentDoc.consentAcceptedAt : null,
        providers: getLinkedProviders()
      },
      parentDoc: parentDoc,
      children: children
    };
  }

  async function signInWithGoogleCloud() {
    const fb = await ensureFirebase();
    if (!fb) throw new Error('Service Cloud indisponible.');
    const provider = new fb.sdk.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    let user = null;
    try {
      const cred = await fb.sdk.auth.signInWithPopup(fb.auth, provider);
      user = cred.user;
    } catch (err) {
      if (err && err.code === 'auth/popup-closed-by-user') {
        throw new Error('Connexion Google annulée.');
      }
      if (err && err.code === 'auth/account-exists-with-different-credential') {
        throw new Error('Un compte existe déjà avec cet e-mail par mot de passe. Connecte-toi avec ton mot de passe puis clique sur « Associer Google » dans Famille & Réglages.');
      }
      throw new Error((err && err.message) || 'Impossible de se connecter avec Google.');
    }

    currentUser = user;
    const fs = fb.sdk.fs;
    const pSnap = await fs.getDoc(fs.doc(fb.db, 'parents', user.uid));
    const parentDoc = pSnap.exists() ? pSnap.data() : null;
    const children = await fetchAllAccessibleChildrenForUid(fb, user.uid);
    return {
      user: {
        uid: user.uid,
        email: user.email || '',
        displayName: (parentDoc && parentDoc.displayName) || user.displayName || (user.email ? user.email.split('@')[0] : 'Utilisateur'),
        consentAcceptedAt: parentDoc ? parentDoc.consentAcceptedAt : null,
        providers: getLinkedProviders()
      },
      parentDoc: parentDoc,
      children: children
    };
  }

  async function linkGoogleToCurrentUser() {
    const fb = await ensureFirebase();
    if (!fb || !fb.auth.currentUser) throw new Error('Connecte-toi d’abord à ton compte.');
    const provider = new fb.sdk.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await fb.sdk.auth.linkWithPopup(fb.auth.currentUser, provider);
      return getLinkedProviders();
    } catch (err) {
      if (err && err.code === 'auth/provider-already-linked') return getLinkedProviders();
      if (err && err.code === 'auth/credential-already-in-use') {
        throw new Error('Ce compte Google est déjà associé à un autre compte Ardoiz.');
      }
      throw new Error((err && err.message) || 'Impossible d’associer ce compte Google.');
    }
  }

  async function linkPasswordToCurrentUser(newPassword) {
    const fb = await ensureFirebase();
    if (!fb || !fb.auth.currentUser || !fb.auth.currentUser.email) {
      throw new Error('Connecte-toi d’abord avec un compte ayant une adresse e-mail.');
    }
    const cleanPass = String(newPassword || '');
    if (cleanPass.length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
    try {
      const cred = fb.sdk.auth.EmailAuthProvider.credential(fb.auth.currentUser.email, cleanPass);
      await fb.sdk.auth.linkWithCredential(fb.auth.currentUser, cred);
      return getLinkedProviders();
    } catch (err) {
      if (err && err.code === 'auth/provider-already-linked') return getLinkedProviders();
      if (err && err.code === 'auth/requires-recent-login') {
        throw new Error('Pour ta sécurité, reconnecte-toi puis réessaie d’ajouter un mot de passe.');
      }
      throw new Error((err && err.message) || 'Impossible d’ajouter un mot de passe à ce compte.');
    }
  }

  async function fetchParentChildren() {
    const fb = await ensureFirebase();
    if (!fb || !fb.auth.currentUser) return [];
    return fetchAllAccessibleChildrenForUid(fb, fb.auth.currentUser.uid);
  }

  async function createFamilyInvite(childAccount, levelId, role, label) {
    const fb = await ensureFirebase();
    if (!fb || !fb.auth.currentUser) throw new Error('Connecte-toi d’abord à ton compte Parent.');
    if (!childAccount || !childAccount.childId) throw new Error('Profil enfant non synchronisé.');
    const safeRole = role === 'helper' || role === 'student' ? role : 'parent';

    if (safeRole === 'parent' && Array.isArray(childAccount.parentUids) && childAccount.parentUids.length >= 2) {
      throw new Error('Cet enfant a déjà 2 parents rattachés.');
    }
    if (safeRole === 'helper' && Array.isArray(childAccount.helperUids) && childAccount.helperUids.length >= 5) {
      throw new Error('Limite atteinte : 5 proches accompagnants maximum par enfant.');
    }
    if (safeRole === 'student' && childAccount.studentUid) {
      throw new Error('Un accès autonome collégien est déjà actif pour cet enfant (révoque-le d’abord si besoin).');
    }

    const fs = fb.sdk.fs;
    const uid = fb.auth.currentUser.uid;
    const code = makeFamilyInviteCode(safeRole);
    const nowMs = Date.now();
    const expiresAt = nowMs + 48 * 3600 * 1000;
    const defaultLabel = safeRole === 'helper' ? 'Proche' : safeRole === 'student' ? 'Collégien' : 'Co-parent';
    const cleanLabel = String(label || defaultLabel).trim().slice(0, 30) || defaultLabel;

    if (childAccount.pendingInviteCode) {
      try { await fs.deleteDoc(fs.doc(fb.db, 'parentInvites', childAccount.pendingInviteCode)); } catch (e) {}
    }

    childAccount.pendingInviteCode = code;
    childAccount.pendingInviteRole = safeRole;
    childAccount.pendingInviteExpiresAt = expiresAt;

    await fs.updateDoc(fs.doc(fb.db, 'children', childAccount.childId), {
      pendingInviteCode: code,
      pendingInviteRole: safeRole,
      pendingInviteExpiresAt: expiresAt,
      updatedAt: nowMs
    });

    await fs.setDoc(fs.doc(fb.db, 'parentInvites', code), {
      code: code,
      childId: childAccount.childId,
      childName: String(childAccount.displayName || 'Enfant').slice(0, 40),
      levelId: levelId || 'CM2',
      role: safeRole,
      label: cleanLabel,
      createdBy: uid,
      expiresAt: expiresAt
    });

    const baseUrl = global.location ? (global.location.origin + global.location.pathname) : '';
    return { code: code, role: safeRole, label: cleanLabel, expiresAt: expiresAt, shareUrl: baseUrl ? baseUrl + '?invite=' + code : '' };
  }

  async function acceptFamilyInvite(rawCode) {
    const fb = await ensureFirebase();
    if (!fb || !fb.auth.currentUser) throw new Error('Connecte-toi d’abord (Google ou e-mail).');
    const fs = fb.sdk.fs;
    const uid = fb.auth.currentUser.uid;
    const code = String(rawCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length < 6) throw new Error('Saisis le code d’invitation à 8 caractères.');

    const invRef = fs.doc(fb.db, 'parentInvites', code);
    const invSnap = await fs.getDoc(invRef);
    if (!invSnap.exists()) throw new Error('Code d’invitation invalide ou déjà utilisé.');
    const inv = invSnap.data();
    if (!inv.expiresAt || inv.expiresAt < Date.now()) {
      throw new Error('Ce code d’invitation a expiré (valable 48h). Demande un nouveau code au parent.');
    }
    if (inv.createdBy === uid) {
      throw new Error('Tu es déjà rattaché à cet enfant.');
    }

    const role = inv.role || 'parent';
    const childRef = fs.doc(fb.db, 'children', inv.childId);
    const batch = fs.writeBatch(fb.db);
    const nowMs = Date.now();

    if (role === 'parent') {
      batch.update(childRef, {
        parentUids: fs.arrayUnion(uid),
        pendingInviteCode: null,
        pendingInviteRole: null,
        pendingInviteExpiresAt: null,
        updatedAt: nowMs
      });
    } else if (role === 'helper') {
      const updatePayload = {
        helperUids: fs.arrayUnion(uid),
        pendingInviteCode: null,
        pendingInviteRole: null,
        pendingInviteExpiresAt: null,
        updatedAt: nowMs
      };
      updatePayload['helperLabels.' + uid] = String(inv.label || 'Proche').slice(0, 30);
      batch.update(childRef, updatePayload);
    } else if (role === 'student') {
      batch.update(childRef, {
        studentUid: uid,
        pendingInviteCode: null,
        pendingInviteRole: null,
        pendingInviteExpiresAt: null,
        updatedAt: nowMs
      });
    }

    batch.delete(invRef);
    await batch.commit();

    if (role === 'parent') {
      await ensureParentDocCloud(fb.auth.currentUser.displayName || null);
    }

    const childSnap = await fs.getDoc(childRef);
    return {
      role: role,
      label: inv.label || role,
      childDoc: childSnap.exists() ? childSnap.data() : null
    };
  }

  async function revokeHelperCloud(childAccount, helperUid) {
    const fb = await ensureFirebase();
    if (!fb || !fb.auth.currentUser || !childAccount || !childAccount.childId) return;
    const fs = fb.sdk.fs;
    const nextHelpers = (childAccount.helperUids || []).filter(function (u) { return u !== helperUid; });
    const nextLabels = Object.assign({}, childAccount.helperLabels || {});
    delete nextLabels[helperUid];
    await fs.updateDoc(fs.doc(fb.db, 'children', childAccount.childId), {
      helperUids: nextHelpers,
      helperLabels: nextLabels,
      updatedAt: Date.now()
    });
    childAccount.helperUids = nextHelpers;
    childAccount.helperLabels = nextLabels;
  }

  async function revokeStudentCloud(childAccount) {
    const fb = await ensureFirebase();
    if (!fb || !fb.auth.currentUser || !childAccount || !childAccount.childId) return;
    const fs = fb.sdk.fs;
    await fs.updateDoc(fs.doc(fb.db, 'children', childAccount.childId), {
      studentUid: null,
      updatedAt: Date.now()
    });
    childAccount.studentUid = null;
  }

  async function deleteChildOrAccountCloud(account, deleteParentAccount) {
    const fb = await ensureFirebase();
    if (!fb || !fb.auth.currentUser) return;
    const fs = fb.sdk.fs;
    const uid = fb.auth.currentUser.uid;

    if (account && account.challenge && account.challenge.classId) {
      const mId = account.childId || uid;
      try { await fs.deleteDoc(fs.doc(fb.db, 'classes', account.challenge.classId, 'members', mId)); } catch (e) {}
    }

    if (account && account.childId) {
      const cRef = fs.doc(fb.db, 'children', account.childId);
      const parents = Array.isArray(account.parentUids) ? account.parentUids : [];
      if (parents.length === 2 && account.createdBy && account.createdBy !== uid) {
        // Co-parent unlinking themselves without erasing the child for the other parent
        const remaining = parents.filter(function (p) { return p !== uid; });
        await fs.updateDoc(cRef, { parentUids: remaining, updatedAt: Date.now() });
      } else {
        if (account.pendingInviteCode) {
          try { await fs.deleteDoc(fs.doc(fb.db, 'parentInvites', account.pendingInviteCode)); } catch (e) {}
        }
        await fs.deleteDoc(cRef);
      }
    } else {
      try { await fs.deleteDoc(fs.doc(fb.db, 'users', uid)); } catch (e) {}
    }

    if (deleteParentAccount) {
      try { await fs.deleteDoc(fs.doc(fb.db, 'parents', uid)); } catch (e) {}
      try { await fb.sdk.auth.deleteUser(fb.auth.currentUser); } catch (e) {}
      await signOutCloud();
    }
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
    getLinkedProviders: getLinkedProviders,
    ensureParentDocCloud: ensureParentDocCloud,
    registerParentCloud: registerParentCloud,
    loginParentCloud: loginParentCloud,
    signInWithGoogleCloud: signInWithGoogleCloud,
    linkGoogleToCurrentUser: linkGoogleToCurrentUser,
    linkPasswordToCurrentUser: linkPasswordToCurrentUser,
    fetchParentChildren: fetchParentChildren,
    createFamilyInvite: createFamilyInvite,
    acceptFamilyInvite: acceptFamilyInvite,
    revokeHelperCloud: revokeHelperCloud,
    revokeStudentCloud: revokeStudentCloud,
    deleteChildOrAccountCloud: deleteChildOrAccountCloud,
    fetchClassLeaderboard: fetchClassLeaderboard,
    fetchSchoolClassesLeaderboard: fetchSchoolClassesLeaderboard,
    buildLocalPreviewLeaderboard: buildLocalPreviewLeaderboard
  };
})(window);
