import React, { useState } from 'react';
import type { CalculatorMode } from './types';
import { useSettings } from './hooks/useSettings';
import { useCalculator } from './hooks/useCalculator';
import { useConverter } from './hooks/useConverter';
import { useCurrency } from './hooks/useCurrency';
import { useTimer } from './hooks/useTimer';
import { Header } from './components/Header';
import { MenuNav } from './components/MenuNav';
import { Calculator } from './components/Calculator';
import { Converter } from './components/Converter';
import { Timer } from './components/Timer';
import { Currency } from './components/Currency';
import { Settings } from './components/Settings';
import { translations } from './constants/translations';
import './App.css';

interface MenuItem {
  id: CalculatorMode;
  icon: string;
  label: string;
}

const App: React.FC = () => {
  const { language, setLanguage, theme, setTheme } = useSettings();
  const [mode, setMode] = useState<CalculatorMode>('calculator');
  const [showHistory, setShowHistory] = useState(false);
  
  const t = translations[language];
  
  const calc = useCalculator(t);
  const converter = useConverter();
  const currency = useCurrency(language);
  const timer = useTimer(t);

  const menuItems: MenuItem[] = [
    { id: 'calculator', icon: '🔢', label: t.calculator },
    { id: 'converter', icon: '🔄', label: t.converter },
    { id: 'timer', icon: '⏰', label: t.timer },
    { id: 'currency', icon: '💱', label: t.currency },
    { id: 'settings', icon: '⚙️', label: t.settings },
  ];

  return (
    <div className="app">
      <div className="app-container">
        <Header title={t.title} />
        
        <MenuNav mode={mode} onModeChange={setMode} items={menuItems} />

        <main className="main-content">
          {mode === 'calculator' && (
            <Calculator
              t={t}
              {...calc}
              showHistory={showHistory}
              setShowHistory={setShowHistory}
            />
          )}
          
          {mode === 'converter' && (
            <Converter t={{ ...t, language }} {...converter} />
          )}
          
          {mode === 'timer' && (
            <Timer t={t} {...timer} />
          )}
          
          {mode === 'currency' && (
            <Currency t={t} {...currency} />
          )}
          
          {mode === 'settings' && (
            <Settings t={t} language={language} setLanguage={setLanguage} theme={theme} setTheme={setTheme} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
