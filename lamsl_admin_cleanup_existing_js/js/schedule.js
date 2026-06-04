
const USERS_KEY      = 'lamslUsersV1';
const SESSION_KEY    = 'lamslSessionV1';
const SCHEDULE_KEY   = 'lamslWeeklyScheduleV3';
const PRACTICE_KEY   = 'lamslPracticeScheduleV1';
const DIVISIONS_KEY  = 'lamslDivisionsV1';

const DEFAULT_TEAMS_BY_DIVISION = {
    A: ['Titans','La Tribu','Nasty Boyz','Toxic','White Sox','Legends'],
    B: ['Cubs','Primos','Dodgers','Diablos','Charros','Doom Squad'],
    C: ['Demons', 'Naranjeros', 'Caballeros', 'Salvajes', 'Coyotes', 'Bandits', 'Orioles', 'Goodfellas'],
    D: ['Strokes', 'Dirt Bags', 'Camaradas', 'Wild Hogz', 'Los Pericos', 'Xolos', 'Desvelados'],
    E: []
};
let teamsByDivision = {};
const ALL_PARKS = ['Carson - Stevenson Park','Bell Gardens - Ford Park', 'Carson - Dolphin Park', 'Carson - Calas Park', 'Carson - Veterans Park'];
const GAME_TIME_SLOTS = ['08:00am', '09:50am', '11:45am','01:45pm'];
const ALLOWED_GAME_DAYS = [0]; // Sundays only
const CHECKINS_KEY = 'lamslGameCheckinsV1';



function readJson(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        return fallback;
    }
}

function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function formatDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseDateKey(dateKey) {
    return new Date(`${dateKey}T00:00:00`);
}

function apiUrl(path) {
    if (window.apiUrl) return window.apiUrl(path);
    const backendBase = window.BACKEND_BASE || 'https://lamsl-backend.onrender.com';
    if (window.location.protocol === 'file:' && path.startsWith('/')) {
        return backendBase.replace(/\/$/, '') + path;
    }
    return backendBase.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path);
}

