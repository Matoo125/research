const API_URL = window.location.origin;

// DOM Elements
const authView = document.getElementById('auth-view');
const appView = document.getElementById('app-view');
const authForm = document.getElementById('auth-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const authError = document.getElementById('auth-error');
const userDisplay = document.getElementById('user-display');
const logoutBtn = document.getElementById('logout-btn');
const addForm = document.getElementById('add-form');
const urlInput = document.getElementById('url');
const titleInput = document.getElementById('title');
const tagsInput = document.getElementById('tags');
const bookmarksList = document.getElementById('bookmarks-list');
const tagFilterBar = document.getElementById('tag-filter-bar');

// State
let token = localStorage.getItem('nexus_token');
let currentUser = localStorage.getItem('nexus_user');
let activeTagFilter = null;

// Init
function init() {
    if (token) {
        showApp();
        activeTagFilter = null;
        fetchBookmarks();
        fetchTags();
    } else {
        showAuth();
    }
}

// View Management
function showAuth() {
    appView.classList.remove('active');
    appView.classList.add('hidden');
    authView.classList.remove('hidden');
    // slight delay for animation
    setTimeout(() => authView.classList.add('active'), 50);
}

function showApp() {
    authView.classList.remove('active');
    authView.classList.add('hidden');
    appView.classList.remove('hidden');
    userDisplay.textContent = currentUser;
    setTimeout(() => appView.classList.add('active'), 50);
}

function showError(msg) {
    authError.textContent = `[ERROR]: ${msg}`;
    authError.classList.remove('hidden');
}

// API Helpers
async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const res = await fetch(`${API_URL}${endpoint}`, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
            handleLogout();
            throw new Error('Session expired');
        }
        throw new Error(data.error || 'Unknown error occurred');
    }
    return data;
}

// Auth Actions
loginBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if(!usernameInput.value || !passwordInput.value) return showError('Credentials required');
    
    try {
        const data = await apiCall('/login', 'POST', {
            username: usernameInput.value,
            password: passwordInput.value
        });
        token = data.token;
        currentUser = usernameInput.value;
        localStorage.setItem('nexus_token', token);
        localStorage.setItem('nexus_user', currentUser);
        authError.classList.add('hidden');
        usernameInput.value = '';
        passwordInput.value = '';
        init();
    } catch (err) {
        showError(err.message);
    }
});

registerBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if(!usernameInput.value || !passwordInput.value) return showError('Credentials required');

    try {
        await apiCall('/register', 'POST', {
            username: usernameInput.value,
            password: passwordInput.value
        });
        // Auto login after register
        loginBtn.click();
    } catch (err) {
        showError(err.message);
    }
});

function handleLogout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
    init();
}

logoutBtn.addEventListener('click', handleLogout);

// Bookmark Actions
async function fetchBookmarks() {
    try {
        const query = activeTagFilter ? `?tag=${encodeURIComponent(activeTagFilter)}` : '';
        const bookmarks = await apiCall(`/bookmarks${query}`);
        renderBookmarks(bookmarks);
    } catch (err) {
        console.error(err);
    }
}

async function fetchTags() {
    try {
        const tags = await apiCall('/tags');
        renderTagFilterBar(tags);
    } catch (err) {
        console.error(err);
    }
}

function setTagFilter(name) {
    activeTagFilter = activeTagFilter === name ? null : name;
    fetchBookmarks();
    fetchTags();
}

addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = urlInput.value;
    const title = titleInput.value;
    const tags = tagsInput.value.split(',').map(t => t.trim()).filter(Boolean);

    try {
        await apiCall('/bookmarks', 'POST', { url, title, tags });
        urlInput.value = '';
        titleInput.value = '';
        tagsInput.value = '';
        fetchBookmarks();
        fetchTags();
    } catch (err) {
        alert(err.message);
    }
});

async function deleteBookmark(id) {
    try {
        await apiCall(`/bookmarks/${id}`, 'DELETE');
        fetchBookmarks();
        fetchTags();
    } catch (err) {
        alert(err.message);
    }
}

function renderTagFilterBar(tags) {
    tagFilterBar.innerHTML = '';
    if (tags.length === 0) return;

    tags.forEach(t => {
        const chip = document.createElement('button');
        chip.className = 'tag-chip' + (activeTagFilter === t.name ? ' active' : '');
        chip.textContent = `[${t.name} (${t.count})]`;
        chip.title = activeTagFilter === t.name ? 'Click to clear filter' : `Filter by "${t.name}"`;
        chip.onclick = () => setTagFilter(t.name);
        tagFilterBar.appendChild(chip);
    });
}

function renderBookmarks(bookmarks) {
    bookmarksList.innerHTML = '';

    if (bookmarks.length === 0) {
        bookmarksList.innerHTML = '<div>Empty</div>';
        return;
    }

    // Sort by id descending
    bookmarks.sort((a, b) => b.id - a.id).forEach((bm) => {
        const item = document.createElement('div');
        item.className = 'bookmark-item';

        const info = document.createElement('div');
        info.className = 'bm-info';
        info.appendChild(document.createTextNode(`[${bm.id}] `));

        const link = document.createElement('a');
        link.href = bm.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'bm-url';
        link.textContent = bm.title ? bm.title : bm.url;
        info.appendChild(link);

        const tags = bm.tags || [];
        if (tags.length) {
            const tagsSpan = document.createElement('span');
            tagsSpan.className = 'bm-tags';
            tags.forEach(t => {
                tagsSpan.appendChild(document.createTextNode(' '));
                const chip = document.createElement('button');
                chip.className = 'tag-chip';
                chip.textContent = `[${t}]`;
                chip.onclick = () => setTagFilter(t);
                tagsSpan.appendChild(chip);
            });
            info.appendChild(tagsSpan);
        }

        const actions = document.createElement('div');
        actions.className = 'bm-actions';
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.title = 'Delete record';
        delBtn.textContent = '[x]';
        delBtn.onclick = () => deleteBookmark(bm.id);
        actions.appendChild(delBtn);

        item.appendChild(info);
        item.appendChild(actions);
        bookmarksList.appendChild(item);
    });
}

// Boot
init();
