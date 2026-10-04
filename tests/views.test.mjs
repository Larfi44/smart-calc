// Smoke tests for the vanilla views: every view is mounted into a jsdom
// document and driven through real DOM events, then the rendered markup is
// asserted. Run with `npm test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { translations } from '../js/constants/translations.js';

const t = translations.ru;

let moduleCounter = 0;

const setupDom = () => {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="root"></div></body></html>',
    { url: 'http://localhost/' },
  );
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  return dom;
};

// Fresh module instance per test so that module-level view state is isolated
const loadView = (name) =>
  import(`../js/views/${name}.js?test=${(moduleCounter += 1)}`);

const fire = (element, type) =>
  element.dispatchEvent(new globalThis.window.Event(type, { bubbles: true }));

const setInput = (element, value) => {
  element.value = value;
  fire(element, 'input');
};

test('calculator: 7 × 8 = 56', async () => {
  setupDom();
  const { mountCalculator } = await loadView('calculator');
  const container = document.getElementById('root');
  const view = mountCalculator(container, { t });

  const click = (selector) => {
    const button = container.querySelector(selector);
    assert.ok(button, `missing button ${selector}`);
    button.click();
  };

  click('[data-action="clear"]');
  click('[data-action="number"][data-value="7"]');
  click('[data-action="operator"][data-value="×"]');
  click('[data-action="number"][data-value="8"]');
  click('[data-action="equal"]');

  assert.equal(container.querySelector('.display-value').textContent, '56');
  assert.match(container.querySelector('.equation').textContent, /7/);

  view.destroy?.();
});

test('calculator: history toggle and scientific mode', async () => {
  setupDom();
  const { mountCalculator } = await loadView('calculator');
  const container = document.getElementById('root');
  mountCalculator(container, { t });

  container.querySelector('[data-action="calc-type"][data-value="scientific"]').click();
  assert.equal(
    container
      .querySelector('.calc-type-btn.active')
      .getAttribute('data-value'),
    'scientific',
  );
  assert.match(container.textContent, /sin/);

  container.querySelector('[data-action="calc-type"][data-value="normal"]').click();
  assert.equal(
    container.querySelector('[data-action="toggle-history"]') !== null,
    true,
  );
});

test('converter: 5 meters → kilometers', async () => {
  setupDom();
  const { mountConverter } = await loadView('converter');
  const container = document.getElementById('root');
  mountConverter(container, { t: { ...t, language: 'ru' }, language: 'ru' });

  const valueInput = container.querySelector('.converter-inputs input[type="number"]');
  setInput(valueInput, '5');
  container.querySelector('.convert-btn').click();

  const result = container.querySelector('.conversion-result');
  assert.ok(result, 'result block rendered');
  assert.match(result.textContent, /5 Метры = 0\.005 Километры/);
  assert.match(result.querySelector('.exchange-rate').textContent, /1 Метр = 0\.001/);
});

test('converter: switching type resets units and result', async () => {
  setupDom();
  const { mountConverter } = await loadView('converter');
  const container = document.getElementById('root');
  mountConverter(container, { t: { ...t, language: 'ru' }, language: 'ru' });

  const temperatureButton = container.querySelector(
    '[data-type="temperature"]',
  );
  temperatureButton.click();

  assert.ok(temperatureButton.classList.contains('active'));
  assert.equal(container.querySelector('.conversion-result'), null);
  const labels = [...container.querySelectorAll('.select-value')].map(
    (node) => node.textContent,
  );
  assert.deepEqual(labels, ['°Цельсия', '°Фаренгейта']);

  setInput(
    container.querySelector('.converter-inputs input[type="number"]'),
    '100',
  );
  container.querySelector('.convert-btn').click();
  assert.match(
    container.querySelector('.conversion-result').textContent,
    /212/,
  );
});

test('timer: date difference and countdown', async () => {
  setupDom();
  const { mountTimer } = await loadView('timer');
  const container = document.getElementById('root');
  const view = mountTimer(container, { t });

  const [date1, date2] = container.querySelectorAll('input[type="datetime-local"]');
  setInput(date1, '2024-01-01T00:00');
  setInput(date2, '2024-01-02T00:00');

  // first .add-event-btn is the "calculate" button
  container.querySelectorAll('.add-event-btn')[0].click();
  const difference = container.querySelector('.time-difference-result');
  assert.ok(difference, 'difference rendered');
  assert.match(difference.textContent, /1д 0ч 0м 0с/);

  // countdown inputs replace the display until a duration is started
  const countdownInputs = container.querySelectorAll('.countdown-inputs input');
  setInput(countdownInputs[2], '30');
  container.querySelectorAll('.add-event-btn')[1].click();

  assert.equal(container.querySelector('.countdown-time').textContent, '00:00:30');
  assert.equal(
    container.querySelector('.countdown-inputs').style.display,
    'none',
  );

  container.querySelectorAll('.preset-btn')[1].click(); // reset
  assert.equal(container.querySelector('.countdown-time').textContent, '00:00:00');
  assert.equal(container.querySelector('.countdown-inputs').style.display, '');

  view.destroy();
});

