import { useState, useEffect } from 'react';
import { Sparkles, Brain } from 'lucide-react';
import { useAIStore } from '../../stores/aiStore';
import { useLanguage } from '../../i18n/useLanguage';
import type { ToneType } from '../../services/ai/types';
import Modal from '../common/Modal';
import Button from '../common/Button';

interface AISettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AISettingsModal({ open, onClose }: AISettingsModalProps) {
  const { t } = useLanguage();
  const aiConfig = useAIStore((s) => s.config);
  const setConfig = useAIStore((s) => s.setConfig);

  const [aiTone, setAITone] = useState<ToneType>(aiConfig.tone);

  useEffect(() => {
    if (open) {
      setAITone(aiConfig.tone);
    }
  }, [open, aiConfig]);

  const handleSave = () => {
    setConfig({
      tone: aiTone,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('settings.ai')}
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        {/* 语气选择 */}
        <div>
          <label className="text-xs font-medium text-text-muted mb-2 block">
            {t('settings.ai_tone')}
          </label>
          <div className="flex flex-wrap gap-2">
            {(['professional', 'friendly', 'concise', 'encouraging', 'counselor'] as const).map((tone) => (
              <button
                key={tone}
                onClick={() => setAITone(tone)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                  aiTone === tone
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'text-text-muted hover:border-slate-300'
                }`}
                style={aiTone === tone ? undefined : { borderColor: 'var(--glass-border)' }}
              >
                {tone === 'counselor' ? <><Brain className="w-3 h-3 inline mr-1" />{t('settings.ai_tone_counselor')}</> : t(`settings.ai_tone_${tone}` as any)}
              </button>
            ))}
          </div>
        </div>

        {/* 模型状态提示 */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <p className="text-xs text-green-600 dark:text-green-400">
            <Sparkles className="w-3 h-3 inline mr-1" /> 使用本地 Qwen3.5-0.8B 模型，无需联网
          </p>
        </div>

        {/* 保存按钮 */}
        <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--glass-border)' }}>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave}>
            {t('common.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
