import { describe, it, expect, beforeEach } from 'vitest';
import {
  getTermConfig,
  setTermConfig,
  detectSemesterPhase,
  getTermPhaseDescription,
  getAcademicStressMultiplier,
  type TermConfig,
} from '../StudentAdaptationService';

describe('StudentAdaptationService', () => {
  describe('getTermConfig / setTermConfig', () => {
    it('未配置返回 null', () => {
      localStorage.removeItem('friendos_term_config');
      expect(getTermConfig()).toBeNull();
    });

    it('保存后能读取', () => {
      const cfg: TermConfig = {
        termStart: '2026-09-01',
        examWeekStart: '2027-01-05',
        examWeekEnd: '2027-01-15',
      };
      setTermConfig(cfg);
      const read = getTermConfig();
      expect(read).not.toBeNull();
      expect(read!.termStart).toBe('2026-09-01');
      expect(read!.examWeekStart).toBe('2027-01-05');
    });

    it('缺字段返回 null', () => {
      localStorage.setItem('friendos_term_config', JSON.stringify({ termStart: '2026-09-01' }));
      expect(getTermConfig()).toBeNull();
    });
  });

  describe('detectSemesterPhase（配置驱动）', () => {
    const cfg: TermConfig = {
      termStart: '2026-09-01',
      examWeekStart: '2027-01-05',
      examWeekEnd: '2027-01-15',
      vacationStart: '2027-01-20',
    };

    beforeEach(() => setTermConfig(cfg));

    it('考试周内识别为 exam_week', () => {
      const info = detectSemesterPhase(new Date('2027-01-10'));
      expect(info.phase).toBe('exam_week');
      expect(info.stressLevel).toBeGreaterThanOrEqual(90);
    });

    it('考试周前 14 天识别为 final', () => {
      const info = detectSemesterPhase(new Date('2027-01-01'));
      expect(info.phase).toBe('final');
      expect(info.stressLevel).toBeGreaterThanOrEqual(60);
    });

    it('假期识别为 vacation', () => {
      const info = detectSemesterPhase(new Date('2027-02-01'));
      expect(info.phase).toBe('vacation');
      expect(info.stressLevel).toBeLessThanOrEqual(20);
    });

    it('开学初识别为 regular', () => {
      const info = detectSemesterPhase(new Date('2026-09-05'));
      expect(info.phase).toBe('regular');
    });

    it('考后识别为 regular', () => {
      const info = detectSemesterPhase(new Date('2027-01-17'));
      expect(info.phase).toBe('regular');
      expect(info.stressLevel).toBeLessThanOrEqual(40);
    });
  });

  describe('detectSemesterPhase（回退硬编码）', () => {
    beforeEach(() => localStorage.removeItem('friendos_term_config'));

    it('暑假识别为 vacation', () => {
      const info = detectSemesterPhase(new Date('2026-07-15'));
      expect(info.phase).toBe('vacation');
    });

    it('寒假识别为 vacation', () => {
      const info = detectSemesterPhase(new Date('2026-01-20'));
      expect(info.phase).toBe('vacation');
    });

    it('期末考试周识别为 final', () => {
      const info = detectSemesterPhase(new Date('2026-06-25'));
      expect(info.phase).toBe('final');
    });
  });

  describe('getAcademicStressMultiplier', () => {
    it('考试周 ×1.5', () => {
      setTermConfig({ termStart: '2026-09-01', examWeekStart: '2027-01-05', examWeekEnd: '2027-01-15' });
      const m = getAcademicStressMultiplier(new Date('2027-01-10'));
      expect(m).toBe(1.5);
    });

    it('复习期 ×1.2', () => {
      setTermConfig({ termStart: '2026-09-01', examWeekStart: '2027-01-05', examWeekEnd: '2027-01-15' });
      const m = getAcademicStressMultiplier(new Date('2027-01-01'));
      expect(m).toBe(1.2);
    });

    it('假期 ×0.8', () => {
      setTermConfig({ termStart: '2026-09-01', examWeekStart: '2027-01-05', examWeekEnd: '2027-01-15', vacationStart: '2027-01-20' });
      const m = getAcademicStressMultiplier(new Date('2027-02-01'));
      expect(m).toBe(0.8);
    });
  });

  describe('getTermPhaseDescription', () => {
    it('返回阶段描述含 label 和 stressLevel', () => {
      setTermConfig({ termStart: '2026-09-01', examWeekStart: '2027-01-05', examWeekEnd: '2027-01-15' });
      const desc = getTermPhaseDescription(new Date('2027-01-10'));
      expect(desc.label).toBeTruthy();
      expect(desc.stressLevel).toBeGreaterThanOrEqual(0);
      expect(desc.hasConfig).toBe(true);
    });

    it('未配置时 hasConfig 为 false', () => {
      localStorage.removeItem('friendos_term_config');
      const desc = getTermPhaseDescription(new Date('2026-07-15'));
      expect(desc.hasConfig).toBe(false);
    });
  });
});
