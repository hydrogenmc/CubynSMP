/**
 * CubynSMP Website JavaScript
 * Frontend functionality for server status, ranks, and interactivity
 */

// Configuration - will be overridden by config from localStorage or config.json
let CONFIG = {
    serverIp: 'cubyn.xyz',
    serverPort: '6058',
    discordLink: 'https://discord.gg/XaUBr97NUW',
    apiBaseUrl: ''
};

// Store the full config data
let websiteConfig = null;

// DOM Elements
const elements = {
    navToggle: document.getElementById('navToggle'),
    navMenu: document.getElementById('navMenu'),
    serverStatus: document.getElementById('serverStatus'),
    statusIndicator: document.getElementById('statusIndicator'),
    statusText: document.getElementById('statusText'),
    playerCount: document.getElementById('playerCount'),
    onlinePlayers: document.getElementById('onlinePlayers'),
    maxPlayers: document.getElementById('maxPlayers'),
    serverIp: document.getElementById('serverIp'),
    serverPort: document.getElementById('serverPort'),
    copyBtn: document.getElementById('copyBtn'),
    joinServerBtn: document.getElementById('joinServerBtn'),
    ranksGrid: document.getElementById('ranksGrid'),
    heroTitle: document.getElementById('heroTitle'),
    heroTagline: document.getElementById('heroTagline'),
    serverDescription: document.getElementById('serverDescription')
};

/**
 * Initialize the website
 */
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadConfigAndInit();
    initCopyButton();
    initJoinButton();
});

/**
 * Load configuration from localStorage (admin updates) or config.json (default)
 * Then initialize everything that depends on config
 */
async function loadConfigAndInit() {
    try {
        // First check if there's a saved config in localStorage (from admin panel)
        const savedConfig = localStorage.getItem('cubynsmp_config');
        
        if (savedConfig) {
            websiteConfig = JSON.parse(savedConfig);
            console.log('Loaded config from localStorage (admin updated)');
        } else {
            // If not in localStorage, load from config.json (default)
            const response = await fetch('config.json');
            websiteConfig = await response.json();
            console.log('Loaded config from config.json');
        }
        
        // Update CONFIG with loaded values
        CONFIG.serverIp = websiteConfig.server.ip;
        CONFIG.serverPort = websiteConfig.server.port;
        CONFIG.discordLink = websiteConfig.discord.link;
        
        // Apply config to website
        applyConfigToWebsite();
        
        // Now initialize server status (needs CONFIG updated first)
        initServerStatus();
        
        // Load ranks
        renderRanks(websiteConfig.ranks);
        
    } catch (error) {
        console.error('Error loading config:', error);
        // Fallback: use default CONFIG values and fallback ranks
        initServerStatus();
        renderRanks(getFallbackRanks());
    }
}

/**
 * Apply loaded configuration to website elements
 */
function applyConfigToWebsite() {
    if (!websiteConfig) return;
    
    // Update hero section
    if (elements.heroTitle) elements.heroTitle.textContent = websiteConfig.hero.title;
    if (elements.heroTagline) elements.heroTagline.textContent = websiteConfig.hero.tagline;
    if (elements.serverDescription) elements.serverDescription.textContent = websiteConfig.server.description;
    
    // Update server info
    if (elements.serverIp) elements.serverIp.textContent = websiteConfig.server.ip;
    if (elements.serverPort) elements.serverPort.textContent = websiteConfig.server.port;
    
    // Update Discord links
    document.querySelectorAll('a[href*="discord.gg"]').forEach(link => {
        link.href = websiteConfig.discord.link;
    });
}

/**
 * Mobile Navigation Toggle
 */
function initNavigation() {
    if (elements.navToggle && elements.navMenu) {
        elements.navToggle.addEventListener('click', () => {
            elements.navMenu.classList.toggle('active');
            
            // Animate hamburger
            const hamburgers = elements.navToggle.querySelectorAll('.hamburger');
            hamburgers.forEach((hamburger, index) => {
                if (elements.navMenu.classList.contains('active')) {
                    if (index === 0) hamburger.style.transform = 'rotate(45deg) translate(5px, 5px)';
                    if (index === 1) hamburger.style.opacity = '0';
                    if (index === 2) hamburger.style.transform = 'rotate(-45deg) translate(5px, -5px)';
                } else {
                    hamburger.style.transform = 'none';
                    hamburger.style.opacity = '1';
                }
            });
        });

        // Close menu when clicking a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                elements.navMenu.classList.remove('active');
                const hamburgers = elements.navToggle.querySelectorAll('.hamburger');
                hamburgers.forEach(hamburger => {
                    hamburger.style.transform = 'none';
                    hamburger.style.opacity = '1';
                });
            });
        });
    }
}

/**
 * Fetch and display server status
 */
async function initServerStatus() {
    const { serverIp, serverPort } = CONFIG;
    
    try {
        // Use mcstatus.io API for Minecraft server status
        const response = await fetch(`https://api.mcstatus.io/v2/status/java/${serverIp}:${serverPort}`);
        const data = await response.json();
        
        if (data.online) {
            updateStatusOnline(data);
        } else {
            updateStatusOffline();
        }
    } catch (error) {
        console.error('Error fetching server status:', error);
        // Try alternative API
        tryAlternativeApi();
    }
}

/**
 * Try alternative API for server status
 */
