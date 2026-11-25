/* CapDevoirs — Main UI Controller (DA 3: Manuel Illustré & Index Latéral + Programme Officiel Éducation nationale) */
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

  const ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

  const state = {
    db: Store.loadDB(),
    accountId: Store.getSessionAccountId(),
    selectedYearId: null,
    view: 'dashboard',
    authTab: 'login',
    authError: '',
    regLevelId: 'CM2',
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
    officialApiState: {},
    studioTab: 'photo',
    studioPhoto: { subjectId: 'maths', chapter: '', notes: '', imageDataUrl: null, fileName: '', generating: false, draftPack: null },
    historyFilterSubject: 'all',
    modal: null
  };

  function getAccount() {
    if (!state.accountId) return null;
    return state.db.accounts.find(function (a) { return a.id === state.accountId; }) || null;
  }

  function getSelectedYear(account) {
    if (!account || !account.schoolYears || account.schoolYears.length === 0) return null;
    const targetId = state.selectedYearId || account.activeYearId;
    return account.schoolYears.find(function (y) { return y.yearId === targetId; }) || account.schoolYears[account.schoolYears.length - 1];
  }

  function isViewingArchivedYear(account, yearRec) {
    return Boolean(account && yearRec && yearRec.yearId !== account.activeYearId);
  }

  function esc(str) {
    return String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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
    const custom = (yearRec.customExercises || []).filter(function (e) { return subjectId === 'all' || !subjectId || e.subjectId === subjectId; });
    return custom.concat(builtIn);
  }

  function getAllMethodSheetsForYear(yearRec, subjectId) {
    const builtIn = Curr.getBuiltInMethodSheets(yearRec.levelId, subjectId === 'all' ? null : subjectId);
    const custom = (yearRec.customMethodSheets || []).filter(function (m) { return subjectId === 'all' || !subjectId || m.subjectId === subjectId; });
    return custom.concat(builtIn);
  }

  function getAllQuizzesForYear(yearRec, subjectId) {
    const builtIn = Curr.getBuiltInQuizzes(yearRec.levelId, subjectId === 'all' ? null : subjectId);
    const custom = (yearRec.customQuizzes || []).filter(function (q) { return subjectId === 'all' || !subjectId || q.subjectId === subjectId; });
    return custom.concat(builtIn);
  }

  function subjectBadgeHTML(subjectId) {
    const s = Curr.getSubjectDef(subjectId);
    return '<span class="badge" style="background:var(' + s.softVar + ');color:var(' + s.colorVar + ')">' + Icons.icon(s.icon, 13) + '<span>' + esc(s.short) + '</span></span>';
  }

  function ensureOfficialTextsLoaded(levelId, force) {
    const slot = state.officialApiState[levelId];
    if (!force && slot && (slot.loading || slot.data)) return;
    const cached = !force ? Prog.loadCachedTexts(levelId) : null;
    state.officialApiState[levelId] = { loading: true, data: cached };
    Prog.fetchOfficialMinistryTexts(levelId).then(function (data) {
      state.officialApiState[levelId] = { loading: false, data: data };
      if (state.view === 'program' || state.view === 'dashboard') render();
    });
  }

  function render() {
    const root = document.getElementById('app-root');
    if (!root) return;
    const account = getAccount();

    if (!account) {
      root.innerHTML = renderAuthScreen();
      bindAuthEvents();
      return;
    }

    const yearRec = getSelectedYear(account);
    if (!state.selectedYearId && yearRec) state.selectedYearId = yearRec.yearId;
    if (!Array.isArray(yearRec.completedAttenduCodes)) yearRec.completedAttenduCodes = [];

    const levelSubjects = Curr.getSubjectsForLevel(yearRec.levelId);
    if (!levelSubjects.some(function (s) { return s.id === state.studioPhoto.subjectId; })) {
      state.studioPhoto.subjectId = levelSubjects[0].id;
    }

    if (state.view === 'program') ensureOfficialTextsLoaded(yearRec.levelId, false);

    root.innerHTML = renderLexiconShell(account, yearRec);
    bindShellEvents(account, yearRec);
    hydrateAsyncPhotos();
  }

  function hydrateAsyncPhotos() {
    document.querySelectorAll('img[data-photo-ref]').forEach(function (img) {
      const ref = img.getAttribute('data-photo-ref');
      if (!ref) return;
      Store.loadPhoto(ref).then(function (url) { if (url) { img.src = url; img.style.display = 'block'; } });
    });
  }

  // ===========================
  // DA 3 AUTH SCREEN (FRONTISPIECE & STUDY PLATES)
  // ===========================
  function renderAuthScreen() {
    const now = Store.getEffectiveNow(state.db);
    const currentYearId = SY.getCurrentSchoolYearId(now);
    const isReg = state.authTab === 'register';

    const levelButtons = SY.LEVELS.map(function (lv) {
      const sel = state.regLevelId === lv.id ? ' is-selected' : '';
      return '<button type="button" class="level-choice' + sel + '" data-reg-level="' + lv.id + '" aria-pressed="' + (state.regLevelId === lv.id) + '"><strong>' + lv.label + '</strong><span>' + lv.cycle + '</span></button>';
    }).join('');

    const accountChips = state.db.accounts.map(function (acc) {
      const latestY = acc.schoolYears[acc.schoolYears.length - 1];
      return '<button type="button" class="account-chip" data-quick-user="' + esc(acc.username) + '"><span class="avatar-dot" style="background:' + esc(acc.avatarColor) + '">' + esc(acc.displayName.charAt(0).toUpperCase()) + '</span><span>' + esc(acc.displayName) + ' · ' + esc(latestY ? latestY.levelId : '') + '</span></button>';
    }).join('');

    return (
      '<div class="auth-screen">' +
      '<aside class="auth-frontispiece">' +
      '<div>' +
      '<div class="guide-rule-top"><span class="brand-serif">' + Icons.icon('logo', 22) + ' CapDevoirs · Manuel d’Étude</span><span>CYCLES 2, 3 &amp; 4 · CP → 3E</span></div>' +
      '<h1>Le carnet de référence pour chaque année scolaire</h1>' +
      '<p class="auth-lead">Devoirs du jour, exercices guidés avec fiches de méthode encadrées, quiz notés sur 20, import de photos de cours et référentiel officiel de l’Éducation nationale.</p>' +
      '<div class="auth-plate-showcase">' +
      '<div class="study-plate"><div class="study-plate-head plate-cobalt"><span>Planche I · Méthode &amp; Quiz</span></div><div class="study-plate-body"><p style="font-size:14px">Chaque exercice guidé se termine par sa fiche de méthode imprimable et son quiz de validation sur 20.</p></div></div>' +
      '<div class="study-plate"><div class="study-plate-head plate-vermilion"><span>Planche II · Index Multi-Années</span></div><div class="study-plate-body"><p style="font-size:14px">Toutes les années passées restent classées dans l’index latéral ; passage en N+1 ouvert dès le 1er mars.</p></div></div>' +
      '</div>' +
      '</div>' +
      '<div class="study-plate">' +
      '<div class="study-plate-head plate-emerald"><span>Découvrir immédiatement avec le carnet de Léa (CM2)</span></div>' +
      '<div class="study-plate-body" style="flex-direction:row;align-items:center;justify-content:space-between;flex-wrap:wrap">' +
      '<p style="font-size:14px;flex:1;min-width:200px">Inclut les archives CE2 (2024-2025), CM1 (2025-2026) et l’année en cours 2026-2027.</p>' +
      '<button type="button" class="btn btn-accent" id="btn-demo-login">' + Icons.icon('sparkles', 17) + '<span>Ouvrir le compte démo Léa</span></button>' +
      '</div>' +
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
          '<h2>Ouvrir mon manuel</h2>' +
          '<div class="field"><label for="login-user">Identifiant de l’élève</label><input class="input" id="login-user" name="username" autocomplete="username" placeholder="ex. lea" required></div>' +
          '<div class="field"><label for="login-pass">Mot de passe</label><div class="password-wrap"><input class="input" id="login-pass" name="password" type="password" autocomplete="current-password" placeholder="Ton mot de passe" required><button type="button" class="password-toggle" data-toggle-pass="login-pass" aria-label="Afficher ou masquer">' + Icons.icon('eye', 18) + '</button></div></div>' +
          '<button type="submit" class="btn btn-primary" style="width:100%">' + Icons.icon('arrowRight', 18) + '<span>Ouvrir mon carnet</span></button></form>' +
          (state.db.accounts.length > 0 ? '<div class="existing-accounts"><span class="field-help">Comptes sur cet appareil :</span><div class="account-chips">' + accountChips + '</div></div>' : '')
        : '<form class="auth-form" id="register-form">' +
          '<h2>Inscription ' + esc(currentYearId) + '</h2>' +
          '<div class="form-grid-2"><div class="field"><label for="reg-name">Prénom</label><input class="input" id="reg-name" name="displayName" placeholder="ex. Lucas" required></div>' +
          '<div class="field"><label for="reg-user">Identifiant</label><input class="input" id="reg-user" name="username" placeholder="ex. lucas" required></div></div>' +
          '<div class="field"><label for="reg-pass">Mot de passe (4 caractères min.)</label><div class="password-wrap"><input class="input" id="reg-pass" name="password" type="password" minlength="4" placeholder="Choisis un mot de passe" required><button type="button" class="password-toggle" data-toggle-pass="reg-pass" aria-label="Afficher ou masquer">' + Icons.icon('eye', 18) + '</button></div></div>' +
          '<div class="field"><label>Choisis ton niveau scolaire (obligatoire)</label><div class="level-picker-grid">' + levelButtons + '</div></div>' +
          '<button type="submit" class="btn btn-primary" style="width:100%">' + Icons.icon('graduation', 18) + '<span>Créer mon compte en ' + esc(state.regLevelId) + '</span></button></form>') +
      '</div>' +
      '</main>' +
      '</div>'
    );
  }

  function bindAuthEvents() {
    document.querySelectorAll('[data-auth-tab]').forEach(function (b) { b.addEventListener('click', function () { state.authTab = b.getAttribute('data-auth-tab'); state.authError = ''; render(); }); });
    document.querySelectorAll('[data-reg-level]').forEach(function (b) { b.addEventListener('click', function () { state.regLevelId = b.getAttribute('data-reg-level'); render(); }); });
    document.querySelectorAll('[data-toggle-pass]').forEach(function (b) {
      b.addEventListener('click', function () {
        const inp = document.getElementById(b.getAttribute('data-toggle-pass'));
        if (!inp) return;
        const show = inp.type === 'password';
        inp.type = show ? 'text' : 'password';
        b.innerHTML = Icons.icon(show ? 'eyeOff' : 'eye', 18);
      });
    });
    document.querySelectorAll('[data-quick-user]').forEach(function (c) {
      c.addEventListener('click', function () {
        const u = c.getAttribute('data-quick-user');
        const inp = document.getElementById('login-user');
        if (inp) { inp.value = u; const p = document.getElementById('login-pass'); if (u === 'lea' && p) p.placeholder = 'Mot de passe démo : soleil'; if (p) p.focus(); }
      });
    });
    const demoBtn = document.getElementById('btn-demo-login');
    if (demoBtn) demoBtn.addEventListener('click', async function () {
      try { const acc = await Store.loginAccount(state.db, 'lea', 'soleil'); state.accountId = acc.id; state.selectedYearId = acc.activeYearId; state.authError = ''; state.view = 'dashboard'; render(); showToast('Bienvenue Léa !'); }
      catch (err) { state.authError = err.message; render(); }
    });
    const lForm = document.getElementById('login-form');
    if (lForm) lForm.addEventListener('submit', async function (e) {
      e.preventDefault(); const fd = new FormData(lForm);
      try { const acc = await Store.loginAccount(state.db, fd.get('username'), fd.get('password')); state.accountId = acc.id; state.selectedYearId = acc.activeYearId; state.authError = ''; state.view = 'dashboard'; render(); }
      catch (err) { state.authError = err.message; render(); }
    });
    const rForm = document.getElementById('register-form');
    if (rForm) rForm.addEventListener('submit', async function (e) {
      e.preventDefault(); const fd = new FormData(rForm);
      try { const acc = await Store.registerAccount(state.db, { displayName: fd.get('displayName'), username: fd.get('username'), password: fd.get('password'), levelId: state.regLevelId }); state.accountId = acc.id; state.selectedYearId = acc.activeYearId; state.authError = ''; state.view = 'dashboard'; render(); showToast('Compte créé en ' + state.regLevelId + ' !'); }
      catch (err) { state.authError = err.message; render(); }
    });
  }

  // ===========================
  // DA 3 SHELL: RUNNING GUIDE HEADER + RIGHT THUMB-INDEX SHOULDER
  // ===========================
  function renderLexiconShell(account, yearRec) {
    const now = Store.getEffectiveNow(state.db);
    const enrollStatus = SY.getNextYearEnrollmentStatus(account, now);
    const pendingHw = (yearRec.homeworks || []).filter(function (h) { return !h.done; }).length;
    const archived = isViewingArchivedYear(account, yearRec);
    const isSim = Boolean(state.db.settings && state.db.settings.simulatedDate);
    const cycleMeta = Prog.getCycleMeta(yearRec.levelId);

    const navItems = [
      { id: 'dashboard', label: 'Sommaire' },
      { id: 'homework', label: 'Devoirs', badge: pendingHw > 0 ? pendingHw : null },
      { id: 'exercises', label: 'Exercices & Fiches' },
      { id: 'quizzes', label: 'Quiz' },
      { id: 'program', label: 'Programme officiel' },
      { id: 'studio', label: 'Photo de cours' },
      { id: 'history', label: 'Historique' }
    ];

    const navLinks = navItems.map(function (item) {
      const active = state.view === item.id ? ' is-active' : '';
      return '<button type="button" class="lex-nav-btn' + active + '" data-nav="' + item.id + '" aria-current="' + (state.view === item.id ? 'page' : 'false') + '"><span>' + item.label + '</span>' + (item.badge ? '<span class="lex-nav-count">' + item.badge + '</span>' : '') + '</button>';
    }).join('');

    const sortedYears = account.schoolYears.slice().sort(function (a, b) {
      return SY.parseSchoolYearStart(a.yearId) - SY.parseSchoolYearStart(b.yearId);
    });

    const thumbTabs = sortedYears.map(function (y) {
      const sel = y.yearId === yearRec.yearId ? ' is-selected' : '';
      const shortSpan = y.yearId.replace(/^20(\d{2})-20(\d{2})$/, '$1–$2');
      return (
        '<button type="button" class="thumb-tab' + sel + '" data-select-year="' + esc(y.yearId) + '" aria-pressed="' + (y.yearId === yearRec.yearId) + '" title="Année scolaire ' + esc(y.yearId) + ' (' + esc(y.levelId) + ')">' +
        '<strong>' + esc(y.levelId) + '</strong>' +
        '<span class="tabular">' + esc(shortSpan) + '</span>' +
        '</button>'
      );
    }).join('');

    const gateThumb =
      '<button type="button" class="thumb-tab is-gate' + (enrollStatus.isOpen ? ' is-open' : '') + '" id="btn-open-enroll-gate" title="Inscription année suivante (ouverture 1er mars)">' +
      Icons.icon(enrollStatus.isOpen ? 'unlock' : 'lock', 16) +
      '<strong>' + (enrollStatus.isOpen ? 'N+1' : '1er Mars') + '</strong>' +
      '<span>' + (enrollStatus.isOpen ? 'Ouvert' : 'J-' + enrollStatus.daysRemaining) + '</span>' +
      '</button>';

    const mobileNavItems = [
      { id: 'dashboard', label: 'Sommaire', icon: 'home' },
      { id: 'homework', label: 'Devoirs', icon: 'checklist' },
      { id: 'exercises', label: 'Fiches', icon: 'bookOpen' },
      { id: 'program', label: 'Éduscol', icon: 'graduation' },
      { id: 'history', label: 'Années', icon: 'history' }
    ];

    let viewContent = '';
    if (state.view === 'dashboard') viewContent = renderLexiconDashboard(account, yearRec, enrollStatus);
    else if (state.view === 'homework') viewContent = renderHomeworkView(account, yearRec);
    else if (state.view === 'exercises') viewContent = renderExercisesView(account, yearRec);
    else if (state.view === 'quizzes') viewContent = renderQuizzesView(account, yearRec);
    else if (state.view === 'program') viewContent = renderOfficialProgramView(account, yearRec);
    else if (state.view === 'studio') viewContent = renderStudioView(account, yearRec);
    else if (state.view === 'history') viewContent = renderHistoryView(account, yearRec, enrollStatus);
    else if (state.view === 'settings') viewContent = renderSettingsView(account, yearRec, enrollStatus);

    return (
      '<div class="lexicon-shell">' +
      '<div class="lexicon-main-col">' +
      '<header class="guide-header">' +
      '<div class="guide-header-top">' +
      '<span class="brand-serif">' + Icons.icon('logo', 19) + ' CapDevoirs · Manuel d’Étude</span>' +
      '<span>' + esc(cycleMeta.cycle.toUpperCase()) + ' — ' + esc(yearRec.levelId) + ' (' + esc(yearRec.yearId) + ') · ' + esc(account.displayName.toUpperCase()) + '</span>' +
      '<span>RÉFÉRENTIEL ÉDUSCOL</span>' +
      '</div>' +
      '<div class="guide-header-nav">' +
      '<nav class="lexicon-nav-links" aria-label="Navigation principale">' + navLinks + '</nav>' +
      '<div class="row-actions" style="padding:4px 0">' +
      '<button type="button" class="guide-utility-btn' + (isSim ? ' is-simulated' : '') + '" id="btn-date-pill" title="Date de référence pour le 1er mars">' + Icons.icon('calendar', 14) + '<span class="tabular">' + esc(SY.formatDateFR(now)) + (isSim ? ' (simulée)' : '') + '</span></button>' +
      '<button type="button" class="guide-utility-btn" data-nav="settings">' + Icons.icon('settings', 14) + '<span>' + esc(account.displayName) + '</span></button>' +
      '<button type="button" class="guide-utility-btn" id="btn-logout" aria-label="Se déconnecter">' + Icons.icon('logout', 14) + '</button>' +
      '</div>' +
      '</div>' +
      '</header>' +
      (archived
        ? '<div class="archive-banner" role="status">' +
          '<span>' + Icons.icon('archive', 17) + ' Volume archivé : <strong>' + esc(yearRec.yearId) + ' (' + esc(yearRec.levelId) + ')</strong> — consultable en lecture et révision.</span>' +
          '<button type="button" class="btn btn-secondary btn-sm" id="btn-back-active-year">Revenir à ' + esc(account.activeYearId) + '</button>' +
          '</div>'
        : '') +
      '<main class="workspace">' + viewContent + '</main>' +
      '</div>' +
      '<aside class="lexicon-shoulder" aria-label="Index latéral des années scolaires">' +
      '<div class="shoulder-heading">Index<br>Années</div>' +
      thumbTabs +
      gateThumb +
      '</aside>' +
      '<nav class="mobile-nav" aria-label="Navigation mobile">' +
      mobileNavItems.map(function (m) {
        return '<button type="button" class="mobile-nav-btn' + (state.view === m.id ? ' is-active' : '') + '" data-nav="' + m.id + '">' + Icons.icon(m.icon, 20) + '<span>' + m.label + '</span></button>';
      }).join('') +
      '</nav>' +
      (state.modal ? renderModal(account, yearRec, enrollStatus) : '') +
      '</div>'
    );
  }

  // ===========================
  // VIEW 1: DA 3 LEXICON SPREAD DASHBOARD
  // ===========================
  function renderLexiconDashboard(account, yearRec, enrollStatus) {
    const progress = Store.computeYearProgress(yearRec);
    const pendingHw = (yearRec.homeworks || []).filter(function (h) { return !h.done; });
    const avgDisplay = progress.overallAvgOn20 !== null ? String(progress.overallAvgOn20).replace('.', ',') + ' / 20' : '—';
    const allAttendus = Prog.getAttendusForLevel(yearRec.levelId, 'all');
    const doneAttendus = allAttendus.filter(function (a) { return (yearRec.completedAttenduCodes || []).indexOf(a.code) !== -1; }).length;

    const entriesHTML = progress.perSubject.map(function (item, idx) {
      const s = item.subject;
      const subjHw = pendingHw.filter(function (h) { return h.subjectId === s.id; });
      const scoreTxt = item.avgOn20 !== null ? String(item.avgOn20).replace('.', ',') + ' / 20' : item.masteryPercent + ' %';
      return (
        '<article class="lexicon-entry">' +
        '<div class="lexicon-entry-head">' +
        '<div class="lexicon-entry-title"><span class="lexicon-roman">' + (ROMANS[idx] || (idx + 1)) + '.</span>' + esc(s.name) + '</div>' +
        '<span class="lexicon-score tabular">' + esc(scoreTxt) + '</span>' +
        '</div>' +
        '<div class="lexicon-rule-bar"><div class="lexicon-rule-fill" style="width:' + Math.max(4, item.masteryPercent) + '%;background:var(' + s.colorVar + ')"></div></div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">' +
        '<span class="muted-text tabular">' + item.completedExercises + '/' + item.totalExercises + ' exercices · ' + item.readSheets + '/' + item.totalSheets + ' fiches méthode' + (subjHw.length ? ' · ' + subjHw.length + ' devoir à faire' : '') + '</span>' +
        '<div class="row-actions">' +
        '<button type="button" class="btn btn-secondary btn-sm" data-goto-subject-ex="' + s.id + '">Exercices &amp; Fiche</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-goto-subject-quiz="' + s.id + '">Quiz /20</button>' +
        '</div>' +
        '</div>' +
        '</article>'
      );
    }).join('');

    // Featured method sheet for the first subject
    const featuredSheets = getAllMethodSheetsForYear(yearRec, 'all');
    const spotlightSheet = featuredSheets[0] || null;

    return (
      '<div class="view-header">' +
      '<div>' +
      '<h1>Carnet de progression &amp; devoirs — ' + esc(yearRec.levelId) + '</h1>' +
      '<p>Chaque discipline réunit ses exercices guidés, ses planches de méthode encadrées et ses validations sur 20. Utilise l’index sur la tranche droite pour changer d’année scolaire.</p>' +
      '</div>' +
      '<div class="row-actions">' +
      '<span class="badge badge-teal tabular" style="padding:8px 12px;font-size:14px">Moyenne : ' + esc(avgDisplay) + ' · Maîtrise ' + progress.overallMastery + '%</span>' +
      '</div>' +
      '</div>' +
      '<div class="lexicon-spread">' +
      '<section>' +
      '<h2 style="margin-bottom:14px">Table des matières (' + progress.perSubject.length + ' disciplines)</h2>' +
      '<div class="lexicon-entries">' + entriesHTML + '</div>' +
      '<div class="row-actions" style="margin-top:24px">' +
      '<button type="button" class="btn btn-primary" data-nav="quizzes">' + Icons.icon('trophy', 17) + '<span>Lancer un quiz noté</span></button>' +
      '<button type="button" class="btn btn-secondary" data-nav="studio">' + Icons.icon('camera', 17) + '<span>Importer une photo de cours</span></button>' +
      '<button type="button" class="btn btn-ghost" data-nav="history">' + Icons.icon('history', 17) + '<span>Bilan multi-années</span></button>' +
      '</div>' +
      '</section>' +
      '<aside style="display:flex;flex-direction:column;gap:20px">' +
      '<div class="study-plate">' +
      '<div class="study-plate-head plate-cobalt"><span>Planche I — Agenda des devoirs</span><span class="tabular">' + pendingHw.length + ' à faire</span></div>' +
      '<div class="study-plate-body">' +
      (pendingHw.length === 0
        ? '<p class="muted-text">Tous les devoirs notés pour cette année sont terminés.</p>'
        : '<div class="hw-list">' + pendingHw.slice(0, 4).map(function (hw) {
            return '<div class="hw-item"><button type="button" class="hw-check" data-toggle-hw="' + esc(hw.id) + '" aria-label="Marquer terminé">' + Icons.icon('check', 14) + '</button><div class="hw-body"><div class="hw-title">' + esc(hw.title) + '</div><div class="hw-meta">' + subjectBadgeHTML(hw.subjectId) + (hw.dueDate ? '<span class="tabular">Pour le ' + esc(SY.formatShortDateFR(hw.dueDate)) + '</span>' : '') + '</div></div></div>';
          }).join('') + '</div>') +
      '<button type="button" class="btn btn-secondary btn-sm" style="align-self:flex-start" data-nav="homework">Ouvrir tous les devoirs</button>' +
      '</div>' +
      '</div>' +
      (spotlightSheet
        ? '<div class="study-plate">' +
          '<div class="study-plate-head plate-emerald"><span>Planche II — Méthode &amp; Éduscol</span><span class="tabular">' + doneAttendus + '/' + allAttendus.length + ' attendus</span></div>' +
          '<div class="study-plate-body">' +
          '<p style="font-size:14px"><strong>' + esc(spotlightSheet.title) + ' :</strong> ' + esc(spotlightSheet.essential) + '</p>' +
          '<div class="row-actions">' +
          '<button type="button" class="btn btn-secondary btn-sm" data-nav="program">Programme officiel ' + esc(yearRec.levelId) + '</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-goto-subject-ex="' + esc(spotlightSheet.subjectId) + '">Lire la fiche</button>' +
          '</div>' +
          '</div>' +
          '</div>'
        : '') +
      '<div class="study-plate">' +
      '<div class="study-plate-head ' + (enrollStatus.isOpen ? 'plate-vermilion' : 'plate-ochre') + '"><span>Planche III — Passage ' + esc(enrollStatus.targetYearId) + '</span><span>' + (enrollStatus.isOpen ? 'OUVERT' : '1ER MARS') + '</span></div>' +
      '<div class="study-plate-body">' +
      '<p style="font-size:14px">' +
      (enrollStatus.isOpen
        ? 'Les inscriptions pour <strong>' + esc(enrollStatus.targetYearId) + '</strong> sont ouvertes ! Choisis ton niveau (suggestion : <strong>' + esc(enrollStatus.suggestedLevelId) + '</strong>).'
        : 'Ouverture des inscriptions en <strong>' + esc(enrollStatus.targetYearId) + '</strong> dès le <strong>' + esc(enrollStatus.unlockDateLabel) + '</strong> (encore <strong class="tabular">' + enrollStatus.daysRemaining + ' jour(s)</strong>).') +
      '</p>' +
      '<button type="button" class="btn ' + (enrollStatus.isOpen ? 'btn-accent' : 'btn-secondary') + ' btn-sm" style="align-self:flex-start" id="btn-card-enroll">' + (enrollStatus.isOpen ? 'M’inscrire pour ' + esc(enrollStatus.targetYearId) : 'Voir les règles / Tester mars') + '</button>' +
      '</div>' +
      '</div>' +
      '</aside>' +
      '</div>'
    );
  }

  // ===========================
  // OFFICIAL PROGRAM VIEW
  // ===========================
  function renderOfficialProgramView(account, yearRec) {
    const cycleMeta = Prog.getCycleMeta(yearRec.levelId);
    const subjects = Curr.getSubjectsForLevel(yearRec.levelId);
    const attendus = Prog.getAttendusForLevel(yearRec.levelId, state.programFilterSubject);
    const doneCodes = yearRec.completedAttenduCodes || [];
    const apiSlot = state.officialApiState[yearRec.levelId] || { loading: false, data: Prog.loadCachedTexts(yearRec.levelId) };

    const subjPills = '<button type="button" class="filter-pill' + (state.programFilterSubject === 'all' ? ' is-active' : '') + '" data-prog-subj="all">Toutes</button>' +
      subjects.map(function (s) { return '<button type="button" class="filter-pill' + (state.programFilterSubject === s.id ? ' is-active' : '') + '" data-prog-subj="' + s.id + '">' + esc(s.short) + '</button>'; }).join('');

    const checkedCount = attendus.filter(function (a) { return doneCodes.indexOf(a.code) !== -1; }).length;
    const pct = attendus.length ? Math.round((checkedCount / attendus.length) * 100) : 0;

    let apiBadge = '<span class="badge badge-neutral">En attente</span>';
    if (apiSlot.loading) apiBadge = '<span class="badge badge-amber">Synchronisation…</span>';
    else if (apiSlot.data && apiSlot.data.source === 'live-api') apiBadge = '<span class="badge badge-success">En direct · data.education.gouv.fr</span>';
    else if (apiSlot.data && apiSlot.data.source === 'cache') apiBadge = '<span class="badge badge-info">Cache local</span>';
    else if (apiSlot.data && apiSlot.data.source === 'offline-fallback') apiBadge = '<span class="badge badge-warning">Hors-ligne</span>';

    const records = (apiSlot.data && apiSlot.data.records) ? apiSlot.data.records : [];

    return (
      '<div class="view-header">' +
      '<div><h1>Programme officiel — ' + esc(yearRec.levelId) + ' (' + esc(cycleMeta.cycle) + ')</h1><p>' + esc(cycleMeta.label) + ' · Attendus de fin d’année Éduscol et textes BOEN synchronisés via l’Open Data du Ministère.</p></div>' +
      '<div class="row-actions"><button type="button" class="btn btn-primary btn-sm" id="btn-sync-edunat">' + Icons.icon('history', 15) + '<span>Actualiser API Éducation nationale</span></button><a class="btn btn-secondary btn-sm" href="' + esc(cycleMeta.eduscolUrl) + '" target="_blank" rel="noopener noreferrer">Portail Éduscol ↗</a></div>' +
      '</div>' +
      '<div class="filter-bar">' + subjPills + '</div>' +
      '<div class="dash-top-grid">' +
      '<section class="panel"><div class="panel-header"><h2>Attendus de fin d’année (' + esc(yearRec.levelId) + ')</h2><span class="badge badge-teal tabular">' + checkedCount + '/' + attendus.length + ' (' + pct + '%)</span></div>' +
      '<div class="progress-track" style="margin-bottom:18px"><div class="progress-fill" style="width:' + pct + '%;background:var(--plate-emerald)"></div></div>' +
      '<div class="hw-list">' + attendus.map(function (att) {
        const isDone = doneCodes.indexOf(att.code) !== -1;
        return '<div class="hw-item' + (isDone ? ' is-done' : '') + '"><button type="button" class="hw-check' + (isDone ? ' is-done' : '') + '" data-toggle-attendu="' + esc(att.code) + '" aria-label="Cocher attendu">' + (isDone ? Icons.icon('check', 14) : '') + '</button><div class="hw-body"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span class="attendu-code">' + esc(att.code) + '</span>' + subjectBadgeHTML(att.subjectId) + '</div><div class="hw-title" style="margin-top:4px">' + esc(att.title) + '</div><p class="muted-text" style="margin-top:2px">' + esc(att.detail) + '</p></div><div class="row-actions"><button type="button" class="btn btn-secondary btn-sm" data-goto-subject-ex="' + esc(att.subjectId) + '">Exos</button><button type="button" class="btn btn-ghost btn-sm" data-goto-subject-quiz="' + esc(att.subjectId) + '">Quiz</button></div></div>';
      }).join('') + '</div></section>' +
      '<aside class="study-plate"><div class="study-plate-head plate-cobalt"><span>Textes officiels (BOEN)</span></div><div class="study-plate-body"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><code style="font-size:12px">' + esc(cycleMeta.dataset) + '</code>' + apiBadge + '</div>' +
      (records.length === 0 ? '<p class="muted-text">Chargement…</p>' : '<div class="hw-list">' + records.slice(0, 7).map(function (r) {
        return '<div class="hw-item"><div class="hw-body"><div class="hw-title" style="font-size:14px">' + esc(r.descriptif) + '</div><div class="hw-meta"><span class="badge badge-neutral">' + esc(r.discipline) + '</span>' + (r.abroge ? '<span class="badge badge-warning">Modifié ' + esc(r.abroge) + '</span>' : '<span class="badge badge-success">En vigueur</span>') + '</div></div><a class="btn btn-secondary btn-sm" href="' + esc(r.pdfUrl) + '" target="_blank" rel="noopener noreferrer">PDF ↗</a></div>';
      }).join('') + '</div>') +
      '</div></aside></div>'
    );
  }

  // ===========================
  // HOMEWORK, EXERCISES, QUIZZES, STUDIO, HISTORY, SETTINGS (DA 3 EDITORIAL STYLING)
  // ===========================
  function renderHomeworkView(account, yearRec) {
    const subjects = Curr.getSubjectsForLevel(yearRec.levelId);
    const archived = isViewingArchivedYear(account, yearRec);
    const list = (yearRec.homeworks || []).filter(function (hw) {
      if (state.hwFilterSubject !== 'all' && hw.subjectId !== state.hwFilterSubject) return false;
      if (state.hwFilterStatus === 'todo' && hw.done) return false;
      if (state.hwFilterStatus === 'done' && !hw.done) return false;
      return true;
    }).sort(function (a, b) { if (a.done !== b.done) return a.done ? 1 : -1; return String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999')); });

    const subjectOptions = subjects.map(function (s) { return '<option value="' + s.id + '">' + esc(s.name) + '</option>'; }).join('');
    const filterPills = '<button type="button" class="filter-pill' + (state.hwFilterSubject === 'all' ? ' is-active' : '') + '" data-hw-subj="all">Toutes</button>' +
      subjects.map(function (s) { return '<button type="button" class="filter-pill' + (state.hwFilterSubject === s.id ? ' is-active' : '') + '" data-hw-subj="' + s.id + '">' + esc(s.short) + '</button>'; }).join('');

    return (
      '<div class="view-header"><div><h1>Agenda des devoirs — ' + esc(yearRec.yearId) + ' (' + esc(yearRec.levelId) + ')</h1><p>Note tes devoirs, coche ce qui est accompli et ouvre directement les exercices et planches méthode.</p></div></div>' +
      '<div class="two-col-split">' +
      '<section class="study-plate"><div class="study-plate-head plate-ink"><span>Ajouter un devoir</span></div><div class="study-plate-body">' +
      (archived ? '<p class="muted-text">Volume archivé en consultation seule.</p>' :
        '<form id="hw-add-form" class="auth-form">' +
        '<div class="field"><label for="hw-subject">Discipline</label><select class="select" id="hw-subject" name="subjectId">' + subjectOptions + '</select></div>' +
        '<div class="field"><label for="hw-title">Intitulé</label><input class="input" id="hw-title" name="title" placeholder="ex. Exercices 4 et 5 p. 62" required></div>' +
        '<div class="form-grid-2"><div class="field"><label for="hw-due">Pour le</label><input class="input" id="hw-due" name="dueDate" type="date" value="' + esc(SY.toISODate(Store.getEffectiveNow(state.db))) + '"></div><div class="field"><label for="hw-prio">Priorité</label><select class="select" id="hw-prio" name="priority"><option value="normal">Normale</option><option value="haute">Prioritaire</option></select></div></div>' +
        '<div class="field"><label for="hw-notes">Notes</label><textarea class="textarea" id="hw-notes" name="notes" rows="3"></textarea></div>' +
        '<button type="submit" class="btn btn-primary">Inscrire dans l’agenda</button></form>') +
      '</div></section>' +
      '<section class="panel"><div class="panel-header"><div class="filter-bar"><button type="button" class="filter-pill' + (state.hwFilterStatus === 'all' ? ' is-active' : '') + '" data-hw-status="all">Tous</button><button type="button" class="filter-pill' + (state.hwFilterStatus === 'todo' ? ' is-active' : '') + '" data-hw-status="todo">À faire</button><button type="button" class="filter-pill' + (state.hwFilterStatus === 'done' ? ' is-active' : '') + '" data-hw-status="done">Terminés</button></div></div>' +
      '<div class="filter-bar" style="margin-bottom:18px">' + filterPills + '</div>' +
      (list.length === 0 ? '<p class="muted-text">Aucun devoir pour ce filtre.</p>' : '<div class="hw-list">' + list.map(function (hw) {
        return '<div class="hw-item' + (hw.done ? ' is-done' : '') + '"><button type="button" class="hw-check' + (hw.done ? ' is-done' : '') + '" data-toggle-hw="' + esc(hw.id) + '" aria-label="Basculer">' + (hw.done ? Icons.icon('check', 14) : '') + '</button><div class="hw-body"><div class="hw-title">' + esc(hw.title) + '</div>' + (hw.notes ? '<p class="muted-text">' + esc(hw.notes) + '</p>' : '') + '<div class="hw-meta">' + subjectBadgeHTML(hw.subjectId) + (hw.dueDate ? '<span class="tabular">Pour le ' + esc(SY.formatShortDateFR(hw.dueDate)) + '</span>' : '') + (hw.priority === 'haute' ? '<span class="badge badge-danger">Prioritaire</span>' : '') + '</div></div><div class="row-actions"><button type="button" class="btn btn-secondary btn-sm" data-goto-subject-ex="' + esc(hw.subjectId) + '">Exos</button>' + (!archived ? '<button type="button" class="btn btn-ghost btn-icon" data-delete-hw="' + esc(hw.id) + '" aria-label="Supprimer">' + Icons.icon('trash', 16) + '</button>' : '') + '</div></div>';
      }).join('') + '</div>') +
      '</section></div>'
    );
  }

  function renderExercisesView(account, yearRec) {
    const subjects = Curr.getSubjectsForLevel(yearRec.levelId);
    const exercises = getAllExercisesForYear(yearRec, state.exFilterSubject);
    const sheets = getAllMethodSheetsForYear(yearRec, state.exFilterSubject);
    let activeEx = exercises.find(function (e) { return e.id === state.activeExerciseId; });
    if (!activeEx && exercises.length > 0) { activeEx = exercises[0]; state.activeExerciseId = activeEx.id; }

    const subjPills = '<button type="button" class="filter-pill' + (state.exFilterSubject === 'all' ? ' is-active' : '') + '" data-ex-subj="all">Toutes</button>' +
      subjects.map(function (s) { return '<button type="button" class="filter-pill' + (state.exFilterSubject === s.id ? ' is-active' : '') + '" data-ex-subj="' + s.id + '">' + esc(s.short) + '</button>'; }).join('');

    return (
      '<div class="view-header"><div><h1>Exercices guidés &amp; Planches de méthode (' + esc(yearRec.levelId) + ')</h1><p>Réponds avec des indices progressifs puis retrouve la planche de méthode complète à la fin de l’exercice — ou lance le mode Entraînement infini.</p></div>' +
      '<div class="row-actions">' +
      '<button type="button" class="btn ' + (state.exTab === 'practice' ? 'btn-primary' : 'btn-secondary') + '" data-ex-tab="practice">Exercices (' + exercises.length + ')</button>' +
      '<button type="button" class="btn ' + (state.exTab === 'infinite' ? 'btn-accent' : 'btn-secondary') + '" data-ex-tab="infinite">' + Icons.icon('sparkles', 16) + '<span>Entraînement infini</span></button>' +
      '<button type="button" class="btn ' + (state.exTab === 'sheets' ? 'btn-primary' : 'btn-secondary') + '" data-ex-tab="sheets">Planches méthode (' + sheets.length + ')</button>' +
      '</div></div>' +
      (state.exTab === 'infinite'
        ? renderInfinitePracticeArea(yearRec)
        : '<div class="filter-bar">' + subjPills + '</div>' +
          (state.exTab === 'practice'
            ? renderExercisePracticeArea(yearRec, exercises, activeEx)
            : '<div style="display:flex;flex-direction:column;gap:20px">' + sheets.map(function (s) { return renderMethodSheetBlock(s, (yearRec.readMethodSheetIds || []).indexOf(s.id) !== -1, true); }).join('') + '</div>'))
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
      '<article class="study-plate">' +
      '<div class="study-plate-head plate-cobalt"><span>Entraînement infini — ' + esc(ex.chapter) + ' (' + esc(yearRec.levelId) + ')</span><button type="button" class="btn btn-secondary btn-sm" id="btn-new-inf-ex">Nouvel exercice ↻</button></div>' +
      '<div class="study-plate-body">' +
      '<h2>' + esc(ex.title) + '</h2>' +
      '<p style="font-size:1.1rem;font-weight:700">' + esc(ex.prompt) + '</p>' +
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
        ? '<button type="button" class="btn btn-primary" id="btn-submit-inf-ex">Vérifier ma réponse</button>'
        : '<button type="button" class="btn btn-accent" id="btn-next-inf-ex">Exercice suivant →</button>') +
      (hints.length > 0 && state.exState.revealedHints < hints.length && !state.exState.submitted
        ? '<button type="button" class="btn btn-secondary" id="btn-next-hint">Indice (' + (state.exState.revealedHints + 1) + '/' + hints.length + ')</button>'
        : '') +
      '</div>' +
      (shownHints.length > 0 ? '<div class="hint-box"><strong>Indices</strong><ul style="margin:6px 0 0;padding-left:18px">' + shownHints.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul></div>' : '') +
      (state.exState.submitted
        ? '<div class="feedback-box ' + (state.exState.isCorrect ? 'is-success' : 'is-error') + '" role="status"><strong>' + (state.exState.isCorrect ? 'Bravo, bonne réponse ! (+1 série)' : 'Réponse attendue : ' + esc(ex.answer)) + '</strong><p style="margin-top:6px">' + esc(ex.explanation) + '</p></div>' +
          (ex.methodSheet ? renderMethodSheetBlock(ex.methodSheet, (yearRec.readMethodSheetIds || []).indexOf(ex.methodSheet.id) !== -1, true) : '')
        : '') +
      '</div></article>'
    );
  }

  function renderExercisePracticeArea(yearRec, exercises, activeEx) {
    if (exercises.length === 0) return '<section class="panel"><p class="muted-text">Aucun exercice ici.</p></section>';
    const listHTML = exercises.map(function (ex) {
      const done = (yearRec.completedExerciseIds || []).indexOf(ex.id) !== -1;
      return '<button type="button" class="list-entry' + (activeEx && activeEx.id === ex.id ? ' is-selected' : '') + '" data-select-ex="' + esc(ex.id) + '"><div style="display:flex;justify-content:space-between;gap:8px;width:100%">' + subjectBadgeHTML(ex.subjectId) + (done ? '<span class="badge badge-success">Réussi</span>' : '<span class="badge badge-neutral">' + esc(ex.difficulty || 'Moyen') + '</span>') + '</div><strong>' + esc(ex.title) + '</strong><span class="muted-text">' + esc(ex.chapter || '') + '</span></button>';
    }).join('');

    const hints = activeEx.hints || [];
    const shownHints = hints.slice(0, state.exState.revealedHints);
    let interactionHTML = '';
    if (activeEx.type === 'choice' && Array.isArray(activeEx.options)) {
      const letters = ['A', 'B', 'C', 'D'];
      interactionHTML = '<div class="option-stack">' + activeEx.options.map(function (opt, idx) {
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
      '<div class="two-col-split"><div class="item-list">' + listHTML + '</div><article class="panel">' +
      '<div class="panel-header"><div class="row-actions">' + subjectBadgeHTML(activeEx.subjectId) + '<span class="badge badge-neutral">' + esc(activeEx.chapter || '') + '</span></div></div>' +
      '<h2>' + esc(activeEx.title) + '</h2><p style="margin-top:12px;font-size:1.08rem;font-weight:700">' + esc(activeEx.prompt) + '</p>' +
      (activeEx.photoRef ? '<div style="margin-top:14px"><img class="photo-preview-img" data-photo-ref="' + esc(activeEx.photoRef) + '" alt="Photo du cours" style="display:none;max-height:190px"></div>' : '') +
      interactionHTML +
      '<div class="row-actions">' +
      (!state.exState.submitted ? '<button type="button" class="btn btn-primary" id="btn-submit-ex">Vérifier ma réponse</button>' : '<button type="button" class="btn btn-secondary" id="btn-retry-ex">Refaire</button>') +
      (hints.length > 0 && state.exState.revealedHints < hints.length && !state.exState.submitted ? '<button type="button" class="btn btn-secondary" id="btn-next-hint">Indice (' + (state.exState.revealedHints + 1) + '/' + hints.length + ')</button>' : '') +
      '</div>' +
      (shownHints.length > 0 ? '<div class="hint-box"><strong>Indices</strong><ul style="margin:6px 0 0;padding-left:18px">' + shownHints.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul></div>' : '') +
      (state.exState.submitted
        ? '<div class="feedback-box ' + (state.exState.isCorrect ? 'is-success' : 'is-error') + '" role="status"><strong>' + (state.exState.isCorrect ? 'Bravo, bonne réponse !' : 'Réponse attendue : ' + esc(activeEx.answer)) + '</strong><p style="margin-top:6px">' + esc(activeEx.explanation) + '</p></div>' +
          (sheet ? renderMethodSheetBlock(sheet, isSheetRead, true) : '')
        : '') +
      '</article></div>'
    );
  }

  function renderMethodSheetBlock(sheet, isRead, showQuizCta) {
    return (
      '<section class="method-sheet">' +
      '<div class="method-sheet-banner"><h3>Planche méthode : ' + esc(sheet.title) + '</h3>' +
      '<div class="row-actions"><button type="button" class="btn btn-sm ' + (isRead ? 'btn-secondary' : 'btn-accent') + '" data-mark-sheet="' + esc(sheet.id) + '">' + (isRead ? 'Fiche révisée' : 'Valider cette fiche') + '</button><button type="button" class="btn btn-secondary btn-sm" onclick="window.print()">Imprimer</button></div></div>' +
      '<div class="method-sheet-inner">' +
      '<div class="method-callout"><strong>L’essentiel :</strong> ' + esc(sheet.essential) + '</div>' +
      '<div><strong>Étapes clés :</strong><ol class="method-sheet-steps" style="margin-top:6px">' + (sheet.steps || []).map(function (st) { return '<li>' + esc(st) + '</li>'; }).join('') + '</ol></div>' +
      '<div class="form-grid-2"><div class="method-callout"><strong>Piège à éviter :</strong> ' + esc(sheet.pitfall) + '</div><div class="method-callout"><strong>Exemple :</strong> ' + esc(sheet.example) + '</div></div>' +
      (sheet.photoRef ? '<div><img class="photo-preview-img" style="display:none;max-height:220px" data-photo-ref="' + esc(sheet.photoRef) + '" alt="Photo du cours"></div>' : '') +
      (showQuizCta ? '<div class="row-actions"><button type="button" class="btn btn-cobalt" data-goto-subject-quiz="' + esc(sheet.subjectId) + '">Valider mes acquis avec le quiz /20</button></div>' : '') +
      '</div></section>'
    );
  }

  function renderQuizzesView(account, yearRec) {
    if (state.activeQuiz) return renderActiveQuizRunner(yearRec, state.activeQuiz);
    const subjects = Curr.getSubjectsForLevel(yearRec.levelId);
    const quizzes = getAllQuizzesForYear(yearRec, state.quizFilterSubject);
    const subjPills = '<button type="button" class="filter-pill' + (state.quizFilterSubject === 'all' ? ' is-active' : '') + '" data-quiz-subj="all">Toutes</button>' +
      subjects.map(function (s) { return '<button type="button" class="filter-pill' + (state.quizFilterSubject === s.id ? ' is-active' : '') + '" data-quiz-subj="' + s.id + '">' + esc(s.short) + '</button>'; }).join('');
    const recent = (yearRec.quizAttempts || []).slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); }).slice(0, 8);
    return (
      '<div class="view-header"><div><h1>Quiz &amp; validation des acquis (' + esc(yearRec.levelId) + ')</h1><p>Valide tes connaissances dans chaque discipline — ou lance un Quiz Express de 6 questions renouvelées à l’infini.</p></div></div>' +
      '<section class="study-plate">' +
      '<div class="study-plate-head plate-vermilion"><span>Quiz Express Infini — 6 questions neuves notées /20 (' + esc(yearRec.levelId) + ')</span><span>ALÉATOIRE</span></div>' +
      '<div class="study-plate-body" style="flex-direction:row;align-items:center;justify-content:space-between;flex-wrap:wrap">' +
      '<p style="font-size:14px;flex:1;min-width:220px">Chaque lancement génère une série inédite de 6 questions adaptées au niveau <strong>' + esc(yearRec.levelId) + '</strong> et enregistre ta note sur 20 dans l’historique.</p>' +
      '<div class="row-actions">' +
      '<button type="button" class="btn btn-cobalt btn-sm" data-start-express-quiz="maths">Quiz Maths (6 q.)</button>' +
      '<button type="button" class="btn btn-primary btn-sm" data-start-express-quiz="francais">Quiz Français (6 q.)</button>' +
      '<button type="button" class="btn btn-secondary btn-sm" data-start-express-quiz="anglais">Quiz Anglais (6 q.)</button>' +
      '</div></div></section>' +
      '<div class="filter-bar">' + subjPills + '</div>' +
      '<section class="panel"><h2 style="margin-bottom:14px">Quiz du programme (' + esc(yearRec.levelId) + ')</h2><div class="subject-rows">' +
      quizzes.map(function (q) {
        const attempts = (yearRec.quizAttempts || []).filter(function (a) { return a.quizId === q.id; });
        const best = attempts.length ? Math.max.apply(null, attempts.map(function (a) { return a.scoreOn20; })) : null;
        return '<div class="subject-row"><div class="subject-id-cell">' + subjectBadgeHTML(q.subjectId) + '<div><strong>' + esc(q.title) + '</strong><div class="muted-text">' + esc(q.chapter || '') + ' · ' + q.questions.length + ' questions</div></div></div><div class="tabular">' + (best !== null ? '<span class="badge ' + (best >= 16 ? 'badge-success' : best >= 10 ? 'badge-warning' : 'badge-danger') + '">Meilleur : ' + String(best).replace('.', ',') + '/20</span>' : '<span class="badge badge-neutral">À passer</span>') + '</div><button type="button" class="btn btn-primary btn-sm" data-start-quiz="' + esc(q.id) + '">Lancer</button></div>';
      }).join('') + '</div></section>' +
      '<section class="panel"><h2 style="margin-bottom:14px">Relevé des notes — ' + esc(yearRec.yearId) + '</h2>' +
      (recent.length === 0 ? '<p class="muted-text">Aucun quiz validé sur cette année.</p>' :
        '<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>Discipline</th><th>Quiz</th><th>Score</th><th>Note / 20</th></tr></thead><tbody>' +
        recent.map(function (a) { return '<tr><td class="tabular">' + esc(SY.formatShortDateFR(a.date)) + '</td><td>' + subjectBadgeHTML(a.subjectId) + '</td><td>' + esc(a.title) + '</td><td class="tabular">' + a.score + '/' + a.total + ' (' + a.percent + '%)</td><td class="tabular"><strong>' + String(a.scoreOn20).replace('.', ',') + '/20</strong></td></tr>'; }).join('') +
        '</tbody></table></div>') + '</section>'
    );
  }

  function renderActiveQuizRunner(yearRec, quiz) {
    const run = state.quizRun;
    if (run.finished && run.lastResult) {
      const res = run.lastResult;
      return (
        '<section class="study-plate"><div class="study-plate-head plate-cobalt"><span>Résultat du quiz — ' + esc(quiz.title) + '</span><span class="tabular">' + String(res.scoreOn20).replace('.', ',') + ' / 20 (' + res.percent + '%)</span></div><div class="study-plate-body">' +
        '<div class="hw-list">' + quiz.questions.map(function (q, idx) {
          const chosen = run.answers[idx];
          const ok = normalizeAnswer(chosen) === normalizeAnswer(q.answer);
          return '<div class="hw-item"><span class="badge ' + (ok ? 'badge-success' : 'badge-danger') + '">' + (ok ? 'Juste' : 'À revoir') + '</span><div class="hw-body"><div class="hw-title">' + (idx + 1) + '. ' + esc(q.prompt) + '</div><p class="muted-text">Ta réponse : <strong>' + esc(chosen || '—') + '</strong>' + (!ok ? ' · Attendu : <strong>' + esc(q.answer) + '</strong>' : '') + '</p><p style="font-size:14px">' + esc(q.explanation) + '</p></div></div>';
        }).join('') + '</div>' +
        '<div class="row-actions" style="margin-top:16px"><button type="button" class="btn btn-primary" id="btn-quit-quiz">Retour aux quiz</button><button type="button" class="btn btn-secondary" data-start-quiz="' + esc(quiz.id) + '">Refaire</button></div></div></section>'
      );
    }
    const q = quiz.questions[run.index];
    const pct = Math.round(((run.index + 1) / quiz.questions.length) * 100);
    const chosen = run.answers[run.index] || null;
    const letters = ['A', 'B', 'C', 'D'];
    return (
      '<section class="panel"><div class="panel-header"><div class="row-actions">' + subjectBadgeHTML(quiz.subjectId) + '<strong>' + esc(quiz.title) + '</strong></div><button type="button" class="btn btn-ghost btn-sm" id="btn-quit-quiz">Quitter</button></div>' +
      '<div class="subject-bar-meta"><span class="tabular">Question ' + (run.index + 1) + ' / ' + quiz.questions.length + '</span><span class="tabular">' + pct + '%</span></div>' +
      '<div class="progress-track" style="margin-bottom:20px"><div class="progress-fill" style="width:' + pct + '%;background:var(--plate-cobalt)"></div></div>' +
      '<h2>' + esc(q.prompt) + '</h2><div class="option-stack">' + q.options.map(function (opt, idx) {
        return '<button type="button" class="choice-btn' + (chosen === opt ? ' is-selected' : '') + '" data-quiz-choice="' + esc(opt) + '"><span class="choice-letter">' + (letters[idx] || idx + 1) + '</span><span>' + esc(opt) + '</span></button>';
      }).join('') + '</div>' +
      '<div class="row-actions" style="justify-content:space-between"><button type="button" class="btn btn-secondary" id="btn-quiz-prev"' + (run.index === 0 ? ' disabled' : '') + '>Précédent</button><button type="button" class="btn btn-primary" id="btn-quiz-next"' + (!chosen ? ' disabled' : '') + '>' + (run.index === quiz.questions.length - 1 ? 'Calculer ma note /20' : 'Suivante') + '</button></div></section>'
    );
  }

  function renderStudioView(account, yearRec) {
    const subjects = Curr.getSubjectsForLevel(yearRec.levelId);
    const sp = state.studioPhoto;
    if (isViewingArchivedYear(account, yearRec)) {
      return '<section class="panel"><h1>Photo de cours</h1><p class="muted-text" style="margin-top:8px">Reviens à l’année active (' + esc(account.activeYearId) + ') pour créer des exercices.</p><button type="button" class="btn btn-primary" style="margin-top:14px" id="btn-back-active-year">Revenir à ' + esc(account.activeYearId) + '</button></section>';
    }
    const opts = subjects.map(function (s) { return '<option value="' + s.id + '"' + (sp.subjectId === s.id ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('');
    return (
      '<div class="view-header"><div><h1>Photo de cours &amp; Création d’exercices</h1><p>Transforme une photo de cahier ou tes notes en planche de méthode, exercices guidés et quiz.</p></div>' +
      '<div class="row-actions"><button type="button" class="btn ' + (state.studioTab === 'photo' ? 'btn-primary' : 'btn-secondary') + '" data-studio-tab="photo">Photo → Pack révision</button><button type="button" class="btn ' + (state.studioTab === 'manual' ? 'btn-primary' : 'btn-secondary') + '" data-studio-tab="manual">Exercice manuel</button></div></div>' +
      (state.studioTab === 'photo'
        ? '<div class="two-col-split"><section class="study-plate"><div class="study-plate-head plate-ochre"><span>1. Importer ton cours</span></div><div class="study-plate-body"><form id="photo-gen-form" class="auth-form">' +
          '<div class="field"><label for="studio-subj">Discipline</label><select class="select" id="studio-subj" name="subjectId">' + opts + '</select></div>' +
          '<div class="field"><label for="studio-chapter">Chapitre</label><input class="input" id="studio-chapter" name="chapter" value="' + esc(sp.chapter) + '" placeholder="ex. Les triangles particuliers" required></div>' +
          '<div class="field"><label>Photo du cahier</label><div class="upload-zone" id="photo-dropzone">' + (sp.imageDataUrl ? '<img src="' + sp.imageDataUrl + '" alt="Aperçu" class="photo-preview-img"><button type="button" class="btn btn-secondary btn-sm" id="btn-clear-photo">Changer</button>' : Icons.icon('image', 30) + '<strong>Clique ou glisse une photo ici</strong><input type="file" id="photo-file-input" accept="image/*" capture="environment" class="sr-only">') + '</div></div>' +
          '<div class="field"><div style="display:flex;justify-content:space-between;align-items:center"><label for="studio-notes">Notions clés</label><button type="button" class="btn btn-ghost btn-sm" id="btn-fill-sample-course">Exemple de cours</button></div><textarea class="textarea" id="studio-notes" name="notes" rows="4">' + esc(sp.notes) + '</textarea></div>' +
          '<button type="submit" class="btn btn-primary">Générer planche méthode + exercices + quiz</button></form></div></section>' +
          '<section class="panel"><h2 style="margin-bottom:14px">2. Aperçu éditable</h2>' +
          (sp.draftPack
            ? '<form id="save-pack-form" class="auth-form"><span class="badge badge-success" style="align-self:flex-start">1 fiche · ' + sp.draftPack.exercises.length + ' exercices · 1 quiz</span><div class="field"><label>Titre fiche</label><input class="input" name="msTitle" value="' + esc(sp.draftPack.methodSheet.title) + '" required></div><div class="field"><label>L’essentiel</label><textarea class="textarea" name="msEssential" rows="2">' + esc(sp.draftPack.methodSheet.essential) + '</textarea></div><div class="field"><label>Étapes clés</label><textarea class="textarea" name="msSteps" rows="3">' + esc((sp.draftPack.methodSheet.steps || []).join('\n')) + '</textarea></div><div class="field"><label>Piège</label><input class="input" name="msPitfall" value="' + esc(sp.draftPack.methodSheet.pitfall) + '"></div><div class="row-actions"><button type="submit" class="btn btn-accent">Enregistrer dans mon année</button><button type="button" class="btn btn-ghost" id="btn-discard-draft">Effacer</button></div></form>'
            : '<p class="muted-text">Importe une photo ou saisis des notions puis clique sur <strong>Générer</strong>.</p>') +
          '</section></div>'
        : '<section class="panel" style="max-width:760px"><h2 style="margin-bottom:14px">Nouvel exercice manuel</h2><form id="manual-ex-form" class="auth-form"><div class="form-grid-2"><div class="field"><label>Discipline</label><select class="select" name="subjectId">' + opts + '</select></div><div class="field"><label>Chapitre</label><input class="input" name="chapter" required></div></div><div class="field"><label>Titre</label><input class="input" name="title" required></div><div class="field"><label>Énoncé</label><textarea class="textarea" name="prompt" rows="2" required></textarea></div><div class="form-grid-2"><div class="field"><label>Bonne réponse</label><input class="input" name="answer" required></div><div class="field"><label>Autres choix QCM (;)</label><input class="input" name="wrongOptions"></div></div><div class="field"><label>Indice</label><input class="input" name="hint"></div><div class="field"><label>Explication</label><input class="input" name="explanation" required></div><div class="field"><label>Astuce fiche méthode</label><input class="input" name="methodTip"></div><button type="submit" class="btn btn-primary">Enregistrer</button></form></section>')
    );
  }

  function renderHistoryView(account, yearRec, enrollStatus) {
    const sortedYears = account.schoolYears.slice().sort(function (a, b) { return SY.parseSchoolYearStart(a.yearId) - SY.parseSchoolYearStart(b.yearId); });
    const multiYearStats = sortedYears.map(function (y) { const p = Store.computeYearProgress(y); return { yearId: y.yearId, levelId: y.levelId, overallMastery: p.overallMastery, overallAvgOn20: p.overallAvgOn20, isSelected: y.yearId === yearRec.yearId }; });
    const selectedProgress = Store.computeYearProgress(yearRec);
    const subjects = Curr.getSubjectsForLevel(yearRec.levelId);
    const logEntries = (yearRec.activityLog || []).filter(function (e) { return state.historyFilterSubject === 'all' || e.subjectId === state.historyFilterSubject; });
    const subjPills = '<button type="button" class="filter-pill' + (state.historyFilterSubject === 'all' ? ' is-active' : '') + '" data-hist-subj="all">Toutes</button>' +
      subjects.map(function (s) { return '<button type="button" class="filter-pill' + (state.historyFilterSubject === s.id ? ' is-active' : '') + '" data-hist-subj="' + s.id + '">' + esc(s.short) + '</button>'; }).join('');

    return (
      '<div class="view-header"><div><h1>Historique multi-années &amp; bilans</h1><p>Consulte chaque volume annuel passé ou en cours grâce à l’index sur la tranche droite.</p></div></div>' +
      '<div class="dash-top-grid">' +
      '<section class="study-plate"><div class="study-plate-head plate-cobalt"><span>Planche graphique — Évolution sur ' + sortedYears.length + ' année(s)</span></div><div class="study-plate-body">' + Charts.renderMultiYearChart(multiYearStats) + '</div></section>' +
      '<section class="study-plate"><div class="study-plate-head ' + (enrollStatus.isOpen ? 'plate-vermilion' : 'plate-ochre') + '"><span>Inscription ' + esc(enrollStatus.targetYearId) + '</span></div><div class="study-plate-body"><p style="font-size:14px">' + (enrollStatus.isOpen ? 'Ouvert ! Choisis ton niveau pour ' + esc(enrollStatus.targetYearId) + '.' : 'Ouverture le ' + esc(enrollStatus.unlockDateLabel) + ' (J-' + enrollStatus.daysRemaining + ').') + '</p><button type="button" class="btn ' + (enrollStatus.isOpen ? 'btn-accent' : 'btn-secondary') + ' btn-sm" style="align-self:flex-start" id="btn-card-enroll">' + (enrollStatus.isOpen ? 'S’inscrire maintenant' : 'Voir / Tester mars') + '</button></div></section>' +
      '</div>' +
      '<section class="panel"><div class="panel-header"><h2>Bilan par discipline — ' + esc(yearRec.yearId) + ' (' + esc(yearRec.levelId) + ')</h2><span class="badge badge-teal tabular">Moyenne : ' + (selectedProgress.overallAvgOn20 !== null ? String(selectedProgress.overallAvgOn20).replace('.', ',') + '/20' : '—') + '</span></div>' +
      '<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Discipline</th><th>Maîtrise</th><th>Moyenne Quiz</th><th>Exercices</th><th>Fiches</th><th>Devoirs</th><th>Statut</th></tr></thead><tbody>' +
      selectedProgress.perSubject.map(function (i) {
        return '<tr><td>' + subjectBadgeHTML(i.subject.id) + '</td><td class="tabular"><strong>' + i.masteryPercent + '%</strong></td><td class="tabular">' + (i.avgOn20 !== null ? String(i.avgOn20).replace('.', ',') + '/20' : '—') + '</td><td class="tabular">' + i.completedExercises + '/' + i.totalExercises + '</td><td class="tabular">' + i.readSheets + '/' + i.totalSheets + '</td><td class="tabular">' + i.doneHomeworks + '/' + i.totalHomeworks + '</td><td><span class="badge badge-' + i.statusTone + '">' + esc(i.statusLabel) + '</span></td></tr>';
      }).join('') + '</tbody></table></div></section>' +
      '<section class="study-plate"><div class="study-plate-head plate-emerald"><span>Planche graphique — Courbe des notes (' + esc(yearRec.yearId) + ')</span></div><div class="study-plate-body">' + Charts.renderQuizTrendChart(yearRec.quizAttempts) + '</div></section>' +
      '<section class="panel"><h2 style="margin-bottom:12px">Journal chronologique</h2><div class="filter-bar" style="margin-bottom:16px">' + subjPills + '</div>' +
      (logEntries.length === 0 ? '<p class="muted-text">Aucune activité.</p>' : '<div class="hw-list">' + logEntries.slice(0, 20).map(function (e) {
        return '<div class="hw-item">' + subjectBadgeHTML(e.subjectId) + '<div class="hw-body"><div class="hw-title">' + esc(e.title) + '</div><div class="hw-meta"><span>' + esc(e.detail) + '</span> · <span class="tabular">' + esc(SY.formatShortDateFR(e.date)) + '</span></div></div>' + (e.scoreText ? '<span class="badge badge-teal tabular">' + esc(e.scoreText) + '</span>' : '') + '</div>';
      }).join('') + '</div>') + '</section>'
    );
  }

  function renderSettingsView(account, yearRec, enrollStatus) {
    const sim = state.db.settings.simulatedDate || '';
    const latestStart = SY.parseSchoolYearStart(enrollStatus.latestYearId);
    const febTest = (latestStart + 1) + '-02-15';
    const marTest = (latestStart + 1) + '-03-10';
    return (
      '<div class="view-header"><div><h1>Compte &amp; Réglages</h1><p>Mot de passe, sauvegarde JSON et simulateur de date pour la règle d’inscription de mars.</p></div></div>' +
      '<div class="dash-top-grid">' +
      '<section class="panel"><h2 style="margin-bottom:14px">Modifier mon mot de passe</h2><form id="change-pass-form" class="auth-form"><div class="field"><label>Ancien mot de passe</label><input class="input" name="oldPass" type="password" required></div><div class="field"><label>Nouveau mot de passe</label><input class="input" name="newPass" type="password" minlength="4" required></div><button type="submit" class="btn btn-primary">Mettre à jour</button></form>' +
      '<hr style="border:none;border-top:1px solid var(--color-border);margin:24px 0"><h2 style="margin-bottom:10px">Sauvegarde JSON</h2><div class="row-actions"><button type="button" class="btn btn-secondary" id="btn-export-json">Exporter</button><label class="btn btn-secondary" for="import-json-input" style="cursor:pointer">Importer</label><input type="file" id="import-json-input" accept="application/json" class="sr-only"></div></section>' +
      '<div style="display:flex;flex-direction:column;gap:20px">' +
      '<section class="study-plate"><div class="study-plate-head plate-ochre"><span>Simulateur de date (règle du 1er mars)</span></div><div class="study-plate-body"><div class="row-actions"><button type="button" class="btn btn-secondary btn-sm" data-set-sim-date="' + febTest + '">15 févr. ' + (latestStart + 1) + ' (Verrouillé)</button><button type="button" class="btn btn-accent btn-sm" data-set-sim-date="' + marTest + '">10 mars ' + (latestStart + 1) + ' (Ouvert !)</button><button type="button" class="btn btn-ghost btn-sm" data-set-sim-date="">Date réelle</button></div><div class="field"><label>Date libre</label><input class="input" id="sim-date-input" type="date" value="' + esc(sim) + '"></div></div></section>' +
      '<section class="panel"><h2 style="margin-bottom:10px">Option Vision IA (facultative)</h2><form id="api-key-form" class="auth-form"><div class="field"><label>Clé API Gemini (locale)</label><input class="input" id="gemini-key-input" type="password" value="' + esc(state.db.settings.geminiApiKey || '') + '" placeholder="AIza..."></div><button type="submit" class="btn btn-secondary btn-sm" style="align-self:flex-start">Enregistrer</button></form></section>' +
      '</div></div>'
    );
  }

  function renderModal(account, yearRec, enrollStatus) {
    if (state.modal.type !== 'enroll') return '';
    const chosen = state.modal.chosenLevelId || enrollStatus.suggestedLevelId;
    const latestStart = SY.parseSchoolYearStart(enrollStatus.latestYearId);
    const febTest = (latestStart + 1) + '-02-15';
    const marTest = (latestStart + 1) + '-03-10';
    const levelGrid = SY.LEVELS.map(function (lv) {
      return '<button type="button" class="level-choice' + (chosen === lv.id ? ' is-selected' : '') + '" data-modal-level="' + lv.id + '"><strong>' + lv.label + '</strong><span>' + (lv.id === enrollStatus.suggestedLevelId ? 'Suggéré' : lv.cycle) + '</span></button>';
    }).join('');
    return (
      '<div class="modal-backdrop" id="modal-backdrop" role="dialog" aria-modal="true"><div class="modal-box">' +
      '<div class="panel-header" style="margin-bottom:0"><h2>' + (enrollStatus.isOpen ? 'Inscription ' + esc(enrollStatus.targetYearId) : 'Inscription ' + esc(enrollStatus.targetYearId) + ' verrouillée') + '</h2><button type="button" class="btn btn-ghost btn-icon" id="btn-close-modal">' + Icons.icon('x', 20) + '</button></div>' +
      (enrollStatus.isOpen
        ? '<p>Choisis obligatoirement ton niveau pour l’année <strong>' + esc(enrollStatus.targetYearId) + '</strong>.</p><div class="level-picker-grid">' + levelGrid + '</div><div class="row-actions" style="justify-content:flex-end"><button type="button" class="btn btn-secondary" id="btn-cancel-modal">Annuler</button><button type="button" class="btn btn-accent" id="btn-confirm-enroll">Valider en ' + esc(chosen) + '</button></div>'
        : '<div class="method-callout"><p>Ouverture des inscriptions pour <strong>' + esc(enrollStatus.targetYearId) + '</strong> le <strong>' + esc(enrollStatus.unlockDateLabel) + '</strong> (J-' + enrollStatus.daysRemaining + ').</p></div><div class="row-actions"><button type="button" class="btn btn-accent btn-sm" data-set-sim-date="' + marTest + '">Simuler 10 mars ' + (latestStart + 1) + '</button><button type="button" class="btn btn-secondary btn-sm" data-set-sim-date="' + febTest + '">15 févr. ' + (latestStart + 1) + '</button><button type="button" class="btn btn-ghost btn-sm" data-set-sim-date="">Date réelle</button></div>') +
      '</div></div>'
    );
  }

  function bindShellEvents(account, yearRec) {
    document.querySelectorAll('[data-nav]').forEach(function (el) {
      el.addEventListener('click', function () { state.view = el.getAttribute('data-nav'); state.activeQuiz = null; render(); requestAnimationFrame(function () { window.scrollTo(0, 0); }); });
    });
    document.querySelectorAll('[data-select-year]').forEach(function (btn) {
      btn.addEventListener('click', function () { state.selectedYearId = btn.getAttribute('data-select-year'); state.activeExerciseId = null; state.activeQuiz = null; resetExState(); render(); showToast('Volume affiché : ' + state.selectedYearId); });
    });
    const backA = document.getElementById('btn-back-active-year'); if (backA) backA.addEventListener('click', function () { state.selectedYearId = account.activeYearId; render(); });
    const lo = document.getElementById('btn-logout'); if (lo) lo.addEventListener('click', function () { Store.setSessionAccountId(null); state.accountId = null; state.selectedYearId = null; render(); });
    [document.getElementById('btn-open-enroll-gate'), document.getElementById('btn-card-enroll')].forEach(function (el) {
      if (el) el.addEventListener('click', function () { const st = SY.getNextYearEnrollmentStatus(account, Store.getEffectiveNow(state.db)); state.modal = { type: 'enroll', chosenLevelId: st.suggestedLevelId }; render(); });
    });
    const dp = document.getElementById('btn-date-pill'); if (dp) dp.addEventListener('click', function () { state.view = 'settings'; render(); requestAnimationFrame(function () { window.scrollTo(0, 0); }); });
    document.querySelectorAll('[data-goto-subject-ex]').forEach(function (b) { b.addEventListener('click', function () { state.exFilterSubject = b.getAttribute('data-goto-subject-ex'); state.exTab = 'practice'; state.activeExerciseId = null; resetExState(); state.view = 'exercises'; render(); requestAnimationFrame(function () { window.scrollTo(0, 0); }); }); });
    document.querySelectorAll('[data-goto-subject-quiz]').forEach(function (b) { b.addEventListener('click', function () { state.quizFilterSubject = b.getAttribute('data-goto-subject-quiz'); state.activeQuiz = null; state.view = 'quizzes'; render(); requestAnimationFrame(function () { window.scrollTo(0, 0); }); }); });
    document.querySelectorAll('[data-prog-subj]').forEach(function (b) { b.addEventListener('click', function () { state.programFilterSubject = b.getAttribute('data-prog-subj'); render(); }); });
    const sb = document.getElementById('btn-sync-edunat'); if (sb) sb.addEventListener('click', function () { ensureOfficialTextsLoaded(yearRec.levelId, true); render(); showToast('Synchronisation lancée…'); });
    document.querySelectorAll('[data-toggle-attendu]').forEach(function (b) { b.addEventListener('click', function () { const c = b.getAttribute('data-toggle-attendu'); const i = yearRec.completedAttenduCodes.indexOf(c); if (i >= 0) yearRec.completedAttenduCodes.splice(i, 1); else yearRec.completedAttenduCodes.push(c); Store.saveDB(state.db); render(); }); });
    document.querySelectorAll('[data-toggle-hw]').forEach(function (b) { b.addEventListener('click', function () { const hw = (yearRec.homeworks || []).find(function (h) { return h.id === b.getAttribute('data-toggle-hw'); }); if (!hw) return; hw.done = !hw.done; if (hw.done) yearRec.activityLog.unshift({ id: Store.generateId('act'), date: Store.getEffectiveNow(state.db).toISOString(), type: 'homework', subjectId: hw.subjectId, title: 'Devoir terminé', detail: hw.title, scoreText: 'Fait' }); Store.saveDB(state.db); render(); }); });
    document.querySelectorAll('[data-delete-hw]').forEach(function (b) { b.addEventListener('click', function () { yearRec.homeworks = (yearRec.homeworks || []).filter(function (h) { return h.id !== b.getAttribute('data-delete-hw'); }); Store.saveDB(state.db); render(); }); });
    const hwf = document.getElementById('hw-add-form'); if (hwf) hwf.addEventListener('submit', function (e) { e.preventDefault(); const fd = new FormData(hwf); yearRec.homeworks.unshift({ id: Store.generateId('hw'), subjectId: fd.get('subjectId'), title: String(fd.get('title') || '').trim(), dueDate: fd.get('dueDate') || '', priority: fd.get('priority') || 'normal', notes: String(fd.get('notes') || '').trim(), done: false }); Store.saveDB(state.db); render(); showToast('Devoir ajouté !'); });
    document.querySelectorAll('[data-hw-status]').forEach(function (b) { b.addEventListener('click', function () { state.hwFilterStatus = b.getAttribute('data-hw-status'); render(); }); });
    document.querySelectorAll('[data-hw-subj]').forEach(function (b) { b.addEventListener('click', function () { state.hwFilterSubject = b.getAttribute('data-hw-subj'); render(); }); });
    document.querySelectorAll('[data-ex-tab]').forEach(function (b) { b.addEventListener('click', function () { state.exTab = b.getAttribute('data-ex-tab'); render(); }); });
    document.querySelectorAll('[data-ex-subj]').forEach(function (b) { b.addEventListener('click', function () { state.exFilterSubject = b.getAttribute('data-ex-subj'); state.activeExerciseId = null; resetExState(); render(); }); });
    document.querySelectorAll('[data-select-ex]').forEach(function (b) { b.addEventListener('click', function () { state.activeExerciseId = b.getAttribute('data-select-ex'); resetExState(); render(); }); });
    document.querySelectorAll('[data-ex-option]').forEach(function (b) { b.addEventListener('click', function () { state.exState.selectedOption = b.getAttribute('data-ex-option'); render(); }); });
    const ext = document.getElementById('ex-text-answer'); if (ext) ext.addEventListener('input', function () { state.exState.textInput = ext.value; });
    const hb = document.getElementById('btn-next-hint'); if (hb) hb.addEventListener('click', function () { state.exState.revealedHints += 1; render(); });
    const subEx = document.getElementById('btn-submit-ex'); if (subEx) subEx.addEventListener('click', function () {
      const ex = getAllExercisesForYear(yearRec, state.exFilterSubject).find(function (e) { return e.id === state.activeExerciseId; }); if (!ex) return;
      const ans = ex.type === 'choice' ? state.exState.selectedOption : state.exState.textInput; if (!ans || !String(ans).trim()) { showToast('Choisis ou écris une réponse.'); return; }
      const ok = normalizeAnswer(ans) === normalizeAnswer(ex.answer); state.exState.submitted = true; state.exState.isCorrect = ok;
      if (ok && yearRec.completedExerciseIds.indexOf(ex.id) === -1) { yearRec.completedExerciseIds.push(ex.id); yearRec.activityLog.unshift({ id: Store.generateId('act'), date: Store.getEffectiveNow(state.db).toISOString(), type: 'exercise', subjectId: ex.subjectId, title: 'Exercice réussi', detail: ex.title, scoreText: 'Validé' }); Store.saveDB(state.db); }
      render();
    });
    const rex = document.getElementById('btn-retry-ex'); if (rex) rex.addEventListener('click', function () { resetExState(); render(); });
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
    document.querySelectorAll('[data-mark-sheet]').forEach(function (b) { b.addEventListener('click', function () { const id = b.getAttribute('data-mark-sheet'); if (yearRec.readMethodSheetIds.indexOf(id) === -1) { yearRec.readMethodSheetIds.push(id); Store.saveDB(state.db); showToast('Fiche validée !'); render(); } }); });
    document.querySelectorAll('[data-quiz-subj]').forEach(function (b) { b.addEventListener('click', function () { state.quizFilterSubject = b.getAttribute('data-quiz-subj'); render(); }); });
    document.querySelectorAll('[data-start-quiz]').forEach(function (b) { b.addEventListener('click', function () { const found = getAllQuizzesForYear(yearRec, 'all').find(function (q) { return q.id === b.getAttribute('data-start-quiz'); }); if (!found) return; state.activeQuiz = found; state.quizRun = { index: 0, answers: [], finished: false, lastResult: null }; render(); requestAnimationFrame(function () { window.scrollTo(0, 0); }); }); });
    const qq = document.getElementById('btn-quit-quiz'); if (qq) qq.addEventListener('click', function () { state.activeQuiz = null; render(); });
    document.querySelectorAll('[data-quiz-choice]').forEach(function (b) { b.addEventListener('click', function () { state.quizRun.answers[state.quizRun.index] = b.getAttribute('data-quiz-choice'); render(); }); });
    const qp = document.getElementById('btn-quiz-prev'); if (qp) qp.addEventListener('click', function () { if (state.quizRun.index > 0) { state.quizRun.index -= 1; render(); } });
    const qn = document.getElementById('btn-quiz-next'); if (qn) qn.addEventListener('click', function () {
      const quiz = state.activeQuiz; if (!quiz) return;
      if (state.quizRun.index < quiz.questions.length - 1) { state.quizRun.index += 1; render(); return; }
      let score = 0; quiz.questions.forEach(function (q, i) { if (normalizeAnswer(state.quizRun.answers[i]) === normalizeAnswer(q.answer)) score += 1; });
      const total = quiz.questions.length, percent = Math.round((score / total) * 100), scoreOn20 = Math.round((score / total) * 200) / 10;
      const att = { id: Store.generateId('qa'), quizId: quiz.id, subjectId: quiz.subjectId, title: quiz.title, score: score, total: total, scoreOn20: scoreOn20, percent: percent, date: Store.getEffectiveNow(state.db).toISOString() };
      yearRec.quizAttempts.push(att); yearRec.activityLog.unshift({ id: Store.generateId('act'), date: att.date, type: 'quiz', subjectId: quiz.subjectId, title: 'Quiz : ' + quiz.title, detail: score + '/' + total, scoreText: String(scoreOn20).replace('.', ',') + '/20' }); Store.saveDB(state.db);
      state.quizRun.finished = true; state.quizRun.lastResult = att; render(); showToast('Note enregistrée : ' + String(scoreOn20).replace('.', ',') + '/20 !');
    });
    document.querySelectorAll('[data-studio-tab]').forEach(function (b) { b.addEventListener('click', function () { state.studioTab = b.getAttribute('data-studio-tab'); render(); }); });
    const dz = document.getElementById('photo-dropzone'), fi = document.getElementById('photo-file-input');
    if (dz && fi) { dz.addEventListener('click', function (e) { if (e.target.tagName !== 'BUTTON') fi.click(); }); fi.addEventListener('change', function () { if (fi.files[0]) handlePhotoUpload(fi.files[0]); }); }
    const cp = document.getElementById('btn-clear-photo'); if (cp) cp.addEventListener('click', function (e) { e.stopPropagation(); state.studioPhoto.imageDataUrl = null; state.studioPhoto.fileName = ''; render(); });
    const samp = document.getElementById('btn-fill-sample-course'); if (samp) samp.addEventListener('click', function () { state.studioPhoto.chapter = 'Les triangles particuliers'; state.studioPhoto.notes = 'Triangle isocèle : possède deux côtés de même longueur.\nTriangle équilatéral : possède trois côtés égaux.\nTriangle rectangle : possède un angle droit de 90 degrés.'; render(); });
    const ss = document.getElementById('studio-subj'); if (ss) ss.addEventListener('change', function () { state.studioPhoto.subjectId = ss.value; });
    const sc = document.getElementById('studio-chapter'); if (sc) sc.addEventListener('input', function () { state.studioPhoto.chapter = sc.value; });
    const sn = document.getElementById('studio-notes'); if (sn) sn.addEventListener('input', function () { state.studioPhoto.notes = sn.value; });
    const pf = document.getElementById('photo-gen-form'); if (pf) pf.addEventListener('submit', async function (e) { e.preventDefault(); const ref = state.studioPhoto.imageDataUrl ? await Store.savePhoto(Store.generateId('photo'), state.studioPhoto.imageDataUrl) : null; state.studioPhoto.draftPack = await Gen.generateFromCoursePhoto({ subjectId: state.studioPhoto.subjectId, levelId: yearRec.levelId, chapter: state.studioPhoto.chapter, notes: state.studioPhoto.notes, imageDataUrl: state.studioPhoto.imageDataUrl, photoRef: ref }, state.db.settings.geminiApiKey); render(); showToast('Pack généré !'); });
    const spf = document.getElementById('save-pack-form'); if (spf) spf.addEventListener('submit', function (e) { e.preventDefault(); const pack = state.studioPhoto.draftPack; if (!pack) return; const fd = new FormData(spf); pack.methodSheet.title = String(fd.get('msTitle') || pack.methodSheet.title).trim(); pack.methodSheet.essential = String(fd.get('msEssential') || pack.methodSheet.essential).trim(); pack.methodSheet.steps = String(fd.get('msSteps') || '').split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean); pack.methodSheet.pitfall = String(fd.get('msPitfall') || pack.methodSheet.pitfall).trim(); yearRec.customMethodSheets.unshift(pack.methodSheet); pack.exercises.forEach(function (ex) { ex.methodSheet = pack.methodSheet; yearRec.customExercises.unshift(ex); }); yearRec.customQuizzes.unshift(pack.quiz); Store.saveDB(state.db); state.exFilterSubject = pack.methodSheet.subjectId; state.activeExerciseId = pack.exercises[0] ? pack.exercises[0].id : null; state.studioPhoto.draftPack = null; state.view = 'exercises'; resetExState(); render(); showToast('Pack enregistré !'); });
    const dd = document.getElementById('btn-discard-draft'); if (dd) dd.addEventListener('click', function () { state.studioPhoto.draftPack = null; render(); });
    const mf = document.getElementById('manual-ex-form'); if (mf) mf.addEventListener('submit', function (e) { e.preventDefault(); const fd = new FormData(mf); const subjId = fd.get('subjectId'), ch = String(fd.get('chapter') || '').trim(), ti = String(fd.get('title') || '').trim(), pr = String(fd.get('prompt') || '').trim(), an = String(fd.get('answer') || '').trim(), wr = String(fd.get('wrongOptions') || '').trim(), hi = String(fd.get('hint') || '').trim(), ex = String(fd.get('explanation') || '').trim(), mt = String(fd.get('methodTip') || '').trim(); let opts = null; if (wr) { const w = wr.split(/[;,]/).map(function (s) { return s.trim(); }).filter(Boolean); if (w.length) opts = [an].concat(w); } const sh = { id: Store.generateId('ms_m'), levelId: yearRec.levelId, subjectId: subjId, chapter: ch, title: 'Fiche : ' + ti, source: 'perso', essential: mt || ex, steps: ['Relis l’énoncé.', hi || 'Applique la règle.', 'Vérifie.'], pitfall: 'Aller trop vite.', example: pr + ' → ' + an }; const exObj = { id: Store.generateId('ex_m'), levelId: yearRec.levelId, subjectId: subjId, chapter: ch, title: ti, difficulty: 'Perso', source: 'perso', prompt: pr, type: opts ? 'choice' : 'input', options: opts, answer: an, hints: hi ? [hi] : ['Relis ton cours.'], explanation: ex, methodSheet: sh }; yearRec.customMethodSheets.unshift(sh); yearRec.customExercises.unshift(exObj); Store.saveDB(state.db); state.exFilterSubject = subjId; state.activeExerciseId = exObj.id; state.view = 'exercises'; resetExState(); render(); showToast('Exercice enregistré !'); });
    document.querySelectorAll('[data-hist-subj]').forEach(function (b) { b.addEventListener('click', function () { state.historyFilterSubject = b.getAttribute('data-hist-subj'); render(); }); });
    const cpf = document.getElementById('change-pass-form'); if (cpf) cpf.addEventListener('submit', async function (e) { e.preventDefault(); const fd = new FormData(cpf); try { await Store.changePassword(state.db, account, fd.get('oldPass'), fd.get('newPass')); cpf.reset(); showToast('Mot de passe mis à jour !'); } catch (err) { showToast(err.message); } });
    const exb = document.getElementById('btn-export-json'); if (exb) exb.addEventListener('click', function () { const blob = new Blob([Store.exportAccountJSON(account)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'capdevoirs-' + account.username + '.json'; a.click(); URL.revokeObjectURL(url); });
    const imi = document.getElementById('import-json-input'); if (imi) imi.addEventListener('change', function () { const f = imi.files[0]; if (!f) return; const r = new FileReader(); r.onload = function () { try { const acc = Store.importAccountJSON(state.db, r.result); state.accountId = acc.id; state.selectedYearId = acc.activeYearId; render(); showToast('Sauvegarde restaurée !'); } catch (err) { showToast(err.message); } }; r.readAsText(f); });
    document.querySelectorAll('[data-set-sim-date]').forEach(function (b) { b.addEventListener('click', function () { const v = b.getAttribute('data-set-sim-date'); state.db.settings.simulatedDate = v || null; Store.saveDB(state.db); if (state.modal && state.modal.type === 'enroll') state.modal.chosenLevelId = SY.getNextYearEnrollmentStatus(account, Store.getEffectiveNow(state.db)).suggestedLevelId; render(); showToast(v ? 'Date simulée : ' + SY.formatDateFR(Store.getEffectiveNow(state.db)) : 'Date réelle.'); }); });
    const si = document.getElementById('sim-date-input'); if (si) si.addEventListener('change', function () { state.db.settings.simulatedDate = si.value || null; Store.saveDB(state.db); render(); });
    const akf = document.getElementById('api-key-form'); if (akf) akf.addEventListener('submit', function (e) { e.preventDefault(); const inp = document.getElementById('gemini-key-input'); state.db.settings.geminiApiKey = inp ? inp.value.trim() : ''; Store.saveDB(state.db); showToast('Clé enregistrée.'); });
    [document.getElementById('btn-close-modal'), document.getElementById('btn-cancel-modal')].forEach(function (el) { if (el) el.addEventListener('click', function () { state.modal = null; render(); }); });
    const bd = document.getElementById('modal-backdrop'); if (bd) bd.addEventListener('click', function (e) { if (e.target === bd) { state.modal = null; render(); } });
    document.querySelectorAll('[data-modal-level]').forEach(function (b) { b.addEventListener('click', function () { if (state.modal) { state.modal.chosenLevelId = b.getAttribute('data-modal-level'); render(); } }); });
    const ce = document.getElementById('btn-confirm-enroll'); if (ce) ce.addEventListener('click', function () { try { const ny = Store.enrollNextSchoolYear(state.db, account, state.modal.chosenLevelId); state.selectedYearId = ny.yearId; state.modal = null; state.view = 'dashboard'; render(); showToast('Inscrit(e) en ' + ny.levelId + ' pour ' + ny.yearId + ' !'); } catch (err) { showToast(err.message); } });
  }

  async function handlePhotoUpload(file) {
    try { const res = await Gen.compressImageFile(file); state.studioPhoto.imageDataUrl = res.dataUrl; state.studioPhoto.fileName = res.fileName; render(); showToast('Photo prête !'); }
    catch (err) { showToast(err.message); }
  }

  function resetExState() { state.exState = { selectedOption: null, textInput: '', revealedHints: 0, submitted: false, isCorrect: false }; }

  document.addEventListener('DOMContentLoaded', function () { render(); });
})(window);