test('currency: converts USD → RUB and swaps', async () => {
  setupDom();
  const originalFetch = globalThis.fetch;
  // stay offline: rates fall back to the bundled table (1 USD = 71 RUB)
  globalThis.fetch = () => Promise.reject(new Error('offline'));
  try {
    const { mountCurrency } = await loadView('currency');
    const container = document.getElementById('root');
    mountCurrency(container, { t, language: 'ru' });

    const amount = container.querySelector(
      '.currency-inputs input[type="number"]',
    );
    setInput(amount, '10');
    container.querySelector('.convert-currency-btn').click();

    const result = container.querySelector('.currency-result');
    assert.ok(result, 'result rendered');
    assert.match(result.textContent, /10 Доллар США \(\$\) = 710/);
    assert.match(
      result.querySelector('.exchange-rate').textContent,
      /1 USD = 71\.0000 RUB/,
    );

    container.querySelector('.swap-btn').click();
    assert.equal(container.querySelector('.currency-result'), null);
    assert.deepEqual(
      [...container.querySelectorAll('.select-value')].map((n) => n.textContent),
      ['Российский Рубль (₽)', 'Доллар США ($)'],
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('randomizer: numbers and list mode', async () => {
  setupDom();
  const { mountRandomizer } = await loadView('randomizer');
  const container = document.getElementById('root');
  mountRandomizer(container, { t });

  const rangeInputs = container.querySelectorAll(
    '.randomizer-range input[type="number"]',
  );
  setInput(rangeInputs[0], '5'); // min
  setInput(rangeInputs[1], '5'); // max

  const numberInputs = container.querySelectorAll(
    '.randomizer-inputs input[type="number"]',
  );
  setInput(numberInputs[numberInputs.length - 1], '3'); // amount

  container.querySelector('.randomizer-run-btn').click();
  const numberResults = [...container.querySelectorAll('.randomizer-result-item')];
  assert.equal(numberResults.length, 3);
  numberResults.forEach((item) => assert.equal(item.textContent, '5'));

  // switch to list mode and draw from the typed list
  container.querySelectorAll('.randomizer-tab')[1].click();
  assert.equal(
    container.querySelector('.randomizer-range').style.display,
    'none',
  );

  setInput(container.querySelector('.randomizer-textarea'), 'яблоко\nбанан\n');
  container.querySelector('.randomizer-clear-btn').click();
  container.querySelector('.randomizer-run-btn').click();

  const listResults = [...container.querySelectorAll('.randomizer-result-item')];
  assert.equal(listResults.length, 3);
  listResults.forEach((item) =>
    assert.ok(['яблоко', 'банан'].includes(item.textContent)),
  );

  container.querySelector('.randomizer-clear-btn').click();
  assert.equal(container.querySelectorAll('.randomizer-result-item').length, 0);
  assert.equal(
    container.querySelector('.randomizer-clear-btn').style.display,
    'none',
  );
});

test('settings: language, theme and download link', async () => {
  setupDom();
  const { mountSettings } = await loadView('settings');
  const container = document.getElementById('root');

  let language = 'ru';
  let theme = 'auto';
  const calls = [];

  const view = mountSettings(container, {
    t,
    getLanguage: () => language,
    getTheme: () => theme,
    setLanguage: (value) => {
      language = value;
      calls.push(`lang:${value}`);
    },
    setTheme: (value) => {
      theme = value;
      calls.push(`theme:${value}`);
    },
  });

  const selectors = container.querySelectorAll(
    '.settings-section .language-selector',
  );
  const languageButtons = selectors[0].querySelectorAll('.lang-btn');
  const themeButtons = selectors[1].querySelectorAll('.lang-btn');

  assert.equal(languageButtons[1].classList.contains('active'), true); // ru
  assert.equal(themeButtons[2].classList.contains('active'), true); // auto

  languageButtons[0].click();
  themeButtons[1].click();

  assert.deepEqual(calls, ['lang:en', 'theme:dark']);
  assert.equal(languageButtons[0].classList.contains('active'), true);
  assert.equal(languageButtons[1].classList.contains('active'), false);
  assert.equal(themeButtons[1].classList.contains('active'), true);

  // a plain browser (no Tauri globals) keeps the APK download link visible
  const download = container.querySelector('.download-section');
  assert.equal(download.style.display, '');
  assert.equal(
    download.querySelector('a').getAttribute('href'),
    'https://www.rustore.ru/catalog/app/com.yarikstudio.smartcalc',
  );

  view.destroy();
});

test('header and menu nav render and report clicks', async () => {
  setupDom();
  const { renderHeader } = await loadView('header');
  const { renderMenuNav } = await loadView('menuNav');

  const header = document.createElement('header');
  document.body.appendChild(header);
  renderHeader(header, t);
  assert.equal(header.className, 'header');
  assert.equal(header.querySelector('h1').textContent, t.title);

  const nav = document.createElement('nav');
  document.body.appendChild(nav);
  const changes = [];
  renderMenuNav(nav, {
    mode: 'calculator',
    items: [
      { id: 'calculator', icon: '🔢', label: t.calculator },
      { id: 'converter', icon: '🔄', label: t.converter },
    ],
    onModeChange: (id) => changes.push(id),
  });

  assert.equal(nav.className, 'menu-nav');
  assert.equal(nav.querySelectorAll('.menu-btn').length, 2);
  assert.equal(
    nav.querySelector('.menu-btn.active').textContent,
    `🔢${t.calculator}`,
  );

  nav.querySelectorAll('.menu-btn')[1].click();
  assert.deepEqual(changes, ['converter']);
});

