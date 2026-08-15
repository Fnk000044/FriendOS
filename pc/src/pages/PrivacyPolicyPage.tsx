import { FileText, ShieldCheck, Lock, Cpu, Cloud, Wifi, HeartHandshake, Trash2, Users, RefreshCw } from 'lucide-react';
import Card from '../components/common/Card';
import { useLanguage } from '../i18n/useLanguage';
import type { TranslationKey } from '../i18n/translations';

/**
 * PrivacyPolicyPage — 《隐私政策》正式页面（庆园杯对照检查 P0-5）
 *
 * 与 AboutPage 的摘要卡片不同，本页是完整的政策文本：
 * 覆盖数据收集范围、本地存储与加密、本地 AI 分析、可选云模型、
 * 局域网同步、危机干预与医疗免责、数据导出与删除、未成年人保护、
 * 政策更新与联系方式，符合《个人信息保护法》对敏感个人信息处理的告知要求。
 */

const SECTIONS: { icon: typeof FileText; titleKey: TranslationKey; bodyKey: TranslationKey }[] = [
  { icon: FileText, titleKey: 'privacy_policy.s1_title', bodyKey: 'privacy_policy.s1_body' },
  { icon: Cpu, titleKey: 'privacy_policy.s2_title', bodyKey: 'privacy_policy.s2_body' },
  { icon: Lock, titleKey: 'privacy_policy.s3_title', bodyKey: 'privacy_policy.s3_body' },
  { icon: Cpu, titleKey: 'privacy_policy.s4_title', bodyKey: 'privacy_policy.s4_body' },
  { icon: Cloud, titleKey: 'privacy_policy.s5_title', bodyKey: 'privacy_policy.s5_body' },
  { icon: Wifi, titleKey: 'privacy_policy.s6_title', bodyKey: 'privacy_policy.s6_body' },
  { icon: HeartHandshake, titleKey: 'privacy_policy.s7_title', bodyKey: 'privacy_policy.s7_body' },
  { icon: Trash2, titleKey: 'privacy_policy.s8_title', bodyKey: 'privacy_policy.s8_body' },
  { icon: Users, titleKey: 'privacy_policy.s9_title', bodyKey: 'privacy_policy.s9_body' },
  { icon: RefreshCw, titleKey: 'privacy_policy.s10_title', bodyKey: 'privacy_policy.s10_body' },
];

export default function PrivacyPolicyPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
          <ShieldCheck className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-bold text-text-primary">{t('privacy_policy.title')}</h2>
          <p className="text-xs text-text-muted">{t('privacy_policy.updated')}</p>
        </div>
      </div>

      <Card>
        <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{t('privacy_policy.intro')}</p>
      </Card>

      {SECTIONS.map(({ icon: Icon, titleKey, bodyKey }, i) => (
        <Card key={titleKey}>
          <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--bg-hover)' }}>
              <Icon className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            </span>
            {i + 1}. {t(titleKey)}
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{t(bodyKey)}</p>
        </Card>
      ))}
    </div>
  );
}
