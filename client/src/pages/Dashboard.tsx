import { useAuth } from "@/hooks/useAuth";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Charts } from "@/components/Charts";
import { useEffect } from "react";
import { Link } from "wouter";

interface Transaction {
  transaction_id: number;
  transaction_type: string;
  quantity: number;
  transaction_price: string;
  total_amount: string;
  transaction_date: string;
  symbol: string;
  company_name: string;
}

interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  holdingsCount: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { portfolio } = usePortfolio();

  const { data: summary } = useQuery<PortfolioSummary>({
    queryKey: ['/api/portfolio/summary'],
    enabled: !!user
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    enabled: !!user
  });

  // Initialize sample data on first load
  useEffect(() => {
    const initializeData = async () => {
      try {
        await apiRequest('POST', '/api/initialize-data');
      } catch (error) {
        console.log('Sample data already exists or initialization failed');
      }
    };
    
    if (user) {
      initializeData();
    }
  }, [user]);

  if (!user) {
    return <div>Loading...</div>;
  }

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const accountBalance = parseFloat(user.account_balance || '0');
  const portfolioValue = summary?.totalValue || 0;
  const totalAccountValue = accountBalance + portfolioValue;
  const dayGainLoss = summary?.totalGainLoss || 0;
  const dayGainLossPercent = summary?.totalGainLossPercent || 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user.first_name || user.username}!
          </h1>
          <p className="text-muted-foreground">
            Here's your portfolio overview for today.
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-3">
          <Link href="/tables">
            <button className="trading-button-secondary px-4 py-2 text-sm font-medium">
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18m-9 8h9m-9 4h9" />
              </svg>
              View Tables
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-grid mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Account Balance</h3>
            <div className="w-4 h-4 rounded-full bg-sky-blue/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-sky-blue"></div>
            </div>
          </div>
          <p className="text-2xl font-bold currency">{formatCurrency(accountBalance)}</p>
          <p className="text-xs text-muted-foreground mt-1">Available to trade</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Portfolio Value</h3>
            <div className="w-4 h-4 rounded-full bg-success-green/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-success-green"></div>
            </div>
          </div>
          <p className="text-2xl font-bold currency">{formatCurrency(portfolioValue)}</p>
          <p className="text-xs text-muted-foreground mt-1">{summary?.holdingsCount || 0} holdings</p>
        </div>

        <div className={`stat-card ${dayGainLoss >= 0 ? '' : 'negative'}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Today's P&L</h3>
            <div className={`w-4 h-4 rounded-full ${dayGainLoss >= 0 ? 'bg-success-green/20' : 'bg-danger-red/20'} flex items-center justify-center`}>
              <div className={`w-2 h-2 rounded-full ${dayGainLoss >= 0 ? 'bg-success-green' : 'bg-danger-red'}`}></div>
            </div>
          </div>
          <p className={`text-2xl font-bold currency ${dayGainLoss >= 0 ? 'price-positive' : 'price-negative'}`}>
            {dayGainLoss >= 0 ? '+' : ''}{formatCurrency(dayGainLoss)}
          </p>
          <p className={`text-xs mt-1 percentage ${dayGainLoss >= 0 ? 'price-positive' : 'price-negative'}`}>
            {dayGainLoss >= 0 ? '+' : ''}{dayGainLossPercent.toFixed(2)}%
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Value</h3>
            <div className="w-4 h-4 rounded-full bg-accent-gold/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-accent-gold"></div>
            </div>
          </div>
          <p className="text-2xl font-bold currency">{formatCurrency(totalAccountValue)}</p>
          <p className="text-xs text-muted-foreground mt-1">Cash + Investments</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Charts />
      </div>

      {/* Quick Access Section */}
      <div className="trading-card mb-8">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">Quick Access</h3>
          <p className="text-sm text-muted-foreground">Navigate to different sections of your trading platform</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/tables">
            <div className="p-4 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18m-9 8h9m-9 4h9" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Tables Overview</h4>
                  <p className="text-xs text-muted-foreground">View data tables</p>
                </div>
              </div>
            </div>
          </Link>
          
          <Link href="/portfolio">
            <div className="p-4 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success-green/10 flex items-center justify-center group-hover:bg-success-green/20 transition-colors">
                  <svg className="w-5 h-5 text-success-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Portfolio</h4>
                  <p className="text-xs text-muted-foreground">Manage holdings</p>
                </div>
              </div>
            </div>
          </Link>
          
          <Link href="/stocks">
            <div className="p-4 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-blue/10 flex items-center justify-center group-hover:bg-sky-blue/20 transition-colors">
                  <svg className="w-5 h-5 text-sky-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Stocks</h4>
                  <p className="text-xs text-muted-foreground">Browse markets</p>
                </div>
              </div>
            </div>
          </Link>
          
          <Link href="/analytics">
            <div className="p-4 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-gold/10 flex items-center justify-center group-hover:bg-accent-gold/20 transition-colors">
                  <svg className="w-5 h-5 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Analytics</h4>
                  <p className="text-xs text-muted-foreground">View insights</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="trading-card">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Your latest transactions and trades</p>
        </div>

        {!transactions || transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-muted-foreground">No transactions yet</p>
            <p className="text-sm text-muted-foreground mt-1">Start trading to see your activity here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="trading-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Action</th>
                  <th>Stock</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 10).map((transaction) => (
                  <tr key={transaction.transaction_id}>
                    <td className="text-sm">{formatDate(transaction.transaction_date)}</td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.transaction_type === 'BUY' 
                          ? 'bg-success-green/10 text-success-green' 
                          : 'bg-danger-red/10 text-danger-red'
                      }`}>
                        {transaction.transaction_type}
                      </span>
                    </td>
                    <td>
                      <div>
                        <div className="font-medium text-foreground">{transaction.symbol}</div>
                        <div className="text-xs text-muted-foreground">{transaction.company_name}</div>
                      </div>
                    </td>
                    <td className="currency">{transaction.quantity}</td>
                    <td className="currency">{formatCurrency(transaction.transaction_price)}</td>
                    <td className="currency">{formatCurrency(transaction.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}