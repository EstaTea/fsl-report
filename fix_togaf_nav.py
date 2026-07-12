#!/usr/bin/env python3
"""
修复两个问题：
1. 把所有 HTML 里错误嵌套在 kanban dropdown 内的 TOGAF 链接移到正确位置
   （nav-links 内，kanban dropdown 之后，nav-links 关闭之前），并去掉 emoji
2. 重写 togaf/index.html，把完整 CSS 内联进去，确保导航样式正确显示
"""
import os, re

REPO = "/Users/I523899/fsl-report"

# ── 新的 TOGAF 链接（无 emoji，样式与其他 nav-links a 一致）─────────────────
TOGAF_LINK = '<a href="/fsl-report/togaf/" style="padding:0 14px;color:rgba(255,255,255,.75);font-size:12.5px;height:54px;display:flex;align-items:center;white-space:nowrap;font-weight:600;">TOGAF</a>'

# 需要从文件里删除的旧注入（带或不带 emoji）
OLD_PATTERN = re.compile(
    r'\n[ \t]*<a href="/fsl-report/togaf/"[^>]*>[🏛 ]*TOGAF</a>',
    re.UNICODE
)

# 正确插入位置的锚点：</div>\n    </div>\n  </div>\n</nav>
# 即：nav-dropdown-panel </div> → nav-dropdown </div> → nav-links </div> → </nav>
# 我们要在 nav-dropdown 的 </div> 之后、nav-links 的 </div> 之前插入

# 精确正则：找 nav-links 区域的收尾结构
# nav-links 内最后一个 nav-dropdown 结束后的结构是：
#     </div>        ← closes nav-dropdown (kanban)
#   </div>          ← closes nav-links
# </nav>
INSERT_PATTERN = re.compile(
    r'(\n[ \t]*</div>[ \t]*\n)'   # group1: closes nav-dropdown (kanban)
    r'([ \t]*</div>[ \t]*\n)'     # group2: closes nav-links
    r'([ \t]*</div>[ \t]*\n)'     # group3: closes nav outer
    r'([ \t]*</div>[ \t]*\n)'     # group4: closes another outer
    r'([ \t]*</nav>)',             # group5: </nav>
    re.MULTILINE
)

html_files = []
for root, dirs, files in os.walk(REPO):
    dirs[:] = [d for d in dirs if d not in ('.git', 'togaf')]
    for fn in files:
        if fn.endswith('.html'):
            html_files.append(os.path.join(root, fn))

fixed = []
skipped = []

for fpath in sorted(html_files):
    with open(fpath, encoding='utf-8') as f:
        content = f.read()

    if 'nav-links' not in content:
        continue

    # Step A: 删除所有错误注入的旧链接
    content_clean = OLD_PATTERN.sub('', content)
    was_present = content_clean != content

    # Step B: 插入到正确位置
    m = INSERT_PATTERN.search(content_clean)
    if not m:
        # fallback: 在 </nav> 前、最后 </div> 前插入
        nav_idx = content_clean.rfind('</nav>')
        if nav_idx < 0:
            skipped.append(os.path.relpath(fpath, REPO))
            continue
        before = content_clean[:nav_idx]
        last_div = before.rfind('</div>')
        if last_div < 0:
            skipped.append(os.path.relpath(fpath, REPO))
            continue
        pos = last_div + len('</div>')
        new_content = content_clean[:pos] + '\n    ' + TOGAF_LINK + content_clean[pos:]
    else:
        # 在 group1（kanban dropdown 关闭）之后、group2（nav-links 关闭）之前插入
        insert_pos = m.start(2)  # 开头是 group2 的位置
        new_content = (
            content_clean[:insert_pos]
            + '    ' + TOGAF_LINK + '\n'
            + content_clean[insert_pos:]
        )

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    fixed.append(os.path.relpath(fpath, REPO))

print(f"✅ 修复 {len(fixed)} 个文件")
print(f"⚠️  跳过 {len(skipped)} 个文件: {skipped[:5]}")

# ── 快速验证主页 ──────────────────────────────────────────────────────────────
with open(os.path.join(REPO, "index.html"), encoding='utf-8') as f:
    idx = f.read()

nav_end = idx.find('</nav>')
nav_section = idx[:nav_end+6]
togaf_pos = nav_section.rfind('togaf/')
if togaf_pos > 0:
    print("\n✅ index.html TOGAF 链接位置验证：")
    print(repr(idx[max(0,togaf_pos-60):togaf_pos+80]))
else:
    print("\n❌ index.html 中找不到 TOGAF 链接！")
