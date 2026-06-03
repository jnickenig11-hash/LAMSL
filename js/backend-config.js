(function(){
  // Central backend configuration for frontend pages.
  // Default points to the Render deployment; developers can override by setting
  // localStorage.setItem('LAMSL_BACKEND', 'http://localhost:3000')
  const defaultBase = 'https://lamsl-backend.onrender.com';
  const override = (typeof localStorage !== 'undefined') ? localStorage.getItem('LAMSL_BACKEND') : null;
  window.BACKEND_BASE = override || defaultBase;

  window.apiUrl = function(path) {
    if (!path) return window.BACKEND_BASE;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return window.BACKEND_BASE.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path);
  };
})();
