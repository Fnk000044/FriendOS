/**
 * 反馈触点 UI 组件测试（jsdom）
 * - SentimentCorrection：危机场景禁用纠错入口
 * - RiskCalibrationFeedback：三个按钮回调携带正确 direction
 * - InterventionFeedback：显式有效性反馈映射（有帮助/没帮助）
 * - SelfEvolutionPanel：渲染进度环/时间线；reduceMotion=true 时无 transition 动画
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SentimentCorrection from '../SentimentCorrection';
import RiskCalibrationFeedback from '../RiskCalibrationFeedback';
import InterventionFeedback from '../InterventionFeedback';
import SelfEvolutionPanel from '../../selfevolution/SelfEvolutionPanel';
import { useAppearanceStore } from '../../../stores/useAppearanceStore';
import { useLanguage } from '../../../i18n/useLanguage';
import { recordFeedback, getSelfEvolutionSnapshot } from '../../../services/selfevolution/SelfEvolutionService';
import type { SelfEvolutionSnapshot } from '../../../services/selfevolution/types';

vi.mock('../../../services/selfevolution/SelfEvolutionService', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../../services/selfevolution/SelfEvolutionService')>();
  return {
    ...mod,
    recordFeedback: vi.fn().mockResolvedValue(undefined),
    getSelfEvolutionSnapshot: vi.fn(),
  };
});

const recordFeedbackMock = vi.mocked(recordFeedback);
const getSnapshotMock = vi.mocked(getSelfEvolutionSnapshot);

describe('反馈触点 UI 组件', () => {
  beforeEach(() => {
    recordFeedbackMock.mockClear();
    getSnapshotMock.mockReset();
    // 固定中文文案，避免 jsdom 默认 en 导致断言语言不一致
    useLanguage.getState().setLang('zh-CN');
  });

  afterEach(() => {
    useAppearanceStore.getState().setReduceMotion(false);
  });

  describe('SentimentCorrection 危机禁用', () => {
    it('level=crisis 时禁用纠错入口（无按钮、显示禁用文案）', () => {
      render(<SentimentCorrection predictedClass="negative" crisis={true} refId="d-1" />);
      expect(screen.getByText('危机场景暂不支持纠错')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('非危机场景显示纠错入口并可展开 4 选 1', () => {
      render(<SentimentCorrection predictedClass="negative" crisis={false} refId="d-1" />);
      const trigger = screen.getByRole('button', { name: /不对/ });
      expect(trigger).toBeInTheDocument();
      fireEvent.click(trigger);
      expect(screen.getByRole('button', { name: '积极' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '消极' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '平静' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '危机' })).toBeInTheDocument();
    });
  });

  describe('RiskCalibrationFeedback 方向性回调', () => {
    it('「偏高」→ direction=overestimate', () => {
      render(<RiskCalibrationFeedback riskLevel="medium" refId="r-1" />);
      fireEvent.click(screen.getByRole('button', { name: '偏高' }));
      expect(recordFeedbackMock).toHaveBeenCalledTimes(1);
      expect(recordFeedbackMock.mock.calls[0][0]).toMatchObject({
        type: 'risk_level',
        direction: 'overestimate',
        feedback: 'inaccurate',
      });
    });

    it('「偏低」→ direction=underestimate', () => {
      render(<RiskCalibrationFeedback riskLevel="medium" refId="r-1" />);
      fireEvent.click(screen.getByRole('button', { name: '偏低' }));
      expect(recordFeedbackMock.mock.calls[0][0]).toMatchObject({
        type: 'risk_level',
        direction: 'underestimate',
        feedback: 'inaccurate',
      });
    });

    it('「正好」→ 无 direction、feedback=accurate（仅确认不调整）', () => {
      render(<RiskCalibrationFeedback riskLevel="medium" refId="r-1" />);
      fireEvent.click(screen.getByRole('button', { name: '正好' }));
      const payload = recordFeedbackMock.mock.calls[0][0];
      expect(payload).toMatchObject({ type: 'risk_level', feedback: 'accurate' });
      expect(payload.direction).toBeUndefined();
    });
  });

  describe('InterventionFeedback 显式有效性', () => {
    it('「没帮助」→ correction=not_helpful、feedback=inaccurate', () => {
      render(<InterventionFeedback interventionType="breathing" />);
      fireEvent.click(screen.getByRole('button', { name: '没帮助' }));
      expect(recordFeedbackMock.mock.calls[0][0]).toMatchObject({
        type: 'recommendation',
        correction: 'not_helpful',
        feedback: 'inaccurate',
      });
    });

    it('「有帮助」→ correction=helpful、feedback=accurate', () => {
      render(<InterventionFeedback interventionType="mindfulness" />);
      fireEvent.click(screen.getByRole('button', { name: '有帮助' }));
      expect(recordFeedbackMock.mock.calls[0][0]).toMatchObject({
        type: 'recommendation',
        correction: 'helpful',
        feedback: 'accurate',
      });
    });
  });

  describe('SelfEvolutionPanel 进度环 / 时间线 / reduceMotion', () => {
    const snapshot: SelfEvolutionSnapshot = {
      hasModel: true,
      sentiment: { sampleCount: 5, calibrated: true },
      risk: { sampleCount: 3, calibrated: false },
      intervention: {
        sampleCount: 4,
        calibrated: true,
        effectiveN: { breathing: 2, mindfulness: 1, thought_record: 1 },
      },
      timeline: [
        { id: 't1', type: 'sentiment', labelKey: 'selfevo.timeline_sentiment', createdAt: Date.now() - 1000 },
        { id: 't2', type: 'risk_level', labelKey: 'selfevo.timeline_risk', createdAt: Date.now() },
      ],
      lastUpdated: Date.now(),
    };

    it('渲染进度环（svg circle）与时间线', async () => {
      getSnapshotMock.mockResolvedValue(snapshot);
      render(<SelfEvolutionPanel />);
      // 进度环 SVG
      const ring = await screen.findByRole('img');
      expect(ring).toBeInTheDocument();
      // 时间线文案
      expect(await screen.findByText('情感纠错')).toBeInTheDocument();
      expect(screen.getByText('风险校准')).toBeInTheDocument();
    });

    it('reduceMotion=true 时进度环无 transition 动画', async () => {
      useAppearanceStore.getState().setReduceMotion(true);
      getSnapshotMock.mockResolvedValue(snapshot);
      const { container } = render(<SelfEvolutionPanel />);
      await screen.findByRole('img');

      // 进度环的 progress circle（第二个 circle，带 strokeDasharray）
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThanOrEqual(2);
      const progressCircle = circles[1] as SVGCircleElement;
      expect(progressCircle.style.transition).toBe('none');
    });

    it('reduceMotion=false 时进度环有 transition 动画', async () => {
      useAppearanceStore.getState().setReduceMotion(false);
      getSnapshotMock.mockResolvedValue(snapshot);
      const { container } = render(<SelfEvolutionPanel />);
      await screen.findByRole('img');

      const circles = container.querySelectorAll('circle');
      const progressCircle = circles[1] as SVGCircleElement;
      expect(progressCircle.style.transition).not.toBe('none');
    });
  });
});
