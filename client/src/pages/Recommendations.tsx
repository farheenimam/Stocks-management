import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Recommendation {
  recommendation_id: number;
  stock_id: number;
  analyst_name: string;
  recommendation_type: string;
  target_price: string;
  current_rating: string;
  analysis_summary: string;
  recommendation_date: string;
  expiry_date: string;
  confidence_level: string;
  created_at: string;
  symbol: string;
  company_name: string;
  current_price: number;
  sector_name: string;
}

export default function Recommendations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedRating, setSelectedRating] = useState("ALL");

  const { data: recommendations, isLoading } = useQuery<Recommendation[]>({
    queryKey: ['/api/recommendations'],
    enabled: !!user
  });

  const followRecommendationMutation = useMutation({
    mutationFn: async (recommendationId: number) => {
      return await apiRequest(`/api/recommendations/${recommendationId}/follow`, 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Added to your watchlist!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to follow recommendation",
        variant: "destructive",
      });
    }
  });

  const filteredRecommendations = recommendations?.filter(rec => {
    const categoryMatch = selectedCategory === "ALL" || rec.recommendation_type === selectedCategory;
    const ratingMatch = selectedRating === "ALL" || rec.current_rating === selectedRating;
    return categoryMatch && ratingMatch;
  }) || [];

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'BUY': return 'text-success-green bg-success-green/20';
      case 'SELL': return 'text-danger-red bg-danger-red/20';
      case 'HOLD': return 'text-accent-gold bg-accent-gold/20';
      case 'STRONG_BUY': return 'text-success-green bg-success-green/30 font-bold';
      case 'STRONG_SELL': return 'text-danger-red bg-danger-red/30 font-bold';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'text-success-green';
      case 'MEDIUM': return 'text-accent-gold';
      case 'LOW': return 'text-danger-red';
      default: return 'text-muted-foreground';
    }
  };

  const calculatePotentialReturn = (currentPrice: number, targetPrice: string) => {
    const target = parseFloat(targetPrice);
    return ((target - currentPrice) / currentPrice) * 100;
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Stock Recommendations</h1>
        <p className="text-muted-foreground">
          Expert analysis and recommendations from professional analysts
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div>
          <label className="block text-sm font-medium mb-2">Recommendation Type</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="trading-input"
          >
            <option value="ALL">All Types</option>
            <option value="STRONG_BUY">Strong Buy</option>
            <option value="BUY">Buy</option>
            <option value="HOLD">Hold</option>
            <option value="SELL">Sell</option>
            <option value="STRONG_SELL">Strong Sell</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Current Rating</label>
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="trading-input"
          >
            <option value="ALL">All Ratings</option>
            <option value="A+">A+</option>
            <option value="A">A</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B">B</option>
            <option value="B-">B-</option>
            <option value="C">C</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="trading-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Recommendations</h3>
          <p className="text-2xl font-bold text-foreground">{recommendations?.length || 0}</p>
        </div>
        <div className="trading-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Buy Signals</h3>
          <p className="text-2xl font-bold text-success-green">
            {recommendations?.filter(r => r.recommendation_type.includes('BUY')).length || 0}
          </p>
        </div>
        <div className="trading-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Sell Signals</h3>
          <p className="text-2xl font-bold text-danger-red">
            {recommendations?.filter(r => r.recommendation_type.includes('SELL')).length || 0}
          </p>
        </div>
        <div className="trading-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Hold Signals</h3>
          <p className="text-2xl font-bold text-accent-gold">
            {recommendations?.filter(r => r.recommendation_type === 'HOLD').length || 0}
          </p>
        </div>
      </div>

      {/* Recommendations List */}
      {filteredRecommendations.length > 0 ? (
        <div className="space-y-6">
          {filteredRecommendations.map((rec) => {
            const potentialReturn = calculatePotentialReturn(rec.current_price, rec.target_price);
            
            return (
              <div key={rec.recommendation_id} className="trading-card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-foreground">
                        {rec.symbol} - {rec.company_name}
                      </h3>
                      <span className={`px-3 py-1 rounded text-sm ${getRecommendationColor(rec.recommendation_type)}`}>
                        {rec.recommendation_type.replace('_', ' ')}
                      </span>
                      <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                        {rec.sector_name}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Current Price</p>
                        <p className="font-medium">{formatCurrency(rec.current_price)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Target Price</p>
                        <p className="font-medium">{formatCurrency(rec.target_price)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Potential Return</p>
                        <p className={`font-medium ${potentialReturn >= 0 ? 'text-success-green' : 'text-danger-red'}`}>
                          {potentialReturn >= 0 ? '+' : ''}{potentialReturn.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Rating</p>
                        <p className="font-medium">{rec.current_rating}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Confidence</p>
                        <p className={`font-medium ${getConfidenceColor(rec.confidence_level)}`}>
                          {rec.confidence_level}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-foreground mb-1">Analysis Summary:</p>
                      <p className="text-sm text-muted-foreground">{rec.analysis_summary}</p>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span>Analyst: <strong>{rec.analyst_name}</strong></span>
                      <span>Date: {formatDate(rec.recommendation_date)}</span>
                      <span>Expires: {formatDate(rec.expiry_date)}</span>
                    </div>
                  </div>

                  <div className="ml-6 flex flex-col gap-2">
                    <button
                      onClick={() => followRecommendationMutation.mutate(rec.recommendation_id)}
                      disabled={followRecommendationMutation.isPending}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50 text-sm"
                    >
                      Add to Watchlist
                    </button>
                    <button className="bg-muted text-muted-foreground px-4 py-2 rounded hover:bg-muted/80 text-sm">
                      View Details
                    </button>
                  </div>
                </div>

                {/* Progress bar for expiry */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">Time to Expiry</span>
                    <span className="text-xs text-muted-foreground">
                      {Math.max(0, Math.ceil((new Date(rec.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days left
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{
                        width: `${Math.max(0, Math.min(100, 
                          ((new Date(rec.expiry_date).getTime() - new Date().getTime()) / 
                           (new Date(rec.expiry_date).getTime() - new Date(rec.recommendation_date).getTime())) * 100
                        ))}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="trading-card p-8 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-muted-foreground mb-2">No recommendations found</p>
          <p className="text-sm text-muted-foreground">
            {selectedCategory !== "ALL" || selectedRating !== "ALL" 
              ? "Try adjusting your filters to see more recommendations" 
              : "Check back later for new analyst recommendations"}
          </p>
        </div>
      )}
    </div>
  );
}