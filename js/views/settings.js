// Vanilla port of src/components/Settings.tsx
import { el } from '../utils/dom.js';

const LINK_RUSTORE =
  'https://www.rustore.ru/catalog/app/com.yarikstudio.smartcalc';
const LINK_SITE = 'https://larfi.gitverse.site/yarik-studio/index.html';
const LINK_SUPPORT = 'https://larfi44.github.io/yarik-studio/pages/support.html';
const LINK_DONATE = 'https://pay.cloudtips.ru/p/b94e349b';

export const mountSettings = (container, ctx) => {
  const t = ctx.t;

  let isTauri = false;

  const handleExternalLink = async (event, url) => {
    if (!isTauri) return; // plain browser: let the link work as usual

    event.preventDefault();
    try {
      // The Tauri webview cannot resolve bare npm specifiers at runtime, so the
      // globally exposed plugin API (app.withGlobalTauri) is preferred.
      const opener = window.__TAURI__ && window.__TAURI__.opener;
      if (opener && opener.openUrl) {
        await opener.openUrl(url);
        return;
      }
      const { openUrl } = await import('@tauri-apps/plugin-opener');
      await openUrl(url);
    } catch (err) {
      console.error('Failed to open URL:', err);
      window.open(url, '_blank');
    }
  };

  const externalLink = (className, text, url) => {
    const link = el('a', className, text);
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.addEventListener('click', (event) => handleExternalLink(event, url));
    return link;
  };

  const root = el('div', 'settings-mode');
  root.appendChild(el('h2', '', `⚙️ ${t.settings}`));

  // --- language -------------------------------------------------------------
  const languageSection = el('div', 'settings-section');
  languageSection.appendChild(el('h3', '', t.language));
  const languageSelector = el('div', 'language-selector');
  const languageButtons = [
    { value: 'en', label: `🇬🇧 ${t.english}` },
    { value: 'ru', label: `🇷🇺 ${t.russian}` },
  ].map((entry) => {
    const button = el('button', 'lang-btn', entry.label);
    button.type = 'button';
    button.dataset.value = entry.value;
    button.addEventListener('click', () => {
      ctx.setLanguage(entry.value);
      syncActive();
    });
    languageSelector.appendChild(button);
    return button;
  });
  languageSection.appendChild(languageSelector);
  root.appendChild(languageSection);

  // --- theme ----------------------------------------------------------------
  const themeSection = el('div', 'settings-section');
  themeSection.appendChild(el('h3', '', t.theme));
  const themeSelector = el('div', 'language-selector');
  const themeButtons = [
    { value: 'light', label: `☀️ ${t.lightTheme}` },
    { value: 'dark', label: `🌙 ${t.darkTheme}` },
    { value: 'auto', label: `🔄 ${t.autoTheme}` },
  ].map((entry) => {
    const button = el('button', 'lang-btn', entry.label);
    button.type = 'button';
    button.dataset.value = entry.value;
    button.addEventListener('click', () => {
      ctx.setTheme(entry.value);
      syncActive();
    });
    themeSelector.appendChild(button);
    return button;
  });
  themeSection.appendChild(themeSelector);
  root.appendChild(themeSection);

  // --- Android download (hidden inside the Tauri app) -----------------------
  const downloadSection = el('div', 'settings-section download-section');
  downloadSection.appendChild(
    externalLink('download-android-btn', `📥 ${t.downloadAndroid}`, LINK_RUSTORE),
  );
  root.appendChild(downloadSection);

  // --- footer ---------------------------------------------------------------
  const footer = el('div', 'settings-footer-centered');
  const devBy = el('p', 'dev-by', `${t.developedBy} `);
  devBy.appendChild(externalLink('', 'Yarik Studio', LINK_SITE));
  footer.appendChild(devBy);
  footer.appendChild(externalLink('support-btn', t.technicalSupport, LINK_SUPPORT));
  footer.appendChild(externalLink('donate-btn', t.donate, LINK_DONATE));
  root.appendChild(footer);

  const syncActive = () => {
    const activeLanguage = ctx.getLanguage();
    const activeTheme = ctx.getTheme();

    languageButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.value === activeLanguage);
    });
    themeButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.value === activeTheme);
    });
  };

  const syncTauri = () => {
    // @ts-ignore – set by the Tauri runtime
    isTauri = !!(window.__TAURI__ || window.__TAURI_INTERNALS__);
    downloadSection.style.display = isTauri ? 'none' : '';
  };

  container.innerHTML = '';
  container.appendChild(root);
  syncActive();

  syncTauri();
  const tauriTimer = setTimeout(syncTauri, 500);

  return {
    el: root,
    refresh: syncActive,
    destroy: () => clearTimeout(tauriTimer),
  };
};
