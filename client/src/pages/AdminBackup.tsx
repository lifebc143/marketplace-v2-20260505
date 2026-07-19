import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, CheckCircle2, Clock, Download, Calendar } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function AdminBackup() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // 檢查是否是管理員
  if (user?.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                無權限訪問
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                只有管理員可以訪問備份管理頁面。
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const backupStatus = trpc.backup.getBackupStatus.useQuery();
  const triggerBackup = trpc.backup.triggerBackup.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
      setIsLoading(false);
    },
    onError: (error) => {
      toast.error(error.message);
      setIsLoading(false);
    },
  });

  const handleTriggerBackup = async () => {
    setIsLoading(true);
    await triggerBackup.mutateAsync();
  };

  const nextBackupDate = backupStatus.data?.nextBackupDate
    ? new Date(backupStatus.data.nextBackupDate).toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "計算中...";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 頁面標題 */}
        <div>
          <h1 className="text-3xl font-bold">備份管理</h1>
          <p className="text-muted-foreground mt-2">
            管理 Marketplace 專案的自動備份設定
          </p>
        </div>

        {/* 備份狀態卡片 */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* 備份頻率 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                備份頻率
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">每月一次</div>
              <p className="text-sm text-muted-foreground mt-1">
                在每月最後一天凌晨 2:00 自動執行
              </p>
            </CardContent>
          </Card>

          {/* 下次備份時間 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                下次備份時間
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{nextBackupDate}</div>
              <p className="text-sm text-muted-foreground mt-1">
                自動執行備份
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 備份設定詳情 */}
        <Card>
          <CardHeader>
            <CardTitle>備份設定詳情</CardTitle>
            <CardDescription>
              當前的備份配置和相關信息
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium">備份位置</span>
                <span className="text-sm text-muted-foreground">
                  /home/ubuntu/marketplace
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium">排除項目</span>
                <span className="text-sm text-muted-foreground">
                  node_modules、.git
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium">上傳目標</span>
                <span className="text-sm text-muted-foreground">
                  S3 CDN（Manus）
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium">通知方式</span>
                <span className="text-sm text-muted-foreground">
                  郵件通知
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium">通知郵箱</span>
                <span className="text-sm text-muted-foreground">
                  {backupStatus.data?.recipientEmail}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 手動備份 */}
        <Card>
          <CardHeader>
            <CardTitle>手動備份</CardTitle>
            <CardDescription>
              立即觸發一次備份，備份完成後將發送郵件通知
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleTriggerBackup}
              disabled={isLoading}
              size="lg"
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  備份進行中...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  立即備份
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 備份說明 */}
        <Card>
          <CardHeader>
            <CardTitle>備份說明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">自動備份</p>
                <p>系統會在每月最後一天凌晨 2:00 自動執行備份</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">S3 存儲</p>
                <p>備份檔案自動上傳到 S3 CDN，確保安全可靠</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">郵件通知</p>
                <p>備份完成後，下載連結將發送到您的郵箱</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">版本保留</p>
                <p>系統自動保留最近 3 個月的備份版本</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}


