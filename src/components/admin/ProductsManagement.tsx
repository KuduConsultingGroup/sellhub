import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  main_image_url: string | null;
  category_id: string | null;
  is_new: boolean | null;
  is_active: boolean | null;
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const productData = {
      name: formData.get("name") as string,
      slug: (formData.get("name") as string).toLowerCase().replace(/\s+/g, "-"),
      description: formData.get("description") as string,
      price: parseFloat(formData.get("price") as string),
      main_image_url: formData.get("main_image_url") as string,
      category_id: formData.get("category_id") as string,
      is_new: formData.get("is_new") === "on",
      is_active: formData.get("is_active") === "on",
      stock_quantity: parseInt(formData.get("stock_quantity") as string),
    };

    if (editingProduct) {
      const { error } = await supabase.from("products").update(productData).eq("id", editingProduct.id);
      if (error) {
        toast.error("Failed to update product");
      } else {
        toast.success("Product updated successfully");
        setIsDialogOpen(false);
        setEditingProduct(null);
        fetchProducts();
      }
    } else {
      const { error } = await supabase.from("products").insert(productData);
      if (error) {
        toast.error("Failed to create product");
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products Management</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingProduct(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Create Product"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" name="name" defaultValue={editingProduct?.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={editingProduct?.description || ""} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input id="price" name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">Stock Quantity</Label>
                  <Input id="stock_quantity" name="stock_quantity" type="number" defaultValue={editingProduct?.stock_quantity || 0} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="main_image_url">Main Image URL</Label>
                <Input id="main_image_url" name="main_image_url" type="url" defaultValue={editingProduct?.main_image_url || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category_id">Category</Label>
                <Select name="category_id" defaultValue={editingProduct?.category_id || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="is_new" name="is_new" defaultChecked={editingProduct?.is_new || false} />
                <Label htmlFor="is_new">Mark as New</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="is_active" name="is_active" defaultChecked={editingProduct?.is_active ?? true} />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <Button type="submit" className="w-full">
                {editingProduct ? "Update Product" : "Create Product"}
              </Button>
            </form>
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
                  <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
                </div>
                <Switch checked={product.is_active || false} onCheckedChange={() => toggleActive(product)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {product.main_image_url && (
                  <img src={product.main_image_url} alt={product.name} className="w-full h-40 object-cover rounded" />
                )}
                <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setEditingProduct(product);
                      setIsDialogOpen(true);
                    }}
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
