// Vanilla port of src/hooks/useConverter.ts + src/components/Converter.tsx
import { formatDecimal } from '../utils/format.js';
import { toSingularUnit } from '../utils/units.js';
import { createSelect } from '../components/customSelect.js';
import { el, escapeHtml } from '../utils/dom.js';

const LENGTH_UNITS = [
  'meters',
  'kilometers',
  'centimeters',
  'millimeters',
  'miles',
  'yards',
  'feet',
  'inches',
  'astronomicalUnit',
  'lightYear',
];
const WEIGHT_UNITS = ['kilograms', 'grams', 'pounds', 'ounces', 'tonnes'];
const TIME_UNITS = [
  'milliseconds',
  'seconds',
  'minutes',
  'hours',
  'days',
  'weeks',
  'months',
  'years',
];
const TEMPERATURE_UNITS = ['celsius', 'fahrenheit', 'kelvin'];
const SPEED_UNITS = ['ms', 'kmh', 'mph', 'knots', 'mpm'];
const AREA_UNITS = [
  'm2',
  'km2',
  'hectares',
  'acres',
  'ft2',
  'in2',
  'mi2',
  'au2',
  'ly2',
];
const VOLUME_UNITS = [
  'liters',
  'milliliters',
  'gallons',
  'quarts',
  'pints',
  'm3',
  'cm3',
  'km3',
  'in3',
  'ft3',
  'mi3',
  'au3',
  'ly3',
];
const DATA_UNITS = [
  'bits',
  'bytes',
  'kilobytes',
  'megabytes',
  'gigabytes',
  'terabytes',
  'petabytes',
  'exabytes',
  'zettabytes',
];

const CONVERTER_TYPES = [
  'length',
  'weight',
  'time',
  'temperature',
  'speed',
  'area',
  'volume',
  'data',
];

const UNITS = {
  length: LENGTH_UNITS,
  weight: WEIGHT_UNITS,
  time: TIME_UNITS,
  temperature: TEMPERATURE_UNITS,
  speed: SPEED_UNITS,
  area: AREA_UNITS,
  volume: VOLUME_UNITS,
  data: DATA_UNITS,
};

const CONVERSION_RATES = {
  meters: 1,
  kilometers: 1000,
  centimeters: 0.01,
  millimeters: 0.001,
  miles: 1609.34,
  yards: 0.9144,
  feet: 0.3048,
  inches: 0.0254,
  astronomicalUnit: 149597870700,
  lightYear: 9460730472580800,
  kilograms: 1,
  grams: 0.001,
  pounds: 0.453592,
  ounces: 0.0283495,
  tonnes: 1000,
  milliseconds: 0.001,
  seconds: 1,
  minutes: 60,
  hours: 3600,
  days: 86400,
  weeks: 604800,
  months: 2628000,
  years: 31536000,
  ms: 1,
  kmh: 0.277778,
  mph: 0.44704,
  knots: 0.514444,
  mpm: 0.016667,
  m2: 1,
  km2: 1000000,
  hectares: 10000,
  acres: 4046.86,
  ft2: 0.092903,
  in2: 0.00064516,
  mi2: 2589988.11,
  au2: 2.23795229157e22,
  ly2: 8.95054210748e31,
  liters: 1,
  milliliters: 0.001,
  gallons: 3.78541,
  quarts: 0.946353,
  pints: 0.473176,
  m3: 1000,
  cm3: 0.001,
  km3: 1e12,
  in3: 0.0163871,
  ft3: 28.3168,
  mi3: 4168181825.44,
  au3: 3.34792899409e33,
  ly3: 8.46628021441e50,
  bits: 0.125,
  bytes: 1,
  kilobytes: 1024,
  megabytes: 1048576,
  gigabytes: 1073741824,
  terabytes: 1099511627776,
  petabytes: 1125899906842624,
  exabytes: 1152921504606846976,
  zettabytes: 1180591620717411303424,
};

const DEFAULT_UNITS = {
  length: { from: 'meters', to: 'kilometers' },
  weight: { from: 'kilograms', to: 'pounds' },
  time: { from: 'hours', to: 'minutes' },
  temperature: { from: 'celsius', to: 'fahrenheit' },
  speed: { from: 'kmh', to: 'mph' },
  area: { from: 'hectares', to: 'acres' },
  volume: { from: 'liters', to: 'gallons' },
  data: { from: 'megabytes', to: 'gigabytes' },
};

// State lives in <App/> via useConverter in the React version, so it survives
// mode switches — mirrored here with a module-level object.
const state = {
  converterType: 'length',
  convertValue: '',
  fromUnit: 'meters',
  toUnit: 'kilometers',
  convertResult: null,
  unitRate: null,
  language: 'ru',
};

let t = null;

const getUnitName = (unitKey) => {
  const langIndex = state.language === 'ru' ? 0 : 1;
  if (t.units && t.units[unitKey]) {
    return t.units[unitKey][langIndex];
  }
  return unitKey;
};

const conversionTemperature = (value, from, to) => {
  let celsius;

  if (from === 'celsius') celsius = value;
  else if (from === 'fahrenheit') celsius = ((value - 32) * 5) / 9;
  else if (from === 'kelvin') celsius = value - 273.15;
  else celsius = value;

  if (to === 'celsius') return celsius;
  else if (to === 'fahrenheit') return (celsius * 9) / 5 + 32;
  else if (to === 'kelvin') return celsius + 273.15;
  return celsius;
};

