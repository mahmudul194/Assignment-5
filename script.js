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


function searchIssues(query) {
    if (!query.trim()) {
        fetchIssues(); 
        return;
    }

     showLoading(true);
    fetch(`${API_BASE_URL}/issues/search?q=${encodeURIComponent(query)}`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            allIssues = data.data;
            renderIssues();
        })
        .catch(error => {
            console.error('Failed to search issues:', error);
        })
        .finally(() => {
            showLoading(false);
        });
}

function fetchSingleIssue(id) {
    openModal();
    modalLoader.classList.remove('hidden');
    modalContent.classList.add('hidden');

    fetch(`${API_BASE_URL}/issue/${id}`)
        .then(response => {
            if (!response.ok){
                throw new Error('Network response was not ok');
            } 
            return response.json();
        })
        .then(data => {
            populateModalData(data.data);
            modalLoader.classList.add('hidden');
            modalContent.classList.remove('hidden');
        })
        .catch(error => {
            console.error('Failed to fetch issue details:', error);
            closeModal();
        });
}


function renderIssues() {
    issuesContainer.innerHTML = '';

    const filtered = allIssues.filter(issue => {
        if (currentFilter === 'all') return true;
        return issue.status.toLowerCase() === currentFilter;
    });

    issueCount.textContent = filtered.length;

    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');

        filtered.forEach(issue => {
            const card = createIssueCard(issue);
            issuesContainer.appendChild(card);
        });
    }
}

function updateTabsUI(activeTabBtn) {
    tabBtns.forEach(btn => {
        btn.classList.remove('bg-indigo-600', 'text-white', 'border-transparent');
        btn.classList.add('border', 'border-slate-200', 'bg-white', 'text-slate-600', 'hover:text-white', 'hover:bg-indigo-600', 'hover:border-indigo-600');
    });
    activeTabBtn.classList.add('bg-indigo-600', 'text-white');
    activeTabBtn.classList.remove('border', 'border-slate-200', 'bg-white', 'text-slate-600', 'hover:text-white', 'hover:bg-indigo-600', 'hover:border-indigo-600');
}

function showLoading(isLoading) {
    if (isLoading) {
        loadingSpinner.classList.remove('hidden');
        loadingSpinner.classList.add('flex');
        issuesContainer.classList.add('hidden');
        emptyState.classList.add('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
        loadingSpinner.classList.remove('flex');
        issuesContainer.classList.remove('hidden');
    }
}


function createIssueCard(issue) {
    const isClosed = issue.status.toLowerCase() === 'closed';
    const borderColorClass = isClosed ? 'border-t-violet-500' : 'border-t-emerald-500';
    const statusIcon = isClosed
        ? `<img src="./assets/Closed- Status .png" class="w-5 h-5" alt="Closed">`
        : `<img src="./assets/Open-Status.png" class="w-5 h-5" alt="Open">`;

    const dateFormatted = new Date(issue.createdAt).toLocaleDateString();

    const div = document.createElement('div');
    
    div.className = `bg-white rounded-xl shadow-sm border border-slate-200 border-t-4 ${borderColorClass} p-5 hover:border-slate-300 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col h-full`;

    
    div.addEventListener('click', () => fetchSingleIssue(issue.id || issue._id)); // handle both DB ID formats if they vary

    div.innerHTML = `
        <div class="flex justify-between items-start mb-3">
            <div class="shrink-0">${statusIcon}</div>
            <div class="shrink-0">${getPriorityBadge(issue.priority)}</div>
        </div>
        
        <h3 class="text-base font-bold text-slate-800 mb-2 line-clamp-2">${escapeHTML(issue.title)}</h3>
        <p class="text-sm text-slate-500 mb-4 line-clamp-2 grow">${escapeHTML(issue.description)}</p>
        
        <div class="flex flex-wrap gap-2 mb-4">
            ${issue.labels ? issue.labels.map(l => getLabelBadge(l)).join('') : ''}
        </div>
        
        <div class="mt-auto pt-4 border-t border-slate-100 flex flex-col text-xs text-slate-400">
            <span class="mb-1">#${issue.id || issue._id} by <span class="text-slate-600 font-medium">${escapeHTML(issue.author)}</span></span>
            <span>${dateFormatted}</span>
        </div>
    `;

    return div;
}

