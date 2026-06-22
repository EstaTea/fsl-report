import os, shutil, json

REPO = "/tmp/fsl-report"

# ── FSL Logo SVG (inline, faithful to the brand) ───────────────────────────
FSL_LOGO_SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 40" height="32" aria-label="FSL 佛山照明">
  <!-- F -->
  <rect x="0" y="4" width="5" height="32" fill="#F06000"/>
  <rect x="0" y="4" width="20" height="5" fill="#F06000"/>
  <rect x="0" y="17" width="15" height="4" fill="#F06000"/>
  <!-- S -->
  <path d="M26 4 h16 v5 h-11 v7 h10 v5 h-10 v7 h12 v5 h-17 v-10 h10 v-4 h-10 z" fill="#F06000"/>
  <!-- L -->
  <rect x="48" y="4" width="5" height="32" fill="#F06000"/>
  <rect x="48" y="31" width="18" height="5" fill="#F06000"/>
  <!-- 佛山照明 text -->
  <text x="74" y="29" font-family="Microsoft YaHei,PingFang SC,sans-serif"
        font-size="16" font-weight="700" fill="#1A1A1A" letter-spacing="1">佛山照明</text>
</svg>'''

# ── Compact logo version for nav (white text version) ──────────────────────
FSL_LOGO_NAV = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 36" height="26" aria-label="FSL 佛山照明">
  <rect x="0" y="3" width="4" height="30" fill="#F06000"/>
  <rect x="0" y="3" width="18" height="4" fill="#F06000"/>
  <rect x="0" y="16" width="13" height="4" fill="#F06000"/>
  <path d="M22 3 h14 v4 h-9 v6 h9 v4 h-9 v7 h10 v4 h-15 v-9 h9 v-3 h-9 z" fill="#F06000"/>
  <rect x="42" y="3" width="4" height="30" fill="#F06000"/>
  <rect x="42" y="29" width="16" height="4" fill="#F06000"/>
  <text x="66" y="26" font-family="Microsoft YaHei,PingFang SC,sans-serif"
        font-size="14" font-weight="700" fill="rgba(255,255,255,0.92)" letter-spacing="1">佛山照明</text>
</svg>'''

