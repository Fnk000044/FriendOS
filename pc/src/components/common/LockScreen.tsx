import { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useAppLockStore } from '../../stores/appLockStore';
import { useLanguage } from '../../i18n/useLanguage';
import Button from './Button';

export default function LockScreen() {
  const locked = useAppLockStore((s) => s.locked);
  const unlock = useAppLockStore((s) => s.unlock);
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (locked) {
      inputRef.current?.focus();
    }
  }, [locked]);

  if (!locked) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await unlock(password);
    if (!success) {
      setError(t('lock.error'));
      setShake(true);
      setPassword('');
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
      <div
        className={`glass-card glass-glow rounded-2xl p-8 w-full max-w-sm shadow-2xl ${
          shake ? 'animate-[shake_0.5s_ease-in-out]' : ''
        }`}
        style={{
          animation: shake ? 'shake 0.5s ease-in-out' : undefined,
        }}
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-primary" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-text-primary">{t('lock.title')}</h2>
            <p className="text-sm text-text-muted mt-1">{t('lock.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder={t('lock.placeholder')}
                className={`w-full px-4 py-3 pr-10 rounded-xl border text-center text-lg tracking-wider ${
                  error ? 'border-red-300 bg-red-50' : ''
                }`}
                style={error ? undefined : { borderColor: 'var(--glass-border)' }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full">
              {t('lock.unlock')}
            </Button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
