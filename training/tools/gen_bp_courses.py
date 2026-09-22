# -*- coding: utf-8 -*-
"""按 SAP Best Practices scope item 批量生成界面定义 + 引导课程。
用法：python3 gen_bp_courses.py
新增 scope item 时只需往 SCREENS / COURSES 里加数据。
"""
import json, io, os, datetime

TODAY = datetime.date.today().isoformat()

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SCR = os.path.join(ROOT, 'screens')
COU = os.path.join(ROOT, 'courses')

SCREENS = {}

SCREENS['bp-j45'] = {
  "schema": "fsl-training-screen/1.0",
  "id": "bp-j45",
  "title": "SAP BP J45 · 直接物料采购（申请转订单）",
  "erp": "sap",
  "tcode": "ME21N / MIGO",
  "scopeItem": "J45",
  "blocks": [
    {"type": "apps", "items": [
      {"id": "j45-app-pr", "label": "处理采购申请"},
      {"label": "创建采购订单"},
      {"label": "收货过账"},
      {"label": "监控库存报表"}
    ]},
    {"type": "fields", "title": "采购申请（PR）", "items": [
      {"id": "j45-pr-no", "label": "采购申请编号", "ph": "通常由 MRP 运行自动生成，如 10001234"},
      {"id": "j45-pr-type", "label": "申请类型", "options": ["NB 标准采购申请", "FO 框架协议申请", "UB 库存转储申请"]},
      {"id": "j45-material", "label": "物料", "ph": "MAT-LED-001"},
      {"id": "j45-qty", "label": "申请数量", "ph": "500"},
      {"id": "j45-date", "label": "需求日期", "ph": "决定 MRP 的补货到货时点"}
    ]},
    {"type": "fields", "title": "货源与价格", "items": [
      {"id": "j45-source", "label": "固定货源 / 供应商", "ph": "100023"},
      {"id": "j45-inforecord", "label": "采购信息记录", "ph": "决定净价与有效期，缺失时系统取上次采购价"},
      {"id": "j45-price", "label": "净价", "ph": "29.50"}
    ]},
    {"type": "table", "id": "j45-grid", "title": "待处理申请清单",
     "columns": ["申请号", "物料", "需求数量", "需求日期", "货源状态"],
     "rows": [["10001234", "MAT-LED-001", "500", "2026-10-15", "已分配"],
              ["10001235", "MAT-DRV-002", "120", "2026-10-22", "未分配"]]},
    {"type": "actions", "items": [
      {"id": "j45-convert", "label": "转换为采购订单", "primary": True},
      {"id": "j45-save", "label": "保存"},
      {"label": "取消"}
    ]},
    {"type": "note", "text": "Best Practices scope item J45（Procurement of Direct Materials）。此为仿真训练界面，流程：MRP 生成采购申请 → 分配货源 → 转采购订单 → 收货 → 发票校验。"}
  ]
}

