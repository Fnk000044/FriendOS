import { useState, useRef } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useAppLockStore } from '../../stores/appLockStore';
import { useLanguage } from '../../i18n/useLanguage';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import Button from './Button';

/**
 * 锁屏（密码解锁）
 *
 * PRD v3 P0-9：移除 Windows Hello（人脸/PIN）验证——自检/锁屏不再弹出系统凭据弹窗。
 * 保留纯本地密码解锁，逻辑无任何系统级调用。
 */
export default function LockScreen() {
  const locked = useAppLockStore((s) => s.locked);
  const unlock = useAppLockStore((s) => s.unlock);
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 焦点陷阱：锁屏期间焦点不逃逸到背后页面
  useFocusTrap(containerRef, locked);

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
        ref={containerRef}
        className={`glass-card glass-glow rounded-2xl p-8 w-full max-w-sm shadow-2xl ${
          shake ? 'animate-shake' : ''
        }`}
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
                  error ? 'border-red-300 bg-red-50 dark:bg-red-900/30 dark:border-red-800' : ''
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
    </div>
  );
}
