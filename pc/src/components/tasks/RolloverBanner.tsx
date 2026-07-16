import { RotateCw, X } from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';

interface RolloverBannerProps {
  count: number;
  onDismiss: () => void;
}

export default function RolloverBanner({ count, onDismiss }: RolloverBannerProps) {
  const { t } = useLanguage();
  if (count === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-300 fade-in">
      <div className="flex items-center gap-2">
        <RotateCw className="w-4 h-4" />
        <span>{t('task.rollover_banner', { count })}</span>
      </div>
      <button onClick={onDismiss} aria-label={t('common.cancel')} className="p-0.5 hover:bg-amber-100 dark:hover:bg-amber-800/50 rounded transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
