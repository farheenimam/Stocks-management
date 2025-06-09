import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";

interface UserSubscription {
  subscription_id: number;
  user_id: number;
  tier_name: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  auto_renew: boolean;
  payment_method: string;
  created_at: string;
}

interface SubscriptionTier {
  tier_name: string;
  price: number;
  billing_cycle: string;
  features: string[];
  max_watchlist_items: number;
  max_alerts: number;
  research_access: boolean;
  priority_support: boolean;
  real_time_data: boolean;
}

const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    tier_name: "Free",
    price: 0,
    billing_cycle: "monthly",
    features: ["Basic stock quotes", "5 watchlist items", "3 price alerts", "Basic charts"],
    max_watchlist_items: 5,
    max_alerts: 3,
    research_access: false,
    priority_support: false,
    real_time_data: false
  },
  {
    tier_name: "Premium",
    price: 9.99,
    billing_cycle: "monthly",
    features: ["Real-time quotes", "50 watchlist items", "25 price alerts", "Advanced charts", "Market analysis"],
    max_watchlist_items: 50,
    max_alerts: 25,
    research_access: true,
    priority_support: false,
    real_time_data: true
  },
  {
    tier_name: "Pro",
    price: 19.99,
    billing_cycle: "monthly",
    features: ["Everything in Premium", "Unlimited watchlist", "Unlimited alerts", "Priority support", "Advanced analytics", "API access"],
    max_watchlist_items: -1,
    max_alerts: -1,
    research_access: true,
    priority_support: true,
    real_time_data: true
  }
];

