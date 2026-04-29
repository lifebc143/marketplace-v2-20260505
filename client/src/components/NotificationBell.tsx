import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import NotificationCenter from "./NotificationCenter";

export default function NotificationBell() {
  // 暫時禁用通知功能，直到通知表初始化
  // 返回 null 以隱藏通知鈴鐺
  return null;

  // 以下代碼在通知表初始化後可以啟用
  /*
  const [isOpen, setIsOpen] = useState(false);

  // 獲取未讀通知數
  const { data: unreadData, refetch, isError } = trpc.notifications.getUnreadCount.useQuery(undefined, {
    retry: false,
  });

  // 定期刷新未讀通知數
  useEffect(() => {
    if (isError) return;
    
    const interval = setInterval(() => {
      refetch();
    }, 5000);

    return () => clearInterval(interval);
  }, [refetch, isError]);

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
  */
}
