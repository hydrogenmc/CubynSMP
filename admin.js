/**
 * CubynSMP Admin Panel JavaScript
 * Admin functionality for managing website content
 */

// Admin Configuration
const ADMIN_PASSWORD = 'admin123';

// State
let configData = null;
let currentSection = 'server';

// DOM Elements
const elements = {
    loginOverlay: document.getElementById('loginOverlay'),
    adminDashboard: document.getElementById('adminDashboard'),
    loginForm: document.getElementById('loginForm'),
    adminPassword: document.getElementById('adminPassword'),
    logoutBtn: document.getElementById('logoutBtn'),
    saveAllBtn: document.getElementById('saveAllBtn'),
    sidebarLinks: document.querySelectorAll('.sidebar-link[data-section]'),
    adminSections: document.querySelectorAll('.admin-section'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage'),
    
    // Form fields
    serverName: document.getElementById('serverName'),
    serverIp: document.getElementById('serverIp'),
    serverPort: document.getElementById('serverPort'),
    serverDescription: document.getElementById('serverDescription'),
    discordLink: document.getElementById('discordLink'),
    heroTitle: document.getElementById('heroTitle'),
    heroTagline: document.getElementById('heroTagline'),
    
    // Lists
    featuresList: document.getElementById('featuresList'),
    ranksList: document.getElementById('ranksList'),
    
    // Buttons
    addFeatureBtn: document.getElementById('addFeatureBtn'),
    addRankBtn: document.getElementById('addRankBtn')
};

/**
 * Initialize admin panel
 */
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initEventListeners();
});

/**
 * Check if user is authenticated
 */
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (isLoggedIn === 'true') {
        showDashboard();
        loadConfig();
    }
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Login form
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', handleLogin);
    }
    
    // Logout
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Save all
    if (elements.saveAllBtn) {
        elements.saveAllBtn.addEventListener('click', saveAllChanges);
    }
    
    // Sidebar navigation
    elements.sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            switchSection(section);
        });
    });
    
    // Add feature
    if (elements.addFeatureBtn) {
        elements.addFeatureBtn.addEventListener('click', () => addFeatureInput(''));
    }
    
    // Add rank
    if (elements.addRankBtn) {
        elements.addRankBtn.addEventListener('click', () => openRankModal());
    }
}

/**
 * Handle login
 */
function handleLogin(e) {
    e.preventDefault();
    const password = elements.adminPassword.value;
    
    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        showDashboard();
        loadConfig();
        showToast('Login successful!', 'success');
    } else {
        showToast('Invalid password!', 'error');
        elements.adminPassword.value = '';
    }
}

/**
 * Handle logout
 */
function handleLogout() {
    sessionStorage.removeItem('adminLoggedIn');
    location.reload();
}

/**
 * Show dashboard
 */
function showDashboard() {
    elements.loginOverlay.style.display = 'none';
    elements.adminDashboard.style.display = 'flex';
}

/**
 * Switch admin section
 */
function switchSection(section) {
    currentSection = section;
    
    // Update sidebar
    elements.sidebarLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.section === section);
    });
    
    // Update sections
    elements.adminSections.forEach(sec => {
        sec.classList.toggle('active', sec.id === section + 'Section');
    });
    
    // Update title
    const titles = {
        server: 'Server Information',
        ranks: 'Manage Ranks',
        discord: 'Discord Settings',
        hero: 'Hero Section'
    };
    document.querySelector('.admin-title').textContent = titles[section] || 'Dashboard';
}

/**
 * Load configuration - checks localStorage first, then falls back to config.json
 */
async function loadConfig() {
    try {
        // First check if there's a saved config in localStorage
        const savedConfig = localStorage.getItem('cubynsmp_config');
        
        if (savedConfig) {
            configData = JSON.parse(savedConfig);
            console.log('Loaded config from localStorage');
        } else {
            // If not in localStorage, load from config.json
            const response = await fetch('config.json');
            configData = await response.json();
            // Save to localStorage for future use
            localStorage.setItem('cubynsmp_config', JSON.stringify(configData));
            console.log('Loaded config from config.json');
        }
        
        populateForms();
    } catch (error) {
        console.error('Error loading config:', error);
        showToast('Error loading configuration', 'error');
    }
}

/**
 * Populate form fields with config data
 */
function populateForms() {
    if (!configData) return;
    
    // Server info
    elements.serverName.value = configData.server.name || '';
    elements.serverIp.value = configData.server.ip || '';
    elements.serverPort.value = configData.server.port || '';
    elements.serverDescription.value = configData.server.description || '';
    
    // Discord
    elements.discordLink.value = configData.discord.link || '';
    
    // Hero
    elements.heroTitle.value = configData.hero.title || '';
    elements.heroTagline.value = configData.hero.tagline || '';
    
    // Features
    renderFeatures(configData.server.features || []);
    
    // Ranks
    renderRanksList(configData.ranks || []);
}

/**
 * Render features list
 */
function renderFeatures(features) {
    elements.featuresList.innerHTML = '';
    features.forEach((feature, index) => {
        addFeatureInput(feature, index);
    });
}

/**
 * Add feature input
 */
