// Firebase Configuration from Environment Variables
const firebaseConfig = {
    apiKey: window.ENV?.FIREBASE_API_KEY || "demo-api-key",
    authDomain: window.ENV?.FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
    projectId: window.ENV?.FIREBASE_PROJECT_ID || "demo-project",
    storageBucket: window.ENV?.FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
    messagingSenderId: window.ENV?.FIREBASE_MESSAGING_SENDER_ID || "123456789012",
    appId: window.ENV?.FIREBASE_APP_ID || "1:123456789012:web:demo",
    databaseURL: window.ENV?.FIREBASE_DATABASE_URL || "https://demo-project-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// API Base URL
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : window.location.origin + '/api';

console.log('🔥 Firebase initialized with environment config');
