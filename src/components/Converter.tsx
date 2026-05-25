import React from 'react';
import type { ConverterType } from '../types';
import { CustomSelect } from './CustomSelect';

interface ConverterProps {
  t: any;
  converterType: ConverterType;
  convertValue: string;
  fromUnit: string;
  toUnit: string;
  convertResult: string | null;
  units: any;
  setConvertValue: (value: string) => void;
  setFromUnit: (unit: string) => void;
  setToUnit: (unit: string) => void;
  convertUnits: () => void;
  handleConverterTypeChange: (type: ConverterType) => void;
}

export const Converter: React.FC<ConverterProps> = (props) => {
  const {
    t,
    converterType,
    convertValue,
    fromUnit,
    toUnit,
    convertResult,
    units,
    setConvertValue,
    setFromUnit,
    setToUnit,
    convertUnits,
    handleConverterTypeChange,
  } = props;

  const getUnitName = (unitKey: string): string => {
    const langIndex = t.language === 'ru' ? 0 : 1;
    if (t.units && t.units[unitKey]) {
      return t.units[unitKey][langIndex];
    }
    return unitKey;
  };

  const fromOptions = units[converterType].map((u: string) => ({
    value: u,
    label: getUnitName(u),
  }));
  const toOptions = units[converterType].map((u: string) => ({
    value: u,
    label: getUnitName(u),
  }));

  const handleSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  return (
    <div className="converter-mode">
      <h2>{t.converterTitle}</h2>

      <div className="converter-type-selector">
        <button
          className={`type-btn ${converterType === 'length' ? 'active' : ''}`}
          onClick={() => handleConverterTypeChange('length')}
        >
          {t.converterTypes.length}
        </button>
        <button
          className={`type-btn ${converterType === 'weight' ? 'active' : ''}`}
          onClick={() => handleConverterTypeChange('weight')}
        >
          {t.converterTypes.weight}
        </button>
        <button
          className={`type-btn ${converterType === 'time' ? 'active' : ''}`}
          onClick={() => handleConverterTypeChange('time')}
        >
          {t.converterTypes.time}
        </button>
        <button
          className={`type-btn ${converterType === 'temperature' ? 'active' : ''}`}
          onClick={() => handleConverterTypeChange('temperature')}
        >
          {t.converterTypes.temperature}
        </button>
        <button
          className={`type-btn ${converterType === 'speed' ? 'active' : ''}`}
          onClick={() => handleConverterTypeChange('speed')}
        >
          {t.converterTypes.speed}
        </button>
        <button
          className={`type-btn ${converterType === 'area' ? 'active' : ''}`}
          onClick={() => handleConverterTypeChange('area')}
        >
          {t.converterTypes.area}
        </button>
        <button
          className={`type-btn ${converterType === 'volume' ? 'active' : ''}`}
          onClick={() => handleConverterTypeChange('volume')}
        >
          {t.converterTypes.volume}
        </button>
      </div>

      <div className="converter-inputs">
        <div className="input-group">
          <label>{t.value}</label>
          <input
            type="number"
            value={convertValue}
            onChange={(e) => setConvertValue(e.target.value)}
            placeholder="..."
          />
        </div>
        <div className="input-group">
          <label>{t.from}</label>
          <CustomSelect
            value={fromUnit}
            onChange={setFromUnit}
            options={fromOptions}
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
            value={toUnit}
            onChange={setToUnit}
            options={toOptions}
          />
        </div>
      </div>

      <button className="convert-btn" onClick={convertUnits}>
        {t.convert}
      </button>

      {convertResult === null && <div className="convert-spacer" />}

      {convertResult !== null && (
        <div className="conversion-result">
          <h3>{t.result}:</h3>
          <p>
            {convertValue} {getUnitName(fromUnit)} ={' '}
            <strong>{convertResult}</strong> {getUnitName(toUnit)}
          </p>
        </div>
      )}
    </div>
  );
};
