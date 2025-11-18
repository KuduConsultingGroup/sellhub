import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MyWishlist = () => {
  // Mock wishlist data
  const wishlistItems = [
    {
      id: "1",
      name: "Premium Wireless Headphones",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
      price: 199.99,
      salePrice: 149.99,
      inStock: true,
    },
    {
      id: "2",
      name: "Smart Watch Series 5",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
      price: 299.99,
      inStock: true,
    },
    {
      id: "3",
      name: "Wireless Gaming Mouse",
      image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f",
      price: 79.99,
      inStock: false,
    },
    {
      id: "4",
      name: "Mechanical Keyboard",
      image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3",
      price: 129.99,
      salePrice: 99.99,
      inStock: true,
    },
    {
      id: "5",
      name: "USB-C Hub",
      image: "https://images.unsplash.com/photo-1560343090-f0409e92791a",
      price: 49.99,
      inStock: true,
    },
    {
      id: "6",
      name: "Laptop Stand",
      image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46",
      price: 39.99,
      inStock: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Wishlist</h1>
          <p className="text-muted-foreground mt-1">
            {wishlistItems.length} items saved for later
          </p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Heart className="h-5 w-5 fill-current text-pink-500" />
          <span className="font-semibold">{wishlistItems.length} Items</span>
        </div>
      </div>

      {wishlistItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Heart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
            <p className="text-muted-foreground mb-6">Start adding items you love!</p>
            <Button>Browse Products</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <Card key={item.id} className="group hover:shadow-lg transition-all">
              <CardContent className="p-0">
                <div className="relative aspect-square overflow-hidden rounded-t-xl">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                  {!item.inStock && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                      <Badge variant="secondary" className="text-sm">Out of Stock</Badge>
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <h3 className="font-semibold line-clamp-2 min-h-[48px]">{item.name}</h3>
                  <div className="flex items-baseline gap-2">
                    {item.salePrice ? (
                      <>
                        <span className="text-2xl font-bold text-primary">${item.salePrice}</span>
                        <span className="text-sm text-muted-foreground line-through">${item.price}</span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold">${item.price}</span>
                    )}
                  </div>
                  <Button 
                    className="w-full gap-2" 
                    disabled={!item.inStock}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {item.inStock ? "Add to Cart" : "Out of Stock"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyWishlist;
