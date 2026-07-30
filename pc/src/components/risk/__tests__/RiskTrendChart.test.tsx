import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import RiskTrendChart from '../RiskTrendChart';
import { useLanguage } from '../../../i18n/useLanguage';

/**
 * RiskTrendChart 冒烟测试
 *
 * 趋势图组件验证两个分支：
 * 1. data 为空时展示空状态提示（不渲染图表容器）
 * 2. data 非空时渲染 figure 语义容器且无空状态提示
 * 注：recharts ResponsiveContainer 在 jsdom 中测得尺寸为 0，
 * 不渲染 svg 内容，因此只断言分支切换而非图表细节。
 */

/** jsdom 无 ResizeObserver，recharts ResponsiveContainer 挂载时需要 */
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

describe('RiskTrendChart', () => {
  beforeAll(() => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  afterEach(cleanup);

  it('data 为空时展示空状态提示', () => {
    render(<RiskTrendChart data={[]} />);
    const emptyText = useLanguage.getState().t('risk.no_trend_data');
    expect(screen.getByRole('figure')).toBeInTheDocument();
    expect(screen.getByText(emptyText)).toBeInTheDocument();
  });

  it('data 非空时渲染图表容器且无空状态提示', () => {
    const data = [
      { date: '07-26', score: 20 },
      { date: '07-27', score: 45 },
      { date: '07-28', score: 70 },
    ];
    render(<RiskTrendChart data={data} />);
    const emptyText = useLanguage.getState().t('risk.no_trend_data');
    expect(screen.getByRole('figure')).toBeInTheDocument();
    expect(screen.queryByText(emptyText)).not.toBeInTheDocument();
  });
});
