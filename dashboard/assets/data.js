/* ==========================================================================
 * 佛山照明（FSL）经营数据可视化大屏 · 模拟数据层
 * --------------------------------------------------------------------------
 * 设计原则：
 *   1. 与渲染层完全解耦，只暴露 window.FSL_DATA 一个对象；
 *   2. 所有字段命名统一英文小驼峰，单位通过 unit 字段显式声明；
 *   3. 后续接真实接口时，只需保证返回结构一致即可（或直接覆盖 window.FSL_DATA）；
 *   4. 数据为模拟数据 [E]，用于大屏演示与视觉验证，不代表真实经营结果。
 *
 * 通用数据契约（渲染层按契约渲染，新增维度无需改渲染代码）：
 *   kpis  : [{ label, value, unit, delta, decimals }]   delta 为同比/环比百分点或百分比
 *   monthly: { months: [], series: [{ name, data, type:'line'|'bar', unit }] }
 *   bar   : { title, categories: [], series: [{ name, data, unit }] }
 *   ring  : { title, data: [{ name, value }] }
 *   radar : { title, dims: [{ name, max }], series: [{ name, value: [], color }] }
 *   gauge : { title, value, label, max }
 *   drill : { title, unit, items: [{ type:'dept'|'board', key, name, value }] }
 * ========================================================================== */
