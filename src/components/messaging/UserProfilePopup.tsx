import { useEffect, useState } from "react";
import { User, Mail, Phone, MapPin, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface UserProfile {
  name: string;
  email: string;
  addresses?: Array<{
    full_name: string;
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  }>;
}

interface UserProfilePopupProps {
  userId: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserProfilePopup = ({
  userId,
  guestName,
  guestEmail,
  open,
  onOpenChange,
}: UserProfilePopupProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && userId) {
      loadProfile();
    }
  }, [open, userId]);

  const loadProfile = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", userId)
        .single();

      const { data: addressData } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId)
        .eq("is_default", true)
        .limit(1);

      setProfile({
        name: profileData?.name || "",
        email: profileData?.email || "",
        addresses: addressData || [],
      });
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const isGuest = !userId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isGuest ? "Guest Profile" : "User Profile"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isGuest ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Name:</span>
                  <span>{guestName || "Not provided"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span>{guestEmail || "Not provided"}</span>
                </div>
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    This is a guest user without an account
                  </p>
                </div>
              </div>
            </>
          ) : loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : profile ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Name:</span>
                  <span>{profile.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span>{profile.email}</span>
                </div>
              </div>

              {profile.addresses && profile.addresses.length > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <MapPin className="h-4 w-4" />
                    Primary Address
                  </div>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p>{profile.addresses[0].full_name}</p>
                    <p>{profile.addresses[0].street}</p>
                    <p>
                      {profile.addresses[0].city}, {profile.addresses[0].state}{" "}
                      {profile.addresses[0].postal_code}
                    </p>
                    <p>{profile.addresses[0].country}</p>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  window.open(`/admin/users?userId=${userId}`, "_blank");
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Full Profile
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Unable to load profile
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
