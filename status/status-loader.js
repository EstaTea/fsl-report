/**
 * FSL Deliverables Status Loader
 * Fetches /fsl-report/status/doc-status.json and:
 * 1. On pages with .doc-card elements: updates status badges from href key
 * 2. On pages with .folder-card[data-docs]: updates fc-meta count + progress bar
 * 3. On pages with stat IDs (sv-done / sv-wip / sv-todo / sv-pct): updates summary stats
 */
(function () {
  const STATUS_URL = '/fsl-report/status/doc-status.json';

  const BADGE = {
    done: '<span class="status s-done">✅ 已完成</span>',
    wip:  '<span class="status s-wip">🔄 进行中</span>',
    todo: '<span class="status s-todo">⏳ 待开始</span>',
  };

  /* Extract the lookup key from a full href.
     href format: /fsl-report/<path>.html  →  key: /<path>
     e.g. /fsl-report/consulting/roadmap/roadmap-report.html → /consulting/roadmap/roadmap-report */
  function hrefToKey(href) {
    const m = href.match(/\/fsl-report(\/[^?#]+?)(?:\.html)?(?:[?#].*)?$/);
    return m ? m[1] : null;
  }

  fetch(STATUS_URL)
    .then(r => r.json())
    .then(function (statusMap) {

      /* ── 1. Update doc-card badges ── */
      document.querySelectorAll('a.doc-card[href], a.folder-card[href]').forEach(function (card) {
        const key = hrefToKey(card.getAttribute('href'));
        if (!key) return;
        const st = statusMap[key] || statusMap[key + '.html'];
        if (!st || !BADGE[st]) return;
        const badgeEl = card.querySelector('.status');
        if (badgeEl) badgeEl.outerHTML = BADGE[st];
      });

      /* ── 2. Update folder-card counts + progress bars ── */
      document.querySelectorAll('.folder-card[data-docs]').forEach(function (card) {
        const keys = card.getAttribute('data-docs').split(',').map(s => s.trim()).filter(Boolean);
        const total = keys.length;
        let done = 0, wip = 0;
        keys.forEach(function (k) {
          const st = statusMap[k] || statusMap[k + '.html'];
          if (st === 'done') done++;
          else if (st === 'wip') wip++;
        });
        const metaEl = card.querySelector('.fc-meta');
        if (metaEl) metaEl.textContent = done + '/' + total + ' 份完成';
        const fillEl = card.querySelector('.progress-fill');
        if (fillEl) fillEl.style.width = (total > 0 ? Math.round(done / total * 100) : 0) + '%';
      });

      /* ── 3. Update global summary stats (deliverables/index.html) ── */
      const vals = Object.values(statusMap);
      const totalDocs = vals.length;
      const doneCount = vals.filter(v => v === 'done').length;
      const wipCount  = vals.filter(v => v === 'wip').length;
      const todoCount = vals.filter(v => v === 'todo').length;
      const pct = totalDocs > 0 ? Math.round(doneCount / totalDocs * 100) : 0;

      const svDone = document.getElementById('sv-done');
      const svWip  = document.getElementById('sv-wip');
      const svTodo = document.getElementById('sv-todo');
      const svPct  = document.getElementById('sv-pct');
      if (svDone) svDone.textContent = doneCount;
      if (svWip)  svWip.textContent  = wipCount;
      if (svTodo) svTodo.textContent = todoCount;
      if (svPct)  svPct.textContent  = pct + '%';
    })
    .catch(function (e) {
      console.warn('[status-loader] Failed to load doc-status.json:', e);
    });
})();
