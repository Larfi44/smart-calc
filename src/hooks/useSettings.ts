import { useState, useEffect } from 'react';
import type { Language, Theme } from '../types';

export const useSettings = () => {
  const getInitialLanguage = (): Language => {
    const saved = localStorage.getItem('calculator_language');
    if (saved === 'ru' || saved === 'en') return saved;
    return window.navigator.language.startsWith('ru') ? 'ru' : 'en';
  };

  const getInitialTheme = (): Theme => {
    const saved = localStorage.getItem('calculator_theme');
    if (saved === 'light' || saved === 'dark' || saved === 'auto') return saved;
    return 'auto';
  };

  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    localStorage.setItem('calculator_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('calculator_theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'auto' && prefersDark);
    isDark ? root.classList.add('dark-theme') : root.classList.remove('dark-theme');
  }, [theme]);

  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => {
        const root = document.documentElement;
        mediaQuery.matches ? root.classList.add('dark-theme') : root.classList.remove('dark-theme');
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  return { language, setLanguage, theme, setTheme };
};
