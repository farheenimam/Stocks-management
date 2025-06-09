import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TradingModalProps {
  stock: {
    stock_id: number;
    symbol: string;
    company_name: string;
    current_price: number;
    maxQuantity?: number;
  };
  action: 'BUY' | 'SELL';
  isOpen: boolean;
  onClose: () => void;
}

export default function TradingModal({ stock, action, isOpen, onClose }: TradingModalProps) {
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [quantity, setQuantity] = useState<string>('1');
  const [limitPrice, setLimitPrice] = useState<string>(stock.current_price.toString());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setOrderType('MARKET');
      setQuantity('1');
      setLimitPrice(stock.current_price.toString());
    }
  }, [isOpen, stock.current_price]);

  const executionPrice = orderType === 'MARKET' ? stock.current_price : parseFloat(limitPrice) || 0;
  const totalCost = parseInt(quantity) * executionPrice;

  const tradeMutation = useMutation({
    mutationFn: async (data: {
      stock_id: number;
      order_type: string;
      action: string;
      quantity: number;
      limit_price?: number;
    }) => {
      const response = await apiRequest('POST', '/api/orders', data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
        queryClient.invalidateQueries({ queryKey: ['/api/portfolio/summary'] });
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
        queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
        
        toast({
          title: "Order Executed",
          description: `Successfully ${action.toLowerCase()}ed ${quantity} shares of ${stock.symbol}.`,
        });
        onClose();
      } else {
        toast({
          title: "Order Failed",
          description: data.message || "Failed to execute order",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Order Failed",
        description: "Failed to execute order. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const quantityNum = parseInt(quantity);
    if (quantityNum <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity.",
        variant: "destructive",
      });
      return;
    }

    if (action === 'SELL' && stock.maxQuantity && quantityNum > stock.maxQuantity) {
      toast({
        title: "Insufficient Shares",
        description: `You only own ${stock.maxQuantity} shares.`,
        variant: "destructive",
      });
      return;
    }

    if (orderType === 'LIMIT' && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      toast({
        title: "Invalid Limit Price",
        description: "Please enter a valid limit price.",
        variant: "destructive",
      });
      return;
    }

    const orderData: any = {
      stock_id: stock.stock_id,
      order_type: orderType,
      action,
      quantity: quantityNum,
    };

    if (orderType === 'LIMIT') {
      orderData.limit_price = parseFloat(limitPrice);
    }

    tradeMutation.mutate(orderData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span className={action === 'BUY' ? 'text-success-green' : 'text-danger-red'}>
              {action}
            </span>
            <span>{stock.symbol}</span>
          </DialogTitle>
          <DialogDescription>
            {stock.company_name} • Current Price: {formatCurrency(stock.current_price)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="orderType">Order Type</Label>
              <Select value={orderType} onValueChange={(value: 'MARKET' | 'LIMIT') => setOrderType(value)}>
                <SelectTrigger className="trading-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MARKET">Market Order</SelectItem>
                  <SelectItem value="LIMIT">Limit Order</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={action === 'SELL' ? stock.maxQuantity : undefined}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="trading-input"
                required
              />
              {action === 'SELL' && stock.maxQuantity && (
                <p className="text-xs text-muted-foreground mt-1">
                  Max: {stock.maxQuantity} shares
                </p>
              )}
            </div>
          </div>

          {orderType === 'LIMIT' && (
            <div>
              <Label htmlFor="limitPrice">Limit Price</Label>
              <Input
                id="limitPrice"
                type="number"
                step="0.01"
                min="0.01"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="trading-input"
                required
              />
            </div>
          )}

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Estimated Total:</span>
              <span className="font-bold currency text-lg">
                {formatCurrency(totalCost)}
              </span>
            </div>
            {orderType === 'MARKET' && (
              <p className="text-xs text-muted-foreground mt-1">
                Market orders execute at the current market price
              </p>
            )}
          </div>

          <div className="flex space-x-3">
            <Button
              type="submit"
              disabled={tradeMutation.isPending}
              className={`flex-1 ${
                action === 'BUY' ? 'trading-button-primary' : 'trading-button-danger'
              }`}
            >
              {tradeMutation.isPending ? 'Processing...' : `${action} ${stock.symbol}`}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
