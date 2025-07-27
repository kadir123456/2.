// App State Management
class AppState {
    constructor() {
        this.user = null;
        this.isLoggedIn = false;
        this.currentPage = 'landing-page';
        this.botSettings = {
            leverage: 10,
            positionSize: 25,
            stopLoss: 2,
            takeProfit: 4,
            strategy: 'ema_cross',
            timeframe: '5m',
            emaShort: 9,
            emaLong: 21
        };
        this.mockData = this.initializeMockData();
    }

    initializeMockData() {
        return {
            performance: [
                { date: '2024-01-01', value: 1000 },
                { date: '2024-01-02', value: 1025 },
                { date: '2024-01-03', value: 1010 },
                { date: '2024-01-04', value: 1045 },
                { date: '2024-01-05', value: 1062 },
                { date: '2024-01-06', value: 1080 },
                { date: '2024-01-07', value: 1247 }
            ],
            positions: [
                { pair: 'BTC/USDT', type: 'long', size: '0.01 BTC', pnl: 45.20, status: 'open' },
                { pair: 'ETH/USDT', type: 'short', size: '0.5 ETH', pnl: -12.80, status: 'open' },
                { pair: 'ADA/USDT', type: 'long', size: '1000 ADA', pnl: 23.40, status: 'open' }
            ],
            trades: [
                { pair: 'BTC/USDT', type: 'sell', amount: '0.001', price: '$45,230', pnl: 15.20, time: '2 dk önce' },
                { pair: 'ETH/USDT', type: 'buy', amount: '0.1', price: '$2,680', pnl: 8.50, time: '5 dk önce' },
                { pair: 'BNB/USDT', type: 'sell', amount: '2', price: '$320', pnl: -3.20, time: '12 dk önce' }
            ]
        };
    }
}

// Initialize app state
const appState = new AppState();

// Page Navigation
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        appState.currentPage = pageId;

        // Initialize page-specific features
        initializePage(pageId);
    }
}

function initializePage(pageId) {
    switch (pageId) {
        case 'dashboard-page':
            initializeDashboard();
            break;
        case 'settings-page':
            initializeSettings();
            break;
        case 'admin-page':
            initializeAdmin();
            break;
    }
}

// Authentication
function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');

    // Mock authentication
    if (email && password) {
        appState.isLoggedIn = true;
        appState.user = {
            email: email,
            fullName: 'John Doe',
            subscriptionStatus: 'active',
            trialEndDate: null
        };

        // Check if admin
        if (email === 'admin@cryptobot.com') {
            showPage('admin-page');
        } else {
            showPage('dashboard-page');
        }

        showNotification('Giriş başarılı!', 'success');
    } else {
        showNotification('Email ve şifre gerekli!', 'error');
    }
}

function handleRegister(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const fullName = formData.get('fullName');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    if (password !== confirmPassword) {
        showNotification('Şifreler eşleşmiyor!', 'error');
        return;
    }

    if (fullName && email && password) {
        appState.isLoggedIn = true;
        appState.user = {
            email: email,
            fullName: fullName,
            subscriptionStatus: 'trial',
            trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        };

        showPage('dashboard-page');
        showNotification('Hesap başarıyla oluşturuldu! 7 günlük deneme sürünüz başladı.', 'success');
    } else {
        showNotification('Tüm alanları doldurun!', 'error');
    }
}

function handleLogout() {
    appState.isLoggedIn = false;
    appState.user = null;
    showPage('landing-page');
    showNotification('Başarıyla çıkış yapıldı.', 'info');
}

// Dashboard Initialization
function initializeDashboard() {
    updateDashboardStats();
    initializePerformanceChart();
    updatePositionsList();
    updateTradesList();
    startRealTimeUpdates();
}

function updateDashboardStats() {
    // This would be updated with real API data
    const stats = {
        totalPnL: 1247.50,
        openPositions: 3,
        winRate: 68.5,
        botStatus: 'active'
    };

    // Update stat values (mock implementation)
}

function initializePerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: appState.mockData.performance.map(p => p.date),
            datasets: [{
                label: 'Portföy Değeri',
                data: appState.mockData.performance.map(p => p.value),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
}

function updatePositionsList() {
    // Mock implementation - would be updated with real data
}

function updateTradesList() {
    // Mock implementation - would be updated with real data
}

function startRealTimeUpdates() {
    // Mock real-time updates
    setInterval(() => {
        updateDashboardStats();
        // Update other real-time data
    }, 5000);
}

// Settings Page
function initializeSettings() {
    loadBotSettings();
    setupSettingsHandlers();
}

function loadBotSettings() {
    // Load settings from state and populate form fields
    const settings = appState.botSettings;
    
    // This would populate actual form fields
    console.log('Loading bot settings:', settings);
}

function setupSettingsHandlers() {
    // Setup form submission handlers for settings
    const settingsForms = document.querySelectorAll('.settings-form');
    settingsForms.forEach(form => {
        form.addEventListener('submit', handleSettingsSubmit);
    });
}

function handleSettingsSubmit(event) {
    event.preventDefault();
    
    // Mock settings save
    showNotification('Ayarlar başarıyla kaydedildi!', 'success');
}

// Admin Page
function initializeAdmin() {
    updateAdminStats();
    loadRecentUsers();
    loadRecentPayments();
}

function updateAdminStats() {
    // Mock admin stats update
    console.log('Updating admin statistics');
}

function loadRecentUsers() {
    // Mock recent users loading
    console.log('Loading recent users');
}

function loadRecentPayments() {
    // Mock recent payments loading
    console.log('Loading recent payments');
}

// Sidebar Navigation
function setupSidebarNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-page]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = item.getAttribute('data-page');
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Show corresponding content
            if (pageId === 'dashboard') {
                showDashboardContent();
            } else if (pageId === 'settings') {
                showPage('settings-page');
            } else {
                // Handle other nav items
                console.log('Navigate to:', pageId);
            }
        });
    });
}

function showDashboardContent() {
    // If we're already on dashboard page, just update the content
    if (appState.currentPage === 'dashboard-page') {
        updateDashboardStats();
    } else {
        showPage('dashboard-page');
    }
}

// Notifications
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Mobile Menu Toggle
function setupMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
}

// Utility Functions
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

function formatPercentage(value) {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function formatDate(date) {
    return new Intl.DateTimeFormat('tr-TR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
}

// WebSocket Connection (Mock)
class WebSocketManager {
    constructor() {
        this.connection = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect() {
        // Mock WebSocket connection
        console.log('Connecting to WebSocket...');
        
        // Simulate connection success
        setTimeout(() => {
            this.onConnect();
        }, 1000);
    }

    onConnect() {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Start sending mock real-time data
        this.startMockDataStream();
    }

    startMockDataStream() {
        setInterval(() => {
            // Mock real-time price updates
            this.onMessage({
                type: 'price_update',
                data: {
                    symbol: 'BTCUSDT',
                    price: 45000 + Math.random() * 1000,
                    change: (Math.random() - 0.5) * 5
                }
            });
        }, 2000);
    }

    onMessage(data) {
        // Handle incoming WebSocket messages
        if (data.type === 'price_update') {
            this.updatePriceDisplay(data.data);
        }
    }

    updatePriceDisplay(priceData) {
        // Update price displays in the UI
        console.log('Price update:', priceData);
    }

    disconnect() {
        if (this.connection) {
            this.connection.close();
        }
    }
}

// Initialize WebSocket Manager
const wsManager = new WebSocketManager();

// PWA Support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// App Initialization
document.addEventListener('DOMContentLoaded', function() {
    // Setup event listeners
    setupSidebarNavigation();
    setupMobileMenu();
    
    // Initialize WebSocket connection
    wsManager.connect();
    
    // Check if user should be logged in (localStorage check)
    const savedUser = localStorage.getItem('cryptobot_user');
    if (savedUser) {
        try {
            appState.user = JSON.parse(savedUser);
            appState.isLoggedIn = true;
            showPage('dashboard-page');
        } catch (e) {
            localStorage.removeItem('cryptobot_user');
        }
    }
    
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add loading states to buttons
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.type === 'submit') {
                this.classList.add('loading');
                this.innerHTML += ' <span class="spinner"></span>';
                
                setTimeout(() => {
                    this.classList.remove('loading');
                    const spinner = this.querySelector('.spinner');
                    if (spinner) {
                        spinner.remove();
                    }
                }, 2000);
            }
        });
    });
    
    console.log('CryptoBot Pro initialized successfully!');
});

// Error Handling
window.addEventListener('error', function(e) {
    console.error('Application error:', e.error);
    showNotification('Bir hata oluştu. Lütfen sayfayı yenileyin.', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showNotification('Bir hata oluştu. Lütfen tekrar deneyin.', 'error');
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AppState,
        showPage,
        handleLogin,
        handleRegister,
        formatCurrency,
        formatPercentage,
        formatDate
    };
}