# ── MANIFEST: single source of truth for all deliverables ──────────────────
# To add a new report: add an entry here + drop the HTML file in the right folder
# status: "done" | "wip" | "todo"
MANIFEST = {
  "meta": {
    "project": "佛山照明 SAP S/4HANA 升级 + 业务诊断咨询",
    "code": "06-04-04A-2026-D-E08463",
    "si": "艾维登 Eviden",
    "start": "2026-05-29",
    "golive": "2027 Q1"
  },
  "sections": [
    {
      "id": "consulting",
      "icon": "📋",
      "title": "管理咨询交付物",
      "desc": "数字化转型规划咨询第一期 · 18周（135天）· EA（TOGAF）方法论",
      "url": "consulting/",
      "subsections": [
        {
          "id": "diagnosis",
          "title": "现状分析与诊断阶段",
          "icon": "🔍",
          "desc": "盘清家底、找准方向 — W1-W6（6周）",
          "url": "consulting/diagnosis/",
          "docs": [
            {"id":"rpt-01","title":"佛山照明企业现状诊断报告",
             "desc":"业务·数字化·数据·系统全景诊断，含TOGAF 4A架构现状分析",
             "status":"done","tags":["★1","★3","TOGAF"],"url":"consulting/diagnosis/report-01.html"},
            {"id":"rpt-01b","title":"照明行业数字化转型对标研究报告",
             "desc":"Signify/欧普/阳光照明/佛照四家2025年年报深度对标分析",
             "status":"done","tags":["行业研究","四家年报"],"url":"research/industry-benchmark.html"}
          ]
        },
        {
          "id": "blueprint",
          "title": "蓝图及架构设计阶段",
          "icon": "🏛",
          "desc": "规划蓝图、明确架构 — W7-W16（10周）",
          "url": "consulting/blueprint/",
          "docs": [
            {"id":"rpt-02","title":"佛山照明企业架构设计报告",
             "desc":"企业架构蓝图（L1-L3）：BA/DA/AA/TA TO-BE 设计",
             "status":"wip","tags":["★5","TOGAF","L1-L3"],"url":"consulting/blueprint/ea-report.html"},
            {"id":"rpt-03","title":"佛山照明专项方案设计报告",
             "desc":"8个高价值专项场景（L4-L5），含财务主数据专项设计",
             "status":"todo","tags":["★2","8个专项","L4-L5"],"url":"consulting/blueprint/solution-report.html"},
            {"id":"rpt-04","title":"数据调研分析报告 · 数据规划及管理办法 · 数据治理总结",
             "desc":"产品主数据（物料+BOM）、客商主数据、财务主数据治理方案",
             "status":"todo","tags":["★4","MDG","主数据"],"url":"consulting/blueprint/data-report.html"}
          ]
        },
        {
          "id": "solutions",
          "title": "专项方案设计阶段（8个高价值场景）",
          "icon": "🎯",
          "desc": "聚焦痛点、深化设计 — 按需推进",
          "url": "consulting/solutions/",
          "docs": [
            {"id":"sol-01","title":"主数据标准化专项方案","desc":"物料/客商/财务主数据编码规范与治理","status":"todo","tags":["MDG"],"url":"consulting/solutions/sol-masterdata.html"},
            {"id":"sol-02","title":"销售价格体系专项方案","desc":"多渠道定价策略、信用管理、经销商管理","status":"todo","tags":["SD"],"url":"consulting/solutions/sol-pricing.html"},
            {"id":"sol-03","title":"成本还原专项方案","desc":"标准成本体系、制造成本核算精细化","status":"todo","tags":["CO"],"url":"consulting/solutions/sol-costing.html"},
            {"id":"sol-04","title":"研发与BOM管理专项方案","desc":"PLM-ERP集成、EBOM→MBOM自动化","status":"todo","tags":["PP","PLM"],"url":"consulting/solutions/sol-bom.html"},
            {"id":"sol-05","title":"产供销协同计划专项方案","desc":"MRP Live启用、产销协同机制设计","status":"todo","tags":["PP","MRP"],"url":"consulting/solutions/sol-planning.html"},
            {"id":"sol-06","title":"集团财务管控专项方案","desc":"合并报表、内部交易消除、泰国多币种","status":"todo","tags":["FI","Group Reporting"],"url":"consulting/solutions/sol-finance.html"},
            {"id":"sol-07","title":"质量管理专项方案","desc":"IATF认证、批次追溯、质量成本管理","status":"todo","tags":["QM","IATF"],"url":"consulting/solutions/sol-quality.html"},
            {"id":"sol-08","title":"全球化财务合规专项方案","desc":"泰国/德国本地化、CBAM合规预备","status":"todo","tags":["DRC","GTS"],"url":"consulting/solutions/sol-global.html"}
          ]
        },
        {
          "id": "roadmap",
          "title": "实施路径规划阶段",
          "icon": "🗺",
          "desc": "拆解蓝图、落地规划 — W17-W18（4周）",
          "url": "consulting/roadmap/",
          "docs": [
            {"id":"rpt-06","title":"佛山照明企业数字化转型路径规划",
             "desc":"2026-2028年分阶段计划、项目优先级排序、资源调配与风险管控",
             "status":"todo","tags":["★6","三年路线图","2026-2028"],"url":"consulting/roadmap/roadmap-report.html"}
          ]
        }
      ]
    },
    {
      "id": "sap",
      "icon": "⚙️",
      "title": "SAP 实施交付物",
      "desc": "SAP S/4HANA PCE Greenfield · 8个月（240天）· SAP Activate方法论",
      "url": "sap/",
      "subsections": [
        {"id":"prepare","title":"项目准备阶段","icon":"🚀","desc":"建立项目组织、制定计划、环境搭建 — D1-D30","url":"sap/prepare/","docs":[
          {"id":"sap-p1","title":"启动会PPT","status":"done","tags":["准备阶段"],"url":"sap/prepare/kickoff.html","desc":"项目启动会演示材料"},
          {"id":"sap-p2","title":"项目总体计划","status":"done","tags":["项目管理"],"url":"sap/prepare/project-plan.html","desc":"各阶段任务、周期、人员分工"},
          {"id":"sap-p3","title":"项目章程","status":"done","tags":["项目管理"],"url":"sap/prepare/charter.html","desc":"范围、会议规范、文档管理规定"},
          {"id":"sap-p4","title":"调研计划与问卷","status":"done","tags":["调研"],"url":"sap/prepare/survey.html","desc":"两周调研执行计划"},
          {"id":"sap-p5","title":"组织架构与通讯录","status":"done","tags":["项目管理"],"url":"sap/prepare/org.html","desc":"项目组团队、人员分工"}
        ]},
        {"id":"blueprint","title":"蓝图方案设计阶段","icon":"📐","desc":"业务调研、差距分析、系统蓝图设计 — D30-D90","url":"sap/blueprint/","docs":[
          {"id":"sap-b1","title":"调研报告","status":"wip","tags":["蓝图"],"url":"sap/blueprint/survey-report.html","desc":"现状业务需求及重点需求分析"},
          {"id":"sap-b2","title":"解决方案文档","status":"todo","tags":["蓝图"],"url":"sap/blueprint/solution.html","desc":"核心流程与信息化方案"},
          {"id":"sap-b3","title":"业务蓝图确认","status":"todo","tags":["蓝图","里程碑"],"url":"sap/blueprint/bbp.html","desc":"蓝图评审签字确认文件"},
          {"id":"sap-b4","title":"系统开发清单","status":"todo","tags":["开发"],"url":"sap/blueprint/dev-list.html","desc":"二次开发需求清单"},
          {"id":"sap-b5","title":"数据迁移方案","status":"todo","tags":["数据迁移"],"url":"sap/blueprint/data-migration.html","desc":"主数据清洗、迁移策略"},
          {"id":"sap-b6","title":"集成方案","status":"todo","tags":["CPI","集成"],"url":"sap/blueprint/integration.html","desc":"12个外围系统CPI集成架构"}
        ]},
        {"id":"realize","title":"系统实现阶段","icon":"🔧","desc":"系统配置、开发、SIT/UAT测试 — D90-D180","url":"sap/realize/","docs":[
          {"id":"sap-r1","title":"系统配置文档","status":"todo","tags":["配置"],"url":"sap/realize/config.html","desc":"含配置截图的模块配置手册"},
          {"id":"sap-r2","title":"二次开发说明书","status":"todo","tags":["开发"],"url":"sap/realize/dev-spec.html","desc":"需求设计方案、代码、测试用例"},
          {"id":"sap-r3","title":"SIT集成测试报告","status":"todo","tags":["测试","里程碑"],"url":"sap/realize/sit.html","desc":"蓝图场景100%覆盖验证"},
          {"id":"sap-r4","title":"UAT用户验收测试报告","status":"todo","tags":["测试","里程碑"],"url":"sap/realize/uat.html","desc":"用户验收测试结果"},
          {"id":"sap-r5","title":"权限角色矩阵","status":"todo","tags":["权限"],"url":"sap/realize/auth.html","desc":"岗位权限设计与分配方案"}
        ]},
        {"id":"deploy","title":"上线切换阶段","icon":"🚢","desc":"数据准备、用户培训、系统切换、上线支持 — D180-D240","url":"sap/deploy/","docs":[
          {"id":"sap-d1","title":"上线策略文档","status":"todo","tags":["切换","里程碑"],"url":"sap/deploy/cutover.html","desc":"切换时点、回滚策略"},
          {"id":"sap-d2","title":"最终数据迁移报告","status":"todo","tags":["数据迁移","里程碑"],"url":"sap/deploy/data-migration-final.html","desc":"静态数据迁移准确率100%验证"},
          {"id":"sap-d3","title":"系统操作手册","status":"todo","tags":["培训"],"url":"sap/deploy/manual.html","desc":"按岗位的系统操作说明"},
          {"id":"sap-d4","title":"培训计划与签到表","status":"todo","tags":["培训"],"url":"sap/deploy/training.html","desc":"最终用户培训记录"},
          {"id":"sap-d5","title":"上线问题及解决清单","status":"todo","tags":["上线支持"],"url":"sap/deploy/issues.html","desc":"上线后问题追踪与解决方案"},
          {"id":"sap-d6","title":"项目验收报告","status":"todo","tags":["验收","里程碑"],"url":"sap/deploy/acceptance.html","desc":"SAP ERP项目成果与交付物验收"}
        ]}
      ]
    },
    {
      "id": "research",
      "icon": "📊",
      "title": "行业研究与参考资料",
      "desc": "照明行业竞争格局分析、数字化转型对标",
      "url": "research/",
      "subsections": [
        {"id":"industry","title":"行业研究","icon":"📊","desc":"","url":"research/","docs":[
          {"id":"res-01","title":"照明行业数字化转型深度对标研究报告",
           "desc":"Signify·欧普·阳光照明·佛照四家2025年年报综合分析，含信息化SAP现状对比、KPI量化对比",
           "status":"done","tags":["Signify","欧普","阳光照明","2025年报"],"url":"research/industry-benchmark.html"}
        ]}
      ]
    }
  ]
}

