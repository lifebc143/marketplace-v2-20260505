import * as cron from 'node-cron';
import { performBackup, getNextBackupTime } from './backup-scheduler';
import type { ScheduledTask } from 'node-cron';

/**
 * 初始化每月備份定時任務
 * 每月最後一天凌晨 2:00 執行備份（台灣時區 UTC+8）
 * 
 * 時區說明：
 * - node-cron 使用 UTC 時間
 * - 台灣時區是 UTC+8
 * - 台灣凌晨 2:00 = UTC 前一天 18:00
 * - 每月最後一天凌晨 2:00 = UTC 時間前一天的 18:00
 * 
 * Cron 表達式: 0 18 27-30 * *
 * - 0: 分鐘 (00)
 * - 18: 小時 (18:00 UTC = 台灣凌晨 2:00)
 * - 27-30: 日期 (27-30 日，覆蓋所有月份的最後一天)
 * - *: 月份 (所有月份)
 * - *: 星期 (所有星期)
 */
export function initializeBackupCron(): ScheduledTask {
  const cronExpression = '0 18 27-30 * *'; // UTC 時間

  console.log('[Backup Cron] 初始化每月備份定時任務');
  console.log(`[Backup Cron] Cron 表達式: ${cronExpression}`);
  console.log('[Backup Cron] 時間: 每月最後一天凌晨 2:00 (台灣時區 UTC+8)');
  console.log(`[Backup Cron] 下次備份時間: ${getNextBackupTime().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`);

  const task = cron.schedule(cronExpression, async () => {
    console.log('[Backup Cron] ========== 觸發每月自動備份任務 ==========');
    try {
      const result = await performBackup(false);
      if (result.success) {
        console.log('[Backup Cron] 備份任務成功完成');
      } else {
        console.error('[Backup Cron] 備份任務失敗:', result.message);
      }
    } catch (error) {
      console.error('[Backup Cron] 備份任務執行異常:', error);
    }
  });

  console.log('[Backup Cron] 定時任務已啟動');

  return task;
}

/**
 * 停止備份定時任務
 */
export function stopBackupCron(task: ScheduledTask): void {
  task.stop();
  console.log('[Backup Cron] 定時任務已停止');
}
