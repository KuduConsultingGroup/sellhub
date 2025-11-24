import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHome from "@/components/dashboard/DashboardHome";
import MyOrders from "@/components/dashboard/MyOrders";
import OrderDetail from "@/components/dashboard/OrderDetail";
import MyWishlist from "@/components/dashboard/MyWishlist";
import SavedAddresses from "@/components/dashboard/SavedAddresses";
import MyPromotions from "@/components/dashboard/MyPromotions";
import Settings from "@/components/dashboard/Settings";
import Messages from "@/components/dashboard/Messages";
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <div className="flex-1 flex gap-6 p-4 md:p-6 max-w-[1600px] mx-auto overflow-hidden w-full">
        <DashboardSidebar user={user} />
        
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <Routes>
            <Route index element={<div className="flex-1 overflow-auto"><DashboardHome /></div>} />
            <Route path="orders" element={<div className="flex-1 overflow-auto"><MyOrders /></div>} />
            <Route path="orders/:orderId" element={<div className="flex-1 overflow-auto"><OrderDetail /></div>} />
            <Route path="wishlist" element={<div className="flex-1 overflow-auto"><MyWishlist /></div>} />
            <Route path="addresses" element={<div className="flex-1 overflow-auto"><SavedAddresses /></div>} />
            <Route path="promotions" element={<div className="flex-1 overflow-auto"><MyPromotions /></div>} />
            <Route path="settings" element={<div className="flex-1 overflow-auto"><Settings /></div>} />
            <Route path="messages" element={<Messages />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
