import { describe, it, expect } from 'vitest';
import { mapCrisisToCSSRS, getRiskColor, getRiskLabel, getCSSRSDescription } from '../RiskAssessment';

describe('RiskAssessment', () => {
  describe('mapCrisisToCSSRS', () => {
    it('should map 0 to 0', () => expect(mapCrisisToCSSRS(0)).toBe(0));
    it('should map 1 to 1', () => expect(mapCrisisToCSSRS(1)).toBe(1));
    it('should map 2 to 2', () => expect(mapCrisisToCSSRS(2)).toBe(2));
    it('should map 3 to 3', () => expect(mapCrisisToCSSRS(3)).toBe(3));
    it('should map 4 to 5', () => expect(mapCrisisToCSSRS(4)).toBe(5));
    it('should map unknown to 0', () => expect(mapCrisisToCSSRS(99)).toBe(0));
  });

  describe('getRiskColor', () => {
    it('should return correct colors for each level', () => {
      expect(getRiskColor('low')).toBe('#10B981');
      expect(getRiskColor('medium_low')).toBe('#F59E0B');
      expect(getRiskColor('medium')).toBe('#F97316');
      expect(getRiskColor('high')).toBe('#EF4444');
      expect(getRiskColor('critical')).toBe('#DC2626');
    });
  });

  describe('getRiskLabel', () => {
    it('should return Chinese labels', () => {
      expect(getRiskLabel('low')).toBe('低风险');
      expect(getRiskLabel('medium_low')).toBe('中低风险');
      expect(getRiskLabel('medium')).toBe('中等风险');
      expect(getRiskLabel('high')).toBe('高风险');
      expect(getRiskLabel('critical')).toBe('极高风险');
    });
  });

  describe('getCSSRSDescription', () => {
    it('should return correct descriptions', () => {
      expect(getCSSRSDescription(0)).toBe('无自杀意念');
      expect(getCSSRSDescription(1)).toBe('希望死去');
      expect(getCSSRSDescription(5)).toBe('有自杀计划和意图');
      expect(getCSSRSDescription(99)).toBe('未知');
    });
  });
});
