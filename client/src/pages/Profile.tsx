import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
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
      toast.success("檔案已更新");
      setIsEditing(false);
      // Invalidate and refetch the profile data
      await utils.users.me.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "更新失敗");
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
            返回
          </Button>
          <h1 className="text-3xl font-bold">個人檔案</h1>
        </div>
      </div>

      <div className="container py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* User Info Card */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">帳號資訊</h2>

            <div className="space-y-4">
              <div>
                <Label>名稱</Label>
                <p className="mt-2 text-lg font-medium">{user?.name || "未設定"}</p>
              </div>

              <div>
                <Label>電子郵件</Label>
                <p className="mt-2 text-lg font-medium">{user?.email || "未設定"}</p>
              </div>

              <div>
                <Label>帳號狀態</Label>
                <p className="mt-2">
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    正常
                  </span>
                </p>
              </div>

              <div>
                <Label>加入日期</Label>
                <p className="mt-2 text-lg font-medium">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("zh-TW")
                    : "未知"}
                </p>
              </div>
            </div>
          </Card>

          {/* Profile Edit Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">個人資料</h2>
              {!isEditing && (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  編輯
                </Button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="bio">個人簡介</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder="介紹您自己..."
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">電話</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="09xx-xxx-xxx"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="address">地址</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="您的地址"
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
                    取消
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      "保存"
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>個人簡介</Label>
                  <p className="mt-2 text-muted-foreground">
                    {profileData?.profile?.bio || "未設定"}
                  </p>
                </div>

                <div>
                  <Label>電話</Label>
                  <p className="mt-2 text-muted-foreground">
                    {profileData?.profile?.phone || "未設定"}
                  </p>
                </div>

                <div>
                  <Label>地址</Label>
                  <p className="mt-2 text-muted-foreground">
                    {profileData?.profile?.address || "未設定"}
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Quick Links */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">快速連結</h2>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/my-products")}
              >
                我的商品
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                登出
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
