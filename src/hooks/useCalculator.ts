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
  const [numberBase, setNumberBase] = useState<NumberBase>('dec');
  const [nthRootMode, setNthRootMode] = useState(false);
  const [nthPowerMode, setNthPowerMode] = useState(false);
  const [tempValue, setTempValue] = useState('');
  const [justEvaluated, setJustEvaluated] = useState(false);

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
        setTempValue((prev) => prev + num);
        return;
      }

      if (justEvaluated) {
        setDisplay(num);
        setEquation('');
        setJustEvaluated(false);
        return;
      }

      if (display === '0' || display === t.error || display === t.infinity) {
        setDisplay(num);
      } else {
        const trimmed = display.trimEnd();
        const endsWithOperator = /[+\-×÷\s]$/.test(trimmed) || /(AND|OR|XOR|mod)\s*$/.test(trimmed);
        
        if (endsWithOperator) {
          const base = trimmed.replace(/\s+[+\-×÷]\s*$/, '').replace(/\s+(AND|OR|XOR|mod)\s*$/, '');
          setDisplay(base + ' ' + num);
        } else {
          const lastChar = display.slice(-1);
          const needsMultiply = /[πe)]/.test(lastChar);
          setDisplay(display + (needsMultiply ? '×' : '') + num);
        }
      }
    },
    [display, justEvaluated, nthRootMode, nthPowerMode, t],
  );

  const handleOperator = useCallback(
    (op: string) => {
      if (nthRootMode || nthPowerMode) return;
      if (display === t.error || display === t.infinity) return;

      if (op === '(' || op === ')') {
        if (justEvaluated) {
          setDisplay(op);
          setEquation('');
          setJustEvaluated(false);
          return;
        }
        if (display === '0') {
          setDisplay(op);
        } else {
          if (op === '(' && /[\dπe)]/.test(display.slice(-1))) {
            setDisplay(display + '×' + op);
          } else {
            setDisplay(display + op);
          }
        }
        return;
      }

      if (op === 'AND' || op === 'OR' || op === 'XOR') {
        if (justEvaluated) {
          setDisplay(display + ' ' + op + ' ');
          setEquation('');
          setJustEvaluated(false);
          return;
        }
        const trimmed = display.trimEnd();
        if (/[+\-×÷\s]*$/.test(trimmed)) {
          setDisplay(trimmed.slice(0, -1).trimEnd() + ' ' + op + ' ');
          return;
        }
        setDisplay(display + ' ' + op + ' ');
        return;
      }

      if (justEvaluated) {
        setDisplay(display + ' ' + op + ' ');
        setEquation('');
        setJustEvaluated(false);
        return;
      }

      const trimmed = display.trimEnd();
      if (/[+\-×÷]\s*$/.test(trimmed)) {
        setDisplay(trimmed.slice(0, -1).trimEnd() + ' ' + op + ' ');
        return;
      }

      setDisplay(display + ' ' + op + ' ');
    },
    [display, justEvaluated, nthRootMode, nthPowerMode, t],
  );

  const handleDecimal = useCallback(() => {
    if (nthRootMode || nthPowerMode) {
      if (!tempValue.includes('.')) {
        setTempValue((prev) => prev + '.');
      }
      return;
    }

    if (justEvaluated) {
      setDisplay('0.');
      setEquation('');
      setJustEvaluated(false);
      return;
    }

    const parts = display.split(/[+\-×÷]\s*/);
    const lastPart = parts[parts.length - 1];

    if (!lastPart.includes('.') && !lastPart.includes('π') && !lastPart.includes('e')) {
      setDisplay(display + '.');
    }
  }, [display, justEvaluated, nthRootMode, nthPowerMode, tempValue]);

  const handleClear = useCallback(() => {
    setDisplay('0');
    setEquation('');
    setNthRootMode(false);
    setNthPowerMode(false);
    setTempValue('');
    setJustEvaluated(false);
  }, []);

  const handleBackspace = useCallback(() => {
    if (nthRootMode || nthPowerMode) {
      setTempValue((prev) => prev.slice(0, -1) || '');
      return;
    }

    if (justEvaluated) {
      setDisplay('0');
      setEquation('');
      setJustEvaluated(false);
      return;
    }

    if (display.length === 1 || display === t.error || display === t.infinity) {
      setDisplay('0');
    } else {
      const trimmed = display.trimEnd();
      if (/[+\-×÷]\s*$/.test(trimmed)) {
        setDisplay(trimmed.slice(0, -1).trimEnd());
      } else {
        setDisplay(display.slice(0, -1));
      }
    }
  }, [display, justEvaluated, nthRootMode, nthPowerMode, t]);

  const evaluateExpression = (expr: string): number => {
    let evalExpr = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, `(${Math.PI})`)
      .replace(/e(?![a-zA-Z])/g, `(${Math.E})`);
    return eval(evalExpr);
  };

  const handleEqual = useCallback(() => {
    try {
      if (nthRootMode && tempValue) {
        const num = parseFloat(display);
        const root = parseFloat(tempValue);
        const result = Math.pow(num, 1 / root);
        setHistory([{ expression: `nthRoot(${num}, ${root})`, result: formatDisplayNumber(result), formattedExpression: `√[${root}]${num}` }, ...history].slice(0, 10));
        setEquation(`√[${root}]${num} =`);
        setDisplay(formatDisplayNumber(result));
        setNthRootMode(false); setTempValue(''); setJustEvaluated(true);
        return;
      }

      if (nthPowerMode && tempValue) {
        const num = parseFloat(display);
        const power = parseFloat(tempValue);
        const result = Math.pow(num, power);
        setHistory([{ expression: `nthPower(${num}, ${power})`, result: formatDisplayNumber(result), formattedExpression: `${num}^${power}` }, ...history].slice(0, 10));
        setEquation(`${num}^${power} =`);
        setDisplay(formatDisplayNumber(result));
        setNthPowerMode(false); setTempValue(''); setJustEvaluated(true);
        return;
      }

      const trimmedDisplay = display.trim();
      if (!trimmedDisplay || trimmedDisplay === '0') return;
      if (/[+\-×÷]\s*$/.test(trimmedDisplay)) return;

      if (trimmedDisplay.includes(' %of ')) {
        const [a, b] = trimmedDisplay.split(' %of ').map(parseFloat);
        const result = (a * b) / 100;
        setHistory([{ expression: `${a} %of ${b}`, result: formatDisplayNumber(result), formattedExpression: `${a}% от ${b}` }, ...history].slice(0, 10));
        setEquation(`${a} %of ${b} =`); setDisplay(formatDisplayNumber(result)); setJustEvaluated(true); return;
      }

      if (trimmedDisplay.includes(' AND ')) {
        const [a, b] = trimmedDisplay.split(' AND ').map(parseInt);
        const result = a & b;
        setHistory([{ expression: `${a} AND ${b}`, result: formatDisplayNumber(result), formattedExpression: `${a} AND ${b}` }, ...history].slice(0, 10));
        setEquation(`${a} AND ${b} =`); setDisplay(formatDisplayNumber(result)); setJustEvaluated(true); return;
      }

      if (trimmedDisplay.includes(' OR ') && !trimmedDisplay.includes(' XOR ')) {
        const [a, b] = trimmedDisplay.split(' OR ').map(parseInt);
        const result = a | b;
        setHistory([{ expression: `${a} OR ${b}`, result: formatDisplayNumber(result), formattedExpression: `${a} OR ${b}` }, ...history].slice(0, 10));
        setEquation(`${a} OR ${b} =`); setDisplay(formatDisplayNumber(result)); setJustEvaluated(true); return;
      }

      if (trimmedDisplay.includes(' XOR ')) {
        const [a, b] = trimmedDisplay.split(' XOR ').map(parseInt);
        const result = a ^ b;
        setHistory([{ expression: `${a} XOR ${b}`, result: formatDisplayNumber(result), formattedExpression: `${a} XOR ${b}` }, ...history].slice(0, 10));
        setEquation(`${a} XOR ${b} =`); setDisplay(formatDisplayNumber(result)); setJustEvaluated(true); return;
      }

      if (trimmedDisplay.includes(' mod ')) {
        const [a, b] = trimmedDisplay.split(' mod ').map(parseFloat);
        const result = a % b;
        setHistory([{ expression: `${a} mod ${b}`, result: formatDisplayNumber(result), formattedExpression: `${a} mod ${b}` }, ...history].slice(0, 10));
        setEquation(`${a} mod ${b} =`); setDisplay(formatDisplayNumber(result)); setJustEvaluated(true); return;
      }

      const result = evaluateExpression(trimmedDisplay);
      setHistory([{ expression: trimmedDisplay, result: formatDisplayNumber(result), formattedExpression: trimmedDisplay }, ...history].slice(0, 10));
      setEquation(trimmedDisplay + ' =');
      setDisplay(formatDisplayNumber(result));
      setJustEvaluated(true);
    } catch {
      setDisplay(t.error); setJustEvaluated(true);
    }
  }, [display, history, formatDisplayNumber, t, nthRootMode, nthPowerMode, tempValue]);

  const handleFunction = useCallback(
    (func: string, param?: number) => {
      try {
        if (func === 'negate') {
          if (display === '0' || display === t.error || display === t.infinity) return;
          const match = display.match(/(.*[+\-×÷]\s*)(-?\d+\.?\d*)$/);
          if (match) {
            const prefix = match[1];
            const numStr = match[2];
            const newNum = numStr.startsWith('-') ? numStr.slice(1) : '-' + numStr;
            setDisplay(prefix + newNum);
          } else {
            setDisplay(display.startsWith('-') ? display.slice(1) : '-' + display);
          }
          return;
        }

        const num = parseFloat(display);
        let result = 0;
        let formattedExp = '';

        switch (func) {
          case 'sqrt': result = Math.sqrt(num); formattedExp = `√${num}`; break;
          case 'nthRoot':
            if (param !== undefined) { result = Math.pow(num, 1 / param); formattedExp = `√[${param}]${num}`; }
            else return;
            break;
          case 'square': result = Math.pow(num, 2); formattedExp = `${num}²`; break;
          case 'nthPower':
            if (param !== undefined) { result = Math.pow(num, param); formattedExp = `${num}^${param}`; }
            else return;
            break;
          case 'sin': result = Math.sin((num * Math.PI) / 180); formattedExp = `sin(${num}°)`; break;
          case 'cos': result = Math.cos((num * Math.PI) / 180); formattedExp = `cos(${num}°)`; break;
          case 'tg': result = Math.tan((num * Math.PI) / 180); formattedExp = `tg(${num}°)`; break;
          case 'ctg': result = 1 / Math.tan((num * Math.PI) / 180); formattedExp = `ctg(${num}°)`; break;
          case 'log': result = Math.log10(num); formattedExp = `log(${num})`; break;
          case 'ln': result = Math.log(num); formattedExp = `ln(${num})`; break;
          case 'pi':
            if (justEvaluated || display === '0' || display === t.error) { setDisplay('π'); setJustEvaluated(false); }
            else { const lc = display.slice(-1); const nm = /[\d)πe]/.test(lc); setDisplay(display + (nm ? '×' : '') + 'π'); }
            return;
          case 'e':
            if (justEvaluated || display === '0' || display === t.error) { setDisplay('e'); setJustEvaluated(false); }
            else { const lc = display.slice(-1); const nm = /[\d)πe]/.test(lc); setDisplay(display + (nm ? '×' : '') + 'e'); }
            return;
          case 'abs': result = Math.abs(num); formattedExp = `|${num}|`; break;
          case 'fact': result = factorial(num); formattedExp = `${num}!`; break;
          case 'percent': result = num / 100; formattedExp = `${num}%`; break;
          case 'round': result = Math.round(num); formattedExp = `round(${num})`; break;
          case 'pow10': result = Math.pow(10, num); formattedExp = `10^${num}`; break;
          case 'asin': result = (Math.asin(num) * 180) / Math.PI; formattedExp = `asin(${num})`; break;
          case 'acos': result = (Math.acos(num) * 180) / Math.PI; formattedExp = `acos(${num})`; break;
          case 'atg': result = (Math.atan(num) * 180) / Math.PI; formattedExp = `atg(${num})`; break;
          case 'actg': result = (Math.atan(1 / num) * 180) / Math.PI; formattedExp = `actg(${num})`; break;
          case 'not': result = ~parseInt(display); formattedExp = `~${display}`; break;
          case 'lshift': result = parseInt(display) << 1; formattedExp = `${display} << 1`; break;
          case 'rshift': result = parseInt(display) >> 1; formattedExp = `${display} >> 1`; break;
          case 'reciprocal': result = 1 / num; formattedExp = `1/${num}`; break;
          case 'exp': result = Math.exp(num); formattedExp = `e^${num}`; break;
          default: return;
        }

        setHistory([{ expression: func, result: formatDisplayNumber(result), formattedExpression: formattedExp }, ...history].slice(0, 10));
        setEquation(formattedExp + ' =');
        setDisplay(formatDisplayNumber(result));
        setJustEvaluated(true);
      } catch {
        setDisplay(t.error); setJustEvaluated(true);
      }
    },
    [display, history, formatDisplayNumber, t, justEvaluated],
  );

  return {
    calcType, setCalcType, display, equation, history, setHistory,
    numberBase, setNumberBase,
    nthRootMode, setNthRootMode, nthPowerMode, setNthPowerMode, tempValue, setTempValue,
    handleNumber, handleOperator, handleDecimal, handleClear, handleBackspace, handleEqual, handleFunction,
    formatDisplayNumber, formatNumberInBase,
  };
};