const convertUnits = () => {
  if (!state.convertValue || !state.fromUnit || !state.toUnit) return;

  const value = parseFloat(state.convertValue);
  let result;
  let rateValue = 0;

  if (state.converterType === 'temperature') {
    result = conversionTemperature(value, state.fromUnit, state.toUnit);
    rateValue = conversionTemperature(1, state.fromUnit, state.toUnit);
  } else {
    const fromRate = CONVERSION_RATES[state.fromUnit];
    const toRate = CONVERSION_RATES[state.toUnit];
    if (fromRate && toRate) {
      const baseValue = value * fromRate;
      result = baseValue / toRate;
      rateValue = fromRate / toRate;
    } else {
      return;
    }
  }

  // Format with the shared smart decimal formatting
  state.convertResult = formatDecimal(result);
  state.unitRate = formatDecimal(rateValue);
};

const handleConverterTypeChange = (newType) => {
  state.converterType = newType;
  state.convertValue = '';
  state.convertResult = null;
  state.unitRate = null;

  state.fromUnit = DEFAULT_UNITS[newType].from;
  state.toUnit = DEFAULT_UNITS[newType].to;
};

const setConvertValue = (value) => {
  state.convertValue = value;
  state.convertResult = null;
  state.unitRate = null;
};

const setFromUnit = (unit) => {
  state.fromUnit = unit;
  state.convertResult = null;
  state.unitRate = null;
};

const setToUnit = (unit) => {
  state.toUnit = unit;
  state.convertResult = null;
  state.unitRate = null;
};

export const mountConverter = (container, ctx) => {
  t = ctx.t;
  if (t.language) state.language = t.language;

  const root = el('div', 'converter-mode');
  root.appendChild(el('h2', '', t.converterTitle));

  const typeSelector = el('div', 'converter-type-selector');
  CONVERTER_TYPES.forEach((type) => {
    const button = el('button', 'type-btn', t.converterTypes[type]);
    button.dataset.type = type;
    button.addEventListener('click', () => {
      handleConverterTypeChange(type);
      update();
    });
    typeSelector.appendChild(button);
  });
  root.appendChild(typeSelector);

  const inputs = el('div', 'converter-inputs');

  const valueGroup = el('div', 'input-group');
  valueGroup.appendChild(el('label', '', t.value));
  const valueInput = document.createElement('input');
  valueInput.type = 'number';
  valueInput.placeholder = '...';
  valueInput.value = state.convertValue;
  valueInput.addEventListener('input', () => {
    setConvertValue(valueInput.value);
    update();
  });
  valueGroup.appendChild(valueInput);
  inputs.appendChild(valueGroup);

  const fromGroup = el('div', 'input-group');
  fromGroup.appendChild(el('label', '', t.from));
  const fromSelect = createSelect({
    value: state.fromUnit,
    options: [],
    onChange: (unit) => {
      setFromUnit(unit);
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
    const previousFrom = state.fromUnit;
    setFromUnit(state.toUnit);
    setToUnit(previousFrom);
    update();
  });
  swapContainer.appendChild(swapButton);
  inputs.appendChild(swapContainer);

  const toGroup = el('div', 'input-group');
  toGroup.appendChild(el('label', '', t.to));
  const toSelect = createSelect({
    value: state.toUnit,
    options: [],
    onChange: (unit) => {
      setToUnit(unit);
      update();
    },
  });
  toGroup.appendChild(toSelect.el);
  inputs.appendChild(toGroup);

  root.appendChild(inputs);

  const convertButton = el('button', 'convert-btn', t.convert);
  convertButton.type = 'button';
  convertButton.addEventListener('click', () => {
    convertUnits();
    update();
  });
  root.appendChild(convertButton);

  const resultSlot = el('div', 'converter-result-slot');
  root.appendChild(resultSlot);

  const resultHtml = () => {
    if (state.convertResult === null) return '<div class="convert-spacer"></div>';

    const fromName = getUnitName(state.fromUnit);
    const toName = getUnitName(state.toUnit);
    const isSingular = parseFloat(state.convertValue) === 1;

    return (
      '<div class="conversion-result">' +
      `<h3>${escapeHtml(t.result)}:</h3>` +
      '<p>' +
      `${escapeHtml(state.convertValue)} ` +
      escapeHtml(isSingular ? toSingularUnit(fromName, state.language) : fromName) +
      ' = ' +
      `<strong>${escapeHtml(state.convertResult)}</strong> ` +
      escapeHtml(toName) +
      '</p>' +
      (state.unitRate !== null && !isSingular
        ? '<p class="exchange-rate">' +
          `1 ${escapeHtml(toSingularUnit(fromName, state.language))} = ` +
          `${escapeHtml(state.unitRate)} ${escapeHtml(toName)}` +
          '</p>'
        : '') +
      '</div>'
    );
  };

  let optionsKey = null;

  const update = () => {
    typeSelector.querySelectorAll('.type-btn').forEach((button) => {
      button.classList.toggle('active', button.dataset.type === state.converterType);
    });

    const options = UNITS[state.converterType].map((unit) => ({
      value: unit,
      label: getUnitName(unit),
    }));

    if (optionsKey !== state.converterType) {
      fromSelect.setOptions(options);
      toSelect.setOptions(options);
      optionsKey = state.converterType;
    }

    fromSelect.setValue(state.fromUnit);
    toSelect.setValue(state.toUnit);

    if (valueInput.value !== state.convertValue) {
      valueInput.value = state.convertValue;
    }

    resultSlot.innerHTML = resultHtml();
  };

  container.innerHTML = '';
  container.appendChild(root);
  update();

  return { el: root, refresh: update, destroy: () => {} };
};
