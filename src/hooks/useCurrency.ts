import { useState, useCallback, useEffect } from 'react';
import type { CurrencyInfo, Language } from '../types';

const currencyList: CurrencyInfo[] = [
  {
    code: 'USD',
    name: { ru: 'Доллар США ($)', en: 'US Dollar ($)' },
    symbol: '$',
  },
  { code: 'EUR', name: { ru: 'Евро (€)', en: 'Euro (€)' }, symbol: '€' },
  {
    code: 'GBP',
    name: { ru: 'Фунт стерлингов (£)', en: 'British Pound (£)' },
    symbol: '£',
  },
  {
    code: 'RUB',
    name: { ru: 'Российский Рубль (₽)', en: 'Russian Ruble (₽)' },
    symbol: '₽',
  },
  {
    code: 'JPY',
    name: { ru: 'Японская Йена (¥)', en: 'Japanese Yen (¥)' },
    symbol: '¥',
  },
  {
    code: 'CNY',
    name: { ru: 'Китайский Юань (¥)', en: 'Chinese Yuan (¥)' },
    symbol: '¥',
  },
  {
    code: 'CHF',
    name: { ru: 'Швейцарский франк', en: 'Swiss Franc' },
    symbol: 'CHF',
  },
  {
    code: 'CAD',
    name: { ru: 'Канадский доллар (C$)', en: 'Canadian Dollar (C$)' },
    symbol: 'C$',
  },
  {
    code: 'AUD',
    name: { ru: 'Австралийский доллар (A$)', en: 'Australian Dollar (A$)' },
    symbol: 'A$',
  },
  {
    code: 'INR',
    name: { ru: 'Индийская рупия (₹)', en: 'Indian Rupee (₹)' },
    symbol: '₹',
  },
  {
    code: 'KRW',
    name: { ru: 'Южнокорейская Вона (₩)', en: 'South Korean Won (₩)' },
    symbol: '₩',
  },
  {
    code: 'BRL',
    name: { ru: 'Бразильский Реал (R$)', en: 'Brazilian Real (R$)' },
    symbol: 'R$',
  },
  {
    code: 'MXN',
    name: { ru: 'Мексиканское песо ($)', en: 'Mexican Peso ($)' },
    symbol: '$',
  },
  {
    code: 'SGD',
    name: { ru: 'Сингапурский доллар (S$)', en: 'Singapore Dollar (S$)' },
    symbol: 'S$',
  },
  {
    code: 'HKD',
    name: { ru: 'Гонконгский доллар (HK$)', en: 'Hong Kong Dollar (HK$)' },
    symbol: 'HK$',
  },
  {
    code: 'NOK',
    name: { ru: 'Норвежская крона (kr)', en: 'Norwegian Krone (kr)' },
    symbol: 'kr',
  },
  {
    code: 'SEK',
    name: { ru: 'Шведская крона (kr)', en: 'Swedish Krona (kr)' },
    symbol: 'kr',
  },
  {
    code: 'DKK',
    name: { ru: 'Датская крона (kr)', en: 'Danish Krone (kr)' },
    symbol: 'kr',
  },
  {
    code: 'NZD',
    name: { ru: 'Новозеландский доллар (NZ$)', en: 'New Zealand Dollar (NZ$)' },
    symbol: 'NZ$',
  },
  {
    code: 'ZAR',
    name: { ru: 'Южноафриканский анд (R)', en: 'South African Rand (R)' },
    symbol: 'R',
  },
  {
    code: 'BYN',
    name: { ru: 'Белорусский рубль (Br)', en: 'Belarusian Ruble (Br)' },
    symbol: 'Br',
  },
  {
    code: 'UAH',
    name: { ru: 'Украинская гривна (₴)', en: 'Ukrainian Hryvnia (₴)' },
    symbol: '₴',
  },
  {
    code: 'KZT',
    name: { ru: 'Казахстанский тенге (₸)', en: 'Kazakhstani Tenge (₸)' },
    symbol: '₸',
  },
  {
    code: 'TRY',
    name: { ru: 'Турецкая лира (₺)', en: 'Turkish Lira (₺)' },
    symbol: '₺',
  },
  {
    code: 'BGN',
    name: { ru: 'Болгарский лев (лв)', en: 'Bulgarian Lev (лв)' },
    symbol: 'лв',
  },
  {
    code: 'RON',
    name: { ru: 'Румынский лей (lei)', en: 'Romanian Leu (lei)' },
    symbol: 'lei',
  },
  {
    code: 'UZS',
    name: { ru: 'Узбекский сум (soʻm)', en: 'Uzbekistani Som (soʻm)' },
    symbol: 'soʻm',
  },
  {
    code: 'KGS',
    name: { ru: 'Киргизский сом (с)', en: 'Kyrgystani Som (с)' },
    symbol: 'с',
  },
  {
    code: 'TJS',
    name: { ru: 'Таджикский сомони (SM)', en: 'Tajikistani Somoni (SM)' },
    symbol: 'SM',
  },
  {
    code: 'TMT',
    name: { ru: 'Туркменский манат (m)', en: 'Turkmenistani Manat (m)' },
    symbol: 'm',
  },
  {
    code: 'VND',
    name: { ru: 'Вьетнамский донг (₫)', en: 'Vietnamese Dong (₫)' },
    symbol: '₫',
  },
  {
    code: 'AZN',
    name: { ru: 'Азербайджанский манат (₼)', en: 'Azerbaijani Manat (₼)' },
    symbol: '₼',
  },
  {
    code: 'AMD',
    name: { ru: 'Армянский драм (֏)', en: 'Armenian Dram (֏)' },
    symbol: '֏',
  },
  {
    code: 'GEL',
    name: { ru: 'Грузинский лари (₾)', en: 'Georgian Lari (₾)' },
    symbol: '₾',
  },
];

