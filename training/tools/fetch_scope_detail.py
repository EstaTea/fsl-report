#!/usr/bin/env python3
"""全量抓取 Private Edition 2025-FPS1 每条解决方案流程的详情。

数据落位（全部进仓库，不碰 /tmp）：
    data/training/sap-scope/private-detail/<externalId>/detail.json   正文+流程+能力+BOM清单
    data/training/sap-scope/private-detail/<externalId>/diagrams/*.svg|.bpmn|.json
    data/training/sap-scope/private-detail/_state.json               断点续抓状态

每条请求清单：
  1 EAXService/SolutionProcess(<guid>)                      正文 HTML（英文原文）
  2 EAXService/SolutionProcessTranslated?entityId+zh-CN     中文改写描述（SAP 官方中文）
  3 EAXService/SolutionProcess2SolutionProcessFLow          流程 GUID 关联
  4 EAXService/SolutionProcessFlow(<guid>)                  流程名称/描述
  5 EAXService/SolutionProcessFlowDiagram?spf_ID            流程图 SVG/BPMN/JSON 原文
  6 BCMService/SolutionProcess2SolutionCapability           业务能力层级（BCM，zh-CN）
  7 EAXService/BomItemWithUrl?parentEntityId                BOM 资产清单（名称/类型/URL）

用法：
    fetch_scope_detail.py            # 全量续抓（自动跳过已完成）
    fetch_scope_detail.py --limit 2  # 只抓 2 条试跑
"""
import argparse
import base64
import io
import json
import os
import re
import time

from playwright.sync_api import sync_playwright

PROFILE = os.path.expanduser('~/.workbuddy/sap-pn-profile')
HERE = os.path.dirname(os.path.abspath(__file__))
SCOPE_DIR = os.path.abspath(os.path.join(HERE, '..', '..', 'data', 'training', 'sap-scope'))
DETAIL_DIR = os.path.join(SCOPE_DIR, 'private-detail')
STATE_PATH = os.path.join(DETAIL_DIR, '_state.json')
EAX = 'https://pr.alm.me.sap.com/ui/earl-pn-ui/v1/odata/v4/EAXService'
BCM = 'https://pr.alm.me.sap.com/ui/earl-pn-ui/v1/odata/v4/BCMService'

os.makedirs(DETAIL_DIR, exist_ok=True)

JS_FETCH = """async (u) => {
    try {
        const resp = await fetch(u, {headers: {Accept: 'application/json'}});
        if (!resp.ok) return {status: resp.status, err: (await resp.text()).slice(0, 200)};
        return {status: 200, data: await resp.json()};
    } catch(e) { return {status: 0, err: String(e).slice(0, 200)}; }
}"""


def load_state():
    if os.path.exists(STATE_PATH):
        return json.load(io.open(STATE_PATH, encoding='utf-8'))
    return {'done': {}, 'failed': {}}


