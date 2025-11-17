import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Package } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Order {
  id: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  status: string;
  created_at: string;
  order_items: Array<{
    product_name_snapshot: string;
    quantity: number;
    product_price_snapshot: number;
    line_total: number;
  }>;
}

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    if (!orderId) return;

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          product_name_snapshot,
          quantity,
          product_price_snapshot,
          line_total
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Error loading order:', error);
      setLoading(false);
      return;
    }

    setOrder(data as Order);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-6">We couldn't find this order</p>
            <Button onClick={() => navigate('/')}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <Card className="border-border/50 shadow-lg">
          <CardContent className="pt-8">
            {/* Success Icon */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
              <p className="text-muted-foreground">
                Thank you for your order. We've sent a confirmation email to your inbox.
              </p>
            </div>

            {/* Order Details */}
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order Number</p>
                    <p className="font-mono font-medium">{order.id.split('-')[0].toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Order Date</p>
                    <p className="font-medium">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Order Items */}
                <div className="space-y-3">
                  <p className="font-medium mb-3">Order Items</p>
                  {order.order_items.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name_snapshot}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity} × ${item.product_price_snapshot}
                        </p>
                      </div>
                      <p className="font-medium">${item.line_total.toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Order Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${order.total_amount.toFixed(2)}</span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-${order.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${order.final_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Order Status */}
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Your order is being processed
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                      We'll send you shipping updates via email once your order ships.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/products')}
                >
                  Continue Shopping
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => navigate('/')}
                >
                  Back to Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderConfirmation;
