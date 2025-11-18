import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHome from "@/components/dashboard/DashboardHome";
import MyOrders from "@/components/dashboard/MyOrders";
import OrderDetail from "@/components/dashboard/OrderDetail";
import MyWishlist from "@/components/dashboard/MyWishlist";
import SavedAddresses from "@/components/dashboard/SavedAddresses";
import MyPromotions from "@/components/dashboard/MyPromotions";
import Settings from "@/components/dashboard/Settings";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="flex gap-6 p-4 md:p-6 max-w-[1600px] mx-auto">
        <DashboardSidebar user={user} />
        
        <main className="flex-1 min-w-0">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="orders" element={<MyOrders />} />
            <Route path="orders/:orderId" element={<OrderDetail />} />
            <Route path="wishlist" element={<MyWishlist />} />
            <Route path="addresses" element={<SavedAddresses />} />
            <Route path="promotions" element={<MyPromotions />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
