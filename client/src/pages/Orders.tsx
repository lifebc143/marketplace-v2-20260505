import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Package, Clock, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function Orders() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // 獲取用戶的訂單列表
  const { data: orders, isLoading, error } = trpc.orders.getMyOrders.useQuery();

  // 獲取選中訂單的詳情
  const { data: selectedOrder } = trpc.orders.getById.useQuery(
    { id: selectedOrderId! },
    { enabled: !!selectedOrderId }
  );

  const confirmOrderMutation = trpc.orders.confirm.useMutation();

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

  const handleConfirmOrder = async () => {
    if (!selectedOrderId) return;

    try {
      await confirmOrderMutation.mutateAsync({ id: selectedOrderId });
      toast.success("訂單已確認");
      setSelectedOrderId(null);
    } catch (error) {
      console.error("Failed to confirm order:", error);
      toast.error("確認訂單失敗，請重試");
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: any }> = {
      pending: { label: "待發貨", color: "text-yellow-500", icon: Clock },
      confirmed: { label: "已確認", color: "text-blue-500", icon: CheckCircle },
      shipped: { label: "已發貨", color: "text-blue-500", icon: Package },
      delivered: { label: "已送達", color: "text-green-500", icon: CheckCircle },
      cancelled: { label: "已取消", color: "text-red-500", icon: XCircle },
    };
    return statusMap[status] || { label: "未知", color: "text-gray-500", icon: Clock };
  };

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
            返回首頁
          </Button>
          <h1 className="text-3xl font-bold">我的訂單</h1>
        </div>
      </div>

      <div className="container py-8">
        {error ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground mb-4">無法載入訂單列表</p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              重新整理
            </Button>
          </Card>
        ) : !orders || orders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground mb-4">您還沒有訂單</p>
            <Button
              className="bg-accent hover:bg-accent/90"
              onClick={() => navigate("/products")}
            >
              開始購物
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Orders List */}
            <div className="lg:col-span-2 space-y-4">
              {orders.map((order) => {
                const statusInfo = getStatusLabel(order.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <Card
                    key={order.id}
                    className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg">訂單 #{order.id}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("zh-TW")}
                        </p>
                      </div>
                      <div className={`flex items-center gap-2 ${statusInfo.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{statusInfo.label}</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 pb-4 border-b border-border">
                      <p className="text-sm">
                        <span className="text-muted-foreground">收件人：</span>
                        <span className="font-medium">{order.recipientName}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">電話：</span>
                        <span className="font-medium">{order.recipientPhone}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">地址：</span>
                        <span className="font-medium line-clamp-1">{order.recipientAddress}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">訂單總額</span>
                      <span className="text-2xl font-bold text-accent">
                        NT${(order.totalAmount / 100).toFixed(0)}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Order Details */}
            {selectedOrder && (
              <div className="lg:col-span-1">
                <Card className="p-6 sticky top-4">
                  <h2 className="text-xl font-bold mb-4">訂單詳情</h2>

                  <div className="space-y-4 mb-6 pb-6 border-b border-border">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">訂單編號</p>
                      <p className="font-medium">#{selectedOrder.id}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">訂單狀態</p>
                      <div className={`flex items-center gap-2 ${getStatusLabel(selectedOrder.status).color}`}>
                        {(() => {
                          const Icon = getStatusLabel(selectedOrder.status).icon;
                          return <Icon className="w-4 h-4" />;
                        })()}
                        <span className="font-medium">{getStatusLabel(selectedOrder.status).label}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">訂單日期</p>
                      <p className="font-medium">
                        {new Date(selectedOrder.createdAt).toLocaleDateString("zh-TW")}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6 pb-6 border-b border-border">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">收件人</p>
                      <p className="font-medium">{selectedOrder.recipientName}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">電話</p>
                      <p className="font-medium">{selectedOrder.recipientPhone}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">地址</p>
                      <p className="font-medium text-sm">{selectedOrder.recipientAddress}</p>
                    </div>

                    {selectedOrder.notes && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">備註</p>
                        <p className="font-medium text-sm">{selectedOrder.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <p className="text-xs text-muted-foreground mb-2">訂單總額</p>
                    <p className="text-3xl font-bold text-accent">
                      NT${(selectedOrder.totalAmount / 100).toFixed(0)}
                    </p>
                  </div>

                  {selectedOrder.status === "shipped" && (
                    <Button
                      className="w-full bg-accent hover:bg-accent/90"
                      onClick={handleConfirmOrder}
                      disabled={confirmOrderMutation.isPending}
                    >
                      {confirmOrderMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          確認中...
                        </>
                      ) : (
                        "確認收貨"
                      )}
                    </Button>
                  )}
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
