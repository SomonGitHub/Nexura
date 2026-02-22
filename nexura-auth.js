console.log("🚀 Nexura Auth Loading (v1.4)...");

// SaaS Mode: Hardcoded Supabase Credentials
const SUPABASE_URL = "https://wldzsmggsbzjlcptyijg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZHpzbWdnc2J6amxjcHR5aWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODQwMTksImV4cCI6MjA4NzE2MDAxOX0.TxKehKCvbE4UyaqTb8-Q45eGKm1CleXijgzao0p5Nlw";

var nexuraSupabase = null;
let currentSession = null;
let isLoginMode = true;
let isInitialSyncDone = false;


const getAuthModal = () => document.getElementById('authModal');
const getAuthForm = () => document.getElementById('authForm');
const getAuthTitle = () => document.getElementById('authTitle');
const getAuthToggleText = () => document.getElementById('authToggleText');
const getAuthToggleBtn = () => document.getElementById('authToggleBtn');
const getAuthSetupUI = () => document.getElementById('authSetupUI');
const getAuthEmail = () => document.getElementById('authEmail');
const getAuthPassword = () => document.getElementById('authPassword');
const getSqlInitSection = () => document.getElementById('sqlInitSection');
const getSupabaseUrlInput = () => document.getElementById('supabaseUrl');
const getSupabaseKeyInput = () => document.getElementById('supabaseKey');

window.userTier = 'free';

function applyTheme(themeName) {
    const theme = themeName || localStorage.getItem('sv_theme') || 'default';
    document.body.className = '';
    if (theme !== 'default') {
        document.body.classList.add(`theme-${theme}`);
    }
    localStorage.setItem('sv_theme', theme);
}
window.applyTheme = applyTheme;

function initSupabase() {
    if (nexuraSupabase) return;

    if (!window.supabase) {
        console.error("Supabase library not found! Check your script tags.");
        return;
    }

    console.log("Initializing Nexura SaaS Auth...");
    nexuraSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    checkSession();
}

async function checkDatabaseHealth() {
    if (!nexuraSupabase) return;
    const sqlInit = getSqlInitSection();


    const { error } = await nexuraSupabase.from('profiles').select('id').limit(1);

    if (error && error.code === 'PGRST116') {
        // Table exists but is empty, or single row expected but none found
        // That's fine, we don't need to show SQL init
        if (sqlInit) sqlInit.style.display = 'none';
        return;
    }

    if (error && (error.message.includes('relation "public.profiles" does not exist') || error.code === '42P01')) {
        console.warn("Database schema not found. Prompting initialization.");
        if (sqlInit) sqlInit.style.display = 'block';
    } else {
        if (sqlInit) sqlInit.style.display = 'none';
    }
}

async function checkSession() {
    // Robust detection of login page (Cloudflare may serve /login or /login.html)
    const isLoginPage = window.location.pathname.includes('login') || !!document.getElementById('authFormSection');

    if (!nexuraSupabase) {
        if (!isLoginPage) {
            window.location.href = 'login.html';
        }
        return;
    }
    const { data: { session }, error } = await nexuraSupabase.auth.getSession();
    currentSession = session;

    if (currentSession) {
        await fetchUserTier();

        const pulled = await syncFromCloud(); // Pull existing data first
        isInitialSyncDone = true; // Mark as ready to push

        if (pulled === false) {
            console.log("Migration: Local data detected and cloud empty. Pushing...");
            await syncToCloud();
        }

        // Onboarding Check: If no HA URL configured and on Dashboard, show tutorial
        const haUrl = localStorage.getItem('haUrl');
        const isDashboard = !isLoginPage &&
            !window.location.pathname.includes('settings') &&
            !window.location.pathname.includes('categories') &&
            !window.location.pathname.includes('room.html');

        if (!haUrl && isDashboard) {
            if (window.startTutorial) {
                window.startTutorial();
            } else {
                window.addEventListener('tutorialReady', () => window.startTutorial());
            }
        }

        if (isLoginPage) {
            window.location.href = 'index.html';
        }
    } else {
        if (!isLoginPage) {
            window.location.href = 'login.html';
        }
    }
    updateUIForAuth();
}

