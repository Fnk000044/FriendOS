import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import Modal from '../common/Modal';
import MethodNoteDialog from '../common/MethodNoteDialog';
import { useLanguage } from '../../i18n/useLanguage';
import type { TranslationKey } from '../../i18n/translations';
import { ESCALATION_REASON_KEYS } from '../../utils/evidenceChain';

interface EvidenceChainViewProps {
  open: boolean;
  chain: EvidenceChain | null;
  onClose: () => void;
}

const STATUS_KEY: Record<EvidenceContribution['status'], TranslationKey> = {
  elevated: 'evidence.status_elevated',
  normal: 'evidence.status_normal',
  no_data: 'evidence.status_no_data',
};

const STATUS_COLOR: Record<EvidenceContribution['status'], string> = {
  elevated: '#ef4444',
  normal: '#22c55e',
  no_data: '#94a3b8',
};

/**
 * EvidenceChainView — 风险证据链下钻视图（P0-6）
 *
 * 分层展示：总分+等级 → 5 信号贡献条（宽度=contribution/总分，数值）→
 * 触发依据列表 → 建议动作（可跳转路由）→ 免责声明 + 方法说明引用。
 * 所有 label 均为 TranslationKey，经 t() 解析保证 i18n 成对。
 */
export default function EvidenceChainView({ open, chain, onClose }: EvidenceChainViewProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleAction = useCallback(
    (target: string) => {
      onClose();
      navigate(target);
    },
    [navigate, onClose]
  );

  return (
    <Modal open={open} onClose={onClose} title={t('evidence.title')} maxWidth="max-w-2xl">
      {!chain ? (
        <p className="text-sm text-text-muted">{t('evidence.no_data')}</p>
      ) : (
        <div className="space-y-5">
          {/* 总分 + 等级 */}
          <div className="flex items-end gap-4">
            <div>
              <p className="text-xs text-text-muted mb-1">{t('evidence.total')}</p>
              <p className="text-4xl font-bold text-text-primary">
                {chain.totalScore}
                <span className="text-base text-text-muted font-normal">/100</span>
              </p>
            </div>
            <div className="pb-1">
              <p className="text-xs text-text-muted mb-1">{t('evidence.level')}</p>
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold"
                style={{
                  background: chain.escalation.escalated ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                  color: chain.escalation.escalated ? '#ef4444' : '#f59e0b',
                }}
              >
                {chain.escalation.escalated ? (
                  <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                )}
                {chain.riskLevel}
              </span>
            </div>
          </div>

          {/* 信号贡献条 */}
          <section>
            <h4 className="text-sm font-semibold text-text-primary mb-3">{t('evidence.contributions')}</h4>
            <div className="space-y-2.5">
              {chain.contributions.map((c) => {
                const widthPct = chain.totalScore > 0 ? Math.max(2, (c.contribution / chain.totalScore) * 100) : 0;
                return (
                  <div key={c.key}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-text-secondary">{t(c.label as TranslationKey)}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-text-muted">
                          {c.score}/100 × {Math.round(c.weight * 100)}%
                        </span>
                        <span className="font-semibold text-text-primary tabular-nums">
                          {c.contribution.toFixed(1)}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{ background: `${STATUS_COLOR[c.status]}22`, color: STATUS_COLOR[c.status] }}
                        >
                          {t(STATUS_KEY[c.status])}
                        </span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, widthPct)}%`,
                          background: c.status === 'elevated' ? '#ef4444' : c.status === 'no_data' ? '#94a3b8' : '#22c55e',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-text-muted mt-2">
              {t('evidence.total')}: {chain.totalScore} = Σ 信号贡献（score × weight）
            </p>
          </section>

          {/* 触发依据 */}
          {chain.triggers.length > 0 && (
            <section>
              <h4 className="text-sm font-semibold text-text-primary mb-2">{t('evidence.triggers')}</h4>
              <ul className="space-y-1.5">
                {chain.triggers.map((tr, i) => {
                  const isEscalation = tr.type === 'escalation';
                  const descKey = isEscalation ? ESCALATION_REASON_KEYS[tr.description] : null;
                  return (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-text-secondary"
                    >
                      {isEscalation ? (
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-red-500 shrink-0" aria-hidden="true" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-text-muted shrink-0" aria-hidden="true" />
                      )}
                      <span className="flex-1">
                        {descKey ? t(descKey) : tr.description}
                        {tr.source && tr.source !== 'diagnostics' && (
                          <span className="ml-1.5 text-[10px] text-text-muted">
                            [{t(('risk.dim_' + tr.source) as TranslationKey)}]
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* 临床升级 */}
          <section className="rounded-xl p-3 border" style={{ borderColor: chain.escalation.escalated ? 'rgba(239,68,68,0.4)' : 'var(--glass-border)', background: chain.escalation.escalated ? 'rgba(239,68,68,0.06)' : 'var(--bg-hover)' }}>
            <p className="text-sm font-medium text-text-primary mb-1">
              {t('evidence.escalation')}:{' '}
              <span style={{ color: chain.escalation.escalated ? '#ef4444' : '#22c55e' }}>
                {chain.escalation.escalated ? t('evidence.escalation_true') : t('evidence.escalation_false')}
              </span>
            </p>
            {chain.escalation.crisisFactorCount > 0 && (
              <p className="text-xs text-text-muted">
                危机信号源数: {chain.escalation.crisisFactorCount}
              </p>
            )}
          </section>

          {/* 建议动作 */}
          {chain.actions.length > 0 && (
            <section>
              <h4 className="text-sm font-semibold text-text-primary mb-2">{t('evidence.actions')}</h4>
              <div className="flex flex-wrap gap-2">
                {chain.actions.map((a, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleAction(a.target)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border cursor-pointer transition-colors hover:border-primary/30 hover:bg-primary/5"
                    style={{ borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
                  >
                    {t(a.label as TranslationKey)}
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 免责声明 + 方法说明（摘要 + 弹窗全文） */}
          <section className="pt-3 border-t space-y-1.5" style={{ borderColor: 'var(--glass-border)' }}>
            <p className="text-xs text-text-muted leading-relaxed">
              ⚠️ {t(chain.disclaimer as TranslationKey)}
            </p>
            <MethodNoteDialog kind="evidence" />
          </section>
        </div>
      )}
    </Modal>
  );
}
