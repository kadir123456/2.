// Main Application Controller
class App {
    constructor() {
        this.currentPage = 'landing-page';
        this.mobileMenuOpen = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeApp();
        this.setupPWA();
    }

    setupEventListeners() {
        // Page navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('[onclick*="showPage"]')) {
                e.preventDefault();
                const onclick = e.target.getAttribute('onclick');
                const pageMatch = onclick.match(/showPage\('([^']+)'\)/);
                if (pageMatch) {
                    this.showPage(pageMatch[1]);
                }
            }
        });

        // Smooth scrolling for anchor links
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="#"]')) {
                e.preventDefault();
                const targetId = e.target.getAttribute('href').substring(1);
                this.scrollToSection(targetId);
            }
        });

        // Mobile menu toggle
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.mobileMenuOpen && !e.target.closest('.navbar')) {
                this.closeMobileMenu();
            }
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.showPage(e.state.page, false);
            }
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            showNotification('İnternet bağlantısı yeniden kuruldu', 'success');
        });

        window.addEventListener('offline', () => {
            showNotification('İnternet bağlantısı kesildi', 'warning');
        });
    }

    async initializeApp() {
        // Show loading screen
        this.showLoadingScreen();

        try {
            // Initialize Firebase and check auth state
            await this.waitForFirebase();
            
            // Check if user is already authenticated
            const user = auth.currentUser;
            if (user) {
                // Check if admin
                if (user.email === 'admin@cryptobotpro.com') {
                    this.showPage('admin-page');
                } else {
                    this.showPage('dashboard-page');
                }
            } else {
                this.showPage('landing-page');
            }

        } catch (error) {
            console.error('App initialization error:', error);
            this.showPage('landing-page');
        } finally {
            // Hide loading screen
            this.hideLoadingScreen();
        }
    }

    waitForFirebase() {
        return new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged((user) => {
                unsubscribe();
                resolve(user);
            });
        });
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, 1000);
        }
    }

    showPage(pageId, addToHistory = true) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageId;

            // Add to browser history
            if (addToHistory) {
                history.pushState({ page: pageId }, '', `#${pageId}`);
            }

            // Initialize page-specific functionality
            this.initializePage(pageId);

            // Close mobile menu if open
            this.closeMobileMenu();

            // Scroll to top
            window.scrollTo(0, 0);
        }
    }

    initializePage(pageId) {
        switch (pageId) {
            case 'dashboard-page':
                if (dashboardManager) {
                    dashboardManager.loadDashboardData();
                }
                break;
            case 'settings-page':
                if (dashboardManager) {
                    dashboardManager.loadSystemInfo();
                }
                break;
            case 'subscription-page':
                if (dashboardManager) {
                    dashboardManager.loadSubscriptionData();
                }
                break;
            case 'admin-page':
                if (!window.adminManager) {
                    window.adminManager = new AdminManager();
                }
                break;
        }
    }

    scrollToSection(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    toggleMobileMenu() {
        const navMenu = document.querySelector('.nav-menu');
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        
        if (navMenu && mobileToggle) {
            this.mobileMenuOpen = !this.mobileMenuOpen;
            
            if (this.mobileMenuOpen) {
                navMenu.classList.add('mobile-open');
                mobileToggle.classList.add('active');
            } else {
                navMenu.classList.remove('mobile-open');
                mobileToggle.classList.remove('active');
            }
        }
    }

    closeMobileMenu() {
        const navMenu = document.querySelector('.nav-menu');
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        
        if (navMenu && mobileToggle) {
            this.mobileMenuOpen = false;
            navMenu.classList.remove('mobile-open');
            mobileToggle.classList.remove('active');
        }
    }

    setupPWA() {
        // Register service worker
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

        // Handle PWA install prompt
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button or notification
            showNotification('Bu uygulamayı ana ekranınıza ekleyebilirsiniz!', 'info');
        });

        // Handle PWA install
        window.addEventListener('appinstalled', () => {
            showNotification('Uygulama başarıyla yüklendi!', 'success');
            deferredPrompt = null;
        });
    }
}

// Utility Functions
function showNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const iconMap = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    notification.innerHTML = `
        <div class="notification-content">
            <span>${iconMap[type] || ''} ${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;

    container.appendChild(notification);

    // Auto remove
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, duration);
}

function copyToClipboard(elementIdOrText) {
    let textToCopy;
    
    if (elementIdOrText.startsWith('#') || document.getElementById(elementIdOrText)) {
        const element = document.getElementById(elementIdOrText.replace('#', ''));
        textToCopy = element ? element.textContent : elementIdOrText;
    } else {
        textToCopy = elementIdOrText;
    }

    if (navigator.clipboard) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            showNotification('Panoya kopyalandı!', 'success', 2000);
        }).catch(() => {
            fallbackCopyToClipboard(textToCopy);
        });
    } else {
        fallbackCopyToClipboard(textToCopy);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showNotification('Panoya kopyalandı!', 'success', 2000);
    } catch (err) {
        showNotification('Kopyalama başarısız!', 'error', 2000);
    }
    
    document.body.removeChild(textArea);
}

function closeAnnouncement() {
    const announcementCard = document.getElementById('system-announcement');
    if (announcementCard) {
        announcementCard.style.display = 'none';
    }
}

function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
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

function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Az önce';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} dakika önce`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} saat önce`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} gün önce`;
    }
}

// Global page navigation function
function showPage(pageId) {
    if (window.app) {
        window.app.showPage(pageId);
    }
}

function scrollToSection(sectionId) {
    if (window.app) {
        window.app.scrollToSection(sectionId);
    }
}

function toggleMobileMenu() {
    if (window.app) {
        window.app.toggleMobileMenu();
    }
}

// Error handling
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
    showNotification('Bir hata oluştu. Lütfen sayfayı yenileyin.', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    showNotification('Bir hata oluştu. Lütfen tekrar deneyin.', 'error');
});

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    console.log('🚀 CryptoBot Pro initialized successfully!');
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        App,
        showNotification,
        copyToClipboard,
        formatCurrency,
        formatPercentage,
        formatDate
    };
}