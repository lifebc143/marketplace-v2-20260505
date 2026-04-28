import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Users, ShoppingBag, AlertCircle, ArrowLeft, Tag, TrendingUp, Clock } from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  // Fetch admin data - MUST be called before any conditional returns
  const { data: stats, isLoading: statsLoading, error: statsError } = trpc.admin.stats.useQuery(undefined, {
    enabled: !authLoading && isAuthenticated && user?.role === "admin",
  });

  const { data: users, isLoading: usersLoading } = trpc.admin.users.useQuery(
    {
      limit: 5,
      offset: 0,
    },
    {
      enabled: !authLoading && isAuthenticated && user?.role === "admin",
    }
  );

  const { data: pendingProducts, isLoading: productsLoading } = trpc.admin.pendingProducts.useQuery(
    {
      limit: 5,
      offset: 0,
    },
    {
      enabled: !authLoading && isAuthenticated && user?.role === "admin",
    }
  );

  // Redirect if not admin (moved to useEffect to avoid render-phase navigation)
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      navigate("/");
    }
  }, [authLoading, isAuthenticated, user?.role, navigate]);

  const isLoading = statsLoading || usersLoading || productsLoading;

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // Don't render if not admin
  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="container py-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <h1 className="text-3xl font-bold">管理員後台</h1>
          <p className="text-muted-foreground mt-2">
            監控平台運營、審核內容、管理使用者
          </p>
        </div>
      </div>

      <div className="container py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            {statsError && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-200/50 rounded-lg">
                <p className="text-sm text-red-600">無法載入統計數據。請重新整理頁面。</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Total Users */}
              <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">總使用者數</p>
                    <p className="text-2xl font-bold text-blue-600">{stats?.totalUsers || 0}</p>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </Card>

              {/* Active Products */}
              <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">活躍商品數</p>
                    <p className="text-2xl font-bold text-green-600">{stats?.activeProducts || 0}</p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </Card>

              {/* Pending Review */}
              <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-200/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">待審核商品數</p>
                    <p className="text-2xl font-bold text-orange-600">{stats?.pendingReviewProducts || 0}</p>
                  </div>
                  <div className="p-3 bg-orange-500/20 rounded-lg">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </Card>

              {/* Total Categories */}
              <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">商品分類數</p>
                    <p className="text-2xl font-bold text-purple-600">{stats?.totalCategories || 0}</p>
                  </div>
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <Tag className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Management Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Users Management */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">使用者管理</h2>
                      <p className="text-sm text-muted-foreground">
                        管理平台使用者
                      </p>
                    </div>
                  </div>
                </div>

                {users && users.length > 0 ? (
                  <div className="space-y-3 mb-6">
                    {users.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{u.name || "未命名"}</p>
                          <p className="text-xs text-muted-foreground">
                            {u.email}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-secondary/20 text-secondary rounded">
                          {u.role}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground mb-6">暫無使用者</p>
                )}

                <Link href="/admin/users">
                  <Button variant="outline" className="w-full">
                    查看全部使用者
                  </Button>
                </Link>
              </Card>

              {/* Products Review */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-accent/10 rounded-lg">
                      <AlertCircle className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">待審核商品</h2>
                      <p className="text-sm text-muted-foreground">
                        需要審核的商品
                      </p>
                    </div>
                  </div>
                </div>

                {pendingProducts && pendingProducts.length > 0 ? (
                  <div className="space-y-3 mb-6">
                    {pendingProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium line-clamp-1">
                            {product.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            NT${(product.price / 100).toFixed(0)}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                          審核中
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground mb-6">暫無待審核商品</p>
                )}

                <Link href="/admin/products">
                  <Button variant="outline" className="w-full">
                    查看全部商品
                  </Button>
                </Link>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="mt-8 p-6">
              <h2 className="text-lg font-bold mb-4">快速操作</h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Link href="/admin/users">
                  <Button variant="outline" className="w-full">
                    <Users className="w-4 h-4 mr-2" />
                    使用者管理
                  </Button>
                </Link>
                <Link href="/admin/products">
                  <Button variant="outline" className="w-full">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    商品審核
                  </Button>
                </Link>
                <Link href="/admin/all-products">
                  <Button variant="outline" className="w-full">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    商品管理
                  </Button>
                </Link>
                <Link href="/admin/categories">
                  <Button variant="outline" className="w-full">
                    <Tag className="w-4 h-4 mr-2" />
                    分類管理
                  </Button>
                </Link>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