# ═══════════════════════════════════════════════════════════════════
# HTML templates
# ═══════════════════════════════════════════════════════════════════
CSS = """
:root{--b900:#0B2D47;--b700:#1A4F73;--b500:#2374A3;--b300:#5EA4CE;
      --b100:#C7E2F2;--b050:#EBF5FB;--bg:#F2F7FB;--text:#0F2233;
      --muted:#5B7A91;--rule:#D6E8F2;--r:6px;}
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:"Helvetica Neue","Microsoft YaHei",system-ui,sans-serif;
     background:var(--bg);color:var(--text);font-size:14px;line-height:1.8;}
a{color:inherit;text-decoration:none;}

nav{background:var(--b900);padding:0 32px;display:flex;align-items:center;gap:20px;
    height:54px;position:sticky;top:0;z-index:100;
    box-shadow:0 2px 10px rgba(11,45,71,.5);}
.nav-logo-link{display:flex;align-items:center;gap:10px;flex-shrink:0;}
.nav-divider{width:1px;height:24px;background:rgba(255,255,255,.15);flex-shrink:0;}
.nav-project{color:rgba(255,255,255,.55);font-size:12px;letter-spacing:.2px;white-space:nowrap;}
.nav-links{display:flex;flex:1;overflow-x:auto;}
.nav-links a{padding:0 14px;color:rgba(255,255,255,.6);font-size:12.5px;
             height:54px;display:flex;align-items:center;white-space:nowrap;
             transition:color .15s;border-bottom:2px solid transparent;}
.nav-links a:hover{color:rgba(255,255,255,.9);}
.nav-links a.active{color:#fff;border-bottom-color:#5EA4CE;}

.hero{background:linear-gradient(155deg,var(--b900) 0%,var(--b700) 100%);
      color:#fff;padding:48px 48px 42px;border-bottom:3px solid var(--b500);}
.hero-logo{margin-bottom:18px;}
.hero h1{font-size:26px;font-weight:800;margin-bottom:8px;letter-spacing:-.2px;}
.hero p{font-size:13.5px;opacity:.75;max-width:760px;line-height:1.85;}
.hero-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;}
.chip{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.14);
      border-radius:3px;padding:3px 12px;font-size:11px;letter-spacing:.4px;text-transform:uppercase;}

.container{max-width:1280px;margin:0 auto;padding:36px 32px;}

.bc{display:flex;align-items:center;gap:6px;font-size:12.5px;
    color:var(--muted);margin-bottom:28px;flex-wrap:wrap;}
.bc a{color:var(--b500);}
.bc a:hover{color:var(--b700);}
.bc .sep{color:var(--b100);}

.section-hd{display:flex;align-items:center;gap:12px;margin:36px 0 16px;}
.section-hd:first-child{margin-top:0;}
.sec-icon{width:38px;height:38px;background:var(--b700);border-radius:var(--r);
          display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0;}
.sec-title{font-size:17px;font-weight:800;color:var(--b900);}
.sec-desc{font-size:12.5px;color:var(--muted);margin-top:2px;}

.progress-bar{height:4px;background:var(--rule);border-radius:2px;margin-top:6px;max-width:200px;}
.progress-fill{height:100%;border-radius:2px;background:var(--b500);}

.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(252px,1fr));gap:14px;margin-bottom:8px;}
.grid-3{grid-template-columns:repeat(auto-fill,minmax(320px,1fr));}

.folder-card{background:#fff;border:1px solid var(--rule);border-radius:var(--r);
             padding:18px 20px;display:flex;align-items:center;gap:14px;
             box-shadow:0 1px 3px rgba(35,116,163,.05);
             transition:box-shadow .15s,transform .15s;}
.folder-card:hover{box-shadow:0 4px 14px rgba(35,116,163,.13);transform:translateY(-2px);}
.fc-icon{font-size:24px;flex-shrink:0;}
.fc-name{font-size:13.5px;font-weight:700;color:var(--b900);}
.fc-meta{font-size:11.5px;color:var(--muted);margin-top:3px;}

.doc-card{background:#fff;border:1px solid var(--rule);border-radius:var(--r);
          padding:18px 20px;display:flex;flex-direction:column;gap:6px;
          box-shadow:0 1px 3px rgba(35,116,163,.05);
          transition:box-shadow .15s,transform .15s;}
.doc-card:hover{box-shadow:0 4px 14px rgba(35,116,163,.13);transform:translateY(-2px);}
.doc-card .dc-badge{font-size:10px;font-weight:800;letter-spacing:.5px;
                    text-transform:uppercase;color:var(--b500);}
.doc-card .dc-title{font-size:13.5px;font-weight:700;color:var(--b900);line-height:1.4;}
.doc-card .dc-desc{font-size:12px;color:var(--muted);line-height:1.55;}
.dc-footer{display:flex;align-items:center;justify-content:space-between;margin-top:4px;}
.dc-tags{display:flex;gap:5px;flex-wrap:wrap;}
.dc-tag{background:var(--b050);color:var(--b700);font-size:10.5px;font-weight:600;
        padding:2px 7px;border-radius:3px;}
.dc-arrow{font-size:13px;font-weight:700;color:var(--b300);margin-left:auto;flex-shrink:0;}

.status{font-size:10.5px;font-weight:700;padding:2px 9px;border-radius:3px;letter-spacing:.3px;}
.s-done{background:var(--b100);color:var(--b700);}
.s-wip {background:var(--b050);color:var(--b500);border:1px solid var(--b100);}
.s-todo{background:#EEF2F6;color:var(--muted);}

.stats-row{display:flex;gap:1px;background:var(--rule);border-radius:var(--r);
           overflow:hidden;border:1px solid var(--rule);margin-bottom:32px;}
.stat{flex:1;background:#fff;padding:14px 18px;text-align:center;}
.stat .sv{font-size:22px;font-weight:800;color:var(--b700);}
.stat .sl{font-size:11px;color:var(--muted);margin-top:2px;}

.divider{border:none;border-top:1px solid var(--rule);margin:28px 0;}

footer{background:var(--b900);color:rgba(255,255,255,.35);text-align:center;
       padding:18px;font-size:11px;margin-top:48px;letter-spacing:.2px;}

@media(max-width:768px){
  .hero{padding:28px 20px;}.container{padding:20px 16px;}
  nav{padding:0 16px;}.nav-project{display:none;}
  .stats-row{flex-wrap:wrap;}
}
"""

