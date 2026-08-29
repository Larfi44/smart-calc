import React, { useState, useEffect } from 'react';

interface TimerProps {
  t: any;
  eventDate1: string;
  eventDate2: string;
  timeDifference: string | null;
  setEventDate1: (date: string) => void;
  setEventDate2: (date: string) => void;
  calculateTimeDifference: () => void;
}

export const Timer: React.FC<TimerProps> = ({
  t,
  eventDate1,
  eventDate2,
  timeDifference,
  setEventDate1,
  setEventDate2,
  calculateTimeDifference,
}) => {
  // Simple countdown timer state
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  // Stop the timer when it reaches zero
  useEffect(() => {
    if (running && remaining === 0) {
      setRunning(false);
    }
  }, [running, remaining]);

  const startTimer = () => {
    const total =
      (parseInt(hours, 10) || 0) * 3600 +
      (parseInt(minutes, 10) || 0) * 60 +
      (parseInt(seconds, 10) || 0);
    if (total <= 0) return;
    setRemaining(total);
    setRunning(true);
  };

  const resetTimer = () => {
    setRunning(false);
    setRemaining(0);
  };

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatTime = (total: number): string => {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  return (
    <div className="timer-mode">
      <h2>{t.timerTitle}</h2>

      <div className="event-input">
        <div className="input-group">
          <label>{t.startDate}</label>
          <input
            type="datetime-local"
            value={eventDate1}
            onChange={(e) => setEventDate1(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>{t.endDate}</label>
          <input
            type="datetime-local"
            value={eventDate2}
            onChange={(e) => setEventDate2(e.target.value)}
          />
        </div>
      </div>
      <button className="add-event-btn" onClick={calculateTimeDifference}>
        {t.calculate}
      </button>

      {timeDifference && (
        <div className="time-difference-result">
          <h3>{t.result}:</h3>
          <p>{timeDifference}</p>
        </div>
      )}

      <div className="timer-countdown-block">
        <h3>{t.timerBlock}</h3>
        {!running && remaining === 0 ? (
          <div className="countdown-inputs">
            <div className="input-group">
              <label>{t.hours}</label>
              <input
                type="number"
                min="0"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>{t.minutes}</label>
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>{t.seconds}</label>
              <input
                type="number"
                min="0"
                max="59"
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
              />
            </div>
            <button className="add-event-btn" onClick={startTimer}>
              {t.timerStart}
            </button>
          </div>
        ) : (
          <div className="countdown-display">
            <p className="countdown-time">{formatTime(remaining)}</p>
            <div className="countdown-buttons">
              <button
                className="preset-btn"
                onClick={() => setRunning(!running)}
              >
                {running ? t.timerPause : t.timerResume}
              </button>
              <button className="preset-btn" onClick={resetTimer}>
                {t.timerReset}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
