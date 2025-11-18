import { Package, Heart, MapPin, Tag, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const DashboardHome = () => {
  // Mock data
  const stats = [
    { label: "Orders Placed", value: 12, icon: Package, color: "text-blue-500" },
    { label: "Wishlist Items", value: 8, icon: Heart, color: "text-pink-500" },
    { label: "Saved Addresses", value: 3, icon: MapPin, color: "text-green-500" },
    { label: "Active Promotions", value: 2, icon: Tag, color: "text-purple-500" },
  ];

  const recentOrders = [
    {
      id: "ORD-2024-001",
      date: "2024-01-15",
      status: "Delivered",
      total: 299.99,
      items: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e", "https://images.unsplash.com/photo-1523275335684-37898b6baf30"],
    },
    {
      id: "ORD-2024-002",
      date: "2024-01-20",
      status: "Shipped",
      total: 149.99,
      items: ["https://images.unsplash.com/photo-1572635196237-14b3f281503f"],
    },
  ];

  const wishlistItems = [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f",
    "https://images.unsplash.com/photo-1560343090-f0409e92791a",
  ];

  const activePromo = {
    code: "WELCOME20",
    discount: "20% OFF",
    validUntil: "2024-12-31",
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "shipped": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="pt-6">
          <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
          <p className="text-muted-foreground">Here's a quick look at your activity.</p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/orders">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentOrders.map((order) => (
            <div key={order.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {order.items.map((img, idx) => (
                    <div key={idx} className="w-12 h-12 rounded-lg overflow-hidden border-2 border-background">
                      <img src={img} alt="Product" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div>
                  <p className="font-semibold">{order.id}</p>
                  <p className="text-sm text-muted-foreground">{order.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge className={getStatusColor(order.status)}>
                  {order.status}
                </Badge>
                <p className="font-semibold">${order.total}</p>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/dashboard/orders/${order.id}`}>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wishlist Preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Wishlist</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/wishlist">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {wishlistItems.map((img, idx) => (
                <div key={idx} className="aspect-square rounded-lg overflow-hidden hover:scale-105 transition-transform">
                  <img src={img} alt="Wishlist item" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Promotion */}
        <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-primary/30">
          <CardHeader>
            <CardTitle>Promotions for You</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-primary">{activePromo.discount}</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <p className="text-sm font-mono bg-muted px-3 py-1 rounded inline-block mb-2">
                {activePromo.code}
              </p>
              <p className="text-xs text-muted-foreground">
                Valid until {activePromo.validUntil}
              </p>
            </div>
            <Button className="w-full" asChild>
              <Link to="/dashboard/promotions">
                View All Promotions
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;
