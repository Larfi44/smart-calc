// Vanilla port of src/hooks/useCurrency.ts + src/components/Currency.tsx
import { formatDecimal } from '../utils/format.js';
import {
  currencyList,
  fallbackRates,
  loadCachedRates,
  saveRatesToCache,
  getCurrencyName as lookupCurrencyName,
} from '../constants/currencies.js';
import { createSelect } from '../components/customSelect.js';
import { el, escapeHtml } from '../utils/dom.js';

// State lives in <App/> via useCurrency in the React version, so it survives
// mode switches — mirrored here with a module-level object.
const state = {
  currencyFrom: 'USD',
  currencyTo: 'RUB',
  currencyAmount: '',
  currencyResult: null,
  currencyRate: 0,
  currencyLoading: false,
  rates: loadCachedRates() || fallbackRates,
  language: 'ru',
};

let t = null;

const getCurrencyName = (code) => lookupCurrencyName(code, state.language);

const getRate = (from, to) => {
  if (from === to) return 1;

  // rates from the API are always relative to currencyFrom (the base)
  // The API response does NOT include the base currency itself in rates
  const { rates } = state;

  // Try using API rates if available
  if (from === state.currencyFrom && rates[to] !== undefined) {
    // e.g. from=USD, currencyFrom=USD → rate is directly rates["RUB"]
    return rates[to];
  }

  if (to === state.currencyFrom && rates[from] !== undefined) {
    // e.g. to=USD, currencyFrom=USD → 1 / rates["RUB"]
    return 1 / rates[from];
  }

  if (rates[from] !== undefined && rates[to] !== undefined) {
    // Both are not the base, convert via base currency
    return rates[to] / rates[from];
  }

  // Fallback to hardcoded rates via USD
  const fromRate = fallbackRates[from] || 1;
  const toRate = fallbackRates[to] || 1;
  return toRate / fromRate;
};

const convertCurrency = () => {
  if (!state.currencyAmount) return;

  state.currencyLoading = true;
  const amount = parseFloat(state.currencyAmount);
  const rate = getRate(state.currencyFrom, state.currencyTo);

  state.currencyRate = rate;
  const result = amount * rate;
  // Format with the shared smart decimal formatting
  state.currencyResult = formatDecimal(result);
  state.currencyLoading = false;
};

// Try to fetch fresh rates on mount and when currencies change
const fetchRates = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://open.er-api.com/v6/latest/${state.currencyFrom}`,
      { signal: controller.signal },
    );
    clearTimeout(timeoutId);

    const data = await response.json();
    if (data.result === 'success' && data.rates) {
      state.rates = data.rates;
      saveRatesToCache(data.rates);
    }
  } catch {
    // Silently use cached or fallback rates
    const cached = loadCachedRates();
    if (cached) {
      state.rates = cached;
    }
  }
};

const setCurrencyFrom = (code) => {
  state.currencyFrom = code;
  state.currencyResult = null;
  // mirrors the useEffect dependency on currencyFrom
  fetchRates();
};

const setCurrencyTo = (code) => {
  state.currencyTo = code;
  state.currencyResult = null;
};

const setCurrencyAmount = (amount) => {
  state.currencyAmount = amount;
  state.currencyResult = null;
};

export const mountCurrency = (container, ctx) => {
  t = ctx.t;
  if (ctx.language) state.language = ctx.language;

  const root = el('div', 'currency-mode');
  root.appendChild(el('h2', '', t.currencyTitle));

  const inputs = el('div', 'currency-inputs');

  const amountGroup = el('div', 'input-group');
  amountGroup.appendChild(el('label', '', t.amount));
  const amountInput = document.createElement('input');
  amountInput.type = 'number';
  amountInput.placeholder = '...';
  amountInput.value = state.currencyAmount;
  amountInput.addEventListener('input', () => {
    setCurrencyAmount(amountInput.value);
    update();
  });
  amountGroup.appendChild(amountInput);
  inputs.appendChild(amountGroup);

  const options = currencyList.map((currency) => ({
    value: currency.code,
    label: getCurrencyName(currency.code),
  }));

  const fromGroup = el('div', 'input-group');
  fromGroup.appendChild(el('label', '', t.from));
  const fromSelect = createSelect({
    value: state.currencyFrom,
    options,
    onChange: (code) => {
      setCurrencyFrom(code);
      update();
    },
  });
  fromGroup.appendChild(fromSelect.el);
  inputs.appendChild(fromGroup);

  const swapContainer = el('div', 'swap-container');
  const swapButton = el('button', 'swap-btn', '⇄');
  swapButton.type = 'button';
  swapButton.title = t.swap;
  swapButton.addEventListener('click', () => {
    // handleSwap: from ← to, then to ← from
    const previousFrom = state.currencyFrom;
    setCurrencyFrom(state.currencyTo);
    setCurrencyTo(previousFrom);
    update();
  });
  swapContainer.appendChild(swapButton);
  inputs.appendChild(swapContainer);

  const toGroup = el('div', 'input-group');
  toGroup.appendChild(el('label', '', t.to));
  const toSelect = createSelect({
    value: state.currencyTo,
    options,
    onChange: (code) => {
      setCurrencyTo(code);
      update();
    },
  });
  toGroup.appendChild(toSelect.el);
  inputs.appendChild(toGroup);

  root.appendChild(inputs);

  const convertButton = el('button', 'convert-currency-btn', t.convertCurrency);
  convertButton.type = 'button';
  convertButton.addEventListener('click', () => {
    convertCurrency();
    update();
  });
  root.appendChild(convertButton);

  const resultSlot = el('div', 'currency-result-slot');
  root.appendChild(resultSlot);

  const resultHtml = () => {
    if (state.currencyResult === null) {
      return '<div class="convert-spacer"></div>';
    }

    const fromName = getCurrencyName(state.currencyFrom);
    const toName = getCurrencyName(state.currencyTo);

    return (
      '<div class="currency-result">' +
      `<h3>${escapeHtml(t.result)}:</h3>` +
      '<p>' +
      `${escapeHtml(state.currencyAmount)} ${escapeHtml(fromName)} = ` +
      `<strong>${escapeHtml(state.currencyResult)}</strong> ` +
      escapeHtml(toName) +
      '</p>' +
      (parseFloat(state.currencyAmount) !== 1
        ? '<p class="exchange-rate">' +
          `${escapeHtml(t.exchangeRate)}: 1 ${escapeHtml(
            state.currencyFrom,
          )} = ${escapeHtml(state.currencyRate.toFixed(4))} ` +
          `${escapeHtml(state.currencyTo)}</p>`
        : '') +
      '</div>'
    );
  };

  const update = () => {
    fromSelect.setValue(state.currencyFrom);
    toSelect.setValue(state.currencyTo);

    if (amountInput.value !== state.currencyAmount) {
      amountInput.value = state.currencyAmount;
    }

    convertButton.textContent = state.currencyLoading
      ? t.loading
      : t.convertCurrency;
    convertButton.disabled = state.currencyLoading;

    resultSlot.innerHTML = resultHtml();
  };

  container.innerHTML = '';
  container.appendChild(root);
  update();

  fetchRates();

  return { el: root, refresh: update, destroy: () => {} };
};
