/* CapDevoirs — Accessible Theme-Aware SVG Progress & Multi-Year Comparison Charts */
(function (global) {
  'use strict';

  function escapeHTML(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Renders a multi-year comparison SVG bar chart (uses semantic CSS variables so all 6 themes match cleanly).
   */
  function renderMultiYearChart(yearStatsList) {
    if (!yearStatsList || yearStatsList.length === 0) {
      return '<p class="muted-text">Aucune donnée d’année scolaire à afficher pour le moment.</p>';
    }

    const barWidth = 84;
    const gap = 36;
    const padLeft = 44;
    const padRight = 24;
    const padTop = 28;
    const padBottom = 56;
    const chartH = 170;
    const totalW = Math.max(360, padLeft + padRight + yearStatsList.length * barWidth + (yearStatsList.length - 1) * gap);
    const totalH = padTop + chartH + padBottom;

    let gridLines = '';
    [0, 25, 50, 75, 100].forEach(function (pct) {
      const y = padTop + chartH - (pct / 100) * chartH;
      gridLines +=
        '<line x1="' + padLeft + '" y1="' + y + '" x2="' + (totalW - padRight) + '" y2="' + y + '" stroke="var(--color-border)" stroke-width="1" stroke-dasharray="' + (pct === 0 ? '0' : '4 4') + '"/>' +
        '<text x="' + (padLeft - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-size="11" fill="var(--color-ink-muted)">' + pct + '%</text>';
    });

    let bars = '';
    let srRows = '';
    yearStatsList.forEach(function (st, idx) {
      const x = padLeft + idx * (barWidth + gap);
      const val = Math.max(4, st.overallMastery);
      const h = (val / 100) * chartH;
      const y = padTop + chartH - h;
      const fill = st.isSelected ? 'var(--color-primary)' : 'var(--color-chart-muted)';
      const avgLabel = st.overallAvgOn20 !== null ? String(st.overallAvgOn20).replace('.', ',') + '/20' : '—';

      bars +=
        '<g>' +
        '<rect x="' + x + '" y="' + y + '" width="' + barWidth + '" height="' + h + '" rx="8" fill="' + fill + '"/>' +
        '<text x="' + (x + barWidth / 2) + '" y="' + (y - 8) + '" text-anchor="middle" font-size="12" font-weight="700" fill="var(--color-ink)">' + st.overallMastery + '%</text>' +
        '<text x="' + (x + barWidth / 2) + '" y="' + (padTop + chartH + 20) + '" text-anchor="middle" font-size="12" font-weight="700" fill="var(--color-ink)">' + escapeHTML(st.yearId) + '</text>' +
        '<text x="' + (x + barWidth / 2) + '" y="' + (padTop + chartH + 37) + '" text-anchor="middle" font-size="11" fill="var(--color-ink-muted)">' + escapeHTML(st.levelId) + ' · ' + escapeHTML(avgLabel) + '</text>' +
        '</g>';

      srRows += '<tr><td>' + escapeHTML(st.yearId) + '</td><td>' + escapeHTML(st.levelId) + '</td><td>' + st.overallMastery + '%</td><td>' + escapeHTML(avgLabel) + '</td></tr>';
    });

    return (
      '<div class="chart-wrap">' +
      '<svg class="svg-chart" viewBox="0 0 ' + totalW + ' ' + totalH + '" role="img" aria-label="Évolution de la maîtrise globale par année scolaire">' +
      gridLines +
      bars +
      '</svg>' +
      '<table class="sr-only"><caption>Progression par année scolaire</caption><thead><tr><th>Année</th><th>Niveau</th><th>Maîtrise</th><th>Moyenne quiz</th></tr></thead><tbody>' +
      srRows +
      '</tbody></table>' +
      '</div>'
    );
  }

  /**
   * Renders a clean SVG trend line chart of quiz scores (/20) over time for a selected school year.
   */
  function renderQuizTrendChart(attempts) {
    if (!attempts || attempts.length === 0) {
      return '<p class="muted-text">Aucun quiz noté sur cette année scolaire pour l’instant. Passe un quiz pour voir ta courbe de progression.</p>';
    }

    const sorted = attempts.slice().sort(function (a, b) {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    const padLeft = 44;
    const padRight = 24;
    const padTop = 24;
    const padBottom = 42;
    const chartH = 150;
    const stepX = sorted.length > 1 ? Math.max(76, Math.min(130, 580 / (sorted.length - 1))) : 120;
    const totalW = Math.max(660, padLeft + padRight + Math.max(1, sorted.length - 1) * stepX + 40);
    const totalH = padTop + chartH + padBottom;

    let grid = '';
    [0, 5, 10, 15, 20].forEach(function (note) {
      const y = padTop + chartH - (note / 20) * chartH;
      grid +=
        '<line x1="' + padLeft + '" y1="' + y + '" x2="' + (totalW - padRight) + '" y2="' + y + '" stroke="var(--color-border)" stroke-width="1" stroke-dasharray="' + (note === 0 ? '0' : '4 4') + '"/>' +
        '<text x="' + (padLeft - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-size="11" fill="var(--color-ink-muted)">' + note + '/20</text>';
    });

    const pts = sorted.map(function (att, idx) {
      const x = sorted.length === 1 ? padLeft + (totalW - padLeft - padRight) / 2 : padLeft + 15 + idx * stepX;
      const y = padTop + chartH - ((att.scoreOn20 || 0) / 20) * chartH;
      return { x: x, y: y, att: att };
    });

    let poly = '';
    if (pts.length > 1) {
      const d = pts.map(function (p, i) { return (i === 0 ? 'M' : 'L') + p.x + ' ' + p.y; }).join(' ');
      const areaD = d + ' L' + pts[pts.length - 1].x + ' ' + (padTop + chartH) + ' L' + pts[0].x + ' ' + (padTop + chartH) + ' Z';
      poly =
        '<path d="' + areaD + '" fill="var(--color-chart-area)"/>' +
        '<path d="' + d + '" fill="none" stroke="var(--color-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
    }

    let nodes = '';
    let srRows = '';
    pts.forEach(function (p) {
      const subj = global.CapCurriculum.getSubjectDef(p.att.subjectId);
      const dateLbl = global.CapSchoolYear.formatShortDateFR(p.att.date);
      const noteStr = String(p.att.scoreOn20).replace('.', ',');
      nodes +=
        '<g>' +
        '<circle cx="' + p.x + '" cy="' + p.y + '" r="5.5" fill="var(--color-surface)" stroke="var(' + subj.colorVar + ')" stroke-width="3"/>' +
        '<text x="' + p.x + '" y="' + (p.y - 10) + '" text-anchor="middle" font-size="11" font-weight="700" fill="var(--color-ink)">' + noteStr + '</text>' +
        '<text x="' + p.x + '" y="' + (padTop + chartH + 18) + '" text-anchor="middle" font-size="10.5" fill="var(--color-ink-secondary)">' + escapeHTML(subj.short) + '</text>' +
        '<text x="' + p.x + '" y="' + (padTop + chartH + 32) + '" text-anchor="middle" font-size="10" fill="var(--color-ink-muted)">' + escapeHTML(dateLbl) + '</text>' +
        '</g>';
      srRows += '<tr><td>' + escapeHTML(dateLbl) + '</td><td>' + escapeHTML(subj.name) + '</td><td>' + noteStr + '/20</td></tr>';
    });

    return (
      '<div class="chart-wrap">' +
      '<svg class="svg-chart" viewBox="0 0 ' + totalW + ' ' + totalH + '" role="img" aria-label="Courbe des notes aux quiz sur 20">' +
      grid +
      poly +
      nodes +
      '</svg>' +
      '<table class="sr-only"><caption>Historique des notes aux quiz</caption><thead><tr><th>Date</th><th>Matière</th><th>Note</th></tr></thead><tbody>' +
      srRows +
      '</tbody></table>' +
      '</div>'
    );
  }

  global.CapCharts = {
    renderMultiYearChart: renderMultiYearChart,
    renderQuizTrendChart: renderQuizTrendChart
  };
})(window);
