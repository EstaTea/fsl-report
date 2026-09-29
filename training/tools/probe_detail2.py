#!/usr/bin/env python3
"""探测详情面板真实请求：打开搜索结果，点击条目「更多」打开详情抽屉，
监听所有 EAXService/BCMService/PnDataService 的数据请求（排除静态资源），
完整打印 URL（含参数格式），并抓取其中 2 个响应当样例。
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
OUT_DIR = '/Users/I523899/fsl-report/data/training/sap-scope'

seen = OrderedDict()   # normalized url -> {'url': first_full, 'status': ..}
samples = {}           # normalized url -> body text (max 200KB)


def norm(u):
    base, _, q = u.partition('?')
    parts = sorted(x for x in q.split('&') if not x.startswith(('$skip=', '$top=')))
    return base + '?' + '&'.join(parts) if q else base


with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(
        PROFILE, headless=False, viewport={'width': 1440, 'height': 900})
    pg = ctx.pages[0] if ctx.pages else ctx.new_page()

    def on_resp(resp):
        u = resp.url
        if not any(s in u for s in ('EAXService/', 'BCMService/', 'PnDataService/')):
            return
        if '$metadata' in u:
            return
        k = norm(u)
        if k not in seen:
            seen[k] = {'url': u, 'status': resp.status}
            try:
                ct = resp.headers.get('content-type', '')
                if 'json' in ct or 'xml' in ct:
                    samples[k] = resp.text()[:200000]
            except Exception:
                pass

    pg.on('response', on_resp)
    pg.goto(ENTRY, wait_until='domcontentloaded', timeout=120000)
    pg.wait_for_timeout(28000)
    frames = [f for f in pg.frames if f is not pg.main_frame and 'alm' in f.url] or \
             [f for f in pg.frames if f is not pg.main_frame]
    fr = frames[0]
    print('[frame]', fr.url[:100], flush=True)

    # 点条目名称链接打开详情（列表第一行的链接，通常是 <a> 或带 role=link）
    clicked = fr.evaluate("""() => {
        const links = Array.from(document.querySelectorAll('a,[role="link"],[role="button"]'));
        const t = links.find(a => /更\\s*多|More/.test((a.textContent||'').trim())
                                 && (a.textContent||'').trim().length < 8)
                || links.find(a => /更\\s*多/.test(a.textContent||''));
        if (t) { t.click(); return t.textContent.trim().slice(0,30); }
        return null;
    }""")
    print('[click]', clicked, flush=True)
    pg.wait_for_timeout(30000)
    # 详情抽屉里可能还有子区块（流程图/BOM）需要点开，随便滚一下再等
    pg.keyboard.press('End')
    pg.wait_for_timeout(8000)
    ctx.close()

print('--- %d 类数据请求 ---' % len(seen), flush=True)
for k, v in seen.items():
    print('[%s] %s' % (v['status'], v['url'][:300]), flush=True)

json.dump({'requests': list(seen.values()), 'samples': samples},
          io.open(os.path.join(OUT_DIR, '_probe_detail2.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
print('saved -> _probe_detail2.json', flush=True)
