import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ShoppingBag, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import ChatBox from "@/components/ChatBox";

export default function ProductDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const productId = params?.id ? parseInt(params.id) : null;

  const { data: product, isLoading, error } = trpc.products.getById.useQuery(
    { id: productId! },
    { enabled: !!productId }
  );

  if (!productId) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">商品不存在</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/products")}
          >
            返回商品列表
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">無法載入商品</p>
          <Button
            variant="outline"
            onClick={() => navigate("/products")}
          >
            返回商品列表
          </Button>
        </div>
      </div>
    );
  }

  const handlePrevImage = () => {
    if (product.images && product.images.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (product.images && product.images.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/products")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Images */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden mb-6 relative bg-gradient-to-br from-primary/20 to-accent/20">
              <div
                className="w-full flex items-center justify-center relative"
                style={{ aspectRatio: "4/3" }}
              >
                {product.images && product.images.length > 0 ? (
                  <>
                    <img
                      key={selectedImageIndex}
                      src={product.images[selectedImageIndex].imageUrl}
                      alt={product.title}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    {/* Navigation Arrows */}
                    {product.images.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
                          aria-label="上一張圖片"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={handleNextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
                          aria-label="下一張圖片"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                        {/* Image Counter */}
                        <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                          {selectedImageIndex + 1} / {product.images.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <ShoppingBag className="w-24 h-24 text-muted-foreground" />
                )}
              </div>
            </Card>

            {/* Image Thumbnails */}
            {product.images && product.images.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image, idx) => (
                  <Card
                    key={idx}
                    className={`overflow-hidden cursor-pointer hover:shadow-md transition-all ${
                      selectedImageIndex === idx ? "ring-2 ring-accent" : ""
                    }`}
                    onClick={() => setSelectedImageIndex(idx)}
                  >
                    <div className="w-full h-24 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
                      <img
                        src={image.imageUrl}
                        alt={`${product.title} - ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2 text-foreground">
                  {product.title}
                </h1>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs px-3 py-1 bg-secondary/20 text-secondary rounded-full">
                    {product.condition}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {product.views} 次瀏覽
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6 pb-6 border-b border-border">
                <p className="text-sm text-muted-foreground mb-2">價格</p>
                <p className="text-4xl font-bold text-accent">
                  NT${(product.price / 100).toFixed(0)}
                </p>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="font-bold text-lg mb-3">商品描述</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => {
                    navigate(`/checkout?productId=${product.id}&quantity=1`);
                  }}
                >
                  立即購買
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    if (!user) {
                      navigate("/");
                      return;
                    }
                    // 導航到訊息頁面，開始與賣家對話
                    navigate("/messages");
                  }}
                >
                  聯絡賣家
                </Button>
              </div>

              {/* Status */}
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">商品狀態</p>
                <p className="text-sm font-medium">
                  {product.status === "active"
                    ? "販售中"
                    : product.status === "sold"
                    ? "已售出"
                    : product.status === "pending_review"
                    ? "審核中"
                    : "已移除"}
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Seller Info */}
        <Card className="mt-8 p-6">
          <h2 className="font-bold text-lg mb-4">賣家資訊</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium">賣家</p>
              <p className="text-sm text-muted-foreground">
                商品發布於 {new Date(product.createdAt).toLocaleDateString("zh-TW")}
              </p>
            </div>
            <Button variant="outline">查看其他商品</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
