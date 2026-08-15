import { useEffect } from 'react';
<<<<<<< HEAD
import toast from 'react-hot-toast';
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
import { useLanguage } from '../i18n/useLanguage';
import type { Lang } from '../i18n/translations';

export function useIpcEvents() {
  const setLang = useLanguage((s) => s.setLang);
<<<<<<< HEAD
  const t = useLanguage((s) => s.t);
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    const langCleanup = api.onSetLanguage((lang: string) => {
      setLang(lang as Lang);
    }) as unknown as (() => void) | undefined;

<<<<<<< HEAD
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
=======
    return () => {
      if (typeof langCleanup === 'function') langCleanup();
    };
  }, [setLang]);
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
}
