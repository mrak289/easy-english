import { createContext, useContext, useState } from 'react';
import { en } from '../i18n/en';
import { uk } from '../i18n/uk';

const translations = { en, uk };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  const t = translations[lang];
  const toggleLang = () => setLang(l => l === 'en' ? 'uk' : 'en');

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
