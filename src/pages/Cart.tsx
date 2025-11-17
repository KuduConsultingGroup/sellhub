import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Minus, Plus, Trash2, ShoppingBag, Tag } from "lucide-react";
import { z } from "zod";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    sale_price: number | null;
    main_image_url: string | null;
    stock_quantity: number | null;
    short_description: string | null;
  };
}

interface LocalCartItem {
  productId: string;
  quantity: number;
}

const couponSchema = z.string()
  .trim()
  .min(1, "Coupon code cannot be empty")
  .max(50, "Coupon code too long")
  .regex(/^[A-Z0-9]+$/, "Invalid coupon format");

const Cart = () => {
  const [user, setUser] = useState<any>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user !== null) {
      fetchCart();
      fetchRelatedProducts();
    }
  }, [user]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const fetchCart = async () => {
    setLoading(true);
    
    if (user) {
      // Fetch from database for logged-in users
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          id,
          product_id,
          quantity,
          products (
            id,
            name,
            slug,
            price,
            sale_price,
            main_image_url,
            stock_quantity,
            short_description
          )
        `)
        .eq("user_id", user.id);

      if (error) {
        toast.error("Failed to load cart");
        setLoading(false);
        return;
      }

      // Transform data to match CartItem interface
      const items: CartItem[] = (data || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        product: item.products,
      }));

      setCartItems(items);
    } else {
      // Load from localStorage for guests
      const localCart = localStorage.getItem("guestCart");
      if (localCart) {
        const parsedCart: LocalCartItem[] = JSON.parse(localCart);
        await fetchGuestCartProducts(parsedCart);
      } else {
        setCartItems([]);
      }
    }
    
    setLoading(false);
  };

  const fetchGuestCartProducts = async (localCart: LocalCartItem[]) => {
    if (localCart.length === 0) {
      setCartItems([]);
      return;
    }

    const productIds = localCart.map(item => item.productId);
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, price, sale_price, main_image_url, stock_quantity, short_description")
      .in("id", productIds);

    if (data) {
      const items: CartItem[] = data.map((product: any) => {
        const localItem = localCart.find(item => item.productId === product.id);
        return {
          id: product.id,
          product_id: product.id,
          quantity: localItem?.quantity || 1,
          product: product,
        };
      });
      setCartItems(items);
    }
  };

  const fetchRelatedProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .limit(8);
    
    if (data) setRelatedProducts(data);
  };

  const updateQuantity = async (itemId: string, productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    const item = cartItems.find(i => i.product_id === productId);
    if (!item) return;

    if (item.product.stock_quantity !== null && newQuantity > item.product.stock_quantity) {
      toast.error("Not enough stock available");
      return;
    }

    if (user) {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("id", itemId);

      if (error) {
        toast.error("Failed to update quantity");
        return;
      }
    } else {
      updateLocalCart(productId, newQuantity);
    }

    setCartItems(prev => prev.map(item => 
      item.product_id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeItem = async (itemId: string, productId: string) => {
    if (user) {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);

      if (error) {
        toast.error("Failed to remove item");
        return;
      }
    } else {
      removeFromLocalCart(productId);
    }

    setCartItems(prev => prev.filter(item => item.product_id !== productId));
    toast.success("Item removed from cart");
  };

  const updateLocalCart = (productId: string, quantity: number) => {
    const localCart = localStorage.getItem("guestCart");
    if (localCart) {
      const parsedCart: LocalCartItem[] = JSON.parse(localCart);
      const updatedCart = parsedCart.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      );
      localStorage.setItem("guestCart", JSON.stringify(updatedCart));
    }
  };

  const removeFromLocalCart = (productId: string) => {
    const localCart = localStorage.getItem("guestCart");
    if (localCart) {
      const parsedCart: LocalCartItem[] = JSON.parse(localCart);
      const updatedCart = parsedCart.filter(item => item.productId !== productId);
      localStorage.setItem("guestCart", JSON.stringify(updatedCart));
    }
  };

  const applyCoupon = async () => {
    setCouponError("");
    
    try {
      const validatedCode = couponSchema.parse(couponCode.toUpperCase());

      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", validatedCode)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        setCouponError("Invalid coupon code");
        return;
      }

      const now = new Date();
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);

      if (now < startDate || now > endDate) {
        setCouponError("Coupon has expired");
        return;
      }

      if (data.max_uses && data.current_uses >= data.max_uses) {
        setCouponError("Coupon has reached maximum usage");
        return;
      }

      if (data.minimum_order_amount && subtotal < data.minimum_order_amount) {
        setCouponError(`Minimum order amount is $${data.minimum_order_amount}`);
        return;
      }

      setAppliedCoupon(data);
      toast.success("Coupon applied successfully!");
    } catch (error) {
      if (error instanceof z.ZodError) {
        setCouponError(error.errors[0].message);
      } else {
        setCouponError("Failed to apply coupon");
      }
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    toast.success("Coupon removed");
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.product.sale_price || item.product.price;
    return sum + (price * item.quantity);
  }, 0);

  const savings = cartItems.reduce((sum, item) => {
    if (item.product.sale_price) {
      return sum + ((item.product.price - item.product.sale_price) * item.quantity);
    }
    return sum;
  }, 0);

  const discount = appliedCoupon 
    ? appliedCoupon.discount_type === "percentage"
      ? (subtotal * appliedCoupon.discount_value) / 100
      : appliedCoupon.discount_value
    : 0;

  const tax = subtotal * 0.08; // 8% tax
  const shipping = subtotal >= 50 ? 0 : 5.99;
  const total = subtotal - discount + tax + shipping;

  const freeShippingThreshold = 50;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Header />
        <div className="container py-8 lg:py-12">
          <Skeleton className="h-12 w-64 mb-8 rounded-2xl" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-3xl" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Header />
        <div className="container py-16 lg:py-24">
          <div className="glass-card rounded-3xl p-12 max-w-2xl mx-auto text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-primary/10 p-6">
                <ShoppingBag className="h-16 w-16 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-3">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8 text-lg">
              {user 
                ? "Start adding products to your cart to see them here."
                : "You're shopping as a guest. Start adding products to get started!"}
            </p>
            <Button asChild size="lg" className="rounded-full px-8">
              <Link to="/products">Start Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      
      <div className="container py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl lg:text-5xl font-bold mb-3">Shopping Cart</h1>
          <p className="text-muted-foreground text-lg">
            {user 
              ? `Logged in as ${user.email}`
              : "You're shopping as a guest. You can check out without an account."}
          </p>
        </div>

        {/* Free Shipping Progress */}
        {remainingForFreeShipping > 0 && (
          <div className="glass-card rounded-3xl p-6 mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">
                Only <span className="text-primary font-bold">${remainingForFreeShipping.toFixed(2)}</span> away from free shipping!
              </p>
              <span className="text-sm text-muted-foreground">{freeShippingProgress.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card rounded-3xl p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Cart Items</h2>
                <Badge variant="secondary" className="rounded-full px-4 py-1">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                </Badge>
              </div>

              <div className="space-y-6">
                {cartItems.map((item, index) => {
                  const price = item.product.sale_price || item.product.price;
                  const isLowStock = item.product.stock_quantity !== null && 
                                    item.product.stock_quantity > 0 && 
                                    item.product.stock_quantity <= 5;
                  const isOutOfStock = item.product.stock_quantity === 0;

                  return (
                    <div key={item.product_id}>
                      {index > 0 && <div className="border-t border-border/50 my-6" />}
                      <div className="flex gap-4 lg:gap-6">
                        {/* Product Image */}
                        <Link 
                          to={`/product/${item.product.slug}`}
                          className="flex-shrink-0"
                        >
                          <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-2xl overflow-hidden bg-muted hover:opacity-80 transition-opacity">
                            {item.product.main_image_url ? (
                              <img
                                src={item.product.main_image_url}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1 min-w-0">
                              <Link 
                                to={`/product/${item.product.slug}`}
                                className="font-semibold text-lg hover:text-primary transition-colors block truncate"
                              >
                                {item.product.name}
                              </Link>
                              {item.product.short_description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {item.product.short_description}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id, item.product_id)}
                              className="rounded-full hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-2 mb-3">
                            {item.product.sale_price ? (
                              <>
                                <span className="text-lg font-bold text-primary">
                                  ${price.toFixed(2)}
                                </span>
                                <span className="text-sm text-muted-foreground line-through">
                                  ${item.product.price.toFixed(2)}
                                </span>
                                <Badge className="rounded-full px-2 py-0.5 text-xs bg-green-500/10 text-green-600 border-green-500/20">
                                  Save ${(item.product.price - item.product.sale_price).toFixed(2)}
                                </Badge>
                              </>
                            ) : (
                              <span className="text-lg font-bold">
                                ${price.toFixed(2)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            {/* Quantity Selector */}
                            <div className="flex items-center glass-card rounded-full overflow-hidden">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => updateQuantity(item.id, item.product_id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="rounded-none h-9 w-9"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-12 text-center font-semibold text-sm">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => updateQuantity(item.id, item.product_id, item.quantity + 1)}
                                disabled={isOutOfStock || (item.product.stock_quantity !== null && item.quantity >= item.product.stock_quantity)}
                                className="rounded-none h-9 w-9"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Stock Status */}
                            <div className="flex items-center gap-2">
                              {isOutOfStock ? (
                                <Badge variant="destructive" className="rounded-full text-xs">
                                  Out of Stock
                                </Badge>
                              ) : isLowStock ? (
                                <Badge variant="outline" className="rounded-full text-xs border-amber-500/20 text-amber-600">
                                  Low Stock
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="rounded-full text-xs border-green-500/20 text-green-600">
                                  In Stock
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-3xl p-6 lg:p-8 sticky top-24">
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

              {/* Coupon Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Have a coupon code?
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between glass-card rounded-2xl p-4">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{appliedCoupon.code}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeCoupon}
                      className="rounded-full"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter code"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponError("");
                        }}
                        className="rounded-full"
                      />
                      <Button
                        onClick={applyCoupon}
                        disabled={!couponCode}
                        className="rounded-full px-6"
                      >
                        Apply
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-sm text-destructive mt-2">{couponError}</p>
                    )}
                  </>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6 pb-6 border-b border-border/50">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                
                {savings > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sale Savings</span>
                    <span className="font-medium text-green-600">-${savings.toFixed(2)}</span>
                  </div>
                )}
                
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Coupon Discount</span>
                    <span className="font-medium text-green-600">-${discount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (8%)</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-baseline mb-6">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-3xl font-bold text-primary">
                  ${total.toFixed(2)}
                </span>
              </div>

              {/* Total Savings Badge */}
              {(savings + discount) > 0 && (
                <div className="glass-card rounded-2xl p-4 mb-6 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Savings</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${(savings + discount).toFixed(2)}
                  </p>
                </div>
              )}

              {/* Checkout Buttons */}
              <div className="space-y-3">
                <Button 
                  size="lg" 
                  className="w-full rounded-full h-14 text-lg font-semibold"
                  onClick={() => navigate("/checkout")}
                >
                  Proceed to Checkout
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="w-full rounded-full h-12"
                  asChild
                >
                  <Link to="/products">Continue Shopping</Link>
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-border/50">
                <div className="text-center p-3">
                  <p className="text-xs text-muted-foreground">Secure</p>
                  <p className="text-sm font-semibold">Checkout</p>
                </div>
                <div className="text-center p-3">
                  <p className="text-xs text-muted-foreground">Easy</p>
                  <p className="text-sm font-semibold">Returns</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold mb-8">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  price={product.price}
                  mainImageUrl={product.main_image_url}
                  isNew={product.is_new}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
