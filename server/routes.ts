import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import session from "express-session";

// Extend session data interface
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'stock-trading-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, 
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true 
    }
  }));

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if ((req.session as any).userId) {
      next();
    } else {
      res.status(401).json({ message: "Authentication required" });
    }
  };

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, email, password, firstName, lastName, phone, dateOfBirth, riskTolerance } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const newUser = await storage.createUser({
        username,
        email,
        password_hash: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        phone,
        date_of_birth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        risk_tolerance: riskTolerance
      });
      
      (req.session as any).userId = newUser.user_id;
      console.log('Session created for user:', newUser.user_id);
      res.json({ 
        success: true, 
        user: { 
          user_id: newUser.user_id, 
          username: newUser.username, 
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          account_balance: newUser.account_balance,
          risk_tolerance: newUser.risk_tolerance,
          subscription_tier: newUser.subscription_tier
        } 
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      (req.session as any).userId = user.user_id;
      res.json({ 
        success: true, 
        user: { 
          user_id: user.user_id, 
          username: user.username, 
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          account_balance: user.account_balance,
          risk_tolerance: user.risk_tolerance,
          subscription_tier: user.subscription_tier
        } 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get('/api/auth/me', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser((req.session as any).userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        account_balance: user.account_balance,
        risk_tolerance: user.risk_tolerance,
        subscription_tier: user.subscription_tier
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Stock routes
  app.get('/api/stocks', async (req, res) => {
    try {
      const stocks = await storage.getAllStocks();
      res.json(stocks);
    } catch (error) {
      console.error('Get stocks error:', error);
      res.status(500).json({ message: "Failed to get stocks" });
    }
  });

  app.get('/api/stocks/:symbol', async (req, res) => {
    try {
      const stock = await storage.getStockBySymbol(req.params.symbol);
      if (!stock) {
        return res.status(404).json({ message: "Stock not found" });
      }
      res.json(stock);
    } catch (error) {
      console.error('Get stock error:', error);
      res.status(500).json({ message: "Failed to get stock" });
    }
  });

  app.get('/api/sectors', async (req, res) => {
    try {
      const sectors = await storage.getAllSectors();
      res.json(sectors);
    } catch (error) {
      console.error('Get sectors error:', error);
      res.status(500).json({ message: "Failed to get sectors" });
    }
  });

  // Portfolio routes
  app.get('/api/portfolio', requireAuth, async (req: any, res) => {
    try {
      const portfolio = await storage.getUserPortfolio((req.session as any).userId);
      res.json(portfolio);
    } catch (error) {
      console.error('Get portfolio error:', error);
      res.status(500).json({ message: "Failed to get portfolio" });
    }
  });

  app.get('/api/portfolio/summary', requireAuth, async (req: any, res) => {
    try {
      const summary = await storage.getPortfolioSummary((req.session as any).userId);
      res.json(summary);
    } catch (error) {
      console.error('Get portfolio summary error:', error);
      res.status(500).json({ message: "Failed to get portfolio summary" });
    }
  });

  app.get('/api/portfolio/sector-allocation', requireAuth, async (req: any, res) => {
    try {
      const allocation = await storage.getSectorAllocation((req.session as any).userId);
      res.json(allocation);
    } catch (error) {
      console.error('Get sector allocation error:', error);
      res.status(500).json({ message: "Failed to get sector allocation" });
    }
  });

  // Trading routes
  app.post('/api/orders', requireAuth, async (req: any, res) => {
    try {
      const { stock_id, order_type, action, quantity, limit_price } = req.body;
      const userId = (req.session as any).userId;

      // Get stock and user info
      const stock = await storage.getStock(stock_id);
      if (!stock) {
        return res.status(404).json({ message: "Stock not found" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const currentPrice = parseFloat(stock.current_price);
      const executionPrice = order_type === 'MARKET' ? currentPrice : (limit_price || currentPrice);
      const totalAmount = quantity * executionPrice;

      // Validate order
      if (action === 'BUY') {
        const accountBalance = parseFloat(user.account_balance || '0');
        if (accountBalance < totalAmount) {
          return res.status(400).json({ message: "Insufficient funds" });
        }
      } else if (action === 'SELL') {
        const holding = await storage.getPortfolioHolding(userId, stock_id);
        if (!holding || holding.quantity_owned < quantity) {
          return res.status(400).json({ message: "Insufficient shares" });
        }
      }

      // Create order
      const order = await storage.createOrder({
        user_id: userId,
        stock_id,
        order_type,
        action,
        quantity,
        limit_price: limit_price ? limit_price.toString() : undefined,
        status: 'EXECUTED'
      });

      // Update order status
      await storage.updateOrderStatus(order.order_id, 'EXECUTED', new Date());

      // Create transaction
      const transaction = await storage.createTransaction({
        user_id: userId,
        stock_id,
        transaction_type: action,
        quantity,
        transaction_price: executionPrice.toString(),
        total_amount: totalAmount.toString(),
        order_id: order.order_id
      });

      // Update portfolio and user balance
      if (action === 'BUY') {
        // Deduct from balance
        await storage.updateUserBalance(userId, -totalAmount);

        // Update portfolio
        const existingHolding = await storage.getPortfolioHolding(userId, stock_id);
        if (existingHolding) {
          const newQuantity = existingHolding.quantity_owned + quantity;
          const newTotalInvested = parseFloat(existingHolding.total_invested) + totalAmount;
          const newAvgPrice = newTotalInvested / newQuantity;
          
          await storage.updatePortfolioHolding(userId, stock_id, newQuantity, newAvgPrice, newTotalInvested);
        } else {
          await storage.createPortfolioHolding({
            user_id: userId,
            stock_id,
            quantity_owned: quantity,
            average_buy_price: executionPrice.toString(),
            total_invested: totalAmount.toString(),
            first_purchase_date: new Date()
          });
        }
      } else if (action === 'SELL') {
        // Add to balance
        await storage.updateUserBalance(userId, totalAmount);

        // Update portfolio
        const holding = await storage.getPortfolioHolding(userId, stock_id)!;
        const newQuantity = holding!.quantity_owned - quantity;
        
        if (newQuantity <= 0) {
          await storage.deletePortfolioHolding(userId, stock_id);
        } else {
          const proportionSold = quantity / holding!.quantity_owned;
          const newTotalInvested = parseFloat(holding!.total_invested) * (1 - proportionSold);
          
          await storage.updatePortfolioHolding(userId, stock_id, newQuantity, parseFloat(holding!.average_buy_price), newTotalInvested);
        }
      }

      res.json({ success: true, order_id: order.order_id });
    } catch (error) {
      console.error('Order execution error:', error);
      res.status(500).json({ message: "Failed to execute order" });
    }
  });

  // Watchlist routes
  app.get('/api/watchlist', requireAuth, async (req: any, res) => {
    try {
      const watchlist = await storage.getUserWatchlist((req.session as any).userId);
      res.json(watchlist);
    } catch (error) {
      console.error('Get watchlist error:', error);
      res.status(500).json({ message: "Failed to get watchlist" });
    }
  });

  app.post('/api/watchlist', requireAuth, async (req: any, res) => {
    try {
      const { stock_id, alert_price_high, alert_price_low, notes } = req.body;
      
      const watchlistItem = await storage.addToWatchlist({
        user_id: (req.session as any).userId,
        stock_id,
        alert_price_high: alert_price_high ? alert_price_high.toString() : undefined,
        alert_price_low: alert_price_low ? alert_price_low.toString() : undefined,
        notes
      });
      
      res.json({ success: true, watchlist_id: watchlistItem.watchlist_id });
    } catch (error) {
      console.error('Add to watchlist error:', error);
      res.status(500).json({ message: "Failed to add to watchlist" });
    }
  });

  app.delete('/api/watchlist/:stockId', requireAuth, async (req: any, res) => {
    try {
      await storage.removeFromWatchlist((req.session as any).userId, parseInt(req.params.stockId));
      res.json({ success: true });
    } catch (error) {
      console.error('Remove from watchlist error:', error);
      res.status(500).json({ message: "Failed to remove from watchlist" });
    }
  });

  // Transaction routes
  app.get('/api/transactions', requireAuth, async (req: any, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const transactions = await storage.getUserTransactions((req.session as any).userId, limit);
      res.json(transactions);
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ message: "Failed to get transactions" });
    }
  });

  // Initialize sample data
  app.post('/api/initialize-data', async (req, res) => {
    try {
      await storage.initializeSampleData();
      res.json({ message: 'Sample data initialized successfully' });
    } catch (error) {
      console.error('Initialize data error:', error);
      res.status(500).json({ message: "Failed to initialize sample data" });
    }
  });

  // Session check
  app.get('/api/session', (req: any, res) => {
    if ((req.session as any).userId) {
      res.json({ authenticated: true, userId: (req.session as any).userId });
    } else {
      res.json({ authenticated: false });
    }
  });

  // Competitions routes
  app.get('/api/competitions', async (req, res) => {
    try {
      const competitions = await storage.getAllCompetitions();
      res.json(competitions);
    } catch (error) {
      console.error('Get competitions error:', error);
      res.status(500).json({ message: "Failed to get competitions" });
    }
  });

  app.get('/api/competitions/my-participations', requireAuth, async (req: any, res) => {
    try {
      const participations = await storage.getUserParticipations((req.session as any).userId);
      res.json(participations);
    } catch (error) {
      console.error('Get participations error:', error);
      res.status(500).json({ message: "Failed to get participations" });
    }
  });

  app.get('/api/competitions/leaderboard/:competitionId', async (req, res) => {
    try {
      const leaderboard = await storage.getCompetitionLeaderboard(parseInt(req.params.competitionId));
      res.json(leaderboard);
    } catch (error) {
      console.error('Get leaderboard error:', error);
      res.status(500).json({ message: "Failed to get leaderboard" });
    }
  });

  app.post('/api/competitions/:competitionId/join', requireAuth, async (req: any, res) => {
    try {
      const competitionId = parseInt(req.params.competitionId);
      const userId = (req.session as any).userId;
      
      const participation = await storage.joinCompetition(userId, competitionId);
      res.json({ success: true, participation_id: participation.participant_id });
    } catch (error) {
      console.error('Join competition error:', error);
      res.status(500).json({ message: "Failed to join competition" });
    }
  });

  // Alerts routes
  app.get('/api/alerts', requireAuth, async (req: any, res) => {
    try {
      const alerts = await storage.getUserAlerts((req.session as any).userId);
      res.json(alerts);
    } catch (error) {
      console.error('Get alerts error:', error);
      res.status(500).json({ message: "Failed to get alerts" });
    }
  });

  app.post('/api/alerts', requireAuth, async (req: any, res) => {
    try {
      const { stock_id, alert_type, trigger_price, condition_type, message } = req.body;
      const userId = (req.session as any).userId;
      
      const alert = await storage.createAlert({
        user_id: userId,
        stock_id,
        alert_type,
        trigger_price: trigger_price.toString(),
        condition_type,
        message
      });
      
      res.json({ success: true, alert_id: alert.alert_id });
    } catch (error) {
      console.error('Create alert error:', error);
      res.status(500).json({ message: "Failed to create alert" });
    }
  });

  app.delete('/api/alerts/:alertId', requireAuth, async (req: any, res) => {
    try {
      const alertId = parseInt(req.params.alertId);
      await storage.deleteAlert(alertId);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete alert error:', error);
      res.status(500).json({ message: "Failed to delete alert" });
    }
  });

  app.put('/api/alerts/:alertId/toggle', requireAuth, async (req: any, res) => {
    try {
      const alertId = parseInt(req.params.alertId);
      const { is_active } = req.body;
      
      await storage.toggleAlert(alertId, is_active);
      res.json({ success: true });
    } catch (error) {
      console.error('Toggle alert error:', error);
      res.status(500).json({ message: "Failed to toggle alert" });
    }
  });

  // Recommendations routes
  app.get('/api/recommendations', async (req, res) => {
    try {
      const recommendations = await storage.getAllRecommendations();
      res.json(recommendations);
    } catch (error) {
      console.error('Get recommendations error:', error);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  app.post('/api/recommendations/:recommendationId/follow', requireAuth, async (req: any, res) => {
    try {
      const recommendationId = parseInt(req.params.recommendationId);
      const userId = (req.session as any).userId;
      
      const recommendation = await storage.getRecommendation(recommendationId);
      if (!recommendation) {
        return res.status(404).json({ message: "Recommendation not found" });
      }
      
      // Add to watchlist
      await storage.addToWatchlist({
        user_id: userId,
        stock_id: recommendation.stock_id,
        notes: `From recommendation: ${recommendation.analyst_name}`
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Follow recommendation error:', error);
      res.status(500).json({ message: "Failed to follow recommendation" });
    }
  });

  // Subscriptions routes
  app.get('/api/subscriptions/current', requireAuth, async (req: any, res) => {
    try {
      const subscription = await storage.getCurrentSubscription((req.session as any).userId);
      res.json(subscription);
    } catch (error) {
      console.error('Get current subscription error:', error);
      res.status(500).json({ message: "Failed to get subscription" });
    }
  });

  app.get('/api/subscriptions/history', requireAuth, async (req: any, res) => {
    try {
      const history = await storage.getSubscriptionHistory((req.session as any).userId);
      res.json(history);
    } catch (error) {
      console.error('Get subscription history error:', error);
      res.status(500).json({ message: "Failed to get subscription history" });
    }
  });

  app.post('/api/subscriptions/upgrade', requireAuth, async (req: any, res) => {
    try {
      const { tier_name, payment_method } = req.body;
      const userId = (req.session as any).userId;
      
      const subscription = await storage.upgradeSubscription(userId, tier_name, payment_method);
      
      // Update user's subscription tier
      await storage.updateUserSubscriptionTier(userId, tier_name);
      
      res.json({ success: true, subscription_id: subscription.subscription_id });
    } catch (error) {
      console.error('Upgrade subscription error:', error);
      res.status(500).json({ message: "Failed to upgrade subscription" });
    }
  });

  app.post('/api/subscriptions/cancel', requireAuth, async (req: any, res) => {
    try {
      const userId = (req.session as any).userId;
      
      await storage.cancelSubscription(userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

   // Competitions routes
  app.get('/api/tables/trading_competitions', async (req, res) => {
    try {
      const competitions = await storage.getAllCompetitions();
      res.json(competitions);
    } catch (error) {
      console.error('Get competitions error:', error);
      res.status(500).json({ message: "Failed to get competitions" });
    }
  });
   app.get('/api/tables/users1', async (req, res) => {
    try {
      const competitions = await storage.getAllUsers();
      res.json(competitions);
    } catch (error) {
      console.error('Get competitions error:', error);
      res.status(500).json({ message: "Failed to get competitions" });
    }
  });

  app.get('/api/tables/competition_participants', async (req, res) => {
    try {
      const competitions = await storage.getAllParticipants();
      res.json(competitions);
    } catch (error) {
      console.error('Get competitions error:', error);
      res.status(500).json({ message: "Failed to get competitions" });
    }
  });

  app.get('/api/tables/sectors', async (req, res) => {
    try {
      const competitions = await storage.getAllSectors();
      res.json(competitions);
    } catch (error) {
      console.error('Get competitions error:', error);
      res.status(500).json({ message: "Failed to get competitions" });
    }
  });

   app.get('/api/tables/stocks', async (req, res) => {
    try {
      const competitions = await storage.getAllStocks();
      res.json(competitions);
    } catch (error) {
      console.error('Get competitions error:', error);
      res.status(500).json({ message: "Failed to get competitions" });
    }
  });

   app.get('/api/tables/portfolio', async (req, res) => {
    try {
      const competitions = await storage.getAllStocks();
      res.json(competitions);
    } catch (error) {
      console.error('Get competitions error:', error);
      res.status(500).json({ message: "Failed to get competitions" });
    }
  });

   app.get('/api/tables/recommendations', async (req, res) => {
    try {
      const competitions = await storage.getAllRecommendations();
      res.json(competitions);
    } catch (error) {
      console.error('Get competitions error:', error);
      res.status(500).json({ message: "Failed to get competitions" });
    }
  });

  app.get('/api/tables/orders', async (req, res) => {
    try {
      const competitions = await storage.getAllOrders();
      res.json(competitions);
    } catch (error) {
      console.error('Get competitions error:', error);
      res.status(500).json({ message: "Failed to get competitions" });
    }
  });

    app.get('/api/tables/transactions', async (req, res) => {
    try {
      const competitions = await storage.getAllTransactions();
      res.json(competitions);
    } catch (error) {
      console.error('Get competitions error:', error);
      res.status(500).json({ message: "Failed to get competitions" });
    }
  });

     app.get('/api/tables/watchlists', async (req, res) => {
    try {
      const competitions = await storage.getAllWatchlists();
      res.json(competitions);
    } catch (error) {
      console.error('Get competitions error:', error);
      res.status(500).json({ message: "Failed to get competitions" });
    }
  });

    app.get('/api/tables/stock_alerts', async (req, res) => {
    try {
      const competitions = await storage.getAllStock_alerts();
      res.json(competitions);
    } catch (error) {
      console.error('Get competitions error:', error);
      res.status(500).json({ message: "Failed to get competitions" });
    }
  });

    app.get('/api/tables/user_subscriptions', async (req, res) => {
    try {
      const competitions = await storage.getAllUser_subscriptions();
      res.json(competitions);
    } catch (error) {
      console.error('Get competitions error:', error);
      res.status(500).json({ message: "Failed to get competitions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
