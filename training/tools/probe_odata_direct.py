#!/usr/bin/env python3
"""直接试调 OData：验证 per-item 详情的取数姿势（用 1I9 当样例）。
逐个尝试键读 / 关联过滤 / 下载函数，打印 status + 响应头部。
"""
import json
import os
import time

from playwright.sync_api import sync_playwright

PROFILE = os.path.expanduser('~/.workbuddy/sap-pn-profile')
OUT_DIR = '/Users/I523899/fsl-report/data/training/sap-scope'
EAX = 'https://pr.alm.me.sap.com/ui/earl-pn-ui/v1/odata/v4/EAXService'
BCM = 'https://pr.alm.me.sap.com/ui/earl-pn-ui/v1/odata/v4/BCMService'

# 1I9 主数据（来自 index-private.json）
idx = json.load(open(os.path.join(OUT_DIR, 'index-private.json'), encoding='utf-8'))
it = next(i for i in idx['items'] if i['externalId'] == '1I9')
GUID = it['solutionProcessId']
SID = it['id']
print('sample:', it['externalId'], SID, GUID, it['countries'][:5], flush=True)

CASES = [
    ('SP 键读', EAX + "/SolutionProcess(%s)" % GUID),
    ('SP 键读+描述', EAX + "/SolutionProcess(%s)?$select=name,description,externalId,stableId" % GUID),
    ('SP2Flow 关联', EAX + "/SolutionProcess2SolutionProcessFLow?$top=5&$filter=solutionProcess_ID%%20eq%%20%s" % GUID),
    ('Flow 关联2', EAX + "/AssignmentSolutionProcess2Flow?$top=5&$filter=solutionProcess_ID%%20eq%%20%s" % GUID),
    ('BomItem parent', EAX + "/BomItemWithUrl?$top=5&$filter=parentEntityId%%20eq%%20%%27%s%%27" % GUID),
    ('BomItem stable', EAX + "/BomItemWithUrl?$top=5&$filter=stableId%%20eq%%20%%27%s%%27" % SID),
    ('下载函数 CN', EAX + "/getDownloadUrlByStableIdAndCountry(stableId='%s',country='CN',targetRelease='2025-FPS1')" % SID),
    ('下载函数 US', EAX + "/getDownloadUrlByStableIdAndCountry(stableId='%s',country='US',targetRelease='2025-FPS1')" % SID),
    ('BOM下载函数', EAX + "/downloadSolutionProcessBom(entityIds='%s')" % SID),
    ('翻译内容', EAX + "/SolutionProcessTranslated?$top=3&$filter=externalId%%20eq%%20%%27%s%%27" % it['externalId']),
]

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(
        PROFILE, headless=False, viewport={'width': 1440, 'height': 900})
    pg = ctx.pages[0] if ctx.pages else ctx.new_page()
    pg.goto('https://me.sap.com/processnavigator/globalSearch?isFrom=BusinessProcess&sid-kname=',
            wait_until='domcontentloaded', timeout=120000)
    pg.wait_for_timeout(25000)
    frames = [f for f in pg.frames if f is not pg.main_frame and 'alm' in f.url] or \
             [f for f in pg.frames if f is not pg.main_frame]
    fr = frames[0]
    results = []
    for label, url in CASES:
        r = fr.evaluate("""async (u) => {
            try {
                const resp = await fetch(u, {headers: {Accept: 'application/json'}});
                const t = await resp.text();
                return {status: resp.status, head: t.slice(0, 600)};
            } catch(e) { return {status: 0, head: 'ERR:' + String(e).slice(0,200)}; }
        }""", url)
        print('\n== %s [%s]\n   %s\n   %s' % (label, r['status'], url[:180], r['head'][:500]), flush=True)
        results.append({'label': label, 'url': url, 'status': r['status'], 'head': r['head']})
        time.sleep(0.4)
    ctx.close()

json.dump(results, open(os.path.join(OUT_DIR, '_probe_odata_direct.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
print('\nsaved -> _probe_odata_direct.json', flush=True)
