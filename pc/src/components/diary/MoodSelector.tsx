import { useLanguage } from '../../i18n/useLanguage';

interface MoodSelectorProps {
  value: 1 | 2 | 3 | 4 | 5;
  onChange?: (mood: 1 | 2 | 3 | 4 | 5) => void;
  size?: 'sm' | 'md';
}

const moodColors = ['#EF4444', '#F97316', '#F59E0B', '#22C55E', '#14B8A6'];

const MoodFace = ({ index, size }: { index: number; size: number }) => {
  const color = moodColors[index];
  const paths = [
    // Angry
    <g key="angry">
      <circle cx="12" cy="12" r="10" fill={color} opacity={0.15} />
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.5} fill="none" />
      <path d="M8 9.5l2.5-1.5M16 9.5l-2.5-1.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <circle cx="9" cy="10.5" r="1" fill={color} />
      <circle cx="15" cy="10.5" r="1" fill={color} />
      <path d="M9 15.5c1.5-2 4.5-2 6 0" stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" />
    </g>,
    // Sad
    <g key="sad">
      <circle cx="12" cy="12" r="10" fill={color} opacity={0.15} />
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.5} fill="none" />
      <circle cx="9" cy="10.5" r="1" fill={color} />
      <circle cx="15" cy="10.5" r="1" fill={color} />
      <path d="M9 15.5c1.5-1.5 4.5-1.5 6 0" stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" />
      <path d="M8.5 8.5c0 0 1-2 3.5-2s3.5 2 3.5 2" stroke={color} strokeWidth={1} strokeLinecap="round" fill="none" opacity={0.5} />
    </g>,
    // Neutral
    <g key="neutral">
      <circle cx="12" cy="12" r="10" fill={color} opacity={0.15} />
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.5} fill="none" />
      <circle cx="9" cy="10.5" r="1" fill={color} />
      <circle cx="15" cy="10.5" r="1" fill={color} />
      <line x1="9" y1="15" x2="15" y2="15" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </g>,
    // Happy
    <g key="happy">
      <circle cx="12" cy="12" r="10" fill={color} opacity={0.15} />
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.5} fill="none" />
      <circle cx="9" cy="10.5" r="1" fill={color} />
      <circle cx="15" cy="10.5" r="1" fill={color} />
      <path d="M9 14.5c1.5 1.5 4.5 1.5 6 0" stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" />
    </g>,
    // Very Happy — 眼睛是两个点（删掉压眼的弧线，放大圆点与其它表情一致）
    <g key="very-happy">
      <circle cx="12" cy="12" r="10" fill={color} opacity={0.15} />
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.5} fill="none" />
      <circle cx="9" cy="10.5" r="1" fill={color} />
      <circle cx="15" cy="10.5" r="1" fill={color} />
      <path d="M8 14.5c1.5 2.5 6.5 2.5 8 0" stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" />
      <path d="M9 15c1.2 1.5 4.8 1.5 6 0" fill={color} opacity={0.25} />
    </g>,
  ];

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {paths[index]}
    </svg>
  );
};

export default function MoodSelector({ value, onChange, size = 'md' }: MoodSelectorProps) {
  const { t } = useLanguage();
  const iconSize = size === 'sm' ? 20 : 28;
  const btnSize = size === 'sm' ? 'p-1.5' : 'p-2';
  const isReadOnly = !onChange;

  if (isReadOnly) {
    return (
      <span className="inline-flex items-center" title={t(`mood.${value}` as any)}>
        <MoodFace index={value - 1} size={iconSize} />
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {([1, 2, 3, 4, 5] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onChange(m); }}
          title={t(`mood.${m}` as any)}
          aria-label={t(`mood.${m}` as any)}
          aria-pressed={value === m}
          className={`${btnSize} rounded-lg transition-all ${
            value === m
              ? 'bg-primary/10 scale-110 shadow-sm'
              : 'opacity-40 hover:opacity-80'
          }`}
        >
          <MoodFace index={m - 1} size={iconSize} />
        </button>
      ))}
    </div>
  );
}
