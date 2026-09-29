#!/usr/bin/env python3
"""拉取 Process Navigator 各 OData 服务的 $metadata，列出实体集与函数。
输出 data/training/sap-scope/_metadata_<svc>.xml + 控制台摘要。
"""
import os
import re
import sys
import time

from playwright.sync_api import sync_playwright

PROFILE = os.path.expanduser('~/.workbuddy/sap-pn-profile')
HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.abspath(os.path.join(HERE, '..', '..', 'data', 'training', 'sap-scope'))
os.makedirs(OUT_DIR, exist_ok=True)

SERVICES = ['PnDataService', 'BCMService', 'EAXService']
ENTRY = ('https://me.sap.com/processnavigator/globalSearch'
         '?isFrom=BusinessProcess&sid-kname=')

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(
        PROFILE, headless=False, viewport={'width': 1440, 'height': 900})
    pg = ctx.pages[0] if ctx.pages else ctx.new_page()
    pg.goto(ENTRY, wait_until='domcontentloaded', timeout=90000)
    pg.wait_for_timeout(25000)
    if '/login' in pg.url or 'accounts.sap.com' in pg.url:
        print('[!] 未登录，请完成 SAP 登录...', flush=True)
        for _ in range(180):
            pg.wait_for_timeout(2000)
            if 'processnavigator' in pg.url:
                break
        pg.wait_for_timeout(20000)
    frames = [f for f in pg.frames if f is not pg.main_frame and 'alm' in f.url] or \
             [f for f in pg.frames if f is not pg.main_frame]
    fr = frames[0]

    for svc in SERVICES:
        url = ('https://pr.alm.me.sap.com/ui/earl-pn-ui/v1/odata/v4/%s/$metadata?sap-language=EN'
               % svc)
        r = fr.evaluate("""async (u) => {
            try {
                const resp = await fetch(u, {headers: {Accept: 'application/xml'}});
                return {status: resp.status, text: await resp.text()};
            } catch(e) { return {status: 0, text: 'ERR:' + String(e)}; }
        }""", url)
        path = os.path.join(OUT_DIR, '_metadata_%s.xml' % svc)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(r['text'])
        print('[%s] status=%s size=%d -> %s' % (svc, r['status'], len(r['text']), path), flush=True)
        if r['status'] == 200:
            sets = re.findall(r'EntitySet Name="([^"]+)"', r['text'])
            funcs = re.findall(r'<Function Name="([^"]+)"', r['text'])
            print('  EntitySets(%d): %s' % (len(sets), ', '.join(sets)), flush=True)
            print('  Functions(%d): %s' % (len(funcs), ', '.join(funcs)), flush=True)
        time.sleep(0.5)
    ctx.close()
