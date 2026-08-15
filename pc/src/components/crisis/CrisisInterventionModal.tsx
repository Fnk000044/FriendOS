import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Heart, X, Shield, ExternalLink, ShieldCheck } from 'lucide-react';
import HotlineCard from './HotlineCard';
import { useCrisisStore } from '../../stores/crisisStore';
import { db } from '../../db';
import { getToday } from '../../utils/date';
import { useLanguage } from '../../i18n/useLanguage';
import { prefersReducedMotion } from '../../utils/reduceMotion';
import { CRISIS_HOTLINES } from '../../utils/constants';
import { recordFeedback } from '../../services/selfevolution/SelfEvolutionService';

// 热线数据源：统一引用 utils/constants.ts 的 CRISIS_HOTLINES（含 12356 全国统一心理援助热线），
// 确保 危机弹窗 / 干预资源页 / 聊天危机回复 三处话术一致（P0-7）。
// number → i18n 名称/描述 key 映射（constants 提供号码，i18n 提供文案）。
const HOTLINE_I18N: Record<string, { nameKey: 'crisis.hotline_national_name' | 'crisis.hotline_unified_name' | 'crisis.hotline_beijing_name'; descKey: 'crisis.hotline_national_desc' | 'crisis.hotline_unified_desc' | 'crisis.hotline_beijing_desc' }> = {
  '400-161-9995': { nameKey: 'crisis.hotline_national_name', descKey: 'crisis.hotline_national_desc' },
  '12356': { nameKey: 'crisis.hotline_unified_name', descKey: 'crisis.hotline_unified_desc' },
  '010-82951332': { nameKey: 'crisis.hotline_beijing_name', descKey: 'crisis.hotline_beijing_desc' },
};

const HOTLINE_KEYS = CRISIS_HOTLINES.map((h) => ({
  number: h.number,
  nameKey: HOTLINE_I18N[h.number]?.nameKey ?? 'crisis.hotline_national_name',
  descKey: HOTLINE_I18N[h.number]?.descKey ?? 'crisis.hotline_national_desc',
}));

/**
 * 危机警报音频（Web Audio API，无需外部音频文件）
 * - high：播放一次短促双音
 * - critical：循环播放直到用户交互
 */

function useCrisisAlertAudio(riskLevel: string | null, visible: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  // 单次警报音
  const playBeep = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      // 两个短促音
      [0, 0.18].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, now + offset);
        osc.type = 'square';
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.25, now + offset + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.15);
        osc.start(now + offset);
        osc.stop(now + offset + 0.16);
      });
    } catch (err) {
      console.error('[CrisisAudio] playBeep failed:', err);
    }
  }, []);

  useEffect(() => {
    // 如果用户开启了 reduced-motion，critical 级别仅播放一次，high 级别跳过
    if (prefersReducedMotion()) {
      if (visible && riskLevel === 'critical') {
        playBeep();
      }
      return;
    }

    if (!visible || riskLevel !== 'critical') {
      // 清理循环
      if (loopTimerRef.current) {
        clearTimeout(loopTimerRef.current);
        loopTimerRef.current = null;
      }
      return;
    }

    // critical：每 2 秒循环播放
    const loop = () => {
      playBeep();
      loopTimerRef.current = setTimeout(loop, 2000);
    };
    // 首次立即播放
    rafRef.current = requestAnimationFrame(() => loop());

    return () => {
      if (loopTimerRef.current) {
        clearTimeout(loopTimerRef.current);
        loopTimerRef.current = null;
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [visible, riskLevel, playBeep]);

  // high 级别仅播放一次
  useEffect(() => {
    if (visible && riskLevel === 'high' && !prefersReducedMotion()) {
      playBeep();
    }
  }, [visible, riskLevel, playBeep]);

  // 关闭 AudioContext
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch { /* ignore */ }
        audioCtxRef.current = null;
      }
    };
  }, []);
}

