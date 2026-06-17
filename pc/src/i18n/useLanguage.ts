import { create } from 'zustand';
import type { Lang, TranslationKey } from './translations';
import { translations } from './translations';

interface LanguageState {
  lang: Lang;
  initialized: boolean;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const getInitialLang = (): Lang => {
  const stored = localStorage.getItem('lifeos_lang');
  if (stored === 'en' || stored === 'zh-CN') return stored;
  // Detect browser language
  const browserLang = navigator.language;
  return browserLang.startsWith('zh') ? 'zh-CN' : 'en';
};

export const useLanguage = create<LanguageState>((set, get) => ({
  lang: getInitialLang(),
  initialized: !!localStorage.getItem('lifeos_lang'),
  setLang: (lang: Lang) => {
    localStorage.setItem('lifeos_lang', lang);
    set({ lang, initialized: true });
    document.documentElement.lang = lang === 'zh-CN' ? 'zh-CN' : 'en';
  },
  t: (key: TranslationKey, params?: Record<string, string | number>) => {
    const { lang } = get();
    let text = translations[lang][key] || key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replaceAll(`{${k}}`, String(v));
      }
    }
    return text;
  },
}));
