import React, { useState } from 'react';

interface RandomizerProps {
  t: any;
}

export const Randomizer: React.FC<RandomizerProps> = ({ t }) => {
  const [minValue, setMinValue] = useState('1');
  const [maxValue, setMaxValue] = useState('100');
  const [amount, setAmount] = useState('1');
  const [results, setResults] = useState<string[]>([]);
  const [listMode, setListMode] = useState(false);
  const [listInput, setListInput] = useState('');
  const [listResults, setListResults] = useState<string[]>([]);

  const runRandom = () => {
    const min = parseFloat(minValue);
    const max = parseFloat(maxValue);
    const count = Math.min(parseInt(amount, 10) || 1, 100);

    if (isNaN(min) || isNaN(max) || min > max) return;

    // Detect decimal precision from input values
    const getPrecision = (s: string): number => {
      const dot = s.indexOf('.');
      return dot === -1 ? 0 : s.length - dot - 1;
    };
    const precision = Math.max(getPrecision(minValue), getPrecision(maxValue));

    const nums: string[] = [];
    for (let i = 0; i < count; i++) {
      let r = Math.random() * (max - min) + min;
      if (precision === 0) {
        r = Math.round(r);
        nums.push(r.toString());
      } else {
        nums.push(r.toFixed(precision));
      }
    }
    setResults(nums);
  };

  const runList = () => {
    const items = listInput
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (items.length === 0) return;

    const count = Math.min(parseInt(amount, 10) || 1, 100);
    const picks: string[] = [];
    for (let i = 0; i < count; i++) {
      picks.push(items[Math.floor(Math.random() * items.length)]);
    }
    setListResults(picks);
  };

  const clearAll = () => {
    setResults([]);
    setListResults([]);
  };

  return (
    <div className="randomizer-mode">
      <h2>🎲 {t.randomizerTitle}</h2>

      <div className="randomizer-tabs">
        <button
          className={`randomizer-tab ${!listMode ? 'active' : ''}`}
          onClick={() => setListMode(false)}
        >
          {t.randomizerNumbers}
        </button>
        <button
          className={`randomizer-tab ${listMode ? 'active' : ''}`}
          onClick={() => setListMode(true)}
        >
          {t.randomizerList}
        </button>
      </div>

      <div className="randomizer-inputs">
        {!listMode ? (
          <>
            <div className="randomizer-range">
              <div className="input-group">
                <label>{t.randomizerFrom}</label>
                <input
                  type="number"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>{t.randomizerTo}</label>
                <input
                  type="number"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="input-group">
            <label>{t.randomizerEnterList}</label>
            <textarea
              className="randomizer-textarea"
              value={listInput}
              onChange={(e) => setListInput(e.target.value)}
              placeholder={t.randomizerListPlaceholder}
              rows={5}
            />
          </div>
        )}

        <div className="input-group">
          <label>{t.randomizerAmount}</label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>

      <div className="randomizer-buttons">
        <button
          className="randomizer-run-btn"
          onClick={listMode ? runList : runRandom}
        >
          ▶ {t.randomizerRun}
        </button>
        {(results.length > 0 || listResults.length > 0) && (
          <button className="randomizer-clear-btn" onClick={clearAll}>
            ✕ {t.randomizerClear}
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className="randomizer-results">
          {results.map((r, i) => (
            <div key={i} className="randomizer-result-item">
              {r}
            </div>
          ))}
        </div>
      )}

      {listResults.length > 0 && (
        <div className="randomizer-results">
          {listResults.map((r, i) => (
            <div key={i} className="randomizer-result-item">
              {r}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
