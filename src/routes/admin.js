const express = require('express');
const { db } = require('../config/firebase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Get admin dashboard stats
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get total users
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;

    // Get active subscriptions
    let activeSubscriptions = 0;
    let trialUsers = 0;
    let expiredUsers = 0;
    const now = new Date();

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      
      if (userData.subscriptionStatus === 'trial') {
        const trialEnd = new Date(userData.trialEndDate);
        if (now < trialEnd) {
          trialUsers++;
        } else {
          expiredUsers++;
        }
      } else if (userData.subscriptionStatus === 'active') {
        const subscriptionEnd = new Date(userData.subscriptionEndDate);
        if (now < subscriptionEnd) {
          activeSubscriptions++;
        } else {
          expiredUsers++;
        }
      }
    });

    // Get total trades
    const tradesSnapshot = await db.collection('trades').get();
    const totalTrades = tradesSnapshot.size;

    // Calculate monthly revenue (mock calculation)
    const monthlyRevenue = activeSubscriptions * 15; // 15 USDT per subscription

    res.json({
      totalUsers,
      activeSubscriptions,
      trialUsers,
      expiredUsers,
      totalTrades,
      monthlyRevenue,
      systemStatus: 'online'
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// Get all users
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const usersSnapshot = await db.collection('users')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const users = [];
    const now = new Date();

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      
      // Calculate subscription status
      let isActive = false;
      let daysRemaining = 0;
      
      if (userData.subscriptionStatus === 'trial') {
        const trialEnd = new Date(userData.trialEndDate);
        isActive = now < trialEnd;
        daysRemaining = Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)));
      } else if (userData.subscriptionStatus === 'active') {
        const subscriptionEnd = new Date(userData.subscriptionEndDate);
        isActive = now < subscriptionEnd;
        daysRemaining = Math.max(0, Math.ceil((subscriptionEnd - now) / (1000 * 60 * 60 * 24)));
      }

      users.push({
        uid: doc.id,
        email: userData.email,
        fullName: userData.fullName,
        subscriptionStatus: userData.subscriptionStatus,
        isActive,
        daysRemaining,
        createdAt: userData.createdAt,
        botActive: userData.botSettings?.isActive || false,
        totalTrades: userData.stats?.totalTrades || 0,
        totalProfit: userData.stats?.totalProfit || 0
      });
    });

    res.json({
      users,
      page,
      limit,
      hasMore: users.length === limit
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Grant subscription to user
router.post('/grant-subscription', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, days } = req.body;

    if (!userId || !days || days < 1) {
      return res.status(400).json({ error: 'Valid user ID and days are required' });
    }

    const subscriptionEndDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    await db.collection('users').doc(userId).update({
      subscriptionStatus: 'active',
      subscriptionEndDate,
      updatedAt: new Date().toISOString()
    });

    res.json({ message: `${days} days subscription granted successfully` });
  } catch (error) {
    console.error('Grant subscription error:', error);
    res.status(500).json({ error: 'Failed to grant subscription' });
  }
});

// Update system announcement
router.post('/announcement', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Announcement message is required' });
    }

    await db.collection('system').doc('announcement').set({
      message,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.email
    });

    res.json({ message: 'Announcement updated successfully' });
  } catch (error) {
    console.error('Announcement update error:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// Get recent payments (mock data for now)
router.get('/payments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // This would typically fetch from a payments collection
    // For now, returning mock data
    const payments = [
      {
        id: '1',
        userId: 'user123',
        userEmail: 'user@example.com',
        amount: 15,
        currency: 'USDT',
        status: 'completed',
        txHash: '0x1234567890abcdef',
        createdAt: new Date().toISOString()
      }
    ];

    res.json(payments);
  } catch (error) {
    console.error('Admin payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Block/unblock user
router.post('/toggle-user-status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, blocked } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    await db.collection('users').doc(userId).update({
      blocked: blocked || false,
      updatedAt: new Date().toISOString()
    });

    res.json({ message: `User ${blocked ? 'blocked' : 'unblocked'} successfully` });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

module.exports = router;