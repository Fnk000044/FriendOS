import { create } from 'zustand';
import type { Lang, TranslationKey } from './translations';
import { translations } from './translations';

interface LanguageState {
  lang: Lang;
  initialized: boolean;
  setLang: (lang: Lang) => void;
  reset: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const getInitialLang = (): Lang => {
  const stored = localStorage.getItem('lifeos_lang');
  if (stored === 'en' || stored === 'zh-CN') return stored;
  // Detect browser language
  const browserLang = navigator.language;
  return browserLang.startsWith('zh') ? 'zh-CN' : 'en';
};

/**
 * 同步 document.title 与 <html lang> —— 在 store 创建时立即执行一次，
 * 之后每次 setLang 都会同步。这样 index.html 的硬编码 <title>知己</title>
 * 在 React 挂载前就能被替换为当前语言的 app.title，避免首帧闪现中英文不一致。
 */
function syncDocumentAttrs(lang: Lang) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang === 'zh-CN' ? 'zh-CN' : 'en';
  const title = translations[lang]['app.title'];
  if (title) document.title = title;
}

export const useLanguage = create<LanguageState>((set, get) => {
  const initialLang = getInitialLang();
  // 启动时同步一次（在 React 挂载之前，避免标题闪烁）
  syncDocumentAttrs(initialLang);

  return {
    lang: initialLang,
    initialized: !!localStorage.getItem('lifeos_lang'),
    setLang: (lang: Lang) => {
      localStorage.setItem('lifeos_lang', lang);
      set({ lang, initialized: true });
      syncDocumentAttrs(lang);
    },
    reset: () => {
      localStorage.removeItem('lifeos_lang');
      set({ initialized: false });
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
  };
});
