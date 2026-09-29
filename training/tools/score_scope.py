#!/usr/bin/env python3
"""给 SAP scope item 清单打「模块标签 + 佛照项目相关性 + 实施阶段」分。

用法：
    python3 score_scope.py                       # 处理 index.json（Public 2608）
    python3 score_scope.py index-private.json    # 处理对照清单

为什么需要它：621 条不可能全做成课程，选哪 150 条必须有客观依据，不能拍脑袋。
评分口径（写在输出 JSON 的 scoring 字段里，页面上会展示，可被质疑和修正）：
    pri = 佛照相关性(rel 0-5) × 2 + 实施阶段(stage 0-3)      => 0 ~ 13
    命中行业专属负向词（石油/航空/公用事业…）直接 rel-3，下限 0。

注意：关键词表是启发式的，一定会误判。页面提供按模块/等级筛选，
人工复核结果请回写到 data/training/sap-scope/overrides.json（该文件的
externalId -> {mod, rel} 会覆盖自动打分）。
"""

import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.abspath(os.path.join(HERE, '..', '..', 'data', 'training', 'sap-scope'))

# ---- 模块关键词表：(模块代码, 模块名, [关键词]) ----
# 顺序即主模块判定优先级（靠前的优先当主模块）
MODULES = [
    ('MD', '主数据', ['主数据', '业务伙伴', '物料主数据', '客户主数据', '供应商主数据',
                  '数据迁移', '数据治理', '数据质量', '组织单位', '公司代码']),
    ('MM', '采购与库存', ['采购', '请购', '询价', '货源', '供应商', '采购订单', '采购申请',
                     '收货', '入库', '库存', '盘点', '物料凭证', '批次', '序列号',
                     '寄售', '委外', '发票校验', '框架协议', '服务采购', '消耗', '调拨']),
    ('SD', '销售与分销', ['销售', '客户', '报价', '销售订单', '交货', '装运', '开票',
                      '订单到收款', '退货', '信用', '定价', '折扣', '渠道', '经销商',
                      '电商', '网上商城', '寄售', '返利', '索赔']),
    ('PP', '生产与计划', ['生产', '计划订单', '工艺路线', '物料清单', 'BOM', '车间',
                      '产能', '需求', 'MRP', '排产', '装配', '生产订单', '看板',
                      '重复制造', '按库存生产', '按订单生产', '生产版本', '工序']),
    ('FI', '财务会计', ['会计', '总账', '应付', '应收', '资产', '关账', '财务', '付款',
                     '银行', '现金', '税', '集团分类账', '对账', '凭证', '折旧',
                     '财务报表', '资金', '汇率', '结算', '收款',
                     '直接借记', '市场利率', '流动性', '差旅', '费用', '担保',
                     '合规', '收入确认']),
    ('CO', '成本与管理会计', ['成本', '利润', '获利能力', '内部订单', '成本中心', '分摊',
                        '边际', '产品成本', '标准成本', '实际成本', '预算', '盈利能力']),
    ('WM', '仓储与物流', ['仓储', '仓库', 'EWM', '拣配', '上架', '下架', '库位', '包装',
                      '装卸', '运输', '内向', '外向', '库存转移', '盘点']),
    ('QM', '质量管理', ['质量', '检验', '不合格', '质量通知', '检验批']),
    ('PM', '设备维护', ['设备', '维护', '检修', '技术对象', '维护工单', '保养']),
    ('AN', '分析与报表', ['分析', '报表', '仪表盘', 'KPI', '洞察', '预测', '嵌入式分析',
                      '监控', '指标']),
    ('IT', '集成与扩展', ['集成', 'API', '接口', '扩展', '连接', '中间件', '主数据集成',
                      '迁移', ' Cockpit', '配置', '输出管理', '业务事件', '生命周期',
                      '治理', '职责']),
    ('HR', '人力资源', ['人事', '员工', '时间记录', '薪酬', '招聘', '考勤', '劳动力',
                    '学习', '继任', '组织结构', '工资']),
    ('PS', '项目与服务', ['项目', '机会到订单', '解决方案订单', '服务订单', '现场服务',
                      '专业服务', '基于项目的服务', '工作分解', '研发']),
    ('SCP', '供应链计划', ['补货计划', '需求计划', '供应计划', '计划到履行', '物流计划',
                       '可承诺量', '销售与运营', '库存计划', '配送', '门店', '分销中心',
                       '集装箱', '航次']),
]

