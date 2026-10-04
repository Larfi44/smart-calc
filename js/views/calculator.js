// Vanilla port of src/hooks/useCalculator.ts + src/components/Calculator.tsx
import { formatDecimal, roundFloat } from '../utils/format.js';
import { safeEvaluate } from '../utils/safeEvaluate.js';
import { escapeHtml } from '../utils/dom.js';

// ---------------------------------------------------------------------------
// Persistent state (mirrors the state kept by useCalculator, which lived in
// <App/> and therefore survived switching between modes).
// ---------------------------------------------------------------------------
const state = {
  calcType: 'normal',
  display: '0',
  equation: '',
  numberBase: 'dec',
  rootPending: false,
  tempValue: '',
  justEvaluated: false,
  showHistory: false,
};

// n-th root typing context (was rootPrefixRef / rootOperandRef)
let rootPrefix = '';
let rootOperand = '';

// Translations of the currently mounted instance (set in mount())
let t = null;

const HISTORY_KEY = 'calculator_history';

let history = loadHistory();

function loadHistory() {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Ignore storage errors
  }
}

function pushHistory(item) {
  history = [item, ...history].slice(0, 200);
  saveHistory();
}

// Helper: get everything before the last operand, and the last operand value
function getLastOperand(expr) {
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
    return { prefix: '', operandStr: expr, operandNum: parseFloat(expr) };
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
  return { prefix: '', operandStr: expr, operandNum: parseFloat(expr) };
}

// Convert a decimal result to a simplified fraction (continued fractions)
function decimalToFraction(value) {
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
}

function formatDisplayNumber(num) {
  if (typeof num === 'string') {
    if (num === 'Infinity' || num === '-Infinity') return t.infinity;
    if (num === 'NaN') return t.error;
    return num;
  }
  if (isNaN(num)) return t.error;
  if (num === Infinity || num === -Infinity) return t.infinity;
  const rounded = roundFloat(num);
  if (state.calcType === 'fractions') return decimalToFraction(rounded);
  return formatDecimal(rounded);
}

function formatNumberInBase(num, base) {
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
}

// Update the display string (mirrors the hook's ref-synced setter)
function updateDisplay(next) {
  state.display = typeof next === 'function' ? next(state.display) : next;
}

// ---------------------------------------------------------------------------
// Input handlers (ported 1:1 from useCalculator)
// ---------------------------------------------------------------------------
function handleNumber(num) {
  if (state.rootPending) {
    const next = state.tempValue + num;
    state.tempValue = next;
    updateDisplay(rootPrefix + '[' + next + ']√' + rootOperand);
    return;
  }

  if (state.justEvaluated) {
    updateDisplay(num);
    state.equation = '';
    state.justEvaluated = false;
    return;
  }

  const currentDisplay = state.display;
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
}

function handleOperator(op) {
  // Finalize a pending [n]√ root (or cancel it if no index was typed)
  if (state.rootPending) {
    if (!state.tempValue) {
      updateDisplay(rootPrefix + rootOperand);
    }
    state.rootPending = false;
    state.tempValue = '';
  }

  if (state.display === t.error || state.display === t.infinity) return;

  // "/" builds a fraction (no spaces around the slash) so the display can
  // render it as a stacked fraction in the fractions calculator
  if (op === '/') {
    const trimmed = state.display.trimEnd();
    if (!trimmed) return;
    if (/[\d)]$/.test(trimmed)) {
      updateDisplay(trimmed + '/');
    } else if (/(?:XOR|AND|OR|mod|%of|<<|>>|[+\-×÷/^])\s*$/.test(trimmed)) {
      updateDisplay(
        trimmed
          .replace(/(?:XOR|AND|OR|mod|%of|<<|>>|[+\-×÷/^])\s*$/, '')
          .trimEnd() + '/',
      );
    }
    if (state.justEvaluated) {
      state.equation = '';
      state.justEvaluated = false;
    }
    return;
  }

  const currentJustEvaluated = state.justEvaluated;

  if (op === '(' || op === ')') {
    const prevDisplay = state.display;
    if (currentJustEvaluated) {
      updateDisplay(op);
      state.equation = '';
      state.justEvaluated = false;
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

  const trimmed = state.display.trimEnd();
  const endsWithAnyOp = /(?:XOR|AND|OR|mod|%of|<<|>>|[+\-×÷/^])\s*$/.test(
    trimmed,
  );

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
      state.equation = '';
      state.justEvaluated = false;
    }
    return;
  }

  // Regular operators (+, -, ×, ÷)
  if (currentJustEvaluated) {
    updateDisplay(trimmed + ' ' + op + ' ');
    state.equation = '';
    state.justEvaluated = false;
    return;
  }

  // Special handling for "-" at the start or after operator: treat as negative sign
  if (op === '-') {
    const currentDisplay = state.display;
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
      trimmed
        .replace(/(?:XOR|AND|OR|mod|%of|<<|>>|[+\-×÷/^])\s*$/, '')
        .trimEnd() +
        ' ' +
        op +
        ' ',
    );
    return;
  }

  updateDisplay(trimmed + ' ' + op + ' ');
}

