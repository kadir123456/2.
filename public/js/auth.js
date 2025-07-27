// Authentication Management
let authManager;

(function() {
    'use strict';
    
    if (window.authManager) {
        return; // Already initialized
    }

    class AuthManager {
        constructor() {
            this.currentUser = null;
            this.authToken = null;
            this.isReady = false;
            this.initPromise = null;
        }

        async init() {
            if (this.initPromise) {
                return this.initPromise;
            }

            this.initPromise = this._doInit();
            return this.initPromise;
        }

        async _doInit() {
            try {
                // Wait for Firebase ready event
                await this.waitForFirebaseReady();
                
                // Check for saved auth state
                const savedToken = localStorage.getItem('authToken');
                const savedUser = localStorage.getItem('currentUser');
                
                if (savedToken && savedUser) {
                    this.authToken = savedToken;
                    this.currentUser = JSON.parse(savedUser);
                }

                this.setupAuthListener();
                this.setupFormHandlers();
                this.isReady = true;
                console.log('✅ Auth Manager ready');
            } catch (error) {
                console.error('❌ Auth Manager init failed:', error);
                throw error;
            }
        }

        async waitForFirebaseReady() {
            return new Promise((resolve, reject) => {
                if (window.auth && window.firebaseConfigManager?.isInitialized) {
                    resolve();
                    return;
                }
                
                const timeout = setTimeout(() => {
                    reject(new Error('Firebase Auth not available'));
                }, 10000);
                
                window.addEventListener('firebaseReady', () => {
                    clearTimeout(timeout);
                    resolve();
                }, { once: true });
            });
        }

        setupAuthListener() {
            if (!window.auth) {
                console.error('Firebase Auth not available for listener setup');
                return;
            }
            
            window.auth.onAuthStateChanged((user) => {
                if (user) {
                    this.handleAuthStateChange(user);
                } else {
                    this.handleSignOut();
                }
            });
        }

        setupAuthListener() {
            window.auth.onAuthStateChanged((user) => {
                if (user) {
                    this.handleAuthStateChange(user);
                } else {
                    this.handleSignOut();
                }
            });
        }

        setupFormHandlers() {
            // Login form
            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            }

            // Register form
            const registerForm = document.getElementById('register-form');
            if (registerForm) {
                registerForm.addEventListener('submit', (e) => this.handleRegister(e));
            }

            // Logout button
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => this.logout());
            }
        }

        async handleLogin(event) {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);
            const email = formData.get('email');
            const password = formData.get('password');

            const submitBtn = form.querySelector('button[type="submit"]');
            this.setButtonLoading(submitBtn, true);

            try {
                // Sign in with Firebase
                const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                // Get ID token
                const idToken = await user.getIdToken();
                
                // Store auth data
                this.authToken = idToken;
                localStorage.setItem('authToken', idToken);
                
                // Check if admin
                if (email === 'admin@ezyago.com') {
                    window.app?.showPage('admin-page');
                } else {
                    window.app?.showPage('dashboard-page');
                }
                
                this.showNotification('Giriş başarılı!', 'success');
                
            } catch (error) {
                console.error('Login error:', error);
                let errorMessage = 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.';
                
                if (error.code === 'auth/user-not-found') {
                    errorMessage = 'Bu email adresi ile kayıtlı kullanıcı bulunamadı.';
                } else if (error.code === 'auth/wrong-password') {
                    errorMessage = 'Şifre hatalı.';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = 'Geçersiz email adresi.';
                } else if (error.code === 'auth/api-key-not-valid') {
                    errorMessage = 'Firebase yapılandırma hatası. Lütfen yöneticiyle iletişime geçin.';
                }
                
                this.showNotification(errorMessage, 'error');
            } finally {
                this.setButtonLoading(submitBtn, false);
            }
        }

        async handleRegister(event) {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);
            const fullName = formData.get('fullName');
            const email = formData.get('email');
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');

            if (password !== confirmPassword) {
                this.showNotification('Şifreler eşleşmiyor!', 'error');
                return;
            }

            if (password.length < 6) {
                this.showNotification('Şifre en az 6 karakter olmalıdır!', 'error');
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            this.setButtonLoading(submitBtn, true);

            try {
                // Create user with Firebase
                const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                // Update profile
                await user.updateProfile({
                    displayName: fullName
                });
                
                // Get ID token
                const idToken = await user.getIdToken();
                
                // Register user in backend
                const response = await fetch(`${window.API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`
                    },
                    body: JSON.stringify({
                        fullName,
                        email
                    })
                });

                if (response.ok) {
                    this.authToken = idToken;
                    localStorage.setItem('authToken', idToken);
                    
                    window.app?.showPage('dashboard-page');
                    this.showNotification('Hesap başarıyla oluşturuldu! 7 günlük deneme sürünüz başladı.', 'success');
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Kayıt işlemi başarısız');
                }
                
            } catch (error) {
                console.error('Registration error:', error);
                let errorMessage = 'Kayıt işlemi başarısız. Lütfen tekrar deneyin.';
                
                if (error.code === 'auth/email-already-in-use') {
                    errorMessage = 'Bu email adresi zaten kullanımda.';
                } else if (error.code === 'auth/weak-password') {
                    errorMessage = 'Şifre çok zayıf. Daha güçlü bir şifre seçin.';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = 'Geçersiz email adresi.';
                } else if (error.code === 'auth/api-key-not-valid') {
                    errorMessage = 'Firebase yapılandırma hatası. Lütfen yöneticiyle iletişime geçin.';
                }
                
                this.showNotification(errorMessage, 'error');
            } finally {
                this.setButtonLoading(submitBtn, false);
            }
        }

        async handleAuthStateChange(user) {
            if (user) {
                this.currentUser = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName
                };
                
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                
                // Update UI
                this.updateUserUI();
                
                // Get fresh token
                const idToken = await user.getIdToken();
                this.authToken = idToken;
                localStorage.setItem('authToken', idToken);
            }
        }

        handleSignOut() {
            this.currentUser = null;
            this.authToken = null;
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            
            // Redirect to landing page
            window.app?.showPage('landing-page');
        }

        async logout() {
            try {
                await window.auth.signOut();
                this.showNotification('Başarıyla çıkış yapıldı.', 'info');
            } catch (error) {
                console.error('Logout error:', error);
                this.showNotification('Çıkış yapılırken hata oluştu.', 'error');
            }
        }

        updateUserUI() {
            if (!this.currentUser) return;

            // Update user name
            const userNameElements = document.querySelectorAll('#user-name');
            userNameElements.forEach(el => {
                el.textContent = this.currentUser.displayName || this.currentUser.email;
            });

            // Update user avatar
            const userAvatarElements = document.querySelectorAll('#user-avatar');
            userAvatarElements.forEach(el => {
                const initials = this.getUserInitials(this.currentUser.displayName || this.currentUser.email);
                el.textContent = initials;
            });
        }

        getUserInitials(name) {
            return name
                .split(' ')
                .map(word => word.charAt(0))
                .join('')
                .toUpperCase()
                .substring(0, 2);
        }

        setButtonLoading(button, loading) {
            if (!button) return;

            const textSpan = button.querySelector('.btn-text');
            const loadingSpan = button.querySelector('.btn-loading');

            if (loading) {
                button.disabled = true;
                if (textSpan) textSpan.style.display = 'none';
                if (loadingSpan) loadingSpan.style.display = 'flex';
            } else {
                button.disabled = false;
                if (textSpan) textSpan.style.display = 'inline';
                if (loadingSpan) loadingSpan.style.display = 'none';
            }
        }

        showNotification(message, type) {
            if (window.showNotification) {
                window.showNotification(message, type);
            } else {
                console.log(`${type.toUpperCase()}: ${message}`);
            }
        }

        isAuthenticated() {
            return !!this.authToken && !!this.currentUser;
        }

        getAuthHeaders() {
            return {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            };
        }
    }

    // Create global instance
    authManager = new AuthManager();
    window.authManager = authManager;

})();

// Initialize auth manager when Firebase is ready
document.addEventListener('DOMContentLoaded', async () => {
    setTimeout(async () => {
        try {
            await window.authManager.init();
        } catch (error) {
            console.error('❌ Auth Manager initialization failed:', error);
        }
    }, 1000);
});
