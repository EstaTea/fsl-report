/*
 * ERP 仿真培训引擎（MVP） — 自研，MIT License
 * 功能：在浏览器里渲染一个"仿真 ERP 事务屏幕"，按步骤引导学员操作，
 *       对点击/输入做校验，完成全部步骤后回调 onComplete。
 * 设计目标：零外部依赖、可离线、单数据源（场景+步骤集中定义），
 *           既用于独立演示版（sim-player.html），也用于 SCORM 包（player.html）。
 */
(function (global) {
  'use strict';

  // ---------- 1. 仿真场景（ERP 事务屏幕的数据模型） ----------
  // 这是一个"创建采购订单"的通用 ERP 表单，适配 SAP / 用友 / 博科的同类界面。
  var FORM = {
    title: '采购订单 - 创建（ME21N 风格）',
    subtitle: '事务码 ME21N · 演示仿真环境',
    fields: [
      { id: 'supplier', label: '供应商', type: 'text', placeholder: '请输入供应商编码', required: true },
      { id: 'material', label: '物料编码', type: 'text', placeholder: '请输入物料编码', required: true },
      { id: 'qty', label: '数量', type: 'number', placeholder: '0', required: true },
      { id: 'plant', label: '工厂', type: 'text', value: '1000', readonly: true },
      { id: 'docDate', label: '凭证日期', type: 'text', value: '2026-09-14', readonly: true }
    ],
    buttons: [
      { id: 'new', label: '新建采购订单' },
      { id: 'save', label: '保存' }
    ]
  };

  // ---------- 2. 引导步骤（顺序执行） ----------
  var STEPS = [
    { id: 's1', title: '进入采购订单创建', instruction: '点击顶部「新建采购订单」按钮，进入创建界面。', target: '#btn-new', action: 'click' },
    { id: 's2', title: '填写供应商', instruction: '在「供应商」字段输入：100012', target: '#field-supplier', action: 'input', expect: '100012' },
    { id: 's3', title: '填写物料编码', instruction: '在「物料编码」字段输入：MAT-LED-001', target: '#field-material', action: 'input', expect: 'MAT-LED-001' },
    { id: 's4', title: '填写数量', instruction: '在「数量」字段输入：500', target: '#field-qty', action: 'input', expect: '500' },
    { id: 's5', title: '保存订单', instruction: '点击「保存」按钮提交采购订单。', target: '#btn-save', action: 'click' }
  ];

  // ---------- 3. 注入样式（自包含，无需外部 CSS 文件） ----------
  function injectStyles() {
    if (document.getElementById('sim-engine-style')) return;
    var css = [
      '.sim-wrap{display:flex;gap:16px;font-family:-apple-system,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif;color:#1f2937;max-width:980px;margin:0 auto;}',
      '.sim-steps{flex:0 0 280px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;}',
      '.sim-steps h3{margin:0 0 10px;font-size:14px;color:#0b2d47;}',
      '.sim-step{display:flex;gap:8px;padding:8px;border-radius:8px;margin-bottom:6px;font-size:13px;line-height:1.4;background:#fff;border:1px solid #e5e7eb;}',
      '.sim-step.active{background:#eaf2fb;border-color:#2374a3;box-shadow:0 0 0 2px rgba(35,116,163,.15);}',
      '.sim-step.done{background:#eef6ee;border-color:#3a7d44;color:#2f5d36;}',
      '.sim-step .dot{flex:0 0 20px;height:20px;border-radius:50%;background:#cbd5e1;color:#fff;font-size:12px;display:flex;align-items:center;justify-content:center;}',
      '.sim-step.active .dot{background:#2374a3;}',
      '.sim-step.done .dot{background:#3a7d44;}',
      '.sim-canvas{flex:1;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:16px;min-height:320px;}',
      '.sim-screen{border:1px solid #cbd5e1;border-radius:8px;overflow:hidden;}',
      '.sim-titlebar{background:#0b2d47;color:#fff;padding:10px 14px;font-size:14px;font-weight:600;}',
      '.sim-subbar{background:#eaf2fb;color:#0b2d47;padding:4px 14px;font-size:12px;border-bottom:1px solid #cbd5e1;}',
      '.sim-toolbar{display:flex;gap:8px;padding:10px 14px;background:#f1f5f9;border-bottom:1px solid #e2e8f0;}',
      '.sim-btn{padding:6px 14px;border:1px solid #2374a3;background:#fff;color:#0b2d47;border-radius:6px;cursor:pointer;font-size:13px;}',
      '.sim-btn.primary{background:#2374a3;color:#fff;}',
      '.sim-btn:disabled{opacity:.5;cursor:not-allowed;}',
      '.sim-body{padding:14px;display:grid;grid-template-columns:1fr 1fr;gap:12px;}',
      '.sim-field label{display:block;font-size:12px;color:#475569;margin-bottom:4px;}',
      '.sim-field input{width:100%;padding:7px 9px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;box-sizing:border-box;}',
      '.sim-field input[readonly]{background:#f1f5f9;color:#64748b;}',
      '.sim-hint{margin:12px 0 0;padding:10px 12px;border-radius:8px;font-size:13px;background:#eaf2fb;color:#0b2d47;border:1px solid #bcd6ec;}',
      '.sim-hint.error{background:#fdecec;color:#9b1c1c;border-color:#f0b4b4;}',
      '.sim-hint.ok{background:#eef6ee;color:#2f5d36;border-color:#bfe0c2;}',
      '.sim-progress{height:6px;background:#e2e8f0;border-radius:4px;margin:0 0 12px;overflow:hidden;}',
      '.sim-progress > i{display:block;height:100%;background:#2374a3;width:0;transition:width .3s;}',
      '.sim-hotspot{outline:3px solid #f59e0b !important;outline-offset:2px;border-radius:6px;animation:pulse 1.2s infinite;}',
      '@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(245,158,11,.5);}70%{box-shadow:0 0 0 10px rgba(245,158,11,0);}100%{box-shadow:0 0 0 0 rgba(245,158,11,0);}}',
      '.sim-done-banner{padding:14px;border-radius:10px;background:#eef6ee;border:1px solid #bfe0c2;color:#2f5d36;font-size:14px;text-align:center;margin-top:14px;}'
    ].join('\n');
    var st = document.createElement('style');
    st.id = 'sim-engine-style';
    st.textContent = css;
    document.head.appendChild(st);
  }

  // ---------- 4. 引擎主体 ----------
  function SimEngine(opts) {
    this.opts = opts || {};
    this.container = typeof opts.container === 'string' ? document.querySelector(opts.container) : opts.container;
    this.form = opts.form || FORM;
    this.steps = opts.steps || STEPS;
    this.current = 0;
    this.done = [];
    this.render();
    this.bind();
    this.activate(0);
  }

  SimEngine.prototype.render = function () {
    injectStyles();
    var f = this.form;
    var stepsHtml = this.steps.map(function (s, i) {
      return '<div class="sim-step" data-idx="' + i + '"><span class="dot">' + (i + 1) + '</span><span>' + s.title + '</span></div>';
    }).join('');

    var fieldsHtml = f.fields.map(function (fd) {
      var attrs = 'id="field-' + fd.id + '" data-field="' + fd.id + '" class="sim-input"';
      if (fd.readonly) attrs += ' readonly value="' + (fd.value || '') + '"';
      else attrs += ' placeholder="' + (fd.placeholder || '') + '"';
      return '<div class="sim-field"><label>' + fd.label + (fd.required ? ' *' : '') + '</label><input type="' + (fd.type || 'text') + '" ' + attrs + '></div>';
    }).join('');

    var buttonsHtml = f.buttons.map(function (b) {
      return '<button type="button" id="btn-' + b.id + '" data-btn="' + b.id + '" class="sim-btn ' + (b.id === 'save' ? 'primary' : '') + '">' + b.label + '</button>';
    }).join('');

    this.container.innerHTML =
      '<div class="sim-wrap">' +
        '<div class="sim-steps"><h3>操作指引</h3><div class="sim-step-list">' + stepsHtml + '</div></div>' +
        '<div class="sim-canvas">' +
          '<div class="sim-progress"><i id="sim-bar"></i></div>' +
          '<div class="sim-screen">' +
            '<div class="sim-titlebar">' + f.title + '</div>' +
            '<div class="sim-subbar">' + (f.subtitle || '') + '</div>' +
            '<div class="sim-toolbar">' + buttonsHtml + '</div>' +
            '<div class="sim-body">' + fieldsHtml + '</div>' +
          '</div>' +
          '<div class="sim-hint" id="sim-hint">准备开始：' + this.steps[0].instruction + '</div>' +
          '<div id="sim-banner"></div>' +
        '</div>' +
      '</div>';

    this.el = {
      steps: this.container.querySelectorAll('.sim-step'),
      bar: this.container.querySelector('#sim-bar'),
      hint: this.container.querySelector('#sim-hint'),
      banner: this.container.querySelector('#sim-banner')
    };
  };

  SimEngine.prototype.bind = function () {
    var self = this;
    // 点击校验
    this.container.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-btn]');
      if (!btn) return;
      var step = self.steps[self.current];
      if (step.action === 'click' && '#btn-' + btn.getAttribute('data-btn') === step.target) {
        self.completeStep();
      } else {
        self.fail('那不是当前步骤要点的按钮。请按指引操作：' + step.instruction);
      }
    });
    // 输入校验
    this.container.addEventListener('input', function (e) {
      var field = e.target.closest('[data-field]');
      if (!field) return;
      var step = self.steps[self.current];
      if (step.action === 'input' && '#field-' + field.getAttribute('data-field') === step.target) {
        if (String(e.target.value).trim() === step.expect) {
          self.completeStep();
        }
      }
    });
  };

  SimEngine.prototype.activate = function (idx) {
    var self = this;
    this.current = idx;
    // 高亮步骤面板
    Array.prototype.forEach.call(this.el.steps, function (el, i) {
      el.classList.toggle('active', i === idx && self.done.indexOf(i) === -1);
      el.classList.toggle('done', self.done.indexOf(i) !== -1);
    });
    // 高亮画布热点
    this.container.querySelectorAll('.sim-hotspot').forEach(function (n) { n.classList.remove('sim-hotspot'); });
    var step = this.steps[idx];
    if (step && (step.action === 'click' || step.action === 'input')) {
      var node = this.container.querySelector(step.target);
      if (node) node.classList.add('sim-hotspot');
    }
    this.hint(step ? ('第 ' + (idx + 1) + ' 步：' + step.instruction) : '已完成', '');
    this.el.bar.style.width = (this.done.length / this.steps.length * 100) + '%';
  };

  SimEngine.prototype.completeStep = function () {
    var idx = this.current;
    if (this.done.indexOf(idx) !== -1) return;
    this.done.push(idx);
    this.el.bar.style.width = (this.done.length / this.steps.length * 100) + '%';
    Array.prototype.forEach.call(this.el.steps, function (el, i) {
      el.classList.toggle('done', i === idx);
      el.classList.remove('active');
    });
    if (this.opts.onStep) this.opts.onStep(this.steps[idx], idx);
    if (this.done.length >= this.steps.length) {
      this.finish();
    } else {
      this.activate(idx + 1);
      this.hint('✓ 完成：' + this.steps[idx].title, 'ok');
      // 短暂显示成功提示后回到下一步指引
      var self = this;
      setTimeout(function () { self.hint('第 ' + (idx + 2) + ' 步：' + self.steps[idx + 1].instruction, ''); }, 1200);
    }
  };

  SimEngine.prototype.fail = function (msg) {
    this.hint(msg, 'error');
    if (this.opts.onError) this.opts.onError(msg);
  };

  SimEngine.prototype.hint = function (msg, kind) {
    this.el.hint.textContent = msg;
    this.el.hint.className = 'sim-hint' + (kind ? ' ' + kind : '');
  };

  SimEngine.prototype.finish = function () {
    this.container.querySelectorAll('.sim-hotspot').forEach(function (n) { n.classList.remove('sim-hotspot'); });
    this.el.bar.style.width = '100%';
    var score = 100;
    this.el.banner.innerHTML = '<div class="sim-done-banner">🎉 仿真练习完成！得分 ' + score + ' / 100 — 采购订单创建流程已掌握。</div>';
    if (this.opts.onComplete) this.opts.onComplete({ score: score, steps: this.done.length, total: this.steps.length });
  };

  // 供外部（player.html）挂载
  SimEngine.mount = function (opts) { return new SimEngine(opts); };

  global.SimEngine = SimEngine;
  global.SIM_FORM = FORM;
  global.SIM_STEPS = STEPS;
})(window);
