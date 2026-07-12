#!/usr/bin/env python3
"""
统一导航重构：
1. 从 good commit 提取权威 nav HTML
2. 生成 /nav.js — 包含完整 nav HTML + 注入逻辑 + CSS
3. 批量替换全部 HTML 文件：删除旧 <nav>…</nav> 和内联 nav CSS，
   注入 <div id="site-nav"></div><script src="…/nav.js"></script>
4. 不改动 NO_NAV 文件（player.html / login.html 等）
"""
import os, re, subprocess

REPO = "/Users/I523899/fsl-report"
os.chdir(REPO)

# ── 1. 从 good commit 取权威 nav ──────────────────────────────────────────────
good_src = subprocess.check_output(
    ["git", "show", "1fb7a65:kanban/index.html"]
).decode("utf-8")

nav_match = re.search(r"(<nav\b.*?</nav>)", good_src, re.DOTALL)
CANONICAL_NAV = nav_match.group(1)

# 当前最新版 kanban nav 已经有 MDG/DRC/SI/TOGAF 全部修复
# 但用当前文件更安全（已含TOGAF菜单）
with open("kanban/index.html", encoding="utf-8") as f:
    cur_kanban = f.read()
cur_nav_match = re.search(r"(<nav\b.*?</nav>)", cur_kanban, re.DOTALL)
CANONICAL_NAV = cur_nav_match.group(1)
print(f"权威 nav 长度: {len(CANONICAL_NAV)} chars")

# ── 2. 收集所有内联 nav CSS（从 index.html 的 <style>）────────────────────────
with open("index.html", encoding="utf-8") as f:
    root_src = f.read()

# 提取 <style> 内容中 nav 相关的 CSS 规则
style_match = re.search(r"<style>(.*?)</style>", root_src, re.DOTALL)
FULL_CSS = style_match.group(1) if style_match else ""

# ── 3. 生成 nav.js ─────────────────────────────────────────────────────────────
# nav.js 做三件事：
#   a) 注入 nav CSS（只注入一次）
#   b) 把 CANONICAL_NAV 写入 #site-nav
#   c) 根据当前 URL 高亮 active 菜单项

NAV_HTML_ESCAPED = CANONICAL_NAV.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")

NAV_JS = f"""\
/* FSL 工作台 — 统一导航 nav.js
 * 修改这一个文件 = 全站导航同步更新
 * 自动生成于 build_shared_nav.py
 */
(function () {{
  // ── 注入 CSS（只注入一次）──────────────────────────────────────────────────
  if (!document.getElementById('fsl-nav-style')) {{
    const style = document.createElement('style');
    style.id = 'fsl-nav-style';
    style.textContent = {repr(FULL_CSS)};
    document.head.appendChild(style);
  }}

  // ── 写入 nav HTML ──────────────────────────────────────────────────────────
  const placeholder = document.getElementById('site-nav');
  if (!placeholder) return;
  placeholder.outerHTML = `{NAV_HTML_ESCAPED}`;

  // ── active 状态：根据当前路径高亮对应菜单项 ────────────────────────────────
  const path = window.location.pathname;
  const nav  = document.querySelector('nav');
  if (!nav) return;

  // 清除所有 active
  nav.querySelectorAll('a.active, a.active-if-kanban').forEach(a => {{
    a.classList.remove('active');
  }});

  // 精确匹配规则（从长到短，防止 / 误匹配所有页面）
  const rules = [
    ['/fsl-report/togaf/',      'a[href="/fsl-report/togaf/"]'],
    ['/fsl-report/kanban/',     'a[href="/fsl-report/kanban/"]'],
    ['/fsl-report/weekly/',     'a[href="/fsl-report/weekly/"]'],
    ['/fsl-report/deliverables/','a[href="/fsl-report/deliverables/"]'],
    ['/fsl-report/consulting/', 'a[href="/fsl-report/deliverables/"]'],
    ['/fsl-report/sap/',        'a[href="/fsl-report/deliverables/"]'],
    ['/fsl-report/research/',   'a[href="/fsl-report/deliverables/"]'],
    ['/fsl-report/',            'a[href="/fsl-report/"]'],
  ];
  for (const [prefix, sel] of rules) {{
    if (path.startsWith(prefix)) {{
      const el = nav.querySelector(sel);
      if (el) {{ el.classList.add('active'); break; }}
    }}
  }}

  // survey / kanban 子页面也高亮「任务看板」
  if (path.includes('/kanban/')) {{
    const a = nav.querySelector('a[href="/fsl-report/kanban/"]');
    if (a) a.classList.add('active');
  }}
}})();
"""

with open("nav.js", "w", encoding="utf-8") as f:
    f.write(NAV_JS)
print(f"✅ nav.js 生成 ({len(NAV_JS)//1024} KB)")

# ── 4. 收集需要处理的 HTML 文件 ────────────────────────────────────────────────
SKIP = {
    "./consulting/blueprint/player.html",
    "./consulting/solutions/sol-costing.html",
    "./kanban/login.html",
    "./sap/prepare/surveys/佛山照明深度分析报告.html",
}
# togaf/index.html 特殊：它的 nav 由 Python 内联生成，单独处理
TOGAF_WRAPPER = "./togaf/index.html"

