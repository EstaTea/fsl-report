# -*- coding: utf-8 -*-
"""验证 5 门 SAP Best Practices scope item 课程能正常加载并渲染引导。

用法（需先起本地服务）：
  python3 -m http.server 8899 --directory /Users/I523899 &
  python3 /tmp/verify_bp.py
"""
import json, os, sys
from playwright.sync_api import sync_playwright

# 用法：
#   本地：python3 -m http.server 8899 --directory ~ & ; python3 verify_bp_courses.py
#   线上：python3 verify_bp_courses.py https://estatea.github.io/fsl-report/training/
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8899/fsl-report/training/'
if not BASE.endswith('/'):
    BASE += '/'
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')) + '/'
OK = FAIL = 0


def check(name, cond, extra=''):
    global OK, FAIL
    if cond:
        OK += 1
        print('  PASS  %s' % name)
    else:
        FAIL += 1
        print('  FAIL  %s  %s' % (name, extra))


# (课程 id, 步骤数, scope item 标签, 舞台 screen 参数)
COURSES = [
    ('bp-j45-overlay', 7, 'J45', 'bp-j45'),
    ('bp-bd9-overlay', 7, 'BD9', 'bp-bd9'),
    ('bp-mfg-overlay', 7, '54U', 'bp-54u'),
    ('bp-j60-overlay', 7, 'J60', 'bp-j60'),
    ('bp-jb1-overlay', 7, 'JB1', 'bp-jb1'),
]

SESSION = {"login": "EstaTea", "name": "陈宇清", "login_type": "github"}
INIT = "try{localStorage.setItem('fsl_session', JSON.stringify(%s));}catch(e){}" \
       % json.dumps(SESSION)

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context()
    ctx.add_init_script(INIT)
    errs = []

    pg = ctx.new_page()
    pg.on('console', lambda m: errs.append('C:' + m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: errs.append('P:' + str(e)))

    # 目录页：11 门课 + 5 个 scope item 标签
    pg.goto(BASE + 'index.html', wait_until='networkidle')
    pg.wait_for_selector('.course-card', timeout=10000)
    n_cards = pg.locator('.course-grid#courseGrid .course-card').count()
    check('课程目录渲染 11 门课', n_cards == 11, str(n_cards))
    body = pg.inner_text('#courseGrid')
    for _, _, sid, _s in COURSES:
        check('目录含 scope item %s' % sid, sid in body)

    # 逐门课跑引导（学员端 overlay-run.html 直接承载舞台）
    for cid, n, sid, scr in COURSES:
        pg2 = ctx.new_page()
        pg2.on('console', lambda m: errs.append('C:%s' % m.text) if m.type == 'error' else None)
        pg2.on('pageerror', lambda e: errs.append('P:%s' % e))
        pg2.goto(BASE + 'overlay-run.html?course=' + cid, wait_until='networkidle')
        frame = pg2.frame_locator('iframe#stage')
        try:
            frame.locator('.od-pop').first.wait_for(state='visible', timeout=12000)
            check('%s 引导气泡渲染' % cid, True)
            prog = pg2.inner_text('#progress')
            check('%s 进度显示 1 / %d' % (cid, n), prog.strip() == '1 / %d' % n, prog)
            title = pg2.inner_text('#title')
            check('%s 标题非空' % cid, len(title.strip()) > 4, title)
            src = pg2.get_attribute('iframe#stage', 'src')
            check('%s 舞台指向 screen=%s' % (cid, scr),
                  src and ('screen=' + scr) in src, str(src))
            # 每一步锚点在舞台上真实存在（非法 CSS 选择器会在这里暴露）
            cd = json.load(open(ROOT + 'courses/%s.json' % cid, encoding='utf-8'))
            sels = [s['el'] for s in cd['steps'] if s.get('el')]
            missing = [s for s in sels if frame.locator(s).count() == 0]
            check('%s 全部 %d 个锚点命中' % (cid, len(sels)), not missing, str(missing))
        except Exception as e:
            check('%s 引导气泡渲染' % cid, False, str(e)[:160])
        pg2.close()

    # 编排器能装载新课（说明可被二次编辑）
    pg3 = ctx.new_page()
    pg3.on('pageerror', lambda e: errs.append('P:A:%s' % e))
    pg3.goto(BASE + 'author.html?course=bp-mfg-overlay', wait_until='networkidle')
    pg3.wait_for_timeout(1500)
    check('编排器可装载 54U 课程', pg3.input_value('#f-id') == 'bp-mfg-overlay',
          pg3.input_value('#f-id'))
    check('编排器舞台自动切到 bp-54u',
          pg3.input_value('#f-stage') == 'stage/screen.html?screen=bp-54u',
          pg3.input_value('#f-stage'))
    check('编排器载入 7 个步骤', pg3.locator('#stepList .step').count() == 7,
          str(pg3.locator('#stepList .step').count()))
    pg3.close()

    real = [e for e in errs if 'Access is denied' not in e and 'favicon' not in e]
    check('无控制台报错/未捕获异常', not real, ' ; '.join(real[:3]))
    b.close()

print('\n==== %d 通过 / %d 失败 ====' % (OK, FAIL))