SCREENS['bp-bd9'] = {
  "schema": "fsl-training-screen/1.0",
  "id": "bp-bd9",
  "title": "SAP BP BD9 · 按库存销售（订单到开票）",
  "erp": "sap",
  "tcode": "VA01 / VL01N / VF01",
  "scopeItem": "BD9",
  "blocks": [
    {"type": "apps", "items": [
      {"id": "bd9-app-so", "label": "创建销售订单"},
      {"label": "交货处理"},
      {"label": "开票到期清单"},
      {"label": "凭证流查询"}
    ]},
    {"type": "fields", "title": "订单抬头", "items": [
      {"id": "bd9-ordertype", "label": "订单类型", "options": ["OR 标准订单", "RE 退货订单", "CR 贷项凭单"]},
      {"id": "bd9-soldto", "label": "售达方", "ph": "100012"},
      {"id": "bd9-reqdate", "label": "请求交货日期", "ph": "ATP 可用性检查的基准日期"}
    ]},
    {"type": "fields", "title": "交货与开票", "items": [
      {"id": "bd9-shippoint", "label": "装运点", "ph": "决定交货单的拣配路径"},
      {"id": "bd9-dlvqty", "label": "交货数量", "ph": "可少于订单数量，剩余部分转为欠交"},
      {"id": "bd9-billbase", "label": "开票基准", "options": ["按交货数量", "按订单数量", "按服务条目"]}
    ]},
    {"type": "table", "id": "bd9-flow", "title": "凭证流",
     "columns": ["凭证", "类型", "数量", "状态"],
     "rows": [["—", "销售订单", "100", "待创建"],
              ["—", "交货单", "—", "未处理"],
              ["—", "开票凭证", "—", "未处理"]]},
    {"type": "actions", "items": [
      {"id": "bd9-check", "label": "可用性检查"},
      {"id": "bd9-save", "label": "保存订单", "primary": True},
      {"id": "bd9-invoice", "label": "开票"}
    ]},
    {"type": "note", "text": "Best Practices scope item BD9（Sell from Stock）。此为仿真训练界面，覆盖订单 → 交货 → 开票的 SD 完整凭证流。"}
  ]
}

SCREENS['bp-54u'] = {
  "schema": "fsl-training-screen/1.0",
  "id": "bp-54u",
  "title": "SAP BP 54U · 按库存生产（离散制造）",
  "erp": "sap",
  "tcode": "MD04 / CO41 / CO02 / CO11N",
  "scopeItem": "54U",
  "blocks": [
    {"type": "apps", "items": [
      {"id": "mfg-app-stock", "label": "监控库存需求"},
      {"label": "计划订单转换"},
      {"label": "生产订单处理"},
      {"label": "报工确认"}
    ]},
    {"type": "fields", "title": "计划订单", "items": [
      {"id": "mfg-planorder", "label": "计划订单号", "ph": "由 MRP 依据需求自动生成，如 0000123456"},
      {"id": "mfg-fgmaterial", "label": "成品物料", "ph": "MAT-LED-600"},
      {"id": "mfg-plqty", "label": "计划数量", "ph": "1000"},
      {"id": "mfg-startdate", "label": "订单开始日期", "ph": "由工艺路线的提前期倒推"}
    ]},
    {"type": "fields", "title": "生产订单抬头", "items": [
      {"id": "mfg-prodversion", "label": "生产版本", "options": ["0001 主线量产", "0002 返工工艺"]},
      {"id": "mfg-plant", "label": "计划工厂", "ph": "1000"},
      {"id": "mfg-stloc", "label": "库存地点", "ph": "成品入库地点，如 0002"}
    ]},
    {"type": "table", "id": "mfg-comp", "title": "组件清单（BOM）",
     "columns": ["组件", "描述", "需求数量", "库存地点", "反冲"],
     "rows": [["MAT-LED-CHIP", "LED 灯珠", "4000", "0001", "是"],
              ["MAT-DRV-002", "恒流驱动器", "1000", "0001", "是"],
              ["MAT-ALU-FRM", "铝制边框", "1000", "0001", "否"]]},
    {"type": "actions", "items": [
      {"id": "mfg-convert", "label": "转换为生产订单", "primary": True},
      {"id": "mfg-release", "label": "下达"},
      {"id": "mfg-confirm", "label": "报工确认"}
    ]},
    {"type": "note", "text": "Best Practices scope item 54U（Produce and Sell Standard Products - Inventory Management）。此为仿真训练界面，覆盖需求 → 计划订单 → 生产订单 → 下达 → 报工 → 成品入库。"}
  ]
}

