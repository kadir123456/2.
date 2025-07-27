const express = require('express');
const { db, auth } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: fullName
    });

    // Create user document in Firestore
    const userData = {
      uid: userRecord.uid,
      email,
      fullName,
      subscriptionStatus: 'trial',
      trialStartDate: new Date().toISOString(),
      trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      createdAt: new Date().toISOString(),
      botSettings: {
        leverage: 10,
        symbol: 'BTCUSDT',
        orderSize: 25,
        stopLoss: 2,
        takeProfit: 4,
        timeframe: '5m',
        isActive: false
      },
      apiKeys: {
        binanceApiKey: '',
        binanceSecretKey: '',
        isConfigured: false
      },
      stats: {
        totalTrades: 0,
        totalProfit: 0,
        winRate: 0,
        currentBalance: 0
      }
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        uid: userRecord.uid,
        email,
        fullName,
        subscriptionStatus: 'trial'
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ 
      error: error.code === 'auth/email-already-exists' 
        ? 'Email already registered' 
        : 'Registration failed'
    });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
    // Remove sensitive data
    delete userData.apiKeys;
    
    res.json(userData);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { fullName } = req.body;
    
    if (!fullName) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    await db.collection('users').doc(req.user.uid).update({
      fullName,
      updatedAt: new Date().toISOString()
    });

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Check subscription status
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const now = new Date();
    
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

    res.json({
      subscriptionStatus: userData.subscriptionStatus,
      isActive,
      daysRemaining,
      trialEndDate: userData.trialEndDate,
      subscriptionEndDate: userData.subscriptionEndDate
    });
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({ error: 'Failed to check subscription' });
  }
});

module.exports = router;