import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import TradingModal from "@/components/TradingModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useStocks } from "@/hooks/useStocks";

interface WatchlistItem {
  watchlist_id: number;
  user_id: number;
  stock_id: number;
  alert_price_high?: string;
  alert_price_low?: string;
  notes?: string;
  added_date: string;
  symbol: string;
  company_name: string;
  current_price: number;
  day_change?: number;
  day_change_percent?: number;
}

export default function Watchlist() {
  const { user } = useAuth();
  const { stocks } = useStocks();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [tradingStock, setTradingStock] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedStock, setSelectedStock] = useState("");
  const [alertHigh, setAlertHigh] = useState("");
  const [alertLow, setAlertLow] = useState("");
  const [notes, setNotes] = useState("");

  const { data: watchlist, isLoading } = useQuery<WatchlistItem[]>({
    queryKey: ['/api/watchlist'],
    enabled: !!user
  });

  const addToWatchlistMutation = useMutation({
    mutationFn: async (data: { stock_id: number; alert_price_high?: number; alert_price_low?: number; notes?: string }) => {
      await apiRequest('POST', '/api/watchlist', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
      toast({
        title: "Success",
        description: "Stock added to watchlist",
      });
      setShowAddForm(false);
      setSelectedStock("");
      setAlertHigh("");
      setAlertLow("");
      setNotes("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add stock to watchlist",
        variant: "destructive",
      });
    }
  });

  const removeFromWatchlistMutation = useMutation({
    mutationFn: async (stockId: number) => {
      await apiRequest('DELETE', `/api/watchlist/${stockId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
      toast({
        title: "Success",
        description: "Stock removed from watchlist",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove stock from watchlist",
        variant: "destructive",
      });
    }
  });

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

  const handleAddToWatchlist = () => {
    if (!selectedStock) return;

    const data: any = {
      stock_id: parseInt(selectedStock)
    };

    if (alertHigh) data.alert_price_high = parseFloat(alertHigh);
    if (alertLow) data.alert_price_low = parseFloat(alertLow);
    if (notes) data.notes = notes;

    addToWatchlistMutation.mutate(data);
  };

  const openTradingModal = (item: WatchlistItem) => {
    setTradingStock({
      stock_id: item.stock_id,
      symbol: item.symbol,
      company_name: item.company_name,
      current_price: item.current_price
    });
  };

  const availableStocks = stocks?.filter(stock => 
    !watchlist?.some(item => item.stock_id === stock.stock_id)
  ) || [];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="loading-spinner w-8 h-8"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">My Watchlist</h1>
            <p className="text-muted-foreground">
              Monitor stocks you're interested in and set price alerts
            </p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="trading-button-primary"
          >
            Add Stock
          </Button>
        </div>
      </div>

      {/* Add Stock Form */}
      {showAddForm && (
        <div className="trading-card mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Add Stock to Watchlist</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="stock-select">Select Stock</Label>
                <select
                  id="stock-select"
                  value={selectedStock}
                  onChange={(e) => setSelectedStock(e.target.value)}
                  className="trading-input"
                >
                  <option value="">Choose a stock...</option>
                  {availableStocks.map((stock) => (
                    <option key={stock.stock_id} value={stock.stock_id}>
                      {stock.symbol} - {stock.company_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="alert-high">Price Alert (High)</Label>
                <Input
                  id="alert-high"
                  type="number"
                  step="0.01"
                  placeholder="Alert when price goes above..."
                  value={alertHigh}
                  onChange={(e) => setAlertHigh(e.target.value)}
                  className="trading-input"
                />
              </div>
              <div>
                <Label htmlFor="alert-low">Price Alert (Low)</Label>
                <Input
                  id="alert-low"
                  type="number"
                  step="0.01"
                  placeholder="Alert when price goes below..."
                  value={alertLow}
                  onChange={(e) => setAlertLow(e.target.value)}
                  className="trading-input"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  placeholder="Add your notes about this stock..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="trading-input h-32"
                  rows={4}
                />
              </div>
            </div>
          </div>
          <div className="flex space-x-4 mt-6">
            <Button
              onClick={handleAddToWatchlist}
              disabled={!selectedStock || addToWatchlistMutation.isPending}
              className="trading-button-primary"
            >
              {addToWatchlistMutation.isPending ? "Adding..." : "Add to Watchlist"}
            </Button>
            <Button
              onClick={() => setShowAddForm(false)}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Watchlist Table */}
      <div className="trading-card">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">Watched Stocks</h3>
          <p className="text-sm text-muted-foreground">
            {watchlist?.length || 0} stock{(watchlist?.length || 0) !== 1 ? 's' : ''} in your watchlist
          </p>
        </div>

        {!watchlist || watchlist.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <p className="text-muted-foreground">No stocks in your watchlist</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add stocks you're interested in to track their performance
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="trading-button-primary mt-4"
            >
              Add Your First Stock
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="trading-table">
              <thead>
                <tr>
                  <th>Stock</th>
                  <th>Current Price</th>
                  <th>Day Change</th>
                  <th>Price Alerts</th>
                  <th>Added</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((item) => (
                  <tr key={item.watchlist_id}>
                    <td>
                      <div>
                        <div className="font-medium text-foreground">{item.symbol}</div>
                        <div className="text-xs text-muted-foreground">{item.company_name}</div>
                      </div>
                    </td>
                    <td className="currency">{formatCurrency(item.current_price)}</td>
                    <td>
                      <div className={`${(item.day_change || 0) >= 0 ? 'price-positive' : 'price-negative'}`}>
                        <div className="currency">
                          {(item.day_change || 0) >= 0 ? '+' : ''}{formatCurrency(item.day_change || 0)}
                        </div>
                        <div className="text-xs percentage">
                          {Number(item.day_change_percent || 0) >= 0 ? '+' : ''}{Number(item.day_change_percent || 0).toFixed(2)}%
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-xs">
                        {item.alert_price_high && (
                          <div className="text-success-green">
                            High: {formatCurrency(item.alert_price_high)}
                          </div>
                        )}
                        {item.alert_price_low && (
                          <div className="text-danger-red">
                            Low: {formatCurrency(item.alert_price_low)}
                          </div>
                        )}
                        {!item.alert_price_high && !item.alert_price_low && (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </div>
                    </td>
                    <td className="text-sm">{formatDate(item.added_date)}</td>
                    <td>
                      <div className="text-xs text-muted-foreground max-w-32 truncate">
                        {item.notes || "No notes"}
                      </div>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openTradingModal(item)}
                          className="trading-button-primary text-xs px-3 py-1"
                        >
                          Trade
                        </button>
                        <button
                          onClick={() => removeFromWatchlistMutation.mutate(item.stock_id)}
                          disabled={removeFromWatchlistMutation.isPending}
                          className="text-xs px-3 py-1 text-danger-red hover:bg-danger-red/10 rounded transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trading Modal */}
      {tradingStock && (
        <TradingModal
          stock={tradingStock}
          action="BUY"
          isOpen={!!tradingStock}
          onClose={() => setTradingStock(null)}
        />
      )}
    </div>
  );
}
