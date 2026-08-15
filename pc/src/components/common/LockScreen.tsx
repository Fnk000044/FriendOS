<<<<<<< HEAD
import { useState, useRef } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
=======
import { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff, Fingerprint } from 'lucide-react';
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
import { useAppLockStore } from '../../stores/appLockStore';
import { useLanguage } from '../../i18n/useLanguage';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import Button from './Button';

<<<<<<< HEAD
/**
 * 锁屏（密码解锁）
 *
 * PRD v3 P0-9：移除 Windows Hello（人脸/PIN）验证——自检/锁屏不再弹出系统凭据弹窗。
 * 保留纯本地密码解锁，逻辑无任何系统级调用。
 */
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
export default function LockScreen() {
  const locked = useAppLockStore((s) => s.locked);
  const unlock = useAppLockStore((s) => s.unlock);
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
<<<<<<< HEAD
=======
  const [helloVerifying, setHelloVerifying] = useState(false);
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 焦点陷阱：锁屏期间焦点不逃逸到背后页面
  useFocusTrap(containerRef, locked);

<<<<<<< HEAD
=======
  // 是否启用 Windows Hello 解锁（从 localStorage 读取偏好）
  const helloEnabled = typeof localStorage !== 'undefined' && localStorage.getItem('friendos_hello_unlock') === 'true';

  useEffect(() => {
    if (locked) {
      inputRef.current?.focus();
      // 启用 Windows Hello 时自动触发验证
      if (helloEnabled && window.electronAPI?.windowsHelloVerify) {
        handleHelloUnlock();
      }
    }
  }, [locked]);

>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
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

<<<<<<< HEAD
=======
  const handleHelloUnlock = async () => {
    if (helloVerifying) return;
    setHelloVerifying(true);
    setError('');
    try {
      const result = await window.electronAPI?.windowsHelloVerify?.();
      if (result?.success) {
        // Windows Hello 验证成功，直接解锁（绕过密码）
        unlock('__windows_hello__');
      } else if (result?.error && result.error !== '用户取消') {
        setError(result.error);
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch (err: any) {
      setError(err?.message || 'Windows Hello 验证失败');
    } finally {
      setHelloVerifying(false);
    }
  };

>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
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
<<<<<<< HEAD
=======

          {/* Windows Hello 解锁按钮（仅在可用且用户启用时显示） */}
          {helloEnabled && window.electronAPI?.windowsHelloVerify && (
            <button
              type="button"
              onClick={handleHelloUnlock}
              disabled={helloVerifying}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-50 cursor-pointer"
              style={{ borderColor: 'var(--glass-border)' }}
            >
              <Fingerprint className={`w-5 h-5 text-primary ${helloVerifying ? 'animate-pulse' : ''}`} />
              {helloVerifying ? '正在验证...' : '使用 Windows Hello 解锁'}
            </button>
          )}
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
        </div>
      </div>
    </div>
  );
}
