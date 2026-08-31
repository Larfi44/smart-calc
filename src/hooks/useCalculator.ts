import { useState, useCallback, useEffect, useRef } from 'react';
import type { CalculatorType, NumberBase, HistoryItem } from '../types';
import { formatDecimal, roundFloat } from '../utils/format';

export const useCalculator = (t: any) => {
  const [calcType, setCalcType] = useState<CalculatorType>('normal');
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('calculator_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [numberBase, setNumberBase] = useState<NumberBase>('dec');
  const [rootPending, setRootPending] = useState(false);
  const [tempValue, setTempValue] = useState('');
  const [justEvaluated, setJustEvaluated] = useState(false);

  // Helper: get everything before the last operand, and the last operand value
  const getLastOperand = (
    expr: string,
  ): { prefix: string; operandStr: string; operandNum: number } => {
    const match = expr.match(/(.*[+\-×÷/]\s*)(-?\d+\.?\d*)$/);
    if (match) {
      return {
        prefix: match[1],
        operandStr: match[2],
        operandNum: parseFloat(match[2]),
      };
    }
    // Full expression is just a number (possibly negative)
    if (/^-?\d+\.?\d*$/.test(expr)) {
      return {
        prefix: '',
        operandStr: expr,
        operandNum: parseFloat(expr),
      };
    }
    // Trailing balanced parenthesized group, e.g. "5 + (9 × 6)" or "(9 × 6)"
    if (expr.endsWith(')')) {
      let depth = 0;
      for (let i = expr.length - 1; i >= 0; i--) {
        if (expr[i] === ')') depth++;
        else if (expr[i] === '(') {
          depth--;
          if (depth === 0) {
            return {
              prefix: expr.slice(0, i),
              operandStr: expr.slice(i),
              operandNum: parseFloat(expr.slice(i)),
            };
          }
        }
      }
    }
    // Fallback: treat entire expression as the operand
    return {
      prefix: '',
      operandStr: expr,
      operandNum: parseFloat(expr),
    };
  };

  // Use refs to always have access to latest state in callbacks
  const displayRef = useRef(display);
  displayRef.current = display;
  const justEvaluatedRef = useRef(justEvaluated);
  justEvaluatedRef.current = justEvaluated;
  const rootPrefixRef = useRef('');
  const rootOperandRef = useRef('');

  useEffect(() => {
    localStorage.setItem('calculator_history', JSON.stringify(history));
  }, [history]);

  // Convert a decimal result to a simplified fraction (continued fractions)
  const decimalToFraction = (value: number): string => {
    if (!isFinite(value)) {
      if (isNaN(value)) return t.error;
      return value > 0 ? t.infinity : '-' + t.infinity;
    }
    if (Number.isInteger(value)) return value.toString();
    const sign = value < 0 ? '-' : '';
    const x = Math.abs(value);
    let h1 = 1;
    let h2 = 0;
    let k1 = 0;
    let k2 = 1;
    let b = x;
    for (let i = 0; i < 64; i++) {
      const a = Math.floor(b);
      const h = a * h1 + h2;
      const k = a * k1 + k2;
      if (k > 10000) break;
      if (Math.abs(x - h / k) < 1e-10) {
        h1 = h;
        k1 = k;
        break;
      }
      h2 = h1;
      h1 = h;
      k2 = k1;
      k1 = k;
      const frac = b - a;
      if (frac < 1e-12) break;
      b = 1 / frac;
    }
    if (k1 === 1) return sign + h1;
    return `${sign}${h1}/${k1}`;
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
      const rounded = roundFloat(num);
      if (calcType === 'fractions') return decimalToFraction(rounded);
      return formatDecimal(rounded);
    },
    [t, calcType],
  );

  const formatNumberInBase = useCallback(
    (num: number, base: NumberBase): string => {
      switch (base) {
        case 'bin':
          return num.toString(2);
        case 'oct':
          return num.toString(8);
        case 'hex':
          return num.toString(16).toUpperCase();
        default:
          return num.toString(10);
      }
    },
    [],
  );

  // Helper: update both display state AND the ref synchronously so subsequent batched handlers see latest value
  const updateDisplay = useCallback(
    (newDisplay: string | ((prev: string) => string)) => {
      if (typeof newDisplay === 'function') {
        setDisplay((prev) => {
          const next = newDisplay(prev);
          displayRef.current = next;
          return next;
        });
      } else {
        displayRef.current = newDisplay;
        setDisplay(newDisplay);
      }
    },
    [],
  );

  const setJustEvaluatedSync = useCallback((val: boolean) => {
    justEvaluatedRef.current = val;
    setJustEvaluated(val);
  }, []);

  const setEquationSync = useCallback((val: string) => {
    setEquation(val);
  }, []);

  const handleNumber = useCallback(
    (num: string) => {
      if (rootPending) {
        const next = tempValue + num;
        setTempValue(next);
        updateDisplay(
          rootPrefixRef.current + '[' + next + ']√' + rootOperandRef.current,
        );
        return;
      }

      if (justEvaluatedRef.current) {
        updateDisplay(num);
        setEquationSync('');
        setJustEvaluatedSync(false);
        return;
      }

      const currentDisplay = displayRef.current;
      if (
        currentDisplay === '0' ||
        currentDisplay === t.error ||
        currentDisplay === t.infinity
      ) {
        updateDisplay(num);
        return;
      }

      // If display is just "-" (user pressed minus to start negative number), append digit
      if (currentDisplay === '-') {
        updateDisplay('-' + num);
        return;
      }

      // Continue a negative operand started after a word operator (e.g. "-1 mod -")
      if (/(?:XOR|AND|OR|mod|%of)-\s*$/.test(currentDisplay)) {
        updateDisplay(currentDisplay + num);
        return;
      }

      const trimmed = currentDisplay.trimEnd();
      const endsWithOperator =
        /[+\-×÷\s]$/.test(trimmed) ||
        /(?:XOR|AND|OR|mod|%of|<<|>>)\s*$/.test(trimmed);

      if (endsWithOperator) {
        updateDisplay(trimmed + ' ' + num);
      } else {
        const lastChar = currentDisplay.slice(-1);
        const needsMultiply = /[πe)]/.test(lastChar);
        updateDisplay(currentDisplay + (needsMultiply ? '×' : '') + num);
      }
    },
    [
      rootPending,
      tempValue,
      t,
      updateDisplay,
      setEquationSync,
      setJustEvaluatedSync,
    ],
  );

  const handleOperator = useCallback(
    (op: string) => {
      // Finalize a pending [n]√ root (or cancel it if no index was typed)
      if (rootPending) {
        if (!tempValue) {
          updateDisplay(rootPrefixRef.current + rootOperandRef.current);
        }
        setRootPending(false);
        setTempValue('');
      }

      if (displayRef.current === t.error || displayRef.current === t.infinity)
        return;

      // "/" builds a fraction (no spaces around the slash) so the display can
      // render it as a stacked fraction in the fractions calculator
      if (op === '/') {
        const trimmed = displayRef.current.trimEnd();
        if (!trimmed) return;
        if (/[\d)]$/.test(trimmed)) {
          updateDisplay(trimmed + '/');
        } else if (
          /(?:XOR|AND|OR|mod|%of|<<|>>|[+\-×÷/^])\s*$/.test(trimmed)
        ) {
          updateDisplay(
            trimmed
              .replace(/(?:XOR|AND|OR|mod|%of|<<|>>|[+\-×÷/^])\s*$/, '')
              .trimEnd() + '/',
          );
        }
        if (justEvaluatedRef.current) {
          setEquationSync('');
          setJustEvaluatedSync(false);
        }
        return;
      }

      const currentJustEvaluated = justEvaluatedRef.current;

      if (op === '(' || op === ')') {
        const prevDisplay = displayRef.current;
        if (currentJustEvaluated) {
          updateDisplay(op);
          setEquationSync('');
          setJustEvaluatedSync(false);
          return;
        }
        if (prevDisplay === '0') {
          updateDisplay(op);
        } else if (op === '(' && /[\dπe)]/.test(prevDisplay.slice(-1))) {
          updateDisplay(prevDisplay + '×' + op);
        } else {
          updateDisplay(prevDisplay + op);
        }
        return;
      }

      const trimmed = displayRef.current.trimEnd();
      const endsWithAnyOp = /(?:XOR|AND|OR|mod|%of|<<|>>|[+\-×÷/^])\s*$/.test(trimmed);

      if (
        op === 'AND' ||
        op === 'OR' ||
        op === 'XOR' ||
        op === 'mod' ||
        op === '%of'
      ) {
        // Prevent duplicate: if display already ends with an operator, replace it
        if (endsWithAnyOp) {
          const cleaned = trimmed.replace(
            /(?:XOR|AND|OR|mod|%of|<<|>>|[+\-×÷/^])\s*$/,
            '',
          );
          updateDisplay(cleaned.trimEnd() + ' ' + op + ' ');
        } else {
          updateDisplay(trimmed + ' ' + op + ' ');
        }
        if (currentJustEvaluated) {
          setEquationSync('');
          setJustEvaluatedSync(false);
        }
        return;
      }

      // Regular operators (+, -, ×, ÷)
      if (currentJustEvaluated) {
        updateDisplay(trimmed + ' ' + op + ' ');
        setEquationSync('');
        setJustEvaluatedSync(false);
        return;
      }

      // Special handling for "-" at the start or after operator: treat as negative sign
      if (op === '-') {
        const currentDisplay = displayRef.current;
        if (currentDisplay === '0' || /[+\-×÷]\s*$/.test(trimmed)) {
          updateDisplay('-');
          return;
        }
        // After a word operator (mod, AND, OR, XOR, %of) start a negative operand
        if (/(?:XOR|AND|OR|mod|%of)\s*$/.test(trimmed)) {
          updateDisplay(trimmed + ' -');
          return;
        }
      }

      if (endsWithAnyOp) {
        updateDisplay(
          trimmed.replace(/(?:XOR|AND|OR|mod|%of|<<|>>|[+\-×÷/^])\s*$/, '').trimEnd() +
            ' ' +
            op +
            ' ',
        );
        return;
      }

      updateDisplay(trimmed + ' ' + op + ' ');
    },
    [
      rootPending,
      tempValue,
      t,
      updateDisplay,
      setEquationSync,
      setJustEvaluatedSync,
    ],
  );

  const handlePower = useCallback(() => {
    if (rootPending) return;
    if (displayRef.current === t.error || displayRef.current === t.infinity)
      return;

    const currentJustEvaluated = justEvaluatedRef.current;
    const trimmed = displayRef.current.trimEnd();

    if (!trimmed) return;

    // Replace a trailing operator with ^ if present (like other operators)
    const endsWithAnyOp = /(?:XOR|AND|OR|mod|%of|[+\-×÷])\s*$/.test(trimmed);
    const cleaned = endsWithAnyOp
      ? trimmed.replace(/(?:XOR|AND|OR|mod|%of|[+\-×÷])\s*$/, '').trimEnd()
      : trimmed;

    if (!cleaned || cleaned.endsWith('^')) return;

    updateDisplay(cleaned + '^');
    if (currentJustEvaluated) {
      setEquationSync('');
      setJustEvaluatedSync(false);
    }
  }, [rootPending, t, updateDisplay, setEquationSync, setJustEvaluatedSync]);

  // [x]√ — apply an n-th root to the current number, typed inline (like x^y)
  const handleRootPress = useCallback(() => {
    if (rootPending) return;
    if (displayRef.current === t.error || displayRef.current === t.infinity)
      return;

    const currentJustEvaluated = justEvaluatedRef.current;
    const currentDisplay = displayRef.current;

    const lastOp = getLastOperand(currentDisplay);
    const operandStr = lastOp ? lastOp.operandStr : currentDisplay;
    const prefix = lastOp ? lastOp.prefix : '';

    if (
      !/^-?\d+\.?\d*$/.test(operandStr) &&
      !/^\(.*\)$/.test(operandStr)
    )
      return;

    rootPrefixRef.current = prefix;
    rootOperandRef.current = operandStr;
    setTempValue('');
    setRootPending(true);
    updateDisplay(prefix + '[]√' + operandStr);
    if (currentJustEvaluated) {
      setEquationSync('');
      setJustEvaluatedSync(false);
    }
  }, [rootPending, t, updateDisplay, setEquationSync, setJustEvaluatedSync]);

  const handleDecimal = useCallback(() => {
    if (rootPending) {
      if (!tempValue.includes('.')) {
        const next = tempValue + '.';
        setTempValue(next);
        updateDisplay(
          rootPrefixRef.current + '[' + next + ']√' + rootOperandRef.current,
        );
      }
      return;
    }

    const currentJustEvaluated = justEvaluatedRef.current;
    const currentDisplay = displayRef.current;

    if (currentJustEvaluated) {
      setDisplay('0.');
      setEquation('');
      setJustEvaluated(false);
      return;
    }

    const parts = currentDisplay.split(/[+\-×÷]\s*/);
    const lastPart = parts[parts.length - 1];

    if (
      !lastPart.includes('.') &&
      !lastPart.includes('π') &&
      !lastPart.includes('e')
    ) {
      setDisplay(currentDisplay + '.');
    }
  }, [rootPending, tempValue, updateDisplay]);

  const handleClear = useCallback(() => {
    setDisplay('0');
    setEquation('');
    setRootPending(false);
    setTempValue('');
    setJustEvaluated(false);
  }, []);

  const handleBackspace = useCallback(() => {
    if (rootPending) {
      if (tempValue) {
        const next = tempValue.slice(0, -1);
        setTempValue(next);
        updateDisplay(
          rootPrefixRef.current + '[' + next + ']√' + rootOperandRef.current,
        );
      } else {
        setRootPending(false);
        updateDisplay(rootPrefixRef.current + rootOperandRef.current);
      }
      return;
    }

    const currentJustEvaluated = justEvaluatedRef.current;
    const currentDisplay = displayRef.current;

    if (currentJustEvaluated) {
      setDisplay('0');
      setEquation('');
      setJustEvaluated(false);
      return;
    }

    if (
      currentDisplay.length === 1 ||
      currentDisplay === t.error ||
      currentDisplay === t.infinity
    ) {
      setDisplay('0');
    } else {
      const trimmed = currentDisplay.trimEnd();
      // Remove word-based operators (AND, OR, XOR, mod, %of) as a whole token
      if (/(?:XOR|AND|OR|mod|%of|<<|>>)\s*$/.test(trimmed)) {
        setDisplay(
          trimmed.replace(/(?:XOR|AND|OR|mod|%of|<<|>>)\s*$/, '').trimEnd(),
        );
      } else if (/[+\-×÷/]\s*$/.test(trimmed)) {
        setDisplay(trimmed.slice(0, -1).trimEnd());
      } else {
        setDisplay(currentDisplay.slice(0, -1));
      }
    }
  }, [rootPending, tempValue, t, updateDisplay]);

  const evaluateExpression = (expr: string): number => {
    // Helper for factorial that can be used inside eval
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _fact = (n: number): number => {
      if (n < 0) return NaN;
      if (n === 0 || n === 1) return 1;
      if (n > 170) return Infinity;
      let r = 1;
      for (let i = 2; i <= n; i++) r *= i;
      return r;
    };

    // Find the index of the closing parenthesis matching the '(' at `open`
    const findCloseParen = (s: string, open: number): number => {
      let depth = 0;
      for (let i = open; i < s.length; i++) {
        if (s[i] === '(') depth++;
        else if (s[i] === ')') {
          depth--;
          if (depth === 0) return i;
        }
      }
      return -1;
    };

    // Expand function notation around parenthesized operands:
    // √(...), [n]√(...), sin(...°), cos(...°), log(...), ln(...), round(...), 10^(...)
    const expandParenFunctions = (s: string): string => {
      const trig: Record<string, (inner: string) => string> = {
        sin: (inner) => `Math.sin((${inner})*Math.PI/180)`,
        cos: (inner) => `Math.cos((${inner})*Math.PI/180)`,
        tg: (inner) => `Math.tan((${inner})*Math.PI/180)`,
        ctg: (inner) => `1/Math.tan((${inner})*Math.PI/180)`,
        asin: (inner) => `(Math.asin(${inner})*180/Math.PI)`,
        acos: (inner) => `(Math.acos(${inner})*180/Math.PI)`,
        atg: (inner) => `(Math.atan(${inner})*180/Math.PI)`,
        actg: (inner) => `(Math.atan(1/(${inner}))*180/Math.PI)`,
      };
      const funcs: Record<string, (inner: string) => string> = {
        log: (inner) => `Math.log10(${inner})`,
        ln: (inner) => `Math.log(${inner})`,
        round: (inner) => `Math.round(${inner})`,
        pow10: (inner) => `Math.pow(10,${inner})`,
      };
      let out = '';
      let i = 0;
      while (i < s.length) {
        // [n]√(expr)
        const nth = s.slice(i).match(/^\[(\d+\.?\d*)]√\(/);
        if (nth) {
          const open = i + nth[0].length - 1;
          const close = findCloseParen(s, open);
          if (close !== -1) {
            out += `Math.pow((${s.slice(open + 1, close)}),1/${nth[1]})`;
            i = close + 1;
            continue;
          }
        }
        // √(expr)
        if (s[i] === '√' && s[i + 1] === '(') {
          const close = findCloseParen(s, i + 1);
          if (close !== -1) {
            out += `Math.sqrt(${s.slice(i + 2, close)})`;
            i = close + 1;
            continue;
          }
        }
        // trig functions: name(expr°)
        const trigMatch = s
          .slice(i)
          .match(/^(sin|cos|tg|ctg|asin|acos|atg|actg)\(/);
        if (trigMatch) {
          const name = trigMatch[1];
          const open = i + name.length;
          const close = findCloseParen(s, open);
          if (close !== -1 && s[close - 1] === '°') {
            out += trig[name](s.slice(open + 1, close - 1));
            i = close + 1;
            continue;
          }
        }
        // other functions: name(expr)
        const fnMatch = s.slice(i).match(/^(log|ln|round|pow10)\(/);
        if (fnMatch) {
          const name = fnMatch[1];
          const open = i + name.length;
          const close = findCloseParen(s, open);
          if (close !== -1) {
            out += funcs[name](s.slice(open + 1, close));
            i = close + 1;
            continue;
          }
        }
        out += s[i];
        i++;
      }
      return out;
    };

    // Replace ")suffix" (e.g. ")²", ")!", ")%") using balanced parentheses:
    // "(9 × 6)²" → "Math.pow((9 × 6),2)"
    const expandPostfixParen = (
      s: string,
      suffix: string,
      expand: (inner: string) => string,
    ): string => {
      // Scan right-to-left so that after replacing one "(...)S" group the
      // already-processed part of the string stays untouched and the prefix
      // keeps its original indices.
      let out = '';
      let i = s.length - 1;
      while (i >= 0) {
        if (s[i] === suffix && s[i - 1] === ')') {
          let depth = 0;
          let open = -1;
          for (let j = i - 1; j >= 0; j--) {
            if (s[j] === ')') depth++;
            else if (s[j] === '(') {
              depth--;
              if (depth === 0) {
                open = j;
                break;
              }
            }
          }
          if (open !== -1) {
            out = expand(s.slice(open + 1, i - 1)) + out;
            i = open - 1;
            continue;
          }
        }
        out = s[i] + out;
        i--;
      }
      return out;
    };

    // Convert "operand!" (factorial) to _fact(operand) before power/square/root
    // conversions so e.g. "2²!" and "2^3!" mean (2²)! and (2^3)!
    const expandFactorials = (s: string): string => {
      let out = '';
      let i = s.length - 1;
      while (i >= 0) {
        if (s[i] === '!') {
          let start = -1;
          let text = '';
          if (i > 0 && s[i - 1] === ')') {
            let depth = 0;
            for (let k = i - 1; k >= 0; k--) {
              if (s[k] === ')') depth++;
              else if (s[k] === '(') {
                depth--;
                if (depth === 0) {
                  start = k;
                  text = s.slice(k, i);
                  break;
                }
              }
            }
          } else {
            let k = i - 1;
            while (k >= 0 && /[\d.^²√]/.test(s[k])) k--;
            if (k < i - 1) {
              start = k + 1;
              text = s.slice(k + 1, i);
            }
          }
          if (start !== -1) {
            out = `_fact(${text})` + out;
            i = start - 1;
            continue;
          }
        }
        out = s[i] + out;
        i--;
      }
      return out;
    };

    let evalExpr = expandFactorials(expr)
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, `(${Math.PI})`)
      .replace(/e(?![a-zA-Z])/g, `(${Math.E})`)
      // Replace % after a number with /100 (must be done before general % replacement)
      .replace(/(\d+)%/g, '($1/100)')
      // Function notations — convert to Math.* for eval
      .replace(/(\d+)²/g, 'Math.pow($1,2)')
      .replace(/\[(\d+\.?\d*)]√(\d+\.?\d*)/g, 'Math.pow($2,1/$1)')
      .replace(/√(\d+\.?\d*)/g, 'Math.sqrt($1)')
      .replace(/sin\((\d+\.?\d*)°\)/g, 'Math.sin(($1)*Math.PI/180)')
      .replace(/cos\((\d+\.?\d*)°\)/g, 'Math.cos(($1)*Math.PI/180)')
      .replace(/tg\((\d+\.?\d*)°\)/g, 'Math.tan(($1)*Math.PI/180)')
      .replace(/ctg\((\d+\.?\d*)°\)/g, '1/Math.tan(($1)*Math.PI/180)')
      .replace(/log\((\d+\.?\d*)\)/g, 'Math.log10($1)')
      .replace(/ln\((\d+\.?\d*)\)/g, 'Math.log($1)')
      .replace(/round\((\d+\.?\d*)\)/g, 'Math.round($1)')
      .replace(/pow10\((\d+\.?\d*)\)/g, 'Math.pow(10,$1)')
      .replace(/(\d+\.?\d*)\s*<<\s*(\d+\.?\d*)/g, '($1 << $2)')
      .replace(/(\d+\.?\d*)\s*>>\s*(\d+\.?\d*)/g, '($1 >> $2)')
      .replace(/~(\d+)/g, '(~$1)')
      .replace(/asin\((\d+\.?\d*)°\)/g, '(Math.asin($1)*180/Math.PI)')
      .replace(/acos\((\d+\.?\d*)°\)/g, '(Math.acos($1)*180/Math.PI)')
      .replace(/atg\((\d+\.?\d*)°\)/g, '(Math.atan($1)*180/Math.PI)')
      .replace(/actg\((\d+\.?\d*)°\)/g, '(Math.atan(1/$1)*180/Math.PI)')
      .replace(/\^/g, '**')
      .replace(/(^|\D)(1\/(\d+\.?\d*))/g, (m, pre, frac, num) => `${pre}(${frac})`);

    // Parenthesized operands for postfix operators: ")²", ")%"
    evalExpr = expandPostfixParen(evalExpr, '%', (inner) => `((${inner})/100)`);
    evalExpr = expandPostfixParen(evalExpr, '²', (inner) => `Math.pow((${inner}),2)`);
    // Functions applied to parenthesized operands: √(...), [n]√(...), sin(...°), ...
    evalExpr = expandParenFunctions(evalExpr);

    return eval(evalExpr);
  };

  const handleEqual = useCallback(() => {
    try {
      const currentDisplay = displayRef.current;

      // Finalize a pending [n]√ root (or cancel it if no index was typed)
      if (rootPending) {
        if (!tempValue) {
          updateDisplay(rootPrefixRef.current + rootOperandRef.current);
          setRootPending(false);
          setTempValue('');
          return;
        }
        setRootPending(false);
        setTempValue('');
      }

      const trimmedDisplay = currentDisplay.trim();
      if (!trimmedDisplay || trimmedDisplay === '0') return;
      if (/(?:XOR|AND|OR|mod|%of|<<|>>|[+\-×÷/^])\s*$/.test(trimmedDisplay)) return;

      if (trimmedDisplay.includes(' %of ')) {
        const [a, b] = trimmedDisplay
          .split(' %of ')
          .map((s) => evaluateExpression(s.trim()));
        const result = (a * b) / 100;
        setHistory(
          [
            {
              expression: `${a} %of ${b}`,
              result: formatDisplayNumber(result),
              formattedExpression: `${a}% от ${b}`,
            },
            ...history,
          ].slice(0, 200),
        );
        setEquation(`${a} %of ${b} =`);
        setDisplay(formatDisplayNumber(result));
        setJustEvaluated(true);
        return;
      }

      if (trimmedDisplay.includes(' AND ')) {
        const [a, b] = trimmedDisplay
          .split(' AND ')
          .map((s) => parseInt(s, 10));
        const result = a & b;
        setHistory(
          [
            {
              expression: `${a} AND ${b}`,
              result: formatDisplayNumber(result),
              formattedExpression: `${a} AND ${b}`,
            },
            ...history,
          ].slice(0, 200),
        );
        setEquation(`${a} AND ${b} =`);
        setDisplay(formatDisplayNumber(result));
        setJustEvaluated(true);
        return;
      }

      if (
        trimmedDisplay.includes(' OR ') &&
        !trimmedDisplay.includes(' XOR ')
      ) {
        const [a, b] = trimmedDisplay.split(' OR ').map((s) => parseInt(s, 10));
        const result = a | b;
        setHistory(
          [
            {
              expression: `${a} OR ${b}`,
              result: formatDisplayNumber(result),
              formattedExpression: `${a} OR ${b}`,
            },
            ...history,
          ].slice(0, 200),
        );
        setEquation(`${a} OR ${b} =`);
        setDisplay(formatDisplayNumber(result));
        setJustEvaluated(true);
        return;
      }

      if (trimmedDisplay.includes(' XOR ')) {
        const [a, b] = trimmedDisplay
          .split(' XOR ')
          .map((s) => parseInt(s, 10));
        const result = a ^ b;
        setHistory(
          [
            {
              expression: `${a} XOR ${b}`,
              result: formatDisplayNumber(result),
              formattedExpression: `${a} XOR ${b}`,
            },
            ...history,
          ].slice(0, 200),
        );
        setEquation(`${a} XOR ${b} =`);
        setDisplay(formatDisplayNumber(result));
        setJustEvaluated(true);
        return;
      }

      if (trimmedDisplay.includes(' mod ')) {
        const [a, b] = trimmedDisplay
          .split(' mod ')
          .map((s) => evaluateExpression(s.trim()));
        const result = ((a % b) + b) % b;
        setHistory(
          [
            {
              expression: `${a} mod ${b}`,
              result: formatDisplayNumber(result),
              formattedExpression: `${a} mod ${b}`,
            },
            ...history,
          ].slice(0, 200),
        );
        setEquation(`${a} mod ${b} =`);
        setDisplay(formatDisplayNumber(result));
        setJustEvaluated(true);
        return;
      }

      const result = evaluateExpression(trimmedDisplay);
      setHistory(
        [
          {
            expression: trimmedDisplay,
            result: formatDisplayNumber(result),
            formattedExpression: trimmedDisplay,
          },
          ...history,
        ].slice(0, 200),
      );
      setEquation(trimmedDisplay + ' =');
      setDisplay(formatDisplayNumber(result));
      setJustEvaluated(true);
    } catch {
      setDisplay(t.error);
      setJustEvaluated(true);
    }
  }, [history, formatDisplayNumber, t, rootPending, tempValue, calcType]);

  const handleFunction = useCallback(
    (func: string) => {
      try {
        if (rootPending) return;

        const currentDisplay = displayRef.current;
        const currentJustEvaluated = justEvaluatedRef.current;

        if (func === 'negate') {
          if (
            currentDisplay === '0' ||
            currentDisplay === t.error ||
            currentDisplay === t.infinity
          )
            return;
          const match = currentDisplay.match(/(.*[+\-×÷/]\s*)(-?\d+\.?\d*)$/);
          if (match) {
            const prefix = match[1];
            const numStr = match[2];
            const newNum = numStr.startsWith('-')
              ? numStr.slice(1)
              : '-' + numStr;
            setDisplay(prefix + newNum);
          } else {
            setDisplay(
              currentDisplay.startsWith('-')
                ? currentDisplay.slice(1)
                : '-' + currentDisplay,
            );
          }
          return;
        }

        // For unary functions: just append notation to display, evaluate on "="
        const lastOp = getLastOperand(currentDisplay);
        const operandStr = lastOp ? lastOp.operandStr : currentDisplay;
        const prefix = lastOp ? lastOp.prefix : '';

        let newDisplay: string;

        switch (func) {
          case 'sqrt':
            newDisplay = prefix + '√' + operandStr;
            break;
          case 'square':
            newDisplay = prefix + operandStr + '²';
            break;
          case 'sin':
            newDisplay = prefix + 'sin(' + operandStr + '°)';
            break;
          case 'cos':
            newDisplay = prefix + 'cos(' + operandStr + '°)';
            break;
          case 'tg':
            newDisplay = prefix + 'tg(' + operandStr + '°)';
            break;
          case 'ctg':
            newDisplay = prefix + 'ctg(' + operandStr + '°)';
            break;
          case 'log':
            newDisplay = prefix + 'log(' + operandStr + ')';
            break;
          case 'ln':
            newDisplay = prefix + 'ln(' + operandStr + ')';
            break;
          case 'pi':
            if (
              currentJustEvaluated ||
              currentDisplay === '0' ||
              currentDisplay === t.error
            ) {
              setDisplay('π');
              setJustEvaluated(false);
            } else {
              const lc = currentDisplay.slice(-1);
              const nm = /[\d)πe]/.test(lc);
              setDisplay(currentDisplay + (nm ? '×' : '') + 'π');
            }
            return;
          case 'e':
            if (
              currentJustEvaluated ||
              currentDisplay === '0' ||
              currentDisplay === t.error
            ) {
              setDisplay('e');
              setJustEvaluated(false);
            } else {
              const lc = currentDisplay.slice(-1);
              const nm = /[\d)πe]/.test(lc);
              setDisplay(currentDisplay + (nm ? '×' : '') + 'e');
            }
            return;
          case 'fact':
            newDisplay = prefix + operandStr + '!';
            break;
          case 'percent':
            newDisplay = prefix + operandStr + '%';
            break;
          case 'round':
            newDisplay = prefix + 'round(' + operandStr + ')';
            break;
          case 'pow10':
            newDisplay = prefix + '10^' + operandStr;
            break;
          case 'asin':
            newDisplay = prefix + 'asin(' + operandStr + '°)';
            break;
          case 'acos':
            newDisplay = prefix + 'acos(' + operandStr + '°)';
            break;
          case 'atg':
            newDisplay = prefix + 'atg(' + operandStr + '°)';
            break;
          case 'actg':
            newDisplay = prefix + 'actg(' + operandStr + '°)';
            break;
          case 'not':
            newDisplay = prefix + '~' + operandStr;
            break;
          case 'lshift':
            newDisplay = prefix + operandStr + ' << ';
            break;
          case 'rshift':
            newDisplay = prefix + operandStr + ' >> ';
            break;
          case 'reciprocal':
            newDisplay = prefix + '1/' + operandStr;
            break;
          case 'exp':
            newDisplay = prefix + 'e^' + operandStr;
            break;
          default:
            return;
        }

        setDisplay(newDisplay);
        setEquation('');
        setJustEvaluated(false);
      } catch {
        setDisplay(t.error);
        setJustEvaluated(true);
      }
    },
    [history, formatDisplayNumber, t, rootPending],
  );

  return {
    calcType,
    setCalcType,
    display,
    equation,
    history,
    setHistory,
    numberBase,
    setNumberBase,
    handleNumber,
    handleOperator,
    handlePower,
    handleRootPress,
    handleDecimal,
    handleClear,
    handleBackspace,
    handleEqual,
    handleFunction,
    formatDisplayNumber,
    formatNumberInBase,
  };
};
