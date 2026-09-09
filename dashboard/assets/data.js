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

  /* ==========================================================================
   * 维度三：子公司与制造基地（SUBSIDIARIES & MANUFACTURING BASES）
   * --------------------------------------------------------------------------
   * 数据性质声明（重要）：
   *   - 公司名单、属地、持股关系、主营业务、基地名称与产能、建厂年份：
   *     来自佛山照明官网「所属企业」页、公司公开披露与公开报道，属可追溯事实 [F]。
   *   - 营收 / 毛利 / 达成率 / 区域分布 / 产品线结构等经营指标：
   *     为大屏演示用模拟数据 [E]，非真实经营结果，界面上以「模拟」标识区分。
   * ========================================================================== */
  function sub(key, name, en, cfg) {
    var rev = cfg.revenue, grow = cfg.growth;
    // 由年度营收与增速反推 12 个月走势（末月对齐年度月均），仅用于演示动效
    var J = [1.06, 0.94, 1.09, 0.97, 1.05, 0.93, 1.08, 0.96, 1.07, 0.95, 1.06, 1.0];
    function series(divisor) {
      var out = [], v = rev / 12 * 0.62;
      for (var i = 0; i < 12; i++) {
        v = v * (1 + (grow / 100) / 12) * J[i];
        out.push(Math.round(v / divisor));
      }
      out[11] = Math.round(rev / 12 / divisor);
      return out;
    }
    return {
      key: key, name: name, en: en, type: 'sub',
      city: cfg.city, province: cfg.province, coord: cfg.coord,
      share: cfg.share, since: cfg.since, tag: cfg.tag,
      bizScope: cfg.bizScope, subtitle: cfg.subtitle,
      revenue: rev,
      metric: { label: '年度营收', value: rev, unit: '万元' },
      kpis: [
        { label: '年度营收', value: rev, unit: '万元', delta: grow, decimals: 0 },
        { label: '同比增长', value: grow, unit: '%', delta: cfg.gd, decimals: 1 },
        { label: '毛利率', value: cfg.margin, unit: '%', delta: cfg.md, decimals: 1 },
        { label: cfg.k4label, value: cfg.k4, unit: cfg.k4unit, delta: cfg.k4d, decimals: 0 }
      ],
      gauge: { title: '年度目标达成率', value: cfg.achieve, label: 'ACHIEVEMENT', max: 100 },
      monthly: {
        months: MONTHS,
        series: [
          { name: '营业收入', type: 'line', unit: '万元', data: series(1) },
          { name: '订单量', type: 'bar', unit: '单', data: series(cfg.perOrder) }
        ]
      },
      bar: {
        title: '区域营收分布（万元）',
        categories: ['华南', '华东', '华北', '华中', '西南', '东北', '海外'],
        series: [{ name: '营收', data: cfg.regions }]
      },
      ring: { title: '产品线结构', data: cfg.products },
      radar: {
        title: '子公司竞争力',
        dims: [{ name: '技术壁垒', max: 100 }, { name: '市场份额', max: 100 }, { name: '盈利能力', max: 100 },
               { name: '客户粘性', max: 100 }, { name: '协同价值', max: 100 }],
        series: [{ name: name, value: cfg.radar }]
      },
      drill: {
        title: '关联业务板块（万元）', unit: '万元',
        items: cfg.boards.map(function (b) { return { type: 'board', key: b.key, name: b.name, value: b.value }; })
      }
    };
  }

  /* 8 家所属企业 —— 名单与属地取自佛照官网「所属企业」[F] */
  DATA.subs = {
    guoxing: sub('guoxing', '国星光电', 'GUOXING OPTOELECTRONICS', {
      city: '广东佛山', province: '广东', coord: [113.12, 23.02],
      share: '控股 · A股上市（002449）', since: '2022 控股', tag: '上市子公司',
      bizScope: 'LED 封装 / 芯片 / 上游器件', subtitle: '上游 LED 封装与芯片，2022 年控股形成垂直一体化',
      revenue: 328600, growth: 8.6, margin: 18.4, achieve: 93.8, gd: 2.4, md: 0.8,
      k4label: '研发平台', k4: 12, k4unit: '个', k4d: 8.4, perOrder: 9,
      regions: [126400, 78200, 32600, 24800, 28600, 12400, 25600],
      products: [{ name: 'LED 封装', value: 138600 }, { name: 'RGB 显示', value: 86200 },
                 { name: '芯片器件', value: 62400 }, { name: '背光模组', value: 41400 }],
      radar: [88, 82, 58, 76, 92],
      boards: [{ key: 'home', name: '家用照明', value: 96400 }, { key: 'commercial', name: '商用照明', value: 72800 },
               { key: 'electric', name: '智能电工', value: 32600 }]
    }),

    liaowang: sub('liaowang', '南宁燎旺车灯', 'LIAOWANG AUTO LAMP', {
      city: '广西南宁', province: '广西', coord: [108.37, 22.82],
      share: '控股 · 2021 并购', since: '2021 并购', tag: '车灯平台',
      bizScope: '汽车车灯 / 车灯模组 / 控制器', subtitle: '1956 年建厂，2021 年并购，打通车灯业务出海口',
      revenue: 152600, growth: 14.2, margin: 16.8, achieve: 96.2, gd: 5.6, md: 1.6,
      k4label: '车灯产能', k4: 450, k4unit: '万台套', k4d: 12.5, perOrder: 12,
      regions: [38600, 32400, 18600, 21400, 26800, 8400, 6400],
      products: [{ name: '前照灯', value: 58600 }, { name: '尾灯', value: 38400 },
                 { name: '车灯模组', value: 32600 }, { name: '内饰灯', value: 23000 }],
      radar: [80, 68, 56, 88, 74],
      boards: [{ key: 'auto', name: '车用照明', value: 152600 }]
    }),

    zhida: sub('zhida', '智达电工', 'ZHIDA ELECTRIC', {
      city: '广东佛山', province: '广东', coord: [113.12, 23.02],
      share: '全资 · 2016 成立', since: '2016 成立', tag: '全资',
      bizScope: '开关插座 / 配电 / 智能家居', subtitle: '2016 年成立，承载电工板块业务',
      revenue: 64200, growth: 6.4, margin: 27.6, achieve: 91.4, gd: 1.2, md: 1.4,
      k4label: '在销 SKU', k4: 1860, k4unit: '个', k4d: 6.8, perOrder: 6,
      regions: [24600, 14200, 7800, 6400, 4200, 2600, 4400],
      products: [{ name: '开关插座', value: 28600 }, { name: '智能门锁', value: 16400 },
                 { name: '配电箱', value: 11600 }, { name: '智能附件', value: 7600 }],
      radar: [62, 58, 78, 68, 82],
      boards: [{ key: 'electric', name: '智能电工', value: 64200 }]
    }),

    hainan: sub('hainan', '佛照海南科技', 'FSL HAINAN TECH', {
      city: '海南海口', province: '海南', coord: [110.20, 20.04],
      share: '全资', since: '2021 成立', tag: '海洋照明',
      bizScope: '海洋照明 / 集鱼灯 / 深海照明', subtitle: '2021 年在海南投资建设海洋照明产业基地',
      revenue: 28600, growth: 28.6, margin: 34.2, achieve: 98.4, gd: 8.2, md: 2.6,
      k4label: '示范项目', k4: 46, k4unit: '个', k4d: 18.6, perOrder: 14,
      regions: [9600, 5200, 2800, 2200, 1800, 900, 6100],
      products: [{ name: '集鱼灯', value: 11600 }, { name: '养殖灯', value: 7200 },
                 { name: '深海照明', value: 5600 }, { name: '船用灯具', value: 4200 }],
      radar: [84, 42, 86, 64, 58],
      boards: [{ key: 'marine', name: '海洋照明', value: 28600 }]
    }),

    zhicheng: sub('zhicheng', '佛照智城科技', 'FSL SMART CITY', {
      city: '广东佛山', province: '广东', coord: [113.12, 23.02],
      share: '全资', since: '—', tag: '智慧城市',
      bizScope: '智慧路灯 / 景观照明 / 隧道照明', subtitle: '智慧城市照明与城市级项目交付平台',
      revenue: 26400, growth: 12.8, margin: 26.4, achieve: 89.6, gd: 3.6, md: 1.1,
      k4label: '在建项目', k4: 38, k4unit: '个', k4d: 9.2, perOrder: 22,
      regions: [9600, 5400, 3600, 2800, 2400, 1200, 1400],
      products: [{ name: '智慧路灯', value: 11600 }, { name: '景观亮化', value: 7200 },
                 { name: '隧道照明', value: 4600 }, { name: '运维服务', value: 3000 }],
      radar: [70, 46, 68, 72, 86],
      boards: [{ key: 'smartcity', name: '智慧城市照明', value: 26400 }]
    }),

    huaguang: sub('huaguang', '佛照华光（茂名）', 'FSL HUAGUANG', {
      city: '广东茂名', province: '广东', coord: [110.92, 21.66],
      share: '100% 全资', since: '2024 成立', tag: '新建基地',
      bizScope: '照明制造 / 华南产能基地', subtitle: '2024 年成立，承接华南制造与产能扩张',
      revenue: 19800, growth: 42.6, margin: 21.2, achieve: 86.4, gd: 12.4, md: 0.6,
      k4label: '投产产线', k4: 18, k4unit: '条', k4d: 28.4, perOrder: 7,
      regions: [12400, 2600, 1400, 1200, 900, 500, 800],
      products: [{ name: '光源模组', value: 8600 }, { name: '灯具组装', value: 6200 },
                 { name: '配件', value: 3200 }, { name: '代工服务', value: 1800 }],
      radar: [52, 34, 62, 58, 78],
      boards: [{ key: 'home', name: '家用照明', value: 12400 }, { key: 'commercial', name: '商用照明', value: 7400 }]
    }),

    hangxin: sub('hangxin', '航信航空设备', 'HANGXIN AVIATION', {
      city: '广东广州', province: '广东', coord: [113.26, 23.13],
      share: '45% 增资控股', since: '2024 增资控股', tag: '参股控股',
      bizScope: '航空照明 / 机载设备', subtitle: '2024 年增资控股，切入航空照明与机载设备赛道',
      revenue: 15200, growth: 22.4, margin: 31.6, achieve: 94.2, gd: 6.8, md: 2.2,
      k4label: '取证产品', k4: 26, k4unit: '项', k4d: 14.6, perOrder: 26,
      regions: [4200, 3600, 2800, 1400, 1200, 600, 1400],
      products: [{ name: '机舱照明', value: 6100 }, { name: '助航灯光', value: 4200 },
                 { name: '机务工作灯', value: 2800 }, { name: '客舱氛围灯', value: 2100 }],
      radar: [92, 38, 82, 84, 62],
      boards: [{ key: 'aviation', name: '航空照明', value: 15200 }]
    }),

    hule: sub('hule', '浙江沪乐电气', 'HULE ELECTRIC', {
      city: '浙江嘉兴', province: '浙江', coord: [120.75, 30.75],
      share: '66% 控股（2024 并购）', since: '2024 并购', tag: '舰船照明',
      bizScope: '舰船照明 / 防爆配电 / 灯光控制', subtitle: '2024 年以佛照海南科技为主体收购 66% 股权',
      revenue: 21400, growth: 18.6, margin: 29.8, achieve: 92.6, gd: 4.8, md: 1.8,
      k4label: '员工人数', k4: 245, k4unit: '人', k4d: 6.2, perOrder: 18,
      regions: [6400, 8600, 2800, 1600, 900, 400, 700],
      products: [{ name: '舰船用灯具', value: 9600 }, { name: '防爆配电', value: 5800 },
                 { name: '灯光控制', value: 3600 }, { name: '智能照明系统', value: 2400 }],
      radar: [86, 52, 76, 80, 66],
      boards: [{ key: 'marine', name: '海洋照明', value: 12800 }, { key: 'commercial', name: '商用照明', value: 8600 }]
    })
  };

  /* --------------------------------------------------------------------------
   * 制造基地分布（地图与列表共用）
   * 基地名称 / 城市 / 产能 / 持股关系为公开信息 [F]，坐标为城市中心坐标 [F]。
   * 注：佛照公开表述为「十大生产基地」，其中可公开查证的主要基地列于 fsl，
   *     燎旺车灯形成「南宁 / 柳州 / 重庆 / 青岛」基地布局并新建苏州基地 [F]；
   *     泰国基地为佛照海外产能布局 [F]，位于罗勇工业园一带（具体坐标按园区中心近似 [I]）。
   * ------------------------------------------------------------------------ */
  DATA.plants = {
    /* 燎旺车灯：全国分散布局的制造工厂（用户重点关注） */
    liaowang: [
      { name: '南宁基地', city: '广西南宁', coord: [108.37, 22.82], type: '总部', cap: '1956 年建厂 · 总部与研发中心' },
      { name: '柳州基地', city: '广西柳州', coord: [109.43, 24.33], type: '制造基地', cap: '柳东新区花岭工业园' },
      { name: '重庆基地', city: '重庆', coord: [106.55, 29.56], type: '制造基地', cap: '重庆桂诺光电 · 全资子公司 · 占地 3.6 万㎡' },
      { name: '青岛基地', city: '山东青岛', coord: [120.38, 36.07], type: '制造基地', cap: '华东整车客户配套' },
      { name: '苏州基地', city: '江苏苏州', coord: [120.59, 31.30], type: '新建基地', cap: '2024 年投资 5.8 亿 · 年产车灯 120 万套' }
    ],
    /* 佛照照明与其他板块主要制造基地 */
    fsl: [
      { name: '佛山高明基地', city: '广东佛山', coord: [112.88, 22.90], type: '主基地', cap: '照明主基地 · 年产能约 7 亿只' },
      { name: '佛山总部', city: '广东佛山', coord: [113.12, 23.02], type: '总部', cap: '禅城总部 · 研发创新中心' },
      { name: '浙江嘉兴基地', city: '浙江嘉兴', coord: [120.75, 30.75], type: '制造基地', cap: '华东制造基地（含沪乐电气）' },
      { name: '河南新乡基地', city: '河南新乡', coord: [113.93, 35.30], type: '制造基地', cap: '华中制造基地' },
      { name: '海南海洋照明基地', city: '海南海口', coord: [110.20, 20.04], type: '产业基地', cap: '2021 年投资建设海洋照明产业基地' },
      { name: '茂名华光基地', city: '广东茂名', coord: [110.92, 21.66], type: '制造基地', cap: '佛照华光（茂名）· 2024 年成立' },
      { name: '泰国基地', city: '泰国罗勇', coord: [101.28, 12.65], type: '海外基地', cap: '海外生产基地 · 承接海外客户本地化供货', overseas: true }
    ]
  };

  /* -------------------------------------------------- 基地生产 / 销售指标 */
  /**
   * 口径说明：
   *   capacity —— 年产能（capUnit）；output —— 本年累计产量；sales —— 本年累计销量
   *   util     —— 产能利用率 = 产量 / 年产能（%）；value —— 本年累计产值（万元）
   * 基地名称、属地、产能文字说明为公开可追溯事实 [F]；
   * 上述数值为大屏演示用模拟数据 [E]，不与真实经营结果等同。
   */
  var PLANT_STAT = {
    /* 燎旺车灯：单位 万套 */
    '南宁基地': { capacity: 130, output: 118, sales: 112, util: 90.8, value: 46800, capUnit: '万套/年', outUnit: '万套' },
    '柳州基地': { capacity: 100, output: 92, sales: 88, util: 92.0, value: 36400, capUnit: '万套/年', outUnit: '万套' },
    '重庆基地': { capacity: 70, output: 61, sales: 57, util: 87.1, value: 23800, capUnit: '万套/年', outUnit: '万套' },
    '青岛基地': { capacity: 60, output: 48, sales: 45, util: 80.0, value: 18600, capUnit: '万套/年', outUnit: '万套' },
    '苏州基地': { capacity: 120, output: 36, sales: 33, util: 30.0, value: 14200, capUnit: '万套/年', outUnit: '万套' },
    /* 佛照照明：单位 万只 */
    '佛山高明基地': { capacity: 70000, output: 61200, sales: 58600, util: 87.4, value: 158600, capUnit: '万只/年', outUnit: '万只' },
    '佛山总部': { capacity: 1200, output: 860, sales: 820, util: 71.7, value: 24600, capUnit: '万只/年', outUnit: '万只' },
    '浙江嘉兴基地': { capacity: 12000, output: 10300, sales: 9800, util: 85.8, value: 38600, capUnit: '万只/年', outUnit: '万只' },
    '河南新乡基地': { capacity: 8000, output: 6600, sales: 6300, util: 82.5, value: 23400, capUnit: '万只/年', outUnit: '万只' },
    '海南海洋照明基地': { capacity: 1500, output: 980, sales: 880, util: 65.3, value: 14200, capUnit: '万只/年', outUnit: '万只' },
    '茂名华光基地': { capacity: 3600, output: 2680, sales: 2520, util: 74.4, value: 18600, capUnit: '万只/年', outUnit: '万只' },
    '泰国基地': { capacity: 3600, output: 1180, sales: 1020, util: 32.8, value: 9600, capUnit: '万只/年', outUnit: '万只' }
  };

  /* 产品结构模板：按集团区分（燎旺车灯 / 佛照照明），比例为模拟 [E] */
  var PLANT_MIX = {
    liaowang: [['前照灯', .38], ['尾灯', .24], ['车灯模组', .20], ['内饰灯', .12], ['控制器', .06]],
    fsl: [['光源器件', .34], ['家居灯具', .26], ['商用灯具', .18], ['电工电气', .12], ['特种照明', .10]]
  };

  /* 把指标挂到基地对象上，并建立 name → 基地 的索引，供地图 tooltip 与下钻使用 */
  DATA.plantIndex = {};
  ['liaowang', 'fsl'].forEach(function (grp) {
    DATA.plants[grp].forEach(function (p) {
      p.group = grp;
      p.stat = PLANT_STAT[p.name] || { capacity: 0, output: 0, sales: 0, util: 0, value: 0, capUnit: '万只/年', outUnit: '万只' };
      DATA.plantIndex[p.name] = p;
    });
  });

  /* 稳定伪随机：同一基地每次打开数值一致（避免刷新后跳变，模拟数据也要自洽） */
  function seedOf(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
    return h;
  }
  function mkRng(seed) {
    var x = seed || 1;
    return function () { x = (x * 1103515245 + 12345) & 0x7fffffff; return x / 0x7fffffff; };
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /**
   * 基地下钻详情：契约与 dept / board / sub 实体一致，渲染层无需改动。
   * 产量 / 销量月度走势由年度值按季节波动反推，末月对齐年均 [E]。
   */
  DATA.plantDetail = function (p) {
    if (!p) return null;
    var s = p.stat, rnd = mkRng(seedOf(p.name));
    var WAVE = [1.06, .94, 1.09, .97, 1.05, .93, 1.08, .96, 1.07, .95, 1.06, 1.0];
    function wave(base) {
      var out = [], v = base / 12 * .72;
      for (var i = 0; i < 12; i++) {
        v = v * WAVE[i] * (0.97 + rnd() * 0.06);
        out.push(Math.round(v));
      }
      out[11] = Math.round(base / 12);
      return out;
    }
    var mix = (PLANT_MIX[p.group] || PLANT_MIX.fsl).map(function (m) {
      return { name: m[0], value: Math.round(s.value * m[1] * (0.94 + rnd() * 0.12)) };
    });
    var others = [].concat(DATA.plants.liaowang, DATA.plants.fsl)
      .filter(function (o) { return o.name !== p.name; })
      .map(function (o) { return { type: 'plant', key: o.name, name: o.name, value: o.stat.value }; })
      .sort(function (a, b) { return b.value - a.value; });

    return {
      key: p.name, name: p.name, en: p.city + ' · ' + p.type, type: 'plant',
      subtitle: p.cap + ' ｜ 年产能 ' + s.capacity + ' ' + s.capUnit + '，本年产量 ' + s.output + ' ' + s.outUnit +
                '，销量 ' + s.sales + ' ' + s.outUnit + '，产能利用率 ' + s.util + '%（经营数值为模拟数据 [E]）',
      stat: s,
      kpis: [
        { label: '年产能', value: s.capacity, unit: s.capUnit, delta: 0, decimals: 0 },
        { label: '本年产量', value: s.output, unit: s.outUnit, delta: 6.4, decimals: 0 },
        { label: '本年销量', value: s.sales, unit: s.outUnit, delta: 5.8, decimals: 0 },
        { label: '产能利用率', value: s.util, unit: '%', delta: 1.2, decimals: 1 }
      ],
      gauge: { title: '年度产量达成率', value: s.util, label: 'OUTPUT ACHIEVEMENT', max: 100 },
      monthly: {
        months: MONTHS,
        series: [
          { name: '产量', type: 'line', unit: s.outUnit, data: wave(s.output) },
          { name: '销量', type: 'bar', unit: s.outUnit, data: wave(s.sales) }
        ]
      },
      bar: {
        title: '产品产值结构（万元）',
        categories: mix.map(function (m) { return m.name; }),
        series: [{ name: '产值', data: mix.map(function (m) { return m.value; }) }]
      },
      ring: { title: '产值结构占比', data: mix },
      radar: {
        title: '基地运营能力',
        dims: [{ name: '产能利用', max: 100 }, { name: '质量良率', max: 100 }, { name: '交付准时', max: 100 },
               { name: '成本控制', max: 100 }, { name: '自动化', max: 100 }],
        series: [{
          name: p.name,
          value: [
            clamp(s.util, 0, 100),
            Math.round(clamp(93 + (rnd() - .5) * 8, 60, 99)),
            Math.round(clamp(91 + (rnd() - .5) * 10, 60, 99)),
            Math.round(clamp(80 + (rnd() - .5) * 12, 50, 96)),
            Math.round(clamp(72 + (rnd() - .5) * 16, 40, 95))
          ]
        }]
      },
      drill: { title: '集团基地网络（万元）', unit: '万元', items: others }
    };
  };

  /* --------------------------------------------------------------------------
   * 经营评估：销售预算（收入 / 成本 / 费用）与销量（年初预测 / 实际 / 未来预测）
   * --------------------------------------------------------------------------
   * 期数口径：
   *   PLAN_MONTHS —— 近 12 个已发生月（MONTHS，25-10 ~ 26-09）+ 未来 3 个预测月（26-10 ~ 26-12）
   *   PLAN_SPLIT  —— 前 11 期为「已实现实际口径」，第 12 期（26-09）起为「滚动预测口径」
   * 字段口径：
   *   revBudget —— 年初销售预算 · 收入（万元，15 期）；costRateB / expRateB —— 预算成本率 / 费用率
   *   revK      —— 各期收入实现系数（<split 为实际，>=split 为滚动预测）
   *   costRate / expRate —— 实际与预测口径的成本率 / 费用率（逐期，用于趋势外推）
   *   qtyBudget —— 年初销售预测数（销量）；qtyK —— 销量实现 / 预测系数
   * 数值性质：全部为大屏演示用模拟数据 [E]，非真实预算与经营结果；接口接入后整体替换。
   * ------------------------------------------------------------------------ */
  var PLAN_MONTHS = MONTHS.concat(['26-10', '26-11', '26-12']);
  var PLAN_SPLIT = 11;   /* 索引 0..10 为实际，11..14 为预测 */

  var PLAN_CFG = {
    liaowang: {
      unit: '万元', qtyUnit: '万套',
      revBudget: [11800, 12600, 13400, 10800, 10200, 12800, 13600, 12900, 12400, 13200, 13900, 15000, 12800, 12100, 13600],
      revK:      [0.98, 0.96, 1.01, 0.93, 0.90, 0.97, 0.95, 0.94, 0.96, 0.95, 0.97, 0.97, 0.98, 0.99, 0.99],
      costRateB: 0.700, expRateB: 0.105,
      costRate:  [0.712, 0.718, 0.715, 0.722, 0.729, 0.731, 0.736, 0.740, 0.744, 0.748, 0.752, 0.762, 0.775, 0.788, 0.800],
      expRate:   [0.104, 0.106, 0.108, 0.107, 0.110, 0.109, 0.111, 0.112, 0.113, 0.112, 0.114, 0.113, 0.115, 0.116, 0.118],
      qtyBudget: [40, 42, 45, 36, 34, 43, 46, 44, 42, 45, 47, 50, 43, 41, 46],
      qtyK:      [0.97, 0.95, 1.00, 0.92, 0.89, 0.96, 0.94, 0.93, 0.94, 0.92, 0.95, 0.94, 0.95, 0.96, 0.96]
    },
    guoxing: {
      unit: '万元', qtyUnit: '万只',
      revBudget: [24200, 26400, 28100, 22800, 21600, 27300, 29100, 27600, 26200, 28400, 30200, 36700, 31200, 29800, 32600],
      revK:      [1.00, 1.01, 0.99, 0.98, 1.02, 1.00, 1.01, 1.02, 1.01, 1.00, 1.01, 1.02, 1.01, 1.01, 1.02],
      costRateB: 0.760, expRateB: 0.115,
      costRate:  [0.756, 0.754, 0.752, 0.750, 0.749, 0.747, 0.746, 0.744, 0.742, 0.741, 0.740, 0.738, 0.737, 0.736, 0.735],
      expRate:   [0.114, 0.114, 0.113, 0.113, 0.112, 0.112, 0.112, 0.111, 0.111, 0.111, 0.110, 0.110, 0.109, 0.109, 0.108],
      qtyBudget: [8600, 9200, 9800, 7900, 7600, 9300, 9900, 9400, 9000, 9700, 10300, 11200, 9500, 9100, 9900],
      qtyK:      [1.00, 1.01, 0.99, 0.98, 1.02, 1.00, 1.01, 1.02, 1.01, 1.00, 1.01, 1.02, 1.01, 1.01, 1.02]
    }
  };

  function buildPlan(key, cfg) {
    var n = cfg.revBudget.length, split = PLAN_SPLIT, FY = 12;   /* 全年窗口 = 12 期 */
    var revB = cfg.revBudget;
    var revA = revB.map(function (v, i) { return Math.round(v * cfg.revK[i]); });
    var costB = revB.map(function (v) { return Math.round(v * cfg.costRateB); });
    var costA = revA.map(function (v, i) { return Math.round(v * cfg.costRate[i]); });
    var expB = revB.map(function (v) { return Math.round(v * cfg.expRateB); });
    var expA = revA.map(function (v, i) { return Math.round(v * cfg.expRate[i]); });
    var proB = revB.map(function (v, i) { return v - costB[i] - expB[i]; });
    var proA = revA.map(function (v, i) { return v - costA[i] - expA[i]; });
    var qtyB = cfg.qtyBudget;
    var qtyA = qtyB.map(function (v, i) { return Math.round(v * cfg.qtyK[i] * 10) / 10; });

    /* 三段视图数组：预算（全期）/ 实际（<split）/ 预测（>=split），空档补 null 供 ECharts 断点 */
    function views(arr) {
      return {
        budget: arr.slice(),
        actual: arr.map(function (v, i) { return i < split ? v : null; }),
        forecast: arr.map(function (v, i) { return i >= split ? v : null; })
      };
    }
    function sum(a, s, e) { var t = 0; for (var i = s; i < e; i++) t += (a[i] || 0); return t; }
    function sumQ(a, s, e) { var t = 0; for (var i = s; i < e; i++) t += (a[i] || 0); return Math.round(t * 10) / 10; }
    function pct(a, b) { return b ? Math.round(a / b * 1000) / 10 : 0; }

    /* ---- 汇总：YTD（实际口径）/ 全年（预算 vs 预计）/ 未来 3 个月 ---- */
    var S = {
      months: PLAN_MONTHS, split: split, unit: cfg.unit, qtyUnit: cfg.qtyUnit,
      revenue: { budget: views(revB).budget, actual: views(revB).actual, forecast: views(revA).forecast },
      cost:    { budget: views(costB).budget, actual: views(costA).actual, forecast: views(costA).forecast },
      expense: { budget: views(expB).budget, actual: views(expA).actual, forecast: views(expA).forecast },
      profit:  { budget: views(proB).budget, actual: views(proA).actual, forecast: views(proA).forecast },
      qty:     { budget: views(qtyB).budget, actual: views(qtyB).actual, forecast: views(qtyA).forecast }
    };
    S.sum = {
      ytd: {
        revB: sum(revB, 0, split), revA: sum(revA, 0, split),
        proB: sum(proB, 0, split), proA: sum(proA, 0, split),
        qtyB: sumQ(qtyB, 0, split), qtyA: sumQ(qtyA, 0, split)
      },
      fy: {
        revB: sum(revB, 0, FY), revF: sum(revA, 0, FY),
        costB: sum(costB, 0, FY), costF: sum(costA, 0, FY),
        expB: sum(expB, 0, FY), expF: sum(expA, 0, FY),
        proB: sum(proB, 0, FY), proF: sum(proA, 0, FY),
        qtyB: sumQ(qtyB, 0, FY), qtyF: sumQ(qtyA, 0, FY)
      },
      future: {
        revB: sum(revB, split, n), revF: sum(revA, split, n),
        proB: sum(proB, split, n), proF: sum(proA, split, n)
      }
    };
    S.sum.ytd.revRate = pct(S.sum.ytd.revA, S.sum.ytd.revB);
    S.sum.ytd.qtyRate = pct(S.sum.ytd.qtyA, S.sum.ytd.qtyB);
    S.sum.fy.revRate = pct(S.sum.fy.revF, S.sum.fy.revB);
    S.sum.fy.proRate = pct(S.sum.fy.proF, S.sum.fy.proB);

    /* ---- 预警引擎：把预算对照结果翻译成管理层可读的判断 ---- */
    var y = S.sum.ytd, f = S.sum.fy, fu = S.sum.future;
    var costRateNow = cfg.costRate[n - 1], costRateB = cfg.costRateB;
    var expRateNow = cfg.expRate[n - 1];
    var beRate = Math.round((1 - expRateNow) * 1000) / 10;             /* 盈亏平衡成本率（当前费用率下，%） */
    var pad = Math.round((beRate - costRateNow * 100) * 10) / 10;      /* 安全垫 pp */
    var slope = (cfg.costRate[n - 1] - cfg.costRate[n - 4]) / 3 * 100; /* 近 3 期成本率月均斜率 pp/月 */
    var monthsToBE = slope > 0.01 ? Math.round(pad / slope * 10) / 10 : null;
    var negMonths = [];
    for (var i = split; i < n; i++) { if (proA[i] < 0) negMonths.push(PLAN_MONTHS[i]); }

    var alerts = [];
    function al(level, tag, text) { alerts.push({ level: level, tag: tag, text: text }); }

    if (y.revRate < 97) al('warn', '收入达成', '近 ' + split + ' 个月累计收入 ' + fmtW(y.revA) + ' ' + cfg.unit + '，预算达成 ' + y.revRate + '%，缺口 ' + fmtW(y.revB - y.revA) + ' ' + cfg.unit + '。');
    else al('ok', '收入达成', '近 ' + split + ' 个月累计收入 ' + fmtW(y.revA) + ' ' + cfg.unit + '，预算达成 ' + y.revRate + '%，进度正常。');

    var costDrift = Math.round((costRateNow - costRateB) * 1000) / 10;
    if (costDrift > 0.2) {
      var costOver = Math.round((costRateNow - costRateB) * y.revA);
      al('warn', '成本侵蚀', '期末成本率 ' + (costRateNow * 100).toFixed(1) + '%，高于预算 ' + costDrift + 'pp，侵蚀毛利约 ' + fmtW(costOver) + ' ' + cfg.unit + '，为利润未达预期的首要原因。');
    } else if (costDrift < -0.2) {
      al('ok', '成本优化', '期末成本率 ' + (costRateNow * 100).toFixed(1) + '%，较预算优化 ' + Math.abs(costDrift) + 'pp，降本措施见效。');
    } else {
      al('ok', '成本可控', '期末成本率 ' + (costRateNow * 100).toFixed(1) + '%，与预算基本持平。');
    }

    if (f.proF < 0) al('bad', '亏损预警', '按当前预测，全年预计经营亏损 ' + fmtW(-f.proF) + ' ' + cfg.unit + '（预算盈利 ' + fmtW(f.proB) + '），需立即启动扭亏措施。');
    else if (f.proRate >= 115) al('ok', '超预算盈利', '全年预计经营利润 ' + fmtW(f.proF) + ' ' + cfg.unit + '，超预算 ' + (f.proRate - 100) + '%，属大幅盈利上行。');
    else if (f.proRate < 90) al('warn', '利润下滑', '全年预计经营利润 ' + fmtW(f.proF) + ' ' + cfg.unit + '（预算 ' + fmtW(f.proB) + '），达成仅 ' + f.proRate + '%，缺口 ' + fmtW(f.proB - f.proF) + ' ' + cfg.unit + '。');
    else al('ok', '利润达标', '全年预计经营利润 ' + fmtW(f.proF) + ' ' + cfg.unit + '，预算达成 ' + f.proRate + '%。');

    if (negMonths.length) al('bad', '单月亏损', '预测期内 ' + negMonths.join('、') + ' 预计单月经营亏损，需重点管控。');
    else al('ok', '无亏损月', '未来 ' + (n - split) + ' 个月预测经营利润均为正，无单月亏损风险。');

    if (monthsToBE != null && pad < 30) {
      var beDate = new Date(2026, 11 + Math.ceil(monthsToBE), 1);
      al('warn', '盈亏平衡外推', '成本率按近 3 期月均 +' + slope.toFixed(2) + 'pp 斜率外推，约 ' + monthsToBE + ' 个月后（' + beDate.getFullYear() + ' 年 ' + (beDate.getMonth() + 1) + ' 月前后）触及盈亏平衡线（当前安全垫 ' + pad + 'pp），建议提前锁定降本与产品结构升级。');
    }
    if (y.qtyRate < 96) al('warn', '销量缺口', '销量年初预测达成 ' + y.qtyRate + '%（' + y.qtyA + ' / ' + y.qtyB + ' ' + cfg.qtyUnit + '），未来 3 个月滚动预测较年初预测下调 ' + Math.round((1 - fu.revF / fu.revB) * 1000) / 10 + '%。');

    S.alerts = alerts;
    S.rates = { costRateNow: costRateNow, costRateB: costRateB, expRateNow: expRateNow, expRateB: cfg.expRateB, pad: pad, monthsToBE: monthsToBE };
    return S;
  }
  function fmtW(v) { return Math.round(v).toLocaleString('zh-CN'); }

  var PLAN_CACHE = {};
  /** 取实体经营评估数据（含预算对照与预警），无配置返回 null */
  DATA.planOf = function (key) {
    if (!PLAN_CFG[key]) return null;
    if (!PLAN_CACHE[key]) PLAN_CACHE[key] = buildPlan(key, PLAN_CFG[key]);
    return PLAN_CACHE[key];
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

  /** 按类型取实体（dept / board / sub） */
  DATA.get = function (type, key) {
    if (type === 'dept') return DATA.depts[key];
    if (type === 'board') return DATA.boards[key];
    if (type === 'sub') return DATA.subs[key];
    if (type === 'plant') return DATA.plantDetail(DATA.plantIndex[key]);
    return null;
  };

  DATA.deptList = Object.keys(DATA.depts).map(function (k) { return DATA.depts[k]; });
  DATA.boardList = Object.keys(DATA.boards).map(function (k) { return DATA.boards[k]; });
  DATA.subList = Object.keys(DATA.subs).map(function (k) { return DATA.subs[k]; });

  global.FSL_DATA = DATA;
})(window);
