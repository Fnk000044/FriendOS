import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '../i18n/useLanguage';
import type { Lang } from '../i18n/translations';

interface WelcomePageProps {
  onComplete: () => void;
}

export default function WelcomePage({ onComplete }: WelcomePageProps) {
  const { setLang } = useLanguage();
  const [selected, setSelected] = useState<Lang>('zh-CN');

  const handleStart = () => {
    setLang(selected);
    onComplete();
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
        </div>

        {/* Language Selection */}
        <div className="glass-card glass-glow rounded-2xl shadow-card p-6 mb-6">
          <h2 className="text-sm font-medium text-text-muted text-center mb-4">
            选择你的语言 / Choose Your Language
          </h2>

          <div className="space-y-3">
            <button
              onClick={() => setSelected('zh-CN')}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
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
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
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

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full py-3.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-all active:scale-[0.98]"
        >
          开始使用 / Get Started
        </button>

        <p className="text-center text-xs text-text-muted mt-6">
          所有数据本地存储 · 不上传任何服务器
        </p>
      </div>
    </div>
  );
}
