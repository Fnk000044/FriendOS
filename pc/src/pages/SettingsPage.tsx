import { useCallback, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Download, Upload, Database, Languages, FolderOpen, AlertTriangle, Sun, Moon, Monitor, Keyboard, Brain, Sparkles } from 'lucide-react';
import { db } from '../db';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useLanguage } from '../i18n/useLanguage';
import { useThemeStore, type ThemeMode } from '../stores/useThemeStore';
import { useShortcutStore, type ShortcutAction } from '../stores/useShortcutStore';
import { useNotificationStore } from '../stores/notificationStore';
import { checkConflict } from '../utils/shortcutConflict';
import type { Lang } from '../i18n/translations';
import ModelStatus from '../components/ai/ModelStatus';
import NotificationSettings from '../components/common/NotificationSettings';
import AppLockSettings from '../components/common/AppLockSettings';
import { getToday } from '../utils/date';
import { seedDemoData } from '../utils/seedDemoData';

export default function SettingsPage() {
  const [exporting, setExporting] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const shortcuts = useShortcutStore((s) => s.shortcuts);
  const setShortcut = useShortcutStore((s) => s.setShortcut);
  const resetShortcuts = useShortcutStore((s) => s.resetAll);
  const [recording, setRecording] = useState<ShortcutAction | null>(null);
  const recordingRef = useRef<ShortcutAction | null>(null);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const data = {
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
          const currentData = {
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
          backupJson = JSON.stringify(currentData);
        } catch (backupErr) {
          console.warn('[Import] Could not create backup:', backupErr);
        }

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

  const handleOpenFolder = useCallback(() => {
    window.electronAPI?.openDataFolder();
  }, []);

  // 自动备份提醒：记录上次备份时间，应用启动时按间隔提醒
  const [autoBackupEnabled, setAutoBackupEnabled] = useState<boolean>(() => {
    const v = localStorage.getItem('friendos_auto_backup_enabled');
    return v === '1';
  });
  const [backupInterval, setBackupInterval] = useState<'daily' | 'weekly' | 'monthly'>(() => {
    const v = localStorage.getItem('friendos_backup_interval');
    return (v as 'daily' | 'weekly' | 'monthly') || 'weekly';
  });
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(() =>
    localStorage.getItem('friendos_last_backup_date')
  );

  const BACKUP_INTERVAL_MS: Record<string, number> = {
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000,
  };

  const recordBackup = useCallback(() => {
    const today = getToday();
    setLastBackupDate(today);
    localStorage.setItem('friendos_last_backup_date', today);
  }, []);

  const handleBackupNow = useCallback(async () => {
    await handleExport();
    recordBackup();
  }, [handleExport, recordBackup]);

  // 应用启动时检查是否需要提醒备份
  useEffect(() => {
    if (!autoBackupEnabled) return;
    const intervalMs = BACKUP_INTERVAL_MS[backupInterval];
    const last = lastBackupDate ? new Date(lastBackupDate + 'T00:00:00').getTime() : 0;
    const elapsed = Date.now() - last;
    if (elapsed >= intervalMs) {
      const days = Math.floor(elapsed / (24 * 60 * 60 * 1000));
      toast(
        lang === 'zh-CN'
          ? `距离上次备份已超过 ${days} 天，建议立即备份`
          : `It has been over ${days} days since your last backup. Please back up now.`,
        { duration: 6000 }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleAutoBackup = useCallback(() => {
    setAutoBackupEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('friendos_auto_backup_enabled', next ? '1' : '0');
      return next;
    });
  }, []);

  const handleIntervalChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as 'daily' | 'weekly' | 'monthly';
    setBackupInterval(val);
    localStorage.setItem('friendos_backup_interval', val);
  }, []);

  const handleReset = useCallback(async () => {
    if (!window.confirm(t('settings.reset_confirm'))) return;
    // 设置重置标记（不以 friendos_ 开头，不会被下面的过滤器清除）
    localStorage.setItem('system_reset_flag', '1');
    await db.delete();
    // 只清除FriendOS相关的localStorage key，避免影响其他应用
    const friendosKeys = Object.keys(localStorage).filter(key =>
      key.startsWith('friendos_') || key.startsWith('lifeos_') || key.startsWith('use_')
    );
    friendosKeys.forEach(key => localStorage.removeItem(key));
    // 重置 stores 状态
    useNotificationStore.getState().reset();
    useLanguage.getState().reset();
    // 重置主进程 ONNX 状态（清除缓存的加载结果）
    try {
      await window.electronAPI?.sentimentResetOnnx();
    } catch (e) { /* non-critical */ }
    // 重启应用以走完整 LoadingPage 并重新懒加载模型
    toast.success('已恢复初始化，正在重启…');
    setTimeout(() => window.location.reload(), 600);
  }, [t]);

  const handleSeedDemo = useCallback(async () => {
    if (!window.confirm(t('settings.demo_data_confirm'))) return;
    const result = await seedDemoData();
    if (result.success) {
      toast.success(t('settings.demo_data_success'));
      window.location.reload();
    } else {
      toast.error(t('settings.demo_data_fail'));
    }
  }, [t]);

  // Keyboard shortcut recording
  useEffect(() => {
    if (!recording) return;
    recordingRef.current = recording;

    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
      if (e.shiftKey) parts.push('Shift');
      if (e.altKey) parts.push('Alt');

      // Ignore modifier-only presses
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

      parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
      const shortcut = parts.join('+');
      const action = recordingRef.current;
      if (!action) return;

      // Check conflicts
      const conflicts = checkConflict(shortcut, action, shortcuts);
      const useIt = conflicts.length === 0 || window.confirm(
        t('settings.shortcuts_conflict', { name: conflicts[0].name })
      );

      if (useIt) {
        setShortcut(action, shortcut);
      }
      setRecording(null);
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [recording, shortcuts, setShortcut, t]);

  const shortcutActions: { action: ShortcutAction; label: string }[] = [
    { action: 'quickCapture', label: t('settings.shortcuts_quick_capture') },
    { action: 'exportData', label: t('settings.shortcuts_export') },
    { action: 'importData', label: t('settings.shortcuts_import') },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <p className="text-text-muted">{t('settings.title')}</p>

      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-1">{t('settings.data_mgmt')}</h3>
        <p className="text-xs text-text-muted mb-4">{t('settings.data_desc')}</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleExport} disabled={exporting}>
            <Download className="w-4 h-4" />
            {t('settings.export')}
          </Button>
          <Button variant="secondary" onClick={handleImport}>
            <Upload className="w-4 h-4" />
            {t('settings.import')}
          </Button>
        </div>
        <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
          <Button variant="danger" onClick={handleReset}>
            <AlertTriangle className="w-4 h-4" />
            {t('settings.reset')}
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Languages className="w-4 h-4" />
          {lang === 'zh-CN' ? '语言 / Language' : 'Language / 语言'}
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setLang('zh-CN')}
            aria-pressed={lang === 'zh-CN'}
            className={`px-4 py-2 text-sm rounded-btn border transition-all cursor-pointer ${
              lang === 'zh-CN'
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'text-text-muted hover:border-slate-300'
            }`}
            style={lang === 'zh-CN' ? undefined : { borderColor: 'var(--glass-border)' }}
          >
            中文
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            aria-pressed={lang === 'en'}
            className={`px-4 py-2 text-sm rounded-btn border transition-all cursor-pointer ${
              lang === 'en'
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'text-text-muted hover:border-slate-300'
            }`}
            style={lang === 'en' ? undefined : { borderColor: 'var(--glass-border)' }}
          >
            English
          </button>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          {themeMode === 'dark' ? <Moon className="w-4 h-4" /> : themeMode === 'light' ? <Sun className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          {t('settings.theme')}
        </h3>
        <div className="flex gap-2">
          {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setThemeMode(mode)}
              aria-pressed={themeMode === mode}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-btn border transition-all cursor-pointer ${
                themeMode === mode
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'text-text-muted hover:border-slate-300'
              }`}
              style={themeMode === mode ? undefined : { borderColor: 'var(--glass-border)' }}
            >
              {mode === 'system' && <Monitor className="w-4 h-4" />}
              {mode === 'light' && <Sun className="w-4 h-4" />}
              {mode === 'dark' && <Moon className="w-4 h-4" />}
              {t(`settings.theme_${mode}` as any)}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Keyboard className="w-4 h-4" />
          {t('settings.shortcuts')}
        </h3>
        <p className="text-xs text-text-muted mb-4">{t('settings.shortcuts_desc')}</p>
        <div className="space-y-2">
          {shortcutActions.map(({ action, label }) => (
            <div key={action} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-text-primary">{label}</span>
              <button
                type="button"
                onClick={() => setRecording(recording === action ? null : action)}
                className={`px-3 py-1.5 text-xs rounded-btn border transition-all min-w-[120px] text-center ${
                  recording === action
                    ? 'border-primary bg-primary/10 text-primary animate-pulse'
                    : 'text-text-muted hover:border-slate-300'
                }`}
                style={recording === action ? undefined : { borderColor: 'var(--glass-border)' }}
              >
                {recording === action ? t('settings.shortcuts_press_keys') : shortcuts[action]}
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--glass-border)' }}>
          <Button variant="secondary" size="sm" onClick={resetShortcuts}>
            {t('settings.shortcuts_reset')}
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-1">{t('settings.storage_info')}</h3>
        <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
          <Database className="w-4 h-4" />
          <span>{t('settings.storage_desc')}</span>
        </div>
        {window.electronAPI && (
          <Button variant="secondary" size="sm" className="mt-3" onClick={handleOpenFolder}>
            <FolderOpen className="w-4 h-4" />
            {t('settings.open_folder')}
          </Button>
        )}
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-1 flex items-center gap-2">
          <Brain className="w-4 h-4" />
          {t('settings.model_status')}
        </h3>
        <div className="mt-3">
          <ModelStatus />
        </div>
        <p className="text-xs text-text-muted mt-3">
          {t('settings.model_status_desc')}
        </p>
      </Card>

      <Card>
        <NotificationSettings />
      </Card>

      <Card>
        <AppLockSettings />
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-1 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          {t('settings.demo_data')}
        </h3>
        <p className="text-xs text-text-muted mb-3">{t('settings.demo_data_desc')}</p>
        <Button variant="secondary" onClick={handleSeedDemo}>
          <Sparkles className="w-4 h-4" />
          {t('settings.demo_data_btn')}
        </Button>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-1 flex items-center gap-2">
          <Download className="w-4 h-4" />
          {t('settings.auto_backup')}
        </h3>
        <p className="text-xs text-text-muted mb-3">
          {t('settings.auto_backup_desc')}
        </p>
        <div className="flex flex-col space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoBackupEnabled}
              onChange={toggleAutoBackup}
              className="w-4 h-4 rounded accent-teal-500"
            />
            <span className="text-xs font-medium text-text-primary">
              {t('settings.auto_backup_enable')}
            </span>
          </label>
          <div className="flex items-center gap-3">
            <label htmlFor="backup-interval" className="text-xs text-text-secondary cursor-pointer">
              {t('settings.backup_interval')}
            </label>
            <select
              id="backup-interval"
              value={backupInterval}
              onChange={handleIntervalChange}
              disabled={!autoBackupEnabled}
              aria-label={t('settings.backup_interval')}
              className="text-xs px-2 py-1 rounded-btn border bg-transparent disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{ borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
            >
              <option value="daily">{lang === 'zh-CN' ? '每天' : 'Daily'}</option>
              <option value="weekly">{lang === 'zh-CN' ? '每周' : 'Weekly'}</option>
              <option value="monthly">{lang === 'zh-CN' ? '每月' : 'Monthly'}</option>
            </select>
          </div>
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>
              {t('settings.last_backup')}{lastBackupDate || t('settings.never')}
            </span>
            <Button variant="secondary" size="sm" onClick={handleBackupNow} disabled={exporting}>
              <Download className="w-3.5 h-3.5" />
              {exporting ? t('settings.backing_up') : t('settings.backup_now')}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-1">{t('settings.about')}</h3>
        <p className="text-xs text-text-muted mt-1">{t('settings.about_desc')}</p>
      </Card>
    </div>
  );
}
