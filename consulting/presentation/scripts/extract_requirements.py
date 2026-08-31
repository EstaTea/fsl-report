#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
提取腾讯文档「需求总库」(eAHMLRIYXXeO / 000001) 的真实 701 条需求，
计算多维聚合，输出 requirements-data.json 供大屏页消费。

调用 tencentdocs.py（腾讯文档 skill 提供的纯标准库入口），
票据由宿主环境变量 TDOC_OAUTH_ACCESS_TOKEN 注入（本地/Action 均需可用）。

运行：python3 extract_requirements.py [--out requirements-data.json]
"""
import subprocess
import json
import csv
import io
import sys
import os
import datetime

TDOC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tencentdocs.py")
if not os.path.exists(TDOC):
    # 兜底：宿主缓存中的 skill 副本
    TDOC = "/Users/I523899/.workbuddy/plugins/cache/workbuddy-builtin/tencent-docs-plugin/1.0.0/skills/tencent-docs/tencentdocs.py"

FILE_ID = "eAHMLRIYXXeO"
SHEET_ID = "000001"
# 列索引（0-based，依据 000001 表头）
COL = {
    "req_id": 0,
    "priority_std": 3,   # 优先级_标准
    "problem_area": 5,   # 问题领域
    "q_type": 6,         # 问题类型
    "topic": 7,          # 所属专题
    "func_domain": 8,    # 需求类型（功能域）
    "dept": 10,          # 提出部门
    "category": 16,      # 问题分类
    "scope": 18,         # 项目范围界定
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

# 优先级归一化：源数据形如「高🔴 / 中🟡 / 低🟢 / 待定⬜」，去掉 emoji 与冗余词
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


def main():
    out_path = sys.argv[1] if len(sys.argv) > 1 else "requirements-data.json"
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
        rows.append({
            "req_id": req_id,
            "priority_std": norm_priority(r[COL["priority_std"]]),
            "problem_area": clean(r[COL["problem_area"]]),
            "q_type": clean(r[COL["q_type"]]),
            "topic": clean(r[COL["topic"]]),
            "func_domain": clean(r[COL["func_domain"]]),
            "dept": clean(r[COL["dept"]]),
            "category": clean(r[COL["category"]]),
            "scope": clean(r[COL["scope"]]),
            "priority": norm_priority(r[COL["priority"]]),
        })

    total = len(rows)
    print(f"  valid requirements: {total}")

    def count_by(key, top=None):
        d = {}
        for r in rows:
            v = r[key] or "（未填写）"
            d[v] = d.get(v, 0) + 1
        items = sorted(d.items(), key=lambda x: -x[1])
        if top:
            items = items[:top]
        return [{"name": k, "count": v} for k, v in items]

    # 处置口径（项目范围界定）
    scope_order = ["本期", "二期", "三期", "非本期"]
    scope_raw = {}
    for r in rows:
        v = r["scope"] or "（未填写）"
        scope_raw[v] = scope_raw.get(v, 0) + 1
    scope = {k: scope_raw.get(k, 0) for k in scope_order}
    scope["其他"] = sum(v for k, v in scope_raw.items() if k not in scope_order)

    # 阶段 × 优先级 矩阵
    phase_priority = {}
    for sp in scope_order:
        phase_priority[sp] = {}
    for r in rows:
        sp = r["scope"] or "（未填写）"
        if sp not in phase_priority:
            sp = "其他" if "其他" not in phase_priority else sp
            if sp not in phase_priority:
                continue
        pr = r["priority_std"] or r["priority"] or "（未填写）"
        phase_priority[sp][pr] = phase_priority[sp].get(pr, 0) + 1

    result = {
        "meta": {
            "source": "腾讯文档 需求总库 (eAHMLRIYXXeO / 子表 000001)",
            "total": total,
            "updated_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
            "note": "本文件为定时快照，真实数据源为腾讯文档在线表格，由 GitHub Action 或本地脚本周期性重算。"
        },
        "scope": scope,
        "priority_std": count_by("priority_std"),
        "priority": count_by("priority"),
        "topic_top": count_by("topic", 10),
        "dept_top": count_by("dept", 10),
        "q_type": count_by("q_type"),
        "func_domain": count_by("func_domain"),
        "category": count_by("category"),
        "problem_area": count_by("problem_area"),
        "phase_priority": phase_priority,
    }

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"  written: {out_path}")
    # 打印摘要
    print("  ── 摘要 ──")
    print("  处置口径:", scope)
    print("  优先级_标准 TOP:", result["priority_std"][:6])
    print("  专题 TOP5:", [(x["name"], x["count"]) for x in result["topic_top"][:5]])
    print("  部门 TOP5:", [(x["name"], x["count"]) for x in result["dept_top"][:5]])


if __name__ == "__main__":
    main()
