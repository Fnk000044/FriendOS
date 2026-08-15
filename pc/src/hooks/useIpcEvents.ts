import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/useLanguage';
import type { Lang } from '../i18n/translations';

export function useIpcEvents() {
  const setLang = useLanguage((s) => s.setLang);
  const t = useLanguage((s) => s.t);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    const langCleanup = api.onSetLanguage((lang: string) => {
      setLang(lang as Lang);
    }) as unknown as (() => void) | undefined;

    // P2-12：主进程降级（未捕获异常/未处理拒绝）→ 用户可感知的提示
    // 主进程只在降级状态跃迁时发一次，这里无需额外去重
    const degradedCleanup = (api.onMainDegraded?.((info: { message: string }) => {
      toast.error(t('main.degraded_toast', { message: info?.message || '' }), { duration: 8000 });
    }) ?? (() => {})) as unknown as () => void;

    return () => {
      if (typeof langCleanup === 'function') langCleanup();
      degradedCleanup();
    };
  }, [setLang, t]);
}
