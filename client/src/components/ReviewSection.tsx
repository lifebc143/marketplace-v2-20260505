import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Star, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface ReviewSectionProps {
  productId: number;
  orderId?: number;
}

export default function ReviewSection({ productId, orderId }: ReviewSectionProps) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    rating: 5,
    title: "",
    content: "",
  });

  // 獲取評論
  const { data: reviewData, isLoading, refetch } = trpc.reviews.getByProductId.useQuery({
    productId,
    limit: 10,
    offset: 0,
  });

  // 創建評論
  const createMutation = trpc.reviews.create.useMutation();
  const updateMutation = trpc.reviews.update.useMutation();
  const deleteMutation = trpc.reviews.delete.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderId) {
      toast.error("無法找到訂單信息");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          ...formData,
        });
        toast.success("評論已更新");
      } else {
        await createMutation.mutateAsync({
          productId,
          orderId,
          ...formData,
        });
        toast.success("評論已發佈");
      }

      setFormData({ rating: 5, title: "", content: "" });
      setShowForm(false);
      setEditingId(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "發佈評論失敗");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("確定要刪除此評論嗎？")) return;

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("評論已刪除");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "刪除評論失敗");
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "fill-accent text-accent" : "text-muted-foreground"
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 評分統計 */}
      {reviewData && (
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-3xl font-bold text-accent">
                {reviewData.averageRating.toFixed(1)}
              </div>
              <div className="flex gap-1 mt-1">
                {renderStars(Math.round(reviewData.averageRating))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {reviewData.totalCount} 個評論
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 發佈評論按鈕 */}
      {user && orderId && (
        <Button
          onClick={() => setShowForm(!showForm)}
          className="w-full bg-accent hover:bg-accent/90"
        >
          {showForm ? "取消" : "發佈評論"}
        </Button>
      )}

      {/* 評論表單 */}
      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">評分</label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 cursor-pointer transition-colors ${
                        star <= formData.rating
                          ? "fill-accent text-accent"
                          : "text-muted-foreground hover:text-accent"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">標題</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="評論標題"
                className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">內容</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="分享你的使用體驗..."
                className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                rows={4}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="w-full bg-accent hover:bg-accent/90"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  發佈中...
                </>
              ) : (
                editingId ? "更新評論" : "發佈評論"
              )}
            </Button>
          </form>
        </Card>
      )}

      {/* 評論列表 */}
      <div className="space-y-4">
        {reviewData?.reviews && reviewData.reviews.length > 0 ? (
          reviewData.reviews.map((review) => (
            <Card key={review.id} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex gap-2 items-center">
                    <div className="flex gap-1">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {review.rating}/5
                    </span>
                  </div>
                  <h4 className="font-medium mt-1">{review.title}</h4>
                </div>
                {user?.id === review.buyerId && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(review.id);
                        setFormData({
                          rating: review.rating,
                          title: review.title,
                          content: review.content,
                        });
                        setShowForm(true);
                      }}
                      className="p-1 hover:bg-secondary rounded"
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="p-1 hover:bg-secondary rounded"
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-foreground mb-2">{review.content}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString("zh-TW")}
              </p>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            還沒有評論，成為第一個評論者吧！
          </div>
        )}
      </div>
    </div>
  );
}
