import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    phone: "",
    address: "",
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Fetch user profile
  const { data: profileData, isLoading } = trpc.users.me.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Get utils for query invalidation
  const utils = trpc.useUtils();

  // Initialize form data from profile
  useEffect(() => {
    if (profileData?.profile || user) {
      setFormData({
        name: user?.name || "",
        bio: profileData?.profile?.bio || "",
        phone: profileData?.profile?.phone || "",
        address: profileData?.profile?.address || "",
      });
    }
  }, [profileData, user]);

  // Update profile mutation
  const updateProfileMutation = trpc.users.updateProfile.useMutation({
    onSuccess: async () => {
      toast.success(t("profile.updateSuccess"));
      setIsEditing(false);
      // Invalidate and refetch the profile data
      await utils.users.me.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || t("profile.updateError"));
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Only send profile fields to the API (bio, phone, address)
    await updateProfileMutation.mutateAsync({
      bio: formData.bio,
      phone: formData.phone,
      address: formData.address,
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("common.back")}
          </Button>
          <h1 className="text-3xl font-bold">{t("profile.title")}</h1>
        </div>
      </div>

      <div className="container py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* User Info Card */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">{t("profile.accountInfo")}</h2>

            <div className="space-y-4">
              <div>
                <Label>{t("profile.name")}</Label>
                <p className="mt-2 text-lg font-medium">{user?.name || t("profile.notSet")}</p>
              </div>

              <div>
                <Label>{t("profile.email")}</Label>
                <p className="mt-2 text-lg font-medium">{user?.email || t("profile.notSet")}</p>
              </div>

              <div>
                <Label>{t("profile.status")}</Label>
                <p className="mt-2">
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {t("profile.active")}
                  </span>
                </p>
              </div>

              <div>
                <Label>{t("profile.joinDate")}</Label>
                <p className="mt-2 text-lg font-medium">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("zh-TW")
                    : t("profile.unknown")}
                </p>
              </div>
            </div>
          </Card>

          {/* Profile Edit Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{t("profile.personalInfo")}</h2>
              {!isEditing && (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  {t("common.edit")}
                </Button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="bio">{t("profile.bio")}</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder={t("profile.bioPlaceholder")}
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">{t("profile.phone")}</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder={t("profile.phonePlaceholder")}
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="address">{t("profile.address")}</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder={t("profile.addressPlaceholder")}
                    value={formData.address}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="flex-1"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t("common.saving")}
                      </>
                    ) : (
                      t("common.save")
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>{t("profile.bio")}</Label>
                  <p className="mt-2 text-muted-foreground">
                    {profileData?.profile?.bio || t("profile.notSet")}
                  </p>
                </div>

                <div>
                  <Label>{t("profile.phone")}</Label>
                  <p className="mt-2 text-muted-foreground">
                    {profileData?.profile?.phone || t("profile.notSet")}
                  </p>
                </div>

                <div>
                  <Label>{t("profile.address")}</Label>
                  <p className="mt-2 text-muted-foreground">
                    {profileData?.profile?.address || t("profile.notSet")}
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Quick Links */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">{t("profile.quickLinks")}</h2>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/my-products")}
              >
                {t("nav.myProducts")}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t("common.logout")}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
