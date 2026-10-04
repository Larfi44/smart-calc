// Integration test: boots the real entry point (js/main.js) in jsdom and drives
// the shell the way a user would — menu navigation, theme and language changes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const bootApp = async () => {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="root"></div></body></html>',
    { url: 'http://localhost/', pretendToBeVisual: true },
  );
  // jsdom has no matchMedia; the app uses it for the "auto" theme.
  dom.window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  });

  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  Object.defineProperty(globalThis, 'navigator', {
    value: dom.window.navigator,
    configurable: true,
  });

  // main.js mounts into #root as soon as it is evaluated
  await import('../js/main.js?app-boot');
  return dom;
};

test('app shell: boot, navigation, theme and language', async () => {
  const dom = await bootApp();
  const root = document.getElementById('root');

  // --- boot: header, menu and the calculator view ---------------------------
  assert.ok(root.querySelector('.app .app-container'));
  assert.equal(root.querySelectorAll('.header h1').length, 1);
  const menuButtons = [...root.querySelectorAll('.menu-btn')];
  assert.equal(menuButtons.length, 6);
  assert.equal(menuButtons[0].classList.contains('active'), true);
  assert.ok(root.querySelector('.display-value'), 'calculator mounted');

  // a fresh install defaults to the system language (en-US in jsdom)
  assert.equal(localStorage.getItem('calculator_language'), 'en');
  assert.equal(localStorage.getItem('calculator_theme'), 'auto');

  // --- navigation: the calculator data is replaced by the converter ---------
  menuButtons[1].click(); // converter
  assert.ok(root.querySelector('.convert-btn'), 'converter mounted');
  assert.equal(root.querySelector('.display-value'), null);
  assert.equal(
    root.querySelectorAll('.menu-btn')[1].classList.contains('active'),
    true,
  );

  // --- theme: the settings view drives the document class ------------------
  root.querySelectorAll('.menu-btn')[5].click(); // settings
  assert.ok(root.querySelector('.settings-section'), 'settings mounted');

  const themeButtons = root.querySelectorAll(
    '.settings-section .language-selector',
  )[1].querySelectorAll('.lang-btn');
  themeButtons[1].click(); // dark

  assert.equal(localStorage.getItem('calculator_theme'), 'dark');
  assert.equal(
    document.documentElement.classList.contains('dark-theme'),
    true,
  );

  themeButtons[0].click(); // light
  assert.equal(localStorage.getItem('calculator_theme'), 'light');
  assert.equal(
    document.documentElement.classList.contains('dark-theme'),
    false,
  );

  // --- language: switching re-renders the whole shell ----------------------
  const languageButtons = root.querySelectorAll(
    '.settings-section .language-selector',
  )[0].querySelectorAll('.lang-btn');
  languageButtons[1].click(); // ru (index 0 is English)

  assert.equal(localStorage.getItem('calculator_language'), 'ru');
  assert.equal(
    root.querySelector('.menu-btn.active').textContent.includes('Настройки'),
    true,
    'menu re-rendered in Russian',
  );

  // --- back to the calculator, now in Russian ------------------------------
  root.querySelectorAll('.menu-btn')[0].click();
  assert.ok(root.querySelector('.display-value'), 'calculator mounted again');

  dom.window.close();
});
