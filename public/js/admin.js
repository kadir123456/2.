// Admin Panel Management
class AdminManager {
    constructor() {
        this.currentSection = 'overview';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAdminData();
    }

    setupEventListeners() {
        // Admin navigation
        document.querySelectorAll('.nav-item[data-section]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.showAdminSection(section);
            });
        });

        // Announcement form
        const announcementForm = document.getElementById('announcement-form');
        if (announcementForm) {
            announcementForm.addEventListener('submit', (e) => this.handleAnnouncement(e));
        }
    }

    showAdminSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-item[data-section]').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`)?.classList.add('active');

        // Show section
        document.querySelectorAll('.admin-section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(`admin-${section}`)?.classList.add('active');

        this.currentSection = section;

        // Load section data
        switch (section) {
            case 'overview':
                this.loadOverviewData();
                break;
            case 'users':
                this.loadUsersData();
                break;
            case 'payments':
                this.loadPaymentsData();
                break;
            case 'announcements':
                // Already loaded
                break;
            case 'settings':
                this.loadSystemSettings();
                break;
        }
    }

    async loadAdminData() {
        if (!authManager.isAuthenticated()) return;

        try {
            // Load admin stats
            const response = await fetch(`${API_BASE_URL}/admin/stats`, {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.updateAdminStatsUI(data);
            }

            // Load initial overview data
            this.loadOverviewData();

        } catch (error) {
            console.error('Admin data load error:', error);
            showNotification('Admin verileri yüklenemedi', 'error');
        }
    }

    updateAdminStatsUI(data) {
        // Update stat cards
        document.getElementById('admin-total-users').textContent = data.totalUsers || '0';
        document.getElementById('admin-active-subs').textContent = data.activeSubscriptions || '0';
        document.getElementById('admin-monthly-revenue').textContent = `$${data.monthlyRevenue || '0'}`;
        
        // Update trends
        document.getElementById('admin-users-trend').textContent = `+${data.newUsersThisMonth || '0'}`;
        document.getElementById('admin-active-trend').textContent = `+${data.newSubscriptionsThisMonth || '0'}`;
        document.getElementById('admin-revenue-trend').textContent = `+$${data.revenueGrowth || '0'}`;
    }

    async loadOverviewData() {
        try {
            // Load recent users
            const usersResponse = await fetch(`${API_BASE_URL}/admin/users?limit=5`, {
                headers: authManager.getAuthHeaders()
            });

            if (usersResponse.ok) {
                const usersData = await usersResponse.json();
                this.updateRecentUsersUI(usersData.users);
            }

            // Load recent payments
            const paymentsResponse = await fetch(`${API_BASE_URL}/admin/payments?limit=5`, {
                headers: authManager.getAuthHeaders()
            });

            if (paymentsResponse.ok) {
                const paymentsData = await paymentsResponse.json();
                this.updateRecentPaymentsUI(paymentsData);
            }

        } catch (error) {
            console.error('Overview data load error:', error);
        }
    }

    updateRecentUsersUI(users) {
        const container = document.getElementById('recent-users');
        if (!container) return;

        if (users.length === 0) {
            container.innerHTML = '<div class="loading">Henüz kullanıcı yok</div>';
            return;
        }

        container.innerHTML = users.map(user => `
            <div class="user-item">
                <div class="user-info">
                    <div class="user-avatar">${this.getUserInitials(user.fullName)}</div>
                    <div class="user-details">
                        <h4>${user.fullName}</h4>
                        <p>${user.email}</p>
                    </div>
                </div>
                <div class="user-status">
                    <span class="badge ${user.isActive ? 'active' : 'expired'}">
                        ${user.subscriptionStatus === 'trial' ? 'Deneme' : 
                          user.subscriptionStatus === 'active' ? 'Aktif' : 'Süresi Dolmuş'}
                    </span>
                    <small>${user.daysRemaining} gün kaldı</small>
                </div>
                <div class="user-actions">
                    <button class="btn btn-small" onclick="adminManager.grantSubscription('${user.uid}', 30)">
                        30 Gün Ver
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateRecentPaymentsUI(payments) {
        const container = document.getElementById('recent-payments');
        if (!container) return;

        if (payments.length === 0) {
            container.innerHTML = '<div class="loading">Henüz ödeme bildirimi yok</div>';
            return;
        }

        container.innerHTML = payments.map(payment => `
            <div class="payment-item">
                <div class="payment-info">
                    <h4>${payment.userEmail}</h4>
                    <p>TX: ${payment.txHash?.substring(0, 20)}...</p>
                </div>
                <div class="payment-amount">
                    <span class="amount">$${payment.amount} USDT</span>
                    <span class="badge ${payment.status}">${this.getPaymentStatusText(payment.status)}</span>
                </div>
                <div class="payment-actions">
                    ${payment.status === 'pending' ? `
                        <button class="btn btn-small btn-success" onclick="adminManager.approvePayment('${payment.id}')">
                            Onayla
                        </button>
                        <button class="btn btn-small btn-danger" onclick="adminManager.rejectPayment('${payment.id}')">
                            Reddet
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    async loadUsersData() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.updateUsersTableUI(data.users);
            }
        } catch (error) {
            console.error('Users data load error:', error);
        }
    }

    updateUsersTableUI(users) {
        const container = document.getElementById('all-users');
        if (!container) return;

        if (users.length === 0) {
            container.innerHTML = '<div class="loading">Kullanıcı bulunamadı</div>';
            return;
        }

        container.innerHTML = `
            <div class="users-table-header">
                <div>Kullanıcı</div>
                <div>Abonelik</div>
                <div>Bot Durumu</div>
                <div>İşlemler</div>
                <div>İşlemler</div>
            </div>
            ${users.map(user => `
                <div class="users-table-row">
                    <div class="user-info">
                        <div class="user-avatar">${this.getUserInitials(user.fullName)}</div>
                        <div class="user-details">
                            <h4>${user.fullName}</h4>
                            <p>${user.email}</p>
                            <small>Kayıt: ${new Date(user.createdAt).toLocaleDateString('tr-TR')}</small>
                        </div>
                    </div>
                    <div class="subscription-info">
                        <span class="badge ${user.isActive ? 'active' : 'expired'}">
                            ${user.subscriptionStatus === 'trial' ? 'Deneme' : 
                              user.subscriptionStatus === 'active' ? 'Aktif' : 'Süresi Dolmuş'}
                        </span>
                        <small>${user.daysRemaining} gün kaldı</small>
                    </div>
                    <div class="bot-info">
                        <span class="status-indicator ${user.botActive ? 'active' : 'offline'}">
                            ${user.botActive ? 'Çalışıyor' : 'Durdu'}
                        </span>
                    </div>
                    <div class="trading-stats">
                        <div>İşlem: ${user.totalTrades}</div>
                        <div class="${user.totalProfit >= 0 ? 'positive' : 'negative'}">
                            P&L: $${user.totalProfit?.toFixed(2) || '0.00'}
                        </div>
                    </div>
                    <div class="user-actions">
                        <button class="btn btn-small" onclick="adminManager.grantSubscription('${user.uid}', 30)">
                            30 Gün Ver
                        </button>
                        <button class="btn btn-small btn-outline" onclick="adminManager.toggleUserStatus('${user.uid}', ${user.blocked || false})">
                            ${user.blocked ? 'Engeli Kaldır' : 'Engelle'}
                        </button>
                    </div>
                </div>
            `).join('')}
        `;
    }

    async loadPaymentsData() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/payments`, {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                const payments = await response.json();
                this.updatePaymentsTableUI(payments);
            }
        } catch (error) {
            console.error('Payments data load error:', error);
        }
    }

    updatePaymentsTableUI(payments) {
        const container = document.getElementById('all-payments');
        if (!container) return;

        if (payments.length === 0) {
            container.innerHTML = '<div class="loading">Ödeme bildirimi bulunamadı</div>';
            return;
        }

        container.innerHTML = `
            <div class="payments-table-header">
                <div>Kullanıcı</div>
                <div>Miktar</div>
                <div>TX Hash</div>
                <div>Durum</div>
                <div>Tarih</div>
                <div>İşlemler</div>
            </div>
            ${payments.map(payment => `
                <div class="payments-table-row">
                    <div>${payment.userEmail}</div>
                    <div class="payment-amount">$${payment.amount} USDT</div>
                    <div class="tx-hash">
                        <span title="${payment.txHash}">${payment.txHash?.substring(0, 15)}...</span>
                        <button class="btn btn-small" onclick="copyToClipboard('${payment.txHash}')">📋</button>
                    </div>
                    <div>
                        <span class="badge ${payment.status}">${this.getPaymentStatusText(payment.status)}</span>
                    </div>
                    <div>${new Date(payment.reportedAt).toLocaleDateString('tr-TR')}</div>
                    <div class="payment-actions">
                        ${payment.status === 'pending' ? `
                            <button class="btn btn-small btn-success" onclick="adminManager.approvePayment('${payment.id}')">
                                Onayla
                            </button>
                            <button class="btn btn-small btn-danger" onclick="adminManager.rejectPayment('${payment.id}')">
                                Reddet
                            </button>
                        ` : `
                            <button class="btn btn-small btn-outline" onclick="adminManager.viewPaymentDetails('${payment.id}')">
                                Detay
                            </button>
                        `}
                    </div>
                </div>
            `).join('')}
        `;
    }

    async handleAnnouncement(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');

        this.setButtonLoading(submitBtn, true);

        try {
            const response = await fetch(`${API_BASE_URL}/admin/announcement`, {
                method: 'POST',
                headers: authManager.getAuthHeaders(),
                body: JSON.stringify({
                    message: formData.get('message')
                })
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('Duyuru başarıyla yayınlandı!', 'success');
                form.reset();
            } else {
                throw new Error(data.error || 'Duyuru yayınlanamadı');
            }
        } catch (error) {
            console.error('Announcement error:', error);
            showNotification(error.message, 'error');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    async grantSubscription(userId, days) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/grant-subscription`, {
                method: 'POST',
                headers: authManager.getAuthHeaders(),
                body: JSON.stringify({
                    userId,
                    days
                })
            });

            const data = await response.json();

            if (response.ok) {
                showNotification(`${days} günlük abonelik başarıyla verildi!`, 'success');
                this.loadOverviewData(); // Refresh data
            } else {
                throw new Error(data.error || 'Abonelik verilemedi');
            }
        } catch (error) {
            console.error('Grant subscription error:', error);
            showNotification(error.message, 'error');
        }
    }

    async toggleUserStatus(userId, currentlyBlocked) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/toggle-user-status`, {
                method: 'POST',
                headers: authManager.getAuthHeaders(),
                body: JSON.stringify({
                    userId,
                    blocked: !currentlyBlocked
                })
            });

            const data = await response.json();

            if (response.ok) {
                const action = currentlyBlocked ? 'engeli kaldırıldı' : 'engellendi';
                showNotification(`Kullanıcı ${action}!`, 'success');
                this.loadUsersData(); // Refresh data
            } else {
                throw new Error(data.error || 'Kullanıcı durumu değiştirilemedi');
            }
        } catch (error) {
            console.error('Toggle user status error:', error);
            showNotification(error.message, 'error');
        }
    }

    async approvePayment(paymentId) {
        // This would be implemented with actual payment approval logic
        showNotification('Ödeme onaylandı! (Demo)', 'success');
        this.loadPaymentsData();
    }

    async rejectPayment(paymentId) {
        // This would be implemented with actual payment rejection logic
        showNotification('Ödeme reddedildi! (Demo)', 'info');
        this.loadPaymentsData();
    }

    viewPaymentDetails(paymentId) {
        // This would show payment details in a modal
        showNotification('Ödeme detayları (Demo)', 'info');
    }

    getUserInitials(name) {
        if (!name) return 'U';
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    getPaymentStatusText(status) {
        const statusMap = {
            'pending': 'Bekliyor',
            'approved': 'Onaylandı',
            'rejected': 'Reddedildi',
            'completed': 'Tamamlandı'
        };
        return statusMap[status] || status;
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
}

// Initialize admin manager
let adminManager;

// Global admin functions
function showAdminSection(section) {
    if (!adminManager) {
        adminManager = new AdminManager();
    }
    adminManager.showAdminSection(section);
}