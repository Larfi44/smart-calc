export type CalculatorMode = 'calculator' | 'converter' | 'timer' | 'currency' | 'settings';
export type CalculatorType = 'normal' | 'scientific' | 'programmer';
export type ConverterType = 'length' | 'weight' | 'time' | 'temperature' | 'speed' | 'area' | 'volume';
export type Language = 'ru' | 'en';
export type Theme = 'light' | 'dark' | 'auto';
export type ChartTimeframe = 'minute' | 'hour' | 'day' | 'month';
export type NumberBase = 'dec' | 'bin' | 'oct' | 'hex';

export interface HistoryItem {
  expression: string;
  result: string;
  formattedExpression: string;
}

export interface CurrencyRate {
  date: string;
  rate: number;
  timestamp: number;
}

export interface CurrencyInfo {
  code: string;
  name: Record<Language, string>;
  symbol: string;
}
