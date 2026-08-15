import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import RiskSignalSources from '../RiskSignalSources';

/**
 * RiskSignalSources 冒烟测试
 *
 * 信号源分解组件是风险仪表盘的解释层，验证：
 * 1. 5 个信号源全部渲染，分数展示正确
 * 2. 风险因素列表按传入数据渲染
 * 3. factors 为空时不渲染风险因素区块
 */

function makeBreakdown(score = 50) {
  return {
    emotion: { score, weight: 0.3 },
    behavior: { score, weight: 0.2 },
    assessment: { score, weight: 0.25 },
    chat: { score, weight: 0.15 },
    diary: { score, weight: 0.1 },
  };
}

describe('RiskSignalSources', () => {
  afterEach(cleanup);

  it('渲染全部 5 个信号源', () => {
    render(<RiskSignalSources breakdown={makeBreakdown(42)} factors={[]} />);
    const regions = screen.getAllByRole('region');
    expect(regions).toHaveLength(1); // 仅信号源区块，无因素区块
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(5);
    // 每个信号源都显示分数
    expect(screen.getAllByText('42')).toHaveLength(5);
  });

  it('渲染风险因素列表与描述', () => {
    const factors = [
      { type: 'crisis_in_diary', weight: 30, description: '日记中出现危机表达' },
      { type: 'low_mood', weight: 8, description: '连续低情绪' },
    ];
    render(<RiskSignalSources breakdown={makeBreakdown()} factors={factors} />);
    expect(screen.getAllByRole('region')).toHaveLength(2);
    expect(screen.getByText('日记中出现危机表达')).toBeInTheDocument();
    expect(screen.getByText('连续低情绪')).toBeInTheDocument();
  });

  it('factors 为空时不渲染风险因素区块', () => {
    render(<RiskSignalSources breakdown={makeBreakdown()} factors={[]} />);
    expect(screen.queryByText('日记中出现危机表达')).not.toBeInTheDocument();
    expect(screen.getAllByRole('region')).toHaveLength(1);
  });
});