SCREENS['bp-j60'] = {
  "schema": "fsl-training-screen/1.0",
  "id": "bp-j60",
  "title": "SAP BP J60 · 应付账款（发票到付款）",
  "erp": "sap",
  "tcode": "FB60 / F110 / FBL1N",
  "scopeItem": "J60",
  "blocks": [
    {"type": "apps", "items": [
      {"id": "j60-app-item", "label": "供应商行项目"},
      {"label": "输入供应商发票"},
      {"label": "付款运行"},
      {"label": "银行对账单"}
    ]},
    {"type": "fields", "title": "发票信息", "items": [
      {"id": "j60-supplier", "label": "供应商", "ph": "100023"},
      {"id": "j60-docdate", "label": "凭证日期", "ph": "决定该笔费用所属会计期间"},
      {"id": "j60-ref", "label": "参照 / 发票号", "ph": "INV-2026-08812"},
      {"id": "j60-amount", "label": "金额", "ph": "14750.00"},
      {"id": "j60-taxcode", "label": "税码", "options": ["J1 进项税 13%", "J0 零税率", "J2 进项税 6%"]}
    ]},
    {"type": "fields", "title": "付款条件", "items": [
      {"id": "j60-payterm", "label": "付款条件", "options": ["0001 14天内 2% 折扣", "0002 30天到期", "0004 立即到期"]},
      {"id": "j60-baseline", "label": "基准日期", "ph": "现金折扣从该日起算"},
      {"id": "j60-duedate", "label": "到期日", "ph": "由付款条件 + 基准日期推算"}
    ]},
    {"type": "table", "id": "j60-open", "title": "未清应付明细",
     "columns": ["凭证号", "凭证类型", "到期日", "金额", "现金折扣", "状态"],
     "rows": [["5100000123", "KR 供应商发票", "2026-10-08", "14750.00", "295.00", "未清"],
              ["5100000118", "KR 供应商发票", "2026-09-28", "8200.00", "0.00", "未清"],
              ["—", "ZP 付款", "—", "-5400.00", "—", "已清"]]},
    {"type": "actions", "items": [
      {"id": "j60-simulate", "label": "模拟凭证", "primary": True},
      {"id": "j60-post", "label": "过账"},
      {"id": "j60-paymentrun", "label": "计划付款运行"}
    ]},
    {"type": "note", "text": "Best Practices scope item J60（Accounts Payable）。注意与 MIRO 的区别：MIRO 是物流侧的三单匹配（含收货凭证），J60 处理财务侧的应付管理、到期分析与付款清账，也可直接录入非采购类供应商发票。"}
  ]
}

SCREENS['bp-jb1'] = {
  "schema": "fsl-training-screen/1.0",
  "id": "bp-jb1",
  "title": "SAP BP JB1 · 核心人事与时间记录（EC 集成）",
  "erp": "sap",
  "tcode": "Employee Central / S/4HANA Cloud",
  "scopeItem": "JB1",
  "blocks": [
    {"type": "apps", "items": [
      {"id": "jb1-app-emp", "label": "员工主数据"},
      {"label": "组织分配"},
      {"label": "时间记录"},
      {"label": "集成监控"}
    ]},
    {"type": "fields", "title": "员工信息", "items": [
      {"id": "jb1-empno", "label": "员工编号", "ph": "8 位数字，如 10001234"},
      {"id": "jb1-name", "label": "姓名", "ph": "张敏"},
      {"id": "jb1-hiredate", "label": "雇佣日期", "ph": "决定年假折算与试用期起算"},
      {"id": "jb1-company", "label": "公司代码", "ph": "1000"}
    ]},
    {"type": "fields", "title": "组织分配", "items": [
      {"id": "jb1-orgunit", "label": "组织单位", "options": ["50001234 生产部", "50001235 财务部", "50001236 销售部"]},
      {"id": "jb1-position", "label": "岗位", "ph": "决定审批流与权限角色"},
      {"id": "jb1-costcenter", "label": "成本中心", "ph": "人工费用的过账去向，如 CC-PROD-001"},
      {"id": "jb1-manager", "label": "直属经理", "ph": "请假与加班的审批人"}
    ]},
    {"type": "fields", "title": "时间记录", "items": [
      {"id": "jb1-timetype", "label": "记录类型", "options": ["出勤", "法定缺勤", "病假", "加班"]},
      {"id": "jb1-date", "label": "日期", "ph": "2026-09-22"},
      {"id": "jb1-hours", "label": "小时数", "ph": "8.0"}
    ]},
    {"type": "table", "id": "jb1-queue", "title": "集成凭证队列（EC → S/4）",
     "columns": ["员工编号", "对象", "方向", "状态", "时间戳"],
     "rows": [["10001234", "EmployeeMasterData", "EC → S/4", "成功", "2026-09-22 09:12"],
              ["10001234", "TimeRecording", "EC → S/4", "处理中", "2026-09-22 09:15"],
              ["10001235", "CostCenterAssignment", "S/4 → EC", "成功", "2026-09-22 08:40"]]},
    {"type": "actions", "items": [
      {"id": "jb1-save", "label": "保存", "primary": True},
      {"id": "jb1-submit", "label": "提交审批"},
      {"id": "jb1-sync", "label": "触发集成"}
    ]},
    {"type": "note", "text": "Best Practices scope item JB1（Employee Integration - Employee Central Integration）。员工主数据以 SuccessFactors Employee Central 为主数据源单向同步至 S/4HANA，成本中心等组织对象可反向回写。此为仿真训练界面。"}
  ]
}


