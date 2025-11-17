import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  final_amount: number;
  status: string;
  payment_status: string;
  profiles: { name: string; email: string } | null;
  order_items: Array<{
    product_name_snapshot: string;
    quantity: number;
    line_total: number;
  }>;
}

const OrdersManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const fetchOrders = async () => {
    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus as "pending" | "paid" | "shipped" | "completed" | "cancelled");
    }

    const { data: ordersData } = await query;
    
    if (ordersData) {
      const ordersWithDetails = await Promise.all(
        ordersData.map(async (order) => {
          const [profileData, itemsData] = await Promise.all([
            supabase.from("profiles").select("name, email").eq("id", order.user_id).single(),
            supabase.from("order_items").select("product_name_snapshot, quantity, line_total").eq("order_id", order.id)
          ]);
          
          return {
            ...order,
            profiles: profileData.data,
            order_items: itemsData.data || []
          };
        })
      );
      setOrders(ordersWithDetails as Order[]);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: "pending" | "paid" | "shipped" | "completed" | "cancelled") => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update order status");
    } else {
      toast.success("Order status updated successfully");
      fetchOrders();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "shipped":
        return "secondary";
      case "paid":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders Management</h1>
          <p className="text-muted-foreground">View and manage customer orders</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {order.profiles?.name || "Guest"} ({order.profiles?.email})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Badge variant={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                  <p className="text-lg font-bold">${order.final_amount.toFixed(2)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Order Items:</h4>
                  <div className="space-y-1">
                    {order.order_items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.product_name_snapshot} x {item.quantity}</span>
                        <span>${item.line_total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Update Status:</span>
                  <Select 
                    value={order.status} 
                    onValueChange={(value: "pending" | "paid" | "shipped" | "completed" | "cancelled") => updateOrderStatus(order.id, value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OrdersManagement;
