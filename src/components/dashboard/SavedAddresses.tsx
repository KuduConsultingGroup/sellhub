import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SavedAddresses = () => {
  const [addresses, setAddresses] = useState([
    {
      id: "1",
      name: "John Doe",
      street: "123 Main Street",
      apartment: "Apt 4B",
      city: "New York",
      state: "NY",
      zip: "10001",
      country: "USA",
      phone: "+1 (555) 123-4567",
      isDefault: true,
    },
    {
      id: "2",
      name: "John Doe",
      street: "456 Office Plaza",
      apartment: "Suite 200",
      city: "Brooklyn",
      state: "NY",
      zip: "11201",
      country: "USA",
      phone: "+1 (555) 987-6543",
      isDefault: false,
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Saved Addresses</h1>
          <p className="text-muted-foreground mt-1">Manage your delivery addresses</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Address
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Address</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="John Doe" />
              </div>
              <div className="col-span-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="+1 (555) 123-4567" />
              </div>
              <div className="col-span-2">
                <Label htmlFor="street">Street Address</Label>
                <Input id="street" placeholder="123 Main Street" />
              </div>
              <div className="col-span-2">
                <Label htmlFor="apartment">Apartment, Suite, etc.</Label>
                <Input id="apartment" placeholder="Apt 4B (optional)" />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="New York" />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" placeholder="NY" />
              </div>
              <div>
                <Label htmlFor="zip">ZIP Code</Label>
                <Input id="zip" placeholder="10001" />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input id="country" placeholder="USA" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button>Save Address</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addresses.map((address) => (
          <Card key={address.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{address.name}</CardTitle>
                </div>
                {address.isDefault && (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    Default
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-1">
                <p>{address.street}</p>
                {address.apartment && <p>{address.apartment}</p>}
                <p>{address.city}, {address.state} {address.zip}</p>
                <p>{address.country}</p>
                <p className="pt-2">{address.phone}</p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-2 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
              {!address.isDefault && (
                <Button variant="secondary" size="sm" className="w-full">
                  Set as Default
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SavedAddresses;
