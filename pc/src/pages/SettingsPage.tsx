import { useCallback, useState, useEffect, useRef } from 'react';
import { Languages, Sun, Moon, Monitor, Keyboard } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useLanguage } from '../i18n/useLanguage';
import { useThemeStore, type ThemeMode } from '../stores/useThemeStore';
import { useShortcutStore, type ShortcutAction } from '../stores/useShortcutStore';
import { checkConflict } from '../utils/shortcutConflict';
import NotificationSettings from '../components/common/NotificationSettings';
import AppLockSettings from '../components/common/AppLockSettings';
import AppearanceSettings from '../components/settings/AppearanceSettings';
import DataSettings from '../components/settings/DataSettings';
import ChatLLMSettings from '../components/settings/ChatLLMSettings';
import TermSettings from '../components/settings/TermSettings';

/**
 * SettingsPage —— 设置主页面
 *
 * 历史上单文件 556 行，承载：数据管理/语言/主题/外观/快捷键/存储/通知/锁屏/演示数据/自动备份/关于。
 * 现已按职责拆出：
 *  - 数据相关（导入/导出/重置/演示/存储/自动备份）→ <DataSettings />
 *  - 外观 → <AppearanceSettings />（已是独立组件）
 *  - 通知 → <NotificationSettings />（已是独立组件）
 *  - 锁屏 → <AppLockSettings />（已是独立组件）
 * 本页保留：语言、主题、快捷键、关于（这部分状态较轻、紧耦合 store）
 */
export default function SettingsPage() {
  const { lang, setLang, t } = useLanguage();
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const shortcuts = useShortcutStore((s) => s.shortcuts);
  const setShortcut = useShortcutStore((s) => s.setShortcut);
  const resetShortcuts = useShortcutStore((s) => s.resetAll);
  const [recording, setRecording] = useState<ShortcutAction | null>(null);
  const recordingRef = useRef<ShortcutAction | null>(null);

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

  // 把 DataSettings 的 exporting 状态透传出来，用于禁用自动备份按钮（已由 DataSettings 内部处理，这里无需订阅）
  const noop = useCallback(() => {}, []);

  return (
    <div className="space-y-6 max-w-2xl">
      <p className="text-text-muted">{t('settings.title')}</p>

      {/* 数据管理 / 存储 / 演示数据 / 自动备份（一并交给 DataSettings） */}
      <DataSettings onExportingChange={noop} />

      {/* AI 对话设置（LLM provider / API Key / 测试连接） */}
      <ChatLLMSettings />

      {/* 学期设置（校历配置 / 考试周识别） */}
      <TermSettings />

      {/* 语言 */}
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

      {/* 主题 */}
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

      {/* 外观个性化 */}
      <AppearanceSettings />

      {/* 快捷键 */}
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

      {/* 通知 */}
      <Card>
        <NotificationSettings />
      </Card>

      {/* 锁屏 */}
      <Card>
        <AppLockSettings />
      </Card>

      {/* 关于 */}
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-1">{t('settings.about')}</h3>
        <p className="text-xs text-text-muted mt-1">{t('settings.about_desc')}</p>
        <div className="flex items-center gap-3 mt-3">
          <a
            onClick={() => window.electronAPI?.openExternal('https://github.com/Fnk000044/FriendOS')}
            className="text-xs text-primary hover:underline cursor-pointer flex items-center gap-1"
          >
            GitHub 仓库 ↗
          </a>
        </div>
      </Card>
    </div>
  );
}
