import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart, Eye, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EnhancedProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  mainImageUrl?: string | null;
  isNew?: boolean | null;
  isFeatured?: boolean | null;
  shortDescription?: string | null;
  viewMode?: "large" | "medium" | "small" | "list" | "compact";
  onQuickView?: (productId: string) => void;
}

const EnhancedProductCard = ({
  id,
  name,
  slug,
  price,
  salePrice,
  mainImageUrl,
  isNew,
  isFeatured,
  shortDescription,
  viewMode = "medium",
  onQuickView,
}: EnhancedProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const { toast } = useToast();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    setAddingToCart(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to add items to cart",
          variant: "destructive",
        });
        return;
      }

      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", id)
        .single();

      if (existingItem) {
        await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + 1 })
          .eq("id", existingItem.id);
      } else {
        await supabase
          .from("cart_items")
          .insert({ user_id: user.id, product_id: id, quantity: 1 });
      }

      toast({
        title: "Added to cart",
        description: `${name} has been added to your cart`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    setAddingToWishlist(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to add to wishlist",
          variant: "destructive",
        });
        return;
      }

      const { data: existing } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", id)
        .single();

      if (existing) {
        await supabase.from("favorites").delete().eq("id", existing.id);
        toast({ title: "Removed from wishlist" });
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, product_id: id });
        toast({ title: "Added to wishlist" });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update wishlist",
        variant: "destructive",
      });
    } finally {
      setAddingToWishlist(false);
    }
  };

  const displayPrice = salePrice || price;
  const hasDiscount = salePrice && salePrice < price;

  // List view layout
  if (viewMode === "list") {
    return (
      <Card className="group overflow-hidden transition-all hover:shadow-elegant">
        <div className="flex gap-4 p-4">
          <Link to={`/product/${slug}`} className="flex-shrink-0">
            <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted">
              {mainImageUrl ? (
                <img
                  src={mainImageUrl}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  No Image
                </div>
              )}
            </div>
          </Link>

          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <Link to={`/product/${slug}`}>
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {name}
                  </h3>
                </Link>
                <div className="flex gap-1">
                  {isNew && <Badge variant="secondary">New</Badge>}
                  {isFeatured && <Badge className="bg-accent">Featured</Badge>}
                </div>
              </div>
              
              {shortDescription && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {shortDescription}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">
                  ${displayPrice.toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-muted-foreground line-through">
                    ${price.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddToCart} disabled={addingToCart}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleWishlist}
                  disabled={addingToWishlist}
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Grid view layouts
  const imageHeight = viewMode === "large" ? "aspect-[4/5]" : viewMode === "small" || viewMode === "compact" ? "aspect-square" : "aspect-[3/4]";

  return (
    <Card
      className="group overflow-hidden transition-all hover:shadow-elegant hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${slug}`} className="block relative">
        <div className={`${imageHeight} overflow-hidden bg-muted relative`}>
          {mainImageUrl ? (
            <img
              src={mainImageUrl}
              alt={name}
              className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {isNew && <Badge variant="secondary" className="shadow-soft">New</Badge>}
            {isFeatured && <Badge className="bg-accent shadow-soft">Featured</Badge>}
            {hasDiscount && (
              <Badge className="bg-destructive shadow-soft">
                {Math.round(((price - displayPrice) / price) * 100)}% OFF
              </Badge>
            )}
          </div>

          {/* Quick Actions Overlay */}
          {isHovered && viewMode !== "compact" && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full"
                onClick={handleToggleWishlist}
                disabled={addingToWishlist}
              >
                <Heart className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full"
                onClick={handleAddToCart}
                disabled={addingToCart}
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
              {onQuickView && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full"
                  onClick={(e) => {
                    e.preventDefault();
                    onQuickView(id);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </Link>

      <CardContent className={viewMode === "compact" ? "p-3" : "p-4"}>
        <Link to={`/product/${slug}`}>
          <h3 className={`font-semibold line-clamp-2 group-hover:text-primary transition-colors ${
            viewMode === "compact" ? "text-sm" : ""
          }`}>
            {name}
          </h3>
        </Link>

        {shortDescription && viewMode === "large" && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {shortDescription}
          </p>
        )}

        <div className="flex items-center gap-1 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-3 w-3 fill-primary text-primary" />
          ))}
          <span className="text-xs text-muted-foreground ml-1">(4.5)</span>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <span className={`font-bold text-primary ${viewMode === "compact" ? "text-base" : "text-xl"}`}>
            ${displayPrice.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              ${price.toFixed(2)}
            </span>
          )}
        </div>

        {viewMode !== "compact" && (
          <div className="flex gap-2 mt-4">
            <Button
              className="flex-1"
              size="sm"
              onClick={handleAddToCart}
              disabled={addingToCart}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleWishlist}
              disabled={addingToWishlist}
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedProductCard;
