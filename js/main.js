// Vanilla entry point — replaces src/index.tsx + src/App.tsx
import { translations } from './constants/translations.js';
import { renderHeader } from './views/header.js';
import { renderMenuNav } from './views/menuNav.js';
import { mountCalculator } from './views/calculator.js';
import { mountConverter } from './views/converter.js';
import { mountCurrency } from './views/currency.js';
import { mountTimer } from './views/timer.js';
import { mountRandomizer } from './views/randomizer.js';
import { mountSettings } from './views/settings.js';
import { el } from './utils/dom.js';

const LANGUAGE_KEY = 'calculator_language';
const THEME_KEY = 'calculator_theme';

// --- settings (port of src/hooks/useSettings.ts) ----------------------------
const getInitialLanguage = () => {
  const saved = localStorage.getItem(LANGUAGE_KEY);
  if (saved === 'ru' || saved === 'en') return saved;

  // Detect system/browser language: check navigator.languages, navigator.language,
  // and Intl locale for broader compatibility (Tauri Android, Web, etc.)
  const lang = (
    navigator.languages?.[0] ||
    navigator.language ||
    Intl.DateTimeFormat().resolvedOptions().locale ||
    ''
  ).toLowerCase();
  return lang.startsWith('ru') ? 'ru' : 'en';
};

const getInitialTheme = () => {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark' || saved === 'auto') return saved;
  return 'auto';
};

let language = getInitialLanguage();
let theme = getInitialTheme();
let mode = 'calculator';
let currentView = null;
let systemThemeMedia = null;

const applyTheme = () => {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'auto' && prefersDark);
  if (isDark) root.classList.add('dark-theme');
  else root.classList.remove('dark-theme');
};

const handleSystemThemeChange = () => applyTheme();

const watchSystemTheme = () => {
  if (systemThemeMedia) {
    systemThemeMedia.removeEventListener('change', handleSystemThemeChange);
    systemThemeMedia = null;
  }
  if (theme !== 'auto') return;
  systemThemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
  systemThemeMedia.addEventListener('change', handleSystemThemeChange);
};

const setTheme = (next) => {
  theme = next;
  localStorage.setItem(THEME_KEY, theme);
  applyTheme();
  watchSystemTheme();
};

const setLanguage = (next) => {
  if (language === next) return;
  language = next;
  localStorage.setItem(LANGUAGE_KEY, language);
  renderApp();
};

// --- app shell --------------------------------------------------------------
const rootElement = document.getElementById('root');
const appElement = el('div', 'app');
const containerElement = el('div', 'app-container');
const headerElement = document.createElement('header');
const navElement = document.createElement('nav');
const mainElement = el('main', 'main-content');

containerElement.appendChild(headerElement);
containerElement.appendChild(navElement);
containerElement.appendChild(mainElement);
appElement.appendChild(containerElement);
rootElement.appendChild(appElement);

const viewContext = () => ({
  t: translations[language],
  language,
  getLanguage: () => language,
  getTheme: () => theme,
  setLanguage,
  setTheme,
});

const renderView = () => {
  if (currentView && currentView.destroy) currentView.destroy();
  const ctx = viewContext();

  switch (mode) {
    case 'converter':
      currentView = mountConverter(mainElement, ctx);
      break;
    case 'timer':
      currentView = mountTimer(mainElement, ctx);
      break;
    case 'currency':
      currentView = mountCurrency(mainElement, ctx);
      break;
    case 'randomizer':
      currentView = mountRandomizer(mainElement, ctx);
      break;
    case 'settings':
      currentView = mountSettings(mainElement, ctx);
      break;
    default:
      currentView = mountCalculator(mainElement, ctx);
  }
};

const setMode = (next) => {
  if (mode === next) return;
  mode = next;
  renderApp();
};

const renderApp = () => {
  const t = translations[language];

  renderHeader(headerElement, t);

  renderMenuNav(navElement, {
    mode,
    items: [
      { id: 'calculator', icon: '🔢', label: t.calculator },
      { id: 'converter', icon: '🔄', label: t.converter },
      { id: 'timer', icon: '⏰', label: t.timer },
      { id: 'currency', icon: '💱', label: t.currency },
      { id: 'randomizer', icon: '🎲', label: t.randomizer },
      { id: 'settings', icon: '⚙️', label: t.settings },
    ],
    onModeChange: setMode,
  });

  renderView();
};

// --- boot -------------------------------------------------------------------
localStorage.setItem(LANGUAGE_KEY, language);
localStorage.setItem(THEME_KEY, theme);
applyTheme();
watchSystemTheme();
renderApp();
