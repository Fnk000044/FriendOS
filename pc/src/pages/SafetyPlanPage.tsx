import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Pencil, Save, X, PhoneCall, Lightbulb, Heart, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../components/common/Card';
import { db } from '../db';
import { decryptField, encryptField } from '../db/crypto';
import type { SafetyPlan } from '../db/models';
import { useLanguage } from '../i18n/useLanguage';
import type { TranslationKey } from '../i18n/translations';

/**
 * SafetyPlanPage — 危机安全计划（SPI, Stanley & Brown 2012）
 *
 * 六步安全计划：①预警信号 ②自我应对 ③转移注意力 ④可信赖的人
 * ⑤专业求助资源 ⑥活下去的理由。全部字段 AES-GCM 加密落盘，
 * 单行存储（id='default'），危机弹窗与高风险卡片可跳转查看。
 */

const PLAN_FIELDS = [
  { field: 'warningSigns', icon: AlertTriangle, titleKey: 'safety_plan.step1_title', phKey: 'safety_plan.step1_ph', hintKey: 'safety_plan.step1_hint' },
  { field: 'copingStrategies', icon: Lightbulb, titleKey: 'safety_plan.step2_title', phKey: 'safety_plan.step2_ph', hintKey: 'safety_plan.step2_hint' },
  { field: 'distractionActivities', icon: Heart, titleKey: 'safety_plan.step3_title', phKey: 'safety_plan.step3_ph', hintKey: 'safety_plan.step3_hint' },
  { field: 'trustedContacts', icon: Heart, titleKey: 'safety_plan.step4_title', phKey: 'safety_plan.step4_ph', hintKey: 'safety_plan.step4_hint' },
  { field: 'professionalResources', icon: PhoneCall, titleKey: 'safety_plan.step5_title', phKey: 'safety_plan.step5_ph', hintKey: 'safety_plan.step5_hint' },
  { field: 'reasonsToLive', icon: Heart, titleKey: 'safety_plan.step6_title', phKey: 'safety_plan.step6_ph', hintKey: 'safety_plan.step6_hint' },
] as const;

type PlanField = (typeof PLAN_FIELDS)[number]['field'];
type PlanDraft = Record<PlanField, string>;

const EMPTY_DRAFT: PlanDraft = {
  warningSigns: '', copingStrategies: '', distractionActivities: '',
  trustedContacts: '', professionalResources: '', reasonsToLive: '',
};

export default function SafetyPlanPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<SafetyPlan | null>(null);
  const [draft, setDraft] = useState<PlanDraft>(EMPTY_DRAFT);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const row = await db.safetyPlans.get('default');
      if (!row) {
        setPlan(null);
        setDraft(EMPTY_DRAFT);
        return;
      }
      setPlan(row);
      setDraft({
        warningSigns: (await decryptField(row.warningSigns)) ?? '',
        copingStrategies: (await decryptField(row.copingStrategies)) ?? '',
        distractionActivities: (await decryptField(row.distractionActivities)) ?? '',
        trustedContacts: (await decryptField(row.trustedContacts)) ?? '',
        professionalResources: (await decryptField(row.professionalResources)) ?? '',
        reasonsToLive: (await decryptField(row.reasonsToLive)) ?? '',
      });
    } catch (err) {
      console.error('[SafetyPlan] load failed:', err);
      toast.error(t('safety_plan.load_fail'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  const handleSave = useCallback(async () => {
    try {
      const existing = await db.safetyPlans.get('default');
      const now = new Date().toISOString();
      const row: SafetyPlan = {
        id: 'default',
        version: (existing?.version ?? 0) + 1,
        warningSigns: (await encryptField(draft.warningSigns)) ?? '',
        copingStrategies: (await encryptField(draft.copingStrategies)) ?? '',
        distractionActivities: (await encryptField(draft.distractionActivities)) ?? '',
        trustedContacts: (await encryptField(draft.trustedContacts)) ?? '',
        professionalResources: (await encryptField(draft.professionalResources)) ?? '',
        reasonsToLive: (await encryptField(draft.reasonsToLive)) ?? '',
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      await db.safetyPlans.put(row);
      setPlan(row);
      setEditing(false);
      toast.success(t('safety_plan.saved'));
    } catch (err) {
      console.error('[SafetyPlan] save failed:', err);
      toast.error(t('safety_plan.save_fail'));
    }
  }, [draft, t]);

  const setField = (field: PlanField, value: string) => setDraft((d) => ({ ...d, [field]: value }));

  if (loading) {
    return <p className="text-sm text-text-muted">{t('common.loading')}</p>;
  }

  const hasPlan = plan !== null && !editing;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
          <ShieldCheck className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-text-primary">{t('safety_plan.title')}</h2>
          <p className="text-xs text-text-muted">{t('safety_plan.desc')}</p>
        </div>
      </div>

      {/* 危机快速求助卡（恒显） */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-red-50 dark:bg-red-900/30">
            <PhoneCall className="w-5 h-5 text-red-500" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text-primary">{t('safety_plan.crisis_title')}</h3>
            <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{t('safety_plan.crisis_desc')}</p>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400 mt-2">12356 · 400-161-9995（24 小时）</p>
          </div>
        </div>
      </Card>

      {!hasPlan && !editing && (
        <Card>
          <div className="text-center py-6">
            <p className="text-sm font-medium text-text-primary">{t('safety_plan.not_created')}</p>
            <p className="text-xs text-text-muted mt-1 mb-4">{t('safety_plan.not_created_desc')}</p>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white cursor-pointer hover:opacity-90 transition-opacity"
              style={{ background: 'var(--gradient-primary)' }}
            >
              <Pencil className="w-4 h-4" aria-hidden="true" />
              {t('safety_plan.create_btn')}
            </button>
          </div>
        </Card>
      )}

      {(hasPlan || editing) && (
        <>
          {PLAN_FIELDS.map(({ field, icon: Icon, titleKey, phKey, hintKey }, i) => (
            <Card key={field}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--bg-hover)' }}>
                  <Icon className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                </span>
                <h3 className="text-sm font-semibold text-text-primary">{i + 1}. {t(titleKey as TranslationKey)}</h3>
              </div>
              <p className="text-xs text-text-muted mb-2">{t(hintKey as TranslationKey)}</p>
              {editing ? (
                <textarea
                  value={draft[field]}
                  onChange={(e) => setField(field, e.target.value)}
                  placeholder={t(phKey as TranslationKey)}
                  rows={3}
                  maxLength={1000}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                  style={{ borderColor: 'var(--glass-border)' }}
                />
              ) : (
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                  {draft[field] || <span className="text-text-muted">{t('safety_plan.empty_field')}</span>}
                </p>
              )}
            </Card>
          ))}

          <p className="text-xs text-text-muted leading-relaxed">{t('safety_plan.disclaimer')}</p>

          <div className="flex items-center gap-3">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  <Save className="w-4 h-4" aria-hidden="true" />
                  {t('safety_plan.save')}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditing(false); void load(); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-surface-hover transition-colors"
                  style={{ border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                  {t('safety_plan.cancel')}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-surface-hover transition-colors"
                  style={{ border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                >
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                  {t('safety_plan.edit')}
                </button>
                {plan && (
                  <span className="text-xs text-text-muted">
                    {t('safety_plan.updated_at')}: {new Date(plan.updatedAt).toLocaleDateString()}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/therapy')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-surface-hover transition-colors"
                  style={{ border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}
                >
                  {t('safety_plan.go_therapy')}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
