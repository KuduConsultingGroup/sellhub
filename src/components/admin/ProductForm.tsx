import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "./ImageUpload";

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  product?: any;
  categories: Category[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

const ProductForm = ({ product, categories, onSubmit, onCancel }: ProductFormProps) => {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    short_description: product?.short_description || "",
    description: product?.description || "",
    category_id: product?.category_id || "",
    price: product?.price || "",
    sale_price: product?.sale_price || "",
    stock_quantity: product?.stock_quantity || "",
    brand: product?.brand || "",
    sku: product?.sku || "",
    tags: product?.tags?.join(", ") || "",
    main_image_url: product?.main_image_url || "",
    additional_images: Array.isArray(product?.images) ? product.images : [],
    is_new: product?.is_new ?? false,
    is_active: product?.is_active ?? true,
    is_featured: product?.is_featured ?? false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from name
    if (field === "name") {
      const slug = value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleAddAdditionalImage = (url: string) => {
    if (formData.additional_images.length >= 10) {
      toast.error("Maximum 10 images allowed");
      return;
    }
    setFormData(prev => ({
      ...prev,
      additional_images: [...prev.additional_images, url]
    }));
  };

  const handleRemoveAdditionalImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additional_images: prev.additional_images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.price || !formData.category_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submitData = {
        name: formData.name,
        slug: formData.slug,
        short_description: formData.short_description,
        description: formData.description,
        category_id: formData.category_id,
        price: parseFloat(formData.price),
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : null,
        brand: formData.brand,
        sku: formData.sku,
        tags: formData.tags ? formData.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        main_image_url: formData.main_image_url,
        images: formData.additional_images,
        is_new: formData.is_new,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
      };

      await onSubmit(submitData);
    } catch (error) {
      toast.error("Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter product name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => handleChange("slug", e.target.value)}
              placeholder="product-slug"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="short_description">Short Description</Label>
            <Textarea
              id="short_description"
              value={formData.short_description}
              onChange={(e) => handleChange("short_description", e.target.value)}
              placeholder="Brief product description (1-2 lines)"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Full Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Detailed product description"
              rows={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category_id">Category *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => handleChange("category_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => handleChange("brand", e.target.value)}
                placeholder="Brand name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleChange("tags", e.target.value)}
              placeholder="tag1, tag2, tag3"
            />
            {formData.tags && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.split(",").map((tag: string, idx: number) => (
                  <Badge key={idx} variant="secondary">
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Regular Price * ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleChange("price", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sale_price">Sale Price ($)</Label>
              <Input
                id="sale_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.sale_price}
                onChange={(e) => handleChange("sale_price", e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {formData.price && formData.sale_price && (
            <p className="text-sm text-muted-foreground">
              Discount: {Math.round(((formData.price - formData.sale_price) / formData.price) * 100)}%
            </p>
          )}
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Product Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Main Product Image *</Label>
            <ImageUpload
              value={formData.main_image_url}
              onChange={(url) => handleChange("main_image_url", typeof url === 'string' ? url : url[0])}
              onRemove={() => handleChange("main_image_url", "")}
              aspectRatio="square"
              multiple={false}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Additional Images (Gallery)</Label>
              <span className="text-xs text-muted-foreground">
                {formData.additional_images.length}/10 images
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {formData.additional_images.map((url: string, idx: number) => (
                <div key={idx} className="relative group">
                  <div className="relative aspect-square border rounded-xl overflow-hidden">
                    <img
                      src={url}
                      alt={`Gallery ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAdditionalImage(idx)}
                      className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              {formData.additional_images.length < 10 && (
                <div className="col-span-2 md:col-span-3 lg:col-span-4">
                  <ImageUpload
                    onChange={(urls) => {
                      const urlArray = Array.isArray(urls) ? urls : [urls];
                      const remaining = 10 - formData.additional_images.length;
                      const newUrls = urlArray.slice(0, remaining);
                      setFormData(prev => ({
                        ...prev,
                        additional_images: [...prev.additional_images, ...newUrls]
                      }));
                    }}
                    aspectRatio="square"
                    multiple={true}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU / Product Code</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleChange("sku", e.target.value)}
                placeholder="SKU-12345"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Stock Quantity</Label>
              <Input
                id="stock_quantity"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => handleChange("stock_quantity", e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Status */}
      <Card>
        <CardHeader>
          <CardTitle>Product Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_active">Active</Label>
              <p className="text-sm text-muted-foreground">Product is visible in store</p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange("is_active", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_featured">Featured</Label>
              <p className="text-sm text-muted-foreground">Show on homepage</p>
            </div>
            <Switch
              id="is_featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) => handleChange("is_featured", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_new">New Arrival</Label>
              <p className="text-sm text-muted-foreground">Mark as new product</p>
            </div>
            <Switch
              id="is_new"
              checked={formData.is_new}
              onCheckedChange={(checked) => handleChange("is_new", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex gap-3 justify-end sticky bottom-0 bg-background py-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : product ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
