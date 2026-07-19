import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { notifyOwner } from './_core/notification';

const execAsync = promisify(exec);

/**
 * 每月最後一天自動備份 marketplace 專案
 * 備份內容上傳到 S3，並發送郵件通知
 */

interface BackupConfig {
  projectPath: string;
  excludeDirs: string[];
  backupDir: string;
  recipientEmail: string;
}

const config: BackupConfig = {
  projectPath: '/home/ubuntu/marketplace',
  excludeDirs: ['node_modules', '.git'],
  backupDir: '/tmp/backups',
  recipientEmail: 'lifeabcalgary@gmail.com',
};

/**
 * 生成備份檔案名稱（包含時間戳）
 */
function generateBackupFileName(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `marketplace_backup_${year}${month}${day}_${hours}${minutes}.tar.gz`;
}

/**
 * 檢查今天是否是月份的最後一天
 */
function isLastDayOfMonth(): boolean {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return today.getMonth() !== tomorrow.getMonth();
}

/**
 * 創建備份檔案
 */
async function createBackup(): Promise<string> {
  const backupFileName = generateBackupFileName();
  const backupPath = path.join(config.backupDir, backupFileName);

  // 確保備份目錄存在
  if (!fs.existsSync(config.backupDir)) {
    fs.mkdirSync(config.backupDir, { recursive: true });
  }

  // 構建 tar 命令，排除指定的目錄
  const excludeFlags = config.excludeDirs
    .map(dir => `--exclude='${dir}'`)
    .join(' ');

  const command = `cd /home/ubuntu && tar ${excludeFlags} -czf ${backupPath} marketplace/`;

  console.log(`[Backup] 開始備份: ${backupFileName}`);
  console.log(`[Backup] 命令: ${command}`);

  try {
    await execAsync(command);
    console.log(`[Backup] 備份完成: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error(`[Backup] 備份失敗:`, error);
    throw new Error(`備份失敗: ${error}`);
  }
}

/**
 * 上傳備份檔案到 S3
 */
async function uploadBackupToS3(backupPath: string): Promise<string> {
  console.log(`[Upload] 開始上傳: ${backupPath}`);

  try {
    const { stdout } = await execAsync(`manus-upload-file ${backupPath}`);
    
    // 從輸出中提取 CDN URL
    const cdnUrlMatch = stdout.match(/CDN URL: (https:\/\/[^\n]+)/);
    if (!cdnUrlMatch) {
      throw new Error('無法從上傳輸出中提取 CDN URL');
    }

    const cdnUrl = cdnUrlMatch[1];
    console.log(`[Upload] 上傳完成: ${cdnUrl}`);
    return cdnUrl;
  } catch (error) {
    console.error(`[Upload] 上傳失敗:`, error);
    throw new Error(`上傳失敗: ${error}`);
  }
}

/**
 * 發送郵件通知
 */
async function sendEmailNotification(
  downloadUrl: string,
  backupFileName: string,
  backupSize: string
): Promise<void> {
  const timestamp = new Date().toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
  });

  const emailContent = `
親愛的用戶，

您的 Marketplace 專案每月自動備份已完成！

📦 備份詳情：
- 備份檔案名稱: ${backupFileName}
- 備份大小: ${backupSize}
- 備份時間: ${timestamp}
- 排除項目: node_modules、.git

🔗 下載連結：
${downloadUrl}

該連結有效期為 30 天。請妥善保管備份檔案。

如有任何問題，請聯繫我們。

此郵件由系統自動發送，請勿回覆。
  `;

  try {
    // 使用 notifyOwner 發送通知
    await notifyOwner({
      title: `📦 Marketplace 每月自動備份完成 - ${backupFileName}`,
      content: emailContent,
    });

    console.log(`[Email] 通知已發送到: ${config.recipientEmail}`);
  } catch (error) {
    console.error(`[Email] 發送通知失敗:`, error);
    throw new Error(`發送通知失敗: ${error}`);
  }
}

/**
 * 清理舊備份檔案（保留最近 3 個月的備份）
 */
async function cleanupOldBackups(): Promise<void> {
  try {
    if (!fs.existsSync(config.backupDir)) {
      return;
    }

    const files = fs.readdirSync(config.backupDir)
      .filter(f => f.startsWith('marketplace_backup_'))
      .map(f => ({
        name: f,
        path: path.join(config.backupDir, f),
        mtime: fs.statSync(path.join(config.backupDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime);

    // 保留最近 3 個備份
    const toDelete = files.slice(3);
    for (const file of toDelete) {
      fs.unlinkSync(file.path);
      console.log(`[Cleanup] 刪除舊備份: ${file.name}`);
    }
  } catch (error) {
    console.error(`[Cleanup] 清理舊備份失敗:`, error);
  }
}

/**
 * 主備份函數
 */
export async function performMonthlyBackup(): Promise<void> {
  try {
    // 檢查是否是月份的最後一天
    if (!isLastDayOfMonth()) {
      console.log('[Backup] 今天不是月份的最後一天，跳過備份');
      return;
    }

    console.log('[Backup] ========== 開始每月備份流程 ==========');

    // 1. 創建備份
    const backupPath = await createBackup();

    // 2. 獲取備份檔案大小
    const stats = fs.statSync(backupPath);
    const backupSize = `${(stats.size / 1024 / 1024).toFixed(2)} MB`;
    const backupFileName = path.basename(backupPath);

    // 3. 上傳到 S3
    const downloadUrl = await uploadBackupToS3(backupPath);

    // 4. 發送郵件通知
    await sendEmailNotification(downloadUrl, backupFileName, backupSize);

    // 5. 清理舊備份
    await cleanupOldBackups();

    console.log('[Backup] ========== 每月備份流程完成 ==========');
  } catch (error) {
    console.error('[Backup] 備份流程失敗:', error);
    
    // 發送失敗通知
    try {
      await notifyOwner({
        title: '❌ Marketplace 自動備份失敗',
        content: `備份流程出現錯誤：\n\n${error}\n\n請檢查系統日誌以獲取更多詳情。`,
      });
    } catch (notifyError) {
      console.error('[Backup] 發送失敗通知失敗:', notifyError);
    }
  }
}

/**
 * 測試備份功能（用於開發和調試）
 */
export async function testBackup(): Promise<void> {
  console.log('[Test] 開始測試備份功能...');
  try {
    const backupPath = await createBackup();
    const stats = fs.statSync(backupPath);
    const backupSize = `${(stats.size / 1024 / 1024).toFixed(2)} MB`;
    const backupFileName = path.basename(backupPath);

    console.log(`[Test] 備份檔案: ${backupFileName}`);
    console.log(`[Test] 備份大小: ${backupSize}`);
    console.log(`[Test] 備份路徑: ${backupPath}`);

    const downloadUrl = await uploadBackupToS3(backupPath);
    console.log(`[Test] 下載連結: ${downloadUrl}`);

    await sendEmailNotification(downloadUrl, backupFileName, backupSize);
    console.log('[Test] 測試完成！');
  } catch (error) {
    console.error('[Test] 測試失敗:', error);
  }
}
