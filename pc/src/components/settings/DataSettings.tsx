import { useCallback, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Download, Upload, Database, FolderOpen, AlertTriangle, Sparkles, Trash2 } from 'lucide-react';
import { db } from '../../db';
import { useLanguage } from '../../i18n/useLanguage';
import { useNotificationStore } from '../../stores/notificationStore';
import { useDemoModeStore } from '../../stores/demoModeStore';
import { getToday } from '../../utils/date';
import { seedDemoData, clearDemoData } from '../../utils/seedDemoData';
import Card from '../common/Card';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import StorageInfo from './StorageInfo';
import { useBackup } from '../../hooks/useBackup';

interface DataSettingsProps {
  /** 导出进行中状态由内部 hook 管理，外部如需禁用其他按钮可订阅 */
  onExportingChange?: (exporting: boolean) => void;
}

/** P2-8：统一确认弹窗状态（替代 window.confirm 阻塞式原生弹窗） */
interface PendingConfirm {
  title: string;
  message: string;
  action: () => void | Promise<void>;
}

/**
 * 数据管理设置卡片：导入/导出/重置/演示数据/存储信息/自动备份
 *
 * 从 SettingsPage.tsx 抽出。状态相对独立，唯一对外接口是 onExportingChange
 * （父页用于禁用自动备份按钮，避免并发触发）。
 */
export default function DataSettings({ onExportingChange }: DataSettingsProps) {
  const { t, lang } = useLanguage();
  const { exporting, handleExport, handleImport } = useBackup();
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);

  // 把 exporting 状态透传给父级（用于禁用自动备份按钮）
  useEffect(() => {
    onExportingChange?.(exporting);
  }, [exporting, onExportingChange]);

  // 读取当前存储位置
  useEffect(() => {
    window.electronAPI?.storageGetLocation?.().then((loc) => {
      setStoragePath(loc.current);
    }).catch(() => {});
  }, []);

  /** 选择新存储位置并迁移旧数据（PRD v3 P1-16） */
  const handleChangeLocation = useCallback(async () => {
    if (migrating) return;
    const sel = await window.electronAPI?.storageSelectLocation?.();
    if (!sel || sel.canceled || !sel.path) return;
    setMigrating(true);
    setMigrateResult(null);
    try {
      const res = await window.electronAPI?.storageMigrate?.(sel.path);
      if (res?.success) {
        setStoragePath(sel.path);
        setMigrateResult({
          ok: true,
          msg: t('settings.location_migrated'),
        });
        // 迁移完成后提示重启以切换存储位置
        if (res.restartRequired) {
          setConfirm({
            title: t('common.confirm_title'),
            message: t('settings.location_restart_hint'),
            action: () => void window.electronAPI?.relaunch?.(),
          });
        }
      } else {
        setMigrateResult({ ok: false, msg: res?.error || t('settings.location_migrate_fail') });
      }
    } catch (e: any) {
      setMigrateResult({ ok: false, msg: e?.message || t('settings.location_migrate_fail') });
    } finally {
      setMigrating(false);
    }
  }, [migrating, t]);

  const handleOpenFolder = useCallback(() => {
    window.electronAPI?.openDataFolder();
  }, []);

  const handleReset = useCallback(() => {
    setConfirm({
      title: t('common.confirm_title'),
      message: t('settings.reset_confirm'),
      action: async () => {
        // 设置重置标记（不以 friendos_ 开头，不会被下面的过滤器清除）
        localStorage.setItem('system_reset_flag', '1');
        await db.delete();
        // 清除所有 FriendOS 相关的 localStorage key（含 theme/appearance/lang 等偏好）
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
        } catch { /* non-critical */ }
        // 真正重启 Electron 应用：主进程退出并重新拉起，确保 ONNX session、
        // nativeImage 句柄等主进程状态全部清空，恢复纯净初始态
        toast.success('已恢复初始化，正在重启…');
        setTimeout(async () => {
          if (window.electronAPI?.relaunch) {
            await window.electronAPI.relaunch();
          } else {
            window.location.reload();
          }
        }, 600);
      },
    });
  }, [t]);

  const handleSeedDemo = useCallback(() => {
    setConfirm({
      title: t('common.confirm_title'),
      message: t('settings.demo_data_confirm'),
      action: async () => {
        const result = await seedDemoData();
        if (result.success) {
          // 注入成功后同步激活 demoModeStore（横幅/自检状态一致）
          useDemoModeStore.getState().activate();
          toast.success(t('settings.demo_data_success'));
          window.location.reload();
        } else {
          toast.error(t('settings.demo_data_fail'));
        }
      },
    });
  }, [t]);

  const handleClearDemo = useCallback(() => {
    setConfirm({
      title: t('common.confirm_title'),
      message: t('settings.demo_data_clear_confirm'),
      action: async () => {
        try {
          await clearDemoData();
          useDemoModeStore.getState().deactivate();
          toast.success(t('settings.demo_data_clear_success'));
          window.location.reload();
        } catch (e) {
          console.error('[DataSettings] clearDemoData error:', e);
          toast.error(t('settings.demo_data_fail'));
        }
      },
    });
  }, [t]);

  // ── 自动备份 ──────────────────────────────────────────────
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

  return (
    <>
      {/* 统一确认弹窗（P2-8：替换 4 处 window.confirm） */}
      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          const c = confirm;
          setConfirm(null);
          void c?.action?.();
        }}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
      />

      {/* 数据管理 */}
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

      {/* 存储信息 */}
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-1">{t('settings.storage_info')}</h3>
        <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
          <Database className="w-4 h-4" />
          <span>{t('settings.storage_desc')}</span>
        </div>
        {/* 显示实际占用大小 + 清理缓存按钮 */}
        <StorageInfo />
        <div className="flex flex-wrap gap-2 mt-3">
          {window.electronAPI && (
            <Button variant="secondary" size="sm" onClick={handleOpenFolder}>
              <FolderOpen className="w-4 h-4" />
              {t('settings.open_folder')}
            </Button>
          )}
          {/* 自定义存储位置（PRD v3 P1-16）：选择新位置后自动迁移旧数据 */}
          {window.electronAPI?.storageSelectLocation && (
            <Button variant="secondary" size="sm" onClick={handleChangeLocation} disabled={migrating}>
              <FolderOpen className="w-4 h-4" />
              {migrating ? t('common.loading') : t('settings.change_location')}
            </Button>
          )}
        </div>
        {storagePath && (
          <p className="text-[11px] text-text-muted mt-2 break-all" title={storagePath}>
            📁 {storagePath}
          </p>
        )}
        {migrateResult && (
          <p className={`text-xs mt-2 ${migrateResult.ok ? 'text-green-500' : 'text-red-500'}`}>{migrateResult.msg}</p>
        )}
      </Card>

      {/* 演示数据 */}
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-1 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          {t('settings.demo_data')}
        </h3>
        <p className="text-xs text-text-muted mb-3">{t('settings.demo_data_desc')}</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleSeedDemo}>
            <Sparkles className="w-4 h-4" />
            {t('settings.demo_data_btn')}
          </Button>
          <Button variant="danger" onClick={handleClearDemo}>
            <Trash2 className="w-4 h-4" />
            {t('settings.demo_data_clear_btn')}
          </Button>
        </div>
      </Card>

      {/* 自动备份 */}
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-1 flex items-center gap-2">
          <Download className="w-4 h-4" />
          {t('settings.auto_backup')}
        </h3>
        <p className="text-xs text-text-muted mb-3">{t('settings.auto_backup_desc')}</p>
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
    </>
  );
}