function addFeatureInput(value = '', index = null) {
    const featureItem = document.createElement('div');
    featureItem.className = 'feature-item';
    featureItem.innerHTML = `
        <input type="text" class="feature-input" value="${value}" placeholder="Enter feature">
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    elements.featuresList.appendChild(featureItem);
}

/**
 * Render ranks list
 */
function renderRanksList(ranks) {
    elements.ranksList.innerHTML = ranks.map((rank, index) => `
        <div class="admin-rank-item" data-index="${index}">
            <div class="admin-rank-header">
                <span class="admin-rank-title" style="color: ${getRankColor(rank.color)}">${rank.name}</span>
                <div class="admin-rank-actions">
                    <button type="button" class="btn-icon" onclick="editRank(${index})" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button type="button" class="btn-icon btn-danger" onclick="deleteRank(${index})" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="admin-rank-form" id="rankForm-${index}" style="display: none;">
                <div class="form-group">
                    <label>Rank Name</label>
                    <input type="text" class="rank-name-input" value="${rank.name}">
                </div>
                <div class="form-group">
                    <label>Price</label>
                    <input type="text" class="rank-price-input" value="${rank.price}">
                </div>
                <div class="form-group">
                    <label>Duration</label>
                    <input type="text" class="rank-duration-input" value="${rank.duration}">
                </div>
                <div class="form-group">
                    <label>Color (CSS)</label>
                    <input type="text" class="rank-color-input" value="${rank.color}">
                </div>
                <div class="form-group form-group-full">
                    <label>Perks (one per line)</label>
                    <div class="perks-editor" id="perksEditor-${index}">
                        ${rank.perks.map(perk => `
                            <div class="perk-input-row">
                                <input type="text" class="perk-input" value="${perk}">
                                <button type="button" class="btn-remove" onclick="this.parentElement.remove()">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="addPerkInput(${index})" style="margin-top: 8px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Perk
                    </button>
                </div>
                <div class="form-group form-group-full">
                    <button type="button" class="btn btn-primary" onclick="saveRank(${index})">Save Rank</button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Get rank color for display
 */
function getRankColor(color) {
    if (color.includes('gradient')) {
        return '#FFA500';
    }
    return color;
}

/**
 * Edit rank
 */
function editRank(index) {
    const form = document.getElementById(`rankForm-${index}`);
    form.style.display = form.style.display === 'none' ? 'grid' : 'none';
}

/**
 * Delete rank
 */
function deleteRank(index) {
    if (confirm('Are you sure you want to delete this rank?')) {
        configData.ranks.splice(index, 1);
        renderRanksList(configData.ranks);
        showToast('Rank deleted', 'success');
    }
}

/**
 * Add perk input
 */
function addPerkInput(rankIndex) {
    const editor = document.getElementById(`perksEditor-${rankIndex}`);
    const perkRow = document.createElement('div');
    perkRow.className = 'perk-input-row';
    perkRow.innerHTML = `
        <input type="text" class="perk-input" placeholder="Enter perk">
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    editor.appendChild(perkRow);
}

/**
 * Save rank
 */
function saveRank(index) {
    const rankItem = document.querySelector(`.admin-rank-item[data-index="${index}"]`);
    
    const name = rankItem.querySelector('.rank-name-input').value;
    const price = rankItem.querySelector('.rank-price-input').value;
    const duration = rankItem.querySelector('.rank-duration-input').value;
    const color = rankItem.querySelector('.rank-color-input').value;
    
    const perks = [];
    rankItem.querySelectorAll('.perk-input').forEach(input => {
        if (input.value.trim()) {
            perks.push(input.value.trim());
        }
    });
    
    configData.ranks[index] = {
        name,
        price,
        duration,
        color,
        perks
    };
    
    renderRanksList(configData.ranks);
    showToast('Rank saved! Click "Save Changes" to apply to website.', 'success');
}

/**
 * Open rank modal for new rank
 */
function openRankModal() {
    const newRank = {
        name: 'New Rank',
        price: '₱0',
        duration: '30 Days',
        color: '#FFFFFF',
        perks: ['New Perk']
    };
    
    configData.ranks.push(newRank);
    renderRanksList(configData.ranks);
    
    // Open the new rank's form
    const newIndex = configData.ranks.length - 1;
    setTimeout(() => {
        const form = document.getElementById(`rankForm-${newIndex}`);
        if (form) form.style.display = 'grid';
    }, 100);
    
    showToast('New rank added', 'success');
}

/**
 * Save all changes - ONE CLICK SAVE
 * This saves to localStorage which is shared with the main website
 */
async function saveAllChanges() {
    if (!configData) return;
    
    // Update config data from forms
    configData.server.name = elements.serverName.value;
    configData.server.ip = elements.serverIp.value;
    configData.server.port = elements.serverPort.value;
    configData.server.description = elements.serverDescription.value;
    
    // Update features
    const features = [];
    document.querySelectorAll('.feature-input').forEach(input => {
        if (input.value.trim()) {
            features.push(input.value.trim());
        }
    });
    configData.server.features = features;
    
    // Update discord
    configData.discord.link = elements.discordLink.value;
    
    // Update hero
    configData.hero.title = elements.heroTitle.value;
    configData.heroTagline = elements.heroTagline.value;
    
    try {
        // Save to localStorage - this is the key!
        // The main website reads from the same localStorage key
        localStorage.setItem('cubynsmp_config', JSON.stringify(configData));
        
        // Also save a timestamp to force refresh on main site
        localStorage.setItem('cubynsmp_config_updated', Date.now().toString());
        
        showToast('All changes saved! Website updated successfully!', 'success');
        
        // Optional: Show a message about refreshing
        setTimeout(() => {
            showToast('Open the main website to see changes!', 'success');
        }, 1500);
        
    } catch (error) {
        console.error('Error saving:', error);
        showToast('Error saving changes', 'error');
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    elements.toastMessage.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.add('show');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}
