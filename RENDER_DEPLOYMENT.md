# 🚀 Render.com Deployment Rehberi - EzyAgo Trading Bot

## 📋 Environment Variables (Render.com Dashboard'da ekleyin)

### 🔥 Firebase Web Config
```bash
# Firebase Web Config (Gerçek değerlerinizi girin!)
FIREBASE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abcdef123456789012345
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
```

### 🔐 Firebase Service Account (Backend)
```bash
# Firebase Service Account Key (JSON formatında tek satırda)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}
```

### 🔑 Security Keys
```bash
JWT_SECRET_KEY=ezyago-jwt-secret-key-production-2024-very-secure
ENCRYPTION_KEY=ezyago-32-character-encryption-key-2024
SECRET_KEY=ezyago-app-secret-key-production-secure
```

### 👨‍💼 Admin Configuration
```bash
ADMIN_EMAIL=admin@ezyago.com
ADMIN_PASSWORD=EzyAgo2024!SecureAdmin
```

### 💰 Payment System
```bash
TRC20_WALLET_ADDRESS=TQn9Y2khEsLMWD2YhUKevqEdnMdFGe9ctr
SUBSCRIPTION_PRICE_USDT=15.0
```

### 🌐 Binance & System
```bash
BINANCE_IP_ADDRESSES=44.195.202.137,44.195.202.138,44.195.202.139
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
Region: Frankfurt (Europe)
Branch: main
Build Command: npm install
Start Command: npm start
```

## ✅ Deployment Checklist

### 1. Firebase Kurulumu
- [ ] Firebase projesi oluşturuldu
- [ ] Authentication aktif (Email/Password)
- [ ] Firestore Database kuruldu
- [ ] Service Account key alındı
- [ ] Firebase web config alındı

### 2. Render.com Kurulumu
- [ ] Repository GitHub'a push edildi
- [ ] Render.com hesabı oluşturuldu
- [ ] Web Service oluşturuldu
- [ ] Environment variables eklendi
- [ ] Build settings yapılandırıldı

### 3. Test Adımları
- [ ] Site açılıyor
- [ ] Firebase bağlantısı çalışıyor
- [ ] Kullanıcı kaydı yapılabiliyor
- [ ] Giriş yapılabiliyor
- [ ] Dashboard erişilebiliyor
- [ ] Admin paneli çalışıyor

## 🎯 Test Kullanıcıları

### Normal Kullanıcı
- Email: test@example.com
- Password: test123456

### Admin Kullanıcı
- Email: admin@ezyago.com
- Password: (Environment variable'da belirtilen)

## 🚨 Önemli Notlar

1. **Firebase API Key'leri gerçek olmalı** - Demo key'ler çalışmaz
2. **Service Account Key JSON formatında** olmalı
3. **TRC20 Wallet Address gerçek** olmalı
4. **IP Addresses Render'dan** alınmalı
5. **Environment variables tam** olmalı

## 🔍 Hata Ayıklama

### Firebase Bağlantı Hatası
```bash
# Console'da kontrol edin:
# - Firebase config yüklendi mi?
# - API key geçerli mi?
# - Project ID doğru mu?
```

### Auth Hatası
```bash
# Kontrol edin:
# - Firebase Authentication aktif mi?
# - Email/Password provider aktif mi?
# - Domain whitelist'te mi?
```

### Bot Çalışmıyor
```bash
# Kontrol edin:
# - Binance API key'leri doğru mu?
# - IP whitelist yapıldı mı?
# - Futures trading aktif mi?
```

## 📞 Destek

Sorun yaşarsanız:
1. Browser Console'u kontrol edin
2. Render Logs'u kontrol edin
3. Firebase Console'u kontrol edin
4. Environment variables'ları kontrol edin

---

**Deployment tamamlandıktan sonra sistem tamamen çalışır durumda olacak!** 🚀
