// Vanilla port of src/components/Header.tsx
export const renderHeader = (container, t) => {
  container.className = 'header';
  container.innerHTML = '';
  const h1 = document.createElement('h1');
  h1.textContent = t.title;
  container.appendChild(h1);
};
