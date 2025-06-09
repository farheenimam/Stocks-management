import { pgTable, text, serial, integer, boolean, decimal, timestamp, varchar, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users1 = pgTable("users1", {
  user_id: serial("user_id").primaryKey(),
  username: varchar("username", { length: 50 }).unique().notNull(),
  email: varchar("email", { length: 100 }).unique().notNull(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  first_name: varchar("first_name", { length: 50 }),
  last_name: varchar("last_name", { length: 50 }),
  phone: varchar("phone", { length: 20 }),
  date_of_birth: timestamp("date_of_birth", { mode: "date" }),
  account_balance: decimal("account_balance", { precision: 15, scale: 2 }).default("10000.00"),
  risk_tolerance: varchar("risk_tolerance", { length: 20 }),
  subscription_tier: varchar("subscription_tier", { length: 10 }).default("Free"),
  created_at: timestamp("created_at").defaultNow(),
  last_login: timestamp("last_login"),
  is_active: boolean("is_active").default(true)
});

// Sectors table
export const sectors = pgTable("sectors", {
  sector_id: serial("sector_id").primaryKey(),
  sector_name: varchar("sector_name", { length: 50 }).unique().notNull(),
  sector_description: text("sector_description"),
  performance_ytd: decimal("performance_ytd", { precision: 5, scale: 2 }),
  created_at: timestamp("created_at").defaultNow()
});

// Stocks table
export const stocks = pgTable("stocks", {
  stock_id: serial("stock_id").primaryKey(),
  symbol: varchar("symbol", { length: 10 }).unique().notNull(),
  company_name: varchar("company_name", { length: 100 }).notNull(),
  sector_id: integer("sector_id").references(() => sectors.sector_id),
  current_price: decimal("current_price", { precision: 10, scale: 2 }).notNull(),
  market_cap: bigint("market_cap", { mode: "number" }),
  volume: bigint("volume", { mode: "number" }),
  day_change: decimal("day_change", { precision: 8, scale: 2 }),
  day_change_percent: decimal("day_change_percent", { precision: 5, scale: 2 }),
  pe_ratio: decimal("pe_ratio", { precision: 8, scale: 2 }),
  dividend_yield: decimal("dividend_yield", { precision: 5, scale: 2 }),
  year_high: decimal("year_high", { precision: 10, scale: 2 }),
  year_low: decimal("year_low", { precision: 10, scale: 2 }),
  last_updated: timestamp("last_updated").defaultNow()
});

// Portfolio table
export const portfolio = pgTable("portfolio", {
  portfolio_id: serial("portfolio_id").primaryKey(),
  user_id: integer("user_id").references(() => users1.user_id).notNull(),
  stock_id: integer("stock_id").references(() => stocks.stock_id).notNull(),
  quantity_owned: integer("quantity_owned").notNull(),
  average_buy_price: decimal("average_buy_price", { precision: 10, scale: 2 }).notNull(),
  total_invested: decimal("total_invested", { precision: 15, scale: 2 }).notNull(),
  current_value: decimal("current_value", { precision: 15, scale: 2 }),
  unrealized_gain_loss: decimal("unrealized_gain_loss", { precision: 15, scale: 2 }),
  first_purchase_date: timestamp("first_purchase_date"),
  last_updated: timestamp("last_updated").defaultNow()
});

// Orders table
export const orders = pgTable("orders", {
  order_id: serial("order_id").primaryKey(),
  user_id: integer("user_id").references(() => users1.user_id).notNull(),
  stock_id: integer("stock_id").references(() => stocks.stock_id).notNull(),
  order_type: varchar("order_type", { length: 10 }).notNull(),
  action: varchar("action", { length: 4 }).notNull(),
  quantity: integer("quantity").notNull(),
  limit_price: decimal("limit_price", { precision: 10, scale: 2 }),
  stop_price: decimal("stop_price", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 10 }).default("PENDING"),
  order_date: timestamp("order_date").defaultNow(),
  execution_date: timestamp("execution_date"),
  expires_at: timestamp("expires_at")
});

// Transactions table
export const transactions = pgTable("transactions", {
  transaction_id: serial("transaction_id").primaryKey(),
  user_id: integer("user_id").references(() => users1.user_id).notNull(),
  stock_id: integer("stock_id").references(() => stocks.stock_id).notNull(),
  transaction_type: varchar("transaction_type", { length: 4 }).notNull(),
  quantity: integer("quantity").notNull(),
  transaction_price: decimal("transaction_price", { precision: 10, scale: 2 }).notNull(),
  total_amount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  commission_fee: decimal("commission_fee", { precision: 8, scale: 2 }).default("0.00"),
  transaction_date: timestamp("transaction_date").defaultNow(),
  order_id: integer("order_id").references(() => orders.order_id),
  realized_gain_loss: decimal("realized_gain_loss", { precision: 15, scale: 2 })
});

// Watchlists table
export const watchlists = pgTable("watchlists", {
  watchlist_id: serial("watchlist_id").primaryKey(),
  user_id: integer("user_id").references(() => users1.user_id).notNull(),
  stock_id: integer("stock_id").references(() => stocks.stock_id).notNull(),
  alert_price_high: decimal("alert_price_high", { precision: 10, scale: 2 }),
  alert_price_low: decimal("alert_price_low", { precision: 10, scale: 2 }),
  notes: text("notes"),
  added_date: timestamp("added_date").defaultNow()
});

// Stock alerts table
export const stock_alerts = pgTable("stock_alerts", {
  alert_id: serial("alert_id").primaryKey(),
  user_id: integer("user_id").references(() => users1.user_id).notNull(),
  stock_id: integer("stock_id").references(() => stocks.stock_id).notNull(),
  alert_type: varchar("alert_type", { length: 20 }).notNull(),
  target_value: decimal("target_value", { precision: 10, scale: 2 }),
  is_triggered: boolean("is_triggered").default(false),
  message: text("message"),
  created_at: timestamp("created_at").defaultNow(),
  triggered_at: timestamp("triggered_at")
});

// Trading competitions table
export const trading_competitions = pgTable("trading_competitions", {
  competition_id: serial("competition_id").primaryKey(),
  competition_name: varchar("competition_name", { length: 100 }).notNull(),
  description: text("description"),
  start_date: timestamp("start_date").notNull(),
  end_date: timestamp("end_date").notNull(),
  initial_balance: decimal("initial_balance", { precision: 15, scale: 2 }).default("100000.00"),
  entry_fee: decimal("entry_fee", { precision: 8, scale: 2 }).default("0.00"),
  prize_pool: decimal("prize_pool", { precision: 15, scale: 2 }),
  max_participants: integer("max_participants"),
  status: varchar("status", { length: 10 }).default("UPCOMING"),
  created_by: integer("created_by").references(() => users1.user_id),
  created_at: timestamp("created_at").defaultNow()
});

// Competition participants table
export const competition_participants = pgTable("competition_participants", {
  participant_id: serial("participant_id").primaryKey(),
  competition_id: integer("competition_id").references(() => trading_competitions.competition_id).notNull(),
  user_id: integer("user_id").references(() => users1.user_id).notNull(),
  virtual_balance: decimal("virtual_balance", { precision: 15, scale: 2 }),
  current_portfolio_value: decimal("current_portfolio_value", { precision: 15, scale: 2 }),
  total_return: decimal("total_return", { precision: 15, scale: 2 }),
  return_percentage: decimal("return_percentage", { precision: 8, scale: 2 }),
  rank: integer("rank"),
  joined_at: timestamp("joined_at").defaultNow()
});

// Recommendations table
export const recommendations = pgTable("recommendations", {
  recommendation_id: serial("recommendation_id").primaryKey(),
  user_id: integer("user_id").references(() => users1.user_id).notNull(),
  stock_id: integer("stock_id").references(() => stocks.stock_id).notNull(),
  recommendation_type: varchar("recommendation_type", { length: 5 }).notNull(),
  confidence_score: decimal("confidence_score", { precision: 3, scale: 2 }),
  reason: text("reason"),
  target_price: decimal("target_price", { precision: 10, scale: 2 }),
  algorithm_used: varchar("algorithm_used", { length: 50 }),
  created_at: timestamp("created_at").defaultNow(),
  expires_at: timestamp("expires_at"),
  is_viewed: boolean("is_viewed").default(false)
});

// User subscriptions table
export const user_subscriptions = pgTable("user_subscriptions", {
  subscription_id: serial("subscription_id").primaryKey(),
  user_id: integer("user_id").references(() => users1.user_id).notNull(),
  subscription_type: varchar("subscription_type", { length: 10 }).notNull(),
  start_date: timestamp("start_date").defaultNow(),
  end_date: timestamp("end_date").notNull(),
  payment_amount: decimal("payment_amount", { precision: 8, scale: 2 }).notNull(),
  payment_method: varchar("payment_method", { length: 50 }),
  auto_renewal: boolean("auto_renewal").default(true),
  status: varchar("status", { length: 10 }).default("ACTIVE"),
  created_at: timestamp("created_at").defaultNow()
});

// Relations
export const users1Relations = relations(users1, ({ many }) => ({
  portfolio: many(portfolio),
  orders: many(orders),
  transactions: many(transactions),
  watchlists: many(watchlists),
  stock_alerts: many(stock_alerts),
  recommendations: many(recommendations),
  user_subscriptions: many(user_subscriptions),
  competition_participants: many(competition_participants)
}));

export const sectorsRelations = relations(sectors, ({ many }) => ({
  stocks: many(stocks)
}));

export const stocksRelations = relations(stocks, ({ one, many }) => ({
  sector: one(sectors, {
    fields: [stocks.sector_id],
    references: [sectors.sector_id]
  }),
  portfolio: many(portfolio),
  orders: many(orders),
  transactions: many(transactions),
  watchlists: many(watchlists),
  stock_alerts: many(stock_alerts),
  recommendations: many(recommendations)
}));

export const portfolioRelations = relations(portfolio, ({ one }) => ({
  user: one(users1, {
    fields: [portfolio.user_id],
    references: [users1.user_id]
  }),
  stock: one(stocks, {
    fields: [portfolio.stock_id],
    references: [stocks.stock_id]
  })
}));

// Insert schemas
export const insertUser1Schema = createInsertSchema(users1).omit({
  user_id: true,
  created_at: true,
  last_login: true
});

export const insertStockSchema = createInsertSchema(stocks).omit({
  stock_id: true,
  last_updated: true
});

export const insertPortfolioSchema = createInsertSchema(portfolio).omit({
  portfolio_id: true,
  current_value: true,
  unrealized_gain_loss: true,
  last_updated: true
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  order_id: true,
  order_date: true,
  execution_date: true
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  transaction_id: true,
  transaction_date: true
});

export const insertWatchlistSchema = createInsertSchema(watchlists).omit({
  watchlist_id: true,
  added_date: true
});

// Types
export type User1 = typeof users1.$inferSelect;
export type InsertUser1 = z.infer<typeof insertUser1Schema>;

export type Sector = typeof sectors.$inferSelect;
export type InsertSector = typeof sectors.$inferInsert;

export type Stock = typeof stocks.$inferSelect;
export type InsertStock = z.infer<typeof insertStockSchema>;

export type Portfolio = typeof portfolio.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Watchlist = typeof watchlists.$inferSelect;
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;

export type StockAlert = typeof stock_alerts.$inferSelect;
export type TradingCompetition = typeof trading_competitions.$inferSelect;
export type CompetitionParticipant = typeof competition_participants.$inferSelect;
export type Recommendation = typeof recommendations.$inferSelect;
export type UserSubscription = typeof user_subscriptions.$inferSelect;
