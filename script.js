const API_BASE_URL = 'https://phi-lab-server.vercel.app/api/v1/lab';
const DEMO_USER = 'admin';
const DEMO_PASS = 'admin123';

let allIssues = [];
let currentFilter = 'all';

const loginPage = document.getElementById('login-page');
const mainPage = document.getElementById('main-page');

const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');

const issuesContainer = document.getElementById('issues-container');
const issueCount = document.getElementById('issue-count');
const tabBtns = document.querySelectorAll('.tab-btn');
const loadingSpinner = document.getElementById('loading-spinner');
const emptyState = document.getElementById('empty-state');

const searchInput = document.getElementById('search-input');
const searchInputMobile = document.getElementById('search-input-mobile');

const modal = document.getElementById('issue-modal');
const modalLoader = document.getElementById('modal-loader');
const modalContent = document.getElementById('modal-content');
const closeBtns = document.querySelectorAll('.close-modal');

const modalTitle = document.getElementById('modal-title');
const modalStatusBadge = document.getElementById('modal-status-badge');
const modalAuthor = document.getElementById('modal-author');
const modalDate = document.getElementById('modal-date');
const modalLabels = document.getElementById('modal-labels');
const modalDescription = document.getElementById('modal-description');
const modalAssignee = document.getElementById('modal-assignee');
let modalPriorityBadge = document.getElementById('modal-priority-badge');

document.addEventListener('DOMContentLoaded', () => {
    
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true' && window.location.hash !== '#login') {
        loginPage.classList.add('hidden');
        mainPage.classList.remove('hidden');

        
        if (!window.location.hash) {
            history.replaceState(null, '', '#dashboard');
        }

        fetchIssues(); 
    } else {
        history.replaceState(null, '', '#login');
    }
    
    loginForm.addEventListener('submit', handleLogin);

    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentFilter = e.target.dataset.filter;
            updateTabsUI(e.target);

            showLoading(true);
            setTimeout(() => {
                renderIssues();
                showLoading(false);
            }, 500); 
        });
    });

     const handleSearch = debounce((e) => searchIssues(e.target.value), 300);
    searchInput.addEventListener('input', handleSearch);
    searchInputMobile.addEventListener('input', handleSearch);

    
    closeBtns.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    
    modal.addEventListener('click', (e) => {
        
        if (e.target === modal || e.target.classList.contains('min-h-screen')) {
            closeModal();
        }
    });

    
    window.addEventListener('popstate', handlePopState);
});


function handleLogin(e) {
    e.preventDefault();
    const user = usernameInput.value.trim();
    const pass = passwordInput.value.trim();

    if (user === DEMO_USER && pass === DEMO_PASS) {
        loginError.classList.add('hidden');
        loginPage.classList.add('hidden');
        mainPage.classList.remove('hidden');

        
        sessionStorage.setItem('isLoggedIn', 'true');
        history.pushState(null, '', '#dashboard');

        
        fetchIssues();
    } else {
        loginError.classList.remove('hidden');
    }
}

function handlePopState() {
    const hash = window.location.hash;

    if (hash === '#login' || hash === '') {
        
        sessionStorage.removeItem('isLoggedIn');

        let localMainPage = document.getElementById('main-page');
        let localLoginPage = document.getElementById('login-page');
        let localLoginForm = document.getElementById('login-form');
        let localLoginError = document.getElementById('login-error');

        localMainPage.classList.add('hidden');
        localLoginPage.classList.remove('hidden');

        
        localLoginForm.reset();
        localLoginError.classList.add('hidden');
    } else if (hash === '#dashboard' && sessionStorage.getItem('isLoggedIn') === 'true') {
        
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('main-page').classList.remove('hidden');
    }
}

function fetchIssues() {
    showLoading(true);
    fetch(`${API_BASE_URL}/issues`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            allIssues = data.data;
            renderIssues();
        })
        .catch(error => {
            console.error('Failed to fetch issues:', error);
        })
        .finally(() => {
            showLoading(false);
        });
}