(function (global) {
  'use strict';

  var MONTHS = ['25-10', '25-11', '25-12', '26-01', '26-02', '26-03',
                '26-04', '26-05', '26-06', '26-07', '26-08', '26-09'];

  /* ---------------------------------------------------------------- 全局 */
  var DATA = {
    meta: {
      title: '佛山照明 · 经营数据可视化大屏',
      subtitle: 'FSL BUSINESS DATA VISUALIZATION CENTER',
      refreshInterval: 30000,      // 数据定时刷新间隔（毫秒）
      dataDate: '2026-09-04',      // 数据截止日期
      version: 'v1.0'
    },

    /* 中部核心指标区：贴合照明制造业务的 7 项核心指标 */
    kpis: [
      { label: '年度累计营收', value: 417380, unit: '万元', delta: 6.8, decimals: 0 },
      { label: '年度累计订单', value: 128456, unit: '单',   delta: 9.2, decimals: 0 },
      { label: '产能达成率',   value: 91.5,   unit: '%',    delta: 1.6, decimals: 1 },
      { label: '库存周转率',   value: 6.8,    unit: '次/年', delta: 0.5, decimals: 1 },
      { label: '研发项目进度', value: 78.3,   unit: '%',    delta: 4.1, decimals: 1 },
      { label: '采购交付率',   value: 96.8,   unit: '%',    delta: 0.9, decimals: 1 },
      { label: '综合毛利率',   value: 24.6,   unit: '%',    delta: -0.4, decimals: 1 }
    ],

    /* 整体趋势图表区：月度营收、利润 */
    trend: {
      months: MONTHS,
      series: [
        { name: '营业收入', type: 'line', unit: '万元',
          data: [31200, 34600, 29800, 32400, 36700, 39200, 35400, 38900, 41200, 37600, 42800, 44780] },
        { name: '净利润',   type: 'line', unit: '万元',
          data: [4120, 4680, 3860, 4310, 4920, 5240, 4680, 5160, 5510, 4980, 5760, 6080] }
      ]
    },

    /* 整体趋势图表区：月度订单量与出货量 */
    orders: {
      months: MONTHS,
      series: [
        { name: '订单量', type: 'bar',  unit: '单',
          data: [9800, 10600, 9200, 10200, 11400, 12100, 10900, 11800, 12600, 11500, 13100, 13756] },
        { name: '出货量', type: 'line', unit: '单',
          data: [9200, 10100, 9600, 9800, 11000, 11600, 10800, 11400, 12200, 11200, 12800, 13400] }
      ]
    },

    /* 全公司经营能力雷达（概览使用） */
    overall: {
      title: '全公司经营能力评估',
      dims: [
        { name: '市场拓展', max: 100 },
        { name: '技术创新', max: 100 },
        { name: '成本控制', max: 100 },
        { name: '交付效率', max: 100 },
        { name: '质量保障', max: 100 }
      ],
      series: [
        { name: '佛山照明', value: [86, 82, 74, 88, 91] },
        { name: '行业标杆', value: [92, 88, 80, 85, 94] }
      ]
    }
  };

  /* ---------------------------------------------------------- 部门职能维度 */
  DATA.depts = {
    sales: {
      key: 'sales', name: '销售', en: 'SALES', type: 'dept',
      subtitle: '国内外渠道运营与订单获取',
      metric: { label: '营收达成率', value: 92.4, unit: '%' },
      kpis: [
        { label: '年度新增客户', value: 386,   unit: '家',  delta: 12.4, decimals: 0 },
        { label: '大客户复购率', value: 68.5,  unit: '%',   delta: 2.1,  decimals: 1 },
        { label: '应收账款周转', value: 52,    unit: '天',  delta: -3.6, decimals: 0 },
        { label: '在手订单',     value: 86420, unit: '万元', delta: 8.7,  decimals: 0 }
      ],
      gauge: { title: '年度目标达成率', value: 92.4, label: 'SALES TARGET', max: 100 },
      monthly: {
        months: MONTHS,
        series: [
          { name: '实际营收', type: 'line', unit: '万元', data: [31200, 34600, 29800, 32400, 36700, 39200, 35400, 38900, 41200, 37600, 42800, 44780] },
          { name: '目标营收', type: 'line', unit: '万元', data: [32000, 35000, 32000, 34000, 38000, 40000, 37000, 40000, 42000, 40000, 44000, 46000] }
        ]
      },
      bar: {
        title: '各业务板块销售额（万元）',
        categories: ['家用照明', '商用照明', '智能电工', '车用照明', '智慧城市', '海洋照明', '航空照明', '体育照明', '动植物'],
        series: [{ name: '销售额', data: [131200, 96700, 72800, 38600, 26400, 21400, 15200, 12400, 9680] }]
      },
      ring: {
        title: '销售渠道结构',
        data: [
          { name: '经销渠道', value: 198600 },
          { name: '工程直供', value: 96200 },
          { name: '电商零售', value: 74300 },
          { name: '海外出口', value: 48280 }
        ]
      },
      radar: {
        title: '销售能力评估',
        dims: [{ name: '渠道覆盖', max: 100 }, { name: '客户结构', max: 100 }, { name: '价格管理', max: 100 },
               { name: '回款效率', max: 100 }, { name: '新客增长', max: 100 }],
        series: [{ name: '销售中心', value: [88, 76, 72, 68, 85] }]
      },
      drill: {
        title: '关联业务板块（万元）', unit: '万元',
        items: [
          { type: 'board', key: 'home',       name: '家用照明',     value: 131200 },
          { type: 'board', key: 'commercial', name: '商用照明',     value: 96700 },
          { type: 'board', key: 'electric',   name: '智能电工',     value: 72800 },
          { type: 'board', key: 'auto',       name: '车用照明',     value: 38600 },
          { type: 'board', key: 'smartcity',  name: '智慧城市照明', value: 26400 }
        ]
      }
    },

    rd: {
      key: 'rd', name: '研发', en: 'R&D', type: 'dept',
      subtitle: '产品与技术项目管理',
      metric: { label: '项目进度', value: 78.3, unit: '%' },
      kpis: [
        { label: '在研项目',     value: 23,  unit: '个', delta: 3,    decimals: 0 },
        { label: '专利授权',     value: 156, unit: '项', delta: 14.6, decimals: 0 },
        { label: '研发投入占比', value: 4.6, unit: '%',  delta: 0.3,  decimals: 1 },
        { label: '按时结项率',   value: 87.2, unit: '%', delta: 2.4,  decimals: 1 }
      ],
      gauge: { title: '研发项目整体进度', value: 78.3, label: 'R&D PROGRESS', max: 100 },
      monthly: {
        months: MONTHS,
        series: [
          { name: '在研项目数', type: 'bar',  unit: '个', data: [18, 19, 19, 20, 21, 21, 22, 22, 23, 23, 24, 23] },
          { name: '结项项目数', type: 'line', unit: '个', data: [2, 3, 2, 4, 3, 5, 4, 3, 5, 4, 6, 5] }
        ]
      },
      bar: {
        title: '各板块在研项目分布（个）',
        categories: ['家用照明', '商用照明', '智能电工', '车用照明', '智慧城市', '海洋照明', '航空照明', '体育照明', '动植物'],
        series: [{ name: '在研项目', data: [5, 4, 3, 3, 2, 2, 2, 1, 1] }]
      },
      ring: {
        title: '研发投入结构',
        data: [
          { name: '健康照明', value: 4820 },
          { name: '智能控制', value: 3640 },
          { name: '车用光学', value: 2980 },
          { name: '特种照明', value: 2160 },
          { name: '基础材料', value: 1580 }
        ]
      },
      radar: {
        title: '研发能力评估',
        dims: [{ name: '技术储备', max: 100 }, { name: '项目交付', max: 100 }, { name: '专利产出', max: 100 },
               { name: '成果转化', max: 100 }, { name: '投入强度', max: 100 }],
        series: [{ name: '研发中心', value: [90, 84, 78, 72, 80] }]
      },
      drill: {
        title: '重点在研方向（万元）', unit: '万元',
        items: [
          { type: 'board', key: 'home',      name: '健康光环境',   value: 4820 },
          { type: 'board', key: 'electric',  name: '智能控制',     value: 3640 },
          { type: 'board', key: 'auto',      name: '车用光学',     value: 2980 },
          { type: 'board', key: 'marine',    name: '深海照明',     value: 2160 },
          { type: 'board', key: 'sports',    name: '专业场馆光学', value: 1580 }
        ]
      }
    },

    purchase: {
      key: 'purchase', name: '采购', en: 'PURCHASE', type: 'dept',
      subtitle: '供应商与物料保障',
      metric: { label: '交付率', value: 96.8, unit: '%' },
      kpis: [
        { label: '采购交付率',   value: 96.8, unit: '%',  delta: 0.9,  decimals: 1 },
        { label: '年度降本率',   value: 3.2,  unit: '%',  delta: 0.6,  decimals: 1 },
        { label: '合格供应商',   value: 412,  unit: '家', delta: 18,   decimals: 0 },
        { label: '来料合格率',   value: 99.1, unit: '%',  delta: 0.4,  decimals: 1 }
      ],
      gauge: { title: '采购交付及时率', value: 96.8, label: 'ON-TIME DELIVERY', max: 100 },
      monthly: {
        months: MONTHS,
        series: [
          { name: '采购订单', type: 'bar',  unit: '单', data: [1240, 1380, 1180, 1320, 1460, 1520, 1410, 1490, 1580, 1440, 1620, 1702] },
          { name: '准时交付', type: 'line', unit: '%',  data: [94.2, 95.1, 93.8, 95.6, 96.2, 96.8, 95.4, 96.6, 97.1, 96.2, 97.4, 96.8] }
        ]
      },
      bar: {
        title: '主要物料采购额（万元）',
        categories: ['LED芯片', '驱动电源', '结构件', '光学器件', '包材', '电子元件'],
        series: [{ name: '采购额', data: [68900, 41200, 32400, 21600, 14200, 12800] }]
      },
      ring: {
        title: '供应商分级',
        data: [
          { name: '战略供应商', value: 68 },
          { name: '核心供应商', value: 124 },
          { name: '一般供应商', value: 168 },
          { name: '备选供应商', value: 52 }
        ]
      },
      radar: {
        title: '采购能力评估',
        dims: [{ name: '交付保障', max: 100 }, { name: '成本控制', max: 100 }, { name: '供应商质量', max: 100 },
               { name: '响应速度', max: 100 }, { name: '风险分散', max: 100 }],
        series: [{ name: '采购中心', value: [92, 84, 78, 82, 74] }]
      },
      drill: {
        title: '关键物料供应商（家）', unit: '家',
        items: [
          { type: 'board', key: 'home',      name: 'LED芯片',   value: 26 },
          { type: 'board', key: 'electric',  name: '驱动电源',  value: 34 },
          { type: 'board', key: 'commercial', name: '结构件',   value: 48 },
          { type: 'board', key: 'auto',      name: '光学器件',  value: 19 },
          { type: 'board', key: 'smartcity', name: '智能模组',  value: 22 }
        ]
      }
    },

    production: {
      key: 'production', name: '生产', en: 'PRODUCTION', type: 'dept',
      subtitle: '制造与产能管理',
      metric: { label: '产能达成', value: 91.5, unit: '%' },
      kpis: [
        { label: '产能达成率',   value: 91.5, unit: '%',  delta: 1.6,  decimals: 1 },
        { label: '一次直通率',   value: 97.8, unit: '%',  delta: 0.5,  decimals: 1 },
        { label: '设备稼动率',   value: 88.4, unit: '%',  delta: 2.2,  decimals: 1 },
        { label: '单位制造成本', value: 18.6, unit: '元', delta: -1.4, decimals: 1 }
      ],
      gauge: { title: '产能达成率', value: 91.5, label: 'CAPACITY ACHIEVE', max: 100 },
      monthly: {
        months: MONTHS,
        series: [
          { name: '计划产量', type: 'bar',  unit: '万只', data: [420, 460, 410, 440, 485, 510, 470, 505, 530, 495, 550, 572] },
          { name: '实际产量', type: 'line', unit: '万只', data: [386, 428, 372, 408, 448, 474, 432, 468, 492, 456, 512, 523] }
        ]
      },
      bar: {
        title: '各厂区产出（万只）',
        categories: ['高明总部', '南海基地', '智能工厂', '重庆基地', '泰国工厂'],
        series: [{ name: '产出', data: [1860, 1240, 980, 620, 340] }]
      },
      ring: {
        title: '产能结构分布',
        data: [
          { name: '家用灯具', value: 1980 },
          { name: '商照产品', value: 1260 },
          { name: '电工产品', value: 860 },
          { name: '车用灯具', value: 480 },
          { name: '特种照明', value: 320 }
        ]
      },
      radar: {
        title: '制造能力评估',
        dims: [{ name: '产能利用', max: 100 }, { name: '良率水平', max: 100 }, { name: '自动化率', max: 100 },
               { name: '能耗效率', max: 100 }, { name: '柔性制造', max: 100 }],
        series: [{ name: '制造中心', value: [88, 94, 76, 70, 82] }]
      },
      drill: {
        title: '主力厂区产出（万只）', unit: '万只',
        items: [
          { type: 'board', key: 'home',       name: '高明总部', value: 1860 },
          { type: 'board', key: 'commercial', name: '南海基地', value: 1240 },
          { type: 'board', key: 'electric',   name: '智能工厂', value: 980 },
          { type: 'board', key: 'auto',       name: '重庆基地', value: 620 },
          { type: 'board', key: 'smartcity',  name: '泰国工厂', value: 340 }
        ]
      }
    },

    warehouse: {
      key: 'warehouse', name: '仓储', en: 'WAREHOUSE', type: 'dept',
      subtitle: '库存与物流协同',
      metric: { label: '周转率', value: 6.8, unit: '次/年' },
      kpis: [
        { label: '库存周转率',   value: 6.8,  unit: '次/年', delta: 0.5,  decimals: 1 },
        { label: '库存准确率',   value: 99.6, unit: '%',     delta: 0.2,  decimals: 1 },
        { label: '呆滞库存占比', value: 2.3,  unit: '%',     delta: -0.4, decimals: 1 },
        { label: '出入库及时率', value: 98.9, unit: '%',     delta: 0.7,  decimals: 1 }
      ],
      gauge: { title: '仓储作业效率', value: 93.6, label: 'WMS EFFICIENCY', max: 100 },
      monthly: {
        months: MONTHS,
        series: [
          { name: '出库单量', type: 'bar',  unit: '单', data: [8600, 9400, 8200, 9100, 10200, 10800, 9800, 10600, 11200, 10300, 11800, 12400] },
          { name: '库存周转', type: 'line', unit: '次', data: [6.1, 6.2, 5.9, 6.3, 6.5, 6.6, 6.4, 6.7, 6.9, 6.6, 6.9, 6.8] }
        ]
      },
      bar: {
        title: '各仓库存金额（万元）',
        categories: ['高明中心仓', '南海成品仓', '华南分仓', '华东分仓', '西南分仓', '海外仓'],
        series: [{ name: '库存金额', data: [12800, 8600, 5400, 4800, 3200, 2600] }]
      },
      ring: {
        title: '库存结构',
        data: [
          { name: '原材料', value: 18600 },
          { name: '在制品', value: 12400 },
          { name: '成品',   value: 6800 },
          { name: '呆滞品', value: 860 }
        ]
      },
      radar: {
        title: '仓储能力评估',
        dims: [{ name: '周转效率', max: 100 }, { name: '账实一致', max: 100 }, { name: '空间利用', max: 100 },
               { name: '配送及时', max: 100 }, { name: '呆滞管控', max: 100 }],
        series: [{ name: '仓储物流', value: [84, 96, 78, 90, 80] }]
      },
      drill: {
        title: '主要仓库库存（万元）', unit: '万元',
        items: [
          { type: 'board', key: 'home',       name: '高明中心仓', value: 12800 },
          { type: 'board', key: 'commercial', name: '南海成品仓', value: 8600 },
          { type: 'board', key: 'electric',   name: '华南分仓',   value: 5400 },
          { type: 'board', key: 'auto',       name: '华东分仓',   value: 4800 },
          { type: 'board', key: 'smartcity',  name: '西南分仓',   value: 3200 }
        ]
      }
    },

    finance: {
      key: 'finance', name: '财务', en: 'FINANCE', type: 'dept',
      subtitle: '经营核算与资金管理',
      metric: { label: '毛利率', value: 24.6, unit: '%' },
      kpis: [
        { label: '综合毛利率',   value: 24.6, unit: '%',  delta: -0.4, decimals: 1 },
        { label: '净利率',       value: 8.9,  unit: '%',  delta: 0.6,  decimals: 1 },
        { label: '期间费用率',   value: 12.4, unit: '%',  delta: -0.8, decimals: 1 },
        { label: '经营性现金流', value: 5.86, unit: '亿元', delta: 12.4, decimals: 2 }
      ],
      gauge: { title: '预算执行率', value: 94.2, label: 'BUDGET EXECUTION', max: 100 },
      monthly: {
        months: MONTHS,
        series: [
          { name: '营业收入', type: 'bar',  unit: '万元', data: [31200, 34600, 29800, 32400, 36700, 39200, 35400, 38900, 41200, 37600, 42800, 44780] },
          { name: '毛利率',   type: 'line', unit: '%',    data: [23.8, 24.2, 23.4, 24.0, 24.6, 25.1, 24.2, 24.8, 25.2, 24.4, 25.0, 24.6] }
        ]
      },
      bar: {
        title: '各板块毛利贡献（万元）',
        categories: ['家用照明', '商用照明', '智能电工', '车用照明', '智慧城市', '海洋照明', '航空照明', '体育照明', '动植物'],
        series: [{ name: '毛利额', data: [30200, 24200, 18900, 10200, 7400, 6300, 4700, 3600, 2900] }]
      },
      ring: {
        title: '成本费用结构',
        data: [
          { name: '直接材料', value: 218600 },
          { name: '人工成本', value: 42600 },
          { name: '制造费用', value: 34800 },
          { name: '期间费用', value: 51700 },
          { name: '其他',     value: 12800 }
        ]
      },
      radar: {
        title: '财务健康度',
        dims: [{ name: '盈利水平', max: 100 }, { name: '现金流', max: 100 }, { name: '成本管控', max: 100 },
               { name: '资产效率', max: 100 }, { name: '风险敞口', max: 100 }],
        series: [{ name: '财务中心', value: [78, 84, 76, 82, 88] }]
      },
      drill: {
        title: '板块毛利贡献（万元）', unit: '万元',
        items: [
          { type: 'board', key: 'home',       name: '家用照明',     value: 30200 },
          { type: 'board', key: 'commercial', name: '商用照明',     value: 24200 },
          { type: 'board', key: 'electric',   name: '智能电工',     value: 18900 },
          { type: 'board', key: 'auto',       name: '车用照明',     value: 10200 },
          { type: 'board', key: 'smartcity',  name: '智慧城市照明', value: 7400 }
        ]
      }
    }
  };

  /* ---------------------------------------------------------- 业务板块维度 */
  function board(key, name, en, href, opts) {
    return {
      key: key, name: name, en: en, type: 'board', href: href,
      subtitle: opts.subtitle,
      revenue: opts.revenue,          // 年度营收（万元），排行榜与矩阵展示
      metric: { label: '年度营收', value: opts.revenue, unit: '万元' },
      kpis: opts.kpis,
      gauge: opts.gauge,
      monthly: opts.monthly,
      bar: opts.bar,
      ring: opts.ring,
      radar: opts.radar,
      drill: opts.drill
    };
  }

  DATA.boards = {
    aviation: board('aviation', '航空照明', 'AVIATION', '/business/5.html', {
      subtitle: '机舱/助航/机务照明',
      revenue: 15200,
      kpis: [
        { label: '年度营收',   value: 15200, unit: '万元', delta: 12.6, decimals: 0 },
        { label: '同比增长',   value: 12.6,  unit: '%',    delta: 3.4,  decimals: 1 },
        { label: '毛利率',     value: 31.2,  unit: '%',    delta: 1.8,  decimals: 1 },
        { label: '在手订单',   value: 8600,  unit: '万元', delta: 9.4,  decimals: 0 }
      ],
      gauge: { title: '交付及时率', value: 95.8, label: 'ON-TIME RATE', max: 100 },
      monthly: {
        months: MONTHS,
        series: [
          { name: '营收',   type: 'line', unit: '万元', data: [980, 1120, 1020, 1140, 1260, 1340, 1220, 1320, 1410, 1280, 1460, 1550] },
          { name: '订单量', type: 'bar',  unit: '单',   data: [86, 94, 82, 96, 108, 116, 104, 112, 122, 108, 126, 132] }
        ]
      },
      bar: {
        title: '区域营收分布（万元）',
        categories: ['华南', '华东', '华北', '华中', '西南', '东北', '海外'],
        series: [{ name: '营收', data: [4200, 3600, 2400, 1800, 1400, 900, 900] }]
      },
      ring: {
        title: '产品线结构',
        data: [
          { name: '机舱照明', value: 6100 },
          { name: '助航灯光', value: 4200 },
          { name: '机务工作灯', value: 2800 },
          { name: '客舱氛围灯', value: 2100 }
        ]
      },
      radar: {
        title: '板块竞争力',
        dims: [{ name: '技术壁垒', max: 100 }, { name: '认证资质', max: 100 }, { name: '毛利水平', max: 100 },
               { name: '定制能力', max: 100 }, { name: '市场规模', max: 100 }],
        series: [{ name: '航空照明', value: [92, 96, 82, 88, 46] }]
      },
      drill: {
        title: '部门协同贡献（万元）', unit: '万元',
        items: [
          { type: 'dept', key: 'rd',         name: '研发（认证与光学）', value: 4200 },
          { type: 'dept', key: 'sales',      name: '销售（航司客户）',   value: 3800 },
          { type: 'dept', key: 'production', name: '生产（精密制造）',   value: 3200 },
          { type: 'dept', key: 'purchase',   name: '采购（特种物料）',   value: 2200 },
          { type: 'dept', key: 'finance',    name: '财务（项目核算）',   value: 1800 }
        ]
      }
    }),

    electric: board('electric', '智能电工', 'SMART ELECTRIC', '/business/4.html', {
      subtitle: '开关/配电/智能家居',
      revenue: 72800,
      kpis: [
        { label: '年度营收', value: 72800, unit: '万元', delta: 8.4,  decimals: 0 },
        { label: '同比增长', value: 8.4,   unit: '%',    delta: 1.2,  decimals: 1 },
        { label: '毛利率',   value: 26.4,  unit: '%',    delta: 0.6,  decimals: 1 },
        { label: '在手订单', value: 18600, unit: '万元', delta: 6.8,  decimals: 0 }
      ],
      gauge: { title: '订单交付率', value: 97.2, label: 'FULFILLMENT', max: 100 },
      monthly: {
        months: MONTHS,
        series: [
          { name: '营收',   type: 'line', unit: '万元', data: [5400, 6100, 5200, 5800, 6500, 6900, 6200, 6800, 7200, 6600, 7400, 7700] },
          { name: '订单量', type: 'bar',  unit: '单',   data: [1860, 2140, 1780, 2020, 2260, 2420, 2160, 2380, 2520, 2300, 2620, 2740] }
        ]
      },
      bar: {
        title: '区域营收分布（万元）',
        categories: ['华南', '华东', '华北', '华中', '西南', '东北', '海外'],
        series: [{ name: '营收', data: [21600, 16800, 10200, 8400, 6400, 4200, 5200] }]
      },
      ring: {
        title: '产品线结构',
        data: [
          { name: '智能开关', value: 28600 },
          { name: '配电箱',   value: 18400 },
          { name: '智能门锁', value: 14200 },
          { name: '传感模组', value: 11600 }
        ]
      },
      radar: {
        title: '板块竞争力',
        dims: [{ name: '技术壁垒', max: 100 }, { name: '认证资质', max: 100 }, { name: '毛利水平', max: 100 },
               { name: '定制能力', max: 100 }, { name: '市场规模', max: 100 }],
        series: [{ name: '智能电工', value: [72, 78, 68, 80, 88] }]
      },
      drill: {
        title: '部门协同贡献（万元）', unit: '万元',
        items: [
          { type: 'dept', key: 'sales',      name: '销售（渠道分销）', value: 24800 },
          { type: 'dept', key: 'production', name: '生产（自动化线）', value: 18600 },
          { type: 'dept', key: 'rd',         name: '研发（智能控制）', value: 12400 },
          { type: 'dept', key: 'purchase',   name: '采购（电子料）',   value: 9800 },
          { type: 'dept', key: 'warehouse',  name: '仓储（分仓配送）', value: 7200 }
        ]
      }
    }),

    smartcity: board('smartcity', '智慧城市照明', 'SMART CITY', '/business/9.html', {
      subtitle: '道路/景观/智慧灯杆',
      revenue: 26400,
      kpis: [
        { label: '年度营收', value: 26400, unit: '万元', delta: 14.8, decimals: 0 },
        { label: '同比增长', value: 14.8,  unit: '%',    delta: 4.2,  decimals: 1 },
        { label: '毛利率',   value: 22.8,  unit: '%',    delta: -0.6, decimals: 1 },
        { label: '在建项目', value: 46,    unit: '个',   delta: 8,    decimals: 0 }
      ],
      gauge: { title: '项目交付率', value: 89.6, label: 'PROJECT DELIVERY', max: 100 },
      monthly: {
        months: MONTHS,
        series: [
          { name: '营收',   type: 'line', unit: '万元', data: [1860, 2140, 1720, 1980, 2260, 2420, 2160, 2380, 2560, 2320, 2640, 2760] },
          { name: '项目数', type: 'bar',  unit: '个',   data: [28, 32, 26, 30, 34, 38, 34, 36, 40, 38, 42, 46] }
        ]
      },
      bar: {
        title: '区域营收分布（万元）',
        categories: ['华南', '华东', '华北', '华中', '西南', '东北', '海外'],
        series: [{ name: '营收', data: [8400, 6200, 3800, 3200, 2400, 1200, 1200] }]
      },
      ring: {
        title: '产品线结构',
        data: [
          { name: '智慧灯杆', value: 10200 },
          { name: '道路照明', value: 8400 },
          { name: '景观亮化', value: 5200 },
          { name: '平台软件', value: 2600 }
        ]
      },
      radar: {
        title: '板块竞争力',
        dims: [{ name: '技术壁垒', max: 100 }, { name: '认证资质', max: 100 }, { name: '毛利水平', max: 100 },
               { name: '定制能力', max: 100 }, { name: '市场规模', max: 100 }],
        series: [{ name: '智慧城市照明', value: [80, 74, 62, 86, 72] }]
      },
      drill: {
        title: '部门协同贡献（万元）', unit: '万元',
        items: [
          { type: 'dept', key: 'sales',    name: '销售（政企客户）', value: 9200 },
          { type: 'dept', key: 'rd',       name: '研发（平台软件）', value: 6400 },
          { type: 'dept', key: 'production', name: '生产（灯杆制造）', value: 5200 },
          { type: 'dept', key: 'finance',  name: '财务（项目融资）', value: 3200 },
          { type: 'dept', key: 'warehouse', name: '仓储（工程配送）', value: 2400 }
        ]
      }
    }),

    marine: board('marine', '海洋照明', 'MARINE', '/business/10.html', {
      subtitle: '深海/港口/海洋牧场',
      revenue: 21400,
      kpis: [
        { label: '年度营收', value: 21400, unit: '万元', delta: 18.2, decimals: 0 },
        { label: '同比增长', value: 18.2,  unit: '%',    delta: 5.6,  decimals: 1 },
        { label: '毛利率',   value: 34.6,  unit: '%',    delta: 2.2,  decimals: 1 },
        { label: '在手订单', value: 12400, unit: '万元', delta: 12.8, decimals: 0 }
      ],
      gauge: { title: '交付及时率', value: 93.4, label: 'ON-TIME RATE', max: 100 },
      monthly: {
        months: MONTHS,
        series: [
          { name: '营收',   type: 'line', unit: '万元', data: [1420, 1620, 1380, 1560, 1820, 1940, 1740, 1920, 2060, 1860, 2140, 2240] },
          { name: '订单量', type: 'bar',  unit: '单',   data: [62, 72, 58, 68, 78, 84, 74, 82, 88, 80, 92, 96] }
        ]
      },
      bar: {
        title: '区域营收分布（万元）',
        categories: ['华南', '华东', '华北', '华中', '西南', '东北', '海外'],
        series: [{ name: '营收', data: [6800, 4600, 2600, 1800, 1200, 800, 3600] }]
      },
      ring: {
        title: '产品线结构',
        data: [
          { name: '深海灯具', value: 8600 },
          { name: '港口照明', value: 5400 },
          { name: '海洋牧场', value: 4200 },
          { name: '集鱼灯',   value: 3200 }
        ]
      },
      radar: {
        title: '板块竞争力',
        dims: [{ name: '技术壁垒', max: 100 }, { name: '认证资质', max: 100 }, { name: '毛利水平', max: 100 },
               { name: '定制能力', max: 100 }, { name: '市场规模', max: 100 }],
        series: [{ name: '海洋照明', value: [94, 90, 88, 84, 42] }]
      },
      drill: {
        title: '部门协同贡献（万元）', unit: '万元',
        items: [
          { type: 'dept', key: 'rd',         name: '研发（深海密封）', value: 7200 },
          { type: 'dept', key: 'sales',      name: '销售（海工客户）', value: 5600 },
          { type: 'dept', key: 'production', name: '生产（特种工艺）', value: 4200 },
          { type: 'dept', key: 'purchase',   name: '采购（耐蚀材料）', value: 2600 },
          { type: 'dept', key: 'finance',    name: '财务（出口结算）', value: 1800 }
        ]
      }
    }),

    home: board('home', '家用照明', 'HOME', '/business/6.html', {
      subtitle: '家居/健康光/智能灯',
      revenue: 131200,
      kpis: [
        { label: '年度营收', value: 131200, unit: '万元', delta: 5.6, decimals: 0 },
        { label: '同比增长', value: 5.6,    unit: '%',    delta: 0.8, decimals: 1 },
        { label: '毛利率',   value: 23.0,   unit: '%',    delta: 0.4, decimals: 1 },
        { label: '电商占比', value: 28.4,   unit: '%',    delta: 3.2, decimals: 1 }
      ],
      gauge: { title: '订单满足率', value: 96.4, label: 'FILL RATE', max: 100 },
      monthly: {
        months: MONTHS,
        series: [
          { name: '营收',   type: 'line', unit: '万元', data: [9800, 11200, 8600, 9100, 10500, 11800, 10200, 11300, 12100, 10900, 12400, 13100] },
          { name: '订单量', type: 'bar',  unit: '单',   data: [3200, 3600, 2900, 3100, 3500, 3900, 3400, 3700, 4000, 3600, 4100, 4300] }
        ]
      },
      bar: {
        title: '区域营收分布（万元）',
        categories: ['华南', '华东', '华北', '华中', '西南', '东北', '海外'],
        series: [{ name: '营收', data: [38600, 32400, 18600, 14800, 11200, 6400, 9200] }]
      },
      ring: {
        title: '产品线结构',
        data: [
          { name: '健康照明', value: 46800 },
          { name: '家居灯饰', value: 38600 },
          { name: '智能灯具', value: 28400 },
          { name: '光源电器', value: 17400 }
        ]
      },
      radar: {
        title: '板块竞争力',
        dims: [{ name: '技术壁垒', max: 100 }, { name: '认证资质', max: 100 }, { name: '毛利水平', max: 100 },
               { name: '定制能力', max: 100 }, { name: '市场规模', max: 100 }],
        series: [{ name: '家用照明', value: [66, 78, 60, 70, 96] }]
      },
      drill: {
        title: '部门协同贡献（万元）', unit: '万元',
        items: [
          { type: 'dept', key: 'sales',      name: '销售（经销+电商）', value: 48600 },
          { type: 'dept', key: 'production', name: '生产（规模制造）',  value: 36400 },
          { type: 'dept', key: 'rd',         name: '研发（健康光谱）',  value: 18600 },
          { type: 'dept', key: 'warehouse',  name: '仓储（分仓履约）',  value: 16800 },
          { type: 'dept', key: 'purchase',   name: '采购（规模化采购）', value: 10800 }
        ]
      }
    }),

    auto: board('auto', '车用照明', 'AUTOMOTIVE', '/business/3.html', {
      subtitle: '前照灯/尾灯/内饰灯',
      revenue: 38600,
      kpis: [
        { label: '年度营收', value: 38600, unit: '万元', delta: 10.4, decimals: 0 },
        { label: '同比增长', value: 10.4,  unit: '%',    delta: 2.6,  decimals: 1 },
        { label: '毛利率',   value: 19.6,  unit: '%',    delta: -0.8, decimals: 1 },
        { label: '定点项目', value: 28,    unit: '个',   delta: 6,    decimals: 0 }
      ],
      gauge: { title: '量产达成率', value: 91.2, label: 'SOP ACHIEVE', max: 100 },
      monthly: {
        months: MONTHS,
        series: [
          { name: '营收',   type: 'line', unit: '万元', data: [2800, 3200, 2600, 2900, 3300, 3500, 3200, 3400, 3700, 3300, 3800, 3900] },
          { name: '出货量', type: 'bar',  unit: '万只', data: [42, 48, 38, 44, 50, 54, 48, 52, 56, 50, 58, 60] }
        ]
      },
      bar: {
        title: '区域营收分布（万元）',
        categories: ['华南', '华东', '华北', '华中', '西南', '东北', '海外'],
        series: [{ name: '营收', data: [12400, 9600, 5800, 4200, 2800, 1800, 2000] }]
      },
      ring: {
        title: '产品线结构',
        data: [
          { name: '前照灯', value: 16200 },
          { name: '尾灯',   value: 10400 },
          { name: '内饰灯', value: 7200 },
          { name: '氛围灯', value: 4800 }
        ]
      },
      radar: {
        title: '板块竞争力',
        dims: [{ name: '技术壁垒', max: 100 }, { name: '认证资质', max: 100 }, { name: '毛利水平', max: 100 },
               { name: '定制能力', max: 100 }, { name: '市场规模', max: 100 }],
        series: [{ name: '车用照明', value: [84, 88, 54, 82, 74] }]
      },
      drill: {
        title: '部门协同贡献（万元）', unit: '万元',
        items: [
          { type: 'dept', key: 'production', name: '生产（车规制造）', value: 12800 },
          { type: 'dept', key: 'rd',         name: '研发（光学设计）', value: 9600 },
          { type: 'dept', key: 'sales',      name: '销售（主机厂）',   value: 8400 },
          { type: 'dept', key: 'purchase',   name: '采购（车规物料）', value: 4600 },
          { type: 'dept', key: 'finance',    name: '财务（项目核算）', value: 3200 }
        ]
      }
    }),

    sports: board('sports', '体育照明', 'SPORTS', '/business/7.html', {
      subtitle: '专业场馆/训练照明',
      revenue: 12400,
      kpis: [
        { label: '年度营收', value: 12400, unit: '万元', delta: 16.4, decimals: 0 },
        { label: '同比增长', value: 16.4,  unit: '%',    delta: 4.8,  decimals: 1 },
        { label: '毛利率',   value: 29.8,  unit: '%',    delta: 2.0,  decimals: 1 },
        { label: '中标项目', value: 18,    unit: '个',   delta: 5,    decimals: 0 }
      ],
      gauge: { title: '项目交付率', value: 94.6, label: 'DELIVERY RATE', max: 100 },
      monthly: {
        months: MONTHS,
        series: [
          { name: '营收',   type: 'line', unit: '万元', data: [820, 980, 760, 880, 1020, 1100, 980, 1080, 1160, 1020, 1180, 1220] },
          { name: '项目数', type: 'bar',  unit: '个',   data: [8, 10, 7, 9, 11, 13, 11, 12, 14, 12, 15, 18] }
        ]
      },
      bar: {
        title: '区域营收分布（万元）',
        categories: ['华南', '华东', '华北', '华中', '西南', '东北', '海外'],
        series: [{ name: '营收', data: [3600, 2800, 1800, 1400, 1000, 600, 1200] }]
      },
      ring: {
        title: '产品线结构',
        data: [
          { name: '专业场馆', value: 6200 },
          { name: '训练场地', value: 3200 },
          { name: '智慧控光', value: 1800 },
          { name: '配套服务', value: 1200 }
        ]
      },
      radar: {
        title: '板块竞争力',
        dims: [{ name: '技术壁垒', max: 100 }, { name: '认证资质', max: 100 }, { name: '毛利水平', max: 100 },
               { name: '定制能力', max: 100 }, { name: '市场规模', max: 100 }],
        series: [{ name: '体育照明', value: [88, 92, 78, 86, 38] }]
      },
      drill: {
        title: '部门协同贡献（万元）', unit: '万元',
        items: [
          { type: 'dept', key: 'rd',         name: '研发（配光设计）', value: 4200 },
          { type: 'dept', key: 'sales',      name: '销售（场馆客户）', value: 3400 },
          { type: 'dept', key: 'production', name: '生产（定制装配）', value: 2400 },
          { type: 'dept', key: 'finance',    name: '财务（招投标）',   value: 1400 },
          { type: 'dept', key: 'warehouse',  name: '仓储（工程配送）', value: 1000 }
        ]
      }
    }),

    agri: board('agri', '动植物照明', 'AGRI & ANIMAL', '/business/8.html', {
      subtitle: '植物工厂/现代养殖',
      revenue: 9680,
      kpis: [
        { label: '年度营收', value: 9680, unit: '万元', delta: 22.6, decimals: 0 },
        { label: '同比增长', value: 22.6, unit: '%',    delta: 6.4,  decimals: 1 },
        { label: '毛利率',   value: 32.4, unit: '%',    delta: 2.8,  decimals: 1 },
        { label: '示范基地', value: 32,   unit: '个',   delta: 9,    decimals: 0 }
      ],
      gauge: { title: '项目交付率', value: 92.8, label: 'DELIVERY RATE', max: 100 },
      monthly: {
        months: MONTHS,
        series: [
          { name: '营收',   type: 'line', unit: '万元', data: [620, 740, 580, 680, 790, 850, 760, 840, 900, 800, 920, 960] },
          { name: '项目数', type: 'bar',  unit: '个',   data: [12, 15, 10, 13, 16, 18, 15, 17, 20, 18, 22, 32] }
        ]
      },
      bar: {
        title: '区域营收分布（万元）',
        categories: ['华南', '华东', '华北', '华中', '西南', '东北', '海外'],
        series: [{ name: '营收', data: [2800, 2200, 1300, 1000, 800, 480, 1100] }]
      },
      ring: {
        title: '产品线结构',
        data: [
          { name: '植物工厂', value: 4200 },
          { name: '现代养殖', value: 2800 },
          { name: '温室补光', value: 1600 },
          { name: '智能控制', value: 1080 }
        ]
      },
      radar: {
        title: '板块竞争力',
        dims: [{ name: '技术壁垒', max: 100 }, { name: '认证资质', max: 100 }, { name: '毛利水平', max: 100 },
               { name: '定制能力', max: 100 }, { name: '市场规模', max: 100 }],
        series: [{ name: '动植物照明', value: [86, 80, 84, 82, 34] }]
      },
      drill: {
        title: '部门协同贡献（万元）', unit: '万元',
        items: [
          { type: 'dept', key: 'rd',       name: '研发（光谱配方）', value: 3400 },
          { type: 'dept', key: 'sales',    name: '销售（农业客户）', value: 2600 },
          { type: 'dept', key: 'production', name: '生产（定制）',   value: 1800 },
          { type: 'dept', key: 'purchase', name: '采购（特种芯片）', value: 1080 },
          { type: 'dept', key: 'finance',  name: '财务（补贴核算）', value: 800 }
        ]
      }
    }),

    commercial: board('commercial', '商用照明', 'COMMERCIAL', '/business/1.html', {
      subtitle: '办公/商业/酒店照明',
      revenue: 96700,
      kpis: [
        { label: '年度营收', value: 96700, unit: '万元', delta: 4.8, decimals: 0 },
        { label: '同比增长', value: 4.8,   unit: '%',    delta: -0.6, decimals: 1 },
        { label: '毛利率',   value: 25.0,  unit: '%',    delta: 0.2, decimals: 1 },
        { label: '在手订单', value: 24800, unit: '万元', delta: 5.4, decimals: 0 }
      ],
      gauge: { title: '订单交付率', value: 95.2, label: 'FULFILLMENT', max: 100 },
      monthly: {
        months: MONTHS,
        series: [
          { name: '营收',   type: 'line', unit: '万元', data: [7400, 8100, 6300, 6900, 7800, 8200, 7600, 8400, 8900, 8100, 9200, 9600] },
          { name: '订单量', type: 'bar',  unit: '单',   data: [2400, 2680, 2120, 2320, 2620, 2760, 2540, 2820, 3000, 2740, 3120, 3280] }
        ]
      },
      bar: {
        title: '区域营收分布（万元）',
        categories: ['华南', '华东', '华北', '华中', '西南', '东北', '海外'],
        series: [{ name: '营收', data: [28400, 23600, 14200, 10800, 8200, 4600, 6900] }]
      },
      ring: {
        title: '产品线结构',
        data: [
          { name: '办公照明', value: 34600 },
          { name: '商业照明', value: 28400 },
          { name: '酒店照明', value: 18200 },
          { name: '工业照明', value: 15500 }
        ]
      },
      radar: {
        title: '板块竞争力',
        dims: [{ name: '技术壁垒', max: 100 }, { name: '认证资质', max: 100 }, { name: '毛利水平', max: 100 },
               { name: '定制能力', max: 100 }, { name: '市场规模', max: 100 }],
        series: [{ name: '商用照明', value: [70, 82, 64, 78, 90] }]
      },
      drill: {
        title: '部门协同贡献（万元）', unit: '万元',
        items: [
          { type: 'dept', key: 'sales',      name: '销售（工程渠道）', value: 34600 },
          { type: 'dept', key: 'production', name: '生产（批量制造）', value: 26400 },
          { type: 'dept', key: 'rd',         name: '研发（方案设计）', value: 14800 },
          { type: 'dept', key: 'warehouse',  name: '仓储（工程配送）', value: 12600 },
          { type: 'dept', key: 'finance',    name: '财务（信用管理）', value: 8300 }
        ]
      }
    })
  };

  /* -------------------------------------------------------------- 工具方法 */
  /**
   * 模拟一次数据刷新（真实接入时替换为接口调用）。
   * 对每个数值做小幅随机漂移，触发数字滚动与图表更新动效。
   */
  DATA.simulate = function (amp) {
    var k = amp || 0.006;
    function drift(v) { return v * (1 + (Math.random() - 0.5) * 2 * k); }
    function round(v, d) { var p = Math.pow(10, d || 0); return Math.round(v * p) / p; }

    DATA.kpis.forEach(function (it) {
      var next = drift(it.value);
      it.value = round(next, it.decimals || 0);
      it.delta = round(it.delta + (Math.random() - 0.45) * 0.4, 1);
    });
    [DATA.trend, DATA.orders].forEach(function (block) {
      block.series.forEach(function (s) {
        var last = s.data.length - 1;
        s.data[last] = round(drift(s.data[last]), s.data[last] > 100 ? 0 : 1);
      });
    });
    DATA.meta.dataDate = new Date().toISOString().slice(0, 10);
    return DATA;
  };

  /** 按类型取实体（dept / board） */
  DATA.get = function (type, key) {
    if (type === 'dept') return DATA.depts[key];
    if (type === 'board') return DATA.boards[key];
    return null;
  };

  DATA.deptList = Object.keys(DATA.depts).map(function (k) { return DATA.depts[k]; });
  DATA.boardList = Object.keys(DATA.boards).map(function (k) { return DATA.boards[k]; });

  global.FSL_DATA = DATA;
})(window);
