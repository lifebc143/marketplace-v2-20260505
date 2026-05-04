import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Check, Package, Clock, MapPin, Phone, User } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function OrderConfirmation() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const orderId = params?.id ? parseInt(params.id) : null;

  // 獲取訂單詳情
  const { data: order, isLoading: orderLoading } = trpc.orders.getById.useQuery(
    { id: orderId! },
    { enabled: !!orderId }
  );

  // 獲取賣家信息
  const { data: sellerInfo, isLoading: sellerLoading } = trpc.orders.getSellerInfo.useQuery(
    { orderId: orderId! },
    { enabled: !!orderId }
  );

  const contactSellerMutation = trpc.orders.contactSeller.useMutation();

  const handleContactSeller = async () => {
    if (!orderId) return;

    try {
      await contactSellerMutation.mutateAsync({ orderId });
      toast.success("已向賣家發送你的聯絡信息");
    } catch (error: any) {
      console.error("Failed to contact seller:", error);
      const errorMessage = error?.data?.message || error?.message || "聯絡賣家失敗，請重試";
      toast.error(errorMessage);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">請先登錄以查看訂單</p>
          <Button onClick={() => navigate("/")}>返回首頁</Button>
        </div>
      </div>
    );
  }

  if (orderLoading || sellerLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">訂單不存在</p>
          <Button onClick={() => navigate("/orders")}>返回訂單列表</Button>
        </div>
      </div>
    );
  }

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "待發貨",
      completed: "已完成",
      cancelled: "已取消",
      disputed: "有爭議",
    };
    return statusMap[status] || "未知";
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      disputed: "bg-orange-100 text-orange-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/orders")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回訂單列表
          </Button>
        </div>
      </div>

      <div className="container py-8">
        {/* Success Message */}
        <div className="mb-8">
          <Card className="p-8 text-center bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2 text-green-900">訂單已成功創建</h1>
            <p className="text-green-700 mb-4">感謝您的購買，請與賣家聯繫以完成交易</p>
            <p className="text-2xl font-bold text-accent">訂單編號：#{order.id}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Information */}
            {(order as any).product && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  商品信息
                </h2>
                <div className="flex gap-4">
                  {(order as any).product.images?.[0]?.imageUrl && (
                    <div className="flex-shrink-0">
                      <img
                        src={(order as any).product.images[0].imageUrl}
                        alt={(order as any).product.title}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-base mb-2">
                      {(order as any).product.title}
                    </p>
                    <p className="text-lg font-bold text-accent mb-2">
                      NT${((order as any).product.price / 100).toFixed(0)}
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      狀態：{(order as any).product.condition === 'like_new' ? '如新' : (order as any).product.condition === 'good' ? '良好' : '尚可'}
                    </p>
                    {(order as any).product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {(order as any).product.description}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Order Status */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">訂單狀態</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">當前狀態</p>
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
            </Card>

            {/* Shipping Address */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                收件地址
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">收件人</p>
                  <p className="font-medium text-foreground">{order.recipientName || '未提供'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">電話</p>
                  <p className="font-medium text-foreground">{order.recipientPhone || '未提供'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">地址</p>
                  <p className="font-medium text-foreground whitespace-pre-wrap">{order.recipientAddress || '未提供'}</p>
                </div>
              </div>
            </Card>

            {/* Order Notes */}
            {order.notes && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">備註</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
              </Card>
            )}

            {/* Important Disclaimer */}
            <Card className="p-6 bg-secondary/10 border-secondary">
              <p className="text-sm font-bold text-foreground mb-3">重要提示 - 免責聲明：</p>
              <ul className="text-xs text-muted-foreground space-y-2 ml-4">
                <li>✓ 本訂單代表買賣雙方的個人交易行為</li>
                <li>✓ 本網站僅提供交易平台，不涉及任何金流處理</li>
                <li>✓ 交易的安全性、商品品質及售後服務由買賣雙方自行負責</li>
                <li>✓ 本網站對交易過程中發生的任何糾紛不承擔責任</li>
                <li>✓ 請與賣家直接聯繫確認交易細節和付款方式</li>
              </ul>
            </Card>
          </div>

          {/* Order Summary & Seller Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <Card className="p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">訂單摘要</h2>

              <div className="space-y-4 mb-6 pb-6 border-b border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">訂單編號</span>
                  <span className="font-medium">#{order.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">訂單日期</span>
                  <span className="font-medium">
                    {new Date(order.createdAt).toLocaleDateString("zh-TW")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">訂單狀態</span>
                  <span className="font-medium">{getStatusLabel(order.status)}</span>
                </div>
              </div>

              {/* Total Amount */}
              <div className="mb-6 pb-6 border-b border-border">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">訂單金額</span>
                  <span className="text-2xl font-bold text-accent">
                    NT${(order.totalPrice / 100).toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Seller Info */}
              {sellerInfo && (
                <div className="space-y-4 mb-6 pb-6 border-b border-border">
                  <h3 className="font-bold text-sm">賣家信息</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{sellerInfo.name || "賣家"}</span>
                    </div>
                    {sellerInfo.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{sellerInfo.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  className="w-full bg-accent hover:bg-accent/90"
                  onClick={handleContactSeller}
                  disabled={contactSellerMutation.isPending}
                >
                  {contactSellerMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      聯絡中...
                    </>
                  ) : (
                    "聯絡賣家"
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/orders")}
                >
                  查看所有訂單
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/products")}
                >
                  繼續購物
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
