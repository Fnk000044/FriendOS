import { HeartHandshake, ShieldCheck, HardDrive, Lock, WifiOff, KeyRound, MapPin, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import { useLanguage } from '../i18n/useLanguage';

/**
 * AboutPage — 关于板块（PRD v3 P1-20）
 * 与设置/习惯同级：隐私与数据安全 + 关于知己（版本/简介/伦理声明/心理援助热线）
 */
const PRIVACY_ITEMS = [
  { key: 'privacy.local_only', descKey: 'privacy.local_only_desc', icon: HardDrive },
  { key: 'privacy.encryption', descKey: 'privacy.encryption_desc', icon: Lock },
  { key: 'privacy.storage_location', descKey: 'privacy.storage_location_desc', icon: MapPin },
  { key: 'privacy.no_network', descKey: 'privacy.no_network_desc', icon: WifiOff },
  { key: 'privacy.api_key_secure', descKey: 'privacy.api_key_secure_desc', icon: KeyRound },
] as const;

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 max-w-2xl">
      <p className="text-text-muted">{t('nav.about')}</p>

      {/* 关于知己 */}
      <Card>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
            <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">{t('about.zhiyou')}</h3>
            <p className="text-xs text-text-muted">{t('about.tagline')}</p>
          </div>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">{t('about.intro')}</p>

        <div className="mt-4 pt-3 border-t space-y-2" style={{ borderColor: 'var(--glass-border)' }}>
          <p className="text-xs text-text-muted">
            {t('about.version')}: v0.0.5 · {t('about.tech_stack')}
          </p>
          <p className="text-xs text-text-muted flex items-start gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            {t('about.ethics')}
          </p>
        </div>
      </Card>

      {/* 心理援助热线（伦理恒显） */}
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 text-red-500" aria-hidden="true" />
          {t('about.helpline')}
        </h3>
        <p className="text-sm text-text-secondary mb-3">{t('about.helpline_desc')}</p>
        <div className="space-y-2">
          <p className="text-sm font-medium text-text-primary">
            {t('risk.hotline_label')}：<span className="font-semibold text-red-500">12356</span>
          </p>
          <p className="text-sm text-text-secondary">
            400-161-9995（全国心理援助）
          </p>
          <p className="text-xs text-text-muted mt-2">{t('about.not_medical')}</p>
        </div>
      </Card>

      {/* 隐私与数据安全 */}
      <Card>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-primary" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-text-primary">{t('privacy.title')}</h3>
        </div>
        <p className="text-xs text-text-muted mb-4">{t('privacy.desc')}</p>
        <div className="space-y-3">
          {PRIVACY_ITEMS.map(({ key, descKey, icon: Icon }) => (
            <div key={key} className="flex items-start gap-3 rounded-xl p-3 border" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-hover)' }}>
              <Icon className="w-4 h-4 text-text-secondary mt-0.5 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">{t(key)}</p>
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{t(descKey)}</p>
              </div>
            </div>
          ))}
          <Link to="/privacy" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            {t('nav.privacy_policy')} ↗
          </Link>
        </div>
      </Card>

      {/* 致谢与开源 */}
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-1">{t('about.credits')}</h3>
        <p className="text-xs text-text-muted">{t('about.credits_desc')}</p>
        <div className="flex items-center gap-3 mt-3">
          <a
            onClick={() => window.electronAPI?.openExternal('https://github.com/Fnk000044/FriendOS')}
            className="text-xs text-primary hover:underline cursor-pointer flex items-center gap-1"
          >
            GitHub 仓库 ↗
          </a>
        </div>
      </Card>
    </div>
  );
}
