# CryptoBot Pro - Otomatik Kripto Trading Platformu

Profesyonel kripto trading bot platformu. EMA crossover stratejisi ile 7/24 otomatik long/short pozisyonlar.

## 🚀 Özellikler

### 🤖 Otomatik Trading
- EMA (9,21) crossover stratejisi
- 7/24 otomatik long/short pozisyonlar
- WebSocket ile gerçek zamanlı veri
- Binance Futures API entegrasyonu

### 📊 Dashboard
- Gerçek zamanlı P&L takibi
- Performans grafikleri
- Açık pozisyonlar listesi
- Trading geçmişi

### ⚙️ Bot Ayarları
- 1x-25x leverage ayarları
- Position size kontrolü (min 25 USDT)
- Stop-loss ve take-profit
- Timeframe seçimi (5m, 15m, 30m)
- Coin çifti seçimi

### 💰 Abonelik Sistemi
- 7 gün ücretsiz deneme
- 15 USDT/ay abonelik
- TRC20 USDT ödemeleri
- Otomatik abonelik yönetimi

### 👨‍💼 Admin Paneli
- Kullanıcı yönetimi
- Ödeme onayları
- Sistem duyuruları
- İstatistikler ve raporlar

## 🛠️ Teknoloji Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Firebase** - Database ve authentication
- **node-binance-api** - Binance API entegrasyonu
- **WebSocket** - Gerçek zamanlı veri

### Frontend
- **Vanilla JavaScript** - Modern ES6+
- **Chart.js** - Performans grafikleri
- **CSS Grid/Flexbox** - Responsive layout
- **PWA** - Progressive Web App

### Güvenlik
- **AES-256** - API key şifreleme
- **JWT** - Token authentication
- **Firebase Auth** - Kullanıcı doğrulama
- **Rate Limiting** - API koruması

## 📦 Kurulum

### 1. Repository'yi klonlayın
```bash
git clone https://github.com/your-username/cryptobot-pro.git
cd cryptobot-pro
```

### 2. Dependencies'leri yükleyin
```bash
npm install
```

### 3. Environment variables'ları ayarlayın
```bash
cp .env.example .env
# .env dosyasını düzenleyin
```

### 4. Firebase projesini oluşturun
1. [Firebase Console](https://console.firebase.google.com)'da yeni proje oluşturun
2. Authentication'ı aktif edin (Email/Password)
3. Firestore Database oluşturun
4. Service Account key'ini indirin
5. `.env` dosyasına Firebase bilgilerini ekleyin

### 5. Uygulamayı başlatın
```bash
# Development
npm run dev

# Production
npm start
```

## 🌐 Render.com Deployment

### 1. Render.com hesabı oluşturun
[Render.com](https://render.com)'da hesap oluşturun

### 2. Web Service oluşturun
- Repository'yi bağlayın
- Build Command: `npm install`
- Start Command: `npm start`
- Environment: `Node`

### 3. Environment Variables'ları ekleyin
Render dashboard'da aşağıdaki environment variables'ları ekleyin:

```
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID=your-project-id
JWT_SECRET_KEY=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
ADMIN_EMAIL=admin@cryptobotpro.com
TRC20_WALLET_ADDRESS=TYourWalletAddress
BINANCE_IP_ADDRESSES=ip1,ip2,ip3
NODE_ENV=production
```

### 4. Deploy edin
Render otomatik olarak deploy edecek ve URL sağlayacak.

## 🔧 Konfigürasyon

### Binance API Ayarları
1. [Binance](https://binance.com) hesabınızda API key oluşturun
2. **Sadece Futures Trading** iznini verin
3. IP whitelist ekleyin (Render IP'leri)
4. Uygulama ayarlarından API key'leri girin

### Admin Hesabı
Admin hesabı environment variable'da belirtilen email ile otomatik oluşturulur:
```
ADMIN_EMAIL=admin@cryptobotpro.com
```

### Ödeme Sistemi
TRC20 USDT cüzdan adresini environment variable'da belirtin:
```
TRC20_WALLET_ADDRESS=TYourTRC20Address
```

## 📊 Trading Stratejisi

### EMA Crossover
- **EMA 9** ve **EMA 21** kullanılır
- **Long Signal**: EMA 9 > EMA 21 (yukarı kesişim)
- **Short Signal**: EMA 9 < EMA 21 (aşağı kesişim)

### Risk Yönetimi
- Otomatik stop-loss (%0.5-10)
- Otomatik take-profit (%1-20)
- Position size kontrolü
- Maximum drawdown koruması

## 🔒 Güvenlik

### API Güvenliği
- API key'ler AES-256 ile şifrelenir
- Rate limiting (100 req/15min)
- CORS koruması
- Input validation

### Kullanıcı Güvenliği
- Firebase Authentication
- JWT token'lar
- Şifre hashleme
- XSS koruması

## 📱 PWA Özellikleri

- Offline çalışma
- Ana ekrana ekleme
- Push notifications
- Background sync
- Responsive design

## 🐛 Hata Ayıklama

### Loglar
```bash
# Server logları
npm run dev

# Browser console
F12 -> Console
```

### Yaygın Sorunlar

**Firebase bağlantı hatası:**
- Service account key'ini kontrol edin
- Firebase project ID'yi doğrulayın

**Binance API hatası:**
- API key izinlerini kontrol edin
- IP whitelist'i güncelleyin
- Rate limit'e takılmış olabilirsiniz

**Bot başlamıyor:**
- Abonelik durumunu kontrol edin
- API key'lerin doğru girildiğinden emin olun

## 📈 Performans

### Optimizasyonlar
- WebSocket kullanımı (REST API yerine)
- Chart.js ile optimize grafikler
- Lazy loading
- Service Worker caching

### Monitoring
- Real-time bot status
- Trading performance metrics
- User activity tracking
- Error logging

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## ⚠️ Risk Uyarısı

**UYARI:** Kripto para trading'i yüksek risk içerir. Yatırım yapmadan önce:

- Risk toleransınızı değerlendirin
- Sadece kaybetmeyi göze alabileceğiniz miktarla işlem yapın
- Geçmiş performans gelecek sonuçları garanti etmez
- Bot'un her zaman kar etmeyebileceğini unutmayın

## 📞 Destek

- **Email:** support@cryptobotpro.com
- **Telegram:** @cryptobotpro
- **Discord:** CryptoBot Pro Community

## 🔄 Güncellemeler

### v1.0.0 (2024-01-15)
- İlk release
- EMA crossover stratejisi
- Firebase entegrasyonu
- Admin paneli
- PWA desteği

---

**CryptoBot Pro** - Profesyonel kripto trading deneyimi için tasarlandı.