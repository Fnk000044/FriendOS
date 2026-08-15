import { useState } from 'react';
import { Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import { useAppLockStore } from '../../stores/appLockStore';
import Button from './Button';

/**
 * 应用锁设置（纯本地密码）
 *
 * PRD v3 P0-9：移除 Windows Hello（人脸/PIN）解锁选项——
 * 不再调用系统凭据验证，锁屏/自检不再弹出 Windows PIN 弹窗。
 */
export default function AppLockSettings() {
  const { enabled, passwordHash, setEnabled, setPassword } = useAppLockStore();
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleToggle = () => {
    if (!enabled && !passwordHash) {
      // First time enabling - show password setup
      setShowSetPassword(true);
    } else {
      setEnabled(!enabled);
    }
  };

  const handleSetPassword = async () => {
    if (newPassword.length < 4) {
      setError('密码至少需要 4 个字符');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    await setPassword(newPassword);
    setEnabled(true);
    setShowSetPassword(false);
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleResetPassword = () => {
    setShowSetPassword(true);
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold text-text-primary">应用锁</h3>
            <p className="text-xs text-text-muted">启动时需要密码验证</p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            enabled ? 'bg-primary' : 'bg-slate-300'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow transition-transform ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
            style={{ background: 'var(--bg-card-solid)' }}
          />
        </button>
      </div>

      {/* Password setup */}
      {showSetPassword && (
        <div className="space-y-3 p-3 rounded-lg" style={{ background: 'var(--bg-hover)' }}>
          <p className="text-sm text-text-secondary">设置应用锁密码：</p>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
              placeholder="新密码（至少4位）"
              className="w-full px-3 py-2 pr-10 rounded-lg border text-sm"
              style={{ borderColor: 'var(--glass-border)' }}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
            placeholder="确认密码"
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: 'var(--glass-border)' }}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowSetPassword(false)}>取消</Button>
            <Button size="sm" onClick={handleSetPassword}>确认设置</Button>
          </div>
        </div>
      )}

      {/* Status info */}
      {enabled && passwordHash && !showSetPassword && (
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Unlock className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-700 dark:text-green-300">应用锁已启用</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleResetPassword}>
            修改密码
          </Button>
        </div>
      )}

      <p className="text-xs text-text-muted">
        启用后，每次启动应用时需要输入密码才能使用。密码仅存储在本地。
      </p>
    </div>
  );
}
