import React from 'react';

interface TimerProps {
  t: any;
  eventName: string;
  eventDate1: string;
  eventDate2: string;
  timeDifference: string | null;
  setEventName: (name: string) => void;
  setEventDate1: (date: string) => void;
  setEventDate2: (date: string) => void;
  calculateTimeDifference: () => void;
}

export const Timer: React.FC<TimerProps> = ({
  t, eventName, eventDate1, eventDate2, timeDifference,
  setEventName, setEventDate1, setEventDate2, calculateTimeDifference
}) => {
  return (
    <div className="timer-mode">
      <h2>{t.timerTitle}</h2>
      <div className="event-input">
        <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder={t.eventName} />
      </div>
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
          <h3>{t.result}:</h3>
          <p>{timeDifference}</p>
        </div>
      )}
    </div>
  );
};
