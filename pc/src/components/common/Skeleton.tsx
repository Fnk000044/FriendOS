interface SkeletonProps {
  className?: string;
  count?: number;
}

/** 通用骨架屏加载组件 */
export function Skeleton({ className = 'h-4 w-full rounded' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{ background: 'var(--bg-hover)' }}
      aria-hidden="true"
    />
  );
}

/** 卡片骨架屏 */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="glass-card p-5 space-y-3" aria-busy="true" aria-label="加载中">
      <Skeleton className="h-4 w-1/3 rounded" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full rounded" />
      ))}
    </div>
  );
}

/** 统计卡片骨架屏 */
export function StatCardSkeleton() {
  return (
    <div className="glass-card p-4 animate-pulse" aria-busy="true">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg" style={{ background: 'var(--bg-hover)' }} />
        <div className="h-3 w-16 rounded" style={{ background: 'var(--bg-hover)' }} />
      </div>
      <div className="h-8 w-12 rounded" style={{ background: 'var(--bg-hover)' }} />
      <div className="mt-2 pt-2 border-t border-transparent">
        <div className="h-3 w-20 rounded" style={{ background: 'var(--bg-hover)' }} />
      </div>
    </div>
  );
}
