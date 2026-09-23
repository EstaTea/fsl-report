/* FSL 工作台 — 统一导航装载器（全局约定：所有页面顶端都应有导航）
 *
 * 用法：在 <body> 开头加一行，相对路径按目录深度调整：
 *   <script src="../../nav-include.js"></script>     ← 两级目录（如 training/stage/）
 *   <script src="../nav-include.js"></script>        ← 一级目录（如 training/）
 *   <script src="nav-include.js"></script>           ← 根目录
 *
 * 行为：
 *   1. 顶层窗口渲染导航；被 iframe 内嵌时默认不渲染（仿真舞台 / 图表卡片 /
 *      SCORM SCO 都是被嵌的，加导航会出现双导航并挤压仿真界面）。
 *      需要用顶层方式预览时加参数 ?nav=1。
 *   2. 页面若已自带 <div id="site-nav"> 占位符，则不作处理（避免重复注入）。
 *   3. nav.js 与本文件同目录，路径自动推导，不需要每页手写层级。
 */
(function () {
  var embedded = false;
  try { embedded = window.self !== window.top; } catch (e) { embedded = false; }
  var force = /[?&]nav=1\b/.test(location.search);
  if (embedded && !force) return;
  if (document.getElementById('site-nav')) return;
  if (!document.body) {                       // 脚本被放到 <head> 时的兜底
    document.addEventListener('DOMContentLoaded', arguments.callee);
    return;
  }
  var self = document.currentScript;
  var base = self ? String(self.src).replace(/nav-include\.js.*$/, '') : './';
  var ph = document.createElement('div');
  ph.id = 'site-nav';
  document.body.insertBefore(ph, document.body.firstChild);
  var s = document.createElement('script');
  s.src = base + 'nav.js';
  s.async = false;
  document.head.appendChild(s);
})();
