/* ============================================================================
   注入式 DAP 运行时 —— 挂进真实 ERP 生产页面即可跑引导

   用法（客户页面加一行即可）：
     <script src="https://estatea.github.io/fsl-report/training/dap/selector.js"></script>
     <script src="https://estatea.github.io/fsl-report/training/dap/inject.js"
             data-course="https://…/training/courses/sap-va01-overlay.json"
             data-locale="zh-CN"></script>

   体检模式（不改任何东西，只报告每步能否命中Elements）：
     页面加 ?dapHealth=1   或   data-health="1"

   设计约束：
   - 零依赖、不引 CDN（含弯路不走代理，合规要求）
   - 全部 UI 放进 Shadow DOM：不被宿主页面 CSS 影响，也不污染宿主页
   - 不使用 localStorage / cookie，不采集业务数据；完成事件通过 DOM 事件
     与 postMessage 交给宿主 LMS 落库
   - 配色沿用 Gartner 蓝系（#0b2d47 → #89c4e8）
   ========================================================================== */
(function () {
  'use strict';
  if (window.FSL_DAP) return;               // 防重复注入

  var cur = document.currentScript;
  var cfg = cur ? (cur.dataset || {}) : {};
  var COURSE_URL = cfg.course || window.FSL_DAP_COURSE_URL || '';
  var HEALTH = location.search.indexOf('dapHealth=1') >= 0 || cfg.health === '1';
  var AUTO = !(cfg.auto === '0');

  var root = null, host = null, shadow = null;
  var course = null, steps = [], idx = 0, running = false, waiter = null;

  /* ── UI 骨架 ─────────────────────────────────────────────────────── */
  function css() {
    return [
      '.mask{position:fixed;inset:0;z-index:2147483000;pointer-events:none;' +
      'box-shadow:0 0 0 9999px rgba(11,45,71,.28);border:2px solid #89c4e8;' +
      'border-radius:6px;transition:all .22s ease}',
      '.pop{position:fixed;z-index:2147483001;width:340px;max-width:92vw;background:#fff;' +
      'border-radius:10px;border:1px solid #d9e6f2;box-shadow:0 12px 32px rgba(11,45,71,.22);' +
      'font:14px/1.65 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;' +
      'color:#1b2a38;overflow:hidden}',
      '.hd{background:linear-gradient(135deg,#0b2d47,#14456b);color:#fff;padding:11px 14px;' +
      'display:flex;justify-content:space-between;align-items:center;gap:10px}',
      '.hd b{font-size:14px;font-weight:600}',
      '.pg{font-size:12px;opacity:.85;white-space:nowrap}',
      '.bd{padding:12px 14px}',
      '.tt{font-size:15px;font-weight:600;color:#0b2d47;margin-bottom:6px}',
      '.ds{color:#425a70;font-size:13px}',
      '.warn{margin-top:8px;padding:8px 10px;background:#fff6e5;border-left:3px solid #2374a3;' +
      'color:#7a5200;font-size:12px;border-radius:0 4px 4px 0}',
      '.ft{display:flex;justify-content:space-between;align-items:center;padding:9px 14px;' +
      'border-top:1px solid #e8eef4;background:#f7fafd;gap:8px}',
      'button{border:1px solid #c9dced;background:#fff;color:#14456b;border-radius:5px;' +
      'padding:5px 12px;font-size:12.5px;cursor:pointer}',
      'button:hover{background:#eef5fb}',
      'button.pri{background:#0b2d47;border-color:#0b2d47;color:#fff}',
      'button.pri:hover{background:#14456b}',
      'button:disabled{opacity:.45;cursor:default}',
      '.close{background:none;border:none;color:#fff;font-size:17px;line-height:1;opacity:.8;cursor:pointer}',
      /* 体检面板 */
      '.panel{position:fixed;right:16px;bottom:16px;z-index:2147483002;width:420px;max-width:94vw;' +
      'max-height:70vh;overflow:auto;background:#fff;border:1px solid #d9e6f2;border-radius:10px;' +
      'box-shadow:0 12px 32px rgba(11,45,71,.24);font:13px/1.6 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif}',
      '.panel h3{margin:0;padding:11px 14px;background:linear-gradient(135deg,#0b2d47,#14456b);' +
      'color:#fff;font-size:14px;border-radius:9px 9px 0 0}',
      '.panel ul{margin:0;padding:8px 12px;list-style:none}',
      '.panel li{padding:7px 0;border-bottom:1px dashed #e3edf5}',
      '.panel li:last-child{border-bottom:none}',
      '.ok{color:#0b2d47}.bad{color:#8a5a00}.miss{color:#0b2d47;font-weight:600}',
      '.meta{font-size:11.5px;color:#6b8298}',
      '.sum{padding:9px 14px;background:#f7fafd;border-top:1px solid #e8eef4;font-size:12.5px;color:#425a70}'
    ].join('\n');
  }

  function ensureHost() {
    if (host) return;
    host = document.createElement('div');
    host.id = 'fsldap-root';
    document.body.appendChild(host);
    shadow = host.attachShadow({ mode: 'open' });
    var st = document.createElement('style'); st.textContent = css();
    shadow.appendChild(st);
    root = document.createElement('div');
    shadow.appendChild(root);
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* ── 高亮框定位 ─────────────────────────────────────────────────── */
  var maskNode = null;
  function highlight(node) {
    clearMask();
    if (!node) return;
    var r = node.getBoundingClientRect();
    maskNode = el('div', 'mask');
    var pad = 4;
    maskNode.style.left = (r.left - pad) + 'px';
    maskNode.style.top = (r.top - pad) + 'px';
    maskNode.style.width = (r.width + pad * 2) + 'px';
    maskNode.style.height = (r.height + pad * 2) + 'px';
    shadow.appendChild(maskNode);
    // 目标滚出视口时先滚过去
    if (r.top < 0 || r.bottom > innerHeight) {
      node.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setTimeout(placePop, 320);
    }
  }
  function clearMask() { if (maskNode) { maskNode.remove(); maskNode = null; } }

  /* ── 气泡 ───────────────────────────────────────────────────────── */
  var popNode = null;
  function placePop() {
    if (!popNode || !steps[idx]) return;
    var hit = window.FSL_SELECTOR && steps[idx] && steps[idx].el
      ? window.FSL_SELECTOR.resolve(steps[idx].el) : null;
    var host_ = document.getElementById('fsldap-root');
    var w = 340, r = hit && hit.node ? hit.node.getBoundingClientRect() : null;
    var top, left;
    if (r) {
      left = Math.min(Math.max(12, r.left), Math.max(12, innerWidth - w - 12));
      top = r.bottom + 10;
      if (top + popNode.offsetHeight > innerHeight - 10) top = Math.max(12, r.top - popNode.offsetHeight - 10);
    } else { left = innerWidth - w - 16; top = 84; }
    popNode.style.left = left + 'px';
    popNode.style.top = top + 'px';
  }

  function renderStep() {
    ensureHost();
    clearMask();
    if (popNode) { popNode.remove(); popNode = null; }
    var st = steps[idx]; if (!st) return;

    popNode = el('div', 'pop');
    var hd = el('div', 'hd');
    hd.appendChild(el('b', null, esc(course && course.title || '操作引导')));
    hd.appendChild(el('span', 'pg', (idx + 1) + ' / ' + steps.length));
    var x = el('button', 'close', '✕'); x.onclick = stop; hd.appendChild(x);
    popNode.appendChild(hd);

    var bd = el('div', 'bd');
    bd.appendChild(el('div', 'tt', esc(st.title || '')));
    if (st.desc) bd.appendChild(el('div', 'ds', esc(st.desc)));
    popNode.appendChild(bd);

    var ft = el('div', 'ft');
    var prev = el('button', null, '← 上一步');
    prev.disabled = idx === 0;
    prev.onclick = function () { if (idx > 0) { idx--; renderStep(); } };
    var nextLabel = idx === steps.length - 1 ? '完成 ✓' : '下一步 →';
    var next = el('button', 'pri', nextLabel);
    next.onclick = function () { idx < steps.length - 1 ? (idx++, renderStep()) : finish(); };
    var skip = el('button', null, '退出'); skip.onclick = stop;
    ft.appendChild(prev); ft.appendChild(skip); ft.appendChild(next);
    popNode.appendChild(ft);
    shadow.appendChild(popNode);

    if (waiter) { waiter(); waiter = null; }
    waiter = window.FSL_SELECTOR.waitFor(st.el, {
      timeout: 12000,
      onFound: function (res) {
        if (!popNode) return;
        if (res) {
          highlight(res.node);
          placePop();
          if (res.score < 60) {
            var bd2 = popNode.querySelector('.bd');
            if (bd2 && !bd2.querySelector('.warn')) {
              bd2.appendChild(el('div', 'warn', '提示：此步选择器置信度偏低（' + res.score +
                '，策略 ' + res.strategy + '），建议改用 data-testid 或 aria-label 重新拾取。'));
            }
          }
        } else {
          var bd3 = popNode.querySelector('.bd');
          if (bd3 && !bd3.querySelector('.warn')) {
            bd3.appendChild(el('div', 'warn', '未在当前页面找到该元素。可能页面尚未加载，或界面已改版。'));
          }
        }
      }
    });
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function finish() {
    stop();
    var detail = { courseId: course && course.id, steps: steps.length, at: new Date().toISOString() };
    try {
      document.dispatchEvent(new CustomEvent('fsldap:complete', { detail: detail }));
      if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'fsldap-complete', detail: detail }, '*');
      if (window.opener) window.opener.postMessage({ type: 'fsldap-complete', detail: detail }, '*');
    } catch (e) { /* 宿主限制时静默 */ }
  }

  function stop() {
    running = false;
    if (waiter) { waiter(); waiter = null; }
    clearMask();
    if (popNode) { popNode.remove(); popNode = null; }
    document.removeEventListener('scroll', placePop, true);
    window.removeEventListener('resize', placePop);
    document.removeEventListener('keydown', onKey, true);
  }

  function onKey(e) {
    if (!running) return;
    if (e.key === 'Escape') stop();
    else if (e.key === 'Enter') { idx < steps.length - 1 ? (idx++, renderStep()) : finish(); }
    else if (e.key === 'ArrowLeft' && idx > 0) { idx--; renderStep(); }
    else if (e.key === 'ArrowRight' && idx < steps.length - 1) { idx++, renderStep(); }
  }

  /* ── 体检模式 ───────────────────────────────────────────────────── */
  function renderHealth(report) {
    ensureHost();
    var p = el('div', 'panel');
    p.appendChild(el('h3', null, '选择器体检 · ' + esc((course && course.title) || '')));
    var ul = el('ul');
    var bad = 0, miss = 0;
    report.forEach(function (r) {
      var li = el('li');
      var line = '<div class="' + (!r.ok ? 'miss' : r.problem ? 'bad' : 'ok') + '">' +
        (r.ok ? (r.problem ? '⚠ ' : '✓ ') : '✗ ') + esc(r.title) + '</div>';
      if (!r.ok) miss++;
      else if (r.problem) bad++;
      line += '<div class="meta">' + (r.ok
        ? ('策略 ' + r.strategy + ' · 置信度 ' + r.score + (r.problem ? ' · ' + esc(r.problem) : ''))
        : esc(r.problem || '未命中')) + '</div>';
      li.innerHTML = line;
      ul.appendChild(li);
    });
    p.appendChild(ul);
    p.appendChild(el('div', 'sum', '共 ' + report.length + ' 步：正常 ' + (report.length - bad - miss) +
      ' · 待优化 ' + bad + ' · 失效 ' + miss + '（界面改版后跑一次就知道哪些课要改）'));
    shadow.appendChild(p);
  }

  /* ── 启动 ───────────────────────────────────────────────────────── */
  function loadCourse(cb) {
    if (!COURSE_URL) { cb(new Error('未指定 data-course')); return; }
    fetch(COURSE_URL, { credentials: 'omit' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) { cb(null, j); })
      .catch(function (e) { cb(e); });
  }

  window.FSL_DAP = {
    get status() { return running ? 'running' : 'idle'; },
    health: function () { return window.FSL_SELECTOR.audit(steps); },
    start: function (i) {
      if (!steps.length) return false;
      idx = Math.max(0, Math.min(steps.length - 1, i || 0));
      running = true;
      document.addEventListener('scroll', placePop, true);
      window.addEventListener('resize', placePop);
      document.addEventListener('keydown', onKey, true);
      renderStep();
      return true;
    },
    next: function () { if (idx < steps.length - 1) { idx++; renderStep(); } },
    prev: function () { if (idx > 0) { idx--; renderStep(); } },
    stop: stop
  };

  loadCourse(function (err, j) {
    if (err) { console.warn('[DAP] 课程加载失败：', err.message); return; }
    course = j;
    steps = (j && j.steps) || [];
    if (!steps.length) { console.warn('[DAP] 课程无步骤'); return; }
    if (HEALTH) { renderHealth(window.FSL_SELECTOR.audit(steps)); return; }
    if (AUTO) window.FSL_DAP.start(0);
  });
})();
