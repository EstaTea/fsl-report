#!/usr/bin/env python3
"""从 SAP Signavio Process Navigator 抓取「解决方案流程」清单。

用法：
    python3 fetch_sap_scope.py                 # 全量抓取（默认 2608 / 中国 / Cloud Public Edition）
    python3 fetch_sap_scope.py --no-browser    # 只做本地过滤，用已存在的 _raw_all.json

设计要点（踩过的坑，改前先读）：
1. me.sap.com/processnavigator 是 SPA 壳，数据接口必须 SAP 登录；未登录会跳 SSO。
   登录态靠 persistent context（默认 ~/.workbuddy/sap-pn-profile）复用，过期时需人工登录一次。
2. 真实业务内容在 iframe（pr.alm.me.sap.com）内，UI5 + OData v4。
   **请求必须在该业务 frame 内发**，否则 CORS 拒绝。
3. 服务根 URL 每次可能变，所以先「监听页面自己发的请求」探出实体集的完整 URL，再自己分页。
4. 组合 $filter 下 $count 返回 0 不可信 —— 因此**不做服务端过滤**，
   而是把实体集全量拉下来（约 4651 条），再用 Python 本地过滤，避免 OData 过滤语法猜测风险。
5. 分页终止条件：某页返回条数 < $top。
6. **`$filter=lanCode eq 'zh-CN'` 是必填参数** —— 缺了服务端直接 500（Internal server error），
   连 `$top` 单独用都报错。页面自己发的是：
   `?$count=true&$filter=lanCode%20eq%20%27zh-CN%27&$skip=0&$top=20`
   所以过滤条件一律挂在这个 lanCode 条件后面，或干脆全量拉再本地过滤。
7. 服务根（2026-09 实测）：
   https://pr.alm.me.sap.com/ui/earl-pn-ui/v1/odata/v4/BCMService/SolutionProcessForGlobalSearchWithUBCM
   GET 不需要 x-csrf-token，带 `Accept: application/json` 即可。
"""

import argparse
import io
import json
import os
import sys
import time

from playwright.sync_api import sync_playwright

ENTITY = 'SolutionProcessForGlobalSearchWithUBCM'
ENTRY_URL = ('https://me.sap.com/processnavigator/globalSearch'
             '?isFrom=BusinessProcess&sid-kname=&ssSIds=')
PROFILE = os.path.expanduser('~/.workbuddy/sap-pn-profile')
HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.abspath(os.path.join(HERE, '..', '..', 'data', 'training', 'sap-scope'))

# 目标筛选条件（本地过滤用）
# 注意：solutionScenarioName 的完整取值带「SAP Best Practices for 」前缀，
# UI 上显示的是简称（DOM 文本），aria 才是全称 —— 用简称匹配会得到 0 条。
PUBLIC = 'SAP Best Practices for SAP S/4HANA Cloud Public Edition'
PRIVATE = 'SAP Best Practices for SAP S/4HANA Cloud Private Edition'

TARGETS = [
    # 主键 = 用户在 SAP 界面筛出来的那一份（2608 / 中国 / Public），实测 621 条
    {'file': 'index.json', 'scenario': PUBLIC, 'release': '2608', 'country': '中国',
     'label': 'SAP S/4HANA Cloud Public Edition 2608（中国）', 'primary': True},
    # 对照 = Private Edition 最新可用版本（佛照若走 Private/On-Prem，用这份对齐）
    {'file': 'index-private.json', 'scenario': PRIVATE, 'release': '2025-FPS1', 'country': '中国',
     'label': 'SAP S/4HANA Cloud Private Edition 2025 FPS1（中国）', 'primary': False},
]


# 瘦身：只保留网页真正要用的字段。
# spCountries 每条带 59 个国家对象（约 26KB/条），是 index.json 膨胀到 10MB 的元凶，必须丢掉。
# bd/ba/bc/sc 等能力层级字段在这份数据里 100% 为空，也一并丢掉。
SLIM_FIELDS = ['solutionProcessStableId', 'externalId', 'name', 'targetRelease',
               'integration', 'setUpInstructions', 'countryCodeText']


def slim(items):
    out = []
    for i in items:
        o = {k: i.get(k) for k in SLIM_FIELDS}
        o['id'] = o.pop('solutionProcessStableId')
        codes = [c.strip() for c in (i.get('countryCodeText') or '').split(',') if c.strip()]
        o.pop('countryCodeText', None)
        o['countries'] = codes
        o['cn'] = 'CN' in codes       # 本清单已按中国筛过，保留标志位便于复用
        o['global'] = len(codes) > 5  # 多国通用 vs 少数国家
        out.append(o)
    return out


def ensure_out():
    os.makedirs(OUT_DIR, exist_ok=True)


