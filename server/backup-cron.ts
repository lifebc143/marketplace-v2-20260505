import * as cron from 'node-cron';
import { performMonthlyBackup } from './backup-scheduler';
import type { ScheduledTask } from 'node-cron';

/**
 * 初始化每月備份定時任務
 * 每月最後一天凌晨 2:00 執行備份
 */
export function initializeBackupCron(): ScheduledTask {
  // Cron 表達式: 0 2 28-31 * * (每月 28-31 日凌晨 2:00)
  // 由於不同月份有不同的天數，我們使用 28-31，cron 會自動跳過不存在的日期
  const cronExpression = '0 2 28-31 * *';

  console.log('[Backup Cron] 初始化每月備份定時任務');
  console.log(`[Backup Cron] 計劃: ${cronExpression} (每月 28-31 日凌晨 2:00)`);

  const task = cron.schedule(cronExpression, async () => {
    console.log('[Backup Cron] 觸發每月備份任務');
    try {
      await performMonthlyBackup();
    } catch (error) {
      console.error('[Backup Cron] 備份任務失敗:', error);
    }
  });

  // 確保任務已啟動
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
