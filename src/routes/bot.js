const express = require('express');
const { db } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');
const BinanceBot = require('../services/BinanceBot');
const crypto = require('crypto');
const router = express.Router();

// Encryption functions
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here';

function encrypt(text) {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encryptedText) {
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Save API keys
router.post('/api-keys', authenticateToken, async (req, res) => {
  try {
    const { apiKey, secretKey } = req.body;

    if (!apiKey || !secretKey) {
      return res.status(400).json({ error: 'API key and secret key are required' });
    }

    // Encrypt API keys
    const encryptedApiKey = encrypt(apiKey);
    const encryptedSecretKey = encrypt(secretKey);

    await db.collection('users').doc(req.user.uid).update({
      'apiKeys.binanceApiKey': encryptedApiKey,
      'apiKeys.binanceSecretKey': encryptedSecretKey,
      'apiKeys.isConfigured': true,
      updatedAt: new Date().toISOString()
    });

    res.json({ message: 'API keys saved successfully' });
  } catch (error) {
    console.error('API keys save error:', error);
    res.status(500).json({ error: 'Failed to save API keys' });
  }
});

// Get bot settings
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    res.json({
      botSettings: userData.botSettings,
      apiKeysConfigured: userData.apiKeys?.isConfigured || false
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update bot settings
router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const { leverage, symbol, orderSize, stopLoss, takeProfit, timeframe } = req.body;

    // Validation
    if (leverage < 1 || leverage > 25) {
      return res.status(400).json({ error: 'Leverage must be between 1 and 25' });
    }

    if (orderSize < 25) {
      return res.status(400).json({ error: 'Order size must be at least 25 USDT' });
    }

    if (stopLoss < 0.5 || stopLoss > 10) {
      return res.status(400).json({ error: 'Stop loss must be between 0.5% and 10%' });
    }

    if (takeProfit < 1 || takeProfit > 20) {
      return res.status(400).json({ error: 'Take profit must be between 1% and 20%' });
    }

    const validTimeframes = ['5m', '15m', '30m'];
    if (!validTimeframes.includes(timeframe)) {
      return res.status(400).json({ error: 'Invalid timeframe' });
    }

    const botSettings = {
      leverage: parseInt(leverage),
      symbol: symbol.toUpperCase(),
      orderSize: parseFloat(orderSize),
      stopLoss: parseFloat(stopLoss),
      takeProfit: parseFloat(takeProfit),
      timeframe,
      isActive: false
    };

    await db.collection('users').doc(req.user.uid).update({
      botSettings,
      updatedAt: new Date().toISOString()
    });

    res.json({ message: 'Bot settings updated successfully', botSettings });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Start bot
router.post('/start', authenticateToken, async (req, res) => {
  try {
    // Check subscription status first
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    // Check if user is blocked
    if (userData.blocked) {
      return res.status(403).json({ error: 'Account is blocked. Please contact support.' });
    }
    
    const now = new Date();
    let isActive = false;
    
    if (userData.subscriptionStatus === 'trial') {
      const trialEnd = new Date(userData.trialEndDate);
      isActive = now < trialEnd;
    } else if (userData.subscriptionStatus === 'active') {
      const subscriptionEnd = new Date(userData.subscriptionEndDate);
      isActive = now < subscriptionEnd;
    }

    if (!isActive) {
      return res.status(403).json({ 
        error: 'Subscription expired. Please renew to continue.',
        subscriptionStatus: userData.subscriptionStatus,
        needsPayment: true
      });
    }

    // Check if API keys are configured
    if (!userData.apiKeys?.isConfigured) {
      return res.status(400).json({ error: 'Please configure your Binance API keys first' });
    }

    // Check if bot settings are complete
    const botSettings = userData.botSettings;
    if (!botSettings || !botSettings.symbol || !botSettings.leverage || !botSettings.orderSize) {
      return res.status(400).json({ error: 'Please complete your bot settings first' });
    }

    // Validate bot settings
    if (botSettings.orderSize < 25) {
      return res.status(400).json({ error: 'Minimum order size is 25 USDT' });
    }

    if (botSettings.leverage < 1 || botSettings.leverage > 25) {
      return res.status(400).json({ error: 'Leverage must be between 1x and 25x' });
    }

    // Check if bot is already running
    const { botManager } = require('../services/BinanceBot');
    const currentStatus = botManager.getBotStatus(req.user.uid);
    if (currentStatus.isRunning) {
      return res.status(400).json({ error: 'Bot is already running' });
    }

    // Start the bot using BotManager
    const result = await botManager.startBot(req.user.uid, userData);
    
    if (result.success) {
      // Update bot status in database
      await db.collection('users').doc(req.user.uid).update({
        'botSettings.isActive': true,
        'botSettings.startedAt': new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      res.json({ 
        message: 'Bot started successfully',
        botStatus: 'active'
      });
    } else {
      res.status(500).json({ 
        error: result.message || 'Failed to start bot'
      });
    }
  } catch (error) {
    console.error('Bot start error:', error);
    res.status(500).json({ error: 'Internal server error while starting bot' });
  }
});

// Stop bot
router.post('/stop', authenticateToken, async (req, res) => {
  try {
    const { botManager } = require('../services/BinanceBot');
    const result = botManager.stopBot(req.user.uid);
    
    // Update bot status in database
    await db.collection('users').doc(req.user.uid).update({
      'botSettings.isActive': false,
      'botSettings.stoppedAt': new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.json({ 
      message: result.message,
      botStatus: 'stopped'
    });
  } catch (error) {
    console.error('Bot stop error:', error);
    res.status(500).json({ error: 'Failed to stop bot' });
  }
});

// Get bot status with real-time data
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();
    
    const { botManager } = require('../services/BinanceBot');
    const botStatus = botManager.getBotStatus(req.user.uid);

    // Get recent activities
    const activitiesSnapshot = await db.collection('activities')
      .where('userId', '==', req.user.uid)
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    const activities = [];
    activitiesSnapshot.forEach(doc => {
      activities.push({ id: doc.id, ...doc.data() });
    });

    res.json({
      isActive: userData.botSettings?.isActive || false,
      startedAt: userData.botSettings?.startedAt,
      botStatus: botStatus,
      realTimeData: userData.realTimeData || null,
      stats: userData.stats || {
        totalTrades: 0,
        totalProfit: 0,
        winRate: 0,
        currentBalance: 0
      },
      activities: activities
    });
  } catch (error) {
    console.error('Bot status error:', error);
    res.status(500).json({ error: 'Failed to get bot status' });
  }
});

// Get real-time market data
router.get('/market-data/:symbol', authenticateToken, async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // This would typically come from a cached market data service
    // For now, we'll return mock data structure
    const marketData = {
      symbol: symbol.toUpperCase(),
      price: 45000 + Math.random() * 1000,
      change24h: (Math.random() - 0.5) * 10,
      volume24h: Math.random() * 1000000,
      timestamp: new Date().toISOString()
    };

    res.json(marketData);
  } catch (error) {
    console.error('Market data error:', error);
    res.status(500).json({ error: 'Failed to get market data' });
  }
});

// Get user's open positions
router.get('/positions', authenticateToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();
    
    if (!userData.apiKeys?.isConfigured) {
      return res.json({ positions: [] });
    }

    // In a real implementation, this would fetch from Binance API
    // For now, return the current position from bot status
    const { botManager } = require('../services/BinanceBot');
    const botStatus = botManager.getBotStatus(req.user.uid);
    
    const positions = botStatus.currentPosition ? [botStatus.currentPosition] : [];

    res.json({ positions });
  } catch (error) {
    console.error('Positions error:', error);
    res.status(500).json({ error: 'Failed to get positions' });
  }
});

