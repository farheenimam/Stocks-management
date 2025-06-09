import { usePortfolio } from "@/hooks/usePortfolio";
import { useQuery } from "@tanstack/react-query";
import { Charts } from "@/components/Charts";
import TradingModal from "@/components/TradingModal";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/utils";

interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  holdingsCount: number;
}

interface SectorAllocation {
  sector_name: string;
  sector_value: number;
  stock_count: number;
}

export default function Portfolio() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { portfolio, isLoading } = usePortfolio();
  const [tradingStock, setTradingStock] = useState<any>(null);
  const [tradingAction, setTradingAction] = useState<'BUY' | 'SELL'>('BUY');
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to view your portfolio.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: summary } = useQuery<PortfolioSummary>({
    queryKey: ['/api/portfolio/summary'],
    enabled: !!user
  });

  const { data: sectorAllocation } = useQuery<SectorAllocation[]>({
    queryKey: ['/api/portfolio/sector-allocation'],
    enabled: !!user
  });

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const calculateCurrentValue = (holding: any) => {
    return holding.quantity_owned * parseFloat(holding.current_price);
  };

  const calculateGainLoss = (holding: any) => {
    const currentValue = calculateCurrentValue(holding);
    const totalInvested = parseFloat(holding.total_invested);
    return currentValue - totalInvested;
  };

  const calculateGainLossPercent = (holding: any) => {
    const gainLoss = calculateGainLoss(holding);
    const totalInvested = parseFloat(holding.total_invested);
    return totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;
  };

  const openTradingModal = (stock: any, action: 'BUY' | 'SELL') => {
    setTradingStock({
      stock_id: stock.stock_id,
      symbol: stock.symbol,
      company_name: stock.company_name,
      current_price: parseFloat(stock.current_price),
      maxQuantity: action === 'SELL' ? stock.quantity_owned : undefined
    });
    setTradingAction(action);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="loading-spinner w-8 h-8"></div>
        </div>
      </div>
    );
  }

  const accountBalance = parseFloat(user?.account_balance || '0');
  const portfolioValue = summary?.totalValue || 0;
  const totalAccountValue = accountBalance + portfolioValue;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">My Portfolio</h1>
        <p className="text-muted-foreground">
          Track your investments and manage your holdings
        </p>
      </div>

      {/* Portfolio Summary */}
      <div className="dashboard-grid mb-8">
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

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Invested</h3>
            <div className="w-4 h-4 rounded-full bg-sky-blue/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-sky-blue"></div>
            </div>
          </div>
          <p className="text-2xl font-bold currency">{formatCurrency(summary?.totalInvested || 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total cost basis</p>
        </div>

        <div className={`stat-card ${(summary?.totalGainLoss || 0) >= 0 ? '' : 'negative'}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Unrealized P&L</h3>
            <div className={`w-4 h-4 rounded-full ${(summary?.totalGainLoss || 0) >= 0 ? 'bg-success-green/20' : 'bg-danger-red/20'} flex items-center justify-center`}>
              <div className={`w-2 h-2 rounded-full ${(summary?.totalGainLoss || 0) >= 0 ? 'bg-success-green' : 'bg-danger-red'}`}></div>
            </div>
          </div>
          <p className={`text-2xl font-bold currency ${(summary?.totalGainLoss || 0) >= 0 ? 'price-positive' : 'price-negative'}`}>
            {(summary?.totalGainLoss || 0) >= 0 ? '+' : ''}{formatCurrency(summary?.totalGainLoss || 0)}
          </p>
          <p className={`text-xs mt-1 percentage ${(summary?.totalGainLoss || 0) >= 0 ? 'price-positive' : 'price-negative'}`}>
            {(summary?.totalGainLoss || 0) >= 0 ? '+' : ''}{(summary?.totalGainLossPercent || 0).toFixed(2)}%
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Holdings</h3>
            <div className="w-4 h-4 rounded-full bg-charcoal-gray/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-charcoal-gray"></div>
            </div>
          </div>
          <p className="text-2xl font-bold">{summary?.holdingsCount || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Unique positions</p>
        </div>
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Charts />
        
        {/* Sector Allocation */}
        <div className="trading-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Sector Allocation</h3>
          {!sectorAllocation || sectorAllocation.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No sector data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sectorAllocation.map((sector) => {
                const percentage = portfolioValue > 0 ? (sector.sector_value / portfolioValue) * 100 : 0;
                return (
                  <div key={sector.sector_name} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-foreground">{sector.sector_name}</span>
                        <span className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-sky-blue h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-muted-foreground">{sector.stock_count} stock{sector.stock_count !== 1 ? 's' : ''}</span>
                        <span className="text-xs currency text-muted-foreground">{formatCurrency(sector.sector_value)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Holdings Table */}
      <div className="trading-card">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">Current Holdings</h3>
          <p className="text-sm text-muted-foreground">Your active stock positions</p>
        </div>

        {!portfolio || portfolio.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-muted-foreground">No holdings yet</p>
            <p className="text-sm text-muted-foreground mt-1">Start trading to build your portfolio</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="trading-table">
              <thead>
                <tr>
                  <th>Stock</th>
                  <th>Shares</th>
                  <th>Avg. Cost</th>
                  <th>Current Price</th>
                  <th>Market Value</th>
                  <th>Unrealized P&L</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((holding) => {
                  const currentValue = calculateCurrentValue(holding);
                  const gainLoss = calculateGainLoss(holding);
                  const gainLossPercent = calculateGainLossPercent(holding);
                  
                  return (
                    <tr key={holding.portfolio_id}>
                      <td>
                        <div>
                          <div className="font-medium text-foreground">{holding.symbol}</div>
                          <div className="text-xs text-muted-foreground">{holding.company_name}</div>
                          {holding.sector_name && (
                            <div className="text-xs text-muted-foreground">{holding.sector_name}</div>
                          )}
                        </div>
                      </td>
                      <td className="currency">{holding.quantity_owned}</td>
                      <td className="currency">{formatCurrency(holding.average_buy_price)}</td>
                      <td className="currency">{formatCurrency(holding.current_price)}</td>
                      <td className="currency">{formatCurrency(currentValue)}</td>
                      <td>
                        <div className={gainLoss >= 0 ? 'price-positive' : 'price-negative'}>
                          <div className="currency font-medium">
                            {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)}
                          </div>
                          <div className="text-xs percentage">
                            {gainLoss >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openTradingModal(holding, 'BUY')}
                            className="trading-button-primary text-xs px-3 py-1"
                          >
                            Buy More
                          </button>
                          <button
                            onClick={() => openTradingModal(holding, 'SELL')}
                            className="trading-button-danger text-xs px-3 py-1"
                          >
                            Sell
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trading Modal */}
      {tradingStock && (
        <TradingModal
          stock={tradingStock}
          action={tradingAction}
          isOpen={!!tradingStock}
          onClose={() => setTradingStock(null)}
        />
      )}
    </div>
  );
}
