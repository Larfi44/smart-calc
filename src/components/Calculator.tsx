import React from 'react';
import type { CalculatorType, NumberBase, HistoryItem } from '../types';

interface CalculatorProps {
  t: any;
  calcType: CalculatorType;
  setCalcType: (type: CalculatorType) => void;
  display: string;
  equation: string;
  numberBase: NumberBase;
  setNumberBase: (base: NumberBase) => void;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  history: HistoryItem[];
  handleNumber: (num: string) => void;
  handleOperator: (op: string) => void;
  handleDecimal: () => void;
  handleClear: () => void;
  handleBackspace: () => void;
  handleEqual: () => void;
  handleFunction: (func: string) => void;
  formatNumberInBase: (num: number, base: NumberBase) => string;
  handlePower: () => void;
  handleRootPress: () => void;
}

export const Calculator: React.FC<CalculatorProps> = ({
  t,
  calcType,
  setCalcType,
  display,
  equation,
  numberBase,
  setNumberBase,
  showHistory,
  setShowHistory,
  history,
  handleNumber,
  handleOperator,
  handleDecimal,
  handleClear,
  handleBackspace,
  handleEqual,
  handleFunction,
  formatNumberInBase,
  handlePower,
  handleRootPress,
}) => {
  // Format programmer display: convert numbers to selected base, keep operators
  const formatProgrammerDisplay = (expr: string): React.ReactNode[] => {
    const parts = expr.split(
      /(\s*[+\-×÷/]\s*|\s+(?:XOR|AND|OR|mod|%of)\s+|\s*(?:<<|>>)\s*)/,
    );
    return parts.map((part, i) => {
      if (part == null) return null;
      const trimmed = part.trim();
      if (
        !trimmed ||
        /^[+\-×÷/]$/.test(trimmed) ||
        /^(<<|>>)$/.test(trimmed) ||
        /^(XOR|AND|OR|mod|%of)$/.test(trimmed)
      ) {
        return <span key={i}>{part}</span>;
      }
      // Only format plain numbers; otherwise expressions like "5 << 1" would
      // be parsed as just 5 and the " << 1" part would be hidden from display
      if (!/^-?\d+\.?\d*$/.test(trimmed)) return <span key={i}>{part}</span>;
      const num = parseFloat(trimmed);
      if (isNaN(num)) return <span key={i}>{part}</span>;
      return <span key={i}>{formatNumberInBase(num, numberBase)}</span>;
    });
  };

  // Render "a/b" tokens as stacked fractions (for the fractions calculator)
  const formatFractionDisplay = (expr: string): React.ReactNode[] => {
    const parts = expr.split(/(\s+)/);
    return parts.map((part, i) => {
      if (part == null) return null;
      if (part.trim() !== part) return <span key={i}>{part}</span>;
      const fraction = part.match(/^(-?\d+\.?\d*)[\/÷](-?\d+\.?\d*)$/);
      if (fraction) {
        return (
          <span key={i} className="fraction">
            <span className="frac-num">{fraction[1]}</span>
            <span className="frac-line" />
            <span className="frac-den">{fraction[2]}</span>
          </span>
        );
      }
      const partial = part.match(/^(-?\d+\.?\d*)[\/÷]$/);
      if (partial) {
        return (
          <span key={i} className="fraction">
            <span className="frac-num">{partial[1]}</span>
            <span className="frac-line" />
            <span className="frac-den" />
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="calculator-mode">
      <div className="calc-type-selector">
        <button
          className={`calc-type-btn ${calcType === 'normal' ? 'active' : ''}`}
          onClick={() => setCalcType('normal')}
        >
          {t.normal}
        </button>
        <button
          className={`calc-type-btn ${calcType === 'scientific' ? 'active' : ''}`}
          onClick={() => setCalcType('scientific')}
        >
          {t.scientific}
        </button>
        <button
          className={`calc-type-btn ${calcType === 'programmer' ? 'active' : ''}`}
          onClick={() => setCalcType('programmer')}
        >
          {t.programmer}
        </button>
        <button
          className={`calc-type-btn ${calcType === 'fractions' ? 'active' : ''}`}
          onClick={() => setCalcType('fractions')}
        >
          {t.fractions}
        </button>
      </div>

      <div className="calculator-display">
        <div className="equation">{equation}</div>
        <div className="display-value">
          {calcType === 'programmer'
            ? formatProgrammerDisplay(display)
            : calcType === 'fractions'
            ? formatFractionDisplay(display)
            : display}
        </div>
      </div>

      <div className="calculator-buttons">
        {(calcType === 'scientific' || calcType === 'fractions') && (
          <>
            <div className="function-row">
              <button
                className="func-btn"
                onClick={() => handleFunction('square')}
              >
                x²
              </button>
              <button className="func-btn" onClick={handlePower}>
                xʸ
              </button>
              <button
                className="func-btn"
                onClick={() => handleFunction('sqrt')}
              >
                √
              </button>
              <button className="func-btn" onClick={handleRootPress}>
                ˣ√
              </button>
              <button
                className="func-btn"
                onClick={() => handleFunction('sin')}
              >
                sin
              </button>
            </div>
            <div className="function-row">
              <button
                className="func-btn"
                onClick={() => handleFunction('cos')}
              >
                cos
              </button>
              <button className="func-btn" onClick={() => handleFunction('tg')}>
                tg
              </button>
              <button
                className="func-btn"
                onClick={() => handleFunction('ctg')}
              >
                ctg
              </button>
              <button
                className="func-btn"
                onClick={() => handleFunction('log')}
              >
                log
              </button>
              <button className="func-btn" onClick={() => handleFunction('ln')}>
                ln
              </button>
            </div>
            <div className="function-row">
              <button
                className="func-btn"
                onClick={() => handleFunction('asin')}
              >
                asin
              </button>
              <button
                className="func-btn"
                onClick={() => handleFunction('acos')}
              >
                acos
              </button>
              <button
                className="func-btn"
                onClick={() => handleFunction('atg')}
              >
                atg
              </button>
              <button
                className="func-btn"
                onClick={() => handleFunction('actg')}
              >
                actg
              </button>
              <button className="func-btn" onClick={() => handleFunction('pi')}>
                π
              </button>
            </div>
            <div className="function-row">
              <button className="func-btn" onClick={() => handleFunction('e')}>
                e
              </button>
              <button
                className="func-btn"
                onClick={() => handleFunction('fact')}
              >
                x!
              </button>
              <button
                className="func-btn"
                onClick={() => handleOperator('mod')}
              >
                mod
              </button>
              <button
                className="func-btn"
                onClick={() => handleOperator('%of')}
              >
                {t.percentOfBtn || '% от'}
              </button>
              <button
                className="func-btn"
                onClick={() => handleFunction('round')}
              >
                rnd
              </button>
            </div>
          </>
        )}

        {calcType === 'programmer' && (
          <>
            <div className="function-row">
              <button
                className="func-btn"
                onClick={() => handleOperator('XOR')}
              >
                XOR
              </button>
              <button
                className="func-btn"
                onClick={() => handleOperator('AND')}
              >
                AND
              </button>
              <button className="func-btn" onClick={() => handleOperator('OR')}>
                OR
              </button>
              <button
                className="func-btn"
                onClick={() => handleFunction('not')}
              >
                NOT
              </button>
              <button
                className="func-btn"
                onClick={() => handleFunction('lshift')}
              >
                «
              </button>
            </div>
            <div className="function-row">
              <button
                className="func-btn"
                onClick={() => handleFunction('rshift')}
              >
                »
              </button>
              <button
                className={`func-btn ${numberBase === 'dec' ? 'active' : ''}`}
                onClick={() => setNumberBase('dec')}
              >
                DEC
              </button>
              <button
                className={`func-btn ${numberBase === 'bin' ? 'active' : ''}`}
                onClick={() => setNumberBase('bin')}
              >
                BIN
              </button>
              <button
                className={`func-btn ${numberBase === 'oct' ? 'active' : ''}`}
                onClick={() => setNumberBase('oct')}
              >
                OCT
              </button>
              <button
                className={`func-btn ${numberBase === 'hex' ? 'active' : ''}`}
                onClick={() => setNumberBase('hex')}
              >
                HEX
              </button>
            </div>
          </>
        )}

        {calcType === 'normal' && (
          <div className="function-row">
            <button
              className="func-btn"
              onClick={() => handleFunction('square')}
            >
              x²
            </button>
            <button className="func-btn" onClick={() => handleFunction('sqrt')}>
              √
            </button>
            <button className="func-btn" onClick={() => handleFunction('pi')}>
              π
            </button>
            <button className="func-btn" onClick={() => handleFunction('e')}>
              e
            </button>
            <button
              className="func-btn"
              onClick={() => handleFunction('fact')}
            >
              n!
            </button>
          </div>
        )}

        <div className="button-row button-row-top">
          <button className="btn btn-clear" onClick={handleClear}>
            C
          </button>
          <button className="btn btn-backspace" onClick={handleBackspace}>
            ⌫
          </button>
          <button
            className="btn btn-operator"
            onClick={() => handleOperator('(')}
          >
            (
          </button>
          <button
            className="btn btn-operator"
            onClick={() => handleOperator(')')}
          >
            )
          </button>
          <button
            className="btn btn-operator"
            onClick={() => handleOperator(calcType === 'fractions' ? '/' : '÷')}
          >
            {calcType === 'fractions' ? '/' : '÷'}
          </button>
        </div>

        <div className="button-row">
          <button className="btn btn-number" onClick={() => handleNumber('7')}>
            7
          </button>
          <button className="btn btn-number" onClick={() => handleNumber('8')}>
            8
          </button>
          <button className="btn btn-number" onClick={() => handleNumber('9')}>
            9
          </button>
          <button
            className="btn btn-operator"
            onClick={() => handleOperator('×')}
          >
            ×
          </button>
        </div>

        <div className="button-row">
          <button className="btn btn-number" onClick={() => handleNumber('4')}>
            4
          </button>
          <button className="btn btn-number" onClick={() => handleNumber('5')}>
            5
          </button>
          <button className="btn btn-number" onClick={() => handleNumber('6')}>
            6
          </button>
          <button
            className="btn btn-operator"
            onClick={() => handleOperator('-')}
          >
            −
          </button>
        </div>

        <div className="button-row">
          <button className="btn btn-number" onClick={() => handleNumber('1')}>
            1
          </button>
          <button className="btn btn-number" onClick={() => handleNumber('2')}>
            2
          </button>
          <button className="btn btn-number" onClick={() => handleNumber('3')}>
            3
          </button>
          <button
            className="btn btn-operator"
            onClick={() => handleOperator('+')}
          >
            +
          </button>
        </div>

        <div className="button-row">
          <button
            className="btn btn-negative"
            onClick={() => handleFunction('negate')}
          >
            ±
          </button>
          <button className="btn btn-number" onClick={() => handleNumber('0')}>
            0
          </button>
          <button className="btn btn-decimal" onClick={handleDecimal}>
            .
          </button>
          <button className="btn btn-equal" onClick={handleEqual}>
            =
          </button>
        </div>
      </div>

      <button
        className="history-toggle"
        onClick={() => setShowHistory(!showHistory)}
      >
        {showHistory ? t.hideHistory : t.showHistory}
      </button>

      {showHistory && history.length > 0 && (
        <div className="history-panel">
          <h3>{t.history}</h3>
          {history.map((item, index) => (
            <div key={index} className="history-item">
              <span className="history-expression">
                {item.formattedExpression}
              </span>
              <span className="history-result">= {item.result}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
