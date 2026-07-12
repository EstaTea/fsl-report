#!/usr/bin/env python3
"""精确修复 survey-*.html 三个问题"""
import os, re, glob
REPO = "/Users/I523899/fsl-report"
os.chdir(REPO)

# ── MDG/DRC/SI Tabs HTML（插入到 mod-tabs 闭合前）────────────────────────────
MDG_DRC_SI = '''    <div class="mod-tab-dd" id="mdgTabDd" style="display:inline-flex;align-items:stretch">
      <div class="mod-tab" style="cursor:pointer" onclick="toggleMdgDd(event)">🎓 <span class="label-text">MDG案例</span><span style="font-size:8px;margin-left:2px;opacity:.6">▾</span></div>
      <div class="mod-tab-dd-panel" id="mdg-dropdown">
        <div style="padding:6px 16px 4px;font-size:10px;font-weight:700;color:rgba(255,255,255,.4);letter-spacing:.5px;text-transform:uppercase">第一周 · 理论学习</div>
        <a href="https://estatea.github.io/mdg-course/week1/day1.html" target="_blank">📖 Day 1 · 什么是MDG？</a>
        <a href="https://estatea.github.io/mdg-course/week1/day2.html" target="_blank">📖 Day 2 · MDG架构与部署</a>
        <a href="https://estatea.github.io/mdg-course/week1/day3.html" target="_blank">📖 Day 3 · MDG-M 物料主数据</a>
        <a href="https://estatea.github.io/mdg-course/week1/day4.html" target="_blank">📖 Day 4 · MDG-BP 业务伙伴</a>
        <a href="https://estatea.github.io/mdg-course/week1/day5.html" target="_blank">📖 Day 5 · MDG-G 财务主数据</a>
        <a href="https://estatea.github.io/mdg-course/week1/day6.html" target="_blank">📖 Day 6 · 工作流与审批设计</a>
        <a href="https://estatea.github.io/mdg-course/week1/day7.html" target="_blank">📖 Day 7 · DRF数据复制框架</a>
        <div style="height:1px;background:rgba(255,255,255,.1);margin:4px 0"></div>
        <div style="padding:6px 16px 4px;font-size:10px;font-weight:700;color:rgba(255,255,255,.4);letter-spacing:.5px;text-transform:uppercase">第二周 · 案例模拟</div>
        <a href="https://estatea.github.io/mdg-course/week2/day8.html" target="_blank">🔧 Day 8 · 案例介绍与环境准备</a>
        <a href="https://estatea.github.io/mdg-course/week2/day9.html" target="_blank">🔧 Day 9 · 物料主数据配置实战</a>
        <a href="https://estatea.github.io/mdg-course/week2/day10.html" target="_blank">🔧 Day 10 · BP主数据配置实战</a>
        <a href="https://estatea.github.io/mdg-course/week2/day11.html" target="_blank">🔧 Day 11 · 工作流配置实战</a>
        <a href="https://estatea.github.io/mdg-course/week2/day12.html" target="_blank">🔧 Day 12 · 迁移验收与项目总结</a>
        <div style="height:1px;background:rgba(255,255,255,.1);margin:4px 0"></div>
        <a href="https://estatea.github.io/mdg-course/" target="_blank" style="color:rgba(255,255,255,.9);font-weight:700">🏠 课程首页（总览）</a>
      </div>
    </div>
    <div class="mod-tab-dd" id="drcTabDd" style="display:inline-flex;align-items:stretch">
      <div class="mod-tab" style="cursor:pointer" onclick="toggleDrcDd(event)">📋 <span class="label-text">DRC案例</span><span style="font-size:8px;margin-left:2px;opacity:.6">▾</span></div>
      <div class="mod-tab-dd-panel" id="drc-dropdown">
        <div style="padding:6px 16px 4px;font-size:10px;font-weight:700;color:rgba(255,255,255,.4);letter-spacing:.5px;text-transform:uppercase">第一周 · 理论学习</div>
        <a href="https://estatea.github.io/drc-course/week1/day1.html" target="_blank">📖 Day 1 · 什么是DRC？</a>
        <a href="https://estatea.github.io/drc-course/week1/day2.html" target="_blank">📖 Day 2 · DRC架构与部署模式</a>
        <a href="https://estatea.github.io/drc-course/week1/day3.html" target="_blank">📖 Day 3 · 电子文件合规</a>
        <a href="https://estatea.github.io/drc-course/week1/day4.html" target="_blank">📖 Day 4 · 法定报告合规</a>
        <a href="https://estatea.github.io/drc-course/week1/day5.html" target="_blank">📖 Day 5 · 泰国e-Tax Invoice合规</a>
        <a href="https://estatea.github.io/drc-course/week1/day6.html" target="_blank">📖 Day 6 · 德国XRechnung/ZUGFeRD</a>
        <a href="https://estatea.github.io/drc-course/week1/day7.html" target="_blank">📖 Day 7 · DRC配置框架总览</a>
        <div style="height:1px;background:rgba(255,255,255,.1);margin:4px 0"></div>
        <div style="padding:6px 16px 4px;font-size:10px;font-weight:700;color:rgba(255,255,255,.4);letter-spacing:.5px;text-transform:uppercase">第二周 · 案例模拟</div>
        <a href="https://estatea.github.io/drc-course/week2/day8.html" target="_blank">🔧 Day 8 · 案例介绍</a>
        <a href="https://estatea.github.io/drc-course/week2/day9.html" target="_blank">🔧 Day 9 · 泰国DRC配置实战</a>
        <a href="https://estatea.github.io/drc-course/week2/day10.html" target="_blank">🔧 Day 10 · 德国DRC配置实战</a>
        <a href="https://estatea.github.io/drc-course/week2/day11.html" target="_blank">🔧 Day 11 · 监控与审计</a>
        <a href="https://estatea.github.io/drc-course/week2/day12.html" target="_blank">🔧 Day 12 · 上线验收与总结</a>
        <div style="height:1px;background:rgba(255,255,255,.1);margin:4px 0"></div>
        <a href="https://estatea.github.io/drc-course/" target="_blank" style="color:rgba(255,255,255,.9);font-weight:700">🏠 课程首页（总览）</a>
      </div>
    </div>
    <div class="mod-tab-dd" id="siTabDd" style="display:inline-flex;align-items:stretch">
      <div class="mod-tab" style="cursor:pointer" onclick="toggleSiDd(event)">🔗 <span class="label-text">SI案例</span><span style="font-size:8px;margin-left:2px;opacity:.6">▾</span></div>
      <div class="mod-tab-dd-panel" id="si-dropdown">
        <div style="padding:6px 16px 4px;font-size:10px;font-weight:700;color:rgba(255,255,255,.4);letter-spacing:.5px;text-transform:uppercase">第一周 · 理论学习</div>
        <a href="https://estatea.github.io/si-course/week1/day1.html" target="_blank">📖 Day 1 · 什么是SI？</a>
        <a href="https://estatea.github.io/si-course/week1/day2.html" target="_blank">📖 Day 2 · SI架构与核心组件</a>
        <a href="https://estatea.github.io/si-course/week1/day3.html" target="_blank">📖 Day 3 · iFlow设计基础</a>
        <a href="https://estatea.github.io/si-course/week1/day4.html" target="_blank">📖 Day 4 · 消息映射与转换</a>
        <a href="https://estatea.github.io/si-course/week1/day5.html" target="_blank">📖 Day 5 · 连接器与适配器</a>
        <a href="https://estatea.github.io/si-course/week1/day6.html" target="_blank">📖 Day 6 · 异常处理与监控</a>
        <a href="https://estatea.github.io/si-course/week1/day7.html" target="_blank">📖 Day 7 · 安全与API管理</a>
        <div style="height:1px;background:rgba(255,255,255,.1);margin:4px 0"></div>
        <div style="padding:6px 16px 4px;font-size:10px;font-weight:700;color:rgba(255,255,255,.4);letter-spacing:.5px;text-transform:uppercase">第二周 · 佛照12系统集成实战</div>
        <a href="https://estatea.github.io/si-course/week2/day8.html" target="_blank">🔧 Day 8 · 案例介绍</a>
        <a href="https://estatea.github.io/si-course/week2/day9.html" target="_blank">🔧 Day 9 · OMS订单集成实战</a>
        <a href="https://estatea.github.io/si-course/week2/day10.html" target="_blank">🔧 Day 10 · MES生产集成实战</a>
        <a href="https://estatea.github.io/si-course/week2/day11.html" target="_blank">🔧 Day 11 · PLM主数据集成实战</a>
        <a href="https://estatea.github.io/si-course/week2/day12.html" target="_blank">🔧 Day 12 · 上线验收与运维总结</a>
        <div style="height:1px;background:rgba(255,255,255,.1);margin:4px 0"></div>
        <a href="https://estatea.github.io/si-course/" target="_blank" style="color:rgba(255,255,255,.9);font-weight:700">🏠 课程首页（总览）</a>
      </div>
    </div>'''

