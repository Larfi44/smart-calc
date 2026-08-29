import { useState, useCallback } from 'react';

export const useTimer = (t: any) => {
  const [eventDate1, setEventDate1] = useState('');
  const [eventDate2, setEventDate2] = useState('');
  const [timeDifference, setTimeDifference] = useState<string | null>(null);

  const formatDiff = (diff: number): string => {
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${days}${t.daysShort} ${hours}${t.hoursShort} ${minutes}${t.minutesShort} ${seconds}${t.secondsShort}`;
  };

  const calculateTimeDifference = useCallback(() => {
    if (!eventDate1 || !eventDate2) return;
    const date1 = new Date(eventDate1).getTime();
    const date2 = new Date(eventDate2).getTime();
    const diff = Math.abs(date2 - date1);
    setTimeDifference(formatDiff(diff));
  }, [eventDate1, eventDate2, t]);

  const setEventDate1Clear = (date: string) => {
    setEventDate1(date);
    setTimeDifference(null);
  };

  const setEventDate2Clear = (date: string) => {
    setEventDate2(date);
    setTimeDifference(null);
  };

  return {
    eventDate1,
    eventDate2,
    timeDifference,
    setEventDate1: setEventDate1Clear,
    setEventDate2: setEventDate2Clear,
    setTimeDifference,
    calculateTimeDifference,
  };
};