STATUS_LABEL = {"done":"✅ 已完成","wip":"🔄 进行中","todo":"⏳ 待开始"}
STATUS_CLS   = {"done":"s-done","wip":"s-wip","todo":"s-todo"}

def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def nav_html(active_id="home"):
    links = [("home","工作台首页","/fsl-report/")]
    for sec in MANIFEST["sections"]:
        links.append((sec["id"], sec["title"][:6], f"/fsl-report/{sec['url']}"))
    items = ""
    for lid, label, url in links:
        cls = ' class="active"' if lid == active_id else ""
        items += f'<a href="{url}"{cls}>{label}</a>'
    return f'''<nav>
  <a href="/fsl-report/" class="nav-logo-link">{FSL_LOGO_NAV}</a>
  <div class="nav-divider"></div>
  <span class="nav-project">数字化转型项目工作台</span>
  <div class="nav-links">{items}</div>
</nav>'''

def bc_html(crumbs):
    parts = []
    for i,(name,url) in enumerate(crumbs):
        if url and i < len(crumbs)-1:
            parts.append(f'<a href="{url}">{name}</a>')
        else:
            parts.append(f'<span>{name}</span>')
        if i < len(crumbs)-1:
            parts.append('<span class="sep">›</span>')
    return f'<div class="bc">{"".join(parts)}</div>'

