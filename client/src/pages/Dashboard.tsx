import { useAuth } from "@/hooks/useAuth";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Charts } from "@/components/Charts";
import { useEffect } from "react";

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, {user.first_name || user.username}!
        </h1>
        <p className="text-muted-foreground">
          Here's your portfolio overview for today.
        </p>
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
