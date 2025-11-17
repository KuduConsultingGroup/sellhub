import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Loader2 } from "lucide-react";

export const UsersManagement = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "user"
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: formData
      });

      if (error) throw error;

      if (data.warning) {
        toast.warning(data.warning);
      } else {
        toast.success(`${formData.role === 'super_admin' ? 'Admin' : 'User'} account created successfully!`);
      }

      // Reset form
      setFormData({
        email: "",
        password: "",
        name: "",
        role: "user"
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const createDemoUsers = async () => {
    setLoading(true);
    const demoUsers = [
      { email: "user1@test.com", password: "test123456", name: "Demo User 1", role: "user" },
      { email: "user2@test.com", password: "test123456", name: "Demo User 2", role: "user" },
      { email: "user3@test.com", password: "test123456", name: "Demo User 3", role: "user" }
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const user of demoUsers) {
      try {
        const { error } = await supabase.functions.invoke('create-user', {
          body: user
        });
        if (error) throw error;
        successCount++;
      } catch (error) {
        console.error(`Error creating ${user.email}:`, error);
        errorCount++;
      }
    }

    setLoading(false);
    if (successCount > 0) {
      toast.success(`Created ${successCount} demo user accounts`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to create ${errorCount} accounts (may already exist)`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground">Create admin and demo user accounts</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create User Form */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create User Account
            </CardTitle>
            <CardDescription>
              Create individual user or admin accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Regular User</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create User
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Demo Users */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Quick Demo Setup</CardTitle>
            <CardDescription>
              Create multiple test accounts with one click
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
              <p className="font-medium">This will create:</p>
              <ul className="space-y-1 ml-4 list-disc text-muted-foreground">
                <li>user1@test.com (password: test123456)</li>
                <li>user2@test.com (password: test123456)</li>
                <li>user3@test.com (password: test123456)</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                All accounts will be regular users with email auto-confirmed
              </p>
            </div>

            <Button 
              onClick={createDemoUsers} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Demo Users...
                </>
              ) : (
                'Create Demo Users'
              )}
            </Button>

            <div className="rounded-lg border border-border/50 bg-card p-4 space-y-2 text-sm">
              <p className="font-medium text-foreground">Existing Admin Account:</p>
              <div className="text-muted-foreground space-y-1">
                <p>Email: admin@shophub.com</p>
                <p>Password: admin123</p>
                <p className="text-xs">Role: Super Admin</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
