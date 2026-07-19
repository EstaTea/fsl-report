// FSL Auth Guard - 所有受保护页面引用此脚本
// 检查 session 有效性，无效则跳转登录页
(function(){
  var LOGIN = '/fsl-report/kanban/login.html';

  function getSession(){
    try{
      var s = localStorage.getItem('fsl_session') || sessionStorage.getItem('fsl_session');
      if(!s){
        // 兼容旧版 GitHub PAT 存储
        var ghToken = localStorage.getItem('gh_token_fsl') || sessionStorage.getItem('gh_token_fsl');
        if(ghToken){
          var ghUser = JSON.parse(localStorage.getItem('gh_user_fsl') || sessionStorage.getItem('gh_user_fsl') || '{}');
          return { login_type:'github', gh_token:ghToken, login:ghUser.login, name:ghUser.name, avatar_url:ghUser.avatar_url };
        }
        return null;
      }
      var data = JSON.parse(s);
      if(data.exp && data.exp < Math.floor(Date.now()/1000)) return null;
      return data;
    }catch(e){ return null; }
  }

  var session = getSession();
  if(!session){
    var returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(LOGIN + '?return=' + returnTo);
  }

  // 全局暴露 session 供页面使用
  window.FSL_SESSION = session;
})();
