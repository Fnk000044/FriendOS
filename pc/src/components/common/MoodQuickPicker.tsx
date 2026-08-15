import { useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import { shouldReduceMotion } from '../../utils/reduceMotion';

const moodColors = ['#EF4444', '#F97316', '#F59E0B', '#22C55E', '#14B8A6'];
const moodLabels = ['很差', '不好', '一般', '还好', '很好'];

const MoodFace = ({ index, size, active }: { index: number; size: number; active: boolean }) => {
  const color = moodColors[index];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ opacity: active ? 1 : 0.35 }}>
      <circle cx="12" cy="12" r="10" fill={color} opacity={active ? 0.15 : 0.05} />
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.5} fill="none" />
      <circle cx="9" cy="10.5" r="1" fill={color} />
      <circle cx="15" cy="10.5" r="1" fill={color} />
      {index < 2 ? (
        <path d="M9 15.5c1.5-1.5 4.5-1.5 6 0" stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" />
      ) : index === 2 ? (
        <line x1="9" y1="15" x2="15" y2="15" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      ) : (
        <path d="M9 14.5c1.5 1.5 4.5 1.5 6 0" stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" />
      )}
    </svg>
  );
};

interface Props {
  /** 标题文案，如"开始前，你现在感觉如何？" */
  title?: string;
  onConfirm: (mood: 1 | 2 | 3 | 4 | 5) => void;
  onSkip?: () => void;
}

/**
 * 轻量 1-5 分情绪快速评分器
 * 用于干预前后情绪采集（therapyRecords.moodBefore/After）
 * 复用 MoodSelector 的表情样式，走 reduceMotion
 */
export default function MoodQuickPicker({ title, onConfirm, onSkip }: Props) {
  const { t } = useLanguage();
  const reduce = shouldReduceMotion();
  const [selected, setSelected] = useState<1 | 2 | 3 | 4 | 5 | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }} role="dialog" aria-modal="true">
      <div
        className="rounded-2xl p-6 mx-4 max-w-sm w-full border"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--glass-border)',
          animation: reduce ? 'none' : 'fadeIn 0.2s ease-out',
        }}
      >
        <h3 className="text-sm font-semibold text-text-primary mb-1 text-center">
          {title || t('chat.suggest_breathing')}
        </h3>
        <p className="text-xs text-text-muted mb-4 text-center">1 分最差，5 分最好</p>

        <div className="flex justify-between gap-1 mb-5">
          {([1, 2, 3, 4, 5] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSelected(m)}
              title={moodLabels[m - 1]}
              aria-label={moodLabels[m - 1]}
              aria-pressed={selected === m}
              className={`p-1 rounded-lg ${reduce ? '' : 'transition-transform'} ${selected === m ? 'bg-primary/10 scale-110' : ''}`}
            >
              <MoodFace index={m - 1} size={32} active={selected === null || selected === m} />
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="flex-1 py-2 text-xs text-text-muted border rounded-btn hover:bg-[var(--bg-hover)]"
              style={{ borderColor: 'var(--glass-border)' }}
            >
              跳过
            </button>
          )}
          <button
            type="button"
            onClick={() => selected && onConfirm(selected)}
            disabled={!selected}
            className="flex-1 py-2 text-xs text-white rounded-btn disabled:opacity-40"
            style={{ background: 'var(--gradient-primary)' }}
          >
            确认
          </button>
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}
