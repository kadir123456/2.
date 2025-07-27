const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let firebaseApp;

try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });

  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();
const realtimeDb = admin.database();

module.exports = {
  admin,
  db,
  auth,
  realtimeDb,
  firebaseApp
};