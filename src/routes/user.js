const express = require('express');
const { db } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get user dashboard data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    // Get recent trades
    const tradesSnapshot = await db.collection('trades')
      .where('userId', '==', req.user.uid)
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    const recentTrades = [];
    tradesSnapshot.forEach(doc => {
      recentTrades.push({ id: doc.id, ...doc.data() });
    });

    // Get open positions (mock data for now)
    const openPositions = [
      {
        symbol: 'BTCUSDT',
        side: 'LONG',
        size: 0.001,
        entryPrice: 45000,
        currentPrice: 45500,
        pnl: 0.5,
        pnlPercent: 1.11
      }
    ];

    res.json({
      user: {
        fullName: userData.fullName,
        email: userData.email,
        subscriptionStatus: userData.subscriptionStatus
      },
      stats: userData.stats || {
        totalTrades: 0,
        totalProfit: 0,
        winRate: 0,
        currentBalance: 0
      },
      botSettings: userData.botSettings,
      recentTrades,
      openPositions
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Report payment
router.post('/report-payment', authenticateToken, async (req, res) => {
  try {
    const { txHash, amount, paymentMethod } = req.body;

    if (!txHash || !amount || amount < 15) {
      return res.status(400).json({ 
        error: 'Transaction hash and valid amount (minimum 15 USDT) are required' 
      });
    }

    // Validate transaction hash format (basic validation)
    if (txHash.length < 20) {
      return res.status(400).json({ error: 'Invalid transaction hash format' });
    }

    // Check if this transaction hash was already reported
    const existingPayment = await db.collection('payment_reports')
      .where('txHash', '==', txHash)
      .get();

    if (!existingPayment.empty) {
      return res.status(400).json({ error: 'This transaction has already been reported' });
    }

    // Create payment report
    const paymentReport = {
      userId: req.user.uid,
      userEmail: req.user.email,
      txHash,
      amount: parseFloat(amount),
      currency: paymentMethod || 'TRC20-USDT',
      status: 'pending',
      reportedAt: new Date().toISOString(),
      walletAddress: process.env.TRC20_WALLET_ADDRESS,
      expectedAmount: 15.0
    };

    const docRef = await db.collection('payment_reports').add(paymentReport);

    // Log the payment report
    await db.collection('activities').add({
      userId: req.user.uid,
      title: 'Payment Reported',
      description: `Payment of ${amount} USDT reported with TX: ${txHash.substring(0, 10)}...`,
      timestamp: new Date().toISOString(),
      type: 'info'
    });

    res.json({ 
      message: 'Payment reported successfully. Admin will verify and activate your subscription within 24 hours.',
      reportId: docRef.id,
      status: 'pending'
    });
  } catch (error) {
    console.error('Payment report error:', error);
    res.status(500).json({ error: 'Failed to report payment' });
  }
});

// Get payment history
router.get('/payment-history', authenticateToken, async (req, res) => {
  try {
    const paymentsSnapshot = await db.collection('payment_reports')
      .where('userId', '==', req.user.uid)
      .orderBy('reportedAt', 'desc')
      .get();

    const payments = [];
    paymentsSnapshot.forEach(doc => {
      const data = doc.data();
      payments.push({
        id: doc.id,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        txHash: data.txHash,
        reportedAt: data.reportedAt,
        processedAt: data.processedAt || null
      });
    });

    res.json({ payments });
  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Get user activities/notifications
router.get('/activities', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const activitiesSnapshot = await db.collection('activities')
      .where('userId', '==', req.user.uid)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const activities = [];
    activitiesSnapshot.forEach(doc => {
      activities.push({ id: doc.id, ...doc.data() });
    });

    res.json({ activities });
  } catch (error) {
    console.error('Activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

module.exports = router;