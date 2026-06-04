
/* LAMSL shared admin data store.
   Keeps public pages and the administrator dashboard on the same localStorage keys.
   Also mirrors data to the Render backend when backend endpoints are available. */
(function (window) {
    const keys = {
        users: 'lamslUsersV1',
        session: 'lamslSessionV1',
        announcements: 'lamslAnnouncementsV1',
        archivedAnnouncements: 'lamslArchivedAnnouncementsV1',
        efAnnouncements: 'lamslEFAnnouncementsV1',
        season: 'lamslSeasonV1',
        divisions: 'lamslDivisionsV1',
        schedule: 'lamslWeeklyScheduleV3',
        practice: 'lamslPracticeScheduleV1',
        rosters: 'lamslTeamRostersV1',
        teamPlayers: 'lamslTeamPlayersV1',
        assignments: 'lamslTeamManagerAssignmentsV1',
        slides: 'lamslSlideshowImagesV1',
        siteContent: 'lamslSiteContentV1',
        subscribers: 'lamslEmailSubscribersV1',
        checkins: 'lamslGameCheckinsV1',
        teamCheckins: 'lamslTeamGameCheckinsV1'
    };

    const DEFAULT_TEAMS_BY_DIVISION = {
        A: ['Titans', 'Doom Squad', 'Legends', 'Nasty Boyz', 'Black Sox', 'White Sox', 'Dodgers'],
        B: ['Charros', 'Toxic', 'Primos', 'Demons', 'Cubs', 'Borrachos'],
        C: ['Diablos', 'Brewers', 'Coyotes', 'Goodfellas', 'Bandits', 'Salvajes', 'Balls Out', 'Orioles'],
        D: ['Viejones', 'No Chance', 'Los Pericos', 'Wild Hogz', 'Strokes', 'Dawgz', 'Xolos', 'Desvelados'],
        E: []
    };

    const backendBase = window.BACKEND_BASE || 'https://lamsl-backend.onrender.com';

    function apiUrl(path) {
        if (!path) return backendBase;
        if (/^https?:\/\//i.test(path)) return path;
        return backendBase.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path);
    }

    function headers(extra) {
        if (typeof window.apiHeaders === 'function') return window.apiHeaders(extra || {});
        const h = Object.assign({}, extra || {});
        if (window.ADMIN_API_KEY) h['x-admin-key'] = window.ADMIN_API_KEY;
        return h;
    }

    function read(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function write(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
        return value;
    }

    function normalizeGame(game, index) {
        const score1 = game.score1 ?? game.scoreTeam1 ?? game.scoreA;
        const score2 = game.score2 ?? game.scoreTeam2 ?? game.scoreB;
        return {
            id: String(game.id || `game-${game.date || 'date'}-${game.time || 'time'}-${game.team1 || game.team || game.teamA || 'team1'}-${game.team2 || game.opponent || game.teamB || 'team2'}-${index}`).replace(/\s+/g, '-'),
            date: game.date || '',
            time: game.time || '',
            location: game.location || game.park || game.field || '',
            park: game.park || game.location || game.field || '',
            division: game.division || game.div || '',
            team1: game.team1 || game.team || game.teamA || '',
            team2: game.team2 || game.opponent || game.teamB || '',
            status: game.status || 'scheduled',
            score1,
            score2,
            scoreTeam1: score1,
            scoreTeam2: score2
        };
    }

    function normalizeSlide(slide, index) {
        const imageUrl = slide.imageUrl || slide.url || slide.src || slide.path || '';
        return {
            id: String(slide.id || `slide-${index}-${Date.now()}`),
            imageUrl,
            url: imageUrl,
            caption: slide.caption || slide.title || 'LAMSL Photo'
        };
    }

    function mergeBackendContent(data) {
        if (!data || typeof data !== 'object') return;

        if (Array.isArray(data.announcements)) write(keys.announcements, data.announcements);
        if (Array.isArray(data.archivedAnnouncements)) write(keys.archivedAnnouncements, data.archivedAnnouncements);
        if (Array.isArray(data.gameSchedules)) write(keys.schedule, data.gameSchedules.map(normalizeGame));
        if (Array.isArray(data.practiceSchedules)) write(keys.practice, data.practiceSchedules);
        if (Array.isArray(data.gameScores)) {
            const games = read(keys.schedule, []);
            data.gameScores.forEach(score => {
                const game = games.find(g => g.id === score.id || (g.date === score.date && ((g.team1 === score.teamA && g.team2 === score.teamB) || (g.team1 === score.team1 && g.team2 === score.team2))));
                if (game) {
                    game.score1 = score.scoreA ?? score.score1 ?? score.scoreTeam1;
                    game.score2 = score.scoreB ?? score.score2 ?? score.scoreTeam2;
                    game.scoreTeam1 = game.score1;
                    game.scoreTeam2 = game.score2;
                }
            });
            write(keys.schedule, games);
        }
        if (Array.isArray(data.slideshow)) write(keys.slides, data.slideshow.map(normalizeSlide));
        if (data.divisions && typeof data.divisions === 'object') write(keys.divisions, data.divisions);
        if (data.teamPlayers && typeof data.teamPlayers === 'object') write(keys.teamPlayers, data.teamPlayers);
        if (data.teamManagerAssignments && typeof data.teamManagerAssignments === 'object') write(keys.assignments, data.teamManagerAssignments);
        if (data.season && typeof data.season === 'object') write(keys.season, data.season);
        if (Array.isArray(data.emailSubscribers)) write(keys.subscribers, data.emailSubscribers);

        const site = read(keys.siteContent, {});
        if (typeof data.homepageMessage === 'string') site.homepageMessage = data.homepageMessage;
        if (data.zelle) site.paymentInfo = typeof data.zelle === 'string' ? data.zelle : JSON.stringify(data.zelle, null, 2);
        if (typeof data.paymentInfo === 'string') site.paymentInfo = data.paymentInfo;
        if (typeof data.instagramInfo === 'string') site.instagramInfo = data.instagramInfo;
        write(keys.siteContent, site);
    }

    async function loadBackendContent() {
        try {
            const res = await fetch(apiUrl('/api/content'), { headers: headers() });
            if (!res.ok) throw new Error(`Backend content fetch failed: ${res.status}`);
            const data = await res.json();
            mergeBackendContent(data);
            return data;
        } catch (error) {
            console.warn('LAMSL backend content not available:', error);
            return null;
        }
    }

    async function post(path, payload) {
        const res = await fetch(apiUrl(path), {
            method: 'POST',
            headers: headers({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        try { return await res.json(); } catch (e) { return null; }
    }

    function buildContentPayload() {
        const games = read(keys.schedule, []);
        const slides = read(keys.slides, []);
        const site = read(keys.siteContent, {});
        return {
            homepageMessage: site.homepageMessage || '',
            paymentInfo: site.paymentInfo || '',
            instagramInfo: site.instagramInfo || '',
            zelle: site.paymentInfo || '',
            announcements: read(keys.announcements, []),
            archivedAnnouncements: read(keys.archivedAnnouncements, []),
            gameSchedules: games,
            gameScores: games.filter(g => g.score1 !== undefined || g.score2 !== undefined || g.scoreTeam1 !== undefined || g.scoreTeam2 !== undefined).map(g => ({
                id: g.id,
                date: g.date,
                teamA: g.team1,
                teamB: g.team2,
                scoreA: g.score1 ?? g.scoreTeam1 ?? 0,
                scoreB: g.score2 ?? g.scoreTeam2 ?? 0
            })),
            practiceSchedules: read(keys.practice, []),
            slideshow: slides,
            divisions: read(keys.divisions, DEFAULT_TEAMS_BY_DIVISION),
            teamPlayers: read(keys.teamPlayers, {}),
            teamManagerAssignments: read(keys.assignments, {}),
            season: read(keys.season, null),
            emailSubscribers: read(keys.subscribers, [])
        };
    }

    function ensureDefaults() {
        const users = read(keys.users, []);
        if (!users.some(u => u.username === 'admin')) {
            users.push({ username: 'admin', password: 'admin', role: 'admin' });
            write(keys.users, users);
        }
        if (!read(keys.divisions, null)) write(keys.divisions, DEFAULT_TEAMS_BY_DIVISION);
        if (!read(keys.announcements, null)) {
            write(keys.announcements, [
                { id: 'ann-1', title: 'TO ALL REGULAR SEASON MANAGERS', date: '2026-03-20', message: 'MANDATORY MANAGERS MEETING FRIDAY MARCH 20th @ 7:30 P.M. 7527 Otis Ave. Cudahy, 90201' },
                { id: 'ann-2', title: '2026 50th Anniversary Regular Season', date: '2026-03-15', message: 'Early Registration: $600 due no later than 2/28/26. Regular Registration: $650 due 3/1/26 through 3/15/26.' }
            ]);
        }
        if (!read(keys.archivedAnnouncements, null)) write(keys.archivedAnnouncements, []);
        if (!read(keys.slides, null)) write(keys.slides, []);
        if (!read(keys.siteContent, null)) write(keys.siteContent, {});
        if (!read(keys.subscribers, null)) write(keys.subscribers, []);
    }

    function isAdminLoggedIn() {
        const s = read(keys.session, null);
        return !!(s && s.role === 'admin');
    }

    function getDivisionMap() { return read(keys.divisions, DEFAULT_TEAMS_BY_DIVISION); }
    function saveDivisionMap(map) { return write(keys.divisions, map); }
    function getDivisionCodes() { return Object.keys(getDivisionMap()).sort(); }
    function getSchedule() { return read(keys.schedule, []).map(normalizeGame); }
    function saveSchedule(games) { return write(keys.schedule, (games || []).map(normalizeGame)); }
    function getPracticeSchedule() { return read(keys.practice, []); }
    function savePracticeSchedule(games) { return write(keys.practice, games || []); }
    function getGameCheckins() { return read(keys.checkins, {}); }
    function saveGameCheckins(checkins) { return write(keys.checkins, checkins || {}); }
    function getFilteredGames(games) { return (games || []).map(normalizeGame); }

    function formatDateKey(date) {
        const d = new Date(date);
        d.setHours(0,0,0,0);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    function parseDateKey(key) {
        return new Date(`${key}T00:00:00`);
    }

    function addDays(date, days) {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    }

    function getWeekStart(date) {
        const d = new Date(date);
        d.setHours(0,0,0,0);
        const day = d.getDay();
        d.setDate(d.getDate() - day);
        return d;
    }

    function toReadableDate(date) {
        return new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
    }

    function formatDateLong(dateKey) {
        if (!dateKey) return '';
        return parseDateKey(dateKey).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }

    function getNextAllowedGameDate(date) {
        return new Date(date);
    }

    function validateSchedulingConstraints() {
        return { valid: true };
    }

    function canEditSchedule() { return isAdminLoggedIn(); }
    function canManageScores() { return isAdminLoggedIn(); }

    function notifyScheduleUpdate() {
        window.dispatchEvent(new CustomEvent('lamsl:schedule-updated'));
        post('/api/update', buildContentPayload()).catch(() => {});
    }

    function getTeamPageUrl(team, division, gameId) {
        return `team.html?team=${encodeURIComponent(team || '')}&division=${encodeURIComponent(division || '')}&gameId=${encodeURIComponent(gameId || '')}`;
    }

    function toggleGameCheckin(gameId, teamName) {
        const checkins = getGameCheckins();
        checkins[gameId] = checkins[gameId] || {};
        checkins[gameId][teamName] = !checkins[gameId][teamName];
        saveGameCheckins(checkins);
        return checkins[gameId][teamName];
    }

    window.LAMSLStore = {
        keys,
        DEFAULT_TEAMS_BY_DIVISION,
        apiUrl,
        headers,
        read,
        write,
        ensureDefaults,
        loadBackendContent,
        mergeBackendContent,
        buildContentPayload,
        post
    };

    Object.assign(window, {
        teamsByDivision: getDivisionMap(),
        readJson: read,
        writeJson: write,
        ensureDefaults,
        isAdminLoggedIn,
        getDivisionMap,
        saveDivisionMap,
        getDivisionCodes,
        getSchedule,
        saveSchedule,
        getPracticeSchedule,
        savePracticeSchedule,
        getGameCheckins,
        saveGameCheckins,
        getFilteredGames,
        formatDateKey,
        parseDateKey,
        addDays,
        getWeekStart,
        toReadableDate,
        formatDateLong,
        getNextAllowedGameDate,
        validateSchedulingConstraints,
        canEditSchedule,
        canManageScores,
        notifyScheduleUpdate,
        getTeamPageUrl,
        toggleGameCheckin,
        loadBackendSchedule: loadBackendContent
    });

    ensureDefaults();
})(window);
