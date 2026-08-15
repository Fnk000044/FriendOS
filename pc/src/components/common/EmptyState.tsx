import { Inbox } from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-text-muted pop-in">
      <div className="opacity-40 mb-3">
        {icon || <Inbox className="w-12 h-12" />}
      </div>
      <p className="text-sm font-medium">{title ?? t('common.empty_title')}</p>
      <p className="text-xs mt-1">{description ?? t('common.empty_desc')}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
