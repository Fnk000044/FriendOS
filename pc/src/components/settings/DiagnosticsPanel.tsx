import { useCallback, useEffect, useState } from 'react';
import {
  Wifi,
  WifiOff,
  Brain,
  KeyRound,
  Route,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';
import { useDemoModeStore } from '../../stores/demoModeStore';
import { seedDemoData } from '../../utils/seedDemoData';
import toast from 'react-hot-toast';

interface DiagnosticsPanelProps {
  /** 是否以弹层形式展示（SettingsPage 复用）；false 时渲染为独立卡片 */
  onClose?: () => void;
}

type StatusKind = 'ok' | 'warn' | 'off' | 'loading';

function StatusDot({ kind }: { kind: StatusKind }) {
  const color =
    kind === 'ok' ? '#22c55e'
    : kind === 'warn' ? '#f59e0b'
    : kind === 'off' ? '#94a3b8'
    : '#3b82f6';
  const pulse = kind === 'loading';
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${pulse ? 'animate-pulse' : ''}`}
      style={{ background: color }}
      aria-hidden="true"
    />
  );
}

function StatusRow({
  icon,
  title,
  status,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  status: StatusKind;
  desc: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-3.5 py-3 border" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-hover)' }}>
      <div className="text-text-secondary shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="text-xs text-text-muted mt-0.5">{desc}</p>
      </div>
      <StatusDot kind={status} />
    </div>
  );
}

/**
 * DiagnosticsPanel — 启动自检面板（P0-2）
 *
 * 挂载时调用主进程 `diagnostics:check`，展示四态卡片：
 * 联网 / 情感模型（ONNX）/ API Key / 对话降级路径。
 * 底部提供「进入演示模式」主按钮（一键注入 30 天演示数据 + 激活 demoModeStore）。
 * 可从首屏打开（可关闭），也可在 SettingsPage 重新打开。
 */
export default function DiagnosticsPanel({ onClose }: DiagnosticsPanelProps) {
  const { t } = useLanguage();
  const demoStatus = useDemoModeStore((s) => s.status);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosticsResult | null>(null);
  const [injecting, setInjecting] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await window.electronAPI?.diagnosticsCheck({
        demoMode: useDemoModeStore.getState().status === 'active',
      });
      if (!res) throw new Error('diagnosticsCheck unavailable');
      setResult(res);
    } catch (e: any) {
      setError(e?.message ?? '自检失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  // PRD v3 P1-18：API Key 保存/测试成功后，其他组件派发 friendos:diag-refresh 事件 → 自检即时更新
  useEffect(() => {
    const onRefresh = () => run();
    window.addEventListener('friendos:diag-refresh', onRefresh);
    return () => window.removeEventListener('friendos:diag-refresh', onRefresh);
  }, [run]);

  const handleEnterDemo = useCallback(async () => {
    setInjecting(true);
    try {
      const res = await seedDemoData(true);
      if (res.success) {
        useDemoModeStore.getState().activate();
        toast.success(t('settings.demo_data_success'));
        window.location.reload();
      } else {
        toast.error(t('settings.demo_data_fail'));
      }
    } catch {
      toast.error(t('settings.demo_data_fail'));
    } finally {
      setInjecting(false);
    }
  }, [t]);

  const networkKind: StatusKind = loading ? 'loading' : result ? (result.network.online ? 'ok' : 'off') : 'off';
  const modelKind: StatusKind = loading ? 'loading' : result ? (result.model.onnxLoaded ? 'ok' : result.model.onnxAvailable ? 'warn' : 'off') : 'off';
  const keyKind: StatusKind = loading ? 'loading' : result ? (result.apiKey.hasKey ? 'ok' : 'off') : 'off';
  const degradationKind: StatusKind = loading ? 'loading' : result ? (result.degradationPath === 'cloud' ? 'ok' : 'warn') : 'off';

  return (
    <div className="glass-card glass-glow p-5 rounded-2xl border" style={{ borderColor: 'var(--glass-border)' }}>
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" aria-hidden="true" />
          <h3 className="text-base font-semibold text-text-primary">{t('diag.title')}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={run}
            disabled={loading}
            aria-label={t('diag.refresh')}
            title={t('diag.refresh')}
            className="p-2 rounded-lg text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭自检面板"
              className="p-2 rounded-lg text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-text-muted mb-4">{t('diag.desc')}</p>

      {error ? (
        <div className="rounded-xl p-3 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
          {error}
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* 联网 */}
          <StatusRow
            icon={result?.network.online ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            title={t('diag.network')}
            status={networkKind}
            desc={result?.network.online ? t('diag.online') : t('diag.offline')}
          />
          {/* 情感模型（ONNX） */}
          <StatusRow
            icon={<Brain className="w-4 h-4" />}
            title={t('diag.model')}
            status={modelKind}
            desc={
              result
                ? result.model.onnxLoaded
                  ? t('diag.model_loaded')
                  : result.model.onnxAvailable
                    ? t('diag.model_ready')
                    : t('diag.model_unavailable')
                : ''
            }
          />
          {/* API Key */}
          <StatusRow
            icon={<KeyRound className="w-4 h-4" />}
            title={t('diag.api_key')}
            status={keyKind}
            desc={result?.apiKey.hasKey ? t('diag.key_set') : t('diag.key_missing')}
          />
          {/* 降级路径 */}
          <StatusRow
            icon={<Route className="w-4 h-4" />}
            title={t('diag.degradation')}
            status={degradationKind}
            desc={
              result
                ? result.degradationPath === 'cloud'
                  ? t('diag.degradation_cloud')
                  : t('diag.ready_template_enhanced')
                : ''
            }
          />
          {/* 主进程健康（P2-12：发生过未捕获异常/未处理拒绝时提示） */}
          {result?.mainProcess?.degraded && (
            <StatusRow
              icon={<AlertTriangle className="w-4 h-4" />}
              title={t('diag.main_process')}
              status="warn"
              desc={t('diag.main_degraded', { message: result.mainProcess.lastError || '' })}
            />
          )}
        </div>
      )}

      {/* 版本 + 演示模式状态 */}
      <div className="flex items-center justify-between mt-4 text-xs text-text-muted">
        <span>
          {t('diag.app_version')}: {result?.appVersion ?? '—'}
        </span>
        <span className="flex items-center gap-1.5">
          <StatusDot kind={demoStatus === 'active' ? 'ok' : 'off'} />
          {t('diag.demo_mode')}: {demoStatus === 'active' ? t('diag.demo_on') : t('diag.demo_off')}
        </span>
      </div>

      {/* 进入演示模式 */}
      <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
        <button
          type="button"
          onClick={handleEnterDemo}
          disabled={injecting || demoStatus === 'active'}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
        >
          {injecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {demoStatus === 'active' ? (
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {t('settings.demo_active')}
            </span>
          ) : (
            t('diag.enter_demo')
          )}
        </button>
        <p className="text-[11px] text-text-muted mt-2 text-center">
          {t('settings.demo_inject_desc')}
        </p>
      </div>
    </div>
  );
}
