import { useState } from 'react';
import type { ConverterType } from '../types';

interface UnitMap {
  [key: string]: string[];
}

export const useConverter = () => {
  const [converterType, setConverterType] = useState<ConverterType>('length');
  const [convertValue, setConvertValue] = useState('');
  const [fromUnit, setFromUnit] = useState('meters');
  const [toUnit, setToUnit] = useState('kilometers');
  const [convertResult, setConvertResult] = useState<string | null>(null);

  const lengthUnits = ['meters', 'kilometers', 'centimeters', 'millimeters', 'miles', 'yards', 'feet', 'inches'];
  const weightUnits = ['kilograms', 'grams', 'pounds', 'ounces', 'tonnes'];
  const timeUnits = ['seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years'];
  const temperatureUnits = ['celsius', 'fahrenheit', 'kelvin'];
  const speedUnits = ['ms', 'kmh', 'mph', 'knots', 'mpm'];
  const areaUnits = ['m2', 'km2', 'hectares', 'acres', 'ft2', 'in2'];
  const volumeUnits = ['liters', 'milliliters', 'gallons', 'quarts', 'pints', 'm3', 'cm3'];

  const units: UnitMap = {
    length: lengthUnits,
    weight: weightUnits,
    time: timeUnits,
    temperature: temperatureUnits,
    speed: speedUnits,
    area: areaUnits,
    volume: volumeUnits
  };

  const conversionRates: Record<string, number> = {
    meters: 1, kilometers: 1000, centimeters: 0.01, millimeters: 0.001,
    miles: 1609.34, yards: 0.9144, feet: 0.3048, inches: 0.0254,
    kilograms: 1, grams: 0.001, pounds: 0.453592, ounces: 0.0283495, tonnes: 1000,
    seconds: 1, minutes: 60, hours: 3600, days: 86400, weeks: 604800, months: 2628000, years: 31536000,
    ms: 1, kmh: 0.277778, mph: 0.44704, knots: 0.514444, mpm: 0.016667,
    m2: 1, km2: 1000000, hectares: 10000, acres: 4046.86, ft2: 0.092903, in2: 0.00064516,
    liters: 1, milliliters: 0.001, gallons: 3.78541, quarts: 0.946353, pints: 0.473176, m3: 1000, cm3: 0.001
  };

  const convertTemperature = (value: number, from: string, to: string): number => {
    let celsius: number;
    if (from === 'celsius') celsius = value;
    else if (from === 'fahrenheit') celsius = (value - 32) * 5/9;
    else if (from === 'kelvin') celsius = value - 273.15;
    else celsius = value;
    
    if (to === 'celsius') return celsius;
    else if (to === 'fahrenheit') return celsius * 9/5 + 32;
    else if (to === 'kelvin') return celsius + 273.15;
    return celsius;
  };

  const convertUnits = () => {
    if (!convertValue || !fromUnit || !toUnit) return;
    const value = parseFloat(convertValue);
    let result: number;

    if (converterType === 'temperature') {
      result = convertTemperature(value, fromUnit, toUnit);
    } else {
      const fromRate = conversionRates[fromUnit];
      const toRate = conversionRates[toUnit];
      if (fromRate && toRate) {
        const baseValue = value * fromRate;
        result = baseValue / toRate;
      } else {
        return;
      }
    }
    
    const resultStr = result.toFixed(6).replace(/\.?0+$/, '');
    setConvertResult(resultStr);
  };

  const handleConverterTypeChange = (newType: ConverterType) => {
    setConverterType(newType);
    setConvertValue('');
    setConvertResult(null);
    
    const defaults: Record<ConverterType, { from: string; to: string }> = {
      length: { from: 'meters', to: 'kilometers' },
      weight: { from: 'kilograms', to: 'pounds' },
      time: { from: 'hours', to: 'minutes' },
      temperature: { from: 'celsius', to: 'fahrenheit' },
      speed: { from: 'kmh', to: 'mph' },
      area: { from: 'hectares', to: 'acres' },
      volume: { from: 'liters', to: 'gallons' }
    };
    
    setFromUnit(defaults[newType].from);
    setToUnit(defaults[newType].to);
  };

  return {
    converterType, convertValue, fromUnit, toUnit, convertResult,
    units,
    setConvertValue, setFromUnit, setToUnit,
    convertUnits, handleConverterTypeChange
  };
};
