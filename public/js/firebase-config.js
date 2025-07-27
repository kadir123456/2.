// Firebase Configuration Manager
let firebaseConfigManager;

(function() {
    'use strict';
    
    if (window.firebaseConfigManager) {
        return; // Already initialized
    }

    class FirebaseConfigManager {
        constructor() {
            this.config = null;
            this.isInitialized = false;
            this.initPromise = null;
        }

        async loadConfig() {
            try {
                console.log('Loading Firebase config from:', `${window.API_BASE_URL}/config`);
                const response = await fetch('/api/config');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                this.config = await response.json();
                console.log('✅ Environment config loaded:', {
                    hasApiKey: !!this.config.FIREBASE_API_KEY,
                    hasAuthDomain: !!this.config.FIREBASE_AUTH_DOMAIN,
                    hasProjectId: !!this.config.FIREBASE_PROJECT_ID,
                    projectId: this.config.FIREBASE_PROJECT_ID
                });
                return this.config;
            } catch (error) {
                console.error('❌ Failed to load environment config:', error);
                throw error;
            }
        }

        async initializeFirebase() {
            if (this.initPromise) {
                return this.initPromise;
            }

            this.initPromise = this._doInitialize();
            return this.initPromise;
        }

        async _doInitialize() {
            if (this.isInitialized) {
                console.log('🔥 Firebase already initialized');
                return Promise.resolve();
            }

            // Wait for Firebase to be available
            let attempts = 0;
            while (typeof firebase === 'undefined' && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            if (typeof firebase === 'undefined') {
                throw new Error('Firebase not loaded');
            }

            // Load config
            await this.loadConfig();

            // Check if Firebase is already initialized
            if (firebase.apps.length === 0) {
                const firebaseConfig = {
                    apiKey: this.config.FIREBASE_API_KEY,
                    authDomain: this.config.FIREBASE_AUTH_DOMAIN,
                    projectId: this.config.FIREBASE_PROJECT_ID,
                    storageBucket: this.config.FIREBASE_STORAGE_BUCKET,
                    messagingSenderId: this.config.FIREBASE_MESSAGING_SENDER_ID,
                    appId: this.config.FIREBASE_APP_ID,
                    databaseURL: this.config.FIREBASE_DATABASE_URL
                };

                firebase.initializeApp(firebaseConfig);
                console.log('🔥 Firebase initialized with environment config');
            } else {
                console.log('🔥 Firebase already initialized');
            }

            // Initialize Firebase services
            window.auth = firebase.auth();
            window.db = firebase.firestore();
            
            // Wait for auth to be ready
            await new Promise((resolve) => {
                const unsubscribe = window.auth.onAuthStateChanged(() => {
                    unsubscribe();
                    resolve();
                });
            });

            this.isInitialized = true;
            console.log('✅ Firebase services ready');
            
            // Dispatch ready event
            window.dispatchEvent(new CustomEvent('firebaseReady'));
        }
    }

    // Create global instance
    firebaseConfigManager = new FirebaseConfigManager();
    window.firebaseConfigManager = firebaseConfigManager;

    // API Base URL
    window.API_BASE_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api' 
        : window.location.origin + '/api';

})();

// Initialize Firebase when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.firebaseConfigManager.initializeFirebase();
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        if (window.showNotification) {
            window.showNotification('Firebase bağlantısı başarısız. Lütfen sayfayı yenileyin.', 'error');
        }
    }
});
