// Vanilla port of src/hooks/useTimer.ts + src/components/Timer.tsx
import { el } from '../utils/dom.js';

// Dates live in <App/> via useTimer in the React version, so they survive mode
// switches; the countdown block state is component-local there, so it resets
// every time the timer view is opened — mirrored here.
const state = {
  eventDate1: '',
  eventDate2: '',
  timeDifference: null,
};

let t = null;

const formatDiff = (diff) => {
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `${days}${t.daysShort} ${hours}${t.hoursShort} ${minutes}${t.minutesShort} ${seconds}${t.secondsShort}`;
};

const calculateTimeDifference = () => {
  if (!state.eventDate1 || !state.eventDate2) return;
  const date1 = new Date(state.eventDate1).getTime();
  const date2 = new Date(state.eventDate2).getTime();
  const diff = Math.abs(date2 - date1);
  state.timeDifference = formatDiff(diff);
};

export const mountTimer = (container, ctx) => {
  t = ctx.t;

  const root = el('div', 'timer-mode');
  root.appendChild(el('h2', '', t.timerTitle));

  // --- date difference ------------------------------------------------------
  const eventInput = el('div', 'event-input');

  const date1Group = el('div', 'input-group');
  date1Group.appendChild(el('label', '', t.startDate));
  const date1Input = document.createElement('input');
  date1Input.type = 'datetime-local';
  date1Input.value = state.eventDate1;
  date1Input.addEventListener('input', () => {
    state.eventDate1 = date1Input.value;
    state.timeDifference = null;
    syncResult();
  });
  date1Group.appendChild(date1Input);
  eventInput.appendChild(date1Group);

  const date2Group = el('div', 'input-group');
  date2Group.appendChild(el('label', '', t.endDate));
  const date2Input = document.createElement('input');
  date2Input.type = 'datetime-local';
  date2Input.value = state.eventDate2;
  date2Input.addEventListener('input', () => {
    state.eventDate2 = date2Input.value;
    state.timeDifference = null;
    syncResult();
  });
  date2Group.appendChild(date2Input);
  eventInput.appendChild(date2Group);

  root.appendChild(eventInput);

  const calculateButton = el('button', 'add-event-btn', t.calculate);
  calculateButton.type = 'button';
  calculateButton.addEventListener('click', () => {
    calculateTimeDifference();
    syncResult();
  });
  root.appendChild(calculateButton);

  const resultSlot = el('div', 'time-difference-slot');
  root.appendChild(resultSlot);

  const syncResult = () => {
    resultSlot.innerHTML = state.timeDifference
      ? '<div class="time-difference-result">' +
        `<h3>${t.result}:</h3><p>${state.timeDifference}</p>` +
        '</div>'
      : '';
  };

  // --- countdown timer (component-local in React → resets on every open) ----
  const countdown = {
    hours: '',
    minutes: '',
    seconds: '',
    remaining: 0,
    running: false,
  };
  let intervalId = null;

  const block = el('div', 'timer-countdown-block');
  block.appendChild(el('h3', '', t.timerBlock));

  const numberGroup = (label, min, max) => {
    const group = el('div', 'input-group');
    group.appendChild(el('label', '', label));
    const input = document.createElement('input');
    input.type = 'number';
    input.min = min;
    if (max) input.max = max;
    group.appendChild(input);
    return { group, input };
  };

  const inputsWrap = el('div', 'countdown-inputs');
  const hoursField = numberGroup(t.hours, '0');
  hoursField.input.addEventListener('input', () => {
    countdown.hours = hoursField.input.value;
  });
  const minutesField = numberGroup(t.minutes, '0', '59');
  minutesField.input.addEventListener('input', () => {
    countdown.minutes = minutesField.input.value;
  });
  const secondsField = numberGroup(t.seconds, '0', '59');
  secondsField.input.addEventListener('input', () => {
    countdown.seconds = secondsField.input.value;
  });
  inputsWrap.appendChild(hoursField.group);
  inputsWrap.appendChild(minutesField.group);
  inputsWrap.appendChild(secondsField.group);

  const startButton = el('button', 'add-event-btn', t.timerStart);
  startButton.type = 'button';
  startButton.addEventListener('click', startTimer);
  inputsWrap.appendChild(startButton);

  const displayWrap = el('div', 'countdown-display');
  const timeText = el('p', 'countdown-time');
  displayWrap.appendChild(timeText);

  const displayButtons = el('div', 'countdown-buttons');
  const pauseButton = el('button', 'preset-btn');
  pauseButton.type = 'button';
  pauseButton.addEventListener('click', toggleRunning);
  const resetButton = el('button', 'preset-btn', t.timerReset);
  resetButton.type = 'button';
  resetButton.addEventListener('click', resetTimer);
  displayButtons.appendChild(pauseButton);
  displayButtons.appendChild(resetButton);
  displayWrap.appendChild(displayButtons);

  block.appendChild(inputsWrap);
  block.appendChild(displayWrap);
  root.appendChild(block);

  const pad = (n) => n.toString().padStart(2, '0');
  const formatTime = (total) => {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const stopInterval = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  function tick() {
    countdown.remaining = countdown.remaining > 0 ? countdown.remaining - 1 : 0;
    // Stop the timer when it reaches zero
    if (countdown.remaining === 0) {
      countdown.running = false;
      stopInterval();
    }
    syncCountdown();
  }

  function startTimer() {
    const total =
      (parseInt(countdown.hours, 10) || 0) * 3600 +
      (parseInt(countdown.minutes, 10) || 0) * 60 +
      (parseInt(countdown.seconds, 10) || 0);
    if (total <= 0) return;

    countdown.remaining = total;
    countdown.running = true;
    stopInterval();
    intervalId = setInterval(tick, 1000);
    syncCountdown();
  }

  function toggleRunning() {
    countdown.running = !countdown.running;
    stopInterval();
    if (countdown.running) intervalId = setInterval(tick, 1000);
    syncCountdown();
  }

  function resetTimer() {
    countdown.running = false;
    countdown.remaining = 0;
    stopInterval();
    syncCountdown();
  }

  function syncCountdown() {
    const showInputs = !countdown.running && countdown.remaining === 0;
    inputsWrap.style.display = showInputs ? '' : 'none';
    displayWrap.style.display = showInputs ? 'none' : '';
    timeText.textContent = formatTime(countdown.remaining);
    pauseButton.textContent = countdown.running ? t.timerPause : t.timerResume;
  }

  container.innerHTML = '';
  container.appendChild(root);
  syncResult();
  syncCountdown();

  return {
    el: root,
    refresh: () => {
      syncResult();
      syncCountdown();
    },
    destroy: stopInterval,
  };
};