COURSES = {}

COURSES['bp-j45-overlay'] = {
  "schema": "fsl-training-course/1.0",
  "id": "bp-j45-overlay",
  "title": "SAP Best Practices J45 · 直接物料采购（申请转订单）",
  "type": "overlay",
  "erp": "sap",
  "scopeItem": "J45",
  "stage": "stage/screen.html?screen=bp-j45",
  "duration": "约 9 分钟",
  "desc": "对应 SAP Best Practices scope item J45：MRP 生成的采购需求如何变成一张正式采购订单。重点讲清「没有货源就无法转换」这一最常见卡点。",
  "steps": [
    {"el": "#j45-pr-no", "bus": "testId=pr-number",
     "title": "认识采购申请从哪来",
     "desc": "库存物料的需求通常由 MRP 运行自动生成采购申请，也可以手工创建。此处要确认申请的来源：MRP 生成的申请通常已带货源建议，手工创建的往往需要自己找供应商。"},
    {"el": "#j45-pr-type", "bus": "label=申请类型",
     "title": "确认申请类型",
     "desc": "NB 是标准采购申请，FO 对应框架协议（已有长期合同时用），UB 是库存转储。类型选错会导致后续无法转成期望的凭证类型，例如 UB 走的是转储单而非采购订单。"},
    {"el": "#j45-material", "bus": "testId=material",
     "title": "核对物料与需求数量",
     "desc": "物料必须有「采购视图」，否则系统会提示物料不适用于采购。注意申请数量单位——MRP 用的是基本计量单位，而采购常用采购订单单位，两者不一致时会按换算率折算。"},
    {"el": "#j45-source", "bus": "testId=source-of-supply",
     "title": "分配货源（最容易卡住的一步）",
     "desc": "转换为采购订单的前提是存在已分配的货源：可以是信息记录、框架协议或固定供应商。没有货源时「转换」按钮会报错或无响应——这是新手最常遇到的问题，处理办法是先维护货源再回来转换。"},
    {"el": "#j45-price", "bus": "testId=net-price",
     "title": "核对净价来源",
     "desc": "净价优先取自有效期的采购信息记录或框架协议条件；都没有时系统会取「上次采购价」作为建议值。此时务必人工确认，历史价格过期会直接造成成本偏差。"},
    {"el": "#j45-grid", "bus": "label=待处理申请清单",
     "title": "看懂待处理清单",
     "desc": "清单把可成批处理的申请打包：同币种、同采购组、供应商可合并的申请能一次性转成一或多张订单。这里逐行确认「货源状态」列，未分配的行先处理货源。"},
    {"el": "#j45-convert", "bus": "text=转换为采购订单",
     "title": "转换为采购订单",
     "desc": "转换后生成正式采购订单号，这一步意味着对外承诺成立。采购申请本身不产生会计凭证，采购订单也不产生会计凭证（只有承诺消耗），真正的价值更新发生在收货（MIGO）时。"}
  ],
  "updated_at": "2026-09-22"
}

