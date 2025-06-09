import { useState } from "react";
import { formatCurrency, formatNumber, getChangeClass } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import TradingModal from "./TradingModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Stock {
  stock_id: number;
  symbol: string;
  company_name: string;
  sector_id?: number;
  current_price: string;
  market_cap?: number;
  volume?: number;
  day_change?: string;
  day_change_percent?: string;
  pe_ratio?: string;
  dividend_yield?: string;
  year_high?: string;
  year_low?: string;
  sector_name?: string;
}

interface StockCardProps {
  stock: Stock;
}

export default function StockCard({ stock }: StockCardProps) {
  const [showTradingModal, setShowTradingModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentPrice = parseFloat(stock.current_price);
  const dayChange = parseFloat(stock.day_change || '0');
  const dayChangePercent = parseFloat(stock.day_change_percent || '0');

  const addToWatchlistMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/watchlist', { stock_id: stock.stock_id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
      toast({
        title: "Added to Watchlist",
        description: `${stock.symbol} has been added to your watchlist.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add stock to watchlist.",
        variant: "destructive",
      });
    }
  });

  const tradingStock = {
    stock_id: stock.stock_id,
    symbol: stock.symbol,
    company_name: stock.company_name,
    current_price: currentPrice
  };

  return (
    <>
      <div className="stock-card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-bold text-foreground">{stock.symbol}</h3>
              {stock.sector_name && (
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                  {stock.sector_name}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-tight">{stock.company_name}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold currency">{formatCurrency(currentPrice)}</p>
            <p className={`text-sm font-medium ${getChangeClass(dayChange)}`}>
              {dayChange >= 0 ? '+' : ''}{formatCurrency(dayChange)} ({dayChange >= 0 ? '+' : ''}{dayChangePercent.toFixed(2)}%)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-4">
          <div>
            <span className="block">Volume</span>
            <span className="font-medium text-foreground">{formatNumber(stock.volume || 0)}</span>
          </div>
          <div>
            <span className="block">Market Cap</span>
            <span className="font-medium text-foreground">{formatNumber(stock.market_cap || 0)}</span>
          </div>
          {stock.pe_ratio && (
            <div>
              <span className="block">P/E Ratio</span>
              <span className="font-medium text-foreground">{parseFloat(stock.pe_ratio).toFixed(2)}</span>
            </div>
          )}
          {stock.dividend_yield && (
            <div>
              <span className="block">Dividend</span>
              <span className="font-medium text-foreground">{parseFloat(stock.dividend_yield).toFixed(2)}%</span>
            </div>
          )}
        </div>

        {stock.year_high && stock.year_low && (
          <div className="mb-4">
            <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
              <span>52W Range</span>
              <span>{formatCurrency(stock.year_low)} - {formatCurrency(stock.year_high)}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-sky-blue h-2 rounded-full relative"
                style={{ 
                  width: `${((currentPrice - parseFloat(stock.year_low)) / (parseFloat(stock.year_high) - parseFloat(stock.year_low))) * 100}%` 
                }}
              >
                <div className="absolute right-0 top-0 w-1 h-2 bg-foreground rounded-full"></div>
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <Button
            onClick={() => setShowTradingModal(true)}
            className="flex-1 trading-button-primary text-sm"
          >
            Trade
          </Button>
          <Button
            onClick={() => addToWatchlistMutation.mutate()}
            disabled={addToWatchlistMutation.isPending}
            variant="outline"
            className="flex-1 text-sm"
          >
            {addToWatchlistMutation.isPending ? "Adding..." : "Watch"}
          </Button>
        </div>
      </div>

      {showTradingModal && (
        <TradingModal
          stock={tradingStock}
          action="BUY"
          isOpen={showTradingModal}
          onClose={() => setShowTradingModal(false)}
        />
      )}
    </>
  );
}
