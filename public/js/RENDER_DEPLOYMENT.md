# 🚀 Render.com Deployment Rehberi

## 📋 Render.com Environment Variables

Render Dashboard → Environment Variables → Add Environment Variable:

```bash
# Firebase Configuration (Kritik!)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"ezyago-trading-bot","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xyz@ezyago-trading-bot.iam.gserviceaccount.com","client_id":"123456789012345678901","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/v1/metadata/x509/firebase-adminsdk-xyz%40ezyago-trading-bot.iam.gserviceaccount.com"}

FIREBASE_DATABASE_URL=https://ezyago-trading-bot-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID=ezyago-trading-bot

# Firebase Web Config (Frontend)
FIREBASE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FIREBASE_AUTH_DOMAIN=ezyago-trading-bot.firebaseapp.com
FIREBASE_STORAGE_BUCKET=ezyago-trading-bot.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abcdef123456789012345

# Güvenlik Keys
JWT_SECRET_KEY=ezyago-jwt-secret-key-production-2024-very-secure
ENCRYPTION_KEY=ezyago-32-character-encryption-key-2024
SECRET_KEY=ezyago-app-secret-key-production-secure

# Admin Bilgileri
ADMIN_EMAIL=admin@ezyago.com
ADMIN_PASSWORD=EzyAgo2024!SecureAdmin

# Ödeme Sistemi
TRC20_WALLET_ADDRESS=TQn9Y2khEsLMWD2YhUKevqEdnMdFGe9ctr
SUBSCRIPTION_PRICE_USDT=15.0

# Binance IP Adresleri
BINANCE_IP_ADDRESSES=44.195.202.137,44.195.202.138,44.195.202.139

# Sistem Ayarları
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-app-name.onrender.com
SYSTEM_ANNOUNCEMENT=EzyAgo Trading Bot sistemine hoş geldiniz!
TRIAL_DAYS=7
DEFAULT_LEVERAGE=10
DEFAULT_ORDER_SIZE_USDT=25.0
```

## 🔧 Render.com Build Settings

```
Name: ezyago-trading-bot
Environment: Node
Region: Frankfurt
Branch: main
Build Command: npm install
Start Command: npm start
```

## 🔥 Firebase Web Config

`public/js/firebase-config.js` dosyasında gerçek Firebase config'inizi kullanın:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    authDomain: "ezyago-trading-bot.firebaseapp.com",
    projectId: "ezyago-trading-bot",
    storageBucket: "ezyago-trading-bot.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789012345",
    databaseURL: "https://ezyago-trading-bot-default-rtdb.firebaseio.com/"
};
```

## ✅ Deployment Checklist

- [ ] Firebase projesi oluşturuldu
- [ ] Environment variables ayarlandı
- [ ] Firebase config güncellendi
- [ ] Repository push edildi
- [ ] Render'da deploy edildi
- [ ] Site test edildi