COURSES['bp-bd9-overlay'] = {
  "schema": "fsl-training-course/1.0",
  "id": "bp-bd9-overlay",
  "title": "SAP Best Practices BD9 · 按库存销售（订单到开票）",
  "type": "overlay",
  "erp": "sap",
  "scopeItem": "BD9",
  "stage": "stage/screen.html?screen=bp-bd9",
  "duration": "约 10 分钟",
  "desc": "对应 SAP Best Practices scope item BD9：从销售订单到交货、开票的完整凭证流。重点讲清每一步触发了哪些库存与财务影响。",
  "steps": [
    {"el": "#bd9-ordertype", "bus": "label=订单类型",
     "title": "选择订单类型",
     "desc": "订单类型决定了整个后续流程：OR 走标准发货开票，RE 退货会触发收货与贷项，CR 贷项凭单直接冲收入。类型一旦保存基本不可改，只能整单作废重录。"},
    {"el": "#bd9-soldto", "bus": "testId=sold-to-party",
     "title": "录入售达方",
     "desc": "售达方与客户主数据的「销售区域」视图组合后，自动带出定价过程、装运条件、付款条件与合作伙伴（送达方、开票方）。如果提示「未维护销售视图」，说明该客户还没在这个销售组织下扩展。"},
    {"el": "#bd9-reqdate", "bus": "testId=requested-delivery-date",
     "title": "确认请求交货日期",
     "desc": "这个日期是可用性检查（ATP）的基准。日期倒推要覆盖拣配、包装、运输的提前期；给客户承诺前先做 ATP，否则到了交货环节才发现缺料，只能欠交或改期。"},
    {"el": "#bd9-check", "bus": "text=可用性检查",
     "title": "做可用性检查（ATP）",
     "desc": "系统按可用量 = 库存 + 计划收货 − 已承诺需求 计算，返回确认数量与确认日期。缺料时的处理路径有三条：换替代物料、调整交货日期、触发生产或采购补足。切忌直接忽略确认结果。"},
    {"el": "#bd9-save", "bus": "text=保存订单",
     "title": "保存生成销售订单号",
     "desc": "保存后产生订单凭证。销售订单会占用需求（即需求冲销 available stock），但不产生金额上的会计凭证——因为它还没有实物流转，收入此时不能确认。"},
    {"el": "#bd9-dlvqty", "bus": "testId=delivery-quantity",
     "title": "交货：拣配与发货过账",
     "desc": "交货数量可以少于订单数量，差额转为欠交订单（backorder）。真正做发货过账这一步时，库存数量减少、同时结转销售成本（COGS）——很多学员以为收入在此时确认，其实不是，收入要到开票环节。"},
    {"el": "#bd9-invoice", "bus": "text=开票",
     "title": "开票：收入确认",
     "desc": "通过开票到期清单生成开票凭证后，系统才会确认收入并生成会计分录：借应收账款、贷主营业务收入、贷销项税。至此 SD 流程完结，凭证流里订单 → 交货 → 开票三者互相关联，可逐层追溯。"}
  ],
  "updated_at": "2026-09-22"
}