function handlePower() {
  if (state.rootPending) return;
  if (state.display === t.error || state.display === t.infinity) return;

  const currentJustEvaluated = state.justEvaluated;
  const trimmed = state.display.trimEnd();

  if (!trimmed) return;

  // Replace a trailing operator with ^ if present (like other operators)
  const endsWithAnyOp = /(?:XOR|AND|OR|mod|%of|[+\-×÷])\s*$/.test(trimmed);
  const cleaned = endsWithAnyOp
    ? trimmed.replace(/(?:XOR|AND|OR|mod|%of|[+\-×÷])\s*$/, '').trimEnd()
    : trimmed;

  if (!cleaned || cleaned.endsWith('^')) return;

  updateDisplay(cleaned + '^');
  if (currentJustEvaluated) {
    state.equation = '';
    state.justEvaluated = false;
  }
}

// [x]√ — apply an n-th root to the current number, typed inline (like x^y)
function handleRootPress() {
  if (state.rootPending) return;
  if (state.display === t.error || state.display === t.infinity) return;

  const currentJustEvaluated = state.justEvaluated;
  const currentDisplay = state.display;

  const lastOp = getLastOperand(currentDisplay);
  const operandStr = lastOp ? lastOp.operandStr : currentDisplay;
  const prefix = lastOp ? lastOp.prefix : '';

  if (!/^-?\d+\.?\d*$/.test(operandStr) && !/^\(.*\)$/.test(operandStr)) return;

  rootPrefix = prefix;
  rootOperand = operandStr;
  state.tempValue = '';
  state.rootPending = true;
  updateDisplay(prefix + '[]√' + operandStr);
  if (currentJustEvaluated) {
    state.equation = '';
    state.justEvaluated = false;
  }
}

function handleDecimal() {
  if (state.rootPending) {
    if (!state.tempValue.includes('.')) {
      const next = state.tempValue + '.';
      state.tempValue = next;
      updateDisplay(rootPrefix + '[' + next + ']√' + rootOperand);
    }
    return;
  }

  const currentJustEvaluated = state.justEvaluated;
  const currentDisplay = state.display;

  if (currentJustEvaluated) {
    state.display = '0.';
    state.equation = '';
    state.justEvaluated = false;
    return;
  }

  const parts = currentDisplay.split(/[+\-×÷]\s*/);
  const lastPart = parts[parts.length - 1];

  if (
    !lastPart.includes('.') &&
    !lastPart.includes('π') &&
    !lastPart.includes('e')
  ) {
    state.display = currentDisplay + '.';
  }
}

function handleClear() {
  state.display = '0';
  state.equation = '';
  state.rootPending = false;
  state.tempValue = '';
  state.justEvaluated = false;
}

