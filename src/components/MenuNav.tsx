import React from 'react';
import type { CalculatorMode } from '../types';

interface MenuItem {
  id: CalculatorMode;
  icon: string;
  label: string;
}

interface MenuNavProps {
  mode: CalculatorMode;
  onModeChange: (mode: CalculatorMode) => void;
  items: MenuItem[];
}

export const MenuNav: React.FC<MenuNavProps> = ({ mode, onModeChange, items }) => {
  return (
    <nav className="menu-nav">
      {items.map(btn => (
        <button
          key={btn.id}
          className={`menu-btn ${mode === btn.id ? 'active' : ''}`}
          onClick={() => onModeChange(btn.id)}
        >
          <span className="menu-icon">{btn.icon}</span>
          <span className="menu-label">{btn.label}</span>
        </button>
      ))}
    </nav>
  );
};