// Emergency stop all positions
router.post('/emergency-stop', authenticateToken, async (req, res) => {
  try {
    const { botManager } = require('../services/BinanceBot');
    const result = botManager.stopBot(req.user.uid);
    
    // Update database
    await db.collection('users').doc(req.user.uid).update({
      'botSettings.isActive': false,
      'botSettings.emergencyStoppedAt': new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Log emergency stop
    await db.collection('activities').add({
      userId: req.user.uid,
      title: 'Emergency Stop',
      description: 'Bot stopped via emergency stop button',
      timestamp: new Date().toISOString(),
      type: 'warning'
    });

    res.json({ 
      message: 'Emergency stop executed successfully',
      botStatus: 'stopped'
    });
  } catch (error) {
    console.error('Emergency stop error:', error);
    res.status(500).json({ error: 'Failed to execute emergency stop' });
  }
});

// Get bot status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();

    res.json({
      isActive: userData.botSettings?.isActive || false,
      startedAt: userData.botSettings?.startedAt,
      stats: userData.stats || {
        totalTrades: 0,
        totalProfit: 0,
        winRate: 0,
        currentBalance: 0
      }
    });
  } catch (error) {
    console.error('Bot status error:', error);
    res.status(500).json({ error: 'Failed to get bot status' });
  }
});

// Get trading history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const tradesSnapshot = await db.collection('trades')
      .where('userId', '==', req.user.uid)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const trades = [];
    tradesSnapshot.forEach(doc => {
      trades.push({ id: doc.id, ...doc.data() });
    });

    res.json(trades);
  } catch (error) {
    console.error('Trading history error:', error);
    res.status(500).json({ error: 'Failed to fetch trading history' });
  }
});

// Get system info (IP addresses, announcements)
router.get('/system-info', authenticateToken, async (req, res) => {
  try {
    const ipAddresses = (process.env.BINANCE_IP_ADDRESSES || '').split(',').filter(ip => ip.trim());
    const trc20Address = process.env.TRC20_WALLET_ADDRESS || '';
    
    // Get latest announcement
    const announcementDoc = await db.collection('system').doc('announcement').get();
    const announcement = announcementDoc.exists ? announcementDoc.data().message : '';

    res.json({
      ipAddresses,
      trc20Address,
      announcement,
      subscriptionPrice: 15 // USDT
    });
  } catch (error) {
    console.error('System info error:', error);
    res.status(500).json({ error: 'Failed to fetch system info' });
  }
});

module.exports = router;