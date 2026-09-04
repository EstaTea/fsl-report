/* ==========================================================================
 * 佛山照明经营数据可视化大屏 · 交互与渲染层
 * 依赖：echarts.min.js（本地）、data.js
 * 设计：单页两视图（总览 / 二级详情），视图切换时销毁图表与定时器，长时间运行无泄漏
 * ========================================================================== */
(function () {
  'use strict';

  var D = window.FSL_DATA;

  /* 原始官网 3D 城市场景的 18 热点 + 9 业务板块胶囊坐标（来自 hotspots.json，内联以便离线） */
  var HOTSPOTS = [
    { top: '18%', left: '10%', txt: '机场' }, { top: '63%', left: '9.5%', txt: '医院' },
    { top: '91%', left: '14%', txt: '植物工厂' }, { top: '89%', left: '25%', txt: '现代养殖基地' },
    { top: '28%', left: '31%', txt: '文旅景区' }, { top: '58%', left: '32.5%', txt: '学校' },
    { top: '37%', left: '9%', txt: '高铁站' }, { top: '84%', left: '45%', txt: '体育场馆' },
    { top: '27%', left: '46%', txt: '酒店商业综合体' }, { top: '24%', left: '64%', txt: '产业园' },
    { top: '44%', left: '68%', txt: '住宅' }, { top: '75%', left: '80%', txt: '汽车工厂' },
    { top: '46%', left: '82%', txt: '港口' }, { top: '69%', left: '88%', txt: '造船厂' },
    { top: '30%', left: '90%', txt: '海上平台' }, { top: '13.5%', left: '67%', txt: '陆基工厂化养殖基地' },
    { top: '11%', left: '77%', txt: '海洋牧场' }, { top: '19%', left: '81%', txt: '跨海大桥' }
  ];
  var BOXES = [
    { top: '20%', left: '12%', txt: '航空照明' }, { top: '56%', left: '21%', txt: '商用照明' },
    { top: '80%', left: '15%', txt: '动植物照明' }, { top: '74%', left: '45%', txt: '体育照明' },
    { top: '30%', left: '52%', txt: '智能电工' }, { top: '46%', left: '55%', txt: '家用照明' },
    { top: '67%', left: '68%', txt: '车用照明' }, { top: '24%', left: '78%', txt: '智慧城市照明' },
    { top: '35%', left: '86%', txt: '海洋照明' }
  ];

  /* ---------------------------------------------------------------- 常量 */
  var C = {
    cyan: '#00d4ff', blue: '#3f8cff', orange: '#ff7500',
    palette: ['#00d4ff', '#ff7500', '#3f8cff', '#7bffd4', '#ffc14e', '#c58cff'],
    text: '#dceaf7', muted: '#7f9db8', grid: 'rgba(255,255,255,.06)'
  };

  var ICONS = {
    sales: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 20V9M10 20V4M16 20v-7M22 20H2"/></svg>',
    rd: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 3h6M10 3v6.5L5.5 18A3 3 0 0 0 8.2 22h7.6a3 3 0 0 0 2.7-4.5L14 9.5V3"/><path d="M7.5 14h9"/></svg>',
    purchase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 4h2l2.4 11.2A2 2 0 0 0 9.4 17H19a2 2 0 0 0 2-1.6L22.5 8H6"/><circle cx="10" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/></svg>',
    production: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg>',
    warehouse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/></svg>',
    finance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M9 8l3 4 3-4M12 12v5M9.5 13.5h5M9.5 16h5"/></svg>',
    board: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 1 3.6 10.8c-.5.4-.8.9-.9 1.5l-.2 1.2H9.5l-.2-1.2c-.1-.6-.4-1.1-.9-1.5A6 6 0 0 1 12 3z"/></svg>'
  };

  /* ---------------------------------------------------------------- 工具 */
  function $(s, r) { return (r || document).querySelector(s); }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function fmt(v, decimals) {
    var d = decimals || 0;
    var n = Number(v) || 0;
    return n.toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function deltaHtml(d) {
    var up = d >= 0;
    return '<b class="' + (up ? 'up' : 'down') + '">' + (up ? '▲' : '▼') + ' ' + Math.abs(d).toFixed(1) + '%</b> 同比';
  }
  /** 数字滚动动画：rAF 驱动，切换时取消上一次动画，避免叠加 */
  function countUp(node, to, decimals, dur) {
    if (!node) return;
    var from = parseFloat(node.dataset.v || '0');
    node.dataset.v = to;
    if (node._raf) cancelAnimationFrame(node._raf);
    var t0 = performance.now(), span = dur || 1200;
    function step(t) {
      var p = Math.min(1, (t - t0) / span);
      var e = 1 - Math.pow(1 - p, 3);
      node.textContent = fmt(from + (to - from) * e, decimals);
      if (p < 1) node._raf = requestAnimationFrame(step);
    }
    node._raf = requestAnimationFrame(step);
  }

  /* ------------------------------------------------------------ 图表构建 */
  var charts = [];   // { inst, build } 统一登记，便于刷新与销毁
  var timers = [];   // 所有定时器，视图切换时统一清理

  function regTimer(fn, ms) { var id = setInterval(fn, ms); timers.push(id); return id; }
  function clearTimers() { timers.forEach(clearInterval); timers = []; }
  function clearCharts() {
    charts.forEach(function (c) { try { c.inst.dispose(); } catch (e) {} });
    charts = [];
  }
  function mount(node, buildFn) {
    if (!node) return null;
    var inst = echarts.init(node, null, { renderer: 'canvas' });
    inst.setOption(buildFn());
    var rec = { inst: inst, build: buildFn, node: node };
    charts.push(rec);
    return rec;
  }

  /* 首页视图独立的图表 / 定时器登记，避免与大屏视图（charts/timers）相互干扰 */
  var homeCharts = [];
  var homeTimers = [];
  function regHomeTimer(fn, ms) { var id = setInterval(fn, ms); homeTimers.push(id); return id; }
  function clearHomeTimers() { homeTimers.forEach(clearInterval); homeTimers = []; }
  function clearHomeCharts() {
    homeCharts.forEach(function (c) { try { c.inst.dispose(); } catch (e) {} });
    homeCharts = [];
  }
  function mountHome(node, buildFn) {
    if (!node) return null;
    var inst = echarts.init(node, null, { renderer: 'canvas' });
    inst.setOption(buildFn());
    homeCharts.push({ inst: inst, build: buildFn, node: node });
    return inst;
  }

  var TIP = {
    trigger: 'axis',
    backgroundColor: 'rgba(6,22,40,.94)',
    borderColor: 'rgba(0,212,255,.35)',
    borderWidth: 1,
    padding: [8, 12],
    textStyle: { color: C.text, fontSize: 12 },
    axisPointer: { type: 'line', lineStyle: { color: 'rgba(0,212,255,.35)' } }
  };
  var LEGEND = { top: 2, right: 6, itemWidth: 12, itemHeight: 8, itemGap: 14, textStyle: { color: C.muted, fontSize: 11 } };

  function axisBase(showSplit) {
    return {
      axisLine: { lineStyle: { color: 'rgba(0,212,255,.22)' } },
      axisTick: { show: false },
      axisLabel: { color: C.muted, fontSize: 11 },
      splitLine: showSplit ? { lineStyle: { color: C.grid, type: 'dashed' } } : { show: false }
    };
  }
  function grad(from, to) {
    return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: from }, { offset: 1, color: to }
    ]);
  }
  /** #rrggbb -> rgba(r,g,b,a) */
  function rgba(hex, a) {
    var h = (hex || '#00d4ff').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  /** 折线 / 柱状混合趋势图 */
  function optTrend(cfg) {
    var series = cfg.series.map(function (s, i) {
      var color = C.palette[i % C.palette.length];
      if (s.type === 'bar') {
        return {
          name: s.name, type: 'bar', barWidth: '38%', z: 2,
          data: s.data, itemStyle: { borderRadius: [3, 3, 0, 0], color: grad(color, 'rgba(0,32,64,.15)') }
        };
      }
      return {
        name: s.name, type: 'line', smooth: true, symbol: 'circle', symbolSize: 6, z: 3,
        lineStyle: { width: 2, color: color, shadowColor: color, shadowBlur: 10 },
        itemStyle: { color: color, borderColor: '#04121f', borderWidth: 1 },
        areaStyle: cfg.area === false ? undefined : { color: grad(rgba(color, .4), rgba(color, 0)) },
        data: s.data
      };
    });
    return {
      tooltip: TIP, legend: LEGEND,
      grid: { left: 12, right: 16, top: 34, bottom: 8, containLabel: true },
      xAxis: Object.assign({ type: 'category', boundaryGap: cfg.boundaryGap !== false, data: cfg.months }, axisBase(false)),
      yAxis: Object.assign({ type: 'value', name: cfg.unit || '' }, axisBase(true)),
      series: series,
      animationDuration: 1100, animationEasing: 'cubicOut'
    };
  }

  /** 柱状图（区域分布 / 板块分布） */
  function optBar(cfg) {
    var series = cfg.series.map(function (s, i) {
      var color = C.palette[i % C.palette.length];
      return {
        name: s.name, type: 'bar', data: s.data, barWidth: '46%',
        itemStyle: { borderRadius: [4, 4, 0, 0], color: grad(color, 'rgba(0,32,64,.2)') },
        label: { show: cfg.label !== false, position: 'top', color: C.muted, fontSize: 10 }
      };
    });
    return {
      tooltip: TIP, legend: cfg.series.length > 1 ? LEGEND : { show: false },
      grid: { left: 8, right: 16, top: 18, bottom: 6, containLabel: true },
      xAxis: Object.assign({ type: 'category', data: cfg.categories }, axisBase(false)),
      yAxis: Object.assign({ type: 'value' }, axisBase(true)),
      series: series, animationDuration: 1100, animationDelay: function (i) { return i * 60; }
    };
  }

  /** 环形图 */
  function optRing(cfg) {
    var total = cfg.data.reduce(function (a, b) { return a + b.value; }, 0);
    return {
      tooltip: {
        trigger: 'item', backgroundColor: 'rgba(6,22,40,.94)', borderColor: 'rgba(0,212,255,.35)',
        textStyle: { color: C.text, fontSize: 12 },
        formatter: function (p) { return p.name + '<br/>' + fmt(p.value) + '（' + (p.value / total * 100).toFixed(1) + '%）'; }
      },
      legend: { orient: 'vertical', right: 6, top: 'center', itemWidth: 10, itemHeight: 8, textStyle: { color: C.muted, fontSize: 11 } },
      series: [{
        type: 'pie', radius: ['48%', '72%'], center: ['38%', '52%'],
        avoidLabelOverlap: true, itemStyle: { borderColor: 'rgba(4,18,31,.9)', borderWidth: 2 },
        label: { show: false },
        emphasis: { scaleSize: 6, itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,212,255,.45)' } },
        data: cfg.data, animationDuration: 1200
      }],
      color: C.palette
    };
  }

  /** 雷达图 */
  function optRadar(cfg) {
    return {
      tooltip: { backgroundColor: 'rgba(6,22,40,.94)', borderColor: 'rgba(0,212,255,.35)', textStyle: { color: C.text, fontSize: 12 } },
      legend: cfg.series.length > 1 ? Object.assign({ data: cfg.series.map(function (s) { return s.name; }) }, LEGEND) : { show: false },
      radar: {
        center: ['50%', '56%'], radius: '66%',
        indicator: cfg.dims,
        axisName: { color: C.muted, fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(0,212,255,.16)' } },
        splitArea: { areaStyle: { color: ['rgba(0,212,255,.03)', 'rgba(0,212,255,.06)'] } },
        axisLine: { lineStyle: { color: 'rgba(0,212,255,.18)' } }
      },
      series: [{
        type: 'radar', symbolSize: 4,
        data: cfg.series.map(function (s, i) {
          var color = C.palette[i % C.palette.length];
          return {
            name: s.name, value: s.value,
            lineStyle: { width: 2, color: color },
            itemStyle: { color: color },
            areaStyle: { color: rgba(color, .18) }
          };
        }),
        animationDuration: 1200
      }]
    };
  }

  /** 仪表盘 */
  function optGauge(cfg) {
    return {
      series: [{
        type: 'gauge', min: 0, max: cfg.max || 100, startAngle: 210, endAngle: -30,
        radius: '82%', center: ['50%', '58%'],
        progress: { show: true, width: 12, roundCap: true, itemStyle: { color: grad(C.cyan, C.orange) } },
        axisLine: { roundCap: true, lineStyle: { width: 12, color: [[1, 'rgba(0,212,255,.14)']] } },
        pointer: { show: false },
        axisTick: { distance: -18, length: 4, lineStyle: { color: 'rgba(0,212,255,.35)' } },
        splitLine: { distance: -20, length: 8, lineStyle: { color: 'rgba(0,212,255,.5)' } },
        axisLabel: { distance: -6, color: C.muted, fontSize: 10 },
        anchor: { show: false },
        title: { show: true, offsetCenter: [0, '32%'], color: C.muted, fontSize: 12 },
        detail: {
          valueAnimation: true, offsetCenter: [0, '2%'], fontSize: 34, fontWeight: 700, color: '#fff',
          formatter: function (v) { return v.toFixed(1) + '%'; }
        },
        data: [{ value: cfg.value, name: cfg.label || '' }]
      }]
    };
  }

  /* ---------------------------------------------------- 首页视图（城市原页 + 拆开的数据部件） */
  function renderHomeHotspots() {
    var wrap = $('#hotspots');
    wrap.innerHTML = '';
    HOTSPOTS.forEach(function (h) {
      var d = el('div', 'hotspot');
      d.style.top = h.top; d.style.left = h.left;
      d.innerHTML = '<span class="tip">' + h.txt + '</span>';
      wrap.appendChild(d);
    });
  }

  function renderHomeCapsules() {
    var wrap = $('#capsules');
    wrap.innerHTML = '';
    BOXES.forEach(function (b) {
      var d = el('div', 'cap');
      d.style.top = b.top; d.style.left = b.left;
      d.textContent = b.txt;
      wrap.appendChild(d);
    });
  }

  function renderHomeKpis() {
    var wrap = $('#kpiHome');
    wrap.innerHTML = '';
    D.kpis.forEach(function (k, i) {
      var card = el('div', 'kpi-card');
      card.style.animationDelay = (i * 60) + 'ms';
      card.innerHTML =
        '<div class="lbl"><i></i>' + k.label + '</div>' +
        '<div class="val"><span class="num" data-kpi="' + k.label + '">0</span><small>' + k.unit + '</small></div>' +
        '<div class="delta" data-delta="' + k.label + '"></div>';
      wrap.appendChild(card);
      countUp($('.num', card), k.value, k.decimals, 1500);
      $('[data-delta]', card).innerHTML = deltaHtml(k.delta);
    });
  }

  function renderHomeDept() {
    var wrap = $('#deptCluster');
    wrap.innerHTML = '';
    D.deptList.forEach(function (d, i) {
      var n = el('div', 'dept-mini');
      n.style.animationDelay = (i * 55) + 'ms';
      n.innerHTML =
        '<span class="ic">' + (ICONS[d.key] || ICONS.board) + '</span>' +
        '<div><div class="nm">' + d.name + '</div><div class="en">' + d.en + '</div></div>' +
        '<div class="mt">' + d.metric.label + ' <b class="num">' + fmt(d.metric.value, 1) + '</b> ' + d.metric.unit + '</div>';
      n.addEventListener('click', function () { enterDash({ type: 'dept', key: d.key }); });
      wrap.appendChild(n);
    });
  }

  function renderHomeBoard() {
    var wrap = $('#homeBoard');
    wrap.innerHTML = '';
    D.boardList.forEach(function (b, i) {
      var n = el('div', 'entry');
      n.style.animationDelay = (i * 45) + 'ms';
      n.innerHTML =
        '<span class="ic">' + ICONS.board + '</span>' +
        '<div class="nm">' + b.name + '</div>' +
        '<div class="mt"><b class="num">' + fmt(b.revenue) + '</b> 万元</div>' +
        '<span class="arrow">›</span>';
      n.addEventListener('click', function () { enterDash({ type: 'board', key: b.key }); });
      wrap.appendChild(n);
    });
  }

  function renderHomeTrend() {
    var inst = mountHome($('#homeTrend'), function () {
      return optTrend({ months: D.trend.months, series: D.trend.series, unit: '万元', boundaryGap: false });
    });
    // 迷你轮播：自动巡览数据点
    if (inst) {
      var idx = 0, n = D.trend.months.length;
      regHomeTimer(function () {
        if (inst.isDisposed()) return;
        idx = (idx + 1) % n;
        inst.dispatchAction({ type: 'showTip', seriesIndex: 0, dataIndex: idx });
      }, 2600);
    }
  }

  function renderHome() {
    renderHomeHotspots();
    renderHomeCapsules();
    renderHomeKpis();
    renderHomeDept();
    renderHomeBoard();
    renderHomeTrend();
  }

  function clearHome() {
    clearHomeCharts();
    clearHomeTimers();
  }

  /* 视图切换：进入二级大屏（含可选直接下钻到某实体） */
  function enterDash(ent) {
    clearHome();
    $('#homeView').classList.add('hidden');
    $('#dashView').classList.remove('hidden');
    if (ent) {
      state.stack = [{ type: ent.type, key: ent.key }];
      renderDetail();
    } else {
      goOverview();
    }
  }

  /* 视图切换：返回原始城市首页 */
  function backHome() {
    clearCharts();
    clearTimers();
    $('#viewDetail').classList.remove('active');
    $('#dashView').classList.add('hidden');
    $('#homeView').classList.remove('hidden');
    state.stack = [];
    state.view = 'home';
    renderHome();
    startAutoRefresh();
  }

  /* -------------------------------------------------------------- 总览渲染 */
  function renderKpis() {
    var wrap = $('#kpiStrip');
    wrap.innerHTML = '';
    D.kpis.forEach(function (k, i) {
      var card = el('div', 'kpi-card');
      card.style.animationDelay = (i * 70) + 'ms';
      card.innerHTML =
        '<span class="shine"></span>' +
        '<div class="lbl"><i></i>' + k.label + '</div>' +
        '<div class="val"><span class="num" data-kpi="' + k.label + '">0</span><small>' + k.unit + '</small></div>' +
        '<div class="delta" data-delta="' + k.label + '"></div>';
      wrap.appendChild(card);
      var numNode = $('.num', card);
      countUp(numNode, k.value, k.decimals, 1600);
      $('[data-delta]', card).innerHTML = deltaHtml(k.delta);
    });
  }

  function renderDeptMatrix() {
    var wrap = $('#deptMatrix');
    wrap.innerHTML = '';
    D.deptList.forEach(function (d, i) {
      var n = el('div', 'entry');
      n.style.animationDelay = (i * 60) + 'ms';
      n.innerHTML =
        '<span class="ic">' + (ICONS[d.key] || ICONS.board) + '</span>' +
        '<div class="nm">' + d.name + '</div>' +
        '<div class="en">' + d.en + '</div>' +
        '<div class="mt">' + d.metric.label + ' <b class="num">' + fmt(d.metric.value, 1) + '</b> ' + d.metric.unit + '</div>' +
        '<span class="arrow">›</span>';
      n.addEventListener('click', function () { openEntity('dept', d.key, true); });
      wrap.appendChild(n);
    });
  }

  function renderBoardMatrix() {
    var wrap = $('#boardMatrix');
    wrap.innerHTML = '';
    D.boardList.forEach(function (b, i) {
      var n = el('div', 'entry');
      n.style.animationDelay = (i * 50) + 'ms';
      n.innerHTML =
        '<span class="ic">' + ICONS.board + '</span>' +
        '<div class="nm">' + b.name + '</div>' +
        '<div class="mt"><b class="num">' + fmt(b.revenue) + '</b> 万元</div>' +
        '<span class="arrow">›</span>';
      n.addEventListener('click', function () { openEntity('board', b.key, true); });
      wrap.appendChild(n);
    });
  }

  function renderRank() {
    var list = D.boardList.slice().sort(function (a, b) { return b.revenue - a.revenue; });
    var max = list[0].revenue;
    var html = list.map(function (b, i) {
      return '<div class="rank-row" data-key="' + b.key + '">' +
        '<span class="no">' + (i + 1) + '</span>' +
        '<span class="nm">' + b.name + '</span>' +
        '<span class="vv num" data-rv="' + b.key + '">' + fmt(b.revenue) + '</span>' +
        '<span class="bar" style="width:' + (b.revenue / max * 92).toFixed(1) + '%"></span>' +
        '</div>';
    }).join('');
    var inner = $('#rankInner');
    inner.innerHTML = html + html;   // 复制一份实现无缝滚动
    inner.querySelectorAll('.rank-row').forEach(function (row) {
      row.addEventListener('click', function () { openEntity('board', row.dataset.key, true); });
    });
  }

  function renderOverviewCharts() {
    mount($('#chartTrend'), function () { return optTrend({ months: D.trend.months, series: D.trend.series, unit: '万元' }); });
    mount($('#chartOrders'), function () { return optTrend({ months: D.orders.months, series: D.orders.series, unit: '单', boundaryGap: true }); });
    mount($('#chartRadar'), function () { return optRadar(D.overall); });

    // 图表轮播：趋势图自动巡览数据点
    var rec = charts[0];
    var idx = 0;
    regTimer(function () {
      if (!rec || !rec.inst || rec.inst.isDisposed()) return;
      var n = D.trend.months.length;
      idx = (idx + 1) % n;
      rec.inst.dispatchAction({ type: 'showTip', seriesIndex: 0, dataIndex: idx });
    }, 2600);
  }

  function renderOverview() {
    renderKpis();
    renderDeptMatrix();
    renderBoardMatrix();
    renderRank();
    renderOverviewCharts();
  }

  /* -------------------------------------------------------------- 二级页面 */
  var state = { stack: [], view: 'overview' };

  function openEntity(type, key, reset) {
    var ent = D.get(type, key);
    if (!ent) return;
    if (reset) state.stack = [{ type: type, key: key }];
    else state.stack.push({ type: type, key: key });
    renderDetail();
  }

  function goOverview() {
    state.stack = [];
    $('#viewDetail').classList.remove('active');
    clearCharts();
    clearTimers();
    state.view = 'overview';
    renderOverview();
    startAutoRefresh();
  }

  function goBack() {
    if (state.stack.length > 1) { state.stack.pop(); renderDetail(); }
    else goOverview();
  }

  function renderDetail() {
    clearCharts();
    clearTimers();
    var cur = state.stack[state.stack.length - 1];
    var ent = D.get(cur.type, cur.key);
    state.view = 'detail';

    // 面包屑：总览 / ...各级 / 当前
    var crumb = $('#crumb');
    crumb.innerHTML = '';
    var home = el('span', 'item', '总览');
    home.addEventListener('click', goOverview);
    crumb.appendChild(home);
    state.stack.forEach(function (s, i) {
      var e2 = D.get(s.type, s.key);
      crumb.appendChild(el('span', 'sep', '›'));
      var node = el('span', i === state.stack.length - 1 ? 'item cur' : 'item', e2.name);
      if (i < state.stack.length - 1) {
        (function (idx) {
          node.addEventListener('click', function () { state.stack = state.stack.slice(0, idx + 1); renderDetail(); });
        })(i);
      }
      crumb.appendChild(node);
    });

    // 面板标题按实体动态填充
    $('#gaugeTitle').textContent = ent.gauge.title;
    $('#monthlyTitle').textContent = ent.name + ' · 月度趋势';
    $('#barTitle').textContent = ent.bar.title;
    $('#ringTitle').textContent = ent.ring.title;
    $('#radarTitle').textContent = ent.radar.title;
    $('#drillTitle').textContent = ent.drill.title;

    // 标题区
    $('#detailTitle').innerHTML =
      '<h2>' + (ICONS[ent.key] ? '<span class="icon">' + ICONS[ent.key] + '</span>' : '') + ent.name +
      '<span>' + ent.en + '</span></h2><p>' + ent.subtitle + '</p>';

    // 左：小 KPI + 仪表盘
    var miniWrap = $('#detailKpis');
    miniWrap.innerHTML = '';
    ent.kpis.forEach(function (k, i) {
      var n = el('div', 'mini');
      n.style.animationDelay = (i * 60) + 'ms';
      n.innerHTML =
        '<span class="glow"></span>' +
        '<div class="lbl">' + k.label + '</div>' +
        '<div class="val"><span class="num">0</span><small>' + k.unit + '</small></div>' +
        '<div class="delta">' + deltaHtml(k.delta) + '</div>';
      miniWrap.appendChild(n);
      countUp($('.num', n), k.value, k.decimals, 1400);
    });
    mount($('#detailGauge'), function () { return optGauge(ent.gauge); });

    // 中：月度趋势 + 分布柱状
    mount($('#detailMonthly'), function () {
      return optTrend({ months: ent.monthly.months, series: ent.monthly.series, unit: '' });
    });
    mount($('#detailBar'), function () { return optBar(ent.bar); });

    // 右：环形 + 雷达 + 下钻列表
    mount($('#detailRing'), function () { return optRing(ent.ring); });
    mount($('#detailRadar'), function () { return optRadar(ent.radar); });

    var drillWrap = $('#detailDrill');
    drillWrap.innerHTML = '';
    ent.drill.items.forEach(function (it, i) {
      var n = el('div', 'drill-item');
      n.style.animationDelay = (i * 60) + 'ms';
      n.innerHTML =
        '<span class="nm">' + (i + 1) + '. ' + it.name + '</span>' +
        '<span class="vv num">' + fmt(it.value) + '<small>' + (ent.drill.unit || '') + '</small></span>' +
        '<span class="go">›</span>';
      n.addEventListener('click', function () { openEntity(it.type, it.key, false); });
      drillWrap.appendChild(n);
    });

    $('#viewDetail').classList.add('active');
    startAutoRefresh();
  }

  /* ------------------------------------------------------- 定时刷新与时钟 */
  var refreshTimer = null, secondTimer = null, lastSync = Date.now();

  function startAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(function () {
      if (document.hidden) return;
      doRefresh();
    }, D.meta.refreshInterval);
  }

  function doRefresh() {
    D.simulate();
    lastSync = Date.now();
    // KPI 数字滚动
    D.kpis.forEach(function (k) {
      var node = document.querySelector('.kpi-card [data-kpi="' + k.label + '"]');
      if (node) countUp(node, k.value, k.decimals, 900);
      var dNode = document.querySelector('.kpi-card [data-delta="' + k.label + '"]');
      if (dNode) dNode.innerHTML = deltaHtml(k.delta);
    });
    // 排行榜数值原地更新（不重排，动画不中断）
    D.boardList.forEach(function (b) {
      document.querySelectorAll('[data-rv="' + b.key + '"]').forEach(function (n) {
        countUp(n, b.revenue, 0, 900);
      });
    });
    // 图表刷新（保持动画过渡）
    charts.forEach(function (c) {
      if (c.inst && !c.inst.isDisposed()) c.inst.setOption(c.build());
    });
  }

  function tickClock() {
    var now = new Date();
    var p = function (n) { return n < 10 ? '0' + n : '' + n; };
    var wd = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
    $('#clockTime').textContent = p(now.getHours()) + ':' + p(now.getMinutes()) + ':' + p(now.getSeconds());
    $('#clockDate').textContent = now.getFullYear() + '-' + p(now.getMonth() + 1) + '-' + p(now.getDate()) + ' 星期' + wd;
    var s = Math.floor((Date.now() - lastSync) / 1000);
    $('#lastSync').textContent = s < 5 ? '刚刚同步' : s + ' 秒前同步';
  }

  /* -------------------------------------------------------------- 等比适配 */
  function fit() {
    var stage = $('#stage');
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
  }

  /* ------------------------------------------------------------------ 启动 */
  function init() {
    $('#pageTitle').textContent = D.meta.title;
    $('#pageSub').textContent = D.meta.subtitle;

    fit();
    window.addEventListener('resize', fit);

    // 默认展示原始城市首页（含拆开浮动的数据部件），点击链接才弹出二级大屏
    renderHome();
    startAutoRefresh();

    secondTimer = setInterval(tickClock, 1000);
    tickClock();

    $('#btnBack').addEventListener('click', goBack);
    $('#btnEnterDash').addEventListener('click', function () { enterDash(null); });
    $('#btnHome').addEventListener('click', backHome);
    $('#btnHome2').addEventListener('click', backHome);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && state.view === 'detail') goBack();
      else if (e.key === 'Escape' && state.view !== 'home') backHome();
      if (e.key === 'Backspace' && state.view === 'detail') { e.preventDefault(); goBack(); }
    });

    // 标签页不可见时暂停所有动画，避免长时间运行累积开销
    document.addEventListener('visibilitychange', function () {
      document.body.classList.toggle('idle', document.hidden);
    });

    // 视频自动播放兜底
    var v = document.querySelector('.bg-layer video');
    if (v) { v.play().catch(function () { document.addEventListener('click', function () { v.play().catch(function () {}); }, { once: true }); }); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
