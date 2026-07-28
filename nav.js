/* FSL 工作台 — 统一导航 nav.js
 * 修改这一个文件 = 全站导航同步更新
 * 自动生成于 build_shared_nav.py
 */
(function () {
  // ── 注入 CSS（只注入一次）──────────────────────────────────────────────────
  if (!document.getElementById('fsl-nav-style')) {
    const style = document.createElement('style');
    style.id = 'fsl-nav-style';
    style.textContent = '\n/* ── mod-tab 下拉面板 ── */\n.mod-tab-dd{position:relative;display:inline-flex;align-items:stretch}\n.mod-tab-dd-panel{display:none;position:fixed;z-index:9999;background:var(--b900);border:1px solid rgba(255,255,255,.12);border-top:2px solid var(--b500);border-radius:0 6px 6px 6px;min-width:220px;padding:6px 0;box-shadow:0 6px 20px rgba(11,45,71,.5)}\n.mod-tab-dd-panel.dd-open{display:block}\n.mod-tab-dd-panel a{display:flex;align-items:center;gap:8px;padding:8px 16px;color:rgba(255,255,255,.7);font-size:12.5px;text-decoration:none;white-space:nowrap;transition:background .12s,color .12s}\n.mod-tab-dd-panel a:hover{background:rgba(255,255,255,.1);color:#fff}\n\n\n:root{--b900:#0B2D47;--b700:#1A4F73;--b500:#2374A3;--b300:#5EA4CE;\n      --b100:#C7E2F2;--b050:#EBF5FB;--bg:#F2F7FB;--text:#0F2233;\n      --muted:#5B7A91;--rule:#D6E8F2;--r:6px;\n      --navy:#0B2D47;--dark:#1A4F73;--primary:#2374A3;--mid:#3D8FC4;\n      --steel:#5B7A91;--pale:#D6E8F2;--white:#fff;--text2:#2C4A6A;}\n*{box-sizing:border-box;margin:0;padding:0;}\nbody{font-family:"Microsoft YaHei","Helvetica Neue",system-ui,sans-serif;\n     background:var(--bg);color:var(--text);font-size:14px;line-height:1.6;\n     display:flex;flex-direction:column;min-height:100vh;overflow:auto;}\na{color:inherit;text-decoration:none;}\n\n/* ── NAV ── */\nnav{background:var(--b900);padding:0 32px;display:flex;align-items:center;gap:20px;\n    height:54px;flex-shrink:0;z-index:300;overflow:visible !important;\n    box-shadow:0 2px 10px rgba(11,45,71,.5);}\n.nav-logo-link{display:flex;align-items:center;gap:10px;flex-shrink:0;}\n.nav-divider{width:1px;height:24px;background:rgba(255,255,255,.15);flex-shrink:0;}\n.nav-project{color:rgba(255,255,255,.55);font-size:12px;letter-spacing:.2px;white-space:nowrap;}\n.nav-links{display:flex;flex:1;overflow:visible !important;position:relative;}\n.nav-links a{padding:0 14px;color:rgba(255,255,255,.6);font-size:12.5px;\n             height:54px;display:flex;align-items:center;white-space:nowrap;\n             transition:color .15s;border-bottom:2px solid transparent;}\n.nav-links a:hover{color:rgba(255,255,255,.9);}\n.nav-links a.active{color:#fff;border-bottom-color:#5EA4CE;}\n.nav-dropdown{position:relative;display:inline-flex;align-items:center;}\n.nav-dropdown>a{padding:0 14px;color:rgba(255,255,255,.6);font-size:12.5px;\n  height:54px;display:flex;align-items:center;white-space:nowrap;\n  transition:color .15s;border-bottom:2px solid transparent;cursor:pointer;}\n.nav-dropdown>a:hover,.nav-dropdown:hover>a{color:#fff;}\n.nav-dropdown>a.active{color:#fff;border-bottom-color:#5EA4CE;}\n.nav-arrow{font-size:10px;margin-left:3px;opacity:.7;}\n.nav-dropdown-panel{display:none;position:absolute;top:54px;left:0;z-index:400;\n  background:var(--b900);border:1px solid rgba(255,255,255,.1);\n  border-top:2px solid #5EA4CE;border-radius:0 0 6px 6px;\n  padding:16px 20px;min-width:540px;box-shadow:0 8px 24px rgba(11,45,71,.6);}\n.nav-dropdown:hover .nav-dropdown-panel{display:block;}\n.nav-dd-row{display:flex;gap:0;}\n.nav-dd-col{flex:1;padding:0 16px 0 0;}\n.nav-dd-col:last-child{padding-right:0;}\n.nav-dd-col+.nav-dd-col{border-left:1px solid rgba(255,255,255,.08);padding-left:16px;}\n.nav-dd-group-title{font-size:10px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;\n  color:#5EA4CE;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,.08);}\n.nav-dd-panel a{display:block;padding:5px 0;color:rgba(255,255,255,.65);font-size:12.5px;transition:color .12s;}\n.nav-dd-panel a:hover{color:#fff;}\n.nav-dd-research{margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.08);}\n.nav-dd-research .nav-dd-group-title{margin-bottom:6px;}\n.nav-dd-research-links{display:flex;gap:20px;}\n.nav-dd-research-links a{color:rgba(255,255,255,.65);font-size:12.5px;padding:3px 0;transition:color .12s;}\n.nav-dd-research-links a:hover{color:#fff;}\n\n/* ── HERO STRIP ── */\n.hero-strip{background:linear-gradient(135deg,var(--b900) 0%,var(--b700) 100%);\n  color:#fff;padding:12px 32px;display:flex;align-items:center;gap:20px;\n  flex-shrink:0;border-bottom:3px solid var(--b500);}\n.hero-strip h1{font-size:15px;font-weight:800;}\n.hero-strip p{font-size:11.5px;opacity:.65;margin-top:1px;}\n.hero-chips{display:flex;gap:6px;margin-left:auto;flex-wrap:wrap;}\n.chip{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.14);\n      border-radius:3px;padding:2px 9px;font-size:10.5px;letter-spacing:.3px;}\n\n/* ── GANTT TOOLBAR ── */\n.gantt-toolbar{background:var(--white);border-bottom:1px solid var(--pale);\n  padding:6px 18px;display:flex;align-items:center;gap:8px;flex-shrink:0;flex-wrap:wrap;}\n.g-btn{padding:4px 10px;border:1px solid var(--pale);border-radius:5px;font-size:11.5px;\n  cursor:pointer;background:var(--bg);color:var(--steel);font-family:inherit;transition:all .15s;}\n.g-btn:hover{background:var(--pale);}\n.g-btn.active{background:var(--primary);color:#fff;border-color:var(--primary);}\n.g-legend{margin-left:auto;display:flex;align-items:center;gap:10px;font-size:10.5px;color:var(--muted);flex-wrap:wrap;}\n.g-dot{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:3px;vertical-align:middle;}\n\n/* ── GANTT BODY ── */\n.gantt-outer{flex:1;display:flex;overflow:hidden;}\n#ganttLeft{width:400px;min-width:400px;flex-shrink:0;overflow-y:auto;overflow-x:hidden;\n  border-right:2px solid var(--pale);}\n#ganttRight{flex:1;overflow:auto;}\n.gantt-col-hd{background:var(--dark);color:#fff;display:grid;grid-template-columns:1fr 56px 56px;padding:10px 12px;font-size:11px;font-weight:700;position:sticky;top:0;z-index:2;letter-spacing:.4px;text-transform:uppercase;}\n\n/* ── Issue Panel ── */\n#issuePanel{position:fixed;top:0;right:-480px;width:460px;height:100vh;\n  background:#fff;box-shadow:-4px 0 24px rgba(11,45,71,.18);z-index:500;\n  display:flex;flex-direction:column;transition:right .25s ease;overflow:hidden;}\n#issuePanel.open{right:0;}\n.ip-header{background:var(--b900);color:#fff;padding:14px 18px;display:flex;\n  align-items:center;gap:10px;flex-shrink:0;}\n.ip-header h3{font-size:14px;font-weight:700;flex:1;white-space:nowrap;\n  overflow:hidden;text-overflow:ellipsis;}\n.ip-close{background:rgba(255,255,255,.15);border:none;color:#fff;\n  width:28px;height:28px;border-radius:4px;cursor:pointer;font-size:16px;\n  display:flex;align-items:center;justify-content:center;flex-shrink:0;}\n.ip-close:hover{background:rgba(255,255,255,.25);}\n.ip-body{flex:1;overflow-y:auto;padding:16px 18px;}\n.ip-section{margin-bottom:16px;}\n.ip-label{font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;\n  letter-spacing:.5px;margin-bottom:5px;}\n.ip-field{width:100%;padding:7px 10px;border:1px solid var(--rule);border-radius:5px;\n  font-size:13px;font-family:inherit;color:var(--text);background:#fff;\n  transition:border-color .15s;}\n.ip-field:focus{outline:none;border-color:var(--b500);}\n.ip-field:read-only{background:var(--b050);color:var(--muted);}\ntextarea.ip-field{resize:vertical;min-height:100px;line-height:1.6;}\n.ip-row2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}\n.ip-footer{padding:12px 18px;border-top:1px solid var(--rule);display:flex;\n  gap:8px;flex-shrink:0;background:#fff;}\n.ip-btn{padding:7px 16px;border-radius:5px;font-size:12.5px;font-weight:700;\n  cursor:pointer;border:none;font-family:inherit;transition:all .15s;}\n.ip-btn-primary{background:var(--b500);color:#fff;}\n.ip-btn-primary:hover{background:var(--b700);}\n.ip-btn-ghost{background:var(--b050);color:var(--b700);border:1px solid var(--rule);}\n.ip-btn-ghost:hover{background:var(--rule);}\n.ip-btn-danger{background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;}\n.ip-badge{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;\n  font-weight:700;padding:2px 8px;border-radius:3px;margin-right:4px;}\n.ip-badge-open{background:var(--b050);color:var(--b700);}\n.ip-badge-closed{background:#f0fdf4;color:#15803d;}\n.ip-loading{text-align:center;padding:30px;color:var(--muted);font-size:13px;}\n.ip-meta{font-size:11.5px;color:var(--muted);margin-top:4px;}\n.ip-link{color:var(--b500);font-size:12px;text-decoration:none;}\n.ip-link:hover{text-decoration:underline;}\n#panelOverlay{position:fixed;inset:0;background:rgba(11,45,71,.25);z-index:499;\n  display:none;}\n#panelOverlay.open{display:block;}\n.ip-pct-wrap{display:flex;align-items:center;gap:8px;}\n.ip-pct-wrap input[type=range]{flex:1;accent-color:var(--b500);}\n.ip-pct-num{font-size:13px;font-weight:700;color:var(--b500);min-width:36px;text-align:right;}\n\n/* ── DASHBOARD ── */\n.dash-hero{background:linear-gradient(135deg,var(--b900) 0%,var(--b700) 100%);\n  color:#fff;padding:20px 32px;flex-shrink:0;border-bottom:3px solid var(--b500);}\n.dash-hero h1{font-size:18px;font-weight:800;margin-bottom:3px;}\n.dash-hero p{font-size:12.5px;opacity:.7;}\n.dash-chips{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;}\n.dash-chip{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);\n  border-radius:3px;padding:3px 10px;font-size:11px;}\n.dash-body{flex:1;padding:24px 32px;overflow-y:auto;}\n.stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:24px;}\n.stat-card{background:#fff;border-radius:8px;padding:16px 18px;\n  box-shadow:0 1px 4px rgba(11,45,71,.08);border:1px solid var(--rule);}\n.stat-card .sc-num{font-size:28px;font-weight:800;color:var(--b700);line-height:1;}\n.stat-card .sc-sub{font-size:11.5px;color:var(--muted);margin-top:4px;}\n.stat-card .sc-link{font-size:11px;color:var(--b500);margin-top:6px;display:block;text-decoration:none;}\n.stat-card .sc-link:hover{text-decoration:underline;}\n.dash-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}\n.dash-card{background:#fff;border-radius:8px;padding:18px 20px;\n  box-shadow:0 1px 4px rgba(11,45,71,.08);border:1px solid var(--rule);}\n.dash-card h3{font-size:13px;font-weight:800;color:var(--b900);\n  margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--rule);\n  display:flex;align-items:center;justify-content:space-between;}\n.dash-card h3 a{font-size:11px;font-weight:400;color:var(--b500);text-decoration:none;}\n.dash-card h3 a:hover{text-decoration:underline;}\n.task-item{display:flex;align-items:flex-start;gap:8px;padding:7px 0;\n  border-bottom:1px solid var(--rule);font-size:12.5px;}\n.task-item:last-child{border-bottom:none;}\n.task-item .ti-num{font-size:10.5px;color:var(--muted);min-width:28px;flex-shrink:0;margin-top:1px;}\n.task-item .ti-title{flex:1;color:var(--text);line-height:1.45;}\n.task-item .ti-title a{color:var(--text);text-decoration:none;}\n.task-item .ti-title a:hover{color:var(--b500);}\n.task-item .ti-badge{font-size:10px;font-weight:700;padding:1px 7px;border-radius:10px;\n  white-space:nowrap;flex-shrink:0;}\n.badge-wip{background:#EBF4FF;color:var(--b700);border:1px solid var(--b100);}\n.badge-done{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;}\n.badge-todo{background:var(--bg);color:var(--muted);border:1px solid var(--rule);}\n.ms-item-row{display:flex;align-items:center;gap:8px;padding:7px 0;\n  border-bottom:1px solid var(--rule);font-size:12.5px;}\n.ms-item-row:last-child{border-bottom:none;}\n.ms-item-row .mi-name{flex:1;color:var(--b900);font-weight:600;}\n.ms-item-row .mi-date{font-size:11px;color:var(--muted);white-space:nowrap;}\n.ms-item-row .mi-status{font-size:10px;font-weight:700;padding:1px 8px;border-radius:10px;white-space:nowrap;}\n.risk-row{display:flex;align-items:center;gap:8px;padding:7px 0;\n  border-bottom:1px solid var(--rule);font-size:12.5px;}\n.risk-row:last-child{border-bottom:none;}\n.risk-row .rr-title{flex:1;color:var(--text);}\n.risk-row .rr-badge{font-size:10px;font-weight:700;padding:1px 8px;border-radius:10px;\n  white-space:nowrap;}\n.pct-bar{background:var(--rule);border-radius:3px;height:6px;margin-top:10px;}\n.pct-fill{height:6px;border-radius:3px;background:var(--b500);transition:width .4s;}\n.loading-row{color:var(--muted);font-size:12px;padding:12px 0;text-align:center;}\n.chart-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px;}\n.chart-card{background:#fff;border-radius:8px;padding:18px 20px;border:1px solid var(--rule);\n  box-shadow:0 1px 4px rgba(11,45,71,.08);}\n.chart-card h3{font-size:13px;font-weight:800;color:var(--b900);margin-bottom:14px;}\n.chart-wrap{position:relative;height:180px;}\n.donut-legend{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:10px;}\n.dl-item{display:flex;align-items:center;gap:5px;font-size:11.5px;color:var(--text);}\n.dl-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}\n.pct-big{font-size:36px;font-weight:800;color:var(--b500);line-height:1;margin:20px 0 6px;}\n.pct-sub2{font-size:12.5px;color:var(--muted);}\n@media(max-width:900px){.chart-row{grid-template-columns:1fr;}}\n\n';
    document.head.appendChild(style);
  }

  // ── 写入 nav HTML ──────────────────────────────────────────────────────────
  const placeholder = document.getElementById('site-nav');
  if (!placeholder) return;
  placeholder.outerHTML = `<nav>
  <a href="/fsl-report/" class="nav-logo-link" style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 36" height="26" aria-label="FSL 佛山照明">
      <rect x="0" y="3" width="4" height="30" fill="#F06000"/>
      <rect x="0" y="3" width="18" height="4" fill="#F06000"/>
      <rect x="0" y="16" width="13" height="4" fill="#F06000"/>
      <path d="M22 3 h14 v4 h-9 v6 h9 v4 h-9 v7 h10 v4 h-15 v-9 h9 v-3 h-9 z" fill="#F06000"/>
      <rect x="42" y="3" width="4" height="30" fill="#F06000"/>
      <rect x="42" y="29" width="16" height="4" fill="#F06000"/>
      <text x="66" y="26" font-family="Microsoft YaHei,PingFang SC,sans-serif"
            font-size="14" font-weight="700" fill="rgba(255,255,255,0.92)" letter-spacing="1">佛山照明</text>
    </svg>
  </a>
  <div class="nav-divider"></div>
  <span class="nav-project">数字化转型项目工作台</span>
  <div class="nav-links">
    <a href="/fsl-report/">工作台首页</a>
    <div class="nav-dropdown">
      <a href="/fsl-report/deliverables/">交付物 <span class="nav-arrow">▾</span></a>
      <div class="nav-dropdown-panel">
        <div class="nav-dd-row">
          <div class="nav-dd-col nav-dd-panel">
            <div class="nav-dd-group-title">管理咨询交付</div>
            <a href="/fsl-report/consulting/diagnosis/report-01.html">1. 现状诊断报告</a>
            <a href="/fsl-report/consulting/blueprint/ea-report.html">2. 企业架构设计报告</a>
            <a href="/fsl-report/consulting/solutions/">3. 专项方案设计报告</a>
            <a href="/fsl-report/consulting/solutions/s05-overseas-finance.html" style="padding-left:28px;font-size:11.5px;opacity:.85">└ S05 海外财务本地化体系建设</a>
            <a href="/fsl-report/consulting/blueprint/data-survey.html">4.1 数据调研分析报告</a>
            <a href="/fsl-report/consulting/blueprint/data-governance.html">4.2 数据规划及管理办法</a>
            <a href="/fsl-report/consulting/blueprint/data-summary.html">4.3 数据治理总结报告</a>
            <a href="/fsl-report/consulting/blueprint/org-design.html">5. 组织设计报告</a>
            <a href="/fsl-report/consulting/roadmap/roadmap-report.html">6. 数字化转型路径规划</a>
          </div>
          <div class="nav-dd-col nav-dd-panel">
            <div class="nav-dd-group-title">SAP 实施交付</div>
            <a href="/fsl-report/sap/prepare/">项目准备阶段</a>
            <a href="/fsl-report/sap/blueprint/">蓝图方案设计</a>
            <a href="/fsl-report/sap/realize/">系统实现阶段</a>
            <a href="/fsl-report/sap/deploy/">上线切换阶段</a>
          </div>
        </div>
        <div class="nav-dd-research">
          <div class="nav-dd-group-title">行业研究</div>
          <div class="nav-dd-research-links">
            <a href="/fsl-report/research/">照明行业对标研究</a>
          </div>
        </div>
      </div>
    </div>
    <a href="/fsl-report/weekly/">项目周报</a>
    <div class="nav-dropdown">
      <a href="/fsl-report/kanban/" class="active">任务看板 <span class="nav-arrow">▾</span></a>
      <div class="nav-dropdown-panel">
        <div class="nav-dd-row">
          <div class="nav-dd-col nav-dd-panel">
            <div class="nav-dd-group-title">看板视图</div>
            <a href="/fsl-report/kanban/#kanban">📋 看板</a>
            <a href="/fsl-report/kanban/#milestone">🎯 里程碑</a>
            <a href="/fsl-report/kanban/#tasklist">☑ 任务列表</a>
            <a href="/fsl-report/kanban/#gantt">📅 甘特图</a>
            <a href="/fsl-report/kanban/#risk">⚠️ 风险</a>
          </div>
          <div class="nav-dd-col nav-dd-panel">
            <div class="nav-dd-group-title">分析与管理</div>
            <a href="/fsl-report/kanban/#deliverable">📦 交付物追踪</a>
            <a href="/fsl-report/kanban/#stats">📊 统计</a>
            <a href="/fsl-report/kanban/#org">🏗 项目架构</a>
            <a href="/fsl-report/kanban/">📋 调研访谈</a>
            <a href="/fsl-report/weekly/">📰 项目周报</a>
          </div>
        </div>
        <div class="nav-dd-research">
          <div class="nav-dd-group-title">案例</div>
          <div class="nav-dd-research-links">
            <a href="https://estatea.github.io/mdg-course/" target="_blank">🎓 MDG案例</a>
            <a href="https://estatea.github.io/drc-course/" target="_blank">📋 DRC案例</a>
            <a href="https://estatea.github.io/si-course/" target="_blank">🔗 SI案例</a>
            <a href="https://estatea.github.io/gr-course/" target="_blank">📊 GR案例</a>
          </div>
        </div>
        <div class="nav-dd-research">
          <div class="nav-dd-group-title">AI互动课程</div>
          <div class="nav-dd-research-links">
            <a href="https://openmaic-silk-eight.vercel.app/classroom/kHmdhBRu5Q" target="_blank">📐 TOGAF Part1·基础+ADM</a>
            <a href="https://openmaic-silk-eight.vercel.app/classroom/C0dIqCj-sV" target="_blank">📐 TOGAF Part2a·ADM E-H</a>
            <a href="https://openmaic-silk-eight.vercel.app/classroom/wS_s1UdoJr" target="_blank">📐 TOGAF Part2b·内容框架</a>
            <a href="https://openmaic-silk-eight.vercel.app/classroom/-TdcLOQA8R" target="_blank">📐 TOGAF Part3a·治理框架</a>
            <a href="https://openmaic-silk-eight.vercel.app/classroom/sO9_r11KJq" target="_blank">📐 TOGAF Part3b·实战冲刺</a>
            <a href="https://openmaic-silk-eight.vercel.app/classroom/VQiRvoKo8d" target="_blank">📊 DCMM数据管理评估</a>
            <a href="https://openmaic-silk-eight.vercel.app/classroom/Qh191HWcEw" target="_blank">📈 数字化转型成熟度评估</a>
            <a href="https://openmaic-silk-eight.vercel.app" target="_blank">➕ 生成新课程</a>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="nav-right">
    <div id="userBadge" style="display:none;align-items:center;gap:8px;padding:0 4px">
      <img id="userAvatar" src="" alt="" style="width:28px;height:28px;border-radius:50%;border:2px solid rgba(255,255,255,.2)">
      <span id="userName" style="font-size:12px;color:rgba(255,255,255,.75);max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>
      <a id="adminNavLink" href="/fsl-report/kanban/admin.html" style="display:none;font-size:11px;padding:3px 8px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:5px;color:#fff;align-items:center;gap:4px;">⚙️ 管理</a>
      <button onclick="doLogout()" class="btn btn-ghost" style="font-size:11px;padding:3px 8px">退出</button>
    </div>
    <button onclick="goLogin()" class="btn btn-ghost" id="loginNavBtn" style="display:none;font-size:11.5px">🔑 登录</button>
  </div>
    <div class="nav-dropdown">
      <a href="/fsl-report/togaf/" style="padding:0 14px;color:rgba(255,255,255,.75);font-size:12.5px;height:54px;display:flex;align-items:center;white-space:nowrap;font-weight:600;">TOGAF &amp; EA <span class="nav-arrow">▾</span></a>
      <div class="nav-dropdown-panel">
        <div class="nav-dd-row">
          <div class="nav-dd-col nav-dd-panel">
            <div class="nav-dd-group-title">架构工作台</div>
            <a href="/fsl-report/togaf/">📐 TOGAF ADM 工作台</a>
            <a href="/fsl-report/req_tracing.html">🗺️ 需求追踪工作台</a>
          </div>
          <div class="nav-dd-col nav-dd-panel">
            <div class="nav-dd-group-title">EA 输出</div>
            <a href="/fsl-report/consulting/blueprint/ea-report.html">企业架构设计报告</a>
            <a href="/fsl-report/consulting/roadmap/roadmap-report.html">数字化转型路径规划</a>
          </div>
        </div>
      </div>
    </div>
</nav>`;

  // ── active 状态：根据当前路径高亮对应菜单项 ────────────────────────────────
  const path = window.location.pathname;
  const nav  = document.querySelector('nav');
  if (!nav) return;

  // 清除所有 active
  nav.querySelectorAll('a.active, a.active-if-kanban').forEach(a => {
    a.classList.remove('active');
  });

  // 精确匹配规则（从长到短，防止 / 误匹配所有页面）
  const rules = [
    ['/fsl-report/req_tracing', 'a[href="/fsl-report/togaf/"]'],
    ['/fsl-report/togaf/',      'a[href="/fsl-report/togaf/"]'],
    ['/fsl-report/kanban/',     'a[href="/fsl-report/kanban/"]'],
    ['/fsl-report/weekly/',     'a[href="/fsl-report/weekly/"]'],
    ['/fsl-report/deliverables/','a[href="/fsl-report/deliverables/"]'],
    ['/fsl-report/consulting/', 'a[href="/fsl-report/deliverables/"]'],
    ['/fsl-report/sap/',        'a[href="/fsl-report/deliverables/"]'],
    ['/fsl-report/research/',   'a[href="/fsl-report/deliverables/"]'],
    ['/fsl-report/',            'a[href="/fsl-report/"]'],
  ];
  for (const [prefix, sel] of rules) {
    if (path.startsWith(prefix)) {
      const el = nav.querySelector(sel);
      if (el) { el.classList.add('active'); break; }
    }
  }

  // survey / kanban 子页面也高亮「任务看板」
  if (path.includes('/kanban/')) {
    const a = nav.querySelector('a[href="/fsl-report/kanban/"]');
    if (a) a.classList.add('active');
  }

  // ── 登录状态显示 ──────────────────────────────────────────────────────────────
  (function () {
    function getSession() {
      try {
        var s = localStorage.getItem('fsl_session') || sessionStorage.getItem('fsl_session');
        if (s) {
          var d = JSON.parse(s);
          if (!d.exp || d.exp > Math.floor(Date.now() / 1000)) return d;
        }
        // 兼容旧版 PAT
        var ghToken = localStorage.getItem('gh_token_fsl') || sessionStorage.getItem('gh_token_fsl');
        if (ghToken) {
          var u = JSON.parse(localStorage.getItem('gh_user_fsl') || sessionStorage.getItem('gh_user_fsl') || '{}');
          return { login_type: 'github', name: u.name || u.login, avatar_url: u.avatar_url };
        }
        return null;
      } catch (e) { return null; }
    }

    var session = getSession();
    var badge   = document.getElementById('userBadge');
    var loginBtn = document.getElementById('loginNavBtn');

    if (session) {
      if (badge) {
        var avatar = document.getElementById('userAvatar');
        var nameEl = document.getElementById('userName');
        if (avatar) {
          if (session.avatar_url) {
            avatar.src = session.avatar_url;
            avatar.style.display = 'block';
          } else {
            avatar.style.display = 'none';
          }
        }
        if (nameEl) nameEl.textContent = session.name || session.email || session.login || '用户';
        badge.style.display = 'flex';
        // 管理员入口：邮箱登录的 is_admin，或 GitHub 仓库 owner
        var isAdmin = session.is_admin || session.login === 'EstaTea';
        var adminLink = document.getElementById('adminNavLink');
        if (adminLink) adminLink.style.display = isAdmin ? 'flex' : 'none';
      }
      if (loginBtn) loginBtn.style.display = 'none';
    } else {
      if (badge) badge.style.display = 'none';
      if (loginBtn) loginBtn.style.display = 'flex';
    }
  })();
})();

