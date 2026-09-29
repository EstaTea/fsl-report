#!/usr/bin/env python3
"""探测「解决方案流程详情页」的数据接口。

做法：打开一个条目的详情页（globalSearch?sid-kname=<编号>），
监听页面 60 秒内发出的所有 odata/v4 请求，归类打印实体集与完整 query，
再用业务 frame 试抓一次样例确认响应结构。

用法：python3 probe_detail.py [externalId]   # 默认 1I9
"""
import io
import json
import os
import sys
import time
from collections import OrderedDict

from playwright.sync_api import sync_playwright

EXT = sys.argv[1] if len(sys.argv) > 1 else '1I9'
ENTRY = ('https://me.sap.com/processnavigator/globalSearch'
         '?isFrom=BusinessProcess&sid-kname=' + EXT)
PROFILE = os.path.expanduser('~/.workbuddy/sap-pn-profile')
HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.abspath(os.path.join(HERE, '..', '..', 'data', 'training', 'sap-scope'))
os.makedirs(OUT_DIR, exist_ok=True)

seen = OrderedDict()          # url(base?query sorted) -> sample

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(
        PROFILE, headless=False, viewport={'width': 1440, 'height': 900})
    pg = ctx.pages[0] if ctx.pages else ctx.new_page()

    def on_resp(resp):
        u = resp.url
        if '/odata/v4/' not in u and '/odata/' not in u:
            return
        if '?' in u:
            base, q = u.split('?', 1)
            # 归一化：去掉 $skip/$top 值差异，保留参数名顺序
            parts = sorted(x for x in q.split('&') if not x.startswith(('$skip=', '$top=')))
            key = base + '|' + '&'.join(parts)
        else:
            key, base, q = u, u, ''
        if key not in seen:
            seen[key] = {'base': base, 'query': q, 'status': resp.status, 'url': u}

    pg.on('response', on_resp)
    pg.goto(ENTRY, wait_until='domcontentloaded', timeout=90000)
    pg.wait_for_timeout(30000)
    print('[nav] url:', pg.url[:120], flush=True)

    # 如果页面停在搜索结果而不是详情页，尝试点击「更多」打开详情侧栏
    frames = [f for f in pg.frames if f is not pg.main_frame and 'alm' in f.url] or \
             [f for f in pg.frames if f is not pg.main_frame]
    fr = frames[0]
    print('[frame]', fr.url[:100], flush=True)
    clicked = fr.evaluate("""() => {
        const links = Array.from(document.querySelectorAll('a,button,[role="button"]'));
        const t = links.find(a => /更\\s*多|More/.test(a.textContent || ''));
        if (t) { t.click(); return true; }
        return false;
    }""")
    print('[click 更多]', clicked, flush=True)
    pg.wait_for_timeout(25000)

    ctx.close()

print('--- 捕获到 %d 类请求 ---' % len(seen), flush=True)
for k, v in seen.items():
    print('[%s] %s?%s' % (v['status'], v['base'][:160], v['query'][:220]), flush=True)

json.dump(list(seen.values()),
          io.open(os.path.join(OUT_DIR, '_probe_detail.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
print('saved -> _probe_detail.json', flush=True)
