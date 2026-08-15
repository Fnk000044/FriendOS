import { useEffect } from 'react';

/**
 * 焦点陷阱 hook（a11y）
 *
 * 用法：
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   useFocusTrap(containerRef, active);
 *
 * 当 `active` 为 true 时：
 *  - 进入时把焦点移到容器内第一个可聚焦元素（或容器本身）
 *  - Tab / Shift+Tab 在容器内部循环，不会逃逸到背后页面
 *  - 离开时（active 变 false）把焦点还原到进入前的元素
 *
 * 适配场景：Modal、QuickCaptureModal、CrisisInterventionModal、LockScreen。
 * Esc 关闭语义由调用方处理（这里只负责焦点陷阱，不抢 keydown 默认行为）。
 *
 * 注意：容器内的可聚焦元素在 mount 后才稳定（动画结束/异步渲染），
 * 因此 effect 用 [active] 单一依赖，active=true 时下一帧再查询 focusables。
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((el) => {
      // 过滤 display:none / visibility:hidden
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
    });
}

export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    // 记录进入前的焦点，离开时还原
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // 进入：下一帧把焦点移到容器内第一个可聚焦元素
    // （下一帧是为了等渲染 + 动画稳定，避免 querySelector 拿到 0 个元素）
    let rafId = 0;
    rafId = requestAnimationFrame(() => {
      const focusables = getFocusableElements(container);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        // 容器自身可聚焦（fallback）
        container.setAttribute('tabindex', '-1');
        container.focus();
      }
    });

    // Tab/Shift+Tab 循环
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusables = getFocusableElements(container);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const activeEl = document.activeElement;

      if (e.shiftKey) {
        // Shift+Tab：从 first 反向跳到 last
        if (activeEl === first || !container.contains(activeEl)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab：从 last 正向跳到 first
        if (activeEl === last || !container.contains(activeEl)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(rafId);
      container.removeEventListener('keydown', handleKeyDown);
      // 还原焦点（组件卸载或 active=false 时）
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        // 给原元素 focus 的机会，但若它已不在 DOM 则静默失败
        try { previouslyFocused.focus(); } catch { /* ignore */ }
      }
    };
  }, [active]);
}
