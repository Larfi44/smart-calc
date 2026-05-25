import React from 'react';
import { CustomSelect } from './CustomSelect';
import type { CurrencyInfo } from '../types';

interface CurrencyProps {
  t: any;
  currencyFrom: string;
  currencyTo: string;
  currencyAmount: string;
  currencyResult: string | null;
  currencyRate: number;
  currencyLoading: boolean;
  currencyList: CurrencyInfo[];
  setCurrencyFrom: (code: string) => void;
  setCurrencyTo: (code: string) => void;
  setCurrencyAmount: (amount: string) => void;
  setCurrencyResult: (result: string | null) => void;
  convertCurrency: () => void;
  getCurrencyName: (code: string) => string;
}

export const Currency: React.FC<CurrencyProps> = ({
  t,
  currencyFrom,
  currencyTo,
  currencyAmount,
  currencyResult,
  currencyRate,
  currencyLoading,
  currencyList,
  setCurrencyFrom,
  setCurrencyTo,
  setCurrencyAmount,
  setCurrencyResult,
  convertCurrency,
  getCurrencyName,
}) => {
  const handleSwap = () => {
    setCurrencyFrom(currencyTo);
    setCurrencyTo(currencyFrom);
    setCurrencyResult(null);
  };

  return (
    <div className="currency-mode">
      <h2>{t.currencyTitle}</h2>

      <div className="currency-inputs">
        <div className="input-group">
          <label>{t.amount}</label>
          <input
            type="number"
            value={currencyAmount}
            onChange={(e) => setCurrencyAmount(e.target.value)}
            placeholder="..."
          />
        </div>
        <div className="input-group">
          <label>{t.from}</label>
          <CustomSelect
            value={currencyFrom}
            onChange={(v) => {
              setCurrencyFrom(v);
              setCurrencyResult(null);
            }}
            options={currencyList.map((c) => ({
              value: c.code,
              label: getCurrencyName(c.code),
            }))}
          />
        </div>
        <div className="swap-container">
          <button className="swap-btn" onClick={handleSwap} title={t.swap}>
            ⇄
          </button>
        </div>
        <div className="input-group">
          <label>{t.to}</label>
          <CustomSelect
            value={currencyTo}
            onChange={(v) => {
              setCurrencyTo(v);
              setCurrencyResult(null);
            }}
            options={currencyList.map((c) => ({
              value: c.code,
              label: getCurrencyName(c.code),
            }))}
          />
        </div>
      </div>

      <button
        className="convert-currency-btn"
        onClick={convertCurrency}
        disabled={currencyLoading}
      >
        {currencyLoading ? t.loading : t.convertCurrency}
      </button>

      {currencyResult === null && <div className="convert-spacer" />}

      {currencyResult !== null && (
        <div className="currency-result">
          <h3>{t.result}:</h3>
          <p>
            {currencyAmount} {getCurrencyName(currencyFrom)} ={' '}
            <strong>{currencyResult}</strong> {getCurrencyName(currencyTo)}
          </p>
          <p className="exchange-rate">
            {t.exchangeRate}: 1 {currencyFrom} = {currencyRate.toFixed(4)}{' '}
            {currencyTo}
          </p>
        </div>
      )}
    </div>
  );
};
