import { Activity, Brain, BookOpen, ClipboardList, MessageSquare, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';

interface RiskBreakdown {
  emotion: { score: number; weight: number };
  behavior: { score: number; weight: number };
  assessment: { score: number; weight: number };
  chat: { score: number; weight: number };
  diary: { score: number; weight: number };
}

interface RiskFactor {
  type: string;
  weight: number;
  description: string;
}

interface RiskSignalSourcesProps {
  breakdown: RiskBreakdown;
  factors: RiskFactor[];
}

// 信号源图标
const signalIcons: Record<string, React.ReactNode> = {
  emotion: <Activity className="w-4 h-4" />,
  behavior: <Brain className="w-4 h-4" />,
  assessment: <ClipboardList className="w-4 h-4" />,
  chat: <MessageSquare className="w-4 h-4" />,
  diary: <BookOpen className="w-4 h-4" />,
};

export default function RiskSignalSources({ breakdown, factors }: RiskSignalSourcesProps) {
  const { t } = useLanguage();

  const signalLabels: Record<string, string> = {
    emotion: t('risk.signal_emotion'),
    behavior: t('risk.signal_behavior'),
    assessment: t('risk.signal_assessment'),
    chat: t('risk.signal_chat'),
    diary: t('risk.signal_diary'),
  };

  return (
    <>
      {/* 信号源状态 —— 每信号加 4 态文字标签 */}
      <div className="glass-card rounded-2xl p-6" role="region" aria-label={t('risk.signal_analysis')}>
        <h3 className="text-lg font-semibold text-text-primary mb-4">{t('risk.signal_analysis')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4" role="list">
          {Object.entries(breakdown).map(([key, data]) => {
            const isHigh = data.score >= 60;
            const isMedium = data.score >= 40;
            const isLow = data.score >= 20;
            const statusLabel = isHigh ? t('risk.status_high')
              : isMedium ? t('risk.status_attention')
              : isLow ? t('risk.status_normal')
              : t('risk.status_good');
            const statusColor = isHigh ? 'text-red-500' : isMedium ? 'text-orange-500' : isLow ? 'text-yellow-500' : 'text-green-500';
            return (
              <div
                key={key}
                role="listitem"
                className="p-4 rounded-xl bg-surface-hover/50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-primary" aria-hidden="true">{signalIcons[key]}</span>
                  <span className="text-sm font-medium text-text-secondary">{signalLabels[key]}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-bold ${statusColor}`}>
                    {data.score}
                  </span>
                  <span className="text-xs text-text-muted">/100</span>
                </div>
                {/* 4 态文字标签，让用户立马感知问题 */}
                <p className={`text-xs font-medium mt-1 ${statusColor}`}>{statusLabel}</p>
                <div className="mt-2 h-1.5 bg-surface-hover rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      isHigh ? 'bg-red-500' :
                      isMedium ? 'bg-orange-500' :
                      isLow ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${data.score}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted mt-1">{t('risk.weight_suffix_pct', { weight: Math.round(data.weight * 100) })}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 风险因素列表 —— 顶部最严重 1-2 条醒目卡片，其余折叠 */}
      {factors.length > 0 && (
        <div className="glass-card rounded-2xl p-6" role="region" aria-label={t('risk.risk_factors')}>
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" aria-hidden="true" />
            {t('risk.risk_factors')}
          </h3>
          <div className="space-y-3" role="list">
            {factors.map((factor, index) => {
              const isSevere = factor.weight >= 20;
              return (
                <div
                  key={index}
                  role="listitem"
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isSevere
                      ? 'border border-red-200 dark:border-red-800 bg-red-50/60 dark:bg-red-900/20'
                      : 'bg-surface-hover/50'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    factor.weight >= 30 ? 'bg-red-500' :
                    factor.weight >= 20 ? 'bg-orange-500' :
                    factor.weight >= 10 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`} />
                  <span className="text-sm text-text-secondary flex-1">{factor.description}</span>
                  <span className="text-xs text-text-muted">{t('risk.weight_suffix', { weight: factor.weight })}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