def page_wrap(title, nav, hero_content, body):
    return f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} | FSL 工作台</title>
<style>{CSS}</style>
</head>
<body>
{nav}
{hero_content}
<div class="container">{body}</div>
<footer>佛山照明 SAP S/4HANA 升级项目工作台 · 机密文件 · 仅供项目组内部使用 · 2026</footer>
</body></html>'''

def doc_card_html(doc, base_url=""):
    href = f"/fsl-report/{doc['url']}" if not doc['url'].startswith('#') else '#'
    tags = "".join(f'<span class="dc-tag">{t}</span>' for t in doc.get("tags",[]))
    s = doc.get("status","todo")
    arrow = ' <div class="dc-arrow">→</div>' if s == "done" else ""
    return f'''<a href="{href}" class="doc-card">
  <div class="dc-badge">交付物</div>
  <div class="dc-title">{doc["title"]}</div>
  {"<div class='dc-desc'>"+doc.get("desc","")+"</div>" if doc.get("desc") else ""}
  <div class="dc-footer">
    <div class="dc-tags"><span class="status {STATUS_CLS[s]}">{STATUS_LABEL[s]}</span>{tags}</div>
    {arrow}
  </div>
</a>'''

def folder_card_html(sub, parent_url=""):
    count = len(sub["docs"])
    done = sum(1 for d in sub["docs"] if d["status"]=="done")
    pct = int(done/count*100) if count else 0
    href = f"/fsl-report/{sub['url']}"
    return f'''<a href="{href}" class="folder-card">
  <div class="fc-icon">{sub["icon"]}</div>
  <div style="flex:1;">
    <div class="fc-name">{sub["title"]}</div>
    <div class="fc-meta">{done}/{count} 份完成</div>
    <div class="progress-bar" style="margin-top:6px;">
      <div class="progress-fill" style="width:{pct}%"></div>
    </div>
  </div>
  <div style="color:var(--b300);font-size:16px;margin-left:8px;">›</div>
