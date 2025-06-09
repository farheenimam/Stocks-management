import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

interface PortfolioHolding {
  portfolio_id: number;
  user_id: number;
  stock_id: number;
  quantity_owned: number;
  average_buy_price: string;
  total_invested: string;
  current_value?: string;
  unrealized_gain_loss?: string;
  first_purchase_date?: string;
  last_updated: string;
  symbol: string;
  company_name: string;
  current_price: number;
  sector_name?: string;
}

export function usePortfolio() {
  const { user } = useAuth();

  const { data: portfolio, isLoading, error } = useQuery<PortfolioHolding[]>({
    queryKey: ["/api/portfolio"],
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    portfolio,
    isLoading,
    error
  };
}
