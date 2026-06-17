import { useLanguage } from '../../i18n/useLanguage';

interface MoodSelectorProps {
  value: 1 | 2 | 3 | 4 | 5;
  onChange?: (mood: 1 | 2 | 3 | 4 | 5) => void;
  size?: 'sm' | 'md';
}

const moodIcons = ['😡', '😞', '😐', '😊', '😄'];

export default function MoodSelector({ value, onChange, size = 'md' }: MoodSelectorProps) {
  const { t } = useLanguage();
  const btnSize = size === 'sm' ? 'text-lg p-1.5' : 'text-2xl p-2';
  const isReadOnly = !onChange;

  if (isReadOnly) {
    // 只读模式：只显示当前心情图标
    return (
      <span className={`${btnSize} inline-flex items-center`} title={t(`mood.${value}` as any)}>
        {moodIcons[value - 1]}
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
          className={`${btnSize} rounded-lg transition-all ${
            value === m
              ? 'bg-primary/10 scale-110 shadow-sm'
              : 'opacity-40 hover:opacity-80'
          }`}
        >
          {moodIcons[m - 1]}
        </button>
      ))}
    </div>
  );
}
