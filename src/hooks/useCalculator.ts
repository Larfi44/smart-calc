import { useState, useCallback, useEffect } from 'react';
import type { CalculatorType, NumberBase, HistoryItem } from '../types';

export const useCalculator = (t: any) => {
  const [calcType, setCalcType] = useState<CalculatorType>('normal');
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('calculator_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);
  const [numberBase, setNumberBase] = useState<NumberBase>('dec');
  const [nthRootMode, setNthRootMode] = useState(false);
  const [nthPowerMode, setNthPowerMode] = useState(false);
  const [tempValue, setTempValue] = useState('');

  useEffect(() => {
    localStorage.setItem('calculator_history', JSON.stringify(history));
  }, [history]);

  const factorial = (n: number): number => {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    if (n > 170) return Infinity;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  };

  const formatDisplayNumber = useCallback(
    (num: number | string): string => {
      if (typeof num === 'string') {
        if (num === 'Infinity' || num === '-Infinity') return t.infinity;
        if (num === 'NaN') return t.error;
        return num;
      }
      if (isNaN(num)) return t.error;
      if (num === Infinity || num === -Infinity) return t.infinity;
      return num.toString();
    },
    [t],
  );

  const formatNumberInBase = useCallback(
    (num: number, base: NumberBase): string => {
      switch (base) {
        case 'bin': return num.toString(2);
        case 'oct': return num.toString(8);
        case 'hex': return num.toString(16).toUpperCase();
        default: return num.toString(10);
      }
    },
    [],
  );

  const handleNumber = useCallback(
    (num: string) => {
      if (nthRootMode || nthPowerMode) {
        setTempValue(prev => prev + num);
        return;
      }
      
      if (shouldResetDisplay) {
        setDisplay(num);
        setShouldResetDisplay(false);
      } else if (display === '0' || display === t.error || display === t.infinity) {
        setDisplay(num);
      } else {
        setDisplay(display + num);
      }
    },
    [display, shouldResetDisplay, nthRootMode, nthPowerMode, t],
  );

  const handleOperator = useCallback(
    (op: string) => {
      setEquation(display + ' ' + op + ' ');
      setShouldResetDisplay(true);
      setDisplay('0');
    },
    [display],
  );

  const handleDecimal = useCallback(() => {
    if (nthRootMode || nthPowerMode) {
      if (!tempValue.includes('.')) {
        setTempValue(prev => prev + '.');
      }
      return;
    }
    
    if (shouldResetDisplay) {
      setDisplay('0.');
      setShouldResetDisplay(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  }, [display, shouldResetDisplay, nthRootMode, nthPowerMode, tempValue]);

  const handleClear = useCallback(() => {
    setDisplay('0');
    setEquation('');
    setShouldResetDisplay(false);
    setNthRootMode(false);
    setNthPowerMode(false);
    setTempValue('');
  }, []);

  const handleBackspace = useCallback(() => {
    if (nthRootMode || nthPowerMode) {
      setTempValue(prev => prev.slice(0, -1) || '');
      return;
    }
    
    if (display.length === 1 || display === t.error || display === t.infinity) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  }, [display, nthRootMode, nthPowerMode, tempValue, t]);

  const handleEqual = useCallback(() => {
    try {
      if (nthRootMode && tempValue) {
        const num = parseFloat(display);
        const root = parseFloat(tempValue);
        const result = Math.pow(num, 1 / root);
        const historyItem: HistoryItem = {
          expression: `nthRoot(${num}, ${root})`,
          result: formatDisplayNumber(result),
          formattedExpression: `√[${root}]${num}`
        };
        setHistory([historyItem, ...history].slice(0, 10));
        setDisplay(formatDisplayNumber(result));
        setNthRootMode(false);
        setTempValue('');
        setShouldResetDisplay(true);
        return;
      }
      
      if (nthPowerMode && tempValue) {
        const num = parseFloat(display);
        const power = parseFloat(tempValue);
        const result = Math.pow(num, power);
        const historyItem: HistoryItem = {
          expression: `nthPower(${num}, ${power})`,
          result: formatDisplayNumber(result),
          formattedExpression: `${num}^${power}`
        };
        setHistory([historyItem, ...history].slice(0, 10));
        setDisplay(formatDisplayNumber(result));
        setNthPowerMode(false);
        setTempValue('');
        setShouldResetDisplay(true);
        return;
      }
      
      const fullEquation = equation + display;
      const result = eval(fullEquation.replace(/×/g, '*').replace(/÷/g, '/'));

      const historyItem: HistoryItem = {
        expression: fullEquation,
        result: formatDisplayNumber(result),
        formattedExpression: fullEquation.replace(/×/g, '×').replace(/÷/g, '÷'),
      };
      setHistory([historyItem, ...history].slice(0, 10));
      setDisplay(formatDisplayNumber(result));
      setEquation('');
      setShouldResetDisplay(true);
    } catch {
      setDisplay(t.error);
      setShouldResetDisplay(true);
    }
  }, [equation, display, history, formatDisplayNumber, t, nthRootMode, nthPowerMode, tempValue]);

  const handleFunction = useCallback(
    (func: string, param?: number) => {
      try {
        // Special case: negate just toggles sign without calculating
        if (func === 'negate') {
          if (display === '0' || display === t.error || display === t.infinity) return;
          if (display.startsWith('-')) {
            setDisplay(display.slice(1));
          } else {
            setDisplay('-' + display);
          }
          return;
        }

        const num = parseFloat(display);
        let result = 0;
        let formattedExp = '';

        switch (func) {
          case 'sqrt':
            result = Math.sqrt(num);
            formattedExp = `√${num}`;
            break;
          case 'nthRoot':
            if (param !== undefined) {
              result = Math.pow(num, 1 / param);
              formattedExp = `√[${param}]${num}`;
            } else {
              return;
            }
            break;
          case 'square':
            result = Math.pow(num, 2);
            formattedExp = `${num}²`;
            break;
          case 'nthPower':
            if (param !== undefined) {
              result = Math.pow(num, param);
              formattedExp = `${num}^${param}`;
            } else {
              return;
            }
            break;
          case 'sin':
            result = Math.sin((num * Math.PI) / 180);
            formattedExp = `sin(${num}°)`;
            break;
          case 'cos':
            result = Math.cos((num * Math.PI) / 180);
            formattedExp = `cos(${num}°)`;
            break;
          case 'tan':
            result = Math.tan((num * Math.PI) / 180);
            formattedExp = `tan(${num}°)`;
            break;
          case 'log':
            result = Math.log10(num);
            formattedExp = `log(${num})`;
            break;
          case 'ln':
            result = Math.log(num);
            formattedExp = `ln(${num})`;
            break;
          case 'pi':
            result = Math.PI;
            formattedExp = `π`;
            break;
          case 'e':
            result = Math.E;
            formattedExp = `e`;
            break;
          case 'abs':
            result = Math.abs(num);
            formattedExp = `|${num}|`;
            break;
          case 'fact':
            result = factorial(num);
            formattedExp = `${num}!`;
            break;
          case 'percent':
            result = num / 100;
            formattedExp = `${num}%`;
            break;
          case 'percentOf':
            result = ((param || num) * num) / 100;
            formattedExp = `${num}% от ${param || num}`;
            break;
          case 'xor':
            result = parseInt(display) ^ 2;
            formattedExp = `${display} XOR 2`;
            break;
          case 'and':
            result = parseInt(display) & 2;
            formattedExp = `${display} AND 2`;
            break;
          case 'or':
            result = parseInt(display) | 2;
            formattedExp = `${display} OR 2`;
            break;
          case 'not':
            result = ~parseInt(display);
            formattedExp = `~${display}`;
            break;
          case 'lshift':
            result = parseInt(display) << 1;
            formattedExp = `${display} << 1`;
            break;
          case 'rshift':
            result = parseInt(display) >> 1;
            formattedExp = `${display} >> 1`;
            break;
          case 'reciprocal':
            result = 1 / num;
            formattedExp = `1/${num}`;
            break;
          case 'exp':
            result = Math.exp(num);
            formattedExp = `e^${num}`;
            break;
          case 'asin':
            result = (Math.asin(num) * 180) / Math.PI;
            formattedExp = `asin(${num})`;
            break;
          case 'acos':
            result = (Math.acos(num) * 180) / Math.PI;
            formattedExp = `acos(${num})`;
            break;
          case 'atan':
            result = (Math.atan(num) * 180) / Math.PI;
            formattedExp = `atan(${num})`;
            break;
          default:
            return;
        }

        const historyItem: HistoryItem = {
          expression: func,
          result: formatDisplayNumber(result),
          formattedExpression: formattedExp,
        };
        setHistory([historyItem, ...history].slice(0, 10));
        setDisplay(formatDisplayNumber(result));
        setShouldResetDisplay(true);
      } catch {
        setDisplay(t.error);
        setShouldResetDisplay(true);
      }
    },
    [display, history, formatDisplayNumber, t],
  );

  return {
    calcType, setCalcType, display, equation, history, setHistory,
    numberBase, setNumberBase, shouldResetDisplay,
    nthRootMode, setNthRootMode, nthPowerMode, setNthPowerMode, tempValue, setTempValue,
    handleNumber, handleOperator, handleDecimal, handleClear, handleBackspace, handleEqual, handleFunction,
    formatDisplayNumber, formatNumberInBase,
  };
};
