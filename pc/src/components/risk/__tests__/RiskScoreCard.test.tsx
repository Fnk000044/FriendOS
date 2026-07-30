import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import RiskScoreCard from '../RiskScoreCard';
import type { RiskLevel } from '../../../db/models';

/**
 * RiskScoreCard 冒烟测试
 *
 * 风险评分卡片是风险仪表盘的核心展示组件，验证：
 * 1. 总分与摘要正确渲染
 * 2. high/critical 等级展示求助热线行动指引
 * 3. low 等级不展示热线（避免过度警示）
 * 4. 风险等级条具备无障碍语义
 */

function makeResult(riskLevel: RiskLevel, totalScore: number) {
  return {
    totalScore,
    riskLevel,
    riskLevelInfo: { min: 0, max: 100, label: '测试等级', color: '#EF4444' },
    summary: '综合风险摘要文本',
  };
}

describe('RiskScoreCard', () => {
  afterEach(cleanup);

  it('渲染总分与摘要', () => {
    render(<RiskScoreCard riskResult={makeResult('high', 82)} />);
    // AnimatedNumber 初始值即为传入分数
    expect(screen.getByText('82')).toBeInTheDocument();
    expect(screen.getByText('综合风险摘要文本')).toBeInTheDocument();
  });

  it('high 等级展示求助热线行动指引', () => {
    render(<RiskScoreCard riskResult={makeResult('high', 80)} />);
    expect(screen.getByText('400-161-9995')).toBeInTheDocument();
  });

  it('critical 等级展示求助热线行动指引', () => {
    render(<RiskScoreCard riskResult={makeResult('critical', 95)} />);
    expect(screen.getByText('400-161-9995')).toBeInTheDocument();
  });

  it('low 等级不展示热线，避免过度警示', () => {
    render(<RiskScoreCard riskResult={makeResult('low', 10)} />);
    expect(screen.queryByText('400-161-9995')).not.toBeInTheDocument();
  });

  it('风险等级条具备 aria-label 无障碍语义', () => {
    render(<RiskScoreCard riskResult={makeResult('medium', 55)} />);
    const bars = screen.getAllByRole('img');
    expect(bars.length).toBeGreaterThanOrEqual(2);
    bars.forEach((bar) => {
      expect(bar.getAttribute('aria-label')).toContain('测试等级');
    });
  });
});
