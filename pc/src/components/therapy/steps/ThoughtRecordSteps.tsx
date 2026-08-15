import { Lightbulb } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLanguage } from '../../../i18n/useLanguage';
import type { TranslationKey } from '../../../i18n/translations';
import type { ThoughtRecordData } from '../thoughtRecordTypes';

interface StepProps {
  data: ThoughtRecordData;
  update: (field: keyof ThoughtRecordData, value: unknown) => void;
}

const inputClass =
  'w-full p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100';

// 通用：渲染带 label 的 textarea
function LabeledTextarea({
  id, label, value, placeholder, onChange, rows = 4,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={inputClass}
        style={{ borderColor: 'var(--glass-border)' }}
      />
    </div>
  );
}

// 通用：渲染带 label 的 range slider
function LabeledRange({
  label, value, onChange, minLabel, maxLabel, ariaLabel,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  minLabel: string;
  maxLabel: string;
  ariaLabel: string;
}) {
  const { t } = useLanguage();
  void t; // 范围子组件目前不直接 t()，但保留入口避免未来再加
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{value}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        aria-label={ariaLabel}
        aria-valuetext={`${value}%`}
        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
      />
      <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

/** Step 0: 情境 */
export function Step0Situation({ data, update }: StepProps) {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">{t('therapy.tr_step0_hint')}</p>
      <LabeledTextarea
        id="tr-situation"
        label={t('therapy.tr_step0_label')}
        value={data.situation}
        placeholder={t('therapy.tr_step0_ph')}
        onChange={(v) => update('situation', v)}
        rows={4}
      />
    </div>
  );
}

/** Step 1: 自动思维 + 认知扭曲 */
export function Step1AutomaticThought({ data, update, distortions, selectedDistortions, onToggleDistortion }: StepProps & {
  distortions: TranslationKey[];
  selectedDistortions: string[];
  onToggleDistortion: (d: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">{t('therapy.tr_step1_hint')}</p>
      <LabeledTextarea
        id="tr-auto-thought"
        label={t('therapy.tr_step1_label')}
        value={data.automaticThought}
        placeholder={t('therapy.tr_step1_ph')}
        onChange={(v) => update('automaticThought', v)}
        rows={4}
      />
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{t('therapy.tr_step1_distortion_hint')}</p>
        <div className="flex flex-wrap gap-2">
          {distortions.map(d => {
            const label = t(d).split('：')[0];
            const pressed = selectedDistortions.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => onToggleDistortion(d)}
                aria-pressed={pressed}
                className={`px-2 py-1 text-xs rounded-full border transition-colors cursor-pointer ${
                  pressed
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-700'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                style={pressed ? undefined : { borderColor: 'var(--glass-border)' }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Step 2: 情绪选择 + 强度 */
export function Step2Emotions({ data, update, emotionOptions, onToggleEmotion }: StepProps & {
  emotionOptions: { labelKey: TranslationKey; Icon: LucideIcon }[];
  onToggleEmotion: (e: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">{t('therapy.tr_step2_hint')}</p>
      <div className="flex flex-wrap gap-2">
        {emotionOptions.map(({ labelKey, Icon }) => {
          const label = t(labelKey);
          const pressed = data.emotions.includes(label);
          return (
            <button
              key={labelKey}
              type="button"
              onClick={() => onToggleEmotion(label)}
              aria-pressed={pressed}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                pressed
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
              style={pressed ? undefined : { borderColor: 'var(--glass-border)' }}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm">{label}</span>
            </button>
          );
        })}
      </div>
      <LabeledRange
        label={t('therapy.tr_step2_intensity')}
        value={data.emotionIntensity}
        onChange={(v) => update('emotionIntensity', v)}
        minLabel={t('therapy.tr_step2_intensity_min')}
        maxLabel={t('therapy.tr_step2_intensity_max')}
        ariaLabel={t('therapy.tr_step2_intensity')}
      />
    </div>
  );
}

/** Step 3: 证据 for/against */
export function Step3Evidence({ data, update }: StepProps) {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">{t('therapy.tr_step3_hint')}</p>
      <LabeledTextarea
        id="tr-evidence-for"
        label={t('therapy.tr_step3_for_label')}
        value={data.evidenceFor}
        placeholder={t('therapy.tr_step3_for_ph')}
        onChange={(v) => update('evidenceFor', v)}
        rows={3}
      />
      <LabeledTextarea
        id="tr-evidence-against"
        label={t('therapy.tr_step3_against_label')}
        value={data.evidenceAgainst}
        placeholder={t('therapy.tr_step3_against_ph')}
        onChange={(v) => update('evidenceAgainst', v)}
        rows={3}
      />
    </div>
  );
}

/** Step 4: 替代思维 + 新情绪强度 */
export function Step4AlternativeThought({ data, update }: StepProps) {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">{t('therapy.tr_step4_hint')}</p>
      <LabeledTextarea
        id="tr-alt-thought"
        label={t('therapy.tr_step4_label')}
        value={data.alternativeThought}
        placeholder={t('therapy.tr_step4_ph')}
        onChange={(v) => update('alternativeThought', v)}
        rows={4}
      />
      <LabeledRange
        label={t('therapy.tr_step4_new_intensity')}
        value={data.newEmotionIntensity}
        onChange={(v) => update('newEmotionIntensity', v)}
        minLabel={t('therapy.tr_step2_intensity_min')}
        maxLabel={t('therapy.tr_step2_intensity_max')}
        ariaLabel={t('therapy.tr_step4_new_intensity')}
      />
      {data.newEmotionIntensity < data.emotionIntensity && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <p className="text-sm text-green-700 dark:text-green-300">
            {t('therapy.tr_step4_decreased_to', {
              before: data.emotionIntensity,
              after: data.newEmotionIntensity,
              diff: data.emotionIntensity - data.newEmotionIntensity,
            })}
          </p>
        </div>
      )}
    </div>
  );
}

/** Step 5: 替代思维信念度 */
export function Step5Belief({ data, update }: StepProps) {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">{t('therapy.tr_step5_hint')}</p>
      <LabeledRange
        label={t('therapy.tr_step5_belief')}
        value={data.alternativeBelief}
        onChange={(v) => update('alternativeBelief', v)}
        minLabel={t('therapy.tr_step5_belief_min')}
        maxLabel={t('therapy.tr_step5_belief_max')}
        ariaLabel={t('therapy.tr_step5_belief')}
      />
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-2">
        <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
        <p className="text-xs text-blue-700 dark:text-blue-300">{t('therapy.tr_step5_infobox')}</p>
      </div>
    </div>
  );
}

/** Step 6: 行为实验 + 后续情绪 */
export function Step6Experiment({ data, update }: StepProps) {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">{t('therapy.tr_step6_hint')}</p>
      <LabeledTextarea
        id="tr-experiment"
        label={t('therapy.tr_step6_label')}
        value={data.behaviorExperiment}
        placeholder={t('therapy.tr_step6_ph')}
        onChange={(v) => update('behaviorExperiment', v)}
        rows={4}
      />
      <LabeledRange
        label={t('therapy.tr_step6_followup')}
        value={data.followUpEmotion}
        onChange={(v) => update('followUpEmotion', v)}
        minLabel={t('therapy.tr_step6_followup_min')}
        maxLabel={t('therapy.tr_step6_followup_max')}
        ariaLabel={t('therapy.tr_step6_followup')}
      />
      <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
        <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
        <p className="text-xs text-amber-700 dark:text-amber-300">{t('therapy.tr_step6_infobox')}</p>
      </div>
    </div>
  );
}
