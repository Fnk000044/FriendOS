import { useAppearanceStore } from '../stores/useAppearanceStore';

/**
 * 动效降级控制源（统一入口）。
 *
 * 历史上项目里 5 处直接读 `window.matchMedia('(prefers-reduced-motion: reduce)')`，
 * 完全无视应用内的 reduceMotion 开关，导致用户在外观设置里关掉"减少动效"后
 * 动画依然被 OS 信号压平——开关形同虚设。
 *
 * 现在统一改由应用开关决定：
 *  - 应用开关开启 → 一律降级（即使 OS 未报 reduce）
 *  - 应用开关关闭 → 一律不降级（尊重用户显式选择，即使 OS 报 reduce）
 *
 * 这样开关才有意义；CSS 侧的 `@media (prefers-reduced-motion: reduce)` 已移除，
 * 改由 useAppearanceStore 写入 `data-reduce-motion` dataset + index.css 收紧的选择器控制。
 */

/**
 * 是否应该降级动效。**唯一权威判断入口**。
 *
 * 决策：只看应用内 reduceMotion 开关。
 * - true  → 降级（动画瞬时、过渡跳终值、时钟降频）
 * - false → 不降级（动画正常播放）
 *
 * 在 SSR / Node 环境（无 window）返回 false，避免主进程或测试环境报错。
 */
export function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return useAppearanceStore.getState().reduceMotion;
}

/**
 * 是否"显式或隐式"偏好减少动效。
 *
 * 兼容语义：应用开关开启，或 OS 系统层报 reduce。
 * 目前仅用于 CrisisInterventionModal 的警报音频降级——
 * 警报音频涉及无障碍，OS 层偏好仍应被尊重，即使用户未在应用内开关。
 * 其余动画/过渡场景一律用 {@link shouldReduceMotion}。
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  if (useAppearanceStore.getState().reduceMotion) return true;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
