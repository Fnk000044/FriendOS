import { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft, Check, Save } from 'lucide-react';
import {
  Wind, Frown, Flame, Ghost, EyeOff, HeartCrack,
  UserX, CloudRain, Zap, HelpCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../db';
import { getToday } from '../../utils/date';
import { useLanguage } from '../../i18n/useLanguage';
import type { TranslationKey } from '../../i18n/translations';
import { shouldReduceMotion } from '../../utils/reduceMotion';
import {
  type ThoughtRecordData,
  INITIAL_THOUGHT_RECORD_DATA,
  STEPS,
  DISTORTIONS,
  canProceedStep,
} from './thoughtRecordTypes';
import {
  Step0Situation, Step1AutomaticThought, Step2Emotions, Step3Evidence,
  Step4AlternativeThought, Step5Belief, Step6Experiment,
} from './steps/ThoughtRecordSteps';
<<<<<<< HEAD
import InterventionFeedback from '../common/InterventionFeedback';
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193

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

interface ThoughtRecordProps {
  onComplete?: () => void;
}

export default function ThoughtRecord({ onComplete }: ThoughtRecordProps) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [fadeClass, setFadeClass] = useState('opacity-100');
  const [saved, setSaved] = useState(false);
  const [data, setData] = useState<ThoughtRecordData>(INITIAL_THOUGHT_RECORD_DATA);
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
    // 减少动效：立即切换，不做淡入淡出，避免 200ms 等待
    if (shouldReduceMotion()) {
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

  const canProceed = () => canProceedStep(currentStep, data);

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

  const resetForm = () => {
    setSaved(false);
    setCurrentStep(0);
    setData(INITIAL_THOUGHT_RECORD_DATA);
    setSelectedDistortions([]);
  };

  const renderStep = () => {
    const commonProps = { data, update: updateData };
    switch (currentStep) {
      case 0: return <Step0Situation {...commonProps} />;
      case 1: return (
        <Step1AutomaticThought
          {...commonProps}
          distortions={DISTORTIONS}
          selectedDistortions={selectedDistortions}
          onToggleDistortion={toggleDistortion}
        />
      );
      case 2: return (
        <Step2Emotions
          {...commonProps}
          emotionOptions={EMOTION_OPTIONS}
          onToggleEmotion={toggleEmotion}
        />
      );
      case 3: return <Step3Evidence {...commonProps} />;
      case 4: return <Step4AlternativeThought {...commonProps} />;
      case 5: return <Step5Belief {...commonProps} />;
      case 6: return <Step6Experiment {...commonProps} />;
      default: return null;
    }
  };

  // 保存成功后的完成态视图
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
<<<<<<< HEAD
            <div className="mb-4 flex justify-center">
              <InterventionFeedback interventionType="thought_record" />
            </div>
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={resetForm}
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

  // 主流程视图：进度条 + 当前步骤内容 + 上一步/下一步按钮
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
