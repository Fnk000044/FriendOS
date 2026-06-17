import { useState } from 'react';

interface EmotionPickerProps {
  value?: Record<string, number>;
  onChange: (emotions: Record<string, number>) => void;
  compact?: boolean;
}

const EMOTIONS = [
  { key: 'joy', label: '开心', emoji: '😊', color: '#F59E0B' },
  { key: 'sadness', label: '难过', emoji: '😢', color: '#6366F1' },
  { key: 'anger', label: '生气', emoji: '😠', color: '#EF4444' },
  { key: 'fear', label: '焦虑', emoji: '😰', color: '#8B5CF6' },
  { key: 'surprise', label: '惊讶', emoji: '😲', color: '#F97316' },
  { key: 'calm', label: '平静', emoji: '😌', color: '#10B981' },
  { key: 'love', label: '感恩', emoji: '🥰', color: '#EC4899' },
  { key: 'tired', label: '疲惫', emoji: '😫', color: '#6B7280' },
];

const INTENSITY_LEVELS = [
  { value: 1, label: '轻微' },
  { value: 2, label: '明显' },
  { value: 3, label: '强烈' },
];

export default function EmotionPicker({ value = {}, onChange, compact = false }: EmotionPickerProps) {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);

  const handleToggle = (key: string) => {
    if (selectedEmotion === key) {
      setSelectedEmotion(null);
    } else {
      setSelectedEmotion(key);
      // If not yet selected, add with default intensity
      if (!(key in value)) {
        onChange({ ...value, [key]: 1 });
      }
    }
  };

  const handleIntensity = (key: string, intensity: number) => {
    onChange({ ...value, [key]: intensity });
  };

  const handleRemove = (key: string) => {
    const newValue = { ...value };
    delete newValue[key];
    onChange(newValue);
    if (selectedEmotion === key) {
      setSelectedEmotion(null);
    }
  };

  const selectedCount = Object.keys(value).length;

  return (
    <div className="space-y-3" role="group" aria-label="情绪选择器">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary" id="emotion-picker-label">
          {compact ? '情绪标签' : '多维情绪记录'}
        </span>
        {selectedCount > 0 && (
          <span className="text-xs text-text-muted" aria-live="polite">已选 {selectedCount} 项</span>
        )}
      </div>

      {/* Emotion grid */}
      <div className={`grid ${compact ? 'grid-cols-4' : 'grid-cols-4'} gap-2`} role="listbox" aria-label="情绪选项" aria-multiselectable="true">
        {EMOTIONS.map(emotion => {
          const isSelected = emotion.key in value;
          const isActive = selectedEmotion === emotion.key;

          return (
            <button
              key={emotion.key}
              type="button"
              onClick={() => handleToggle(emotion.key)}
              role="option"
              aria-selected={isSelected}
              aria-label={`${emotion.label}${isSelected ? `，强度 ${value[emotion.key]}` : ''}`}
              className={`relative flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-slate-300 hover:bg-slate-50'
              } ${isActive ? 'ring-2 ring-primary/30' : ''}`}
              style={isSelected ? undefined : { borderColor: 'var(--glass-border)' }}
            >
              <span className={compact ? 'text-lg' : 'text-xl'} aria-hidden="true">{emotion.emoji}</span>
              <span className="text-xs text-text-secondary">{emotion.label}</span>
              {isSelected && (
                <div
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center"
                  style={{ backgroundColor: emotion.color }}
                  aria-hidden="true"
                >
                  {value[emotion.key]}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Intensity selector for selected emotion */}
      {selectedEmotion && selectedEmotion in value && (
        <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--bg-hover)' }}>
          <span className="text-sm text-text-secondary">
            {EMOTIONS.find(e => e.key === selectedEmotion)?.emoji}
            {EMOTIONS.find(e => e.key === selectedEmotion)?.label}强度：
          </span>
          <div className="flex gap-1">
            {INTENSITY_LEVELS.map(level => (
              <button
                key={level.value}
                type="button"
                onClick={() => handleIntensity(selectedEmotion, level.value)}
                className={`px-2 py-1 rounded text-xs transition-all ${
                  value[selectedEmotion] === level.value
                    ? 'bg-primary text-white'
                    : 'border hover:border-primary/50'
                }`}
                style={value[selectedEmotion] === level.value ? undefined : { borderColor: 'var(--glass-border)' }}
              >
                {level.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => handleRemove(selectedEmotion)}
            className="ml-auto text-xs text-red-400 hover:text-red-600"
          >
            移除
          </button>
        </div>
      )}

      {/* Selected emotions summary */}
      {selectedCount > 0 && !compact && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(value).map(([key, intensity]) => {
            const emotion = EMOTIONS.find(e => e.key === key);
            if (!emotion) return null;
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                style={{ backgroundColor: `${emotion.color}15`, color: emotion.color }}
              >
                {emotion.emoji} {emotion.label}
                {intensity > 1 && ` ×${intensity}`}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

