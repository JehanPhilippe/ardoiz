/* Ardoiz — Main UI Controller (DA 2: Tuiles Vivantes, Ardoise Interactive & Programme Officiel Éducation nationale) */
(function (global) {
  'use strict';

  const Icons = global.CapIcons;
  const SY = global.CapSchoolYear;
  const Curr = global.CapCurriculum;
  const Prog = global.CapOfficialProgram;
  const PracticeGen = global.CapPracticeGenerator;
  const Store = global.CapStorage;
  const Gen = global.CapCourseGenerator;
  const Charts = global.CapCharts;
  const Cloud = global.CapCloud;
  const Board = global.ArdoizBoard;

  let activeBoardCtrl = null;
  let activeScratchCtrl = null;
  let activeAnimTimer = null;

  const state = {
    db: Store.loadDB(),
    accountId: Store.getSessionAccountId(),
    parentSession: Store.getParentSession(),
    selectedYearId: null,
    view: 'dashboard', // dashboard | ardoise | subjects | challenge | history | settings
    subjectHubTab: 'exercises', // exercises | quizzes | homework | program | studio
    authTab: 'login',
    authError: '',
    authBusy: false,
    regLevelId: 'CM2',
    regDraft: { parentName: '', parentEmail: '', childName: '' },
    addChildLevelId: 'CM2',
    coParentBusy: false,
    confirmDeleteStep: false,
    hwFilterStatus: 'all',
    hwFilterSubject: 'all',
    exTab: 'practice', // practice | sheets | infinite
    exFilterSubject: 'all',
    activeExerciseId: null,
    exState: { selectedOption: null, textInput: '', revealedHints: 0, submitted: false, isCorrect: false },
    infiniteSubject: 'maths',
    infiniteExercise: null,
    infiniteStreak: 0,
    quizFilterSubject: 'all',
    activeQuiz: null,
    quizRun: { index: 0, answers: [], finished: false, lastResult: null },
    programFilterSubject: 'all',
    officialApiState: {}, // keyed by levelId: { loading, data }
    ardoiseTab: 'notes', // notes | animated
    ardoiseColor: '#F8FAFC',
    ardoiseSize: 4,
    ardoiseTool: 'chalk',
    ardoiseBg: 'grid', // plain | grid | lined
    ardoiseNoteSubject: 'maths',
    ardoiseNoteTitle: '',
    ardoiseNoteText: '',
    ardoiseFilterSubject: 'all',
    ardoiseDraftDataUrl: null,
    activeAnimLesson: null,
    animStepIndex: 0,
    animPlaying: false,
    challengeSearchQuery: '',
    challengeSchools: [],
    challengeSearching: false,
    challengeSearchError: '',
    challengeSelectedSchool: null,
    challengeSwitching: false,
    challengeLeaderboard: null,
    challengeSchoolBoard: null,
    challengeLoading: false,
    cloudSyncing: false,
    cloudLastSync: null,
    cloudError: '',
    studioTab: 'photo',
    studioPhoto: { subjectId: 'maths', chapter: '', notes: '', imageDataUrl: null, fileName: '', generating: false, draftPack: null },
    historyFilterSubject: 'all',
    modal: null
  };

  function stopAnimTimer() {
    if (activeAnimTimer) {
      clearInterval(activeAnimTimer);
      activeAnimTimer = null;
    }
  }

  function cleanupCanvases() {
    if (activeBoardCtrl) {
      try { state.ardoiseDraftDataUrl = activeBoardCtrl.toInkDataUrl(); } catch (e) {}
      activeBoardCtrl.destroy();
      activeBoardCtrl = null;
    }
    if (activeScratchCtrl) {
      activeScratchCtrl.destroy();
      activeScratchCtrl = null;
    }
  }

  function getAccount() {
    if (!state.accountId) return null;
    return state.db.accounts.find(function (a) { return a.id === state.accountId; }) || null;
  }

  function getSelectedYear(account) {
    if (!account || !account.schoolYears || account.schoolYears.length === 0) return null;
    const targetId = state.selectedYearId || account.activeYearId;
    return (
      account.schoolYears.find(function (y) { return y.yearId === targetId; }) ||
      account.schoolYears[account.schoolYears.length - 1]
    );
  }

  function isViewingArchivedYear(account, yearRec) {
    return Boolean(account && yearRec && yearRec.yearId !== account.activeYearId);
  }

  function applySurfaceMode(account) {
    const raw = (account && account.surfaceMode) || (state.db.settings && state.db.settings.surfaceMode) || 'paper';
    const mode = raw === 'night' ? 'night' : 'paper';
    document.documentElement.setAttribute('data-surface', mode);
    return mode;
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeAnswer(str) {
    return String(str || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/\.(\d)/g, ',$1').replace(/[’']/g, "'");
  }

  function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.innerHTML = Icons.icon('checkCircle', 18) + '<span>' + esc(message) + '</span>';
    container.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 3400);
  }

  function getAllExercisesForYear(yearRec, subjectId) {
    const builtIn = Curr.getBuiltInExercises(yearRec.levelId, subjectId === 'all' ? null : subjectId);
    const custom = (yearRec.customExercises || []).filter(function (e) {
      return subjectId === 'all' || !subjectId || e.subjectId === subjectId;
    });
    return custom.concat(builtIn);
  }

  function getAllMethodSheetsForYear(yearRec, subjectId) {
    const builtIn = Curr.getBuiltInMethodSheets(yearRec.levelId, subjectId === 'all' ? null : subjectId);
    const custom = (yearRec.customMethodSheets || []).filter(function (m) {
      return subjectId === 'all' || !subjectId || m.subjectId === subjectId;
    });
    return custom.concat(builtIn);
  }

  function getAllQuizzesForYear(yearRec, subjectId) {
    const builtIn = Curr.getBuiltInQuizzes(yearRec.levelId, subjectId === 'all' ? null : subjectId);
    const custom = (yearRec.customQuizzes || []).filter(function (q) {
      return subjectId === 'all' || !subjectId || q.subjectId === subjectId;
    });
    return custom.concat(builtIn);
  }

  function subjectBadgeHTML(subjectId) {
    const s = Curr.getSubjectDef(subjectId);
    return (
      '<span class="badge" style="background:var(' + s.softVar + ');color:var(' + s.colorVar + ')">' +
      Icons.icon(s.icon, 14) + '<span>' + esc(s.short) + '</span></span>'
    );
  }

  function ensureOfficialTextsLoaded(levelId, force) {
    const slot = state.officialApiState[levelId];
    if (!force && slot && (slot.loading || slot.data)) return;
    const cached = !force ? Prog.loadCachedTexts(levelId) : null;
    state.officialApiState[levelId] = { loading: true, data: cached };
    Prog.fetchOfficialMinistryTexts(levelId).then(function (data) {
      state.officialApiState[levelId] = { loading: false, data: data };
      if (state.view === 'program' || state.view === 'dashboard') {
        render();
      }
    });
  }

  function triggerBackgroundCloudSync(account, yearRec, opts) {
    if (!Cloud || !Cloud.getStatus().configured || !account || !yearRec) return;
    Cloud.syncStudentToCloud(account, yearRec, account.challenge || null, state.infiniteStreak, opts)
      .then(function (res) {
        if (res && res.synced) {
          if (res.uid && account.firebaseUid !== res.uid) {
            account.firebaseUid = res.uid;
            Store.saveDB(state.db);
          }
          state.cloudLastSync = res.at;
          state.cloudError = '';
        }
      })
      .catch(function (err) {
        state.cloudError = err && err.message ? err.message : 'Erreur de synchronisation cloud';
      });
  }

  function loadChallengeLeaderboards(account, yearRec, force) {
    if (!Cloud || !Cloud.getStatus().configured || !account || !account.challenge || !account.challenge.classId) return;
    if (state.challengeLoading) return;
    if (!force && state.challengeLeaderboard !== null) return;
    state.challengeLoading = true;
    Promise.all([
      Cloud.fetchClassLeaderboard(account.challenge.classId),
      Cloud.fetchSchoolClassesLeaderboard(account.challenge.uai, yearRec.yearId)
    ])
      .then(function (res) {
        state.challengeLeaderboard = res[0] || [];
        state.challengeSchoolBoard = res[1] || [];
        state.challengeLoading = false;
        state.cloudError = '';
        if (state.view === 'challenge') render();
      })
      .catch(function (err) {
        state.challengeLoading = false;
        state.cloudError = err && err.message ? err.message : 'Impossible de charger le classement cloud';
        if (state.view === 'challenge') render();
      });
  }

  function render() {
    cleanupCanvases();
    const root = document.getElementById('app-root');
    if (!root) return;
    const account = getAccount();
    applySurfaceMode(account);

    if (!account) {
      stopAnimTimer();
      root.innerHTML = renderAuthScreen();
      bindAuthEvents();
      return;
    }

    const yearRec = getSelectedYear(account);
    if (!state.selectedYearId && yearRec) state.selectedYearId = yearRec.yearId;
    if (!Array.isArray(yearRec.completedAttenduCodes)) yearRec.completedAttenduCodes = [];
    if (!Array.isArray(yearRec.notes)) yearRec.notes = [];

    const levelSubjects = Curr.getSubjectsForLevel(yearRec.levelId);
    if (!levelSubjects.some(function (s) { return s.id === state.studioPhoto.subjectId; })) {
      state.studioPhoto.subjectId = levelSubjects[0].id;
    }
    if (!levelSubjects.some(function (s) { return s.id === state.ardoiseNoteSubject; })) {
      state.ardoiseNoteSubject = levelSubjects[0].id;
    }

    if (state.view !== 'ardoise' || state.ardoiseTab !== 'animated') {
      stopAnimTimer();
      state.animPlaying = false;
    }

    if (state.view === 'program' || (state.view === 'subjects' && state.subjectHubTab === 'program')) {
      ensureOfficialTextsLoaded(yearRec.levelId, false);
    }
    if (Cloud && Cloud.getStatus().configured && !account.firebaseUid && state.lastAutoSyncAccountId !== account.id) {
      state.lastAutoSyncAccountId = account.id;
      triggerBackgroundCloudSync(account, yearRec, { forceNewSession: true });
    }
    if (state.view === 'challenge' && account.challenge && Cloud && Cloud.getStatus().configured) {
      loadChallengeLeaderboards(account, yearRec, false);
    }

    root.innerHTML = renderAppShell(account, yearRec);
    bindShellEvents(account, yearRec);
    hydrateAsyncPhotos();
    mountActiveCanvases();
  }

  function mountActiveCanvases() {
    const mainCanvas = document.getElementById('ardoise-canvas');
    if (mainCanvas && Board) {
      activeBoardCtrl = Board.mountCanvas(mainCanvas, {
        color: state.ardoiseColor,
        size: state.ardoiseSize,
        tool: state.ardoiseTool,
        bgMode: state.ardoiseBg,
        initialDataUrl: state.ardoiseDraftDataUrl
      });
    }
    const scratchCanvas = document.getElementById('scratchpad-canvas');
    if (scratchCanvas && Board) {
      activeScratchCtrl = Board.mountCanvas(scratchCanvas, {
        color: '#F8FAFC',
        size: 3.5,
        tool: 'chalk',
        bgMode: 'grid'
      });
    }
  }

  function hydrateAsyncPhotos() {
    document.querySelectorAll('img[data-photo-ref]').forEach(function (img) {
      const ref = img.getAttribute('data-photo-ref');
      if (!ref) return;
      Store.loadPhoto(ref).then(function (url) {
        if (url) { img.src = url; img.style.display = 'block'; }
      });
    });
  }

  // ===========================
  // AUTH SCREEN (DA 2 LIVING TILES)
  // ===========================
  function renderAuthScreen() {
    const now = Store.getEffectiveNow(state.db);
    const currentYearId = SY.getCurrentSchoolYearId(now);
    const isReg = state.authTab === 'register';

    const levelButtons = SY.LEVELS.map(function (lv) {
      const sel = state.regLevelId === lv.id ? ' is-selected' : '';
      return (
        '<button type="button" class="level-choice' + sel + '" data-reg-level="' + lv.id + '" aria-pressed="' + (state.regLevelId === lv.id) + '">' +
        '<strong>' + lv.label + '</strong><span>' + lv.cycle + '</span></button>'
      );
    }).join('');

    const accountChips = state.db.accounts.map(function (acc) {
      const latestY = acc.schoolYears[acc.schoolYears.length - 1];
      return (
        '<button type="button" class="account-chip" data-quick-user="' + esc(acc.username) + '">' +
        '<span class="avatar-dot" style="background:' + esc(acc.avatarColor) + '">' + esc(acc.displayName.charAt(0).toUpperCase()) + '</span>' +
        '<span>' + esc(acc.displayName) + ' · ' + esc(latestY ? latestY.levelId : '') + '</span></button>'
      );
    }).join('');

    return (
      '<div class="auth-screen">' +
      '<aside class="auth-showcase">' +
      '<div>' +
      '<div class="brand-lockup"><span class="brand-mark">' + Icons.icon('logo', 22) + '</span><span class="brand-name">Ardoiz</span></div>' +
      '<h1>Ton ardoise et tes devoirs, du CP à la 3e</h1>' +
      '<p class="auth-lead">Un espace calme pour organiser tes devoirs, t’entraîner avec des cours animés à la craie, réviser tes fiches méthode et suivre tes progrès toute l’année.</p>' +
      '<div class="auth-chalk-preview">' +
      '<ul class="auth-feature-list">' +
      '<li>' + Icons.icon('chalkboard', 18) + '<span>Ardoise craie &amp; cours animés</span></li>' +
      '<li>' + Icons.icon('bookOpen', 18) + '<span>Exercices guidés &amp; infinis</span></li>' +
      '<li>' + Icons.icon('camera', 18) + '<span>Photo de cours → fiche + quiz</span></li>' +
      '<li>' + Icons.icon('trophy', 18) + '<span>Challenge Classe (UAI)</span></li>' +
      '</ul>' +
      '</div>' +
      '</div>' +
      '<div class="auth-demo-strip">' +
      '<p><strong>Tester en un clic</strong> avec le compte démo <strong>Léa (CM2)</strong> et ses archives CE2 + CM1.</p>' +
      '<button type="button" class="btn btn-slate-solid" id="btn-demo-login" style="align-self:flex-start">' + Icons.icon('sparkles', 17) + '<span>Ouvrir le compte démo Léa</span></button>' +
      '</div>' +
      '</aside>' +
      '<main class="auth-form-pane">' +
      '<div class="auth-panel">' +
      '<div class="auth-tabs" role="tablist">' +
      '<button type="button" role="tab" class="auth-tab' + (!isReg ? ' is-active' : '') + '" data-auth-tab="login" aria-selected="' + (!isReg) + '">Se connecter</button>' +
      '<button type="button" role="tab" class="auth-tab' + (isReg ? ' is-active' : '') + '" data-auth-tab="register" aria-selected="' + isReg + '">Créer un compte</button>' +
      '</div>' +
      (state.authError ? '<div class="form-error" role="alert" style="margin-bottom:16px">' + Icons.icon('alertCircle', 18) + '<span>' + esc(state.authError) + '</span></div>' : '') +
      (!isReg
        ? '<form class="auth-form" id="login-form">' +
          '<h2>Connexion Espace Parent</h2>' +
          '<div class="field"><label for="login-user">E-mail du parent (ou identifiant local)</label><input class="input" id="login-user" name="username" autocomplete="username" placeholder="ex. parent@exemple.fr" required></div>' +
          '<div class="field"><label for="login-pass">Mot de passe</label><div class="password-wrap"><input class="input" id="login-pass" name="password" type="password" autocomplete="current-password" placeholder="Ton mot de passe" required><button type="button" class="password-toggle" data-toggle-pass="login-pass" aria-label="Afficher ou masquer">' + Icons.icon('eye', 18) + '</button></div></div>' +
          '<button type="submit" class="btn btn-primary" style="width:100%"' + (state.authBusy ? ' disabled' : '') + '>' + Icons.icon('arrowRight', 18) + '<span>' + (state.authBusy ? 'Connexion en cours…' : 'Entrer dans Ardoiz') + '</span></button>' +
          '</form>' +
          (state.db.accounts.length > 0 ? '<div class="existing-accounts"><span class="field-help">Accès rapide sur cet appareil :</span><div class="account-chips">' + accountChips + '</div></div>' : '')
        : '<form class="auth-form" id="register-form">' +
          '<h2>Créer un compte Parent (' + esc(currentYearId) + ')</h2>' +
          '<p class="field-help">Les profils d’enfants de moins de 15 ans sont créés et gérés par un parent, avec partage possible au 2e parent (co-parentalité).</p>' +
          '<div class="form-grid-2">' +
          '<div class="field"><label for="reg-parent-name">Prénom du parent</label><input class="input" id="reg-parent-name" name="parentName" value="' + esc(state.regDraft.parentName) + '" placeholder="ex. Sophie" required></div>' +
          '<div class="field"><label for="reg-parent-email">E-mail du parent</label><input class="input" id="reg-parent-email" name="parentEmail" type="email" value="' + esc(state.regDraft.parentEmail) + '" placeholder="parent@exemple.fr" required></div>' +
          '</div>' +
          '<div class="field"><label for="reg-pass">Mot de passe parent (6 caractères min.)</label><div class="password-wrap"><input class="input" id="reg-pass" name="password" type="password" minlength="6" placeholder="Choisis un mot de passe" required><button type="button" class="password-toggle" data-toggle-pass="reg-pass" aria-label="Afficher ou masquer">' + Icons.icon('eye', 18) + '</button></div></div>' +
          '<div class="field"><label for="reg-child-name">Prénom du 1er enfant</label><input class="input" id="reg-child-name" name="childName" value="' + esc(state.regDraft.childName) + '" placeholder="ex. Lucas" required></div>' +
          '<div class="field"><label>Classe de l’enfant (obligatoire)</label><div class="level-picker-grid">' + levelButtons + '</div></div>' +
          '<label style="display:flex;align-items:flex-start;gap:10px;font-size:13px;line-height:1.4;cursor:pointer;color:var(--color-ink-secondary)">' +
          '<input type="checkbox" id="reg-rgpd-consent" name="rgpdConsent" required style="width:18px;height:18px;margin-top:2px;flex-shrink:0">' +
          '<span>En tant que parent / représentant légal, j’autorise la création du profil de mon enfant sur Ardoiz (RGPD mineurs &lt; 15 ans, données hébergées en Europe, sans publicité, supprimables à tout moment).</span>' +
          '</label>' +
          '<button type="submit" class="btn btn-primary" style="width:100%"' + (state.authBusy ? ' disabled' : '') + '>' + Icons.icon('graduation', 18) + '<span id="reg-submit-label">' + (state.authBusy ? 'Création en cours…' : 'Créer l’espace famille (' + esc(state.regLevelId) + ')') + '</span></button>' +
          '</form>') +
      '</div>' +
      '</main>' +
      '</div>'
    );
  }

  function bindAuthEvents() {
    document.querySelectorAll('[data-auth-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () { state.authTab = btn.getAttribute('data-auth-tab'); state.authError = ''; render(); });
    });
    const regPName = document.getElementById('reg-parent-name');
    if (regPName) regPName.addEventListener('input', function () { state.regDraft.parentName = regPName.value; });
    const regPEmail = document.getElementById('reg-parent-email');
    if (regPEmail) regPEmail.addEventListener('input', function () { state.regDraft.parentEmail = regPEmail.value; });
    const regCName = document.getElementById('reg-child-name');
    if (regCName) regCName.addEventListener('input', function () { state.regDraft.childName = regCName.value; });

    document.querySelectorAll('[data-reg-level]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.regLevelId = btn.getAttribute('data-reg-level');
        document.querySelectorAll('[data-reg-level]').forEach(function (other) {
          const isSel = other.getAttribute('data-reg-level') === state.regLevelId;
          other.classList.toggle('is-selected', isSel);
          other.setAttribute('aria-pressed', String(isSel));
        });
        const submitLbl = document.getElementById('reg-submit-label');
        if (submitLbl) submitLbl.textContent = 'Créer l’espace famille (' + state.regLevelId + ')';
      });
    });
    document.querySelectorAll('[data-toggle-pass]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const input = document.getElementById(btn.getAttribute('data-toggle-pass'));
        if (!input) return;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.innerHTML = Icons.icon(show ? 'eyeOff' : 'eye', 18);
      });
    });
    document.querySelectorAll('[data-quick-user]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        const u = chip.getAttribute('data-quick-user');
        const found = state.db.accounts.find(function (a) { return a.username === u; });
        if (found && found.childId && state.parentSession && Array.isArray(found.parentUids) && found.parentUids.indexOf(state.parentSession.uid) !== -1) {
          Store.setSessionAccountId(found.id);
          state.accountId = found.id;
          state.selectedYearId = found.activeYearId;
          state.view = 'dashboard';
          render();
          showToast('Espace de ' + found.displayName + ' ouvert !');
          return;
        }
        const input = document.getElementById('login-user');
        if (input) {
          input.value = (found && found.parentEmail) ? found.parentEmail : u;
          const pass = document.getElementById('login-pass');
          if (u === 'lea' && pass) pass.placeholder = 'Mot de passe démo : soleil';
          if (pass) pass.focus();
        }
      });
    });
    const demoBtn = document.getElementById('btn-demo-login');
    if (demoBtn) {
      demoBtn.addEventListener('click', async function () {
        try {
          const acc = await Store.loginAccount(state.db, 'lea', 'soleil');
          Store.setParentSession(null);
          state.parentSession = null;
          state.accountId = acc.id;
          state.selectedYearId = acc.activeYearId;
          state.authError = '';
          state.view = 'dashboard';
          render();
          showToast('Bienvenue dans le mode démo Léa !');
        } catch (err) { state.authError = err.message; render(); }
      });
    }
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const fd = new FormData(loginForm);
        const identifier = String(fd.get('username') || '').trim();
        const rawPass = String(fd.get('password') || '');
        state.authError = '';
        try {
          if (identifier.indexOf('@') !== -1 && Cloud && Cloud.getStatus().configured) {
            state.authBusy = true;
            render();
            const res = await Cloud.loginParentCloud(identifier, rawPass);
            Store.setParentSession(res.parent);
            state.parentSession = res.parent;
            let firstChild = null;
            (res.children || []).forEach(function (cd) {
              const up = Store.upsertCloudChildProfile(state.db, cd);
              if (!firstChild && up) firstChild = up;
            });
            if (!firstChild) {
              firstChild = Store.createChildProfile(state.db, {
                displayName: 'Mon enfant',
                levelId: 'CM2',
                parentUid: res.parent.uid,
                parentUids: [res.parent.uid],
                createdBy: res.parent.uid,
                parentEmail: res.parent.email,
                parentName: res.parent.displayName,
                consentAcceptedAt: res.parent.consentAcceptedAt
              });
            }
            Store.setSessionAccountId(firstChild.id);
            state.accountId = firstChild.id;
            state.selectedYearId = firstChild.activeYearId;
            state.authBusy = false;
            state.view = 'dashboard';
            render();
            showToast('Bonjour ' + res.parent.displayName + ' — espace famille synchronisé !');
            return;
          }

          const acc = await Store.loginAccount(state.db, identifier, rawPass);
          state.accountId = acc.id;
          state.selectedYearId = acc.activeYearId;
          state.authError = '';
          state.view = 'dashboard';
          render();
          showToast('Content de te revoir, ' + acc.displayName + ' !');
        } catch (err) {
          state.authBusy = false;
          state.authError = err && err.message ? err.message : 'Erreur de connexion.';
          render();
        }
      });
    }
    const regForm = document.getElementById('register-form');
    if (regForm) {
      regForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const fd = new FormData(regForm);
        const parentName = String(fd.get('parentName') || '').trim();
        const parentEmail = String(fd.get('parentEmail') || '').trim().toLowerCase();
        const rawPass = String(fd.get('password') || '');
        const childName = String(fd.get('childName') || '').trim();
        const consented = Boolean(document.getElementById('reg-rgpd-consent') && document.getElementById('reg-rgpd-consent').checked);
        if (!consented) {
          state.authError = 'L’autorisation parentale (RGPD mineurs < 15 ans) est obligatoire.';
          render();
          return;
        }
        state.authError = '';
        state.authBusy = true;
        render();
        try {
          const parentDoc = await Cloud.registerParentCloud(parentName, parentEmail, rawPass);
          Store.setParentSession(parentDoc);
          state.parentSession = parentDoc;
          const childAcc = Store.createChildProfile(state.db, {
            displayName: childName,
            levelId: state.regLevelId,
            parentUid: parentDoc.uid,
            parentUids: [parentDoc.uid],
            createdBy: parentDoc.uid,
            parentEmail: parentDoc.email,
            parentName: parentDoc.displayName,
            consentAcceptedAt: parentDoc.consentAcceptedAt
          });
          const yr = getSelectedYear(childAcc);
          await Cloud.syncStudentToCloud(childAcc, yr, null, 0);
          state.accountId = childAcc.id;
          state.selectedYearId = childAcc.activeYearId;
          state.authBusy = false;
          state.regDraft = { parentName: '', parentEmail: '', childName: '' };
          state.view = 'dashboard';
          render();
          showToast('Espace famille créé pour ' + childName + ' (' + state.regLevelId + ') !');
        } catch (err) {
          state.authBusy = false;
          state.authError = err && err.message ? err.message : 'Erreur lors de la création du compte parent.';
          render();
        }
      });
    }
  }

  // ===========================
  // INTERFACE 1 SHELL — ARDOISE & PAPIER DOUX (LEFT CHALKBOARD RAIL + CALM PAPER WORKSPACE)
  // ===========================
  function renderAppShell(account, yearRec) {
    const now = Store.getEffectiveNow(state.db);
    const enrollStatus = SY.getNextYearEnrollmentStatus(account, now);
    const pendingHw = (yearRec.homeworks || []).filter(function (h) { return !h.done; }).length;
    const archived = isViewingArchivedYear(account, yearRec);
    const surfaceMode = applySurfaceMode(account);

    // Map any legacy direct view names cleanly onto the 5 calm rail destinations
    const effectiveNav =
      (state.view === 'homework' || state.view === 'exercises' || state.view === 'quizzes' || state.view === 'program' || state.view === 'studio')
        ? 'subjects'
        : state.view;

    const railItems = [
      { id: 'dashboard', label: 'Aujourd’hui', icon: 'calendar', badge: pendingHw > 0 ? pendingHw : null },
      { id: 'ardoise', label: 'Mon Ardoise', icon: 'chalkboard' },
      { id: 'subjects', label: 'Matières', icon: 'bookOpen' },
      { id: 'challenge', label: 'Challenge', icon: 'trophy' },
      { id: 'history', label: 'Parcours', icon: 'barChart' }
    ];

    const sortedYears = account.schoolYears.slice().sort(function (a, b) {
      return SY.parseSchoolYearStart(b.yearId) - SY.parseSchoolYearStart(a.yearId);
    });

    const yearOptions = sortedYears.map(function (y) {
      const sel = y.yearId === yearRec.yearId ? ' selected' : '';
      return '<option value="' + esc(y.yearId) + '"' + sel + '>' + esc(y.levelId) + ' · ' + esc(y.yearId) + (y.yearId !== account.activeYearId ? ' (archive)' : '') + '</option>';
    }).join('');

    const railLinksHTML = railItems.map(function (item) {
      const active = effectiveNav === item.id ? ' is-active' : '';
      return (
        '<button type="button" class="rail-link' + active + '" data-nav="' + item.id + '" aria-current="' + (effectiveNav === item.id ? 'page' : 'false') + '">' +
        Icons.icon(item.icon, 19) +
        '<span>' + item.label + '</span>' +
        (item.badge ? '<span class="rail-badge tabular">' + item.badge + '</span>' : '') +
        '</button>'
      );
    }).join('');

    let viewContent = '';
    if (state.view === 'dashboard') viewContent = renderTodayDashboard(account, yearRec, enrollStatus);
    else if (state.view === 'ardoise') viewContent = renderArdoiseView(account, yearRec);
    else if (state.view === 'subjects') viewContent = renderSubjectsHubView(account, yearRec);
    else if (state.view === 'homework') { state.subjectHubTab = 'homework'; viewContent = renderSubjectsHubView(account, yearRec); }
    else if (state.view === 'exercises') { state.subjectHubTab = 'exercises'; viewContent = renderSubjectsHubView(account, yearRec); }
    else if (state.view === 'quizzes') { state.subjectHubTab = 'quizzes'; viewContent = renderSubjectsHubView(account, yearRec); }
    else if (state.view === 'program') { state.subjectHubTab = 'program'; viewContent = renderSubjectsHubView(account, yearRec); }
    else if (state.view === 'studio') { state.subjectHubTab = 'studio'; viewContent = renderSubjectsHubView(account, yearRec); }
    else if (state.view === 'challenge') viewContent = renderChallengeView(account, yearRec);
    else if (state.view === 'history') viewContent = renderHistoryView(account, yearRec, enrollStatus);
    else if (state.view === 'settings') viewContent = renderSettingsView(account, yearRec, enrollStatus);

    const parentChildren = state.parentSession
      ? state.db.accounts.filter(function (a) {
          return a.childId && Array.isArray(a.parentUids) && a.parentUids.indexOf(state.parentSession.uid) !== -1;
        })
      : [];

    const childSelectHTML = parentChildren.length > 1
      ? '<label class="sr-only" for="rail-child-select">Enfant</label>' +
        '<select class="rail-year-select" id="rail-child-select">' +
        parentChildren.map(function (c) {
          const cy = c.schoolYears[c.schoolYears.length - 1];
          return '<option value="' + esc(c.id) + '"' + (c.id === account.id ? ' selected' : '') + '>' + esc(c.displayName) + ' (' + esc(cy ? cy.levelId : '') + ')</option>';
        }).join('') +
        '</select>'
      : '';

    return (
      '<div class="ardoiz-shell">' +
      '<aside class="left-rail" aria-label="Navigation principale">' +
      '<div class="rail-brand">' +
      '<div class="brand-lockup"><span class="brand-mark">' + Icons.icon('logo', 20) + '</span><span class="brand-name">Ardoiz</span></div>' +
      '</div>' +
      '<div class="rail-year-box">' +
      childSelectHTML +
      '<label class="sr-only" for="rail-year-select">Année scolaire</label>' +
      '<select class="rail-year-select" id="rail-year-select">' + yearOptions + '</select>' +
      '<button type="button" class="rail-enroll-pill' + (enrollStatus.isOpen ? ' is-open' : '') + '" id="btn-open-enroll-gate">' +
      Icons.icon(enrollStatus.isOpen ? 'unlock' : 'lock', 13) +
      '<span>' + (enrollStatus.isOpen ? 'S’inscrire en ' + esc(enrollStatus.targetYearId) : esc(enrollStatus.targetYearId) + ' · 1er mars') + '</span>' +
      '</button>' +
      '</div>' +
      '<nav class="rail-nav" aria-label="Sections">' + railLinksHTML + '</nav>' +
      '<div class="rail-footer">' +
      '<button type="button" class="rail-util-btn" id="btn-toggle-surface">' +
      Icons.icon('palette', 16) + '<span>' + (surfaceMode === 'night' ? 'Mode Papier Doux' : 'Mode Ardoise Nuit') + '</span>' +
      '</button>' +
      '<button type="button" class="rail-util-btn' + (state.view === 'settings' ? ' is-active' : '') + '" data-nav="settings">' +
      Icons.icon('settings', 16) + '<span>Famille &amp; Réglages</span>' +
      '</button>' +
      '<button type="button" class="rail-util-btn" id="btn-logout">' +
      Icons.icon('logout', 16) + '<span>Déconnexion</span>' +
      '</button>' +
      '</div>' +
      '</aside>' +
      '<div class="workspace-wrap">' +
      '<header class="mobile-topbar">' +
      '<div class="brand-lockup"><span class="brand-mark" style="width:30px;height:30px">' + Icons.icon('logo', 17) + '</span><span class="brand-name" style="font-size:1.1rem">Ardoiz</span></div>' +
      '<div class="row-actions">' +
      '<span class="badge" style="background:rgba(255,255,255,0.14);color:#FFF">' + esc(yearRec.levelId) + ' · ' + esc(yearRec.yearId) + '</span>' +
      '<button type="button" class="btn btn-ghost btn-icon" style="color:#FFF" data-nav="settings" aria-label="Réglages">' + Icons.icon('settings', 18) + '</button>' +
      '</div>' +
      '</header>' +
      '<main class="workspace">' +
      (archived
        ? '<div class="archive-banner" role="status">' +
          '<span>' + Icons.icon('archive', 17) + ' Archive consultée : <strong>' + esc(yearRec.yearId) + ' (' + esc(yearRec.levelId) + ')</strong> — tous tes scores et fiches restent accessibles.</span>' +
          '<button type="button" class="btn btn-secondary btn-sm" id="btn-back-active-year">Revenir à ' + esc(account.activeYearId) + '</button>' +
          '</div>'
        : '') +
      viewContent +
      '</main>' +
      '</div>' +
      '<nav class="mobile-nav" aria-label="Navigation mobile">' +
      railItems.map(function (m) {
        return '<button type="button" class="mobile-nav-btn' + (effectiveNav === m.id ? ' is-active' : '') + '" data-nav="' + m.id + '">' + Icons.icon(m.icon, 19) + '<span>' + m.label + '</span></button>';
      }).join('') +
      '</nav>' +
      (state.modal ? renderModal(account, yearRec, enrollStatus) : '') +
      '</div>'
    );
  }

  // ===========================
  // VIEW 1: AUJOURD'HUI (EXACT INTERFACE 1 — ARDOISE & PAPIER DOUX)
  // ===========================
  function renderHeroChalkSVG(levelId) {
    if (levelId === 'CP' || levelId === 'CE1') {
      return (
        '<svg viewBox="0 0 360 116" style="width:100%;max-width:340px;height:auto" aria-label="Addition posée 27 + 15 = 42">' +
        '<text x="180" y="34" fill="#38BDF8" font-family="Plus Jakarta Sans,sans-serif" font-size="16" font-weight="700" text-anchor="middle">Retenue : (+1 dizaine)</text>' +
        '<text x="180" y="76" fill="#F8FAFC" font-family="Plus Jakarta Sans,sans-serif" font-size="38" font-weight="700" text-anchor="middle">27  +  15  =  <tspan fill="#38BDF8">42</tspan></text>' +
        '<line x1="78" y1="92" x2="282" y2="92" stroke="rgba(248,250,252,0.35)" stroke-width="2" stroke-dasharray="6 5"/>' +
        '</svg>'
      );
    }
    if (levelId === '4e' || levelId === '3e') {
      return (
        '<svg viewBox="0 0 380 124" style="width:100%;max-width:360px;height:auto" aria-label="Théorème de Pythagore : AB² + BC² = AC²">' +
        '<polygon points="48,100 170,100 48,24" fill="rgba(56,189,248,0.22)" stroke="#F8FAFC" stroke-width="2.5"/>' +
        '<rect x="48" y="88" width="12" height="12" fill="none" stroke="#FDE047" stroke-width="2"/>' +
        '<line x1="48" y1="24" x2="170" y2="100" stroke="#38BDF8" stroke-width="3"/>' +
        '<text x="22" y="66" fill="#B8D0CB" font-size="14" font-weight="700">3</text>' +
        '<text x="108" y="116" fill="#B8D0CB" font-size="14" font-weight="700" text-anchor="middle">4</text>' +
        '<text x="122" y="54" fill="#38BDF8" font-size="15" font-weight="800">5</text>' +
        '<text x="278" y="58" fill="#F8FAFC" font-family="Plus Jakarta Sans,sans-serif" font-size="22" font-weight="700" text-anchor="middle">AB² + BC² = <tspan fill="#38BDF8">AC²</tspan></text>' +
        '<text x="278" y="88" fill="#B8D0CB" font-family="Plus Jakarta Sans,sans-serif" font-size="17" font-weight="600" text-anchor="middle">3² + 4² = 25 → √25 = 5</text>' +
        '</svg>'
      );
    }
    // Classic fractions diagram matching Interface 1 comp (1/4 + 2/4 = 3/4)
    return (
      '<svg viewBox="0 0 360 132" style="width:100%;max-width:340px;height:auto" aria-label="Fractions visuelles : 1/4 + 2/4 = 3/4">' +
      '<g fill="#F8FAFC" font-family="Plus Jakarta Sans,sans-serif" font-size="20" font-weight="700" text-anchor="middle">' +
      '<text x="76" y="24">1</text><line x1="63" y1="31" x2="89" y2="31" stroke="#F8FAFC" stroke-width="2"/><text x="76" y="52">4</text>' +
      '<text x="128" y="39" fill="#B8D0CB" font-size="22">+</text>' +
      '<text x="180" y="24">2</text><line x1="167" y1="31" x2="193" y2="31" stroke="#F8FAFC" stroke-width="2"/><text x="180" y="52">4</text>' +
      '<text x="232" y="39" fill="#B8D0CB" font-size="22">=</text>' +
      '<text x="284" y="24" fill="#38BDF8">3</text><line x1="271" y1="31" x2="297" y2="31" stroke="#38BDF8" stroke-width="2.2"/><text x="284" y="52" fill="#38BDF8">4</text>' +
      '</g>' +
      // Circle 1: 1/4 filled
      '<g transform="translate(76,96)">' +
      '<circle r="28" fill="none" stroke="#F8FAFC" stroke-width="2"/>' +
      '<path d="M0,0 L0,-28 A28,28 0 0,1 28,0 Z" fill="rgba(56,189,248,0.55)" stroke="#38BDF8" stroke-width="1.5"/>' +
      '<line x1="0" y1="-28" x2="0" y2="0" stroke="#F8FAFC" stroke-width="1.5"/><line x1="0" y1="0" x2="28" y2="0" stroke="#F8FAFC" stroke-width="1.5"/>' +
      '</g>' +
      // Circle 2: 2/4 filled
      '<g transform="translate(180,96)">' +
      '<circle r="28" fill="none" stroke="#F8FAFC" stroke-width="2"/>' +
      '<path d="M0,-28 A28,28 0 0,1 0,28 Z" fill="rgba(56,189,248,0.55)" stroke="#38BDF8" stroke-width="1.5"/>' +
      '<line x1="0" y1="-28" x2="0" y2="28" stroke="#F8FAFC" stroke-width="1.5"/>' +
      '</g>' +
      // Circle 3: 3/4 filled
      '<g transform="translate(284,96)">' +
      '<circle r="28" fill="none" stroke="#F8FAFC" stroke-width="2"/>' +
      '<path d="M0,0 L0,-28 A28,28 0 1,1 -28,0 Z" fill="rgba(56,189,248,0.7)" stroke="#38BDF8" stroke-width="1.5"/>' +
      '<line x1="0" y1="-28" x2="0" y2="0" stroke="#F8FAFC" stroke-width="1.5"/><line x1="0" y1="0" x2="-28" y2="0" stroke="#F8FAFC" stroke-width="1.5"/>' +
      '</g>' +
      '</svg>'
    );
  }

  function renderTodayDashboard(account, yearRec, enrollStatus) {
    const progress = Store.computeYearProgress(yearRec);
    const pendingHw = (yearRec.homeworks || []).filter(function (h) { return !h.done; });
    const avgDisplay = progress.overallAvgOn20 !== null ? String(progress.overallAvgOn20).replace('.', ',') + ' / 20' : 'Début d’année';
    const animPack = Board.getLessonsForLevel(yearRec.levelId);
    const heroLesson = animPack.recommended[0] || Board.ANIMATED_LESSONS[0];

    const orderedSubjects = progress.perSubject.slice().sort(function (a, b) {
      const order = { maths: 0, francais: 1, sciences: 2, svt: 2, anglais: 3, histgeo: 4, physique: 5, techno: 6 };
      return (order[a.subject.id] != null ? order[a.subject.id] : 9) - (order[b.subject.id] != null ? order[b.subject.id] : 9);
    });

    const hwPreview = pendingHw.slice(0, 4);

    const subjectCardsHTML = orderedSubjects.map(function (item) {
      const s = item.subject;
      const scoreHTML = item.avgOn20 !== null
        ? String(item.avgOn20).replace('.', ',') + '<small>/20</small>'
        : item.masteryPercent + '<small>%</small>';
      return (
        '<article class="subject-card">' +
        '<div class="subject-card-strip" style="background:var(' + s.colorVar + ')"></div>' +
        '<div class="subject-card-body">' +
        '<div class="subject-card-name">' + esc(s.name) + '</div>' +
        '<div class="subject-card-score">' + scoreHTML + '</div>' +
        '<div class="subject-card-bar"><div class="subject-card-bar-fill" style="width:' + Math.max(8, item.masteryPercent) + '%;background:var(' + s.colorVar + ')"></div></div>' +
        '<button type="button" class="subject-card-btn" data-open-subject="' + esc(s.id) + '">Réviser</button>' +
        '</div></article>'
      );
    }).join('');

    return (
      '<header class="page-header">' +
      '<div><h1>Bonjour ' + esc(account.displayName) + '</h1></div>' +
      '<div class="header-pills">' +
      '<span class="stat-pill tabular">Moyenne ' + esc(yearRec.levelId) + ' : ' + esc(avgDisplay) + '</span>' +
      '<button type="button" class="user-pill-btn" data-nav="settings" title="Compte et réglages">' +
      '<span class="avatar-dot" style="background:' + esc(account.avatarColor) + '">' + esc(account.displayName.charAt(0).toUpperCase()) + '</span>' +
      '<span>' + esc(account.displayName) + '</span>' +
      '</button>' +
      '</div>' +
      '</header>' +
      '<section class="today-top-grid" aria-label="Priorités du jour">' +
      '<div class="slate-hero-card">' +
      '<div class="slate-hero-head">' +
      '<div class="slate-hero-title">Ardoise du jour <span>· Cours animé</span></div>' +
      '<span class="badge" style="background:rgba(255,255,255,0.1);color:#BAE6FD">' + esc(heroLesson.duration) + '</span>' +
      '</div>' +
      '<div class="slate-hero-visual">' +
      renderHeroChalkSVG(yearRec.levelId) +
      '<span style="color:var(--color-slate-muted);font-size:13px;font-weight:600;text-align:center">' + esc(heroLesson.title) + '</span>' +
      '</div>' +
      '<div class="slate-hero-actions">' +
      '<button type="button" class="btn btn-slate-solid" data-open-ardoise="notes">Ouvrir mon ardoise</button>' +
      '<button type="button" class="btn btn-slate-outline" id="btn-hero-play-anim" data-hero-lesson-id="' + esc(heroLesson.id) + '"><span>Lancer l’animation</span>' + Icons.icon('play', 14) + '</button>' +
      '</div>' +
      '</div>' +
      '<section class="panel" style="display:flex;flex-direction:column">' +
      '<div class="panel-header">' +
      '<h2>Devoirs à faire (' + pendingHw.length + ')</h2>' +
      '<button type="button" class="btn btn-secondary btn-sm" data-open-hub="homework">' + Icons.icon('plus', 14) + '<span>Ajouter</span></button>' +
      '</div>' +
      (hwPreview.length === 0
        ? '<p class="muted-text" style="margin:auto 0">Bravo ! Aucun devoir en attente pour aujourd’hui.</p>'
        : '<div class="hw-list">' + hwPreview.map(function (hw) {
            return (
              '<div class="hw-item">' +
              '<button type="button" class="hw-check" data-toggle-hw="' + esc(hw.id) + '" aria-label="Marquer ce devoir comme terminé"></button>' +
              '<div class="hw-body">' +
              '<div class="hw-title"><strong>' + esc(Curr.getSubjectDef(hw.subjectId).short) + '</strong> · ' + esc(hw.title) + '</div>' +
              (hw.dueDate ? '<div class="hw-meta"><span class="tabular">Pour le ' + esc(SY.formatShortDateFR(hw.dueDate)) + '</span></div>' : '') +
              '</div></div>'
            );
          }).join('') + '</div>') +
      '<div style="margin-top:auto;padding-top:14px;display:flex;justify-content:space-between;align-items:center">' +
      '<button type="button" class="btn btn-ghost btn-sm" data-open-hub="homework">Voir tout l’agenda →</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-open-hub="studio">' + Icons.icon('camera', 14) + '<span>Photo de cours</span></button>' +
      '</div>' +
      '</section>' +
      '</section>' +
      '<section aria-label="Mes matières">' +
      '<div class="section-bar" style="margin-bottom:14px">' +
      '<h2>Mes matières</h2>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-open-hub="program">' + Icons.icon('graduation', 15) + '<span>Programme officiel ' + esc(yearRec.levelId) + '</span></button>' +
      '</div>' +
      '<div class="subject-cards-grid">' + subjectCardsHTML + '</div>' +
      '</section>'
    );
  }

  // ===========================
  // UNIFIED SUBJECTS HUB (EXERCICES & FICHES · QUIZ · DEVOIRS · PROGRAMME · PHOTO)
  // ===========================
  function renderSubjectsHubView(account, yearRec) {
    const tab = state.subjectHubTab || 'exercises';
    const pendingHw = (yearRec.homeworks || []).filter(function (h) { return !h.done; }).length;
    const tabs = [
      { id: 'exercises', label: 'Exercices & Fiches', icon: 'bookOpen' },
      { id: 'quizzes', label: 'Quiz /20', icon: 'trophy' },
      { id: 'homework', label: 'Devoirs' + (pendingHw > 0 ? ' (' + pendingHw + ')' : ''), icon: 'checklist' },
      { id: 'program', label: 'Programme Éduscol', icon: 'graduation' },
      { id: 'studio', label: 'Photo de cours', icon: 'camera' }
    ];

    let inner = '';
    if (tab === 'exercises') inner = renderExercisesView(account, yearRec);
    else if (tab === 'quizzes') inner = renderQuizzesView(account, yearRec);
    else if (tab === 'homework') inner = renderHomeworkView(account, yearRec);
    else if (tab === 'program') inner = renderOfficialProgramView(account, yearRec);
    else if (tab === 'studio') inner = renderStudioView(account, yearRec);

    return (
      '<div class="page-header">' +
      '<div><h1>Matières &amp; Révisions (' + esc(yearRec.levelId) + ')</h1></div>' +
      '<div class="subtab-bar" role="tablist" aria-label="Outils par matière">' +
      tabs.map(function (t) {
        return (
          '<button type="button" role="tab" class="subtab-btn' + (tab === t.id ? ' is-active' : '') + '" data-hub-tab="' + t.id + '" aria-selected="' + (tab === t.id) + '">' +
          Icons.icon(t.icon, 15) + '<span>' + t.label + '</span></button>'
        );
      }).join('') +
      '</div></div>' +
      '<div class="hub-inner">' + inner + '</div>'
    );
  }

  // ===========================
  // NEW SIGNATURE VIEW: MON ARDOISE (PRISE DE NOTES + COURS ANIMÉS À LA CRAIE)
  // ===========================
  function renderArdoiseView(account, yearRec) {
    const subjects = Curr.getSubjectsForLevel(yearRec.levelId);
    const archived = isViewingArchivedYear(account, yearRec);
    const isAnim = state.ardoiseTab === 'animated';

    return (
      '<div class="view-header">' +
      '<div>' +
      '<h1>mon ardoise — notes &amp; cours animés (' + esc(yearRec.levelId) + ')</h1>' +
      '<p>Dessine à la craie, enregistre tes notes de cours ou lance une leçon animée étape par étape sur tableau noir.</p>' +
      '</div>' +
      '<div class="row-actions">' +
      '<button type="button" class="btn ' + (!isAnim ? 'btn-primary' : 'btn-secondary') + '" data-ardoise-tab="notes">' + Icons.icon('chalkboard', 17) + '<span>Prise de notes &amp; Brouillon</span></button>' +
      '<button type="button" class="btn ' + (isAnim ? 'btn-accent' : 'btn-secondary') + '" data-ardoise-tab="animated">' + Icons.icon('play', 17) + '<span>Cours animés sur ardoise</span></button>' +
      '</div></div>' +
      (isAnim ? renderArdoiseAnimatedTab(yearRec) : renderArdoiseNotesTab(account, yearRec, subjects, archived))
    );
  }

  function renderArdoiseNotesTab(account, yearRec, subjects, archived) {
    const notes = (yearRec.notes || []).filter(function (n) {
      return state.ardoiseFilterSubject === 'all' || n.subjectId === state.ardoiseFilterSubject;
    });
    const subjectOptions = subjects.map(function (s) {
      return '<option value="' + s.id + '"' + (state.ardoiseNoteSubject === s.id ? ' selected' : '') + '>' + esc(s.name) + '</option>';
    }).join('');
    const filterPills =
      '<button type="button" class="filter-pill' + (state.ardoiseFilterSubject === 'all' ? ' is-active' : '') + '" data-note-subj="all">Toutes (' + (yearRec.notes || []).length + ')</button>' +
      subjects.map(function (s) {
        return '<button type="button" class="filter-pill' + (state.ardoiseFilterSubject === s.id ? ' is-active' : '') + '" data-note-subj="' + s.id + '">' + esc(s.short) + '</button>';
      }).join('');

    const swatches = Board.CHALK_COLORS.map(function (c) {
      const active = state.ardoiseTool === 'chalk' && state.ardoiseColor === c.hex;
      return '<button type="button" class="chalk-swatch' + (active ? ' is-active' : '') + '" data-chalk-color="' + c.hex + '" style="background:' + c.hex + '" aria-label="' + esc(c.label) + '" title="' + esc(c.label) + '"></button>';
    }).join('');

    return (
      '<div class="dash-top-grid">' +
      '<section class="panel" style="padding:18px">' +
      '<div class="panel-header" style="margin-bottom:12px">' +
      '<h2>Ardoise interactive à la craie</h2>' +
      '<div class="row-actions">' +
      '<button type="button" class="btn btn-sm ' + (state.ardoiseBg === 'plain' ? 'btn-primary' : 'btn-secondary') + '" data-slate-bg="plain">Uni</button>' +
      '<button type="button" class="btn btn-sm ' + (state.ardoiseBg === 'grid' ? 'btn-primary' : 'btn-secondary') + '" data-slate-bg="grid">Quadrillé</button>' +
      '<button type="button" class="btn btn-sm ' + (state.ardoiseBg === 'lined' ? 'btn-primary' : 'btn-secondary') + '" data-slate-bg="lined">Cahier</button>' +
      '</div></div>' +
      '<div class="slate-board bg-' + esc(state.ardoiseBg) + '" id="ardoise-board-wrap">' +
      '<canvas id="ardoise-canvas" class="slate-canvas" aria-label="Surface de dessin ardoise"></canvas>' +
      '<div class="slate-board-tray">' +
      '<div class="chalk-swatches">' + swatches +
      '<button type="button" class="btn btn-sm ' + (state.ardoiseTool === 'eraser' ? 'btn-accent' : 'btn-secondary') + '" id="btn-chalk-eraser" title="Gomme">' + Icons.icon('eraser', 15) + '<span>Gomme</span></button>' +
      '</div>' +
      '<div class="row-actions">' +
      '<button type="button" class="btn btn-sm ' + (state.ardoiseSize === 2.5 ? 'btn-primary' : 'btn-ghost') + '" data-chalk-size="2.5">Fin</button>' +
      '<button type="button" class="btn btn-sm ' + (state.ardoiseSize === 4 ? 'btn-primary' : 'btn-ghost') + '" data-chalk-size="4">Moyen</button>' +
      '<button type="button" class="btn btn-sm ' + (state.ardoiseSize === 7 ? 'btn-primary' : 'btn-ghost') + '" data-chalk-size="7">Épais</button>' +
      '<button type="button" class="btn btn-secondary btn-sm" id="btn-chalk-undo" title="Annuler">' + Icons.icon('undo', 15) + '</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="btn-chalk-clear" title="Tout effacer">Effacer</button>' +
      '<button type="button" class="btn btn-secondary btn-sm" id="btn-chalk-download" title="Télécharger PNG">' + Icons.icon('download', 15) + '<span>PNG</span></button>' +
      '</div></div></div>' +
      '</section>' +
      '<section class="panel">' +
      '<h2 style="margin-bottom:14px">Bloc-notes de cours</h2>' +
      (archived
        ? '<p class="muted-text">Année archivée en consultation seule.</p>'
        : '<form id="ardoise-note-form" class="auth-form">' +
          '<div class="field"><label for="note-subj">Matière</label><select class="select" id="note-subj" name="subjectId">' + subjectOptions + '</select></div>' +
          '<div class="field"><label for="note-title">Titre de la note / leçon</label><input class="input" id="note-title" name="title" value="' + esc(state.ardoiseNoteTitle) + '" placeholder="ex. Formules d’aires, Verbes irréguliers…" required></div>' +
          '<div class="field"><label for="note-text">Mes notes, formules ou résumé</label><textarea class="textarea" id="note-text" name="content" rows="6" placeholder="Écris ici tes définitions, étapes de calcul ou points à retenir…">' + esc(state.ardoiseNoteText) + '</textarea></div>' +
          '<label style="display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;cursor:pointer"><input type="checkbox" id="note-include-sketch" name="includeSketch" checked style="width:18px;height:18px"><span>Joindre mon dessin d’ardoise actuel</span></label>' +
          '<button type="submit" class="btn btn-primary">' + Icons.icon('check', 17) + '<span>Enregistrer dans mes notes</span></button>' +
          '</form>') +
      '</section>' +
      '</div>' +
      '<section class="panel">' +
      '<div class="panel-header"><h2>Mes notes &amp; ardoises enregistrées (' + esc(yearRec.yearId) + ')</h2></div>' +
      '<div class="filter-bar" style="margin-bottom:16px">' + filterPills + '</div>' +
      (notes.length === 0
        ? '<p class="muted-text">Aucune note enregistrée pour l’instant. Dessine un schéma sur l’ardoise ou rédige une fiche ci-dessus puis clique sur <strong>Enregistrer</strong>.</p>'
        : '<div class="notes-grid">' + notes.map(function (n) {
            return (
              '<article class="note-card">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px">' +
              subjectBadgeHTML(n.subjectId) +
              '<span class="muted-text tabular" style="font-size:12px">' + esc(SY.formatShortDateFR(n.updatedAt)) + '</span>' +
              '</div>' +
              '<h3>' + esc(n.title) + '</h3>' +
              (n.sketchRef ? '<img class="note-sketch-thumb" data-photo-ref="' + esc(n.sketchRef) + '" alt="Croquis d’ardoise" style="display:none">' : '') +
              (n.content ? '<p class="muted-text" style="white-space:pre-wrap;font-size:14px">' + esc(n.content) + '</p>' : '') +
              '<div class="row-actions" style="margin-top:auto">' +
              (n.sketchRef ? '<button type="button" class="btn btn-secondary btn-sm" data-load-sketch="' + esc(n.sketchRef) + '">Recharger</button>' : '') +
              (!archived ? '<button type="button" class="btn btn-ghost btn-sm" data-delete-note="' + esc(n.id) + '">' + Icons.icon('trash', 15) + '<span>Supprimer</span></button>' : '') +
              '</div></article>'
            );
          }).join('') + '</div>') +
      '</section>'
    );
  }

  function renderArdoiseAnimatedTab(yearRec) {
    const pack = Board.getLessonsForLevel(yearRec.levelId);
    const sheets = getAllMethodSheetsForYear(yearRec, 'all');
    if (!state.activeAnimLesson) {
      state.activeAnimLesson = pack.all[0] || Board.ANIMATED_LESSONS[0];
      state.animStepIndex = 0;
    }
    const lesson = state.activeAnimLesson;
    const totalSteps = lesson.steps.length;
    const stepIdx = Math.max(0, Math.min(totalSteps - 1, state.animStepIndex));
    const currentStep = lesson.steps[stepIdx];

    const visibleBlocks = [];
    for (let i = 0; i <= stepIdx; i++) {
      const st = lesson.steps[i];
      (st.chalk || []).forEach(function (blk) {
        const colorCls = 'chalk-c-' + (blk.color || 'white');
        if (blk.kind === 'heading') {
          visibleBlocks.push('<div class="chalk-line chalk-heading ' + colorCls + '">' + esc(blk.text) + '</div>');
        } else if (blk.kind === 'equation') {
          visibleBlocks.push('<div class="chalk-line chalk-equation ' + colorCls + '">' + esc(blk.text) + '</div>');
        } else if (blk.kind === 'highlight') {
          visibleBlocks.push('<div class="chalk-line chalk-highlight ' + colorCls + '">' + esc(blk.text) + '</div>');
        } else if (blk.kind === 'diagram' && blk.svg) {
          visibleBlocks.push('<div class="chalk-line">' + blk.svg + '</div>');
        } else {
          visibleBlocks.push('<div class="chalk-line chalk-note ' + colorCls + '">' + esc(blk.text) + '</div>');
        }
      });
    }

    const lessonListHTML = pack.all.map(function (l) {
      const isRec = l.levels.indexOf(yearRec.levelId) !== -1;
      const isSel = lesson.id === l.id;
      return (
        '<button type="button" class="list-entry' + (isSel ? ' is-selected' : '') + '" data-select-anim-lesson="' + esc(l.id) + '">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%">' +
        subjectBadgeHTML(l.subjectId) +
        '<span class="badge ' + (isRec ? 'badge-teal' : 'badge-neutral') + '">' + (isRec ? 'Conseillé ' + esc(yearRec.levelId) : esc(l.levels.join('·'))) + '</span>' +
        '</div><strong>' + esc(l.title) + '</strong><span class="muted-text">' + esc(l.duration) + '</span></button>'
      );
    }).join('');

    const sheetButtons = sheets.slice(0, 6).map(function (sh) {
      return '<button type="button" class="filter-pill" data-animate-sheet="' + esc(sh.id) + '">' + Icons.icon('play', 13) + '<span>' + esc(sh.title) + '</span></button>';
    }).join('');

    return (
      '<div class="two-col-split">' +
      '<div style="display:flex;flex-direction:column;gap:14px">' +
      '<div class="item-list">' + lessonListHTML + '</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:18px">' +
      '<section class="slate-board bg-plain">' +
      '<div class="slate-board-tray" style="border-top:none;border-bottom:1px solid #334155">' +
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      subjectBadgeHTML(lesson.subjectId) +
      '<strong style="font-family:var(--font-display);font-size:1.05rem">' + esc(lesson.title) + '</strong>' +
      '</div>' +
      '<span class="badge badge-teal tabular">Étape ' + (stepIdx + 1) + ' / ' + totalSteps + '</span>' +
      '</div>' +
      '<div class="slate-stage" aria-live="polite">' + visibleBlocks.join('') + '</div>' +
      '<div class="slate-caption-bar">' +
      '<span style="flex:1;min-width:220px">' + esc(currentStep.caption) + '</span>' +
      '<div class="row-actions">' +
      '<button type="button" class="btn btn-secondary btn-sm" id="btn-anim-prev"' + (stepIdx === 0 ? ' disabled' : '') + '>' + Icons.icon('skipBack', 15) + '<span>Préc.</span></button>' +
      '<button type="button" class="btn ' + (state.animPlaying ? 'btn-accent' : 'btn-primary') + ' btn-sm" id="btn-anim-play">' + Icons.icon(state.animPlaying ? 'pause' : 'play', 15) + '<span>' + (state.animPlaying ? 'Pause' : (stepIdx >= totalSteps - 1 ? 'Rejouer' : 'Lire')) + '</span></button>' +
      '<button type="button" class="btn btn-secondary btn-sm" id="btn-anim-next"' + (stepIdx >= totalSteps - 1 ? ' disabled' : '') + '><span>Suiv.</span>' + Icons.icon('skipForward', 15) + '</button>' +
      '</div></div>' +
      '</section>' +
      (sheets.length > 0
        ? '<section class="panel"><h3 style="margin-bottom:10px">Animer tes fiches de méthode ' + esc(yearRec.levelId) + ' sur l’ardoise</h3><div class="filter-bar">' + sheetButtons + '</div></section>'
        : '') +
      '</div></div>'
    );
  }

  // ===========================
  // NEW VIEW: CHALLENGE CLASSE & ÉTABLISSEMENT (FIREBASE + ANNUAIRE UAI)
  // ===========================
  function renderChallengeView(account, yearRec) {
    const cloudStatus = Cloud.getStatus();
    const myScore = Cloud.computeChallengeScore(yearRec, state.infiniteStreak);
    const ch = account.challenge || null;
    const showSetup = !ch || state.challengeSwitching;

    const statusBar = cloudStatus.configured && !account.isDemo
      ? '<span class="badge badge-success">' + Icons.icon('checkCircle', 14) + '<span>Synchronisé</span></span>' +
        '<button type="button" class="btn btn-primary btn-sm" id="btn-cloud-sync-now"' + (state.cloudSyncing ? ' disabled' : '') + '>' + Icons.icon('refresh', 15) + '<span>' + (state.cloudSyncing ? 'Synchronisation…' : 'Actualiser mes points') + '</span></button>'
      : '<span class="badge badge-neutral">Mode démonstration local</span>';

    const pointsStrip =
      '<section class="panel" style="border-color:var(--color-primary)">' +
      '<div class="panel-header" style="margin-bottom:10px">' +
      '<div><h2>Mon compteur Challenge — <span class="tabular" style="color:var(--color-primary-ink)">' + myScore.points + ' points</span></h2></div>' +
      '<span class="badge badge-teal tabular">' + myScore.exercisesCount + ' exos · ' + myScore.quizzesCount + ' quiz · ' + myScore.homeworksDone + ' devoirs · ' + myScore.attendusDone + ' attendus</span>' +
      '</div>' +
      '<div class="row-actions" style="gap:10px">' +
      '<span class="badge badge-neutral">+10 pts / exercice</span>' +
      '<span class="badge badge-neutral">+25 à +40 pts / quiz réussi</span>' +
      '<span class="badge badge-neutral">+5 pts / devoir coché</span>' +
      '<span class="badge badge-neutral">+10 pts / attendu Éduscol</span>' +
      '<span class="badge badge-neutral">+15 pts / série infinie</span>' +
      '</div>' +
      (state.cloudError ? '<div class="form-error" style="margin-top:12px">' + Icons.icon('alertCircle', 16) + '<span>' + esc(state.cloudError) + '</span></div>' : '') +
      '</section>';

    if (showSetup) {
      const selSchool = state.challengeSelectedSchool;
      const schoolResultsHTML = state.challengeSearching
        ? '<p class="muted-text" style="margin-top:10px">Recherche dans l’annuaire officiel data.education.gouv.fr…</p>'
        : state.challengeSearchError
          ? '<div class="form-error" style="margin-top:10px">' + Icons.icon('alertCircle', 16) + '<span>' + esc(state.challengeSearchError) + '</span></div>'
          : state.challengeSchools.length > 0
            ? '<div class="school-result-list">' + state.challengeSchools.map(function (sc) {
                const isSel = selSchool && selSchool.uai === sc.uai;
                return (
                  '<button type="button" class="school-result-item' + (isSel ? ' is-selected' : '') + '" data-pick-school="' + esc(sc.uai) + '">' +
                  '<div><strong>' + esc(sc.name) + '</strong><div class="muted-text">' + esc(sc.type) + ' (' + esc(sc.statut) + ') · ' + esc(sc.postalCode) + ' ' + esc(sc.city) + '</div></div>' +
                  '<span class="attendu-code">' + esc(sc.uai) + '</span>' +
                  '</button>'
                );
              }).join('') + '</div>'
            : (state.challengeSearchQuery
                ? '<p class="muted-text" style="margin-top:10px">Aucun établissement trouvé pour « ' + esc(state.challengeSearchQuery) + ' ». Essaie un nom de ville (ex. Nice, Lyon) ou un code postal (ex. 75015).</p>'
                : '<p class="muted-text" style="margin-top:10px">57 500+ écoles et collèges officiels (France métropolitaine &amp; DROM) avec leur code UAI officiel.</p>');

      return (
        '<div class="view-header">' +
        '<div><h1>challenge classe &amp; établissement</h1><p>Sélectionne ton école ou collège dans l’annuaire officiel, puis crée ou rejoins ta classe avec un simple pseudo (respect RGPD).</p></div>' +
        '<div class="row-actions">' + statusBar +
        (ch ? '<button type="button" class="btn btn-ghost btn-sm" id="btn-cancel-switch-class">Annuler</button>' : '') +
        '</div></div>' +
        pointsStrip +
        '<div class="dash-top-grid">' +
        '<section class="panel">' +
        '<div class="panel-header"><h2>1. Trouver ton école ou collège</h2><span class="badge badge-info">' + Icons.icon('building', 14) + ' Annuaire UAI</span></div>' +
        '<form id="school-search-form" class="row-actions" style="flex-wrap:nowrap">' +
        '<input class="input" id="school-search-input" name="query" value="' + esc(state.challengeSearchQuery) + '" placeholder="Ville, code postal, nom d’école ou UAI (ex. Nice, 69003…)" required>' +
        '<button type="submit" class="btn btn-primary" style="flex-shrink:0">' + Icons.icon('search', 17) + '<span>Rechercher</span></button>' +
        '</form>' +
        schoolResultsHTML +
        (selSchool
          ? '<hr style="border:none;border-top:1px solid var(--color-border);margin:20px 0">' +
            '<h3 style="margin-bottom:12px">Créer une classe dans : ' + esc(selSchool.name) + '</h3>' +
            '<form id="create-class-form" class="auth-form">' +
            '<div class="form-grid-2">' +
            '<div class="field"><label for="ch-pseudo">Ton pseudo affiché (RGPD)</label><input class="input" id="ch-pseudo" name="pseudo" minlength="2" maxlength="24" value="' + esc(account.displayName) + '" placeholder="ex. Léa P." required></div>' +
            '<div class="field"><label for="ch-classname">Nom de la classe</label><input class="input" id="ch-classname" name="className" minlength="2" maxlength="40" value="' + esc(yearRec.levelId + '-A') + '" placeholder="ex. CM2-A ou 5e B" required></div>' +
            '</div>' +
            '<div class="field"><label for="ch-goal">Objectif collectif de la classe (points / semaine)</label><input class="input" id="ch-goal" name="weeklyGoal" type="number" min="100" max="50000" step="50" value="600" required></div>' +
            '<button type="submit" class="btn btn-accent">' + Icons.icon('sparkles', 17) + '<span>Créer la classe &amp; générer le code d’invitation</span></button>' +
            '</form>'
          : '') +
        '</section>' +
        '<section class="panel">' +
        '<div class="panel-header"><h2>2. Rejoindre avec un code classe</h2><span class="badge badge-neutral">Code 6–8 car.</span></div>' +
        '<p class="muted-text" style="margin-bottom:14px">Un camarade ou un professeur a déjà créé la classe ? Saisis le code d’invitation ci-dessous.</p>' +
        '<form id="join-class-form" class="auth-form">' +
        '<div class="field"><label for="join-pseudo">Ton pseudo affiché (RGPD)</label><input class="input" id="join-pseudo" name="pseudo" minlength="2" maxlength="24" value="' + esc(account.displayName) + '" required></div>' +
        '<div class="field"><label for="join-code">Code d’invitation</label><input class="input" id="join-code" name="inviteCode" minlength="4" maxlength="12" placeholder="ex. CM27K4P" style="text-transform:uppercase" required></div>' +
        '<button type="submit" class="btn btn-primary">' + Icons.icon('users', 17) + '<span>Rejoindre la classe</span></button>' +
        '</form>' +
        '<hr style="border:none;border-top:1px solid var(--color-border);margin:20px 0">' +
        '<div class="method-callout"><strong>Confidentialité élèves (RGPD) :</strong> seul ton prénom ou pseudo choisi apparaît dans le classement de ta classe. Aucun nom de famille ni email n’est partagé.</div>' +
        (!cloudStatus.configured
          ? '<div class="method-callout" style="margin-top:12px"><strong>Sans Firebase configuré :</strong> tu peux déjà chercher ton vrai établissement UAI et tester le classement en aperçu local. Connecte ton projet Firebase gratuit (plan Spark) dans <strong>Compte &amp; Réglages</strong> pour activer le temps réel multi-élèves.</div>'
          : '') +
        '</section>' +
        '</div>'
      );
    }

    // Active Challenge View (Student has joined a class)
    const isCloudMode = cloudStatus.configured;
    const members = isCloudMode
      ? (state.challengeLeaderboard || [])
      : Cloud.buildLocalPreviewLeaderboard(account, yearRec, ch, state.infiniteStreak);

    const totalClassPoints = members.reduce(function (sum, m) { return sum + (m.points || 0); }, 0);
    const goalPts = ch.weeklyGoalPoints || 600;
    const goalPct = Math.min(100, Math.round((totalClassPoints / goalPts) * 100));

    const schoolBoard = isCloudMode
      ? (state.challengeSchoolBoard || [])
      : [
          { classId: ch.classId, className: ch.className, levelId: yearRec.levelId, memberCount: members.length, totalPoints: totalClassPoints, isMine: true },
          { classId: 'demo_cls_2', className: yearRec.levelId + '-B (aperçu)', levelId: yearRec.levelId, memberCount: 4, totalPoints: Math.max(480, totalClassPoints + 75), isDemo: true },
          { classId: 'demo_cls_3', className: yearRec.levelId + '-C (aperçu)', levelId: yearRec.levelId, memberCount: 4, totalPoints: Math.max(320, totalClassPoints - 60), isDemo: true }
        ].sort(function (a, b) { return b.totalPoints - a.totalPoints; });

    return (
      '<div class="view-header">' +
      '<div><h1>challenge — ' + esc(ch.className) + '</h1><p>' + esc(ch.schoolName) + ' · ' + esc(ch.postalCode || '') + ' ' + esc(ch.city || '') + ' · Pseudo : <strong>' + esc(ch.pseudo) + '</strong></p></div>' +
      '<div class="row-actions">' + statusBar + '</div>' +
      '</div>' +
      pointsStrip +
      '<section class="panel">' +
      '<div class="panel-header">' +
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span class="attendu-code">UAI ' + esc(ch.uai) + '</span>' +
      '<strong>' + esc(ch.schoolName) + '</strong>' +
      '<span class="badge badge-info">' + esc(ch.className) + ' · ' + esc(yearRec.yearId) + '</span>' +
      '</div>' +
      '<div class="row-actions">' +
      '<span class="invite-code-box" title="Code à partager à ta classe">' + esc(ch.inviteCode) + '</span>' +
      '<button type="button" class="btn btn-secondary btn-sm" id="btn-copy-invite">' + Icons.icon('copy', 15) + '<span>Copier le code</span></button>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="btn-switch-class">Changer</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="btn-leave-class">Quitter</button>' +
      '</div></div>' +
      '<div class="subject-bar-meta"><span>Objectif collectif de la classe : <strong>' + totalClassPoints + ' / ' + goalPts + ' pts</strong></span><span class="tabular">' + goalPct + '%</span></div>' +
      '<div class="progress-track"><div class="progress-fill" style="width:' + Math.max(4, goalPct) + '%;background:' + (goalPct >= 100 ? 'var(--color-success)' : 'var(--color-primary)') + '"></div></div>' +
      '</section>' +
      '<div class="dash-top-grid">' +
      '<section class="panel">' +
      '<div class="panel-header">' +
      '<h2>Classement de la classe (' + esc(ch.className) + ')</h2>' +
      (isCloudMode
        ? '<button type="button" class="btn btn-secondary btn-sm" id="btn-refresh-lb">' + Icons.icon('refresh', 14) + '<span>Actualiser</span></button>'
        : '<span class="badge badge-amber">Aperçu local (données démo)</span>') +
      '</div>' +
      (isCloudMode && state.challengeLoading
        ? '<p class="muted-text">Chargement du classement en direct depuis Firestore…</p>'
        : members.length === 0
          ? '<p class="muted-text">Aucun membre synchronisé pour l’instant. Clique sur <strong>Synchroniser mes points</strong> ci-dessus pour apparaître en tête !</p>'
          : '<div class="lb-list">' + members.map(function (m, idx) {
              const rank = idx + 1;
              const isMe = m.isMe || (cloudStatus.uid && m.uid === cloudStatus.uid);
              const rankCls = rank <= 3 ? ' rank-' + rank : '';
              return (
                '<div class="lb-row' + (isMe ? ' is-me' : '') + '">' +
                '<span class="lb-rank' + rankCls + '">' + rank + '</span>' +
                '<div style="display:flex;align-items:center;gap:10px;min-width:0">' +
                '<span class="avatar-dot" style="width:32px;height:32px;font-size:13px;background:' + esc(m.avatarColor || '#0284C7') + '">' + esc(String(m.pseudo || '?').charAt(0).toUpperCase()) + '</span>' +
                '<div style="min-width:0"><div style="font-weight:800">' + esc(m.pseudo) + (isMe ? ' <span class="badge badge-teal" style="margin-left:6px">Toi</span>' : '') + (m.isDemoPeer ? ' <span class="badge badge-neutral" style="margin-left:4px">Démo</span>' : '') + '</div>' +
                '<div class="muted-text">' + (m.exercisesCount || 0) + ' exos · ' + (m.quizzesCount || 0) + ' quiz' + (m.avgOn20 != null ? ' · moy. ' + String(m.avgOn20).replace('.', ',') + '/20' : '') + '</div></div>' +
                '</div>' +
                '<strong class="tabular" style="font-family:var(--font-display);font-size:1.15rem">' + (m.points || 0) + ' pts</strong>' +
                '</div>'
              );
            }).join('') + '</div>') +
      '</section>' +
      '<section class="panel">' +
      '<div class="panel-header">' +
      '<h2>Challenge établissement (UAI)</h2>' +
      '<span class="badge badge-neutral">' + esc(ch.uai) + '</span>' +
      '</div>' +
      '<p class="muted-text" style="margin-bottom:14px">Cumul des points de toutes les classes inscrites dans <strong>' + esc(ch.schoolName) + '</strong>.</p>' +
      (schoolBoard.length === 0
        ? '<p class="muted-text">Aucune autre classe enregistrée dans cet établissement pour le moment.</p>'
        : '<div class="lb-list">' + schoolBoard.map(function (cls, idx) {
            const rank = idx + 1;
            const isMine = cls.classId === ch.classId || cls.isMine;
            const rankCls = rank <= 3 ? ' rank-' + rank : '';
            return (
              '<div class="lb-row' + (isMine ? ' is-me' : '') + '">' +
              '<span class="lb-rank' + rankCls + '">' + rank + '</span>' +
              '<div><div style="font-weight:800">' + esc(cls.className) + (isMine ? ' <span class="badge badge-teal" style="margin-left:6px">Ta classe</span>' : '') + '</div>' +
              '<div class="muted-text">' + esc(cls.levelId) + ' · ' + (cls.memberCount || 0) + ' élève' + ((cls.memberCount || 0) > 1 ? 's' : '') + '</div></div>' +
              '<strong class="tabular" style="font-family:var(--font-display);font-size:1.1rem">' + (cls.totalPoints || 0) + ' pts</strong>' +
              '</div>'
            );
          }).join('') + '</div>') +
      '</section>' +
      '</div>'
    );
  }

  // ===========================
  // NEW VIEW: OFFICIAL PROGRAM (ÉDUSCOL + LIVE DATA.EDUCATION.GOUV.FR API)
  // ===========================
  function renderOfficialProgramView(account, yearRec) {
    const cycleMeta = Prog.getCycleMeta(yearRec.levelId);
    const subjects = Curr.getSubjectsForLevel(yearRec.levelId);
    const attendus = Prog.getAttendusForLevel(yearRec.levelId, state.programFilterSubject);
    const doneCodes = yearRec.completedAttenduCodes || [];
    const apiSlot = state.officialApiState[yearRec.levelId] || { loading: false, data: Prog.loadCachedTexts(yearRec.levelId) };

    const subjPills =
      '<button type="button" class="filter-pill' + (state.programFilterSubject === 'all' ? ' is-active' : '') + '" data-prog-subj="all">Toutes les matières</button>' +
      subjects.map(function (s) {
        return '<button type="button" class="filter-pill' + (state.programFilterSubject === s.id ? ' is-active' : '') + '" data-prog-subj="' + s.id + '">' + esc(s.short) + '</button>';
      }).join('');

    const checkedCount = attendus.filter(function (a) { return doneCodes.indexOf(a.code) !== -1; }).length;
    const pct = attendus.length ? Math.round((checkedCount / attendus.length) * 100) : 0;

    let apiStatusBadge = '<span class="badge badge-neutral">Non synchronisé</span>';
    if (apiSlot.loading) apiStatusBadge = '<span class="badge badge-amber">Synchronisation avec data.education.gouv.fr…</span>';
    else if (apiSlot.data && apiSlot.data.source === 'live-api') apiStatusBadge = '<span class="badge badge-success">Synchronisé en direct · data.education.gouv.fr</span>';
    else if (apiSlot.data && apiSlot.data.source === 'cache') apiStatusBadge = '<span class="badge badge-info">Cache local Éducation nationale</span>';
    else if (apiSlot.data && apiSlot.data.source === 'offline-fallback') apiStatusBadge = '<span class="badge badge-warning">Mode hors-ligne (référentiel local Éduscol)</span>';

    const records = (apiSlot.data && apiSlot.data.records) ? apiSlot.data.records : [];

    return (
      '<div class="view-header">' +
      '<div>' +
      '<h1>programme officiel — ' + esc(yearRec.levelId) + ' (' + esc(cycleMeta.cycle) + ')</h1>' +
      '<p>' + esc(cycleMeta.label) + ' · Attendus de fin d’année Éduscol et textes officiels synchronisés depuis l’Open Data du Ministère de l’Éducation nationale.</p>' +
      '</div>' +
      '<div class="row-actions">' +
      '<button type="button" class="btn btn-primary btn-sm" id="btn-sync-edunat">' + Icons.icon('history', 16) + '<span>Actualiser via data.education.gouv.fr</span></button>' +
      '<a class="btn btn-secondary btn-sm" href="' + esc(cycleMeta.eduscolUrl) + '" target="_blank" rel="noopener noreferrer">Portail Éduscol ↗</a>' +
      '</div>' +
      '</div>' +
      '<div class="filter-bar">' + subjPills + '</div>' +
      '<div class="dash-top-grid">' +
      '<section class="panel">' +
      '<div class="panel-header">' +
      '<h2>Attendus de fin d’année (' + esc(yearRec.levelId) + ')</h2>' +
      '<span class="badge badge-teal tabular">' + checkedCount + '/' + attendus.length + ' cochés (' + pct + '%)</span>' +
      '</div>' +
      '<div class="progress-track" style="margin-bottom:20px"><div class="progress-fill" style="width:' + pct + '%;background:var(--color-primary)"></div></div>' +
      '<div class="hw-list">' +
      attendus.map(function (att) {
        const isDone = doneCodes.indexOf(att.code) !== -1;
        return (
          '<div class="hw-item' + (isDone ? ' is-done' : '') + '">' +
          '<button type="button" class="hw-check' + (isDone ? ' is-done' : '') + '" data-toggle-attendu="' + esc(att.code) + '" aria-label="Marquer cet attendu comme maîtrisé">' +
          (isDone ? Icons.icon('check', 15) : '') +
          '</button>' +
          '<div class="hw-body">' +
          '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
          '<span class="attendu-code">' + esc(att.code) + '</span>' +
          subjectBadgeHTML(att.subjectId) +
          '</div>' +
          '<div class="hw-title" style="margin-top:6px">' + esc(att.title) + '</div>' +
          '<p class="muted-text" style="margin-top:4px">' + esc(att.detail) + '</p>' +
          '</div>' +
          '<div class="row-actions">' +
          '<button type="button" class="btn btn-secondary btn-sm" data-goto-subject-ex="' + esc(att.subjectId) + '">Exos</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-goto-subject-quiz="' + esc(att.subjectId) + '">Quiz</button>' +
          '</div>' +
          '</div>'
        );
      }).join('') +
      '</div>' +
      '</section>' +
      '<section class="panel">' +
      '<div class="panel-header">' +
      '<h2>Textes officiels (BOEN)</h2>' +
      apiStatusBadge +
      '</div>' +
      '<p class="muted-text" style="margin-bottom:16px">Source Open Data : <code>' + esc(cycleMeta.dataset) + '</code></p>' +
      (records.length === 0
        ? '<p class="muted-text">Chargement des textes officiels en cours…</p>'
        : '<div class="hw-list">' +
          records.slice(0, 8).map(function (r) {
            return (
              '<div class="hw-item">' +
              '<div class="hw-body">' +
              '<div class="hw-title" style="font-size:15px">' + esc(r.descriptif) + '</div>' +
              '<div class="hw-meta">' +
              '<span class="badge badge-neutral">' + esc(r.discipline) + '</span>' +
              (r.entreeVigueur ? '<span class="tabular">Rentrée ' + esc(r.entreeVigueur) + '</span>' : '') +
              (r.abroge ? '<span class="badge badge-warning">Modifié rentrée ' + esc(r.abroge) + '</span>' : '<span class="badge badge-success">En vigueur</span>') +
              '</div>' +
              (r.texteOfficiel ? '<p class="muted-text" style="margin-top:4px">' + esc(r.texteOfficiel) + '</p>' : '') +
              '</div>' +
              '<a class="btn btn-secondary btn-sm" href="' + esc(r.pdfUrl) + '" target="_blank" rel="noopener noreferrer">PDF / BO ↗</a>' +
              '</div>'
            );
          }).join('') +
          '</div>') +
      '</section>' +
      '</div>'
    );
  }

  // ===========================
  // VIEW 2: HOMEWORK MANAGER
  // ===========================
  function renderHomeworkView(account, yearRec) {
    const subjects = Curr.getSubjectsForLevel(yearRec.levelId);
    const archived = isViewingArchivedYear(account, yearRec);
    const list = (yearRec.homeworks || []).filter(function (hw) {
      if (state.hwFilterSubject !== 'all' && hw.subjectId !== state.hwFilterSubject) return false;
      if (state.hwFilterStatus === 'todo' && hw.done) return false;
      if (state.hwFilterStatus === 'done' && !hw.done) return false;
      return true;
    }).sort(function (a, b) {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999'));
    });

    const subjectOptions = subjects.map(function (s) { return '<option value="' + s.id + '">' + esc(s.name) + '</option>'; }).join('');
    const filterPills =
      '<button type="button" class="filter-pill' + (state.hwFilterSubject === 'all' ? ' is-active' : '') + '" data-hw-subj="all">Toutes</button>' +
      subjects.map(function (s) {
        return '<button type="button" class="filter-pill' + (state.hwFilterSubject === s.id ? ' is-active' : '') + '" data-hw-subj="' + s.id + '">' + esc(s.short) + '</button>';
      }).join('');

    const hwRows =
      list.length === 0
        ? '<p class="muted-text">Aucun devoir pour ce filtre.</p>'
        : '<div class="hw-list">' +
          list.map(function (hw) {
            return (
              '<div class="hw-item' + (hw.done ? ' is-done' : '') + '">' +
              '<button type="button" class="hw-check' + (hw.done ? ' is-done' : '') + '" data-toggle-hw="' + esc(hw.id) + '" aria-label="Basculer terminé">' + (hw.done ? Icons.icon('check', 15) : '') + '</button>' +
              '<div class="hw-body">' +
              '<div class="hw-title">' + esc(hw.title) + '</div>' +
              (hw.notes ? '<p class="muted-text" style="margin-top:4px">' + esc(hw.notes) + '</p>' : '') +
              '<div class="hw-meta">' + subjectBadgeHTML(hw.subjectId) +
              (hw.dueDate ? '<span class="tabular">' + Icons.icon('clock', 13) + ' Pour le ' + esc(SY.formatShortDateFR(hw.dueDate)) + '</span>' : '') +
              (hw.priority === 'haute' ? '<span class="badge badge-danger">Prioritaire</span>' : '') +
              '</div></div>' +
              '<div class="row-actions">' +
              '<button type="button" class="btn btn-secondary btn-sm" data-goto-subject-ex="' + esc(hw.subjectId) + '">Aide &amp; Exos</button>' +
              (!archived ? '<button type="button" class="btn btn-ghost btn-icon" data-delete-hw="' + esc(hw.id) + '" aria-label="Supprimer">' + Icons.icon('trash', 16) + '</button>' : '') +
              '</div></div>'
            );
          }).join('') + '</div>';

    return (
      '<div class="view-header"><div><h1>mes devoirs — ' + esc(yearRec.yearId) + ' (' + esc(yearRec.levelId) + ')</h1><p>Note tes devoirs, coche ce qui est fait et ouvre directement les exercices de la matière.</p></div></div>' +
      '<div class="two-col-split">' +
      '<section class="panel"><h2 style="margin-bottom:16px">Ajouter un devoir</h2>' +
      (archived
        ? '<p class="muted-text">Année archivée en consultation seule.</p>'
        : '<form id="hw-add-form" class="auth-form">' +
          '<div class="field"><label for="hw-subject">Matière</label><select class="select" id="hw-subject" name="subjectId">' + subjectOptions + '</select></div>' +
          '<div class="field"><label for="hw-title">Intitulé du devoir</label><input class="input" id="hw-title" name="title" placeholder="ex. Exercices 4 et 5 p. 62" required></div>' +
          '<div class="form-grid-2">' +
          '<div class="field"><label for="hw-due">Pour le</label><input class="input" id="hw-due" name="dueDate" type="date" value="' + esc(SY.toISODate(Store.getEffectiveNow(state.db))) + '"></div>' +
          '<div class="field"><label for="hw-prio">Priorité</label><select class="select" id="hw-prio" name="priority"><option value="normal">Normale</option><option value="haute">Prioritaire</option></select></div>' +
          '</div>' +
          '<div class="field"><label for="hw-notes">Notes (facultatif)</label><textarea class="textarea" id="hw-notes" name="notes" rows="3" placeholder="ex. Relire la fiche méthode"></textarea></div>' +
          '<button type="submit" class="btn btn-primary">' + Icons.icon('plus', 18) + '<span>Ajouter au cahier</span></button></form>') +
      '</section>' +
      '<section class="panel">' +
      '<div class="panel-header"><div class="filter-bar">' +
      '<button type="button" class="filter-pill' + (state.hwFilterStatus === 'all' ? ' is-active' : '') + '" data-hw-status="all">Tous</button>' +
      '<button type="button" class="filter-pill' + (state.hwFilterStatus === 'todo' ? ' is-active' : '') + '" data-hw-status="todo">À faire</button>' +
      '<button type="button" class="filter-pill' + (state.hwFilterStatus === 'done' ? ' is-active' : '') + '" data-hw-status="done">Terminés</button>' +
      '</div></div>' +
      '<div class="filter-bar" style="margin-bottom:20px">' + filterPills + '</div>' + hwRows +
      '</section></div>'
    );
  }

  // ===========================
  // VIEW 3: INTERACTIVE EXERCISES & METHOD SHEETS
  // ===========================
  function renderExercisesView(account, yearRec) {
    const subjects = Curr.getSubjectsForLevel(yearRec.levelId);
    const exercises = getAllExercisesForYear(yearRec, state.exFilterSubject);
    const sheets = getAllMethodSheetsForYear(yearRec, state.exFilterSubject);
    let activeEx = exercises.find(function (e) { return e.id === state.activeExerciseId; });
    if (!activeEx && exercises.length > 0) { activeEx = exercises[0]; state.activeExerciseId = activeEx.id; }

    const subjPills =
      '<button type="button" class="filter-pill' + (state.exFilterSubject === 'all' ? ' is-active' : '') + '" data-ex-subj="all">Toutes</button>' +
      subjects.map(function (s) {
        return '<button type="button" class="filter-pill' + (state.exFilterSubject === s.id ? ' is-active' : '') + '" data-ex-subj="' + s.id + '">' + esc(s.short) + '</button>';
      }).join('');

    return (
      '<div class="view-header">' +
      '<div><h1>exercices &amp; fiches méthode (' + esc(yearRec.levelId) + ')</h1><p>Entraîne-toi avec des indices progressifs puis retrouve la fiche de méthode à la fin — ou lance le mode Entraînement infini.</p></div>' +
      '<div class="row-actions">' +
      '<button type="button" class="btn ' + (state.exTab === 'practice' ? 'btn-primary' : 'btn-secondary') + '" data-ex-tab="practice">' + Icons.icon('bookOpen', 17) + '<span>Exercices (' + exercises.length + ')</span></button>' +
      '<button type="button" class="btn ' + (state.exTab === 'infinite' ? 'btn-accent' : 'btn-secondary') + '" data-ex-tab="infinite">' + Icons.icon('sparkles', 17) + '<span>Entraînement infini</span></button>' +
      '<button type="button" class="btn ' + (state.exTab === 'sheets' ? 'btn-primary' : 'btn-secondary') + '" data-ex-tab="sheets">' + Icons.icon('fileText', 17) + '<span>Fiches méthode (' + sheets.length + ')</span></button>' +
      '</div></div>' +
      (state.exTab === 'infinite'
        ? renderInfinitePracticeArea(yearRec)
        : '<div class="filter-bar">' + subjPills + '</div>' +
          (state.exTab === 'practice' ? renderExercisePracticeArea(yearRec, exercises, activeEx) : renderMethodSheetsLibrary(yearRec, sheets)))
    );
  }

  function renderInfinitePracticeArea(yearRec) {
    if (!state.infiniteExercise || state.infiniteExercise.levelId !== yearRec.levelId || state.infiniteExercise.subjectId !== state.infiniteSubject) {
      state.infiniteExercise = PracticeGen.generateExercise(yearRec.levelId, state.infiniteSubject);
      resetExState();
    }
    const ex = state.infiniteExercise;
    const hints = ex.hints || [];
    const shownHints = hints.slice(0, state.exState.revealedHints);
    const letters = ['A', 'B', 'C', 'D'];

    return (
      '<div class="filter-bar">' +
      '<button type="button" class="filter-pill' + (state.infiniteSubject === 'maths' ? ' is-active' : '') + '" data-inf-subj="maths">Mathématiques (infini)</button>' +
      '<button type="button" class="filter-pill' + (state.infiniteSubject === 'francais' ? ' is-active' : '') + '" data-inf-subj="francais">Français (infini)</button>' +
      '<button type="button" class="filter-pill' + (state.infiniteSubject === 'anglais' ? ' is-active' : '') + '" data-inf-subj="anglais">Anglais (infini)</button>' +
      '<span class="badge badge-success tabular" style="margin-left:auto">Série réussie : ' + state.infiniteStreak + '</span>' +
      '</div>' +
      '<article class="panel">' +
      '<div class="panel-header"><div class="row-actions">' + subjectBadgeHTML(ex.subjectId) + '<span class="badge badge-amber">' + esc(ex.chapter) + ' · Infini</span></div><div class="row-actions"><button type="button" class="btn btn-secondary btn-sm" id="btn-open-scratchpad">' + Icons.icon('chalkboard', 15) + '<span>Brouillon ardoise</span></button><button type="button" class="btn btn-secondary btn-sm" id="btn-new-inf-ex">Nouvel exercice ↻</button></div></div>' +
      '<h2>' + esc(ex.title) + '</h2>' +
      '<p style="margin-top:12px;font-size:1.1rem;font-weight:700">' + esc(ex.prompt) + '</p>' +
      '<div class="option-stack">' + ex.options.map(function (opt, idx) {
        let cls = 'choice-btn';
        if (state.exState.submitted) {
          if (normalizeAnswer(opt) === normalizeAnswer(ex.answer)) cls += ' is-correct';
          else if (state.exState.selectedOption === opt) cls += ' is-wrong';
        } else if (state.exState.selectedOption === opt) cls += ' is-selected';
        return '<button type="button" class="' + cls + '" data-ex-option="' + esc(opt) + '"' + (state.exState.submitted ? ' disabled' : '') + '><span class="choice-letter">' + (letters[idx] || idx + 1) + '</span><span>' + esc(opt) + '</span></button>';
      }).join('') + '</div>' +
      '<div class="row-actions">' +
      (!state.exState.submitted
        ? '<button type="button" class="btn btn-primary" id="btn-submit-inf-ex">' + Icons.icon('check', 18) + '<span>Vérifier ma réponse</span></button>'
        : '<button type="button" class="btn btn-accent" id="btn-next-inf-ex">Exercice suivant →</button>') +
      (hints.length > 0 && state.exState.revealedHints < hints.length && !state.exState.submitted
        ? '<button type="button" class="btn btn-secondary" id="btn-next-hint">' + Icons.icon('lightbulb', 17) + '<span>Indice (' + (state.exState.revealedHints + 1) + '/' + hints.length + ')</span></button>'
        : '') +
      '</div>' +
      (shownHints.length > 0 ? '<div class="hint-box"><strong>' + Icons.icon('lightbulb', 16) + ' Indices</strong><ul style="margin:8px 0 0;padding-left:18px">' + shownHints.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul></div>' : '') +
      (state.exState.submitted
        ? '<div class="feedback-box ' + (state.exState.isCorrect ? 'is-success' : 'is-error') + '" role="status"><strong>' + (state.exState.isCorrect ? 'Bravo, bonne réponse ! (+1 série)' : 'Réponse attendue : ' + esc(ex.answer)) + '</strong><p style="margin-top:6px">' + esc(ex.explanation) + '</p></div>' +
          (ex.methodSheet ? renderMethodSheetBlock(ex.methodSheet, (yearRec.readMethodSheetIds || []).indexOf(ex.methodSheet.id) !== -1, true) : '')
        : '') +
      '</article>'
    );
  }

  function renderExercisePracticeArea(yearRec, exercises, activeEx) {
    if (exercises.length === 0) {
      return '<section class="panel"><p class="muted-text">Aucun exercice ici pour l’instant.</p><button type="button" class="btn btn-primary" style="margin-top:14px" data-nav="studio">Créer depuis une photo de cours</button></section>';
    }
    const listHTML = exercises.map(function (ex) {
      const done = (yearRec.completedExerciseIds || []).indexOf(ex.id) !== -1;
      const sel = activeEx && activeEx.id === ex.id ? ' is-selected' : '';
      return (
        '<button type="button" class="list-entry' + sel + '" data-select-ex="' + esc(ex.id) + '">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%">' +
        subjectBadgeHTML(ex.subjectId) +
        (done ? '<span class="badge badge-success">' + Icons.icon('check', 13) + ' Réussi</span>' : '<span class="badge badge-neutral">' + esc(ex.difficulty || 'Moyen') + '</span>') +
        '</div><strong>' + esc(ex.title) + '</strong><span class="muted-text">' + esc(ex.chapter || '') + '</span></button>'
      );
    }).join('');

    const hints = activeEx.hints || [];
    const shownHints = hints.slice(0, state.exState.revealedHints);
    let interactionHTML = '';
    if (activeEx.type === 'choice' && Array.isArray(activeEx.options)) {
      const letters = ['A', 'B', 'C', 'D'];
      interactionHTML = '<div class="option-stack" role="radiogroup">' + activeEx.options.map(function (opt, idx) {
        let cls = 'choice-btn';
        if (state.exState.submitted) {
          if (normalizeAnswer(opt) === normalizeAnswer(activeEx.answer)) cls += ' is-correct';
          else if (state.exState.selectedOption === opt) cls += ' is-wrong';
        } else if (state.exState.selectedOption === opt) cls += ' is-selected';
        return '<button type="button" class="' + cls + '" data-ex-option="' + esc(opt) + '"' + (state.exState.submitted ? ' disabled' : '') + '><span class="choice-letter">' + (letters[idx] || idx + 1) + '</span><span>' + esc(opt) + '</span></button>';
      }).join('') + '</div>';
    } else {
      interactionHTML = '<div class="field" style="margin:20px 0"><label for="ex-text-answer">Ta réponse</label><input class="input" id="ex-text-answer" value="' + esc(state.exState.textInput) + '" placeholder="Écris ta réponse ici..."' + (state.exState.submitted ? ' disabled' : '') + '></div>';
    }

    const sheet = activeEx.methodSheet;
    const isSheetRead = sheet && (yearRec.readMethodSheetIds || []).indexOf(sheet.id) !== -1;

    return (
      '<div class="two-col-split">' +
      '<div class="item-list">' + listHTML + '</div>' +
      '<article class="panel">' +
      '<div class="panel-header"><div class="row-actions">' + subjectBadgeHTML(activeEx.subjectId) + '<span class="badge badge-neutral">' + esc(activeEx.chapter || 'Entraînement') + '</span></div><button type="button" class="btn btn-secondary btn-sm" id="btn-open-scratchpad">' + Icons.icon('chalkboard', 15) + '<span>Brouillon ardoise</span></button></div>' +
      '<h2>' + esc(activeEx.title) + '</h2>' +
      '<p style="margin-top:12px;font-size:1.08rem;font-weight:700">' + esc(activeEx.prompt) + '</p>' +
      (activeEx.photoRef ? '<div style="margin-top:14px"><img class="photo-preview-img" data-photo-ref="' + esc(activeEx.photoRef) + '" alt="Photo du cours" style="display:none;max-height:190px"></div>' : '') +
      interactionHTML +
      '<div class="row-actions">' +
      (!state.exState.submitted
        ? '<button type="button" class="btn btn-primary" id="btn-submit-ex">' + Icons.icon('check', 18) + '<span>Vérifier ma réponse</span></button>'
        : '<button type="button" class="btn btn-secondary" id="btn-retry-ex">Refaire l’exercice</button>') +
      (hints.length > 0 && state.exState.revealedHints < hints.length && !state.exState.submitted
        ? '<button type="button" class="btn btn-secondary" id="btn-next-hint">' + Icons.icon('lightbulb', 17) + '<span>Indice (' + (state.exState.revealedHints + 1) + '/' + hints.length + ')</span></button>' : '') +
      '</div>' +
      (shownHints.length > 0 ? '<div class="hint-box"><strong>' + Icons.icon('lightbulb', 16) + ' Indices</strong><ul style="margin:8px 0 0;padding-left:18px">' + shownHints.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul></div>' : '') +
      (state.exState.submitted
        ? '<div class="feedback-box ' + (state.exState.isCorrect ? 'is-success' : 'is-error') + '" role="status" aria-live="polite"><strong>' + (state.exState.isCorrect ? 'Bravo, bonne réponse !' : 'Réponse attendue : ' + esc(activeEx.answer)) + '</strong><p style="margin-top:6px">' + esc(activeEx.explanation) + '</p></div>' +
          (sheet ? renderMethodSheetBlock(sheet, isSheetRead, true) : '')
        : '') +
      '</article></div>'
    );
  }

  function renderMethodSheetBlock(sheet, isRead, showQuizCta) {
    return (
      '<section class="method-sheet">' +
      '<div class="panel-header" style="margin-bottom:0"><div style="display:flex;align-items:center;gap:10px">' + Icons.icon('fileText', 22) + '<h3>Fiche de méthode : ' + esc(sheet.title) + '</h3></div>' +
      '<div class="row-actions"><button type="button" class="btn btn-sm btn-accent" data-animate-sheet="' + esc(sheet.id) + '">' + Icons.icon('play', 14) + '<span>Animer sur l’ardoise</span></button>' +
      '<button type="button" class="btn btn-sm ' + (isRead ? 'btn-secondary' : 'btn-primary') + '" data-mark-sheet="' + esc(sheet.id) + '">' + Icons.icon('check', 15) + '<span>' + (isRead ? 'Fiche révisée' : 'Valider cette fiche') + '</span></button>' +
      '<button type="button" class="btn btn-ghost btn-sm" onclick="window.print()">' + Icons.icon('printer', 15) + '<span>Imprimer</span></button></div></div>' +
      '<div class="method-callout"><strong>L’essentiel :</strong> ' + esc(sheet.essential) + '</div>' +
      '<div><strong>Étapes clés :</strong><ol class="method-sheet-steps" style="margin-top:6px">' + (sheet.steps || []).map(function (st) { return '<li>' + esc(st) + '</li>'; }).join('') + '</ol></div>' +
      '<div class="form-grid-2"><div class="method-callout"><strong>Piège à éviter :</strong> ' + esc(sheet.pitfall) + '</div><div class="method-callout"><strong>Exemple :</strong> ' + esc(sheet.example) + '</div></div>' +
      (sheet.photoRef ? '<div><span class="field-help">Photo du cours jointe :</span><img class="photo-preview-img" style="margin-top:8px;display:none;max-height:220px" data-photo-ref="' + esc(sheet.photoRef) + '" alt="Photo du cours"></div>' : '') +
      (showQuizCta ? '<div class="row-actions"><button type="button" class="btn btn-accent" data-goto-subject-quiz="' + esc(sheet.subjectId) + '">' + Icons.icon('trophy', 17) + '<span>Valider mes acquis avec le quiz</span></button></div>' : '') +
      '</section>'
    );
  }

  function renderMethodSheetsLibrary(yearRec, sheets) {
    if (sheets.length === 0) return '<section class="panel"><p class="muted-text">Aucune fiche méthode pour cette matière.</p></section>';
    return '<div style="display:flex;flex-direction:column;gap:20px">' + sheets.map(function (s) {
      return renderMethodSheetBlock(s, (yearRec.readMethodSheetIds || []).indexOf(s.id) !== -1, true);
    }).join('') + '</div>';
  }

  // ===========================
  // VIEW 4: QUIZZES & SCORES
  // ===========================
  function renderQuizzesView(account, yearRec) {
    if (state.activeQuiz) return renderActiveQuizRunner(yearRec, state.activeQuiz);
    const subjects = Curr.getSubjectsForLevel(yearRec.levelId);
    const quizzes = getAllQuizzesForYear(yearRec, state.quizFilterSubject);
    const subjPills =
      '<button type="button" class="filter-pill' + (state.quizFilterSubject === 'all' ? ' is-active' : '') + '" data-quiz-subj="all">Toutes</button>' +
      subjects.map(function (s) { return '<button type="button" class="filter-pill' + (state.quizFilterSubject === s.id ? ' is-active' : '') + '" data-quiz-subj="' + s.id + '">' + esc(s.short) + '</button>'; }).join('');

    const quizRows = quizzes.map(function (q) {
      const attempts = (yearRec.quizAttempts || []).filter(function (a) { return a.quizId === q.id; });
      const best = attempts.length ? Math.max.apply(null, attempts.map(function (a) { return a.scoreOn20; })) : null;
      return (
        '<div class="subject-row">' +
        '<div class="subject-id-cell">' + subjectBadgeHTML(q.subjectId) + '<div><strong>' + esc(q.title) + '</strong><div class="muted-text">' + esc(q.chapter || '') + ' · ' + q.questions.length + ' questions</div></div></div>' +
        '<div class="tabular">' + (best !== null ? '<span class="badge ' + (best >= 16 ? 'badge-success' : best >= 10 ? 'badge-warning' : 'badge-danger') + '">Meilleur : ' + String(best).replace('.', ',') + '/20</span>' : '<span class="badge badge-neutral">À passer</span>') + '</div>' +
        '<button type="button" class="btn btn-primary btn-sm" data-start-quiz="' + esc(q.id) + '">' + Icons.icon('trophy', 15) + '<span>Lancer le quiz</span></button>' +
        '</div>'
      );
    }).join('');

    const recent = (yearRec.quizAttempts || []).slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); }).slice(0, 8);

    return (
      '<div class="view-header"><div><h1>quiz &amp; validation des acquis (' + esc(yearRec.levelId) + ')</h1><p>Passe un quiz noté sur 20 dans chaque matière — ou lance un Quiz Express de 6 questions renouvelées à l’infini.</p></div></div>' +
      '<section class="panel" style="border-color:var(--color-primary)">' +
      '<div class="panel-header" style="margin-bottom:10px"><h2>Quiz Express Infini — 6 questions neuves notées /20</h2><span class="badge badge-amber">Série aléatoire ' + esc(yearRec.levelId) + '</span></div>' +
      '<p class="muted-text" style="margin-bottom:14px">Chaque clic génère 6 nouvelles questions adaptées au niveau <strong>' + esc(yearRec.levelId) + '</strong> et enregistre la note sur 20 dans ton historique.</p>' +
      '<div class="row-actions">' +
      '<button type="button" class="btn btn-primary btn-sm" data-start-express-quiz="maths">' + Icons.icon('calculator', 15) + '<span>Quiz Maths (6 q.)</span></button>' +
      '<button type="button" class="btn btn-accent btn-sm" data-start-express-quiz="francais">' + Icons.icon('pen', 15) + '<span>Quiz Français (6 q.)</span></button>' +
      '<button type="button" class="btn btn-secondary btn-sm" data-start-express-quiz="anglais">' + Icons.icon('message', 15) + '<span>Quiz Anglais (6 q.)</span></button>' +
      '</div></section>' +
      '<div class="filter-bar">' + subjPills + '</div>' +
      '<section class="panel"><h2 style="margin-bottom:14px">Quiz du programme (' + esc(yearRec.levelId) + ')</h2><div class="subject-rows">' + quizRows + '</div></section>' +
      '<section class="panel"><h2 style="margin-bottom:14px">Dernières notes — ' + esc(yearRec.yearId) + '</h2>' +
      (recent.length === 0 ? '<p class="muted-text">Aucun quiz validé sur cette année.</p>' :
        '<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>Matière</th><th>Quiz</th><th>Score</th><th>Note / 20</th></tr></thead><tbody>' +
        recent.map(function (a) {
          return '<tr><td class="tabular">' + esc(SY.formatShortDateFR(a.date)) + '</td><td>' + subjectBadgeHTML(a.subjectId) + '</td><td>' + esc(a.title) + '</td><td class="tabular">' + a.score + '/' + a.total + ' (' + a.percent + '%)</td><td class="tabular"><strong>' + String(a.scoreOn20).replace('.', ',') + '/20</strong></td></tr>';
        }).join('') + '</tbody></table></div>') +
      '</section>'
    );
  }

  function renderActiveQuizRunner(yearRec, quiz) {
    const run = state.quizRun;
    if (run.finished && run.lastResult) {
      const res = run.lastResult;
      const verdict = res.percent >= 80 ? 'Acquis maîtrisés' : res.percent >= 50 ? 'En bonne voie' : 'À retravailler';
      const tone = res.percent >= 80 ? 'badge-success' : res.percent >= 50 ? 'badge-warning' : 'badge-danger';
      return (
        '<section class="panel">' +
        '<div class="panel-header"><div>' + subjectBadgeHTML(quiz.subjectId) + '<h1 style="margin-top:10px">' + String(res.scoreOn20).replace('.', ',') + ' / 20</h1></div>' +
        '<span class="badge ' + tone + '" style="font-size:14px;padding:8px 14px">' + esc(verdict) + ' · ' + res.score + '/' + res.total + ' (' + res.percent + '%)</span></div>' +
        '<div class="hw-list">' + quiz.questions.map(function (q, idx) {
          const chosen = run.answers[idx];
          const ok = normalizeAnswer(chosen) === normalizeAnswer(q.answer);
          return '<div class="hw-item"><span class="badge ' + (ok ? 'badge-success' : 'badge-danger') + '">' + (ok ? 'Juste' : 'À revoir') + '</span><div class="hw-body"><div class="hw-title">' + (idx + 1) + '. ' + esc(q.prompt) + '</div><p class="muted-text" style="margin-top:4px">Ta réponse : <strong>' + esc(chosen || '—') + '</strong>' + (!ok ? ' · Attendu : <strong>' + esc(q.answer) + '</strong>' : '') + '</p><p style="margin-top:4px;font-size:14px">' + esc(q.explanation) + '</p></div></div>';
        }).join('') + '</div>' +
        '<div class="row-actions" style="margin-top:24px"><button type="button" class="btn btn-primary" id="btn-quit-quiz">Retour aux quiz</button><button type="button" class="btn btn-secondary" data-start-quiz="' + esc(quiz.id) + '">Refaire</button><button type="button" class="btn btn-ghost" data-goto-subject-ex="' + esc(quiz.subjectId) + '">Fiches méthode</button></div>' +
        '</section>'
      );
    }
    const q = quiz.questions[run.index];
    const pct = Math.round(((run.index + 1) / quiz.questions.length) * 100);
    const chosen = run.answers[run.index] || null;
    const letters = ['A', 'B', 'C', 'D'];
    return (
      '<section class="panel">' +
      '<div class="panel-header"><div class="row-actions">' + subjectBadgeHTML(quiz.subjectId) + '<strong>' + esc(quiz.title) + '</strong></div><button type="button" class="btn btn-ghost btn-sm" id="btn-quit-quiz">' + Icons.icon('x', 16) + '<span>Quitter</span></button></div>' +
      '<div class="subject-bar-meta"><span class="tabular">Question ' + (run.index + 1) + ' / ' + quiz.questions.length + '</span><span class="tabular">' + pct + '%</span></div>' +
      '<div class="progress-track" style="margin-bottom:24px"><div class="progress-fill" style="width:' + pct + '%;background:var(--color-primary)"></div></div>' +
      '<h2>' + esc(q.prompt) + '</h2>' +
      '<div class="option-stack">' + q.options.map(function (opt, idx) {
        return '<button type="button" class="choice-btn' + (chosen === opt ? ' is-selected' : '') + '" data-quiz-choice="' + esc(opt) + '"><span class="choice-letter">' + (letters[idx] || idx + 1) + '</span><span>' + esc(opt) + '</span></button>';
      }).join('') + '</div>' +
      '<div class="row-actions" style="justify-content:space-between"><button type="button" class="btn btn-secondary" id="btn-quiz-prev"' + (run.index === 0 ? ' disabled' : '') + '>Précédent</button><button type="button" class="btn btn-primary" id="btn-quiz-next"' + (!chosen ? ' disabled' : '') + '>' + (run.index === quiz.questions.length - 1 ? 'Calculer ma note /20' : 'Suivante') + '</button></div>' +
      '</section>'
    );
  }

  // ===========================
  // VIEW 5: PHOTO STUDIO & MANUAL CREATOR
  // ===========================
  function renderStudioView(account, yearRec) {
    const subjects = Curr.getSubjectsForLevel(yearRec.levelId);
    const archived = isViewingArchivedYear(account, yearRec);
    const sp = state.studioPhoto;
    if (archived) {
      return '<section class="panel"><h1>photo &amp; création</h1><p class="muted-text" style="margin-top:8px">Reviens à ton année active (' + esc(account.activeYearId) + ') pour créer des exercices ou importer une photo de cours.</p><button type="button" class="btn btn-primary" style="margin-top:16px" id="btn-back-active-year">Revenir à ' + esc(account.activeYearId) + '</button></section>';
    }
    const subjectOptions = subjects.map(function (s) { return '<option value="' + s.id + '"' + (sp.subjectId === s.id ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('');
    return (
      '<div class="view-header"><div><h1>photo de cours &amp; création</h1><p>Importe ton cahier pour générer automatiquement une fiche méthode, des exercices guidés et un quiz.</p></div>' +
      '<div class="row-actions"><button type="button" class="btn ' + (state.studioTab === 'photo' ? 'btn-primary' : 'btn-secondary') + '" data-studio-tab="photo">' + Icons.icon('camera', 17) + '<span>Photo → Pack révision</span></button>' +
      '<button type="button" class="btn ' + (state.studioTab === 'manual' ? 'btn-primary' : 'btn-secondary') + '" data-studio-tab="manual">' + Icons.icon('plus', 17) + '<span>Exercice manuel</span></button></div></div>' +
      (state.studioTab === 'photo'
        ? '<div class="two-col-split"><section class="panel"><h2 style="margin-bottom:16px">1. Importer ton cours</h2><form id="photo-gen-form" class="auth-form">' +
          '<div class="field"><label for="studio-subj">Matière</label><select class="select" id="studio-subj" name="subjectId">' + subjectOptions + '</select></div>' +
          '<div class="field"><label for="studio-chapter">Chapitre</label><input class="input" id="studio-chapter" name="chapter" value="' + esc(sp.chapter) + '" placeholder="ex. Les triangles particuliers" required></div>' +
          '<div class="field"><label>Photo de la feuille de cours</label><div class="upload-zone" id="photo-dropzone">' +
          (sp.imageDataUrl
            ? '<img src="' + sp.imageDataUrl + '" alt="Aperçu" class="photo-preview-img"><span class="muted-text">' + esc(sp.fileName) + '</span><button type="button" class="btn btn-secondary btn-sm" id="btn-clear-photo">Changer</button>'
            : Icons.icon('image', 32) + '<strong>Glisse une photo ici ou clique pour choisir</strong><span class="field-help">JPG, PNG ou WebP</span><input type="file" id="photo-file-input" accept="image/*" capture="environment" class="sr-only">') +
          '</div></div>' +
          '<div class="field"><div style="display:flex;justify-content:space-between;align-items:center"><label for="studio-notes">Notions clés / définitions</label><button type="button" class="btn btn-ghost btn-sm" id="btn-fill-sample-course">Exemple de cours</button></div>' +
          '<textarea class="textarea" id="studio-notes" name="notes" rows="5" placeholder="Terme : définition...">' + esc(sp.notes) + '</textarea></div>' +
          '<button type="submit" class="btn btn-primary"' + (sp.generating ? ' disabled' : '') + '>' + Icons.icon('sparkles', 18) + '<span>' + (sp.generating ? 'Génération…' : 'Générer fiche méthode + exercices + quiz') + '</span></button></form></section>' +
          '<section class="panel"><h2 style="margin-bottom:16px">2. Aperçu éditable</h2>' +
          (sp.draftPack ? renderDraftPackEditor(sp.draftPack) : '<p class="muted-text">Importe une photo ou saisis quelques notions puis clique sur <strong>Générer</strong>.</p>') +
          '</section></div>'
        : renderManualExerciseForm(subjects))
    );
  }

  function renderDraftPackEditor(pack) {
    return (
      '<form id="save-pack-form" class="auth-form">' +
      '<span class="badge badge-success" style="align-self:flex-start">' + Icons.icon('sparkles', 14) + ' 1 fiche · ' + pack.exercises.length + ' exercices · 1 quiz (' + pack.quiz.questions.length + ' q.)</span>' +
      '<div class="field"><label for="draft-ms-title">Titre de la fiche</label><input class="input" id="draft-ms-title" name="msTitle" value="' + esc(pack.methodSheet.title) + '" required></div>' +
      '<div class="field"><label for="draft-ms-ess">L’essentiel</label><textarea class="textarea" id="draft-ms-ess" name="msEssential" rows="2">' + esc(pack.methodSheet.essential) + '</textarea></div>' +
      '<div class="field"><label for="draft-ms-steps">Étapes clés</label><textarea class="textarea" id="draft-ms-steps" name="msSteps" rows="3">' + esc((pack.methodSheet.steps || []).join('\n')) + '</textarea></div>' +
      '<div class="field"><label for="draft-ms-pitfall">Piège à éviter</label><input class="input" id="draft-ms-pitfall" name="msPitfall" value="' + esc(pack.methodSheet.pitfall) + '"></div>' +
      '<div class="row-actions"><button type="submit" class="btn btn-accent">' + Icons.icon('check', 18) + '<span>Enregistrer dans mon année</span></button><button type="button" class="btn btn-ghost" id="btn-discard-draft">Effacer</button></div></form>'
    );
  }

  function renderManualExerciseForm(subjects) {
    const opts = subjects.map(function (s) { return '<option value="' + s.id + '">' + esc(s.name) + '</option>'; }).join('');
    return (
      '<section class="panel" style="max-width:760px"><h2 style="margin-bottom:16px">Nouvel exercice + fiche méthode</h2><form id="manual-ex-form" class="auth-form">' +
      '<div class="form-grid-2"><div class="field"><label for="mex-subj">Matière</label><select class="select" id="mex-subj" name="subjectId">' + opts + '</select></div>' +
      '<div class="field"><label for="mex-chap">Chapitre</label><input class="input" id="mex-chap" name="chapter" required></div></div>' +
      '<div class="field"><label for="mex-title">Titre</label><input class="input" id="mex-title" name="title" required></div>' +
      '<div class="field"><label for="mex-prompt">Énoncé</label><textarea class="textarea" id="mex-prompt" name="prompt" rows="2" required></textarea></div>' +
      '<div class="form-grid-2"><div class="field"><label for="mex-answer">Bonne réponse</label><input class="input" id="mex-answer" name="answer" required></div>' +
      '<div class="field"><label for="mex-wrong">Choix faux QCM (séparés par ;)</label><input class="input" id="mex-wrong" name="wrongOptions"></div></div>' +
      '<div class="field"><label for="mex-hint">Indice</label><input class="input" id="mex-hint" name="hint"></div>' +
      '<div class="field"><label for="mex-exp">Explication</label><input class="input" id="mex-exp" name="explanation" required></div>' +
      '<div class="field"><label for="mex-method">Astuce fiche méthode</label><input class="input" id="mex-method" name="methodTip"></div>' +
      '<button type="submit" class="btn btn-primary">Enregistrer l’exercice</button></form></section>'
    );
  }

  // ===========================
  // VIEW 6: HISTORY & MULTI-YEAR CHARTS
  // ===========================
  function renderHistoryView(account, yearRec, enrollStatus) {
    const sortedYears = account.schoolYears.slice().sort(function (a, b) {
      return SY.parseSchoolYearStart(a.yearId) - SY.parseSchoolYearStart(b.yearId);
    });
    const multiYearStats = sortedYears.map(function (y) {
      const p = Store.computeYearProgress(y);
      return { yearId: y.yearId, levelId: y.levelId, overallMastery: p.overallMastery, overallAvgOn20: p.overallAvgOn20, isSelected: y.yearId === yearRec.yearId };
    });
    const selectedProgress = Store.computeYearProgress(yearRec);
    const subjects = Curr.getSubjectsForLevel(yearRec.levelId);
    const logEntries = (yearRec.activityLog || []).filter(function (e) {
      return state.historyFilterSubject === 'all' || e.subjectId === state.historyFilterSubject;
    });
    const subjPills =
      '<button type="button" class="filter-pill' + (state.historyFilterSubject === 'all' ? ' is-active' : '') + '" data-hist-subj="all">Toutes</button>' +
      subjects.map(function (s) { return '<button type="button" class="filter-pill' + (state.historyFilterSubject === s.id ? ' is-active' : '') + '" data-hist-subj="' + s.id + '">' + esc(s.short) + '</button>'; }).join('');

    return (
      '<div class="view-header"><div><h1>historique &amp; années scolaires</h1><p>Compare tes résultats d’une année à l’autre et consulte tes archives par matière.</p></div></div>' +
      '<div class="dash-top-grid">' +
      '<section class="panel"><h2 style="margin-bottom:14px">Évolution multi-années (' + sortedYears.length + ')</h2>' + Charts.renderMultiYearChart(multiYearStats) + '</section>' +
      '<section class="enrollment-gate ' + (enrollStatus.isOpen ? 'is-open' : 'is-locked') + '">' +
      '<h3>' + (enrollStatus.isOpen ? 'Inscriptions ' + esc(enrollStatus.targetYearId) + ' ouvertes' : 'Année ' + esc(enrollStatus.targetYearId) + ' : 1er mars') + '</h3>' +
      '<p class="muted-text" style="' + (enrollStatus.isOpen ? 'color:var(--color-accent-ink)' : '') + '">' + (enrollStatus.isOpen ? 'Choisis ton niveau pour démarrer ' + esc(enrollStatus.targetYearId) + '.' : 'Ouverture le ' + esc(enrollStatus.unlockDateLabel) + ' (J-' + enrollStatus.daysRemaining + ').') + '</p>' +
      '<button type="button" class="btn ' + (enrollStatus.isOpen ? 'btn-accent' : 'btn-secondary') + ' btn-sm" id="btn-card-enroll" style="align-self:flex-start">' + (enrollStatus.isOpen ? 'S’inscrire maintenant' : 'Voir / Tester mars') + '</button>' +
      '</section></div>' +
      '<section class="panel"><div class="panel-header"><h2>Bilan par matière — ' + esc(yearRec.yearId) + ' (' + esc(yearRec.levelId) + ')</h2><span class="badge badge-teal tabular">Moyenne : ' + (selectedProgress.overallAvgOn20 !== null ? String(selectedProgress.overallAvgOn20).replace('.', ',') + '/20' : '—') + '</span></div>' +
      '<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Matière</th><th>Maîtrise</th><th>Moyenne Quiz</th><th>Exercices</th><th>Fiches</th><th>Devoirs</th><th>Statut</th></tr></thead><tbody>' +
      selectedProgress.perSubject.map(function (i) {
        return '<tr><td>' + subjectBadgeHTML(i.subject.id) + '</td><td class="tabular"><strong>' + i.masteryPercent + '%</strong></td><td class="tabular">' + (i.avgOn20 !== null ? String(i.avgOn20).replace('.', ',') + '/20' : '—') + '</td><td class="tabular">' + i.completedExercises + '/' + i.totalExercises + '</td><td class="tabular">' + i.readSheets + '/' + i.totalSheets + '</td><td class="tabular">' + i.doneHomeworks + '/' + i.totalHomeworks + '</td><td><span class="badge badge-' + i.statusTone + '">' + esc(i.statusLabel) + '</span></td></tr>';
      }).join('') + '</tbody></table></div></section>' +
      '<section class="panel"><h2 style="margin-bottom:14px">Courbe des notes aux quiz — ' + esc(yearRec.yearId) + '</h2>' + Charts.renderQuizTrendChart(yearRec.quizAttempts) + '</section>' +
      '<section class="panel"><div class="panel-header"><h2>Journal détaillé</h2></div><div class="filter-bar" style="margin-bottom:16px">' + subjPills + '</div>' +
      (logEntries.length === 0 ? '<p class="muted-text">Aucune activité.</p>' : '<div class="hw-list">' + logEntries.slice(0, 20).map(function (e) {
        return '<div class="hw-item">' + subjectBadgeHTML(e.subjectId) + '<div class="hw-body"><div class="hw-title">' + esc(e.title) + '</div><div class="hw-meta"><span>' + esc(e.detail) + '</span> · <span class="tabular">' + esc(SY.formatShortDateFR(e.date)) + '</span></div></div>' + (e.scoreText ? '<span class="badge badge-teal tabular">' + esc(e.scoreText) + '</span>' : '') + '</div>';
      }).join('') + '</div>') + '</section>'
    );
  }

  // ===========================
  // VIEW 7: FAMILLE & RÉGLAGES (ÉPURÉ, CO-PARENTALITÉ & RGPD — ZÉRO JARGON TECHNIQUE)
  // ===========================
  function renderSettingsView(account, yearRec, enrollStatus) {
    const surfaceMode = applySurfaceMode(account);
    const parent = state.parentSession;
    const isParentMode = Boolean(parent && parent.uid);
    const parentChildren = isParentMode
      ? state.db.accounts.filter(function (a) {
          return a.childId && Array.isArray(a.parentUids) && a.parentUids.indexOf(parent.uid) !== -1;
        })
      : [];

    const levelOpts = SY.LEVELS.map(function (lv) {
      return '<option value="' + lv.id + '"' + (state.addChildLevelId === lv.id ? ' selected' : '') + '>' + lv.label + ' (' + lv.cycle + ')</option>';
    }).join('');

    const sim = state.db.settings.simulatedDate || '';
    const latestStart = SY.parseSchoolYearStart(enrollStatus.latestYearId);
    const febTest = (latestStart + 1) + '-02-15';
    const marTest = (latestStart + 1) + '-03-10';

    const familyPanel = isParentMode
      ? '<section class="panel">' +
        '<div class="panel-header">' +
        '<div style="display:flex;align-items:center;gap:10px">' + Icons.icon('users', 20) + '<h2>Espace Parent &amp; Co-parentalité</h2></div>' +
        '<span class="badge badge-success">' + Icons.icon('checkCircle', 14) + '<span>' + esc(parent.displayName) + ' · ' + esc(parent.email) + '</span></span>' +
        '</div>' +
        '<p class="muted-text" style="margin-bottom:16px">Un profil enfant peut être rattaché à <strong>1 ou 2 parents</strong> (idéal pour la co-parentalité / foyers séparés) afin de partager devoirs, ardoise et progression sans doublon.</p>' +
        '<div class="hw-list" style="margin-bottom:20px">' +
        parentChildren.map(function (child) {
          const cy = child.schoolYears[child.schoolYears.length - 1];
          const pCount = Array.isArray(child.parentUids) ? child.parentUids.length : 1;
          const isCurrent = child.id === account.id;
          const hasValidInvite = child.pendingInviteCode && child.pendingInviteExpiresAt && child.pendingInviteExpiresAt > Date.now();
          return (
            '<div class="hw-item">' +
            '<span class="avatar-dot" style="background:' + esc(child.avatarColor) + '">' + esc(child.displayName.charAt(0).toUpperCase()) + '</span>' +
            '<div class="hw-body">' +
            '<div class="hw-title">' + esc(child.displayName) + ' · ' + esc(cy ? cy.levelId : '') + (isCurrent ? ' <span class="badge badge-teal" style="margin-left:6px">Actif</span>' : '') + '</div>' +
            '<div class="hw-meta">' +
            '<span class="badge ' + (pCount >= 2 ? 'badge-success' : 'badge-neutral') + '">' + (pCount >= 2 ? '2 parents liés (co-parentalité active)' : '1 parent rattaché') + '</span>' +
            (hasValidInvite ? '<span class="invite-code-box" style="font-size:0.9rem;padding:3px 10px">' + esc(child.pendingInviteCode) + '</span><button type="button" class="btn btn-ghost btn-sm" data-copy-coparent="' + esc(child.pendingInviteCode) + '">Copier (48h)</button>' : '') +
            '</div></div>' +
            '<div class="row-actions">' +
            (!isCurrent ? '<button type="button" class="btn btn-secondary btn-sm" data-switch-child="' + esc(child.id) + '">Ouvrir</button>' : '') +
            (pCount < 2 ? '<button type="button" class="btn btn-primary btn-sm" data-invite-coparent="' + esc(child.id) + '"' + (state.coParentBusy ? ' disabled' : '') + '>Inviter le 2e parent</button>' : '') +
            '</div></div>'
          );
        }).join('') +
        '</div>' +
        '<div class="form-grid-2">' +
        '<form id="add-child-form" class="method-callout auth-form">' +
        '<h3>Ajouter un autre enfant</h3>' +
        '<div class="field"><label for="add-child-name">Prénom de l’enfant</label><input class="input" id="add-child-name" name="childName" placeholder="ex. Emma" required></div>' +
        '<div class="field"><label for="add-child-level">Classe</label><select class="select" id="add-child-level" name="levelId">' + levelOpts + '</select></div>' +
        '<button type="submit" class="btn btn-primary btn-sm" style="align-self:flex-start">' + Icons.icon('plus', 15) + '<span>Ajouter cet enfant</span></button>' +
        '</form>' +
        '<form id="join-coparent-form" class="method-callout auth-form">' +
        '<h3>Rejoindre un enfant (2e parent)</h3>' +
        '<p class="muted-text">L’autre parent a déjà créé le profil de votre enfant ? Saisissez le code à 8 caractères qu’il vous a transmis.</p>' +
        '<div class="field"><label for="coparent-code-input">Code co-parent (valable 48h)</label><input class="input" id="coparent-code-input" name="code" minlength="6" maxlength="12" placeholder="ex. PAR7X4M9" style="text-transform:uppercase" required></div>' +
        '<button type="submit" class="btn btn-secondary btn-sm" style="align-self:flex-start"' + (state.coParentBusy ? ' disabled' : '') + '>Rattacher l’enfant à mon compte</button>' +
        '</form>' +
        '</div>' +
        '</section>'
      : '<section class="panel">' +
        '<div class="panel-header"><h2>Espace Famille &amp; Co-parentalité</h2><span class="badge badge-neutral">' + (account.isDemo ? 'Compte démo' : 'Compte local') + '</span></div>' +
        '<p class="muted-text">Crée un <strong>compte Parent</strong> depuis l’écran d’accueil pour gérer plusieurs enfants (CP → 3e), sauvegarder dans le cloud européen et partager le suivi avec un 2e parent en cas de foyers séparés.</p>' +
        '</section>';

    return (
      '<div class="view-header"><div><h1>Famille &amp; Réglages</h1><p>Gestion des profils enfants, co-parentalité, ambiance visuelle et confidentialité RGPD.</p></div></div>' +
      familyPanel +
      '<div class="dash-top-grid">' +
      '<section class="panel">' +
      '<div class="panel-header"><h2>Confidentialité &amp; Mes données (RGPD)</h2>' +
      (isParentMode ? '<span class="badge badge-success">Sauvegardé (Europe) ✓</span>' : '<span class="badge badge-neutral">Local uniquement</span>') +
      '</div>' +
      '<div class="method-callout" style="margin-bottom:16px">' +
      '<strong>Protection des mineurs (&lt; 15 ans) :</strong> les profils enfants sont placés sous la responsabilité de leurs parents (1 ou 2 parents). Aucune publicité, aucune revente de données. Les photos de cahiers et croquis d’ardoise restent stockés uniquement sur cet appareil.' +
      '</div>' +
      '<div class="row-actions" style="margin-bottom:20px">' +
      '<button type="button" class="btn btn-secondary btn-sm" id="btn-export-json">' + Icons.icon('download', 16) + '<span>Exporter mes données (JSON)</span></button>' +
      '<label class="btn btn-secondary btn-sm" for="import-json-input" style="cursor:pointer">' + Icons.icon('upload', 16) + '<span>Importer une sauvegarde</span></label><input type="file" id="import-json-input" accept="application/json" class="sr-only">' +
      '</div>' +
      '<hr style="border:none;border-top:1px solid var(--color-border);margin:18px 0">' +
      '<h3 style="margin-bottom:8px;color:var(--color-danger)">Droit à l’effacement</h3>' +
      '<p class="muted-text" style="margin-bottom:12px">Tu peux supprimer définitivement ce profil enfant (ou dissocier ton accès co-parent) et purger ses données cloud à tout moment.</p>' +
      (!state.confirmDeleteStep
        ? '<button type="button" class="btn btn-secondary btn-sm" id="btn-ask-delete-account" style="color:var(--color-danger);border-color:var(--color-danger-border)">' + Icons.icon('trash', 15) + '<span>Supprimer le profil de ' + esc(account.displayName) + '</span></button>'
        : '<div class="form-error" style="flex-direction:column;align-items:flex-start;gap:10px">' +
          '<span>Confirmer la suppression définitive des données de <strong>' + esc(account.displayName) + '</strong> ?</span>' +
          '<div class="row-actions">' +
          '<button type="button" class="btn btn-sm" id="btn-confirm-delete-child" style="background:var(--color-danger);color:#FFF">Oui, supprimer ce profil</button>' +
          (isParentMode ? '<button type="button" class="btn btn-sm" id="btn-confirm-delete-all" style="background:#7F1D1D;color:#FFF">Supprimer tout le compte Parent</button>' : '') +
          '<button type="button" class="btn btn-secondary btn-sm" id="btn-cancel-delete">Annuler</button>' +
          '</div></div>') +
      '</section>' +
      '<div style="display:flex;flex-direction:column;gap:20px">' +
      '<section class="panel"><h2 style="margin-bottom:10px">Ambiance visuelle</h2>' +
      '<div class="row-actions"><button type="button" class="btn ' + (surfaceMode === 'paper' ? 'btn-primary' : 'btn-secondary') + ' btn-sm" data-set-surface="paper">Papier Doux (défaut)</button>' +
      '<button type="button" class="btn ' + (surfaceMode === 'night' ? 'btn-primary' : 'btn-secondary') + ' btn-sm" data-set-surface="night">Ardoise Nuit (soir)</button></div></section>' +
      (!isParentMode && !account.isDemo
        ? '<section class="panel"><h2 style="margin-bottom:14px">Modifier mon mot de passe local</h2>' +
          '<form id="change-pass-form" class="auth-form">' +
          '<div class="field"><label for="old-pass">Ancien mot de passe</label><input class="input" id="old-pass" name="oldPass" type="password" required></div>' +
          '<div class="field"><label for="new-pass">Nouveau mot de passe</label><input class="input" id="new-pass" name="newPass" type="password" minlength="4" required></div>' +
          '<button type="submit" class="btn btn-primary btn-sm" style="align-self:flex-start">Mettre à jour</button></form></section>'
        : '') +
      (account.isDemo
        ? '<section class="panel"><h2 style="margin-bottom:10px">Mode démo — Tester la règle du 1er mars</h2>' +
          '<div class="row-actions" style="margin-bottom:12px">' +
          '<button type="button" class="btn btn-secondary btn-sm" data-set-sim-date="' + febTest + '">15 févr. ' + (latestStart + 1) + ' (Verrouillé)</button>' +
          '<button type="button" class="btn btn-accent btn-sm" data-set-sim-date="' + marTest + '">10 mars ' + (latestStart + 1) + ' (Ouvert)</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-set-sim-date="">Date réelle</button></div>' +
          '<div class="field"><label for="sim-date-input">Date libre</label><input class="input" id="sim-date-input" type="date" value="' + esc(sim) + '"></div></section>'
        : '') +
      '</div></div>'
    );
  }

  // ===========================
  // MODAL (MARCH N+1 ENROLLMENT & SCRATCHPAD ARDOISE)
  // ===========================
  function renderModal(account, yearRec, enrollStatus) {
    if (state.modal.type === 'scratchpad') {
      const swatches = Board.CHALK_COLORS.map(function (c) {
        return '<button type="button" class="chalk-swatch" data-scratch-color="' + c.hex + '" style="background:' + c.hex + '" aria-label="' + esc(c.label) + '"></button>';
      }).join('');
      return (
        '<div class="modal-backdrop" id="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-scratch-title">' +
        '<div class="modal-box" style="max-width:720px">' +
        '<div class="panel-header" style="margin-bottom:0"><div style="display:flex;align-items:center;gap:10px">' + Icons.icon('chalkboard', 22) + '<h2 id="modal-scratch-title">Ardoise brouillon</h2></div>' +
        '<button type="button" class="btn btn-ghost btn-icon" id="btn-close-modal" aria-label="Fermer">' + Icons.icon('x', 20) + '</button></div>' +
        '<p class="muted-text">Pose ton opération ou trace ton schéma sans quitter ton exercice.</p>' +
        '<div class="slate-board bg-grid">' +
        '<canvas id="scratchpad-canvas" class="slate-canvas" style="height:320px" aria-label="Brouillon ardoise"></canvas>' +
        '<div class="slate-board-tray">' +
        '<div class="chalk-swatches">' + swatches +
        '<button type="button" class="btn btn-secondary btn-sm" id="btn-scratch-eraser">' + Icons.icon('eraser', 15) + '<span>Gomme</span></button>' +
        '</div>' +
        '<div class="row-actions">' +
        '<button type="button" class="btn btn-secondary btn-sm" id="btn-scratch-undo">' + Icons.icon('undo', 15) + '</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" id="btn-scratch-clear">Effacer</button>' +
        '</div></div></div>' +
        '<div class="row-actions" style="justify-content:flex-end"><button type="button" class="btn btn-primary" id="btn-cancel-modal">Revenir à l’exercice</button></div>' +
        '</div></div>'
      );
    }
    if (state.modal.type !== 'enroll') return '';
    const chosen = state.modal.chosenLevelId || enrollStatus.suggestedLevelId;
    const latestStart = SY.parseSchoolYearStart(enrollStatus.latestYearId);
    const febTest = (latestStart + 1) + '-02-15';
    const marTest = (latestStart + 1) + '-03-10';
    const levelGrid = SY.LEVELS.map(function (lv) {
      const sel = chosen === lv.id ? ' is-selected' : '';
      return '<button type="button" class="level-choice' + sel + '" data-modal-level="' + lv.id + '"><strong>' + lv.label + '</strong><span>' + (lv.id === enrollStatus.suggestedLevelId ? 'Suggéré' : lv.cycle) + '</span></button>';
    }).join('');

    return (
      '<div class="modal-backdrop" id="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-enroll-title">' +
      '<div class="modal-box">' +
      '<div class="panel-header" style="margin-bottom:0"><h2 id="modal-enroll-title">' + (enrollStatus.isOpen ? 'Inscription ' + esc(enrollStatus.targetYearId) : 'Inscription ' + esc(enrollStatus.targetYearId) + ' verrouillée') + '</h2>' +
      '<button type="button" class="btn btn-ghost btn-icon" id="btn-close-modal" aria-label="Fermer">' + Icons.icon('x', 20) + '</button></div>' +
      (enrollStatus.isOpen
        ? '<p>Choisis obligatoirement ton niveau pour l’année <strong>' + esc(enrollStatus.targetYearId) + '</strong> (tes années passées restent archivées).</p>' +
          '<div class="field"><label>Ton niveau scolaire</label><div class="level-picker-grid">' + levelGrid + '</div></div>' +
          '<div class="row-actions" style="justify-content:flex-end"><button type="button" class="btn btn-secondary" id="btn-cancel-modal">Annuler</button><button type="button" class="btn btn-accent" id="btn-confirm-enroll">' + Icons.icon('graduation', 18) + '<span>Valider en ' + esc(chosen) + '</span></button></div>'
        : '<div class="enrollment-gate is-locked"><p>Ouverture des inscriptions pour <strong>' + esc(enrollStatus.targetYearId) + '</strong> le <strong>' + esc(enrollStatus.unlockDateLabel) + '</strong> (encore <strong class="tabular">' + enrollStatus.daysRemaining + ' jour(s)</strong>).</p></div>' +
          '<div class="field"><label>Tester la règle de mars maintenant</label><div class="row-actions">' +
          '<button type="button" class="btn btn-accent btn-sm" data-set-sim-date="' + marTest + '">Simuler le 10 mars ' + (latestStart + 1) + ' (Débloquer)</button>' +
          '<button type="button" class="btn btn-secondary btn-sm" data-set-sim-date="' + febTest + '">15 févr. ' + (latestStart + 1) + '</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-set-sim-date="">Date réelle</button></div></div>') +
      '</div></div>'
    );
  }

  // ===========================
  // EVENTS
  // ===========================
  function bindShellEvents(account, yearRec) {
    document.querySelectorAll('[data-nav]').forEach(function (el) {
      el.addEventListener('click', function () {
        state.view = el.getAttribute('data-nav');
        state.activeQuiz = null;
        render();
        requestAnimationFrame(function () { window.scrollTo(0, 0); });
      });
    });

    const railYearSel = document.getElementById('rail-year-select');
    if (railYearSel) {
      railYearSel.addEventListener('change', function () {
        state.selectedYearId = railYearSel.value;
        state.activeExerciseId = null;
        state.activeQuiz = null;
        resetExState();
        render();
        showToast('Année affichée : ' + state.selectedYearId);
      });
    }

    document.querySelectorAll('[data-open-hub]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.subjectHubTab = btn.getAttribute('data-open-hub') || 'exercises';
        state.view = 'subjects';
        state.activeQuiz = null;
        render();
        requestAnimationFrame(function () { window.scrollTo(0, 0); });
      });
    });

    document.querySelectorAll('[data-hub-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.subjectHubTab = btn.getAttribute('data-hub-tab') || 'exercises';
        state.activeQuiz = null;
        render();
      });
    });

    document.querySelectorAll('[data-open-subject]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const sid = btn.getAttribute('data-open-subject');
        state.exFilterSubject = sid;
        state.quizFilterSubject = sid;
        state.programFilterSubject = sid;
        state.exTab = 'practice';
        state.activeExerciseId = null;
        resetExState();
        state.subjectHubTab = 'exercises';
        state.view = 'subjects';
        render();
        requestAnimationFrame(function () { window.scrollTo(0, 0); });
      });
    });

    const heroPlayAnim = document.getElementById('btn-hero-play-anim');
    if (heroPlayAnim) {
      heroPlayAnim.addEventListener('click', function () {
        const lid = heroPlayAnim.getAttribute('data-hero-lesson-id');
        const found = Board.ANIMATED_LESSONS.find(function (l) { return l.id === lid; });
        stopAnimTimer();
        if (found) state.activeAnimLesson = found;
        state.animStepIndex = 0;
        state.animPlaying = true;
        state.view = 'ardoise';
        state.ardoiseTab = 'animated';
        render();
        startAnimAutoPlay();
        requestAnimationFrame(function () { window.scrollTo(0, 0); });
      });
    }

    document.querySelectorAll('[data-select-year]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.selectedYearId = btn.getAttribute('data-select-year');
        state.activeExerciseId = null;
        state.activeQuiz = null;
        resetExState();
        render();
        showToast('Année affichée : ' + state.selectedYearId);
      });
    });

    const backActive = document.getElementById('btn-back-active-year');
    if (backActive) backActive.addEventListener('click', function () { state.selectedYearId = account.activeYearId; render(); });

    const railChildSel = document.getElementById('rail-child-select');
    if (railChildSel) {
      railChildSel.addEventListener('change', function () {
        const nextId = railChildSel.value;
        const found = state.db.accounts.find(function (a) { return a.id === nextId; });
        if (found) {
          Store.setSessionAccountId(found.id);
          state.accountId = found.id;
          state.selectedYearId = found.activeYearId;
          state.activeExerciseId = null;
          state.activeQuiz = null;
          state.challengeLeaderboard = null;
          state.challengeSchoolBoard = null;
          resetExState();
          render();
          showToast('Profil affiché : ' + found.displayName);
        }
      });
    }

    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        if (Cloud) Cloud.signOutCloud();
        Store.setSessionAccountId(null);
        Store.setParentSession(null);
        state.accountId = null;
        state.parentSession = null;
        state.selectedYearId = null;
        state.confirmDeleteStep = false;
        state.challengeLeaderboard = null;
        state.challengeSchoolBoard = null;
        render();
      });
    }

    const toggleSurface = document.getElementById('btn-toggle-surface');
    if (toggleSurface) {
      toggleSurface.addEventListener('click', function () {
        const next = applySurfaceMode(account) === 'night' ? 'paper' : 'night';
        account.surfaceMode = next;
        state.db.settings.surfaceMode = next;
        Store.saveDB(state.db);
        render();
      });
    }

    document.querySelectorAll('[data-set-surface]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const v = btn.getAttribute('data-set-surface');
        account.surfaceMode = v;
        state.db.settings.surfaceMode = v;
        Store.saveDB(state.db);
        render();
      });
    });

    [document.getElementById('btn-open-enroll-gate'), document.getElementById('btn-card-enroll')].forEach(function (el) {
      if (el) {
        el.addEventListener('click', function () {
          const st = SY.getNextYearEnrollmentStatus(account, Store.getEffectiveNow(state.db));
          state.modal = { type: 'enroll', chosenLevelId: st.suggestedLevelId };
          render();
        });
      }
    });

    const datePill = document.getElementById('btn-date-pill');
    if (datePill) datePill.addEventListener('click', function () { state.view = 'settings'; render(); window.scrollTo(0, 0); });

    document.querySelectorAll('[data-goto-subject-ex]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.exFilterSubject = btn.getAttribute('data-goto-subject-ex');
        state.exTab = 'practice';
        state.activeExerciseId = null;
        resetExState();
        state.subjectHubTab = 'exercises';
        state.view = 'subjects';
        render();
        window.scrollTo(0, 0);
      });
    });

    document.querySelectorAll('[data-goto-subject-quiz]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.quizFilterSubject = btn.getAttribute('data-goto-subject-quiz');
        state.activeQuiz = null;
        state.subjectHubTab = 'quizzes';
        state.view = 'subjects';
        render();
        window.scrollTo(0, 0);
      });
    });

    // Official program controls
    document.querySelectorAll('[data-prog-subj]').forEach(function (btn) {
      btn.addEventListener('click', function () { state.programFilterSubject = btn.getAttribute('data-prog-subj'); render(); });
    });
    const syncBtn = document.getElementById('btn-sync-edunat');
    if (syncBtn) {
      syncBtn.addEventListener('click', function () {
        ensureOfficialTextsLoaded(yearRec.levelId, true);
        render();
        showToast('Synchronisation avec data.education.gouv.fr lancée…');
      });
    }
    document.querySelectorAll('[data-toggle-attendu]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const code = btn.getAttribute('data-toggle-attendu');
        if (!Array.isArray(yearRec.completedAttenduCodes)) yearRec.completedAttenduCodes = [];
        const idx = yearRec.completedAttenduCodes.indexOf(code);
        if (idx >= 0) yearRec.completedAttenduCodes.splice(idx, 1);
        else yearRec.completedAttenduCodes.push(code);
        Store.saveDB(state.db);
        triggerBackgroundCloudSync(account, yearRec);
        render();
      });
    });

    // Homework events
    document.querySelectorAll('[data-toggle-hw]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const hw = (yearRec.homeworks || []).find(function (h) { return h.id === btn.getAttribute('data-toggle-hw'); });
        if (!hw) return;
        hw.done = !hw.done;
        if (hw.done) {
          yearRec.activityLog.unshift({ id: Store.generateId('act'), date: Store.getEffectiveNow(state.db).toISOString(), type: 'homework', subjectId: hw.subjectId, title: 'Devoir terminé', detail: hw.title, scoreText: 'Fait' });
        }
        Store.saveDB(state.db);
        triggerBackgroundCloudSync(account, yearRec);
        render();
      });
    });
    document.querySelectorAll('[data-delete-hw]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        yearRec.homeworks = (yearRec.homeworks || []).filter(function (h) { return h.id !== btn.getAttribute('data-delete-hw'); });
        Store.saveDB(state.db);
        render();
      });
    });
    const hwForm = document.getElementById('hw-add-form');
    if (hwForm) {
      hwForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const fd = new FormData(hwForm);
        yearRec.homeworks.unshift({ id: Store.generateId('hw'), subjectId: fd.get('subjectId'), title: String(fd.get('title') || '').trim(), dueDate: fd.get('dueDate') || '', priority: fd.get('priority') || 'normal', notes: String(fd.get('notes') || '').trim(), done: false });
        Store.saveDB(state.db);
        render();
        showToast('Devoir ajouté !');
      });
    }
    document.querySelectorAll('[data-hw-status]').forEach(function (b) { b.addEventListener('click', function () { state.hwFilterStatus = b.getAttribute('data-hw-status'); render(); }); });
    document.querySelectorAll('[data-hw-subj]').forEach(function (b) { b.addEventListener('click', function () { state.hwFilterSubject = b.getAttribute('data-hw-subj'); render(); }); });

    // Exercises & Sheets
    document.querySelectorAll('[data-ex-tab]').forEach(function (b) { b.addEventListener('click', function () { state.exTab = b.getAttribute('data-ex-tab'); render(); }); });
    document.querySelectorAll('[data-ex-subj]').forEach(function (b) { b.addEventListener('click', function () { state.exFilterSubject = b.getAttribute('data-ex-subj'); state.activeExerciseId = null; resetExState(); render(); }); });
    document.querySelectorAll('[data-select-ex]').forEach(function (b) { b.addEventListener('click', function () { state.activeExerciseId = b.getAttribute('data-select-ex'); resetExState(); render(); }); });
    document.querySelectorAll('[data-ex-option]').forEach(function (b) { b.addEventListener('click', function () { state.exState.selectedOption = b.getAttribute('data-ex-option'); render(); }); });
    const exText = document.getElementById('ex-text-answer');
    if (exText) exText.addEventListener('input', function () { state.exState.textInput = exText.value; });
    const hintBtn = document.getElementById('btn-next-hint');
    if (hintBtn) hintBtn.addEventListener('click', function () { state.exState.revealedHints += 1; render(); });
    const submitExBtn = document.getElementById('btn-submit-ex');
    if (submitExBtn) {
      submitExBtn.addEventListener('click', function () {
        const activeEx = getAllExercisesForYear(yearRec, state.exFilterSubject).find(function (e) { return e.id === state.activeExerciseId; });
        if (!activeEx) return;
        const ans = activeEx.type === 'choice' ? state.exState.selectedOption : state.exState.textInput;
        if (!ans || !String(ans).trim()) { showToast('Choisis ou écris une réponse.'); return; }
        const ok = normalizeAnswer(ans) === normalizeAnswer(activeEx.answer);
        state.exState.submitted = true;
        state.exState.isCorrect = ok;
        if (ok && yearRec.completedExerciseIds.indexOf(activeEx.id) === -1) {
          yearRec.completedExerciseIds.push(activeEx.id);
          yearRec.activityLog.unshift({ id: Store.generateId('act'), date: Store.getEffectiveNow(state.db).toISOString(), type: 'exercise', subjectId: activeEx.subjectId, title: 'Exercice réussi', detail: activeEx.title, scoreText: 'Validé' });
          Store.saveDB(state.db);
          triggerBackgroundCloudSync(account, yearRec);
        }
        render();
      });
    }
    const retryEx = document.getElementById('btn-retry-ex');
    if (retryEx) retryEx.addEventListener('click', function () { resetExState(); render(); });
    document.querySelectorAll('[data-inf-subj]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.infiniteSubject = b.getAttribute('data-inf-subj');
        state.infiniteExercise = PracticeGen.generateExercise(yearRec.levelId, state.infiniteSubject);
        resetExState();
        render();
      });
    });
    [document.getElementById('btn-new-inf-ex'), document.getElementById('btn-next-inf-ex')].forEach(function (el) {
      if (el) el.addEventListener('click', function () {
        state.infiniteExercise = PracticeGen.generateExercise(yearRec.levelId, state.infiniteSubject);
        resetExState();
        render();
      });
    });
    const subInf = document.getElementById('btn-submit-inf-ex');
    if (subInf) subInf.addEventListener('click', function () {
      const ex = state.infiniteExercise; if (!ex) return;
      if (!state.exState.selectedOption) { showToast('Choisis une réponse.'); return; }
      const ok = normalizeAnswer(state.exState.selectedOption) === normalizeAnswer(ex.answer);
      state.exState.submitted = true;
      state.exState.isCorrect = ok;
      if (ok) {
        state.infiniteStreak += 1;
        yearRec.activityLog.unshift({ id: Store.generateId('act'), date: Store.getEffectiveNow(state.db).toISOString(), type: 'exercise', subjectId: ex.subjectId, title: 'Entraînement infini réussi', detail: ex.title, scoreText: 'Série ' + state.infiniteStreak });
        Store.saveDB(state.db);
        triggerBackgroundCloudSync(account, yearRec);
      } else {
        state.infiniteStreak = 0;
      }
      render();
    });
    document.querySelectorAll('[data-start-express-quiz]').forEach(function (b) {
      b.addEventListener('click', function () {
        const subjId = b.getAttribute('data-start-express-quiz');
        const q = PracticeGen.generateExpressQuiz(yearRec.levelId, subjId, 6);
        state.activeQuiz = q;
        state.quizRun = { index: 0, answers: [], finished: false, lastResult: null };
        render();
        requestAnimationFrame(function () { window.scrollTo(0, 0); });
      });
    });
    document.querySelectorAll('[data-mark-sheet]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const id = btn.getAttribute('data-mark-sheet');
        if (yearRec.readMethodSheetIds.indexOf(id) === -1) { yearRec.readMethodSheetIds.push(id); Store.saveDB(state.db); showToast('Fiche validée !'); render(); }
      });
    });

    // Quizzes
    document.querySelectorAll('[data-quiz-subj]').forEach(function (b) { b.addEventListener('click', function () { state.quizFilterSubject = b.getAttribute('data-quiz-subj'); render(); }); });
    document.querySelectorAll('[data-start-quiz]').forEach(function (b) {
      b.addEventListener('click', function () {
        const found = getAllQuizzesForYear(yearRec, 'all').find(function (q) { return q.id === b.getAttribute('data-start-quiz'); });
        if (!found) return;
        state.activeQuiz = found;
        state.quizRun = { index: 0, answers: [], finished: false, lastResult: null };
        render();
        window.scrollTo(0, 0);
      });
    });
    const quitQ = document.getElementById('btn-quit-quiz');
    if (quitQ) quitQ.addEventListener('click', function () { state.activeQuiz = null; render(); });
    document.querySelectorAll('[data-quiz-choice]').forEach(function (b) { b.addEventListener('click', function () { state.quizRun.answers[state.quizRun.index] = b.getAttribute('data-quiz-choice'); render(); }); });
    const qPrev = document.getElementById('btn-quiz-prev');
    if (qPrev) qPrev.addEventListener('click', function () { if (state.quizRun.index > 0) { state.quizRun.index -= 1; render(); } });
    const qNext = document.getElementById('btn-quiz-next');
    if (qNext) {
      qNext.addEventListener('click', function () {
        const quiz = state.activeQuiz;
        if (!quiz) return;
        if (state.quizRun.index < quiz.questions.length - 1) { state.quizRun.index += 1; render(); return; }
        let score = 0;
        quiz.questions.forEach(function (q, i) { if (normalizeAnswer(state.quizRun.answers[i]) === normalizeAnswer(q.answer)) score += 1; });
        const total = quiz.questions.length;
        const percent = Math.round((score / total) * 100);
        const scoreOn20 = Math.round((score / total) * 200) / 10;
        const attempt = { id: Store.generateId('qa'), quizId: quiz.id, subjectId: quiz.subjectId, title: quiz.title, score: score, total: total, scoreOn20: scoreOn20, percent: percent, date: Store.getEffectiveNow(state.db).toISOString() };
        yearRec.quizAttempts.push(attempt);
        yearRec.activityLog.unshift({ id: Store.generateId('act'), date: attempt.date, type: 'quiz', subjectId: quiz.subjectId, title: 'Quiz validé : ' + quiz.title, detail: score + '/' + total + ' (' + percent + '%)', scoreText: String(scoreOn20).replace('.', ',') + '/20' });
        Store.saveDB(state.db);
        triggerBackgroundCloudSync(account, yearRec);
        state.quizRun.finished = true;
        state.quizRun.lastResult = attempt;
        render();
        showToast('Note enregistrée : ' + String(scoreOn20).replace('.', ',') + '/20 !');
      });
    }

    // Studio Photo & Manual
    document.querySelectorAll('[data-studio-tab]').forEach(function (b) { b.addEventListener('click', function () { state.studioTab = b.getAttribute('data-studio-tab'); render(); }); });
    const dropzone = document.getElementById('photo-dropzone');
    const fileInput = document.getElementById('photo-file-input');
    if (dropzone && fileInput) {
      dropzone.addEventListener('click', function (e) { if (e.target.tagName !== 'BUTTON') fileInput.click(); });
      dropzone.addEventListener('dragover', function (e) { e.preventDefault(); dropzone.classList.add('is-dragover'); });
      dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('is-dragover'); });
      dropzone.addEventListener('drop', function (e) { e.preventDefault(); dropzone.classList.remove('is-dragover'); if (e.dataTransfer.files[0]) handlePhotoUpload(e.dataTransfer.files[0]); });
      fileInput.addEventListener('change', function () { if (fileInput.files[0]) handlePhotoUpload(fileInput.files[0]); });
    }
    const clearP = document.getElementById('btn-clear-photo');
    if (clearP) clearP.addEventListener('click', function (e) { e.stopPropagation(); state.studioPhoto.imageDataUrl = null; state.studioPhoto.fileName = ''; render(); });
    const sampleBtn = document.getElementById('btn-fill-sample-course');
    if (sampleBtn) {
      sampleBtn.addEventListener('click', function () {
        state.studioPhoto.chapter = 'Les triangles particuliers';
        state.studioPhoto.notes = 'Triangle isocèle : possède deux côtés de même longueur et deux angles égaux.\nTriangle équilatéral : possède trois côtés égaux et trois angles de 60 degrés.\nTriangle rectangle : possède un angle droit de 90 degrés.';
        render();
      });
    }
    const sSubj = document.getElementById('studio-subj'); if (sSubj) sSubj.addEventListener('change', function () { state.studioPhoto.subjectId = sSubj.value; });
    const sChap = document.getElementById('studio-chapter'); if (sChap) sChap.addEventListener('input', function () { state.studioPhoto.chapter = sChap.value; });
    const sNotes = document.getElementById('studio-notes'); if (sNotes) sNotes.addEventListener('input', function () { state.studioPhoto.notes = sNotes.value; });
    const pForm = document.getElementById('photo-gen-form');
    if (pForm) {
      pForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        state.studioPhoto.generating = true; render();
        const photoRef = state.studioPhoto.imageDataUrl ? await Store.savePhoto(Store.generateId('photo'), state.studioPhoto.imageDataUrl) : null;
        const pack = await Gen.generateFromCoursePhoto({ subjectId: state.studioPhoto.subjectId, levelId: yearRec.levelId, chapter: state.studioPhoto.chapter, notes: state.studioPhoto.notes, imageDataUrl: state.studioPhoto.imageDataUrl, photoRef: photoRef }, state.db.settings.geminiApiKey);
        state.studioPhoto.generating = false;
        state.studioPhoto.draftPack = pack;
        render();
        showToast('Pack de révision généré !');
      });
    }
    const savePack = document.getElementById('save-pack-form');
    if (savePack) {
      savePack.addEventListener('submit', function (e) {
        e.preventDefault();
        const pack = state.studioPhoto.draftPack; if (!pack) return;
        const fd = new FormData(savePack);
        pack.methodSheet.title = String(fd.get('msTitle') || pack.methodSheet.title).trim();
        pack.methodSheet.essential = String(fd.get('msEssential') || pack.methodSheet.essential).trim();
        pack.methodSheet.steps = String(fd.get('msSteps') || '').split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
        pack.methodSheet.pitfall = String(fd.get('msPitfall') || pack.methodSheet.pitfall).trim();
        yearRec.customMethodSheets.unshift(pack.methodSheet);
        pack.exercises.forEach(function (ex) { ex.methodSheet = pack.methodSheet; yearRec.customExercises.unshift(ex); });
        yearRec.customQuizzes.unshift(pack.quiz);
        yearRec.activityLog.unshift({ id: Store.generateId('act'), date: Store.getEffectiveNow(state.db).toISOString(), type: 'photo', subjectId: pack.methodSheet.subjectId, title: 'Cours importé : ' + pack.methodSheet.chapter, detail: pack.exercises.length + ' exercices + 1 fiche + 1 quiz', scoreText: 'Nouveau' });
        Store.saveDB(state.db);
        state.exFilterSubject = pack.methodSheet.subjectId;
        state.activeExerciseId = pack.exercises[0] ? pack.exercises[0].id : null;
        state.studioPhoto.draftPack = null; state.studioPhoto.imageDataUrl = null; state.studioPhoto.chapter = ''; state.studioPhoto.notes = '';
        state.view = 'exercises'; state.exTab = 'practice'; resetExState(); render(); window.scrollTo(0, 0);
        showToast('Pack enregistré dans ' + yearRec.yearId + ' !');
      });
    }
    const disc = document.getElementById('btn-discard-draft');
    if (disc) disc.addEventListener('click', function () { state.studioPhoto.draftPack = null; render(); });
    const manForm = document.getElementById('manual-ex-form');
    if (manForm) {
      manForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const fd = new FormData(manForm);
        const subjId = fd.get('subjectId'), chapter = String(fd.get('chapter') || '').trim(), title = String(fd.get('title') || '').trim(), prompt = String(fd.get('prompt') || '').trim(), answer = String(fd.get('answer') || '').trim(), wrongRaw = String(fd.get('wrongOptions') || '').trim(), hint = String(fd.get('hint') || '').trim(), explanation = String(fd.get('explanation') || '').trim(), tip = String(fd.get('methodTip') || '').trim();
        let options = null;
        if (wrongRaw) { const w = wrongRaw.split(/[;,]/).map(function (s) { return s.trim(); }).filter(Boolean); if (w.length) options = [answer].concat(w); }
        const sheet = { id: Store.generateId('ms_man'), levelId: yearRec.levelId, subjectId: subjId, chapter: chapter, title: 'Fiche : ' + title, source: 'perso', essential: tip || explanation, steps: ['Relis l’énoncé.', hint || 'Applique la règle du cours.', 'Vérifie ton résultat.'], pitfall: 'Répondre trop vite.', example: prompt + ' → ' + answer };
        const ex = { id: Store.generateId('ex_man'), levelId: yearRec.levelId, subjectId: subjId, chapter: chapter, title: title, difficulty: 'Perso', source: 'perso', prompt: prompt, type: options ? 'choice' : 'input', options: options, answer: answer, hints: hint ? [hint] : ['Relis ton cahier.'], explanation: explanation, methodSheet: sheet };
        yearRec.customMethodSheets.unshift(sheet); yearRec.customExercises.unshift(ex); Store.saveDB(state.db);
        state.exFilterSubject = subjId; state.activeExerciseId = ex.id; state.view = 'exercises'; state.exTab = 'practice'; resetExState(); render(); window.scrollTo(0, 0);
        showToast('Exercice personnalisé enregistré !');
      });
    }

    // History & Settings
    document.querySelectorAll('[data-hist-subj]').forEach(function (b) { b.addEventListener('click', function () { state.historyFilterSubject = b.getAttribute('data-hist-subj'); render(); }); });
    const cpForm = document.getElementById('change-pass-form');
    if (cpForm) cpForm.addEventListener('submit', async function (e) { e.preventDefault(); const fd = new FormData(cpForm); try { await Store.changePassword(state.db, account, fd.get('oldPass'), fd.get('newPass')); cpForm.reset(); showToast('Mot de passe mis à jour !'); } catch (err) { showToast(err.message); } });
    const expBtn = document.getElementById('btn-export-json');
    if (expBtn) expBtn.addEventListener('click', function () { const blob = new Blob([Store.exportAccountJSON(account)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'ardoiz-' + account.username + '.json'; a.click(); URL.revokeObjectURL(url); showToast('Sauvegarde exportée.'); });
    const impIn = document.getElementById('import-json-input');
    if (impIn) impIn.addEventListener('change', function () { const f = impIn.files[0]; if (!f) return; const r = new FileReader(); r.onload = function () { try { const acc = Store.importAccountJSON(state.db, r.result); state.accountId = acc.id; state.selectedYearId = acc.activeYearId; render(); showToast('Sauvegarde restaurée !'); } catch (err) { showToast(err.message); } }; r.readAsText(f); });
    document.querySelectorAll('[data-set-sim-date]').forEach(function (b) {
      b.addEventListener('click', function () {
        const v = b.getAttribute('data-set-sim-date');
        state.db.settings.simulatedDate = v || null; Store.saveDB(state.db);
        if (state.modal && state.modal.type === 'enroll') { state.modal.chosenLevelId = SY.getNextYearEnrollmentStatus(account, Store.getEffectiveNow(state.db)).suggestedLevelId; }
        render();
        showToast(v ? 'Date simulée : ' + SY.formatDateFR(Store.getEffectiveNow(state.db)) : 'Retour à la date réelle.');
      });
    });
    const simIn = document.getElementById('sim-date-input');
    if (simIn) simIn.addEventListener('change', function () { state.db.settings.simulatedDate = simIn.value || null; Store.saveDB(state.db); render(); });
    // Challenge & School UAI Directory events
    const schoolSearchForm = document.getElementById('school-search-form');
    if (schoolSearchForm) {
      schoolSearchForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const inp = document.getElementById('school-search-input');
        const q = inp ? inp.value.trim() : '';
        if (q.length < 2) { showToast('Saisis au moins 2 caractères (ville, code postal ou nom).'); return; }
        state.challengeSearchQuery = q;
        state.challengeSearching = true;
        state.challengeSearchError = '';
        state.challengeSelectedSchool = null;
        render();
        try {
          state.challengeSchools = await Cloud.searchFrenchSchools(q);
          state.challengeSearching = false;
        } catch (err) {
          state.challengeSearching = false;
          state.challengeSchools = [];
          state.challengeSearchError = err && err.message ? err.message : 'Erreur lors de la recherche dans l’annuaire.';
        }
        render();
      });
    }

    document.querySelectorAll('[data-pick-school]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const uai = btn.getAttribute('data-pick-school');
        const found = state.challengeSchools.find(function (s) { return s.uai === uai; });
        if (found) {
          state.challengeSelectedSchool = found;
          render();
        }
      });
    });

    const createClassForm = document.getElementById('create-class-form');
    if (createClassForm) {
      createClassForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const school = state.challengeSelectedSchool;
        if (!school) return;
        const fd = new FormData(createClassForm);
        const pseudo = String(fd.get('pseudo') || account.displayName).trim().slice(0, 24);
        const className = String(fd.get('className') || yearRec.levelId + '-A').trim().slice(0, 40);
        const weeklyGoal = Math.max(100, Math.min(50000, parseInt(fd.get('weeklyGoal'), 10) || 600));
        if (pseudo.length < 2 || className.length < 2) {
          showToast('Le pseudo et le nom de classe doivent contenir au moins 2 caractères.');
          return;
        }

        let membership = null;
        if (Cloud.getStatus().configured) {
          try {
            state.cloudSyncing = true;
            state.cloudError = '';
            render();
            const clsDoc = await Cloud.createCloudClass(account, yearRec, school, className, weeklyGoal);
            membership = {
              classId: clsDoc.classId,
              uai: school.uai,
              schoolName: school.name,
              schoolType: school.type,
              city: school.city,
              postalCode: school.postalCode,
              className: clsDoc.className,
              yearId: yearRec.yearId,
              inviteCode: clsDoc.inviteCode,
              weeklyGoalPoints: clsDoc.weeklyGoalPoints,
              pseudo: pseudo
            };
            account.challenge = membership;
            Store.saveDB(state.db);
            await Cloud.syncStudentToCloud(account, yearRec, membership, state.infiniteStreak);
            state.cloudSyncing = false;
            state.challengeSwitching = false;
            state.challengeLeaderboard = null;
            state.challengeSchoolBoard = null;
            showToast('Classe ' + clsDoc.className + ' créée sur Firebase ! Code : ' + clsDoc.inviteCode);
            loadChallengeLeaderboards(account, yearRec, true);
          } catch (err) {
            state.cloudSyncing = false;
            state.cloudError = err && err.message ? err.message : 'Erreur Firebase lors de la création.';
            showToast(state.cloudError);
          }
        } else {
          const code = Cloud.makeInviteCode(yearRec.levelId);
          membership = {
            classId: school.uai + '_' + yearRec.yearId + '_' + code,
            uai: school.uai,
            schoolName: school.name,
            schoolType: school.type,
            city: school.city,
            postalCode: school.postalCode,
            className: className,
            yearId: yearRec.yearId,
            inviteCode: code,
            weeklyGoalPoints: weeklyGoal,
            pseudo: pseudo
          };
          account.challenge = membership;
          Store.saveDB(state.db);
          state.challengeSwitching = false;
          showToast('Classe ' + className + ' créée (mode aperçu local) — Code : ' + code);
        }
        render();
        requestAnimationFrame(function () { window.scrollTo(0, 0); });
      });
    }

    const joinClassForm = document.getElementById('join-class-form');
    if (joinClassForm) {
      joinClassForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const fd = new FormData(joinClassForm);
        const pseudo = String(fd.get('pseudo') || account.displayName).trim().slice(0, 24);
        const code = String(fd.get('inviteCode') || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (pseudo.length < 2 || code.length < 4) {
          showToast('Vérifie ton pseudo (2 car. min.) et le code d’invitation.');
          return;
        }
        if (!Cloud.getStatus().configured) {
          showToast('Configure ton projet Firebase dans Compte & Réglages pour rejoindre la classe d’un camarade via son code.');
          return;
        }
        try {
          state.cloudSyncing = true;
          state.cloudError = '';
          render();
          const cls = await Cloud.findCloudClassByInviteCode(code, account);
          if (!cls) {
            state.cloudSyncing = false;
            showToast('Aucune classe trouvée avec le code ' + code + '.');
            render();
            return;
          }
          account.challenge = {
            classId: cls.classId,
            uai: cls.uai,
            schoolName: cls.schoolName,
            city: cls.city || '',
            postalCode: '',
            className: cls.className,
            yearId: cls.yearId || yearRec.yearId,
            inviteCode: cls.inviteCode,
            weeklyGoalPoints: cls.weeklyGoalPoints || 600,
            pseudo: pseudo
          };
          Store.saveDB(state.db);
          await Cloud.syncStudentToCloud(account, yearRec, account.challenge, state.infiniteStreak);
          state.cloudSyncing = false;
          state.challengeSwitching = false;
          state.challengeLeaderboard = null;
          state.challengeSchoolBoard = null;
          showToast('Tu as rejoint la classe ' + cls.className + ' !');
          loadChallengeLeaderboards(account, yearRec, true);
        } catch (err) {
          state.cloudSyncing = false;
          state.cloudError = err && err.message ? err.message : 'Impossible de rejoindre la classe.';
          showToast(state.cloudError);
        }
        render();
      });
    }

    const copyInviteBtn = document.getElementById('btn-copy-invite');
    if (copyInviteBtn && account.challenge) {
      copyInviteBtn.addEventListener('click', function () {
        const code = account.challenge.inviteCode;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(function () { showToast('Code ' + code + ' copié !'); }).catch(function () { showToast('Code classe : ' + code); });
        } else {
          showToast('Code classe : ' + code);
        }
      });
    }

    const switchClsBtn = document.getElementById('btn-switch-class');
    if (switchClsBtn) switchClsBtn.addEventListener('click', function () { state.challengeSwitching = true; render(); });
    const cancelSwitchBtn = document.getElementById('btn-cancel-switch-class');
    if (cancelSwitchBtn) cancelSwitchBtn.addEventListener('click', function () { state.challengeSwitching = false; render(); });
    const leaveClsBtn = document.getElementById('btn-leave-class');
    if (leaveClsBtn) {
      leaveClsBtn.addEventListener('click', function () {
        account.challenge = null;
        state.challengeSwitching = false;
        state.challengeLeaderboard = null;
        state.challengeSchoolBoard = null;
        Store.saveDB(state.db);
        render();
        showToast('Tu as quitté la classe.');
      });
    }
    const refreshLbBtn = document.getElementById('btn-refresh-lb');
    if (refreshLbBtn) {
      refreshLbBtn.addEventListener('click', function () {
        loadChallengeLeaderboards(account, yearRec, true);
        showToast('Classement actualisé.');
      });
    }

    // Cloud Sync, Family & Co-Parenting + RGPD Deletion events
    const syncNowBtn = document.getElementById('btn-cloud-sync-now');
    if (syncNowBtn) {
      syncNowBtn.addEventListener('click', async function () {
        try {
          state.cloudSyncing = true;
          state.cloudError = '';
          render();
          const res = await Cloud.syncStudentToCloud(account, yearRec, account.challenge || null, state.infiniteStreak);
          state.cloudSyncing = false;
          state.cloudLastSync = res && res.at ? res.at : Date.now();
          if (state.view === 'challenge' && account.challenge) {
            loadChallengeLeaderboards(account, yearRec, true);
          }
          render();
          showToast('Points et progression synchronisés !');
        } catch (err) {
          state.cloudSyncing = false;
          state.cloudError = err && err.message ? err.message : 'Erreur lors de la synchronisation.';
          render();
          showToast(state.cloudError);
        }
      });
    }

    document.querySelectorAll('[data-switch-child]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const cid = btn.getAttribute('data-switch-child');
        const found = state.db.accounts.find(function (a) { return a.id === cid; });
        if (found) {
          Store.setSessionAccountId(found.id);
          state.accountId = found.id;
          state.selectedYearId = found.activeYearId;
          state.confirmDeleteStep = false;
          state.view = 'dashboard';
          render();
          showToast('Profil de ' + found.displayName + ' ouvert !');
        }
      });
    });

    document.querySelectorAll('[data-copy-coparent]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const code = btn.getAttribute('data-copy-coparent');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(function () { showToast('Code co-parent ' + code + ' copié !'); }).catch(function () { showToast('Code co-parent : ' + code); });
        } else {
          showToast('Code co-parent : ' + code);
        }
      });
    });

    document.querySelectorAll('[data-invite-coparent]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        const cid = btn.getAttribute('data-invite-coparent');
        const child = state.db.accounts.find(function (a) { return a.id === cid; });
        if (!child) return;
        try {
          state.coParentBusy = true;
          render();
          const cy = child.schoolYears[child.schoolYears.length - 1];
          const res = await Cloud.createCoParentInvite(child, cy ? cy.levelId : 'CM2');
          Store.saveDB(state.db);
          state.coParentBusy = false;
          render();
          showToast('Code co-parent créé : ' + res.code + ' (valable 48h)');
        } catch (err) {
          state.coParentBusy = false;
          render();
          showToast((err && err.message) || 'Impossible de générer le code co-parent.');
        }
      });
    });

    const addChildForm = document.getElementById('add-child-form');
    if (addChildForm) {
      addChildForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!state.parentSession) return;
        const fd = new FormData(addChildForm);
        const cname = String(fd.get('childName') || '').trim();
        const lvl = fd.get('levelId') || 'CM2';
        state.addChildLevelId = lvl;
        try {
          const childAcc = Store.createChildProfile(state.db, {
            displayName: cname,
            levelId: lvl,
            parentUid: state.parentSession.uid,
            parentUids: [state.parentSession.uid],
            createdBy: state.parentSession.uid,
            parentEmail: state.parentSession.email,
            parentName: state.parentSession.displayName,
            consentAcceptedAt: state.parentSession.consentAcceptedAt
          });
          const yr = getSelectedYear(childAcc);
          await Cloud.syncStudentToCloud(childAcc, yr, null, 0);
          state.accountId = childAcc.id;
          state.selectedYearId = childAcc.activeYearId;
          render();
          showToast('Profil créé pour ' + cname + ' (' + lvl + ') !');
        } catch (err) {
          showToast((err && err.message) || 'Erreur lors de l’ajout de l’enfant.');
        }
      });
    }

    const joinCoParentForm = document.getElementById('join-coparent-form');
    if (joinCoParentForm) {
      joinCoParentForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const fd = new FormData(joinCoParentForm);
        const code = String(fd.get('code') || '').trim();
        try {
          state.coParentBusy = true;
          render();
          const childDoc = await Cloud.acceptCoParentInvite(code);
          if (childDoc) {
            const linked = Store.upsertCloudChildProfile(state.db, childDoc);
            if (linked) {
              Store.setSessionAccountId(linked.id);
              state.accountId = linked.id;
              state.selectedYearId = linked.activeYearId;
            }
          }
          state.coParentBusy = false;
          render();
          showToast('Co-parentalité activée ! Le profil de l’enfant est maintenant partagé.');
        } catch (err) {
          state.coParentBusy = false;
          render();
          showToast((err && err.message) || 'Code co-parent invalide.');
        }
      });
    }

    const askDelBtn = document.getElementById('btn-ask-delete-account');
    if (askDelBtn) askDelBtn.addEventListener('click', function () { state.confirmDeleteStep = true; render(); });
    const cancelDelBtn = document.getElementById('btn-cancel-delete');
    if (cancelDelBtn) cancelDelBtn.addEventListener('click', function () { state.confirmDeleteStep = false; render(); });

    const confirmDelChild = document.getElementById('btn-confirm-delete-child');
    if (confirmDelChild) {
      confirmDelChild.addEventListener('click', async function () {
        try {
          if (!account.isDemo && Cloud && Cloud.getStatus().configured) {
            await Cloud.deleteChildOrAccountCloud(account, false);
          }
          Store.deleteAccountLocal(state.db, account.id);
          state.confirmDeleteStep = false;
          const remaining = state.parentSession
            ? state.db.accounts.find(function (a) { return a.childId && Array.isArray(a.parentUids) && a.parentUids.indexOf(state.parentSession.uid) !== -1; })
            : null;
          if (remaining) {
            Store.setSessionAccountId(remaining.id);
            state.accountId = remaining.id;
            state.selectedYearId = remaining.activeYearId;
          } else {
            state.accountId = null;
            state.selectedYearId = null;
          }
          render();
          showToast('Profil supprimé conformément au RGPD.');
        } catch (err) {
          showToast((err && err.message) || 'Erreur lors de la suppression.');
        }
      });
    }

    const confirmDelAll = document.getElementById('btn-confirm-delete-all');
    if (confirmDelAll) {
      confirmDelAll.addEventListener('click', async function () {
        try {
          const parentUid = state.parentSession ? state.parentSession.uid : null;
          const myChildren = parentUid
            ? state.db.accounts.filter(function (a) { return a.childId && Array.isArray(a.parentUids) && a.parentUids.indexOf(parentUid) !== -1; })
            : [account];
          for (let i = 0; i < myChildren.length; i++) {
            const isLast = i === myChildren.length - 1;
            if (Cloud && Cloud.getStatus().configured) {
              await Cloud.deleteChildOrAccountCloud(myChildren[i], isLast);
            }
            Store.deleteAccountLocal(state.db, myChildren[i].id);
          }
          Store.setParentSession(null);
          Store.setSessionAccountId(null);
          state.parentSession = null;
          state.accountId = null;
          state.selectedYearId = null;
          state.confirmDeleteStep = false;
          render();
          showToast('Compte Parent et données associées supprimés.');
        } catch (err) {
          showToast((err && err.message) || 'Erreur lors de la suppression du compte.');
        }
      });
    }

    // Ardoiz — Dashboard tile & Ardoise interactive + Cours animés events
    document.querySelectorAll('[data-open-ardoise]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        state.ardoiseTab = btn.getAttribute('data-open-ardoise') || 'notes';
        state.view = 'ardoise';
        render();
        requestAnimationFrame(function () { window.scrollTo(0, 0); });
      });
    });
    document.querySelectorAll('[data-tile-ardoise]').forEach(function (tile) {
      tile.addEventListener('click', function (e) {
        if (e.target.closest('button')) return;
        state.ardoiseTab = 'notes';
        state.view = 'ardoise';
        render();
        requestAnimationFrame(function () { window.scrollTo(0, 0); });
      });
    });
    document.querySelectorAll('[data-ardoise-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.ardoiseTab = btn.getAttribute('data-ardoise-tab');
        stopAnimTimer();
        state.animPlaying = false;
        render();
      });
    });

    // Chalkboard controls (update live canvas without full re-render!)
    document.querySelectorAll('[data-chalk-color]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.ardoiseColor = btn.getAttribute('data-chalk-color');
        state.ardoiseTool = 'chalk';
        if (activeBoardCtrl) activeBoardCtrl.setColor(state.ardoiseColor);
        document.querySelectorAll('[data-chalk-color]').forEach(function (other) {
          other.classList.toggle('is-active', other === btn);
        });
        const er = document.getElementById('btn-chalk-eraser');
        if (er) { er.classList.remove('btn-accent'); er.classList.add('btn-secondary'); }
      });
    });
    const chalkEraserBtn = document.getElementById('btn-chalk-eraser');
    if (chalkEraserBtn) {
      chalkEraserBtn.addEventListener('click', function () {
        state.ardoiseTool = state.ardoiseTool === 'eraser' ? 'chalk' : 'eraser';
        if (activeBoardCtrl) activeBoardCtrl.setTool(state.ardoiseTool);
        chalkEraserBtn.classList.toggle('btn-accent', state.ardoiseTool === 'eraser');
        chalkEraserBtn.classList.toggle('btn-secondary', state.ardoiseTool !== 'eraser');
        document.querySelectorAll('[data-chalk-color]').forEach(function (sw) {
          sw.classList.toggle('is-active', state.ardoiseTool === 'chalk' && sw.getAttribute('data-chalk-color') === state.ardoiseColor);
        });
      });
    }
    document.querySelectorAll('[data-chalk-size]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.ardoiseSize = parseFloat(btn.getAttribute('data-chalk-size')) || 4;
        if (activeBoardCtrl) activeBoardCtrl.setSize(state.ardoiseSize);
        document.querySelectorAll('[data-chalk-size]').forEach(function (other) {
          const isSel = other === btn;
          other.classList.toggle('btn-primary', isSel);
          other.classList.toggle('btn-ghost', !isSel);
        });
      });
    });
    document.querySelectorAll('[data-slate-bg]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.ardoiseBg = btn.getAttribute('data-slate-bg') || 'grid';
        if (activeBoardCtrl) activeBoardCtrl.setBgMode(state.ardoiseBg);
        const wrap = document.getElementById('ardoise-board-wrap');
        if (wrap) {
          wrap.classList.remove('bg-plain', 'bg-grid', 'bg-lined');
          wrap.classList.add('bg-' + state.ardoiseBg);
        }
        document.querySelectorAll('[data-slate-bg]').forEach(function (other) {
          const isSel = other === btn;
          other.classList.toggle('btn-primary', isSel);
          other.classList.toggle('btn-secondary', !isSel);
        });
      });
    });
    const chalkUndo = document.getElementById('btn-chalk-undo');
    if (chalkUndo) chalkUndo.addEventListener('click', function () { if (activeBoardCtrl) activeBoardCtrl.undo(); });
    const chalkClear = document.getElementById('btn-chalk-clear');
    if (chalkClear) chalkClear.addEventListener('click', function () { if (activeBoardCtrl) activeBoardCtrl.clear(); state.ardoiseDraftDataUrl = null; showToast('Ardoise effacée.'); });
    const chalkDl = document.getElementById('btn-chalk-download');
    if (chalkDl) {
      chalkDl.addEventListener('click', function () {
        if (!activeBoardCtrl) return;
        const url = activeBoardCtrl.exportDataUrl();
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ardoiz-tableau.png';
        a.click();
        showToast('Tableau téléchargé en PNG !');
      });
    }

    // Save note + optional slate sketch
    const nSubj = document.getElementById('note-subj');
    if (nSubj) nSubj.addEventListener('change', function () { state.ardoiseNoteSubject = nSubj.value; });
    const nTitle = document.getElementById('note-title');
    if (nTitle) nTitle.addEventListener('input', function () { state.ardoiseNoteTitle = nTitle.value; });
    const nText = document.getElementById('note-text');
    if (nText) nText.addEventListener('input', function () { state.ardoiseNoteText = nText.value; });
    const noteForm = document.getElementById('ardoise-note-form');
    if (noteForm) {
      noteForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const fd = new FormData(noteForm);
        const subjId = fd.get('subjectId') || 'maths';
        const title = String(fd.get('title') || '').trim();
        const content = String(fd.get('content') || '').trim();
        const includeSketch = Boolean(document.getElementById('note-include-sketch') && document.getElementById('note-include-sketch').checked);
        if (!title) { showToast('Ajoute un titre à ta note.'); return; }
        let sketchRef = null;
        if (includeSketch && activeBoardCtrl) {
          const png = activeBoardCtrl.exportDataUrl();
          sketchRef = await Store.savePhoto(Store.generateId('slate'), png);
        }
        if (!Array.isArray(yearRec.notes)) yearRec.notes = [];
        yearRec.notes.unshift({
          id: Store.generateId('note'),
          subjectId: subjId,
          title: title,
          content: content,
          sketchRef: sketchRef,
          updatedAt: Store.getEffectiveNow(state.db).toISOString()
        });
        Store.saveDB(state.db);
        state.ardoiseNoteTitle = '';
        state.ardoiseNoteText = '';
        triggerBackgroundCloudSync(account, yearRec);
        render();
        showToast('Note enregistrée dans ton Ardoise !');
      });
    }
    document.querySelectorAll('[data-note-subj]').forEach(function (b) {
      b.addEventListener('click', function () { state.ardoiseFilterSubject = b.getAttribute('data-note-subj'); render(); });
    });
    document.querySelectorAll('[data-load-sketch]').forEach(function (b) {
      b.addEventListener('click', function () {
        const ref = b.getAttribute('data-load-sketch');
        Store.loadPhoto(ref).then(function (url) {
          if (url && activeBoardCtrl) {
            activeBoardCtrl.loadImage(url);
            showToast('Croquis rechargé sur ton ardoise !');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
      });
    });
    document.querySelectorAll('[data-delete-note]').forEach(function (b) {
      b.addEventListener('click', function () {
        const id = b.getAttribute('data-delete-note');
        yearRec.notes = (yearRec.notes || []).filter(function (n) { return n.id !== id; });
        Store.saveDB(state.db);
        render();
        showToast('Note supprimée.');
      });
    });

    // Animated Chalkboard Lessons & Method Sheet Animator
    document.querySelectorAll('[data-select-anim-lesson]').forEach(function (b) {
      b.addEventListener('click', function () {
        const id = b.getAttribute('data-select-anim-lesson');
        const found = Board.ANIMATED_LESSONS.find(function (l) { return l.id === id; });
        if (found) {
          stopAnimTimer();
          state.activeAnimLesson = found;
          state.animStepIndex = 0;
          state.animPlaying = false;
          render();
        }
      });
    });
    document.querySelectorAll('[data-animate-sheet]').forEach(function (b) {
      b.addEventListener('click', function () {
        const sid = b.getAttribute('data-animate-sheet');
        const allSheets = getAllMethodSheetsForYear(yearRec, 'all');
        let sheet = allSheets.find(function (s) { return s.id === sid; });
        if (!sheet && state.infiniteExercise && state.infiniteExercise.methodSheet && state.infiniteExercise.methodSheet.id === sid) {
          sheet = state.infiniteExercise.methodSheet;
        }
        if (!sheet) return;
        stopAnimTimer();
        state.activeAnimLesson = Board.buildLessonFromMethodSheet(sheet);
        state.animStepIndex = 0;
        state.animPlaying = true;
        state.view = 'ardoise';
        state.ardoiseTab = 'animated';
        render();
        startAnimAutoPlay();
        requestAnimationFrame(function () { window.scrollTo(0, 0); });
      });
    });
    const animPrev = document.getElementById('btn-anim-prev');
    if (animPrev) {
      animPrev.addEventListener('click', function () {
        stopAnimTimer();
        state.animPlaying = false;
        if (state.animStepIndex > 0) state.animStepIndex -= 1;
        render();
      });
    }
    const animNext = document.getElementById('btn-anim-next');
    if (animNext) {
      animNext.addEventListener('click', function () {
        stopAnimTimer();
        state.animPlaying = false;
        const max = state.activeAnimLesson ? state.activeAnimLesson.steps.length - 1 : 0;
        if (state.animStepIndex < max) state.animStepIndex += 1;
        render();
      });
    }
    const animPlay = document.getElementById('btn-anim-play');
    if (animPlay) {
      animPlay.addEventListener('click', function () {
        if (!state.activeAnimLesson) return;
        if (state.animPlaying) {
          stopAnimTimer();
          state.animPlaying = false;
          render();
          return;
        }
        const max = state.activeAnimLesson.steps.length - 1;
        if (state.animStepIndex >= max) state.animStepIndex = 0;
        state.animPlaying = true;
        render();
        startAnimAutoPlay();
      });
    }

    // Scratchpad modal controls (inside exercises)
    const openScratchBtn = document.getElementById('btn-open-scratchpad');
    if (openScratchBtn) {
      openScratchBtn.addEventListener('click', function () {
        state.modal = { type: 'scratchpad' };
        render();
      });
    }
    document.querySelectorAll('[data-scratch-color]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (activeScratchCtrl) activeScratchCtrl.setColor(btn.getAttribute('data-scratch-color'));
      });
    });
    const scEraser = document.getElementById('btn-scratch-eraser');
    if (scEraser) scEraser.addEventListener('click', function () { if (activeScratchCtrl) activeScratchCtrl.setTool('eraser'); });
    const scUndo = document.getElementById('btn-scratch-undo');
    if (scUndo) scUndo.addEventListener('click', function () { if (activeScratchCtrl) activeScratchCtrl.undo(); });
    const scClear = document.getElementById('btn-scratch-clear');
    if (scClear) scClear.addEventListener('click', function () { if (activeScratchCtrl) activeScratchCtrl.clear(); });

    // Modal
    [document.getElementById('btn-close-modal'), document.getElementById('btn-cancel-modal')].forEach(function (el) { if (el) el.addEventListener('click', function () { state.modal = null; render(); }); });
    const bd = document.getElementById('modal-backdrop');
    if (bd) bd.addEventListener('click', function (e) { if (e.target === bd) { state.modal = null; render(); } });
    document.querySelectorAll('[data-modal-level]').forEach(function (b) { b.addEventListener('click', function () { if (state.modal) { state.modal.chosenLevelId = b.getAttribute('data-modal-level'); render(); } }); });
    const confirmEnr = document.getElementById('btn-confirm-enroll');
    if (confirmEnr) {
      confirmEnr.addEventListener('click', function () {
        try {
          const ny = Store.enrollNextSchoolYear(state.db, account, state.modal.chosenLevelId);
          state.selectedYearId = ny.yearId; state.modal = null; state.view = 'dashboard'; render();
          showToast('Inscrit(e) en ' + ny.levelId + ' pour ' + ny.yearId + ' !');
        } catch (err) { showToast(err.message); }
      });
    }
  }

  async function handlePhotoUpload(file) {
    try { const res = await Gen.compressImageFile(file); state.studioPhoto.imageDataUrl = res.dataUrl; state.studioPhoto.fileName = res.fileName; render(); showToast('Photo prête !'); }
    catch (err) { showToast(err.message); }
  }

  function startAnimAutoPlay() {
    stopAnimTimer();
    activeAnimTimer = setInterval(function () {
      if (!state.activeAnimLesson || state.view !== 'ardoise' || state.ardoiseTab !== 'animated') {
        stopAnimTimer();
        state.animPlaying = false;
        return;
      }
      const max = state.activeAnimLesson.steps.length - 1;
      if (state.animStepIndex < max) {
        state.animStepIndex += 1;
        render();
      } else {
        stopAnimTimer();
        state.animPlaying = false;
        render();
      }
    }, 2600);
  }

  function resetExState() { state.exState = { selectedOption: null, textInput: '', revealedHints: 0, submitted: false, isCorrect: false }; }

  document.addEventListener('DOMContentLoaded', function () { render(); });
})(window);
