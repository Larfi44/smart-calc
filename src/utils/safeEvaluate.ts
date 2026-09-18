// Safe arithmetic expression evaluator — replaces eval()/new Function().
// Supports: numbers, + - * / % ** ~ << >>, parentheses, unary +/-/~,
// and a strict whitelist of functions and constants. Anything else throws.

type Func = (...args: number[]) => number;

type Token =
  | { type: 'num'; value: number }
  | { type: 'name'; value: string }
  | { type: 'op'; value: string };

export const safeEvaluate = (
  expr: string,
  extraFunctions: Record<string, Func> = {},
): number => {
  const functions: Record<string, Func> = {
    pow: Math.pow,
    sqrt: Math.sqrt,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    log10: Math.log10,
    log: Math.log,
    round: Math.round,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    abs: Math.abs,
    ...extraFunctions,
  };
  const constants: Record<string, number> = {
    PI: Math.PI,
    E: Math.E,
  };

  // --- Tokenizer ---
  const tokens: Token[] = [];
  let pos = 0;
  while (pos < expr.length) {
    const ch = expr[pos];
    if (/\s/.test(ch)) {
      pos++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let end = pos;
      while (end < expr.length && /[0-9.]/.test(expr[end])) end++;
      const value = Number(expr.slice(pos, end));
      if (isNaN(value)) throw new Error('Invalid number');
      tokens.push({ type: 'num', value });
      pos = end;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let end = pos;
      while (end < expr.length && /[A-Za-z0-9_]/.test(expr[end])) end++;
      tokens.push({ type: 'name', value: expr.slice(pos, end) });
      pos = end;
      continue;
    }
    const two = expr.slice(pos, pos + 2);
    if (two === '**' || two === '<<' || two === '>>') {
      tokens.push({ type: 'op', value: two });
      pos += 2;
      continue;
    }
    if ('+-*/%~(),'.includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      pos++;
      continue;
    }
    throw new Error('Invalid character in expression');
  }

  // --- Recursive-descent parser (precedence mirrors JavaScript) ---
  let index = 0;

  const peek = (): Token | undefined => tokens[index];
  const matchOp = (...ops: string[]): string | null => {
    const token = peek();
    if (token && token.type === 'op' && ops.includes(token.value)) {
      index++;
      return token.value;
    }
    return null;
  };
  const expectOp = (op: string): void => {
    if (!matchOp(op)) throw new Error(`Expected "${op}"`);
  };

  const parsePrimary = (): number => {
    const token = peek();
    if (!token) throw new Error('Unexpected end of expression');
    if (token.type === 'num') {
      index++;
      return token.value;
    }
    if (token.type === 'name') {
      index++;
      const name = token.value;
      if (peek() && peek()!.type === 'op' && peek()!.value === '(') {
        const fn = functions[name];
        if (!fn || !Object.hasOwn(functions, name)) {
          throw new Error(`Unknown function: ${name}`);
        }
        expectOp('(');
        const args: number[] = [];
        if (!(peek() && peek()!.type === 'op' && peek()!.value === ')')) {
          args.push(parseExpression());
          while (matchOp(',')) args.push(parseExpression());
        }
        expectOp(')');
        return fn(...args);
      }
      if (Object.hasOwn(constants, name)) return constants[name];
      throw new Error(`Unknown identifier: ${name}`);
    }
    if (token.value === '(') {
      index++;
      const value = parseExpression();
      expectOp(')');
      return value;
    }
    throw new Error('Unexpected token');
  };

  const parsePower = (): number => {
    const base = parsePrimary();
    if (matchOp('**')) return Math.pow(base, parseUnary());
    return base;
  };

  const parseUnary = (): number => {
    if (matchOp('-')) return -parseUnary();
    if (matchOp('+')) return parseUnary();
    if (matchOp('~')) return ~parseUnary();
    return parsePower();
  };

  const parseMultiplicative = (): number => {
    let left = parseUnary();
    let op: string | null;
    while ((op = matchOp('*', '/', '%')) !== null) {
      const right = parseUnary();
      if (op === '*') left *= right;
      else if (op === '/') left /= right;
      else left %= right;
    }
    return left;
  };

  const parseAdditive = (): number => {
    let left = parseMultiplicative();
    let op: string | null;
    while ((op = matchOp('+', '-')) !== null) {
      const right = parseMultiplicative();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  };

  const parseExpression = (): number => {
    let left = parseAdditive();
    let op: string | null;
    while ((op = matchOp('<<', '>>')) !== null) {
      const right = parseAdditive();
      left = op === '<<' ? left << right : left >> right;
    }
    return left;
  };

  const result = parseExpression();
  if (index !== tokens.length) throw new Error('Unexpected trailing tokens');
  return result;
};