def save_state(st):
    json.dump(st, io.open(STATE_PATH, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


def fetch_json(fr, url, retry=2):
    for i in range(retry + 1):
        r = fr.evaluate(JS_FETCH, url)
        if r.get('status') == 200:
            return r.get('data')
        time.sleep(1.2 * (i + 1))
    print('    [fail] %s -> %s %s' % (url[:120], r.get('status'), r.get('err', '')[:80]), flush=True)
    return None


def guid(s):
    return s  # filter 直接用裸 GUID（Edm.Guid 类型不能加引号）


def crawl_item(fr, it):
    ext = it['externalId']
    g = it['solutionProcessId']
    d = {'externalId': ext, 'id': it['id'], 'name': it['name'],
         'solutionProcessId': g, 'targetRelease': it['targetRelease'],
         'countries': it['countries'], 'mod': it.get('mod'), 'tier': it.get('tier')}

    # 1. 正文（英文原文 HTML）
    sp = fetch_json(fr, '%s/SolutionProcess(%s)?$select=name,description,externalId,stableId,businessId,displayVersion,changeCategory' % (EAX, g))
    if not sp:
        raise RuntimeError('SolutionProcess 键读失败')
    d['name_en'] = sp.get('name')
    d['description_en_html'] = sp.get('description')

    # 2. SAP 官方中文描述
    tr = fetch_json(fr, "%s/SolutionProcessTranslated?$filter=entityId%%20eq%%20%s%%20and%%20lanCode%%20eq%%20%%27zh-CN%%27" % (EAX, g))
    d['description_zh_html'] = None
    if tr and tr.get('value'):
        d['description_zh_html'] = tr['value'][0].get('description')
        d['name_zh'] = tr['value'][0].get('name')

    # 3-5. 流程 + 图
    flows = []
    rel = fetch_json(fr, '%s/SolutionProcess2SolutionProcessFLow?$filter=solutionProcess_ID%%20eq%%20%s' % (EAX, g))
    os.makedirs(os.path.join(DETAIL_DIR, ext, 'diagrams'), exist_ok=True)
    for row in (rel or {}).get('value', []):
        fg = row.get('solutionProcessFlow_ID')
        if not fg:
            continue
        fl = fetch_json(fr, '%s/SolutionProcessFlow(%s)?$select=name,description,stableId' % (EAX, fg))
        fl_d = {'id': fg, 'stableId': (fl or {}).get('stableId'),
                'name': (fl or {}).get('name'), 'description': (fl or {}).get('description'),
                'diagrams': []}
        dg = fetch_json(fr, '%s/SolutionProcessFlowDiagram?$select=name,stableId,diagramContentSvg,diagramContentBpmn,diagramContentJson&$filter=spf_ID%%20eq%%20%s' % (EAX, fg))
        for k, diagram in enumerate((dg or {}).get('value', [])):
            dn = diagram.get('name') or ('diagram-%d' % k)
            safe = re.sub(r'[^\w\-\u4e00-\u9fff]+', '_', dn)[:60]
            fl_d['diagrams'].append({'name': dn, 'stableId': diagram.get('stableId')})
            svg = diagram.get('diagramContentSvg')
            if svg:
                ext_name = 'diagrams/%s__%d.svg' % (safe, k)
                io.open(os.path.join(DETAIL_DIR, ext, ext_name), 'w', encoding='utf-8').write(svg)
            bpmn = diagram.get('diagramContentBpmn')
            if bpmn:
                io.open(os.path.join(DETAIL_DIR, ext, 'diagrams/%s__%d.bpmn' % (safe, k)), 'w', encoding='utf-8').write(bpmn)
            dj = diagram.get('diagramContentJson')
            if dj:
                io.open(os.path.join(DETAIL_DIR, ext, 'diagrams/%s__%d.json' % (safe, k)), 'w', encoding='utf-8').write(dj)
        flows.append(fl_d)
    d['flows'] = flows

    # 6. 业务能力层级（BCM，中文）
    cap = fetch_json(fr, "%s/SolutionProcess2SolutionCapability?$filter=solutionProcess_ID%%20eq%%20%s%%20and%%20lanCode%%20eq%%20%%27zh-CN%%27" % (BCM, g))
    caps, seen_cap = [], set()
    for row in (cap or {}).get('value', []):
        k = row.get('scId') or row.get('bcmName')
        if k in seen_cap:
            continue
        seen_cap.add(k)
        caps.append({kk: row.get(kk) for kk in ('edName', 'bdName', 'baName', 'bcName', 'bcmName', 'scId', 'scStableEaId')})
    d['capabilities'] = caps

    # 7. BOM 资产清单（二进制下载需账号权限，这里只拿清单）
    bom = fetch_json(fr, '%s/BomItemWithUrl?$filter=parentEntityId%%20eq%%20%s&$top=200' % (EAX, g))
    d['bom'] = [{'name': b.get('name'), 'bomType': b.get('bomType'), 'url': b.get('url')}
                for b in (bom or {}).get('value', [])]
    return d


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--limit', type=int, default=0)
    args = ap.parse_args()

    idx = json.load(io.open(os.path.join(SCOPE_DIR, 'index-private.json'), encoding='utf-8'))
    items = idx['items']
    st = load_state()
    todo = [i for i in items if i['externalId'] not in st['done']]
    if args.limit:
        todo = todo[:args.limit]
    print('[plan] 总 %d / 待抓 %d（已完成 %d，失败 %d）'
          % (len(items), len(todo), len(st['done']), len(st['failed'])), flush=True)

    if not todo:
        print('[done] 无待抓条目', flush=True)
        return

    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            PROFILE, headless=False, viewport={'width': 1440, 'height': 900})
        pg = ctx.pages[0] if ctx.pages else ctx.new_page()
        ok = False
        for attempt in range(3):
            try:
                pg.goto('https://me.sap.com/processnavigator/globalSearch?isFrom=BusinessProcess&sid-kname=',
                        wait_until='domcontentloaded', timeout=150000)
                ok = True
                break
            except Exception as e:
                print('[retry nav %d] %s' % (attempt + 1, str(e)[:100]), flush=True)
                time.sleep(5)
        if not ok:
            ctx.close()
            raise SystemExit('导航超时，稍后重跑（状态已落盘，可断点续抓）')
        pg.wait_for_timeout(25000)
        if '/login' in pg.url or 'accounts.sap.com' in pg.url:
            print('[!] 未登录，请在弹出的浏览器完成 SAP 登录...', flush=True)
            for _ in range(180):
                pg.wait_for_timeout(2000)
                if 'processnavigator' in pg.url:
                    break
            pg.wait_for_timeout(20000)
        frames = [f for f in pg.frames if f is not pg.main_frame and 'alm' in f.url] or \
                 [f for f in pg.frames if f is not pg.main_frame]
        fr = frames[0]

        t0 = time.time()
        for n, it in enumerate(todo):
            ext = it['externalId']
            try:
                d = crawl_item(fr, it)
                json.dump(d, io.open(os.path.join(DETAIL_DIR, ext, 'detail.json'), 'w', encoding='utf-8'),
                          ensure_ascii=False, indent=1)
                st['done'][ext] = time.strftime('%Y-%m-%d %H:%M:%S')
                if ext in st['failed']:
                    del st['failed'][ext]
                n_flow = len(d.get('flows', []))
                n_diag = sum(len(f['diagrams']) for f in d.get('flows', []))
                print('[%d/%d] %s ok  flows=%d diagrams=%d bom=%d zh=%s  (%.0fs 累计)'
                      % (n + 1, len(todo), ext, n_flow, n_diag, len(d.get('bom', [])),
                         bool(d.get('description_zh_html')), time.time() - t0), flush=True)
            except Exception as e:
                st['failed'][ext] = str(e)[:200]
                print('[%d/%d] %s FAIL: %s' % (n + 1, len(todo), ext, str(e)[:120]), flush=True)
            if (n + 1) % 5 == 0:
                save_state(st)
            time.sleep(0.35)
        save_state(st)
        ctx.close()
    print('[done] 完成 %d，失败 %d -> %s' % (len(st['done']), len(st['failed']), STATE_PATH), flush=True)


if __name__ == '__main__':
    main()
