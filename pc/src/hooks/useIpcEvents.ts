import { useEffect } from 'react';
import { useLanguage } from '../i18n/useLanguage';
import type { Lang } from '../i18n/translations';

export function useIpcEvents() {
  const setLang = useLanguage((s) => s.setLang);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    const langCleanup = api.onSetLanguage((lang: string) => {
      setLang(lang as Lang);
    }) as unknown as (() => void) | undefined;

    return () => {
      if (typeof langCleanup === 'function') langCleanup();
    };
  }, [setLang]);
}
