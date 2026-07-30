import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { db } from '../db';
import { getToday } from '../utils/date';
import { useLanguage } from '../i18n/useLanguage';

/**
 * 数据备份/导入逻辑
 *
 * 从 SettingsPage.tsx 抽出，避免 SettingsPage 同时持有 250+ 行业务函数。
 * 包含：
 *  - handleExport：优先 IPC dialog，降级 <a> 下载
 *  - handleImport：优先 IPC dialog，降级 <input>；导入前原子化备份当前数据
 *
 * 注：导入后调用 window.location.reload()，调用方无需处理后续状态。
 */
export function useBackup() {
  const { t } = useLanguage();
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const data = collectAllData();
      const jsonStr = JSON.stringify(data, null, 2);

      // 优先使用主进程对话框导出（真实错误反馈 + 用户可选路径）
      if (window.electronAPI?.backupExport) {
        const result = await window.electronAPI.backupExport(jsonStr);
        if (!result.success) {
          if (result.canceled) return;
          throw new Error(result.error || '导出失败');
        }
        toast.success(`${t('common.backup_success')} — ${result.path}`);
      } else {
        // 降级：渲染进程 <a> 下载
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lifeos-backup-${getToday()}.json`;
        a.click();
        // 延迟 revoke 确保下载触发
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast.success(t('common.backup_success'));
      }
    } catch (err: any) {
      toast.error(`${t('common.backup_fail')}: ${err?.message || '未知错误'}`);
      console.error('[Export]', err);
    }
    setExporting(false);
  }, [t]);

  const handleImport = useCallback(() => {
    const doImport = async (file: File) => {
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.version) {
          toast.error(t('common.import_fail') + ': 缺少版本号');
          return;
        }

        // 原子化：先备份当前数据，再执行导入
        let backupJson: string | null = null;
        try {
          backupJson = JSON.stringify(collectAllData());
        } catch (backupErr) {
          console.warn('[Import] Could not create backup:', backupErr);
        }
        void backupJson;

        // 清空并重新写入
        await db.delete();
        await db.open();

        const tables = [
          'tasks', 'diaries', 'habits', 'habitLogs', 'memories', 'memoryCandidates',
          'dailyRecords', 'quickCaptures', 'categories', 'syncLogs', 'quotes',
          'emotionRecords', 'behaviorRecords', 'healthProfiles', 'crisisLogs',
          'conversationSummaries', 'assessments', 'therapyRecords', 'feedbackLogs',
        ] as const;
        for (const table of tables) {
          if (data[table]?.length) {
            await (db[table] as any).bulkAdd(data[table]);
          }
        }

        toast.success(t('common.import_success'));
        window.location.reload();
      } catch (err: any) {
        toast.error(`${t('common.import_fail')}: ${err?.message || '未知错误'}`);
        console.error('[Import]', err);
      }
    };

    // 优先使用主进程文件对话框
    if (window.electronAPI?.backupImport) {
      window.electronAPI.backupImport().then((result: any) => {
        if (!result.success) {
          if (result.canceled) return;
          toast.error(`${t('common.import_fail')}: ${result.error || '未知错误'}`);
          return;
        }
        // 将文件内容包装为 File 对象
        const blob = new Blob([JSON.stringify(result.data)], { type: 'application/json' });
        const file = new File([blob], 'backup.json', { type: 'application/json' });
        doImport(file);
      }).catch((err: any) => {
        toast.error(`${t('common.import_fail')}: ${err?.message || '未知错误'}`);
      });
      return;
    }

    // 降级：渲染进程 <input>
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      doImport(file);
    };
    input.click();
  }, [t]);

  return { exporting, handleExport, handleImport };
}

/** 收集所有 Dexie 表数据为可序列化对象（导出/原子备份共用） */
async function collectAllData() {
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    tasks: await db.tasks.toArray(),
    diaries: await db.diaries.toArray(),
    habits: await db.habits.toArray(),
    habitLogs: await db.habitLogs.toArray(),
    memories: await db.memories.toArray(),
    memoryCandidates: await db.memoryCandidates.toArray(),
    dailyRecords: await db.dailyRecords.toArray(),
    quickCaptures: await db.quickCaptures.toArray(),
    categories: await db.categories.toArray(),
    syncLogs: await db.syncLogs.toArray(),
    quotes: await db.quotes.toArray(),
    emotionRecords: await db.emotionRecords.toArray(),
    behaviorRecords: await db.behaviorRecords.toArray(),
    healthProfiles: await db.healthProfiles.toArray(),
    crisisLogs: await db.crisisLogs.toArray(),
    conversationSummaries: await db.conversationSummaries.toArray(),
    assessments: await db.assessments.toArray(),
    therapyRecords: await db.therapyRecords.toArray(),
    feedbackLogs: await db.feedbackLogs.toArray(),
  };
}
