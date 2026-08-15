import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor, cleanup } from '@testing-library/react';
import CrisisInterventionModal from '../CrisisInterventionModal';
import { useCrisisStore } from '../../../stores/crisisStore';
import { db } from '../../../db';

/**
 * CrisisInterventionModal 冒烟测试
 *
 * 安全关键组件：验证危机干预弹窗的渲染与关键交互路径——
 * 1. 默认隐藏
 * 2. 触发后渲染 dialog 语义与求助热线
 * 3. 5 秒倒计时期间不可关闭（按钮禁用 + Escape 无效）
 * 4. 倒计时结束后可关闭，关闭时写入危机日志并恢复 store 状态
 */

/** jsdom 无 AudioContext，提供最小 stub 避免警报音频路径报错 */
class MockAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {};
  resume = vi.fn();
  close = vi.fn();
  createOscillator() {
    return {
      connect: vi.fn(),
      frequency: { setValueAtTime: vi.fn() },
      type: 'square',
      start: vi.fn(),
      stop: vi.fn(),
    };
  }
  createGain() {
    return {
      connect: vi.fn(),
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    };
  }
}

describe('CrisisInterventionModal', () => {
  beforeEach(async () => {
    vi.stubGlobal('AudioContext', MockAudioContext);
    useCrisisStore.setState({
      visible: false,
      riskLevel: null,
      triggerSource: null,
      triggerContent: '',
    });
    await db.crisisLogs.clear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('默认不渲染任何内容', () => {
    const { container } = render(<CrisisInterventionModal />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('触发危机后渲染 dialog 语义与求助热线', () => {
    render(<CrisisInterventionModal />);

    act(() => {
      useCrisisStore.getState().show('high', 'diary', '测试触发内容');
    });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    // 热线号码必须展示（统一引用 constants.CRISIS_HOTLINES，含 12356 全国统一心理援助热线）
    expect(screen.getByText('400-161-9995')).toBeInTheDocument();
    expect(screen.getByText('12356')).toBeInTheDocument();
    expect(screen.getByText('010-82951332')).toBeInTheDocument();
  });

  it('倒计时期间关闭按钮禁用，Escape 无法关闭', () => {
    vi.useFakeTimers();
    render(<CrisisInterventionModal />);

    act(() => {
      useCrisisStore.getState().show('high', 'diary', '测试触发内容');
    });

    const buttons = screen.getAllByRole('button');
    const dismissBtn = buttons[buttons.length - 1];
    expect(dismissBtn).toBeDisabled();

    // 倒计时未结束时 Escape 不应关闭
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(useCrisisStore.getState().visible).toBe(true);
  });

  it('倒计时结束后可关闭，关闭时写入危机日志', async () => {
    render(<CrisisInterventionModal />);

    act(() => {
      useCrisisStore.getState().show('critical', 'chat', '危机触发内容');
    });

    // 走完 5 秒倒计时（真实定时器）
    await act(async () => {
      await new Promise(r => setTimeout(r, 5500));
    });

    // canClose 应已为 true —— 右上角关闭按钮（aria-label="我已了解，关闭"）应出现
    const closeBtns = screen.getAllByRole('button').filter((b) =>
      b.getAttribute('aria-label')?.includes('关闭') || b.getAttribute('aria-label')?.toLowerCase().includes('close')
    );
    expect(closeBtns.length).toBeGreaterThan(0);
    expect(closeBtns[0]).not.toBeDisabled();

    // 点击关闭按钮 —— handleDismiss 是 async，需要等待 db 写入与 store 更新
    await act(async () => {
      fireEvent.click(closeBtns[0]);
    });

    // 给 db.crisisLogs.add（async）+ hide() 足够时间完成
    await act(async () => {
      await new Promise(r => setTimeout(r, 200));
    });

    expect(useCrisisStore.getState().visible).toBe(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const logs = await db.crisisLogs.toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0].riskLevel).toBe('critical');
    expect(logs[0].triggerSource).toBe('chat');
    expect(logs[0].handled).toBe(true);
  }, 15000);

  it('超长触发内容写入日志时截断至 200 字符', async () => {
    render(<CrisisInterventionModal />);

    const longContent = '危'.repeat(500);
    act(() => {
      useCrisisStore.getState().show('high', 'diary', longContent);
    });

    // 走完 5 秒倒计时后关闭
    await act(async () => {
      await new Promise(r => setTimeout(r, 5500));
    });
    const buttons = screen.getAllByRole('button');
    await act(async () => {
      fireEvent.click(buttons[buttons.length - 1]);
    });
    await waitFor(async () => {
      const logs = await db.crisisLogs.toArray();
      expect(logs).toHaveLength(1);
      expect(logs[0].triggerContent).toHaveLength(200);
      expect(logs[0].triggerContent).toBe(longContent.slice(0, 200));
    });
  }, 15000);
});
