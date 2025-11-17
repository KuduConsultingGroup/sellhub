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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  minimum_order_amount: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean | null;
  max_uses: number | null;
  current_uses: number | null;
}

const CouponsManagement = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    if (data) setCoupons(data);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const couponData = {
      code: (formData.get("code") as string).toUpperCase(),
      description: formData.get("description") as string,
      discount_type: formData.get("discount_type") as "percentage" | "fixed",
      discount_value: parseFloat(formData.get("discount_value") as string),
      minimum_order_amount: parseFloat(formData.get("minimum_order_amount") as string) || 0,
      start_date: formData.get("start_date") as string,
      end_date: formData.get("end_date") as string,
      is_active: formData.get("is_active") === "on",
      max_uses: formData.get("max_uses") ? parseInt(formData.get("max_uses") as string) : null,
    };

    if (editingCoupon) {
      const { error } = await supabase.from("coupons").update(couponData).eq("id", editingCoupon.id);
      if (error) {
        toast.error("Failed to update coupon");
      } else {
        toast.success("Coupon updated successfully");
        setIsDialogOpen(false);
        setEditingCoupon(null);
        fetchCoupons();
      }
    } else {
      const { error } = await supabase.from("coupons").insert(couponData);
      if (error) {
        toast.error("Failed to create coupon");
      } else {
        toast.success("Coupon created successfully");
        setIsDialogOpen(false);
        fetchCoupons();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this coupon?")) {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete coupon");
      } else {
        toast.success("Coupon deleted successfully");
        fetchCoupons();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Coupons Management</h1>
          <p className="text-muted-foreground">Create and manage discount coupons</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCoupon(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCoupon ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Coupon Code</Label>
                <Input id="code" name="code" defaultValue={editingCoupon?.code} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={editingCoupon?.description || ""} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_type">Discount Type</Label>
                  <Select name="discount_type" defaultValue={editingCoupon?.discount_type || "percentage"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount_value">Discount Value</Label>
                  <Input id="discount_value" name="discount_value" type="number" step="0.01" defaultValue={editingCoupon?.discount_value} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minimum_order_amount">Min. Order Amount</Label>
                  <Input id="minimum_order_amount" name="minimum_order_amount" type="number" step="0.01" defaultValue={editingCoupon?.minimum_order_amount || 0} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_uses">Max Uses (optional)</Label>
                  <Input id="max_uses" name="max_uses" type="number" defaultValue={editingCoupon?.max_uses || ""} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input id="start_date" name="start_date" type="date" defaultValue={editingCoupon?.start_date} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input id="end_date" name="end_date" type="date" defaultValue={editingCoupon?.end_date} required />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="is_active" name="is_active" defaultChecked={editingCoupon?.is_active ?? true} />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <Button type="submit" className="w-full">
                {editingCoupon ? "Update Coupon" : "Create Coupon"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {coupons.map((coupon) => (
          <Card key={coupon.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="font-mono text-lg">{coupon.code}</CardTitle>
                <Badge variant={coupon.is_active ? "default" : "secondary"}>
                  {coupon.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{coupon.description}</p>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Discount:</span> {coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `$${coupon.discount_value}`}</p>
                  {coupon.minimum_order_amount && coupon.minimum_order_amount > 0 && (
                    <p><span className="font-medium">Min. Order:</span> ${coupon.minimum_order_amount}</p>
                  )}
                  {coupon.max_uses && (
                    <p><span className="font-medium">Uses:</span> {coupon.current_uses || 0} / {coupon.max_uses}</p>
                  )}
                  <p><span className="font-medium">Valid:</span> {new Date(coupon.start_date).toLocaleDateString()} - {new Date(coupon.end_date).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setEditingCoupon(coupon);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(coupon.id)}>
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

export default CouponsManagement;
