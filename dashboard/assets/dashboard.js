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
    board: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 1 3.6 10.8c-.5.4-.8.9-.9 1.5l-.2 1.2H9.5l-.2-1.2c-.1-.6-.4-1.1-.9-1.5A6 6 0 0 1 12 3z"/></svg>',

    /* 维度三：子公司图标（未单独定义者回落到通用「工厂」图标） */
    sub: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 21V9l6-4v5l6-4v5l6-4v14z"/><path d="M7 21v-5M13 21v-5M19 21v-5"/></svg>',
    guoxing: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 10h4v4h-4zM4 10h3M4 14h3M17 10h3M17 14h3M10 4v3M14 4v3M10 17v3M14 17v3"/></svg>',
    liaowang: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 13l3-6h12l3 6"/><path d="M6 13a6 6 0 0 1 12 0"/><path d="M6 13h12v3a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/><circle cx="8.5" cy="15" r=".9"/><circle cx="15.5" cy="15" r=".9"/></svg>',
    hule: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 17l2-6h14l2 6"/><path d="M5 17h14l-2 3H7z"/><path d="M12 11V4M12 4l4 3"/></svg>',
    hangxin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 12l20-7-6 13-3-4z"/><path d="M13 14l-2 6 2-2 2 2z"/></svg>',
    hainan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M2 19c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M12 3v6M9 6l3-3 3 3"/></svg>',
    zhicheng: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 21V8l5-4 5 4v13"/><path d="M13 21V11l4-3 4 3v10"/><path d="M7 21v-4M11 21v-4M17 21v-4"/></svg>'
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
    mapRec = null;
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

  /* ---------------------------------------- 全国制造基地分布地图（维度三配套） */
  /** ECharts 5 不再内置地图数据：china.json 异步加载注册，就绪前不渲染地图，避免报错 */
  var chinaReady = false;
  var mapRec = null;     // 地图实例句柄：供基地清单悬停时定位 / 弹 tooltip 使用

  /* 各基地地图标注方位：避免长三角 / 珠三角密集点位标签互相重叠 */
  var PLANT_LP = {
    '苏州基地': 'top', '青岛基地': 'top', '河南新乡基地': 'top', '佛山总部': 'top',
    '浙江嘉兴基地': 'bottom', '佛山高明基地': 'bottom', '茂名华光基地': 'bottom',
    '重庆基地': 'left', '海南海洋照明基地': 'left',
    '柳州基地': 'right', '南宁基地': 'right'
  };

  /**
   * 基地悬停卡片：生产 / 销售核心数据 + 下钻提示。
   * 地图散点 tooltip 与基地清单悬停浮层共用同一份渲染，保证口径一致。
   */
  function plantTipHTML(p) {
    var s = p.stat;
    if (!s) {
      return '<div style="min-width:170px">' +
             '<div class="pt-nm">' + p.name + '</div>' +
             '<div class="pt-sub">' + p.city + ' · ' + p.type + '</div>' +
             '<div class="pt-cap">' + p.cap + '</div></div>';
    }
    function row(k, v, hl) {
      return '<div class="pt-row"><span>' + k + '</span><b' + (hl ? ' class="hl"' : '') + '>' + v + '</b></div>';
    }
    var utilCls = s.util >= 85 ? ' class="hl"' : (s.util < 70 ? ' class="low"' : '');
    return '<div class="pt">' +
           '<div class="pt-nm">' + p.name + '</div>' +
           '<div class="pt-sub">' + p.city + ' · ' + p.type + '</div>' +
           '<div class="pt-cap">' + p.cap + '</div>' +
           '<div class="pt-grid">' +
             '<div class="pt-row"><span>年产能</span><b>' + fmt(s.capacity) + ' ' + s.capUnit + '</b></div>' +
             '<div class="pt-row"><span>本年产量</span><b>' + fmt(s.output) + ' ' + s.outUnit + '</b></div>' +
             '<div class="pt-row"><span>本年销量</span><b>' + fmt(s.sales) + ' ' + s.outUnit + '</b></div>' +
             '<div class="pt-row"><span>产销率</span><b>' + Math.round(s.sales / s.output * 100) + '%</b></div>' +
             '<div class="pt-row"><span>产能利用率</span><b' + utilCls + '>' + s.util + '%</b></div>' +
             '<div class="pt-row"><span>年产值</span><b>' + fmt(s.value) + ' 万元</b></div>' +
           '</div>' +
           '<div class="pt-more">点击查看详情 ›</div>' +
           '</div>';
  }

  function optMap() {
    var lw = D.plants.liaowang.filter(function (p) { return !p.overseas; });
    var hq = lw[0];                                   // 南宁总部，作为辐射源
    var lines = lw.slice(1).map(function (p) {
      return { coords: [hq.coord, p.coord], toName: p.name };
    });
    return {
      tooltip: {
        trigger: 'item', backgroundColor: 'rgba(6,22,40,.94)', borderColor: 'rgba(0,212,255,.35)',
        borderWidth: 1, padding: [8, 12], textStyle: { color: C.text, fontSize: 12 },
        formatter: function (p) {
          if (p.seriesType === 'lines') return '总部辐射线路<br/>' + hq.name + ' → ' + p.data.toName;
          return p.data && p.data.plant ? plantTipHTML(p.data) : p.name;
        }
      },
      legend: {
        bottom: 0, left: 4, itemWidth: 10, itemHeight: 6, itemGap: 12,
        textStyle: { color: C.muted, fontSize: 10 }
      },
      geo: {
        /* 华东（苏州 / 嘉兴）等密集点位在小画幅下必然重叠，开放滚轮缩放与拖拽平移以便分辨 */
        map: 'china', roam: true, zoom: 1.16, center: [104.5, 33.5],
        itemStyle: { areaColor: 'rgba(12,44,78,.6)', borderColor: 'rgba(0,212,255,.4)', borderWidth: .8 },
        emphasis: { itemStyle: { areaColor: 'rgba(0,120,180,.5)' }, label: { show: false } },
        label: { show: false }
      },
      series: [
        {
          /* 辐射连线为装饰元素：设为 silent，避免抢走基地散点的 hover / click 事件 */
          name: '总部辐射', type: 'lines', coordinateSystem: 'geo', zlevel: 1, silent: true,
          effect: { show: true, period: 5, trailLength: .3, symbol: 'circle', symbolSize: 4, color: C.orange },
          lineStyle: { color: C.orange, width: 1, opacity: .45, curveness: .22 },
          data: lines
        },
        {
          name: '燎旺车灯制造基地', type: 'effectScatter', coordinateSystem: 'geo', zlevel: 2, cursor: 'pointer',
          rippleEffect: { brushType: 'stroke', scale: 3.2, period: 3.4 },
          symbolSize: 9,
          emphasis: { scale: 1.6, label: { fontSize: 12, fontWeight: 700 } },
          itemStyle: { color: C.orange, shadowBlur: 12, shadowColor: C.orange },
          label: { show: true, position: 'right', formatter: '{b}', color: '#ffd9b0', fontSize: 10.5,
                   fontWeight: 600, textShadowColor: '#000', textShadowBlur: 4 },
          data: lw.map(function (p) {
            return { name: p.name, value: p.coord, city: p.city, type: p.type, cap: p.cap,
                     stat: p.stat, plant: p.name,
                     label: { position: PLANT_LP[p.name] || 'right' } };
          })
        },
        {
          name: '佛照照明制造基地', type: 'scatter', coordinateSystem: 'geo', zlevel: 2, cursor: 'pointer',
          symbolSize: 7,
          emphasis: { scale: 1.8, label: { fontSize: 11.5, fontWeight: 700 } },
          itemStyle: { color: C.cyan, shadowBlur: 10, shadowColor: C.cyan },
          label: { show: true, position: 'left', formatter: '{b}', color: '#bfe9ff', fontSize: 10,
                   textShadowColor: '#000', textShadowBlur: 4 },
          data: D.plants.fsl.map(function (p) {
            return { name: p.name, value: p.coord, city: p.city, type: p.type, cap: p.cap,
                     stat: p.stat, plant: p.name,
                     label: { position: PLANT_LP[p.name] || 'left' } };
          })
        }
      ]
    };
  }

  /** 基地清单（地图下方两列紧凑排布）：燎旺车灯全国工厂（橙点）+ 佛照主要基地（青点） */
  function renderPlantList() {
    var wrap = $('#plantList');
    if (!wrap) return;
    wrap.innerHTML = '';
    /* 系列索引：0 总部辐射连线 / 1 燎旺车灯基地 / 2 佛照照明基地。
       地图 series 1 只绘制境内基地（海外基地不在国内 GeoJSON 范围内），故索引按下标对齐。 */
    var list = D.plants.liaowang.map(function (p, i) { return { p: p, si: 1, di: i, lw: true }; })
      .concat(D.plants.fsl.map(function (p, i) { return { p: p, si: 2, di: i, lw: false }; }));
    list.forEach(function (o) {
        var p = o.p;
        var n = el('div', 'plant-item' + (o.lw ? ' lw' : ''));
        n.innerHTML = '<span class="dot"></span><span class="nm">' + p.name + '</span>' +
                      '<span class="vv num">' + p.stat.util + '%</span>';
        /* 悬停：① 左侧浮层展示生产/销售数据（覆盖地图外的海外基地）② 地图上同步高亮 */
        n.addEventListener('mouseenter', function () { showPlantTip(p, o.si, o.di); });
        n.addEventListener('mouseleave', function () { hidePlantTip(o.si, o.di); });
        n.addEventListener('click', function () { openPlant(p.name); });
        wrap.appendChild(n);
      });
  }

  /**
   * 基地清单悬停浮层：
   * 华东点位密集（苏州/嘉兴相距约 3px）且泰国基地不在国内地图范围内，
   * 仅靠地图上悬停无法稳定命中，故清单悬停独立弹出生鲜数据卡片。
   */
  function showPlantTip(p, si, di) {
    var box = $('#plantTip');
    if (!box) return;
    var extra = p.overseas
      ? '<div class="pt-note">海外基地 · 不在国内地图坐标范围内</div>'
      : '';
    box.innerHTML = plantTipHTML(p) + extra;
    box.classList.add('on');
    if (!p.overseas && mapRec && !mapRec.inst.isDisposed()) {
      try {
        mapRec.inst.dispatchAction({ type: 'highlight', seriesIndex: si, dataIndex: di });
      } catch (e) {}
    } else if (mapRec && !mapRec.inst.isDisposed()) {
      mapRec.inst.dispatchAction({ type: 'hideTip' });
    }
  }

  function hidePlantTip(si, di) {
    var box = $('#plantTip');
    if (box) { box.classList.remove('on'); box.innerHTML = ''; }
    if (mapRec && !mapRec.inst.isDisposed()) {
      try {
        mapRec.inst.dispatchAction({ type: 'downplay', seriesIndex: si, dataIndex: di });
        mapRec.inst.dispatchAction({ type: 'hideTip' });
      } catch (e) {}
    }
  }

  /** 基地下钻入口：① 地图散点点击 ② 地图右侧基地清单点击 */
  function openPlant(name) {
    if (D.plantIndex[name]) openEntity('plant', name, true);
  }

  function renderMap() {
    if (!chinaReady) return;
    renderPlantList();
    mapRec = mount($('#chartMap'), optMap);
    if (mapRec) {
      mapRec.inst.on('click', function (p) {
        if (p.data && p.data.plant) openPlant(p.data.plant);
      });
    }
  }

  /** 首页横条：8 家所属企业（不遮挡 3D 城市主体） */
  /** 大屏第四栏：子公司一级入口矩阵（维度三） */
  function renderSubMatrix() {
    var wrap = $('#subMatrix');
    if (!wrap) return;
    wrap.innerHTML = '';
    D.subList.forEach(function (s, i) {
      var n = el('div', 'entry');
      n.style.animationDelay = (i * 55) + 'ms';
      n.title = s.share + '｜' + s.bizScope;
      n.innerHTML =
        '<span class="tag">' + s.tag + '</span>' +
        '<div class="row"><span class="ic">' + (ICONS[s.key] || ICONS.sub) + '</span>' +
        '<span class="nm">' + s.name + '</span></div>' +
        '<div class="loc">' + s.city + '</div>' +
        '<div class="mt"><b class="num">' + fmt(s.revenue) + '</b> 万元</div>' +
        '<span class="arrow">›</span>';
      n.addEventListener('click', function () { openEntity('sub', s.key, true); });
      wrap.appendChild(n);
    });
  }

  /* ---------------------------------------------------- 首页视图（导航栏 + 纯净城市页，悬停弹出 / 点击下钻） */
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

  /** 胶囊文字 → 业务板块实体（名称精确匹配优先，双向包含兜底） */
  function boardByTxt(txt) {
    var list = D.boardList;
    return list.filter(function (b) { return b.name === txt; })[0] ||
           list.filter(function (b) { return b.name.indexOf(txt) > -1 || txt.indexOf(b.name) > -1; })[0] || null;
  }

  /** 首页悬停信息卡：定位到目标对象旁（防溢出），内容与详情页口径一致 */
  function showHomeTip(anchor, html) {
    var box = $('#homeTip');
    if (!box) return;
    box.innerHTML = html;
    box.classList.add('on');
    /* 胶囊为 translate(-50%,-50%) 中心定位：offsetLeft/Top 即视觉中心点 */
    var cx = anchor.offsetLeft, cy = anchor.offsetTop;
    var halfW = anchor.offsetWidth / 2, halfH = anchor.offsetHeight / 2;
    var w = box.offsetWidth || 240, h = box.offsetHeight || 160;
    var vw = anchor.offsetParent ? anchor.offsetParent.offsetWidth : 1920;
    var vh = anchor.offsetParent ? anchor.offsetParent.offsetHeight : 1080;
    var x = cx + halfW + 14;                  /* 默认放右侧 */
    if (x + w > vw - 12) x = cx - halfW - w - 14;   /* 放不下翻左侧 */
    if (x < 12) x = 12;
    var y = cy - h / 2;
    if (y + h > vh - 12) y = vh - h - 12;
    if (y < 92) y = 92;                       /* 避开顶部导航栏 */
    box.style.left = x + 'px';
    box.style.top = y + 'px';
  }

  function hideHomeTip() {
    var box = $('#homeTip');
    if (box) { box.classList.remove('on'); box.innerHTML = ''; }
  }

  /** 业务板块悬停卡：名称 / 定位 / 年度营收 / 同比 / 毛利率 / 在手订单 */
  function boardTipHTML(b) {
    var k = {};
    (b.kpis || []).forEach(function (x) { k[x.label] = x; });
    function row(label, unit, dec, noDelta) {
      var v = k[label];
      if (!v) return '';
      var d = noDelta ? '' : deltaHtml(v.delta);
      return '<div class="ht-row"><span>' + label + '</span>' +
             '<b>' + fmt(v.value, dec) + '<i>' + unit + '</i>' + d + '</b></div>';
    }
    return '<div class="ht">' +
           '<div class="ht-nm">' + b.name + '</div>' +
           (b.subtitle ? '<div class="ht-sub">' + b.subtitle + '</div>' : '') +
           '<div class="ht-grid">' +
             row('年度营收', ' 万元', 0) +
             row('同比增长', '%', 1, true) +
             row('毛利率', '%', 1) +
             row('在手订单', ' 万元', 0) +
           '</div>' +
           '<div class="ht-more">点击查看板块详情 ›</div>' +
           '</div>';
  }

  function renderHomeCapsules() {
    var wrap = $('#capsules');
    wrap.innerHTML = '';
    BOXES.forEach(function (b) {
      var d = el('div', 'cap');
      d.style.top = b.top; d.style.left = b.left;
      d.textContent = b.txt;
      var board = boardByTxt(b.txt);
      if (board) {
        d.classList.add('link');
        d.title = board.name + ' · 点击查看详情';
        d.addEventListener('mouseenter', function () { showHomeTip(d, boardTipHTML(board)); });
        d.addEventListener('mouseleave', hideHomeTip);
        d.addEventListener('click', function () { hideHomeTip(); enterDash({ type: 'board', key: board.key }); });
      }
      wrap.appendChild(d);
    });
  }

  /* 首页默认纯净：核心指标 / 部门卡 / 板块卡 / 子公司条 / 趋势图均已移除，
     数据展示统一收敛到「悬停弹出信息卡 + 点击下钻明细页」两个动作上。 */
  function renderHome() {
    renderHomeHotspots();
    renderHomeCapsules();
    renderHomeSubs();
  }

  /* ---------------------------------------------------------------- 首页子公司入口 */
  /* 两个重点子公司（国星光电 / 燎旺车灯）作为城市场景中的固定入口，悬停概览、点击下钻 */
  var SUB_CAPS = [
    { key: 'guoxing', name: '国星光电', top: '33%', left: '75%' },
    { key: 'liaowang', name: '南宁燎旺车灯', top: '71%', left: '72%' }
  ];

  /** 子公司悬停概览卡：股权 / 主营 / 年度营收 / 同比 / 毛利率 / 产能或规模 */
  function subTipHTML(s) {
    var k = {};
    (s.kpis || []).forEach(function (x) { k[x.label] = x; });
    function row(label, unit, dec, noDelta) {
      var v = k[label];
      if (!v) return '';
      var d = noDelta ? '' : deltaHtml(v.delta);
      return '<div class="ht-row"><span>' + label + '</span>' +
             '<b>' + fmt(v.value, dec) + '<i>' + unit + '</i>' + d + '</b></div>';
    }
    return '<div class="ht">' +
           '<div class="ht-nm">' + s.name + '</div>' +
           (s.subtitle ? '<div class="ht-sub">' + s.subtitle + '</div>' : '') +
           '<div class="ht-grid">' +
             row('年度营收', ' 万元', 0) +
             row('毛利率', '%', 1) +
           '</div>' +
           '<div class="ht-meta">' + (s.share || '') + ' · ' + (s.city || '') + '</div>' +
           '<div class="ht-more">点击查看经营评估 ›</div>' +
           '</div>';
  }

  function renderHomeSubs() {
    var wrap = $('#subCaps');
    if (!wrap) return;
    wrap.innerHTML = '';
    SUB_CAPS.forEach(function (c) {
      var sub = D.get('sub', c.key);
      if (!sub) return;
      var d = el('div', 'sub-cap');
      d.style.top = c.top; d.style.left = c.left;
      d.innerHTML = '<span class="dot"></span><span class="nm">' + c.name + '</span>';
      d.title = c.name + ' · 点击查看经营评估';
      d.addEventListener('mouseenter', function () { showHomeTip(d, subTipHTML(sub)); });
      d.addEventListener('mouseleave', hideHomeTip);
      d.addEventListener('click', function () { hideHomeTip(); enterDash({ type: 'sub', key: c.key }); });
      wrap.appendChild(d);
    });
  }

  function clearHome() {
    clearHomeCharts();
    clearHomeTimers();
  }

  /* 视图切换：进入二级大屏（含可选直接下钻到某实体） */
  /* 首页模式：隐藏大屏专用遮罩/网格/扫描线，还原官网原始画面 */
  function setHomeMode(on) {
    document.body.classList.toggle('home-mode', !!on);
  }

  function enterDash(ent) {
    clearHome();
    setHomeMode(false);
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
    setHomeMode(true);
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
    // 注意：轮播必须显式绑定趋势图实例；若沿用 charts[0]，地图先挂载会轮播出辐射连线的 tooltip
    var trendRec = mount($('#chartTrend'), function () { return optTrend({ months: D.trend.months, series: D.trend.series, unit: '万元' }); });
    mount($('#chartOrders'), function () { return optTrend({ months: D.orders.months, series: D.orders.series, unit: '单', boundaryGap: true }); });
    mount($('#chartRadar'), function () { return optRadar(D.overall); });

    // 图表轮播：趋势图自动巡览数据点
    var rec = trendRec;
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
    renderSubMatrix();
    renderRank();
    renderMap();
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

    // 标题区（品牌 logo 区替代原先无信息量的装饰 SVG 图标）
    $('#detailTitle').innerHTML =
      '<h2>' + ent.name + '<span>' + ent.en + '</span></h2><p>' + ent.subtitle + '</p>';
    renderDetailLogos(ent);
    renderPlanBand(ent);   /* 先渲染经营评估带（在网格之前），保证后续图表按最终高度初始化 */

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

  /* ------------------------------------------------- 详情页品牌 logo 与经营评估 */

  /* 有独立品牌 logo 的子公司（其余实体仅展示佛照品牌） */
  var LOGOS = { liaowang: { src: 'assets/logo_lw.png', alt: '燎旺车灯' } };

  /** FSL 品牌标识（与官网深蓝 VI 一致的内联 SVG，避免外链位图） */
  var FSL_MARK =
    '<svg viewBox="0 0 46 22" aria-label="FSL"><rect width="46" height="22" rx="4" fill="#0b57a4"/>' +
    '<text x="23" y="15.8" text-anchor="middle" font-family="Arial, sans-serif" font-size="11.5" font-weight="700" letter-spacing="1" fill="#fff">FSL</text></svg>';

  function renderDetailLogos(ent) {
    var box = $('#detailLogos');
    if (!box) return;
    var html = '<span class="lg-chip" title="佛山照明 FOSHAN LIGHTING">' + FSL_MARK +
               '<span class="lg-txt">佛山照明</span></span>';
    var lg = LOGOS[ent.key];
    if (lg) {
      html += '<span class="lg-x">×</span>' +
              '<span class="lg-chip"><img src="' + lg.src + '" alt="' + lg.alt + ' logo"></span>';
    }
    box.innerHTML = html;
  }

  /* ---- 经营评估：销售预算（收入/成本/费用）+ 销量（年初预测/实际/未来预测）---- */

  /** 预算对照表：年初预算 / 已实现(YTD) / 全年预计 / 预算差异 */
  function planTableHTML(p) {
    var f = p.sum.fy, y = p.sum.ytd;
    function tr(name, b, ytd, fy, badWhenUp, dec) {
      var diff = Math.round((fy - b) * (dec ? 10 : 1)) / (dec ? 10 : 1);
      var bad = badWhenUp ? diff > 0 : diff < 0;
      var cls = diff === 0 ? '' : (bad ? 'neg' : 'pos');
      return '<tr><td class="pn">' + name + '</td><td>' + fmt(b, dec) + '</td><td>' + fmt(ytd, dec) +
             '</td><td class="hl">' + fmt(fy, dec) + '</td><td class="' + cls + '">' +
             (diff > 0 ? '+' : '') + fmt(diff, dec) + '</td></tr>';
    }
    return '<table class="plan-tbl">' +
           '<thead><tr><th>项目（' + p.unit + '）</th><th>年初预算</th><th>已实现 YTD</th><th>全年预计</th><th>预算差异</th></tr></thead><tbody>' +
             tr('销售收入', f.revB, y.revA, f.revF, false) +
             tr('销售成本', f.costB, sum(p.cost.actual), sum(p.cost.actual) + sum(p.cost.forecast), true) +
             tr('销售费用', f.expB, sum(p.expense.actual), sum(p.expense.actual) + sum(p.expense.forecast), true) +
             tr('经营利润', f.proB, y.proA, f.proF, false) +
             tr('销量（' + p.qtyUnit + '）', f.qtyB, y.qtyA, f.qtyF, false, 1) +
           '</tbody></table>' +
           '<div class="tbl-note">YTD 为近 ' + p.split + ' 个月实际口径；全年预计 = 已实现 + 滚动预测（模拟数据 [E]）</div>';
  }

  function sum(a) { var t = 0; for (var i = 0; i < a.length; i++) t += (a[i] || 0); return t; }

  /** 预警列表：级别（ok/warn/bad）+ 标签 + 结论 */
  function planAlertsHTML(p) {
    var lvName = { ok: '正常', warn: '关注', bad: '预警' };
    var items = p.alerts.map(function (a, i) {
      return '<div class="al-item lv-' + a.level + '" style="animation-delay:' + (i * 60) + 'ms">' +
             '<span class="al-dot"></span><span class="al-tag">' + lvName[a.level] + ' · ' + a.tag + '</span>' +
             '<span class="al-txt">' + a.text + '</span></div>';
    }).join('');
    return '<div class="al-head">结论：' + profitVerdict(p) + '</div>' + items;
  }

  /** 一句话裁决：未来是否亏损 / 大幅盈利 / 利润承压 */
  function profitVerdict(p) {
    var f = p.sum.fy, r = p.rates;
    if (f.proF < 0) return '预测期预计整体亏损，需立即启动扭亏措施';
    if (f.proRate >= 115) return '预计大幅超预算盈利（达成 ' + f.proRate + '%）';
    if (f.proRate < 90) return '不会亏损，但利润显著承压（达成 ' + f.proRate + '%），成本率为首要变量';
    return '盈利稳健（达成 ' + f.proRate + '%），成本安全垫 ' + r.pad + 'pp';
  }

  /** 图：销售预算执行 —— 预算（虚线）/ 实际（柱）/ 预测（柱） */
  function optPlanAmt(p) {
    var split = p.split;
    return {
      tooltip: TIP,
      legend: { top: 0, right: 4, itemWidth: 10, itemHeight: 8, itemGap: 8, textStyle: { color: C.muted, fontSize: 10 } },
      grid: { left: 6, right: 8, top: 24, bottom: 0, containLabel: true },
      xAxis: Object.assign({ type: 'category', boundaryGap: true, data: p.months }, axisBase(false)),
      yAxis: Object.assign({ type: 'value' }, axisBase(true)),
      series: [
        { name: '预算收入', type: 'line', symbol: 'none', z: 3, data: p.revenue.budget,
          lineStyle: { type: 'dashed', width: 1.4, color: 'rgba(127,157,184,.85)' },
          itemStyle: { color: 'rgba(127,157,184,.9)' } },
        { name: '实际收入', type: 'bar', stack: 'a', barWidth: '52%', z: 2, data: p.revenue.actual,
          itemStyle: { borderRadius: [2, 2, 0, 0], color: grad('#00d4ff', 'rgba(0,110,180,.25)') } },
        { name: '预测收入', type: 'bar', stack: 'a', barWidth: '52%', z: 2, data: p.revenue.forecast,
          itemStyle: { borderRadius: [2, 2, 0, 0], color: grad('rgba(255,117,0,.9)', 'rgba(255,117,0,.2)') },
          markArea: split > 0 ? {
            silent: true, itemStyle: { color: 'rgba(255,117,0,.06)' },
            label: { show: true, position: 'insideTop', color: 'rgba(255,150,60,.75)', fontSize: 9 },
            data: [[{ name: '预测区间', xAxis: p.months[split] }, { xAxis: p.months[p.months.length - 1] }]]
          } : undefined }
      ],
      animationDuration: 1100
    };
  }

  /** 图：销量 —— 年初销售预测 / 实际完成 / 未来预测 */
  function optPlanQty(p) {
    return {
      tooltip: TIP,
      legend: { top: 0, right: 4, itemWidth: 10, itemHeight: 8, itemGap: 8, textStyle: { color: C.muted, fontSize: 10 } },
      grid: { left: 6, right: 8, top: 24, bottom: 0, containLabel: true },
      xAxis: Object.assign({ type: 'category', boundaryGap: true, data: p.months }, axisBase(false)),
      yAxis: Object.assign({ type: 'value' }, axisBase(true)),
      series: [
        { name: '年初销售预测', type: 'line', symbol: 'none', z: 3, data: p.qty.budget,
          lineStyle: { type: 'dashed', width: 1.4, color: 'rgba(127,157,184,.85)' },
          itemStyle: { color: 'rgba(127,157,184,.9)' } },
        { name: '实际完成', type: 'bar', stack: 'a', barWidth: '52%', z: 2, data: p.qty.actual,
          itemStyle: { borderRadius: [2, 2, 0, 0], color: grad('#3f8cff', 'rgba(20,70,150,.25)') } },
        { name: '未来预测', type: 'bar', stack: 'a', barWidth: '52%', z: 2, data: p.qty.forecast,
          itemStyle: { borderRadius: [2, 2, 0, 0], color: grad('rgba(255,117,0,.9)', 'rgba(255,117,0,.2)') } }
      ],
      animationDuration: 1100
    };
  }

  /** 渲染经营评估带（实体无预算配置时整块隐藏） */
  function renderPlanBand(ent) {
    var band = $('#planBand');
    if (!band) return;
    var p = D.planOf(ent.key);
    if (!p) { band.classList.add('off'); return; }
    band.classList.remove('off');
    $('#planTableWrap').innerHTML = planTableHTML(p);
    $('#planAlerts').innerHTML = planAlertsHTML(p);
    mount($('#planChartAmt'), function () { return optPlanAmt(p); });
    mount($('#planChartQty'), function () { return optPlanQty(p); });
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
    var t = p(now.getHours()) + ':' + p(now.getMinutes()) + ':' + p(now.getSeconds());
    var d = now.getFullYear() + '-' + p(now.getMonth() + 1) + '-' + p(now.getDate()) + ' 星期' + wd;
    var s = Math.floor((Date.now() - lastSync) / 1000);
    var sync = s < 5 ? '刚刚同步' : s + ' 秒前同步';
    /* 大屏视图与首页导航栏各一套时钟，同源更新 */
    var ct = $('#clockTime'), cd = $('#clockDate'), ls = $('#lastSync');
    var ht = $('#homeClockTime'), hd = $('#homeClockDate'), hl = $('#homeLastSync');
    if (ct) ct.textContent = t;
    if (cd) cd.textContent = d;
    if (ls) ls.textContent = sync;
    if (ht) ht.textContent = t;
    if (hd) hd.textContent = d;
    if (hl) hl.textContent = sync;
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

    fit();
    window.addEventListener('resize', fit);

    // 中国地图 GeoJSON：ECharts 5 已移除内置地图数据，需异步注册；
    // 就绪后若当前正停在总览视图，则补渲染地图（避免进入大屏时地图空白）
    fetch('assets/china.json').then(function (r) { return r.json(); }).then(function (g) {
      echarts.registerMap('china', g);
      chinaReady = true;
      if (!$('#dashView').classList.contains('hidden') && state.view === 'overview') renderMap();
    }).catch(function (e) { console.warn('[FSL] 地图数据加载失败：', e); });

    // 默认展示纯净城市首页（导航栏 + 热点 + 胶囊），悬停弹出信息卡，点击进入二级大屏
    setHomeMode(true);
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
