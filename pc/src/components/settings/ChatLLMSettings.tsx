import { useState, useEffect, useCallback } from 'react';
import { Cloud, KeyRound, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Card from '../common/Card';
import { useLanguage } from '../../i18n/useLanguage';

/**
 * 对话 LLM 配置区块（PRD v3 P1-17：仅 DeepSeek + 模型名自填；P1-18：API 有效 → 自检同步更新）
 * - API Key 输入（走 apiKeySet('chat_llm', ...)，DPAPI 加密）
 * - 模型名自填（apiKeySet('chat_llm_model', ...)，默认 deepseek-chat）
 * - 测试连接；保存/测试成功后派发 friendos:diag-refresh 事件，自检面板即时更新
 * - 未配置时使用离线陪伴模式
 */
export default function ChatLLMSettings() {
  const { t } = useLanguage();
  const [config, setConfig] = useState<ChatProviderConfig | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; latency?: number; model?: string; error?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const cfg = await window.electronAPI?.chatGetProviderConfig();
      if (cfg) {
        setConfig(cfg);
        setModelInput(cfg.model || 'deepseek-chat');
      }
    } catch (e) {
      console.error('[ChatLLMSettings] loadConfig error:', e);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  /** 通知自检面板刷新（保存/测试成功后同步更新 API Key 状态） */
  const notifyDiagRefresh = useCallback(() => {
    window.dispatchEvent(new CustomEvent('friendos:diag-refresh'));
  }, []);

  const handleSaveKey = async () => {
    if (!keyInput.trim()) return;
    setSaving(true);
    try {
      await window.electronAPI?.apiKeySet('chat_llm', keyInput.trim());
      setKeyInput('');
      await loadConfig();
      setTestResult(null);
      notifyDiagRefresh();
    } catch (e) {
      console.error('[ChatLLMSettings] save key error:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveModel = async () => {
    const model = modelInput.trim() || 'deepseek-chat';
    try {
      await window.electronAPI?.apiKeySet('chat_llm_model', model);
      await loadConfig();
      notifyDiagRefresh();
    } catch (e) {
      console.error('[ChatLLMSettings] save model error:', e);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await window.electronAPI?.chatTestConnection();
      if (result?.success) {
        setTestResult({ ok: true, latency: result.latency, model: result.model });
        notifyDiagRefresh();
      } else {
        setTestResult({ ok: false, error: result?.error || 'unknown' });
      }
    } catch (e: any) {
      setTestResult({ ok: false, error: e?.message || 'unknown' });
    } finally {
      setTesting(false);
    }
  };

  const hasKey = config?.hasKey;

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-1 flex items-center gap-2">
        <Cloud className="w-4 h-4" />
        {t('chat.settings_title')}
      </h3>
      <p className="text-xs text-text-muted mb-4">{t('chat.settings_desc')}</p>

      {/* Provider（仅 DeepSeek，展示状态） */}
      <label className="block text-xs font-medium text-text-secondary mb-1.5">
        {t('chat.provider')}
      </label>
      <div className="flex gap-2 mb-4">
        <span className="px-3 py-1.5 text-xs rounded-btn border border-primary bg-primary/10 text-primary font-medium">
          DeepSeek
        </span>
      </div>

      {/* 模型名自填 */}
      <label className="block text-xs font-medium text-text-secondary mb-1.5">
        {t('chat.model_name')}
      </label>
      <div className="flex gap-2 mb-4">
        <input
          value={modelInput}
          onChange={(e) => setModelInput(e.target.value)}
          placeholder="deepseek-chat"
          className="flex-1 px-3 py-2 text-xs rounded-btn border outline-none focus:border-primary"
          style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-input)' }}
          aria-label={t('chat.model_name')}
        />
        <button
          type="button"
          onClick={handleSaveModel}
          className="px-3 py-2 text-xs text-white rounded-btn"
          style={{ background: 'var(--gradient-primary)' }}
        >
          {t('chat.save_model')}
        </button>
      </div>

      {/* API Key */}
      <label className="block text-xs font-medium text-text-secondary mb-1.5">
        {t('chat.api_key')} {hasKey && <span className="text-green-500 ml-1">●{t('chat.no_key').replace('未配置', '已配置')}</span>}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" aria-hidden="true" />
          <input
            type={showKey ? 'text' : 'password'}
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder={hasKey ? '••••••••（已配置，输入新值替换）' : t('chat.api_key_placeholder')}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-btn border outline-none focus:border-primary"
            style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-input)' }}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="px-2.5 text-xs text-text-muted border rounded-btn hover:text-text-primary"
          style={{ borderColor: 'var(--glass-border)' }}
        >
          {showKey ? '隐藏' : '显示'}
        </button>
        <button
          type="button"
          onClick={handleSaveKey}
          disabled={!keyInput.trim() || saving}
          className="px-3 py-2 text-xs text-white rounded-btn disabled:opacity-40"
          style={{ background: 'var(--gradient-primary)' }}
        >
          {saving ? '…' : t('chat.save_key')}
        </button>
      </div>

      {/* 测试连接 */}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleTest}
          disabled={!hasKey || testing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-btn border hover:bg-[var(--bg-hover)] disabled:opacity-40"
          style={{ borderColor: 'var(--glass-border)' }}
        >
          {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Cloud className="w-3.5 h-3.5" aria-hidden="true" />}
          {testing ? t('chat.testing') : t('chat.test_connection')}
        </button>

        {testResult?.ok && (
          <span className="flex items-center gap-1 text-xs text-green-500">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            {t('chat.test_success', { latency: testResult.latency ?? 0, model: testResult.model ?? '' })}
          </span>
        )}
        {testResult && !testResult.ok && (
          <span className="flex items-center gap-1 text-xs text-red-500">
            <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
            {t('chat.test_fail', { error: testResult.error ?? '' })}
          </span>
        )}
      </div>

      {!hasKey && (
        <p className="mt-3 text-xs text-text-muted">
          ⓘ {t('chat.settings_desc')}
        </p>
      )}
    </Card>
  );
}