COURSES['bp-mfg-overlay'] = {
  "schema": "fsl-training-course/1.0",
  "id": "bp-mfg-overlay",
  "title": "SAP Best Practices 54U · 按库存生产（离散制造）",
  "type": "overlay",
  "erp": "sap",
  "scopeItem": "54U",
  "stage": "stage/screen.html?screen=bp-54u",
  "duration": "约 10 分钟",
  "desc": "对应 SAP Best Practices scope item 54U：按库存生产的离散制造流程。重点讲清计划订单与生产订单的区别，以及下达这一步为什么不可跳过。",
  "steps": [
    {"el": "#mfg-planorder", "bus": "testId=planned-order",
     "title": "认识计划订单（内部计划工具）",
     "desc": "计划订单是 MRP 依据需求（销售订单、预测、安全库存）自动生成的内部计划元素，可以随时被 MRP 覆盖或删除——它只是「打算生产」的凭证，不能用于车间执行。"},
    {"el": "#mfg-prodversion", "bus": "label=生产版本",
     "title": "确认生产版本",
     "desc": "生产版本把 BOM 和工艺路线绑定在一起，决定用哪套配方、哪条产线。同一成品可能有量产版本和返工版本，选错会导致组件清单和工时都跟着错。"},
    {"el": "#mfg-comp", "bus": "label=组件清单",
     "title": "检查组件可用性",
     "desc": "组件能否齐套直接决定订单能否顺利执行。注意「反冲」标识：反冲组件在报工时自动扣料，非反冲组件必须手工领料，漏做会造成组件实际用量与账面不符。"},
    {"el": "#mfg-convert", "bus": "text=转换为生产订单",
     "title": "转换为生产订单",
     "desc": "这是从「计划」走向「执行」的分界线。转换后 ODIN 编码正式生成，ERP 才真正承诺这批生产任务，并锁定组件预留与产能。"},
    {"el": "#mfg-release", "bus": "text=下达",
     "title": "下达生产订单",
     "desc": "未下达的订单车间不能领料、不能报工，这是生产现场最常见的「为什么做不了」。下达动作会激活预留、打印车间单据、按工序释放产能。"},
    {"el": "#mfg-confirm", "bus": "text=报工确认",
     "title": "报工确认（工时与自动扣料）",
     "desc": "报工把实际工时记入订单成本，同时反冲消耗组件库存。报工数据不及时，成本会计拿不到真实人工与材料消耗，订单成本差异就会失真。"},
    {"el": "#mfg-stloc", "bus": "testId=storage-location",
     "title": "成品入库与成本结算",
     "desc": "收货到成品库存地点后库存增加，月末做在产品（WIP）与差异结算。至此「按库存生产」闭环：需求触发计划 → 计划转执行 → 消耗材料与工时 → 成品入库 → 成本结转。"}
  ],
  "updated_at": "2026-09-22"
}

