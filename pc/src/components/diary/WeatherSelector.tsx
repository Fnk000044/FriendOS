import { Sun, CloudSun, CloudRain, CloudSnow, CloudLightning, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage';

interface WeatherSelectorProps {
  value?: string;
  onChange?: (weather: string) => void;
  size?: 'sm' | 'md';
}

// 5 种预设天气 + 自定义输入（参考 MoodSelector 的图标按钮组设计）
const WEATHER_OPTIONS = [
  { key: 'sunny', label: '晴', Icon: Sun, color: '#F59E0B' },
  { key: 'cloudy', label: '多云', Icon: CloudSun, color: '#94A3B8' },
  { key: 'rainy', label: '雨', Icon: CloudRain, color: '#3B82F6' },
  { key: 'snowy', label: '雪', Icon: CloudSnow, color: '#60A5FA' },
  { key: 'stormy', label: '雷暴', Icon: CloudLightning, color: '#8B5CF6' },
];

const PRESET_KEYS = new Set(WEATHER_OPTIONS.map((w) => w.key));

export default function WeatherSelector({ value, onChange, size = 'md' }: WeatherSelectorProps) {
  const { t } = useLanguage();
  const [customMode, setCustomMode] = useState(false);

  const isPreset = value && PRESET_KEYS.has(value);
  const btnSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 16 : 20;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {WEATHER_OPTIONS.map(({ key, label, Icon, color }) => {
        const selected = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => {
              onChange?.(key);
              setCustomMode(false);
            }}
            aria-label={label}
            aria-pressed={selected}
            className={`${btnSize} rounded-full flex items-center justify-center transition-all border-2 cursor-pointer ${
              selected
                ? 'scale-110 shadow-md'
                : 'opacity-50 hover:opacity-80 hover:scale-105'
            }`}
            style={{
              backgroundColor: selected ? `${color}20` : 'transparent',
              borderColor: selected ? color : 'var(--glass-border)',
            }}
          >
            <Icon size={iconSize} color={color} />
          </button>
        );
      })}

      {/* 自定义按钮 */}
      <button
        type="button"
        onClick={() => setCustomMode((v) => !v)}
        aria-label="自定义天气"
        aria-pressed={!isPreset && !!value}
        className={`${btnSize} rounded-full flex items-center justify-center transition-all border-2 cursor-pointer ${
          !isPreset && value ? 'scale-110 shadow-md opacity-100' : 'opacity-50 hover:opacity-80 hover:scale-105'
        }`}
        style={{
          backgroundColor: (!isPreset && value) ? 'var(--bg-hover)' : 'transparent',
          borderColor: (!isPreset && value) ? 'var(--text-primary)' : 'var(--glass-border)',
        }}
      >
        <Pencil size={iconSize} color="var(--text-muted)" />
      </button>

      {/* 自定义输入框（点铅笔后展开） */}
      {customMode && (
        <input
          autoFocus
          value={isPreset ? '' : value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="自定义天气"
          className="text-sm px-3 py-1.5 rounded-btn border focus:outline-none focus:ring-2 focus:ring-primary/30 w-32"
          style={{ background: 'var(--bg-card-solid)', color: 'var(--text-primary)', borderColor: 'var(--glass-border)' }}
        />
      )}

      {/* 当前选中标签 */}
      {value && !customMode && (
        <span className="text-xs text-text-muted ml-1">
          {isPreset ? WEATHER_OPTIONS.find((w) => w.key === value)?.label : value}
        </span>
      )}
    </div>
  );
}
