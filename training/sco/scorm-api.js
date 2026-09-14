/*
 * 最小化 SCORM 1.2 运行时桥接（Runtime API Wrapper） — 自研，MIT License
 * 作用：在 SCO（课程内容对象）与 LMS 暴露的 SCORM API 之间做安全封装。
 * 标准：ADL SCORM 1.2（LMS 在父窗口暴露 window.API，方法前缀 LMS*）。
 * 用法：
 *   SCORM.init();
 *   SCORM.set('cmi.core.lesson_status','completed');
 *   SCORM.set('cmi.core.score.raw','100');
 *   SCORM.commit();
 *   SCORM.quit();
 * 非 LMS 环境（本地双击打开）下 init() 返回 false，调用静默降级，不影响演示。
 */
(function (global) {
  'use strict';

  var api = null;
  var initialized = false;

  // 沿 window.parent 向上查找 LMS 注入的 API 对象（最多 500 层）
  function findAPI(win) {
    var n = 0;
    while (win && n < 500) {
      if (win.API && typeof win.API.LMSInitialize === 'function') return win.API;
      n++;
      win = win.parent;
    }
    return null;
  }

  function getAPI() {
    if (api) return api;
    api = findAPI(global.parent) || findAPI(global);
    return api;
  }

  var SCORM = {
    init: function () {
      if (initialized) return true;
      var a = getAPI();
      if (!a) {
        if (global.console) console.warn('[SCORM] 未检测到 LMS API，成绩不会上报（本地演示模式）。');
        return false;
      }
      var ret = a.LMSInitialize('');
      if (ret !== '0') {
        if (global.console) console.error('[SCORM] LMSInitialize 失败，错误码 ' + a.LMSGetLastError(''));
        return false;
      }
      initialized = true;
      return true;
    },
    get: function (param) {
      if (!initialized) return '';
      var a = getAPI();
      if (!a) return '';
      try { return a.LMSGetValue(param) || ''; } catch (e) { return ''; }
    },
    set: function (param, value) {
      if (!initialized) return false;
      var a = getAPI();
      if (!a) return false;
      var ret = a.LMSSetValue(param, value === undefined ? '' : String(value));
      return ret === '0';
    },
    commit: function () {
      if (!initialized) return false;
      var a = getAPI();
      if (!a) return false;
      return a.LMSCommit('') === '0';
    },
    quit: function () {
      if (!initialized) return false;
      var a = getAPI();
      if (a) a.LMSFinish('');
      initialized = false;
      return true;
    },
    getLastError: function () {
      var a = getAPI();
      return a ? a.LMSGetLastError('') : '';
    },
    isInitialized: function () { return initialized; }
  };

  global.SCORM = SCORM;
})(window);
