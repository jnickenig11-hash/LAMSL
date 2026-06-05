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

    // Prefer explicit deployment key when one was configured locally.
    const storedKey = (typeof localStorage !== 'undefined') ? localStorage.getItem('LAMSL_ADMIN_KEY') : null;
    if (storedKey) {
      window.ADMIN_API_KEY = storedKey;
      headers['x-admin-key'] = storedKey;
    }

    // Also attach the current site session so logged-in admin/umpire users can save
    // without manually entering the backend key. The backend validates these role headers.
    try {
      const sessionRaw = (typeof localStorage !== 'undefined') ? localStorage.getItem('lamslSessionV1') : null;
      const session = sessionRaw ? JSON.parse(sessionRaw) : null;
      if (session && session.username && session.role) {
        headers['x-lamsl-username'] = session.username;
        headers['x-lamsl-role'] = session.role;
        headers['x-lamsl-session'] = 'active';
      }
    } catch (e) {}

    return headers;
  };
})();
