const Binance = require('node-binance-api');
const WebSocket = require('ws');
const { db } = require('../config/firebase');

class BinanceBot {
  constructor(userId, userSettings) {
    this.userId = userId;
    this.userSettings = userSettings;
    this.binance = null;
    this.ws = null;
    this.isRunning = false;
    this.currentPosition = null;
    this.priceData = [];
    this.ema9 = [];
    this.ema21 = [];
    this.lastSignal = null;
  }

  async initialize() {
    try {
      // Decrypt API keys
      const apiKey = this.decryptApiKey(this.userSettings.apiKeys.binanceApiKey);
      const secretKey = this.decryptApiKey(this.userSettings.apiKeys.binanceSecretKey);

      this.binance = new Binance().options({
        APIKEY: apiKey,
        APISECRET: secretKey,
        useServerTime: true,
        test: false, // Production'da false olmalı
        urls: {
          base: 'https://fapi.binance.com/fapi/',
          stream: 'wss://fstream.binance.com/ws/'
        }
      });

      // Test API connection
      const accountInfo = await this.binance.futuresAccount();
      console.log(`✅ Bot initialized for user ${this.userId}, Balance: ${accountInfo.totalWalletBalance} USDT`);
      
      return true;
    } catch (error) {
      console.error(`❌ Bot initialization failed for user ${this.userId}:`, error);
      await this.logError('Bot initialization failed', error.message);
      return false;
    }
  }

  start() {
    if (this.isRunning) {
      console.log(`Bot already running for user ${this.userId}`);
      return;
    }

    this.isRunning = true;
    this.connectWebSocket();
    this.logActivity('Bot started', 'Bot successfully started and monitoring market');
    console.log(`🚀 Bot started for user ${this.userId}`);
  }

  stop() {
    this.isRunning = false;
    if (this.ws) {
      this.ws.close();
    }
    this.logActivity('Bot stopped', 'Bot stopped by user');
    console.log(`⏹️ Bot stopped for user ${this.userId}`);
  }

