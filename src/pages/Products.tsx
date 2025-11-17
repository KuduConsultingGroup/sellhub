import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  main_image_url: string | null;
  is_new: boolean | null;
  is_featured: boolean | null;
  category_id: string | null;
  categories: { name: string; slug: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [priceRange, setPriceRange] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchQuery, selectedCategory, sortBy, priceRange]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch all active products with categories
    const { data: productsData } = await supabase
      .from("products")
      .select(`
        *,
        categories(name, slug)
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    
    // Fetch all categories
    const { data: categoriesData } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    
    if (productsData) setProducts(productsData);
    if (categoriesData) setCategories(categoriesData);
    
    setLoading(false);
  };

  const filterAndSortProducts = () => {
    let result = [...products];

    // Search filter
    if (searchQuery) {
      result = result.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter(product => product.category_id === selectedCategory);
    }

    // Price range filter
    if (priceRange !== "all") {
      const ranges = {
        "under-50": [0, 50],
        "50-100": [50, 100],
        "100-200": [100, 200],
        "over-200": [200, Infinity],
      };
      const [min, max] = ranges[priceRange as keyof typeof ranges] || [0, Infinity];
      result = result.filter(product => product.price >= min && product.price < max);
    }

    // Sort
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
      default:
        // Already sorted by created_at desc from fetch
        break;
    }

    setFilteredProducts(result);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSortBy("newest");
    setPriceRange("all");
  };

  const hasActiveFilters = searchQuery || selectedCategory !== "all" || priceRange !== "all";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Header />
        <div className="container py-8 lg:py-12">
          <Skeleton className="h-12 w-64 mb-8 rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-3xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      
      <div className="container py-8 lg:py-12">
        {/* Page Header */}
        <div className="mb-8 lg:mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold mb-3">All Products</h1>
          <p className="text-muted-foreground text-lg">
            Discover our complete collection of {products.length} amazing products
          </p>
        </div>

        {/* Filters Section */}
        <div className="glass-card rounded-3xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Filters & Search</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-full h-12 bg-background/50"
                />
              </div>
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="rounded-full h-12 bg-background/50">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Price Range */}
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="rounded-full h-12 bg-background/50">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="under-50">Under $50</SelectItem>
                <SelectItem value="50-100">$50 - $100</SelectItem>
                <SelectItem value="100-200">$100 - $200</SelectItem>
                <SelectItem value="over-200">Over $200</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="rounded-full h-12 bg-background/50">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name">Name: A to Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters & Clear */}
          {hasActiveFilters && (
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/50">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="rounded-full">
                  Search: "{searchQuery}"
                </Badge>
              )}
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="rounded-full">
                  {categories.find(c => c.id === selectedCategory)?.name}
                </Badge>
              )}
              {priceRange !== "all" && (
                <Badge variant="secondary" className="rounded-full">
                  {priceRange.replace("-", " - $").replace("under", "Under $").replace("over", "Over $")}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="ml-auto rounded-full"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'product' : 'products'}
          </p>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center">
            <p className="text-lg text-muted-foreground mb-4">No products found</p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} className="rounded-full">
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
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
        )}
      </div>
    </div>
  );
};

export default Products;
