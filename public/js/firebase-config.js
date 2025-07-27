// Firebase Configuration Manager
class FirebaseConfigManager {
    constructor() {
        this.config = null;
        this.isInitialized = false;
    }

    async loadConfig() {
        try {
            const response = await fetch('/api/config');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.config = await response.json();
            console.log('✅ Environment config loaded');
            return this.config;
        } catch (error) {
            console.error('❌ Failed to load environment config:', error);
            // Fallback config for development
            this.config = {
                FIREBASE_API_KEY: "demo-api-key",
                FIREBASE_AUTH_DOMAIN: "demo.firebaseapp.com",
                FIREBASE_PROJECT_ID: "demo-project",
                FIREBASE_STORAGE_BUCKET: "demo-project.appspot.com",
                FIREBASE_MESSAGING_SENDER_ID: "123456789012",
                FIREBASE_APP_ID: "1:123456789012:web:demo",
                FIREBASE_DATABASE_URL: "https://demo-project-default-rtdb.firebaseio.com/"
            };
            return this.config;
        }
    }

    async initializeFirebase() {
        if (this.isInitialized) {
            console.log('🔥 Firebase already initialized');
            return;
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

        // Load config if not already loaded
        if (!this.config) {
            await this.loadConfig();
        }

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

        this.isInitialized = true;
    }
}

// Create global instance
window.firebaseConfigManager = new FirebaseConfigManager();

// API Base URL
window.API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : window.location.origin + '/api';

// Initialize Firebase when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.firebaseConfigManager.initializeFirebase();
        console.log('✅ Firebase services ready');
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
    }
});