COURSES['bp-j60-overlay'] = {
  "schema": "fsl-training-course/1.0",
  "id": "bp-j60-overlay",
  "title": "SAP Best Practices J60 · 应付账款（发票到付款）",
  "type": "overlay",
  "erp": "sap",
  "scopeItem": "J60",
  "stage": "stage/screen.html?screen=bp-j60",
  "duration": "约 9 分钟",
  "desc": "对应 SAP Best Practices scope item J60：供应商发票入账、到期分析与付款清账。讲清它与 MIRO（物流侧发票校验）的分工边界。",
  "steps": [
    {"el": "#j60-supplier", "bus": "testId=supplier",
     "title": "确认供应商主数据",
     "desc": "注意「统驭科目」：供应商在总账里通过统驭科目反映，明细在 AP 子账。供应商主数据若被冻结或缺失公司代码视图，发票无法入账。"},
    {"el": "#j60-docdate", "bus": "testId=document-date",
     "title": "凭证日期决定会计期间",
     "desc": "凭证日期落入哪个期间，费用就记在哪个月——这是月末关账最容易出争议的地方。过账期间由系统按日期自动确定，跨期入账需要开前期账（Open/Close Posting Period）。"},
    {"el": "#j60-taxcode", "bus": "label=税码",
     "title": "选择税码（影响进项抵扣）",
     "desc": "税码决定进项税能否抵扣。J1 对应 13% 进项税率，选 J0（零税率）将无法抵扣，直接造成多缴；免税/简易计税业务不能混用普通税码，否则税务申报数据失准。"},
    {"el": "#j60-simulate", "bus": "text=模拟凭证",
     "title": "养成「先模拟后过账」的习惯",
     "desc": "模拟会显示完整借贷分录但不更新账。财务岗的操作纪律是：任何凭证先看模拟的行项目是否等于预期（借什么费用科目、贷什么统驭科目），确认无误再过账。"},
    {"el": "#j60-post", "bus": "text=过账",
     "title": "过账生成应付余额",
     "desc": "过账后形成未清应付项，同时在总账更新相应科目。此时并未付钱，只是确认负债。注意区分：MIRO 输入的发票带采购订单参照（做三单匹配），FB60 可直接录入非采购类费用发票。"},
    {"el": "#j60-open", "bus": "label=未清应付明细",
     "title": "到期分析（决定付钱顺序）",
     "desc": "行项目报表按到期日排列未清项，用于资金计划。关注两个指标：现金折扣到期日与 DPO（应付账款周转天数）。忽视现金折扣等于白白损失年化收益。"},
    {"el": "#j60-paymentrun", "bus": "text=计划付款运行",
     "title": "付款运行与清账",
     "desc": "付款运行（F110）按条件自动选择到期发票、生成付款凭证并清账未清项。重要：清账才是「负债消失」的时刻，很多初学者以为过账就代表付款完成。"}
  ],
  "updated_at": "2026-09-22"
}

COURSES['bp-jb1-overlay'] = {
  "schema": "fsl-training-course/1.0",
  "id": "bp-jb1-overlay",
  "title": "SAP Best Practices JB1 · 核心人事与时间记录（EC 集成）",
  "type": "overlay",
  "erp": "sap",
  "scopeItem": "JB1",
  "stage": "stage/screen.html?screen=bp-jb1",
  "duration": "约 8 分钟",
  "desc": "对应 SAP Best Practices scope item JB1：SuccessFactors Employee Central 与 S/4HANA 的核心人事集成。重点讲清谁是主数据源，以及集成失败该怎么看。",
  "steps": [
    {"el": "#jb1-empno", "bus": "testId=person-id-external",
     "title": "员工编号规则",
     "desc": "外部人员编号在 Employee Central 生成并同步到 S/4HANA，是整个跨系统链路的唯一键。编号不一致时，集成会当作两个不同的人，导致主数据与工资核算错位。"},
    {"el": "#jb1-hiredate", "bus": "testId=hire-date",
     "title": "雇佣日期的业务影响",
     "desc": "雇佣日期决定入职当年年假的折算比例、试用期起算与社保缴纳起始。日期改动会触发回溯计算，属于必须谨慎修改的核心人事字段。"},
    {"el": "#jb1-orgunit", "bus": "label=组织单位",
     "title": "组织分配决定审批路径",
     "desc": "员工挂在哪个组织单位、担任何岗位，系统会据此推导审批人层级。组织调整（调岗/调动）要确认新组织单位的审批流是否已配置，否则请假和加班单据会卡死在无审批人状态。"},
    {"el": "#jb1-costcenter", "bus": "testId=cost-center",
     "title": "成本中心决定人工费用去向",
     "desc": "人工成本的核算与分摊全部落到成本中心。未维护或填错，员工工资费用会记到默认兜底成本中心，导致部门利润表失真且事后追溯成本高。"},
    {"el": "#jb1-timetype", "bus": "label=记录类型",
     "title": "时间记录的类型与审批",
     "desc": "出勤、法定缺勤、病假、加班各自走不同的核算规则并影响工资结果。尤其是病假与加班，通常需要主管审批并附带证明材料，未经审批的时间记录不会计入工资核算。"},
    {"el": "#jb1-hours", "bus": "testId=recorded-hours",
     "title": "小时数与时薪/月薪换算",
     "desc": "计时员工按记录小时数直接计薪，月薪员工的时间记录主要用于缺勤扣款与加班补偿的校验。录入超长工时通常会被工资核算规则拦截，先确认是否漏填或重复。  "},
    {"el": "#jb1-queue", "bus": "label=集成凭证队列",
     "title": "集成失败从哪里看",
     "desc": "JB1 的核心就是这个队列：员工主数据以 Employee Central 为主数据源单向同步，成本中心等部分对象可反向回写。出现「处理中」长期不转「成功」，或状态为错误时，先查队列里的对象类型与时间戳，再决定重发还是修数据——不要直接手工改 S/4 侧的主数据。"}
  ],
  "updated_at": "2026-09-22"
}