// Fallback rates relative to USD (approximate)
const fallbackRates: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  RUB: 92.5,
  JPY: 151.5,
  CNY: 7.24,
  CHF: 0.9,
  CAD: 1.36,
  AUD: 1.52,
  INR: 83.5,
  KRW: 1350,
  BRL: 5.15,
  MXN: 17.2,
  SGD: 1.35,
  HKD: 7.83,
  NOK: 10.8,
  SEK: 10.7,
  DKK: 6.88,
  NZD: 1.67,
  ZAR: 18.9,
  BYN: 3.27,
  UAH: 41.2,
  KZT: 500,
  TRY: 32.1,
  BGN: 1.8,
  RON: 4.6,
  UZS: 12600,
  KGS: 89.5,
  TJS: 10.95,
  TMT: 3.5,
  VND: 25400,
  AZN: 1.7,
  AMD: 388,
  GEL: 2.7,
};

export const useCurrency = (language: Language) => {
  const [currencyFrom, setCurrencyFrom] = useState('USD');
  const [currencyTo, setCurrencyTo] = useState('RUB');
  const [currencyAmount, setCurrencyAmount] = useState('');
  const [currencyResult, setCurrencyResult] = useState<string | null>(null);
  const [currencyRate, setCurrencyRate] = useState<number>(0);
  const [currencyLoading, setCurrencyLoading] = useState(false);
  const [rates, setRates] = useState<Record<string, number>>(fallbackRates);

  const getCurrencyName = (code: string): string => {
    const info = currencyList.find((c) => c.code === code);
    return info ? info.name[language] : code;
  };

  // Try to fetch fresh rates on mount and when currencies change
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(
          `https://open.er-api.com/v6/latest/${currencyFrom}`,
          {
            signal: controller.signal,
          },
        );
        clearTimeout(timeoutId);

        const data = await response.json();
        if (data.result === 'success' && data.rates) {
          setRates(data.rates);
        }
      } catch {
        // Silently use fallback rates
        console.log('Using fallback currency rates');
      }
    };

    fetchRates();
  }, [currencyFrom]);

  const getRate = useCallback(
    (from: string, to: string): number => {
      if (from === to) return 1;

      // If we have fetched rates for the current base currency
      if (rates[from] !== undefined && rates[to] !== undefined) {
        // rates are relative to currencyFrom base
        if (from === currencyFrom && rates[to]) {
          return rates[to];
        }
      }

      // Convert via USD using fallback rates
      const fromRate = fallbackRates[from] || 1;
      const toRate = fallbackRates[to] || 1;
      return toRate / fromRate;
    },
    [rates, currencyFrom],
  );

  const convertCurrency = useCallback(() => {
    if (!currencyAmount) return;

    setCurrencyLoading(true);
    const amount = parseFloat(currencyAmount);
    const rate = getRate(currencyFrom, currencyTo);

    setCurrencyRate(rate);
    const result = amount * rate;
    setCurrencyResult(result.toFixed(2));
    setCurrencyLoading(false);
  }, [currencyAmount, currencyFrom, currencyTo, getRate]);

  return {
    currencyFrom,
    currencyTo,
    currencyAmount,
    currencyResult,
    currencyRate,
    currencyLoading,
    currencyList,
    setCurrencyFrom,
    setCurrencyTo,
    setCurrencyAmount,
    setCurrencyResult,
    convertCurrency,
    getCurrencyName,
  };
};

export { currencyList };
