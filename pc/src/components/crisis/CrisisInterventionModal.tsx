import { useState, useEffect, useCallback } from 'react';
import { Heart, X, Shield, ExternalLink } from 'lucide-react';
import HotlineCard from './HotlineCard';
import { useCrisisStore } from '../../stores/crisisStore';
import { db } from '../../db';
import { getToday } from '../../utils/date';
import { useLanguage } from '../../i18n/useLanguage';

const HOTLINE_KEYS = [
  { nameKey: 'crisis.hotline_national_name' as const, number: '400-161-9995', descKey: 'crisis.hotline_national_desc' as const },
  { nameKey: 'crisis.hotline_beijing_name' as const, number: '010-82951332', descKey: 'crisis.hotline_beijing_desc' as const },
  { nameKey: 'crisis.hotline_life_name' as const, number: '400-821-1215', descKey: 'crisis.hotline_life_desc' as const },
  { nameKey: 'crisis.hotline_hope_name' as const, number: '400-179-1885', descKey: 'crisis.hotline_hope_desc' as const },
];

export default function CrisisInterventionModal() {
  const { visible, riskLevel, triggerSource, triggerContent, hide } = useCrisisStore();
  const { t } = useLanguage();
  const [countdown, setCountdown] = useState(5);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCountdown(5);
      setCanClose(false);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanClose(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible]);

  const handleDismiss = useCallback(async () => {
    if (!canClose) return;

    // 记录危机日志
    try {
      await db.crisisLogs.add({
        id: crypto.randomUUID(),
        date: getToday(),
        triggerSource: triggerSource || 'diary',
        triggerContent: triggerContent.slice(0, 200),
        riskLevel: (riskLevel === 'critical' ? 'critical' : 'high'),
        handled: true,
        action: '用户已查看危机干预信息并关闭弹窗',
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to log crisis event:', err);
    }

    hide();
  }, [canClose, hide, riskLevel, triggerContent, triggerSource]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={t('crisis.aria_label')}
      aria-describedby="crisis-description"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 glass-card glass-glow rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-5 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{t('crisis.title')}</h2>
              <p className="text-sm text-white/80">{t('crisis.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {/* Message */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Shield className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div id="crisis-description" className="text-sm text-slate-700 leading-relaxed">
                <p className="mb-2">
                  {t('crisis.description_1')}
                  <strong className="text-blue-700">{t('crisis.description_2')}</strong>
                  {t('crisis.description_3')}
                </p>
                <p>{t('crisis.description_4')}</p>
              </div>
            </div>
          </div>

          {/* Hotlines */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-600">{t('crisis.hotline_title')}</h3>
            {HOTLINE_KEYS.map((hotline) => (
              <HotlineCard key={hotline.number} name={t(hotline.nameKey)} number={hotline.number} description={t(hotline.descKey)} />
            ))}
          </div>

          {/* Online Resources */}
          <div className="text-xs text-slate-500 space-y-1">
            <p className="flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              {t('crisis.online_counseling')}
              <a
                href="https://www.xinli001.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                壹心理
              </a>
              {' | '}
              <a
                href="https://www.jiandanxinli.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                简单心理
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t" style={{ background: 'var(--bg-hover)', borderColor: 'var(--glass-border)' }}>
          <button
            onClick={handleDismiss}
            disabled={!canClose}
            className={`w-full py-3 px-4 rounded-lg text-sm font-medium transition-all ${
              canClose
                ? 'bg-slate-800 text-white hover:bg-slate-700 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {canClose ? t('crisis.close_button') : t('crisis.countdown', { seconds: countdown })}
          </button>
        </div>

        {/* Close button (only when countdown is done) */}
        {canClose && (
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
