import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import EnhancedProductCard from "@/components/products/EnhancedProductCard";
import FilterSidebar from "@/components/products/FilterSidebar";
import ViewOptionsDropdown from "@/components/products/ViewOptionsDropdown";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  main_image_url: string | null;
  short_description: string | null;
  is_new: boolean | null;
  is_featured: boolean | null;
  stock_quantity: number | null;
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [showInStock, setShowInStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<"large" | "medium" | "small" | "list" | "compact">("medium");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchQuery, selectedCategories, sortBy, priceRange, selectedColors, minRating, showInStock]);

  const fetchData = async () => {
    setLoading(true);
    const { data: productsData } = await supabase.from("products").select(`*, categories(name, slug)`).eq("is_active", true).order("created_at", { ascending: false });
    const { data: categoriesData } = await supabase.from("categories").select("*").order("name");
    if (productsData) setProducts(productsData);
    if (categoriesData) setCategories(categoriesData);
    setLoading(false);
  };

  const filterAndSortProducts = () => {
    let result = [...products];
    if (searchQuery) result = result.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (selectedCategories.length > 0) result = result.filter(p => p.category_id && selectedCategories.includes(p.category_id));
    result = result.filter(p => { const price = p.sale_price || p.price; return price >= priceRange[0] && price <= priceRange[1]; });
    if (showInStock) result = result.filter(p => p.stock_quantity && p.stock_quantity > 0);
    
    switch (sortBy) {
      case "price-low": result.sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price)); break;
      case "price-high": result.sort((a, b) => (b.sale_price || b.price) - (a.sale_price || a.price)); break;
      case "name": result.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    setFilteredProducts(result);
  };

  const clearFilters = () => {
    setSearchQuery(""); setSelectedCategories([]); setPriceRange([0, 1000]); setSelectedColors([]); setMinRating(0); setShowInStock(false);
  };

  const hasActiveFilters = searchQuery || selectedCategories.length > 0 || priceRange[0] > 0 || priceRange[1] < 1000 || selectedColors.length > 0 || minRating > 0 || showInStock;

  const removeFilter = (filterType: string, value?: string) => {
    if (filterType === "search") setSearchQuery("");
    else if (filterType === "category" && value) setSelectedCategories(prev => prev.filter(id => id !== value));
    else if (filterType === "price") setPriceRange([0, 1000]);
    else if (filterType === "color" && value) setSelectedColors(prev => prev.filter(c => c !== value));
    else if (filterType === "rating") setMinRating(0);
    else if (filterType === "stock") setShowInStock(false);
  };

  const gridClass = {
    large: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
    medium: "grid-cols-2 md:grid-cols-3 xl:grid-cols-4",
    small: "grid-cols-2 md:grid-cols-4 xl:grid-cols-5",
    list: "grid-cols-1",
    compact: "grid-cols-3 md:grid-cols-5 xl:grid-cols-6",
  };

  if (loading) {
    return (<><Header /><main className="container mx-auto px-4 py-8"><div className="flex gap-8"><div className="hidden lg:block w-64 flex-shrink-0"><Skeleton className="h-[600px] w-full rounded-3xl" /></div><div className="flex-1"><Skeleton className="h-8 w-48 mb-4" /><div className={`grid ${gridClass.medium} gap-6`}>{Array.from({ length: 8 }).map((_, i) => (<div key={i} className="space-y-4"><Skeleton className="aspect-[3/4] w-full rounded-2xl" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>))}</div></div></div></main></>);
  }

  const FilterSidebarComponent = (<FilterSidebar categories={categories} selectedCategories={selectedCategories} onCategoryChange={setSelectedCategories} priceRange={priceRange} onPriceRangeChange={setPriceRange} selectedColors={selectedColors} onColorChange={setSelectedColors} minRating={minRating} onRatingChange={setMinRating} showInStock={showInStock} onInStockChange={setShowInStock} onClearFilters={clearFilters} />);

  return (<><Header /><main className="container mx-auto px-4 py-8"><Breadcrumb className="mb-6"><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Shop</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb><div className="mb-8"><h1 className="text-4xl md:text-5xl font-bold mb-3 gradient-text">Explore Products</h1><p className="text-muted-foreground text-lg">Discover our complete collection of premium products</p></div><div className="relative max-w-2xl mb-8"><Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" /><Input placeholder="Search for products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-12 h-12 rounded-full shadow-soft" /></div>{hasActiveFilters && (<div className="flex flex-wrap gap-2 mb-6">{searchQuery && (<Badge variant="secondary" className="gap-2 py-1.5 px-3">Search: {searchQuery}<button onClick={() => removeFilter("search")}><X className="h-3 w-3" /></button></Badge>)}{selectedCategories.map((catId) => { const cat = categories.find(c => c.id === catId); return cat ? (<Badge key={catId} variant="secondary" className="gap-2 py-1.5 px-3">{cat.name}<button onClick={() => removeFilter("category", catId)}><X className="h-3 w-3" /></button></Badge>) : null; })}{(priceRange[0] > 0 || priceRange[1] < 1000) && (<Badge variant="secondary" className="gap-2 py-1.5 px-3">${priceRange[0]} - ${priceRange[1]}<button onClick={() => removeFilter("price")}><X className="h-3 w-3" /></button></Badge>)}{selectedColors.map((color) => (<Badge key={color} variant="secondary" className="gap-2 py-1.5 px-3">Color: {color}<button onClick={() => removeFilter("color", color)}><X className="h-3 w-3" /></button></Badge>))}{minRating > 0 && (<Badge variant="secondary" className="gap-2 py-1.5 px-3">{minRating}★ & up<button onClick={() => removeFilter("rating")}><X className="h-3 w-3" /></button></Badge>)}{showInStock && (<Badge variant="secondary" className="gap-2 py-1.5 px-3">In Stock<button onClick={() => removeFilter("stock")}><X className="h-3 w-3" /></button></Badge>)}<Button variant="ghost" size="sm" onClick={clearFilters} className="h-7">Clear All</Button></div>)}<div className="flex gap-8"><aside className="hidden lg:block w-64 flex-shrink-0">{FilterSidebarComponent}</aside><Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}><SheetTrigger asChild className="lg:hidden fixed bottom-4 right-4 z-50"><Button size="lg" className="rounded-full shadow-float"><SlidersHorizontal className="mr-2 h-5 w-5" />Filters</Button></SheetTrigger><SheetContent side="left" className="w-80 overflow-y-auto">{FilterSidebarComponent}</SheetContent></Sheet><div className="flex-1 min-w-0"><div className="flex items-center justify-between mb-6 flex-wrap gap-4"><p className="text-muted-foreground">Showing <span className="font-semibold text-foreground">{filteredProducts.length}</span> products</p><div className="flex items-center gap-3"><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[200px]"><SelectValue placeholder="Sort By" /></SelectTrigger><SelectContent><SelectItem value="newest">Newest First</SelectItem><SelectItem value="price-low">Price: Low to High</SelectItem><SelectItem value="price-high">Price: High to Low</SelectItem><SelectItem value="bestselling">Bestselling</SelectItem><SelectItem value="rating">Highest Rated</SelectItem><SelectItem value="name">Name: A to Z</SelectItem></SelectContent></Select><ViewOptionsDropdown currentView={viewMode} onViewChange={setViewMode} /></div></div>{filteredProducts.length === 0 ? (<div className="text-center py-20"><div className="max-w-md mx-auto"><h2 className="text-3xl font-bold mb-3">No products found</h2><p className="text-muted-foreground mb-8 text-lg">Try adjusting your filters or search terms</p><Button size="lg" onClick={clearFilters} className="rounded-full">Clear All Filters</Button></div></div>) : (<div className={`grid ${gridClass[viewMode]} gap-6`}>{filteredProducts.map((product) => (<EnhancedProductCard key={product.id} id={product.id} name={product.name} slug={product.slug} price={product.price} salePrice={product.sale_price} mainImageUrl={product.main_image_url} shortDescription={product.short_description} isNew={product.is_new} isFeatured={product.is_featured} viewMode={viewMode} />))}</div>)}</div></div></main></>);
};

export default Products;
