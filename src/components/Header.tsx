import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { ShoppingCart, Heart, Search, LogOut, User as UserIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
        fetchUserProfile(session.user.id);
        fetchCartCount(session.user.id);
      } else {
        fetchGuestCartCount();
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
        fetchUserProfile(session.user.id);
        fetchCartCount(session.user.id);
      } else {
        setIsAdmin(false);
        setUserName("");
        fetchGuestCartCount();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "super_admin")
      .single();

    setIsAdmin(!!data);
  };

  const fetchUserProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", userId)
      .single();

    if (data) {
      setUserName(data.name);
    }
  };

  const fetchCartCount = async (userId: string) => {
    const { data } = await supabase
      .from("cart_items")
      .select("quantity")
      .eq("user_id", userId);

    if (data) {
      const totalCount = data.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalCount);
    }
  };

  const fetchGuestCartCount = () => {
    const localCart = localStorage.getItem("guestCart");
    if (localCart) {
      const parsedCart: { productId: string; quantity: number }[] = JSON.parse(localCart);
      const totalCount = parsedCart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalCount);
    } else {
      setCartCount(0);
    }
  };

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, sale_price, main_image_url, short_description")
        .eq("is_active", true)
        .or(`name.ilike.%${query}%, description.ilike.%${query}%, short_description.ilike.%${query}%, brand.ilike.%${query}%`)
        .limit(8);

      if (!error && data) {
        setSearchResults(data);
        setShowResults(true);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
      setSearchQuery("");
    }
  };

  const handleProductClick = (slug: string) => {
    navigate(`/product/${slug}`);
    setShowResults(false);
    setSearchQuery("");
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-4 z-50 mx-4 lg:mx-8">
      <div className="glass rounded-[2rem] shadow-glass px-6 py-4">
        <div className="container mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold tracking-tight">ShopHub</span>
          </Link>

          {/* Navigation Menu - Desktop */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <Link to="/products" className="hover:text-primary transition-colors">
              Products
            </Link>
            <Link to="/products" className="hover:text-primary transition-colors">
              Shop
            </Link>
          </nav>

          {/* Center Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                className="w-full pl-4 pr-24 py-6 rounded-full bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              {searchQuery && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={clearSearch}
                  className="absolute right-14 top-1/2 -translate-y-1/2 rounded-full h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="submit"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 bg-primary hover:bg-primary-hover"
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-background rounded-2xl shadow-lg border border-border overflow-hidden z-50">
                  <div className="max-h-96 overflow-y-auto">
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleProductClick(product.slug)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {product.main_image_url ? (
                            <img
                              src={product.main_image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Search className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          {product.short_description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {product.short_description}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end">
                          {product.sale_price ? (
                            <>
                              <span className="text-sm font-bold text-primary">
                                ${product.sale_price.toFixed(2)}
                              </span>
                              <span className="text-xs text-muted-foreground line-through">
                                ${product.price.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-bold">
                              ${product.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  {searchQuery && (
                    <div className="border-t border-border p-2">
                      <button
                        type="button"
                        onClick={handleSearchSubmit}
                        className="w-full text-sm text-center text-primary hover:text-primary-hover py-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        View all results for "{searchQuery}"
                      </button>
                    </div>
                  )}
                </div>
              )}

              {showResults && searchResults.length === 0 && searchQuery.trim().length >= 2 && !isSearching && (
                <div className="absolute top-full mt-2 w-full bg-background rounded-2xl shadow-lg border border-border p-6 text-center z-50">
                  <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No products found for "{searchQuery}"</p>
                </div>
              )}
            </form>
          </div>

          {/* Right Side - Icons and User */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-muted"
              asChild
            >
              <Link to="/favorites">
                <Heart className="h-5 w-5" />
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-muted relative"
              asChild
            >
              <Link to="/cart">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              </Link>
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full flex items-center gap-2 pl-2 pr-4 hover:bg-muted">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:inline-block text-sm font-medium">{userName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-2xl">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      <UserIcon className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild className="rounded-full">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mt-4" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="relative">
            <Input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              className="w-full pl-4 pr-20 py-5 rounded-full bg-muted/50 border-none"
            />
            {searchQuery && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={clearSearch}
                className="absolute right-12 top-1/2 -translate-y-1/2 rounded-full h-7 w-7"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-9 w-9 bg-primary hover:bg-primary-hover"
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Mobile Search Results */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-background rounded-2xl shadow-lg border border-border overflow-hidden z-50">
                <div className="max-h-80 overflow-y-auto">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleProductClick(product.slug)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {product.main_image_url ? (
                          <img
                            src={product.main_image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Search className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {product.sale_price ? (
                            <>
                              <span className="text-xs font-bold text-primary">
                                ${product.sale_price.toFixed(2)}
                              </span>
                              <span className="text-xs text-muted-foreground line-through">
                                ${product.price.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs font-bold">
                              ${product.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {searchQuery && (
                  <div className="border-t border-border p-2">
                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="w-full text-xs text-center text-primary hover:text-primary-hover py-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      View all results for "{searchQuery}"
                    </button>
                  </div>
                )}
              </div>
            )}

            {showResults && searchResults.length === 0 && searchQuery.trim().length >= 2 && !isSearching && (
              <div className="absolute top-full mt-2 w-full bg-background rounded-2xl shadow-lg border border-border p-4 text-center z-50">
                <Search className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">No products found</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </header>
  );
};

export default Header;