def dump(path, obj):
    with io.open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.write('\n')


# 1) 写界面与课程文件
# 先清掉本脚本上一轮产物中已不存在的 bp-* 文件（改前缀 / 改名后不留孤儿）
for d, keep, ext in ((SCR, set(SCREENS), '.json'), (COU, set(COURSES), '.json')):
    for fn in os.listdir(d):
        if fn.startswith('bp-') and fn.endswith(ext) and fn[:-len(ext)] not in keep:
            os.remove(os.path.join(d, fn))
            print('removed stale file:', d.rsplit('/', 1)[-1] + '/' + fn)
for sid, obj in SCREENS.items():
    dump(os.path.join(SCR, sid + '.json'), obj)
for cid, obj in COURSES.items():
    dump(os.path.join(COU, cid + '.json'), obj)
print('screens written:', len(SCREENS), 'courses written:', len(COURSES))

# 2) 更新 screens/index.json
ip = os.path.join(SCR, 'index.json')
idx = json.load(io.open(ip, encoding='utf-8'))
idx['updated_at'] = TODAY
have = {s['id'] for s in idx['screens']}
meta = {'bp-j45': 'SAP BP J45 · 直接物料采购', 'bp-bd9': 'SAP BP BD9 · 按库存销售',
        'bp-54u': 'SAP BP 54U · 按库存生产', 'bp-j60': 'SAP BP J60 · 应付账款',
        'bp-jb1': 'SAP BP JB1 · 核心人事与时间记录'}
for sid in SCREENS:
    if sid not in have:
        idx['screens'].append({
            "id": sid, "title": meta[sid], "erp": "sap",
            "scopeItem": SCREENS[sid]['scopeItem'],
            "url": "stage/screen.html?screen=" + sid
        })
dump(ip, idx)
print('screens/index.json ->', len(idx['screens']), 'screens')

# 3) 更新 courses.json
cp = os.path.join(ROOT, 'courses.json')
cat = json.load(io.open(cp, encoding='utf-8'))
cat['updated_at'] = TODAY
# 清理上一轮留下的失效 bp-* 条目（如改前缀后的孤儿 bp-54u-overlay）
want = set(COURSES)
before = len(cat['courses'])
cat['courses'] = [c for c in cat['courses']
                  if not (c['id'].startswith('bp-') and c['id'] not in want)]
print('pruned stale bp-* catalog entries:', before - len(cat['courses']))
have_c = {c['id'] for c in cat['courses']}
for cid, obj in COURSES.items():
    if cid in have_c:
        continue
    cat['courses'].append({
        "id": cid,
        "title": obj['title'],
        "type": "overlay",
        "erp": "sap",
        "scopeItem": obj['scopeItem'],
        "overlay": obj['stage'],
        "steps": len(obj['steps']),
        "duration": obj['duration'],
        "desc": obj['desc']
    })
dump(cp, cat)
print('courses.json ->', len(cat['courses']), 'courses')
