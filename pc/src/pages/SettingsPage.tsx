import { useCallback, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Download, Upload, Database, Languages, FolderOpen, AlertTriangle, Sun, Moon, Monitor, Keyboard, Brain, Bell, Lock, Sparkles } from 'lucide-react';
import { db } from '../db';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useLanguage } from '../i18n/useLanguage';
import { useThemeStore, type ThemeMode } from '../stores/useThemeStore';
import { useShortcutStore, type ShortcutAction } from '../stores/useShortcutStore';
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
        version: 1,
        exportedAt: new Date().toISOString(),
        tasks: await db.tasks.toArray(),
        diaries: await db.diaries.toArray(),
        habits: await db.habits.toArray(),
        habitLogs: await db.habitLogs.toArray(),
        memories: await db.memories.toArray(),
        dailyRecords: await db.dailyRecords.toArray(),
        quickCaptures: await db.quickCaptures.toArray(),
        categories: await db.categories.toArray(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lifeos-backup-${getToday()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('common.backup_success'));
    } catch (err) {
      toast.error(t('common.backup_fail'));
      console.error(err);
    }
    setExporting(false);
  }, [t]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.version) {
          toast.error(t('common.import_fail'));
          return;
        }

        await db.delete();
        await db.open();

        const tables = ['tasks', 'diaries', 'habits', 'habitLogs', 'memories', 'dailyRecords', 'quickCaptures', 'categories'] as const;
        for (const table of tables) {
          if (data[table]?.length) {
            await (db[table] as any).bulkAdd(data[table]);
          }
        }

        toast.success(t('common.import_success'));
        window.location.reload();
      } catch (err) {
        toast.error(t('common.import_fail'));
        console.error(err);
      }
    };
    input.click();
  }, [t]);

  const handleOpenFolder = useCallback(() => {
    window.electronAPI?.openDataFolder();
  }, []);

  const handleReset = useCallback(async () => {
    if (!window.confirm(t('settings.reset_confirm'))) return;
    await db.delete();
    // 只清除FriendOS相关的localStorage key，避免影响其他应用
    const friendosKeys = Object.keys(localStorage).filter(key =>
      key.startsWith('friendos_') || key.startsWith('lifeos_') || key.startsWith('use_')
    );
    friendosKeys.forEach(key => localStorage.removeItem(key));
    window.location.reload();
  }, [t]);

  const handleSeedDemo = useCallback(async () => {
    if (!window.confirm('填充演示数据将清除当前所有数据，确定继续？')) return;
    const result = await seedDemoData();
    if (result.success) {
      toast.success('演示数据填充成功！');
      window.location.reload();
    } else {
      toast.error('演示数据填充失败');
    }
  }, []);

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
        <div className="mt-6 pt-4 border-t border-slate-100">
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
            onClick={() => setLang('zh-CN')}
            className={`px-4 py-2 text-sm rounded-btn border transition-all ${
              lang === 'zh-CN'
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'text-text-muted hover:border-slate-300'
            }`}
            style={lang === 'zh-CN' ? undefined : { borderColor: 'var(--glass-border)' }}
          >
            🇨🇳 中文
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-4 py-2 text-sm rounded-btn border transition-all ${
              lang === 'en'
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'text-text-muted hover:border-slate-300'
            }`}
            style={lang === 'en' ? undefined : { borderColor: 'var(--glass-border)' }}
          >
            🇺🇸 English
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
              onClick={() => setThemeMode(mode)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-btn border transition-all ${
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
        <div className="mt-4 pt-3 border-t border-slate-100">
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
          情感分析模型状态
        </h3>
        <div className="mt-3">
          <ModelStatus />
        </div>
        <p className="text-xs text-text-muted mt-3">
          关键词分析随时可用。训练 ONNX 模型可提升分析精度。
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
          演示数据
        </h3>
        <p className="text-xs text-text-muted mb-3">填充预设数据，方便演示和答辩展示。</p>
        <Button variant="secondary" onClick={handleSeedDemo}>
          <Sparkles className="w-4 h-4" />
          填充演示数据
        </Button>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-1">{t('settings.about')}</h3>
        <p className="text-xs text-text-muted mt-1">{t('settings.about_desc')}</p>
      </Card>
    </div>
  );
}
