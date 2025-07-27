# 🚀 EzyAgo Trading Bot - Production Deployment Rehberi

## 📋 Ön Gereksinimler

### 1. Firebase Projesi Oluşturma

1. **Firebase Console'a gidin:** https://console.firebase.google.com
2. **"Add project" butonuna tıklayın**
3. **Proje adı:** `ezyago-trading-bot`
4. **Google Analytics:** İsteğe bağlı (önerilir)
5. **Create project** butonuna tıklayın

### 2. Firebase Authentication Kurulumu

```
Firebase Console → Authentication → Get started → Sign-in method
→ Email/Password → Enable → Save
```

### 3. Firestore Database Kurulumu

```
Firebase Console → Firestore Database → Create database
→ Start in production mode → Next
→ Region: europe-west1 (Amsterdam) → Done
```

### 4. Firebase Web App Oluşturma

```
Firebase Console → Project Overview → Add app → Web (</>) 
→ App nickname: "EzyAgo Web App" → Register app
→ Firebase config bilgilerini kopyalayın
```

### 5. Service Account Key Oluşturma

```
Firebase Console → Project Settings → Service accounts
→ Generate new private key → Generate key
→ JSON dosyasını indirin ve içeriğini kopyalayın
```

## 🌐 Render.com Deployment

### 1. Render.com Hesabı

1. https://render.com adresine gidin
2. GitHub hesabınızla giriş yapın
3. Repository'yi Render'a bağlayın

### 2. Web Service Oluşturma

```
Render Dashboard → New → Web Service
→ Connect GitHub repository
→ Name: ezyago-trading-bot
→ Environment: Node
→ Region: Frankfurt
→ Branch: main
→ Build Command: npm install
→ Start Command: npm start
```

### 3. Environment Variables Ayarlama

**Render Dashboard → Environment Variables → Add Environment Variable**

```bash
# Firebase Configuration (Kritik!)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"ezyago-trading-bot","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xyz@ezyago-trading-bot.iam.gserviceaccount.com","client_id":"123456789012345678901","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/v1/metadata/x509/firebase-adminsdk-xyz%40ezyago-trading-bot.iam.gserviceaccount.com"}

FIREBASE_DATABASE_URL=https://ezyago-trading-bot-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID=ezyago-trading-bot

# Güvenlik Keys (Güçlü şifreler oluşturun!)
JWT_SECRET_KEY=ezyago-jwt-secret-key-production-2024-very-secure
ENCRYPTION_KEY=ezyago-32-character-encryption-key-2024
SECRET_KEY=ezyago-app-secret-key-production-secure

# Admin Bilgileri
ADMIN_EMAIL=admin@ezyago.com
ADMIN_PASSWORD=EzyAgo2024!SecureAdmin

# Ödeme Sistemi
TRC20_WALLET_ADDRESS=TQn9Y2khEsLMWD2YhUKevqEdnMdFGe9ctr
SUBSCRIPTION_PRICE_USDT=15.0

# Binance IP Adresleri (Render'dan alacağınız gerçek IP'ler)
BINANCE_IP_ADDRESSES=44.195.202.137,44.195.202.138,44.195.202.139

# Sistem Ayarları
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://ezyago-trading-bot.onrender.com
SYSTEM_ANNOUNCEMENT=EzyAgo Trading Bot sistemine hoş geldiniz! Bot aktif ve çalışıyor.
TRIAL_DAYS=7
DEFAULT_LEVERAGE=10
DEFAULT_ORDER_SIZE_USDT=25.0
```

### 4. Firebase Web Config Güncelleme

**public/js/firebase-config.js dosyasını güncelleyin:**

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", // Firebase'den alın
    authDomain: "ezyago-trading-bot.firebaseapp.com",
    projectId: "ezyago-trading-bot",
    storageBucket: "ezyago-trading-bot.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789012345",
    databaseURL: "https://ezyago-trading-bot-default-rtdb.firebaseio.com/"
};
```

## 🔧 Binance API Kurulumu

### 1. Binance Hesabı Ayarları

1. **Binance.com'da hesap oluşturun**
2. **API Management → Create API**
3. **API Key Name:** "EzyAgo Trading Bot"
4. **Restrictions:**
   - ✅ Enable Futures
   - ❌ Enable Spot & Margin Trading
   - ❌ Enable Withdrawals
5. **IP Restrictions:** Render IP adreslerini ekleyin

### 2. Render IP Adreslerini Alma

```bash
# Render'da deploy ettikten sonra:
curl https://ezyago-trading-bot.onrender.com/api/health
# Response'da IP bilgisi olacak

# Veya Render Dashboard → Settings → Environment → Outbound IPs
```

## 🧪 Test Süreci

### 1. Sistem Testleri

```bash
# Health check
curl https://ezyago-trading-bot.onrender.com/api/health

# Admin giriş testi
# https://ezyago-trading-bot.onrender.com → Login → admin@ezyago.com

# Kullanıcı kayıt testi
# Register → Test kullanıcısı oluştur → Bot ayarları → Test
```

### 2. Bot Testi

1. **Test kullanıcısı oluşturun**
2. **Binance Testnet API kullanın** (ilk testler için)
3. **Küçük miktarlarla gerçek test yapın**
4. **24 saat bot çalışmasını izleyin**

## 📊 Monitoring ve Bakım

### 1. Log Takibi

```bash
# Render Dashboard → Logs
# Firebase Console → Firestore → Collections
# Binance API → API Management → Usage
```

### 2. Performans Metrikleri

- **Bot Uptime:** >99%
- **API Response Time:** <500ms
- **WebSocket Connection:** Stable
- **User Satisfaction:** >90%

### 3. Backup Stratejisi

- **Firebase:** Otomatik backup aktif
- **Environment Variables:** Güvenli yerde sakla
- **Code:** GitHub repository backup

## ⚠️ Güvenlik Kontrol Listesi

- ✅ API Keys şifrelenmiş
- ✅ HTTPS zorunlu
- ✅ Rate limiting aktif
- ✅ Input validation
- ✅ CORS koruması
- ✅ XSS koruması
- ✅ JWT token güvenliği

## 🚨 Acil Durum Planı

### Bot Durdurma
```bash
# Admin Panel → Users → Stop All Bots
# Veya Environment Variable: MAINTENANCE_MODE=true
```

### Sistem Bakımı
```bash
# Render Dashboard → Manual Deploy → Deploy Latest Commit
# Firebase Console → Database → Export Data
```

## 📞 Destek İletişim

- **Email:** support@ezyago.com
- **Telegram:** @ezyago_support
- **Discord:** EzyAgo Community

---

## ✅ Deployment Checklist

- [ ] Firebase projesi oluşturuldu
- [ ] Authentication aktif
- [ ] Firestore database kuruldu
- [ ] Service account key alındı
- [ ] Render.com hesabı oluşturuldu
- [ ] Repository bağlandı
- [ ] Environment variables ayarlandı
- [ ] Firebase config güncellendi
- [ ] Binance API oluşturuldu
- [ ] IP whitelist ayarlandı
- [ ] Test kullanıcısı oluşturuldu
- [ ] Bot testi yapıldı
- [ ] Admin paneli test edildi
- [ ] Ödeme sistemi test edildi
- [ ] Mobile responsive kontrol edildi
- [ ] SSL sertifikası aktif
- [ ] Domain ayarlandı (opsiyonel)

**Deployment tamamlandıktan sonra sistem tamamen çalışır durumda olacak!**