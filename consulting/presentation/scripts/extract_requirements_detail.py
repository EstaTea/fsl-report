#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
提取腾讯文档「需求总库」(eAHMLRIYXXeO / 000001) 的真实 701 条需求，
逐行展开为 requirements-detail.json（含分期 / TOGAF 4A / 高价值场景 / 处理意见），
供附录「701 条需求完整明细」页消费。

派生字段权威来源：sankey_v4.html（三层追溯桑基图：需求域 → TOGAF 4A → 高价值场景）。
  - 实施阶段(phase_label)：来自需求总库「项目范围界定」列（本期/二期/三期/非本期）。
  - TOGAF 4A / 高价值场景(snn)：由「所属专题」经 sankey 映射推导（标注为推导值）。
  - 顾问处理意见(opinion)：需求总库原始字段实录。

调用 tencentdocs.py（腾讯文档 skill 提供的纯标准库入口），
票据由宿主环境变量 TDOC_OAUTH_ACCESS_TOKEN 注入（本地 / Action 均需可用）。

运行：python3 extract_requirements_detail.py [--out requirements-detail.json]
"""
import subprocess
import json
import csv
import io
import sys
import os
import datetime
from collections import Counter

TDOC = "/Users/I523899/.workbuddy/plugins/cache/workbuddy-builtin/tencent-docs-plugin/5.5.1-wb.37570276.g9af62480.hde0fbd244c72/skills/tencent-docs/tencentdocs.py"

FILE_ID = "eAHMLRIYXXeO"
SHEET_ID = "000001"
# 列索引（0-based，依据 000001 表头）
COL = {
    "req_id": 0,
    "summary": 2,        # 需求简述
    "priority_std": 3,   # 优先级_标准
    "q_type": 6,         # 问题类型
    "topic": 7,          # 所属专题
    "func_domain": 8,    # 需求类型（功能域）
    "dept": 10,          # 提出部门
    "category": 16,      # 问题分类
    "scope": 18,         # 项目范围界定
    "system_owner": 19,  # 系统归属
    "sap_module": 20,    # SAP模块
    "consultant": 23,    # 顾问(姓名)
    "opinion": 24,       # 顾问处理意见
    "detail": 25,        # 需求详细说明
    "meeting_detail": 26,# 会议详情(AA列)
    "priority": 27,      # 优先级
}
MAX_COL = 28  # 0..27 一次性拉取（701×28≈19628 < 20000 上限）


# ── emoji 清洗（与佛照交付物禁用规则一致：U+1F000–1FAFF / 2600–27BF / 2B00–2BFF /
#    2300–23FF / 25A0–25FF / FE00–FE0F，保留排版箭头 2190–2193）──
def _is_emoji(cp):
    return (0x1F000 <= cp <= 0x1FAFF or 0x2600 <= cp <= 0x27BF or
            0x2B00 <= cp <= 0x2BFF or 0x2300 <= cp <= 0x23FF or
            0x25A0 <= cp <= 0x25FF or 0xFE00 <= cp <= 0xFE0F)

def clean(s):
    if not s:
        return s
    s = s.replace("（未填写）", "未填写").replace("（空白）", "空白")
    out = []
    for ch in s:
        cp = ord(ch)
        if _is_emoji(cp) and cp not in (0x2190, 0x2191, 0x2192, 0x2193):
            continue
        out.append(ch)
    return "".join(out).strip()

def norm_priority(v):
    v = clean(v)
    for key in ("高", "中", "低", "待定"):
        if v.startswith(key):
            return key
    if v in ("", "（未填写）", "未填写"):
        return "未填写"
    return v


def call_tdoc(service, tool, args):
    cmd = ["python3", TDOC, "tdoc_call", service, tool, json.dumps(args)]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if r.returncode != 0:
        raise RuntimeError(f"tdoc_call failed: {r.stderr[:300]}")
    out = json.loads(r.stdout)
    return out["result"]["content"][0]["text"]

def pull_csv(start_row, end_row, start_col, end_col):
    raw = call_tdoc("sheet-mcp", "get_cell_data", {
        "file_id": FILE_ID, "sheet_id": SHEET_ID,
        "start_row": start_row, "end_row": end_row,
        "start_col": start_col, "end_col": end_col,
        "return_csv": True
    })
    obj = json.loads(raw)
    return obj.get("csv_data", "")


# ============================================================
# 派生映射表 —— 权威来源 sankey_v4.html（三层追溯桑基图）
#   topic(所属专题, 带"方案/专项方案"后缀) → (需求域, TOGAF_4A_short, SNN_code)
# ============================================================
TOPIC_TO_DOMAIN = {
    # === 销售域 (BA dominant) ===
    "销售全流程数字化管控方案":     ("销售域", "BA", "S04"),
    "销售价格体系专项方案":         ("销售域", "BA", "S05"),
    # === 采购域 ===
    "采购集约化管理提升专项方案":   ("采购域", "DA", "S13"),
    "采购管理数字化优化方案":       ("采购域", "DA", "S14"),
    "SRM与SAP同步优化方案":         ("采购域", "AA", "S14"),
    # === 供应链域 ===
    "内部供应链可视化提升专项方案": ("供应链域", "DA", "S17"),
    "产供销协同专项方案":           ("供应链域", "AA", "S16"),
    # === 计划制造域 ===
    "PMC计划效率提升专项方案":      ("计划制造域", "AA", "S18"),
    # === 财务域 (DA dominant) ===
    "集团财务管控专项方案":         ("财务域", "DA", "S10"),
    "全球化财务合规专项方案":       ("财务域", "BA", "S06"),
    "制造成本还原专项方案":         ("财务域", "AA", "S07"),
    # === 主数据域 ===
    "主数据标准化专项方案":         ("主数据域", "DA", "S01"),
    # === 研发BOM域 ===
    "研发与BOM管理专项方案":        ("研发BOM域", "AA", "S12"),
    "研发投入产出回报专项方案":     ("研发BOM域", "AA", "S12"),
    # === 质量域 ===
    "质量追溯专项方案":             ("质量域", "TA", "S21"),
    # === 其他 / 泛类 ===
    "报表分析":                     ("其他", "DA", ""),
    "其他":                         ("其他", "DA", ""),
    "委外加工节省成本数据报表没有":  ("其他", "DA", ""),
}

SNN_FULL = {
    "S01": "S01 物料主数据治理",   "S02": "S02 客户信用管理",
    "S03": "S03 跨公司转卖",       "S04": "S04 销售订单全链路",
    "S05": "S05 销售价格体系",     "S06": "S06 海外合规",
    "S07": "S07 制造成本还原",     "S08": "S08 财务组织+科目主数据",
    "S09": "S09 应收清账+BIP接口","S10": "S10 集团合并报表",
    "S11": "S11 销售项目核算",     "S12": "S12 研发投入产出",
    "S13": "S13 供应商绩效",       "S14": "S14 采购价格透明化",
    "S15": "S15 采购配额管理",     "S16": "S16 产前齐套性预警",
    "S17": "S17 库存可视化",       "S18": "S18 主生产计划MPS",
    "S19": "S19 MRP物料需求计划", "S20": "S20 生产进度看板",
    "S21": "S21 质量追溯",         "S22": "S22 QM合格率统计",
    "S23": "S23 BOM全生命周期",
}

TOGAF_4A = {
    "BA": "A1 业务架构 (BA)",
    "DA": "A2 数据架构 (DA)",
    "AA": "A3 应用架构 (AA)",
    "TA": "A4 技术架构 (TA)",
}

PHASE_MAP = {
    "本期":   "2026 夯实底座",
    "二期":   "2027 贯通协同",
    "三期":   "2028 智慧跃升",
    "非本期": "溢出范围",
    "":       "未分期",
}

PRIORITY_NORM = {
    "高": "P0", "中": "P1", "低": "P2", "待定": "PX",
    "": "未填写",
}


def derive_fields(topic, scope, priority_raw):
    """由所属专题 / 分期 / 优先级派生 4A、SNN、阶段标签等。"""
    domain_info = TOPIC_TO_DOMAIN.get(topic)
    if domain_info:
        domain, togaf_4a_short, snn = domain_info
    else:
        domain, togaf_4a_short, snn = "其他", "DA", ""
    phase_label = PHASE_MAP.get(scope, scope or "未分期")
    pri_norm = PRIORITY_NORM.get(priority_raw, priority_raw or "未填写")
    if scope == "非本期":
        scope_class = "溢出"
    elif scope in ("本期", "二期", "三期"):
        scope_class = "纳入"
    else:
        scope_class = "待判定"
    return {
        "domain": domain,
        "togaf_4a": TOGAF_4A.get(togaf_4a_short, togaf_4a_short),
        "togaf_4a_short": togaf_4a_short,
        "snn": snn,
        "snn_full": SNN_FULL.get(snn, "") if snn else "",
        "phase_label": phase_label,
        "priority_norm": pri_norm,
        "scope_class": scope_class,
    }


def main():
    out_path = sys.argv[1] if len(sys.argv) > 1 else "requirements-detail.json"
    print("Pulling 需求总库 (701 rows, cols 0-27) ...")
    csv_text = pull_csv(2, 703, 0, MAX_COL)  # rows 2..702 = 701 data rows
    reader = list(csv.reader(io.StringIO(csv_text)))
    print(f"  raw rows parsed: {len(reader)}")

    rows = []
    for r in reader:
        if len(r) <= COL["scope"]:
            continue
        req_id = clean(r[COL["req_id"]])
        if not req_id:
            continue
        topic = clean(r[COL["topic"]])
        scope = clean(r[COL["scope"]])
        priority_std = clean(r[COL["priority_std"]])  # 原始值（含空），priority_norm 才归一化
        rows.append({
            "req_id": req_id,
            "summary": clean(r[COL["summary"]]),
            "dept": clean(r[COL["dept"]]),
            "priority_std": priority_std,
            "topic": topic,
            "func_domain": clean(r[COL["func_domain"]]),
            "q_type": clean(r[COL["q_type"]]),
            "category": clean(r[COL["category"]]),
            "scope_phase": scope,
            "system_owner": clean(r[COL["system_owner"]]),
            "sap_module": clean(r[COL["sap_module"]]),
            "consultant": clean(r[COL["consultant"]]),
            "opinion": clean(r[COL["opinion"]]),
            "detail": clean(r[COL["detail"]]),
            "meeting_detail": clean(r[COL["meeting_detail"]]),
        })

    total = len(rows)
    print(f"  valid requirements: {total}")

    output = []
    stats = {"mapped_snn": 0, "unmapped_topic": set(),
             "phase_dist": Counter(), "togaf_dist": Counter()}
    for i, row in enumerate(rows):
        drv = derive_fields(row["topic"], row["scope_phase"], row["priority_std"])
        rec = {
            "#": i + 1,
            "req_id": row["req_id"],
            "summary": row["summary"],
            "dept": row["dept"],
            "priority_std": row["priority_std"],
            "priority_norm": drv["priority_norm"],
            "topic": row["topic"],
            "func_domain": row["func_domain"],
            "q_type": row["q_type"],
            "category": row["category"],
            "scope_phase": row["scope_phase"],
            "phase_label": drv["phase_label"],
            "scope_class": drv["scope_class"],
            "domain": drv["domain"],
            "togaf_4a": drv["togaf_4a"],
            "togaf_4a_short": drv["togaf_4a_short"],
            "snn": drv["snn"],
            "snn_full": drv["snn_full"],
            "opinion": row["opinion"],
            "detail": row["detail"],
            "consultant": row["consultant"],
            "meeting_detail": row["meeting_detail"],
            "system_owner": row["system_owner"],
            "sap_module": row["sap_module"],
        }
        output.append(rec)
        if drv["snn"]:
            stats["mapped_snn"] += 1
        if not drv["snn"] and rec["topic"]:
            stats["unmapped_topic"].add(rec["topic"])
        stats["phase_dist"][drv["phase_label"]] += 1
        stats["togaf_dist"][drv["togaf_4a_short"]] += 1

    print(f"  mapped to SNN: {stats['mapped_snn']} ({100*stats['mapped_snn']/max(total,1):.1f}%)", file=sys.stderr)
    print(f"  unmapped topics: {sorted(stats['unmapped_topic'])}", file=sys.stderr)

    result = {
        "meta": {
            "total": total,
            "source": "腾讯文档「佛照_02探索阶段_需求整理_V5_20260718」需求总库",
            "extracted_at": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "mapping_authority": "sankey_v4.html (三层追溯桑基图: 需求域→TOGAF 4A→高价值场景)",
            "derived_fields_note": "togaf_4a/snn/domain 由所属专题经桑基图映射推导，标注为推导值",
        },
        "columns": [
            {"key": "#", "label": "序号", "width": 50},
            {"key": "req_id", "label": "需求编号", "width": 100},
            {"key": "summary", "label": "需求简述", "width": 320},
            {"key": "dept", "label": "提出部门", "width": 110},
            {"key": "priority_norm", "label": "优先级", "width": 60},
            {"key": "topic", "label": "所属专题", "width": 160},
            {"key": "func_domain", "label": "功能域", "width": 110},
            {"key": "scope_phase", "label": "分期(源)", "width": 70},
            {"key": "phase_label", "label": "实施阶段", "width": 120},
            {"key": "domain", "label": "需求域", "width": 90},
            {"key": "togaf_4a", "label": "TOGAF 4A", "width": 150},
            {"key": "snn", "label": "高价值场景", "width": 80},
            {"key": "snn_full", "label": "场景全称", "width": 180},
            {"key": "opinion", "label": "顾问处理意见", "width": 280},
            {"key": "scope_class", "label": "范围", "width": 55},
        ],
        "data": output,
        "filters": {
            "phase_labels": [{"label": k, "count": v} for k, v in stats["phase_dist"].items()],
            "togaf_4as": [{"label": TOGAF_4A.get(k, k) + " [" + k + "]", "count": v, "key": k}
                          for k, v in stats["togaf_dist"].items()],
            "snns": sorted(
                [{"label": SNN_FULL.get(k, k), "code": k,
                  "count": sum(1 for r in output if r["snn"] == k)} for k in SNN_FULL.keys()],
                key=lambda x: -x["count"]),
            "scope_classes": [
                {"label": "纳入范围", "code": "in", "count": sum(1 for r in output if r["scope_class"] == "纳入")},
                {"label": "溢出范围", "code": "out", "count": sum(1 for r in output if r["scope_class"] == "溢出")},
            ],
            "departments": [{"label": k, "count": v}
                            for k, v in Counter(r["dept"] for r in output if r["dept"]).most_common(20)],
            "priorities": [{"label": k, "count": v}
                           for k, v in Counter(r["priority_norm"] for r in output).most_common()],
        },
    }

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=1)
    print(f"  written: {out_path} ({total} rows)")


if __name__ == "__main__":
    main()