EXEC_LINK = (
    '<a href="/fsl-report/kanban/survey-executives.html" '
    'style="display:flex;align-items:center;gap:7px;padding:7px 14px;'
    'color:rgba(255,255,255,.7);font-size:12.5px;text-decoration:none;'
    'font-weight:700;border-left:2px solid #5EA4CE;padding-left:12px" '
    'onmouseover="this.style.background=\'rgba(255,255,255,.1)\'" '
    'onmouseout="this.style.background=\'\'">👔 管理层专访·董事长/总经理/财务副总</a>'
)

# 精确锚点（从实际文件确认）
# badge 锚点：font-weight:700;margin-left:4px">  13  </span>
BADGE_OLD  = 'font-weight:700;margin-left:4px">13</span>'
BADGE_NEW  = 'font-weight:700;margin-left:4px">14</span>'
# executives 插在 strategy 任一变体之后
EXEC_ANCHORS = [
    '>战略调研·董事会</a>',
    '>战略调研 · 董事会</a>',
    '>🏛 战略调研 · 董事会</a>',
]
# MDG 插入锚点（mod-tabs 关闭前的精确字符串）
MDG_ANCHOR = '</div>\n    </div>\n  </div></div>\n</div>\n\n<div id="sdPanel"'
MDG_REPLACEMENT = MDG_DRC_SI + '\n    </div>\n  </div></div>\n</div>\n\n<div id="sdPanel"'

