import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Star, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
}

interface FilterSidebarProps {
  categories: Category[];
  selectedCategories: string[];
  onCategoryChange: (categoryIds: string[]) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  selectedColors: string[];
  onColorChange: (colors: string[]) => void;
  minRating: number;
  onRatingChange: (rating: number) => void;
  showInStock: boolean;
  onInStockChange: (value: boolean) => void;
  onClearFilters: () => void;
}

const COLORS = [
  { name: "Red", value: "red", class: "bg-[hsl(var(--color-red))]" },
  { name: "Blue", value: "blue", class: "bg-[hsl(var(--color-blue))]" },
  { name: "Green", value: "green", class: "bg-[hsl(var(--color-green))]" },
  { name: "Orange", value: "orange", class: "bg-[hsl(var(--color-orange))]" },
  { name: "Purple", value: "purple", class: "bg-[hsl(var(--color-purple))]" },
  { name: "Pink", value: "pink", class: "bg-[hsl(var(--color-pink))]" },
];

const FilterSidebar = ({
  categories,
  selectedCategories,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  selectedColors,
  onColorChange,
  minRating,
  onRatingChange,
  showInStock,
  onInStockChange,
  onClearFilters,
}: FilterSidebarProps) => {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    colors: true,
    rating: true,
    availability: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoryChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      onCategoryChange([...selectedCategories, categoryId]);
    }
  };

  const handleColorToggle = (color: string) => {
    if (selectedColors.includes(color)) {
      onColorChange(selectedColors.filter(c => c !== color));
    } else {
      onColorChange([...selectedColors, color]);
    }
  };

  return (
    <Card className="sticky top-24 h-fit shadow-elegant">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Filters</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Clear All
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Categories */}
        <div>
          <button
            onClick={() => toggleSection("categories")}
            className="flex w-full items-center justify-between text-sm font-semibold mb-3"
          >
            <span>Categories</span>
            <span className="text-muted-foreground">{expandedSections.categories ? "−" : "+"}</span>
          </button>
          
          {expandedSections.categories && (
            <div className="space-y-2.5">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                  />
                  <Label
                    htmlFor={`category-${category.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {category.name}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Price Range */}
        <div>
          <button
            onClick={() => toggleSection("price")}
            className="flex w-full items-center justify-between text-sm font-semibold mb-3"
          >
            <span>Price Range</span>
            <span className="text-muted-foreground">{expandedSections.price ? "−" : "+"}</span>
          </button>
          
          {expandedSections.price && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Min: ${priceRange[0]}</span>
                <span className="text-muted-foreground">Max: ${priceRange[1]}</span>
              </div>
              <Slider
                min={0}
                max={1000}
                step={10}
                value={priceRange}
                onValueChange={(value) => onPriceRangeChange(value as [number, number])}
                className="w-full"
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Colors */}
        <div>
          <button
            onClick={() => toggleSection("colors")}
            className="flex w-full items-center justify-between text-sm font-semibold mb-3"
          >
            <span>Colors</span>
            <span className="text-muted-foreground">{expandedSections.colors ? "−" : "+"}</span>
          </button>
          
          {expandedSections.colors && (
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorToggle(color.value)}
                  className={`h-8 w-8 rounded-full ${color.class} relative transition-transform hover:scale-110 ${
                    selectedColors.includes(color.value) ? "ring-2 ring-primary ring-offset-2" : ""
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Rating */}
        <div>
          <button
            onClick={() => toggleSection("rating")}
            className="flex w-full items-center justify-between text-sm font-semibold mb-3"
          >
            <span>Rating</span>
            <span className="text-muted-foreground">{expandedSections.rating ? "−" : "+"}</span>
          </button>
          
          {expandedSections.rating && (
            <div className="space-y-2">
              {[4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => onRatingChange(rating)}
                  className={`flex items-center w-full space-x-2 px-2 py-1.5 rounded-lg transition-colors ${
                    minRating === rating ? "bg-primary/10" : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center">
                    {Array.from({ length: rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <span className="text-sm">& up</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Availability */}
        <div>
          <button
            onClick={() => toggleSection("availability")}
            className="flex w-full items-center justify-between text-sm font-semibold mb-3"
          >
            <span>Availability</span>
            <span className="text-muted-foreground">{expandedSections.availability ? "−" : "+"}</span>
          </button>
          
          {expandedSections.availability && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="in-stock"
                checked={showInStock}
                onCheckedChange={onInStockChange}
              />
              <Label htmlFor="in-stock" className="text-sm font-normal cursor-pointer">
                In Stock Only
              </Label>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterSidebar;
