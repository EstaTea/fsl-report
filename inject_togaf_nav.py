#!/usr/bin/env python3
"""
一次性完成：
1. 创建 togaf/ 目录，写入 workbench + 包装页
2. 更新全部 44 个 HTML 文件的导航栏（加 TOGAF 入口）
3. 输出变更摘要供 git commit
"""
import os, re, shutil

REPO = "/Users/I523899/fsl-report"
WB_SRC = "/Users/I523899/TOGAF学习/togaf_workbench.html"
TOGAF_DIR = os.path.join(REPO, "togaf")

os.makedirs(TOGAF_DIR, exist_ok=True)

# ── Step 1: 复制工作台源文件 ─────────────────────────────────────────────────
shutil.copy2(WB_SRC, os.path.join(TOGAF_DIR, "workbench.html"))
print(f"✅ workbench.html 已复制 ({os.path.getsize(WB_SRC)//1024} KB)")

# ── Step 2: 创建包装页 togaf/index.html ────────────────────────────────────
# 读取 index.html 的 nav 部分（直到 </nav>）作为模板
with open(os.path.join(REPO, "index.html"), encoding="utf-8") as f:
    root_html = f.read()

nav_end = root_html.find("</nav>")
nav_block = root_html[:nav_end + len("</nav>")]
# 只取 <nav> 起始
nav_start = nav_block.rfind("<nav")
nav_html = nav_block[nav_start:]

# 在 nav_html 里把"工作台首页"的 active 去掉，TOGAF 加 active
nav_html = nav_html.replace(
    '<a href="/fsl-report/" class="active">工作台首页</a>',
    '<a href="/fsl-report/">工作台首页</a>'
)

TOGAF_NAV_LINK = (
    '<a href="/fsl-report/togaf/" '
    'style="padding:0 14px;color:#fff;font-size:12.5px;height:54px;'
    'display:flex;align-items:center;white-space:nowrap;font-weight:700;'
    'border-left:2px solid #5EA4CE;background:rgba(94,164,206,.12);">'
    '🏛 TOGAF</a>'
)
# 把 TOGAF 链接加上 active 样式
nav_html_active = nav_html.replace(
    '<a href="/fsl-report/togaf/" ',
    '<a href="/fsl-report/togaf/" class="active" '
)

WRAPPER = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TOGAF 咨询工作台 | 佛照 FSL</title>
<style>
*{{box-sizing:border-box;margin:0;padding:0}}
body{{display:flex;flex-direction:column;height:100vh;overflow:hidden;
  font-family:"Microsoft YaHei","Helvetica Neue",system-ui,sans-serif;}}
#fsl-nav{{flex-shrink:0}}
#wb-frame{{flex:1;border:none;width:100%;display:block}}
/* 覆盖工作台高度，让 iframe 撑满 */
</style>
</head>
<body>
<div id="fsl-nav">
{nav_html}
</div>
<iframe id="wb-frame" src="/fsl-report/togaf/workbench.html"
  title="TOGAF 咨询工作台" allowfullscreen></iframe>