async function notifyScheduleUpdate(game, action) {
    const payload = {
        action: action || 'updated',
        game: game || {}
    };

    try {
        const headers = (window.apiHeaders || (() => ({})))({ 'Content-Type': 'application/json' });
        const response = await fetch(apiUrl('/notify-schedule-update'), {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            console.warn('Schedule notification failed', result.error || result);
        }
    } catch (error) {
        console.warn('Schedule notification error', error);
    }
}

function getWeekStart(date) {
    const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    copy.setDate(copy.getDate() - copy.getDay());
    copy.setHours(0, 0, 0, 0);
    return copy;
}

function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

function toReadableDate(date) {
    return date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateLong(dateKey) {
    const date = parseDateKey(dateKey);
    return date.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}

function getGameCheckins() {
    return readJson(CHECKINS_KEY, {});
}

function saveGameCheckins(checkins) {
    writeJson(CHECKINS_KEY, checkins);
}

function toggleGameCheckin(gameId) {
    const checkins = getGameCheckins();
    if (checkins[gameId]) {
        delete checkins[gameId];
    } else {
        checkins[gameId] = new Date().toISOString();
    }
    saveGameCheckins(checkins);
    return !!checkins[gameId];
}

function getTeamPageUrl(team, division, gameId) {
    return `team.html?team=${encodeURIComponent(team)}&division=${encodeURIComponent(division)}&gameId=${encodeURIComponent(gameId)}`;
}

function ensureDefaults() {
    const users = readJson(USERS_KEY, []);
    if (!users.some(user => user.username === 'admin')) {
        users.push({ username: 'admin', password: 'admin', role: 'admin' });
        writeJson(USERS_KEY, users);
    }

    const divisions = readJson(DIVISIONS_KEY, null);
    if (!divisions) {
        writeJson(DIVISIONS_KEY, DEFAULT_TEAMS_BY_DIVISION);
        teamsByDivision = JSON.parse(JSON.stringify(DEFAULT_TEAMS_BY_DIVISION));
    } else {
        teamsByDivision = divisions;
    }

    const existing = readJson(SCHEDULE_KEY, null);


    if (!Array.isArray(existing) || existing.length === 0) {
        const seed = [
            { id: 'game-1', date: '2026-04-26', time: '08:00am', park: 'Carson - Calas Park', division: 'All', team1: 'Titans', team2: 'Primos', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-2', date: '2026-04-26', time: '09:50am', park: 'Carson - Calas Park', division: 'All', team1: 'Dodgers', team2: 'Nasty Boyz', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-3', date: '2026-04-26', time: '11:45am', park: 'Carson - Calas Park', division: 'All', team1: 'Goodfellas', team2: 'Demons', score1: '', score2: '', status: 'scheduled' },
            
            { id: 'game-4', date: '2026-04-26', time: '08:00am', park: 'Carson - Stevenson Park', division: 'All', team1: 'Camaradas', team2: 'Desvelados', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-5', date: '2026-04-26', time: '09:50am', park: 'Carson - Stevenson Park', division: 'All', team1: 'Diablos', team2: 'Toxic', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-6', date: '2026-04-26', time: '11:45am', park: 'Carson - Stevenson Park', division: 'All', team1: 'Wild Hogz', team2: 'Strokes', score1: '', score2: '', status: 'scheduled' },
            
            { id: 'game-7', date: '2026-04-26', time: '08:00am', park: 'Carson - Dolphin Park', division: 'All', team1: 'Legends', team2: 'Charros', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-8', date: '2026-04-26', time: '09:50am', park: 'Carson - Dolphin Park', division: 'All', team1: 'Salvajes', team2: 'Coyotes', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-9', date: '2026-04-26', time: '11:45am', park: 'Carson - Dolphin Park', division: 'All', team1: 'Caballeros', team2: 'Orioles', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-10', date: '2026-04-26', time: '01:45pm', park: 'Carson - Dolphin Park', division: 'All', team1: 'Doom Squad', team2: 'La Tribu', score1: '', score2: '', status: 'scheduled' },
            
            { id: 'game-11', date: '2026-04-26', time: '08:00am', park: 'Carson - Veterans Park', division: 'All', team1: 'Bandits', team2: 'Naranjeros', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-12', date: '2026-04-26', time: '09:50am', park: 'Carson - Veterans Park', division: 'All', team1: 'White Sox', team2: 'Cubs', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-13', date: '2026-04-26', time: '11:45am', park: 'Carson - Veterans Park', division: 'All', team1: 'Dirt Bags', team2: 'Xolos', score1: '', score2: '', status: 'scheduled' },
        
            { id: 'game-14', date: '2026-05-03', time: '08:00am', park: 'Carson - Calas Park', division: 'All', team1: 'Demons', team2: 'Caballeros', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-15', date: '2026-05-03', time: '09:50am', park: 'Carson - Calas Park', division: 'All', team1: 'Dodgers', team2: 'Legends', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-16', date: '2026-05-03', time: '11:45am', park: 'Carson - Calas Park', division: 'All', team1: 'Nasty Boyz', team2: 'Doom Squad', score1: '', score2: '', status: 'scheduled' },
            
            { id: 'game-17', date: '2026-05-03', time: '08:00am', park: 'Carson - Stevenson Park', division: 'All', team1: 'Coyotes', team2: 'Naranjeros', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-18', date: '2026-05-03', time: '09:50am', park: 'Carson - Stevenson Park', division: 'All', team1: 'Camaradas', team2: 'Xolos', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-19', date: '2026-05-03', time: '11:45am', park: 'Carson - Stevenson Park', division: 'All', team1: 'Orioles', team2: 'Bandits', score1: '', score2: '', status: 'scheduled' },
            
            { id: 'game-20', date: '2026-05-03', time: '08:00am', park: 'Carson - Dolphin Park', division: 'All', team1: 'Strokes', team2: 'Los Pericos', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-21', date: '2026-05-03', time: '09:50am', park: 'Carson - Dolphin Park', division: 'All', team1: 'White Sox', team2: 'Primos', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-22', date: '2026-05-03', time: '11:45am', park: 'Carson - Dolphin Park', division: 'All', team1: 'Cubs', team2: 'Toxic', score1: '', score2: '', status: 'scheduled' },
            
            { id: 'game-23', date: '2026-05-03', time: '08:00am', park: 'Carson - Veterans Park', division: 'All', team1: 'Charros', team2: 'La Tribu', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-24', date: '2026-05-03', time: '09:50am', park: 'Carson - Veterans Park', division: 'All', team1: 'Goodfellas', team2: 'Salvajes', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-25', date: '2026-05-03', time: '11:45am', park: 'Carson - Veterans Park', division: 'All', team1: 'Desvelados', team2: 'Dirt Bags', score1: '', score2: '', status: 'scheduled' },
           
            { id: 'game-26', date: '2026-05-17', time: '08:00am', park: 'Carson - Calas Park', division: 'All', team1: 'Orioles', team2: 'Salvajes', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-27', date: '2026-05-17', time: '09:50am', park: 'Carson - Calas Park', division: 'All', team1: 'La Tribu', team2: 'Dodgers', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-28', date: '2026-05-17', time: '11:45am', park: 'Carson - Calas Park', division: 'All', team1: 'Xolos', team2: 'Wild Hogz', score1: '', score2: '', status: 'scheduled' },
            
            { id: 'game-29', date: '2026-05-17', time: '08:00am', park: 'Carson - Stevenson Park', division: 'All', team1: 'Diablos', team2: 'Legends', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-30', date: '2026-05-17', time: '09:50am', park: 'Carson - Stevenson Park', division: 'All', team1: 'Caballeros', team2: 'Bandits', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-31', date: '2026-05-17', time: '11:45am', park: 'Carson - Stevenson Park', division: 'All', team1: 'Nasty Boyz', team2: 'Cubs', score1: '', score2: '', status: 'scheduled' },
            
            { id: 'game-32', date: '2026-05-17', time: '08:00am', park: 'Carson - Dolphin Park', division: 'All', team1: 'White Sox', team2: 'Doom Squad', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-33', date: '2026-05-17', time: '09:50am', park: 'Carson - Dolphin Park', division: 'All', team1: 'Coyotes', team2: 'Demons', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-34', date: '2026-05-17', time: '11:45am', park: 'Carson - Dolphin Park', division: 'All', team1: 'Goodfellas', team2: 'Naranjeros', score1: '', score2: '', status: 'scheduled' },
            
            { id: 'game-35', date: '2026-05-17', time: '08:00am', park: 'Bell Gardens - Ford Park', division: 'All', team1: 'Titans', team2: 'Charros', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-36', date: '2026-05-17', time: '09:50am', park: 'Bell Gardens - Ford Park', division: 'All', team1: 'Camaradas', team2: 'Strokes', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-37', date: '2026-05-17', time: '11:45am', park: 'Bell Gardens - Ford Park', division: 'All', team1: 'Desvelados', team2: 'Los Pericos', score1: '', score2: '', status: 'scheduled' },

            { id: 'game-38', date: '2026-05-31', time: '08:00am', park: 'Carson - Calas Park', division: 'All', team1: 'Coyotes', team2: 'Caballeros', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-39', date: '2026-05-31', time: '09:50am', park: 'Carson - Calas Park', division: 'All', team1: 'Bandits', team2: 'Salvajes', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-40', date: '2026-05-31', time: '11:45am', park: 'Carson - Calas Park', division: 'All', team1: 'La Tribu', team2: 'Cubs', score1: '', score2: '', status: 'scheduled' },
            
            { id: 'game-41', date: '2026-05-31', time: '08:00am', park: 'Carson - Stevenson Park', division: 'All', team1: 'Dirt Bags', team2: 'Wild Hogz', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-42', date: '2026-05-31', time: '09:50am', park: 'Carson - Stevenson Park', division: 'All', team1: 'White Sox', team2: 'Diablos', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-43', date: '2026-05-31', time: '11:45am', park: 'Carson - Stevenson Park', division: 'All', team1: 'Orioles', team2: 'Goodfellas', score1: '', score2: '', status: 'scheduled'},
            
            { id: 'game-44', date: '2026-05-31', time: '08:00am', park: 'Carson - Dolphin Park', division: 'All', team1: 'Camaradas', team2: 'Los Pericos', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-45', date: '2026-05-31', time: '09:50am', park: 'Carson - Dolphin Park', division: 'All', team1: 'Doom Squad', team2: 'Titans', score1: '', score2: '', status: 'scheduled' },    
            { id: 'game-46', date: '2026-05-31', time: '11:45am', park: 'Carson - Dolphin Park', division: 'All', team1: 'Nasty Boyz', team2: 'Charros', score1: '', score2: '', status: 'scheduled' },
            
            { id: 'game-47', date: '2026-05-31', time: '08:00am', park: 'Bell Gardens - Ford Park', division: 'All', team1: 'Naranjeros', team2: 'Demons', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-48', date: '2026-05-31', time: '09:50am', park: 'Bell Gardens - Ford Park', division: 'All', team1: 'Strokes', team2: 'Desvelados', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-49', date: '2026-05-31', time: '11:45am', park: 'Bell Gardens - Ford Park', division: 'All', team1: 'Legends', team2: 'Primos', score1: '', score2: '', status: 'scheduled' },


            { id: 'game-50', date: '2026-06-07', time: '08:00am', park: 'Carson - Calas Park', division: 'All', team1: 'Demons', team2: 'Salvajes', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-51', date: '2026-06-07', time: '09:50am', park: 'Carson - Calas Park', division: 'All', team1: 'Goodfellas', team2: 'Orioles', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-52', date: '2026-06-07', time: '11:45am', park: 'Carson - Calas Park', division: 'All', team1: 'Xolos', team2: 'Desvelados', score1: '', score2: '', status: 'scheduled' },
            
            { id: 'game-53', date: '2026-06-07', time: '08:00am', park: 'Carson - Stevenson Park', division: 'All', team1: 'Caballeros', team2: 'Naranjeros', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-54', date: '2026-06-07', time: '09:50am', park: 'Carson - Stevenson Park', division: 'All', team1: 'Coyotes', team2: 'Bandits', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-55', date: '2026-06-07', time: '11:45am', park: 'Carson - Stevenson Park', division: 'All', team1: 'Nasty Boyz', team2: 'Primos', score1: '', score2: '', status: 'scheduled'},
            
            { id: 'game-56', date: '2026-06-07', time: '08:00am', park: 'Carson - Dolphin Park', division: 'All', team1: 'White Sox', team2: 'Charros', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-57', date: '2026-06-07', time: '09:50am', park: 'Carson - Dolphin Park', division: 'All', team1: 'Titans', team2: 'Dodgers', score1: '', score2: '', status: 'scheduled' },    
            { id: 'game-58', date: '2026-06-07', time: '11:45am', park: 'Carson - Dolphin Park', division: 'All', team1: 'Camaradas', team2: 'Wild Hogz', score1: '', score2: '', status: 'scheduled' },
            
            { id: 'game-59', date: '2026-06-07', time: '08:00am', park: 'Carson - Veterans Park', division: 'All', team1: 'Toxic', team2: 'Doom Squad', score1: '', score2: '', status: 'scheduled' },
            { id: 'game-60', date: '2026-06-07', time: '09:50am', park: 'Carson - Veterans Park', division: 'All', team1: 'Dirt Bags', team2: 'Los Pericos', score1: '', score2: '', status: 'scheduled' },
           
        ];
        writeJson(SCHEDULE_KEY, seed);
    }
}

function getDivisionCodes() {
    return Object.keys(teamsByDivision);
}

function isAdminLoggedIn() {
    const session = readJson(SESSION_KEY, null);
    return !!(session && session.role === 'admin');
}

function hasRole(...roles) {
    const session = readJson(SESSION_KEY, null);
    return !!(session && roles.includes(session.role));
}

function canManageScores() {
    return hasRole('admin', 'umpire');
}

function canEditSchedule() {
    return hasRole('admin');
}

function getFilteredGames(games) {
    if (activeDivisionFilter === 'ALL') {
        return games;
    }
    return games.filter(game => game.division === activeDivisionFilter);
}

let scheduleContent = null;

function getDefaultBackendContent() {
    return {
        homepageMessage: '',
        zelle: {},
        gameSchedules: [],
        gameScores: [],
        practiceSchedules: [],
        slideshow: []
    };
}

function getSchedule() {
    const localGames = readJson(SCHEDULE_KEY, []);
    let games = localGames;

    // Prefer backend schedules only when the backend actually has schedule records.
    // This prevents an empty /api/content gameSchedules array from blanking the website.
    if (
        scheduleContent &&
        Array.isArray(scheduleContent.gameSchedules) &&
        scheduleContent.gameSchedules.length > 0
    ) {
        games = scheduleContent.gameSchedules;
    }

    return [...games].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}

function getPracticeSchedule() {
    const localGames = readJson(PRACTICE_KEY, []);
    let games = localGames;

    if (
        scheduleContent &&
        Array.isArray(scheduleContent.practiceSchedules) &&
        scheduleContent.practiceSchedules.length > 0
    ) {
        games = scheduleContent.practiceSchedules;
    }

    return [...games].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}

function writeBackendCache() {
    if (!scheduleContent) return;
    writeJson(SCHEDULE_KEY, scheduleContent.gameSchedules);
    writeJson(PRACTICE_KEY, scheduleContent.practiceSchedules);
}

async function persistBackendContent() {
    if (!scheduleContent) return;

    try {
        const response = await fetch(apiUrl('/api/update'), {
            method: 'POST',
            headers: (window.apiHeaders || (() => ({})))({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(scheduleContent)
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            console.warn('Backend schedule persist failed', result.error || result);
        }
    } catch (error) {
        console.warn('Backend schedule persist error', error);
    }
}

function saveSchedule(games) {
    if (scheduleContent) {
        scheduleContent.gameSchedules = games;
        scheduleContent.gameScores = games.filter(game => game.score1 !== '' && game.score2 !== '');
        writeBackendCache();
        persistBackendContent();
    } else {
        writeJson(SCHEDULE_KEY, games);
    }
}

function savePracticeSchedule(games) {
    if (scheduleContent) {
        scheduleContent.practiceSchedules = games;
        writeBackendCache();
        persistBackendContent();
    } else {
        writeJson(PRACTICE_KEY, games);
    }
}

function isAllowedGameDay(date) {
    return ALLOWED_GAME_DAYS.includes(date.getDay());
}

function getNextAllowedGameDate(date) {
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    next.setHours(0, 0, 0, 0);
    while (!isAllowedGameDay(next)) {
        next.setDate(next.getDate() + 1);
    }
    return next;
}

function validateSchedulingConstraints({ date, time, park, team1, team2, existingGames, ignoreId }) {
    const day = parseDateKey(date).getDay();
    if (!ALLOWED_GAME_DAYS.includes(day)) {
        return 'Games can only be scheduled on Sundays.';
    }

    if (!GAME_TIME_SLOTS.includes(time)) {
        return `Invalid time slot. Allowed slots: ${GAME_TIME_SLOTS.join(', ')}.`;
    }

    const comparable = existingGames.filter(game => game.id !== ignoreId);
    const duplicateSlot = comparable.some(game =>
        game.date === date && game.park === park && game.time === time
    );
    if (duplicateSlot) {
        return 'This field/time slot is already occupied. Choose another slot.';
    }

    // Team can play only one game per time slot.
    const teamSlotConflict = comparable.some(game =>
        game.date === date &&
        game.time === time &&
        ([game.team1, game.team2].includes(team1) || [game.team1, game.team2].includes(team2))
    );
    if (teamSlotConflict) {
        return 'A selected team is already scheduled for this date/time slot.';
    }

    // Team can only be assigned to one park per day.
    const teamParkConflict = comparable.some(game =>
        game.date === date &&
        game.park !== park &&
        ([game.team1, game.team2].includes(team1) || [game.team1, game.team2].includes(team2))
    );
    if (teamParkConflict) {
        return 'A selected team is already assigned to a different park on this day.';
    }

    const sameParkDayCount = comparable.filter(game =>
        game.date === date && game.park === park
    ).length;
    if (sameParkDayCount >= GAME_TIME_SLOTS.length) {
        return `This field already has ${GAME_TIME_SLOTS.length} games for the day.`;
    }

    return '';
}

async function loadBackendSchedule() {
    try {
        const response = await fetch(apiUrl('/api/content'));
        if (!response.ok) throw new Error(`Backend content fetch failed ${response.status}`);
        const data = await response.json();
        const localSchedules = readJson(SCHEDULE_KEY, []);
        const localPracticeSchedules = readJson(PRACTICE_KEY, []);

        scheduleContent = Object.assign(getDefaultBackendContent(), data, {
            gameSchedules: Array.isArray(data.gameSchedules) && data.gameSchedules.length > 0
                ? data.gameSchedules
                : localSchedules,
            gameScores: Array.isArray(data.gameScores) ? data.gameScores : [],
            practiceSchedules: Array.isArray(data.practiceSchedules) && data.practiceSchedules.length > 0
                ? data.practiceSchedules
                : localPracticeSchedules
        });
        writeBackendCache();
    } catch (error) {
        console.warn('Could not load schedule content from backend:', error);
        scheduleContent = null;
    }
}