</a>'''

# ── Stats across all docs ────────────────────────────────────────────────────
all_docs = []
for sec in MANIFEST["sections"]:
    for sub in sec.get("subsections",[]):
        all_docs.extend(sub["docs"])

total = len(all_docs)
done  = sum(1 for d in all_docs if d["status"]=="done")
wip   = sum(1 for d in all_docs if d["status"]=="wip")
todo  = sum(1 for d in all_docs if d["status"]=="todo")

def stats_html():
    return f'''<div class="stats-row">
  <div class="stat"><div class="sv">{total}</div><div class="sl">交付物总数</div></div>
  <div class="stat"><div class="sv" style="color:var(--b500);">{done}</div><div class="sl">已完成</div></div>
  <div class="stat"><div class="sv" style="color:var(--b700);">{wip}</div><div class="sl">进行中</div></div>
  <div class="stat"><div class="sv" style="color:var(--muted);">{todo}</div><div class="sl">待开始</div></div>
  <div class="stat"><div class="sv" style="color:var(--b700);">{int(done/total*100) if total else 0}%</div><div class="sl">整体完成率</div></div>
</div>'''

# ════════════════════════════════════════════════════════════════════
# BUILD PAGES
# ════════════════════════════════════════════════════════════════════
print("Building pages...")

# ── Portal homepage ─────────────────────────────────────────────────────────
sec_html = ""
for sec in MANIFEST["sections"]:
    folders = "".join(folder_card_html(sub) for sub in sec.get("subsections",[]))
    sec_html += f'''
<div class="section-hd">
  <div class="sec-icon">{sec["icon"]}</div>
  <div>
    <div class="sec-title">{sec["title"]}</div>
    <div class="sec-desc">{sec["desc"]}</div>
  </div>
</div>
<div class="grid">{folders}</div>
<hr class="divider">'''

hero = f'''<div class="hero">
  <div class="hero-logo">{FSL_LOGO_SVG}</div>
  <h1>数字化转型项目工作台</h1>
  <p>SAP S/4HANA 升级 + 业务诊断咨询 · 项目编号：{MANIFEST["meta"]["code"]} · 实施伙伴：{MANIFEST["meta"]["si"]}</p>
  <div class="hero-chips">
    <span class="chip">{MANIFEST["meta"]["start"]} 启动</span>
    <span class="chip">预计 {MANIFEST["meta"]["golive"]} 上线</span>
    <span class="chip">19家法人</span>
    <span class="chip">Green Field</span>
  </div>
