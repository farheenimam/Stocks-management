import { 
  users1, 
  stocks, 
  portfolio, 
  orders, 
  transactions, 
  watchlists, 
  sectors,
  stock_alerts,
  trading_competitions,
  competition_participants,
  recommendations,
  user_subscriptions,
  type User1, 
  type InsertUser1,
  type Stock,
  type InsertStock,
  type Portfolio,
  type InsertPortfolio,
  type Order,
  type InsertOrder,
  type Transaction,
  type InsertTransaction,
  type Watchlist,
  type InsertWatchlist,
  type Sector
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User1 | undefined>;
  getUserByEmail(email: string): Promise<User1 | undefined>;
  getUserByUsername(username: string): Promise<User1 | undefined>;
  createUser(user: InsertUser1): Promise<User1>;
  updateUserBalance(userId: number, amount: number): Promise<void>;
  
  // Stock operations
  getAllStocks(): Promise<(Stock & { sector_name?: string })[]>;
  getStock(id: number): Promise<Stock | undefined>;
  getStockBySymbol(symbol: string): Promise<Stock | undefined>;
  createStock(stock: InsertStock): Promise<Stock>;
  updateStockPrice(stockId: number, price: number, change: number, changePercent: number): Promise<void>;
  
  // Sector operations
  getAllSectors(): Promise<Sector[]>;
  getSector(id: number): Promise<Sector | undefined>;
  
  // Portfolio operations
  getUserPortfolio(userId: number): Promise<(Portfolio & { symbol: string; company_name: string; current_price: number; sector_name?: string })[]>;
  getPortfolioHolding(userId: number, stockId: number): Promise<Portfolio | undefined>;
  createPortfolioHolding(holding: InsertPortfolio): Promise<Portfolio>;
  updatePortfolioHolding(userId: number, stockId: number, quantity: number, avgPrice: number, totalInvested: number): Promise<void>;
  deletePortfolioHolding(userId: number, stockId: number): Promise<void>;
  
  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(orderId: number, status: string, executionDate?: Date): Promise<void>;
  getUserOrders(userId: number): Promise<Order[]>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: number, limit?: number): Promise<(Transaction & { symbol: string; company_name: string })[]>;
  
  // Watchlist operations
  getUserWatchlist(userId: number): Promise<(Watchlist & { symbol: string; company_name: string; current_price: number; day_change?: number; day_change_percent?: number })[]>;
  addToWatchlist(watchlist: InsertWatchlist): Promise<Watchlist>;
  removeFromWatchlist(userId: number, stockId: number): Promise<void>;
  
  // Analytics operations
  getPortfolioSummary(userId: number): Promise<{
    totalValue: number;
    totalInvested: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
    holdingsCount: number;
  }>;
  
  getSectorAllocation(userId: number): Promise<{ sector_name: string; sector_value: number; stock_count: number }[]>;
  
  // Initialize sample data
  initializeSampleData(): Promise<void>;
  
  // Competition operations
  getAllCompetitions(): Promise<any[]>;
  getUserParticipations(userId: number): Promise<any[]>;
  getCompetitionLeaderboard(competitionId: number): Promise<any[]>;
  joinCompetition(userId: number, competitionId: number): Promise<any>;
  
  // Alert operations
  getUserAlerts(userId: number): Promise<any[]>;
  createAlert(alert: any): Promise<any>;
  deleteAlert(alertId: number): Promise<void>;
  toggleAlert(alertId: number, isActive: boolean): Promise<void>;
  
  // Recommendation operations
  getAllRecommendations(): Promise<any[]>;
  getRecommendation(recommendationId: number): Promise<any>;
  
  // Subscription operations
  getCurrentSubscription(userId: number): Promise<any>;
  getSubscriptionHistory(userId: number): Promise<any[]>;
  upgradeSubscription(userId: number, tierName: string, paymentMethod: string): Promise<any>;
  cancelSubscription(userId: number): Promise<void>;
  updateUserSubscriptionTier(userId: number, tierName: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User1 | undefined> {
    const [user] = await db.select().from(users1).where(eq(users1.user_id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User1 | undefined> {
    const [user] = await db.select().from(users1).where(eq(users1.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User1 | undefined> {
    const [user] = await db.select().from(users1).where(eq(users1.username, username));
    return user;
  }

  async createUser(user: InsertUser1): Promise<User1> {
    const [newUser] = await db.insert(users1).values(user).returning();
    return newUser;
  }

  async updateUserBalance(userId: number, amount: number): Promise<void> {
    await db.update(users1)
      .set({ account_balance: sql`account_balance + ${amount}` })
      .where(eq(users1.user_id, userId));
  }

  async getAllStocks(): Promise<(Stock & { sector_name?: string })[]> {
    const stocksWithSectors = await db
      .select({
        stock_id: stocks.stock_id,
        symbol: stocks.symbol,
        company_name: stocks.company_name,
        sector_id: stocks.sector_id,
        current_price: stocks.current_price,
        market_cap: stocks.market_cap,
        volume: stocks.volume,
        day_change: stocks.day_change,
        day_change_percent: stocks.day_change_percent,
        pe_ratio: stocks.pe_ratio,
        dividend_yield: stocks.dividend_yield,
        year_high: stocks.year_high,
        year_low: stocks.year_low,
        last_updated: stocks.last_updated,
        sector_name: sectors.sector_name
      })
      .from(stocks)
      .leftJoin(sectors, eq(stocks.sector_id, sectors.sector_id))
      .orderBy(stocks.symbol);
    
    return stocksWithSectors.map(stock => ({
      ...stock,
      sector_name: stock.sector_name || undefined
    }));
  }

  async getStock(id: number): Promise<Stock | undefined> {
    const [stock] = await db.select().from(stocks).where(eq(stocks.stock_id, id));
    return stock;
  }

  async getStockBySymbol(symbol: string): Promise<Stock | undefined> {
    const [stock] = await db.select().from(stocks).where(eq(stocks.symbol, symbol));
    return stock;
  }

  async createStock(stock: InsertStock): Promise<Stock> {
    const [newStock] = await db.insert(stocks).values(stock).returning();
    return newStock;
  }

  async updateStockPrice(stockId: number, price: number, change: number, changePercent: number): Promise<void> {
    await db.update(stocks)
      .set({ 
        current_price: price.toString(),
        day_change: change.toString(),
        day_change_percent: changePercent.toString(),
        last_updated: new Date()
      })
      .where(eq(stocks.stock_id, stockId));
  }

  async getAllSectors(): Promise<Sector[]> {
    return await db.select().from(sectors).orderBy(sectors.sector_name);
  }

  async getSector(id: number): Promise<Sector | undefined> {
    const [sector] = await db.select().from(sectors).where(eq(sectors.sector_id, id));
    return sector;
  }

  async getUserPortfolio(userId: number): Promise<(Portfolio & { symbol: string; company_name: string; current_price: number; sector_name?: string })[]> {
    const portfolioWithStocks = await db
      .select({
        portfolio_id: portfolio.portfolio_id,
        user_id: portfolio.user_id,
        stock_id: portfolio.stock_id,
        quantity_owned: portfolio.quantity_owned,
        average_buy_price: portfolio.average_buy_price,
        total_invested: portfolio.total_invested,
        current_value: portfolio.current_value,
        unrealized_gain_loss: portfolio.unrealized_gain_loss,
        first_purchase_date: portfolio.first_purchase_date,
        last_updated: portfolio.last_updated,
        symbol: stocks.symbol,
        company_name: stocks.company_name,
        current_price: stocks.current_price,
        sector_name: sectors.sector_name
      })
      .from(portfolio)
      .innerJoin(stocks, eq(portfolio.stock_id, stocks.stock_id))
      .leftJoin(sectors, eq(stocks.sector_id, sectors.sector_id))
      .where(eq(portfolio.user_id, userId))
      .orderBy(desc(portfolio.total_invested));
    
    return portfolioWithStocks.map(holding => ({
      ...holding,
      current_price: parseFloat(holding.current_price),
      sector_name: holding.sector_name || undefined
    }));
  }

  async getPortfolioHolding(userId: number, stockId: number): Promise<Portfolio | undefined> {
    const [holding] = await db.select().from(portfolio)
      .where(and(eq(portfolio.user_id, userId), eq(portfolio.stock_id, stockId)));
    return holding;
  }

  async createPortfolioHolding(holding: InsertPortfolio): Promise<Portfolio> {
    const [newHolding] = await db.insert(portfolio).values(holding).returning();
    return newHolding;
  }

  async updatePortfolioHolding(userId: number, stockId: number, quantity: number, avgPrice: number, totalInvested: number): Promise<void> {
    await db.update(portfolio)
      .set({
        quantity_owned: quantity,
        average_buy_price: avgPrice.toString(),
        total_invested: totalInvested.toString(),
        last_updated: new Date()
      })
      .where(and(eq(portfolio.user_id, userId), eq(portfolio.stock_id, stockId)));
  }

  async deletePortfolioHolding(userId: number, stockId: number): Promise<void> {
    await db.delete(portfolio)
      .where(and(eq(portfolio.user_id, userId), eq(portfolio.stock_id, stockId)));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrderStatus(orderId: number, status: string, executionDate?: Date): Promise<void> {
    await db.update(orders)
      .set({ 
        status,
        execution_date: executionDate || new Date()
      })
      .where(eq(orders.order_id, orderId));
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.user_id, userId))
      .orderBy(desc(orders.order_date));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async getUserTransactions(userId: number, limit = 50): Promise<(Transaction & { symbol: string; company_name: string })[]> {
    const transactionsWithStocks = await db
      .select({
        transaction_id: transactions.transaction_id,
        user_id: transactions.user_id,
        stock_id: transactions.stock_id,
        transaction_type: transactions.transaction_type,
        quantity: transactions.quantity,
        transaction_price: transactions.transaction_price,
        total_amount: transactions.total_amount,
        commission_fee: transactions.commission_fee,
        transaction_date: transactions.transaction_date,
        order_id: transactions.order_id,
        realized_gain_loss: transactions.realized_gain_loss,
        symbol: stocks.symbol,
        company_name: stocks.company_name
      })
      .from(transactions)
      .innerJoin(stocks, eq(transactions.stock_id, stocks.stock_id))
      .where(eq(transactions.user_id, userId))
      .orderBy(desc(transactions.transaction_date))
      .limit(limit);
    
    return transactionsWithStocks;
  }

  async getUserWatchlist(userId: number): Promise<(Watchlist & { symbol: string; company_name: string; current_price: number; day_change?: number; day_change_percent?: number })[]> {
    const watchlistWithStocks = await db
      .select({
        watchlist_id: watchlists.watchlist_id,
        user_id: watchlists.user_id,
        stock_id: watchlists.stock_id,
        alert_price_high: watchlists.alert_price_high,
        alert_price_low: watchlists.alert_price_low,
        notes: watchlists.notes,
        added_date: watchlists.added_date,
        symbol: stocks.symbol,
        company_name: stocks.company_name,
        current_price: stocks.current_price,
        day_change: stocks.day_change,
        day_change_percent: stocks.day_change_percent
      })
      .from(watchlists)
      .innerJoin(stocks, eq(watchlists.stock_id, stocks.stock_id))
      .where(eq(watchlists.user_id, userId))
      .orderBy(desc(watchlists.added_date));
    
    return watchlistWithStocks.map(item => ({
      ...item,
      current_price: parseFloat(item.current_price),
      day_change: item.day_change ? parseFloat(item.day_change) : undefined,
      day_change_percent: item.day_change_percent ? parseFloat(item.day_change_percent) : undefined
    }));
  }

  async addToWatchlist(watchlist: InsertWatchlist): Promise<Watchlist> {
    const [newWatchlist] = await db.insert(watchlists).values(watchlist).returning();
    return newWatchlist;
  }

  async removeFromWatchlist(userId: number, stockId: number): Promise<void> {
    await db.delete(watchlists)
      .where(and(eq(watchlists.user_id, userId), eq(watchlists.stock_id, stockId)));
  }

  async getPortfolioSummary(userId: number): Promise<{
    totalValue: number;
    totalInvested: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
    holdingsCount: number;
  }> {
    const portfolioData = await db
      .select({
        totalInvested: sql<number>`COALESCE(SUM(${portfolio.total_invested}), 0)`,
        totalValue: sql<number>`COALESCE(SUM(${portfolio.quantity_owned} * ${stocks.current_price}), 0)`,
        holdingsCount: sql<number>`COUNT(*)`
      })
      .from(portfolio)
      .innerJoin(stocks, eq(portfolio.stock_id, stocks.stock_id))
      .where(eq(portfolio.user_id, userId));

    const summary = portfolioData[0];
    const totalGainLoss = summary.totalValue - summary.totalInvested;
    const totalGainLossPercent = summary.totalInvested > 0 ? (totalGainLoss / summary.totalInvested) * 100 : 0;

    return {
      totalValue: summary.totalValue,
      totalInvested: summary.totalInvested,
      totalGainLoss,
      totalGainLossPercent,
      holdingsCount: summary.holdingsCount
    };
  }

  async getSectorAllocation(userId: number): Promise<{ sector_name: string; sector_value: number; stock_count: number }[]> {
    const sectorData = await db
      .select({
        sector_name: sectors.sector_name,
        sector_value: sql<number>`SUM(${portfolio.quantity_owned} * ${stocks.current_price})`,
        stock_count: sql<number>`COUNT(*)`
      })
      .from(portfolio)
      .innerJoin(stocks, eq(portfolio.stock_id, stocks.stock_id))
      .innerJoin(sectors, eq(stocks.sector_id, sectors.sector_id))
      .where(eq(portfolio.user_id, userId))
      .groupBy(sectors.sector_id, sectors.sector_name)
      .orderBy(desc(sql`SUM(${portfolio.quantity_owned} * ${stocks.current_price})`));

    return sectorData;
  }

  // Competition operations
  async getAllCompetitions(): Promise<any[]> {
    const competitions = await db.select().from(trading_competitions).orderBy(trading_competitions.start_date);
    return competitions;
  }

  async getUserParticipations(userId: number): Promise<any[]> {
    const participations = await db
      .select({
        participant_id: competition_participants.participant_id,
        competition_id: competition_participants.competition_id,
        user_id: competition_participants.user_id,
        entry_date: competition_participants.joined_at,
        current_portfolio_value: competition_participants.current_portfolio_value,
        rank: competition_participants.rank,
        is_active: sql`true`, // Default to active
        competition_name: trading_competitions.competition_name
      })
      .from(competition_participants)
      .innerJoin(trading_competitions, eq(competition_participants.competition_id, trading_competitions.competition_id))
      .where(eq(competition_participants.user_id, userId))
      .orderBy(desc(competition_participants.joined_at));
    
    return participations;
  }

  async getCompetitionLeaderboard(competitionId: number): Promise<any[]> {
    const leaderboard = await db
      .select({
        participant_id: competition_participants.participant_id,
        competition_id: competition_participants.competition_id,
        user_id: competition_participants.user_id,
        entry_date: competition_participants.joined_at,
        current_portfolio_value: competition_participants.current_portfolio_value,
        rank: competition_participants.rank,
        username: users1.username
      })
      .from(competition_participants)
      .innerJoin(users1, eq(competition_participants.user_id, users1.user_id))
      .where(eq(competition_participants.competition_id, competitionId))
      .orderBy(competition_participants.rank);
    
    return leaderboard;
  }

  async joinCompetition(userId: number, competitionId: number): Promise<any> {
    const [participation] = await db
      .insert(competition_participants)
      .values({
        user_id: userId,
        competition_id: competitionId,
        current_portfolio_value: '10000.00', // Starting virtual balance
        rank: 1
      })
      .returning();
    
    return participation;
  }

  // Alert operations
  async getUserAlerts(userId: number): Promise<any[]> {
    const alerts = await db
      .select({
        alert_id: stock_alerts.alert_id,
        user_id: stock_alerts.user_id,
        stock_id: stock_alerts.stock_id,
        alert_type: stock_alerts.alert_type,
        trigger_price: stock_alerts.target_value,
        condition_type: sql`'ABOVE'`,
        message: stock_alerts.message,
        is_active: sql`NOT ${stock_alerts.is_triggered}`,
        triggered_at: stock_alerts.triggered_at,
        created_at: stock_alerts.created_at,
        symbol: stocks.symbol,
        company_name: stocks.company_name,
        current_price: stocks.current_price
      })
      .from(stock_alerts)
      .innerJoin(stocks, eq(stock_alerts.stock_id, stocks.stock_id))
      .where(eq(stock_alerts.user_id, userId))
      .orderBy(desc(stock_alerts.created_at));
    
    return alerts.map(alert => ({
      ...alert,
      current_price: parseFloat(alert.current_price)
    }));
  }

  async createAlert(alert: any): Promise<any> {
    const [newAlert] = await db.insert(stock_alerts).values({
      user_id: alert.user_id,
      stock_id: alert.stock_id,
      alert_type: alert.alert_type,
      target_value: alert.trigger_price,
      message: alert.message
    }).returning();
    return newAlert;
  }

  async deleteAlert(alertId: number): Promise<void> {
    await db.delete(stock_alerts).where(eq(stock_alerts.alert_id, alertId));
  }

  async toggleAlert(alertId: number, isActive: boolean): Promise<void> {
    await db
      .update(stock_alerts)
      .set({ is_triggered: !isActive })
      .where(eq(stock_alerts.alert_id, alertId));
  }

  // Recommendation operations
  async getAllRecommendations(): Promise<any[]> {
    const recs = await db
      .select({
        recommendation_id: recommendations.recommendation_id,
        stock_id: recommendations.stock_id,
        analyst_name: sql`'AI Analysis'`,
        recommendation_type: recommendations.recommendation_type,
        target_price: recommendations.target_price,
        current_rating: sql`'A'`,
        analysis_summary: recommendations.reason,
        recommendation_date: recommendations.created_at,
        expiry_date: recommendations.expires_at,
        confidence_level: recommendations.confidence_score,
        created_at: recommendations.created_at,
        symbol: stocks.symbol,
        company_name: stocks.company_name,
        current_price: stocks.current_price,
        sector_name: sectors.sector_name
      })
      .from(recommendations)
      .innerJoin(stocks, eq(recommendations.stock_id, stocks.stock_id))
      .leftJoin(sectors, eq(stocks.sector_id, sectors.sector_id))
      .orderBy(desc(recommendations.created_at));
    
    return recs.map(rec => ({
      ...rec,
      current_price: parseFloat(rec.current_price),
      sector_name: rec.sector_name || 'Other'
    }));
  }

  async getRecommendation(recommendationId: number): Promise<any> {
    const [recommendation] = await db
      .select()
      .from(recommendations)
      .where(eq(recommendations.recommendation_id, recommendationId));
    
    return recommendation;
  }

  // Subscription operations
  async getCurrentSubscription(userId: number): Promise<any> {
    const [subscription] = await db
      .select()
      .from(user_subscriptions)
      .where(and(eq(user_subscriptions.user_id, userId), eq(user_subscriptions.status, 'ACTIVE')))
      .orderBy(desc(user_subscriptions.start_date));
    
    return subscription;
  }

  async getSubscriptionHistory(userId: number): Promise<any[]> {
    const history = await db
      .select()
      .from(user_subscriptions)
      .where(eq(user_subscriptions.user_id, userId))
      .orderBy(desc(user_subscriptions.start_date));
    
    return history;
  }

  async upgradeSubscription(userId: number, tierName: string, paymentMethod: string): Promise<any> {
    // Deactivate current subscription
    await db
      .update(user_subscriptions)
      .set({ status: 'INACTIVE', end_date: new Date() })
      .where(and(eq(user_subscriptions.user_id, userId), eq(user_subscriptions.status, 'ACTIVE')));

    // Create new subscription
    const [subscription] = await db
      .insert(user_subscriptions)
      .values({
        user_id: userId,
        subscription_type: tierName,
        payment_method: paymentMethod,
        payment_amount: '29.99',
        status: 'ACTIVE',
        auto_renewal: true
      })
      .returning();
    
    return subscription;
  }

  async cancelSubscription(userId: number): Promise<void> {
    await db
      .update(user_subscriptions)
      .set({ status: 'INACTIVE', auto_renewal: false, end_date: new Date() })
      .where(and(eq(user_subscriptions.user_id, userId), eq(user_subscriptions.status, 'ACTIVE')));
  }

  async updateUserSubscriptionTier(userId: number, tierName: string): Promise<void> {
    await db
      .update(users1)
      .set({ subscription_tier: tierName })
      .where(eq(users1.user_id, userId));
  }

  async initializeSampleData(): Promise<void> {
    // Check if data already exists
    const existingStocks = await db.select().from(stocks).limit(1);
    if (existingStocks.length > 0) {
      return;
    }

    // Insert sectors
    const sampleSectors = [
      { sector_name: 'Technology', sector_description: 'Technology and software companies', performance_ytd: '15.2' },
      { sector_name: 'Healthcare', sector_description: 'Healthcare and pharmaceutical companies', performance_ytd: '8.7' },
      { sector_name: 'Finance', sector_description: 'Banking and financial services', performance_ytd: '12.1' },
      { sector_name: 'Energy', sector_description: 'Oil, gas and renewable energy', performance_ytd: '-2.3' },
      { sector_name: 'Consumer', sector_description: 'Consumer goods and retail', performance_ytd: '6.8' }
    ];

    await db.insert(sectors).values(sampleSectors);

    // Insert sample stocks
    const sampleStocks = [
      {
        symbol: 'AAPL',
        company_name: 'Apple Inc.',
        sector_id: 1,
        current_price: '185.20',
        market_cap: 2900000000000,
        volume: 45000000,
        day_change: '2.50',
        day_change_percent: '1.37',
        pe_ratio: '28.5',
        dividend_yield: '0.51',
        year_high: '195.40',
        year_low: '124.17'
      },
      {
        symbol: 'MSFT',
        company_name: 'Microsoft Corporation',
        sector_id: 1,
        current_price: '340.50',
        market_cap: 2530000000000,
        volume: 25000000,
        day_change: '-1.20',
        day_change_percent: '-0.35',
        pe_ratio: '32.1',
        dividend_yield: '0.72',
        year_high: '348.10',
        year_low: '213.43'
      },
      {
        symbol: 'GOOGL',
        company_name: 'Alphabet Inc.',
        sector_id: 1,
        current_price: '125.30',
        market_cap: 1580000000000,
        volume: 35000000,
        day_change: '3.10',
        day_change_percent: '2.54',
        pe_ratio: '25.8',
        dividend_yield: '0.00',
        year_high: '151.55',
        year_low: '83.34'
      },
      {
        symbol: 'JNJ',
        company_name: 'Johnson & Johnson',
        sector_id: 2,
        current_price: '155.80',
        market_cap: 410000000000,
        volume: 18000000,
        day_change: '0.80',
        day_change_percent: '0.52',
        pe_ratio: '16.2',
        dividend_yield: '2.89',
        year_high: '181.83',
        year_low: '143.13'
      },
      {
        symbol: 'JPM',
        company_name: 'JPMorgan Chase & Co.',
        sector_id: 3,
        current_price: '142.30',
        market_cap: 418000000000,
        volume: 22000000,
        day_change: '-0.50',
        day_change_percent: '-0.35',
        pe_ratio: '12.8',
        dividend_yield: '3.12',
        year_high: '153.79',
        year_low: '104.40'
      }
    ];

    await db.insert(stocks).values(sampleStocks);

    console.log('Sample data initialized successfully');
  }
}

export const storage = new DatabaseStorage();
