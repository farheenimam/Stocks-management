import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { usePortfolio } from "@/hooks/usePortfolio";
import { Charts } from "@/components/Charts";
import { formatCurrency, formatPercentage, getChangeClass } from "@/lib/utils";

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

interface Transaction {
  transaction_id: number;
  transaction_type: string;
  quantity: number;
  transaction_price: string;
  total_amount: string;
  transaction_date: string;
  symbol: string;
  company_name: string;
  realized_gain_loss?: string;
}

export default function Analytics() {
  const { user } = useAuth();
  const { portfolio } = usePortfolio();

  const { data: summary } = useQuery<PortfolioSummary>({
    queryKey: ['/api/portfolio/summary'],
    enabled: !!user
  });

  const { data: sectorAllocation } = useQuery<SectorAllocation[]>({
    queryKey: ['/api/portfolio/sector-allocation'],
    enabled: !!user
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    enabled: !!user
  });

  // Calculate analytics metrics
  const calculateMetrics = () => {
    if (!portfolio || !summary) {
      return {
        bestPerformer: null,
        worstPerformer: null,
        totalReturn: 0,
        totalReturnPercent: 0,
        diversificationScore: 0,
        averageGainLoss: 0
      };
    }

    // Find best and worst performers
    let bestPerformer = null;
    let worstPerformer = null;
    let bestGainLoss = -Infinity;
    let worstGainLoss = Infinity;

    portfolio.forEach(holding => {
      const currentValue = holding.quantity_owned * holding.current_price;
      const totalInvested = parseFloat(holding.total_invested);
      const gainLoss = currentValue - totalInvested;
      const gainLossPercent = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

      if (gainLossPercent > bestGainLoss) {
        bestGainLoss = gainLossPercent;
        bestPerformer = { ...holding, gainLossPercent };
      }

      if (gainLossPercent < worstGainLoss) {
        worstGainLoss = gainLossPercent;
        worstPerformer = { ...holding, gainLossPercent };
      }
    });

    // Calculate diversification score (based on number of sectors)
    const uniqueSectors = new Set(portfolio.map(h => h.sector_name).filter(Boolean));
    const diversificationScore = Math.min((uniqueSectors.size / 5) * 100, 100); // Max score at 5+ sectors

    // Calculate average gain/loss per holding
    const averageGainLoss = portfolio.length > 0 
      ? portfolio.reduce((sum, holding) => {
          const currentValue = holding.quantity_owned * holding.current_price;
          const totalInvested = parseFloat(holding.total_invested);
          return sum + (currentValue - totalInvested);
        }, 0) / portfolio.length
      : 0;

    return {
      bestPerformer,
      worstPerformer,
      totalReturn: summary.totalGainLoss,
      totalReturnPercent: summary.totalGainLossPercent,
      diversificationScore,
      averageGainLoss
    };
  };

  const metrics = calculateMetrics();

  // Calculate realized P&L from transactions
  const realizedPnL = transactions?.reduce((sum, transaction) => {
    if (transaction.transaction_type === 'SELL' && transaction.realized_gain_loss) {
      return sum + parseFloat(transaction.realized_gain_loss);
    }
    return sum;
  }, 0) || 0;

  // Calculate trading activity metrics
  const tradingActivity = {
    totalTrades: transactions?.length || 0,
    buyTrades: transactions?.filter(t => t.transaction_type === 'BUY').length || 0,
    sellTrades: transactions?.filter(t => t.transaction_type === 'SELL').length || 0,
    totalVolume: transactions?.reduce((sum, t) => sum + parseFloat(t.total_amount), 0) || 0
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Portfolio Analytics</h1>
        <p className="text-muted-foreground">
          Detailed insights and performance analysis of your investments
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="dashboard-grid mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Return</h3>
            <div className={`w-4 h-4 rounded-full ${metrics.totalReturn >= 0 ? 'bg-success-green/20' : 'bg-danger-red/20'} flex items-center justify-center`}>
              <div className={`w-2 h-2 rounded-full ${metrics.totalReturn >= 0 ? 'bg-success-green' : 'bg-danger-red'}`}></div>
            </div>
          </div>
          <p className={`text-2xl font-bold currency ${getChangeClass(metrics.totalReturn)}`}>
            {formatCurrency(metrics.totalReturn)}
          </p>
          <p className={`text-xs mt-1 percentage ${getChangeClass(metrics.totalReturnPercent)}`}>
            {formatPercentage(metrics.totalReturnPercent)}
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Realized P&L</h3>
            <div className={`w-4 h-4 rounded-full ${realizedPnL >= 0 ? 'bg-success-green/20' : 'bg-danger-red/20'} flex items-center justify-center`}>
              <div className={`w-2 h-2 rounded-full ${realizedPnL >= 0 ? 'bg-success-green' : 'bg-danger-red'}`}></div>
            </div>
          </div>
          <p className={`text-2xl font-bold currency ${getChangeClass(realizedPnL)}`}>
            {formatCurrency(realizedPnL)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">From completed trades</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Diversification</h3>
            <div className="w-4 h-4 rounded-full bg-sky-blue/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-sky-blue"></div>
            </div>
          </div>
          <p className="text-2xl font-bold">{metrics.diversificationScore.toFixed(0)}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {sectorAllocation?.length || 0} sector{(sectorAllocation?.length || 0) !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Trading Volume</h3>
            <div className="w-4 h-4 rounded-full bg-accent-gold/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-accent-gold"></div>
            </div>
          </div>
          <p className="text-2xl font-bold currency">{formatCurrency(tradingActivity.totalVolume)}</p>
          <p className="text-xs text-muted-foreground mt-1">{tradingActivity.totalTrades} total trades</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Charts />
      </div>

      {/* Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Best & Worst Performers */}
        <div className="trading-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Top Performers</h3>
          {!portfolio || portfolio.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No holdings to analyze</p>
            </div>
          ) : (
            <div className="space-y-4">
              {metrics.bestPerformer && (
                <div className="p-4 bg-success-green/10 rounded-lg border border-success-green/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-foreground">{metrics.bestPerformer.symbol}</h4>
                      <p className="text-sm text-muted-foreground">{metrics.bestPerformer.company_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold price-positive">
                        +{metrics.bestPerformer.gainLossPercent.toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Best performer</p>
                    </div>
                  </div>
                </div>
              )}
              
              {metrics.worstPerformer && (
                <div className="p-4 bg-danger-red/10 rounded-lg border border-danger-red/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-foreground">{metrics.worstPerformer.symbol}</h4>
                      <p className="text-sm text-muted-foreground">{metrics.worstPerformer.company_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold price-negative">
                        {metrics.worstPerformer.gainLossPercent.toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Needs attention</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Trading Activity */}
        <div className="trading-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Trading Activity</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Total Trades</span>
              <span className="font-medium">{tradingActivity.totalTrades}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Buy Orders</span>
              <span className="font-medium text-success-green">{tradingActivity.buyTrades}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Sell Orders</span>
              <span className="font-medium text-danger-red">{tradingActivity.sellTrades}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Total Volume</span>
              <span className="font-medium currency">{formatCurrency(tradingActivity.totalVolume)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sector Breakdown */}
      <div className="trading-card">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">Sector Breakdown</h3>
          <p className="text-sm text-muted-foreground">Distribution of your investments across sectors</p>
        </div>

        {!sectorAllocation || sectorAllocation.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No sector data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sectorAllocation.map((sector, index) => {
              const totalValue = summary?.totalValue || 1;
              const percentage = (sector.sector_value / totalValue) * 100;
              const colors = [
                'bg-primary-blue',
                'bg-success-green', 
                'bg-sky-blue',
                'bg-accent-gold',
                'bg-danger-red'
              ];
              
              return (
                <div key={sector.sector_name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                      <span className="font-medium text-foreground">{sector.sector_name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium currency">{formatCurrency(sector.sector_value)}</span>
                      <span className="text-sm text-muted-foreground ml-2">({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${colors[index % colors.length]}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{sector.stock_count} stock{sector.stock_count !== 1 ? 's' : ''}</span>
                    <span>{percentage.toFixed(1)}% of portfolio</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
