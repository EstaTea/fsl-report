/* ============================================================================
   xAPI / cmi5 适配层
   - 生成符合 xAPI 0.95 / 1.0.x 规范的 statement
   - cmi5 要求的 context 扩展（registration / sessionid / masteryScore 等）
   - 语句持久化：GitHub Contents API → data/training/xapi/{course}/{login}.jsonl
     （追加写入，需先 GET 取 sha；不写 localStorage，数据不出境）
   依赖：window.FSL_SESSION（含 login/name/gh_token）
   ========================================================================== */
(function () {
  'use strict';
  var REPO = 'EstaTea/fsl-report';
  var VERB = {
    initialized: 'http://adlnet.gov/expapi/verbs/initialized',
    launched:    'http://adlnet.gov/expapi/verbs/launched',
    completed:   'http://adlnet.gov/expapi/verbs/completed',
    passed:      'http://adlnet.gov/expapi/verbs/passed',
    failed:      'http://adlnet.gov/expapi/verbs/failed',
    progressed:  'http://adlnet.gov/expapi/verbs/progressed',
    suspended:   'http://adlnet.gov/expapi/verbs/suspended',
    terminated:  'http://adlnet.gov/expapi/verbs/terminated',
    answered:    'http://adlnet.gov/expapi/verbs/answered',
    experienced: 'http://adlnet.gov/expapi/verbs/experienced'
  };
  var HOME = 'https://estatea.github.io/fsl-report/training/';

  var ctx = { courseId: '', title: '', desc: '', auId: '', registration: uuid() };
  var statements = [];
  var shaCache = {};

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  function session() { return window.FSL_SESSION || {}; }
  function lsGet(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function token() {
    var s = session();
    return s.gh_token || s.token || lsGet('gh_token_fsl');
  }
  function learner() {
    var s = session();
    return { name: s.name || s.login || '学员', id: s.login || s.email || 'anonymous' };
  }

  function api() {
    return {
      /* 初始化学习上下文（LMS 启动时调用一次） */
      init: function (o) {
        ctx.courseId = (o && o.courseId) || '';
        ctx.title = (o && o.title) || ctx.courseId;
        ctx.desc = (o && o.desc) || '';
        ctx.auId = (o && o.auId) || (HOME + '#/course/' + ctx.courseId);
        ctx.registration = uuid();
        return ctx;
      },
      VERB: VERB,
      uuid: uuid,
      activityId: function () { return HOME + '#/course/' + ctx.courseId; },

      /* 生成一条 statement（不立即发送） */
      build: function (verbId, opts) {
        opts = opts || {};
        var l = learner();
        var st = {
          id: uuid(),
          timestamp: new Date().toISOString(),
          actor: {
            objectType: 'Agent',
            name: l.name,
            account: { homePage: 'https://github.com/', name: l.id }
          },
          verb: { id: verbId, display: { 'zh-CN': opts.verbDisplay || verbLabel(verbId) } },
          object: {
            objectType: 'Activity',
            id: ctx.auId,
            definition: {
              name: { 'zh-CN': ctx.title },
              type: 'http://adlnet.gov/expapi/activities/course'
            }
          },
          context: {
            registration: ctx.registration,
            language: 'zh-CN',
            extensions: {
              'https://w3id.org/xapi/cmi5/context/extensions/sessionid': ctx.registration,
              'https://w3id.org/xapi/cmi5/context/extensions/courseid': HOME + '#/course/' + ctx.courseId
            }
          }
        };
        if (ctx.desc) st.object.definition.description = { 'zh-CN': ctx.desc };
        if (opts.result) st.result = opts.result;
        if (opts.duration) {
          st.result = st.result || {};
          st.result.duration = opts.duration;
        }
        if (opts.extensions) {
          for (var k in opts.extensions) { if (opts.extensions.hasOwnProperty(k)) st.context.extensions[k] = opts.extensions[k]; }
        }
        return st;
      },

      /* 入队一条 statement */
      emit: function (verbId, opts) {
        var st = this.build(verbId, opts);
        statements.push(st);
        if (statements.length > 50) statements = statements.slice(-50);
        return st;
      },

      list: function () { return statements.slice(); },
      last: function () { return statements.length ? statements[statements.length - 1] : null; },
      clear: function () { statements = []; },

      /* cmi5 result 构造助手：把 SCORM 状态映射成 xAPI result */
      resultFromCmi: function (completionStatus, score) {
        var completed = completionStatus === 'completed';
        var r = { completion: completed };
        if (score !== '' && score !== null && score !== undefined) {
          var n = parseFloat(score);
          if (!isNaN(n)) {
            r.score = { raw: n, min: 0, max: 100, scaled: Math.max(0, Math.min(1, n / 100)) };
            r.success = n >= 60;
          }
        }
        return r;
      },

      xapiPath: function (courseId) {
        return 'data/training/xapi/' + encodeURIComponent(courseId || ctx.courseId) + '/' +
               encodeURIComponent(learner().id) + '.jsonl';
      },

      /* 把本次会话的语句追加写入 GitHub（JSONL，一行一条） */
      persist: function (cb) {
        var t = token();
        if (!t) { cb && cb(null, 'no-token'); return; }
        if (!statements.length) { cb && cb({ count: 0 }); return; }
        var path = this.xapiPath();
        var line = statements.map(function (s) { return JSON.stringify(s); }).join('\n') + '\n';
        getJson(path, t, function (existing, sha) {
          var merged = (existing || '') + line;
          putJson(path, merged, sha, t, function (ok, err) {
            if (ok) shaCache['sent'] = (shaCache['sent'] || 0) + statements.length;
            cb && cb(ok ? { count: statements.length } : null, err);
          });
        });
      }
    };
  }

  function verbLabel(id) {
    return ({ [VERB.completed]: '完成', [VERB.passed]: '通过', [VERB.failed]: '未通过',
      [VERB.initialized]: '初始化', [VERB.launched]: '启动', [VERB.progressed]: '进行中',
      [VERB.suspended]: '挂起', [VERB.terminated]: '结束', [VERB.experienced]: '体验',
      [VERB.answered]: '作答' })[id] || '活动';
  }

  function getJson(path, t, cb) {
    fetch('https://api.github.com/repos/' + REPO + '/contents/' + path, {
      headers: { 'Authorization': 'Bearer ' + t, 'Accept': 'application/vnd.github+json' }
    }).then(function (r) {
      if (!r.ok) { cb(null, null); return null; }
      return r.json();
    }).then(function (j) {
      if (!j) return;
      var txt = '';
      try { txt = decodeURIComponent(escape(atob((j.content || '').replace(/\s/g, '')))); } catch (e) { txt = ''; }
      cb(txt, j.sha);
    }).catch(function () { cb(null, null); });
  }
  function putJson(path, text, sha, t, cb) {
    var body = {
      message: 'training: xapi statements ' + path,
      content: btoa(unescape(encodeURIComponent(text)))
    };
    if (sha) body.sha = sha;
    fetch('https://api.github.com/repos/' + REPO + '/contents/' + path, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + t, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function () { cb(true); })
      .catch(function (e) { cb(false, e.message); });
  }

  window.FSL_XAPI = api();
})();
