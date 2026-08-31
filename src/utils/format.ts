// Remove JavaScript floating-point noise (e.g. Math.sin(30°) → 0.49999999999999994)
export const roundFloat = (value: number): number => {
  if (!isFinite(value)) return value;
  return parseFloat(value.toPrecision(12));
};

// Format decimals: 2 digits after "." by default. If the value is small, show
// one digit after the first non-zero digit so the precision is kept (e.g.
// 0.0166 → "0.017", 0.005 → "0.005"). If rounding would hide the fractional
// part entirely (e.g. 0.996 → "1"), show more digits (0.996 → "0.996").
// Trailing zeros are removed (2.50 → 2.5). A value that is exactly 0 (or has
// no fractional part) is shown as "0" / integer.
export const formatDecimal = (value: number): string => {
  if (!isFinite(value)) return value.toString();
  if (value === 0) return '0';
  const abs = Math.abs(value);
  const s = abs.toFixed(12);
  const dot = s.indexOf('.');
  if (dot === -1) return value.toString();
  let firstNonZero = -1;
  for (let i = dot + 1; i < s.length; i++) {
    if (s[i] !== '0') {
      firstNonZero = i - dot;
      break;
    }
  }
  if (firstNonZero === -1) {
    // Integer value — nothing meaningful after the decimal point
    return value.toFixed(0);
  }
  const baseDecimals = Math.max(2, firstNonZero + 1);
  // Increase decimals while rounding would hide the fractional part entirely
  // (e.g. 1020 MB → GB = 0.99609375, where 2 decimals give "1")
  for (let d = baseDecimals; d <= 12; d++) {
    const formatted = value.toFixed(d).replace(/0+$/, '').replace(/\.$/, '');
    if (formatted.includes('.')) return formatted;
  }
  return value
    .toFixed(baseDecimals)
    .replace(/0+$/, '')
    .replace(/\.$/, '');
};
