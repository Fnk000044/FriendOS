import { useState, useEffect } from 'react';
import { Bot, MessageCircle, Sparkles } from 'lucide-react';
import { useAIStore } from '../../stores/aiStore';
import { useLanguage } from '../../i18n/useLanguage';
import type { ToneType, ProviderType, OnlineProvider } from '../../services/ai/types';
import Modal from '../common/Modal';
import Input from '../common/Input';
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
  const [aiApiKey, setAIApiKey] = useState(aiConfig.apiKey);
  const [showOnlineDialog, setShowOnlineDialog] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  // 从 Electron 加密存储加载 API Key
  useEffect(() => {
    setAITone(aiConfig.tone);
    if (open && window.electronAPI?.apiKeyGet) {
      window.electronAPI.apiKeyGet('deepseek').then((key) => {
        if (key) {
          setAIApiKey(key);
          setConfig({ apiKey: key });
        }
      });
    }
  }, [aiConfig.tone, open, setConfig]);

  useEffect(() => {
    setConfig({ tone: aiTone });
  }, [aiTone, setConfig]);

  // API Key 保存到 Electron 加密存储（不存入 localStorage）
  const handleApiKeyChange = (key: string) => {
    setAIApiKey(key);
    setConfig({ apiKey: key });
    if (window.electronAPI?.apiKeySet) {
      window.electronAPI.apiKeySet('deepseek', key);
    }
    // 同步到情感分析服务
    if (key && window.electronAPI?.sentimentSetApiKey) {
      window.electronAPI.sentimentSetApiKey(key);
    }
  };

  const handleOnlineDialogConfirm = () => {
    handleApiKeyChange(tempApiKey);
    setConfig({ provider: 'online' });
    setShowOnlineDialog(false);
  };

  const handleOnlineDialogCancel = () => {
    setShowOnlineDialog(false);
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={t('settings.ai')}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-text-muted mb-2 block">
              <MessageCircle className="w-3.5 h-3.5 inline mr-1" />
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
                  {tone === 'counselor' ? '🧠 心理咨询师' : t(`settings.ai_tone_${tone}` as any)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted mb-2 block">
              <Sparkles className="w-3.5 h-3.5 inline mr-1" />
              AI 模式
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setConfig({ provider: 'online' })}
                className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                  aiConfig.provider === 'online'
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'text-text-muted hover:border-slate-300'
                }`}
                style={aiConfig.provider === 'online' ? undefined : { borderColor: 'var(--glass-border)' }}
              >
                ☁️ 在线模式
              </button>
              <button
                onClick={() => setConfig({ provider: 'local' })}
                className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                  aiConfig.provider === 'local'
                    ? 'border-green-500 bg-green-50 text-green-700 font-medium'
                    : 'text-text-muted hover:border-slate-300'
                }`}
                style={aiConfig.provider === 'local' ? undefined : { borderColor: 'var(--glass-border)' }}
              >
                💻 离线模式 (Qwen3)
              </button>
            </div>
          </div>

          {aiConfig.provider === 'online' && (
            <div>
              <Input
                label={t('settings.ai_api_key')}
                type="password"
                value={aiApiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder={t('settings.ai_api_key_placeholder')}
              />
            </div>
          )}

          {aiConfig.provider === 'local' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-700">
                💻 离线模式：使用本地 Qwen3-0.6B 模型，无需网络，数据不出设备。首次加载约需 3-5 秒。
              </p>
            </div>
          )}

          <div className="text-[10px] text-text-muted border-t pt-3" style={{ borderColor: 'var(--glass-border)' }}>
            ☁️ 在线模式：需配置 API KEY，连接 DeepSeek API<br/>
            💻 离线模式：使用本地模型，无需网络，保护隐私
          </div>
        </div>
      </Modal>

      <Modal
        open={showOnlineDialog}
        onClose={handleOnlineDialogCancel}
        title={t('settings.online_model_title')}
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">{t('settings.online_model_desc')}</p>

          <div>
            <label className="text-xs font-medium text-text-muted mb-2 block">
              {t('settings.online_provider')}
            </label>
            <div className="flex gap-2">
              {(['deepseek'] as OnlineProvider[]).map((p) => (
                <button
                  key={p}
                  className="px-4 py-2 text-sm rounded-lg border border-primary bg-primary/10 text-primary font-medium"
                >
                  {p === 'deepseek' ? 'DeepSeek' : p}
                </button>
              ))}
            </div>
          </div>

          <Input
            label={t('settings.ai_api_key')}
            type="password"
            value={tempApiKey}
            onChange={(e) => setTempApiKey(e.target.value)}
            placeholder={t('settings.ai_api_key_placeholder')}
          />

          <p className="text-xs text-text-muted">
            {t('settings.online_model_hint')}
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={handleOnlineDialogCancel}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleOnlineDialogConfirm} disabled={!tempApiKey.trim()}>
              {t('common.confirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
