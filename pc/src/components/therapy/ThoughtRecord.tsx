import { useState, useEffect, useRef } from 'react';
import {
  ArrowRight, ArrowLeft, Check, Save,
  Wind, Frown, Flame, Ghost, EyeOff, HeartCrack,
  UserX, CloudRain, Zap, HelpCircle, Lightbulb,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../db';
import { getToday } from '../../utils/date';
import { useLanguage } from '../../i18n/useLanguage';
import type { TranslationKey } from '../../i18n/translations';

interface ThoughtRecordData {
  situation: string;
  automaticThought: string;
  emotions: string[];
  emotionIntensity: number;
  evidenceFor: string;
  evidenceAgainst: string;
  alternativeThought: string;
  newEmotionIntensity: number;
  alternativeBelief: number; // 替代思维信念度（0-100%）
  behaviorExperiment: string; // 行为实验计划
  followUpEmotion: number; // 后续情绪评分
}

// CBT思维记录完整流程（7步）
const STEPS: { titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { titleKey: 'therapy.tr_step0_title', descKey: 'therapy.tr_step0_desc' },
  { titleKey: 'therapy.tr_step1_title', descKey: 'therapy.tr_step1_desc' },
  { titleKey: 'therapy.tr_step2_title', descKey: 'therapy.tr_step2_desc' },
  { titleKey: 'therapy.tr_step3_title', descKey: 'therapy.tr_step3_desc' },
  { titleKey: 'therapy.tr_step4_title', descKey: 'therapy.tr_step4_desc' },
  { titleKey: 'therapy.tr_step5_title', descKey: 'therapy.tr_step5_desc' },
  { titleKey: 'therapy.tr_step6_title', descKey: 'therapy.tr_step6_desc' },
];

// 情绪选项：用 SVG 图标替代 emoji，避免平台渲染不一致
const EMOTION_OPTIONS: { labelKey: TranslationKey; Icon: LucideIcon }[] = [
  { labelKey: 'therapy.tr_emotion_anxiety', Icon: Wind },
  { labelKey: 'therapy.tr_emotion_sadness', Icon: Frown },
  { labelKey: 'therapy.tr_emotion_anger', Icon: Flame },
  { labelKey: 'therapy.tr_emotion_fear', Icon: Ghost },
  { labelKey: 'therapy.tr_emotion_shame', Icon: EyeOff },
  { labelKey: 'therapy.tr_emotion_guilt', Icon: HeartCrack },
  { labelKey: 'therapy.tr_emotion_loneliness', Icon: UserX },
  { labelKey: 'therapy.tr_emotion_despair', Icon: CloudRain },
  { labelKey: 'therapy.tr_emotion_irritation', Icon: Zap },
  { labelKey: 'therapy.tr_emotion_confusion', Icon: HelpCircle },
];

// CBT认知扭曲列表（扩展到15种）
// 参考：Burns, 1980, Feeling Good
const DISTORTIONS: TranslationKey[] = [
  'therapy.tr_dist_catastrophizing',
  'therapy.tr_dist_all_or_nothing',
  'therapy.tr_dist_overgeneralization',
  'therapy.tr_dist_mind_reading',
  'therapy.tr_dist_should',
  'therapy.tr_dist_emotional_reasoning',
  'therapy.tr_dist_selective_abstraction',
  'therapy.tr_dist_labeling',
  'therapy.tr_dist_disqualifying_positive',
  'therapy.tr_dist_magnification',
  'therapy.tr_dist_personalization',
  'therapy.tr_dist_blaming',
  'therapy.tr_dist_unfair_comparison',
  'therapy.tr_dist_regret',
  'therapy.tr_dist_pessimistic_prediction',
];

interface ThoughtRecordProps {
  onComplete?: () => void;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function ThoughtRecord({ onComplete }: ThoughtRecordProps) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [fadeClass, setFadeClass] = useState('opacity-100');
  const [saved, setSaved] = useState(false);
  const [data, setData] = useState<ThoughtRecordData>({
    situation: '',
    automaticThought: '',
    emotions: [],
    emotionIntensity: 50,
    evidenceFor: '',
    evidenceAgainst: '',
    alternativeThought: '',
    newEmotionIntensity: 30,
    alternativeBelief: 50,
    behaviorExperiment: '',
    followUpEmotion: 30,
  });
  const [selectedDistortions, setSelectedDistortions] = useState<string[]>([]);
  // 跟踪步骤切换动画的句柄，组件卸载时清理避免 setState-after-unmount
  const stepAnimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepAnimRafRef = useRef<number | null>(null);
  // 步骤标题引用，用于步骤切换后移动焦点
  const stepTitleRef = useRef<HTMLHeadingElement>(null);

  // 组件卸载时清理所有挂起的动画句柄
  useEffect(() => {
    return () => {
      if (stepAnimTimerRef.current) {
        clearTimeout(stepAnimTimerRef.current);
        stepAnimTimerRef.current = null;
      }
      if (stepAnimRafRef.current) {
        cancelAnimationFrame(stepAnimRafRef.current);
        stepAnimRafRef.current = null;
      }
    };
  }, []);

  const updateData = (field: keyof ThoughtRecordData, value: unknown) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const toggleEmotion = (emotion: string) => {
    setData(prev => ({
      ...prev,
      emotions: prev.emotions.includes(emotion)
        ? prev.emotions.filter(e => e !== emotion)
        : [...prev.emotions, emotion],
    }));
  };

  const toggleDistortion = (distortion: string) => {
    setSelectedDistortions(prev =>
      prev.includes(distortion)
        ? prev.filter(d => d !== distortion)
        : [...prev, distortion]
    );
  };

  const goToStep = (step: number) => {
    // reduced-motion：立即切换，不做淡入淡出，避免 200ms 等待
    if (prefersReducedMotion()) {
      setCurrentStep(step);
      // 移动焦点到步骤标题，让屏幕阅读器播报新步骤
      setTimeout(() => stepTitleRef.current?.focus(), 0);
      return;
    }

    // 设置淡出状态
    setFadeClass('opacity-0 translate-x-2');

    // 清理上一次未完成的动画句柄
    if (stepAnimTimerRef.current) {
      clearTimeout(stepAnimTimerRef.current);
      stepAnimTimerRef.current = null;
    }

    // 使用requestAnimationFrame等待transition完成
    stepAnimRafRef.current = requestAnimationFrame(() => {
      stepAnimRafRef.current = null;
      stepAnimTimerRef.current = setTimeout(() => {
        stepAnimTimerRef.current = null;
        setCurrentStep(step);
        setFadeClass('opacity-100 translate-x-0');
        // 动画完成后移动焦点到步骤标题
        setTimeout(() => stepTitleRef.current?.focus(), 0);
      }, 200); // 匹配CSS transition duration
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return data.situation.trim().length > 0;
      case 1: return data.automaticThought.trim().length > 0;
      case 2: return data.emotions.length > 0;
      case 3: return data.evidenceFor.trim().length > 0 || data.evidenceAgainst.trim().length > 0;
      case 4: return data.alternativeThought.trim().length > 0;
      case 5: return true; // 信念度总是有值
      case 6: return true; // 行为实验可选
      default: return false;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await db.therapyRecords.add({
        id: crypto.randomUUID(),
        type: 'thought_record',
        date: getToday(),
        data: {
          ...data,
          distortions: selectedDistortions,
        },
        moodBefore: data.emotionIntensity,
        moodAfter: data.newEmotionIntensity,
        createdAt: new Date().toISOString(),
      });
      setSaved(true);
    } catch (err) {
      console.error('Failed to save thought record:', err);
      toast.error(t('common.save_fail'));
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t('therapy.tr_step0_hint')}
            </p>
            <div>
              <label htmlFor="tr-situation" className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">
                {t('therapy.tr_step0_label')}
              </label>
              <textarea
                id="tr-situation"
                value={data.situation}
                onChange={(e) => updateData('situation', e.target.value)}
                placeholder={t('therapy.tr_step0_ph')}
                className="w-full h-32 p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                style={{ borderColor: 'var(--glass-border)' }}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t('therapy.tr_step1_hint')}
            </p>
            <div>
              <label htmlFor="tr-auto-thought" className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">
                {t('therapy.tr_step1_label')}
              </label>
              <textarea
                id="tr-auto-thought"
                value={data.automaticThought}
                onChange={(e) => updateData('automaticThought', e.target.value)}
                placeholder={t('therapy.tr_step1_ph')}
                className="w-full h-32 p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                style={{ borderColor: 'var(--glass-border)' }}
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{t('therapy.tr_step1_distortion_hint')}</p>
              <div className="flex flex-wrap gap-2">
                {DISTORTIONS.map(d => {
                  const label = t(d).split('：')[0];
                  const pressed = selectedDistortions.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDistortion(d)}
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

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t('therapy.tr_step2_hint')}
            </p>
            <div className="flex flex-wrap gap-2">
              {EMOTION_OPTIONS.map(({ labelKey, Icon }) => {
                const label = t(labelKey);
                const pressed = data.emotions.includes(label);
                return (
                  <button
                    key={labelKey}
                    type="button"
                    onClick={() => toggleEmotion(label)}
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
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-300">{t('therapy.tr_step2_intensity')}</span>
                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{data.emotionIntensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={data.emotionIntensity}
                onChange={(e) => updateData('emotionIntensity', parseInt(e.target.value))}
                aria-label={t('therapy.tr_step2_intensity')}
                aria-valuetext={`${data.emotionIntensity}%`}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
                <span>{t('therapy.tr_step2_intensity_min')}</span>
                <span>{t('therapy.tr_step2_intensity_max')}</span>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t('therapy.tr_step3_hint')}
            </p>
            <div>
              <label htmlFor="tr-evidence-for" className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">
                {t('therapy.tr_step3_for_label')}
              </label>
              <textarea
                id="tr-evidence-for"
                value={data.evidenceFor}
                onChange={(e) => updateData('evidenceFor', e.target.value)}
                placeholder={t('therapy.tr_step3_for_ph')}
                className="w-full h-24 p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                style={{ borderColor: 'var(--glass-border)' }}
              />
            </div>
            <div>
              <label htmlFor="tr-evidence-against" className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">
                {t('therapy.tr_step3_against_label')}
              </label>
              <textarea
                id="tr-evidence-against"
                value={data.evidenceAgainst}
                onChange={(e) => updateData('evidenceAgainst', e.target.value)}
                placeholder={t('therapy.tr_step3_against_ph')}
                className="w-full h-24 p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                style={{ borderColor: 'var(--glass-border)' }}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t('therapy.tr_step4_hint')}
            </p>
            <div>
              <label htmlFor="tr-alt-thought" className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">
                {t('therapy.tr_step4_label')}
              </label>
              <textarea
                id="tr-alt-thought"
                value={data.alternativeThought}
                onChange={(e) => updateData('alternativeThought', e.target.value)}
                placeholder={t('therapy.tr_step4_ph')}
                className="w-full h-32 p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                style={{ borderColor: 'var(--glass-border)' }}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-300">{t('therapy.tr_step4_new_intensity')}</span>
                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{data.newEmotionIntensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={data.newEmotionIntensity}
                onChange={(e) => updateData('newEmotionIntensity', parseInt(e.target.value))}
                aria-label={t('therapy.tr_step4_new_intensity')}
                aria-valuetext={`${data.newEmotionIntensity}%`}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
                <span>{t('therapy.tr_step2_intensity_min')}</span>
                <span>{t('therapy.tr_step2_intensity_max')}</span>
              </div>
            </div>
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

      case 5:
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t('therapy.tr_step5_hint')}
            </p>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-300">{t('therapy.tr_step5_belief')}</span>
                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{data.alternativeBelief}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={data.alternativeBelief}
                onChange={(e) => updateData('alternativeBelief', parseInt(e.target.value))}
                aria-label={t('therapy.tr_step5_belief')}
                aria-valuetext={`${data.alternativeBelief}%`}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
                <span>{t('therapy.tr_step5_belief_min')}</span>
                <span>{t('therapy.tr_step5_belief_max')}</span>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {t('therapy.tr_step5_infobox')}
              </p>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t('therapy.tr_step6_hint')}
            </p>
            <div>
              <label htmlFor="tr-experiment" className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">
                {t('therapy.tr_step6_label')}
              </label>
              <textarea
                id="tr-experiment"
                value={data.behaviorExperiment}
                onChange={(e) => updateData('behaviorExperiment', e.target.value)}
                placeholder={t('therapy.tr_step6_ph')}
                className="w-full h-32 p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                style={{ borderColor: 'var(--glass-border)' }}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-300">{t('therapy.tr_step6_followup')}</span>
                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{data.followUpEmotion}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={data.followUpEmotion}
                onChange={(e) => updateData('followUpEmotion', parseInt(e.target.value))}
                aria-label={t('therapy.tr_step6_followup')}
                aria-valuetext={`${data.followUpEmotion}%`}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
                <span>{t('therapy.tr_step6_followup_min')}</span>
                <span>{t('therapy.tr_step6_followup_max')}</span>
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {t('therapy.tr_step6_infobox')}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (saved) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="glass-card glass-glow rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-primary-dark px-6 py-4">
            <h2 className="text-white font-bold text-lg">{t('therapy.tr_title')}</h2>
            <p className="text-white/80 text-sm mt-1">{t('therapy.tr_saved_subtitle')}</p>
          </div>
          <div className="px-6 py-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{t('therapy.tr_saved_title')}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              {t('therapy.tr_saved_desc', { before: data.emotionIntensity, after: data.newEmotionIntensity })}
              {data.newEmotionIntensity < data.emotionIntensity && (
                <span className="text-green-600 dark:text-green-400">
                  {t('therapy.tr_saved_decreased', { diff: data.emotionIntensity - data.newEmotionIntensity })}
                </span>
              )}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => {
                  setSaved(false);
                  setCurrentStep(0);
                  setData({
                    situation: '',
                    automaticThought: '',
                    emotions: [],
                    emotionIntensity: 50,
                    evidenceFor: '',
                    evidenceAgainst: '',
                    alternativeThought: '',
                    newEmotionIntensity: 30,
                    alternativeBelief: 50,
                    behaviorExperiment: '',
                    followUpEmotion: 30,
                  });
                  setSelectedDistortions([]);
                }}
                className="px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg cursor-pointer transition-colors"
              >
                {t('therapy.tr_write_another')}
              </button>
              <button
                type="button"
                onClick={onComplete}
                className="px-4 py-2 text-sm bg-primary text-white rounded-btn hover:opacity-90 cursor-pointer transition-opacity"
              >
                {t('therapy.tr_back')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="glass-card glass-glow rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary-dark px-6 py-4">
            <h2 className="text-white font-bold text-lg">{t('therapy.tr_title')}</h2>
            <p className="text-white/80 text-sm mt-1">{t('therapy.tr_subtitle')}</p>
          </div>

          {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i < currentStep ? 'bg-primary text-white' :
                  i === currentStep ? 'bg-primary/10 text-primary ring-2 ring-primary dark:bg-primary/20 dark:text-primary' :
                  'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                }`}>
                  {i < currentStep ? <Check className="w-4 h-4" aria-hidden="true" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 ${
                    i < currentStep ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mb-4">
            <h3
              ref={stepTitleRef}
              tabIndex={-1}
              className="font-medium text-slate-800 dark:text-slate-100 outline-none focus:outline-none"
            >
              {t(STEPS[currentStep].titleKey)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t(STEPS[currentStep].descKey)}</p>
          </div>
        </div>

        {/* Content */}
        <div className={`px-6 pb-4 transition-all duration-200 ease-in-out ${fadeClass}`}>
          {renderStep()}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t flex justify-between" style={{ background: 'var(--bg-hover)', borderColor: 'var(--glass-border)' }}>
          <button
            type="button"
            onClick={() => goToStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentStep === 0
                ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer'
            }`}
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {t('therapy.tr_step_prev')}
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => goToStep(currentStep + 1)}
              disabled={!canProceed()}
              className={`flex items-center gap-1 px-4 py-2 rounded-btn text-sm font-medium transition-colors ${
                canProceed()
                  ? 'bg-primary text-white hover:opacity-90 cursor-pointer'
                  : 'bg-slate-200 text-slate-500 font-semibold cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'
              }`}
            >
              {t('therapy.tr_step_next')}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={!canProceed() || saving}
              className={`flex items-center gap-1 px-4 py-2 rounded-btn text-sm font-medium transition-colors ${
                canProceed() && !saving
                  ? 'bg-primary text-white hover:opacity-90 cursor-pointer'
                  : 'bg-slate-200 text-slate-500 font-semibold cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'
              }`}
            >
              <Save className="w-4 h-4" aria-hidden="true" />
              {saving ? t('therapy.tr_step_saving') : t('therapy.tr_step_save')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
