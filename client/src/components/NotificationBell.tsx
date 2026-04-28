import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import NotificationCenter from "./NotificationCenter";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);

  // 獲取未讀通知數
  const { data: unreadData, refetch, isError } = trpc.notifications.getUnreadCount.useQuery(undefined, {
    retry: false,
  });

  // 定期刷新未讀通知數（只在成功時）
  useEffect(() => {
    if (isError) return;
    
    const interval = setInterval(() => {
      refetch();
    }, 5000); // 每 5 秒刷新一次

    return () => clearInterval(interval);
  }, [refetch, isError]);

  // 如果通知系統出錯，隱藏通知鈴鐺
  if (isError) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadData && unreadData.count > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center">
            {unreadData.count > 9 ? "9+" : unreadData.count}
          </span>
        )}
      </Button>

      <NotificationCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
