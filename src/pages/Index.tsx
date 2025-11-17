import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  main_image_url: string | null;
  short_description: string | null;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const Index = () => {
  const [featuredProduct, setFeaturedProduct] = useState<Product | null>(null);
  const [highlightProducts, setHighlightProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch featured product
    const { data: featured } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("is_featured", true)
      .limit(1)
      .single();
    
    if (featured) setFeaturedProduct(featured);

    // Fetch highlight products for sidebar
    const { data: highlights } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .limit(2)
      .neq("id", featured?.id || "");
    
    if (highlights) setHighlightProducts(highlights);

    // Fetch new products for bottom section
    const { data: newItems } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("is_new", true)
      .limit(4);
    
    if (newItems) setNewProducts(newItems);

    // Fetch categories
    const { data: cats } = await supabase
      .from("categories")
      .select("*")
      .limit(6);
    
    if (cats) setCategories(cats);

    // Get total product count
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);
    
    if (count) setTotalProducts(count);
  };

  const popularColors = [
    { name: "Red", color: "bg-colors-red" },
    { name: "Blue", color: "bg-colors-blue" },
    { name: "Green", color: "bg-colors-green" },
    { name: "Orange", color: "bg-colors-orange" },
    { name: "Purple", color: "bg-colors-purple" },
    { name: "Pink", color: "bg-colors-pink" },
  ];

  return (
    <div className="min-h-screen pb-12">
      <Header />
      
      <div className="container mx-auto px-4 lg:px-8 mt-8">
        {/* Main Hero + Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          {/* Main Hero Card */}
          <div className="lg:col-span-8">
            <div className="relative bg-card rounded-[2.5rem] shadow-float p-8 md:p-12 overflow-hidden hover-lift">
              {/* Step Indicator */}
              <div className="absolute top-8 right-8 text-6xl font-bold text-muted/20">01</div>
              
              <div className="grid md:grid-cols-2 gap-8 items-center relative z-10">
                {/* Left Content */}
                <div className="space-y-6">
                  <div className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    Featured Collection
                  </div>
                  
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                    {featuredProduct?.name || "Discover Amazing Products"}
                  </h1>
                  
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {featuredProduct?.short_description || "Shop the latest trends with unbeatable prices and quality"}
                  </p>
                  
                  <Button 
                    size="lg" 
                    className="rounded-full px-8 py-6 text-lg bg-primary hover:bg-primary-hover shadow-lg group"
                    asChild
                  >
                    <Link to="/products">
                      View All Products
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>

                {/* Right Product Image */}
                <div className="relative">
                  {featuredProduct?.main_image_url ? (
                    <img
                      src={featuredProduct.main_image_url}
                      alt={featuredProduct.name}
                      className="w-full h-auto max-h-96 object-contain drop-shadow-2xl"
                    />
                  ) : (
                    <div className="w-full h-96 bg-muted rounded-3xl flex items-center justify-center">
                      <span className="text-muted-foreground">Featured Product</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            {/* Popular Colors Card */}
            <div className="bg-card rounded-[2rem] shadow-card p-6">
              <h3 className="text-lg font-bold mb-4">Popular Colors</h3>
              <div className="flex flex-wrap gap-3">
                {popularColors.map((color) => (
                  <button
                    key={color.name}
                    className={`w-12 h-12 rounded-full ${color.color} shadow-md hover:scale-110 transition-transform cursor-pointer border-2 border-background`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Product Highlight Cards */}
            {highlightProducts.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.slug}`}
                className="block bg-card rounded-[2rem] shadow-card p-6 hover-lift group"
              >
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-muted overflow-hidden flex-shrink-0">
                    {product.main_image_url ? (
                      <img
                        src={product.main_image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm mb-1 truncate">{product.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {product.short_description || "Premium quality product"}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Info Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {/* More Products Card */}
          <div className="bg-card rounded-[2rem] shadow-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex -space-x-2">
                {newProducts.slice(0, 3).map((product) => (
                  <div
                    key={product.id}
                    className="w-8 h-8 rounded-full bg-muted border-2 border-background overflow-hidden"
                  >
                    {product.main_image_url && (
                      <img
                        src={product.main_image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm font-bold">More Products</p>
            <p className="text-xs text-muted-foreground">{totalProducts}+ items</p>
          </div>

          {/* Stats Card */}
          <div className="bg-card rounded-[2rem] shadow-card p-6">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-primary fill-primary" />
              <span className="text-lg font-bold">4.8</span>
            </div>
            <p className="text-sm font-bold">Customer Rating</p>
            <p className="text-xs text-muted-foreground">10k+ reviews</p>
          </div>

          {/* Trending Card */}
          <div className="bg-card rounded-[2rem] shadow-card p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold">#1</span>
            </div>
            <p className="text-sm font-bold">Trending Store</p>
            <p className="text-xs text-muted-foreground">This month</p>
          </div>

          {/* New Arrivals Card */}
          <div className="bg-card rounded-[2rem] shadow-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg">🎉</span>
              </div>
            </div>
            <p className="text-sm font-bold">New Arrivals</p>
            <p className="text-xs text-muted-foreground">Fresh products weekly</p>
          </div>
        </div>

        {/* New Products Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">New Arrivals</h2>
              <p className="text-muted-foreground">Check out our latest products</p>
            </div>
            <Button variant="ghost" className="rounded-full" asChild>
              <Link to="/products">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newProducts.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.slug}`}
                className="group"
              >
                <div className="bg-card rounded-[2rem] shadow-card overflow-hidden hover-lift">
                  <div className="aspect-square bg-muted overflow-hidden">
                    {product.main_image_url ? (
                      <img
                        src={product.main_image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold mb-1 truncate">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {product.short_description || "Premium quality product"}
                    </p>
                    <p className="text-lg font-bold text-primary">${product.price}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Categories Section */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2">Shop by Category</h2>
            <p className="text-muted-foreground">Browse our curated collections</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="group"
              >
                <div className="bg-card rounded-[2rem] shadow-card p-6 text-center hover-lift">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                    {category.name.charAt(0)}
                  </div>
                  <h3 className="font-bold text-sm group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-card rounded-[2rem] shadow-card p-8">
          <div className="text-center space-y-4">
            <h3 className="font-bold text-lg">Follow us on</h3>
            <div className="flex justify-center gap-4">
              <a href="#" className="w-12 h-12 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                <span className="text-lg">𝕏</span>
              </a>
              <a href="#" className="w-12 h-12 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                <span className="text-lg">📷</span>
              </a>
              <a href="#" className="w-12 h-12 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                <span className="text-lg">💼</span>
              </a>
              <a href="#" className="w-12 h-12 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                <span className="text-lg">🎵</span>
              </a>
            </div>
            <p className="text-sm text-muted-foreground">© 2024 ShopHub. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
