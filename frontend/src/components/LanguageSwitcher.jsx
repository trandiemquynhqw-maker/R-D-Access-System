import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { normalizeLanguage } from '../store/languageStore';

const LanguageSwitcher = ({ theme = 'light' }) => {
  const { i18n } = useTranslation();
  const language = normalizeLanguage(i18n.resolvedLanguage || i18n.language);

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'vi' : 'en';
    localStorage.setItem('language', newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  const baseClasses = "flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-bold border backdrop-blur-sm shadow-sm";
  const lightClasses = "text-graphite hover:bg-primary/5 hover:text-primary border-fog hover:border-primary/20 bg-white/50";
  const darkClasses = "text-white/90 hover:bg-white/10 hover:text-white border-white/20 hover:border-white/40 bg-white/5";
  
  const themeClasses = theme === 'dark' ? darkClasses : lightClasses;

  return (
    <button
      onClick={toggleLanguage}
      className={`${baseClasses} ${themeClasses}`}
      title={language === 'en' ? 'Đổi sang tiếng Việt' : 'Switch to English'}
      aria-label={language === 'en' ? 'Đổi sang tiếng Việt' : 'Switch to English'}
    >
      <Globe size={16} />
      <span>
        {language === 'en' ? 'VI' : 'EN'}
      </span>
    </button>
  );
};

export default LanguageSwitcher;
