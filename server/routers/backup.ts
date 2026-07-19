import { router, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { performMonthlyBackup } from "../backup-scheduler";

export const backupRouter = router({
  /**
   * 手動觸發備份（僅限管理員）
   */
  triggerBackup: adminProcedure.mutation(async () => {
    try {
      await performMonthlyBackup();
      return {
        success: true,
        message: "備份已觸發，請檢查郵件以獲取下載連結",
      };
    } catch (error) {
      return {
        success: false,
        message: `備份失敗: ${error instanceof Error ? error.message : "未知錯誤"}`,
      };
    }
  }),

  /**
   * 獲取備份狀態（僅限管理員）
   */
  getBackupStatus: adminProcedure.query(async () => {
    return {
      lastBackupDate: null, // 可以從數據庫查詢
      nextBackupDate: getNextMonthLastDay(),
      backupFrequency: "monthly",
      recipientEmail: "lifeabcalgary@gmail.com",
    };
  }),
});

/**
 * 計算下一個月份的最後一天
 */
function getNextMonthLastDay(): Date {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // 如果今天已經是月份的最後一天，返回下個月的最後一天
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (today.getMonth() !== tomorrow.getMonth()) {
    // 今天是月份的最後一天，計算下個月的最後一天
    const nextMonth = new Date(currentYear, currentMonth + 2, 0);
    return nextMonth;
  } else {
    // 返回當前月份的最後一天
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    return lastDay;
  }
}
