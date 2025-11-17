import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Megaphone, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  activePromotions: number;
  totalRevenue: number;
}

interface Order {
  id: string;
  created_at: string;
  final_amount: number;
  status: string;
  profiles: { name: string } | null;
}

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    activePromotions: 0,
    totalRevenue: 0,
  });
  const [latestOrders, setLatestOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchStats();
    fetchLatestOrders();
  }, []);

  const fetchStats = async () => {
    const [productsRes, ordersRes, promotionsRes] = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("final_amount", { count: "exact" }),
      supabase.from("promotions").select("id", { count: "exact", head: true }).eq("is_active", true),
    ]);

    const totalRevenue = ordersRes.data?.reduce((sum, order) => sum + Number(order.final_amount), 0) || 0;

    setStats({
      totalProducts: productsRes.count || 0,
      totalOrders: ordersRes.count || 0,
      activePromotions: promotionsRes.count || 0,
      totalRevenue,
    });
  };

  const fetchLatestOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select(`
        id,
        created_at,
        final_amount,
        status,
        user_id
      `)
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) {
      // Fetch profiles separately
      const ordersWithProfiles = await Promise.all(
        data.map(async (order) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", order.user_id)
            .single();
          
          return { ...order, profiles: profile };
        })
      );
      setLatestOrders(ordersWithProfiles as Order[]);
    }
  };

  const statCards = [
    { title: "Total Products", value: stats.totalProducts, icon: Package, color: "text-blue-500" },
    { title: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, color: "text-green-500" },
    { title: "Active Promotions", value: stats.activePromotions, icon: Megaphone, color: "text-purple-500" },
    { title: "Total Revenue", value: `$${stats.totalRevenue.toFixed(2)}`, icon: TrendingUp, color: "text-orange-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Overview</h1>
        <p className="text-muted-foreground">Welcome to your admin dashboard</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Latest Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {latestOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                <div>
                  <p className="font-medium">{order.profiles?.name || "Guest"}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                    {order.status}
                  </Badge>
                  <p className="font-bold">${order.final_amount.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;
