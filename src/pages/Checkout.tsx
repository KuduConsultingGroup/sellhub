import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Truck, Zap, Package, CreditCard, ShoppingBag } from "lucide-react";
import { z } from "zod";

const addressSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  street: z.string().min(5, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(3, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
});

const paymentSchema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/, "Card number must be 16 digits"),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/, "Format: MM/YY"),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV must be 3-4 digits"),
  cardName: z.string().min(2, "Name on card is required"),
});

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    price: number;
    main_image_url: string | null;
  };
}

interface Address {
  id: string;
  full_name: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

const Checkout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  
  // Form state
  const [guestEmail, setGuestEmail] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [billingIsSameAsShipping, setBillingIsSameAsShipping] = useState(true);
  const [createAccount, setCreateAccount] = useState(false);
  
  // Guest address form
  const [guestAddress, setGuestAddress] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United States",
  });

  // Payment form
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    cardName: "",
  });

  const [errors, setErrors] = useState<any>({});

  // Shipping costs
  const shippingCosts = {
    standard: 5.99,
    express: 14.99,
    overnight: 24.99,
  };

  useEffect(() => {
    checkAuth();
    loadCart();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user) {
      loadAddresses(user.id);
    }
    setLoading(false);
  };

  const loadCart = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Load from database
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
          products (
            id,
            name,
            price,
            main_image_url
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading cart:', error);
        return;
      }

      setCartItems(data as CartItem[] || []);
    } else {
      // Load from localStorage for guests
      const localCart = localStorage.getItem('guestCart');
      if (localCart) {
        const cartData = JSON.parse(localCart);
        // Fetch product details for guest cart
        const productIds = cartData.map((item: any) => item.product_id);
        const { data: products } = await supabase
          .from('products')
          .select('id, name, price, main_image_url')
          .in('id', productIds);

        const enrichedCart = cartData.map((item: any) => ({
          ...item,
          products: products?.find(p => p.id === item.product_id),
        }));

        setCartItems(enrichedCart);
      }
    }
  };

  const loadAddresses = async (userId: string) => {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });

    if (error) {
      console.error('Error loading addresses:', error);
      return;
    }

    setSavedAddresses(data || []);
    if (data && data.length > 0) {
      const defaultAddr = data.find(a => a.is_default) || data[0];
      setSelectedAddressId(defaultAddr.id);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !data) {
      toast.error("Invalid or expired coupon code");
      return;
    }

    // Check if coupon is within date range
    const now = new Date();
    if (now < new Date(data.start_date) || now > new Date(data.end_date)) {
      toast.error("This coupon is not currently valid");
      return;
    }

    // Calculate discount
    const subtotal = calculateSubtotal();
    let discountAmount = 0;

    if (data.discount_type === 'percentage') {
      discountAmount = (subtotal * data.discount_value) / 100;
    } else {
      discountAmount = Number(data.discount_value);
    }

    setDiscount(discountAmount);
    toast.success(`Coupon applied! You saved $${discountAmount.toFixed(2)}`);
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      return sum + (item.products?.price || 0) * item.quantity;
    }, 0);
  };

  const calculateTax = () => {
    return (calculateSubtotal() - discount) * 0.08; // 8% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() - discount + shippingCosts[shippingMethod as keyof typeof shippingCosts] + calculateTax();
  };

  const validateAddress = () => {
    if (!user) {
      try {
        addressSchema.parse(guestAddress);
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const newErrors: any = {};
          error.errors.forEach((err) => {
            if (err.path[0]) {
              newErrors[err.path[0]] = err.message;
            }
          });
          setErrors(newErrors);
          toast.error("Please fill in all required address fields");
          return false;
        }
      }
    } else {
      if (!selectedAddressId) {
        toast.error("Please select a delivery address");
        return false;
      }
    }
    return true;
  };

  const validatePayment = () => {
    try {
      paymentSchema.parse(paymentInfo);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: any = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setErrors(newErrors);
        toast.error("Please check your payment information");
        return false;
      }
    }
    return false;
  };

  const handlePlaceOrder = async () => {
    setErrors({});

    // Validate cart
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      navigate('/cart');
      return;
    }

    // Validate email for guests
    if (!user && !guestEmail) {
      toast.error("Please enter your email address");
      return;
    }

    // Validate address
    if (!validateAddress()) return;

    // Validate payment
    if (!validatePayment()) return;

    setSubmitting(true);

    try {
      const subtotal = calculateSubtotal();
      const tax = calculateTax();
      const shipping = shippingCosts[shippingMethod as keyof typeof shippingCosts];
      const total = calculateTotal();

      // Create order
      const orderData = {
        user_id: user?.id,
        total_amount: subtotal,
        discount_amount: discount,
        final_amount: total,
        status: 'pending' as const,
        payment_status: 'pending' as const,
        coupon_code: couponCode || null,
        shipping_address_id: user ? selectedAddressId : null,
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        product_price_snapshot: item.products?.price || 0,
        product_name_snapshot: item.products?.name || '',
        line_total: (item.products?.price || 0) * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      if (user) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);
      } else {
        localStorage.removeItem('guestCart');
      }

      toast.success("Order placed successfully!");
      navigate(`/order-confirmation/${order.id}`);
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error(error.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add some items to your cart before checkout</p>
            <Button onClick={() => navigate('/products')}>Continue Shopping</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Checkout</h1>
          <p className="text-muted-foreground">Complete your order</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Customer Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user ? (
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-muted-foreground">Logged in</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="guest-email">Email Address</Label>
                      <Input
                        id="guest-email"
                        type="email"
                        placeholder="your@email.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="create-account"
                        checked={createAccount}
                        onCheckedChange={(checked) => setCreateAccount(checked as boolean)}
                      />
                      <Label htmlFor="create-account" className="text-sm cursor-pointer">
                        Create account after checkout
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      You're checking out as a guest
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle>Delivery Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user && savedAddresses.length > 0 ? (
                  <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId}>
                    {savedAddresses.map((addr) => (
                      <div key={addr.id} className="flex items-start space-x-3">
                        <RadioGroupItem value={addr.id} id={addr.id} />
                        <Label htmlFor={addr.id} className="flex-1 cursor-pointer">
                          <div className="p-4 rounded-lg border border-border hover:border-primary transition-colors">
                            <p className="font-medium">{addr.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {addr.street}, {addr.city}, {addr.state} {addr.postal_code}
                            </p>
                            <p className="text-sm text-muted-foreground">{addr.country}</p>
                            {addr.is_default && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded mt-2 inline-block">
                                Default
                              </span>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={guestAddress.fullName}
                        onChange={(e) => setGuestAddress({ ...guestAddress, fullName: e.target.value })}
                        className={errors.fullName ? "border-destructive" : ""}
                      />
                      {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={guestAddress.phone}
                        onChange={(e) => setGuestAddress({ ...guestAddress, phone: e.target.value })}
                        className={errors.phone ? "border-destructive" : ""}
                      />
                      {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="street">Street Address</Label>
                      <Input
                        id="street"
                        value={guestAddress.street}
                        onChange={(e) => setGuestAddress({ ...guestAddress, street: e.target.value })}
                        className={errors.street ? "border-destructive" : ""}
                      />
                      {errors.street && <p className="text-xs text-destructive mt-1">{errors.street}</p>}
                    </div>

                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={guestAddress.city}
                        onChange={(e) => setGuestAddress({ ...guestAddress, city: e.target.value })}
                        className={errors.city ? "border-destructive" : ""}
                      />
                      {errors.city && <p className="text-xs text-destructive mt-1">{errors.city}</p>}
                    </div>

                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={guestAddress.state}
                        onChange={(e) => setGuestAddress({ ...guestAddress, state: e.target.value })}
                        className={errors.state ? "border-destructive" : ""}
                      />
                      {errors.state && <p className="text-xs text-destructive mt-1">{errors.state}</p>}
                    </div>

                    <div>
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={guestAddress.postalCode}
                        onChange={(e) => setGuestAddress({ ...guestAddress, postalCode: e.target.value })}
                        className={errors.postalCode ? "border-destructive" : ""}
                      />
                      {errors.postalCode && <p className="text-xs text-destructive mt-1">{errors.postalCode}</p>}
                    </div>

                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={guestAddress.country}
                        onChange={(e) => setGuestAddress({ ...guestAddress, country: e.target.value })}
                        className={errors.country ? "border-destructive" : ""}
                      />
                      {errors.country && <p className="text-xs text-destructive mt-1">{errors.country}</p>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Method */}
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle>Shipping Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={shippingMethod} onValueChange={setShippingMethod} className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="standard" id="standard" />
                    <Label htmlFor="standard" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary transition-colors">
                        <div className="flex items-center gap-3">
                          <Truck className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Standard Shipping</p>
                            <p className="text-sm text-muted-foreground">3-5 business days</p>
                          </div>
                        </div>
                        <p className="font-medium">${shippingCosts.standard}</p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="express" id="express" />
                    <Label htmlFor="express" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary transition-colors">
                        <div className="flex items-center gap-3">
                          <Zap className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Express Shipping</p>
                            <p className="text-sm text-muted-foreground">1-2 business days</p>
                          </div>
                        </div>
                        <p className="font-medium">${shippingCosts.express}</p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="overnight" id="overnight" />
                    <Label htmlFor="overnight" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary transition-colors">
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Overnight Shipping</p>
                            <p className="text-sm text-muted-foreground">Next business day</p>
                          </div>
                        </div>
                        <p className="font-medium">${shippingCosts.overnight}</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={paymentInfo.cardNumber}
                      onChange={(e) => setPaymentInfo({ ...paymentInfo, cardNumber: e.target.value.replace(/\s/g, '') })}
                      maxLength={16}
                      className={errors.cardNumber ? "border-destructive" : ""}
                    />
                    {errors.cardNumber && <p className="text-xs text-destructive mt-1">{errors.cardNumber}</p>}
                  </div>

                  <div>
                    <Label htmlFor="expiry">Expiration Date</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={paymentInfo.expiry}
                      onChange={(e) => setPaymentInfo({ ...paymentInfo, expiry: e.target.value })}
                      maxLength={5}
                      className={errors.expiry ? "border-destructive" : ""}
                    />
                    {errors.expiry && <p className="text-xs text-destructive mt-1">{errors.expiry}</p>}
                  </div>

                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={paymentInfo.cvv}
                      onChange={(e) => setPaymentInfo({ ...paymentInfo, cvv: e.target.value })}
                      maxLength={4}
                      className={errors.cvv ? "border-destructive" : ""}
                    />
                    {errors.cvv && <p className="text-xs text-destructive mt-1">{errors.cvv}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="cardName">Name on Card</Label>
                    <Input
                      id="cardName"
                      placeholder="John Doe"
                      value={paymentInfo.cardName}
                      onChange={(e) => setPaymentInfo({ ...paymentInfo, cardName: e.target.value })}
                      className={errors.cardName ? "border-destructive" : ""}
                    />
                    {errors.cardName && <p className="text-xs text-destructive mt-1">{errors.cardName}</p>}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="billing-same"
                    checked={billingIsSameAsShipping}
                    onCheckedChange={(checked) => setBillingIsSameAsShipping(checked as boolean)}
                  />
                  <Label htmlFor="billing-same" className="text-sm cursor-pointer">
                    Billing address same as shipping
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="border-border/50 shadow-lg sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={item.products?.main_image_url || '/placeholder.svg'}
                        alt={item.products?.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.products?.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="text-sm font-medium">
                          ${((item.products?.price || 0) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Coupon */}
                <div className="space-y-2">
                  <Label htmlFor="coupon">Coupon Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="coupon"
                      placeholder="Enter code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    />
                    <Button variant="outline" onClick={applyCoupon}>
                      Apply
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>${shippingCosts[shippingMethod as keyof typeof shippingCosts].toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${calculateTax().toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Place Order & Pay'
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By placing your order, you agree to our Terms & Conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
