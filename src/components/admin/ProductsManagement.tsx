import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import ProductForm from "./ProductForm";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  sale_price: number | null;
  main_image_url: string | null;
  category_id: string | null;
  brand: string | null;
  sku: string | null;
  tags: string[] | null;
  is_new: boolean | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  stock_quantity: number | null;
}

interface Category {
  id: string;
  name: string;
}

const ProductsManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) setProducts(data);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("id, name");
    if (data) setCategories(data);
  };

  const handleSubmit = async (productData: any) => {
    if (editingProduct) {
      const { error } = await supabase.from("products").update(productData).eq("id", editingProduct.id);
      if (error) {
        throw error;
      } else {
        toast.success("Product updated successfully");
        setIsDialogOpen(false);
        setEditingProduct(null);
        fetchProducts();
      }
    } else {
      const { error } = await supabase.from("products").insert(productData);
      if (error) {
        throw error;
      } else {
        toast.success("Product created successfully");
        setIsDialogOpen(false);
        fetchProducts();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete product");
      } else {
        toast.success("Product deleted successfully");
        fetchProducts();
      }
    }
  };

  const toggleActive = async (product: Product) => {
    const { error } = await supabase
      .from("products")
      .update({ is_active: !product.is_active })
      .eq("id", product.id);
    
    if (error) {
      toast.error("Failed to update product status");
    } else {
      toast.success("Product status updated");
      fetchProducts();
    }
  };

  const openDialog = (product?: Product) => {
    setEditingProduct(product || null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products Management</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Create New Product"}</DialogTitle>
            </DialogHeader>
            <ProductForm
              product={editingProduct}
              categories={categories}
              onSubmit={handleSubmit}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    {product.sale_price ? (
                      <>
                        <p className="text-sm text-muted-foreground line-through">
                          ${product.price.toFixed(2)}
                        </p>
                        <p className="text-sm text-primary font-medium">
                          ${product.sale_price.toFixed(2)}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        ${product.price.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 mt-2">
                    {product.is_new && <Badge variant="secondary" className="text-xs">New</Badge>}
                    {product.is_featured && <Badge variant="default" className="text-xs">Featured</Badge>}
                  </div>
                </div>
                <Switch checked={product.is_active || false} onCheckedChange={() => toggleActive(product)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {product.main_image_url && (
                  <img src={product.main_image_url} alt={product.name} className="w-full h-40 object-cover rounded" />
                )}
                {product.short_description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{product.short_description}</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {product.brand && <span>Brand: {product.brand}</span>}
                  {product.sku && <span>SKU: {product.sku}</span>}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openDialog(product)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProductsManagement;
