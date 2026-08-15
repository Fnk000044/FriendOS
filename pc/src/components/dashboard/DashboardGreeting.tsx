import { memo } from 'react';
import { format } from 'date-fns';
import { useClock, getGreeting } from '../../hooks/useClock';
import { useLanguage } from '../../i18n/useLanguage';

/**
 * DashboardGreeting — 仪表盘问候区（每秒刷新的时钟收敛在此组件内）
 *
 * 修复审计 P1-1：原 DashboardPage 直接 useClock()，每秒带动整棵仪表盘
 * 子树（QuickStats/预警横幅/六张卡片等）整体重渲染。现在把唯一的
 * 时间相关 UI 收敛到 memo 子组件，页面主体不再订阅每秒时钟。
 */
function DashboardGreetingInner() {
  const { t, lang } = useLanguage();
  const now = useClock();
  const greeting = getGreeting(now, lang);

  const dateDisplay = lang === 'zh-CN'
    ? `${now.getMonth() + 1}月${now.getDate()}日 ${['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()]}`
    : format(now, 'EEE, MMM d');

  return (
    <div className="flex items-end justify-between">
      <div>
        <p className="text-xs font-medium text-primary mb-1">{greeting}</p>
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">
          {t('dashboard.today_overview')}
        </h2>
      </div>
      <span className="text-xs text-text-muted font-medium px-3 py-1.5 rounded-full" style={{ background: 'var(--bg-hover)' }}>
        {dateDisplay}
      </span>
    </div>
  );
}

const DashboardGreeting = memo(DashboardGreetingInner);
export default DashboardGreeting;
