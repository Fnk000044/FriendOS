import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MessageCircle, Shield, ChevronRight } from 'lucide-react';
import { useDailyCheck } from '../../hooks/useDailyCheck';
import type { RiskAlert } from '../../services/emotion/DailyCheckScheduler';
import { useLanguage } from '../../i18n/useLanguage';

/**
 * Dashboard 顶部预警横幅
 * 根据 DailyCheckResult.alert 显示分级横幅，可关闭/跳风险页/一键开始对话
 */

const LEVEL_STYLE: Record<RiskAlert['level'], { bg: string; border: string; icon: typeof Shield; label: string }> = {
  attention: {
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.3)',
    icon: Shield,
    label: '关注',
  },
  reminder: {
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.3)',
    icon: MessageCircle,
    label: '提醒',
  },
  warning: {
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.3)',
    icon: Shield,
    label: '警告',
  },
  crisis: {
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.5)',
    icon: Shield,
    label: '危急',
  },
};

export default function RiskBanner() {
  const navigate = useNavigate();
  const { result } = useDailyCheck();
  const [dismissed, setDismissed] = useState(false);

  const alert = result?.alert;
  if (!alert || dismissed) return null;

  const style = LEVEL_STYLE[alert.level] || LEVEL_STYLE.attention;
  const Icon = style.icon;
  const isActionable = alert.level === 'reminder' || alert.level === 'warning';

  return (
    <div
      className="rounded-xl px-4 py-3 flex items-center gap-3 border"
      style={{ background: style.bg, borderColor: style.border }}
      role="alert"
    >
      <Icon className="w-5 h-5 shrink-0" style={{ color: style.border }} aria-hidden="true" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{alert.title}</p>
        <p className="text-xs text-text-secondary truncate">{alert.body}</p>
      </div>

      {isActionable && (
        <button
          onClick={() => navigate(alert.action)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white rounded-lg shrink-0"
          style={{ background: 'var(--gradient-primary)' }}
        >
          <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
          和知己聊聊
        </button>
      )}

      <button
        onClick={() => navigate('/risk')}
        className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-text-muted shrink-0"
        aria-label="查看风险详情"
      >
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </button>

      <button
        onClick={() => setDismissed(true)}
        className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-text-muted shrink-0"
        aria-label="关闭"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
