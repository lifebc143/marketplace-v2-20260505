import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Check } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function Checkout() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // 從 URL 查詢參數中獲取商品 ID 和數量
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("productId");
  const quantity = parseInt(urlParams.get("quantity") || "1");

  const [formData, setFormData] = useState({
    recipientName: "",
    recipientPhone: "",
    recipientAddress: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  // 獲取商品信息
  const { data: product, isLoading: productLoading } = trpc.products.getById.useQuery(
    { id: productId ? parseInt(productId) : 0 },
    { enabled: !!productId }
  );

  const createOrderMutation = trpc.orders.create.useMutation();

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">請先登錄以繼續購買</p>
          <Button onClick={() => navigate("/")}>返回首頁</Button>
        </div>
      </div>
    );
  }

  if (productLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">商品不存在</p>
          <Button onClick={() => navigate("/products")}>返回商品列表</Button>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 驗證免責聲明
    if (!disclaimerAccepted) {
      toast.error("請確認已閱讀並同意免責聲明");
      return;
    }

    // 驗證表單
    if (!formData.recipientName.trim()) {
      toast.error("請輸入收件人姓名");
      return;
    }
    if (!formData.recipientPhone.trim()) {
      toast.error("請輸入收件人電話");
      return;
    }
    if (!formData.recipientAddress.trim()) {
      toast.error("請輸入收件地址");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createOrderMutation.mutateAsync({
        productId: product.id,
        quantity,
        recipientName: formData.recipientName,
        recipientPhone: formData.recipientPhone,
        recipientAddress: formData.recipientAddress,
        notes: formData.notes || undefined,
      });

      setOrderId(result.orderId);
      // 跳轉到訂單確認頁面
      setTimeout(() => {
        navigate(`/orders/${result.orderId}/confirmation`);
      }, 500);
      toast.success("訂單已成功創建！");
    } catch (error: any) {
      console.error("Failed to create order:", error);
      const errorMessage = error?.data?.message || error?.message || "創建訂單失敗，請重試";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 訂單已創建，頁面會自動跳轉到訂單確認頁面
  if (orderCreated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">正在跳轉到訂單確認頁面...</p>
        </div>
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
            onClick={() => navigate(`/products/${product.id}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回商品詳情
          </Button>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h1 className="text-2xl font-bold mb-6">收件人信息</h1>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">姓名 *</label>
                  <Input
                    type="text"
                    name="recipientName"
                    value={formData.recipientName}
                    onChange={handleInputChange}
                    placeholder="請輸入收件人姓名"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">電話 *</label>
                  <Input
                    type="tel"
                    name="recipientPhone"
                    value={formData.recipientPhone}
                    onChange={handleInputChange}
                    placeholder="請輸入收件人電話"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">地址 *</label>
                  <Textarea
                    name="recipientAddress"
                    value={formData.recipientAddress}
                    onChange={handleInputChange}
                    placeholder="請輸入收件地址"
                    disabled={isSubmitting}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">備註（可選）</label>
                  <Textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="例如：請在下午3點後送達"
                    disabled={isSubmitting}
                    rows={3}
                  />
                </div>

                {/* 免責聲明 */}
                <div className="bg-secondary/10 rounded-lg p-4 border border-border">
                  <p className="text-sm font-bold text-foreground mb-3">免責聲明：</p>
                  <ul className="text-xs text-muted-foreground space-y-2 ml-4 mb-4">
                    <li>• 本訂單代表買賣雙方的個人交易行為</li>
                    <li>• 本網站僅提供交易平台，不涉及任何金流處理</li>
                    <li>• 交易的安全性、商品品質及售後服務由買賣雙方自行負責</li>
                    <li>• 本網站對交易過程中發生的任何糾紛不承擔責任</li>
                    <li>• 請與賣家直接聯繫確認交易細節和付款方式</li>
                  </ul>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={disclaimerAccepted}
                      onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                      disabled={isSubmitting}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-xs text-muted-foreground">
                      我已閱讀並同意上述免責聲明
                    </span>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-accent hover:bg-accent/90"
                  disabled={isSubmitting || !disclaimerAccepted}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      正在創建訂單...
                    </>
                  ) : (
                    "確認購買"
                  )}
                </Button>
              </form>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">訂單摘要</h2>

              {/* Product Info */}
              <div className="mb-6 pb-6 border-b border-border">
                <div className="flex gap-4">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0].imageUrl}
                      alt={product.title}
                      className="w-20 h-20 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 bg-secondary/20 rounded flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">無圖片</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium">{product.title}</h3>
                    <p className="text-sm text-muted-foreground">數量：{quantity}</p>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 mb-6 pb-6 border-b border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">單價</span>
                  <span>NT${(product.price / 100).toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">數量</span>
                  <span>x {quantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">運費</span>
                  <span>待定</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center mb-6">
                <span className="font-medium">合計</span>
                <span className="text-2xl font-bold text-accent">
                  NT${((product.price * quantity) / 100).toFixed(0)}
                </span>
              </div>

              {/* Info */}
              <div className="bg-secondary/10 rounded p-4 text-xs text-muted-foreground">
                <p className="mb-2">ℹ️ 個人交易平台</p>
                <p className="mb-2">ℹ️ 買賣雙方自行協商</p>
                <p>ℹ️ 網站不涉及金流</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
