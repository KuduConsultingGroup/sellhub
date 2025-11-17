import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Heart, ShoppingCart, Minus, Plus, Share2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  main_image_url: string | null;
  images: any;
  category_id: string | null;
  is_new: boolean | null;
  is_active: boolean | null;
  stock_quantity: number | null;
  categories: { name: string; slug: string } | null;
}

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [user, setUser] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchProduct();
    checkAuth();
  }, [slug]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const fetchProduct = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories(name, slug)
      `)
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      setLoading(false);
      return;
    }

    setProduct(data);
    setSelectedImage(data.main_image_url || "");
    
    if (user) {
      checkFavoriteStatus(data.id);
    }
    
    if (data.category_id) {
      fetchRelatedProducts(data.category_id, data.id);
    }
    
    setLoading(false);
  };

  const checkFavoriteStatus = async (productId: string) => {
    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle();
    
    setIsFavorite(!!data);
  };

  const fetchRelatedProducts = async (categoryId: string, currentProductId: string) => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("category_id", categoryId)
      .eq("is_active", true)
      .neq("id", currentProductId)
      .limit(8);
    
    if (data) setRelatedProducts(data);
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please sign in to add items to cart");
      navigate("/auth");
      return;
    }

    if (!product) return;

    if (product.stock_quantity !== null && quantity > product.stock_quantity) {
      toast.error("Not enough stock available");
      return;
    }

    const { data: existingItem } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .maybeSingle();

    if (existingItem) {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: existingItem.quantity + quantity })
        .eq("id", existingItem.id);
      
      if (error) {
        toast.error("Failed to update cart");
      } else {
        toast.success("Cart updated successfully");
      }
    } else {
      const { error } = await supabase
        .from("cart_items")
        .insert({
          user_id: user.id,
          product_id: product.id,
          quantity,
        });
      
      if (error) {
        toast.error("Failed to add to cart");
      } else {
        toast.success("Added to cart successfully");
      }
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error("Please sign in to add favorites");
      navigate("/auth");
      return;
    }

    if (!product) return;

    if (isFavorite) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", product.id);
      
      if (error) {
        toast.error("Failed to remove from favorites");
      } else {
        setIsFavorite(false);
        toast.success("Removed from favorites");
      }
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({
          user_id: user.id,
          product_id: product.id,
        });
      
      if (error) {
        toast.error("Failed to add to favorites");
      } else {
        setIsFavorite(true);
        toast.success("Added to favorites");
      }
    }
  };

  const handleShareProduct = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: product?.description || "",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const incrementQuantity = () => {
    if (product?.stock_quantity && quantity >= product.stock_quantity) {
      toast.error("Maximum stock reached");
      return;
    }
    setQuantity(q => q + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(q => q - 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Header />
        <div className="container py-8 lg:py-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <Skeleton className="aspect-square w-full rounded-3xl" />
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4 rounded-2xl" />
              <Skeleton className="h-6 w-1/4 rounded-full" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Header />
        <div className="container py-16 text-center">
          <div className="glass-card rounded-3xl p-12 max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Product Not Found</h1>
            <p className="text-muted-foreground mb-8 text-lg">The product you're looking for doesn't exist.</p>
            <Button asChild size="lg" className="rounded-full px-8">
              <Link to="/">Go Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const allImages = [
    product.main_image_url,
    ...(Array.isArray(product.images) ? product.images : []),
  ].filter(Boolean) as string[];

  const isInStock = product.stock_quantity !== null && product.stock_quantity > 0;
  const isLowStock = product.stock_quantity !== null && product.stock_quantity > 0 && product.stock_quantity <= 5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      
      <div className="container py-8 lg:py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          {product.categories && (
            <>
              <Link to={`/category/${product.categories.slug}`} className="hover:text-primary transition-colors">
                {product.categories.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground font-medium">{product.name}</span>
        </div>

        {/* Main Product Section */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Left Column - Product Media */}
          <div className="space-y-4">
            <div className="glass-card rounded-3xl p-4 lg:p-6">
              <div className="aspect-square overflow-hidden rounded-2xl bg-muted/50">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No Image
                  </div>
                )}
              </div>
            </div>
            
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {allImages.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(image as string)}
                    className={`aspect-square overflow-hidden rounded-2xl border-2 transition-all hover:scale-105 ${
                      selectedImage === image 
                        ? "border-primary shadow-lg shadow-primary/20" 
                        : "border-transparent hover:border-primary/50"
                    }`}
                  >
                    <img
                      src={image as string}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Info & Actions */}
          <div className="glass-card rounded-3xl p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                {product.is_new && (
                  <Badge className="rounded-full px-4 py-1 bg-primary/10 text-primary border-primary/20">
                    ✨ New
                  </Badge>
                )}
                {isLowStock && (
                  <Badge variant="outline" className="rounded-full px-4 py-1 border-amber-500/20 text-amber-600">
                    Low Stock
                  </Badge>
                )}
                {!isInStock && (
                  <Badge variant="destructive" className="rounded-full px-4 py-1">
                    Out of Stock
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2 leading-tight">{product.name}</h1>
              {product.categories && (
                <Link
                  to={`/category/${product.categories.slug}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  {product.categories.name} →
                </Link>
              )}
            </div>

            {/* Price & Stock */}
            <div className="flex items-baseline gap-4 py-4 border-y border-border/50">
              <p className="text-4xl lg:text-5xl font-bold text-primary">
                ${product.price.toFixed(2)}
              </p>
              {product.stock_quantity !== null && isInStock && (
                <p className="text-sm text-muted-foreground">
                  {product.stock_quantity} in stock
                </p>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Key Features/Benefits */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card rounded-2xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Free Shipping</p>
                <p className="font-semibold text-sm">On orders $50+</p>
              </div>
              <div className="glass-card rounded-2xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Easy Returns</p>
                <p className="font-semibold text-sm">30-day policy</p>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Quantity:</span>
                <div className="flex items-center glass-card rounded-full overflow-hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="rounded-none hover:bg-primary/10"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-14 text-center font-semibold">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={incrementQuantity}
                    disabled={!isInStock || (product.stock_quantity !== null && quantity >= product.stock_quantity)}
                    className="rounded-none hover:bg-primary/10"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleAddToCart}
                  className="w-full rounded-full h-14 text-lg font-semibold"
                  size="lg"
                  disabled={!isInStock}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {isInStock ? "Add to Cart" : "Out of Stock"}
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full h-12"
                    onClick={handleToggleFavorite}
                  >
                    <Heart className={`h-5 w-5 mr-2 ${isFavorite ? "fill-current text-red-500" : ""}`} />
                    Favorite
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full h-12"
                    onClick={handleShareProduct}
                  >
                    <Share2 className="h-5 w-5 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Section */}
        {product.description && (
          <div className="glass-card rounded-3xl p-6 lg:p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Product Details</h2>
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">You May Also Like</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  id={relatedProduct.id}
                  name={relatedProduct.name}
                  slug={relatedProduct.slug}
                  price={relatedProduct.price}
                  mainImageUrl={relatedProduct.main_image_url}
                  isNew={relatedProduct.is_new}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