  connectWebSocket() {
    const symbol = this.userSettings.botSettings.symbol.toLowerCase();
    const timeframe = this.userSettings.botSettings.timeframe;
    
    // Connect to Binance WebSocket for real-time kline data
    const wsUrl = `wss://fstream.binance.com/ws/${symbol}@kline_${timeframe}`;
    
    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      console.log(`📡 WebSocket connected for ${symbol} ${timeframe}`);
      this.logActivity('WebSocket connected', `Connected to ${symbol} ${timeframe} stream`);
    });

    this.ws.on('message', (data) => {
      try {
        const klineData = JSON.parse(data);
        if (klineData.k && klineData.k.x) { // Kline is closed
          this.processKlineData(klineData.k);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        this.logError('WebSocket message error', error.message);
      }
    });

    this.ws.on('close', () => {
      console.log(`📡 WebSocket disconnected for user ${this.userId}`);
      if (this.isRunning) {
        // Reconnect after 5 seconds
        setTimeout(() => this.connectWebSocket(), 5000);
      }
    });

    this.ws.on('error', (error) => {
      console.error(`WebSocket error for user ${this.userId}:`, error);
      this.logError('WebSocket error', error.message);
    });
  }

  processKlineData(kline) {
    const closePrice = parseFloat(kline.c);
    const volume = parseFloat(kline.v);
    const timestamp = kline.t;

    // Add to price data
    this.priceData.push({
      price: closePrice,
      volume: volume,
      timestamp: timestamp
    });

    // Keep only last 50 candles
    if (this.priceData.length > 50) {
      this.priceData.shift();
    }

    // Calculate EMAs
    this.calculateEMAs();

    // Check for trading signals
    if (this.ema9.length >= 2 && this.ema21.length >= 2) {
      this.checkTradingSignals();
    }

    // Update real-time data in Firebase
    this.updateRealTimeData(closePrice, volume);
  }

  calculateEMAs() {
    if (this.priceData.length < 21) return;

    const prices = this.priceData.map(d => d.price);

    // Calculate EMA 9
    const ema9 = this.calculateEMA(prices, 9);
    this.ema9.push(ema9);
    if (this.ema9.length > 50) this.ema9.shift();

    // Calculate EMA 21
    const ema21 = this.calculateEMA(prices, 21);
    this.ema21.push(ema21);
    if (this.ema21.length > 50) this.ema21.shift();
  }

  calculateEMA(prices, period) {
    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  async checkTradingSignals() {
    const currentEma9 = this.ema9[this.ema9.length - 1];
    const currentEma21 = this.ema21[this.ema21.length - 1];
    const previousEma9 = this.ema9[this.ema9.length - 2];
    const previousEma21 = this.ema21[this.ema21.length - 2];

    let signal = null;

    // Long signal: EMA 9 crosses above EMA 21
    if (currentEma9 > currentEma21 && previousEma9 <= previousEma21) {
      signal = 'LONG';
    }
    // Short signal: EMA 9 crosses below EMA 21
    else if (currentEma9 < currentEma21 && previousEma9 >= previousEma21) {
      signal = 'SHORT';
    }

    if (signal && signal !== this.lastSignal) {
      this.lastSignal = signal;
      
      // Close existing position if opposite signal
      if (this.currentPosition && this.currentPosition.side !== signal) {
        await this.closePosition();
      }

      // Open new position
      if (!this.currentPosition || this.currentPosition.side !== signal) {
        await this.openPosition(signal);
      }
    }
  }

  async openPosition(side) {
    try {
      // Close existing position if any
      if (this.currentPosition) {
        await this.closePosition();
      }

      const symbol = this.userSettings.botSettings.symbol;
      const orderSize = this.userSettings.botSettings.orderSize;
      const leverage = this.userSettings.botSettings.leverage;
      const stopLoss = this.userSettings.botSettings.stopLoss;
      const takeProfit = this.userSettings.botSettings.takeProfit;

      // Set leverage
      await this.binance.futuresLeverage(symbol, leverage);

      // Get current price
      const ticker = await this.binance.futuresPrices();
      const currentPrice = parseFloat(ticker[symbol]);

      // Calculate quantity
      const quantity = (orderSize * leverage) / currentPrice;
      const roundedQuantity = this.roundQuantity(quantity, symbol);

      // Place market order
      const order = await this.binance.futuresMarketOrder(
        symbol,
        side,
        roundedQuantity
      );

      // Calculate stop loss and take profit prices
      const stopLossPrice = side === 'LONG' 
        ? currentPrice * (1 - stopLoss / 100)
        : currentPrice * (1 + stopLoss / 100);

      const takeProfitPrice = side === 'LONG'
        ? currentPrice * (1 + takeProfit / 100)
        : currentPrice * (1 - takeProfit / 100);

      // Place stop loss order
      const stopLossOrder = await this.binance.futuresOrder(
        symbol,
        side === 'LONG' ? 'SELL' : 'BUY',
        roundedQuantity,
        null,
        {
          type: 'STOP_MARKET',
          stopPrice: this.roundPrice(stopLossPrice, symbol),
          timeInForce: 'GTC'
        }
      );

      // Place take profit order
      const takeProfitOrder = await this.binance.futuresOrder(
        symbol,
        side === 'LONG' ? 'SELL' : 'BUY',
        roundedQuantity,
        this.roundPrice(takeProfitPrice, symbol),
        {
          type: 'LIMIT',
          timeInForce: 'GTC'
        }
      );

      this.currentPosition = {
        side,
        quantity: roundedQuantity,
        entryPrice: currentPrice,
        stopLossPrice,
        takeProfitPrice,
        stopLossOrderId: stopLossOrder.orderId,
        takeProfitOrderId: takeProfitOrder.orderId,
        timestamp: new Date().toISOString()
      };

      // Save trade to database
      await this.saveTrade({
        userId: this.userId,
        symbol,
        side,
        quantity: roundedQuantity,
        price: currentPrice,
        type: 'MARKET',
        status: 'FILLED',
        orderId: order.orderId,
        timestamp: new Date().toISOString()
      });

      // Log activity
      this.logActivity(
        `${side} position opened`,
        `Opened ${side} position for ${symbol} at $${currentPrice.toFixed(2)}`
      );

      console.log(`📈 ${side} position opened for user ${this.userId} at ${currentPrice}`);

    } catch (error) {
      console.error(`❌ Failed to open ${side} position for user ${this.userId}:`, error);
      this.logError(`Failed to open ${side} position`, error.message);
    }
  }

  async closePosition() {
    if (!this.currentPosition) return;

    try {
      const symbol = this.userSettings.botSettings.symbol;
      
      // Cancel all open orders for this symbol
      await this.binance.futuresCancelAll(symbol);

      // Close position with market order
      const order = await this.binance.futuresMarketOrder(
        symbol,
        this.currentPosition.side === 'LONG' ? 'SELL' : 'BUY',
        this.currentPosition.quantity
      );

      // Calculate P&L
      const exitPrice = parseFloat(order.avgPrice || order.price);
      const pnl = this.currentPosition.side === 'LONG'
        ? (exitPrice - this.currentPosition.entryPrice) * this.currentPosition.quantity
        : (this.currentPosition.entryPrice - exitPrice) * this.currentPosition.quantity;

      // Save closing trade
      await this.saveTrade({
        userId: this.userId,
        symbol,
        side: this.currentPosition.side === 'LONG' ? 'SELL' : 'BUY',
        quantity: this.currentPosition.quantity,
        price: exitPrice,
        type: 'MARKET',
        status: 'FILLED',
        pnl,
        orderId: order.orderId,
        timestamp: new Date().toISOString()
      });

      // Update user stats
      await this.updateUserStats(pnl);

      // Log activity
      this.logActivity(
        'Position closed',
        `Closed ${this.currentPosition.side} position. P&L: $${pnl.toFixed(2)}`
      );

      console.log(`📉 Position closed for user ${this.userId}. P&L: ${pnl.toFixed(2)} USDT`);
      
      this.currentPosition = null;

    } catch (error) {
      console.error(`❌ Failed to close position for user ${this.userId}:`, error);
      this.logError('Failed to close position', error.message);
    }
  }

  async saveTrade(tradeData) {
    try {
      await db.collection('trades').add(tradeData);
    } catch (error) {
      console.error('Failed to save trade:', error);
    }
  }

  async updateUserStats(pnl) {
    try {
      const userDoc = await db.collection('users').doc(this.userId).get();
      const userData = userDoc.data();
      const currentStats = userData.stats || { 
        totalTrades: 0, 
        totalProfit: 0, 
        winRate: 0,
        winningTrades: 0,
        losingTrades: 0
      };

      const isWin = pnl > 0;
      const newStats = {
        totalTrades: currentStats.totalTrades + 1,
        totalProfit: currentStats.totalProfit + pnl,
        winningTrades: currentStats.winningTrades + (isWin ? 1 : 0),
        losingTrades: currentStats.losingTrades + (isWin ? 0 : 1),
        winRate: ((currentStats.winningTrades + (isWin ? 1 : 0)) / (currentStats.totalTrades + 1)) * 100,
        lastTradeAt: new Date().toISOString()
      };

      await db.collection('users').doc(this.userId).update({ stats: newStats });
    } catch (error) {
      console.error('Failed to update user stats:', error);
    }
  }

  async updateRealTimeData(price, volume) {
    try {
      const realTimeData = {
        currentPrice: price,
        volume: volume,
        ema9: this.ema9[this.ema9.length - 1],
        ema21: this.ema21[this.ema21.length - 1],
        position: this.currentPosition,
        lastUpdate: new Date().toISOString()
      };

      await db.collection('users').doc(this.userId).update({ 
        realTimeData: realTimeData 
      });
    } catch (error) {
      console.error('Failed to update real-time data:', error);
    }
  }

  async logActivity(title, description) {
    try {
      await db.collection('activities').add({
        userId: this.userId,
        title,
        description,
        timestamp: new Date().toISOString(),
        type: 'info'
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  async logError(title, description) {
    try {
      await db.collection('activities').add({
        userId: this.userId,
        title,
        description,
        timestamp: new Date().toISOString(),
        type: 'error'
      });
    } catch (error) {
      console.error('Failed to log error:', error);
    }
  }

  roundQuantity(quantity, symbol) {
    // Symbol-specific quantity precision
    const precisionMap = {
      'BTCUSDT': 3,
      'ETHUSDT': 3,
      'BNBUSDT': 2,
      'ADAUSDT': 0,
      'DOTUSDT': 1,
      'LINKUSDT': 2
    };
    
    const precision = precisionMap[symbol] || 3;
    return parseFloat(quantity.toFixed(precision));
  }

  roundPrice(price, symbol) {
    // Symbol-specific price precision
    const precisionMap = {
      'BTCUSDT': 2,
      'ETHUSDT': 2,
      'BNBUSDT': 2,
      'ADAUSDT': 4,
      'DOTUSDT': 3,
      'LINKUSDT': 3
    };
    
    const precision = precisionMap[symbol] || 2;
    return parseFloat(price.toFixed(precision));
  }

  decryptApiKey(encryptedKey) {
    const crypto = require('crypto');
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here';
    
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
      let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Failed to decrypt API key:', error);
      throw new Error('Invalid API key encryption');
    }
  }
}

// Bot manager to handle multiple user bots
class BotManager {
  constructor() {
    this.activeBots = new Map();
  }

  async startBot(userId, userSettings) {
    if (this.activeBots.has(userId)) {
      console.log(`Bot already running for user ${userId}`);
      return { success: false, message: 'Bot already running' };
    }

    const bot = new BinanceBot(userId, userSettings);
    const initialized = await bot.initialize();
    
    if (initialized) {
      bot.start();
      this.activeBots.set(userId, bot);
      console.log(`✅ Bot started for user ${userId}`);
      return { success: true, message: 'Bot started successfully' };
    } else {
      console.log(`❌ Failed to start bot for user ${userId}`);
      return { success: false, message: 'Failed to initialize bot' };
    }
  }

  stopBot(userId) {
    const bot = this.activeBots.get(userId);
    if (bot) {
      bot.stop();
      this.activeBots.delete(userId);
      console.log(`⏹️ Bot stopped for user ${userId}`);
      return { success: true, message: 'Bot stopped successfully' };
    }
    return { success: false, message: 'Bot not running' };
  }

  getBotStatus(userId) {
    const bot = this.activeBots.get(userId);
    if (bot) {
      return {
        isRunning: bot.isRunning,
        currentPosition: bot.currentPosition,
        lastSignal: bot.lastSignal,
        priceDataCount: bot.priceData.length
      };
    }
    return { isRunning: false };
  }

  getAllActiveBots() {
    return Array.from(this.activeBots.keys());
  }
}

const botManager = new BotManager();

module.exports = {
  BinanceBot,
  BotManager,
  botManager
};