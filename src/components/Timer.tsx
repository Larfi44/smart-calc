import React from 'react';

interface TimerProps {
  t: any;
  eventDate1: string;
  eventDate2: string;
  timeDifference: string | null;
  presetLabel: string | null;
  setEventDate1: (date: string) => void;
  setEventDate2: (date: string) => void;
  calculateTimeDifference: () => void;
  calculatePreset: (key: string) => void;
}

export const Timer: React.FC<TimerProps> = ({
  t, eventDate1, eventDate2, timeDifference, presetLabel,
  setEventDate1, setEventDate2, calculateTimeDifference, calculatePreset
}) => {
  return (
    <div className="timer-mode">
      <h2>{t.timerTitle}</h2>

      <div className="event-input">
        <div className="input-group">
          <label>{t.startDate}</label>
          <input type="datetime-local" value={eventDate1} onChange={(e) => setEventDate1(e.target.value)} />
        </div>
        <div className="input-group">
          <label>{t.endDate}</label>
          <input type="datetime-local" value={eventDate2} onChange={(e) => setEventDate2(e.target.value)} />
        </div>
      </div>
      <button className="add-event-btn" onClick={calculateTimeDifference}>{t.calculate}</button>

      {timeDifference && (
        <div className="time-difference-result">
          <h3>{presetLabel ? `${t.untilEvent} ${presetLabel}` : t.result}:</h3>
          <p>{timeDifference}</p>
        </div>
      )}

      <div className="preset-events">
        <h3>{t.popularEvents}</h3>
        <div className="preset-buttons">
          <button className="preset-btn" onClick={() => calculatePreset('newYear')}>{t.newYear}</button>
          <button className="preset-btn" onClick={() => calculatePreset('christmasCatholic')}>{t.christmasCatholic}</button>
          <button className="preset-btn" onClick={() => calculatePreset('christmasOrthodox')}>{t.christmasOrthodox}</button>
          <button className="preset-btn" onClick={() => calculatePreset('halloween')}>{t.halloween}</button>
        </div>
      </div>
    </div>
  );
};
