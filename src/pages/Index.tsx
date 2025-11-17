import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, TrendingUp, Shield, Truck, CreditCard, Headphones, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  main_image_url: string | null;
  short_description: string | null;
  is_new: boolean | null;
  is_featured: boolean | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  end_date: string;
}

const Index = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activePromotion, setActivePromotion] = useState<Promotion | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Featured products
    const { data: featured } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("is_featured", true)
      .limit(4);
    if (featured) setFeaturedProducts(featured);

    // New arrivals
    const { data: newItems } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("is_new", true)
      .limit(12);
    if (newItems) setNewArrivals(newItems);

    // Trending (just get some products for demo)
    const { data: trending } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .limit(6);
    if (trending) setTrendingProducts(trending);

    // Categories
    const { data: cats } = await supabase
      .from("categories")
      .select("*")
      .limit(8);
    if (cats) setCategories(cats);

    // Active promotion
    const { data: promo } = await supabase
      .from("promotions")
      .select("*")
      .eq("is_active", true)
      .gte("end_date", new Date().toISOString())
      .limit(1)
      .single();
    if (promo) setActivePromotion(promo);
  };

  const whyShopFeatures = [
    {
      icon: Truck,
      title: "Worldwide Shipping",
      description: "Fast delivery to your doorstep"
    },
    {
      icon: Shield,
      title: "Secure Checkout",
      description: "100% secure payment"
    },
    {
      icon: CreditCard,
      title: "Easy Returns",
      description: "30-day money back guarantee"
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Always here to help you"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      rating: 5,
      text: "Amazing quality and fast shipping! Will definitely order again.",
      avatar: "SJ"
    },
    {
      name: "Michael Chen",
      rating: 5,
      text: "Best online shopping experience I've had. Great customer service!",
      avatar: "MC"
    },
    {
      name: "Emma Williams",
      rating: 5,
      text: "Love the products! Everything arrived exactly as described.",
      avatar: "EW"
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 overflow-hidden">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="bg-card rounded-[3rem] shadow-float p-8 md:p-16 relative overflow-hidden">
            {/* Background gradient decoration */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-br from-primary/10 to-transparent rounded-[3rem] -z-0" />
            
            <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
              <div className="space-y-6">
                <Badge className="inline-flex rounded-full px-4 py-2 bg-primary/10 text-primary border-none">
                  New Season Collection
                </Badge>
                
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                  Discover the Future of Shopping
                </h1>
                
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Latest Trends. Modern Designs. Premium Quality. Experience shopping redefined with our curated collection of world-class products.
                </p>
                
                <div className="flex flex-wrap gap-4 pt-4">
                  <Button 
                    size="lg" 
                    className="rounded-full px-8 py-6 text-lg bg-primary hover:bg-primary-hover shadow-lg group"
                    asChild
                  >
                    <Link to="/products">
                      Shop Now
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="rounded-full px-8 py-6 text-lg"
                    asChild
                  >
                    <Link to="/products">View Latest Products</Link>
                  </Button>
                </div>

                <div className="flex items-center gap-8 pt-4">
                  <div>
                    <p className="text-3xl font-bold">5M+</p>
                    <p className="text-sm text-muted-foreground">Happy Customers</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">4.8★</p>
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                  </div>
                </div>
              </div>

              <div className="relative">
                {featuredProducts[0]?.main_image_url ? (
                  <img
                    src={featuredProducts[0].main_image_url}
                    alt="Featured Product"
                    className="w-full h-auto max-h-[600px] object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-[500px] bg-gradient-to-br from-primary/20 to-accent/20 rounded-[3rem] flex items-center justify-center">
                    <p className="text-2xl font-bold text-muted-foreground">Featured Product</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Trends Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="inline-flex rounded-full px-4 py-2 bg-primary/10 text-primary border-none mb-4">
              Trending Now
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Latest Trends</h2>
            <p className="text-xl text-muted-foreground">Discover what's hot in the market</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingProducts.map((product, index) => (
              <Link
                key={product.id}
                to={`/product/${product.slug}`}
                className="group"
              >
                <Card className="rounded-[2rem] shadow-card overflow-hidden hover-lift border-none bg-gradient-to-br from-card to-muted/30">
                  <div className="aspect-square overflow-hidden relative">
                    {product.main_image_url ? (
                      <img
                        src={product.main_image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <TrendingUp className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                    <Badge className="absolute top-4 left-4 rounded-full bg-primary text-primary-foreground border-none">
                      Trend #{index + 1}
                    </Badge>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {product.short_description || "Explore this trending product"}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">${product.price}</span>
                      <Button className="rounded-full" size="icon">
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <Badge className="inline-flex rounded-full px-4 py-2 bg-primary/10 text-primary border-none mb-4">
                Fresh Picks
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-2">New Arrivals</h2>
              <p className="text-xl text-muted-foreground">Just landed in our store</p>
            </div>
            <div className="hidden md:flex gap-2">
              <Button variant="outline" size="icon" className="rounded-full">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.slice(0, 8).map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.slug}`}
                className="group"
              >
                <Card className="rounded-[2rem] shadow-card overflow-hidden hover-lift border-none">
                  <div className="aspect-square bg-muted overflow-hidden relative">
                    {product.main_image_url ? (
                      <img
                        src={product.main_image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        New Product
                      </div>
                    )}
                    <Badge className="absolute top-3 right-3 rounded-full bg-primary text-primary-foreground border-none">
                      New
                    </Badge>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold mb-1 truncate group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {product.short_description || "Premium quality product"}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">${product.price}</span>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary hover:text-primary-foreground">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="inline-flex rounded-full px-4 py-2 bg-primary/10 text-primary border-none mb-4">
              Handpicked For You
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Featured Products</h2>
            <p className="text-xl text-muted-foreground">Our top picks just for you</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredProducts.map((product) => (
              <Card
                key={product.id}
                className="rounded-[2.5rem] shadow-float overflow-hidden hover-lift border-none group"
              >
                <div className="grid md:grid-cols-2 gap-6 p-6 md:p-8">
                  <div className="aspect-square rounded-[2rem] overflow-hidden bg-muted">
                    {product.main_image_url ? (
                      <img
                        src={product.main_image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Star className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center space-y-4">
                    <Badge className="w-fit rounded-full bg-primary/10 text-primary border-none">
                      Featured
                    </Badge>
                    <h3 className="text-2xl md:text-3xl font-bold">{product.name}</h3>
                    <p className="text-muted-foreground">
                      {product.short_description || "Premium quality product with exceptional features"}
                    </p>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary fill-primary" />
                      <Star className="h-5 w-5 text-primary fill-primary" />
                      <Star className="h-5 w-5 text-primary fill-primary" />
                      <Star className="h-5 w-5 text-primary fill-primary" />
                      <Star className="h-5 w-5 text-primary fill-primary" />
                      <span className="text-sm text-muted-foreground ml-2">(128 reviews)</span>
                    </div>
                    <p className="text-3xl font-bold">${product.price}</p>
                    <div className="flex gap-3 pt-2">
                      <Button className="rounded-full flex-1" asChild>
                        <Link to={`/product/${product.slug}`}>View Product</Link>
                      </Button>
                      <Button variant="outline" className="rounded-full">Add to Cart</Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Shop With Us Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Shop With Us?</h2>
            <p className="text-xl text-muted-foreground">We're committed to your satisfaction</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyShopFeatures.map((feature, index) => (
              <Card key={index} className="rounded-[2rem] shadow-card p-8 text-center hover-lift border-none">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Categories Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Popular Categories</h2>
            <p className="text-xl text-muted-foreground">Browse by your interests</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="group"
              >
                <Card className="rounded-[2rem] shadow-card p-6 text-center hover-lift border-none">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4 text-2xl group-hover:scale-110 transition-transform">
                    {category.name.charAt(0)}
                  </div>
                  <h3 className="font-bold text-sm group-hover:text-primary transition-colors truncate">
                    {category.name}
                  </h3>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="inline-flex rounded-full px-4 py-2 bg-primary/10 text-primary border-none mb-4">
              Testimonials
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-xl text-muted-foreground">Join 5M+ happy shoppers worldwide</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="rounded-[2rem] shadow-card p-8 border-none hover-lift">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-bold">{testimonial.name}</p>
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-primary fill-primary" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground italic">"{testimonial.text}"</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Promotional Banner Section */}
      {activePromotion && (
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <Card className="rounded-[3rem] shadow-float overflow-hidden border-none bg-gradient-to-r from-primary to-accent">
              <div className="p-12 md:p-16 text-center text-primary-foreground">
                <Badge className="inline-flex rounded-full px-4 py-2 bg-background/20 backdrop-blur-sm border-none mb-6">
                  Limited Time Offer
                </Badge>
                <h2 className="text-4xl md:text-6xl font-bold mb-6">{activePromotion.title}</h2>
                <p className="text-xl md:text-2xl mb-8 opacity-90">
                  {activePromotion.description || "Don't miss out on this exclusive deal"}
                </p>
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="rounded-full px-8 py-6 text-lg shadow-lg"
                  asChild
                >
                  <Link to="/promotions">
                    Shop the Sale
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-16 bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="text-2xl font-bold mb-4">ShopHub</h3>
              <p className="text-muted-foreground mb-6">
                Your one-stop shop for quality products at great prices. Experience shopping redefined.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                  𝕏
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                  📷
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                  💼
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                  🎵
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Shop</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><Link to="/products" className="hover:text-primary transition-colors">All Products</Link></li>
                <li><Link to="/promotions" className="hover:text-primary transition-colors">Promotions</Link></li>
                <li><a href="#" className="hover:text-primary transition-colors">New Arrivals</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Featured</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Company</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Press</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Newsletter</h4>
              <p className="text-muted-foreground mb-4">Subscribe for exclusive offers and updates</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-4 py-2 rounded-full bg-muted border-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button className="rounded-full">
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © 2024 ShopHub. All rights reserved.
              </p>
              <div className="flex gap-4 items-center">
                <span className="text-sm text-muted-foreground">We accept:</span>
                <div className="flex gap-2">
                  <div className="w-10 h-6 rounded bg-muted flex items-center justify-center text-xs">💳</div>
                  <div className="w-10 h-6 rounded bg-muted flex items-center justify-center text-xs">💰</div>
                  <div className="w-10 h-6 rounded bg-muted flex items-center justify-center text-xs">🏦</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
