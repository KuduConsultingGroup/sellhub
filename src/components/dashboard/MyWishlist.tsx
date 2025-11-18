import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MyWishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("favorites")
        .select(`
          id,
          product_id,
          products (
            id,
            name,
            slug,
            price,
            sale_price,
            main_image_url,
            stock_quantity
          )
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      setWishlistItems(data || []);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to load wishlist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (favoriteId: string, productName: string) => {
    setRemovingId(favoriteId);
    
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favoriteId);

      if (error) throw error;

      setWishlistItems(prev => prev.filter(item => item.id !== favoriteId));
      
      toast({
        title: "Removed from wishlist",
        description: `${productName} has been removed from your wishlist`,
      });
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to remove item from wishlist",
        variant: "destructive",
      });
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <Button onClick={() => navigate("/products")}>Browse Products</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => {
            const product = item.products;
            const inStock = product.stock_quantity > 0;
            
            return (
              <Card key={item.id} className="group hover:shadow-lg transition-all">
                <CardContent className="p-0">
                  <div className="relative aspect-square overflow-hidden rounded-t-xl">
                    <img
                      src={product.main_image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button 
                      onClick={() => handleRemove(item.id, product.name)}
                      disabled={removingId === item.id}
                      className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors disabled:opacity-50"
                    >
                      {removingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </button>
                    {!inStock && (
                      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                        <Badge variant="secondary" className="text-sm">Out of Stock</Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <h3 
                      className="font-semibold line-clamp-2 min-h-[48px] cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/product/${product.slug}`)}
                    >
                      {product.name}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      {product.sale_price ? (
                        <>
                          <span className="text-2xl font-bold text-primary">${product.sale_price.toFixed(2)}</span>
                          <span className="text-sm text-muted-foreground line-through">${product.price.toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="text-2xl font-bold">${product.price.toFixed(2)}</span>
                      )}
                    </div>
                    <Button 
                      className="w-full gap-2" 
                      disabled={!inStock}
                      onClick={() => navigate(`/product/${product.slug}`)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {inStock ? "Add to Cart" : "Out of Stock"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyWishlist;
