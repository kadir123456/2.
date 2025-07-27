// Dashboard Management
class DashboardManager {
    constructor() {
        this.performanceChart = null;
        this.refreshInterval = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSystemInfo();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.getAttribute('data-page');
                this.navigateToPage(page);
            });
        });

        // Bot control buttons
        const startBotBtn = document.getElementById('start-bot-btn');
        const stopBotBtn = document.getElementById('stop-bot-btn');
        
        if (startBotBtn) {
            startBotBtn.addEventListener('click', () => this.startBot());
        }
        
        if (stopBotBtn) {
            stopBotBtn.addEventListener('click', () => this.stopBot());
        }

        // Settings forms
        this.setupSettingsForms();

        // Chart controls
        document.querySelectorAll('.chart-controls .btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.updateChartPeriod(btn.getAttribute('data-period'));
            });
        });
    }

    setupSettingsForms() {
        // API form
        const apiForm = document.getElementById('api-form');
        if (apiForm) {
            apiForm.addEventListener('submit', (e) => this.handleApiSettings(e));
        }

        // Trading form
        const tradingForm = document.getElementById('trading-form');
        if (tradingForm) {
            tradingForm.addEventListener('submit', (e) => this.handleTradingSettings(e));
        }

        // Payment report form
        const paymentForm = document.getElementById('payment-report-form');
        if (paymentForm) {
            paymentForm.addEventListener('submit', (e) => this.handlePaymentReport(e));
        }
    }

    navigateToPage(page) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');

        // Show appropriate page
        switch (page) {
            case 'dashboard':
                this.showDashboard();
                break;
            case 'settings':
                showPage('settings-page');
                break;
            case 'subscription':
                showPage('subscription-page');
                this.loadSubscriptionData();
                break;
            case 'history':
                this.showTradingHistory();
                break;
            case 'profile':
                this.showProfile();
                break;
        }
    }

    showDashboard() {
        showPage('dashboard-page');
        this.loadDashboardData();
    }

    async loadDashboardData() {
        if (!authManager.isAuthenticated()) return;

        try {
            // Load user dashboard data
            const response = await fetch(`${API_BASE_URL}/user/dashboard`, {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.updateDashboardUI(data);
            }

            // Load bot status
            await this.loadBotStatus();
            
            // Load subscription status
            await this.loadSubscriptionStatus();

        } catch (error) {
            console.error('Dashboard load error:', error);
        }
    }

    updateDashboardUI(data) {
        // Update stats
        if (data.stats) {
            document.getElementById('total-profit').textContent = 
                `$${data.stats.totalProfit?.toFixed(2) || '0.00'}`;
            document.getElementById('total-trades').textContent = 
                data.stats.totalTrades || '0';
            document.getElementById('win-rate').textContent = 
                `${data.stats.winRate?.toFixed(1) || '0.0'}%`;
        }

        // Update recent trades
        if (data.recentTrades) {
            this.updateRecentTrades(data.recentTrades);
        }

        // Initialize performance chart
        this.initializePerformanceChart();
    }

    async loadBotStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/bot/status`, {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.updateBotStatusUI(data);
            }
        } catch (error) {
            console.error('Bot status load error:', error);
        }
    }

    updateBotStatusUI(data) {
        const statusIndicator = document.getElementById('bot-status-indicator');
        const currentStatus = document.getElementById('bot-current-status');
        const startBtn = document.getElementById('start-bot-btn');
        const stopBtn = document.getElementById('stop-bot-btn');
        const uptimeEl = document.getElementById('bot-uptime');

        if (data.isActive) {
            statusIndicator?.classList.add('active');
            statusIndicator.textContent = 'Aktif';
            
            currentStatus?.querySelector('.status-dot')?.classList.add('active');
            currentStatus?.querySelector('.status-dot')?.classList.remove('offline');
            currentStatus?.querySelector('span').textContent = 'Bot Çalışıyor';
            
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-flex';
            
            if (uptimeEl) uptimeEl.textContent = 'Online';
        } else {
            statusIndicator?.classList.remove('active');
            statusIndicator.textContent = 'Durdu';
            
            currentStatus?.querySelector('.status-dot')?.classList.remove('active');
            currentStatus?.querySelector('.status-dot')?.classList.add('offline');
            currentStatus?.querySelector('span').textContent = 'Bot Durdu';
            
            startBtn.style.display = 'inline-flex';
            stopBtn.style.display = 'none';
            
            if (uptimeEl) uptimeEl.textContent = 'Offline';
        }
    }

    async loadSubscriptionStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/subscription`, {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.updateSubscriptionUI(data);
            }
        } catch (error) {
            console.error('Subscription status load error:', error);
        }
    }

    updateSubscriptionUI(data) {
        const subscriptionStatus = document.getElementById('subscription-status');
        
        if (subscriptionStatus) {
            let statusText = '';
            let statusClass = '';
            
            if (data.subscriptionStatus === 'trial') {
                statusText = `Deneme (${data.daysRemaining} gün kaldı)`;
                statusClass = 'trial';
            } else if (data.subscriptionStatus === 'active') {
                statusText = `Pro Plan (${data.daysRemaining} gün kaldı)`;
                statusClass = 'active';
            } else {
                statusText = 'Süresi Dolmuş';
                statusClass = 'expired';
            }
            
            subscriptionStatus.innerHTML = `
                <span class="badge-text">${statusText}</span>
                <span class="badge-status ${statusClass}"></span>
            `;
        }
    }

    async loadSystemInfo() {
        try {
            const response = await fetch(`${API_BASE_URL}/bot/system-info`, {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.updateSystemInfoUI(data);
            }
        } catch (error) {
            console.error('System info load error:', error);
        }
    }

    updateSystemInfoUI(data) {
        // Update IP addresses
        const ipContainer = document.getElementById('ip-addresses');
        if (ipContainer && data.ipAddresses) {
            ipContainer.innerHTML = data.ipAddresses.map(ip => `
                <div class="ip-item">
                    <span>${ip}</span>
                    <button class="btn btn-outline btn-small" onclick="copyToClipboard('${ip}')">
                        📋
                    </button>
                </div>
            `).join('');
        }

        // Update TRC20 address
        const trc20Elements = document.querySelectorAll('#trc20-address, #payment-trc20-address');
        trc20Elements.forEach(el => {
            if (data.trc20Address) {
                el.textContent = data.trc20Address;
            }
        });

        // Show announcement if exists
        if (data.announcement) {
            this.showAnnouncement(data.announcement);
        }
    }

    showAnnouncement(message) {
        const announcementCard = document.getElementById('system-announcement');
        const announcementText = document.getElementById('announcement-text');
        
        if (announcementCard && announcementText) {
            announcementText.textContent = message;
            announcementCard.style.display = 'flex';
        }
    }

    async startBot() {
        if (!authManager.isAuthenticated()) return;

        const startBtn = document.getElementById('start-bot-btn');
        this.setButtonLoading(startBtn, true);

        try {
            const response = await fetch(`${API_BASE_URL}/bot/start`, {
                method: 'POST',
                headers: authManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('Bot başarıyla başlatıldı!', 'success');
                await this.loadBotStatus();
                // Start real-time updates
                this.startRealTimeUpdates();
            } else {
                if (data.needsPayment) {
                    showNotification('Aboneliğiniz sona ermiş. Lütfen ödeme yapın.', 'warning');
                    // Redirect to subscription page
                    setTimeout(() => {
                        this.navigateToPage('subscription');
                    }, 2000);
                } else {
                    throw new Error(data.error || 'Bot başlatılamadı');
                }
            }
        } catch (error) {
            console.error('Start bot error:', error);
            showNotification(error.message, 'error');
        } finally {
            this.setButtonLoading(startBtn, false);
        }
    }

    startRealTimeUpdates() {
        // Update every 5 seconds when bot is active
        if (this.realTimeInterval) {
            clearInterval(this.realTimeInterval);
        }
        
        this.realTimeInterval = setInterval(async () => {
            if (document.getElementById('dashboard-page')?.classList.contains('active')) {
                await this.loadBotStatus();
                await this.updateMarketData();
            }
        }, 5000);
    }

    async updateMarketData() {
        try {
            // Get current symbol from settings or default to BTCUSDT
            const symbol = 'BTCUSDT'; // This should come from user settings
            
            const response = await fetch(`${API_BASE_URL}/bot/market-data/${symbol}`, {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                const marketData = await response.json();
                this.updateMarketDataUI(marketData);
            }
        } catch (error) {
            console.error('Market data update error:', error);
        }
    }

    updateMarketDataUI(marketData) {
        // Update current price display
        const priceElements = document.querySelectorAll('.current-price');
        priceElements.forEach(el => {
            el.textContent = `$${marketData.price.toFixed(2)}`;
        });

        // Update 24h change
        const changeElements = document.querySelectorAll('.price-change');
        changeElements.forEach(el => {
            const changeClass = marketData.change24h >= 0 ? 'positive' : 'negative';
            el.className = `price-change ${changeClass}`;
            el.textContent = `${marketData.change24h >= 0 ? '+' : ''}${marketData.change24h.toFixed(2)}%`;
        });
    }
    async stopBot() {
        if (!authManager.isAuthenticated()) return;

        const stopBtn = document.getElementById('stop-bot-btn');
        this.setButtonLoading(stopBtn, true);

        try {
            const response = await fetch(`${API_BASE_URL}/bot/stop`, {
                method: 'POST',
                headers: authManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('Bot başarıyla durduruldu!', 'success');
                await this.loadBotStatus();
            } else {
                throw new Error(data.error || 'Bot durdurulamadı');
            }
        } catch (error) {
            console.error('Stop bot error:', error);
            showNotification(error.message, 'error');
        } finally {
            this.setButtonLoading(stopBtn, false);
        }
    }

    async handleApiSettings(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');

        this.setButtonLoading(submitBtn, true);

        try {
            const response = await fetch(`${API_BASE_URL}/bot/api-keys`, {
                method: 'POST',
                headers: authManager.getAuthHeaders(),
                body: JSON.stringify({
                    apiKey: formData.get('apiKey'),
                    secretKey: formData.get('secretKey')
                })
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('API ayarları başarıyla kaydedildi!', 'success');
                form.reset();
                
                // Update API status
                const apiStatus = document.getElementById('api-status');
                if (apiStatus) {
                    apiStatus.textContent = 'Yapılandırıldı';
                    apiStatus.className = 'api-status connected';
                }
            } else {
                throw new Error(data.error || 'API ayarları kaydedilemedi');
            }
        } catch (error) {
            console.error('API settings error:', error);
            showNotification(error.message, 'error');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    async handleTradingSettings(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');

        this.setButtonLoading(submitBtn, true);

        try {
            const settings = {
                leverage: parseInt(formData.get('leverage')),
                symbol: formData.get('symbol'),
                orderSize: parseFloat(formData.get('orderSize')),
                stopLoss: parseFloat(formData.get('stopLoss')),
                takeProfit: parseFloat(formData.get('takeProfit')),
                timeframe: formData.get('timeframe')
            };

            const response = await fetch(`${API_BASE_URL}/bot/settings`, {
                method: 'PUT',
                headers: authManager.getAuthHeaders(),
                body: JSON.stringify(settings)
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('Trading ayarları başarıyla kaydedildi!', 'success');
            } else {
                throw new Error(data.error || 'Trading ayarları kaydedilemedi');
            }
        } catch (error) {
            console.error('Trading settings error:', error);
            showNotification(error.message, 'error');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    async handlePaymentReport(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');

        this.setButtonLoading(submitBtn, true);

        try {
            const response = await fetch(`${API_BASE_URL}/user/report-payment`, {
                method: 'POST',
                headers: authManager.getAuthHeaders(),
                body: JSON.stringify({
                    txHash: formData.get('txHash'),
                    amount: parseFloat(formData.get('amount'))
                })
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('Ödeme bildirimi başarıyla gönderildi! Admin onayından sonra aboneliğiniz aktif olacak.', 'success');
                form.reset();
            } else {
                throw new Error(data.error || 'Ödeme bildirimi gönderilemedi');
            }
        } catch (error) {
            console.error('Payment report error:', error);
            showNotification(error.message, 'error');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    async loadSubscriptionData() {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/subscription`, {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.updateSubscriptionPageUI(data);
            }
        } catch (error) {
            console.error('Subscription data load error:', error);
        }
    }

    updateSubscriptionPageUI(data) {
        const statusBadge = document.getElementById('subscription-status-badge');
        const subscriptionDetails = document.getElementById('subscription-details');

        if (statusBadge && subscriptionDetails) {
            let statusText = '';
            let statusClass = '';
            let detailsHTML = '';

            if (data.subscriptionStatus === 'trial') {
                statusText = 'Ücretsiz Deneme';
                statusClass = 'trial';
                detailsHTML = `
                    <div class="subscription-info">
                        <p><strong>Durum:</strong> Ücretsiz deneme aktif</p>
                        <p><strong>Kalan Süre:</strong> ${data.daysRemaining} gün</p>
                        <p><strong>Bitiş Tarihi:</strong> ${new Date(data.trialEndDate).toLocaleDateString('tr-TR')}</p>
                    </div>
                `;
            } else if (data.subscriptionStatus === 'active') {
                statusText = 'Pro Plan Aktif';
                statusClass = 'active';
                detailsHTML = `
                    <div class="subscription-info">
                        <p><strong>Durum:</strong> Pro plan aktif</p>
                        <p><strong>Kalan Süre:</strong> ${data.daysRemaining} gün</p>
                        <p><strong>Yenileme Tarihi:</strong> ${new Date(data.subscriptionEndDate).toLocaleDateString('tr-TR')}</p>
                    </div>
                `;
            } else {
                statusText = 'Süresi Dolmuş';
                statusClass = 'expired';
                detailsHTML = `
                    <div class="subscription-info">
                        <p><strong>Durum:</strong> Abonelik süresi dolmuş</p>
                        <p>Bot çalışması için aboneliğinizi yenileyin.</p>
                    </div>
                `;
            }

            statusBadge.textContent = statusText;
            statusBadge.className = `status-badge ${statusClass}`;
            subscriptionDetails.innerHTML = detailsHTML;
        }
    }

    initializePerformanceChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.performanceChart) {
            this.performanceChart.destroy();
        }

        // Mock data for demo
        const mockData = {
            labels: ['1 Hafta Önce', '6 Gün Önce', '5 Gün Önce', '4 Gün Önce', '3 Gün Önce', '2 Gün Önce', 'Dün', 'Bugün'],
            datasets: [{
                label: 'Portföy Değeri (USDT)',
                data: [1000, 1025, 1010, 1045, 1062, 1080, 1095, 1120],
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true
            }]
        };

        this.performanceChart = new Chart(ctx, {
            type: 'line',
            data: mockData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 4,
                        hoverRadius: 6
                    }
                }
            }
        });
    }

    updateRecentTrades(trades) {
        const container = document.getElementById('recent-trades');
        if (!container) return;

        if (trades.length === 0) {
            container.innerHTML = `
                <div class="activity-item">
                    <div class="activity-icon">📊</div>
                    <div class="activity-content">
                        <p>Henüz işlem yapılmadı</p>
                        <small>Bot başlatıldığında işlemler burada görünecek</small>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = trades.map(trade => `
            <div class="activity-item">
                <div class="activity-icon">${trade.side === 'BUY' ? '📈' : '📉'}</div>
                <div class="activity-content">
                    <p>${trade.symbol} - ${trade.side} ${trade.quantity}</p>
                    <small>${new Date(trade.timestamp).toLocaleString('tr-TR')}</small>
                </div>
                <div class="activity-pnl ${trade.pnl > 0 ? 'positive' : 'negative'}">
                    ${trade.pnl > 0 ? '+' : ''}$${trade.pnl?.toFixed(2) || '0.00'}
                </div>
            </div>
        `).join('');
    }

    updateChartPeriod(period) {
        // Update active button
        document.querySelectorAll('.chart-controls .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`)?.classList.add('active');

        // Update chart data based on period
        // This would fetch new data from API in real implementation
        console.log('Updating chart for period:', period);
    }

    startAutoRefresh() {
        // Refresh dashboard data every 30 seconds
        this.refreshInterval = setInterval(() => {
            if (document.getElementById('dashboard-page')?.classList.contains('active')) {
                this.loadDashboardData();
            }
        }, 30000);
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

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        if (this.performanceChart) {
            this.performanceChart.destroy();
        }
    }
}

// Initialize dashboard manager
const dashboardManager = new DashboardManager();