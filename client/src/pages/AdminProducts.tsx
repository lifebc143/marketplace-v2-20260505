import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Trash2, CheckCircle, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export default function AdminProducts() {
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

  // Fetch pending products
  const { data: products, isLoading, refetch } = trpc.admin.pendingProducts.useQuery(
    {
      limit,
      offset,
    },
    {
      enabled: isAuthenticated && user?.role === "admin",
    }
  );

  // Approve product mutation
  const approveMutation = trpc.admin.approveProduct.useMutation({
    onSuccess: () => {
      toast.success("商品已批准");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "操作失敗");
    },
  });

  // Remove product mutation
  const removeMutation = trpc.admin.removeProduct.useMutation({
    onSuccess: () => {
      toast.success("商品已移除");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "操作失敗");
    },
  });

  const handleApprove = async (productId: number) => {
    await approveMutation.mutateAsync({ productId });
  };

  const handleRemove = async (productId: number) => {
    if (confirm("確定要移除此商品嗎？")) {
      await removeMutation.mutateAsync({ productId });
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
          <h1 className="text-3xl font-bold">商品審核</h1>
          <p className="text-muted-foreground mt-2">
            審核待批准的商品
          </p>
        </div>
      </div>

      <div className="container py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : products && products.length > 0 ? (
          <>
            <div className="space-y-4 mb-8">
              {products.map((product) => (
                <Card key={product.id} className="p-6">
                  <div className="flex gap-6">
                    {/* Product Image Placeholder */}
                    <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-12 h-12 text-muted-foreground" />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2">
                        {product.title}
                      </h3>
                      <p className="text-muted-foreground line-clamp-2 mb-4">
                        {product.description}
                      </p>

                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-xl font-bold text-accent">
                          NT${(product.price / 100).toFixed(0)}
                        </span>
                        <span className="text-xs px-2 py-1 bg-secondary/20 text-secondary rounded">
                          {product.condition}
                        </span>
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                          待審核
                        </span>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <p>
                          發布於{" "}
                          {new Date(product.createdAt).toLocaleDateString(
                            "zh-TW"
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        className="gap-2 bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(product.id)}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4" />
                        批准
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 text-destructive hover:text-destructive"
                        onClick={() => handleRemove(product.id)}
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                        移除
                      </Button>
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
                disabled={products.length < limit}
                onClick={() => setOffset(offset + limit)}
              >
                下一頁
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg text-muted-foreground">
              暫無待審核商品
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
