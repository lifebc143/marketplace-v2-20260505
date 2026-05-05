import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Package, Clock, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function Orders() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // 獲取用戶的訂單列表
  const { data: orders, isLoading, error } = trpc.orders.getMyOrders.useQuery();

  // 獲取選中訂單的詳情
  const { data: selectedOrder } = trpc.orders.getById.useQuery(
    { id: selectedOrderId! },
    { enabled: !!selectedOrderId }
  );

  // 獲取賣家信息
  const { data: sellerInfo } = trpc.orders.getSellerInfo.useQuery(
    { orderId: selectedOrderId! },
    { enabled: !!selectedOrderId }
  );

  const confirmOrderMutation = trpc.orders.confirm.useMutation();
  const contactSellerMutation = trpc.orders.contactSeller.useMutation();

  const handleContactSeller = async () => {
    if (!selectedOrderId) return;

    try {
      await contactSellerMutation.mutateAsync({ orderId: selectedOrderId });
      toast.success(t("orders.contactSuccess"));
    } catch (error: any) {
      console.error("Failed to contact seller:", error);
      const errorMessage = error?.data?.message || error?.message || t("orders.contactError");
      toast.error(errorMessage);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t("orders.loginRequired")}</h2>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.backHome")}
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-500">{t("common.error")}</h2>
          <p className="text-gray-400 mb-4">{error.message}</p>
          <Button onClick={() => navigate("/")}>{t("common.backHome")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{t("orders.title")}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 訂單列表 */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h2 className="text-xl font-bold mb-4">{t("orders.myOrders")}</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {orders && orders.length > 0 ? (
                  orders.map((order: any) => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`p-3 rounded cursor-pointer transition ${
                        selectedOrderId === order.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <div className="font-semibold">#{order.id}</div>
                      <div className="text-sm opacity-75">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">{t("orders.noOrders")}</p>
                )}
              </div>
            </Card>
          </div>

          {/* 訂單詳情 */}
          <div className="lg:col-span-2">
            {selectedOrder ? (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">{t("orders.orderDetails")}</h2>

                {/* 訂單基本信息 */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">{t("orders.basicInfo")}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">{t("orders.orderId")}</label>
                      <p className="font-semibold">#{selectedOrder.id}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">{t("orders.status")}</label>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedOrder.status === "pending" && (
                          <>
                            <Clock className="h-4 w-4 text-yellow-500" />
                            <span className="font-semibold text-yellow-500">{t("orders.pending")}</span>
                          </>
                        )}
                        {selectedOrder.status === "confirmed" && (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="font-semibold text-green-500">{t("orders.confirmed")}</span>
                          </>
                        )}
                        {selectedOrder.status === "cancelled" && (
                          <>
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="font-semibold text-red-500">{t("orders.cancelled")}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">{t("orders.createdDate")}</label>
                      <p className="font-semibold">
                        {new Date(selectedOrder.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">{t("orders.totalPrice")}</label>
                      <p className="font-semibold text-lg">NT${selectedOrder.totalPrice}</p>
                    </div>
                  </div>
                </div>

                {/* 商品信息 */}
                {selectedOrder.product && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">{t("orders.productInfo")}</h3>
                    <div className="flex gap-4">
                      {selectedOrder.product.images && selectedOrder.product.images.length > 0 && (
                        <img
                          src={selectedOrder.product.images[0].imageUrl}
                          alt={selectedOrder.product.title}
                          className="w-24 h-24 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{selectedOrder.product.title}</h4>
                        <p className="text-muted-foreground text-sm mb-2">
                          {selectedOrder.product.description}
                        </p>
                        <p className="font-semibold">NT${selectedOrder.product.price}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 收件人信息 */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">{t("orders.recipientInfo")}</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">{t("orders.recipientName")}</label>
                      <p className="font-semibold">{selectedOrder.recipientName || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">{t("orders.recipientPhone")}</label>
                      <p className="font-semibold">{selectedOrder.recipientPhone || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">{t("orders.recipientAddress")}</label>
                      <p className="font-semibold">{selectedOrder.recipientAddress || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* 賣家信息 */}
                {sellerInfo && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">{t("orders.sellerInfo")}</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground">{t("orders.sellerName")}</label>
                        <p className="font-semibold">{"N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">{t("orders.sellerPhone")}</label>
                        <p className="font-semibold">{sellerInfo.phone || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">{t("orders.sellerAddress")}</label>
                        <p className="font-semibold">{sellerInfo.address || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 操作按鈕 */}
                <div className="flex gap-4 pt-6 border-t">
                  {selectedOrder.status === "pending" && (
                    <Button
                      onClick={() => {
                        confirmOrderMutation.mutateAsync({ id: selectedOrder.id });
                      }}
                      disabled={confirmOrderMutation.isPending}
                      className="flex-1"
                    >
                      {confirmOrderMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t("orders.confirmOrder")}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleContactSeller}
                    disabled={contactSellerMutation.isPending}
                    className="flex-1"
                  >
                    {contactSellerMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t("orders.contactSeller")}
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{t("orders.selectOrder")}</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
