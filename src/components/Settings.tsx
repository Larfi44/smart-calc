import React, { useEffect, useState } from 'react';
import type { Language, Theme } from '../types';

interface SettingsProps {
  t: any;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  t,
  language,
  setLanguage,
  theme,
  setTheme,
}) => {
  const [isTauri, setIsTauri] = useState(false);

  const handleExternalLink = async (
    e: React.MouseEvent<HTMLAnchorElement>,
    url: string,
  ) => {
    if (isTauri) {
      e.preventDefault();
      try {
        const { openUrl } = await import('@tauri-apps/plugin-opener');
        await openUrl(url);
      } catch (err) {
        console.error('Failed to open URL:', err);
        window.open(url, '_blank');
      }
    }
  };

  useEffect(() => {
    const checkTauri = () => {
      // @ts-ignore
      const hasTauri = !!(window.__TAURI__ || window.__TAURI_INTERNALS__);
      setIsTauri(hasTauri);
    };

    checkTauri();

    // Проверяем снова через небольшую задержку, так как Tauri может загружаться асинхронно
    const timer = setTimeout(checkTauri, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="settings-mode">
      <h2>⚙️ {t.settings}</h2>

      <div className="settings-section">
        <h3>{t.language}</h3>
        <div className="language-selector">
          <button
            className={`lang-btn ${language === 'en' ? 'active' : ''}`}
            onClick={() => setLanguage('en')}
          >
            🇬🇧 {t.english}
          </button>
          <button
            className={`lang-btn ${language === 'ru' ? 'active' : ''}`}
            onClick={() => setLanguage('ru')}
          >
            🇷🇺 {t.russian}
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3>{t.theme}</h3>
        <div className="language-selector">
          <button
            className={`lang-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => setTheme('light')}
          >
            ☀️ {t.lightTheme}
          </button>
          <button
            className={`lang-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            🌙 {t.darkTheme}
          </button>
          <button
            className={`lang-btn ${theme === 'auto' ? 'active' : ''}`}
            onClick={() => setTheme('auto')}
          >
            🔄 {t.autoTheme}
          </button>
        </div>
      </div>

      {!isTauri && (
        <div className="settings-section">
          <a
            href="https://github.com/Larfi44/smart-calc/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="download-android-btn"
          >
            📥 {t.downloadAndroid}
          </a>
        </div>
      )}

      <div className="settings-footer-centered">
        <p className="dev-by">
          {t.developedBy}{' '}
          <a
            href="https://larfi44.github.io/Yarik-Studio.github.io/index.html"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) =>
              handleExternalLink(
                e,
                'https://larfi44.github.io/Yarik-Studio.github.io/index.html',
              )
            }
          >
            Yarik Studio
          </a>
        </p>

        <a
          className="donate-btn"
          href="https://pay.cloudtips.ru/p/b94e349b"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) =>
            handleExternalLink(e, 'https://pay.cloudtips.ru/p/b94e349b')
          }
        >
          {t.donate}
        </a>
      </div>
    </div>
  );
};