updated = []
errors  = []

for fp in sorted(glob.glob("kanban/survey-*.html")):
    with open(fp, encoding="utf-8") as f:
        html = f.read()

    orig = html
    fname = fp.split("/")[-1]

    # Fix badge 13→14
    html = html.replace(BADGE_OLD, BADGE_NEW)

    # Fix survey-executives
    if 'survey-executives.html' not in html:
        for anchor in EXEC_ANCHORS:
            if anchor in html:
                html = html.replace(anchor, anchor + EXEC_LINK, 1)
                break

    # Fix MDG/DRC/SI tabs
    if 'mdgTabDd' not in html:
        if MDG_ANCHOR in html:
            html = html.replace(MDG_ANCHOR, MDG_REPLACEMENT, 1)
        else:
            errors.append(f"{fname}: MDG锚点未找到")

    if html != orig:
        with open(fp, "w", encoding="utf-8") as f:
            f.write(html)
        updated.append(fname)

print(f"✅ 更新 {len(updated)} 个文件")
if errors:
    print("⚠️  问题:", errors)

# 验证
print("\n验证：")
all_ok = True
for fp in sorted(glob.glob("kanban/survey-*.html")):
    with open(fp, encoding="utf-8") as f:
        c = f.read()
    b14  = BADGE_NEW in c
    exec_ = 'survey-executives.html' in c
    mdg   = 'mdgTabDd' in c
    ok = b14 and exec_ and mdg
    if not ok:
        all_ok = False
    print(f"  {'✅' if ok else '❌'} {fp.split('/')[-1]:30s} badge14={'✅' if b14 else '❌'} exec={'✅' if exec_ else '❌'} MDG={'✅' if mdg else '❌'}")

print(f"\n{'✅ 全部通过' if all_ok else '❌ 有项未修复'}")