function goLogin() {
  var returnTo = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = '/fsl-report/kanban/login.html?return=' + returnTo;
}

function doLogout() {
  localStorage.removeItem('fsl_session');  sessionStorage.removeItem('fsl_session');
  localStorage.removeItem('gh_token_fsl'); sessionStorage.removeItem('gh_token_fsl');
  localStorage.removeItem('gh_user_fsl');  sessionStorage.removeItem('gh_user_fsl');
  window.location.href = '/fsl-report/kanban/login.html';
}

// ── mod-tab 下拉 Toggle 函数（调研/MDG/DRC/SI）─────────────────────────────────
// 所有页面通过 nav.js 加载后，这四个函数在全局可用
function _fslToggleDd(e, panelId) {
  e.stopPropagation();
  var panel = document.getElementById(panelId);
  if (!panel) return;
  var btn = e.currentTarget;
  var rect = btn.getBoundingClientRect();
  var isOpen = panel.classList.contains('dd-open');
  document.querySelectorAll('.mod-tab-dd-panel').forEach(function(p) {
    p.classList.remove('dd-open');
  });
  if (!isOpen) {
    panel.style.top  = (rect.bottom + 2) + 'px';
    panel.style.left = rect.left + 'px';
    panel.classList.add('dd-open');
  }
}
function toggleSurveyDd(e) { _fslToggleDd(e, 'survey-dropdown'); }
function toggleMdgDd(e)    { _fslToggleDd(e, 'mdg-dropdown');    }
function toggleDrcDd(e)    { _fslToggleDd(e, 'drc-dropdown');    }
function toggleSiDd(e)     { _fslToggleDd(e, 'si-dropdown');     }
function toggleGrDd(e)     { _fslToggleDd(e, 'gr-dropdown');     }

// 点击页面任意处关闭所有 mod-tab 下拉
document.addEventListener('click', function() {
  document.querySelectorAll('.mod-tab-dd-panel').forEach(function(p) {
    p.classList.remove('dd-open');
  });
});