async function tryAlternativeApi() {
    const { serverIp, serverPort } = CONFIG;
    
    try {
        const response = await fetch(`https://api.mcsrvstat.us/2/${serverIp}:${serverPort}`);
        const data = await response.json();
        
        if (data.online) {
            updateStatusOnline({
                players: {
                    online: data.players?.online || 0,
                    max: data.players?.max || 0
                }
            });
        } else {
            updateStatusOffline();
        }
    } catch (error) {
        console.error('Alternative API also failed:', error);
        updateStatusOffline();
    }
}

/**
 * Update UI when server is online
 */
function updateStatusOnline(data) {
    const online = data.players?.online || 0;
    const max = data.players?.max || 0;
    
    elements.statusIndicator.className = 'status-indicator online';
    elements.statusText.textContent = 'Server Online';
    elements.statusText.style.color = 'var(--success-color)';
    
    elements.onlinePlayers.textContent = online;
    elements.maxPlayers.textContent = max;
    elements.playerCount.style.display = 'flex';
}

/**
 * Update UI when server is offline
 */
function updateStatusOffline() {
    elements.statusIndicator.className = 'status-indicator offline';
    elements.statusText.textContent = 'Server Offline';
    elements.statusText.style.color = 'var(--error-color)';
    elements.playerCount.style.display = 'none';
}

/**
 * Copy server IP to clipboard
 */
function initCopyButton() {
    if (elements.copyBtn) {
        elements.copyBtn.addEventListener('click', async () => {
            const ip = elements.serverIp.textContent;
            
            try {
                await navigator.clipboard.writeText(ip);
                
                // Show copied state
                elements.copyBtn.classList.add('copied');
                elements.copyBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                `;
                
                // Reset after 2 seconds
                setTimeout(() => {
                    elements.copyBtn.classList.remove('copied');
                    elements.copyBtn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    `;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        });
    }
}

/**
 * Join Server button functionality
 */
function initJoinButton() {
    if (elements.joinServerBtn) {
        elements.joinServerBtn.addEventListener('click', () => {
            const ip = elements.serverIp.textContent;
            
            // Copy IP to clipboard
            navigator.clipboard.writeText(ip).then(() => {
                // Show notification
                showNotification('Server IP copied! Paste it in Minecraft multiplayer.');
            }).catch(() => {
                showNotification('Server IP: ' + ip);
            });
        });
    }
}

/**
 * Show notification toast
 */
function showNotification(message) {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 15px 25px;
        z-index: 10000;
        animation: slideUp 0.3s ease forwards;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            to { transform: translateX(-50%) translateY(0); }
        }
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--text-primary);
            font-weight: 500;
        }
        .notification-content svg {
            color: var(--success-color);
            flex-shrink: 0;
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease reverse forwards';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

/**
 * Render rank cards
 */
function renderRanks(ranks) {
    if (!elements.ranksGrid) return;
    
    elements.ranksGrid.innerHTML = ranks.map(rank => `
        <div class="rank-card" style="--rank-color: ${rank.color}">
            <div class="rank-header">
                <h3 class="rank-name" style="background: ${rank.color}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${rank.name}</h3>
                <span class="rank-duration">${rank.duration}</span>
            </div>
            <div class="rank-price">
                <span class="price-amount">${rank.price}</span>
            </div>
            <ul class="rank-perks">
                ${rank.perks.map(perk => `
                    <li class="rank-perk">
                        <span class="perk-check" style="background: ${rank.color}">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </span>
                        ${perk}
                    </li>
                `).join('')}
            </ul>
        </div>
    `).join('');
}

/**
 * Fallback ranks data
 */
function getFallbackRanks() {
    return [
        {
            name: "VIP",
            color: "#FFA500",
            price: "₱50",
            duration: "30 Days",
            perks: ["2x Homes", "10x Concurrent Auctions", "/grindstone Command", "/disposal Command", "/ec Command", "/kit Command"]
        },
        {
            name: "MVP",
            color: "#87CEEB",
            price: "₱100",
            duration: "30 Days",
            perks: ["3x Homes", "15x Concurrent Auctions", "/cartographytable Command", "/stonecutter Command", "/disposal Command", "/craft Command", "/grindstone Command", "/kit Command"]
        },
        {
            name: "PRO",
            color: "linear-gradient(135deg, #FF4444, #FFA500)",
            price: "₱150",
            duration: "30 Days",
            perks: ["4x Homes", "20x Concurrent Auctions", "/craft Command", "/ec Command", "/disposal Command", "/stonecutter Command", "/grindstone Command", "/repair Command", "/anvil Command", "/cartographytable Command", "/kit Command"]
        },
        {
            name: "ELITE",
            color: "#FF0000",
            price: "₱200",
            duration: "30 Days",
            perks: ["5x Homes", "25x Concurrent Auctions", "/craft Command", "/ec Command", "/disposal Command", "/stonecutter Command", "/grindstone Command", "/anvil Command", "/smithingtable Command", "/cartographytable Command", "/repair Command", "/ptime Command", "/kit Command"]
        },
        {
            name: "LEGEND",
            color: "linear-gradient(135deg, #FF4444, #FFA500)",
            price: "₱400",
            duration: "30 Days",
            perks: ["7x Homes", "30x Concurrent Auctions", "/craft Command", "/cartographytable Command", "/ec Command", "/stonecutter Command", "/grindstone Command", "/anvil Command", "/smithingtable Command", "/ptime Command", "/pweather Command", "/repair Command", "/near Command", "/kit Command"]
        }
    ];
}

// Auto-refresh server status every 60 seconds
setInterval(initServerStatus, 60000);
