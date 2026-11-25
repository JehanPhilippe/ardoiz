/* CapDevoirs — School Year Calendar & March 1st N+1 Registration Rules */
(function (global) {
  'use strict';

  const LEVELS = [
    { id: 'CP', label: 'CP', cycle: 'Primaire', cycleCode: 'Cycle 2', age: '6–7 ans', order: 0 },
    { id: 'CE1', label: 'CE1', cycle: 'Primaire', cycleCode: 'Cycle 2', age: '7–8 ans', order: 1 },
    { id: 'CE2', label: 'CE2', cycle: 'Primaire', cycleCode: 'Cycle 2', age: '8–9 ans', order: 2 },
    { id: 'CM1', label: 'CM1', cycle: 'Primaire', cycleCode: 'Cycle 3', age: '9–10 ans', order: 3 },
    { id: 'CM2', label: 'CM2', cycle: 'Primaire', cycleCode: 'Cycle 3', age: '10–11 ans', order: 4 },
    { id: '6e', label: '6e', cycle: 'Collège', cycleCode: 'Cycle 3', age: '11–12 ans', order: 5 },
    { id: '5e', label: '5e', cycle: 'Collège', cycleCode: 'Cycle 4', age: '12–13 ans', order: 6 },
    { id: '4e', label: '4e', cycle: 'Collège', cycleCode: 'Cycle 4', age: '13–14 ans', order: 7 },
    { id: '3e', label: '3e', cycle: 'Collège', cycleCode: 'Cycle 4', age: '14–15 ans', order: 8 }
  ];

  function getLevelById(id) {
    return LEVELS.find(function (l) { return l.id === id; }) || LEVELS[0];
  }

  function getSuggestedNextLevel(currentLevelId) {
    const cur = getLevelById(currentLevelId);
    const next = LEVELS.find(function (l) { return l.order === cur.order + 1; });
    return next ? next.id : cur.id;
  }

  /**
   * Returns French school year bounds for a given Date.
   * French school year starts September 1st (month index 8).
   * Example: Nov 24, 2026 -> startYear 2026 -> "2026-2027".
   * Example: Mar 10, 2027 -> startYear 2026 -> "2026-2027".
   */
  function getSchoolYearStart(date) {
    const d = date instanceof Date ? date : new Date(date);
    const y = d.getFullYear();
    const m = d.getMonth(); // 0=Jan .. 11=Dec
    return m >= 8 ? y : y - 1;
  }

  function formatSchoolYearId(startYear) {
    return startYear + '-' + (startYear + 1);
  }

  function parseSchoolYearStart(yearId) {
    const parts = String(yearId || '').split('-');
    const n = parseInt(parts[0], 10);
    return isNaN(n) ? getSchoolYearStart(new Date()) : n;
  }

  function getCurrentSchoolYearId(nowDate) {
    return formatSchoolYearId(getSchoolYearStart(nowDate || new Date()));
  }

  function getNextSchoolYearId(yearId) {
    const start = parseSchoolYearStart(yearId);
    return formatSchoolYearId(start + 1);
  }

  /**
   * Core Business Rule:
   * Enrollment into school year N+1 (e.g. 2027-2028) for a student currently
   * enrolled in year N (e.g. 2026-2027) opens starting March 1st of year N+1 (March 1, 2027).
   *
   * More generally, given `nowDate` and the student's latest enrolled schoolYearId:
   * - targetYearId = next school year after the student's latest enrolled year (start + 1)
   * - unlockDate = March 1st of (targetStartYear), i.e., new Date(latestStart + 1, 2, 1, 0, 0, 0)
   *   Wait: let's double-check!
   *   If active year is 2026-2027 (latestStart = 2026):
   *   - Target N+1 is 2027-2028 (targetStart = 2027).
   *   - March during 2026-2027 is March 1, 2027 = new Date(2027, 2, 1)!
   *   - On Nov 24, 2026: now < Mar 1, 2027 -> LOCKED (97 days left).
   *   - On Feb 28, 2027: now < Mar 1, 2027 -> LOCKED (1 day left).
   *   - On Mar 1, 2027: now >= Mar 1, 2027 -> OPEN!
   *   - What if the user already enrolled in 2027-2028 on Mar 5, 2027?
   *     Then latestStart = 2027 -> next target is 2028-2029 -> unlockDate = Mar 1, 2028 -> LOCKED until next March!
   */
  function getNextYearEnrollmentStatus(account, nowDate) {
    const now = nowDate instanceof Date ? nowDate : new Date(nowDate || Date.now());
    const years = (account && account.schoolYears) ? account.schoolYears : [];

    let latestStart = getSchoolYearStart(now);
    let latestYear = null;

    if (years.length > 0) {
      const sorted = years.slice().sort(function (a, b) {
        return parseSchoolYearStart(a.yearId) - parseSchoolYearStart(b.yearId);
      });
      latestYear = sorted[sorted.length - 1];
      latestStart = parseSchoolYearStart(latestYear.yearId);
    }

    const targetStart = latestStart + 1;
    const targetYearId = formatSchoolYearId(targetStart);
    const unlockDate = new Date(targetStart, 2, 1, 0, 0, 0, 0); // March 1st of targetStart

    const nowDayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const diffMs = unlockDate.getTime() - nowDayStart.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / 86400000));
    const isOpen = nowDayStart.getTime() >= unlockDate.getTime();

    const currentCalendarYearId = getCurrentSchoolYearId(now);
    const alreadyEnrolledNext = latestStart > getSchoolYearStart(now);

    return {
      isOpen: isOpen,
      alreadyEnrolledNext: alreadyEnrolledNext,
      currentCalendarYearId: currentCalendarYearId,
      latestYearId: latestYear ? latestYear.yearId : currentCalendarYearId,
      latestLevelId: latestYear ? latestYear.levelId : 'CP',
      targetYearId: targetYearId,
      suggestedLevelId: latestYear ? getSuggestedNextLevel(latestYear.levelId) : 'CP',
      unlockDate: unlockDate,
      unlockDateLabel: formatDateFR(unlockDate),
      daysRemaining: daysRemaining,
      referenceDate: now
    };
  }

  function formatDateFR(date) {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  function formatShortDateFR(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short'
    });
  }

  function toISODate(date) {
    const d = date instanceof Date ? date : new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  global.CapSchoolYear = {
    LEVELS: LEVELS,
    getLevelById: getLevelById,
    getSuggestedNextLevel: getSuggestedNextLevel,
    getSchoolYearStart: getSchoolYearStart,
    formatSchoolYearId: formatSchoolYearId,
    parseSchoolYearStart: parseSchoolYearStart,
    getCurrentSchoolYearId: getCurrentSchoolYearId,
    getNextSchoolYearId: getNextSchoolYearId,
    getNextYearEnrollmentStatus: getNextYearEnrollmentStatus,
    formatDateFR: formatDateFR,
    formatShortDateFR: formatShortDateFR,
    toISODate: toISODate
  };
})(window);