function handleBackspace() {
  if (state.rootPending) {
    if (state.tempValue) {
      const next = state.tempValue.slice(0, -1);
      state.tempValue = next;
      updateDisplay(rootPrefix + '[' + next + ']√' + rootOperand);
    } else {
      state.rootPending = false;
      updateDisplay(rootPrefix + rootOperand);
    }
    return;
  }

  const currentJustEvaluated = state.justEvaluated;
  const currentDisplay = state.display;

  if (currentJustEvaluated) {
    state.display = '0';
    state.equation = '';
    state.justEvaluated = false;
    return;
  }

  if (
    currentDisplay.length === 1 ||
    currentDisplay === t.error ||
    currentDisplay === t.infinity
  ) {
    state.display = '0';
  } else {
    const trimmed = currentDisplay.trimEnd();
    // Remove word-based operators (AND, OR, XOR, mod, %of) as a whole token
    if (/(?:XOR|AND|OR|mod|%of|<<|>>)\s*$/.test(trimmed)) {
      state.display = trimmed
        .replace(/(?:XOR|AND|OR|mod|%of|<<|>>)\s*$/, '')
        .trimEnd();
    } else if (/[+\-×÷/]\s*$/.test(trimmed)) {
      state.display = trimmed.slice(0, -1).trimEnd();
    } else {
      state.display = currentDisplay.slice(0, -1);
    }
  }
}

