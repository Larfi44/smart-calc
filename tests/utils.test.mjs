// Unit tests for the pure helpers extracted from the React app.
import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDecimal, roundFloat } from '../js/utils/format.js';
import { toSingularUnit } from '../js/utils/units.js';
import { escapeHtml } from '../js/utils/dom.js';
import { safeEvaluate } from '../js/utils/safeEvaluate.js';
import { translations } from '../js/constants/translations.js';
import {
  currencyList,
  fallbackRates,
  getCurrencyName,
} from '../js/constants/currencies.js';

test('formatDecimal keeps meaningful precision', () => {
  assert.equal(formatDecimal(0), '0');
  assert.equal(formatDecimal(56), '56');
  assert.equal(formatDecimal(2.5), '2.5');
  assert.equal(formatDecimal(0.005), '0.005');
  assert.equal(formatDecimal(1 / 3), '0.33333');
  assert.equal(formatDecimal(0.99609375), '0.996');
});

test('roundFloat removes floating point noise', () => {
  assert.equal(roundFloat(0.49999999999999994), 0.5);
  assert.equal(roundFloat(Math.PI), 3.14159265359);
});

test('toSingularUnit handles Russian and English unit names', () => {
  assert.equal(toSingularUnit('Метры', 'ru'), 'Метр');
  assert.equal(toSingularUnit('Километры', 'ru'), 'Километр');
  assert.equal(toSingularUnit('Неизвестно', 'ru'), 'Неизвестно');
  assert.equal(toSingularUnit('Meters', 'en'), 'Meter');
  assert.equal(toSingularUnit('Feet', 'en'), 'Foot');
  assert.equal(toSingularUnit('m/s', 'en'), 'm/s');
});

test('escapeHtml neutralises markup', () => {
  assert.equal(escapeHtml('<b>&"x"</b>'), '&lt;b&gt;&amp;"x"&lt;/b&gt;');
});

test('safeEvaluate parses arithmetic', () => {
  assert.equal(safeEvaluate('7*8'), 56);
  assert.equal(safeEvaluate('(2+3)/4'), 1.25);
});

test('translations expose the same keys in both languages', () => {
  const collectKeys = (value, prefix = '') => {
    if (Array.isArray(value)) return [prefix];
    if (value && typeof value === 'object') {
      return Object.keys(value).flatMap((key) =>
        collectKeys(value[key], `${prefix}.${key}`),
      );
    }
    return [prefix];
  };

  assert.deepEqual(
    collectKeys(translations.ru).sort(),
    collectKeys(translations.en).sort(),
  );

  // unit names are [ru, en] pairs
  const units = translations.ru.units;
  assert.equal(units.meters[0], 'Метры');
  assert.equal(units.meters[1], 'Meters');
  assert.equal(units.kilometers[0], 'Километры');
  assert.equal(translations.en.units.meters[0], 'Meters');
});

test('currency names and fallback rates', () => {
  assert.equal(getCurrencyName('USD', 'ru'), 'Доллар США ($)');
  assert.equal(getCurrencyName('USD', 'en'), 'US Dollar ($)');
  assert.equal(getCurrencyName('XXX', 'ru'), 'XXX');
  assert.equal(fallbackRates.USD, 1);

  assert.ok(currencyList.length >= 30, 'full currency list is available');
  currencyList.forEach((currency) => {
    assert.ok(currency.name.ru && currency.name.en, currency.code);
    assert.ok(currency.symbol, currency.code);
    assert.equal(typeof fallbackRates[currency.code], 'number', currency.code);
  });
});
