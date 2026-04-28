import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Bell, Trash2, CheckCheck } from "lucide-react";
import { toast } from "sonner";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);

  // 獲取通知列表
  const { data: notifications, isLoading, refetch } = trpc.notifications.getNotifications.useQuery(
    { limit, offset },
    { enabled: isOpen }
  );

  // 獲取未讀通知數
  const { data: unreadData } = trpc.notifications.getUnreadCount.useQuery(undefined, {
    enabled: isOpen,
  });

  // 標記為已讀
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation();
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation();
  const deleteNotificationMutation = trpc.notifications.delete.useMutation();

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsReadMutation.mutateAsync({ id });
      refetch();
      toast.success("已標記為已讀");
    } catch (error) {
      toast.error("標記失敗");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      refetch();
      toast.success("已全部標記為已讀");
    } catch (error) {
      toast.error("標記失敗");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotificationMutation.mutateAsync({ id });
      refetch();
      toast.success("已刪除");
    } catch (error) {
      toast.error("刪除失敗");
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "order":
        return "bg-blue-100 text-blue-800";
      case "message":
        return "bg-green-100 text-green-800";
      case "review":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case "order":
        return "訂單";
      case "message":
        return "訊息";
      case "review":
        return "評論";
      default:
        return "系統";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-end z-50">
      <Card className="w-96 h-screen rounded-none shadow-lg flex flex-col">
        {/* 頭部 */}
        <div className="border-b p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <h2 className="font-bold text-lg">通知</h2>
            {unreadData && unreadData.count > 0 && (
              <span className="bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full">
                {unreadData.count}
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* 操作按鈕 */}
        {notifications && notifications.length > 0 && (
          <div className="border-b p-2 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkAllAsRead}
              className="flex-1"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              全部已讀
            </Button>
          </div>
        )}

        {/* 通知列表 */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition ${
                    notification.isRead === 0 ? "bg-accent/5" : ""
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs px-2 py-1 rounded ${getNotificationColor(
                            notification.type
                          )}`}
                        >
                          {getNotificationTypeLabel(notification.type)}
                        </span>
                        {notification.isRead === 0 && (
                          <span className="w-2 h-2 bg-accent rounded-full"></span>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm">{notification.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {notification.isRead === 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <CheckCheck className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(notification.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>暫無通知</p>
            </div>
          )}
        </div>

        {/* 頁腳 */}
        {notifications && notifications.length >= limit && (
          <div className="border-t p-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setOffset(offset + limit)}
            >
              載入更多
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
