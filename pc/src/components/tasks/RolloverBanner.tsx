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
    <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 fade-in">
      <div className="flex items-center gap-2">
        <RotateCw className="w-4 h-4" />
        <span>{t('task.rollover_banner', { count })}</span>
      </div>
      <button onClick={onDismiss} className="p-0.5 hover:bg-amber-100 rounded transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
