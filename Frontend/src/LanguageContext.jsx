import { createContext, useContext, useState, useCallback } from 'react';
import translations, { translateSpecKey, translateSpecValue, translateCategoryName } from './translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('sritech-lang') || 'ta';
    } catch {
      return 'ta';
    }
  });

  // Always show the welcome page / language selector popup on page refresh
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    setHasSelectedLanguage(true);
    try {
      localStorage.setItem('sritech-lang', lang);
      localStorage.setItem('sritech-lang-set', 'true');
    } catch {}
  }, []);

  const openLanguageSelector = useCallback(() => {
    setHasSelectedLanguage(false);
  }, []);

  // t('hero.badge', 'Optional Fallback') → translations[language].hero.badge
  const t = useCallback((key, fallbackDefault) => {
    if (!key) return '';
    const keys = key.split('.');
    let val = translations[language];
    for (const k of keys) {
      if (val && typeof val === 'object' && k in val) {
        val = val[k];
      } else {
        val = undefined;
        break;
      }
    }
    if (val !== undefined && val !== null) return val;

    // Fallback to English
    let fallback = translations.en;
    for (const fk of keys) {
      if (fallback && typeof fallback === 'object' && fk in fallback) {
        fallback = fallback[fk];
      } else {
        fallback = undefined;
        break;
      }
    }
    if (fallback !== undefined && fallback !== null) return fallback;

    return fallbackDefault !== undefined ? fallbackDefault : key;
  }, [language]);

  const translateKey = useCallback((key) => {
    return translateSpecKey(key, language);
  }, [language]);

  const translateVal = useCallback((val) => {
    return translateSpecValue(val, language);
  }, [language]);

  const translateCat = useCallback((cat) => {
    return translateCategoryName(cat, language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      openLanguageSelector,
      t,
      hasSelectedLanguage,
      setHasSelectedLanguage,
      translateKey,
      translateVal,
      translateCat
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export default LanguageContext;
