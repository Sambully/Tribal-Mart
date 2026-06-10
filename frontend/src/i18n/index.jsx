import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import en from './en.json';
import hi from './hi.json';

const DICTS = { en, hi };
const STORAGE_KEY = 'tm_lang';

const I18nContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
});

export const I18nProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'hi' || saved === 'en' ? saved : 'en';
    } catch { return 'en'; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = useCallback((next) => {
    if (next === 'en' || next === 'hi') setLangState(next);
  }, []);

  const t = useCallback((key, fallback) => {
    const dict = DICTS[lang] || DICTS.en;
    if (key in dict) return dict[key];
    // Fallback to English dictionary if the key exists there
    if (key in DICTS.en) return DICTS.en[key];
    return fallback ?? key;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
export const useT = () => {
  const { t } = useContext(I18nContext);
  return t;
};

/**
 * <T k="dashboard">Dashboard</T> — fallback to children if key missing
 */
export const T = ({ k, children }) => {
  const { t } = useContext(I18nContext);
  return <>{t(k, children)}</>;
};

export default I18nProvider;
