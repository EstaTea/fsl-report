"""重建 dashboard/佛山照明数据大屏_单文件.html：
CSS/JS 内联、媒体转 base64、china.json 以 window.__CHINA_GEO__ 内嵌并替换 fetch。"""
import base64, os, re

ROOT = '/Users/I523899/fsl-report/dashboard'
SRC = os.path.join(ROOT, 'index.html')
OUT = os.path.join(ROOT, '佛山照明数据大屏_单文件.html')

MIME = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.gif': 'image/gif', '.webp': 'image/webp', '.mp4': 'video/mp4',
        '.webm': 'video/webm', '.svg': 'image/svg+xml'}

html = open(SRC, encoding='utf-8').read()

def data_uri(rel):
    ext = os.path.splitext(rel)[1].lower()
    b = base64.b64encode(open(os.path.join(ROOT, rel), 'rb').read()).decode('ascii')
    return 'data:%s;base64,%s' % (MIME.get(ext, 'application/octet-stream'), b)

# 1) CSS 内联
def inline_css(m):
    css = open(os.path.join(ROOT, m.group(1)), encoding='utf-8').read()
    return '<style>\n' + css + '\n</style>'
html = re.sub(r'<link rel="stylesheet" href="(assets/[^"]+)">', inline_css, html)

# 2) JS 内联；dashboard.js 的地图 fetch 换成内嵌对象
def inline_js(m):
    js = open(os.path.join(ROOT, m.group(1)), encoding='utf-8').read()
    if m.group(1).endswith('dashboard.js'):
        old = "fetch('assets/china.json').then(function (r) { return r.json(); }).then(function (g) {"
        new = "Promise.resolve(window.__CHINA_GEO__).then(function (g) {"
        assert old in js, 'china fetch patch anchor not found in dashboard.js'
        js = js.replace(old, new)
    return '<script>\n' + js + '\n</script>'
html = re.sub(r'<script src="(assets/[^"]+)"></script>', inline_js, html)

# 3) 媒体引用 → data URI（仅限图片/视频扩展名，避免误伤脚本）
html = re.sub(r'((?:src|poster)=")(assets/[^"]+\.(?:png|jpe?g|gif|webp|mp4|webm|svg))(")',
              lambda m: m.group(1) + data_uri(m.group(2)) + m.group(3), html)

# 4) 注入中国地图 GeoJSON（置于最后一个 <script> 之前）
geo = open(os.path.join(ROOT, 'assets/china.json'), encoding='utf-8').read()
geo_tag = '<script>window.__CHINA_GEO__ = ' + geo + ';</script>\n'
idx = html.rfind('<script>')
assert idx > 0, 'no script tag found'
html = html[:idx] + geo_tag + html[idx:]

# 残留外部引用自检
leftover = re.findall(r'(?:src|poster|href)="assets/[^"]+"', html)
assert not leftover, 'leftover external refs: %s' % leftover[:5]

open(OUT, 'w', encoding='utf-8').write(html)
print('OK ->', OUT)
print('size:', round(os.path.getsize(OUT) / 1024 / 1024, 2), 'MB')
