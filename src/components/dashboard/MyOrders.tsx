import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Package } from "lucide-react";
import { Link } from "react-router-dom";

const MyOrders = () => {
  // Mock orders data
  const orders = [
    {
      id: "ORD-2024-001",
      date: "2024-01-15",
      status: "Delivered",
      total: 299.99,
      items: [
        { name: "Premium Headphones", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e" },
        { name: "Smart Watch", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30" },
      ],
    },
    {
      id: "ORD-2024-002",
      date: "2024-01-20",
      status: "Shipped",
      total: 149.99,
      items: [
        { name: "Wireless Mouse", image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f" },
      ],
    },
    {
      id: "ORD-2024-003",
      date: "2024-01-22",
      status: "Processing",
      total: 89.99,
      items: [
        { name: "USB-C Cable", image: "https://images.unsplash.com/photo-1560343090-f0409e92791a" },
      ],
    },
    {
      id: "ORD-2024-004",
      date: "2024-01-10",
      status: "Delivered",
      total: 399.99,
      items: [
        { name: "Laptop Stand", image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46" },
        { name: "Keyboard", image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3" },
      ],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "shipped": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "processing": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "cancelled": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Orders</h1>
          <p className="text-muted-foreground mt-1">Track and manage your orders</p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Package className="h-5 w-5" />
          <span className="font-semibold">{orders.length} Orders</span>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex -space-x-2">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden border-2 border-background shadow-sm">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="w-16 h-16 rounded-lg bg-muted border-2 border-background flex items-center justify-center">
                        <span className="text-sm font-semibold">+{order.items.length - 3}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-lg">{order.id}</h3>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{order.date}</p>
                    <div className="flex flex-wrap gap-1">
                      {order.items.map((item, idx) => (
                        <span key={idx} className="text-xs text-muted-foreground">
                          {item.name}{idx < order.items.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">${order.total}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/dashboard/orders/${order.id}`}>
                      View Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MyOrders;