html_files = []
for root, dirs, fnames in os.walk("."):
    dirs[:] = [d for d in dirs if d not in (".git",)]
    for fn in fnames:
        if fn.endswith(".html"):
            fp = os.path.join(root, fn)
            if fp not in SKIP:
                html_files.append(fp)

print(f"\n处理 {len(html_files)} 个 HTML 文件...")

# ── 5. 计算相对路径（nav.js 在根目录）─────────────────────────────────────────
def rel_nav_js(filepath):
    depth = filepath.count("/") - 1   # ./ 开头，所以减1
    return "../" * depth + "nav.js"

# ── 6. 需要删除的内联 nav CSS 模式 ────────────────────────────────────────────
# 各页面 <style> 里有大段 nav 相关 CSS，替换为一个注释占位
# 模式：从 /* ── NAV ── */ 或 nav{ 开始的若干规则块
# 策略：保留 <style> 标签，只删除 nav 相关规则
# 为了安全，只删除明确属于 nav 的 CSS 规则集合
# 用标记：每个页面的 nav CSS 块以 .nav-logo 或 nav{ 开头

NAV_CSS_PATTERNS = [
    # 连续的 nav-xxx 规则块
    re.compile(r'/\*[^*]*?NAV[^*]*?\*/.*?(?=\n/\*|\n\.(?!nav)|\Z)', re.DOTALL),
    # 独立 nav 选择器块（可能多个连续）
    re.compile(
        r'(?:^|\n)([ \t]*(?:nav|\.nav-logo|\.nav-links|\.nav-divider|\.nav-project|'
        r'\.nav-dropdown|\.nav-arrow|\.nav-right|\.nav-dd)[^{]*\{[^}]*\})',
        re.MULTILINE
    ),
]

# ── 7. 批量替换 ────────────────────────────────────────────────────────────────
updated = []
skipped_no_nav = []
errors = []

for fp in sorted(html_files):
    with open(fp, encoding="utf-8") as f:
        content = f.read()

    # 是否有 <nav>
    has_nav = bool(re.search(r"<nav\b", content))
    already_done = "site-nav" in content or "nav.js" in content

    if already_done:
        skipped_no_nav.append(fp + " (already)")
        continue

    if not has_nav:
        skipped_no_nav.append(fp + " (no-nav)")
        continue

    # a) 计算相对路径
    nav_js_path = rel_nav_js(fp)

    # b) 替换 <nav>...</nav> 为占位符 + script
    inject = f'<div id="site-nav"></div>\n<script src="{nav_js_path}"></script>'
    new_content = re.sub(r"<nav\b.*?</nav>", inject, content, count=1, flags=re.DOTALL)

    # c) 从 <style> 中删除 nav CSS 规则（按选择器前缀批量删除）
    def remove_nav_css(style_content):
        # 删除所有以 nav, .nav- 开头的 CSS 规则块
        result = re.sub(
            r'\n[ \t]*(?:nav\b|\.nav-logo|\.nav-links|\.nav-divider|\.nav-project'
            r'|\.nav-dropdown|\.nav-arrow|\.nav-right|\.nav-dd)[^\n{]*\{[^{}]*(?:\{[^{}]*\}[^{}]*)?\}',
            '',
            style_content,
            flags=re.DOTALL
        )
        return result

    def replace_style(m):
        cleaned = remove_nav_css(m.group(1))
        if len(cleaned.strip()) < 10:
            return ""  # style 块全空则删除
        return f"<style>{cleaned}</style>"

    new_content = re.sub(r"<style>(.*?)</style>", replace_style, new_content, flags=re.DOTALL)

    if new_content != content:
        with open(fp, "w", encoding="utf-8") as f:
            f.write(new_content)
        updated.append(fp)
    else:
        errors.append(fp + " (no change)")

print(f"\n✅ 更新: {len(updated)} 个文件")
print(f"⚠️  跳过: {len(skipped_no_nav)} 个")
if errors:
    print(f"❌ 无变化: {len(errors)} 个: {errors[:3]}")

# ── 8. 特殊处理 togaf/index.html ─────────────────────────────────────────────
with open(TOGAF_WRAPPER, encoding="utf-8") as f:
    tog = f.read()

if "site-nav" not in tog:
    tog_new = re.sub(
        r"<nav\b.*?</nav>",
        '<div id="site-nav"></div>\n<script src="../nav.js"></script>',
        tog, count=1, flags=re.DOTALL
    )
    # 删掉包装页里内联的大段 nav CSS
    tog_new = re.sub(r"<style>(.*?)</style>",
        lambda m: "" if len(remove_nav_css(m.group(1)).strip()) < 20
                  else f"<style>{remove_nav_css(m.group(1))}</style>",
        tog_new, flags=re.DOTALL)
    with open(TOGAF_WRAPPER, "w", encoding="utf-8") as f:
        f.write(tog_new)
    print(f"✅ togaf/index.html 也已更新")

print("\n样本验证:")
for fp in updated[:3]:
    with open(fp, encoding="utf-8") as f:
        c = f.read()
    has_placeholder = "site-nav" in c
    has_script = "nav.js" in c
    has_old_nav = bool(re.search(r"<nav\b", c))
    print(f"  {fp}: placeholder={'✅' if has_placeholder else '❌'} "
          f"script={'✅' if has_script else '❌'} "
          f"old-nav={'❌ 残留' if has_old_nav else '✅ 已删'}")
