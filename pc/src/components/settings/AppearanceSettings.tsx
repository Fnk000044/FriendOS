import { Check, Palette, Type, Droplet, Zap } from 'lucide-react';
import Card from '../common/Card';
import Switch from '../common/Switch';
import { useLanguage } from '../../i18n/useLanguage';
import {
  useAppearanceStore,
  ACCENT_PRESETS,
  type AccentColor,
  type FontScale,
} from '../../stores/useAppearanceStore';

const ACCENTS: AccentColor[] = ['teal', 'purple', 'blue', 'pink', 'orange', 'slate'];
const FONT_SCALES: FontScale[] = ['small', 'normal', 'large', 'xlarge'];

export default function AppearanceSettings() {
  const { t } = useLanguage();
  const {
    accent, fontScale, reduceMotion,
    setAccent, setFontScale, setReduceMotion,
  } = useAppearanceStore();

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5 text-primary" />
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{t('appearance.title')}</h3>
          <p className="text-xs text-text-muted mt-0.5">{t('appearance.subtitle')}</p>
        </div>
      </div>

      {/* 强调色 */}
      <div className="mb-5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Droplet className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-xs font-medium text-text-secondary">{t('appearance.accent')}</span>
        </div>
        <p className="text-xs text-text-muted mb-2.5">{t('appearance.accent_desc')}</p>
        <div className="flex flex-wrap gap-2.5">
          {ACCENTS.map(c => {
            const preset = ACCENT_PRESETS[c];
            const active = accent === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setAccent(c)}
                aria-pressed={active}
                aria-label={t(`appearance.color_${c}` as any)}
                className={`relative w-9 h-9 rounded-full transition-all cursor-pointer ${
                  active ? 'ring-2 ring-offset-2 ring-offset-transparent scale-105' : 'hover:scale-105'
                }`}
                style={{
                  background: preset.gradient,
                  // @ts-expect-error CSS var
                  '--tw-ring-color': preset.primary,
                }}
              >
                {active && (
                  <Check className="absolute inset-0 m-auto w-4 h-4 text-white" strokeWidth={3} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 字号缩放 */}
      <div className="mb-5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Type className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-xs font-medium text-text-secondary">{t('appearance.font_scale')}</span>
        </div>
        <p className="text-xs text-text-muted mb-2.5">{t('appearance.font_scale_desc')}</p>
        <div className="flex gap-2 mb-2.5">
          {FONT_SCALES.map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFontScale(f)}
              aria-pressed={fontScale === f}
              className={`flex-1 px-3 py-1.5 text-xs rounded-btn border transition-all cursor-pointer ${
                fontScale === f
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'text-text-muted hover:border-slate-300'
              }`}
              style={fontScale === f ? { borderColor: 'var(--color-primary)' } : { borderColor: 'var(--glass-border)' }}
            >
              {t(`appearance.font_${f}` as any)}
            </button>
          ))}
        </div>
        <div className="px-3 py-2 rounded-lg text-sm text-text-secondary" style={{ background: 'var(--bg-hover)' }}>
          {t('appearance.preview')}: 今天心情不错
        </div>
      </div>

      {/* 减少动效 */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-start gap-2">
          <Zap className="w-3.5 h-3.5 text-text-muted mt-0.5" />
          <div>
            <div className="text-xs font-medium text-text-secondary">{t('appearance.reduce_motion')}</div>
            <p className="text-xs text-text-muted mt-0.5">{t('appearance.reduce_motion_desc')}</p>
          </div>
        </div>
        <Switch
          checked={reduceMotion}
          onChange={setReduceMotion}
          ariaLabel={t('appearance.reduce_motion')}
        />
      </div>
    </Card>
  );
}