</div>'''

write(f"{REPO}/index.html",
      page_wrap("佛山照明数字化转型工作台",
                nav_html("home"), hero,
                stats_html() + sec_html))
print(f"  ✓ /index.html")

# ── Section index pages ─────────────────────────────────────────────────────
for sec in MANIFEST["sections"]:
    sub_folders = "".join(folder_card_html(sub) for sub in sec.get("subsections",[]))
    body = bc_html([("工作台","/fsl-report/"), (sec["title"], None)]) + \
           f'<div class="grid">{sub_folders}</div>'
    hero = f'''<div class="hero">
  <h1>{sec["title"]}</h1>
  <p>{sec["desc"]}</p>
  <div class="hero-chips"><span class="chip">{sec["title"]}</span></div>
</div>'''
    path = f"{REPO}/{sec['url']}index.html"
    write(path, page_wrap(sec["title"], nav_html(sec["id"]), hero, body))
    print(f"  ✓ /{sec['url']}index.html")

    # ── Subsection pages ─────────────────────────────────────────────────────
    for sub in sec.get("subsections",[]):
        docs_html = "".join(doc_card_html(d) for d in sub["docs"])
        body = bc_html([
            ("工作台","/fsl-report/"),
            (sec["title"], f"/fsl-report/{sec['url']}"),
            (sub["title"], None)
        ]) + f'<div class="section-hd"><div class="sec-icon">{sub["icon"]}</div>' \
           + f'<div><div class="sec-title">{sub["title"]}</div>' \
           + f'<div class="sec-desc">{sub["desc"]}</div></div></div>' \
           + f'<div class="grid grid-3">{docs_html}</div>'
        hero = f'''<div class="hero">
  <h1>{sub["title"]}</h1>
  <p>{sub["desc"] or sec["desc"]}</p>
  <div class="hero-chips"><span class="chip">{sec["title"]}</span></div>
</div>'''
        path = f"{REPO}/{sub['url']}index.html"
        write(path, page_wrap(sub["title"], nav_html(sec["id"]), hero, body))
        print(f"  ✓ /{sub['url']}index.html")

# ── Copy real HTML reports ───────────────────────────────────────────────────
copies = {
    "consulting/diagnosis/report-01.html": "/Users/I523899/Downloads/佛照_01_现状分析与诊断报告.html",
    "research/industry-benchmark.html":    "/Users/I523899/Downloads/照明行业数字化转型对标研究报告.html",
}
for dst_rel, src in copies.items():
    if os.path.exists(src):
        dst = f"{REPO}/{dst_rel}"
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        print(f"  ✓ copied → {dst_rel}")

# ── Save MANIFEST.json (for future updates) ──────────────────────────────────
with open(f"{REPO}/MANIFEST.json", "w", encoding="utf-8") as f:
    json.dump(MANIFEST, f, ensure_ascii=False, indent=2)
print(f"  ✓ /MANIFEST.json")

# ── README ───────────────────────────────────────────────────────────────────
readme = """# FSL 佛山照明 · 数字化转型项目工作台

## 如何新增报告

1. 把 HTML 文件放入对应目录（如 `consulting/blueprint/ea-report.html`）
2. 打开 `MANIFEST.json`，找到对应的 doc 条目，把 `"status": "todo"` 改为 `"status": "done"`
3. 在本地运行 `python3 build.py` 重新生成所有索引页
4. `git add -A && git commit -m "Add [报告名称]" && git push`

## 目录结构

```
/
├── index.html              # 工作台首页
├── MANIFEST.json           # 交付物清单（唯一配置文件）
├── build.py                # 重新生成所有页面的脚本
├── consulting/             # 管理咨询交付物
│   ├── diagnosis/          # 现状诊断阶段
│   ├── blueprint/          # 蓝图架构设计阶段
│   ├── solutions/          # 专项方案设计阶段
│   └── roadmap/            # 实施路径规划阶段
├── sap/                    # SAP实施交付物
│   ├── prepare/            # 项目准备阶段
│   ├── blueprint/          # 蓝图设计阶段
│   ├── realize/            # 系统实现阶段
│   └── deploy/             # 上线切换阶段
└── research/               # 行业研究参考资料
```
"""
with open(f"{REPO}/README.md", "w") as f:
    f.write(readme)

# ── Write build.py (the rebuild script) ──────────────────────────────────────
import shutil as _sh
_sh.copy2("/tmp/build_portal_v2.py", f"{REPO}/build.py")
print(f"  ✓ /build.py")

# Stats
total_files = sum(len(fls) for _,_,fls in os.walk(REPO))
print(f"\n=== Done: {total_files} files ===")