// ---------------------------------------------------------------------------
// Expression evaluator (ported 1:1 from useCalculator)
// ---------------------------------------------------------------------------
function evaluateExpression(expr) {
  // Helper for factorial, passed into the generated evaluator function
  const _fact = (n) => {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    if (n > 170) return Infinity;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  };

  // Find the index of the closing parenthesis matching the '(' at `open`
  const findCloseParen = (s, open) => {
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
  const expandParenFunctions = (s) => {
    const trig = {
      sin: (inner) => `Math.sin((${inner})*Math.PI/180)`,
      cos: (inner) => `Math.cos((${inner})*Math.PI/180)`,
      tg: (inner) => `Math.tan((${inner})*Math.PI/180)`,
      ctg: (inner) => `1/Math.tan((${inner})*Math.PI/180)`,
      asin: (inner) => `(Math.asin(${inner})*180/Math.PI)`,
      acos: (inner) => `(Math.acos(${inner})*180/Math.PI)`,
      atg: (inner) => `(Math.atan(${inner})*180/Math.PI)`,
      actg: (inner) => `(Math.atan(1/(${inner}))*180/Math.PI)`,
    };
    const funcs = {
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

  // Replace ")suffix" (e.g. ")²", ")!", ")％") using balanced parentheses:
  // "(9 × 6)²" → "Math.pow((9 × 6),2)"
  const expandPostfixParen = (s, suffix, expand) => {
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
  const expandFactorials = (s) => {
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
    .replace(/(^|\D)(1\/(\d+\.?\d*))/g, (m, pre, frac) => `${pre}(${frac})`);

  // Parenthesized operands for postfix operators: ")²", ")%"
  evalExpr = expandPostfixParen(evalExpr, '%', (inner) => `((${inner})/100)`);
  evalExpr = expandPostfixParen(
    evalExpr,
    '²',
    (inner) => `Math.pow((${inner}),2)`,
  );
  // Functions applied to parenthesized operands: √(...), [n]√(...), sin(...°), ...
  evalExpr = expandParenFunctions(evalExpr);

  // Evaluate safely with a whitelist-based parser instead of eval().
  // "Math." prefixes are stripped — all functions/constants are whitelisted
  // inside safeEvaluate (plus the local factorial helper).
  return safeEvaluate(evalExpr.replace(/Math\./g, ''), { _fact });
}

function handleEqual() {
  try {
    const currentDisplay = state.display;

    // Finalize a pending [n]√ root (or cancel it if no index was typed)
    if (state.rootPending) {
      if (!state.tempValue) {
        updateDisplay(rootPrefix + rootOperand);
        state.rootPending = false;
        state.tempValue = '';
        return;
      }
      state.rootPending = false;
      state.tempValue = '';
    }

    const trimmedDisplay = currentDisplay.trim();
    if (!trimmedDisplay || trimmedDisplay === '0') return;
    if (/(?:XOR|AND|OR|mod|%of|<<|>>|[+\-×÷/^])\s*$/.test(trimmedDisplay))
      return;

    // Store the history entry + promote the result to the display
    const commit = (expression, formattedExpression, result) => {
      pushHistory({
        expression,
        result: formatDisplayNumber(result),
        formattedExpression,
      });
      state.equation = expression + ' =';
      state.display = formatDisplayNumber(result);
      state.justEvaluated = true;
    };

    if (trimmedDisplay.includes(' %of ')) {
      const [a, b] = trimmedDisplay
        .split(' %of ')
        .map((s) => evaluateExpression(s.trim()));
      commit(`${a} %of ${b}`, `${a}% от ${b}`, (a * b) / 100);
      return;
    }

    if (trimmedDisplay.includes(' AND ')) {
      const [a, b] = trimmedDisplay
        .split(' AND ')
        .map((s) => parseInt(s, 10));
      commit(`${a} AND ${b}`, `${a} AND ${b}`, a & b);
      return;
    }

    if (
      trimmedDisplay.includes(' OR ') &&
      !trimmedDisplay.includes(' XOR ')
    ) {
      const [a, b] = trimmedDisplay.split(' OR ').map((s) => parseInt(s, 10));
      commit(`${a} OR ${b}`, `${a} OR ${b}`, a | b);
      return;
    }

    if (trimmedDisplay.includes(' XOR ')) {
      const [a, b] = trimmedDisplay.split(' XOR ').map((s) => parseInt(s, 10));
      commit(`${a} XOR ${b}`, `${a} XOR ${b}`, a ^ b);
      return;
    }

    if (trimmedDisplay.includes(' mod ')) {
      const [a, b] = trimmedDisplay
        .split(' mod ')
        .map((s) => evaluateExpression(s.trim()));
      commit(`${a} mod ${b}`, `${a} mod ${b}`, ((a % b) + b) % b);
      return;
    }

    const result = evaluateExpression(trimmedDisplay);
    commit(trimmedDisplay, trimmedDisplay, result);
  } catch {
    state.display = t.error;
    state.justEvaluated = true;
  }
}

function handleFunction(func) {
  try {
    if (state.rootPending) return;

    const currentDisplay = state.display;
    const currentJustEvaluated = state.justEvaluated;

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
        const newNum = numStr.startsWith('-') ? numStr.slice(1) : '-' + numStr;
        state.display = prefix + newNum;
      } else {
        state.display = currentDisplay.startsWith('-')
          ? currentDisplay.slice(1)
          : '-' + currentDisplay;
      }
      return;
    }

    // For unary functions: just append notation to display, evaluate on "="
    const lastOp = getLastOperand(currentDisplay);
    const operandStr = lastOp ? lastOp.operandStr : currentDisplay;
    const prefix = lastOp ? lastOp.prefix : '';

    let newDisplay;

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
          state.display = 'π';
          state.justEvaluated = false;
        } else {
          const lc = currentDisplay.slice(-1);
          const nm = /[\d)πe]/.test(lc);
          state.display = currentDisplay + (nm ? '×' : '') + 'π';
        }
        return;
      case 'e':
        if (
          currentJustEvaluated ||
          currentDisplay === '0' ||
          currentDisplay === t.error
        ) {
          state.display = 'e';
          state.justEvaluated = false;
        } else {
          const lc = currentDisplay.slice(-1);
          const nm = /[\d)πe]/.test(lc);
          state.display = currentDisplay + (nm ? '×' : '') + 'e';
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

    state.display = newDisplay;
    state.equation = '';
    state.justEvaluated = false;
  } catch {
    state.display = t.error;
    state.justEvaluated = true;
  }
}

// ---------------------------------------------------------------------------
// Markup (ported from Calculator.tsx)
// ---------------------------------------------------------------------------
// Format programmer display: convert numbers to selected base, keep operators
function formatProgrammerDisplay(expr) {
  const parts = expr.split(
    /(\s*[+\-×÷/]\s*|\s+(?:XOR|AND|OR|mod|%of)\s+|\s*(?:<<|>>)\s*)/,
  );
  return parts
    .map((part) => {
      if (part == null) return '';
      const trimmed = part.trim();
      if (
        !trimmed ||
        /^[+\-×÷/]$/.test(trimmed) ||
        /^(<<|>>)$/.test(trimmed) ||
        /^(XOR|AND|OR|mod|%of)$/.test(trimmed)
      ) {
        return escapeHtml(part);
      }
      // Only format plain numbers; otherwise expressions like "5 << 1" would
      // be parsed as just 5 and the " << 1" part would be hidden from display
      if (!/^-?\d+\.?\d*$/.test(trimmed)) return escapeHtml(part);
      const num = parseFloat(trimmed);
      if (isNaN(num)) return escapeHtml(part);
      return escapeHtml(formatNumberInBase(num, state.numberBase));
    })
    .join('');
}

// Render "a/b" tokens as stacked fractions (for the fractions calculator)
function formatFractionDisplay(expr) {
  const parts = expr.split(/(\s+)/);
  return parts
    .map((part) => {
      if (part == null) return '';
      if (part.trim() !== part) return escapeHtml(part);
      const fraction = part.match(/^(-?\d+\.?\d*)[/÷](-?\d+\.?\d*)$/);
      if (fraction) {
        return (
          '<span class="fraction">' +
          `<span class="frac-num">${escapeHtml(fraction[1])}</span>` +
          '<span class="frac-line"></span>' +
          `<span class="frac-den">${escapeHtml(fraction[2])}</span>` +
          '</span>'
        );
      }
      const partial = part.match(/^(-?\d+\.?\d*)[/÷]$/);
      if (partial) {
        return (
          '<span class="fraction">' +
          `<span class="frac-num">${escapeHtml(partial[1])}</span>` +
          '<span class="frac-line"></span>' +
          '<span class="frac-den"></span>' +
          '</span>'
        );
      }
      return escapeHtml(part);
    })
    .join('');
}

function displayHtml() {
  if (state.calcType === 'programmer') return formatProgrammerDisplay(state.display);
  if (state.calcType === 'fractions') return formatFractionDisplay(state.display);
  return escapeHtml(state.display);
}

// --- button builders -------------------------------------------------------
const typeBtn = (type, label) =>
  `<button class="calc-type-btn ${state.calcType === type ? 'active' : ''}" ` +
  `data-action="calc-type" data-value="${type}">${escapeHtml(label)}</button>`;

const funcBtn = (func, label, extra = '') =>
  `<button class="func-btn ${extra}" data-action="func" ` +
  `data-value="${func}">${escapeHtml(label)}</button>`;

const opBtn = (op, label) =>
  `<button class="btn btn-operator" data-action="operator" ` +
  `data-value="${escapeHtml(op)}">${escapeHtml(label)}</button>`;

const numBtn = (num) =>
  `<button class="btn btn-number" data-action="number" ` +
  `data-value="${num}">${num}</button>`;

const baseBtn = (base, label) =>
  `<button class="func-btn ${state.numberBase === base ? 'active' : ''}" ` +
  `data-action="base" data-value="${base}">${label}</button>`;

// Scientific / fractions function rows
const scientificRows = () => `
  <div class="function-row">
    ${funcBtn('square', 'x²')}
    <button class="func-btn" data-action="power">xʸ</button>
    ${funcBtn('sqrt', '√')}
    <button class="func-btn" data-action="root">ˣ√</button>
    ${funcBtn('sin', 'sin')}
  </div>
  <div class="function-row">
    ${funcBtn('cos', 'cos')}
    ${funcBtn('tg', 'tg')}
    ${funcBtn('ctg', 'ctg')}
    ${funcBtn('log', 'log')}
    ${funcBtn('ln', 'ln')}
  </div>
  <div class="function-row">
    ${funcBtn('asin', 'asin')}
    ${funcBtn('acos', 'acos')}
    ${funcBtn('atg', 'atg')}
    ${funcBtn('actg', 'actg')}
    ${funcBtn('pi', 'π')}
  </div>
  <div class="function-row">
    ${funcBtn('e', 'e')}
    ${funcBtn('fact', 'x!')}
    <button class="func-btn" data-action="operator" data-value="mod">mod</button>
    <button class="func-btn" data-action="operator" data-value="%of">${escapeHtml(
      t.percentOfBtn || '% от',
    )}</button>
    ${funcBtn('round', 'rnd')}
  </div>
`;

// Programmer function rows
const programmerRows = () => `
  <div class="function-row">
    <button class="func-btn" data-action="operator" data-value="XOR">XOR</button>
    <button class="func-btn" data-action="operator" data-value="AND">AND</button>
    <button class="func-btn" data-action="operator" data-value="OR">OR</button>
    ${funcBtn('not', 'NOT')}
    ${funcBtn('lshift', '«')}
  </div>
  <div class="function-row">
    ${funcBtn('rshift', '»')}
    ${baseBtn('dec', 'DEC')}
    ${baseBtn('bin', 'BIN')}
    ${baseBtn('oct', 'OCT')}
    ${baseBtn('hex', 'HEX')}
  </div>
`;

// Normal calculator function row
const normalRow = () => `
  <div class="function-row">
    ${funcBtn('square', 'x²')}
    ${funcBtn('sqrt', '√')}
    ${funcBtn('pi', 'π')}
    ${funcBtn('e', 'e')}
    ${funcBtn('fact', 'n!')}
  </div>
`;

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function render(root) {
  const divOp = state.calcType === 'fractions' ? '/' : '÷';

  root.innerHTML = `
    <div class="calc-type-selector">
      ${typeBtn('normal', t.normal)}
      ${typeBtn('scientific', t.scientific)}
      ${typeBtn('programmer', t.programmer)}
      ${typeBtn('fractions', t.fractions)}
    </div>

    <div class="calculator-display">
      <div class="equation">${escapeHtml(state.equation)}</div>
      <div class="display-value">${displayHtml()}</div>
    </div>

    <div class="calculator-buttons">
      ${state.calcType === 'scientific' || state.calcType === 'fractions'
        ? scientificRows()
        : ''}
      ${state.calcType === 'programmer' ? programmerRows() : ''}
      ${state.calcType === 'normal' ? normalRow() : ''}

      <div class="button-row button-row-top">
        <button class="btn btn-clear" data-action="clear">C</button>
        <button class="btn btn-backspace" data-action="backspace">⌫</button>
        ${opBtn('(', '(')}
        ${opBtn(')', ')')}
        ${opBtn(divOp, divOp)}
      </div>

      <div class="button-row">
        ${numBtn('7')}${numBtn('8')}${numBtn('9')}${opBtn('×', '×')}
      </div>

      <div class="button-row">
        ${numBtn('4')}${numBtn('5')}${numBtn('6')}${opBtn('-', '−')}
      </div>

      <div class="button-row">
        ${numBtn('1')}${numBtn('2')}${numBtn('3')}${opBtn('+', '+')}
      </div>

      <div class="button-row">
        <button class="btn btn-negative" data-action="func" data-value="negate">±</button>
        ${numBtn('0')}
        <button class="btn btn-decimal" data-action="decimal">.</button>
        <button class="btn btn-equal" data-action="equal">=</button>
      </div>
    </div>

    <button class="history-toggle" data-action="toggle-history">
      ${escapeHtml(state.showHistory ? t.hideHistory : t.showHistory)}
    </button>

    ${
      state.showHistory && history.length > 0
        ? `<div class="history-panel">
             <h3>${escapeHtml(t.history)}</h3>
             ${history
               .map(
                 (item) => `<div class="history-item">
                   <span class="history-expression">${escapeHtml(
                     item.formattedExpression,
                   )}</span>
                   <span class="history-result">= ${escapeHtml(item.result)}</span>
                 </div>`,
               )
               .join('')}
           </div>`
        : ''
    }
  `;
}

function handleClick(event, root) {
  const button = event.target.closest('[data-action]');
  if (!button || !root.contains(button)) return;

  const { action, value } = button.dataset;

  switch (action) {
    case 'calc-type':
      state.calcType = value;
      break;
    case 'base':
      state.numberBase = value;
      break;
    case 'number':
      handleNumber(value);
      break;
    case 'operator':
      handleOperator(value);
      break;
    case 'decimal':
      handleDecimal();
      break;
    case 'clear':
      handleClear();
      break;
    case 'backspace':
      handleBackspace();
      break;
    case 'equal':
      handleEqual();
      break;
    case 'power':
      handlePower();
      break;
    case 'root':
      handleRootPress();
      break;
    case 'func':
      handleFunction(value);
      break;
    case 'toggle-history':
      state.showHistory = !state.showHistory;
      break;
    default:
      return;
  }

  render(root);
}

// ---------------------------------------------------------------------------
// Public entry point — replaces the <Calculator /> React component
// ---------------------------------------------------------------------------
export const mountCalculator = (container, ctx) => {
  t = ctx.t;

  const root = document.createElement('div');
  root.className = 'calculator-mode';
  container.innerHTML = '';
  container.appendChild(root);

  root.addEventListener('click', (event) => handleClick(event, root));
  render(root);

  return { el: root, refresh: () => render(root) };
};
