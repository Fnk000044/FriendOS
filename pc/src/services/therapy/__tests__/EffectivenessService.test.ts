import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../../../db';
import { generateEffectivenessReport, getBestIntervention, getInterventionLabel } from '../EffectivenessService';

describe('EffectivenessService', () => {
  beforeEach(async () => {
    await db.therapyRecords.clear();
  });

  async function addRecord(type: 'thought_record' | 'breathing' | 'mindfulness', date: string, moodBefore: number, moodAfter: number) {
    await db.therapyRecords.add({
      id: `${type}_${date}`,
      type,
      date,
      data: {},
      moodBefore,
      moodAfter,
      createdAt: new Date(date).toISOString(),
    });
  }

  describe('getInterventionLabel', () => {
    it('返回中文标签', () => {
      expect(getInterventionLabel('breathing')).toBe('呼吸练习');
      expect(getInterventionLabel('thought_record')).toBe('CBT 思维记录');
      expect(getInterventionLabel('mindfulness')).toBe('正念冥想');
    });
  });

  describe('generateEffectivenessReport', () => {
    it('无记录时返回空报告', async () => {
      const report = await generateEffectivenessReport();
      expect(report.totalSessions).toBe(0);
      expect(report.byType.length).toBe(0);
      expect(report.topIntervention).toBeNull();
    });

    it('正确统计单类型', async () => {
      await addRecord('breathing', '2026-07-28', 2, 4);
      await addRecord('breathing', '2026-07-29', 3, 4);
      await addRecord('breathing', '2026-07-30', 2, 3);

      const report = await generateEffectivenessReport();
      expect(report.totalSessions).toBe(3);

      const breathing = report.byType.find(s => s.type === 'breathing');
      expect(breathing).toBeDefined();
      expect(breathing!.count).toBe(3);
      expect(breathing!.avgBefore).toBeCloseTo(2.33, 1);
      expect(breathing!.avgAfter).toBeCloseTo(3.67, 1);
      expect(breathing!.avgImprovement).toBeGreaterThan(0);
      expect(breathing!.effectivenessRate).toBe(1); // 3/3 有效
    });

    it('有效率计算：只有部分有效', async () => {
      await addRecord('breathing', '2026-07-28', 4, 3); // 无效（after < before）
      await addRecord('breathing', '2026-07-29', 2, 4); // 有效
      await addRecord('breathing', '2026-07-30', 3, 3); // 无效（相等）
      await addRecord('breathing', '2026-07-27', 2, 5); // 有效

      const report = await generateEffectivenessReport();
      const breathing = report.byType.find(s => s.type === 'breathing')!;
      expect(breathing.effectivenessRate).toBe(0.5); // 2/4
    });

    it('topIntervention 按有效率排序', async () => {
      // breathing 有效率 1.0
      await addRecord('breathing', '2026-07-28', 2, 4);
      await addRecord('breathing', '2026-07-29', 2, 4);
      await addRecord('breathing', '2026-07-30', 2, 4);
      // mindfulness 有效率 0.33
      await addRecord('mindfulness', '2026-07-28', 3, 4);
      await addRecord('mindfulness', '2026-07-29', 3, 2);
      await addRecord('mindfulness', '2026-07-30', 3, 3);

      const report = await generateEffectivenessReport();
      expect(report.topIntervention).not.toBeNull();
      expect(report.topIntervention!.type).toBe('breathing');
    });

    it('trend 在数据不足时为 stable', async () => {
      await addRecord('breathing', '2026-07-29', 2, 4);
      const report = await generateEffectivenessReport();
      expect(report.trend).toBe('stable');
    });

    it('记录 bestDay', async () => {
      await addRecord('breathing', '2026-07-28', 2, 5); // +3 最大提升
      await addRecord('breathing', '2026-07-29', 3, 4); // +1
      const report = await generateEffectivenessReport();
      const breathing = report.byType.find(s => s.type === 'breathing')!;
      expect(breathing.bestDay).toBe('2026-07-28');
      expect(breathing.bestImprovement).toBe(3);
    });
  });

  describe('getBestIntervention', () => {
    it('记录不足 3 次返回 null', async () => {
      await addRecord('breathing', '2026-07-28', 2, 4);
      await addRecord('breathing', '2026-07-29', 2, 4);
      const best = await getBestIntervention();
      expect(best).toBeNull();
    });

    it('记录达 3 次返回最有效', async () => {
      await addRecord('breathing', '2026-07-28', 2, 4);
      await addRecord('breathing', '2026-07-29', 2, 4);
      await addRecord('breathing', '2026-07-30', 2, 4);
      const best = await getBestIntervention();
      expect(best).not.toBeNull();
      expect(best!.type).toBe('breathing');
    });
  });
});
