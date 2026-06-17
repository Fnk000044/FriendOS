import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  icon,
  title = '暂无数据',
  description = '还没有内容，快去创建一条吧',
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-text-muted">
      <div className="opacity-40 mb-3">
        {icon || <Inbox className="w-12 h-12" />}
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs mt-1">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
