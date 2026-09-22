/* ============================================================================
   真实 ERP 生产 DOM 的「稳定选择器」适配层（零依赖，不引任何 CDN）

   解决的问题：
   SAP Fiori 会生成 __xmlview0--v1_supplier-inner 这种带随机流水号的 id，
   用友 U8 Web 端大量靠 name 属性，博科又不一样 —— 用写死的 CSS 选择器，
   系统一升级版本号课程就全废。

   做法：每个步骤可以给出一组「候选描述」，按稳定性从高到低依次尝试；
   命中后返回元素 + 采用的策略 + 置信度。全部命中失败再退到原始 CSS 选择器。
   同时提供 waitFor —— SPA 异步渲染下元素延迟出现也能等到（MutationObserver）。
   ========================================================================== */
(function () {
  'use strict';

  /* ── 1. 稳定性策略表（顺序即优先级）──────────────────────────────── */
  // score：0~100，越高越稳。audit 面板用它给培训师提示。
  var STRATEGIES = [
    {
      // 自动化测试专用属性：业务语义明确且不易变，最稳
      name: 'test-attr', score: 95,
      attrs: ['data-testid', 'data-test-id', 'data-test', 'data-qa', 'data-automation-id', 'data-e2e'],
      find: function (root, spec) {
        if (!spec.testId) return null;
        for (var i = 0; i < this.attrs.length; i++) {
          var n = root.querySelector('[' + this.attrs[i] + '="' + cssEsc(spec.testId) + '"]');
          if (n) return n;
        }
        return null;
      }
    },
    {
      // 无障碍 label：法规要求保留，比 id 稳，且各 ERP 都在补
      name: 'aria-label', score: 85,
      find: function (root, spec) {
        if (!spec.label) return null;
        return root.querySelector('[aria-label="' + cssEsc(spec.label) + '"]') ||
          root.querySelector('[title="' + cssEsc(spec.label) + '"]') || null;
      }
    },
    {
      // 用友/传统 Web 端的 name 属性
      name: 'name-attr', score: 80,
      find: function (root, spec) {
        if (!spec.name) return null;
        return root.querySelector('[name="' + cssEsc(spec.name) + '"]') || null;
      }
    },
    {
      // 可见文案：按钮/链接/Tab 最常用；最后手段但很直观
      name: 'text', score: 60,
      find: function (root, spec) {
        if (!spec.text) return null;
        var wanted = String(spec.text).trim();
        var cands = root.querySelectorAll('button,a,[role="button"],[role="tab"],label,.sapMBtn span,.uf-btn,uxtoolbar-item');
        for (var i = 0; i < cands.length; i++) {
          if ((cands[i].textContent || '').trim() === wanted) return cands[i];
        }
        // 退一步：包含匹配（取最短的那个，避免命中容器）
        var hit = null;
        for (var j = 0; j < cands.length; j++) {
          var t = (cands[j].textContent || '').trim();
          if (t && t.indexOf(wanted) >= 0 && (!hit || t.length < (hit.textContent || '').length)) hit = cands[j];
        }
        return hit;
      }
    },
    {
      // placeholder：输入框友好
      name: 'placeholder', score: 55,
      find: function (root, spec) {
        if (!spec.placeholder) return null;
        return root.querySelector('[placeholder="' + cssEsc(spec.placeholder) + '"]') || null;
      }
    },
    {
      // 原始 CSS 选择器：兜底。id 看起来像自动生成的话降权警告
      name: 'css', score: 30,
      find: function (root, spec) {
        if (!spec.sel) return null;
        try { return root.querySelector(spec.sel); } catch (e) { return null; }
      }
    }
  ];

  /* 看起来像框架自动生成的 id（__xmlview0--foo-inner / v1_a12 等）*/
  var AUTO_ID = /(__xmlview|__component|__jsview|\w+--\w+|-\d{3,}|\d{2,})/i;

  function cssEsc(s) { return String(s).replace(/["\\]/g, '\\$&'); }

  /* ── 2. 把「步骤里的 el」规范成统一的候选描述 ─────────────────────
     el 支持三种写法：
       '#va-save'                      —— 纯 CSS（旧课程兼容）
       '[aria-label=供应商]' … 同上
       { testId:'supplier' } / { label:'保存' } / { text:'保存' }
       { sel:'#a', label:'保存', text:'保存' } —— 多候选，依次降级    */
  function normalize(el) {
    if (!el) return null;
    if (typeof el === 'string') return { sel: el };
    if (Array.isArray(el)) return el.map(normalize).filter(Boolean);
    var spec = {};
    ['sel', 'testId', 'label', 'name', 'text', 'placeholder'].forEach(function (k) {
      if (el[k]) spec[k] = el[k];
    });
    return Object.keys(spec).length ? spec : null;
  }

  function tryOne(root, spec) {
    for (var i = 0; i < STRATEGIES.length; i++) {
      var s = STRATEGIES[i], node = null;
      try { node = s.find(root, spec); } catch (e) { node = null; }
      if (node) {
        var score = s.score;
        // 自动生成 id 或非唯一命中，都要扣分
        if (s.name === 'css' && spec.sel && AUTO_ID.test(spec.sel)) score -= 25;
        if (spec.sel) {
          try {
            var n = root.querySelectorAll(spec.sel).length;
            if (n > 1) score -= Math.min(20, (n - 1) * 5);
          } catch (e2) { /* 选择器非法已在 find 里处理 */ }
        }
        return { node: node, strategy: s.name, score: Math.max(0, Math.round(score)) };
      }
    }
    return null;
  }

  /* ── 3. 解析（同步）：返回 {node, strategy, score} 或 null ─────────── */
  function resolve(el, root) {
    root = root || document;
    var specs = normalize(el);
    if (!specs) return null;
    if (!Array.isArray(specs)) specs = [specs];
    for (var i = 0; i < specs.length; i++) {
      var r = tryOne(root, specs[i]);
      if (r) return r;
    }
    return null;
  }

  /* ── 4. 等待元素出现（SPA 异步渲染必备）──────────────────────────
     用 MutationObserver 而非轮询，变更即重试；超时则回调未命中。      */
  function waitFor(el, opts) {
    opts = opts || {};
    var timeout = opts.timeout || 12000;
    var root = opts.root || document;
    var mo = null, timer = null, done = false;

    function finish(res) {
      if (done) return; done = true;
      if (mo) mo.disconnect();
      if (timer) clearInterval(timer);
      (opts.onFound || function () { })(res);
    }

    var hit = resolve(el, root);
    if (hit) { setTimeout(function () { finish(hit); }, 0); return stopFn; }

    if (typeof MutationObserver !== 'undefined') {
      mo = new MutationObserver(function () {
        var h = resolve(el, root);
        if (h) finish(h);
      });
      mo.observe(root === document ? (document.body || document.documentElement) : root,
        { childList: true, subtree: true, attributes: true });
    }
    // 兜底定时（部分框架只在微任务里改 DOM，observer 可能合并掉）
    timer = setInterval(function () {
      var h = resolve(el, root);
      if (h) finish(h);
    }, 400);
    setTimeout(function () { if (!done) finish(null); }, timeout);

    function stopFn() { if (!done) finish(null); }
    return stopFn;
  }

  /* ── 5. 给元素生成候选描述（供编排器「拾取」时产出稳定选择器）────── */
  function describe(node) {
    if (!node || node.nodeType !== 1) return [];
    var out = [], id = node.id;
    for (var i = 0; i < STRATEGIES[0].attrs.length; i++) {
      var a = STRATEGIES[0].attrs[i], v = node.getAttribute(a);
      if (v) out.push({ key: 'testId', value: v, strategy: 'test-attr', score: 95 });
    }
    var al = node.getAttribute('aria-label');
    if (al) out.push({ key: 'label', value: al, strategy: 'aria-label', score: 85 });
    var nm = node.getAttribute('name');
    if (nm) out.push({ key: 'name', value: nm, strategy: 'name-attr', score: 80 });
    var txt = (node.textContent || '').trim();
    if (txt && txt.length <= 24 && !node.querySelector('*')) {
      out.push({ key: 'text', value: txt, strategy: 'text', score: 60 });
    }
    var ph = node.getAttribute('placeholder');
    if (ph) out.push({ key: 'placeholder', value: ph, strategy: 'placeholder', score: 55 });
    if (id) {
      var unstable = AUTO_ID.test(id);
      out.push({ key: 'sel', value: '#' + id, strategy: 'css', score: unstable ? 15 : 45, warn: unstable ? '看起来是自动生成的 id' : '' });
    }
    return out.sort(function (a, b) { return b.score - a.score; });
  }

  /* ── 6. 体检：给定课程步骤数组，逐个检查能否命中 ────────────────── */
  function audit(steps, root) {
    root = root || document;
    return (steps || []).map(function (st, i) {
      var r = resolve(st.el, root);
      var base = { index: i, title: st.title || ('步骤 ' + (i + 1)), ok: !!r, strategy: r && r.strategy, score: r && r.score };
      if (!r) { base.problem = '未命中：该步可能无法引导'; return base; }
      if (r.score <= 30) { base.problem = '选择器不稳定（' + r.strategy + '，置信度 ' + r.score + '），建议改用 testId / aria-label'; }
      else if (r.score < 60) { base.problem = '置信度偏低（' + r.score + '），界面升级时有失效风险'; }
      return base;
    });
  }

  window.FSL_SELECTOR = {
    resolve: resolve,
    waitFor: waitFor,
    describe: describe,
    audit: audit,
    normalize: normalize,
    STRATEGIES: STRATEGIES
  };
})();
