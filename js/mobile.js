(function(){
  'use strict';

  const CONTENT_CACHE_KEY = 'lamslMobileContentV1';
  const SESSION_KEY = 'lamslSessionV1';
  const INSTALL_STATE_KEY = 'lamslAppInstalled';
  const DIVISIONS = ['All','A','B','C','D','E'];
  const state = { content: {}, session: null, deferredInstallPrompt: null };

  const $ = id => document.getElementById(id);
  const api = path => (window.apiUrl ? window.apiUrl(path) : path);
  const headers = extra => (window.apiHeaders ? window.apiHeaders(extra) : (extra || {}));

  function readJson(key, fallback){ try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch(e){ return fallback; } }
  function writeJson(key, value){ try { localStorage.setItem(key, JSON.stringify(value)); } catch(e){} }
  function escapeHtml(value){ return String(value == null ? '' : value).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function normalizeRole(role){ return String(role || '').toLowerCase().replace('_','-').replace('team manager','team-manager'); }
  function isAdmin(){ return normalizeRole(state.session && state.session.role) === 'admin'; }
  function parseDate(value){ const d = new Date(String(value || '') + 'T00:00:00'); return Number.isNaN(d.getTime()) ? null : d; }
  function dateLabel(value){ const d = parseDate(value); return d ? d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'}) : 'Date TBD'; }
  function fullDateLabel(value){ const d = parseDate(value); return d ? d.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'}) : 'Date TBD'; }
  function getGameId(game, index){ return String(game.id || `${game.date || 'date'}-${game.time || 'time'}-${game.team1 || 'team1'}-${game.team2 || 'team2'}-${index}`); }
  function teamUrl(team, division){ return `team.html?team=${encodeURIComponent(team || '')}&division=${encodeURIComponent(division || 'All')}`; }
  function sortedGames(){ return sortedGamesAsc(); }
  function sortedGamesAsc(){ return [...(state.content.gameSchedules || [])].sort((a,b) => String(a.date||'').localeCompare(String(b.date||'')) || String(a.time||'').localeCompare(String(b.time||'')) || String(a.park||'').localeCompare(String(b.park||''))); }
  function sortedGamesDesc(){ return [...(state.content.gameSchedules || [])].sort((a,b) => String(b.date||'').localeCompare(String(a.date||'')) || String(a.time||'').localeCompare(String(b.time||'')) || String(a.park||'').localeCompare(String(b.park||''))); }
  function gameHasScore(game){ return game && game.score1 !== '' && game.score2 !== '' && game.score1 != null && game.score2 != null; }
  function debounce(fn, delay){ let timeout; return function(...args){ clearTimeout(timeout); timeout = setTimeout(() => fn(...args), delay); }; }

  function populateFilters(){
    ['scheduleDivisionFilter','standingsDivisionFilter'].forEach(id => {
      const sel = $(id); if (!sel) return;
      const current = sel.value || 'All';
      sel.innerHTML = DIVISIONS.map(d => `<option value="${d}">${d === 'All' ? 'All Divisions' : 'Division ' + d}</option>`).join('');
      sel.value = DIVISIONS.includes(current) ? current : 'All';
    });
  }

  function gameCard(game, index){
    const id = getGameId(game, index);
    const division = game.division || 'All';
    const score = gameHasScore(game) ? `${escapeHtml(game.score1)} - ${escapeHtml(game.score2)}` : 'vs';
    return `<article class="game-card" data-game-id="${escapeHtml(id)}">
      <div class="game-meta">
        <div><div class="game-date">${escapeHtml(dateLabel(game.date))} • ${escapeHtml(game.time || 'Time TBD')}</div><span class="pill">${escapeHtml(division === 'All' ? 'League' : 'Division ' + division)}</span></div>
        <div class="game-park">${escapeHtml(game.park || 'Park TBD')}</div>
      </div>
      <div class="matchup">
        <a class="team" href="${teamUrl(game.team1, division)}">${escapeHtml(game.team1 || 'Team 1')}</a>
        <div class="scorebox">${score}</div>
        <a class="team" href="${teamUrl(game.team2, division)}">${escapeHtml(game.team2 || 'Team 2')}</a>
      </div>
      <div class="game-footer"><span>${escapeHtml(game.status || (gameHasScore(game) ? 'final' : 'scheduled'))}</span><span>${escapeHtml(fullDateLabel(game.date))}</span></div>
    </article>`;
  }


  function renderNextGames(){
    const games = sortedGamesDesc().filter(g => g && g.date && g.team1 && g.team2 && String(g.status || 'scheduled').toLowerCase() !== 'cancelled');
    const selectedDate = games.length ? games[0].date : '';
    const nextGames = selectedDate ? games.filter(g => g.date === selectedDate) : [];
    const badge = $('nextGamesDate');
    if (badge) badge.textContent = selectedDate ? dateLabel(selectedDate) : 'No games';
    $('nextGamesList').innerHTML = nextGames.length ? nextGames.map(gameCard).join('') : '<div class="empty-state">No games are currently scheduled.</div>';
  }

  function renderSchedule(){
    const division = $('scheduleDivisionFilter').value || 'All';
    const games = sortedGamesDesc().filter(g => division === 'All' || String(g.division || 'All') === division);
    $('scheduleList').innerHTML = games.length ? games.map(gameCard).join('') : '<div class="empty-state">No games are currently scheduled for this division.</div>';
  }

  function renderScores(){
    const scored = sortedGames().filter(gameHasScore).reverse();
    $('scoreCount').textContent = `${scored.length} final`;
    $('scoresList').innerHTML = scored.length ? scored.map(gameCard).join('') : '<div class="empty-state">No final scores have been posted yet.</div>';
  }

  function hasFinalScore(game){ return game && game.score1 !== '' && game.score2 !== '' && game.score1 != null && game.score2 != null && Number.isFinite(Number(game.score1)) && Number.isFinite(Number(game.score2)); }
  function allScheduledGamesScored(){
    const games = (state.content.gameSchedules || []).filter(game => game && game.team1 && game.team2 && String(game.status || 'scheduled').toLowerCase() !== 'cancelled');
    return games.length > 0 && games.every(hasFinalScore);
  }
  function divisionForTeam(team){
    const divisions = state.content.divisions || state.content.teamsByDivision || {};
    for (const [div, teams] of Object.entries(divisions)) if ((teams || []).includes(team)) return div;
    const saved = state.content.standings || {};
    for (const [div, rows] of Object.entries(saved)) if (rows && rows[team]) return div;
    return 'All';
  }
  function calculateStandingsFromScores(){
    const standings = JSON.parse(JSON.stringify(state.content.standings || {}));
    Object.values(standings).forEach(rows => Object.values(rows || {}).forEach(row => { row.w=0; row.l=0; row.t=0; row.rf=0; row.ra=0; row.gp=0; }));
    (state.content.gameSchedules || []).forEach(game => {
      if (!hasFinalScore(game)) return;
      const s1 = Number(game.score1), s2 = Number(game.score2);
      [[game.team1, s1, s2], [game.team2, s2, s1]].forEach(([team, rf, ra]) => {
        const div = divisionForTeam(team);
        standings[div] = standings[div] || {};
        const row = standings[div][team] = standings[div][team] || {w:0,l:0,t:0,rf:0,ra:0,gp:0};
        row.gp += 1; row.rf += rf; row.ra += ra;
        if (rf > ra) row.w += 1; else if (rf < ra) row.l += 1; else row.t += 1;
      });
    });
    return standings;
  }
  function buildStandingsFromGames(){
    const saved = JSON.parse(JSON.stringify(state.content.standings || {}));
    if (allScheduledGamesScored()) return calculateStandingsFromScores();
    if (saved && Object.keys(saved).length) return saved;
    return calculateStandingsFromScores();
  }

  function pct(row){ const gp = Number(row.w||0)+Number(row.l||0)+Number(row.t||0); return gp ? ((Number(row.w||0)+(Number(row.t||0)*0.5))/gp).toFixed(3).replace(/^0/,'') : '.000'; }
  function renderStandings(){
    const division = $('standingsDivisionFilter').value || 'All';
    const standings = buildStandingsFromGames();
    const divisions = division === 'All' ? Object.keys(standings).sort() : [division];
    const html = divisions.map(div => {
      const rows = Object.entries(standings[div] || {}).map(([team,row]) => ({team,...row,pct:pct(row)})).sort((a,b) => Number(b.w||0)-Number(a.w||0) || Number(a.l||0)-Number(b.l||0) || a.team.localeCompare(b.team));
      if (!rows.length) return '';
      return `<h3 class="standings-title">Division ${escapeHtml(div)}</h3><table class="standings-table"><thead><tr><th>Team</th><th>W</th><th>L</th><th>T</th><th>GP</th><th>PCT</th><th>RF</th><th>RA</th></tr></thead><tbody>${rows.map(r => `<tr><td><a class="team" href="${teamUrl(r.team, div)}">${escapeHtml(r.team)}</a></td><td>${r.w||0}</td><td>${r.l||0}</td><td>${r.t||0}</td><td>${r.gp||0}</td><td>${r.pct}</td><td>${r.rf||0}</td><td>${r.ra||0}</td></tr>`).join('')}</tbody></table>`;
    }).join('');
    $('standingsList').innerHTML = html || '<div class="empty-state">No standings are available yet.</div>';
  }

  function renderAnnouncements(){
    const announcements = [...(state.content.announcements || [])].reverse();
    $('announcementsList').innerHTML = announcements.length ? announcements.map(a => `<article class="announcement-card"><h3>${escapeHtml(a.title || 'League Announcement')}</h3><p>${escapeHtml(a.body || a.message || '')}</p><span class="pill">${escapeHtml(a.date ? fullDateLabel(String(a.date).slice(0,10)) : 'Posted')}</span></article>`).join('') : '<div class="empty-state">No announcements have been posted.</div>';
  }

  function populateAdminGameSelect(){
    const select = $('scoreGameSelect');
    const games = sortedGames();
    select.innerHTML = games.map((game, idx) => `<option value="${escapeHtml(getGameId(game, idx))}">${escapeHtml(dateLabel(game.date))} ${escapeHtml(game.time || '')} — ${escapeHtml(game.team1 || 'Team 1')} vs ${escapeHtml(game.team2 || 'Team 2')}</option>`).join('');
    syncSelectedGameScore();
  }

  function syncSelectedGameScore(){
    const id = $('scoreGameSelect').value;
    const game = sortedGames().find((g, idx) => getGameId(g, idx) === id);
    if (!game) return;
    $('score1Input').value = game.score1 || '';
    $('score2Input').value = game.score2 || '';
    $('gameStatusInput').value = game.status || (gameHasScore(game) ? 'final' : 'scheduled');
  }

  function renderAdmin(){
    state.session = readJson(SESSION_KEY, null);
    const signedIn = isAdmin();
    $('adminStatus').textContent = signedIn ? `Admin: ${state.session.username}` : 'Signed out';
    $('loginForm').hidden = signedIn;
    $('adminTools').hidden = !signedIn;
    if (signedIn) populateAdminGameSelect();
  }

  function renderAll(){
    populateFilters();
    renderNextGames(); renderSchedule(); renderScores(); renderStandings(); renderAnnouncements(); renderAdmin();
    const updated = state.content.updatedAt ? new Date(state.content.updatedAt).toLocaleString() : 'local content loaded';
    $('lastUpdated').textContent = `Last updated: ${updated}`;
  }

  async function loadContent(){
    state.content = readJson(CONTENT_CACHE_KEY, {});
    if (Object.keys(state.content).length) renderAll();
    try {
      const res = await fetch(api('/api/content'), { cache: 'no-store' });
      if (!res.ok) throw new Error('Content unavailable');
      state.content = await res.json();
      writeJson(CONTENT_CACHE_KEY, state.content);
      renderAll();
    } catch(e){
      if (!Object.keys(state.content).length) state.content = { gameSchedules: [], standings: {}, announcements: [] };
      renderAll();
      $('lastUpdated').textContent = 'Offline mode: showing saved mobile content.';
    }
  }

  async function saveContent(nextContent){
    const res = await fetch(api('/api/update'), { method:'POST', headers: headers({'Content-Type':'application/json'}), body: JSON.stringify(nextContent) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) throw new Error(data.error || 'Update failed');
    state.content = data.content || nextContent;
    writeJson(CONTENT_CACHE_KEY, state.content);
    renderAll();
  }

  async function login(event){
    event.preventDefault();
    $('adminMessage').textContent = 'Signing in...';
    try {
      const res = await fetch(api('/api/login'), { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username:$('adminUsername').value.trim(), password:$('adminPassword').value }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Login failed');
      const role = normalizeRole(data.role);
      if (role !== 'admin') throw new Error('Mobile updates require an Administrator account. Team managers should use the full admin/team tools.');
      state.session = { username:data.username, role, assignedTeam:data.assignedTeam || '', assignedDivision:data.assignedDivision || '' };
      localStorage.setItem('LAMSL_BACKEND_TOKEN', data.token);
      writeJson(SESSION_KEY, state.session);
      $('adminPassword').value = '';
      $('adminMessage').textContent = 'Signed in. Mobile update tools are available.';
      renderAdmin();
    } catch(e){ $('adminMessage').textContent = e.message; }
  }

  async function saveScore(){
    const id = $('scoreGameSelect').value;
    const score1 = $('score1Input').value;
    const score2 = $('score2Input').value;
    const status = $('gameStatusInput').value;
    if (score1 === '' || score2 === '') { $('adminMessage').textContent = 'Both scores are required.'; return; }
    const games = [...(state.content.gameSchedules || [])];
    const sorted = sortedGames();
    const selected = sorted.find((g, idx) => getGameId(g, idx) === id);
    const originalIndex = games.indexOf(selected);
    if (originalIndex < 0) { $('adminMessage').textContent = 'Selected game was not found.'; return; }
    games[originalIndex] = { ...games[originalIndex], score1: Number(score1), score2: Number(score2), status: status || 'final' };
    $('adminMessage').textContent = 'Saving score...';
    try { await saveContent({ ...state.content, gameSchedules: games }); $('adminMessage').textContent = 'Score saved to backend.'; }
    catch(e){ $('adminMessage').textContent = e.message; }
  }

  async function saveAnnouncement(){
    const title = $('announcementTitle').value.trim();
    const body = $('announcementBody').value.trim();
    if (!title || !body) { $('adminMessage').textContent = 'Announcement title and message are required.'; return; }
    const announcements = [...(state.content.announcements || []), { id:'mobile-' + Date.now(), title, body, date:new Date().toISOString() }];
    $('adminMessage').textContent = 'Publishing announcement...';
    try { await saveContent({ ...state.content, announcements }); $('announcementTitle').value=''; $('announcementBody').value=''; $('adminMessage').textContent = 'Announcement published.'; }
    catch(e){ $('adminMessage').textContent = e.message; }
  }

  function isIOS(){ return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream; }
  function isAndroid(){ return /Android/.test(navigator.userAgent); }
  function isSafari(){ return /^((?!chrome|android).)*safari/i.test(navigator.userAgent); }

  function setupTabs(){
    document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active-panel'));
      btn.classList.add('active');
      $(btn.dataset.target).classList.add('active-panel');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }));
  }

  function setupInstall(){
    const installBtn = $('installBtn');
    const installHelp = $('installHelp');
    const isAppInstalled = localStorage.getItem(INSTALL_STATE_KEY) === 'true';
    let installPromptDeferred = false;

    if (isAppInstalled) {
      installBtn.hidden = true;
      if (installHelp) installHelp.hidden = true;
      return;
    }

    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      state.deferredInstallPrompt = event;
      installPromptDeferred = true;
      installBtn.hidden = false;
      if (installHelp) installHelp.hidden = true;
    });

    window.addEventListener('appinstalled', () => {
      state.deferredInstallPrompt = null;
      localStorage.setItem(INSTALL_STATE_KEY, 'true');
      installBtn.hidden = true;
      if (installHelp) installHelp.hidden = true;
    });

    installBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (isIOS() && isSafari()) {
        if (installHelp) installHelp.hidden = false;
        return;
      }
      if (!state.deferredInstallPrompt) {
        return;
      }
      state.deferredInstallPrompt.prompt();
      const { outcome } = await state.deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem(INSTALL_STATE_KEY, 'true');
        installBtn.hidden = true;
      }
      state.deferredInstallPrompt = null;
    });

    if (!installPromptDeferred) {
      if (isIOS() && isSafari()) {
        installBtn.textContent = 'Add to Home Screen';
        installBtn.hidden = false;
        if (installHelp) installHelp.hidden = false;
      }
    }

    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupTabs(); setupInstall();
    const debouncedScheduleRender = debounce(renderSchedule, 150);
    const debouncedStandingsRender = debounce(renderStandings, 150);
    $('refreshBtn').addEventListener('click', loadContent);
    $('scheduleDivisionFilter').addEventListener('change', debouncedScheduleRender);
    $('standingsDivisionFilter').addEventListener('change', debouncedStandingsRender);
    $('loginForm').addEventListener('submit', login);
    $('scoreGameSelect').addEventListener('change', syncSelectedGameScore);
    $('saveScoreBtn').addEventListener('click', saveScore);
    $('saveAnnouncementBtn').addEventListener('click', saveAnnouncement);
    $('logoutBtn').addEventListener('click', () => { localStorage.removeItem('LAMSL_BACKEND_TOKEN'); localStorage.removeItem(SESSION_KEY); state.session = null; renderAdmin(); $('adminMessage').textContent = 'Signed out.'; });
    loadContent();
  });
})();
