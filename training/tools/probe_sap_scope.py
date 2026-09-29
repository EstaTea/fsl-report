#!/usr/bin/env python3
"""一次性探测脚本：抓下页面自己发出的实体集请求（含完整 query），
然后在业务 frame 内逐个试变体，找出能返回 200 的调用姿势。
结果写入 data/training/sap-scope/_probe.json 供 fetch_sap_scope.py 参考。
"""
import io, json, os, sys, time
from playwright.sync_api import sync_playwright

ENTITY = 'SolutionProcessForGlobalSearchWithUBCM'
ENTRY_URL = ('https://me.sap.com/processnavigator/globalSearch'
             '?isFrom=BusinessProcess&sid-kname=&ssSIds=')
PROFILE = os.path.expanduser('~/.workbuddy/sap-pn-profile')
HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.abspath(os.path.join(HERE, '..', '..', 'data', 'training', 'sap-scope'))
os.makedirs(OUT_DIR, exist_ok=True)

full_urls, req_headers = [], {}

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(
        PROFILE, headless=False, viewport={'width': 1440, 'height': 900})
    pg = ctx.pages[0] if ctx.pages else ctx.new_page()

    def on_req(req):
        if ENTITY in req.url:
            req_headers['h'] = {k: v for k, v in req.headers.items()
                                if k.lower() in ('accept', 'x-csrf-token', 'sap-contextid',
                                                 'sap-ui-language', 'x-requested-with', 'content-type')}

    def on_resp(resp):
        if ENTITY in resp.url and len(full_urls) < 6:
            full_urls.append(resp.url)

    pg.on('request', on_req)
    pg.on('response', on_resp)
    pg.goto(ENTRY_URL, wait_until='domcontentloaded', timeout=90000)
    pg.wait_for_timeout(30000)

    frames = [f for f in pg.frames if f is not pg.main_frame and 'alm' in f.url] or \
             [f for f in pg.frames if f is not pg.main_frame]
    fr = frames[0]
    print('frame:', fr.url[:100], flush=True)
    print('--- 页面自己发的请求（完整 URL）---', flush=True)
    for u in full_urls:
        print(' ', u[:400], flush=True)
    print('--- 请求头 ---', json.dumps(req_headers.get('h', {}), ensure_ascii=False), flush=True)

    base = full_urls[0].split('?')[0] if full_urls else None
    if not base:
        ctx.close(); raise SystemExit('未捕获到请求')

    base_q = full_urls[0].split('?', 1)[1] if '?' in full_urls[0] else ''
    variants = [
        ('页面原始 query 原样', base + ('?' + base_q if base_q else '')),
        ('base + $top=5', base + '?$top=5'),
        ('base + $top=5&$count=true', base + '?$top=5&$count=true'),
        ('base + $format=json&$top=5', base + '?$format=json&$top=5'),
        ('base + $top=5&$select=solutionProcessStableId,name', base + '?$top=5&$select=solutionProcessStableId,name'),
        ('base 无参', base),
    ]
    results = []
    for label, url in variants:
        r = fr.evaluate("""async (u) => {
            try {
                const resp = await fetch(u, {headers: {Accept: 'application/json'}});
                const t = await resp.text();
                return {status: resp.status, head: t.slice(0, 300)};
            } catch(e) { return {status: 0, head: 'ERR:' + String(e).slice(0,200)}; }
        }""", url)
        print('[%s] status=%s -> %s' % (label, r['status'], r['head'][:220]), flush=True)
        results.append({'label': label, 'url': url, 'status': r['status'], 'head': r['head']})
        time.sleep(0.5)

    ctx.close()

json.dump({'captured': full_urls, 'headers': req_headers.get('h', {}), 'results': results},
          io.open(os.path.join(OUT_DIR, '_probe.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
print('probe saved', flush=True)
