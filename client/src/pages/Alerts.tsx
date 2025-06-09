import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useStocks } from "@/hooks/useStocks";

interface StockAlert {
  alert_id: number;
  user_id: number;
  stock_id: number;
  alert_type: string;
  trigger_price: string;
  condition_type: string;
  message: string;
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
  symbol: string;
  company_name: string;
  current_price: number;
}

export default function Alerts() {
  const { user, isAuthenticated } = useAuth();
  const { stocks } = useStocks();
  const { toast } = useToast();
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [selectedStock, setSelectedStock] = useState("");
  const [alertType, setAlertType] = useState("PRICE");
  const [conditionType, setConditionType] = useState("ABOVE");
  const [triggerPrice, setTriggerPrice] = useState("");
  const [message, setMessage] = useState("");

  const { data: alerts, isLoading } = useQuery<StockAlert[]>({
    queryKey: ['/api/alerts'],
    enabled: !!user
  });

  const createAlertMutation = useMutation({
    mutationFn: async (alertData: any) => {
      return await apiRequest('/api/alerts', 'POST', alertData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Alert created successfully!",
      });
      setShowCreateAlert(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create alert",
        variant: "destructive",
      });
    }
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      return await apiRequest(`/api/alerts/${alertId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Alert deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete alert",
        variant: "destructive",
      });
    }
  });

  const toggleAlertMutation = useMutation({
    mutationFn: async ({ alertId, isActive }: { alertId: number; isActive: boolean }) => {
      return await apiRequest(`/api/alerts/${alertId}/toggle`, 'PUT', { is_active: isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update alert",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setSelectedStock("");
    setAlertType("PRICE");
    setConditionType("ABOVE");
    setTriggerPrice("");
    setMessage("");
  };

  const handleCreateAlert = () => {
    if (!selectedStock || !triggerPrice) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createAlertMutation.mutate({
      stock_id: parseInt(selectedStock),
      alert_type: alertType,
      trigger_price: parseFloat(triggerPrice),
      condition_type: conditionType,
      message: message || `${conditionType.toLowerCase()} ${triggerPrice}`
    });
  };

  const activeAlerts = alerts?.filter(alert => alert.is_active && !alert.triggered_at) || [];
  const triggeredAlerts = alerts?.filter(alert => alert.triggered_at) || [];
  const inactiveAlerts = alerts?.filter(alert => !alert.is_active && !alert.triggered_at) || [];

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Price Alerts</h1>
            <p className="text-muted-foreground">
              Set up alerts to get notified when stocks reach your target prices
            </p>
          </div>
          <button
            onClick={() => setShowCreateAlert(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
          >
            Create Alert
          </button>
        </div>
      </div>

      {/* Alert Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="trading-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Active Alerts</h3>
          <p className="text-2xl font-bold text-success-green">{activeAlerts.length}</p>
        </div>
        <div className="trading-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Triggered Today</h3>
          <p className="text-2xl font-bold text-accent-gold">
            {triggeredAlerts.filter(alert => 
              alert.triggered_at && 
              new Date(alert.triggered_at).toDateString() === new Date().toDateString()
            ).length}
          </p>
        </div>
        <div className="trading-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Alerts</h3>
          <p className="text-2xl font-bold text-foreground">{alerts?.length || 0}</p>
        </div>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Active Alerts</h2>
          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <div key={alert.alert_id} className="trading-card p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">
                        {alert.symbol} - {alert.company_name}
                      </h3>
                      <span className="px-2 py-1 bg-success-green/20 text-success-green rounded text-xs">
                        Active
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Current Price</p>
                        <p className="font-medium">{formatCurrency(alert.current_price)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Trigger Price</p>
                        <p className="font-medium">{formatCurrency(alert.trigger_price)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Condition</p>
                        <p className="font-medium">{alert.condition_type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Created</p>
                        <p className="font-medium">{formatDate(alert.created_at)}</p>
                      </div>
                    </div>
                    {alert.message && (
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => toggleAlertMutation.mutate({ alertId: alert.alert_id, isActive: false })}
                      className="text-muted-foreground hover:text-foreground text-sm"
                      title="Disable alert"
                    >
                      Pause
                    </button>
                    <button
                      onClick={() => deleteAlertMutation.mutate(alert.alert_id)}
                      className="text-danger-red hover:text-danger-red/80 text-sm"
                      title="Delete alert"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Triggered Alerts */}
      {triggeredAlerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Triggered Alerts</h2>
          <div className="space-y-3">
            {triggeredAlerts.slice(0, 10).map((alert) => (
              <div key={alert.alert_id} className="trading-card p-4 border-l-4 border-accent-gold">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">
                        {alert.symbol} - {alert.company_name}
                      </h3>
                      <span className="px-2 py-1 bg-accent-gold/20 text-accent-gold rounded text-xs">
                        Triggered
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Trigger Price</p>
                        <p className="font-medium">{formatCurrency(alert.trigger_price)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Condition</p>
                        <p className="font-medium">{alert.condition_type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Triggered At</p>
                        <p className="font-medium">{formatDate(alert.triggered_at!)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Current Price</p>
                        <p className="font-medium">{formatCurrency(alert.current_price)}</p>
                      </div>
                    </div>
                    {alert.message && (
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteAlertMutation.mutate(alert.alert_id)}
                    className="text-muted-foreground hover:text-foreground text-sm ml-4"
                    title="Remove from history"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Alert Modal */}
      {showCreateAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Create Price Alert</h3>
              <button
                onClick={() => {
                  setShowCreateAlert(false);
                  resetForm();
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Stock</label>
                <select
                  value={selectedStock}
                  onChange={(e) => setSelectedStock(e.target.value)}
                  className="trading-input w-full"
                >
                  <option value="">Select a stock</option>
                  {stocks?.map((stock) => (
                    <option key={stock.stock_id} value={stock.stock_id}>
                      {stock.symbol} - {stock.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Alert Type</label>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value)}
                  className="trading-input w-full"
                >
                  <option value="PRICE">Price Alert</option>
                  <option value="VOLUME">Volume Alert</option>
                  <option value="CHANGE">Price Change Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Condition</label>
                <select
                  value={conditionType}
                  onChange={(e) => setConditionType(e.target.value)}
                  className="trading-input w-full"
                >
                  <option value="ABOVE">Above</option>
                  <option value="BELOW">Below</option>
                  <option value="EQUALS">Equals</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Trigger Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={triggerPrice}
                  onChange={(e) => setTriggerPrice(e.target.value)}
                  placeholder="0.00"
                  className="trading-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message (Optional)</label>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Custom alert message"
                  className="trading-input w-full"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateAlert(false);
                    resetForm();
                  }}
                  className="flex-1 bg-muted text-muted-foreground px-4 py-2 rounded hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAlert}
                  disabled={createAlertMutation.isPending}
                  className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50"
                >
                  {createAlertMutation.isPending ? 'Creating...' : 'Create Alert'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!alerts || alerts.length === 0) && (
        <div className="trading-card p-8 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-12" />
            </svg>
          </div>
          <p className="text-muted-foreground mb-2">No alerts created yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first alert to get notified when stocks reach your target prices
          </p>
          <button
            onClick={() => setShowCreateAlert(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
          >
            Create First Alert
          </button>
        </div>
      )}
    </div>
  );
}