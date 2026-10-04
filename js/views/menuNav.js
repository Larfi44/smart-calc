// Vanilla port of src/components/MenuNav.tsx
import { el } from '../utils/dom.js';

export const renderMenuNav = (container, { mode, items, onModeChange }) => {
  container.className = 'menu-nav';
  container.innerHTML = '';

  items.forEach((item) => {
    const button = el(
      'button',
      `menu-btn ${mode === item.id ? 'active' : ''}`,
    );
    const icon = el('span', 'menu-icon', item.icon);
    const label = el('span', 'menu-label', item.label);
    button.appendChild(icon);
    button.appendChild(label);
    button.addEventListener('click', () => onModeChange(item.id));
    container.appendChild(button);
  });
};