async function fetchUserTier() {
    try {
        const data = await callNexuraApi('GET');
        if (data && data.profile && data.profile.tier) {
            window.userTier = data.profile.tier;
        } else {
            window.userTier = 'free';
        }
    } catch (err) {
        console.error('Error fetching tier:', err);
    }
}

function updateUIForAuth() {
    const navAccount = document.getElementById('navAccount');
    if (navAccount) {
        let newHtml = '';
        let newOnClick = openAuthModal;

        if (currentSession) {
            const tierBadge = `<span style="font-size: 0.6rem; padding: 2px 6px; border-radius: 4px; background: ${userTier === 'pro' ? 'var(--accent-color)' : '#444'}; color: white; margin-left: 8px; text-transform: uppercase; font-weight: 800;">${userTier}</span>`;
            newHtml = `<i data-lucide="user-check" class="nav-icon"></i><div style="display: flex; flex-direction: column;"><span class="nav-text" style="font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; max-width: 120px; line-height: 1;">${currentSession.user.email}</span>${tierBadge}</div>`;
            newOnClick = () => {
                if (confirm('Se déconnecter ?')) logout();
            };
        } else {
            newHtml = `<i data-lucide="user" class="nav-icon"></i><span class="nav-text">Mon Compte</span>`;
            newOnClick = openAuthModal;
        }

        if (navAccount.innerHTML !== newHtml) {
            navAccount.innerHTML = newHtml;
            navAccount.onclick = newOnClick;
            if (window.UI && UI.refreshIcons) UI.refreshIcons(navAccount);
            else if (window.lucide) lucide.createIcons();
        }
    }
}


function isFeatureAllowed(feature, currentCount = 0) {
    // SaaS Choice: No hard blocking for now, focus on donation system
    return true;
}
window.isFeatureAllowed = isFeatureAllowed;



function openAuthModal() {
    const modal = getAuthModal();
    if (modal) modal.style.display = 'flex';
    initSupabase();
}
window.openAuthModal = openAuthModal;

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = getAuthTitle();
    const toggleText = getAuthToggleText();
    const toggleBtn = getAuthToggleBtn();
    const form = getAuthForm();

    if (title) title.innerText = isLoginMode ? 'Connexion' : 'Inscription';
    if (toggleText) toggleText.innerText = isLoginMode ? 'Pas encore de compte ?' : 'Déjà un compte ?';
    if (toggleBtn) toggleBtn.innerText = isLoginMode ? "S'inscrire" : 'Se connecter';
    if (form) {
        const btn = form.querySelector('button');
        if (btn) btn.innerText = isLoginMode ? 'Se connecter' : "S'inscrire";
    }
}
window.toggleAuthMode = toggleAuthMode;

function closeAuthModal() {
    const modal = getAuthModal();
    if (modal) modal.style.display = 'none';
}
window.closeAuthModal = closeAuthModal;


async function logout() {
    if (nexuraSupabase) {
        await nexuraSupabase.auth.signOut();
    }


    const keysToClear = [
        'domotique_entities',
        'domotique_rooms',
        'dashboard_cards',
        'haUrl',
        'haToken',
        'haEntityEnergy',
        'sv_theme'
    ];

    keysToClear.forEach(key => localStorage.removeItem(key));

    currentSession = null;
    updateUIForAuth();
    window.location.href = 'login.html';
}


async function callNexuraApi(method, body = null) {
    if (!currentSession) return null;
    const url = `/api/sync?userId=${currentSession.user.id}`;
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify({ userId: currentSession.user.id, ...body });

    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return await response.json();
}

