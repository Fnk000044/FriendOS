import { useState } from 'react';
import { Sparkles, Shield, Lock, Heart } from 'lucide-react';
import { useLanguage } from '../i18n/useLanguage';
import type { Lang } from '../i18n/translations';

interface WelcomePageProps {
  onComplete: () => void;
}

export default function WelcomePage({ onComplete }: WelcomePageProps) {
  const { setLang } = useLanguage();
  const [selected, setSelected] = useState<Lang>('zh-CN');
  const [step, setStep] = useState<'language' | 'privacy'>('language');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [healthDisclaimer, setHealthDisclaimer] = useState(false);

  const handleNext = () => {
    if (step === 'language') {
      setStep('privacy');
    }
  };

  const handleStart = () => {
    if (privacyConsent && healthDisclaimer) {
      setLang(selected);
      localStorage.setItem('friendos_privacy_consent', 'true');
      onComplete();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">知己</h1>
          <p className="text-sm text-text-muted mt-1">AI心理健康陪伴与早期风险识别助手</p>
        </div>

        {step === 'language' ? (
          /* Step 1: Language Selection */
          <>
            <div className="glass-card glass-glow rounded-2xl shadow-card p-6 mb-6">
              <h2 className="text-sm font-medium text-text-muted text-center mb-4">
                选择你的语言 / Choose Your Language
              </h2>

              <div className="space-y-3">
                <button
                  onClick={() => setSelected('zh-CN')}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left cursor-pointer ${
                    selected === 'zh-CN'
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-slate-300'
                  }`}
                  style={selected === 'zh-CN' ? undefined : { borderColor: 'var(--glass-border)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇨🇳</span>
                    <div>
                      <p className="font-medium text-text-primary">中文</p>
                      <p className="text-xs text-text-muted mt-0.5">中文界面，适合中文用户</p>
                    </div>
                    {selected === 'zh-CN' && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setSelected('en')}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left cursor-pointer ${
                    selected === 'en'
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-slate-300'
                  }`}
                  style={selected === 'en' ? undefined : { borderColor: 'var(--glass-border)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇺🇸</span>
                    <div>
                      <p className="font-medium text-text-primary">English</p>
                      <p className="text-xs text-text-muted mt-0.5">English interface for global users</p>
                    </div>
                    {selected === 'en' && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-3.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-all active:scale-[0.98] cursor-pointer"
            >
              下一步 / Next
            </button>
          </>
        ) : (
          /* Step 2: Privacy Consent */
          <>
            <div className="glass-card glass-glow rounded-2xl shadow-card p-6 mb-6 space-y-5">
              <h2 className="text-lg font-semibold text-text-primary text-center">
                隐私与安全
              </h2>

              {/* Data Privacy */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50 border border-green-100">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">数据本地存储</p>
                  <p className="text-xs text-green-600 mt-1">
                    所有数据（日记、聊天记录、评估结果）均存储在您的设备本地，不会上传到任何服务器。
                  </p>
                </div>
              </div>

              {/* Security */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">隐私保护</p>
                  <p className="text-xs text-blue-600 mt-1">
                    您可以随时导出或删除所有数据。应用不会收集任何个人信息。
                  </p>
                </div>
              </div>

              {/* Health Disclaimer */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-800">免责声明</p>
                  <p className="text-xs text-amber-600 mt-1">
                    本应用仅供辅助参考，不能替代专业心理咨询或医疗诊断。如有需要，请寻求专业帮助。
                  </p>
                </div>
              </div>

              {/* Consent Checkboxes */}
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyConsent}
                    onChange={(e) => setPrivacyConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text-primary">
                    我已阅读并同意数据本地存储和隐私保护政策
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={healthDisclaimer}
                    onChange={(e) => setHealthDisclaimer(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text-primary">
                    我了解本应用不替代专业心理咨询或医疗诊断
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('language')}
                className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-all cursor-pointer"
              >
                返回
              </button>
              <button
                onClick={handleStart}
                disabled={!privacyConsent || !healthDisclaimer}
                className="flex-1 py-3.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                开始使用
              </button>
            </div>
          </>
        )}

        <p className="text-center text-xs text-text-muted mt-6">
          所有数据本地存储 · 不上传任何服务器
        </p>
      </div>
    </div>
  );
}
