(function(){
  // Central backend configuration for frontend pages.
  // Default points to the Render deployment; developers can override by setting
  // localStorage.setItem('LAMSL_BACKEND', 'http://localhost:3000')
  const defaultBase = 'https://lamsl-backend.onrender.com';
  const override = (typeof localStorage !== 'undefined') ? localStorage.getItem('LAMSL_BACKEND') : null;
  window.BACKEND_BASE = override || defaultBase;
  window.ADMIN_API_KEY = (typeof localStorage !== 'undefined') ? localStorage.getItem('LAMSL_ADMIN_KEY') : null;

  window.apiUrl = function(path) {
    if (!path) return window.BACKEND_BASE;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return window.BACKEND_BASE.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path);
  };

  window.apiHeaders = function(additionalHeaders) {
    const headers = Object.assign({}, additionalHeaders || {});
    if (window.ADMIN_API_KEY) {
      headers['x-admin-key'] = window.ADMIN_API_KEY;
    }
    return headers;
  };
})();
