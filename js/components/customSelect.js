// Vanilla port of src/components/CustomSelect.tsx
// A small controlled dropdown: build it once with `createSelect`, then drive it
// through `setValue` / `setOptions`.
export const createSelect = ({ options = [], value = '', onChange }) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'custom-select';
  wrapper.innerHTML = `
    <div class="select-trigger">
      <span class="select-value"></span>
      <span class="select-arrow">▼</span>
    </div>
    <div class="select-options"></div>
  `;

  const trigger = wrapper.querySelector('.select-trigger');
  const valueEl = wrapper.querySelector('.select-value');
  const arrow = wrapper.querySelector('.select-arrow');
  const optionsEl = wrapper.querySelector('.select-options');

  let currentOptions = options;
  let currentValue = value;
  let isOpen = false;

  const labelFor = (val) => {
    const option = currentOptions.find((opt) => opt.value === val);
    return option ? option.label : val;
  };

  const handleClickOutside = (event) => {
    if (!wrapper.contains(event.target)) setOpen(false);
  };

  function setOpen(open) {
    isOpen = open;
    arrow.classList.toggle('open', open);
    optionsEl.style.display = open ? '' : 'none';
    if (open) document.addEventListener('mousedown', handleClickOutside);
    else document.removeEventListener('mousedown', handleClickOutside);
  }

  function renderOptions() {
    optionsEl.innerHTML = '';
    currentOptions.forEach((option) => {
      const div = document.createElement('div');
      div.className =
        'select-option' + (option.value === currentValue ? ' selected' : '');
      div.textContent = option.label;
      div.addEventListener('click', () => {
        setOpen(false);
        onChange(option.value);
      });
      optionsEl.appendChild(div);
    });
  }

  function refresh() {
    valueEl.textContent = labelFor(currentValue);
    renderOptions();
  }

  trigger.addEventListener('click', () => setOpen(!isOpen));
  setOpen(false);
  refresh();

  return {
    el: wrapper,
    getValue: () => currentValue,
    setValue: (next) => {
      currentValue = next;
      refresh();
    },
    setOptions: (next) => {
      currentOptions = next;
      refresh();
    },
  };
};