# ---- 佛照项目模块相关性权重（0-5）----
# 依据：佛照 S/4HANA Greenfield 实施范围 —— ECC 核心、经销商平台、电商报价、网上商城、WM/EWM
REL_WEIGHT = {
    'MM': 5, 'SD': 5, 'PP': 5, 'FI': 5, 'CO': 4, 'MD': 5, 'WM': 5,
    'QM': 3, 'PM': 3, 'AN': 3, 'IT': 3, 'PS': 2, 'SCP': 3, 'HR': 1, '': 0,
}

# ---- 降权规则 1：依赖第三方产品 ----
# 佛照项目未确认采购这些产品，相关 scope item 再"核心"也落不了地。
THIRD_PARTY = ['Ariba', 'Concur', 'SuccessFactors', 'BlackLine', 'Multi-Bank',
               'Field Service Management', 'Business Network', 'Datasphere',
               'Data Intelligence', 'Sales Cloud', 'Cloud for Customer',
               'Marketing Cloud', 'Integrated Business Planning', 'SAP BTP',
               'Business Technology Platform', 'SAP Analytics Cloud', 'SAC',
               'C/4HANA', 'Qualtrics', 'Fieldglass', 'Concur', 'Taulia',
               'OpenText', 'DocuSign', 'Vertex', 'Sovos']

# ---- 降权规则 2：绑定境外会计准则 / 境外本地化 ----
FOREIGN = ['IFRS', 'US GAAP', '日本', '德国', '法国', '英国', '美国', '巴西', '印度',
           '墨西哥', '俄罗斯', '沙特', '澳大利亚', '加拿大', '韩国', '意大利',
           '西班牙', '荷兰', '瑞士', '新加坡', '南非', '阿根廷', '土耳其', '波兰']

# ---- 主模块消歧：带「销售」且不带「采购」时归 SD，反之归 MM ----
def force_primary(name, mods):
    if '销售' in name and '采购' not in name and 'SD' in mods:
        return 'SD'
    if '采购' in name and '销售' not in name and 'MM' in mods:
        return 'MM'
    return mods[0] if mods else ''

# ---- 行业专属负向词：佛照是照明制造，这些行业包与项目无关 ----
NEGATIVE = ['石油', '天然气', '航空', '公用事业', '公共部门', '零售', '时尚', '保险',
            '医疗', '制药', '教育', '电信', '媒体', '体育', '农业', '采矿', '国防',
            '政府', '银行', '金融业', '油', '气田', '铁路', '船舶', '化工', '生命科学',
            '专业服务', '批发', '消费品行业', '传媒']

# ---- 实施阶段（0-3）：决定培训排期先后 ----
STAGES = [
    # 注意：不要放「配置」——「含变式配置的按订单生产」这类会被误判成基础阶段
    ('基础', 3, ['主数据', '业务伙伴', '迁移', '组织', '激活', '设置']),
    ('计划', 2, ['计划', '需求', 'MRP', '预测', '预算', '排产']),
    ('执行', 3, ['订单', '交货', '收货', '生产', '采购', '销售', '装运', '开票',
               '付款', '维护', '检验', '入库', '出库', '发货', '拣配']),
    ('核算', 2, ['成本', '关账', '总账', '资产', '对账', '获利', '折旧', '结算']),
    ('分析', 1, ['分析', '报表', '仪表盘', 'KPI', '洞察', '监控']),
]


def tag_modules(name):
    hits = [m for m, _, kws in MODULES if any(k in name for k in kws)]
    return hits


def tag_stage(name):
    best, best_w = '其他', 0
    for label, w, kws in STAGES:
        if any(k in name for k in kws) and w > best_w:
            best, best_w = label, w
    return best, best_w


