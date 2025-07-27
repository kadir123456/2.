// Firebase Configuration
const firebaseConfig = {
    // Production Firebase config - Bu değerler gerçek Firebase projenizden alınmalı
    apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    authDomain: "ezyago-trading-bot.firebaseapp.com",
    projectId: "ezyago-trading-bot",
    storageBucket: "ezyago-trading-bot.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789012345",
    databaseURL: "https://ezyago-trading-bot-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// API Base URL
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : window.location.origin + '/api';

console.log('🔥 Firebase initialized');