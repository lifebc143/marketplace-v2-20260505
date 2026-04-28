import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ShoppingBag, Plus, Edit2, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function MyProducts() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [editingId, setEditingId] = useState<number | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Fetch user's products
  const { data: products, isLoading, refetch } = trpc.products.myProducts.useQuery(
    {
      limit: 100,
      offset: 0,
    },
    {
      enabled: isAuthenticated,
    }
  );

  // Delist product mutation
  const delistMutation = trpc.products.delist.useMutation({
    onSuccess: () => {
      toast.success("商品已下架");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "下架失敗");
    },
  });

  const handleDelist = async (productId: number) => {
    if (confirm("確定要下架此商品嗎？")) {
      await delistMutation.mutateAsync({ id: productId });
    }
  };

  if (!isAuthenticated) {
    return null;
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">我的商品</h1>
              <p className="text-muted-foreground mt-2">
                管理您上架的所有商品
              </p>
            </div>
            <Link href="/products/create">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Plus className="w-4 h-4 mr-2" />
                上架新商品
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : products && products.length > 0 ? (
          <div className="space-y-4">
            {products.map((product) => (
              <Card key={product.id} className="p-6">
                <div className="flex gap-6">
                  {/* Product Image Placeholder */}
                  <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-12 h-12 text-muted-foreground" />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-2">
                          {product.title}
                        </h3>
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs px-2 py-1 bg-secondary/20 text-secondary rounded">
                            {product.condition}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              product.status === "active"
                                ? "bg-green-100 text-green-700"
                                : product.status === "sold"
                                ? "bg-gray-100 text-gray-700"
                                : product.status === "pending_review"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {product.status === "active"
                              ? "販售中"
                              : product.status === "sold"
                              ? "已售出"
                              : product.status === "pending_review"
                              ? "審核中"
                              : "已移除"}
                          </span>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-accent">
                        NT${(product.price / 100).toFixed(0)}
                      </p>
                    </div>

                    <p className="text-muted-foreground line-clamp-2 mb-4">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="space-x-4">
                        <span>{product.views} 次瀏覽</span>
                        <span>
                          發布於{" "}
                          {new Date(product.createdAt).toLocaleDateString(
                            "zh-TW"
                          )}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {product.status === "active" && (
                          <>
                            <Link href={`/products/${product.id}/edit`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-2"
                              >
                                <Edit2 className="w-4 h-4" />
                                編輯
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 text-destructive hover:text-destructive"
                              onClick={() => handleDelist(product.id)}
                              disabled={delistMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                              下架
                            </Button>
                          </>
                        )}
                        <Link href={`/products/${product.id}`}>
                          <Button size="sm" variant="outline">
                            查看
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg text-muted-foreground mb-6">
              您還沒有上架任何商品
            </p>
            <Link href="/products/create">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Plus className="w-4 h-4 mr-2" />
                立即上架商品
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
