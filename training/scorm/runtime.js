/* ============================================================================
   FSL LMS Runtime —— 同时支持 SCORM 1.2 与 SCORM 2004(4th)
   - window.API           : SCORM 1.2 Runtime API（LMSInitialize/LMSSetValue/…）
   - window.API_1484_11   : SCORM 2004 Runtime API（Initialize/SetValue/…）
   SCO 通常先找 API_1484_11 再找 API，因此两条链路可按需自动切换，
   但共用同一份尝试记录（Attempt），避免学员在两套标准下出现两份进度。
   持久化：GitHub Contents API → data/training/{course}/{login}.json
   不使用 localStorage 存储学习状态；xAPI 语句由 scorm/xapi.js 负责。
   ========================================================================== */
(function () {
  'use strict';

  /* ── 数据模型默认值 ───────────────────────────────────────────── */
  var cmi12 = {
    'cmi.core.student_name': '',
    'cmi.core.student_id': '',
    'cmi.core.lesson_status': 'not attempted',
    'cmi.core.score.raw': '',
    'cmi.core.score.min': '0',
    'cmi.core.score.max': '100',
    'cmi.core.lesson_location': '',
    'cmi.core.suspend_data': '',
    'cmi.core.session_time': '00:00:00',
    'cmi.core.entry': '',
    'cmi.core.exit': '',
    'cmi.launch_data': '',
    'cmi.comments': ''
  };
  var cmi2004 = {
    'cmi.learner_id': '',
    'cmi.learner_name': '',
    'cmi.completion_status': 'unknown',
    'cmi.success_status': 'unknown',
    'cmi.progress_measure': '',
    'cmi.score.raw': '',
    'cmi.score.min': '0',
    'cmi.score.max': '100',
    'cmi.score.scaled': '',
    'cmi.location': '',
    'cmi.suspend_data': '',
    'cmi.session_time': 'PT0H0M0S',
    'cmi.total_time': 'PT0H0M0S',
    'cmi.entry': '',
    'cmi.exit': '',
    'cmi.mode': 'normal',
    'cmi.credit': 'credit',
    'cmi.completion_threshold': '',
    'cmi.scaled_passing_score': '',
    'cmi.launch_data': '',
    'cmi.comments_from_learner.comment': ''
  };

  var init12 = false, init2004 = false, lastSha = null;
  var errorCode = '0';
  var activeStandard = '—';
  var startTime = 0;

  /* ── 会话 / 路径 ─────────────────────────────────────────────── */
  function getLearner() {
    var s = window.FSL_SESSION || {};
    return { name: s.name || s.login || '学员', id: s.login || s.email || 'anonymous' };
  }
  function courseId() {
    var p = new URLSearchParams(window.location.search).get('course');
    return p && p.trim() ? p.trim() : 'po-create';
  }
  function ghPath() {
    return 'data/training/' + encodeURIComponent(courseId()) + '/' + encodeURIComponent(getLearner().id) + '.json';
  }
  /* localStorage 在部分上下文（隐私模式、被标记为第三方的 iframe、
     sandbox iframe）读取会直接抛 SecurityError，必须容错，否则整条
     runtime 初始化会中断。 */
  function lsGet(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function getToken() {
    var s = window.FSL_SESSION || {};
    return s.gh_token || s.token || lsGet('gh_token_fsl');
  }

  /* ── 面板与日志 ──────────────────────────────────────────────── */
  function logApi(msg, cls) {
    var el = document.getElementById('scormLog');
    if (!el) return;
    var div = document.createElement('div');
    div.className = cls || 'act';
    div.textContent = '[' + new Date().toLocaleTimeString('zh-CN') + '] ' + msg;
    el.appendChild(div); el.scrollTop = el.scrollHeight;
  }
  function setSave(text, kind) {
    var el = document.getElementById('saveLine'), dot = document.getElementById('saveDot');
    if (el) el.textContent = text;
    if (dot) dot.className = 'save-dot' + (kind === 'ok' ? ' save-ok' : kind === 'warn' ? ' save-warn' : '');
  }
  function statusClass(s) {
    if (s === 'completed' || s === 'passed') return 'st-done';
    if (s === 'incomplete' || s === 'browsed' || s === 'failed' || s === 'unknown') return 'st-ing';
    return 'st-not';
  }
  function statusText(s) {
    return ({ 'not attempted': '未开始', 'unknown': '未开始', 'browsed': '已浏览', 'incomplete': '进行中',
              'completed': '已完成', 'passed': '已通过', 'failed': '未通过' })[s] || s || '—';
  }
  function updatePanel() {
    var l = getLearner();
    var byId = function (id) { return document.getElementById(id); };
    if (byId('kvName')) byId('kvName').textContent = l.name;
    var st = cmi2004['cmi.completion_status'] !== 'unknown' ? cmi2004['cmi.completion_status'] : cmi12['cmi.core.lesson_status'];
    var stEl = byId('kvStatus');
    if (stEl) { stEl.textContent = statusText(st); stEl.className = 'status-pill ' + statusClass(st); }
    var raw = cmi2004['cmi.score.raw'] !== '' ? cmi2004['cmi.score.raw'] : cmi12['cmi.core.score.raw'];
    if (byId('kvScore')) byId('kvScore').textContent = raw ? (raw + ' / 100') : '—';
    var loc = cmi2004['cmi.location'] || cmi12['cmi.core.lesson_location'];
    if (byId('kvLoc')) byId('kvLoc').textContent = loc || '—';
    if (byId('kvStd')) byId('kvStd').textContent = activeStandard;
  }
  var panelTimer = null;
  function debouncePanel() { if (panelTimer) clearTimeout(panelTimer); panelTimer = setTimeout(updatePanel, 120); }

  /* ── 持久化（两套数据模型共存在同一份 Attempt 中）───────────────── */
  function loadAttempt(cb) {
    var token = getToken();
    if (!token) { cb && cb(); return; }
    fetch('https://api.github.com/repos/EstaTea/fsl-report/contents/' + ghPath(), {
      headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json' }
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (j && j.content) {
          try {
            var data = JSON.parse(decodeURIComponent(escape(atob((j.content || '').replace(/\s/g, '')))));
            if (data) {
              if (data.cmi) mergeInto(cmi12, data.cmi);
              if (data.cmi2004) mergeInto(cmi2004, data.cmi2004);
              lastSha = j.sha;
              setSave('已从云端恢复上次进度', 'ok');
              logApi('恢复云端进度（' + (data.standard || '未知标准') + '）', 'ok');
            }
          } catch (e) {}
        }
        cb && cb();
      })
      .catch(function () { cb && cb(); });
  }
  function mergeInto(target, src) {
    for (var k in src) { if (src.hasOwnProperty(k)) target[k] = src[k]; }
  }
  function saveAttempt(cb) {
    var token = getToken();
    if (!token) {
      setSave('未登录 / 无写权限：本次进度仅在当前会话有效', 'warn');
      logApi('保存跳过：无 token', 'warn'); cb && cb(); return;
    }
    var payload = { course: courseId(), standard: activeStandard, cmi: cmi12, cmi2004: cmi2004, updated_at: new Date().toISOString() };
    var body = { message: 'training: save attempt ' + ghPath(), content: btoa(unescape(encodeURIComponent(JSON.stringify(payload, null, 2)))) };
    if (lastSha) body.sha = lastSha;
    fetch('https://api.github.com/repos/EstaTea/fsl-report/contents/' + ghPath(), {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) {
        lastSha = (j.content && j.content.sha) ? j.content.sha : lastSha;
        setSave('进度已保存到 GitHub（云端）', 'ok');
        logApi('保存成功 → GitHub', 'ok'); cb && cb();
      })
      .catch(function (e) {
        setSave('保存失败：' + e.message + '（演示环境 / 无写权限）', 'warn');
        logApi('保存失败：' + e.message, 'warn'); cb && cb();
      });
  }

  /* ── 两套标准之间的状态镜像 ─────────────────────────────────────
     学员可能从 SCORM 1.2 课程进入，也可能从 2004 课程进入；
     无论哪条链路写入，都同步到另一套模型，保证报告口径统一。      */
  function mirror12(key, val) {
    if (key === 'cmi.core.lesson_status') {
      cmi2004['cmi.completion_status'] = (val === 'completed' || val === 'passed') ? 'completed'
        : (val === 'incomplete' || val === 'browsed') ? 'incomplete' : 'unknown';
      cmi2004['cmi.success_status'] = (val === 'passed') ? 'passed' : (val === 'failed') ? 'failed' : 'unknown';
    } else if (key === 'cmi.core.score.raw') {
      cmi2004['cmi.score.raw'] = val;
      cmi2004['cmi.score.scaled'] = toScaled(val);
    } else if (key === 'cmi.core.lesson_location') { cmi2004['cmi.location'] = val; }
    else if (key === 'cmi.core.suspend_data') { cmi2004['cmi.suspend_data'] = val; }
  }
  function mirror2004(key, val) {
    if (key === 'cmi.completion_status') {
      cmi12['cmi.core.lesson_status'] = (val === 'completed') ? 'completed'
        : (val === 'incomplete') ? 'incomplete' : (val === 'unknown' ? 'not attempted' : val);
    } else if (key === 'cmi.success_status' && (val === 'passed' || val === 'failed')) {
      cmi12['cmi.core.lesson_status'] = val;
    } else if (key === 'cmi.score.raw') { cmi12['cmi.core.score.raw'] = val; }
    else if (key === 'cmi.location') { cmi12['cmi.core.lesson_location'] = val; }
    else if (key === 'cmi.suspend_data') { cmi12['cmi.core.suspend_data'] = val; }
  }
  function toScaled(v) {
    var n = parseFloat(v);
    return isNaN(n) ? '' : String(Math.max(0, Math.min(1, n / 100)));
  }

  /* ── xAPI / cmi5 联动 ────────────────────────────────────────── */
  function xInit() {
    if (!window.FSL_XAPI) return;
    window.FSL_XAPI.init({ courseId: courseId(), title: document.title, auId: window.FSL_XAPI.activityId() });
  }
  function xEmit(verb, opts) {
    if (!window.FSL_XAPI) return;
    window.FSL_XAPI.emit(verb, opts);
  }
  function onComplete(completionStatus, scoreRaw) {
    if (!window.FSL_XAPI) return;
    var res = window.FSL_XAPI.resultFromCmi(completionStatus, scoreRaw);
    xEmit(window.FSL_XAPI.VERB.completed, { result: res });
    if (res.success) xEmit(window.FSL_XAPI.VERB.passed, { result: res });
    window.FSL_XAPI.persist(function (r, err) {
      if (r) logApi('xAPI 语句已写入仓库（' + r.count + ' 条）', 'ok');
      else if (err === 'no-token') logApi('xAPI：无 token，语句未持久化', 'warn');
    });
  }

  /* ── SCORM 1.2 Runtime ───────────────────────────────────────── */
  var API12 = {
    LMSInitialize: function () {
      if (init12) { errorCode = '101'; return '1'; }
      init12 = true; startTime = Date.now(); activeStandard = 'SCORM 1.2';
      var l = getLearner();
      cmi12['cmi.core.student_name'] = l.name;
      cmi12['cmi.core.student_id'] = l.id;
      logApi('LMSInitialize ✓（SCORM 1.2）', 'ok');
      loadAttempt(function () { updatePanel(); });
      xInit(); xEmit(window.FSL_XAPI && window.FSL_XAPI.VERB.launched);
      errorCode = '0'; return '0';
    },
    LMSFinish: function () {
      if (!init12) { errorCode = '301'; return '1'; }
      cmi12['cmi.core.session_time'] = fmt12(Date.now() - startTime);
      if (init2004) cmi2004['cmi.session_time'] = fmt2004(Date.now() - startTime);
      logApi('LMSFinish → 保存', 'act');
      xEmit(window.FSL_XAPI && window.FSL_XAPI.VERB.terminated);
      if (window.FSL_XAPI) window.FSL_XAPI.persist(function () {});
      saveAttempt(function () { updatePanel(); });
      init12 = false; errorCode = '0'; return '0';
    },
    LMSGetValue: function (p) {
      if (!init12) { errorCode = '301'; return ''; }
      var v = cmi12.hasOwnProperty(p) ? cmi12[p] : '';
      errorCode = '0'; return v;
    },
    LMSSetValue: function (p, v) {
      if (!init12) { errorCode = '301'; return '1'; }
      v = (v === undefined || v === null) ? '' : String(v);
      cmi12[p] = v; mirror12(p, v);
      if (p === 'cmi.core.lesson_status' || p === 'cmi.core.score.raw') {
        logApi('LMSSetValue ' + p + ' = ' + v, 'act');
        if (p === 'cmi.core.lesson_status' && (v === 'completed' || v === 'passed')) onComplete('completed', cmi12['cmi.core.score.raw']);
      }
      debouncePanel(); errorCode = '0'; return '0';
    },
    LMSCommit: function () {
      if (!init12) { errorCode = '301'; return '1'; }
      logApi('LMSCommit → 保存', 'act');
      saveAttempt(function () { updatePanel(); });
      errorCode = '0'; return '0';
    },
    LMSGetLastError: function () { return errorCode; },
    LMSGetErrorString: function (c) { return c === '0' ? 'No error' : '(error ' + c + ')'; },
    LMSGetDiagnostic: function (c) { return c === '0' ? 'No error' : '(diagnostic ' + c + ')'; }
  };

  /* ── SCORM 2004 Runtime（IEEE 1484.11.2 data model）──────────── */
  var API2004 = {
    Initialize: function () {
      if (init2004) { errorCode = '103'; return 'false'; }
      init2004 = true; startTime = startTime || Date.now(); activeStandard = 'SCORM 2004';
      var l = getLearner();
      cmi2004['cmi.learner_id'] = l.id;
      cmi2004['cmi.learner_name'] = l.name;
      logApi('Initialize ✓（SCORM 2004）', 'ok');
      loadAttempt(function () { updatePanel(); });
      xInit(); xEmit(window.FSL_XAPI && window.FSL_XAPI.VERB.launched);
      errorCode = '0'; return 'true';
    },
    Terminate: function () {
      if (!init2004) { errorCode = '112'; return 'false'; }
      cmi2004['cmi.session_time'] = fmt2004(Date.now() - (startTime || Date.now()));
      logApi('Terminate → 保存（SCORM 2004）', 'act');
      xEmit(window.FSL_XAPI && window.FSL_XAPI.VERB.terminated);
      if (window.FSL_XAPI) window.FSL_XAPI.persist(function () {});
      saveAttempt(function () { updatePanel(); });
      init2004 = false; errorCode = '0'; return 'true';
    },
    GetValue: function (p) {
      if (!init2004) { errorCode = '122'; return ''; }
      if (typeof p !== 'string' || p.indexOf('cmi.') !== 0) { errorCode = '201'; return ''; }
      var v = cmi2004.hasOwnProperty(p) ? cmi2004[p] : '';
      errorCode = '0'; return v;
    },
    SetValue: function (p, v) {
      if (!init2004) { errorCode = '132'; return 'false'; }
      if (typeof p !== 'string' || p.indexOf('cmi.') !== 0) { errorCode = '201'; return 'false'; }
      v = (v === undefined || v === null) ? '' : String(v);
      cmi2004[p] = v; mirror2004(p, v);
      if (p === 'cmi.completion_status' || p === 'cmi.score.raw' || p === 'cmi.success_status') {
        logApi('SetValue ' + p + ' = ' + v + '（2004）', 'act');
        if (p === 'cmi.completion_status' && v === 'completed') onComplete('completed', cmi2004['cmi.score.raw']);
      }
      debouncePanel(); errorCode = '0'; return 'true';
    },
    Commit: function () {
      if (!init2004) { errorCode = '142'; return 'false'; }
      logApi('Commit → 保存（2004）', 'act');
      saveAttempt(function () { updatePanel(); });
      if (window.FSL_XAPI) window.FSL_XAPI.persist(function () {});
      errorCode = '0'; return 'true';
    },
    GetLastError: function () { return String(errorCode); },
    GetErrorString: function (c) {
      return ({ '0': 'No error', '101': 'General exception', '102': 'General initialization failure',
        '103': 'Already initialized', '104': 'Content instance terminated', '112': 'Termination before initialization',
        '122': 'Retrieve data before initialization', '132': 'Store data before initialization',
        '142': 'Commit before initialization', '201': 'Invalid argument error',
        '401': 'Undefined data model element', '402': 'Unimplemented data model element',
        '403': 'Data model element value not initialized', '404': 'Data model element is read only',
        '405': 'Data model element is write only', '406': 'Data model element type mismatch' })[String(c)] || '(unknown error)';
    },
    GetDiagnostic: function (c) { return c === '0' || c === 0 ? 'No error' : '(diagnostic ' + c + ')'; }
  };

  /* ── 时长格式：1.2 用 HH:MM:SS，2004 用 ISO8601 duration ─────── */
  function fmt12(ms) {
    var s = Math.floor(ms / 1000);
    var hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
    function pad(n) { return n < 10 ? '0' + n : String(n); }
    return pad(hh) + ':' + pad(mm) + ':' + pad(ss);
  }
  function fmt2004(ms) {
    var s = Math.floor(ms / 1000);
    return 'PT' + Math.floor(s / 3600) + 'H' + Math.floor((s % 3600) / 60) + 'M' + (s % 60) + 'S';
  }

  window.API = API12;
  window.API_1484_11 = API2004;
  window.__FSL_LMS = {
    standard: function () { return activeStandard; },
    getCmi: function () { return cmi12; },
    getCmi2004: function () { return cmi2004; },
    reset: function () {
      cmi12['cmi.core.lesson_status'] = 'not attempted';
      cmi12['cmi.core.score.raw'] = '';
      cmi12['cmi.core.lesson_location'] = '';
      cmi12['cmi.core.suspend_data'] = '';
      cmi2004['cmi.completion_status'] = 'unknown';
      cmi2004['cmi.success_status'] = 'unknown';
      cmi2004['cmi.score.raw'] = '';
      cmi2004['cmi.score.scaled'] = '';
      cmi2004['cmi.location'] = '';
      updatePanel();
      saveAttempt(function () {});
    }
  };
  document.addEventListener('DOMContentLoaded', updatePanel);
})();