def discover_and_fetch(top=200, max_pages=80, wait_ms=25000):
    """打开页面 → 监听请求探出服务根 URL → 在业务 frame 内分页全量抓取。"""
    captured = {'url': None}

    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            PROFILE, headless=False,
            viewport={'width': 1440, 'height': 900},
            args=['--disable-blink-features=AutomationControlled'])
        pg = ctx.pages[0] if ctx.pages else ctx.new_page()

        def on_resp(resp):
            u = resp.url
            if ENTITY in u and captured['url'] is None:
                captured['url'] = u.split('?')[0]
                print('[discover] 实体集 URL:', captured['url'], flush=True)

        pg.on('response', on_resp)
        pg.goto(ENTRY_URL, wait_until='domcontentloaded', timeout=90000)
        print('[nav] 已打开，等待 UI5 加载 %dms ...' % wait_ms, flush=True)
        pg.wait_for_timeout(wait_ms)

        if '/login' in pg.url or 'accounts.sap.com' in pg.url or 'SSO' in pg.url:
            print('[!] 未登录，已跳转到登录页：', pg.url[:120], flush=True)
            print('[!] 请在弹出的浏览器里完成 SAP 登录，脚本继续等待...', flush=True)
            for _ in range(180):          # 最多等 6 分钟
                pg.wait_for_timeout(2000)
                if 'processnavigator' in pg.url:
                    break
            pg.wait_for_timeout(wait_ms)

        # 业务 frame：含 alm 且非主 frame
        frames = [f for f in pg.frames if f is not pg.main_frame and 'alm' in f.url]
        if not frames:
            frames = [f for f in pg.frames if f is not pg.main_frame]
        print('[frame] 候选业务 frame:', [f.url[:80] for f in frames][:3], flush=True)
        fr = frames[0]

        if captured['url'] is None:
            print('[discover] 未在响应里捕获到 %s，尝试从页面 UI5 模型反查' % ENTITY, flush=True)
            got = fr.evaluate("""() => {
                try {
                    const out = [];
                    const walk = (o, d) => {
                        if (!o || d > 6) return;
                        if (typeof o.sServiceUrl === 'string') out.push(o.sServiceUrl);
                        for (const k of Object.keys(o)) { try { walk(o[k], d+1); } catch(e){} }
                    };
                    walk(window, 0);
                    return Array.from(new Set(out)).slice(0, 10);
                } catch(e) { return ['ERR:' + String(e).slice(0,120)]; }
            }""")
            print('[discover] sServiceUrl 候选:', got, flush=True)
            for u in got:
                if isinstance(u, str) and u.startswith('http'):
                    captured['url'] = u.rstrip('/') + '/' + ENTITY
                    break

        if captured['url'] is None:
            ctx.close()
            raise SystemExit('未能定位服务根 URL，请人工确认页面是否已正常加载。')

        base = captured['url']
        all_items, skip = [], 0
        for page_no in range(max_pages):
            # lanCode 过滤是必需的，缺了服务端 500
            url = '%s?$count=true&$filter=lanCode%%20eq%%20%%27zh-CN%%27&$skip=%d&$top=%d' % (base, skip, top)
            # 注意：必须在浏览器内 parse 后返回结构化数组。
            # 把 response 当字符串切片再回传会被截断成非法 JSON（踩过：4MB 上限切坏整页）。
            r = fr.evaluate("""async (u) => {
                try {
                    const resp = await fetch(u, {headers: {Accept: 'application/json'}});
                    const d = await resp.json();
                    return {status: resp.status, value: d.value || [], count: d['@count'] || d['@odata.count']};
                } catch(e) { return {status: 0, value: [], err: String(e).slice(0,300)}; }
            }""", url)
            if r['status'] != 200:
                print('[fetch] skip=%d status=%s err=%s' % (skip, r['status'], r.get('err', '')), flush=True)
                break
            vals = r['value']
            all_items.extend(vals)
            print('[fetch] page=%d skip=%d got=%d 累计=%d' % (page_no + 1, skip, len(vals), len(all_items)), flush=True)
            if len(vals) < top:
                break
            skip += top
            time.sleep(0.4)

        ctx.close()
        return all_items


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--no-browser', action='store_true', help='跳过抓取，直接用已有 _raw_all.json 重算')
    ap.add_argument('--top', type=int, default=200)
    args = ap.parse_args()

    ensure_out()
    raw_path = os.path.join(OUT_DIR, '_raw_all.json')

    if args.no_browser:
        items = json.load(io.open(raw_path, encoding='utf-8'))
    else:
        items = discover_and_fetch(top=args.top)
        json.dump(items, io.open(raw_path, 'w', encoding='utf-8'),
                  ensure_ascii=False, indent=1)
        print('[save] 原始全量 %d 条 -> %s' % (len(items), raw_path), flush=True)

    # ---- 本地过滤（不做服务端过滤：组合 $filter 下 $count 不可信，且语法易踩坑）----
    for t in TARGETS:
        sel = [i for i in items
               if (i.get('solutionScenarioName') or '') == t['scenario']
               and str(i.get('targetRelease') or '') == t['release']
               and t['country'] in (i.get('countryText') or '')]
        # 去重（同一流程可能有多行）
        seen, uniq = set(), []
        for i in sel:
            k = i.get('solutionProcessStableId')
            if k in seen:
                continue
            seen.add(k)
            uniq.append(i)
        uniq = slim(uniq)
        uniq.sort(key=lambda x: (x.get('externalId') or ''))
        print('[filter] %s -> %d 条（去重后 %d，已瘦身）' % (t['label'], len(sel), len(uniq)), flush=True)

        out = {
            'source': 'SAP Signavio Process Navigator (me.sap.com/processnavigator)',
            'source_url': ENTRY_URL,
            'edition': t['label'],
            'edition_note': ('佛照项目目标 Edition 尚未最终确认，本清单按「参考级」使用：'
                             '流程编号（externalId）与名称可跨 Edition 对齐，'
                             '但可用范围与细节以项目实际 Edition 为准。'
                             if t['primary'] else
                             '对照清单：若佛照最终走 Private Edition / On-Premise，以本份为主数据。'),
            'copyright': '流程编号与名称为 SAP SE 事实性信息；本页描述文字为中文改写，'
                         '非 SAP 原文逐字翻译。来源 SAP Signavio Process Navigator，版权归 SAP SE 所有。',
            'fetched_at': time.strftime('%Y-%m-%d %H:%M:%S'),
            'total_raw': len(items),
            'count': len(uniq),
            'items': uniq,
        }
        idx_path = os.path.join(OUT_DIR, t['file'])
        json.dump(out, io.open(idx_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print('[save] -> %s' % idx_path, flush=True)


if __name__ == '__main__':
    main()
