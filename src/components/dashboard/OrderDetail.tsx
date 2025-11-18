import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Package, Truck, CheckCircle2, MapPin, CreditCard } from "lucide-react";

const OrderDetail = () => {
  const { orderId } = useParams();

  // Mock order detail
  const order = {
    id: orderId,
    date: "2024-01-15",
    status: "Delivered",
    total: 299.99,
    subtotal: 279.99,
    shipping: 10.00,
    tax: 10.00,
    items: [
      {
        id: "1",
        name: "Premium Wireless Headphones",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
        price: 199.99,
        quantity: 1,
      },
      {
        id: "2",
        name: "Smart Watch Series 5",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
        price: 80.00,
        quantity: 1,
      },
    ],
    shippingAddress: {
      name: "John Doe",
      street: "123 Main Street",
      city: "New York",
      state: "NY",
      zip: "10001",
      country: "USA",
    },
    paymentMethod: "•••• 4242",
    timeline: [
      { status: "Order Placed", date: "Jan 15, 2024 10:30 AM", completed: true },
      { status: "Processing", date: "Jan 15, 2024 2:15 PM", completed: true },
      { status: "Shipped", date: "Jan 16, 2024 9:00 AM", completed: true },
      { status: "Out for Delivery", date: "Jan 18, 2024 8:00 AM", completed: true },
      { status: "Delivered", date: "Jan 18, 2024 3:45 PM", completed: true },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard/orders">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Order Details</h1>
          <p className="text-muted-foreground mt-1">{order.id}</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Invoice
        </Button>
      </div>

      {/* Order Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Order Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {order.timeline.map((step, idx) => (
              <div key={idx} className="flex gap-4 pb-8 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className={`rounded-full p-2 ${step.completed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  {idx < order.timeline.length - 1 && (
                    <div className={`w-0.5 flex-1 mt-2 ${step.completed ? "bg-primary" : "bg-muted"}`} style={{ minHeight: "40px" }} />
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-semibold">{step.status}</p>
                  <p className="text-sm text-muted-foreground">{step.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                <div className="w-20 h-20 rounded-lg overflow-hidden">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{item.name}</h4>
                  <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                </div>
                <p className="font-semibold text-lg">${item.price}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Order Summary & Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">${order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-semibold">${order.shipping}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-semibold">${order.tax}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Total</span>
                <span className="font-bold">${order.total}</span>
              </div>
              <Badge className="w-full justify-center bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20">
                {order.status}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{order.shippingAddress.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {order.shippingAddress.street}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}<br />
                {order.shippingAddress.country}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Card ending in {order.paymentMethod}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