export default function CrisisInterventionModal() {
  const { visible, riskLevel, triggerSource, triggerContent, hide } = useCrisisStore();
  const { t } = useLanguage();
  const [countdown, setCountdown] = useState(5);
  const [canClose, setCanClose] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const dismissBtnRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useCrisisAlertAudio(riskLevel, visible);

  useEffect(() => {
    if (!visible) {
      setCountdown(5);
      setCanClose(false);
      return;
    }

    // 保存触发元素焦点，关闭后恢复
    previouslyFocusedRef.current = document.activeElement as HTMLElement;
    // modal 打开后自动聚焦到 dismiss 按钮
    setTimeout(() => dismissBtnRef.current?.focus(), 0);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanClose(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible]);

  const handleDismiss = useCallback(async () => {
    if (!canClose) return;

    // 记录危机日志
    try {
      await db.crisisLogs.add({
        id: crypto.randomUUID(),
        date: getToday(),
        triggerSource: triggerSource || 'diary',
        triggerContent: triggerContent.slice(0, 200),
        riskLevel: (riskLevel === 'critical' ? 'critical' : 'high'),
        handled: true,
        action: '用户已查看危机干预信息并关闭弹窗',
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to log crisis event:', err);
    }

    hide();
    // 恢复触发元素焦点
    setTimeout(() => previouslyFocusedRef.current?.focus(), 0);
  }, [canClose, hide, riskLevel, triggerContent, triggerSource]);

  const handleOpenSafetyPlan = useCallback(() => {
    // 记录危机日志后关闭弹窗并跳转安全计划页（SPI 闭环：识别→干预→转介/自助）
    // 用 location.hash 导航：应用是 HashRouter，且组件测试无 Router 上下文时仍可测
    try {
      void db.crisisLogs.add({
        id: crypto.randomUUID(),
        date: getToday(),
        triggerSource: triggerSource || 'diary',
        triggerContent: triggerContent.slice(0, 200),
        riskLevel: (riskLevel === 'critical' ? 'critical' : 'high'),
        handled: true,
        action: '用户选择查看安全计划',
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to log crisis event:', err);
    }
    hide();
    window.location.hash = '/safety-plan';
  }, [hide, riskLevel, triggerContent, triggerSource]);

  // 方案A 自进化闭环：用户标记"误报"→ 反馈样本进入 calibration.crisisFeedback，
  // 此后相似的 ONNX 单路危机会被个人化降级（L1 硬词命中时不受影响）
  const handleFeedback = useCallback(async (accurate: boolean) => {
    try {
      await recordFeedback({
        type: 'crisis_false_alarm',
        predicted: 'crisis',
        feedback: accurate ? 'accurate' : 'inaccurate',
        text: triggerContent.slice(0, 300),
      });
    } catch (err) {
      console.warn('[CrisisFeedback] record failed:', err);
    }
    if (!accurate) {
      toast.success(t('crisis.feedback_thanks'));
    }
    hide();
  }, [hide, t, triggerContent]);

  // 焦点陷阱 + Escape 关闭
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape 关闭（仅当可关闭时）
      if (e.key === 'Escape' && canClose) {
        e.preventDefault();
        handleDismiss();
        return;
      }

      // Tab 循环：在 dialog 内聚焦元素间循环
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [visible, canClose, handleDismiss]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={t('crisis.aria_label')}
      aria-describedby="crisis-description"
    >
      {/* Backdrop - red tint for crisis */}
      <div className="absolute inset-0 bg-red-900/30 backdrop-blur-sm" />

      {/* Modal with pulse border */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-lg mx-4 glass-card rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 outline-none"
        style={{
          boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)',
          animation: 'pulseBorder 1.5s ease-in-out infinite',
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-5 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <Heart className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{t('crisis.title')}</h2>
              <p className="text-sm text-white/80">{t('crisis.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {/* Message */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Shield className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div id="crisis-description" className="text-sm text-text-secondary leading-relaxed">
                <p className="mb-2">
                  {t('crisis.description_1')}
                  <strong className="text-blue-700">{t('crisis.description_2')}</strong>
                  {t('crisis.description_3')}
                </p>
                <p>{t('crisis.description_4')}</p>
                <p className="mt-2 font-medium text-red-600 dark:text-red-400">{t('crisis.not_medical')}</p>
              </div>
            </div>
          </div>

          {/* Hotlines */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-secondary">{t('crisis.hotline_title')}</h3>
            {HOTLINE_KEYS.map((hotline) => (
              <HotlineCard key={hotline.number} name={t(hotline.nameKey)} number={hotline.number} description={t(hotline.descKey)} />
            ))}
          </div>

          {/* Online Resources */}
          <div className="text-xs text-text-muted space-y-1">
            <p className="flex items-center gap-1">
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
              {t('crisis.online_counseling')}
              <a
                href="https://www.psych.ac.cn"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {t('crisis.online_link_cas_label')}
              </a>
              {' | '}
              <a
                href="https://www.crisisbj.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {t('crisis.online_link_bj_label')}
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t space-y-2" style={{ background: 'var(--bg-hover)', borderColor: 'var(--glass-border)' }}>
          <button
            type="button"
            onClick={handleOpenSafetyPlan}
            className="w-full py-2.5 px-4 rounded-lg text-sm font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
            style={{ border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
          >
            <ShieldCheck className="w-4 h-4 text-blue-500" aria-hidden="true" />
            {t('safety_plan.open_from_crisis')}
          </button>
          <button
            ref={dismissBtnRef}
            onClick={handleDismiss}
            disabled={!canClose}
            className={`w-full py-3 px-4 rounded-lg text-sm font-medium transition-all ${
              canClose
                ? 'bg-slate-800 text-white hover:bg-slate-700 cursor-pointer'
                : 'bg-slate-200 text-slate-500 font-semibold cursor-not-allowed'
            }`}
          >
            {canClose ? t('crisis.close_button') : t('crisis.countdown', { seconds: countdown })}
          </button>
          {canClose && (
            <div className="flex items-center justify-center gap-3 pt-1 text-[11px] text-text-muted">
              <span>{t('crisis.feedback_question')}</span>
              <button
                type="button"
                onClick={() => void handleFeedback(true)}
                className="hover:text-text-primary cursor-pointer transition-colors"
              >
                {t('crisis.feedback_accurate')}
              </button>
              <span className="opacity-40">·</span>
              <button
                type="button"
                onClick={() => void handleFeedback(false)}
                className="hover:text-text-primary cursor-pointer transition-colors"
              >
                {t('crisis.feedback_false_alarm')}
              </button>
            </div>
          )}
        </div>

        {/* Close button (only when countdown is done) */}
        {canClose && (
          <button
            ref={closeBtnRef}
            onClick={handleDismiss}
            aria-label={t('crisis.close_button')}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
