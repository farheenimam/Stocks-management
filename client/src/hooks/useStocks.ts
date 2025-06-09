import { useQuery } from "@tanstack/react-query";

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
  last_updated: string;
  sector_name?: string;
}

export function useStocks() {
  const { data: stocks, isLoading, error } = useQuery<Stock[]>({
    queryKey: ["/api/stocks"],
    staleTime: 30 * 1000, // 30 seconds for stock data
  });

  return {
    stocks,
    isLoading,
    error
  };
}