export default function Subscriptions() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>("");

  const { data: subscription } = useQuery<UserSubscription>({
    queryKey: ['/api/subscriptions/current'],
    enabled: !!user
  });

  const { data: subscriptionHistory } = useQuery<UserSubscription[]>({
    queryKey: ['/api/subscriptions/history'],
    enabled: !!user
  });

  const upgradeMutation = useMutation({
    mutationFn: async ({ tierName, paymentMethod }: { tierName: string; paymentMethod: string }) => {
      return await apiRequest('/api/subscriptions/upgrade', 'POST', { tier_name: tierName, payment_method: paymentMethod });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subscription updated successfully!",
      });
      setShowUpgradeModal(false);
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription",
        variant: "destructive",
      });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/subscriptions/cancel', 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subscription cancelled successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/current'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    }
  });

  const currentTier = user?.subscription_tier || "Free";
  const currentTierData = SUBSCRIPTION_TIERS.find(tier => tier.tier_name === currentTier);

  const handleUpgrade = (tierName: string) => {
    setSelectedTier(tierName);
    setShowUpgradeModal(true);
  };

  const confirmUpgrade = (paymentMethod: string) => {
    upgradeMutation.mutate({ tierName: selectedTier, paymentMethod });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Subscription Plans</h1>
        <p className="text-muted-foreground">
          Choose the plan that best fits your trading needs
        </p>
      </div>

      {/* Current Subscription */}
      {subscription && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Current Subscription</h2>
          <div className="trading-card p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {subscription.tier_name} Plan
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className={`font-medium ${subscription.is_active ? 'text-success-green' : 'text-danger-red'}`}>
                      {subscription.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Start Date</p>
                    <p className="font-medium">{formatDate(subscription.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">End Date</p>
                    <p className="font-medium">
                      {subscription.end_date ? formatDate(subscription.end_date) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Auto Renew</p>
                    <p className="font-medium">
                      {subscription.auto_renew ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Payment Method: {subscription.payment_method}
                </p>
              </div>
              {subscription.is_active && subscription.tier_name !== "Free" && (
                <button
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  className="bg-danger-red text-white px-4 py-2 rounded hover:bg-danger-red/90 disabled:opacity-50"
                >
                  {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Subscription'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subscription Plans */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-6">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SUBSCRIPTION_TIERS.map((tier) => (
            <div 
              key={tier.tier_name} 
              className={`trading-card p-6 relative ${
                tier.tier_name === currentTier ? 'ring-2 ring-primary' : ''
              }`}
            >
              {tier.tier_name === currentTier && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded text-sm">
                  Current Plan
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">{tier.tier_name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-foreground">
                    {tier.price === 0 ? 'Free' : `$${tier.price}`}
                  </span>
                  {tier.price > 0 && (
                    <span className="text-muted-foreground">/{tier.billing_cycle}</span>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {tier.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-success-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Watchlist Items:</span>
                  <span className="font-medium">
                    {tier.max_watchlist_items === -1 ? 'Unlimited' : tier.max_watchlist_items}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price Alerts:</span>
                  <span className="font-medium">
                    {tier.max_alerts === -1 ? 'Unlimited' : tier.max_alerts}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Real-time Data:</span>
                  <span className="font-medium">
                    {tier.real_time_data ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority Support:</span>
                  <span className="font-medium">
                    {tier.priority_support ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {tier.tier_name !== currentTier && (
                <button
                  onClick={() => handleUpgrade(tier.tier_name)}
                  className={`w-full py-2 px-4 rounded font-medium ${
                    tier.tier_name === "Free" 
                      ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                  disabled={tier.tier_name === "Free"}
                >
                  {tier.tier_name === "Free" ? 'Current Plan' : 
                   tier.price === 0 ? 'Downgrade' : 'Upgrade'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Subscription History */}
      {subscriptionHistory && subscriptionHistory.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Subscription History</h2>
          <div className="space-y-3">
            {subscriptionHistory.map((sub) => (
              <div key={sub.subscription_id} className="trading-card p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-foreground">{sub.tier_name} Plan</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(sub.start_date)} - {sub.end_date ? formatDate(sub.end_date) : 'Ongoing'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    sub.is_active ? 'bg-success-green/20 text-success-green' : 'bg-muted text-muted-foreground'
                  }`}>
                    {sub.is_active ? 'Active' : 'Expired'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Upgrade to {selectedTier}</h3>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-muted-foreground mb-4">
                You're about to upgrade to the {selectedTier} plan. Choose your payment method:
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => confirmUpgrade('Credit Card')}
                  disabled={upgradeMutation.isPending}
                  className="w-full bg-primary text-primary-foreground p-3 rounded hover:bg-primary/90 disabled:opacity-50"
                >
                  {upgradeMutation.isPending ? 'Processing...' : 'Pay with Credit Card'}
                </button>
                <button
                  onClick={() => confirmUpgrade('PayPal')}
                  disabled={upgradeMutation.isPending}
                  className="w-full bg-sky-blue text-white p-3 rounded hover:bg-sky-blue/90 disabled:opacity-50"
                >
                  {upgradeMutation.isPending ? 'Processing...' : 'Pay with PayPal'}
                </button>
                <button
                  onClick={() => confirmUpgrade('Bank Transfer')}
                  disabled={upgradeMutation.isPending}
                  className="w-full bg-muted text-muted-foreground p-3 rounded hover:bg-muted/80 disabled:opacity-50"
                >
                  {upgradeMutation.isPending ? 'Processing...' : 'Bank Transfer'}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 bg-muted text-muted-foreground px-4 py-2 rounded hover:bg-muted/80"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Features Comparison */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-6">Feature Comparison</h2>
        <div className="trading-card p-6 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3">Feature</th>
                <th className="text-center py-3">Free</th>
                <th className="text-center py-3">Premium</th>
                <th className="text-center py-3">Pro</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-3">Watchlist Items</td>
                <td className="text-center py-3">5</td>
                <td className="text-center py-3">50</td>
                <td className="text-center py-3">Unlimited</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-3">Price Alerts</td>
                <td className="text-center py-3">3</td>
                <td className="text-center py-3">25</td>
                <td className="text-center py-3">Unlimited</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-3">Real-time Data</td>
                <td className="text-center py-3">✗</td>
                <td className="text-center py-3 text-success-green">✓</td>
                <td className="text-center py-3 text-success-green">✓</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-3">Research Access</td>
                <td className="text-center py-3">✗</td>
                <td className="text-center py-3 text-success-green">✓</td>
                <td className="text-center py-3 text-success-green">✓</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-3">Priority Support</td>
                <td className="text-center py-3">✗</td>
                <td className="text-center py-3">✗</td>
                <td className="text-center py-3 text-success-green">✓</td>
              </tr>
              <tr>
                <td className="py-3">API Access</td>
                <td className="text-center py-3">✗</td>
                <td className="text-center py-3">✗</td>
                <td className="text-center py-3 text-success-green">✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}