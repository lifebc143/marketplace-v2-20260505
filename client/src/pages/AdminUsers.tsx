import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Trash2, Ban } from "lucide-react";
import { toast } from "sonner";

export default function AdminUsers() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Redirect if not admin
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      navigate("/");
    }
  }, [isAuthenticated, user?.role, navigate]);

  // Fetch users
  const { data: users, isLoading, refetch } = trpc.admin.users.useQuery(
    {
      limit,
      offset,
    },
    {
      enabled: isAuthenticated && user?.role === "admin",
    }
  );

  // Disable user mutation
  const disableUserMutation = trpc.admin.disableUser.useMutation({
    onSuccess: () => {
      toast.success("使用者已停用");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "操作失敗");
    },
  });

  // Remove user mutation
  const removeUserMutation = trpc.admin.removeUser.useMutation({
    onSuccess: () => {
      toast.success("使用者已移除");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "操作失敗");
    },
  });

  const handleDisableUser = async (userId: number) => {
    if (confirm("確定要停用此使用者嗎？")) {
      await disableUserMutation.mutateAsync({ userId });
    }
  };

  const handleRemoveUser = async (userId: number) => {
    if (confirm("確定要移除此使用者嗎？此操作無法復原。")) {
      await removeUserMutation.mutateAsync({ userId });
    }
  };

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <h1 className="text-3xl font-bold">使用者管理</h1>
          <p className="text-muted-foreground mt-2">
            管理平台上的所有使用者
          </p>
        </div>
      </div>

      <div className="container py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : users && users.length > 0 ? (
          <>
            <div className="space-y-4 mb-8">
              {users.map((u) => (
                <Card key={u.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2">
                        {u.name || "未命名"}
                      </h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>電子郵件：{u.email || "未設定"}</p>
                        <p>
                          加入日期：
                          {new Date(u.createdAt).toLocaleDateString("zh-TW")}
                        </p>
                        <p>
                          最後登入：
                          {new Date(u.lastSignedIn).toLocaleDateString("zh-TW")}
                        </p>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <span className="text-xs px-2 py-1 bg-secondary/20 text-secondary rounded">
                          {u.role}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {u.role !== "admin" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={() => handleDisableUser(u.id)}
                            disabled={disableUserMutation.isPending}
                          >
                            <Ban className="w-4 h-4" />
                            停用
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveUser(u.id)}
                            disabled={removeUserMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                            移除
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - limit))}
              >
                上一頁
              </Button>
              <Button
                variant="outline"
                disabled={users.length < limit}
                onClick={() => setOffset(offset + limit)}
              >
                下一頁
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground">暫無使用者</p>
          </div>
        )}
      </div>
    </div>
  );
}
