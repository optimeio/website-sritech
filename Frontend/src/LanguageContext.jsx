import { createContext, useContext, useState, useCallback } from 'react';
import translations from './translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('sritech-lang') || 'ta';
    } catch {
      return 'ta';
    }
  });

  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    setHasSelectedLanguage(true);
    try {
      localStorage.setItem('sritech-lang', lang);
      localStorage.setItem('sritech-lang-set', 'true');
    } catch {}
  }, []);

  // t('hero.badge') → translations[language].hero.badge
  const t = useCallback((key) => {
    const keys = key.split('.');
    let val = translations[language];
    for (const k of keys) {
      if (val && typeof val === 'object' && k in val) {
        val = val[k];
      } else {
        // Fallback to English
        let fallback = translations.en;
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in fallback) {
            fallback = fallback[fk];
          } else {
            return key; // return the key itself as last resort
          }
        }
        return fallback;
      }
    }
    return val;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, hasSelectedLanguage }}>
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