</body>
</html>"""

# 把 nav 里的 active 替换成 TOGAF 高亮
WRAPPER = WRAPPER.replace(
    '<a href="/fsl-report/" class="active">工作台首页</a>',
    '<a href="/fsl-report/">工作台首页</a>'
)

with open(os.path.join(TOGAF_DIR, "index.html"), "w", encoding="utf-8") as f:
    f.write(WRAPPER)
print("✅ togaf/index.html 包装页已创建")

# ── Step 3: 为所有 HTML 注入 TOGAF 导航项 ────────────────────────────────────
# 要插入的 HTML 片段 —— 在任务看板 dropdown 之后、</div>(nav-links结束) 之前
TOGAF_LINK = (
    '\n    <a href="/fsl-report/togaf/" '
    'style="padding:0 14px;color:rgba(255,255,255,.75);font-size:12.5px;height:54px;'
    'display:flex;align-items:center;white-space:nowrap;font-weight:600;'
    'border-left:2px solid rgba(94,164,206,.6);background:rgba(94,164,206,.1);">'
    '🏛 TOGAF</a>'
)

# 找插入点：任务看板 dropdown 的结束位置（最后一个 </div> 关闭 nav-dropdown，
# 然后是 </div> 关闭 nav-links，再是 </nav>）
# 用正则找：最后一个 nav-dropdown 结束后（即 kanban 下拉的闭合）
# 模式：</div>\s*</div>\s*</nav>  最后两个 </div> 分别是 nav-dropdown-panel 和 nav-dropdown，
# 然后第三个 </div> 是 nav-links
#
# 实际结构（从文件观察）：
# ...
#             </div>         ← nav-dropdown-panel 内的 dd-col div
#           </div>           ← nav-dropdown-panel
#         </div>             ← nav-dropdown (kanban)
#       </div>               ← nav-links
#     </div>
#   </div>
# </nav>
#
# 最可靠的锚点：找 </nav> 前的倒数第4个 </div>，在第3个 </div> 前面插入

# 更简单策略：在每个文件里找 </nav> 前最后一次出现 "nav-dropdown" 对应块的关闭，
# 然后在 nav-links 关闭 </div> 前插入。
#
# 最安全方式：找 "active-if-kanban" 所在的 nav-dropdown 块，找其对应闭合 </div>,
# 在其后、nav-links 闭合 </div> 前插入。

# 由于各页面 indentation 可能不同，用「最后一个 nav-dropdown 块结束后」定位：
# 找 </div>\s*</div>\s*</nav> 这个3-div+nav的结尾模式，在第1个</div>后插入
PATTERN = re.compile(
    r'([ \t]*</div>[ \t]*\n'   # closes nav-dropdown (kanban)
    r'[ \t]*</div>[ \t]*\n'    # closes nav-links
    r'[ \t]*</div>[ \t]*\n'    # closes nav container inner
    r'[ \t]*</div>[ \t]*\n'    # closes nav container outer
    r'[ \t]*</nav>)',
    re.MULTILINE
)

# 收集所有需要更新的 html 文件
html_files = []
for root, dirs, files in os.walk(REPO):
    dirs[:] = [d for d in dirs if d not in ('.git', 'togaf')]
    for fn in files:
        if fn.endswith('.html'):
            html_files.append(os.path.join(root, fn))

updated = []
skipped_already = []
skipped_no_match = []

for fpath in sorted(html_files):
    with open(fpath, encoding='utf-8') as f:
        content = f.read()

    # 已经有 TOGAF 链接 → 跳过
    if '/fsl-report/togaf/' in content or 'togaf_workbench' in content:
        skipped_already.append(os.path.relpath(fpath, REPO))
        continue

    # 没有 nav-links → 跳过（不是工作台页面）
    if 'nav-links' not in content:
        skipped_no_match.append(os.path.relpath(fpath, REPO))
        continue

    # 找插入点
    m = PATTERN.search(content)
    if not m:
        skipped_no_match.append(os.path.relpath(fpath, REPO) + " (pattern-miss)")
        continue

    # 在 kanban dropdown 关闭 </div> 之后插入
    insert_pos = m.start() + len(re.match(r'[ \t]*</div>', m.group()).group())
    # 实际上我们在整个匹配块之前插入（即在 kanban </div> 之后插入）
    # m.group() 第一行就是 kanban dropdown 的 </div>，在它之后插入
    first_line_end = m.start() + content[m.start():].find('\n') + 1
    new_content = content[:first_line_end] + TOGAF_LINK + '\n' + content[first_line_end:]

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    updated.append(os.path.relpath(fpath, REPO))

print(f"\n✅ 导航更新完成")
print(f"   更新: {len(updated)} 个文件")
print(f"   已有: {len(skipped_already)} 个（跳过）")
print(f"   无匹配: {len(skipped_no_match)} 个")
if skipped_no_match:
    print("   无匹配文件:", skipped_no_match[:5])

# ── 输出用于 commit 的摘要 ────────────────────────────────────────────────────
print(f"\n更新的文件列表 (前15):")
for f in updated[:15]:
    print(f"  {f}")
if len(updated) > 15:
    print(f"  ... 还有 {len(updated)-15} 个")