def main():
    fname = sys.argv[1] if len(sys.argv) > 1 else 'index.json'
    path = os.path.join(OUT_DIR, fname)
    d = json.load(io.open(path, encoding='utf-8'))
    items = d['items']

    ov_path = os.path.join(OUT_DIR, 'overrides.json')
    overrides = {}
    if os.path.exists(ov_path):
        overrides = json.load(io.open(ov_path, encoding='utf-8'))

    for it in items:
        name = it.get('name') or ''
        mods = tag_modules(name)
        ov = overrides.get(it.get('externalId') or '', {})
        if ov.get('mod'):
            mods = [ov['mod']] + [m for m in mods if m != ov['mod']]
        primary = force_primary(name, mods) if mods else ''
        stage, sw = tag_stage(name)

        flags = []
        rel = ov.get('rel')
        if rel is None:
            rel = REL_WEIGHT.get(primary, 2 if primary else 0)
            if any(k in name for k in NEGATIVE):
                rel = max(0, rel - 3)
                flags.append('非目标行业')
            if any(k in name for k in THIRD_PARTY):
                rel = min(rel, 2)          # 依赖第三方产品：佛照未必有 license
                flags.append('依赖第三方产品')
            if any(k in name for k in FOREIGN):
                rel = min(rel, 1)          # 境外准则/本地化：中国用不上
                flags.append('境外准则/本地化')
        it['flags'] = flags
        pri = rel * 2 + sw

        it['mod'] = primary
        it['mods'] = mods
        it['stage'] = stage
        it['rel'] = rel
        it['pri'] = pri
        it['tier'] = 'A' if pri >= 13 else 'B' if pri >= 10 else 'C' if pri >= 6 else 'D'
        if it.get('setUpInstructions') == 'Yes':
            it['flags'].append('需配置')

    # ---- 与已有课程打通：把 scope item 编号映射到本站课程 id ----
    # 新增课程后重跑本脚本即可刷新映射，不用手改页面。
    course_map = {}
    cp = os.path.join(HERE, '..', 'courses.json')
    if os.path.exists(cp):
        cat = json.load(io.open(cp, encoding='utf-8'))
        for c in cat.get('courses', []):
            code = None
            cid = c.get('id') or ''
            if cid.startswith('bp-') and cid.endswith('-overlay'):
                code = cid[3:-8].upper()          # bp-j45-overlay -> J45
            if code:
                course_map[code] = cid
    course_map['54U'] = 'bp-mfg-overlay'           # 54U 界面前缀用 mfg-，自动推导不出来
    # 只保留清单里真实存在的编号（bp-mfg-overlay 会推出一个并不存在的 MFG）
    known = {it.get('externalId') for it in items}
    course_map = {k: v for k, v in course_map.items() if k in known}
    d['course_map'] = course_map

    counts = {}
    for it in items:
        counts[it['tier']] = counts.get(it['tier'], 0) + 1
    mod_counts = {}
    for it in items:
        mod_counts[it['mod'] or '未分类'] = mod_counts.get(it['mod'] or '未分类', 0) + 1

    d['scoring'] = {
        'formula': 'pri = 相关性(rel 0-5) × 2 + 实施阶段(0-3)',
        'rel_note': '模块权重按佛照 S/4HANA Greenfield 实施范围设定（MM/SD/PP/FI/MD/WM=5，CO=4，QM/PM/AN/IT=3，HR=1）；命中行业专属词 -3',
        'tier': {'A': '≥13 第 1 层候选（模块相关 + 可执行 + 无第三方/境外依赖）',
                 'B': '10-12 次优先', 'C': '6-9 备查', 'D': '≤5 暂不纳入'},
        'counts': counts,
        'mod_counts': dict(sorted(mod_counts.items(), key=lambda kv: -kv[1])),
    }
    # 同级内按实施阶段排序（基础 → 计划 → 执行 → 核算 → 分析），同阶段按编号
    stage_order = {'基础': 0, '计划': 1, '执行': 2, '核算': 3, '分析': 4, '其他': 5}
    d['items'] = sorted(items, key=lambda x: (-x['pri'],
                                              stage_order.get(x['stage'], 5),
                                              x.get('externalId') or ''))

    json.dump(d, io.open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('[score] %s: %d 条' % (fname, len(items)))
    print('[score] 等级分布:', counts)
    print('[score] 模块分布:', d['scoring']['mod_counts'])


if __name__ == '__main__':
    main()
