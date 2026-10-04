// Vanilla port of src/components/Randomizer.tsx
import { el, escapeHtml } from '../utils/dom.js';

// All randomizer state is component-local in React, so it resets every time the
// view is opened — mirrored here with state created on every mount.
export const mountRandomizer = (container, ctx) => {
  const t = ctx.t;

  const state = {
    minValue: '1',
    maxValue: '100',
    amount: '1',
    results: [],
    listMode: false,
    listInput: '',
    listResults: [],
  };

  const runRandom = () => {
    const min = parseFloat(state.minValue);
    const max = parseFloat(state.maxValue);
    const count = Math.min(parseInt(state.amount, 10) || 1, 100);

    if (isNaN(min) || isNaN(max) || min > max) return;

    // Detect decimal precision from input values
    const getPrecision = (s) => {
      const dot = s.indexOf('.');
      return dot === -1 ? 0 : s.length - dot - 1;
    };
    const precision = Math.max(
      getPrecision(state.minValue),
      getPrecision(state.maxValue),
    );

    const nums = [];
    for (let i = 0; i < count; i++) {
      let r = Math.random() * (max - min) + min;
      if (precision === 0) {
        r = Math.round(r);
        nums.push(r.toString());
      } else {
        nums.push(r.toFixed(precision));
      }
    }
    state.results = nums;
  };

  const runList = () => {
    const items = state.listInput
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (items.length === 0) return;

    const count = Math.min(parseInt(state.amount, 10) || 1, 100);
    const picks = [];
    for (let i = 0; i < count; i++) {
      picks.push(items[Math.floor(Math.random() * items.length)]);
    }
    state.listResults = picks;
  };

  const clearAll = () => {
    state.results = [];
    state.listResults = [];
  };

  const root = el('div', 'randomizer-mode');
  root.appendChild(el('h2', '', `🎲 ${t.randomizerTitle}`));

  const tabs = el('div', 'randomizer-tabs');
  const numbersTab = el('button', 'randomizer-tab', t.randomizerNumbers);
  numbersTab.type = 'button';
  numbersTab.addEventListener('click', () => {
    state.listMode = false;
    syncTabs();
  });
  const listTab = el('button', 'randomizer-tab', t.randomizerList);
  listTab.type = 'button';
  listTab.addEventListener('click', () => {
    state.listMode = true;
    syncTabs();
  });
  tabs.appendChild(numbersTab);
  tabs.appendChild(listTab);
  root.appendChild(tabs);

  const numberInput = (value, onInput) => {
    const input = document.createElement('input');
    input.type = 'number';
    input.value = value;
    input.addEventListener('input', () => onInput(input.value));
    return input;
  };

  const inputsWrap = el('div', 'randomizer-inputs');

  const rangeWrap = el('div', 'randomizer-range');
  const minGroup = el('div', 'input-group');
  minGroup.appendChild(el('label', '', t.randomizerFrom));
  minGroup.appendChild(
    numberInput(state.minValue, (value) => {
      state.minValue = value;
    }),
  );
  const maxGroup = el('div', 'input-group');
  maxGroup.appendChild(el('label', '', t.randomizerTo));
  maxGroup.appendChild(
    numberInput(state.maxValue, (value) => {
      state.maxValue = value;
    }),
  );
  rangeWrap.appendChild(minGroup);
  rangeWrap.appendChild(maxGroup);
  inputsWrap.appendChild(rangeWrap);

  const listGroup = el('div', 'input-group');
  listGroup.appendChild(el('label', '', t.randomizerEnterList));
  const textarea = document.createElement('textarea');
  textarea.className = 'randomizer-textarea';
  textarea.value = state.listInput;
  textarea.placeholder = t.randomizerListPlaceholder;
  textarea.rows = 5;
  textarea.addEventListener('input', () => {
    state.listInput = textarea.value;
  });
  listGroup.appendChild(textarea);
  inputsWrap.appendChild(listGroup);

  const amountGroup = el('div', 'input-group');
  amountGroup.appendChild(el('label', '', t.randomizerAmount));
  const amountInput = document.createElement('input');
  amountInput.type = 'number';
  amountInput.min = '1';
  amountInput.value = state.amount;
  amountInput.addEventListener('input', () => {
    state.amount = amountInput.value;
  });
  amountGroup.appendChild(amountInput);
  inputsWrap.appendChild(amountGroup);

  root.appendChild(inputsWrap);

  const buttonsWrap = el('div', 'randomizer-buttons');
  const runButton = el('button', 'randomizer-run-btn', `▶ ${t.randomizerRun}`);
  runButton.type = 'button';
  runButton.addEventListener('click', () => {
    if (state.listMode) runList();
    else runRandom();
    syncResults();
  });
  const clearButton = el('button', 'randomizer-clear-btn', `✕ ${t.randomizerClear}`);
  clearButton.type = 'button';
  clearButton.addEventListener('click', () => {
    clearAll();
    syncResults();
  });
  buttonsWrap.appendChild(runButton);
  buttonsWrap.appendChild(clearButton);
  root.appendChild(buttonsWrap);

  const resultsSlot = el('div', 'randomizer-results-slot');
  root.appendChild(resultsSlot);

  const syncTabs = () => {
    numbersTab.classList.toggle('active', !state.listMode);
    listTab.classList.toggle('active', state.listMode);
    rangeWrap.style.display = state.listMode ? 'none' : '';
    listGroup.style.display = state.listMode ? '' : 'none';
  };

  const resultsHtml = (values) =>
    values.length > 0
      ? '<div class="randomizer-results">' +
        values
          .map(
            (value) =>
              `<div class="randomizer-result-item">${escapeHtml(value)}</div>`,
          )
          .join('') +
        '</div>'
      : '';

  const syncResults = () => {
    clearButton.style.display =
      state.results.length > 0 || state.listResults.length > 0 ? '' : 'none';
    resultsSlot.innerHTML =
      resultsHtml(state.results) + resultsHtml(state.listResults);
  };

  container.innerHTML = '';
  container.appendChild(root);
  syncTabs();
  syncResults();

  return { el: root, refresh: syncResults, destroy: () => {} };
};
