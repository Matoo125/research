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
const bookmarksList = document.getElementById('bookmarks-list');

// State
let token = localStorage.getItem('nexus_token');
let currentUser = localStorage.getItem('nexus_user');

// Init
function init() {
    if (token) {
        showApp();
        fetchBookmarks();
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
        const bookmarks = await apiCall('/bookmarks');
        renderBookmarks(bookmarks);
    } catch (err) {
        console.error(err);
    }
}

addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = urlInput.value;
    const title = titleInput.value;

    try {
        await apiCall('/bookmarks', 'POST', { url, title });
        urlInput.value = '';
        titleInput.value = '';
        fetchBookmarks();
    } catch (err) {
        alert(err.message);
    }
});

async function deleteBookmark(id) {
    try {
        await apiCall(`/bookmarks/${id}`, 'DELETE');
        fetchBookmarks();
    } catch (err) {
        alert(err.message);
    }
}

function renderBookmarks(bookmarks) {
    bookmarksList.innerHTML = '';
    
    if (bookmarks.length === 0) {
        bookmarksList.innerHTML = '<div>Empty</div>';
        return;
    }

    // Sort by id descending
    bookmarks.sort((a, b) => b.id - a.id).forEach((bm, index) => {
        const item = document.createElement('div');
        item.className = 'bookmark-item';
        item.innerHTML = `
            <div class="bm-info">
                [${bm.id}] <a href="${bm.url}" target="_blank" rel="noopener noreferrer" class="bm-url">${bm.url}</a> ${bm.title ? '- ' + bm.title : ''}
            </div>
            <div class="bm-actions">
                <button class="delete-btn" title="Delete record" onclick="deleteBookmark(${bm.id})">[x]</button>
            </div>
        `;
        bookmarksList.appendChild(item);
    });
}

// Boot
init();
