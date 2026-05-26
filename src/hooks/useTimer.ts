import { useState, useCallback } from 'react';

interface PresetEvent {
  name: string;
  month: number;
  day: number;
}

const presetEvents: Record<string, PresetEvent> = {
  newYear: { name: 'newYear', month: 0, day: 1 },
  christmasCatholic: { name: 'christmasCatholic', month: 11, day: 25 },
  christmasOrthodox: { name: 'christmasOrthodox', month: 0, day: 7 },
  halloween: { name: 'halloween', month: 9, day: 31 },
};

export const useTimer = (t: any) => {
  const [eventDate1, setEventDate1] = useState('');
  const [eventDate2, setEventDate2] = useState('');
  const [timeDifference, setTimeDifference] = useState<string | null>(null);
  const [presetLabel, setPresetLabel] = useState<string | null>(null);

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
    setPresetLabel(null);
  }, [eventDate1, eventDate2, t]);

  const calculatePreset = useCallback((key: string) => {
    const preset = presetEvents[key];
    if (!preset) return;

    const now = new Date();
    let target = new Date(now.getFullYear(), preset.month, preset.day, 0, 0, 0);

    if (target.getTime() < now.getTime()) {
      target = new Date(now.getFullYear() + 1, preset.month, preset.day, 0, 0, 0);
    }

    const diff = target.getTime() - now.getTime();
    setTimeDifference(formatDiff(diff));
    setPresetLabel(t[preset.name] || key);
  }, [t]);

  return {
    eventDate1, eventDate2, timeDifference, presetLabel,
    setEventDate1, setEventDate2, setTimeDifference, setPresetLabel,
    calculateTimeDifference, calculatePreset,
  };
};
