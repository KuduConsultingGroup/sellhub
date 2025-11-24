import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import AdminOverview from "@/components/admin/AdminOverview";
import ProductsManagement from "@/components/admin/ProductsManagement";
import CategoriesManagement from "@/components/admin/CategoriesManagement";
import PromotionsManagement from "@/components/admin/PromotionsManagement";
import CouponsManagement from "@/components/admin/CouponsManagement";
import OrdersManagement from "@/components/admin/OrdersManagement";
import MessagesManagement from "@/components/admin/MessagesManagement";
import { UsersManagement } from "@/components/admin/UsersManagement";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setUser(session.user);

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    setIsAdmin(!!data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex gap-6 p-6 bg-gradient-to-br from-background via-background to-muted/20">
      <AdminSidebar user={user} />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <Button
              variant="outline"
              asChild
            >
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Store
              </Link>
            </Button>
          </div>
          
          <Routes>
            <Route index element={<AdminOverview />} />
            <Route path="products" element={<ProductsManagement />} />
            <Route path="categories" element={<CategoriesManagement />} />
            <Route path="promotions" element={<PromotionsManagement />} />
            <Route path="coupons" element={<CouponsManagement />} />
            <Route path="orders" element={<OrdersManagement />} />
            <Route path="messages" element={<MessagesManagement />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Admin;
