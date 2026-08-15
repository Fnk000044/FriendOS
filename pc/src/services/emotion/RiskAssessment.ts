import type { RiskLevel } from '../../db/models';

/**
 * Risk Assessment Utilities
 * C-SSRS 框架映射 + 风险等级 UI 工具函数
 *
 * 实际风险评分由 RiskScoringEngine.cjs（后端）统一计算，
 * 本模块只提供 C-SSRS 映射和 UI 展示工具。
 *
 * 参考：C-SSRS (Columbia Suicide Severity Rating Scale)
 */

/**
 * Map crisis level to C-SSRS severity
 * @param crisisLevel - 0-4 from SentimentService
 * @returns C-SSRS level (0-6)
 */
export function mapCrisisToCSSRS(crisisLevel: number): number {
  const mapping: Record<number, number> = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 5,
  };
  return mapping[crisisLevel] || 0;
}

/**
 * Get risk level color for UI display
 */
export function getRiskColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    low: '#10B981',
    medium_low: '#F59E0B',
    medium: '#F97316',
    high: '#EF4444',
    critical: '#DC2626',
  };
  return colors[level] || '#6B7280';
}

/**
 * Get risk level label for UI display
 */
export function getRiskLabel(level: RiskLevel): string {
  const labels: Record<RiskLevel, string> = {
    low: '低风险',
    medium_low: '中低风险',
    medium: '中等风险',
    high: '高风险',
    critical: '极高风险',
  };
  return labels[level] || '未知';
}

/**
 * C-SSRS 级别描述
 */
export function getCSSRSDescription(level: number): string {
  const descriptions: Record<number, string> = {
    0: '无自杀意念',
    1: '希望死去',
    2: '非特异性自杀想法',
    3: '有自杀方法但无意图',
    4: '有自杀意图但无计划',
    5: '有自杀计划和意图',
    6: '自杀行为',
  };
  return descriptions[level] || '未知';
}