async function syncToCloud() {
    if (!currentSession || !isInitialSyncDone) return;

    try {
        const rooms = JSON.parse(localStorage.getItem('domotique_rooms')) || [];
        if (rooms.length > 0) {
            await callNexuraApi('POST', { type: 'rooms', data: rooms });
        }

        const entities = JSON.parse(localStorage.getItem('domotique_entities')) || [];
        if (entities.length > 0) {
            await callNexuraApi('POST', { type: 'entities', data: entities });
        }

        const dashboardCards = JSON.parse(localStorage.getItem('dashboard_cards')) || [];
        const haUrl = localStorage.getItem('haUrl');
        const haToken = localStorage.getItem('haToken');
        const haEnergy = localStorage.getItem('haEntityEnergy');

        const profileData = {
            dashboard_config: dashboardCards,
            tier: window.userTier,
            theme: localStorage.getItem('sv_theme') || 'default',
            ha_url: haUrl || null,
            ha_entity_energy: haEnergy || null
        };

        if (haToken) {
            profileData.ha_token_enc = CryptoJS.AES.encrypt(haToken, currentSession.user.id).toString();
        }

        await callNexuraApi('POST', { type: 'profile', data: profileData });

        console.log('✅ Synchronisation Cloud via Edge complète !');
        window.dispatchEvent(new CustomEvent('dataSynced'));
    } catch (err) {
        console.error('Erreur lors de la synchronisation via Edge:', err);
    }
}
window.syncToCloud = syncToCloud;

async function syncFromCloud() {
    if (!currentSession) return;

    try {
        const data = await callNexuraApi('GET');
        if (!data) return;

        const { profile, rooms, entities } = data;

        // Protection: If cloud is empty but local has data, don't overwrite!
        const cloudIsEmpty = (!profile || !profile.id) && (!rooms || rooms.length === 0) && (!entities || entities.length === 0);
        const localRooms = localStorage.getItem('domotique_rooms');
        const localEntities = localStorage.getItem('domotique_entities');
        const localHasData = (localRooms && localRooms !== '[]') || (localEntities && localEntities !== '[]');

        if (cloudIsEmpty && localHasData) {
            console.warn('Migration mode: Cloud empty, keeping local data.');
            return false;
        }

        if (profile) {
            if (profile.tier) window.userTier = profile.tier;
            if (profile.theme) applyTheme(profile.theme);
            if (profile.dashboard_config) {
                const config = typeof profile.dashboard_config === 'string' ? JSON.parse(profile.dashboard_config) : profile.dashboard_config;
                localStorage.setItem('dashboard_cards', JSON.stringify(config));
            }
            if (profile.ha_url) localStorage.setItem('haUrl', profile.ha_url);
            if (profile.ha_entity_energy) localStorage.setItem('haEntityEnergy', profile.ha_entity_energy);
            if (profile.ha_token_enc) {
                try {
                    const bytes = CryptoJS.AES.decrypt(profile.ha_token_enc, currentSession.user.id);
                    const originalToken = bytes.toString(CryptoJS.enc.Utf8);
                    if (originalToken) localStorage.setItem('haToken', originalToken);
                } catch (e) { console.error("Decryption failed", e); }
            }
        }

        if (rooms) localStorage.setItem('domotique_rooms', JSON.stringify(rooms));
        if (entities) {
            const mappedEntities = entities.map(e => ({
                haId: e.haid,
                name: e.name,
                type: e.type,
                variant: e.variant || null,
                roomId: e.roomid
            }));
            localStorage.setItem('domotique_entities', JSON.stringify(mappedEntities));
        }

        console.log('✅ Récupération Cloud via Edge complète !');
        window.dispatchEvent(new CustomEvent('dataSynced'));
        return true;
    } catch (err) {
        console.error('Erreur lors de la récupération via Edge:', err);
        return null;
    }
}
window.syncFromCloud = syncFromCloud;


document.addEventListener('DOMContentLoaded', () => {

    initSupabase();

    const form = getAuthForm();
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!nexuraSupabase) return;

            const emailInput = getAuthEmail();
            const passwordInput = getAuthPassword();
            const email = emailInput ? emailInput.value : '';
            const password = passwordInput ? passwordInput.value : '';

            try {
                let result;
                if (isLoginMode) {
                    result = await nexuraSupabase.auth.signInWithPassword({ email, password });
                } else {
                    result = await nexuraSupabase.auth.signUp({ email, password });
                    if (!result.error) alert('Vérifiez votre email pour confirmer l\'inscription !');
                }

                if (result.error) throw result.error;

                if (result.data.session) {
                    currentSession = result.data.session;
                    closeAuthModal();
                    await checkSession();
                }
            } catch (err) {
                alert(err.message);
            }
        });
    }

    applyTheme();
});
