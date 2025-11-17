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
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-8">The product you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const allImages = [
    product.main_image_url,
    ...(Array.isArray(product.images) ? product.images : []),
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          {product.categories && (
            <>
              <Link to={`/category/${product.categories.slug}`} className="hover:text-foreground">
                {product.categories.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg bg-muted">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No Image
                </div>
              )}
            </div>
            
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {allImages.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(image as string)}
                    className={`aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                      selectedImage === image ? "border-primary" : "border-transparent"
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

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              {product.is_new && (
                <Badge variant="secondary" className="mb-2">New</Badge>
              )}
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              {product.categories && (
                <Link
                  to={`/category/${product.categories.slug}`}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  {product.categories.name}
                </Link>
              )}
            </div>

            <div className="flex items-baseline gap-4">
              <p className="text-4xl font-bold text-primary">
                ${product.price.toFixed(2)}
              </p>
              {product.stock_quantity !== null && (
                <p className="text-sm text-muted-foreground">
                  {product.stock_quantity > 0
                    ? `${product.stock_quantity} in stock`
                    : "Out of stock"}
                </p>
              )}
            </div>

            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground">{product.description}</p>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Quantity:</span>
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={incrementQuantity}
                    disabled={product.stock_quantity !== null && quantity >= product.stock_quantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  className="flex-1"
                  size="lg"
                  disabled={product.stock_quantity === 0}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleToggleFavorite}
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleShareProduct}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
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
