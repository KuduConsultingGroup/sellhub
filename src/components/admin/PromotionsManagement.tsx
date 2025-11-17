import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  banner_image_url: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean | null;
}

const PromotionsManagement = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    const { data } = await supabase.from("promotions").select("*").order("start_date", { ascending: false });
    if (data) setPromotions(data);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const promotionData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      banner_image_url: formData.get("banner_image_url") as string,
      start_date: formData.get("start_date") as string,
      end_date: formData.get("end_date") as string,
      is_active: formData.get("is_active") === "on",
    };

    if (editingPromotion) {
      const { error } = await supabase.from("promotions").update(promotionData).eq("id", editingPromotion.id);
      if (error) {
        toast.error("Failed to update promotion");
      } else {
        toast.success("Promotion updated successfully");
        setIsDialogOpen(false);
        setEditingPromotion(null);
        fetchPromotions();
      }
    } else {
      const { error } = await supabase.from("promotions").insert(promotionData);
      if (error) {
        toast.error("Failed to create promotion");
      } else {
        toast.success("Promotion created successfully");
        setIsDialogOpen(false);
        fetchPromotions();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this promotion?")) {
      const { error } = await supabase.from("promotions").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete promotion");
      } else {
        toast.success("Promotion deleted successfully");
        fetchPromotions();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Promotions Management</h1>
          <p className="text-muted-foreground">Create and manage promotional campaigns</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingPromotion(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Promotion
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPromotion ? "Edit Promotion" : "Create Promotion"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" defaultValue={editingPromotion?.title} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={editingPromotion?.description || ""} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banner_image_url">Banner Image URL</Label>
                <Input id="banner_image_url" name="banner_image_url" type="url" defaultValue={editingPromotion?.banner_image_url || ""} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input id="start_date" name="start_date" type="date" defaultValue={editingPromotion?.start_date} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input id="end_date" name="end_date" type="date" defaultValue={editingPromotion?.end_date} required />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="is_active" name="is_active" defaultChecked={editingPromotion?.is_active ?? true} />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <Button type="submit" className="w-full">
                {editingPromotion ? "Update Promotion" : "Create Promotion"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {promotions.map((promotion) => (
          <Card key={promotion.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="flex-1">{promotion.title}</CardTitle>
                <Badge variant={promotion.is_active ? "default" : "secondary"}>
                  {promotion.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {promotion.banner_image_url && (
                  <img src={promotion.banner_image_url} alt={promotion.title} className="w-full h-40 object-cover rounded" />
                )}
                <p className="text-sm text-muted-foreground">{promotion.description}</p>
                <p className="text-sm">
                  <span className="font-medium">Period:</span> {new Date(promotion.start_date).toLocaleDateString()} - {new Date(promotion.end_date).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setEditingPromotion(promotion);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(promotion.id)}>
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

export default PromotionsManagement;
