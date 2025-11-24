import { NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  Megaphone, 
  Ticket, 
  ShoppingCart, 
  Users, 
  MessageCircle,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
  user: any;
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [newUsersCount, setNewUsersCount] = useState(0);

  useEffect(() => {
    fetchCounts();
    
    // Set up realtime subscriptions
    const messagesChannel = supabase
      .channel('admin-messages-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchUnreadMessagesCount();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchUnreadMessagesCount();
      })
      .subscribe();

    const ordersChannel = supabase
      .channel('admin-orders-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchPendingOrdersCount();
      })
      .subscribe();

    const usersChannel = supabase
      .channel('admin-users-count')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => {
        fetchNewUsersCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(usersChannel);
    };
  }, []);

  const fetchUnreadMessagesCount = async () => {
    const { count } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');
    
    setUnreadMessagesCount(count || 0);
  };

  const fetchPendingOrdersCount = async () => {
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    setPendingOrdersCount(count || 0);
  };

  const fetchNewUsersCount = async () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', twoDaysAgo.toISOString());
    
    setNewUsersCount(count || 0);
  };

  const fetchCounts = async () => {
    await Promise.all([
      fetchUnreadMessagesCount(),
      fetchPendingOrdersCount(),
      fetchNewUsersCount(),
    ]);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Overview", path: "/admin", badge: null },
    { icon: Package, label: "Products", path: "/admin/products", badge: null },
    { icon: FolderTree, label: "Categories", path: "/admin/categories", badge: null },
    { icon: Megaphone, label: "Promotions", path: "/admin/promotions", badge: null },
    { icon: Ticket, label: "Coupons", path: "/admin/coupons", badge: null },
    { icon: ShoppingCart, label: "Orders", path: "/admin/orders", badge: pendingOrdersCount },
    { icon: MessageCircle, label: "Messages", path: "/admin/messages", badge: unreadMessagesCount },
    { icon: Users, label: "Users", path: "/admin/users", badge: newUsersCount },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
              {user?.email?.[0]?.toUpperCase() || "A"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg">{user?.user_metadata?.name || "Admin"}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium mt-1">
              Super Admin
            </span>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/admin"}
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium flex-1">{item.label}</span>
            {item.badge !== null && item.badge > 0 && (
              <Badge 
                variant="destructive" 
                className="h-5 min-w-5 px-1.5 text-xs font-semibold"
              >
                {item.badge > 99 ? '99+' : item.badge}
              </Badge>
            )}
          </NavLink>
        ))}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all mt-4"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </button>
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile Menu Toggle */}
      <Button
        variant="outline"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50 rounded-full shadow-lg"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 h-screen md:h-auto
          w-72 bg-card rounded-2xl shadow-xl border border-border/50
          transition-transform duration-300 z-40
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
