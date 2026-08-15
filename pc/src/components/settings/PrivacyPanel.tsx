import { HardDrive, Lock, MapPin, WifiOff, KeyRound, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';
import Card from '../common/Card';

const ITEMS = [
  { key: 'privacy.local_only', descKey: 'privacy.local_only_desc', icon: HardDrive },
  { key: 'privacy.encryption', descKey: 'privacy.encryption_desc', icon: Lock },
  { key: 'privacy.storage_location', descKey: 'privacy.storage_location_desc', icon: MapPin },
  { key: 'privacy.no_network', descKey: 'privacy.no_network_desc', icon: WifiOff },
  { key: 'privacy.api_key_secure', descKey: 'privacy.api_key_secure_desc', icon: KeyRound },
] as const;

/**
 * PrivacyPanel — 隐私可见化面板（P1-2）
 *
 * 向用户/评委清晰展示：
 * - 数据只在本机（IndexedDB，不上传任何服务器）
 * - 敏感字段 AES-GCM 加密（PBKDF2 10 万次迭代派生密钥）
 * - 无网络外联声明（仅主动配置云 API Key 时才由主进程代理发送）
 * - API Key DPAPI / safeStorage 加密存储
 */
export default function PrivacyPanel() {
  const { t } = useLanguage();

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="w-5 h-5 text-primary" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-text-primary">{t('privacy.title')}</h3>
      </div>
      <p className="text-xs text-text-muted mb-4">{t('privacy.desc')}</p>
      <div className="space-y-3">
        {ITEMS.map(({ key, descKey, icon: Icon }) => (
          <div key={key} className="flex items-start gap-3 rounded-xl p-3 border" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-hover)' }}>
            <Icon className="w-4 h-4 text-text-secondary mt-0.5 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">{t(key)}</p>
              <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{t(descKey)}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
