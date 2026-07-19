import { router, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { performBackup, getNextBackupTime, getBackupHistory } from "../backup-scheduler";

export const backupRouter = router({
  /**
   * 手動觸發備份（僅限管理員）
   */
  triggerBackup: adminProcedure.mutation(async () => {
    try {
      const result = await performBackup(true);
      return {
        success: result.success,
        message: result.message || "備份已觸發，請檢查郵件以獲取下載連結",
        downloadUrl: result.downloadUrl,
        backupFile: result.backupFile,
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
    const history = getBackupHistory();
    const lastBackup = history.length > 0 ? history[0] : null;

    return {
      lastBackupDate: lastBackup ? new Date(lastBackup.createdAt).getTime() : null,
      lastBackupFile: lastBackup?.filename || null,
      lastBackupSize: lastBackup?.size || null,
      nextBackupDate: getNextBackupTime().getTime(),
      backupFrequency: "monthly",
      recipientEmail: "lifeabcalgary@gmail.com",
      maxBackupVersions: 3,
      backupHistory: history.slice(0, 10),
    };
  }),

  /**
   * 獲取備份歷史（僅限管理員）
   */
  getBackupHistory: adminProcedure.query(async () => {
    return getBackupHistory();
  }),
});
