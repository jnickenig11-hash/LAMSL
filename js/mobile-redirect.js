(function () {
  const params = new URLSearchParams(window.location.search);
  if (params.get('fullsite') === '1') {
    try { sessionStorage.setItem('lamslFullSiteRequested', '1'); } catch (e) {}
    return;
  }
  try {
    if (sessionStorage.getItem('lamslFullSiteRequested') === '1') return;
  } catch (e) {}

  const path = window.location.pathname.toLowerCase();
  if (path.endsWith('/mobile.html')) return;

  const isMobileViewport = window.matchMedia && window.matchMedia('(max-width: 799px)').matches;
  const isMobileAgent = /android|iphone|ipod|ipad|iemobile|opera mini|mobile/i.test(navigator.userAgent || '');
  if (isMobileViewport || isMobileAgent) {
    window.location.replace('mobile.html');
  }
})();
